
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, getDocs, deleteDoc, getDocFromServer } from "firebase/firestore";

let appDirname = process.cwd();
try {
  appDirname = path.dirname(fileURLToPath(import.meta.url));
} catch {
  appDirname = process.cwd();
}

let firebaseConfig: any = {
  apiKey: "AIzaSyDTJtJ0loKB65G5Mux6-tiTUrdi3n8qd2U",
  authDomain: "tidal-dynamics-s54g5.firebaseapp.com",
  projectId: "tidal-dynamics-s54g5",
  storageBucket: "tidal-dynamics-s54g5.firebasestorage.app",
  messagingSenderId: "879700596249",
  appId: "1:879700596249:web:09aba9e86995c144cf3c88"
};
let firestoreDatabaseId: string | undefined = "ai-studio-sofiatravelmanag-d5250360-2f13-4e61-9f65-9d2693ac8c37";

const candidatePaths = [
  path.join(process.cwd(), 'firebase-applet-config.json'),
  path.join(appDirname, 'firebase-applet-config.json'),
  path.join(appDirname, '..', 'firebase-applet-config.json')
];

for (const configPath of candidatePaths) {
  try {
    if (fs.existsSync(configPath)) {
      const parsed = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      firebaseConfig = {
        apiKey: parsed.apiKey || firebaseConfig.apiKey,
        authDomain: parsed.authDomain || firebaseConfig.authDomain,
        projectId: parsed.projectId || firebaseConfig.projectId,
        storageBucket: parsed.storageBucket || firebaseConfig.storageBucket,
        messagingSenderId: parsed.messagingSenderId || firebaseConfig.messagingSenderId,
        appId: parsed.appId || firebaseConfig.appId
      };
      if (parsed.firestoreDatabaseId) {
        firestoreDatabaseId = parsed.firestoreDatabaseId;
      }
      break;
    }
  } catch (e) {
    console.error(`Failed to parse ${configPath}:`, e);
  }
}

const firebaseApp = initializeApp(firebaseConfig);
const firestoreDb = firestoreDatabaseId ? getFirestore(firebaseApp, firestoreDatabaseId) : getFirestore(firebaseApp);


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
  activity_logs: [],
  permission_requests: []
};

async function getCollectionDocs(collectionName: string): Promise<any[]> {
  try {
    const snap = await getDocs(collection(firestoreDb, collectionName));
    const docs = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));
    db[collectionName] = docs;
    return docs;
  } catch (err) {
    console.error(`Error loading collection ${collectionName} from Firestore:`, err);
    return db[collectionName] || [];
  }
}

const initialSeedData: Record<string, any[]> = {
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
  activity_logs: [],
  permission_requests: []
};

async function testConnection() {
  try {
    await getDocFromServer(doc(firestoreDb, "settings", "main"));
    console.log("Firestore connection verified successfully.");
  } catch (error: any) {
    if (error?.message?.includes("the client is offline")) {
      console.error("Please check your Firebase configuration: client is offline");
    } else {
      console.log("Firestore connection initialized:", error?.message || error);
    }
  }
}

async function loadFromFirestore() {
  const collections = ["employees", "customers", "suppliers", "hotels", "flights", "tour_packages", "reservations", "customer_payments", "supplier_payments", "expenses", "tasks", "documents", "notifications", "invoices", "activity_logs", "permission_requests"];
  try {
    console.log("Loading data from Firestore...");
    const setSnap = await getDocs(collection(firestoreDb, "settings"));
    if (!setSnap.empty) {
       db.settings = { ...db.settings, ...setSnap.docs[0].data() };
    } else {
       await setDoc(doc(firestoreDb, "settings", "main"), db.settings);
    }

    for (const c of collections) {
       await getCollectionDocs(c);
    }

    console.log("Firestore data loaded successfully.");
  } catch (err) {
    console.error("Error loading from Firestore:", err);
  }
}

async function wipeAllFirestoreTestData() {
  const collections = ["employees", "customers", "suppliers", "hotels", "flights", "tour_packages", "reservations", "customer_payments", "supplier_payments", "expenses", "tasks", "documents", "notifications", "invoices", "activity_logs", "permission_requests"];
  console.log("Wiping all test data completely from Firestore...");
  for (const col of collections) {
    try {
      const snap = await getDocs(collection(firestoreDb, col));
      for (const d of snap.docs) {
        await deleteDoc(doc(firestoreDb, col, d.id));
      }
      db[col] = [];
    } catch (e) {
      console.warn(`Could not wipe Firestore collection ${col}:`, e);
      db[col] = [];
    }
  }
  console.log("All collections in Firestore and memory have been wiped clean.");
}

