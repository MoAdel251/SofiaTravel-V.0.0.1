import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

// Add Firebase imports
const imports = `
import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, getDocs, deleteDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDbv4GKEAs7x38VU0fX9W9ERrnR5b_G4cQ",
  authDomain: "sofiatravel-c86ec.firebaseapp.com",
  projectId: "sofiatravel-c86ec",
  storageBucket: "sofiatravel-c86ec.firebasestorage.app",
  messagingSenderId: "818590455835",
  appId: "1:818590455835:web:fbc8af8acb3bbe54fc80be"
};
const firebaseApp = initializeApp(firebaseConfig);
const firestoreDb = getFirestore(firebaseApp);

async function loadFromFirestore() {
  const collections = ['employees', 'customers', 'suppliers', 'hotels', 'flights', 'tour_packages', 'reservations', 'customer_payments', 'supplier_payments', 'expenses', 'tasks', 'documents', 'notifications', 'invoices', 'activity_logs'];
  try {
    console.log("Loading data from Firestore...");
    // Load Settings
    const setSnap = await getDocs(collection(firestoreDb, 'settings'));
    if (!setSnap.empty) {
       db.settings = { ...db.settings, ...setSnap.docs[0].data() };
    } else {
       // Save default settings if empty
       await setDoc(doc(firestoreDb, 'settings', 'main'), db.settings);
    }

    for (const c of collections) {
       const snap = await getDocs(collection(firestoreDb, c));
       if (!snap.empty) {
          db[c] = snap.docs.map(d => d.data());
       }
    }
    console.log("Firestore data loaded successfully.");
  } catch (err) {
    console.error("Error loading from Firestore:", err);
  }
}

async function saveToFirestore(collectionName: string, id: string, data: any) {
  try {
    await setDoc(doc(firestoreDb, collectionName, id), data);
  } catch (err) {
    console.error("Firestore sync error (save):", err);
  }
}
async function deleteFromFirestore(collectionName: string, id: string) {
  try {
    await deleteDoc(doc(firestoreDb, collectionName, id));
  } catch (err) {
    console.error("Firestore sync error (delete):", err);
  }
}
`;

content = content.replace('import express from "express";', imports + '\nimport express from "express";');

// Add call to loadFromFirestore at startServer
content = content.replace('const app = express();', 'const app = express();\n  await loadFromFirestore();');

// Helper to patch app.post
function patchPost(collectionKey, firestoreCollection) {
  const regex = new RegExp(`app\\.post\\("/api/${collectionKey.replace('_', '-')}", \\(req, res\\) => \\{[\\s\\S]*?res\\.json\\((.*?)\\);\\n\\}\\);`, 'g');
  content = content.replace(regex, (match, responseObj) => {
    // Inject saveToFirestore before res.json
    return match.replace(`res.json(${responseObj});`, `saveToFirestore('${firestoreCollection}', ${responseObj}.id, ${responseObj});\n  res.json(${responseObj});`);
  });
}

function patchPut(collectionKey, firestoreCollection) {
  const regex = new RegExp(`app\\.put\\("/api/${collectionKey.replace('_', '-')}/:id", \\(req, res\\) => \\{[\\s\\S]*?res\\.json\\((.*?)\\);\\n\\}\\);`, 'g');
  content = content.replace(regex, (match, responseObj) => {
    return match.replace(`res.json(${responseObj});`, `saveToFirestore('${firestoreCollection}', ${responseObj}.id, ${responseObj});\n  res.json(${responseObj});`);
  });
}

function patchDelete(collectionKey, firestoreCollection) {
  const regex = new RegExp(`app\\.delete\\("/api/${collectionKey.replace('_', '-')}/:id", \\(req, res\\) => \\{[\\s\\S]*?res\\.json\\((.*?)\\);\\n\\}\\);`, 'g');
  content = content.replace(regex, (match, responseObj) => {
    return match.replace(`res.json(${responseObj});`, `deleteFromFirestore('${firestoreCollection}', id);\n  res.json(${responseObj});`);
  });
}

const colls = [
  { k: 'customers', f: 'customers' },
  { k: 'reservations', f: 'reservations' },
  { k: 'tour-packages', f: 'tour_packages' },
  { k: 'hotels', f: 'hotels' },
  { k: 'flights', f: 'flights' },
  { k: 'suppliers', f: 'suppliers' },
  { k: 'customer-payments', f: 'customer_payments' },
  { k: 'supplier-payments', f: 'supplier_payments' },
  { k: 'expenses', f: 'expenses' },
  { k: 'employees', f: 'employees' },
  { k: 'tasks', f: 'tasks' },
  { k: 'documents', f: 'documents' },
  { k: 'invoices', f: 'invoices' }
];

colls.forEach(c => {
  patchPost(c.k, c.f);
  patchPut(c.k, c.f);
  patchDelete(c.k, c.f);
});

// Patch settings manually
content = content.replace(`app.put("/api/settings", (req, res) => {
  db.settings = { ...db.settings, ...req.body };
  logActivity("Administrator", "Updated company settings", "Settings", "Settings");
  res.json(db.settings);
});`, `app.put("/api/settings", (req, res) => {
  db.settings = { ...db.settings, ...req.body };
  logActivity("Administrator", "Updated company settings", "Settings", "Settings");
  saveToFirestore('settings', 'main', db.settings);
  res.json(db.settings);
});`);

// Patch notifications manually
content = content.replace(`app.put("/api/notifications/:id/read", (req, res) => {
  const { id } = req.params;
  const idx = db.notifications.findIndex(n => n.id === id);
  if (idx !== -1) {
    db.notifications[idx].read = true;
  }
  res.json({ success: true });
});`, `app.put("/api/notifications/:id/read", (req, res) => {
  const { id } = req.params;
  const idx = db.notifications.findIndex(n => n.id === id);
  if (idx !== -1) {
    db.notifications[idx].read = true;
    saveToFirestore('notifications', db.notifications[idx].id, db.notifications[idx]);
  }
  res.json({ success: true });
});`);

// Also patch logActivity
content = content.replace(`db.activity_logs.unshift({`, `const newLog = {`);
content = content.replace(`time: timeStr\n  });`, `time: timeStr\n  };\n  db.activity_logs.unshift(newLog);\n  saveToFirestore('activity_logs', newLog.id, newLog);`);

fs.writeFileSync('server.ts', content);
