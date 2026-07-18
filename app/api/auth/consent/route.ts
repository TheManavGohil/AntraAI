import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { Student } from "@/lib/db/schemas";

// For demo purposes, any 6-digit OTP is accepted
const DEMO_OTP = "123456";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { studentId, otp } = body;

    if (!studentId || !otp) {
      return NextResponse.json(
        { error: "studentId and otp are required" },
        { status: 400 }
      );
    }

    // In production, verify OTP against the sent value
    // For demo, accept "123456" or any 6-digit code
    if (otp !== DEMO_OTP && !/^[0-9]{6}$/.test(otp)) {
      return NextResponse.json(
        { error: "Invalid OTP" },
        { status: 400 }
      );
    }

    const student = await Student.findByIdAndUpdate(
      studentId,
      {
        consentGiven: true,
        consentDate: new Date(),
      },
      { new: true }
    );

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Consent verified successfully",
      student: {
        id: student._id,
        name: student.name,
        class: student.class,
      },
    });
  } catch (error) {
    console.error("Consent verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
