import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/order.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Orders (Buyurtmalar & Savat)')
@Controller('api/orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Yangi buyurtma rasmiylashtirish (B2C / B2B)' })
  @ApiResponse({ status: 201, description: 'Buyurtma muvaffaqiyatli qabul qilindi' })
  create(@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Barcha buyurtmalar ro‘yxatini olish' })
  @ApiQuery({ name: 'status', required: false, description: 'Status bo‘yicha filtr' })
  findAll(@Query('status') status?: string) {
    return this.ordersService.findAll(status);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Joriy mijozning barcha buyurtmalari' })
  findMyOrders(@CurrentUser('userId') userId: string) {
    return this.ordersService.findAll(undefined, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buyurtma tafsilotlarini ko‘rish' })
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPPLIER', 'ADMIN', 'BUNKER_ADMIN', 'LOGISTICS_DRIVER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Buyurtma statusini o‘zgartirish (ASSIGNED, IN_TRANSIT, DELIVERED)' })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Body('driverPhone') driverPhone?: string,
  ) {
    return this.ordersService.updateStatus(id, status, driverPhone);
  }
}
