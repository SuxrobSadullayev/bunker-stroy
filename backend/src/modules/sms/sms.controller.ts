import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SmsService } from './sms.service';
import { SendSmsDto } from './dto/send-sms.dto';

@ApiTags('SMS Gateway (Eskiz.uz)')
@Controller('api/sms')
export class SmsController {
  constructor(private readonly smsService: SmsService) {}

  @Post('send')
  @ApiOperation({ summary: 'Telefon raqamiga OTP tasdiqlash kodini yuborish' })
  @ApiResponse({ status: 200, description: 'SMS yuborilganligi holati' })
  sendSms(@Body() dto: SendSmsDto) {
    return this.smsService.sendVerificationCode(dto.phone, dto.code);
  }
}
