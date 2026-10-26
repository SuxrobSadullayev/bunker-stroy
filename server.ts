import express, { Request, Response } from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import companyRoutes from './server/routes/companyRoutes';
import eimzoRoutes from './server/routes/eimzoRoutes';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;
const server = http.createServer(app);

app.use(express.json());

// MChJ / Yuridik shaxs STIR lookup & ro'yxatdan o'tkazish marshrutlari
app.use('/api/company', companyRoutes);
// E-IMZO (Elektron Raqamli Imzo) orqali tasdiqlash marshrutlari
app.use('/api/eimzo', eimzoRoutes);

// Real SMS Gateway endpoint (Eskiz.uz yoki zaxira simulyatsiya)
let cachedEskizToken: string | null = null;
let eskizTokenExpiresAt = 0;

async function getEskizToken(): Promise<string | null> {
  const email = process.env.ESKIZ_EMAIL;
  const password = process.env.ESKIZ_PASSWORD;
  if (!email || !password) return null;

  if (cachedEskizToken && Date.now() < eskizTokenExpiresAt) {
    return cachedEskizToken;
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
      cachedEskizToken = data.data.token;
      eskizTokenExpiresAt = Date.now() + 25 * 24 * 3600 * 1000;
      return cachedEskizToken;
    }
  } catch (err) {
    console.error('Eskiz auth error:', err);
  }
  return null;
}

app.post('/api/sms/send', async (req: Request, res: Response) => {
  try {
    const { phone, code } = req.body;
    if (!phone || !code) {
      return res.status(400).json({ error: 'Telefon raqam va kod talab qilinadi' });
    }

    // Raqamni faqat raqamlarga keltirish (masalan: 998901234567)
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length === 9) {
      cleanPhone = '998' + cleanPhone;
    }

    const message = `BunkerStroy platformasi tasdiqlash kodi: ${code}`;
    const eskizEmail = process.env.ESKIZ_EMAIL;
    const eskizPassword = process.env.ESKIZ_PASSWORD;

    if (eskizEmail && eskizPassword) {
      const token = await getEskizToken();
      if (token) {
        const formData = new URLSearchParams();
        formData.append('mobile_phone', cleanPhone);
        formData.append('message', message);
        formData.append('from', process.env.ESKIZ_FROM || '4546');

        const sendResp = await fetch('https://notify.eskiz.uz/api/message/sms/send', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });
        const sendData = await sendResp.json();
        console.log('Eskiz SMS response:', sendData);

        return res.json({
          success: true,
          mode: 'real_sms',
          provider: 'eskiz.uz',
          phone: cleanPhone,
          message: 'SMS haqiqiy telefon raqamingizga muvaffaqiyatli yuborildi!',
          details: sendData,
        });
      }
    }

    // Agar Eskiz API ulanmagan bo'lsa (demo test rejimi):
    return res.json({
      success: true,
      mode: 'simulation',
      phone: cleanPhone,
      code,
      message: `SMS tasdiqlash kodi: ${code}`,
      info: 'Eskiz.uz hisobi kiritilganda SMS to‘g‘ridan-to‘g‘ri telefoningizga yuboriladi.',
    });
  } catch (error: any) {
    console.error('SMS yuborishda xatolik:', error);
    res.status(500).json({ error: error.message || 'SMS yuborishda xatolik yuz berdi' });
  }
});

// Mounting Vite in development or static in production
const isProduction = process.env.NODE_ENV === 'production';

async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(Number(port), '0.0.0.0', () => {
    console.log(`BunkerStroy server running on http://0.0.0.0:${port}`);
  });
}

startServer();
