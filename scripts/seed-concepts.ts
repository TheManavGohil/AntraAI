import { MongoClient } from "mongodb";
import { CONCEPTS } from "../lib/utils/constants";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/antraai";

async function seedConcepts() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db();
    const collection = db.collection("conceptmasteries");

    await collection.deleteMany({});
    console.log("Cleared existing concept data");

    const docs = CONCEPTS.map((c) => ({
      concept_id: c.id,
      name: c.name,
      subject: c.subject,
      standard: c.standard,
      chapter: c.chapter,
      chapter_num: c.chapterNum,
      prerequisites: c.prerequisites,
      bloom_level: c.bloomsLevel,
      difficulty: c.difficulty,
      mastery_threshold: c.masteryThreshold,
      created_at: new Date(),
    }));

    const result = await collection.insertMany(docs);
    console.log(`Inserted ${result.insertedCount} concepts`);

    const bySubject: Record<string, number> = {};
    const byStandard: Record<number, number> = {};
    for (const c of CONCEPTS) {
      bySubject[c.subject] = (bySubject[c.subject] || 0) + 1;
      byStandard[c.standard] = (byStandard[c.standard] || 0) + 1;
    }

    console.log("\nBy subject:", bySubject);
    console.log("By standard:", byStandard);
    console.log(`\nTotal concepts: ${CONCEPTS.length}`);

  } finally {
    await client.close();
  }
}

seedConcepts().catch(console.error);
