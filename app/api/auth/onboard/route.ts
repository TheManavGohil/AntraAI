import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { Student, TestResult } from "@/lib/db/schemas";
import { initializeStudentMastery, updateConceptMastery } from "@/lib/mastery/bkt";
import { Types } from "mongoose";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { studentId, preferredSubjects, diagnosticAnswers } = body;

    if (!studentId || !preferredSubjects) {
      return NextResponse.json(
        { error: "studentId and preferredSubjects are required" },
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

    await Student.findByIdAndUpdate(studentId, {
      $set: { preferredSubjects },
    });

    await initializeStudentMastery(studentId, student.class);

    if (diagnosticAnswers && Array.isArray(diagnosticAnswers)) {
      let totalCorrect = 0;
      let totalQuestions = diagnosticAnswers.length;

      for (const answer of diagnosticAnswers) {
        if (answer.conceptId && typeof answer.isCorrect === "boolean") {
          await updateConceptMastery(studentId, answer.conceptId, answer.isCorrect);
          if (answer.isCorrect) totalCorrect++;
        }
      }

      if (totalQuestions > 0) {
        await TestResult.create({
          studentId,
          testType: "diagnostic",
          subject: preferredSubjects[0] || "science",
          score: totalCorrect,
          totalMarks: totalQuestions,
          correctAnswers: totalCorrect,
          totalQuestions,
          timeTakenSeconds: 0,
          questions: diagnosticAnswers.map((a: { questionId: string; conceptId: string; isCorrect: boolean }) => ({
            questionId: a.questionId,
            studentAnswer: a.isCorrect ? "correct" : "incorrect",
            correctAnswer: "N/A",
            isCorrect: a.isCorrect,
            conceptId: a.conceptId,
            timeTaken: 0,
            marks: a.isCorrect ? 1 : 0,
          })),
          percentage: Math.round((totalCorrect / totalQuestions) * 100),
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Onboarding completed",
      preferredSubjects,
    });
  } catch (error) {
    console.error("Onboarding error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
