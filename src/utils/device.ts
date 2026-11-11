import type { AttendanceDeviceType } from '../types';

export interface ClientDeviceInfo {
  device_type: AttendanceDeviceType;
  os: string;
  browser: string;
  platform: string;
  is_touch: boolean;
  max_touch_points: number;
}

function readUserAgent(): string {
  try {
    return typeof navigator !== 'undefined' ? String(navigator.userAgent || '') : '';
  } catch {
    return '';
  }
}

function readPlatform(): string {
  try {
    const nav: any = typeof navigator !== 'undefined' ? navigator : null;
    return String(nav?.userAgentData?.platform || nav?.platform || '');
  } catch {
    return '';
  }
}

function readMaxTouchPoints(): number {
  try {
    return typeof navigator !== 'undefined' ? Number(navigator.maxTouchPoints) || 0 : 0;
  } catch {
    return 0;
  }
}

/**
 * Client-side device classification used for UI labelling and for choosing the
 * geolocation acquisition target. The server independently classifies the
 * request headers for attendance records, so this is never trusted for audit.
 */
export function detectClientDevice(): ClientDeviceInfo {
  const ua = readUserAgent();
  const lower = ua.toLowerCase();
  const platform = readPlatform();
  const lowerPlatform = platform.toLowerCase();
  const maxTouchPoints = readMaxTouchPoints();

  let deviceType: AttendanceDeviceType = 'Unknown';
  if (lowerPlatform === 'macintel' && maxTouchPoints > 1) {
    // iPadOS 13+ reports a desktop-class Safari user agent.
    deviceType = 'Tablet';
  } else if (/ipad|tablet|playbook|silk/.test(lower) || (/android/.test(lower) && !/mobile/.test(lower))) {
    deviceType = 'Tablet';
  } else if (/mobi|iphone|ipod|android.*mobile|windows phone/.test(lower)) {
    deviceType = 'Mobile';
  } else if (/windows|macintosh|mac os x|linux|cros/.test(lower)) {
    deviceType = 'Desktop';
  }

  let os = 'Unknown';
  if (/windows nt 10\.0/i.test(ua)) os = 'Windows 10/11';
  else if (/windows nt 6\.3/i.test(ua)) os = 'Windows 8.1';
  else if (/windows nt 6\.1/i.test(ua)) os = 'Windows 7';
  else if (/windows/i.test(ua)) os = 'Windows';
  else if (/iphone|ipad|ipod/i.test(ua)) {
    const match = ua.match(/OS (\d+[._]\d+)/i);
    os = match ? `iOS ${match[1].replace(/_/g, '.')}` : 'iOS';
  } else if (/android/i.test(ua)) {
    const match = ua.match(/Android\s+([\d.]+)/i);
    os = match ? `Android ${match[1]}` : 'Android';
  } else if (/mac os x/i.test(ua)) {
    const match = ua.match(/Mac OS X[ _]([\d_.]+)/i);
    os = match ? `macOS ${match[1].replace(/_/g, '.')}` : 'macOS';
  } else if (/cros/i.test(ua)) os = 'ChromeOS';
  else if (/linux/i.test(ua)) os = 'Linux';

  const browserMatch =
    ua.match(/Edg\/([\d.]+)/i) ||
    ua.match(/OPR\/([\d.]+)/i) ||
    ua.match(/SamsungBrowser\/([\d.]+)/i) ||
    ua.match(/Chrome\/([\d.]+)/i) ||
    ua.match(/Firefox\/([\d.]+)/i) ||
    ua.match(/Version\/([\d.]+).*Safari/i);
  const browserName = /Edg\//i.test(ua)
    ? 'Edge'
    : /OPR\//i.test(ua)
      ? 'Opera'
      : /SamsungBrowser\//i.test(ua)
        ? 'Samsung Internet'
        : /Chrome\//i.test(ua)
          ? 'Chrome'
          : /Firefox\//i.test(ua)
            ? 'Firefox'
            : /Safari\//i.test(ua)
              ? 'Safari'
              : 'Unknown';
  const browser = browserMatch ? `${browserName} ${browserMatch[1]}`.trim() : browserName;

  return {
    device_type: deviceType,
    os,
    browser,
    platform,
    is_touch: maxTouchPoints > 0,
    max_touch_points: maxTouchPoints,
  };
}

/** True when the device is a computer/tablet, i.e. no reliable GPS receiver. */
export function isDesktopLikeDevice(type: AttendanceDeviceType): boolean {
  return type === 'Desktop' || type === 'Tablet' || type === 'Unknown';
}

export function deviceTypeLabel(type: AttendanceDeviceType | string | undefined, isAr: boolean): string {
  switch (type) {
    case 'Mobile':
      return isAr ? 'هاتف محمول' : 'Mobile device';
    case 'Tablet':
      return isAr ? 'جهاز لوحي' : 'Tablet';
    case 'Desktop':
      return isAr ? 'كمبيوتر' : 'Computer';
    default:
      return isAr ? 'جهاز غير معروف' : 'Unknown device';
  }
}

export function describeClientDevice(info: ClientDeviceInfo, isAr: boolean): string {
  return [deviceTypeLabel(info.device_type, isAr), info.os, info.browser]
    .filter(part => part && part !== 'Unknown')
    .join(' · ');
}
