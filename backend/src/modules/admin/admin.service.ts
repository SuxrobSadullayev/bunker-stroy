import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  private mockLogs: any[] = [
    {
      id: 'log-1',
      actor: 'bunkeradmin',
      action: 'LOGIN',
      category: 'AUTH',
      details: 'Super Admin tizimga kirdi',
      ip: '127.0.0.1',
      level: 'info',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'log-2',
      actor: 'admin',
      action: 'UPDATE_COMMISSION',
      category: 'SUPPLIER',
      details: '«QIZILQUM SEMENT» komissiyasi 5% ga belgilandi',
      ip: '127.0.0.1',
      level: 'info',
      createdAt: new Date().toISOString(),
    },
  ];

  constructor(private readonly prisma: PrismaService) {}

  async getPlatformStats() {
    return {
      success: true,
      timestamp: new Date().toISOString(),
      platform: 'BunkerStroy Enterprise',
      stats: {
        totalProducts: 3,
        totalOrdersCount: 24,
        totalRevenueSum: 785000000,
        bunkerCommissionEarned: 39250000,
        activeSuppliersCount: 2,
        activeLogisticsVehicles: 3,
        systemStatus: 'ONLINE_OPTIMAL',
      },
    };
  }

  async getAuditLogs() {
    try {
      const dbLogs = await this.prisma.auditLog.findMany({
        take: 50,
        orderBy: { createdAt: 'desc' },
      });
      if (dbLogs.length > 0) return dbLogs;
    } catch {}

    return this.mockLogs;
  }
}
