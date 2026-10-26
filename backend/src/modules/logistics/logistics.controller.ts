import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { LogisticsService } from './logistics.service';

@ApiTags('Logistics Hub (Maxsus texnika & Yetkazib berish)')
@Controller('api/logistics')
export class LogisticsController {
  constructor(private readonly logisticsService: LogisticsService) {}

  @Get('vehicles')
  @ApiOperation({ summary: 'Mavjud maxsus texnikalar ro‘yxati (Samosval, Avtokran, Mikser va h.k.)' })
  @ApiQuery({ name: 'type', required: false, description: 'Texnika turi (SAMOSVAL, AVTOKRAN, MIKSER)' })
  findAllVehicles(@Query('type') type?: string) {
    return this.logisticsService.findAllVehicles(type);
  }

  @Get('calculate')
  @ApiOperation({ summary: 'Masofa bo‘yicha yetkazib berish narxini hisoblash' })
  @ApiQuery({ name: 'distanceKm', example: 25 })
  @ApiQuery({ name: 'vehicleType', example: 'SAMOSVAL' })
  calculateCost(
    @Query('distanceKm') distanceKm: number,
    @Query('vehicleType') vehicleType: string,
  ) {
    return this.logisticsService.calculateCost(Number(distanceKm) || 10, vehicleType || 'SAMOSVAL');
  }
}
