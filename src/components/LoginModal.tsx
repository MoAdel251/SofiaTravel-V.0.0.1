import React, { useState } from 'react';
import { Lock, User, AlertCircle, ArrowRight } from 'lucide-react';
import { UserRole, Employee } from '../types';
import { SOFIA_LOGO_URL } from './SofiaLogo';
import { useLanguage } from '../context/LanguageContext';
import { isEmployeeDesignatedAdmin } from '../utils/adminDesignation';

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

  // Pre-configured system administrator and fallback staff accounts
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

    // 1. Always keep the "IT" developer account prioritized (works even during maintenance mode)
    const itSystemAccount = systemAccounts.find(
      acc => acc.name === 'IT' && acc.name === inputUser && acc.pass === inputPass
    );
    if (itSystemAccount) {
      onLogin(itSystemAccount.name, itSystemAccount.role, itSystemAccount.id);
      return;
    }

    // 2. Check live employee accounts stored in Cloud Firestore (including IT-created Manager & Accountant Admin accounts)
    const matchedEmployeeByIdentity = employees.find(emp => {
      return emp.name === inputUser || emp.username === inputUser || emp.email === inputUser;
    });

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
      if (isEmpIT || isEmployeeDesignatedAdmin(matchedEmployee)) {
        role = 'Administrator';
      } else if (
        matchedEmployee.position === 'Manager' ||
        matchedEmployee.position === 'Accountant' ||
        matchedEmployee.position === 'Operations' ||
        matchedEmployee.position === 'Customer Service' ||
        matchedEmployee.position === 'Sales' ||
        matchedEmployee.position === 'Office Boy'
      ) {
        role = matchedEmployee.position as UserRole;
      } else if (matchedEmployee.position === 'Reservation Agent') {
        role = 'Sales';
      }
      const displayName = matchedEmployee.name || matchedEmployee.username || inputUser;
      onLogin(displayName, role, matchedEmployee.id || matchedEmployee.employee_id);
      return;
    }

    // 3. Fallback to pre-configured system accounts only if no overriding employee record exists in Firestore
    if (!matchedEmployeeByIdentity) {
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
    }

    setError(
      language === 'ar'
        ? 'اسم المستخدم أو كلمة المرور غير صحيحة (الأحرف حساسة لحالة الكبير والصغير).'
        : 'Invalid username or password. Usernames and passwords are strictly case-sensitive.'
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-sofia-purple/55 p-3 sm:p-4 backdrop-blur-xl">
      <div className="fluent-card my-auto grid w-full max-w-4xl overflow-hidden rounded-3xl md:grid-cols-[1.05fr_1fr] shadow-[var(--shadow-3)]">
        {/* Brand panel */}
        <div className="fluent-brand-gradient relative overflow-hidden p-6 sm:p-8 text-white">
          <div className="pointer-events-none absolute -end-12 -top-12 h-48 w-48 rounded-full bg-sofia-turquoise/30 blur-3xl" />
          <div className="pointer-events-none absolute -start-10 bottom-0 h-40 w-40 rounded-full bg-sofia-lavender/30 blur-3xl" />

          <div className="relative z-10 flex items-center justify-between">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/80">
              <span className="h-1.5 w-1.5 rounded-full bg-sofia-turquoise" />
              SOFIA TRAVEL
            </span>
            <button
              type="button"
              onClick={toggleLanguage}
              className="rounded-lg border border-white/20 bg-white/10 px-2.5 py-1 text-[11px] font-bold text-white transition-colors hover:bg-white/20 cursor-pointer"
            >
              {language === 'en' ? 'العربية' : 'English'}
            </button>
          </div>

          <div className="relative z-10 mt-8 sm:mt-12">
            <div className="inline-flex items-center justify-center rounded-2xl bg-white p-3 shadow-xl">
              <img
                src={SOFIA_LOGO_URL}
                alt={companyName}
                className="h-20 sm:h-24 w-auto object-contain select-none"
                onError={(e) => {
                  const img = e.currentTarget;
                  if (!img.src.endsWith('/sofia-logo.png')) {
                    img.src = '/sofia-logo.png';
                  }
                }}
              />
            </div>
            <h2 className="mt-5 text-xl sm:text-2xl font-extrabold tracking-tight">{companyName}</h2>
            <p className="mt-1.5 text-xs sm:text-sm text-white/70 max-w-xs">
              {language === 'ar' ? 'بوابة إدارة العمليات والحسابات السحابية' : 'Cloud Operations & Management Portal'}
            </p>

            <div className="mt-7 hidden sm:flex flex-col gap-2.5 text-[11px] text-white/80">
              {[
                language === 'ar' ? 'حضور وانصراف موثّق بالموقع' : 'Location-verified attendance',
                language === 'ar' ? 'إجازات وموافقات لحظية' : 'Leave & approvals in real time',
                language === 'ar' ? 'مزامنة سحابية آمنة' : 'Secure cloud synchronization',
              ].map(item => (
                <span key={item} className="inline-flex items-center gap-2">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-sofia-turquoise/25 text-sofia-turquoise text-[9px] font-black">
                    ✓
                  </span>
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Form panel */}
        <div className="relative bg-[var(--surface-solid)] p-6 sm:p-8">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 start-4 rounded-lg border border-[var(--stroke)] bg-[var(--surface-soft)] px-2.5 py-1 text-[11px] font-bold text-[var(--text-2)] hover:bg-[var(--surface-hover)] cursor-pointer"
            >
              {language === 'ar' ? 'رجوع' : 'Back'}
            </button>
          )}

          <div className={`${onClose ? 'mt-8' : ''}`}>
            <h3 className="text-lg font-extrabold text-[var(--text-1)]">
              {language === 'ar' ? 'تسجيل الدخول' : 'Sign in'}
            </h3>
            <p className="mt-1 text-xs text-[var(--text-3)]">
              {language === 'ar' ? 'أدخل بيانات حسابك للوصول إلى مساحة العمل.' : 'Enter your account details to access the workspace.'}
            </p>
          </div>

          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-500/25 bg-rose-500/10 p-3 text-xs text-rose-600">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="mt-5 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-[var(--text-2)]">
                {language === 'ar' ? 'اسم المستخدم' : 'Username / Full Name'}
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute start-3.5 top-3.5 h-4 w-4 text-[var(--text-3)]" />
                <input
                  type="text"
                  required
                  placeholder={language === 'ar' ? 'أدخل اسم المستخدم' : 'Enter username'}
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full rounded-xl border border-[var(--stroke)] bg-[var(--surface-soft)] py-3 ps-10 pe-4 text-sm font-medium text-[var(--text-1)] transition-all focus:border-sofia-turquoise focus:outline-none focus:ring-2 focus:ring-sofia-turquoise/25"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-[var(--text-2)]">
                {language === 'ar' ? 'كلمة المرور' : 'Password'}
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute start-3.5 top-3.5 h-4 w-4 text-[var(--text-3)]" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-[var(--stroke)] bg-[var(--surface-soft)] py-3 ps-10 pe-4 text-sm font-medium text-[var(--text-1)] transition-all focus:border-sofia-turquoise focus:outline-none focus:ring-2 focus:ring-sofia-turquoise/25"
                />
              </div>
            </div>

            <button
              type="submit"
              className="mt-2 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-sofia-purple py-3.5 text-sm font-bold text-white shadow-lg shadow-sofia-purple/20 transition-all hover:bg-sofia-purple-700 active:scale-[0.995] cursor-pointer"
            >
              <span>{language === 'ar' ? 'تسجيل الدخول إلى النظام' : 'Sign In to Portal'}</span>
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </button>

            <p className="pt-1 text-center text-[10px] text-[var(--text-3)]">
              {language === 'ar'
                ? 'الدخول مخصص للموظفين المصرح لهم فقط.'
                : 'Access is restricted to authorized employees only.'}
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
