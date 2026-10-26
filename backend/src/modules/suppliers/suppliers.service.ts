import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SuppliersService {
  private mockSuppliers: any[] = [
    {
      id: 'supp-101',
      companyName: '«QIZILQUM SEMENT SERVIS» MChJ',
      inn: '201122334',
      cabinetType: 'manufacturer',
      rating: 4.9,
      commissionRate: 5.0,
      commissionBasis: 'profit',
      productsCount: 14,
      totalSalesSum: 184500000,
      region: 'Navoiy viloyati',
      phone: '998901234567',
      status: 'active',
    },
    {
      id: 'supp-102',
      companyName: '«O\'ZMETKOMBINAT HAMKOR» MChJ',
      inn: '305566778',
      cabinetType: 'partner',
      rating: 5.0,
      commissionRate: 4.5,
      commissionBasis: 'total',
      productsCount: 8,
      totalSalesSum: 420000000,
      region: 'Toshkent viloyati',
      phone: '998912345678',
      status: 'active',
    },
  ];

  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    try {
      const dbSuppliers = await this.prisma.supplierProfile.findMany({
        include: { user: true },
      });
      if (dbSuppliers.length > 0) return dbSuppliers;
    } catch {}
    return this.mockSuppliers;
  }

  async findOne(id: string) {
    try {
      const s = await this.prisma.supplierProfile.findUnique({
        where: { id },
        include: { products: true },
      });
      if (s) return s;
    } catch {}

    const found = this.mockSuppliers.find((s) => s.id === id || s.inn === id);
    if (!found) throw new NotFoundException(`Ta‘minotchi topilmadi (#${id})`);
    return found;
  }

  async getStats(supplierId: string) {
    const supp = await this.findOne(supplierId);
    return {
      success: true,
      supplierId: supp.id,
      companyName: supp.companyName,
      commissionRate: supp.commissionRate,
      commissionBasis: supp.commissionBasis,
      totalSalesSum: supp.totalSalesSum || 0,
      productsCount: supp.productsCount || 0,
      rating: supp.rating || 5.0,
      bunkerCommissionPaid: Math.round(((supp.totalSalesSum || 0) * (supp.commissionRate || 5)) / 100),
    };
  }

  async updateCommission(supplierId: string, rate: number, basis?: 'total' | 'profit') {
    try {
      return await this.prisma.supplierProfile.update({
        where: { id: supplierId },
        data: {
          commissionRate: rate,
          commissionBasis: basis || 'profit',
        },
      });
    } catch {
      const s = await this.findOne(supplierId);
      s.commissionRate = rate;
      if (basis) s.commissionBasis = basis;
      return s;
    }
  }
}
