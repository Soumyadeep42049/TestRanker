import React, { useMemo, useState } from 'react';
import { UserStats, SUBJECTS, BookmarkedQuestion } from '../types';
import * as Icons from 'lucide-react';
import { PieChart, Trophy, Target, Activity, TrendingUp, AlertCircle, History, Calendar, GraduationCap, Brain, Bookmark, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { toggleBookmark, getStats } from '../services/storageService';

interface DashboardProps {
  stats: UserStats;
  onHomeClick: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ stats: initialStats, onHomeClick }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'bookmarks'>('overview');
  const [localStats, setLocalStats] = useState(initialStats);
  const [expandedBookmark, setExpandedBookmark] = useState<string | null>(null);

  // Helper to get icon
  const DynamicIcon = ({ name, className }: { name: string; className?: string }) => {
    // @ts-ignore
    const IconComponent = Icons[name];
    return IconComponent ? <IconComponent className={className} /> : null;
  };

  const handleRemoveBookmark = (q: BookmarkedQuestion) => {
    toggleBookmark(q);
    // Refresh stats
    setLocalStats(getStats());
  };

  const overallAccuracy = localStats.totalQuestions > 0 
    ? Math.round((localStats.totalCorrect / localStats.totalQuestions) * 100) 
    : 0;

  // Process data for charts
  const subjectPerformance = useMemo(() => {
    return SUBJECTS.map(sub => {
      const subStats = localStats.subjectStats[sub.id] || { totalAttempted: 0, totalCorrect: 0 };
      const accuracy = subStats.totalAttempted > 0 
        ? Math.round((subStats.totalCorrect / subStats.totalAttempted) * 100) 
        : 0;
      return {
        ...sub,
        ...subStats,
        accuracy
      };
    }).sort((a, b) => b.accuracy - a.accuracy); // Sort by best performance
  }, [localStats]);

  const strongestSubject = subjectPerformance.length > 0 && subjectPerformance[0].totalAttempted > 0 ? subjectPerformance[0] : null;
  const weakestSubject = [...subjectPerformance].reverse().find(s => s.totalAttempted > 0 && s.accuracy < 50);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Your Progress Dashboard</h1>
          <p className="text-slate-500 mt-1">Track your performance and mastery across subjects</p>
        </div>
        <button 
          onClick={onHomeClick}
          className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Back to Practice
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-4 mb-8 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-4 px-2 font-medium text-sm transition-colors relative ${
            activeTab === 'overview' 
              ? 'text-primary-600' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Overview
          {activeTab === 'overview' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-600 rounded-t-full"></div>}
        </button>
        <button
          onClick={() => setActiveTab('bookmarks')}
          className={`pb-4 px-2 font-medium text-sm transition-colors relative flex items-center gap-2 ${
            activeTab === 'bookmarks' 
              ? 'text-primary-600' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Bookmark className="h-4 w-4" />
          Bookmarks
          <span className="bg-slate-100 text-slate-600 text-xs py-0.5 px-2 rounded-full ml-1">
            {localStats.bookmarks?.length || 0}
          </span>
          {activeTab === 'bookmarks' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-600 rounded-t-full"></div>}
        </button>
      </div>

      {activeTab === 'overview' ? (
        <>
        {/* Top Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
              <Target className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Questions</p>
              <p className="text-2xl font-bold text-slate-900">{localStats.totalQuestions}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className={`p-3 rounded-xl ${overallAccuracy >= 70 ? 'bg-green-100 text-green-600' : overallAccuracy >= 40 ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'}`}>
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Overall Accuracy</p>
              <p className="text-2xl font-bold text-slate-900">{overallAccuracy}%</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-xl text-purple-600">
              <Trophy className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Strongest Subject</p>
              <p className="text-lg font-bold text-slate-900 truncate max-w-[150px]">
                {strongestSubject ? strongestSubject.name : 'N/A'}
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-xl text-orange-600">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Needs Improvement</p>
              <p className="text-lg font-bold text-slate-900 truncate max-w-[150px]">
                {weakestSubject ? weakestSubject.name : 'Keep Practicing'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Subject Mastery Chart */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="h-5 w-5 text-slate-400" />
              <h2 className="text-lg font-bold text-slate-900">Subject Mastery</h2>
            </div>
            
            <div className="space-y-6">
              {subjectPerformance.map((sub) => (
                <div key={sub.id}>
                  <div className="flex justify-between items-end mb-2">
                    <div className="flex items-center gap-2">
                      <DynamicIcon name={sub.icon} className="h-4 w-4 text-slate-400" />
                      <span className="font-medium text-slate-700">{sub.name}</span>
                    </div>
                    <div className="text-sm">
                      <span className="font-bold text-slate-900">{sub.accuracy}%</span>
                      <span className="text-slate-400 mx-1">/</span>
                      <span className="text-slate-500 text-xs">{sub.totalAttempted} Qs</span>
                    </div>
                  </div>
                  {/* Progress Bar Container */}
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    {/* Progress Bar Fill */}
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        sub.accuracy >= 75 ? 'bg-green-500' :
                        sub.accuracy >= 50 ? 'bg-blue-500' :
                        sub.accuracy >= 25 ? 'bg-yellow-500' :
                        'bg-slate-300' // Gray if no attempts or very low
                      }`}
                      style={{ width: `${sub.totalAttempted > 0 ? sub.accuracy : 0}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Accuracy Distribution (Donut Chart Representation) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
            <h2 className="text-lg font-bold text-slate-900 mb-6 w-full text-left flex items-center gap-2">
              <PieChart className="h-5 w-5 text-slate-400" />
              Accuracy Overview
            </h2>
            
            <div className="relative w-48 h-48 mb-6">
              <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                  {/* Background Circle */}
                  <path
                    className="text-slate-100"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.8"
                  />
                  {/* Foreground Circle */}
                  <path
                    className={`${
                      overallAccuracy >= 70 ? 'text-green-500' :
                      overallAccuracy >= 40 ? 'text-blue-500' : 'text-red-500'
                    } transition-all duration-1000 ease-out`}
                    strokeDasharray={`${overallAccuracy}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.8"
                    strokeLinecap="round"
                  />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold text-slate-900">{overallAccuracy}%</span>
                <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">Accuracy</span>
              </div>
            </div>

            <div className="w-full grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <div className="text-slate-500 mb-1">Correct</div>
                  <div className="text-xl font-bold text-green-600">{localStats.totalCorrect}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <div className="text-slate-500 mb-1">Incorrect</div>
                  <div className="text-xl font-bold text-red-500">{localStats.totalQuestions - localStats.totalCorrect}</div>
                </div>
            </div>
          </div>
        </div>

        {/* Exam History Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-slate-400" />
              <h2 className="text-lg font-bold text-slate-900">Recent Exam History</h2>
            </div>
            <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-1 rounded">Last 50 Attempts</span>
          </div>
          
          {localStats.history && localStats.history.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Subject</th>
                    <th className="px-6 py-4">Difficulty</th>
                    <th className="px-6 py-4">Mode</th>
                    <th className="px-6 py-4 text-center">Score</th>
                    <th className="px-6 py-4 text-center">Percentage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {localStats.history.map((exam, index) => {
                    const percentage = Math.round((exam.score / exam.totalQuestions) * 100);
                    return (
                      <tr key={index} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3 text-slate-400" />
                            {new Date(exam.date).toLocaleDateString()}
                            <span className="text-xs text-slate-400 ml-1">{new Date(exam.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-900">{exam.subjectName}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            exam.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                            exam.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {exam.difficulty}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {exam.mode === 'exam' ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold bg-slate-800 text-white px-2 py-0.5 rounded">
                              <GraduationCap className="h-3 w-3" /> Exam
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                              <Brain className="h-3 w-3" /> Practice
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-center font-medium text-slate-900">
                          {exam.score} <span className="text-slate-400 text-xs font-normal">/ {exam.totalQuestions}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-block w-16 text-center text-sm font-bold px-2 py-1 rounded-md ${
                            percentage >= 80 ? 'bg-green-100 text-green-700' :
                            percentage >= 50 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {percentage}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500">
              <History className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p>No exams completed yet. Start practicing to build your history!</p>
            </div>
          )}
        </div>
        </>
      ) : (
        /* BOOKMARKS TAB */
        <div className="space-y-6">
           {localStats.bookmarks && localStats.bookmarks.length > 0 ? (
             localStats.bookmarks.map((bookmark) => (
               <div key={bookmark.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-6 cursor-pointer hover:bg-slate-50/50 transition-colors" onClick={() => setExpandedBookmark(expandedBookmark === bookmark.id ? null : bookmark.id)}>
                    <div className="flex items-start justify-between gap-4">
                       <div className="flex-grow">
                          <div className="flex items-center gap-2 mb-2">
                             <span className="bg-slate-100 text-slate-600 text-xs font-medium px-2 py-1 rounded capitalize">{bookmark.subject}</span>
                             <span className={`text-xs font-medium px-2 py-1 rounded capitalize ${
                               bookmark.difficulty === 'Easy' ? 'bg-green-50 text-green-700 border border-green-100' :
                               bookmark.difficulty === 'Medium' ? 'bg-yellow-50 text-yellow-700 border border-yellow-100' :
                               'bg-red-50 text-red-700 border border-red-100'
                             }`}>{bookmark.difficulty}</span>
                             <span className="text-xs text-slate-400 ml-auto sm:ml-2">
                               {new Date(bookmark.savedAt).toLocaleDateString()}
                             </span>
                          </div>
                          <h3 className="text-lg font-semibold text-slate-900 pr-8">{bookmark.questionText}</h3>
                       </div>
                       <div className="flex flex-col items-center gap-2">
                         <button 
                            onClick={(e) => { e.stopPropagation(); handleRemoveBookmark(bookmark); }}
                            className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                            title="Remove Bookmark"
                         >
                            <Trash2 className="h-5 w-5" />
                         </button>
                         <div className="text-slate-400">
                           {expandedBookmark === bookmark.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                         </div>
                       </div>
                    </div>
                  </div>
                  
                  {expandedBookmark === bookmark.id && (
                    <div className="px-6 pb-6 pt-2 border-t border-slate-100 bg-slate-50/30">
                       <div className="space-y-3 mb-4">
                         {bookmark.options.map((opt, idx) => (
                           <div key={idx} className={`p-3 rounded-lg border text-sm flex justify-between items-center ${
                              idx === bookmark.correctAnswerIndex 
                                ? 'bg-green-50 border-green-200 text-green-800 font-medium' 
                                : 'bg-white border-slate-200 text-slate-500'
                           }`}>
                             <span>
                               <span className="inline-block w-6 font-bold mr-2">{String.fromCharCode(65 + idx)}.</span> 
                               {opt}
                             </span>
                             {idx === bookmark.correctAnswerIndex && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Correct Answer</span>}
                           </div>
                         ))}
                       </div>
                       <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800">
                          <p className="font-bold mb-1 flex items-center gap-2">
                            <Brain className="h-4 w-4" /> Explanation
                          </p>
                          {bookmark.explanation}
                       </div>
                    </div>
                  )}
               </div>
             ))
           ) : (
             <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                <Bookmark className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-900 mb-2">No Bookmarks Yet</h3>
                <p className="text-slate-500">Bookmark questions during practice to review them here later.</p>
             </div>
           )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;