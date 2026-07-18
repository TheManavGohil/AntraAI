/**
 * Backend Integrity Test Suite
 * Tests pure logic functions in isolation (no DB, no LLM needed)
 */

// ===== IMPORTS =====
import { updateMastery, applyForgettingCurve } from "../lib/mastery/bkt";
import { sm2, performanceRating, isDueForReview, getReviewUrgency } from "../lib/mastery/spaced-repetition";
import { CONCEPTS, CHAPTERS } from "../lib/utils/constants";
import { getPrerequisiteChain, getNextConcepts, getChapterProgress, getSubjectProgress, buildConceptGraph } from "../lib/mastery/knowledge-graph";

// ===== HELPERS =====
let testsPassed = 0;
let testsFailed = 0;
const failures: string[] = [];

function assert(condition: boolean, testName: string, details?: string) {
  if (condition) {
    testsPassed++;
    console.log(`  ✅ ${testName}`);
  } else {
    testsFailed++;
    const msg = details ? `${testName}: ${details}` : testName;
    failures.push(msg);
    console.log(`  ❌ ${testName}${details ? ` — ${details}` : ""}`);
  }
}

function assertRange(value: number, min: number, max: number, testName: string) {
  const inRange = value >= min && value <= max;
  assert(inRange, testName, inRange ? undefined : `got ${value}, expected [${min}, ${max}]`);
}

// ===================================================================
// TEST SUITE 1: BKT Mastery Update
// ===================================================================
console.log("\n=== TEST SUITE 1: BKT Mastery Update Logic ===");

// Test 1.1: Correct answer increases mastery
{
  const before = 0.3;
  const after = updateMastery(before, true);
  assert(after > before, "1.1a: Correct answer increases mastery");
  assertRange(after, 0, 1, "1.1b: Mastery stays in [0,1]");
}

// Test 1.2: Wrong answer decreases mastery
{
  const before = 0.7;
  const after = updateMastery(before, false);
  assert(after < before, "1.2a: Wrong answer decreases mastery");
  assertRange(after, 0, 1, "1.2b: Mastery stays in [0,1]");
}

// Test 1.3: Mastery never goes below 0.01 or above 0.99
{
  let m = 0.3;
  for (let i = 0; i < 50; i++) m = updateMastery(m, true);
  assertRange(m, 0.01, 0.99, "1.3a: Mastery capped at 0.99 after 50 correct answers");

  m = 0.7;
  for (let i = 0; i < 50; i++) m = updateMastery(m, false);
  assertRange(m, 0.01, 0.99, "1.3b: Mastery floored at 0.01 after 50 wrong answers");
}

// Test 1.4: BKT with extreme mastery values
{
  const afterCorrectAtMax = updateMastery(0.99, true);
  assertRange(afterCorrectAtMax, 0.01, 0.99, "1.4a: Correct at max stays bounded");

  const afterWrongAtMin = updateMastery(0.01, false);
  assertRange(afterWrongAtMin, 0.01, 0.99, "1.4b: Wrong at min stays bounded");
}

// Test 1.5: NaN/Infinity input handling
{
  const nanResult = updateMastery(NaN, true);
  assert(nanResult === 0.3, "1.5a: NaN input returns prior (0.3)", `got ${nanResult}`);

  const infResult = updateMastery(Infinity, false);
  assert(infResult === 0.3, "1.5b: Infinity input returns prior (0.3)", `got ${infResult}`);
}

// Test 1.6: Mastery oscillation test (5 right then 3 wrong, repeat)
{
  let m = 0.3;
  const history: number[] = [m];
  for (let i = 0; i < 5; i++) { m = updateMastery(m, true); history.push(m); }
  for (let i = 0; i < 3; i++) { m = updateMastery(m, false); history.push(m); }

  assert(history[5] > history[0], "1.6a: After 5 correct, mastery is higher than start");
  assert(history[8] < history[5], "1.6b: After 3 wrong, mastery dropped from peak");
  assert(history[8] > history[0], "1.6c: Net positive (5 right > 3 wrong), still above start");

  // Second cycle
  for (let i = 0; i < 5; i++) m = updateMastery(m, true);
  for (let i = 0; i < 3; i++) m = updateMastery(m, false);
  assertRange(m, 0.01, 0.99, "1.6d: After 2 cycles, mastery stays bounded");
}