async function saveToFirestore(collectionName: string, id: string, data: any) {
  try {
    const cleanData = JSON.parse(JSON.stringify(data));
    delete cleanData._actingUser;
    delete cleanData._actingRole;
    await setDoc(doc(firestoreDb, collectionName, String(id)), cleanData, { merge: true });
  } catch (err) {
    console.error(`Firestore sync error (save to ${collectionName}/${id}):`, err);
    throw err;
  }
}

async function deleteFromFirestore(collectionName: string, id: string) {
  try {
    await deleteDoc(doc(firestoreDb, collectionName, String(id)));
  } catch (err) {
    console.error(`Firestore sync error (delete from ${collectionName}/${id}):`, err);
    throw err;
  }
}

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Enable CORS for external hosting and online deployments
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, x-acting-user, x-acting-role");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Endpoint to completely clear all data from Firestore & Memory
app.post("/api/admin/clear-all-data", async (req, res) => {
  try {
    await wipeAllFirestoreTestData();
    res.json({ success: true, message: "All test data has been permanently cleared from database and memory." });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to wipe data" });
  }
});

// Health check endpoint for fast container readiness
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "Sofia Travel Management API", timestamp: new Date().toISOString() });
});

// In-Memory Database Store with Rich Seed Data
// Helper function to log activity
async function logActivity(userName: string, action: string, module: string, record: string) {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const newLog = {
    id: 'LOG-' + Math.random().toString(36).substring(2, 9),
    user_name: userName,
    action,
    module,
    record,
    date: dateStr,
    time: timeStr
  };
  db.activity_logs.unshift(newLog);
  await saveToFirestore('activity_logs', newLog.id, newLog);
}

// Helper function to add notifications
async function addNotification(title: string, message: string, type: string = 'action', link_id?: string) {
  const notif = {
    id: 'NOTIF-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    title,
    message,
    type: type as any,
    date: new Date().toISOString().replace('T', ' ').substring(0, 16),
    read: false,
    link_id
  };
  if (!db.notifications) db.notifications = [];
  db.notifications.unshift(notif);
  await saveToFirestore('notifications', notif.id, notif);
  return notif;
}

// REST API Endpoints

// Permission Requests API
app.get("/api/permission-requests", async (req, res) => {
  const requests = await getCollectionDocs('permission_requests');
  res.json(requests);
});

app.post("/api/permission-requests", async (req, res) => {
  const data = req.body;
  const newReq = {
    id: "REQ-" + Math.random().toString(36).substring(2, 7).toUpperCase(),
    request_id: "PR-" + Math.floor(1000 + Math.random() * 9000),
    employee_id: data.employee_id || "EMP-001",
    employee_name: data.employee_name || "Employee",
    employee_role: data.employee_role || "Sales",
    module: data.module,
    item_id: data.item_id,
    item_name: data.item_name,
    action_type: data.action_type, // 'Edit' | 'Delete'
    reason: data.reason || "No reason provided",
    proposed_changes: data.proposed_changes || null,
    status: "Pending", // 'Pending' | 'Approved' | 'Rejected'
    created_at: new Date().toISOString().replace('T', ' ').substring(0, 16),
  };

  if (!db.permission_requests) db.permission_requests = [];
  db.permission_requests.unshift(newReq);

  await addNotification(
    `Permission Request: ${newReq.action_type} ${newReq.module}`,
    `Employee ${newReq.employee_name} (${newReq.employee_role}) requested permission to ${newReq.action_type.toLowerCase()} "${newReq.item_name}" in ${newReq.module}. Reason: "${newReq.reason}"`,
    'permission',
    newReq.id
  );

  await logActivity(
    newReq.employee_name,
    `Submitted ${newReq.action_type} permission request for ${newReq.module}`,
    newReq.module,
    newReq.item_name
  );

  await saveToFirestore('permission_requests', newReq.id, newReq);
  res.json(newReq);
});

