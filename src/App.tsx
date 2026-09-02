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
import { UserRole, Customer, Reservation, TourPackage, Hotel, Flight, Supplier, CustomerPayment, SupplierPayment, Expense, Employee, Task, TravelDocument, NotificationItem, CompanySettings, ActivityLog, Invoice } from './types';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [userRole, setUserRole] = useState<UserRole>('Administrator');
  const [currentUsername, setCurrentUsername] = useState<string>('Admin');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
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

  // Fetch all data on mount
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => { console.log("Fetching all data..."); 
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
        logRes
      ] = await Promise.all([
        fetch('/api/dashboard-stats').then(r => r.json()).catch(() => ({
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
      recent_reservations: [],
      recent_payments: [],
      recent_activities: [],
      monthlyData: [],
      destinationPopularity: [],
      topAgent: { name: 'No data', sales: 0 }
})),
        fetch('/api/customers').then(r => r.json()).catch(() => []),
        fetch('/api/reservations').then(r => r.json()).catch(() => []),
        fetch('/api/tour-packages').then(r => r.json()).catch(() => []),
        fetch('/api/hotels').then(r => r.json()).catch(() => []),
        fetch('/api/flights').then(r => r.json()).catch(() => []),
        fetch('/api/suppliers').then(r => r.json()).catch(() => []),
        fetch('/api/invoices').then(r => r.json()).catch(() => []),
        fetch('/api/customer-payments').then(r => r.json()).catch(() => []),
        fetch('/api/supplier-payments').then(r => r.json()).catch(() => []),
        fetch('/api/expenses').then(r => r.json()).catch(() => []),
        fetch('/api/employees').then(r => r.json()).catch(() => []),
        fetch('/api/tasks').then(r => r.json()).catch(() => []),
        fetch('/api/documents').then(r => r.json()).catch(() => []),
        fetch('/api/notifications').then(r => r.json()).catch(() => []),
        fetch('/api/settings').then(r => r.json()).catch(() => null),
        fetch('/api/activity-logs').then(r => r.json()).catch(() => []),
      ]);

      console.log("Setting stats:", statsRes); setStats(statsRes);
      setCustomers(custRes);
      setReservations(resvRes);
      setPackages(pkgRes);
      setHotels(hotelRes);
      setFlights(flightRes);
      setSuppliers(supRes);
      setInvoices(invRes || []);
      setCustomerPayments(cPayRes);
      setSupplierPayments(sPayRes);
      setExpenses(expRes);
      setEmployees(empRes);
      setTasks(taskRes);
      setDocuments(docRes);
      setNotifications(notifRes);
      if (settRes) setSettings(settRes);
      setActivityLogs(logRes);
    } catch (err) { console.error("TEST SCRIPT ERROR CATCH:", err);
      console.error("Error fetching data:", err);
    }
  };

  // CRUD Handlers
  const handleAddInvoice = async (data: Partial<Invoice>) => {
    await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    fetchAllData();
  };

  const handleUpdateInvoice = async (id: string, data: Partial<Invoice>) => {
    await fetch(`/api/invoices/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    fetchAllData();
  };

  const handleDeleteInvoice = async (id: string) => {
    await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
    fetchAllData();
  };
  const handleAddCustomer = async (data: Partial<Customer>) => {
    await fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    fetchAllData();
  };

  const handleUpdateCustomer = async (id: string, data: Partial<Customer>) => {
    await fetch(`/api/customers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    fetchAllData();
  };

  const handleDeleteCustomer = async (id: string) => {
    await fetch(`/api/customers/${id}`, { method: 'DELETE' });
    fetchAllData();
  };

  const handleAddReservation = async (data: Partial<Reservation>) => {
    await fetch('/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    fetchAllData();
  };

  const handleUpdateReservation = async (id: string, data: Partial<Reservation>) => {
    await fetch(`/api/reservations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    fetchAllData();
  };

  const handleDeleteReservation = async (id: string) => {
    await fetch(`/api/reservations/${id}`, { method: 'DELETE' });
    fetchAllData();
  };

  const handleAddPackage = async (data: Partial<TourPackage>) => {
    await fetch('/api/tour-packages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    fetchAllData();
  };

  const handleAddHotel = async (data: Partial<Hotel>) => {
    await fetch('/api/hotels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    fetchAllData();
  };

  const handleAddFlight = async (data: Partial<Flight>) => {
    await fetch('/api/flights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    fetchAllData();
  };

  const handleAddSupplier = async (data: Partial<Supplier>) => {
    await fetch('/api/suppliers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    fetchAllData();
  };

  const handleAddEmployee = async (data: Partial<Employee>) => {
    await fetch('/api/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    fetchAllData();
  };

  const handleEditEmployee = async (id: string, data: Partial<Employee>) => {
    await fetch(`/api/employees/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    fetchAllData();
  };

  const handleDeleteEmployee = async (id: string) => {
    await fetch(`/api/employees/${id}`, { method: 'DELETE' });
    fetchAllData();
  };

  const handleAddExpense = async (data: any) => {
    await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    fetchAllData();
  };

  const handleAddTask = async (data: Partial<Task>) => {
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    fetchAllData();
  };

  const handleUpdateTask = async (id: string, data: Partial<Task>) => {
    await fetch(`/api/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    fetchAllData();
  };

  const handleMarkNotificationRead = async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: 'PUT' });
    fetchAllData();
  };

  const handleUpdateSettings = async (newSettings: CompanySettings) => {
    await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSettings)
    });
    fetchAllData();
  };

  const unreadNotifsCount = notifications.filter(n => !n.read).length;

  const handleLogin = (name: string, role: UserRole) => {
    setCurrentUsername(name);
    setUserRole(role);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans flex-col">
      {!isAuthenticated && (
        <LoginModal
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
              onBookPackage={(pkg) => {
                setSelectedBookingPackage(pkg);
                setCurrentTab('reservations');
              }} 
            />
          )}
          {currentTab === 'hotels' && (
            <HotelsView hotels={hotels} onAddHotel={handleAddHotel} />
          )}
          {currentTab === 'flights' && (
            <FlightsView flights={flights} onAddFlight={handleAddFlight} />
          )}
          {currentTab === 'suppliers' && (
            <SuppliersView 
              suppliers={suppliers} 
              invoices={invoices}
              reservations={reservations}
              settings={settings}
              onAddSupplier={handleAddSupplier} 
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
              onUploadDocument={(newDoc) => {
                setDocuments(prev => [newDoc as any, ...prev]);
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
    </div>
  );
}
