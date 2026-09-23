import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { ChatHistory, SocraticSession, Tutor, TokenTransaction, Student } from "@/lib/db/schemas";
import { queryAssistant, classifyQueryIntent } from "@/lib/ai/rag";
import { computeSubjectMastery } from "@/lib/mastery/bkt";
import { authenticateStudent } from "@/lib/middleware/auth";
import { checkRateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { CONCEPTS } from "@/lib/utils/constants";
import { Types } from "mongoose";

const CONVERSATION_CONTEXT_SIZE = 10;
const SOCRATIC_TIMEOUT_STEPS = 12;
const CHAT_TOKEN_COST = 1;

function matchConceptId(name: string, subject: string, studentClass: number): string | undefined {
  const normalized = name.toLowerCase().replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_");
  const candidates = CONCEPTS.filter(c => c.subject === subject && c.standard === studentClass);

  for (const c of candidates) {
    const idNorm = c.id.toLowerCase().replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_");
    const nameNorm = c.name.toLowerCase().replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_");
    if (idNorm.includes(normalized) || normalized.includes(idNorm) ||
        nameNorm.includes(normalized) || normalized.includes(nameNorm)) {
      return c.id;
    }
  }
  return undefined;
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateStudent(req);
    if (auth instanceof NextResponse) return auth;
    const { student, studentId } = auth;

    const rl = checkRateLimit(studentId, RATE_LIMITS.chat.maxRequests, RATE_LIMITS.chat.windowMs);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait before sending another message." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { message, subject: reqSubject, socraticMode = false, conceptId: reqConceptId, tutorId } = body;

    if (!message) {
      return NextResponse.json(
        { error: "message is required" },
        { status: 400 }
      );
    }

    if (student.tokens < CHAT_TOKEN_COST) {
      return NextResponse.json(
        { error: "Insufficient tokens to send message. Please add more tokens." },
        { status: 402 }
      );
    }

    let tutorSystemPrompt = "";
    if (tutorId) {
       const tutor = await Tutor.findOne({ tutorId });
       if (tutor) {
          tutorSystemPrompt = tutor.systemPrompt;
       }
    }

    // Deduct tokens
    await Student.findByIdAndUpdate(student._id, { $inc: { tokens: -CHAT_TOKEN_COST } });
    await TokenTransaction.create({
      studentId,
      amount: CHAT_TOKEN_COST,
      type: "deduction",
      description: `Chat message with tutor ${tutorId || 'general'}`,
      relatedService: "chat"
    });

    const intent = await classifyQueryIntent(message);
    const subject = reqSubject || (intent.suggestedSubject !== "general" ? intent.suggestedSubject : student.preferredSubjects?.[0] || "science");
    const conceptId = reqConceptId || (intent.suggestedConcept ? matchConceptId(intent.suggestedConcept, subject, student.class) : undefined);

    await ChatHistory.create({
      studentId,
      role: "user",
      content: message,
      subject,
      concept: conceptId,
    });

    const recentHistory = await ChatHistory.find({ studentId })
      .sort({ createdAt: -1 })
      .limit(CONVERSATION_CONTEXT_SIZE)
      .sort({ createdAt: 1 });

    const conversationContext = recentHistory
      .slice(0, -1)
      .map(m => `${m.role === "user" ? student.name : "YoLearn"}: ${m.content}`)
      .join("\n");

    const masteryPercent = await computeSubjectMastery(studentId, subject);

    let activeSession = null;
    if (socraticMode) {
      activeSession = await SocraticSession.findOne({
        studentId,
        status: "in_progress",
      }).sort({ createdAt: -1 });

      if (!activeSession) {
        activeSession = await SocraticSession.create({
          studentId,
          subject,
          conceptId,
          status: "in_progress",
          outcome: "guided",
          startedAt: new Date(),
        });
      }
    }

    // Append tutor persona if available
    let customInstructions = "";
    if (tutorSystemPrompt) {
        customInstructions = `\n\nFollow this persona and system instruction strictly: ${tutorSystemPrompt}`;
    }

    const response = await queryAssistant(message + customInstructions, {
      studentName: student.name,
      studentClass: student.class,
      subject,
      masteryPercent,
      socraticMode,
      conceptId,
      studentId,
      conversationContext: conversationContext || undefined,
      socraticStep: activeSession ? activeSession.stepsCount + 1 : undefined,
    });

    await ChatHistory.create({
      studentId,
      role: "assistant",
      content: response.answer,
      subject,
      concept: conceptId || response.conceptId,
    });

    let socraticSessionUpdate: Record<string, unknown> | null = null;
    if (socraticMode && activeSession) {
      const newStepCount = activeSession.stepsCount + 1;

      const setFields: Record<string, unknown> = { stepsCount: newStepCount };

      const isSummary = response.answer.includes("**Summary**") ||
        response.answer.includes("## Summary") ||
        response.answer.includes("Let me explain") ||
        response.answer.includes("Here's what you learned");

      const isDirectExplanation = response.answer.includes("Let me explain directly") ||
        response.answer.includes("Since you're having trouble");

      if (isSummary) {
        setFields.status = "completed";
        setFields.outcome = "guided";
        setFields.completedAt = new Date();
      } else if (isDirectExplanation) {
        setFields.status = "completed";
        setFields.outcome = "direct";
        setFields.completedAt = new Date();
      } else if (newStepCount >= SOCRATIC_TIMEOUT_STEPS) {
        setFields.status = "timeout";
        setFields.outcome = "stuck";
        setFields.completedAt = new Date();
      }

      await SocraticSession.findByIdAndUpdate(activeSession._id, {
        $push: {
          steps: [
            { role: "student", content: message, timestamp: new Date() },
            { role: "tutor", content: response.answer, timestamp: new Date() },
          ],
        },
        $set: setFields,
      });

      socraticSessionUpdate = {
        sessionId: activeSession._id,
        step: newStepCount,
        status: setFields.status || "in_progress",
        outcome: setFields.outcome || "guided",
      };
    }

    return NextResponse.json({
      reply: response.answer, // change to reply to match frontend expecting data.reply
      sources: response.sources,
      socraticSession: socraticSessionUpdate,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateStudent(req, { requireConsent: false });
    if (auth instanceof NextResponse) return auth;
    const { studentId } = auth;

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50");

    const history = await ChatHistory.find({ studentId })
      .sort({ createdAt: 1 })
      .limit(limit);

    return NextResponse.json({ history });
  } catch (error) {
    console.error("Chat history error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
