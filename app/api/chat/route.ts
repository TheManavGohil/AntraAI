import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { ChatHistory, SocraticSession } from "@/lib/db/schemas";
import { queryAssistant } from "@/lib/ai/rag";
import { computeSubjectMastery } from "@/lib/mastery/bkt";
import { authenticateStudent } from "@/lib/middleware/auth";

const CONVERSATION_CONTEXT_SIZE = 10;
const SOCRATIC_TIMEOUT_STEPS = 12;

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateStudent(req);
    if (auth instanceof NextResponse) return auth;
    const { student, studentId } = auth;

    const body = await req.json();
    const { message, subject = "science", socraticMode = false, conceptId } = body;

    if (!message) {
      return NextResponse.json(
        { error: "message is required" },
        { status: 400 }
      );
    }

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
      .map(m => `${m.role === "user" ? student.name : "AntraAI"}: ${m.content}`)
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

    const response = await queryAssistant(message, {
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
      response: response.answer,
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
