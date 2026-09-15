import { collection, doc, getDocs, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

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

export const dataService = {
  // Read collection with dual-fallback: API -> Direct Firestore -> LocalStorage -> Default
  async getCollection<T>(collectionName: string, apiPath: string, fallbackDefault: T[] = []): Promise<T[]> {
    const cacheKey = `${CACHE_PREFIX}${collectionName}`;
    let cached: T[] | null = null;
    try {
      const local = localStorage.getItem(cacheKey);
      if (local !== null) {
        cached = JSON.parse(local);
      }
    } catch {}

    // 1. Try API first (when running with backend server)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(`${apiPath}?t=${Date.now()}`, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const text = await res.text();
        // Check if response is real JSON and not an HTML fallback page
        if (text.trim().startsWith('[') || text.trim().startsWith('{')) {
          const data = JSON.parse(text);
          if (Array.isArray(data)) {
            try { localStorage.setItem(cacheKey, JSON.stringify(data)); } catch {}
            return data as T[];
          }
        }
      }
    } catch (e) {
      // API unreachable
    }

    // 2. Direct Firestore fallback (works anywhere online, static hosting, or direct deployment)
    try {
      const snap = await getDocs(collection(db, collectionName));
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() })) as T[];
      try { localStorage.setItem(cacheKey, JSON.stringify(items)); } catch {}
      return items;
    } catch (fsErr) {
      console.warn(`Firestore read fallback for ${collectionName}:`, fsErr);
    }

    // 3. Return local cached items if available, or fallbackDefault
    if (cached !== null && Array.isArray(cached)) {
      return cached;
    }
    return fallbackDefault;
  },

  // Clear all local storage cache
  clearLocalCache() {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(CACHE_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch (e) {
      console.error("Error clearing local cache:", e);
    }
  },

  // Read single document (like settings)
  async getDocument<T>(collectionName: string, docId: string, apiPath: string, fallbackDefault: T): Promise<T> {
    const cacheKey = `${CACHE_PREFIX}${collectionName}_${docId}`;
    let cached: T = fallbackDefault;
    try {
      const local = localStorage.getItem(cacheKey);
      if (local) {
        cached = JSON.parse(local);
      }
    } catch {}

    // 1. Try API first
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
            try { localStorage.setItem(cacheKey, JSON.stringify(data)); } catch {}
            return data as T;
          }
        }
      }
    } catch {}

    // 2. Direct Firestore fallback
    try {
      const snap = await getDoc(doc(db, collectionName, docId));
      if (snap.exists()) {
        const data = snap.data() as T;
        try { localStorage.setItem(cacheKey, JSON.stringify(data)); } catch {}
        return data;
      }
    } catch (fsErr) {
      console.warn(`Firestore read fallback for ${collectionName}/${docId}:`, fsErr);
    }

    return cached;
  },

  // Save document directly to Firestore AND attempt API save AND local cache
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
      localStorage.setItem(cacheKey, JSON.stringify(cleanData));
      const colStr = localStorage.getItem(collectionCacheKey);
      let colArr = colStr ? JSON.parse(colStr) : [];
      if (Array.isArray(colArr)) {
        const idx = colArr.findIndex((item: any) => item.id === docId);
        if (idx >= 0) {
          colArr[idx] = cleanData;
        } else {
          colArr.unshift(cleanData);
        }
        localStorage.setItem(collectionCacheKey, JSON.stringify(colArr));
      }
    } catch (cacheErr) {
      console.warn("Local cache save error:", cacheErr);
    }

    // 2. Direct Firestore save (Guaranteed cloud persistence in any hosting environment)
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

    // 3. API endpoint call (if server is present)
    if (apiEndpoint) {
      try {
        await fetch(apiEndpoint, {
          method: apiMethod,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cleanData)
        });
      } catch (apiErr) {
        // Backend not running, but Firestore and Local Cache are already saved!
        if (!firestoreSaved) {
          console.error("Neither Firestore nor API could be reached:", apiErr);
        }
      }
    }
  },

  // Delete document
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

    // 3. API call if present
    if (apiEndpoint) {
      try {
        await fetch(apiEndpoint, { method: 'DELETE' });
      } catch {}
    }
  }
};
