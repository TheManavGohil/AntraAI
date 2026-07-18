/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChromaClient } from "chromadb";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { pipeline, env } from "@xenova/transformers";

env.allowLocalModels = true;

const CHROMA_HOST = process.env.CHROMA_HOST || "localhost";
const CHROMA_PORT = parseInt(process.env.CHROMA_PORT || "8000");
const COLLECTION_NAME = "antraai_textbooks";
const CHUNKS_FILE = join(process.cwd(), "textbooks", "chunks", "all_chunks.json");

let embedder: any = null;

async function getEmbedder() {
  if (!embedder) {
    embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  }
  return embedder;
}

async function embed(texts: string[]): Promise<number[][]> {
  const pipe = await getEmbedder();
  const embeddings: number[][] = [];
  for (const text of texts) {
    const output = await pipe(text, { pooling: "mean", normalize: true });
    embeddings.push(Array.from(output.data) as number[]);
  }
  return embeddings;
}

class CustomEmbeddingFunction {
  async generate(texts: string[]) { return await embed(texts); }
}

interface ChunkMetadata {
  chunk_id: string;
  source_file: string;
  standard: number;
  subject: string;
  chapter: string;
  chapter_num: number;
  page_start: number;
  page_end: number;
  chunk_index: number;
}

interface Chunk {
  document: string;
  metadata: ChunkMetadata;
}

async function embedAndStore() {
  if (!existsSync(CHUNKS_FILE)) {
    console.log("No chunks file found. Run extract-and-chunk.ts first.");
    return;
  }

  const chunks: Chunk[] = JSON.parse(readFileSync(CHUNKS_FILE, "utf-8"));
  console.log(`Loaded ${chunks.length} chunks from ${CHUNKS_FILE}`);

  console.log("\nLoading embedding model...");
  const client = new ChromaClient({ host: CHROMA_HOST, port: CHROMA_PORT });
  const ef = new CustomEmbeddingFunction();
  const collection = await client.getOrCreateCollection({
    name: COLLECTION_NAME,
    metadata: { "hnsw:space": "cosine" },
    embeddingFunction: ef as any,
  });

  const existing = await collection.get({});
  const existingIds = new Set(existing.ids);
  console.log(`Existing documents in collection: ${existingIds.size}`);

  const newChunks = chunks.filter((c) => !existingIds.has(c.metadata.chunk_id));
  console.log(`New chunks to add: ${newChunks.length}`);

  if (newChunks.length === 0) {
    console.log("No new chunks to add. Collection is up to date.");
    return;
  }

  const BATCH_SIZE = 10;
  let added = 0;

  for (let i = 0; i < newChunks.length; i += BATCH_SIZE) {
    const batch = newChunks.slice(i, i + BATCH_SIZE);
    const ids = batch.map((c) => c.metadata.chunk_id);
    const documents = batch.map((c) => c.document);
    const metadatas: Record<string, any>[] = batch.map((c) => ({ ...c.metadata }));

    try {
      await collection.add({ documents, metadatas, ids });
      added += batch.length;
      console.log(`  Added batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(newChunks.length / BATCH_SIZE)} (${added}/${newChunks.length})`);
    } catch (error) {
      console.error(`  Error adding batch: ${error}`);
      for (const chunk of batch) {
        try {
          await collection.add({
            documents: [chunk.document],
            metadatas: [{ ...chunk.metadata }],
            ids: [chunk.metadata.chunk_id],
          });
          added++;
        } catch (e) {
          console.error(`  Skipping chunk ${chunk.metadata.chunk_id}: ${e}`);
        }
      }
    }
  }

  console.log(`\n--- Summary ---`);
  console.log(`Added: ${added}/${newChunks.length} chunks`);
  console.log(`Total in collection: ${existingIds.size + added}`);

  console.log("\n--- Verification Query ---");
  const results = await collection.query({
    queryTexts: ["What is Newton's First Law of Motion?"],
    nResults: 3,
  });

  console.log("Query: 'What is Newton's First Law of Motion?'");
  results.documents[0]?.forEach((doc, i) => {
    const meta = results.metadatas?.[0]?.[i];
    console.log(`  ${i + 1}. [Std ${meta?.standard} ${meta?.subject}] ${(doc ?? "").substring(0, 100)}...`);
  });
}

embedAndStore().catch(console.error);
