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
      generated.type as "diagnostic" | "weekly" | "quiz" | "review",
      student.name
    );

    const r = result as unknown as {
      _id: unknown;
      score: number;
      totalMarks: number;
      correctAnswers: number;
      totalQuestions: number;
      percentage: number;
      timeTakenSeconds: number;
      insights: Record<string, unknown>;
      questions: { questionId: string; isCorrect: boolean; conceptId: string; marks: number }[];
    };

    for (const q of r.questions) {
      const timedAnswer = answers.find((a: { questionId: string }) => a.questionId === q.questionId);
      const question = generated.questions.find((q2: { id: string }) => q2.id === q.questionId);
      await updateConceptMastery(
        studentId,
        q.conceptId,
        q.isCorrect,
        timedAnswer?.timeTaken,
        question?.timeEstimate
      );
    }

    await GeneratedTest.deleteOne({ testId });

    return NextResponse.json({
      testResultId: r._id,
      score: r.score,
      totalMarks: r.totalMarks,
      correctAnswers: r.correctAnswers,
      totalQuestions: r.totalQuestions,
      percentage: r.percentage,
      timeTakenSeconds: r.timeTakenSeconds ?? 0,
      insights: r.insights,
      questions: r.questions,
    });
  } catch (error) {
    console.error("Test grading error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
