import React, { useState, useEffect, useMemo, useRef } from 'react';

import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { CustomersView } from './components/CustomersView';
import { VouchersView } from './components/VouchersView';
import { ServicesView } from './components/ServicesView';
import { ReservationsView } from './components/ReservationsView';
import { TourPackagesView } from './components/TourPackagesView';
import { HotelsView } from './components/HotelsView';
import { FlightsView } from './components/FlightsView';
import { SuppliersView } from './components/SuppliersView';
import { FinanceView } from './components/FinanceView';
import { InvoicesView } from './components/InvoicesView';
import { EmployeesView } from './components/EmployeesView';
import { AttendanceDepartureView } from './components/AttendanceDepartureView';
import { CalendarView } from './components/CalendarView';
import { TasksView } from './components/TasksView';
import { DocumentsView } from './components/DocumentsView';
import { ReportsView } from './components/ReportsView';
import { NotificationsView } from './components/NotificationsView';
import { SettingsView } from './components/SettingsView';
import { ActivityLogView } from './components/ActivityLogView';
import { FinancePayrollView } from './components/FinancePayrollView';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { AiAssistantModal } from './components/AiAssistantModal';
import { LoginModal } from './components/LoginModal';
import { CustomerInquiriesView } from './components/CustomerInquiriesView';
import { PermissionRequestsView } from './components/PermissionRequestsView';
import { PermissionModal } from './components/PermissionModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { MobileQuickActionModal } from './components/MobileQuickActionModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { NavigationLoader } from './components/NavigationLoader';
import { UpdateNoticeBanner } from './components/UpdateNoticeBanner';
import { APP_VERSION } from './utils/appVersion';
import { AdminResetDataModal } from './components/AdminResetDataModal';
import { DatabaseConnectionStatus } from './lib/firebase';
import { isManagerOrAccountantRole, isEmployeeDesignatedAdmin } from './utils/adminDesignation';
import { 
  UserRole, 
  Customer, 
  Reservation, 
  TourPackage, 
  Hotel, 
  Flight, 
  Supplier, 
  CustomerPayment, 
  SupplierPayment, 
  Expense, 
  Employee, 
  EmployeePosition, 
  Task, 
  TravelDocument, 
  NotificationItem, 
  CompanySettings, 
  ActivityLog, 
  Invoice, 
  PermissionRequest, 
  PayrollRecord, 
  EmployeeAdvance, 
  CommissionRecord, 
  FinanceAuditLog,
  Voucher,
  VisaService,
  TransferService,
  CruiseService,
  TourService,
  DayTripService,
  CustomerInquiry,
  AttendanceRecord,
  WorkSchedule,
  AttendanceSettings
} from './types';
import { dataService } from './services/dataService';
import { convertCurrency } from './utils/currency';
import {
  applyAttendancePolicy,
  calculateWorkingHours,
  extractAttendanceAndLoginLogs,
  getLocalDateYYYYMMDD,
  isAttendanceShiftOpen,
  isITDeveloperAccount,
  normalizeAttendanceRecord,
  normalizeTimeHHMM,
  resolveEmployeeScheduleForAttendance,
} from './utils/attendance';
import { SiteMaintenanceOverlay, ITMaintenanceControlModal } from './components/SiteMaintenanceOverlay';
import { useLanguage } from './context/LanguageContext';
import { Wrench, Power, BellRing, X, ArrowUp } from 'lucide-react';
import {
  PhoneNotificationSupportStatus,
  enableEmployeePhoneNotifications,
  ensurePushServiceWorkerReady,
  getPhoneNotificationSupportStatus,
  isNotificationReadByUser,
  isNotificationVisibleToUser,
  resolveEmployeeDesignatedSchedule,
  showPhoneNotificationViaSW,
  sortNotificationsNewestFirst,
  syncExistingEmployeePushSubscription,
} from './services/pushNotificationService';

import { isTabAllowedForUser, normalizePermissions } from './utils/permissions';

