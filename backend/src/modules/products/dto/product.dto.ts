import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ description: 'Mahsulot nomi', example: 'Sement M500 D0 (Qashqadaryo)' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ description: 'Kategoriya', example: 'Sement va qorishmalar' })
  @IsNotEmpty()
  @IsString()
  category: string;

  @ApiProperty({ description: 'Sotish narxi (so‘mda)', example: 950000 })
  @IsNotEmpty()
  @IsNumber()
  price: number;

  @ApiProperty({ description: 'Tannarx (cost price)', example: 850000, required: false })
  @IsOptional()
  @IsNumber()
  costPrice?: number;

  @ApiProperty({ description: 'Ombor qoldig‘i', example: 120 })
  @IsNotEmpty()
  @IsNumber()
  stock: number;

  @ApiProperty({ description: 'O‘lchov birligi', example: 'tonna' })
  @IsNotEmpty()
  @IsString()
  unit: string;

  @ApiProperty({ description: 'Minimal buyurtma miqdori', example: 1, required: false })
  @IsOptional()
  @IsNumber()
  minOrder?: number;

  @ApiProperty({ description: 'Ta‘minotchi IDsi', example: 'supp-101', required: false })
  @IsOptional()
  @IsString()
  supplierId?: string;

  @ApiProperty({ description: 'Tavsif', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateProductDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  stock?: number;
}
