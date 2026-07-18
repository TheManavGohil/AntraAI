import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { Student, GeneratedTest } from "@/lib/db/schemas";
import { gradeTest, updateConceptMastery } from "@/lib/test/generator";
import { Types } from "mongoose";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { testId, studentId, answers } = body;

    if (!testId || !studentId || !answers) {
      return NextResponse.json(
        { error: "testId, studentId, and answers are required" },
        { status: 400 }
      );
    }

    if (!Types.ObjectId.isValid(studentId)) {
      return NextResponse.json(
        { error: "Invalid studentId format" },
        { status: 400 }
      );
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const generated = await GeneratedTest.findOne({ testId });
    if (!generated) {
      return NextResponse.json(
        { error: "Test not found or expired" },
        { status: 404 }
      );
    }

    if (generated.expiresAt < new Date()) {
      await GeneratedTest.deleteOne({ testId });
      return NextResponse.json(
        { error: "Test has expired" },
        { status: 410 }
      );
    }

    const result = await gradeTest(
      studentId,
      testId,
      answers,
      generated.questions as any,
      generated.subject,
      generated.type as "diagnostic" | "weekly" | "quiz"
    );

    for (const q of result.questions) {
      await updateConceptMastery(studentId, q.conceptId, q.isCorrect);
    }

    await GeneratedTest.deleteOne({ testId });

    return NextResponse.json({
      testResultId: result._id,
      score: result.score,
      totalMarks: result.totalMarks,
      correctAnswers: result.correctAnswers,
      totalQuestions: result.totalQuestions,
      percentage: result.percentage,
      timeTakenSeconds: result.timeTakenSeconds,
      insights: result.insights,
      questions: result.questions,
    });
  } catch (error) {
    console.error("Test grading error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
