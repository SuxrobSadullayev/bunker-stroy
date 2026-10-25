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
  ShoppingCart,
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
  X,
  HardHat,
  Globe,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  LogOut,
  Plus,
  Minus
} from 'lucide-react';
import { Order, UserProfile, CartItem, Product } from '../types';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, setDoc } from 'firebase/firestore';
import { CheckoutModal } from './CheckoutModal';
import { Marketplace } from './Marketplace';
import { GlobalBunkerHub } from './GlobalBunkerHub';
import { recordCabinetLog } from '../lib/cabinetLogs';
import { REGIONS_AND_DISTRICTS } from '../data/regionsData';
import { INITIAL_PRODUCTS } from '../data/mockData';
import { isOrderAfterReset } from '../data/supplierReportsData';

interface OrdersViewProps {
  user: UserProfile | null;
  products?: Product[];
  onAddToCart?: (product: Product, quantity?: number) => void;
  onOpenAuth: () => void;
  onGoToShop: () => void;
  onLogout?: () => void;
  cart?: CartItem[];
  onUpdateQuantity?: (productId: string, quantity: number) => void;
  onRemoveItem?: (productId: string) => void;
  onClearCart?: () => void;
  onUserUpdate?: (updatedUser: UserProfile) => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  user,
  products = INITIAL_PRODUCTS,
  onAddToCart = () => {},
  onOpenAuth,
  onGoToShop,
  onLogout,
  cart = [],
  onUpdateQuantity = () => {},
  onRemoveItem = () => {},
  onClearCart = () => {},
  onUserUpdate,
}) => {
  // Mijoz kabinetidagi 5 ta asosiy bo'lim:
  // 1. 'bunker' (Bunker - mahsulotlar katalogi)
  // 2. 'global_bunker' (Global bunker - xalqaro ta'minot)
  // 3. 'savat' (Savat)
  // 4. 'orders' (Buyurtmalarim)
  // 5. 'settings' (Sozlamalar)
  const [activeSection, setActiveSection] = useState<'bunker' | 'global_bunker' | 'savat' | 'orders' | 'settings'>('bunker');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<Order | null>(null);
  const [selectedMapOrder, setSelectedMapOrder] = useState<Order | null>(null);
  const [orderMapType, setOrderMapType] = useState<'m' | 'k'>('m');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'in_transit' | 'delivered'>('all');

  const extractCoordsFromAddress = (addr?: string): { lat: number; lng: number } | null => {
    if (!addr) return null;
    const match = addr.match(/\[Google Maps:\s*([-+]?\d*\.?\d+)\s*,\s*([-+]?\d*\.?\d+)\]/i);
    if (match && match[1] && match[2]) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
    }
    return null;
  };

  const formatRegionAndDistrictOnly = (addr?: string): string => {
    if (!addr) return 'Manzil ko‘rsatilmagan';
    const cleaned = addr.replace(/\[Google Maps:.*?\]/gi, '').trim();
    const parts = cleaned
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0]}, ${parts[1]}`;
    }
    return cleaned || 'Manzil ko‘rsatilmagan';
  };

  const formatCleanFullAddress = (addr?: string): string => {
    if (!addr) return 'Manzil ko‘rsatilmagan';
    return addr.replace(/\[Google Maps:.*?\]/gi, '').trim() || 'Manzil ko‘rsatilmagan';
  };

  // Profile and Credentials editing state
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [region, setRegion] = useState(user?.region || '');
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
      setRegion(user.region || '');
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

    const syncLocalAndFirestore = (firestoreOrders?: Order[]) => {
      try {
        const savedOrders = localStorage.getItem('bunkerstroy_orders');
        const localParsed: Order[] = savedOrders ? JSON.parse(savedOrders) : [];
        const localUserOrders = Array.isArray(localParsed)
          ? localParsed.filter(
              (o: Order) => o && isOrderAfterReset(o) && (o.buyerId === user.id || o.buyerPhone === user.phone)
            )
          : [];

        const validFsOrders = Array.isArray(firestoreOrders)
          ? firestoreOrders.filter((fo) => fo && isOrderAfterReset(fo))
          : [];

        if (validFsOrders.length > 0) {
          const mergedMap = new Map<string, Order>();
          validFsOrders.forEach((fo) => mergedMap.set(fo.id, fo));
          localUserOrders.forEach((lo) => {
            const existing = mergedMap.get(lo.id);
            if (!existing) {
              mergedMap.set(lo.id, lo);
            } else {
              const localTime = lo.updatedAt ? new Date(lo.updatedAt).getTime() : 0;
              const fsTime = existing.updatedAt ? new Date(existing.updatedAt).getTime() : 0;
              if (localTime >= fsTime) {
                mergedMap.set(lo.id, lo);
              }
            }
          });
          const merged = Array.from(mergedMap.values());
          merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setOrders(merged);
        } else {
          localUserOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setOrders(localUserOrders);
        }
      } catch {}
    };

    // 1. Try local storage orders first for instant display
    syncLocalAndFirestore();

    const handleLocalOrdersEvent = () => {
      syncLocalAndFirestore();
    };
    window.addEventListener('storage', handleLocalOrdersEvent);
    window.addEventListener('bunkerstroy_orders_updated', handleLocalOrdersEvent);

    // 2. Real-time Firestore sync
    const q = query(collection(db, 'orders'), where('buyerId', '==', user.id));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: Order[] = [];
        snapshot.forEach((d) => {
          const ord = d.data() as Order;
          if (isOrderAfterReset(ord)) {
            list.push(ord);
          }
        });
        syncLocalAndFirestore(list);
        setLoading(false);
      },
      (error) => {
        console.error('Orders snapshot error:', error);
        setLoading(false);
      }
    );

    return () => {
      window.removeEventListener('storage', handleLocalOrdersEvent);
      window.removeEventListener('bunkerstroy_orders_updated', handleLocalOrdersEvent);
      unsubscribe();
    };
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

      // Update bunkerstroy_customers in localStorage so regional customer counts stay in sync
      try {
        const savedCust = localStorage.getItem('bunkerstroy_customers');
        const custList = savedCust ? JSON.parse(savedCust) : [];
        if (Array.isArray(custList)) {
          const updatedCustList = custList.map((c: any) =>
            c && c.id === user.id ? { ...c, ...updatedProfile } : c
          );
          localStorage.setItem('bunkerstroy_customers', JSON.stringify(updatedCustList));
          window.dispatchEvent(new Event('storage'));
        }
      } catch {}

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
      };

      // Update bunkerstroy_customers in localStorage so login works with new login & password
      try {
        const savedCust = localStorage.getItem('bunkerstroy_customers');
        const parsedCust = savedCust ? JSON.parse(savedCust) : [];
        const custList = Array.isArray(parsedCust) ? parsedCust : [];
        let foundInCust = false;
        const nextCustList = custList.map((c: any) => {
          if (
            c?.id === user.id ||
            (c?.email && user?.email && String(c.email).toLowerCase() === String(user.email).toLowerCase())
          ) {
            foundInCust = true;
            return {
              ...c,
              ...updatedProfile,
              login: trimmedLogin,
              email: newEmail,
              password: newPassword.trim() ? newPassword.trim() : c.password,
            };
          }
          return c;
        });
        if (!foundInCust) {
          nextCustList.unshift({
            ...updatedProfile,
            login: trimmedLogin,
            email: newEmail,
            password: newPassword.trim() || '1234',
          });
        }
        localStorage.setItem('bunkerstroy_customers', JSON.stringify(nextCustList));
        window.dispatchEvent(new CustomEvent('bunkerstroy_customers_updated'));
      } catch {}

      const firestoreUpdateData: Record<string, any> = {
        ...updatedProfile,
        login: trimmedLogin,
      };
      if (newPassword.trim()) {
        firestoreUpdateData.password = newPassword.trim();
      }
      await setDoc(doc(db, 'users', user.id), firestoreUpdateData, { merge: true });

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
      case 'confirmed':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Buyurtmadagilar
          </span>
        );
      case 'assigned':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/25 text-amber-300 border border-amber-400/50 flex items-center gap-1.5 shadow-sm">
            <Package className="w-3.5 h-3.5 animate-pulse text-[#FFB800]" /> Mahsulot yuklash jarayonida
          </span>
        );
      case 'in_transit':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40 flex items-center gap-1.5 shadow-sm">
            <Truck className="w-3.5 h-3.5 animate-bounce" /> Yetkazilmoqda
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
    if (statusFilter === 'pending') return o.status === 'pending' || o.status === 'confirmed';
    if (statusFilter === 'confirmed') return o.status === 'assigned';
    return o.status === statusFilter;
  });

  const totalSpent = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const totalItemsCount = orders.reduce(
    (sum, o) => sum + (o.items ? o.items.reduce((s, i) => s + i.quantity, 0) : 0),
    0
  );

  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalCartSum = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  // Bildirishnoma: Mijoz buyurtmasi Yuklash jarayonida ('assigned'), Manzilga yuborildi ('in_transit') yoki yangi buyurtma bo'lganda Buyurtmalarim bo'limi rangi tovlanadi
  const activeAlertOrders = orders.filter(
    (o) => o.status === 'assigned' || o.status === 'in_transit' || o.status === 'pending' || o.status === 'confirmed'
  );
  const loadingOrdersCount = orders.filter((o) => o.status === 'assigned').length;
  const inTransitWithPhoneOrders = orders.filter((o) => o.status === 'in_transit' && o.driverPhone);
  const hasOrdersAlert = activeAlertOrders.length > 0;

  return (
    <div className="min-h-screen w-full bg-white text-[#F5F5F2] flex flex-col">
      {/* ============================================================== */}
      {/* MIJOZ KABINETI YUQORI PANELI (HEADER)                          */}
      {/* ============================================================== */}
      <header className="sticky top-0 z-40 w-full brushed-steel-header border-b border-[#1E3A6D] text-[#F5F5F2]">
        <div className="h-[2px] w-full hazard-stripe-sm opacity-80" />
        <div className="w-full px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-3">
          {/* Chap tomon: Mobil menyu tugmasi + Logo */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg bg-[#071326] hover:bg-[#0F2547] text-[#FFB800] border border-[#1E3A6D] hover:border-[#FFB800] transition-colors cursor-pointer"
              title="Bo‘limlar menyusi"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div
              onClick={() => setActiveSection('bunker')}
              className="flex items-center gap-3 cursor-pointer group select-none"
            >
              <div className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-lg bg-[#071326] border border-[#1E3A6D] group-hover:border-[#FFB800] flex items-center justify-center transition-all shadow-md">
                <div className="absolute top-1 left-1 industrial-rivet" />
                <div className="absolute top-1 right-1 industrial-rivet" />
                <HardHat className="w-5 h-5 sm:w-6 sm:h-6 text-[#FFB800] stroke-[2.2]" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-lg sm:text-xl font-black tracking-wider leading-none">
                    <span className="text-[#FFB800]">BUNKER</span>{' '}
                    <span className="text-[#F5F5F2]">STROY</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* O'ng tomon: Savat, Mijoz Ismi (bosilganda Sozlamalar ochiladi) va Kabinetdan Chiqish */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Savat tezkor tugmasi - savatda mahsulot bo'lganda yashil tovlanish */}
            <button
              type="button"
              onClick={() => setActiveSection('savat')}
              className={`relative flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                totalCartItems > 0
                  ? 'bg-emerald-950/90 border-emerald-400 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.55)] ring-1 ring-emerald-400/50'
                  : activeSection === 'savat'
                  ? 'bg-[#FFB800] text-[#0A1931] border-[#FFC928] shadow-md'
                  : 'bg-[#071326] text-[#F5F5F2] border-[#1E3A6D] hover:border-[#FFB800]'
              }`}
              title="Savat bo'limiga o'tish"
            >
              <ShoppingCart className={`w-4 h-4 ${
                totalCartItems > 0
                  ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]'
                  : activeSection === 'savat'
                  ? 'text-[#0A1931]'
                  : 'text-[#FFB800]'
              }`} />
              <span className="hidden sm:inline">Savat</span>
              {totalCartItems > 0 && (
                <span className="bg-emerald-500 text-[#0A1931] px-1.5 py-0.5 rounded-md text-[10px] font-mono font-black border border-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.8)] animate-pulse">
                  {totalCartItems}
                </span>
              )}
            </button>

            {/* Mijoz ismi tugmasi (ustiga bosilganda Sozlamalar bo'limi ochiladi) */}
            <button
              type="button"
              onClick={() => setActiveSection('settings')}
              className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                activeSection === 'settings'
                  ? 'bg-[#0F2547] border-[#FFB800] text-white shadow-md'
                  : 'bg-[#071326] hover:bg-[#0F2547] border-[#1E3A6D] hover:border-[#FFB800] text-[#F5F5F2]'
              }`}
              title="Sozlamalar bo'limi"
            >
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-cover border border-[#FFB800] shrink-0"
                />
              ) : (
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#0A1931] text-[#FFB800] font-mono font-black text-xs flex items-center justify-center border border-[#FFB800]/60 shrink-0">
                  {getUserInitials(user)}
                </div>
              )}
              <div className="text-left">
                <div className="text-xs sm:text-sm font-bold text-[#F5F5F2] max-w-[140px] truncate">
                  {user.firstName || user.displayName}
                </div>
              </div>
            </button>

            {/* Kabinetdan chiqish tugmasi */}
            <button
              type="button"
              onClick={() => {
                if (onLogout) {
                  onLogout();
                } else {
                  onGoToShop();
                }
              }}
              className="px-3.5 sm:px-4 py-2 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] active:bg-[#991B1B] text-white border border-red-500/80 text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95"
              title="Kabinetdan chiqish"
            >
              <LogOut className="w-4 h-4 stroke-[2.3]" />
              <span>Chiqish</span>
            </button>
          </div>
        </div>
      </header>

      {/* ============================================================== */}
      {/* ASOSIY TANA: CHAPDA YIG'ILADIGAN YON MENYU + O'NGDA BO'LIM     */}
      {/* ============================================================== */}
      <main className="flex-1 w-full px-3 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col lg:flex-row items-start gap-6">

          {/* MOBIL YON MENYU (SLIDE DRAWER) */}
          {isMobileSidebarOpen && (
            <div
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 lg:hidden flex"
              onClick={() => setIsMobileSidebarOpen(false)}
            >
              <div
                className="w-72 max-w-[85vw] h-full bg-[#0A1931] border-r-2 border-[#1E3A6D] p-4 flex flex-col justify-between shadow-2xl animate-fadeIn overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="space-y-4">
                  <div className="pb-3 border-b border-[#1E3A6D] flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSection('settings');
                        setIsMobileSidebarOpen(false);
                      }}
                      className="text-sm font-black text-[#FFB800] hover:text-amber-300 tracking-wider font-mono flex items-center gap-2 cursor-pointer"
                      title="Sozlamalar bo'limini ochish"
                    >
                      <User className="w-4 h-4 text-[#FFB800]" />
                      <span className="truncate max-w-[180px]">{user.firstName || user.displayName}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsMobileSidebarOpen(false)}
                      className="p-1.5 rounded-lg bg-[#071326] text-sky-200 hover:text-white border border-[#1E3A6D] cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <nav className="flex flex-col gap-2">
                    {/* 1. Mahsulotlar */}
                    <button
                      type="button"
                      onClick={() => { setActiveSection('bunker'); setIsMobileSidebarOpen(false); }}
                      className={`w-full flex items-center justify-between p-3 rounded-lg text-xs font-bold transition-all text-left border cursor-pointer ${
                        activeSection === 'bunker'
                          ? 'bg-[#FFB800] text-[#0A1931] border-[#FFC928] shadow-md'
                          : 'bg-[#071326] text-sky-100 hover:text-white hover:bg-[#0F2547] border-[#1E3A6D]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <HardHat className={`w-4 h-4 stroke-[2.2] ${activeSection === 'bunker' ? 'text-[#0A1931]' : 'text-[#FFB800]'}`} />
                        <span className="block font-bold">Mahsulotlar</span>
                      </div>
                    </button>

                    {/* 2. B2B Bunker */}
                    <button
                      type="button"
                      onClick={() => { setActiveSection('global_bunker'); setIsMobileSidebarOpen(false); }}
                      className={`w-full flex items-center justify-between p-3 rounded-lg text-xs font-bold transition-all text-left border cursor-pointer ${
                        activeSection === 'global_bunker'
                          ? 'bg-[#1d4ed8] text-white border-[#60a5fa] shadow-md'
                          : 'bg-[#071326] text-sky-100 hover:text-sky-300 hover:bg-[#0F2547] border-[#1E3A6D]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Globe className={`w-4 h-4 stroke-[2.2] ${activeSection === 'global_bunker' ? 'text-white' : 'text-sky-400'}`} />
                        <span className="block font-bold">B2B Bunker</span>
                      </div>
                    </button>

                    {/* 3. Savat */}
                    <button
                      type="button"
                      onClick={() => { setActiveSection('savat'); setIsMobileSidebarOpen(false); }}
                      className={`w-full flex items-center justify-between p-3 rounded-lg text-xs font-bold transition-all text-left border cursor-pointer ${
                        totalCartItems > 0
                          ? 'bg-emerald-950/90 text-emerald-300 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.55)] ring-1 ring-emerald-400/50'
                          : activeSection === 'savat'
                          ? 'bg-emerald-600 text-white border-emerald-400 shadow-md'
                          : 'bg-[#071326] text-sky-100 hover:text-emerald-300 hover:bg-[#0F2547] border-[#1E3A6D]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <ShoppingCart className={`w-4 h-4 stroke-[2.2] ${
                          totalCartItems > 0
                            ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]'
                            : activeSection === 'savat'
                            ? 'text-white'
                            : 'text-emerald-400'
                        }`} />
                        <span className="block font-bold">Savat</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        totalCartItems > 0
                          ? 'bg-emerald-500 text-[#0A1931] font-black border border-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.8)] animate-pulse'
                          : activeSection === 'savat'
                          ? 'bg-[#022c22] text-emerald-300'
                          : 'bg-[#0F2547] text-sky-200'
                      }`}>
                        {totalCartItems}
                      </span>
                    </button>

                    {/* 4. Buyurtmalarim */}
                    <button
                      type="button"
                      onClick={() => { setActiveSection('orders'); setIsMobileSidebarOpen(false); }}
                      className={`w-full flex items-center justify-between p-3 rounded-lg text-xs font-bold transition-all text-left border cursor-pointer ${
                        activeSection === 'orders'
                          ? 'bg-[#FFB800] text-[#0A1931] border-[#FFC928] shadow-md'
                          : hasOrdersAlert
                          ? 'bg-gradient-to-r from-amber-500/30 via-emerald-500/25 to-amber-500/30 text-amber-200 border-amber-400 shadow-[0_0_20px_rgba(255,184,0,0.6)] ring-1 ring-amber-400/60 animate-pulse'
                          : 'bg-[#071326] text-sky-100 hover:text-white hover:bg-[#0F2547] border-[#1E3A6D]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Package className={`w-4 h-4 stroke-[2.2] ${activeSection === 'orders' ? 'text-[#0A1931]' : 'text-[#FFB800]'}`} />
                        <span className="block font-bold">Buyurtmalarim</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        activeSection === 'orders'
                          ? 'bg-[#0A1931] text-[#FFB800]'
                          : hasOrdersAlert
                          ? 'bg-[#FFB800] text-[#0A1931] font-black shadow-[0_0_10px_rgba(255,184,0,0.9)]'
                          : 'bg-[#0F2547] text-sky-200'
                      }`}>
                        {orders.length}
                      </span>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}

          {/* DESKTOP YON TARAFI: YIG'IB QO'YILADIGAN BO'LIMLAR MENYUSI */}
          <aside className={`hidden lg:block transition-all duration-300 shrink-0 ${isSidebarCollapsed ? 'w-20' : 'w-72'} sticky top-24 z-10`}>
            <div className="bg-[#0A1931] border-2 border-[#1E3A6D] rounded-xl p-3 sm:p-4 shadow-xl space-y-3">
              {/* Ism (bosilganda Sozlamalar ochiladi) va Yig'ish / Ochish tugmasi */}
              <div className="pb-3 border-b border-[#1E3A6D] flex items-center justify-between select-none">
                {!isSidebarCollapsed && (
                  <button
                    type="button"
                    onClick={() => setActiveSection('settings')}
                    className="text-sm font-black text-[#FFB800] hover:text-amber-300 tracking-wider font-mono transition-colors flex items-center gap-2 cursor-pointer truncate max-w-[190px]"
                    title="Sozlamalar bo'limini ochish"
                  >
                    <User className="w-4 h-4 text-[#FFB800] shrink-0" />
                    <span className="truncate">{user.firstName || user.displayName}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                  title={isSidebarCollapsed ? "Bo'limlarni ochish (kengaytirish)" : "Bo'limlarni yig‘ib qo‘yish"}
                  className={`p-1.5 rounded-lg bg-[#071326] hover:bg-[#0F2547] text-[#FFB800] border border-[#1E3A6D] hover:border-[#FFB800] transition-colors cursor-pointer ${isSidebarCollapsed ? 'mx-auto' : 'ml-auto'}`}
                >
                  {isSidebarCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
                </button>
              </div>

              {/* 4 ta Bo'lim (Sozlamalar ism ustiga bosilganda ochiladi) */}
              <nav className="flex flex-col gap-2">
                {/* 1. Mahsulotlar */}
                <button
                  type="button"
                  onClick={() => setActiveSection('bunker')}
                  title="Mahsulotlar"
                  className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-3' : 'justify-between p-3'} rounded-lg text-xs font-bold transition-all text-left cursor-pointer border ${
                    activeSection === 'bunker'
                      ? 'bg-[#FFB800] text-[#0A1931] border-[#FFC928] shadow-md'
                      : 'bg-[#071326] text-sky-100 hover:text-white hover:bg-[#0F2547] border-[#1E3A6D]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <HardHat className={`w-4 h-4 stroke-[2.2] shrink-0 ${activeSection === 'bunker' ? 'text-[#0A1931]' : 'text-[#FFB800]'}`} />
                    {!isSidebarCollapsed && (
                      <span className="block font-bold">Mahsulotlar</span>
                    )}
                  </div>
                </button>

                {/* 2. B2B Bunker */}
                <button
                  type="button"
                  onClick={() => setActiveSection('global_bunker')}
                  title="B2B Bunker"
                  className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-3' : 'justify-between p-3'} rounded-lg text-xs font-bold transition-all text-left cursor-pointer border ${
                    activeSection === 'global_bunker'
                      ? 'bg-[#1d4ed8] text-white border-[#60a5fa] shadow-md'
                      : 'bg-[#071326] text-sky-100 hover:text-sky-300 hover:bg-[#0F2547] border-[#1E3A6D]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Globe className={`w-4 h-4 stroke-[2.2] shrink-0 ${activeSection === 'global_bunker' ? 'text-white' : 'text-sky-400'}`} />
                    {!isSidebarCollapsed && (
                      <span className="block font-bold">B2B Bunker</span>
                    )}
                  </div>
                </button>

                {/* 3. Savat - savatda mahsulot bo'lganda yashil tovlanish */}
                <button
                  type="button"
                  onClick={() => setActiveSection('savat')}
                  title="Savat"
                  className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-3' : 'justify-between p-3'} rounded-lg text-xs font-bold transition-all text-left cursor-pointer border ${
                    totalCartItems > 0
                      ? 'bg-emerald-950/90 text-emerald-300 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.55)] ring-1 ring-emerald-400/50'
                      : activeSection === 'savat'
                      ? 'bg-emerald-600 text-white border-emerald-400 shadow-md'
                      : 'bg-[#071326] text-sky-100 hover:text-emerald-300 hover:bg-[#0F2547] border-[#1E3A6D]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <ShoppingCart className={`w-4 h-4 stroke-[2.2] shrink-0 ${
                      totalCartItems > 0
                        ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]'
                        : activeSection === 'savat'
                        ? 'text-white'
                        : 'text-emerald-400'
                    }`} />
                    {!isSidebarCollapsed && (
                      <span className="block font-bold">Savat</span>
                    )}
                  </div>
                  {!isSidebarCollapsed && (
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      totalCartItems > 0
                        ? 'bg-emerald-500 text-[#0A1931] font-black border border-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.8)] animate-pulse'
                        : activeSection === 'savat'
                        ? 'bg-[#022c22] text-emerald-300'
                        : 'bg-[#0F2547] text-sky-200'
                    }`}>
                      {totalCartItems}
                    </span>
                  )}
                </button>

                {/* 4. Buyurtmalarim */}
                <button
                  type="button"
                  onClick={() => setActiveSection('orders')}
                  title="Buyurtmalarim"
                  className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-3' : 'justify-between p-3'} rounded-lg text-xs font-bold transition-all text-left cursor-pointer border ${
                    activeSection === 'orders'
                      ? 'bg-[#FFB800] text-[#0A1931] border-[#FFC928] shadow-md'
                      : hasOrdersAlert
                      ? 'bg-gradient-to-r from-amber-500/30 via-emerald-500/25 to-amber-500/30 text-amber-200 border-amber-400 shadow-[0_0_20px_rgba(255,184,0,0.6)] ring-1 ring-amber-400/60 animate-pulse'
                      : 'bg-[#071326] text-sky-100 hover:text-white hover:bg-[#0F2547] border-[#1E3A6D]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Package className={`w-4 h-4 stroke-[2.2] shrink-0 ${activeSection === 'orders' ? 'text-[#0A1931]' : 'text-[#FFB800]'}`} />
                    {!isSidebarCollapsed && (
                      <span className="block font-bold">Buyurtmalarim</span>
                    )}
                  </div>
                  {!isSidebarCollapsed && (
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      activeSection === 'orders'
                        ? 'bg-[#0A1931] text-[#FFB800]'
                        : hasOrdersAlert
                        ? 'bg-[#FFB800] text-[#0A1931] font-black shadow-[0_0_10px_rgba(255,184,0,0.9)]'
                        : 'bg-[#0F2547] text-sky-200'
                    }`}>
                      {orders.length}
                    </span>
                  )}
                </button>
              </nav>
            </div>
          </aside>

          {/* O'NG TOMON: TANLANGAN BO'LIM TARKIBI */}
          <div className="flex-1 min-w-0 w-full space-y-4">

            {/* BILDIRISHNOMA (ALERT): Buyurtma Yuklash jarayonida yoki Yetkazib beruvchi raqami biriktirilganda */}
            {(loadingOrdersCount > 0 || inTransitWithPhoneOrders.length > 0) && (
              <div
                onClick={() => setActiveSection('orders')}
                className="p-3.5 sm:p-4 rounded-2xl bg-[#0A1931] border-2 border-[#FFB800] shadow-[0_0_24px_rgba(255,184,0,0.35)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer transition-all hover:scale-[1.005]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FFB800] text-slate-950 flex items-center justify-center font-black shrink-0 animate-bounce shadow-lg">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-black text-white flex items-center gap-2 flex-wrap">
                      <span>Buyurtma Holati Bildirishnomasi!</span>
                      {loadingOrdersCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-[#FFB800] text-slate-950">
                          Mahsulot yuklash jarayonida: {loadingOrdersCount} ta
                        </span>
                      )}
                      {inTransitWithPhoneOrders.length > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-emerald-400 text-slate-950">
                          Yetkazilmoqda • Bog‘lanish uchun tel nomer: {inTransitWithPhoneOrders[0].driverPhone}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-amber-200 mt-0.5">
                      {inTransitWithPhoneOrders.length > 0
                        ? `Buyurtmangiz Yetkazilmoqda! Bog‘lanish uchun tel nomer: ${inTransitWithPhoneOrders[0].driverPhone}`
                        : "Mahsulot yuklash jarayonida!"}
                    </p>
                  </div>
                </div>
                <span className="px-3.5 py-2 rounded-xl bg-[#FFB800] text-slate-950 font-black text-xs shrink-0 self-start sm:self-center shadow-md">
                  Buyurtmalarimni ko‘rish →
                </span>
              </div>
            )}

            {/* 1-BO'LIM: BUNKER (MAHSULOTLAR KATALOGI — FAQAT B2C MAHSULOTLAR, B2B BUNKER MAHSULOTLARI EMAS) */}
            {activeSection === 'bunker' && (
              <div className="animate-fadeIn">
                <Marketplace
                  products={products.filter((p) => p.supplierCabinetType !== 'manufacturer')}
                  onAddToCart={onAddToCart}
                  currentUser={user}
                />
              </div>
            )}

            {/* 2-BO'LIM: B2B BUNKER (FAQAT B2B TA'MINOTCHILAR MAHSULOTLARI) */}
            {activeSection === 'global_bunker' && (
              <div className="animate-fadeIn">
                <Marketplace
                  products={products.filter((p) => p.supplierCabinetType === 'manufacturer')}
                  onAddToCart={onAddToCart}
                  currentUser={user}
                />
              </div>
            )}

            {/* 3-BO'LIM: SAVAT */}
            {activeSection === 'savat' && (
              <div className="bg-[#0A1931] rounded-xl border-2 border-[#1E3A6D] p-5 sm:p-7 text-[#F5F5F2] shadow-xl space-y-6 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1E3A6D]">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                      <ShoppingCart className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-2xl font-bold text-[#F5F5F2]">
                        Savat ({totalCartItems})
                      </h2>
                      <p className="text-xs text-sky-200">
                        Tanlangan qurilish mahsulotlari va tezkor buyurtma rasmiylashtirish
                      </p>
                    </div>
                  </div>
                </div>

                {cart.length === 0 ? (
                  <div className="text-center py-16 bg-[#071326] rounded-2xl border border-[#1E3A6D] p-8 space-y-4">
                    <ShoppingCart className="w-12 h-12 text-sky-200 mx-auto" />
                    <h4 className="text-base font-bold text-white">Savatingiz hozircha bo‘sh</h4>
                    <p className="text-xs text-sky-200 max-w-sm mx-auto">
                      Bunker katalogidan kerakli qurilish mahsulotlarini tanlab savatga qo‘shing.
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveSection('bunker')}
                      className="px-6 py-2.5 rounded-xl bg-[#FFB800] hover:bg-[#FFC928] text-[#0A1931] font-bold text-xs cursor-pointer shadow-md"
                    >
                      Bunker Katalogiga O‘tish
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-3">
                      {cart.map((item) => {
                        const liveProd = products.find((p) => p.id === item.product.id) || item.product;
                        const maxStock = typeof liveProd.stock === 'number' ? Math.max(0, liveProd.stock) : 0;
                        const isAtLimit = item.quantity >= maxStock;
                        return (
                        <div
                          key={item.product.id}
                          className="bg-[#071326] border border-[#1E3A6D] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <img
                              src={item.product.image}
                              alt={item.product.title}
                              className="w-16 h-16 rounded-lg object-cover border border-[#1E3A6D] shrink-0"
                            />
                            <div className="min-w-0">
                              <h4 className="font-bold text-sm text-[#F5F5F2] truncate">{item.product.title}</h4>
                              <p className="text-xs text-sky-200">{item.product.supplierName} • {item.product.region}</p>
                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                <p className="text-xs font-mono font-bold text-[#FFB800]">
                                  {formatPrice(item.product.price)} / {item.product.unit}
                                </p>
                                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                                  maxStock <= 0
                                    ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                                    : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                }`}>
                                  {maxStock <= 0 ? 'Vaqtincha tugagan' : `Omborda: ${maxStock} ${item.product.unit}`}
                                </span>
                              </div>
                              {isAtLimit && (
                                <p className="text-[11px] font-black text-red-500 mt-1">
                                  «{item.product.title}» — Ombordagi miqdor yetarli emas! (Omborda mavjud: {maxStock} {item.product.unit})
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                            <div className="flex items-center gap-2 bg-[#0A1931] border border-[#1E3A6D] rounded-lg p-1">
                              <button
                                type="button"
                                onClick={() => onUpdateQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                                className="w-7 h-7 rounded bg-[#0F2547] hover:bg-[#132C54] text-[#F5F5F2] flex items-center justify-center cursor-pointer"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="px-2 font-mono font-bold text-xs text-[#FFB800]">
                                {item.quantity} {item.product.unit}
                              </span>
                              <button
                                type="button"
                                disabled={isAtLimit}
                                onClick={() => {
                                  if (item.quantity < maxStock) {
                                    onUpdateQuantity(item.product.id, item.quantity + 1);
                                  }
                                }}
                                className={`w-7 h-7 rounded flex items-center justify-center ${
                                  isAtLimit
                                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                    : 'bg-[#0F2547] hover:bg-[#132C54] text-[#F5F5F2] cursor-pointer'
                                }`}
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="text-right min-w-[110px]">
                              <div className="text-[10px] text-sky-200">Summa:</div>
                              <div className="font-mono font-bold text-sm text-[#FFB800]">
                                {formatPrice(item.product.price * item.quantity)}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                      })}
                    </div>

                    <div className="p-5 rounded-xl bg-[#071326] border border-[#1E3A6D] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <span className="text-xs text-sky-200 block">Umumiy hisob ({totalCartItems} ta mahsulot):</span>
                        <span className="text-xl sm:text-2xl font-black text-[#FFB800] font-mono">
                          {formatPrice(totalCartSum)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsCheckoutOpen(true)}
                        className="px-6 py-3.5 rounded-xl bg-[#FFB800] hover:bg-[#FFC928] text-[#0A1931] font-black text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 transition-all"
                      >
                        <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                        <span>Buyurtmani Rasmiylashtirish</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 4-BO'LIM: BUYURTMALARIM */}
            {activeSection === 'orders' && (
              <div className="bg-[#0A1931] rounded-xl border-2 border-[#1E3A6D] p-5 sm:p-7 text-[#F5F5F2] shadow-xl space-y-6 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1E3A6D]">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-[#FFB800]/20 text-[#FFB800] border border-[#FFB800]/40">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h1 className="text-lg sm:text-2xl font-bold text-[#F5F5F2] tracking-wide">
                          Buyurtmalarim
                        </h1>
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-[#FFB800] text-[#0A1931] font-mono shadow-sm">
                          {orders.length}
                        </span>
                      </div>
                      <p className="text-[11px] text-sky-200">
                        Barcha buyurtmalar monitoringi va rasmiy elektron cheklar
                      </p>
                    </div>
                  </div>
                </div>

                {/* Buyurtmalar ro'yxati filtrlari */}
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {[
                        { id: 'all', label: `Barchasi (${orders.length})` },
                        { id: 'pending', label: 'Buyurtmadagilar' },
                        { id: 'confirmed', label: 'Mahsulot yuklash jarayonida' },
                        { id: 'in_transit', label: 'Yetkazilmoqda' },
                        { id: 'delivered', label: 'Yetkazilgan' },
                      ].map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setStatusFilter(f.id as any)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            statusFilter === f.id
                              ? 'bg-[#FFB800] text-[#0A1931] shadow-sm'
                              : 'bg-[#071326] text-sky-200 hover:text-white border border-[#1E3A6D]'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

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
                        Sizda hali ushbu toifadagi buyurtmalar mavjud emas. Bunker bo‘limidan tovar tanlang va buyurtma bering.
                      </p>
                      <button
                        type="button"
                        onClick={() => setActiveSection('bunker')}
                        className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs cursor-pointer shadow-md"
                      >
                        Bunkerga O‘tish
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredOrders.map((order) => (
                        <div
                          key={order.id}
                          className="bg-[#07193f] border border-blue-500/40 rounded-2xl p-5 hover:border-amber-400/60 transition-all space-y-4 shadow-lg"
                        >
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

                          {/* Buyurtma jarayoni holati (Ta'minotchi tasdiqlashi -> Yuklash jarayoni -> Manzilga yuborildi -> Yetkazildi) */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 rounded-xl bg-slate-950/70 border border-blue-500/20 text-[11px]">
                            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                              <span>1. Buyurtma berildi</span>
                            </div>
                            <div
                              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border font-bold ${
                                order.status === 'assigned'
                                  ? 'bg-[#FFB800] text-slate-950 border-amber-300 shadow-md'
                                  : order.status === 'in_transit' || order.status === 'delivered'
                                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                  : 'bg-slate-900/60 text-slate-500 border-slate-800'
                              }`}
                            >
                              <Package className="w-3.5 h-3.5 shrink-0" />
                              <span>2. Mahsulot yuklash jarayonida</span>
                            </div>
                            <div
                              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border font-bold ${
                                order.status === 'in_transit'
                                  ? 'bg-sky-500 text-slate-950 border-sky-300 shadow-md'
                                  : order.status === 'delivered'
                                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                  : 'bg-slate-900/60 text-slate-500 border-slate-800'
                              }`}
                            >
                              <Truck className="w-3.5 h-3.5 shrink-0" />
                              <span>3. Yetkazilmoqda</span>
                            </div>
                            <div
                              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border font-bold ${
                                order.status === 'delivered'
                                  ? 'bg-emerald-500 text-slate-950 border-emerald-300 shadow-md'
                                  : 'bg-slate-900/60 text-slate-500 border-slate-800'
                              }`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                              <span>4. Yetkazildi</span>
                            </div>
                          </div>

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

                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#51504A] text-xs">
                            <div className="space-y-1.5 text-[#B8B8B3]">
                              <div className="flex items-center gap-2 text-xs text-[#B8B8B3]">
                                <span className="font-semibold text-[#F5F5F2]">Manzil:</span>
                                <span className="font-bold text-white">
                                  {formatRegionAndDistrictOnly(order.deliveryAddress)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setSelectedMapOrder(order)}
                                  title="Xaritadan ko‘rish"
                                  className="p-1.5 rounded-lg bg-[#FFB800]/20 hover:bg-[#FFB800] text-[#FFB800] hover:text-slate-950 border border-[#FFB800]/50 cursor-pointer transition-all shadow-sm active:scale-95 shrink-0"
                                >
                                  <MapPin className="w-3.5 h-3.5 stroke-[2.3]" />
                                </button>
                              </div>
                              {order.recipientPhone && (
                                <div className="flex items-center gap-1.5 text-[11px] text-[#B8B8B3]/80">
                                  <Phone className="w-3 h-3 text-[#FFB800] shrink-0" />
                                  <span>Qabul qiluvchi: {order.recipientName || 'Xaridor'} ({order.recipientPhone})</span>
                                </div>
                              )}
                              {order.status === 'assigned' && (
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/20 border border-[#FFB800] text-[#FFB800] font-black text-xs animate-pulse">
                                  <Package className="w-3.5 h-3.5 shrink-0" />
                                  <span>Mahsulot yuklash jarayonida</span>
                                </div>
                              )}
                              {order.status === 'in_transit' && (
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-sky-500/20 border border-sky-400 text-sky-300 font-black text-xs">
                                  <Truck className="w-3.5 h-3.5 shrink-0" />
                                  <span>Holat: Yetkazilmoqda</span>
                                </div>
                              )}
                              {order.driverPhone && (
                                <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/20 border-2 border-emerald-400 text-emerald-300 font-black text-xs shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                                  <Phone className="w-4 h-4 text-emerald-400 shrink-0 animate-bounce" />
                                  <span>Bog‘lanish uchun tel nomer:</span>
                                  <a
                                    href={`tel:${order.driverPhone}`}
                                    className="font-mono text-sm text-white underline hover:text-[#FFB800]"
                                  >
                                    {order.driverPhone}
                                  </a>
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
            )}

            {/* 5-BO'LIM: SOZLAMALAR */}
            {activeSection === 'settings' && (
              <div className="bg-[#0A1931] border-2 border-[#1E3A6D] rounded-xl p-5 sm:p-7 text-[#F5F5F2] shadow-xl space-y-6 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#1E3A6D]">
                  <div className="flex items-center gap-4">
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
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-[#071326] text-[#FFB800] border border-[#1E3A6D] flex items-center justify-center font-mono font-bold text-2xl sm:text-3xl shadow-md group-hover:scale-105 transition-transform">
                          {getUserInitials(user)}
                        </div>
                      )}

                      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-md bg-[#FFB800] hover:bg-[#FFC928] text-[#0A1931] flex items-center justify-center shadow-md border border-[#0A1931] transition-transform group-hover:scale-110">
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
                        {user.region && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-[#FFB800]" />
                            {user.region}{user.district ? `, ${user.district}` : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

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

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 text-xs">
                  {/* 1. Shaxsiy ma'lumotlarni tahrirlash */}
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
                            onChange={(e) => setFirstName(e.target.value.replace(/[0-9]/g, ''))}
                            placeholder="Ismingiz"
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-300 font-bold mb-1">Familiya:</label>
                          <input
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value.replace(/[0-9]/g, ''))}
                            placeholder="Familiyangiz"
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 text-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-300 font-bold mb-1">Telefon raqam:</label>
                        <input
                          type="tel"
                          inputMode="numeric"
                          maxLength={17}
                          value={phone}
                          onChange={(e) => {
                            let digits = e.target.value.replace(/\D/g, '');
                            if (digits.startsWith('998')) digits = digits.slice(3);
                            digits = digits.slice(0, 9);
                            if (digits.length === 0) {
                              setPhone('+998 ');
                            } else if (digits.length <= 2) {
                              setPhone(`+998 ${digits}`);
                            } else if (digits.length <= 5) {
                              setPhone(`+998 ${digits.slice(0, 2)} ${digits.slice(2)}`);
                            } else if (digits.length <= 7) {
                              setPhone(`+998 ${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`);
                            } else {
                              setPhone(`+998 ${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 7)} ${digits.slice(7, 9)}`);
                            }
                          }}
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
                            <option value="">Viloyatni tanlang...</option>
                            {Object.keys(REGIONS_AND_DISTRICTS).map((reg) => (
                              <option key={reg} value={reg}>{reg}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-slate-300 font-bold mb-1">Tuman / Shahar:</label>
                          <select
                            value={district}
                            disabled={!region}
                            onChange={(e) => setDistrict(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-400 text-xs disabled:opacity-50"
                          >
                            <option value="">{region ? 'Tuman / shaharni tanlang...' : 'Avval viloyatni tanlang'}</option>
                            {(REGIONS_AND_DISTRICTS[region] || []).map((dist) => (
                              <option key={dist} value={dist}>{dist}</option>
                            ))}
                          </select>
                        </div>
                      </div>

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
                              inputMode="numeric"
                              maxLength={6}
                              value={profileSmsInput}
                              onChange={(e) => setProfileSmsInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
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

                  {/* 2. Login va Parol almashtirish */}
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
                              inputMode="numeric"
                              maxLength={6}
                              value={smsCodeInput}
                              onChange={(e) => setSmsCodeInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
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
            )}

          </div>
        </div>
      </main>

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
                  <span className="text-right truncate max-w-[200px]">{formatRegionAndDistrictOnly(selectedReceiptOrder.deliveryAddress)}</span>
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
          onUserUpdate={onUserUpdate}
          onUpdateQuantity={onUpdateQuantity}
          onRemoveItem={onRemoveItem}
          onClearCart={onClearCart}
          onOrderCompleted={() => {
            setIsCheckoutOpen(false);
            onClearCart();
            setActiveSection('orders');
          }}
          onOpenAuth={() => {}}
        />
      )}

      {/* Xaritadan ko'rish modali */}
      {selectedMapOrder && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn"
          onClick={() => setSelectedMapOrder(null)}
        >
          <div
            className="bg-slate-950 border-2 border-amber-500/60 rounded-3xl max-w-3xl w-full p-5 sm:p-6 space-y-4 shadow-2xl relative text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-500/20 text-[#FFB800] border border-amber-500/40">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">
                    Yetkazish Manzili Xaritasi
                  </h3>
                  <p className="text-xs text-slate-400">
                    {formatRegionAndDistrictOnly(selectedMapOrder.deliveryAddress)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setOrderMapType(orderMapType === 'm' ? 'k' : 'm')}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-[#FFB800] border border-slate-700 font-bold text-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>{orderMapType === 'm' ? "Sun'iy yo'ldosh" : 'Xarita'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMapOrder(null)}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-red-600 text-slate-300 hover:text-white border border-slate-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-2">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#FFB800] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[#FFB800] font-black text-xs sm:text-sm block">
                    {formatRegionAndDistrictOnly(selectedMapOrder.deliveryAddress)}
                  </span>
                  <span className="text-slate-300 text-xs block mt-0.5">
                    {formatCleanFullAddress(selectedMapOrder.deliveryAddress)}
                  </span>
                </div>
              </div>
            </div>

            <div className="relative w-full h-80 sm:h-96 rounded-2xl overflow-hidden border-2 border-slate-800 bg-slate-900">
              {(() => {
                const coords = extractCoordsFromAddress(selectedMapOrder.deliveryAddress);
                return (
                  <iframe
                    title="Yetkazish Lokatsiyasi"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(
                      coords
                        ? `${coords.lat},${coords.lng}`
                        : `${formatCleanFullAddress(selectedMapOrder.deliveryAddress)}, Uzbekistan`
                    )}&hl=uz&z=16&t=${orderMapType}&output=embed`}
                  />
                );
              })()}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
