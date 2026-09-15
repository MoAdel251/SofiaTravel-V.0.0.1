import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDocFromServer, initializeFirestore, memoryLocalCache } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: "AIzaSyDTJtJ0loKB65G5Mux6-tiTUrdi3n8qd2U",
  authDomain: "tidal-dynamics-s54g5.firebaseapp.com",
  projectId: "tidal-dynamics-s54g5",
  storageBucket: "tidal-dynamics-s54g5.firebasestorage.app",
  messagingSenderId: "879700596249",
  appId: "1:879700596249:web:09aba9e86995c144cf3c88",
  firestoreDatabaseId: "ai-studio-sofiatravelmanag-d5250360-2f13-4e61-9f65-9d2693ac8c37"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Use initializeFirestore with memoryLocalCache to prevent browser IndexedDB BloomFilter corruption errors
let firestoreInstance: any;
try {
  firestoreInstance = initializeFirestore(app, {
    localCache: memoryLocalCache()
  }, firebaseConfig.firestoreDatabaseId);
} catch (e) {
  try {
    firestoreInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId);
  } catch {
    firestoreInstance = getFirestore(app);
  }
}

export const db = firestoreInstance;

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
      userId: null,
      email: null,
      emailVerified: false,
      isAnonymous: true,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection per skill instructions
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'settings', 'company_settings'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Client offline status or Firestore connecting.");
    }
  }
}
testConnection();
