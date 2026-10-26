import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global Validatsiya
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // CORS ruxsatlari (Frontend bilan bog'lanish uchun)
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Swagger OpenAPI Hujjatlari
  const config = new DocumentBuilder()
    .setTitle('BunkerStroy Enterprise API')
    .setDescription(
      'O‘zbekiston qurilish sohasi B2B/B2C marketplace, logistika va kabinetlar tizimi uchun NestJS REST API',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auth & Registration', 'SMS OTP va login autentifikatsiya')
    .addTag('Company (STIR / INN)', 'STIR tekshiruvi va 24-soatlik kesh')
    .addTag('E-IMZO (Elektron Raqamli Imzo)', 'ERI challenge va PKCS#7 verifikatsiya')
    .addTag('Products (Katalog & Ombor)', 'Qurilish mollari katalogi va ombor')
    .addTag('Orders (Buyurtmalar & Savat)', 'B2B/B2C buyurtmalar rasmiylashtirish va monitoring')
    .addTag('Suppliers (Yetkazib beruvchilar kabineti)', 'Ta‘minotchilar, komissiya va sotuvlar tahlili')
    .addTag('Logistics Hub (Maxsus texnika & Yetkazib berish)', 'Samosval, avtokran, mikser xizmatlari')
    .addTag('SMS Gateway (Eskiz.uz)', 'SMS OTP provayderi')
    .addTag('Admin & Platform Management', 'Platforma statistikasi va audit loglari')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'BunkerStroy API Docs',
  });

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');

  console.log(`\n======================================================`);
  console.log(`🚀 BunkerStroy NestJS Server ishga tushdi: http://localhost:${port}`);
  console.log(`📚 Swagger API Hujjatlari: http://localhost:${port}/api/docs`);
  console.log(`======================================================\n`);
}

bootstrap();
