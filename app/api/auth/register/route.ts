import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { Student } from "@/lib/db/schemas";
import { initializeStudentMastery } from "@/lib/mastery/bkt";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { name, class: studentClass, schoolName, parentPhone } = body;

    if (!name || !studentClass || !schoolName || !parentPhone) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    if (!/^[0-9]{10}$/.test(parentPhone)) {
      return NextResponse.json(
        { error: "Invalid phone number" },
        { status: 400 }
      );
    }

    // Check if student already exists
    const existing = await Student.findOne({ parentPhone, name });
    if (existing) {
      return NextResponse.json(
        { studentId: existing._id, message: "Student already registered" },
        { status: 200 }
      );
    }

    const student = await Student.create({
      name,
      class: studentClass,
      schoolName,
      parentPhone,
      consentGiven: false,
    });

    // Initialize mastery for all concepts
    await initializeStudentMastery(student._id.toString(), studentClass);

    return NextResponse.json({
      studentId: student._id,
      message: "Student registered. Awaiting parental consent.",
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
