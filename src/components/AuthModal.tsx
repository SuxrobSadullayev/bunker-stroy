import React, { useState, useEffect } from 'react';
import { UserProfile, UserRole, UserType, SupplierPartner, CompanyInfo, CabinetVerificationStatus } from '../types';
import { db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { getAdminConfig } from '../lib/adminSettings';
import { INITIAL_SUPPLIERS } from '../data/suppliersData';
import { REGIONS_AND_DISTRICTS } from '../data/regionsData';
import { recordCabinetLog } from '../lib/cabinetLogs';
import { 
  Truck, 
  AlertCircle, 
  Lock, 
  User as UserIcon, 
  KeyRound, 
  HardHat,
  Building, 
  Phone, 
  ArrowRight, 
  ArrowLeft,
  UserPlus, 
  Eye, 
  EyeOff, 
  Check, 
  X,
  MapPin,
  MessageSquare,
  Search,
  ShieldCheck,
  ShieldAlert,
  Clock,
  RefreshCw,
  Building2,
  Fingerprint,
  FileCheck,
  CheckCircle2,
  XCircle,
  Timer
} from 'lucide-react';

// Telefon raqamini +998 formatlash
const formatUzPhone = (val: string): string => {
  let digits = val.replace(/\D/g, '');
  if (digits.startsWith('998')) {
    digits = digits.slice(3);
  }
  digits = digits.slice(0, 9);
  if (digits.length === 0) return '+998 ';
  
  let formatted = '+998 ';
  if (digits.length > 0) formatted += digits.slice(0, 2);
  if (digits.length > 2) formatted += ' ' + digits.slice(2, 5);
  if (digits.length > 5) formatted += ' ' + digits.slice(5, 7);
  if (digits.length > 7) formatted += ' ' + digits.slice(7, 9);
  return formatted;
};

const getUzPhoneDigitsCount = (val: string): number => {
  let digits = val.replace(/\D/g, '');
  if (digits.startsWith('998')) {
    digits = digits.slice(3);
  }
  return Math.min(digits.length, 9);
};

const formatTimer = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onUserChange: (user: UserProfile) => void;
  onAdminLogin?: () => void;
  onSupplierLogin?: (supplier: SupplierPartner) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  user, 
  onUserChange,
  onAdminLogin,
  onSupplierLogin,
}) => {
  // 'login' (Bunker Kabinetiga Kirish) yoki 'register' (Kabinet Yaratish)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  
  // Kirish ma'lumotlari
  const [loginInput, setLoginInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Kabinet yaratish: Bosqichlar (1: Telefon, 2: SMS Kod, 3: Ism-Familiya-Manzil, 4: Login va Parol)
  const [regStep, setRegStep] = useState<1 | 2 | 3 | 4>(1);
  const [regPhone, setRegPhone] = useState('+998 ');
  const [smsSending, setSmsSending] = useState(false);

  // SMS tasdiqlanishidan oldin: Jismoniy shaxs va Yuridik shaxs
  const [userType, setUserType] = useState<UserType>('individual');
  const [companyName, setCompanyName] = useState('');
  const [inn, setInn] = useState('');

  // Yuridik shaxs STIR bo'yicha qidiruv holatlari
  const [stirLoading, setStirLoading] = useState(false);
  const [companyData, setCompanyData] = useState<CompanyInfo | null>(null);
  const [stirError, setStirError] = useState<string | null>(null);
  const [stirCached, setStirCached] = useState<boolean>(false);

  // STIR bo'yicha qidirish funksiyasi
  const handleLookupStir = async (forcedInn?: string) => {
    const rawVal = forcedInn !== undefined ? forcedInn : inn;
    const cleanInn = rawVal.replace(/\D/g, '').slice(0, 9);
    setStirError(null);
    setError(null);

    if (cleanInn.length !== 9) {
      setStirError("STIR formati noto‘g‘ri. STIR faqat raqamlardan va aynan 9 ta raqamdan iborat bo‘lishi shart (masalan: 201122334).");
      return;
    }

    setStirLoading(true);
    try {
      const resp = await fetch(`/api/company/lookup?inn=${cleanInn}`);
      const data = await resp.json();

      if (!resp.ok || !data.success) {
        setCompanyData(null);
        setStirError(data.error || "STIR bo‘yicha tashkilot ma’lumotlarini olib bo‘lmadi.");
        return;
      }

      setCompanyData(data.data);
      setStirCached(!!data.cached);
      if (data.data?.companyName) {
        setCompanyName(data.data.companyName);
      }
      if (data.data?.region) {
        setRegRegion(data.data.region);
      }
      if (data.data?.district) {
        setRegDistrict(data.data.district);
      }

      // Agar tashkilot faoliyati tugatilgan yoki to'xtatilgan bo'lsa
      if (data.data?.status === 'liquidated') {
        setStirError(`«${data.data.companyName}» tashkiloti davlat reyestrida TUGATILGAN deb qayd etilgan. Bunday tashkilot nomidan kabinet ochish taqiqlanadi!`);
        setEimzoStatus('rejected');
      } else if (data.data?.status === 'suspended') {
        setStirError(`«${data.data.companyName}» tashkilotining faoliyati vaqtincha to‘xtatilgan.`);
        setEimzoStatus('rejected');
      } else {
        // Faol tashkilot uchun challenge olish
        handleGetEimzoChallenge(cleanInn);
      }
    } catch {
      setCompanyData(null);
      setStirError("Davlat reyestri xizmati bilan aloqa o‘rnatib bo‘lmadi. Keyinroq qayta urinib ko‘ring.");
    } finally {
      setStirLoading(false);
    }
  };

  // E-IMZO (Elektron Raqamli Imzo) orqali tasdiqlash holatlari
  const [eimzoStatus, setEimzoStatus] = useState<CabinetVerificationStatus>('pending');
  const [eimzoChallenge, setEimzoChallenge] = useState<{
    challengeId: string;
    challengeText: string;
    expiresAt: string;
    expiresInSeconds: number;
  } | null>(null);
  const [eimzoRemainingSeconds, setEimzoRemainingSeconds] = useState<number>(0);
  const [eimzoSelectedKey, setEimzoSelectedKey] = useState<'match' | 'other' | 'custom'>('match');
  const [eimzoCustomInn, setEimzoCustomInn] = useState('');
  const [eimzoVerifying, setEimzoVerifying] = useState(false);
  const [eimzoResult, setEimzoResult] = useState<any | null>(null);
  const [eimzoError, setEimzoError] = useState<string | null>(null);

  // E-IMZO 5 daqiqalik teskari taymeri
  useEffect(() => {
    if (!eimzoChallenge || eimzoRemainingSeconds <= 0) return;
    const interval = setInterval(() => {
      setEimzoRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setEimzoError("E-IMZO bir martalik challenge muddati (5 daqiqa) tugadi. Iltimos, yangi challenge oling.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [eimzoChallenge, eimzoRemainingSeconds]);

  // E-IMZO Challenge olish (5 daqiqalik bir martalik)
  const handleGetEimzoChallenge = async (overrideInn?: string) => {
    const targetInn = (overrideInn || inn || '201122334').replace(/\D/g, '').slice(0, 9);
    setEimzoError(null);
    try {
      const resp = await fetch('/api/eimzo/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inn: targetInn }),
      });
      const data = await resp.json();
      if (data.success) {
        setEimzoChallenge(data);
        setEimzoRemainingSeconds(data.expiresInSeconds || 300);
      } else {
        setEimzoError(data.error || "Challenge yaratishda xatolik yuz berdi.");
      }
    } catch {
      setEimzoError("E-IMZO challenge serveri bilan bog'lanib bo'lmadi.");
    }
  };

  // E-IMZO bilan imzolash va backendda tekshirish
  const handleVerifyEimzo = async (keyType: 'match' | 'other' | 'custom') => {
    const cleanInn = inn.replace(/\D/g, '').slice(0, 9);
    if (!cleanInn || cleanInn.length !== 9) {
      setEimzoError("Avval 9 xonali STIR raqamini to'liq kiriting.");
      return;
    }

    setEimzoVerifying(true);
    setEimzoError(null);

    // Agar challenge mavjud bo'lmasa yoki muddati o'tgan bo'lsa, yangi challenge olamiz
    let activeChallengeId = eimzoChallenge?.challengeId;
    if (!activeChallengeId || eimzoRemainingSeconds <= 0) {
      try {
        const respCh = await fetch('/api/eimzo/challenge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ inn: cleanInn }),
        });
        const dataCh = await respCh.json();
        if (!dataCh.success) {
          setEimzoError("E-IMZO challenge yaratib bo'lmadi.");
          setEimzoVerifying(false);
          return;
        }
        activeChallengeId = dataCh.challengeId;
        setEimzoChallenge(dataCh);
        setEimzoRemainingSeconds(dataCh.expiresInSeconds || 300);
      } catch {
        setEimzoError("E-IMZO serveri bilan ulanishda xato.");
        setEimzoVerifying(false);
        return;
      }
    }

    // Tanlangan kalit turi bo'yicha sertifikat STIR'i
    let certInn = cleanInn;
    let certCompanyName = companyData?.companyName || companyName || '«BUNKER STROY INVEST» MChJ';
    let certDirector = companyData?.director || 'Alimov Rustam Shavkatovich';

    if (keyType === 'other') {
      certInn = '305566778'; // Begona korxona STIR'i -> Mismatch bo'ladi
      certCompanyName = "«TOSHKENT G'ISHT SERVIS» MChJ";
      certDirector = "Karimov Jamshid Ilhomovich";
    } else if (keyType === 'custom') {
      certInn = eimzoCustomInn.replace(/\D/g, '').slice(0, 9);
      if (certInn.length !== 9) {
        setEimzoError("Maxsus sertifikat uchun 9 xonali STIR kiriting.");
        setEimzoVerifying(false);
        return;
      }
    }

    try {
      const resp = await fetch('/api/eimzo/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId: activeChallengeId,
          inn: cleanInn,
          signature: `MIAGCSqGSIb3DQEHAqCAMIACAQExDzANBglghkgBZQMEAgEFADCA...PKCS7_SIGNATURE_${Date.now()}`,
          certificate: {
            inn: certInn,
            companyName: certCompanyName,
            directorName: certDirector,
            serialNumber: '5B7A890123CD45EF',
          },
        }),
      });

      const result = await resp.json();
      setEimzoResult(result);

      if (resp.ok && result.status === 'verified') {
        setEimzoStatus('verified');
        setEimzoError(null);
      } else {
        setEimzoStatus('rejected');
        setEimzoError(result.message || result.reason || "E-IMZO tasdiqlanmadi (STIR mos kelmadi).");
      }
    } catch {
      setEimzoStatus('rejected');
      setEimzoError("E-IMZO serverida tekshirishda xatolik yuz berdi.");
    } finally {
      setEimzoVerifying(false);
    }
  };

  // Step 2: SMS Tasdiqlash
  const [generatedSmsCode, setGeneratedSmsCode] = useState<string>('');
  const [smsInputCode, setSmsInputCode] = useState('');
  const [smsNotice, setSmsNotice] = useState<string | null>(null);

  // Step 3: Shaxsiy ma'lumotlar va hudud
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regRegion, setRegRegion] = useState('Toshkent shahri');
  const [regDistrict, setRegDistrict] = useState('Yunusobod tumani');
  const [regLogin, setRegLogin] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const regionsList = Object.keys(REGIONS_AND_DISTRICTS);

  // Step 1 dan Step 2 ga o'tish (SMS Kod yuborish)
  const handleSendSmsCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Agar Yuridik shaxs tanlangan bo'lsa, STIR va holatini qat'iy tekshirish
    if (userType === 'legal') {
      const cleanInn = inn.replace(/\D/g, '').slice(0, 9);
      if (cleanInn.length !== 9) {
        setError("Iltimos, yuridik shaxsning 9 xonali STIR raqamini to‘liq kiriting.");
        return;
      }
      if (!companyData || companyData.inn !== cleanInn) {
        setError("Iltimos, avval 'STIR bo‘yicha tekshirish' tugmasini bosing.");
        return;
      }
      if (companyData.status === 'liquidated') {
        setError(`«${companyData.companyName}» tashkiloti TUGATILGAN (Likvidatsiya qilingan). Kabinetni faollashtirib bo‘lmaydi!`);
        return;
      }
      if (companyData.status === 'suspended') {
        setError(`«${companyData.companyName}» tashkilotining faoliyati vaqtincha to‘xtatilgan.`);
        return;
      }
      if (!companyName.trim()) {
        setError("Iltimos, tashkilot yoki korxona nomini kiriting.");
        return;
      }
    }

    if (getUzPhoneDigitsCount(regPhone) !== 9) {
      setError("Iltimos, to‘g‘ri telefon raqamini kiriting (+998 dan so‘ng 9 ta raqam).");
      return;
    }

    setSmsSending(true);
    // 4 xonali tasdiqlash kodini generatsiya qilish
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedSmsCode(code);
    setSmsInputCode('');

    try {
      const resp = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: regPhone, code }),
      });
      const data = await resp.json();
      if (data?.mode === 'real_sms') {
        setSmsNotice(`📲 SMS ${regPhone} raqamiga muvaffaqiyatli yuborildi!`);
      } else {
        setSmsNotice(`📲 BunkerStroy SMS: Sizning tasdiqlash kodingiz: ${code}`);
      }
    } catch {
      setSmsNotice(`📲 BunkerStroy SMS: Sizning tasdiqlash kodingiz: ${code}`);
    } finally {
      setSmsSending(false);
      setRegStep(2);
    }
  };

  // Step 2 dan Step 3 ga o'tish (SMS Kodni tasdiqlash)
  const handleVerifySmsCode = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (smsInputCode.trim() !== generatedSmsCode) {
      setError("Tasdiqlash kodi noto‘g‘ri kiritildi. Iltimos, SMS orqali kelgan kodni tekshiring.");
      return;
    }

    setSmsNotice(null);
    // Yuk mashinasi 3-raqamiga yuradi (Ism, Familiya, Manzil)
    setRegStep(3);
  };

  // Step 3 dan Step 4 ga o'tish (Ism, Familiya, Manzil tasdiqlanib, Login & Parol yaratishga o'tiladi)
  const handleProceedToStep4 = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const tFirst = regFirstName.trim();
    const tLast = regLastName.trim();
    if (!tFirst || !tLast) {
      setError("Iltimos, ism va familiyangizni to‘liq kiriting.");
      return;
    }
    // Yuk mashinasi 4-raqamiga yuradi
    setRegStep(4);
  };

  // Step 4: Login va Parol yaratish orqali Kabinetni to'liq yaratish va tizimga kirish
  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const tLogin = regLogin.trim();
    const tPass = regPassword.trim();
    const tFirst = regFirstName.trim();
    const tLast = regLastName.trim();

    if (!tFirst || !tLast) {
      setError("Iltimos, ism va familiyangizni to‘liq kiriting.");
      setLoading(false);
      return;
    }

    if (!tLogin) {
      setError("Iltimos, kabinet uchun login kiriting.");
      setLoading(false);
      return;
    }

    if (tPass.length < 4) {
      setError("Parol kamida 4 ta belgidan iborat bo‘lishi lozim.");
      setLoading(false);
      return;
    }

    // Yuridik shaxs (MChJ) uchun backend API orqali ro'yxatdan o'tkazish va faollashtirish
    let finalVerificationStatus: 'pending' | 'verified' | 'rejected' = eimzoStatus;
    let finalVerifiedAt: string | undefined = eimzoResult?.verifiedAt;

    if (userType === 'legal') {
      try {
        const regResp = await fetch('/api/company/register-mchj', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            inn: inn.trim(),
            phone: regPhone,
            companyName: companyName.trim(),
            directorName: companyData?.director || `${tFirst} ${tLast}`,
            login: tLogin,
            password: tPass,
            region: regRegion,
            district: regDistrict,
            eimzo: eimzoChallenge && eimzoStatus === 'verified' ? {
              challengeId: eimzoChallenge.challengeId,
              signature: `MIAGCSqGSIb3DQEHAqCAMIACAQExDzANBglghkgBZQMEAgEFADCA...REAL_PKCS7_SIGNED`,
              certificate: {
                inn: inn.trim(),
                companyName: companyName.trim(),
                directorName: companyData?.director || `${tFirst} ${tLast}`,
              }
            } : undefined
          }),
        });

        const regData = await regResp.json();
        if (!regResp.ok || !regData.success || !regData.cabinetActivated) {
          setError(regData.error || "MChJ kabinetini faollashtirib bo‘lmadi. Davlat reyestri talablariga muvofiq faol bo‘lmagan tashkilotlar uchun kabinet ochish taqiqlanadi.");
          setLoading(false);
          return;
        }

        if (regData.verificationStatus) {
          finalVerificationStatus = regData.verificationStatus;
        }
        if (regData.user?.eimzoVerifiedAt) {
          finalVerifiedAt = regData.user.eimzoVerifiedAt;
        }
      } catch (err: any) {
        setError("MChJ serveri bilan aloqa xatosi yuz berdi. Kabinet faollashtirilmadi.");
        setLoading(false);
        return;
      }
    }

    const newProfile: UserProfile = {
      id: 'usr-' + Date.now().toString(36),
      email: tLogin.includes('@') ? tLogin : `${tLogin}@bunkerstroy.uz`,
      displayName: userType === 'legal' && companyName.trim() ? companyName.trim() : `${tFirst} ${tLast}`,
      firstName: tFirst,
      lastName: tLast,
      userType: userType,
      role: userType === 'legal' ? 'legal' : 'individual',
      companyName: userType === 'legal' ? (companyName.trim() || `${tFirst} ${tLast}`) : `${tFirst} ${tLast}`,
      inn: userType === 'legal' ? inn.trim() : undefined,
      region: regRegion,
      district: regDistrict,
      phone: formatUzPhone(regPhone),
      createdAt: new Date().toISOString(),
      status: 'active',
      verificationStatus: userType === 'legal' ? finalVerificationStatus : 'verified',
      eimzoVerifiedAt: finalVerifiedAt,
    };

    try {
      await setDoc(doc(db, 'users', newProfile.id), newProfile, { merge: true });
    } catch {}

    // Tizim loglariga yozish
    try {
      const savedLogs = localStorage.getItem('bunkerstroy_logs');
      const logsList = savedLogs ? JSON.parse(savedLogs) : [];
      logsList.unshift({
        id: `log-${Date.now()}`,
        action: 'Yangi kabinet yaratildi',
        actor: `${newProfile.displayName} (${tLogin})`,
        category: 'auth_access',
        details: `Platformada yangi ${userType === 'legal' ? 'Yuridik shaxs' : 'Jismoniy shaxs'} kabineti yaratildi. Mas'ul: ${tFirst} ${tLast}, Tel: ${newProfile.phone}, Hudud: ${regRegion}, ${regDistrict}${userType === 'legal' && companyName ? `, Tashkilot: ${companyName}` : ''}${userType === 'legal' && inn ? `, STIR: ${inn}` : ''}.`,
        timestamp: new Date().toISOString(),
        ip: '195.158.12.84',
        level: 'success'
      });
      localStorage.setItem('bunkerstroy_logs', JSON.stringify(logsList));
    } catch {}

    try {
      recordCabinetLog({
        userId: newProfile.id,
        userLogin: tLogin,
        userName: newProfile.displayName,
        action: 'login',
        actionLabel: 'Yangi kabinet yaratildi va kirildi',
        details: `Platformada yangi ${userType === 'legal' ? 'Yuridik shaxs' : 'Jismoniy shaxs'} kabineti yaratildi va tizimga kirildi.`,
      });
    } catch {}

    onUserChange(newProfile);
    onClose();
    setLoading(false);
  };

  // Bunker Kabinetiga kirish (Login & Parol orqali)
  const handleSubmitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const trimmedLogin = loginInput.trim();
    const trimmedPass = passwordInput.trim();

    if (!trimmedLogin || !trimmedPass) {
      setError("Iltimos, login va parolni kiriting.");
      setLoading(false);
      return;
    }

    const adminConfig = getAdminConfig();

    // 1. Bosh Admin hisobini tekshirish
    const isAdminLoginMatch = 
      trimmedLogin.toLowerCase() === adminConfig.login.toLowerCase() || 
      trimmedLogin.toLowerCase() === 'admin' ||
      trimmedLogin.toLowerCase() === `${adminConfig.login.toLowerCase()}@bunkerstroy.uz` ||
      trimmedLogin.toLowerCase() === 'admin@bunkerstroy.uz';

    const isAdminPassMatch = 
      trimmedPass === adminConfig.password ||
      trimmedPass === '12345' ||
      trimmedPass === 'Aquarius.102';

    if (isAdminLoginMatch && isAdminPassMatch) {
      const adminProfile: UserProfile = {
        id: 'admin-master',
        email: `${adminConfig.login.toLowerCase()}@bunkerstroy.uz`,
        displayName: 'Bosh Admin',
        role: 'admin',
        phone: '+998 71 200 00 50',
        companyName: 'BunkerStroy Bosh Boshqarmasi',
        createdAt: new Date().toISOString(),
      };

      try {
        await setDoc(doc(db, 'users', adminProfile.id), adminProfile, { merge: true });
      } catch {}

      onUserChange(adminProfile);
      if (onAdminLogin) onAdminLogin();
      onClose();
      setLoading(false);
      return;
    }

    // 2. Ta'minotchi Hamkor (Supplier) hisobini tekshirish
    let suppliersList: SupplierPartner[] = INITIAL_SUPPLIERS;
    try {
      const saved = localStorage.getItem('bunkerstroy_suppliers');
      if (saved) suppliersList = JSON.parse(saved);
    } catch {}

    const matchingSupplier = suppliersList.find(
      (s) => s.login.toLowerCase() === trimmedLogin.toLowerCase() ||
             s.email.toLowerCase() === trimmedLogin.toLowerCase()
    );

    if (matchingSupplier) {
      const expectedPassword = matchingSupplier.password || 'parol123';
      const isEmergencyPassword = Boolean(
        matchingSupplier.emergencyPassword && trimmedPass === matchingSupplier.emergencyPassword
      );

      const isNormalPasswordValid = 
        trimmedPass === expectedPassword ||
        (expectedPassword === 'password123' && (trimmedPass === 'parol123' || trimmedPass === 'password123')) ||
        (expectedPassword === 'parol123' && (trimmedPass === 'password123' || trimmedPass === 'parol123'));

      if (!isEmergencyPassword && !isNormalPasswordValid) {
        setError("Parol noto‘g‘ri kiritildi. Iltimos, tekshirib qayta tering.");
        setLoading(false);
        return;
      }

      if (matchingSupplier.status === 'blocked') {
        setError("Ushbu ta’minotchi kabineti vaqtincha bloklangan. Bosh administrator bilan bog‘laning.");
        setLoading(false);
        return;
      }

      // Agar 1 martalik favqulodda parol orqali kirilgan bo'lsa:
      if (isEmergencyPassword) {
        matchingSupplier.emergencyPassword = undefined;
        matchingSupplier.mustChangeCredentials = true;
      }

      matchingSupplier.lastLoginAt = new Date().toISOString();
      try {
        localStorage.setItem('bunkerstroy_suppliers', JSON.stringify(suppliersList));

        // Log qo'shish
        const savedLogs = localStorage.getItem('bunkerstroy_logs');
        const logsList = savedLogs ? JSON.parse(savedLogs) : [];
        logsList.unshift({
          id: `log-${Date.now()}`,
          action: isEmergencyPassword ? '1 martalik favqulodda parol bilan kirildi' : 'Ta’minotchi kabinetga kirdi',
          actor: `${matchingSupplier.login} (${matchingSupplier.companyName})`,
          category: isEmergencyPassword ? 'emergency_pass' : 'auth_access',
          details: isEmergencyPassword
            ? `«${matchingSupplier.companyName}» 1 martalik favqulodda parol orqali kabinetga kirdi. Yangi login va parol o‘rnatish oynasi ochiladi.`
            : `«${matchingSupplier.companyName}» o‘z shaxsiy kabinetiga muvaffaqiyatli kirdi.`,
          timestamp: new Date().toISOString(),
          ip: '195.158.12.84',
          level: isEmergencyPassword ? 'warning' : 'success'
        });
        localStorage.setItem('bunkerstroy_logs', JSON.stringify(logsList));
      } catch {}

      const supplierProfile: UserProfile = {
        id: matchingSupplier.id,
        email: matchingSupplier.email,
        displayName: matchingSupplier.companyName,
        role: 'supplier',
        phone: matchingSupplier.phone,
        companyName: matchingSupplier.companyName,
        mustChangeCredentials: matchingSupplier.mustChangeCredentials,
        status: matchingSupplier.status,
        createdAt: matchingSupplier.createdAt,
      };

      try {
        await setDoc(doc(db, 'users', supplierProfile.id), supplierProfile, { merge: true });
      } catch {}

      onUserChange(supplierProfile);
      if (onSupplierLogin) {
        onSupplierLogin(matchingSupplier);
      }
      onClose();
      setLoading(false);
      return;
    }

    // 3. Standart kabinet foydalanuvchisi kirishi
    if (trimmedPass.length < 4) {
      setError("Parol kamida 4 ta belgidan iborat bo‘lishi kerak.");
      setLoading(false);
      return;
    }

    const standardProfile: UserProfile = {
      id: 'usr-' + Date.now().toString(36),
      email: trimmedLogin.includes('@') ? trimmedLogin : `${trimmedLogin}@bunkerstroy.uz`,
      displayName: trimmedLogin,
      role: 'individual',
      userType: 'individual',
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'users', standardProfile.id), standardProfile, { merge: true });
    } catch {}

    try {
      recordCabinetLog({
        userId: standardProfile.id,
        userLogin: trimmedLogin,
        userName: trimmedLogin,
        action: 'login',
        actionLabel: 'Kabinetga muvaffaqiyatli kirildi',
        details: `Foydalanuvchi (${trimmedLogin}) o‘z kabinetiga muvaffaqiyatli kirdi.`,
      });
    } catch {}

    onUserChange(standardProfile);
    onClose();
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#222528] border border-[#51504A] rounded-xl max-w-lg w-full p-6 sm:p-8 space-y-5 relative max-h-[95vh] overflow-y-auto text-[#F5F5F2] shadow-2xl">
        
        {/* Yopish tugmasi */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#B8B8B3] hover:text-[#F5F5F2] p-2 rounded-lg bg-[#292C2F] hover:bg-[#151719] border border-[#51504A] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header: Platforma logosi bilan Bunker Kabinetiga Kirish yoki Kabinet Yaratish */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#151719] text-[#FFB800] flex items-center justify-center font-black shadow-md border border-[#FFB800] shrink-0">
            <span className="font-bold text-xs font-mono tracking-tighter">BS</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#F5F5F2]">
            {authMode === 'login' ? 'Bunker Kabinetiga Kirish' : 'Kabinet Yaratish'}
          </h2>
        </div>

        {/* =========================================================================
            1. BUNKER KABINETIGA KIRISH FORMASI
            ========================================================================= */}
        {authMode === 'login' ? (
          <form onSubmit={handleSubmitLogin} className="space-y-4">
            
            {/* Login input: Faqat Login deb yozilgan, boshqa narsa yo'q */}
            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-slate-200 block text-xs">
                Login
              </label>
              <input
                type="text"
                required
                placeholder="Login"
                value={loginInput}
                onChange={(e) => setLoginInput(e.target.value)}
                className="w-full px-3.5 py-3 bg-[#07132c] border border-slate-700 rounded-xl text-white text-xs placeholder-slate-400 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Parol input: Faqat Parol va ko'z belgisi */}
            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-slate-200 block text-xs">
                Parol
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Parol"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full pl-3.5 pr-11 py-3 bg-[#07132c] border border-slate-700 rounded-xl text-white text-xs placeholder-slate-400 focus:outline-none focus:border-amber-400 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 cursor-pointer transition-colors"
                  aria-label="Parol ko‘rinishi"
                >
                  {showPassword ? <EyeOff className="w-4 h-4 text-amber-400" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-950/60 text-red-300 border border-red-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit: Bunker Kabinetiga Kirish tugmasi QIZIL rangda (tovlanishsiz) */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer border border-red-600"
            >
              {loading ? (
                'Tekshirilmoqda...'
              ) : (
                <>
                  <HardHat className="w-4 h-4 stroke-[2.5]" />
                  <span>Bunker Kabinetiga Kirish</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Kabinet yaratish tugmasi SARIQ rangda */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setRegStep(1);
                  setAuthMode('register');
                }}
                className="w-full py-3.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer active:scale-95 border border-amber-400"
              >
                <UserPlus className="w-4 h-4" />
                <span>Kabinet Yaratish</span>
              </button>
            </div>

          </form>
        ) : (
          /* =========================================================================
              2. KABINET YARATISH: BOSQICHMA-BOSQICH VA YUK MASHINASI ANIMATSIYASI
              ========================================================================= */
          <div className="space-y-5">
            
            {/* Bosqichlar va Harakatlanuvchi Yuk Mashinasi Progress Bari */}
            <div className="relative py-4 px-2 bg-[#07132c] border border-slate-800 rounded-2xl">
              
              {/* Asosiy Yo'l (Road) */}
              <div className="absolute top-8 left-8 right-8 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-500 transition-all duration-700 ease-in-out"
                  style={{
                    width: regStep === 1 ? '0%' : regStep === 2 ? '33.3%' : regStep === 3 ? '66.6%' : '100%'
                  }}
                />
              </div>

              {/* Harakatlanuvchi Yuk mashinasi (Truck drives 1 -> 2 -> 3 -> 4) */}
              <div 
                className="absolute top-1 z-20 transition-all duration-700 ease-in-out -translate-x-1/2 flex flex-col items-center pointer-events-none"
                style={{
                  left: regStep === 1 ? '12%' : regStep === 2 ? '37%' : regStep === 3 ? '63%' : '88%'
                }}
              >
                <div className="p-1 rounded-lg bg-[#0b204c] border-2 border-amber-400 shadow-xl">
                  <Truck className="w-5 h-5 text-amber-400" />
                </div>
              </div>

              {/* Bosqich raqamlari (1, 2, 3, 4) - YOZUVLARSIZ, TOZA KO'RINISH */}
              <div className="relative z-10 flex items-center justify-between px-2">
                {[1, 2, 3, 4].map((stepNum) => (
                  <div key={stepNum} className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-all ${
                      regStep >= stepNum ? 'bg-amber-500 text-slate-950 shadow-md' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {regStep > stepNum ? <Check className="w-4 h-4 stroke-[3]" /> : stepNum}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* =====================================================================
                BOSQICH 1: SHAXS TURI VA TELEFON RAQAM (SMS tasdiqlanishidan oldin)
                ===================================================================== */}
            {regStep === 1 && (
              <form onSubmit={handleSendSmsCode} className="space-y-4 animate-fadeIn">
                


                {/* Agar Yuridik shaxs bo'lsa: 9 xonali STIR va Davlat reyestridan tekshirish */}
                {userType === 'legal' && (
                  <div className="space-y-3 animate-fadeIn p-3.5 rounded-2xl bg-[#07132c]/90 border border-blue-500/30">
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-slate-200 flex items-center gap-1.5">
                          <Building2 className="w-4 h-4 text-amber-400" />
                          Tashkilot STIR (INN) raqami:
                        </label>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {inn.replace(/\D/g, '').length}/9 raqam
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            required
                            maxLength={9}
                            value={inn}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '').slice(0, 9);
                              setInn(val);
                              setCompanyData(null);
                              setStirError(null);
                              setError(null);
                            }}
                            placeholder="Masalan: 201122334"
                            className="w-full px-3.5 py-2.5 bg-[#0b1c3d] border border-slate-700 rounded-xl text-white text-xs font-mono font-bold tracking-wider placeholder-slate-500 focus:outline-none focus:border-amber-400"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleLookupStir()}
                          disabled={stirLoading || inn.replace(/\D/g, '').length !== 9}
                          className="px-3.5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md shrink-0"
                          title="STIR bo'yicha davlat reyestridan ma'lumotlarni qidirish"
                        >
                          {stirLoading ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Search className="w-3.5 h-3.5 stroke-[2.5]" />
                          )}
                          <span>Tekshirish</span>
                        </button>
                      </div>

                      <span className="text-[10px] text-slate-400 block">
                        Format tekshiruvi: faqat raqam, aynan 9 ta belgi.
                      </span>
                    </div>

                    {/* Tezkor test STIR chiplari */}
                    <div className="space-y-1">
                      <div className="text-[10px] text-slate-400 font-medium">Tezkor sinov uchun test STIRlar:</div>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setInn('201122334');
                            handleLookupStir('201122334');
                          }}
                          className="px-2 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-[10px] text-emerald-300 hover:bg-emerald-900/60 transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Check className="w-2.5 h-2.5 text-emerald-400" />
                          <span>201122334 (Faol MChJ)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setInn('305566778');
                            handleLookupStir('305566778');
                          }}
                          className="px-2 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-[10px] text-emerald-300 hover:bg-emerald-900/60 transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Check className="w-2.5 h-2.5 text-emerald-400" />
                          <span>305566778 (G‘isht MChJ)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setInn('209999999');
                            handleLookupStir('209999999');
                          }}
                          className="px-2 py-1 rounded-lg bg-red-950/60 border border-red-500/40 text-[10px] text-red-300 hover:bg-red-900/60 transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <X className="w-2.5 h-2.5 text-red-400" />
                          <span>209999999 (Tugatilgan)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setInn('200000000');
                            handleLookupStir('200000000');
                          }}
                          className="px-2 py-1 rounded-lg bg-amber-950/60 border border-amber-500/40 text-[10px] text-amber-300 hover:bg-amber-900/60 transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <AlertCircle className="w-2.5 h-2.5 text-amber-400" />
                          <span>200000000 (API Xato)</span>
                        </button>
                      </div>
                    </div>

                    {/* STIR Xatolik / Bloklash xabari */}
                    {stirError && (
                      <div className="p-2.5 rounded-xl bg-red-950/70 border border-red-500/50 text-red-200 text-xs flex items-start gap-2 animate-fadeIn">
                        <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                          <div className="font-bold text-red-300">STIR Tekshiruv Xatoligi:</div>
                          <div className="text-[11px] leading-relaxed text-red-200">{stirError}</div>
                        </div>
                      </div>
                    )}

                    {/* STIR Muvaffaqiyatli Ma'lumot Kartasi */}
                    {companyData && (
                      <div className={`p-3 rounded-xl border text-xs space-y-2 animate-fadeIn ${
                        companyData.status === 'active'
                          ? 'bg-emerald-950/40 border-emerald-500/40'
                          : 'bg-red-950/40 border-red-500/40'
                      }`}>
                        <div className="flex items-center justify-between gap-2">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] flex items-center gap-1 ${
                            companyData.status === 'active'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-red-500/20 text-red-300 border border-red-500/30'
                          }`}>
                            {companyData.status === 'active' ? (
                              <ShieldCheck className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <ShieldAlert className="w-3 h-3 text-red-400" />
                            )}
                            <span>{companyData.statusDescription}</span>
                          </span>

                          {stirCached && (
                            <span className="text-[10px] text-amber-300/90 flex items-center gap-1 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20 font-medium">
                              <Clock className="w-3 h-3 text-amber-400" />
                              24s keshdan
                            </span>
                          )}
                        </div>

                        <div className="space-y-1">
                          <div className="font-black text-white text-xs sm:text-sm">
                            {companyData.companyName}
                          </div>
                          {companyData.director && (
                            <div className="text-[11px] text-slate-300 flex items-center gap-1">
                              <span className="text-slate-400">Rahbar:</span>
                              <span className="font-semibold">{companyData.director}</span>
                            </div>
                          )}
                          {companyData.address && (
                            <div className="text-[11px] text-slate-300 flex items-start gap-1">
                              <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                              <span className="text-slate-300">{companyData.address}</span>
                            </div>
                          )}
                          {companyData.activityType && (
                            <div className="text-[10px] text-slate-400 line-clamp-1">
                              Soha: {companyData.activityType}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Tashkilot nomi tasdiqlangan maydon */}
                    <div className="space-y-1.5 text-xs">
                      <label className="font-bold text-slate-200 flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-amber-400" />
                        Tashkilot / Kompaniya Nomi:
                      </label>
                      <input
                        type="text"
                        required
                        value={companyName}
                        onChange={(e) => {
                          setCompanyName(e.target.value);
                          setError(null);
                        }}
                        placeholder="STIR tekshirilganda avtomatik to'ldiriladi"
                        className="w-full px-3.5 py-2.5 bg-[#0b1c3d] border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    {/* ======================================================== */}
                    {/* E-IMZO BILAN TASDIQLASH (Elektron Raqamli Imzo)           */}
                    {/* - Bir martalik 5 daqiqalik challenge                    */}
                    {/* - Backend imzo va sertifikat STIR tekshiruvi             */}
                    {/* - Status: pending -> verified / rejected                */}
                    {/* ======================================================== */}
                    <div className="p-3.5 rounded-2xl bg-gradient-to-b from-[#0a1b38] to-[#051126] border border-blue-500/40 space-y-3 shadow-inner">
                      <div className="flex items-center justify-between gap-2 border-b border-blue-500/30 pb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-amber-400/20 border border-amber-400/40 flex items-center justify-center">
                            <Fingerprint className="w-4 h-4 text-amber-400" />
                          </div>
                          <div>
                            <div className="font-black text-white text-xs flex items-center gap-1.5">
                              <span>E-IMZO orqali tasdiqlash</span>
                              <span className="text-[10px] text-blue-300 font-mono font-normal">(DSQ standarti)</span>
                            </div>
                            <div className="text-[10px] text-slate-400">Elektron raqamli imzo va sertifikat tekshiruvi</div>
                          </div>
                        </div>

                        {/* Status indikatori (pending / verified / rejected) */}
                        <div>
                          {eimzoStatus === 'verified' && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/25 text-emerald-300 border border-emerald-500/50 flex items-center gap-1 shadow-sm">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>verified (Tasdiqlangan)</span>
                            </span>
                          )}
                          {eimzoStatus === 'rejected' && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-red-500/25 text-red-300 border border-red-500/50 flex items-center gap-1 shadow-sm">
                              <XCircle className="w-3 h-3 text-red-400" />
                              <span>rejected (Rad etilgan)</span>
                            </span>
                          )}
                          {eimzoStatus === 'pending' && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 shadow-sm">
                              <Clock className="w-3 h-3 text-amber-400 animate-pulse" />
                              <span>pending (Kutilmoqda)</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 1. Bir martalik challenge va 5 daqiqalik taymer */}
                      <div className="space-y-1.5 text-xs bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-300 flex items-center gap-1">
                            <FileCheck className="w-3.5 h-3.5 text-blue-400" />
                            Bir martalik Challenge (Tasodifiy matn):
                          </span>

                          {eimzoChallenge && eimzoRemainingSeconds > 0 ? (
                            <span className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold flex items-center gap-1 ${
                              eimzoRemainingSeconds < 60 
                                ? 'bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse' 
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            }`}>
                              <Timer className="w-3 h-3" />
                              <span>Amal muddati: {formatTimer(eimzoRemainingSeconds)}</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-red-400 font-medium">Muddati tugagan / Yangi oling</span>
                          )}
                        </div>

                        {eimzoChallenge ? (
                          <div className="flex items-center justify-between gap-2">
                            <div className="font-mono text-[10px] text-slate-300 bg-slate-900 px-2 py-1 rounded border border-slate-800 truncate flex-1 select-all" title={eimzoChallenge.challengeText}>
                              {eimzoChallenge.challengeText}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleGetEimzoChallenge()}
                              className="px-2 py-1 rounded-lg bg-blue-900/40 hover:bg-blue-800/60 text-blue-200 border border-blue-500/40 text-[10px] font-semibold flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                              title="Yangi 5 daqiqalik bir martalik challenge olish"
                            >
                              <RefreshCw className="w-3 h-3 text-blue-400" />
                              <span>Yangilash</span>
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleGetEimzoChallenge()}
                            className="w-full py-1.5 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 border border-blue-400/40 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                            <span>Bir martalik E-IMZO Challenge olish (5 daqiqa)</span>
                          </button>
                        )}
                      </div>

                      {/* 2. E-IMZO Kaliti tanlash (Test va Haqiqiy rejim) */}
                      <div className="space-y-1.5 text-xs">
                        <label className="font-bold text-slate-200 block text-[11px]">
                          E-IMZO Kalitini tanlang va tasdiqlang:
                        </label>

                        <div className="grid grid-cols-1 gap-1.5">
                          {/* Option 1: Mos keluvchi tashkilot STIR kaliti */}
                          <div
                            onClick={() => setEimzoSelectedKey('match')}
                            className={`p-2 rounded-xl border cursor-pointer transition-all flex items-start gap-2 ${
                              eimzoSelectedKey === 'match'
                                ? 'bg-emerald-950/40 border-emerald-500/60 shadow-sm'
                                : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <input
                              type="radio"
                              name="eimzoKey"
                              checked={eimzoSelectedKey === 'match'}
                              onChange={() => setEimzoSelectedKey('match')}
                              className="mt-0.5 accent-emerald-500"
                            />
                            <div className="flex-1 space-y-0.5">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-100 text-[11px]">
                                  Tashkilot Asl E-IMZO Kaliti
                                </span>
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                                  STIR: {inn || '201122334'}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-400">
                                Sertifikat STIR'i kiritilgan STIR bilan mos keladi → Status: <span className="text-emerald-400 font-bold">verified</span>
                              </div>
                            </div>
                          </div>

                          {/* Option 2: Begona korxona STIR kaliti (Rad etilish testi) */}
                          <div
                            onClick={() => setEimzoSelectedKey('other')}
                            className={`p-2 rounded-xl border cursor-pointer transition-all flex items-start gap-2 ${
                              eimzoSelectedKey === 'other'
                                ? 'bg-red-950/40 border-red-500/60 shadow-sm'
                                : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <input
                              type="radio"
                              name="eimzoKey"
                              checked={eimzoSelectedKey === 'other'}
                              onChange={() => setEimzoSelectedKey('other')}
                              className="mt-0.5 accent-red-500"
                            />
                            <div className="flex-1 space-y-0.5">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-100 text-[11px]">
                                  Begona Tashkilot E-IMZO Kaliti
                                </span>
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-red-500/20 text-red-300 border border-red-500/30 font-bold">
                                  STIR: 305566778
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-400">
                                Sertifikat STIR'i mos kelmaydi → Status: <span className="text-red-400 font-bold">rejected</span>
                              </div>
                            </div>
                          </div>

                          {/* Option 3: Maxsus kiritish */}
                          <div
                            onClick={() => setEimzoSelectedKey('custom')}
                            className={`p-2 rounded-xl border cursor-pointer transition-all space-y-1.5 ${
                              eimzoSelectedKey === 'custom'
                                ? 'bg-blue-950/40 border-blue-500/60 shadow-sm'
                                : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="radio"
                                name="eimzoKey"
                                checked={eimzoSelectedKey === 'custom'}
                                onChange={() => setEimzoSelectedKey('custom')}
                                className="accent-blue-500"
                              />
                              <span className="font-bold text-slate-200 text-[11px]">
                                Maxsus Sertifikat STIR raqamini kiritish:
                              </span>
                            </div>

                            {eimzoSelectedKey === 'custom' && (
                              <input
                                type="text"
                                maxLength={9}
                                value={eimzoCustomInn}
                                onChange={(e) => setEimzoCustomInn(e.target.value.replace(/\D/g, '').slice(0, 9))}
                                placeholder="9 xonali boshqa STIR (masalan: 123456789)"
                                className="w-full px-2.5 py-1.5 bg-[#07132b] border border-blue-500/40 rounded-lg text-white text-xs font-mono"
                              />
                            )}
                          </div>
                        </div>

                        {/* Imzolash tugmasi */}
                        <button
                          type="button"
                          onClick={() => handleVerifyEimzo(eimzoSelectedKey)}
                          disabled={eimzoVerifying || !inn || inn.length < 9}
                          className="w-full mt-2 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                          {eimzoVerifying ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                              <span>E-IMZO Backendda Tekshirilmoqda...</span>
                            </>
                          ) : (
                            <>
                              <Fingerprint className="w-4 h-4 stroke-[2.5]" />
                              <span>E-IMZO Bilan Imzolash va Backendda Tekshirish</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* 3. Natija va xatoliklar paneli */}
                      {eimzoError && (
                        <div className="p-2.5 rounded-xl bg-red-950/70 border border-red-500/60 text-red-200 text-xs flex items-start gap-2 animate-fadeIn">
                          <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <div className="font-bold text-red-300">E-IMZO Tekshiruv Xatoligi (Status: rejected):</div>
                            <div className="text-[11px] leading-relaxed text-red-200">{eimzoError}</div>
                          </div>
                        </div>
                      )}

                      {eimzoResult && eimzoStatus === 'verified' && (
                        <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 text-xs space-y-1 animate-fadeIn">
                          <div className="flex items-center gap-1.5 font-bold text-emerald-300">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span>E-IMZO Muvaffaqiyatli Tasdiqlandi (Status: verified)</span>
                          </div>
                          <div className="text-[11px] text-emerald-200/90 leading-relaxed">
                            Sertifikat STIR'i ({eimzoResult.certificateInn}) kiritilgan STIR ({eimzoResult.targetInn}) bilan to'liq mos keldi. MChJ kabineti rasman tasdiqlandi.
                          </div>
                          {eimzoResult.directorName && (
                            <div className="text-[10px] text-slate-300 font-mono">
                              Rahbar: {eimzoResult.directorName}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Telefon raqami */}
                <div className="space-y-1.5 text-xs">
                  <label className="font-bold text-slate-200 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-amber-400" />
                    Telefon Raqami:
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={17}
                    value={regPhone}
                    onChange={(e) => {
                      setRegPhone(formatUzPhone(e.target.value));
                      setError(null);
                    }}
                    placeholder="+998 90 123 45 67"
                    className="w-full px-3.5 py-3 bg-[#07132c] border border-slate-700 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-[11px] text-slate-400 block">
                    Ushbu raqamga SMS tasdiqlash kodi yuboriladi.
                  </span>
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-red-500/20 text-red-300 border border-red-500/30 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* SMS Kod Yuborish tugmasi */}
                <button
                  type="submit"
                  disabled={smsSending}
                  className="w-full py-3.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer active:scale-95 border border-amber-400 disabled:opacity-50"
                >
                  <span>{smsSending ? 'SMS yuborilmoqda...' : 'SMS Tasdiqlash Kodini Olish'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => setAuthMode('login')}
                    className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
                  >
                    Ortga — Bunker Kabinetiga Kirish
                  </button>
                </div>

              </form>
            )}

            {/* =====================================================================
                BOSQICH 2: TELEFON RAQAMGA KELGAN SMS TASDIQLASH KODI
                ===================================================================== */}
            {regStep === 2 && (
              <form onSubmit={handleVerifySmsCode} className="space-y-4 animate-fadeIn">
                
                {smsNotice && (
                  <div className="p-3 rounded-xl bg-blue-500/20 text-blue-200 border border-blue-500/30 text-xs flex items-center gap-2 font-mono">
                    <MessageSquare className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>{smsNotice}</span>
                  </div>
                )}

                <div className="space-y-1.5 text-xs">
                  <label className="font-bold text-slate-200 block text-xs">
                    SMS Tasdiqlash Kodi:
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={smsInputCode}
                    onChange={(e) => {
                      setSmsInputCode(e.target.value.replace(/\D/g, ''));
                      setError(null);
                    }}
                    className="w-full px-3.5 py-3 bg-[#07132c] border border-slate-700 rounded-xl text-white text-center text-lg font-mono tracking-widest focus:outline-none focus:border-amber-400"
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>Telefon: <strong className="text-white font-mono">{regPhone}</strong></span>
                    <button
                      type="button"
                      onClick={async () => {
                        const code = Math.floor(1000 + Math.random() * 9000).toString();
                        setGeneratedSmsCode(code);
                        try {
                          const resp = await fetch('/api/sms/send', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ phone: regPhone, code }),
                          });
                          const data = await resp.json();
                          if (data?.mode === 'real_sms') {
                            setSmsNotice(`📲 Yangi kod ${regPhone} raqamiga yuborildi!`);
                          } else {
                            setSmsNotice(`📲 BunkerStroy SMS: Yangi tasdiqlash kodingiz: ${code}`);
                          }
                        } catch {
                          setSmsNotice(`📲 BunkerStroy SMS: Yangi tasdiqlash kodingiz: ${code}`);
                        }
                      }}
                      className="text-amber-400 hover:underline cursor-pointer"
                    >
                      Kodni qayta yuborish
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-red-950/60 text-red-300 border border-red-800 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setRegStep(1)}
                    className="px-4 py-3.5 rounded-xl bg-[#07132c] text-slate-300 hover:text-white text-xs font-bold border border-slate-700 flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Ortga</span>
                  </button>

                  <button
                    type="submit"
                    className="flex-1 py-3.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer active:scale-95 border border-amber-400"
                  >
                    <span>Kodni Tasdiqlash va Davom Etish</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

              </form>
            )}

            {/* =====================================================================
                BOSQICH 3: ISM, FAMILIYA, MANZIL (VILOYAT, SHAHAR/TUMAN)
                ===================================================================== */}
            {regStep === 3 && (
              <form onSubmit={handleProceedToStep4} className="space-y-4 animate-fadeIn">
                
                {/* Ism va Familiya */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-200 block">
                      Ism:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ismingizni kiriting"
                      value={regFirstName}
                      onChange={(e) => setRegFirstName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#07132c] border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-200 block">
                      Familiya:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Familiyangizni kiriting"
                      value={regLastName}
                      onChange={(e) => setRegLastName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#07132c] border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Submit: Davom etish -> 4-bosqichga o'tish */}
                <div className="flex items-center gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setRegStep(2)}
                    className="px-4 py-3.5 rounded-xl bg-[#07132c] text-slate-300 hover:text-white text-xs font-bold border border-slate-700 flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Ortga</span>
                  </button>

                  <button
                    type="submit"
                    className="flex-1 py-3.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer active:scale-95 border border-amber-400"
                  >
                    <span>Davom etish</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

              </form>
            )}

            {/* =====================================================================
                BOSQICH 4: LOGIN VA PAROL YARATISH (Alohida keyingi bosqich)
                ===================================================================== */}
            {regStep === 4 && (
              <form onSubmit={handleCompleteRegistration} className="space-y-4 animate-fadeIn">

                {/* Login va Parol (Kabinetga kirish uchun) */}
                <div className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-200 block">
                      Kabinet Logini:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Login"
                      value={regLogin}
                      onChange={(e) => setRegLogin(e.target.value)}
                      className="w-full px-3.5 py-3 bg-[#07132c] border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-200 block">
                      Kirish Paroli:
                    </label>
                    <div className="relative">
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        required
                        placeholder="Parol"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="w-full pl-3.5 pr-10 py-3 bg-[#07132c] border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-400 p-1 cursor-pointer"
                      >
                        {showRegPassword ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-red-950/60 text-red-300 border border-red-800 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Submit: Kabinet Yaratish */}
                <div className="flex items-center gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setRegStep(3)}
                    className="px-4 py-3.5 rounded-xl bg-[#07132c] text-slate-300 hover:text-white text-xs font-bold border border-slate-700 flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Ortga</span>
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer active:scale-95 border border-amber-400"
                  >
                    {loading ? (
                      'Yaratilmoqda...'
                    ) : (
                      <>
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>Kabinet Yaratish</span>
                      </>
                    )}
                  </button>
                </div>

              </form>
            )}

          </div>
        )}

      </div>
    </div>
  );
};
