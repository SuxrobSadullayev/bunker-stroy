import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/order.dto';

@Injectable()
export class OrdersService {
  private mockOrders: any[] = [];

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateOrderDto, customerId?: string) {
    const orderNumber = `BS-${Math.floor(100000 + Math.random() * 900000)}`;
    const totalSum = dto.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    // Standart Bunker komissiyasi: 5%
    const commissionSum = Math.round(totalSum * 0.05);
    const netSum = totalSum - commissionSum;

    try {
      return await this.prisma.order.create({
        data: {
          orderNumber,
          customerId: customerId || null,
          orderType: (dto.orderType as any) || 'B2C',
          status: 'PENDING',
          totalSum,
          commissionSum,
          netSum,
          customerName: dto.customerName,
          customerPhone: dto.customerPhone,
          deliveryAddress: dto.deliveryAddress,
          deliveryRegion: dto.deliveryRegion || null,
          notes: dto.notes || null,
          items: {
            create: dto.items.map((i) => ({
              productId: i.productId,
              productTitle: i.productTitle,
              category: i.category,
              quantity: i.quantity,
              unit: i.unit,
              price: i.price,
              totalSum: i.price * i.quantity,
            })),
          },
        },
        include: { items: true },
      });
    } catch {
      // In-memory fallback
      const order = {
        id: `ord-${Date.now()}`,
        orderNumber,
        customerId: customerId || 'guest',
        orderType: dto.orderType || 'B2C',
        status: 'PENDING',
        totalSum,
        commissionSum,
        netSum,
        customerName: dto.customerName,
        customerPhone: dto.customerPhone,
        deliveryAddress: dto.deliveryAddress,
        deliveryRegion: dto.deliveryRegion || 'Toshkent',
        items: dto.items,
        createdAt: new Date().toISOString(),
      };
      this.mockOrders.unshift(order);
      return order;
    }
  }

  async findAll(status?: string, customerId?: string) {
    try {
      const where: any = {};
      if (status) where.status = status;
      if (customerId) where.customerId = customerId;
      const dbOrders = await this.prisma.order.findMany({
        where,
        include: { items: true },
        orderBy: { createdAt: 'desc' },
      });
      if (dbOrders.length > 0) return dbOrders;
    } catch {}

    let res = [...this.mockOrders];
    if (status) res = res.filter((o) => o.status === status);
    if (customerId) res = res.filter((o) => o.customerId === customerId);
    return res;
  }

  async findOne(id: string) {
    try {
      const o = await this.prisma.order.findUnique({
        where: { id },
        include: { items: true },
      });
      if (o) return o;
    } catch {}

    const found = this.mockOrders.find((o) => o.id === id || o.orderNumber === id);
    if (!found) throw new NotFoundException(`Buyurtma topilmadi (#${id})`);
    return found;
  }

  async updateStatus(id: string, status: string, driverPhone?: string) {
    try {
      return await this.prisma.order.update({
        where: { id },
        data: {
          status: status as any,
          driverPhone: driverPhone || undefined,
        },
      });
    } catch {
      const o = await this.findOne(id);
      o.status = status;
      if (driverPhone) o.driverPhone = driverPhone;
      return o;
    }
  }
}
