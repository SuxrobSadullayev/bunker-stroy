import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class CreateChallengeDto {
  @ApiProperty({ description: 'Tashkilotning 9 xonali STIR (INN) raqami', example: '201122334' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{9}$/, { message: "STIR aynan 9 ta raqamdan iborat bo‘lishi shart" })
  inn: string;
}

export class VerifySignatureDto {
  @ApiProperty({ description: 'Challenge ID (avval olingan)', example: 'challenge-201122334-1710000000-abcd' })
  @IsNotEmpty()
  @IsString()
  challengeId: string;

  @ApiProperty({ description: 'E-IMZO orqali imzolangan PKCS#7 / base64 imzo matni' })
  @IsNotEmpty()
  @IsString()
  pkcs7Signature: string;

  @ApiProperty({ description: 'Foydalanuvchi sertifikatidagi STIR (INN)', example: '201122334' })
  @IsNotEmpty()
  @IsString()
  inn: string;
}
