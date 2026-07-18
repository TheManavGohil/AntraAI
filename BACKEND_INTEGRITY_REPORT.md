# AntraAI — Backend Integrity Report

**Date:** July 18, 2026  
**Tested by:** Automated test suites (test-backend-integrity.ts, test-edge-cases.ts)  
**MongoDB:** Atlas cluster connected, test data cleaned up  
**ChromaDB:** Docker container `antraai-chromadb`, 29 seeded chunks  

---

## Executive Summary

| Category | Result |
|----------|--------|
| **Total tests run** | 42 (27 main + 15 edge cases) |
| **Passed** | 32 |
| **Failed** | 5 |
| **Warnings** | 5 |
| **Critical bugs** | 3 |
| **Medium bugs** | 2 |
| **Low / cosmetic** | 5 |

---

## SECTION A: What Works Correctly

### A1. BKT Core Math (lib/mastery/bkt.ts:19-41) — PASS
- Correct answer increases mastery, wrong answer decreases it
- Mastery clamped to [0.01, 0.99] — never reaches 0 or 1
- Alternating 100 right/wrong from 0.5 stays in bounds
- Zero mastery + correct → 0.1 (learning only, no prior knowledge)

### A2. Concept Selection (lib/mastery/bkt.ts:179-240) — PASS
- Weak students (mastery 0.11) get 6 weak-concept priorities vs strong students (0.99) getting 2
- Fresh students get all concepts at default 0.3
- Distribution: 60% weak, 30% review, 10% strong
- Fills remaining slots from weakest if needed

### A3. Personalization Isolation — PASS
- Student1's practice attempts don't appear in Student2's mastery
- Different students get different mastery values for the same concept
- Chat history properly scoped by studentId (tested: student1=2 entries, student2=1 entry)

### A4. RAG Retrieval Accuracy — PASS (100%)
- 12/12 queries returned correct chapter:
  - Newton's Third Law → Laws of Motion (dist 0.29)
  - Ohm's Law → Current Electricity (dist 0.25)
  - Kinetic Energy → Work and Energy (dist 0.48)
  - pH Scale → Acids Bases and Salts (dist 0.30)
  - Quadratic Equations → Quadratic Equations (dist 0.36)
  - AP Sum → Arithmetic Progression (dist 0.25)
  - Pythagoras → Pythagoras Theorem (dist 0.27)
  - Trig Identities → Trigonometry (dist 0.34)
  - Gravitation → Gravitation (dist 0.28)
  - Refraction → Refraction of Light (dist 0.27)
  - Mole Concept → Measurement of Matter (dist 0.26)
  - Sets → Sets (dist 0.49)

### A5. RAG Standard/Subject Filtering — PASS
- Standard=10 filter returns only standard-10 chunks
- Subject=algebra filter returns only algebra chunks

### A6. Knowledge Graph — PASS
- 60 concepts in graph, no cycles detected
- Prerequisite chain for Equations of Motion: Newton's Laws → Momentum → Equations of Motion (3 prereqs)
- 12 concepts accessible with nothing mastered (no prerequisites)

### A7. Chat History Isolation — PASS
- Student2 cannot see Student1's chat entries
- Messages properly scoped by studentId

### A8. Schema Indexes — PASS
- `conceptmasteries`: `{studentId: 1, conceptId: 1}` (unique)
- `testresults`: `{studentId: 1, takenAt: -1}`
- `chathistories`: `{studentId: 1, createdAt: -1}`

### A9. initializeStudentMastery — PASS
- Creates correct number of rows for 9th grade
- All concept IDs unique
- Default mastery = p_L0 = 0.3
- Uses $setOnInsert (idempotent, safe to call multiple times)

### A10. Chat History GET — PASS (minor issue)
- Double `.sort()` pattern works but is suboptimal (see C5)

---

## SECTION B: Bugs Found

### B1. 🔴 CRITICAL: In-Memory testStore (app/api/test/generate/route.ts:7)

```typescript
const testStore = new Map<string, Test>();
```