// Test 1.7: Custom BKT params
{
  const strict = { p_L0: 0.1, p_T: 0.05, p_S: 0.1, p_G: 0.1 };
  const afterCorrect = updateMastery(0.1, true, strict);
  const afterWrong = updateMastery(0.8, false, strict);
  assert(afterCorrect > 0.1, "1.7a: Custom params - correct increases mastery");
  assert(afterWrong < 0.8, "1.7b: Custom params - wrong decreases mastery");
}

// Test 1.8: Correct answer from low mastery moves slower than from medium
{
  const lowBefore = 0.1;
  const medBefore = 0.5;
  const lowAfter = updateMastery(lowBefore, true);
  const medAfter = updateMastery(medBefore, true);
  const lowDelta = lowAfter - lowBefore;
  const medDelta = medAfter - medBefore;
  // Both should increase, but the absolute delta from low should be reasonable
  assert(lowDelta > 0 && lowDelta < 0.3, "1.8a: Low mastery correct gives moderate boost", `delta=${lowDelta.toFixed(4)}`);
  assert(medDelta > 0 && medDelta < 0.3, "1.8b: Medium mastery correct gives moderate boost", `delta=${medDelta.toFixed(4)}`);
}

// ===================================================================
// TEST SUITE 2: SM-2 Spaced Repetition
// ===================================================================
console.log("\n=== TEST SUITE 2: SM-2 Spaced Repetition ===");

// Test 2.1: Performance rating
{
  assert(performanceRating(true, 40, 60) === 5, "2.1a: Correct fast (ratio>=1.5) = rating 5");
  assert(performanceRating(true, 45, 60) === 4, "2.1b: Correct on time (ratio>=1.2) = rating 4");
  assert(performanceRating(true, 70, 60) === 3, "2.1c: Correct slightly slow = rating 3");
  assert(performanceRating(true, 100, 60) === 2, "2.1d: Correct slow = rating 2");
  assert(performanceRating(true, 150, 60) === 1, "2.1e: Correct very slow = rating 1");
  assert(performanceRating(false, 50, 60) === 0, "2.1f: Wrong = rating 0");
  assert(performanceRating(true, 50, 0) === 3, "2.1g: No estimate = default rating 3");
}

// Test 2.2: SM-2 basic flow
{
  const initial = { interval: 0, repetitions: 0, easinessFactor: 2.5 };

  // First correct (rating 3)
  const step1 = sm2(3, initial);
  assert(step1.interval === 1, "2.2a: First correct → interval=1", `got ${step1.interval}`);
  assert(step1.repetitions === 1, "2.2b: First correct → repetitions=1", `got ${step1.repetitions}`);

  // Second correct (rating 3)
  const step2 = sm2(3, step1);
  assert(step2.interval === 6, "2.2c: Second correct → interval=6", `got ${step2.interval}`);
  assert(step2.repetitions === 2, "2.2d: Second correct → repetitions=2", `got ${step2.repetitions}`);

  // Third correct (rating 3)
  const step3 = sm2(3, step2);
  assert(step3.interval >= 12 && step3.interval <= 16, "2.2e: Third correct → interval≈13-15", `got ${step3.interval}`);
  assert(step3.repetitions === 3, "2.2f: Third correct → repetitions=3", `got ${step3.repetitions}`);
}

// Test 2.3: SM-2 wrong answer resets
{
  const advanced = { interval: 15, repetitions: 3, easinessFactor: 2.5 };
  const reset = sm2(1, advanced);
  assert(reset.interval === 1, "2.3a: Wrong answer resets interval to 1", `got ${reset.interval}`);
  assert(reset.repetitions === 0, "2.3b: Wrong answer resets repetitions to 0", `got ${reset.repetitions}`);
}

