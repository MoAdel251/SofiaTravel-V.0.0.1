import crypto from 'crypto';
import type { AttendanceDeviceInfo, AttendanceDeviceType } from '../types';

/**
 * Server-side user-agent parsing. The browser only supplies the raw request
 * headers; classification happens on the server so attendance logs cannot be
 * forged by sending a made-up device label.
 */
function detectDeviceType(
  userAgent: string,
  platform: string,
  maxTouchPoints: number,
  secChUaMobile: string
): AttendanceDeviceType {
  const ua = userAgent.toLowerCase();
  const plat = platform.toLowerCase();
  // iPadOS 13+ reports a desktop-class "Macintosh" user agent.
  if (plat === 'macintel' && maxTouchPoints > 1) return 'Tablet';
  if (/ipad|tablet|playbook|silk/.test(ua)) return 'Tablet';
  if (/android/.test(ua) && !/mobile/.test(ua)) return 'Tablet';
  if (/mobi|iphone|ipod|android.*mobile|windows phone/.test(ua)) return 'Mobile';
  if (secChUaMobile === '?1' && !/ipad|tablet/.test(ua)) return 'Mobile';
  if (/windows|macintosh|mac os x|linux|cros/.test(ua)) return 'Desktop';
  if (plat === 'win32' || plat === 'win64' || plat === 'macintel' || plat === 'linux x86_64') return 'Desktop';
  return 'Unknown';
}

function detectOs(userAgent: string): string {
  const ua = userAgent;
  if (!ua) return 'Unknown';
  if (/windows nt 10\.0/i.test(ua)) return 'Windows 10/11';
  if (/windows nt 6\.3/i.test(ua)) return 'Windows 8.1';
  if (/windows nt 6\.1/i.test(ua)) return 'Windows 7';
  if (/windows/i.test(ua)) return 'Windows';
  if (/iphone|ipad|ipod/i.test(ua)) {
    const match = ua.match(/OS (\d+[._]\d+)/i);
    return match ? `iOS ${match[1].replace(/_/g, '.')}` : 'iOS';
  }
  if (/android/i.test(ua)) {
    const match = ua.match(/Android\s+([\d.]+)/i);
    return match ? `Android ${match[1]}` : 'Android';
  }
  if (/mac os x/i.test(ua)) {
    const match = ua.match(/Mac OS X[ _]([\d_.]+)/i);
    return match ? `macOS ${match[1].replace(/_/g, '.')}` : 'macOS';
  }
  if (/cros/i.test(ua)) return 'ChromeOS';
  if (/linux/i.test(ua)) return 'Linux';
  return 'Unknown';
}

function detectBrowser(userAgent: string): { browser: string; version?: string } {
  const ua = userAgent;
  if (!ua) return { browser: 'Unknown' };
  const rules: Array<{ name: string; regex: RegExp }> = [
    { name: 'Edge', regex: /Edg\/([\d.]+)/i },
    { name: 'Opera', regex: /OPR\/([\d.]+)/i },
    { name: 'Samsung Internet', regex: /SamsungBrowser\/([\d.]+)/i },
    { name: 'Chrome', regex: /Chrome\/([\d.]+)/i },
    { name: 'Firefox', regex: /Firefox\/([\d.]+)/i },
    { name: 'Safari', regex: /Version\/([\d.]+).*Safari/i },
  ];
  for (const rule of rules) {
    const match = ua.match(rule.regex);
    if (match) return { browser: rule.name, version: match[1] };
  }
  return { browser: 'Unknown' };
}

export function buildDeviceInfo(params: {
  userAgent?: string | null;
  platform?: string | null;
  language?: string | null;
  maxTouchPoints?: number | null;
  secChUaMobile?: string | null;
}): AttendanceDeviceInfo {
  const userAgent = String(params.userAgent || '').slice(0, 500);
  const platform = String(params.platform || '').slice(0, 120);
  const language = String(params.language || '').slice(0, 40);
  const maxTouchPoints = Number(params.maxTouchPoints) || 0;
  const secChUaMobile = String(params.secChUaMobile || '').trim();
  const { browser, version } = detectBrowser(userAgent);
  const fingerprintSource = `${userAgent}|${platform}|${language}`;
  const fingerprint = fingerprintSource.trim() === '||'
    ? ''
    : crypto.createHash('sha256').update(fingerprintSource).digest('hex').slice(0, 20);

  return {
    device_type: detectDeviceType(userAgent, platform, maxTouchPoints, secChUaMobile),
    os: detectOs(userAgent),
    browser,
    browser_version: version,
    user_agent: userAgent,
    device_fingerprint: fingerprint || undefined,
    platform: platform || undefined,
    language: language || undefined,
  };
}

/**
 * Human-readable device summary, e.g. "Computer · Windows 10/11 · Chrome 120".
 * `Desktop` is surfaced as "Computer" for non-technical readers.
 */
export function describeDevice(device: AttendanceDeviceInfo): string {
  const typeLabel =
    device.device_type === 'Desktop'
      ? 'Computer'
      : device.device_type === 'Mobile'
        ? 'Mobile device'
        : device.device_type === 'Tablet'
          ? 'Tablet'
          : 'Unknown device';
  const browser = [device.browser, device.browser_version].filter(Boolean).join(' ');
  return [typeLabel, device.os, browser].filter(Boolean).join(' · ');
}