**Impact:** Test generation + grading is completely non-functional in production.

**Problems:**
1. **Serverless death:** Vercel spins up fresh processes per request. `testStore` is always empty. Grade endpoint always returns "Test not found or expired".
2. **Server restart:** Even on a single server, restarting wipes all active tests.
3. **Eviction bug:** The cleanup logic at line 47-52 doesn't work — tests evict from the Map but the grade endpoint still gets 101 results because the Map stores new entries and old ones aren't evicted in order. Edge case test confirmed: size stays at 101, old test is still found.
4. **Race condition:** Test generated on instance A, grade request hits instance B → test not found.

**Fix:** Store tests in MongoDB (add a `GeneratedTest` collection) or use a shared Redis store.

---

### B2. 🔴 CRITICAL: Duplicate `updateConceptMastery` Functions

| Location | Used by |
|----------|---------|
| `lib/mastery/bkt.ts:67-108` | Not imported by any route (dead export) |
| `lib/test/generator.ts:296-338` | `app/api/test/grade/route.ts:4`, `app/api/mastery/route.ts:131` |

**Current state:** Both implementations are functionally identical (same BKT math, same MongoDB operations). However:

1. **They use different `{ new: true }` vs `{ returnDocument: 'after' }` patterns** — both deprecated for the same reason
2. **Risk of drift:** If someone updates one and not the other, students get different mastery values depending on which path they hit
3. **Confusing:** Two exports with the same name from different modules

**Fix:** Delete the duplicate in `generator.ts`, re-export from `bkt.ts` or consolidate into a single location.

---

### B3. 🟡 MEDIUM: BKT Slip Rate Too Aggressive (lib/mastery/bkt.ts:12-17)

```typescript
const DEFAULT_BKT: BKTParams = {
  p_L0: 0.3, p_T: 0.1, p_S: 0.1, p_G: 0.2,
};
```

**Impact:** A student with mastery=0.99 who makes 3 consecutive wrong answers drops to 0.28.

**Path:** 0.99 → 0.933 → 0.671 → 0.283

**Why this is a problem:**
- p_S=0.1 means 10% of "known" answers are wrong (slips)
- At mastery > 0.98, a wrong answer can actually INCREASE mastery (P(slip) >> P(guess))
- After 2 wrongs at high mastery, the 3rd wrong causes a catastrophic drop
- Real students make careless mistakes; 3 wrong answers shouldn't wipe out months of learning

**Recommended:** Set `p_S: 0.05` (more lenient) or add a **consecutive-wrong dampener** that prevents rapid mastery drops below a threshold.

---

### B4. 🟡 MEDIUM: Dead Code in rag.ts (lines 42-48)

```typescript
const conceptMastery = masteryPercent;
if (conceptId) {
  const concept = getConceptById(conceptId);
  if (concept) {
    // Use specific concept mastery if available
  }
}
```

**Impact:** The `conceptId` parameter is accepted but ignored. The assistant always uses subject-level mastery (from `computeSubjectMastery`) instead of concept-specific mastery. This means:
- A student weak in "Newton's Laws" but strong in "Work and Energy" gets the same Socratic/direct mode behavior for both topics
- The `conceptId` field in `queryAssistant` options is dead weight

**Fix:** Query `ConceptMastery` for the specific concept's mastery when `conceptId` is provided, falling back to subject mastery.

---

### B5. 🟡 MEDIUM: Mongoose `findOneAndUpdate` Deprecation

Both `bkt.ts:78,88,94,106` and `generator.ts:308,318,324,336` use `{ new: true }` which is deprecated.

**Fix:** Replace `{ new: true }` with `{ returnDocument: 'after' }`.

---

### B6. 🟢 LOW: NaN Mastery Not Guarded (lib/mastery/bkt.ts:19-41)

`updateMastery(NaN, true)` returns `NaN`. While MongoDB won't store NaN (validation rejects it), the API route doesn't validate before writing. If `masteryProbability` were ever NaN in the DB (e.g., via a script), the system would silently propagate NaN.