app.post("/api/permission-requests/:id/approve", async (req, res) => {
  const { id } = req.params;
  const { reviewer_name } = req.body;

  const request = (db.permission_requests || []).find(r => r.id === id);
  if (!request) return res.status(404).json({ error: "Request not found" });

  request.status = "Approved";
  request.reviewed_by = reviewer_name || "Manager";
  request.reviewed_at = new Date().toISOString().replace('T', ' ').substring(0, 16);

  const colMap: Record<string, string> = {
    'Customers': 'customers',
    'Reservations': 'reservations',
    'Invoices': 'invoices',
    'Suppliers': 'suppliers',
    'Employees': 'employees',
    'Tour Packages': 'tour_packages',
    'Hotels': 'hotels',
    'Flights': 'flights',
    'Tasks': 'tasks',
    'Documents': 'documents',
    'Expenses': 'expenses',
    'Customer Payments': 'customer_payments',
    'Supplier Payments': 'supplier_payments'
  };

  const targetCol = colMap[request.module];
  if (targetCol && db[targetCol]) {
    if (request.action_type === 'Delete') {
      db[targetCol] = db[targetCol].filter((i: any) => i.id !== request.item_id);
      await deleteFromFirestore(targetCol, request.item_id);
    } else if (request.action_type === 'Edit' && request.proposed_changes) {
      const idx = db[targetCol].findIndex((i: any) => i.id === request.item_id);
      if (idx !== -1) {
        db[targetCol][idx] = { ...db[targetCol][idx], ...request.proposed_changes };
        await saveToFirestore(targetCol, request.item_id, db[targetCol][idx]);
      }
    }
  }

  await addNotification(
    `Permission Request Approved`,
    `The request by ${request.employee_name} to ${request.action_type.toLowerCase()} "${request.item_name}" (${request.module}) was APPROVED by ${request.reviewed_by}.`,
    'permission',
    request.id
  );

  await logActivity(
    request.reviewed_by,
    `Approved ${request.action_type} request for ${request.item_name}`,
    request.module,
    request.item_id
  );

  await saveToFirestore('permission_requests', request.id, request);
  res.json(request);
});

app.post("/api/permission-requests/:id/reject", async (req, res) => {
  const { id } = req.params;
  const { reviewer_name, rejection_reason } = req.body;

  const request = (db.permission_requests || []).find(r => r.id === id);
  if (!request) return res.status(404).json({ error: "Request not found" });

  request.status = "Rejected";
  request.reviewed_by = reviewer_name || "Manager";
  request.reviewed_at = new Date().toISOString().replace('T', ' ').substring(0, 16);
  request.rejection_reason = rejection_reason || "Not approved";

  await addNotification(
    `Permission Request Rejected`,
    `The request by ${request.employee_name} to ${request.action_type.toLowerCase()} "${request.item_name}" (${request.module}) was REJECTED by ${request.reviewed_by}. Reason: ${request.rejection_reason}`,
    'permission',
    request.id
  );

  await logActivity(
    request.reviewed_by,
    `Rejected ${request.action_type} request for ${request.item_name}`,
    request.module,
    request.item_id
  );

  await saveToFirestore('permission_requests', request.id, request);
  res.json(request);
});

// Settings
app.get("/api/settings", async (req, res) => {
  try {
    const setSnap = await getDocs(collection(firestoreDb, 'settings'));
    if (!setSnap.empty) {
      db.settings = { ...db.settings, ...setSnap.docs[0].data() };
    }
  } catch (err) {
    console.error("Error reading settings from Firestore:", err);
  }
  res.json(db.settings);
});

app.put("/api/settings", async (req, res) => {
  db.settings = { ...db.settings, ...req.body };
  await logActivity("Administrator", "Updated company settings", "Settings", "Settings");
  await saveToFirestore('settings', 'main', db.settings);
  res.json(db.settings);
});

// Customers
app.get("/api/customers", async (req, res) => {
  const customers = await getCollectionDocs('customers');
  res.json(customers);
});

app.post("/api/customers", async (req, res) => {
  const newCust = {
    id: "CUST-" + Math.random().toString(36).substring(2, 7).toUpperCase(),
    customer_id: "C-" + Math.floor(1000 + Math.random() * 9000),
    registration_date: new Date().toISOString().split('T')[0],
    outstanding_balance: 0,
    currency: "USD",
    ...req.body
  };
  db.customers.push(newCust);
  await logActivity("Ahmed Hassan", `Created customer ${newCust.full_name}`, "Customers", newCust.customer_id);
  await saveToFirestore('customers', newCust.id, newCust);
  res.json(newCust);
});

