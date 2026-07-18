import { ConceptMastery, IConceptMastery } from "@/lib/db/schemas";
import { CONCEPTS, Concept } from "@/lib/utils/constants";
import { connectDB } from "@/lib/db/mongodb";
import { sm2, performanceRating } from "@/lib/mastery/spaced-repetition";

export interface BKTParams {
  p_L0: number;  // Prior probability of knowing the concept
  p_T: number;   // Probability of learning after practice
  p_S: number;   // Probability of slip (knowing but wrong)
  p_G: number;   // Probability of guess (not knowing but right)
}

const DEFAULT_BKT: BKTParams = {
  p_L0: 0.3,
  p_T: 0.1,
  p_S: 0.05,
  p_G: 0.2,
};

export function updateMastery(
  currentMastery: number,
  isCorrect: boolean,
  params: BKTParams = DEFAULT_BKT
): number {
  if (!Number.isFinite(currentMastery)) return DEFAULT_BKT.p_L0;

  let p_K_given_obs: number;

  if (isCorrect) {
    const p_correct = currentMastery * (1 - params.p_S) + (1 - currentMastery) * params.p_G;
    p_K_given_obs = p_correct > 0
      ? (currentMastery * (1 - params.p_S)) / p_correct
      : currentMastery;
  } else {
    const p_incorrect = currentMastery * params.p_S + (1 - currentMastery) * (1 - params.p_G);
    p_K_given_obs = p_incorrect > 0
      ? (currentMastery * params.p_S) / p_incorrect
      : currentMastery;
  }

  const updatedMastery = p_K_given_obs + (1 - p_K_given_obs) * params.p_T;

  return Math.min(Math.max(updatedMastery, 0.01), 0.99);
}

export async function initializeStudentMastery(studentId: string, standard: number): Promise<void> {
  await connectDB();

  const concepts = CONCEPTS.filter(c => c.standard === standard);

  const operations = concepts.map(concept => ({
    updateOne: {
      filter: { studentId, conceptId: concept.id },
      update: {
        $setOnInsert: {
          studentId,
          conceptId: concept.id,
          masteryProbability: DEFAULT_BKT.p_L0,
          attempts: 0,
          correct: 0,
        },
      },
      upsert: true,
    },
  }));

  await ConceptMastery.bulkWrite(operations);
}

export async function updateConceptMastery(
  studentId: string,
  conceptId: string,
  isCorrect: boolean,
  timeTakenSeconds?: number,
  timeEstimate?: number
): Promise<IConceptMastery> {
  await connectDB();

  const rating = performanceRating(isCorrect, timeTakenSeconds || 0, timeEstimate || 0);

  const existing = await ConceptMastery.findOne({ studentId, conceptId });

  if (!existing) {
    const newMastery = updateMastery(DEFAULT_BKT.p_L0, isCorrect);
    const sr = sm2(rating, { interval: 0, repetitions: 0, easinessFactor: 2.5 });

    return ConceptMastery.findOneAndUpdate(
      { studentId, conceptId },
      {
        $set: {
          masteryProbability: newMastery,
          attempts: 1,
          correct: isCorrect ? 1 : 0,
          lastPracticed: new Date(),
          nextReview: sr.nextReview,
          interval: sr.interval,
          repetitions: sr.repetitions,
          easinessFactor: sr.easinessFactor,
        },
      },
      { upsert: true, returnDocument: "after" }
    ) as Promise<IConceptMastery>;
  }

  const newMastery = updateMastery(existing.masteryProbability, isCorrect);
  const sr = sm2(rating, {
    interval: existing.interval,
    repetitions: existing.repetitions,
    easinessFactor: existing.easinessFactor,
  });

  return ConceptMastery.findOneAndUpdate(
    { studentId, conceptId },
    {
      $set: {
        masteryProbability: newMastery,
        lastPracticed: new Date(),
        nextReview: sr.nextReview,
        interval: sr.interval,
        repetitions: sr.repetitions,
        easinessFactor: sr.easinessFactor,
      },
      $inc: {
        attempts: 1,
        correct: isCorrect ? 1 : 0,
      },
    },
    { returnDocument: "after" }
  ) as Promise<IConceptMastery>;
}

export async function getStudentMasteryProfile(studentId: string): Promise<{
  conceptId: string;
  mastery: number;
  attempts: number;
  correct: number;
  lastPracticed?: Date;
}[]> {
  await connectDB();

  const masteries = await ConceptMastery.find({ studentId });
  return masteries.map(m => ({
    conceptId: m.conceptId,
    mastery: m.masteryProbability,
    attempts: m.attempts,
    correct: m.correct,
    lastPracticed: m.lastPracticed,
  }));
}

