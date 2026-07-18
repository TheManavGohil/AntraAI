export interface SpacedRepetitionCard {
  interval: number;
  repetitions: number;
  easinessFactor: number;
  nextReview: Date;
}

const MIN_EASINESS_FACTOR = 1.3;
const DEFAULT_EASINESS_FACTOR = 2.5;

export function performanceRating(isCorrect: boolean, timeTakenSeconds: number, timeEstimate: number): number {
  if (!isCorrect) {
    return 0;
  }

  if (timeEstimate <= 0) {
    return 3;
  }

  const ratio = timeEstimate / Math.max(timeTakenSeconds, 1);

  if (ratio >= 1.5) return 5;
  if (ratio >= 1.2) return 4;
  if (ratio >= 0.8) return 3;
  if (ratio >= 0.5) return 2;
  return 1;
}

export function sm2(
  rating: number,
  current: {
    interval: number;
    repetitions: number;
    easinessFactor: number;
  }
): SpacedRepetitionCard {
  const { interval, repetitions, easinessFactor } = current;

  const clampedRating = Math.max(0, Math.min(5, rating));

  let newEF = easinessFactor + (0.1 - (5 - clampedRating) * (0.08 + (5 - clampedRating) * 0.02));
  newEF = Math.max(MIN_EASINESS_FACTOR, newEF);

  if (clampedRating < 3) {
    return {
      interval: 1,
      repetitions: 0,
      easinessFactor: newEF,
      nextReview: daysFromNow(1),
    };
  }

  let newInterval: number;
  let newRepetitions: number;

  if (repetitions === 0) {
    newInterval = 1;
  } else if (repetitions === 1) {
    newInterval = 6;
  } else {
    newInterval = Math.round(interval * easinessFactor);
  }

  newRepetitions = repetitions + 1;

  return {
    interval: newInterval,
    repetitions: newRepetitions,
    easinessFactor: newEF,
    nextReview: daysFromNow(newInterval),
  };
}

export function daysFromNow(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

export function isDueForReview(nextReview?: Date | null): boolean {
  if (!nextReview) return true;
  return new Date() >= new Date(nextReview);
}

export function getReviewUrgency(nextReview?: Date | null): number {
  if (!nextReview) return 999;
  const diff = new Date().getTime() - new Date(nextReview).getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}
