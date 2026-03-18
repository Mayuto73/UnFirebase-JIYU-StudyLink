import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { TutoringRequest } from '../types';

export default function TeacherView() {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<TutoringRequest[]>([]);

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const reqRes = await fetch('/api/requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (reqRes.ok) {
        const reqs = await reqRes.json();
        setRequests(reqs);
      }
    } catch (error) {
      console.error('Failed to fetch requests', error);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [profile]);

  const handleStatusChange = async (request: TutoringRequest, newStatus: 'pending_manager' | 'rejected') => {
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
        body: JSON.stringify({ status: newStatus, roomId: request.roomId })
      });

      if (res.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Failed to update request status', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_teacher': return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">あなたの承認待ち</span>;
      case 'pending_manager': return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">館長の承認待ち</span>;
      case 'approved': return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">予約確定</span>;
      case 'rejected': return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">キャンセル/却下</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white shadow sm:rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-stone-200">
          <h3 className="text-lg leading-6 font-medium text-stone-900">あなたへのリクエスト</h3>
        </div>
        <ul className="divide-y divide-stone-200">
          {requests.length === 0 ? (
            <li className="px-4 py-8 text-center text-stone-500">現在リクエストはありません</li>
          ) : (
            requests.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(req => (
              <li key={req.id} className="px-4 py-4 sm:px-6 hover:bg-stone-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <p className="text-sm font-medium text-emerald-600 truncate">{req.subject}</p>
                    <p className="text-sm text-stone-500">
                      生徒: {req.studentName}
                    </p>
                    <p className="text-sm text-stone-500 flex items-center mt-1">
                      {req.date} {req.startTime} - {req.endTime}
                      {req.roomId && <span className="ml-2 font-medium text-stone-900">({req.roomId === 'room1' ? '教室1' : '教室2'})</span>}
                    </p>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    {getStatusBadge(req.status)}
                    
                    {req.status === 'pending_teacher' && (
                      <div className="flex space-x-2 mt-2">
                        <button
                          onClick={() => handleStatusChange(req, 'pending_manager')}
                          className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                        >
                          承認する
                        </button>
                        <button
                          onClick={() => handleStatusChange(req, 'rejected')}
                          className="inline-flex items-center px-2.5 py-1.5 border border-stone-300 shadow-sm text-xs font-medium rounded text-stone-700 bg-white hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                        >
                          却下する
                        </button>
                      </div>
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
