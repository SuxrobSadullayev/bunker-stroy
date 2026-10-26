# BunkerStroy — Qurilish mollari va maxsus texnika logistika platformasi

O‘zbekiston qurilish sohasi uchun mo‘ljallangan B2B va B2C marketplace, logistika xizmatlari agregatori va elektron tijorat tizimi.

## Imkoniyatlar
- **Marketplace:** Qurilish mahsulotlari katalogi, filtrlash, savat va buyurtma tizimi.
- **Logistika Hab:** Samosval, avtokran, mikser, manipulyator va maxsus texnikalarni buyurtma qilish.
- **Ko‘p bosqichli kabinetlar:**
  - Jismoniy va yuridik shaxslar (mijozlar) kabineti
  - Ishlab chiqaruvchi va yetkazib beruvchilar kabineti (Supplier Cabinet)
  - Admin va Sub-admin kabineti (Admin Cabinet, CRM, hisobotlar)
  - Tizim boshqaruvchisi (Bunker Super Admin)
- **STIR / INN Validatsiya & Kesh:** O‘zbekiston korxonalarini STIR bo‘yicha avtomatik tekshirish.
- **E-IMZO integratsiyasi:** Elektron raqamli imzo orqali yuridik shaxslarni verifikatsiya qilish.
- **SMS Gateway:** Eskiz.uz orqali telefon raqamlariga OTP tasdiqlash kodlarini yuborish.
- **PDF hisobotlar:** Buyurtma cheklari va hisob-fakturalarni PDF ko‘rinishida yuklab olish.

## Texnologiyalar
- **Frontend:** React 19, Vite, TypeScript, Tailwind CSS, Lucide React, jsPDF
- **Backend:** Node.js, Express, TypeScript, tsx
- **Ma'lumotlar bazasi:** Firebase Firestore
- **SMS:** Eskiz.uz SMS API

## O‘rnatish va ishga tushirish

1. Bog‘liqliklarni o‘rnatish:
   ```bash
   npm install
   ```

2. `.env` faylini sozlash (ixtiyoriy Eskiz SMS va portlar uchun):
   ```bash
   cp .env.example .env
   ```

3. Loyihani ishlab chiquvchi rejimida ishga tushirish:
   ```bash
   npm run dev
   ```

4. Loyihani tekshirish:
   ```bash
   npm run lint
   npm test
   ```
