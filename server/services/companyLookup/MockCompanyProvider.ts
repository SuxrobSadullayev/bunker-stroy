import { ICompanyLookupService } from './ICompanyLookupService';
import { CompanyInfo, CompanyLookupResult } from '../../types/company';

/**
 * MockCompanyProvider
 * O'zbekiston yuridik shaxslari bo'yicha test ma'lumotlari bilan ishlaydi.
 * Keyinchalik haqiqiy Soliq API yoki My.gov.uz API ulanishi uchun
 * provayder arxitekturasi tayyorlangan.
 */
export class MockCompanyProvider implements ICompanyLookupService {
  private testCompanies: Map<string, CompanyInfo> = new Map();

  constructor() {
    this.seedMockCompanies();
  }

  private seedMockCompanies(): void {
    // 1. Faol MChJ - Qurilish sohasi (BunkerStroy Hamkori)
    this.testCompanies.set('201122334', {
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

    // 2. Faol MChJ - G'isht va beton ishlab chiqarish
    this.testCompanies.set('305566778', {
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

    // 3. Faol QK MChJ - Sement sanoati
    this.testCompanies.set('123456789', {
      inn: '123456789',
      companyName: '«SAMARQAND CEMENT INDUSTRY» QK MChJ',
      shortName: 'SAMARQAND CEMENT INDUSTRY',
      status: 'active',
      statusDescription: 'Faoliyat ko‘rsatmoqda (Faol)',
      director: 'Mirzayev Ulug‘bek Shavkatovich',
      address: 'Samarqand viloyati, Pastdarg‘om tumani, Sanoat zonasi',
      region: 'Samarqand viloyati',
      district: 'Pastdarg‘om tumani',
      registrationDate: '2018-11-05',
      activityType: '23.51.0 — Sement ishlab chiqarish',
      vatPayer: true,
    });

    // 4. Faol MChJ - Logistika va transport
    this.testCompanies.set('987654321', {
      inn: '987654321',
      companyName: '«VODIY LOGISTIKA TRANS» MChJ',
      shortName: 'VODIY LOGISTIKA TRANS',
      status: 'active',
      statusDescription: 'Faoliyat ko‘rsatmoqda (Faol)',
      director: 'Rahimov Alisher Baxtiyorovich',
      address: 'Farg‘ona viloyati, Qo‘qon shahri, Shoxruxobod ko‘chasi, 45',
      region: 'Farg‘ona viloyati',
      district: 'Qo‘qon shahri',
      registrationDate: '2022-02-10',
      activityType: '49.41.0 — Avtomobil transportida yuk tashish xizmatlari',
      vatPayer: false,
    });

    // 5. Tugatilgan (Likvidatsiya qilingan) MChJ - TEST UCHUN
    this.testCompanies.set('209999999', {
      inn: '209999999',
      companyName: '«ESKI QURILISH INVEST» MChJ',
      shortName: 'ESKI QURILISH INVEST',
      status: 'liquidated',
      statusDescription: 'Tugatilgan (Faoliyati to‘xtatilgan va davlat reyestridan chiqarilgan)',
      director: 'Sodiqov Bobur Murodovich',
      address: 'Toshkent shahri, Chilonzor tumani, 9-mavze',
      region: 'Toshkent shahri',
      district: 'Chilonzor tumani',
      registrationDate: '2015-06-12',
      activityType: '41.20.0 — Qurilish',
      vatPayer: false,
    });

    // 6. Vaqtincha faoliyati to'xtatilgan MChJ - TEST UCHUN
    this.testCompanies.set('208888888', {
      inn: '208888888',
      companyName: '«TO‘XTATILGAN SERVIS TRANS» MChJ',
      shortName: 'TO‘XTATILGAN SERVIS TRANS',
      status: 'suspended',
      statusDescription: 'Vaqtincha faoliyati to‘xtatilgan',
      director: 'Usmonov Otabek Erkinovich',
      address: 'Buxoro viloyati, Buxoro shahri, Mustaqillik shoh ko‘chasi',
      region: 'Buxoro viloyati',
      district: 'Buxoro shahri',
      registrationDate: '2017-09-01',
      activityType: '45.20.0 — Avtotransport vositalarini ta’mirlash',
      vatPayer: false,
    });
  }

  async lookupByStir(inn: string): Promise<CompanyLookupResult> {
    // Tarmoq kechikishini simulyatsiya qilish (50ms)
    await new Promise((resolve) => setTimeout(resolve, 50));

    // STIR: 200000000 - Tashqi Soliq/Reyestr API xatosini simulyatsiya qilish
    if (inn === '200000000') {
      return {
        success: false,
        errorCode: 'UPSTREAM_ERROR',
        error: "Davlat soliq qo‘mitasi va yuridik shaxslar reyestri xizmati bilan vaqtincha aloqa o‘rnatib bo‘lmadi (503 Service Unavailable). Keyinroq qayta urinib ko‘ring.",
      };
    }

    const company = this.testCompanies.get(inn);

    if (!company) {
      return {
        success: false,
        errorCode: 'NOT_FOUND',
        error: `STIR: ${inn} bo‘yicha O‘zbekiston yuridik shaxslar davlat reyestridan ma’lumot topilmadi. STIR raqamini tekshirib qayta kiriting.`,
      };
    }

    return {
      success: true,
      data: company,
    };
  }
}
