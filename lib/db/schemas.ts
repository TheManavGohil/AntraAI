import mongoose, { Schema, Document, Types } from "mongoose";

export interface IStudent extends Document {
  _id: Types.ObjectId;
  name: string;
  class: 9 | 10;
  schoolName: string;
  parentPhone: string;
  consentGiven: boolean;
  consentDate?: Date;
  preferredSubjects: string[];
  createdAt: Date;
}

export interface IConceptMastery extends Document {
  _id: Types.ObjectId;
  studentId: string;
  conceptId: string;
  masteryProbability: number;
  attempts: number;
  correct: number;
  lastPracticed?: Date;
  nextReview?: Date;
  interval: number;
  repetitions: number;
  easinessFactor: number;
}

export interface ITestResult extends Document {
  _id: Types.ObjectId;
  studentId: string;
  testType: "diagnostic" | "weekly" | "quiz" | "review";
  subject: string;
  score: number;
  totalMarks: number;
  correctAnswers: number;
  totalQuestions: number;
  timeTakenSeconds: number;
  questions: {
    questionId: string;
    studentAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    conceptId: string;
    timeTaken: number;
    marks: number;
  }[];
  insights?: {
    weakConcepts: string[];
    strongConcepts: string[];
    improvementAreas: string[];
    suggestion: string;
  };
  percentage: number;
  takenAt: Date;
}

export interface IGeneratedTest extends Document {
  _id: Types.ObjectId;
  testId: string;
  studentId: string;
  subject: string;
  type: "diagnostic" | "weekly" | "quiz" | "review";
  questions: {
    id: string;
    type: "MCQ" | "short_2mark" | "short_3mark" | "long_5mark";
    question: string;
    options: string[] | null;
    correctAnswer: string;
    conceptId: string;
    marks: number;
    timeEstimate: number;
  }[];
  totalMarks: number;
  timeLimitMinutes: number;
  graded?: boolean;
  createdAt: Date;
  expiresAt: Date;
}

export interface ISocraticSession extends Document {
  _id: Types.ObjectId;
  studentId: string;
  conceptId?: string;
  subject: string;
  steps: {
    role: "student" | "tutor";
    content: string;
    timestamp: Date;
  }[];
  status: "in_progress" | "completed" | "timeout";
  outcome: "guided" | "direct" | "stuck";
  stepsCount: number;
  startedAt: Date;
  completedAt?: Date;
}

export interface IChatHistory extends Document {
  _id: Types.ObjectId;
  studentId: string;
  role: "user" | "assistant";
  content: string;
  subject?: string;
  chapter?: string;
  concept?: string;
  createdAt: Date;
}

const StudentSchema = new Schema<IStudent>({
  name: { type: String, required: true },
  class: { type: Number, required: true, enum: [9, 10] },
  schoolName: { type: String, required: true },
  parentPhone: { type: String, required: true },
  consentGiven: { type: Boolean, default: false },
  consentDate: { type: Date },
  preferredSubjects: { type: [String], default: ["science", "algebra", "geometry"] },
}, { timestamps: { createdAt: true, updatedAt: false } });

const ConceptMasterySchema = new Schema<IConceptMastery>({
  studentId: { type: String, required: true, ref: "Student" },
  conceptId: { type: String, required: true },
  masteryProbability: { type: Number, default: 0.3 },
  attempts: { type: Number, default: 0 },
  correct: { type: Number, default: 0 },
  lastPracticed: { type: Date },
  nextReview: { type: Date },
  interval: { type: Number, default: 0 },
  repetitions: { type: Number, default: 0 },
  easinessFactor: { type: Number, default: 2.5 },
});

ConceptMasterySchema.index({ studentId: 1, conceptId: 1 }, { unique: true });

