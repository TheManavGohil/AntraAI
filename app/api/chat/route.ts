import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { Student, ChatHistory } from "@/lib/db/schemas";
import { queryAssistant } from "@/lib/ai/rag";
import { computeSubjectMastery } from "@/lib/mastery/bkt";
import { Types } from "mongoose";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { message, studentId, subject = "science" } = body;

    if (!message || !studentId) {
      return NextResponse.json(
        { error: "message and studentId are required" },
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

    // Save user message
    await ChatHistory.create({
      studentId,
      role: "user",
      content: message,
      subject,
    });

    // Get student's mastery for the subject
    const masteryPercent = await computeSubjectMastery(studentId, subject);

    // Query the AI assistant
    const response = await queryAssistant(message, {
      studentName: student.name,
      studentClass: student.class,
      subject,
      masteryPercent,
      studentId,
    });

    // Save assistant response
    await ChatHistory.create({
      studentId,
      role: "assistant",
      content: response.answer,
      subject,
      concept: response.conceptId,
    });

    return NextResponse.json({
      response: response.answer,
      sources: response.sources,
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
    await connectDB();

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");
    const limit = parseInt(searchParams.get("limit") || "50");

    if (!studentId) {
      return NextResponse.json(
        { error: "studentId is required" },
        { status: 400 }
      );
    }

    if (!Types.ObjectId.isValid(studentId)) {
      return NextResponse.json(
        { error: "Invalid studentId format" },
        { status: 400 }
      );
    }

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
