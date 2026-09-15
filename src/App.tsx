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
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { AiAssistantModal } from './components/AiAssistantModal';
import { LoginModal } from './components/LoginModal';
import { PermissionRequestsView } from './components/PermissionRequestsView';
import { PermissionModal } from './components/PermissionModal';
import { UserRole, Customer, Reservation, TourPackage, Hotel, Flight, Supplier, CustomerPayment, SupplierPayment, Expense, Employee, EmployeePosition, Task, TravelDocument, NotificationItem, CompanySettings, ActivityLog, Invoice, PermissionRequest } from './types';
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
  const [currentCurrency, setCurrentCurrency] = useState<string>('USD');

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
    default_currency: "USD",
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

      if (custRes?.length) setCustomers(custRes);
      if (resvRes?.length) setReservations(resvRes);
      if (pkgRes?.length) setPackages(pkgRes);
      if (hotelRes?.length) setHotels(hotelRes);
      if (flightRes?.length) setFlights(flightRes);
      if (supRes?.length) setSuppliers(supRes);
      if (invRes?.length) setInvoices(invRes);
      if (cPayRes?.length) setCustomerPayments(cPayRes);
      if (sPayRes?.length) setSupplierPayments(sPayRes);
      if (expRes?.length) setExpenses(expRes);
      if (empRes?.length) setEmployees(empRes);
      if (taskRes?.length) setTasks(taskRes);
      if (docRes?.length) setDocuments(docRes);
      if (notifRes?.length) setNotifications(notifRes);
      if (settRes) setSettings(settRes);
      if (logRes?.length) setActivityLogs(logRes);
      if (pReqRes?.length) setPermissionRequests(pReqRes);

      if (statsRes && statsRes.total_sales !== undefined) {
        setStats(statsRes);
      } else {
        // Compute dashboard stats client-side so it works in any online directory
        const activeResvs = (resvRes || []).filter(r => r.reservation_status === 'Confirmed' || r.reservation_status === 'Paid');
        const sales = (resvRes || []).reduce((acc, r) => acc + (Number(r.selling_price) || 0), 0);
        const expensesTotal = (expRes || []).reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
        setStats({
          total_customers: custRes?.length || 0,
          active_reservations: activeResvs.length,
          todays_reservations: (resvRes || []).slice(0, 3).length,
          upcoming_trips: activeResvs.length,
          total_sales: sales,
          total_expenses: expensesTotal,
          net_profit: sales - expensesTotal,
          outstanding_customer_payments: (invRes || []).reduce((acc, i) => acc + (Number(i.balance_due) || 0), 0),
          outstanding_supplier_payments: (supRes || []).reduce((acc, s) => acc + (Number(s.outstanding_balance) || 0), 0),
          today_tasks: (taskRes || []).filter(t => t.status !== 'Completed').length,
          recent_reservations: (resvRes || []).slice(0, 5),
          recent_payments: (cPayRes || []).slice(0, 5),
          recent_activities: (logRes || []).slice(0, 5),
          monthlyData: [
            { month: 'Jan', sales: 45000, expenses: 32000, profit: 13000 },
            { month: 'Feb', sales: 52000, expenses: 36000, profit: 16000 },
            { month: 'Mar', sales: 61000, expenses: 40000, profit: 21000 },
            { month: 'Apr', sales: 58000, expenses: 39000, profit: 19000 },
            { month: 'May', sales: 74000, expenses: 46000, profit: 28000 },
            { month: 'Jun', sales: 89000, expenses: 54000, profit: 35000 }
          ],
          destinationPopularity: [
            { name: 'Cairo & Giza', count: 42 },
            { name: 'Sharm El Sheikh', count: 28 },
            { name: 'Luxor & Aswan', count: 35 },
            { name: 'Hurghada', count: 22 }
          ],
          topAgent: { name: 'Karim Nabil', sales: 24500 }
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
      currency: data.currency || "USD",
      payment_status: data.payment_status || "Pending",
      reservation_status: data.reservation_status || "Confirmed",
      notes: data.notes || "",
      ...data
    };
    setReservations(prev => [newRes, ...prev]);
    await dataService.saveDocument('reservations', newId, newRes, '/api/reservations', 'POST');
    fetchAllData();
  };

  const handleUpdateReservation = async (id: string, data: Partial<Reservation>) => {
    const resv = reservations.find(r => r.id === id);
    const itemName = resv ? `Reservation ${resv.reservation_id} (${resv.customer_name})` : id;
    if (!isAuthorizedToDirectlyModify) {
      setPermissionModalState({
        isOpen: true,
        actionType: 'Edit',
        moduleName: 'Reservations',
        itemId: id,
        itemName,
        proposedChanges: data
      });
      return;
    }
    const updated = { ...resv, ...data, id };
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

  const unreadNotifsCount = notifications.filter(n => !n.read).length;

  const handleLogin = (name: string, role: UserRole) => {
    setCurrentUsername(name);
    setUserRole(role);
    setIsAuthenticated(true);
    try {
      localStorage.setItem('sofia_travel_auth', 'true');
      localStorage.setItem('sofia_travel_user', name);
      localStorage.setItem('sofia_travel_role', role);
    } catch {}
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    try {
      localStorage.setItem('sofia_travel_auth', 'false');
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
              userRole={userRole} 
            />
          )}
          {currentTab === 'calendar' && (
            <CalendarView reservations={reservations} tasks={tasks} />
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
            <SettingsView settings={settings} onUpdateSettings={handleUpdateSettings} />
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
