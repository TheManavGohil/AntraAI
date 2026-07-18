import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/antraai";

// Concept hierarchy from constants.ts - seeding into MongoDB for queryable access
const CONCEPTS = [
  // 9th Science
  { concept_id: "9_sc_1_newton_laws", name: "Newton's Laws of Motion", subject: "science", standard: 9, chapter: "Laws of Motion", chapter_num: 1, prerequisites: [], bloom_level: "understand", difficulty: 1 },
  { concept_id: "9_sc_1_inertia", name: "Inertia", subject: "science", standard: 9, chapter: "Laws of Motion", chapter_num: 1, prerequisites: [], bloom_level: "understand", difficulty: 1 },
  { concept_id: "9_sc_1_momentum", name: "Momentum", subject: "science", standard: 9, chapter: "Laws of Motion", chapter_num: 1, prerequisites: ["9_sc_1_newton_laws"], bloom_level: "understand", difficulty: 2 },
  { concept_id: "9_sc_1_equations_motion", name: "Equations of Motion", subject: "science", standard: 9, chapter: "Laws of Motion", chapter_num: 1, prerequisites: ["9_sc_1_newton_laws", "9_sc_1_momentum"], bloom_level: "apply", difficulty: 2 },
  { concept_id: "9_sc_2_work", name: "Work", subject: "science", standard: 9, chapter: "Work and Energy", chapter_num: 2, prerequisites: ["9_sc_1_newton_laws"], bloom_level: "understand", difficulty: 1 },
  { concept_id: "9_sc_2_energy", name: "Energy", subject: "science", standard: 9, chapter: "Work and Energy", chapter_num: 2, prerequisites: ["9_sc_2_work"], bloom_level: "understand", difficulty: 1 },
  { concept_id: "9_sc_2_kinetic_energy", name: "Kinetic Energy", subject: "science", standard: 9, chapter: "Work and Energy", chapter_num: 2, prerequisites: ["9_sc_2_energy"], bloom_level: "apply", difficulty: 2 },
  { concept_id: "9_sc_2_potential_energy", name: "Potential Energy", subject: "science", standard: 9, chapter: "Work and Energy", chapter_num: 2, prerequisites: ["9_sc_2_energy"], bloom_level: "apply", difficulty: 2 },
  { concept_id: "9_sc_2_conservation_energy", name: "Conservation of Energy", subject: "science", standard: 9, chapter: "Work and Energy", chapter_num: 2, prerequisites: ["9_sc_2_kinetic_energy", "9_sc_2_potential_energy"], bloom_level: "apply", difficulty: 3 },
  { concept_id: "9_sc_2_power", name: "Power", subject: "science", standard: 9, chapter: "Work and Energy", chapter_num: 2, prerequisites: ["9_sc_2_work"], bloom_level: "apply", difficulty: 2 },
  { concept_id: "9_sc_3_ohm_law", name: "Ohm's Law", subject: "science", standard: 9, chapter: "Current Electricity", chapter_num: 3, prerequisites: [], bloom_level: "understand", difficulty: 1 },
  { concept_id: "9_sc_3_resistance", name: "Resistance", subject: "science", standard: 9, chapter: "Current Electricity", chapter_num: 3, prerequisites: ["9_sc_3_ohm_law"], bloom_level: "understand", difficulty: 2 },
  { concept_id: "9_sc_3_series", name: "Resistors in Series", subject: "science", standard: 9, chapter: "Current Electricity", chapter_num: 3, prerequisites: ["9_sc_3_ohm_law"], bloom_level: "apply", difficulty: 2 },
  { concept_id: "9_sc_3_parallel", name: "Resistors in Parallel", subject: "science", standard: 9, chapter: "Current Electricity", chapter_num: 3, prerequisites: ["9_sc_3_ohm_law"], bloom_level: "apply", difficulty: 2 },
  { concept_id: "9_sc_4_mole_concept", name: "Mole Concept", subject: "science", standard: 9, chapter: "Measurement of Matter", chapter_num: 4, prerequisites: [], bloom_level: "understand", difficulty: 2 },
  { concept_id: "9_sc_5_acids_bases", name: "Acids, Bases and Salts", subject: "science", standard: 9, chapter: "Acids Bases and Salts", chapter_num: 5, prerequisites: [], bloom_level: "understand", difficulty: 1 },

  // 9th Algebra
  { concept_id: "9_al_1_sets", name: "Sets", subject: "algebra", standard: 9, chapter: "Sets", chapter_num: 1, prerequisites: [], bloom_level: "understand", difficulty: 1 },
  { concept_id: "9_al_1_operations_sets", name: "Operations on Sets", subject: "algebra", standard: 9, chapter: "Sets", chapter_num: 1, prerequisites: ["9_al_1_sets"], bloom_level: "apply", difficulty: 2 },
  { concept_id: "9_al_2_real_numbers", name: "Real Numbers", subject: "algebra", standard: 9, chapter: "Real Numbers", chapter_num: 2, prerequisites: [], bloom_level: "understand", difficulty: 1 },
  { concept_id: "9_al_2_surds", name: "Surds and Rationalization", subject: "algebra", standard: 9, chapter: "Real Numbers", chapter_num: 2, prerequisites: ["9_al_2_real_numbers"], bloom_level: "apply", difficulty: 2 },
  { concept_id: "9_al_3_polynomials", name: "Polynomials", subject: "algebra", standard: 9, chapter: "Polynomials", chapter_num: 3, prerequisites: [], bloom_level: "understand", difficulty: 1 },
  { concept_id: "9_al_3_remainder_thm", name: "Remainder Theorem", subject: "algebra", standard: 9, chapter: "Polynomials", chapter_num: 3, prerequisites: ["9_al_3_polynomials"], bloom_level: "apply", difficulty: 2 },
  { concept_id: "9_al_3_factor_thm", name: "Factor Theorem", subject: "algebra", standard: 9, chapter: "Polynomials", chapter_num: 3, prerequisites: ["9_al_3_polynomials", "9_al_3_remainder_thm"], bloom_level: "apply", difficulty: 2 },
  { concept_id: "9_al_4_ratio", name: "Ratio and Proportion", subject: "algebra", standard: 9, chapter: "Ratio and Proportion", chapter_num: 4, prerequisites: [], bloom_level: "understand", difficulty: 1 },
  { concept_id: "9_al_7_statistics", name: "Statistics", subject: "algebra", standard: 9, chapter: "Statistics", chapter_num: 7, prerequisites: [], bloom_level: "understand", difficulty: 1 },
  { concept_id: "9_al_7_mean", name: "Mean", subject: "algebra", standard: 9, chapter: "Statistics", chapter_num: 7, prerequisites: ["9_al_7_statistics"], bloom_level: "apply", difficulty: 1 },
  { concept_id: "9_al_7_median", name: "Median", subject: "algebra", standard: 9, chapter: "Statistics", chapter_num: 7, prerequisites: ["9_al_7_statistics"], bloom_level: "apply", difficulty: 2 },
  { concept_id: "9_al_7_mode", name: "Mode", subject: "algebra", standard: 9, chapter: "Statistics", chapter_num: 7, prerequisites: ["9_al_7_statistics"], bloom_level: "apply", difficulty: 2 },

  // 9th Geometry
  { concept_id: "9_ge_7_distance", name: "Distance Formula", subject: "geometry", standard: 9, chapter: "Coordinate Geometry", chapter_num: 7, prerequisites: [], bloom_level: "apply", difficulty: 1 },
  { concept_id: "9_ge_7_section_formula", name: "Section Formula", subject: "geometry", standard: 9, chapter: "Coordinate Geometry", chapter_num: 7, prerequisites: ["9_ge_7_distance"], bloom_level: "apply", difficulty: 2 },
  { concept_id: "9_ge_8_trig_ratios", name: "Trigonometric Ratios", subject: "geometry", standard: 9, chapter: "Trigonometry", chapter_num: 8, prerequisites: [], bloom_level: "understand", difficulty: 1 },
  { concept_id: "9_ge_8_std_angles", name: "Standard Angle Values", subject: "geometry", standard: 9, chapter: "Trigonometry", chapter_num: 8, prerequisites: ["9_ge_8_trig_ratios"], bloom_level: "remember", difficulty: 1 },
  { concept_id: "9_ge_3_triangles", name: "Triangles", subject: "geometry", standard: 9, chapter: "Triangles", chapter_num: 3, prerequisites: [], bloom_level: "understand", difficulty: 1 },
  { concept_id: "9_ge_3_exterior_angle", name: "Exterior Angle Theorem", subject: "geometry", standard: 9, chapter: "Triangles", chapter_num: 3, prerequisites: ["9_ge_3_triangles"], bloom_level: "apply", difficulty: 2 },

  // 10th Science
  { concept_id: "10_sc_1_gravitation", name: "Newton's Law of Gravitation", subject: "science", standard: 10, chapter: "Gravitation", chapter_num: 1, prerequisites: ["9_sc_1_newton_laws"], bloom_level: "understand", difficulty: 2 },
  { concept_id: "10_sc_1_free_fall", name: "Free Fall", subject: "science", standard: 10, chapter: "Gravitation", chapter_num: 1, prerequisites: ["10_sc_1_gravitation", "9_sc_1_equations_motion"], bloom_level: "apply", difficulty: 2 },
  { concept_id: "10_sc_1_escape_velocity", name: "Escape Velocity", subject: "science", standard: 10, chapter: "Gravitation", chapter_num: 1, prerequisites: ["10_sc_1_gravitation"], bloom_level: "apply", difficulty: 3 },
  { concept_id: "10_sc_2_periodic_table", name: "Periodic Classification", subject: "science", standard: 10, chapter: "Periodic Classification", chapter_num: 2, prerequisites: [], bloom_level: "understand", difficulty: 1 },
  { concept_id: "10_sc_3_chemical_reactions", name: "Chemical Reactions", subject: "science", standard: 10, chapter: "Chemical Reactions", chapter_num: 3, prerequisites: ["9_sc_4_mole_concept"], bloom_level: "understand", difficulty: 2 },
  { concept_id: "10_sc_4_electric_current", name: "Effects of Electric Current", subject: "science", standard: 10, chapter: "Effects of Electric Current", chapter_num: 4, prerequisites: ["9_sc_3_ohm_law", "9_sc_3_resistance"], bloom_level: "apply", difficulty: 2 },
  { concept_id: "10_sc_4_heating_effect", name: "Heating Effect of Current", subject: "science", standard: 10, chapter: "Effects of Electric Current", chapter_num: 4, prerequisites: ["10_sc_4_electric_current"], bloom_level: "apply", difficulty: 2 },
  { concept_id: "10_sc_6_refraction", name: "Refraction of Light", subject: "science", standard: 10, chapter: "Refraction of Light", chapter_num: 6, prerequisites: [], bloom_level: "understand", difficulty: 2 },
  { concept_id: "10_sc_6_snell_law", name: "Snell's Law", subject: "science", standard: 10, chapter: "Refraction of Light", chapter_num: 6, prerequisites: ["10_sc_6_refraction"], bloom_level: "apply", difficulty: 2 },

  // 10th Algebra
  { concept_id: "10_al_2_quadratic_eq", name: "Quadratic Equations", subject: "algebra", standard: 10, chapter: "Quadratic Equations", chapter_num: 2, prerequisites: ["9_al_3_polynomials"], bloom_level: "understand", difficulty: 2 },
  { concept_id: "10_al_2_discriminant", name: "Discriminant", subject: "algebra", standard: 10, chapter: "Quadratic Equations", chapter_num: 2, prerequisites: ["10_al_2_quadratic_eq"], bloom_level: "apply", difficulty: 2 },
  { concept_id: "10_al_2_quad_formula", name: "Quadratic Formula", subject: "algebra", standard: 10, chapter: "Quadratic Equations", chapter_num: 2, prerequisites: ["10_al_2_quadratic_eq", "10_al_2_discriminant"], bloom_level: "apply", difficulty: 3 },
  { concept_id: "10_al_3_ap", name: "Arithmetic Progression", subject: "algebra", standard: 10, chapter: "Arithmetic Progression", chapter_num: 3, prerequisites: [], bloom_level: "understand", difficulty: 2 },
  { concept_id: "10_al_3_ap_nth", name: "nth Term of AP", subject: "algebra", standard: 10, chapter: "Arithmetic Progression", chapter_num: 3, prerequisites: ["10_al_3_ap"], bloom_level: "apply", difficulty: 2 },
  { concept_id: "10_al_3_ap_sum", name: "Sum of AP", subject: "algebra", standard: 10, chapter: "Arithmetic Progression", chapter_num: 3, prerequisites: ["10_al_3_ap", "10_al_3_ap_nth"], bloom_level: "apply", difficulty: 3 },

  // 10th Geometry
  { concept_id: "10_ge_1_similarity", name: "Similarity of Triangles", subject: "geometry", standard: 10, chapter: "Similarity", chapter_num: 1, prerequisites: ["9_ge_3_triangles"], bloom_level: "understand", difficulty: 2 },
  { concept_id: "10_ge_1_thales", name: "Basic Proportionality Theorem", subject: "geometry", standard: 10, chapter: "Similarity", chapter_num: 1, prerequisites: ["10_ge_1_similarity"], bloom_level: "apply", difficulty: 3 },
  { concept_id: "10_ge_2_pythagoras", name: "Pythagoras Theorem", subject: "geometry", standard: 10, chapter: "Pythagoras Theorem", chapter_num: 2, prerequisites: ["9_ge_3_triangles"], bloom_level: "apply", difficulty: 2 },
  { concept_id: "10_ge_6_trig_identities", name: "Trigonometric Identities", subject: "geometry", standard: 10, chapter: "Trigonometry", chapter_num: 6, prerequisites: ["9_ge_8_trig_ratios", "9_ge_8_std_angles"], bloom_level: "apply", difficulty: 2 },
];

async function seedConcepts() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db();
    const collection = db.collection("conceptmasteries");

    // Clear existing concepts
    await collection.deleteMany({});
    console.log("Cleared existing concept data");

    // Insert all concepts
    const docs = CONCEPTS.map((c) => ({
      ...c,
      created_at: new Date(),
      updated_at: new Date(),
    }));

    const result = await collection.insertMany(docs);
    console.log(`Inserted ${result.insertedCount} concepts`);

    // Show summary
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
