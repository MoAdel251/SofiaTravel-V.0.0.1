import React, { useState, useEffect, useMemo } from 'react';
import { 
  Briefcase, Plus, Phone, Mail, X, Edit2, Trash2, AlertTriangle, Check, Save, Shield, UserX, UserCheck, Lock, Copy, Clock, RotateCcw
} from 'lucide-react';
import { Employee, UserRole, AttendanceRecord } from '../types';
import {
  calculateWorkingHours,
  formatWorkingHoursLabel,
  getPreviousTwoDaysDates,
  isAttendanceShiftOpen,
  normalizeTimeHHMM,
} from '../utils/attendance';
import { useLanguage } from '../context/LanguageContext';
import { isManagerOrAccountantRole, isEmployeeDesignatedAdmin } from '../utils/adminDesignation';
import { normalizePermissions } from '../utils/permissions';

interface EmployeesViewProps {
  employees: Employee[];
  onAddEmployee: (data: Partial<Employee> & { username?: string; password?: string }) => void;
  onEditEmployee: (id: string, data: Partial<Employee> & { username?: string; password?: string }) => void;
  onDeleteEmployee: (id: string) => void;
  onDeactivateEmployee?: (id: string, status: 'Active' | 'Inactive' | 'Suspended') => void;
  userRole: UserRole;
  userPermissions?: string[];
  onAddAuditLog: (log: any) => void;
  currentUsername: string;
  permissionRequests?: any[];
  onApprovePermissionRequest?: (id: string) => void;
  onRejectPermissionRequest?: (id: string, reason?: string) => void;
  isITAccount?: boolean;
  attendanceRecords?: AttendanceRecord[];
  onSaveManualAttendance?: (data: {
    id?: string;
    employee_id: string;
    employee_name: string;
    date: string;
    clock_in: string;
    clock_out?: string;
    notes?: string;
  }) => Promise<void> | void;
  onResetAttendanceTime?: (id: string, target: 'clock_in' | 'clock_out' | 'both') => Promise<void> | void;
  onDeleteAttendance?: (id: string) => Promise<void> | void;
  onSelfClockIn?: () => Promise<void> | void;
  onSelfClockOut?: () => Promise<void> | void;
  todaySelfAttendance?: AttendanceRecord | null;
}

const EMPLOYEE_DRAFT_KEY = 'sofia_travel_employee_draft_v2';

const DEFAULT_EMPLOYEE_PERMISSIONS = [
  'view_dashboard',
  'view_customers',
  'view_services',
  'view_packages',
  'view_vouchers',
];

export const PERMISSION_GROUPS = [
  { 
    group: 'Dashboard & Analytics', 
    permissions: [
      { id: 'view_dashboard', label: 'View Main Dashboard' }
    ] 
  },
  { 
    group: 'Employees & Permissions', 
    permissions: [
      { id: 'view_employees', label: 'View Employee Roster' },
      { id: 'add_employee', label: 'Add Employee Account' },
      { id: 'edit_employee', label: 'Edit Employee / Permissions' },
      { id: 'delete_employee', label: 'Delete / Deactivate Employee' }
    ] 
  },
  { 
    group: 'Customers & CRM', 
    permissions: [
      { id: 'view_customers', label: 'View Customer Profiles' },
      { id: 'add_customer', label: 'Add New Customer' },
      { id: 'edit_customer', label: 'Modify Customer Info' },
      { id: 'delete_customer', label: 'Delete Customer Record' }
    ] 
  },
  { 
    group: 'Tourism Services (All 7 Categories)', 
    permissions: [
      { id: 'view_services', label: 'View Tourism Services' },
      { id: 'add_service', label: 'Record New Tourism Service' },
      { id: 'edit_service', label: 'Modify Service Record' },
      { id: 'delete_service', label: 'Delete Service Record' }
    ] 
  },
  { 
    group: 'Customer Vouchers & Reservations', 
    permissions: [
      { id: 'view_vouchers', label: 'View Vouchers & Bookings' },
      { id: 'add_voucher', label: 'Issue / Confirm Voucher' },
      { id: 'edit_voucher', label: 'Modify Voucher Details' },
      { id: 'delete_voucher', label: 'Delete / Cancel Voucher' }
    ] 
  },
  { 
    group: 'Tour Packages & Itineraries', 
    permissions: [
      { id: 'view_packages', label: 'View Tour Packages' },
      { id: 'add_package', label: 'Create New Package' },
      { id: 'edit_package', label: 'Modify Tour Package' },
      { id: 'delete_package', label: 'Delete Tour Package' }
    ] 
  },
  { 
    group: 'Suppliers & Settlements', 
    permissions: [
      { id: 'view_suppliers', label: 'View Suppliers List' },
      { id: 'add_supplier', label: 'Add Supplier Profile' },
      { id: 'edit_supplier', label: 'Modify Supplier Info' },
      { id: 'delete_supplier', label: 'Delete Supplier Record' }
    ] 
  },
  { 
    group: 'Invoices & Billing', 
    permissions: [
      { id: 'view_invoices', label: 'View All Invoices' },
      { id: 'add_invoice', label: 'Create New Invoice' },
      { id: 'edit_invoice', label: 'Modify Invoice' },
      { id: 'delete_invoice', label: 'Delete Invoice' }
    ] 
  },
  { 
    group: 'Expenses & Finance', 
    permissions: [
      { id: 'view_expenses', label: 'View Financial Records' },
      { id: 'add_expense', label: 'Record New Expense' },
      { id: 'edit_expense', label: 'Modify Expense Record' },
      { id: 'delete_expense', label: 'Delete Expense Record' }
    ] 
  },
  { 
    group: 'Reports & Exporting', 
    permissions: [
      { id: 'view_reports', label: 'View Financial Reports' },
      { id: 'export_reports', label: 'Export Reports (CSV/PDF)' }
    ] 
  },
  { 
    group: 'HR, Leave & Announcements', 
    permissions: [
      { id: 'approve_leave', label: 'Approve Leave Requests' },
      { id: 'manage_leave_balances', label: 'Manage Leave Policies & Balances' },
      { id: 'manage_announcements', label: 'Publish Internal Announcements' },
      { id: 'view_attendance_security', label: 'Review Attendance Security Logs' }
    ] 
  },
  { 
    group: 'System Settings & Bank Accounts', 
    permissions: [
      { id: 'view_settings', label: 'View System Settings' },
      { id: 'manage_settings', label: 'Manage Bank & Exchange Rates' }
    ] 
  }
];

