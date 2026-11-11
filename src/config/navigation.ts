import {
  Activity,
  BarChart3,
  Bell,
  Briefcase,
  Calendar,
  CalendarDays,
  CheckSquare,
  Clock,
  Compass,
  DollarSign,
  FileText,
  Layers,
  LayoutDashboard,
  MapPin,
  Megaphone,
  MessageCircle,
  Settings,
  ShieldCheck,
  Ticket,
  Truck,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type NavGroupId = 'overview' | 'commercial' | 'people' | 'insight' | 'system';

export interface NavItem {
  id: string;
  labelKey: string;
  defaultLabel: string;
  icon: LucideIcon;
  roles: string[];
  perm?: string | string[];
  group: NavGroupId;
}

export interface NavGroup {
  id: NavGroupId;
  labelEn: string;
  labelAr: string;
}

/**
 * Single source of truth for navigation. Every existing tab, role and
 * permission rule is preserved exactly; only grouping metadata was added.
 */
export const NAV_GROUPS: NavGroup[] = [
  { id: 'overview', labelEn: 'Overview', labelAr: 'نظرة عامة' },
  { id: 'commercial', labelEn: 'Commercial', labelAr: 'العمليات التجارية' },
  { id: 'people', labelEn: 'People & HR', labelAr: 'الموظفون والموارد البشرية' },
  { id: 'insight', labelEn: 'Finance & Insight', labelAr: 'المالية والتقارير' },
  { id: 'system', labelEn: 'System', labelAr: 'النظام' },
];

export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', labelKey: 'nav_dashboard', defaultLabel: 'Dashboard', icon: LayoutDashboard, roles: ['Administrator', 'Manager', 'Sales', 'Operations', 'Customer Service', 'Accountant'], perm: 'view_dashboard', group: 'overview' },

  { id: 'vouchers', labelKey: 'nav_vouchers', defaultLabel: 'Customer Vouchers', icon: Ticket, roles: ['Administrator', 'Manager', 'Sales', 'Operations', 'Customer Service'], perm: 'view_bookings', group: 'commercial' },
  { id: 'services', labelKey: 'nav_services', defaultLabel: 'Tourism Services', icon: Layers, roles: ['Administrator', 'Manager', 'Sales', 'Operations', 'Customer Service', 'Accountant'], perm: 'view_trips', group: 'commercial' },
  { id: 'packages', labelKey: 'nav_packages', defaultLabel: 'Tour Packages', icon: Compass, roles: ['Administrator', 'Manager', 'Sales', 'Accountant'], perm: 'view_trips', group: 'commercial' },
  { id: 'customers', labelKey: 'nav_customers', defaultLabel: 'Customers', icon: Users, roles: ['Administrator', 'Manager', 'Sales', 'Operations', 'Customer Service', 'Accountant'], perm: 'view_customers', group: 'commercial' },
  { id: 'customer-inquiries', labelKey: 'nav_customer_inquiries', defaultLabel: 'Customer Inquiries', icon: MessageCircle, roles: ['Administrator', 'Manager', 'Sales', 'Operations', 'Customer Service', 'Accountant'], perm: 'view_customers', group: 'commercial' },
  { id: 'invoices', labelKey: 'nav_invoices', defaultLabel: 'Invoices', icon: FileText, roles: ['Administrator', 'Manager', 'Sales', 'Accountant', 'Operations', 'Customer Service'], perm: 'view_sales', group: 'commercial' },
  { id: 'suppliers', labelKey: 'nav_suppliers', defaultLabel: 'Suppliers', icon: Truck, roles: ['Administrator', 'Manager', 'Operations', 'Accountant'], perm: 'view_finance', group: 'commercial' },

  { id: 'employees', labelKey: 'nav_employees', defaultLabel: 'Employees', icon: Briefcase, roles: ['Administrator', 'Manager'], perm: 'view_employees', group: 'people' },
  { id: 'attendance', labelKey: 'nav_attendance', defaultLabel: 'Attendance & Departure', icon: Clock, roles: ['Administrator', 'Manager', 'Sales', 'Operations', 'Customer Service', 'Accountant'], perm: 'view_dashboard', group: 'people' },
  { id: 'leave-management', labelKey: 'nav_leave_management', defaultLabel: 'Leave & Permissions', icon: CalendarDays, roles: ['Administrator', 'Manager', 'Sales', 'Operations', 'Customer Service', 'Accountant'], perm: 'view_dashboard', group: 'people' },
  { id: 'permission-requests', labelKey: 'nav_approval_requests', defaultLabel: 'Approval Requests', icon: ShieldCheck, roles: ['Administrator', 'Manager', 'Sales', 'Operations', 'Customer Service', 'Accountant'], perm: 'view_dashboard', group: 'people' },
  { id: 'announcements', labelKey: 'nav_announcements', defaultLabel: 'Announcements', icon: Megaphone, roles: ['Administrator', 'Manager', 'Sales', 'Operations', 'Customer Service', 'Accountant'], perm: 'view_dashboard', group: 'people' },
  { id: 'attendance-security', labelKey: 'nav_attendance_security', defaultLabel: 'Attendance Security', icon: MapPin, roles: ['Administrator'], perm: 'view_attendance_security', group: 'people' },
  { id: 'calendar', labelKey: 'nav_calendar', defaultLabel: 'Calendar', icon: Calendar, roles: ['Administrator', 'Manager', 'Sales', 'Operations', 'Customer Service'], perm: 'view_dashboard', group: 'people' },
  { id: 'tasks', labelKey: 'nav_tasks', defaultLabel: 'Tasks', icon: CheckSquare, roles: ['Administrator', 'Manager', 'Sales', 'Operations', 'Customer Service', 'Accountant'], perm: 'view_dashboard', group: 'people' },
  { id: 'documents', labelKey: 'nav_documents', defaultLabel: 'Documents', icon: FileText, roles: ['Administrator', 'Manager', 'Operations', 'Customer Service', 'Sales', 'Accountant'], perm: 'view_dashboard', group: 'people' },

  { id: 'reports', labelKey: 'nav_reports', defaultLabel: 'Reports', icon: BarChart3, roles: ['Administrator', 'Manager', 'Accountant'], perm: 'view_reports', group: 'insight' },
  { id: 'finance-payroll', labelKey: 'nav_finance_payroll', defaultLabel: 'Finance & Payroll', icon: DollarSign, roles: ['Administrator', 'Accountant'], perm: ['view_finance', 'view_payroll'], group: 'insight' },
  { id: 'activity-log', labelKey: 'nav_audit_log', defaultLabel: 'Audit Log', icon: Activity, roles: ['Administrator', 'Manager'], perm: 'view_settings', group: 'insight' },

  { id: 'notifications', labelKey: 'nav_notifications', defaultLabel: 'Notifications', icon: Bell, roles: ['Administrator', 'Manager', 'Sales', 'Accountant', 'Operations', 'Customer Service'], perm: 'view_dashboard', group: 'system' },
  { id: 'settings', labelKey: 'nav_settings', defaultLabel: 'Settings', icon: Settings, roles: ['Administrator', 'Manager'], perm: 'view_settings', group: 'system' },
];
