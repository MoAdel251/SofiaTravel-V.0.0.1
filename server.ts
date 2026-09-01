import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json());

// In-Memory Database Store with Rich Seed Data
let db = {
  settings: {
    company_name: "Sofia Travel",
    logo: "✈️",
    address: "124 Tahrir Square, Cairo, Egypt",
    phone: "+20 2 25750000",
    whatsapp: "+20 100 123 4567",
    email: "operations@sofiatravel.com",
    website: "https://www.sofiatravel.com",
    tax_number: "TR-987654321-001",
    bank_name: "National Bank of Egypt (NBE) - Tahrir Branch",
    bank_account_number: "EG540003001500000010987654321",
    bank_iban_swift: "SWIFT: NBEGEGCX054 / IBAN: EG540003001500000010987654321",
    bank_beneficiary_name: "Sofia Travel S.A.E.",
    default_currency: "USD",
    invoice_prefix: "INV-2026-",
    reservation_prefix: "RES-",
    payment_methods: ["Cash", "Bank Transfer", "Credit Card", "InstaPay", "Other"],
    exchange_rates: [
      { currency: "USD", rate_to_usd: 1.0 },
      { currency: "EUR", rate_to_usd: 0.92 },
      { currency: "GBP", rate_to_usd: 0.78 },
      { currency: "SAR", rate_to_usd: 3.75 },
      { currency: "AED", rate_to_usd: 3.67 },
      { currency: "EGP", rate_to_usd: 48.5 },
    ]
  },
  employees: [],
  customers: [],
  suppliers: [],
  hotels: [],
  flights: [],
  tour_packages: [],
  reservations: [],
  customer_payments: [],
  supplier_payments: [],
  expenses: [],
  tasks: [],
  documents: [],
  notifications: [],
  invoices: [],
  activity_logs: []
};

// Helper function to log activity
function logActivity(userName: string, action: string, module: string, record: string) {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  db.activity_logs.unshift({
    id: 'LOG-' + Math.random().toString(36).substring(2, 9),
    user_name: userName,
    action,
    module,
    record,
    date: dateStr,
    time: timeStr
  });
}

// REST API Endpoints

// Settings
app.get("/api/settings", (req, res) => {
  res.json(db.settings);
});

app.put("/api/settings", (req, res) => {
  db.settings = { ...db.settings, ...req.body };
  logActivity("Administrator", "Updated company settings", "Settings", "Settings");
  res.json(db.settings);
});

// Customers
app.get("/api/customers", (req, res) => {
  res.json(db.customers);
});

app.post("/api/customers", (req, res) => {
  const newCust = {
    id: "CUST-" + Math.random().toString(36).substring(2, 7).toUpperCase(),
    customer_id: "C-" + Math.floor(1000 + Math.random() * 9000),
    registration_date: new Date().toISOString().split('T')[0],
    outstanding_balance: 0,
    currency: "USD",
    ...req.body
  };
  db.customers.push(newCust);
  logActivity("Ahmed Hassan", `Created customer ${newCust.full_name}`, "Customers", newCust.customer_id);
  res.json(newCust);
});

app.put("/api/customers/:id", (req, res) => {
  const { id } = req.params;
  const idx = db.customers.findIndex(c => c.id === id);
  if (idx === -1) return res.status(404).json({ error: "Customer not found" });
  db.customers[idx] = { ...db.customers[idx], ...req.body };
  logActivity("Manager", `Updated customer ${db.customers[idx].full_name}`, "Customers", db.customers[idx].customer_id);
  res.json(db.customers[idx]);
});

app.delete("/api/customers/:id", (req, res) => {
  const { id } = req.params;
  db.customers = db.customers.filter(c => c.id !== id);
  logActivity("Administrator", "Deleted customer", "Customers", id);
  res.json({ success: true });
});

// Reservations
app.get("/api/reservations", (req, res) => {
  res.json(db.reservations);
});

