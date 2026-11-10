import {
  AttendanceSettings,
  Employee,
  NotificationItem,
  WorkSchedule,
} from '../types';
import { getLocalDateYYYYMMDD, normalizeTimeHHMM } from '../utils/attendance';

export type PhoneNotificationSupportStatus =
  | 'granted'
  | 'default'
  | 'denied'
  | 'ios_install_required'
  | 'unsupported';

export interface EmployeePushIdentity {
  employee_id: string;
  employee_name: string;
  username: string;
  user_role: string;
  language: 'en' | 'ar';
  designated_check_in?: string;
  designated_check_out?: string;
}

const SUBSCRIBED_CACHE_KEY = 'sofia_push_subscribed_v1';

export function isRunningStandalonePWA(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

export function isIOSBrowser(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(ua) && !(window as any).MSStream;
}

export function getPhoneNotificationSupportStatus(): PhoneNotificationSupportStatus {
  if (typeof window === 'undefined') return 'unsupported';
  if (!('Notification' in window)) {
    if (isIOSBrowser() && !isRunningStandalonePWA()) {
      return 'ios_install_required';
    }
    return 'unsupported';
  }
  return Notification.permission as 'granted' | 'default' | 'denied';
}

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

let swRegistrationPromise: Promise<ServiceWorkerRegistration | null> | null = null;
let swListenersAttached = false;

export async function ensurePushServiceWorkerReady(
  onNavigateTab?: (tab: string) => void
): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  if (onNavigateTab && !swListenersAttached) {
    swListenersAttached = true;

    // Handle deep-link ?tab=... when an employee taps a phone push notification while app was closed
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const initialTab = urlParams.get('tab');
      if (initialTab) {
        onNavigateTab(initialTab);
        const cleanUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, '', cleanUrl || '/');
      }
    } catch {}

    navigator.serviceWorker.addEventListener('message', (event) => {
      const data = event.data;
      if (data && data.type === 'SOFIA_PUSH_CLICK' && data.tab) {
        onNavigateTab(String(data.tab));
      }
    });
  }

  if (!swRegistrationPromise) {
    swRegistrationPromise = (async () => {
      try {
        const hadExistingController = Boolean(navigator.serviceWorker.controller);
        let refreshing = false;

        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (!hadExistingController || refreshing) return;
          refreshing = true;
          // Reload smoothly so the installed phone web app immediately applies updates
          window.location.reload();
        });

        // Use production Workbox /sw.js (which imports /push-sw.js) if present, otherwise /push-sw.js in dev
        let swScriptUrl = '/push-sw.js';
        try {
          const checkSw = await fetch(`/sw.js?t=${Date.now()}`, {
            method: 'HEAD',
            cache: 'no-store',
          });
          const contentType = checkSw.headers.get('content-type') || '';
          if (checkSw.ok && contentType.includes('javascript')) {
            swScriptUrl = '/sw.js';
          }
        } catch {}

        const registration = await navigator.serviceWorker.register(swScriptUrl, {
          scope: '/',
          updateViaCache: 'none',
        });

        const promptWaitingWorker = (reg: ServiceWorkerRegistration) => {
          if (reg.waiting) {
            try {
              reg.waiting.postMessage({ type: 'SKIP_WAITING' });
            } catch {}
          }
        };

        promptWaitingWorker(registration);

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              promptWaitingWorker(registration);
            }
          });
        });

        // Automatically check for updates when installed phone app comes to foreground or reconnects
        const triggerUpdateCheck = () => {
          registration.update().then(() => promptWaitingWorker(registration)).catch(() => {});
        };

        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            triggerUpdateCheck();
          }
        });
        window.addEventListener('online', triggerUpdateCheck);
        setInterval(triggerUpdateCheck, 15 * 60 * 1000);

        await navigator.serviceWorker.ready;
        return registration;
      } catch (err) {
        console.warn('Service Worker registration warning:', err);
        swRegistrationPromise = null;
        return null;
      }
    })();
  }

  return swRegistrationPromise;
}