app.put("/api/customers/:id", async (req, res) => {
  const { id } = req.params;
  let idx = db.customers.findIndex(c => c.id === id);
  if (idx === -1) {
    await getCollectionDocs('customers');
    idx = db.customers.findIndex(c => c.id === id);
  }
  const current = idx !== -1 ? db.customers[idx] : { id };
  const updated = { ...current, ...req.body, id };
  if (idx !== -1) {
    db.customers[idx] = updated;
  } else {
    db.customers.push(updated);
  }
  await logActivity("Manager", `Updated customer ${updated.full_name || id}`, "Customers", updated.customer_id || id);
  await saveToFirestore('customers', id, updated);
  res.json(updated);
});

app.delete("/api/customers/:id", async (req, res) => {
  const { id } = req.params;
  db.customers = db.customers.filter(c => c.id !== id);
  await logActivity("Administrator", "Deleted customer", "Customers", id);
  await deleteFromFirestore('customers', id);
  res.json({ success: true });
});

// Reservations
app.get("/api/reservations", async (req, res) => {
  const reservations = await getCollectionDocs('reservations');
  res.json(reservations);
});

app.post("/api/reservations", async (req, res) => {
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

  await logActivity("Karim Nabil", `Created reservation ${newRes.reservation_id}`, "Reservations", newRes.reservation_id);
  await saveToFirestore('reservations', newRes.id, newRes);
  res.json(newRes);
});

app.put("/api/reservations/:id", async (req, res) => {
  const { id } = req.params;
  let idx = db.reservations.findIndex(r => r.id === id);
  if (idx === -1) {
    await getCollectionDocs('reservations');
    idx = db.reservations.findIndex(r => r.id === id);
  }
  const existing = idx !== -1 ? db.reservations[idx] : { id };
  
  const data = req.body;
  const selling = data.selling_price !== undefined ? Number(data.selling_price) : (Number(existing.selling_price) || 0);
  const cost = data.cost_price !== undefined ? Number(data.cost_price) : (Number(existing.cost_price) || 0);
  const paid = data.paid_amount !== undefined ? Number(data.paid_amount) : (Number(existing.paid_amount) || 0);
  const profit = selling - cost;
  const remaining = Math.max(0, selling - paid);

  const updated = {
    ...existing,
    ...data,
    id,
    selling_price: selling,
    cost_price: cost,
    paid_amount: paid,
    profit,
    remaining_amount: remaining,
    payment_status: remaining === 0 ? "Paid" : paid > 0 ? "Partially Paid" : "Pending"
  };

  if (idx !== -1) {
    db.reservations[idx] = updated;
  } else {
    db.reservations.push(updated);
  }

  await logActivity("Manager", `Updated reservation ${updated.reservation_id || id}`, "Reservations", updated.reservation_id || id);
  await saveToFirestore('reservations', id, updated);
  res.json(updated);
});

app.delete("/api/reservations/:id", async (req, res) => {
  const { id } = req.params;
  db.reservations = db.reservations.filter(r => r.id !== id);
  await logActivity("Administrator", "Deleted reservation", "Reservations", id);
  await deleteFromFirestore('reservations', id);
  res.json({ success: true });
});

// Tour Packages
app.get("/api/tour-packages", async (req, res) => {
  const pkgs = await getCollectionDocs('tour_packages');
  res.json(pkgs);
});

app.post("/api/tour-packages", async (req, res) => {
  const pkg = {
    id: "PKG-" + Math.random().toString(36).substring(2, 7).toUpperCase(),
    ...req.body
  };
  db.tour_packages.push(pkg);
  await logActivity("Karim Nabil", `Created tour package ${pkg.package_name}`, "Tour Packages", pkg.package_name);
  await saveToFirestore('tour_packages', pkg.id, pkg);
  res.json(pkg);
});

app.put("/api/tour-packages/:id", async (req, res) => {
  const { id } = req.params;
  let idx = db.tour_packages.findIndex(p => p.id === id);
  if (idx === -1) {
    await getCollectionDocs('tour_packages');
    idx = db.tour_packages.findIndex(p => p.id === id);
  }
  const current = idx !== -1 ? db.tour_packages[idx] : { id };
  const updated = { ...current, ...req.body, id };
  if (idx !== -1) {
    db.tour_packages[idx] = updated;
  } else {
    db.tour_packages.push(updated);
  }
  await saveToFirestore('tour_packages', id, updated);
  res.json(updated);
});

