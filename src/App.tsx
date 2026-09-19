import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { CustomersView } from './components/CustomersView';
import { ReservationsView } from './components/ReservationsView';
import { TourPackagesView } from './components/TourPackagesView';
import { HotelsView } from './components/HotelsView';
import { FlightsView } from './components/FlightsView';
import { SuppliersView } from './components/SuppliersView';
import { FinanceView } from './components/FinanceView';
import { InvoicesView } from './components/InvoicesView';
import { EmployeesView } from './components/EmployeesView';
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
import { PermissionRequestsView } from './components/PermissionRequestsView';
import { PermissionModal } from './components/PermissionModal';
import { UserRole, Customer, Reservation, TourPackage, Hotel, Flight, Supplier, CustomerPayment, SupplierPayment, Expense, Employee, EmployeePosition, Task, TravelDocument, NotificationItem, CompanySettings, ActivityLog, Invoice, PermissionRequest, PayrollRecord, EmployeeAdvance, CommissionRecord, FinanceAuditLog } from './types';
import { dataService } from './services/dataService';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [userRole, setUserRole] = useState<UserRole>(() => {
    return (localStorage.getItem('sofia_travel_role') as UserRole) || 'Administrator';
  });
  const [currentUsername, setCurrentUsername] = useState<string>(() => {
    return localStorage.getItem('sofia_travel_user') || 'Admin';
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('sofia_travel_auth') !== 'false';
  });
  const [currentCurrency, setCurrentCurrency] = useState<string>('EGP');

  // Selected package for booking flow auto-population
  const [selectedBookingPackage, setSelectedBookingPackage] = useState<TourPackage | null>(null);

  // Modals state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);

  // Data states
  const [stats, setStats] = useState<any>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
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
    logo: "✈️",
    address: "124 Tahrir Square, Cairo",
    phone: "+20 2 25750000",
    whatsapp: "+20 100 123 4567",
    email: "operations@sofiatravel.com",
    website: "https://www.sofiatravel.com",
    tax_number: "TR-98765",
    default_currency: "EGP",
    invoice_prefix: "INV-",
    reservation_prefix: "RES-",
    payment_methods: ["Cash", "Bank Transfer", "Credit Card"],
    exchange_rates: []
  });
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
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

  const isAuthorizedToDirectlyModify = userRole === 'Administrator' || userRole === 'Manager' || userRole === 'Accountant';

  // Fetch all data on mount
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [
        statsRes,
        custRes,
        resvRes,
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
        pReqRes
      ] = await Promise.all([
        fetch('/api/dashboard-stats?t=' + Date.now()).then(r => r.json()).catch(() => null),
        dataService.getCollection<Customer>('customers', '/api/customers', customers),
        dataService.getCollection<Reservation>('reservations', '/api/reservations', reservations),
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
      ]);

      setCustomers(custRes || []);
      setReservations(resvRes || []);
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
      if (settRes) setSettings(settRes);
      setActivityLogs(logRes || []);
      setPermissionRequests(pReqRes || []);

      if (statsRes && statsRes.total_sales !== undefined) {
        setStats(statsRes);
      } else {
        // Compute dashboard stats client-side based on actual database records
        const activeResvs = (resvRes || []).filter(r => r.reservation_status === 'Confirmed' || r.reservation_status === 'Pending' || r.reservation_status === 'Paid' || r.reservation_status === 'Partially Paid');
        const todayStr = new Date().toISOString().split('T')[0];
        const todaysResvCount = (resvRes || []).filter(r => r.booking_date === todayStr).length;
        const upcomingTripsCount = (resvRes || []).filter(r => r.travel_date && r.travel_date >= todayStr).length;

        const sales = (resvRes || []).reduce((acc, r) => acc + (Number(r.selling_price) || 0), 0);
        const supplierCosts = (resvRes || []).reduce((acc, r) => acc + (Number(r.cost_price) || 0), 0);
        const expensesTotal = (expRes || []).reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
        const netProfit = sales - supplierCosts - expensesTotal;

        const outstandingCustomer = (custRes || []).reduce((acc, c) => acc + (Number(c.outstanding_balance) || 0), 0);
        const outstandingSupplier = (supRes || []).reduce((acc, s) => acc + (Number(s.outstanding_balance) || 0), 0);

        const outstandingByCurr: Record<string, number> = {};
        (resvRes || []).forEach(r => {
          const rem = Number(r.remaining_amount) || (Number(r.selling_price || 0) - Number(r.paid_amount || 0));
          if (rem > 0) {
            const curr = r.currency || 'USD';
            outstandingByCurr[curr] = (outstandingByCurr[curr] || 0) + rem;
          }
        });
        if (Object.keys(outstandingByCurr).length === 0) {
          (custRes || []).forEach(c => {
            const bal = Number(c.outstanding_balance) || 0;
            if (bal > 0) {
              const curr = c.currency || 'USD';
              outstandingByCurr[curr] = (outstandingByCurr[curr] || 0) + bal;
            }
          });
        }

        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const currentYear = new Date().getFullYear();
        const monthlyData = Array.from({ length: 12 }, (_, i) => ({
          month: monthNames[i],
          Sales: 0,
          Expenses: 0,
          Profit: 0
        }));

        (resvRes || []).forEach(r => {
          if (!r.booking_date) return;
          const date = new Date(r.booking_date);
          if (date.getFullYear() === currentYear) {
            const monthIdx = date.getMonth();
            monthlyData[monthIdx].Sales += Number(r.selling_price) || 0;
            monthlyData[monthIdx].Expenses += Number(r.cost_price) || 0;
          }
        });
        (expRes || []).forEach(e => {
          if (!e.date) return;
          const date = new Date(e.date);
          if (date.getFullYear() === currentYear) {
            const monthIdx = date.getMonth();
            monthlyData[monthIdx].Expenses += Number(e.amount) || 0;
          }
        });
        monthlyData.forEach(m => {
          m.Profit = m.Sales - m.Expenses;
        });

        const destCounts: Record<string, number> = {};
        (resvRes || []).forEach(r => {
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
        (resvRes || []).forEach(r => {
          if (r.employee_name) {
            agentSales[r.employee_name] = (agentSales[r.employee_name] || 0) + (Number(r.selling_price) || 0);
          }
        });
        let topAgent = { name: "No data", sales: 0 };
        for (const [name, sales] of Object.entries(agentSales)) {
          if (sales > topAgent.sales) {
            topAgent = { name, sales };
          }
        }

        setStats({
          total_customers: custRes?.length || 0,
          active_reservations: activeResvs.length,
          todays_reservations: todaysResvCount,
          upcoming_trips: upcomingTripsCount,
          total_sales: sales,
          total_expenses: expensesTotal,
          net_profit: netProfit,
          outstanding_customer_payments: outstandingCustomer,
          outstanding_supplier_payments: outstandingSupplier,
          outstanding_by_currency: outstandingByCurr,
          today_tasks: (taskRes || []).filter(t => t.status !== 'Completed').length,
          recent_reservations: (resvRes || []).slice(-5).reverse(),
          recent_payments: (cPayRes || []).slice(-5).reverse(),
          recent_activities: (logRes || []).slice(-6).reverse(),
          monthlyData,
          destinationPopularity,
          topAgent
        });
      }
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
    await fetch('/api/permission-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employee_id: currentUsername,
        employee_name: currentUsername,
        employee_role: userRole,
        module: moduleName,
        item_id: itemId,
        item_name: itemName,
        action_type: actionType,
        reason,
        proposed_changes: proposedChanges
      })
    });
    fetchAllData();
  };

  const handleApprovePermissionRequest = async (id: string) => {
    await fetch(`/api/permission-requests/${id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewer_name: currentUsername })
    });
    fetchAllData();
  };

  const handleRejectPermissionRequest = async (id: string, reason?: string) => {
    await fetch(`/api/permission-requests/${id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewer_name: currentUsername, rejection_reason: reason })
    });
    fetchAllData();
  };

  // CRUD Handlers with RBAC Permission Intercepts and Dual Cloud Persistence
  const handleAddInvoice = async (data: Partial<Invoice>) => {
    const newId = "INV-" + Math.random().toString(36).substring(2, 7).toUpperCase();
    const invCount = (invoices?.length || 0) + 1001;
    const newInvoice: Invoice = {
      id: newId,
      invoice_number: `INV-2026-${invCount}`,
      issue_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      currency: "USD",
      items: [],
      subtotal: 0,
      discount: 0,
      tax_rate: 0,
      tax_amount: 0,
      total_amount: 0,
      paid_amount: 0,
      balance_due: 0,
      payment_status: "Unpaid",
      manager_name: currentUsername || "Admin",
      customer_id: "",
      customer_name: "",
      recipient_type: "Customer",
      ...data
    };
    setInvoices(prev => [newInvoice, ...prev]);
    await dataService.saveDocument('invoices', newId, newInvoice, '/api/invoices', 'POST');
    fetchAllData();
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
    const newCust: Customer = {
      id: newId,
      customer_id: `C-${custCount}`,
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
      customer_id: data.customer_id || "",
      customer_name: data.customer_name || "Guest",
      service_type: data.service_type || "Tour",
      booking_date: new Date().toISOString().split('T')[0],
      travel_date: data.travel_date || new Date().toISOString().split('T')[0],
      return_date: data.return_date || new Date().toISOString().split('T')[0],
      number_of_travelers: Number(data.number_of_travelers) || 1,
      destination: data.destination || "Egypt",
      supplier_id: data.supplier_id || "SUP-001",
      supplier_name: data.supplier_name || "Partner",
      employee_id: currentUsername || "Admin",
      employee_name: currentUsername || "Admin",
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
    const updated = { ...resv, ...sanitizedData, id };
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
    const newId = `EMP-${Date.now().toString(36).toUpperCase()}`;
    const empPos = (data.position || 'Sales') as EmployeePosition;
    const empRecord: Employee = {
      id: newId,
      employee_id: `E-${Math.floor(100 + Math.random() * 900)}`,
      name: data.name || 'Staff Member',
      phone: data.phone || '',
      email: data.email || '',
      position: empPos,
      department: data.department || 'Sales',
      joining_date: data.joining_date || new Date().toISOString().split('T')[0],
      salary: Number(data.salary) || 1200,
      commission_rate: Number(data.commission_rate) || 5,
      status: data.status || 'Active',
      username: data.username || `emp_${Date.now().toString(36)}`,
      password: data.password || 'Sofia@123',
      reservations_count: 0,
      total_sales: 0,
      total_profit: 0,
      ...data
    };
    setEmployees(prev => [empRecord, ...prev]);
    await dataService.saveDocument('employees', newId, empRecord, '/api/employees', 'POST');
    fetchAllData();
  };

  const handleEditEmployee = async (id: string, data: Partial<Employee>) => {
    const emp = employees.find(e => e.id === id);
    const itemName = emp ? `Employee ${emp.name}` : id;
    if (!isAuthorizedToDirectlyModify) {
      setPermissionModalState({
        isOpen: true,
        actionType: 'Edit',
        moduleName: 'Employees',
        itemId: id,
        itemName,
        proposedChanges: data
      });
      return;
    }
    const updated = {
      ...emp,
      ...data,
      name: data.name || emp?.name || 'Staff Member',
      position: (data.position || emp?.position || 'Sales') as EmployeePosition
    };
    setEmployees(prev => prev.map(e => (e.id === id ? (updated as Employee) : e)));
    await dataService.saveDocument('employees', id, updated, `/api/employees/${id}`, 'PUT');
    fetchAllData();
  };

  const handleDeleteEmployee = async (id: string) => {
    const emp = employees.find(e => e.id === id);
    const itemName = emp ? `Employee ${emp.name}` : id;
    if (!isAuthorizedToDirectlyModify) {
      setPermissionModalState({
        isOpen: true,
        actionType: 'Delete',
        moduleName: 'Employees',
        itemId: id,
        itemName
      });
      return;
    }
    setEmployees(prev => prev.filter(e => e.id !== id));
    await dataService.deleteDocument('employees', id, `/api/employees/${id}`);
    fetchAllData();
  };

  const handleAddExpense = async (data: any) => {
    const newId = "EXP-" + Math.random().toString(36).substring(2, 7).toUpperCase();
    const newExp: Expense = {
      id: newId,
      expense_id: `EXP-2026-${(expenses?.length || 0) + 101}`,
      category: data.category || "Office",
      description: data.description || "General expense",
      amount: Number(data.amount) || 0,
      currency: "USD",
      date: data.date || new Date().toISOString().split('T')[0],
      employee_id: currentUsername || "Admin",
      employee_name: currentUsername || "Admin",
      payment_method: data.payment_method || "Cash",
      notes: data.notes || "",
      ...data
    };
    setExpenses(prev => [newExp, ...prev]);
    await dataService.saveDocument('expenses', newId, newExp, '/api/expenses', 'POST');
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

  const handleGeneratePayroll = (month: string) => {
    const generated: PayrollRecord[] = employees.map(emp => ({
      id: `PAY-${month}-${emp.id}`,
      payroll_month: month,
      employee_id: emp.id,
      employee_name: emp.name,
      job_title: emp.position,
      department: emp.department || 'General',
      basic_salary: emp.salary || 5000,
      allowances: 500,
      commission: 250,
      bonus: 100,
      deductions: 150,
      advances: 100,
      net_salary: (emp.salary || 5000) + 500 + 250 + 100 - 150 - 100,
      currency: 'USD',
      status: 'Pending'
    }));
    setPayrollRecords(prev => [...generated.filter(g => !prev.some(p => p.id === g.id)), ...prev]);
  };

  const handleUpdatePayrollStatus = (id: string, status: 'Pending' | 'Partially Paid' | 'Paid', details?: any) => {
    setPayrollRecords(prev => prev.map(p => p.id === id ? { ...p, status, ...details } : p));
  };

  const handleAddAdvance = (adv: EmployeeAdvance) => {
    setAdvances(prev => [adv, ...prev]);
  };

  const handleUpdateAdvance = (adv: EmployeeAdvance) => {
    setAdvances(prev => prev.map(a => a.id === adv.id ? adv : a));
  };

  const handleDeleteAdvance = (id: string) => {
    setAdvances(prev => prev.filter(a => a.id !== id));
  };

  const handleAddCommission = (comm: CommissionRecord) => {
    setCommissions(prev => [comm, ...prev]);
  };

  const handleDeleteCommission = (id: string) => {
    setCommissions(prev => prev.filter(c => c.id !== id));
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

  const handleMarkNotificationRead = async (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
    await dataService.saveDocument('notifications', id, { read: true }, `/api/notifications/${id}/read`, 'PUT');
    fetchAllData();
  };

  const handleUpdateSettings = async (newSettings: CompanySettings) => {
    setSettings(newSettings);
    await dataService.saveDocument('settings', 'company_settings', newSettings, '/api/settings', 'PUT');
    fetchAllData();
  };

  const handleClearAllDatabase = async () => {
    dataService.clearLocalCache();
    setCustomers([]);
    setReservations([]);
    setPackages([]);
    setHotels([]);
    setFlights([]);
    setSuppliers([]);
    setInvoices([]);
    setCustomerPayments([]);
    setSupplierPayments([]);
    setExpenses([]);
    setEmployees([]);
    setTasks([]);
    setDocuments([]);
    setNotifications([]);
    setActivityLogs([]);
    setPermissionRequests([]);
    setStats({
      total_customers: 0,
      active_reservations: 0,
      todays_reservations: 0,
      upcoming_trips: 0,
      total_sales: 0,
      total_expenses: 0,
      net_profit: 0,
      outstanding_customer_payments: 0,
      outstanding_supplier_payments: 0,
      today_tasks: 0,
      low_stock_alerts: 0,
      unread_notifications: 0
    });
    try {
      await fetch('/api/admin/clear-all-data', { method: 'POST' });
    } catch {}
    await fetchAllData();
  };

  const unreadNotifsCount = notifications.filter(n => !n.read).length;

  const [currentEmpId, setCurrentEmpId] = useState<string>(() => {
    return localStorage.getItem('sofia_travel_emp_id') || '';
  });

  const currentEmployee = employees.find(e => 
    (currentEmpId && (e.id === currentEmpId || e.employee_id === currentEmpId)) ||
    (e.username === currentUsername || e.name === currentUsername)
  );
  
  const isCurrentAdmin = userRole === 'Administrator' || currentEmployee?.is_admin === true || currentEmployee?.position === 'Administrator';
  const currentUserPermissions = isCurrentAdmin ? [] : (currentEmployee?.permissions || []);

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

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans flex-col">
      {!isAuthenticated && (
        <LoginModal employees={employees}
          onLogin={handleLogin}
          companyName={settings.company_name}
        />
      )}

      <Navbar
        userRole={userRole}
        userPermissions={currentUserPermissions}
        setUserRole={setUserRole}
        currentCurrency={currentCurrency}
        setCurrentCurrency={setCurrentCurrency}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenAi={() => setIsAiOpen(true)}
        notifications={notifications}
        pendingPermissionCount={permissionRequests.filter(r => r.status === 'Pending').length}
        onMarkNotificationRead={handleMarkNotificationRead}
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        username={currentUsername}
        companyName={settings.company_name}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <main className="flex-1">
          {currentTab === 'dashboard' && <DashboardView stats={stats} currentCurrency={currentCurrency} />}

          {currentTab === 'permission-requests' && (
            <PermissionRequestsView
              requests={permissionRequests}
              userRole={userRole}
              currentUsername={currentUsername}
              onApproveRequest={handleApprovePermissionRequest}
              onRejectRequest={handleRejectPermissionRequest}
            />
          )}

          {currentTab === 'customers' && (
            <CustomersView
              customers={customers}
              invoices={invoices}
              reservations={reservations}
              settings={settings}
              onAddCustomer={handleAddCustomer}
              onUpdateCustomer={handleUpdateCustomer}
              onDeleteCustomer={handleDeleteCustomer}
            />
          )}
          {currentTab === 'reservations' && (
            <ReservationsView
              reservations={reservations}
              customers={customers}
              suppliers={suppliers}
              employees={employees}
              packages={packages}
              initialPackage={selectedBookingPackage}
              onClearInitialPackage={() => setSelectedBookingPackage(null)}
              onAddReservation={handleAddReservation}
              onUpdateReservation={handleUpdateReservation}
              onDeleteReservation={handleDeleteReservation}
            />
          )}
          {currentTab === 'packages' && (
            <TourPackagesView 
              packages={packages} 
              onAddPackage={handleAddPackage}
              onUpdatePackage={handleUpdatePackage}
              onDeletePackage={handleDeletePackage}
              onBookPackage={(pkg) => {
                setSelectedBookingPackage(pkg);
                setCurrentTab('reservations');
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
              userRole={userRole}
              currentUsername={currentUsername}
              expenses={expenses}
              onAddExpense={handleAddExpense}
              onUpdateExpense={handleUpdateExpense}
              onDeleteExpense={handleDeleteExpense}
              payrollRecords={payrollRecords}
              onGeneratePayroll={handleGeneratePayroll}
              onUpdatePayrollStatus={handleUpdatePayrollStatus}
              advances={advances}
              onAddAdvance={handleAddAdvance}
              onUpdateAdvance={handleUpdateAdvance}
              onDeleteAdvance={handleDeleteAdvance}
              commissions={commissions}
              onAddCommission={handleAddCommission}
              onDeleteCommission={handleDeleteCommission}
              reservations={reservations}
              suppliers={suppliers}
              employees={employees}
              auditLogs={financeAuditLogs}
              onAddAuditLog={handleAddAuditLog}
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
              settings={settings}
              onAddInvoice={handleAddInvoice}
              onUpdateInvoice={handleUpdateInvoice}
              onDeleteInvoice={handleDeleteInvoice}
              userRole={userRole}
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
              userRole={userRole}
              userPermissions={currentUserPermissions}
              onAddAuditLog={handleAddAuditLog}
              currentUsername={currentUsername}
            />
          )}
          {currentTab === 'calendar' && (
            <CalendarView 
              reservations={reservations} 
              tasks={tasks} 
              flights={flights} 
              tourPackages={packages} 
              hotels={hotels} 
            />
          )}
          {currentTab === 'tasks' && (
            <TasksView
              tasks={tasks}
              employees={employees}
              userRole={userRole}
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
              customers={customers} 
              suppliers={suppliers}
              invoices={invoices}
              packages={packages}
              hotels={hotels}
              flights={flights}
              employees={employees}
              settings={settings}
              currentCurrency={currentCurrency}
            />
          )}
          {currentTab === 'notifications' && (
            <NotificationsView notifications={notifications} onMarkRead={handleMarkNotificationRead} />
          )}
          {currentTab === 'settings' && (
            <SettingsView 
              settings={settings} 
              onUpdateSettings={handleUpdateSettings} 
              onClearAllData={handleClearAllDatabase}
              userRole={userRole}
            />
          )}
          {currentTab === 'activity-log' && (
            <ActivityLogView logs={activityLogs} />
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
        userRole={userRole}
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
    </div>
  );
}