export async function getWeakConcepts(
  studentId: string,
  threshold: number = 0.6,
  subject?: string
): Promise<{ conceptId: string; mastery: number; concept: Concept }[]> {
  await connectDB();

  const masteries = await ConceptMastery.find({
    studentId,
    masteryProbability: { $lt: threshold },
  });

  return masteries
    .map(m => {
      const concept = CONCEPTS.find(c => c.id === m.conceptId);
      return concept ? {
        conceptId: m.conceptId,
        mastery: m.masteryProbability,
        concept,
      } : null;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .filter(item => !subject || item.concept.subject === subject);
}

export async function getStrongConcepts(
  studentId: string,
  threshold: number = 0.7,
  subject?: string
): Promise<{ conceptId: string; mastery: number; concept: Concept }[]> {
  await connectDB();

  const masteries = await ConceptMastery.find({
    studentId,
    masteryProbability: { $gte: threshold },
  });

  return masteries
    .map(m => {
      const concept = CONCEPTS.find(c => c.id === m.conceptId);
      return concept ? {
        conceptId: m.conceptId,
        mastery: m.masteryProbability,
        concept,
      } : null;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .filter(item => !subject || item.concept.subject === subject);
}

export async function getConceptsForTest(
  studentId: string,
  subject: string,
  count: number = 15
): Promise<{ concept: Concept; mastery: number; priority: "weak" | "review" | "strong" }[]> {
  const allMasteries = await getStudentMasteryProfile(studentId);
  const subjectConcepts = CONCEPTS.filter(c => c.subject === subject);

  const conceptsWithMastery = subjectConcepts.map(concept => {
    const masteryRecord = allMasteries.find(m => m.conceptId === concept.id);
    return {
      concept,
      mastery: masteryRecord?.mastery || DEFAULT_BKT.p_L0,
      attempts: masteryRecord?.attempts || 0,
    };
  });

  // Sort by mastery (ascending) to prioritize weak concepts
  conceptsWithMastery.sort((a, b) => a.mastery - b.mastery);

  // Distribution: 60% weak, 30% review, 10% strong
  const weakCount = Math.floor(count * 0.6);
  const reviewCount = Math.floor(count * 0.3);
  const strongCount = count - weakCount - reviewCount;

  const result: { concept: Concept; mastery: number; priority: "weak" | "review" | "strong" }[] = [];

  // Weakest first
  for (let i = 0; i < Math.min(weakCount, conceptsWithMastery.length); i++) {
    result.push({ ...conceptsWithMastery[i], priority: "weak" });
  }

  // Review (middle range)
  const midStart = Math.floor(conceptsWithMastery.length * 0.3);
  for (let i = midStart; i < Math.min(midStart + reviewCount, conceptsWithMastery.length); i++) {
    if (!result.find(r => r.concept.id === conceptsWithMastery[i].concept.id)) {
      result.push({ ...conceptsWithMastery[i], priority: "review" });
    }
  }

  // Strong (maintenance check)
  const strongStart = Math.floor(conceptsWithMastery.length * 0.7);
  for (let i = strongStart; i < Math.min(strongStart + strongCount, conceptsWithMastery.length); i++) {
    if (!result.find(r => r.concept.id === conceptsWithMastery[i].concept.id)) {
      result.push({ ...conceptsWithMastery[i], priority: "strong" });
    }
  }

  // Fill remaining slots from weakest if needed
  while (result.length < count) {
    const remaining = conceptsWithMastery.find(
      c => !result.find(r => r.concept.id === c.concept.id)
    );
    if (remaining) {
      result.push({ ...remaining, priority: "weak" });
    } else {
      break;
    }
  }

  return result.slice(0, count);
}

export async function computeSubjectMastery(
  studentId: string,
  subject: string
): Promise<number> {
  const profile = await getStudentMasteryProfile(studentId);
  const subjectConcepts = CONCEPTS.filter(c => c.subject === subject);

  const subjectMasteries = profile.filter(p =>
    subjectConcepts.some(c => c.id === p.conceptId)
  );

  if (subjectMasteries.length === 0) return 0.3;

  const total = subjectMasteries.reduce((sum, m) => sum + m.mastery, 0);
  return total / subjectMasteries.length;
}

export function applyForgettingCurve(
  mastery: number,
  lastPracticed?: Date | null,
  easinessFactor?: number
): number {
  if (!lastPracticed) return mastery;

  const daysSincePractice = (Date.now() - new Date(lastPracticed).getTime()) / (1000 * 60 * 60 * 24);

  if (daysSincePractice <= 0) return mastery;

  const stability = Math.max(1, (easinessFactor || 2.5) * 2);

  const decayedMastery = mastery * Math.exp(-daysSincePractice / stability);

  return Math.max(0.01, Math.min(mastery, decayedMastery));
}

export async function getStudentMasteryProfileWithDecay(studentId: string): Promise<{
  conceptId: string;
  mastery: number;
  displayMastery: number;
  attempts: number;
  correct: number;
  lastPracticed?: Date;
  nextReview?: Date;
  interval: number;
  repetitions: number;
  easinessFactor: number;
}[]> {
  await connectDB();

  const masteries = await ConceptMastery.find({ studentId });
  return masteries.map(m => ({
    conceptId: m.conceptId,
    mastery: m.masteryProbability,
    displayMastery: applyForgettingCurve(m.masteryProbability, m.lastPracticed, m.easinessFactor),
    attempts: m.attempts,
    correct: m.correct,
    lastPracticed: m.lastPracticed,
    nextReview: m.nextReview,
    interval: m.interval,
    repetitions: m.repetitions,
    easinessFactor: m.easinessFactor,
  }));
}
