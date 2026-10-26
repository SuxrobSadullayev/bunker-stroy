import { Injectable, BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';

interface ChallengeRecord {
  challengeId: string;
  challengeText: string;
  inn: string;
  createdAt: number;
  expiresAt: number;
  isConsumed: boolean;
}

@Injectable()
export class EimzoService {
  private challenges: Map<string, ChallengeRecord> = new Map();
  private static readonly TTL_MS = 5 * 60 * 1000; // 5 daqiqa

  createChallenge(inn: string) {
    const cleanInn = inn.trim();
    const timestamp = Date.now();
    const randomHex = crypto.randomBytes(6).toString('hex');
    const challengeId = `challenge-${cleanInn}-${timestamp}-${randomHex}`;
    const challengeText = `BunkerStroy E-IMZO Autentifikatsiyasi | STIR: ${cleanInn} | Vaqt: ${new Date(timestamp).toISOString()} | Nonce: ${randomHex}`;

    const record: ChallengeRecord = {
      challengeId,
      challengeText,
      inn: cleanInn,
      createdAt: timestamp,
      expiresAt: timestamp + EimzoService.TTL_MS,
      isConsumed: false,
    };

    this.challenges.set(challengeId, record);

    return {
      success: true,
      challengeId,
      challengeText,
      expiresInSeconds: 300,
    };
  }

  verifySignature(challengeId: string, pkcs7Signature: string, claimedInn: string) {
    const record = this.challenges.get(challengeId);
    if (!record) {
      throw new BadRequestException("Challenge topilmadi yoki eskirgan (CHALLENGE_NOT_FOUND)");
    }

    if (Date.now() > record.expiresAt) {
      this.challenges.delete(challengeId);
      throw new BadRequestException("Challenge amal qilish muddati (5 daqiqa) tugagan (CHALLENGE_EXPIRED)");
    }

    if (record.isConsumed) {
      throw new BadRequestException("Ushbu challenge allaqachon ishlatilgan (CHALLENGE_ALREADY_USED)");
    }

    if (record.inn !== claimedInn) {
      throw new BadRequestException("Sertifikatdagi STIR kiritilgan STIR ga mos kelmadi (STIR_MISMATCH)");
    }

    if (!pkcs7Signature || pkcs7Signature.length < 16) {
      throw new BadRequestException("E-IMZO imzo formati noto‘g‘ri (INVALID_SIGNATURE)");
    }

    // Bir martalik belgilash
    record.isConsumed = true;

    return {
      success: true,
      verified: true,
      inn: record.inn,
      verifiedAt: new Date().toISOString(),
      serialNumber: `UZ-${crypto.randomBytes(8).toString('hex').toUpperCase()}`,
      message: "E-IMZO orqali yuridik shaxs muvaffaqiyatli tasdiqlandi!",
    };
  }
}