export async function showPhoneNotificationViaSW(payload: {
  id?: string;
  title: string;
  body: string;
  lang?: 'en' | 'ar';
  tab?: string;
}): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission !== 'granted') return false;

  const isAr = payload.lang === 'ar';
  const tag = payload.id || `sofia-local-${Date.now()}`;

  try {
    const reg = await ensurePushServiceWorkerReady();
    if (reg && typeof reg.showNotification === 'function') {
      await reg.showNotification(payload.title, {
        body: payload.body,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag,
        dir: isAr ? 'rtl' : 'ltr',
        lang: isAr ? 'ar' : 'en',
        data: {
          url: `/?tab=${encodeURIComponent(payload.tab || 'notifications')}`,
          tab: payload.tab || 'notifications',
          notificationId: tag,
        },
      } as NotificationOptions);
      return true;
    }
  } catch (swErr) {
    console.warn('ServiceWorker showNotification fallback:', swErr);
  }

  try {
    new Notification(payload.title, {
      body: payload.body,
      icon: '/pwa-192x192.png',
      tag,
      dir: isAr ? 'rtl' : 'ltr',
      lang: isAr ? 'ar' : 'en',
    });
    return true;
  } catch {
    return false;
  }
}

export function resolveEmployeeDesignatedSchedule(
  empQuery: {
    id?: string;
    employee_id?: string;
    name?: string;
    username?: string;
  },
  workSchedules: WorkSchedule[] = [],
  attendanceSettings?: AttendanceSettings | null,
  scheduleDate: string = getLocalDateYYYYMMDD()
): {
  checkIn: string;
  checkOut: string;
  graceMinutes: number;
  workingDays: string[];
} {
  const defaultCheckIn = normalizeTimeHHMM(attendanceSettings?.default_start_time) || '10:00';
  const defaultCheckOut = normalizeTimeHHMM(attendanceSettings?.default_end_time) || '18:00';
  const defaultGrace = Number(attendanceSettings?.default_grace_period_minutes) || 0;
  const defaultDays = Array.isArray(attendanceSettings?.default_working_days)
    ? attendanceSettings!.default_working_days!
    : [];

  const qIds = [empQuery.id, empQuery.employee_id]
    .map(v => String(v || '').trim().toLowerCase())
    .filter(Boolean);
  const qNames = [empQuery.name, empQuery.username]
    .map(v => String(v || '').trim().toLowerCase())
    .filter(Boolean);

  const matchesEmployee = (ws: WorkSchedule) => {
    const wsId = String(ws.employee_id || ws.id || '').trim().toLowerCase();
    const wsName = String(ws.employee_name || '').trim().toLowerCase();
    if (wsId && qIds.includes(wsId)) return true;
    if (wsName && (qNames.includes(wsName) || qIds.includes(wsName))) return true;
    return false;
  };

  const dayOverride = scheduleDate
    ? workSchedules.find(ws => matchesEmployee(ws) && String(ws.schedule_date || '').trim() === scheduleDate)
    : undefined;
  const matched = dayOverride || workSchedules.find(ws => matchesEmployee(ws) && !String(ws.schedule_date || '').trim());

  if (matched) {
    return {
      checkIn: normalizeTimeHHMM(matched.start_time) || defaultCheckIn,
      checkOut: normalizeTimeHHMM(matched.end_time) || defaultCheckOut,
      graceMinutes: Number(matched.grace_period_minutes) || defaultGrace,
      workingDays: Array.isArray(matched.working_days) ? matched.working_days : defaultDays,
    };
  }

  return {
    checkIn: defaultCheckIn,
    checkOut: defaultCheckOut,
    graceMinutes: defaultGrace,
    workingDays: defaultDays,
  };
}

