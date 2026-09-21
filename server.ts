
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, getDocs, deleteDoc, getDocFromServer, setLogLevel } from "firebase/firestore";

// Suppress internal Firestore SDK warnings/errors such as non-critical BloomFilter calculation notices
const suppressBloomFilter = (fn: (...args: any[]) => void) => {
  return (...args: any[]) => {
    const combined = args.map(a => (typeof a === 'object' && a !== null ? (a.message || a.stack || JSON.stringify(a)) : String(a))).join(' ');
    if (combined.includes('BloomFilter') || combined.includes('Invalid hash count')) {
      return;
    }
    fn(...args);
  };
};
console.warn = suppressBloomFilter(console.warn);
console.error = suppressBloomFilter(console.error);

try {
  setLogLevel('silent');
} catch {}

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
    voucher_prefix: "VCH-2026-",
    payment_methods: ["Cash", "Bank Transfer", "Credit Card", "InstaPay", "ValU (Installments)", "TRU (Installments)", "Other"],
    exchange_rates: [
      { currency: "USD", rate_to_usd: 1.0 },
      { currency: "EUR", rate_to_usd: 0.92 },
      { currency: "GBP", rate_to_usd: 0.78 },
      { currency: "SAR", rate_to_usd: 3.75 },
      { currency: "AED", rate_to_usd: 3.67 },
      { currency: "EGP", rate_to_usd: 48.5 },
    ],
    installment_partners: [
      {
        id: "PARTNER-VALU-01",
        partner_name: "ValU",
        is_active: true,
        merchant_id: "VALU-SOFIA-88219",
        contract_number: "VALU-EGY-2026-091",
        settlement_cycle: "T+2 Business Days (NBE Bank Transfer)",
        settlement_account: "EG540003001500000010987654321 (EGP)",
        min_amount: 500,
        max_amount: 250000,
        customer_admin_fee_rule: "Financed directly within ValU installment application",
        terms_and_conditions: "Settled within 48 business hours to Sofia Travel bank account net of 2.5% merchant MDR. Customer OTP authorization required.",
        support_contact: "support@valu.com.eg / 16671",
        plans: [
          { months: 3, interest_rate_percent: 0, admin_fee_percent: 3.0, down_payment_percent: 0, merchant_fee_percent: 2.0, label: "3 Months - 0% Interest (Promo)" },
          { months: 6, interest_rate_percent: 0, admin_fee_percent: 5.0, down_payment_percent: 0, merchant_fee_percent: 2.5, label: "6 Months - 0% Interest (Best Seller)" },
          { months: 9, interest_rate_percent: 1.2, admin_fee_percent: 4.0, down_payment_percent: 10, merchant_fee_percent: 2.5, label: "9 Months - Low Interest (1.2%/mo)" },
          { months: 12, interest_rate_percent: 1.5, admin_fee_percent: 4.5, down_payment_percent: 10, merchant_fee_percent: 2.5, label: "12 Months - Standard Plan (1.5%/mo)" },
          { months: 18, interest_rate_percent: 1.7, admin_fee_percent: 5.0, down_payment_percent: 15, merchant_fee_percent: 2.8, label: "18 Months - Extended (1.7%/mo)" },
          { months: 24, interest_rate_percent: 1.85, admin_fee_percent: 5.0, down_payment_percent: 20, merchant_fee_percent: 3.0, label: "24 Months - Long Term (1.85%/mo)" },
          { months: 36, interest_rate_percent: 1.95, admin_fee_percent: 5.0, down_payment_percent: 25, merchant_fee_percent: 3.2, label: "36 Months - Maximum Tenor (1.95%/mo)" }
        ]
      },
      {
        id: "PARTNER-TRU-02",
        partner_name: "TRU",
        is_active: true,
        merchant_id: "TRU-SOFIA-77340",
        contract_number: "TRU-EGY-2026-440",
        settlement_cycle: "Weekly settlement on Thursdays via Direct ACH",
        settlement_account: "EG540003001500000010987654321 (EGP)",
        min_amount: 1000,
        max_amount: 300000,
        customer_admin_fee_rule: "Zero admin fee on 6-month promotional campaign; 4% on regular tenors",
        terms_and_conditions: "Merchant commission is 2.0% deducted at settlement. Quick QR Code / OTP checkout via TRU Mobile Wallet.",
        support_contact: "partners@tru.eg / 19992",
        plans: [
          { months: 6, interest_rate_percent: 0, admin_fee_percent: 4.0, down_payment_percent: 0, merchant_fee_percent: 2.0, label: "6 Months - TRU Zero Interest" },
          { months: 12, interest_rate_percent: 1.35, admin_fee_percent: 4.0, down_payment_percent: 10, merchant_fee_percent: 2.0, label: "12 Months - TRU Flex (1.35%/mo)" },
          { months: 18, interest_rate_percent: 1.6, admin_fee_percent: 4.5, down_payment_percent: 15, merchant_fee_percent: 2.2, label: "18 Months - TRU Plus (1.6%/mo)" },
          { months: 24, interest_rate_percent: 1.75, admin_fee_percent: 5.0, down_payment_percent: 15, merchant_fee_percent: 2.5, label: "24 Months - TRU Extended (1.75%/mo)" },
          { months: 36, interest_rate_percent: 1.85, admin_fee_percent: 5.0, down_payment_percent: 20, merchant_fee_percent: 2.8, label: "36 Months - TRU Max (1.85%/mo)" }
        ]
      }
    ]
  },
  employees: [],
  customers: [],
  suppliers: [],
  hotels: [],
  flights: [],
  tour_packages: [],
  vouchers: [],
  reservations: [],
  visas: [],
  transfers: [],
  cruises: [],
  tours: [],
  day_trips: [],
  customer_payments: [],
  supplier_payments: [],
  expenses: [],
  tasks: [],
  documents: [],
  notifications: [],
  invoices: [],
  activity_logs: [],
  permission_requests: [],
  payroll_records: [],
  employee_advances: [],
  commission_records: [],
  finance_audit_logs: []
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
  const collections = [
    "employees", "customers", "suppliers", "hotels", "flights", "tour_packages",
    "vouchers", "reservations", "visas", "transfers", "cruises", "tours", "day_trips",
    "customer_payments", "supplier_payments", "expenses",
    "tasks", "documents", "notifications", "invoices", "activity_logs",
    "permission_requests", "payroll_records", "employee_advances", "commission_records",
    "finance_audit_logs"
  ];
  try {
    console.log("Loading persistent data from Firestore...");
    const setSnap = await getDocs(collection(firestoreDb, "settings"));
    if (!setSnap.empty) {
      const foundDoc = setSnap.docs.find(d => d.id === 'company_settings') || setSnap.docs.find(d => d.id === 'main') || setSnap.docs[0];
      db.settings = { ...db.settings, ...foundDoc.data() };
    } else {
      await setDoc(doc(firestoreDb, "settings", "company_settings"), db.settings);
    }

    for (const c of collections) {
      await getCollectionDocs(c);
    }

    console.log("Firestore persistent data loaded and synchronized successfully.");
  } catch (err) {
    console.error("Error loading from Firestore:", err);
  }
}