app.delete("/api/tour-packages/:id", async (req, res) => {
  const { id } = req.params;
  db.tour_packages = db.tour_packages.filter(p => p.id !== id);
  await deleteFromFirestore('tour_packages', id);
  res.json({ success: true });
});

// Hotels
app.get("/api/hotels", async (req, res) => {
  const hotels = await getCollectionDocs('hotels');
  res.json(hotels);
});

app.post("/api/hotels", async (req, res) => {
  const hotel = {
    id: "HOT-" + Math.random().toString(36).substring(2, 7).toUpperCase(),
    ...req.body
  };
  db.hotels.push(hotel);
  await saveToFirestore('hotels', hotel.id, hotel);
  res.json(hotel);
});

app.put("/api/hotels/:id", async (req, res) => {
  const { id } = req.params;
  let idx = db.hotels.findIndex(h => h.id === id);
  if (idx === -1) {
    await getCollectionDocs('hotels');
    idx = db.hotels.findIndex(h => h.id === id);
  }
  const current = idx !== -1 ? db.hotels[idx] : { id };
  const updated = { ...current, ...req.body, id };
  if (idx !== -1) {
    db.hotels[idx] = updated;
  } else {
    db.hotels.push(updated);
  }
  await saveToFirestore('hotels', id, updated);
  res.json(updated);
});

app.delete("/api/hotels/:id", async (req, res) => {
  const { id } = req.params;
  db.hotels = db.hotels.filter(h => h.id !== id);
  await deleteFromFirestore('hotels', id);
  res.json({ success: true });
});

// Flights
app.get("/api/flights", async (req, res) => {
  const flights = await getCollectionDocs('flights');
  res.json(flights);
});

app.post("/api/flights", async (req, res) => {
  const flight = {
    id: "FL-" + Math.random().toString(36).substring(2, 7).toUpperCase(),
    ...req.body
  };
  db.flights.push(flight);
  await saveToFirestore('flights', flight.id, flight);
  res.json(flight);
});

app.put("/api/flights/:id", async (req, res) => {
  const { id } = req.params;
  let idx = db.flights.findIndex(f => f.id === id);
  if (idx === -1) {
    await getCollectionDocs('flights');
    idx = db.flights.findIndex(f => f.id === id);
  }
  const current = idx !== -1 ? db.flights[idx] : { id };
  const updated = { ...current, ...req.body, id };
  if (idx !== -1) {
    db.flights[idx] = updated;
  } else {
    db.flights.push(updated);
  }
  await saveToFirestore('flights', id, updated);
  res.json(updated);
});

app.delete("/api/flights/:id", async (req, res) => {
  const { id } = req.params;
  db.flights = db.flights.filter(f => f.id !== id);
  await deleteFromFirestore('flights', id);
  res.json({ success: true });
});

// Suppliers
app.get("/api/suppliers", async (req, res) => {
  const suppliers = await getCollectionDocs('suppliers');
  res.json(suppliers);
});

app.post("/api/suppliers", async (req, res) => {
  const sup = {
    id: "SUP-" + Math.random().toString(36).substring(2, 7).toUpperCase(),
    outstanding_balance: 0,
    ...req.body
  };
  db.suppliers.push(sup);
  await saveToFirestore('suppliers', sup.id, sup);
  res.json(sup);
});

app.put("/api/suppliers/:id", async (req, res) => {
  const { id } = req.params;
  let idx = db.suppliers.findIndex(s => s.id === id);
  if (idx === -1) {
    await getCollectionDocs('suppliers');
    idx = db.suppliers.findIndex(s => s.id === id);
  }
  const current = idx !== -1 ? db.suppliers[idx] : { id };
  const updated = { ...current, ...req.body, id };
  if (idx !== -1) {
    db.suppliers[idx] = updated;
  } else {
    db.suppliers.push(updated);
  }
  await saveToFirestore('suppliers', id, updated);
  res.json(updated);
});

app.delete("/api/suppliers/:id", async (req, res) => {
  const { id } = req.params;
  db.suppliers = db.suppliers.filter(s => s.id !== id);
  await deleteFromFirestore('suppliers', id);
  res.json({ success: true });
});

// Financials: Customer Payments
app.get("/api/customer-payments", async (req, res) => {
  const pays = await getCollectionDocs('customer_payments');
  res.json(pays);
});

