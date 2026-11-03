import React, { useState } from 'react';
import { Lock, User, AlertCircle, ArrowRight } from 'lucide-react';
import { UserRole, Employee } from '../types';
import { SOFIA_LOGO_URL } from './SofiaLogo';
import { useLanguage } from '../context/LanguageContext';

interface LoginModalProps {
  employees?: Employee[];
  onLogin: (username: string, role: UserRole, empId?: string) => void;
  companyName: string;
  isSiteDisabled?: boolean;
  onClose?: () => void;
}

export function LoginModal({ onLogin, companyName, employees = [], isSiteDisabled = false, onClose }: LoginModalProps) {
  const { language, toggleLanguage } = useLanguage();
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
      setError(
        language === 'ar'
          ? 'يرجى إدخال اسم المستخدم وكلمة المرور.'
          : 'Please enter both username and password.'
      );
      return;
    }

    const matchedSystemAccount = systemAccounts.find(
      acc => acc.name === inputUser && acc.pass === inputPass
    );

    if (matchedSystemAccount) {
      if (isSiteDisabled && matchedSystemAccount.name !== 'IT') {
        setError(
          language === 'ar'
            ? 'الموقع متوقف مؤقتاً للتحديثات. الدخول متاح فقط لحساب مطور النظام (IT).'
            : 'The site is temporarily disabled for updates. Only the "IT" developer account can sign in right now.'
        );
        return;
      }
      onLogin(matchedSystemAccount.name, matchedSystemAccount.role, matchedSystemAccount.id);
      return;
    }

    const matchedEmployee = employees.find(emp => {
      const matchName = emp.name === inputUser || emp.username === inputUser || emp.email === inputUser;
      const expectedPass = emp.password || '1234';
      const matchPass = expectedPass === inputPass;
      return matchName && matchPass;
    });

    if (matchedEmployee) {
      const isEmpIT = matchedEmployee.username === 'IT' || matchedEmployee.name === 'IT';
      if (isSiteDisabled && !isEmpIT) {
        setError(
          language === 'ar'
            ? 'الموقع متوقف مؤقتاً للتحديثات. الدخول متاح فقط لحساب مطور النظام (IT).'
            : 'The site is temporarily disabled for updates. Only the "IT" developer account can sign in right now.'
        );
        return;
      }

      const status = matchedEmployee.account_status || matchedEmployee.status || 'Active';
      if (status === 'Inactive' || status === 'Suspended' || matchedEmployee.login_access_enabled === false) {
        setError(
          language === 'ar'
            ? 'هذا الحساب معطل حالياً. يرجى التواصل مع مدير النظام.'
            : 'This account has been deactivated or suspended. Please contact your system administrator.'
        );
        return;
      }

      let role: UserRole = 'Sales';
      if (matchedEmployee.is_admin || matchedEmployee.position === 'Administrator') {
        role = 'Administrator';
      } else if (
        matchedEmployee.position === 'Manager' ||
        matchedEmployee.position === 'Accountant' ||
        matchedEmployee.position === 'Operations' ||
        matchedEmployee.position === 'Customer Service' ||
        matchedEmployee.position === 'Sales'
      ) {
        role = matchedEmployee.position;
      } else if (matchedEmployee.position === 'Reservation Agent') {
        role = 'Sales';
      }
      const displayName = matchedEmployee.name || matchedEmployee.username || inputUser;
      onLogin(displayName, role, matchedEmployee.id || matchedEmployee.employee_id);
      return;
    }

    setError(
      language === 'ar'
        ? 'اسم المستخدم أو كلمة المرور غير صحيحة (الأحرف حساسة لحالة الكبير والصغير).'
        : 'Invalid username or password. Usernames and passwords are strictly case-sensitive.'
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden my-auto">
        {/* Header with Attached Sofia Travel Logo As-Is */}
        <div className="bg-slate-900 p-6 text-white text-center relative">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 start-4 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-300 cursor-pointer"
            >
              {language === 'ar' ? 'رجوع' : 'Back'}
            </button>
          )}
          <button
            type="button"
            onClick={toggleLanguage}
            className="absolute top-4 end-4 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-cyan-300 cursor-pointer"
          >
            {language === 'en' ? 'العربية' : 'English'}
          </button>

          <div className="inline-flex items-center justify-center bg-white rounded-2xl p-2 shadow-lg mb-3">
            <img
              src={SOFIA_LOGO_URL}
              alt={companyName}
              className="h-24 sm:h-28 w-auto object-contain select-none"
              onError={(e) => {
                const img = e.currentTarget;
                if (!img.src.endsWith('/sofia-logo.png')) {
                  img.src = '/sofia-logo.png';
                }
              }}
            />
          </div>
          <h2 className="text-lg font-extrabold tracking-tight">{companyName}</h2>
          <p className="text-xs text-cyan-300 mt-0.5 font-medium">
            {language === 'ar' ? 'بوابة إدارة العمليات والحسابات السحابية' : 'Cloud Operations & Management Portal'}
          </p>
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
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {language === 'ar' ? 'اسم المستخدم' : 'Username / Full Name'}
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute start-3.5 top-3.5 pointer-events-none" />
                <input
                  type="text"
                  required
                  placeholder={language === 'ar' ? 'أدخل اسم المستخدم' : 'Enter username'}
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 ps-10 pe-4 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-600/20 focus:border-cyan-600 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {language === 'ar' ? 'كلمة المرور' : 'Password'}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute start-3.5 top-3.5 pointer-events-none" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 ps-10 pe-4 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-600/20 focus:border-cyan-600 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl shadow-md transition-all text-sm mt-2 cursor-pointer flex items-center justify-center gap-2 min-h-[48px]"
            >
              <span>{language === 'ar' ? 'تسجيل الدخول إلى النظام' : 'Sign In to Portal'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
