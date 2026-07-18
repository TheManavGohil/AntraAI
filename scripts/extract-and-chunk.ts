import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, basename } from "path";
import { PDFParse } from "pdf-parse";

const PDF_DIR = join(process.cwd(), "textbooks", "pdfs");
const CHUNKS_DIR = join(process.cwd(), "textbooks", "chunks");
const CHUNK_SIZE = 800;
const CHUNK_OVERLAP = 200;
const MIN_CHUNK_SIZE = 100;

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

function extractStandardSubject(filename: string): { standard: number; subject: string } {
  const lower = filename.toLowerCase();
  let standard = 9;
  let subject = "science";

  if (lower.includes("std10") || lower.includes("std_10")) standard = 10;
  if (lower.includes("algebra")) subject = "algebra";
  else if (lower.includes("geometry")) subject = "geometry";
  else if (lower.includes("science")) subject = "science";

  return { standard, subject };
}

function chunkText(text: string, chunkSize: number, overlap: number): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = start + chunkSize;

    if (end < text.length) {
      const lastPeriod = text.lastIndexOf(".", end);
      const lastNewline = text.lastIndexOf("\n", end);
      const breakPoint = Math.max(lastPeriod, lastNewline);

      if (breakPoint > start + chunkSize * 0.5) {
        end = breakPoint + 1;
      }
    }

    const chunk = text.slice(start, end).trim();
    if (chunk.length >= MIN_CHUNK_SIZE) {
      chunks.push(chunk);
    }

    start = end - overlap;
    if (start >= text.length) break;
  }

  return chunks;
}

function identifyChapter(text: string): { chapter: string; chapter_num: number } {
  const chapterPatterns = [
    /chapter\s+(\d+)[\s:]+(.+?)(?:\n|$)/i,
    /lesson\s+(\d+)[\s:]+(.+?)(?:\n|$)/i,
    /(\d+)\.\s+([A-Z][a-zA-Z\s]+?)(?:\n|$)/,
  ];

  for (const pattern of chapterPatterns) {
    const match = text.match(pattern);
    if (match) {
      return {
        chapter_num: parseInt(match[1]) || 1,
        chapter: match[2].trim(),
      };
    }
  }

  return { chapter: "General", chapter_num: 0 };
}

async function extractAndChunk() {
  if (!existsSync(PDF_DIR)) {
    console.log("No PDF directory found. Run download-textbooks.ts first.");
    console.log(`Expected directory: ${PDF_DIR}`);
    return;
  }

  if (!existsSync(CHUNKS_DIR)) {
    mkdirSync(CHUNKS_DIR, { recursive: true });
  }

  const pdfFiles = readdirSync(PDF_DIR).filter((f) => f.endsWith(".pdf"));
  if (pdfFiles.length === 0) {
    console.log("No PDF files found. Run download-textbooks.ts first.");
    return;
  }

  console.log(`Found ${pdfFiles.length} PDF files to process.\n`);
  const allChunks: Chunk[] = [];

  for (const pdfFile of pdfFiles) {
    const pdfPath = join(PDF_DIR, pdfFile);
    const { standard, subject } = extractStandardSubject(pdfFile);

    console.log(`\nProcessing: ${pdfFile}`);
    console.log(`  Standard: ${standard}th, Subject: ${subject}`);

    try {
      const buffer = readFileSync(pdfPath);
      const parser = new PDFParse({ data: buffer });
      const textResult = await parser.getText();
      const fullText = textResult.text;
      const totalPages = textResult.pages?.length || 0;

      console.log(`  Pages: ${totalPages}`);
      console.log(`  Total text length: ${fullText.length} characters`);

      let currentChapter = "General";
      let currentChapterNum = 0;
      const SECTION_SIZE = 5;

      const pages = textResult.pages || [];
      for (let i = 0; i < pages.length; i += SECTION_SIZE) {
        const sectionPages = pages.slice(i, i + SECTION_SIZE);
        const sectionText = sectionPages.map(p => p.text || "").join("\n");

        const chapterInfo = identifyChapter(sectionText);
        if (chapterInfo.chapter !== "General") {
          currentChapter = chapterInfo.chapter;
          currentChapterNum = chapterInfo.chapter_num;
        }

        const textChunks = chunkText(sectionText, CHUNK_SIZE, CHUNK_OVERLAP);
        const startPage = (sectionPages[0]?.num ?? i) + 1;
        const endPage = startPage + sectionPages.length - 1;

        for (let j = 0; j < textChunks.length; j++) {
          const chunkId = `${basename(pdfFile, ".pdf")}_p${startPage}_${j}`;
          allChunks.push({
            document: textChunks[j],
            metadata: {
              chunk_id: chunkId,
              source_file: pdfFile,
              standard,
              subject,
              chapter: currentChapter,
              chapter_num: currentChapterNum,
              page_start: startPage,
              page_end: endPage,
              chunk_index: j,
            },
          });
        }

        process.stdout.write(`\r  Processing pages ${startPage}-${endPage}/${totalPages}`);
      }

      console.log(`\n  Created chunks from ${pdfFile}`);
      await parser.destroy();
    } catch (error) {
      console.error(`  Error processing ${pdfFile}: ${error}`);
    }
  }

  const outputPath = join(CHUNKS_DIR, "all_chunks.json");
  writeFileSync(outputPath, JSON.stringify(allChunks, null, 2));

  console.log(`\n--- Summary ---`);
  console.log(`Total chunks created: ${allChunks.length}`);
  console.log(`Output: ${outputPath}`);

  const bySubject: Record<string, number> = {};
  const byStandard: Record<number, number> = {};
  for (const chunk of allChunks) {
    bySubject[chunk.metadata.subject] = (bySubject[chunk.metadata.subject] || 0) + 1;
    byStandard[chunk.metadata.standard] = (byStandard[chunk.metadata.standard] || 0) + 1;
  }

  console.log(`\nBy subject:`, bySubject);
  console.log(`By standard:`, byStandard);
}

extractAndChunk().catch(console.error);
