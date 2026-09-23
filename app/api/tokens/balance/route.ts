import { NextRequest, NextResponse } from "next/server";
import { authenticateStudent } from "@/lib/middleware/auth";
import { Student } from "@/lib/db/schemas";

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateStudent(req);
    if (auth instanceof NextResponse) return auth;
    const { studentId } = auth;

    const student = await Student.findById(studentId).select("tokens streak lastActiveDate");
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        tokens: student.tokens,
        streak: student.streak,
        lastActiveDate: student.lastActiveDate,
      },
    });
  } catch (error) {
    console.error("Token balance API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
