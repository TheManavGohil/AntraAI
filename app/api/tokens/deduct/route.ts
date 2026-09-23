import { NextRequest, NextResponse } from "next/server";
import { authenticateStudent } from "@/lib/middleware/auth";
import { Student, TokenTransaction } from "@/lib/db/schemas";

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateStudent(req);
    if (auth instanceof NextResponse) return auth;
    const { studentId } = auth;

    const body = await req.json();
    const { amount, description, relatedService } = body;

    if (!amount || amount <= 0 || !description || !relatedService) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    if (student.tokens < amount) {
      return NextResponse.json({ error: "Insufficient tokens" }, { status: 402 });
    }

    // Deduct tokens
    student.tokens -= amount;
    await student.save();

    // Log transaction
    const transaction = await TokenTransaction.create({
      studentId,
      amount,
      type: "deduction",
      description,
      relatedService,
    });

    return NextResponse.json({
      success: true,
      data: {
        newBalance: student.tokens,
        transactionId: transaction._id,
      },
    });
  } catch (error) {
    console.error("Token deduct API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