app.post("/api/reservations", (req, res) => {
  const data = req.body;
  const selling = Number(data.selling_price) || 0;
  const cost = Number(data.cost_price) || 0;
  const paid = Number(data.paid_amount) || 0;
  const profit = selling - cost;
  const remaining = Math.max(0, selling - paid);

  const newRes = {
    id: "RES-" + Math.random().toString(36).substring(2, 7).toUpperCase(),
    reservation_id: "RES-" + Math.floor(1000 + Math.random() * 9000),
    booking_date: new Date().toISOString().split('T')[0],
    profit,
    remaining_amount: remaining,
    payment_status: remaining === 0 ? "Paid" : paid > 0 ? "Partially Paid" : "Pending",
    ...data,
    selling_price: selling,
    cost_price: cost,
    paid_amount: paid
  };
  db.reservations.push(newRes);

  // Update customer balance if remaining > 0
  const cust = db.customers.find(c => c.id === newRes.customer_id);
  if (cust) {
    cust.outstanding_balance += remaining;
  }

  logActivity("Karim Nabil", `Created reservation ${newRes.reservation_id}`, "Reservations", newRes.reservation_id);
  res.json(newRes);
});

app.put("/api/reservations/:id", (req, res) => {
  const { id } = req.params;
  const idx = db.reservations.findIndex(r => r.id === id);
  if (idx === -1) return res.status(404).json({ error: "Reservation not found" });
  
  const data = req.body;
  const selling = data.selling_price !== undefined ? Number(data.selling_price) : db.reservations[idx].selling_price;
  const cost = data.cost_price !== undefined ? Number(data.cost_price) : db.reservations[idx].cost_price;
  const paid = data.paid_amount !== undefined ? Number(data.paid_amount) : db.reservations[idx].paid_amount;
  const profit = selling - cost;
  const remaining = Math.max(0, selling - paid);

  db.reservations[idx] = {
    ...db.reservations[idx],
    ...data,
    selling_price: selling,
    cost_price: cost,
    paid_amount: paid,
    profit,
    remaining_amount: remaining,
    payment_status: remaining === 0 ? "Paid" : paid > 0 ? "Partially Paid" : "Pending"
  };

  logActivity("Manager", `Updated reservation ${db.reservations[idx].reservation_id}`, "Reservations", db.reservations[idx].reservation_id);
  res.json(db.reservations[idx]);
});

app.delete("/api/reservations/:id", (req, res) => {
  const { id } = req.params;
  db.reservations = db.reservations.filter(r => r.id !== id);
  logActivity("Administrator", "Deleted reservation", "Reservations", id);
  res.json({ success: true });
});

// Tour Packages
app.get("/api/tour-packages", (req, res) => {
  res.json(db.tour_packages);
});

app.post("/api/tour-packages", (req, res) => {
  const pkg = {
    id: "PKG-" + Math.random().toString(36).substring(2, 7).toUpperCase(),
    ...req.body
  };
  db.tour_packages.push(pkg);
  logActivity("Karim Nabil", `Created tour package ${pkg.package_name}`, "Tour Packages", pkg.package_name);
  res.json(pkg);
});

app.put("/api/tour-packages/:id", (req, res) => {
  const { id } = req.params;
  const idx = db.tour_packages.findIndex(p => p.id === id);
  if (idx === -1) return res.status(404).json({ error: "Package not found" });
  db.tour_packages[idx] = { ...db.tour_packages[idx], ...req.body };
  res.json(db.tour_packages[idx]);
});

app.delete("/api/tour-packages/:id", (req, res) => {
  const { id } = req.params;
  db.tour_packages = db.tour_packages.filter(p => p.id !== id);
  res.json({ success: true });
});

// Hotels
app.get("/api/hotels", (req, res) => {
  res.json(db.hotels);
});

app.post("/api/hotels", (req, res) => {
  const hotel = {
    id: "HOT-" + Math.random().toString(36).substring(2, 7).toUpperCase(),
    ...req.body
  };
  db.hotels.push(hotel);
  res.json(hotel);
});

