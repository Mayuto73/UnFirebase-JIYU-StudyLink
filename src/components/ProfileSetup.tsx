import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function ProfileSetup() {
  const { user, setProfileRole } = useAuth();
  const [role, setRole] = useState<'student' | 'teacher' | 'manager'>('student');
  const [subjects, setSubjects] = useState('');
  const [name, setName] = useState(user?.displayName || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setLoading(true);
    try {
      const subjectList = role === 'teacher' ? subjects.split(',').map(s => s.trim()).filter(Boolean) : undefined;
      await setProfileRole(role, subjectList, name);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-stone-900">
          プロフィール設定
        </h2>
        <p className="mt-2 text-center text-sm text-stone-600">
          あなたの役割を選択してください
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {!user?.displayName && (
              <div>
                <label className="block text-sm font-medium text-stone-700">お名前</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 appearance-none block w-full px-3 py-2 border border-stone-300 rounded-md shadow-sm placeholder-stone-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  placeholder="山田 太郎"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-stone-700">役割</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-stone-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md border"
              >
                <option value="student">生徒（教わりたい）</option>
                <option value="teacher">先生（教えたい）</option>
                <option value="manager">館長（管理）</option>
              </select>
            </div>

            {role === 'teacher' && (
              <div>
                <label className="block text-sm font-medium text-stone-700">
                  教えられる科目 (カンマ区切り)
                </label>
                <input
                  type="text"
                  value={subjects}
                  onChange={(e) => setSubjects(e.target.value)}
                  placeholder="例: 数学, 英語, プログラミング"
                  className="mt-1 appearance-none block w-full px-3 py-2 border border-stone-300 rounded-md shadow-sm placeholder-stone-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                />
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
              >
                {loading ? '保存中...' : '保存して始める'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
