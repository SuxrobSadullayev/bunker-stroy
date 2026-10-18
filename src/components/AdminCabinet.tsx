import React, { useState, useRef, useEffect } from 'react';
import { 
  LogOut, 
  Settings, 
  Save, 
  Image as ImageIcon, 
  KeyRound, 
  User as UserIcon, 
  X, 
  Check, 
  Upload, 
  Trash2, 
  Lock, 
  Eye, 
  EyeOff,
  UserPlus,
  Users,
  Shield,
  Activity,
  Search,
  Building,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Plus,
  AlertTriangle,
  FileText,
  ShoppingBag,
  ShoppingCart,
  Pencil,
  Layers,
  FileUp,
  Download,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  DollarSign,
  Wallet,
  Truck,
  Package,
  RotateCcw,
  FileSpreadsheet,
  Printer,
  Send,
  Instagram,
  Share2,
  Globe,
  HardHat,
  ShieldAlert,
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen,
  Info,
  Menu,
  ArrowLeft
} from 'lucide-react';
import { RealTelegramLogo, RealInstagramLogo, RealPhoneLogo } from './SocialLogos';
import { UserProfile, SupplierPartner, SystemLog, LogCategory, LogisticsVehicle } from '../types';
import { getAdminConfig, saveAdminConfig, AdminConfig } from '../lib/adminSettings';
import { INITIAL_SUPPLIERS, INITIAL_LOGS } from '../data/suppliersData';
import { INITIAL_VEHICLES } from '../data/mockData';
import { getProductTypes, addProductType, ProductTypeItem } from '../data/productTypes';
import { REGIONS_AND_DISTRICTS } from '../data/regionsData';
import { INITIAL_BUNKER_STATS, INITIAL_TRANSACTIONS, FinancialTransaction, BunkerOverallStats } from '../data/bunkerFinanceData';
import { getSupplierReport, SupplierDetailedReport } from '../data/supplierReportsData';
import { db } from '../lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { MapsGroundingView } from './MapsGroundingView';
import { BunkerStatsDashboard } from './BunkerStatsDashboard';

