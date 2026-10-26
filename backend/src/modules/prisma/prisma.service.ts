import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    // Agar DATABASE_URL ko'rsatilgan bo'lsa ulanadi, aks holda lazy-connect
    try {
      if (process.env.DATABASE_URL) {
        await this.$connect();
      }
    } catch (err) {
      console.warn('Prisma connect warning (DB not initialized yet):', err.message);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