export function EmployeesView({ 
  employees, 
  onAddEmployee, 
  onEditEmployee, 
  onDeleteEmployee, 
  onDeactivateEmployee,
  userRole, 
  userPermissions = [],
  onAddAuditLog,
  currentUsername,
  permissionRequests = [],
  onApprovePermissionRequest,
  onRejectPermissionRequest,
  isITAccount = false,
  attendanceRecords = [],
  onSaveManualAttendance,
  onResetAttendanceTime,
  onDeleteAttendance,
  onSelfClockIn,
  onSelfClockOut,
  todaySelfAttendance,
}: EmployeesViewProps) {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [activeSubTab, setActiveSubTab] = useState<'employees' | 'attendance' | 'approvals'>('employees');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [savedSuccessMsg, setSavedSuccessMsg] = useState<string | null>(null);
  const [rejectionReasonMap, setRejectionReasonMap] = useState<Record<string, string>>({});

  // Manual Attendance Modal state (IT Developer Account)
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [resetModalRecord, setResetModalRecord] = useState<AttendanceRecord | null>(null);
  const [attendanceFilterDate, setAttendanceFilterDate] = useState<string>('');
  const [filterPrevTwoDays, setFilterPrevTwoDays] = useState<boolean>(false);
  const [attendanceFilterEmp, setAttendanceFilterEmp] = useState<string>('ALL');
  const prevTwoDays = useMemo(() => getPreviousTwoDaysDates(), []);
  const [manualAttForm, setManualAttForm] = useState<{
    id?: string;
    employee_id: string;
    employee_name: string;
    date: string;
    clock_in: string;
    clock_out: string;
    notes: string;
  }>({
    employee_id: '',
    employee_name: '',
    date: new Date().toISOString().split('T')[0],
    clock_in: '09:00',
    clock_out: '17:00',
    notes: '',
  });

  // Combined roster options for attendance (registered employees + default staff)
  const attendanceRosterOptions = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    employees.forEach(e => {
      const id = e.id || e.employee_id;
      const name = e.name || e.full_name || e.username || id;
      if (id) map.set(id, { id, name });
    });
    [
      { id: 'EMP-2', name: 'Karim Nabil' },
      { id: 'EMP-3', name: 'Mona Zaki' },
      { id: 'EMP-4', name: 'Youssef Mahmoud' },
    ].forEach(sys => {
      const alreadyByName = Array.from(map.values()).some(v => v.name === sys.name);
      if (!alreadyByName && !map.has(sys.id)) {
        map.set(sys.id, sys);
      }
    });
    return Array.from(map.values());
  }, [employees]);

  // Live preview of working hours in IT Manual Entry modal using the exact same calculation as employee self clock-in/out
  const previewCalc = useMemo(() => {
    return calculateWorkingHours(manualAttForm.clock_in, manualAttForm.clock_out || undefined);
  }, [manualAttForm.clock_in, manualAttForm.clock_out]);

  const openITManualModal = (existing?: AttendanceRecord) => {
    if (existing) {
      setManualAttForm({
        id: existing.id,
        employee_id: existing.employee_id,
        employee_name: existing.employee_name,
        date: existing.date,
        clock_in: normalizeTimeHHMM(existing.clock_in) || existing.clock_in || '09:00',
        clock_out: normalizeTimeHHMM(existing.clock_out) || existing.clock_out || '',
        notes: existing.notes || '',
      });
    } else {
      const firstEmp = attendanceRosterOptions[0];
      const todayStr = new Date().toISOString().split('T')[0];
      const existingToday = firstEmp
        ? attendanceRecords.find(
            r => (r.employee_id === firstEmp.id || r.employee_name === firstEmp.name) && r.date === todayStr
          )
        : undefined;
      setManualAttForm({
        id: existingToday?.id,
        employee_id: firstEmp?.id || '',
        employee_name: firstEmp?.name || '',
        date: todayStr,
        clock_in: existingToday ? (normalizeTimeHHMM(existingToday.clock_in) || existingToday.clock_in) : '09:00',
        clock_out: existingToday?.clock_out ? (normalizeTimeHHMM(existingToday.clock_out) || existingToday.clock_out) : '17:00',
        notes: existingToday?.notes || '',
      });
    }
    setShowAttendanceModal(true);
  };

  const handleManualEmployeeOrDateChange = (empId: string, dateVal: string) => {
    const selectedEmp = attendanceRosterOptions.find(o => o.id === empId);
    const empName = selectedEmp?.name || manualAttForm.employee_name;
    const match = attendanceRecords.find(
      r => (r.employee_id === empId || (empName && r.employee_name === empName)) && r.date === dateVal
    );
    if (match) {
      setManualAttForm(prev => ({
        ...prev,
        id: match.id,
        employee_id: empId,
        employee_name: match.employee_name || empName,
        date: dateVal,
        clock_in: normalizeTimeHHMM(match.clock_in) || match.clock_in || prev.clock_in,
        clock_out: match.clock_out ? (normalizeTimeHHMM(match.clock_out) || match.clock_out) : '',
        notes: match.notes || '',
      }));
    } else {
      setManualAttForm(prev => ({
        ...prev,
        id: undefined,
        employee_id: empId,
        employee_name: empName,
        date: dateVal,
      }));
    }
  };

  const handleManualAttendanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSaveManualAttendance || !isITAccount) return;
    const targetEmp = attendanceRosterOptions.find(o => o.id === manualAttForm.employee_id);
    const empName = targetEmp?.name || manualAttForm.employee_name || 'Employee';
    await onSaveManualAttendance({
      id: manualAttForm.id,
      employee_id: manualAttForm.employee_id || empName,
      employee_name: empName,
      date: manualAttForm.date,
      clock_in: manualAttForm.clock_in,
      clock_out: manualAttForm.clock_out || undefined,
      notes: manualAttForm.notes,
    });
    setShowAttendanceModal(false);
    setSavedSuccessMsg(
      isAr
        ? `تم حفظ وقت الحضور/الانصراف للموظف ${empName} وحساب ساعات العمل (${previewCalc.working_hours_formatted}) بنجاح.`
        : `Saved clock-in/clock-out for ${empName} — Calculated working hours: ${previewCalc.working_hours_formatted} (${previewCalc.working_hours} hrs).`
    );
    setTimeout(() => setSavedSuccessMsg(null), 4500);
  };

  const handleConfirmResetTime = async (rec: AttendanceRecord, target: 'clock_in' | 'clock_out' | 'both') => {
    if (!isITAccount || !onResetAttendanceTime) return;
    await onResetAttendanceTime(rec.id, target);
    setResetModalRecord(null);
    setShowAttendanceModal(false);
    setSavedSuccessMsg(
      target === 'clock_out'
        ? isAr
          ? `تمت إعادة ضبط وقت الانصراف للموظف ${rec.employee_name} (${rec.date}) — يمكن للموظف الآن تسجيل الانصراف بشكل طبيعي.`
          : `Reset clock-out time for ${rec.employee_name} (${rec.date}) — employee can now clock out normally.`
        : target === 'clock_in'
        ? isAr
          ? `تمت إعادة ضبط وقت الحضور للموظف ${rec.employee_name} (${rec.date}) — يمكن للموظف الآن تسجيل الحضور بشكل طبيعي.`
          : `Reset clock-in time for ${rec.employee_name} (${rec.date}) — employee can now clock in normally.`
        : isAr
        ? `تمت إعادة ضبط وقتي الحضور والانصراف للموظف ${rec.employee_name} (${rec.date}) — يمكن للموظف الآن التسجيل بشكل طبيعي.`
        : `Reset clock-in & clock-out times for ${rec.employee_name} (${rec.date}) — employee can now clock in and out normally.`
    );
    setTimeout(() => setSavedSuccessMsg(null), 5000);
  };

  const sortedFilteredAttendance = useMemo(() => {
    return [...attendanceRecords]
      .filter(r => {
        if (filterPrevTwoDays && !prevTwoDays.dates.includes(r.date)) return false;
        if (!filterPrevTwoDays && attendanceFilterDate && r.date !== attendanceFilterDate) return false;
        if (attendanceFilterEmp !== 'ALL' && r.employee_id !== attendanceFilterEmp && r.employee_name !== attendanceFilterEmp) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        const keyA = `${a.date || ''} ${a.clock_in || a.check_in_time || ''}`;
        const keyB = `${b.date || ''} ${b.clock_in || b.check_in_time || ''}`;
        return keyB.localeCompare(keyA);
      });
  }, [attendanceRecords, attendanceFilterDate, filterPrevTwoDays, prevTwoDays, attendanceFilterEmp]);

  const totalHoursFiltered = useMemo(() => {
    return Math.round(sortedFilteredAttendance.reduce((sum, r) => sum + (Number(r.working_hours) || 0), 0) * 100) / 100;
  }, [sortedFilteredAttendance]);

  // Deactivate confirmation modal
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [employeeToDeactivate, setEmployeeToDeactivate] = useState<Employee | null>(null);
  const [deactivateReason, setDeactivateReason] = useState('');
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  
  const ALL_PERMISSIONS = useMemo(() => {
    return PERMISSION_GROUPS.flatMap(g => g.permissions.map(p => p.id));
  }, []);

  const initialFormState = {
    name: '',
    username: '',
    password: '',
    position: 'Sales Executive' as string,
    department: 'Sales',
    salary: 1200,
    email: '',
    phone: '',
    is_admin: false,
    account_type: 'Employee' as 'Admin' | 'Employee',
    designation: 'Employee' as string,
    status: 'Active' as 'Active' | 'On Leave' | 'Inactive',
    account_status: 'Active' as 'Active' | 'Inactive' | 'Suspended',
    permissions: [
      'view_dashboard',
      'view_customers', 'add_customer',
      'view_services', 'add_service',
      'view_vouchers', 'add_voucher',
      'view_packages', 'add_package',
      'view_suppliers', 'add_supplier',
      'view_invoices', 'add_invoice',
      'view_expenses', 'add_expense',
      'view_reports', 'export_reports',
      'view_settings'
    ] as string[]
  };
  
  const [formData, setFormData] = useState(initialFormState);
  const [hasUnsavedDraft, setHasUnsavedDraft] = useState(false);
  const [draftPreviewName, setDraftPreviewName] = useState<string>('');
  const [copySourceEmpId, setCopySourceEmpId] = useState<string>('');

  useEffect(() => {
    try {
      const draft = localStorage.getItem(EMPLOYEE_DRAFT_KEY);
      if (draft) {
        const parsed = JSON.parse(draft);
        if (parsed && (parsed.name || parsed.username || parsed.email)) {
          setHasUnsavedDraft(true);
          setDraftPreviewName(parsed.name || parsed.username || 'Employee');
        }
      }
    } catch (e) {
      console.warn("Draft parse error:", e);
    }
  }, []);

  const openEditModal = (emp: Employee) => {
    const isEmpAdmin = isEmployeeDesignatedAdmin(emp);
    setEditingEmployee(emp);
    setFormData({
      name: emp.name || '',
      username: emp.username || '',
      password: emp.password || '',
      position: emp.position || (isEmpAdmin ? 'Administrator' : 'Sales Executive'),
      department: emp.department || (isEmpAdmin ? 'Management' : 'Sales'),
      salary: emp.salary || 0,
      email: emp.email || '',
      phone: emp.phone || '',
      is_admin: isEmpAdmin,
      account_type: isEmpAdmin ? 'Admin' : 'Employee',
      designation: isEmpAdmin ? 'Admin' : 'Employee',
      status: emp.status || 'Active',
      account_status: emp.account_status || 'Active',
      permissions: isEmpAdmin 
        ? ALL_PERMISSIONS 
        : (Array.isArray(emp.permissions)
            ? normalizePermissions(emp.permissions)
            : DEFAULT_EMPLOYEE_PERMISSIONS)
    });
    setShowAddModal(true);
  };

  const handleOpenAddModal = () => {
    setEditingEmployee(null);
    try {
      const draft = localStorage.getItem(EMPLOYEE_DRAFT_KEY);
      if (draft) {
        const parsed = JSON.parse(draft);
        const merged = { ...initialFormState, ...parsed };
        merged.permissions = normalizePermissions(merged.permissions);
        if (isITAccount && isManagerOrAccountantRole(merged.position, merged.department)) {
          merged.is_admin = true;
          merged.account_type = 'Admin';
          merged.designation = 'Admin';
          merged.permissions = ALL_PERMISSIONS;
        }
        setFormData(merged);
      } else {
        setFormData(initialFormState);
      }
    } catch {
      setFormData(initialFormState);
    }
    setShowAddModal(true);
  };

  const handleFormFieldChange = (updates: Partial<typeof initialFormState>) => {
    const updated = { ...formData, ...updates };

    // Auto-update default department when selecting Manager or Accountant if department was untouched default
    if (updates.position !== undefined && updates.department === undefined) {
      const posLower = String(updates.position || '').trim().toLowerCase();
      if ((posLower.includes('accountant') || posLower.includes('محاسب')) && (formData.department === 'Sales' || formData.department === 'Management')) {
        updated.department = 'Accounting';
      } else if ((posLower.includes('manager') || posLower.includes('مدير')) && (formData.department === 'Sales' || formData.department === 'Accounting')) {
        updated.department = 'Management';
      }
    }

    // Requirement: When the IT department adds an account for managers or accountants, designate their account as "Admin"
    if (
      isITAccount &&
      (updates.position !== undefined || updates.department !== undefined || !editingEmployee) &&
      updates.is_admin === undefined
    ) {
      if (isManagerOrAccountantRole(updated.position, updated.department)) {
        updated.is_admin = true;
        updated.account_type = 'Admin';
        updated.designation = 'Admin';
        updated.permissions = ALL_PERMISSIONS;
      } else if (
        !editingEmployee &&
        formData.is_admin &&
        isManagerOrAccountantRole(formData.position, formData.department) &&
        updated.position !== 'Administrator'
      ) {
        updated.is_admin = false;
        updated.account_type = 'Employee';
        updated.designation = 'Employee';
        updated.permissions = initialFormState.permissions;
      }
    }

    if (updates.position === 'Administrator') {
      updated.is_admin = true;
      updated.account_type = 'Admin';
      updated.designation = 'Admin';
      updated.permissions = ALL_PERMISSIONS;
    }

    setFormData(updated);
    if (!editingEmployee) {
      try {
        localStorage.setItem(EMPLOYEE_DRAFT_KEY, JSON.stringify(updated));
        if (updated.name || updated.username) {
          setHasUnsavedDraft(true);
          setDraftPreviewName(updated.name || updated.username || 'Employee');
        }
      } catch (err) {
        console.warn("Could not save employee draft:", err);
      }
    }
  };

  const handleAdminToggle = (isAdminSelected: boolean) => {
    if (isAdminSelected) {
      const keepPosition =
        formData.position &&
        formData.position !== 'Sales Executive'
          ? formData.position
          : 'Administrator';
      handleFormFieldChange({
        is_admin: true,
        account_type: 'Admin',
        designation: 'Admin',
        position: keepPosition,
        permissions: ALL_PERMISSIONS
      });
    } else {
      handleFormFieldChange({
        is_admin: false,
        account_type: 'Employee',
        designation: 'Employee',
        position: formData.position === 'Administrator' ? 'Sales Executive' : formData.position,
        permissions: [
          'view_dashboard',
          'view_customers',
          'view_services',
          'view_packages',
          'view_vouchers',
          'view_invoices',
        ]
      });
    }
  };

  const handlePermissionToggle = (permId: string) => {
    const current = formData.permissions;
    const exists = current.includes(permId);
    const updated = exists ? current.filter(p => p !== permId) : [...current, permId];
    handleFormFieldChange({ permissions: updated });
  };

  const handleSelectGroupAll = (groupPerms: string[]) => {
    const current = new Set(formData.permissions);
    groupPerms.forEach(p => current.add(p));
    handleFormFieldChange({ permissions: Array.from(current) as string[] });
  };

  const handleClearGroupAll = (groupPerms: string[]) => {
    const current = new Set(formData.permissions);
    groupPerms.forEach(p => current.delete(p));
    handleFormFieldChange({ permissions: Array.from(current) as string[] });
  };

  const handleCopyPermissionsFrom = (sourceId: string) => {
    if (!sourceId) return;
    const src = employees.find(e => e.id === sourceId || e.employee_id === sourceId);
    if (src && src.permissions) {
      handleFormFieldChange({ permissions: normalizePermissions(src.permissions) });
      setSavedSuccessMsg(`Successfully copied permissions from ${src.name}!`);
      setTimeout(() => setSavedSuccessMsg(null), 3500);
    }
  };

  const handleCreateOrUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    const empName = formData.name || formData.username || 'Employee';
    const isITAddingMgrOrAcc =
      !editingEmployee &&
      isITAccount &&
      isManagerOrAccountantRole(formData.position, formData.department);
    const shouldBeAdmin = Boolean(
      formData.is_admin ||
      isITAddingMgrOrAcc ||
      formData.position === 'Administrator'
    );

    const payload: Partial<Employee> & { username?: string; password?: string } = {
      ...formData,
      is_admin: shouldBeAdmin,
      account_type: shouldBeAdmin ? 'Admin' : 'Employee',
      designation: shouldBeAdmin ? 'Admin' : 'Employee',
      role: shouldBeAdmin ? 'Admin' : formData.position,
      permissions: shouldBeAdmin ? ALL_PERMISSIONS : normalizePermissions(formData.permissions),
    };

    if (editingEmployee) {
      // Preserve existing password if left blank on edit
      if (!payload.password && editingEmployee.password) {
        payload.password = editingEmployee.password;
      }
      onEditEmployee(editingEmployee.id, payload);
      onAddAuditLog({
        id: 'LOG-' + Date.now(),
        user_name: currentUsername,
        user_role: userRole,
        action: 'Updated',
        record_type: 'Employee Permissions & Account',
        record_id: editingEmployee.employee_id || editingEmployee.id,
        new_value: `Updated profile & permissions for ${empName}${shouldBeAdmin ? ' [Admin]' : ''}`,
        date_time: new Date().toLocaleString()
      });
      setSavedSuccessMsg(
        shouldBeAdmin
          ? `Updated details for ${empName} (Designated as Admin)`
          : `Updated details and permissions for ${empName}`
      );
    } else {
      payload.created_by = isITAccount ? 'IT' : currentUsername;
      onAddEmployee(payload);
      onAddAuditLog({
        id: 'LOG-' + Date.now(),
        user_name: currentUsername,
        user_role: userRole,
        action: 'Created',
        record_type: 'Employee Account',
        record_id: 'EMP-' + Date.now(),
        new_value: shouldBeAdmin
          ? `Created ${formData.position} account ${empName} designated as Admin`
          : `Created employee ${empName} with specific permissions`,
        date_time: new Date().toLocaleString()
      });
      setSavedSuccessMsg(
        shouldBeAdmin
          ? (isAr
              ? `تم إنشاء حساب ${empName} (${formData.position}) وتعيينه كمسؤول (Admin) بنجاح!`
              : `Created ${formData.position} account for ${empName} — Designated as "Admin"!`)
          : `Created employee record and user account for ${empName}`
      );
    }
    localStorage.removeItem(EMPLOYEE_DRAFT_KEY);
    setHasUnsavedDraft(false);
    setShowAddModal(false);
    setEditingEmployee(null);
    setFormData(initialFormState);
    setTimeout(() => setSavedSuccessMsg(null), 4500);
  };

  const handleDiscardDraft = () => {
    localStorage.removeItem(EMPLOYEE_DRAFT_KEY);
    setHasUnsavedDraft(false);
    setFormData(initialFormState);
  };

  const handleConfirmDeactivate = () => {
    if (!employeeToDeactivate) return;
    const newStatus = employeeToDeactivate.account_status === 'Inactive' ? 'Active' : 'Inactive';
    if (onDeactivateEmployee) {
      onDeactivateEmployee(employeeToDeactivate.id, newStatus);
    } else {
      onEditEmployee(employeeToDeactivate.id, { account_status: newStatus });
    }
    onAddAuditLog({
      id: 'LOG-' + Date.now(),
      user_name: currentUsername,
      user_role: userRole,
      action: 'Updated',
      record_type: 'Employee Account Status',
      record_id: employeeToDeactivate.employee_id,
      new_value: `Changed account status to ${newStatus}. Reason: ${deactivateReason || 'Administrative action'}`,
      date_time: new Date().toLocaleString()
    });
    setShowDeactivateModal(false);
    setEmployeeToDeactivate(null);
    setDeactivateReason('');
    setSavedSuccessMsg(`Employee account status updated successfully.`);
    setTimeout(() => setSavedSuccessMsg(null), 4000);
  };

  const isAdmin = userRole === 'Administrator';
  const canManagePermissions = isAdmin || userPermissions.includes('manage_permissions');
  const pendingCount = (permissionRequests || []).filter((r: any) => r.status === 'Pending').length;

  return (
    <div className="p-8 space-y-6 bg-slate-50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-extrabold uppercase tracking-wider">Admin Secure</span>
            <span className="px-2.5 py-1 bg-cyan-50 text-cyan-700 rounded-lg text-xs font-extrabold uppercase tracking-wider">Granular RBAC</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-2">Employee Management & Permission Control</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage staff profiles, unique employee IDs, granular access control permissions, and review modification/deletion requests.</p>
        </div>
        {isAdmin && (
          <button
            onClick={handleOpenAddModal}
            className="flex items-center space-x-2 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Employee & Permissions</span>
          </button>
        )}
      </div>

      {/* TOP TAB NAVIGATION: STAFF ROSTER vs ATTENDANCE & WORKING HOURS vs APPROVAL QUEUE */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveSubTab('employees')}
          className={`px-5 py-3 font-bold text-xs flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'employees'
              ? 'border-cyan-600 text-cyan-700 bg-white rounded-t-xl shadow-xs'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>{isAr ? `حسابات الموظفين والصلاحيات (${employees.length})` : `Staff Accounts & Site-Wide Permissions (${employees.length})`}</span>
        </button>

        <button
          onClick={() => setActiveSubTab('attendance')}
          className={`px-5 py-3 font-bold text-xs flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'attendance'
              ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-xl shadow-xs'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4 text-emerald-600" />
          <span>{isAr ? `الحضور والانصراف وساعات العمل (${attendanceRecords.length})` : `Attendance & Working Hours (${attendanceRecords.length})`}</span>
        </button>

        <button
          onClick={() => setActiveSubTab('approvals')}
          className={`px-5 py-3 font-bold text-xs flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'approvals'
              ? 'border-amber-600 text-amber-700 bg-white rounded-t-xl shadow-xs'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Shield className="w-4 h-4 text-amber-600" />
          <span>{isAr ? 'طلبات موافقة المدير' : 'Administrator Approval Queue'}</span>
          {pendingCount > 0 && (
            <span className="px-2 py-0.5 bg-amber-500 text-white rounded-full text-[10px] font-black animate-pulse">
              {pendingCount} PENDING
            </span>
          )}
        </button>
      </div>

      {/* Unsaved Draft Alert */}
      {hasUnsavedDraft && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-sm font-bold">Unsaved Employee Draft Found: {draftPreviewName}</p>
              <p className="text-xs text-amber-700">You previously entered employee details that haven't been saved yet. You can resume and save now.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer"
            >
              Resume & Save
            </button>
            <button
              type="button"
              onClick={handleDiscardDraft}
              className="px-3.5 py-1.5 bg-white border border-amber-300 text-amber-800 hover:bg-amber-100 text-xs font-medium rounded-lg cursor-pointer"
            >
              Discard Draft
            </button>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {savedSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{savedSuccessMsg}</span>
        </div>
      )}

      {/* TAB: EMPLOYEE ATTENDANCE & WORKING HOURS (Self Clock-In/Out + IT Manual Entry) */}
      {activeSubTab === 'attendance' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-slate-900">
                  {isAr ? 'سجل حضور وانصراف الموظفين وحساب ساعات العمل' : 'Employee Clock-In / Clock-Out & Working Hours'}
                </h3>
                {isITAccount && (
                  <span className="px-2 py-0.5 bg-slate-900 text-cyan-300 rounded-md text-[10px] font-extrabold uppercase">
                    {isAr ? 'صلاحية الإدخال اليدوي مفعلة (IT)' : 'IT Manual Time Entry Active'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {isAr
                  ? 'يتم حساب عدد ساعات العمل تلقائياً وبنفس الدقة سواء سجل الموظف حضوره/انصرافه بنفسه أو أضافه مطور النظام (IT) يدوياً.'
                  : 'Working hours are calculated automatically and identically whether the employee clocks in/out themselves or the "IT" developer enters/edits times manually.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              {/* Self Clock-In / Clock-Out button */}
              {(onSelfClockIn || onSelfClockOut) && (
                isAttendanceShiftOpen(todaySelfAttendance) ? (
                  <button
                    type="button"
                    onClick={onSelfClockOut}
                    className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 cursor-pointer min-h-[42px]"
                  >
                    <Clock className="w-4 h-4" />
                    <span>
                      {isAr
                        ? `تسجيل انصراف الآن (حضور: ${todaySelfAttendance?.clock_in || todaySelfAttendance?.check_in_time})`
                        : `Clock Out Now (In: ${todaySelfAttendance?.clock_in || todaySelfAttendance?.check_in_time})`}
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onSelfClockIn}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 cursor-pointer min-h-[42px]"
                  >
                    <Clock className="w-4 h-4" />
                    <span>{isAr ? 'تسجيل حضور الآن' : 'Clock In Now'}</span>
                  </button>
                )
              )}

              {/* IT Developer Account Manual Clock-In / Clock-Out Button */}
              {isITAccount && onSaveManualAttendance && (
                <button
                  type="button"
                  onClick={() => openITManualModal()}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 cursor-pointer min-h-[42px]"
                >
                  <Plus className="w-4 h-4 text-cyan-400" />
                  <span>
                    {isAr
                      ? 'إضافة حضور / انصراف يدوي (IT)'
                      : 'Manual Clock-In / Clock-Out (IT)'}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Filters & Summary Strip */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-500 me-2">
                  {isAr ? 'الموظف:' : 'Employee:'}
                </label>
                <select
                  value={attendanceFilterEmp}
                  onChange={(e) => setAttendanceFilterEmp(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-semibold text-slate-800"
                >
                  <option value="ALL">{isAr ? 'جميع الموظفين' : 'All Employees'}</option>
                  {attendanceRosterOptions.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <label className="text-[11px] font-bold text-slate-500">
                  {isAr ? 'التاريخ:' : 'Date:'}
                </label>
                <input
                  type="date"
                  value={attendanceFilterDate}
                  onChange={(e) => {
                    setFilterPrevTwoDays(false);
                    setAttendanceFilterDate(e.target.value);
                  }}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-semibold text-slate-800"
                />
                <button
                  type="button"
                  onClick={() => {
                    setAttendanceFilterDate('');
                    setFilterPrevTwoDays(prev => !prev);
                  }}
                  className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-colors ${
                    filterPrevTwoDays
                      ? 'bg-indigo-600 text-white'
                      : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
                  }`}
                >
                  {isAr
                    ? `اليومين السابقين (${prevTwoDays.twoDaysAgo} & ${prevTwoDays.yesterday})`
                    : `Previous 2 Days (${prevTwoDays.twoDaysAgo} & ${prevTwoDays.yesterday})`}
                </button>
                {(attendanceFilterDate || filterPrevTwoDays) && (
                  <button
                    type="button"
                    onClick={() => {
                      setAttendanceFilterDate('');
                      setFilterPrevTwoDays(false);
                    }}
                    className="text-slate-400 hover:text-slate-700 px-2 py-1 font-bold cursor-pointer"
                  >
                    {isAr ? 'الكل' : 'All'}
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold">
                {isAr
                  ? `إجمالي ساعات العمل المحسوبة: ${totalHoursFiltered.toFixed(2)} ساعة`
                  : `Total Calculated Working Hours: ${totalHoursFiltered.toFixed(2)} hrs`}
              </div>
            </div>
          </div>

          {/* Attendance Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-start text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 font-semibold text-start">{isAr ? 'التاريخ' : 'Date'}</th>
                    <th className="py-3 px-4 font-semibold text-start">{isAr ? 'الموظف' : 'Employee'}</th>
                    <th className="py-3 px-4 font-semibold text-start">{isAr ? 'وقت الحضور' : 'Clock In'}</th>
                    <th className="py-3 px-4 font-semibold text-start">{isAr ? 'وقت الانصراف' : 'Clock Out'}</th>
                    <th className="py-3 px-4 font-semibold text-start">{isAr ? 'عدد ساعات العمل' : 'Working Hours'}</th>
                    <th className="py-3 px-4 font-semibold text-start">{isAr ? 'الحالة / الطريقة' : 'Status / Source'}</th>
                    {isITAccount && (
                      <th className="py-3 px-4 font-semibold text-end">{isAr ? 'إجراءات IT' : 'IT Actions'}</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedFilteredAttendance.length === 0 ? (
                    <tr>
                      <td colSpan={isITAccount ? 7 : 6} className="py-10 text-center text-slate-400 text-xs">
                        {isAr
                          ? 'لا توجد سجلات حضور وانصراف مسجلة بعد.'
                          : 'No employee clock-in / clock-out records found yet.'}
                      </td>
                    </tr>
                  ) : (
                    sortedFilteredAttendance.map(rec => {
                      const inVal = rec.clock_in || rec.check_in_time || '';
                      const rawOutVal = rec.clock_out || rec.check_out_time || '';
                      const outVal = rawOutVal === '--' ? '' : rawOutVal;
                      const shiftOpen = isAttendanceShiftOpen(rec);
                      const computed = calculateWorkingHours(inVal, outVal || undefined);
                      const hoursNum = !shiftOpen ? (rec.working_hours || computed.working_hours) : 0;
                      const hoursFmt = !shiftOpen ? (rec.working_hours_formatted || rec.total_working_hours || computed.working_hours_formatted) : undefined;
                      const lateMins = Number(rec.late_minutes) || 0;
                      return (
                        <tr key={rec.id} className="hover:bg-slate-50/80">
                          <td className="py-3 px-4 font-mono font-bold text-slate-800">{rec.date}</td>
                          <td className="py-3 px-4 font-bold text-slate-900">{rec.employee_name}</td>
                          <td className="py-3 px-4 font-mono font-semibold text-emerald-700">
                            {inVal || (isAr ? 'بانتظار الحضور...' : 'Awaiting Clock-In...')}
                          </td>
                          <td className="py-3 px-4 font-mono font-semibold text-blue-700">{outVal || (isAr ? 'قيد العمل...' : 'Active Shift...')}</td>
                          <td className="py-3 px-4">
                            {!shiftOpen && inVal && outVal ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-extrabold">
                                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                                {formatWorkingHoursLabel(hoursNum, hoursFmt, isAr)}
                              </span>
                            ) : !inVal ? (
                              <span className="text-amber-600 font-semibold">
                                {isAr ? 'بانتظار تسجيل الحضور' : 'Awaiting Clock-In'}
                              </span>
                            ) : (
                              <span className="text-amber-600 font-semibold">
                                {isAr ? 'بانتظار تسجيل الانصراف' : 'Awaiting Clock-Out'}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                !shiftOpen && inVal && outVal
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}>
                                {!inVal
                                  ? (isAr ? 'بانتظار الحضور' : 'Awaiting Clock-In')
                                  : !shiftOpen && outVal
                                  ? (isAr ? 'مكتمل' : 'Completed')
                                  : (isAr ? 'متواجد بالعمل' : 'Clocked In')}
                              </span>
                              {lateMins > 0 && (
                                <span className="px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold">
                                  {isAr ? `تأخير ${lateMins} د` : `Late ${lateMins}m`}
                                </span>
                              )}
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold">
                                {isAr ? 'تسجيل ذاتي' : 'Self Clock'}
                              </span>
                              {rec.reset_by_it && rec.entry_source !== 'IT Manual' && (
                                <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold">
                                  {isAr ? 'تمت إعادة الضبط' : 'Reset by IT'}
                                </span>
                              )}
                            </div>
                          </td>
                          {isITAccount && (
                            <td className="py-3 px-4 text-end">
                              <div className="inline-flex items-center gap-1.5 flex-wrap justify-end">
                                <button
                                  type="button"
                                  onClick={() => openITManualModal(rec)}
                                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                                >
                                  <Edit2 className="w-3 h-3" />
                                  <span>{isAr ? 'تعديل الوقت' : 'Edit Time'}</span>
                                </button>
                                {onResetAttendanceTime && (
                                  <button
                                    type="button"
                                    onClick={() => setResetModalRecord(rec)}
                                    className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                                    title={
                                      isAr
                                        ? 'إعادة ضبط وقت الحضور أو الانصراف للسماح للموظف بالتسجيل بشكل طبيعي'
                                        : 'Reset clock-in or clock-out time so the employee can clock in/out normally'
                                    }
                                  >
                                    <RotateCcw className="w-3 h-3 text-amber-700" />
                                    <span>{isAr ? 'إعادة ضبط الوقت' : 'Reset Time'}</span>
                                  </button>
                                )}
                                {onDeleteAttendance && (
                                  <button
                                    type="button"
                                    onClick={() => onDeleteAttendance(rec.id)}
                                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                                    title={isAr ? 'حذف السجل' : 'Delete Record'}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ADMINISTRATOR APPROVAL QUEUE PANEL */}
      {activeSubTab === 'approvals' && (
        <div className="space-y-4">
          <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-center gap-3">
            <Shield className="w-6 h-6 text-amber-600 shrink-0" />
            <div>
              <h3 className="text-sm font-black text-amber-950">Administrator Modification & Deletion Approval Requests</h3>
              <p className="text-xs text-amber-800">
                Non-admin employee accounts are restricted to Add-Only actions. All modification (Edit) and deletion attempts submitted across the website require Administrator review and approval with a mandatory reason.
              </p>
            </div>
          </div>

          {(permissionRequests || []).length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
              <Check className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="font-bold text-sm text-slate-700">No Pending Requests</p>
              <p className="text-xs text-slate-500">All modification and deletion requests have been reviewed.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {(permissionRequests || []).map((req: any) => {
                const isPending = req.status === 'Pending';
                const isApproved = req.status === 'Approved';
                const isDelete = req.action_type === 'Delete';

                return (
                  <div 
                    key={req.id} 
                    className={`bg-white rounded-2xl border p-6 shadow-xs space-y-4 transition-all ${
                      isPending ? 'border-amber-300 ring-2 ring-amber-100' : 'border-slate-200 opacity-90'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${
                          isDelete ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {req.action_type === 'Delete' ? 'Deletion Request' : 'Modification Request'}
                        </span>
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-lg text-xs font-bold">
                          Page / Section: {req.module}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${
                          isPending ? 'bg-amber-100 text-amber-800' : isApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {req.status}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 font-mono">
                        Request ID: {req.id} • {req.created_at || 'Recently'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Submitted By Staff Member:</p>
                        <p className="font-bold text-sm text-slate-900 mt-0.5">{req.employee_name} ({req.employee_role || 'Employee'})</p>
                        <p className="text-slate-500">Target Item: <span className="font-bold text-slate-800">{req.item_name}</span> (ID: {req.item_id})</p>
                      </div>

                      {/* REASON FOR MODIFICATION / DELETION (REQUIREMENT HIGHLIGHT) */}
                      <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-200 text-amber-950 space-y-1">
                        <p className="text-[10px] uppercase font-black tracking-wider text-amber-700 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          Visible Reason for {req.action_type}:
                        </p>
                        <p className="font-bold text-xs italic text-amber-900 bg-white/70 p-2 rounded-lg border border-amber-200/60">
                          "{req.reason || 'No specific reason entered by user.'}"
                        </p>
                      </div>
                    </div>

                    {req.proposed_changes && (
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs font-mono overflow-x-auto">
                        <p className="text-[10px] uppercase font-bold text-slate-400 font-sans mb-1">Proposed Modification Payload:</p>
                        <pre className="text-[11px] text-slate-700 whitespace-pre-wrap">
                          {JSON.stringify(req.proposed_changes, null, 2)}
                        </pre>
                      </div>
                    )}

                    {isPending && isAdmin && (
                      <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
                        <input
                          type="text"
                          placeholder="Optional rejection reason..."
                          value={rejectionReasonMap[req.id] || ''}
                          onChange={(e) => setRejectionReasonMap(prev => ({ ...prev, [req.id]: e.target.value }))}
                          className="w-full sm:w-64 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => onRejectPermissionRequest && onRejectPermissionRequest(req.id, rejectionReasonMap[req.id])}
                          className="w-full sm:w-auto px-4 py-2 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs cursor-pointer"
                        >
                          Reject Request
                        </button>
                        <button
                          type="button"
                          onClick={() => onApprovePermissionRequest && onApprovePermissionRequest(req.id)}
                          className="w-full sm:w-auto px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Check className="w-4 h-4" />
                          <span>Approve & Execute {req.action_type}</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 1: EMPLOYEES ROSTER LIST */}
      {activeSubTab === 'employees' && (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-semibold">Employee ID</th>
                <th className="py-3 px-4 font-semibold">Name & Username</th>
                <th className="py-3 px-4 font-semibold">Position / Dept</th>
                <th className="py-3 px-4 font-semibold">Permissions Assigned</th>
                <th className="py-3 px-4 font-semibold">Account Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.map(emp => {
                const displayName = emp.name || (emp as any).full_name || 'Staff Member';
                const isEmpAdmin = isEmployeeDesignatedAdmin(emp);
                const rawPosition = emp.position || (emp as any).job_title || (isEmpAdmin ? 'Admin' : 'Sales Executive');
                const permCount = (emp.permissions || []).length;
                const accStatus = emp.account_status || emp.status || 'Active';
                return (
                  <tr key={emp.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{emp.employee_id || emp.id}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-900">{displayName}</span>
                        {isEmpAdmin && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md font-extrabold text-[10px] uppercase tracking-wider">
                            <Shield className="w-2.5 h-2.5 text-blue-600" /> Admin
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">@{emp.username || 'n/a'}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-cyan-700">{rawPosition}</span>
                        {isEmpAdmin && rawPosition.toLowerCase() !== 'admin' && rawPosition.toLowerCase() !== 'administrator' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-600 text-white rounded-md font-bold text-[10px]">
                            <Shield className="w-2.5 h-2.5" /> Admin
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 block">{emp.department || 'Sales'}</span>
                    </td>
                    <td className="py-3 px-4">
                      {isEmpAdmin ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-bold text-[10px] shadow-xs">
                          <Shield className="w-3 h-3" /> Admin — Full System Access (All Pages)
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg font-bold text-[10px]">
                          {permCount} Permissions
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                        accStatus === 'Active' ? 'bg-emerald-50 text-emerald-700' :
                        accStatus === 'Suspended' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {accStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {isAdmin && (
                          <button
                            onClick={() => openEditModal(emp)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1"
                            title="Edit Profile & Permissions"
                          >
                            <Edit2 className="w-3 h-3" /> Edit
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => {
                              setEmployeeToDeactivate(emp);
                              setShowDeactivateModal(true);
                            }}
                            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1 ${
                              accStatus === 'Active' ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            }`}
                          >
                            {accStatus === 'Active' ? <UserX className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                            {accStatus === 'Active' ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => setEmployeeToDelete(emp)}
                            className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors cursor-pointer"
                            title="Hard Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Add / Edit Employee Modal with Granular Permissions */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingEmployee ? 'Edit Employee Account & Permissions' : 'Create Employee Account & Granular Permissions'}
                </h3>
                <p className="text-xs text-slate-500">
                  {editingEmployee ? `Employee ID: ${editingEmployee.employee_id}` : 'Assign unique employee ID and role permissions.'}
                </p>
              </div>
              <button 
                onClick={() => setShowAddModal(false)} 
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrUpdate} className="space-y-6 pt-4 text-xs">
              {/* POLICY BANNER FOR FUTURE EMPLOYEE CREATION */}
              <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-amber-950 rounded-2xl flex items-start gap-3">
                <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold text-xs text-amber-900">🔒 System Access Policy: Add-Only Rights for Non-Admin Accounts</p>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Employee accounts created without full Administrator privileges are granted <strong>Add/Create Only</strong> capabilities by default. Any edit, modification, or deletion attempted across all pages and services (Hotels, Flights, Invoices, Vouchers, Customers, Suppliers) will automatically submit a formal approval request to Administrators requiring a mandatory reason for review.
                  </p>
                </div>
              </div>

              {/* Copy permissions helper */}
              {canManagePermissions && (
              <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-blue-900">Quick Permission Template</p>
                  <p className="text-[11px] text-blue-700">Copy permissions from an existing employee profile.</p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={copySourceEmpId}
                    onChange={(e) => setCopySourceEmpId(e.target.value)}
                    className="bg-white border border-blue-200 rounded-xl px-3 py-1.5 text-xs text-blue-900 font-medium"
                  >
                    <option value="">-- Choose Employee to Copy From --</option>
                    {employees.map(e => (
                      <option key={e.id} value={e.id}>{e.name} ({e.employee_id})</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => handleCopyPermissionsFrom(copySourceEmpId)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-xl font-bold shadow-xs cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy
                  </button>
                </div>
              </div>
              )}

              {/* Personal & Login Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Administrator Designation Banner / Toggle */}
                <div className={`sm:col-span-3 p-4 rounded-2xl border transition-all ${
                  formData.is_admin 
                    ? 'bg-gradient-to-r from-blue-900 to-indigo-950 text-white border-blue-600 shadow-md shadow-blue-950/20' 
                    : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        formData.is_admin ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-200 text-slate-600'
                      }`}>
                        <Shield className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-sm font-black ${formData.is_admin ? 'text-white' : 'text-slate-900'}`}>
                            Designate Account as “Admin”
                          </span>
                          {formData.is_admin && (
                            <span className="px-2.5 py-0.5 bg-cyan-500/25 border border-cyan-400/50 text-cyan-200 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
                              Admin • Full Privileges Granted
                            </span>
                          )}
                        </div>
                        <p className={`text-xs mt-0.5 ${formData.is_admin ? 'text-blue-200' : 'text-slate-500'}`}>
                          Grants complete Admin control with full, unrestricted access to all pages (Finance & Payroll, Employee Management, Audit Logs, Settings, Invoices, Bookings, Reports, etc.).
                        </p>
                        {isITAccount && isManagerOrAccountantRole(formData.position, formData.department) && (
                          <p className="text-[11px] font-bold text-emerald-300 mt-1.5 flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 shrink-0" />
                            <span>
                              {isAr
                                ? 'سياسة قسم IT: حسابات المديرين والمحاسبين المضافة بواسطة IT يتم تعيينها تلقائياً كحساب "Admin".'
                                : 'IT Department Policy: Manager & Accountant accounts added by IT are automatically designated as "Admin".'}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={formData.is_admin}
                        onChange={(e) => handleAdminToggle(e.target.checked)}
                        disabled={!editingEmployee && isITAccount && isManagerOrAccountantRole(formData.position, formData.department)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-80"></div>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => handleFormFieldChange({ name: e.target.value })}
                    placeholder="e.g. Ahmed Mohamed"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Login Username *</label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => handleFormFieldChange({ username: e.target.value })}
                    placeholder="e.g. ahmed.mohamed"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Login Password *</label>
                  <input
                    type="text"
                    required={!editingEmployee}
                    value={formData.password}
                    onChange={(e) => handleFormFieldChange({ password: e.target.value })}
                    placeholder={editingEmployee ? "Leave blank to keep same" : "e.g. Secret@123"}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Role / Job Title *</label>
                  <div className="space-y-1.5">
                    <select
                      value={
                        ['Manager', 'Accountant', 'Administrator', 'Sales Executive', 'Sales', 'Reservation Agent', 'Operations', 'Customer Service', 'Office Boy'].includes(formData.position)
                          ? formData.position
                          : 'CUSTOM'
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val !== 'CUSTOM') {
                          handleFormFieldChange({ position: val });
                        } else {
                          handleFormFieldChange({ position: '' });
                        }
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800"
                    >
                      <option value="Manager">Manager {isITAccount ? '(Auto-Admin)' : ''}</option>
                      <option value="Accountant">Accountant {isITAccount ? '(Auto-Admin)' : ''}</option>
                      <option value="Administrator">Administrator (Admin)</option>
                      <option value="Sales Executive">Sales Executive</option>
                      <option value="Sales">Sales</option>
                      <option value="Reservation Agent">Reservation Agent</option>
                      <option value="Operations">Operations</option>
                      <option value="Customer Service">Customer Service</option>
                      <option value="Office Boy">Office Boy (Attendance Only)</option>
                      <option value="CUSTOM">Other / Custom Title...</option>
                    </select>
                    <input
                      type="text"
                      required
                      value={formData.position}
                      onChange={(e) => handleFormFieldChange({ position: e.target.value })}
                      placeholder="e.g. Manager, Accountant, Sales Executive"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 font-medium text-[11px]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    required
                    value={formData.department}
                    onChange={(e) => handleFormFieldChange({ department: e.target.value })}
                    placeholder="e.g. Management, Accounting, Sales"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Monthly Salary (EGP)</label>
                  <input
                    type="number"
                    required
                    value={formData.salary}
                    onChange={(e) => handleFormFieldChange({ salary: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleFormFieldChange({ email: e.target.value })}
                    placeholder="e.g. ahmed@sofiatravel.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => handleFormFieldChange({ phone: e.target.value })}
                    placeholder="e.g. +20 100 123 4567"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Account Status</label>
                  <select
                    value={formData.account_status}
                    onChange={(e) => handleFormFieldChange({ account_status: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800"
                  >
                    <option value="Active">Active (Allowed to Login)</option>
                    <option value="Inactive">Inactive (Disabled Login)</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
              </div>

              {/* Employee Permissions Section */}
              {canManagePermissions && (
              <div className="pt-4 border-t border-slate-200 space-y-4">
                {formData.is_admin ? (
                  <div className="p-4 bg-blue-50 border border-blue-200 text-blue-900 rounded-2xl flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-xs">Administrator Mode Active</p>
                      <p className="text-[11px] text-blue-700">This account has full unrestricted access to all system modules, pages, settings, and records.</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-blue-600" /> Employee Permissions & Module Access
                      </h4>
                      <p className="text-[11px] text-slate-500">Check granular permissions granted to this employee account.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const allIds = PERMISSION_GROUPS.flatMap(g => g.permissions.map(p => p.id));
                          handleFormFieldChange({ permissions: allIds });
                        }}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] cursor-pointer"
                      >
                        Select All Permissions
                      </button>
                      <button
                        type="button"
                        onClick={() => handleFormFieldChange({ permissions: [] })}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-rose-700 font-bold rounded-lg text-[11px] cursor-pointer"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>
                )}

                {/* Grid of Permission Groups */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {PERMISSION_GROUPS.map(group => {
                    const groupPermIds = group.permissions.map(p => p.id);
                    const allSelected = groupPermIds.every(id => formData.permissions.includes(id));
                    return (
                      <div key={group.group} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                          <span className="font-extrabold text-slate-900">{group.group}</span>
                          <div className="space-x-2">
                            <button
                              type="button"
                              onClick={() => handleSelectGroupAll(groupPermIds)}
                              className="text-[10px] text-blue-600 font-bold hover:underline cursor-pointer"
                            >
                              All
                            </button>
                            <span className="text-slate-300">|</span>
                            <button
                              type="button"
                              onClick={() => handleClearGroupAll(groupPermIds)}
                              className="text-[10px] text-rose-600 font-bold hover:underline cursor-pointer"
                            >
                              Clear
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {group.permissions.map(perm => {
                            const isChecked = formData.permissions.includes(perm.id);
                            return (
                              <label key={perm.id} className="flex items-center space-x-2.5 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handlePermissionToggle(perm.id)}
                                  className="w-4 h-4 rounded-sm text-blue-600 border-slate-300 focus:ring-blue-500"
                                />
                                <span className={`text-xs font-medium ${isChecked ? 'text-slate-900 font-bold' : 'text-slate-600'}`}>
                                  {perm.label}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs cursor-pointer flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingEmployee ? 'Update Employee & Permissions' : 'Save & Create Account'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deactivate Account Modal */}
      {showDeactivateModal && employeeToDeactivate && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 text-center">
              {employeeToDeactivate.account_status === 'Active' ? 'Deactivate Employee Account?' : 'Activate Employee Account?'}
            </h3>
            <p className="text-slate-500 text-center leading-relaxed">
              Employee: <strong>{employeeToDeactivate.name}</strong> ({employeeToDeactivate.employee_id})
            </p>
            <p className="text-slate-500 text-center leading-relaxed">
              {employeeToDeactivate.account_status === 'Active' 
                ? 'Deactivating will block login access immediately. All historical records, bookings, payroll, and transactions will be fully preserved.'
                : 'Activating will restore login access based on their assigned permissions.'}
            </p>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Reason / Notes</label>
              <input
                type="text"
                value={deactivateReason}
                onChange={(e) => setDeactivateReason(e.target.value)}
                placeholder="e.g. Resignation, Suspension, Leave of Absence"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowDeactivateModal(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeactivate}
                className={`px-5 py-2 text-white rounded-xl font-bold shadow-xs cursor-pointer ${
                  employeeToDeactivate.account_status === 'Active' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {employeeToDeactivate.account_status === 'Active' ? 'Confirm Deactivation' : 'Confirm Activation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hard Delete Employee Confirmation Modal (No window.confirm) */}
      {employeeToDelete && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 text-center">
              {isAr ? 'حذف حساب الموظف نهائياً؟' : 'Permanently Delete Employee Account?'}
            </h3>
            <p className="text-slate-600 text-center leading-relaxed">
              {isAr ? (
                <>
                  هل أنت متأكد من حذف حساب <strong>{employeeToDelete.name}</strong> ({employeeToDelete.employee_id || employeeToDelete.id})؟ سيتم إلغاء ربطه بالسجلات التاريخية.
                </>
              ) : (
                <>
                  Permanently delete employee <strong>{employeeToDelete.name}</strong> ({employeeToDelete.employee_id || employeeToDelete.id})? Historical records will remain preserved and unlinked.
                </>
              )}
            </p>
            <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setEmployeeToDelete(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = employeeToDelete;
                  setEmployeeToDelete(null);
                  onDeleteEmployee(target.id);
                }}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-xs cursor-pointer"
              >
                {isAr ? 'تأكيد الحذف' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IT Developer Manual Clock-In / Clock-Out Modal */}
      {showAttendanceModal && isITAccount && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-auto text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="px-2 py-0.5 bg-slate-900 text-cyan-300 rounded-md text-[10px] font-extrabold uppercase">
                  IT Developer Account
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  {isAr
                    ? 'إضافة / تعديل وقت حضور أو انصراف موظف يدوياً'
                    : 'Manual Employee Clock-In / Clock-Out Entry'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAttendanceModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleManualAttendanceSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isAr ? 'اختر الموظف *' : 'Select Employee *'}
                  </label>
                  {attendanceRosterOptions.length > 0 ? (
                    <select
                      required
                      value={manualAttForm.employee_id}
                      onChange={(e) => handleManualEmployeeOrDateChange(e.target.value, manualAttForm.date)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-800"
                    >
                      {attendanceRosterOptions.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.name}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      placeholder={isAr ? 'اسم الموظف' : 'Employee Name'}
                      value={manualAttForm.employee_name}
                      onChange={(e) => setManualAttForm(prev => ({
                        ...prev,
                        employee_id: e.target.value,
                        employee_name: e.target.value,
                      }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-800"
                    />
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isAr ? 'التاريخ *' : 'Date *'}
                  </label>
                  <input
                    type="date"
                    required
                    value={manualAttForm.date}
                    onChange={(e) => handleManualEmployeeOrDateChange(manualAttForm.employee_id, e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isAr ? 'وقت الحضور (Clock-In) *' : 'Clock-In Time *'}
                  </label>
                  <input
                    type="time"
                    required
                    value={manualAttForm.clock_in}
                    onChange={(e) => setManualAttForm(prev => ({ ...prev, clock_in: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-mono font-bold text-emerald-700"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isAr ? 'وقت الانصراف (Clock-Out)' : 'Clock-Out Time'}
                  </label>
                  <input
                    type="time"
                    value={manualAttForm.clock_out}
                    onChange={(e) => setManualAttForm(prev => ({ ...prev, clock_out: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-mono font-bold text-blue-700"
                  />
                  <span className="text-[10px] text-slate-400 block mt-1">
                    {isAr
                      ? 'اتركه فارغاً إذا كان الموظف لا يزال على رأس العمل، وسيتم الحساب فور إضافة وقت الانصراف.'
                      : 'Leave empty if employee is still clocked in; hours calculate automatically once clock-out is set.'}
                  </span>
                </div>
              </div>

              {/* Automatic Normal Working Hours Calculation Preview */}
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-emerald-950">
                    {isAr ? 'عدد ساعات العمل المحسوبة تلقائياً:' : 'Automatically Calculated Working Hours:'}
                  </p>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    {manualAttForm.clock_in && manualAttForm.clock_out
                      ? (isAr
                          ? 'محسوبة بنفس المعادلة القياسية لتسجيل الموظف الذاتي'
                          : 'Calculated normally, identical to employee self clock-in/clock-out')
                      : (isAr
                          ? 'سيتم حساب الساعات فور إدخال وقت الانصراف'
                          : 'Working hours will calculate once Clock-Out time is entered')}
                  </p>
                </div>
                <div className="text-end shrink-0">
                  <span className="text-lg font-black text-emerald-700 block">
                    {manualAttForm.clock_in && manualAttForm.clock_out
                      ? previewCalc.working_hours_formatted
                      : '--'}
                  </span>
                  {manualAttForm.clock_in && manualAttForm.clock_out && (
                    <span className="text-[11px] font-bold text-emerald-600">
                      {previewCalc.working_hours.toFixed(2)} {isAr ? 'ساعة' : 'hrs'}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isAr ? 'ملاحظات (اختياري)' : 'Notes (Optional)'}
                </label>
                <input
                  type="text"
                  value={manualAttForm.notes}
                  onChange={(e) => setManualAttForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder={isAr ? 'مثال: إضافة وقت الحضور/الانصراف بواسطة IT' : 'e.g., Manual time entry recorded by IT'}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>

              {manualAttForm.id && onResetAttendanceTime && (() => {
                const matchedRec = attendanceRecords.find(r => r.id === manualAttForm.id);
                if (!matchedRec) return null;
                const hasIn = Boolean((matchedRec.clock_in || matchedRec.check_in_time || '').trim());
                const rawMOut = (matchedRec.clock_out || matchedRec.check_out_time || '').trim();
                const hasOut = Boolean(rawMOut && rawMOut !== '--' && rawMOut !== '-');
                return (
                  <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200 space-y-2.5">
                    <div className="flex items-center gap-1.5 text-amber-900 font-bold">
                      <RotateCcw className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      <span>
                        {isAr
                          ? 'إعادة ضبط الوقت المضاف بالخطأ (للسماح للموظف بالتسجيل بنفسه):'
                          : 'Reset Mistaken Manual Time (Allow Employee to Clock In/Out Normally):'}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {hasIn && (
                        <button
                          type="button"
                          onClick={() => handleConfirmResetTime(matchedRec, 'clock_in')}
                          className="px-3 py-1.5 rounded-xl bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>{isAr ? 'إعادة ضبط وقت الحضور' : 'Reset Clock-In'}</span>
                        </button>
                      )}
                      {hasOut && (
                        <button
                          type="button"
                          onClick={() => handleConfirmResetTime(matchedRec, 'clock_out')}
                          className="px-3 py-1.5 rounded-xl bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>{isAr ? 'إعادة ضبط وقت الانصراف' : 'Reset Clock-Out'}</span>
                        </button>
                      )}
                      {hasIn && hasOut && (
                        <button
                          type="button"
                          onClick={() => handleConfirmResetTime(matchedRec, 'both')}
                          className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>{isAr ? 'إعادة ضبط الحضور والانصراف معاً' : 'Reset Both Times'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAttendanceModal(false)}
                  className="px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{isAr ? 'حفظ وحساب ساعات العمل' : 'Save & Calculate Working Hours'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* IT Reset Clock-In / Clock-Out Time Modal */}
      {resetModalRecord && isITAccount && onResetAttendanceTime && (() => {
        const recIn = (resetModalRecord.clock_in || resetModalRecord.check_in_time || '').trim();
        const rawRecOut = (resetModalRecord.clock_out || resetModalRecord.check_out_time || '').trim();
        const recOut = rawRecOut === '--' || rawRecOut === '-' ? '' : rawRecOut;
        return (
          <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-[10px] font-extrabold uppercase">
                    {isAr ? 'إعادة ضبط بواسطة IT' : 'IT Time Reset'}
                  </span>
                  <h3 className="text-base font-black text-slate-900 mt-1">
                    {isAr
                      ? 'إعادة ضبط وقت الحضور أو الانصراف'
                      : 'Reset Employee Clock-In / Clock-Out Time'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setResetModalRecord(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-semibold">{isAr ? 'الموظف:' : 'Employee:'}</span>
                  <span className="font-black text-slate-900">{resetModalRecord.employee_name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-semibold">{isAr ? 'التاريخ:' : 'Date:'}</span>
                  <span className="font-mono font-bold text-slate-800">{resetModalRecord.date}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-semibold">{isAr ? 'وقت الحضور الحالي:' : 'Current Clock-In:'}</span>
                  <span className="font-mono font-bold text-emerald-700">{recIn || (isAr ? 'غير مسجل' : 'Not set')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-semibold">{isAr ? 'وقت الانصراف الحالي:' : 'Current Clock-Out:'}</span>
                  <span className="font-mono font-bold text-blue-700">{recOut || (isAr ? 'غير مسجل' : 'Not set')}</span>
                </div>
              </div>

              <p className="text-slate-600 leading-relaxed">
                {isAr
                  ? 'اختر الوقت الذي تمت إضافته بالخطأ لإعادة ضبطه، وسيتمكن الموظف فوراً من تسجيل الحضور أو الانصراف بنفسه بشكل طبيعي:'
                  : 'Select which time entry was added by mistake to reset it. The employee will immediately be able to clock in or clock out normally:'}
              </p>

              <div className="space-y-2.5">
                {recIn && (
                  <button
                    type="button"
                    onClick={() => handleConfirmResetTime(resetModalRecord, 'clock_in')}
                    className="w-full p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 font-bold flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <RotateCcw className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>
                        {isAr
                          ? `إعادة ضبط وقت الحضور (${recIn})`
                          : `Reset Clock-In Time (${recIn})`}
                      </span>
                    </span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-white text-emerald-700 border border-emerald-200">
                      {isAr ? 'يسمح بتسجيل الحضور' : 'Allows Clock-In'}
                    </span>
                  </button>
                )}

                {recOut && (
                  <button
                    type="button"
                    onClick={() => handleConfirmResetTime(resetModalRecord, 'clock_out')}
                    className="w-full p-3 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-900 font-bold flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <RotateCcw className="w-4 h-4 text-blue-700 shrink-0" />
                      <span>
                        {isAr
                          ? `إعادة ضبط وقت الانصراف (${recOut})`
                          : `Reset Clock-Out Time (${recOut})`}
                      </span>
                    </span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-white text-blue-700 border border-blue-200">
                      {isAr ? 'يسمح بتسجيل الانصراف' : 'Allows Clock-Out'}
                    </span>
                  </button>
                )}

                {recIn && recOut && (
                  <button
                    type="button"
                    onClick={() => handleConfirmResetTime(resetModalRecord, 'both')}
                    className="w-full p-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold flex items-center justify-between cursor-pointer transition-colors shadow-xs"
                  >
                    <span className="flex items-center gap-2">
                      <RotateCcw className="w-4 h-4 shrink-0" />
                      <span>
                        {isAr
                          ? 'إعادة ضبط وقتي الحضور والانصراف معاً'
                          : 'Reset Both Clock-In & Clock-Out'}
                      </span>
                    </span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-amber-800 text-amber-100">
                      {isAr ? 'إعادة ضبط كاملة' : 'Full Reset'}
                    </span>
                  </button>
                )}
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setResetModalRecord(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
