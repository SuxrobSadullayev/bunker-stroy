import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LogisticsService {
  private mockVehicles: any[] = [
    {
      id: 'veh-1',
      type: 'SAMOSVAL',
      model: 'KamAZ 6520 (20 tonna)',
      plateNumber: '01 A 777 BA',
      capacity: '20 tonna / 16 m³',
      driverName: 'Rustam Jo‘rayev',
      driverPhone: '998901112233',
      region: 'Toshkent shahri va viloyati',
      status: 'available',
      basePricePerKm: 18000,
    },
    {
      id: 'veh-2',
      type: 'AVTOKRAN',
      model: 'XCMG QY25K5 (25 tonna)',
      plateNumber: '01 B 888 BB',
      capacity: '25 tonna / 38 metr strela',
      driverName: 'Alisher Qodirov',
      driverPhone: '998902223344',
      region: 'Toshkent shahri',
      status: 'available',
      basePricePerKm: 25000,
    },
    {
      id: 'veh-3',
      type: 'MIKSER',
      model: 'HOWO Beton qorgich (10 m³)',
      plateNumber: '10 C 999 CC',
      capacity: '10 m³ beton',
      driverName: 'Shavkat Karimov',
      driverPhone: '998903334455',
      region: 'Toshkent viloyati',
      status: 'available',
      basePricePerKm: 22000,
    },
  ];

  constructor(private readonly prisma: PrismaService) {}

  async findAllVehicles(type?: string) {
    try {
      const where: any = {};
      if (type) where.type = type.toUpperCase();
      const list = await this.prisma.logisticsVehicle.findMany({ where });
      if (list.length > 0) return list;
    } catch {}

    let res = [...this.mockVehicles];
    if (type) res = res.filter((v) => v.type.toLowerCase() === type.toLowerCase());
    return res;
  }

  async calculateCost(distanceKm: number, vehicleType: string) {
    const rateMap: Record<string, number> = {
      SAMOSVAL: 18000,
      AVTOKRAN: 25000,
      MIKSER: 22000,
      MANIPULYATOR: 20000,
      GAZEL: 12000,
    };
    const rate = rateMap[vehicleType.toUpperCase()] || 18000;
    const baseSum = 150000; // Minimal chaqiruv
    const total = baseSum + distanceKm * rate;

    return {
      vehicleType,
      distanceKm,
      baseSum,
      ratePerKm: rate,
      totalCost: total,
    };
  }
}
