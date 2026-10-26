import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './modules/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { CompanyModule } from './modules/company/company.module';
import { EimzoModule } from './modules/eimzo/eimzo.module';
import { SmsModule } from './modules/sms/sms.module';
import { ProductsModule } from './modules/products/products.module';
import { OrdersModule } from './modules/orders/orders.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { LogisticsModule } from './modules/logistics/logistics.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env'],
    }),
    PrismaModule,
    AuthModule,
    CompanyModule,
    EimzoModule,
    SmsModule,
    ProductsModule,
    OrdersModule,
    SuppliersModule,
    LogisticsModule,
    AdminModule,
  ],
})
export class AppModule {}
