import React, { useEffect, useState } from 'react';
import { WifiOff, Database, CheckCircle2 } from 'lucide-react';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [justReconnected, setJustReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setJustReconnected(true);
      const timer = setTimeout(() => setJustReconnected(false), 3000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setJustReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (justReconnected) {
    return (
      <div className="fixed bottom-16 sm:bottom-4 left-4 right-4 sm:right-auto sm:max-w-md z-50 flex items-center gap-2.5 rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-xl shadow-emerald-900/40 animate-in fade-in slide-in-from-bottom-2 duration-200">
        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-200" />
        <div className="flex-1 min-w-0">
          <p className="font-bold">Reconnected to Cloud Database</p>
          <p className="text-[10px] text-emerald-100 font-normal">Firestore live synchronization resumed.</p>
        </div>
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div className="fixed bottom-16 sm:bottom-4 left-4 right-4 sm:right-auto sm:max-w-md z-50 flex items-center gap-2.5 rounded-2xl bg-amber-600 px-4 py-2.5 text-xs font-bold text-white shadow-xl shadow-amber-900/40 animate-in fade-in slide-in-from-bottom-2 duration-200">
        <WifiOff className="w-4 h-4 shrink-0 text-amber-200 animate-pulse" />
        <div className="flex-1 min-w-0">
          <p className="font-bold">Offline Mode Active</p>
          <p className="text-[10px] text-amber-100 font-normal">Working with locally cached database records. Will sync automatically once back online.</p>
        </div>
      </div>
    );
  }

  return null;
}
