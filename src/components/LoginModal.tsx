import React, { useState } from 'react';
import { Shield, Lock, User, Plane, CheckCircle2, AlertCircle } from 'lucide-react';
import { UserRole } from '../types';

interface LoginModalProps {
  onLogin: (username: string, role: UserRole) => void;
  companyName: string;
}

export function LoginModal({ onLogin, companyName }: LoginModalProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const accounts = [
    { name: 'Admin', pass: '1282', role: 'Administrator' as UserRole, label: 'Administrator' },
    { name: 'Ahmed Ali', pass: 'AA01', role: 'Manager' as UserRole, label: 'First Manager' },
    { name: 'Mahmoud Makhlouf', pass: 'MM02', role: 'Manager' as UserRole, label: 'Second Manager' },
    { name: 'Ahmed Makhlouf', pass: 'AM03', role: 'Manager' as UserRole, label: 'Third Manager' },
    { name: 'Mohamed Ali Gediana', pass: 'MA04', role: 'Accountant' as UserRole, label: 'Accountant' },
  ];

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const matched = accounts.find(
      acc => acc.name.toLowerCase() === username.trim().toLowerCase()
    );

    // Also support exact match on name and password
    const validAcc = accounts.find(
      acc => acc.name.toLowerCase() === username.trim().toLowerCase() && acc.pass === password
    );

    if (validAcc) {
      onLogin(validAcc.name, validAcc.role);
    } else if (username === 'Admin' && password === '1282') {
      onLogin('Admin', 'Administrator');
    } else {
      setError('Invalid username or password. Please check your credentials.');
    }
  };

  const handleQuickLogin = (acc: typeof accounts[0]) => {
    setUsername(acc.name);
    setPassword(acc.pass);
    onLogin(acc.name, acc.role);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="bg-gradient-to-br from-slate-900 to-blue-950 p-8 text-white text-center relative overflow-hidden">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-blue-600/40 mb-4">
            <Plane className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">{companyName}</h2>
          <p className="text-xs text-blue-300 mt-1 uppercase font-semibold tracking-wider">Enterprise Management Portal</p>
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl"></div>
        </div>

        {/* Form Body */}
        <div className="p-8">
          {error && (
            <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Username / Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Admin, Ahmed Ali..."
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-600/30 transition-all text-sm mt-2 cursor-pointer"
            >
              Sign In to Portal
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
