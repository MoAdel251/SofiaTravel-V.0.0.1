import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Maintenance ("site temporarily disabled") state.
 *
 * The flag lives in the shared Firestore document `settings/system_status` so
 * that every device sees it, and it is mirrored to localStorage so an offline
 * device still respects the last known state.
 */
export interface MaintenanceState {
  enabled: boolean;
  message: string;
  updated_at?: string;
  updated_by?: string;
}

export const DEFAULT_MAINTENANCE_MESSAGE =
  'Sofia Travel is being updated. We will be back online shortly — thank you for your patience.';

const MAINTENANCE_DOC = doc(db, 'settings', 'system_status');
const CACHE_KEY = 'sofia_travel_maintenance_state';

export function maintenanceStateFromDoc(data: Record<string, any> | undefined | null): MaintenanceState {
  if (!data) return { enabled: false, message: DEFAULT_MAINTENANCE_MESSAGE };
  return {
    enabled: data.maintenanceEnabled === true,
    message: typeof data.maintenanceMessage === 'string' && data.maintenanceMessage.trim()
      ? data.maintenanceMessage
      : DEFAULT_MAINTENANCE_MESSAGE,
    updated_at: data.maintenanceUpdatedAt || data.updated_at,
    updated_by: data.maintenanceUpdatedBy || data.updated_by,
  };
}

export function readCachedMaintenanceState(): MaintenanceState | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return maintenanceStateFromDoc(JSON.parse(raw));
  } catch {
    return null;
  }
}

function cacheMaintenanceState(state: MaintenanceState): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(state));
  } catch {
    // Storage can be unavailable in private mode; the cloud is the source of truth.
  }
}

/** Read the current state: Firestore → REST API → local cache. */
export async function fetchMaintenanceState(): Promise<MaintenanceState> {
  try {
    const snapshot = await getDoc(MAINTENANCE_DOC);
    if (snapshot.exists()) {
      const state = maintenanceStateFromDoc(snapshot.data());
      cacheMaintenanceState(state);
      return state;
    }
  } catch {
    // Fall through to the API / cache.
  }

  try {
    const response = await fetch(`/api/system-status?t=${Date.now()}`);
    if (response.ok) {
      const data = await response.json();
      const state = maintenanceStateFromDoc(data);
      cacheMaintenanceState(state);
      return state;
    }
  } catch {
    // Offline or static-only hosting.
  }

  return readCachedMaintenanceState() || { enabled: false, message: DEFAULT_MAINTENANCE_MESSAGE };
}

/** Live subscription so every open device reacts as soon as the developer toggles. */
export function subscribeMaintenanceState(onChange: (state: MaintenanceState) => void): () => void {
  let unsubscribe: (() => void) | null = null;
  try {
    unsubscribe = onSnapshot(
      MAINTENANCE_DOC,
      snapshot => {
        if (!snapshot.exists()) return;
        const state = maintenanceStateFromDoc(snapshot.data());
        cacheMaintenanceState(state);
        onChange(state);
      },
      () => {
        // Errors are handled by the polling/manual refresh path.
      }
    );
  } catch {
    unsubscribe = null;
  }
  return () => {
    if (unsubscribe) unsubscribe();
  };
}

/**
 * Developer-only: enable or disable maintenance mode.
 * Writes directly to Firestore (works on static hosting) and mirrors the
 * change through the REST API so the backend keeps its own copy.
 */
export async function saveMaintenanceState(input: {
  enabled: boolean;
  message?: string;
  actor: string;
}): Promise<MaintenanceState> {
  const message = (input.message || '').trim() || DEFAULT_MAINTENANCE_MESSAGE;
  const state: MaintenanceState = {
    enabled: input.enabled,
    message,
    updated_at: new Date().toISOString(),
    updated_by: input.actor || 'IT',
  };

  const payload = {
    maintenanceEnabled: state.enabled,
    maintenanceMessage: state.message,
    maintenanceUpdatedAt: state.updated_at,
    maintenanceUpdatedBy: state.updated_by,
  };

  let cloudSaved = false;
  try {
    await setDoc(MAINTENANCE_DOC, payload, { merge: true });
    cloudSaved = true;
  } catch (error) {
    console.warn('Could not save maintenance mode to Firestore:', error);
  }

  let apiSaved = false;
  try {
    const response = await fetch('/api/system-status/maintenance', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-acting-user': state.updated_by || 'IT',
        'x-acting-role': 'Administrator',
      },
      body: JSON.stringify({ ...payload, actingUser: state.updated_by }),
    });
    apiSaved = response.ok;
  } catch {
    // Static hosting without the API is fine — Firestore already has the change.
  }

  if (!cloudSaved && !apiSaved) {
    throw new Error('Could not reach the database. Please check the connection and try again.');
  }

  cacheMaintenanceState(state);
  return state;
}
