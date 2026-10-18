import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building, 
  Package, 
  ShoppingBag, 
  Plus, 
  LogOut, 
  Phone, 
  Mail, 
  MapPin, 
  Check, 
  X, 
  TrendingUp, 
  Clock, 
  Edit3, 
  Trash2, 
  KeyRound, 
  Eye, 
  EyeOff, 
  Save, 
  CheckCircle2, 
  Sparkles,
  Layers,
  Truck,
  ShieldCheck,
  ChevronRight,
  Upload,
  Image as ImageIcon,
  AlertCircle,
  User as UserIcon,
  Lock,
  BarChart3,
  Settings,
  Palette,
  Ruler,
  Scale,
  Box,
  Download,
  FileText
} from 'lucide-react';
import { UserProfile, Product, SupplierPartner } from '../types';
import { INITIAL_SUPPLIERS } from '../data/suppliersData';
import { getProductTypes, addProductType, ProductTypeItem } from '../data/productTypes';
import { getSupplierReport, SupplierDetailedReport } from '../data/supplierReportsData';

interface SupplierCabinetProps {
  currentUser: UserProfile;
  products: Product[];
  onAddProduct: (product: Product) => void;
  onDeleteProduct?: (productId: string) => void;
  onGoToShop: () => void;
  onLogout: () => void;
}

type UnitCategory = 'uzunlik' | 'massa' | 'yuza' | 'hajm';

interface UnitCategoryConfig {
  id: UnitCategory;
  label: string;
  units: string[];
}

const UNIT_CATEGORIES: UnitCategoryConfig[] = [
  {
    id: 'uzunlik',
    label: 'Uzunlik',
    units: ['metr', 'sm', 'mm', 'km', 'rulon']
  },
  {
    id: 'massa',
    label: 'Massa',
    units: ['kg', 'qop', 'dona', 'gramm', 'tonna']
  },
  {
    id: 'yuza',
    label: 'Yuza',
    units: ['m²', 'sm²', 'gektar']
  },
  {
    id: 'hajm',
    label: 'Hajm',
    units: ['m³', 'litr', 'kanistra', 'blok']
  }
];

export const PALETTE_32_COLORS = [
  { name: 'Oq', bg: '#ffffff', text: '#0f172a' },
  { name: 'Qora', bg: '#0b1120', text: '#ffffff' },
  { name: 'Kulrang', bg: '#64748b', text: '#ffffff' },
  { name: 'To‘q kulrang', bg: '#334155', text: '#ffffff' },
  { name: 'Kumush', bg: '#cbd5e1', text: '#0f172a' },
  { name: 'Qizil', bg: '#ef4444', text: '#ffffff' },
  { name: 'To‘q qizil', bg: '#991b1b', text: '#ffffff' },
  { name: 'Yoqut', bg: '#dc2626', text: '#ffffff' },
  { name: 'Olovrang', bg: '#ea580c', text: '#ffffff' },
  { name: 'To‘q sariq', bg: '#f97316', text: '#ffffff' },
  { name: 'Oltinrang', bg: '#f59e0b', text: '#0f172a' },
  { name: 'Sariq', bg: '#eab308', text: '#0f172a' },
  { name: 'Limon', bg: '#facc15', text: '#0f172a' },
  { name: 'Laym', bg: '#84cc16', text: '#0f172a' },
  { name: 'Yashil', bg: '#22c55e', text: '#ffffff' },
  { name: 'Zumrad', bg: '#10b981', text: '#ffffff' },
  { name: 'To‘q yashil', bg: '#15803d', text: '#ffffff' },
  { name: 'Zaytun', bg: '#65a30d', text: '#ffffff' },
  { name: 'Mox', bg: '#4d7c0f', text: '#ffffff' },
  { name: 'Dengiz to‘lqini', bg: '#14b8a6', text: '#ffffff' },
  { name: 'Moviy', bg: '#06b6d4', text: '#0f172a' },
  { name: 'Havorang', bg: '#38bdf8', text: '#0f172a' },
  { name: 'Ko‘k', bg: '#3b82f6', text: '#ffffff' },
  { name: 'Qirollik ko‘ki', bg: '#2563eb', text: '#ffffff' },
  { name: 'To‘q ko‘k', bg: '#1d4ed8', text: '#ffffff' },
  { name: 'Siniy', bg: '#1e40af', text: '#ffffff' },
  { name: 'Binafsharang', bg: '#8b5cf6', text: '#ffffff' },
  { name: 'Siren', bg: '#a855f7', text: '#ffffff' },
  { name: 'Pushti', bg: '#ec4899', text: '#ffffff' },
  { name: 'Atirgul', bg: '#f43f5e', text: '#ffffff' },
  { name: 'Jigarrang', bg: '#78350f', text: '#ffffff' },
  { name: 'Bej', bg: '#d4b996', text: '#0f172a' }
];

