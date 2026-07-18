/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChromaClient, Collection } from "chromadb";
import { pipeline, env } from "@xenova/transformers";

const CHROMA_HOST = process.env.CHROMA_HOST || "localhost";
const CHROMA_PORT = parseInt(process.env.CHROMA_PORT || "8000");
const EMBEDDING_MODEL = "Xenova/all-MiniLM-L6-v2";

let client: ChromaClient | null = null;
let textbookCollection: Collection | null = null;
let embedder: any = null;

async function getEmbedder() {
  if (!embedder) {
    env.allowLocalModels = true;
    embedder = await pipeline("feature-extraction", EMBEDDING_MODEL);
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
  async generate(texts: string[]) {
    return await embed(texts);
  }
}

export async function getChromaClient(): Promise<ChromaClient> {
  if (!client) {
    client = new ChromaClient({
      host: CHROMA_HOST,
      port: CHROMA_PORT,
    });
  }
  return client;
}

export async function getTextbookCollection(): Promise<Collection> {
  if (!textbookCollection) {
    const chroma = await getChromaClient();
    const ef = new CustomEmbeddingFunction();
    textbookCollection = await chroma.getOrCreateCollection({
      name: "antraai_textbooks",
      metadata: { "hnsw:space": "cosine" },
      embeddingFunction: ef as any,
    });
  }
  return textbookCollection;
}

export async function searchTextbooks(
  query: string,
  options: {
    nResults?: number;
    standard?: number;
    subject?: string;
    chapter?: string;
  } = {}
): Promise<{ documents: string[]; metadatas: Record<string, any>[]; distances: number[] }> {
  const collection = await getTextbookCollection();
  const { nResults = 5, standard, subject, chapter } = options;

  const whereFilter: any = {};
  if (standard) whereFilter.standard = standard;
  if (subject) whereFilter.subject = subject;
  if (chapter) whereFilter.chapter = chapter;

  // ChromaDB v3 requires $and when multiple filters are present
  let where: any = undefined;
  const entries = Object.entries(whereFilter);
  if (entries.length === 1) {
    where = { [entries[0][0] as string]: entries[0][1] };
  } else if (entries.length > 1) {
    where = { $and: entries.map(([k, v]) => ({ [k]: v })) };
  }

  const results = await collection.query({
    queryTexts: [query],
    nResults: nResults,
    where: where,
  });

  return {
    documents: (results.documents?.[0] as string[]) || [],
    metadatas: (results.metadatas?.[0] as Record<string, any>[]) || [],
    distances: (results.distances?.[0] as number[]) || [],
  };
}

export async function addTextbookChunks(
  documents: string[],
  metadatas: Record<string, any>[],
  ids: string[]
): Promise<void> {
  const collection = await getTextbookCollection();

  const BATCH_SIZE = 50;
  for (let i = 0; i < documents.length; i += BATCH_SIZE) {
    const batchDocs = documents.slice(i, i + BATCH_SIZE);
    const batchMeta = metadatas.slice(i, i + BATCH_SIZE);
    const batchIds = ids.slice(i, i + BATCH_SIZE);

    await collection.add({
      documents: batchDocs,
      metadatas: batchMeta,
      ids: batchIds,
    });
  }
}
