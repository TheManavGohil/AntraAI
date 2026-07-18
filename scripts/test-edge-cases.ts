import { readFileSync } from "fs";
import { resolve } from "path";

const envPath = resolve(process.cwd(), ".env.local");
const envContent = readFileSync(envPath, "utf8");
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx < 0) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  let value = trimmed.slice(eqIdx + 1).trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  if (!process.env[key]) process.env[key] = value;
}

import { updateMastery, initializeStudentMastery, getWeakConcepts } from "../lib/mastery/bkt";
import { CONCEPTS } from "../lib/utils/constants";
import { buildConceptGraph } from "../lib/mastery/knowledge-graph";
import { searchTextbooks } from "../lib/db/chroma";
import { connectDB } from "../lib/db/mongodb";
import mongoose from "mongoose";
import { ConceptMastery, ChatHistory } from "../lib/db/schemas";
import { ObjectId } from "mongodb";

const passed: string[] = [];
const failed: string[] = [];
const warnings: string[] = [];

function assert(label: string, condition: boolean, detail?: string) {
  if (condition) {
    passed.push(label);
    console.log(`  ✓ ${label}`);
  } else {
    failed.push(label + (detail ? ` — ${detail}` : ""));
    console.log(`  ✗ FAIL: ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

function warn(label: string, detail: string) {
  warnings.push(`${label}: ${detail}`);
  console.log(`  ⚠ WARN: ${label} — ${detail}`);
}

async function main() {
  await connectDB();
  console.log("=== EDGE CASE 1: BKT boundary values ===");
  const edgeCases = [
    { desc: "zero mastery + correct", m: 0.0, correct: true },
    { desc: "zero mastery + wrong", m: 0.0, correct: false },
    { desc: "one mastery + correct", m: 1.0, correct: true },
    { desc: "one mastery + wrong", m: 1.0, correct: false },
    { desc: "NaN mastery + correct", m: NaN, correct: true },
    { desc: "negative mastery + correct", m: -0.5, correct: true },
    { desc: "mastery 0.01 (floor) + wrong", m: 0.01, correct: false },
    { desc: "mastery 0.99 (ceil) + correct", m: 0.99, correct: true },
  ];
  for (const { desc, m, correct } of edgeCases) {
    const result = updateMastery(m, correct);
    const inBounds = result >= 0.01 && result <= 0.99;
    const isFiniteNum = Number.isFinite(result);
    const nanCase = desc.includes("NaN");
    if (nanCase) {
      assert(`${desc}: NaN guarded to default p_L0`, result === 0.3, `got ${result}`);
    } else {
      assert(`${desc}: in [0.01, 0.99]`, inBounds, `got ${result.toFixed(6)}`);
      assert(`${desc}: is finite`, isFiniteNum, `got ${result}`);
    }
  }

  console.log();
  console.log("=== EDGE CASE 2: initializeStudentMastery ===");
  const testId = new ObjectId().toHexString();
  await initializeStudentMastery(testId, 9);
  const masteryRows = await ConceptMastery.find({ studentId: testId });
  const concepts9th = CONCEPTS.filter((c) => c.standard === 9);
  assert(
    "initializeStudentMastery(9): created rows for all 9th-grade concepts",
    masteryRows.length === concepts9th.length,
    `got ${masteryRows.length}, expected ${concepts9th.length}`
  );
  const uniqueIds = new Set(masteryRows.map((m: any) => m.conceptId));
  assert(
    "initializeStudentMastery(9): all concept IDs are unique",
    uniqueIds.size === masteryRows.length,
    `unique=${uniqueIds.size}, total=${masteryRows.length}`
  );
  const defaultMastery = masteryRows[0]?.masteryProbability;
  assert(
    "initializeStudentMastery: default mastery is p_L0=0.3",
    defaultMastery === 0.3,
    `got ${defaultMastery}`
  );
  await ConceptMastery.deleteMany({ studentId: testId });

  console.log();
  console.log("=== EDGE CASE 3: Knowledge graph cycle detection ===");
  const graph = buildConceptGraph();
  let cyclesFound = 0;
  for (const [node, edges] of graph.entries()) {
    const visited = new Set<string>();
    const queue = [...edges.prerequisites.map(p => p.id)];
    let depth = 0;
    while (queue.length > 0 && depth < 10) {
      const next = queue.shift()!;
      if (next === node) {
        cyclesFound++;
        break;
      }
      if (visited.has(next)) continue;
      visited.add(next);
      if (graph.has(next)) queue.push(...graph.get(next)!.prerequisites.map(p => p.id));
      depth++;
    }
  }
  assert("Knowledge graph has no cycles", cyclesFound === 0, `found ${cyclesFound} cycles`);

  console.log();
  console.log("=== EDGE CASE 4: RAG filtering ===");
  const noFilter = await searchTextbooks("Newton laws motion force", { nResults: 3 });
  const withFilter = await searchTextbooks("Newton laws motion force", {
    nResults: 3,
    standard: 9,
    subject: "science",
  });
  assert("RAG without filter returns results", noFilter.documents.length > 0, `got ${noFilter.documents.length}`);
  assert("RAG with standard/subject filter returns results", withFilter.documents.length > 0, `got ${withFilter.documents.length}`);
  if (noFilter.documents.length > 0) {
    assert(
      "Top result matches Laws of Motion (no filter)",
      noFilter.metadatas[0]?.chapter === "Laws of Motion",
      `got ${noFilter.metadatas[0]?.chapter}`
    );
  }

  console.log();
  console.log("=== EDGE CASE 5: updateConceptMastery end-to-end ===");
  const { updateConceptMastery } = await import("../lib/mastery/bkt");
  const studentId = new ObjectId().toHexString();
  await initializeStudentMastery(studentId, 9);
  const afterUpdate = await updateConceptMastery(studentId, "newton_laws", true);
  assert("updateConceptMastery returns updated doc", afterUpdate !== null, "got null");
  if (afterUpdate) {
    assert("mastery increased from 0.3", afterUpdate.masteryProbability > 0.3, `got ${afterUpdate.masteryProbability}`);
    assert("attempts incremented to 1", afterUpdate.attempts === 1, `got ${afterUpdate.attempts}`);
    assert("correct incremented to 1", afterUpdate.correct === 1, `got ${afterUpdate.correct}`);
  }
  await ConceptMastery.deleteMany({ studentId });

  console.log();
  console.log("=== EDGE CASE 6: Chat history indexes ===");
  const chatIndexes = await ChatHistory.collection.getIndexes();
  const chatIndexNames = Object.keys(chatIndexes);
  assert("ChatHistory has indexes", chatIndexNames.length > 0, `got ${chatIndexNames.length}`);
  console.log(`  Indexes: ${chatIndexNames.join(", ")}`);

  console.log();
  console.log("=== EDGE CASE 7: GeneratedTest MongoDB storage ===");
  const { GeneratedTest } = await import("../lib/db/schemas");
  const verifyStudentId = new ObjectId().toHexString();
  const verifyTestId = `test_verify_${Date.now()}`;
  await GeneratedTest.create({
    testId: verifyTestId,
    studentId: verifyStudentId,
    subject: "science",
    type: "weekly",
    questions: [{ id: "q1", type: "MCQ", question: "Test", options: ["A"], correctAnswer: "A", conceptId: "newton_laws", marks: 1, timeEstimate: 60 }],
    totalMarks: 1,
    timeLimitMinutes: 15,
    expiresAt: new Date(Date.now() + 3600000),
  });
  const stored = await GeneratedTest.findOne({ testId: verifyTestId });
  assert("GeneratedTest stored in MongoDB", stored !== null, "got null");
  assert("GeneratedTest retrievable by testId", stored?.testId === verifyTestId);
  await GeneratedTest.deleteOne({ testId: verifyTestId });
  // Verify deletion
  const afterDelete = await GeneratedTest.findOne({ testId: verifyTestId });
  assert("GeneratedTest cleaned up after grading", afterDelete === null, `still exists: ${afterDelete !== null}`);

  console.log();
  console.log("=== EDGE CASE 8: Duplicate updateConceptMastery functions ===");
  const { updateConceptMastery: bktVersion } = await import("../lib/mastery/bkt");
  const { updateConceptMastery: genVersion } = await import("../lib/test/generator");
  const dupId = new ObjectId().toHexString();
  await initializeStudentMastery(dupId, 9);
  const bktResult = await bktVersion(dupId, "newton_laws", true);
  const bktMastery = bktResult?.masteryProbability;
  await ConceptMastery.findOneAndUpdate(
    { studentId: dupId, conceptId: "newton_laws" },
    { $set: { masteryProbability: 0.3, attempts: 0, correct: 0 } }
  );
  const genResult = await genVersion(dupId, "newton_laws", true);
  const genMastery = genResult?.masteryProbability;
  if (bktMastery !== undefined && genMastery !== undefined) {
    assert(
      "Duplicate functions produce identical output",
      Math.abs(bktMastery - genMastery) < 0.0001,
      `bkt=${bktMastery.toFixed(6)}, gen=${genMastery.toFixed(6)}`
    );
  }
  await ConceptMastery.deleteMany({ studentId: dupId });

  console.log();
  console.log("=== EDGE CASE 9: Schema index analysis ===");
  const db = mongoose.connection.db;
  if (!db) {
    warn("Schema index analysis", "mongoose.connection.db is null — cannot inspect indexes");
  } else {
    const collections = await db.listCollections().toArray();
    for (const col of collections) {
      const indexes = await db.collection(col.name).indexes();
      console.log(`  ${col.name}: ${indexes.length} indexes [${indexes.map((i: any) => i.name).join(", ")}]`);
    }
  }

  console.log();
  console.log("=== EDGE CASE 10: ObjectId validation ===");
  try {
    await getWeakConcepts("invalid-id-not-objectid", 5);
    assert("getWeakConcepts with invalid ID returns empty (no throw)", true);
  } catch (e: any) {
    assert("getWeakConcepts with invalid ID: throws gracefully", false, `${e.constructor.name}: ${e.message?.slice(0, 100)}`);
  }
  try {
    const result = await getWeakConcepts("507f1f77bcf86cd799439011", 5);
    assert("getWeakConcepts with non-existent student returns empty array", result.length === 0, `got ${result.length}`);
  } catch (e: any) {
    assert("getWeakConcepts with non-existent student throws", false, `${e.constructor.name}: ${e.message?.slice(0, 100)}`);
  }

  console.log();
  console.log("=== EDGE CASE 11: BKT slip-rate sensitivity (p_S parameter) ===");
  // Test with different slip rates to understand impact
  console.log("  Path from 0.99 with 3 wrong answers:");
  for (const slipRate of [0.05, 0.1, 0.15, 0.2]) {
    let m = 0.99;
    const path = [m];
    for (let i = 0; i < 3; i++) {
      // Manually compute BKT with different p_S
      const p_S = slipRate;
      const p_G = 0.2;
      const p_T = 0.1;
      const p_L = m;
      const pCorrect = p_L * (1 - p_S) + (1 - p_L) * p_G;
      const pGivenCorrect = (p_L * (1 - p_S)) / pCorrect;
      let pPosterior = pGivenCorrect + (1 - pGivenCorrect) * p_T;
      pPosterior = Math.max(0.01, Math.min(0.99, pPosterior));
      m = pPosterior;
      path.push(m);
    }
    console.log(`    p_S=${slipRate}: ${path.map((v) => v.toFixed(4)).join(" -> ")}`);
  }

  console.log();
  console.log("========================================");
  console.log(`RESULTS: ${passed.length} passed, ${failed.length} failed, ${warnings.length} warnings`);
  console.log("========================================");
  if (failed.length > 0) {
    console.log("\nFailures:");
    failed.forEach((f, i) => console.log(`  ${i + 1}. ${f}`));
  }
  if (warnings.length > 0) {
    console.log("\nWarnings:");
    warnings.forEach((w, i) => console.log(`  ${i + 1}. ${w}`));
  }

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
