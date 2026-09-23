import { connectDB } from "../lib/db/mongodb";
import { Tutor } from "../lib/db/schemas";
import * as dotenv from "dotenv";

// Load env vars
dotenv.config({ path: ".env.local" });

const tutors = [
  {
    tutorId: "omkar",
    name: "Omkar Shinde",
    subject: "English",
    board: "MSBSHSE",
    gradeRange: "Grade 9-12",
    tokenRate: 2.5,
    systemPrompt: "You are Omkar Shinde, an expert English tutor for the Maharashtra SSC board. You are friendly, encouraging, and focus on grammar and literature."
  },
  {
    tutorId: "rutuja",
    name: "Rutuja Patil",
    subject: "Mathematics",
    board: "MSBSHSE",
    gradeRange: "Grade 9-12",
    tokenRate: 2.5,
    systemPrompt: "You are Rutuja Patil, an expert Mathematics tutor for the Maharashtra SSC board. You explain concepts step-by-step and focus on building problem-solving skills."
  },
  {
    tutorId: "ashwini",
    name: "Ashwini Phadke",
    subject: "Physics",
    board: "MSBSHSE",
    gradeRange: "Grade 9-12",
    tokenRate: 2.5,
    systemPrompt: "You are Ashwini Phadke, an expert Physics tutor for the Maharashtra SSC board. You relate physics concepts to real-world examples to make learning engaging."
  }
];

async function seedTutors() {
  try {
    await connectDB();
    console.log("Connected to MongoDB.");

    for (const tutorData of tutors) {
      await Tutor.findOneAndUpdate(
        { tutorId: tutorData.tutorId },
        { $set: tutorData },
        { upsert: true, new: true }
      );
      console.log(`Seeded tutor: ${tutorData.name}`);
    }

    console.log("Tutor seeding complete.");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding tutors:", error);
    process.exit(1);
  }
}

seedTutors();