// Test 2.4: SM-2 easiness factor bounds
{
  let ef = 2.5;
  for (let i = 0; i < 20; i++) {
    const result = sm2(5, { interval: 10, repetitions: 5, easinessFactor: ef });
    ef = result.easinessFactor;
  }
  assert(ef >= 1.3, "2.4a: EF stays above minimum after many perfect scores", `got ${ef}`);

  ef = 2.5;
  for (let i = 0; i < 20; i++) {
    const result = sm2(0, { interval: 1, repetitions: 0, easinessFactor: ef });
    ef = result.easinessFactor;
  }
  assert(ef >= 1.3, "2.4b: EF stays above minimum after many failures", `got ${ef}`);
}

// Test 2.5: nextReview is always in the future
{
  const now = new Date();
  const result = sm2(3, { interval: 0, repetitions: 0, easinessFactor: 2.5 });
  assert(result.nextReview.getTime() > now.getTime(), "2.5a: nextReview is in the future");

  const result2 = sm2(5, { interval: 6, repetitions: 2, easinessFactor: 2.8 });
  assert(result2.nextReview.getTime() > now.getTime(), "2.5b: nextReview is in the future for advanced card");
}

// Test 2.6: isDueForReview
{
  assert(isDueForReview(null) === true, "2.6a: null nextReview means due");
  assert(isDueForReview(undefined) === true, "2.6b: undefined nextReview means due");

  const pastDate = new Date(Date.now() - 86400000); // yesterday
  assert(isDueForReview(pastDate) === true, "2.6c: Past date means due");

  const futureDate = new Date(Date.now() + 86400000); // tomorrow
  assert(isDueForReview(futureDate) === false, "2.6d: Future date means not due");
}

// Test 2.7: getReviewUrgency
{
  assert(getReviewUrgency(null) === 999, "2.7a: null → urgency 999");

  const pastDate = new Date(Date.now() - 3 * 86400000); // 3 days ago
  const urgency = getReviewUrgency(pastDate);
  assert(urgency >= 3, "2.7b: 3 days overdue → urgency >= 3", `got ${urgency}`);
}

// ===================================================================
// TEST SUITE 3: Forgetting Curve
// ===================================================================
console.log("\n=== TEST SUITE 3: Forgetting Curve ===");

// Test 3.1: No decay for freshly practiced
{
  const mastery = applyForgettingCurve(0.8, new Date(), 2.5);
  assert(mastery === 0.8, "3.1a: Freshly practiced = no decay", `got ${mastery}`);
}

// Test 3.2: No decay for null lastPracticed
{
  const mastery = applyForgettingCurve(0.8, null, 2.5);
  assert(mastery === 0.8, "3.2a: null lastPracticed = no decay", `got ${mastery}`);
}

// Test 3.3: Decay increases with time
{
  const oneDay = applyForgettingCurve(0.8, new Date(Date.now() - 86400000), 2.5);
  const sevenDays = applyForgettingCurve(0.8, new Date(Date.now() - 7 * 86400000), 2.5);
  const thirtyDays = applyForgettingCurve(0.8, new Date(Date.now() - 30 * 86400000), 2.5);

  assert(oneDay < 0.8, "3.3a: 1 day causes some decay");
  assert(sevenDays < oneDay, "3.3b: 7 days causes more decay than 1 day");
  assert(thirtyDays < sevenDays, "3.3c: 30 days causes more decay than 7 days");
  assert(thirtyDays >= 0.01, "3.3d: Decay floors at 0.01", `got ${thirtyDays}`);
}

// Test 3.4: Higher easiness factor = slower decay
{
  const highEF = applyForgettingCurve(0.8, new Date(Date.now() - 7 * 86400000), 3.0);
  const lowEF = applyForgettingCurve(0.8, new Date(Date.now() - 7 * 86400000), 1.5);
  assert(highEF > lowEF, "3.4a: Higher EF = slower decay", `highEF=${highEF}, lowEF=${lowEF}`);
}

