import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, Matches } from 'class-validator';

export class SendOtpDto {
  @ApiProperty({ description: 'Telefon raqam', example: '998901234567' })
  @IsNotEmpty()
  @IsString()
  phone: string;
}

export class VerifyOtpDto {
  @ApiProperty({ description: 'Telefon raqam', example: '998901234567' })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiProperty({ description: 'SMS orqali kelgan 4-6 xonali kod', example: '7777' })
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiProperty({ description: 'Foydalanuvchi roli', example: 'CUSTOMER', required: false })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiProperty({ description: 'STIR (yuridik shaxslar uchun)', required: false })
  @IsOptional()
  @IsString()
  inn?: string;
}

export class LoginCredentialsDto {
  @ApiProperty({ description: 'Login yoki telefon', example: 'admin' })
  @IsNotEmpty()
  @IsString()
  login: string;

  @ApiProperty({ description: 'Parol', example: 'admin123' })
  @IsNotEmpty()
  @IsString()
  password: string;
}
