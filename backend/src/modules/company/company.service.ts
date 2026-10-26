import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';

export interface CompanyData {
  inn: string;
  companyName: string;
  shortName?: string;
  status: 'active' | 'liquidated' | 'suspended';
  statusDescription: string;
  director?: string;
  phone?: string;
  email?: string;
  address?: string;
  region?: string;
  district?: string;
  registrationDate?: string;
  activityType?: string;
  vatPayer?: boolean;
}

@Injectable()
export class CompanyService {
  private inMemoryCache: Map<string, { data: CompanyData; cachedAt: number; expiresAt: number }> = new Map();
  private mockCompanies: Map<string, CompanyData> = new Map();
  private static readonly TTL_MS = 24 * 60 * 60 * 1000; // 24 soat

  constructor() {
    this.seedMockCompanies();
  }

  private seedMockCompanies() {
    this.mockCompanies.set('201122334', {
      inn: '201122334',
      companyName: '«BUNKER STROY INVEST» MChJ',
      shortName: 'BUNKER STROY INVEST',
      status: 'active',
      statusDescription: 'Faoliyat ko‘rsatmoqda (Faol)',
      director: 'Karimov Jasur Bahromovich',
      address: 'Toshkent shahri, Yunusobod tumani, Amir Temur shoh ko‘chasi, 107B',
      region: 'Toshkent shahri',
      district: 'Yunusobod tumani',
      registrationDate: '2021-04-15',
      activityType: '41.20.0 — Turar joy va noturar joy binolarini qurish',
      vatPayer: true,
    });

    this.mockCompanies.set('305566778', {
      inn: '305566778',
      companyName: '«TOSHKENT G\'ISHT SERVIS» MChJ',
      shortName: 'TOSHKENT G\'ISHT SERVIS',
      status: 'active',
      statusDescription: 'Faoliyat ko‘rsatmoqda (Faol)',
      director: 'Xolmatov Dilshod Rustamovich',
      address: 'Toshkent viloyati, Yangiyo‘l tumani, Gulbahor MFY',
      region: 'Toshkent viloyati',
      district: 'Yangiyo‘l tumani',
      registrationDate: '2019-08-20',
      activityType: '23.32.0 — Pishiq g‘isht va koshinlar ishlab chiqarish',
      vatPayer: true,
    });

    this.mockCompanies.set('123456789', {
      inn: '123456789',
      companyName: '«SAMARQAND CEMENT INDUSTRY» QK MChJ',
      shortName: 'SAMARQAND CEMENT INDUSTRY',
      status: 'active',
      statusDescription: 'Faoliyat ko‘rsatmoqda (Faol)',
      director: 'Mirzayev Ulug‘bek Shavkatovich',
      address: 'Samarqand viloyati, Pastdarg‘om tumani, Sanoat zonasi',
      region: 'Samarqand',
      district: 'Pastdarg‘om tumani',
      registrationDate: '2018-11-05',
      activityType: '23.51.0 — Sement ishlab chiqarish',
      vatPayer: true,
    });

    this.mockCompanies.set('209999999', {
      inn: '209999999',
      companyName: '«ESKI ZAVOD STROY» MChJ',
      shortName: 'ESKI ZAVOD STROY',
      status: 'liquidated',
      statusDescription: 'Faoliyati to‘xtatilgan (Tugatilgan)',
      director: 'Toshmatov Botir Aliyevich',
      address: 'Farg‘ona viloyati, Qo‘qon shahri',
      region: 'Farg‘ona',
      registrationDate: '2015-02-10',
      vatPayer: false,
    });
  }

  async lookupByStir(stir: string): Promise<{ success: boolean; data: CompanyData; cached: boolean }> {
    const cleanStir = (stir || '').trim();
    if (!/^\d{9}$/.test(cleanStir)) {
      throw new BadRequestException("STIR noto‘g‘ri formatda. STIR aynan 9 ta raqamdan iborat bo‘lishi shart.");
    }

    // 1. Keshni tekshirish (24 soatlik)
    const cachedEntry = this.inMemoryCache.get(cleanStir);
    if (cachedEntry && Date.now() < cachedEntry.expiresAt) {
      return {
        success: true,
        data: cachedEntry.data,
        cached: true,
      };
    }

    // 2. Mock ma'lumotlar yoki OrgInfo Live
    let found = this.mockCompanies.get(cleanStir);
    if (!found) {
      // Yangi mock korxona (agar bazada bo'lmasa namuna generatsiya)
      found = {
        inn: cleanStir,
        companyName: `«QURILISH SERVIS ${cleanStir.slice(-4)}» MChJ`,
        status: 'active',
        statusDescription: 'Faoliyat ko‘rsatmoqda (Faol)',
        director: 'Saidov Anvar Akramovich',
        address: 'Toshkent shahri, Chilonzor tumani',
        region: 'Toshkent shahri',
        district: 'Chilonzor tumani',
        registrationDate: '2022-01-15',
        activityType: 'Qurilish mollari ulgurji savdosi',
        vatPayer: true,
      };
    }

    // Keshga 24 soatga saqlash
    this.inMemoryCache.set(cleanStir, {
      data: found,
      cachedAt: Date.now(),
      expiresAt: Date.now() + CompanyService.TTL_MS,
    });

    return {
      success: true,
      data: found,
      cached: false,
    };
  }

  getAllActive(): CompanyData[] {
    return Array.from(this.mockCompanies.values()).filter((c) => c.status === 'active');
  }
}
