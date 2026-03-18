import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, BookOpen } from 'lucide-react';
import StudentView from './StudentView';
import TeacherView from './TeacherView';
import ManagerView from './ManagerView';

export default function Dashboard() {
  const { profile, logout } = useAuth();

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-stone-50">
      <nav className="bg-white shadow-sm border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-emerald-600" />
              <span className="ml-2 text-xl font-semibold text-stone-900">
                自由学園 ラーニングコモンズ
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-stone-600">
                {profile.displayName} ({
                  profile.role === 'student' ? '生徒' : 
                  profile.role === 'teacher' ? '先生' : '館長'
                })
              </span>
              <button
                onClick={logout}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-stone-700 bg-stone-100 hover:bg-stone-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
              >
                <LogOut className="h-4 w-4 mr-2" />
                ログアウト
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {profile.role === 'student' && <StudentView />}
        {profile.role === 'teacher' && <TeacherView />}
        {profile.role === 'manager' && <ManagerView />}
      </main>
    </div>
  );
}
