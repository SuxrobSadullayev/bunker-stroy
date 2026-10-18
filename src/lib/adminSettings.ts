export interface AdminConfig {
  login: string;
  password: string;
  logoUrl: string | null;
  telegram: string;
  instagram: string;
  phone: string;
}

const DEFAULT_CONFIG: AdminConfig = {
  login: 'AA',
  password: 'A',
  logoUrl: null,
  telegram: '@bunkerstroy_uz',
  instagram: '@bunkerstroy_official',
  phone: '+998 (71) 200-00-50',
};

const STORAGE_KEY = 'bunkerstroy_admin_config';

export function getAdminConfig(): AdminConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const isOldLogin = !parsed.login || parsed.login === 'Admin' || parsed.login === 'admin' || parsed.login === 'Yelenabe';
      const loginVal = isOldLogin ? DEFAULT_CONFIG.login : parsed.login;
      const isOldPassword = !parsed.password || parsed.password === 'Aquarius.102' || parsed.password === '12345';
      const passwordVal = isOldPassword ? DEFAULT_CONFIG.password : parsed.password;
      return {
        login: loginVal,
        password: passwordVal,
        logoUrl: parsed.logoUrl !== undefined ? parsed.logoUrl : DEFAULT_CONFIG.logoUrl,
        telegram: parsed.telegram !== undefined ? parsed.telegram : DEFAULT_CONFIG.telegram,
        instagram: parsed.instagram !== undefined ? parsed.instagram : DEFAULT_CONFIG.instagram,
        phone: parsed.phone !== undefined ? parsed.phone : DEFAULT_CONFIG.phone,
      };
    }
  } catch {}
  return { ...DEFAULT_CONFIG };
}

export function saveAdminConfig(config: AdminConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    window.dispatchEvent(new CustomEvent('bunkerstroy_admin_config_updated', { detail: config }));
  } catch (e) {
    console.error('Failed to save admin config to localStorage:', e);
  }
}