async function wipeAllFirestoreTestData() {
  const collections = [
    "customers", "suppliers", "hotels", "flights", "tour_packages",
    "vouchers", "reservations", "visas", "transfers", "cruises", "tours", "day_trips",
    "customer_payments", "supplier_payments", "expenses",
    "tasks", "documents", "notifications", "invoices", "activity_logs",
    "permission_requests", "payroll_records", "employee_advances", "commission_records",
    "finance_audit_logs"
  ];
  console.log("Admin action: Wiping operational test data from Firestore (preserving employee accounts)...");
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
  }
}

async function deleteFromFirestore(collectionName: string, id: string) {
  try {
    await deleteDoc(doc(firestoreDb, collectionName, String(id)));
  } catch (err) {
    console.error(`Firestore sync error (delete from ${collectionName}/${id}):`, err);
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
    'Vouchers': 'vouchers',
    'Customer Vouchers': 'vouchers',
    'Invoices': 'invoices',
    'Suppliers': 'suppliers',
    'Employees': 'employees',
    'Tour Packages': 'tour_packages',
    'Packages': 'tour_packages',
    'Hotels': 'hotels',
    'Flights': 'flights',
    'Visas': 'visas',
    'Transfers': 'transfers',
    'Cruises': 'cruises',
    'Tours': 'tours',
    'Day Trips': 'day_trips',
    'Services': 'visas',
    'Tourism Services': 'visas',
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
      if (targetCol === 'vouchers') {
        db.reservations = (db.reservations || []).filter((r: any) => r.id !== request.item_id);
        await deleteFromFirestore('reservations', request.item_id);
      }
    } else if (request.action_type === 'Edit' && request.proposed_changes) {
      const idx = db[targetCol].findIndex((i: any) => i.id === request.item_id);
      if (idx !== -1) {
        db[targetCol][idx] = { ...db[targetCol][idx], ...request.proposed_changes };
        await saveToFirestore(targetCol, request.item_id, db[targetCol][idx]);
        if (targetCol === 'vouchers') {
          const rIdx = (db.reservations || []).findIndex((r: any) => r.id === request.item_id);
          if (rIdx !== -1) {
            db.reservations[rIdx] = { ...db.reservations[rIdx], ...request.proposed_changes };
            await saveToFirestore('reservations', request.item_id, db.reservations[rIdx]);
          }
        }
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
  await saveToFirestore('settings', 'company_settings', db.settings);
  res.json(db.settings);
});

// Customers
app.get("/api/customers", async (req, res) => {
  const customers = await getCollectionDocs('customers');
  res.json(customers);
});

app.post("/api/customers", async (req, res) => {
  const custId = req.body.id || ("CUST-" + Math.random().toString(36).substring(2, 7).toUpperCase());
  const newCust = {
    customer_id: req.body.customer_id || ("C-" + Math.floor(1000 + Math.random() * 9000)),
    registration_date: req.body.registration_date || new Date().toISOString().split('T')[0],
    outstanding_balance: 0,
    currency: "USD",
    ...req.body,
    id: custId
  };
  const idx = db.customers.findIndex(c => c.id === newCust.id);
  if (idx >= 0) {
    db.customers[idx] = newCust;
  } else {
    db.customers.push(newCust);
  }
  await logActivity((req.headers['x-acting-user'] as string) || "Staff", `Created customer ${newCust.full_name}`, "Customers", newCust.customer_id);
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

// Vouchers & Reservations
async function handleSaveVoucher(data: any, isUpdate = false, existingId?: string) {
  const selling = Number(data.selling_price) || 0;
  const cost = Number(data.cost_price) || 0;
  const paid = Number(data.paid_amount) || 0;
  const profit = selling - cost;
  const remaining = Math.max(0, selling - paid);

  let currency = data.currency || "$";
  if (currency === "USD") currency = "$";
  else if (currency.toUpperCase() === "EGP") currency = "EGP";
  else if (currency.toUpperCase() === "EUR") currency = "EUR";

  const vchId = existingId || data.id || ("VCH-" + Math.random().toString(36).substring(2, 8).toUpperCase());
  const voucher_number = data.voucher_number || data.reservation_id || ("VCH-2026-" + Math.floor(1000 + Math.random() * 9000));

  const voucherItem = {
    booking_date: data.booking_date || data.issue_date || new Date().toISOString().split('T')[0],
    issue_date: data.issue_date || data.booking_date || new Date().toISOString().split('T')[0],
    valid_until: data.valid_until || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    travel_date: data.travel_date || new Date().toISOString().split('T')[0],
    return_date: data.return_date || '',
    service_category: data.service_category || data.service_type || 'Tour Package',
    service_type: data.service_type || data.service_category || 'Tour Package',
    service_title: data.service_title || data.destination || 'Tourism Service',
    destination: data.destination || data.service_title || 'Egypt',
    number_of_travelers: Number(data.number_of_travelers) || 1,
    adults_count: Number(data.adults_count) || Number(data.number_of_travelers) || 1,
    children_count: Number(data.children_count) || 0,
    infants_count: Number(data.infants_count) || 0,
    cost_price: cost,
    selling_price: selling,
    paid_amount: paid,
    currency,
    payment_status: remaining === 0 ? "Paid" : paid > 0 ? "Partially Paid" : "Pending",
    reservation_status: data.reservation_status || (remaining === 0 ? "Paid" : "Confirmed"),
    status: data.status || "Draft",
    payment_method: data.payment_method || "Cash",
    installment_details: data.installment_details || null,
    notes: data.notes || '',
    itinerary_or_details: data.itinerary_or_details || '',
    inclusions: data.inclusions || [],
    exclusions: data.exclusions || [],
    terms_conditions: data.terms_conditions || '',
    ...data,
    id: vchId,
    voucher_number,
    reservation_id: voucher_number,
    profit,
    remaining_amount: remaining
  };

  // Upsert in vouchers
  const vIdx = db.vouchers.findIndex(v => v.id === vchId);
  if (vIdx >= 0) {
    db.vouchers[vIdx] = voucherItem;
  } else {
    db.vouchers.push(voucherItem);
  }

  // Keep reservations in sync
  const rIdx = db.reservations.findIndex(r => r.id === vchId);
  if (rIdx >= 0) {
    db.reservations[rIdx] = voucherItem;
  } else {
    db.reservations.push(voucherItem);
  }

  // Update customer outstanding balance if remaining amount exists
  if (voucherItem.customer_id) {
    const cust = db.customers.find(c => c.id === voucherItem.customer_id);
    if (cust && remaining > 0 && !isUpdate) {
      cust.outstanding_balance += remaining;
    }
  }

  await saveToFirestore('vouchers', vchId, voucherItem);
  await saveToFirestore('reservations', vchId, voucherItem);
  return voucherItem;
}

// Vouchers API
app.get("/api/vouchers", async (req, res) => {
  let list = await getCollectionDocs('vouchers');
  if (!list || list.length === 0) {
    // Check reservations for existing records
    list = await getCollectionDocs('reservations');
  }
  res.json(list);
});

app.post("/api/vouchers", async (req, res) => {
  const item = await handleSaveVoucher(req.body, false);
  const user = (req.headers['x-acting-user'] as string) || item.employee_name || "Staff";
  await logActivity(user, `Created voucher ${item.voucher_number} (${item.service_title})`, "Vouchers", item.voucher_number);
  await addNotification(
    'New Customer Voucher Created',
    `Voucher #${item.voucher_number} for "${item.service_title}" was created for ${item.customer_name} (${item.selling_price} ${item.currency || 'USD'}) by ${user}.`,
    'voucher',
    item.id
  );
  res.json(item);
});

app.put("/api/vouchers/:id", async (req, res) => {
  const { id } = req.params;
  const item = await handleSaveVoucher(req.body, true, id);
  const user = (req.headers['x-acting-user'] as string) || item.employee_name || "Manager";
  await logActivity(user, `Updated voucher ${item.voucher_number}`, "Vouchers", item.voucher_number);
  await addNotification(
    'Voucher Updated',
    `Voucher #${item.voucher_number} was modified by ${user}.`,
    'voucher',
    item.id
  );
  res.json(item);
});

app.delete("/api/vouchers/:id", async (req, res) => {
  const { id } = req.params;
  const user = (req.headers['x-acting-user'] as string) || "Administrator";
  db.vouchers = db.vouchers.filter(v => v.id !== id);
  db.reservations = db.reservations.filter(r => r.id !== id);
  await logActivity(user, "Deleted voucher", "Vouchers", id);
  await addNotification(
    'Voucher Deleted',
    `Voucher #${id} was deleted by ${user}.`,
    'voucher',
    id
  );
  await deleteFromFirestore('vouchers', id);
  await deleteFromFirestore('reservations', id);
  res.json({ success: true });
});

// Voucher Workflow: Send to customer
app.post("/api/vouchers/:id/send", async (req, res) => {
  const { id } = req.params;
  const { channel, notes } = req.body;
  let idx = db.vouchers.findIndex(v => v.id === id);
  if (idx === -1) {
    await getCollectionDocs('vouchers');
    idx = db.vouchers.findIndex(v => v.id === id);
  }
  if (idx === -1) {
    return res.status(404).json({ error: "Voucher not found" });
  }

  const v = db.vouchers[idx];
  v.status = "Sent";
  v.sent_to_customer_at = new Date().toISOString();
  v.sent_via = channel || "WhatsApp";
  if (notes) v.notes = (v.notes ? v.notes + "\n" : "") + `[Sent via ${v.sent_via} on ${new Date().toLocaleDateString()}]: ${notes}`;

  await saveToFirestore('vouchers', id, v);
  await saveToFirestore('reservations', id, v);
  const user = (req.headers['x-acting-user'] as string) || v.employee_name || "Staff";
  await logActivity(user, `Sent voucher ${v.voucher_number} to ${v.customer_name} via ${v.sent_via}`, "Vouchers", v.voucher_number);
  await addNotification(
    'Voucher Sent to Customer',
    `Voucher #${v.voucher_number} was dispatched to ${v.customer_name} via ${v.sent_via} by ${user}.`,
    'voucher',
    v.id
  );
  res.json(v);
});

// Voucher Workflow: Confirm and convert to Trip / Service (Confirm and Transfer)
async function handleConfirmAndTransferVoucher(req: any, res: any) {
  const { id } = req.params;
  const { trip_title, notes } = req.body;
  let idx = db.vouchers.findIndex(v => v.id === id);
  if (idx === -1) {
    await getCollectionDocs('vouchers');
    idx = db.vouchers.findIndex(v => v.id === id);
  }
  if (idx === -1) {
    return res.status(404).json({ error: "Voucher not found" });
  }

  const v = db.vouchers[idx];
  v.status = "Converted to Trip/Service";
  v.confirmed_at = new Date().toISOString();
  v.converted_at = new Date().toISOString();
  v.converted_trip_title = trip_title || v.service_title;
  v.reservation_status = "Confirmed";
  if (notes) v.notes = (v.notes ? v.notes + "\n" : "") + `[Confirmed & Converted to Trip on ${new Date().toLocaleDateString()}]: ${notes}`;

  await saveToFirestore('vouchers', id, v);
  await saveToFirestore('reservations', id, v);

  // 1. Generate Customer Invoice if not exists
  const existingCustInv = db.invoices?.find(inv => inv.recipient_type === 'Customer' && (inv.notes?.includes(v.voucher_number) || inv.items?.some(i => i.item_reference_id === v.id)));
  if (!existingCustInv) {
    const custInvId = "INV-C-" + Math.random().toString(36).substring(2, 7).toUpperCase();
    const custInvNum = `INV-2026-${(db.invoices?.length || 0) + 1001}`;
    const sellingPrice = Number(v.selling_price) || 0;
    const paidAmt = Number(v.paid_amount) || 0;
    const balDue = Math.max(0, sellingPrice - paidAmt);
    const customerInvoice = {
      id: custInvId,
      invoice_number: custInvNum,
      issue_date: new Date().toISOString().split('T')[0],
      due_date: v.travel_date || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      recipient_type: 'Customer',
      customer_id: v.customer_id,
      customer_name: v.customer_name,
      customer_phone: v.customer_phone,
      customer_email: v.customer_email,
      customer_passport: v.customer_passport,
      currency: v.currency || 'USD',
      items: [
        {
          id: 'ITEM-C-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
          item_type: 'Custom',
          item_reference_id: v.id,
          title: v.service_title || 'Tourism Service & Voucher Item',
          description: `Confirmed from Voucher #${v.voucher_number} - Destination: ${v.destination}`,
          quantity: v.number_of_travelers || 1,
          unit_price: sellingPrice / (v.number_of_travelers || 1),
          total_price: sellingPrice
        }
      ],
      subtotal: sellingPrice,
      discount: 0,
      tax_rate: 0,
      tax_amount: 0,
      total_amount: sellingPrice,
      paid_amount: paidAmt,
      balance_due: balDue,
      payment_status: balDue === 0 ? 'Paid' : (paidAmt > 0 ? 'Partial' : 'Unpaid'),
      notes: `Generated automatically upon confirming and transferring voucher #${v.voucher_number} for service "${v.service_title}".`,
      created_by_employee: v.employee_name || 'Sofia Travel Staff',
      manager_name: 'Ahmed Ali'
    };
    if (!db.invoices) db.invoices = [];
    db.invoices.unshift(customerInvoice);
    await saveToFirestore('invoices', custInvId, customerInvoice);
    if (v.customer_id) {
      const cust = db.customers?.find(c => c.id === v.customer_id || c.customer_id === v.customer_id);
      if (cust) {
        cust.outstanding_balance = (cust.outstanding_balance || 0) + balDue;
        await saveToFirestore('customers', cust.id, cust);
      }
    }
  }

  // 2. Generate Supplier Invoice if not exists
  const existingSupInv = db.invoices?.find(inv => inv.recipient_type === 'Supplier' && (inv.notes?.includes(v.voucher_number) || inv.items?.some(i => i.item_reference_id === v.id)));
  if (!existingSupInv && v.cost_price && v.cost_price > 0) {
    const supInvId = "INV-S-" + Math.random().toString(36).substring(2, 7).toUpperCase();
    const supInvNum = `BILL-2026-${(db.invoices?.length || 0) + 1002}`;
    const costPrice = Number(v.cost_price) || 0;
    const supplierInvoice = {
      id: supInvId,
      invoice_number: supInvNum,
      issue_date: new Date().toISOString().split('T')[0],
      due_date: v.travel_date || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      recipient_type: 'Supplier',
      supplier_id: v.supplier_id || 'SUP-DEFAULT',
      supplier_name: v.supplier_name || 'Primary Supplier',
      currency: v.currency || 'USD',
      items: [
        {
          id: 'ITEM-S-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
          item_type: 'Custom',
          item_reference_id: v.id,
          title: `Supplier Payable for ${v.service_title}`,
          description: `Supplier liability for confirmed voucher #${v.voucher_number} (${v.destination})`,
          quantity: v.number_of_travelers || 1,
          unit_price: costPrice / (v.number_of_travelers || 1),
          total_price: costPrice
        }
      ],
      subtotal: costPrice,
      discount: 0,
      tax_rate: 0,
      tax_amount: 0,
      total_amount: costPrice,
      paid_amount: 0,
      balance_due: costPrice,
      payment_status: 'Unpaid',
      notes: `Company payable invoice to supplier ${v.supplier_name || 'supplier'} for confirmed voucher #${v.voucher_number}.`,
      created_by_employee: v.employee_name || 'Sofia Travel Staff',
      manager_name: 'Ahmed Ali'
    };
    db.invoices.unshift(supplierInvoice);
    await saveToFirestore('invoices', supInvId, supplierInvoice);
    if (v.supplier_id) {
      const sup = db.suppliers?.find(s => s.id === v.supplier_id);
      if (sup) {
        sup.outstanding_balance = (sup.outstanding_balance || 0) + costPrice;
        await saveToFirestore('suppliers', sup.id, sup);
      }
    }
  }

  const user = (req.headers['x-acting-user'] as string) || v.employee_name || "Staff";
  await logActivity(user, `Confirmed & Converted voucher ${v.voucher_number} into active trip "${v.converted_trip_title}" & generated invoices`, "Vouchers", v.voucher_number);
  await addNotification(
    'Voucher Converted & Invoices Generated',
    `Voucher #${v.voucher_number} was confirmed and transferred. Customer and supplier invoices generated, and service saved to completed trips.`,
    'voucher',
    v.id
  );
  res.json({ voucher: v, status: 'success' });
}

app.post("/api/vouchers/:id/convert", handleConfirmAndTransferVoucher);
app.post("/api/vouchers/:id/convert-to-trip", handleConfirmAndTransferVoucher);

// Backward compatibility for Reservations endpoints
app.get("/api/reservations", async (req, res) => {
  const reservations = await getCollectionDocs('reservations');
  res.json(reservations);
});

app.post("/api/reservations", async (req, res) => {
  const item = await handleSaveVoucher(req.body, false);
  res.json(item);
});

app.put("/api/reservations/:id", async (req, res) => {
  const { id } = req.params;
  const item = await handleSaveVoucher(req.body, true, id);
  res.json(item);
});

app.delete("/api/reservations/:id", async (req, res) => {
  const { id } = req.params;
  db.reservations = db.reservations.filter(r => r.id !== id);
  db.vouchers = db.vouchers.filter(v => v.id !== id);
  await logActivity("Administrator", "Deleted reservation", "Reservations", id);
  await deleteFromFirestore('reservations', id);
  await deleteFromFirestore('vouchers', id);
  res.json({ success: true });
});

// Tourism Services: Visas
app.get("/api/visas", async (req, res) => {
  const items = await getCollectionDocs('visas');
  res.json(items);
});

app.post("/api/visas", async (req, res) => {
  const id = req.body.id || ("VISA-" + Math.random().toString(36).substring(2, 7).toUpperCase());
  const visa = {
    ...req.body,
    id,
    currency: req.body.currency || 'USD',
    embassy_consular_fee: Number(req.body.embassy_consular_fee) || 0,
    agency_fee: Number(req.body.agency_fee) || 0,
    cost_price: Number(req.body.cost_price) || 0,
    selling_price: Number(req.body.selling_price) || 0
  };
  const idx = db.visas.findIndex(v => v.id === id);
  if (idx >= 0) db.visas[idx] = visa;
  else db.visas.push(visa);
  await saveToFirestore('visas', id, visa);
  const user = (req.headers['x-acting-user'] as string) || "Staff";
  await logActivity(user, `Registered visa service for ${visa.country} (${visa.visa_title})`, "Visas", visa.visa_title);
  await addNotification(
    'Visa Service Registered',
    `Visa service "${visa.visa_title}" for ${visa.country} (${visa.selling_price} ${visa.currency}) was added by ${user}.`,
    'service',
    visa.id
  );
  res.json(visa);
});

app.put("/api/visas/:id", async (req, res) => {
  const { id } = req.params;
  let idx = db.visas.findIndex(v => v.id === id);
  if (idx === -1) {
    await getCollectionDocs('visas');
    idx = db.visas.findIndex(v => v.id === id);
  }
  const existing = idx !== -1 ? db.visas[idx] : { id };
  const updated = {
    ...existing,
    ...req.body,
    id,
    currency: req.body.currency || existing.currency || 'USD',
    embassy_consular_fee: Number(req.body.embassy_consular_fee !== undefined ? req.body.embassy_consular_fee : existing.embassy_consular_fee) || 0,
    agency_fee: Number(req.body.agency_fee !== undefined ? req.body.agency_fee : existing.agency_fee) || 0,
    cost_price: Number(req.body.cost_price !== undefined ? req.body.cost_price : existing.cost_price) || 0,
    selling_price: Number(req.body.selling_price !== undefined ? req.body.selling_price : existing.selling_price) || 0
  };
  if (idx !== -1) db.visas[idx] = updated;
  else db.visas.push(updated);
  await saveToFirestore('visas', id, updated);
  const user = (req.headers['x-acting-user'] as string) || "Staff";
  await logActivity(user, `Updated visa service for ${updated.country}`, "Visas", updated.visa_title);
  await addNotification(
    'Visa Service Updated',
    `Visa service for ${updated.country} (${updated.visa_title}) was updated by ${user}.`,
    'service',
    updated.id
  );
  res.json(updated);
});

app.delete("/api/visas/:id", async (req, res) => {
  const { id } = req.params;
  const user = (req.headers['x-acting-user'] as string) || "Administrator";
  db.visas = db.visas.filter(v => v.id !== id);
  await deleteFromFirestore('visas', id);
  await logActivity(user, "Deleted visa service", "Visas", id);
  await addNotification(
    'Visa Service Deleted',
    `Visa service record #${id} was deleted by ${user}.`,
    'service',
    id
  );
  res.json({ success: true });
});

// Tourism Services: Transfers
app.get("/api/transfers", async (req, res) => {
  const items = await getCollectionDocs('transfers');
  res.json(items);
});

app.post("/api/transfers", async (req, res) => {
  const id = req.body.id || ("TRF-" + Math.random().toString(36).substring(2, 7).toUpperCase());
  const transfer = {
    ...req.body,
    id,
    currency: req.body.currency || 'USD',
    cost_price: Number(req.body.cost_price) || 0,
    selling_price: Number(req.body.selling_price) || 0,
    max_passengers: Number(req.body.max_passengers) || 4,
    max_luggage: Number(req.body.max_luggage) || 3
  };
  const idx = db.transfers.findIndex(t => t.id === id);
  if (idx >= 0) db.transfers[idx] = transfer;
  else db.transfers.push(transfer);
  await saveToFirestore('transfers', id, transfer);
  const user = (req.headers['x-acting-user'] as string) || "Staff";
  await logActivity(user, `Registered transfer route: ${transfer.service_title}`, "Transfers", transfer.service_title);
  await addNotification(
    'Transfer Service Registered',
    `Transfer route "${transfer.service_title}" (${transfer.vehicle_type}, ${transfer.selling_price} ${transfer.currency}) was added by ${user}.`,
    'service',
    transfer.id
  );
  res.json(transfer);
});

app.put("/api/transfers/:id", async (req, res) => {
  const { id } = req.params;
  let idx = db.transfers.findIndex(t => t.id === id);
  if (idx === -1) {
    await getCollectionDocs('transfers');
    idx = db.transfers.findIndex(t => t.id === id);
  }
  const existing = idx !== -1 ? db.transfers[idx] : { id };
  const updated = {
    ...existing,
    ...req.body,
    id,
    currency: req.body.currency || existing.currency || 'USD',
    cost_price: Number(req.body.cost_price !== undefined ? req.body.cost_price : existing.cost_price) || 0,
    selling_price: Number(req.body.selling_price !== undefined ? req.body.selling_price : existing.selling_price) || 0,
    max_passengers: Number(req.body.max_passengers !== undefined ? req.body.max_passengers : existing.max_passengers) || 4,
    max_luggage: Number(req.body.max_luggage !== undefined ? req.body.max_luggage : existing.max_luggage) || 3
  };
  if (idx !== -1) db.transfers[idx] = updated;
  else db.transfers.push(updated);
  await saveToFirestore('transfers', id, updated);
  const user = (req.headers['x-acting-user'] as string) || "Staff";
  await logActivity(user, `Updated transfer route: ${updated.service_title}`, "Transfers", updated.service_title);
  await addNotification(
    'Transfer Service Updated',
    `Transfer route "${updated.service_title}" was modified by ${user}.`,
    'service',
    updated.id
  );
  res.json(updated);
});

app.delete("/api/transfers/:id", async (req, res) => {
  const { id } = req.params;
  const user = (req.headers['x-acting-user'] as string) || "Administrator";
  db.transfers = db.transfers.filter(t => t.id !== id);
  await deleteFromFirestore('transfers', id);
  await logActivity(user, "Deleted transfer route", "Transfers", id);
  await addNotification(
    'Transfer Service Deleted',
    `Transfer route #${id} was deleted by ${user}.`,
    'service',
    id
  );
  res.json({ success: true });
});

// Tourism Services: Cruises
app.get("/api/cruises", async (req, res) => {
  const items = await getCollectionDocs('cruises');
  res.json(items);
});

app.post("/api/cruises", async (req, res) => {
  const id = req.body.id || ("CRZ-" + Math.random().toString(36).substring(2, 7).toUpperCase());
  const cruise = {
    ...req.body,
    id,
    currency: req.body.currency || 'USD',
    cost_price: Number(req.body.cost_price) || 0,
    selling_price: Number(req.body.selling_price) || 0,
    duration_nights: Number(req.body.duration_nights) || 4
  };
  const idx = db.cruises.findIndex(c => c.id === id);
  if (idx >= 0) db.cruises[idx] = cruise;
  else db.cruises.push(cruise);
  await saveToFirestore('cruises', id, cruise);
  const user = (req.headers['x-acting-user'] as string) || "Staff";
  await logActivity(user, `Registered cruise ship: ${cruise.cruise_name}`, "Cruises", cruise.cruise_name);
  await addNotification(
    'Cruise Service Registered',
    `Cruise package "${cruise.cruise_name}" (${cruise.route_itinerary}, ${cruise.selling_price} ${cruise.currency}) was added by ${user}.`,
    'service',
    cruise.id
  );
  res.json(cruise);
});

app.put("/api/cruises/:id", async (req, res) => {
  const { id } = req.params;
  let idx = db.cruises.findIndex(c => c.id === id);
  if (idx === -1) {
    await getCollectionDocs('cruises');
    idx = db.cruises.findIndex(c => c.id === id);
  }
  const existing = idx !== -1 ? db.cruises[idx] : { id };
  const updated = {
    ...existing,
    ...req.body,
    id,
    currency: req.body.currency || existing.currency || 'USD',
    cost_price: Number(req.body.cost_price !== undefined ? req.body.cost_price : existing.cost_price) || 0,
    selling_price: Number(req.body.selling_price !== undefined ? req.body.selling_price : existing.selling_price) || 0,
    duration_nights: Number(req.body.duration_nights !== undefined ? req.body.duration_nights : existing.duration_nights) || 4
  };
  if (idx !== -1) db.cruises[idx] = updated;
  else db.cruises.push(updated);
  await saveToFirestore('cruises', id, updated);
  const user = (req.headers['x-acting-user'] as string) || "Staff";
  await logActivity(user, `Updated cruise ship: ${updated.cruise_name}`, "Cruises", updated.cruise_name);
  await addNotification(
    'Cruise Service Updated',
    `Cruise ship "${updated.cruise_name}" was updated by ${user}.`,
    'service',
    updated.id
  );
  res.json(updated);
});

app.delete("/api/cruises/:id", async (req, res) => {
  const { id } = req.params;
  const user = (req.headers['x-acting-user'] as string) || "Administrator";
  db.cruises = db.cruises.filter(c => c.id !== id);
  await deleteFromFirestore('cruises', id);
  await logActivity(user, "Deleted cruise ship", "Cruises", id);
  await addNotification(
    'Cruise Service Deleted',
    `Cruise ship record #${id} was deleted by ${user}.`,
    'service',
    id
  );
  res.json({ success: true });
});

// Tourism Services: Tours
app.get("/api/tours", async (req, res) => {
  const items = await getCollectionDocs('tours');
  res.json(items);
});

app.post("/api/tours", async (req, res) => {
  const id = req.body.id || ("TOUR-" + Math.random().toString(36).substring(2, 7).toUpperCase());
  const tour = {
    ...req.body,
    id,
    currency: req.body.currency || 'USD',
    cost_price: Number(req.body.cost_price) || 0,
    selling_price: Number(req.body.selling_price) || 0,
    duration_days: Number(req.body.duration_days) || 1,
    min_travelers: Number(req.body.min_travelers) || 1,
    max_travelers: Number(req.body.max_travelers) || 30
  };
  const idx = db.tours.findIndex(t => t.id === id);
  if (idx >= 0) db.tours[idx] = tour;
  else db.tours.push(tour);
  await saveToFirestore('tours', id, tour);
  const user = (req.headers['x-acting-user'] as string) || "Staff";
  await logActivity(user, `Registered tour program: ${tour.tour_title}`, "Tours", tour.tour_title);
  await addNotification(
    'Guided Tour Registered',
    `Guided tour program "${tour.tour_title}" (${tour.duration_days} Days, ${tour.selling_price} ${tour.currency}) was added by ${user}.`,
    'service',
    tour.id
  );
  res.json(tour);
});

app.put("/api/tours/:id", async (req, res) => {
  const { id } = req.params;
  let idx = db.tours.findIndex(t => t.id === id);
  if (idx === -1) {
    await getCollectionDocs('tours');
    idx = db.tours.findIndex(t => t.id === id);
  }
  const existing = idx !== -1 ? db.tours[idx] : { id };
  const updated = {
    ...existing,
    ...req.body,
    id,
    currency: req.body.currency || existing.currency || 'USD',
    cost_price: Number(req.body.cost_price !== undefined ? req.body.cost_price : existing.cost_price) || 0,
    selling_price: Number(req.body.selling_price !== undefined ? req.body.selling_price : existing.selling_price) || 0,
    duration_days: Number(req.body.duration_days !== undefined ? req.body.duration_days : existing.duration_days) || 1,
    min_travelers: Number(req.body.min_travelers !== undefined ? req.body.min_travelers : existing.min_travelers) || 1,
    max_travelers: Number(req.body.max_travelers !== undefined ? req.body.max_travelers : existing.max_travelers) || 30
  };
  if (idx !== -1) db.tours[idx] = updated;
  else db.tours.push(updated);
  await saveToFirestore('tours', id, updated);
  const user = (req.headers['x-acting-user'] as string) || "Staff";
  await logActivity(user, `Updated tour program: ${updated.tour_title}`, "Tours", updated.tour_title);
  await addNotification(
    'Guided Tour Updated',
    `Guided tour "${updated.tour_title}" was updated by ${user}.`,
    'service',
    updated.id
  );
  res.json(updated);
});

app.delete("/api/tours/:id", async (req, res) => {
  const { id } = req.params;
  const user = (req.headers['x-acting-user'] as string) || "Administrator";
  db.tours = db.tours.filter(t => t.id !== id);
  await deleteFromFirestore('tours', id);
  await logActivity(user, "Deleted tour program", "Tours", id);
  await addNotification(
    'Guided Tour Deleted',
    `Guided tour program #${id} was deleted by ${user}.`,
    'service',
    id
  );
  res.json({ success: true });
});

// Tourism Services: Day Trips
app.get("/api/day-trips", async (req, res) => {
  const items = await getCollectionDocs('day_trips');
  res.json(items);
});

app.post("/api/day-trips", async (req, res) => {
  const id = req.body.id || ("DAY-" + Math.random().toString(36).substring(2, 7).toUpperCase());
  const trip = {
    ...req.body,
    id,
    currency: req.body.currency || 'USD',
    cost_price: Number(req.body.cost_price) || 0,
    selling_price: Number(req.body.selling_price) || 0,
    duration_hours: Number(req.body.duration_hours) || 6
  };
  const idx = db.day_trips.findIndex(d => d.id === id);
  if (idx >= 0) db.day_trips[idx] = trip;
  else db.day_trips.push(trip);
  await saveToFirestore('day_trips', id, trip);
  const user = (req.headers['x-acting-user'] as string) || "Staff";
  await logActivity(user, `Registered day trip: ${trip.trip_title}`, "Day Trips", trip.trip_title);
  await addNotification(
    'Day Trip Excursion Registered',
    `Day trip excursion "${trip.trip_title}" (${trip.city_location}, ${trip.selling_price} ${trip.currency}) was added by ${user}.`,
    'service',
    trip.id
  );
  res.json(trip);
});

app.put("/api/day-trips/:id", async (req, res) => {
  const { id } = req.params;
  let idx = db.day_trips.findIndex(d => d.id === id);
  if (idx === -1) {
    await getCollectionDocs('day_trips');
    idx = db.day_trips.findIndex(d => d.id === id);
  }
  const existing = idx !== -1 ? db.day_trips[idx] : { id };
  const updated = {
    ...existing,
    ...req.body,
    id,
    currency: req.body.currency || existing.currency || 'USD',
    cost_price: Number(req.body.cost_price !== undefined ? req.body.cost_price : existing.cost_price) || 0,
    selling_price: Number(req.body.selling_price !== undefined ? req.body.selling_price : existing.selling_price) || 0,
    duration_hours: Number(req.body.duration_hours !== undefined ? req.body.duration_hours : existing.duration_hours) || 6
  };
  if (idx !== -1) db.day_trips[idx] = updated;
  else db.day_trips.push(updated);
  await saveToFirestore('day_trips', id, updated);
  const user = (req.headers['x-acting-user'] as string) || "Staff";
  await logActivity(user, `Updated day trip: ${updated.trip_title}`, "Day Trips", updated.trip_title);
  await addNotification(
    'Day Trip Updated',
    `Day trip excursion "${updated.trip_title}" was updated by ${user}.`,
    'service',
    updated.id
  );
  res.json(updated);
});

app.delete("/api/day-trips/:id", async (req, res) => {
  const { id } = req.params;
  const user = (req.headers['x-acting-user'] as string) || "Administrator";
  db.day_trips = db.day_trips.filter(d => d.id !== id);
  await deleteFromFirestore('day_trips', id);
  await logActivity(user, "Deleted day trip", "Day Trips", id);
  await addNotification(
    'Day Trip Deleted',
    `Day trip excursion #${id} was deleted by ${user}.`,
    'service',
    id
  );
  res.json({ success: true });
});

// Tour Packages
app.get("/api/tour-packages", async (req, res) => {
  const pkgs = await getCollectionDocs('tour_packages');
  res.json(pkgs);
});

app.post("/api/tour-packages", async (req, res) => {
  const pkgId = req.body.id || ("PKG-" + Math.random().toString(36).substring(2, 7).toUpperCase());
  const pkg = {
    ...req.body,
    id: pkgId,
    currency: req.body.currency || 'USD'
  };
  const idx = db.tour_packages.findIndex(p => p.id === pkg.id);
  if (idx >= 0) {
    db.tour_packages[idx] = pkg;
  } else {
    db.tour_packages.push(pkg);
  }
  const user = (req.headers['x-acting-user'] as string) || "Staff";
  await logActivity(user, `Created tour package ${pkg.package_name}`, "Tour Packages", pkg.package_name);
  await addNotification(
    'Tour Package Created',
    `Tour package "${pkg.package_name}" (${pkg.selling_price} ${pkg.currency}) was created by ${user}.`,
    'package',
    pkg.id
  );
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
  const updated = { ...current, ...req.body, id, currency: req.body.currency || current.currency || 'USD' };
  if (idx !== -1) {
    db.tour_packages[idx] = updated;
  } else {
    db.tour_packages.push(updated);
  }
  await saveToFirestore('tour_packages', id, updated);
  const user = (req.headers['x-acting-user'] as string) || "Staff";
  await addNotification(
    'Tour Package Updated',
    `Tour package "${updated.package_name}" was updated by ${user}.`,
    'package',
    id
  );
  res.json(updated);
});

app.delete("/api/tour-packages/:id", async (req, res) => {
  const { id } = req.params;
  const user = (req.headers['x-acting-user'] as string) || "Administrator";
  db.tour_packages = db.tour_packages.filter(p => p.id !== id);
  await deleteFromFirestore('tour_packages', id);
  await addNotification(
    'Tour Package Deleted',
    `Tour package #${id} was deleted by ${user}.`,
    'package',
    id
  );
  res.json({ success: true });
});

// Hotels
app.get("/api/hotels", async (req, res) => {
  const hotels = await getCollectionDocs('hotels');
  res.json(hotels);
});

app.post("/api/hotels", async (req, res) => {
  const hotId = req.body.id || ("HOT-" + Math.random().toString(36).substring(2, 7).toUpperCase());
  const hotel = {
    ...req.body,
    id: hotId,
    currency: req.body.currency || 'USD'
  };
  const idx = db.hotels.findIndex(h => h.id === hotel.id);
  if (idx >= 0) {
    db.hotels[idx] = hotel;
  } else {
    db.hotels.push(hotel);
  }
  await saveToFirestore('hotels', hotel.id, hotel);
  const user = (req.headers['x-acting-user'] as string) || "Staff";
  await logActivity(user, `Registered hotel partner: ${hotel.hotel_name}`, "Hotels", hotel.hotel_name);
  await addNotification(
    'Partner Hotel Registered',
    `Hotel "${hotel.hotel_name}" in ${hotel.city}, ${hotel.country} (${hotel.selling_price} ${hotel.currency}) was added by ${user}.`,
    'hotel',
    hotel.id
  );
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
  const updated = { ...current, ...req.body, id, currency: req.body.currency || current.currency || 'USD' };
  if (idx !== -1) {
    db.hotels[idx] = updated;
  } else {
    db.hotels.push(updated);
  }
  await saveToFirestore('hotels', id, updated);
  const user = (req.headers['x-acting-user'] as string) || "Staff";
  await logActivity(user, `Updated hotel partner: ${updated.hotel_name}`, "Hotels", updated.hotel_name);
  await addNotification(
    'Hotel Partner Updated',
    `Hotel "${updated.hotel_name}" was updated by ${user}.`,
    'hotel',
    id
  );
  res.json(updated);
});

app.delete("/api/hotels/:id", async (req, res) => {
  const { id } = req.params;
  const user = (req.headers['x-acting-user'] as string) || "Administrator";
  db.hotels = db.hotels.filter(h => h.id !== id);
  await deleteFromFirestore('hotels', id);
  await logActivity(user, "Deleted hotel partner", "Hotels", id);
  await addNotification(
    'Hotel Partner Deleted',
    `Hotel record #${id} was deleted by ${user}.`,
    'hotel',
    id
  );
  res.json({ success: true });
});

// Flights
app.get("/api/flights", async (req, res) => {
  const flights = await getCollectionDocs('flights');
  res.json(flights);
});

app.post("/api/flights", async (req, res) => {
  const fltId = req.body.id || ("FL-" + Math.random().toString(36).substring(2, 7).toUpperCase());
  const flight = {
    ...req.body,
    id: fltId,
    currency: req.body.currency || 'USD'
  };
  const idx = db.flights.findIndex(f => f.id === flight.id);
  if (idx >= 0) {
    db.flights[idx] = flight;
  } else {
    db.flights.push(flight);
  }
  await saveToFirestore('flights', flight.id, flight);
  const user = (req.headers['x-acting-user'] as string) || "Staff";
  await logActivity(user, `Registered flight ticket: ${flight.airline} ${flight.flight_number} (${flight.passenger})`, "Flights", flight.passenger);
  await addNotification(
    'Flight Booking Registered',
    `Flight ticket ${flight.airline} ${flight.flight_number} for passenger ${flight.passenger} (${flight.selling_price} ${flight.currency}) was added by ${user}.`,
    'flight',
    flight.id
  );
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
  const updated = { ...current, ...req.body, id, currency: req.body.currency || current.currency || 'USD' };
  if (idx !== -1) {
    db.flights[idx] = updated;
  } else {
    db.flights.push(updated);
  }
  await saveToFirestore('flights', id, updated);
  const user = (req.headers['x-acting-user'] as string) || "Staff";
  await logActivity(user, `Updated flight ticket: ${updated.airline} ${updated.flight_number}`, "Flights", updated.passenger);
  await addNotification(
    'Flight Booking Updated',
    `Flight ticket ${updated.airline} ${updated.flight_number} was updated by ${user}.`,
    'flight',
    id
  );
  res.json(updated);
});

app.delete("/api/flights/:id", async (req, res) => {
  const { id } = req.params;
  const user = (req.headers['x-acting-user'] as string) || "Administrator";
  db.flights = db.flights.filter(f => f.id !== id);
  await deleteFromFirestore('flights', id);
  await logActivity(user, "Deleted flight ticket", "Flights", id);
  await addNotification(
    'Flight Booking Deleted',
    `Flight booking #${id} was deleted by ${user}.`,
    'flight',
    id
  );
  res.json({ success: true });
});

// Suppliers
app.get("/api/suppliers", async (req, res) => {
  const suppliers = await getCollectionDocs('suppliers');
  res.json(suppliers);
});

app.post("/api/suppliers", async (req, res) => {
  const supId = req.body.id || ("SUP-" + Math.random().toString(36).substring(2, 7).toUpperCase());
  const sup = {
    outstanding_balance: 0,
    ...req.body,
    id: supId
  };
  const idx = db.suppliers.findIndex(s => s.id === sup.id);
  if (idx >= 0) {
    db.suppliers[idx] = sup;
  } else {
    db.suppliers.push(sup);
  }
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
  const payId = req.body.id || ("PAY-C-" + Math.random().toString(36).substring(2, 7).toUpperCase());
  const pay = {
    payment_id: req.body.payment_id || ("CP-" + Math.floor(5000 + Math.random() * 9000)),
    date: req.body.date || new Date().toISOString().split('T')[0],
    ...req.body,
    id: payId
  };
  const idx = db.customer_payments.findIndex(p => p.id === pay.id);
  if (idx >= 0) {
    db.customer_payments[idx] = pay;
  } else {
    db.customer_payments.push(pay);
  }

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

  await logActivity((req.headers['x-acting-user'] as string) || "Staff", `Recorded customer payment of $${pay.amount}`, "Finance", pay.payment_id);
  await saveToFirestore('customer_payments', pay.id, pay);
  res.json(pay);
});

// Supplier Payments
app.get("/api/supplier-payments", async (req, res) => {
  const pays = await getCollectionDocs('supplier_payments');
  res.json(pays);
});

app.post("/api/supplier-payments", async (req, res) => {
  const payId = req.body.id || ("PAY-S-" + Math.random().toString(36).substring(2, 7).toUpperCase());
  const pay = {
    payment_id: req.body.payment_id || ("SP-" + Math.floor(7000 + Math.random() * 9000)),
    payment_date: req.body.payment_date || new Date().toISOString().split('T')[0],
    ...req.body,
    id: payId
  };
  const idx = db.supplier_payments.findIndex(p => p.id === pay.id);
  if (idx >= 0) {
    db.supplier_payments[idx] = pay;
  } else {
    db.supplier_payments.push(pay);
  }

  const sup = db.suppliers.find(s => s.id === pay.supplier_id);
  if (sup) {
    sup.outstanding_balance = Math.max(0, sup.outstanding_balance - Number(pay.amount));
  }

  await logActivity((req.headers['x-acting-user'] as string) || "Staff", `Recorded supplier payment of $${pay.amount}`, "Finance", pay.payment_id || pay.id);
  await saveToFirestore('supplier_payments', pay.id, pay);
  res.json(pay);
});

// Expenses
app.get("/api/expenses", async (req, res) => {
  const expenses = await getCollectionDocs('expenses');
  res.json(expenses);
});

app.post("/api/expenses", async (req, res) => {
  const expId = req.body.id || ("EXP-" + Math.random().toString(36).substring(2, 7).toUpperCase());
  const exp = {
    expense_id: req.body.expense_id || ("EX-" + Math.floor(300 + Math.random() * 900)),
    date: req.body.date || new Date().toISOString().split('T')[0],
    ...req.body,
    id: expId
  };
  const idx = db.expenses.findIndex(e => e.id === exp.id);
  if (idx >= 0) {
    db.expenses[idx] = exp;
  } else {
    db.expenses.push(exp);
  }
  await logActivity((req.headers['x-acting-user'] as string) || "Staff", `Recorded expense ${exp.category} ($${exp.amount})`, "Finance", exp.expense_id);
  await saveToFirestore('expenses', exp.id, exp);
  res.json(exp);
});

app.put("/api/expenses/:id", async (req, res) => {
  const { id } = req.params;
  const idx = db.expenses.findIndex(e => e.id === id);
  if (idx >= 0) {
    db.expenses[idx] = { ...db.expenses[idx], ...req.body };
    await saveToFirestore('expenses', id, db.expenses[idx]);
    return res.json(db.expenses[idx]);
  }
  const newExp = { id, ...req.body };
  db.expenses.push(newExp);
  await saveToFirestore('expenses', id, newExp);
  res.json(newExp);
});

app.delete("/api/expenses/:id", async (req, res) => {
  const { id } = req.params;
  db.expenses = db.expenses.filter(e => e.id !== id);
  await deleteFromFirestore('expenses', id);
  res.json({ success: true });
});

// Payroll Records
app.get("/api/payroll-records", async (req, res) => {
  const records = await getCollectionDocs('payroll_records');
  res.json(records);
});

app.post("/api/payroll-records", async (req, res) => {
  const rec = {
    id: req.body.id || ("PAY-" + Math.random().toString(36).substring(2, 7).toUpperCase()),
    ...req.body
  };
  const idx = db.payroll_records.findIndex(p => p.id === rec.id);
  if (idx >= 0) {
    db.payroll_records[idx] = rec;
  } else {
    db.payroll_records.push(rec);
  }
  await saveToFirestore('payroll_records', rec.id, rec);
  res.json(rec);
});

app.put("/api/payroll-records/:id", async (req, res) => {
  const { id } = req.params;
  const idx = db.payroll_records.findIndex(p => p.id === id);
  if (idx >= 0) {
    db.payroll_records[idx] = { ...db.payroll_records[idx], ...req.body };
    await saveToFirestore('payroll_records', id, db.payroll_records[idx]);
    return res.json(db.payroll_records[idx]);
  }
  const newRec = { id, ...req.body };
  db.payroll_records.push(newRec);
  await saveToFirestore('payroll_records', id, newRec);
  res.json(newRec);
});

// Employee Advances
app.get("/api/employee-advances", async (req, res) => {
  const advances = await getCollectionDocs('employee_advances');
  res.json(advances);
});

app.post("/api/employee-advances", async (req, res) => {
  const adv = {
    id: req.body.id || ("ADV-" + Math.random().toString(36).substring(2, 7).toUpperCase()),
    ...req.body
  };
  db.employee_advances.push(adv);
  await saveToFirestore('employee_advances', adv.id, adv);
  res.json(adv);
});

app.put("/api/employee-advances/:id", async (req, res) => {
  const { id } = req.params;
  const idx = db.employee_advances.findIndex(a => a.id === id);
  if (idx >= 0) {
    db.employee_advances[idx] = { ...db.employee_advances[idx], ...req.body };
    await saveToFirestore('employee_advances', id, db.employee_advances[idx]);
    return res.json(db.employee_advances[idx]);
  }
  const newAdv = { id, ...req.body };
  db.employee_advances.push(newAdv);
  await saveToFirestore('employee_advances', id, newAdv);
  res.json(newAdv);
});

app.delete("/api/employee-advances/:id", async (req, res) => {
  const { id } = req.params;
  db.employee_advances = db.employee_advances.filter(a => a.id !== id);
  await deleteFromFirestore('employee_advances', id);
  res.json({ success: true });
});

// Commission Records
app.get("/api/commission-records", async (req, res) => {
  const commissions = await getCollectionDocs('commission_records');
  res.json(commissions);
});

app.post("/api/commission-records", async (req, res) => {
  const comm = {
    id: req.body.id || ("COMM-" + Math.random().toString(36).substring(2, 7).toUpperCase()),
    ...req.body
  };
  db.commission_records.push(comm);
  await saveToFirestore('commission_records', comm.id, comm);
  res.json(comm);
});

app.delete("/api/commission-records/:id", async (req, res) => {
  const { id } = req.params;
  db.commission_records = db.commission_records.filter(c => c.id !== id);
  await deleteFromFirestore('commission_records', id);
  res.json({ success: true });
});

// Finance Audit Logs
app.get("/api/finance-audit-logs", async (req, res) => {
  const logs = await getCollectionDocs('finance_audit_logs');
  res.json(logs);
});

app.post("/api/finance-audit-logs", async (req, res) => {
  const log = {
    id: req.body.id || ("LOG-F-" + Math.random().toString(36).substring(2, 7).toUpperCase()),
    ...req.body
  };
  db.finance_audit_logs.push(log);
  await saveToFirestore('finance_audit_logs', log.id, log);
  res.json(log);
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
  const empId = data.id || ("EMP-" + Math.random().toString(36).substring(2, 7).toUpperCase());
  const emp = {
    employee_id: data.employee_id || ("E-" + Math.floor(200 + Math.random() * 800)),
    joining_date: data.joining_date || new Date().toISOString().split('T')[0],
    ...data,
    id: empId,
    name,
    full_name: data.full_name || name,
    position,
    job_title: data.job_title || position,
    role: data.role || position,
    status: data.status || 'Active',
    salary: Number(data.salary) || 0
  };
  const idx = db.employees.findIndex(e => e.id === emp.id || (emp.employee_id && e.employee_id === emp.employee_id));
  if (idx >= 0) {
    db.employees[idx] = emp;
  } else {
    db.employees.push(emp);
  }
  await logActivity((req.headers['x-acting-user'] as string) || "Administrator", `Created/Updated employee account ${emp.name}`, "Employees", emp.employee_id);
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
  const taskId = req.body.id || ("TSK-" + Math.random().toString(36).substring(2, 7).toUpperCase());
  const task = {
    ...req.body,
    id: taskId
  };
  const idx = db.tasks.findIndex(t => t.id === task.id);
  if (idx >= 0) {
    db.tasks[idx] = task;
  } else {
    db.tasks.push(task);
  }
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
  const docId = req.body.id || ("DOC-" + Math.random().toString(36).substring(2, 7).toUpperCase());
  const doc = {
    upload_date: req.body.upload_date || new Date().toISOString().split('T')[0],
    file_size: "1.2 MB",
    file_url: "#",
    ...req.body,
    id: docId
  };
  const idx = db.documents.findIndex(d => d.id === doc.id);
  if (idx >= 0) {
    db.documents[idx] = doc;
  } else {
    db.documents.push(doc);
  }
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
  const invId = req.body.id || ("INV-" + Math.random().toString(36).substring(2, 7).toUpperCase());
  const invCount = (db.invoices?.length || 0) + 1001;
  const newInvoice = {
    invoice_number: req.body.invoice_number || `INV-2026-${invCount}`,
    issue_date: req.body.issue_date || new Date().toISOString().split('T')[0],
    due_date: req.body.due_date || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
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
    ...req.body,
    id: invId
  };

  if (!db.invoices) db.invoices = [];
  const idx = db.invoices.findIndex(inv => inv.id === newInvoice.id);
  if (idx >= 0) {
    db.invoices[idx] = newInvoice;
  } else {
    db.invoices.unshift(newInvoice);
  }

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

  // Load all persistent data from Firestore on startup
  (async () => {
    try {
      await testConnection();
      await loadFromFirestore();
      console.log("Persistent data successfully synchronized from Firestore. Database ready for live operations.");
    } catch (e) {
      console.warn("Background Firestore initialization note:", e);
    }
  })();
}

startServer();
