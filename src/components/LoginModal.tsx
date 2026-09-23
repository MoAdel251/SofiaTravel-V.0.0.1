import React, { useState } from 'react';
import { Lock, User, Plane, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { UserRole, Employee } from '../types';

interface LoginModalProps {
  employees?: Employee[];
  onLogin: (username: string, role: UserRole, empId?: string) => void;
  companyName: string;
}

export function LoginModal({ onLogin, companyName, employees = [] }: LoginModalProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Pre-configured system administrator and staff accounts
  const systemAccounts = [
    { name: 'IT', pass: 'S2026', role: 'Administrator' as UserRole, id: 'SYS-IT-ADMIN' },
    { name: 'Karim Nabil', pass: 'KN02', role: 'Manager' as UserRole, id: 'EMP-2' },
    { name: 'Mona Zaki', pass: 'MZ03', role: 'Accountant' as UserRole, id: 'EMP-3' },
    { name: 'Youssef Mahmoud', pass: 'YM04', role: 'Operations' as UserRole, id: 'EMP-4' }
  ];

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const inputUser = username.trim();
    const inputPass = password;

    if (!inputUser || !inputPass) {
      setError('Please enter both username and password.');
      return;
    }

    // 1. Check in active system administrators & built-in accounts (Strict Case-Sensitive Match)
    const matchedSystemAccount = systemAccounts.find(
      acc => (acc.name === inputUser) && (acc.pass === inputPass)
    );

    if (matchedSystemAccount) {
      onLogin(matchedSystemAccount.name, matchedSystemAccount.role, matchedSystemAccount.id);
      return;
    }

    // 2. Check in database employees list (Strict Case-Sensitive Match on Username / Name / Email)
    const matchedEmployee = employees.find(emp => {
      const matchName = emp.name === inputUser || emp.username === inputUser || emp.email === inputUser;
      const expectedPass = emp.password || '1234';
      const matchPass = expectedPass === inputPass;
      return matchName && matchPass;
    });

    if (matchedEmployee) {
      // Check if employee account is active
      const status = matchedEmployee.account_status || matchedEmployee.status || 'Active';
      if (status === 'Inactive' || status === 'Suspended' || matchedEmployee.login_access_enabled === false) {
        setError('This account has been deactivated or suspended. Please contact your system administrator.');
        return;
      }

      let role: UserRole = 'Sales';
      if (matchedEmployee.is_admin || matchedEmployee.position === 'Administrator') {
        role = 'Administrator';
      } else if (matchedEmployee.position === 'Manager' || 
          matchedEmployee.position === 'Accountant' || matchedEmployee.position === 'Operations' || 
          matchedEmployee.position === 'Customer Service' || matchedEmployee.position === 'Sales') {
        role = matchedEmployee.position;
      } else if (matchedEmployee.position === 'Reservation Agent') {
        role = 'Sales';
      }
      const displayName = matchedEmployee.name || matchedEmployee.username || inputUser;
      onLogin(displayName, role, matchedEmployee.id || matchedEmployee.employee_id);
      return;
    }

    // 3. If no exact match found, reject securely
    setError('Invalid username or password. Usernames and passwords are strictly case-sensitive.');
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 p-6 text-white text-center relative overflow-hidden">
          <img 
            src="/sofia-logo.png" 
            alt="Sofia Travel" 
            className="w-16 h-16 object-contain bg-white rounded-2xl mx-auto p-1.5 shadow-xl shadow-cyan-500/20 border border-slate-700/80 mb-3"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/sofia-logo.svg";
            }}
          />
          <h2 className="text-xl font-extrabold tracking-tight uppercase">{companyName}</h2>
          <p className="text-xs text-cyan-300 mt-1 uppercase font-semibold tracking-wider">Cloud Enterprise Management Portal</p>
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl"></div>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1.5">Username / Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  placeholder="Enter username (e.g. IT or Employee Name)"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-md shadow-blue-600/20 transition-all text-xs mt-2 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Sign In to Sofia Travel Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