app.put("/api/hotels/:id", (req, res) => {
  const { id } = req.params;
  const idx = db.hotels.findIndex(h => h.id === id);
  if (idx === -1) return res.status(404).json({ error: "Hotel not found" });
  db.hotels[idx] = { ...db.hotels[idx], ...req.body };
  res.json(db.hotels[idx]);
});

app.delete("/api/hotels/:id", (req, res) => {
  const { id } = req.params;
  db.hotels = db.hotels.filter(h => h.id !== id);
  res.json({ success: true });
});

// Flights
app.get("/api/flights", (req, res) => {
  res.json(db.flights);
});

app.post("/api/flights", (req, res) => {
  const flight = {
    id: "FL-" + Math.random().toString(36).substring(2, 7).toUpperCase(),
    ...req.body
  };
  db.flights.push(flight);
  res.json(flight);
});

app.put("/api/flights/:id", (req, res) => {
  const { id } = req.params;
  const idx = db.flights.findIndex(f => f.id === id);
  if (idx === -1) return res.status(404).json({ error: "Flight not found" });
  db.flights[idx] = { ...db.flights[idx], ...req.body };
  res.json(db.flights[idx]);
});

app.delete("/api/flights/:id", (req, res) => {
  const { id } = req.params;
  db.flights = db.flights.filter(f => f.id !== id);
  res.json({ success: true });
});

// Suppliers
app.get("/api/suppliers", (req, res) => {
  res.json(db.suppliers);
});

app.post("/api/suppliers", (req, res) => {
  const sup = {
    id: "SUP-" + Math.random().toString(36).substring(2, 7).toUpperCase(),
    outstanding_balance: 0,
    ...req.body
  };
  db.suppliers.push(sup);
  res.json(sup);
});

app.put("/api/suppliers/:id", (req, res) => {
  const { id } = req.params;
  const idx = db.suppliers.findIndex(s => s.id === id);
  if (idx === -1) return res.status(404).json({ error: "Supplier not found" });
  db.suppliers[idx] = { ...db.suppliers[idx], ...req.body };
  res.json(db.suppliers[idx]);
});

app.delete("/api/suppliers/:id", (req, res) => {
  const { id } = req.params;
  db.suppliers = db.suppliers.filter(s => s.id !== id);
  res.json({ success: true });
});

// Financials: Customer Payments
app.get("/api/customer-payments", (req, res) => {
  res.json(db.customer_payments);
});

app.post("/api/customer-payments", (req, res) => {
  const pay = {
    id: "PAY-C-" + Math.random().toString(36).substring(2, 7).toUpperCase(),
    payment_id: "CP-" + Math.floor(5000 + Math.random() * 9000),
    date: new Date().toISOString().split('T')[0],
    ...req.body
  };
  db.customer_payments.push(pay);

  // Update customer balance and reservation paid amount
  const cust = db.customers.find(c => c.id === pay.customer_id);
  if (cust) {
    cust.outstanding_balance = Math.max(0, cust.outstanding_balance - Number(pay.amount));
  }

  const resv = db.reservations.find(r => r.id === pay.reservation_id);
  if (resv) {
    resv.paid_amount += Number(pay.amount);
    resv.remaining_amount = Math.max(0, resv.selling_price - resv.paid_amount);
    resv.payment_status = resv.remaining_amount === 0 ? "Paid" : "Partially Paid";
  }

  logActivity("Tarek Lotfy", `Recorded customer payment of $${pay.amount}`, "Finance", pay.payment_id);
  res.json(pay);
});

// Supplier Payments
app.get("/api/supplier-payments", (req, res) => {
  res.json(db.supplier_payments);
});

