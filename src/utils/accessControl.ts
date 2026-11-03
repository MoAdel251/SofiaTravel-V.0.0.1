import { UserRole } from '../types';

/**
 * Granular permission required to open each application tab.
 *
 * Older employee records used a smaller set of permission ids (for example
 * `view_bookings` instead of `view_vouchers`), so every tab accepts the
 * current id and its legacy equivalents.
 */
export const TAB_PERMISSIONS: Record<string, string[]> = {
  dashboard: ['view_dashboard'],
  'permission-requests': ['view_dashboard'],
  attendance: ['view_dashboard'],
  calendar: ['view_dashboard'],
  tasks: ['view_dashboard'],
  documents: ['view_dashboard'],
  notifications: ['view_dashboard'],
  customers: ['view_customers', 'manage_customers'],
  'customer-inquiries': ['view_customers', 'manage_customers'],
  vouchers: ['view_vouchers', 'view_bookings'],
  reservations: ['view_vouchers', 'view_bookings'],
  services: ['view_services', 'view_trips'],
  visas: ['view_services', 'view_trips'],
  flights: ['view_services', 'view_trips'],
  hotels: ['view_services', 'view_trips'],
  transfers: ['view_services', 'view_trips'],
  cruises: ['view_services', 'view_trips'],
  tours: ['view_services', 'view_trips'],
  'day-trips': ['view_services', 'view_trips'],
  packages: ['view_packages', 'view_trips'],
  suppliers: ['view_suppliers', 'view_finance'],
  invoices: ['view_invoices', 'view_sales', 'view_finance'],
  finance: ['view_invoices', 'view_sales', 'view_finance'],
  'customer-payments': ['view_invoices', 'view_sales', 'view_finance'],
  'supplier-payments': ['view_invoices', 'view_sales', 'view_finance'],
  expenses: ['view_expenses', 'view_finance'],
  'finance-payroll': ['view_expenses', 'view_finance', 'view_payroll'],
  employees: ['view_employees', 'manage_permissions'],
  reports: ['view_reports', 'export_reports'],
  settings: ['view_settings', 'manage_settings'],
  'activity-log': ['view_settings', 'manage_settings'],
};

/** Role-based fallback used only for accounts with no granular permissions configured. */
export const TAB_ROLES: Record<string, UserRole[]> = {
  dashboard: ['Manager', 'Sales', 'Operations', 'Customer Service', 'Accountant'],
  'permission-requests': ['Manager', 'Sales', 'Operations', 'Customer Service', 'Accountant'],
  attendance: ['Manager', 'Sales', 'Operations', 'Customer Service', 'Accountant'],
  calendar: ['Manager', 'Sales', 'Operations', 'Customer Service'],
  tasks: ['Manager', 'Sales', 'Operations', 'Customer Service', 'Accountant'],
  documents: ['Manager', 'Sales', 'Operations', 'Customer Service', 'Accountant'],
  notifications: ['Manager', 'Sales', 'Operations', 'Customer Service', 'Accountant'],
  customers: ['Manager', 'Sales', 'Operations', 'Customer Service', 'Accountant'],
  'customer-inquiries': ['Manager', 'Sales', 'Operations', 'Customer Service', 'Accountant'],
  vouchers: ['Manager', 'Sales', 'Operations', 'Customer Service'],
  reservations: ['Manager', 'Sales', 'Operations', 'Customer Service'],
  services: ['Manager', 'Sales', 'Operations', 'Customer Service', 'Accountant'],
  visas: ['Manager', 'Sales', 'Operations', 'Customer Service', 'Accountant'],
  flights: ['Manager', 'Sales', 'Operations', 'Customer Service', 'Accountant'],
  hotels: ['Manager', 'Sales', 'Operations', 'Customer Service', 'Accountant'],
  transfers: ['Manager', 'Sales', 'Operations', 'Customer Service', 'Accountant'],
  cruises: ['Manager', 'Sales', 'Operations', 'Customer Service', 'Accountant'],
  tours: ['Manager', 'Sales', 'Operations', 'Customer Service', 'Accountant'],
  'day-trips': ['Manager', 'Sales', 'Operations', 'Customer Service', 'Accountant'],
  packages: ['Manager', 'Sales', 'Accountant'],
  suppliers: ['Manager', 'Operations', 'Accountant'],
  invoices: ['Manager', 'Sales', 'Operations', 'Customer Service', 'Accountant'],
  finance: ['Manager', 'Accountant'],
  'customer-payments': ['Manager', 'Accountant'],
  'supplier-payments': ['Manager', 'Accountant'],
  expenses: ['Manager', 'Accountant'],
  'finance-payroll': ['Accountant'],
  employees: ['Manager'],
  reports: ['Manager', 'Accountant'],
  settings: ['Manager'],
  'activity-log': ['Manager'],
};

/** Tab order used when redirecting away from a page the user cannot open. */
export const NAV_TAB_ORDER: string[] = [
  'dashboard',
  'vouchers',
  'services',
  'customers',
  'customer-inquiries',
  'invoices',
  'suppliers',
  'packages',
  'permission-requests',
  'employees',
  'attendance',
  'calendar',
  'tasks',
  'documents',
  'reports',
  'finance-payroll',
  'notifications',
  'settings',
  'activity-log',
];

interface AccessSubject {
  isAdmin?: boolean;
  isITAccount?: boolean;
  permissions?: string[];
}

/**
 * Returns whether a non-administrator may open the given tab.
 *
 * Once an employee has a granular permission list, that list is the single
 * source of truth: revoking a module removes its page from the navigation and
 * blocks it from rendering. Accounts that predate granular permissions (no
 * array at all) keep the legacy role-based behaviour.
 */
export function isTabAllowedForUser(
  tab: string,
  userRole: UserRole,
  subject: AccessSubject = {}
): boolean {
  if (
    subject.isAdmin ||
    subject.isITAccount ||
    userRole === 'Administrator'
  ) {
    return true;
  }

  // Self-service attendance always stays available so every employee can
  // clock in and out, even when other modules are revoked.
  if (tab === 'attendance') return true;

  const required = TAB_PERMISSIONS[tab];
  if (!required) return true;

  if (Array.isArray(subject.permissions)) {
    return required.some(permission => subject.permissions!.includes(permission));
  }

  const roles = TAB_ROLES[tab];
  return roles ? roles.includes(userRole) : true;
}

/** Returns the first tab the user is allowed to open. */
export function getFirstAllowedTab(
  userRole: UserRole,
  subject: AccessSubject = {}
): string {
  return NAV_TAB_ORDER.find(tab => isTabAllowedForUser(tab, userRole, subject)) || 'dashboard';
}
