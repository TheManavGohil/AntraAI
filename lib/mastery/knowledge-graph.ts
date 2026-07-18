import { CONCEPTS, CHAPTERS, Concept, Chapter } from "@/lib/utils/constants";

export interface ConceptNode {
  id: string;
  concept: Concept;
  prerequisites: Concept[];
  dependents: Concept[];
  mastery?: number;
}

export function buildConceptGraph(standard?: number): Map<string, ConceptNode> {
  const graph = new Map<string, ConceptNode>();
  const concepts = standard
    ? CONCEPTS.filter(c => c.standard === standard)
    : CONCEPTS;

  for (const concept of concepts) {
    graph.set(concept.id, {
      id: concept.id,
      concept,
      prerequisites: [],
      dependents: [],
    });
  }

  for (const concept of concepts) {
    const node = graph.get(concept.id)!;
    for (const prereqId of concept.prerequisites) {
      const prereqNode = graph.get(prereqId);
      if (prereqNode) {
        node.prerequisites.push(prereqNode.concept);
        prereqNode.dependents.push(concept);
      }
    }
  }

  return graph;
}

export function getPrerequisiteChain(conceptId: string): Concept[] {
  const chain: Concept[] = [];
  const visited = new Set<string>();

  function traverse(id: string) {
    if (visited.has(id)) return;
    visited.add(id);

    const concept = CONCEPTS.find(c => c.id === id);
    if (!concept) return;

    for (const prereqId of concept.prerequisites) {
      traverse(prereqId);
    }

    chain.push(concept);
  }

  traverse(conceptId);
  return chain;
}

export function getNextConcepts(
  masteredConcepts: string[],
  subject: string,
  standard: number
): Concept[] {
  const subjectConcepts = CONCEPTS.filter(c => c.subject === subject && c.standard === standard);

  return subjectConcepts.filter(concept => {
    const allPrereqsMet = concept.prerequisites.every(
      prereqId => masteredConcepts.includes(prereqId)
    );
    const notYetMastered = !masteredConcepts.includes(concept.id);
    return allPrereqsMet && notYetMastered;
  });
}

export function getChapterProgress(
  studentId: string,
  masteries: { conceptId: string; mastery: number }[],
  standard: number
): { chapter: Chapter; totalConcepts: number; masteredCount: number; averageMastery: number }[] {
  const standardChapters = CHAPTERS.filter(c => c.standard === standard);

  return standardChapters.map(chapter => {
    const chapterConcepts = CONCEPTS.filter(
      c => c.chapter === chapter.name && c.subject === chapter.subject && c.standard === chapter.standard
    );

    const chapterMasteries = chapterConcepts.map(concept => {
      const m = masteries.find(mastery => mastery.conceptId === concept.id);
      return m?.mastery || 0.3;
    });

    const averageMastery = chapterMasteries.length > 0
      ? chapterMasteries.reduce((a, b) => a + b, 0) / chapterMasteries.length
      : 0.3;

    const masteredCount = chapterMasteries.filter(m => m >= 0.7).length;

    return {
      chapter,
      totalConcepts: chapterConcepts.length,
      masteredCount,
      averageMastery,
    };
  });
}

export function getSubjectProgress(
  masteries: { conceptId: string; mastery: number }[],
  subject: string,
  standard: number
): { total: number; mastered: number; inProgress: number; notStarted: number } {
  const concepts = CONCEPTS.filter(c => c.subject === subject && c.standard === standard);

  let mastered = 0;
  let inProgress = 0;
  let notStarted = 0;

  for (const concept of concepts) {
    const m = masteries.find(mastery => mastery.conceptId === concept.id);
    const prob = m?.mastery || 0.3;

    if (prob >= 0.7) mastered++;
    else if (prob > 0.3) inProgress++;
    else notStarted++;
  }

  return {
    total: concepts.length,
    mastered,
    inProgress,
    notStarted,
  };
}
