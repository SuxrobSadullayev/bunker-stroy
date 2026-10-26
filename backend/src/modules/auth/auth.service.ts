import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SmsService } from '../sms/sms.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  // In-memory OTP storage (production da Redis ishlatiladi)
  private otpCodes: Map<string, { code: string; expiresAt: number }> = new Map();

  constructor(
    private readonly jwtService: JwtService,
    private readonly smsService: SmsService,
    private readonly prisma: PrismaService,
  ) {}

  async sendOtp(phone: string) {
    const cleanPhone = phone.replace(/\D/g, '');
    const code = Math.floor(1000 + Math.random() * 9000).toString(); // 4 xonali kod

    this.otpCodes.set(cleanPhone, {
      code,
      expiresAt: Date.now() + 3 * 60 * 1000, // 3 daqiqa
    });

    const smsResult = await this.smsService.sendVerificationCode(cleanPhone, code);

    return {
      success: true,
      phone: cleanPhone,
      message: 'Tasdiqlash kodi yuborildi',
      smsDetails: smsResult,
      // Development rejimida qulaylik uchun:
      debugCode: process.env.NODE_ENV !== 'production' ? code : undefined,
    };
  }

  async verifyOtp(phone: string, inputCode: string, role?: string, inn?: string) {
    const cleanPhone = phone.replace(/\D/g, '');
    const stored = this.otpCodes.get(cleanPhone);

    // Test yoki demo parollar (masalan: 7777 yoki haqiqiy yuborilgan kod)
    const isValid = (stored && stored.code === inputCode && Date.now() <= stored.expiresAt) || inputCode === '7777';

    if (!isValid) {
      throw new BadRequestException("Kiritilgan SMS tasdiqlash kodi noto‘g‘ri yoki muddati tugagan.");
    }

    this.otpCodes.delete(cleanPhone);

    const userRole = (role || 'CUSTOMER').toUpperCase();
    let userRecord: any = null;

    try {
      userRecord = await this.prisma.user.findUnique({
        where: { phone: cleanPhone },
      });

      if (!userRecord) {
        userRecord = await this.prisma.user.create({
          data: {
            phone: cleanPhone,
            role: userRole as any,
            inn: inn || null,
            status: 'active',
          },
        });
      }
    } catch {
      // Prisma DB ulanmagan bo'lsa fallback virtual user
      userRecord = {
        id: `usr-${cleanPhone}`,
        phone: cleanPhone,
        role: userRole,
        inn: inn || null,
      };
    }

    const payload = {
      sub: userRecord.id,
      phone: userRecord.phone,
      role: userRecord.role,
      inn: userRecord.inn,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      success: true,
      accessToken,
      user: userRecord,
    };
  }

  async loginWithCredentials(login: string, pass: string) {
    const cleanLogin = (login || '').trim().toLowerCase();

    // Bunker Super Admin tekshiruvi
    if (cleanLogin === 'bunkeradmin' && pass === 'bunker2026') {
      const payload = {
        sub: 'bunker-admin-master',
        phone: '998900000000',
        role: 'BUNKER_ADMIN',
      };
      return {
        success: true,
        accessToken: this.jwtService.sign(payload),
        user: {
          id: 'bunker-admin-master',
          displayName: 'Bunker Super Admin',
          role: 'BUNKER_ADMIN',
        },
      };
    }

    // Oddiy admin tekshiruvi
    if (cleanLogin === 'admin' && pass === 'admin123') {
      const payload = {
        sub: 'admin-master',
        phone: '998901111111',
        role: 'ADMIN',
      };
      return {
        success: true,
        accessToken: this.jwtService.sign(payload),
        user: {
          id: 'admin-master',
          displayName: 'Bosh Admin',
          role: 'ADMIN',
        },
      };
    }

    throw new UnauthorizedException("Login yoki parol noto‘g‘ri!");
  }
}
