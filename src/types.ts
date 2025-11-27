export enum Language {
  ENGLISH = 'English',
  BENGALI = 'Bengali',
  HINDI = 'Hindi'
}

export enum Difficulty {
  EASY = 'Easy',
  MEDIUM = 'Medium',
  HARD = 'Hard'
}

export interface User {
  email: string;
  name: string;
  isVerified: boolean;
}

export interface Question {
  id: string;
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  explanationSummary?: string;
  subject: string;
  difficulty: string;
}

export interface QuizState {
  questions: Question[];
  currentIndex: number;
  score: number;
  answers: number[]; // Index of selected answer for each question
  isFinished: boolean;
}

export interface SubjectStats {
  totalAttempted: number;
  totalCorrect: number;
}

export interface ExamResult {
  id: string;
  date: string;
  subjectId: string;
  subjectName: string;
  score: number;
  totalQuestions: number;
  difficulty: string;
  mode: 'practice' | 'exam';
}

export interface BookmarkedQuestion extends Question {
  savedAt: string;
}

export interface UserStats {
  totalQuestions: number;
  totalCorrect: number;
  subjectStats: Record<string, SubjectStats>;
  history: ExamResult[];
  bookmarks: BookmarkedQuestion[];
}

export const SUBJECTS = [
  { id: 'gen_science', name: 'General Science', icon: 'FlaskConical' },
  { id: 'gk', name: 'General Knowledge', icon: 'Globe' },
  { id: 'current_affairs', name: 'Current Affairs', icon: 'Newspaper' },
  { id: 'english', name: 'English', icon: 'BookA' },
  { id: 'math', name: 'Mathematics', icon: 'Calculator' },
  { id: 'reasoning', name: 'Reasoning', icon: 'BrainCircuit' },
  { id: 'history', name: 'History', icon: 'Landmark' },
  { id: 'geography', name: 'Geography', icon: 'Map' },
];