export default function App() {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [userRole, setUserRole] = useState<UserRole>(() => {
    return (localStorage.getItem('sofia_travel_role') as UserRole) || 'Administrator';
  });
  const [currentUsername, setCurrentUsername] = useState<string>(() => {
    return localStorage.getItem('sofia_travel_user') || 'Admin';
  });
  const [currentEmpId, setCurrentEmpId] = useState<string>(() => {
    return localStorage.getItem('sofia_travel_emp_id') || '';
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('sofia_travel_auth') !== 'false';
  });
  const [currentCurrency, setCurrentCurrency] = useState<string>('EGP');
  const [isITSiteModalOpen, setIsITSiteModalOpen] = useState(false);
  const [showITLoginFromMaintenance, setShowITLoginFromMaintenance] = useState(false);
  const [phonePermStatus, setPhonePermStatus] = useState<PhoneNotificationSupportStatus>(() =>
    getPhoneNotificationSupportStatus()
  );
  const [pushBannerDismissed, setPushBannerDismissed] = useState<boolean>(false);
  const [isActivatingBannerPush, setIsActivatingBannerPush] = useState<boolean>(false);
  const seenNotificationIdsRef = useRef<Set<string> | null>(null);
  const localReminderKeysRef = useRef<Set<string>>(new Set());

  // Selected package for booking flow auto-population
  const [selectedBookingPackage, setSelectedBookingPackage] = useState<TourPackage | null>(null);

  // Selected reservation for invoice flow auto-population
  const [selectedReservationForInvoice, setSelectedReservationForInvoice] = useState<(Reservation & { targetRecipientType?: 'Customer' | 'Supplier' }) | null>(null);

  const handleTransferReservationToInvoice = (reservation: Reservation, targetRecipientType?: 'Customer' | 'Supplier') => {
    setSelectedReservationForInvoice({
      ...reservation,
      targetRecipientType: targetRecipientType || 'Customer'
    });
    setCurrentTab('invoices');
  };

  // Modals & status state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isAdminResetModalOpen, setIsAdminResetModalOpen] = useState(false);
  const [dbStatus, setDbStatus] = useState<DatabaseConnectionStatus | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => (prev === msg ? null : prev));
    }, 4500);
  };

  // Data states
  const [stats, setStats] = useState<any>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerInquiries, setCustomerInquiries] = useState<CustomerInquiry[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [visas, setVisas] = useState<VisaService[]>([]);
  const [transfers, setTransfers] = useState<TransferService[]>([]);
  const [cruises, setCruises] = useState<CruiseService[]>([]);
  const [tours, setTours] = useState<TourService[]>([]);
  const [dayTrips, setDayTrips] = useState<DayTripService[]>([]);
  const [packages, setPackages] = useState<TourPackage[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customerPayments, setCustomerPayments] = useState<CustomerPayment[]>([]);
  const [supplierPayments, setSupplierPayments] = useState<SupplierPayment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [advances, setAdvances] = useState<EmployeeAdvance[]>([]);
  const [commissions, setCommissions] = useState<CommissionRecord[]>([]);
  const [financeAuditLogs, setFinanceAuditLogs] = useState<FinanceAuditLog[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [documents, setDocuments] = useState<TravelDocument[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [settings, setSettings] = useState<CompanySettings>({
    company_name: "Sofia Travel",
    logo: "/sofia-logo.png",
    address: "124 Tahrir Square, Cairo",
    phone: "+20 2 25750000",
    whatsapp: "+20 100 123 4567",
    email: "operations@sofiatravel.com",
    website: "",
    tax_number: "TR-98765",
    manager_title: "Authorized Manager & Finance Director",
    default_currency: "EGP",
    invoice_prefix: "INV-",
    reservation_prefix: "RES-",
    payment_methods: ["Cash", "Bank Transfer", "Credit Card"],
    exchange_rates: []
  });
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [rawAttendanceRecords, setRawAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [workSchedules, setWorkSchedules] = useState<WorkSchedule[]>([]);
  const [attendanceSettings, setAttendanceSettings] = useState<AttendanceSettings | null>(null);
  const [permissionRequests, setPermissionRequests] = useState<PermissionRequest[]>([]);
  const [permissionModalState, setPermissionModalState] = useState<{
    isOpen: boolean;
    actionType: 'Edit' | 'Delete';
    moduleName: string;
    itemId: string;
    itemName: string;
    proposedChanges?: any;
  }>({
    isOpen: false,
    actionType: 'Delete',
    moduleName: '',
    itemId: '',
    itemName: ''
  });

  const currentEmployee = useMemo(() => {
    if (currentEmpId) {
      const byId = employees.find(e => e.id === currentEmpId || e.employee_id === currentEmpId);
      if (byId) return byId;
    }
    const byUsername = employees.find(e => e.username === currentUsername);
    if (byUsername) return byUsername;
    return employees.find(e => e.name === currentUsername);
  }, [employees, currentEmpId, currentUsername]);

  const isITAccount = isITDeveloperAccount(currentUsername, currentEmpId, currentEmployee);
  const isCurrentAdmin =
    isITAccount ||
    isEmployeeDesignatedAdmin(currentEmployee);
  const employeeRecordRole: UserRole =
    currentEmployee &&
    ['Manager', 'Accountant', 'Operations', 'Customer Service', 'Sales'].includes(
      String(currentEmployee.position || '')
    )
      ? (currentEmployee.position as UserRole)
      : 'Sales';
  // A persisted "Administrator" role must never outlive the employee record that granted it.
  const effectiveUserRole: UserRole = isCurrentAdmin
    ? 'Administrator'
    : userRole === 'Administrator'
      ? employeeRecordRole
      : userRole;
  const currentUserPermissions = useMemo(
    () => (isCurrentAdmin ? [] : normalizePermissions(currentEmployee?.permissions)),
    [isCurrentAdmin, currentEmployee]
  );

  useEffect(() => {
    if (!isAuthenticated) return;
    if (isCurrentAdmin && userRole !== 'Administrator') {
      setUserRole('Administrator');
      try {
        localStorage.setItem('sofia_travel_role', 'Administrator');
      } catch {}
    } else if (currentEmployee && !isCurrentAdmin && userRole === 'Administrator') {
      setUserRole(employeeRecordRole);
      try {
        localStorage.setItem('sofia_travel_role', employeeRecordRole);
      } catch {}
    }
  }, [isAuthenticated, isCurrentAdmin, currentEmployee, employeeRecordRole, userRole]);

  // Permission Guard Watchdog: If an administrator revokes an employee's access to the active page tab, immediately redirect them to the Dashboard
  useEffect(() => {
    if (isAuthenticated && !isCurrentAdmin && !isITAccount && currentTab !== 'dashboard') {
      const allowed = isTabAllowedForUser(
        currentTab,
        effectiveUserRole,
        currentUserPermissions,
        isCurrentAdmin,
        isITAccount
      );
      if (!allowed) {
        setCurrentTab('dashboard');
        showToast(
          isAr
            ? 'تم إلغاء صلاحيتك للوصول لهذه الصفحة بواسطة الإدارة.'
            : 'Access to this page has been revoked by an administrator.'
        );
      }
    }
  }, [
    currentTab,
    isAuthenticated,
    isCurrentAdmin,
    isITAccount,
    effectiveUserRole,
    currentUserPermissions,
    isAr,
  ]);

  // Merge & normalize attendance records and employee login/logout logs retrieved from Firestore
  const attendanceLoginLogs = useMemo(
    () => extractAttendanceAndLoginLogs(activityLogs, financeAuditLogs, employees),
    [activityLogs, financeAuditLogs, employees]
  );

  const attendanceRecords = useMemo(
    () =>
      rawAttendanceRecords.map(rec => {
        const normalized = normalizeAttendanceRecord(rec, employees, attendanceLoginLogs);
        const schedule = resolveEmployeeScheduleForAttendance(
          {
            id: normalized.employee_id,
            employee_id: normalized.employee_id,
            name: normalized.employee_name,
          },
          workSchedules,
          attendanceSettings,
          normalized.date
        );
        return applyAttendancePolicy(normalized, schedule, {
          trackTardiness: attendanceSettings?.track_tardiness === true,
        });
      }),
    [rawAttendanceRecords, employees, attendanceLoginLogs, workSchedules, attendanceSettings]
  );

  const isAuthorizedToDirectlyModify = isCurrentAdmin || effectiveUserRole === 'Manager' || effectiveUserRole === 'Accountant';

  // Hard gate for the rendered view: a revoked tab is blocked even before the watchdog redirect runs.
  const isCurrentTabRevoked =
    isAuthenticated &&
    !isCurrentAdmin &&
    !isITAccount &&
    currentTab !== 'dashboard' &&
    currentTab !== 'attendance' &&
    !isTabAllowedForUser(
      currentTab,
      effectiveUserRole,
      currentUserPermissions,
      isCurrentAdmin,
      isITAccount
    );

  // Helper to log employee entries immediately so Management sees live website activity on the Dashboard
  const recordEmployeeActivity = async (action: string, moduleName: string, recordRef: string) => {
    const now = new Date();
    const actorName = currentEmployee?.name || currentUsername || 'Employee';
    const isITManualAction =
      isITAccount || actorName.trim().toUpperCase() === 'IT';
    const newLog: ActivityLog = {
      id: 'LOG-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
      user_name: isITManualAction ? 'IT' : actorName,
      action: isITManualAction ? `[IT Manual] ${action}` : action,
      module: moduleName,
      record: recordRef,
      date: now.toISOString().split('T')[0],
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actor_role: isITManualAction ? 'IT Developer' : effectiveUserRole,
      entry_source: isITManualAction ? 'IT Manual' : 'Employee',
      createdAt: now.toISOString()
    };
    setActivityLogs(prev => [newLog, ...prev]);
    try {
      await dataService.saveDocument('activity_logs', newLog.id, newLog);
    } catch {}
  };

  // Real-time Cloud Firestore subscriptions + initial fetch on mount for instant cross-device Dashboard & Maintenance sync
  useEffect(() => {
    dataService.verifyConnection().then(setDbStatus).catch(() => {});
    fetchAllData();

    const unsubscribers = [
      dataService.subscribeDocument<CompanySettings>('settings', 'company_settings', settings, (docData) => {
        if (docData) {
          setSettings(prev => {
            const merged = { ...prev, ...docData };
            if (/instagram\.com/i.test(String(merged.website || ''))) merged.website = '';
            merged.instagram_url = undefined;
            return merged;
          });
        }
      }),
      dataService.subscribeCollection<Customer>('customers', setCustomers),
      dataService.subscribeCollection<CustomerInquiry>('customer_inquiries', setCustomerInquiries),
      dataService.subscribeCollection<Reservation>('reservations', setReservations),
      dataService.subscribeCollection<Voucher>('vouchers', setVouchers),
      dataService.subscribeCollection<Invoice>('invoices', setInvoices),
      dataService.subscribeCollection<VisaService>('visas', setVisas),
      dataService.subscribeCollection<TransferService>('transfers', setTransfers),
      dataService.subscribeCollection<CruiseService>('cruises', setCruises),
      dataService.subscribeCollection<TourService>('tours', setTours),
      dataService.subscribeCollection<DayTripService>('day_trips', setDayTrips),
      dataService.subscribeCollection<TourPackage>('tour_packages', setPackages),
      dataService.subscribeCollection<Hotel>('hotels', setHotels),
      dataService.subscribeCollection<Flight>('flights', setFlights),
      dataService.subscribeCollection<Supplier>('suppliers', setSuppliers),
      dataService.subscribeCollection<CustomerPayment>('customer_payments', setCustomerPayments),
      dataService.subscribeCollection<SupplierPayment>('supplier_payments', setSupplierPayments),
      dataService.subscribeCollection<Expense>('expenses', setExpenses),
      dataService.subscribeCollection<Employee>('employees', setEmployees),
      dataService.subscribeCollection<Task>('tasks', setTasks),
      dataService.subscribeCollection<TravelDocument>('documents', setDocuments),
      dataService.subscribeCollection<NotificationItem>('notifications', setNotifications),
      dataService.subscribeCollection<ActivityLog>('activity_logs', setActivityLogs),
      dataService.subscribeCollection<PermissionRequest>('permission_requests', setPermissionRequests),
      dataService.subscribeCollection<PayrollRecord>('payroll_records', setPayrollRecords),
      dataService.subscribeCollection<EmployeeAdvance>('employee_advances', setAdvances),
      dataService.subscribeCollection<CommissionRecord>('commission_records', setCommissions),
      dataService.subscribeCollection<FinanceAuditLog>('finance_audit_logs', setFinanceAuditLogs),
      dataService.subscribeMergedAttendance<AttendanceRecord>(setRawAttendanceRecords),
      dataService.subscribeCollection<WorkSchedule>('work_schedules', setWorkSchedules),
      dataService.subscribeDocument<AttendanceSettings>(
        'attendance_settings',
        'main',
        {
          id: 'main',
          default_start_time: '10:00',
          default_end_time: '18:00',
          default_grace_period_minutes: 0,
          track_tardiness: false,
          show_system_login_time: false,
          calendar_reminder_time: '09:00',
        },
        setAttendanceSettings
      ),
    ];

    const onWindowFocus = () => {
      dataService.verifyConnection().then(setDbStatus).catch(() => {});
    };
    window.addEventListener('focus', onWindowFocus);

    return () => {
      unsubscribers.forEach(unsub => {
        try { unsub(); } catch {}
      });
      window.removeEventListener('focus', onWindowFocus);
    };
  }, []);

  // Reactive Dashboard Synchronization: Automatically recompute management metrics whenever ANY website data or currency changes
  useEffect(() => {
    const normalizeCurr = (code?: string) => {
      const c = String(code || 'USD').trim().toUpperCase();
      if (c === '$' || c === 'US$') return 'USD';
      if (c === '€') return 'EUR';
      if (c === '£') return 'GBP';
      if (c === 'ج.م' || c === 'LE') return 'EGP';
      return c || 'USD';
    };

    const targetCurr = normalizeCurr(currentCurrency || 'EGP');
    const ratesList = settings?.exchange_rates || [];
    const egpRule = ratesList.find(r => normalizeCurr(r.currency) === 'EGP');
    // Server default rates are units per 1 USD (e.g. EGP: 48.5, EUR: 0.92), whereas EGP-base rates have EGP: 1, USD: 50
    const isUnitsPerUSD = !egpRule || Number(egpRule.rate_to_usd) > 5;

    const fallbackPerUSD: Record<string, number> = {
      USD: 1.0,
      EGP: 50.0,
      EUR: 0.92,
      GBP: 0.79,
      SAR: 3.75,
      AED: 3.67,
    };

    const convertAmount = (amount: number, fromCode?: string): number => {
      const num = Number(amount) || 0;
      if (num === 0) return 0;
      const from = normalizeCurr(fromCode);
      if (from === targetCurr) return num;

      if (isUnitsPerUSD) {
        const fromEntry = ratesList.find(r => normalizeCurr(r.currency) === from);
        const toEntry = ratesList.find(r => normalizeCurr(r.currency) === targetCurr);
        const fromPerUSD = (fromEntry && Number(fromEntry.rate_to_usd) > 0) ? Number(fromEntry.rate_to_usd) : (fallbackPerUSD[from] || 1);
        const toPerUSD = (toEntry && Number(toEntry.rate_to_usd) > 0) ? Number(toEntry.rate_to_usd) : (fallbackPerUSD[targetCurr] || 1);
        return (num / fromPerUSD) * toPerUSD;
      } else {
        const fromEntry = ratesList.find(r => normalizeCurr(r.currency) === from);
        const toEntry = ratesList.find(r => normalizeCurr(r.currency) === targetCurr);
        const fromInBase = (fromEntry && Number(fromEntry.rate_to_usd) > 0) ? Number(fromEntry.rate_to_usd) : (50 / (fallbackPerUSD[from] || 1));
        const toInBase = (toEntry && Number(toEntry.rate_to_usd) > 0) ? Number(toEntry.rate_to_usd) : (50 / (fallbackPerUSD[targetCurr] || 1));
        return (num * fromInBase) / toInBase;
      }
    };

    // 1. Combine reservations + non-duplicate vouchers + standalone customer-booked tourism services
    const seenBookingRefs = new Set<string>();
    reservations.forEach(r => {
      if (r.id) seenBookingRefs.add(r.id);
      if (r.reservation_id) seenBookingRefs.add(r.reservation_id);
      if (r.voucher_number) seenBookingRefs.add(r.voucher_number);
    });

    const extraVouchersAsOps = vouchers.filter(
      v => !seenBookingRefs.has(v.id) && !seenBookingRefs.has(v.reservation_id || '') && !seenBookingRefs.has(v.voucher_number || '')
    );
    extraVouchersAsOps.forEach(v => {
      if (v.id) seenBookingRefs.add(v.id);
      if (v.voucher_number) seenBookingRefs.add(v.voucher_number);
      if (v.reservation_id) seenBookingRefs.add(v.reservation_id);
    });

    // Include standalone client service entries (Flights, Visas, Hotels, Transfers, Cruises, Tours, Day Trips) linked to a customer/passenger
    const standaloneServiceBookings: any[] = [];
    flights.forEach((f: any) => {
      if ((f.customer_id || f.customer_name || (f.passenger && f.passenger !== 'Guest')) && !seenBookingRefs.has(f.id)) {
        standaloneServiceBookings.push({
          id: f.id,
          reservation_id: f.booking_reference || f.id,
          customer_name: f.customer_name || f.passenger,
          service_type: 'Flight',
          destination: f.arrival_airport || 'Flight',
          booking_date: f.createdAt ? String(f.createdAt).split('T')[0] : f.departure_date,
          travel_date: f.departure_date,
          selling_price: Number(f.selling_price) || 0,
          cost_price: Number(f.ticket_cost) || 0,
          paid_amount: Number(f.selling_price) || 0,
          remaining_amount: 0,
          currency: f.currency || 'USD',
          employee_name: f.employee_name || '',
          reservation_status: f.status === 'Cancelled' ? 'Cancelled' : 'Confirmed',
          createdAt: f.createdAt || f.updatedAt || f.departure_date
        });
      }
    });
    visas.forEach((vs: any) => {
      if ((vs.customer_id || vs.customer_name) && !seenBookingRefs.has(vs.id)) {
        standaloneServiceBookings.push({
          id: vs.id,
          reservation_id: vs.id,
          customer_name: vs.customer_name,
          service_type: 'Visa',
          destination: vs.country,
          booking_date: vs.createdAt ? String(vs.createdAt).split('T')[0] : new Date().toISOString().split('T')[0],
          travel_date: vs.travel_date || '',
          selling_price: Number(vs.selling_price) || 0,
          cost_price: Number(vs.cost_price) || 0,
          paid_amount: Number(vs.selling_price) || 0,
          remaining_amount: 0,
          currency: vs.currency || 'USD',
          employee_name: vs.employee_name || '',
          reservation_status: vs.status === 'Inactive' ? 'Pending' : 'Confirmed',
          createdAt: vs.createdAt || vs.updatedAt
        });
      }
    });

    const combinedBookings: any[] = [
      ...reservations.map((r: any) => ({
        ...r,
        createdAt: r.createdAt || r.updatedAt || r.booking_date || r.issue_date
      })),
      ...extraVouchersAsOps.map((v: any) => ({
        id: v.id,
        reservation_id: v.voucher_number || v.reservation_id || v.id,
        customer_name: v.customer_name,
        service_type: v.service_category,
        destination: v.destination,
        booking_date: v.issue_date,
        travel_date: v.travel_date,
        selling_price: v.selling_price,
        cost_price: v.cost_price,
        paid_amount: v.paid_amount,
        remaining_amount: v.remaining_amount,
        currency: v.currency,
        employee_name: v.employee_name,
        reservation_status: v.reservation_status || (v.status === 'Cancelled' ? 'Cancelled' : 'Confirmed'),
        createdAt: v.createdAt || v.updatedAt || v.issue_date
      })),
      ...standaloneServiceBookings
    ].map(b => ({
      ...b,
      display_selling_price: Math.round(convertAmount(Number(b.selling_price) || 0, b.currency))
    }));

    const activeResvs = combinedBookings.filter(
      r => r.reservation_status === 'Confirmed' || r.reservation_status === 'Pending' || r.reservation_status === 'Paid' || r.reservation_status === 'Partially Paid'
    );
    const todayStr = new Date().toISOString().split('T')[0];
    const todaysResvCount = combinedBookings.filter(r => r.booking_date === todayStr).length;
    const upcomingTripsCount = combinedBookings.filter(r => r.travel_date && r.travel_date >= todayStr).length;

    const nonCancelledBookings = combinedBookings.filter(r => r.reservation_status !== 'Cancelled');

    // Prevent double-counting between Invoices and Bookings
    const invoicedReservationRefs = new Set<string>();
    const supplierInvoicedRefs = new Set<string>();
    const activeCustomerInvoices = invoices.filter(
      inv => inv.payment_status !== 'Cancelled' && (inv.recipient_type || 'Customer') === 'Customer'
    );
    const activeSupplierInvoices = invoices.filter(
      inv => inv.payment_status !== 'Cancelled' && inv.recipient_type === 'Supplier'
    );

    activeCustomerInvoices.forEach(inv => {
      if (inv.reservation_id) invoicedReservationRefs.add(inv.reservation_id);
      (inv.items || []).forEach(it => {
        if (it.item_reference_id) invoicedReservationRefs.add(it.item_reference_id);
      });
    });
    activeSupplierInvoices.forEach(inv => {
      if (inv.reservation_id) supplierInvoicedRefs.add(inv.reservation_id);
      (inv.items || []).forEach(it => {
        if (it.item_reference_id) supplierInvoicedRefs.add(it.item_reference_id);
      });
    });

    const uninvoicedCustomerBookings = nonCancelledBookings.filter(
      r => !invoicedReservationRefs.has(r.id) && !invoicedReservationRefs.has(r.reservation_id)
    );
    const uninvoicedSupplierBookings = nonCancelledBookings.filter(
      r => !supplierInvoicedRefs.has(r.id) && !supplierInvoicedRefs.has(r.reservation_id)
    );

    const salesConverted =
      activeCustomerInvoices.reduce((acc, inv) => acc + convertAmount(Number(inv.total_amount) || 0, inv.currency), 0) +
      uninvoicedCustomerBookings.reduce((acc, r) => acc + convertAmount(Number(r.selling_price) || 0, r.currency), 0);

    const supplierCostsConverted =
      activeSupplierInvoices.reduce((acc, inv) => acc + convertAmount(Number(inv.total_amount) || 0, inv.currency), 0) +
      uninvoicedSupplierBookings.reduce((acc, r) => acc + convertAmount(Number(r.cost_price) || 0, r.currency), 0);

    const expensesConverted = expenses.reduce((acc, e) => acc + convertAmount(Number(e.amount) || 0, e.currency), 0);
    const payrollBaseConverted = payrollRecords.reduce((acc, p) => {
      const baseCost = Math.max(0, (Number(p.basic_salary) || 0) + (Number(p.allowances) || 0) + (Number(p.bonus) || 0) - (Number(p.deductions) || 0));
      return acc + convertAmount(baseCost, p.currency || 'EGP');
    }, 0);
    const commissionsConverted = commissions.reduce((acc, c) => acc + convertAmount(Number(c.commission_amount) || 0, c.currency || 'EGP'), 0);

    const netProfitConverted = salesConverted - supplierCostsConverted - expensesConverted - payrollBaseConverted - commissionsConverted;

    // Outstanding Receivables & Payables (synchronized across bookings, invoices, customers & suppliers)
    const outstandingByCurr: Record<string, number> = {};
    let bookingOutstandingConverted = 0;

    activeCustomerInvoices.forEach(inv => {
      const bal = Number(inv.balance_due ?? ((Number(inv.total_amount) || 0) - (Number(inv.paid_amount) || 0)));
      if (bal > 0) {
        const curr = normalizeCurr(inv.currency);
        outstandingByCurr[curr] = (outstandingByCurr[curr] || 0) + bal;
        bookingOutstandingConverted += convertAmount(bal, curr);
      }
    });

    uninvoicedCustomerBookings.forEach(r => {
      const rem = Number(r.remaining_amount ?? ((Number(r.selling_price) || 0) - (Number(r.paid_amount) || 0)));
      if (rem > 0) {
        const curr = normalizeCurr(r.currency);
        outstandingByCurr[curr] = (outstandingByCurr[curr] || 0) + rem;
        bookingOutstandingConverted += convertAmount(rem, curr);
      }
    });

    const customerProfileBalancesConverted = customers.reduce(
      (acc, c) => acc + convertAmount(Number(c.outstanding_balance) || 0, c.currency),
      0
    );
    if (Object.keys(outstandingByCurr).length === 0) {
      customers.forEach(c => {
        const bal = Number(c.outstanding_balance) || 0;
        if (bal > 0) {
          const curr = normalizeCurr(c.currency);
          outstandingByCurr[curr] = (outstandingByCurr[curr] || 0) + bal;
        }
      });
    }

    const supplierInvoicesUnpaidConverted = invoices
      .filter(inv => inv.recipient_type === 'Supplier' && inv.payment_status !== 'Cancelled')
      .reduce((acc, inv) => {
        const bal = Number(inv.balance_due ?? ((Number(inv.total_amount) || 0) - (Number(inv.paid_amount) || 0)));
        return acc + (bal > 0 ? convertAmount(bal, inv.currency) : 0);
      }, 0);

    const supplierProfileBalancesConverted = suppliers.reduce(
      (acc, s) => acc + convertAmount(Number(s.outstanding_balance) || 0, s.currency),
      0
    );

    const outstandingCustomerTotal = Math.round(Math.max(customerProfileBalancesConverted, bookingOutstandingConverted));
    const outstandingSupplierTotal = Math.round(Math.max(supplierProfileBalancesConverted, supplierInvoicesUnpaidConverted));

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentYear = new Date().getFullYear();
    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      month: monthNames[i],
      Sales: 0,
      Expenses: 0,
      Profit: 0
    }));

    activeCustomerInvoices.forEach(inv => {
      if (!inv.issue_date) return;
      const date = new Date(inv.issue_date);
      if (!isNaN(date.getTime()) && date.getFullYear() === currentYear) {
        const monthIdx = date.getMonth();
        monthlyData[monthIdx].Sales += Math.round(convertAmount(Number(inv.total_amount) || 0, inv.currency));
      }
    });
    activeSupplierInvoices.forEach(inv => {
      if (!inv.issue_date) return;
      const date = new Date(inv.issue_date);
      if (!isNaN(date.getTime()) && date.getFullYear() === currentYear) {
        const monthIdx = date.getMonth();
        monthlyData[monthIdx].Expenses += Math.round(convertAmount(Number(inv.total_amount) || 0, inv.currency));
      }
    });
    uninvoicedCustomerBookings.forEach(r => {
      if (!r.booking_date) return;
      const date = new Date(r.booking_date);
      if (!isNaN(date.getTime()) && date.getFullYear() === currentYear) {
        const monthIdx = date.getMonth();
        monthlyData[monthIdx].Sales += Math.round(convertAmount(Number(r.selling_price) || 0, r.currency));
      }
    });
    uninvoicedSupplierBookings.forEach(r => {
      if (!r.booking_date) return;
      const date = new Date(r.booking_date);
      if (!isNaN(date.getTime()) && date.getFullYear() === currentYear) {
        const monthIdx = date.getMonth();
        monthlyData[monthIdx].Expenses += Math.round(convertAmount(Number(r.cost_price) || 0, r.currency));
      }
    });
    expenses.forEach(e => {
      if (!e.date) return;
      const date = new Date(e.date);
      if (!isNaN(date.getTime()) && date.getFullYear() === currentYear) {
        const monthIdx = date.getMonth();
        monthlyData[monthIdx].Expenses += Math.round(convertAmount(Number(e.amount) || 0, e.currency));
      }
    });
    monthlyData.forEach(m => {
      m.Profit = m.Sales - m.Expenses;
    });

    const destCounts: Record<string, number> = {};
    nonCancelledBookings.forEach(r => {
      if (r.destination) {
        destCounts[r.destination] = (destCounts[r.destination] || 0) + 1;
      }
    });
    const totalDest = Object.values(destCounts).reduce((a, b) => a + b, 0);
    const destinationPopularity = Object.entries(destCounts)
      .map(([name, count]) => ({
        name,
        percentage: totalDest > 0 ? Math.round((count / totalDest) * 100) : 0
      }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 3);

    const agentSales: Record<string, number> = {};
    nonCancelledBookings.forEach(r => {
      if (r.employee_name) {
        agentSales[r.employee_name] = (agentSales[r.employee_name] || 0) + convertAmount(Number(r.selling_price) || 0, r.currency);
      }
    });
    let topAgent = { name: "No data", sales: 0 };
    for (const [name, sVal] of Object.entries(agentSales)) {
      if (sVal > topAgent.sales) {
        topAgent = { name, sales: Math.round(sVal) };
      }
    }

    const totalServicesCount =
      visas.length + flights.length + hotels.length + transfers.length + cruises.length + tours.length + dayTrips.length;

    const localTodayStr = getLocalDateYYYYMMDD();
    const todayAttendance = attendanceRecords.filter(a => a.date === localTodayStr || a.date === todayStr);
    const clockedInCount = attendanceRecords.filter(a => isAttendanceShiftOpen(a)).length;
    const todayWorkingHours = Math.round(todayAttendance.reduce((acc, a) => acc + (Number(a.working_hours) || 0), 0) * 100) / 100;

    // Sort newest entries first so Management immediately sees the latest employee entries
    const sortedRecentReservations = [...combinedBookings].sort((a, b) => {
      const tA = new Date(a.updatedAt || a.createdAt || a.booking_date || 0).getTime() || 0;
      const tB = new Date(b.updatedAt || b.createdAt || b.booking_date || 0).getTime() || 0;
      return tB - tA;
    });

    const sortedRecentActivities = [...activityLogs].sort((a: any, b: any) => {
      const tA = new Date(a.createdAt || `${a.date || ''} ${a.time || ''}`).getTime() || 0;
      const tB = new Date(b.createdAt || `${b.date || ''} ${b.time || ''}`).getTime() || 0;
      return tB - tA;
    });

    setStats({
      total_customers: customers.length,
      total_vouchers: vouchers.length,
      total_inquiries: customerInquiries.length,
      new_inquiries: customerInquiries.filter(i => i.status === 'New Inquiry').length,
      total_invoices: invoices.length,
      total_services: totalServicesCount,
      clocked_in_count: clockedInCount,
      today_working_hours: todayWorkingHours,
      active_reservations: activeResvs.length,
      todays_reservations: todaysResvCount,
      upcoming_trips: upcomingTripsCount,
      total_sales: Math.round(salesConverted),
      total_expenses: Math.round(expensesConverted),
      net_profit: Math.round(netProfitConverted),
      outstanding_customer_payments: outstandingCustomerTotal,
      outstanding_supplier_payments: outstandingSupplierTotal,
      outstanding_by_currency: outstandingByCurr,
      today_tasks: tasks.filter(t => t.status !== 'Completed').length,
      recent_reservations: sortedRecentReservations.slice(0, 8),
      recent_payments: [...customerPayments].slice(-5).reverse(),
      recent_activities: sortedRecentActivities.slice(0, 10),
      monthlyData,
      destinationPopularity,
      topAgent
    });
  }, [
    customers,
    customerInquiries,
    reservations,
    vouchers,
    invoices,
    visas,
    transfers,
    cruises,
    tours,
    dayTrips,
    packages,
    hotels,
    flights,
    suppliers,
    customerPayments,
    supplierPayments,
    expenses,
    payrollRecords,
    advances,
    commissions,
    tasks,
    attendanceRecords,
    activityLogs,
    currentCurrency,
    settings
  ]);

  const handleVerifyDatabase = async () => {
    const status = await dataService.verifyConnection();
    setDbStatus(status);
    await fetchAllData();
    if (status.connected) {
      showToast(`Cloud Firestore synced (${status.latencyMs ?? 0}ms)`);
    } else {
      showToast('Using offline cache — Cloud Firestore temporarily unreachable');
    }
  };

  const fetchAllData = async () => {
    try {
      const [
        custRes,
        resvRes,
        vouchRes,
        visaRes,
        transRes,
        cruiseRes,
        tourRes,
        dayTripRes,
        pkgRes,
        hotelRes,
        flightRes,
        supRes,
        invRes,
        cPayRes,
        sPayRes,
        expRes,
        empRes,
        taskRes,
        docRes,
        notifRes,
        settRes,
        logRes,
        pReqRes,
        payrollRes,
        advRes,
        commRes,
        fAuditRes,
        inqRes,
        attRes,
        wsRes,
        attSettRes
      ] = await Promise.all([
        dataService.getCollection<Customer>('customers', '/api/customers', customers),
        dataService.getCollection<Reservation>('reservations', '/api/reservations', reservations),
        dataService.getCollection<Voucher>('vouchers', '/api/vouchers', vouchers),
        dataService.getCollection<VisaService>('visas', '/api/visas', visas),
        dataService.getCollection<TransferService>('transfers', '/api/transfers', transfers),
        dataService.getCollection<CruiseService>('cruises', '/api/cruises', cruises),
        dataService.getCollection<TourService>('tours', '/api/tours', tours),
        dataService.getCollection<DayTripService>('day_trips', '/api/day-trips', dayTrips),
        dataService.getCollection<TourPackage>('tour_packages', '/api/tour-packages', packages),
        dataService.getCollection<Hotel>('hotels', '/api/hotels', hotels),
        dataService.getCollection<Flight>('flights', '/api/flights', flights),
        dataService.getCollection<Supplier>('suppliers', '/api/suppliers', suppliers),
        dataService.getCollection<Invoice>('invoices', '/api/invoices', invoices),
        dataService.getCollection<CustomerPayment>('customer_payments', '/api/customer-payments', customerPayments),
        dataService.getCollection<SupplierPayment>('supplier_payments', '/api/supplier-payments', supplierPayments),
        dataService.getCollection<Expense>('expenses', '/api/expenses', expenses),
        dataService.getCollection<Employee>('employees', '/api/employees', employees),
        dataService.getCollection<Task>('tasks', '/api/tasks', tasks),
        dataService.getCollection<TravelDocument>('documents', '/api/documents', documents),
        dataService.getCollection<NotificationItem>('notifications', '/api/notifications', notifications),
        dataService.getDocument<CompanySettings>('settings', 'company_settings', '/api/settings', settings),
        dataService.getCollection<ActivityLog>('activity_logs', '/api/activity-logs', activityLogs),
        dataService.getCollection<PermissionRequest>('permission_requests', '/api/permission-requests', permissionRequests),
        dataService.getCollection<PayrollRecord>('payroll_records', '/api/payroll-records', payrollRecords),
        dataService.getCollection<EmployeeAdvance>('employee_advances', '/api/employee-advances', advances),
        dataService.getCollection<CommissionRecord>('commission_records', '/api/commission-records', commissions),
        dataService.getCollection<FinanceAuditLog>('finance_audit_logs', '/api/finance-audit-logs', financeAuditLogs),
        dataService.getCollection<CustomerInquiry>('customer_inquiries', '/api/customer-inquiries', customerInquiries),
        dataService.getMergedAttendanceRecords<AttendanceRecord>(rawAttendanceRecords),
        dataService.getCollection<WorkSchedule>('work_schedules', '/api/work-schedules', workSchedules),
        dataService.getDocument<AttendanceSettings>(
          'attendance_settings',
          'main',
          '/api/attendance-settings',
          attendanceSettings || { id: 'main', default_start_time: '10:00', default_end_time: '18:00', default_grace_period_minutes: 0 }
        )
      ]);

      setCustomers(custRes || []);
      setCustomerInquiries(inqRes || []);
      setReservations(resvRes || []);
      setVouchers(vouchRes || []);
      setVisas(visaRes || []);
      setTransfers(transRes || []);
      setCruises(cruiseRes || []);
      setTours(tourRes || []);
      setDayTrips(dayTripRes || []);
      setPackages(pkgRes || []);
      setHotels(hotelRes || []);
      setFlights(flightRes || []);
      setSuppliers(supRes || []);
      setInvoices(invRes || []);
      setCustomerPayments(cPayRes || []);
      setSupplierPayments(sPayRes || []);
      setExpenses(expRes || []);
      setEmployees(empRes || []);
      setTasks(taskRes || []);
      setDocuments(docRes || []);
      setNotifications(notifRes || []);
      if (settRes) {
        const sanitized: CompanySettings = { ...settRes };
        if (/instagram\.com/i.test(String(sanitized.website || ''))) sanitized.website = '';
        sanitized.instagram_url = undefined;
        setSettings(sanitized);
      }
      setActivityLogs(logRes || []);
      setPermissionRequests(pReqRes || []);
      setPayrollRecords(payrollRes || []);
      setAdvances(advRes || []);
      setCommissions(commRes || []);
      setFinanceAuditLogs(fAuditRes || []);
      setRawAttendanceRecords(attRes || []);
      setWorkSchedules(wsRes || []);
      if (attSettRes) setAttendanceSettings(attSettRes);

    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  // Permission Handlers
  const handleSubmitPermissionRequest = async (
    moduleName: string,
    itemId: string,
    itemName: string,
    actionType: 'Edit' | 'Delete',
    reason: string,
    proposedChanges?: any
  ) => {
    const newReqId = "REQ-" + Math.random().toString(36).substring(2, 7).toUpperCase();
    const newReq: PermissionRequest = {
      id: newReqId,
      request_id: "PR-" + Math.floor(1000 + Math.random() * 9000),
      employee_id: currentUsername,
      employee_name: currentUsername,
      employee_role: userRole,
      module: moduleName,
      item_id: itemId,
      item_name: itemName,
      action_type: actionType,
      reason,
      proposed_changes: proposedChanges,
      status: 'Pending',
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    setPermissionRequests(prev => [newReq, ...prev]);

    try {
      const res = await fetch('/api/permission-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReq)
      });
      if (!res.ok) {
        await dataService.saveDocument('permission_requests', newReqId, newReq, '/api/permission-requests', 'POST');
      }
    } catch (e) {
      console.warn("API request save failed, using direct Firestore fallback:", e);
      await dataService.saveDocument('permission_requests', newReqId, newReq, '/api/permission-requests', 'POST');
    }
    dataService.clearLocalCache();
    await fetchAllData();
  };

  const handleApprovePermissionRequest = async (id: string) => {
    try {
      const res = await fetch(`/api/permission-requests/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewer_name: currentUsername })
      });
      if (res.ok) {
        const approvedReq = await res.json();
        setPermissionRequests(prev => prev.map(r => (r.id === id || r.request_id === id) ? approvedReq : r));
      } else {
        console.warn("Approval API endpoint returned error status, performing direct fallback...");
        const req = permissionRequests.find(r => r.id === id || r.request_id === id);
        if (req) {
          const updatedReq: PermissionRequest = {
            ...req,
            status: 'Approved',
            reviewed_by: currentUsername,
            reviewed_at: new Date().toISOString().replace('T', ' ').substring(0, 16)
          };
          await dataService.saveDocument('permission_requests', req.id, updatedReq, `/api/permission-requests/${req.id}/approve`, 'POST');
          setPermissionRequests(prev => prev.map(r => (r.id === id || r.request_id === id) ? updatedReq : r));

          const colMap: Record<string, string> = {
            'Customers': 'customers', 'Customer': 'customers',
            'Reservations': 'reservations', 'Reservation': 'reservations',
            'Vouchers': 'vouchers', 'Voucher': 'vouchers', 'Customer Vouchers': 'vouchers',
            'Invoices': 'invoices', 'Invoice': 'invoices',
            'Suppliers': 'suppliers', 'Supplier': 'suppliers',
            'Employees': 'employees', 'Employee': 'employees',
            'Tour Packages': 'tour_packages', 'Packages': 'tour_packages',
            'Hotels': 'hotels', 'Flights': 'flights', 'Visas': 'visas', 'Transfers': 'transfers',
            'Cruises': 'cruises', 'Tours': 'tours', 'Day Trips': 'day_trips',
            'Tasks': 'tasks', 'Documents': 'documents', 'Expenses': 'expenses',
            'Customer Payments': 'customer_payments', 'Supplier Payments': 'supplier_payments',
            'Customer Inquiries': 'customer_inquiries', 'Inquiries': 'customer_inquiries'
          };
          const targetCol = colMap[req.module] || req.module.toLowerCase().replace(/\s+/g, '_');
          if (targetCol) {
            if (req.action_type === 'Delete') {
              await dataService.deleteDocument(targetCol, req.item_id);
              if (targetCol === 'vouchers') {
                await dataService.deleteDocument('reservations', req.item_id);
              }
            } else if (req.action_type === 'Edit' && req.proposed_changes) {
              await dataService.saveDocument(targetCol, req.item_id, req.proposed_changes, undefined, 'PUT');
              if (targetCol === 'vouchers') {
                await dataService.saveDocument('reservations', req.item_id, req.proposed_changes, undefined, 'PUT');
              }
            }
          }
        }
      }
    } catch (e) {
      console.error("Failed to call approval API, running client direct fallback:", e);
      const req = permissionRequests.find(r => r.id === id || r.request_id === id);
      if (req) {
        const updatedReq: PermissionRequest = {
          ...req,
          status: 'Approved',
          reviewed_by: currentUsername,
          reviewed_at: new Date().toISOString().replace('T', ' ').substring(0, 16)
        };
        await dataService.saveDocument('permission_requests', req.id, updatedReq);
        setPermissionRequests(prev => prev.map(r => (r.id === id || r.request_id === id) ? updatedReq : r));

        const colMap: Record<string, string> = {
          'Customers': 'customers', 'Customer': 'customers',
          'Reservations': 'reservations', 'Reservation': 'reservations',
          'Vouchers': 'vouchers', 'Voucher': 'vouchers', 'Customer Vouchers': 'vouchers',
          'Invoices': 'invoices', 'Invoice': 'invoices',
          'Suppliers': 'suppliers', 'Supplier': 'suppliers',
          'Employees': 'employees', 'Employee': 'employees',
          'Tour Packages': 'tour_packages', 'Packages': 'tour_packages',
          'Hotels': 'hotels', 'Flights': 'flights', 'Visas': 'visas', 'Transfers': 'transfers',
          'Cruises': 'cruises', 'Tours': 'tours', 'Day Trips': 'day_trips',
          'Tasks': 'tasks', 'Documents': 'documents', 'Expenses': 'expenses',
          'Customer Payments': 'customer_payments', 'Supplier Payments': 'supplier_payments',
          'Customer Inquiries': 'customer_inquiries', 'Inquiries': 'customer_inquiries'
        };
        const targetCol = colMap[req.module] || req.module.toLowerCase().replace(/\s+/g, '_');
        if (targetCol) {
          if (req.action_type === 'Delete') {
            await dataService.deleteDocument(targetCol, req.item_id);
          } else if (req.action_type === 'Edit' && req.proposed_changes) {
            await dataService.saveDocument(targetCol, req.item_id, req.proposed_changes, undefined, 'PUT');
          }
        }
      }
    }
    dataService.clearLocalCache();
    await fetchAllData();
  };

  const handleRejectPermissionRequest = async (id: string, reason?: string) => {
    try {
      const res = await fetch(`/api/permission-requests/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewer_name: currentUsername, rejection_reason: reason })
      });
      if (res.ok) {
        const rejectedReq = await res.json();
        setPermissionRequests(prev => prev.map(r => (r.id === id || r.request_id === id) ? rejectedReq : r));
      } else {
        const req = permissionRequests.find(r => r.id === id || r.request_id === id);
        if (req) {
          const updatedReq: PermissionRequest = {
            ...req,
            status: 'Rejected',
            reviewed_by: currentUsername,
            reviewed_at: new Date().toISOString().replace('T', ' ').substring(0, 16),
            rejection_reason: reason || 'Not approved'
          };
          await dataService.saveDocument('permission_requests', req.id, updatedReq);
          setPermissionRequests(prev => prev.map(r => (r.id === id || r.request_id === id) ? updatedReq : r));
        }
      }
    } catch (e) {
      console.error("Failed to call rejection API, running fallback:", e);
      const req = permissionRequests.find(r => r.id === id || r.request_id === id);
      if (req) {
        const updatedReq: PermissionRequest = {
          ...req,
          status: 'Rejected',
          reviewed_by: currentUsername,
          reviewed_at: new Date().toISOString().replace('T', ' ').substring(0, 16),
          rejection_reason: reason || 'Not approved'
        };
        await dataService.saveDocument('permission_requests', req.id, updatedReq);
        setPermissionRequests(prev => prev.map(r => (r.id === id || r.request_id === id) ? updatedReq : r));
      }
    }
    dataService.clearLocalCache();
    await fetchAllData();
  };

  // CRUD Handlers with RBAC Permission Intercepts and Dual Cloud Persistence
  const handleAddInvoice = async (data: Partial<Invoice>) => {
    const newId = "INV-" + Math.random().toString(36).substring(2, 7).toUpperCase();
    
    let maxSeq = 1000;
    invoices.forEach(inv => {
      const match = String(inv.invoice_number || '').match(/INV-2026-(\d+)/i);
      if (match) {
        const val = parseInt(match[1], 10);
        if (val > maxSeq) maxSeq = val;
      }
    });
    const nextSeq = maxSeq + 1;
    const invSerial = data.invoice_number || `INV-2026-${nextSeq}`;

    const linkedVoucher = data.reservation_id ? vouchers.find(v => v.id === data.reservation_id || v.reservation_id === data.reservation_id) : null;
    const linkedCust = data.customer_id ? customers.find(c => c.id === data.customer_id || c.customer_id === data.customer_id) : null;
    const derivedFileNum = data.file_number || linkedVoucher?.file_number || linkedCust?.file_number || `FILE-2026-${String(nextSeq).padStart(4, '0')}`;
    const newInvoice: Invoice = {
      id: newId,
      invoice_number: invSerial,
      file_number: derivedFileNum,
      issue_date: data.issue_date || new Date().toISOString().split('T')[0],
      due_date: data.due_date || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      currency: data.currency || "USD",
      items: data.items || [],
      subtotal: data.subtotal || 0,
      discount: data.discount || 0,
      tax_rate: data.tax_rate || 0,
      tax_amount: data.tax_amount || 0,
      total_amount: data.total_amount || 0,
      paid_amount: data.paid_amount || 0,
      balance_due: data.balance_due || 0,
      payment_status: data.payment_status || "Unpaid",
      manager_name: data.manager_name || currentUsername || "Admin",
      customer_id: data.customer_id || linkedVoucher?.customer_id || "",
      customer_name: data.customer_name || linkedVoucher?.customer_name || "",
      recipient_type: data.recipient_type || "Customer",
      ...data
    };
    setInvoices(prev => [newInvoice, ...prev]);
    await dataService.saveDocument('invoices', newId, newInvoice, '/api/invoices', 'POST');
    await recordEmployeeActivity(
      `Issued ${newInvoice.recipient_type || 'Customer'} Invoice ${newInvoice.invoice_number} for ${newInvoice.customer_name || newInvoice.supplier_name || 'Client'}`,
      'Invoices',
      newInvoice.invoice_number
    );

    // If invoice is linked to a reservation, update the reservation's invoice link
    if (newInvoice.reservation_id) {
      const targetRes = reservations.find(r => r.id === newInvoice.reservation_id || r.reservation_id === newInvoice.reservation_id);
      if (targetRes) {
        const updateData: Partial<Reservation> = {};
        if (newInvoice.recipient_type === 'Supplier') {
          updateData.supplier_invoice_id = newInvoice.id;
          updateData.supplier_invoice_number = newInvoice.invoice_number;
        } else {
          updateData.customer_invoice_id = newInvoice.id;
          updateData.customer_invoice_number = newInvoice.invoice_number;
        }
        await handleUpdateReservation(targetRes.id, updateData);
      }
    }

    fetchAllData();
    return newInvoice;
  };

  const handleUpdateInvoice = async (id: string, data: Partial<Invoice>) => {
    const inv = invoices.find(i => i.id === id);
    const itemName = inv ? `Invoice ${inv.invoice_number}` : id;
    if (!isAuthorizedToDirectlyModify) {
      setPermissionModalState({
        isOpen: true,
        actionType: 'Edit',
        moduleName: 'Invoices',
        itemId: id,
        itemName,
        proposedChanges: data
      });
      return;
    }
    const updated = { ...inv, ...data, id };
    setInvoices(prev => prev.map(i => (i.id === id ? (updated as Invoice) : i)));
    await dataService.saveDocument('invoices', id, updated, `/api/invoices/${id}`, 'PUT');
    fetchAllData();
  };

  const handleDeleteInvoice = async (id: string) => {
    const inv = invoices.find(i => i.id === id);
    const itemName = inv ? `Invoice ${inv.invoice_number}` : id;
    if (!isAuthorizedToDirectlyModify) {
      setPermissionModalState({
        isOpen: true,
        actionType: 'Delete',
        moduleName: 'Invoices',
        itemId: id,
        itemName
      });
      return;
    }
    setInvoices(prev => prev.filter(i => i.id !== id));
    await dataService.deleteDocument('invoices', id, `/api/invoices/${id}`);
    fetchAllData();
  };

  const handleAddCustomer = async (data: Partial<Customer>) => {
    const newId = "CUST-" + Math.random().toString(36).substring(2, 7).toUpperCase();
    const custCount = (customers?.length || 0) + 101;
    const fileNum = data.file_number || `FILE-2026-${String(custCount + 900).padStart(4, '0')}`;
    const newCust: Customer = {
      id: newId,
      customer_id: `C-${custCount}`,
      file_number: fileNum,
      full_name: data.full_name || "New Client",
      passport_number: data.passport_number || "",
      nationality: data.nationality || "Egyptian",
      date_of_birth: data.date_of_birth || "1990-01-01",
      gender: data.gender || "Male",
      phone: data.phone || "",
      whatsapp_number: data.whatsapp_number || "",
      email: data.email || "",
      address: data.address || "",
      notes: data.notes || "",
      customer_type: data.customer_type || "Individual",
      registration_date: new Date().toISOString().split('T')[0],
      outstanding_balance: 0,
      currency: data.currency || "USD",
      ...data
    };
    setCustomers(prev => [newCust, ...prev]);
    await dataService.saveDocument('customers', newId, newCust, '/api/customers', 'POST');
    await recordEmployeeActivity(`Added new customer ${newCust.full_name}`, 'Customers', newCust.customer_id);
    fetchAllData();
  };

  const handleUpdateCustomer = async (id: string, data: Partial<Customer>) => {
    const cust = customers.find(c => c.id === id);
    const itemName = cust ? `${cust.full_name} (${cust.customer_id})` : id;
    if (!isAuthorizedToDirectlyModify) {
      setPermissionModalState({
        isOpen: true,
        actionType: 'Edit',
        moduleName: 'Customers',
        itemId: id,
        itemName,
        proposedChanges: data
      });
      return;
    }
    const updated = { ...cust, ...data, id };
    setCustomers(prev => prev.map(c => (c.id === id ? (updated as Customer) : c)));
    await dataService.saveDocument('customers', id, updated, `/api/customers/${id}`, 'PUT');
    fetchAllData();
  };

  const handleDeleteCustomer = async (id: string) => {
    const cust = customers.find(c => c.id === id);
    const itemName = cust ? `${cust.full_name} (${cust.customer_id})` : id;
    if (!isAuthorizedToDirectlyModify) {
      setPermissionModalState({
        isOpen: true,
        actionType: 'Delete',
        moduleName: 'Customers',
        itemId: id,
        itemName
      });
      return;
    }
    setCustomers(prev => prev.filter(c => c.id !== id));
    await dataService.deleteDocument('customers', id, `/api/customers/${id}`);
    fetchAllData();
  };

  const handleLogCustomerCommunication = async (
    customerId: string, 
    communication: { employee_name: string; channel: string; notes: string; outcome?: string; date?: string }
  ) => {
    try {
      const res = await fetch(`/api/customers/${customerId}/log-communication`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-acting-user': communication.employee_name || currentUsername
        },
        body: JSON.stringify(communication)
      });
      if (res.ok) {
        const updatedCust = await res.json();
        setCustomers(prev => prev.map(c => c.id === customerId ? updatedCust : c));
        fetchAllData();
      }
    } catch (err) {
      console.error("Failed to log customer communication:", err);
    }
  };

  // ---------------- Customer Inquiries Handlers ----------------
  const handleSaveInquiry = async (inquiryData: Partial<CustomerInquiry>) => {
    const isEdit = Boolean(inquiryData.id);
    const inqId = inquiryData.id || ("INQ-" + Math.random().toString(36).substring(2, 8).toUpperCase());
    const now = new Date().toISOString();

    if (isEdit && !isAuthorizedToDirectlyModify) {
      setPermissionModalState({
        isOpen: true,
        actionType: 'Edit',
        moduleName: 'Customer Inquiries',
        itemId: inquiryData.id!,
        itemName: inquiryData.name || inquiryData.id!,
        proposedChanges: inquiryData
      });
      return;
    }

    const savedInquiry: CustomerInquiry = {
      id: inqId,
      inquiry_code: inquiryData.inquiry_code || ("INQ-2026-" + Math.floor(1000 + Math.random() * 9000)),
      name: inquiryData.name || "Inquiring Prospect",
      gender: inquiryData.gender || "Male",
      phone: inquiryData.phone || "",
      inquiry_source: inquiryData.inquiry_source || "WhatsApp",
      inquired_service: inquiryData.inquired_service || "General Inquiry",
      assigned_representative: inquiryData.assigned_representative || currentUsername,
      status: inquiryData.status || "New Inquiry",
      priority: inquiryData.priority || "Medium",
      created_at: inquiryData.created_at || now,
      last_updated: now,
      follow_up_history: inquiryData.follow_up_history || [],
      ...inquiryData
    };

    if (isEdit) {
      setCustomerInquiries(prev => prev.map(i => i.id === inqId ? savedInquiry : i));
      await dataService.saveDocument('customer_inquiries', inqId, savedInquiry, `/api/customer-inquiries/${inqId}`, 'PUT');
      await recordEmployeeActivity(`Updated inquiry for ${savedInquiry.name} (${savedInquiry.status})`, 'Customer Inquiries', savedInquiry.inquiry_code);
    } else {
      setCustomerInquiries(prev => [savedInquiry, ...prev]);
      await dataService.saveDocument('customer_inquiries', inqId, savedInquiry, '/api/customer-inquiries', 'POST');
      await recordEmployeeActivity(`Entered new inquiry from ${savedInquiry.name} (${savedInquiry.inquired_service})`, 'Customer Inquiries', savedInquiry.inquiry_code);
    }
    fetchAllData();
  };

  const handleDeleteInquiry = async (id: string, name: string) => {
    if (!isAuthorizedToDirectlyModify) {
      setPermissionModalState({
        isOpen: true,
        actionType: 'Delete',
        moduleName: 'Customer Inquiries',
        itemId: id,
        itemName: name || id
      });
      return;
    }
    setCustomerInquiries(prev => prev.filter(i => i.id !== id));
    await dataService.deleteDocument('customer_inquiries', id, `/api/customer-inquiries/${id}`);
    fetchAllData();
  };

  const handleLogFollowUp = async (inquiryId: string, followUp: { representative_name: string; channel: string; outcome: string; notes: string; next_followup_date?: string; new_status?: any }) => {
    try {
      const res = await fetch(`/api/customer-inquiries/${inquiryId}/follow-up`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-acting-user': currentUsername
        },
        body: JSON.stringify(followUp)
      });
      if (res.ok) {
        const updated = await res.json();
        setCustomerInquiries(prev => prev.map(i => i.id === inquiryId ? updated : i));
      }
    } catch (e) {
      console.error("Error logging follow-up:", e);
    }
    fetchAllData();
  };

  const handleConvertToCustomer = async (inquiry: CustomerInquiry) => {
    try {
      const res = await fetch(`/api/customer-inquiries/${inquiry.id}/convert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-acting-user': currentUsername
        },
        body: JSON.stringify(inquiry)
      });
      if (res.ok) {
        const result = await res.json();
        if (result.customer) {
          setCustomers(prev => [result.customer, ...prev]);
        }
        if (result.inquiry) {
          setCustomerInquiries(prev => prev.map(i => i.id === inquiry.id ? result.inquiry : i));
        }
        showToast(`Successfully converted ${inquiry.name} to registered customer (${result.customer?.customer_id || 'CRM'})!`);
      }
    } catch (e) {
      console.error("Error converting inquiry to customer:", e);
    }
    fetchAllData();
  };

  // ---------------- Vouchers & Services Handlers ----------------
  const handleAddVoucher = async (data: Partial<Voucher>) => {
    const newId = "VCH-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    const vchCount = (vouchers?.length || 0) + 101;
    const sellPrice = Number(data.selling_price) || 0;
    const costPrice = Number(data.cost_price) || 0;
    const paidAmt = Number(data.paid_amount) || 0;
    const vchPrefix = settings?.voucher_prefix || 'VCH-2026-';
    const linkedCust = data.customer_id ? customers.find(c => c.id === data.customer_id || c.customer_id === data.customer_id) : null;
    const fileNum = data.file_number || linkedCust?.file_number || `FILE-2026-${String(vchCount + 900).padStart(4, '0')}`;

    const newVoucher: Voucher = {
      id: newId,
      voucher_number: data.voucher_number || `${vchPrefix}${vchCount}`,
      file_number: fileNum,
      reservation_id: data.reservation_id || `${vchPrefix}${vchCount}`,
      customer_id: data.customer_id || '',
      customer_name: data.customer_name || 'Valued Client',
      customer_phone: data.customer_phone || '',
      customer_email: data.customer_email || '',
      service_category: data.service_category || 'Tour Package',
      service_title: data.service_title || 'Tourism Service',
      destination: data.destination || 'Egypt',
      travel_date: data.travel_date || new Date().toISOString().split('T')[0],
      return_date: data.return_date || '',
      issue_date: data.issue_date || new Date().toISOString().split('T')[0],
      valid_until: data.valid_until || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      number_of_travelers: Number(data.number_of_travelers) || 1,
      adults_count: Number(data.adults_count) || 1,
      children_count: Number(data.children_count) || 0,
      infants_count: Number(data.infants_count) || 0,
      employee_id: currentEmployee?.id || currentUsername || 'Admin',
      employee_name: currentEmployee?.name || currentUsername || 'Admin',
      selling_price: sellPrice,
      cost_price: costPrice,
      paid_amount: paidAmt,
      remaining_amount: Math.max(0, sellPrice - paidAmt),
      profit: sellPrice - costPrice,
      currency: data.currency || 'USD',
      payment_method: data.payment_method || 'Cash',
      payment_status: paidAmt >= sellPrice ? 'Paid' : paidAmt > 0 ? 'Partially Paid' : 'Pending',
      status: data.status || 'Draft',
      reservation_status: data.status === 'Converted to Trip/Service' ? 'Confirmed' : 'Pending',
      itinerary_or_details: data.itinerary_or_details || '',
      inclusions: data.inclusions || [],
      exclusions: data.exclusions || [],
      terms_conditions: data.terms_conditions || '',
      installment_details: data.installment_details || null,
      ...data
    };

    setVouchers(prev => [newVoucher, ...prev]);
    await dataService.saveDocument('vouchers', newId, newVoucher, '/api/vouchers', 'POST');
    await recordEmployeeActivity(
      `Created voucher ${newVoucher.voucher_number} for ${newVoucher.customer_name} (${newVoucher.service_category})`,
      'Vouchers',
      newVoucher.voucher_number
    );
    fetchAllData();
  };

  const handleUpdateVoucher = async (id: string, data: Partial<Voucher>) => {
    const existing = vouchers.find(v => v.id === id);
    const itemName = existing ? `Voucher ${existing.voucher_number || existing.id} (${existing.customer_name})` : id;
    if (!isAuthorizedToDirectlyModify) {
      setPermissionModalState({
        isOpen: true,
        actionType: 'Edit',
        moduleName: 'Customer Vouchers',
        itemId: id,
        itemName,
        proposedChanges: data
      });
      return;
    }
    const updated = {
      ...existing,
      ...data,
      id,
      remaining_amount: (Number(data.selling_price ?? existing?.selling_price) || 0) - (Number(data.paid_amount ?? existing?.paid_amount) || 0),
      profit: (Number(data.selling_price ?? existing?.selling_price) || 0) - (Number(data.cost_price ?? existing?.cost_price) || 0)
    };
    setVouchers(prev => prev.map(v => (v.id === id ? (updated as Voucher) : v)));
    await dataService.saveDocument('vouchers', id, updated, `/api/vouchers/${id}`, 'PUT');
    fetchAllData();
  };

  const handleDeleteVoucher = async (id: string) => {
    const existing = vouchers.find(v => v.id === id);
    const itemName = existing ? `Voucher ${existing.voucher_number || existing.id} (${existing.customer_name})` : id;
    if (!isAuthorizedToDirectlyModify) {
      setPermissionModalState({
        isOpen: true,
        actionType: 'Delete',
        moduleName: 'Customer Vouchers',
        itemId: id,
        itemName
      });
      return;
    }
    setVouchers(prev => prev.filter(v => v.id !== id));
    await dataService.deleteDocument('vouchers', id, `/api/vouchers/${id}`);
    fetchAllData();
  };

  const handleSendVoucher = async (id: string, channel: 'WhatsApp' | 'Email' | 'Print', notes?: string) => {
    try {
      const resp = await fetch(`/api/vouchers/${id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel, notes })
      });
      if (resp.ok) {
        const data = await resp.json();
        setVouchers(prev => prev.map(v => (v.id === id ? data.voucher : v)));
      }
    } catch (err) {
      console.error('Failed to send voucher:', err);
      // Client-side fallback
      setVouchers(prev => prev.map(v => v.id === id ? {
        ...v,
        status: 'Sent',
        sent_to_customer_at: new Date().toISOString(),
        sent_via: channel,
        customer_send_notes: notes
      } : v));
    }
    fetchAllData();
  };

  const handleConvertVoucher = async (id: string, trip_title?: string, notes?: string) => {
    try {
      const resp = await fetch(`/api/vouchers/${id}/convert-to-trip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trip_title, notes })
      });
      if (resp.ok) {
        const data = await resp.json();
        setVouchers(prev => prev.map(v => (v.id === id ? data.voucher : v)));
      }
    } catch (err) {
      console.error('Failed to convert voucher:', err);
      setVouchers(prev => prev.map(v => v.id === id ? {
        ...v,
        status: 'Converted to Trip/Service',
        reservation_status: 'Confirmed',
        converted_at: new Date().toISOString(),
        confirmed_at: new Date().toISOString(),
        converted_trip_title: trip_title || v.service_title
      } : v));
    }
    fetchAllData();
  };

  // Tourism Services CRUD Handlers
  const handleAddVisa = async (data: Partial<VisaService>) => {
    const newId = "VISA-" + Math.random().toString(36).substring(2, 7).toUpperCase();
    const newVisa: VisaService = {
      id: newId,
      country: data.country || 'Egypt',
      visa_title: data.visa_title || 'Tourist Visa',
      visa_type: data.visa_type || 'Tourist',
      entry_type: data.entry_type || 'Single Entry',
      processing_time: data.processing_time || '3-5 Business Days',
      validity_duration: data.validity_duration || '30 Days',
      embassy_consular_fee: Number(data.embassy_consular_fee) || 0,
      agency_fee: Number(data.agency_fee) || 0,
      cost_price: Number(data.cost_price) || 0,
      selling_price: Number(data.selling_price) || 0,
      currency: data.currency || 'USD',
      status: data.status || 'Active',
      submission_method: data.submission_method || 'Online E-Visa',
      required_documents: data.required_documents || [],
      ...data
    };
    setVisas(prev => [newVisa, ...prev]);
    await dataService.saveDocument('visas', newId, newVisa, '/api/visas', 'POST');
    await recordEmployeeActivity(`Added visa service: ${newVisa.visa_title} (${newVisa.country})`, 'Visas', newId);
    fetchAllData();
  };

  const handleUpdateVisa = async (id: string, data: Partial<VisaService>) => {
    const existing = visas.find(v => v.id === id);
    const itemName = existing ? `Visa: ${existing.visa_title} (${existing.country})` : id;
    if (!isAuthorizedToDirectlyModify) {
      setPermissionModalState({
        isOpen: true,
        actionType: 'Edit',
        moduleName: 'Visas',
        itemId: id,
        itemName,
        proposedChanges: data
      });
      return;
    }
    const updated = { ...existing, ...data, id };
    setVisas(prev => prev.map(v => (v.id === id ? (updated as VisaService) : v)));
    await dataService.saveDocument('visas', id, updated, `/api/visas/${id}`, 'PUT');
    fetchAllData();
  };

  const handleDeleteVisa = async (id: string) => {
    const existing = visas.find(v => v.id === id);
    const itemName = existing ? `Visa: ${existing.visa_title} (${existing.country})` : id;
    if (!isAuthorizedToDirectlyModify) {
      setPermissionModalState({
        isOpen: true,
        actionType: 'Delete',
        moduleName: 'Visas',
        itemId: id,
        itemName
      });
      return;
    }
    setVisas(prev => prev.filter(v => v.id !== id));
    await dataService.deleteDocument('visas', id, `/api/visas/${id}`);
    fetchAllData();
  };

  const handleAddTransfer = async (data: Partial<TransferService>) => {
    const newId = "TRF-" + Math.random().toString(36).substring(2, 7).toUpperCase();
    const newTrf: TransferService = {
      id: newId,
      service_title: data.service_title || 'Airport Transfer',
      vehicle_type: data.vehicle_type || 'Sedan / Limousine (1-3 Pax)',
      transfer_type: data.transfer_type || 'Airport Pickup',
      pickup_location: data.pickup_location || 'Cairo Airport',
      dropoff_location: data.dropoff_location || 'Downtown Hotel',
      max_passengers: Number(data.max_passengers) || 3,
      max_luggage: Number(data.max_luggage) || 3,
      cost_price: Number(data.cost_price) || 0,
      selling_price: Number(data.selling_price) || 0,
      currency: data.currency || 'USD',
      status: data.status || 'Active',
      meet_and_greet: data.meet_and_greet ?? true,
      includes_tolls: data.includes_tolls ?? true,
      amenities: data.amenities || [],
      ...data
    };
    setTransfers(prev => [newTrf, ...prev]);
    await dataService.saveDocument('transfers', newId, newTrf, '/api/transfers', 'POST');
    await recordEmployeeActivity(`Added transfer service: ${newTrf.service_title}`, 'Transfers', newId);
    fetchAllData();
  };

  const handleUpdateTransfer = async (id: string, data: Partial<TransferService>) => {
    const existing = transfers.find(t => t.id === id);
    const itemName = existing ? `Transfer: ${existing.service_title}` : id;
    if (!isAuthorizedToDirectlyModify) {
      setPermissionModalState({
        isOpen: true,
        actionType: 'Edit',
        moduleName: 'Transfers',
        itemId: id,
        itemName,
        proposedChanges: data
      });
      return;
    }
    const updated = { ...existing, ...data, id };
    setTransfers(prev => prev.map(t => (t.id === id ? (updated as TransferService) : t)));
    await dataService.saveDocument('transfers', id, updated, `/api/transfers/${id}`, 'PUT');
    fetchAllData();
  };

  const handleDeleteTransfer = async (id: string) => {
    const existing = transfers.find(t => t.id === id);
    const itemName = existing ? `Transfer: ${existing.service_title}` : id;
    if (!isAuthorizedToDirectlyModify) {
      setPermissionModalState({
        isOpen: true,
        actionType: 'Delete',
        moduleName: 'Transfers',
        itemId: id,
        itemName
      });
      return;
    }
    setTransfers(prev => prev.filter(t => t.id !== id));
    await dataService.deleteDocument('transfers', id, `/api/transfers/${id}`);
    fetchAllData();
  };

  const handleAddCruise = async (data: Partial<CruiseService>) => {
    const newId = "CRU-" + Math.random().toString(36).substring(2, 7).toUpperCase();
    const newCru: CruiseService = {
      id: newId,
      cruise_name: data.cruise_name || 'Nile Cruise',
      cruise_category: data.cruise_category || '5-Star Luxury Nile Cruise',
      route_itinerary: data.route_itinerary || 'Luxor to Aswan (4 Nights)',
      duration_nights: Number(data.duration_nights) || 4,
      board_basis: data.board_basis || 'Full Board (3 Meals)',
      cabin_type: data.cabin_type || 'Standard Nile View Cabin',
      cost_price: Number(data.cost_price) || 0,
      selling_price: Number(data.selling_price) || 0,
      currency: data.currency || 'USD',
      status: data.status || 'Active',
      ...data
    };
    setCruises(prev => [newCru, ...prev]);
    await dataService.saveDocument('cruises', newId, newCru, '/api/cruises', 'POST');
    await recordEmployeeActivity(`Added cruise service: ${newCru.cruise_name}`, 'Cruises', newId);
    fetchAllData();
  };

  const handleUpdateCruise = async (id: string, data: Partial<CruiseService>) => {
    const existing = cruises.find(c => c.id === id);
    const itemName = existing ? `Cruise: ${existing.cruise_name}` : id;
    if (!isAuthorizedToDirectlyModify) {
      setPermissionModalState({
        isOpen: true,
        actionType: 'Edit',
        moduleName: 'Cruises',
        itemId: id,
        itemName,
        proposedChanges: data
      });
      return;
    }
    const updated = { ...existing, ...data, id };
    setCruises(prev => prev.map(c => (c.id === id ? (updated as CruiseService) : c)));
    await dataService.saveDocument('cruises', id, updated, `/api/cruises/${id}`, 'PUT');
    fetchAllData();
  };

  const handleDeleteCruise = async (id: string) => {
    const existing = cruises.find(c => c.id === id);
    const itemName = existing ? `Cruise: ${existing.cruise_name}` : id;
    if (!isAuthorizedToDirectlyModify) {
      setPermissionModalState({
        isOpen: true,
        actionType: 'Delete',
        moduleName: 'Cruises',
        itemId: id,
        itemName
      });
      return;
    }
    setCruises(prev => prev.filter(c => c.id !== id));
    await dataService.deleteDocument('cruises', id, `/api/cruises/${id}`);
    fetchAllData();
  };

  const handleAddTour = async (data: Partial<TourService>) => {
    const newId = "TOUR-" + Math.random().toString(36).substring(2, 7).toUpperCase();
    const newTour: TourService = {
      id: newId,
      tour_title: data.tour_title || 'Guided Tour',
      tour_style: data.tour_style || 'Private VIP Tour',
      destination: data.destination || 'Cairo',
      duration_days: Number(data.duration_days) || 1,
      cost_price: Number(data.cost_price) || 0,
      selling_price: Number(data.selling_price) || 0,
      currency: data.currency || 'USD',
      status: data.status || 'Active',
      ...data
    };
    setTours(prev => [newTour, ...prev]);
    await dataService.saveDocument('tours', newId, newTour, '/api/tours', 'POST');
    await recordEmployeeActivity(`Added tour service: ${newTour.tour_title}`, 'Tours', newId);
    fetchAllData();
  };

  const handleUpdateTour = async (id: string, data: Partial<TourService>) => {
    const existing = tours.find(t => t.id === id);
    const itemName = existing ? `Tour: ${existing.tour_title}` : id;
    if (!isAuthorizedToDirectlyModify) {
      setPermissionModalState({
        isOpen: true,
        actionType: 'Edit',
        moduleName: 'Tours',
        itemId: id,
        itemName,
        proposedChanges: data
      });
      return;
    }
    const updated = { ...existing, ...data, id };
    setTours(prev => prev.map(t => (t.id === id ? (updated as TourService) : t)));
    await dataService.saveDocument('tours', id, updated, `/api/tours/${id}`, 'PUT');
    fetchAllData();
  };

  const handleDeleteTour = async (id: string) => {
    const existing = tours.find(t => t.id === id);
    const itemName = existing ? `Tour: ${existing.tour_title}` : id;
    if (!isAuthorizedToDirectlyModify) {
      setPermissionModalState({
        isOpen: true,
        actionType: 'Delete',
        moduleName: 'Tours',
        itemId: id,
        itemName
      });
      return;
    }
    setTours(prev => prev.filter(t => t.id !== id));
    await dataService.deleteDocument('tours', id, `/api/tours/${id}`);
    fetchAllData();
  };

  const handleAddDayTrip = async (data: Partial<DayTripService>) => {
    const newId = "DTRIP-" + Math.random().toString(36).substring(2, 7).toUpperCase();
    const newTrip: DayTripService = {
      id: newId,
      trip_title: data.trip_title || 'Day Trip Excursion',
      category: data.category || 'Desert Safari & Quad Biking',
      city_location: data.city_location || 'Hurghada / Red Sea',
      duration_hours: Number(data.duration_hours) || 4,
      cost_price: Number(data.cost_price) || 0,
      selling_price: Number(data.selling_price) || 0,
      currency: data.currency || 'USD',
      status: data.status || 'Active',
      ...data
    };
    setDayTrips(prev => [newTrip, ...prev]);
    await dataService.saveDocument('day_trips', newId, newTrip, '/api/day-trips', 'POST');
    await recordEmployeeActivity(`Added day trip: ${newTrip.trip_title}`, 'Day Trips', newId);
    fetchAllData();
  };

  const handleUpdateDayTrip = async (id: string, data: Partial<DayTripService>) => {
    const existing = dayTrips.find(d => d.id === id);
    const itemName = existing ? `Day Trip: ${existing.trip_title}` : id;
    if (!isAuthorizedToDirectlyModify) {
      setPermissionModalState({
        isOpen: true,
        actionType: 'Edit',
        moduleName: 'Day Trips',
        itemId: id,
        itemName,
        proposedChanges: data
      });
      return;
    }
    const updated = { ...existing, ...data, id };
    setDayTrips(prev => prev.map(d => (d.id === id ? (updated as DayTripService) : d)));
    await dataService.saveDocument('day_trips', id, updated, `/api/day-trips/${id}`, 'PUT');
    fetchAllData();
  };

  const handleDeleteDayTrip = async (id: string) => {
    const existing = dayTrips.find(d => d.id === id);
    const itemName = existing ? `Day Trip: ${existing.trip_title}` : id;
    if (!isAuthorizedToDirectlyModify) {
      setPermissionModalState({
        isOpen: true,
        actionType: 'Delete',
        moduleName: 'Day Trips',
        itemId: id,
        itemName
      });
      return;
    }
    setDayTrips(prev => prev.filter(d => d.id !== id));
    await dataService.deleteDocument('day_trips', id, `/api/day-trips/${id}`);
    fetchAllData();
  };

  const handleCreateVoucherForService = (category: string, service: any) => {
    let serviceTitle = service.trip_title || service.tour_title || service.cruise_name || service.service_title || service.hotel_name || `${service.country || ''} - ${service.visa_title || ''}`;
    if (category === 'Flight' || service.airline) {
      serviceTitle = `Flight Ticket: ${service.departure_airport || ''} → ${service.arrival_airport || ''} (${service.airline || ''})`;
    } else if (category === 'Hotel' || service.hotel_name) {
      serviceTitle = `Hotel Booking: ${service.hotel_name || ''}`;
    }

    let destination = service.destination || service.city_location || service.city || service.country || service.route_itinerary || service.dropoff_location || 'Egypt';
    if (category === 'Flight' && service.arrival_airport) {
      destination = service.arrival_airport;
    }

    let costPrice = Number(service.cost_price ?? service.contract_price ?? service.ticket_cost ?? service.embassy_consular_fee) || 0;
    let sellPrice = Number(service.selling_price ?? service.agency_fee) || 0;

    let inclusionsList = service.inclusions || service.required_documents || service.amenities || [];
    if (category === 'Hotel' && service.room_types) {
      inclusionsList = Array.isArray(inclusionsList) && inclusionsList.length > 0 ? inclusionsList : [service.room_types];
    }

    handleAddVoucher({
      service_category: category as any,
      service_title: serviceTitle,
      destination: destination,
      cost_price: costPrice,
      selling_price: sellPrice,
      currency: service.currency || 'USD',
      customer_id: service.customer_id || '',
      customer_name: service.customer_name || service.passenger || service.contact_person || '',
      inclusions: inclusionsList
    });
    setCurrentTab('vouchers');
  };

  const handleAddReservation = async (data: Partial<Reservation>) => {
    const newId = "RES-" + Math.random().toString(36).substring(2, 7).toUpperCase();
    const resCount = (reservations?.length || 0) + 1001;
    const sellPrice = Number(data.selling_price) || 500;
    const costPrice = Number(data.cost_price) || 350;
    const paidAmt = Number(data.paid_amount) || 0;
    let resCurrency = data.currency || "$";
    if (resCurrency === "USD") resCurrency = "$";
    else if (resCurrency.toUpperCase() === "EGP") resCurrency = "EGP";
    else if (resCurrency.toUpperCase() === "EUR") resCurrency = "EUR";

    const newRes: Reservation = {
      id: newId,
      reservation_id: `RES-2026-${resCount}`,
      voucher_number: data.voucher_number || `VCH-2026-${resCount}`,
      service_category: (data.service_category || data.service_type || 'Tour') as any,
      service_title: data.service_title || data.destination || 'Service',
      status: (data.status || 'Confirmed') as any,
      customer_id: data.customer_id || "",
      customer_name: data.customer_name || "Guest",
      service_type: data.service_type || "Tour",
      booking_date: new Date().toISOString().split('T')[0],
      issue_date: new Date().toISOString().split('T')[0],
      valid_until: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      travel_date: data.travel_date || new Date().toISOString().split('T')[0],
      return_date: data.return_date || new Date().toISOString().split('T')[0],
      number_of_travelers: Number(data.number_of_travelers) || 1,
      destination: data.destination || "Egypt",
      supplier_id: data.supplier_id || "SUP-001",
      supplier_name: data.supplier_name || "Partner",
      employee_id: currentEmployee?.id || currentEmpId || currentUsername || "Admin",
      employee_name: currentEmployee?.name || currentUsername || "Admin",
      selling_price: sellPrice,
      cost_price: costPrice,
      paid_amount: paidAmt,
      remaining_amount: sellPrice - paidAmt,
      profit: sellPrice - costPrice,
      payment_status: data.payment_status || "Pending",
      reservation_status: data.reservation_status || "Confirmed",
      notes: data.notes || "",
      ...data,
      currency: resCurrency
    };
    setReservations(prev => [newRes, ...prev]);
    await dataService.saveDocument('reservations', newId, newRes, '/api/reservations', 'POST');
    await recordEmployeeActivity(`Created reservation ${newRes.reservation_id} for ${newRes.customer_name}`, 'Reservations', newRes.reservation_id);
    fetchAllData();
  };

  const handleUpdateReservation = async (id: string, data: Partial<Reservation>) => {
    const resv = reservations.find(r => r.id === id);
    const itemName = resv ? `Reservation ${resv.reservation_id} (${resv.customer_name})` : id;
    let resCurrency = data.currency || resv?.currency || "$";
    if (resCurrency === "USD") resCurrency = "$";
    else if (resCurrency.toUpperCase() === "EGP") resCurrency = "EGP";
    else if (resCurrency.toUpperCase() === "EUR") resCurrency = "EUR";

    const sanitizedData = {
      ...data,
      ...(data.currency !== undefined ? { currency: resCurrency } : {})
    };

    if (!isAuthorizedToDirectlyModify) {
      setPermissionModalState({
        isOpen: true,
        actionType: 'Edit',
        moduleName: 'Reservations',
        itemId: id,
        itemName,
        proposedChanges: sanitizedData
      });
      return;
    }
    const updated = { 
      ...resv, 
      ...sanitizedData, 
      id,
      employee_id: sanitizedData.employee_id || resv?.employee_id,
      employee_name: sanitizedData.employee_name || resv?.employee_name,
      customer_invoice_id: sanitizedData.customer_invoice_id || resv?.customer_invoice_id,
      customer_invoice_number: sanitizedData.customer_invoice_number || resv?.customer_invoice_number,
      supplier_invoice_id: sanitizedData.supplier_invoice_id || resv?.supplier_invoice_id,
      supplier_invoice_number: sanitizedData.supplier_invoice_number || resv?.supplier_invoice_number,
    };
    setReservations(prev => prev.map(r => (r.id === id ? (updated as Reservation) : r)));
    await dataService.saveDocument('reservations', id, updated, `/api/reservations/${id}`, 'PUT');
    fetchAllData();
  };

  const handleDeleteReservation = async (id: string) => {
    const resv = reservations.find(r => r.id === id);
    const itemName = resv ? `Reservation ${resv.reservation_id} (${resv.customer_name})` : id;
    if (!isAuthorizedToDirectlyModify) {
      setPermissionModalState({
        isOpen: true,
        actionType: 'Delete',
        moduleName: 'Reservations',
        itemId: id,
        itemName
      });
      return;
    }
    setReservations(prev => prev.filter(r => r.id !== id));
    await dataService.deleteDocument('reservations', id, `/api/reservations/${id}`);
    fetchAllData();
  };

  const handleAddPackage = async (data: Partial<TourPackage>) => {
    const newId = "PKG-" + Math.random().toString(36).substring(2, 7).toUpperCase();
    const cost = Number(data.cost) || 350;
    const sellingPrice = Number(data.selling_price) || 500;
    const newPkg: TourPackage = {
      id: newId,
      package_name: data.package_name || "New Package",
      destination: data.destination || "Egypt",
      duration: data.duration || "3 Days / 2 Nights",
      start_date: data.start_date || new Date().toISOString().split('T')[0],
      end_date: data.end_date || new Date().toISOString().split('T')[0],
      hotel: data.hotel || "5-Star Resort",
      transportation: data.transportation || "Private AC Bus",
      activities: data.activities || "City tour & Sightseeing",
      meals: data.meals || "Breakfast & Dinner",
      available_seats: Number(data.available_seats) || 20,
      cost,
      selling_price: sellingPrice,
      currency: data.currency || "USD",
      profit_margin: sellingPrice > 0 ? Math.round(((sellingPrice - cost) / sellingPrice) * 100) : 30,
      included_services: data.included_services || [],
      excluded_services: data.excluded_services || [],
      terms_conditions: data.terms_conditions || "",
      images: data.images || [],
      status: data.status || "Available",
      ...data
    };
    setPackages(prev => [newPkg, ...prev]);
    await dataService.saveDocument('tour_packages', newId, newPkg, '/api/tour-packages', 'POST');
    await recordEmployeeActivity(`Created tour package: ${newPkg.package_name}`, 'Tour Packages', newId);
    fetchAllData();
  };

  const handleUpdatePackage = async (id: string, data: Partial<TourPackage>) => {
    const pkg = packages.find(p => p.id === id);
    const itemName = pkg ? pkg.package_name : id;
    if (!isAuthorizedToDirectlyModify) {
      setPermissionModalState({
        isOpen: true,
        actionType: 'Edit',
        moduleName: 'Tour Packages',
        itemId: id,
        itemName,
        proposedChanges: data
      });
      return;
    }
    const updated = { ...pkg, ...data, id };
    setPackages(prev => prev.map(p => (p.id === id ? (updated as TourPackage) : p)));
    await dataService.saveDocument('tour_packages', id, updated, `/api/tour-packages/${id}`, 'PUT');
    fetchAllData();
  };

  const handleDeletePackage = async (id: string) => {
    const pkg = packages.find(p => p.id === id);
    const itemName = pkg ? pkg.package_name : id;
    if (!isAuthorizedToDirectlyModify) {
      setPermissionModalState({
        isOpen: true,
        actionType: 'Delete',
        moduleName: 'Tour Packages',
        itemId: id,
        itemName
      });
      return;
    }
    setPackages(prev => prev.filter(p => p.id !== id));
    await dataService.deleteDocument('tour_packages', id, `/api/tour-packages/${id}`);
    fetchAllData();
  };

  const handleAddHotel = async (data: Partial<Hotel>) => {
    const newId = "HTL-" + Math.random().toString(36).substring(2, 7).toUpperCase();
    const newHtl: Hotel = {
      id: newId,
      hotel_name: data.hotel_name || "New Hotel",
      city: data.city || "Cairo",
      country: data.country || "Egypt",
      address: data.address || "",
      contact_person: data.contact_person || "",
      phone: data.phone || "",
      email: data.email || "",
      room_types: typeof data.room_types === 'string' ? data.room_types : "Standard, Deluxe",
      contract_price: Number(data.contract_price) || 80,
      selling_price: Number(data.selling_price) || 120,
      currency: data.currency || "USD",
      check_in_time: data.check_in_time || "14:00",
      check_out_time: data.check_out_time || "12:00",
      notes: data.notes || "",
      ...data
    };
    setHotels(prev => [newHtl, ...prev]);
    await dataService.saveDocument('hotels', newId, newHtl, '/api/hotels', 'POST');
    await recordEmployeeActivity(`Added hotel: ${newHtl.hotel_name} (${newHtl.city})`, 'Hotels', newId);
    fetchAllData();
  };

  const handleUpdateHotel = async (id: string, data: Partial<Hotel>) => {
    const htl = hotels.find(h => h.id === id);
    const itemName = htl ? htl.hotel_name : id;
    if (!isAuthorizedToDirectlyModify) {
      setPermissionModalState({
        isOpen: true,
        actionType: 'Edit',
        moduleName: 'Hotels',
        itemId: id,
        itemName,
        proposedChanges: data
      });
      return;
    }
    const updated = { ...htl, ...data, id };
    setHotels(prev => prev.map(h => (h.id === id ? (updated as Hotel) : h)));
    await dataService.saveDocument('hotels', id, updated, `/api/hotels/${id}`, 'PUT');
    fetchAllData();
  };

  const handleDeleteHotel = async (id: string) => {
    const htl = hotels.find(h => h.id === id);
    const itemName = htl ? htl.hotel_name : id;
    if (!isAuthorizedToDirectlyModify) {
      setPermissionModalState({
        isOpen: true,
        actionType: 'Delete',
        moduleName: 'Hotels',
        itemId: id,
        itemName
      });
      return;
    }
    setHotels(prev => prev.filter(h => h.id !== id));
    await dataService.deleteDocument('hotels', id, `/api/hotels/${id}`);
    fetchAllData();
  };

  const handleAddFlight = async (data: Partial<Flight>) => {
    const newId = "FLT-" + Math.random().toString(36).substring(2, 7).toUpperCase();
    const newFlt: Flight = {
      id: newId,
      airline: data.airline || "EgyptAir",
      flight_number: data.flight_number || "MS-101",
      departure_airport: data.departure_airport || "Cairo (CAI)",
      arrival_airport: data.arrival_airport || "Dubai (DXB)",
      departure_date: data.departure_date || new Date().toISOString().split('T')[0],
      departure_time: data.departure_time || "10:00",
      arrival_date: data.arrival_date || new Date().toISOString().split('T')[0],
      arrival_time: data.arrival_time || "14:00",
      passenger: data.passenger || "Guest",
      booking_reference: data.booking_reference || `BK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      ticket_number: data.ticket_number || `TK-${Math.floor(100000 + Math.random() * 900000)}`,
      ticket_cost: Number(data.ticket_cost) || 200,
      selling_price: Number(data.selling_price) || 280,
      currency: data.currency || "USD",
      status: data.status || "Confirmed",
      ...data
    };
    setFlights(prev => [newFlt, ...prev]);
    await dataService.saveDocument('flights', newId, newFlt, '/api/flights', 'POST');
    await recordEmployeeActivity(`Added flight booking: ${newFlt.airline} ${newFlt.flight_number} (${newFlt.passenger})`, 'Flights', newId);
    fetchAllData();
  };

  const handleUpdateFlight = async (id: string, data: Partial<Flight>) => {
    const flt = flights.find(f => f.id === id);
    const itemName = flt ? `${flt.airline} ${flt.flight_number} (${flt.passenger})` : id;
    if (!isAuthorizedToDirectlyModify) {
      setPermissionModalState({
        isOpen: true,
        actionType: 'Edit',
        moduleName: 'Flights',
        itemId: id,
        itemName,
        proposedChanges: data
      });
      return;
    }
    const updated = { ...flt, ...data, id };
    setFlights(prev => prev.map(f => (f.id === id ? (updated as Flight) : f)));
    await dataService.saveDocument('flights', id, updated, `/api/flights/${id}`, 'PUT');
    fetchAllData();
  };

  const handleDeleteFlight = async (id: string) => {
    const flt = flights.find(f => f.id === id);
    const itemName = flt ? `${flt.airline} ${flt.flight_number} (${flt.passenger})` : id;
    if (!isAuthorizedToDirectlyModify) {
      setPermissionModalState({
        isOpen: true,
        actionType: 'Delete',
        moduleName: 'Flights',
        itemId: id,
        itemName
      });
      return;
    }
    setFlights(prev => prev.filter(f => f.id !== id));
    await dataService.deleteDocument('flights', id, `/api/flights/${id}`);
    fetchAllData();
  };

  const handleAddSupplier = async (data: Partial<Supplier>) => {
    const newId = "SUP-" + Math.random().toString(36).substring(2, 7).toUpperCase();
    const newSup: Supplier = {
      id: newId,
      supplier_name: data.supplier_name || "New Partner",
      type: data.type || "Hotels",
      contact_person: data.contact_person || "",
      phone: data.phone || "",
      email: data.email || "",
      address: data.address || "Cairo, Egypt",
      tax_information: data.tax_information || "TRN-9988",
      outstanding_balance: 0,
      currency: data.currency || "USD",
      payment_terms: data.payment_terms || "30 Days Net",
      notes: data.notes || "",
      ...data
    };
    setSuppliers(prev => [newSup, ...prev]);
    await dataService.saveDocument('suppliers', newId, newSup, '/api/suppliers', 'POST');
    await recordEmployeeActivity(`Added supplier: ${newSup.supplier_name}`, 'Suppliers', newId);
    fetchAllData();
  };

  const handleUpdateSupplier = async (id: string, data: Partial<Supplier>) => {
    const sup = suppliers.find(s => s.id === id);
    const itemName = sup ? sup.supplier_name : id;
    if (!isAuthorizedToDirectlyModify) {
      setPermissionModalState({
        isOpen: true,
        actionType: 'Edit',
        moduleName: 'Suppliers',
        itemId: id,
        itemName,
        proposedChanges: data
      });
      return;
    }
    const updated = { ...sup, ...data, id };
    setSuppliers(prev => prev.map(s => (s.id === id ? (updated as Supplier) : s)));
    await dataService.saveDocument('suppliers', id, updated, `/api/suppliers/${id}`, 'PUT');
    fetchAllData();
  };

  const handleDeleteSupplier = async (id: string) => {
    const sup = suppliers.find(s => s.id === id);
    const itemName = sup ? sup.supplier_name : id;
    if (!isAuthorizedToDirectlyModify) {
      setPermissionModalState({
        isOpen: true,
        actionType: 'Delete',
        moduleName: 'Suppliers',
        itemId: id,
        itemName
      });
      return;
    }
    setSuppliers(prev => prev.filter(s => s.id !== id));
    await dataService.deleteDocument('suppliers', id, `/api/suppliers/${id}`);
    fetchAllData();
  };

  const handleDeactivateEmployee = async (id: string, status: 'Active' | 'Inactive' | 'Suspended') => {
    const updated: Partial<Employee> = { 
      account_status: status, 
      status: (status === 'Active' ? 'Active' : 'Inactive') as 'Active' | 'On Leave' | 'Inactive'
    };
    await handleEditEmployee(id, updated);
  };

  const handleAddEmployee = async (data: Partial<Employee> & { username?: string; password?: string }) => {
    const newId = data.id && String(data.id).trim() ? String(data.id).trim() : `EMP-${Date.now().toString(36).toUpperCase()}`;
    const empPos = (data.position || 'Sales') as EmployeePosition;
    const autoAdminByIT =
      isITAccount &&
      isManagerOrAccountantRole(empPos, data.department, data.role);
    const shouldBeAdmin = Boolean(
      data.is_admin ||
      autoAdminByIT ||
      empPos === 'Administrator'
    );

    const empRecord: Employee = {
      employee_id: data.employee_id || `E-${Math.floor(100 + Math.random() * 900)}`,
      name: data.name || 'Staff Member',
      phone: data.phone || '',
      email: data.email || '',
      position: empPos,
      department: data.department || 'Sales',
      joining_date: data.joining_date || new Date().toISOString().split('T')[0],
      salary: Number(data.salary) || 1200,
      commission_rate: Number(data.commission_rate) || 5,
      status: data.status || 'Active',
      account_status: data.account_status || 'Active',
      username: data.username || `emp_${Date.now().toString(36)}`,
      password: data.password || 'Sofia@123',
      reservations_count: 0,
      total_sales: 0,
      total_profit: 0,
      ...data,
      id: newId,
      permissions: normalizePermissions(data.permissions),
      is_admin: shouldBeAdmin,
      account_type: shouldBeAdmin ? 'Admin' : 'Employee',
      designation: shouldBeAdmin ? 'Admin' : 'Employee',
      role: shouldBeAdmin ? 'Admin' : String(empPos),
      created_by: data.created_by || (isITAccount ? 'IT' : currentUsername),
    };
    setEmployees(prev => [empRecord, ...prev.filter(e => e.id !== newId)]);
    await dataService.saveDocument('employees', newId, empRecord, '/api/employees', 'POST');
    fetchAllData();
  };

  const handleEditEmployee = async (id: string, data: Partial<Employee>) => {
    const emp = employees.find(e => e.id === id || e.employee_id === id);
    const docId = emp?.id || id;
    const itemName = emp ? `Employee ${emp.name}` : id;
    if (!isAuthorizedToDirectlyModify) {
      setPermissionModalState({
        isOpen: true,
        actionType: 'Edit',
        moduleName: 'Employees',
        itemId: docId,
        itemName,
        proposedChanges: data
      });
      return;
    }
    const nextPos = (data.position || emp?.position || 'Sales') as EmployeePosition;
    const nextIsAdmin =
      data.is_admin !== undefined
        ? Boolean(data.is_admin)
        : isEmployeeDesignatedAdmin(emp);
    const updated: Employee = {
      ...(emp as Employee),
      ...data,
      id: docId,
      name: data.name || emp?.name || 'Staff Member',
      position: nextPos,
      is_admin: nextIsAdmin,
      account_type: nextIsAdmin ? 'Admin' : 'Employee',
      designation: nextIsAdmin ? 'Admin' : 'Employee',
      role: nextIsAdmin ? 'Admin' : String(nextPos),
    };
    if (Array.isArray(updated.permissions)) {
      updated.permissions = normalizePermissions(updated.permissions);
    }
    setEmployees(prev => prev.map(e => (e.id === docId ? updated : e)));
    await dataService.saveDocument('employees', docId, updated, `/api/employees/${docId}`, 'PUT');
    fetchAllData();
  };

  const handleDeleteEmployee = async (id: string) => {
    const emp = employees.find(e => e.id === id || e.employee_id === id);
    const docId = emp?.id || id;
    const itemName = emp ? `Employee ${emp.name}` : id;
    if (!isAuthorizedToDirectlyModify) {
      setPermissionModalState({
        isOpen: true,
        actionType: 'Delete',
        moduleName: 'Employees',
        itemId: docId,
        itemName
      });
      return;
    }
    setEmployees(prev => prev.filter(e => e.id !== docId && e.employee_id !== id));
    await dataService.deleteDocument('employees', docId, `/api/employees/${docId}`);
    fetchAllData();
  };

  const handleAddExpense = async (data: any) => {
    const newId = data.id || ("EXP-" + Math.random().toString(36).substring(2, 7).toUpperCase());
    const expCurr = data.currency || settings.default_currency || "EGP";
    const newExp: Expense = {
      ...data,
      id: newId,
      expense_id: data.expense_id || `EXP-2026-${(expenses?.length || 0) + 101}`,
      category: data.category || "Office",
      description: data.description || "General expense",
      amount: Number(data.amount) || 0,
      currency: expCurr,
      date: data.date || new Date().toISOString().split('T')[0],
      employee_id: data.employee_id || currentEmployee?.id || currentEmpId || currentUsername || "Admin",
      employee_name: data.employee_name || currentEmployee?.name || currentUsername || "Admin",
      payment_method: data.payment_method || "Cash",
      notes: data.notes || "",
      status: data.status || "Paid"
    };
    setExpenses(prev => [newExp, ...prev.filter(e => e.id !== newId)]);
    await dataService.saveDocument('expenses', newId, newExp, '/api/expenses', 'POST');
    await recordEmployeeActivity(`Recorded expense: ${newExp.description} (${newExp.amount} ${newExp.currency})`, 'Expenses', newExp.expense_id);
    fetchAllData();
  };

  const handleUpdateExpense = async (exp: Expense) => {
    setExpenses(prev => prev.map(e => e.id === exp.id ? exp : e));
    await dataService.saveDocument('expenses', exp.id, exp, `/api/expenses/${exp.id}`, 'PUT');
    fetchAllData();
  };

  const handleDeleteExpense = async (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    await dataService.deleteDocument('expenses', id, `/api/expenses/${id}`);
    fetchAllData();
  };

  const handleGeneratePayroll = async (month?: string) => {
    // Default strictly to December salary (YYYY-12) since employment began in November
    const targetMonth = month || `${new Date().getFullYear()}-12`;
    const activeRates = settings?.exchange_rates?.length ? settings.exchange_rates : undefined;
    const isDecemberCycle = targetMonth.endsWith('-12');
    const yearPrefix = targetMonth.slice(0, 4);

    const activeStaff = employees.filter(
      emp => emp.status !== 'Inactive' && emp.account_status !== 'Inactive'
    );

    const generated: PayrollRecord[] = [];
    const commissionsToMarkAdded: CommissionRecord[] = [];

    activeStaff.forEach(emp => {
      const recId = `PAY-${targetMonth}-${emp.id}`;
      const existing = payrollRecords.find(p => p.id === recId);
      // Do not overwrite already Paid records
      if (existing && existing.status === 'Paid') {
        generated.push(existing);
        return;
      }

      const basicSalaryEgp = Number(emp.salary) || 0;

      // Aggregate employee's Pending / Added-to-Payroll commissions for this cycle
      // When generating December (YYYY-12), include November (YYYY-11) + December (YYYY-12) commissions since employment began in November
      const empCommissions = commissions.filter(c => {
        if (c.employee_id !== emp.id && (c.employee_name || '').toLowerCase() !== (emp.name || '').toLowerCase()) {
          return false;
        }
        if (c.status === 'Paid') return false;
        if (!c.date) return true;
        const cYm = String(c.date).slice(0, 7);
        if (isDecemberCycle) {
          return cYm === `${yearPrefix}-11` || cYm === `${yearPrefix}-12` || c.status === 'Pending';
        }
        return cYm === targetMonth || c.status === 'Pending';
      });

      const commissionEgp = Math.round(
        empCommissions.reduce(
          (sum, c) => sum + convertCurrency(Number(c.commission_amount) || 0, c.currency || 'EGP', 'EGP', activeRates),
          0
        ) * 100
      ) / 100;

      empCommissions.forEach(c => {
        if (c.status === 'Pending') {
          commissionsToMarkAdded.push({ ...c, status: 'Added to Payroll' });
        }
      });

      // Aggregate approved/outstanding Payroll Deduction advances for this employee
      const empAdvancesEgp = Math.round(
        advances
          .filter(
            a =>
              (a.employee_id === emp.id || (a.employee_name || '').toLowerCase() === (emp.name || '').toLowerCase()) &&
              (a.status === 'Outstanding' || a.status === 'Approved' || a.status === 'Partially Repaid') &&
              (a.repayment_method === 'Payroll Deduction' || !a.repayment_method)
          )
          .reduce(
            (sum, a) => sum + convertCurrency(Number(a.outstanding_amount ?? a.amount) || 0, a.currency || 'EGP', 'EGP', activeRates),
            0
          ) * 100
      ) / 100;

      const allowances = existing ? (Number(existing.allowances) || 0) : 0;
      const bonus = existing ? (Number(existing.bonus) || 0) : 0;
      const deductions = existing ? (Number(existing.deductions) || 0) : 0;
      const grossBeforeAdv = Math.max(0, basicSalaryEgp + allowances + commissionEgp + bonus - deductions);
      const deductibleAdvances = Math.min(grossBeforeAdv, empAdvancesEgp);
      const netSalary = Math.max(0, Math.round((grossBeforeAdv - deductibleAdvances) * 100) / 100);

      generated.push({
        id: recId,
        payroll_month: targetMonth,
        employee_id: emp.id,
        employee_name: emp.name,
        job_title: emp.position,
        department: emp.department || 'General',
        basic_salary: basicSalaryEgp,
        allowances,
        commission: commissionEgp,
        bonus,
        deductions,
        advances: deductibleAdvances,
        net_salary: netSalary,
        currency: 'EGP',
        status: existing?.status || 'Pending'
      });
    });

    setPayrollRecords(prev => {
      const map = new Map(prev.map(p => [p.id, p]));
      generated.forEach(g => map.set(g.id, g));
      return Array.from(map.values());
    });

    for (const rec of generated) {
      await dataService.saveDocument('payroll_records', rec.id, rec, '/api/payroll-records', 'POST');
    }

    if (commissionsToMarkAdded.length > 0) {
      setCommissions(prev =>
        prev.map(c => {
          const updated = commissionsToMarkAdded.find(u => u.id === c.id);
          return updated || c;
        })
      );
      for (const comm of commissionsToMarkAdded) {
        await dataService.saveDocument('commission_records', comm.id, comm, `/api/commission-records/${comm.id}`, 'PUT');
      }
    }
  };

  const handleUpdatePayrollStatus = async (id: string, status: 'Pending' | 'Partially Paid' | 'Paid', details?: any) => {
    setPayrollRecords(prev => prev.map(p => p.id === id ? { ...p, status, ...details } : p));
    const target = payrollRecords.find(p => p.id === id);
    if (target) {
      const updated = { ...target, status, ...details };
      await dataService.saveDocument('payroll_records', id, updated, `/api/payroll-records/${id}`, 'PUT');
    }
  };

  const handleDeletePayroll = async (id: string) => {
    setPayrollRecords(prev => prev.filter(p => p.id !== id));
    await dataService.deleteDocument('payroll_records', id, `/api/payroll-records/${id}`);
  };

  const handleAddAdvance = async (adv: EmployeeAdvance) => {
    setAdvances(prev => [adv, ...prev.filter(a => a.id !== adv.id)]);
    await dataService.saveDocument('employee_advances', adv.id, adv, '/api/employee-advances', 'POST');
  };

  const handleUpdateAdvance = async (adv: EmployeeAdvance) => {
    setAdvances(prev => prev.map(a => a.id === adv.id ? adv : a));
    await dataService.saveDocument('employee_advances', adv.id, adv, `/api/employee-advances/${adv.id}`, 'PUT');
  };

  const handleDeleteAdvance = async (id: string) => {
    setAdvances(prev => prev.filter(a => a.id !== id));
    await dataService.deleteDocument('employee_advances', id, `/api/employee-advances/${id}`);
  };

  const handleAddCommission = async (comm: CommissionRecord) => {
    setCommissions(prev => [comm, ...prev.filter(c => c.id !== comm.id)]);
    await dataService.saveDocument('commission_records', comm.id, comm, '/api/commission-records', 'POST');
  };

  const handleUpdateCommission = async (comm: CommissionRecord) => {
    setCommissions(prev => prev.map(c => c.id === comm.id ? comm : c));
    await dataService.saveDocument('commission_records', comm.id, comm, `/api/commission-records/${comm.id}`, 'PUT');
  };

  const handleDeleteCommission = async (id: string) => {
    setCommissions(prev => prev.filter(c => c.id !== id));
    await dataService.deleteDocument('commission_records', id, `/api/commission-records/${id}`);
  };

  const handleAddAuditLog = async (log: FinanceAuditLog) => {
    setFinanceAuditLogs(prev => [log, ...prev]);
    try {
      await dataService.saveDocument('finance_audit_logs', log.id, log);
    } catch (e) {}

    // Also map to global activity log
    const now = new Date();
    const activityLog: ActivityLog = {
      id: 'ACT-' + log.id,
      user_name: log.user_name,
      action: log.action,
      module: log.record_type,
      record: log.record_id,
      date: now.toISOString().split('T')[0],
      time: now.toLocaleTimeString()
    };
    setActivityLogs(prev => [activityLog, ...prev]);
    try {
      await dataService.saveDocument('activity_logs', activityLog.id, activityLog);
    } catch (e) {}
  };

  const handleAddTask = async (data: Partial<Task>) => {
    const newId = "TSK-" + Math.random().toString(36).substring(2, 7).toUpperCase();
    const newTask: Task = {
      id: newId,
      task_name: data.task_name || "New Task",
      assigned_employee_id: data.assigned_employee_id || currentUsername,
      assigned_employee_name: data.assigned_employee_name || currentUsername,
      due_date: data.due_date || new Date().toISOString().split('T')[0],
      priority: data.priority || "Medium",
      status: data.status || "Pending",
      notes: data.notes || "",
      ...data
    };
    setTasks(prev => [newTask, ...prev]);
    await dataService.saveDocument('tasks', newId, newTask, '/api/tasks', 'POST');
    await recordEmployeeActivity(`Assigned task: ${newTask.task_name} to ${newTask.assigned_employee_name}`, 'Tasks', newId);
    fetchAllData();
  };

  const handleUpdateTask = async (id: string, data: Partial<Task>) => {
    const current = tasks.find(t => t.id === id);
    const updated = { ...current, ...data, id };
    setTasks(prev => prev.map(t => (t.id === id ? (updated as Task) : t)));
    await dataService.saveDocument('tasks', id, updated, `/api/tasks/${id}`, 'PUT');
    
    // Add notification when task is completed by an employee
    if (data.status === 'Completed' && current?.status !== 'Completed') {
      const completionMessage = `Task "${updated.task_name}" was marked as Complete by ${currentUsername}.`;
      const notifId = 'NOTIF-' + Date.now();
      const newNotif: NotificationItem = {
        id: notifId,
        title: 'Task Completed',
        message: completionMessage,
        type: 'task',
        date: new Date().toLocaleDateString(),
        read: false
      };
      setNotifications(prev => [newNotif, ...prev]);
      await dataService.saveDocument('notifications', notifId, newNotif, '/api/notifications', 'POST');

      await handleAddAuditLog({
        id: 'LOG-' + Date.now(),
        user_name: currentUsername,
        user_role: userRole,
        action: 'Updated',
        record_type: 'Tasks',
        record_id: id,
        new_value: `Completed task "${updated.task_name}"`,
        date_time: new Date().toLocaleString()
      });
    }

    fetchAllData();
  };

  const readerKeys = useMemo(
    () =>
      Array.from(
        new Set(
          [
            currentEmployee?.id,
            currentEmployee?.employee_id,
            currentEmpId,
            currentUsername,
          ]
            .map(v => String(v || '').trim())
            .filter(Boolean)
        )
      ),
    [currentEmployee, currentEmpId, currentUsername]
  );

  const visibleNotifications = useMemo(() => {
    const filtered = notifications.filter(n =>
      isNotificationVisibleToUser(n, {
        isAdminOrIT: Boolean(isCurrentAdmin || isITAccount),
        employee: currentEmployee,
        empId: currentEmpId,
        username: currentUsername,
      })
    );
    const sorted = sortNotificationsNewestFirst(filtered);
    return sorted.map(n => ({
      ...n,
      read: isNotificationReadByUser(n, readerKeys),
    }));
  }, [notifications, isCurrentAdmin, isITAccount, currentEmployee, currentEmpId, currentUsername, readerKeys]);

  const handleMarkNotificationRead = async (id: string) => {
    const primaryReader = currentEmployee?.id || currentEmpId || currentUsername || 'Employee';
    const targetNotif = notifications.find(n => n.id === id);
    const nextReadBy = Array.from(new Set([...(targetNotif?.read_by || []), primaryReader]));
    const markGlobalRead = targetNotif?.target_scope !== 'ALL';

    setNotifications(prev =>
      prev.map(n =>
        n.id === id
          ? { ...n, read: markGlobalRead ? true : n.read, read_by: nextReadBy }
          : n
      )
    );

    try {
      await fetch(`/api/notifications/${encodeURIComponent(id)}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-acting-user': primaryReader,
        },
        body: JSON.stringify({ reader: primaryReader }),
      });
    } catch {}
    await dataService.saveDocument('notifications', id, {
      ...(markGlobalRead ? { read: true } : {}),
      read_by: nextReadBy,
    });
  };

  const handleMarkAllNotificationsRead = async () => {
    const primaryReader = currentEmployee?.id || currentEmpId || currentUsername || 'Employee';
    const unreadVisible = visibleNotifications.filter(n => !n.read);
    if (unreadVisible.length === 0) return;

    const unreadIds = new Set(unreadVisible.map(n => n.id));
    setNotifications(prev =>
      prev.map(n => {
        if (!unreadIds.has(n.id)) return n;
        const nextReadBy = Array.from(new Set([...(n.read_by || []), primaryReader]));
        const markGlobalRead = n.target_scope !== 'ALL';
        return { ...n, read: markGlobalRead ? true : n.read, read_by: nextReadBy };
      })
    );

    try {
      await fetch('/api/notifications/read-all', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-acting-user': primaryReader,
        },
        body: JSON.stringify({ reader: primaryReader }),
      });
    } catch {}

    await Promise.all(
      unreadVisible.map(n => {
        const nextReadBy = Array.from(new Set([...(n.read_by || []), primaryReader]));
        const markGlobalRead = n.target_scope !== 'ALL';
        return dataService.saveDocument('notifications', n.id, {
          ...(markGlobalRead ? { read: true } : {}),
          read_by: nextReadBy,
        });
      })
    );
  };

  const handleUpdateSettings = async (newSettings: CompanySettings) => {
    const merged: CompanySettings = isITAccount
      ? newSettings
      : {
          ...newSettings,
          site_disabled: settings.site_disabled,
          site_disabled_message: settings.site_disabled_message,
          site_disabled_at: settings.site_disabled_at,
          site_disabled_by: settings.site_disabled_by,
        };
    setSettings(merged);
    await dataService.saveDocument('settings', 'company_settings', merged, '/api/settings', 'PUT');
    fetchAllData();
  };

  // IT Developer Account Exclusive: Temporarily Disable / Re-enable Site (100% Data Preserved)
  const handleToggleSiteDisabledByIT = async (disable: boolean, message?: string) => {
    if (!isITAccount) {
      showToast(isAr ? 'غير مصرح: هذا الزر مخصص لحساب المطور IT فقط.' : 'Access Denied: Only the "IT" developer account can toggle site maintenance.');
      return;
    }

    const updatedSettings: CompanySettings = {
      ...settings,
      site_disabled: disable,
      site_disabled_message: message ?? '',
      site_disabled_at: disable ? new Date().toLocaleString() : '',
      site_disabled_by: 'IT',
    };

    setSettings(updatedSettings);
    try {
      await fetch('/api/it/toggle-site-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-acting-user': 'IT',
        },
        body: JSON.stringify(updatedSettings),
      });
    } catch {}
    await dataService.saveDocument('settings', 'company_settings', updatedSettings);
    await recordEmployeeActivity(
      disable ? 'Temporarily disabled site for modifications/updates (all data preserved)' : 'Re-enabled site for all users',
      'System Maintenance',
      'company_settings'
    );
    showToast(
      disable
        ? (isAr ? 'تم إيقاف الموقع مؤقتاً للتحديثات (جميع البيانات محفوظة بالكامل).' : 'Site temporarily disabled for updates (all data 100% preserved).')
        : (isAr ? 'تم إعادة تفعيل الموقع لجميع الموظفين والمستخدمين!' : 'Site re-enabled for all employees and users!')
    );
  };

  // Unified Attendance & Working Hours Logic (Identical calculation for Employee Self Clock-In/Out & IT Manual Entry)
  const todayDateStr = getLocalDateYYYYMMDD();
  const activeSelfId = currentEmployee?.id || currentEmpId || currentUsername;
  const activeSelfName = currentEmployee?.name || currentUsername;

  const todaySelfAttendance: AttendanceRecord | null =
    attendanceRecords.find(
      a =>
        isAttendanceShiftOpen(a) &&
        (a.employee_id === activeSelfId || a.employee_name === activeSelfName)
    ) ||
    attendanceRecords.find(
      a =>
        a.date === todayDateStr &&
        !a.clock_in &&
        !a.check_in_time &&
        (a.employee_id === activeSelfId || a.employee_name === activeSelfName)
    ) ||
    attendanceRecords.find(
      a =>
        a.date === todayDateStr &&
        (a.employee_id === activeSelfId || a.employee_name === activeSelfName)
    ) ||
    null;

  const handleSelfClockIn = async () => {
    const now = new Date();
    const clockInHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // If IT reset this employee's clock-in time on an existing record for today, populate clock_in on that record normally
    const awaitingClockInRec = attendanceRecords.find(
      a =>
        a.date === todayDateStr &&
        !a.clock_in &&
        !a.check_in_time &&
        (a.employee_id === activeSelfId || a.employee_name === activeSelfName)
    );

    if (awaitingClockInRec) {
      const existingOutRaw = awaitingClockInRec.clock_out || awaitingClockInRec.check_out_time || '';
      const existingOut = existingOutRaw === '--' || existingOutRaw === '-' ? '' : existingOutRaw;
      const calc = calculateWorkingHours(clockInHHMM, existingOut || undefined);
      const updatedRec: AttendanceRecord = {
        ...awaitingClockInRec,
        clock_in: clockInHHMM,
        check_in_time: clockInHHMM,
        clock_out: existingOut,
        check_out_time: existingOut,
        login_time: clockInHHMM,
        working_hours: existingOut ? calc.working_hours : 0,
        working_hours_formatted: existingOut ? calc.working_hours_formatted : '0h 00m',
        total_working_hours: existingOut ? calc.working_hours_formatted : '--',
        status: existingOut ? 'Completed' : 'Clocked In',
        entry_source: 'Employee',
        recorded_by: activeSelfName,
        reset_by_it: false,
        updated_at: now.toISOString(),
        updatedAt: now.toISOString(),
      };

      setRawAttendanceRecords(prev => prev.map(a => (a.id === awaitingClockInRec.id ? updatedRec : a)));
      await dataService.saveDocument('attendance', awaitingClockInRec.id, updatedRec, `/api/attendance/${awaitingClockInRec.id}`, 'PUT');
      await dataService.deleteDocument('employee_attendance', awaitingClockInRec.id);
      await recordEmployeeActivity(`Self Log In (${clockInHHMM})`, 'Attendance', activeSelfId);
      showToast(
        existingOut
          ? (isAr
              ? `تم تسجيل الحضور في ${clockInHHMM} — ساعات العمل: ${calc.working_hours_formatted}`
              : `Clocked in at ${clockInHHMM} — Working hours: ${calc.working_hours_formatted}`)
          : (isAr ? `تم تسجيل الحضور في ${clockInHHMM}` : `Clocked in at ${clockInHHMM}`)
      );
      return;
    }

    const calc = calculateWorkingHours(clockInHHMM, '');
    const ts = Date.now();
    const newAttId = `ATT-${ts}-${activeSelfId}`;

    const newRec: AttendanceRecord = {
      id: newAttId,
      attendance_id: `ATT-${ts}`,
      employee_id: activeSelfId,
      employee_name: activeSelfName,
      date: todayDateStr,
      clock_in: clockInHHMM,
      clock_out: '',
      check_in_time: clockInHHMM,
      check_out_time: '',
      working_hours: calc.working_hours,
      working_hours_formatted: calc.working_hours_formatted,
      total_working_hours: '--',
      status: calc.status,
      entry_source: 'Employee',
      recorded_by: activeSelfName,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    setRawAttendanceRecords(prev => [newRec, ...prev]);
    await dataService.saveDocument('attendance', newAttId, newRec, '/api/attendance', 'POST');
    await recordEmployeeActivity(`Self Log In`, 'Attendance', activeSelfId);
    showToast(isAr ? `تم تسجيل الحضور في ${clockInHHMM}` : `Clocked in at ${clockInHHMM}`);
  };

  const handleSelfClockOut = async () => {
    const openRec = attendanceRecords.find(
      a =>
        isAttendanceShiftOpen(a) &&
        (a.employee_id === activeSelfId || a.employee_name === activeSelfName)
    );
    if (!openRec) {
      showToast(isAr ? 'لا يوجد تسجيل حضور مفتوح حالياً.' : 'No active clock-in session found.');
      return;
    }

    const now = new Date();
    const clockOutHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const checkInRef = openRec.clock_in || openRec.check_in_time || '';
    // Calculate working hours using the unified calculator
    const calc = calculateWorkingHours(checkInRef, clockOutHHMM);

    const updatedRec: AttendanceRecord = {
      ...openRec,
      clock_in: checkInRef,
      clock_out: clockOutHHMM,
      check_in_time: checkInRef,
      check_out_time: clockOutHHMM,
      logout_time: clockOutHHMM,
      working_hours: calc.working_hours,
      working_hours_formatted: calc.working_hours_formatted,
      total_working_hours: calc.working_hours_formatted,
      status: calc.status,
      entry_source: 'Employee',
      recorded_by: activeSelfName,
      reset_by_it: false,
      updated_at: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    setRawAttendanceRecords(prev => prev.map(a => (a.id === openRec.id ? updatedRec : a)));
    await dataService.saveDocument('attendance', openRec.id, updatedRec, `/api/attendance/${openRec.id}`, 'PUT');
    await dataService.deleteDocument('employee_attendance', openRec.id);
    await recordEmployeeActivity(
      `Self Log Out (${clockOutHHMM} — ${calc.working_hours_formatted})`,
      'Attendance',
      activeSelfId
    );
    showToast(
      isAr
        ? `تم تسجيل الانصراف (${clockOutHHMM}) — ساعات العمل: ${calc.working_hours_formatted}`
        : `Clocked out (${clockOutHHMM}) — Working hours: ${calc.working_hours_formatted}`
    );
  };

  const handleSaveManualAttendanceByIT = async (data: {
    id?: string;
    employee_id: string;
    employee_name: string;
    date: string;
    clock_in: string;
    clock_out?: string;
    notes?: string;
  }) => {
    if (!isITAccount) {
      showToast(isAr ? 'غير مصرح: التعديل اليدوي للحضور والانصراف متاح لحساب IT فقط.' : 'Access Denied: Only the "IT" developer account can manually record attendance.');
      return;
    }

    const normalizedIn = normalizeTimeHHMM(data.clock_in) || data.clock_in;
    const normalizedOut = data.clock_out ? (normalizeTimeHHMM(data.clock_out) || data.clock_out) : '';

    // Exact same working hours calculation used when an employee clocks in/out themselves
    const calc = calculateWorkingHours(normalizedIn, normalizedOut);

    const existing = data.id
      ? attendanceRecords.find(a => a.id === data.id)
      : attendanceRecords.find(a => a.employee_id === data.employee_id && a.date === data.date);

    const ts = Date.now();
    const targetId = existing?.id || data.id || `ATT-${ts}-${data.employee_id}`;
    const nowIso = new Date().toISOString();

    const record: AttendanceRecord = {
      ...(existing || {}),
      id: targetId,
      attendance_id: existing?.attendance_id || `ATT-${ts}`,
      employee_id: data.employee_id,
      employee_name: data.employee_name,
      date: data.date,
      clock_in: normalizedIn,
      clock_out: normalizedOut,
      check_in_time: normalizedIn,
      check_out_time: normalizedOut,
      working_hours: calc.working_hours,
      working_hours_formatted: calc.working_hours_formatted,
      total_working_hours: normalizedOut ? calc.working_hours_formatted : '--',
      status: calc.status,
      entry_source: 'IT Manual',
      recorded_by: 'IT',
      reset_by_it: false,
      notes: data.notes || '',
      created_at: existing?.created_at || existing?.createdAt || nowIso,
      updated_at: nowIso,
      createdAt: existing?.createdAt || nowIso,
      updatedAt: nowIso,
    };

    setRawAttendanceRecords(prev => {
      const exists = prev.some(a => a.id === targetId);
      return exists ? prev.map(a => (a.id === targetId ? record : a)) : [record, ...prev];
    });

    try {
      await fetch(existing ? `/api/attendance/${targetId}` : '/api/attendance', {
        method: existing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-acting-user': 'IT',
        },
        body: JSON.stringify(record),
      });
    } catch {}
    await dataService.saveDocument('attendance', targetId, record);
    await dataService.deleteDocument('employee_attendance', targetId);

    await recordEmployeeActivity(
      `Attendance Edited (${record.employee_name} — ${record.date}: ${record.clock_in}${record.clock_out ? ` → ${record.clock_out}, ${record.working_hours_formatted}` : ''})`,
      'Attendance',
      targetId
    );

    showToast(
      record.clock_out
        ? (isAr
            ? `تم حفظ حضور وانصراف ${record.employee_name} — عدد ساعات العمل: ${record.working_hours_formatted} (${record.working_hours} ساعة)`
            : `Saved attendance for ${record.employee_name} — Working hours: ${record.working_hours_formatted} (${record.working_hours} hrs)`)
        : (isAr
            ? `تم تسجيل حضور ${record.employee_name} الساعة ${record.clock_in}`
            : `Recorded clock-in for ${record.employee_name} at ${record.clock_in}`)
    );
  };

  const handleResetAttendanceTimeByIT = async (id: string, target: 'clock_in' | 'clock_out' | 'both') => {
    if (!isITAccount) {
      showToast(
        isAr
          ? 'غير مصرح: إعادة ضبط وقت الحضور أو الانصراف متاحة لحساب IT فقط.'
          : 'Access Denied: Only the "IT" developer account can reset clock-in/clock-out times.'
      );
      return;
    }

    const existing = attendanceRecords.find(a => a.id === id);
    if (!existing) return;

    const currentIn = (existing.clock_in || existing.check_in_time || '').trim();
    const rawOut = (existing.clock_out || existing.check_out_time || '').trim();
    const currentOut = rawOut === '--' || rawOut === '-' ? '' : rawOut;

    const nextIn = target === 'clock_in' || target === 'both' ? '' : currentIn;
    const nextOut = target === 'clock_out' || target === 'both' ? '' : currentOut;
    const empName = existing.employee_name || 'Employee';

    if (!nextIn && !nextOut) {
      setRawAttendanceRecords(prev => prev.filter(a => a.id !== id));
      try {
        await fetch(`/api/attendance/${id}/reset`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-acting-user': 'IT',
          },
          body: JSON.stringify({ target }),
        });
      } catch {}
      await dataService.deleteDocument('attendance', id);
      await dataService.deleteDocument('employee_attendance', id);
      await recordEmployeeActivity(
        `Reset attendance time (${empName} — ${existing.date}) so employee can clock in/out normally`,
        'Attendance',
        existing.employee_id || id
      );
      showToast(
        isAr
          ? `تمت إعادة ضبط سجل ${empName} (${existing.date}) — يمكن للموظف الآن تسجيل الحضور والانصراف بشكل طبيعي.`
          : `Reset attendance for ${empName} (${existing.date}) — employee can now clock in and clock out normally.`
      );
      return;
    }

    const nowIso = new Date().toISOString();
    const updatedRec: AttendanceRecord = {
      ...existing,
      id,
      clock_in: nextIn,
      clock_out: nextOut,
      check_in_time: nextIn,
      check_out_time: nextOut,
      login_time: nextIn ? (existing.login_time || nextIn) : '',
      logout_time: nextOut ? (existing.logout_time || nextOut) : '',
      working_hours: 0,
      working_hours_formatted: '0h 00m',
      total_working_hours: '--',
      late_minutes: nextIn ? (Number(existing.late_minutes) || 0) : 0,
      early_departure_minutes: nextOut ? (Number(existing.early_departure_minutes) || 0) : 0,
      attendance_status: nextIn ? (existing.attendance_status || 'Present') : 'Present',
      status: 'Clocked In',
      entry_source: 'Employee',
      recorded_by: empName,
      reset_by_it: true,
      reset_at: nowIso,
      updated_at: nowIso,
      updatedAt: nowIso,
    };

    setRawAttendanceRecords(prev => prev.map(a => (a.id === id ? updatedRec : a)));
    try {
      await fetch(`/api/attendance/${id}/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-acting-user': 'IT',
        },
        body: JSON.stringify({ target }),
      });
    } catch {}
    await dataService.saveDocument('attendance', id, updatedRec);
    await dataService.deleteDocument('employee_attendance', id);

    await recordEmployeeActivity(
      `Reset ${target === 'clock_in' ? 'clock-in' : 'clock-out'} time for ${empName} (${existing.date}) — employee can clock ${target === 'clock_in' ? 'in' : 'out'} normally`,
      'Attendance',
      existing.employee_id || id
    );

    showToast(
      target === 'clock_out'
        ? (isAr
            ? `تمت إعادة ضبط وقت الانصراف للموظف ${empName} — الوردية مفتوحة الآن ويمكن للموظف تسجيل الانصراف بشكل طبيعي.`
            : `Reset clock-out time for ${empName} — shift is open again and the employee can clock out normally.`)
        : (isAr
            ? `تمت إعادة ضبط وقت الحضور للموظف ${empName} — يمكن للموظف الآن تسجيل الحضور بشكل طبيعي.`
            : `Reset clock-in time for ${empName} — the employee can now clock in normally.`)
    );
  };

  const handleDeleteAttendanceByIT = async (id: string) => {
    if (!isITAccount) return;
    setRawAttendanceRecords(prev => prev.filter(a => a.id !== id));
    try {
      await fetch(`/api/attendance/${id}`, {
        method: 'DELETE',
        headers: { 'x-acting-user': 'IT' },
      });
    } catch {}
    await dataService.deleteDocument('attendance', id);
    await dataService.deleteDocument('employee_attendance', id);
  };

  const handleSaveWorkSchedule = async (data: Partial<WorkSchedule>) => {
    const isAllowed = isITAccount || isCurrentAdmin || effectiveUserRole === 'Administrator';
    if (!isAllowed) {
      showToast(isAr ? 'غير مصرح: تعديل المواعيد المحددة متاح للمطور والمدير فقط.' : 'Access Denied: Only Developer (IT) and Administrator can adjust work schedules.');
      return;
    }

    const employeeId = data.employee_id || '';
    const scheduleDate = data.schedule_date || '';
    const schId =
      data.id ||
      (scheduleDate ? `SCHED-${employeeId || 'EMP'}-${scheduleDate}` : `SCHED-${employeeId || Date.now()}`);
    const schedule: WorkSchedule = {
      id: schId,
      employee_id: employeeId,
      employee_name: data.employee_name || 'Employee',
      start_time: data.start_time || '09:00',
      end_time: data.end_time || '17:00',
      grace_period_minutes: Number(data.grace_period_minutes !== undefined ? data.grace_period_minutes : 15),
      working_days: Array.isArray(data.working_days) ? data.working_days : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'],
      schedule_date: scheduleDate || undefined,
      updatedAt: new Date().toISOString()
    };

    setWorkSchedules(prev => {
      const idx = prev.findIndex(s => {
        if (s.id === schId) return true;
        if (scheduleDate) return s.employee_id === employeeId && s.schedule_date === scheduleDate;
        return Boolean(employeeId) && s.employee_id === employeeId && !s.schedule_date;
      });
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = schedule;
        return copy;
      }
      return [schedule, ...prev];
    });

    try {
      await fetch('/api/work-schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-acting-user': isITAccount ? 'IT' : currentUsername,
          'x-acting-role': effectiveUserRole
        },
        body: JSON.stringify(schedule)
      });
    } catch {}
    await dataService.saveDocument('work_schedules', schId, schedule);
    showToast(
      scheduleDate
        ? isAr
          ? `تم تحديد مواعيد ${schedule.employee_name} ليوم ${scheduleDate}`
          : `Set one-day schedule for ${schedule.employee_name} on ${scheduleDate}`
        : isAr
        ? `تم تحديث جدول عمل ${schedule.employee_name} (فترة السماح: ${schedule.grace_period_minutes} دقيقة)`
        : `Updated work schedule for ${schedule.employee_name} (Grace Period: ${schedule.grace_period_minutes} mins)`
    );
  };

  const handleDeleteWorkSchedule = async (id: string) => {
    const isAllowed = isITAccount || isCurrentAdmin || effectiveUserRole === 'Administrator';
    if (!isAllowed) {
      showToast(isAr ? 'غير مصرح: حذف الجداول متاح للمطور والمدير فقط.' : 'Access Denied: Only Developer (IT) and Administrator can delete schedules.');
      return;
    }
    setWorkSchedules(prev => prev.filter(s => s.id !== id));
    try {
      await fetch(`/api/work-schedules/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: {
          'x-acting-user': isITAccount ? 'IT' : currentUsername,
          'x-acting-role': effectiveUserRole
        }
      });
    } catch {}
    try {
      await dataService.deleteDocument('work_schedules', id);
    } catch {}
    showToast(isAr ? 'تم حذف جدول المواعيد.' : 'Work schedule deleted.');
  };

  const handleSaveAttendanceSettings = async (data: Partial<AttendanceSettings>) => {
    const isAllowed = isITAccount || isCurrentAdmin || effectiveUserRole === 'Administrator';
    if (!isAllowed) {
      showToast(isAr ? 'غير مصرح: تعديل إعدادات الدوام الرسمية متاح للمطور والمدير فقط.' : 'Access Denied: Only Developer (IT) and Administrator can adjust attendance settings.');
      return;
    }

    const id = 'main';
    const updated: AttendanceSettings = {
      id,
      default_start_time: data.default_start_time || '09:00',
      default_end_time: data.default_end_time || '17:00',
      default_grace_period_minutes: Number(data.default_grace_period_minutes !== undefined ? data.default_grace_period_minutes : 15),
      auto_record_on_login: data.auto_record_on_login ?? true,
      auto_record_on_logout: data.auto_record_on_logout ?? true,
      default_working_days: Array.isArray(data.default_working_days) ? data.default_working_days : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'],
      track_tardiness: data.track_tardiness ?? attendanceSettings?.track_tardiness ?? false,
      show_system_login_time: data.show_system_login_time ?? attendanceSettings?.show_system_login_time ?? false,
      calendar_reminder_time: data.calendar_reminder_time || attendanceSettings?.calendar_reminder_time || '09:00',
      updatedAt: new Date().toISOString()
    };

    setAttendanceSettings(updated);
    try {
      await fetch('/api/attendance-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-acting-user': isITAccount ? 'IT' : currentUsername,
          'x-acting-role': effectiveUserRole
        },
        body: JSON.stringify(updated)
      });
    } catch {}
    await dataService.saveDocument('attendance_settings', id, updated);
    showToast(isAr ? `تم تحديث فترة السماح الافتراضية للشركة (${updated.default_grace_period_minutes} دقيقة)` : `Updated default company grace period (${updated.default_grace_period_minutes} mins)`);
  };

  const handleClearAllDatabase = async (includeEmployees: boolean = true) => {
    const adminAllowed = isCurrentAdmin || isITAccount;
    if (!adminAllowed) {
      showToast('Access Denied: Only the Administrator can delete all data.');
      return;
    }

    await dataService.wipeAllOperationalData({
      includeEmployees,
      actingAdmin: currentUsername || 'Admin',
    });

    setCustomers([]);
    setCustomerInquiries([]);
    setReservations([]);
    setVouchers([]);
    setVisas([]);
    setTransfers([]);
    setCruises([]);
    setTours([]);
    setDayTrips([]);
    setPackages([]);
    setHotels([]);
    setFlights([]);
    setSuppliers([]);
    setInvoices([]);
    setCustomerPayments([]);
    setSupplierPayments([]);
    setExpenses([]);
    setPayrollRecords([]);
    setAdvances([]);
    setCommissions([]);
    setFinanceAuditLogs([]);
    setTasks([]);
    setDocuments([]);
    setNotifications([]);
    setActivityLogs([]);
    setRawAttendanceRecords([]);
    setPermissionRequests([]);
    if (includeEmployees) {
      setEmployees(prev => prev.filter(e => e.is_admin === true || e.position === 'Administrator'));
    }

    await fetchAllData();
    showToast('All existing operational data has been permanently deleted. Ready for clean republish!');
  };

  const myDesignatedSchedule = useMemo(
    () =>
      resolveEmployeeDesignatedSchedule(
        {
          id: activeSelfId,
          employee_id: currentEmployee?.employee_id || activeSelfId,
          name: activeSelfName,
          username: currentEmployee?.username || currentUsername,
        },
        workSchedules,
        attendanceSettings
      ),
    [activeSelfId, activeSelfName, currentEmployee, currentUsername, workSchedules, attendanceSettings]
  );

  // Register & auto-update Service Worker on installed phone web app + browser
  useEffect(() => {
    ensurePushServiceWorkerReady(setCurrentTab).catch(() => {});
    const updatePerm = () => setPhonePermStatus(getPhoneNotificationSupportStatus());
    document.addEventListener('visibilitychange', updatePerm);
    return () => document.removeEventListener('visibilitychange', updatePerm);
  }, []);

  // Automatically sync Web Push subscription when an employee has allowed notifications
  useEffect(() => {
    if (!isAuthenticated) return;
    const status = getPhoneNotificationSupportStatus();
    setPhonePermStatus(status);
    if (status === 'granted') {
      syncExistingEmployeePushSubscription({
        employee_id: activeSelfId,
        employee_name: activeSelfName,
        username: currentUsername,
        user_role: isITAccount ? 'IT Developer' : userRole,
        language,
        designated_check_in: myDesignatedSchedule.checkIn,
        designated_check_out: myDesignatedSchedule.checkOut,
      }).catch(() => {});
    }
  }, [
    isAuthenticated,
    activeSelfId,
    activeSelfName,
    currentUsername,
    isITAccount,
    userRole,
    language,
    myDesignatedSchedule.checkIn,
    myDesignatedSchedule.checkOut,
  ]);

  // Real-time live phone alert delivery for newly created notifications (deduplicated with Web Push via tag)
  useEffect(() => {
    if (!isAuthenticated) return;
    if (seenNotificationIdsRef.current === null) {
      seenNotificationIdsRef.current = new Set(notifications.map(n => n.id));
      return;
    }

    const newlyArrived = notifications.filter(n => !seenNotificationIdsRef.current!.has(n.id));
    notifications.forEach(n => seenNotificationIdsRef.current!.add(n.id));

    if (newlyArrived.length === 0 || getPhoneNotificationSupportStatus() !== 'granted') {
      return;
    }

    const nowMs = Date.now();
    newlyArrived.forEach(notif => {
      // Only show if targeted to ALL or to this specific employee (not other employees' private schedule alerts viewed by Admin)
      const isForMe = isNotificationVisibleToUser(notif, {
        isAdminOrIT: false,
        employee: currentEmployee,
        empId: currentEmpId,
        username: currentUsername,
      });
      if (!isForMe) return;

      // Avoid replaying old historical notifications on delayed sync
      if (notif.created_at) {
        const createdMs = new Date(notif.created_at).getTime();
        if (!isNaN(createdMs) && nowMs - createdMs > 2 * 60 * 1000) return;
      }

      // Skip welcome notification since enableEmployeePhoneNotifications already showed it
      if (String(notif.id || '').startsWith('NOTIF-WELCOME-')) return;

      showPhoneNotificationViaSW({
        id: notif.id,
        title: notif.title,
        body: notif.message,
        lang: language,
        tab: notif.type === 'attendance_reminder' ? 'attendance' : 'notifications',
      }).catch(() => {});
    });
  }, [notifications, isAuthenticated, currentEmployee, currentEmpId, currentUsername, language]);

  // Client-side designated check-in & check-out reminder safeguard (runs when phone app/browser is open even if offline)
  useEffect(() => {
    if (!isAuthenticated) return;
    const runClientScheduleCheck = () => {
      if (getPhoneNotificationSupportStatus() !== 'granted') return;
      const now = new Date();
      const dateStr = getLocalDateYYYYMMDD(now);
      const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      if (Array.isArray(myDesignatedSchedule.workingDays) && myDesignatedSchedule.workingDays.length > 0) {
        const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const todayWeekday = weekdays[now.getDay()];
        const worksToday = myDesignatedSchedule.workingDays.some(
          d =>
            d.trim().toLowerCase() === todayWeekday.toLowerCase() ||
            d.trim().toLowerCase().startsWith(todayWeekday.substring(0, 3).toLowerCase())
        );
        if (!worksToday) return;
      }

      if (hhmm === myDesignatedSchedule.checkIn) {
        const slotKey = `${dateStr}_${activeSelfId}_checkin`;
        if (!localReminderKeysRef.current.has(slotKey)) {
          localReminderKeysRef.current.add(slotKey);
          const notifId = `NOTIF-AUTO-${slotKey.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
          showPhoneNotificationViaSW({
            id: notifId,
            title: isAr
              ? `حان موعد تسجيل الحضور (${myDesignatedSchedule.checkIn})`
              : `Check-In Time Now (${myDesignatedSchedule.checkIn})`,
            body: isAr
              ? `مرحباً ${activeSelfName}، حان موعد حضورك المحدد (${myDesignatedSchedule.checkIn}). موعد انصرافك المحدد اليوم هو ${myDesignatedSchedule.checkOut}.`
              : `Hello ${activeSelfName}, it is your designated check-in time (${myDesignatedSchedule.checkIn}). Your designated check-out today is ${myDesignatedSchedule.checkOut}.`,
            lang: language,
            tab: 'attendance',
          }).catch(() => {});
        }
      } else if (hhmm === myDesignatedSchedule.checkOut) {
        const slotKey = `${dateStr}_${activeSelfId}_checkout`;
        if (!localReminderKeysRef.current.has(slotKey)) {
          localReminderKeysRef.current.add(slotKey);
          const notifId = `NOTIF-AUTO-${slotKey.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
          showPhoneNotificationViaSW({
            id: notifId,
            title: isAr
              ? `حان موعد تسجيل الانصراف (${myDesignatedSchedule.checkOut})`
              : `Check-Out Time Now (${myDesignatedSchedule.checkOut})`,
            body: isAr
              ? `مرحباً ${activeSelfName}، حان موعد انصرافك المحدد (${myDesignatedSchedule.checkOut}) بعد دوام بدأ ${myDesignatedSchedule.checkIn}.`
              : `Hello ${activeSelfName}, it is your designated check-out time (${myDesignatedSchedule.checkOut}) for your ${myDesignatedSchedule.checkIn}–${myDesignatedSchedule.checkOut} shift.`,
            lang: language,
            tab: 'attendance',
          }).catch(() => {});
        }
      }
    };

    const interval = setInterval(runClientScheduleCheck, 30 * 1000);
    return () => clearInterval(interval);
  }, [isAuthenticated, activeSelfId, activeSelfName, myDesignatedSchedule, isAr, language]);

  const handleQuickAllowPhonePush = async () => {
    setIsActivatingBannerPush(true);
    try {
      const result = await enableEmployeePhoneNotifications({
        employee_id: activeSelfId,
        employee_name: activeSelfName,
        username: currentUsername,
        user_role: isITAccount ? 'IT Developer' : userRole,
        language,
        designated_check_in: myDesignatedSchedule.checkIn,
        designated_check_out: myDesignatedSchedule.checkOut,
      });
      setPhonePermStatus(result.status);
      if (result.granted) {
        showToast(
          isAr
            ? `تم تفعيل إشعارات الهاتف وإرسال تنبيه فوري لهاتفك! (حضور ${result.schedule.checkIn} • انصراف ${result.schedule.checkOut})`
            : `Phone alerts enabled & instant notification sent! (Check-In ${result.schedule.checkIn} • Check-Out ${result.schedule.checkOut})`
        );
      } else if (result.status === 'ios_install_required') {
        showToast(
          isAr
            ? 'على iPhone: اضغط مشاركة في Safari ثم "إضافة إلى الشاشة الرئيسية" لتفعيل إشعارات الهاتف.'
            : 'On iPhone: Tap Share in Safari -> "Add to Home Screen" first to enable Web Push alerts.'
        );
      }
    } finally {
      setIsActivatingBannerPush(false);
    }
  };

  const unreadNotifsCount = visibleNotifications.filter(n => !n.read).length;

  const handleLogin = (name: string, role: UserRole, empId?: string) => {
    setCurrentUsername(name);
    setUserRole(role);
    if (empId) {
      setCurrentEmpId(empId);
    }
    setIsAuthenticated(true);
    try {
      localStorage.setItem('sofia_travel_auth', 'true');
      localStorage.setItem('sofia_travel_user', name);
      localStorage.setItem('sofia_travel_role', role);
      if (empId) {
        localStorage.setItem('sofia_travel_emp_id', empId);
      }
    } catch {}
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentEmpId('');
    try {
      localStorage.setItem('sofia_travel_auth', 'false');
      localStorage.removeItem('sofia_travel_emp_id');
    } catch {}
  };

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const previousTabRef = useRef(currentTab);
  const mainScrollRef = useRef<HTMLDivElement | null>(null);
  const navigationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (previousTabRef.current === currentTab) return;
    previousTabRef.current = currentTab;
    mainScrollRef.current?.scrollTo({ top: 0, behavior: 'auto' });
    setIsNavigating(true);
    if (navigationTimerRef.current) clearTimeout(navigationTimerRef.current);
    navigationTimerRef.current = setTimeout(() => setIsNavigating(false), 420);
    return () => {
      if (navigationTimerRef.current) clearTimeout(navigationTimerRef.current);
    };
  }, [currentTab]);

  useEffect(() => {
    const el = mainScrollRef.current;
    if (!el) return;
    const handleScroll = () => setShowBackToTop(el.scrollTop > 480);
    handleScroll();
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [isAuthenticated, settings.site_disabled]);

  const handleSelectQuickAdd = (actionKey: string) => {
    switch (actionKey) {
      case 'new-voucher':
        setCurrentTab('vouchers');
        break;
      case 'new-inquiry':
        setCurrentTab('customer-inquiries');
        break;
      case 'new-service':
        setCurrentTab('services');
        break;
      case 'new-customer':
        setCurrentTab('customers');
        break;
      case 'new-invoice':
        setCurrentTab('invoices');
        break;
      case 'new-package':
        setCurrentTab('packages');
        break;
      default:
        break;
    }
  };

  const isSiteTemporarilyDisabled = Boolean(settings.site_disabled);

  // If the site is temporarily disabled by "IT", block all non-IT sessions without deleting any data
  if (isSiteTemporarilyDisabled && (!isAuthenticated || !isITAccount)) {
    return (
      <div className="flex h-[100dvh] min-h-[100dvh] bg-slate-950 overflow-hidden font-sans flex-col w-full max-w-full">
        <SiteMaintenanceOverlay
          companyName={settings.company_name}
          disabledMessage={settings.site_disabled_message}
          disabledAt={settings.site_disabled_at}
          isAuthenticatedNonIT={isAuthenticated && !isITAccount}
          currentUsername={currentUsername}
          onLogout={handleLogout}
          onOpenITLogin={() => setShowITLoginFromMaintenance(true)}
        />
        {showITLoginFromMaintenance && (
          <LoginModal
            employees={employees}
            onLogin={(name, role, empId) => {
              handleLogin(name, role, empId);
              setShowITLoginFromMaintenance(false);
            }}
            companyName={settings.company_name}
            isSiteDisabled={true}
            onClose={() => setShowITLoginFromMaintenance(false)}
          />
        )}
        <OfflineIndicator />
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] min-h-[100dvh] bg-slate-100 overflow-hidden font-sans flex-col w-full max-w-full">
      {!isAuthenticated && (
        <LoginModal
          employees={employees}
          onLogin={handleLogin}
          companyName={settings.company_name}
        />
      )}

      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-2xl border border-slate-700 flex items-center gap-2 max-w-[92vw] animate-in fade-in">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          <span className="truncate">{toastMessage}</span>
        </div>
      )}

      <NavigationLoader visible={isNavigating} />

      {/* Top banner shown exclusively to "IT" while the site is temporarily disabled for other users */}
      {isSiteTemporarilyDisabled && isAuthenticated && isITAccount && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-bold flex flex-wrap items-center justify-between gap-2 shrink-0 z-30 shadow-xs">
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 shrink-0" />
            <span>
              {isAr
                ? 'وضع التحديثات مفعل (حساب IT فقط): الموقع متوقف مؤقتاً لباقي المستخدمين وجميع البيانات محفوظة 100%.'
                : 'Maintenance Mode Active (IT Account Only): Site is temporarily paused for all other users — 100% of data is preserved.'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleToggleSiteDisabledByIT(false, '')}
            className="px-3 py-1 rounded-lg bg-slate-950 text-emerald-300 hover:bg-slate-900 text-[11px] font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Power className="w-3.5 h-3.5" />
            <span>{isAr ? 'إعادة تفعيل الموقع الآن' : 'Re-enable Site Now'}</span>
          </button>
        </div>
      )}

      <Navbar
        userRole={effectiveUserRole}
        userPermissions={currentUserPermissions}
        setUserRole={setUserRole}
        currentCurrency={currentCurrency}
        setCurrentCurrency={setCurrentCurrency}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenAi={() => setIsAiOpen(true)}
        notifications={visibleNotifications}
        pendingPermissionCount={permissionRequests.filter(r => r.status === 'Pending').length}
        onMarkNotificationRead={handleMarkNotificationRead}
        onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        username={currentUsername}
        companyName={settings.company_name}
        onLogout={handleLogout}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        dbConnected={dbStatus?.connected ?? true}
        onVerifyDb={handleVerifyDatabase}
        isAdmin={isCurrentAdmin}
        onOpenAdminReset={() => setIsAdminResetModalOpen(true)}
        isITAccount={isITAccount}
        isSiteDisabled={isSiteTemporarilyDisabled}
        onOpenITSiteControl={() => setIsITSiteModalOpen(true)}
        todayAttendance={todaySelfAttendance}
        onClockIn={handleSelfClockIn}
        onClockOut={handleSelfClockOut}
      />

      {isAuthenticated && settings.update_notice_enabled && (
        <UpdateNoticeBanner
          messageEn={settings.update_notice_en}
          messageAr={settings.update_notice_ar}
          version={settings.update_notice_version || APP_VERSION}
        />
      )}

      {/* One-Tap Phone Push Notification Permission Strip for Employees */}
      {isAuthenticated && phonePermStatus === 'default' && !pushBannerDismissed && currentTab !== 'notifications' && (
        <div className="bg-slate-900 border-b border-slate-800 text-white px-3 sm:px-6 py-2 text-xs flex flex-wrap items-center justify-between gap-2 shrink-0 z-30">
          <div className="flex items-center gap-2 min-w-0">
            <BellRing className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="font-semibold text-slate-200 truncate">
              {isAr
                ? `فعّل إشعارات الهاتف الفورية لتذكيرك بموعد حضورك (${myDesignatedSchedule.checkIn}) وانصرافك (${myDesignatedSchedule.checkOut})`
                : `Enable direct phone push alerts & check-in (${myDesignatedSchedule.checkIn}) / check-out (${myDesignatedSchedule.checkOut}) reminders`}
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 ms-auto">
            <button
              type="button"
              onClick={handleQuickAllowPhonePush}
              disabled={isActivatingBannerPush}
              className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-[11px] cursor-pointer transition-colors"
            >
              {isActivatingBannerPush
                ? (isAr ? 'جاري التفعيل...' : 'Enabling...')
                : (isAr ? 'السماح بالإشعارات' : 'Allow Notifications')}
            </button>
            <button
              type="button"
              onClick={() => setPushBannerDismissed(true)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              aria-label="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      <div ref={mainScrollRef} className="flex-1 flex flex-col min-w-0 overflow-y-auto overscroll-y-contain w-full max-w-full">
        <main key={currentTab} className="page-transition flex-1 pb-24 lg:pb-6 w-full max-w-full overflow-x-hidden">
          {isCurrentTabRevoked ? (
            <div className="p-6 max-w-xl mx-auto mt-8">
              <div className="bg-white border border-rose-200 rounded-2xl p-6 text-center shadow-sm">
                <h2 className="text-lg font-extrabold text-slate-900">
                  {isAr ? 'تم إلغاء صلاحية الوصول' : 'Access Revoked'}
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  {isAr
                    ? 'لم يعد لديك إذن لفتح هذه الصفحة. تم تحديث صلاحياتك بواسطة الإدارة.'
                    : 'You no longer have permission to open this page. Your access was updated by an administrator.'}
                </p>
                <button
                  type="button"
                  onClick={() => setCurrentTab('dashboard')}
                  className="mt-4 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold cursor-pointer"
                >
                  {isAr ? 'العودة إلى لوحة التحكم' : 'Back to Dashboard'}
                </button>
              </div>
            </div>
          ) : (
            <>
          {currentTab === 'dashboard' && (
            <DashboardView
              stats={stats}
              currentCurrency={currentCurrency}
              isAdmin={isCurrentAdmin}
              onOpenAdminReset={() => setIsAdminResetModalOpen(true)}
              dbConnected={dbStatus?.connected ?? true}
              onVerifyDb={handleVerifyDatabase}
              isITAccount={isITAccount}
              isSiteDisabled={isSiteTemporarilyDisabled}
              onOpenITSiteControl={() => setIsITSiteModalOpen(true)}
              onNavigateTab={setCurrentTab}
            />
          )}

          {currentTab === 'permission-requests' && (
            <PermissionRequestsView
              requests={permissionRequests}
              userRole={effectiveUserRole}
              currentUsername={currentUsername}
              onApproveRequest={handleApprovePermissionRequest}
              onRejectRequest={handleRejectPermissionRequest}
              advances={advances}
              employees={employees}
              currentEmployee={currentEmployee}
              onAddAdvance={handleAddAdvance}
              onUpdateAdvance={handleUpdateAdvance}
            />
          )}

          {currentTab === 'customers' && (
            <CustomersView
              customers={customers}
              invoices={invoices}
              reservations={reservations}
              vouchers={vouchers}
              customerPayments={customerPayments}
              customerInquiries={customerInquiries}
              employees={employees}
              activityLogs={activityLogs}
              currentUsername={currentUsername}
              settings={settings}
              visas={visas}
              flights={flights}
              hotels={hotels}
              transfers={transfers}
              cruises={cruises}
              tours={tours}
              dayTrips={dayTrips}
              onAddCustomer={handleAddCustomer}
              onUpdateCustomer={handleUpdateCustomer}
              onDeleteCustomer={handleDeleteCustomer}
              onLogCommunication={handleLogCustomerCommunication}
            />
          )}

          {currentTab === 'customer-inquiries' && (
            <CustomerInquiriesView
              inquiries={customerInquiries}
              employees={employees}
              customers={customers}
              userRole={effectiveUserRole}
              userPermissions={currentUserPermissions}
              currentUser={currentUsername}
              onSaveInquiry={handleSaveInquiry}
              onDeleteInquiry={handleDeleteInquiry}
              onLogFollowUp={handleLogFollowUp}
              onConvertToCustomer={handleConvertToCustomer}
              onRequestApproval={(action, item, module) => {
                setPermissionModalState({
                  isOpen: true,
                  actionType: action,
                  moduleName: module || 'Customer Inquiries',
                  itemId: item.id,
                  itemName: item.name || item.id,
                  proposedChanges: action === 'Edit' ? item : undefined
                });
              }}
            />
          )}

          {(currentTab === 'vouchers' || currentTab === 'reservations') && (
            <VouchersView
              vouchers={vouchers}
              customers={customers}
              suppliers={suppliers}
              employees={employees}
              packages={packages}
              invoices={invoices}
              settings={settings}
              currentCurrency={currentCurrency}
              visas={visas}
              transfers={transfers}
              cruises={cruises}
              tours={tours}
              dayTrips={dayTrips}
              onAddVoucher={handleAddVoucher}
              onUpdateVoucher={handleUpdateVoucher}
              onDeleteVoucher={handleDeleteVoucher}
              onSendVoucher={handleSendVoucher}
              onConvertVoucher={handleConvertVoucher}
              onTransferToInvoice={handleTransferReservationToInvoice}
              onAddInvoice={handleAddInvoice}
              onNavigateToServices={() => setCurrentTab('services')}
            />
          )}

          {(currentTab === 'services' || currentTab === 'visas' || currentTab === 'flights' || currentTab === 'hotels' || currentTab === 'transfers' || currentTab === 'cruises' || currentTab === 'tours' || currentTab === 'day-trips') && (
            <ServicesView
              initialSubTab={
                currentTab === 'flights' ? 'flights' :
                currentTab === 'hotels' ? 'hotels' :
                currentTab === 'transfers' ? 'transfers' :
                currentTab === 'cruises' ? 'cruises' :
                currentTab === 'tours' ? 'tours' :
                currentTab === 'day-trips' ? 'day-trips' : 'visas'
              }
              visas={visas}
              flights={flights}
              hotels={hotels}
              transfers={transfers}
              cruises={cruises}
              tours={tours}
              dayTrips={dayTrips}
              packages={packages}
              settings={settings}
              currentCurrency={currentCurrency}
              customers={customers}
              onAddVisa={handleAddVisa}
              onUpdateVisa={handleUpdateVisa}
              onDeleteVisa={handleDeleteVisa}
              onAddFlight={handleAddFlight}
              onUpdateFlight={handleUpdateFlight}
              onDeleteFlight={handleDeleteFlight}
              onAddHotel={handleAddHotel}
              onUpdateHotel={handleUpdateHotel}
              onDeleteHotel={handleDeleteHotel}
              onAddTransfer={handleAddTransfer}
              onUpdateTransfer={handleUpdateTransfer}
              onDeleteTransfer={handleDeleteTransfer}
              onAddCruise={handleAddCruise}
              onUpdateCruise={handleUpdateCruise}
              onDeleteCruise={handleDeleteCruise}
              onAddTour={handleAddTour}
              onUpdateTour={handleUpdateTour}
              onDeleteTour={handleDeleteTour}
              onAddDayTrip={handleAddDayTrip}
              onUpdateDayTrip={handleUpdateDayTrip}
              onDeleteDayTrip={handleDeleteDayTrip}
              onCreateVoucherForService={handleCreateVoucherForService}
            />
          )}
          {currentTab === 'packages' && (
            <TourPackagesView 
              packages={packages} 
              onAddPackage={handleAddPackage}
              onUpdatePackage={handleUpdatePackage}
              onDeletePackage={handleDeletePackage}
              onBookPackage={(pkg) => {
                handleCreateVoucherForService('Tour Package', pkg);
              }} 
            />
          )}
          {currentTab === 'hotels' && (
            <HotelsView 
              hotels={hotels} 
              onAddHotel={handleAddHotel} 
              onUpdateHotel={handleUpdateHotel}
              onDeleteHotel={handleDeleteHotel}
            />
          )}
          {currentTab === 'flights' && (
            <FlightsView 
              flights={flights} 
              onAddFlight={handleAddFlight} 
              onUpdateFlight={handleUpdateFlight}
              onDeleteFlight={handleDeleteFlight}
            />
          )}
          {currentTab === 'suppliers' && (
            <SuppliersView 
              suppliers={suppliers} 
              invoices={invoices}
              reservations={reservations}
              settings={settings}
              onAddSupplier={handleAddSupplier} 
              onUpdateSupplier={handleUpdateSupplier}
              onDeleteSupplier={handleDeleteSupplier}
            />
          )}
          {currentTab === 'finance-payroll' && (
            <FinancePayrollView
              userRole={effectiveUserRole}
              currentUsername={currentUsername}
              isAdmin={isCurrentAdmin}
              isITAccount={isITAccount}
              expenses={expenses}
              onAddExpense={handleAddExpense}
              onUpdateExpense={handleUpdateExpense}
              onDeleteExpense={handleDeleteExpense}
              payrollRecords={payrollRecords}
              onGeneratePayroll={handleGeneratePayroll}
              onUpdatePayrollStatus={handleUpdatePayrollStatus}
              onDeletePayroll={handleDeletePayroll}
              advances={advances}
              onAddAdvance={handleAddAdvance}
              onUpdateAdvance={handleUpdateAdvance}
              onDeleteAdvance={handleDeleteAdvance}
              commissions={commissions}
              onAddCommission={handleAddCommission}
              onUpdateCommission={handleUpdateCommission}
              onDeleteCommission={handleDeleteCommission}
              reservations={reservations}
              vouchers={vouchers}
              invoices={invoices}
              customers={customers}
              suppliers={suppliers}
              employees={employees}
              visas={visas}
              flights={flights}
              hotels={hotels}
              transfers={transfers}
              cruises={cruises}
              tours={tours}
              dayTrips={dayTrips}
              customerPayments={customerPayments}
              supplierPayments={supplierPayments}
              auditLogs={financeAuditLogs}
              onAddAuditLog={handleAddAuditLog}
              onNavigateTab={setCurrentTab}
              settings={settings}
              companyCurrency={settings.default_currency || 'EGP'}
            />
          )}

          {(currentTab === 'invoices' || currentTab === 'finance' || currentTab === 'customer-payments' || currentTab === 'supplier-payments' || currentTab === 'expenses') && (
            <InvoicesView
              invoices={invoices}
              customers={customers}
              suppliers={suppliers}
              packages={packages}
              hotels={hotels}
              flights={flights}
              reservations={reservations}
              vouchers={vouchers}
              initialReservation={selectedReservationForInvoice}
              onClearInitialReservation={() => setSelectedReservationForInvoice(null)}
              settings={settings}
              onAddInvoice={handleAddInvoice}
              onUpdateInvoice={handleUpdateInvoice}
              onDeleteInvoice={handleDeleteInvoice}
              onUpdateReservation={handleUpdateReservation}
              userRole={effectiveUserRole}
              currentCurrency={currentCurrency}
            />
          )}
          {currentTab === 'employees' && (
            <EmployeesView 
              employees={employees} 
              onAddEmployee={handleAddEmployee} 
              onEditEmployee={handleEditEmployee}
              onDeleteEmployee={handleDeleteEmployee}
              onDeactivateEmployee={handleDeactivateEmployee}
              userRole={effectiveUserRole}
              userPermissions={currentUserPermissions}
              onAddAuditLog={handleAddAuditLog}
              currentUsername={currentUsername}
              permissionRequests={permissionRequests}
              onApprovePermissionRequest={handleApprovePermissionRequest}
              onRejectPermissionRequest={handleRejectPermissionRequest}
              isITAccount={isITAccount}
              attendanceRecords={attendanceRecords}
              onSaveManualAttendance={handleSaveManualAttendanceByIT}
              onResetAttendanceTime={handleResetAttendanceTimeByIT}
              onDeleteAttendance={handleDeleteAttendanceByIT}
              onSelfClockIn={handleSelfClockIn}
              onSelfClockOut={handleSelfClockOut}
              todaySelfAttendance={todaySelfAttendance}
            />
          )}
          {currentTab === 'attendance' && (
            <AttendanceDepartureView
              employees={employees}
              attendanceRecords={attendanceRecords}
              loginLogs={attendanceLoginLogs}
              workSchedules={workSchedules}
              attendanceSettings={attendanceSettings}
              userRole={effectiveUserRole}
              currentUsername={currentUsername}
              currentEmpId={activeSelfId}
              isAdmin={isCurrentAdmin}
              isITAccount={isITAccount}
              todaySelfAttendance={todaySelfAttendance}
              onSelfClockIn={handleSelfClockIn}
              onSelfClockOut={handleSelfClockOut}
              onSaveManualAttendance={handleSaveManualAttendanceByIT}
              onResetAttendanceTime={handleResetAttendanceTimeByIT}
              onDeleteAttendance={handleDeleteAttendanceByIT}
              onSaveWorkSchedule={handleSaveWorkSchedule}
              onDeleteWorkSchedule={handleDeleteWorkSchedule}
              onSaveAttendanceSettings={handleSaveAttendanceSettings}
              onSyncFromDatabase={fetchAllData}
            />
          )}
          {currentTab === 'calendar' && (
            <CalendarView 
              reservations={
                isTabAllowedForUser('vouchers', effectiveUserRole, currentUserPermissions, isCurrentAdmin, isITAccount)
                  ? reservations
                  : []
              } 
              tasks={tasks} 
              flights={
                isTabAllowedForUser('services', effectiveUserRole, currentUserPermissions, isCurrentAdmin, isITAccount)
                  ? flights
                  : []
              } 
              tourPackages={
                isTabAllowedForUser('packages', effectiveUserRole, currentUserPermissions, isCurrentAdmin, isITAccount)
                  ? packages
                  : []
              } 
              hotels={hotels}
              inquiries={customerInquiries}
              invoices={invoices}
              canViewInquiries={
                isTabAllowedForUser('customer-inquiries', effectiveUserRole, currentUserPermissions, isCurrentAdmin, isITAccount)
              }
              canViewInvoices={
                isTabAllowedForUser('invoices', effectiveUserRole, currentUserPermissions, isCurrentAdmin, isITAccount)
              }
              canViewHotels={
                isTabAllowedForUser('services', effectiveUserRole, currentUserPermissions, isCurrentAdmin, isITAccount)
              }
            />
          )}
          {currentTab === 'tasks' && (
            <TasksView
              tasks={tasks}
              employees={employees}
              userRole={effectiveUserRole}
              onAddTask={handleAddTask}
              onUpdateTask={handleUpdateTask}
            />
          )}
          {currentTab === 'documents' && (
            <DocumentsView 
              documents={documents}
              customers={customers}
              suppliers={suppliers}
              packages={packages}
              hotels={hotels}
              flights={flights}
              invoices={invoices}
              onUploadDocument={async (newDoc) => {
                try {
                  await fetch('/api/documents', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newDoc)
                  });
                  fetchAllData();
                } catch (err) {
                  console.error("Failed to persist document:", err);
                  setDocuments(prev => [newDoc as any, ...prev]);
                }
              }}
            />
          )}
          {currentTab === 'reports' && (
            <ReportsView 
              reservations={reservations}
              vouchers={vouchers}
              customers={customers} 
              suppliers={suppliers}
              invoices={invoices}
              expenses={expenses}
              payrollRecords={payrollRecords}
              advances={advances}
              commissions={commissions}
              packages={packages}
              hotels={hotels}
              flights={flights}
              employees={employees}
              settings={settings}
              currentCurrency={currentCurrency}
            />
          )}
          {currentTab === 'notifications' && (
            <NotificationsView
              notifications={visibleNotifications}
              onMarkRead={handleMarkNotificationRead}
              onMarkAllRead={handleMarkAllNotificationsRead}
              employees={employees}
              workSchedules={workSchedules}
              attendanceSettings={attendanceSettings}
              currentEmployee={currentEmployee}
              currentUsername={currentUsername}
              currentEmpId={activeSelfId}
              userRole={effectiveUserRole}
              isAdmin={isCurrentAdmin}
              isITAccount={isITAccount}
              onPermissionStatusChange={setPhonePermStatus}
              onShowToast={showToast}
            />
          )}
          {currentTab === 'settings' && (
            <SettingsView 
              settings={settings} 
              onUpdateSettings={handleUpdateSettings} 
              onClearAllData={handleClearAllDatabase}
              userRole={effectiveUserRole}
              isAdmin={isCurrentAdmin}
              dbStatus={dbStatus}
              onVerifyDatabase={handleVerifyDatabase}
              onOpenAdminReset={() => setIsAdminResetModalOpen(true)}
              isITAccount={isITAccount}
              onOpenITSiteControl={() => setIsITSiteModalOpen(true)}
            />
          )}
          {currentTab === 'activity-log' && (
            <ActivityLogView logs={activityLogs} />
          )}
            </>
          )}
        </main>
      </div>

      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        customers={customers}
        reservations={reservations}
        hotels={hotels}
        flights={flights}
        suppliers={suppliers}
      />

      <AiAssistantModal
        isOpen={isAiOpen}
        onClose={() => setIsAiOpen(false)}
      />

      <PermissionModal
        isOpen={permissionModalState.isOpen}
        onClose={() => setPermissionModalState(prev => ({ ...prev, isOpen: false }))}
        actionType={permissionModalState.actionType}
        moduleName={permissionModalState.moduleName}
        itemId={permissionModalState.itemId}
        itemName={permissionModalState.itemName}
        proposedChanges={permissionModalState.proposedChanges}
        currentUsername={currentUsername}
        userRole={effectiveUserRole}
        onSubmitRequest={(reason, changes) => 
          handleSubmitPermissionRequest(
            permissionModalState.moduleName,
            permissionModalState.itemId,
            permissionModalState.itemName,
            permissionModalState.actionType,
            reason,
            changes
          )
        }
      />

      {/* Mobile Bottom Navigation Bar (Android & iOS Ergonomic Access) */}
      <MobileBottomNav
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        pendingPermissionCount={permissionRequests.filter(r => r.status === 'Pending').length}
        onOpenQuickAdd={() => setIsQuickAddOpen(true)}
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        userRole={effectiveUserRole}
        userPermissions={currentUserPermissions}
        isAdmin={isCurrentAdmin}
        isITAccount={isITAccount}
      />

      {showBackToTop && (
        <button
          type="button"
          onClick={() => mainScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-20 end-4 lg:bottom-6 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-slate-900/90 text-cyan-300 shadow-lg border border-slate-700 backdrop-blur-sm transition-colors hover:bg-slate-800 cursor-pointer"
          aria-label={isAr ? 'العودة لأعلى الصفحة' : 'Back to top'}
          title={isAr ? 'العودة لأعلى الصفحة' : 'Back to top'}
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      )}

      {/* Quick Add Modal from Bottom Nav */}
      <MobileQuickActionModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onSelectAction={handleSelectQuickAdd}
        userRole={effectiveUserRole}
        userPermissions={currentUserPermissions}
        isAdmin={isCurrentAdmin}
        isITAccount={isITAccount}
      />

      {/* Administrator-Only Delete All Data Modal */}
      {isCurrentAdmin && (
        <AdminResetDataModal
          isOpen={isAdminResetModalOpen}
          onClose={() => setIsAdminResetModalOpen(false)}
          onConfirmDeleteAll={handleClearAllDatabase}
          isAdmin={isCurrentAdmin}
        />
      )}

      {/* IT Developer Account Exclusive Temporary Site Disable / Enable Modal (Zero Data Deletion) */}
      {isITAccount && (
        <ITMaintenanceControlModal
          isOpen={isITSiteModalOpen}
          onClose={() => setIsITSiteModalOpen(false)}
          isSiteDisabled={isSiteTemporarilyDisabled}
          currentMessage={settings.site_disabled_message || ''}
          onConfirmToggle={handleToggleSiteDisabledByIT}
        />
      )}

      {/* Cloud Connectivity and Offline Indicator */}
      <OfflineIndicator />
    </div>
  );
}