app.post("/api/customer-payments", async (req, res) => {
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

  await logActivity("Tarek Lotfy", `Recorded customer payment of $${pay.amount}`, "Finance", pay.payment_id);
  await saveToFirestore('customer_payments', pay.id, pay);
  res.json(pay);
});

// Supplier Payments
app.get("/api/supplier-payments", async (req, res) => {
  const pays = await getCollectionDocs('supplier_payments');
  res.json(pays);
});

app.post("/api/supplier-payments", async (req, res) => {
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

  await logActivity("Tarek Lotfy", `Recorded supplier payment of $${pay.amount}`, "Finance", pay.payment_id || pay.id);
  await saveToFirestore('supplier_payments', pay.id, pay);
  res.json(pay);
});

// Expenses
app.get("/api/expenses", async (req, res) => {
  const expenses = await getCollectionDocs('expenses');
  res.json(expenses);
});

app.post("/api/expenses", async (req, res) => {
  const exp = {
    id: "EXP-" + Math.random().toString(36).substring(2, 7).toUpperCase(),
    expense_id: "EX-" + Math.floor(300 + Math.random() * 900),
    date: new Date().toISOString().split('T')[0],
    ...req.body
  };
  db.expenses.push(exp);
  await logActivity("Tarek Lotfy", `Recorded expense ${exp.category} ($${exp.amount})`, "Finance", exp.expense_id);
  await saveToFirestore('expenses', exp.id, exp);
  res.json(exp);
});

app.delete("/api/expenses/:id", async (req, res) => {
  const { id } = req.params;
  db.expenses = db.expenses.filter(e => e.id !== id);
  await deleteFromFirestore('expenses', id);
  res.json({ success: true });
});

// Employees
app.get("/api/employees", async (req, res) => {
  try {
    const employees = await getCollectionDocs('employees');
    const reservations = await getCollectionDocs('reservations');

    const employeesWithStats = employees.map(emp => {
      const name = emp.name || emp.full_name || 'Staff Member';
      const position = emp.position || emp.job_title || emp.role || 'Sales Executive';
      const empRes = reservations.filter(r => 
        r.employee_id === emp.id || 
        r.employee_id === emp.employee_id || 
        r.employee_name === emp.full_name || 
        r.employee_name === emp.name ||
        r.employee_name === name
      );
      const reservations_count = empRes.length;
      const total_sales = empRes.reduce((acc, r) => acc + (Number(r.selling_price) || 0), 0);
      const total_profit = empRes.reduce((acc, r) => acc + (Number(r.profit) || 0), 0);
      const customerSet = new Set(empRes.map(r => r.customer_id));
      return {
        ...emp,
        name,
        full_name: emp.full_name || name,
        position,
        job_title: emp.job_title || position,
        reservations_count,
        total_sales,
        total_profit,
        customer_count: customerSet.size
      };
    });
    res.json(employeesWithStats);
  } catch (err) {
    console.error("Employees Error:", err);
    res.json(db.employees || []);
  }
});

app.post("/api/employees", async (req, res) => {
  const data = req.body;
  const name = data.name || data.full_name || 'New Employee';
  const position = data.position || data.job_title || data.role || 'Sales Executive';
  const emp = {
    id: "EMP-" + Math.random().toString(36).substring(2, 7).toUpperCase(),
    employee_id: "E-" + Math.floor(200 + Math.random() * 800),
    joining_date: new Date().toISOString().split('T')[0],
    ...data,
    name,
    full_name: data.full_name || name,
    position,
    job_title: data.job_title || position,
    role: data.role || position,
    status: data.status || 'Active',
    salary: Number(data.salary) || 0
  };
  db.employees.push(emp);
  await saveToFirestore('employees', emp.id, emp);
  res.json(emp);
});

app.put("/api/employees/:id", async (req, res) => {
  const { id } = req.params;
  let idx = db.employees.findIndex(e => e.id === id);
  if (idx === -1) {
    await getCollectionDocs('employees');
    idx = db.employees.findIndex(e => e.id === id);
  }
  const current = idx !== -1 ? db.employees[idx] : { id };
  const updated = { ...current, ...req.body, id };
  if (idx !== -1) {
    db.employees[idx] = updated;
  } else {
    db.employees.push(updated);
  }
  await saveToFirestore('employees', id, updated);
  res.json(updated);
});

app.delete("/api/employees/:id", async (req, res) => {
  const { id } = req.params;
  db.employees = db.employees.filter(e => e.id !== id);
  await deleteFromFirestore('employees', id);
  res.json({ success: true });
});