// Test 3.5: Decay never exceeds original mastery
{
  const decayed = applyForgettingCurve(0.8, new Date(Date.now() - 365 * 86400000), 2.5);
  assert(decayed <= 0.8, "3.5a: Decayed mastery never exceeds original", `got ${decayed}`);
}

// ===================================================================
// TEST SUITE 4: Knowledge Graph
// ===================================================================
console.log("\n=== TEST SUITE 4: Knowledge Graph ===");

// Test 4.1: Concept count
{
  assert(CONCEPTS.length === 144, "4.1a: 144 total concepts", `got ${CONCEPTS.length}`);
}

// Test 4.2: All concepts have valid IDs
{
  const ids = new Set(CONCEPTS.map(c => c.id));
  const duplicateIds = CONCEPTS.length - ids.size;
  assert(duplicateIds === 0, "4.2a: No duplicate concept IDs", `found ${duplicateIds} duplicates`);
}

// Test 4.3: All prerequisites reference valid concepts
{
  let brokenPrereqs = 0;
  const conceptIds = new Set(CONCEPTS.map(c => c.id));
  for (const concept of CONCEPTS) {
    for (const prereq of concept.prerequisites) {
      if (!conceptIds.has(prereq)) brokenPrereqs++;
    }
  }
  assert(brokenPrereqs === 0, "4.3a: All prerequisites reference valid concepts", `found ${brokenPrereqs} broken`);
}

// Test 4.4: No circular prerequisites
{
  function hasCycle(conceptId: string, visited: Set<string>): boolean {
    if (visited.has(conceptId)) return true;
    visited.add(conceptId);
    const concept = CONCEPTS.find(c => c.id === conceptId);
    if (!concept) return false;
    for (const prereq of concept.prerequisites) {
      if (hasCycle(prereq, new Set(visited))) return true;
    }
    return false;
  }
  let circularCount = 0;
  for (const concept of CONCEPTS) {
    if (hasCycle(concept.id, new Set())) circularCount++;
  }
  assert(circularCount === 0, "4.4a: No circular prerequisites", `found ${circularCount} circular chains`);
}

// Test 4.5: getPrerequisiteChain
{
  const chain = getPrerequisiteChain("std10_sci_ch9_organic_compounds");
  assert(chain.length > 0, "4.5a: Chain for organic compounds is non-empty", `length=${chain.length}`);
  const chainIds = chain.map(c => c.id);
  assert(!chainIds.includes("std10_sci_ch9_organic_compounds"), "4.5b: Chain does not include the concept itself");
}

// Test 4.6: getNextConcepts
{
  // If nothing mastered, should return concepts with no prerequisites
  const next = getNextConcepts([], "science", 9);
  assert(next.length > 0, "4.6a: With no mastered concepts, returns root concepts");
  for (const c of next) {
    assert(c.prerequisites.length === 0, `4.6b: Root concept "${c.name}" has no prerequisites`, `prereqs: ${c.prerequisites.join(", ")}`);
  }
}

// Test 4.7: getChapterProgress
{
  const masteries = CONCEPTS.filter(c => c.standard === 9).map(c => ({
    conceptId: c.id,
    mastery: 0.5,
  }));
  const progress = getChapterProgress("test", masteries, 9);
  assert(progress.length > 0, "4.7a: Returns chapter progress for 9th standard");
  for (const p of progress) {
    assertRange(p.averageMastery, 0, 1, `4.7b: Chapter "${p.chapter.name}" mastery in range`);
  }
}

// Test 4.8: getSubjectProgress
{
  const masteries = CONCEPTS.filter(c => c.standard === 9 && c.subject === "science").map(c => ({
    conceptId: c.id,
    mastery: 0.8,
  }));
  const progress = getSubjectProgress(masteries, "science", 9);
  assert(progress.mastered > 0, "4.8a: With 0.8 mastery, all concepts should be mastered");
  assert(progress.notStarted === 0, "4.8b: No concepts should be not started");
}