export const SupplierCabinet: React.FC<SupplierCabinetProps> = ({
  currentUser,
  products,
  onAddProduct,
  onDeleteProduct,
  onGoToShop,
  onLogout
}) => {
  // Find or create supplier profile
  const [supplierData, setSupplierData] = useState<SupplierPartner>(() => {
    try {
      const saved = localStorage.getItem('bunkerstroy_suppliers');
      if (saved) {
        const list: SupplierPartner[] = JSON.parse(saved);
        const found = list.find((s) => 
          s.id === currentUser.id || 
          s.login.toLowerCase() === currentUser.email.toLowerCase() ||
          s.companyName.toLowerCase() === (currentUser.companyName || '').toLowerCase()
        );
        if (found) return found;
      }
    } catch {}

    const initialMatch = INITIAL_SUPPLIERS.find((s) => 
      s.companyName.toLowerCase() === (currentUser.companyName || '').toLowerCase()
    );
    if (initialMatch) return initialMatch;

    return {
      id: currentUser.id,
      name: currentUser.displayName || 'Temur',
      companyName: currentUser.companyName || 'Bunker Hamkor',
      phone: currentUser.phone || '+998 90 123 45 67',
      email: currentUser.email,
      login: currentUser.email.split('@')[0] || 'hamkor',
      password: 'user123',
      region: 'Toshkent shahri',
      category: 'Qurilish mollari',
      status: 'active',
      productsCount: 0,
      totalSalesSum: 48800000,
      rating: 5.0,
      contractNumber: currentUser.contractNumber || 'BS-2026-9901',
      createdAt: currentUser.createdAt,
    };
  });

  const [activeTab, setActiveTab] = useState<'products' | 'reports' | 'settings'>('products');

  // Supplier's products
  const companyProducts = products.filter(
    (p) => p.supplierName.toLowerCase() === supplierData.companyName.toLowerCase() ||
           p.supplierName.toLowerCase().includes(supplierData.companyName.toLowerCase().slice(0, 10))
  );

  // Supplier Detailed Report
  const supplierReport = useMemo(() => {
    return getSupplierReport(
      supplierData.companyName,
      supplierData.name,
      supplierData.region,
      supplierData.phone,
      supplierData.contractNumber || ''
    );
  }, [supplierData]);

  // Product Types registry
  const [productTypes, setProductTypes] = useState<ProductTypeItem[]>(() => getProductTypes());

  useEffect(() => {
    const handleUpdate = () => {
      setProductTypes(getProductTypes());
    };
    window.addEventListener('bunkerstroy_product_types_updated', handleUpdate);
    return () => window.removeEventListener('bunkerstroy_product_types_updated', handleUpdate);
  }, []);

  // Admin Kabinetida kiritilgan mahsulot toifalari
  const adminCategories = useMemo(() => {
    return productTypes.map((pt) => pt.label);
  }, [productTypes]);

  // Add Product Modal State
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState(productTypes[0]?.label || 'Sement');
  const [newPrice, setNewPrice] = useState<number | ''>('');
  
  // Measurement Category & Unit
  const [selectedUnitCategory, setSelectedUnitCategory] = useState<UnitCategory>('massa');
  const [newUnit, setNewUnit] = useState('kg');
  const [unitAmountInput, setUnitAmountInput] = useState('');
  
  const [newStock, setNewStock] = useState<number | ''>('');
  const [newMinOrder, setNewMinOrder] = useState<number>(1);
  const [newDesc, setNewDesc] = useState('');
  
  // Up to 12 product photos
  const [newImages, setNewImages] = useState<string[]>([]);
  
  // Variations: Colors (up to 12) & Sizes/Measurements (up to 12)
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [isColorPaletteOpen, setIsColorPaletteOpen] = useState(false);
  
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]); // 12 tagacha qo'lda kiritilgan o'lchovlar
  const [customSizeInput, setCustomSizeInput] = useState('');

  const [hasDelivery, setHasDelivery] = useState(true);
  const [warranty, setWarranty] = useState('');
  const [hasBonus, setHasBonus] = useState(false);
  const [bonusThreshold, setBonusThreshold] = useState<number | ''>(10);
  const [bonusAmount, setBonusAmount] = useState<number | ''>(1);
  const [addSuccess, setAddSuccess] = useState(false);

  // Multi-image upload handler (up to 12 images)
  const handleMultiImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = 12 - newImages.length;
    if (remainingSlots <= 0) {
      alert("Maksimal 12 tagacha rasm yuklash mumkin.");
      return;
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots);
    filesToProcess.forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      if (file.size > 8 * 1024 * 1024) return;
      
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setNewImages((prev) => {
            if (prev.length >= 12) return prev;
            return [...prev, reader.result as string];
          });
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setNewImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Toggle color selection (maksimal 12 ta)
  const toggleColor = (colorName: string) => {
    setSelectedColors((prev) => {
      if (prev.includes(colorName)) {
        return prev.filter((c) => c !== colorName);
      }
      if (prev.length >= 12) {
        alert("Maksimal 12 tagacha rang tanlash mumkin.");
        return prev;
      }
      return [...prev, colorName];
    });
  };

  const handleRemoveColor = (colorName: string) => {
    setSelectedColors((prev) => prev.filter((c) => c !== colorName));
  };

  // O'lchovni qo'lda kiritish (maksimal 12 ta)
  const handleAddCustomSize = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const val = customSizeInput.trim();
    if (!val) return;
    if (selectedSizes.length >= 12) {
      alert("Maksimal 12 tagacha o‘lchov kiritish mumkin.");
      return;
    }
    if (!selectedSizes.includes(val)) {
      setSelectedSizes((prev) => [...prev, val]);
    }
    setCustomSizeInput('');
  };

  // O'lchov birligi bilan raqam kiritilganda o'lchovlar ro'yxatiga qo'shish
  const handleAddUnitWithAmount = () => {
    const amount = unitAmountInput.trim();
    const val = amount ? `${amount} ${newUnit}` : newUnit;
    if (selectedSizes.length >= 12) {
      alert("Maksimal 12 tagacha o‘lchov kiritish mumkin.");
      return;
    }
    if (!selectedSizes.includes(val)) {
      setSelectedSizes((prev) => [...prev, val]);
    }
    setUnitAmountInput('');
  };

  const handleRemoveSize = (sizeToRemove: string) => {
    setSelectedSizes((prev) => prev.filter((s) => s !== sizeToRemove));
  };

  // Sozlamalar (Login & Password edit) State
  const [settingsLogin, setSettingsLogin] = useState(supplierData.login || '');
  const [settingsPassword, setSettingsPassword] = useState('');
  const [settingsPasswordConfirm, setSettingsPasswordConfirm] = useState('');
  const [showSettingsPass, setShowSettingsPass] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsError(null);

    const tLogin = settingsLogin.trim();
    if (!tLogin) {
      setSettingsError("Login bo‘sh bo‘lishi mumkin emas.");
      return;
    }

    if (settingsPassword) {
      if (settingsPassword.length < 4) {
        setSettingsError("Yangi parol kamida 4 ta belgidan iborat bo‘lishi lozim.");
        return;
      }
      if (settingsPassword !== settingsPasswordConfirm) {
        setSettingsError("Parolni tasdiqlash mos kelmadi.");
        return;
      }
    }

    const updatedSupplier: SupplierPartner = {
      ...supplierData,
      login: tLogin,
      password: settingsPassword ? settingsPassword.trim() : supplierData.password,
    };
    setSupplierData(updatedSupplier);

    try {
      const saved = localStorage.getItem('bunkerstroy_suppliers');
      if (saved) {
        const list: SupplierPartner[] = JSON.parse(saved);
        const nextList = list.map((s) => (s.id === supplierData.id ? updatedSupplier : s));
        localStorage.setItem('bunkerstroy_suppliers', JSON.stringify(nextList));
      }

      // Add log
      const savedLogs = localStorage.getItem('bunkerstroy_logs');
      const logsList = savedLogs ? JSON.parse(savedLogs) : [];
      logsList.unshift({
        id: `log-${Date.now()}`,
        action: 'Kabinet sozlamalari yangilandi',
        actor: `${tLogin} (${supplierData.companyName})`,
        category: 'auth_access',
        details: `«${supplierData.companyName}» sozlamalari (login va parol) muvaffaqiyatli yangilandi.`,
        timestamp: new Date().toISOString(),
        ip: '195.158.12.84',
        level: 'success',
      });
      localStorage.setItem('bunkerstroy_logs', JSON.stringify(logsList));
    } catch {}

    setSettingsSuccess(true);
    setTimeout(() => {
      setSettingsSuccess(false);
      setSettingsPassword('');
      setSettingsPasswordConfirm('');
    }, 2500);
  };

  // Handle Add Product Submit
  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newPrice || !newStock) return;

    // Local SVG placeholder if no image uploaded
    const defaultImg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%230f172a"/><rect x="20" y="20" width="560" height="360" rx="16" fill="%231e293b" stroke="%23334155" stroke-width="2"/><text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="22" font-weight="bold" fill="%23f59e0b">${encodeURIComponent(newTitle.trim())}</text><text x="50%" y="60%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="15" fill="%2394a3b8">${encodeURIComponent(newCategory || supplierData.companyName)}</text></svg>`;

    const bonusText = hasBonus && bonusThreshold && bonusAmount 
      ? `Har ${bonusThreshold} ${newUnit} xaridga +${bonusAmount} ${newUnit} bepul!` 
      : undefined;

    const mainImage = newImages.length > 0 ? newImages[0] : defaultImg;

    const created: Product = {
      id: `prod-${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory.trim() || 'Sement',
      price: Number(newPrice),
      unit: newUnit,
      supplierName: supplierData.companyName,
      stock: Number(newStock) || 1,
      minOrder: newMinOrder,
      image: mainImage,
      images: newImages.length > 0 ? newImages : undefined,
      description: newDesc.trim() || `${supplierData.companyName} tomonidan taqdim etilayotgan yuqori sifatli mahsulot.`,
      region: supplierData.region,
      district: supplierData.district,
      salesCount: 0,
      isEscoCertified: true,
      energyEfficiencyRating: 'A',
      repairType: 'universal',
      hasDelivery,
      warranty: warranty.trim() || undefined,
      hasBonus,
      bonusDescription: bonusText,
      bonusThreshold: hasBonus && bonusThreshold ? Number(bonusThreshold) : undefined,
      colors: selectedColors.length > 0 ? selectedColors : undefined,
      sizes: selectedSizes.length > 0 ? selectedSizes : undefined,
    };

    addProductType(created.category);
    onAddProduct(created);
    setAddSuccess(true);
    
    setTimeout(() => {
      setAddSuccess(false);
      setIsAddProductOpen(false);
      setNewTitle('');
      setNewPrice('');
      setNewStock('');
      setNewDesc('');
      setNewImages([]);
      setSelectedColors([]);
      setSelectedSizes([]);
      setCustomSizeInput('');
      setUnitAmountInput('');
      setIsColorPaletteOpen(false);
      setWarranty('');
      setHasBonus(false);
    }, 1200);
  };

  const formatPrice = (p: number) => {
    return new Intl.NumberFormat('uz-UZ').format(p) + " so'm";
  };

  return (
    <div className="min-h-screen fullscreen-white-bg bg-white text-white flex flex-col font-sans">
      {/* Header */}
      <header className="border-b-2 border-amber-500/40 bg-slate-950/95 backdrop-blur-md px-4 sm:px-8 h-20 sm:h-24 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-3.5 sm:gap-4 select-none">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-amber-500/20 text-amber-400 border-2 border-amber-500/50 flex items-center justify-center font-black shadow-lg">
            <Building className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-2xl font-black text-white leading-tight">
                {supplierData.companyName}
              </h1>
              <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Faol Hamkor
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Shaxsiy Sotuvchi Kabineti • {supplierData.region} • {supplierData.contractNumber}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            onClick={onGoToShop}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs border border-amber-500/30 transition-all cursor-pointer shadow-md"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">Bozorga qaytish</span>
          </button>

          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-all cursor-pointer shadow-md"
          >
            <LogOut className="w-4 h-4" />
            <span>Chiqish</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        
        {/* KPI Summary Cards: 1. Mahsulotlar, 2. Jami Savdo Hajmi, 3. Hisobot (Hamkorlik reytingi va Shartnoma holati olib tashlangan) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* 1. Mahsulotlar (oldingi 'Mening Tovarlarim' emas) */}
          <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl backdrop-blur shadow-xl space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-bold uppercase tracking-wider text-amber-400">Mahsulotlar</span>
              <Package className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono">
              {companyProducts.length} <span className="text-xs font-normal text-slate-400">ta mahsulot</span>
            </div>
            <p className="text-[11px] text-emerald-400 font-medium">Bozorda sotuvda faol</p>
          </div>

          {/* 2. Jami Savdo Hajmi */}
          <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl backdrop-blur shadow-xl space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-bold uppercase tracking-wider text-emerald-400">Jami Savdo Hajmi</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
              {formatPrice(supplierData.totalSalesSum || 48800000)}
            </div>
            <p className="text-[11px] text-slate-400 font-medium">BunkerStroy platformasida</p>
          </div>

          {/* 3. Hisobot Bo'limi (Reyting va Shartnoma o'rniga) */}
          <button
            type="button"
            onClick={() => setActiveTab('reports')}
            className="text-left bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/60 border border-blue-500/30 hover:border-amber-400/60 p-5 rounded-3xl backdrop-blur shadow-xl space-y-2 cursor-pointer transition-all group"
          >
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-bold uppercase tracking-wider text-blue-300">Hisobot Bo‘limi</span>
              <BarChart3 className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-white font-mono flex items-center justify-between">
              <span>{supplierReport.sales.length} ta bitim</span>
              <span className="text-xs text-amber-400 font-bold group-hover:translate-x-1 transition-transform">Ko‘rish →</span>
            </div>
            <p className="text-[11px] text-blue-300 font-medium">Yetkazilgan buyurtmalar & daromad tahlili</p>
          </button>

        </div>

        {/* Tab Controls and Actions */}
        <div className="bg-slate-950/90 border border-amber-500/40 rounded-3xl p-4 sm:p-5 backdrop-blur flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex flex-wrap items-center gap-2">
            {/* Tab 1: Mahsulotlar */}
            <button
              onClick={() => setActiveTab('products')}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                activeTab === 'products'
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25'
                  : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Mahsulotlar</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                activeTab === 'products' ? 'bg-slate-950 text-amber-400' : 'bg-slate-800 text-slate-300'
              }`}>
                {companyProducts.length}
              </span>
            </button>

            {/* Tab 2: Hisobot */}
            <button
              onClick={() => setActiveTab('reports')}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                activeTab === 'reports'
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25'
                  : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Hisobot</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                activeTab === 'reports' ? 'bg-slate-950 text-amber-400' : 'bg-slate-800 text-slate-300'
              }`}>
                {supplierReport.sales.length}
              </span>
            </button>

            {/* Tab 3: Sozlamalar (Kirish kalitlari emas) */}
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25'
                  : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Sozlamalar</span>
            </button>
          </div>

          {activeTab === 'products' && (
            <button
              onClick={() => setIsAddProductOpen(true)}
              className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-amber-500/25 cursor-pointer active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Yangi Mahsulot Qo‘shish</span>
            </button>
          )}
        </div>

        {/* Tab 1: Mahsulotlar (Products) */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {companyProducts.map((prod) => (
                <div
                  key={prod.id}
                  className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 rounded-3xl overflow-hidden shadow-xl transition-all flex flex-col justify-between group"
                >
                  <div className="relative h-48 w-full bg-slate-950 overflow-hidden">
                    <img
                      src={prod.image}
                      alt={prod.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-3 left-3 bg-slate-950/85 backdrop-blur text-amber-400 text-xs font-bold px-2.5 py-1 rounded-xl border border-slate-800">
                      {prod.category}
                    </span>
                    <span className="absolute bottom-2 right-3 bg-emerald-500 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-lg shadow">
                      Omborda: {prod.stock} {prod.unit}
                    </span>
                    {prod.images && prod.images.length > 1 && (
                      <span className="absolute bottom-2 left-3 bg-slate-950/90 backdrop-blur text-white text-[10px] font-bold px-2 py-0.5 rounded-lg border border-slate-800 flex items-center gap-1">
                        <ImageIcon className="w-3 h-3 text-amber-400" />
                        <span>{prod.images.length} rasm</span>
                      </span>
                    )}
                  </div>

                  <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <h3 className="font-bold text-base text-white line-clamp-2">
                        {prod.title}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-2">
                        {prod.description}
                      </p>

                      {/* Specs badges: Rang, O'lchov (20x20, 30x30), Uzunlik, Og'irlik */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {prod.sizes && prod.sizes.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {prod.sizes.map((sz) => (
                              <span key={sz} className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md">
                                {sz}
                              </span>
                            ))}
                          </div>
                        )}
                        {prod.colors && prod.colors.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {prod.colors.map((c) => (
                              <span key={c} className="text-[10px] font-medium bg-slate-800 text-slate-200 border border-slate-700 px-2 py-0.5 rounded-md">
                                {c}
                              </span>
                            ))}
                          </div>
                        )}
                        {prod.lengths && prod.lengths.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {prod.lengths.map((l) => (
                              <span key={l} className="text-[10px] font-medium bg-blue-500/10 text-blue-300 border border-blue-500/20 px-2 py-0.5 rounded-md">
                                {l}
                              </span>
                            ))}
                          </div>
                        )}
                        {prod.weights && prod.weights.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {prod.weights.map((w) => (
                              <span key={w} className="text-[10px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                                {w}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Service Badges */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {prod.hasDelivery && (
                          <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md flex items-center gap-1 font-semibold">
                            <Truck className="w-3 h-3 text-emerald-400" />
                            Yetkazib berish
                          </span>
                        )}
                        {prod.warranty && (
                          <span className="text-[10px] text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-md flex items-center gap-1 font-semibold">
                            <ShieldCheck className="w-3 h-3 text-cyan-400" />
                            Kafolat: {prod.warranty}
                          </span>
                        )}
                        {prod.hasBonus && (
                          <span className="text-[10px] text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-md flex items-center gap-1 font-bold">
                            <Sparkles className="w-3 h-3 text-amber-400" />
                            {prod.bonusDescription || 'Bonus mavjud'}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-slate-400">Sotuv narxi:</div>
                        <div className="text-lg font-black text-amber-400 font-mono">
                          {formatPrice(prod.price)}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-mono">
                          1 {prod.unit}
                        </span>
                        {onDeleteProduct && (
                          <button
                            type="button"
                            onClick={() => onDeleteProduct(prod.id)}
                            className="p-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 text-xs transition-colors cursor-pointer"
                            title="Mahsulotni o‘chirish"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {companyProducts.length === 0 && (
              <div className="text-center py-16 bg-slate-900/60 rounded-3xl border border-dashed border-slate-800 p-8 space-y-3">
                <Package className="w-12 h-12 text-slate-600 mx-auto" />
                <p className="text-slate-400 text-sm">Hozircha mahsulotlar kiritilmagan.</p>
                <button
                  onClick={() => setIsAddProductOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs cursor-pointer"
                >
                  Birinchi mahsulotni qo‘shish
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Hisobot (Yangi Hisobot Bo'limi) */}
        {activeTab === 'reports' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Hisobot Header Card */}
            <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl backdrop-blur flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
              <div>
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                  <BarChart3 className="w-4 h-4" />
                  <span>Sotuvlar & Moliyaviy Hisobot</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                  «{supplierData.companyName}» Savdo Natijalari
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Shartnoma: <strong className="text-white font-mono">{supplierData.contractNumber}</strong> • Mas'ul: {supplierData.name}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="px-4 py-2 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-black">
                  ✓ Bitimlar faol
                </div>
              </div>
            </div>

            {/* Hisobot Ko'rsatkichlari */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
                <span className="text-xs text-slate-400 block font-medium">Jami Hisoblangan Savdo:</span>
                <span className="text-xl font-black text-amber-400 font-mono block mt-1">
                  {formatPrice(supplierReport.sales.reduce((acc, curr) => acc + curr.totalSum, 0))}
                </span>
                <span className="text-[10px] text-emerald-400 block mt-1">100% to‘lovlar kafolatlangan</span>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
                <span className="text-xs text-slate-400 block font-medium">Sotilgan Mahsulot Hajmi:</span>
                <span className="text-xl font-black text-white font-mono block mt-1">
                  {supplierReport.sales.reduce((acc, curr) => acc + curr.quantity, 0)} dona/birlik
                </span>
                <span className="text-[10px] text-blue-300 block mt-1">{supplierReport.sales.length} ta pudratchi ob'ektiga</span>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
                <span className="text-xs text-slate-400 block font-medium">Qaytarishlar (Voz kechishlar):</span>
                <span className="text-xl font-black text-emerald-400 font-mono block mt-1">
                  0 ta
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">Barcha mahsulotlar qabul qilingan</span>
              </div>
            </div>

            {/* Savdolar Jadvali */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
                <h3 className="font-black text-white text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-400" />
                  <span>Amalga Oshirilgan Savdolar Ro‘yxati</span>
                </h3>
                <span className="text-xs text-slate-400">{supplierReport.sales.length} ta yozuv</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-amber-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4 font-black">Sana</th>
                      <th className="py-3 px-4 font-black">Mahsulot Nomi</th>
                      <th className="py-3 px-4 font-black">Toifa</th>
                      <th className="py-3 px-4 font-black">Miqdor</th>
                      <th className="py-3 px-4 font-black">Narx</th>
                      <th className="py-3 px-4 font-black">Jami Summa</th>
                      <th className="py-3 px-4 font-black">Xaridor Pudratchi</th>
                      <th className="py-3 px-4 font-black text-center">Holat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 bg-slate-900/70 font-medium">
                    {supplierReport.sales.map((sale) => (
                      <tr key={sale.id} className="hover:bg-slate-800/60 transition-colors">
                        <td className="py-3 px-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                          {sale.date}
                        </td>
                        <td className="py-3 px-4 text-white font-bold">
                          {sale.productTitle}
                        </td>
                        <td className="py-3 px-4 text-amber-400">
                          {sale.category}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-white">
                          {sale.quantity} {sale.unit}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-300">
                          {formatPrice(sale.price)}
                        </td>
                        <td className="py-3 px-4 font-mono font-black text-amber-400">
                          {formatPrice(sale.totalSum)}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-white font-bold block">{sale.buyerName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{sale.buyerPhone}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            Yetkazilgan
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Yetkazib Berish Marshrutlari */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="p-4 sm:p-5 border-b border-slate-800">
                <h3 className="font-black text-white text-sm flex items-center gap-2">
                  <Truck className="w-4 h-4 text-emerald-400" />
                  <span>Logistika va Yetkazib Berish Yo‘nalishlari</span>
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4 font-black">Jo‘natilgan Manzil</th>
                      <th className="py-3 px-4 font-black">Qabul Ob'ekti</th>
                      <th className="py-3 px-4 font-black">Yuk Hajmi</th>
                      <th className="py-3 px-4 font-black">Haydovchi / Mashina</th>
                      <th className="py-3 px-4 font-black text-center">Holat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 bg-slate-900/70">
                    {supplierReport.routes.map((rt) => (
                      <tr key={rt.id} className="hover:bg-slate-800/60 transition-colors">
                        <td className="py-3 px-4 text-slate-300">
                          {rt.fromLocation}
                        </td>
                        <td className="py-3 px-4 text-white font-bold">
                          {rt.toLocation}
                        </td>
                        <td className="py-3 px-4 font-mono text-amber-300">
                          {rt.quantityText}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-white block font-medium">{rt.driverName} ({rt.vehicle})</span>
                          <span className="text-[10px] text-slate-400 font-mono">{rt.driverPhone}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            {rt.status === 'delivered' ? 'Yetkazildi' : 'Yo‘lda'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* Tab 3: Sozlamalar (Login va Parolni o'zgartirish) */}
        {activeTab === 'settings' && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl mx-auto space-y-6 shadow-2xl backdrop-blur animate-fadeIn">
            
            {/* Header */}
            <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
              <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Settings className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-white">Kabinet Sozlamalari</h2>
                <p className="text-xs text-slate-400">Login va parolni o‘zgartirish hamda profil ma'lumotlari</p>
              </div>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              
              {/* Login o'zgartirish */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-amber-400" />
                  Kabinet Logini:
                </label>
                <input
                  type="text"
                  required
                  value={settingsLogin}
                  onChange={(e) => setSettingsLogin(e.target.value)}
                  className="w-full px-3.5 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Yangi Parol */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  Yangi Kirish Paroli (o‘zgartirish uchun):
                </label>
                <div className="relative">
                  <input
                    type={showSettingsPass ? 'text' : 'password'}
                    value={settingsPassword}
                    onChange={(e) => setSettingsPassword(e.target.value)}
                    className="w-full pr-10 pl-3.5 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSettingsPass(!showSettingsPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                  >
                    {showSettingsPass ? <EyeOff className="w-4 h-4 text-amber-400" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Parolni tasdiqlash */}
              {settingsPassword && (
                <div className="space-y-1.5 animate-fadeIn">
                  <label className="text-slate-300 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                    Yangi Parolni Qayta Kiriting:
                  </label>
                  <input
                    type={showSettingsPass ? 'text' : 'password'}
                    value={settingsPasswordConfirm}
                    onChange={(e) => setSettingsPasswordConfirm(e.target.value)}
                    className="w-full px-3.5 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}

              {settingsError && (
                <div className="p-3 rounded-xl bg-red-500/20 text-red-300 border border-red-500/30 text-xs flex items-center gap-2 font-bold animate-fadeIn">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{settingsError}</span>
                </div>
              )}

              {settingsSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs flex items-center gap-2 font-bold animate-fadeIn">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>Sozlamalar (login va parol) muvaffaqiyatli saqlandi!</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full sm:w-auto px-7 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-500/20 cursor-pointer active:scale-95 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Sozlamalarni Saqlash</span>
              </button>
            </form>

            {/* Korxona Ma'lumotlari Card */}
            <div className="pt-4 border-t border-slate-800 space-y-2 text-xs">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                Korxona Profil Ma'lumotlari:
              </span>
              <div className="flex justify-between text-slate-300 p-2.5 rounded-xl bg-slate-950/60">
                <span className="text-slate-400">Korxona Nomi:</span>
                <span className="font-bold text-white">{supplierData.companyName}</span>
              </div>
              <div className="flex justify-between text-slate-300 p-2.5 rounded-xl bg-slate-950/60">
                <span className="text-slate-400">Mas'ul Shaxs:</span>
                <span className="font-bold text-white">{supplierData.name}</span>
              </div>
              <div className="flex justify-between text-slate-300 p-2.5 rounded-xl bg-slate-950/60">
                <span className="text-slate-400">Aloqa Telefoni:</span>
                <span className="font-mono text-white">{supplierData.phone}</span>
              </div>
              <div className="flex justify-between text-slate-300 p-2.5 rounded-xl bg-slate-950/60">
                <span className="text-slate-400">Hudud:</span>
                <span className="text-white">{supplierData.region}</span>
              </div>
              <div className="flex justify-between text-slate-300 p-2.5 rounded-xl bg-slate-950/60">
                <span className="text-slate-400">Shartnoma Raqami:</span>
                <span className="font-mono text-amber-400 font-bold">{supplierData.contractNumber}</span>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* =========================================================================
          ADD PRODUCT MODAL:
          - Mahsulot turi: Belgilash orqali (qo'lda yozish yoki ro'yxatdan tanlash olib tashlangan)
          - O'lchov birligi: Uzunlik, Massa, Yuza, Hajm
          - Suratlar: 12 tagacha yuklash mumkin
          - Variantlar: Rang, Uzunlik, Kg, O'lchov (20x20, 30x30)
          - Bonus sharti matni olib tashlangan
          ========================================================================= */}
      {isAddProductOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border-2 border-amber-500/60 rounded-3xl max-w-2xl w-full p-5 sm:p-7 space-y-5 shadow-2xl relative max-h-[92vh] overflow-y-auto text-xs">
            
            {/* Close button */}
            <button
              onClick={() => setIsAddProductOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Title */}
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Plus className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">Yangi Mahsulot Qo‘shish</h2>
                <p className="text-xs text-slate-400">Mahsulot to‘liq parametrlari va fotosuratlari</p>
              </div>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4">
              
              {/* Mahsulot Nomi */}
              <div className="space-y-1">
                <label className="text-slate-200 font-bold">Mahsulot Nomi:</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* MAHSULOT TURI: Faqat Belgilash orqali (qo'lda yozish yoki ro'yxatdan tanlash kerak emas) */}
              {/* MAHSULOT TURI: Admin kabinetida kiritilgan toifalar */}
              <div className="space-y-1.5 p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-slate-200 font-bold flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-amber-400" />
                    <span>Mahsulot Turi:</span>
                  </label>
                  <span className="text-[10px] text-amber-400 font-mono">
                    Admin toifalari
                  </span>
                </div>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  {productTypes.map((pt) => (
                    <option key={pt.id} value={pt.label}>
                      {pt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* O'LCHOV BIRLIGI & RAQAM KIRITISH */}
              <div className="space-y-3 p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-slate-200 font-bold flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-amber-400" />
                    <span>O‘lchov Birligi & Qiymati:</span>
                  </label>
                  <span className="text-[11px] text-amber-400 font-mono font-bold">
                    Tanlangan: {newUnit}
                  </span>
                </div>

                {/* 4 Toifa: Uzunlik, Massa, Yuza, Hajm */}
                <div className="grid grid-cols-4 gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
                  {UNIT_CATEGORIES.map((cat) => {
                    const isCatSelected = selectedUnitCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setSelectedUnitCategory(cat.id);
                          setNewUnit(cat.units[0]);
                        }}
                        className={`py-2 px-1 text-center rounded-lg font-bold text-xs transition-all cursor-pointer ${
                          isCatSelected
                            ? 'bg-amber-500 text-slate-950 font-black shadow'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        {cat.label}
                      </button>
                    );
                  })}
                </div>

                {/* Birliklar tugmalari */}
                <div className="flex flex-wrap items-center gap-2">
                  {UNIT_CATEGORIES.find((c) => c.id === selectedUnitCategory)?.units.map((u) => {
                    const isUnitSelected = newUnit === u;
                    return (
                      <button
                        key={u}
                        type="button"
                        onClick={() => setNewUnit(u)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          isUnitSelected
                            ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-md'
                            : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-amber-400/50'
                        }`}
                      >
                        <span>{u}</span>
                        {isUnitSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>

                {/* O'lchov birligi tanlanganda raqam kiritish imkoni */}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-850">
                  <input
                    type="text"
                    value={unitAmountInput}
                    onChange={(e) => setUnitAmountInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddUnitWithAmount();
                      }
                    }}
                    placeholder={`Raqam kiritish (${newUnit})`}
                    className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddUnitWithAmount}
                    disabled={!unitAmountInput.trim() || selectedSizes.length >= 12}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-black text-xs rounded-xl cursor-pointer transition-all shrink-0"
                  >
                    + O‘lchovga qo‘shish
                  </button>
                </div>
              </div>

              {/* Narxi va Ombordagi Zaxira */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Narxi (so'm):</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Zaxira Miqdori (Omborda):</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newStock}
                    onChange={(e) => setNewStock(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* O'LCHOV (QO'LDA KIRITILADI) VA RANGLAR (32 XIL, BITTA TUGMAGA JAMLANGAN) */}
              <div className="space-y-4 p-4 rounded-2xl bg-slate-950 border border-slate-800">
                
                {/* 1. O'LCHOVLAR (12 TAGACHA QO'LDA KIRITILADI) */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-200 font-bold flex items-center gap-1.5">
                      <Box className="w-3.5 h-3.5 text-amber-400" />
                      <span>O‘lchov (qo‘lda kiritish):</span>
                    </label>
                    <span className={`text-[11px] font-mono font-bold ${
                      selectedSizes.length >= 12 ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {selectedSizes.length} / 12 ta kiritildi
                    </span>
                  </div>

                  {/* 1ta raqam/o'lchov uchun joy - qo'lda kiritiladi */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={customSizeInput}
                      onChange={(e) => setCustomSizeInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomSize();
                        }
                      }}
                      disabled={selectedSizes.length >= 12}
                      className="flex-1 px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-amber-500 disabled:opacity-40"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomSize}
                      disabled={!customSizeInput.trim() || selectedSizes.length >= 12}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-black text-xs rounded-xl cursor-pointer transition-all shrink-0"
                    >
                      + Qo‘shish
                    </button>
                  </div>

                  {/* Kiritilgan o'lchovlar ro'yxati (12 tagacha) */}
                  {selectedSizes.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {selectedSizes.map((sz) => (
                        <span
                          key={sz}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono font-bold text-xs"
                        >
                          <span>{sz}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSize(sz)}
                            className="text-amber-400 hover:text-white p-0.5 rounded cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. RANG TUGMALARI: BITTA TUGMAGA JAMLANGAN, 32 XIL RANG */}
                <div className="space-y-2.5 pt-3 border-t border-slate-850">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-200 font-bold flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-amber-400" />
                      <span>Ranglar:</span>
                    </label>
                    <span className={`text-[11px] font-mono font-bold ${
                      selectedColors.length >= 12 ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {selectedColors.length} / 12 ta tanlandi
                    </span>
                  </div>

                  {/* Bitta rang tugmasi - bosilganda 32 xil rang palitrasi ochiladi */}
                  <div>
                    <button
                      type="button"
                      onClick={() => setIsColorPaletteOpen(!isColorPaletteOpen)}
                      className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border font-bold text-xs transition-all cursor-pointer ${
                        isColorPaletteOpen
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-lg shadow-amber-500/20'
                          : 'bg-slate-900 hover:bg-slate-850 text-slate-200 border-slate-700 hover:border-amber-500/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Palette className="w-4 h-4 text-amber-400" />
                        <span>Ranglar palitrasi (32 xil asosiy rang)</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-950 text-amber-400 font-mono font-black">
                        {isColorPaletteOpen ? 'Yopish ▲' : 'Ochish ▼'}
                      </span>
                    </button>

                    {/* 32 Xil Asosiy Ranglar Palitrasi */}
                    {isColorPaletteOpen && (
                      <div className="mt-2 p-3 bg-slate-900 border border-slate-750 rounded-2xl space-y-2 animate-fadeIn max-h-56 overflow-y-auto">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                          {PALETTE_32_COLORS.map((col) => {
                            const isSel = selectedColors.includes(col.name);
                            return (
                              <button
                                key={col.name}
                                type="button"
                                onClick={() => toggleColor(col.name)}
                                className={`p-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                                  isSel
                                    ? 'bg-amber-500 text-slate-950 border-amber-300 font-black shadow-md'
                                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-amber-400/50'
                                }`}
                              >
                                <span
                                  className="w-3.5 h-3.5 rounded-full border border-slate-600 shrink-0"
                                  style={{ backgroundColor: col.bg }}
                                />
                                <span className="truncate text-[11px]">{col.name}</span>
                                {isSel && <Check className="w-3 h-3 stroke-[3] ml-auto shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Tanlangan ranglar ro'yxati (12 tagacha) */}
                  {selectedColors.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {selectedColors.map((colName) => {
                        const colObj = PALETTE_32_COLORS.find((c) => c.name === colName);
                        return (
                          <span
                            key={colName}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-medium"
                          >
                            {colObj && (
                              <span
                                className="w-2.5 h-2.5 rounded-full border border-slate-500"
                                style={{ backgroundColor: colObj.bg }}
                              />
                            )}
                            <span>{colName}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveColor(colName)}
                              className="text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}

                </div>

              </div>

              {/* MAHSULOT SURATLARI: 12 TAGACHA YUKLASH MUMKIN */}
              <div className="space-y-2.5 p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-slate-200 font-bold flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                    <span>Mahsulot Suratlari:</span>
                  </label>
                  <span className={`text-[11px] font-mono font-bold ${
                    newImages.length >= 12 ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {newImages.length} / 12 ta yuklandi
                  </span>
                </div>

                {/* Upload Button */}
                {newImages.length < 12 && (
                  <label className="flex items-center justify-center gap-3 p-3.5 bg-slate-900/60 hover:bg-slate-900 border-2 border-dashed border-amber-500/50 hover:border-amber-400 rounded-2xl text-slate-300 transition-all cursor-pointer group">
                    <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 group-hover:scale-110 transition-transform">
                      <Upload className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-white">
                      Surat yuklash
                    </span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleMultiImageUpload}
                      className="hidden"
                    />
                  </label>
                )}

                {/* Grid of uploaded images */}
                {newImages.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 pt-1">
                    {newImages.map((img, idx) => (
                      <div key={idx} className="relative rounded-xl overflow-hidden border border-slate-800 aspect-square group bg-slate-900">
                        <img src={img} alt={`Rasm ${idx + 1}`} className="w-full h-full object-cover" />
                        {idx === 0 && (
                          <span className="absolute top-1 left-1 bg-amber-500 text-slate-950 font-black text-[9px] px-1.5 py-0.5 rounded shadow">
                            Asosiy
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-1 right-1 p-1 rounded-md bg-red-600/90 hover:bg-red-500 text-white transition-opacity cursor-pointer shadow"
                          title="O‘chirish"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Yetkazib berish va Kafolat */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-white block">Yetkazib berish:</span>
                      <span className="text-[10px] text-slate-400">Xizmat mavjudligi</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setHasDelivery(!hasDelivery)}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shadow-lg flex items-center gap-1.5 ${
                      hasDelivery
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-2 border-emerald-400 shadow-emerald-600/30'
                        : 'bg-red-600 hover:bg-red-500 text-white border-2 border-red-400 shadow-red-600/30'
                    }`}
                  >
                    {hasDelivery ? '✓ Mavjud' : '✕ Mavjud emas'}
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                      Kafolat muddati:
                    </span>
                    <span className="text-[10px] text-slate-500 font-normal">(ixtiyoriy)</span>
                  </label>
                  <input
                    type="text"
                    value={warranty}
                    onChange={(e) => setWarranty(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Bonus / Aksiya tizimi (Bonus sharti matni olib tashlangan!) */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <div>
                      <span className="text-xs font-bold text-white block">Bonus / Aksiya tizimi:</span>
                      <span className="text-[10px] text-slate-400">Xaridda bepul qo‘shib berish</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setHasBonus(!hasBonus)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      hasBonus
                        ? 'bg-amber-500 text-slate-950 font-black'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {hasBonus ? '✓ Yoqilgan' : '+ Bonus qo‘shish'}
                  </button>
                </div>

                {hasBonus && (
                  <div className="pt-2 space-y-2.5 border-t border-slate-800/80 animate-fadeIn">
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <label className="text-[11px] text-slate-300 font-medium">Xarid miqdori:</label>
                        <input
                          type="number"
                          min={1}
                          value={bonusThreshold}
                          onChange={(e) => setBonusThreshold(e.target.value ? Number(e.target.value) : '')}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] text-slate-300 font-medium">Bonus miqdori (Bepul):</label>
                        <input
                          type="number"
                          min={1}
                          value={bonusAmount}
                          onChange={(e) => setBonusAmount(e.target.value ? Number(e.target.value) : '')}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>
                    <div className="text-[11px] text-amber-400 font-medium pt-1">
                      Avtomatik shart: Har {bonusThreshold || 10} {newUnit} xaridga +{bonusAmount || 1} {newUnit} bepul qo‘shib beriladi
                    </div>
                  </div>
                )}
              </div>

              {/* Izoh va Tavsif (Maksimal 300 ta harf) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-bold">Izoh va Tavsif:</label>
                  <span className={`text-[10px] font-mono ${
                    newDesc.length >= 300 
                      ? 'text-red-400 font-bold' 
                      : newDesc.length >= 250 
                      ? 'text-amber-400 font-bold' 
                      : 'text-slate-500'
                  }`}>
                    {newDesc.length} / 300
                  </span>
                </div>
                <textarea
                  rows={3}
                  maxLength={300}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value.slice(0, 300))}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              {addSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs flex items-center gap-2 font-bold animate-fadeIn">
                  <Check className="w-4 h-4" />
                  <span>Mahsulot barcha parametrlari bilan muvaffaqiyatli saqlandi!</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddProductOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold cursor-pointer hover:bg-slate-750 transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-500/25 active:scale-95 transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Saqlash va Chiqarish</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