// Tasks
app.get("/api/tasks", async (req, res) => {
  const tasks = await getCollectionDocs('tasks');
  res.json(tasks);
});

app.post("/api/tasks", async (req, res) => {
  const task = {
    id: "TSK-" + Math.random().toString(36).substring(2, 7).toUpperCase(),
    ...req.body
  };
  db.tasks.push(task);
  await saveToFirestore('tasks', task.id, task);
  res.json(task);
});

app.put("/api/tasks/:id", async (req, res) => {
  const { id } = req.params;
  let idx = db.tasks.findIndex(t => t.id === id);
  if (idx === -1) {
    await getCollectionDocs('tasks');
    idx = db.tasks.findIndex(t => t.id === id);
  }
  const current = idx !== -1 ? db.tasks[idx] : { id };
  const updated = { ...current, ...req.body, id };
  if (idx !== -1) {
    db.tasks[idx] = updated;
  } else {
    db.tasks.push(updated);
  }
  await saveToFirestore('tasks', id, updated);
  res.json(updated);
});

app.delete("/api/tasks/:id", async (req, res) => {
  const { id } = req.params;
  db.tasks = db.tasks.filter(t => t.id !== id);
  await deleteFromFirestore('tasks', id);
  res.json({ success: true });
});

// Documents
app.get("/api/documents", async (req, res) => {
  const docs = await getCollectionDocs('documents');
  res.json(docs);
});

app.post("/api/documents", async (req, res) => {
  const doc = {
    id: "DOC-" + Math.random().toString(36).substring(2, 7).toUpperCase(),
    upload_date: new Date().toISOString().split('T')[0],
    file_size: "1.2 MB",
    file_url: "#",
    ...req.body
  };
  db.documents.push(doc);
  await saveToFirestore('documents', doc.id, doc);
  res.json(doc);
});

app.delete("/api/documents/:id", async (req, res) => {
  const { id } = req.params;
  db.documents = db.documents.filter(d => d.id !== id);
  await deleteFromFirestore('documents', id);
  res.json({ success: true });
});

// Invoices
app.get("/api/invoices", async (req, res) => {
  const invoices = await getCollectionDocs('invoices');
  res.json(invoices);
});

app.post("/api/invoices", async (req, res) => {
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
  await logActivity(actorName, `Issued ${newInvoice.recipient_type || 'Customer'} invoice ${newInvoice.invoice_number} to ${recipientName}`, "Invoicing", newInvoice.invoice_number);
  
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

  await saveToFirestore('invoices', newInvoice.id, newInvoice);
  res.json(newInvoice);
});

app.put("/api/invoices/:id", async (req, res) => {
  const { id } = req.params;
  let index = (db.invoices || []).findIndex(inv => inv.id === id);
  if (index === -1) {
    await getCollectionDocs('invoices');
    index = (db.invoices || []).findIndex(inv => inv.id === id);
  }
  const current = index !== -1 ? db.invoices[index] : { id };
  const updated = { ...current, ...req.body, id };
  if (index !== -1) {
    db.invoices[index] = updated;
  } else {
    if (!db.invoices) db.invoices = [];
    db.invoices.push(updated);
  }
  await logActivity("Employee", `Updated invoice ${updated.invoice_number || id}`, "Invoicing", updated.invoice_number || id);
  await saveToFirestore('invoices', id, updated);
  res.json(updated);
});

app.delete("/api/invoices/:id", async (req, res) => {
  const { id } = req.params;
  db.invoices = (db.invoices || []).filter(inv => inv.id !== id);
  await logActivity("Employee", `Deleted invoice ${id}`, "Invoicing", id);
  await deleteFromFirestore('invoices', id);
  res.json({ success: true });
});

// Notifications
app.get("/api/notifications", async (req, res) => {
  const notifs = await getCollectionDocs('notifications');
  res.json(notifs);
});

app.put("/api/notifications/:id/read", async (req, res) => {
  const { id } = req.params;
  const notif = db.notifications.find(n => n.id === id);
  if (notif) {
    notif.read = true;
    await saveToFirestore('notifications', notif.id, notif);
  }
  res.json({ success: true });
});

// Activity Logs
app.get("/api/activity-logs", async (req, res) => {
  const logs = await getCollectionDocs('activity_logs');
  res.json(logs);
});