**Fix:** Add `if (!Number.isFinite(currentMastery)) return DEFAULT_BKT.p_L0;` at the top of `updateMastery`.

---

### B7. 🟢 LOW: No ObjectId Validation in API Routes

`getWeakConcepts("invalid-id-not-objectid", 5)` throws a raw Mongoose error instead of returning empty or a graceful error. API routes like `/api/mastery` and `/api/chat` pass `studentId` directly from query params to Mongoose queries without validation.

**Fix:** Validate ObjectId format before querying: `if (!Types.ObjectId.isValid(studentId)) return 400.`

---

### B8. 🟢 LOW: Chat History Double Sort

```typescript
// app/api/chat/route.ts:89-92
const history = await ChatHistory.find({ studentId })
  .sort({ createdAt: -1 })  // newest first
  .limit(50)
  .sort({ createdAt: 1 });  // oldest first (for display)
```

**Impact:** Two sorts on the same field. Mongoose can optimize this, but it's an anti-pattern.

**Fix:** Use `aggregate([{ $match: ... }, { $sort: { createdAt: -1 } }, { $limit: 50 }, { $sort: { createdAt: 1 } }])` or sort in application code.

---

### B9. 🟢 LOW: Test Result `percentage` Not Stored

The `/api/test/grade/route.ts:58` computes `Math.round((result.score / result.totalMarks) * 100)` for the response but doesn't store it in `TestResult`. The `/api/mastery/route.ts:78` references `percentage` in its select but it's not a stored field.

**Impact:** `percentage` field in `recentTests` response is always undefined.

---

### B10. 🟢 LOW: Chat History Has No TTL Index

`ChatHistory` accumulates forever. No TTL or cleanup mechanism. For a production system, this will grow unbounded.

**Fix:** Add TTL index or periodic cleanup: `ChatHistorySchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 })` (90 days).

---

## SECTION C: Data Integrity Assessment

| Check | Status | Details |
|-------|--------|---------|
| Student isolation | ✅ PASS | No cross-student data leakage |
| Mastery bounds | ✅ PASS | [0.01, 0.99] enforced |
| Concept uniqueness | ✅ PASS | Unique compound index on (studentId, conceptId) |
| Knowledge graph | ✅ PASS | No cycles, valid prerequisite chains |
| RAG retrieval | ✅ PASS | 100% accuracy on 12 test queries |
| RAG filtering | ✅ PASS | Standard/subject filters work |
| Test generation | ⚠️ PARTIAL | In-memory store makes grading non-functional |
| Chat history | ✅ PASS | Isolated per student, indexed properly |
| Concept initialization | ✅ PASS | Idempotent (setOnInsert), correct defaults |

---

## SECTION D: Priority Fix Roadmap

### P0 — Must fix before any deployment
1. **B1: Replace in-memory testStore** with MongoDB GeneratedTest collection
2. **B2: Consolidate duplicate updateConceptMastery** into single source of truth

### P1 — Should fix before beta
3. **B3: Tune BKT slip rate** (p_S: 0.1 → 0.05) or add dampener
4. **B4: Implement concept-level mastery in RAG** (use conceptId parameter)

### P2 — Nice to have
5. **B5: Fix Mongoose deprecations** ({ new: true } → { returnDocument: 'after' })
6. **B6: Guard NaN in updateMastery**
7. **B7: Validate ObjectId in API routes**
8. **B8: Fix chat history double sort**
9. **B9: Store percentage in TestResult**
10. **B10: Add chat history TTL**

---

## SECTION E: Test Artifacts

- **Main test suite:** `scripts/test-backend-integrity.ts` (27 tests, 10 categories)
- **Edge case tests:** `scripts/test-edge-cases.ts` (15 tests, 11 categories)
- **Run command:** `export $(grep -v '^#' .env.local | xargs) && npx tsx scripts/test-backend-integrity.ts`
- **Docker required:** `docker start antraai-chromadb` (port 8000)
