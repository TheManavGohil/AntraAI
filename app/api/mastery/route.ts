import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { Student, TestResult } from "@/lib/db/schemas";
import {
  getStudentMasteryProfile,
  getWeakConcepts,
  getStrongConcepts,
  computeSubjectMastery,
  initializeStudentMastery,
} from "@/lib/mastery/bkt";
import {
  getChapterProgress,
  getSubjectProgress,
  getNextConcepts,
} from "@/lib/mastery/knowledge-graph";
import { CONCEPTS } from "@/lib/utils/constants";
import { Types } from "mongoose";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");
    const subject = searchParams.get("subject");

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

    const masteries = await getStudentMasteryProfile(studentId);

    // Initialize mastery if empty
    if (masteries.length === 0) {
      await initializeStudentMastery(studentId, student.class);
      const newMasteries = await getStudentMasteryProfile(studentId);
      return NextResponse.json({
        concepts: newMasteries.map(m => {
          const concept = CONCEPTS.find(c => c.id === m.conceptId);
          return {
            ...m,
            name: concept?.name || m.conceptId,
            chapter: concept?.chapter || "",
            subject: concept?.subject || "",
            difficulty: concept?.difficulty || "medium",
          };
        }),
        subjectMastery: {
          science: await computeSubjectMastery(studentId, "science"),
          algebra: await computeSubjectMastery(studentId, "algebra"),
          geometry: await computeSubjectMastery(studentId, "geometry"),
        },
      });
    }

    const weakConcepts = await getWeakConcepts(studentId, 0.6, subject || undefined);
    const strongConcepts = await getStrongConcepts(studentId, 0.7, subject || undefined);

    const chapterProgress = getChapterProgress(studentId, masteries, student.class);
    const subjectProgress = getSubjectProgress(masteries, subject || "science", student.class);

    const subjectMastery = {
      science: await computeSubjectMastery(studentId, "science"),
      algebra: await computeSubjectMastery(studentId, "algebra"),
      geometry: await computeSubjectMastery(studentId, "geometry"),
    };

    const masteredConceptIds = masteries
      .filter(m => m.mastery >= 0.7)
      .map(m => m.conceptId);

    const studentSubjects = student.preferredSubjects || ["science", "algebra", "geometry"];
    const learningPaths: Record<string, { id: string; name: string; chapter: string; difficulty: string }[]> = {};

    for (const subj of studentSubjects) {
      const nextConcepts = getNextConcepts(masteredConceptIds, subj, student.class);
      learningPaths[subj] = nextConcepts.slice(0, 5).map(c => ({
        id: c.id,
        name: c.name,
        chapter: c.chapter,
        difficulty: c.difficulty,
      }));
    }

    // Get recent test results
    const recentTests = await TestResult.find({ studentId })
      .sort({ takenAt: -1 })
      .limit(5)
      .select("subject score totalMarks percentage takenAt testType");

    return NextResponse.json({
      concepts: masteries.map(m => {
        const concept = CONCEPTS.find(c => c.id === m.conceptId);
        return {
          ...m,
          name: concept?.name || m.conceptId,
          chapter: concept?.chapter || "",
          subject: concept?.subject || "",
          difficulty: concept?.difficulty || "medium",
        };
      }),
      weakConcepts: weakConcepts.map(w => ({
        conceptId: w.conceptId,
        mastery: w.mastery,
        name: w.concept.name,
        chapter: w.concept.chapter,
      })),
      strongConcepts: strongConcepts.map(s => ({
        conceptId: s.conceptId,
        mastery: s.mastery,
        name: s.concept.name,
        chapter: s.concept.chapter,
      })),
      chapterProgress,
      subjectProgress,
      subjectMastery,
      learningPaths,
      recentTests,
    });
  } catch (error) {
    console.error("Mastery API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { studentId, conceptId, isCorrect } = body;

    if (!studentId || !conceptId || isCorrect === undefined) {
      return NextResponse.json(
        { error: "studentId, conceptId, and isCorrect are required" },
        { status: 400 }
      );
    }

    if (!Types.ObjectId.isValid(studentId)) {
      return NextResponse.json(
        { error: "Invalid studentId format" },
        { status: 400 }
      );
    }

    const { updateConceptMastery } = await import("@/lib/test/generator");
    const updated = await updateConceptMastery(studentId, conceptId, isCorrect);

    return NextResponse.json({
      conceptId: updated.conceptId,
      mastery: updated.masteryProbability,
      attempts: updated.attempts,
      correct: updated.correct,
    });
  } catch (error) {
    console.error("Mastery update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
