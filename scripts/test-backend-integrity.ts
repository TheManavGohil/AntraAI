// Backend Integrity Test Suite — Step 2 & 3
// Tests BKT logic, mastery boundaries, test-generation selection, and personalization isolation.
// Run with: npx tsx scripts/test-backend-integrity.ts

// Load env vars BEFORE any imports (CJS imports execute during resolution)
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

import { updateMastery } from "../lib/mastery/bkt";
import { CONCEPTS } from "../lib/utils/constants";
import { getConceptsForTest, computeSubjectMastery, updateConceptMastery } from "../lib/mastery/bkt";
import { connectDB } from "../lib/db/mongodb";
import { ConceptMastery, Student, ChatHistory } from "../lib/db/schemas";
import { buildConceptGraph, getPrerequisiteChain, getNextConcepts } from "../lib/mastery/knowledge-graph";
import { searchTextbooks } from "../lib/db/chroma";
import { updateConceptMastery as bktUpdate } from "../lib/mastery/bkt";
import { updateConceptMastery as genUpdate } from "../lib/test/generator";

let passed = 0;
let failed = 0;
let bugs: string[] = [];

(async () => {

function assert(condition: boolean, msg: string) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${msg}`);
  } else {
    failed++;
    bugs.push(msg);
    console.log(`  ✗ FAIL: ${msg}`);
  }
}

function assertRange(val: number, min: number, max: number, msg: string) {
  assert(val >= min && val <= max, `${msg} — got ${val}, expected [${min}, ${max}]`);
}

// ============================================================
// TEST 1: BKT updateMastery — mathematical correctness
// ============================================================
console.log("\n=== TEST 1: BKT updateMastery (pure math) ===");

// Test 1a: Correct answer should increase mastery
const start = 0.3;
const afterCorrect = updateMastery(start, true);
const afterWrong = updateMastery(start, false);
assert(afterCorrect > start, `Correct answer from 0.3 should increase mastery: ${start} -> ${afterCorrect}`);
assert(afterWrong < start, `Wrong answer from 0.3 should decrease mastery: ${start} -> ${afterWrong}`);

// Test 1b: Boundary conditions
const lowMaster = 0.05;
const afterWrongLow = updateMastery(lowMaster, false);
assertRange(afterWrongLow, 0.01, 1.0, `Wrong answer at 0.05 should not go below 0.01`);
assert(afterWrongLow >= 0.01, `Mastery floor should be 0.01, got ${afterWrongLow}`);

const highMaster = 0.95;
const afterCorrectHigh = updateMastery(highMaster, true);
assertRange(afterCorrectHigh, 0.01, 0.99, `Correct answer at 0.95 should not exceed 0.99`);
assert(afterCorrectHigh <= 0.99, `Mastery ceiling should be 0.99, got ${afterCorrectHigh}`);

// Test 1c: Oscillation test — 5 right then 3 wrong
let mastery = 0.3;
const history: number[] = [mastery];
for (let i = 0; i < 5; i++) {
  mastery = updateMastery(mastery, true);
  history.push(mastery);
}
const after5Correct = mastery;
for (let i = 0; i < 3; i++) {
  mastery = updateMastery(mastery, false);
  history.push(mastery);
}
const after3Wrong = mastery;
console.log(`  Mastery path: ${history.map(v => v.toFixed(4)).join(" -> ")}`);
assert(after5Correct > 0.3, `After 5 correct from 0.3, should be > 0.3: got ${after5Correct.toFixed(4)}`);
assert(after3Wrong < after5Correct, `After 3 wrong, should decrease from peak: ${after5Correct.toFixed(4)} -> ${after3Wrong.toFixed(4)}`);
assert(after3Wrong > 0.3, `After 5 right + 3 wrong, net should still be positive: ${after3Wrong.toFixed(4)}`);
assertRange(after3Wrong, 0.01, 0.99, `Final mastery should be in [0.01, 0.99]`);

// Test 1d: Extreme oscillation — 100 alternations
mastery = 0.5;
for (let i = 0; i < 100; i++) {
  mastery = updateMastery(mastery, i % 2 === 0);
}
assertRange(mastery, 0.01, 0.99, `100 alternations from 0.5 should stay in bounds: got ${mastery.toFixed(4)}`);

// Test 1e: Can mastery reach exactly 0 or 1?
mastery = 0.01;
for (let i = 0; i < 50; i++) mastery = updateMastery(mastery, false);
assert(mastery >= 0.01, `Mastery should never reach 0: got ${mastery.toFixed(8)}`);

mastery = 0.99;
for (let i = 0; i < 50; i++) mastery = updateMastery(mastery, true);
assert(mastery <= 0.99, `Mastery should never reach 1: got ${mastery.toFixed(8)}`);

// Test 1f: Default params check — p_G = 0.2 means guessing gives 20% chance of being "correct"
// A student who doesn't know (mastery=0) answering correctly: 
// P(correct) = 0*(1-0.1) + 1*0.2 = 0.2
// P(known|correct) = (0*(1-0.1))/0.2 = 0
// Updated mastery = 0 + (1-0)*0.1 = 0.1
const zeroMastery = updateMastery(0, true);
assert(Math.abs(zeroMastery - 0.1) < 0.001, `Zero mastery + correct should go to ~0.1 (learning only): got ${zeroMastery.toFixed(4)}`);

// ============================================================
// TEST 2: Test-concept selection logic
// ============================================================
console.log("\n=== TEST 2: getConceptsForTest — difficulty adaptation ===");

await connectDB();

// Create two test students
const student1 = await Student.create({
  name: "Weak Student",
  class: 9,
  schoolName: "Test School",
  parentPhone: "9999999991",
  consentGiven: true,
  consentDate: new Date(),
});
const student2 = await Student.create({
  name: "Strong Student",
  class: 9,
  schoolName: "Test School",
  parentPhone: "9999999992",
  consentGiven: true,
  consentDate: new Date(),
});

console.log(`  Created test students: ${student1._id}, ${student2._id}`);

// Make student1 weak in science
const sciConcepts = CONCEPTS.filter(c => c.subject === "science" && c.standard === 9).slice(0, 5);
for (const concept of sciConcepts) {
  for (let i = 0; i < 5; i++) {
    await updateConceptMastery(student1._id.toString(), concept.id, false);
  }
}

// Make student2 strong in science
for (const concept of sciConcepts) {
  for (let i = 0; i < 10; i++) {
    await updateConceptMastery(student2._id.toString(), concept.id, true);
  }
}

// Check their mastery levels
const weakProfile = await computeSubjectMastery(student1._id.toString(), "science");
const strongProfile = await computeSubjectMastery(student2._id.toString(), "science");
console.log(`  Weak student mastery: ${weakProfile.toFixed(4)}`);
console.log(`  Strong student mastery: ${strongProfile.toFixed(4)}`);
assert(weakProfile < strongProfile, `Weak student (${weakProfile.toFixed(4)}) should have lower mastery than strong (${strongProfile.toFixed(4)})`);

// Test getConceptsForTest for both
const weakTestConcepts = await getConceptsForTest(student1._id.toString(), "science", 10);
const strongTestConcepts = await getConceptsForTest(student2._id.toString(), "science", 10);

console.log(`  Weak student priorities: ${weakTestConcepts.map(c => c.priority).join(", ")}`);
console.log(`  Strong student priorities: ${strongTestConcepts.map(c => c.priority).join(", ")}`);

// Count weak priorities
const weakCount1 = weakTestConcepts.filter(c => c.priority === "weak").length;
const weakCount2 = strongTestConcepts.filter(c => c.priority === "weak").length;
assert(weakCount1 >= weakCount2, `Weak student should have >= weak-priority concepts: ${weakCount1} vs ${weakCount2}`);

// ============================================================
// TEST 3: Personalization leakage — do students leak into each other?
// ============================================================
console.log("\n=== TEST 3: Personalization isolation ===");

// Student1 has wrong answers for trig
await updateConceptMastery(student1._id.toString(), "std9_geo_ch8_trig_ratios", false);
await updateConceptMastery(student1._id.toString(), "std9_geo_ch8_trig_ratios", false);
await updateConceptMastery(student1._id.toString(), "std9_geo_ch8_trig_ratios", false);

// Student2 should NOT have any mastery record for trig (or default)
const student2Trig = await ConceptMastery.findOne({
  studentId: student2._id.toString(),
  conceptId: "std9_geo_ch8_trig_ratios",
});
assert(
  !student2Trig || student2Trig.attempts === 0,
  `Student2 should not have trig attempts from student1: got ${student2Trig?.attempts ?? 0} attempts`
);

// Now update student2 for trig
await updateConceptMastery(student2._id.toString(), "std9_geo_ch8_trig_ratios", true);
const student2TrigAfter = await ConceptMastery.findOne({
  studentId: student2._id.toString(),
  conceptId: "std9_geo_ch8_trig_ratios",
});
const student1TrigAfter = await ConceptMastery.findOne({
  studentId: student1._id.toString(),
  conceptId: "std9_geo_ch8_trig_ratios",
});
assert(
  student2TrigAfter?.masteryProbability !== student1TrigAfter?.masteryProbability,
  `Students should have different mastery for trig: student1=${student1TrigAfter?.masteryProbability.toFixed(4)}, student2=${student2TrigAfter?.masteryProbability.toFixed(4)}`
);

// ============================================================
// TEST 4: Duplicate updateConceptMastery — FIXED: generator.ts re-exports from bkt.ts
// ============================================================
console.log("\n=== TEST 4: updateConceptMastery consolidation ===");

const sameFn = bktUpdate === genUpdate;
assert(sameFn, "generator.ts re-exports bkt.ts updateConceptMastery (single source of truth)");
if (!sameFn) {
  bugs.push("generator.ts updateConceptMastery is still separate from bkt.ts");
}

// ============================================================
// TEST 5: getConceptsForTest distribution logic
// ============================================================
console.log("\n=== TEST 5: getConceptsForTest distribution correctness ===");

// With no mastery records, all concepts should default to p_L0 = 0.3
const freshStudent = await Student.create({
  name: "Fresh Student",
  class: 9,
  schoolName: "Test School",
  parentPhone: "9999999993",
  consentGiven: true,
  consentDate: new Date(),
});

const freshConcepts = await getConceptsForTest(freshStudent._id.toString(), "science", 15);
console.log(`  Fresh student got ${freshConcepts.length} concepts (requested 15)`);

// All should be default mastery = 0.3
const allDefault = freshConcepts.every(c => Math.abs(c.mastery - 0.3) < 0.01);
assert(allDefault, `Fresh student should have all concepts at default 0.3 mastery`);

// Check distribution — when everything is equal, distribution should be roughly even
const weakP = freshConcepts.filter(c => c.priority === "weak").length;
const reviewP = freshConcepts.filter(c => c.priority === "review").length;
const strongP = freshConcepts.filter(c => c.priority === "strong").length;
console.log(`  Distribution: weak=${weakP}, review=${reviewP}, strong=${strongP}`);

// The function sorts by mastery (all equal), so first N go to weak, middle to review, rest to strong
// With all equal, it's basically first-come-first-served

// ============================================================
// TEST 6: Knowledge-graph prerequisite chain
// ============================================================
console.log("\n=== TEST 6: Knowledge graph functions ===");

const graph = buildConceptGraph(9);
assert(graph.size > 0, `Graph for 9th should have concepts: got ${graph.size}`);

// Check that prerequisite chains work
const chain = getPrerequisiteChain("std9_sci_ch1_equations_motion");
console.log(`  Chain for Equations of Motion: ${chain.map(c => c.name).join(" -> ")}`);
assert(chain.length >= 3, `Equations of Motion should have >= 3 prereqs: got ${chain.length}`);

// getNextConcepts — with nothing mastered, should return concepts with no prerequisites
const next = getNextConcepts([], "science", 9);
const noPrereqConcepts = CONCEPTS.filter(c => c.subject === "science" && c.standard === 9 && c.prerequisites.length === 0);
assert(next.length === noPrereqConcepts.length, `Next concepts with nothing mastered should be those with no prereqs: ${next.length} vs ${noPrereqConcepts.length}`);

// ============================================================
// TEST 7: RAG retrieval correctness — specific topic matching
// ============================================================
console.log("\n=== TEST 7: RAG retrieval correctness ===");

const tests = [
  { query: "Newton's Third Law of Motion", expectedChapter: "Laws of Motion", desc: "Newton's Third Law" },
  { query: "Ohm's law voltage current resistance", expectedChapter: "Current Electricity", desc: "Ohm's Law" },
  { query: "kinetic energy formula mass velocity", expectedChapter: "Work and Energy", desc: "Kinetic Energy" },
  { query: "pH scale acids bases", expectedChapter: "Acids Bases and Salts", desc: "pH Scale" },
  { query: "quadratic equation discriminant", expectedChapter: "Quadratic Equations", desc: "Quadratic Equations" },
  { query: "arithmetic progression sum", expectedChapter: "Arithmetic Progression", desc: "AP Sum" },
  { query: "Pythagoras theorem right triangle", expectedChapter: "Pythagoras Theorem", desc: "Pythagoras" },
  { query: "trigonometric identities sin cos", expectedChapter: "Trigonometry", desc: "Trig Identities" },
  { query: "Newton's law of universal gravitation", expectedChapter: "Gravitation", desc: "Gravitation" },
  { query: "refraction of light snell's law", expectedChapter: "Refraction of Light", desc: "Refraction" },
  { query: "mole concept avogadro", expectedChapter: "Measurement of Matter", desc: "Mole Concept" },
  { query: "sets union intersection venn", expectedChapter: "Sets", desc: "Sets" },
];

let ragCorrect = 0;
let ragTotal = tests.length;

for (const test of tests) {
  const results = await searchTextbooks(test.query, { nResults: 3 });
  const topChapter = results.metadatas[0]?.chapter;
  const match = topChapter === test.expectedChapter;
  if (match) ragCorrect++;
  const icon = match ? "✓" : "✗";
  console.log(`  ${icon} "${test.desc}": expected=${test.expectedChapter}, got=${topChapter ?? "none"} (dist=${results.distances[0]?.toFixed(4) ?? "?"})`);
  if (!match) {
    console.log(`    Top 3 chapters: ${results.metadatas.map(m => m.chapter).join(", ")}`);
    console.log(`    Top 3 docs: ${results.documents.map(d => d.substring(0, 80) + "...").join("\n              ")}`);
  }
}

assert(ragCorrect >= tests.length * 0.7, `RAG retrieval accuracy: ${ragCorrect}/${ragTotal} (${Math.round(ragCorrect/ragTotal*100)}%) — need >= 70%`);
console.log(`\n  RAG accuracy: ${ragCorrect}/${ragTotal} (${Math.round(ragCorrect/ragTotal*100)}%)`);

// ============================================================
// TEST 8: RAG filtering — does standard/subject filter work?
// ============================================================
console.log("\n=== TEST 8: RAG filtering by standard/subject ===");

const filteredResults = await searchTextbooks("energy", { nResults: 5, standard: 10 });
const allStd10 = filteredResults.metadatas.every(m => m.standard === 10);
assert(allStd10, `Standard=10 filter: all results should be standard 10, but got: ${filteredResults.metadatas.map(m => m.standard).join(", ")}`);

const filteredSubject = await searchTextbooks("equation", { nResults: 5, subject: "algebra" });
const allAlgebra = filteredSubject.metadatas.every(m => m.subject === "algebra");
assert(allAlgebra, `Subject=algebra filter: all results should be algebra, but got: ${filteredSubject.metadatas.map(m => m.subject).join(", ")}`);

// ============================================================
// TEST 9: In-memory testStore — loss on restart, concurrency
// ============================================================
console.log("\n=== TEST 9: In-memory testStore vulnerabilities ===");
// This is a LOGICAL AUDIT, not a runtime test
console.log(`  FINDING: testStore is a module-level Map in app/api/test/generate/route.ts`);
console.log(`  FINDING: Tests are stored in-memory — lost on server restart or deployment`);
console.log(`  FINDING: In serverless (Vercel), each request may get a fresh process — testStore will be empty`);
console.log(`  FINDING: Only 100 tests kept — older ones silently deleted`);
console.log(`  FINDING: Race condition — test generated, then grade request hits a different instance`);
console.log(`  SEVERITY: CRITICAL for production, non-functional on Vercel`);
failed++;
bugs.push("CRITICAL: In-memory testStore — tests lost on restart, non-functional on Vercel serverless");

// ============================================================
// TEST 10: Chat history — does the GET endpoint return history for the right student?
// ============================================================
console.log("\n=== TEST 10: Chat history isolation ===");

// Create chat entries for student1
await ChatHistory.create({
  studentId: student1._id.toString(),
  role: "user",
  content: "What is Newton's Third Law?",
  subject: "science",
});
await ChatHistory.create({
  studentId: student1._id.toString(),
  role: "assistant",
  content: "For every action, there is an equal and opposite reaction.",
  subject: "science",
});

// Create chat entries for student2
await ChatHistory.create({
  studentId: student2._id.toString(),
  role: "user",
  content: "What is the quadratic formula?",
  subject: "algebra",
});

const student1History = await ChatHistory.find({ studentId: student1._id.toString() });
const student2History = await ChatHistory.find({ studentId: student2._id.toString() });

assert(student1History.length === 2, `Student1 should have 2 chat entries: got ${student1History.length}`);
assert(student2History.length === 1, `Student2 should have 1 chat entry: got ${student2History.length}`);
assert(
  student2History[0].content.includes("quadratic"),
  `Student2 chat should be about quadratic formula, got: "${student2History[0].content.substring(0, 50)}"`
);

// ============================================================
// CLEANUP
// ============================================================
console.log("\n=== CLEANUP ===");
await Student.deleteMany({ _id: { $in: [student1._id, student2._id, freshStudent._id] } });
await ConceptMastery.deleteMany({ studentId: { $in: [student1._id.toString(), student2._id.toString(), freshStudent._id.toString()] } });
await ChatHistory.deleteMany({ studentId: { $in: [student1._id.toString(), student2._id.toString()] } });
console.log("  Cleaned up test data");

// ============================================================
// SUMMARY
// ============================================================
console.log("\n" + "=".repeat(60));
console.log("RESULTS: " + passed + " passed, " + failed + " issues found");
console.log("=".repeat(60));
if (bugs.length > 0) {
  console.log("\nIssues:");
  bugs.forEach((b, i) => console.log(`  ${i + 1}. ${b}`));
}

})().catch(e => { console.error("FATAL:", e); process.exit(1); });
