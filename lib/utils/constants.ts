export interface Concept {
  id: string;
  name: string;
  chapter: string;
  chapterNum: number;
  subject: "science" | "algebra" | "geometry";
  standard: 9 | 10;
  difficulty: "easy" | "medium" | "hard";
  bloomsLevel: "Remember" | "Understand" | "Apply" | "Analyze" | "Evaluate" | "Create";
  prerequisites: string[];
  masteryThreshold: number;
}

export interface Chapter {
  id: string;
  name: string;
  number: number;
  subject: "science" | "algebra" | "geometry";
  standard: 9 | 10;
}

export const SUBJECTS = [
  { id: "science", name: "Science & Technology", icon: "🔬", color: "#10B981" },
  { id: "algebra", name: "Mathematics - Algebra", icon: "📐", color: "#3B82F6" },
  { id: "geometry", name: "Mathematics - Geometry", icon: "📏", color: "#8B5CF6" },
] as const;

export const COMMAND_WORDS: Record<string, { meaning: string; format: string }> = {
  "Give scientific reason": {
    meaning: "State the fact, give the scientific principle, connect them logically",
    format: "Statement → Scientific Principle → Logical Connection → Concluding line",
  },
  Explain: {
    meaning: "Describe in detail with reasoning",
    format: "Definition → Detailed Explanation → Example",
  },
  Justify: {
    meaning: "Prove a statement is correct with evidence",
    format: "Statement → Supporting Reasons/Examples → Conclusion",
  },
  "State with example": {
    meaning: "Give the definition and illustrate with a concrete example",
    format: "Definition/Statement + Concrete Example",
  },
  "Distinguish between": {
    meaning: "Compare two concepts in a structured format",
    format: "Table or point-by-point comparison",
  },
  Define: {
    meaning: "Give a precise definition as in the textbook",
    format: "Formal definition in one or two sentences",
  },
  "Write short note": {
    meaning: "Brief but comprehensive note covering key aspects",
    format: "4-6 sentences covering definition, key features, significance",
  },
  "Observe and answer": {
    meaning: "Look at a diagram/picture and respond to sub-questions",
    format: "Identify → Describe → Answer based on visual",
  },
};

export const GRADING_RUBRIC: Record<string, { marks: number; criteria: string[] }> = {
  MCQ: { marks: 1, criteria: ["Exact match with correct option"] },
  "very_short": { marks: 1, criteria: ["One-word or one-line answer", "Factually correct"] },
  "short_2mark": { marks: 2, criteria: ["Concise, to-the-point response", "2-4 sentences", "Covers key concept"] },
  "short_3mark": { marks: 3, criteria: ["Definition/Introduction", "Detailed explanation with reasoning", "Example or conclusion"] },
  "long_5mark": { marks: 5, criteria: ["Given data / context", "Formula / principle", "Step-by-step solution", "Final answer with units", "Diagram if applicable"] },
};

export const CHAPTERS: Chapter[] = [
  // 9th Standard - Algebra
  { id: "std9_alg_ch1", name: "Sets", number: 1, subject: "algebra", standard: 9 },
  { id: "std9_alg_ch2", name: "Real Numbers", number: 2, subject: "algebra", standard: 9 },
  { id: "std9_alg_ch3", name: "Polynomials", number: 3, subject: "algebra", standard: 9 },
  { id: "std9_alg_ch4", name: "Ratio and Proportion", number: 4, subject: "algebra", standard: 9 },
  { id: "std9_alg_ch5", name: "Linear Equations in Two Variables", number: 5, subject: "algebra", standard: 9 },
  { id: "std9_alg_ch6", name: "Financial Planning", number: 6, subject: "algebra", standard: 9 },
  { id: "std9_alg_ch7", name: "Statistics", number: 7, subject: "algebra", standard: 9 },

  // 9th Standard - Geometry
  { id: "std9_geo_ch1", name: "Basic Concepts in Geometry", number: 1, subject: "geometry", standard: 9 },
  { id: "std9_geo_ch2", name: "Parallel Lines", number: 2, subject: "geometry", standard: 9 },
  { id: "std9_geo_ch3", name: "Triangles", number: 3, subject: "geometry", standard: 9 },
  { id: "std9_geo_ch4", name: "Construction of Triangles", number: 4, subject: "geometry", standard: 9 },
  { id: "std9_geo_ch5", name: "Quadrilaterals", number: 5, subject: "geometry", standard: 9 },
  { id: "std9_geo_ch6", name: "Circle", number: 6, subject: "geometry", standard: 9 },
  { id: "std9_geo_ch7", name: "Coordinate Geometry", number: 7, subject: "geometry", standard: 9 },
  { id: "std9_geo_ch8", name: "Trigonometry", number: 8, subject: "geometry", standard: 9 },
  { id: "std9_geo_ch9", name: "Surface Area and Volume", number: 9, subject: "geometry", standard: 9 },

  // 9th Standard - Science
  { id: "std9_sci_ch1", name: "Laws of Motion", number: 1, subject: "science", standard: 9 },
  { id: "std9_sci_ch2", name: "Work and Energy", number: 2, subject: "science", standard: 9 },
  { id: "std9_sci_ch3", name: "Current Electricity", number: 3, subject: "science", standard: 9 },
  { id: "std9_sci_ch4", name: "Measurement of Matter", number: 4, subject: "science", standard: 9 },
  { id: "std9_sci_ch5", name: "Acids, Bases and Salts", number: 5, subject: "science", standard: 9 },
  { id: "std9_sci_ch6", name: "Classification of Plants", number: 6, subject: "science", standard: 9 },
  { id: "std9_sci_ch7", name: "Energy Flow in an Ecosystem", number: 7, subject: "science", standard: 9 },
  { id: "std9_sci_ch8", name: "Useful and Harmful Microbes", number: 8, subject: "science", standard: 9 },
  { id: "std9_sci_ch9", name: "Environmental Management", number: 9, subject: "science", standard: 9 },
  { id: "std9_sci_ch10", name: "Reflection of Light", number: 10, subject: "science", standard: 9 },
  { id: "std9_sci_ch11", name: "Study of Sound", number: 11, subject: "science", standard: 9 },
  { id: "std9_sci_ch12", name: "Carbon: An Important Element", number: 12, subject: "science", standard: 9 },
  { id: "std9_sci_ch13", name: "Substances in Common Use", number: 13, subject: "science", standard: 9 },
  { id: "std9_sci_ch14", name: "Life Processes", number: 14, subject: "science", standard: 9 },
  { id: "std9_sci_ch15", name: "Heredity and Variation", number: 15, subject: "science", standard: 9 },
  { id: "std9_sci_ch16", name: "Introduction to Biotechnology", number: 16, subject: "science", standard: 9 },
  { id: "std9_sci_ch17", name: "Observing Space: Telescopes", number: 17, subject: "science", standard: 9 },

  // 10th Standard - Algebra
  { id: "std10_alg_ch1", name: "Linear Equations in Two Variables", number: 1, subject: "algebra", standard: 10 },
  { id: "std10_alg_ch2", name: "Quadratic Equations", number: 2, subject: "algebra", standard: 10 },
  { id: "std10_alg_ch3", name: "Arithmetic Progression", number: 3, subject: "algebra", standard: 10 },
  { id: "std10_alg_ch4", name: "Financial Planning", number: 4, subject: "algebra", standard: 10 },
  { id: "std10_alg_ch5", name: "Probability", number: 5, subject: "algebra", standard: 10 },
  { id: "std10_alg_ch6", name: "Statistics", number: 6, subject: "algebra", standard: 10 },

  // 10th Standard - Geometry
  { id: "std10_geo_ch1", name: "Similarity", number: 1, subject: "geometry", standard: 10 },
  { id: "std10_geo_ch2", name: "Pythagoras Theorem", number: 2, subject: "geometry", standard: 10 },
  { id: "std10_geo_ch3", name: "Circle", number: 3, subject: "geometry", standard: 10 },
  { id: "std10_geo_ch4", name: "Geometric Constructions", number: 4, subject: "geometry", standard: 10 },
  { id: "std10_geo_ch5", name: "Coordinate Geometry", number: 5, subject: "geometry", standard: 10 },
  { id: "std10_geo_ch6", name: "Trigonometry", number: 6, subject: "geometry", standard: 10 },
  { id: "std10_geo_ch7", name: "Mensuration", number: 7, subject: "geometry", standard: 10 },

  // 10th Standard - Science
  { id: "std10_sci_ch1", name: "Gravitation", number: 1, subject: "science", standard: 10 },
  { id: "std10_sci_ch2", name: "Periodic Classification of Elements", number: 2, subject: "science", standard: 10 },
  { id: "std10_sci_ch3", name: "Chemical Reactions and Equations", number: 3, subject: "science", standard: 10 },
  { id: "std10_sci_ch4", name: "Effects of Electric Current", number: 4, subject: "science", standard: 10 },
  { id: "std10_sci_ch5", name: "Heat", number: 5, subject: "science", standard: 10 },
  { id: "std10_sci_ch6", name: "Refraction of Light", number: 6, subject: "science", standard: 10 },
  { id: "std10_sci_ch7", name: "Lenses", number: 7, subject: "science", standard: 10 },
  { id: "std10_sci_ch8", name: "Metallurgy", number: 8, subject: "science", standard: 10 },
  { id: "std10_sci_ch9", name: "Carbon Compounds", number: 9, subject: "science", standard: 10 },
  { id: "std10_sci_ch10", name: "Space Missions", number: 10, subject: "science", standard: 10 },
];

