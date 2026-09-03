import React from 'react';
import { Activity, Clock } from 'lucide-react';
import { ActivityLog } from '../types';

interface ActivityLogViewProps {
  logs: ActivityLog[];
}

export function ActivityLogView({ logs }: ActivityLogViewProps) {
  return (
    <div className="p-8 space-y-6 bg-slate-50 min-h-screen">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">System Audit Activity Log</h1>
        <p className="text-sm text-slate-500">Track user actions, changes, timestamps, and security audit records.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-3 px-4 font-semibold">User</th>
              <th className="py-3 px-4 font-semibold">Action</th>
              <th className="py-3 px-4 font-semibold">Module</th>
              <th className="py-3 px-4 font-semibold">Record ID</th>
              <th className="py-3 px-4 font-semibold">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs.map(log => (
              <tr key={log.id} className="hover:bg-slate-50/80">
                <td className="py-3.5 px-4 font-bold text-slate-900">{log.user_name}</td>
                <td className="py-3.5 px-4 text-slate-800 font-medium">{log.action}</td>
                <td className="py-3.5 px-4"><span className="px-2.5 py-1 bg-cyan-50 text-cyan-700 rounded-full text-xs font-bold">{log.module}</span></td>
                <td className="py-3.5 px-4 font-mono text-xs text-slate-600">{log.record}</td>
                <td className="py-3.5 px-4 text-slate-500 text-xs flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{log.date} at {log.time}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
