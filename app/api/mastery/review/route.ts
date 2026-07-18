import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { Student, ConceptMastery } from "@/lib/db/schemas";
import { CONCEPTS } from "@/lib/utils/constants";
import { isDueForReview, getReviewUrgency } from "@/lib/mastery/spaced-repetition";
import { Types } from "mongoose";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");
    const subject = searchParams.get("subject");
    const limit = parseInt(searchParams.get("limit") || "20");

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
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const masteries = await ConceptMastery.find({ studentId });

    const dueForReview = masteries.filter(m => isDueForReview(m.nextReview));

    const withUrgency = dueForReview.map(m => {
      const concept = CONCEPTS.find(c => c.id === m.conceptId);
      return {
        conceptId: m.conceptId,
        name: concept?.name || m.conceptId,
        chapter: concept?.chapter || "",
        subject: concept?.subject || "",
        difficulty: concept?.difficulty || "medium",
        mastery: m.masteryProbability,
        lastPracticed: m.lastPracticed,
        nextReview: m.nextReview,
        urgency: getReviewUrgency(m.nextReview),
        attempts: m.attempts,
        reviewType: m.repetitions === 0 ? "new" : m.masteryProbability < 0.5 ? "relearn" : "review",
      };
    });

    const filtered = subject
      ? withUrgency.filter(r => r.subject === subject)
      : withUrgency;

    filtered.sort((a, b) => b.urgency - a.urgency);

    const result = filtered.slice(0, limit);

    return NextResponse.json({
      dueCount: filtered.length,
      concepts: result,
    });
  } catch (error) {
    console.error("Review queue error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
