import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { Tutor } from "@/lib/db/schemas";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tutorId: string }> }
) {
  try {
    await connectDB();

    const resolvedParams = await params;

    const tutor = await Tutor.findOne({ tutorId: resolvedParams.tutorId });

    if (!tutor) {
      return NextResponse.json({ error: "Tutor not found" }, { status: 404 });
    }

    return NextResponse.json({ tutor });
  } catch (error) {
    console.error("Fetch tutor error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
