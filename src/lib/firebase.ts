import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, setLogLevel } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Silence non-critical SDK internal bloom filter / network warnings
const suppressBloomFilter = (fn: (...args: any[]) => void) => {
  return (...args: any[]) => {
    const combined = args
      .map(a => (typeof a === 'object' && a !== null ? (a.message || a.stack || JSON.stringify(a)) : String(a)))
      .join(' ');
    if (combined.includes('BloomFilter') || combined.includes('Invalid hash count')) {
      return;
    }
    fn(...args);
  };
};
if (typeof console !== 'undefined') {
  console.warn = suppressBloomFilter(console.warn);
  console.error = suppressBloomFilter(console.error);
}

try {
  setLogLevel('silent');
} catch {}

export const config = {
  ...firebaseConfig,
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfig.appId,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || firebaseConfig.firestoreDatabaseId,
};

const app = !getApps().length ? initializeApp(config) : getApp();
export const db = getFirestore(app, config.firestoreDatabaseId);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || false,
      isAnonymous: auth?.currentUser?.isAnonymous ?? true,
      tenantId: auth?.currentUser?.tenantId || null,
      providerInfo:
        auth?.currentUser?.providerData?.map(provider => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface DatabaseConnectionStatus {
  connected: boolean;
  databaseId: string;
  projectId: string;
  latencyMs: number;
  checkedAt: string;
  error?: string;
}

// Validate connection per skill instructions
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Please check your Firebase configuration or network status.');
      return false;
    }
    return true;
  }
}

export async function verifyDatabaseConnection(): Promise<DatabaseConnectionStatus> {
  const start = Date.now();
  try {
    await getDocFromServer(doc(db, 'settings', 'company_settings'));
    return {
      connected: true,
      databaseId: config.firestoreDatabaseId || '(default)',
      projectId: config.projectId,
      latencyMs: Math.max(1, Date.now() - start),
      checkedAt: new Date().toISOString(),
    };
  } catch (error: any) {
    const msg = error instanceof Error ? error.message : String(error);
    const isOffline = msg.includes('the client is offline') || msg.includes('Failed to get document because the client is offline');
    return {
      connected: !isOffline,
      databaseId: config.firestoreDatabaseId || '(default)',
      projectId: config.projectId,
      latencyMs: Math.max(1, Date.now() - start),
      checkedAt: new Date().toISOString(),
      error: isOffline ? msg : undefined,
    };
  }
}

testConnection();
