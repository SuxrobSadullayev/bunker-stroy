import { AdminPermissionSection, SubAdminCabinetAccount } from '../types';

export interface AdminConfig {
  login: string;
  password: string;
  credentialsUpdatedByAdmin?: boolean;
  logoUrl: string | null;
  telegram: string;
  telegram2?: string;
  instagram: string;
  youtube?: string;
  phone: string;
}

export interface BunkerAdminCredentials {
  login: string;
  password: string;
}

// Alohida Bunker Admin standart kirish ma'lumotlari (Login: ADMIN, Parol: BUNKER)
export const BUNKER_ADMIN_CREDENTIALS: BunkerAdminCredentials = {
  login: 'ADMIN',
  password: 'BUNKER',
};

const BUNKER_ADMIN_STORAGE_KEY = 'bunkerstroy_bunker_admin_creds_v1';

export function getBunkerAdminCredentials(): BunkerAdminCredentials {
  try {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(BUNKER_ADMIN_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const login = typeof parsed?.login === 'string' ? parsed.login.trim() : '';
        const password = typeof parsed?.password === 'string' ? parsed.password.trim() : '';
        if (login && password) {
          return { login, password };
        }
      }
    }
  } catch {}
  return { ...BUNKER_ADMIN_CREDENTIALS };
}

export function saveBunkerAdminCredentials(creds: BunkerAdminCredentials): void {
  try {
    const next: BunkerAdminCredentials = {
      login: (creds.login || BUNKER_ADMIN_CREDENTIALS.login).trim(),
      password: (creds.password || BUNKER_ADMIN_CREDENTIALS.password).trim(),
    };
    localStorage.setItem(BUNKER_ADMIN_STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent('bunkerstroy_bunker_admin_updated', { detail: next }));
  } catch (e) {
    console.error('Failed to save bunker admin credentials:', e);
  }
}

// Hozirgi mavjud Bosh Admin standart kirish ma'lumotlari (Login: ADMIN., Parol: ADMIN.)
const DEFAULT_CONFIG: AdminConfig = {
  login: 'ADMIN.',
  password: 'ADMIN.',
  credentialsUpdatedByAdmin: false,
  logoUrl: null,
  telegram: '@bunkerstroy_uz',
  telegram2: '@bunkerstroy_uz',
  instagram: '@bunkerstroy_official',
  youtube: '@bunkerstroy',
  phone: '+998 (71) 200-00-50',
};

const STORAGE_KEY = 'bunkerstroy_single_admin_config_v2';
const LEGACY_STORAGE_KEY = 'bunkerstroy_admin_config';
const SUB_ADMINS_STORAGE_KEY = 'bunkerstroy_sub_admins_v1';

// Har bir tasdiqlash talab qiladigan jarayon uchun parol
export const ADMIN_CONFIRMATION_PASSWORD = 'ADMIN.';

export const ADMIN_PERMISSION_META: {
  id: AdminPermissionSection;
  label: string;
  shortLabel: string;
  description: string;
}[] = [
  {
    id: 'reports',
    label: 'Monitoring, hisobot',
    shortLabel: 'Monitoring, hisobot',
    description: 'Hozirgi mavjud admindagi Monitoring, hisobot va moliyaviy tahlil bo‘limi',
  },
  {
    id: 'suppliers',
    label: "Ta'minotchi B2B2C Kuzatuvi",
    shortLabel: "Ta'minotchi B2B2C Hamkorlar",
    description: "Ta'minotchi B2B2C Hamkorlar bo‘limida B2B va B2C kabinetlar bilan ishlash",
  },
  {
    id: 'requests_customers',
    label: "So'rov va Mijozlar",
    shortLabel: "So'rov va Mijozlar",
    description: "So'rov va mijozlar bo‘limida buyurtmalar, qidiruvlar va mijozlar bilan ishlash",
  },
  {
    id: 'b2b_crm',
    label: 'B2B CRM',
    shortLabel: 'B2B CRM',
    description: "B2B (Ishlab chiqaruvchi) ta'minotchilar CRM savdolari, ombor qoldig‘i va B2B so‘rovlari",
  },
  {
    id: 'b2c_crm',
    label: 'B2C CRM',
    shortLabel: 'B2C CRM',
    description: "B2C (Hamkor) ta'minotchilar CRM savdolari, ombor qoldig‘i va kirim-chiqim hisoboti",
  },
];

export function getAdminConfig(): AdminConfig {
  try {
    if (typeof window !== 'undefined' && localStorage.getItem(LEGACY_STORAGE_KEY)) {
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const hasCustomChanged = Boolean(parsed.credentialsUpdatedByAdmin);
      const rawLogin = typeof parsed.login === 'string' ? parsed.login.trim() : '';
      const rawPass = typeof parsed.password === 'string' ? parsed.password.trim() : '';

      const isForbiddenLegacy =
        !rawLogin ||
        !rawPass ||
        rawLogin.toLowerCase() === 'yelenabe' ||
        rawLogin.toLowerCase() === 'aaaa' ||
        rawLogin === 'AA' ||
        rawLogin.toLowerCase() === 'super' ||
        rawLogin.toLowerCase() === 'superadmin';

      const loginVal = hasCustomChanged && !isForbiddenLegacy ? rawLogin : DEFAULT_CONFIG.login;
      const passwordVal = hasCustomChanged && !isForbiddenLegacy ? rawPass : DEFAULT_CONFIG.password;

      return {
        login: loginVal,
        password: passwordVal,
        credentialsUpdatedByAdmin: hasCustomChanged && !isForbiddenLegacy,
        logoUrl: parsed.logoUrl !== undefined ? parsed.logoUrl : DEFAULT_CONFIG.logoUrl,
        telegram: parsed.telegram !== undefined ? parsed.telegram : DEFAULT_CONFIG.telegram,
        telegram2: parsed.telegram2 !== undefined ? parsed.telegram2 : (parsed.telegram || DEFAULT_CONFIG.telegram2),
        instagram: parsed.instagram !== undefined ? parsed.instagram : DEFAULT_CONFIG.instagram,
        youtube: parsed.youtube !== undefined ? parsed.youtube : DEFAULT_CONFIG.youtube,
        phone: parsed.phone !== undefined ? parsed.phone : DEFAULT_CONFIG.phone,
      };
    }
  } catch {}
  return { ...DEFAULT_CONFIG };
}

export function saveAdminConfig(config: AdminConfig): void {
  try {
    const nextConfig: AdminConfig = {
      ...config,
      login: (config.login || DEFAULT_CONFIG.login).trim(),
      password: (config.password || DEFAULT_CONFIG.password).trim(),
      credentialsUpdatedByAdmin: true,
    };
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextConfig));
    window.dispatchEvent(new CustomEvent('bunkerstroy_admin_config_updated', { detail: nextConfig }));
  } catch (e) {
    console.error('Failed to save admin config to localStorage:', e);
  }
}

export function getSubAdmins(): SubAdminCabinetAccount[] {
  try {
    const raw = localStorage.getItem(SUB_ADMINS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (item: SubAdminCabinetAccount) =>
            item &&
            typeof item.id === 'string' &&
            typeof item.login === 'string' &&
            typeof item.password === 'string' &&
            Array.isArray(item.permissions)
        );
      }
    }
  } catch {}
  return [];
}

export function saveSubAdmins(list: SubAdminCabinetAccount[]): void {
  try {
    localStorage.setItem(SUB_ADMINS_STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('bunkerstroy_sub_admins_updated', { detail: list }));
  } catch (e) {
    console.error('Failed to save sub-admins to localStorage:', e);
  }
}
