
export enum TrainingStep {
  ENTRY = 'ENTRY',
  INTRO = 'INTRO',
  VIDEO = 'VIDEO',
  TEST = 'TEST',
  RESULT = 'RESULT'
}

export type SeatMode = 'UNLIMITED' | 'LIMITED';

export interface SeatAuditEntry {
  id: string;
  type: 'INITIAL' | 'TOPUP' | 'MODE_CHANGE';
  amount?: number;
  totalLimit?: number;
  mode?: SeatMode;
  timestamp: string;
}

export interface AccessCode {
  id: string;
  code: string;
  companyName: string;
  courseId: string; // Linked training
  seatMode: SeatMode;
  seatAllowance: number;
  seatsUsed: number;
  expiresAt: string;
  createdAt: string;
  auditLog: SeatAuditEntry[];
}

export interface LearnerData {
  firstName: string;
  lastName: string;
  companyName: string;
  jobPosition?: string;
  accessCode: string;
}

export interface TestResult {
  id: string;
  completionId: string;
  learner: LearnerData;
  courseName: string; // Captured at completion
  score: number;
  passed: boolean;
  attempts: number;
  completedAt: string;
  seatConsumed: boolean;
  seatModeAtCompletion: SeatMode;
}

export interface Checkpoint {
  time: number;
  question: string;
  options: string[];
  correctIndex: number;
}

export interface Question {
  id: number;
  text: string;
  options: string[];
  correctIndex: number;
  type: 'multiple-choice' | 'true-false';
  isScenario?: boolean;
  imageUrl?: string;
}

export interface VideoChapter {
  title: string;
  startTime: number;
}

export interface Course {
  id: string;
  title: string;
  introText: string;
  videoUrl: string; // Added for platform configurability
  videoChapters: VideoChapter[];
  checkpoints: Checkpoint[];
  questions: Question[];
  isActive: boolean;
  createdAt: string;
}
