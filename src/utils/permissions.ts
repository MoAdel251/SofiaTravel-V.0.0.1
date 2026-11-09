import { UserRole } from '../types';

/**
 * Legacy permission identifiers used by older employee records and navigation
 * labels. They are expanded into the granular permissions shown in
 * Employees -> Permissions so a revoked grant can never survive under an alias.
 */
export const LEGACY_PERMISSION_ALIASES: Record<string, string[]> = {
  view_sales: ['view_invoices'],
  view_bookings: ['view_vouchers'],
  view_trips: ['view_services', 'view_packages'],
  view_finance: ['view_suppliers', 'view_expenses'],
  view_payroll: ['view_expenses'],
};

/**
 * Converts any stored permission list into the canonical granular IDs used by
 * the admin permission checkboxes. Legacy aliases are replaced (not kept
 * alongside) so unchecking a permission can never be overridden by a hidden
 * alias that the admin UI does not display.
 */
export function normalizePermissions(permissions?: string[] | null): string[] {
  if (!Array.isArray(permissions)) return [];

  const normalized = new Set<string>();
  for (const permission of permissions) {
    if (!permission) continue;
    const aliases = LEGACY_PERMISSION_ALIASES[permission];
    if (aliases) {
      aliases.forEach(alias => normalized.add(alias));
    } else {
      normalized.add(permission);
    }
  }
  return Array.from(normalized);
}

// Only used when an employee record has no explicit permissions array at all.
const roleDefaultTabs: Record<string, string[]> = {
  Manager: [
    'dashboard', 'vouchers', 'services', 'customers', 'customer-inquiries',
    'invoices', 'suppliers', 'packages', 'permission-requests', 'employees',
    'attendance', 'calendar', 'tasks', 'documents', 'reports', 'settings',
    'activity-log', 'notifications',
  ],
  Sales: [
    'dashboard', 'vouchers', 'services', 'customers', 'customer-inquiries',
    'invoices', 'packages', 'permission-requests', 'attendance', 'calendar',
    'tasks', 'documents', 'notifications',
  ],
  Accountant: [
    'dashboard', 'services', 'customers', 'customer-inquiries', 'invoices',
    'suppliers', 'packages', 'permission-requests', 'attendance', 'tasks',
    'documents', 'reports', 'finance-payroll', 'notifications',
  ],
  Operations: [
    'dashboard', 'vouchers', 'services', 'customers', 'customer-inquiries',
    'invoices', 'suppliers', 'permission-requests', 'attendance', 'calendar',
    'tasks', 'documents', 'notifications',
  ],
  'Customer Service': [
    'dashboard', 'vouchers', 'services', 'customers', 'customer-inquiries',
    'invoices', 'permission-requests', 'attendance', 'calendar', 'tasks',
    'documents', 'notifications',
  ],
};

/**
 * Every screen id (including legacy sub-screen aliases) mapped to the canonical
 * permission required to open it. Unknown ids are denied for non-admins so a
 * page can never bypass the permission model by using an unmapped tab id.
 */
const tabPermissionMap: Record<string, string | string[]> = {
  dashboard: 'view_dashboard',
  vouchers: 'view_vouchers',
  reservations: 'view_vouchers',
  services: 'view_services',
  visas: 'view_services',
  flights: 'view_services',
  hotels: 'view_services',
  transfers: 'view_services',
  cruises: 'view_services',
  tours: 'view_services',
  'day-trips': 'view_services',
  packages: 'view_packages',
  customers: 'view_customers',
  'customer-inquiries': 'view_customers',
  invoices: 'view_invoices',
  finance: ['view_invoices', 'view_expenses'],
  'customer-payments': 'view_invoices',
  'supplier-payments': ['view_suppliers', 'view_expenses'],
  expenses: 'view_expenses',
  suppliers: 'view_suppliers',
  'permission-requests': 'view_dashboard',
  employees: 'view_employees',
  attendance: ['view_dashboard', 'view_employees'],
  calendar: 'view_dashboard',
  tasks: 'view_dashboard',
  documents: 'view_dashboard',
  reports: 'view_reports',
  'finance-payroll': 'view_expenses',
  notifications: 'view_dashboard',
  settings: 'view_settings',
  'activity-log': 'view_settings',
  'attendance-security': 'view_attendance_security',
  'leave-management': 'view_dashboard',
  announcements: 'view_dashboard',
};

/**
 * Evaluates whether a navigation tab or module page is permitted for the current user.
 *
 * Rules:
 * 1. Administrators and IT developer accounts have unrestricted access to all pages.
 * 2. Attendance is always reachable so employees can clock in/out.
 * 3. For non-administrator employees, ONLY the explicitly granted permissions on
 *    their employee record are allowed. Revoking a permission (removing it from
 *    the record) immediately denies the page.
 */
export function isTabAllowedForUser(
  tabId: string,
  userRole: UserRole,
  userPermissions?: string[],
  isAdmin: boolean = false,
  isITAccount: boolean = false
): boolean {
  if (isAdmin || isITAccount) {
    return true;
  }

  if (tabId === 'attendance' || tabId === 'leave-management' || tabId === 'announcements') {
    return true;
  }

  if (!Array.isArray(userPermissions)) {
    return roleDefaultTabs[userRole]?.includes(tabId) ?? false;
  }

  const granted = new Set(normalizePermissions(userPermissions));
  const requiredPerms = tabPermissionMap[tabId];
  if (!requiredPerms) return false;

  if (Array.isArray(requiredPerms)) {
    return requiredPerms.some(perm => granted.has(perm));
  }
  return granted.has(requiredPerms);
}
