import { SupplierSaleItem, SupplierReturnItem, SupplierLogisticsRoute } from '../types';

export interface SupplierDetailedReport {
  supplierId: string;
  companyName: string;
  responsiblePerson: string;
  phone: string;
  region: string;
  contractNumber: string;
  sales: SupplierSaleItem[];
  returns: SupplierReturnItem[];
  routes: SupplierLogisticsRoute[];
}

export const getSupplierReport = (
  companyName: string,
  personName: string,
  region: string,
  phone: string,
  contractNum: string
): SupplierDetailedReport => {
  return {
    supplierId: companyName.toLowerCase().replace(/\s+/g, '_'),
    companyName: companyName,
    responsiblePerson: personName,
    phone: phone,
    region: region,
    contractNumber: contractNum || 'Shartnoma kiritilmagan',
    sales: [
      {
        id: 'sale-1',
        productTitle: 'Kardon 12mm (Namlikka chidamli)',
        category: 'Kardon',
        quantity: 450,
        unit: 'dona',
        price: 68000,
        totalSum: 30600000,
        buyerName: '«Modern Stroy» MChJ',
        buyerPhone: '+998 90 321 00 11',
        date: '2026-10-11 14:20',
        status: 'delivered',
      },
      {
        id: 'sale-2',
        productTitle: 'M500 Sement (Qora qop, 50kg)',
        category: 'Sement va qorishmalar',
        quantity: 280,
        unit: 'qop (50kg)',
        price: 65000,
        totalSum: 18200000,
        buyerName: 'Yunusobod Turar-joy Bosh Pudrati',
        buyerPhone: '+998 97 777 88 99',
        date: '2026-10-10 09:15',
        status: 'delivered',
      },
      {
        id: 'sale-3',
        productTitle: 'G‘isht pishgan standart M150',
        category: 'Gisht va bloklar',
        quantity: 12000,
        unit: 'dona',
        price: 1800,
        totalSum: 21600000,
        buyerName: 'Chilonzor Kottej Majmuasi',
        buyerPhone: '+998 93 456 12 34',
        date: '2026-10-09 16:40',
        status: 'delivered',
      },
      {
        id: 'sale-4',
        productTitle: 'Penoplast 50mm fasad izolyatsiyasi',
        category: 'Izolyatsiya va tom',
        quantity: 320,
        unit: 'm²',
        price: 24000,
        totalSum: 7680000,
        buyerName: '«Eco Stroy Servis» MChJ',
        buyerPhone: '+998 99 888 12 00',
        date: '2026-10-08 11:10',
        status: 'delivered',
      },
    ],
    returns: [
      {
        id: 'ret-1',
        productTitle: 'Kardon 12mm (Namlikka chidamli)',
        quantity: 20,
        unit: 'dona',
        totalSum: 1360000,
        reason: 'Ob’ektda ortiqcha hajm bo‘lib qoldi, qadoq butun holatda qaytarildi',
        date: '2026-10-12 11:00',
        status: 'returned',
      },
      {
        id: 'ret-2',
        productTitle: 'Penoplast 50mm fasad izolyatsiyasi',
        quantity: 15,
        unit: 'm²',
        totalSum: 360000,
        reason: 'Loyiha o‘zgarishi sababli qalinligi boshqa o‘lchamga almashtirildi',
        date: '2026-10-10 16:30',
        status: 'processed',
      },
    ],
    routes: [
      {
        id: 'rt-1',
        fromLocation: `${region}, ${companyName} bosh ombori`,
        toLocation: 'Toshkent shahri, Olmazor tumani, Qorasaroy 12-uy',
        productTitle: 'Kardon 12mm - 450 dona',
        quantityText: '450 dona (15.2 tonna)',
        driverName: 'Dilshod Karimov',
        driverPhone: '+998 93 987 65 43',
        vehicle: 'ISUZU Kran-Manipulyator (01 A 777 BA)',
        status: 'delivered',
        deliveredAt: '2026-10-11 17:30',
      },
      {
        id: 'rt-2',
        fromLocation: `${region}, ${companyName} ishlab chiqarish bazasi`,
        toLocation: 'Toshkent viloyati, Zangiota tumani, Qurilish majmuasi 4-bino',
        productTitle: 'M500 Sement - 280 qop',
        quantityText: '280 qop (14 tonna)',
        driverName: 'Sherzodbek Rahimov',
        driverPhone: '+998 90 123 45 67',
        vehicle: 'KAMAZ 6520 Samosval (01 B 123 AA)',
        status: 'delivered',
        deliveredAt: '2026-10-10 13:45',
      },
      {
        id: 'rt-3',
        fromLocation: `${region}, ${companyName} bazasi`,
        toLocation: 'Jizzax shahri, Yangi shahar massivi 8-bino',
        productTitle: 'Penoplast fasad - 320 m²',
        quantityText: '320 m² (1.8 tonna)',
        driverName: 'Farrux Olimov',
        driverPhone: '+998 99 444 33 22',
        vehicle: 'Gazel Next Bortli (01 C 456 BB)',
        status: 'delivered',
        deliveredAt: '2026-10-09 18:20',
      },
    ],
  };
};
