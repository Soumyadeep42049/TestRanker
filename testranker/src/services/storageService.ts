import { UserStats, SUBJECTS, ExamResult, Question, BookmarkedQuestion } from '../types';

const STORAGE_KEY = 'prepMasterStats';

export const getStats = (): UserStats => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      // Ensure all subjects exist in stats (in case of schema updates)
      SUBJECTS.forEach(sub => {
        if (!parsed.subjectStats[sub.id]) {
          parsed.subjectStats[sub.id] = { totalAttempted: 0, totalCorrect: 0 };
        }
      });
      // Ensure history exists
      if (!parsed.history) {
        parsed.history = [];
      }
      // Ensure bookmarks exists
      if (!parsed.bookmarks) {
        parsed.bookmarks = [];
      }
      return parsed;
    } catch (e) {
      console.error("Failed to parse stats", e);
    }
  }
  
  // Initialize default stats
  const initial: UserStats = {
    totalQuestions: 0,
    totalCorrect: 0,
    subjectStats: {},
    history: [],
    bookmarks: []
  };
  
  SUBJECTS.forEach(sub => {
    initial.subjectStats[sub.id] = { totalAttempted: 0, totalCorrect: 0 };
  });
  
  return initial;
};

export const updateStats = (subjectId: string, isCorrect: boolean): UserStats => {
  const stats = getStats();
  
  stats.totalQuestions += 1;
  if (isCorrect) stats.totalCorrect += 1;
  
  if (!stats.subjectStats[subjectId]) {
    stats.subjectStats[subjectId] = { totalAttempted: 0, totalCorrect: 0 };
  }
  
  stats.subjectStats[subjectId].totalAttempted += 1;
  if (isCorrect) stats.subjectStats[subjectId].totalCorrect += 1;
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  return stats;
};

export const addExamResult = (result: ExamResult): void => {
  const stats = getStats();
  
  // Initialize history if it doesn't exist (migration)
  if (!stats.history) {
    stats.history = [];
  }

  // Add to beginning of array
  stats.history = [result, ...stats.history];
  
  // Optional: Limit history size to keep storage clean (e.g., last 50 exams)
  if (stats.history.length > 50) {
    stats.history = stats.history.slice(0, 50);
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
};

export const toggleBookmark = (question: Question): boolean => {
  const stats = getStats();
  if (!stats.bookmarks) stats.bookmarks = [];

  const existingIndex = stats.bookmarks.findIndex(b => b.id === question.id);
  const isAdding = existingIndex === -1;

  if (isAdding) {
    // Add to beginning
    const newBookmark: BookmarkedQuestion = {
      ...question,
      savedAt: new Date().toISOString()
    };
    stats.bookmarks.unshift(newBookmark);
  } else {
    // Remove
    stats.bookmarks.splice(existingIndex, 1);
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  return isAdding;
};

export const getBookmarks = (): BookmarkedQuestion[] => {
  return getStats().bookmarks || [];
};