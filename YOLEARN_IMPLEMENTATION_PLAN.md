# YoLearn Implementation Plan

Based on the deep research and autonomous scraping of `https://app.yolearn.ai/`, the target platform acts as an **AI-driven Tutor Marketplace** paired with a **Real-Time Virtual Economy** and a suite of **Generative AI Study Tools**.

The current AntraAI codebase (`PHASE2_PLAN.md`) focuses heavily on a standard Socratic chatbot structure. To pivot towards the YoLearn model, we need a fundamental shift in architecture and UI/UX.

Here is the detailed implementation plan to replicate the core mechanisms observed in YoLearn.

---

## Phase 1: Database & Architectural Overhaul (Foundation)
YoLearn relies heavily on user token balances and individualized AI "Tutor Profiles". We must update our schemas to reflect this.

### 1. Update Student Schema (`lib/db/schemas.ts`)
*   **Tokens:** Add `tokens: number` (e.g., default starting value of 20 tokens).
*   **Streak:** Add `streak: number` and `lastActiveDate: Date` for the 🔥 UI element.
*   **Academic Profile:** Add `board: string` (e.g., MSBSHSE) and `gradeRange: string` (e.g., Grade 9-12).

### 2. Create Tutor Schema (`lib/db/schemas.ts`)
*   Create a schema to define Tutors available in the marketplace.
*   Fields required:
    *   `tutorId: string`
    *   `name: string` (e.g., "Omkar Shinde")
    *   `subject: string` (e.g., "English")
    *   `board: string`, `gradeRange: string`
    *   `tokenRate: number` (e.g., 2.5 Tokens/Min)
    *   `systemPrompt: string` (Defines the specific AI personality and teaching constraints).
    *   `avatarUrl: string`

### 3. Implement Token Ledger System (`app/api/tokens/...`)
*   Create an API to handle the deduction of tokens in real-time.
*   Needs endpoints for:
    *   Getting current balance.
    *   Deducting tokens based on time (for Live Class) or per-request (for Chat/Tools).

---

## Phase 2: UI/UX Redesign - The App Shell (`app/layout.tsx`)
The UI must shift from a simple chat interface to a rich SPA dashboard.

### 1. Global Navigation (Sidebar & Topbar)
*   **Sidebar Navigation:** Include links for "Explore Tutors", "Custom Tools", "My Space", and "Help & Support".
*   **Topbar Elements:**
    *   User Profile icon.
    *   Streak indicator (🔥).
    *   Real-time Token Balance display with an "+ Add tokens" button.

### 2. Dashboard Hub (`app/(student)/dashboard/page.tsx`)
*   **Recommended Tutors Carousel:** Horizontal scrollable list showing tutor cards (Avatar, Name, Subject, and action buttons for "Chat Lesson" and "Live Class").
*   **Quick Tools Grid:** Direct entry points to GenAI features: Flashcards, Quiz Me, Mindmap, Podcast, and Simulation Generator.
*   **Tutor Directory:** A filterable list (by subject tags like Biology, Chemistry, English) displaying all available AI Tutors.

---

## Phase 3: Core Feature - Chat Lesson
A dedicated text-based learning environment for a specific tutor.

### 1. Chat Interface (`app/(student)/tutor/[tutorId]/chat/page.tsx`)
*   **Header:** Displays Tutor Avatar, Name, Subject, and a persistent "Live Class" call to action.
*   **Action Chips:** Provide quick-start prompts (e.g., "Teach me a topic", "Clear my doubts", "Explain step by step").
*   **Integration:** Map the chat input to the `api/chat/route.ts` API.

### 2. API Adjustments (`app/api/chat/route.ts`)
*   Inject the selected Tutor's `systemPrompt` from MongoDB into the AI context.
*   Hook into the Token Ledger API to deduct a micro-amount of tokens per completion generation.

---

## Phase 4: Flagship Feature - Live Class (Real-Time Voice)
This is the most critical and complex feature: a low-latency voice interaction billed per minute.

### 1. Pre-Class Entry Modal
*   UI showing Tutor details, Token Cost (e.g., "2.5 Tokens/Min"), and current User Balance.
*   Checks for microphone permissions.

### 2. WebRTC & Voice AI Integration
*   Implement real-time voice using WebRTC.
*   **Backend dependency needed:** We will need to integrate the **OpenAI Realtime API**, **Gemini Multimodal Live API**, or an AI voice wrapper (like Vapi/Retell) to handle duplex voice communication.
*   **Frontend:** Show an active audio visualizer and call duration timer.

### 3. Real-Time Billing Loop
*   Implement a client-server sync (e.g., a heartbeat WebSocket or regular polling every 10 seconds).
*   Decrement tokens progressively.
*   If tokens reach 0, trigger a graceful termination of the WebRTC connection with a warning toast.

---

## Phase 5: Custom GenAI Study Tools
Standalone micro-applications utilizing standard LLM JSON outputs.

### 1. Flashcards Generator (`app/(student)/tools/flashcards/page.tsx`)
*   **Input:** User enters a topic.
*   **Backend:** Prompt Gemini/OpenAI to return a JSON array of `[{ question: "", answer: "" }]`.
*   **UI:** Render animated, flippable React cards.

### 2. Quiz Me (`app/(student)/tools/quiz/page.tsx`)
*   **Backend:** LLM generates structured MCQs (Multiple Choice Questions) in JSON based on a topic.
*   **UI:** An interactive step-by-step quiz flow that gives immediate feedback on correctness.

### 3. Mindmap Generator (`app/(student)/tools/mindmap/page.tsx`)
*   **Backend:** Prompt LLM to output nodes and edges (relationships) in a strict JSON format.
*   **UI:** Use the existing `reactflow` dependency in `package.json` to render an interactive, visual graph.

### 4. Podcast Generator (`app/(student)/tools/podcast/page.tsx`)
*   **Backend:**
    *   Step 1: LLM generates a dialogue script between two "hosts".
    *   Step 2: Pass script to a Text-to-Speech API (e.g., OpenAI TTS).
*   **UI:** Render a custom HTML5 audio player.

---

## Summary of Actionable Next Steps
1. **Define Schemas:** Update `lib/db/schemas.ts` for Tokens and Tutors.
2. **Build Shell:** Overhaul `app/layout.tsx` to include Sidebar, Topbar, and Token state.
3. **Build Dashboard:** Create `app/(student)/dashboard/page.tsx` pulling from Tutor Schemas.
4. **Implement Live Class:** Set up WebRTC architecture and real-time billing loop.
5. **Implement Tools:** Build dedicated pages for Flashcards, Quizzes, and Mindmaps leveraging structured JSON AI responses.