async function subscribeBrowserPushManager(
  registration: ServiceWorkerRegistration
): Promise<PushSubscription | null> {
  if (!('pushManager' in registration)) return null;

  const keyRes = await fetch(`/api/push/vapid-public-key?t=${Date.now()}`);
  if (!keyRes.ok) return null;
  const { publicKey } = await keyRes.json();
  if (!publicKey) return null;

  const applicationServerKey = urlBase64ToUint8Array(publicKey);

  try {
    let existingSub = await registration.pushManager.getSubscription();
    if (existingSub) {
      return existingSub;
    }
    return await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });
  } catch (subErr: any) {
    // Handle VAPID key mismatch by unsubscribing stale subscription and re-subscribing
    try {
      const oldSub = await registration.pushManager.getSubscription();
      if (oldSub) await oldSub.unsubscribe();
      return await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });
    } catch (retryErr) {
      console.warn('PushManager subscribe unavailable in current context:', retryErr);
      return null;
    }
  }
}

export async function enableEmployeePhoneNotifications(
  identity: EmployeePushIdentity
): Promise<{
  granted: boolean;
  status: PhoneNotificationSupportStatus;
  pushSubscribed: boolean;
  schedule: { checkIn: string; checkOut: string };
}> {
  const defaultSchedule = {
    checkIn: identity.designated_check_in || '10:00',
    checkOut: identity.designated_check_out || '18:00',
  };

  const support = getPhoneNotificationSupportStatus();
  if (support === 'ios_install_required' || support === 'unsupported') {
    return {
      granted: false,
      status: support,
      pushSubscribed: false,
      schedule: defaultSchedule,
    };
  }

  // Must invoke requestPermission directly from user gesture for Android & iOS Safari PWA compatibility
  const permissionResult = await Notification.requestPermission();
  if (permissionResult !== 'granted') {
    return {
      granted: false,
      status: permissionResult as PhoneNotificationSupportStatus,
      pushSubscribed: false,
      schedule: defaultSchedule,
    };
  }

  const registration = await ensurePushServiceWorkerReady();
  let pushSubscribed = false;
  let resolvedSchedule = { ...defaultSchedule };

  if (registration) {
    const subscription = await subscribeBrowserPushManager(registration);
    if (subscription) {
      try {
        const timezone =
          Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Cairo';
        const res = await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subscription: subscription.toJSON(),
            employee_id: identity.employee_id,
            employee_name: identity.employee_name,
            username: identity.username,
            user_role: identity.user_role,
            language: identity.language,
            timezone,
            is_standalone: isRunningStandalonePWA(),
            user_agent: navigator.userAgent,
            sendImmediateAlert: false,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          pushSubscribed = true;
          if (data.designatedSchedule?.checkIn && data.designatedSchedule?.checkOut) {
            resolvedSchedule = {
              checkIn: data.designatedSchedule.checkIn,
              checkOut: data.designatedSchedule.checkOut,
            };
          }
          try {
            localStorage.setItem(
              `${SUBSCRIBED_CACHE_KEY}_${identity.employee_id || identity.username}`,
              subscription.endpoint
            );
          } catch {}
        }
      } catch (err) {
        console.warn('Server push subscription sync warning:', err);
      }
    }
  }

  return {
    granted: true,
    status: 'granted',
    pushSubscribed,
    schedule: resolvedSchedule,
  };
}

export async function syncExistingEmployeePushSubscription(
  identity: EmployeePushIdentity
): Promise<boolean> {
  if (getPhoneNotificationSupportStatus() !== 'granted') return false;

  const registration = await ensurePushServiceWorkerReady();
  if (!registration) return false;

  const subscription = await subscribeBrowserPushManager(registration);
  if (!subscription) return false;

  const cacheKey = `${SUBSCRIBED_CACHE_KEY}_${identity.employee_id || identity.username}`;

  try {
    const timezone =
      Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Cairo';
    const res = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        employee_id: identity.employee_id,
        employee_name: identity.employee_name,
        username: identity.username,
        user_role: identity.user_role,
        language: identity.language,
        timezone,
        is_standalone: isRunningStandalonePWA(),
        user_agent: navigator.userAgent,
        sendImmediateAlert: false,
      }),
    });
    if (res.ok) {
      try {
        localStorage.setItem(cacheKey, subscription.endpoint);
      } catch {}
      return true;
    }
  } catch {}

  return false;
}

