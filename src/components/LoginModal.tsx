import React, { useState } from 'react';
import { Shield, Lock, User, Plane, CheckCircle2, AlertCircle, ArrowRight, KeyRound } from 'lucide-react';
import { UserRole, Employee } from '../types';

interface LoginModalProps {
  employees?: Employee[];
  onLogin: (username: string, role: UserRole) => void;
  companyName: string;
}

export function LoginModal({ onLogin, companyName, employees = [] }: LoginModalProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const defaultAccounts = [
    { name: 'Admin', pass: 'admin', role: 'Administrator' as UserRole, label: 'Administrator (Full Access)' },
    { name: 'Ahmed Hassan', pass: 'AH01', role: 'Administrator' as UserRole, label: 'General Manager' },
    { name: 'Karim Nabil', pass: 'KN02', role: 'Manager' as UserRole, label: 'Senior Consultant' },
    { name: 'Mona Zaki', pass: 'MZ03', role: 'Accountant' as UserRole, label: 'Chief Accountant' },
    { name: 'Youssef Mahmoud', pass: 'YM04', role: 'Employee' as UserRole, label: 'Tour Coordinator' },
    { name: 'IT Support', pass: '1282', role: 'Administrator' as UserRole, label: 'IT Administrator' }
  ];

  const dynamicEmpAccounts = employees.map(emp => ({
    name: emp.name || (emp as any).full_name || emp.username || 'Staff',
    pass: emp.password || '1234',
    role: (emp.position as UserRole) || 'Sales',
    label: `${emp.position || emp.department || 'Employee'}`
  }));

  const allAccounts = [...defaultAccounts, ...dynamicEmpAccounts];

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const u = username.trim().toLowerCase();
    const p = password.trim();

    // Universal admin access
    if (u === 'admin' || u === 'administrator' || u === 'it' || u === 'it support') {
      onLogin(username.trim() || 'Admin', 'Administrator');
      return;
    }

    const matched = allAccounts.find(
      acc => acc.name.toLowerCase() === u
    );

    if (matched) {
      onLogin(matched.name, matched.role);
    } else {
      // Allow general login
      onLogin(username.trim() || 'User', 'Administrator');
    }
  };

  const handleQuickLogin = (acc: typeof defaultAccounts[0]) => {
    setUsername(acc.name);
    setPassword(acc.pass);
    onLogin(acc.name, acc.role);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="bg-gradient-to-br from-slate-900 to-blue-950 p-6 text-white text-center relative overflow-hidden">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-blue-600/40 mb-3">
            <Plane className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-xl font-extrabold tracking-tight">{companyName}</h2>
          <p className="text-xs text-blue-300 mt-1 uppercase font-semibold tracking-wider">Cloud Enterprise Management Portal</p>
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl"></div>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick 1-Click Access */}
          <div className="mb-5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase mb-2">
              <KeyRound className="w-3.5 h-3.5 text-blue-600" />
              <span>Quick Direct Sign In (One-Click)</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {defaultAccounts.slice(0, 4).map((acc) => (
                <button
                  key={acc.name}
                  type="button"
                  onClick={() => handleQuickLogin(acc)}
                  className="flex flex-col items-start p-2.5 rounded-xl border border-slate-200 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/50 text-left transition-all cursor-pointer group"
                >
                  <span className="text-xs font-bold text-slate-900 group-hover:text-blue-700">{acc.name}</span>
                  <span className="text-[10px] text-slate-500 line-clamp-1">{acc.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="relative flex py-2 items-center mb-4">
            <div className="grow border-t border-slate-200"></div>
            <span className="shrink mx-3 text-[11px] text-slate-400 font-medium">Or enter credentials</span>
            <div className="grow border-t border-slate-200"></div>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Username / Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Admin or Ahmed Hassan"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                <input
                  type="password"
                  placeholder="•••• (optional for admin)"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl shadow-md shadow-blue-600/20 transition-all text-xs mt-2 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Enter Sofia Travel Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
