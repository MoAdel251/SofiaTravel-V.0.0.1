import { collection, doc, getDocs, getDoc, setDoc, deleteDoc, writeBatch, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, verifyDatabaseConnection } from '../lib/firebase';

function sanitizeForFirestore(obj: any): any {
  if (obj === undefined) return null;
  if (obj === null) return null;
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForFirestore(item));
  }
  if (typeof obj === 'object' && !(obj instanceof Date)) {
    const clean: Record<string, any> = {};
    for (const key of Object.keys(obj)) {
      if (obj[key] !== undefined) {
        clean[key] = sanitizeForFirestore(obj[key]);
      }
    }
    return clean;
  }
  return obj;
}

const CACHE_PREFIX = 'sofia_cache_';

export const OPERATIONAL_COLLECTIONS = [
  'customers',
  'customer_inquiries',
  'vouchers',
  'reservations',
  'invoices',
  'suppliers',
  'tour_packages',
  'hotels',
  'flights',
  'visas',
  'transfers',
  'cruises',
  'tours',
  'day_trips',
  'customer_payments',
  'supplier_payments',
  'expenses',
  'tasks',
  'documents',
  'notifications',
  'activity_logs',
  'permission_requests',
  'payroll_records',
  'employee_advances',
  'commission_records',
  'finance_audit_logs',
  'employee_attendance'
] as const;