app.post("/api/supplier-payments", (req, res) => {
  const pay = {
    id: "PAY-S-" + Math.random().toString(36).substring(2, 7).toUpperCase(),
    payment_id: "SP-" + Math.floor(7000 + Math.random() * 9000),
    payment_date: new Date().toISOString().split('T')[0],
    ...req.body
  };
  db.supplier_payments.push(pay);

  const sup = db.suppliers.find(s => s.id === pay.supplier_id);
  if (sup) {
    sup.outstanding_balance = Math.max(0, sup.outstanding_balance - Number(pay.amount));
  }

  logActivity("Tarek Lotfy", `Recorded supplier payment of $${pay.amount}`, "Finance", pay.payment_id || pay.id);
  res.json(pay);
});

// Expenses
app.get("/api/expenses", (req, res) => {
  res.json(db.expenses);
});

app.post("/api/expenses", (req, res) => {
  const exp = {
    id: "EXP-" + Math.random().toString(36).substring(2, 7).toUpperCase(),
    expense_id: "EX-" + Math.floor(300 + Math.random() * 900),
    date: new Date().toISOString().split('T')[0],
    ...req.body
  };
  db.expenses.push(exp);
  logActivity("Tarek Lotfy", `Recorded expense ${exp.category} ($${exp.amount})`, "Finance", exp.expense_id);
  res.json(exp);
});

app.delete("/api/expenses/:id", (req, res) => {
  const { id } = req.params;
  db.expenses = db.expenses.filter(e => e.id !== id);
  res.json({ success: true });
});

// Employees
app.get("/api/employees", (req, res) => {
  // Calculate performance metrics for each employee
  const employeesWithStats = db.employees.map(emp => {
    const empRes = db.reservations.filter(r => r.employee_id === emp.id);
    const reservations_count = empRes.length;
    const total_sales = empRes.reduce((acc, r) => acc + r.selling_price, 0);
    const total_profit = empRes.reduce((acc, r) => acc + r.profit, 0);
    const customerSet = new Set(empRes.map(r => r.customer_id));
    return {
      ...emp,
      reservations_count,
      total_sales,
      total_profit,
      customer_count: customerSet.size
    };
  });
  res.json(employeesWithStats);
});

app.post("/api/employees", (req, res) => {
  const emp = {
    id: "EMP-" + Math.random().toString(36).substring(2, 7).toUpperCase(),
    employee_id: "E-" + Math.floor(200 + Math.random() * 800),
    joining_date: new Date().toISOString().split('T')[0],
    ...req.body
  };
  db.employees.push(emp);
  res.json(emp);
});

app.put("/api/employees/:id", (req, res) => {
  const { id } = req.params;
  const idx = db.employees.findIndex(e => e.id === id);
  if (idx === -1) return res.status(404).json({ error: "Employee not found" });
  db.employees[idx] = { ...db.employees[idx], ...req.body };
  res.json(db.employees[idx]);
});

app.delete("/api/employees/:id", (req, res) => {
  const { id } = req.params;
  db.employees = db.employees.filter(e => e.id !== id);
  res.json({ success: true });
});

// Tasks
app.get("/api/tasks", (req, res) => {
  res.json(db.tasks);
});

app.post("/api/tasks", (req, res) => {
  const task = {
    id: "TSK-" + Math.random().toString(36).substring(2, 7).toUpperCase(),
    ...req.body
  };
  db.tasks.push(task);
  res.json(task);
});

app.put("/api/tasks/:id", (req, res) => {
  const { id } = req.params;
  const idx = db.tasks.findIndex(t => t.id === id);
  if (idx === -1) return res.status(404).json({ error: "Task not found" });
  db.tasks[idx] = { ...db.tasks[idx], ...req.body };
  res.json(db.tasks[idx]);
});

app.delete("/api/tasks/:id", (req, res) => {
  const { id } = req.params;
  db.tasks = db.tasks.filter(t => t.id !== id);
  res.json({ success: true });
});

// Documents
app.get("/api/documents", (req, res) => {
  res.json(db.documents);
});

