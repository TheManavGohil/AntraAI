import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { Student, GeneratedTest } from "@/lib/db/schemas";
import { generateTest } from "@/lib/test/generator";
import { Types } from "mongoose";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { studentId, subject, type = "weekly", conceptId } = body;

    if (!studentId || !subject) {
      return NextResponse.json(
        { error: "studentId and subject are required" },
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

    if (!student.consentGiven) {
      return NextResponse.json(
        { error: "Parental consent not given" },
        { status: 403 }
      );
    }

    const test = await generateTest(
      studentId,
      subject,
      type as "diagnostic" | "weekly" | "quiz",
      student.class,
      conceptId
    );

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + test.timeLimitMinutes + 30);

    await GeneratedTest.create({
      testId: test.id,
      studentId,
      subject,
      type: test.type,
      questions: test.questions,
      totalMarks: test.totalMarks,
      timeLimitMinutes: test.timeLimitMinutes,
      expiresAt,
    });

    return NextResponse.json({
      testId: test.id,
      questions: test.questions.map(q => ({
        id: q.id,
        type: q.type,
        question: q.question,
        options: q.options,
        conceptId: q.conceptId,
        marks: q.marks,
        timeEstimate: q.timeEstimate,
      })),
      totalMarks: test.totalMarks,
      timeLimitMinutes: test.timeLimitMinutes,
      subject: test.subject,
    });
  } catch (error) {
    console.error("Test generation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
