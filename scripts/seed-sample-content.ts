import { ChromaClient } from "chromadb";
import { pipeline, env } from "@xenova/transformers";

env.allowLocalModels = true;

const CHROMA_HOST = process.env.CHROMA_HOST || "localhost";
const CHROMA_PORT = parseInt(process.env.CHROMA_PORT || "8000");
const EMBEDDING_MODEL = "Xenova/all-MiniLM-L6-v2";

let embedder: any = null;

async function getEmbedder() {
  if (!embedder) {
    embedder = await pipeline("feature-extraction", EMBEDDING_MODEL);
  }
  return embedder;
}

async function embed(texts: string[]): Promise<number[][]> {
  const pipe = await getEmbedder();
  const embeddings: number[][] = [];
  for (const text of texts) {
    const output = await pipe(text, { pooling: "mean", normalize: true });
    embeddings.push(Array.from(output.data) as number[]);
  }
  return embeddings;
}

class CustomEmbeddingFunction {
  async generate(texts: string[]) {
    return await embed(texts);
  }
}

// Maharashtra SSC 9th & 10th textbook content
const TEXTBOOK_CONTENT = [
  // 9th Science: Laws of Motion
  {
    document: "Newton's First Law of Motion: An object at rest stays at rest, and an object in motion stays in motion with the same speed and in the same direction unless acted upon by an unbalanced force. This law is also known as the Law of Inertia. Inertia is the property of an object by virtue of which it opposes any change in its state of rest or of uniform motion in a straight line. The mass of an object is a measure of its inertia. Heavier objects have more inertia than lighter objects.",
    metadata: { standard: 9, subject: "science", chapter: "Laws of Motion", chapter_num: 1, page_number: 1, source: "balbharati" }
  },
  {
    document: "Newton's Second Law of Motion: The rate of change of momentum of an object is proportional to the applied unbalanced force in the direction of force. Mathematically, F = ma, where F is force, m is mass, and a is acceleration. The SI unit of force is Newton (N). One Newton is the force which produces an acceleration of 1 m/s² on an object of mass 1 kg. Momentum (p) is the product of mass and velocity: p = mv. The unit of momentum is kg·m/s.",
    metadata: { standard: 9, subject: "science", chapter: "Laws of Motion", chapter_num: 1, page_number: 2, source: "balbharati" }
  },
  {
    document: "Newton's Third Law of Motion: For every action, there is an equal and opposite reaction. When you push against a wall, the wall pushes back against you with equal force. Action and reaction forces act on different objects. They are equal in magnitude but opposite in direction. They act simultaneously. Examples: Walking (foot pushes ground backward, ground pushes foot forward), Rocket propulsion (gas pushes down, rocket moves up), Swimming.",
    metadata: { standard: 9, subject: "science", chapter: "Laws of Motion", chapter_num: 1, page_number: 3, source: "balbharati" }
  },
  {
    document: "Equations of Motion: For uniformly accelerated motion, three equations relate displacement (s), initial velocity (u), final velocity (v), acceleration (a), and time (t): (1) v = u + at, (2) s = ut + ½at², (3) v² = u² + 2as. These equations are derived from the definition of acceleration. Free fall: when an object falls under gravity alone, a = g = 9.8 m/s². Distance traveled in nth second: Sn = u + a(2n-1)/2.",
    metadata: { standard: 9, subject: "science", chapter: "Laws of Motion", chapter_num: 1, page_number: 4, source: "balbharati" }
  },
  // 9th Science: Work and Energy
  {
    document: "Work is done when a force acting on a body displaces it in the direction of force. Work (W) = Force (F) × Displacement (s) × cos θ, where θ is the angle between force and displacement. SI unit of work is Joule (J). One Joule is the work done when a force of 1 N displaces an object by 1 m. When force and displacement are in the same direction, W = Fs. When force is perpendicular to displacement, no work is done (W = 0).",
    metadata: { standard: 9, subject: "science", chapter: "Work and Energy", chapter_num: 2, page_number: 1, source: "balbharati" }
  },
  {
    document: "Energy: The capacity of an object to do work is called energy. SI unit of energy is Joule (J). Kinetic Energy (KE): The energy possessed by a body due to its motion. KE = ½mv², where m is mass and v is velocity. Potential Energy (PE): The energy possessed by a body due to its position or configuration. Gravitational PE = mgh, where m is mass, g is acceleration due to gravity, and h is height.",
    metadata: { standard: 9, subject: "science", chapter: "Work and Energy", chapter_num: 2, page_number: 2, source: "balbharati" }
  },
  {
    document: "Law of Conservation of Energy: Energy can neither be created nor destroyed, only transformed from one form to another. The total energy of an isolated system remains constant. Example: A ball dropped from height h - at the top, PE = mgh and KE = 0. During fall, PE converts to KE. Just before hitting ground, KE = mgh and PE = 0. At any point during fall, PE + KE = mgh. Power (P) is the rate of doing work: P = W/t. SI unit of power is Watt (W). 1 HP = 746 W.",
    metadata: { standard: 9, subject: "science", chapter: "Work and Energy", chapter_num: 2, page_number: 3, source: "balbharati" }
  },
  // 9th Science: Current Electricity
  {
    document: "Ohm's Law: The current (I) flowing through a metallic conductor is directly proportional to the potential difference (V) across its ends, provided physical conditions like temperature remain constant. V ∝ I, or V = IR, where R is the resistance. Resistance (R) is the property of a conductor that opposes the flow of current. SI unit of resistance is Ohm (Ω). Factors affecting resistance: length (R ∝ l), area of cross-section (R ∝ 1/A), material, temperature.",
    metadata: { standard: 9, subject: "science", chapter: "Current Electricity", chapter_num: 3, page_number: 1, source: "balbharati" }
  },
  {
    document: "Resistors in Series: When resistors are connected in series, the same current flows through all resistors. Total resistance R = R₁ + R₂ + R₃. The voltage across each resistor is different: V = V₁ + V₂ + V₃. Resistors in Parallel: When resistors are connected in parallel, the voltage across each resistor is the same. Total resistance: 1/R = 1/R₁ + 1/R₂ + 1/R₃. The current divides among the branches: I = I₁ + I₂ + I₃.",
    metadata: { standard: 9, subject: "science", chapter: "Current Electricity", chapter_num: 3, page_number: 2, source: "balbharati" }
  },
  // 9th Science: Measurement of Matter
  {
    document: "Mole Concept: One mole of any substance contains exactly 6.022 × 10²³ particles (Avogadro's number, NA). Mole is the amount of substance which contains as many elementary entities as there are atoms in 12 grams of carbon-12. Molar mass is the mass of one mole of a substance, expressed in g/mol. Number of moles = given mass / molar mass. Number of particles = number of moles × Avogadro's number.",
    metadata: { standard: 9, subject: "science", chapter: "Measurement of Matter", chapter_num: 4, page_number: 1, source: "balbharati" }
  },
  // 9th Science: Acids Bases Salts
  {
    document: "Acids are substances that release H⁺ ions in water. Bases release OH⁻ ions in water. pH scale: measures acidity or basicity from 0 to 14. pH < 7 is acidic, pH = 7 is neutral, pH > 7 is basic. Strong acids: HCl, H₂SO₄, HNO₃. Strong bases: NaOH, KOH, Ca(OH)₂. Neutralization reaction: Acid + Base → Salt + Water. Example: HCl + NaOH → NaCl + H₂O. Indicators: Litmus: red in acid, blue in base. Phenolphthalein: colorless in acid, pink in base.",
    metadata: { standard: 9, subject: "science", chapter: "Acids Bases and Salts", chapter_num: 5, page_number: 1, source: "balbharati" }
  },
  // 9th Algebra: Sets
  {
    document: "A set is a well-defined collection of objects. The objects in a set are called elements or members. Sets are denoted by capital letters A, B, C. Types: Empty set (no elements), Singleton set (one element), Universal set, Equal sets, Equivalent sets. Operations: Union (A ∪ B): all elements in A or B or both. Intersection (A ∩ B): elements common to both A and B. Difference (A - B): elements in A but not in B. Complement (A'): elements in universal set not in A.",
    metadata: { standard: 9, subject: "algebra", chapter: "Sets", chapter_num: 1, page_number: 1, source: "balbharati" }
  },
  // 9th Algebra: Real Numbers
  {
    document: "Rational Numbers: A number expressible as p/q where p and q are integers and q ≠ 0. Every integer is a rational number. Can be terminating or recurring decimals. Irrational Numbers: Cannot be expressed as p/q. Decimal expansion is non-terminating and non-recurring. Examples: √2 = 1.41421356..., √3 = 1.732..., π = 3.14159... Surds: Irrational numbers expressible as roots of rational numbers. Rationalization: Converting fraction with surd in denominator to equivalent without surd. For √a in denominator, multiply numerator and denominator by √a.",
    metadata: { standard: 9, subject: "algebra", chapter: "Real Numbers", chapter_num: 2, page_number: 1, source: "balbharati" }
  },
  // 9th Algebra: Polynomials
  {
    document: "A polynomial in one variable: aₙxⁿ + aₙ₋₁xⁿ⁻¹ + ... + a₁x + a₀. Degree is the highest power. Remainder Theorem: When polynomial p(x) is divided by (x - a), the remainder is p(a). Factor Theorem: (x - a) is a factor of p(x) if and only if p(a) = 0. These theorems help in factorizing polynomials efficiently.",
    metadata: { standard: 9, subject: "algebra", chapter: "Polynomials", chapter_num: 3, page_number: 1, source: "balbharati" }
  },
  // 9th Algebra: Statistics
  {
    document: "Mean: The average of all data values. For individual data: Mean = Σxi / n. For frequency distribution: Mean = Σfixi / Σfi. Median: The middle value when data is arranged in order. For odd n: Median = (n+1)/2 th term. For even: average of n/2 th and (n/2+1) th terms. Mode: The value that occurs most frequently. For grouped data: Mode = l + [(f₁-f₀)/(2f₁-f₀-f₂)] × h.",
    metadata: { standard: 9, subject: "algebra", chapter: "Statistics", chapter_num: 7, page_number: 1, source: "balbharati" }
  },
  // 9th Geometry: Coordinate Geometry
  {
    document: "Distance Formula: Distance between A(x₁,y₁) and B(x₂,y₂) is d = √[(x₂-x₁)² + (y₂-y₁)²]. Section Formula: Point dividing line segment in ratio m:n: x = (mx₂+nx₁)/(m+n), y = (my₂+ny₁)/(m+n). Midpoint formula: x = (x₁+x₂)/2, y = (y₁+y₂)/2. Area of triangle with vertices (x₁,y₁), (x₂,y₂), (x₃,y₃): A = ½|x₁(y₂-y₃) + x₂(y₃-y₁) + x₃(y₁-y₂)|.",
    metadata: { standard: 9, subject: "geometry", chapter: "Coordinate Geometry", chapter_num: 7, page_number: 1, source: "balbharati" }
  },
  // 9th Geometry: Trigonometry
  {
    document: "Trigonometric Ratios: In a right-angled triangle, for angle θ: sin θ = Opposite/Hypotenuse, cos θ = Adjacent/Hypotenuse, tan θ = Opposite/Adjacent. cosec θ = 1/sin θ, sec θ = 1/cos θ, cot θ = 1/tan θ. Identity: sin²θ + cos²θ = 1. Standard angles: sin 0° = 0, sin 30° = 1/2, sin 45° = 1/√2, sin 60° = √3/2, sin 90° = 1. cos 0° = 1, cos 30° = √3/2, cos 45° = 1/√2, cos 60° = 1/2, cos 90° = 0.",
    metadata: { standard: 9, subject: "geometry", chapter: "Trigonometry", chapter_num: 8, page_number: 1, source: "balbharati" }
  },
  // 9th Geometry: Triangles
  {
    document: "Exterior Angle Theorem: The exterior angle of a triangle equals the sum of the two interior opposite angles. ∠ACD = ∠A + ∠B. Properties: Sum of all angles = 180°. At most one right angle or obtuse angle. Side opposite largest angle is longest. Types: Scalene (all different), Isosceles (two equal), Equilateral (all equal).",
    metadata: { standard: 9, subject: "geometry", chapter: "Triangles", chapter_num: 3, page_number: 1, source: "balbharati" }
  },
  // 10th Science: Gravitation
  {
    document: "Newton's Law of Universal Gravitation: Every object attracts every other object with force proportional to product of masses and inversely proportional to square of distance. F = G(m₁m₂)/r², where G = 6.67 × 10⁻¹¹ N·m²/kg². m₁ and m₂ are masses, r is distance. This force is always attractive and central.",
    metadata: { standard: 10, subject: "science", chapter: "Gravitation", chapter_num: 1, page_number: 1, source: "balbharati" }
  },
  {
    document: "Free Fall: Object falling under gravity alone. Acceleration due to gravity g = 9.8 m/s². g varies: poles 9.83, equator 9.78, moon 1.63 m/s². Escape velocity: minimum velocity to escape gravitational field. Ve = √(2gR) = 11.2 km/s. Orbital velocity: Vo = √(gR) ≈ 7.9 km/s.",
    metadata: { standard: 10, subject: "science", chapter: "Gravitation", chapter_num: 1, page_number: 2, source: "balbharati" }
  },
  // 10th Science: Periodic Classification
  {
    document: "Periodic Table: Elements arranged by increasing atomic number. Modern Periodic Law: properties are periodic functions of atomic number. Periods: horizontal rows (1-7). Groups: vertical columns (1-18). Group 1: Alkali metals. Group 17: Halogens. Group 18: Noble gases. Metallic character decreases across period (left to right) and increases down a group.",
    metadata: { standard: 10, subject: "science", chapter: "Periodic Classification", chapter_num: 2, page_number: 1, source: "balbharati" }
  },
  // 10th Science: Chemical Reactions
  {
    document: "Types of chemical reactions: Combination (A+B→AB), Decomposition (AB→A+B), Displacement (A+BC→AC+B), Double Displacement (AB+CD→AD+CB), Redox. Balancing: Law of Conservation of Mass - atoms of each element must be equal on both sides. Exothermic reactions release heat, endothermic absorb heat.",
    metadata: { standard: 10, subject: "science", chapter: "Chemical Reactions", chapter_num: 3, page_number: 1, source: "balbharati" }
  },
  // 10th Science: Electric Current
  {
    document: "Ohm's Law: V = IR. Heating effect: H = I²Rt (Joule's Law). Electric Power: P = VI = I²R = V²/R. Energy: W = Pt = VIt = I²Rt = V²t/R. 1 kWh = 3.6 × 10⁶ J. Series resistance: Rtotal = R₁+R₂+R₃. Parallel resistance: 1/Rtotal = 1/R₁+1/R₂+1/R₃.",
    metadata: { standard: 10, subject: "science", chapter: "Effects of Electric Current", chapter_num: 4, page_number: 1, source: "balbharati" }
  },
  // 10th Science: Refraction
  {
    document: "Refraction: Light changes direction when passing from one medium to another. Laws: (1) incident ray, refracted ray, and normal in same plane. (2) Snell's Law: n₁sin i = n₂sin r. Refractive index n = speed in vacuum / speed in medium. Rarer to denser: bends towards normal. Denser to rarer: bends away from normal.",
    metadata: { standard: 10, subject: "science", chapter: "Refraction of Light", chapter_num: 6, page_number: 1, source: "balbharati" }
  },
  // 10th Algebra: Quadratic Equations
  {
    document: "Quadratic Equation: ax² + bx + c = 0, a ≠ 0. Solving methods: (1) Factorization, (2) Completing the square, (3) Quadratic formula: x = (-b ± √(b²-4ac))/2a. Discriminant D = b²-4ac: D>0 two distinct real roots, D=0 two equal real roots, D<0 no real roots. Sum of roots = -b/a, Product of roots = c/a.",
    metadata: { standard: 10, subject: "algebra", chapter: "Quadratic Equations", chapter_num: 2, page_number: 1, source: "balbharati" }
  },
  // 10th Algebra: AP
  {
    document: "Arithmetic Progression: Sequence with constant difference (d) between consecutive terms. General term: an = a + (n-1)d. Sum: Sn = n/2 × [2a + (n-1)d] = n/2 × (a+l). Example: 2, 5, 8, 11... a=2, d=3. 10th term = 2 + 9(3) = 29. Sum of 10 terms = 10/2 × (2+29) = 155.",
    metadata: { standard: 10, subject: "algebra", chapter: "Arithmetic Progression", chapter_num: 3, page_number: 1, source: "balbharati" }
  },
  // 10th Geometry: Similarity
  {
    document: "Similarity: Two triangles are similar if corresponding angles are equal and sides are in same ratio. Tests: AAA, SAS, SSS. Basic Proportionality Theorem (Thales): Line parallel to one side intersects other two sides, dividing them in same ratio. If DE||BC in triangle ABC, then AD/DB = AE/EC.",
    metadata: { standard: 10, subject: "geometry", chapter: "Similarity", chapter_num: 1, page_number: 1, source: "balbharati" }
  },
  // 10th Geometry: Pythagoras
  {
    document: "Pythagoras Theorem: In right-angled triangle, hypotenuse² = sum of squares of other two sides. AB² = AC² + BC² (right angle at C). Converse: If one side² = sum of squares of other two, triangle is right-angled. Pythagorean triples: (3,4,5), (5,12,13), (8,15,17), (7,24,25).",
    metadata: { standard: 10, subject: "geometry", chapter: "Pythagoras Theorem", chapter_num: 2, page_number: 1, source: "balbharati" }
  },
  // 10th Geometry: Trig Identities
  {
    document: "Trigonometric Identities: (1) sin²θ + cos²θ = 1, (2) 1 + tan²θ = sec²θ, (3) 1 + cot²θ = cosec²θ. Derived: sin²θ = 1-cos²θ, cos²θ = 1-sin²θ, tan²θ = sec²θ-1. To prove: work on more complex side, simplify to match other side.",
    metadata: { standard: 10, subject: "geometry", chapter: "Trigonometry", chapter_num: 6, page_number: 1, source: "balbharati" }
  },
];

