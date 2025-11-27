import React, { useState, useEffect } from 'react';
import { Question, QuizState, Difficulty, Language, ExamResult } from '../types';
import { CheckCircle, XCircle, AlertCircle, ArrowRight, HelpCircle, Zap, Brain, Signal, LayoutGrid, X, SkipForward, Save, PlayCircle, GraduationCap, ArrowLeft, Clock, Bookmark } from 'lucide-react';
import { generateQuestions } from '../services/geminiService';
import { addExamResult, toggleBookmark, getBookmarks } from '../services/storageService';

interface QuizInterfaceProps {
  subject: string;
  language: Language;
  subjectName: string;
  onExit: () => void;
  onAnswer: (isCorrect: boolean) => void;
}

type QuizMode = 'practice' | 'exam';

const QuizInterface: React.FC<QuizInterfaceProps> = ({ subject, language, subjectName, onExit, onAnswer }) => {
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [mode, setMode] = useState<QuizMode>('practice');
  const [state, setState] = useState<QuizState>({
    questions: [],
    currentIndex: 0,
    score: 0,
    answers: [],
    isFinished: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [hasSavedSession, setHasSavedSession] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0); // Time in seconds
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Check for saved session on mount
  useEffect(() => {
    const savedData = localStorage.getItem(`quiz_progress_${subject}`);
    if (savedData) {
      setHasSavedSession(true);
    }
  }, [subject]);

  // Check bookmark status when question changes
  useEffect(() => {
    if (state.questions[state.currentIndex]) {
      const bookmarks = getBookmarks();
      const found = bookmarks.some(b => b.id === state.questions[state.currentIndex].id);
      setIsBookmarked(found);
    }
  }, [state.currentIndex, state.questions]);

  // Timer Logic for Exam Mode
  useEffect(() => {
    if (mode !== 'exam' || state.isFinished || timeLeft <= 0 || loading) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [mode, state.isFinished, timeLeft, loading]);

  // Set initial timer when questions load in Exam Mode
  useEffect(() => {
    if (mode === 'exam' && state.questions.length > 0 && timeLeft === 0 && !state.isFinished) {
      // Allocate 60 seconds per question
      setTimeLeft(state.questions.length * 60);
    }
  }, [state.questions.length, mode, state.isFinished]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const loadQuestions = async (selectedDifficulty: Difficulty) => {
    setLoading(true);
    setError('');
    try {
      // For Full Mock Exam ('all_subjects'), generate 25 questions. For others, default to 5.
      const count = subject === 'all_subjects' ? 25 : 5;
      const newQuestions = await generateQuestions(subject, language, selectedDifficulty, count);
      
      if (newQuestions.length === 0) {
        setError('No questions generated. Please try again.');
      } else {
        setState(prev => ({
          ...prev,
          questions: [...prev.questions, ...newQuestions],
        }));
        // If in exam mode and we are adding more questions, add time
        if (mode === 'exam') {
             setTimeLeft(prev => prev + (newQuestions.length * 60));
        }
      }
    } catch (err) {
      setError('Failed to load questions. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleDifficultySelect = (diff: Difficulty) => {
    setDifficulty(diff);
    loadQuestions(diff);
  };

  const handleResume = () => {
    const savedData = localStorage.getItem(`quiz_progress_${subject}`);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setDifficulty(parsed.difficulty);
        setMode(parsed.mode || 'practice');
        setState(parsed.state);
        setSaveMessage('Session resumed successfully!');
        setTimeout(() => setSaveMessage(''), 3000);
      } catch (e) {
        console.error("Failed to load session", e);
        setError('Failed to load saved session.');
      }
    }
  };

  const handleSaveProgress = () => {
    if (!difficulty || mode === 'exam') return; // Disable save in Exam mode
    const dataToSave = {
        subject,
        difficulty,
        mode,
        state,
        date: new Date().toISOString()
    };
    localStorage.setItem(`quiz_progress_${subject}`, JSON.stringify(dataToSave));
    setHasSavedSession(true);
    setSaveMessage('Progress saved successfully!');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleBookmarkToggle = () => {
    if (!state.questions[state.currentIndex]) return;
    const newState = toggleBookmark(state.questions[state.currentIndex]);
    setIsBookmarked(newState);
    setSaveMessage(newState ? 'Question bookmarked' : 'Bookmark removed');
    setTimeout(() => setSaveMessage(''), 2000);
  };

  const handleAnswer = (optionIndex: number) => {
    if (state.answers[state.currentIndex] !== undefined) return; // Prevent changing answer

    const isCorrect = optionIndex === state.questions[state.currentIndex].correctAnswerIndex;
    
    // Notify parent component to update stats
    onAnswer(isCorrect);

    setState(prev => {
      const newAnswers = [...prev.answers];
      newAnswers[prev.currentIndex] = optionIndex;
      return {
        ...prev,
        score: isCorrect ? prev.score + 1 : prev.score,
        answers: newAnswers
      };
    });
  };

  const handleNext = () => {
    if (state.currentIndex + 1 >= state.questions.length && difficulty) {
      // Reached end of current batch, load more
      loadQuestions(difficulty); 
      setState(prev => ({ ...prev, currentIndex: prev.currentIndex + 1 }));
    } else {
      setState(prev => ({ ...prev, currentIndex: prev.currentIndex + 1 }));
    }
  };

  const jumpToQuestion = (index: number) => {
    setState(prev => ({ ...prev, currentIndex: index }));
    setShowMobileNav(false);
  };

  const handleFinish = () => {
    if (state.isFinished) return;

    // Save to history
    if (difficulty) {
      const result: ExamResult = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        subjectId: subject,
        subjectName: subjectName,
        score: state.score,
        totalQuestions: state.questions.length, // Or attempted questions? Usually total questions in the set.
        difficulty: difficulty,
        mode: mode
      };
      addExamResult(result);
    }

    setState(prev => ({ ...prev, isFinished: true }));
    // Clear saved progress when finished naturally
    localStorage.removeItem(`quiz_progress_${subject}`);
    setHasSavedSession(false);
  };

  const handleRestart = () => {
      setState({
          questions: [],
          currentIndex: 0,
          score: 0,
          answers: [],
          isFinished: false,
      });
      setDifficulty(null);
      setTimeLeft(0);
  };

  // Helper to render the question grid
  const QuestionGrid = () => (
    <div className="grid grid-cols-5 gap-3">
      {state.questions.map((q, idx) => {
        const isAnswered = state.answers[idx] !== undefined;
        const isCorrect = isAnswered && state.answers[idx] === q.correctAnswerIndex;
        const isCurrent = state.currentIndex === idx;

        let bgClass = "bg-white border-slate-200 text-slate-600 hover:border-primary-300";
        if (isCurrent) {
          bgClass = "ring-2 ring-primary-500 border-primary-500 text-primary-700 bg-primary-50 font-bold";
        } else if (isAnswered) {
          if (mode === 'exam') {
             // Exam mode: Neutral indicator for answered
             bgClass = "bg-slate-100 border-slate-300 text-slate-700";
          } else {
             // Practice mode: Correct/Incorrect
             bgClass = isCorrect 
              ? "bg-green-100 border-green-200 text-green-700" 
              : "bg-red-100 border-red-200 text-red-700";
          }
        }

        return (
          <button
            key={idx}
            onClick={() => jumpToQuestion(idx)}
            className={`h-10 w-10 rounded-lg flex items-center justify-center text-sm border transition-all ${bgClass}`}
          >
            {idx + 1}
          </button>
        );
      })}
    </div>
  );

  // 1. Difficulty Selection Screen
  if (!difficulty) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-6">
          <button 
            onClick={onExit}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors px-3 py-2 -ml-3 rounded-lg hover:bg-slate-100"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium">Back to Subjects</span>
          </button>
        </div>

        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">{subjectName}</h2>
          <p className="text-slate-600">Configure your practice session</p>
        </div>

        {/* Mode Toggle */}
        <div className="flex justify-center mb-10">
          <div className="bg-slate-100 p-1 rounded-xl inline-flex shadow-inner">
            <button
              onClick={() => setMode('practice')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-all ${
                mode === 'practice' 
                  ? 'bg-white text-primary-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Brain className="h-4 w-4" />
              Practice Mode
            </button>
            <button
              onClick={() => setMode('exam')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-all ${
                mode === 'exam' 
                  ? 'bg-white text-primary-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <GraduationCap className="h-4 w-4" />
              Exam Mode
            </button>
          </div>
        </div>

        {mode === 'exam' && (
           <div className="max-w-lg mx-auto mb-8 bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-semibold mb-1">Exam Mode Active</p>
                <ul className="list-disc pl-4 space-y-1 text-amber-700/80">
                  <li>No skipping questions</li>
                  <li>Answers cannot be changed once selected</li>
                  <li>Timed session (1 min per question)</li>
                  <li>No immediate explanations or feedback</li>
                </ul>
              </div>
           </div>
        )}

        {/* Resume Option (Only for Practice) */}
        {hasSavedSession && mode === 'practice' && (
          <div className="mb-10 max-w-lg mx-auto">
            <button 
              onClick={handleResume}
              className="w-full bg-gradient-to-r from-indigo-50 to-blue-50 border border-blue-200 p-4 rounded-xl flex items-center justify-between hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                  <PlayCircle className="h-6 w-6" />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-slate-900">Resume Saved Session</h3>
                  <p className="text-sm text-slate-500">Continue where you left off</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-blue-400 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button
            onClick={() => handleDifficultySelect(Difficulty.EASY)}
            className="bg-white p-8 rounded-2xl border border-slate-200 hover:border-green-400 hover:shadow-xl hover:shadow-green-900/5 transition-all group text-left relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-green-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Signal className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Easy</h3>
              <p className="text-sm text-slate-500">Fundamentals and basic concepts. Perfect for beginners.</p>
            </div>
          </button>

          <button
            onClick={() => handleDifficultySelect(Difficulty.MEDIUM)}
            className="bg-white p-8 rounded-2xl border border-slate-200 hover:border-yellow-400 hover:shadow-xl hover:shadow-yellow-900/5 transition-all group text-left relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Brain className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Medium</h3>
              <p className="text-sm text-slate-500">Standard exam level questions. Good for regular practice.</p>
            </div>
          </button>

          <button
            onClick={() => handleDifficultySelect(Difficulty.HARD)}
            className="bg-white p-8 rounded-2xl border border-slate-200 hover:border-red-400 hover:shadow-xl hover:shadow-red-900/5 transition-all group text-left relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-red-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Hard</h3>
              <p className="text-sm text-slate-500">Complex problems and advanced topics. Challenge yourself.</p>
            </div>
          </button>
        </div>

        {/* Notification Toast */}
        {saveMessage && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-50 animate-in fade-in slide-in-from-bottom-4">
            <CheckCircle className="h-4 w-4 text-green-400" />
            <span>{saveMessage}</span>
          </div>
        )}
      </div>
    );
  }

  // 2. Loading State (Initial)
  if (loading && state.questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="relative w-24 h-24 mb-6">
          <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-primary-600 rounded-full border-t-transparent animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-primary-600">AI</span>
          </div>
        </div>
        <h3 className="text-xl font-semibold text-slate-800 mb-2">Generating Questions</h3>
        <p className="text-slate-500 max-w-sm">Curating {difficulty} level {subjectName} questions in {language}...</p>
        {subject === 'all_subjects' && (
          <p className="text-xs text-slate-400 mt-2 max-w-xs mx-auto">
            Preparing a comprehensive 25-question mock exam. This may take up to 30 seconds.
          </p>
        )}
      </div>
    );
  }

  // 3. Error State
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="bg-red-50 p-4 rounded-full mb-4">
          <AlertCircle className="h-10 w-10 text-red-500" />
        </div>
        <h3 className="text-xl font-semibold text-slate-800 mb-2">Oops! Something went wrong</h3>
        <p className="text-slate-500 mb-6">{error}</p>
        <button onClick={() => difficulty && loadQuestions(difficulty)} className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Try Again</button>
        <button onClick={onExit} className="mt-4 text-slate-500 hover:text-slate-700">Go Back</button>
      </div>
    );
  }

  // 4. Review Mode
  if (state.isFinished) {
    const totalAttempted = state.answers.filter(a => a !== undefined).length;
    const accuracy = totalAttempted > 0 ? Math.round((state.score / totalAttempted) * 100) : 0;

    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
           <div className="flex items-center gap-3">
             <button onClick={onExit} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
               <ArrowLeft className="h-5 w-5" />
             </button>
             <h2 className="text-2xl font-bold text-slate-900">Quiz Results</h2>
           </div>
           <button onClick={onExit} className="text-slate-500 hover:text-slate-700">
             <XCircle className="h-6 w-6" />
           </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-center">
            <div className="text-slate-500 text-sm font-medium uppercase tracking-wide mb-1">Score</div>
            <div className="text-3xl font-bold text-primary-600">{state.score}</div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-center">
            <div className="text-slate-500 text-sm font-medium uppercase tracking-wide mb-1">Accuracy</div>
            <div className={`text-3xl font-bold ${accuracy >= 70 ? 'text-green-600' : accuracy >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
              {accuracy}%
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-center">
            <div className="text-slate-500 text-sm font-medium uppercase tracking-wide mb-1">Attempted</div>
            <div className="text-3xl font-bold text-slate-900">{totalAttempted}</div>
          </div>
        </div>

        <div className="space-y-6">
          {state.questions.map((q, idx) => {
            const userAnswer = state.answers[idx];
            const isSkipped = userAnswer === undefined;
            const isCorrect = userAnswer === q.correctAnswerIndex;

            return (
              <div key={idx} className={`p-6 rounded-xl border ${
                isSkipped ? 'bg-slate-50 border-slate-200' :
                isCorrect ? 'bg-green-50 border-green-200' :
                'bg-red-50 border-red-200'
              }`}>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-white border border-slate-200 font-bold text-slate-500 text-sm">
                    {idx + 1}
                  </div>
                  <div className="flex-grow">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">{q.questionText}</h3>
                    <div className="space-y-2">
                      {q.options.map((opt, optIdx) => {
                        let optClass = "p-3 rounded-lg border text-sm ";
                        if (optIdx === q.correctAnswerIndex) {
                           optClass += "bg-green-100 border-green-300 text-green-800 font-medium";
                        } else if (optIdx === userAnswer && !isCorrect) {
                           optClass += "bg-red-100 border-red-300 text-red-800 font-medium";
                        } else {
                           optClass += "bg-white border-slate-200 text-slate-500";
                        }
                        
                        return (
                          <div key={optIdx} className={optClass}>
                            {opt} {optIdx === q.correctAnswerIndex && "(Correct Answer)"}
                            {optIdx === userAnswer && optIdx !== q.correctAnswerIndex && "(Your Answer)"}
                          </div>
                        )
                      })}
                    </div>

                    {/* Explanation - Hide in Exam Mode */}
                    {mode !== 'exam' && (
                      <div className="mt-4 p-4 bg-white/50 rounded-lg border border-slate-200/60">
                         <div className="flex items-start gap-2">
                           <HelpCircle className="h-5 w-5 text-primary-600 flex-shrink-0 mt-0.5" />
                           <div>
                             <p className="font-semibold text-slate-900 text-sm">Explanation</p>
                             <p className="text-slate-700 text-sm mt-1">{q.explanation}</p>
                             {q.explanationSummary && (
                               <p className="text-slate-500 text-xs mt-2 pt-2 border-t border-slate-200 italic">
                                 Summary: {q.explanationSummary}
                               </p>
                             )}
                           </div>
                         </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 5. Active Quiz View
  const currentQ = state.questions[state.currentIndex];

  // Guard against undefined question (e.g. during "load more" transition)
  if (!currentQ) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <div className="relative w-12 h-12 mb-4">
             <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
             <div className="absolute inset-0 border-4 border-primary-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p className="text-slate-500 font-medium">Preparing next question...</p>
        </div>
      );
  }

  const isAnswered = state.answers[state.currentIndex] !== undefined;
  
  return (
    <div className="min-h-screen bg-slate-50 pb-20">
       {/* Header */}
       <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
         <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                 <span className="font-bold text-slate-900 hidden sm:inline">{subjectName}</span>
                 <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                   difficulty === Difficulty.EASY ? 'bg-green-100 text-green-700' :
                   difficulty === Difficulty.MEDIUM ? 'bg-yellow-100 text-yellow-700' :
                   'bg-red-100 text-red-700'
                 }`}>
                   {difficulty}
                 </span>
                 {mode === 'exam' && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-800 text-white flex items-center gap-1">
                      <GraduationCap className="h-3 w-3" /> Exam Mode
                    </span>
                 )}
              </div>
            </div>

            {/* Timer for Exam Mode */}
            {mode === 'exam' && (
              <div className={`flex items-center gap-2 font-mono text-xl font-bold ${
                timeLeft < 60 ? 'text-red-600 animate-pulse' : 'text-slate-700'
              }`}>
                <Clock className="h-5 w-5" />
                {formatTime(timeLeft)}
              </div>
            )}

            <div className="flex items-center gap-2">
               {mode === 'practice' && (
                 <button 
                  onClick={handleSaveProgress}
                  className="hidden sm:flex items-center gap-2 text-slate-600 hover:text-primary-600 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
                  title="Save Progress"
                 >
                   <Save className="h-5 w-5" />
                   <span className="text-sm font-medium">Save</span>
                 </button>
               )}
               
               <button 
                onClick={handleFinish}
                className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
               >
                 Finish
               </button>
               
               <button 
                 className="sm:hidden p-2 text-slate-600"
                 onClick={() => setShowMobileNav(!showMobileNav)}
               >
                 <LayoutGrid className="h-6 w-6" />
               </button>
            </div>
         </div>
       </header>

       <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6 items-start">
          {/* Question Area */}
          <div className="flex-grow min-w-0">
             <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Progress Bar */}
                <div className="h-1 bg-slate-100 w-full">
                  <div 
                    className="h-full bg-primary-500 transition-all duration-300"
                    style={{ width: `${((state.currentIndex + 1) / state.questions.length) * 100}%` }}
                  ></div>
                </div>

                <div className="p-6 md:p-8">
                   <div className="flex justify-between items-start mb-6">
                      <h2 className="text-xl md:text-2xl font-bold text-slate-900 leading-relaxed">
                        <span className="text-slate-400 mr-2">Q{state.currentIndex + 1}.</span>
                        {currentQ.questionText}
                      </h2>
                      <button 
                        onClick={handleBookmarkToggle}
                        className={`p-2 rounded-full transition-colors ${isBookmarked ? 'bg-primary-50 text-primary-600' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
                        title={isBookmarked ? "Remove Bookmark" : "Bookmark Question"}
                      >
                         <Bookmark className={`h-6 w-6 ${isBookmarked ? 'fill-current' : ''}`} />
                      </button>
                   </div>

                   <div className="space-y-3 mb-8">
                      {currentQ.options.map((option, idx) => {
                        const isSelected = state.answers[state.currentIndex] === idx;
                        const showCorrectness = isAnswered && mode === 'practice';
                        const isCorrect = idx === currentQ.correctAnswerIndex;
                        
                        let btnClass = "w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between group ";
                        
                        if (showCorrectness) {
                           if (isCorrect) btnClass += "border-green-500 bg-green-50 text-green-800";
                           else if (isSelected) btnClass += "border-red-500 bg-red-50 text-red-800";
                           else btnClass += "border-slate-100 text-slate-500 opacity-60";
                        } else if (isAnswered && mode === 'exam') {
                           // Exam mode: Selected gets neutral highlight, others faded
                           if (isSelected) btnClass += "border-slate-500 bg-slate-100 text-slate-900 font-medium";
                           else btnClass += "border-slate-100 text-slate-400";
                        } else {
                           // Unanswered
                           btnClass += "border-slate-200 hover:border-primary-300 hover:bg-slate-50 text-slate-700";
                        }

                        return (
                          <button
                            key={idx}
                            onClick={() => handleAnswer(idx)}
                            disabled={isAnswered}
                            className={btnClass}
                          >
                            <span className="flex items-center gap-3">
                              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border ${
                                showCorrectness && isCorrect ? 'bg-green-200 border-green-300 text-green-800' :
                                showCorrectness && isSelected ? 'bg-red-200 border-red-300 text-red-800' :
                                isSelected ? 'bg-slate-800 text-white border-slate-800' :
                                'bg-white border-slate-300 text-slate-500 group-hover:border-primary-400 group-hover:text-primary-600'
                              }`}>
                                {String.fromCharCode(65 + idx)}
                              </span>
                              {option}
                            </span>
                            
                            {showCorrectness && isCorrect && <CheckCircle className="h-5 w-5 text-green-600" />}
                            {showCorrectness && isSelected && !isCorrect && <XCircle className="h-5 w-5 text-red-500" />}
                          </button>
                        )
                      })}
                   </div>

                   {/* Explanation Section (Practice Mode Only) */}
                   {isAnswered && mode === 'practice' && (
                     <div className="bg-blue-50 rounded-xl p-6 border border-blue-100 mb-8 animate-in fade-in slide-in-from-top-2">
                       <div className="flex items-center gap-2 mb-3">
                         <div className="bg-blue-100 p-1.5 rounded-lg">
                           <HelpCircle className="h-5 w-5 text-blue-600" />
                         </div>
                         <h3 className="font-bold text-blue-900">Explanation</h3>
                       </div>
                       <p className="text-blue-800 leading-relaxed text-sm md:text-base">
                         {currentQ.explanation}
                       </p>
                       {currentQ.explanationSummary && (
                         <div className="mt-4 pt-4 border-t border-blue-200/50">
                            <p className="text-blue-700 text-sm font-medium italic">
                               💡 Summary: {currentQ.explanationSummary}
                            </p>
                         </div>
                       )}
                     </div>
                   )}

                   {/* Footer Navigation */}
                   <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                      {mode === 'practice' && !isAnswered ? (
                        <button 
                          onClick={handleNext}
                          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                          <SkipForward className="h-4 w-4" />
                          Skip Question
                        </button>
                      ) : <div></div>}

                      <button
                        onClick={handleNext}
                        className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-primary-500/20 hover:shadow-primary-500/30 hover:-translate-y-0.5"
                      >
                        {state.currentIndex === state.questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
                        <ArrowRight className="h-5 w-5" />
                      </button>
                   </div>
                </div>
             </div>
          </div>

          {/* Desktop Sidebar */}
          <div className="hidden lg:block w-72 flex-shrink-0">
             <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm sticky top-24">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-900">Questions</h3>
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                    {state.currentIndex + 1}/{state.questions.length}
                  </span>
                </div>
                <QuestionGrid />
                
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <div className="text-xs text-slate-500 font-medium mb-3 uppercase tracking-wide">Legend</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                       <div className="w-3 h-3 rounded-full bg-primary-500"></div>
                       <span className="text-slate-600">Current</span>
                    </div>
                    {mode === 'practice' ? (
                      <>
                        <div className="flex items-center gap-2">
                           <div className="w-3 h-3 rounded-full bg-green-500"></div>
                           <span className="text-slate-600">Correct</span>
                        </div>
                        <div className="flex items-center gap-2">
                           <div className="w-3 h-3 rounded-full bg-red-500"></div>
                           <span className="text-slate-600">Incorrect</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                         <div className="w-3 h-3 rounded-full bg-slate-500"></div>
                         <span className="text-slate-600">Answered</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                       <div className="w-3 h-3 rounded-full bg-white border border-slate-300"></div>
                       <span className="text-slate-600">Not Visited</span>
                    </div>
                  </div>
                </div>
             </div>
          </div>
       </div>

       {/* Mobile Nav Drawer */}
       {showMobileNav && (
         <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowMobileNav(false)}></div>
            <div className="relative w-80 bg-white h-full shadow-2xl p-6 overflow-y-auto">
               <div className="flex justify-between items-center mb-6">
                 <h3 className="font-bold text-slate-900 text-lg">Questions</h3>
                 <button onClick={() => setShowMobileNav(false)} className="p-2 text-slate-500 hover:text-slate-700">
                   <X className="h-6 w-6" />
                 </button>
               </div>
               <QuestionGrid />
            </div>
         </div>
       )}

        {/* Toast Notification */}
        {saveMessage && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-50 animate-in fade-in slide-in-from-bottom-4">
            <CheckCircle className="h-4 w-4 text-green-400" />
            <span>{saveMessage}</span>
          </div>
        )}
    </div>
  );
};

export default QuizInterface;