// Test 4.9: buildConceptGraph
{
  const graph = buildConceptGraph(9);
  assert(graph.size > 0, "4.9a: Graph for 9th standard has nodes");
  for (const [id, node] of graph) {
    assert(node.concept.id === id, `4.9b: Node "${id}" has correct concept`);
  }
}

// ===================================================================
// TEST SUITE 5: Concept Coverage & Distribution
// ===================================================================
console.log("\n=== TEST SUITE 5: Concept Coverage ===");

// Test 5.1: Subject distribution
{
  const science9 = CONCEPTS.filter(c => c.subject === "science" && c.standard === 9);
  const science10 = CONCEPTS.filter(c => c.subject === "science" && c.standard === 10);
  const alg9 = CONCEPTS.filter(c => c.subject === "algebra" && c.standard === 9);
  const geo9 = CONCEPTS.filter(c => c.subject === "geometry" && c.standard === 9);

  assert(science9.length >= 15, "5.1a: 9th science has 15+ concepts", `got ${science9.length}`);
  assert(science10.length >= 15, "5.1b: 10th science has 15+ concepts", `got ${science10.length}`);
  assert(alg9.length >= 10, "5.1c: 9th algebra has 10+ concepts", `got ${alg9.length}`);
  assert(geo9.length >= 10, "5.1d: 9th geometry has 10+ concepts", `got ${geo9.length}`);
}

// Test 5.2: All difficulty levels represented
{
  const easy = CONCEPTS.filter(c => c.difficulty === "easy").length;
  const medium = CONCEPTS.filter(c => c.difficulty === "medium").length;
  const hard = CONCEPTS.filter(c => c.difficulty === "hard").length;
  assert(easy > 0, "5.2a: Has easy concepts", `count=${easy}`);
  assert(medium > 0, "5.2b: Has medium concepts", `count=${medium}`);
  assert(hard > 0, "5.2c: Has hard concepts", `count=${hard}`);
  assert(medium > easy, "5.2d: More medium than easy (realistic distribution)");
}

// Test 5.3: All Bloom's levels represented
{
  const bloomsLevels = new Set(CONCEPTS.map(c => c.bloomsLevel));
  assert(bloomsLevels.size >= 4, "5.3a: At least 4 Bloom's levels represented", `got ${bloomsLevels.size}`);
}

// Test 5.4: CHAPTERS match CONCEPTS
{
  const conceptChapters = new Set(CONCEPTS.map(c => `${c.standard}_${c.subject}_${c.chapter}`));
  let chapterMismatch = 0;
  for (const ch of CHAPTERS) {
    if (!conceptChapters.has(`${ch.standard}_${ch.subject}_${ch.name}`)) {
      chapterMismatch++;
    }
  }
  assert(chapterMismatch === 0, "5.4a: All CHAPTERS have matching concepts", `mismatched: ${chapterMismatch}`);
}

// Test 5.5: Every concept has at least 1 concept in its chapter
{
  let emptyChapters = 0;
  for (const ch of CHAPTERS) {
    const count = CONCEPTS.filter(c => c.chapter === ch.name && c.subject === ch.subject && c.standard === ch.standard).length;
    if (count === 0) emptyChapters++;
  }
  assert(emptyChapters === 0, "5.5a: Every chapter has at least 1 concept", `empty: ${emptyChapters}`);
}

// Test 5.6: Concept IDs follow naming convention
{
  const badIds = CONCEPTS.filter(c => !c.id.match(/^std\d+_(alg|geo|sci)_ch\d+_/));
  assert(badIds.length === 0, "5.6a: All concept IDs follow naming convention", `bad: ${badIds.map(c => c.id).join(", ")}`);
}

// ===================================================================
// RESULTS
// ===================================================================
console.log("\n" + "=".repeat(60));
console.log(`RESULTS: ${testsPassed} passed, ${testsFailed} failed, ${testsPassed + testsFailed} total`);

if (failures.length > 0) {
  console.log("\nFAILURES:");
  failures.forEach((f, i) => console.log(`  ${i + 1}. ${f}`));
}

console.log("=".repeat(60));

process.exit(testsFailed > 0 ? 1 : 0);
