import express, { Request, Response } from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
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

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Google Maps Grounding endpoint using gemini-3.5-flash
app.post('/api/maps/search', async (req: Request, res: Response) => {
  try {
    const { query, latitude, longitude } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const config: any = {
      tools: [{ googleMaps: {} }],
    };

    if (latitude && longitude) {
      config.toolConfig = {
        retrievalConfig: {
          latLng: {
            latitude: Number(latitude),
            longitude: Number(longitude),
          },
        },
      };
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `O'zbekiston hududidagi qurilish ob'ektlari, qurilish mollari bozorlari, beton zavodlari yoki logistika terminallari bo'yicha so'rov: ${query}. Aniq manzil, xususiyatlar va tafsilotlarni ko'rsating.`,
      config,
    });

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const text = response.text || '';

    // Extract place URLs from grounding chunks as mandated by guidelines
    const places = groundingChunks
      .filter((chunk: any) => chunk.maps)
      .map((chunk: any) => ({
        title: chunk.maps.title || 'Qurilish joyi',
        uri: chunk.maps.uri || '',
        placeAnswerSources: chunk.maps.placeAnswerSources || null,
      }));

    res.json({
      text,
      places,
      groundingChunks,
    });
  } catch (error: any) {
    console.error('Maps grounding error:', error);
    res.status(500).json({ error: error.message || 'Google Maps search failed' });
  }
});

// AI ESCO audit & Energy calculation endpoint
app.post('/api/ai/esco-calculate', async (req: Request, res: Response) => {
  try {
    const { buildingType, areaM2, currentEnergyUsage, wallMaterial, windowType } = req.body;

    const prompt = `Siz BunkerStroy ESCO (Energiya Servis Kompaniyasi) bosh energetik muhandisisiz.
Bino parametrlari:
- Bino turi: ${buildingType}
- Maydoni: ${areaM2} m²
- Oylik/yillik energiya xarajati: ${currentEnergyUsage} kVt/soat
- Devor konstruksiyasi: ${wallMaterial || 'Pishiq gisht'}
- Deraza turi: ${windowType || 'Oddiy plastik'}

Quyidagi parametrlarni hisoblab, JSON formatida javob bering:
{
  "energySavingsPercent": son (masalan 35),
  "paybackYears": son (masalan 2.4),
  "annualSavingsSum": son (so'mda),
  "recommendedMaterials": ["tavsiya 1", "tavsiya 2", "tavsiya 3"],
  "insulationAdvice": "Tavsiya matni",
  "co2ReductionTons": son
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('ESCO calculation error:', error);
    res.status(500).json({ error: error.message || 'Calculation error' });
  }
});

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

// Set up WebSocket server for Gemini Live API voice conversation
const wss = new WebSocketServer({ server, path: '/api/live' });

wss.on('connection', async (clientWs: WebSocket) => {
  console.log('Client connected to Live Voice WebSocket');

  let session: any = null;

  try {
    session = await ai.live.connect({
      model: 'gemini-3.8-live',
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } },
        },
        systemInstruction: `Siz BunkerStroy kompaniyasining aqlli ovozli maslahatchisisiz (BunkerStroy Voice Agent).
Siz quyidagi sohalarda mijozlarga professional maslahat berasiz:
1. Qurilish mollari (Sement M400/M500, g'isht, armatura A500C, quruq qorishmalar, izolyatsiya plitalari).
2. Logistika va transport (Samosval, Avtokran, Mikser, Manipulyator, Gazel yetkazib berish va marshrut hisobi).
3. ESCO (Energiya samaradorlik auditi, binolarni issiqlik izolyatsiyalash, energiya tejamkor qurilish).
Siz o'zbek tilida tabiiy, samimiy va professional gapirasiz. Mijoz rus tilida gapirsa, rus tilida javob berasiz.
Javoblaringiz qisqa, aniq va jonli muloqotga mos bo'lsin.`,
      },
      callbacks: {
        onmessage: (message: LiveServerMessage) => {
          const parts = message.serverContent?.modelTurn?.parts;
          if (parts && parts.length > 0) {
            for (const part of parts) {
              if (part.inlineData?.data) {
                clientWs.send(
                  JSON.stringify({
                    type: 'audio',
                    audio: part.inlineData.data,
                  })
                );
              }
              if (part.text) {
                clientWs.send(
                  JSON.stringify({
                    type: 'text',
                    text: part.text,
                  })
                );
              }
            }
          }
          if (message.serverContent?.interrupted) {
            clientWs.send(JSON.stringify({ type: 'interrupted' }));
          }
          if (message.serverContent?.turnComplete) {
            clientWs.send(JSON.stringify({ type: 'turnComplete' }));
          }
        },
        onclose: () => {
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ type: 'session_closed' }));
          }
        },
        onerror: (err: any) => {
          console.error('Live API Session error:', err);
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(
              JSON.stringify({
                type: 'error',
                error: err?.message || 'Gemini Live error',
              })
            );
          }
        },
      },
    });

    clientWs.on('message', (data: Buffer | string) => {
      try {
        const parsed = JSON.parse(data.toString());
        if (parsed.audio && session) {
          session.sendRealtimeInput({
            audio: { data: parsed.audio, mimeType: 'audio/pcm;rate=16000' },
          });
        } else if (parsed.text && session) {
          session.sendRealtimeInput({
            text: parsed.text,
          });
        }
      } catch (err) {
        console.error('Error forwarding client input to Live session:', err);
      }
    });

    clientWs.on('close', () => {
      console.log('Client WebSocket closed');
      try {
        if (session) session.close();
      } catch {}
    });
  } catch (err: any) {
    console.error('Failed to initialize Live API session:', err);
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(
        JSON.stringify({
          type: 'error',
          error: err?.message || 'Could not connect to Live API',
        })
      );
    }
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