export const CONCEPTS: Concept[] = [
  // === 9th ALGEBRA ===
  {
    id: "std9_alg_ch1_types_of_sets", name: "Types of Sets", chapter: "Sets", chapterNum: 1,
    subject: "algebra", standard: 9, difficulty: "easy", bloomsLevel: "Remember",
    prerequisites: [], masteryThreshold: 0.7,
  },
  {
    id: "std9_alg_ch1_operations_sets", name: "Operations on Sets", chapter: "Sets", chapterNum: 1,
    subject: "algebra", standard: 9, difficulty: "medium", bloomsLevel: "Apply",
    prerequisites: ["std9_alg_ch1_types_of_sets"], masteryThreshold: 0.7,
  },
  {
    id: "std9_alg_ch1_venn_diagrams", name: "Venn Diagrams", chapter: "Sets", chapterNum: 1,
    subject: "algebra", standard: 9, difficulty: "medium", bloomsLevel: "Apply",
    prerequisites: ["std9_alg_ch1_operations_sets"], masteryThreshold: 0.7,
  },
  {
    id: "std9_alg_ch2_rational_numbers", name: "Rational Numbers", chapter: "Real Numbers", chapterNum: 2,
    subject: "algebra", standard: 9, difficulty: "easy", bloomsLevel: "Remember",
    prerequisites: [], masteryThreshold: 0.7,
  },
  {
    id: "std9_alg_ch2_irrational_numbers", name: "Irrational Numbers", chapter: "Real Numbers", chapterNum: 2,
    subject: "algebra", standard: 9, difficulty: "medium", bloomsLevel: "Understand",
    prerequisites: ["std9_alg_ch2_rational_numbers"], masteryThreshold: 0.7,
  },
  {
    id: "std9_alg_ch2_surds", name: "Surds and Rationalization", chapter: "Real Numbers", chapterNum: 2,
    subject: "algebra", standard: 9, difficulty: "medium", bloomsLevel: "Apply",
    prerequisites: ["std9_alg_ch2_irrational_numbers"], masteryThreshold: 0.7,
  },
  {
    id: "std9_alg_ch3_degree_of_polynomial", name: "Degree of Polynomial", chapter: "Polynomials", chapterNum: 3,
    subject: "algebra", standard: 9, difficulty: "easy", bloomsLevel: "Remember",
    prerequisites: [], masteryThreshold: 0.7,
  },
  {
    id: "std9_alg_ch3_remainder_theorem", name: "Remainder Theorem", chapter: "Polynomials", chapterNum: 3,
    subject: "algebra", standard: 9, difficulty: "medium", bloomsLevel: "Apply",
    prerequisites: ["std9_alg_ch3_degree_of_polynomial"], masteryThreshold: 0.7,
  },
  {
    id: "std9_alg_ch3_factor_theorem", name: "Factor Theorem", chapter: "Polynomials", chapterNum: 3,
    subject: "algebra", standard: 9, difficulty: "medium", bloomsLevel: "Apply",
    prerequisites: ["std9_alg_ch3_remainder_theorem"], masteryThreshold: 0.7,
  },
  {
    id: "std9_alg_ch4_ratio_properties", name: "Properties of Ratio", chapter: "Ratio and Proportion", chapterNum: 4,
    subject: "algebra", standard: 9, difficulty: "easy", bloomsLevel: "Remember",
    prerequisites: [], masteryThreshold: 0.7,
  },
  {
    id: "std9_alg_ch4_k_method", name: "K-Method", chapter: "Ratio and Proportion", chapterNum: 4,
    subject: "algebra", standard: 9, difficulty: "medium", bloomsLevel: "Apply",
    prerequisites: ["std9_alg_ch4_ratio_properties"], masteryThreshold: 0.7,
  },
  {
    id: "std9_alg_ch4_variation", name: "Direct and Inverse Variation", chapter: "Ratio and Proportion", chapterNum: 4,
    subject: "algebra", standard: 9, difficulty: "medium", bloomsLevel: "Analyze",
    prerequisites: ["std9_alg_ch4_ratio_properties"], masteryThreshold: 0.7,
  },
  {
    id: "std9_alg_ch5_linear_equations", name: "Solving Linear Equations", chapter: "Linear Equations in Two Variables", chapterNum: 5,
    subject: "algebra", standard: 9, difficulty: "medium", bloomsLevel: "Apply",
    prerequisites: [], masteryThreshold: 0.7,
  },
  {
    id: "std9_alg_ch5_graph_linear", name: "Graph of Linear Equation", chapter: "Linear Equations in Two Variables", chapterNum: 5,
    subject: "algebra", standard: 9, difficulty: "medium", bloomsLevel: "Apply",
    prerequisites: ["std9_alg_ch5_linear_equations"], masteryThreshold: 0.7,
  },
  {
    id: "std9_alg_ch6_gst", name: "GST (Goods and Services Tax)", chapter: "Financial Planning", chapterNum: 6,
    subject: "algebra", standard: 9, difficulty: "medium", bloomsLevel: "Apply",
    prerequisites: [], masteryThreshold: 0.7,
  },
  {
    id: "std9_alg_ch6_shares", name: "Shares and Dividends", chapter: "Financial Planning", chapterNum: 6,
    subject: "algebra", standard: 9, difficulty: "hard", bloomsLevel: "Analyze",
    prerequisites: ["std9_alg_ch6_gst"], masteryThreshold: 0.7,
  },
  {
    id: "std9_alg_ch7_mean_median_mode", name: "Mean, Median, Mode", chapter: "Statistics", chapterNum: 7,
    subject: "algebra", standard: 9, difficulty: "medium", bloomsLevel: "Apply",
    prerequisites: [], masteryThreshold: 0.7,
  },
  {
    id: "std9_alg_ch7_frequency_distribution", name: "Frequency Distribution Table", chapter: "Statistics", chapterNum: 7,
    subject: "algebra", standard: 9, difficulty: "medium", bloomsLevel: "Apply",
    prerequisites: ["std9_alg_ch7_mean_median_mode"], masteryThreshold: 0.7,
  },

  // === 9th GEOMETRY ===
  {
    id: "std9_geo_ch1_line_segment", name: "Line Segment, Ray, Line", chapter: "Basic Concepts in Geometry", chapterNum: 1,
    subject: "geometry", standard: 9, difficulty: "easy", bloomsLevel: "Remember",
    prerequisites: [], masteryThreshold: 0.7,
  },
  {
    id: "std9_geo_ch1_betweenness", name: "Betweenness and Collinearity", chapter: "Basic Concepts in Geometry", chapterNum: 1,
    subject: "geometry", standard: 9, difficulty: "easy", bloomsLevel: "Remember",
    prerequisites: ["std9_geo_ch1_line_segment"], masteryThreshold: 0.7,
  },
  {
    id: "std9_geo_ch2_tests_parallel", name: "Tests for Parallel Lines", chapter: "Parallel Lines", chapterNum: 2,
    subject: "geometry", standard: 9, difficulty: "medium", bloomsLevel: "Apply",
    prerequisites: [], masteryThreshold: 0.7,
  },
  {
    id: "std9_geo_ch2_transversal", name: "Properties of Transversal", chapter: "Parallel Lines", chapterNum: 2,
    subject: "geometry", standard: 9, difficulty: "medium", bloomsLevel: "Apply",
    prerequisites: ["std9_geo_ch2_tests_parallel"], masteryThreshold: 0.7,
  },
  {
    id: "std9_geo_ch3_types_triangles", name: "Types and Properties of Triangles", chapter: "Triangles", chapterNum: 3,
    subject: "geometry", standard: 9, difficulty: "easy", bloomsLevel: "Remember",
    prerequisites: [], masteryThreshold: 0.7,
  },
  {
    id: "std9_geo_ch3_exterior_angle", name: "Exterior Angle Theorem", chapter: "Triangles", chapterNum: 3,
    subject: "geometry", standard: 9, difficulty: "medium", bloomsLevel: "Apply",
    prerequisites: ["std9_geo_ch3_types_triangles"], masteryThreshold: 0.7,
  },
  {
    id: "std9_geo_ch3_special_triangles", name: "30-60-90 and 45-45-90 Triangles", chapter: "Triangles", chapterNum: 3,
    subject: "geometry", standard: 9, difficulty: "hard", bloomsLevel: "Apply",
    prerequisites: ["std9_geo_ch3_exterior_angle"], masteryThreshold: 0.7,
  },
  {
    id: "std9_geo_ch4_construction", name: "Construction of Triangles", chapter: "Construction of Triangles", chapterNum: 4,
    subject: "geometry", standard: 9, difficulty: "medium", bloomsLevel: "Apply",
    prerequisites: ["std9_geo_ch3_types_triangles"], masteryThreshold: 0.7,
  },
  {
    id: "std9_geo_ch5_parallelogram", name: "Properties of Parallelogram", chapter: "Quadrilaterals", chapterNum: 5,
    subject: "geometry", standard: 9, difficulty: "medium", bloomsLevel: "Understand",
    prerequisites: [], masteryThreshold: 0.7,
  },
  {
    id: "std9_geo_ch5_midpoint_theorem", name: "Midpoint Theorem", chapter: "Quadrilaterals", chapterNum: 5,
    subject: "geometry", standard: 9, difficulty: "hard", bloomsLevel: "Apply",
    prerequisites: ["std9_geo_ch5_parallelogram"], masteryThreshold: 0.7,
  },
  {
    id: "std9_geo_ch6_circle_basics", name: "Chords, Arcs, Sectors", chapter: "Circle", chapterNum: 6,
    subject: "geometry", standard: 9, difficulty: "easy", bloomsLevel: "Remember",
    prerequisites: [], masteryThreshold: 0.7,
  },
  {
    id: "std9_geo_ch6_incircle_circumcircle", name: "Incircle and Circumcircle", chapter: "Circle", chapterNum: 6,
    subject: "geometry", standard: 9, difficulty: "hard", bloomsLevel: "Apply",
    prerequisites: ["std9_geo_ch6_circle_basics"], masteryThreshold: 0.7,
  },
  {
    id: "std9_geo_ch7_distance_formula", name: "Distance Formula", chapter: "Coordinate Geometry", chapterNum: 7,
    subject: "geometry", standard: 9, difficulty: "medium", bloomsLevel: "Apply",
    prerequisites: [], masteryThreshold: 0.7,
  },
  {
    id: "std9_geo_ch7_section_formula", name: "Section Formula", chapter: "Coordinate Geometry", chapterNum: 7,
    subject: "geometry", standard: 9, difficulty: "medium", bloomsLevel: "Apply",
    prerequisites: ["std9_geo_ch7_distance_formula"], masteryThreshold: 0.7,
  },
  {
    id: "std9_geo_ch8_trig_ratios", name: "Trigonometric Ratios", chapter: "Trigonometry", chapterNum: 8,
    subject: "geometry", standard: 9, difficulty: "medium", bloomsLevel: "Remember",
    prerequisites: [], masteryThreshold: 0.7,
  },
  {
    id: "std9_geo_ch8_standard_ratios", name: "Ratios of 0, 30, 45, 60, 90 Degrees", chapter: "Trigonometry", chapterNum: 8,
    subject: "geometry", standard: 9, difficulty: "hard", bloomsLevel: "Apply",
    prerequisites: ["std9_geo_ch8_trig_ratios"], masteryThreshold: 0.7,
  },
  {
    id: "std9_geo_ch9_surface_area", name: "Surface Area of 3D Shapes", chapter: "Surface Area and Volume", chapterNum: 9,
    subject: "geometry", standard: 9, difficulty: "medium", bloomsLevel: "Apply",
    prerequisites: [], masteryThreshold: 0.7,
  },
  {
    id: "std9_geo_ch9_volume", name: "Volume of 3D Shapes", chapter: "Surface Area and Volume", chapterNum: 9,
    subject: "geometry", standard: 9, difficulty: "medium", bloomsLevel: "Apply",
    prerequisites: ["std9_geo_ch9_surface_area"], masteryThreshold: 0.7,
  },

  // === 9th SCIENCE ===
  {
    id: "std9_sci_ch1_newtons_laws", name: "Newton's Laws of Motion", chapter: "Laws of Motion", chapterNum: 1,
    subject: "science", standard: 9, difficulty: "medium", bloomsLevel: "Understand",
    prerequisites: [], masteryThreshold: 0.7,
  },
  {
    id: "std9_sci_ch1_inertia", name: "Inertia and Mass", chapter: "Laws of Motion", chapterNum: 1,
    subject: "science", standard: 9, difficulty: "easy", bloomsLevel: "Remember",
    prerequisites: [], masteryThreshold: 0.7,
  },
  {
    id: "std9_sci_ch1_momentum", name: "Momentum and Impulse", chapter: "Laws of Motion", chapterNum: 1,
    subject: "science", standard: 9, difficulty: "hard", bloomsLevel: "Apply",
    prerequisites: ["std9_sci_ch1_newtons_laws"], masteryThreshold: 0.7,
  },
  {
    id: "std9_sci_ch1_equations_motion", name: "Equations of Motion", chapter: "Laws of Motion", chapterNum: 1,
    subject: "science", standard: 9, difficulty: "hard", bloomsLevel: "Apply",
    prerequisites: ["std9_sci_ch1_momentum"], masteryThreshold: 0.7,
  },
  {
    id: "std9_sci_ch2_types_energy", name: "Types of Energy", chapter: "Work and Energy", chapterNum: 2,
    subject: "science", standard: 9, difficulty: "easy", bloomsLevel: "Remember",
    prerequisites: [], masteryThreshold: 0.7,
  },
  {
    id: "std9_sci_ch2_kinetic_potential", name: "Kinetic and Potential Energy", chapter: "Work and Energy", chapterNum: 2,
    subject: "science", standard: 9, difficulty: "medium", bloomsLevel: "Understand",
    prerequisites: ["std9_sci_ch2_types_energy"], masteryThreshold: 0.7,
  },
  {
    id: "std9_sci_ch2_conservation_energy", name: "Law of Conservation of Energy", chapter: "Work and Energy", chapterNum: 2,
    subject: "science", standard: 9, difficulty: "hard", bloomsLevel: "Apply",
    prerequisites: ["std9_sci_ch2_kinetic_potential"], masteryThreshold: 0.7,
  },
  {
    id: "std9_sci_ch3_ohms_law", name: "Ohm's Law", chapter: "Current Electricity", chapterNum: 3,
    subject: "science", standard: 9, difficulty: "medium", bloomsLevel: "Apply",
    prerequisites: [], masteryThreshold: 0.7,
  },
  {
    id: "std9_sci_ch3_resistors_series_parallel", name: "Resistors in Series and Parallel", chapter: "Current Electricity", chapterNum: 3,
    subject: "science", standard: 9, difficulty: "hard", bloomsLevel: "Apply",
    prerequisites: ["std9_sci_ch3_ohms_law"], masteryThreshold: 0.7,
  },
  {
    id: "std9_sci_ch3_electric_circuits", name: "Electric Circuits and Components", chapter: "Current Electricity", chapterNum: 3,
    subject: "science", standard: 9, difficulty: "medium", bloomsLevel: "Understand",
    prerequisites: ["std9_sci_ch3_ohms_law"], masteryThreshold: 0.7,
  },
  {
    id: "std9_sci_ch4_mole_concept", name: "Mole Concept", chapter: "Measurement of Matter", chapterNum: 4,
    subject: "science", standard: 9, difficulty: "hard", bloomsLevel: "Apply",
    prerequisites: [], masteryThreshold: 0.7,
  },
  {
    id: "std9_sci_ch4_valency_ions", name: "Valency and Ions", chapter: "Measurement of Matter", chapterNum: 4,
    subject: "science", standard: 9, difficulty: "medium", bloomsLevel: "Remember",
    prerequisites: [], masteryThreshold: 0.7,
  },
  {
    id: "std9_sci_ch5_ph_scale", name: "pH Scale", chapter: "Acids, Bases and Salts", chapterNum: 5,
    subject: "science", standard: 9, difficulty: "medium", bloomsLevel: "Understand",
    prerequisites: [], masteryThreshold: 0.7,
  },
  {
    id: "std9_sci_ch5_neutralization", name: "Neutralization Reactions", chapter: "Acids, Bases and Salts", chapterNum: 5,
    subject: "science", standard: 9, difficulty: "medium", bloomsLevel: "Apply",
    prerequisites: ["std9_sci_ch5_ph_scale"], masteryThreshold: 0.7,
  },
  {
    id: "std9_sci_ch10_reflection_mirrors", name: "Reflection by Spherical Mirrors", chapter: "Reflection of Light", chapterNum: 10,
    subject: "science", standard: 9, difficulty: "hard", bloomsLevel: "Apply",
    prerequisites: [], masteryThreshold: 0.7,
  },
  {
    id: "std9_sci_ch10_mirror_formula", name: "Mirror Equation and Sign Convention", chapter: "Reflection of Light", chapterNum: 10,
    subject: "science", standard: 9, difficulty: "hard", bloomsLevel: "Apply",
    prerequisites: ["std9_sci_ch10_reflection_mirrors"], masteryThreshold: 0.7,
  },
  {
    id: "std9_sci_ch11_sound_waves", name: "Sound Waves and Properties", chapter: "Study of Sound", chapterNum: 11,
    subject: "science", standard: 9, difficulty: "medium", bloomsLevel: "Understand",
    prerequisites: [], masteryThreshold: 0.7,
  },
  {
    id: "std9_sci_ch11_echo_reverberation", name: "Echo and Reverberation", chapter: "Study of Sound", chapterNum: 11,
    subject: "science", standard: 9, difficulty: "medium", bloomsLevel: "Apply",
    prerequisites: ["std9_sci_ch11_sound_waves"], masteryThreshold: 0.7,
  },
  {
    id: "std9_sci_ch12_carbon_bonding", name: "Carbon: Covalent Bonding", chapter: "Carbon: An Important Element", chapterNum: 12,
    subject: "science", standard: 9, difficulty: "medium", bloomsLevel: "Understand",
    prerequisites: [], masteryThreshold: 0.7,
  },
  {
    id: "std9_sci_ch12_hydrocarbons", name: "Hydrocarbons", chapter: "Carbon: An Important Element", chapterNum: 12,
    subject: "science", standard: 9, difficulty: "hard", bloomsLevel: "Apply",
    prerequisites: ["std9_sci_ch12_carbon_bonding"], masteryThreshold: 0.7,
  },
  {
    id: "std9_sci_ch14_life_processes", name: "Life Processes: Transportation", chapter: "Life Processes", chapterNum: 14,
    subject: "science", standard: 9, difficulty: "medium", bloomsLevel: "Understand",
    prerequisites: [], masteryThreshold: 0.7,
  },
  {
    id: "std9_sci_ch14_excretion", name: "Excretion in Humans", chapter: "Life Processes", chapterNum: 14,
    subject: "science", standard: 9, difficulty: "medium", bloomsLevel: "Understand",
    prerequisites: ["std9_sci_ch14_life_processes"], masteryThreshold: 0.7,
  },
  {
    id: "std9_sci_ch15_dna_rna", name: "DNA and RNA", chapter: "Heredity and Variation", chapterNum: 15,
    subject: "science", standard: 9, difficulty: "hard", bloomsLevel: "Understand",
    prerequisites: [], masteryThreshold: 0.7,
  },
  {
    id: "std9_sci_ch15_mendels_laws", name: "Mendel's Laws of Inheritance", chapter: "Heredity and Variation", chapterNum: 15,
    subject: "science", standard: 9, difficulty: "hard", bloomsLevel: "Apply",
    prerequisites: ["std9_sci_ch15_dna_rna"], masteryThreshold: 0.7,
  },

  // 9th Science - Ch6: Classification of Plants
  {
    id: "std9_sci_ch6_plant_classification", name: "Plant Classification Systems", chapter: "Classification of Plants", chapterNum: 6,
    subject: "science", standard: 9, difficulty: "medium", bloomsLevel: "Remember",
    prerequisites: [], masteryThreshold: 0.7,
  },
  {
    id: "std9_sci_ch6_taxonomic_hierarchy", name: "Taxonomic Hierarchy", chapter: "Classification of Plants", chapterNum: 6,
    subject: "science", standard: 9, difficulty: "medium", bloomsLevel: "Understand",
    prerequisites: ["std9_sci_ch6_plant_classification"], masteryThreshold: 0.7,
  },
  {
    id: "std9_sci_ch6_botanical_names", name: "Botanical Nomenclature", chapter: "Classification of Plants", chapterNum: 6,
    subject: "science", standard: 9, difficulty: "easy", bloomsLevel: "Remember",
    prerequisites: ["std9_sci_ch6_plant_classification"], masteryThreshold: 0.7,
  },

  // 9th Science - Ch7: Energy Flow in an Ecosystem
  {
    id: "std9_sci_ch7_food_chain", name: "Food Chain and Food Web", chapter: "Energy Flow in an Ecosystem", chapterNum: 7,
    subject: "science", standard: 9, difficulty: "medium", bloomsLevel: "Understand",
    prerequisites: [], masteryThreshold: 0.7,
  },
  {
    id: "std9_sci_ch7_trophic_levels", name: "Trophic Levels and Energy Flow", chapter: "Energy Flow in an Ecosystem", chapterNum: 7,
    subject: "science", standard: 9, difficulty: "medium", bloomsLevel: "Apply",
    prerequisites: ["std9_sci_ch7_food_chain"], masteryThreshold: 0.7,
  },
  {
    id: "std9_sci_ch7_ecological_pyramids", name: "Ecological Pyramids", chapter: "Energy Flow in an Ecosystem", chapterNum: 7,
    subject: "science", standard: 9, difficulty: "hard", bloomsLevel: "Analyze",
    prerequisites: ["std9_sci_ch7_trophic_levels"], masteryThreshold: 0.7,
  },

  // 9th Science - Ch8: Useful and Harmful Microbes
  {
    id: "std9_sci_ch8_useful_bacteria", name: "Useful Bacteria in Daily Life", chapter: "Useful and Harmful Microbes", chapterNum: 8,
    subject: "science", standard: 9, difficulty: "medium", bloomsLevel: "Remember",
    prerequisites: [], masteryThreshold: 0.7,
  },
  {
    id: "std9_sci_ch8_food_microbes", name: "Microbes in Food Production", chapter: "Useful and Harmful Microbes", chapterNum: 8,
    subject: "science", standard: 9, difficulty: "medium", bloomsLevel: "Understand",
    prerequisites: ["std9_sci_ch8_useful_bacteria"], masteryThreshold: 0.7,
  },
  {
    id: "std9_sci_ch8_pathogenic_microbes", name: "Pathogenic Microbes and Diseases", chapter: "Useful and Harmful Microbes", chapterNum: 8,
    subject: "science", standard: 9, difficulty: "hard", bloomsLevel: "Apply",
    prerequisites: ["std9_sci_ch8_useful_bacteria"], masteryThreshold: 0.7,
  },

  // 9th Science - Ch9: Environmental Management
  {
    id: "std9_sci_ch9_environmental_issues", name: "Major Environmental Issues", chapter: "Environmental Management", chapterNum: 9,
    subject: "science", standard: 9, difficulty: "easy", bloomsLevel: "Remember",
    prerequisites: [], masteryThreshold: 0.7,
  },
  {
    id: "std9_sci_ch9_pollution_control", name: "Pollution and Control Measures", chapter: "Environmental Management", chapterNum: 9,
    subject: "science", standard: 9, difficulty: "medium", bloomsLevel: "Understand",
    prerequisites: ["std9_sci_ch9_environmental_issues"], masteryThreshold: 0.7,
  },
  {
    id: "std9_sci_ch9_waste_management", name: "Waste Management and Recycling", chapter: "Environmental Management", chapterNum: 9,
    subject: "science", standard: 9, difficulty: "medium", bloomsLevel: "Apply",
    prerequisites: ["std9_sci_ch9_environmental_issues"], masteryThreshold: 0.7,
  },

  // 9th Science - Ch13: Substances in Common Use
  {
    id: "std9_sci_ch13_fibres", name: "Natural and Synthetic Fibres", chapter: "Substances in Common Use", chapterNum: 13,
    subject: "science", standard: 9, difficulty: "medium", bloomsLevel: "Remember",
    prerequisites: [], masteryThreshold: 0.7,
  },
  {
    id: "std9_sci_ch13_dyes", name: "Dyes and Dyed Fabrics", chapter: "Substances in Common Use", chapterNum: 13,
    subject: "science", standard: 9, difficulty: "medium", bloomsLevel: "Understand",
    prerequisites: ["std9_sci_ch13_fibres"], masteryThreshold: 0.7,
  },
  {
    id: "std9_sci_ch13_food_additives", name: "Food Additives and Preservatives", chapter: "Substances in Common Use", chapterNum: 13,
    subject: "science", standard: 9, difficulty: "medium", bloomsLevel: "Apply",
    prerequisites: [], masteryThreshold: 0.7,
  },

  // 9th Science - Ch16: Introduction to Biotechnology
  {
    id: "std9_sci_ch16_biotech_basics", name: "What is Biotechnology?", chapter: "Introduction to Biotechnology", chapterNum: 16,
    subject: "science", standard: 9, difficulty: "easy", bloomsLevel: "Remember",
    prerequisites: [], masteryThreshold: 0.7,
  },
  {
    id: "std9_sci_ch16_genetic_engineering", name: "Genetic Engineering Basics", chapter: "Introduction to Biotechnology", chapterNum: 16,
    subject: "science", standard: 9, difficulty: "hard", bloomsLevel: "Understand",
    prerequisites: ["std9_sci_ch16_biotech_basics", "std9_sci_ch15_dna_rna"], masteryThreshold: 0.7,
  },
  {
    id: "std9_sci_ch16_bioremediation", name: "Bioremediation and Its Applications", chapter: "Introduction to Biotechnology", chapterNum: 16,
    subject: "science", standard: 9, difficulty: "medium", bloomsLevel: "Apply",
    prerequisites: ["std9_sci_ch16_biotech_basics"], masteryThreshold: 0.7,
  },

  // 9th Science - Ch17: Observing Space: Telescopes
  {
    id: "std9_sci_ch17_telescope_types", name: "Types of Telescopes", chapter: "Observing Space: Telescopes", chapterNum: 17,
    subject: "science", standard: 9, difficulty: "medium", bloomsLevel: "Remember",
    prerequisites: [], masteryThreshold: 0.7,
  },
  {
    id: "std9_sci_ch17_optical_telescope", name: "Optical Telescope and Its Parts", chapter: "Observing Space: Telescopes", chapterNum: 17,
    subject: "science", standard: 9, difficulty: "medium", bloomsLevel: "Understand",
    prerequisites: ["std9_sci_ch17_telescope_types"], masteryThreshold: 0.7,
  },
  {
    id: "std9_sci_ch17_space_observations", name: "Important Space Observations", chapter: "Observing Space: Telescopes", chapterNum: 17,
    subject: "science", standard: 9, difficulty: "medium", bloomsLevel: "Apply",
    prerequisites: ["std9_sci_ch17_optical_telescope"], masteryThreshold: 0.7,
  },

  // === 10th ALGEBRA ===
  {
    id: "std10_alg_ch1_simultaneous_equations", name: "Simultaneous Linear Equations", chapter: "Linear Equations in Two Variables", chapterNum: 1,
    subject: "algebra", standard: 10, difficulty: "medium", bloomsLevel: "Apply",
    prerequisites: ["std9_alg_ch5_linear_equations"], masteryThreshold: 0.7,
  },
  {
    id: "std10_alg_ch1_graphical_method", name: "Graphical Method of Solving", chapter: "Linear Equations in Two Variables", chapterNum: 1,
    subject: "algebra", standard: 10, difficulty: "medium", bloomsLevel: "Apply",
    prerequisites: ["std10_alg_ch1_simultaneous_equations"], masteryThreshold: 0.7,
  },
  {
    id: "std10_alg_ch1_consistent_inconsistent", name: "Consistent and Inconsistent Systems", chapter: "Linear Equations in Two Variables", chapterNum: 1,
    subject: "algebra", standard: 10, difficulty: "hard", bloomsLevel: "Analyze",
    prerequisites: ["std10_alg_ch1_simultaneous_equations"], masteryThreshold: 0.7,
  },
  {
    id: "std10_alg_ch2_quadratic_equations", name: "Solving Quadratic Equations", chapter: "Quadratic Equations", chapterNum: 2,
    subject: "algebra", standard: 10, difficulty: "hard", bloomsLevel: "Apply",
    prerequisites: [], masteryThreshold: 0.7,
  },
  {
    id: "std10_alg_ch2_discriminant", name: "Discriminant and Nature of Roots", chapter: "Quadratic Equations", chapterNum: 2,
    subject: "algebra", standard: 10, difficulty: "hard", bloomsLevel: "Analyze",
    prerequisites: ["std10_alg_ch2_quadratic_equations"], masteryThreshold: 0.7,
  },
  {
    id: "std10_alg_ch3_ap_concepts", name: "Arithmetic Progression: Basics", chapter: "Arithmetic Progression", chapterNum: 3,
    subject: "algebra", standard: 10, difficulty: "medium", bloomsLevel: "Remember",
    prerequisites: [], masteryThreshold: 0.7,
  },
  {
    id: "std10_alg_ch3_ap_sum", name: "Sum of First n Terms of AP", chapter: "Arithmetic Progression", chapterNum: 3,
    subject: "algebra", standard: 10, difficulty: "hard", bloomsLevel: "Apply",
    prerequisites: ["std10_alg_ch3_ap_concepts"], masteryThreshold: 0.7,
  },
  {
    id: "std10_alg_ch4_finance_basics", name: "Financial Planning: Budget and Savings", chapter: "Financial Planning", chapterNum: 4,
    subject: "algebra", standard: 10, difficulty: "medium", bloomsLevel: "Understand",
    prerequisites: [], masteryThreshold: 0.7,
  },
  {
    id: "std10_alg_ch4Compound_interest", name: "Compound Interest and Applications", chapter: "Financial Planning", chapterNum: 4,
    subject: "algebra", standard: 10, difficulty: "medium", bloomsLevel: "Apply",
    prerequisites: ["std10_alg_ch4_finance_basics"], masteryThreshold: 0.7,
  },
  {
    id: "std10_alg_ch4_emi", name: "EMI and Loan Calculations", chapter: "Financial Planning", chapterNum: 4,
    subject: "algebra", standard: 10, difficulty: "hard", bloomsLevel: "Apply",
    prerequisites: ["std10_alg_ch4Compound_interest"], masteryThreshold: 0.7,
  },
  {
    id: "std10_alg_ch5_probability", name: "Probability Basics", chapter: "Probability", chapterNum: 5,
    subject: "algebra", standard: 10, difficulty: "medium", bloomsLevel: "Apply",
    prerequisites: [], masteryThreshold: 0.7,
  },
  {
    id: "std10_alg_ch5_coin_die", name: "Probability: Coin Toss and Dice", chapter: "Probability", chapterNum: 5,
    subject: "algebra", standard: 10, difficulty: "medium", bloomsLevel: "Apply",
    prerequisites: ["std10_alg_ch5_probability"], masteryThreshold: 0.7,
  },
  {
    id: "std10_alg_ch5_tree_diagram", name: "Tree Diagram and Sample Space", chapter: "Probability", chapterNum: 5,
    subject: "algebra", standard: 10, difficulty: "hard", bloomsLevel: "Analyze",
    prerequisites: ["std10_alg_ch5_probability"], masteryThreshold: 0.7,
  },
  {
    id: "std10_alg_ch6_statistics", name: "Mean, Median, Mode of Grouped Data", chapter: "Statistics", chapterNum: 6,
    subject: "algebra", standard: 10, difficulty: "hard", bloomsLevel: "Apply",
    prerequisites: ["std9_alg_ch7_mean_median_mode"], masteryThreshold: 0.7,
  },
  {
    id: "std10_alg_ch6_ogive", name: "Ogive and Median from Graph", chapter: "Statistics", chapterNum: 6,
    subject: "algebra", standard: 10, difficulty: "hard", bloomsLevel: "Apply",
    prerequisites: ["std10_alg_ch6_statistics"], masteryThreshold: 0.7,
  },
  {
    id: "std10_alg_ch6_mode_grouped", name: "Mode of Grouped Data", chapter: "Statistics", chapterNum: 6,
    subject: "algebra", standard: 10, difficulty: "hard", bloomsLevel: "Apply",
    prerequisites: ["std10_alg_ch6_statistics"], masteryThreshold: 0.7,
  },

  // === 10th GEOMETRY ===
  {
    id: "std10_geo_ch1_similarity", name: "Similarity of Triangles", chapter: "Similarity", chapterNum: 1,
    subject: "geometry", standard: 10, difficulty: "medium", bloomsLevel: "Apply",
    prerequisites: ["std9_geo_ch3_types_triangles"], masteryThreshold: 0.7,
  },
  {
    id: "std10_geo_ch1_bpt", name: "Basic Proportionality Theorem", chapter: "Similarity", chapterNum: 1,
    subject: "geometry", standard: 10, difficulty: "hard", bloomsLevel: "Apply",
    prerequisites: ["std10_geo_ch1_similarity"], masteryThreshold: 0.7,
  },
  {
    id: "std10_geo_ch2_pythagoras", name: "Pythagoras Theorem", chapter: "Pythagoras Theorem", chapterNum: 2,
    subject: "geometry", standard: 10, difficulty: "medium", bloomsLevel: "Apply",
    prerequisites: [], masteryThreshold: 0.7,
  },
  {
    id: "std10_geo_ch2_converse", name: "Converse of Pythagoras Theorem", chapter: "Pythagoras Theorem", chapterNum: 2,
    subject: "geometry", standard: 10, difficulty: "medium", bloomsLevel: "Apply",
    prerequisites: ["std10_geo_ch2_pythagoras"], masteryThreshold: 0.7,
  },
  {
    id: "std10_geo_ch2_applications", name: "Applications of Pythagoras Theorem", chapter: "Pythagoras Theorem", chapterNum: 2,
    subject: "geometry", standard: 10, difficulty: "hard", bloomsLevel: "Apply",
    prerequisites: ["std10_geo_ch2_pythagoras"], masteryThreshold: 0.7,
  },
  {
    id: "std10_geo_ch3_circle_theorems", name: "Theorems on Circle", chapter: "Circle", chapterNum: 3,
    subject: "geometry", standard: 10, difficulty: "hard", bloomsLevel: "Apply",
    prerequisites: ["std9_geo_ch6_circle_basics"], masteryThreshold: 0.7,
  },
  {
    id: "std10_geo_ch3_tangent_theorem", name: "Tangent-Secant Theorem", chapter: "Circle", chapterNum: 3,
    subject: "geometry", standard: 10, difficulty: "hard", bloomsLevel: "Apply",
    prerequisites: ["std10_geo_ch3_circle_theorems"], masteryThreshold: 0.7,
  },
  {
    id: "std10_geo_ch3_cyclic_quadrilateral", name: "Cyclic Quadrilateral Properties", chapter: "Circle", chapterNum: 3,
    subject: "geometry", standard: 10, difficulty: "hard", bloomsLevel: "Apply",
    prerequisites: ["std10_geo_ch3_circle_theorems"], masteryThreshold: 0.7,
  },
  {
    id: "std10_geo_ch4_construction_similarity", name: "Construction of Similar Triangles", chapter: "Geometric Constructions", chapterNum: 4,
    subject: "geometry", standard: 10, difficulty: "hard", bloomsLevel: "Apply",
    prerequisites: ["std10_geo_ch1_similarity"], masteryThreshold: 0.7,
  },
  {
    id: "std10_geo_ch4_construction_tangent", name: "Construction of Tangent to Circle", chapter: "Geometric Constructions", chapterNum: 4,
    subject: "geometry", standard: 10, difficulty: "hard", bloomsLevel: "Apply",
    prerequisites: ["std10_geo_ch3_circle_theorems"], masteryThreshold: 0.7,
  },
  {
    id: "std10_geo_ch5_section_formula_10", name: "Section Formula in Coordinate Geometry", chapter: "Coordinate Geometry", chapterNum: 5,
    subject: "geometry", standard: 10, difficulty: "medium", bloomsLevel: "Apply",
    prerequisites: ["std9_geo_ch7_distance_formula"], masteryThreshold: 0.7,
  },
  {
    id: "std10_geo_ch5_division_formula", name: "Internal and External Division", chapter: "Coordinate Geometry", chapterNum: 5,
    subject: "geometry", standard: 10, difficulty: "medium", bloomsLevel: "Apply",
    prerequisites: ["std10_geo_ch5_section_formula_10"], masteryThreshold: 0.7,
  },
  {
    id: "std10_geo_ch5_midpoint_10", name: "Midpoint in Coordinate Geometry", chapter: "Coordinate Geometry", chapterNum: 5,
    subject: "geometry", standard: 10, difficulty: "easy", bloomsLevel: "Remember",
    prerequisites: ["std9_geo_ch7_distance_formula"], masteryThreshold: 0.7,
  },
  {
    id: "std10_geo_ch6_trig_identities", name: "Trigonometric Identities", chapter: "Trigonometry", chapterNum: 6,
    subject: "geometry", standard: 10, difficulty: "hard", bloomsLevel: "Apply",
    prerequisites: ["std9_geo_ch8_trig_ratios"], masteryThreshold: 0.7,
  },
  {
    id: "std10_geo_ch6_heights_distances", name: "Heights and Distances", chapter: "Trigonometry", chapterNum: 6,
    subject: "geometry", standard: 10, difficulty: "hard", bloomsLevel: "Apply",
    prerequisites: ["std10_geo_ch6_trig_identities"], masteryThreshold: 0.7,
  },
  {
    id: "std10_geo_ch6_trig_ratios_10", name: "Trigonometric Ratios of Specific Angles", chapter: "Trigonometry", chapterNum: 6,
    subject: "geometry", standard: 10, difficulty: "medium", bloomsLevel: "Remember",
    prerequisites: ["std9_geo_ch8_trig_ratios"], masteryThreshold: 0.7,
  },
  {
    id: "std10_geo_ch7_mensuration", name: "Surface Area and Volume Combined", chapter: "Mensuration", chapterNum: 7,
    subject: "geometry", standard: 10, difficulty: "hard", bloomsLevel: "Apply",
    prerequisites: ["std9_geo_ch9_surface_area", "std9_geo_ch9_volume"], masteryThreshold: 0.7,
  },
  {
    id: "std10_geo_ch7_frustums", name: "Frustum of a Cone", chapter: "Mensuration", chapterNum: 7,
    subject: "geometry", standard: 10, difficulty: "hard", bloomsLevel: "Apply",
    prerequisites: ["std10_geo_ch7_mensuration"], masteryThreshold: 0.7,
  },
  {
    id: "std10_geo_ch7_combined_solids", name: "Problems on Combined Solids", chapter: "Mensuration", chapterNum: 7,
    subject: "geometry", standard: 10, difficulty: "hard", bloomsLevel: "Apply",
    prerequisites: ["std10_geo_ch7_mensuration"], masteryThreshold: 0.7,
  },

  // === 10th SCIENCE ===
  {
    id: "std10_sci_ch1_gravitation_law", name: "Newton's Law of Gravitation", chapter: "Gravitation", chapterNum: 1,
    subject: "science", standard: 10, difficulty: "medium", bloomsLevel: "Understand",
    prerequisites: ["std9_sci_ch1_newtons_laws"], masteryThreshold: 0.7,
  },
  {
    id: "std10_sci_ch1_free_fall", name: "Free Fall and Escape Velocity", chapter: "Gravitation", chapterNum: 1,
    subject: "science", standard: 10, difficulty: "hard", bloomsLevel: "Apply",
    prerequisites: ["std10_sci_ch1_gravitation_law"], masteryThreshold: 0.7,
  },
  {
    id: "std10_sci_ch2_periodic_table", name: "Periodic Classification", chapter: "Periodic Classification of Elements", chapterNum: 2,
    subject: "science", standard: 10, difficulty: "medium", bloomsLevel: "Remember",
    prerequisites: ["std9_sci_ch4_valency_ions"], masteryThreshold: 0.7,
  },
  {
    id: "std10_sci_ch2_periodic_trends", name: "Periodic Trends: Atomic Size, Metallic Character", chapter: "Periodic Classification of Elements", chapterNum: 2,
    subject: "science", standard: 10, difficulty: "medium", bloomsLevel: "Understand",
    prerequisites: ["std10_sci_ch2_periodic_table"], masteryThreshold: 0.7,
  },
  {
    id: "std10_sci_ch2_mendeleev", name: "Mendeleev's Periodic Table", chapter: "Periodic Classification of Elements", chapterNum: 2,
    subject: "science", standard: 10, difficulty: "medium", bloomsLevel: "Remember",
    prerequisites: ["std10_sci_ch2_periodic_table"], masteryThreshold: 0.7,
  },
  {
    id: "std10_sci_ch3_chemical_reactions", name: "Types of Chemical Reactions", chapter: "Chemical Reactions and Equations", chapterNum: 3,
    subject: "science", standard: 10, difficulty: "medium", bloomsLevel: "Understand",
    prerequisites: [], masteryThreshold: 0.7,
  },
  {
    id: "std10_sci_ch3_balancing", name: "Balancing Chemical Equations", chapter: "Chemical Reactions and Equations", chapterNum: 3,
    subject: "science", standard: 10, difficulty: "medium", bloomsLevel: "Apply",
    prerequisites: ["std10_sci_ch3_chemical_reactions"], masteryThreshold: 0.7,
  },
  {
    id: "std10_sci_ch3_oxidation_reduction", name: "Oxidation and Reduction Reactions", chapter: "Chemical Reactions and Equations", chapterNum: 3,
    subject: "science", standard: 10, difficulty: "hard", bloomsLevel: "Apply",
    prerequisites: ["std10_sci_ch3_chemical_reactions"], masteryThreshold: 0.7,
  },
  {
    id: "std10_sci_ch4_ohms_law_advanced", name: "Ohm's Law: Advanced Applications", chapter: "Effects of Electric Current", chapterNum: 4,
    subject: "science", standard: 10, difficulty: "hard", bloomsLevel: "Apply",
    prerequisites: ["std9_sci_ch3_ohms_law"], masteryThreshold: 0.7,
  },
  {
    id: "std10_sci_ch4_electrical_power", name: "Electric Power and Energy", chapter: "Effects of Electric Current", chapterNum: 4,
    subject: "science", standard: 10, difficulty: "hard", bloomsLevel: "Apply",
    prerequisites: ["std10_sci_ch4_ohms_law_advanced"], masteryThreshold: 0.7,
  },
  {
    id: "std10_sci_ch5_heat_transfer", name: "Heat: Specific Heat and Latent Heat", chapter: "Heat", chapterNum: 5,
    subject: "science", standard: 10, difficulty: "medium", bloomsLevel: "Understand",
    prerequisites: [], masteryThreshold: 0.7,
  },
  {
    id: "std10_sci_ch5_calorimetry", name: "Calorimetry and Heat Exchange", chapter: "Heat", chapterNum: 5,
    subject: "science", standard: 10, difficulty: "hard", bloomsLevel: "Apply",
    prerequisites: ["std10_sci_ch5_heat_transfer"], masteryThreshold: 0.7,
  },
  {
    id: "std10_sci_ch5_change_of_state", name: "Change of State of Matter", chapter: "Heat", chapterNum: 5,
    subject: "science", standard: 10, difficulty: "medium", bloomsLevel: "Understand",
    prerequisites: ["std10_sci_ch5_heat_transfer"], masteryThreshold: 0.7,
  },
  {
    id: "std10_sci_ch6_refraction", name: "Refraction of Light", chapter: "Refraction of Light", chapterNum: 6,
    subject: "science", standard: 10, difficulty: "hard", bloomsLevel: "Apply",
    prerequisites: [], masteryThreshold: 0.7,
  },
  {
    id: "std10_sci_ch6_snells_law", name: "Snell's Law and Refractive Index", chapter: "Refraction of Light", chapterNum: 6,
    subject: "science", standard: 10, difficulty: "hard", bloomsLevel: "Apply",
    prerequisites: ["std10_sci_ch6_refraction"], masteryThreshold: 0.7,
  },
  {
    id: "std10_sci_ch6_total_internal", name: "Total Internal Reflection", chapter: "Refraction of Light", chapterNum: 6,
    subject: "science", standard: 10, difficulty: "hard", bloomsLevel: "Apply",
    prerequisites: ["std10_sci_ch6_refraction"], masteryThreshold: 0.7,
  },
  {
    id: "std10_sci_ch7_lens_formula", name: "Lens Formula and Magnification", chapter: "Lenses", chapterNum: 7,
    subject: "science", standard: 10, difficulty: "hard", bloomsLevel: "Apply",
    prerequisites: ["std10_sci_ch6_refraction"], masteryThreshold: 0.7,
  },
  {
    id: "std10_sci_ch7_lens_power", name: "Power of a Lens", chapter: "Lenses", chapterNum: 7,
    subject: "science", standard: 10, difficulty: "hard", bloomsLevel: "Apply",
    prerequisites: ["std10_sci_ch7_lens_formula"], masteryThreshold: 0.7,
  },
  {
    id: "std10_sci_ch7_combination_lenses", name: "Combination of Lenses", chapter: "Lenses", chapterNum: 7,
    subject: "science", standard: 10, difficulty: "hard", bloomsLevel: "Apply",
    prerequisites: ["std10_sci_ch7_lens_formula"], masteryThreshold: 0.7,
  },
  {
    id: "std10_sci_ch8_metals_properties", name: "Properties of Metals", chapter: "Metallurgy", chapterNum: 8,
    subject: "science", standard: 10, difficulty: "medium", bloomsLevel: "Remember",
    prerequisites: [], masteryThreshold: 0.7,
  },
  {
    id: "std10_sci_ch8_ore_processing", name: "Extraction of Metals from Ores", chapter: "Metallurgy", chapterNum: 8,
    subject: "science", standard: 10, difficulty: "medium", bloomsLevel: "Understand",
    prerequisites: ["std10_sci_ch8_metals_properties"], masteryThreshold: 0.7,
  },
  {
    id: "std10_sci_ch8_alloys", name: "Alloys and Their Uses", chapter: "Metallurgy", chapterNum: 8,
    subject: "science", standard: 10, difficulty: "medium", bloomsLevel: "Apply",
    prerequisites: ["std10_sci_ch8_metals_properties"], masteryThreshold: 0.7,
  },
  {
    id: "std10_sci_ch9_covalent_bonding", name: "Covalent Bonding in Carbon", chapter: "Carbon Compounds", chapterNum: 9,
    subject: "science", standard: 10, difficulty: "hard", bloomsLevel: "Understand",
    prerequisites: ["std9_sci_ch12_carbon_bonding"], masteryThreshold: 0.7,
  },
  {
    id: "std10_sci_ch9_organic_compounds", name: "Homologous Series and Reactions", chapter: "Carbon Compounds", chapterNum: 9,
    subject: "science", standard: 10, difficulty: "hard", bloomsLevel: "Apply",
    prerequisites: ["std10_sci_ch9_covalent_bonding"], masteryThreshold: 0.7,
  },
  {
    id: "std10_sci_ch9_functional_groups", name: "Functional Groups in Organic Chemistry", chapter: "Carbon Compounds", chapterNum: 9,
    subject: "science", standard: 10, difficulty: "hard", bloomsLevel: "Apply",
    prerequisites: ["std10_sci_ch9_covalent_bonding"], masteryThreshold: 0.7,
  },
  {
    id: "std10_sci_ch10_space_missions", name: "Important Space Missions", chapter: "Space Missions", chapterNum: 10,
    subject: "science", standard: 10, difficulty: "medium", bloomsLevel: "Remember",
    prerequisites: [], masteryThreshold: 0.7,
  },
  {
    id: "std10_sci_ch10_satellites", name: "Types of Satellites and Orbits", chapter: "Space Missions", chapterNum: 10,
    subject: "science", standard: 10, difficulty: "medium", bloomsLevel: "Understand",
    prerequisites: ["std10_sci_ch10_space_missions"], masteryThreshold: 0.7,
  },
  {
    id: "std10_sci_ch10_isro", name: "ISRO and Indian Space Programme", chapter: "Space Missions", chapterNum: 10,
    subject: "science", standard: 10, difficulty: "easy", bloomsLevel: "Remember",
    prerequisites: ["std10_sci_ch10_space_missions"], masteryThreshold: 0.7,
  },
];

export function getConceptsBySubject(subject: string, standard?: number): Concept[] {
  return CONCEPTS.filter(c => c.subject === subject && (standard === undefined || c.standard === standard));
}

export function getConceptById(id: string): Concept | undefined {
  return CONCEPTS.find(c => c.id === id);
}

export function getChapterConcepts(chapterId: string): Concept[] {
  return CONCEPTS.filter(c => c.chapter === CHAPTERS.find(ch => ch.id === chapterId)?.name);
}