app.post("/api/documents", (req, res) => {
  const doc = {
    id: "DOC-" + Math.random().toString(36).substring(2, 7).toUpperCase(),
    upload_date: new Date().toISOString().split('T')[0],
    file_size: "1.2 MB",
    file_url: "#",
    ...req.body
  };
  db.documents.push(doc);
  res.json(doc);
});

app.delete("/api/documents/:id", (req, res) => {
  const { id } = req.params;
  db.documents = db.documents.filter(d => d.id !== id);
  res.json({ success: true });
});

// Invoices
app.get("/api/invoices", (req, res) => {
  res.json(db.invoices || []);
});

app.post("/api/invoices", (req, res) => {
  const invCount = (db.invoices?.length || 0) + 1001;
  const newInvoice = {
    id: "INV-" + Math.random().toString(36).substring(2, 7).toUpperCase(),
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
    manager_name: "Ahmed Ali",
    ...req.body
  };

  if (!db.invoices) db.invoices = [];
  db.invoices.unshift(newInvoice);

  // If customer is selected, update customer balance
  if (newInvoice.recipient_type !== 'Supplier' && newInvoice.customer_id) {
    const cust = db.customers.find(c => c.id === newInvoice.customer_id || c.customer_id === newInvoice.customer_id);
    if (cust) {
      cust.outstanding_balance = (cust.outstanding_balance || 0) + Number(newInvoice.balance_due || 0);
    }
  }

  // If supplier is selected, update supplier balance
  if (newInvoice.recipient_type === 'Supplier' && newInvoice.supplier_id) {
    const sup = db.suppliers.find(s => s.id === newInvoice.supplier_id);
    if (sup) {
      sup.outstanding_balance = (sup.outstanding_balance || 0) + Number(newInvoice.balance_due || 0);
    }
  }

  const actorName = newInvoice.created_by_employee || "Ahmed Hassan";
  const recipientName = newInvoice.recipient_type === 'Supplier' ? newInvoice.supplier_name : newInvoice.customer_name;
  logActivity(actorName, `Issued ${newInvoice.recipient_type || 'Customer'} invoice ${newInvoice.invoice_number} to ${recipientName}`, "Invoicing", newInvoice.invoice_number);
  
  // Add a real-time notification with employee attribution
  db.notifications.unshift({
    id: "NOT-" + Math.random().toString(36).substring(2, 7).toUpperCase(),
    title: `Invoice Issued by ${actorName}`,
    message: `[${actorName}] Issued ${newInvoice.recipient_type || 'Customer'} invoice #${newInvoice.invoice_number} for ${recipientName} (${newInvoice.total_amount} ${newInvoice.currency}).`,
    type: "payment",
    date: new Date().toISOString().split('T')[0],
    read: false,
    link_id: newInvoice.id
  });

  res.json(newInvoice);
});

app.put("/api/invoices/:id", (req, res) => {
  const { id } = req.params;
  const index = (db.invoices || []).findIndex(inv => inv.id === id);
  if (index === -1) return res.status(404).json({ error: "Invoice not found" });

  db.invoices[index] = { ...db.invoices[index], ...req.body };
  logActivity("Employee", `Updated invoice ${db.invoices[index].invoice_number}`, "Invoicing", db.invoices[index].invoice_number);
  res.json(db.invoices[index]);
});

app.delete("/api/invoices/:id", (req, res) => {
  const { id } = req.params;
  db.invoices = (db.invoices || []).filter(inv => inv.id !== id);
  logActivity("Employee", `Deleted invoice ${id}`, "Invoicing", id);
  res.json({ success: true });
});

// Notifications
app.get("/api/notifications", (req, res) => {
  res.json(db.notifications);
});

app.put("/api/notifications/:id/read", (req, res) => {
  const { id } = req.params;
  const notif = db.notifications.find(n => n.id === id);
  if (notif) notif.read = true;
  res.json({ success: true });
});

// Activity Logs
app.get("/api/activity-logs", (req, res) => {
  res.json(db.activity_logs);
});