const TestResultSchema = new Schema<ITestResult>({
  studentId: { type: String, required: true, ref: "Student" },
  testType: { type: String, required: true, enum: ["diagnostic", "weekly", "quiz", "review"] },
  subject: { type: String, required: true },
  score: { type: Number, required: true },
  totalMarks: { type: Number, required: true },
  correctAnswers: { type: Number, required: true },
  totalQuestions: { type: Number, required: true },
  timeTakenSeconds: { type: Number, required: true },
  questions: [{
    questionId: String,
    studentAnswer: String,
    correctAnswer: String,
    isCorrect: Boolean,
    conceptId: String,
    timeTaken: Number,
    marks: Number,
  }],
  insights: {
    weakConcepts: [String],
    strongConcepts: [String],
    improvementAreas: [String],
    suggestion: String,
  },
  percentage: { type: Number, default: 0 },
}, { timestamps: { createdAt: true, updatedAt: false } });

TestResultSchema.index({ studentId: 1, takenAt: -1 });

const ChatHistorySchema = new Schema<IChatHistory>({
  studentId: { type: String, required: true, ref: "Student" },
  role: { type: String, required: true, enum: ["user", "assistant"] },
  content: { type: String, required: true },
  subject: String,
  chapter: String,
  concept: String,
}, { timestamps: { createdAt: true, updatedAt: false } });

ChatHistorySchema.index({ studentId: 1, createdAt: -1 });
ChatHistorySchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

const GeneratedTestSchema = new Schema<IGeneratedTest>({
  testId: { type: String, required: true, unique: true },
  studentId: { type: String, required: true, ref: "Student" },
  subject: { type: String, required: true },
  type: { type: String, required: true, enum: ["diagnostic", "weekly", "quiz", "review"] },
  questions: [{
    id: { type: String, required: true },
    type: { type: String, required: true, enum: ["MCQ", "short_2mark", "short_3mark", "long_5mark"] },
    question: { type: String, required: true },
    options: [String],
    correctAnswer: { type: String, required: true },
    conceptId: { type: String, required: true },
    marks: { type: Number, required: true },
    timeEstimate: { type: Number, required: true },
  }],
  totalMarks: { type: Number, required: true },
  timeLimitMinutes: { type: Number, required: true },
  graded: { type: Boolean, default: false },
  expiresAt: { type: Date, required: true },
}, { timestamps: { createdAt: true, updatedAt: false } });

GeneratedTestSchema.index({ testId: 1 });
GeneratedTestSchema.index({ studentId: 1, createdAt: -1 });
GeneratedTestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const SocraticSessionSchema = new Schema<ISocraticSession>({
  studentId: { type: String, required: true, ref: "Student" },
  conceptId: { type: String },
  subject: { type: String, required: true },
  steps: [{
    role: { type: String, required: true, enum: ["student", "tutor"] },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  }],
  status: { type: String, required: true, enum: ["in_progress", "completed", "timeout"], default: "in_progress" },
  outcome: { type: String, required: true, enum: ["guided", "direct", "stuck"], default: "guided" },
  stepsCount: { type: Number, default: 0 },
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
}, { timestamps: { createdAt: true, updatedAt: false } });

SocraticSessionSchema.index({ studentId: 1, createdAt: -1 });
SocraticSessionSchema.index({ studentId: 1, status: 1 });

export const Student = mongoose.models.Student || mongoose.model<IStudent>("Student", StudentSchema);
export const ConceptMastery = mongoose.models.ConceptMastery || mongoose.model<IConceptMastery>("ConceptMastery", ConceptMasterySchema);
export const TestResult = mongoose.models.TestResult || mongoose.model<ITestResult>("TestResult", TestResultSchema);
export const ChatHistory = mongoose.models.ChatHistory || mongoose.model<IChatHistory>("ChatHistory", ChatHistorySchema);
export const GeneratedTest = mongoose.models.GeneratedTest || mongoose.model<IGeneratedTest>("GeneratedTest", GeneratedTestSchema);
export const SocraticSession = mongoose.models.SocraticSession || mongoose.model<ISocraticSession>("SocraticSession", SocraticSessionSchema);
