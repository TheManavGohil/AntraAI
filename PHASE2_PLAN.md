# AntraAI Phase 2 — Detailed Plan
## "Strong Backend Base + Core Features"

**Duration:** ~3-4 sessions
**Focus:** Features, not UI
**Excluded:** UI polish (Phase 3), Deployment (Phase 4)

---

## Workstream 1: Socratic Conversation Mode (P0)

### 1A. Wire socraticMode through API
- **Files:** `app/(student)/chat/page.tsx`, `app/api/chat/route.ts`
- Add `socraticMode` to chat POST body
- Read it in the API route, pass to `queryAssistant()`
- Effort: **Small** (15 min)

### 1B. Add conversation context to RAG
- **Files:** `app/api/chat/route.ts`, `lib/ai/rag.ts`, `lib/ai/prompts.ts`
- Fetch last 5-10 messages from `ChatHistory` before generating
- Include conversation history in the AI prompt so the model can track dialogue progression
- Critical for Socratic: the AI needs to know what it asked last and what the student said
- Effort: **Medium** (1-2 hours)

### 1C. Socratic session tracking
- **Files:** `lib/db/schemas.ts`, `app/api/chat/route.ts`
- Add `SocraticSession` schema: `studentId`, `conceptId`, `steps[]`, `status` (in_progress/completed/timeout), `outcome` (guided/direct), `stepsCount`, `startedAt`, `completedAt`
- Track each Socratic exchange as a step (question asked, student response, AI follow-up)
- After student arrives at answer -> generate summary, mark session complete
- Effort: **Medium** (2-3 hours)

### 1D. Mastery-aware Socratic difficulty
- **Files:** `lib/ai/prompts.ts`
- Update `getSocraticSystemPrompt()` to use `masteryPercent` for difficulty calibration
- Low mastery (0-0.3): Start with simpler prerequisite questions, more hints
- Medium mastery (0.3-0.7): Standard Socratic flow
- High mastery (0.7+): Challenge questions, connect to advanced topics
- Effort: **Small** (30 min)

### 1E. Socratic analytics endpoint
- **Files:** new `app/api/socratic/route.ts`
- GET: Return Socratic session history, success rate, average steps to discovery, concepts explored
- Effort: **Small** (1 hour)

---

## Workstream 2: Student Onboarding Flow (P0)

### 2A. Post-registration diagnostic test
- **Files:** `app/(auth)/register/page.tsx`, new `app/(onboard)/` route group
- After registration + consent -> redirect to onboarding wizard
- Step 1: "Select your subjects" (Science, Algebra, Geometry — multi-select)
- Step 2: Take diagnostic test (10 questions, auto-graded)
- Step 3: Show results + "Your personalized plan is ready"
- Effort: **Medium** (3-4 hours)

### 2B. Login page
- **Files:** new `app/(auth)/login/page.tsx`
- Student enters phone number -> lookup by `parentPhone` in MongoDB -> return `studentId`
- Store in localStorage (keep existing auth model)
- Add "Don't have an account? Register" link
- Effort: **Small** (1 hour)

### 2C. Subject preference storage
- **Files:** `lib/db/schemas.ts`, `app/api/auth/register/route.ts`
- Add `preferredSubjects: string[]` field to `IStudent` schema
- Store during onboarding, use to filter default chat/test subjects
- Effort: **Small** (30 min)

### 2D. Onboarding API
- **Files:** new `app/api/auth/onboard/route.ts`
- POST: Accept `studentId`, `preferredSubjects`, `diagnosticAnswers`
- Run diagnostic grading, initialize mastery for selected subjects only, return baseline results
- Effort: **Medium** (2 hours)

---

## Workstream 3: Mastery Engine — Spaced Repetition (P1)

### 3A. SM-2 spaced repetition algorithm
- **Files:** new `lib/mastery/spaced-repetition.ts`
- Implement SM-2: `interval`, `repetitions`, `easinessFactor`
- Input: current mastery + performance rating (0-5 based on correctness + time)
- Output: `nextReviewDate`, updated `interval`, `repetitions`, `easinessFactor`
- Effort: **Medium** (2-3 hours)

### 3B. Wire SM-2 into mastery updates
- **Files:** `lib/mastery/bkt.ts`, `app/api/test/grade/route.ts`, `app/api/mastery/route.ts`
- After each correct/incorrect answer, call SM-2 to update `nextReview` and spaced-rep fields
- Add `lastReviewInterval`, `repetitions`, `easinessFactor` to `IConceptMastery` schema
- Effort: **Medium** (2 hours)

### 3C. Review queue endpoint
- **Files:** new `app/api/mastery/review/route.ts`
- GET: Return concepts where `nextReview <= now` (due for review)
- Sort by urgency (most overdue first)
- Include mastery level, last practiced date, recommended review type
- Effort: **Small** (1 hour)

### 3D. Forgetting curve integration
- **Files:** `lib/mastery/bkt.ts`
- Before computing mastery for display, apply forgetting curve decay based on `timeSinceLastPracticed`
- Formula: `adjustedMastery = currentMastery * e^(-t/S)` where S = stability (derived from easinessFactor)
- Only applies to DISPLAY, not stored value
- Effort: **Medium** (2 hours)

### 3E. Learning path recommendations
- **Files:** `lib/mastery/knowledge-graph.ts`, `app/api/mastery/route.ts`
- Wire existing `getNextConcepts()` to mastery API response
- Add "Recommended Next" section: concepts whose prerequisites are met, sorted by mastery gap
- Effort: **Small** (1 hour)

