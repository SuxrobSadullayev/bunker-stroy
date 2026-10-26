import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsArray, IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class OrderItemDto {
  @ApiProperty({ example: 'prod-sement-m500' })
  @IsNotEmpty()
  @IsString()
  productId: string;

  @ApiProperty({ example: 'Sement M500 D0' })
  @IsNotEmpty()
  @IsString()
  productTitle: string;

  @ApiProperty({ example: 'Sement' })
  @IsNotEmpty()
  @IsString()
  category: string;

  @ApiProperty({ example: 2 })
  @IsNotEmpty()
  @IsNumber()
  quantity: number;

  @ApiProperty({ example: 'tonna' })
  @IsNotEmpty()
  @IsString()
  unit: string;

  @ApiProperty({ example: 920000 })
  @IsNotEmpty()
  @IsNumber()
  price: number;
}

export class CreateOrderDto {
  @ApiProperty({ description: 'Xaridor ismi', example: 'Bobur Mirzayev' })
  @IsNotEmpty()
  @IsString()
  customerName: string;

  @ApiProperty({ description: 'Telefon raqam', example: '998901234567' })
  @IsNotEmpty()
  @IsString()
  customerPhone: string;

  @ApiProperty({ description: 'Yetkazib berish manzili', example: 'Toshkent sh., Yunusobod 4-mavze' })
  @IsNotEmpty()
  @IsString()
  deliveryAddress: string;

  @ApiProperty({ description: 'Viloyat / Hudud', example: 'Toshkent shahri', required: false })
  @IsOptional()
  @IsString()
  deliveryRegion?: string;

  @ApiProperty({ description: 'Buyurtma turi', example: 'B2C', required: false })
  @IsOptional()
  @IsString()
  orderType?: 'B2C' | 'B2B';

  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiProperty({ description: 'Qo‘shimcha izoh', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
