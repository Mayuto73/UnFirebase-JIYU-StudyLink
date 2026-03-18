import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { TutoringRequest, UserProfile } from '../types';

export default function StudentView() {
  const { profile } = useAuth();
  const [teachers, setTeachers] = useState<UserProfile[]>([]);
  const [requests, setRequests] = useState<TutoringRequest[]>([]);
  
  // Form state
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [subject, setSubject] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      // Fetch teachers
      const usersRes = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (usersRes.ok) {
        const users = await usersRes.json();
        setTeachers(users.filter((u: any) => u.role === 'teacher'));
      }

      // Fetch requests
      const reqRes = await fetch('/api/requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (reqRes.ok) {
        const reqs = await reqRes.json();
        setRequests(reqs);
      }
    } catch (error) {
      console.error('Failed to fetch data', error);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !selectedTeacher) return;

    const teacher = teachers.find(t => t.uid === selectedTeacher);
    if (!teacher) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          teacherId: teacher.uid,
          teacherName: teacher.displayName,
          subject,
          date,
          startTime,
          endTime
        })
      });

      if (res.ok) {
        await fetchData();
        // Reset form
        setSelectedTeacher('');
        setSubject('');
        setDate('');
        setStartTime('');
        setEndTime('');
      }
    } catch (error) {
      console.error('Failed to create request', error);
    }
  };

  const handleCancel = async (request: TutoringRequest) => {
    if (!request.id) return;
    
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`/api/requests/${request.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'rejected', roomId: request.roomId })
      });

      if (res.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Failed to cancel request', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_teacher': return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">先生の承認待ち</span>;
      case 'pending_manager': return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">館長の承認待ち</span>;
      case 'approved': return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">予約確定</span>;
      case 'rejected': return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">キャンセル/却下</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white shadow sm:rounded-lg p-6">
        <h2 className="text-lg font-medium text-stone-900 mb-4">教えてもらうリクエストを作成</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-stone-700">先生</label>
              <select
                required
                value={selectedTeacher}
                onChange={(e) => setSelectedTeacher(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-stone-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md border"
              >
                <option value="">選択してください</option>
                {teachers.map(t => (
                  <option key={t.uid} value={t.uid}>
                    {t.displayName} {t.subjects && `(${t.subjects.join(', ')})`}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700">科目 / 内容</label>
              <input
                required
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="mt-1 block w-full border-stone-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm border px-3 py-2"
                placeholder="例: 数学の宿題"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700">日付</label>
              <input
                required
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 block w-full border-stone-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm border px-3 py-2"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-stone-700">開始時間</label>
                <input
                  required
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="mt-1 block w-full border-stone-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm border px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">終了時間</label>
                <input
                  required
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="mt-1 block w-full border-stone-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm border px-3 py-2"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              リクエストを送信
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white shadow sm:rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-stone-200">
          <h3 className="text-lg leading-6 font-medium text-stone-900">あなたのリクエスト</h3>
        </div>
        <ul className="divide-y divide-stone-200">
          {requests.length === 0 ? (
            <li className="px-4 py-8 text-center text-stone-500">リクエストはまだありません</li>
          ) : (
            requests.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(req => (
              <li key={req.id} className="px-4 py-4 sm:px-6 hover:bg-stone-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <p className="text-sm font-medium text-emerald-600 truncate">{req.subject}</p>
                    <p className="text-sm text-stone-500">
                      先生: {req.teacherName}
                    </p>
                    <p className="text-sm text-stone-500 flex items-center mt-1">
                      {req.date} {req.startTime} - {req.endTime}
                      {req.roomId && <span className="ml-2 font-medium text-stone-900">({req.roomId === 'room1' ? '教室1' : '教室2'})</span>}
                    </p>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    {getStatusBadge(req.status)}
                    {req.status === 'pending_teacher' && (
                      <button
                        onClick={() => handleCancel(req)}
                        className="text-xs text-red-600 hover:text-red-800 font-medium"
                      >
                        キャンセル
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
