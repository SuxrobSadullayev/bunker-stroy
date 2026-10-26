import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { CompanyService } from './company.service';

@ApiTags('Company (STIR / INN)')
@Controller('api/company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Get('lookup/:stir')
  @ApiOperation({ summary: 'STIR (INN) orqali O‘zbekiston korxonasini tekshirish' })
  @ApiParam({ name: 'stir', description: '9 xonali STIR raqami', example: '201122334' })
  @ApiResponse({ status: 200, description: 'Korxona ma‘lumotlari va 24-soatlik kesh holati' })
  async lookup(@Param('stir') stir: string) {
    return this.companyService.lookupByStir(stir);
  }

  @Get('active-all')
  @ApiOperation({ summary: 'Tizimda mavjud barcha faol qurilish korxonalari' })
  getAllActive() {
    return this.companyService.getAllActive();
  }
}
