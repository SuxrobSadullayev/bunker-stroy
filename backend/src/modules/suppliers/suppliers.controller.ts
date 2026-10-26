import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SuppliersService } from './suppliers.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Suppliers (Yetkazib beruvchilar kabineti)')
@Controller('api/suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get()
  @ApiOperation({ summary: 'Barcha yetkazib beruvchilar va ishlab chiqaruvchilar ro‘yxati' })
  findAll() {
    return this.suppliersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Bitta ta‘minotchi profili va mahsulotlari' })
  findOne(@Param('id') id: string) {
    return this.suppliersService.findOne(id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Ta‘minotchi sotuvlari va komissiya statistikasi' })
  getStats(@Param('id') id: string) {
    return this.suppliersService.getStats(id);
  }

  @Patch(':id/commission')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'BUNKER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ta‘minotchi komissiya stavkasini o‘zgartirish (Admin)' })
  updateCommission(
    @Param('id') id: string,
    @Body('rate') rate: number,
    @Body('basis') basis?: 'total' | 'profit',
  ) {
    return this.suppliersService.updateCommission(id, rate, basis);
  }
}
