import { db } from './firebase';
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';

export interface CabinetLogItem {
  id: string;
  userId: string;
  userLogin: string;
  userName?: string;
  action: 'login' | 'logout' | 'password_change' | 'login_change' | 'profile_update' | 'order_placed' | 'custom';
  actionLabel: string;
  timestamp: string;
  device: string;
  browser: string;
  os: string;
  screen: string;
  ip: string;
  details: string;
  status: 'success' | 'warning' | 'info';
}

export function detectDeviceInfo(): {
  device: string;
  browser: string;
  os: string;
  screen: string;
} {
  if (typeof window === 'undefined') {
    return {
      device: 'Server',
      browser: 'Noma’lum',
      os: 'Linux',
      screen: 'N/A',
    };
  }

  const ua = navigator.userAgent;
  let os = 'Noma’lum operatsion tizim';
  let device = 'Kompyuter (Desktop)';

  if (/android/i.test(ua)) {
    os = 'Android';
    device = 'Android Smartphone';
  } else if (/iphone|ipad|ipod/i.test(ua)) {
    os = 'iOS';
    device = /ipad/i.test(ua) ? 'Apple iPad' : 'Apple iPhone';
  } else if (/windows nt 10/i.test(ua)) {
    os = 'Windows 10/11';
    device = 'Windows PC';
  } else if (/macintosh|mac os x/i.test(ua)) {
    os = 'macOS';
    device = 'Apple Mac';
  } else if (/linux/i.test(ua)) {
    os = 'Linux';
    device = 'Linux Qurilma';
  }

  let browser = 'Brauzer';
  if (/chrome|crios/i.test(ua) && !/edg/i.test(ua) && !/opr/i.test(ua)) {
    browser = 'Google Chrome';
  } else if (/safari/i.test(ua) && !/chrome/i.test(ua)) {
    browser = 'Apple Safari';
  } else if (/firefox|fxios/i.test(ua)) {
    browser = 'Mozilla Firefox';
  } else if (/edg/i.test(ua)) {
    browser = 'Microsoft Edge';
  } else if (/opr/i.test(ua)) {
    browser = 'Opera';
  }

  const screen = `${window.screen?.width || window.innerWidth}x${window.screen?.height || window.innerHeight}`;

  return { device, browser, os, screen };
}

const STORAGE_PREFIX = 'bunkerstroy_cabinet_logs_';

export async function recordCabinetLog(params: {
  userId: string;
  userLogin: string;
  userName?: string;
  action: 'login' | 'logout' | 'password_change' | 'login_change' | 'profile_update' | 'order_placed' | 'custom';
  actionLabel: string;
  details: string;
  status?: 'success' | 'warning' | 'info';
}): Promise<CabinetLogItem> {
  const dev = detectDeviceInfo();
  const logItem: CabinetLogItem = {
    id: 'log-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6),
    userId: params.userId || 'guest',
    userLogin: params.userLogin || 'mehmon',
    userName: params.userName || params.userLogin || 'Foydalanuvchi',
    action: params.action,
    actionLabel: params.actionLabel,
    timestamp: new Date().toISOString(),
    device: dev.device,
    browser: dev.browser,
    os: dev.os,
    screen: dev.screen,
    ip: '195.158.12.84 (O‘zbekiston, Toshkent)',
    details: params.details,
    status: params.status || 'success',
  };

  // 1. Save in user's specific local log list
  try {
    const userKey = STORAGE_PREFIX + (params.userId || 'general');
    const existing = localStorage.getItem(userKey);
    const parsed: CabinetLogItem[] = existing ? JSON.parse(existing) : [];
    parsed.unshift(logItem);
    // Keep last 150 entries
    if (parsed.length > 150) parsed.length = 150;
    localStorage.setItem(userKey, JSON.stringify(parsed));

    // Also update global app log for admin/diagnostics
    const allKey = STORAGE_PREFIX + 'all';
    const allExisting = localStorage.getItem(allKey);
    const allParsed: CabinetLogItem[] = allExisting ? JSON.parse(allExisting) : [];
    allParsed.unshift(logItem);
    if (allParsed.length > 200) allParsed.length = 200;
    localStorage.setItem(allKey, JSON.stringify(allParsed));
  } catch (err) {
    console.warn('Local log save failed:', err);
  }

  // 2. Try saving to Firestore
  try {
    await setDoc(doc(db, 'cabinet_logs', logItem.id), logItem, { merge: true });
  } catch {
    // If offline or permission denied, local storage persists it
  }

  // 3. Dispatch an event so any open logs viewer updates immediately
  try {
    window.dispatchEvent(new CustomEvent('bunkerstroy_log_recorded', { detail: logItem }));
  } catch {}

  return logItem;
}

export function getLocalCabinetLogs(userId?: string): CabinetLogItem[] {
  try {
    if (userId) {
      const userKey = STORAGE_PREFIX + userId;
      const data = localStorage.getItem(userKey);
      if (data) {
        return JSON.parse(data);
      }
    }
    const allKey = STORAGE_PREFIX + 'all';
    const allData = localStorage.getItem(allKey);
    if (allData) {
      return JSON.parse(allData);
    }
    return [];
  } catch {
    return [];
  }
}