export async function sendSelfTestPhoneNotification(
  identity: EmployeePushIdentity
): Promise<boolean> {
  if (getPhoneNotificationSupportStatus() !== 'granted') {
    const enabled = await enableEmployeePhoneNotifications(identity);
    return enabled.granted;
  }

  let serverDelivered = false;
  try {
    const registration = await ensurePushServiceWorkerReady();
    const existingSub = registration ? await registration.pushManager?.getSubscription() : null;
    const res = await fetch('/api/push/test-self', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employee_id: identity.employee_id,
        employee_name: identity.employee_name,
        username: identity.username,
        language: identity.language,
        endpoint: existingSub?.endpoint,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      serverDelivered = Number(data.sent) > 0;
    }
  } catch {}

  if (!serverDelivered) {
    const isAr = identity.language === 'ar';
    const checkIn = identity.designated_check_in || '10:00';
    const checkOut = identity.designated_check_out || '18:00';
    return showPhoneNotificationViaSW({
      id: `NOTIF-TEST-${Date.now()}`,
      title: isAr
        ? `تنبيه فوري ومواعيد الدوام — ${identity.employee_name}`
        : `Instant Phone Alert & Shift Schedule — ${identity.employee_name}`,
      body: isAr
        ? `موعد الحضور المحدد: ${checkIn} | موعد الانصراف المحدد: ${checkOut}. الإشعارات تعمل بنجاح على هاتفك.`
        : `Designated Check-In: ${checkIn} | Designated Check-Out: ${checkOut}. Push notifications are active on your phone.`,
      lang: identity.language,
      tab: 'attendance',
    });
  }

  return true;
}

export function isNotificationVisibleToUser(
  notif: NotificationItem,
  params: {
    isAdminOrIT: boolean;
    employee?: Employee | null;
    empId?: string;
    username?: string;
  }
): boolean {
  if (params.isAdminOrIT) return true;
  if (!notif.target_scope || notif.target_scope === 'ALL') return true;

  const userTokens = [
    params.empId,
    params.employee?.id,
    params.employee?.employee_id,
    params.employee?.name,
    params.employee?.full_name,
    params.employee?.username,
    params.username,
  ]
    .map(v => String(v || '').trim().toLowerCase())
    .filter(Boolean);

  const targetId = String(notif.target_employee_id || '').trim().toLowerCase();
  const targetName = String(notif.target_employee_name || '').trim().toLowerCase();

  if (targetId && userTokens.includes(targetId)) return true;
  if (targetName && userTokens.includes(targetName)) return true;
  return false;
}

export function isNotificationReadByUser(
  notif: NotificationItem,
  readerKeys: string[]
): boolean {
  const cleanKeys = readerKeys.map(k => String(k || '').trim()).filter(Boolean);
  if (Array.isArray(notif.read_by) && cleanKeys.some(k => notif.read_by!.includes(k))) {
    return true;
  }
  if (notif.target_scope === 'ALL') {
    return Boolean(notif.read && (!notif.read_by || notif.read_by.length === 0));
  }
  return Boolean(notif.read);
}

export function sortNotificationsNewestFirst(list: NotificationItem[]): NotificationItem[] {
  const extractTime = (n: NotificationItem): number => {
    if (n.created_at) {
      const t = new Date(n.created_at).getTime();
      if (!isNaN(t)) return t;
    }
    if (n.updatedAt) {
      const t = new Date(n.updatedAt).getTime();
      if (!isNaN(t)) return t;
    }
    const idTsMatch = String(n.id || '').match(/(\d{13})/);
    if (idTsMatch) {
      return Number(idTsMatch[1]);
    }
    if (n.date) {
      const t = new Date(n.date).getTime();
      if (!isNaN(t)) return t;
    }
    return 0;
  };

  return [...list].sort((a, b) => extractTime(b) - extractTime(a));
}
