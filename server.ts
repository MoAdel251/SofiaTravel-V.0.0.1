
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import express from 'express';
import webpush from 'web-push';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, deleteDoc, getDocFromServer, setLogLevel } from "firebase/firestore";

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
    logo: "/sofia-logo.png",
    address: "124 Tahrir Square, Cairo, Egypt",
    phone: "+20 2 25750000",
    whatsapp: "+20 100 123 4567",
    email: "operations@sofiatravel.com",
    website: "https://www.sofiatravel.com",
    tax_number: "TR-987654321-001",
    manager_title: "Authorized Manager & Finance Director",
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
  finance_audit_logs: [],
  customer_inquiries: [],
  attendance: [],
  work_schedules: [],
  attendance_settings: [],
  employee_attendance: [],
  push_subscriptions: []
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
    "finance_audit_logs", "customer_inquiries", "attendance", "work_schedules", "attendance_settings", "employee_attendance",
    "push_subscriptions"
  ];
  try {
    console.log("Loading persistent data from Firestore...");
    const setSnap = await getDocs(collection(firestoreDb, "settings"));
    const reservedSettingIds = new Set(['system_status', 'web_push_vapid', 'schedule_reminder_state']);
    if (!setSnap.empty) {
      const foundDoc =
        setSnap.docs.find(d => d.id === 'company_settings') ||
        setSnap.docs.find(d => d.id === 'main') ||
        setSnap.docs.find(d => !reservedSettingIds.has(d.id));
      if (foundDoc) {
        db.settings = { ...db.settings, ...foundDoc.data() };
      }
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

async function wipeAllFirestoreTestData(includeNonAdminEmployees = true, actingAdmin = 'Administrator') {
  const collections = [
    "customers", "suppliers", "hotels", "flights", "tour_packages",
    "vouchers", "reservations", "visas", "transfers", "cruises", "tours", "day_trips",
    "customer_payments", "supplier_payments", "expenses",
    "tasks", "documents", "notifications", "invoices", "activity_logs",
    "permission_requests", "payroll_records", "employee_advances", "commission_records",
    "finance_audit_logs", "customer_inquiries", "attendance", "employee_attendance"
  ];
  console.log(`Admin action by ${actingAdmin}: Wiping all operational data from Firestore...`);
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

  if (includeNonAdminEmployees) {
    try {
      const empSnap = await getDocs(collection(firestoreDb, "employees"));
      const keptEmployees: any[] = [];
      for (const d of empSnap.docs) {
        const data = d.data();
        if (data.is_admin === true || data.position === 'Administrator' || data.role === 'Administrator') {
          keptEmployees.push({ id: d.id, ...data });
        } else {
          await deleteDoc(doc(firestoreDb, "employees", d.id));
        }
      }
      db.employees = keptEmployees;
    } catch (e) {
      console.warn("Could not wipe non-admin employees:", e);
      db.employees = (db.employees || []).filter(
        (emp: any) => emp.is_admin === true || emp.position === 'Administrator' || emp.role === 'Administrator'
      );
    }
  }

  try {
    await setDoc(doc(firestoreDb, "settings", "system_status"), {
      id: "system_status",
      lastFactoryResetAt: new Date().toISOString(),
      resetBy: actingAdmin,
      readyForRepublish: true
    }, { merge: true });
  } catch {}

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
  // Ensure installed phone PWAs always pull updated Service Worker and manifest immediately
  if (
    req.path === '/sw.js' ||
    req.path === '/push-sw.js' ||
    req.path === '/registerSW.js' ||
    req.path === '/manifest.webmanifest' ||
    req.path === '/manifest.json'
  ) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Service-Worker-Allowed', '/');
  }
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Administrator-Only Endpoint to completely clear all data from Firestore & Memory
app.post("/api/admin/clear-all-data", async (req, res) => {
  const actingRole = (req.headers['x-acting-role'] as string) || req.body?.role;
  const actingAdmin = (req.headers['x-acting-user'] as string) || req.body?.actingAdmin || 'Administrator';
  if (actingRole !== 'Administrator') {
    return res.status(403).json({ error: "Forbidden: Only the Administrator is authorized to delete all system data." });
  }
  const includeEmployees = req.body?.includeEmployees !== false;
  try {
    await wipeAllFirestoreTestData(includeEmployees, actingAdmin);
    res.json({ success: true, message: "All existing data has been permanently cleared from database and memory." });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to wipe data" });
  }
});

// Health & Database Connection Verification Endpoint
app.get("/api/health", async (req, res) => {
  let firestoreConnected = true;
  try {
    await getDocFromServer(doc(firestoreDb, "settings", "company_settings"));
  } catch (e: any) {
    if (e?.message?.includes("the client is offline")) {
      firestoreConnected = false;
    }
  }
  res.json({
    status: "ok",
    service: "Sofia Travel Management API",
    firestoreConnected,
    projectId: firebaseConfig.projectId,
    databaseId: firestoreDatabaseId || "(default)",
    timestamp: new Date().toISOString()
  });
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
    time: timeStr,
    createdAt: now.toISOString()
  };
  db.activity_logs.unshift(newLog);
  await saveToFirestore('activity_logs', newLog.id, newLog);
}

// Helper function to add notifications (with optional targeting & Web Push metadata)
async function addNotification(
  title: string,
  message: string,
  type: string = 'action',
  link_id?: string,
  extraFields: Record<string, any> = {}
) {
  const nowIso = new Date().toISOString();
  const notif = {
    id: extraFields.id || ('NOTIF-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6)),
    title,
    message,
    type: type as any,
    date: extraFields.date || nowIso.replace('T', ' ').substring(0, 16),
    created_at: extraFields.created_at || nowIso,
    read: false,
    read_by: Array.isArray(extraFields.read_by) ? extraFields.read_by : [],
    target_scope: extraFields.target_scope || 'ALL',
    link_id,
    ...extraFields,
  };
  if (!db.notifications) db.notifications = [];
  const existingIdx = db.notifications.findIndex((n: any) => n.id === notif.id);
  if (existingIdx >= 0) {
    db.notifications[existingIdx] = notif;
  } else {
    db.notifications.unshift(notif);
  }
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

  // Sync latest permission requests from Firestore if needed
  if (!db.permission_requests || db.permission_requests.length === 0) {
    await getCollectionDocs('permission_requests');
  }

  let request = (db.permission_requests || []).find(r => r.id === id || r.request_id === id);
  if (!request) {
    await getCollectionDocs('permission_requests');
    request = (db.permission_requests || []).find(r => r.id === id || r.request_id === id);
  }
  if (!request) return res.status(404).json({ error: "Request not found" });

  request.status = "Approved";
  request.reviewed_by = reviewer_name || "Manager";
  request.reviewed_at = new Date().toISOString().replace('T', ' ').substring(0, 16);

  const colMap: Record<string, string> = {
    'Customers': 'customers',
    'Customer': 'customers',
    'Reservations': 'reservations',
    'Reservation': 'reservations',
    'Vouchers': 'vouchers',
    'Voucher': 'vouchers',
    'Customer Vouchers': 'vouchers',
    'Customer Voucher': 'vouchers',
    'Invoices': 'invoices',
    'Invoice': 'invoices',
    'Suppliers': 'suppliers',
    'Supplier': 'suppliers',
    'Employees': 'employees',
    'Employee': 'employees',
    'Tour Packages': 'tour_packages',
    'Tour Package': 'tour_packages',
    'Packages': 'tour_packages',
    'Package': 'tour_packages',
    'Hotels': 'hotels',
    'Hotel': 'hotels',
    'Flights': 'flights',
    'Flight': 'flights',
    'Visas': 'visas',
    'Visa': 'visas',
    'Transfers': 'transfers',
    'Transfer': 'transfers',
    'Cruises': 'cruises',
    'Cruise': 'cruises',
    'Tours': 'tours',
    'Tour': 'tours',
    'Day Trips': 'day_trips',
    'Day Trip': 'day_trips',
    'Services': 'visas',
    'Tourism Services': 'visas',
    'Tasks': 'tasks',
    'Task': 'tasks',
    'Documents': 'documents',
    'Document': 'documents',
    'Expenses': 'expenses',
    'Expense': 'expenses',
    'Customer Payments': 'customer_payments',
    'Customer Payment': 'customer_payments',
    'Supplier Payments': 'supplier_payments',
    'Supplier Payment': 'supplier_payments',
    'Customer Inquiries': 'customer_inquiries',
    'Customer Inquiry': 'customer_inquiries',
    'Inquiries': 'customer_inquiries',
    'Inquiry': 'customer_inquiries'
  };

  const initialTargetCol = colMap[request.module] || (request.module ? request.module.toLowerCase().replace(/\s+/g, '_') : '');
  const allPossibleCols = [
    'customers', 'reservations', 'vouchers', 'invoices', 'suppliers', 
    'employees', 'tour_packages', 'hotels', 'flights', 'visas', 
    'transfers', 'cruises', 'tours', 'day_trips', 'tasks', 
    'documents', 'expenses', 'customer_payments', 'supplier_payments', 
    'customer_inquiries'
  ];

  let foundCol = initialTargetCol;
  let collectionItems: any[] = [];
  let targetIdx = -1;

  if (foundCol) {
    collectionItems = await getCollectionDocs(foundCol);
    targetIdx = collectionItems.findIndex((i: any) => 
      i.id === request.item_id || 
      String(i.id) === String(request.item_id) || 
      i.customer_id === request.item_id || 
      i.invoice_number === request.item_id || 
      i.voucher_number === request.item_id ||
      i.reservation_id === request.item_id
    );
  }

  // If not found in primary mapped collection, search across all possible collections
  if (targetIdx === -1) {
    for (const col of allPossibleCols) {
      if (col === initialTargetCol) continue;
      const items = await getCollectionDocs(col);
      const idx = items.findIndex((i: any) => 
        i.id === request.item_id || 
        String(i.id) === String(request.item_id) || 
        i.customer_id === request.item_id || 
        i.invoice_number === request.item_id || 
        i.voucher_number === request.item_id ||
        i.reservation_id === request.item_id
      );
      if (idx !== -1) {
        foundCol = col;
        collectionItems = items;
        targetIdx = idx;
        break;
      }
    }
  }

  if (foundCol && targetIdx !== -1) {
    const existingDoc = collectionItems[targetIdx];
    const docId = existingDoc.id;

    if (request.action_type === 'Delete') {
      db[foundCol] = collectionItems.filter((i: any) => i.id !== docId);
      await deleteFromFirestore(foundCol, docId);

      if (foundCol === 'vouchers' || foundCol === 'reservations') {
        const altCol = foundCol === 'vouchers' ? 'reservations' : 'vouchers';
        const altItems = await getCollectionDocs(altCol);
        db[altCol] = altItems.filter((r: any) => r.id !== docId && r.voucher_number !== existingDoc.voucher_number);
        await deleteFromFirestore(altCol, docId);
      }
    } else if (request.action_type === 'Edit' && request.proposed_changes) {
      const updatedDoc = { ...existingDoc, ...request.proposed_changes, id: docId };
      if (!db[foundCol]) db[foundCol] = [];
      const memIdx = db[foundCol].findIndex((i: any) => i.id === docId);
      if (memIdx !== -1) {
        db[foundCol][memIdx] = updatedDoc;
      } else {
        db[foundCol].push(updatedDoc);
      }
      await saveToFirestore(foundCol, docId, updatedDoc);

      if (foundCol === 'vouchers' || foundCol === 'reservations') {
        const altCol = foundCol === 'vouchers' ? 'reservations' : 'vouchers';
        const altItems = await getCollectionDocs(altCol);
        const rIdx = altItems.findIndex((r: any) => r.id === docId || String(r.id) === String(docId) || r.voucher_number === existingDoc.voucher_number);
        if (rIdx !== -1) {
          const updatedAlt = { ...altItems[rIdx], ...request.proposed_changes, id: docId };
          if (!db[altCol]) db[altCol] = [];
          db[altCol][rIdx] = updatedAlt;
          await saveToFirestore(altCol, docId, updatedAlt);
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

  if (!db.permission_requests || db.permission_requests.length === 0) {
    await getCollectionDocs('permission_requests');
  }

  let request = (db.permission_requests || []).find(r => r.id === id || r.request_id === id);
  if (!request) {
    await getCollectionDocs('permission_requests');
    request = (db.permission_requests || []).find(r => r.id === id || r.request_id === id);
  }
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
    const reservedSettingIds = new Set(['system_status', 'web_push_vapid', 'schedule_reminder_state']);
    if (!setSnap.empty) {
      const targetDoc =
        setSnap.docs.find(d => d.id === 'company_settings') ||
        setSnap.docs.find(d => d.id === 'main') ||
        setSnap.docs.find(d => !reservedSettingIds.has(d.id));
      if (targetDoc) {
        db.settings = { ...db.settings, ...targetDoc.data(), logo: "/sofia-logo.png" };
      }
    }
  } catch (err) {
    console.error("Error reading settings from Firestore:", err);
  }
  res.json(db.settings);
});

app.put("/api/settings", async (req, res) => {
  const actingUser = String((req.headers['x-acting-user'] as string) || req.body?._actingUser || '').trim();
  const prevDisabled = (db.settings as any).site_disabled;
  const prevMsg = (db.settings as any).site_disabled_message;
  const prevAt = (db.settings as any).site_disabled_at;
  const prevBy = (db.settings as any).site_disabled_by;

  db.settings = { ...db.settings, ...req.body };
  if (actingUser !== 'IT') {
    (db.settings as any).site_disabled = prevDisabled;
    (db.settings as any).site_disabled_message = prevMsg;
    (db.settings as any).site_disabled_at = prevAt;
    (db.settings as any).site_disabled_by = prevBy;
  }
  await logActivity(actingUser || "Administrator", "Updated company settings", "Settings", "Settings");
  await saveToFirestore('settings', 'company_settings', db.settings);
  res.json(db.settings);
});

// IT Developer Account Exclusive: Temporarily Disable / Re-enable Site Without Deleting Data
app.post("/api/it/toggle-site-status", async (req, res) => {
  const actingUser = String((req.headers['x-acting-user'] as string) || req.body?._actingUser || req.body?.site_disabled_by || '').trim();
  if (actingUser !== 'IT') {
    return res.status(403).json({ error: 'Forbidden: Only the "IT" developer account can temporarily disable or re-enable the site.' });
  }
  const disable = Boolean(req.body?.site_disabled);
  const message = typeof req.body?.site_disabled_message === 'string' ? req.body.site_disabled_message : '';
  const disabledAt = disable ? (req.body?.site_disabled_at || new Date().toLocaleString()) : '';

  db.settings = {
    ...db.settings,
    site_disabled: disable,
    site_disabled_message: message,
    site_disabled_at: disabledAt,
    site_disabled_by: 'IT'
  } as any;

  await saveToFirestore('settings', 'company_settings', db.settings);
  await logActivity(
    'IT',
    disable ? 'Temporarily disabled site for updates (all data preserved)' : 'Re-enabled site for all users',
    'System Maintenance',
    'company_settings'
  );
  res.json(db.settings);
});

// Helper: Unified working hours calculation (identical for employee self clock-in/out & IT manual entry)
function parseServerTimeToSeconds(timeStr?: string | null): number | null {
  if (!timeStr) return null;
  const raw = String(timeStr).trim();
  if (!raw) return null;
  if (raw.includes('T')) {
    const dt = new Date(raw);
    if (!isNaN(dt.getTime())) {
      return dt.getHours() * 3600 + dt.getMinutes() * 60 + dt.getSeconds();
    }
  }
  const amPmMatch = raw.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM|am|pm|ص|م)$/);
  if (amPmMatch) {
    let hours = parseInt(amPmMatch[1], 10);
    const mins = parseInt(amPmMatch[2], 10);
    const secs = amPmMatch[3] ? parseInt(amPmMatch[3], 10) : 0;
    const period = amPmMatch[4].toUpperCase();
    const isPM = period === 'PM' || period === 'م';
    const isAM = period === 'AM' || period === 'ص';
    if (isPM && hours < 12) hours += 12;
    if (isAM && hours === 12) hours = 0;
    if (hours >= 0 && hours < 24 && mins >= 0 && mins < 60 && secs >= 0 && secs < 60) {
      return hours * 3600 + mins * 60 + secs;
    }
  }
  const match24 = raw.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (match24) {
    const hours = parseInt(match24[1], 10);
    const mins = parseInt(match24[2], 10);
    const secs = match24[3] ? parseInt(match24[3], 10) : 0;
    if (hours >= 0 && hours < 24 && mins >= 0 && mins < 60 && secs >= 0 && secs < 60) {
      return hours * 3600 + mins * 60 + secs;
    }
  }
  return null;
}

function calculateServerWorkingHours(clockIn?: string | null, clockOut?: string | null) {
  const inSec = parseServerTimeToSeconds(clockIn);
  const outSec = parseServerTimeToSeconds(clockOut);
  if (inSec === null || outSec === null) {
    return {
      working_hours: 0,
      working_hours_formatted: '0h 00m',
      status: 'Clocked In' as const
    };
  }
  let diffSeconds = outSec - inSec;
  if (diffSeconds < 0) diffSeconds += 24 * 3600;
  const totalMinutes = Math.round(diffSeconds / 60);
  const hoursInt = Math.floor(totalMinutes / 60);
  const minsRemainder = totalMinutes % 60;
  const decimalHours = Math.round((diffSeconds / 3600) * 100) / 100;
  return {
    working_hours: decimalHours,
    working_hours_formatted: `${hoursInt}h ${String(minsRemainder).padStart(2, '0')}m`,
    status: 'Completed' as const
  };
}

function normalizeServerAttendanceRecord(raw: any, employeesList: any[] = []) {
  const rawIn = raw.clock_in || raw.check_in_time || '';
  const rawOutCandidate = raw.clock_out || raw.check_out_time || '';
  const rawOut = rawOutCandidate === '--' || rawOutCandidate === '-' ? '' : rawOutCandidate;
  const calc = calculateServerWorkingHours(rawIn, rawOut || null);

  const empId = String(raw.employee_id || '').trim();
  const empNameRaw = String(raw.employee_name || '').trim();
  const matchedEmp = employeesList.find(
    (e: any) =>
      (empId && (e.id === empId || e.employee_id === empId)) ||
      (empNameRaw && (e.id === empNameRaw || e.employee_id === empNameRaw || e.name === empNameRaw || e.username === empNameRaw))
  );
  const resolvedName = matchedEmp
    ? (matchedEmp.name || matchedEmp.full_name || matchedEmp.username || empNameRaw)
    : (empNameRaw || empId || 'Employee');

  const shiftCompleted = Boolean(rawIn && rawOut);
  return {
    ...raw,
    id: raw.id || raw.attendance_id,
    attendance_id: raw.attendance_id || raw.id,
    employee_id: empId || matchedEmp?.id || '',
    employee_name: resolvedName,
    date: raw.date || '',
    clock_in: rawIn,
    clock_out: rawOut,
    check_in_time: rawIn,
    check_out_time: rawOut,
    working_hours: shiftCompleted ? calc.working_hours : 0,
    working_hours_formatted: shiftCompleted ? calc.working_hours_formatted : '0h 00m',
    total_working_hours: shiftCompleted ? calc.working_hours_formatted : '--',
    late_minutes: Number(raw.late_minutes) || 0,
    early_departure_minutes: Number(raw.early_departure_minutes) || 0,
    attendance_status: raw.attendance_status || (raw.status === 'Late' || Number(raw.late_minutes) > 0 ? 'Late' : 'Present'),
    status: shiftCompleted ? 'Completed' : 'Clocked In',
  };
}

async function loadMergedAttendanceFromFirestore() {
  const [primaryAtt, legacyAtt, emps] = await Promise.all([
    getCollectionDocs('attendance'),
    getCollectionDocs('employee_attendance'),
    getCollectionDocs('employees'),
  ]);
  const map = new Map<string, any>();
  legacyAtt.forEach((docItem: any) => {
    map.set(docItem.id, normalizeServerAttendanceRecord(docItem, emps));
  });
  primaryAtt.forEach((docItem: any) => {
    const prev = map.get(docItem.id) || {};
    map.set(docItem.id, normalizeServerAttendanceRecord({ ...prev, ...docItem }, emps));
  });
  const merged = Array.from(map.values()).sort((a, b) =>
    `${b.date || ''} ${b.clock_in || ''}`.localeCompare(`${a.date || ''} ${a.clock_in || ''}`)
  );
  db.attendance = merged;
  return merged;
}

// Employee Attendance, Departure & Working Hours API (Connected to Firestore 'attendance')
app.get("/api/attendance", async (req, res) => {
  const records = await loadMergedAttendanceFromFirestore();
  res.json(records);
});

app.get("/api/work-schedules", async (req, res) => {
  const schedules = await getCollectionDocs('work_schedules');
  res.json(schedules);
});

app.post("/api/work-schedules", async (req, res) => {
  const actingUser = String((req.headers['x-acting-user'] as string) || req.body?._actingUser || '').trim();
  const actingRole = String((req.headers['x-acting-role'] as string) || req.body?._actingRole || '').trim();
  const isAllowed = actingUser === 'IT' || actingRole === 'Administrator' || req.body?.is_admin === true;
  if (!isAllowed) {
    return res.status(403).json({ error: 'Forbidden: Only Developer (IT) and Administrator can adjust work schedules.' });
  }

  const schId = req.body.id || `SCHED-${req.body.employee_id || Date.now()}`;
  const schedule = {
    id: schId,
    employee_id: req.body.employee_id || '',
    employee_name: req.body.employee_name || 'Employee',
    start_time: req.body.start_time || '09:00',
    end_time: req.body.end_time || '17:00',
    grace_period_minutes: Number(req.body.grace_period_minutes !== undefined ? req.body.grace_period_minutes : 15),
    working_days: Array.isArray(req.body.working_days) ? req.body.working_days : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'],
    updatedAt: new Date().toISOString()
  };

  if (!db.work_schedules) db.work_schedules = [];
  const idx = db.work_schedules.findIndex((s: any) => s.id === schId || (req.body.employee_id && s.employee_id === req.body.employee_id));
  if (idx >= 0) db.work_schedules[idx] = { ...db.work_schedules[idx], ...schedule };
  else db.work_schedules.push(schedule);

  await saveToFirestore('work_schedules', schId, schedule);
  await logActivity(actingUser || 'Administrator', `Adjusted work schedule for ${schedule.employee_name} (Grace: ${schedule.grace_period_minutes}m)`, 'Work Schedules', schId);
  res.json(schedule);
});

app.put("/api/work-schedules/:id", async (req, res) => {
  const { id } = req.params;
  const actingUser = String((req.headers['x-acting-user'] as string) || req.body?._actingUser || '').trim();
  const actingRole = String((req.headers['x-acting-role'] as string) || req.body?._actingRole || '').trim();
  const isAllowed = actingUser === 'IT' || actingRole === 'Administrator' || req.body?.is_admin === true;
  if (!isAllowed) {
    return res.status(403).json({ error: 'Forbidden: Only Developer (IT) and Administrator can adjust work schedules.' });
  }

  const existing = (db.work_schedules || []).find((s: any) => s.id === id);
  const updated = {
    ...(existing || {}),
    ...req.body,
    id,
    grace_period_minutes: Number(req.body.grace_period_minutes !== undefined ? req.body.grace_period_minutes : (existing?.grace_period_minutes ?? 15)),
    updatedAt: new Date().toISOString()
  };

  if (!db.work_schedules) db.work_schedules = [];
  const idx = db.work_schedules.findIndex((s: any) => s.id === id);
  if (idx >= 0) db.work_schedules[idx] = updated;
  else db.work_schedules.push(updated);

  await saveToFirestore('work_schedules', id, updated);
  await logActivity(actingUser || 'Administrator', `Updated work schedule for ${updated.employee_name || id} (Grace: ${updated.grace_period_minutes}m)`, 'Work Schedules', id);
  res.json(updated);
});

app.get("/api/attendance-settings", async (req, res) => {
  const settingsDocs = await getCollectionDocs('attendance_settings');
  const mainDoc = settingsDocs.find((d: any) => d.id === 'main') || settingsDocs[0] || null;
  res.json(mainDoc);
});

app.post("/api/attendance-settings", async (req, res) => {
  const actingUser = String((req.headers['x-acting-user'] as string) || req.body?._actingUser || '').trim();
  const actingRole = String((req.headers['x-acting-role'] as string) || req.body?._actingRole || '').trim();
  const isAllowed = actingUser === 'IT' || actingRole === 'Administrator' || req.body?.is_admin === true;
  if (!isAllowed) {
    return res.status(403).json({ error: 'Forbidden: Only Developer (IT) and Administrator can adjust attendance settings and default grace periods.' });
  }

  const id = 'main';
  const updated = {
    id,
    default_start_time: req.body.default_start_time || '09:00',
    default_end_time: req.body.default_end_time || '17:00',
    default_grace_period_minutes: Number(req.body.default_grace_period_minutes !== undefined ? req.body.default_grace_period_minutes : 15),
    auto_record_on_login: req.body.auto_record_on_login ?? true,
    auto_record_on_logout: req.body.auto_record_on_logout ?? true,
    default_working_days: Array.isArray(req.body.default_working_days) ? req.body.default_working_days : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'],
    updatedAt: new Date().toISOString()
  };

  if (!db.attendance_settings) db.attendance_settings = [];
  const idx = db.attendance_settings.findIndex((s: any) => s.id === id);
  if (idx >= 0) db.attendance_settings[idx] = updated;
  else db.attendance_settings.push(updated);

  await saveToFirestore('attendance_settings', id, updated);
  await logActivity(actingUser || 'Administrator', `Updated company default grace period (${updated.default_grace_period_minutes}m) & attendance policy`, 'Attendance Settings', id);
  res.json(updated);
});

// Retrieve Attendance & Log-In Data for the Previous Two Days from Cloud Firestore
app.get("/api/attendance/previous-two-days", async (req, res) => {
  const now = new Date();
  const fmtLocal = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const base = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
  const d1 = new Date(base);
  d1.setDate(base.getDate() - 1);
  const d2 = new Date(base);
  d2.setDate(base.getDate() - 2);
  const twoDaysAgo = fmtLocal(d2);
  const yesterday = fmtLocal(d1);
  const today = fmtLocal(base);
  const targetDates = new Set([twoDaysAgo, yesterday]);

  const [allAttendance, actLogs, finLogs] = await Promise.all([
    loadMergedAttendanceFromFirestore(),
    getCollectionDocs('activity_logs'),
    getCollectionDocs('finance_audit_logs'),
  ]);

  const attendancePreviousTwoDays = allAttendance.filter((r: any) => targetDates.has(r.date));

  const loginMap = new Map<string, any>();
  actLogs.forEach((act: any) => {
    const mod = String(act.module || '').toLowerCase();
    const action = String(act.action || '').toLowerCase();
    if (
      (mod.includes('attendance') || action.includes('log in') || action.includes('log out') || action.includes('clocked')) &&
      targetDates.has(act.date)
    ) {
      const key = String(act.id || '').replace(/^ACT-/, '');
      loginMap.set(key, {
        id: key,
        employee_name: act.user_name,
        action: act.action,
        details: act.action,
        date: act.date,
        time: act.time,
        record_id: act.record,
      });
    }
  });

  finLogs.forEach((fin: any) => {
    const recType = String(fin.record_type || '').toLowerCase();
    const val = String(fin.new_value || '').toLowerCase();
    if (!recType.includes('attendance') && !val.includes('logged in') && !val.includes('logged out')) return;
    const key = String(fin.id || '').replace(/^ACT-/, '');
    const existing = loginMap.get(key);
    let dateStr = existing?.date || '';
    if (!dateStr && fin.updatedAt) {
      const dt = new Date(fin.updatedAt);
      if (!isNaN(dt.getTime())) dateStr = fmtLocal(dt);
    }
    if (!targetDates.has(dateStr)) return;
    const timeMatch = String(fin.new_value || '').match(/at\s+(\d{1,2}:\d{2})/i);
    loginMap.set(key, {
      id: key,
      employee_name: fin.user_name || existing?.employee_name,
      user_role: fin.user_role,
      action: existing?.action || fin.action,
      details: fin.new_value || existing?.details || fin.action,
      date: dateStr,
      time: timeMatch ? timeMatch[1] : (existing?.time || ''),
      record_id: fin.record_id || existing?.record_id,
    });
  });

  res.json({
    today,
    dates: [twoDaysAgo, yesterday],
    attendance: attendancePreviousTwoDays,
    login_logs: Array.from(loginMap.values()),
  });
});

app.post("/api/attendance", async (req, res) => {
  const actingUser = String((req.headers['x-acting-user'] as string) || req.body?._actingUser || req.body?.recorded_by || '').trim();
  const isManualRequest = req.body?.entry_source === 'IT Manual';
  if (isManualRequest && actingUser !== 'IT') {
    return res.status(403).json({ error: 'Forbidden: Only the "IT" developer account can manually add employee clock-in/clock-out times.' });
  }

  const attId = req.body.id || ("ATT-" + Date.now() + "-" + (req.body.employee_id || Math.random().toString(36).substring(2, 6).toUpperCase()));
  const rawIn = req.body.clock_in || req.body.check_in_time || '';
  const rawOut = req.body.clock_out || req.body.check_out_time || '';
  const calc = calculateServerWorkingHours(rawIn, rawOut || null);
  const nowIso = new Date().toISOString();
  const shiftCompleted = Boolean(rawIn && rawOut);

  const record = {
    ...req.body,
    id: attId,
    attendance_id: req.body.attendance_id || attId,
    date: req.body.date || nowIso.split('T')[0],
    clock_in: rawIn,
    clock_out: rawOut,
    check_in_time: rawIn,
    check_out_time: rawOut,
    working_hours: shiftCompleted ? calc.working_hours : 0,
    working_hours_formatted: shiftCompleted ? calc.working_hours_formatted : '0h 00m',
    total_working_hours: shiftCompleted ? calc.working_hours_formatted : '--',
    status: calc.status,
    entry_source: isManualRequest ? 'IT Manual' : (req.body.entry_source || 'Employee'),
    recorded_by: actingUser || req.body.employee_name || 'Employee',
    created_at: req.body.created_at || req.body.createdAt || nowIso,
    updated_at: nowIso,
    createdAt: req.body.createdAt || nowIso,
    updatedAt: nowIso
  };

  if (!db.attendance) db.attendance = [];
  const idx = db.attendance.findIndex((a: any) => a.id === attId);
  if (idx >= 0) db.attendance[idx] = record;
  else db.attendance.unshift(record);

  await saveToFirestore('attendance', attId, record);
  await logActivity(
    record.recorded_by,
    isManualRequest
      ? `Manual attendance recorded for ${record.employee_name} (${record.working_hours_formatted})`
      : `${record.status === 'Completed' ? 'Self Log Out' : 'Self Log In'}`,
    'Attendance',
    record.employee_id || record.id
  );
  res.json(record);
});

app.put("/api/attendance/:id", async (req, res) => {
  const { id } = req.params;
  const actingUser = String((req.headers['x-acting-user'] as string) || req.body?._actingUser || req.body?.recorded_by || '').trim();
  const isManualRequest = req.body?.entry_source === 'IT Manual';
  if (isManualRequest && actingUser !== 'IT') {
    return res.status(403).json({ error: 'Forbidden: Only the "IT" developer account can manually modify employee clock-in/clock-out times.' });
  }

  await loadMergedAttendanceFromFirestore();
  const idx = (db.attendance || []).findIndex((a: any) => a.id === id);
  const existing = idx !== -1 ? db.attendance[idx] : { id };
  const mergedClockIn =
    req.body.clock_in !== undefined
      ? req.body.clock_in
      : (req.body.check_in_time !== undefined ? req.body.check_in_time : (existing.clock_in || existing.check_in_time || ''));
  const mergedClockOut =
    req.body.clock_out !== undefined
      ? req.body.clock_out
      : (req.body.check_out_time !== undefined ? req.body.check_out_time : (existing.clock_out || existing.check_out_time || ''));
  const calc = calculateServerWorkingHours(mergedClockIn, mergedClockOut || null);
  const shiftCompleted = Boolean(mergedClockIn && mergedClockOut);
  const nowIso = new Date().toISOString();

  const updated = {
    ...existing,
    ...req.body,
    id,
    clock_in: mergedClockIn || '',
    clock_out: mergedClockOut || '',
    check_in_time: mergedClockIn || '',
    check_out_time: mergedClockOut || '',
    working_hours: shiftCompleted ? calc.working_hours : 0,
    working_hours_formatted: shiftCompleted ? calc.working_hours_formatted : '0h 00m',
    total_working_hours: shiftCompleted ? calc.working_hours_formatted : '--',
    status: shiftCompleted ? 'Completed' : 'Clocked In',
    updated_at: nowIso,
    updatedAt: nowIso
  };

  if (idx !== -1) db.attendance[idx] = updated;
  else db.attendance.unshift(updated);
  db.employee_attendance = (db.employee_attendance || []).filter((a: any) => a.id !== id);

  await saveToFirestore('attendance', id, updated);
  await deleteFromFirestore('employee_attendance', id);
  await logActivity(
    actingUser || updated.employee_name || 'Employee',
    isManualRequest ? 'Attendance Edited' : (shiftCompleted ? 'Self Log Out' : 'Self Log In'),
    'Attendance',
    updated.employee_id || id
  );
  res.json(updated);
});

app.post("/api/attendance/:id/reset", async (req, res) => {
  const actingUser = String((req.headers['x-acting-user'] as string) || req.body?._actingUser || '').trim();
  if (actingUser !== 'IT') {
    return res.status(403).json({ error: 'Forbidden: Only the "IT" developer account can reset employee clock-in/clock-out times.' });
  }
  const { id } = req.params;
  const target: 'clock_in' | 'clock_out' | 'both' =
    req.body?.target === 'clock_in' || req.body?.target === 'clock_out' ? req.body.target : 'both';

  await loadMergedAttendanceFromFirestore();
  const idx = (db.attendance || []).findIndex((a: any) => a.id === id);
  const existing = idx !== -1 ? db.attendance[idx] : null;
  if (!existing) {
    return res.json({ deleted: true, id });
  }

  const currentIn = String(existing.clock_in || existing.check_in_time || '').trim();
  const rawOut = String(existing.clock_out || existing.check_out_time || '').trim();
  const currentOut = rawOut === '--' || rawOut === '-' ? '' : rawOut;

  const nextIn = target === 'clock_in' || target === 'both' ? '' : currentIn;
  const nextOut = target === 'clock_out' || target === 'both' ? '' : currentOut;
  const empName = existing.employee_name || 'Employee';

  if (!nextIn && !nextOut) {
    db.attendance = (db.attendance || []).filter((a: any) => a.id !== id);
    db.employee_attendance = (db.employee_attendance || []).filter((a: any) => a.id !== id);
    await deleteFromFirestore('attendance', id);
    await deleteFromFirestore('employee_attendance', id);
    await logActivity(
      'IT',
      `Reset attendance record for ${empName} (${existing.date || ''}) — employee can clock in/out normally`,
      'Attendance',
      existing.employee_id || id
    );
    return res.json({ deleted: true, id });
  }

  const nowIso = new Date().toISOString();
  const updated = {
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

  if (idx !== -1) db.attendance[idx] = updated;
  else db.attendance.unshift(updated);
  db.employee_attendance = (db.employee_attendance || []).filter((a: any) => a.id !== id);

  await saveToFirestore('attendance', id, updated);
  await deleteFromFirestore('employee_attendance', id);
  await logActivity(
    'IT',
    `Reset ${target === 'clock_in' ? 'clock-in' : 'clock-out'} time for ${empName} (${existing.date || ''}) — employee can clock ${target === 'clock_in' ? 'in' : 'out'} normally`,
    'Attendance',
    existing.employee_id || id
  );
  return res.json({ deleted: false, record: updated });
});

app.delete("/api/attendance/:id", async (req, res) => {
  const actingUser = String((req.headers['x-acting-user'] as string) || '').trim();
  if (actingUser && actingUser !== 'IT') {
    return res.status(403).json({ error: 'Forbidden: Only the "IT" developer account can delete attendance records.' });
  }
  const { id } = req.params;
  db.attendance = (db.attendance || []).filter((a: any) => a.id !== id);
  db.employee_attendance = (db.employee_attendance || []).filter((a: any) => a.id !== id);
  await deleteFromFirestore('attendance', id);
  await deleteFromFirestore('employee_attendance', id);
  await logActivity(actingUser || 'IT', `Deleted attendance record ${id}`, 'Attendance', id);
  res.json({ success: true });
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

app.post("/api/customers/:id/log-communication", async (req, res) => {
  const { id } = req.params;
  const { employee_name, channel, notes, outcome, date } = req.body;
  const actingUser = employee_name || (req.headers['x-acting-user'] as string) || "Staff";
  const now = date || new Date().toISOString();

  let idx = db.customers.findIndex((c: any) => c.id === id);
  if (idx === -1) {
    await getCollectionDocs('customers');
    idx = db.customers.findIndex((c: any) => c.id === id);
  }

  if (idx !== -1) {
    const cust = db.customers[idx];
    const commEntry = {
      id: "COMM-" + Math.random().toString(36).substring(2, 7).toUpperCase(),
      date: now,
      employee_name: actingUser,
      channel: channel || "Phone Call",
      notes: notes || "Direct communication with client",
      outcome: outcome || "Information logged"
    };

    cust.last_communicated_by = actingUser;
    cust.last_communicated_date = now;
    cust.last_communication_notes = notes;
    cust.communications_history = [commEntry, ...(cust.communications_history || [])];

    await saveToFirestore('customers', id, cust);
    await logActivity(actingUser, `Communicated with client ${cust.full_name} via ${channel || 'phone'}`, "Customers", cust.customer_id);
    return res.json(cust);
  }

  res.status(404).json({ error: "Customer not found" });
});

app.delete("/api/customers/:id", async (req, res) => {
  const { id } = req.params;
  db.customers = db.customers.filter(c => c.id !== id);
  await logActivity("Administrator", "Deleted customer", "Customers", id);
  await deleteFromFirestore('customers', id);
  res.json({ success: true });
});

// Customer Inquiries (Potential customers inquiring via Instagram, WhatsApp, etc. before booking)
app.get("/api/customer-inquiries", async (req, res) => {
  const inquiries = await getCollectionDocs('customer_inquiries');
  res.json(inquiries);
});

app.post("/api/customer-inquiries", async (req, res) => {
  const inqId = req.body.id || ("INQ-" + Math.random().toString(36).substring(2, 7).toUpperCase());
  const now = new Date().toISOString();
  const newInquiry = {
    inquiry_code: req.body.inquiry_code || ("INQ-2026-" + Math.floor(1000 + Math.random() * 9000)),
    name: req.body.name || "Inquiring Prospect",
    gender: req.body.gender || "Male",
    phone: req.body.phone || "",
    inquiry_source: req.body.inquiry_source || "WhatsApp",
    inquired_service: req.body.inquired_service || "General Inquiry",
    assigned_representative: req.body.assigned_representative || "Sales Team",
    status: req.body.status || "New Inquiry",
    priority: req.body.priority || "Medium",
    created_at: req.body.created_at || now,
    last_updated: now,
    follow_up_history: req.body.follow_up_history || [],
    ...req.body,
    id: inqId
  };

  const idx = (db.customer_inquiries || []).findIndex((i: any) => i.id === newInquiry.id);
  if (!db.customer_inquiries) db.customer_inquiries = [];
  if (idx >= 0) {
    db.customer_inquiries[idx] = newInquiry;
  } else {
    db.customer_inquiries.unshift(newInquiry);
  }

  const actingUser = (req.headers['x-acting-user'] as string) || "Staff";
  await logActivity(actingUser, `Recorded new inquiry from ${newInquiry.name} via ${newInquiry.inquiry_source}`, "Customer Inquiries", newInquiry.inquiry_code);
  await saveToFirestore('customer_inquiries', newInquiry.id, newInquiry);
  res.json(newInquiry);
});

app.put("/api/customer-inquiries/:id", async (req, res) => {
  const { id } = req.params;
  if (!db.customer_inquiries) db.customer_inquiries = [];
  let idx = db.customer_inquiries.findIndex((i: any) => i.id === id);
  if (idx === -1) {
    await getCollectionDocs('customer_inquiries');
    idx = db.customer_inquiries.findIndex((i: any) => i.id === id);
  }

  const current = idx !== -1 ? db.customer_inquiries[idx] : { id };
  const updated = {
    ...current,
    ...req.body,
    id,
    last_updated: new Date().toISOString()
  };

  if (idx !== -1) {
    db.customer_inquiries[idx] = updated;
  } else {
    db.customer_inquiries.push(updated);
  }

  const actingUser = (req.headers['x-acting-user'] as string) || "Staff";
  await logActivity(actingUser, `Updated inquiry for ${updated.name || id}`, "Customer Inquiries", updated.inquiry_code || id);
  await saveToFirestore('customer_inquiries', id, updated);
  res.json(updated);
});

app.delete("/api/customer-inquiries/:id", async (req, res) => {
  const { id } = req.params;
  if (db.customer_inquiries) {
    db.customer_inquiries = db.customer_inquiries.filter((i: any) => i.id !== id);
  }
  const actingUser = (req.headers['x-acting-user'] as string) || "Administrator";
  await logActivity(actingUser, "Deleted customer inquiry record", "Customer Inquiries", id);
  await deleteFromFirestore('customer_inquiries', id);
  res.json({ success: true });
});

// Log a follow-up interaction
app.post("/api/customer-inquiries/:id/follow-up", async (req, res) => {
  const { id } = req.params;
  const { representative_name, channel, outcome, notes, next_followup_date, new_status } = req.body;
  if (!db.customer_inquiries) db.customer_inquiries = [];
  let idx = db.customer_inquiries.findIndex((i: any) => i.id === id);
  if (idx === -1) {
    await getCollectionDocs('customer_inquiries');
    idx = db.customer_inquiries.findIndex((i: any) => i.id === id);
  }
  if (idx === -1) return res.status(404).json({ error: "Inquiry not found" });

  const current = db.customer_inquiries[idx];
  const now = new Date().toISOString();
  const followUpItem = {
    id: "FU-" + Math.random().toString(36).substring(2, 7).toUpperCase(),
    date: now,
    representative_name: representative_name || "Representative",
    channel: channel || "WhatsApp",
    outcome: outcome || "Contacted",
    notes: notes || ""
  };

  const updatedHistory = Array.isArray(current.follow_up_history) ? [...current.follow_up_history, followUpItem] : [followUpItem];
  const updated = {
    ...current,
    follow_up_history: updatedHistory,
    status: new_status || current.status,
    next_followup_date: next_followup_date !== undefined ? next_followup_date : current.next_followup_date,
    last_updated: now
  };

  db.customer_inquiries[idx] = updated;
  await logActivity(representative_name || "Staff", `Logged follow-up with inquiring prospect ${updated.name}`, "Customer Inquiries", updated.inquiry_code);
  await saveToFirestore('customer_inquiries', id, updated);
  res.json(updated);
});

// Convert an inquiry into a booked/registered client in the Customers directory
app.post("/api/customer-inquiries/:id/convert", async (req, res) => {
  const { id } = req.params;
  if (!db.customer_inquiries) db.customer_inquiries = [];
  let idx = db.customer_inquiries.findIndex((i: any) => i.id === id);
  if (idx === -1) {
    await getCollectionDocs('customer_inquiries');
    idx = db.customer_inquiries.findIndex((i: any) => i.id === id);
  }
  if (idx === -1) return res.status(404).json({ error: "Inquiry not found" });

  const inquiry = db.customer_inquiries[idx];
  const newCustomerId = "CUST-" + Math.random().toString(36).substring(2, 7).toUpperCase();
  const customerNumber = "C-" + Math.floor(1000 + Math.random() * 9000);
  const now = new Date().toISOString();

  const newCustomer = {
    id: newCustomerId,
    customer_id: customerNumber,
    full_name: inquiry.name,
    name: inquiry.name,
    gender: inquiry.gender || "Male",
    phone: inquiry.phone || "",
    whatsapp_number: inquiry.phone || "",
    email: inquiry.email || "",
    passport_number: req.body.passport_number || "",
    nationality: req.body.nationality || "Egyptian",
    date_of_birth: req.body.date_of_birth || "",
    address: req.body.address || "",
    notes: `Converted from inquiry ${inquiry.inquiry_code} (Source: ${inquiry.inquiry_source}, Inquired for: ${inquiry.inquired_service}). ${inquiry.notes || ''}`,
    customer_type: "Individual",
    registration_date: now.split('T')[0],
    outstanding_balance: 0,
    currency: "USD"
  };

  if (!db.customers) db.customers = [];
  db.customers.unshift(newCustomer);
  await saveToFirestore('customers', newCustomer.id, newCustomer);

  // Update inquiry status
  const updatedInquiry = {
    ...inquiry,
    status: "Converted to Customer",
    converted_to_customer_id: newCustomer.id,
    converted_at: now,
    last_updated: now
  };
  db.customer_inquiries[idx] = updatedInquiry;
  await saveToFirestore('customer_inquiries', id, updatedInquiry);

  const actingUser = (req.headers['x-acting-user'] as string) || "Staff";
  await logActivity(actingUser, `Converted inquiry ${inquiry.inquiry_code} (${inquiry.name}) to acquired Customer ${customerNumber}`, "Customer Inquiries", customerNumber);

  res.json({
    success: true,
    customer: newCustomer,
    inquiry: updatedInquiry
  });
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

app.delete("/api/payroll-records/:id", async (req, res) => {
  const { id } = req.params;
  db.payroll_records = db.payroll_records.filter(p => p.id !== id);
  await deleteFromFirestore('payroll_records', id);
  res.json({ success: true });
});

// Employee Advances
app.get("/api/employee-advances", async (req, res) => {
  const advances = await getCollectionDocs('employee_advances');
  res.json(advances);
});

app.post("/api/employee-advances", async (req, res) => {
  const advId = req.body.id || ("ADV-" + Math.random().toString(36).substring(2, 7).toUpperCase());
  const adv = {
    ...req.body,
    id: advId
  };
  const idx = db.employee_advances.findIndex(a => a.id === adv.id);
  if (idx >= 0) {
    db.employee_advances[idx] = adv;
  } else {
    db.employee_advances.push(adv);
  }
  await saveToFirestore('employee_advances', adv.id, adv);
  res.json(adv);
});

app.put("/api/employee-advances/:id", async (req, res) => {
  const { id } = req.params;
  const idx = db.employee_advances.findIndex(a => a.id === id);
  if (idx >= 0) {
    db.employee_advances[idx] = { ...db.employee_advances[idx], ...req.body, id };
    await saveToFirestore('employee_advances', id, db.employee_advances[idx]);
    return res.json(db.employee_advances[idx]);
  }
  const newAdv = { ...req.body, id };
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
  const commId = req.body.id || ("COMM-" + Math.random().toString(36).substring(2, 7).toUpperCase());
  const comm = {
    ...req.body,
    id: commId
  };
  const idx = db.commission_records.findIndex(c => c.id === comm.id);
  if (idx >= 0) {
    db.commission_records[idx] = comm;
  } else {
    db.commission_records.push(comm);
  }
  await saveToFirestore('commission_records', comm.id, comm);
  res.json(comm);
});

app.put("/api/commission-records/:id", async (req, res) => {
  const { id } = req.params;
  const idx = db.commission_records.findIndex(c => c.id === id);
  if (idx >= 0) {
    db.commission_records[idx] = { ...db.commission_records[idx], ...req.body, id };
    await saveToFirestore('commission_records', id, db.commission_records[idx]);
    return res.json(db.commission_records[idx]);
  }
  const newComm = { ...req.body, id };
  db.commission_records.push(newComm);
  await saveToFirestore('commission_records', id, newComm);
  res.json(newComm);
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
  const logId = req.body.id || ("LOG-F-" + Math.random().toString(36).substring(2, 7).toUpperCase());
  const log = {
    ...req.body,
    id: logId
  };
  const idx = db.finance_audit_logs.findIndex(l => l.id === log.id);
  if (idx >= 0) {
    db.finance_audit_logs[idx] = log;
  } else {
    db.finance_audit_logs.push(log);
  }
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
  const data = req.body || {};
  const name = data.name || data.full_name || 'New Employee';
  const position = data.position || data.job_title || data.role || 'Sales Executive';
  const empId = data.id || ("EMP-" + Math.random().toString(36).substring(2, 7).toUpperCase());
  const actingUser = String((req.headers['x-acting-user'] as string) || data.created_by || '').trim();
  const isCreatedByIT = actingUser.toUpperCase() === 'IT';
  const posLower = String(position || '').trim().toLowerCase();
  const deptLower = String(data.department || '').trim().toLowerCase();
  const roleLower = String(data.role || '').trim().toLowerCase();
  const isManagerOrAccountant =
    ['manager', 'accountant', 'مدير', 'محاسب', 'رئيس حسابات', 'مدير عام', 'مدير فرع', 'مدير مالي'].some(
      kw => posLower.includes(kw) || roleLower.includes(kw)
    ) ||
    posLower === 'accounting' ||
    posLower === 'المحاسبة' ||
    posLower === 'الحسابات' ||
    ((deptLower === 'accounting' || deptLower === 'المحاسبة' || deptLower === 'الحسابات') &&
      (!posLower || posLower === 'sales executive' || posLower === 'staff member'));

  const shouldBeAdmin = Boolean(
    data.is_admin === true ||
    posLower === 'administrator' ||
    posLower === 'admin' ||
    String(data.account_type || '').toLowerCase() === 'admin' ||
    (isCreatedByIT && isManagerOrAccountant)
  );

  const emp = {
    employee_id: data.employee_id || ("E-" + Math.floor(200 + Math.random() * 800)),
    joining_date: data.joining_date || new Date().toISOString().split('T')[0],
    ...data,
    id: empId,
    name,
    full_name: data.full_name || name,
    position,
    job_title: data.job_title || position,
    is_admin: shouldBeAdmin,
    account_type: shouldBeAdmin ? 'Admin' : (data.account_type || 'Employee'),
    designation: shouldBeAdmin ? 'Admin' : (data.designation || 'Employee'),
    role: shouldBeAdmin ? 'Admin' : (data.role || position),
    created_by: data.created_by || actingUser || 'Administrator',
    status: data.status || 'Active',
    salary: Number(data.salary) || 0
  };
  const idx = db.employees.findIndex(e => e.id === emp.id || (emp.employee_id && e.employee_id === emp.employee_id));
  if (idx >= 0) {
    db.employees[idx] = emp;
  } else {
    db.employees.push(emp);
  }
  await logActivity(actingUser || "Administrator", `Created/Updated employee account ${emp.name}${shouldBeAdmin ? ' [Admin]' : ''}`, "Employees", emp.employee_id);
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
  
  let maxSeq = 1000;
  (db.invoices || []).forEach((inv: any) => {
    const match = String(inv.invoice_number || '').match(/INV-2026-(\d+)/i);
    if (match) {
      const val = parseInt(match[1], 10);
      if (val > maxSeq) maxSeq = val;
    }
  });
  const nextSeq = maxSeq + 1;
  const invSerial = req.body.invoice_number || `INV-2026-${nextSeq}`;

  const newInvoice = {
    invoice_number: invSerial,
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
      await saveToFirestore('customers', cust.id, cust);
    }
  }

  // If supplier is selected, update supplier balance
  if (newInvoice.recipient_type === 'Supplier' && newInvoice.supplier_id) {
    const sup = db.suppliers.find(s => s.id === newInvoice.supplier_id);
    if (sup) {
      sup.outstanding_balance = (sup.outstanding_balance || 0) + Number(newInvoice.balance_due || 0);
      await saveToFirestore('suppliers', sup.id, sup);
    }
  }

  const actorName = newInvoice.created_by_employee || "Sofia Travel Staff";
  const recipientName = newInvoice.recipient_type === 'Supplier' ? newInvoice.supplier_name : newInvoice.customer_name;
  await logActivity(actorName, `Issued ${newInvoice.recipient_type || 'Customer'} invoice ${newInvoice.invoice_number} to ${recipientName}`, "Invoicing", newInvoice.invoice_number);

  await addNotification(
    `Invoice Issued by ${actorName}`,
    `[${actorName}] Issued ${newInvoice.recipient_type || 'Customer'} invoice #${newInvoice.invoice_number} for ${recipientName} (${newInvoice.total_amount} ${newInvoice.currency}).`,
    "payment",
    newInvoice.id
  );

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

// ============================================================================
// WEB PUSH NOTIFICATIONS, IMMEDIATE PHONE ALERTS, SCHEDULE REMINDERS & ADMIN/IT CUSTOM BROADCASTS
// ============================================================================

let vapidKeysCache: { publicKey: string; privateKey: string } | null = null;
let vapidInitPromise: Promise<{ publicKey: string; privateKey: string }> | null = null;

async function ensureVapidConfigured(): Promise<{ publicKey: string; privateKey: string }> {
  if (vapidKeysCache) return vapidKeysCache;
  if (vapidInitPromise) return vapidInitPromise;

  vapidInitPromise = (async () => {
    try {
      const snap = await getDoc(doc(firestoreDb, 'settings', 'web_push_vapid'));
      if (snap.exists()) {
        const data = snap.data() as any;
        if (data?.publicKey && data?.privateKey) {
          vapidKeysCache = { publicKey: data.publicKey, privateKey: data.privateKey };
          webpush.setVapidDetails('mailto:operations@sofiatravel.com', data.publicKey, data.privateKey);
          return vapidKeysCache;
        }
      }
    } catch (e) {
      console.warn('Could not read existing VAPID config from Firestore, generating fresh keys:', e);
    }

    const generated = webpush.generateVAPIDKeys();
    vapidKeysCache = {
      publicKey: generated.publicKey,
      privateKey: generated.privateKey,
    };
    webpush.setVapidDetails('mailto:operations@sofiatravel.com', generated.publicKey, generated.privateKey);
    try {
      await setDoc(
        doc(firestoreDb, 'settings', 'web_push_vapid'),
        {
          id: 'web_push_vapid',
          publicKey: generated.publicKey,
          privateKey: generated.privateKey,
          createdAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (saveErr) {
      console.warn('Could not persist VAPID keys to Firestore:', saveErr);
    }
    return vapidKeysCache;
  })();

  try {
    return await vapidInitPromise;
  } finally {
    vapidInitPromise = null;
  }
}

function makeSubscriptionDocId(endpoint: string): string {
  return 'SUB-' + crypto.createHash('sha256').update(String(endpoint)).digest('hex').substring(0, 24);
}

function normalizeHHMMServer(raw?: string | null, fallback = '10:00'): string {
  const sec = parseServerTimeToSeconds(raw);
  if (sec === null) return fallback;
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function resolveEmployeeScheduleFromDb(empQuery: {
  id?: string;
  employee_id?: string;
  name?: string;
  username?: string;
}) {
  const schedules: any[] = db.work_schedules || [];
  const attSettingsList: any[] = db.attendance_settings || [];
  const mainAttSetting = attSettingsList.find((d: any) => d.id === 'main') || attSettingsList[0] || null;

  const defaultStart = normalizeHHMMServer(mainAttSetting?.default_start_time, '10:00');
  const defaultEnd = normalizeHHMMServer(mainAttSetting?.default_end_time, '18:00');
  const defaultWorkingDays: string[] = Array.isArray(mainAttSetting?.default_working_days)
    ? mainAttSetting.default_working_days
    : [];

  const qIds = [empQuery.id, empQuery.employee_id]
    .map(v => String(v || '').trim().toLowerCase())
    .filter(Boolean);
  const qNames = [empQuery.name, empQuery.username]
    .map(v => String(v || '').trim().toLowerCase())
    .filter(Boolean);

  const matched = schedules.find((ws: any) => {
    const wsId = String(ws.employee_id || ws.id || '').trim().toLowerCase();
    const wsName = String(ws.employee_name || '').trim().toLowerCase();
    if (wsId && qIds.includes(wsId)) return true;
    if (wsName && (qNames.includes(wsName) || qIds.includes(wsName))) return true;
    return false;
  });

  if (matched) {
    return {
      start_time: normalizeHHMMServer(matched.start_time, defaultStart),
      end_time: normalizeHHMMServer(matched.end_time, defaultEnd),
      grace_period_minutes: Number(matched.grace_period_minutes) || 0,
      working_days: Array.isArray(matched.working_days) ? matched.working_days : defaultWorkingDays,
    };
  }

  return {
    start_time: defaultStart,
    end_time: defaultEnd,
    grace_period_minutes: Number(mainAttSetting?.default_grace_period_minutes) || 0,
    working_days: defaultWorkingDays,
  };
}

function doesSubscriptionMatchEmployee(sub: any, emp: { id?: string; employee_id?: string; name?: string; username?: string }): boolean {
  const subIds = [sub.employee_id, sub.username].map(v => String(v || '').trim().toLowerCase()).filter(Boolean);
  const subNames = [sub.employee_name, sub.username].map(v => String(v || '').trim().toLowerCase()).filter(Boolean);

  const targetIds = [emp.id, emp.employee_id].map(v => String(v || '').trim().toLowerCase()).filter(Boolean);
  const targetNames = [emp.name, emp.username].map(v => String(v || '').trim().toLowerCase()).filter(Boolean);

  if (targetIds.some(t => subIds.includes(t) || subNames.includes(t))) return true;
  if (targetNames.some(t => subNames.includes(t) || subIds.includes(t))) return true;
  return false;
}

async function dispatchWebPushToSubscriptions(
  targetSubs: any[],
  buildPayload: ((sub: any) => Record<string, any>) | Record<string, any>
): Promise<{ sent: number; failed: number; pruned: number }> {
  if (!targetSubs || targetSubs.length === 0) {
    return { sent: 0, failed: 0, pruned: 0 };
  }
  await ensureVapidConfigured();

  let sent = 0;
  let failed = 0;
  let pruned = 0;

  await Promise.all(
    targetSubs.map(async (sub: any) => {
      if (!sub?.subscription?.endpoint || !sub?.subscription?.keys) {
        failed++;
        return;
      }
      const payloadObj = typeof buildPayload === 'function' ? buildPayload(sub) : buildPayload;
      try {
        await webpush.sendNotification(sub.subscription, JSON.stringify(payloadObj), {
          TTL: 60 * 60 * 12,
          urgency: 'high',
        });
        sent++;
      } catch (err: any) {
        const statusCode = Number(err?.statusCode || 0);
        if (statusCode === 404 || statusCode === 410) {
          pruned++;
          db.push_subscriptions = (db.push_subscriptions || []).filter((s: any) => s.id !== sub.id);
          await deleteFromFirestore('push_subscriptions', sub.id);
        } else {
          failed++;
          console.warn(`Web push send error for ${sub.id} (status ${statusCode}):`, err?.message || err);
        }
      }
    })
  );

  return { sent, failed, pruned };
}

function isAuthorizedAdminOrIT(req: express.Request): { authorized: boolean; actorName: string; actorRole: string } {
  const headerUser = String((req.headers['x-acting-user'] as string) || req.body?.sender_name || '').trim();
  const headerRole = String((req.headers['x-acting-role'] as string) || req.body?.sender_role || '').trim();
  const isIT = headerUser === 'IT' || req.body?.is_it === true;
  const isAdminRole = headerRole === 'Administrator';
  const matchedEmp = (db.employees || []).find(
    (e: any) =>
      (headerUser && (e.name === headerUser || e.username === headerUser || e.id === headerUser)) &&
      (e.is_admin === true || e.position === 'Administrator')
  );
  const authorized = Boolean(isIT || isAdminRole || matchedEmp);
  return {
    authorized,
    actorName: headerUser || (isIT ? 'IT' : 'Administrator'),
    actorRole: isIT ? 'IT Developer' : (headerRole || 'Administrator'),
  };
}

// Public VAPID Key endpoint for browser & installed mobile PWA push subscription
app.get("/api/push/vapid-public-key", async (req, res) => {
  try {
    const keys = await ensureVapidConfigured();
    res.json({
      publicKey: keys.publicKey,
      subscriptionsCount: (db.push_subscriptions || []).length,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Failed to initialize Web Push VAPID keys" });
  }
});

// Check push subscription status for the current employee / Admin & IT overview
app.get("/api/push/status", async (req, res) => {
  const subs = await getCollectionDocs('push_subscriptions');
  const employeeId = String(req.query.employee_id || '').trim();
  const employeeName = String(req.query.employee_name || '').trim();

  const matchingDevices = subs.filter((s: any) =>
    doesSubscriptionMatchEmployee(s, { id: employeeId, employee_id: employeeId, name: employeeName, username: employeeName })
  );

  res.json({
    totalSubscribedDevices: subs.length,
    employeeSubscribedDevices: matchingDevices.length,
    subscribedEmployees: Array.from(
      new Set(subs.map((s: any) => s.employee_name || s.username || s.employee_id).filter(Boolean))
    ),
  });
});

// Subscribe employee phone/browser & IMMEDIATELY send push alert directly to the employee's phone
app.post("/api/push/subscribe", async (req, res) => {
  try {
    await ensureVapidConfigured();
    const {
      subscription,
      employee_id,
      employee_name,
      username,
      user_role,
      language = 'en',
      timezone = 'Africa/Cairo',
      is_standalone = false,
      user_agent = '',
      sendImmediateAlert = true,
    } = req.body || {};

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({ error: "Valid Web Push subscription object is required." });
    }

    await Promise.all([
      getCollectionDocs('work_schedules'),
      getCollectionDocs('attendance_settings'),
      getCollectionDocs('push_subscriptions'),
    ]);

    const cleanName = String(employee_name || username || 'Employee').trim();
    const cleanId = String(employee_id || username || cleanName).trim();
    const schedule = resolveEmployeeScheduleFromDb({
      id: cleanId,
      employee_id: cleanId,
      name: cleanName,
      username: String(username || '').trim(),
    });

    const subId = makeSubscriptionDocId(subscription.endpoint);
    const nowIso = new Date().toISOString();
    const existing = (db.push_subscriptions || []).find((s: any) => s.id === subId);

    const record = {
      id: subId,
      endpoint: subscription.endpoint,
      subscription,
      employee_id: cleanId,
      employee_name: cleanName,
      username: String(username || cleanName).trim(),
      user_role: String(user_role || 'Employee').trim(),
      language: language === 'ar' ? 'ar' : 'en',
      timezone: String(timezone || 'Africa/Cairo'),
      is_standalone: Boolean(is_standalone),
      user_agent: String(user_agent || req.headers['user-agent'] || '').substring(0, 300),
      designated_check_in: schedule.start_time,
      designated_check_out: schedule.end_time,
      created_at: existing?.created_at || nowIso,
      updated_at: nowIso,
    };

    if (!db.push_subscriptions) db.push_subscriptions = [];
    const idx = db.push_subscriptions.findIndex((s: any) => s.id === subId);
    if (idx >= 0) db.push_subscriptions[idx] = record;
    else db.push_subscriptions.unshift(record);

    await saveToFirestore('push_subscriptions', subId, record);

    let immediatePushSent = false;
    if (sendImmediateAlert) {
      const isAr = language === 'ar';
      const companyTitle = db.settings?.company_name || 'Sofia Travel';
      const welcomeTitle = isAr
        ? `تم تفعيل إشعارات الهاتف بنجاح — ${companyTitle}`
        : `Phone Alerts Activated — ${companyTitle}`;
      const welcomeBody = isAr
        ? `مرحباً ${cleanName}! ستصلك التنبيهات فوراً على هاتفك. مواعيد دوامك المحددة: الحضور ${schedule.start_time} • الانصراف ${schedule.end_time}.`
        : `Welcome ${cleanName}! Browser alerts are now active on your phone. Your designated times: Check-In ${schedule.start_time} • Check-Out ${schedule.end_time}.`;

      const welcomeNotifId = `NOTIF-WELCOME-${subId}-${Date.now()}`;
      await addNotification(welcomeTitle, welcomeBody, 'attendance_reminder', undefined, {
        id: welcomeNotifId,
        target_scope: 'EMPLOYEE',
        target_employee_id: cleanId,
        target_employee_name: cleanName,
        sender_name: 'System',
        sender_role: 'Automated Push Service',
        category: 'Phone Push Activated',
        designated_check_in: schedule.start_time,
        designated_check_out: schedule.end_time,
      });

      const pushResult = await dispatchWebPushToSubscriptions([record], {
        id: welcomeNotifId,
        tag: welcomeNotifId,
        title: welcomeTitle,
        body: welcomeBody,
        lang: isAr ? 'ar' : 'en',
        dir: isAr ? 'rtl' : 'ltr',
        tab: 'attendance',
        url: '/?tab=attendance',
        timestamp: Date.now(),
      });
      immediatePushSent = pushResult.sent > 0;
    }

    res.json({
      success: true,
      subscriptionId: subId,
      immediatePushSent,
      designatedSchedule: {
        checkIn: schedule.start_time,
        checkOut: schedule.end_time,
      },
    });
  } catch (err: any) {
    console.error("Push subscribe error:", err);
    res.status(500).json({ error: err?.message || "Failed to register push subscription" });
  }
});

// Unsubscribe device endpoint
app.post("/api/push/unsubscribe", async (req, res) => {
  const endpoint = req.body?.endpoint;
  if (!endpoint) return res.status(400).json({ error: "Missing endpoint" });
  const subId = makeSubscriptionDocId(endpoint);
  db.push_subscriptions = (db.push_subscriptions || []).filter((s: any) => s.id !== subId && s.endpoint !== endpoint);
  await deleteFromFirestore('push_subscriptions', subId);
  res.json({ success: true });
});

// Employee self-test push notification (verifies immediate phone delivery & designated check-in/out schedule)
app.post("/api/push/test-self", async (req, res) => {
  try {
    await Promise.all([
      getCollectionDocs('push_subscriptions'),
      getCollectionDocs('work_schedules'),
      getCollectionDocs('attendance_settings'),
    ]);
    const { employee_id, employee_name, username, language = 'en', endpoint } = req.body || {};
    const cleanName = String(employee_name || username || 'Employee').trim();
    const cleanId = String(employee_id || username || cleanName).trim();
    const schedule = resolveEmployeeScheduleFromDb({
      id: cleanId,
      employee_id: cleanId,
      name: cleanName,
      username: String(username || '').trim(),
    });

    let matchingSubs = (db.push_subscriptions || []).filter((s: any) =>
      endpoint
        ? s.endpoint === endpoint
        : doesSubscriptionMatchEmployee(s, { id: cleanId, employee_id: cleanId, name: cleanName, username })
    );

    const isAr = language === 'ar';
    const title = isAr
      ? `تنبيه فوري ومواعيد الدوام — ${cleanName}`
      : `Instant Phone Alert & Shift Schedule — ${cleanName}`;
    const body = isAr
      ? `موعد الحضور المحدد: ${schedule.start_time} | موعد الانصراف المحدد: ${schedule.end_time}. الإشعارات تعمل بنجاح على هاتفك.`
      : `Designated Check-In: ${schedule.start_time} | Designated Check-Out: ${schedule.end_time}. Push notifications are active on your phone.`;

    const tagId = `NOTIF-TEST-${Date.now()}`;
    const result = await dispatchWebPushToSubscriptions(matchingSubs, {
      id: tagId,
      tag: tagId,
      title,
      body,
      lang: isAr ? 'ar' : 'en',
      dir: isAr ? 'rtl' : 'ltr',
      tab: 'attendance',
      url: '/?tab=attendance',
      timestamp: Date.now(),
    });

    res.json({
      success: true,
      sent: result.sent,
      title,
      body,
      designatedSchedule: {
        checkIn: schedule.start_time,
        checkOut: schedule.end_time,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Failed to send test push notification" });
  }
});

// Admin & Developer ("IT") Custom Notification Sender (All Employees or Specific Selected Employees)
app.post("/api/push/send-custom", async (req, res) => {
  try {
    await Promise.all([
      getCollectionDocs('employees'),
      getCollectionDocs('push_subscriptions'),
    ]);

    const authCheck = isAuthorizedAdminOrIT(req);
    if (!authCheck.authorized) {
      return res.status(403).json({
        error: "Forbidden: Only the Administrator or the IT developer account can send custom notifications to employees.",
      });
    }

    const {
      title,
      message,
      target_scope = 'ALL',
      target_employees = [],
      category = 'Announcement',
      tab = 'notifications',
      language = 'en',
    } = req.body || {};

    const cleanTitle = String(title || '').trim();
    const cleanMessage = String(message || '').trim();
    if (!cleanTitle || !cleanMessage) {
      return res.status(400).json({ error: "Both notification title and message are required." });
    }

    const createdNotifications: any[] = [];
    let targetSubs: any[] = [];

    if (target_scope === 'ALL' || !Array.isArray(target_employees) || target_employees.length === 0) {
      const notifId = `NOTIF-CUSTOM-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const savedNotif = await addNotification(cleanTitle, cleanMessage, 'custom', undefined, {
        id: notifId,
        target_scope: 'ALL',
        sender_name: authCheck.actorName,
        sender_role: authCheck.actorRole,
        category,
      });
      createdNotifications.push(savedNotif);
      targetSubs = db.push_subscriptions || [];

      await dispatchWebPushToSubscriptions(targetSubs, (sub: any) => ({
        id: notifId,
        tag: notifId,
        title: cleanTitle,
        body: cleanMessage,
        lang: sub.language || language || 'en',
        dir: (sub.language || language) === 'ar' ? 'rtl' : 'ltr',
        tab,
        url: `/?tab=${encodeURIComponent(tab)}`,
        timestamp: Date.now(),
      }));
    } else {
      // Send targeted custom notifications to selected employees
      const matchedSubIds = new Set<string>();
      for (const empTarget of target_employees) {
        const empId = String(empTarget.id || empTarget.employee_id || empTarget).trim();
        const empObj = (db.employees || []).find(
          (e: any) => e.id === empId || e.employee_id === empId || e.name === empId || e.username === empId
        );
        const empName = String(
          empTarget.name || empObj?.name || empObj?.full_name || empObj?.username || empId
        ).trim();

        const notifId = `NOTIF-CUSTOM-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const savedNotif = await addNotification(cleanTitle, cleanMessage, 'custom', undefined, {
          id: notifId,
          target_scope: 'EMPLOYEE',
          target_employee_id: empObj?.id || empId,
          target_employee_name: empName,
          sender_name: authCheck.actorName,
          sender_role: authCheck.actorRole,
          category,
        });
        createdNotifications.push(savedNotif);

        const subsForEmp = (db.push_subscriptions || []).filter((s: any) =>
          doesSubscriptionMatchEmployee(s, {
            id: empObj?.id || empId,
            employee_id: empObj?.employee_id || empId,
            name: empName,
            username: empObj?.username || empName,
          })
        );
        subsForEmp.forEach((s: any) => {
          if (!matchedSubIds.has(s.id)) {
            matchedSubIds.add(s.id);
            targetSubs.push({ ...s, _notifId: notifId });
          }
        });
      }

      await dispatchWebPushToSubscriptions(targetSubs, (sub: any) => ({
        id: sub._notifId || `NOTIF-CUSTOM-${Date.now()}`,
        tag: sub._notifId || `NOTIF-CUSTOM-${Date.now()}`,
        title: cleanTitle,
        body: cleanMessage,
        lang: sub.language || language || 'en',
        dir: (sub.language || language) === 'ar' ? 'rtl' : 'ltr',
        tab,
        url: `/?tab=${encodeURIComponent(tab)}`,
        timestamp: Date.now(),
      }));
    }

    await logActivity(
      authCheck.actorName,
      `Sent custom notification "${cleanTitle}" (${target_scope === 'ALL' ? 'All Employees' : `${createdNotifications.length} employee(s)`})`,
      'Notifications',
      createdNotifications[0]?.id || 'CUSTOM'
    );

    res.json({
      success: true,
      notificationsCreated: createdNotifications.length,
      devicesNotified: targetSubs.length,
      notifications: createdNotifications,
    });
  } catch (err: any) {
    console.error("Send custom notification error:", err);
    res.status(500).json({ error: err?.message || "Failed to send custom notification" });
  }
});

// Helper: Build unified roster of all active employees + subscribed employee accounts
function buildAllActiveEmployeesRoster(): Array<{
  id: string;
  employee_id: string;
  name: string;
  username: string;
}> {
  const rosterMap = new Map<string, { id: string; employee_id: string; name: string; username: string }>();

  (db.employees || []).forEach((emp: any) => {
    const status = emp.account_status || emp.status || 'Active';
    if (status === 'Inactive' || status === 'Suspended' || emp.login_access_enabled === false) return;
    const id = String(emp.id || emp.employee_id || emp.name || '').trim();
    if (!id) return;
    const name = String(emp.name || emp.full_name || emp.username || id).trim();
    rosterMap.set(id.toLowerCase(), {
      id,
      employee_id: String(emp.employee_id || id).trim(),
      name,
      username: String(emp.username || name).trim(),
    });
  });

  // Also include any employee with an explicit work_schedule or push_subscription
  (db.work_schedules || []).forEach((ws: any) => {
    const id = String(ws.employee_id || ws.id || '').trim();
    const name = String(ws.employee_name || id).trim();
    if (!id) return;
    const exists = Array.from(rosterMap.values()).some(
      r => r.id.toLowerCase() === id.toLowerCase() || r.employee_id.toLowerCase() === id.toLowerCase() || r.name.toLowerCase() === name.toLowerCase()
    );
    if (!exists) {
      rosterMap.set(id.toLowerCase(), { id, employee_id: id, name, username: name });
    }
  });

  (db.push_subscriptions || []).forEach((sub: any) => {
    const id = String(sub.employee_id || sub.username || '').trim();
    const name = String(sub.employee_name || sub.username || id).trim();
    if (!id) return;
    const exists = Array.from(rosterMap.values()).some(
      r => r.id.toLowerCase() === id.toLowerCase() || r.employee_id.toLowerCase() === id.toLowerCase() || r.name.toLowerCase() === name.toLowerCase()
    );
    if (!exists) {
      rosterMap.set(id.toLowerCase(), { id, employee_id: id, name, username: String(sub.username || name).trim() });
    }
  });

  return Array.from(rosterMap.values());
}

// Admin & Developer ("IT") On-Demand Trigger: Remind all employees of each employee's designated check-in & check-out times
app.post("/api/push/send-schedule-reminders", async (req, res) => {
  try {
    await Promise.all([
      getCollectionDocs('employees'),
      getCollectionDocs('work_schedules'),
      getCollectionDocs('attendance_settings'),
      getCollectionDocs('push_subscriptions'),
    ]);

    const authCheck = isAuthorizedAdminOrIT(req);
    if (!authCheck.authorized) {
      return res.status(403).json({
        error: "Forbidden: Only the Administrator or IT developer account can broadcast schedule reminders.",
      });
    }

    const roster = buildAllActiveEmployeesRoster();
    let totalSentDevices = 0;
    const createdNotifs: any[] = [];

    for (const emp of roster) {
      const schedule = resolveEmployeeScheduleFromDb(emp);
      const empSubs = (db.push_subscriptions || []).filter((s: any) => doesSubscriptionMatchEmployee(s, emp));
      const prefersAr = empSubs.some((s: any) => s.language === 'ar') || req.body?.language === 'ar';

      const title = prefersAr
        ? `تذكير بمواعيد الحضور والانصراف — ${emp.name}`
        : `Check-In & Check-Out Time Reminder — ${emp.name}`;
      const body = prefersAr
        ? `مرحباً ${emp.name}، نذكرك بمواعيد دوامك المحددة: وقت الحضور ${schedule.start_time} • وقت الانصراف ${schedule.end_time}. يرجى الالتزام بتسجيل الحضور والانصراف.`
        : `Hello ${emp.name}, reminder of your designated schedule: Check-In Time ${schedule.start_time} • Check-Out Time ${schedule.end_time}. Please remember to clock in and clock out on time.`;

      const notifId = `NOTIF-SCHED-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const saved = await addNotification(title, body, 'attendance_reminder', undefined, {
        id: notifId,
        target_scope: 'EMPLOYEE',
        target_employee_id: emp.id,
        target_employee_name: emp.name,
        sender_name: authCheck.actorName,
        sender_role: authCheck.actorRole,
        category: 'Shift Schedule Reminder',
        designated_check_in: schedule.start_time,
        designated_check_out: schedule.end_time,
      });
      createdNotifs.push(saved);

      if (empSubs.length > 0) {
        const pushRes = await dispatchWebPushToSubscriptions(empSubs, (sub: any) => {
          const subAr = sub.language === 'ar';
          return {
            id: notifId,
            tag: notifId,
            title: subAr
              ? `تذكير بمواعيد الحضور والانصراف — ${emp.name}`
              : `Check-In & Check-Out Time Reminder — ${emp.name}`,
            body: subAr
              ? `مرحباً ${emp.name}، مواعيد دوامك المحددة: وقت الحضور ${schedule.start_time} • وقت الانصراف ${schedule.end_time}.`
              : `Hello ${emp.name}, your designated times: Check-In ${schedule.start_time} • Check-Out ${schedule.end_time}.`,
            lang: subAr ? 'ar' : 'en',
            dir: subAr ? 'rtl' : 'ltr',
            tab: 'attendance',
            url: '/?tab=attendance',
            timestamp: Date.now(),
          };
        });
        totalSentDevices += pushRes.sent;
      }
    }

    await logActivity(
      authCheck.actorName,
      `Sent designated check-in & check-out reminders to ${roster.length} employee(s)`,
      'Attendance',
      'SCHEDULE-REMINDERS'
    );

    res.json({
      success: true,
      employeesReminded: roster.length,
      devicesNotified: totalSentDevices,
    });
  } catch (err: any) {
    console.error("Schedule reminder broadcast error:", err);
    res.status(500).json({ error: err?.message || "Failed to send schedule reminders" });
  }
});

// Automatic Background Scheduler: Reminds every employee of their designated check-in time & check-out time
let reminderStateLoaded = false;
let sentScheduleReminderKeys: Record<string, string> = {};

function getWallClockInTimezone(tz: string): { dateStr: string; hhmm: string; minutesOfDay: number; weekdayEn: string } {
  const safeTz = tz || 'Africa/Cairo';
  try {
    const now = new Date();
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: safeTz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      weekday: 'long',
      hour12: false,
    }).formatToParts(now);

    const getPart = (t: string) => parts.find(p => p.type === t)?.value || '';
    const year = getPart('year');
    const month = getPart('month');
    const day = getPart('day');
    let hour = parseInt(getPart('hour'), 10);
    if (hour === 24) hour = 0;
    const minute = parseInt(getPart('minute'), 10);
    const weekdayEn = getPart('weekday');

    return {
      dateStr: `${year}-${month}-${day}`,
      hhmm: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
      minutesOfDay: hour * 60 + minute,
      weekdayEn,
    };
  } catch {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const h = now.getHours();
    const min = now.getMinutes();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return {
      dateStr: `${y}-${m}-${d}`,
      hhmm: `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`,
      minutesOfDay: h * 60 + min,
      weekdayEn: days[now.getDay()],
    };
  }
}

async function runScheduledAttendanceRemindersTick() {
  try {
    if (!reminderStateLoaded) {
      reminderStateLoaded = true;
      try {
        const snap = await getDoc(doc(firestoreDb, 'settings', 'schedule_reminder_state'));
        if (snap.exists()) {
          const data = snap.data() as any;
          if (data?.sentKeys && typeof data.sentKeys === 'object') {
            sentScheduleReminderKeys = data.sentKeys;
          }
        }
      } catch {}
    }

    const roster = buildAllActiveEmployeesRoster();
    if (roster.length === 0) return;

    let stateDirty = false;
    const cutoffMs = Date.now() - 3 * 24 * 60 * 60 * 1000;

    for (const emp of roster) {
      const schedule = resolveEmployeeScheduleFromDb(emp);
      const empSubs = (db.push_subscriptions || []).filter((s: any) => doesSubscriptionMatchEmployee(s, emp));
      const empTimezone = empSubs[0]?.timezone || 'Africa/Cairo';
      const clock = getWallClockInTimezone(empTimezone);

      // Respect employee's configured working days if specified
      if (Array.isArray(schedule.working_days) && schedule.working_days.length > 0) {
        const matchesDay = schedule.working_days.some(
          d => String(d).trim().toLowerCase() === clock.weekdayEn.toLowerCase() ||
               String(d).trim().toLowerCase().startsWith(clock.weekdayEn.substring(0, 3).toLowerCase())
        );
        if (!matchesDay) continue;
      }

      const startSec = parseServerTimeToSeconds(schedule.start_time);
      const endSec = parseServerTimeToSeconds(schedule.end_time);
      const startMins = startSec !== null ? Math.floor(startSec / 60) : -999;
      const endMins = endSec !== null ? Math.floor(endSec / 60) : -999;
      const preCheckInMins = startMins >= 10 ? startMins - 10 : -999;

      type TriggerEvent = {
        slotKey: string;
        kind: 'pre_checkin' | 'checkin' | 'checkout';
      };
      const triggers: TriggerEvent[] = [];

      if (clock.minutesOfDay === preCheckInMins) {
        triggers.push({ slotKey: `${clock.dateStr}_${emp.id}_pre_checkin`, kind: 'pre_checkin' });
      }
      if (clock.minutesOfDay === startMins) {
        triggers.push({ slotKey: `${clock.dateStr}_${emp.id}_checkin`, kind: 'checkin' });
      }
      if (clock.minutesOfDay === endMins) {
        triggers.push({ slotKey: `${clock.dateStr}_${emp.id}_checkout`, kind: 'checkout' });
      }

      for (const trig of triggers) {
        if (sentScheduleReminderKeys[trig.slotKey]) continue;
        sentScheduleReminderKeys[trig.slotKey] = new Date().toISOString();
        stateDirty = true;

        const prefersAr = empSubs.some((s: any) => s.language === 'ar');
        const buildLocalizedText = (isAr: boolean) => {
          if (trig.kind === 'pre_checkin') {
            return {
              title: isAr
                ? `تذكير بقرب موعد الحضور (${schedule.start_time})`
                : `Upcoming Check-In Reminder (${schedule.start_time})`,
              body: isAr
                ? `مرحباً ${emp.name}، يبدأ دوامك بعد 10 دقائق الساعة ${schedule.start_time} (وموعد الانصراف ${schedule.end_time}).`
                : `Hello ${emp.name}, your designated check-in is in 10 minutes at ${schedule.start_time} (designated check-out: ${schedule.end_time}).`,
            };
          }
          if (trig.kind === 'checkin') {
            return {
              title: isAr
                ? `حان موعد تسجيل الحضور (${schedule.start_time})`
                : `Check-In Time Now (${schedule.start_time})`,
              body: isAr
                ? `مرحباً ${emp.name}، حان موعد حضورك المحدد (${schedule.start_time}). موعد انصرافك المحدد اليوم هو ${schedule.end_time}. يرجى تسجيل الحضور.`
                : `Hello ${emp.name}, it is your designated check-in time (${schedule.start_time}). Your designated check-out time today is ${schedule.end_time}. Please clock in now.`,
            };
          }
          return {
            title: isAr
              ? `حان موعد تسجيل الانصراف (${schedule.end_time})`
              : `Check-Out Time Now (${schedule.end_time})`,
            body: isAr
              ? `مرحباً ${emp.name}، حان موعد انصرافك المحدد (${schedule.end_time}) بعد دوام بدأ ${schedule.start_time}. لا تنسَ تسجيل الانصراف.`
              : `Hello ${emp.name}, it is your designated check-out time (${schedule.end_time}) for your ${schedule.start_time}–${schedule.end_time} shift. Please remember to clock out.`,
          };
        };

        const primaryCopy = buildLocalizedText(prefersAr);
        const notifId = `NOTIF-AUTO-${trig.slotKey.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

        await addNotification(primaryCopy.title, primaryCopy.body, 'attendance_reminder', undefined, {
          id: notifId,
          target_scope: 'EMPLOYEE',
          target_employee_id: emp.id,
          target_employee_name: emp.name,
          sender_name: 'Attendance System',
          sender_role: 'Scheduled Reminder',
          category: trig.kind === 'checkout' ? 'Check-Out Reminder' : 'Check-In Reminder',
          designated_check_in: schedule.start_time,
          designated_check_out: schedule.end_time,
        });

        if (empSubs.length > 0) {
          await dispatchWebPushToSubscriptions(empSubs, (sub: any) => {
            const copy = buildLocalizedText(sub.language === 'ar');
            return {
              id: notifId,
              tag: notifId,
              title: copy.title,
              body: copy.body,
              lang: sub.language === 'ar' ? 'ar' : 'en',
              dir: sub.language === 'ar' ? 'rtl' : 'ltr',
              tab: 'attendance',
              url: '/?tab=attendance',
              timestamp: Date.now(),
            };
          });
        }
      }
    }

    if (stateDirty) {
      // Prune entries older than 3 days to keep document compact
      for (const [k, isoVal] of Object.entries(sentScheduleReminderKeys)) {
        const ts = new Date(isoVal).getTime();
        if (!isNaN(ts) && ts < cutoffMs) {
          delete sentScheduleReminderKeys[k];
        }
      }
      try {
        await setDoc(
          doc(firestoreDb, 'settings', 'schedule_reminder_state'),
          {
            id: 'schedule_reminder_state',
            sentKeys: sentScheduleReminderKeys,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch {}
    }
  } catch (err) {
    console.warn("Scheduled attendance reminder tick warning:", err);
  }
}

// Notifications
app.get("/api/notifications", async (req, res) => {
  const notifs = await getCollectionDocs('notifications');
  res.json(notifs);
});

app.post("/api/notifications", async (req, res) => {
  const body = req.body || {};
  const notif = await addNotification(
    body.title || 'System Notification',
    body.message || '',
    body.type || 'action',
    body.link_id,
    body
  );
  res.json(notif);
});

app.put("/api/notifications/:id/read", async (req, res) => {
  const { id } = req.params;
  const reader = String(req.body?.reader || (req.headers['x-acting-user'] as string) || '').trim();
  let notif = (db.notifications || []).find((n: any) => n.id === id);
  if (!notif) {
    await getCollectionDocs('notifications');
    notif = (db.notifications || []).find((n: any) => n.id === id);
  }
  if (notif) {
    const readByList = Array.isArray(notif.read_by) ? [...notif.read_by] : [];
    if (reader && !readByList.includes(reader)) {
      readByList.push(reader);
    }
    notif.read_by = readByList;
    if (notif.target_scope !== 'ALL' || !reader) {
      notif.read = true;
    }
    await saveToFirestore('notifications', notif.id, notif);
  }
  res.json({ success: true });
});

app.put("/api/notifications/read-all", async (req, res) => {
  const reader = String(req.body?.reader || (req.headers['x-acting-user'] as string) || '').trim();
  await getCollectionDocs('notifications');
  for (const notif of db.notifications || []) {
    const readByList = Array.isArray(notif.read_by) ? [...notif.read_by] : [];
    let changed = false;
    if (reader && !readByList.includes(reader)) {
      readByList.push(reader);
      notif.read_by = readByList;
      changed = true;
    }
    if (notif.target_scope !== 'ALL' && !notif.read) {
      notif.read = true;
      changed = true;
    }
    if (changed) {
      await saveToFirestore('notifications', notif.id, notif);
    }
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
      getCollectionDocs('customer_inquiries'),
      getCollectionDocs('reservations'),
      getCollectionDocs('vouchers'),
      getCollectionDocs('invoices'),
      getCollectionDocs('visas'),
      getCollectionDocs('transfers'),
      getCollectionDocs('cruises'),
      getCollectionDocs('tours'),
      getCollectionDocs('day_trips'),
      getCollectionDocs('hotels'),
      getCollectionDocs('flights'),
      getCollectionDocs('expenses'),
      getCollectionDocs('customer_payments'),
      getCollectionDocs('supplier_payments'),
      getCollectionDocs('suppliers'),
      getCollectionDocs('tasks'),
      getCollectionDocs('activity_logs'),
      loadMergedAttendanceFromFirestore()
    ]);

    const resvIds = new Set(db.reservations.map((r: any) => r.id || r.reservation_id));
    const extraVouchers = (db.vouchers || []).filter(
      (v: any) => !resvIds.has(v.id) && !resvIds.has(v.reservation_id || '') && !resvIds.has(v.voucher_number || '')
    );
    const combinedBookings: any[] = [
      ...db.reservations,
      ...extraVouchers.map((v: any) => ({
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
      }))
    ];

    const total_customers = db.customers.length;
    const active_reservations = combinedBookings.filter(r => r.reservation_status === 'Confirmed' || r.reservation_status === 'Pending' || r.reservation_status === 'Paid' || r.reservation_status === 'Partially Paid').length;
    const todayStr = new Date().toISOString().split('T')[0];
    const todays_reservations = combinedBookings.filter(r => r.booking_date === todayStr).length;
    const upcoming_trips = combinedBookings.filter(r => r.travel_date && r.travel_date >= todayStr).length;
    
    const total_sales = combinedBookings.reduce((acc, r) => acc + (Number(r.selling_price) || 0), 0);
    const total_supplier_costs = combinedBookings.reduce((acc, r) => acc + (Number(r.cost_price) || 0), 0);
    const total_expenses = db.expenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
    const net_profit = total_sales - total_supplier_costs - total_expenses;

    const outstanding_customer_payments = db.customers.reduce((acc, c) => acc + (Number(c.outstanding_balance) || 0), 0);
    const outstanding_supplier_payments = db.suppliers.reduce((acc, s) => acc + (Number(s.outstanding_balance) || 0), 0);
    const today_tasks = db.tasks.filter(t => t.status !== 'Completed').length;

    const outstanding_by_currency: Record<string, number> = {};
    combinedBookings.forEach(r => {
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

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentYear = new Date().getFullYear();
    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      month: monthNames[i],
      Sales: 0,
      Expenses: 0,
      Profit: 0
    }));

    combinedBookings.forEach(r => {
      if (!r.booking_date) return;
      const date = new Date(r.booking_date);
      if (date.getFullYear() === currentYear) {
        const monthIdx = date.getMonth();
        monthlyData[monthIdx].Sales += Number(r.selling_price) || 0;
        monthlyData[monthIdx].Expenses += Number(r.cost_price) || 0;
      }
    });

    db.expenses.forEach(e => {
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
    combinedBookings.forEach(r => {
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
    combinedBookings.forEach(r => {
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

    const total_services =
      (db.visas?.length || 0) +
      (db.flights?.length || 0) +
      (db.hotels?.length || 0) +
      (db.transfers?.length || 0) +
      (db.cruises?.length || 0) +
      (db.tours?.length || 0) +
      (db.day_trips?.length || 0);

    const allAttList = db.attendance || [];
    const todayAttendanceList = allAttList.filter((a: any) => a.date === todayStr);
    const clocked_in_count = allAttList.filter(
      (a: any) => Boolean(a.clock_in || a.check_in_time) && !a.clock_out && (!a.check_out_time || a.check_out_time === '--')
    ).length;
    const today_working_hours = Math.round(todayAttendanceList.reduce((acc: number, a: any) => acc + (Number(a.working_hours) || 0), 0) * 100) / 100;

    const sortedRecentBookings = [...combinedBookings].sort((a, b) => {
      const tA = new Date(a.updatedAt || a.createdAt || a.booking_date || 0).getTime();
      const tB = new Date(b.updatedAt || b.createdAt || b.booking_date || 0).getTime();
      return tB - tA;
    });

    const sortedActivities = [...(db.activity_logs || [])].sort((a: any, b: any) => {
      const tA = new Date(a.createdAt || `${a.date || ''} ${a.time || ''}`).getTime() || 0;
      const tB = new Date(b.createdAt || `${b.date || ''} ${b.time || ''}`).getTime() || 0;
      return tB - tA;
    });

    res.json({
      total_customers,
      total_vouchers: db.vouchers?.length || 0,
      total_inquiries: db.customer_inquiries?.length || 0,
      new_inquiries: (db.customer_inquiries || []).filter((i: any) => i.status === 'New Inquiry').length,
      total_invoices: db.invoices?.length || 0,
      total_services,
      clocked_in_count,
      today_working_hours,
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
      recent_reservations: sortedRecentBookings.slice(0, 8),
      recent_payments: db.customer_payments.slice(-5).reverse(),
      recent_activities: sortedActivities.slice(0, 10),
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
    app.use(express.static(distPath, {
      setHeaders: (res, filePath) => {
        if (
          filePath.endsWith('sw.js') ||
          filePath.endsWith('push-sw.js') ||
          filePath.endsWith('registerSW.js') ||
          filePath.endsWith('manifest.webmanifest') ||
          filePath.endsWith('index.html')
        ) {
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
        }
      }
    }));
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: `API route not found: ${req.path}` });
      }
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Start HTTP server immediately so port 3000 is open for container health checks
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Sofia Travel Management System running on http://localhost:${PORT}`);
  });

  // Load all persistent data from Firestore & start automatic employee check-in/out schedule reminder engine
  (async () => {
    try {
      await testConnection();
      await loadFromFirestore();
      await ensureVapidConfigured();
      console.log("Persistent data & Web Push VAPID keys synchronized from Firestore. Starting schedule reminder engine...");
      runScheduledAttendanceRemindersTick();
      setInterval(() => {
        Promise.all([
          getCollectionDocs('employees'),
          getCollectionDocs('work_schedules'),
          getCollectionDocs('attendance_settings'),
          getCollectionDocs('push_subscriptions'),
        ])
          .then(() => runScheduledAttendanceRemindersTick())
          .catch(() => {});
      }, 30 * 1000);
    } catch (e) {
      console.warn("Background Firestore initialization note:", e);
    }
  })();
}

startServer();
