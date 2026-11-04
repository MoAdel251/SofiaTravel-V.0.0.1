import { Employee } from '../types';

/**
 * Detects whether an employee's position, role, or department represents
 * a Manager or Accountant (in English or Arabic).
 */
export function isManagerOrAccountantRole(
  position?: string | null,
  department?: string | null,
  role?: string | null
): boolean {
  const pos = String(position || '').trim().toLowerCase();
  const dept = String(department || '').trim().toLowerCase();
  const rl = String(role || '').trim().toLowerCase();

  const managerOrAccountantKeywords = [
    'manager',
    'accountant',
    'chief accountant',
    'general manager',
    'branch manager',
    'financial manager',
    'finance manager',
    'مدير',
    'محاسب',
    'رئيس حسابات',
    'مدير عام',
    'مدير فرع',
    'مدير مالي',
  ];

  if (
    managerOrAccountantKeywords.some(
      kw => pos.includes(kw) || rl.includes(kw)
    )
  ) {
    return true;
  }

  // Also match exact Accounting department if position is Accountant/Accounting
  if (
    (pos === 'accounting' || pos === 'المحاسبة' || pos === 'الحسابات') ||
    ((dept === 'accounting' || dept === 'المحاسبة' || dept === 'الحسابات') &&
      (!pos || pos === 'sales executive' || pos === 'staff member'))
  ) {
    return true;
  }

  return false;
}

/**
 * Determines whether an employee record is designated as "Admin"
 * (System Administrator), including IT-created Manager & Accountant accounts.
 */
export function isEmployeeDesignatedAdmin(
  emp?: (Partial<Employee> & Record<string, any>) | null
): boolean {
  if (!emp) return false;

  if (emp.is_admin === true) return true;

  // An explicit demotion by an administrator must win over the legacy
  // "IT-created Manager/Accountant is Admin" heuristic below.
  if (emp.is_admin === false) return false;

  const accountType = String(emp.account_type || '').trim().toLowerCase();
  const designation = String(emp.designation || '').trim().toLowerCase();
  const role = String(emp.role || '').trim().toLowerCase();
  const position = String(emp.position || emp.job_title || '').trim().toLowerCase();

  if (
    accountType === 'admin' ||
    accountType === 'administrator' ||
    designation === 'admin' ||
    designation === 'administrator' ||
    role === 'admin' ||
    role === 'administrator' ||
    position === 'admin' ||
    position === 'administrator'
  ) {
    return true;
  }

  const createdBy = String(emp.created_by || '').trim().toUpperCase();
  if (
    createdBy === 'IT' &&
    isManagerOrAccountantRole(emp.position || emp.job_title, emp.department, emp.role)
  ) {
    return true;
  }

  return false;
}