async function seedSampleContent() {
  console.log("Connecting to ChromaDB...");
  const client = new ChromaClient({ host: CHROMA_HOST, port: CHROMA_PORT });

  try {
    await client.deleteCollection({ name: "antraai_textbooks" });
    console.log("Deleted existing collection");
  } catch { /* ok */ }

  console.log("Loading embedding model (first run downloads ~23MB)...");
  const ef = new CustomEmbeddingFunction();

  console.log("Creating collection...");
  const collection = await client.getOrCreateCollection({
    name: "antraai_textbooks",
    metadata: { "hnsw:space": "cosine" },
    embeddingFunction: ef as any,
  });

  const ids = TEXTBOOK_CONTENT.map((_, i) => `chunk_${i}`);
  const documents = TEXTBOOK_CONTENT.map(c => c.document);
  const metadatas = TEXTBOOK_CONTENT.map(c => c.metadata);

  console.log(`Adding ${documents.length} chunks (with local embeddings)...`);

  const BATCH = 10;
  for (let i = 0; i < documents.length; i += BATCH) {
    const batchDocs = documents.slice(i, i + BATCH);
    const batchMeta = metadatas.slice(i, i + BATCH);
    const batchIds = ids.slice(i, i + BATCH);

    await collection.add({
      documents: batchDocs,
      metadatas: batchMeta,
      ids: batchIds,
    });

    console.log(`  Added ${Math.min(i + BATCH, documents.length)}/${documents.length}`);
  }

  console.log(`\nSeeded ${documents.length} chunks into ChromaDB!`);

  console.log("\n--- Verification Query ---");
  const results = await collection.query({
    queryTexts: ["What is Newton's Third Law?"],
    nResults: 3,
  });

  console.log("Query: 'What is Newton's Third Law?'");
  results.documents[0]?.forEach((doc, i) => {
    const meta = results.metadatas?.[0]?.[i];
    console.log(`  ${i + 1}. [${meta?.chapter}] ${(doc ?? "").substring(0, 120)}...`);
  });

  console.log("\n--- Verification Query 2 ---");
  const results2 = await collection.query({
    queryTexts: ["How to solve quadratic equations?"],
    nResults: 3,
  });

  console.log("Query: 'How to solve quadratic equations?'");
  results2.documents[0]?.forEach((doc, i) => {
    const meta = results2.metadatas?.[0]?.[i];
    console.log(`  ${i + 1}. [${meta?.chapter}] ${(doc ?? "").substring(0, 120)}...`);
  });
}

seedSampleContent().catch(console.error);
