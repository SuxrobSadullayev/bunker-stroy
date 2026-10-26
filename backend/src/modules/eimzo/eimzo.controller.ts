import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { EimzoService } from './eimzo.service';
import { CreateChallengeDto, VerifySignatureDto } from './dto/eimzo.dto';

@ApiTags('E-IMZO (Elektron Raqamli Imzo)')
@Controller('api/eimzo')
export class EimzoController {
  constructor(private readonly eimzoService: EimzoService) {}

  @Post('challenge')
  @ApiOperation({ summary: 'E-IMZO imzolash uchun 5 daqiqalik bir martalik challenge olish' })
  @ApiResponse({ status: 201, description: 'Challenge ID va matn' })
  createChallenge(@Body() dto: CreateChallengeDto) {
    return this.eimzoService.createChallenge(dto.inn);
  }

  @Post('verify')
  @ApiOperation({ summary: 'Imzolangan E-IMZO PKCS#7 imzosini tekshirish' })
  @ApiResponse({ status: 200, description: 'Imzo tasdiqlanganligi va sertifikat ma‘lumotlari' })
  verifySignature(@Body() dto: VerifySignatureDto) {
    return this.eimzoService.verifySignature(dto.challengeId, dto.pkcs7Signature, dto.inn);
  }
}