// Dashboard Statistics & Analytics
app.get("/api/dashboard-stats", (req, res) => {
  const total_customers = db.customers.length;
  const active_reservations = db.reservations.filter(r => r.reservation_status === 'Confirmed' || r.reservation_status === 'Pending').length;
  const todayStr = new Date().toISOString().split('T')[0];
  const todays_reservations = db.reservations.filter(r => r.booking_date === todayStr).length;
  const upcoming_trips = db.reservations.filter(r => r.travel_date >= todayStr).length;
  
  const total_sales = db.reservations.reduce((acc, r) => acc + (r.selling_price || 0), 0);
  const total_supplier_costs = db.reservations.reduce((acc, r) => acc + (r.cost_price || 0), 0);
  const total_expenses = db.expenses.reduce((acc, e) => acc + (e.amount || 0), 0);
  const net_profit = total_sales - total_supplier_costs - total_expenses;

  const outstanding_customer_payments = db.customers.reduce((acc, c) => acc + (c.outstanding_balance || 0), 0);
  const outstanding_supplier_payments = db.suppliers.reduce((acc, s) => acc + (s.outstanding_balance || 0), 0);
  const today_tasks = db.tasks.filter(t => t.status !== 'Completed').length;

  // Compute monthly data
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const currentYear = new Date().getFullYear();
  const monthlyData = Array.from({ length: 12 }, (_, i) => ({
    month: monthNames[i],
    Sales: 0,
    Expenses: 0,
    Profit: 0
  }));

  db.reservations.forEach(r => {
    if (!r.booking_date) return;
    const date = new Date(r.booking_date);
    if (date.getFullYear() === currentYear) {
      const monthIdx = date.getMonth();
      monthlyData[monthIdx].Sales += r.selling_price || 0;
      monthlyData[monthIdx].Expenses += r.cost_price || 0;
    }
  });

  db.expenses.forEach(e => {
    if (!e.date) return;
    const date = new Date(e.date);
    if (date.getFullYear() === currentYear) {
      const monthIdx = date.getMonth();
      monthlyData[monthIdx].Expenses += e.amount || 0;
    }
  });

  monthlyData.forEach(m => {
    m.Profit = m.Sales - m.Expenses;
  });

  // Compute Destination Popularity
  const destCounts: Record<string, number> = {};
  db.reservations.forEach(r => {
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

  // Compute Top Agent
  const agentSales: Record<string, number> = {};
  db.reservations.forEach(r => {
    if (r.employee_name) {
      agentSales[r.employee_name] = (agentSales[r.employee_name] || 0) + (r.selling_price || 0);
    }
  });
  
  let topAgent = { name: "No data", sales: 0 };
  for (const [name, sales] of Object.entries(agentSales)) {
    if (sales > topAgent.sales) {
      topAgent = { name, sales };
    }
  }

  res.json({
    total_customers,
    active_reservations,
    todays_reservations,
    upcoming_trips,
    total_sales,
    total_expenses,
    net_profit,
    outstanding_customer_payments,
    outstanding_supplier_payments,
    today_tasks,
    recent_reservations: db.reservations.slice(-5).reverse(),
    recent_payments: db.customer_payments.slice(-5).reverse(),
    recent_activities: db.activity_logs.slice(-6).reverse(),
    monthlyData,
    destinationPopularity,
    topAgent
  });
});

// Gemini AI Assistant Integration
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

app.post("/api/ai-assistant", async (req, res) => {
  try {
    const { prompt } = req.body;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [{ text: `You are an expert AI travel agency advisor for Sofia Travel Management System. Provide professional, concise tourism business advice, destination recommendations, or financial insights based on this query: ${prompt}` }]
        }
      ]
    });
    res.json({ answer: response.text });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "AI Error" });
  }
});

async function startServer() {
  // Vite middleware for development or static serving for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Sofia Travel Management System running on http://localhost:${PORT}`);
  });
}

startServer();
