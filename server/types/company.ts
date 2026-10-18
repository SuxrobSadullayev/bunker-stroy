/**
 * MChJ va Yuridik shaxslarni tekshirish uchun DTO va interfeyslar
 */

export type CompanyStatus = 'active' | 'liquidated' | 'suspended';

export interface CompanyInfo {
  inn: string; // 9 xonali STIR
  companyName: string; // Tashkilot to'liq nomi (MChJ, QK va h.k.)
  shortName?: string;
  status: CompanyStatus; // 'active' (Faol) | 'liquidated' (Tugatilgan) | 'suspended' (To'xtatilgan)
  statusDescription: string; // O'zbek tilidagi tavsifi
  director?: string; // Rahbar F.I.Sh.
  address?: string; // Yuridik manzil
  region?: string; // Viloyat / Shahar
  district?: string; // Tuman
  registrationDate?: string; // Ro'yxatdan o'tgan sana
  activityType?: string; // Faoliyat yo'nalishi (IFUT / OKED)
  vatPayer?: boolean; // QQS to'lovchisi
}

export interface CompanyLookupResult {
  success: boolean;
  data?: CompanyInfo;
  cached?: boolean;
  cachedAt?: string;
  error?: string;
  errorCode?: 'INVALID_STIR' | 'NOT_FOUND' | 'INACTIVE_COMPANY' | 'RATE_LIMITED' | 'UPSTREAM_ERROR';
}

export type CabinetVerificationStatus = 'pending' | 'verified' | 'rejected';

export interface MchjRegistrationRequest {
  inn: string;
  phone: string;
  companyName?: string;
  directorName?: string;
  login: string;
  password?: string;
  region?: string;
  district?: string;
  mahalla?: string;
  // E-IMZO orqali tasdiqlash ma'lumotlari (ixtiyoriy yoki E-IMZO bosqichida)
  eimzo?: {
    challengeId: string;
    signature: string;
    certificate?: {
      inn?: string;
      serialNumber?: string;
      companyName?: string;
      directorName?: string;
    };
  };
}

export interface MchjRegistrationResponse {
  success: boolean;
  message: string;
  cabinetActivated: boolean;
  verificationStatus: CabinetVerificationStatus; // 'pending' | 'verified' | 'rejected'
  company?: CompanyInfo;
  user?: {
    id: string;
    inn: string;
    companyName: string;
    role: 'legal';
    phone: string;
    verificationStatus: CabinetVerificationStatus;
    eimzoVerifiedAt?: string;
  };
  error?: string;
}