export const dataService = {
  verifyConnection: verifyDatabaseConnection,

  // Real-time Cloud Firestore collection listener for instant cross-device Dashboard & site sync
  subscribeCollection<T>(collectionName: string, onUpdate: (items: T[]) => void): () => void {
    const cacheKey = `${CACHE_PREFIX}${collectionName}`;
    try {
      return onSnapshot(
        collection(db, collectionName),
        (snap) => {
          const items = snap.docs.map(d => ({ id: d.id, ...d.data() })) as T[];
          try {
            localStorage.setItem(cacheKey, JSON.stringify(items));
          } catch {}
          onUpdate(items);
        },
        (err) => {
          console.warn(`Live listener warning for ${collectionName}:`, err);
        }
      );
    } catch (e) {
      console.warn(`Could not attach live listener to ${collectionName}:`, e);
      return () => {};
    }
  },

  // Real-time Cloud Firestore document listener (e.g., settings/company_settings for instant site_disabled sync)
  subscribeDocument<T>(collectionName: string, docId: string, fallbackDefault: T, onUpdate: (data: T) => void): () => void {
    const cacheKey = `${CACHE_PREFIX}${collectionName}_${docId}`;
    try {
      return onSnapshot(
        doc(db, collectionName, docId),
        (snap) => {
          if (snap.exists()) {
            const merged = { ...fallbackDefault, ...(snap.data() as T) };
            try {
              localStorage.setItem(cacheKey, JSON.stringify(merged));
            } catch {}
            onUpdate(merged);
          }
        },
        (err) => {
          console.warn(`Live doc listener warning for ${collectionName}/${docId}:`, err);
        }
      );
    } catch (e) {
      console.warn(`Could not attach live doc listener to ${collectionName}/${docId}:`, e);
      return () => {};
    }
  },

  // Read collection with Cloud Firestore as primary source -> Backend API -> LocalStorage -> Default
  async getCollection<T>(collectionName: string, apiPath: string, fallbackDefault: T[] = []): Promise<T[]> {
    const cacheKey = `${CACHE_PREFIX}${collectionName}`;
    let cached: T[] | null = null;
    try {
      const local = localStorage.getItem(cacheKey);
      if (local !== null) {
        cached = JSON.parse(local);
      }
    } catch {}

    // 1. Direct Cloud Firestore read (authoritative across desktop, mobile, and published deployments)
    try {
      const snap = await getDocs(collection(db, collectionName));
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() })) as T[];
      try {
        localStorage.setItem(cacheKey, JSON.stringify(items));
      } catch {}
      return items;
    } catch (fsErr) {
      console.warn(`Firestore primary read fallback for ${collectionName}:`, fsErr);
    }

    // 2. Fallback to Backend API if direct Firestore was unreachable
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(`${apiPath}?t=${Date.now()}`, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const text = await res.text();
        if (text.trim().startsWith('[') || text.trim().startsWith('{')) {
          const data = JSON.parse(text);
          if (Array.isArray(data)) {
            try {
              localStorage.setItem(cacheKey, JSON.stringify(data));
            } catch {}
            return data as T[];
          }
        }
      }
    } catch {}

    // 3. Return local cached items if available, or fallbackDefault
    if (cached !== null && Array.isArray(cached)) {
      return cached;
    }
    return fallbackDefault;
  },

  // Clear all local storage operational cache & drafts
  clearLocalCache() {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith(CACHE_PREFIX) || key === 'sofia_travel_settings_draft')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch (e) {
      console.error('Error clearing local cache:', e);
    }
  },

  // Read single document (e.g. settings/company_settings) from Cloud Firestore first
  async getDocument<T>(collectionName: string, docId: string, apiPath: string, fallbackDefault: T): Promise<T> {
    const cacheKey = `${CACHE_PREFIX}${collectionName}_${docId}`;
    let cached: T = fallbackDefault;
    try {
      const local = localStorage.getItem(cacheKey);
      if (local) {
        cached = JSON.parse(local);
      }
    } catch {}

    // 1. Direct Cloud Firestore read
    try {
      const snap = await getDoc(doc(db, collectionName, docId));
      if (snap.exists()) {
        const data = { ...fallbackDefault, ...(snap.data() as T) };
        try {
          localStorage.setItem(cacheKey, JSON.stringify(data));
        } catch {}
        return data;
      }
    } catch (fsErr) {
      console.warn(`Firestore document read fallback for ${collectionName}/${docId}:`, fsErr);
    }

    // 2. Backend API fallback
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(`${apiPath}?t=${Date.now()}`, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const text = await res.text();
        if (text.trim().startsWith('{')) {
          const data = JSON.parse(text);
          if (data && typeof data === 'object' && Object.keys(data).length > 0) {
            const merged = { ...fallbackDefault, ...data } as T;
            try {
              localStorage.setItem(cacheKey, JSON.stringify(merged));
            } catch {}
            return merged;
          }
        }
      }
    } catch {}

    return cached;
  },

  // Save document directly to Firestore AND synchronize with Backend API & Local Cache
  async saveDocument<T extends Record<string, any>>(
    collectionName: string,
    docId: string,
    data: T,
    apiEndpoint?: string,
    apiMethod: 'POST' | 'PUT' = 'POST'
  ): Promise<void> {
    const cleanData = sanitizeForFirestore({ ...data, id: docId, updatedAt: new Date().toISOString() });
    const cacheKey = `${CACHE_PREFIX}${collectionName}_${docId}`;
    const collectionCacheKey = `${CACHE_PREFIX}${collectionName}`;

    // 1. Update local storage cache immediately
    try {
      const existingDocStr = localStorage.getItem(cacheKey);
      const existingDoc = existingDocStr ? JSON.parse(existingDocStr) : {};
      const mergedData = { ...existingDoc, ...cleanData };
      localStorage.setItem(cacheKey, JSON.stringify(mergedData));

      const colStr = localStorage.getItem(collectionCacheKey);
      const colArr = colStr ? JSON.parse(colStr) : [];
      if (Array.isArray(colArr)) {
        const idx = colArr.findIndex((item: any) => item.id === docId);
        if (idx >= 0) {
          colArr[idx] = { ...colArr[idx], ...cleanData };
        } else {
          colArr.unshift(mergedData);
        }
        localStorage.setItem(collectionCacheKey, JSON.stringify(colArr));
      }
    } catch (cacheErr) {
      console.warn('Local cache save error:', cacheErr);
    }

    // 2. Direct Firestore save (Guaranteed cloud persistence)
    let firestoreSaved = false;
    try {
      await setDoc(doc(db, collectionName, docId), cleanData, { merge: true });
      firestoreSaved = true;
    } catch (fsErr) {
      console.warn(`Direct Firestore write to ${collectionName}/${docId} failed:`, fsErr);
      try {
        handleFirestoreError(fsErr, OperationType.WRITE, `${collectionName}/${docId}`);
      } catch {}
    }

    // 3. Synchronize with Backend API endpoint (if running)
    if (apiEndpoint) {
      try {
        await fetch(apiEndpoint, {
          method: apiMethod,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cleanData),
        });
      } catch (apiErr) {
        if (!firestoreSaved) {
          console.error('Neither Firestore nor API could be reached:', apiErr);
        }
      }
    }
  },

  // Delete document from Firestore, Backend API, and Local Cache
  async deleteDocument(collectionName: string, docId: string, apiEndpoint?: string): Promise<void> {
    const cacheKey = `${CACHE_PREFIX}${collectionName}_${docId}`;
    const collectionCacheKey = `${CACHE_PREFIX}${collectionName}`;

    // 1. Local cache update
    try {
      localStorage.removeItem(cacheKey);
      const colStr = localStorage.getItem(collectionCacheKey);
      if (colStr) {
        let colArr = JSON.parse(colStr);
        if (Array.isArray(colArr)) {
          colArr = colArr.filter((item: any) => item.id !== docId);
          localStorage.setItem(collectionCacheKey, JSON.stringify(colArr));
        }
      }
    } catch {}

    // 2. Direct Firestore delete
    try {
      await deleteDoc(doc(db, collectionName, docId));
    } catch (fsErr) {
      console.warn(`Direct Firestore delete for ${collectionName}/${docId}:`, fsErr);
    }

    // 3. Backend API delete
    if (apiEndpoint) {
      try {
        await fetch(apiEndpoint, { method: 'DELETE' });
      } catch {}
    }
  },

  // Administrator-Only Factory Reset: Wipes all operational collections across Firestore, Backend API, and LocalStorage
  async wipeAllOperationalData(options?: { includeEmployees?: boolean; actingAdmin?: string }): Promise<{ deletedCount: number }> {
    const includeEmployees = options?.includeEmployees ?? true;
    const actingAdmin = options?.actingAdmin || 'Administrator';
    let deletedCount = 0;

    // 1. Clear local cache immediately
    this.clearLocalCache();

    // 2. Wipe all operational collections directly in Cloud Firestore using chunked batches
    for (const colName of OPERATIONAL_COLLECTIONS) {
      try {
        const snap = await getDocs(collection(db, colName));
        if (!snap.empty) {
          const docs = snap.docs;
          for (let i = 0; i < docs.length; i += 400) {
            const chunk = docs.slice(i, i + 400);
            const batch = writeBatch(db);
            chunk.forEach(d => {
              batch.delete(doc(db, colName, d.id));
              deletedCount++;
            });
            await batch.commit();
          }
        }
      } catch (err) {
        console.warn(`Error wiping Firestore collection ${colName}:`, err);
      }
    }

    // 3. Optionally wipe non-administrator employee records so no test staff remain
    if (includeEmployees) {
      try {
        const empSnap = await getDocs(collection(db, 'employees'));
        if (!empSnap.empty) {
          const nonAdminDocs = empSnap.docs.filter(d => {
            const data = d.data();
            return !(data.is_admin === true || data.position === 'Administrator' || data.role === 'Administrator');
          });
          for (let i = 0; i < nonAdminDocs.length; i += 400) {
            const chunk = nonAdminDocs.slice(i, i + 400);
            const batch = writeBatch(db);
            chunk.forEach(d => {
              batch.delete(doc(db, 'employees', d.id));
              deletedCount++;
            });
            await batch.commit();
          }
        }
      } catch (err) {
        console.warn('Error wiping non-admin employees:', err);
      }
    }

    // 4. Synchronize wipe with Backend API in-memory store
    try {
      await fetch('/api/admin/clear-all-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-acting-role': 'Administrator',
          'x-acting-user': actingAdmin,
        },
        body: JSON.stringify({
          role: 'Administrator',
          includeEmployees,
          actingAdmin,
        }),
      });
    } catch (apiErr) {
      console.warn('Backend reset endpoint skipped/offline (Firestore cloud already wiped):', apiErr);
    }

    // 5. Record clean republish state in settings/system_status
    try {
      await setDoc(
        doc(db, 'settings', 'system_status'),
        {
          id: 'system_status',
          lastFactoryResetAt: new Date().toISOString(),
          resetBy: actingAdmin,
          readyForRepublish: true,
        },
        { merge: true }
      );
    } catch {}

    // Clear cache one final time so empty collections stay pristine
    this.clearLocalCache();

    return { deletedCount };
  },
};
