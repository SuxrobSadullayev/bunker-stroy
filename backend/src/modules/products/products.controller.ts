import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Products (Katalog & Ombor)')
@Controller('api/products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Barcha mahsulotlarni olish (filtrlash bilan)' })
  @ApiQuery({ name: 'category', required: false, description: 'Kategoriya bo‘yicha filtr' })
  @ApiQuery({ name: 'search', required: false, description: 'Nomi bo‘yicha qidiruv' })
  findAll(@Query('category') category?: string, @Query('search') search?: string) {
    return this.productsService.findAll(category, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Bitta mahsulot tafsilotlarini olish' })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPPLIER', 'ADMIN', 'BUNKER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Yangi mahsulot qo‘shish (Yetkazib beruvchi / Admin)' })
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPPLIER', 'ADMIN', 'BUNKER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mahsulot ma‘lumotlarini yangilash' })
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'BUNKER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mahsulotni o‘chirish' })
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