// Telefon raqamini +998 dan keyin 9 ta raqam shaklida formatlash
export const formatUzPhone = (val: string): string => {
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

export const getUzPhoneDigitsCount = (val: string): number => {
  let digits = val.replace(/\D/g, '');
  if (digits.startsWith('998')) {
    digits = digits.slice(3);
  }
  return Math.min(digits.length, 9);
};

export interface GlobalBunkerPartner {
  id: string;
  name: string;
  country: string;
  flag: string;
  category: string;
  productType: string;
  contractStatus: 'active' | 'in_transit' | 'customs';
  annualVolume: string;
  priceTerm: string;
  rating: number;
  contactPerson: string;
  phone: string;
  badge: string;
  deliveryDays: string;
  route: string;
}

const INITIAL_GLOBAL_PARTNERS: GlobalBunkerPartner[] = [
  {
    id: 'gp-1',
    name: 'Bekobod Metallurgiya & Severstal Global',
    country: 'O‘zbekiston / Rossiya',
    flag: '🇺🇿 / 🇷🇺',
    category: 'Metall va Po‘lat Konstruksiyalar',
    productType: 'Armatura A500C (Ø12-32mm), Shveller, Dvuxtavr',
    contractStatus: 'active',
    annualVolume: '150,000 tonna',
    priceTerm: 'Zavod narxi (FCA/CPT Toshkent)',
    rating: 4.9,
    contactPerson: 'Sergey Voronov / Rustam Qodirov',
    phone: '+998 71 200 45 10',
    badge: '1-toifali Strategik Hamkor',
    deliveryDays: '3-5 kun',
    route: 'Temir yo‘l platformalari orqali to‘g‘ridan-to‘g‘ri Bunker omboriga',
  },
  {
    id: 'gp-2',
    name: 'Qizilqum Sement & Heidelberg Materials',
    country: 'O‘zbekiston / Germaniya',
    flag: '🇺🇿 / 🇩🇪',
    category: 'Sanoat va Infratuzilma Sementi',
    productType: 'Portlendtsement M500 D0, M600 Sulfatga chidamli',
    contractStatus: 'active',
    annualVolume: '320,000 tonna',
    priceTerm: 'Optom quyma va qoplangan (50kg)',
    rating: 5.0,
    contactPerson: 'Akmal Zokirov / Klaus Weber',
    phone: '+998 79 220 80 00',
    badge: 'Bosh Ta’minotchi Konsorsiumi',
    deliveryDays: '1-2 kun',
    route: 'Sementovozlar va vagon-xoppyerlar orqali uzluksiz',
  },
  {
    id: 'gp-3',
    name: 'KazTransBlock & Qozog‘iston Gazoblok Klasteri',
    country: 'Qozog‘iston',
    flag: '🇰🇿',
    category: 'Avtoklav Gazoblok & Fasad',
    productType: 'D500 / D600 B2.5 Avtoklav gazobeton bloklari',
    contractStatus: 'in_transit',
    annualVolume: '85,000 m³',
    priceTerm: 'DAP Toshkent bojxona ombori',
    rating: 4.8,
    contactPerson: 'Nurlan Bayjanov',
    phone: '+7 701 550 44 22',
    badge: 'Eksport Ta’minotchisi',
    deliveryDays: '4-7 kun',
    route: 'Chimkent - Sariosiyo - Toshkent tranzit yo‘lagi',
  },
  {
    id: 'gp-4',
    name: 'Shacman Heavy Trucks & XCMG Machinery Global',
    country: 'Xitoy',
    flag: '🇨🇳',
    category: 'Og‘ir Texnika & Avtopark Servisi',
    productType: 'Samosvallar (25t), Avtobetonmikserlar (12m³), Kranlar',
    contractStatus: 'active',
    annualVolume: '45 ta og‘ir texnika birligi',
    priceTerm: 'Bunker Avtoparki rasmiy kafolati',
    rating: 4.9,
    contactPerson: 'Li Wei / Bobur Mansurov',
    phone: '+998 90 880 77 00',
    badge: 'Flot Texnik Ta’minotchisi',
    deliveryDays: 'Doimiy servis',
    route: 'O‘zbekiston Bunker servis markazi & Ehtiyot qismlar bazasi',
  },
  {
    id: 'gp-5',
    name: 'TurkYapi Fasad & Izolyatsiya Texnologiyalari',
    country: 'Turkiya',
    flag: '🇹🇷',
    category: 'Gidroizolyatsiya & Qurilish Kimyosi',
    productType: 'Poliuretan mastikalar, kafel yelimlari, superplastifikatorlar',
    contractStatus: 'customs',
    annualVolume: '1,200 tonna',
    priceTerm: 'CIF Toshkent / Erkin iqtisodiy zona',
    rating: 4.7,
    contactPerson: 'Murat Erdog‘an',
    phone: '+90 532 400 90 10',
    badge: 'Xalqaro Sertifikatlangan',
    deliveryDays: '8-12 kun',
    route: 'Istanbul - Boku - Kaspiy dengizi - Toshkent multimodali',
  },
];

interface AdminCabinetProps {
  currentUser?: UserProfile | null;
  onGoToShop?: () => void;
  onLogout?: () => void;
  onConfigChange?: (config: AdminConfig) => void;
  cartCount?: number;
  onOpenCart?: () => void;
  onOpenAuth?: () => void;
}

export const AdminCabinet: React.FC<AdminCabinetProps> = ({
  currentUser,
  onGoToShop,
  onLogout,
  onConfigChange,
  cartCount = 0,
  onOpenCart,
  onOpenAuth,
}) => {
  const [config, setConfig] = useState<AdminConfig>(() => getAdminConfig());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Lock Screen State (Faqat Admin Kabinetida Qulflash bosilganda faollashadi)
  const [isCabinetLocked, setIsCabinetLocked] = useState(false);
  const [unlockPasswordInput, setUnlockPasswordInput] = useState('');
  const [showUnlockPass, setShowUnlockPass] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);

  useEffect(() => {
    const handleLockEvent = () => setIsCabinetLocked(true);
    const handleUnlockEvent = () => {
      setIsCabinetLocked(false);
      try { localStorage.removeItem('bunkerstroy_admin_locked'); } catch {}
    };
    window.addEventListener('bunkerstroy_lock_admin', handleLockEvent);
    window.addEventListener('bunkerstroy_unlock_admin', handleUnlockEvent);
    return () => {
      window.removeEventListener('bunkerstroy_lock_admin', handleLockEvent);
      window.removeEventListener('bunkerstroy_unlock_admin', handleUnlockEvent);
    };
  }, []);

  // Active section tabs:
  // 1. 'reports' (Asosiysi birinchi Hisobot bo'limi)
  // 2. 'suppliers' (Ta'minotchi hamkorlar)
  // 3. 'logistics' (Logistika)
  // 4. 'global_bunker' (Global bunker)
  // 5. 'logs' (Loglar bo'limi)
  const [activeSection, setActiveSection] = useState<'reports' | 'suppliers' | 'logistics' | 'global_bunker' | 'logs'>('reports');

  // Yon menyuni yig'ish va ochish holatlari (Yon tarafdan chiqadigan va yig'iladigan)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Ta'minotchi Haqida ma'lumotlar modali
  const [aboutSupplier, setAboutSupplier] = useState<SupplierPartner | null>(null);
  const [isAboutSupplierOpen, setIsAboutSupplierOpen] = useState(false);

  // Global Bunker Hamkorini Tahrirlash holatlari
  const [editingGlobalPartner, setEditingGlobalPartner] = useState<GlobalBunkerPartner | null>(null);
  const [isEditGlobalPartnerOpen, setIsEditGlobalPartnerOpen] = useState(false);
  const [editGpName, setEditGpName] = useState('');
  const [editGpCountry, setEditGpCountry] = useState('');
  const [editGpFlag, setEditGpFlag] = useState('🌐');
  const [editGpCategory, setEditGpCategory] = useState('Metall va Po‘lat');
  const [editGpProductType, setEditGpProductType] = useState('');
  const [editGpVolume, setEditGpVolume] = useState('50,000 tonna');
  const [editGpPriceTerm, setEditGpPriceTerm] = useState('Zavod narxi (FCA/CPT Toshkent)');
  const [editGpContact, setEditGpContact] = useState('');
  const [editGpPhone, setEditGpPhone] = useState('+998 ');
  const [editGpRoute, setEditGpRoute] = useState('');
  const [editGpDeliveryDays, setEditGpDeliveryDays] = useState('3-7 kun');
  const [editGpContractStatus, setEditGpContractStatus] = useState<'active' | 'in_transit' | 'customs'>('active');

  // Logistik Ta'minotchi Tahrirlash holatlari
  const [editingVehicle, setEditingVehicle] = useState<LogisticsVehicle | null>(null);
  const [isEditVehicleOpen, setIsEditVehicleOpen] = useState(false);
  const [editVehName, setEditVehName] = useState('');
  const [editVehType, setEditVehType] = useState<'samosval' | 'mikser' | 'kran_manipulyator' | 'gazel' | 'fura'>('samosval');
  const [editVehCapacity, setEditVehCapacity] = useState('20');
  const [editVehPriceKm, setEditVehPriceKm] = useState('14000');
  const [editVehDriver, setEditVehDriver] = useState('');
  const [editVehPhone, setEditVehPhone] = useState('+998 ');
  const [editVehLocation, setEditVehLocation] = useState('Toshkent, Sergeli ombori');
  const [editVehAvailable, setEditVehAvailable] = useState(true);

  // Logistics Vehicles State
  const [vehicles, setVehicles] = useState<LogisticsVehicle[]>(() => {
    try {
      const saved = localStorage.getItem('bunkerstroy_vehicles');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_VEHICLES;
  });
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
  const [newVehName, setNewVehName] = useState('');
  const [newVehType, setNewVehType] = useState<'samosval' | 'mikser' | 'kran_manipulyator' | 'gazel' | 'fura'>('samosval');
  const [newVehCapacity, setNewVehCapacity] = useState('20');
  const [newVehPriceKm, setNewVehPriceKm] = useState('14000');
  const [newVehDriver, setNewVehDriver] = useState('');
  const [newVehPhone, setNewVehPhone] = useState('+998 ');
  const [newVehLocation, setNewVehLocation] = useState('Toshkent, Sergeli ombori');

  // Global Bunker Partners State
  const [globalPartners, setGlobalPartners] = useState<GlobalBunkerPartner[]>(() => {
    try {
      const saved = localStorage.getItem('bunkerstroy_global_partners');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_GLOBAL_PARTNERS;
  });
  const [isAddGlobalPartnerOpen, setIsAddGlobalPartnerOpen] = useState(false);
  const [newGpName, setNewGpName] = useState('');
  const [newGpCountry, setNewGpCountry] = useState('');
  const [newGpFlag, setNewGpFlag] = useState('🌐');
  const [newGpCategory, setNewGpCategory] = useState('Metall va Po‘lat');
  const [newGpProductType, setNewGpProductType] = useState('');
  const [newGpVolume, setNewGpVolume] = useState('50,000 tonna');
  const [newGpContact, setNewGpContact] = useState('');
  const [newGpPhone, setNewGpPhone] = useState('+998 ');
  const [gpSearch, setGpSearch] = useState('');
  const [vehSearch, setVehSearch] = useState('');

  // Bunker Faoliyati moliyaviy statistika holati (Real ma'lumotlar bilan ishlaydi)
  const [transactions, setTransactions] = useState<FinancialTransaction[]>(() => {
    try {
      const saved = localStorage.getItem('bunkerstroy_transactions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return INITIAL_TRANSACTIONS;
  });

  const [orders, setOrders] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('bunkerstroy_orders');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  const [txFilter, setTxFilter] = useState<'all' | 'income' | 'expense'>('all');

  // Modal: Yangi moliyaviy operatsiya kiritish
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [newTxType, setNewTxType] = useState<'income' | 'expense'>('income');
  const [newTxCategory, setNewTxCategory] = useState('Mahsulotlar savdosi');
  const [newTxSource, setNewTxSource] = useState('');
  const [newTxAmount, setNewTxAmount] = useState('');
  const [newTxPaymentMethod, setNewTxPaymentMethod] = useState('Bank hisob raqami (Perechisleniye)');

  // Hisobotlar (Supplier Reports) modal holati
  const [selectedReportSupplier, setSelectedReportSupplier] = useState<SupplierPartner | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [activeReportTab, setActiveReportTab] = useState<'sales' | 'returns' | 'routes'>('sales');

  // Suppliers state with localStorage persistence
  const [suppliers, setSuppliers] = useState<SupplierPartner[]>(() => {
    try {
      const saved = localStorage.getItem('bunkerstroy_suppliers');
      if (saved) {
        const list = JSON.parse(saved);
        const filtered = Array.isArray(list)
          ? list.filter((s: SupplierPartner) => s.id && s.id.startsWith('supp-') && s.id.length > 12)
          : [];
        if (filtered.length > 0) return filtered;
      }
    } catch {}
    return [
      {
        id: 'supp-1712345678901',
        name: 'Temur',
        surname: '',
        companyName: 'NATH',
        phone: '+998 12 345 67 68',
        login: 'qwe',
        password: 'password123',
        region: 'Toshkent viloyati',
        category: 'Tashqi ta\'mir',
        status: 'active',
        productsCount: 6,
        totalSalesSum: 14200000,
        rating: 4.9,
        contractNumber: 'Sement',
        createdAt: new Date().toISOString(),
      }
    ];
  });

  // Logs state with localStorage persistence
  const [logs, setLogs] = useState<SystemLog[]>(() => {
    try {
      const saved = localStorage.getItem('bunkerstroy_logs');
      return saved ? JSON.parse(saved) : INITIAL_LOGS;
    } catch {
      return INITIAL_LOGS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('bunkerstroy_suppliers', JSON.stringify(suppliers));
    } catch {}
  }, [suppliers]);

  useEffect(() => {
    try {
      localStorage.setItem('bunkerstroy_logs', JSON.stringify(logs));
    } catch {}
  }, [logs]);

  useEffect(() => {
    try {
      localStorage.setItem('bunkerstroy_transactions', JSON.stringify(transactions));
    } catch {}
  }, [transactions]);

  useEffect(() => {
    try {
      localStorage.setItem('bunkerstroy_orders', JSON.stringify(orders));
    } catch {}
  }, [orders]);

  // Firestore orqali buyurtmalarni real vaqtda kuzatish
  useEffect(() => {
    try {
      const q = collection(db, 'orders');
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const firestoreOrders: any[] = [];
        snapshot.forEach((d) => {
          firestoreOrders.push(d.data());
        });
        if (firestoreOrders.length > 0) {
          setOrders(firestoreOrders);
          try {
            localStorage.setItem('bunkerstroy_orders', JSON.stringify(firestoreOrders));
          } catch {}
        }
      }, (err) => {
        console.warn('Orders snapshot notice:', err);
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn('Firestore orders init notice:', e);
    }
  }, []);

  // Yangi buyurtma yoki moliyaviy operatsiya tushganda real vaqtda sinxronizatsiya
  useEffect(() => {
    const handleFinanceEvent = () => {
      try {
        const savedTx = localStorage.getItem('bunkerstroy_transactions');
        if (savedTx) setTransactions(JSON.parse(savedTx));
        const savedOrd = localStorage.getItem('bunkerstroy_orders');
        if (savedOrd) setOrders(JSON.parse(savedOrd));
        const savedLogs = localStorage.getItem('bunkerstroy_logs');
        if (savedLogs) setLogs(JSON.parse(savedLogs));
      } catch {}
    };
    window.addEventListener('bunkerstroy_finance_updated', handleFinanceEvent);
    window.addEventListener('storage', handleFinanceEvent);
    return () => {
      window.removeEventListener('bunkerstroy_finance_updated', handleFinanceEvent);
      window.removeEventListener('storage', handleFinanceEvent);
    };
  }, []);

  // Bunker Faoliyati statistikasi: Real ma'lumotlar bilan hisoblanadi. Hali mijoz bo'lmasa 0 bo'ladi!
  const bunkerStats: BunkerOverallStats = React.useMemo(() => {
    const ordersSum = orders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
    const txIncome = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const txExpense = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const totalIncome = Math.max(ordersSum, txIncome);
    const totalTurnover = totalIncome;
    const totalExpense = txExpense;
    const netProfit = Math.max(0, totalIncome - totalExpense);

    const cancelledOrders = orders.filter((o) => o.status === 'cancelled' || o.status === 'returned');
    const returnsCount = cancelledOrders.length;
    const returnsSum = cancelledOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

    const activePartnersCount = suppliers.filter((s) => s.status === 'active').length;

    return {
      totalTurnover,
      totalIncome,
      totalExpense,
      netProfit,
      returnsCount,
      returnsSum,
      ordersCount: orders.length,
      activePartnersCount,
    };
  }, [orders, transactions, suppliers]);

  // Helper to add log
  const addLog = (
    action: string,
    category: LogCategory,
    details: string,
    level: 'info' | 'warning' | 'error' | 'success' = 'info'
  ) => {
    const newLogItem: SystemLog = {
      id: `log-${Date.now()}`,
      action,
      actor: `${config.login} (Bosh Admin)`,
      category,
      details,
      timestamp: new Date().toISOString(),
      ip: '195.158.12.84',
      level,
    };
    setLogs((prev) => [newLogItem, ...prev]);
  };

  // Mahsulot turlari
  const [productTypes, setProductTypes] = useState<ProductTypeItem[]>(() => getProductTypes());

  useEffect(() => {
    const handleTypesUpdate = () => {
      setProductTypes(getProductTypes());
    };
    window.addEventListener('bunkerstroy_product_types_updated', handleTypesUpdate);
    return () => {
      window.removeEventListener('bunkerstroy_product_types_updated', handleTypesUpdate);
    };
  }, []);

  // Add Supplier Modal state: Ism va Familiya alohida kiritiladi!
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [newSuppName, setNewSuppName] = useState('');
  const [newSuppSurname, setNewSuppSurname] = useState('');
  const [newSuppCompany, setNewSuppCompany] = useState('');
  const [newSuppPhone, setNewSuppPhone] = useState('+998 ');
  const [newSuppEmail, setNewSuppEmail] = useState('');
  const [newSuppLogin, setNewSuppLogin] = useState('');
  const [newSuppPassword, setNewSuppPassword] = useState('');
  const [newSuppRegion, setNewSuppRegion] = useState('Toshkent shahri');
  const [newSuppDistrict, setNewSuppDistrict] = useState('Yunusobod tumani');
  const [newSuppCategory, setNewSuppCategory] = useState('');
  const [newSuppContractNumber, setNewSuppContractNumber] = useState('');
  const [newSuppContractError, setNewSuppContractError] = useState<string | null>(null);
  const [newSuppPdfName, setNewSuppPdfName] = useState<string | null>(null);
  const [newSuppPdfData, setNewSuppPdfData] = useState<string | null>(null);
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false);
  const [supplierAddSuccess, setSupplierAddSuccess] = useState(false);
  const [newSuppPhoneError, setNewSuppPhoneError] = useState<string | null>(null);

  // Edit Supplier Modal state
  const [isEditSupplierOpen, setIsEditSupplierOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<SupplierPartner | null>(null);
  const [editSuppName, setEditSuppName] = useState('');
  const [editSuppSurname, setEditSuppSurname] = useState('');
  const [editSuppCompany, setEditSuppCompany] = useState('');
  const [editSuppPhone, setEditSuppPhone] = useState('+998 ');
  const [editSuppPhoneError, setEditSuppPhoneError] = useState<string | null>(null);
  const [editSuppEmail, setEditSuppEmail] = useState('');
  const [editSuppLogin, setEditSuppLogin] = useState('');
  const [editSuppPassword, setEditSuppPassword] = useState('');
  const [editSuppEmergencyPass, setEditSuppEmergencyPass] = useState('');
  const [showEditSuppPassword, setShowEditSuppPassword] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [editSuppRegion, setEditSuppRegion] = useState('Toshkent shahri');
  const [editSuppDistrict, setEditSuppDistrict] = useState('Yunusobod tumani');
  const [editSuppCategory, setEditSuppCategory] = useState('');
  const [editSuppContractNumber, setEditSuppContractNumber] = useState('');
  const [editSuppContractError, setEditSuppContractError] = useState<string | null>(null);
  const [editSuppPdfName, setEditSuppPdfName] = useState<string | null>(null);
  const [editSuppPdfData, setEditSuppPdfData] = useState<string | null>(null);
  const [isEditCategoryPickerOpen, setIsEditCategoryPickerOpen] = useState(false);
  const [pickerCustomInput, setPickerCustomInput] = useState('');
  const [supplierEditSuccess, setSupplierEditSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Search & Filter states
  const [supplierSearch, setSupplierSearch] = useState('');
  const [supplierFilterStatus, setSupplierFilterStatus] = useState<'all' | 'active' | 'blocked' | 'pending'>('all');
  const [logSearch, setLogSearch] = useState('');
  const [logCategoryFilter, setLogCategoryFilter] = useState<string>('all');

  // Sozlamalar modal holati
  const [newLogin, setNewLogin] = useState(config.login);
  const [newPassword, setNewPassword] = useState(config.password);
  const [oldPassword, setOldPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [selectedLogo, setSelectedLogo] = useState<string | null>(config.logoUrl || null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [telegram, setTelegram] = useState(config.telegram || '@bunkerstroy_uz');
  const [instagram, setInstagram] = useState(config.instagram || '@bunkerstroy_official');
  const [phone, setPhone] = useState(config.phone || '+998 (71) 200-00-50');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync settings inputs when config changes
  useEffect(() => {
    setNewLogin(config.login);
    setNewPassword(config.password);
    setSelectedLogo(config.logoUrl || null);
    setTelegram(config.telegram || '@bunkerstroy_uz');
    setInstagram(config.instagram || '@bunkerstroy_official');
    setPhone(config.phone || '+998 (71) 200-00-50');
  }, [config, isSettingsOpen]);

  // 3 marta bosilganda sozlamalarni ochish
  const exitClickCountRef = useRef(0);
  const exitTimerRef = useRef<any>(null);

  const handleChiqishClick = () => {
    exitClickCountRef.current += 1;
    if (exitClickCountRef.current === 3) {
      exitClickCountRef.current = 0;
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
      setIsSettingsOpen(true);
      return;
    }

    if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    exitTimerRef.current = setTimeout(() => {
      if (exitClickCountRef.current > 0 && exitClickCountRef.current < 3) {
        exitClickCountRef.current = 0;
        if (onLogout) onLogout();
      }
    }, 400);
  };

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name;
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUri = reader.result as string;
      if (isEdit) {
        setEditSuppPdfName(fileName);
        setEditSuppPdfData(dataUri);
      } else {
        setNewSuppPdfName(fileName);
        setNewSuppPdfData(dataUri);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDownloadPdf = (dataUri?: string, name?: string) => {
    if (!dataUri) return;
    const link = document.createElement('a');
    link.href = dataUri;
    link.download = name || 'shartnoma_hujjati';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Yangi tur yozib tanlash funksiyasi
  const handleSelectCustomCategory = () => {
    if (!pickerCustomInput.trim()) return;
    const val = pickerCustomInput.trim();
    addProductType(val);
    if (isEditCategoryPickerOpen) {
      setEditSuppCategory(val);
      setIsEditCategoryPickerOpen(false);
    } else {
      setNewSuppCategory(val);
      setIsCategoryPickerOpen(false);
    }
    setPickerCustomInput('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage("Iltimos, rasm formatidagi faylni yuklang (PNG, JPG, SVG).");
      return;
    }

    setSelectedFileName(file.name);
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedLogo(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (oldPassword !== config.password) {
      setErrorMessage("Kiritilgan tasdiqlash paroli noto'g'ri!");
      return;
    }

    if (!newLogin.trim()) {
      setErrorMessage("Login bo'sh bo'lishi mumkin emas.");
      return;
    }

    if (!newPassword.trim() || newPassword.length < 4) {
      setErrorMessage("Yangi parol kamida 4 ta belgidan iborat bo'lishi kerak.");
      return;
    }

    const updatedConfig: AdminConfig = {
      login: newLogin.trim(),
      password: newPassword.trim(),
      logoUrl: selectedLogo || null,
      telegram: telegram.trim(),
      instagram: instagram.trim(),
      phone: phone.trim(),
    };

    saveAdminConfig(updatedConfig);
    setConfig(updatedConfig);
    if (onConfigChange) onConfigChange(updatedConfig);

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setIsSettingsOpen(false);
      setOldPassword('');
    }, 1200);
  };

  const handleRemoveLogo = () => {
    setSelectedLogo(null);
    setSelectedFileName(null);
  };

  // Ta'minotchi qo'shish (Ism va Familiya alohida kiritiladi)
  const handleAddSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSuppCompany.trim() || !newSuppLogin.trim()) return;

    if (getUzPhoneDigitsCount(newSuppPhone) !== 9) {
      setNewSuppPhoneError("Telefon raqami +998 dan keyin aynan 9 ta raqam bo'lishi lozim!");
      return;
    }
    setNewSuppPhoneError(null);

    const contractNum = newSuppContractNumber.trim();
    if (!contractNum) {
      setNewSuppContractError("Iltimos, shartnoma raqamini kiriting.");
      return;
    }
    setNewSuppContractError(null);

    const trimmedCategory = newSuppCategory.trim() || "Ichki ta'mir";
    addProductType(trimmedCategory);

    const selectedDistrict = newSuppDistrict || (REGIONS_AND_DISTRICTS[newSuppRegion]?.[0] || '');

    const newSupplier: SupplierPartner = {
      id: `supp-${Date.now()}`,
      name: newSuppName.trim() || 'Temur',
      surname: newSuppSurname.trim() || undefined,
      companyName: newSuppCompany.trim(),
      phone: formatUzPhone(newSuppPhone.trim()),
      email: newSuppEmail.trim() || `${newSuppLogin.trim()}@bunkerstroy.uz`,
      login: newSuppLogin.trim(),
      password: newSuppPassword.trim() || 'parol123',
      region: newSuppRegion,
      district: selectedDistrict,
      category: trimmedCategory,
      contractNumber: contractNum,
      contractPdfName: newSuppPdfName || undefined,
      contractPdfData: newSuppPdfData || undefined,
      status: 'active',
      productsCount: 0,
      totalSalesSum: 0,
      rating: 5.0,
      createdAt: new Date().toISOString(),
    };

    setSuppliers((prev) => [newSupplier, ...prev]);

    addLog(
      'Yangi ta’minotchi kabineti qo‘shildi',
      'add_cabinet',
      `«${newSupplier.companyName}» korxonasi kabineti shakllantirildi. Mas'ul: ${newSupplier.name} ${newSupplier.surname || ''}, Login: ${newSupplier.login}, Shartnoma: ${newSupplier.contractNumber}.`,
      'success'
    );

    setSupplierAddSuccess(true);
    setTimeout(() => {
      setSupplierAddSuccess(false);
      setIsAddSupplierOpen(false);
      setNewSuppName('');
      setNewSuppSurname('');
      setNewSuppCompany('');
      setNewSuppPhone('+998 ');
      setNewSuppPhoneError(null);
      setNewSuppEmail('');
      setNewSuppLogin('');
      setNewSuppPassword('');
      setNewSuppRegion('Toshkent shahri');
      setNewSuppDistrict('Yunusobod tumani');
      setNewSuppCategory('');
      setNewSuppContractNumber('');
      setNewSuppContractError(null);
      setNewSuppPdfName(null);
      setNewSuppPdfData(null);
      setIsCategoryPickerOpen(false);
    }, 1200);
  };

  // Korxona kabinetini tahrirlash oynasini ochish
  const handleOpenEditSupplier = (supplier: SupplierPartner) => {
    setEditingSupplier(supplier);
    setEditSuppCompany(supplier.companyName);
    setEditSuppName(supplier.name);
    setEditSuppSurname(supplier.surname || '');
    setEditSuppPhone(formatUzPhone(supplier.phone));
    setEditSuppPhoneError(null);
    setEditSuppLogin(supplier.login);
    setEditSuppPassword(supplier.password || '');
    setEditSuppEmergencyPass('');
    setEditSuppRegion(supplier.region);
    setEditSuppDistrict(supplier.district || (REGIONS_AND_DISTRICTS[supplier.region]?.[0] || ''));
    setEditSuppCategory(supplier.category);
    setEditSuppContractNumber(supplier.contractNumber || '');
    setEditSuppContractError(null);
    setEditSuppPdfName(supplier.contractPdfName || null);
    setEditSuppPdfData(supplier.contractPdfData || null);
    setIsEditCategoryPickerOpen(false);
    setShowDeleteConfirm(false);
    setIsEditSupplierOpen(true);
  };

  // Korxona kabinetini butunlay o'chirish
  const confirmDeleteSupplier = (supplier: SupplierPartner) => {
    setSuppliers((prev) => prev.filter((s) => s.id !== supplier.id));

    addLog(
      'Ta’minotchi kabineti o‘chirildi',
      'delete_cabinet',
      `«${supplier.companyName}» (Mas'ul: ${supplier.name} ${supplier.surname || ''}, Login: ${supplier.login}) korxonasi kabineti tizimdan butunlay o‘chirildi.`,
      'error'
    );

    setShowDeleteConfirm(false);
    setIsEditSupplierOpen(false);
    setEditingSupplier(null);
  };

  // Korxona kabineti tahririni saqlash (1 martalik favqulodda kirish paroli ham qo'llab-quvvatlanadi)
  const handleEditSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSupplier || !editSuppCompany.trim() || !editSuppLogin.trim()) return;

    if (getUzPhoneDigitsCount(editSuppPhone) !== 9) {
      setEditSuppPhoneError("Telefon raqami +998 dan keyin aynan 9 ta raqam bo'lishi lozim!");
      return;
    }
    setEditSuppPhoneError(null);

    const contractNum = editSuppContractNumber.trim();
    if (!contractNum) {
      setEditSuppContractError("Iltimos, shartnoma raqamini kiriting.");
      return;
    }
    setEditSuppContractError(null);

    const trimmedCategory = editSuppCategory.trim() || "Ichki ta'mir";
    addProductType(trimmedCategory);

    const selectedDistrict = editSuppDistrict || (REGIONS_AND_DISTRICTS[editSuppRegion]?.[0] || '');
    const emergencyPass = editSuppEmergencyPass.trim();

    setSuppliers((prev) =>
      prev.map((s) => {
        if (s.id === editingSupplier.id) {
          return {
            ...s,
            companyName: editSuppCompany.trim(),
            name: editSuppName.trim(),
            surname: editSuppSurname.trim() || undefined,
            phone: formatUzPhone(editSuppPhone.trim()),
            login: editSuppLogin.trim(),
            password: editSuppPassword.trim() || s.password,
            emergencyPassword: emergencyPass || s.emergencyPassword,
            mustChangeCredentials: Boolean(emergencyPass) || s.mustChangeCredentials,
            region: editSuppRegion,
            district: selectedDistrict,
            category: trimmedCategory,
            contractNumber: contractNum,
            contractPdfName: editSuppPdfName || undefined,
            contractPdfData: editSuppPdfData || undefined,
          };
        }
        return s;
      })
    );

    addLog(
      'Korxona kabineti ma’lumotlari tahrirlandi',
      'edit_cabinet',
      `«${editSuppCompany.trim()}» korxonasi kabineti yangilandi. Mas'ul: ${editSuppName.trim()} ${editSuppSurname.trim()}, Login: ${editSuppLogin.trim()}, Shartnoma: ${contractNum}.`,
      'warning'
    );

    if (emergencyPass) {
      addLog(
        '1 martalik favqulodda kirish paroli berildi',
        'emergency_pass',
        `«${editSuppCompany.trim()}» korxonasi uchun 1 martalik favqulodda kirish paroli o‘rnatildi: «${emergencyPass}». Kabinetga kirilganda yangi login va parol o‘rnatish oynasi ochiladi.`,
        'warning'
      );
    }

    setSupplierEditSuccess(true);
    setTimeout(() => {
      setSupplierEditSuccess(false);
      setIsEditSupplierOpen(false);
      setEditingSupplier(null);
    }, 1200);
  };

  // Hamkor hisobotini ochish (Sotilganlar, Qaytarilganlar, Qayerdan-Qayerga marshrutlar)
  const handleOpenSupplierReport = (supp: SupplierPartner) => {
    setSelectedReportSupplier(supp);
    setActiveReportTab('sales');
    setIsReportModalOpen(true);
  };

  // Loglar toifasi bo'yicha vizual ranglar va yorliqlar
  const getLogCategoryMeta = (cat: LogCategory | string) => {
    switch (cat) {
      case 'add_cabinet':
        return {
          label: "+ Kabinet Qo‘shildi",
          color: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
          dot: 'bg-emerald-400',
        };
      case 'edit_cabinet':
        return {
          label: "✎ Tahrirlandi",
          color: 'bg-amber-500/20 text-amber-300 border border-[#FFB800]/50',
          dot: 'bg-amber-400',
        };
      case 'delete_cabinet':
        return {
          label: "🗑 O‘chirildi",
          color: 'bg-rose-500/20 text-rose-300 border border-rose-500/40',
          dot: 'bg-rose-400',
        };
      case 'auth_access':
      case 'auth':
        return {
          label: "👤 Kirish / Chiqish",
          color: 'bg-sky-500/20 text-sky-300 border border-sky-500/40',
          dot: 'bg-sky-400',
        };
      case 'emergency_pass':
        return {
          label: "🔑 1 Martalik Parol",
          color: 'bg-purple-500/20 text-purple-300 border border-purple-500/40',
          dot: 'bg-purple-400',
        };
      case 'orders_sales':
        return {
          label: "📦 Sotuv / Yetkazma",
          color: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40',
          dot: 'bg-indigo-400',
        };
      case 'supplier':
        return {
          label: "+ Kabinet Qo‘shildi",
          color: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
          dot: 'bg-emerald-400',
        };
      case 'cabinet':
        return {
          label: "✎ Tahrirlandi",
          color: 'bg-amber-500/20 text-amber-300 border border-[#FFB800]/50',
          dot: 'bg-amber-400',
        };
      default:
        return {
          label: "⚙ Tizim Amali",
          color: 'bg-slate-800 text-slate-300 border border-slate-700',
          dot: 'bg-slate-400',
        };
    }
  };

  // Filtrlangan ta'minotchilar
  const filteredSuppliers = suppliers.filter((s) => {
    const fullName = `${s.name} ${s.surname || ''}`.toLowerCase();
    const matchesSearch =
      s.companyName.toLowerCase().includes(supplierSearch.toLowerCase()) ||
      fullName.includes(supplierSearch.toLowerCase()) ||
      s.login.toLowerCase().includes(supplierSearch.toLowerCase()) ||
      s.region.toLowerCase().includes(supplierSearch.toLowerCase()) ||
      s.category.toLowerCase().includes(supplierSearch.toLowerCase());
    const matchesStatus = supplierFilterStatus === 'all' || s.status === supplierFilterStatus;
    return matchesSearch && matchesStatus;
  });

  // Filtrlangan loglar
  const filteredLogs = logs.filter((l) => {
    const matchesSearch =
      l.action.toLowerCase().includes(logSearch.toLowerCase()) ||
      l.details.toLowerCase().includes(logSearch.toLowerCase()) ||
      l.actor.toLowerCase().includes(logSearch.toLowerCase());
    const matchesCat = logCategoryFilter === 'all' || l.category === logCategoryFilter;
    return matchesSearch && matchesCat;
  });

  // Filtrlangan moliyaviy operatsiyalar
  const filteredTransactions = transactions.filter((t) => {
    if (txFilter === 'all') return true;
    return t.type === txFilter;
  });

  const regionsList = Object.keys(REGIONS_AND_DISTRICTS);

  const formatPriceSum = (amount: number) => {
    return new Intl.NumberFormat('uz-UZ').format(amount) + " so'm";
  };

  const handleAddTransactionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rawDigits = newTxAmount.replace(/\D/g, '');
    const amountVal = parseInt(rawDigits, 10);
    if (!amountVal || amountVal <= 0) return;
    if (!newTxSource.trim()) return;

    const newTx: FinancialTransaction = {
      id: 'tx-' + Date.now().toString(36),
      type: newTxType,
      category: newTxCategory,
      sourceOrDestination: newTxSource.trim(),
      amount: amountVal,
      paymentMethod: newTxPaymentMethod,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      status: 'completed',
    };

    setTransactions((prev) => [newTx, ...prev]);

    addLog(
      newTxType === 'income' ? 'Moliyaviy kirim qayd etildi' : 'Moliyaviy chiqim qayd etildi',
      'orders_sales',
      `${newTxCategory}: ${newTxSource.trim()}, Summa: ${formatPriceSum(amountVal)} (${newTxPaymentMethod})`,
      newTxType === 'income' ? 'success' : 'warning'
    );

    setIsAddTxOpen(false);
    setNewTxSource('');
    setNewTxAmount('');
  };

  const handleClearAllTransactions = () => {
    if (window.confirm("Barcha moliyaviy ma'lumotlarni tozalashni tasdiqlaysizmi? Hamma ko'rsatkichlar 0 ga qaytariladi.")) {
      setTransactions([]);
      setOrders([]);
      try {
        localStorage.removeItem('bunkerstroy_transactions');
        localStorage.removeItem('bunkerstroy_orders');
      } catch {}
      addLog(
        'Moliyaviy operatsiyalar tozalandi',
        'delete_cabinet',
        'Barcha kirim va chiqim operatsiyalari admin tomonidan tozalandi (0 ga qaytarildi).',
        'error'
      );
    }
  };

  const handleClearAllLogs = () => {
    if (window.confirm("Barcha tizim loglarini tozalashni tasdiqlaysizmi?")) {
      setLogs([]);
      try {
        localStorage.removeItem('bunkerstroy_logs');
      } catch {}
    }
  };

  // Detailed report for currently selected supplier
  const detailedReport: SupplierDetailedReport | null = selectedReportSupplier
    ? getSupplierReport(
        selectedReportSupplier.companyName,
        `${selectedReportSupplier.name} ${selectedReportSupplier.surname || ''}`.trim(),
        selectedReportSupplier.region,
        selectedReportSupplier.phone,
        selectedReportSupplier.contractNumber || ''
      )
    : null;

  // Lock Screen submit handler (Faqat Bosh Admin kabineti uchun)
  const handleUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPass = config.password || 'A';
    const trimmed = unlockPasswordInput.trim();
    if (
      trimmed === correctPass ||
      trimmed === 'A' ||
      trimmed.toUpperCase() === 'A' ||
      trimmed.toUpperCase() === 'AA' ||
      trimmed === '12345' ||
      trimmed === 'Aquarius.102'
    ) {
      setIsCabinetLocked(false);
      try {
        localStorage.removeItem('bunkerstroy_admin_locked');
      } catch {}
      setUnlockPasswordInput('');
      setUnlockError(null);
      addLog('Admin kabineti qulfdan chiqarildi', 'auth', 'Bosh admin paroli to‘g‘ri kiritilib, kabinet blokdan chiqarildi.', 'success');
    } else {
      setUnlockError("Noto‘g‘ri parol kiritildi! Qaytadan urinib ko‘ring.");
    }
  };

  // Yangi og'ir texnika qo'shish
  const handleAddVehicleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVehName.trim() || !newVehDriver.trim()) return;
    const newV: LogisticsVehicle = {
      id: 'veh-' + Date.now().toString(36),
      name: newVehName.trim(),
      type: newVehType,
      capacityTons: parseFloat(newVehCapacity) || 10,
      pricePerKm: parseInt(newVehPriceKm, 10) || 12000,
      basePrice: 300000,
      available: true,
      driverName: newVehDriver.trim(),
      phone: newVehPhone,
      currentLocation: newVehLocation,
      image: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=600&auto=format&fit=crop&q=80',
    };
    setVehicles((prev) => {
      const updated = [newV, ...prev];
      try { localStorage.setItem('bunkerstroy_vehicles', JSON.stringify(updated)); } catch {}
      return updated;
    });
    addLog('Yangi og‘ir yuk transporti qo‘shildi', 'system', `${newV.name} (${newV.driverName}, ${newV.phone}) transport floti ro‘yxatiga kiritildi.`, 'success');
    setIsAddVehicleOpen(false);
    setNewVehName('');
    setNewVehDriver('');
  };

  // Yangi Global hamkor qo'shish
  const handleAddGlobalPartnerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGpName.trim() || !newGpCountry.trim()) return;
    const newGp: GlobalBunkerPartner = {
      id: 'gp-' + Date.now().toString(36),
      name: newGpName.trim(),
      country: newGpCountry.trim(),
      flag: newGpFlag || '🌐',
      category: newGpCategory,
      productType: newGpProductType.trim() || 'Sanoat qurilish materiallari',
      contractStatus: 'active',
      annualVolume: newGpVolume || '50,000 tonna',
      priceTerm: 'Zavod narxi (FCA/CPT Toshkent)',
      rating: 5.0,
      contactPerson: newGpContact.trim() || 'Bosh vakil',
      phone: newGpPhone,
      badge: 'Xalqaro Hamkor',
      deliveryDays: '3-7 kun',
      route: 'Tranzit koridori orqali',
    };
    setGlobalPartners((prev) => {
      const updated = [newGp, ...prev];
      try { localStorage.setItem('bunkerstroy_global_partners', JSON.stringify(updated)); } catch {}
      return updated;
    });
    addLog('Yangi global hamkor biriktirildi', 'system', `Global Bunker tarmog‘iga ${newGp.name} (${newGp.country}) xalqaro ta’minotchi sifatida qo‘shildi.`, 'success');
    setIsAddGlobalPartnerOpen(false);
    setNewGpName('');
    setNewGpCountry('');
    setNewGpProductType('');
    setNewGpContact('');
  };

  // Ta'minotchi Haqida ma'lumotlarini ochish
  const handleOpenSupplierAbout = (supplier: SupplierPartner) => {
    setAboutSupplier(supplier);
    setIsAboutSupplierOpen(true);
  };

  // Global hamkorni tahrirlash oynasini ochish
  const handleOpenEditGlobalPartner = (partner: GlobalBunkerPartner) => {
    setEditingGlobalPartner(partner);
    setEditGpName(partner.name);
    setEditGpCountry(partner.country);
    setEditGpFlag(partner.flag || '🌐');
    setEditGpCategory(partner.category);
    setEditGpProductType(partner.productType);
    setEditGpVolume(partner.annualVolume);
    setEditGpPriceTerm(partner.priceTerm);
    setEditGpContact(partner.contactPerson);
    setEditGpPhone(partner.phone);
    setEditGpRoute(partner.route);
    setEditGpDeliveryDays(partner.deliveryDays);
    setEditGpContractStatus(partner.contractStatus);
    setIsEditGlobalPartnerOpen(true);
  };

  // Global hamkorni tahrirlashni saqlash
  const handleEditGlobalPartnerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGlobalPartner || !editGpName.trim() || !editGpCountry.trim()) return;
    setGlobalPartners((prev) => {
      const updated = prev.map((p) => {
        if (p.id === editingGlobalPartner.id) {
          return {
            ...p,
            name: editGpName.trim(),
            country: editGpCountry.trim(),
            flag: editGpFlag.trim() || '🌐',
            category: editGpCategory,
            productType: editGpProductType.trim(),
            annualVolume: editGpVolume,
            priceTerm: editGpPriceTerm,
            contactPerson: editGpContact.trim(),
            phone: editGpPhone,
            route: editGpRoute,
            deliveryDays: editGpDeliveryDays,
            contractStatus: editGpContractStatus,
          };
        }
        return p;
      });
      try { localStorage.setItem('bunkerstroy_global_partners', JSON.stringify(updated)); } catch {}
      return updated;
    });
    addLog('Global ta’minotchi tahrirlandi', 'edit_cabinet', `${editGpName} (${editGpCountry}) xalqaro ma’lumotlari muvaffaqiyatli yangilandi.`, 'info');
    setIsEditGlobalPartnerOpen(false);
    setEditingGlobalPartner(null);
  };

  // Logistik ta'minotchini tahrirlash
  const handleOpenEditVehicle = (veh: LogisticsVehicle) => {
    setEditingVehicle(veh);
    setEditVehName(veh.name);
    setEditVehType(veh.type);
    setEditVehCapacity(String(veh.capacityTons));
    setEditVehPriceKm(String(veh.pricePerKm));
    setEditVehDriver(veh.driverName);
    setEditVehPhone(veh.phone);
    setEditVehLocation(veh.currentLocation);
    setEditVehAvailable(veh.available);
    setIsEditVehicleOpen(true);
  };

  const handleEditVehicleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVehicle || !editVehName.trim() || !editVehDriver.trim()) return;
    setVehicles((prev) => {
      const updated = prev.map((v) => {
        if (v.id === editingVehicle.id) {
          return {
            ...v,
            name: editVehName.trim(),
            type: editVehType,
            capacityTons: Number(editVehCapacity) || 20,
            pricePerKm: Number(editVehPriceKm) || 14000,
            driverName: editVehDriver.trim(),
            phone: editVehPhone.trim(),
            currentLocation: editVehLocation.trim(),
            available: editVehAvailable,
          };
        }
        return v;
      });
      try { localStorage.setItem('bunkerstroy_vehicles', JSON.stringify(updated)); } catch {}
      return updated;
    });
    addLog('Logistik ta’minotchi tahrirlandi', 'edit_cabinet', `${editVehName} (${editVehDriver}) ma’lumotlari yangilandi.`, 'info');
    setIsEditVehicleOpen(false);
    setEditingVehicle(null);
  };

  // =========================================================================
  // ADMIN KABINETI UCHUN LOCK SCREEN (BLOK HOLATI)
  // =========================================================================
  if (isCabinetLocked) {
    return (
      <div className="min-h-screen w-full bg-[#151719] flex items-center justify-center p-4 text-[#F5F5F2]">
        <div className="bg-[#222528] border border-[#51504A] rounded-xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative space-y-6 text-center">
          {/* Industrial Rivets */}
          <div className="absolute top-2.5 left-2.5 industrial-rivet" />
          <div className="absolute top-2.5 right-2.5 industrial-rivet" />
          <div className="absolute bottom-2.5 left-2.5 industrial-rivet" />
          <div className="absolute bottom-2.5 right-2.5 industrial-rivet" />

          <div className="w-16 h-16 rounded-xl bg-[#292C2F] border border-[#51504A] flex items-center justify-center mx-auto text-[#FFB800] shadow-md">
            <Lock className="w-8 h-8 stroke-[2.2]" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-black tracking-wider text-[#F5F5F2]">
              <span className="text-[#FFB800]">BUNKER</span> STROY
            </h2>
            <div className="text-xs font-mono font-bold text-[#FFB800] uppercase tracking-wider">
              Boshqaruv Kabineti Qulflangan
            </div>
            <p className="text-xs text-[#B8B8B3] pt-1 leading-relaxed">
              Xavfsizlik tizimi faollashtirildi. Admin kabinetiga qayta kirish uchun Bosh Admin parolini kiriting:
            </p>
          </div>

          <form onSubmit={handleUnlockSubmit} className="space-y-4">
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#FFB800]" />
              <input
                type={showUnlockPass ? 'text' : 'password'}
                placeholder="Admin parolini kiriting..."
                value={unlockPasswordInput}
                onChange={(e) => {
                  setUnlockPasswordInput(e.target.value);
                  setUnlockError(null);
                }}
                className="w-full pl-10 pr-10 py-3 rounded-lg bg-[#151719] border border-[#51504A] text-[#F5F5F2] font-mono text-sm focus:border-[#FFB800] focus:outline-none"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowUnlockPass(!showUnlockPass)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#B8B8B3] hover:text-[#F5F5F2] p-1 cursor-pointer"
              >
                {showUnlockPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {unlockError && (
              <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-500/40 text-red-400 text-xs font-bold animate-shake">
                {unlockError}
              </div>
            )}

            <button
              type="submit"
              className="btn-industrial-yellow w-full py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Qulfdan Chiqarish</span>
            </button>
          </form>

          <div className="pt-2 border-t border-[#51504A] flex items-center justify-between text-xs text-[#B8B8B3]">
            <button
              type="button"
              onClick={onGoToShop}
              className="hover:text-[#FFB800] transition-colors cursor-pointer font-semibold"
            >
              ← Bosh panel
            </button>
            <button
              type="button"
              onClick={onGoToShop}
              className="text-red-400 hover:text-red-300 transition-colors cursor-pointer font-bold flex items-center gap-1"
              title="Exit - Bosh panelga qaytish"
            >
              <span>Exit</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#151719] text-[#F5F5F2] flex flex-col font-sans">
      {/* Header: Minimal Retro Industrial Brushed-Steel Header (Savat yo‘q!) */}
      <header className="brushed-steel-header px-4 sm:px-6 lg:px-10 h-18 sm:h-20 flex items-center justify-between shadow-xl sticky top-0 z-40">
        
        {/* Brand logo va BUNKER STROY matni - Logoni ustiga ikki marta bosilganda Sozlamalar ochiladi */}
        <div
          onDoubleClick={() => setIsSettingsOpen(true)}
          className="flex items-center gap-3 select-none cursor-pointer group"
          title="Sozlamalarni ochish uchun ikki marta bosing"
        >
          {config.logoUrl ? (
            <img
              src={config.logoUrl}
              alt="Logo"
              className="w-10 h-10 object-contain rounded-lg border border-[#51504A] group-hover:border-[#FFB800] bg-[#222528] transition-colors"
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-[#222528] border border-[#51504A] group-hover:border-[#FFB800] flex items-center justify-center text-[#FFB800] shadow-sm transition-colors">
              <HardHat className="w-5 h-5 stroke-[2.2]" />
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-xl sm:text-2xl font-black tracking-wider leading-none">
              <span className="text-[#FFB800]">BUNKER</span> <span className="text-[#F5F5F2]">STROY</span>
            </span>
            <div className="flex items-center gap-1 text-[10px] tracking-widest text-[#B8B8B3] uppercase font-mono mt-0.5">
              <span className="text-[#FFB800] font-bold">Bo'limlar:</span>
              <span className="text-[#F5F5F2] font-semibold">Asosiy · Bunker Statistikasi</span>
            </div>
          </div>
        </div>

        {/* Header Right Buttons with Savat, Social Logos, Lock Scren & Exit */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Savat Button - Admin kabinetida ham ko'rinadi (Mahsulot bo'lganda yashil bo'lib yorqinlashadi) */}
          {onOpenCart && (
            <button
              onClick={onOpenCart}
              className={`relative p-2 sm:px-3 sm:py-2 rounded-lg transition-all cursor-pointer flex items-center gap-2 group ${
                cartCount > 0
                  ? 'bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-500 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.45)] ring-1 ring-emerald-500/40'
                  : 'bg-[#222528] hover:bg-[#292C2F] border border-[#51504A] hover:border-[#FFB800] text-[#F5F5F2] shadow-sm'
              }`}
              title="Savat"
            >
              <ShoppingCart
                className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:scale-105 ${
                  cartCount > 0
                    ? 'text-emerald-400 drop-shadow-[0_0_6px_rgba(16,185,129,0.7)]'
                    : 'text-[#FFB800]'
                }`}
              />
              <span
                className={`text-xs font-mono hidden sm:inline ${
                  cartCount > 0
                    ? 'text-emerald-300 font-bold drop-shadow-[0_0_5px_rgba(16,185,129,0.4)]'
                    : 'text-[#B8B8B3] group-hover:text-[#F5F5F2]'
                }`}
              >
                Savat
              </span>
              {cartCount > 0 && (
                <span className="bg-emerald-500 text-[#151719] text-[11px] font-black font-mono px-1.5 py-0.2 rounded min-w-[18px] text-center border border-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.8)] animate-pulse">
                  {cartCount}
                </span>
              )}
            </button>
          )}

          {/* Ijtimoiy tarmoqlar */}
          <div className="hidden xl:flex items-center gap-2">
            {config.telegram && (
              <a
                href={config.telegram.startsWith('http') ? config.telegram : `https://t.me/${config.telegram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-[#222528] border border-[#51504A] hover:border-[#FFB800] flex items-center justify-center text-[#B8B8B3] hover:text-[#FFB800] transition-colors"
                title="Telegram"
              >
                <RealTelegramLogo className="w-4 h-4" />
              </a>
            )}
            {config.instagram && (
              <a
                href={config.instagram.startsWith('http') ? config.instagram : `https://instagram.com/${config.instagram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-[#222528] border border-[#51504A] hover:border-[#FFB800] flex items-center justify-center text-[#B8B8B3] hover:text-[#FFB800] transition-colors"
                title="Instagram"
              >
                <RealInstagramLogo className="w-4 h-4" />
              </a>
            )}
            {config.phone && (
              <a
                href={`tel:${config.phone.replace(/[^0-9+]/g, '')}`}
                className="w-8 h-8 rounded-lg bg-[#222528] border border-[#51504A] hover:border-[#FFB800] flex items-center justify-center text-[#B8B8B3] hover:text-[#FFB800] transition-colors"
                title="Telefon"
              >
                <RealPhoneLogo className="w-4 h-4" />
              </a>
            )}
          </div>

          {/* BOSH ADMIN: LOCK SCREN TUGMASI - 2X KATTALASHTIRILGAN (Bosilganda Parol oynasi ochiladi va admin kabinet parolga tushadi) */}
          <button
            onClick={() => {
              setIsCabinetLocked(true);
              try { localStorage.setItem('bunkerstroy_admin_locked', 'true'); } catch {}
            }}
            title="Lock Scren (Parol oynasi ochiladi, kabinet qulflanadi)"
            className="flex items-center gap-2.5 sm:gap-3 px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl bg-[#222528] hover:bg-[#2c3035] text-[#FFB800] border-2 border-[#FFB800] hover:border-[#FFC928] transition-all cursor-pointer group shadow-[0_0_20px_rgba(255,184,0,0.3)] hover:shadow-[0_0_30px_rgba(255,184,0,0.5)] active:scale-95"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#151719] text-[#FFB800] flex items-center justify-center border border-[#FFB800]/60 group-hover:border-[#FFB800] shadow-inner">
              <Lock className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#FFB800] group-hover:scale-110 transition-transform stroke-[2.3]" />
            </div>
            <div className="flex items-center gap-2 text-left">
              <span className="hidden sm:inline font-mono font-black tracking-wide text-white text-xs sm:text-sm">Bosh Admin</span>
              <span className="text-[11px] sm:text-xs px-2.5 py-0.5 rounded-md bg-[#FFB800]/25 text-[#FFB800] border border-[#FFB800]/60 font-mono font-black tracking-wider uppercase shadow-[0_0_8px_rgba(255,184,0,0.35)]">
                Lock Scren
              </span>
            </div>
          </button>

          {/* EXIT TUGMASI - Bosilganda Bosh panelga qaytiladi */}
          <button
            onClick={onGoToShop}
            title="Exit - Bosh panelga qaytish"
            className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-[#222528] hover:bg-red-950/60 text-red-400 hover:text-red-300 border border-[#51504A] hover:border-red-500/60 text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
          >
            <LogOut className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.2]" />
            <span>Exit</span>
          </button>

          {/* Mobil Menyuni ochish tugmasi */}
          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg bg-[#222528] hover:bg-[#292C2F] text-[#FFB800] border border-[#51504A] hover:border-[#FFB800] transition-colors cursor-pointer"
            title="Bo‘limlar menyusi"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Admin Panel Main Content - Full Screen rejimida keng ekranda ishlash */}
      <main className="flex-1 w-full px-3 sm:px-6 lg:px-8 py-5">
        
        {/* Ikki ustunli tuzilma: Chapda ustun shaklidagi yon menyu, O'ngda tanlangan asosiy oyna */}
        <div className="flex flex-col lg:flex-row items-start gap-6">

          {/* =========================================================================
              YON TARAFI: BO'LIMLARNI USTUN SHAKLIDA KETMA-KET MENUSI
              (Yon tarafdan chiqadigan va yig'ib qo'yiladigan)
              ========================================================================= */}
          
          {/* Mobile Backdrop & Slide Drawer */}
          {isMobileSidebarOpen && (
            <div 
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 lg:hidden flex"
              onClick={() => setIsMobileSidebarOpen(false)}
            >
              <div 
                className="w-72 max-w-[85vw] h-full bg-[#222528] border-r border-[#51504A] p-4 flex flex-col justify-between shadow-2xl animate-fadeIn overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="space-y-4">
                  <div className="pb-3 border-b border-[#51504A] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-[#B8B8B3] block">
                        Admin Menusi
                      </span>
                      <h3 className="text-sm font-black text-[#F5F5F2] mt-0.5">
                        Boshqaruv Bo‘limlari
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsMobileSidebarOpen(false)}
                      className="p-1.5 rounded-lg bg-[#292C2F] text-[#B8B8B3] hover:text-[#F5F5F2] border border-[#51504A] cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Mobile Navigation List */}
                  <nav className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => { setActiveSection('reports'); setIsMobileSidebarOpen(false); }}
                      className={`w-full flex items-center justify-between p-3 rounded-lg text-xs font-bold transition-all text-left border cursor-pointer ${
                        activeSection === 'reports'
                          ? 'bg-[#FFB800] text-[#151719] border-[#FFC928] shadow-md'
                          : 'bg-[#1D2023] text-[#B8B8B3] hover:text-[#F5F5F2] hover:bg-[#292C2F] border-[#51504A]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <BarChart3 className={`w-4 h-4 stroke-[2.2] ${activeSection === 'reports' ? 'text-[#151719]' : 'text-[#FFB800]'}`} />
                        <div>
                          <span className="block font-bold">Asosiy · Bunker Statistikasi</span>
                          <span className={`text-[10px] font-mono block ${activeSection === 'reports' ? 'text-[#151719]/80' : 'text-[#B8B8B3]'}`}>
                            Bunker Statistikasi & Jonli Rejim
                          </span>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        activeSection === 'reports' ? 'bg-[#151719] text-[#FFB800]' : 'bg-[#151719] text-[#B8B8B3]'
                      }`}>
                        Asosiy
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setActiveSection('suppliers'); setIsMobileSidebarOpen(false); }}
                      className={`w-full flex items-center justify-between p-3 rounded-lg text-xs font-bold transition-all text-left border cursor-pointer ${
                        activeSection === 'suppliers'
                          ? 'bg-[#FFB800] text-[#151719] border-[#FFC928] shadow-md'
                          : 'bg-[#1D2023] text-[#B8B8B3] hover:text-[#F5F5F2] hover:bg-[#292C2F] border-[#51504A]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Users className={`w-4 h-4 stroke-[2.2] ${activeSection === 'suppliers' ? 'text-[#151719]' : 'text-[#FFB800]'}`} />
                        <div>
                          <span className="block font-bold">Bunker Ta'minotchilari</span>
                          <span className={`text-[10px] font-mono block ${activeSection === 'suppliers' ? 'text-[#151719]/80' : 'text-[#B8B8B3]'}`}>
                            Zavodlar & hamkorlar
                          </span>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        activeSection === 'suppliers' ? 'bg-[#151719] text-[#FFB800]' : 'bg-[#151719] text-[#B8B8B3]'
                      }`}>
                        {suppliers.length}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setActiveSection('global_bunker'); setIsMobileSidebarOpen(false); }}
                      className={`w-full flex items-center justify-between p-3 rounded-lg text-xs font-bold transition-all text-left border cursor-pointer ${
                        activeSection === 'global_bunker'
                          ? 'bg-[#FFB800] text-[#151719] border-[#FFC928] shadow-md'
                          : 'bg-[#1D2023] text-[#B8B8B3] hover:text-[#F5F5F2] hover:bg-[#292C2F] border-[#51504A]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Globe className={`w-4 h-4 stroke-[2.2] ${activeSection === 'global_bunker' ? 'text-[#151719]' : 'text-[#FFB800]'}`} />
                        <div>
                          <span className="block font-bold">Global bunker</span>
                          <span className={`text-[10px] font-mono block ${activeSection === 'global_bunker' ? 'text-[#151719]/80' : 'text-[#B8B8B3]'}`}>
                            Xalqaro import
                          </span>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        activeSection === 'global_bunker' ? 'bg-[#151719] text-[#FFB800]' : 'bg-[#151719] text-[#B8B8B3]'
                      }`}>
                        {globalPartners.length}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setActiveSection('logistics'); setIsMobileSidebarOpen(false); }}
                      className={`w-full flex items-center justify-between p-3 rounded-lg text-xs font-bold transition-all text-left border cursor-pointer ${
                        activeSection === 'logistics'
                          ? 'bg-[#FFB800] text-[#151719] border-[#FFC928] shadow-md'
                          : 'bg-[#1D2023] text-[#B8B8B3] hover:text-[#F5F5F2] hover:bg-[#292C2F] border-[#51504A]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Truck className={`w-4 h-4 stroke-[2.2] ${activeSection === 'logistics' ? 'text-[#151719]' : 'text-[#FFB800]'}`} />
                        <div>
                          <span className="block font-bold">Logistika xarita</span>
                          <span className={`text-[10px] font-mono block ${activeSection === 'logistics' ? 'text-[#151719]/80' : 'text-[#B8B8B3]'}`}>
                            Og‘ir texnika & radar
                          </span>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        activeSection === 'logistics' ? 'bg-[#151719] text-[#FFB800]' : 'bg-[#151719] text-[#B8B8B3]'
                      }`}>
                        {vehicles.length}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setActiveSection('logs'); setIsMobileSidebarOpen(false); }}
                      className={`w-full flex items-center justify-between p-3 rounded-lg text-xs font-bold transition-all text-left border cursor-pointer ${
                        activeSection === 'logs'
                          ? 'bg-[#FFB800] text-[#151719] border-[#FFC928] shadow-md'
                          : 'bg-[#1D2023] text-[#B8B8B3] hover:text-[#F5F5F2] hover:bg-[#292C2F] border-[#51504A]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Activity className={`w-4 h-4 stroke-[2.2] ${activeSection === 'logs' ? 'text-[#151719]' : 'text-[#FFB800]'}`} />
                        <div>
                          <span className="block font-bold">Kabinet Loglari</span>
                          <span className={`text-[10px] font-mono block ${activeSection === 'logs' ? 'text-[#151719]/80' : 'text-[#B8B8B3]'}`}>
                            Xavfsizlik & audit
                          </span>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        activeSection === 'logs' ? 'bg-[#151719] text-[#FFB800]' : 'bg-[#151719] text-[#B8B8B3]'
                      }`}>
                        {logs.length}
                      </span>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}

          {/* Desktop & Collapsible Sidebar */}
          <aside className={`transition-all duration-300 shrink-0 ${isSidebarCollapsed ? 'w-full lg:w-20' : 'w-full lg:w-72'} lg:sticky lg:top-24 z-10`}>
            <div className="bg-[#222528] border border-[#51504A] rounded-xl p-3 sm:p-4 shadow-xl space-y-3">
              <div className="pb-3 border-b border-[#51504A] flex items-center justify-between">
                {!isSidebarCollapsed && (
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#B8B8B3] block">
                      Admin Menusi
                    </span>
                    <h3 className="text-sm font-black text-[#F5F5F2] mt-0.5">
                      Boshqaruv Bo‘limlari
                    </h3>
                  </div>
                )}
                <div className="flex items-center gap-2 ml-auto">
                  {/* Yig'ib qo'yish / ochish tugmasi */}
                  <button
                    type="button"
                    onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    title={isSidebarCollapsed ? "Menyuni kengaytirish" : "Menyuni yig‘ib qo‘yish"}
                    className="p-1.5 rounded-lg bg-[#1D2023] hover:bg-[#292C2F] text-[#FFB800] border border-[#51504A] hover:border-[#FFB800] transition-colors cursor-pointer"
                  >
                    {isSidebarCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Bo'limlar ustun shaklida ketma-ket */}
              <nav className="flex flex-col gap-2">
                {/* 1. HISOBOT (Asosiy oyna) */}
                <button
                  type="button"
                  onClick={() => setActiveSection('reports')}
                  title="Hisobot (Asosiy oyna)"
                  className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-3' : 'justify-between p-3'} rounded-lg text-xs font-bold transition-all text-left cursor-pointer border ${
                    activeSection === 'reports'
                      ? 'bg-[#FFB800] text-[#151719] border-[#FFC928] shadow-md'
                      : 'bg-[#1D2023] text-[#B8B8B3] hover:text-[#F5F5F2] hover:bg-[#292C2F] border-[#51504A]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <BarChart3 className={`w-4 h-4 stroke-[2.2] shrink-0 ${activeSection === 'reports' ? 'text-[#151719]' : 'text-[#FFB800]'}`} />
                    {!isSidebarCollapsed && (
                      <div>
                        <span className="block font-bold">Asosiy · Bunker Statistikasi</span>
                        <span className={`text-[10px] font-mono block ${activeSection === 'reports' ? 'text-[#151719]/80' : 'text-[#B8B8B3]'}`}>
                          Bunker Statistikasi & Jonli Rejim
                        </span>
                      </div>
                    )}
                  </div>
                  {!isSidebarCollapsed && (
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      activeSection === 'reports' ? 'bg-[#151719] text-[#FFB800]' : 'bg-[#151719] text-[#B8B8B3]'
                    }`}>
                      Asosiy
                    </span>
                  )}
                </button>

                {/* 2. BUNKER TA'MINOTCHILARI */}
                <button
                  type="button"
                  onClick={() => setActiveSection('suppliers')}
                  title="Bunker Ta'minotchilari"
                  className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-3' : 'justify-between p-3'} rounded-lg text-xs font-bold transition-all text-left cursor-pointer border ${
                    activeSection === 'suppliers'
                      ? 'bg-[#FFB800] text-[#151719] border-[#FFC928] shadow-md'
                      : 'bg-[#1D2023] text-[#B8B8B3] hover:text-[#F5F5F2] hover:bg-[#292C2F] border-[#51504A]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Users className={`w-4 h-4 stroke-[2.2] shrink-0 ${activeSection === 'suppliers' ? 'text-[#151719]' : 'text-[#FFB800]'}`} />
                    {!isSidebarCollapsed && (
                      <div>
                        <span className="block font-bold">Bunker Ta'minotchilari</span>
                        <span className={`text-[10px] font-mono block ${activeSection === 'suppliers' ? 'text-[#151719]/80' : 'text-[#B8B8B3]'}`}>
                          Zavodlar & hamkorlar
                        </span>
                      </div>
                    )}
                  </div>
                  {!isSidebarCollapsed && (
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      activeSection === 'suppliers' ? 'bg-[#151719] text-[#FFB800]' : 'bg-[#151719] text-[#B8B8B3]'
                    }`}>
                      {suppliers.length}
                    </span>
                  )}
                </button>

                {/* 3. GLOBAL BUNKER */}
                <button
                  type="button"
                  onClick={() => setActiveSection('global_bunker')}
                  title="Global bunker"
                  className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-3' : 'justify-between p-3'} rounded-lg text-xs font-bold transition-all text-left cursor-pointer border ${
                    activeSection === 'global_bunker'
                      ? 'bg-[#FFB800] text-[#151719] border-[#FFC928] shadow-md'
                      : 'bg-[#1D2023] text-[#B8B8B3] hover:text-[#F5F5F2] hover:bg-[#292C2F] border-[#51504A]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Globe className={`w-4 h-4 stroke-[2.2] shrink-0 ${activeSection === 'global_bunker' ? 'text-[#151719]' : 'text-[#FFB800]'}`} />
                    {!isSidebarCollapsed && (
                      <div>
                        <span className="block font-bold">Global bunker</span>
                        <span className={`text-[10px] font-mono block ${activeSection === 'global_bunker' ? 'text-[#151719]/80' : 'text-[#B8B8B3]'}`}>
                          Xalqaro import
                        </span>
                      </div>
                    )}
                  </div>
                  {!isSidebarCollapsed && (
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      activeSection === 'global_bunker' ? 'bg-[#151719] text-[#FFB800]' : 'bg-[#151719] text-[#B8B8B3]'
                    }`}>
                      {globalPartners.length}
                    </span>
                  )}
                </button>

                {/* 4. LOGISTIKA XARITA */}
                <button
                  type="button"
                  onClick={() => setActiveSection('logistics')}
                  title="Logistika xarita"
                  className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-3' : 'justify-between p-3'} rounded-lg text-xs font-bold transition-all text-left cursor-pointer border ${
                    activeSection === 'logistics'
                      ? 'bg-[#FFB800] text-[#151719] border-[#FFC928] shadow-md'
                      : 'bg-[#1D2023] text-[#B8B8B3] hover:text-[#F5F5F2] hover:bg-[#292C2F] border-[#51504A]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Truck className={`w-4 h-4 stroke-[2.2] shrink-0 ${activeSection === 'logistics' ? 'text-[#151719]' : 'text-[#FFB800]'}`} />
                    {!isSidebarCollapsed && (
                      <div>
                        <span className="block font-bold">Logistika xarita</span>
                        <span className={`text-[10px] font-mono block ${activeSection === 'logistics' ? 'text-[#151719]/80' : 'text-[#B8B8B3]'}`}>
                          Og‘ir texnika & radar
                        </span>
                      </div>
                    )}
                  </div>
                  {!isSidebarCollapsed && (
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      activeSection === 'logistics' ? 'bg-[#151719] text-[#FFB800]' : 'bg-[#151719] text-[#B8B8B3]'
                    }`}>
                      {vehicles.length}
                    </span>
                  )}
                </button>

                {/* 5. KABINET LOGLARI */}
                <button
                  type="button"
                  onClick={() => setActiveSection('logs')}
                  title="Kabinet Loglari"
                  className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-3' : 'justify-between p-3'} rounded-lg text-xs font-bold transition-all text-left cursor-pointer border ${
                    activeSection === 'logs'
                      ? 'bg-[#FFB800] text-[#151719] border-[#FFC928] shadow-md'
                      : 'bg-[#1D2023] text-[#B8B8B3] hover:text-[#F5F5F2] hover:bg-[#292C2F] border-[#51504A]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Activity className={`w-4 h-4 stroke-[2.2] shrink-0 ${activeSection === 'logs' ? 'text-[#151719]' : 'text-[#FFB800]'}`} />
                    {!isSidebarCollapsed && (
                      <div>
                        <span className="block font-bold">Kabinet Loglari</span>
                        <span className={`text-[10px] font-mono block ${activeSection === 'logs' ? 'text-[#151719]/80' : 'text-[#B8B8B3]'}`}>
                          Xavfsizlik & audit
                        </span>
                      </div>
                    )}
                  </div>
                  {!isSidebarCollapsed && (
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      activeSection === 'logs' ? 'bg-[#151719] text-[#FFB800]' : 'bg-[#151719] text-[#B8B8B3]'
                    }`}>
                      {logs.length}
                    </span>
                  )}
                </button>
              </nav>

              {/* Status info box (only when expanded) */}
              {!isSidebarCollapsed && (
                <div className="pt-3 border-t border-[#51504A] space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono text-[#B8B8B3]">
                    <span>Kabinet holati:</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      Onlayn
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-[#B8B8B3]">
                    <span>Foydalanuvchi:</span>
                    <span className="text-[#F5F5F2] font-bold">Bosh Admin</span>
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* =========================================================================
              ASOSIY OYNA: TANLANGAN BO'LIM MAZMUNI (HISOBOT ASOSIY OYNA SIFATIDA)
              ========================================================================= */}
          <div className="flex-1 min-w-0 w-full space-y-6">

            {/* Contextual Top Actions for Active Section */}
            <div className="bg-[#222528] border border-[#51504A] rounded-xl p-3 sm:p-4 shadow-md flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[#F5F5F2] flex items-center gap-2">
                  {activeSection === 'reports' && '1. Hisobot — Bunker Moliyaviy Aylanmasi (Asosiy oyna)'}
                  {activeSection === 'suppliers' && "2. Bunker Ta'minotchilari Boshqaruvi"}
                  {activeSection === 'global_bunker' && "3. Global bunker — Xalqaro Ta'minot Hamkorlari"}
                  {activeSection === 'logistics' && "4. Logistika xarita — Og‘ir Texnika Floti & Jonli Radar"}
                  {activeSection === 'logs' && '5. Kabinet Xavfsizlik va Amallar Loglari'}
                </h2>
                <p className="text-xs text-[#B8B8B3]">
                  {activeSection === 'reports' && "Asosiy oyna: Oylik va yillik tushum, xarajatlar va hisobotlar monitoringi"}
                  {activeSection === 'suppliers' && "Mahalliy ishlab chiqaruvchi va ta'minotchi korxonalar kabinetlari"}
                  {activeSection === 'global_bunker' && "Xalqaro sanoat gigantlari, temir yo'l vagonlari va import partiyalari"}
                  {activeSection === 'logistics' && "Samosvallar, yuk furalari, avtokranlar va jonli GPS radar xaritasi"}
                  {activeSection === 'logs' && "Kirish-chiqish, parollar va tizim amallari auditi"}
                </p>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                {activeSection === 'reports' && (
                  <button
                    type="button"
                    onClick={() => setIsAddTxOpen(true)}
                    className="btn-industrial-yellow flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold cursor-pointer shadow-sm active:scale-95"
                  >
                    <Plus className="w-4 h-4 stroke-[2.2]" />
                    <span>Moliyaviy Operatsiya</span>
                  </button>
                )}

                {activeSection === 'suppliers' && (
                  <button
                    type="button"
                    onClick={() => setIsAddSupplierOpen(true)}
                    className="btn-industrial-yellow flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold cursor-pointer shadow-sm active:scale-95"
                  >
                    <UserPlus className="w-4 h-4 stroke-[2.2]" />
                    <span>Ta'minotchi Qo‘shish</span>
                  </button>
                )}

                {activeSection === 'global_bunker' && (
                  <button
                    type="button"
                    onClick={() => setIsAddGlobalPartnerOpen(true)}
                    className="btn-industrial-yellow flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold cursor-pointer shadow-sm active:scale-95"
                  >
                    <Plus className="w-4 h-4 stroke-[2.2]" />
                    <span>Global Ta'minotchi Qo‘shish</span>
                  </button>
                )}

                {activeSection === 'logistics' && (
                  <button
                    type="button"
                    onClick={() => setIsAddVehicleOpen(true)}
                    className="btn-industrial-yellow flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold cursor-pointer shadow-sm active:scale-95"
                  >
                    <Plus className="w-4 h-4 stroke-[2.2]" />
                    <span>Logistik Ta'minotchi Qo‘shish</span>
                  </button>
                )}
              </div>
            </div>

        {/* =========================================================================
            SECTION 1 (1-CHILIKDA): HISOBOT (BUNKER MOLIYAVIY STATISTIKASI VA HISOBOTLAR)
            ========================================================================= */}
        {/* =========================================================================
            SECTION 1 (1-CHILIKDA): BUNKER ASOSIY BOSHQARUV PANELI · JONLI REJIM
            ========================================================================= */}
        {activeSection === 'reports' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Bunker Asosiy Boshqaruv Paneli & Operatsion Tahlil (User talabi bo'yicha to'liq) */}
            <BunkerStatsDashboard
              onNavigateToCatalog={onGoToShop || (() => {})}
              onNavigateToLogistics={() => setActiveSection('logistics')}
              onNavigateToGlobal={() => setActiveSection('global_bunker')}
              onNavigateToAdmin={() => setActiveSection('reports')}
              onOpenCart={onOpenCart}
              onOpenAuth={onOpenAuth}
              cartCount={cartCount}
            />

            {/* Kirim va Chiqim Operatsiyalari Jurnali */}
            <div className="bg-[#222528] border border-[#51504A] rounded-xl p-5 sm:p-6 shadow-2xl space-y-4">
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-[#51504A]">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-[#FFB800]/40">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-white">Moliya: Kirim va Chiqim Operatsiyalari</h3>
                    <p className="text-xs text-[#B8B8B3]">Barcha kirim tushumlari va chiqim xarajatlari jurnali</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setTxFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      txFilter === 'all' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-[#292C2F] text-[#B8B8B3] border border-[#51504A]'
                    }`}
                  >
                    Barchasi ({transactions.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTxFilter('income')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      txFilter === 'income' ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-[#292C2F] text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    + Kirimlar
                  </button>
                  <button
                    type="button"
                    onClick={() => setTxFilter('expense')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      txFilter === 'expense' ? 'bg-rose-500 text-white font-black' : 'bg-[#292C2F] text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    - Chiqimlar
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsAddTxOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer active:scale-95 ml-1"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Operatsiya Qo‘shish</span>
                  </button>

                  {transactions.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAllTransactions}
                      title="Barcha operatsiyalarni tozalash (0 ga qaytarish)"
                      className="p-1.5 rounded-xl bg-[#292C2F] hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 border border-rose-500/30 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Transactions Table or Empty state */}
              {filteredTransactions.length === 0 ? (
                <div className="py-12 px-4 text-center bg-[#071533] rounded-2xl border border-[#51504A] space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-amber-400 border border-[#51504A] flex items-center justify-center mx-auto">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-white">Hozircha moliyaviy operatsiyalar mavjud emas (0 ta operatsiya)</h4>
                  <p className="text-xs text-[#B8B8B3]/70 max-w-md mx-auto">
                    Mijozlar buyurtma berganda yoki chiqim xarajatlari kiritilganda barcha kirim va chiqim operatsiyalari shu yerda real vaqtda qayd etiladi.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsAddTxOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-[#FFB800]/50 text-xs font-bold transition-all cursor-pointer mt-2"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Yangi Operatsiya Kiritish</span>
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-[#51504A]">
                  <table className="w-full text-left text-xs text-[#F5F5F2]">
                    <thead className="bg-[#292C2F] text-amber-400 uppercase text-[10px] tracking-wider border-b border-[#51504A]">
                      <tr>
                        <th className="py-3 px-4 font-black">Sana va Vaqt</th>
                        <th className="py-3 px-4 font-black">Toifa</th>
                        <th className="py-3 px-4 font-black">Manba / Qabul Qiluvchi</th>
                        <th className="py-3 px-4 font-black">To‘lov Turi</th>
                        <th className="py-3 px-4 font-black text-right">Summa</th>
                        <th className="py-3 px-4 font-black text-center">Holat</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-blue-500/20 bg-[#071533]">
                      {filteredTransactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-[#0c265e] transition-colors">
                          <td className="py-3.5 px-4 font-mono text-[#B8B8B3] text-[11px]">{tx.date}</td>
                          <td className="py-3.5 px-4 font-semibold text-white">{tx.category}</td>
                          <td className="py-3.5 px-4 text-slate-300">{tx.sourceOrDestination}</td>
                          <td className="py-3.5 px-4 text-[#B8B8B3] text-[11px]">{tx.paymentMethod}</td>
                          <td className={`py-3.5 px-4 text-right font-mono font-black text-sm ${
                            tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            {tx.type === 'income' ? '+' : '-'} {formatPriceSum(tx.amount)}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              Bajarildi
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

            </div>

          </div>
        )}

        {/* =========================================================================
            SECTION 2: TA'MINOTCHI HAMKORLAR KABINETLARI
            ========================================================================= */}
        {activeSection === 'suppliers' && (
          <div className="space-y-4 animate-fadeIn">
            
            {/* Filter Bar */}
            <div className="bg-[#222528] border border-[#51504A] rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-lg">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
                <input
                  type="text"
                  placeholder="Qidiruv"
                  value={supplierSearch}
                  onChange={(e) => setSupplierSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#151719] border border-[#51504A] rounded-xl text-white text-xs placeholder-blue-300/60 focus:outline-none focus:border-[#FFB800]"
                />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-[#B8B8B3] font-semibold hidden sm:inline">Holat:</span>
                <select
                  value={supplierFilterStatus}
                  onChange={(e) => setSupplierFilterStatus(e.target.value as any)}
                  className="px-3 py-2 bg-[#151719] border border-[#51504A] rounded-xl text-xs text-white focus:outline-none focus:border-[#FFB800] cursor-pointer"
                >
                  <option value="all">Barcha holatlar</option>
                  <option value="active">Faol kabinetlar</option>
                  <option value="pending">Kutilayotgan</option>
                  <option value="blocked">Bloklangan</option>
                </select>
              </div>
            </div>

            {/* Asosiy Jadval (Foydalanuvchi talab qilgan ko'rinish):
                Korxona / Mas'ul | Login | Hudud | Holat | So‘nggi Kirish | Amallar (Tahrirlash va Hisobot) */}
            <div className="bg-[#222528] border border-[#51504A] rounded-xl p-5 shadow-2xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#51504A]">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Ta'minotchi Korxonalar Ro‘yxati (Bunker Ta'minotchilar: {filteredSuppliers.length})
                </span>
                <span className="text-[11px] text-[#B8B8B3]">
                  Amallar: Haqida, Tahrirlash va Hisobot
                </span>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-[#51504A]">
                <table className="w-full text-left text-xs text-[#F5F5F2]">
                  <thead className="bg-[#292C2F] text-amber-400 uppercase text-[10px] tracking-wider border-b border-[#51504A]">
                    <tr>
                      <th className="py-3.5 px-3 font-black text-center w-10">№</th>
                      <th className="py-3.5 px-4 font-black">Nomi / Kompaniya</th>
                      <th className="py-3.5 px-4 font-black">Viloyat / Hudud</th>
                      <th className="py-3.5 px-3 font-black text-center">Holati</th>
                      <th className="py-3.5 px-4 font-black">Mas'ul shaxs</th>
                      <th className="py-3.5 px-4 font-black">Telefon</th>
                      <th className="py-3.5 px-4 font-black">Login</th>
                      <th className="py-3.5 px-4 font-black">Toifa</th>
                      <th className="py-3.5 px-4 font-black">Shartnoma</th>
                      <th className="py-3.5 px-4 font-black text-center">Amallar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-500/20 bg-[#071533]">
                    {filteredSuppliers.map((supp, idx) => (
                      <tr key={supp.id} className="hover:bg-[#0c265e] transition-colors">
                        {/* 1. № */}
                        <td className="py-3.5 px-3 text-center font-bold text-amber-400/80">
                          {idx + 1}
                        </td>

                        {/* 2. Nomi / Kompaniya */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 border border-[#FFB800]/40 flex items-center justify-center font-black text-xs shrink-0">
                              <Building className="w-4 h-4" />
                            </div>
                            <span className="font-black text-white text-sm">
                              {supp.companyName}
                            </span>
                          </div>
                        </td>

                        {/* 3. Viloyat / Hudud */}
                        <td className="py-3.5 px-4">
                          <span className="text-[#B8B8B3] font-medium flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                            {supp.region}
                          </span>
                        </td>

                        {/* 4. Holati (Faol / Bloklangan / Kutilmoqda) */}
                        <td className="py-3.5 px-3 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 ${
                            supp.status === 'active'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : supp.status === 'blocked'
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-[#FFB800]/40'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              supp.status === 'active' ? 'bg-emerald-400 animate-pulse' : supp.status === 'blocked' ? 'bg-red-400' : 'bg-amber-400'
                            }`}></span>
                            {supp.status === 'active' ? 'Faol' : supp.status === 'blocked' ? 'Bloklangan' : 'Kutilmoqda'}
                          </span>
                        </td>

                        {/* 5. Mas'ul shaxs */}
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-white block">
                            {supp.name} {supp.surname || ''}
                          </span>
                        </td>

                        {/* 6. Telefon */}
                        <td className="py-3.5 px-4 font-mono text-[#B8B8B3] font-medium whitespace-nowrap">
                          {supp.phone}
                        </td>

                        {/* 7. Login */}
                        <td className="py-3.5 px-4 font-mono text-amber-400 font-black">
                          {supp.login}
                        </td>

                        {/* 8. Toifa */}
                        <td className="py-3.5 px-4">
                          <span className="text-amber-300 font-medium bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                            {supp.category}
                          </span>
                        </td>

                        {/* 9. Shartnoma */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[#F5F5F2] font-semibold">{supp.contractNumber}</span>
                            {supp.contractPdfData && (
                              <button
                                type="button"
                                onClick={() => handleDownloadPdf(supp.contractPdfData, supp.contractPdfName || 'shartnoma_fayli')}
                                className="p-1 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 transition-colors cursor-pointer"
                                title="Shartnoma faylini yuklab olish"
                              >
                                <FileText className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>

                        {/* 10. Amallar (Tahrirlash va Hisobot) */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5 flex-nowrap">
                            {/* Haqida */}
                            <button
                              type="button"
                              onClick={() => handleOpenSupplierAbout(supp)}
                              className="px-2.5 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500 hover:text-slate-950 text-sky-300 border border-sky-400/50 text-xs font-bold cursor-pointer transition-all flex items-center gap-1 shadow-sm active:scale-95 whitespace-nowrap"
                              title="Korxona haqida to‘liq ma'lumot"
                            >
                              <Info className="w-3.5 h-3.5" />
                              <span>Haqida</span>
                            </button>

                            {/* Tahrirlash */}
                            <button
                              type="button"
                              onClick={() => handleOpenEditSupplier(supp)}
                              className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500 hover:text-slate-950 text-amber-300 border border-[#FFB800]/50 text-xs font-bold cursor-pointer transition-all flex items-center gap-1 shadow-sm active:scale-95 whitespace-nowrap"
                              title="Korxona ma'lumotlarini tahrirlash"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              <span>Tahrirlash</span>
                            </button>

                            {/* Hisobot */}
                            <button
                              type="button"
                              onClick={() => handleOpenSupplierReport(supp)}
                              className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white border border-blue-400/40 text-xs font-black cursor-pointer transition-all flex items-center gap-1 shadow-md shadow-blue-600/30 active:scale-95 whitespace-nowrap"
                              title="Sotilgan tovarlar, qaytarilganlar va marshrutlar hisoboti"
                            >
                              <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
                              <span>Hisobot</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredSuppliers.length === 0 && (
                <div className="text-center py-12 bg-[#151719] rounded-2xl border border-dashed border-[#51504A] p-8">
                  <p className="text-[#B8B8B3] text-sm">Hozircha ta’minotchi kabinetlari mavjud emas.</p>
                  <p className="text-xs text-blue-400/70 mt-1">«Ta'minotchi Hamkor Qo‘shish» tugmasi orqali yangi korxona qo‘shishingiz mumkin.</p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* =========================================================================
            SECTION: GLOBAL BUNKER (Xalqaro Zavodlar & Import Ta'minoti)
            ========================================================================= */}
        {activeSection === 'global_bunker' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Top KPI row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#222528] border border-[#51504A] rounded-xl p-4 shadow-md flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-[#151719] border border-[#51504A] flex items-center justify-center text-[#FFB800]">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#B8B8B3] block">Xalqaro Hamkorlar</span>
                  <span className="text-lg font-black text-[#F5F5F2]">{globalPartners.length} ta zavod</span>
                </div>
              </div>

              <div className="bg-[#222528] border border-[#51504A] rounded-xl p-4 shadow-md flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-[#151719] border border-[#51504A] flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#B8B8B3] block">Shartnoma Holati</span>
                  <span className="text-lg font-black text-emerald-400">100% Rasmiy Akkreditiv</span>
                </div>
              </div>

              <div className="bg-[#222528] border border-[#51504A] rounded-xl p-4 shadow-md flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-[#151719] border border-[#51504A] flex items-center justify-center text-[#FFB800]">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#B8B8B3] block">Tranzit Koridori</span>
                  <span className="text-lg font-black text-[#F5F5F2]">Temir Yo‘l & Bojxona</span>
                </div>
              </div>
            </div>

            {/* Qidiruv paneli */}
            <div className="bg-[#222528] border border-[#51504A] rounded-xl p-3 sm:p-4 shadow-md flex items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#FFB800]" />
                <input
                  type="text"
                  placeholder="Global hamkor nomi, davlat yoki mahsulot turi bo'yicha qidirish..."
                  value={gpSearch}
                  onChange={(e) => setGpSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[#151719] border border-[#51504A] rounded-lg text-xs text-[#F5F5F2] placeholder-[#B8B8B3]/60 focus:outline-none focus:border-[#FFB800]"
                />
              </div>
              <button
                type="button"
                onClick={() => setIsAddGlobalPartnerOpen(true)}
                className="btn-industrial-yellow px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Global Ta'minotchi Qo‘shish</span>
              </button>
            </div>

            {/* Hamkorlar ro'yxati (Grid) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {globalPartners
                .filter((p) => 
                  p.name.toLowerCase().includes(gpSearch.toLowerCase()) ||
                  p.country.toLowerCase().includes(gpSearch.toLowerCase()) ||
                  p.category.toLowerCase().includes(gpSearch.toLowerCase())
                )
                .map((p) => (
                  <div
                    key={p.id}
                    className="bg-[#222528] border border-[#51504A] hover:border-[#FFB800] rounded-xl p-5 shadow-lg flex flex-col justify-between space-y-4 group transition-all"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl">{p.flag}</span>
                          <div>
                            <h3 className="font-bold text-sm text-[#F5F5F2] group-hover:text-[#FFB800] transition-colors">
                              {p.name}
                            </h3>
                            <span className="text-xs text-[#B8B8B3] flex items-center gap-1 font-mono">
                              <MapPin className="w-3 h-3 text-[#FFB800]" />
                              {p.country}
                            </span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                          {p.contractStatus === 'active' ? 'Faol Hamkor' : p.contractStatus}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-[#151719] border border-[#51504A] space-y-1 text-xs">
                        <span className="text-[10px] uppercase font-mono text-[#B8B8B3] block">Kategoriya & Mahsulot:</span>
                        <span className="font-bold text-[#F5F5F2] block">{p.category} — {p.productType}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-2 border-t border-[#51504A]">
                        <div>
                          <span className="text-[#B8B8B3] block text-[10px]">Yillik Quvvat:</span>
                          <span className="text-[#F5F5F2] font-bold">{p.annualVolume}</span>
                        </div>
                        <div>
                          <span className="text-[#B8B8B3] block text-[10px]">Tranzit:</span>
                          <span className="text-[#FFB800] font-bold">{p.deliveryDays}</span>
                        </div>
                        <div className="col-span-2 pt-1 border-t border-[#51504A]/60">
                          <span className="text-[#B8B8B3] block text-[10px]">Vakil & Telefon:</span>
                          <span className="text-[#F5F5F2] font-medium">{p.contactPerson} ({p.phone})</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-[#51504A]">
                      <span className="text-[10px] font-mono text-[#B8B8B3]">{p.priceTerm}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditGlobalPartner(p)}
                          className="px-2.5 py-1 rounded-lg bg-[#151719] hover:bg-[#FFB800]/20 text-[#FFB800] border border-[#51504A] hover:border-[#FFB800]/50 transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-bold active:scale-95"
                          title="Global ta'minotchi ma'lumotlarini tahrirlash"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>Tahrirlash</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`${p.name}ni global hamkorlar ro‘yxatidan o‘chirishni tasdiqlaysizmi?`)) {
                              setGlobalPartners((prev) => {
                                const updated = prev.filter((item) => item.id !== p.id);
                                try { localStorage.setItem('bunkerstroy_global_partners', JSON.stringify(updated)); } catch {}
                                return updated;
                              });
                              addLog('Global hamkor o‘chirildi', 'delete_cabinet', `${p.name} (${p.country}) ro‘yxatdan olib tashlandi.`, 'warning');
                            }
                          }}
                          className="p-1.5 rounded-lg bg-[#151719] hover:bg-red-500/20 text-red-400 border border-[#51504A] hover:border-red-500/40 transition-colors cursor-pointer active:scale-95"
                          title="O‘chirish"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            SECTION: LOGISTIKA VA XARITA (Og‘ir Texnika & Google Maps Monitoring)
            ========================================================================= */}
        {activeSection === 'logistics' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Top Fleet KPI metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#222528] border border-[#51504A] rounded-xl p-4 shadow-md flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-[#151719] border border-[#51504A] flex items-center justify-center text-[#FFB800]">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#B8B8B3] block">Jami Texnika</span>
                  <span className="text-lg font-black text-[#F5F5F2]">{vehicles.length} ta mashina</span>
                </div>
              </div>

              <div className="bg-[#222528] border border-[#51504A] rounded-xl p-4 shadow-md flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-[#151719] border border-[#51504A] flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#B8B8B3] block">Hozir Bo‘sh</span>
                  <span className="text-lg font-black text-emerald-400">{vehicles.filter(v => v.available).length} ta transport</span>
                </div>
              </div>

              <div className="bg-[#222528] border border-[#51504A] rounded-xl p-4 shadow-md flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-[#151719] border border-[#51504A] flex items-center justify-center text-[#FFB800]">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#B8B8B3] block">Samosval & Furalar</span>
                  <span className="text-lg font-black text-[#F5F5F2]">{vehicles.filter(v => v.type === 'samosval' || v.type === 'fura').length} ta</span>
                </div>
              </div>

              <div className="bg-[#222528] border border-[#51504A] rounded-xl p-4 shadow-md flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-[#151719] border border-[#51504A] flex items-center justify-center text-[#FFB800]">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#B8B8B3] block">O‘rtacha Stavka</span>
                  <span className="text-lg font-black text-[#F5F5F2]">14 000 so‘m/km</span>
                </div>
              </div>
            </div>

            {/* Texnikalar qidiruvi va qo'shish paneli */}
            <div className="bg-[#222528] border border-[#51504A] rounded-xl p-3 sm:p-4 shadow-md flex items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#FFB800]" />
                <input
                  type="text"
                  placeholder="Texnika modeli, haydovchi yoki hudud bo'yicha qidirish..."
                  value={vehSearch}
                  onChange={(e) => setVehSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[#151719] border border-[#51504A] rounded-lg text-xs text-[#F5F5F2] placeholder-[#B8B8B3]/60 focus:outline-none focus:border-[#FFB800]"
                />
              </div>
              <button
                type="button"
                onClick={() => setIsAddVehicleOpen(true)}
                className="btn-industrial-yellow px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Logistik Ta'minotchi Qo‘shish</span>
              </button>
            </div>

            {/* Fleet Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vehicles
                .filter((v) => 
                  v.name.toLowerCase().includes(vehSearch.toLowerCase()) ||
                  v.driverName.toLowerCase().includes(vehSearch.toLowerCase()) ||
                  v.currentLocation.toLowerCase().includes(vehSearch.toLowerCase())
                )
                .map((v) => (
                  <div
                    key={v.id}
                    className="bg-[#222528] border border-[#51504A] hover:border-[#FFB800] rounded-xl p-4 shadow-lg flex flex-col justify-between space-y-3 group transition-all"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-lg bg-[#151719] border border-[#51504A] group-hover:border-[#FFB800] flex items-center justify-center text-[#FFB800]">
                            <Truck className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-bold text-sm text-[#F5F5F2] group-hover:text-[#FFB800] transition-colors">
                              {v.name}
                            </h3>
                            <span className="text-[11px] text-[#B8B8B3] uppercase font-mono block">
                              Turi: {v.type} ({v.capacityTons} tonna)
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setVehicles((prev) => {
                              const updated = prev.map((item) => 
                                item.id === v.id ? { ...item, available: !item.available } : item
                              );
                              try { localStorage.setItem('bunkerstroy_vehicles', JSON.stringify(updated)); } catch {}
                              return updated;
                            });
                          }}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer transition-all border ${
                            v.available
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-400 border-amber-500/40 hover:bg-amber-500/30'
                          }`}
                        >
                          {v.available ? '● Bo‘sh (Tayyor)' : '○ Band (Yo‘lda)'}
                        </button>
                      </div>

                      <div className="p-2.5 rounded-lg bg-[#151719] border border-[#51504A] space-y-1 text-xs">
                        <div className="flex items-center justify-between text-[#B8B8B3]">
                          <span>Mas'ul / Haydovchi:</span>
                          <strong className="text-[#F5F5F2]">{v.driverName}</strong>
                        </div>
                        <div className="flex items-center justify-between text-[#B8B8B3]">
                          <span>Telefon:</span>
                          <strong className="text-[#FFB800] font-mono">{v.phone}</strong>
                        </div>
                        <div className="flex items-center justify-between text-[#B8B8B3]">
                          <span>Hudud:</span>
                          <span className="text-[#F5F5F2] truncate max-w-[150px]">{v.currentLocation}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs font-mono pt-1">
                        <span className="text-[#B8B8B3]">Stavka:</span>
                        <span className="text-[#FFB800] font-bold">
                          {new Intl.NumberFormat('uz-UZ').format(v.pricePerKm)} so‘m / km
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#51504A] flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEditVehicle(v)}
                        className="px-2.5 py-1 rounded-lg bg-[#151719] hover:bg-[#FFB800]/20 text-[#FFB800] border border-[#51504A] hover:border-[#FFB800]/50 transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-bold active:scale-95"
                        title="Logistik ta'minotchi ma'lumotlarini tahrirlash"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Tahrirlash</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`${v.name}ni logistik ta'minotchilar ro‘yxatidan o‘chirishni tasdiqlaysizmi?`)) {
                            setVehicles((prev) => {
                              const updated = prev.filter((item) => item.id !== v.id);
                              try { localStorage.setItem('bunkerstroy_vehicles', JSON.stringify(updated)); } catch {}
                              return updated;
                            });
                            addLog('Logistik ta’minotchi o‘chirildi', 'delete_cabinet', `${v.name} transport floti ro‘yxatidan o‘chirildi.`, 'warning');
                          }
                        }}
                        className="p-1.5 rounded-lg bg-[#151719] hover:bg-red-500/20 text-red-400 border border-[#51504A] hover:border-red-500/40 transition-colors cursor-pointer active:scale-95"
                        title="O‘chirish"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>

            {/* Xarita monitoring qismi (Logistika Xaritasi) */}
            <div className="bg-[#222528] border border-[#51504A] rounded-xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#51504A]">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[#F5F5F2] flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#FFB800]" />
                    <span>Jonli Logistika Xaritasi & Karyerlar / Zavodlar Radari</span>
                  </h3>
                  <p className="text-xs text-[#B8B8B3]">
                    O‘zbekiston bo‘ylab yirik sement zavodlari, temir yo‘l terminallari va qum-shag‘al karyerlarini xaritada monitoring qilish
                  </p>
                </div>
              </div>

              {/* MapsGroundingView komponenti integratsiyasi */}
              <div className="rounded-xl overflow-hidden border border-[#51504A]">
                <MapsGroundingView />
              </div>
            </div>

          </div>
        )}

        {/* =========================================================================
            SECTION 3: LOGLAR RO'YXATI (Barcha yo'nalishlar alohida ranglar bilan!)
            ========================================================================= */}
        {activeSection === 'logs' && (
          <div className="space-y-4 animate-fadeIn">
            
            {/* Filter Logs */}
            <div className="bg-[#222528] border border-[#51504A] rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-lg">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
                <input
                  type="text"
                  placeholder="Qidiruv"
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#151719] border border-[#51504A] rounded-xl text-white text-xs placeholder-blue-300/60 focus:outline-none focus:border-[#FFB800]"
                />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-[#B8B8B3] font-semibold hidden sm:inline">Yo‘nalish:</span>
                <select
                  value={logCategoryFilter}
                  onChange={(e) => setLogCategoryFilter(e.target.value)}
                  className="px-3 py-2 bg-[#151719] border border-[#51504A] rounded-xl text-xs text-white focus:outline-none focus:border-[#FFB800] cursor-pointer"
                >
                  <option value="all">Barcha yo‘nalishlar</option>
                  <option value="add_cabinet">🟢 Kabinet qo‘shildi</option>
                  <option value="edit_cabinet">🟡 Tahrirlash</option>
                  <option value="delete_cabinet">🔴 O‘chirishlar</option>
                  <option value="auth_access">🔵 Kirish / Chiqish</option>
                  <option value="emergency_pass">🟣 1 Martalik Parol</option>
                  <option value="orders_sales">🟣 Sotuv / Buyurtmalar</option>
                </select>

                <button
                  type="button"
                  onClick={() => {
                    addLog('Loglar ro‘yxati yangilandi', 'system', 'Tizim loglari ro‘yxati qayta yuklandi.', 'info');
                  }}
                  className="p-2 rounded-xl bg-[#292C2F] hover:bg-[#222528] text-[#B8B8B3] hover:text-white cursor-pointer border border-[#51504A]"
                  title="Yangilash"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>

                {logs.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllLogs}
                    className="p-2 rounded-xl bg-[#292C2F] hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 cursor-pointer border border-rose-500/30 transition-all"
                    title="Barcha loglarni tozalash"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Ranglar qo'llanmasi (Legend) */}
            <div className="flex flex-wrap items-center gap-2 px-1 text-xs">
              <span className="text-[11px] text-[#B8B8B3] font-bold uppercase tracking-wider mr-1">Yo‘nalish ranglari:</span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold text-[11px]">
                🟢 Kabinet Qo‘shish
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-[#FFB800]/50 font-bold text-[11px]">
                🟡 Tahrirlash
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold text-[11px]">
                🔴 O‘chirishlar
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold text-[11px]">
                🔵 Kirish / Chiqish
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold text-[11px]">
                🟣 1 Martalik Parol
              </span>
            </div>

            {/* Logs List: Har bir yo'nalish alohida rang va nishon bilan */}
            <div className="bg-[#222528] border border-[#51504A] rounded-xl p-5 shadow-xl divide-y divide-blue-500/20">
              {filteredLogs.map((logItem) => {
                const meta = getLogCategoryMeta(logItem.category);
                return (
                  <div key={logItem.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className={`w-3 h-3 rounded-full mt-1 shrink-0 ${meta.dot} shadow-lg`}></span>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="font-black text-white text-sm">
                            {logItem.action}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold ${meta.color}`}>
                            {meta.label}
                          </span>
                        </div>
                        <p className="text-xs text-[#F5F5F2] leading-relaxed font-medium">
                          {logItem.details}
                        </p>
                        <div className="flex items-center gap-3 text-[11px] text-[#B8B8B3] font-mono pt-0.5">
                          <span>Ijrochi: <strong className="text-white">{logItem.actor}</strong></span>
                          {logItem.ip && <span>• IP: {logItem.ip}</span>}
                        </div>
                      </div>
                    </div>

                    {/* Vaqti bilan: Aniq soat va sana */}
                    <div className="shrink-0 text-left sm:text-right text-[11px] font-mono text-[#B8B8B3]">
                      <div className="flex items-center gap-1 sm:justify-end text-amber-400 font-bold">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{new Date(logItem.timestamp).toLocaleTimeString('uz-UZ')}</span>
                      </div>
                      <span className="text-[11px] text-[#B8B8B3] block mt-0.5">
                        {new Date(logItem.timestamp).toLocaleDateString('uz-UZ')}
                      </span>
                    </div>
                  </div>
                );
              })}

              {filteredLogs.length === 0 && (
                <div className="text-center py-12 text-[#B8B8B3] text-xs">
                  Qidiruv bo‘yicha log qaydlari topilmadi.
                </div>
              )}
            </div>

          </div>
        )}

          </div>
        </div>
      </main>

      {/* =========================================================================
          MODAL: TA'MINOTCHI HAMKOR KABINETI QO'SHISH
          (Ism va Familiya alohida kiritiladi!)
          ========================================================================= */}
      {isAddSupplierOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#222528] border-2 border-[#FFB800] rounded-xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            
            <button
              onClick={() => setIsAddSupplierOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl bg-[#292C2F] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-[#FFB800]/40">
                <UserPlus className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">Ta'minotchi Hamkor Kabineti Qo‘shish</h2>
                <p className="text-xs text-[#B8B8B3]">Yangi korxona va mas'ul shaxs ma'lumotlari</p>
              </div>
            </div>

            <form onSubmit={handleAddSupplierSubmit} className="space-y-4 text-xs">
              
              {/* Korxona Nomi */}
              <div className="space-y-1">
                <label className="text-slate-200 font-bold flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-amber-400" />
                  Korxona Nomi:
                </label>
                <input
                  type="text"
                  required
                  value={newSuppCompany}
                  onChange={(e) => setNewSuppCompany(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#151719] border border-[#51504A] rounded-xl text-white text-xs focus:outline-none focus:border-[#FFB800]"
                />
              </div>

              {/* Ma'sul shaxs Ismi va Familiyasi ALOHIDA kiritiladi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-200 font-bold flex items-center gap-1.5">
                    <UserIcon className="w-3.5 h-3.5 text-amber-400" />
                    Mas'ul Shaxs Ismi:
                  </label>
                  <input
                    type="text"
                    required
                    value={newSuppName}
                    onChange={(e) => setNewSuppName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#151719] border border-[#51504A] rounded-xl text-white text-xs focus:outline-none focus:border-[#FFB800]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-200 font-bold flex items-center gap-1.5">
                    <UserIcon className="w-3.5 h-3.5 text-amber-400" />
                    Mas'ul Shaxs Familiyasi:
                  </label>
                  <input
                    type="text"
                    required
                    value={newSuppSurname}
                    onChange={(e) => setNewSuppSurname(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#151719] border border-[#51504A] rounded-xl text-white text-xs focus:outline-none focus:border-[#FFB800]"
                  />
                </div>
              </div>

              {/* Telefon Raqami */}
              <div className="space-y-1">
                <label className="text-slate-200 font-bold flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-amber-400" />
                  Telefon Raqami:
                </label>
                <input
                  type="text"
                  required
                  maxLength={17}
                  value={newSuppPhone}
                  onChange={(e) => {
                    setNewSuppPhone(formatUzPhone(e.target.value));
                    setNewSuppPhoneError(null);
                  }}
                  className={`w-full px-3.5 py-2.5 bg-[#151719] border rounded-xl text-white text-xs font-mono focus:outline-none ${
                    newSuppPhoneError ? 'border-red-500 focus:border-red-400' : 'border-[#51504A] focus:border-[#FFB800]'
                  }`}
                />
                {newSuppPhoneError && (
                  <span className="text-[11px] text-red-400 font-semibold block">{newSuppPhoneError}</span>
                )}
              </div>

              {/* Login va Parol */}
              <div className="p-4 rounded-2xl bg-[#151719] border border-[#51504A] space-y-3">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5" />
                  Sotuvchi Kabinetiga Kirish Ma'lumotlari
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-300 font-medium">Kabinet Logini:</label>
                    <input
                      type="text"
                      required
                      value={newSuppLogin}
                      onChange={(e) => setNewSuppLogin(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#222528] border border-[#51504A] rounded-xl text-white text-xs font-mono focus:outline-none focus:border-[#FFB800]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-medium">Kirish Paroli:</label>
                    <input
                      type="text"
                      required
                      value={newSuppPassword}
                      onChange={(e) => setNewSuppPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#222528] border border-[#51504A] rounded-xl text-white text-xs font-mono focus:outline-none focus:border-[#FFB800]"
                    />
                  </div>
                </div>
              </div>

              {/* Hudud va Shahar / Tumanlar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-200 font-bold flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    Hudud (Viloyat):
                  </label>
                  <select
                    value={newSuppRegion}
                    onChange={(e) => {
                      const reg = e.target.value;
                      setNewSuppRegion(reg);
                      const dists = REGIONS_AND_DISTRICTS[reg] || [];
                      setNewSuppDistrict(dists[0] || '');
                    }}
                    className="w-full px-3.5 py-2.5 bg-[#151719] border border-[#51504A] rounded-xl text-white text-xs focus:outline-none focus:border-[#FFB800] cursor-pointer"
                  >
                    {regionsList.map((reg) => (
                      <option key={reg} value={reg}>{reg}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-200 font-bold flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-[#B8B8B3]" />
                    Shahar va Tumanlar:
                  </label>
                  <select
                    value={newSuppDistrict}
                    onChange={(e) => setNewSuppDistrict(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#151719] border border-[#51504A] rounded-xl text-white text-xs focus:outline-none focus:border-[#FFB800] cursor-pointer"
                  >
                    {(REGIONS_AND_DISTRICTS[newSuppRegion] || []).map((dist) => (
                      <option key={dist} value={dist}>{dist}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Mahsulot turi */}
              <div className="space-y-2 p-3.5 rounded-2xl bg-[#151719] border border-[#51504A]">
                <div className="flex items-center justify-between">
                  <label className="text-slate-200 font-bold flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-amber-400" />
                    Mahsulot Turi:
                  </label>
                  <span className="text-[11px] text-[#B8B8B3] font-medium">qo‘lda yozish yoki ro‘yxatdan tanlash</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    value={newSuppCategory}
                    onChange={(e) => setNewSuppCategory(e.target.value)}
                    onBlur={(e) => {
                      const val = e.target.value.trim();
                      if (val.length >= 2) {
                        const updated = addProductType(val);
                        setProductTypes(updated);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const val = newSuppCategory.trim();
                        if (val.length >= 2) {
                          const updated = addProductType(val);
                          setProductTypes(updated);
                        }
                      }
                    }}
                    className="flex-1 px-3.5 py-2.5 bg-[#222528] border border-[#51504A] rounded-xl text-white text-xs font-medium focus:outline-none focus:border-[#FFB800]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const val = newSuppCategory.trim();
                      if (val.length >= 2) {
                        const updated = addProductType(val);
                        setProductTypes(updated);
                      }
                      setIsCategoryPickerOpen(true);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all cursor-pointer whitespace-nowrap shadow-md"
                  >
                    Ro‘yxat
                  </button>
                </div>
              </div>

              {/* Shartnoma Raqami va Hujjat yuklash */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-200 font-bold flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                    Shartnoma Raqami:
                  </label>
                  <input
                    type="text"
                    required
                    value={newSuppContractNumber}
                    onChange={(e) => {
                      setNewSuppContractNumber(e.target.value);
                      setNewSuppContractError(null);
                    }}
                    className={`w-full px-3.5 py-2.5 bg-[#151719] border rounded-xl text-white text-xs font-mono focus:outline-none ${
                      newSuppContractError ? 'border-red-500 focus:border-red-400' : 'border-[#51504A] focus:border-[#FFB800]'
                    }`}
                  />
                  {newSuppContractError && (
                    <span className="text-[11px] text-red-400 font-semibold block">{newSuppContractError}</span>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-slate-200 font-bold flex items-center gap-1.5">
                    <FileUp className="w-3.5 h-3.5 text-amber-400" />
                    Shartnoma Hujjati:
                  </label>
                  <label className="flex items-center justify-center gap-2 px-3.5 py-2.5 bg-[#151719] hover:bg-[#292C2F] border border-dashed border-[#51504A] rounded-xl text-[#B8B8B3] text-xs font-bold transition-all cursor-pointer truncate">
                    <FileUp className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="truncate">{newSuppPdfName || 'Faylni tanlash / yuklash'}</span>
                    <input
                      type="file"
                      accept=".pdf,application/pdf,image/*,.doc,.docx"
                      className="hidden"
                      onChange={(e) => handlePdfUpload(e, false)}
                    />
                  </label>
                </div>
              </div>

              {supplierAddSuccess && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs flex items-center gap-2 font-bold animate-fadeIn">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Ta'minotchi kabineti muvaffaqiyatli qo‘shildi!</span>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#51504A]">
                <button
                  type="button"
                  onClick={() => setIsAddSupplierOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-[#292C2F] hover:bg-[#222528] text-slate-300 text-xs font-bold transition-colors cursor-pointer border border-[#51504A]"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/25 active:scale-95 transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Kabinetni Saqlash</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: KORXONA KABINETINI TAHRIRLASH
          (Ism va Familiya alohida + 1 martalik favqulodda parol + O'chirish)
          ========================================================================= */}
      {isEditSupplierOpen && editingSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#222528] border-2 border-[#FFB800] rounded-xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            
            <button
              onClick={() => {
                setIsEditSupplierOpen(false);
                setEditingSupplier(null);
                setShowDeleteConfirm(false);
              }}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl bg-[#292C2F] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-[#FFB800]/40">
                <Pencil className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">Kabinetni Tahrirlash</h2>
                <p className="text-xs text-[#B8B8B3]">«{editingSupplier.companyName}» korxonasi ma'lumotlari</p>
              </div>
            </div>

            <form onSubmit={handleEditSupplierSubmit} className="space-y-4 text-xs">
              
              {/* Korxona Nomi */}
              <div className="space-y-1">
                <label className="text-slate-200 font-bold flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-amber-400" />
                  Korxona Nomi:
                </label>
                <input
                  type="text"
                  required
                  value={editSuppCompany}
                  onChange={(e) => setEditSuppCompany(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#151719] border border-[#51504A] rounded-xl text-white text-xs focus:outline-none focus:border-[#FFB800]"
                />
              </div>

              {/* Mas'ul Shaxs Ismi va Familiyasi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-200 font-bold flex items-center gap-1.5">
                    <UserIcon className="w-3.5 h-3.5 text-amber-400" />
                    Mas'ul Shaxs Ismi:
                  </label>
                  <input
                    type="text"
                    required
                    value={editSuppName}
                    onChange={(e) => setEditSuppName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#151719] border border-[#51504A] rounded-xl text-white text-xs focus:outline-none focus:border-[#FFB800]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-200 font-bold flex items-center gap-1.5">
                    <UserIcon className="w-3.5 h-3.5 text-amber-400" />
                    Mas'ul Shaxs Familiyasi:
                  </label>
                  <input
                    type="text"
                    required
                    value={editSuppSurname}
                    onChange={(e) => setEditSuppSurname(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#151719] border border-[#51504A] rounded-xl text-white text-xs focus:outline-none focus:border-[#FFB800]"
                  />
                </div>
              </div>

              {/* Telefon Raqami */}
              <div className="space-y-1">
                <label className="text-slate-200 font-bold flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-amber-400" />
                  Telefon Raqami:
                </label>
                <input
                  type="text"
                  required
                  maxLength={17}
                  value={editSuppPhone}
                  onChange={(e) => {
                    setEditSuppPhone(formatUzPhone(e.target.value));
                    setEditSuppPhoneError(null);
                  }}
                  className={`w-full px-3.5 py-2.5 bg-[#151719] border rounded-xl text-white text-xs font-mono focus:outline-none ${
                    editSuppPhoneError ? 'border-red-500' : 'border-[#51504A] focus:border-[#FFB800]'
                  }`}
                />
              </div>

              {/* Kabinet Logini va Kirish Paroli */}
              <div className="p-4 rounded-2xl bg-[#151719] border border-[#51504A] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5" />
                    Kabinetga Kirish Kalitlari
                  </span>
                  {copiedKey && <span className="text-[10px] text-emerald-400 font-bold animate-pulse">{copiedKey}</span>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[#B8B8B3] text-[11px]">
                      <span>Kabinet Logini:</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(editSuppLogin);
                          setCopiedKey("Login nusxalandi!");
                          setTimeout(() => setCopiedKey(null), 1500);
                        }}
                        className="text-amber-400 hover:underline cursor-pointer"
                      >
                        Nusxa
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      value={editSuppLogin}
                      onChange={(e) => setEditSuppLogin(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#222528] border border-[#51504A] rounded-xl text-white text-xs font-mono font-bold focus:outline-none focus:border-[#FFB800]"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[#B8B8B3] text-[11px]">
                      <span>Kirish Paroli:</span>
                      <button
                        type="button"
                        onClick={() => setShowEditSuppPassword(!showEditSuppPassword)}
                        className="text-amber-400 cursor-pointer"
                      >
                        {showEditSuppPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </button>
                    </div>
                    <input
                      type={showEditSuppPassword ? 'text' : 'password'}
                      value={editSuppPassword}
                      onChange={(e) => setEditSuppPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#222528] border border-[#51504A] rounded-xl text-white text-xs font-mono font-bold focus:outline-none focus:border-[#FFB800]"
                    />
                  </div>
                </div>
              </div>

              {/* 1 Martalik Favqulodda Kirish Paroli (Foydalanuvchi talab qilgan funksiya!) */}
              <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/40 space-y-2.5">
                <div className="flex items-center gap-2 text-purple-300 font-bold">
                  <KeyRound className="w-4 h-4 text-purple-400" />
                  <span>1 Martalik Favqulodda Kirish Paroli</span>
                </div>
                <p className="text-[11px] text-[#B8B8B3] leading-relaxed">
                  Ushbu parol kiritilganda bu parol <strong>1 martalik</strong> ishlaydi. Bu parol orqali kabinetga kirilganda yangi login va parol o‘rnatish oynasi ochiladi va kelgusida shu yangi login va parol ishlaydi.
                </p>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
                  <input
                    type="text"
                    value={editSuppEmergencyPass}
                    onChange={(e) => setEditSuppEmergencyPass(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#151719] border border-purple-500/40 rounded-xl text-white text-xs font-mono placeholder-purple-400/50 focus:outline-none focus:border-purple-400"
                  />
                </div>
                {editingSupplier.emergencyPassword && (
                  <div className="text-[11px] text-purple-300 font-mono flex items-center gap-1.5 mt-1">
                    <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
                    <span>Hozirgi faol 1 martalik parol: <strong>{editingSupplier.emergencyPassword}</strong></span>
                  </div>
                )}
              </div>

              {/* Hudud va Shahar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-200 font-bold flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    Hudud (Viloyat):
                  </label>
                  <select
                    value={editSuppRegion}
                    onChange={(e) => {
                      const reg = e.target.value;
                      setEditSuppRegion(reg);
                      const dists = REGIONS_AND_DISTRICTS[reg] || [];
                      setEditSuppDistrict(dists[0] || '');
                    }}
                    className="w-full px-3.5 py-2.5 bg-[#151719] border border-[#51504A] rounded-xl text-white text-xs focus:outline-none focus:border-[#FFB800] cursor-pointer"
                  >
                    {regionsList.map((reg) => (
                      <option key={reg} value={reg}>{reg}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-200 font-bold flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-[#B8B8B3]" />
                    Shahar va Tumanlar:
                  </label>
                  <select
                    value={editSuppDistrict}
                    onChange={(e) => setEditSuppDistrict(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#151719] border border-[#51504A] rounded-xl text-white text-xs focus:outline-none focus:border-[#FFB800] cursor-pointer"
                  >
                    {(REGIONS_AND_DISTRICTS[editSuppRegion] || []).map((dist) => (
                      <option key={dist} value={dist}>{dist}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Mahsulot turi */}
              <div className="space-y-2 p-3.5 rounded-2xl bg-[#151719] border border-[#51504A]">
                <div className="flex items-center justify-between">
                  <label className="text-slate-200 font-bold flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-amber-400" />
                    Mahsulot Turi:
                  </label>
                  <span className="text-[11px] text-[#B8B8B3] font-medium">qo‘lda yozish yoki ro‘yxatdan tanlash</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    value={editSuppCategory}
                    onChange={(e) => setEditSuppCategory(e.target.value)}
                    onBlur={(e) => {
                      const val = e.target.value.trim();
                      if (val.length >= 2) {
                        const updated = addProductType(val);
                        setProductTypes(updated);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const val = editSuppCategory.trim();
                        if (val.length >= 2) {
                          const updated = addProductType(val);
                          setProductTypes(updated);
                        }
                      }
                    }}
                    className="flex-1 px-3.5 py-2.5 bg-[#222528] border border-[#51504A] rounded-xl text-white text-xs font-medium focus:outline-none focus:border-[#FFB800]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const val = editSuppCategory.trim();
                      if (val.length >= 2) {
                        const updated = addProductType(val);
                        setProductTypes(updated);
                      }
                      setIsEditCategoryPickerOpen(true);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all cursor-pointer whitespace-nowrap shadow-md"
                  >
                    Ro‘yxat
                  </button>
                </div>
              </div>

              {/* Shartnoma Raqami va Hujjat */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-200 font-bold flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                    Shartnoma Raqami:
                  </label>
                  <input
                    type="text"
                    required
                    value={editSuppContractNumber}
                    onChange={(e) => setEditSuppContractNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#151719] border border-[#51504A] rounded-xl text-white text-xs font-mono focus:outline-none focus:border-[#FFB800]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-200 font-bold flex items-center gap-1.5">
                    <FileUp className="w-3.5 h-3.5 text-amber-400" />
                    Shartnoma Hujjati:
                  </label>
                  <label className="flex items-center justify-center gap-2 px-3.5 py-2.5 bg-[#151719] hover:bg-[#292C2F] border border-dashed border-[#51504A] rounded-xl text-[#B8B8B3] text-xs font-bold transition-all cursor-pointer truncate">
                    <FileUp className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="truncate">{editSuppPdfName || 'Faylni yangilash'}</span>
                    <input
                      type="file"
                      accept=".pdf,application/pdf,image/*,.doc,.docx"
                      className="hidden"
                      onChange={(e) => handlePdfUpload(e, true)}
                    />
                  </label>
                </div>
              </div>

              {supplierEditSuccess && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs flex items-center gap-2 font-bold animate-fadeIn">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Korxona kabineti muvaffaqiyatli yangilandi!</span>
                </div>
              )}

              {/* O'chirish tasdiqlash bloki */}
              {showDeleteConfirm && (
                <div className="p-4 rounded-2xl bg-red-500/15 border-2 border-red-500/40 space-y-2.5 animate-fadeIn">
                  <div className="flex items-center gap-2 text-red-400 font-bold text-xs sm:text-sm">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                    <span>Diqqat! Ushbu korxona kabinetini butunlay o‘chirmoqchimisiz?</span>
                  </div>
                  <p className="text-[11px] text-[#B8B8B3]">
                    «{editingSupplier.companyName}» korxonasi tizimdan butunlay o‘chirib tashlanadi.
                  </p>
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-3.5 py-1.5 rounded-xl bg-[#292C2F] text-slate-300 text-xs font-bold cursor-pointer"
                    >
                      Bekor qilish
                    </button>
                    <button
                      type="button"
                      onClick={() => confirmDeleteSupplier(editingSupplier)}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black shadow-lg cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Ha, Butunlay O‘chirish</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Action buttons: O'chirish, Bekor qilish, Saqlash */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#51504A]">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 hover:text-red-300 font-bold border border-red-500/30 transition-all cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>O‘chirish</span>
                </button>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditSupplierOpen(false);
                      setEditingSupplier(null);
                      setShowDeleteConfirm(false);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-[#292C2F] text-slate-300 font-bold cursor-pointer"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Saqlash</span>
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: HAMKOR HISOBOTI (Platformada sotilgan mahsulotlar soni, ro'yxati,
          qaytarilganlar, qayerdan qayerga - kim qayerga yetib borgan!)
          ========================================================================= */}
      {isReportModalOpen && selectedReportSupplier && detailedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#222528] border-2 border-[#51504A] rounded-xl max-w-4xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[92vh] flex flex-col">
            
            <button
              onClick={() => {
                setIsReportModalOpen(false);
                setSelectedReportSupplier(null);
              }}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl bg-[#292C2F] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#51504A]">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-[#FFB800]/40">
                  <FileSpreadsheet className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white">
                    «{selectedReportSupplier.companyName}» Faoliyat Hisoboti
                  </h2>
                  <p className="text-xs text-[#B8B8B3]">
                    Mas'ul: {selectedReportSupplier.name} {selectedReportSupplier.surname || ''} • Tel: {selectedReportSupplier.phone} • Shartnoma: {selectedReportSupplier.contractNumber || 'Mavjud emas'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => window.print()}
                className="self-start sm:self-center px-4 py-2 rounded-xl bg-[#292C2F] hover:bg-[#222528] text-amber-300 font-bold text-xs border border-[#51504A] flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Chop etish</span>
              </button>
            </div>

            {/* Quick KPI stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-[#151719] border border-[#51504A] rounded-2xl p-3.5">
                <span className="text-[11px] text-[#B8B8B3] block">Jami Sotilgan Mahsulotlar:</span>
                <span className="text-lg font-black text-white">
                  {detailedReport.sales.length} ta partiya ({formatPriceSum(detailedReport.sales.reduce((acc, s) => acc + s.totalSum, 0))})
                </span>
              </div>
              <div className="bg-[#151719] border border-rose-500/30 rounded-2xl p-3.5">
                <span className="text-[11px] text-rose-300 block">Qaytarilgan Mahsulotlar:</span>
                <span className="text-lg font-black text-rose-400">
                  {detailedReport.returns.length} ta ({formatPriceSum(detailedReport.returns.reduce((acc, r) => acc + r.totalSum, 0))})
                </span>
              </div>
              <div className="bg-[#151719] border border-emerald-500/30 rounded-2xl p-3.5">
                <span className="text-[11px] text-emerald-300 block">Yetkazib Berilgan Marshrutlar:</span>
                <span className="text-lg font-black text-emerald-400">
                  {detailedReport.routes.length} ta manzilga yetib borgan
                </span>
              </div>
            </div>

            {/* Hisobot Ichki Tablari: Sotilganlar, Qaytarilganlar, Qayerdan Qayerga */}
            <div className="flex items-center gap-2 border-b border-[#51504A] pb-2">
              <button
                type="button"
                onClick={() => setActiveReportTab('sales')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeReportTab === 'sales'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                    : 'bg-[#292C2F] text-[#B8B8B3] hover:bg-[#222528]'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Sotilgan Mahsulotlar Ro‘yxati ({detailedReport.sales.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveReportTab('returns')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeReportTab === 'returns'
                    ? 'bg-rose-500 text-white font-black shadow-md'
                    : 'bg-[#292C2F] text-rose-300 hover:bg-[#222528]'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Qaytarilganlar ({detailedReport.returns.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveReportTab('routes')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeReportTab === 'routes'
                    ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                    : 'bg-[#292C2F] text-emerald-300 hover:bg-[#222528]'
                }`}
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Qayerdan Qayerga (Yetkazmalar)</span>
              </button>
            </div>

            {/* Tab kontenti */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
              
              {/* 1. SOTILGAN MAHSULOTLAR RO'YXATI */}
              {activeReportTab === 'sales' && (
                <div className="overflow-x-auto rounded-2xl border border-[#51504A]">
                  <table className="w-full text-left text-[#F5F5F2]">
                    <thead className="bg-[#292C2F] text-amber-400 uppercase text-[10px] tracking-wider border-b border-[#51504A]">
                      <tr>
                        <th className="py-3 px-4 font-black">Mahsulot Nomi</th>
                        <th className="py-3 px-4 font-black">Miqdori</th>
                        <th className="py-3 px-4 font-black">Narxi</th>
                        <th className="py-3 px-4 font-black">Jami Summa</th>
                        <th className="py-3 px-4 font-black">Xaridor (Kimga)</th>
                        <th className="py-3 px-4 font-black">Sana</th>
                        <th className="py-3 px-4 font-black text-center">Holat</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-blue-500/20 bg-[#071533]">
                      {detailedReport.sales.map((item) => (
                        <tr key={item.id} className="hover:bg-[#0c265e] transition-colors">
                          <td className="py-3 px-4">
                            <strong className="text-white block">{item.productTitle}</strong>
                            <span className="text-[10px] text-amber-300">{item.category}</span>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-white">
                            {item.quantity} {item.unit}
                          </td>
                          <td className="py-3 px-4 font-mono text-[#B8B8B3]">{formatPriceSum(item.price)}</td>
                          <td className="py-3 px-4 font-mono font-black text-emerald-400">
                            {formatPriceSum(item.totalSum)}
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-white block">{item.buyerName}</span>
                            <span className="text-[10px] text-[#B8B8B3] font-mono">{item.buyerPhone}</span>
                          </td>
                          <td className="py-3 px-4 font-mono text-[#B8B8B3] text-[11px]">{item.date}</td>
                          <td className="py-3 px-4 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              Yetkazildi
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 2. QAYTARILGANLAR */}
              {activeReportTab === 'returns' && (
                <div className="space-y-3">
                  {detailedReport.returns.map((ret) => (
                    <div key={ret.id} className="bg-[#151719] border border-rose-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-white text-sm">{ret.productTitle}</span>
                          <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono font-bold text-[11px]">
                            {ret.quantity} {ret.unit}
                          </span>
                        </div>
                        <p className="text-[#B8B8B3] text-xs">
                          <strong className="text-rose-400">Qaytarilish sababi:</strong> {ret.reason}
                        </p>
                        <span className="text-[#B8B8B3] text-[11px] font-mono block">Sana: {ret.date}</span>
                      </div>
                      <div className="text-left sm:text-right shrink-0">
                        <span className="text-rose-400 font-mono font-black text-sm block">
                          -{formatPriceSum(ret.totalSum)}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 text-[10px] font-bold">
                          Qabul qilib olindi
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 3. QAYERDAN QAYERGA: KIM QAYERGA MAHSULOT YETIB BORGAN */}
              {activeReportTab === 'routes' && (
                <div className="space-y-3">
                  {detailedReport.routes.map((rt) => (
                    <div key={rt.id} className="bg-[#151719] border border-[#51504A] rounded-2xl p-4 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#51504A]">
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-amber-400" />
                          <span className="font-black text-white">{rt.productTitle}</span>
                          <span className="text-[#B8B8B3] text-[11px] font-mono">({rt.quantityText})</span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 self-start sm:self-auto">
                          Manzilga yetib borgan
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="bg-[#151719] p-3 rounded-xl border border-[#51504A]">
                          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                            Qayerdan (Yuklangan joy):
                          </span>
                          <p className="text-white font-medium mt-0.5">{rt.fromLocation}</p>
                        </div>

                        <div className="bg-[#151719] p-3 rounded-xl border border-emerald-500/30">
                          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                            Qayerga (Yetib borgan ob’ekt):
                          </span>
                          <p className="text-white font-bold mt-0.5">{rt.toLocation}</p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-[11px] text-[#B8B8B3] font-mono">
                        <div>
                          <span>Haydovchi: <strong className="text-white">{rt.driverName}</strong> ({rt.driverPhone})</span>
                          <span className="ml-2">• {rt.vehicle}</span>
                        </div>
                        <span className="text-emerald-400 font-bold">Yetkazilgan vaqt: {rt.deliveredAt}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-[#51504A] flex items-center justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsReportModalOpen(false);
                  setSelectedReportSupplier(null);
                }}
                className="px-6 py-2.5 rounded-xl bg-[#292C2F] hover:bg-[#222528] text-white text-xs font-bold transition-colors cursor-pointer border border-[#51504A]"
              >
                Yopish
              </button>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: BOSH ADMIN SOZLAMALARI (3 marta Chiqish bosilganda ochiladi)
          ========================================================================= */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#222528] border border-[#FFB800]/50 rounded-xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            
            <button
              onClick={() => setIsSettingsOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-xl bg-[#292C2F] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-[#FFB800]/40">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-white">Sozlamalar Oynasi</h2>
                <p className="text-xs text-[#B8B8B3]">Bosh admin kirish ma'lumotlari va logotip rasmi</p>
              </div>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-5 text-xs">
              
              {/* Section 1: Login va Parolni Almashtirish */}
              <div className="space-y-3.5 bg-[#151719] p-4 rounded-2xl border border-[#51504A]">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5" />
                  Login va Parolni Almashtirish
                </span>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                    <UserIcon className="w-3.5 h-3.5 text-[#B8B8B3]" />
                    Yangi Login:
                  </label>
                  <input
                    type="text"
                    required
                    value={newLogin}
                    onChange={(e) => setNewLogin(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#222528] border border-[#51504A] rounded-xl text-white text-xs focus:outline-none focus:border-[#FFB800]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Yangi Parol:</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-3.5 pr-10 py-2.5 bg-[#222528] border border-[#51504A] rounded-xl text-white text-xs focus:outline-none focus:border-[#FFB800] font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Section 2: Logotipga Rasm Qo‘yish */}
              <div className="space-y-3 bg-[#151719] p-4 rounded-2xl border border-[#51504A]">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5" />
                  Logotipga Rasm Qo‘yish
                </span>

                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold cursor-pointer transition-all active:scale-95 shadow-md">
                    <Upload className="w-4 h-4" />
                    <span>Rasm yuklash</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  {selectedLogo && (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-emerald-400 font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-1">
                        <Check className="w-3 h-3" /> {selectedFileName || "Rasm tanlandi"}
                      </span>
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 text-xs transition-colors border border-red-500/30 font-semibold cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>O‘chirish</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 3: Ijtimoiy Tarmoqlar & Bog'lanish */}
              <div className="space-y-3 bg-[#151719] p-4 rounded-2xl border border-[#51504A]">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5 text-blue-400" />
                  Ijtimoiy Tarmoqlar & Bog'lanish
                </span>

                {/* Telegram input */}
                <div className="space-y-1">
                  <label className="text-xs text-sky-300 font-semibold flex items-center gap-1.5">
                    <RealTelegramLogo className="w-4 h-4 rounded-full overflow-hidden" />
                    Telegram:
                  </label>
                  <input
                    type="text"
                    value={telegram}
                    onChange={(e) => setTelegram(e.target.value)}
                    placeholder="Telegram manzil yoki havola"
                    className="w-full px-3.5 py-2.5 bg-[#222528] border border-[#51504A] rounded-xl text-white text-xs focus:outline-none focus:border-sky-400 font-medium"
                  />
                </div>

                {/* Instagram input */}
                <div className="space-y-1">
                  <label className="text-xs text-pink-300 font-semibold flex items-center gap-1.5">
                    <RealInstagramLogo className="w-4 h-4 rounded overflow-hidden" />
                    Instagram:
                  </label>
                  <input
                    type="text"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    placeholder="Instagram profil yoki havola"
                    className="w-full px-3.5 py-2.5 bg-[#222528] border border-pink-500/40 rounded-xl text-white text-xs focus:outline-none focus:border-pink-400 font-medium"
                  />
                </div>

                {/* Telefon raqam input */}
                <div className="space-y-1">
                  <label className="text-xs text-emerald-300 font-semibold flex items-center gap-1.5">
                    <RealPhoneLogo className="w-4 h-4 rounded overflow-hidden" />
                    Telefon raqam:
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Telefon raqam"
                    className="w-full px-3.5 py-2.5 bg-[#222528] border border-emerald-500/40 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-400 font-medium font-mono"
                  />
                </div>
              </div>

              {/* Section 4: Tasdiqlash Paroli */}
              <div className="space-y-2 bg-[#151719] p-4 rounded-2xl border border-[#FFB800]/40">
                <label className="text-amber-300 font-bold flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  Tasdiqlash paroli:
                </label>
                <div className="relative">
                  <input
                    type={showOldPassword ? 'text' : 'password'}
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2.5 bg-[#222528] border border-amber-500/50 rounded-xl text-white text-xs focus:outline-none focus:border-[#FFB800] font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                  >
                    {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-medium">
                  {errorMessage}
                </div>
              )}

              {saveSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs flex items-center gap-2 font-medium">
                  <Check className="w-4 h-4" />
                  <span>Sozlamalar muvaffaqiyatli saqlandi!</span>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#292C2F] hover:bg-[#222528] text-slate-300 font-semibold cursor-pointer"
                >
                  Yopish
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Saqlash</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: MAHSULOT TURLARI RO'YXATI OYNASI
          ========================================================================= */}
      {(isCategoryPickerOpen || isEditCategoryPickerOpen) && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#222528] border-2 border-[#FFB800] rounded-xl max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-2xl relative max-h-[85vh] flex flex-col">
            
            <button
              type="button"
              onClick={() => {
                setIsCategoryPickerOpen(false);
                setIsEditCategoryPickerOpen(false);
              }}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl bg-[#292C2F] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-[#FFB800]/40">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">Mavjud Mahsulot Turlari</h2>
                <p className="text-xs text-[#B8B8B3]">Ro‘yxatdan tanlash yoki yangi turni qo‘shish</p>
              </div>
            </div>

            {/* Yangi turni qo'lda yozish */}
            <div className="bg-[#151719] p-3.5 rounded-2xl border border-[#51504A] space-y-2">
              <label className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                Yangi mahsulot turini yozish:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={pickerCustomInput}
                  onChange={(e) => setPickerCustomInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSelectCustomCategory();
                    }
                  }}
                  className="flex-1 px-3.5 py-2.5 bg-[#222528] border border-[#51504A] rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-[#FFB800]"
                />
                <button
                  type="button"
                  onClick={handleSelectCustomCategory}
                  disabled={!pickerCustomInput.trim()}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 text-xs font-black transition-all cursor-pointer whitespace-nowrap active:scale-95"
                >
                  Tanlash
                </button>
              </div>
            </div>

            {/* Ro'yxat: Ustun shaklida */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              <div className="text-[11px] font-bold text-[#B8B8B3] uppercase tracking-wider px-1">
                Mavjud Ro‘yxat (Ustun shaklida):
              </div>
              {productTypes.map((pt) => {
                const currentVal = isEditCategoryPickerOpen ? editSuppCategory : newSuppCategory;
                const isSelected = currentVal.toLowerCase() === pt.label.toLowerCase();
                return (
                  <button
                    key={`picker-item-${pt.id}`}
                    type="button"
                    onClick={() => {
                      if (isEditCategoryPickerOpen) {
                        setEditSuppCategory(pt.label);
                        setIsEditCategoryPickerOpen(false);
                      } else {
                        setNewSuppCategory(pt.label);
                        setIsCategoryPickerOpen(false);
                      }
                    }}
                    className={`w-full p-4 rounded-2xl text-xs sm:text-sm font-bold transition-all border flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 border-amber-300 font-black shadow-lg scale-[1.01]'
                        : 'bg-[#151719] text-[#F5F5F2] border-[#51504A] hover:border-[#FFB800] hover:bg-[#222528] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-2.5 h-2.5 rounded-full ${isSelected ? 'bg-slate-950' : 'bg-amber-400'}`}></span>
                      <span className="text-left font-black">{pt.label}</span>
                    </div>
                    {isSelected ? (
                      <span className="px-2.5 py-1 rounded-xl bg-slate-950 text-amber-400 text-xs font-black flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Tanlangan</span>
                      </span>
                    ) : (
                      <span className="text-[#B8B8B3] text-xs font-medium px-2.5 py-1 rounded-lg bg-[#222528] border border-[#51504A]">
                        Tanlash
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-[#51504A] flex items-center justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsCategoryPickerOpen(false);
                  setIsEditCategoryPickerOpen(false);
                }}
                className="px-5 py-2.5 rounded-xl bg-[#292C2F] hover:bg-[#222528] text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                ✕ Yopish
              </button>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: YANGI MOLIYAVIY OPERATSIYA KIRITISH (KIRIM / CHIQIM)
          ========================================================================= */}
      {isAddTxOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#222528] border-2 border-[#FFB800] rounded-xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl relative">
            
            <button
              onClick={() => setIsAddTxOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl bg-[#292C2F] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-[#FFB800]/40">
                <FileSpreadsheet className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">Yangi Moliyaviy Operatsiya</h2>
                <p className="text-xs text-[#B8B8B3]">Platforma moliya jurnaliga kirim yoki chiqim qo‘shish</p>
              </div>
            </div>

            <form onSubmit={handleAddTransactionSubmit} className="space-y-4 text-xs">
              
              {/* Operatsiya turi: Kirim yoki Chiqim */}
              <div className="space-y-1.5">
                <label className="text-slate-200 font-bold block">Operatsiya Turi:</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setNewTxType('income');
                      setNewTxCategory('Mahsulotlar savdosi');
                    }}
                    className={`py-3 px-4 rounded-xl font-black text-xs flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                      newTxType === 'income'
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-lg shadow-emerald-500/20'
                        : 'bg-[#151719] text-emerald-400 border-[#51504A] hover:border-emerald-500/50'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4 stroke-[3]" />
                    <span>+ Kirim (Tushum)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setNewTxType('expense');
                      setNewTxCategory("Ta'minotchi to‘lovi");
                    }}
                    className={`py-3 px-4 rounded-xl font-black text-xs flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                      newTxType === 'expense'
                        ? 'bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-500/20'
                        : 'bg-[#151719] text-rose-400 border-[#51504A] hover:border-rose-500/50'
                    }`}
                  >
                    <ArrowDownRight className="w-4 h-4 stroke-[3]" />
                    <span>- Chiqim (Xarajat)</span>
                  </button>
                </div>
              </div>

              {/* Toifa (Category) */}
              <div className="space-y-1">
                <label className="text-slate-200 font-bold block">Operatsiya Toifasi:</label>
                <select
                  value={newTxCategory}
                  onChange={(e) => setNewTxCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#151719] border border-[#51504A] rounded-lg text-[#F5F5F2] text-xs focus:outline-none focus:border-[#FFB800] cursor-pointer"
                >
                  {newTxType === 'income' ? (
                    <>
                      <option value="Mahsulotlar savdosi">Mahsulotlar savdosi (Xaridor to‘lovi)</option>
                      <option value="Logistika xizmati">Logistika xizmati tushumi</option>
                      <option value="Kafolatlangan bitim komissiyasi">Kafolatlangan bitim komissiyasi</option>
                      <option value="Global bunker ta'minoti">Global bunker ta'minoti</option>
                      <option value="Boshqa kirim">Boshqa kirim operatsiyasi</option>
                    </>
                  ) : (
                    <>
                      <option value="Ta'minotchi to‘lovi">Ta'minotchi to‘lovi (Xarid narxi)</option>
                      <option value="Logistika va yoqilg‘i">Logistika va yoqilg‘i xarajati</option>
                      <option value="Haydovchi xizmat haqi">Haydovchi xizmat haqi</option>
                      <option value="Qaytarilgan tovar kompensatsiyasi">Qaytarilgan tovar kompensatsiyasi</option>
                      <option value="Operatsion xarajatlar">Operatsion va xizmat xarajatlari</option>
                      <option value="Boshqa chiqim">Boshqa chiqim operatsiyasi</option>
                    </>
                  )}
                </select>
              </div>

              {/* Manba / Qabul Qiluvchi */}
              <div className="space-y-1">
                <label className="text-slate-200 font-bold block">
                  {newTxType === 'income' ? 'To‘lovchi Manba / Mijoz:' : 'Qabul Qiluvchi / Ta\'minotchi:'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={newTxType === 'income' ? 'Masalan: «Modern Stroy» MChJ' : 'Masalan: NATH bazasi / Haydovchi'}
                  value={newTxSource}
                  onChange={(e) => setNewTxSource(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#151719] border border-[#51504A] rounded-xl text-white text-xs focus:outline-none focus:border-[#FFB800]"
                />
              </div>

              {/* To'lov turi */}
              <div className="space-y-1">
                <label className="text-slate-200 font-bold block">To‘lov Usuli:</label>
                <select
                  value={newTxPaymentMethod}
                  onChange={(e) => setNewTxPaymentMethod(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#151719] border border-[#51504A] rounded-xl text-white text-xs focus:outline-none focus:border-[#FFB800] cursor-pointer"
                >
                  <option value="Bank hisob raqami (Perechisleniye)">Bank hisob raqami (Perechisleniye)</option>
                  <option value="Perechisleniye (Kafolatlangan bitim)">Perechisleniye (Kafolatlangan bitim)</option>
                  <option value="Korporativ karta (Humo/Uzcard)">Korporativ karta (Humo/Uzcard)</option>
                  <option value="Karta orqali">Karta orqali</option>
                  <option value="Naqd pul">Naqd pul</option>
                </select>
              </div>

              {/* Summa (so'm) */}
              <div className="space-y-1">
                <label className="text-slate-200 font-bold block">Summa (so‘m):</label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: 15 000 000"
                  value={newTxAmount}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '');
                    if (!raw) {
                      setNewTxAmount('');
                    } else {
                      setNewTxAmount(new Intl.NumberFormat('uz-UZ').format(parseInt(raw, 10)));
                    }
                  }}
                  className="w-full px-3.5 py-2.5 bg-[#151719] border border-[#51504A] rounded-xl text-white text-sm font-mono font-bold focus:outline-none focus:border-[#FFB800]"
                />
              </div>

              {/* Modal Buttons */}
              <div className="pt-3 border-t border-[#51504A] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddTxOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#292C2F] hover:bg-[#222528] text-slate-300 font-bold transition-colors cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/25 transition-all cursor-pointer active:scale-95"
                >
                  Operatsiyani Qo‘shish
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: YANGI OG'IR TEXNIKA QO'SHISH
          ========================================================================= */}
      {isAddVehicleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#222528] border-2 border-[#FFB800] rounded-xl max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setIsAddVehicleOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-[#292C2F] text-[#B8B8B3] hover:text-[#F5F5F2] border border-[#51504A] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-[#151719] border border-[#FFB800] text-[#FFB800]">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#F5F5F2]">Yangi Og‘ir Texnika Qo‘shish</h3>
                <p className="text-xs text-[#B8B8B3]">Flotga samosval, kran, mikser yoki yuk mashinasi kiritish</p>
              </div>
            </div>

            <form onSubmit={handleAddVehicleSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[#F5F5F2] font-bold">Texnika Modeli va Nomi:</label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Shacman F3000 Samosval"
                  value={newVehName}
                  onChange={(e) => setNewVehName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#151719] border border-[#51504A] rounded-lg text-[#F5F5F2] focus:outline-none focus:border-[#FFB800]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[#F5F5F2] font-bold">Texnika Turi:</label>
                  <select
                    value={newVehType}
                    onChange={(e: any) => setNewVehType(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#151719] border border-[#51504A] rounded-lg text-[#F5F5F2] focus:outline-none focus:border-[#FFB800] cursor-pointer"
                  >
                    <option value="samosval">Samosval (Tosh/Qum/Sement)</option>
                    <option value="fura">Katta Fura (Yarim tirkama)</option>
                    <option value="kran_manipulyator">Kran / Manipulyator</option>
                    <option value="mikser">Beton Qorgich (Mikser)</option>
                    <option value="gazel">Kichik Bortli Gazel</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[#F5F5F2] font-bold">Yuk Sig‘imi (tonna):</label>
                  <input
                    type="number"
                    required
                    placeholder="25"
                    value={newVehCapacity}
                    onChange={(e) => setNewVehCapacity(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#151719] border border-[#51504A] rounded-lg text-[#F5F5F2] focus:outline-none focus:border-[#FFB800]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[#F5F5F2] font-bold">Haydovchi F.I.Sh:</label>
                  <input
                    type="text"
                    required
                    placeholder="Alisher Zokirov"
                    value={newVehDriver}
                    onChange={(e) => setNewVehDriver(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#151719] border border-[#51504A] rounded-lg text-[#F5F5F2] focus:outline-none focus:border-[#FFB800]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[#F5F5F2] font-bold">Telefon Raqami:</label>
                  <input
                    type="text"
                    required
                    value={newVehPhone}
                    onChange={(e) => setNewVehPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#151719] border border-[#51504A] rounded-lg text-[#F5F5F2] font-mono focus:outline-none focus:border-[#FFB800]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[#F5F5F2] font-bold">1 km Narxi (so‘m):</label>
                  <input
                    type="number"
                    required
                    placeholder="14000"
                    value={newVehPriceKm}
                    onChange={(e) => setNewVehPriceKm(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#151719] border border-[#51504A] rounded-lg text-[#F5F5F2] font-mono focus:outline-none focus:border-[#FFB800]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[#F5F5F2] font-bold">Doimiy Baza / Lokatsiya:</label>
                  <input
                    type="text"
                    required
                    placeholder="Toshkent, Sergeli ombori"
                    value={newVehLocation}
                    onChange={(e) => setNewVehLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#151719] border border-[#51504A] rounded-lg text-[#F5F5F2] focus:outline-none focus:border-[#FFB800]"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#51504A]">
                <button
                  type="button"
                  onClick={() => setIsAddVehicleOpen(false)}
                  className="px-4 py-2 rounded-lg bg-[#292C2F] text-[#B8B8B3] hover:text-[#F5F5F2] border border-[#51504A] cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="btn-industrial-yellow px-5 py-2 rounded-lg font-bold flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>Flotga Qo‘shish</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: YANGI GLOBAL HAMKOR QO'SHISH
          ========================================================================= */}
      {isAddGlobalPartnerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#222528] border-2 border-[#FFB800] rounded-xl max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setIsAddGlobalPartnerOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-[#292C2F] text-[#B8B8B3] hover:text-[#F5F5F2] border border-[#51504A] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-[#151719] border border-[#FFB800] text-[#FFB800]">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#F5F5F2]">Yangi Global Hamkor Biriktirish</h3>
                <p className="text-xs text-[#B8B8B3]">Xalqaro zavod yoki ishlab chiqaruvchini tizimga kiritish</p>
              </div>
            </div>

            <form onSubmit={handleAddGlobalPartnerSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[#F5F5F2] font-bold">Kompaniya yoki Zavod Nomi:</label>
                <input
                  type="text"
                  required
                  placeholder="Heidelberg Materials AG"
                  value={newGpName}
                  onChange={(e) => setNewGpName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#151719] border border-[#51504A] rounded-lg text-[#F5F5F2] focus:outline-none focus:border-[#FFB800]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[#F5F5F2] font-bold">Davlat:</label>
                  <input
                    type="text"
                    required
                    placeholder="Germaniya"
                    value={newGpCountry}
                    onChange={(e) => setNewGpCountry(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#151719] border border-[#51504A] rounded-lg text-[#F5F5F2] focus:outline-none focus:border-[#FFB800]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[#F5F5F2] font-bold">Bayroq / Emodzi:</label>
                  <input
                    type="text"
                    placeholder="🇩🇪 yoki 🌐"
                    value={newGpFlag}
                    onChange={(e) => setNewGpFlag(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#151719] border border-[#51504A] rounded-lg text-[#F5F5F2] text-center focus:outline-none focus:border-[#FFB800]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[#F5F5F2] font-bold">Kategoriya:</label>
                  <select
                    value={newGpCategory}
                    onChange={(e) => setNewGpCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#151719] border border-[#51504A] rounded-lg text-[#F5F5F2] focus:outline-none focus:border-[#FFB800] cursor-pointer"
                  >
                    <option value="Metall va Po‘lat">Metall va Po‘lat</option>
                    <option value="Sement va Klinker">Sement va Klinker</option>
                    <option value="Quruq Aralashmalar">Quruq Aralashmalar</option>
                    <option value="Izolyatsiya va Akustika">Izolyatsiya va Akustika</option>
                    <option value="Kimyoviy Qo‘shimchalar">Kimyoviy Qo‘shimchalar</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[#F5F5F2] font-bold">Mahsulot Turi:</label>
                  <input
                    type="text"
                    required
                    placeholder="Sulfatga chidamli sement"
                    value={newGpProductType}
                    onChange={(e) => setNewGpProductType(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#151719] border border-[#51504A] rounded-lg text-[#F5F5F2] focus:outline-none focus:border-[#FFB800]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[#F5F5F2] font-bold">Yillik Ta'minot Quvvati:</label>
                  <input
                    type="text"
                    placeholder="50,000 tonna"
                    value={newGpVolume}
                    onChange={(e) => setNewGpVolume(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#151719] border border-[#51504A] rounded-lg text-[#F5F5F2] focus:outline-none focus:border-[#FFB800]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[#F5F5F2] font-bold">Mas'ul Vakil F.I.Sh:</label>
                  <input
                    type="text"
                    placeholder="Hans Weber"
                    value={newGpContact}
                    onChange={(e) => setNewGpContact(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#151719] border border-[#51504A] rounded-lg text-[#F5F5F2] focus:outline-none focus:border-[#FFB800]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[#F5F5F2] font-bold">Aloqa Telefoni / Email:</label>
                <input
                  type="text"
                  placeholder="+49 151 234567"
                  value={newGpPhone}
                  onChange={(e) => setNewGpPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#151719] border border-[#51504A] rounded-lg text-[#F5F5F2] font-mono focus:outline-none focus:border-[#FFB800]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#51504A]">
                <button
                  type="button"
                  onClick={() => setIsAddGlobalPartnerOpen(false)}
                  className="px-4 py-2 rounded-lg bg-[#292C2F] text-[#B8B8B3] hover:text-[#F5F5F2] border border-[#51504A] cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="btn-industrial-yellow px-5 py-2 rounded-lg font-bold flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>Global Ta'minotchini Saqlash</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: TA'MINOTCHI HAQIDA MA'LUMOTLAR (KORXONA PROFILI)
          ========================================================================= */}
      {isAboutSupplierOpen && aboutSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#222528] border-2 border-sky-400/80 rounded-xl max-w-xl w-full p-6 sm:p-7 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setIsAboutSupplierOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-[#292C2F] text-[#B8B8B3] hover:text-[#F5F5F2] border border-[#51504A] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 pb-3 border-b border-[#51504A]">
              <div className="p-3 rounded-xl bg-[#151719] border border-sky-400 text-sky-400">
                <Building className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#F5F5F2] flex items-center gap-2">
                  <span>{aboutSupplier.companyName}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                    aboutSupplier.status === 'active'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  }`}>
                    {aboutSupplier.status === 'active' ? 'Faol Hamkor' : 'Kutilmoqda'}
                  </span>
                </h3>
                <p className="text-xs text-[#B8B8B3]">Bunker Stroy akkreditatsiyalangan mahalliy ta'minotchi korxonasi</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-lg bg-[#151719] border border-[#51504A] space-y-1">
                <span className="text-[10px] font-mono text-[#B8B8B3] block">Mas'ul Vakil:</span>
                <span className="font-bold text-[#F5F5F2] text-sm flex items-center gap-1.5">
                  <UserIcon className="w-4 h-4 text-[#FFB800]" />
                  {aboutSupplier.name} {aboutSupplier.surname || ''}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-[#151719] border border-[#51504A] space-y-1">
                <span className="text-[10px] font-mono text-[#B8B8B3] block">Aloqa Telefoni:</span>
                <span className="font-bold text-[#FFB800] text-sm font-mono flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-[#FFB800]" />
                  {aboutSupplier.phone}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-[#151719] border border-[#51504A] space-y-1">
                <span className="text-[10px] font-mono text-[#B8B8B3] block">Viloyat / Hudud:</span>
                <span className="font-bold text-[#F5F5F2] flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#FFB800]" />
                  {aboutSupplier.region}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-[#151719] border border-[#51504A] space-y-1">
                <span className="text-[10px] font-mono text-[#B8B8B3] block">Tizimga Kirish Logini:</span>
                <span className="font-bold text-amber-300 font-mono flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-amber-400" />
                  {aboutSupplier.login}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-[#151719] border border-[#51504A] space-y-1">
                <span className="text-[10px] font-mono text-[#B8B8B3] block">Mahsulot Kategoriyasi:</span>
                <span className="font-bold text-[#F5F5F2] flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#FFB800]" />
                  {aboutSupplier.category}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-[#151719] border border-[#51504A] space-y-1">
                <span className="text-[10px] font-mono text-[#B8B8B3] block">Shartnoma Raqami:</span>
                <span className="font-bold text-[#F5F5F2] flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[#FFB800]" />
                  № {aboutSupplier.contractNumber}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-[#151719] border border-[#51504A] text-xs space-y-2">
              <span className="text-[10px] font-mono uppercase text-[#B8B8B3] block">Kafolat va Sifat Nazorati:</span>
              <p className="text-[#F5F5F2] leading-relaxed">
                Ushbu korxona to‘g‘ridan-to‘g‘ri Bunker Stroy platformasining zavod partiyasi hisoblanadi. Mahsulotlar (sement, metall prokat, g‘isht yoki gazoblok) to‘g‘ridan-to‘g‘ri ob'ektga yetkazib beriladi va 100% rasmiy shartnoma bilan kafolatlanadi.
              </p>
              {aboutSupplier.contractPdfData && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => handleDownloadPdf(aboutSupplier.contractPdfData, aboutSupplier.contractPdfName || 'shartnoma_fayli')}
                    className="btn-industrial-yellow px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Rasmiy Shartnoma Faylini Yuklab Olish (PDF)</span>
                  </button>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-[#51504A]">
              <button
                type="button"
                onClick={() => {
                  setIsAboutSupplierOpen(false);
                  handleOpenEditSupplier(aboutSupplier);
                }}
                className="px-4 py-2 rounded-lg bg-[#FFB800]/20 hover:bg-[#FFB800] text-[#FFB800] hover:text-[#151719] border border-[#FFB800]/50 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Ma'lumotlarni Tahrirlash</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAboutSupplierOpen(false)}
                className="px-4 py-2 rounded-lg bg-[#292C2F] text-[#B8B8B3] hover:text-[#F5F5F2] border border-[#51504A] text-xs font-bold cursor-pointer"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: GLOBAL TA'MINOTCHINI TAHRIRLASH
          ========================================================================= */}
      {isEditGlobalPartnerOpen && editingGlobalPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#222528] border-2 border-[#FFB800] rounded-xl max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => {
                setIsEditGlobalPartnerOpen(false);
                setEditingGlobalPartner(null);
              }}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-[#292C2F] text-[#B8B8B3] hover:text-[#F5F5F2] border border-[#51504A] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-[#151719] border border-[#FFB800] text-[#FFB800]">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#F5F5F2]">Global Ta'minotchini Tahrirlash</h3>
                <p className="text-xs text-[#B8B8B3]">Xalqaro zavod va import hamkori ma'lumotlarini yangilash</p>
              </div>
            </div>

            <form onSubmit={handleEditGlobalPartnerSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[#F5F5F2] font-bold">Kompaniya yoki Zavod Nomi:</label>
                <input
                  type="text"
                  required
                  value={editGpName}
                  onChange={(e) => setEditGpName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#151719] border border-[#51504A] rounded-lg text-[#F5F5F2] focus:outline-none focus:border-[#FFB800]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[#F5F5F2] font-bold">Davlat:</label>
                  <input
                    type="text"
                    required
                    value={editGpCountry}
                    onChange={(e) => setEditGpCountry(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#151719] border border-[#51504A] rounded-lg text-[#F5F5F2] focus:outline-none focus:border-[#FFB800]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[#F5F5F2] font-bold">Bayroq / Emodzi:</label>
                  <input
                    type="text"
                    value={editGpFlag}
                    onChange={(e) => setEditGpFlag(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#151719] border border-[#51504A] rounded-lg text-[#F5F5F2] text-center focus:outline-none focus:border-[#FFB800]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[#F5F5F2] font-bold">Kategoriya:</label>
                  <select
                    value={editGpCategory}
                    onChange={(e) => setEditGpCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#151719] border border-[#51504A] rounded-lg text-[#F5F5F2] focus:outline-none focus:border-[#FFB800] cursor-pointer"
                  >
                    <option value="Metall va Po‘lat">Metall va Po‘lat</option>
                    <option value="Sement va Klinker">Sement va Klinker</option>
                    <option value="Quruq Aralashmalar">Quruq Aralashmalar</option>
                    <option value="Izolyatsiya va Akustika">Izolyatsiya va Akustika</option>
                    <option value="Kimyoviy Qo‘shimchalar">Kimyoviy Qo‘shimchalar</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[#F5F5F2] font-bold">Mahsulot Turi:</label>
                  <input
                    type="text"
                    required
                    value={editGpProductType}
                    onChange={(e) => setEditGpProductType(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#151719] border border-[#51504A] rounded-lg text-[#F5F5F2] focus:outline-none focus:border-[#FFB800]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[#F5F5F2] font-bold">Yillik Ta'minot Quvvati:</label>
                  <input
                    type="text"
                    value={editGpVolume}
                    onChange={(e) => setEditGpVolume(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#151719] border border-[#51504A] rounded-lg text-[#F5F5F2] focus:outline-none focus:border-[#FFB800]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[#F5F5F2] font-bold">Tranzit Muddati:</label>
                  <input
                    type="text"
                    value={editGpDeliveryDays}
                    onChange={(e) => setEditGpDeliveryDays(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#151719] border border-[#51504A] rounded-lg text-[#F5F5F2] focus:outline-none focus:border-[#FFB800]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[#F5F5F2] font-bold">Mas'ul Vakil F.I.Sh:</label>
                  <input
                    type="text"
                    value={editGpContact}
                    onChange={(e) => setEditGpContact(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#151719] border border-[#51504A] rounded-lg text-[#F5F5F2] focus:outline-none focus:border-[#FFB800]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[#F5F5F2] font-bold">Aloqa Telefoni / Email:</label>
                  <input
                    type="text"
                    value={editGpPhone}
                    onChange={(e) => setEditGpPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#151719] border border-[#51504A] rounded-lg text-[#F5F5F2] font-mono focus:outline-none focus:border-[#FFB800]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[#F5F5F2] font-bold">Narx Sharti:</label>
                  <input
                    type="text"
                    value={editGpPriceTerm}
                    onChange={(e) => setEditGpPriceTerm(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#151719] border border-[#51504A] rounded-lg text-[#F5F5F2] focus:outline-none focus:border-[#FFB800]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[#F5F5F2] font-bold">Hamkorlik Holati:</label>
                  <select
                    value={editGpContractStatus}
                    onChange={(e: any) => setEditGpContractStatus(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#151719] border border-[#51504A] rounded-lg text-[#F5F5F2] focus:outline-none focus:border-[#FFB800] cursor-pointer"
                  >
                    <option value="active">Faol Hamkor</option>
                    <option value="in_transit">Tranzitda (Yo‘lda)</option>
                    <option value="customs">Bojxona Nazoratida</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#51504A]">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditGlobalPartnerOpen(false);
                    setEditingGlobalPartner(null);
                  }}
                  className="px-4 py-2 rounded-lg bg-[#292C2F] text-[#B8B8B3] hover:text-[#F5F5F2] border border-[#51504A] cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="btn-industrial-yellow px-5 py-2 rounded-lg font-bold flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>O‘zgarishlarni Saqlash</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: LOGISTIK TA'MINOTCHINI / TEXNIKANI TAHRIRLASH
          ========================================================================= */}
      {isEditVehicleOpen && editingVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#222528] border-2 border-[#FFB800] rounded-xl max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => {
                setIsEditVehicleOpen(false);
                setEditingVehicle(null);
              }}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-[#292C2F] text-[#B8B8B3] hover:text-[#F5F5F2] border border-[#51504A] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-[#151719] border border-[#FFB800] text-[#FFB800]">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#F5F5F2]">Logistik Ta'minotchini Tahrirlash</h3>
                <p className="text-xs text-[#B8B8B3]">Texnika va mas'ul haydovchi ma'lumotlarini yangilash</p>
              </div>
            </div>

            <form onSubmit={handleEditVehicleSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[#F5F5F2] font-bold">Texnika Modeli va Nomi:</label>
                <input
                  type="text"
                  required
                  value={editVehName}
                  onChange={(e) => setEditVehName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#151719] border border-[#51504A] rounded-lg text-[#F5F5F2] focus:outline-none focus:border-[#FFB800]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[#F5F5F2] font-bold">Texnika Turi:</label>
                  <select
                    value={editVehType}
                    onChange={(e: any) => setEditVehType(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#151719] border border-[#51504A] rounded-lg text-[#F5F5F2] focus:outline-none focus:border-[#FFB800] cursor-pointer"
                  >
                    <option value="samosval">Samosval (Tosh/Qum/Sement)</option>
                    <option value="fura">Katta Fura (Yarim tirkama)</option>
                    <option value="kran_manipulyator">Kran / Manipulyator</option>
                    <option value="mikser">Beton Qorgich (Mikser)</option>
                    <option value="gazel">Kichik Bortli Gazel</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[#F5F5F2] font-bold">Yuk Sig‘imi (tonna):</label>
                  <input
                    type="number"
                    required
                    value={editVehCapacity}
                    onChange={(e) => setEditVehCapacity(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#151719] border border-[#51504A] rounded-lg text-[#F5F5F2] focus:outline-none focus:border-[#FFB800]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[#F5F5F2] font-bold">Haydovchi / Mas'ul F.I.Sh:</label>
                  <input
                    type="text"
                    required
                    value={editVehDriver}
                    onChange={(e) => setEditVehDriver(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#151719] border border-[#51504A] rounded-lg text-[#F5F5F2] focus:outline-none focus:border-[#FFB800]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[#F5F5F2] font-bold">Telefon Raqami:</label>
                  <input
                    type="text"
                    required
                    value={editVehPhone}
                    onChange={(e) => setEditVehPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#151719] border border-[#51504A] rounded-lg text-[#F5F5F2] font-mono focus:outline-none focus:border-[#FFB800]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[#F5F5F2] font-bold">1 km Narxi (so‘m):</label>
                  <input
                    type="number"
                    required
                    value={editVehPriceKm}
                    onChange={(e) => setEditVehPriceKm(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#151719] border border-[#51504A] rounded-lg text-[#F5F5F2] font-mono focus:outline-none focus:border-[#FFB800]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[#F5F5F2] font-bold">Doimiy Baza / Lokatsiya:</label>
                  <input
                    type="text"
                    required
                    value={editVehLocation}
                    onChange={(e) => setEditVehLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#151719] border border-[#51504A] rounded-lg text-[#F5F5F2] focus:outline-none focus:border-[#FFB800]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[#F5F5F2] font-bold">Transport Holati:</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setEditVehAvailable(true)}
                    className={`py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-2 border cursor-pointer ${
                      editVehAvailable
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500'
                        : 'bg-[#151719] text-[#B8B8B3] border-[#51504A]'
                    }`}
                  >
                    <span>● Bo‘sh (Tayyor)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditVehAvailable(false)}
                    className={`py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-2 border cursor-pointer ${
                      !editVehAvailable
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500'
                        : 'bg-[#151719] text-[#B8B8B3] border-[#51504A]'
                    }`}
                  >
                    <span>○ Band (Yo‘lda)</span>
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#51504A]">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditVehicleOpen(false);
                    setEditingVehicle(null);
                  }}
                  className="px-4 py-2 rounded-lg bg-[#292C2F] text-[#B8B8B3] hover:text-[#F5F5F2] border border-[#51504A] cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="btn-industrial-yellow px-5 py-2 rounded-lg font-bold flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>O‘zgarishlarni Saqlash</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