// Dashboard Statistics & Analytics
app.get("/api/dashboard-stats", async (req, res) => {
  try {
    await Promise.all([
      getCollectionDocs('customers'),
      getCollectionDocs('reservations'),
      getCollectionDocs('expenses'),
      getCollectionDocs('customer_payments'),
      getCollectionDocs('supplier_payments'),
      getCollectionDocs('suppliers'),
      getCollectionDocs('tasks'),
      getCollectionDocs('activity_logs')
    ]);

    const total_customers = db.customers.length;
    const active_reservations = db.reservations.filter(r => r.reservation_status === 'Confirmed' || r.reservation_status === 'Pending').length;
    const todayStr = new Date().toISOString().split('T')[0];
    const todays_reservations = db.reservations.filter(r => r.booking_date === todayStr).length;
    const upcoming_trips = db.reservations.filter(r => r.travel_date >= todayStr).length;
    
    const total_sales = db.reservations.reduce((acc, r) => acc + (Number(r.selling_price) || 0), 0);
    const total_supplier_costs = db.reservations.reduce((acc, r) => acc + (Number(r.cost_price) || 0), 0);
    const total_expenses = db.expenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
    const net_profit = total_sales - total_supplier_costs - total_expenses;

    const outstanding_customer_payments = db.customers.reduce((acc, c) => acc + (Number(c.outstanding_balance) || 0), 0);
    const outstanding_supplier_payments = db.suppliers.reduce((acc, s) => acc + (Number(s.outstanding_balance) || 0), 0);
    const today_tasks = db.tasks.filter(t => t.status !== 'Completed').length;

    const outstanding_by_currency: Record<string, number> = {};
    db.reservations.forEach(r => {
      const rem = Number(r.remaining_amount) || (Number(r.selling_price || 0) - Number(r.paid_amount || 0));
      if (rem > 0) {
        const curr = r.currency || 'USD';
        outstanding_by_currency[curr] = (outstanding_by_currency[curr] || 0) + rem;
      }
    });
    if (Object.keys(outstanding_by_currency).length === 0) {
      db.customers.forEach(c => {
        const bal = Number(c.outstanding_balance) || 0;
        if (bal > 0) {
          const curr = c.currency || 'USD';
          outstanding_by_currency[curr] = (outstanding_by_currency[curr] || 0) + bal;
        }
      });
    }

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
    outstanding_by_currency,
    today_tasks,
    recent_reservations: db.reservations.slice(-5).reverse(),
    recent_payments: db.customer_payments.slice(-5).reverse(),
    recent_activities: db.activity_logs.slice(-6).reverse(),
    monthlyData,
    destinationPopularity,
    topAgent
  });
  } catch (err) {
    console.error("Dashboard Stats Error:", err);
    res.json({
      total_customers: 0,
      active_reservations: 0,
      todays_reservations: 0,
      upcoming_trips: 0,
      total_sales: 0,
      total_expenses: 0,
      net_profit: 0,
      outstanding_customer_payments: 0,
      outstanding_supplier_payments: 0,
      outstanding_by_currency: {},
      today_tasks: 0,
      recent_reservations: [],
      recent_payments: [],
      recent_activities: [],
      monthlyData: [],
      destinationPopularity: [],
      topAgent: { name: 'No data', sales: 0 }
    });
  }
});

// Gemini AI Assistant Integration with lazy initialization
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

app.post("/api/ai-assistant", async (req, res) => {
  try {
    const { prompt } = req.body;
    const ai = getGenAI();
    if (!ai) {
      return res.status(503).json({ error: "Gemini AI is currently not configured with an API key." });
    }
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
    let distPath = path.join(process.cwd(), 'dist');
    if (!fs.existsSync(distPath) && fs.existsSync(path.join(process.cwd(), 'index.html'))) {
      distPath = process.cwd();
    } else if (!fs.existsSync(distPath) && fs.existsSync(path.join(appDirname, 'index.html'))) {
      distPath = appDirname;
    }
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Start HTTP server immediately so port 3000 is open for container health checks
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Sofia Travel Management System running on http://localhost:${PORT}`);
  });

  // Wipe all test data from Firestore and memory in the background
  (async () => {
    try {
      await testConnection();
      await wipeAllFirestoreTestData();
      console.log("Database completely wiped clean - ready for official live operations.");
    } catch (e) {
      console.warn("Background Firestore wipe initialization note:", e);
    }
  })();
}

startServer();
