import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SendSmsDto {
  @ApiProperty({ description: 'Qabul qiluvchi telefon raqami (masalan: 998901234567)', example: '998901234567' })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiProperty({ description: 'SMS xabari yoki tasdiqlash kodi', example: '123456' })
  @IsNotEmpty()
  @IsString()
  code: string;
}
