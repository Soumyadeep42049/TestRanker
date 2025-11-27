import React from 'react';
import { User, Language } from '../types';
import { GraduationCap, LogOut, User as UserIcon, Globe2, LayoutDashboard } from 'lucide-react';

interface NavbarProps {
  user: User | null;
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
  onLogout: () => void;
  onLoginClick: () => void;
  onHomeClick: () => void;
  onDashboardClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ 
  user, 
  currentLanguage, 
  onLanguageChange, 
  onLogout, 
  onLoginClick,
  onHomeClick,
  onDashboardClick
}) => {
  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center cursor-pointer" onClick={onHomeClick}>
            <div className="bg-primary-600 p-2 rounded-lg mr-3">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">TestRanker</h1>
              <p className="text-xs text-slate-500 hidden sm:block">Professional Exam Practice</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Language Selector */}
            <div className="relative group">
              <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-primary-600 rounded-md transition-colors">
                <Globe2 className="h-4 w-4" />
                <span className="hidden sm:inline">{currentLanguage}</span>
              </button>
              
              <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-lg border border-slate-100 py-1 hidden group-hover:block">
                {Object.values(Language).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => onLanguageChange(lang)}
                    className={`block w-full text-left px-4 py-2 text-sm ${
                      currentLanguage === lang ? 'bg-slate-50 text-primary-600 font-medium' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            {/* Auth Buttons */}
            {user ? (
              <div className="flex items-center gap-4">
                <button 
                  onClick={onDashboardClick}
                  className="hidden sm:flex items-center gap-2 text-slate-600 hover:text-primary-600 font-medium text-sm px-3 py-2 rounded-md hover:bg-slate-50 transition-colors"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </button>

                <div className="hidden sm:flex items-center gap-2 border-l border-slate-200 pl-4">
                  <div className="bg-slate-100 p-1.5 rounded-full">
                    <UserIcon className="h-4 w-4 text-slate-600" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">{user.name}</span>
                </div>
                <button
                  onClick={onLogout}
                  className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onLoginClick}
                className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm shadow-primary-500/30"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;