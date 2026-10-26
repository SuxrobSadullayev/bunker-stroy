import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private cachedToken: string | null = null;
  private tokenExpiresAt = 0;

  constructor(private readonly config: ConfigService) {}

  private async getEskizToken(): Promise<string | null> {
    const email = this.config.get<string>('ESKIZ_EMAIL');
    const password = this.config.get<string>('ESKIZ_PASSWORD');
    if (!email || !password) return null;

    if (this.cachedToken && Date.now() < this.tokenExpiresAt) {
      return this.cachedToken;
    }

    try {
      const formData = new URLSearchParams();
      formData.append('email', email);
      formData.append('password', password);

      const resp = await fetch('https://notify.eskiz.uz/api/auth/login', {
        method: 'POST',
        body: formData,
      });
      const data = await resp.json();
      if (data?.data?.token) {
        this.cachedToken = data.data.token;
        this.tokenExpiresAt = Date.now() + 25 * 24 * 3600 * 1000;
        return this.cachedToken;
      }
    } catch (err) {
      this.logger.error('Eskiz auth error:', err);
    }
    return null;
  }

  async sendVerificationCode(phone: string, code: string) {
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length === 9) {
      cleanPhone = '998' + cleanPhone;
    }

    const message = `BunkerStroy tasdiqlash kodi: ${code}`;
    const token = await this.getEskizToken();

    if (token) {
      try {
        const formData = new URLSearchParams();
        formData.append('mobile_phone', cleanPhone);
        formData.append('message', message);
        formData.append('from', this.config.get<string>('ESKIZ_FROM') || '4546');

        const sendResp = await fetch('https://notify.eskiz.uz/api/message/sms/send', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const sendData = await sendResp.json();
        return {
          success: true,
          mode: 'real_sms',
          provider: 'eskiz.uz',
          phone: cleanPhone,
          message: 'SMS telefon raqamga muvaffaqiyatli yuborildi!',
          details: sendData,
        };
      } catch (err) {
        this.logger.error('SMS yuborishda xatolik:', err);
      }
    }

    // Agar Eskiz API ulanmagan bo'lsa (demo / development rejimi):
    return {
      success: true,
      mode: 'simulation',
      phone: cleanPhone,
      code,
      message: `SMS tasdiqlash kodi: ${code}`,
      info: 'Eskiz.uz hisobi .env orqali kiritilganda SMS haqiqiy telefoningizga boradi.',
    };
  }
}
