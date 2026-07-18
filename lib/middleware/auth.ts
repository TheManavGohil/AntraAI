import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { Student, IStudent } from "@/lib/db/schemas";
import { Types } from "mongoose";

export interface AuthResult {
  student: IStudent;
  studentId: string;
}

export async function authenticateStudent(
  req: NextRequest,
  options: { requireConsent?: boolean } = {}
): Promise<AuthResult | NextResponse> {
  const { requireConsent = true } = options;

  await connectDB();

  let studentId: string | null = null;

  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const clone = req.clone();
    try {
      const body = await clone.json();
      studentId = body.studentId || null;
    } catch {
      studentId = null;
    }
  }

  if (!studentId) {
    const { searchParams } = new URL(req.url);
    studentId = searchParams.get("studentId");
  }

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

  const student = await Student.findById(studentId);
  if (!student) {
    return NextResponse.json(
      { error: "Student not found" },
      { status: 404 }
    );
  }

  if (requireConsent && !student.consentGiven) {
    return NextResponse.json(
      { error: "Parental consent not given" },
      { status: 403 }
    );
  }

  return { student, studentId };
}