---

## Workstream 4: Concept Coverage (P1)

### 4A. Complete 9th Science concepts
- **Files:** `lib/utils/constants.ts`
- Add concepts for 7 missing chapters: Classification of Plants, Energy Flow, Useful/Harmful Microbes, Environmental Management, Substances in Common Use, Introduction to Biotechnology, Observing Space
- Each chapter needs 3-5 concepts with prerequisites, difficulty, Bloom's level
- Effort: **Medium** (2 hours)

### 4B. Complete 10th standard gaps
- **Files:** `lib/utils/constants.ts`
- Add concepts for: 10th Algebra Ch4 (Financial Planning), 10th Geometry Ch4 (Geometric Constructions), Ch5 (Coordinate Geometry)
- Effort: **Small** (1 hour)

### 4C. Expand concept depth
- **Files:** `lib/utils/constants.ts`
- Review existing chapters that have only 1 concept — expand to 3-5 where appropriate
- Add missing prerequisite chains
- Target: ~120 concepts across 56 chapters (up from 84)
- Effort: **Medium** (2 hours)

### 4D. Seed expanded concepts
- **Files:** `scripts/seed-concepts.ts`
- Update seeding script to handle the expanded concept set
- Re-seed ChromaDB with expanded textbook chunks if available
- Effort: **Small** (1 hour)

---

## Workstream 5: Test/Insights Engine (P1)

### 5A. Wire AI insights into grading
- **Files:** `lib/test/generator.ts`
- Replace hardcoded `suggestion` in `gradeTest()` with actual call to `getInsightsPrompt()`
- Pass graded questions to Gemini for personalized insights
- Effort: **Small** (1 hour)

### 5B. Wire AI grading prompt
- **Files:** `lib/test/generator.ts`
- Replace inline grading prompt (line 212) with `getGradingPrompt()` from prompts.ts
- Effort: **Small** (30 min)

### 5C. Score trend data
- **Files:** `app/api/mastery/route.ts`, `lib/test/generator.ts`
- Add `getScoreTrend(studentId, subject)`: return last 20 test scores with dates
- Add to mastery API response
- Effort: **Small** (1 hour)

### 5D. Concept-level test breakdown
- **Files:** `app/api/mastery/route.ts`
- For each test in history, include per-concept performance (correct/total per concept)
- Already stored in `TestResult.questions[].conceptId` + `isCorrect` — just needs aggregation
- Effort: **Small** (1 hour)

### 5E. Review-mistakes test mode
- **Files:** `lib/test/generator.ts`, new API endpoint or extend `generateTest()`
- Add `testType: "review"`: queries all concepts where mastery < 0.5 from recent tests
- Generates targeted quiz on those concepts
- Effort: **Medium** (2 hours)

### 5F. Concept-specific quiz from mastery
- **Files:** `app/api/test/generate/route.ts`
- Already supports `conceptId` param — ensure mastery page can trigger it
- Add API endpoint or extend mastery POST to generate concept quiz
- Effort: **Small** (30 min)

---

## Workstream 6: API Hardening (P2)

### 6A. Auth middleware
- **Files:** new `lib/middleware/auth.ts`
- Shared function: `authenticateStudent(req) -> studentId`
- Validates `studentId` from body/params, checks existence + consent
- Apply to all 6 API routes
- Effort: **Medium** (2 hours)

### 6B. Rate limiting
- **Files:** new `lib/middleware/rate-limit.ts`
- In-memory rate limiter: 60 req/min per student for chat, 10 req/min for test generation
- Apply via middleware wrapper
- Effort: **Small** (1 hour)

### 6C. Error normalization
- **Files:** new `lib/utils/api-response.ts`
- Standard response format: `{ success: boolean, data?: T, error?: { code: string, message: string } }`
- Apply to all API routes
- Effort: **Medium** (2 hours)

### 6D. Query intent classification
- **Files:** `lib/ai/rag.ts`, `app/api/chat/route.ts`
- Wire existing `classifyQueryIntent()` (currently dead code)
- Auto-detect subject from free-form queries
- Use suggested concept to pass `conceptId` to `queryAssistant()`
- Effort: **Small** (1 hour)

### 6E. API versioning
- **Files:** All route files
- Move routes from `/api/chat` to `/api/v1/chat` pattern (optional, can defer to Phase 4)
- Effort: **Small** (30 min)

---

## Execution Order

| Session | Workstreams | Deliverables |
|---------|-------------|-------------|
| **Session 1** | 1A + 1B + 1C + 1D + 2B + 6A | Socratic mode fully wired, login page, auth middleware |
| **Session 2** | 2A + 2C + 2D + 3A + 3B + 3E | Onboarding flow, SM-2 algorithm, learning path |
| **Session 3** | 3C + 3D + 4A + 4B + 4C + 4D | Review queue, forgetting curve, concept coverage |
| **Session 4** | 5A + 5B + 5C + 5D + 5E + 5F + 6B + 6C + 6D | AI insights, score trends, review-mistakes, rate limiting, error normalization |

---

## Estimated Totals

| Metric | Value |
|--------|-------|
| New files | ~8 (schemas, middleware, spaced-repetition, routes) |
| Modified files | ~15 (prompts, rag, bkt, generator, schemas, constants, all routes) |
| New concepts | ~36 (84 -> 120) |
| New API endpoints | ~4 (socratic, review, onboard, error-normalize) |
| Total effort | ~25-30 hours across 4 sessions |
