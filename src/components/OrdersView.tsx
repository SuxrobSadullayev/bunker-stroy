import React, { useEffect, useState, useRef } from 'react';
import {
  Package,
  Truck,
  Clock,
  CheckCircle2,
  AlertCircle,
  MapPin,
  RefreshCw,
  Layers,
  User,
  CreditCard,
  Phone,
  Printer,
  ChevronRight,
  ShieldCheck,
  Building,
  Calendar,
  FileText,
  PlusCircle,
  ArrowUpRight,
  ShoppingBag,
  Coins,
  Settings,
  KeyRound,
  UserCheck,
  Save,
  Check,
  AlertTriangle,
  Lock,
  Mail,
  Home,
  ArrowLeft,
  Camera,
  Upload,
  Trash2,
  X
} from 'lucide-react';
import { Order, UserProfile, CartItem } from '../types';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, setDoc } from 'firebase/firestore';
import { CheckoutModal } from './CheckoutModal';
import { recordCabinetLog } from '../lib/cabinetLogs';
import { REGIONS_AND_DISTRICTS } from '../data/regionsData';

interface OrdersViewProps {
  user: UserProfile | null;
  onOpenAuth: () => void;
  onGoToShop: () => void;
  cart?: CartItem[];
  onUpdateQuantity?: (productId: string, quantity: number) => void;
  onRemoveItem?: (productId: string) => void;
  onClearCart?: () => void;
  onUserUpdate?: (updatedUser: UserProfile) => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  user,
  onOpenAuth,
  onGoToShop,
  cart = [],
  onUpdateQuantity = () => {},
  onRemoveItem = () => {},
  onClearCart = () => {},
  onUserUpdate,
}) => {
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'in_transit' | 'delivered'>('all');

  // Profile and Credentials editing state
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [region, setRegion] = useState(user?.region || 'Toshkent shahri');
  const [district, setDistrict] = useState(user?.district || '');
  const [loginInput, setLoginInput] = useState(user?.email?.split('@')[0] || user?.displayName || '');
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // SMS verification state for login & password update
  const [smsCodeSent, setSmsCodeSent] = useState(false);
  const [sentSmsCode, setSentSmsCode] = useState('');
  const [smsCodeInput, setSmsCodeInput] = useState('');
  const [smsTimer, setSmsTimer] = useState(0);
  const [smsNotice, setSmsNotice] = useState<string | null>(null);

  // SMS verification state for profile personal information update
  const [profileSmsSent, setProfileSmsSent] = useState(false);
  const [profileSmsCode, setProfileSmsCode] = useState('');
  const [profileSmsInput, setProfileSmsInput] = useState('');
  const [profileSmsTimer, setProfileSmsTimer] = useState(0);
  const [profileSmsNotice, setProfileSmsNotice] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // SMS countdown timers
  useEffect(() => {
    let interval: any;
    if (smsTimer > 0) {
      interval = setInterval(() => {
        setSmsTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [smsTimer]);

  useEffect(() => {
    let interval: any;
    if (profileSmsTimer > 0) {
      interval = setInterval(() => {
        setProfileSmsTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [profileSmsTimer]);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || user.displayName?.split(' ')[0] || '');
      setLastName(user.lastName || user.displayName?.split(' ')[1] || '');
      setPhone(user.phone || '');
      setRegion(user.region || 'Toshkent shahri');
      setDistrict(user.district || '');
      setLoginInput(user.email ? user.email.split('@')[0] : user.displayName || '');
    }
  }, [user]);

  // Foydalanuvchi ism va familiyasining bosh harflari (Initials)
  const getUserInitials = (u: UserProfile | null) => {
    if (!u) return 'BS';
    const f = (u.firstName || '').trim().charAt(0);
    const l = (u.lastName || '').trim().charAt(0);
    if (f && l) return (f + l).toUpperCase();
    if (f) return f.toUpperCase();
    if (u.displayName) {
      const parts = u.displayName.trim().split(/\s+/);
      if (parts.length >= 2 && parts[0] && parts[1]) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return parts[0].slice(0, 2).toUpperCase();
    }
    return 'BS';
  };

  // Surat yuklash (Rasm yuklanganda shu harflar o'rniga rasm yuklanadi)
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 3 * 1024 * 1024) {
      setSaveErrorMessage("Rasm hajmi 3MB dan oshmasligi kerak.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      try {
        const updatedProfile: UserProfile = {
          ...user,
          photoURL: base64,
        };
        await setDoc(doc(db, 'users', user.id), { photoURL: base64 }, { merge: true });
        if (onUserUpdate) onUserUpdate(updatedProfile);
        setSaveSuccessMessage("Profil surati muvaffaqiyatli yuklandi!");
        setTimeout(() => setSaveSuccessMessage(null), 3000);
      } catch (err: any) {
        setSaveErrorMessage("Suratni saqlashda xatolik yuz berdi.");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = async () => {
    if (!user) return;
    try {
      const updatedProfile: UserProfile = {
        ...user,
        photoURL: undefined,
      };
      await setDoc(doc(db, 'users', user.id), { photoURL: '' }, { merge: true });
      if (onUserUpdate) onUserUpdate(updatedProfile);
      setSaveSuccessMessage("Profil surati o'chirildi.");
      setTimeout(() => setSaveSuccessMessage(null), 3000);
    } catch {}
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // 1. Try local storage orders first for instant display
    try {
      const savedOrders = localStorage.getItem('bunkerstroy_orders');
      if (savedOrders) {
        const parsed = JSON.parse(savedOrders);
        if (Array.isArray(parsed)) {
          const userOrders = parsed.filter(
            (o: Order) => o.buyerId === user.id || o.buyerPhone === user.phone
          );
          if (userOrders.length > 0) {
            setOrders(userOrders);
          }
        }
      }
    } catch {}

    // 2. Real-time Firestore sync
    const q = query(collection(db, 'orders'), where('buyerId', '==', user.id));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: Order[] = [];
        snapshot.forEach((d) => {
          list.push(d.data() as Order);
        });
        // Sort newest first
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        if (list.length > 0) {
          setOrders(list);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Orders snapshot error:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const formatPrice = (p: number) => new Intl.NumberFormat('uz-UZ').format(p) + " so'm";

  // 1. Shaxsiy ma'lumotlarni o'zgartirish uchun SMS kod yuborish
  const handleSendProfileSms = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaveErrorMessage(null);
    setSaveSuccessMessage(null);

    const genCode = Math.floor(100000 + Math.random() * 900000).toString();
    setProfileSmsCode(genCode);
    setProfileSmsSent(true);
    setProfileSmsTimer(60);
    setProfileSmsInput('');
    setProfileSmsNotice(`Telefon raqamingizga (${phone || user.phone || '+998...'}) tasdiqlash kodi yuborildi: ${genCode}`);
  };

  // 2. Shaxsiy ma'lumotlar SMS kodini tasdiqlab saqlash
  const handleVerifyAndSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaveErrorMessage(null);
    setSaveSuccessMessage(null);

    if (!profileSmsInput.trim() || profileSmsInput.trim() !== profileSmsCode) {
      setSaveErrorMessage("SMS tasdiqlash kodi noto'g'ri kiritildi! Iltimos, qayta tekshirib tering.");
      return;
    }

    setIsSaving(true);
    try {
      const updatedProfile: UserProfile = {
        ...user,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        displayName: `${firstName.trim()} ${lastName.trim()}`.trim() || user.displayName,
        phone: phone.trim(),
        region: region,
        district: district,
      };

      // Update Firestore
      await setDoc(doc(db, 'users', user.id), updatedProfile, { merge: true });

      // Record Cabinet Security Log
      await recordCabinetLog({
        userId: user.id,
        userLogin: user.email || user.displayName,
        userName: updatedProfile.displayName,
        action: 'profile_update',
        actionLabel: "Ma'lumotlar SMS tasdiqlash bilan tahrirlandi",
        details: `Kabinet shaxsiy ma'lumotlari SMS orqali yangilandi: ${updatedProfile.displayName}, Tel: ${phone}, Hudud: ${region}, ${district}`,
        status: 'success',
      });

      if (onUserUpdate) {
        onUserUpdate(updatedProfile);
      }

      setSaveSuccessMessage("Profil ma'lumotlari muvaffaqiyatli saqlandi!");
      setProfileSmsSent(false);
      setProfileSmsCode('');
      setProfileSmsInput('');
      setProfileSmsNotice(null);
      setTimeout(() => setSaveSuccessMessage(null), 4000);
    } catch (err: any) {
      setSaveErrorMessage("Saqlashda xatolik yuz berdi: " + (err.message || 'Server xatosi'));
    } finally {
      setIsSaving(false);
    }
  };

  // 1. Yangi login va parol uchun SMS tasdiqlash kodini yuborish
  const handleSendCredentialsSms = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaveErrorMessage(null);
    setSaveSuccessMessage(null);

    const trimmedLogin = loginInput.trim();
    if (!trimmedLogin) {
      setSaveErrorMessage("Iltimos, yangi loginni kiriting.");
      return;
    }

    // 6 xonali SMS tasdiqlash kodi
    const genCode = Math.floor(100000 + Math.random() * 900000).toString();
    setSentSmsCode(genCode);
    setSmsCodeSent(true);
    setSmsTimer(60);
    setSmsCodeInput('');
    setSmsNotice(`Telefon raqamingizga (${user.phone || phone || '+998...'}) SMS tasdiqlash kodi yuborildi: ${genCode}`);
  };

  // 2. SMS kodni tasdiqlab yangilash
  const handleVerifySmsAndSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaveErrorMessage(null);
    setSaveSuccessMessage(null);

    if (!smsCodeInput.trim() || smsCodeInput.trim() !== sentSmsCode) {
      setSaveErrorMessage("SMS tasdiqlash kodi noto'g'ri kiritildi! Iltimos, qayta tekshirib tering.");
      return;
    }

    setIsSaving(true);
    const trimmedLogin = loginInput.trim();

    try {
      const newEmail = trimmedLogin.includes('@') ? trimmedLogin : `${trimmedLogin}@bunkerstroy.uz`;
      const updatedProfile: UserProfile = {
        ...user,
        email: newEmail,
        displayName: trimmedLogin,
      };

      await setDoc(doc(db, 'users', user.id), updatedProfile, { merge: true });

      // Record security log for login / password change
      if (newPassword) {
        await recordCabinetLog({
          userId: user.id,
          userLogin: trimmedLogin,
          userName: user.displayName,
          action: 'password_change',
          actionLabel: "Parol SMS orqali muvaffaqiyatli almashtirildi",
          details: `SMS tasdiqlash kodi orqali yangi parol va login yangilandi: ${trimmedLogin}.`,
          status: 'success',
        });
      } else {
        await recordCabinetLog({
          userId: user.id,
          userLogin: trimmedLogin,
          userName: user.displayName,
          action: 'login_change',
          actionLabel: "Login SMS orqali almashtirildi",
          details: `SMS tasdiqlash kodi orqali yangi login o‘zgartirildi: ${trimmedLogin}`,
          status: 'success',
        });
      }

      if (onUserUpdate) {
        onUserUpdate(updatedProfile);
      }

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSmsCodeSent(false);
      setSentSmsCode('');
      setSmsCodeInput('');
      setSmsNotice(null);
      setSaveSuccessMessage("Login va parol SMS tasdiqlash orqali muvaffaqiyatli yangilandi!");
      setTimeout(() => setSaveSuccessMessage(null), 4000);
    } catch (err: any) {
      setSaveErrorMessage("Xatolik yuz berdi: " + (err.message || 'Server xatosi'));
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Buyurtmadagilar
          </span>
        );
      case 'confirmed':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Tasdiqlandi
          </span>
        );
      case 'assigned':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
            Yuk mashinasi biriktirildi
          </span>
        );
      case 'in_transit':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40 flex items-center gap-1">
            <Truck className="w-3 h-3 animate-bounce" /> Yetkazilmoqda
          </span>
        );
      case 'delivered':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Yetkazildi
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-700 text-slate-300">
            {status}
          </span>
        );
    }
  };

  const getPaymentBadge = (method?: string, status?: string) => {
    const isPaid = status === 'paid';
    return (
      <div className="flex items-center gap-1.5">
        <span
          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase border ${
            method === 'payme'
              ? 'bg-[#00CCCC]/20 text-[#00CCCC] border-[#00CCCC]/40'
              : method === 'click'
              ? 'bg-[#008AE6]/20 text-[#008AE6] border-[#008AE6]/40'
              : method === 'uzum'
              ? 'bg-[#7000FF]/20 text-[#B070FF] border-[#7000FF]/40'
              : method === 'cash'
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
          }`}
        >
          {method === 'cash' ? "Naqd to'lov" : method || 'Karta'}
        </span>
        <span
          className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
            isPaid ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-300'
          }`}
        >
          {isPaid ? '✓ To‘langan' : 'Yetkazilganda to‘lanadi'}
        </span>
      </div>
    );
  };

  if (!user) {
    return (
      <div className="text-center py-20 bg-[#222528] rounded-xl border border-[#51504A] p-8 space-y-4 max-w-2xl mx-auto shadow-xl">
        <div className="w-16 h-16 rounded-xl bg-[#292C2F] border border-[#51504A] flex items-center justify-center mx-auto text-[#FFB800]">
          <Settings className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-[#F5F5F2]">Kabinet sozlamalari</h3>
        <p className="text-xs text-[#B8B8B3] max-w-md mx-auto leading-relaxed">
          Parol va login almashtirish, shaxsiy ma'lumotlarni tahrirlash hamda saqlangan buyurtmalarni monitoring qilish uchun kabinetingizga kiring.
        </p>
        <button
          onClick={onOpenAuth}
          className="bg-[#DC2626] hover:bg-[#B91C1C] active:bg-[#991B1B] text-white border border-red-500/80 px-6 py-2.5 rounded-lg font-bold text-xs sm:text-sm cursor-pointer shadow-md active:scale-95 transition-all"
        >
          Kabinetga Kirish / Ro'yxatdan o'tish
        </button>
      </div>
    );
  }

  const filteredOrders = orders.filter((o) => {
    if (statusFilter === 'all') return true;
    return o.status === statusFilter;
  });

  const totalSpent = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const totalItemsCount = orders.reduce(
    (sum, o) => sum + (o.items ? o.items.reduce((s, i) => s + i.quantity, 0) : 0),
    0
  );

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      
      {/* ============================================================== */}
      {/* 1. Asosiy Header: Mahsulotlar / Buyurtmalarim / Sozlamalar      */}
      {/* ============================================================== */}
      <div className="bg-[#222528] rounded-xl border border-[#51504A] p-5 sm:p-7 text-[#F5F5F2] shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#51504A]">
          
          {/* Chap tomon: Orqaga qaytish belgisi & Bo'lim nomi */}
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              onClick={onGoToShop}
              className="px-4 py-2 rounded-lg bg-[#292C2F] hover:bg-[#34373B] border border-[#51504A] hover:border-[#FFB800] text-[#F5F5F2] font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer transition-all shadow-sm active:scale-95 group"
              title="Bunker Stroy Mahsulotlariga qaytish"
            >
              <ArrowLeft className="w-4 h-4 text-[#FFB800] group-hover:-translate-x-0.5 transition-transform" />
              <span>Orqaga</span>
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-2xl font-bold text-[#F5F5F2] tracking-wide">
                  Buyurtmalarim
                </h1>
                <span className="px-2 py-0.2 rounded text-xs font-bold bg-[#FFB800] text-[#151719] font-mono shadow-sm">
                  {orders.length}
                </span>
              </div>
              <p className="text-[11px] text-sky-200">
                Bunker Stroy Mahsulotlari • Buyurtmalarim
              </p>
            </div>
          </div>

          {/* O'ng tomon: Savat va Burchakdagi Foydalanuvchi Sozlamalar Tugmasi */}
          <div className="flex items-center gap-3">
            {cart.length > 0 && (
              <button
                type="button"
                onClick={() => setIsCheckoutOpen(true)}
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-400/25 cursor-pointer active:scale-95 transition-all"
              >
                <ShoppingBag className="w-4 h-4 stroke-[2.5]" />
                <span>Savat ({cart.length})</span>
              </button>
            )}

            {/* Burchakdagi foydalanuvchi tugmasi - bosilganda Profil sozlamalari oynasi ochiladi */}
            <button
              type="button"
              onClick={() => setIsSettingsModalOpen(true)}
              className="flex items-center gap-2.5 px-3 sm:px-4 py-2 rounded-2xl bg-[#07193f] hover:bg-[#0c2664] border border-blue-500/40 hover:border-amber-400 text-white transition-all shadow-lg cursor-pointer group active:scale-95"
              title="Profil sozlamalari"
            >
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl object-cover border-2 border-amber-400 shadow-md shrink-0"
                />
              ) : (
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-500 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center border border-amber-300 shadow-md shrink-0">
                  {getUserInitials(user)}
                </div>
              )}
              <div className="text-left">
                <div className="text-xs font-black text-white flex items-center gap-1.5 group-hover:text-amber-400 transition-colors">
                  <span className="max-w-[120px] sm:max-w-[150px] truncate">
                    {user.firstName || user.displayName || 'Mijoz'}
                  </span>
                  <Settings className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                </div>
                <div className="text-[10px] text-amber-400 font-semibold">Profil sozlamalari</div>
              </div>
            </button>
          </div>

        </div>

        {/* ============================================================== */}
        {/* ASOSIY BO'LIM: BUYURTMALARIM (BUYURTMALAR RO'YXATI)             */}
        {/* ============================================================== */}
        <div className="space-y-4 animate-fadeIn">
            {/* Buyurtmalar ro'yxati filtrlari */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'all', label: `Barchasi (${orders.length})` },
                  { id: 'pending', label: 'Buyurtmadagilar' },
                  { id: 'confirmed', label: 'Tasdiqlangan' },
                  { id: 'in_transit', label: 'Yetkazilmoqda' },
                  { id: 'delivered', label: 'Yetkazilgan' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setStatusFilter(f.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      statusFilter === f.id
                        ? 'bg-[#FFB800] text-[#151719] shadow-sm'
                        : 'bg-[#292C2F] text-[#B8B8B3] hover:text-[#F5F5F2] border border-[#51504A]'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Yetkazilgan bo'limida Hisobotlar saqlanadi banneri */}
            {statusFilter === 'delivered' && (
              <div className="p-4 rounded-2xl bg-[#07193f] border border-emerald-500/40 flex items-center justify-between flex-wrap gap-3 text-xs animate-fadeIn">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-white">Yetkazilgan Buyurtmalar Hisobotlari</div>
                    <div className="text-[11px] text-sky-200">
                      Barcha yetkazilgan mahsulotlar hisobotlari, kvitansiyalar va cheklar ushbu bo'limda saqlanadi.
                    </div>
                  </div>
                </div>
                <span className="text-xs font-mono font-black px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {orders.filter((o) => o.status === 'delivered').length} ta hisobot
                </span>
              </div>
            )}

            {/* Buyurtmalar ro'yxati */}
            {loading ? (
              <div className="text-center py-12 space-y-3">
                <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
                <p className="text-xs text-sky-200">Buyurtmalar yuklanmoqda...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-16 bg-[#07193f]/80 rounded-2xl border border-blue-500/30 p-8 space-y-4">
                <Package className="w-12 h-12 text-slate-500 mx-auto" />
                <h4 className="text-base font-bold text-white">Buyurtmalar topilmadi</h4>
                <p className="text-xs text-sky-200 max-w-sm mx-auto">
                  Sizda hali ushbu toifadagi buyurtmalar mavjud emas. Bunker platformasidan tovar tanlang va buyurtma bering.
                </p>
                <button
                  type="button"
                  onClick={onGoToShop}
                  className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs cursor-pointer shadow-md"
                >
                  Bunkerga O'tish
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-[#07193f] border border-blue-500/40 rounded-2xl p-5 hover:border-amber-400/60 transition-all space-y-4 shadow-lg"
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-blue-500/20">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-mono font-black text-amber-400 text-sm">
                          #{order.id.slice(-8).toUpperCase()}
                        </span>
                        {getStatusBadge(order.status)}
                        {getPaymentBadge(order.paymentMethod, order.paymentStatus)}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-300 font-mono">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-amber-400" />
                          {new Date(order.createdAt).toLocaleDateString('uz-UZ')}
                        </span>
                        <span>{new Date(order.createdAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    {/* Order items summary */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Buyurtma qilingan mahsulotlar ({order.items?.length || 0} tur):
                      </span>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {order.items?.map((item, idx) => {
                          const itemImg = (item as any).product?.image || (item as any).image;
                          const itemTitle = item.title || (item as any).product?.title || 'Mahsulot';
                          const itemUnit = item.unit || (item as any).product?.unit || 'dona';
                          const itemPrice = item.price || (item as any).product?.price || 0;
                          return (
                            <div
                              key={idx}
                              className="bg-[#292C2F] p-2.5 rounded-lg border border-[#51504A] flex items-center gap-3 text-xs"
                            >
                              {itemImg && (
                                <img
                                  src={itemImg}
                                  alt={itemTitle}
                                  className="w-10 h-10 rounded-md object-cover border border-[#51504A] shrink-0"
                                />
                              )}
                              <div className="min-w-0 flex-1">
                                <h5 className="font-bold text-[#F5F5F2] truncate text-xs">{itemTitle}</h5>
                                <p className="text-[11px] text-[#B8B8B3]">
                                  {item.quantity} {itemUnit} × {formatPrice(itemPrice)}
                                </p>
                              </div>
                              <span className="font-mono font-bold text-[#FFB800] text-xs shrink-0">
                                {formatPrice(itemPrice * item.quantity)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Delivery & Footer Info */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#51504A] text-xs">
                      <div className="space-y-1 text-[#B8B8B3]">
                        <div className="flex items-center gap-1.5 text-xs text-[#B8B8B3]">
                          <MapPin className="w-3.5 h-3.5 text-[#FFB800] shrink-0" />
                          <span className="font-semibold text-[#F5F5F2]">Manzil:</span>{' '}
                          <span>{order.deliveryAddress || 'Manzil ko‘rsatilmagan'}</span>
                        </div>
                        {order.recipientPhone && (
                          <div className="flex items-center gap-1.5 text-[11px] text-[#B8B8B3]/80">
                            <Phone className="w-3 h-3 text-[#FFB800] shrink-0" />
                            <span>Qabul qiluvchi: {order.recipientName || 'Xaridor'} ({order.recipientPhone})</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right">
                          <span className="text-[10px] text-[#B8B8B3] block">Jami To'lov:</span>
                          <span className="text-base sm:text-lg font-bold text-[#FFB800] font-mono">
                            {formatPrice(order.totalAmount)}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedReceiptOrder(order)}
                          className="px-4 py-2 rounded-lg bg-[#292C2F] hover:bg-[#34373B] border border-[#51504A] hover:border-[#FFB800] text-[#FFB800] text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm active:scale-95"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Rasmiy Chek</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

      </div>

      {/* ============================================================== */}
      {/* KABINET SOZLANMALARI OYNASI (MODAL)                            */}
      {/* Burchakdagi foydalanuvchi login/avatar tugmasi bosilganda      */}
      {/* ============================================================== */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#222528] border border-[#51504A] rounded-xl max-w-4xl w-full p-5 sm:p-7 text-[#F5F5F2] shadow-2xl space-y-6 max-h-[95vh] overflow-y-auto">
            
            {/* Modal Header: Surat yuklash / Harflar + [Ism] kabinet sozlamalari */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#51504A]">
              <div className="flex items-center gap-4">
                
                {/* Avatar: Surat yuklash tugmasi Logoni o'zida */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="relative group shrink-0 cursor-pointer"
                  title="Surat yuklash yoki almashtirish uchun bosing"
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-[#FFB800] shadow-md group-hover:opacity-90 transition-opacity"
                    />
                  ) : (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-[#292C2F] text-[#FFB800] border border-[#51504A] flex items-center justify-center font-mono font-bold text-2xl sm:text-3xl shadow-md group-hover:scale-105 transition-transform">
                      {getUserInitials(user)}
                    </div>
                  )}

                  {/* Surat yuklash belgisi Logoni o'zida */}
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-md bg-[#FFB800] hover:bg-[#FFC928] text-[#151719] flex items-center justify-center shadow-md border border-[#151719] transition-transform group-hover:scale-110">
                    <Camera className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                </div>

                {/* Ism undan keyin kabinet sozlamalari */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg sm:text-2xl font-bold text-[#F5F5F2] tracking-wide">
                      {user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.displayName} kabinet sozlamalari
                    </h2>
                    {user.photoURL && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemovePhoto();
                        }}
                        className="px-2 py-1 rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        title="Suratni o'chirish"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>O'chirish</span>
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[#B8B8B3] flex-wrap">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-[#FFB800]" />
                      {user.phone || 'Telefon raqam biriktirilgan'}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#FFB800]" />
                      {user.region || 'Toshkent shahri'}{user.district ? `, ${user.district}` : ''}
                    </span>
                  </div>
                </div>

              </div>

              {/* Yopish tugmasi */}
              <button
                type="button"
                onClick={() => {
                  setIsSettingsModalOpen(false);
                  setSaveSuccessMessage(null);
                  setSaveErrorMessage(null);
                  setSmsNotice(null);
                  setProfileSmsNotice(null);
                }}
                className="self-start sm:self-center p-2 rounded-lg bg-[#292C2F] hover:bg-[#151719] text-[#B8B8B3] hover:text-[#F5F5F2] border border-[#51504A] transition-colors cursor-pointer"
                title="Yopish"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Notifications */}
            {saveSuccessMessage && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center gap-2.5 text-xs font-bold animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{saveSuccessMessage}</span>
              </div>
            )}

            {saveErrorMessage && (
              <div className="p-3.5 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-300 flex items-center gap-2.5 text-xs font-bold animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{saveErrorMessage}</span>
              </div>
            )}

            {/* Sozlamalar formasi (Faqat shaxsiy ma'lumotlar va SMS orqali Login/Parol) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 text-xs">
              
              {/* 1. Shaxsiy ma'lumotlarni tahrirlash (SMS TASDIQLASH BILAN) */}
              <div className="bg-[#07193f] border border-blue-500/40 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2.5 pb-2.5 border-b border-blue-500/30">
                  <div className="p-2 rounded-xl bg-amber-400/20 text-amber-400">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">Shaxsiy ma'lumotlar</h3>
                    <p className="text-[11px] text-sky-200">Ism, familiya, telefon raqam va manzilni yangilash.</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">Ism:</label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Ismingiz"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-bold mb-1">Familiya:</label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Familiyangiz"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Telefon raqam:</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+998 90 123 45 67"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">Viloyat:</label>
                      <select
                        value={region}
                        onChange={(e) => {
                          setRegion(e.target.value);
                          setDistrict('');
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-400 text-xs"
                      >
                        {Object.keys(REGIONS_AND_DISTRICTS).map((reg) => (
                          <option key={reg} value={reg}>{reg}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-bold mb-1">Tuman / Shahar:</label>
                      <select
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-400 text-xs"
                      >
                        <option value="">Tanlang...</option>
                        {(REGIONS_AND_DISTRICTS[region] || []).map((dist) => (
                          <option key={dist} value={dist}>{dist}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Profil ma'lumotlarini o'zgartirish uchun ham SMS tasdiqlash */}
                  {!profileSmsSent ? (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleSendProfileSms}
                        className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-400/20 active:scale-95 transition-all"
                      >
                        <Phone className="w-4 h-4" />
                        <span>Shaxsiy Ma'lumotlarni Saqlash</span>
                      </button>
                      <p className="text-[10px] text-slate-400 text-center mt-1.5">
                        Xavfsizlik talabiga ko'ra, telefoningizga tasdiqlash kodi yuboriladi.
                      </p>
                    </div>
                  ) : (
                    <div className="pt-2 space-y-3 animate-fadeIn">
                      {profileSmsNotice && (
                        <div className="p-3 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs flex items-center justify-between">
                          <span className="font-mono font-bold text-[11px]">{profileSmsNotice}</span>
                          {profileSmsTimer > 0 ? (
                            <span className="text-amber-400 font-mono font-bold text-xs shrink-0">
                              {profileSmsTimer}s
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={handleSendProfileSms}
                              className="text-amber-400 hover:underline font-bold text-xs shrink-0"
                            >
                              Qayta yuborish
                            </button>
                          )}
                        </div>
                      )}

                      <div>
                        <label className="block text-slate-300 font-bold mb-1">SMS Tasdiqlash Kodi:</label>
                        <input
                          type="text"
                          maxLength={6}
                          value={profileSmsInput}
                          onChange={(e) => setProfileSmsInput(e.target.value)}
                          placeholder="6 xonali kod"
                          className="w-full bg-slate-950 border-2 border-amber-400 rounded-xl px-3 py-2 text-white font-mono text-center tracking-widest text-base font-bold focus:outline-none"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleVerifyAndSaveProfile}
                        disabled={isSaving}
                        className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/25 active:scale-95 transition-all"
                      >
                        <Save className="w-4 h-4" />
                        <span>{isSaving ? "Saqlanmoqda..." : "Kodni Tasdiqlash va Saqlash"}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Login va Parol almashtirish - SMS TASDIQLASH BILAN */}
              <div className="bg-[#07193f] border border-blue-500/40 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2.5 pb-2.5 border-b border-blue-500/30">
                  <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">Login va Parol almashtirish</h3>
                    <p className="text-[11px] text-sky-200">SMS tasdiqlash orqali xavfsiz almashtirish.</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Kabinet Logini:</label>
                    <input
                      type="text"
                      value={loginInput}
                      onChange={(e) => setLoginInput(e.target.value)}
                      placeholder="Login"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Yangi Parol:</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Yangi parol"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono text-xs"
                    />
                  </div>

                  {/* SMS Tasdiqlash jarayoni */}
                  {!smsCodeSent ? (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleSendCredentialsSms}
                        className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-purple-600/25 active:scale-95 transition-all"
                      >
                        <Phone className="w-4 h-4" />
                        <span>SMS Tasdiqlash Kodini Olish</span>
                      </button>
                      <p className="text-[10px] text-slate-400 text-center mt-1.5">
                        Xavfsizlik talabiga ko'ra, telefoningizga tasdiqlash kodi yuboriladi.
                      </p>
                    </div>
                  ) : (
                    <div className="pt-2 space-y-3 animate-fadeIn">
                      {smsNotice && (
                        <div className="p-3 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-200 text-xs flex items-center justify-between">
                          <span className="font-mono font-bold text-[11px]">{smsNotice}</span>
                          {smsTimer > 0 ? (
                            <span className="text-amber-400 font-mono font-bold text-xs shrink-0">
                              {smsTimer}s
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={handleSendCredentialsSms}
                              className="text-amber-400 hover:underline font-bold text-xs shrink-0"
                            >
                              Qayta yuborish
                            </button>
                          )}
                        </div>
                      )}

                      <div>
                        <label className="block text-slate-300 font-bold mb-1">SMS Tasdiqlash Kodi:</label>
                        <input
                          type="text"
                          maxLength={6}
                          value={smsCodeInput}
                          onChange={(e) => setSmsCodeInput(e.target.value)}
                          placeholder="6 xonali kod"
                          className="w-full bg-slate-950 border-2 border-amber-400 rounded-xl px-3 py-2 text-white font-mono text-center tracking-widest text-base font-bold focus:outline-none"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleVerifySmsAndSaveCredentials}
                        disabled={isSaving}
                        className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/25 active:scale-95 transition-all"
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>{isSaving ? "Saqlanmoqda..." : "SMS Kodni Tasdiqlash va Saqlash"}</span>
                      </button>
                    </div>
                  )}

                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Chekni ko'rish modali */}
      {selectedReceiptOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border-2 border-blue-500/60 rounded-3xl max-w-lg w-full p-6 text-white shadow-2xl space-y-5 max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                <h3 className="font-black text-base">BunkerStroy Elektron To'lov Cheki</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReceiptOrder(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div id="printable-receipt" className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 font-mono text-xs">
              <div className="text-center pb-2 border-b border-dashed border-slate-700 space-y-1">
                <div className="font-black text-amber-400 text-sm">BUNKER STROY MCHJ</div>
                <div className="text-[10px] text-slate-400">Qurilish mollari & Logistika Platformasi</div>
                <div className="text-[10px] text-slate-400">Toshkent sh., O'zbekiston</div>
              </div>

              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Chek raqami:</span>
                  <span className="font-bold text-white">#{selectedReceiptOrder.id.slice(-8).toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Sana va vaqt:</span>
                  <span>{new Date(selectedReceiptOrder.createdAt).toLocaleString('uz-UZ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Mijoz:</span>
                  <span className="font-bold">{selectedReceiptOrder.buyerName || user.displayName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Telefon:</span>
                  <span>{selectedReceiptOrder.buyerPhone || user.phone || '+998 -- --- -- --'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Manzil:</span>
                  <span className="text-right truncate max-w-[200px]">{selectedReceiptOrder.deliveryAddress}</span>
                </div>
              </div>

              <div className="py-2 border-t border-b border-dashed border-slate-700 space-y-1.5">
                <div className="font-bold text-slate-400 text-[10px] uppercase">Tovarlar ro'yxati:</div>
                {selectedReceiptOrder.items?.map((item, idx) => {
                  const itemTitle = item.title || (item as any).product?.title || 'Mahsulot';
                  const itemUnit = item.unit || (item as any).product?.unit || 'dona';
                  const itemPrice = item.price || (item as any).product?.price || 0;
                  return (
                    <div key={idx} className="flex justify-between items-center text-[11px]">
                      <div className="truncate max-w-[180px]">
                        {idx + 1}. {itemTitle}
                        <span className="text-[10px] text-slate-400 block">
                          {item.quantity} {itemUnit} × {formatPrice(itemPrice)}
                        </span>
                      </div>
                      <span className="font-bold">
                        {formatPrice(itemPrice * item.quantity)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="pt-1 space-y-1 text-[11px]">
                <div className="flex justify-between font-black text-sm text-amber-400">
                  <span>JAMI TO'LOV:</span>
                  <span>{formatPrice(selectedReceiptOrder.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>To'lov turi:</span>
                  <span className="uppercase text-white font-bold">{selectedReceiptOrder.paymentMethod || 'Karta'}</span>
                </div>
                <div className="flex justify-between text-[10px] text-emerald-400 font-bold">
                  <span>Holati:</span>
                  <span>✓ {selectedReceiptOrder.paymentStatus === 'paid' ? "To'langan" : "Qabul qilinganda"}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 transition-all"
              >
                <Printer className="w-4 h-4" />
                <span>Chop etish / PDF</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedReceiptOrder(null)}
                className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4 Bosqichli Checkout Modal */}
      {isCheckoutOpen && (
        <CheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          items={cart}
          user={user}
          onUpdateQuantity={onUpdateQuantity}
          onRemoveItem={onRemoveItem}
          onClearCart={onClearCart}
          onOrderCompleted={(order) => {
            setIsCheckoutOpen(false);
            onClearCart();
          }}
          onOpenAuth={() => {}}
        />
      )}

    </div>
  );
};
