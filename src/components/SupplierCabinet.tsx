import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  FileText,
  Users,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  Calculator,
  Search,
  CheckSquare,
  Square,
  Minus,
  Printer,
  Copy,
  Globe,
  RefreshCw,
  Store,
  ShoppingCart,
  Send,
  CreditCard,
  ChevronLeft,
  Play,
  Maximize2
} from 'lucide-react';
import { UserProfile, Product, ProductVariant, SupplierPartner, Order, CompanyInfo, B2BOrderItem, B2BOrderRequest } from '../types';
import { INITIAL_SUPPLIERS } from '../data/suppliersData';
import { getProductTypes, addProductType, ProductTypeItem, getManufacturers, addManufacturer, isCabinetCompanyName } from '../data/productTypes';
import { getSupplierReport, SupplierDetailedReport, isOrderAfterReset, isOnlinePlatformOrder } from '../data/supplierReportsData';
import { downloadMonitoringPdfFile, downloadB2bManifestPdfFile, downloadCustomerOrderPdfFile } from '../lib/pdfDownload';
import { db } from '../lib/firebase';
import { doc, setDoc, deleteDoc, collection, onSnapshot } from 'firebase/firestore';

interface SupplierCabinetProps {
  currentUser: UserProfile;
  products: Product[];
  onAddProduct: (product: Product) => void;
  onDeleteProduct?: (productId: string) => void;
  onGoToShop: () => void;
  onLogout: () => void;
}

interface DraftProductVariant {
  id: string;
  unit: string;
  unitValues?: Record<string, string>;
  colors: string[];
  specification: string;
  price: number | '';
  originalPrice: number | '';
  minOrder: number | '';
  isColorOpen?: boolean;
  isCollapsed?: boolean;
  isSaved?: boolean;
}

interface CrmCartBasket {
  id: string;
  name: string;
  selectedIds: string[];
  quantities: Record<string, number>;
  clientName: string;
  clientPhone: string;
}

interface B2BCartEntry {
  key: string;
  product: Product;
  unit: string;
  color?: string;
  specification?: string;
  price: number;
  quantity: number;
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

export function getColorPaletteItem(colorName: string): { name: string; bg: string; text: string } {
  const norm = (s: string) => s.toLowerCase().replace(/['`‘’ʻʼ]/g, '').trim();
  const target = norm(colorName);
  const found = PALETTE_32_COLORS.find((c) => norm(c.name) === target);
  if (found) return found;
  if (target.includes('toq kulrang') || target.includes('dark')) return { name: colorName, bg: '#334155', text: '#ffffff' };
  if (target.includes('kulrang') || target.includes('seriy')) return { name: colorName, bg: '#64748b', text: '#ffffff' };
  if (target.includes('qora') || target.includes('black')) return { name: colorName, bg: '#0b1120', text: '#ffffff' };
  if (target.includes('oq') || target.includes('white')) return { name: colorName, bg: '#ffffff', text: '#0f172a' };
  if (target.includes('qizil') || target.includes('gisht')) return { name: colorName, bg: '#ef4444', text: '#ffffff' };
  if (target.includes('sariq')) return { name: colorName, bg: '#eab308', text: '#0f172a' };
  if (target.includes('yashil')) return { name: colorName, bg: '#22c55e', text: '#ffffff' };
  if (target.includes('kok') || target.includes('moviy') || target.includes('siniy')) return { name: colorName, bg: '#2563eb', text: '#ffffff' };
  if (target.includes('jigarrang')) return { name: colorName, bg: '#78350f', text: '#ffffff' };
  if (target.includes('bej') || target.includes('qum')) return { name: colorName, bg: '#d4b996', text: '#0f172a' };
  return { name: colorName, bg: '#475569', text: '#ffffff' };
}

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
          s?.id === currentUser.id || 
          (s?.login && currentUser?.email && s.login.toLowerCase() === currentUser.email.toLowerCase()) ||
          ((s?.companyName || '').toLowerCase() === (currentUser?.companyName || '').toLowerCase())
        );
        if (found) return found;
      }
    } catch {}

    const initialMatch = INITIAL_SUPPLIERS.find((s) => 
      (s?.companyName || '').toLowerCase() === (currentUser?.companyName || '').toLowerCase()
    );
    if (initialMatch) return initialMatch;

    return {
      id: currentUser.id,
      name: currentUser.displayName || 'Mas’ul shaxs',
      companyName: currentUser.companyName || 'Hamkor',
      phone: currentUser.phone || '',
      email: currentUser.email,
      login: currentUser.email.split('@')[0] || 'hamkor',
      password: 'user123',
      region: currentUser.region || '',
      category: 'Qurilish mollari',
      status: 'active',
      productsCount: 0,
      totalSalesSum: 0,
      rating: 5.0,
      contractNumber: currentUser.contractNumber || '',
      createdAt: currentUser.createdAt,
    };
  });

  const [activeTab, setActiveTab] = useState<'reports' | 'products' | 'customers' | 'crm' | 'b2b_manufacturers' | 'b2b_orders' | 'settings'>('reports');
  const [prevNonCrmTab, setPrevNonCrmTab] = useState<'reports' | 'products' | 'customers' | 'b2b_manufacturers' | 'b2b_orders' | 'settings'>('reports');
  const [productsSubTab, setProductsSubTab] = useState<'online' | 'offline'>('online');
  const [reportsSubTab, setReportsSubTab] = useState<'online' | 'offline' | 'general' | 'kirim_chiqim'>('general');
  const [reportTimeRange, setReportTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [selectedReportDay, setSelectedReportDay] = useState<string>('all_days');
  const [customersSubTab, setCustomersSubTab] = useState<'regular' | 'b2b_suppliers'>('regular');
  const [crmStockWarning, setCrmStockWarning] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab !== 'crm') {
      setPrevNonCrmTab(activeTab);
    }
  }, [activeTab]);

  const logoClickTimerRef = useRef<number | null>(null);
  const handleLogoClick = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (logoClickTimerRef.current !== null) {
      window.clearTimeout(logoClickTimerRef.current);
      logoClickTimerRef.current = null;
      setActiveTab('settings');
      return;
    }
    logoClickTimerRef.current = window.setTimeout(() => {
      logoClickTimerRef.current = null;
      onLogout();
    }, 280);
  };

  useEffect(() => {
    return () => {
      if (logoClickTimerRef.current !== null) {
        window.clearTimeout(logoClickTimerRef.current);
      }
    };
  }, []);

  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isMavjudlikSectionCollapsed, setIsMavjudlikSectionCollapsed] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [addProductSource, setAddProductSource] = useState<'products' | 'crm'>('products');
  const [addProductChannel, setAddProductChannel] = useState<'online' | 'offline'>('online');

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // B2B Ishlab chiqaruvchilar bo'limi uchun qidiruv, filtr, savat va so'rovlar
  const [b2bSearchQuery, setB2bSearchQuery] = useState('');
  const [b2bCategoryFilter, setB2bCategoryFilter] = useState('all');
  const [selectedB2bProduct, setSelectedB2bProduct] = useState<Product | null>(null);
  const [b2bDetailImgIdx, setB2bDetailImgIdx] = useState(0);
  const [b2bZoomedImage, setB2bZoomedImage] = useState<string | null>(null);
  const [b2bVideoModalProduct, setB2bVideoModalProduct] = useState<Product | null>(null);
  const [showOutOfStockList, setShowOutOfStockList] = useState(false);
  const [b2bCart, setB2bCart] = useState<B2BCartEntry[]>([]);
  const [b2bQtyInputs, setB2bQtyInputs] = useState<Record<string, number>>({});
  const [b2bVariantIdxInputs, setB2bVariantIdxInputs] = useState<Record<string, number>>({});
  const [b2bColorInputs, setB2bColorInputs] = useState<Record<string, string>>({});
  const [b2bOrders, setB2bOrders] = useState<B2BOrderRequest[]>(() => {
    try {
      const saved = localStorage.getItem('bunkerstroy_b2b_orders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [previewB2bManifest, setPreviewB2bManifest] = useState<B2BOrderRequest | null>(null);
  const [b2bNoticeMessage, setB2bNoticeMessage] = useState<string | null>(null);
  const [isB2bMyOrdersOpen, setIsB2bMyOrdersOpen] = useState(false);
  const [b2bMyOrdersTab, setB2bMyOrdersTab] = useState<'all' | 'buying' | 'bought'>('all');
  const [b2bBankAccountInputs, setB2bBankAccountInputs] = useState<Record<string, string>>({});
  const [b2bBankAccountErrors, setB2bBankAccountErrors] = useState<Record<string, string>>({});
  const [copiedBankOrderId, setCopiedBankOrderId] = useState<string | null>(null);
  const [expandedCrmVariantIds, setExpandedCrmVariantIds] = useState<Record<string, boolean>>({});
  const [crmVariantSelection, setCrmVariantSelection] = useState<Record<string, number>>({});
  const [crmColorSelection, setCrmColorSelection] = useState<Record<string, string>>({});
  const [expandedProductVariantIds, setExpandedProductVariantIds] = useState<Record<string, boolean>>({});

  // CRM State: 2 va undan ortiq savdo savati shakllantirish imkoni (chiqib ketilganda ham o'chmaydi)
  const crmStorageKey = `bunkerstroy_crm_baskets_${supplierData.id || 'default'}`;
  const normalizeCrmBaskets = (list: CrmCartBasket[]): CrmCartBasket[] =>
    list.map((b, idx) => ({
      ...b,
      name: `Savat #${idx + 1}`,
      selectedIds: Array.isArray(b.selectedIds) ? Array.from(new Set(b.selectedIds)) : [],
      quantities: b.quantities || {},
      clientName: b.clientName || '',
      clientPhone: b.clientPhone || '',
    }));

  const [crmSearchQuery, setCrmSearchQuery] = useState('');
  const [crmCategoryFilter, setCrmCategoryFilter] = useState('all');
  const [crmBaskets, setCrmBaskets] = useState<CrmCartBasket[]>(() => {
    try {
      const saved = localStorage.getItem(crmStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return normalizeCrmBaskets(parsed);
      }
    } catch {}
    return [
      { id: 'basket-1', name: 'Savat #1', selectedIds: [], quantities: {}, clientName: '', clientPhone: '' },
      { id: 'basket-2', name: 'Savat #2', selectedIds: [], quantities: {}, clientName: '', clientPhone: '' },
    ];
  });
  const [activeCrmBasketId, setActiveCrmBasketId] = useState<string>('basket-1');
  const [crmDiscountPercent, setCrmDiscountPercent] = useState<number>(0);
  const [crmCopySuccess, setCrmCopySuccess] = useState(false);
  const [crmSaleSuccessNotice, setCrmSaleSuccessNotice] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(crmStorageKey, JSON.stringify(crmBaskets));
    } catch {}
  }, [crmBaskets, crmStorageKey]);

  const activeCrmBasket = useMemo(() => {
    return crmBaskets.find((b) => b.id === activeCrmBasketId) || crmBaskets[0];
  }, [crmBaskets, activeCrmBasketId]);

  const crmSelectedIds = activeCrmBasket?.selectedIds || [];
  const crmQuantities = activeCrmBasket?.quantities || {};
  const crmClientName = activeCrmBasket?.clientName || '';
  const crmClientPhone = activeCrmBasket?.clientPhone || '';

  const setCrmSelectedIds = (updater: string[] | ((prev: string[]) => string[])) => {
    setCrmBaskets((prev) =>
      prev.map((b) => {
        if (b.id !== activeCrmBasket.id) return b;
        const nextIds = typeof updater === 'function' ? updater(b.selectedIds) : updater;
        return { ...b, selectedIds: Array.from(new Set(nextIds)) };
      })
    );
  };

  const setCrmQuantities = (updater: Record<string, number> | ((prev: Record<string, number>) => Record<string, number>)) => {
    setCrmBaskets((prev) =>
      prev.map((b) => {
        if (b.id !== activeCrmBasket.id) return b;
        const nextQ = typeof updater === 'function' ? updater(b.quantities) : updater;
        return { ...b, quantities: nextQ };
      })
    );
  };

  const setCrmClientName = (val: string) => {
    setCrmBaskets((prev) => prev.map((b) => (b.id === activeCrmBasket.id ? { ...b, clientName: val } : b)));
  };

  const setCrmClientPhone = (val: string) => {
    setCrmBaskets((prev) => prev.map((b) => (b.id === activeCrmBasket.id ? { ...b, clientPhone: val } : b)));
  };

  const handleAddNewCrmBasket = () => {
    const newId = `basket-${Date.now()}`;
    setCrmBaskets((prev) =>
      normalizeCrmBaskets([
        ...prev,
        { id: newId, name: `Savat #${prev.length + 1}`, selectedIds: [], quantities: {}, clientName: '', clientPhone: '' },
      ])
    );
    setActiveCrmBasketId(newId);
  };

  const handleRemoveCrmBasket = (basketId: string) => {
    if (crmBaskets.length <= 1) return;
    const filtered = normalizeCrmBaskets(crmBaskets.filter((b) => b.id !== basketId));
    setCrmBaskets(filtered);
    if (activeCrmBasketId === basketId && filtered[0]) {
      setActiveCrmBasketId(filtered[0].id);
    }
  };

  // Barcha kabinetlar ro'yxati (Ishlab chiqaruvchilarni aniqlash uchun)
  const [allSuppliersList, setAllSuppliersList] = useState<SupplierPartner[]>(() => {
    try {
      const saved = localStorage.getItem('bunkerstroy_suppliers');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_SUPPLIERS;
  });

  // Keep supplierData synced with bunkerstroy_suppliers in localStorage (e.g. allowPromoVideo permission)
  useEffect(() => {
    const syncSupplier = () => {
      try {
        const saved = localStorage.getItem('bunkerstroy_suppliers');
        if (saved) {
          const list: SupplierPartner[] = JSON.parse(saved);
          setAllSuppliersList(list);
          const found = list.find(
            (s) =>
              s?.id === currentUser.id ||
              (s?.login && currentUser?.email && s.login.toLowerCase() === currentUser.email.split('@')[0].toLowerCase()) ||
              (s?.login && currentUser?.email && s.login.toLowerCase() === currentUser.email.toLowerCase()) ||
              (s?.companyName || '').toLowerCase() === (currentUser?.companyName || '').toLowerCase()
          );
          if (found) setSupplierData(found);
        }
      } catch {}
    };
    syncSupplier();
    window.addEventListener('storage', syncSupplier);
    window.addEventListener('bunkerstroy_suppliers_updated', syncSupplier);
    return () => {
      window.removeEventListener('storage', syncSupplier);
      window.removeEventListener('bunkerstroy_suppliers_updated', syncSupplier);
    };
  }, [currentUser, isAddProductOpen]);

  // Supplier's products
  const companyProducts = products.filter((p) => {
    if (p?.supplierId && supplierData?.id && p.supplierId === supplierData.id) return true;
    if (p?.supplierInn && supplierData?.inn && p.supplierInn === supplierData.inn) return true;
    const pSupp = (p?.supplierName || '').toLowerCase();
    const sComp = (supplierData?.companyName || '').toLowerCase();
    if (
      (supplierData?.inn === '313086503' || sComp.includes('national ai technology') || sComp.includes('insonlar uchun milliy ai')) &&
      (pSupp.includes('national ai technology') || pSupp.includes('insonlar uchun milliy ai'))
    ) {
      return true;
    }
    return pSupp === sComp || (sComp.length > 0 && pSupp.includes(sComp.slice(0, 10)));
  });

  // Faqat Ishlab chiqaruvchilar (Zavodlar) yuklagan mahsulotlar
  const manufacturerProducts = useMemo(() => {
    const manufacturerNames = new Set(
      allSuppliersList
        .filter((s) => s.cabinetType === 'manufacturer')
        .map((s) => (s.companyName || '').trim().toLowerCase())
        .filter(Boolean)
    );

    return products.filter((p) => {
      if (p.supplierCabinetType === 'manufacturer') return true;
      if (p.supplierCabinetType === 'partner') return false;
      const pSupp = (p.supplierName || '').trim().toLowerCase();
      if (!pSupp) return false;
      for (const mName of manufacturerNames) {
        if (pSupp === mName || (mName.length >= 4 && pSupp.includes(mName))) {
          return true;
        }
      }
      return false;
    });
  }, [products, allSuppliersList]);

  const filteredManufacturerProducts = useMemo(() => {
    return manufacturerProducts.filter((p) => {
      const matchesCat = b2bCategoryFilter === 'all' || p.category === b2bCategoryFilter;
      const q = b2bSearchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        (p.title || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q) ||
        (p.supplierName || '').toLowerCase().includes(q) ||
        (p.region || '').toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [manufacturerProducts, b2bCategoryFilter, b2bSearchQuery]);

  const b2bCategories = useMemo(() => {
    const set = new Set<string>();
    manufacturerProducts.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [manufacturerProducts]);

  const [ordersRefreshTick, setOrdersRefreshTick] = useState(0);
  const [selectedMapCustomer, setSelectedMapCustomer] = useState<{
    name: string;
    phone: string;
    address: string;
    coords: { lat: number; lng: number } | null;
  } | null>(null);
  const [supplierMapType, setSupplierMapType] = useState<'m' | 'k'>('m');

  useEffect(() => {
    const handleOrdersSync = () => {
      setOrdersRefreshTick((t) => t + 1);
    };
    window.addEventListener('storage', handleOrdersSync);
    window.addEventListener('bunkerstroy_orders_updated', handleOrdersSync);
    window.addEventListener('bunkerstroy_finance_updated', handleOrdersSync);

    let unsubscribeFs: (() => void) | undefined;
    try {
      const q = collection(db, 'orders');
      unsubscribeFs = onSnapshot(
        q,
        (snapshot) => {
          const fsOrders: Order[] = [];
          snapshot.forEach((d) => {
            const ord = d.data() as Order;
            if (!isOrderAfterReset(ord)) {
              deleteDoc(doc(db, 'orders', d.id)).catch(() => {});
            } else {
              fsOrders.push(ord);
            }
          });
          try {
            const saved = localStorage.getItem('bunkerstroy_orders');
            const localOrders: Order[] = saved ? JSON.parse(saved) : [];
            const mergedMap = new Map<string, Order>();
            fsOrders.forEach((fo) => {
              if (fo && fo.id && isOrderAfterReset(fo)) mergedMap.set(fo.id, fo);
            });
            if (Array.isArray(localOrders)) {
              localOrders.forEach((lo) => {
                if (!lo || !lo.id || !isOrderAfterReset(lo)) return;
                const existing = mergedMap.get(lo.id);
                if (!existing) {
                  mergedMap.set(lo.id, lo);
                } else {
                  const lt = lo.updatedAt ? new Date(lo.updatedAt).getTime() : 0;
                  const ft = existing.updatedAt ? new Date(existing.updatedAt).getTime() : 0;
                  if (lt >= ft) mergedMap.set(lo.id, lo);
                }
              });
            }
            localStorage.setItem('bunkerstroy_orders', JSON.stringify(Array.from(mergedMap.values())));
          } catch {}
          setOrdersRefreshTick((t) => t + 1);
        },
        () => {}
      );
    } catch {}

    return () => {
      window.removeEventListener('storage', handleOrdersSync);
      window.removeEventListener('bunkerstroy_orders_updated', handleOrdersSync);
      window.removeEventListener('bunkerstroy_finance_updated', handleOrdersSync);
      if (unsubscribeFs) unsubscribeFs();
    };
  }, []);

  const extractCoordsFromAddress = (addr: string): { lat: number; lng: number } | null => {
    if (!addr) return null;
    const match = addr.match(/\[Google Maps:\s*([-+]?\d*\.?\d+)\s*,\s*([-+]?\d*\.?\d+)\]/i);
    if (match && match[1] && match[2]) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      if (!isNaN(lat) && !isNaN(lng)) {
        return { lat, lng };
      }
    }
    return null;
  };

  // Manzilni faqat "Viloyat, Tuman yoki shahar" ko'rinishida qisqartirib ko'rsatish
  const formatRegionAndDistrictOnly = (addr: string): string => {
    if (!addr) return 'Toshkent sh.';
    const cleaned = addr.replace(/\[Google Maps:.*?\]/gi, '').trim();
    const parts = cleaned
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0]}, ${parts[1]}`;
    }
    return cleaned || 'Toshkent sh.';
  };

  const formatCleanFullAddress = (addr: string): string => {
    if (!addr) return 'Toshkent sh.';
    return addr.replace(/\[Google Maps:.*?\]/gi, '').trim() || 'Toshkent sh.';
  };

  // Supplier Detailed Report
  const supplierReport = useMemo(() => {
    return getSupplierReport(
      supplierData.companyName,
      supplierData.name,
      supplierData.region,
      supplierData.phone,
      supplierData.contractNumber || '',
      supplierData.commissionRate || 5,
      supplierData.commissionBasis || 'total',
      'all',
      undefined,
      supplierData.id,
      supplierData.inn
    );
  }, [supplierData, products, ordersRefreshTick]);

  // Yetkazib beruvchi telefon raqami input holatlari (har bir buyurtma qatori uchun)
  const [driverPhoneInputs, setDriverPhoneInputs] = useState<Record<string, string>>({});
  const [driverPhoneErrors, setDriverPhoneErrors] = useState<Record<string, string>>({});

  const formatUzPhoneInput = (val: string) => {
    const digits = val.replace(/\D/g, '');
    const local = digits.startsWith('998') ? digits.slice(3, 12) : digits.slice(0, 9);
    if (local.length === 0) return '+998 ';
    if (local.length <= 2) return `+998 ${local}`;
    if (local.length <= 5) return `+998 ${local.slice(0, 2)} ${local.slice(2)}`;
    if (local.length <= 7) return `+998 ${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5)}`;
    return `+998 ${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5, 7)} ${local.slice(7, 9)}`;
  };

  // Mijozlar ro'yxati (platforma foydalanuvchilaridan kelgan so'rovlar — B2B/B2C kabinet so'rovlari 2-bo'limda alohida ko'rinadi)
  const supplierCustomers = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        orderIds: string[];
        status: Order['status'];
        driverPhone?: string;
        name: string;
        phone: string;
        address: string;
        coords: { lat: number; lng: number } | null;
        ordersCount: number;
        totalQty: number;
        totalSpent: number;
        lastOrderDate: string;
        productsBought: string[];
        itemsList: { title: string; quantity: number; unit: string; price: number; totalSum: number }[];
      }
    >();

    // Read real orders from localStorage to link order IDs and real-time order statuses
    let rawOrders: Order[] = [];
    try {
      const savedOrders = localStorage.getItem('bunkerstroy_orders');
      rawOrders = savedOrders ? JSON.parse(savedOrders) : [];
    } catch {}

    const normalizedComp = (supplierData.companyName || '').trim().toLowerCase();
    const isStir313 =
      supplierData.inn === '313086503' ||
      normalizedComp.includes('national ai technology') ||
      normalizedComp.includes('insonlar uchun milliy ai');

    const supplierCabinetIds = new Set(allSuppliersList.map((s) => s.id).filter(Boolean));

    if (Array.isArray(rawOrders) && (normalizedComp || supplierData.id || supplierData.inn)) {
      rawOrders.forEach((order, oIdx) => {
        if (!order || !Array.isArray(order.items) || !isOrderAfterReset(order)) return;
        if (order.status === 'cancelled') return;
        // DIQQAT: CRM da olib borilgan oflayn savdolar alohida tizimda ishlaydi va B2B Mijozlar (Onlayn so'rovlar) bo'limiga kirmaydi!
        if (!isOnlinePlatformOrder(order)) return;
        // B2B / B2C kabinetlardan kelgan buyurtmalar B2B mijoz so'rovlari bo'limida ko'rinadi
        if (
          String(order.id || '').startsWith('B2B-') ||
          String(order.buyerName || '').includes('(B2B Hamkor)') ||
          (order.buyerId && supplierCabinetIds.has(order.buyerId))
        ) {
          return;
        }

        const matchingItems = order.items.filter((item: any) => {
          const matchedProd = products.find((p) => p && p.id === (item.productId || item?.product?.id));
          if (supplierData.id && (item.supplierId === supplierData.id || matchedProd?.supplierId === supplierData.id)) {
            return true;
          }
          if (supplierData.inn && (item.supplierInn === supplierData.inn || matchedProd?.supplierInn === supplierData.inn)) {
            return true;
          }
          const rawSupp = item.supplierName || item?.product?.supplierName || matchedProd?.supplierName || '';
          const itemSupp = rawSupp.trim().toLowerCase();
          if (
            isStir313 &&
            (itemSupp.includes('national ai technology') || itemSupp.includes('insonlar uchun milliy ai'))
          ) {
            return true;
          }
          if (
            itemSupp &&
            (itemSupp === normalizedComp ||
              itemSupp.includes(normalizedComp) ||
              normalizedComp.includes(itemSupp))
          ) {
            return true;
          }
          if (allSuppliersList.length === 1) {
            return true;
          }
          return false;
        });

        if (matchingItems.length === 0) return;

        const buyerName = order.recipientName || order.buyerName || 'Mijoz';
        const buyerPhone = order.recipientPhone || order.buyerPhone || '—';
        const addr = order.deliveryAddress || 'Toshkent sh.';
        const dateStr = order.createdAt
          ? new Date(order.createdAt).toISOString().replace('T', ' ').slice(0, 16)
          : '—';

        const key = `${order.id}-${String(buyerPhone || buyerName || oIdx).trim().toLowerCase()}`;
        let orderQty = 0;
        let orderSum = 0;
        const prodsList: string[] = [];
        const itemsDetailed: { title: string; quantity: number; unit: string; price: number; totalSum: number }[] = [];

        matchingItems.forEach((it: any) => {
          const q = Number(it.quantity) || 0;
          const pr = Number(it.price) || Number(it?.product?.price) || 0;
          const t = it.title || it?.product?.title || 'Mahsulot';
          const u = it.unit || it?.product?.unit || 'dona';
          orderQty += q;
          orderSum += q * pr;
          if (t && !prodsList.includes(t)) prodsList.push(t);
          itemsDetailed.push({
            title: t,
            quantity: q,
            unit: u,
            price: pr,
            totalSum: q * pr,
          });
        });

        map.set(key, {
          id: `supp-order-${order.id}`,
          orderIds: [order.id],
          status: order.status || 'pending',
          driverPhone: order.driverPhone || '',
          name: buyerName,
          phone: buyerPhone,
          address: addr,
          coords: extractCoordsFromAddress(addr),
          ordersCount: 1,
          totalQty: orderQty,
          totalSpent: orderSum,
          lastOrderDate: dateStr,
          productsBought: prodsList,
          itemsList: itemsDetailed,
        });
      });
    }

    // Fallback to online sales from supplierReport.sales if map is empty
    if (map.size === 0) {
      supplierReport.sales
        .filter(
          (sale) =>
            sale.orderChannel !== 'offline' &&
            !String(sale.orderId || '').startsWith('B2B-') &&
            !String(sale.buyerName || '').includes('(B2B Hamkor)')
        )
        .forEach((sale, idx) => {
          const key = (sale.buyerPhone || sale.buyerName || `cust-${idx}`).trim().toLowerCase();
          const routeMatch = supplierReport.routes[idx];
          const addr = sale.deliveryAddress || routeMatch?.toLocation || 'Toshkent sh.';
          const saleOrderId =
            sale.orderId ||
            (sale.id.startsWith('sale-')
              ? sale.id.replace(/^sale-/, '').replace(/-\d+$/, '')
              : sale.id);
          const existing = map.get(key);
          const itemObj = {
            title: sale.productTitle || 'Mahsulot',
            quantity: Number(sale.quantity) || 1,
            unit: sale.unit || 'dona',
            price: Number(sale.price) || 0,
            totalSum: Number(sale.totalSum) || 0,
          };
          if (existing) {
            existing.ordersCount += 1;
            existing.totalQty += Number(sale.quantity) || 0;
            existing.totalSpent += Number(sale.totalSum) || 0;
            if (!existing.orderIds.includes(saleOrderId)) {
              existing.orderIds.push(saleOrderId);
            }
            if (sale.date && sale.date > existing.lastOrderDate) {
              existing.lastOrderDate = sale.date;
            }
            if (sale.productTitle && !existing.productsBought.includes(sale.productTitle)) {
              existing.productsBought.push(sale.productTitle);
            }
            existing.itemsList.push(itemObj);
          } else {
            map.set(key, {
              id: `supp-cust-${idx}`,
              orderIds: [saleOrderId],
              status: sale.status || 'pending',
              driverPhone: sale.driverPhone || '',
              name: sale.buyerName || 'Mijoz',
              phone: sale.buyerPhone || '—',
              address: addr,
              coords: extractCoordsFromAddress(addr),
              ordersCount: 1,
              totalQty: Number(sale.quantity) || 0,
              totalSpent: Number(sale.totalSum) || 0,
              lastOrderDate: sale.date || '—',
              productsBought: sale.productTitle ? [sale.productTitle] : [],
              itemsList: [itemObj],
            });
          }
        });
    }

    return Array.from(map.values());
  }, [supplierReport, supplierData, products, allSuppliersList, ordersRefreshTick]);

  // Bildirishnoma (Alert) hisoblagichlari — qaysi bo'limda bildirishnoma bo'lsa shu bo'lim rangi tovlanadi
  const pendingCustomersCount = useMemo(
    () => supplierCustomers.filter((c) => c.status === 'pending' || c.status === 'confirmed').length,
    [supplierCustomers]
  );
  const loadingCustomersCount = useMemo(
    () => supplierCustomers.filter((c) => c.status === 'assigned').length,
    [supplierCustomers]
  );
  const hasCustomersAlert = pendingCustomersCount > 0 || loadingCustomersCount > 0;
  const hasReportsAlert = supplierReport.sales.length > 0 && hasCustomersAlert;

  // Ta'minotchi buyurtma holatini o'zgartirishi:
  // 1) Buyurtmani qabul qilish -> 'assigned' (Yuklash jarayonida)
  // 2) Tasdiqlash (Yetkazib beruvchi telefon raqami bilan) -> 'in_transit' (Manzilga yuborildi va raqam mijozga ham ko'rinadi)
  // 3) Yetkazildi -> 'delivered'
  const handleUpdateCustomerOrderStatus = (
    orderIds: string[],
    nextStatus: Order['status'],
    driverPhoneValue?: string
  ) => {
    const nowIso = new Date().toISOString();
    const cleanDriverPhone = driverPhoneValue ? driverPhoneValue.trim() : undefined;
    let affectedBuyerName = 'Mijoz';
    let affectedAddress = '';
    try {
      const savedOrders = localStorage.getItem('bunkerstroy_orders');
      const ordersList: Order[] = savedOrders ? JSON.parse(savedOrders) : [];
      if (Array.isArray(ordersList)) {
        const updatedList = ordersList.map((ord) => {
          if (ord && orderIds.includes(ord.id)) {
            affectedBuyerName = ord.recipientName || ord.buyerName || affectedBuyerName;
            affectedAddress = ord.deliveryAddress || affectedAddress;
            return {
              ...ord,
              status: nextStatus,
              ...(cleanDriverPhone ? { driverPhone: cleanDriverPhone } : {}),
              updatedAt: nowIso,
            };
          }
          return ord;
        });
        localStorage.setItem('bunkerstroy_orders', JSON.stringify(updatedList));
      }
    } catch {}

    // Admin kabinetiga real vaqtda holat haqida log/hisobot yozish
    try {
      const statusLabel =
        nextStatus === 'assigned'
          ? 'Buyurtma qabul qilindi — Yuklash jarayonida'
          : nextStatus === 'in_transit'
          ? `Tasdiqlandi — Manzilga yuborildi (Yetkazib beruvchi tel: ${cleanDriverPhone || 'kiritilgan'})`
          : nextStatus === 'delivered'
          ? 'Buyurtma manzilga yetkazildi'
          : `Buyurtma holati: ${nextStatus}`;

      const savedLogs = localStorage.getItem('bunkerstroy_logs');
      const logsList = savedLogs ? JSON.parse(savedLogs) : [];
      logsList.unshift({
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        action: statusLabel,
        actor: `${supplierData.companyName} (${supplierData.name})`,
        category: 'orders_sales',
        details: `Mijoz: ${affectedBuyerName} • Manzil: ${formatRegionAndDistrictOnly(affectedAddress)}${
          cleanDriverPhone ? ` • Yetkazib beruvchi tel: ${cleanDriverPhone}` : ''
        }`,
        timestamp: nowIso,
        ip: '195.158.12.84',
        level: 'success',
      });
      localStorage.setItem('bunkerstroy_logs', JSON.stringify(logsList.slice(0, 250)));
    } catch {}

    orderIds.forEach((oid) => {
      if (!oid) return;
      try {
        setDoc(
          doc(db, 'orders', oid),
          {
            status: nextStatus,
            ...(cleanDriverPhone ? { driverPhone: cleanDriverPhone } : {}),
            updatedAt: nowIso,
          },
          { merge: true }
        ).catch(() => {});
      } catch {}
    });

    window.dispatchEvent(new CustomEvent('bunkerstroy_orders_updated'));
    window.dispatchEvent(new CustomEvent('bunkerstroy_finance_updated'));
    window.dispatchEvent(new Event('storage'));
    setOrdersRefreshTick((t) => t + 1);
  };

  const handleConfirmWithDriverPhone = (custId: string, orderIds: string[], existingPhone?: string) => {
    const rawVal = driverPhoneInputs[custId] !== undefined ? driverPhoneInputs[custId] : existingPhone || '';
    const digits = rawVal.replace(/\D/g, '');
    const localDigits = digits.startsWith('998') ? digits.slice(3) : digits;
    if (localDigits.length < 9) {
      setDriverPhoneErrors((prev) => ({
        ...prev,
        [custId]: 'Yetkazib beruvchi telefon raqamini to‘liq kiriting!',
      }));
      return;
    }
    setDriverPhoneErrors((prev) => {
      const next = { ...prev };
      delete next[custId];
      return next;
    });
    const formattedPhone = formatUzPhoneInput(rawVal);
    handleUpdateCustomerOrderStatus(orderIds, 'in_transit', formattedPhone);
  };

  // Product Types registry
  const [productTypes, setProductTypes] = useState<ProductTypeItem[]>(() => getProductTypes());

  useEffect(() => {
    const handleUpdate = () => {
      setProductTypes(getProductTypes());
    };
    window.addEventListener('bunkerstroy_product_types_updated', handleUpdate);
    return () => window.removeEventListener('bunkerstroy_product_types_updated', handleUpdate);
  }, []);

  // Admin Kabinetida kiritilgan mahsulot toifalari + platformadagi mavjud mahsulot turlari tavsiya ro'yxati
  const adminCategories = useMemo(() => {
    return productTypes.map((pt) => pt.label);
  }, [productTypes]);

  const allPlatformCategorySuggestions = useMemo(() => {
    const baseLabels = productTypes.map((pt) => pt.label);
    const fromProducts = products.map((p) => (p.category || '').trim()).filter(Boolean);
    const fromTitles = products.map((p) => (p.title || '').trim()).filter(Boolean);
    return Array.from(new Set([...baseLabels, ...fromProducts, ...fromTitles]));
  }, [productTypes, products]);

  // Add / Edit Product Modal State
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);
  const [manufacturersList, setManufacturersList] = useState<string[]>(() => getManufacturers());
  const [newManufacturer, setNewManufacturer] = useState('');
  const [manufacturerMode, setManufacturerMode] = useState<'list' | 'manual'>('manual');
  const [showManufacturerSuggestions, setShowManufacturerSuggestions] = useState(false);
  const [newPrice, setNewPrice] = useState<number | ''>('');
  const [newOriginalPrice, setNewOriginalPrice] = useState<number | ''>('');
  const [newCostPrice, setNewCostPrice] = useState<number | ''>('');
  const [newStock, setNewStock] = useState<number | ''>(100);
  const [newUnit, setNewUnit] = useState('kg');
  const [newMinOrder, setNewMinOrder] = useState<number | ''>(1);
  const [newDesc, setNewDesc] = useState('');

  useEffect(() => {
    const syncMfg = () => {
      const base = getManufacturers();
      const fromProds = products
        .map((p) => (p.manufacturerName || '').trim())
        .filter((val) => val && !isCabinetCompanyName(val));
      const merged = Array.from(new Set([...base, ...fromProds]));
      setManufacturersList(merged);
    };
    syncMfg();
    window.addEventListener('bunkerstroy_manufacturers_updated', syncMfg);
    return () => window.removeEventListener('bunkerstroy_manufacturers_updated', syncMfg);
  }, [products]);

  // Mavjudligi (Variants): har bir mavjudlikda O'lchov birligi va Rang tanlanadi
  const [draftVariants, setDraftVariants] = useState<DraftProductVariant[]>([
    {
      id: 'var-1',
      unit: 'kg',
      colors: [],
      specification: '',
      price: '',
      originalPrice: '',
      minOrder: 1,
      isColorOpen: false,
    },
  ]);

  // Up to 12 product photos & product video
  const [newImages, setNewImages] = useState<string[]>([]);
  const [newVideoUrl, setNewVideoUrl] = useState<string>('');

  // Mahsulot haqida: 4 tagacha surat va izoh bloklari
  const [detailBlocks, setDetailBlocks] = useState<{ image: string; text: string }[]>([]);

  // Variations: Colors (up to 12)
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [isColorPaletteOpen, setIsColorPaletteOpen] = useState(false);

  // SMS Verification for Product Upload / Edit (Asosiy yoki Qo'shimcha raqam tanlanadi)
  const [prodSmsPhoneChoice, setProdSmsPhoneChoice] = useState<'primary' | 'secondary'>('primary');
  const [prodSmsPhone, setProdSmsPhone] = useState(supplierData.phone || '+998 ');
  const [prodSmsSent, setProdSmsSent] = useState(false);
  const [prodSmsCode, setProdSmsCode] = useState('');
  const [prodSmsInput, setProdSmsInput] = useState('');
  const [prodSmsNotice, setProdSmsNotice] = useState<string | null>(null);
  const [productConfirmError, setProductConfirmError] = useState<string | null>(null);

  useEffect(() => {
    if (prodSmsPhoneChoice === 'secondary' && supplierData.secondaryPhone) {
      setProdSmsPhone(supplierData.secondaryPhone);
    } else {
      setProdSmsPhone(supplierData.phone || '+998 ');
    }
  }, [prodSmsPhoneChoice, supplierData.phone, supplierData.secondaryPhone]);

  // Parol asosida mahsulotni o'chirish modali holatlari
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [deleteProductPassword, setDeleteProductPassword] = useState('');
  const [deleteProductPasswordError, setDeleteProductPasswordError] = useState<string | null>(null);
  const [showDeleteProductPass, setShowDeleteProductPass] = useState(false);

  const handleOpenDeleteProductModal = (prod: Product) => {
    setProductToDelete(prod);
    setDeleteProductPassword('');
    setDeleteProductPasswordError(null);
    setShowDeleteProductPass(false);
  };

  const handleConfirmDeleteProductWithPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productToDelete || !onDeleteProduct) return;
    const expectedPassword = (supplierData.password || 'user123').trim();
    if (!deleteProductPassword.trim()) {
      setDeleteProductPasswordError('Mahsulotni o‘chirish uchun kabinet parolini kiriting!');
      return;
    }
    if (deleteProductPassword.trim() !== expectedPassword) {
      setDeleteProductPasswordError('Kiritilgan parol noto‘g‘ri! Iltimos, kabinet parolini to‘g‘ri kiriting.');
      return;
    }
    onDeleteProduct(productToDelete.id);
    setProductToDelete(null);
    setDeleteProductPassword('');
    setDeleteProductPasswordError(null);
  };

  const handleOpenAddProductModal = (source: 'products' | 'crm', defaultChannel: 'online' | 'offline' = 'online') => {
    setEditingProduct(null);
    setIsMavjudlikSectionCollapsed(false);
    setAddProductSource(source);
    setAddProductChannel(defaultChannel);
    setNewTitle('');
    setNewCategory('');
    setNewManufacturer('');
    setNewUnit('kg');
    setNewPrice('');
    setNewOriginalPrice('');
    setNewCostPrice('');
    setNewStock(100);
    setNewMinOrder(1);
    setNewDesc('');
    setDraftVariants([
      {
        id: 'var-1',
        unit: 'kg',
        unitValues: { Kv: '', metr: '', kg: '', dona: '' },
        colors: [],
        specification: '',
        price: '',
        originalPrice: '',
        minOrder: 1,
        isColorOpen: false,
        isCollapsed: false,
      },
    ]);
    setNewImages([]);
    setNewVideoUrl('');
    setDetailBlocks([]);
    setSelectedColors([]);
    setProdSmsPhoneChoice('primary');
    setProdSmsPhone(supplierData.phone || '+998 ');
    setProdSmsSent(false);
    setProdSmsCode('');
    setProdSmsInput('');
    setProdSmsNotice(null);
    setProductConfirmError(null);
    setIsAddProductOpen(true);
  };

  const handleOpenEditProductModal = (prod: Product) => {
    setEditingProduct(prod);
    setIsMavjudlikSectionCollapsed(false);
    setAddProductSource('products');
    setAddProductChannel(prod.saleChannel === 'offline' ? 'offline' : 'online');
    setNewTitle(prod.title || '');
    setNewCategory(prod.category || '');
    setNewManufacturer(prod.manufacturerName || '');
    setNewUnit(prod.unit || 'kg');
    setNewPrice(prod.price || '');
    setNewOriginalPrice(prod.originalPrice || prod.price || '');
    setNewCostPrice(prod.costPrice || '');
    setNewStock(typeof prod.stock === 'number' ? prod.stock : 0);
    setNewMinOrder(prod.minOrder || 1);
    setNewDesc(prod.description || '');
    if (prod.variants && prod.variants.length > 0) {
      setDraftVariants(
        prod.variants.map((v, idx) => {
          const u = v.unit || prod.unit || 'kg';
          const numMatch = (v.specification || '').match(/^(\d+(?:[.,]\d+)?)/);
          const extractedNum = numMatch ? numMatch[1] : '';
          return {
            id: v.id || `var-${idx + 1}`,
            unit: u,
            unitValues: { Kv: '', metr: '', kg: '', dona: '', [u]: extractedNum },
            colors: v.colors || [],
            specification: v.specification || '',
            price: v.price || prod.price || '',
            originalPrice: v.originalPrice || prod.originalPrice || prod.price || '',
            minOrder: v.minOrder || prod.minOrder || 1,
            isColorOpen: false,
            isCollapsed: true,
            isSaved: true,
          };
        })
      );
    } else {
      const u = prod.unit || 'kg';
      setDraftVariants([
        {
          id: 'var-1',
          unit: u,
          unitValues: { Kv: '', metr: '', kg: '', dona: '' },
          colors: prod.colors || [],
          specification: '',
          price: prod.price || '',
          originalPrice: prod.originalPrice || prod.price || '',
          minOrder: prod.minOrder || 1,
          isColorOpen: false,
          isCollapsed: false,
          isSaved: false,
        },
      ]);
    }
    setNewImages(prod.images && prod.images.length > 0 ? prod.images : prod.image ? [prod.image] : []);
    setNewVideoUrl(prod.videoUrl || '');
    setDetailBlocks(prod.detailBlocks || []);
    setSelectedColors(prod.colors || []);
    setProdSmsPhoneChoice('primary');
    setProdSmsPhone(supplierData.phone || '+998 ');
    setProdSmsSent(false);
    setProdSmsCode('');
    setProdSmsInput('');
    setProdSmsNotice(null);
    setProductConfirmError(null);
    setIsAddProductOpen(true);
  };

  const handleAddDraftVariant = () => {
    setIsMavjudlikSectionCollapsed(false);
    setDraftVariants((prev) => [
      ...prev.map((v) => ({ ...v, isCollapsed: true, isSaved: true })),
      {
        id: `var-${Date.now()}-${prev.length + 1}`,
        unit: prev[prev.length - 1]?.unit || 'kg',
        unitValues: { Kv: '', metr: '', kg: '', dona: '' },
        colors: [],
        specification: '',
        price: newPrice || '',
        originalPrice: newOriginalPrice || '',
        minOrder: newMinOrder || 1,
        isColorOpen: false,
        isCollapsed: false,
        isSaved: false,
      },
    ]);
  };

  const handleRemoveDraftVariant = (varId: string) => {
    if (draftVariants.length <= 1) return;
    setDraftVariants((prev) => prev.filter((v) => v.id !== varId));
  };

  const handleUpdateDraftVariant = (varId: string, patch: Partial<DraftProductVariant>) => {
    setDraftVariants((prev) => prev.map((v) => (v.id === varId ? { ...v, ...patch } : v)));
  };

  const handleSaveSingleDraftVariant = (varId: string) => {
    setProductConfirmError(null);
    setDraftVariants((prev) =>
      prev.map((v, idx) => {
        if (v.id !== varId) return v;
        const u = v.unit || 'kg';
        const uNum = v.unitValues?.[u]?.trim() || '';
        const spec = uNum ? `${uNum} ${u}` : v.specification || `1 ${u}`;
        const savedPrice = v.price !== '' && Number(v.price) > 0 ? Number(v.price) : newPrice || '';
        if (idx === 0 && savedPrice && !newPrice) {
          setNewPrice(savedPrice);
        }
        return {
          ...v,
          specification: spec,
          price: savedPrice,
          isSaved: true,
          isCollapsed: true,
          isColorOpen: false,
        };
      })
    );
  };

  const handleToggleVariantColor = (varId: string, colorName: string) => {
    setDraftVariants((prev) =>
      prev.map((v) => {
        if (v.id !== varId) return v;
        const exists = v.colors.includes(colorName);
        if (exists) {
          return { ...v, colors: v.colors.filter((c) => c !== colorName) };
        }
        if (v.colors.length >= 12) return v;
        return { ...v, colors: [...v.colors, colorName] };
      })
    );
  };

  // B2B Orders sync with localStorage & Firestore
  useEffect(() => {
    const syncB2b = () => {
      try {
        const saved = localStorage.getItem('bunkerstroy_b2b_orders');
        if (saved) setB2bOrders(JSON.parse(saved));
      } catch {}
    };
    window.addEventListener('storage', syncB2b);
    window.addEventListener('bunkerstroy_b2b_updated', syncB2b);

    let unsubB2b: (() => void) | undefined;
    try {
      const q = collection(db, 'b2b_orders');
      unsubB2b = onSnapshot(
        q,
        (snap) => {
          const fsList: B2BOrderRequest[] = [];
          snap.forEach((d) => {
            const data = d.data() as B2BOrderRequest;
            if (data && data.id) fsList.push(data);
          });
          if (fsList.length > 0) {
            try {
              const saved = localStorage.getItem('bunkerstroy_b2b_orders');
              const localList: B2BOrderRequest[] = saved ? JSON.parse(saved) : [];
              const merged = new Map<string, B2BOrderRequest>();
              localList.forEach((o) => o && o.id && merged.set(o.id, o));
              fsList.forEach((fo) => merged.set(fo.id, fo));
              const arr = Array.from(merged.values()).sort(
                (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              );
              localStorage.setItem('bunkerstroy_b2b_orders', JSON.stringify(arr));
              setB2bOrders(arr);
            } catch {}
          }
        },
        () => {}
      );
    } catch {}

    return () => {
      window.removeEventListener('storage', syncB2b);
      window.removeEventListener('bunkerstroy_b2b_updated', syncB2b);
      if (unsubB2b) unsubB2b();
    };
  }, []);

  const saveB2bOrdersList = (nextList: B2BOrderRequest[], changedOrder?: B2BOrderRequest) => {
    setB2bOrders(nextList);
    try {
      localStorage.setItem('bunkerstroy_b2b_orders', JSON.stringify(nextList));
    } catch {}
    if (changedOrder) {
      try {
        setDoc(doc(db, 'b2b_orders', changedOrder.id), changedOrder, { merge: true }).catch(() => {});
      } catch {}
    }
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('bunkerstroy_b2b_updated'));
      window.dispatchEvent(new Event('storage'));
    }, 0);
  };

  // Online vs Offline filtered products for Mahsulotlar tab
  const onlineCompanyProducts = useMemo(
    () => companyProducts.filter((p) => p.saleChannel !== 'offline'),
    [companyProducts]
  );
  const offlineCompanyProducts = useMemo(
    () => companyProducts.filter((p) => p.saleChannel === 'offline'),
    [companyProducts]
  );
  const displayedCompanyProducts =
    productsSubTab === 'online' ? onlineCompanyProducts : offlineCompanyProducts;

  // Helper: extract YYYY-MM-DD from sale.date
  const extractSaleDay = (dateStr?: string): string => {
    if (!dateStr) return new Date().toISOString().slice(0, 10);
    const trimmed = String(dateStr).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      return trimmed.slice(0, 10);
    }
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10);
    }
    return trimmed.slice(0, 10);
  };

  const formatBuyerDisplayName = (rawName?: string): string => {
    if (!rawName) return 'Xaridor';
    return rawName
      .replace(/Oflayn Xaridor/gi, 'CRM Xaridor')
      .replace(/Oflayn savdo/gi, 'CRM savdo');
  };

  const availableSaleDays = useMemo(() => {
    const daysSet = new Set<string>();
    supplierReport.sales.forEach((s) => {
      daysSet.add(extractSaleDay(s.date));
    });
    return Array.from(daysSet).sort((a, b) => (a < b ? 1 : -1));
  }, [supplierReport.sales]);

  const timeFilteredAllSales = useMemo(() => {
    const all = supplierReport.sales;
    if (all.length === 0) return [];

    // Reference anchor date (latest sale date or today)
    const anchorDayStr = availableSaleDays[0] || new Date().toISOString().slice(0, 10);
    const anchorMs = new Date(`${anchorDayStr}T23:59:59`).getTime();

    return all.filter((s) => {
      const sDay = extractSaleDay(s.date);
      if (reportTimeRange === 'daily') {
        if (selectedReportDay !== 'all_days') {
          return sDay === selectedReportDay;
        }
        return true;
      }
      const sMs = new Date(`${sDay}T12:00:00`).getTime();
      if (isNaN(sMs) || isNaN(anchorMs)) return true;
      const diffDays = (anchorMs - sMs) / (1000 * 60 * 60 * 24);
      if (reportTimeRange === 'weekly') {
        return diffDays <= 7;
      }
      if (reportTimeRange === 'monthly') {
        return diffDays <= 31;
      }
      return true;
    });
  }, [supplierReport.sales, availableSaleDays, reportTimeRange, selectedReportDay]);

  // Online, Offline (CRM), and General sales for Hisobot, monitoring tab (3 sub-tabs)
  // ALGORITM: Onlayndagi savdo ma'lumotlari bilan Oflayn (CRM) alohida tizimda ishlaydi.
  // CRM da olib borilgan savdolar Admin hisob-kitobi va Bunker uchun ajratiladigan ulush EMAS!
  const onlineReportSales = useMemo(
    () => timeFilteredAllSales.filter((s) => s.orderChannel !== 'offline'),
    [timeFilteredAllSales]
  );
  const offlineReportSales = useMemo(
    () => timeFilteredAllSales.filter((s) => s.orderChannel === 'offline'),
    [timeFilteredAllSales]
  );
  const generalReportSales = timeFilteredAllSales;
  const displayedReportSales = useMemo(() => {
    if (reportsSubTab === 'online') return onlineReportSales;
    if (reportsSubTab === 'offline') return offlineReportSales;
    return generalReportSales;
  }, [reportsSubTab, onlineReportSales, offlineReportSales, generalReportSales]);

  const onlineSalesTotalSum = useMemo(
    () => onlineReportSales.reduce((acc, s) => acc + (Number(s.totalSum) || 0), 0),
    [onlineReportSales]
  );
  const offlineCrmSalesTotalSum = useMemo(
    () => offlineReportSales.reduce((acc, s) => acc + (Number(s.totalSum) || 0), 0),
    [offlineReportSales]
  );
  const generalSalesTotalSum = onlineSalesTotalSum + offlineCrmSalesTotalSum;

  // Bunker Stroy ulushi FAQAT Onlayn savdolardan hisoblanadi (CRM savdolaridan 0 so'm!)
  const onlineBunkerCommissionSum = useMemo(() => {
    const rate = Math.min(100, Math.max(0.1, Number(supplierReport.commissionRate) || 1));
    const basis = supplierReport.commissionBasis === 'profit' ? 'profit' : 'total';
    const onlineProfit = onlineReportSales.reduce(
      (acc, s) => acc + (Number(s.profitSum) || Math.round((Number(s.totalSum) || 0) * 0.2)),
      0
    );
    const baseSum = basis === 'profit' ? onlineProfit : onlineSalesTotalSum;
    return Math.round((baseSum * rate) / 100);
  }, [onlineReportSales, onlineSalesTotalSum, supplierReport.commissionRate, supplierReport.commissionBasis]);

  const onlineSupplierNetSum = Math.max(0, onlineSalesTotalSum - onlineBunkerCommissionSum);
  const generalSupplierNetSum = onlineSupplierNetSum + offlineCrmSalesTotalSum;

  const getSaleItemBunkerCommission = (sale: typeof supplierReport.sales[number]): number => {
    if (sale.orderChannel === 'offline') return 0;
    const rate = Math.min(100, Math.max(0.1, Number(supplierReport.commissionRate) || 1));
    const basis = supplierReport.commissionBasis === 'profit' ? 'profit' : 'total';
    const itemProfit = Number(sale.profitSum) || Math.round((Number(sale.totalSum) || 0) * 0.2);
    const base = basis === 'profit' ? itemProfit : Number(sale.totalSum) || 0;
    return Math.round((base * rate) / 100);
  };

  // Har bir hisobot kunlik ajralib turishi uchun kunlar bo'yicha guruhlash
  const dailyGroupedReportSales = useMemo(() => {
    const groupsMap = new Map<
      string,
      {
        day: string;
        items: typeof displayedReportSales;
        totalSum: number;
        onlineSum: number;
        crmSum: number;
        commissionSum: number;
        netSum: number;
      }
    >();

    displayedReportSales.forEach((sale) => {
      const dayKey = extractSaleDay(sale.date);
      const isOff = sale.orderChannel === 'offline';
      const sSum = Number(sale.totalSum) || 0;
      const comm = getSaleItemBunkerCommission(sale);
      const net = Math.max(0, sSum - comm);
      const existing = groupsMap.get(dayKey);
      if (existing) {
        existing.items.push(sale);
        existing.totalSum += sSum;
        if (isOff) existing.crmSum += sSum;
        else existing.onlineSum += sSum;
        existing.commissionSum += comm;
        existing.netSum += net;
      } else {
        groupsMap.set(dayKey, {
          day: dayKey,
          items: [sale],
          totalSum: sSum,
          onlineSum: isOff ? 0 : sSum,
          crmSum: isOff ? sSum : 0,
          commissionSum: comm,
          netSum: net,
        });
      }
    });

    return Array.from(groupsMap.values()).sort((a, b) => (a.day < b.day ? 1 : -1));
  }, [displayedReportSales, supplierReport.commissionRate, supplierReport.commissionBasis]);

  // Monitoring hisobotini haqiqiy PDF fayl (.pdf) sifatida yuklab olish
  const handleDownloadMonitoringPdf = () => {
    const reportTitle =
      reportsSubTab === 'general'
        ? '1. Umumiy Monitoring Hisoboti (Onlayn + CRM)'
        : reportsSubTab === 'online'
        ? '2. Onlayn Savdo Monitoringi Hisoboti'
        : reportsSubTab === 'offline'
        ? '3. CRM Monitoringi Hisoboti (CRM savdo)'
        : '4. Kirim-Chiqim Monitoringi Hisoboti';
    const periodLabel =
      reportTimeRange === 'daily'
        ? selectedReportDay === 'all_days'
          ? 'Kunlik (Barcha kunlar kesimida)'
          : `Kunlik (${selectedReportDay})`
        : reportTimeRange === 'weekly'
        ? 'Haftalik'
        : 'Oylik';
    const nowFormatted = new Date().toLocaleString('uz-UZ');

    downloadMonitoringPdfFile({
      reportTitle,
      companyName: supplierData.companyName,
      inn: supplierData.inn,
      region: supplierData.region,
      phone: supplierData.phone,
      periodLabel,
      nowFormatted,
      generalSalesTotalSum,
      generalSalesCount: generalReportSales.length,
      onlineSalesTotalSum,
      offlineCrmSalesTotalSum,
      generalSupplierNetSum,
      showCommissionColumn: reportsSubTab !== 'offline',
      dailyGroups: dailyGroupedReportSales,
      getSaleItemBunkerCommission,
      formatBuyerDisplayName,
    });
  };

  // B2B Orders for current Supplier (outgoing requests made by this supplier) vs Manufacturer (incoming requests from suppliers)
  const myOutgoingB2bOrders = useMemo(() => {
    const myComp = (supplierData.companyName || '').trim().toLowerCase();
    return b2bOrders.filter(
      (o) =>
        o.buyerSupplierId === supplierData.id ||
        (o.buyerInn && supplierData.inn && o.buyerInn === supplierData.inn) ||
        (o.buyerCompanyName || '').trim().toLowerCase() === myComp
    );
  }, [b2bOrders, supplierData]);

  const incomingManufacturerB2bOrders = useMemo(() => {
    const myComp = (supplierData.companyName || '').trim().toLowerCase();
    return b2bOrders.filter((o) => {
      if (o.manufacturerId && o.manufacturerId === supplierData.id) return true;
      if (o.manufacturerInn && supplierData.inn && o.manufacturerInn === supplierData.inn) return true;
      const mComp = (o.manufacturerCompanyName || '').trim().toLowerCase();
      if (mComp && myComp && (mComp === myComp || mComp.includes(myComp) || myComp.includes(mComp))) return true;
      if (supplierData.cabinetType === 'manufacturer') return true;
      return false;
    });
  }, [b2bOrders, supplierData]);

  const awaitingPaymentB2bCount = useMemo(
    () => myOutgoingB2bOrders.filter((o) => o.status === 'approved_awaiting_payment').length,
    [myOutgoingB2bOrders]
  );

  const pendingIncomingB2bCount = useMemo(
    () =>
      incomingManufacturerB2bOrders.filter(
        (o) =>
          o.status === 'requested' ||
          o.status === 'approved_awaiting_payment' ||
          o.status === 'paid' ||
          o.status === 'preparing'
      ).length,
    [incomingManufacturerB2bOrders]
  );

  const getDefaultB2bBankAccountText = (ord?: B2BOrderRequest) => {
    const comp = ord?.manufacturerCompanyName || supplierData.companyName || 'B2B Ta\'minotchi';
    const inn = ord?.manufacturerInn || supplierData.inn || '309123456';
    return `H/R: 2020 8000 9054 1234 5001 | MFO: 00401 | STIR: ${inn} | Bank: Milliy Bank AJ | Korxona: «${comp}»`;
  };

  // Add item to B2B Cart
  const handleAddToB2bCart = (product: Product) => {
    const varIdx = b2bVariantIdxInputs[product.id] ?? 0;
    const chosenVar = product.variants && product.variants.length > 0 ? product.variants[varIdx] || product.variants[0] : undefined;
    const unit = chosenVar?.unit || product.unit || 'dona';
    const price = chosenVar ? chosenVar.originalPrice || chosenVar.price : product.originalPrice || product.price;
    const spec = chosenVar?.specification || '';
    const availableColors = chosenVar?.colors && chosenVar.colors.length > 0 ? chosenVar.colors : product.colors || [];
    const color = b2bColorInputs[product.id] || availableColors[0] || '';
    const qty = Math.max(1, Number(b2bQtyInputs[product.id]) || product.minOrder || 1);
    const key = `${product.id}-${unit}-${spec}-${color}`;

    setB2bCart((prev) => {
      const existing = prev.find((it) => it.key === key);
      if (existing) {
        return prev.map((it) => (it.key === key ? { ...it, quantity: it.quantity + qty } : it));
      }
      return [
        ...prev,
        {
          key,
          product,
          unit,
          color: color || undefined,
          specification: spec || undefined,
          price,
          quantity: qty,
        },
      ];
    });
    setB2bNoticeMessage(`«${product.title}» (${qty} ${unit}) B2B savatga yuklandi!`);
    setTimeout(() => setB2bNoticeMessage(null), 2500);
  };

  // Build preview B2BOrderRequest from current B2B cart (for PDF preview before sending)
  const buildDraftB2bManifestFromCart = (): B2BOrderRequest | null => {
    if (b2bCart.length === 0) return null;
    const firstProd = b2bCart[0].product;
    const matchedManuf = allSuppliersList.find(
      (s) =>
        s.id === firstProd.supplierId ||
        (s.companyName || '').toLowerCase() === (firstProd.supplierName || '').toLowerCase()
    );
    const items: B2BOrderItem[] = b2bCart.map((c) => ({
      productId: c.product.id,
      title: c.product.title,
      category: c.product.category,
      unit: c.unit,
      specification: c.specification,
      color: c.color,
      quantity: c.quantity,
      price: c.price,
      totalSum: c.price * c.quantity,
      image: c.product.image,
      manufacturerId: c.product.supplierId || matchedManuf?.id,
      manufacturerInn: c.product.supplierInn || matchedManuf?.inn,
      manufacturerName: c.product.supplierName,
    }));
    const totalAmount = items.reduce((s, i) => s + i.totalSum, 0);
    return {
      id: `B2B-${Date.now().toString().slice(-6)}`,
      buyerSupplierId: supplierData.id,
      buyerCompanyName: supplierData.companyName,
      buyerInn: supplierData.inn || supplierData.companyInfo?.inn || '313086503',
      buyerDirector:
        supplierData.companyInfo?.director ||
        [supplierData.surname, supplierData.name].filter(Boolean).join(' ') ||
        supplierData.name,
      buyerPhone: supplierData.phone,
      buyerRegion: supplierData.region,
      buyerAddress: supplierData.companyInfo?.address || supplierData.companyInfo?.locality || supplierData.region,
      buyerContractNumber: supplierData.contractNumber || '№ B2B-101',
      buyerCompanyInfo: supplierData.companyInfo,
      manufacturerId: firstProd.supplierId || matchedManuf?.id,
      manufacturerInn: firstProd.supplierInn || matchedManuf?.inn,
      manufacturerCompanyName: firstProd.supplierName,
      manufacturerPhone: matchedManuf?.phone || '',
      manufacturerRegion: firstProd.region || matchedManuf?.region || '',
      items,
      totalAmount,
      status: 'requested',
      createdAt: new Date().toISOString(),
    };
  };

  // Send B2B Request from B2C Cabinet to B2B Cabinet
  const handleSendB2bRequest = () => {
    const manifest = buildDraftB2bManifestFromCart();
    if (!manifest) return;
    const nextList = [manifest, ...b2bOrders];
    saveB2bOrdersList(nextList, manifest);
    setB2bCart([]);
    setPreviewB2bManifest(manifest);
    setB2bNoticeMessage(
      `B2B so‘rov (#${manifest.id}) «${manifest.manufacturerCompanyName}» B2B kabinetiga muvaffaqiyatli yuborildi!`
    );
    setTimeout(() => setB2bNoticeMessage(null), 4000);
  };

  // Step 1 (B2B Cabinet): Accept incoming B2C request & send Bank Account Details ("Hisob raqam ma'lumotlari") to B2C Cabinet
  const handleAcceptB2bRequestAndSendBankDetails = (orderId: string) => {
    const targetOrd = b2bOrders.find((o) => o.id === orderId);
    const rawBank =
      b2bBankAccountInputs[orderId] !== undefined
        ? b2bBankAccountInputs[orderId]
        : targetOrd?.bankAccountDetails || getDefaultB2bBankAccountText(targetOrd);
    const cleanedBank = rawBank.trim();
    if (!cleanedBank) {
      setB2bBankAccountErrors((prev) => ({
        ...prev,
        [orderId]: "B2C kabinetga jo‘natish uchun hisob raqam ma'lumotlarini kiriting!",
      }));
      return;
    }
    setB2bBankAccountErrors((prev) => {
      const next = { ...prev };
      delete next[orderId];
      return next;
    });

    const nowIso = new Date().toISOString();
    let updatedOrder: B2BOrderRequest | undefined;
    const nextList = b2bOrders.map((o) => {
      if (o.id === orderId) {
        updatedOrder = {
          ...o,
          status: 'approved_awaiting_payment',
          bankAccountDetails: cleanedBank,
          approvedAt: nowIso,
        };
        return updatedOrder;
      }
      return o;
    });
    saveB2bOrdersList(nextList, updatedOrder);
  };

  // Step 2 (B2C Cabinet): B2C sees acceptance notification & Bank Account Details, and sends payment ("To'lovni jo'natish")
  // Once payment is sent, the process continues in B2B Cabinet ("To'lov jo'natilgach jarayon davom etadi")
  const handleSendB2bPaymentFromB2c = (orderId: string) => {
    const nowIso = new Date().toISOString();
    let updatedOrder: B2BOrderRequest | undefined;
    const nextList = b2bOrders.map((o) => {
      if (o.id === orderId) {
        updatedOrder = {
          ...o,
          status: 'paid',
          paidAt: nowIso,
        };
        return updatedOrder;
      }
      return o;
    });
    saveB2bOrdersList(nextList, updatedOrder);

    if (updatedOrder) {
      try {
        const savedOrders = localStorage.getItem('bunkerstroy_orders');
        const list: Order[] = savedOrders ? JSON.parse(savedOrders) : [];
        const existingIdx = list.findIndex((ord) => ord.id === updatedOrder!.id);
        const syncedOrder: Order = {
          id: updatedOrder.id,
          orderChannel: 'online',
          buyerId: updatedOrder.buyerSupplierId,
          buyerName: `${updatedOrder.buyerCompanyName} (B2C Kabinet)`,
          buyerPhone: updatedOrder.buyerPhone,
          items: updatedOrder.items.map((it) => ({
            productId: it.productId,
            title: `${it.title}${it.specification ? ` [${it.specification}]` : ''}${it.color ? ` (${it.color})` : ''}`,
            quantity: it.quantity,
            unit: it.unit,
            price: it.price,
            category: it.category,
            supplierId: it.manufacturerId,
            supplierInn: it.manufacturerInn,
            supplierName: it.manufacturerName,
          })),
          totalAmount: updatedOrder.totalAmount,
          status: 'confirmed',
          deliveryAddress: updatedOrder.buyerAddress || updatedOrder.buyerRegion || 'Toshkent sh.',
          recipientName: updatedOrder.buyerCompanyName,
          recipientPhone: updatedOrder.buyerPhone,
          paymentMethod: 'card',
          paymentStatus: 'paid',
          paidAt: nowIso,
          vehicleType: 'B2B Maxsus Yuk Transporti',
          createdAt: updatedOrder.createdAt || nowIso,
          updatedAt: nowIso,
        };
        const nextOrders =
          existingIdx >= 0
            ? list.map((ord, idx) => (idx === existingIdx ? syncedOrder : ord))
            : [syncedOrder, ...list];
        localStorage.setItem('bunkerstroy_orders', JSON.stringify(nextOrders));
        setDoc(doc(db, 'orders', syncedOrder.id), syncedOrder, { merge: true }).catch(() => {});
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('bunkerstroy_orders_updated'));
          window.dispatchEvent(new CustomEvent('bunkerstroy_finance_updated'));
        }, 0);
        setOrdersRefreshTick((t) => t + 1);
      } catch {}
    }

    setB2bNoticeMessage(
      `To‘lov (#${orderId}) B2B kabinet hisob raqamiga muvaffaqiyatli jo‘natildi! Endi B2B kabinet mahsulotlarni tayyorlash va manzilga yuborish jarayonini davom ettiradi.`
    );
    setTimeout(() => setB2bNoticeMessage(null), 5000);
  };

  // Step 3 (B2B Cabinet after payment is sent): "Mahsulotlarni tayyorlash jarayoni" -> sets status to 'preparing' ("Mahsulot yuklash jarayonida" in B2C Buyurtmalarim)
  const handleStartPreparingB2bOrder = (orderId: string) => {
    const nowIso = new Date().toISOString();
    let updatedOrder: B2BOrderRequest | undefined;
    const nextList = b2bOrders.map((o) => {
      if (o.id === orderId) {
        updatedOrder = {
          ...o,
          status: 'preparing',
          approvedAt: o.approvedAt || nowIso,
        };
        return updatedOrder;
      }
      return o;
    });
    saveB2bOrdersList(nextList, updatedOrder);

    if (updatedOrder) {
      try {
        const savedOrders = localStorage.getItem('bunkerstroy_orders');
        const list: Order[] = savedOrders ? JSON.parse(savedOrders) : [];
        const existingIdx = list.findIndex((ord) => ord.id === updatedOrder!.id);
        const syncedOrder: Order = {
          id: updatedOrder.id,
          orderChannel: 'online',
          buyerId: updatedOrder.buyerSupplierId,
          buyerName: `${updatedOrder.buyerCompanyName} (B2C Kabinet)`,
          buyerPhone: updatedOrder.buyerPhone,
          items: updatedOrder.items.map((it) => ({
            productId: it.productId,
            title: `${it.title}${it.specification ? ` [${it.specification}]` : ''}${it.color ? ` (${it.color})` : ''}`,
            quantity: it.quantity,
            unit: it.unit,
            price: it.price,
            category: it.category,
            supplierId: it.manufacturerId,
            supplierInn: it.manufacturerInn,
            supplierName: it.manufacturerName,
          })),
          totalAmount: updatedOrder.totalAmount,
          status: 'assigned',
          deliveryAddress: updatedOrder.buyerAddress || updatedOrder.buyerRegion || 'Toshkent sh.',
          recipientName: updatedOrder.buyerCompanyName,
          recipientPhone: updatedOrder.buyerPhone,
          paymentMethod: 'card',
          paymentStatus: 'paid',
          paidAt: updatedOrder.paidAt || nowIso,
          vehicleType: 'B2B Maxsus Yuk Transporti',
          createdAt: updatedOrder.createdAt || nowIso,
          updatedAt: nowIso,
        };
        const nextOrders =
          existingIdx >= 0
            ? list.map((ord, idx) => (idx === existingIdx ? syncedOrder : ord))
            : [syncedOrder, ...list];
        localStorage.setItem('bunkerstroy_orders', JSON.stringify(nextOrders));
        setDoc(doc(db, 'orders', syncedOrder.id), syncedOrder, { merge: true }).catch(() => {});
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('bunkerstroy_orders_updated'));
        }, 0);
        setOrdersRefreshTick((t) => t + 1);
      } catch {}
    }
  };

  // Step 4 (B2B Cabinet): "Mahsulotni manzilga yuborish" with Yetkazib beruvchi nomeri -> sets status to 'in_transit' ("Yetkazilmoqda")
  const handleShipB2bOrderWithDriverPhone = (orderId: string, fallbackPhone?: string) => {
    const rawPhone = driverPhoneInputs[orderId] !== undefined ? driverPhoneInputs[orderId] : fallbackPhone || '';
    const cleaned = rawPhone.trim();
    const digitsOnly = cleaned.replace(/\D/g, '');
    if (digitsOnly.length < 9) {
      setDriverPhoneErrors((prev) => ({
        ...prev,
        [orderId]: 'Yetkazib beruvchi nomerini to‘liq kiriting! (Masalan: +998 90 123 45 67)',
      }));
      return;
    }
    setDriverPhoneErrors((prev) => {
      const next = { ...prev };
      delete next[orderId];
      return next;
    });

    const nowIso = new Date().toISOString();
    let updatedOrder: B2BOrderRequest | undefined;
    const nextList = b2bOrders.map((o) => {
      if (o.id === orderId) {
        updatedOrder = {
          ...o,
          status: 'in_transit',
          driverPhone: cleaned,
          shippedAt: nowIso,
        };
        return updatedOrder;
      }
      return o;
    });
    saveB2bOrdersList(nextList, updatedOrder);

    if (updatedOrder) {
      try {
        const savedOrders = localStorage.getItem('bunkerstroy_orders');
        const list: Order[] = savedOrders ? JSON.parse(savedOrders) : [];
        const existingIdx = list.findIndex((ord) => ord.id === updatedOrder!.id);
        const syncedOrder: Order = {
          id: updatedOrder.id,
          orderChannel: 'online',
          buyerId: updatedOrder.buyerSupplierId,
          buyerName: `${updatedOrder.buyerCompanyName} (B2C Kabinet)`,
          buyerPhone: updatedOrder.buyerPhone,
          items: updatedOrder.items.map((it) => ({
            productId: it.productId,
            title: `${it.title}${it.specification ? ` [${it.specification}]` : ''}${it.color ? ` (${it.color})` : ''}`,
            quantity: it.quantity,
            unit: it.unit,
            price: it.price,
            category: it.category,
            supplierId: it.manufacturerId,
            supplierInn: it.manufacturerInn,
            supplierName: it.manufacturerName,
          })),
          totalAmount: updatedOrder.totalAmount,
          status: 'in_transit',
          driverPhone: cleaned,
          deliveryAddress: updatedOrder.buyerAddress || updatedOrder.buyerRegion || 'Toshkent sh.',
          recipientName: updatedOrder.buyerCompanyName,
          recipientPhone: updatedOrder.buyerPhone,
          paymentMethod: 'card',
          paymentStatus: 'paid',
          paidAt: updatedOrder.paidAt || nowIso,
          vehicleType: 'B2B Maxsus Yuk Transporti',
          createdAt: updatedOrder.createdAt || nowIso,
          updatedAt: nowIso,
        };
        const nextOrders =
          existingIdx >= 0
            ? list.map((ord, idx) => (idx === existingIdx ? syncedOrder : ord))
            : [syncedOrder, ...list];
        localStorage.setItem('bunkerstroy_orders', JSON.stringify(nextOrders));
        setDoc(doc(db, 'orders', syncedOrder.id), syncedOrder, { merge: true }).catch(() => {});
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('bunkerstroy_orders_updated'));
          window.dispatchEvent(new CustomEvent('bunkerstroy_finance_updated'));
        }, 0);
        setOrdersRefreshTick((t) => t + 1);
      } catch {}
    }
  };

  // Step 5: Mark B2B order as delivered ("Sotib olingan")
  const handleMarkB2bOrderDelivered = (orderId: string) => {
    const nowIso = new Date().toISOString();
    let updatedOrder: B2BOrderRequest | undefined;
    const nextList = b2bOrders.map((o) => {
      if (o.id === orderId) {
        updatedOrder = {
          ...o,
          status: 'delivered',
        };
        return updatedOrder;
      }
      return o;
    });
    saveB2bOrdersList(nextList, updatedOrder);

    if (updatedOrder) {
      try {
        const savedOrders = localStorage.getItem('bunkerstroy_orders');
        const list: Order[] = savedOrders ? JSON.parse(savedOrders) : [];
        const nextOrders = list.map((ord) =>
          ord.id === updatedOrder!.id ? { ...ord, status: 'delivered' as const, updatedAt: nowIso } : ord
        );
        localStorage.setItem('bunkerstroy_orders', JSON.stringify(nextOrders));
        setDoc(doc(db, 'orders', updatedOrder.id), { status: 'delivered', updatedAt: nowIso }, { merge: true }).catch(() => {});
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('bunkerstroy_orders_updated'));
          window.dispatchEvent(new CustomEvent('bunkerstroy_finance_updated'));
        }, 0);
        setOrdersRefreshTick((t) => t + 1);
      } catch {}
    }
  };

  const handleApproveB2bOrder = (orderId: string) => {
    handleAcceptB2bRequestAndSendBankDetails(orderId);
  };

  const handlePayAndShipB2bOrder = (orderId: string) => {
    handleSendB2bPaymentFromB2c(orderId);
  };

  // Generate & Download PDF for Platform Customer Order Request ("Mijozlar so'rovi")
  const handlePrintOrDownloadCustomerOrderPdf = (cust: (typeof supplierCustomers)[0]) => {
    const statusText =
      cust.status === 'pending' || cust.status === 'confirmed'
        ? "Yangi mahsulot so'rovi"
        : cust.status === 'assigned'
        ? 'Mahsulot yuklash jarayonida'
        : cust.status === 'in_transit'
        ? `Yetkazilmoqda${cust.driverPhone ? ` (Bog'lanish uchun tel: ${cust.driverPhone})` : ''}`
        : 'Yetkazilgan';

    downloadCustomerOrderPdfFile({
      orderIds: cust.orderIds,
      lastOrderDate: cust.lastOrderDate,
      statusText,
      companyName: supplierData.companyName,
      supplierInn: supplierData.inn,
      supplierPhone: supplierData.phone,
      supplierRegion: supplierData.region,
      customerName: cust.name,
      customerPhone: cust.phone,
      customerAddress: cust.address,
      driverPhone: cust.driverPhone,
      itemsList: cust.itemsList || [],
      totalSpent: cust.totalSpent,
    });
  };

  // Generate & Download PDF Cargo Manifest & Supplier Company Info (.pdf)
  const handlePrintOrDownloadB2bPdf = (manifest: B2BOrderRequest) => {
    downloadB2bManifestPdfFile(manifest);
  };

  // Complete CRM Sale from active CRM Basket -> records into CRM Sales Report, General Report & deducts from Stock
  const handleCompleteCrmOfflineSale = () => {
    if (selectedCrmEntries.length === 0) return;

    // Ombor qoldig'ini tekshirish (har bir mahsulotning barcha tanlangan variantlari bo'yicha jami miqdor)
    const qtyByProdId = new Map<string, { prod: Product; totalQty: number }>();
    for (const entry of selectedCrmEntries) {
      const q = getCrmEntryQty(entry.entryKey, entry.prod);
      const prev = qtyByProdId.get(entry.prod.id);
      qtyByProdId.set(entry.prod.id, {
        prod: entry.prod,
        totalQty: (prev?.totalQty || 0) + q,
      });
    }

    for (const { prod, totalQty } of qtyByProdId.values()) {
      const avail = typeof prod.stock === 'number' ? Math.max(0, prod.stock) : 0;
      if (avail <= 0 || totalQty > avail) {
        setCrmStockWarning(
          `«${prod.title}» — Ombordagi miqdor yetarli emas! (Omborda mavjud: ${avail} ${prod.unit})`
        );
        setTimeout(() => setCrmStockWarning(null), 4000);
        return;
      }
    }

    const nowIso = new Date().toISOString();
    const newOrderId = `CRM-${Date.now().toString().slice(-6)}`;
    const items = selectedCrmEntries.map((entry) => {
      const q = getCrmEntryQty(entry.entryKey, entry.prod);
      return {
        productId: entry.prod.id,
        title: entry.displayTitle,
        quantity: q,
        unit: entry.unitSpec,
        price: entry.crmPrice,
        category: entry.prod.category,
        supplierId: supplierData.id,
        supplierInn: supplierData.inn,
        supplierName: supplierData.companyName,
      };
    });

    const newOfflineOrder: Order = {
      id: newOrderId,
      orderChannel: 'offline',
      buyerId: `crm-client-${Date.now()}`,
      buyerName: crmClientName.trim() || `CRM savdo (${activeCrmBasket.name})`,
      buyerPhone: crmClientPhone.trim() || supplierData.phone || '+998 —',
      items,
      totalAmount: crmCalculation.finalSum,
      status: 'delivered',
      deliveryAddress: `${supplierData.region || 'Toshkent'} (CRM savdo)`,
      recipientName: crmClientName.trim() || `CRM savdo (${activeCrmBasket.name})`,
      recipientPhone: crmClientPhone.trim() || '—',
      paymentMethod: 'cash',
      paymentStatus: 'paid',
      paidAt: nowIso,
      vehicleType: 'CRM savdo',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    try {
      const saved = localStorage.getItem('bunkerstroy_orders');
      const list: Order[] = saved ? JSON.parse(saved) : [];
      localStorage.setItem('bunkerstroy_orders', JSON.stringify([newOfflineOrder, ...list]));
      setDoc(doc(db, 'orders', newOfflineOrder.id), newOfflineOrder, { merge: true }).catch(() => {});
    } catch {}

    // Ombordagi mahsulot miqdoridan sotilgan CRM hajmni chegirish
    try {
      const savedProds = localStorage.getItem('bunkerstroy_products');
      const prodList: Product[] = savedProds ? JSON.parse(savedProds) : [];
      const updatedMap = new Map<string, Product>();

      qtyByProdId.forEach(({ prod, totalQty }) => {
        const nextStock = Math.max(0, (Number(prod.stock) || 0) - totalQty);
        const nextSales = (Number(prod.salesCount) || 0) + totalQty;
        const updatedProd: Product = {
          ...prod,
          stock: nextStock,
          salesCount: nextSales,
        };
        updatedMap.set(prod.id, updatedProd);
        try {
          onAddProduct(updatedProd);
        } catch {}
        try {
          setDoc(doc(db, 'products', prod.id), { stock: nextStock, salesCount: nextSales }, { merge: true }).catch(() => {});
        } catch {}
      });

      if (Array.isArray(prodList) && prodList.length > 0) {
        const nextList = prodList.map((p) => (p && updatedMap.has(p.id) ? { ...p, ...updatedMap.get(p.id)! } : p));
        localStorage.setItem('bunkerstroy_products', JSON.stringify(nextList));
      }
      window.dispatchEvent(new CustomEvent('bunkerstroy_products_updated'));
    } catch {}

    setCrmSelectedIds([]);
    setCrmStockWarning(null);
    setCrmSaleSuccessNotice(
      `${activeCrmBasket.name} bo‘yicha ${formatPrice(crmCalculation.finalSum)} miqdoridagi CRM savdo tasdiqlandi va ombor qoldig‘idan chegirildi!`
    );
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('bunkerstroy_orders_updated'));
      window.dispatchEvent(new CustomEvent('bunkerstroy_finance_updated'));
    }, 0);
    setOrdersRefreshTick((t) => t + 1);
    setTimeout(() => setCrmSaleSuccessNotice(null), 4000);
  };

  // Helper to compress uploaded images so they never exceed localStorage / Firestore limits
  const compressImageFile = (file: File, callback: (dataUrl: string) => void) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      if (!result) return;
      const img = new Image();
      img.onload = () => {
        try {
          const maxDim = 900;
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', 0.75);
            callback(compressed);
            return;
          }
        } catch {}
        callback(result);
      };
      img.onerror = () => callback(result);
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  // Multi-image upload handler (up to 12 images)
  const handleMultiImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = 12 - newImages.length;
    if (remainingSlots <= 0) {
      return;
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots);
    filesToProcess.forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      compressImageFile(file, (dataUrl) => {
        setNewImages((prev) => {
          if (prev.length >= 12) return prev;
          return [...prev, dataUrl];
        });
      });
    });
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setNewImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Detail blocks (up to 4 images with description)
  const handleAddDetailBlockImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const remaining = 4 - detailBlocks.length;
    if (remaining <= 0) return;

    Array.from(files).slice(0, remaining).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      compressImageFile(file, (dataUrl) => {
        setDetailBlocks((prev) => {
          if (prev.length >= 4) return prev;
          return [...prev, { image: dataUrl, text: '' }];
        });
      });
    });
  };

  const handleUpdateDetailBlockText = (idx: number, text: string) => {
    setDetailBlocks((prev) => prev.map((b, i) => (i === idx ? { ...b, text } : b)));
  };

  const handleReplaceDetailBlockImage = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    compressImageFile(file, (dataUrl) => {
      setDetailBlocks((prev) => prev.map((b, i) => (i === idx ? { ...b, image: dataUrl } : b)));
    });
  };

  const handleRemoveDetailBlock = (idx: number) => {
    setDetailBlocks((prev) => prev.filter((_, i) => i !== idx));
  };

  // Toggle color selection (maksimal 12 ta)
  const toggleColor = (colorName: string) => {
    setSelectedColors((prev) => {
      if (prev.includes(colorName)) {
        return prev.filter((c) => c !== colorName);
      }
      if (prev.length >= 12) {
        return prev;
      }
      return [...prev, colorName];
    });
  };

  const handleRemoveColor = (colorName: string) => {
    setSelectedColors((prev) => prev.filter((c) => c !== colorName));
  };

  // Sozlamalar (Login, Password & Company Profile edit) State + SMS Verification + STIR (orginfo.uz / stat.uz) Lookup
  const [isStirInfoCollapsed, setIsStirInfoCollapsed] = useState(false);
  const [settingsLogin, setSettingsLogin] = useState(supplierData.login || '');
  const [settingsPassword, setSettingsPassword] = useState('');
  const [settingsPasswordConfirm, setSettingsPasswordConfirm] = useState('');
  const [settingsStir, setSettingsStir] = useState(supplierData.inn || '');
  const [settingsStirLoading, setSettingsStirLoading] = useState(false);
  const [settingsStirError, setSettingsStirError] = useState<string | null>(null);
  const [settingsStirVerified, setSettingsStirVerified] = useState(false);
  const [settingsCompanyInfo, setSettingsCompanyInfo] = useState<CompanyInfo | null>(supplierData.companyInfo || null);
  const [settingsCompanyName, setSettingsCompanyName] = useState(supplierData.companyName || '');
  const [settingsName, setSettingsName] = useState(supplierData.name || '');
  const [settingsSurname, setSettingsSurname] = useState(supplierData.surname || '');
  const [settingsPhone, setSettingsPhone] = useState(supplierData.phone || '');
  const [settingsSecondaryPhone, setSettingsSecondaryPhone] = useState(supplierData.secondaryPhone || '+998 ');
  const [settingsRegion, setSettingsRegion] = useState(supplierData.region || '');
  const [settingsContractNumber, setSettingsContractNumber] = useState(supplierData.contractNumber || '');
  const [showSettingsPass, setShowSettingsPass] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // SMS state for Settings (Primary Phone)
  const [settingsSmsSent, setSettingsSmsSent] = useState(false);
  const [settingsSmsCode, setSettingsSmsCode] = useState('');
  const [settingsSmsInput, setSettingsSmsInput] = useState('');
  const [settingsSmsNotice, setSettingsSmsNotice] = useState<string | null>(null);

  // SMS state for Secondary Phone addition/update (verified via Primary Phone)
  const [secondaryPhoneSmsSent, setSecondaryPhoneSmsSent] = useState(false);
  const [secondaryPhoneSmsCode, setSecondaryPhoneSmsCode] = useState('');
  const [secondaryPhoneSmsInput, setSecondaryPhoneSmsInput] = useState('');
  const [secondaryPhoneSmsNotice, setSecondaryPhoneSmsNotice] = useState<string | null>(null);
  const [secondaryPhoneError, setSecondaryPhoneError] = useState<string | null>(null);
  const [secondaryPhoneSuccess, setSecondaryPhoneSuccess] = useState(false);

  useEffect(() => {
    setSettingsLogin(supplierData.login || '');
    setSettingsStir(supplierData.inn || '');
    setSettingsCompanyInfo(supplierData.companyInfo || null);
    setSettingsCompanyName(supplierData.companyName || '');
    setSettingsName(supplierData.name || '');
    setSettingsSurname(supplierData.surname || '');
    setSettingsPhone(supplierData.phone || '+998 ');
    setSettingsSecondaryPhone(supplierData.secondaryPhone || '+998 ');
    setSettingsRegion(supplierData.region || '');
    setSettingsContractNumber(supplierData.contractNumber || '');
    setProdSmsPhone(supplierData.phone || '+998 ');
    if (supplierData.inn && supplierData.inn.replace(/\D/g, '').length === 9 && !supplierData.companyInfo) {
      handleSettingsStirLookup(supplierData.inn);
    }
  }, [supplierData.id, supplierData.companyName, supplierData.phone, supplierData.secondaryPhone, supplierData.inn]);

  const handleSettingsStirLookup = async (rawValue: string) => {
    const cleanStir = rawValue.replace(/\D/g, '').slice(0, 9);
    setSettingsStir(cleanStir);
    setSettingsStirError(null);

    if (cleanStir.length < 9) {
      setSettingsStirVerified(false);
      setSettingsCompanyInfo(null);
      return;
    }

    setSettingsStirLoading(true);
    try {
      const resp = await fetch(`/api/company/lookup?inn=${cleanStir}&t=${Date.now()}`, {
        cache: 'no-store',
      });
      const resJson = await resp.json();

      if (!resp.ok || !resJson.success || !resJson.data) {
        setSettingsStirError(
          resJson.error || "Ushbu STIR raqami bo‘yicha orginfo.uz va stat.uz reyestridan MChJ topilmadi."
        );
        setSettingsStirVerified(false);
        setSettingsCompanyInfo(null);
        return;
      }

      const comp: CompanyInfo = resJson.data;
      setSettingsCompanyInfo(comp);

      if (comp.status === 'liquidated') {
        setSettingsStirError(`«${comp.companyName}» faoliyati tugatilgan (Likvidatsiya).`);
        setSettingsStirVerified(false);
        return;
      }

      if (comp.companyName) {
        setSettingsCompanyName(comp.companyName);
      }

      if (comp.director) {
        const cleaned = String(comp.director).replace(/\s+/g, ' ').trim();
        const parts = cleaned.split(' ');
        if (parts.length >= 2) {
          setSettingsSurname(parts[0]);
          setSettingsName(parts[1]);
        } else if (parts.length === 1 && parts[0]) {
          setSettingsName(parts[0]);
        }
      }

      if (comp.phone) {
        const digits = String(comp.phone).replace(/\D/g, '');
        if (digits.length >= 9) {
          const d9 = digits.slice(-9);
          setSettingsPhone(`+998 ${d9.slice(0, 2)} ${d9.slice(2, 5)} ${d9.slice(5, 7)} ${d9.slice(7, 9)}`);
        }
      }

      const regionStr = comp.locality || [comp.region, comp.district].filter(Boolean).join(', ');
      if (regionStr) {
        setSettingsRegion(regionStr);
      }

      setSettingsStirVerified(true);
    } catch {
      setSettingsStirError("STIR ma'lumotlarini orginfo.uz va stat.uz serverlaridan olishda xatolik yuz berdi.");
      setSettingsStirVerified(false);
    } finally {
      setSettingsStirLoading(false);
    }
  };

  const handleSendSecondaryPhoneSms = () => {
    setSecondaryPhoneError(null);
    const cleanSec = (settingsSecondaryPhone || '').replace(/\D/g, '');
    const localSec = cleanSec.startsWith('998') ? cleanSec.slice(3) : cleanSec;
    if (localSec.length !== 9) {
      setSecondaryPhoneError("Qo‘shimcha telefon raqamini to‘liq 9 ta raqam bilan kiriting!");
      return;
    }
    const primaryPhone = (supplierData.phone || settingsPhone || '').trim();
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setSecondaryPhoneSmsCode(code);
    setSecondaryPhoneSmsSent(true);
    setSecondaryPhoneSmsInput('');
    setSecondaryPhoneSmsNotice(
      `Asosiy telefon raqamingizga (${primaryPhone}) qo‘shimcha raqamni tasdiqlash uchun SMS kod yuborildi: ${code}`
    );
  };

  const handleSaveSecondaryPhone = () => {
    setSecondaryPhoneError(null);
    if (!secondaryPhoneSmsSent) {
      setSecondaryPhoneError("Avval asosiy raqamingizga SMS tasdiqlash kodini yuboring!");
      return;
    }
    if (!secondaryPhoneSmsInput.trim() || secondaryPhoneSmsInput.trim() !== secondaryPhoneSmsCode) {
      setSecondaryPhoneError("SMS tasdiqlash kodi noto‘g‘ri kiritildi!");
      return;
    }
    const formattedSec = settingsSecondaryPhone.trim();
    const updatedSupplier: SupplierPartner = {
      ...supplierData,
      secondaryPhone: formattedSec,
    };
    setSupplierData(updatedSupplier);
    try {
      const saved = localStorage.getItem('bunkerstroy_suppliers');
      const list: SupplierPartner[] = saved ? JSON.parse(saved) : [];
      const nextList = list.map((s) =>
        s.id === supplierData.id ||
        (s.companyName || '').toLowerCase() === (supplierData.companyName || '').toLowerCase()
          ? updatedSupplier
          : s
      );
      localStorage.setItem('bunkerstroy_suppliers', JSON.stringify(nextList));
      window.dispatchEvent(new CustomEvent('bunkerstroy_suppliers_updated'));
      setDoc(doc(db, 'users', updatedSupplier.id), { secondaryPhone: formattedSec }, { merge: true }).catch(() => {});
    } catch {}
    setSecondaryPhoneSuccess(true);
    setSecondaryPhoneSmsSent(false);
    setSecondaryPhoneSmsCode('');
    setSecondaryPhoneSmsInput('');
    setSecondaryPhoneSmsNotice(null);
    setTimeout(() => setSecondaryPhoneSuccess(false), 3000);
  };

  const handleSendSettingsSms = () => {
    setSettingsError(null);
    const tLogin = settingsLogin.trim();
    if (!tLogin) {
      setSettingsError("Login bo‘sh bo‘lishi mumkin emas.");
      return;
    }
    const primaryPhone = (supplierData.phone || settingsPhone || '').trim();
    const cleanPhone = primaryPhone.replace(/\D/g, '');
    if (cleanPhone.length < 7) {
      setSettingsError("Asosiy telefon raqami mavjud emas!");
      return;
    }
    if (settingsPassword && settingsPassword !== settingsPasswordConfirm) {
      setSettingsError("Parolni tasdiqlash mos kelmadi.");
      return;
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setSettingsSmsCode(code);
    setSettingsSmsSent(true);
    setSettingsSmsInput('');
    setSettingsSmsNotice(`Asosiy telefon raqamingizga (${primaryPhone}) SMS tasdiqlash kodi yuborildi: ${code}`);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsError(null);

    const tLogin = settingsLogin.trim();
    if (!tLogin) {
      setSettingsError("Login bo‘sh bo‘lishi mumkin emas.");
      return;
    }

    if (settingsPassword && settingsPassword !== settingsPasswordConfirm) {
      setSettingsError("Parolni tasdiqlash mos kelmadi.");
      return;
    }

    if (!settingsSmsSent) {
      setSettingsError("Avval «Tasdiqlash kodini yuborish» tugmasini bosing!");
      return;
    }

    if (!settingsSmsInput.trim() || settingsSmsInput.trim() !== settingsSmsCode) {
      setSettingsError("SMS tasdiqlash kodi noto‘g‘ri kiritildi!");
      return;
    }

    const updatedSupplier: SupplierPartner = {
      ...supplierData,
      inn: settingsStir.trim() || supplierData.inn,
      companyInfo: settingsCompanyInfo || supplierData.companyInfo,
      login: tLogin,
      email: tLogin.includes('@') ? tLogin : `${tLogin}@bunkerstroy.uz`,
      password: settingsPassword ? settingsPassword.trim() : supplierData.password,
      companyName: settingsCompanyName.trim() || supplierData.companyName,
      name: settingsName.trim() || supplierData.name,
      surname: settingsSurname.trim() || supplierData.surname,
      phone: supplierData.phone || settingsPhone.trim(),
      secondaryPhone: supplierData.secondaryPhone,
      region: settingsRegion.trim() || supplierData.region,
      contractNumber: settingsContractNumber.trim() || supplierData.contractNumber,
    };
    setSupplierData(updatedSupplier);

    try {
      const saved = localStorage.getItem('bunkerstroy_suppliers');
      const list: SupplierPartner[] = saved ? JSON.parse(saved) : [];
      const exists = list.some(
        (s) =>
          s.id === supplierData.id ||
          (s.companyName || '').toLowerCase() === (supplierData.companyName || '').toLowerCase()
      );
      const nextList = exists
        ? list.map((s) =>
            s.id === supplierData.id ||
            (s.companyName || '').toLowerCase() === (supplierData.companyName || '').toLowerCase()
              ? updatedSupplier
              : s
          )
        : [updatedSupplier, ...list];
      try {
        localStorage.setItem('bunkerstroy_suppliers', JSON.stringify(nextList));
      } catch {
        const lightList = nextList.map((s) => ({ ...s, contractPdfData: undefined }));
        localStorage.setItem('bunkerstroy_suppliers', JSON.stringify(lightList));
      }
      window.dispatchEvent(new CustomEvent('bunkerstroy_suppliers_updated'));

      // Sync updated credentials to Firestore users collection
      setDoc(
        doc(db, 'users', updatedSupplier.id),
        {
          id: updatedSupplier.id,
          email: updatedSupplier.email || `${tLogin}@bunkerstroy.uz`,
          displayName: (updatedSupplier.companyName || updatedSupplier.name || 'Hamkor').slice(0, 120),
          role: 'supplier',
          login: tLogin,
          password: updatedSupplier.password,
          companyName: updatedSupplier.companyName,
          phone: updatedSupplier.phone,
          ...(updatedSupplier.secondaryPhone ? { secondaryPhone: updatedSupplier.secondaryPhone } : {}),
          region: updatedSupplier.region,
          contractNumber: updatedSupplier.contractNumber || '',
        },
        { merge: true }
      ).catch(() => {});

      // Add log
      const savedLogs = localStorage.getItem('bunkerstroy_logs');
      const logsList = savedLogs ? JSON.parse(savedLogs) : [];
      logsList.unshift({
        id: `log-${Date.now()}`,
        action: 'Kabinet sozlamalari SMS orqali yangilandi',
        actor: `${tLogin} (${updatedSupplier.companyName})`,
        category: 'auth_access',
        details: `«${updatedSupplier.companyName}» sozlamalari SMS tasdiqlash orqali muvaffaqiyatli yangilandi.`,
        timestamp: new Date().toISOString(),
        ip: '195.158.12.84',
        level: 'success',
      });
      localStorage.setItem('bunkerstroy_logs', JSON.stringify(logsList.slice(0, 100)));
    } catch {}

    setSettingsSuccess(true);
    setSettingsSmsSent(false);
    setSettingsSmsCode('');
    setSettingsSmsInput('');
    setSettingsSmsNotice(null);
    setTimeout(() => {
      setSettingsSuccess(false);
      setSettingsPassword('');
      setSettingsPasswordConfirm('');
    }, 2500);
  };

  const getSelectedProductSmsPhone = () => {
    if (prodSmsPhoneChoice === 'secondary' && supplierData.secondaryPhone && supplierData.secondaryPhone.trim()) {
      return supplierData.secondaryPhone.trim();
    }
    return (supplierData.phone || prodSmsPhone || '+998').trim();
  };

  const handleSendProductSms = () => {
    setProductConfirmError(null);
    const phoneToUse = getSelectedProductSmsPhone();
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setProdSmsCode(code);
    setProdSmsSent(true);
    setProdSmsInput('');
    setProdSmsNotice(`Tanlangan kabinet raqamiga (${phoneToUse}) SMS tasdiqlash kodi yuborildi: ${code}`);
  };

  // Handle Add / Edit Product Submit (supports multiple Mavjudligi variants & Online/Offline channel)
  const handleCreateProduct = (e: React.FormEvent, forcedChannel?: 'online' | 'offline') => {
    e.preventDefault();
    setProductConfirmError(null);

    const targetChannel = forcedChannel || addProductChannel || 'online';

    if (!newTitle.trim()) {
      setProductConfirmError("Mahsulot nomini kiriting!");
      return;
    }

    if (!newCategory.trim()) {
      setProductConfirmError("Mahsulot turini kiriting!");
      return;
    }

    if (newImages.length === 0) {
      setProductConfirmError("Mahsulot yuklaganda rasm kiritish majburiy! Iltimos, kamida 1 ta mahsulot suratini yuklang.");
      return;
    }

    const topBunkerPrice = Number(newPrice) || Number(newOriginalPrice) || 0;
    const topCrmPrice = Number(newOriginalPrice) || Number(newPrice) || 0;
    const topMinOrder = Math.max(1, Number(newMinOrder) || 1);

    const cleanedVariants: ProductVariant[] = draftVariants
      .map((dv, idx) => {
        const u = (dv.unit || newUnit || 'kg').trim();
        const uNum = dv.unitValues?.[u]?.trim() || '';
        const specStr = uNum ? `${uNum} ${u}` : (dv.specification || '').trim();
        const pBunker = Number(dv.price) || topBunkerPrice || Number(dv.originalPrice) || 0;
        const pOrig = Number(dv.originalPrice) || topCrmPrice || Number(dv.price) || pBunker || 0;
        return {
          id: dv.id || `var-${idx + 1}`,
          unit: u,
          colors: dv.colors && dv.colors.length > 0 ? dv.colors : selectedColors,
          specification: specStr,
          price: pBunker,
          originalPrice: pOrig,
          minOrder: topMinOrder || Math.max(1, Number(dv.minOrder) || 1),
        };
      })
      .filter((v) => v.unit && (v.price > 0 || v.originalPrice > 0));

    if (cleanedVariants.length === 0) {
      setProductConfirmError(
        "Mahsulot narxini (Bunker narxi yoki Mavjudlik narxi) hamda kamida 1 ta o‘lchov birligini kiriting!"
      );
      return;
    }

    // SMS tasdiqlash faqat yangi mahsulotni Bunkerga chiqarish (SMS kod yuborish) tugmasida talab qilinadi;
    // Mavjudlik saqlayotganda yoki mahsulotni tahrirlab saqlayotganda SMS tasdiqlash kerak emas
    const requiresSmsToPublish = !editingProduct && targetChannel === 'online';

    if (requiresSmsToPublish) {
      if (!prodSmsSent) {
        handleSendProductSms();
        return;
      }

      if (!prodSmsInput.trim() || prodSmsInput.trim() !== prodSmsCode) {
        setProductConfirmError("SMS tasdiqlash kodi noto‘g‘ri kiritildi!");
        return;
      }
    }

    const primaryVariant = cleanedVariants[0];
    const allMergedColors = Array.from(
      new Set([...selectedColors, ...cleanedVariants.flatMap((v) => v.colors || [])])
    );

    const mainImage = newImages[0];
    const isB2BCabinet = supplierData.cabinetType === 'manufacturer';
    const parsedStock =
      newStock !== '' && !isNaN(Number(newStock))
        ? Math.max(0, Math.floor(Number(newStock)))
        : editingProduct?.stock ?? 100;
    const parsedCostPrice = Number(newCostPrice) || editingProduct?.costPrice || 0;
    const prevInitialStock = editingProduct?.initialStock ?? editingProduct?.stock ?? parsedStock;
    const computedInitialStock = editingProduct ? Math.max(prevInitialStock, parsedStock) : parsedStock;

    const created: Product = {
      id: editingProduct ? editingProduct.id : `prod-${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory.trim() || 'Sement',
      price: primaryVariant.price,
      originalPrice: primaryVariant.originalPrice,
      costPrice: parsedCostPrice,
      initialStock: computedInitialStock,
      unit: primaryVariant.unit,
      saleChannel: targetChannel,
      variants: cleanedVariants.map((v) => ({
        ...v,
        costPrice: parsedCostPrice,
        minOrder: isB2BCabinet ? v.minOrder || 1 : 1,
      })),
      supplierId: supplierData.id,
      supplierInn: supplierData.inn,
      supplierName: supplierData.companyName,
      ...(!isB2BCabinet && newManufacturer.trim() && !isCabinetCompanyName(newManufacturer.trim())
        ? { manufacturerName: newManufacturer.trim() }
        : { manufacturerName: 'O‘zbekiston' }),
      supplierCabinetType: supplierData.cabinetType || 'partner',
      stock: parsedStock,
      minOrder: isB2BCabinet ? primaryVariant.minOrder || 1 : 1,
      image: mainImage,
      ...(newImages.length > 0 ? { images: newImages } : {}),
      ...((isB2BCabinet || supplierData.allowPromoVideo) && newVideoUrl.trim()
        ? { videoUrl: newVideoUrl.trim() }
        : {}),
      videoViews: editingProduct?.videoViews ?? 0,
      viewsCount: editingProduct?.viewsCount ?? 0,
      description: newDesc.trim(),
      region: supplierData.region || 'Toshkent shahri',
      ...(supplierData.district ? { district: supplierData.district } : {}),
      salesCount: editingProduct?.salesCount ?? 0,
      isEscoCertified: true,
      energyEfficiencyRating: 'A',
      repairType: 'universal',
      ...(allMergedColors.length > 0 ? { colors: allMergedColors } : {}),
      ...(detailBlocks.length > 0 ? { detailBlocks } : {}),
    };

    try {
      addProductType(created.category);
      if (!isB2BCabinet && newManufacturer.trim()) {
        setManufacturersList(addManufacturer(newManufacturer.trim()));
      }
      onAddProduct(created);
      setProductsSubTab(targetChannel);
    } catch (err) {
      console.error('Error saving product:', err);
    }

    // Saqlash bosilganda Mahsulot qo'shish/tahrirlash oynasi darhol yopilsin
    setIsAddProductOpen(false);
    setEditingProduct(null);
    setNewTitle('');
    setNewManufacturer('');
    setNewUnit('kg');
    setNewPrice('');
    setNewOriginalPrice('');
    setNewCostPrice('');
    setNewStock(100);
    setNewMinOrder(1);
    setNewDesc('');
    setDraftVariants([
      {
        id: 'var-1',
        unit: 'kg',
        unitValues: { Kv: '', metr: '', kg: '', dona: '' },
        colors: [],
        specification: '',
        price: '',
        originalPrice: '',
        minOrder: 1,
        isColorOpen: false,
        isCollapsed: false,
      },
    ]);
    setNewImages([]);
    setNewVideoUrl('');
    setDetailBlocks([]);
    setSelectedColors([]);
    setIsColorPaletteOpen(false);
    setProdSmsSent(false);
    setProdSmsCode('');
    setProdSmsInput('');
    setProdSmsNotice(null);
    setProductConfirmError(null);
  };

  // CRM Helpers (Variant-aware / Mavjudlikdagi mahsulotlar uchun ham)
  const getProductCrmPrice = (prod: Product) => {
    return typeof prod.originalPrice === 'number' && prod.originalPrice > 0 ? prod.originalPrice : prod.price;
  };

  const getProductVariantsList = (prod: Product): ProductVariant[] => {
    if (prod.variants && prod.variants.length > 0) return prod.variants;
    return [
      {
        id: 'default',
        unit: prod.unit || 'dona',
        colors: prod.colors || [],
        specification: `1 ${prod.unit || 'dona'}`,
        price: prod.price,
        originalPrice: getProductCrmPrice(prod),
        minOrder: prod.minOrder || 1,
      },
    ];
  };

  const resolveCrmBasketEntry = (entryKey: string) => {
    const [prodId, varIdxStr, colorStr] = String(entryKey).split('::');
    const prod = companyProducts.find((p) => p.id === prodId);
    if (!prod) return null;
    const variantsList = getProductVariantsList(prod);
    const vIdx = varIdxStr !== undefined && varIdxStr !== '' ? Number(varIdxStr) : 0;
    const chosenVariant = variantsList[vIdx] || variantsList[0];
    const unitSpec = chosenVariant?.specification
      ? chosenVariant.specification
      : `1 ${chosenVariant?.unit || prod.unit}`;
    const unitOnly = chosenVariant?.unit || prod.unit;
    const crmPrice = chosenVariant
      ? typeof chosenVariant.originalPrice === 'number' && chosenVariant.originalPrice > 0
        ? chosenVariant.originalPrice
        : chosenVariant.price || getProductCrmPrice(prod)
      : getProductCrmPrice(prod);
    const bunkerPrice = chosenVariant?.price || prod.price;
    const chosenColor =
      colorStr ||
      (chosenVariant?.colors && chosenVariant.colors.length > 0
        ? chosenVariant.colors[0]
        : prod.colors && prod.colors.length > 0
        ? prod.colors[0]
        : '');
    const showVariantTag =
      (prod.variants && prod.variants.length > 1) ||
      Boolean(chosenVariant?.specification) ||
      Boolean(chosenColor);
    const variantLabel = showVariantTag
      ? [chosenVariant?.specification || chosenVariant?.unit, chosenColor].filter(Boolean).join(' • ')
      : '';
    const displayTitle = variantLabel ? `${prod.title} (${variantLabel})` : prod.title;

    return {
      entryKey,
      prod,
      vIdx,
      chosenVariant,
      unitSpec,
      unitOnly,
      crmPrice,
      bunkerPrice,
      chosenColor,
      variantLabel,
      displayTitle,
    };
  };

  const getCrmEntryQty = (entryKey: string, prod?: Product) => {
    const q = crmQuantities[entryKey];
    if (typeof q === 'number' && q > 0) return q;
    return prod?.minOrder && prod.minOrder > 0 ? prod.minOrder : 1;
  };

  const getCrmQty = (prod: Product) => {
    return getCrmEntryQty(prod.id, prod);
  };

  const handleSetCrmQty = (entryKey: string, val: number) => {
    const [prodId] = String(entryKey).split('::');
    const matchedProd = companyProducts.find((p) => p.id === prodId);
    const maxAvail = matchedProd ? Math.max(0, Number(matchedProd.stock) || 0) : 999999;
    const requestedVal = Math.max(1, Math.floor(val || 1));

    // Calculate sum of other variant entries of the same product in this basket
    const otherEntriesQty = crmSelectedIds
      .filter((k) => k !== entryKey && String(k).split('::')[0] === prodId)
      .reduce((sum, k) => sum + (crmQuantities[k] || 1), 0);

    if (matchedProd && requestedVal + otherEntriesQty > maxAvail) {
      setCrmStockWarning(
        `«${matchedProd.title}» — Ombordagi miqdor yetarli emas! (Omborda mavjud: ${maxAvail} ${matchedProd.unit})`
      );
      setTimeout(() => setCrmStockWarning(null), 4000);
      const allowedForThis = Math.max(1, maxAvail - otherEntriesQty);
      setCrmQuantities((prev) => ({ ...prev, [entryKey]: allowedForThis }));
      return;
    }
    setCrmStockWarning(null);
    setCrmQuantities((prev) => ({ ...prev, [entryKey]: requestedVal }));
  };

  const handleAddVariantToCrmCart = (prod: Product, vIdx: number, colorOverride?: string) => {
    const availStock = prod.stock !== undefined && prod.stock !== null ? Number(prod.stock) : 999999;
    if (availStock <= 0) {
      setCrmStockWarning(`«${prod.title}» — Ombordagi miqdor yetarli emas! (Omborda mavjud: 0 ${prod.unit})`);
      setTimeout(() => setCrmStockWarning(null), 4000);
      return;
    }

    const variantsList = getProductVariantsList(prod);
    const chosenVar = variantsList[vIdx] || variantsList[0];
    const availColors =
      chosenVar.colors && chosenVar.colors.length > 0 ? chosenVar.colors : prod.colors || [];
    const chosenColor = colorOverride ?? crmColorSelection[prod.id] ?? (availColors[0] || '');
    const entryKey =
      variantsList.length > 1 || chosenColor || chosenVar.specification
        ? `${prod.id}::${vIdx}${chosenColor ? `::${chosenColor}` : ''}`
        : prod.id;

    // Total currently in basket for this product
    const currentProdTotalInCart = crmSelectedIds
      .filter((k) => String(k).split('::')[0] === prod.id)
      .reduce((sum, k) => sum + (crmQuantities[k] || 1), 0);

    if (!crmSelectedIds.includes(entryKey)) {
      if (currentProdTotalInCart + 1 > availStock) {
        setCrmStockWarning(
          `«${prod.title}» — Ombordagi miqdor yetarli emas! (Omborda mavjud: ${availStock} ${prod.unit})`
        );
        setTimeout(() => setCrmStockWarning(null), 4000);
        return;
      }
      setCrmSelectedIds((prev) => [...prev, entryKey]);
      setCrmQuantities((prev) => ({
        ...prev,
        [entryKey]: prev[entryKey] || 1,
      }));
    } else {
      handleSetCrmQty(entryKey, (crmQuantities[entryKey] || 1) + 1);
    }
  };

  const toggleCrmSelectProduct = (prod: Product) => {
    const selVIdx = crmVariantSelection[prod.id] ?? 0;
    handleAddVariantToCrmCart(prod, selVIdx);
  };

  const filteredCrmProducts = useMemo(() => {
    return companyProducts.filter((p) => {
      const matchesCat = crmCategoryFilter === 'all' || p.category === crmCategoryFilter;
      const q = crmSearchQuery.trim().toLowerCase();
      if (!q) return matchesCat;
      const inTitle = (p.title || '').toLowerCase().includes(q);
      const inCat = (p.category || '').toLowerCase().includes(q);
      const inUnit = (p.unit || '').toLowerCase().includes(q);
      const inDesc = (p.description || '').toLowerCase().includes(q);
      const inColors = (p.colors || []).some((c) => c.toLowerCase().includes(q));
      const inVariants = (p.variants || []).some(
        (v) =>
          (v.unit || '').toLowerCase().includes(q) ||
          (v.specification || '').toLowerCase().includes(q) ||
          (v.colors || []).some((c) => c.toLowerCase().includes(q))
      );
      return matchesCat && (inTitle || inCat || inUnit || inDesc || inColors || inVariants);
    });
  }, [companyProducts, crmSearchQuery, crmCategoryFilter]);

  const selectedCrmEntries = useMemo(() => {
    return crmSelectedIds
      .map((entryKey) => resolveCrmBasketEntry(entryKey))
      .filter((x): x is NonNullable<ReturnType<typeof resolveCrmBasketEntry>> => x !== null);
  }, [companyProducts, crmSelectedIds]);

  const selectedCrmProducts = useMemo(() => {
    return selectedCrmEntries.map((e) => e.prod);
  }, [selectedCrmEntries]);

  const crmCalculation = useMemo(() => {
    let totalOriginalSum = 0;
    let totalBunkerSum = 0;
    let totalUnits = 0;

    selectedCrmEntries.forEach((entry) => {
      const qty = getCrmEntryQty(entry.entryKey, entry.prod);
      totalOriginalSum += entry.crmPrice * qty;
      totalBunkerSum += entry.bunkerPrice * qty;
      totalUnits += qty;
    });

    const discountAmount = Math.round((totalOriginalSum * Math.min(100, Math.max(0, crmDiscountPercent))) / 100);
    const finalSum = Math.max(0, totalOriginalSum - discountAmount);

    return {
      totalOriginalSum,
      totalBunkerSum,
      totalUnits,
      discountAmount,
      finalSum,
    };
  }, [selectedCrmEntries, crmQuantities, crmDiscountPercent]);

  const handleCopyCrmSummary = () => {
    if (selectedCrmEntries.length === 0) return;
    const lines = [
      `HISOB-KITOB SMETASI (${supplierData.companyName} — ${activeCrmBasket.name})`,
      crmClientName ? `Mijoz: ${crmClientName} ${crmClientPhone ? `(${crmClientPhone})` : ''}` : null,
      `Sana: ${new Date().toLocaleDateString('uz-UZ')}`,
      `----------------------------------------`,
      ...selectedCrmEntries.map((entry, i) => {
        const qty = getCrmEntryQty(entry.entryKey, entry.prod);
        return `${i + 1}. ${entry.displayTitle} — ${qty} ${entry.unitSpec} x ${new Intl.NumberFormat('uz-UZ').format(entry.crmPrice)} so'm = ${new Intl.NumberFormat('uz-UZ').format(qty * entry.crmPrice)} so'm`;
      }),
      `----------------------------------------`,
      `Jami (Asl narxda): ${new Intl.NumberFormat('uz-UZ').format(crmCalculation.totalOriginalSum)} so'm`,
      crmDiscountPercent > 0 ? `Chegirma (${crmDiscountPercent}%): -${new Intl.NumberFormat('uz-UZ').format(crmCalculation.discountAmount)} so'm` : null,
      `YAKUNIY TO'LOV SUMMASI: ${new Intl.NumberFormat('uz-UZ').format(crmCalculation.finalSum)} so'm`,
    ].filter(Boolean).join('\n');

    navigator.clipboard?.writeText(lines);
    setCrmCopySuccess(true);
    setTimeout(() => setCrmCopySuccess(false), 2500);
  };

  const formatPrice = (p: number) => {
    return new Intl.NumberFormat('uz-UZ').format(p) + " so'm";
  };

  return (
    <div className="min-h-screen w-full bg-white text-white flex flex-col font-sans selection:bg-[#FFB800] selection:text-slate-950">
      {/* Header — Logotip ustiga 1 marta bosilganda Chiqish, 2 marta bosilganda Sozlamalar ochiladi; Tepada o'ngda CRM / CRM Chiqish tugmasi */}
      <header className="border-b-2 border-[#1E3A6D] bg-[#0A1931] px-4 sm:px-8 h-20 sm:h-24 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-3.5 sm:gap-4 select-none">
          <button
            type="button"
            onClick={(e) => handleLogoClick(e)}
            title="Logotip ustiga 1 marta bosish — Chiqish | 2 marta bosish — Sozlamalar"
            className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#FFB800] text-slate-950 border-2 border-[#FFB800] hover:bg-red-600 hover:text-white hover:border-red-400 hover:scale-105 active:scale-95 transition-all flex items-center justify-center font-black shadow-lg cursor-pointer shrink-0"
          >
            <Building className="w-6 h-6 sm:w-7 sm:h-7 pointer-events-none" />
            <span
              className="absolute -bottom-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#0A1931] text-[#FFB800] border border-[#FFB800] flex items-center justify-center shadow pointer-events-none"
            >
              <Settings className="w-3 h-3" />
            </span>
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-2xl font-black text-white leading-tight">
                {supplierData.companyName}
              </h1>
              <span className={`hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                supplierData.cabinetType === 'manufacturer'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
              }`}>
                {supplierData.cabinetType === 'manufacturer' ? 'B2B Kabineti' : 'B2C Kabineti'}
              </span>
              {supplierData.inn && (
                <span className="hidden md:inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black bg-[#071326] text-[#FFB800] border border-[#FFB800]/40">
                  STIR: {supplierData.inn}
                </span>
              )}
            </div>
            <p className="text-xs text-sky-200/80">
              {supplierData.cabinetType === 'manufacturer' ? 'B2B Kabineti' : 'B2C Kabineti'}
              {supplierData.inn ? ` • STIR: ${supplierData.inn}` : ''} • {supplierData.region}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={() => {
              if (activeTab === 'crm') {
                setActiveTab(prevNonCrmTab || 'reports');
              } else {
                setActiveTab('crm');
              }
            }}
            className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer border shadow-lg ${
              activeTab === 'crm'
                ? 'bg-red-600 hover:bg-red-700 text-white border-red-400 shadow-[0_0_16px_rgba(220,38,38,0.5)]'
                : 'bg-[#FFB800] hover:bg-red-600 text-[#0A1931] hover:text-white border-[#FFC928] hover:border-red-400'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>{activeTab === 'crm' ? 'CRM Chiqish' : 'CRM'}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${
                activeTab === 'crm' ? 'bg-white text-red-700' : 'bg-[#0A1931] text-[#FFB800]'
              }`}
            >
              {crmBaskets.length}
            </span>
          </button>

          {/* Mobil Menyuni ochish tugmasi */}
          {activeTab !== 'crm' && (
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2.5 rounded-xl bg-[#071326] hover:bg-[#0F2547] text-[#FFB800] border border-[#1E3A6D] hover:border-[#FFB800] transition-colors cursor-pointer"
              title="Bo‘limlar menyusi"
            >
              <Menu className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-col lg:flex-row items-start gap-6">

          {/* Mobile Backdrop & Slide Drawer */}
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
                    <h3 className="text-sm font-black text-[#FFB800] tracking-wider uppercase font-mono flex items-center gap-2">
                      <Layers className="w-4 h-4 text-[#FFB800]" />
                      <span>{supplierData.cabinetType === 'manufacturer' ? 'B2B Bo‘limlar' : 'B2C Bo‘limlar'}</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsMobileSidebarOpen(false)}
                      className="p-1.5 rounded-lg bg-[#071326] text-sky-200 hover:text-white border border-[#1E3A6D] cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {supplierData.cabinetType === 'manufacturer' ? (
                    /* B2B Kabineti uchun bo'limlar ketma-ketligi: 1. Hisobot, monitoring, 2. Mahsulotlar, 3. B2B Mijozlar (Amaliyotlar yo'q, CRM tepada) */
                    <nav className="flex flex-col gap-2.5">
                      {/* 1. Hisobot, monitoring */}
                      <button
                        type="button"
                        onClick={() => { setActiveTab('reports'); setIsMobileSidebarOpen(false); }}
                        className={`w-full flex items-center justify-between p-3.5 rounded-2xl text-xs sm:text-sm font-black transition-all text-left cursor-pointer border ${
                          activeTab === 'reports'
                            ? 'bg-red-600 text-white border-red-400 shadow-[0_0_16px_rgba(220,38,38,0.45)]'
                            : hasReportsAlert
                            ? 'bg-gradient-to-r from-amber-500/30 via-emerald-500/25 to-amber-500/30 text-amber-200 border-amber-400 shadow-[0_0_20px_rgba(255,184,0,0.55)] ring-1 ring-amber-400/50 animate-pulse'
                            : 'bg-[#071326] text-sky-100 hover:text-white hover:bg-[#0F2547] border-[#1E3A6D]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <BarChart3 className={`w-4 h-4 shrink-0 ${activeTab === 'reports' ? 'text-white' : 'text-[#FFB800]'}`} />
                          <span>Hisobot, monitoring</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                          activeTab === 'reports'
                            ? 'bg-white text-red-700 font-black'
                            : hasReportsAlert
                            ? 'bg-[#FFB800] text-slate-950 font-black shadow-[0_0_10px_rgba(255,184,0,0.8)]'
                            : 'bg-[#0F2547] text-sky-200'
                        }`}>
                          {supplierReport.sales.length}
                        </span>
                      </button>

                      {/* 2. Mahsulotlar */}
                      <button
                        type="button"
                        onClick={() => { setActiveTab('products'); setIsMobileSidebarOpen(false); }}
                        className={`w-full flex items-center justify-between p-3.5 rounded-2xl text-xs sm:text-sm font-black transition-all text-left cursor-pointer border ${
                          activeTab === 'products'
                            ? 'bg-red-600 text-white border-red-400 shadow-[0_0_16px_rgba(220,38,38,0.45)]'
                            : 'bg-[#071326] text-sky-100 hover:text-white hover:bg-[#0F2547] border-[#1E3A6D]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Package className={`w-4 h-4 shrink-0 ${activeTab === 'products' ? 'text-white' : 'text-[#FFB800]'}`} />
                          <span>Mahsulotlar</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                          activeTab === 'products' ? 'bg-white text-red-700 font-black' : 'bg-[#0F2547] text-sky-200'
                        }`}>
                          {companyProducts.length}
                        </span>
                      </button>

                      {/* 3. B2B Mijozlar */}
                      <button
                        type="button"
                        onClick={() => { setActiveTab('customers'); setIsMobileSidebarOpen(false); }}
                        className={`w-full flex items-center justify-between p-3.5 rounded-2xl text-xs sm:text-sm font-black transition-all text-left cursor-pointer border ${
                          activeTab === 'customers'
                            ? 'bg-red-600 text-white border-red-400 shadow-[0_0_16px_rgba(220,38,38,0.45)]'
                            : hasCustomersAlert || pendingIncomingB2bCount > 0
                            ? 'bg-gradient-to-r from-emerald-500/35 via-amber-500/35 to-emerald-500/35 text-white border-emerald-400 shadow-[0_0_24px_rgba(16,185,129,0.75)] ring-2 ring-emerald-400/60 animate-pulse'
                            : 'bg-[#071326] text-sky-100 hover:text-white hover:bg-[#0F2547] border-[#1E3A6D]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Users className={`w-4 h-4 shrink-0 ${
                            activeTab === 'customers'
                              ? 'text-white'
                              : hasCustomersAlert || pendingIncomingB2bCount > 0
                              ? 'text-emerald-300 drop-shadow-[0_0_8px_rgba(16,185,129,0.9)]'
                              : 'text-[#FFB800]'
                          }`} />
                          <span>B2B Mijozlar</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                          activeTab === 'customers'
                            ? 'bg-white text-red-700 font-black'
                            : hasCustomersAlert || pendingIncomingB2bCount > 0
                            ? 'bg-emerald-400 text-slate-950 font-black border border-white/60 shadow-[0_0_12px_rgba(16,185,129,0.9)]'
                            : 'bg-[#0F2547] text-sky-200'
                        }`}>
                          {supplierCustomers.length + incomingManufacturerB2bOrders.length}
                        </span>
                      </button>
                    </nav>
                  ) : (
                    /* B2C Kabinetidagi Bo'limlar: 1. Monitoring hisobot, 2. Mahsulot, 3. B2B Mahsulotlar (B2B Mijozlar kerak emas!) */
                    <nav className="flex flex-col gap-2.5">
                      {/* 1. Monitoring hisobot */}
                      <button
                        type="button"
                        onClick={() => { setActiveTab('reports'); setIsMobileSidebarOpen(false); }}
                        className={`w-full flex items-center justify-between p-3.5 rounded-2xl text-xs sm:text-sm font-black transition-all text-left cursor-pointer border ${
                          activeTab === 'reports'
                            ? 'bg-red-600 text-white border-red-400 shadow-[0_0_16px_rgba(220,38,38,0.45)]'
                            : hasReportsAlert
                            ? 'bg-gradient-to-r from-amber-500/30 via-emerald-500/25 to-amber-500/30 text-amber-200 border-amber-400 shadow-[0_0_20px_rgba(255,184,0,0.55)] ring-1 ring-amber-400/50 animate-pulse'
                            : 'bg-[#071326] text-sky-100 hover:text-white hover:bg-[#0F2547] border-[#1E3A6D]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <BarChart3 className={`w-4 h-4 shrink-0 ${activeTab === 'reports' ? 'text-white' : 'text-[#FFB800]'}`} />
                          <span>Monitoring hisobot</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                          activeTab === 'reports'
                            ? 'bg-white text-red-700 font-black'
                            : hasReportsAlert
                            ? 'bg-[#FFB800] text-slate-950 font-black shadow-[0_0_10px_rgba(255,184,0,0.8)]'
                            : 'bg-[#0F2547] text-sky-200'
                        }`}>
                          {supplierReport.sales.length}
                        </span>
                      </button>

                      {/* 2. Mahsulot */}
                      <button
                        type="button"
                        onClick={() => { setActiveTab('products'); setIsMobileSidebarOpen(false); }}
                        className={`w-full flex items-center justify-between p-3.5 rounded-2xl text-xs sm:text-sm font-black transition-all text-left cursor-pointer border ${
                          activeTab === 'products'
                            ? 'bg-red-600 text-white border-red-400 shadow-[0_0_16px_rgba(220,38,38,0.45)]'
                            : companyProducts.some((p) => (p.stock ?? 0) <= 0)
                            ? 'bg-[#133268] text-white border-sky-400 shadow-[0_0_16px_rgba(56,189,248,0.5)] animate-pulse'
                            : 'bg-[#071326] text-sky-100 hover:text-white hover:bg-[#0F2547] border-[#1E3A6D]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Package className={`w-4 h-4 shrink-0 ${activeTab === 'products' ? 'text-white' : 'text-[#FFB800]'}`} />
                          <span>Mahsulot</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                          activeTab === 'products' ? 'bg-white text-red-700 font-black' : 'bg-[#0F2547] text-sky-200'
                        }`}>
                          {companyProducts.length}
                        </span>
                      </button>

                      {/* 3. B2B Mahsulotlar */}
                      <button
                        type="button"
                        onClick={() => { setActiveTab('b2b_manufacturers'); setIsMobileSidebarOpen(false); }}
                        className={`w-full flex items-center justify-between p-3.5 rounded-2xl text-xs sm:text-sm font-black transition-all text-left cursor-pointer border ${
                          activeTab === 'b2b_manufacturers'
                            ? 'bg-red-600 text-white border-red-400 shadow-[0_0_16px_rgba(220,38,38,0.45)]'
                            : awaitingPaymentB2bCount > 0
                            ? 'bg-gradient-to-r from-amber-500/35 via-emerald-500/35 to-amber-500/35 text-white border-amber-400 shadow-[0_0_24px_rgba(255,184,0,0.75)] ring-2 ring-amber-400/60 animate-pulse'
                            : 'bg-[#071326] text-sky-100 hover:text-white hover:bg-[#0F2547] border-[#1E3A6D]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Building className={`w-4 h-4 shrink-0 ${activeTab === 'b2b_manufacturers' ? 'text-white' : 'text-amber-400'}`} />
                          <span>B2B Mahsulotlar</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                          activeTab === 'b2b_manufacturers'
                            ? 'bg-white text-red-700 font-black'
                            : awaitingPaymentB2bCount > 0
                            ? 'bg-emerald-400 text-slate-950 font-black'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          {awaitingPaymentB2bCount > 0 ? `! ${awaitingPaymentB2bCount}` : manufacturerProducts.length}
                        </span>
                      </button>
                    </nav>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              YON TARAFI: BO'LIMLARNI YIG'ILADIGAN (COLLAPSIBLE) YON MENYUSI (CRM da yashiriladi — Fullscreen CRM)
              ========================================================================= */}
          {activeTab !== 'crm' && (
          <aside className={`transition-all duration-300 shrink-0 ${isSidebarCollapsed ? 'w-full lg:w-20' : 'w-full lg:w-72'} lg:sticky lg:top-6 z-10`}>
            <div className="bg-[#0A1931] border-2 border-[#1E3A6D] rounded-3xl p-3.5 sm:p-4 shadow-2xl space-y-3">
              {/* Yon menyuni yig'ish va ochish sarlavhasi */}
              <div
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="pb-3 border-b border-[#1E3A6D] flex items-center justify-between cursor-pointer group select-none hover:opacity-90 transition-opacity"
                title={isSidebarCollapsed ? "Bo‘limlarni kengaytirish" : "Bo‘limlarni yon tarafga yig‘ish"}
              >
                {!isSidebarCollapsed && (
                  <h3 className="text-xs sm:text-sm font-black text-[#FFB800] tracking-wider uppercase font-mono flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#FFB800]" />
                    <span>{supplierData.cabinetType === 'manufacturer' ? 'B2B Bo‘limlari' : 'B2C Bo‘limlari'}</span>
                  </h3>
                )}
                <div className={`p-2 rounded-xl bg-[#071326] group-hover:bg-[#0F2547] text-[#FFB800] border border-[#1E3A6D] group-hover:border-[#FFB800] transition-colors ${isSidebarCollapsed ? 'mx-auto' : 'ml-auto'}`}>
                  {isSidebarCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
                </div>
              </div>

              {supplierData.cabinetType === 'manufacturer' ? (
                /* B2B Kabineti uchun bo'limlar ketma-ketligi: 1. Hisobot, monitoring, 2. Mahsulotlar, 3. B2B Mijozlar (Amaliyotlar yo'q, CRM tepada) */
                <nav className="flex flex-col gap-2.5">
                  {/* 1. Hisobot, monitoring */}
                  <button
                    type="button"
                    onClick={() => setActiveTab('reports')}
                    title="Hisobot, monitoring"
                    className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-3.5' : 'justify-between px-4 py-3.5'} rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer border ${
                      activeTab === 'reports'
                        ? 'bg-red-600 text-white border-red-400 shadow-[0_0_16px_rgba(220,38,38,0.45)]'
                        : hasReportsAlert
                        ? 'bg-gradient-to-r from-amber-500/30 via-emerald-500/25 to-amber-500/30 text-amber-200 border-amber-400 shadow-[0_0_20px_rgba(255,184,0,0.55)] ring-1 ring-amber-400/50 animate-pulse'
                        : 'bg-[#071326] text-sky-100 hover:text-white hover:bg-[#0F2547] border-[#1E3A6D]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <BarChart3 className={`w-4 h-4 shrink-0 ${activeTab === 'reports' ? 'text-white' : 'text-[#FFB800]'}`} />
                      {!isSidebarCollapsed && <span>Hisobot, monitoring</span>}
                    </div>
                    {!isSidebarCollapsed && (
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        activeTab === 'reports'
                          ? 'bg-white text-red-700 font-black'
                          : hasReportsAlert
                          ? 'bg-[#FFB800] text-slate-950 font-black shadow-[0_0_10px_rgba(255,184,0,0.8)]'
                          : 'bg-[#0F2547] text-sky-200'
                      }`}>
                        {supplierReport.sales.length}
                      </span>
                    )}
                  </button>

                  {/* 2. Mahsulotlar */}
                  <button
                    type="button"
                    onClick={() => setActiveTab('products')}
                    title="Mahsulotlar"
                    className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-3.5' : 'justify-between px-4 py-3.5'} rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer border ${
                      activeTab === 'products'
                        ? 'bg-red-600 text-white border-red-400 shadow-[0_0_16px_rgba(220,38,38,0.45)]'
                        : companyProducts.some((p) => (p.stock ?? 0) <= 0)
                        ? 'bg-[#133268] text-white border-sky-400 shadow-[0_0_16px_rgba(56,189,248,0.5)] animate-pulse'
                        : 'bg-[#071326] text-sky-100 hover:text-white hover:bg-[#0F2547] border-[#1E3A6D]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Package className={`w-4 h-4 shrink-0 ${activeTab === 'products' ? 'text-white' : 'text-[#FFB800]'}`} />
                      {!isSidebarCollapsed && <span>Mahsulotlar</span>}
                    </div>
                    {!isSidebarCollapsed && (
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        activeTab === 'products' ? 'bg-white text-red-700 font-black' : 'bg-[#0F2547] text-sky-200'
                      }`}>
                        {companyProducts.length}
                      </span>
                    )}
                  </button>

                  {/* 3. B2B Mijozlar */}
                  <button
                    type="button"
                    onClick={() => setActiveTab('customers')}
                    title="B2B Mijozlar"
                    className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-3.5' : 'justify-between px-4 py-3.5'} rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer border ${
                      activeTab === 'customers'
                        ? 'bg-red-600 text-white border-red-400 shadow-[0_0_16px_rgba(220,38,38,0.45)]'
                        : hasCustomersAlert || pendingIncomingB2bCount > 0
                        ? 'bg-gradient-to-r from-emerald-500/35 via-amber-500/35 to-emerald-500/35 text-white border-emerald-400 shadow-[0_0_24px_rgba(16,185,129,0.75)] ring-2 ring-emerald-400/60 animate-pulse'
                        : 'bg-[#071326] text-sky-100 hover:text-white hover:bg-[#0F2547] border-[#1E3A6D]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Users className={`w-4 h-4 shrink-0 ${
                        activeTab === 'customers'
                          ? 'text-white'
                          : hasCustomersAlert || pendingIncomingB2bCount > 0
                          ? 'text-emerald-300 drop-shadow-[0_0_8px_rgba(16,185,129,0.9)]'
                          : 'text-[#FFB800]'
                      }`} />
                      {!isSidebarCollapsed && <span>B2B Mijozlar</span>}
                    </div>
                    {!isSidebarCollapsed && (
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        activeTab === 'customers'
                          ? 'bg-white text-red-700 font-black'
                          : hasCustomersAlert || pendingIncomingB2bCount > 0
                          ? 'bg-emerald-400 text-slate-950 font-black border border-white/60 shadow-[0_0_12px_rgba(16,185,129,0.9)]'
                          : 'bg-[#0F2547] text-sky-200'
                      }`}>
                        {supplierCustomers.length + incomingManufacturerB2bOrders.length}
                      </span>
                    )}
                  </button>
                </nav>
              ) : (
                /* B2C Kabinetidagi Bo'limlar: 1. Monitoring hisobot, 2. Mahsulot, 3. B2B Mahsulotlar (B2B Mijozlar kerak emas!) */
                <nav className="flex flex-col gap-2.5">
                  {/* 1. Monitoring hisobot */}
                  <button
                    type="button"
                    onClick={() => setActiveTab('reports')}
                    title="Monitoring hisobot"
                    className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-3.5' : 'justify-between px-4 py-3.5'} rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer border ${
                      activeTab === 'reports'
                        ? 'bg-red-600 text-white border-red-400 shadow-[0_0_16px_rgba(220,38,38,0.45)]'
                        : hasReportsAlert
                        ? 'bg-gradient-to-r from-amber-500/30 via-emerald-500/25 to-amber-500/30 text-amber-200 border-amber-400 shadow-[0_0_20px_rgba(255,184,0,0.55)] ring-1 ring-amber-400/50 animate-pulse'
                        : 'bg-[#071326] text-sky-100 hover:text-white hover:bg-[#0F2547] border-[#1E3A6D]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <BarChart3 className={`w-4 h-4 shrink-0 ${activeTab === 'reports' ? 'text-white' : 'text-[#FFB800]'}`} />
                      {!isSidebarCollapsed && <span>Monitoring hisobot</span>}
                    </div>
                    {!isSidebarCollapsed && (
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        activeTab === 'reports'
                          ? 'bg-white text-red-700 font-black'
                          : hasReportsAlert
                          ? 'bg-[#FFB800] text-slate-950 font-black shadow-[0_0_10px_rgba(255,184,0,0.8)]'
                          : 'bg-[#0F2547] text-sky-200'
                      }`}>
                        {supplierReport.sales.length}
                      </span>
                    )}
                  </button>

                  {/* 2. Mahsulot */}
                  <button
                    type="button"
                    onClick={() => setActiveTab('products')}
                    title="Mahsulot"
                    className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-3.5' : 'justify-between px-4 py-3.5'} rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer border ${
                      activeTab === 'products'
                        ? 'bg-red-600 text-white border-red-400 shadow-[0_0_16px_rgba(220,38,38,0.45)]'
                        : companyProducts.some((p) => (p.stock ?? 0) <= 0)
                        ? 'bg-[#133268] text-white border-sky-400 shadow-[0_0_16px_rgba(56,189,248,0.5)] animate-pulse'
                        : 'bg-[#071326] text-sky-100 hover:text-white hover:bg-[#0F2547] border-[#1E3A6D]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Package className={`w-4 h-4 shrink-0 ${activeTab === 'products' ? 'text-white' : 'text-[#FFB800]'}`} />
                      {!isSidebarCollapsed && <span>Mahsulot</span>}
                    </div>
                    {!isSidebarCollapsed && (
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        activeTab === 'products' ? 'bg-white text-red-700 font-black' : 'bg-[#0F2547] text-sky-200'
                      }`}>
                        {companyProducts.length}
                      </span>
                    )}
                  </button>

                  {/* 3. B2B Mahsulotlar */}
                  <button
                    type="button"
                    onClick={() => setActiveTab('b2b_manufacturers')}
                    title="B2B Mahsulotlar — Zavodlar bilan savdo"
                    className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-3.5' : 'justify-between px-4 py-3.5'} rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer border ${
                      activeTab === 'b2b_manufacturers'
                        ? 'bg-red-600 text-white border-red-400 shadow-[0_0_16px_rgba(220,38,38,0.45)]'
                        : awaitingPaymentB2bCount > 0
                        ? 'bg-gradient-to-r from-amber-500/35 via-emerald-500/35 to-amber-500/35 text-white border-amber-400 shadow-[0_0_24px_rgba(255,184,0,0.75)] ring-2 ring-amber-400/60 animate-pulse'
                        : 'bg-[#071326] text-sky-100 hover:text-white hover:bg-[#0F2547] border-[#1E3A6D]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Building className={`w-4 h-4 shrink-0 ${activeTab === 'b2b_manufacturers' ? 'text-white' : 'text-amber-400'}`} />
                      {!isSidebarCollapsed && <span className="text-left leading-tight">B2B Mahsulotlar</span>}
                    </div>
                    {!isSidebarCollapsed && (
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        activeTab === 'b2b_manufacturers'
                          ? 'bg-white text-red-700 font-black'
                          : awaitingPaymentB2bCount > 0
                          ? 'bg-emerald-400 text-slate-950 font-black'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {awaitingPaymentB2bCount > 0 ? `! ${awaitingPaymentB2bCount}` : manufacturerProducts.length}
                      </span>
                    )}
                  </button>
                </nav>
              )}
            </div>
          </aside>
          )}

          {/* O'NG TARAF: ASOSIY ISHCHI OYNA */}
          <div className="flex-1 min-w-0 w-full space-y-6">

            {/* BILDIRISHNOMA ALERT BANNERI (Onlayn savdo So'rovi — faqat B2B kabinetda) */}
            {supplierData.cabinetType === 'manufacturer' && hasCustomersAlert && (
              <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-emerald-950/90 via-slate-950 to-amber-950/90 border-2 border-emerald-400 shadow-[0_0_28px_rgba(16,185,129,0.45)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/25 border border-emerald-400 flex items-center justify-center text-emerald-300 shrink-0 animate-bounce">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-black text-white flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-400 text-slate-950 text-[10px] font-mono uppercase">
                        Onlayn savdo So‘rovi
                      </span>
                      <span>
                        {pendingCustomersCount > 0
                          ? `B2B Mijozlar bo‘limida ${pendingCustomersCount} ta yangi onlayn savdo so‘rovi qabul qilishni kutmoqda!`
                          : `${loadingCustomersCount} ta buyurtma yuklash jarayonida — yetkazib beruvchi telefon raqamini tasdiqlang!`}
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-200/90 mt-0.5">
                      Buyurtmani qabul qilib, tasdiqlash orqali yetkazib beruvchi telefon raqamini kiriting — raqam mijoz kabinetida ham darhol ko‘rinadi.
                    </p>
                  </div>
                </div>
                {activeTab !== 'customers' && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('customers')}
                    className="px-4 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs cursor-pointer shrink-0 shadow-lg active:scale-95 transition-all"
                  >
                    Onlayn savdo So‘rovini ko‘rish →
                  </button>
                )}
              </div>
            )}

            {/* B2C KABINETIDAN B2B KABINETGA KELGAN YANGI SO'ROV BANNERI -> B2B buyurtmalar bo'limiga o'tkazadi */}
            {supplierData.cabinetType === 'manufacturer' && pendingIncomingB2bCount > 0 && (
              <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-950/90 via-slate-950 to-emerald-950/90 border-2 border-[#FFB800] shadow-[0_0_28px_rgba(255,184,0,0.45)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#FFB800]/25 border border-[#FFB800] flex items-center justify-center text-[#FFB800] shrink-0 animate-bounce">
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-black text-white flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-full bg-[#FFB800] text-slate-950 text-[10px] font-mono uppercase">
                        Yangi B2B So‘rov
                      </span>
                      <span>
                        B2C kabinetidan {pendingIncomingB2bCount} ta yangi ulgurji buyurtma so‘rovi «B2B buyurtmalar» bo‘limiga kelib tushdi!
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-200/90 mt-0.5">
                      «B2B buyurtmalar» bo‘limiga o‘tib, ta'minotchi korxona ma'lumotlari va yuk ro‘yxati PDF hujjatini ko‘rib tasdiqlang.
                    </p>
                  </div>
                </div>
                {activeTab !== 'b2b_orders' && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('b2b_orders')}
                    className="px-4 py-2.5 rounded-xl bg-[#FFB800] hover:bg-[#FFC928] text-slate-950 font-black text-xs cursor-pointer shrink-0 shadow-lg active:scale-95 transition-all"
                  >
                    B2B buyurtmalar bo‘limiga o‘tish →
                  </button>
                )}
              </div>
            )}

            {/* B2B TO'LOV BILDIRISHNOMASI BANNERI (Zavod tasdiqlaganda sotib olayotgan B2C ta'minotchiga keladi) */}
            {supplierData.cabinetType !== 'manufacturer' && awaitingPaymentB2bCount > 0 && (
              <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-950/90 via-slate-950 to-emerald-950/90 border-2 border-[#FFB800] shadow-[0_0_28px_rgba(255,184,0,0.45)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#FFB800]/25 border border-[#FFB800] flex items-center justify-center text-[#FFB800] shrink-0 animate-bounce">
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-black text-white flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-full bg-[#FFB800] text-slate-950 text-[10px] font-mono uppercase">
                        B2B Zavod Tasdig‘i
                      </span>
                      <span>
                        Sizning {awaitingPaymentB2bCount} ta B2B so‘rovingiz Zavod tomonidan tasdiqlandi! Pulni hisobga o‘tkazishingiz so‘raladi.
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-200/90 mt-0.5">
                      B2B bo‘limida «Pulni hisobga o‘tkazish» tugmasini bosing — to‘lov zavod hisobiga o‘tkaziladi va yuk manzilingizga jo‘natiladi.
                    </p>
                  </div>
                </div>
                {activeTab !== 'b2b_manufacturers' && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('b2b_manufacturers')}
                    className="px-4 py-2.5 rounded-xl bg-[#FFB800] hover:bg-[#FFC928] text-slate-950 font-black text-xs cursor-pointer shrink-0 shadow-lg active:scale-95 transition-all"
                  >
                    B2B Bo‘limiga o‘tish →
                  </button>
                )}
              </div>
            )}

        {/* Tab 2: Mahsulotlar (Products) — Tyomniy Siniy Jadval asosida */}
        {activeTab === 'products' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-[#0A1931] border-2 border-[#1E3A6D] rounded-3xl p-4 sm:p-5 space-y-4 shadow-2xl">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-[#FFB800]/20 text-[#FFB800] border border-[#FFB800]/40">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-white tracking-wide">
                      Korxona Mahsulotlari Katalogi
                    </h3>
                    <p className="text-xs text-sky-200">
                      Onlayn Bunker ({onlineCompanyProducts.length} ta) • Oflayn mahsulotlar ({offlineCompanyProducts.length} ta)
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleOpenAddProductModal('products', productsSubTab)}
                    className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-[#FFB800] hover:bg-[#FFC928] text-slate-950 font-black text-xs sm:text-sm shadow-xl cursor-pointer active:scale-95 transition-all"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>Yangi Mahsulot Qo‘shish ({productsSubTab === 'online' ? 'Onlayn Bunker' : 'Oflayn'})</span>
                  </button>
                </div>
              </div>

              {/* MAHSULOTLAR BO'LIMI 2 GA AJRATILGAN: 1) Onlayn Bunker, 2) Oflayn mahsulotlar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#1E3A6D]">
                <button
                  type="button"
                  onClick={() => setProductsSubTab('online')}
                  className={`p-3.5 rounded-2xl border font-black text-xs sm:text-sm flex items-center justify-between cursor-pointer transition-all ${
                    productsSubTab === 'online'
                      ? 'bg-red-600 text-white border-red-400 shadow-[0_0_16px_rgba(220,38,38,0.45)]'
                      : 'bg-[#071326] hover:bg-[#0F2547] text-sky-100 border-[#1E3A6D]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Globe className={`w-4 h-4 ${productsSubTab === 'online' ? 'text-white' : 'text-[#FFB800]'}`} />
                    <span>1. Onlayn Bunker</span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-black ${
                    productsSubTab === 'online' ? 'bg-white text-red-700' : 'bg-[#0F2547] text-amber-400'
                  }`}>
                    {onlineCompanyProducts.length} ta
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setProductsSubTab('offline')}
                  className={`p-3.5 rounded-2xl border font-black text-xs sm:text-sm flex items-center justify-between cursor-pointer transition-all ${
                    productsSubTab === 'offline'
                      ? 'bg-red-600 text-white border-red-400 shadow-[0_0_16px_rgba(220,38,38,0.45)]'
                      : 'bg-[#071326] hover:bg-[#0F2547] text-sky-100 border-[#1E3A6D]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Store className={`w-4 h-4 ${productsSubTab === 'offline' ? 'text-white' : 'text-emerald-400'}`} />
                    <span>2. Oflayn mahsulotlar</span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-black ${
                    productsSubTab === 'offline' ? 'bg-white text-red-700' : 'bg-[#0F2547] text-emerald-400'
                  }`}>
                    {offlineCompanyProducts.length} ta
                  </span>
                </button>
              </div>
            </div>

            {/* TYOMNIY SINIY JADVAL ASOSIDAGI MAHSULOTLAR RO'YXATI */}
            {displayedCompanyProducts.length > 0 && (
              <div className="bg-[#0A1931] border-2 border-[#1E3A6D] rounded-3xl overflow-hidden shadow-[0_14px_35px_rgba(10,25,49,0.35)]">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs text-white">
                    <thead className="bg-[#071326] text-[#FFB800] uppercase text-[11px] font-mono tracking-wider border-b-2 border-[#1E3A6D]">
                      <tr>
                        <th className="py-4 px-4 font-black w-14 text-center border-r border-[#1E3A6D]">№</th>
                        <th className="py-4 px-4 font-black border-r border-[#1E3A6D]">Mahsulot nomi</th>
                        <th className="py-4 px-4 font-black border-r border-[#1E3A6D]">Omborda mavjudligi</th>
                        <th className="py-4 px-4 font-black border-r border-[#1E3A6D]">Xususiyatlari</th>
                        <th className="py-4 px-4 font-black border-r border-[#1E3A6D]">Bunker narxi</th>
                        <th className="py-4 px-4 font-black border-r border-[#1E3A6D]">CRM narxi</th>
                        <th className="py-4 px-4 font-black text-center">Tahrirlash</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1E3A6D]">
                      {displayedCompanyProducts.map((prod, idx) => {
                        const crmPrice = getProductCrmPrice(prod);
                        const stockQty = prod.stock !== undefined && prod.stock !== null ? Number(prod.stock) : 999999;
                        const isOutOfStock = stockQty <= 0;
                        return (
                          <tr
                            key={prod.id}
                            className={`${
                              isOutOfStock
                                ? 'bg-[#133268] animate-pulse'
                                : idx % 2 === 0
                                ? 'bg-[#0A1931]'
                                : 'bg-[#0D2142]'
                            } hover:bg-[#132C54] transition-colors`}
                          >
                            {/* 1. № */}
                            <td className="py-4 px-4 font-mono font-black text-sm text-[#FFB800] text-center border-r border-[#1E3A6D]">
                              {idx + 1}
                            </td>

                            {/* 2. Mahsulot nomi */}
                            <td className="py-4 px-4 border-r border-[#1E3A6D] min-w-[210px]">
                              <div className="flex items-center gap-3.5">
                                <div className="relative w-14 h-14 rounded-2xl bg-[#071326] border border-[#1E3A6D] overflow-hidden shrink-0 shadow-md">
                                  <img
                                    src={prod.image}
                                    alt={prod.title}
                                    className="w-full h-full object-cover"
                                  />
                                  {prod.images && prod.images.length > 1 && (
                                    <span className="absolute bottom-1 right-1 bg-[#071326]/90 text-[#FFB800] text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border border-[#1E3A6D]">
                                      +{prod.images.length}
                                    </span>
                                  )}
                                </div>
                                <div className="min-w-0 space-y-1">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#FFB800]/15 text-[#FFB800] border border-[#FFB800]/35">
                                      {prod.category}
                                    </span>
                                    {prod.videoUrl && (
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-500/15 text-red-400 border border-red-500/30">
                                        Video
                                      </span>
                                    )}
                                  </div>
                                  <div className="font-black text-sm sm:text-base text-white">
                                    {prod.title}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* 3. Omborda mavjudligi (Ombordagi miqdor + O'lchov birligi va Mavjud variantlar — bosilganda ko'rsatiladi) */}
                            <td className="py-4 px-4 border-r border-[#1E3A6D] min-w-[220px]">
                              <div className="space-y-2">
                                <div className="font-mono font-black text-xs text-sky-200">
                                  {isOutOfStock
                                    ? `Vaqtincha tugagan (0 ${prod.unit})`
                                    : `Omborda: ${prod.stock ?? 0} ${prod.unit}`}
                                </div>

                                <div className="flex flex-wrap items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setExpandedProductVariantIds((prev) => ({
                                        ...prev,
                                        [prod.id]: !prev[prod.id],
                                      }))
                                    }
                                    className="px-2.5 py-1 rounded-lg bg-[#071326] hover:bg-[#0F2547] border border-[#FFB800]/50 font-mono font-black text-[#FFB800] text-xs flex items-center gap-1.5 cursor-pointer transition-all"
                                  >
                                    <span>
                                      Mavjud variantlar ({getProductVariantsList(prod).length} ta)
                                    </span>
                                    <span className="text-[10px]">
                                      {expandedProductVariantIds[prod.id] ? '▲' : '▼'}
                                    </span>
                                  </button>
                                </div>

                                {expandedProductVariantIds[prod.id] && (
                                  <div className="p-2.5 rounded-xl bg-[#071326] border border-[#1E3A6D] space-y-1.5 animate-fadeIn">
                                    {getProductVariantsList(prod).map((v, vIdx) => {
                                      const vSpec = v.specification ? v.specification : `1 ${v.unit}`;
                                      const vCrmP =
                                        typeof v.originalPrice === 'number' && v.originalPrice > 0
                                          ? v.originalPrice
                                          : v.price || crmPrice;
                                      return (
                                        <div
                                          key={v.id || vIdx}
                                          className="p-2 rounded-lg bg-[#0A1931] border border-[#1E3A6D] flex flex-col gap-1 text-[11px]"
                                        >
                                          <div className="flex items-center justify-between gap-2">
                                            <span className="font-mono font-black text-[#FFB800]">
                                              #{vIdx + 1}: {vSpec}
                                            </span>
                                            <span className="font-mono font-bold text-emerald-300">
                                              {formatPrice(v.price || prod.price)} (CRM: {formatPrice(vCrmP)})
                                            </span>
                                          </div>
                                          {v.colors && v.colors.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                              {v.colors.map((c) => {
                                                const colStyle = getColorPaletteItem(c);
                                                return (
                                                  <span
                                                    key={c}
                                                    className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded border border-white/20"
                                                    style={{ backgroundColor: colStyle.bg, color: colStyle.text }}
                                                  >
                                                    {c}
                                                  </span>
                                                );
                                              })}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}

                                {prod.colors && prod.colors.length > 0 ? (
                                  <div className="flex flex-wrap gap-1.5">
                                    {prod.colors.map((c) => {
                                      const colStyle = getColorPaletteItem(c);
                                      return (
                                        <span
                                          key={c}
                                          className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border border-white/25 shadow-sm"
                                          style={{ backgroundColor: colStyle.bg, color: colStyle.text }}
                                        >
                                          <span
                                            className="w-2 h-2 rounded-full border border-current/40 shrink-0"
                                            style={{ backgroundColor: colStyle.bg }}
                                          />
                                          <span>{c}</span>
                                        </span>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div className="text-[11px] text-sky-300/70 font-mono">
                                    Standart
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* 4. Xususiyatlari */}
                            <td className="py-4 px-4 border-r border-[#1E3A6D] min-w-[200px]">
                              <div className="space-y-1 text-xs text-sky-100">
                                {supplierData.cabinetType === 'manufacturer' ? (
                                  <div>
                                    <span className="text-sky-300 font-bold">Min. buyurtma:</span>{' '}
                                    <span className="font-mono font-black text-white">
                                      {prod.minOrder || 1} {prod.unit}
                                    </span>
                                  </div>
                                ) : (
                                  <div>
                                    <span className="text-sky-300 font-bold">Asl (keltirilgan) narxi:</span>{' '}
                                    <span className="font-mono font-black text-amber-300">
                                      {prod.costPrice ? formatPrice(prod.costPrice) : 'Kiritilmagan'}
                                    </span>
                                  </div>
                                )}
                                {prod.description ? (
                                  <p className="text-[11px] text-sky-200/90 line-clamp-2">
                                    {prod.description}
                                  </p>
                                ) : (
                                  <span className="text-[11px] text-sky-300/60 font-mono">
                                    Toifa: {prod.category}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* 5. Bunker narxi */}
                            <td className="py-4 px-4 border-r border-[#1E3A6D] whitespace-nowrap">
                              <div className="p-2.5 rounded-xl bg-[#071326] border border-amber-500/40 inline-block min-w-[135px]">
                                <div className="text-[10px] font-mono font-bold uppercase text-amber-400">
                                  Bunker narxi
                                </div>
                                <div className="text-sm sm:text-base font-black text-white font-mono mt-0.5">
                                  {formatPrice(prod.price)}
                                </div>
                              </div>
                            </td>

                            {/* 6. CRM narxi */}
                            <td className="py-4 px-4 border-r border-[#1E3A6D] whitespace-nowrap">
                              <div className="p-2.5 rounded-xl bg-[#071326] border border-emerald-500/40 inline-block min-w-[135px]">
                                <div className="text-[10px] font-mono font-bold uppercase text-emerald-400">
                                  CRM narxi
                                </div>
                                <div className="text-sm sm:text-base font-black text-emerald-300 font-mono mt-0.5">
                                  {formatPrice(crmPrice)}
                                </div>
                              </div>
                            </td>

                            {/* 7. Tahrirlash (Faqat Tahrirlash tugmasi!) */}
                            <td className="py-4 px-4 text-center whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => handleOpenEditProductModal(prod)}
                                className="px-4 py-2.5 rounded-xl bg-[#FFB800] hover:bg-[#FFC928] text-slate-950 font-black text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-md active:scale-95 transition-all"
                              >
                                <Settings className="w-3.5 h-3.5" />
                                <span>Tahrirlash</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {displayedCompanyProducts.length === 0 && (
              <div className="text-center py-16 bg-[#0A1931] rounded-3xl border-2 border-dashed border-[#1E3A6D] p-8 space-y-3">
                <Package className="w-12 h-12 text-[#FFB800] mx-auto" />
                <p className="text-sky-200 text-sm font-bold">
                  {supplierData.cabinetType === 'manufacturer'
                    ? 'Hozircha korxona mahsulotlari kiritilmagan.'
                    : productsSubTab === 'online'
                    ? 'Hozircha Onlayn savdo mahsulotlari kiritilmagan.'
                    : 'Hozircha Oflayn mahsulotlar kiritilmagan.'}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    handleOpenAddProductModal(
                      'products',
                      supplierData.cabinetType === 'manufacturer' ? 'online' : productsSubTab
                    )
                  }
                  className="px-5 py-2.5 rounded-xl bg-[#FFB800] text-slate-950 font-black text-xs cursor-pointer"
                >
                  Yangi Mahsulot Qo‘shish
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab: CRM — 2 VA UNDAN ORTIQ SAVDO SAVATI SHAKLLANTIRISH IMKONI BILAN (Fullscreen) */}
        {activeTab === 'crm' && (
          <div className="space-y-6 animate-fadeIn">
            {/* CRM Header */}
            <div className="bg-slate-950 border-2 border-emerald-500/40 rounded-3xl p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-2xl">
              <div className="flex items-center gap-3.5">
                <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                  <Calculator className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-white">
                    CRM — Ko‘p Savatli Savdo Tizimi
                  </h2>
                  <p className="text-xs text-slate-400">
                    Qaysi savatda bo‘lsangiz, mahsulotlar aynan shu faol savatga ({activeCrmBasket.name}) yuklanadi
                  </p>
                </div>
              </div>
            </div>

            {/* B2B Kabineti uchun B2B Amaliyotlar ko'rsatkichi */}
            {supplierData.cabinetType === 'manufacturer' && incomingManufacturerB2bOrders.length > 0 && (
              <div className="bg-slate-950 border-2 border-amber-500/40 rounded-3xl p-4 sm:p-5 space-y-3 shadow-xl">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    <span>B2B Savdo va To‘lov Amaliyotlari ({incomingManufacturerB2bOrders.length} ta)</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('b2b_orders')}
                    className="text-xs font-black text-[#FFB800] hover:underline cursor-pointer"
                  >
                    B2B buyurtmalarni boshqarish →
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block">Jami B2B So‘rovlar:</span>
                    <strong className="text-white text-base font-mono font-black">{incomingManufacturerB2bOrders.length} ta</strong>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block">Tasdiqlash / To‘lov kutilmoqda:</span>
                    <strong className="text-amber-400 text-base font-mono font-black">
                      {incomingManufacturerB2bOrders.filter((o) => o.status !== 'paid_shipped').length} ta
                    </strong>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block">Hisobga o‘tkazilgan B2B tushum:</span>
                    <strong className="text-emerald-400 text-base font-mono font-black">
                      {formatPrice(
                        incomingManufacturerB2bOrders
                          .filter((o) => o.status === 'paid_shipped')
                          .reduce((s, o) => s + o.totalAmount, 0)
                      )}
                    </strong>
                  </div>
                </div>
              </div>
            )}

            {crmSaleSuccessNotice && (
              <div className="p-4 rounded-2xl bg-emerald-500/20 border-2 border-emerald-400 text-emerald-200 text-xs sm:text-sm font-black flex items-center gap-2.5 animate-fadeIn">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>{crmSaleSuccessNotice}</span>
              </div>
            )}

            {crmStockWarning && (
              <div className="p-4 rounded-2xl bg-slate-950 border-2 border-red-500 text-red-500 text-xs sm:text-sm font-black flex items-center gap-2.5 animate-fadeIn shadow-[0_0_20px_rgba(239,68,68,0.4)]">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                <span className="text-red-500 font-black">{crmStockWarning}</span>
              </div>
            )}

            {/* Asosiy CRM Ishchi Maydoni */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
              {/* CHAP TARAF: QIDIRUV VA MAHSULOTLAR RO'YXATI */}
              <div className="xl:col-span-7 space-y-4">
                {/* Qidiruv */}
                <div className="bg-slate-950 border-2 border-slate-900 rounded-3xl p-4 sm:p-5 shadow-xl">
                  <div className="relative">
                    <Search className="w-4 h-4 text-emerald-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={crmSearchQuery}
                      onChange={(e) => setCrmSearchQuery(e.target.value)}
                      placeholder="Mahsulot qidiruvi..."
                      className="w-full pl-11 pr-10 py-3 bg-slate-900 border border-slate-700 focus:border-emerald-400 rounded-2xl text-white text-xs sm:text-sm focus:outline-none"
                    />
                    {crmSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setCrmSearchQuery('')}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-slate-950 border-2 border-slate-900 rounded-3xl overflow-hidden shadow-2xl">
                  <div className="grid grid-cols-12 gap-3 px-5 py-3.5 bg-slate-900 border-b border-slate-800 text-[11px] font-black uppercase tracking-wider text-slate-400">
                    <div className="col-span-6">Mahsulot Nomi / Ombor</div>
                    <div className="col-span-3">Narxi</div>
                    <div className="col-span-3 text-right">{activeCrmBasket.name} ga yuklash</div>
                  </div>

                  {filteredCrmProducts.length === 0 ? (
                    <div className="p-10 text-center space-y-3">
                      <Package className="w-10 h-10 text-slate-600 mx-auto" />
                      <p className="text-sm text-slate-400">
                        {companyProducts.length === 0
                          ? "Hozircha mahsulotlar kiritilmagan."
                          : "Qidiruv bo‘yicha mahsulot topilmadi."}
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-800/80">
                      {filteredCrmProducts.map((prod, idx) => {
                        const variantsList = getProductVariantsList(prod);
                        const selectedVIdx = crmVariantSelection[prod.id] ?? 0;
                        const activeVariant = variantsList[selectedVIdx] || variantsList[0];
                        const activeSpecLabel = activeVariant.specification
                          ? activeVariant.specification
                          : `1 ${activeVariant.unit || prod.unit}`;
                        const activeVariantCrmPrice =
                          typeof activeVariant.originalPrice === 'number' && activeVariant.originalPrice > 0
                            ? activeVariant.originalPrice
                            : activeVariant.price || getProductCrmPrice(prod);
                        const activeColors =
                          activeVariant.colors && activeVariant.colors.length > 0
                            ? activeVariant.colors
                            : prod.colors || [];
                        const selectedColor = crmColorSelection[prod.id] ?? (activeColors[0] || '');
                        const activeEntryKey =
                          variantsList.length > 1 || selectedColor || activeVariant.specification
                            ? `${prod.id}::${selectedVIdx}${selectedColor ? `::${selectedColor}` : ''}`
                            : prod.id;
                        const isInCrmCart = crmSelectedIds.some(
                          (k) => k === activeEntryKey || String(k).split('::')[0] === prod.id
                        );
                        const qtyInCart = crmSelectedIds
                          .filter((k) => String(k).split('::')[0] === prod.id)
                          .reduce((sum, k) => sum + (crmQuantities[k] || 1), 0);
                        const availStock = prod.stock !== undefined && prod.stock !== null ? Number(prod.stock) : 999999;
                        const isOutOfStock = availStock <= 0;
                        const isVariantsExpanded = Boolean(expandedCrmVariantIds[prod.id]);

                        return (
                          <div
                            key={prod.id}
                            className={`px-5 py-3.5 transition-colors ${
                              isInCrmCart ? 'bg-emerald-950/25' : 'bg-slate-950 hover:bg-slate-900/60'
                            }`}
                          >
                            <div className="grid grid-cols-12 gap-3 items-center">
                              {/* Nomi */}
                              <div className="col-span-6 flex items-center gap-3 min-w-0">
                                <span className="w-6 h-6 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                                  {idx + 1}
                                </span>
                                <img
                                  src={prod.image}
                                  alt={prod.title}
                                  className="w-11 h-11 rounded-xl object-cover border border-slate-800 shrink-0 bg-slate-900"
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <h4 className="font-black text-xs sm:text-sm text-white truncate">
                                      {prod.title}
                                    </h4>
                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                      prod.saleChannel === 'offline'
                                        ? 'bg-emerald-500/20 text-emerald-300'
                                        : 'bg-sky-500/20 text-sky-300'
                                    }`}>
                                      {prod.saleChannel === 'offline' ? 'Oflayn' : 'Onlayn'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setExpandedCrmVariantIds((prev) => ({
                                          ...prev,
                                          [prod.id]: !prev[prod.id],
                                        }))
                                      }
                                      className="px-2 py-0.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-amber-500/50 text-[#FFB800] text-[11px] font-mono font-black flex items-center gap-1 cursor-pointer transition-all"
                                      title="Mavjud variantlarni ko‘rish va tanlash"
                                    >
                                      <span>{activeSpecLabel}</span>
                                      {selectedColor && (
                                        <span className="text-sky-300">• {selectedColor}</span>
                                      )}
                                      <span className="text-[10px] text-amber-300 ml-0.5">
                                        (Mavjud variantlar: {variantsList.length}) {isVariantsExpanded ? '▲' : '▼'}
                                      </span>
                                    </button>
                                    {isOutOfStock ? (
                                      <span className="text-[10px] font-black px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                                        Vaqtincha tugagan (0 {prod.unit})
                                      </span>
                                    ) : (
                                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                        Omborda: {prod.stock ?? 0} {prod.unit}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Narxi (bosilganda ham mavjud variantlar ko'rsatiladi) */}
                              <div className="col-span-3">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedCrmVariantIds((prev) => ({
                                      ...prev,
                                      [prod.id]: !prev[prod.id],
                                    }))
                                  }
                                  className="text-left group cursor-pointer"
                                >
                                  <span className="font-mono font-black text-xs sm:text-sm text-emerald-400 group-hover:text-[#FFB800] transition-colors block">
                                    {formatPrice(activeVariantCrmPrice)}
                                  </span>
                                  <span className="text-[10px] text-amber-400/90 font-bold underline block">
                                    Mavjud variantlar {isVariantsExpanded ? '▲' : '▼'}
                                  </span>
                                </button>
                              </div>

                              {/* + Qo'shish tugmasi */}
                              <div className="col-span-3 flex items-center justify-end">
                                <button
                                  type="button"
                                  disabled={isOutOfStock}
                                  onClick={() => handleAddVariantToCrmCart(prod, selectedVIdx, selectedColor)}
                                  className={`px-3.5 py-2 rounded-xl font-black text-xs flex items-center gap-1.5 transition-all shadow ${
                                    isOutOfStock
                                      ? 'bg-red-500/20 text-red-300 border border-red-500/30 cursor-not-allowed'
                                      : isInCrmCart
                                      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 cursor-pointer'
                                      : 'bg-[#FFB800] hover:bg-[#FFC928] text-slate-950 cursor-pointer'
                                  }`}
                                >
                                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                                  <span>{isOutOfStock ? 'Tugagan' : `Yuklash ${isInCrmCart ? `(${qtyInCart})` : ''}`}</span>
                                </button>
                              </div>
                            </div>

                            {/* Bosilganda ochiladigan Mavjud variantlar (Mavjudlikdagi mahsulotlar) */}
                            {isVariantsExpanded && (
                              <div className="mt-3 pt-3 border-t border-slate-800 space-y-2.5 animate-fadeIn">
                                <div className="flex items-center justify-between">
                                  <span className="text-[11px] font-black uppercase tracking-wider text-[#FFB800]">
                                    Mavjud variantlar ({variantsList.length} ta):
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    Variantni tanlang yoki savatga yuklang
                                  </span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {variantsList.map((v, vIdx) => {
                                    const isSelVar = selectedVIdx === vIdx;
                                    const vSpec = v.specification ? v.specification : `1 ${v.unit || prod.unit}`;
                                    const vPrice =
                                      typeof v.originalPrice === 'number' && v.originalPrice > 0
                                        ? v.originalPrice
                                        : v.price || getProductCrmPrice(prod);
                                    const vColors =
                                      v.colors && v.colors.length > 0 ? v.colors : prod.colors || [];

                                    return (
                                      <div
                                        key={v.id || vIdx}
                                        onClick={() => {
                                          setCrmVariantSelection((prev) => ({
                                            ...prev,
                                            [prod.id]: vIdx,
                                          }));
                                          if (vColors.length > 0 && !vColors.includes(selectedColor)) {
                                            setCrmColorSelection((prev) => ({
                                              ...prev,
                                              [prod.id]: vColors[0],
                                            }));
                                          }
                                        }}
                                        className={`p-2.5 rounded-xl border transition-all cursor-pointer space-y-2 ${
                                          isSelVar
                                            ? 'bg-slate-900 border-[#FFB800] shadow-md'
                                            : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                                        }`}
                                      >
                                        <div className="flex items-center justify-between gap-2">
                                          <div>
                                            <span className="font-mono font-black text-xs text-white block">
                                              Mavjudlik #{vIdx + 1}: <span className="text-[#FFB800]">{vSpec}</span>
                                            </span>
                                            <span className="font-mono font-black text-xs text-emerald-400 block mt-0.5">
                                              {formatPrice(vPrice)}
                                            </span>
                                          </div>
                                          <button
                                            type="button"
                                            disabled={isOutOfStock}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setCrmVariantSelection((prev) => ({
                                                ...prev,
                                                [prod.id]: vIdx,
                                              }));
                                              const colToUse =
                                                vColors.length > 0
                                                  ? vColors.includes(selectedColor)
                                                    ? selectedColor
                                                    : vColors[0]
                                                  : '';
                                              handleAddVariantToCrmCart(prod, vIdx, colToUse);
                                            }}
                                            className="px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-black text-[11px] flex items-center gap-1 cursor-pointer shrink-0"
                                          >
                                            <Plus className="w-3 h-3 stroke-[3]" />
                                            <span>Savatga</span>
                                          </button>
                                        </div>

                                        {vColors.length > 0 && (
                                          <div className="flex flex-wrap gap-1 pt-1 border-t border-slate-800/80">
                                            {vColors.map((col) => {
                                              const colStyle = getColorPaletteItem(col);
                                              const isColSelected = isSelVar && selectedColor === col;
                                              return (
                                                <button
                                                  key={col}
                                                  type="button"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setCrmVariantSelection((prev) => ({
                                                      ...prev,
                                                      [prod.id]: vIdx,
                                                    }));
                                                    setCrmColorSelection((prev) => ({
                                                      ...prev,
                                                      [prod.id]: col,
                                                    }));
                                                  }}
                                                  className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                                                    isColSelected
                                                      ? 'ring-2 ring-[#FFB800] scale-105 font-black'
                                                      : 'opacity-80 hover:opacity-100'
                                                  }`}
                                                  style={{ backgroundColor: colStyle.bg, color: colStyle.text }}
                                                >
                                                  {col}
                                                </button>
                                              );
                                            })}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* O'NG TARAF: SAVDO SAVATLARI TANLOVI VA FAOL SAVAT (CRM O'ZIDA YIG'ILIB BORADI) */}
              <div className="xl:col-span-5 xl:sticky xl:top-6">
                <div className="bg-slate-950 border-2 border-emerald-500/50 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl">
                  {/* Savdo Savatlari (2 va undan ortiq savatlar) — shu qismga o'tkazilgan */}
                  <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Savdo Savatlari ({crmBaskets.length} ta) — Faol: {activeCrmBasket.name}</span>
                      </span>
                      <button
                        type="button"
                        onClick={handleAddNewCrmBasket}
                        className="text-xs font-black text-[#FFB800] hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Yana savat qo‘shish</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {crmBaskets.map((basket) => {
                        const isActive = basket.id === activeCrmBasket.id;
                        const count = basket.selectedIds.length;
                        return (
                          <div
                            key={basket.id}
                            onClick={() => setActiveCrmBasketId(basket.id)}
                            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border font-black text-xs cursor-pointer transition-all shrink-0 ${
                              isActive
                                ? 'bg-emerald-500 text-slate-950 border-emerald-300 shadow-lg shadow-emerald-500/25'
                                : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800'
                            }`}
                          >
                            <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
                            <span>{basket.name}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                              isActive ? 'bg-slate-950 text-emerald-400' : 'bg-slate-800 text-emerald-400'
                            }`}>
                              {count} xil
                            </span>
                            {crmBaskets.length > 1 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveCrmBasket(basket.id);
                                }}
                                className={`p-0.5 rounded-md ${
                                  isActive ? 'hover:bg-slate-950/20 text-slate-950' : 'hover:bg-red-500/20 text-red-400'
                                }`}
                                title="Savatni o‘chirish"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <ShoppingBag className="w-5 h-5 text-emerald-400" />
                      <div>
                        <h3 className="text-base font-black text-white">{activeCrmBasket.name} (CRM)</h3>
                        <span className="text-[10px] text-emerald-400 font-mono">Faol savdo savati</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 font-mono text-xs font-black border border-emerald-500/30">
                        {selectedCrmEntries.length} xil mahsulot
                      </span>
                      {selectedCrmEntries.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setCrmSelectedIds([])}
                          className="px-2.5 py-1 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30 text-[11px] font-bold cursor-pointer"
                        >
                          Tozalash
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Xaridor ma'lumotlari (ixtiyoriy, CRM savdo hisobotiga tushishi uchun) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={crmClientName}
                      onChange={(e) => setCrmClientName(e.target.value.replace(/[0-9]/g, ''))}
                      placeholder="Xaridor ismi (ixtiyoriy)"
                      className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-400"
                    />
                    <input
                      type="tel"
                      maxLength={17}
                      value={crmClientPhone}
                      onChange={(e) =>
                        setCrmClientPhone(
                          e.target.value.trim() === '' ? '' : formatUzPhoneInput(e.target.value)
                        )
                      }
                      placeholder="+998 90 123 45 67"
                      className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-emerald-400"
                    />
                  </div>

                  {/* Savatga qo'shilgan mahsulotlar ro'yxati */}
                  {selectedCrmEntries.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-slate-900/70 border border-dashed border-slate-800 text-center space-y-2">
                      <ShoppingBag className="w-8 h-8 text-slate-600 mx-auto" />
                      <p className="text-xs text-slate-400">
                        {activeCrmBasket.name} bo‘sh. Ro‘yxatdan mahsulot yonidagi «+ Yuklash» tugmasini bosing.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                      {selectedCrmEntries.map((entry, i) => {
                        const q = getCrmEntryQty(entry.entryKey, entry.prod);
                        const origP = entry.crmPrice;
                        const sum = q * origP;
                        return (
                          <div
                            key={entry.entryKey}
                            className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5 text-xs"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <div className="font-black text-white text-sm truncate">
                                  {i + 1}. {entry.displayTitle}
                                </div>
                                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                                  Narxi: <strong className="text-emerald-400">{formatPrice(origP)}</strong> / {entry.unitSpec}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  setCrmSelectedIds((prev) => prev.filter((id) => id !== entry.entryKey))
                                }
                                className="text-slate-400 hover:text-red-400 p-1 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer"
                                title="Savatdan o‘chirish"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                              <div className="flex items-center bg-slate-950 border border-slate-700 rounded-xl p-1">
                                <button
                                  type="button"
                                  onClick={() => handleSetCrmQty(entry.entryKey, q - 1)}
                                  className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center cursor-pointer"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={q}
                                  onChange={(e) => {
                                    const cleanDigits = e.target.value.replace(/\D/g, '');
                                    handleSetCrmQty(entry.entryKey, cleanDigits ? Number(cleanDigits) : 1);
                                  }}
                                  className="w-16 text-center bg-transparent text-white font-mono font-black text-xs focus:outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSetCrmQty(entry.entryKey, q + 1)}
                                  className="w-7 h-7 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 flex items-center justify-center cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <div className="text-right">
                                <span className="text-[10px] text-slate-400 block">
                                  {q} ({entry.unitSpec}) jami:
                                </span>
                                <span className="font-mono font-black text-sm text-emerald-400">
                                  {formatPrice(sum)}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Jami Hisob va CRM Savdoni Tasdiqlash */}
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Savatdagi mahsulotlar:</span>
                      <span className="font-mono font-bold text-white">
                        {selectedCrmEntries.length} xil ({crmCalculation.totalUnits} ta mahsulot)
                      </span>
                    </div>

                    <div className="pt-2.5 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-sm font-black text-white uppercase">
                        Jami Summa:
                      </span>
                      <span className="text-lg sm:text-xl font-black text-emerald-400 font-mono">
                        {formatPrice(crmCalculation.totalOriginalSum)}
                      </span>
                    </div>

                    {selectedCrmEntries.length > 0 && (
                      <button
                        type="button"
                        onClick={handleCompleteCrmOfflineSale}
                        className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/25 active:scale-95 transition-all"
                      >
                        <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                        <span>CRM savdoni tasdiqlash ({activeCrmBasket.name})</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 1: Hisobot, monitoring — 3 GA AJRATILGAN: 1) Umumiy monitoring, 2) Onlayn savdo monitoringi, 3) CRM monitoringi */}
        {activeTab === 'reports' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Hisobot Header Card + 3 Sub-tabs + Kunlik/Haftalik/Oylik + PDF Yuklab olish */}
            <div className="bg-[#0A1931] border-2 border-[#1E3A6D] p-5 sm:p-6 rounded-3xl space-y-5 shadow-2xl">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-[#FFB800] font-bold text-xs uppercase tracking-wider">
                    <BarChart3 className="w-4 h-4" />
                    <span>Hisobot va Monitoring Tizimi</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                    «{supplierData.companyName}» Savdo Monitoringi
                  </h2>
                  <p className="text-xs text-sky-200 mt-0.5">
                    Onlayn savdo va CRM savdolar alohida tizimda hisoblanadi (CRM savdolaridan Bunker Stroy ulushi olinmaydi)
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {reportsSubTab === 'general' && (
                    <div className="px-4 py-2.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-black">
                      Bunker shartnomasi: {supplierReport.commissionRate}% (Faqat Onlayndan)
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleDownloadMonitoringPdf}
                    className="px-4 py-2.5 rounded-2xl bg-[#FFB800] hover:bg-[#FFC928] text-slate-950 font-black text-xs flex items-center gap-2 cursor-pointer shadow-lg active:scale-95 transition-all"
                  >
                    <Download className="w-4 h-4 stroke-[2.5]" />
                    <span>PDF yuklab olish</span>
                  </button>
                </div>
              </div>

              {/* Vaqt oralig'i filtri: Kunlik | Haftalik | Oylik */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#1E3A6D]">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-black text-sky-200 uppercase tracking-wider flex items-center gap-1.5 mr-1">
                    <Clock className="w-3.5 h-3.5 text-[#FFB800]" />
                    <span>Hisobot davri:</span>
                  </span>
                  {[
                    { id: 'daily', label: 'Kunlik' },
                    { id: 'weekly', label: 'Haftalik' },
                    { id: 'monthly', label: 'Oylik' },
                  ].map((period) => {
                    const isSel = reportTimeRange === period.id;
                    return (
                      <button
                        key={period.id}
                        type="button"
                        onClick={() => {
                          setReportTimeRange(period.id as 'daily' | 'weekly' | 'monthly');
                          setSelectedReportDay('all_days');
                        }}
                        className={`px-4 py-2 rounded-xl font-black text-xs transition-all cursor-pointer border ${
                          isSel
                            ? 'bg-red-600 text-white border-red-400 shadow-[0_0_12px_rgba(220,38,38,0.45)]'
                            : 'bg-[#071326] hover:bg-[#0F2547] text-sky-100 border-[#1E3A6D]'
                        }`}
                      >
                        {period.label}
                      </button>
                    );
                  })}
                </div>

                {/* Kunlik rejimda kunlar bo'yicha tezkor tanlash */}
                {reportTimeRange === 'daily' && availableSaleDays.length > 0 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    <button
                      type="button"
                      onClick={() => setSelectedReportDay('all_days')}
                      className={`px-3 py-1.5 rounded-xl font-mono font-bold text-[11px] border cursor-pointer shrink-0 transition-all ${
                        selectedReportDay === 'all_days'
                          ? 'bg-[#FFB800] text-slate-950 border-amber-300 font-black'
                          : 'bg-[#071326] text-sky-200 border-[#1E3A6D] hover:border-amber-400/50'
                      }`}
                    >
                      Barcha kunlar ({availableSaleDays.length} kun)
                    </button>
                    {availableSaleDays.map((dayStr) => (
                      <button
                        key={dayStr}
                        type="button"
                        onClick={() => setSelectedReportDay(dayStr)}
                        className={`px-3 py-1.5 rounded-xl font-mono font-bold text-[11px] border cursor-pointer shrink-0 transition-all ${
                          selectedReportDay === dayStr
                            ? 'bg-[#FFB800] text-slate-950 border-amber-300 font-black'
                            : 'bg-[#071326] text-sky-200 border-[#1E3A6D] hover:border-amber-400/50'
                        }`}
                      >
                        {dayStr}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 4 TA SUB-TAB: 1) Umumiy monitoring, 2) Onlayn savdo monitoringi, 3) CRM monitoringi, 4) Kirim-chiqim */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-[#1E3A6D]">
                <button
                  type="button"
                  onClick={() => setReportsSubTab('general')}
                  className={`p-3.5 rounded-2xl border font-black text-xs sm:text-sm flex items-center justify-between cursor-pointer transition-all ${
                    reportsSubTab === 'general'
                      ? 'bg-red-600 text-white border-red-400 shadow-[0_0_16px_rgba(220,38,38,0.45)]'
                      : 'bg-[#071326] hover:bg-[#0F2547] text-sky-100 border-[#1E3A6D]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <BarChart3 className={`w-4 h-4 shrink-0 ${reportsSubTab === 'general' ? 'text-white' : 'text-sky-400'}`} />
                    <span>1. Umumiy monitoring</span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-black ${
                    reportsSubTab === 'general' ? 'bg-white text-red-700' : 'bg-[#0F2547] text-sky-300'
                  }`}>
                    {generalReportSales.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setReportsSubTab('online')}
                  className={`p-3.5 rounded-2xl border font-black text-xs sm:text-sm flex items-center justify-between cursor-pointer transition-all ${
                    reportsSubTab === 'online'
                      ? 'bg-red-600 text-white border-red-400 shadow-[0_0_16px_rgba(220,38,38,0.45)]'
                      : 'bg-[#071326] hover:bg-[#0F2547] text-sky-100 border-[#1E3A6D]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Globe className={`w-4 h-4 shrink-0 ${reportsSubTab === 'online' ? 'text-white' : 'text-[#FFB800]'}`} />
                    <span>2. Onlayn savdo monitoringi</span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-black ${
                    reportsSubTab === 'online' ? 'bg-white text-red-700' : 'bg-[#0F2547] text-amber-400'
                  }`}>
                    {onlineReportSales.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setReportsSubTab('offline')}
                  className={`p-3.5 rounded-2xl border font-black text-xs sm:text-sm flex items-center justify-between cursor-pointer transition-all ${
                    reportsSubTab === 'offline'
                      ? 'bg-red-600 text-white border-red-400 shadow-[0_0_16px_rgba(220,38,38,0.45)]'
                      : 'bg-[#071326] hover:bg-[#0F2547] text-sky-100 border-[#1E3A6D]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Store className={`w-4 h-4 shrink-0 ${reportsSubTab === 'offline' ? 'text-white' : 'text-emerald-400'}`} />
                    <span>3. CRM monitoringi</span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-black ${
                    reportsSubTab === 'offline' ? 'bg-white text-red-700' : 'bg-[#0F2547] text-emerald-400'
                  }`}>
                    {offlineReportSales.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setReportsSubTab('kirim_chiqim')}
                  className={`p-3.5 rounded-2xl border font-black text-xs sm:text-sm flex items-center justify-between cursor-pointer transition-all ${
                    reportsSubTab === 'kirim_chiqim'
                      ? 'bg-red-600 text-white border-red-400 shadow-[0_0_16px_rgba(220,38,38,0.45)]'
                      : 'bg-[#071326] hover:bg-[#0F2547] text-sky-100 border-[#1E3A6D]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Calculator className={`w-4 h-4 shrink-0 ${reportsSubTab === 'kirim_chiqim' ? 'text-white' : 'text-amber-400'}`} />
                    <span>4. Kirim-chiqim</span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-black ${
                    reportsSubTab === 'kirim_chiqim' ? 'bg-white text-red-700' : 'bg-[#0F2547] text-amber-300'
                  }`}>
                    {companyProducts.length}
                  </span>
                </button>
              </div>

              {/* Ombor va Vaqtincha tugagan mahsulotlar ma'lumoti (Vaqtincha tugagan faqat > 0 bo'lganda tugma bo'lib chiqadi, bosilganda ro'yxati ochiladi) */}
              <div className="p-3.5 rounded-2xl bg-[#071326] border border-[#1E3A6D] space-y-2.5 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-black text-sky-200 flex items-center gap-1.5">
                      <Package className="w-4 h-4 text-[#FFB800]" />
                      <span>Ombor holati:</span>
                    </span>
                    <span className="px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono font-bold">
                      Mavjud mahsulotlar: {companyProducts.filter((p) => (p.stock ?? 0) > 0).length} xil
                    </span>
                    {companyProducts.some((p) => (p.stock ?? 0) <= 0) && (
                      <button
                        type="button"
                        onClick={() => setShowOutOfStockList((prev) => !prev)}
                        className="px-3 py-1 rounded-xl bg-red-600/25 hover:bg-red-600/40 border border-red-400 text-red-300 font-mono font-black cursor-pointer transition-all flex items-center gap-1.5 shadow-[0_0_12px_rgba(239,68,68,0.35)]"
                      >
                        <span>
                          Vaqtincha tugagan: {companyProducts.filter((p) => (p.stock ?? 0) <= 0).length} xil
                        </span>
                        <span className="text-[10px]">
                          {showOutOfStockList ? '▲' : '▼'}
                        </span>
                      </button>
                    )}
                  </div>
                </div>

                {showOutOfStockList && companyProducts.some((p) => (p.stock ?? 0) <= 0) && (
                  <div className="pt-2 border-t border-[#1E3A6D] flex flex-wrap items-center gap-2 animate-fadeIn">
                    <span className="text-[11px] text-red-400 font-black">Tugagan mahsulotlar ro‘yxati:</span>
                    {companyProducts
                      .filter((p) => (p.stock ?? 0) <= 0)
                      .map((p) => (
                        <span
                          key={p.id}
                          className="px-2.5 py-1 rounded-lg bg-red-500/20 border border-red-400/60 text-red-300 font-black text-[11px]"
                        >
                          {p.title} (0 {p.unit})
                        </span>
                      ))}
                  </div>
                )}
              </div>
            </div>

            {/* Hisobot Ko'rsatkichlari — Onlayn va CRM alohida algoritmda */}
            {reportsSubTab === 'general' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#0A1931] border-2 border-[#1E3A6D] p-4 rounded-2xl shadow-lg">
                  <span className="text-xs text-sky-200 block font-bold">1. Jami Umumiy Savdo (Onlayn + CRM):</span>
                  <span className="text-xl font-black text-[#FFB800] font-mono block mt-1">
                    {formatPrice(generalSalesTotalSum)}
                  </span>
                  <span className="text-[11px] text-sky-300 block mt-1">
                    Jami {generalReportSales.length} ta savdo
                  </span>
                </div>

                <div className="bg-[#0A1931] border-2 border-[#1E3A6D] p-4 rounded-2xl shadow-lg">
                  <span className="text-xs text-sky-200 block font-bold">2. Onlayn Bunker Savdosi:</span>
                  <span className="text-xl font-black text-white font-mono block mt-1">
                    {formatPrice(onlineSalesTotalSum)}
                  </span>
                  <span className="text-[11px] text-emerald-400 font-bold block mt-1">
                    Bunker ulushi ({supplierReport.commissionRate}%): {formatPrice(onlineBunkerCommissionSum)}
                  </span>
                </div>

                <div className="bg-[#0A1931] border-2 border-[#1E3A6D] p-4 rounded-2xl shadow-lg">
                  <span className="text-xs text-sky-200 block font-bold">3. CRM Savdo:</span>
                  <span className="text-xl font-black text-amber-300 font-mono block mt-1">
                    {formatPrice(offlineCrmSalesTotalSum)}
                  </span>
                  <span className="text-[11px] text-sky-300 block mt-1">
                    Bunker ulushi: 0 so‘m (Admin hisobiga kirmaydi)
                  </span>
                </div>

                <div className="bg-[#0A1931] border-2 border-emerald-500/50 p-4 rounded-2xl shadow-lg">
                  <span className="text-xs text-emerald-300 block font-bold">4. Korxona Jami Daromadi:</span>
                  <span className="text-xl font-black text-emerald-400 font-mono block mt-1">
                    {formatPrice(generalSupplierNetSum)}
                  </span>
                  <span className="text-[11px] text-emerald-200 block mt-1">
                    Onlayn ({formatPrice(onlineSupplierNetSum)}) + 100% CRM
                  </span>
                </div>
              </div>
            )}

            {reportsSubTab === 'online' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#0A1931] border-2 border-[#1E3A6D] p-4 rounded-2xl shadow-lg">
                  <span className="text-xs text-sky-200 block font-bold">Jami Onlayn Savdo (Platforma):</span>
                  <span className="text-xl font-black text-[#FFB800] font-mono block mt-1">
                    {formatPrice(onlineSalesTotalSum)}
                  </span>
                  <span className="text-[11px] text-sky-300 block mt-1">
                    {onlineReportSales.length} ta onlayn buyurtma
                  </span>
                </div>

                <div className="bg-[#0A1931] border-2 border-emerald-500/50 p-4 rounded-2xl shadow-lg">
                  <span className="text-xs text-emerald-300 block font-bold">
                    Bunker Stroy Ulushi ({supplierReport.commissionRate}%):
                  </span>
                  <span className="text-xl font-black text-emerald-400 font-mono block mt-1">
                    {formatPrice(onlineBunkerCommissionSum)}
                  </span>
                  <span className="text-[11px] text-emerald-200 block mt-1">
                    Faqat onlayn platforma savdosidan
                  </span>
                </div>

                <div className="bg-[#0A1931] border-2 border-[#1E3A6D] p-4 rounded-2xl shadow-lg">
                  <span className="text-xs text-sky-200 block font-bold">Korxona Daromadi (Onlayn):</span>
                  <span className="text-xl font-black text-white font-mono block mt-1">
                    {formatPrice(onlineSupplierNetSum)}
                  </span>
                  <span className="text-[11px] text-sky-300 block mt-1">
                    Bunker ulushi chegirilgandan so‘ng
                  </span>
                </div>

                <div className="bg-[#0A1931] border-2 border-[#1E3A6D] p-4 rounded-2xl shadow-lg">
                  <span className="text-xs text-sky-200 block font-bold">Sotilgan Onlayn Mahsulot Hajmi:</span>
                  <span className="text-xl font-black text-amber-300 font-mono block mt-1">
                    {onlineReportSales.reduce((acc, curr) => acc + curr.quantity, 0)} ta mahsulot
                  </span>
                  <span className="text-[11px] text-sky-300 block mt-1">
                    {new Set(onlineReportSales.map((s) => (s.productTitle || '').trim().toLowerCase())).size || onlineReportSales.length} xil mahsulot (Onlayn Bunker)
                  </span>
                </div>
              </div>
            )}

            {reportsSubTab === 'offline' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-[#0A1931] border-2 border-[#1E3A6D] p-4 rounded-2xl shadow-lg">
                  <span className="text-xs text-sky-200 block font-bold">Jami CRM Savdo Aylanmasi:</span>
                  <span className="text-xl font-black text-[#FFB800] font-mono block mt-1">
                    {formatPrice(offlineCrmSalesTotalSum)}
                  </span>
                </div>

                <div className="bg-[#0A1931] border-2 border-[#1E3A6D] p-4 rounded-2xl shadow-lg">
                  <span className="text-xs text-sky-200 block font-bold">CRM Sotilgan Mahsulot Hajmi:</span>
                  <span className="text-xl font-black text-white font-mono block mt-1">
                    {offlineReportSales.reduce((acc, curr) => acc + curr.quantity, 0)} ta mahsulot
                  </span>
                  <span className="text-[11px] text-sky-300 block mt-1">
                    {new Set(offlineReportSales.map((s) => (s.productTitle || '').trim().toLowerCase())).size || offlineReportSales.length} xil mahsulot ({offlineReportSales.length} ta mahsulot)
                  </span>
                </div>

                <div className="bg-[#0A1931] border-2 border-emerald-500/40 p-4 rounded-2xl shadow-lg">
                  <span className="text-xs text-emerald-300 block font-bold">Tizim Algoritmi (Mustaqil CRM):</span>
                  <span className="text-sm font-black text-emerald-400 block mt-1.5">
                    Admin hisob-kitobi va Bunker ulushisiz (0 so‘m)
                  </span>
                  <span className="text-[11px] text-sky-200 block mt-1">
                    CRM savdolar faqat ta'minotchi ichki hisobi uchun ishlaydi
                  </span>
                </div>
              </div>
            )}

            {/* 4. KIRIM-CHIQIM BO'LIMI: Har bir mahsulotning keltirilgan (asl) narxi, sotilayotgan narxi, ombordagi miqdori va foydasi */}
            {reportsSubTab === 'kirim_chiqim' && (() => {
              const rows = companyProducts.map((prod) => {
                const costP = Number(prod.costPrice) || 0;
                const bunkerP = Number(prod.price) || 0;
                const crmP = getProductCrmPrice(prod);
                const prodSales = generalReportSales.filter(
                  (s) =>
                    String(s.productId || '') === String(prod.id) ||
                    (s.productTitle || '').trim().toLowerCase() === (prod.title || '').trim().toLowerCase()
                );
                const soldQty = prodSales.reduce((acc, s) => acc + (Number(s.quantity) || 0), 0);
                const soldRevenue = prodSales.reduce((acc, s) => acc + (Number(s.totalSum) || 0), 0);
                const remainStock = Math.max(0, Number(prod.stock) || 0);
                const totalInitialQty = prod.initialStock && prod.initialStock >= remainStock + soldQty
                  ? Number(prod.initialStock)
                  : remainStock + soldQty;
                const unitProfitOnline = bunkerP - costP;
                const unitProfitCrm = crmP - costP;
                const totalCostOfSold = soldQty * costP;
                const totalNetProfit = soldRevenue - totalCostOfSold;
                const totalStockCostValue = remainStock * costP;
                return {
                  prod,
                  costP,
                  bunkerP,
                  crmP,
                  soldQty,
                  soldRevenue,
                  remainStock,
                  totalInitialQty,
                  unitProfitOnline,
                  unitProfitCrm,
                  totalCostOfSold,
                  totalNetProfit,
                  totalStockCostValue,
                };
              });

              const grandTotalStockCost = rows.reduce((a, r) => a + r.totalStockCostValue, 0);
              const grandTotalSoldRevenue = rows.reduce((a, r) => a + r.soldRevenue, 0);
              const grandTotalSoldCost = rows.reduce((a, r) => a + r.totalCostOfSold, 0);
              const grandTotalNetProfit = rows.reduce((a, r) => a + r.totalNetProfit, 0);

              return (
                <div className="space-y-5 animate-fadeIn">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-[#0A1931] border-2 border-[#1E3A6D] p-4 rounded-2xl shadow-lg">
                      <span className="text-xs text-sky-200 block font-bold">1. Ombordagi Qoldiq Tan Narxi (Kirim):</span>
                      <span className="text-xl font-black text-amber-300 font-mono block mt-1">
                        {formatPrice(grandTotalStockCost)}
                      </span>
                      <span className="text-[11px] text-sky-300 block mt-1">
                        {companyProducts.length} xil mahsulot bo‘yicha
                      </span>
                    </div>

                    <div className="bg-[#0A1931] border-2 border-[#1E3A6D] p-4 rounded-2xl shadow-lg">
                      <span className="text-xs text-sky-200 block font-bold">2. Sotilgan Mahsulotlar Tan Narxi:</span>
                      <span className="text-xl font-black text-white font-mono block mt-1">
                        {formatPrice(grandTotalSoldCost)}
                      </span>
                      <span className="text-[11px] text-sky-300 block mt-1">
                        Keltirilgan (asl) narxda hisoblangan
                      </span>
                    </div>

                    <div className="bg-[#0A1931] border-2 border-[#1E3A6D] p-4 rounded-2xl shadow-lg">
                      <span className="text-xs text-sky-200 block font-bold">3. Sotilgan Mahsulotlar Tushumi (Chiqim):</span>
                      <span className="text-xl font-black text-[#FFB800] font-mono block mt-1">
                        {formatPrice(grandTotalSoldRevenue)}
                      </span>
                      <span className="text-[11px] text-sky-300 block mt-1">
                        Onlayn + CRM savdolar jami
                      </span>
                    </div>

                    <div className="bg-[#0A1931] border-2 border-emerald-500/50 p-4 rounded-2xl shadow-lg">
                      <span className="text-xs text-emerald-300 block font-bold">4. Jami Sof Foyda (Sotuv - Asl narx):</span>
                      <span className="text-xl font-black text-emerald-400 font-mono block mt-1">
                        {formatPrice(grandTotalNetProfit)}
                      </span>
                      <span className="text-[11px] text-emerald-200 block mt-1">
                        Sotilgan mahsulotlardan qolgan sof foyda
                      </span>
                    </div>
                  </div>

                  <div className="bg-[#0A1931] border-2 border-[#1E3A6D] rounded-3xl overflow-hidden shadow-2xl">
                    <div className="p-4 sm:p-5 border-b border-[#1E3A6D] flex flex-wrap items-center justify-between gap-3">
                      <h3 className="font-black text-white text-sm flex items-center gap-2">
                        <Calculator className="w-4 h-4 text-[#FFB800]" />
                        <span>4. Kirim-Chiqim Jadvali (Keltirilgan narx, Sotilayotgan narx va Sof Foyda tahlili)</span>
                      </h3>
                      <span className="text-xs text-sky-200 font-mono">
                        {rows.length} xil mahsulot
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-200">
                        <thead className="bg-[#071326] text-[#FFB800] uppercase text-[10px] tracking-wider border-b border-[#1E3A6D]">
                          <tr>
                            <th className="py-3.5 px-4 font-black">№</th>
                            <th className="py-3.5 px-4 font-black">Mahsulot nomi</th>
                            <th className="py-3.5 px-4 font-black">Asl (Keltirilgan) Narxi</th>
                            <th className="py-3.5 px-4 font-black">Sotilayotgan Narxi</th>
                            <th className="py-3.5 px-4 font-black">1 Birlikdan Foyda</th>
                            <th className="py-3.5 px-4 font-black">Ombordagi Mavjudligi</th>
                            <th className="py-3.5 px-4 font-black">Sotilgan Miqdor</th>
                            <th className="py-3.5 px-4 font-black">Jami Sotuv Summasi</th>
                            <th className="py-3.5 px-4 font-black">Jami Sof Foyda</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1E3A6D]/70 bg-[#0A1931] font-medium">
                          {rows.length === 0 ? (
                            <tr>
                              <td colSpan={9} className="py-12 text-center text-sky-200/70 text-xs">
                                Hozircha mahsulotlar kiritilmagan.
                              </td>
                            </tr>
                          ) : (
                            rows.map((r, i) => (
                              <tr key={r.prod.id} className="hover:bg-[#0F2547]/70 transition-colors">
                                <td className="py-3.5 px-4 font-mono font-black text-[#FFB800]">{i + 1}</td>
                                <td className="py-3.5 px-4">
                                  <div className="font-black text-white text-xs sm:text-sm">{r.prod.title}</div>
                                  <div className="text-[10px] text-amber-400 font-mono">{r.prod.category} • {r.prod.unit}</div>
                                </td>
                                <td className="py-3.5 px-4 font-mono whitespace-nowrap">
                                  <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-amber-300 font-black">
                                    {formatPrice(r.costP)}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 font-mono whitespace-nowrap space-y-1">
                                  <div className="text-white font-bold">
                                    Onlayn: <span className="text-[#FFB800] font-black">{formatPrice(r.bunkerP)}</span>
                                  </div>
                                  <div className="text-sky-200 text-[11px]">
                                    CRM: <span className="text-emerald-300 font-black">{formatPrice(r.crmP)}</span>
                                  </div>
                                </td>
                                <td className="py-3.5 px-4 font-mono whitespace-nowrap space-y-1">
                                  <div className={r.unitProfitOnline >= 0 ? 'text-emerald-400 font-black' : 'text-red-400 font-black'}>
                                    Onlayn: {r.unitProfitOnline >= 0 ? '+' : ''}{formatPrice(r.unitProfitOnline)}
                                  </div>
                                  <div className="text-[11px] text-emerald-300 font-bold">
                                    CRM: {r.unitProfitCrm >= 0 ? '+' : ''}{formatPrice(r.unitProfitCrm)}
                                  </div>
                                </td>
                                <td className="py-3.5 px-4 whitespace-nowrap">
                                  {r.remainStock <= 0 ? (
                                    <span className="px-2.5 py-1 rounded-xl bg-red-500/20 border border-red-400 text-red-300 font-black text-[11px]">
                                      Vaqtincha tugagan (0 {r.prod.unit})
                                    </span>
                                  ) : (
                                    <div className="space-y-0.5 font-mono">
                                      <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 font-black text-xs inline-block">
                                        Qoldiq: {r.remainStock} {r.prod.unit}
                                      </span>
                                      <div className="text-[10px] text-sky-300">
                                        Kirim: {r.totalInitialQty} {r.prod.unit}
                                      </div>
                                    </div>
                                  )}
                                </td>
                                <td className="py-3.5 px-4 font-mono font-bold text-white whitespace-nowrap">
                                  {r.soldQty} {r.prod.unit}
                                </td>
                                <td className="py-3.5 px-4 font-mono font-black text-[#FFB800] whitespace-nowrap">
                                  {formatPrice(r.soldRevenue)}
                                </td>
                                <td className="py-3.5 px-4 font-mono font-black whitespace-nowrap">
                                  <span className={`px-2.5 py-1 rounded-xl border ${
                                    r.totalNetProfit >= 0
                                      ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300'
                                      : 'bg-red-500/20 border-red-400/50 text-red-300'
                                  }`}>
                                    {r.totalNetProfit >= 0 ? '+' : ''}{formatPrice(r.totalNetProfit)}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Savdolar Jadvali — Har bir hisobot kunlik ajralib turadi */}
            {reportsSubTab !== 'kirim_chiqim' && (
            <div className="bg-[#0A1931] border-2 border-[#1E3A6D] rounded-3xl overflow-hidden shadow-2xl">
              <div className="p-4 sm:p-5 border-b border-[#1E3A6D] flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-black text-white text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#FFB800]" />
                  <span>
                    {reportsSubTab === 'general'
                      ? '1. Umumiy Monitoring Jadvali (Onlayn + CRM)'
                      : reportsSubTab === 'online'
                      ? '2. Onlayn Savdo Monitoringi Jadvali'
                      : '3. CRM Monitoringi Jadvali (CRM savdo)'}
                  </span>
                </h3>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-sky-200 font-mono">
                    {displayedReportSales.length} ta yozuv ({dailyGroupedReportSales.length} kun)
                  </span>
                  <button
                    type="button"
                    onClick={handleDownloadMonitoringPdf}
                    className="px-3.5 py-1.5 rounded-xl bg-[#FFB800] hover:bg-[#FFC928] text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer shadow"
                  >
                    <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>PDF yuklab olish</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-200">
                  <thead className="bg-[#071326] text-[#FFB800] uppercase text-[10px] tracking-wider border-b border-[#1E3A6D]">
                    <tr>
                      <th className="py-3.5 px-4 font-black">Sana</th>
                      <th className="py-3.5 px-4 font-black">Tizim / Kanal</th>
                      <th className="py-3.5 px-4 font-black">Mahsulot Nomi</th>
                      <th className="py-3.5 px-4 font-black">Miqdor</th>
                      <th className="py-3.5 px-4 font-black">Birlik Narxi</th>
                      <th className="py-3.5 px-4 font-black">Jami Summa</th>
                      {reportsSubTab !== 'offline' && (
                        <th className="py-3.5 px-4 font-black">Bunker Ulushi</th>
                      )}
                      <th className="py-3.5 px-4 font-black">Korxona Tushumi</th>
                      <th className="py-3.5 px-4 font-black">Xaridor / Mijoz</th>
                      <th className="py-3.5 px-4 font-black text-center">Holat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E3A6D]/70 bg-[#0A1931] font-medium">
                    {dailyGroupedReportSales.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-12 text-center text-sky-200/70 text-xs">
                          Tanlangan monitoring bo‘limida hozircha savdo qayd etilmagan.
                        </td>
                      </tr>
                    ) : (
                      dailyGroupedReportSales.map((dayGroup) => (
                        <React.Fragment key={dayGroup.day}>
                          {/* Kunlik Ajratuvchi Sarlavha Qatori */}
                          <tr className="bg-[#071326] border-y-2 border-[#FFB800]/50">
                            <td colSpan={reportsSubTab !== 'offline' ? 10 : 9} className="py-2.5 px-4">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2.5">
                                  <span className="px-3 py-1 rounded-lg bg-[#FFB800] text-slate-950 font-mono font-black text-xs shadow">
                                    {dayGroup.day}
                                  </span>
                                  <span className="text-xs font-black text-white uppercase tracking-wider">
                                    Kunlik Hisobot ({dayGroup.items.length} ta savdo)
                                  </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
                                  <span className="text-sky-200">
                                    Kunlik jami: <strong className="text-[#FFB800] font-black">{formatPrice(dayGroup.totalSum)}</strong>
                                  </span>
                                  {reportsSubTab !== 'offline' && (
                                    <span className="text-emerald-300">
                                      Bunker ulushi: <strong className="font-black">{formatPrice(dayGroup.commissionSum)}</strong>
                                    </span>
                                  )}
                                  <span className="text-white">
                                    Korxona tushumi: <strong className="text-emerald-400 font-black">{formatPrice(dayGroup.netSum)}</strong>
                                  </span>
                                </div>
                              </div>
                            </td>
                          </tr>

                          {/* Shu kunga tegishli savdolar */}
                          {dayGroup.items.map((sale) => {
                            const isOfflineSale = sale.orderChannel === 'offline';
                            const itemCommission = getSaleItemBunkerCommission(sale);
                            const itemNet = Math.max(0, (Number(sale.totalSum) || 0) - itemCommission);
                            return (
                              <tr key={sale.id} className="hover:bg-[#0F2547]/70 transition-colors">
                                <td className="py-3 px-4 text-sky-200 font-mono text-[11px] whitespace-nowrap">
                                  {sale.date}
                                </td>
                                <td className="py-3 px-4">
                                  <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase border ${
                                    isOfflineSale
                                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                      : 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                                  }`}>
                                    {isOfflineSale ? 'CRM savdo' : 'Onlayn Bunker'}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-white font-bold">
                                  <div>{sale.productTitle}</div>
                                  <div className="text-[10px] text-amber-400 font-mono">{sale.category}</div>
                                </td>
                                <td className="py-3 px-4 font-mono font-bold text-white whitespace-nowrap">
                                  {sale.quantity} {sale.unit}
                                </td>
                                <td className="py-3 px-4 font-mono text-slate-300 whitespace-nowrap">
                                  {formatPrice(sale.price)}
                                </td>
                                <td className="py-3 px-4 font-mono font-black text-[#FFB800] whitespace-nowrap">
                                  {formatPrice(sale.totalSum)}
                                </td>
                                {reportsSubTab !== 'offline' && (
                                  <td className="py-3 px-4 font-mono whitespace-nowrap">
                                    {isOfflineSale ? (
                                      <span className="text-[11px] text-slate-400 font-bold">
                                        0 so‘m (CRM)
                                      </span>
                                    ) : (
                                      <span className="text-emerald-400 font-black">
                                        {formatPrice(itemCommission)}
                                      </span>
                                    )}
                                  </td>
                                )}
                                <td className="py-3 px-4 font-mono font-black text-emerald-300 whitespace-nowrap">
                                  {formatPrice(itemNet)}
                                </td>
                                <td className="py-3 px-4">
                                  <span className="text-white font-bold block">{formatBuyerDisplayName(sale.buyerName)}</span>
                                  <span className="text-[10px] text-sky-200 font-mono block">{sale.buyerPhone}</span>
                                  {!isOfflineSale && sale.deliveryAddress && (
                                    <div className="flex items-center gap-1.5 mt-1">
                                      <span className="text-[11px] text-sky-300 font-medium">
                                        {formatRegionAndDistrictOnly(sale.deliveryAddress)}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setSelectedMapCustomer({
                                            name: formatBuyerDisplayName(sale.buyerName),
                                            phone: sale.buyerPhone,
                                            address: sale.deliveryAddress || '',
                                            coords: extractCoordsFromAddress(sale.deliveryAddress || ''),
                                          })
                                        }
                                        title="Xaritadan ko‘rish"
                                        className="p-1 rounded-lg bg-amber-500/20 hover:bg-[#FFB800] text-[#FFB800] hover:text-slate-950 border border-amber-500/40 transition-colors cursor-pointer shrink-0"
                                      >
                                        <MapPin className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  )}
                                  {sale.driverPhone && (
                                    <span className="text-[10px] text-emerald-400 font-mono font-bold block mt-0.5">
                                      Yetkazib beruvchi: {sale.driverPhone}
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-4 text-center">
                                  {sale.status === 'assigned' ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/25 text-amber-300 border border-amber-400/50 animate-pulse">
                                      Yuklash jarayonida
                                    </span>
                                  ) : sale.status === 'in_transit' ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-400/40">
                                      Yetkazilmoqda
                                    </span>
                                  ) : sale.status === 'pending' ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                      Buyurtma berildi
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                      Yetkazilgan
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </React.Fragment>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            )}

            {/* Yetkazib Berish Marshrutlari — Faqat Onlayn savdo monitoringi bo'limida ko'rsatiladi */}
            {reportsSubTab === 'online' && (
              <div className="bg-[#0A1931] border-2 border-[#1E3A6D] rounded-3xl overflow-hidden shadow-xl">
                <div className="p-4 sm:p-5 border-b border-[#1E3A6D]">
                  <h3 className="font-black text-white text-sm flex items-center gap-2">
                    <Truck className="w-4 h-4 text-emerald-400" />
                    <span>Logistika va Yetkazib Berish Yo‘nalishlari (Onlayn buyurtmalar)</span>
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-[#071326] text-sky-200 uppercase text-[10px] tracking-wider border-b border-[#1E3A6D]">
                      <tr>
                        <th className="py-3 px-4 font-black">Jo‘natilgan Manzil</th>
                        <th className="py-3 px-4 font-black">Qabul Ob'ekti (Viloyat / Tuman)</th>
                        <th className="py-3 px-4 font-black">Yuk Hajmi</th>
                        <th className="py-3 px-4 font-black">Haydovchi / Mashina</th>
                        <th className="py-3 px-4 font-black text-center">Holat</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1E3A6D]/70 bg-[#0A1931]">
                      {supplierReport.routes
                        .filter((rt) => !String(rt.toLocation || '').toLowerCase().includes('crm oflayn savdo'))
                        .map((rt) => (
                          <tr key={rt.id} className="hover:bg-[#0F2547]/70 transition-colors">
                            <td className="py-3 px-4 text-slate-300">
                              {rt.fromLocation}
                            </td>
                            <td className="py-3 px-4 text-white font-bold">
                              <div className="flex items-center gap-2">
                                <span>{formatRegionAndDistrictOnly(rt.toLocation)}</span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSelectedMapCustomer({
                                      name: rt.productTitle,
                                      phone: rt.driverPhone,
                                      address: rt.toLocation,
                                      coords: extractCoordsFromAddress(rt.toLocation),
                                    })
                                  }
                                  title="Xaritadan ko‘rish"
                                  className="p-1.5 rounded-lg bg-amber-500/20 hover:bg-[#FFB800] text-[#FFB800] hover:text-slate-950 border border-amber-500/40 transition-colors cursor-pointer shrink-0"
                                >
                                  <MapPin className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                            <td className="py-3 px-4 font-mono text-amber-300">
                              {rt.quantityText}
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-white block font-medium">{rt.driverName} ({rt.vehicle})</span>
                              <span className="text-[10px] text-emerald-400 font-mono font-bold">{rt.driverPhone}</span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              {rt.status === 'assigned' ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/25 text-amber-300 border border-amber-400/50 animate-pulse">
                                  Yuklash jarayonida
                                </span>
                              ) : rt.status === 'in_transit' ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-sky-500/20 text-sky-300 border border-sky-400/40">
                                  Yetkazilmoqda
                                </span>
                              ) : rt.status === 'pending' ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                  Buyurtma berildi
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                  Yetkazildi
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        )}

        {/* Tab 3: B2B Mijozlar (Mijoz so'rovlari va B2B hamkor buyurtmalari shu bo'limga kelib tushadi) */}
        {activeTab === 'customers' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-[#0A1931] border-2 border-[#1E3A6D] p-6 rounded-3xl space-y-5 shadow-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-[#FFB800] font-bold text-xs uppercase tracking-wider">
                    <Users className="w-4 h-4" />
                    <span>B2B Mijozlar va Mijoz So‘rovlari</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                    «{supplierData.companyName}» — B2B Mijozlar
                  </h2>
                  <p className="text-xs text-sky-200 mt-0.5">
                    Onlayn mijoz so‘rovlari hamda B2B hamkorlardan kelib tushgan barcha buyurtma so‘rovlari
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="px-4 py-2 rounded-2xl bg-[#FFB800]/15 border border-[#FFB800]/40 text-[#FFB800] text-xs font-mono font-black">
                    Jami so‘rovlar: {supplierCustomers.length + incomingManufacturerB2bOrders.length} ta
                  </div>
                </div>
              </div>

              {/* 2 TA SUB-TAB: 1) Mijozlar so'rovi (Platforma foydalanuvchilaridan), 2) B2B mijoz so'rovlari (B2B va B2C kabinetlardan) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-[#1E3A6D]">
                <button
                  type="button"
                  onClick={() => setCustomersSubTab('regular')}
                  className={`p-3.5 rounded-2xl border font-black text-xs sm:text-sm flex items-center justify-between cursor-pointer transition-all ${
                    customersSubTab === 'regular'
                      ? 'bg-red-600 text-white border-red-400 shadow-[0_0_16px_rgba(220,38,38,0.45)]'
                      : 'bg-[#071326] hover:bg-[#0F2547] text-sky-100 border-[#1E3A6D]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 text-left">
                    <Users className={`w-4 h-4 shrink-0 ${customersSubTab === 'regular' ? 'text-white' : 'text-[#FFB800]'}`} />
                    <div>
                      <span className="block">1. Mijozlar so‘rovi</span>
                      <span className="block text-[10px] font-medium opacity-80">
                        Platforma foydalanuvchilaridan kelgan so‘rovlar
                      </span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-black shrink-0 ${
                    customersSubTab === 'regular' ? 'bg-white text-red-700' : 'bg-[#0F2547] text-amber-400'
                  }`}>
                    {supplierCustomers.length} ta
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setCustomersSubTab('b2b_suppliers')}
                  className={`p-3.5 rounded-2xl border font-black text-xs sm:text-sm flex items-center justify-between cursor-pointer transition-all ${
                    customersSubTab === 'b2b_suppliers'
                      ? 'bg-red-600 text-white border-red-400 shadow-[0_0_16px_rgba(220,38,38,0.45)]'
                      : pendingIncomingB2bCount > 0
                      ? 'bg-gradient-to-r from-emerald-500/35 via-amber-500/35 to-emerald-500/35 text-white border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.5)] animate-pulse'
                      : 'bg-[#071326] hover:bg-[#0F2547] text-sky-100 border-[#1E3A6D]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 text-left">
                    <Building className={`w-4 h-4 shrink-0 ${customersSubTab === 'b2b_suppliers' ? 'text-white' : 'text-emerald-400'}`} />
                    <div>
                      <span className="block">2. B2B mijoz so‘rovlari</span>
                      <span className="block text-[10px] font-medium opacity-80">
                        B2B va B2C kabinetlardan kelgan so‘rovlar
                      </span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-black shrink-0 ${
                    customersSubTab === 'b2b_suppliers' ? 'bg-white text-red-700' : 'bg-[#0F2547] text-emerald-400'
                  }`}>
                    {incomingManufacturerB2bOrders.length} ta
                  </span>
                </button>
              </div>
            </div>

            {/* SUB-TAB 1: MIJOZLAR SO'ROVI (PLATFORMA FOYDALANUVCHILARIDAN KELGAN SO'ROVLAR) */}
            {customersSubTab === 'regular' && (
              supplierCustomers.length === 0 ? (
                <div className="text-center py-16 bg-slate-950 rounded-3xl border-2 border-slate-900 p-8 space-y-3 shadow-2xl">
                  <Users className="w-12 h-12 text-[#FFB800] mx-auto" />
                  <p className="text-white font-bold text-sm">Hozircha platforma foydalanuvchilaridan so‘rovlar kelib tushmagan.</p>
                  <p className="text-slate-400 text-xs">Platforma foydalanuvchilari mahsulotlaringizga buyurtma berganda shu yerda aks etadi.</p>
                </div>
              ) : (
                <div className="bg-slate-950 border-2 border-slate-900 rounded-3xl overflow-hidden shadow-2xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-900 text-[#FFB800] uppercase text-[10px] tracking-wider border-b border-slate-800">
                        <tr>
                          <th className="py-3.5 px-4 font-black">#</th>
                          <th className="py-3.5 px-4 font-black">Mijoz Ism-Familiyasi</th>
                          <th className="py-3.5 px-4 font-black">Telefon Raqami</th>
                          <th className="py-3.5 px-4 font-black">Yetkazish Manzili</th>
                          <th className="py-3.5 px-4 font-black">Olingan Mahsulotlar</th>
                          <th className="py-3.5 px-4 font-black">Buyurtmalar</th>
                          <th className="py-3.5 px-4 font-black">Jami Xarid Summasi</th>
                          <th className="py-3.5 px-4 font-black">Oxirgi Xarid</th>
                          <th className="py-3.5 px-4 font-black text-center">Holat va Boshqaruv</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80 bg-slate-950 font-medium">
                        {supplierCustomers.map((cust, index) => (
                          <tr key={cust.id} className="hover:bg-slate-900/80 transition-colors">
                            <td className="py-3.5 px-4 font-mono font-bold text-[#FFB800]">
                              {index + 1}
                            </td>
                            <td className="py-3.5 px-4 text-white font-bold">
                              {cust.name}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-emerald-400 font-bold whitespace-nowrap">
                              {cust.phone}
                            </td>
                            <td className="py-3.5 px-4 text-slate-300 min-w-[200px]">
                              <div className="flex items-center justify-between gap-2 bg-slate-900/80 border border-slate-800 px-3 py-2 rounded-xl">
                                <span className="text-xs text-white font-bold leading-snug">
                                  {formatRegionAndDistrictOnly(cust.address)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSelectedMapCustomer({
                                      name: cust.name,
                                      phone: cust.phone,
                                      address: cust.address,
                                      coords: cust.coords,
                                    })
                                  }
                                  title="Xaritadan ko‘rish"
                                  className="p-2 rounded-xl bg-[#FFB800]/20 hover:bg-[#FFB800] text-[#FFB800] hover:text-slate-950 border border-[#FFB800]/50 cursor-pointer transition-all shadow-sm active:scale-95 shrink-0"
                                >
                                  <MapPin className="w-4 h-4 stroke-[2.3]" />
                                </button>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-slate-200 max-w-xs">
                              <div className="truncate" title={cust.productsBought.join(', ')}>
                                {cust.productsBought.join(', ') || '—'}
                              </div>
                              <button
                                type="button"
                                onClick={() => handlePrintOrDownloadCustomerOrderPdf(cust)}
                                className="mt-1.5 px-2.5 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500 hover:text-slate-950 text-sky-300 border border-sky-500/40 font-black text-[10px] inline-flex items-center gap-1 cursor-pointer transition-all"
                              >
                                <Download className="w-3 h-3" />
                                <span>Ro‘yxatni PDF chiqarib olish</span>
                              </button>
                            </td>
                            <td className="py-3.5 px-4 font-mono font-bold text-white whitespace-nowrap">
                              {cust.ordersCount} ta ({cust.totalQty} ta mahsulot)
                            </td>
                            <td className="py-3.5 px-4 font-mono font-black text-[#FFB800] whitespace-nowrap">
                              {formatPrice(cust.totalSpent)}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                              {cust.lastOrderDate}
                            </td>
                            <td className="py-3.5 px-4 text-center whitespace-nowrap">
                              {(cust.status === 'pending' || cust.status === 'confirmed') && (
                                <div className="flex flex-col items-center gap-1.5">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/25 text-emerald-300 border border-emerald-400/60 animate-pulse">
                                    🔔 Yangi so‘rov!
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateCustomerOrderStatus(cust.orderIds, 'assigned')}
                                    className="px-3.5 py-2 rounded-xl bg-[#FFB800] hover:bg-[#FFC928] text-slate-950 font-black text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-[0_0_16px_rgba(255,184,0,0.45)] active:scale-95 transition-all"
                                  >
                                    <Package className="w-3.5 h-3.5 stroke-[2.5]" />
                                    <span>Mahsulotlarni tayyorlash jarayoni</span>
                                  </button>
                                </div>
                              )}

                              {cust.status === 'assigned' && (
                                <div className="flex flex-col items-center gap-2 min-w-[240px] p-2.5 rounded-2xl bg-slate-900/90 border border-amber-500/40">
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-400/50 animate-pulse">
                                    Mahsulot yuklash jarayonida
                                  </span>
                                  <div className="w-full space-y-1 text-left">
                                    <label className="text-[10px] font-bold text-slate-300 block">
                                      Yetkazib beruvchi nomeri:
                                    </label>
                                    <input
                                      type="text"
                                      value={
                                        driverPhoneInputs[cust.id] !== undefined
                                          ? driverPhoneInputs[cust.id]
                                          : cust.driverPhone || '+998 '
                                      }
                                      onChange={(e) => {
                                        setDriverPhoneInputs((prev) => ({
                                          ...prev,
                                          [cust.id]: formatUzPhoneInput(e.target.value),
                                        }));
                                        if (driverPhoneErrors[cust.id]) {
                                          setDriverPhoneErrors((prev) => {
                                            const n = { ...prev };
                                            delete n[cust.id];
                                            return n;
                                          });
                                        }
                                      }}
                                      placeholder="+998 90 123 45 67"
                                      className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-amber-500/50 focus:border-emerald-400 text-white font-mono text-xs focus:outline-none"
                                    />
                                    {driverPhoneErrors[cust.id] && (
                                      <span className="text-[10px] text-red-400 font-bold block">
                                        {driverPhoneErrors[cust.id]}
                                      </span>
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleConfirmWithDriverPhone(cust.id, cust.orderIds, cust.driverPhone)
                                    }
                                    className="w-full px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-lg active:scale-95 transition-all"
                                  >
                                    <Truck className="w-3.5 h-3.5 stroke-[2.5]" />
                                    <span>Mahsulotni manzilga yuborish</span>
                                  </button>
                                </div>
                              )}

                              {cust.status === 'in_transit' && (
                                <div className="flex flex-col items-center gap-1.5 min-w-[220px] p-2.5 rounded-2xl bg-slate-900/90 border border-sky-500/40">
                                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-sky-500/20 text-sky-300 border border-sky-400/40 inline-flex items-center gap-1">
                                    <Truck className="w-3 h-3" /> Yetkazilmoqda
                                  </span>
                                  {cust.driverPhone && (
                                    <div className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-emerald-500/40 text-left">
                                      <span className="text-[9px] text-slate-400 uppercase font-bold block">
                                        Bog‘lanish uchun tel nomer:
                                      </span>
                                      <span className="font-mono font-black text-xs text-emerald-400 block">
                                        {cust.driverPhone}
                                      </span>
                                    </div>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateCustomerOrderStatus(cust.orderIds, 'delivered')}
                                    className="w-full px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 hover:text-slate-950 text-emerald-300 border border-emerald-500/40 font-bold text-[10px] cursor-pointer transition-colors"
                                  >
                                    ✓ Yetkazildi deb belgilash
                                  </button>
                                </div>
                              )}

                              {cust.status === 'delivered' && (
                                <div className="flex flex-col items-center gap-1.5">
                                  <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 inline-flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Yetkazilgan
                                  </span>
                                  {cust.driverPhone && (
                                    <span className="text-[10px] font-mono font-bold text-emerald-300">
                                      Bog‘lanish uchun tel nomer: {cust.driverPhone}
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            )}

            {/* SUB-TAB 2: B2B MIJOZ SO'ROVLARI (B2B va B2C kabinetlardan kelgan so'rovlar) */}
            {customersSubTab === 'b2b_suppliers' && (
              incomingManufacturerB2bOrders.length === 0 ? (
                <div className="text-center py-16 bg-slate-950 rounded-3xl border-2 border-slate-900 p-8 space-y-3 shadow-2xl">
                  <Building className="w-12 h-12 text-emerald-400 mx-auto" />
                  <p className="text-white font-bold text-sm">
                    Hozircha B2B va B2C kabinetlardan mahsulot so‘rovlari kelib tushmagan.
                  </p>
                  <p className="text-slate-400 text-xs max-w-md mx-auto">
                    B2B va B2C kabinetlar mahsulotlaringizni savatga yuklab «So‘rov yuborish» tugmasini bosganda, so‘rovlar korxona ma'lumotlari va PDF ro‘yxati bilan shu yerda ko‘rinadi.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {incomingManufacturerB2bOrders.map((b2bOrd) => (
                    <div
                      key={b2bOrd.id}
                      className="bg-slate-950 border-2 border-slate-800 hover:border-amber-500/50 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl transition-all"
                    >
                      {/* Top Header: Buying B2C/B2B Cabinet Details + Status + Actions */}
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 pb-4 border-b border-slate-800">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/20 text-[#FFB800] border border-amber-500/40 font-mono font-black text-xs">
                              #{b2bOrd.id}
                            </span>
                            <span className="text-xs text-slate-400 font-mono">
                              {new Date(b2bOrd.createdAt).toLocaleString('uz-UZ')}
                            </span>
                            {b2bOrd.status === 'requested' && (
                              <span className="px-3 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500 text-slate-950 animate-pulse">
                                🔔 Yangi B2C So‘rov (Qabul qilish kutilmoqda)
                              </span>
                            )}
                            {b2bOrd.status === 'approved_awaiting_payment' && (
                              <span className="px-3 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-400/50 animate-pulse">
                                ⏳ So‘rov qabul qilindi — B2C to‘lovi kutilmoqda
                              </span>
                            )}
                            {b2bOrd.status === 'paid' && (
                              <span className="px-3 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500 text-slate-950 animate-pulse">
                                💳 To‘lov qilindi — Tayyorlashni boshlang!
                              </span>
                            )}
                            {b2bOrd.status === 'preparing' && (
                              <span className="px-3 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-400/50 animate-pulse">
                                📦 Mahsulot yuklash jarayonida
                              </span>
                            )}
                            {(b2bOrd.status === 'in_transit' || b2bOrd.status === 'paid_shipped') && (
                              <span className="px-3 py-0.5 rounded-full text-[10px] font-black uppercase bg-sky-500/20 text-sky-300 border border-sky-400/40">
                                🚚 Yetkazilmoqda
                              </span>
                            )}
                            {b2bOrd.status === 'delivered' && (
                              <span className="px-3 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                                ✅ Yetkazilgan (Yakunlangan)
                              </span>
                            )}
                          </div>

                          <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                            <Building className="w-5 h-5 text-[#FFB800] shrink-0" />
                            <span>So‘rov yuborgan B2C kabinet: «{b2bOrd.buyerCompanyName}»</span>
                          </h3>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
                            <span>STIR: <strong className="text-[#FFB800] font-mono">{b2bOrd.buyerInn || '—'}</strong></span>
                            <span>Rahbar: <strong className="text-white">{b2bOrd.buyerDirector || '—'}</strong></span>
                            <span>Tel: <strong className="text-emerald-400 font-mono">{b2bOrd.buyerPhone}</strong></span>
                            <span>Manzil: <strong className="text-sky-300">{b2bOrd.buyerAddress || b2bOrd.buyerRegion}</strong></span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => setPreviewB2bManifest(b2bOrd)}
                            className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/40 font-black text-xs flex items-center gap-1.5 cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                            <span>Hujjatni ko‘rish</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handlePrintOrDownloadB2bPdf(b2bOrd)}
                            className="px-4 py-2.5 rounded-xl bg-sky-500/20 hover:bg-sky-500 hover:text-slate-950 text-sky-300 border border-sky-500/40 font-black text-xs flex items-center gap-1.5 cursor-pointer transition-all"
                          >
                            <Download className="w-4 h-4" />
                            <span>Ro‘yxatni PDF chiqarib olish</span>
                          </button>

                          {/* 1-BOSQICH: So'rov kelganda qabul qilish va B2C kabinetga Hisob raqam ma'lumotlarini jo'natish */}
                          {b2bOrd.status === 'requested' && (
                            <div className="w-full sm:w-auto flex flex-col gap-2 p-3 rounded-2xl bg-slate-900 border-2 border-amber-500/60 min-w-[290px]">
                              <label className="text-[10px] font-black text-amber-300 uppercase">
                                B2C kabinetga Hisob raqam ma'lumotlarini jo‘natish:
                              </label>
                              <input
                                type="text"
                                value={
                                  b2bBankAccountInputs[b2bOrd.id] !== undefined
                                    ? b2bBankAccountInputs[b2bOrd.id]
                                    : b2bOrd.bankAccountDetails || getDefaultB2bBankAccountText(b2bOrd)
                                }
                                onChange={(e) => {
                                  setB2bBankAccountInputs((prev) => ({
                                    ...prev,
                                    [b2bOrd.id]: e.target.value,
                                  }));
                                  if (b2bBankAccountErrors[b2bOrd.id]) {
                                    setB2bBankAccountErrors((prev) => {
                                      const n = { ...prev };
                                      delete n[b2bOrd.id];
                                      return n;
                                    });
                                  }
                                }}
                                placeholder="H/R: 2020 8000 ... | MFO: ... | Bank nomi..."
                                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-amber-500/50 focus:border-emerald-400 text-white font-mono text-xs focus:outline-none"
                              />
                              {b2bBankAccountErrors[b2bOrd.id] && (
                                <span className="text-[10px] text-red-400 font-bold block">
                                  {b2bBankAccountErrors[b2bOrd.id]}
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => handleAcceptB2bRequestAndSendBankDetails(b2bOrd.id)}
                                className="w-full px-4 py-2.5 rounded-xl bg-[#FFB800] hover:bg-[#FFC928] text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/30 active:scale-95 transition-all"
                              >
                                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                                <span>So‘rovni qabul qilish va Hisob raqam jo‘natish</span>
                              </button>
                            </div>
                          )}

                          {/* 2-BOSQICH: So'rov qabul qilindi va Hisob raqam jo'natildi -> B2C to'lovi kutilmoqda */}
                          {b2bOrd.status === 'approved_awaiting_payment' && (
                            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-xs space-y-1 max-w-md">
                              <div className="text-amber-300 font-black flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 shrink-0" />
                                <span>So‘rov qabul qilindi — B2C kabinet to‘lovi kutilmoqda</span>
                              </div>
                              {b2bOrd.bankAccountDetails && (
                                <div className="text-[11px] font-mono text-emerald-300 bg-slate-950/90 px-2.5 py-1.5 rounded-lg border border-slate-800">
                                  Jo‘natilgan hisob raqam: {b2bOrd.bankAccountDetails}
                                </div>
                              )}
                              <div className="text-[10px] text-slate-400">
                                B2C kabinet to‘lovni jo‘natgach, tayyorlash va manzilga yuborish jarayoni davom etadi.
                              </div>
                            </div>
                          )}

                          {/* 3-BOSQICH: B2C kabinet to'lovni jo'natdi -> Jarayon davom etadi ("Mahsulotlarni tayyorlash jarayoni") */}
                          {b2bOrd.status === 'paid' && (
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 p-3 rounded-2xl bg-emerald-500/15 border-2 border-emerald-400">
                              <div className="text-xs">
                                <span className="text-emerald-300 font-black block">
                                  💳 B2C kabinet to‘lovni jo‘natdi!
                                </span>
                                <span className="text-[11px] text-slate-300 block">
                                  Endi mahsulotlarni tayyorlash jarayonini boshlang:
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleStartPreparingB2bOrder(b2bOrd.id)}
                                className="px-5 py-2.5 rounded-xl bg-[#FFB800] hover:bg-[#FFC928] text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/30 active:scale-95 transition-all"
                              >
                                <Package className="w-4 h-4 stroke-[2.5]" />
                                <span>Mahsulotlarni tayyorlash jarayoni</span>
                              </button>
                            </div>
                          )}

                          {/* 4-BOSQICH: Tayyorlash jarayonida -> Yetkazib beruvchi nomerini kiritib Manzilga yuborish */}
                          {b2bOrd.status === 'preparing' && (
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2.5 rounded-2xl bg-slate-900 border border-amber-500/40">
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-amber-300 block">
                                  Yetkazib beruvchi nomeri:
                                </label>
                                <input
                                  type="text"
                                  value={
                                    driverPhoneInputs[b2bOrd.id] !== undefined
                                      ? driverPhoneInputs[b2bOrd.id]
                                      : b2bOrd.driverPhone || '+998 '
                                  }
                                  onChange={(e) => {
                                    setDriverPhoneInputs((prev) => ({
                                      ...prev,
                                      [b2bOrd.id]: formatUzPhoneInput(e.target.value),
                                    }));
                                    if (driverPhoneErrors[b2bOrd.id]) {
                                      setDriverPhoneErrors((prev) => {
                                        const n = { ...prev };
                                        delete n[b2bOrd.id];
                                        return n;
                                      });
                                    }
                                  }}
                                  placeholder="+998 90 123 45 67"
                                  className="px-3 py-1.5 rounded-xl bg-slate-950 border border-amber-500/50 focus:border-emerald-400 text-white font-mono text-xs focus:outline-none"
                                />
                                {driverPhoneErrors[b2bOrd.id] && (
                                  <span className="text-[10px] text-red-400 font-bold block">
                                    {driverPhoneErrors[b2bOrd.id]}
                                  </span>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleShipB2bOrderWithDriverPhone(b2bOrd.id, b2bOrd.driverPhone)}
                                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg active:scale-95 transition-all"
                              >
                                <Truck className="w-4 h-4 stroke-[2.5]" />
                                <span>Mahsulotni manzilga yuborish</span>
                              </button>
                            </div>
                          )}

                          {/* 5-BOSQICH: Yetkazilmoqda */}
                          {(b2bOrd.status === 'in_transit' || b2bOrd.status === 'paid_shipped') && (
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-xs">
                              <div>
                                <span className="text-sky-300 font-black block">🚚 Yetkazilmoqda</span>
                                {b2bOrd.driverPhone && (
                                  <span className="text-emerald-400 font-mono font-black block">
                                    Bog‘lanish uchun tel nomer: {b2bOrd.driverPhone}
                                  </span>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleMarkB2bOrderDelivered(b2bOrd.id)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[11px] cursor-pointer transition-colors"
                              >
                                ✓ Yetkazildi deb belgilash
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Olinayotgan yuklar jadvali */}
                      <div className="overflow-x-auto rounded-2xl border border-slate-800">
                        <table className="w-full text-left text-xs text-slate-300">
                          <thead className="bg-slate-900 text-slate-400 uppercase text-[10px]">
                            <tr>
                              <th className="py-2.5 px-3 font-black">№</th>
                              <th className="py-2.5 px-3 font-black">Olinayotgan Yuk (Mahsulot)</th>
                              <th className="py-2.5 px-3 font-black">Xususiyat / Rang</th>
                              <th className="py-2.5 px-3 font-black">Miqdori</th>
                              <th className="py-2.5 px-3 font-black">Narxi</th>
                              <th className="py-2.5 px-3 font-black text-right">Jami Summa</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/70 bg-slate-950">
                            {b2bOrd.items.map((item, idx) => (
                              <tr key={`${b2bOrd.id}-${idx}`}>
                                <td className="py-2.5 px-3 font-mono font-bold text-amber-400">{idx + 1}</td>
                                <td className="py-2.5 px-3 font-bold text-white">{item.title}</td>
                                <td className="py-2.5 px-3 text-slate-300">
                                  {[item.specification, item.color].filter(Boolean).join(' • ') || 'Standart'}
                                </td>
                                <td className="py-2.5 px-3 font-mono font-black text-amber-300">
                                  {item.quantity} {item.unit}
                                </td>
                                <td className="py-2.5 px-3 font-mono">{formatPrice(item.price)}</td>
                                <td className="py-2.5 px-3 font-mono font-black text-emerald-400 text-right">
                                  {formatPrice(item.totalSum)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="flex items-center justify-between pt-2 text-xs">
                        <span className="text-slate-400">
                          Jami yuk turlari: <strong className="text-white">{b2bOrd.items.length} xil</strong>
                        </span>
                        <div className="text-sm sm:text-base font-black text-white">
                          Jami B2B Hisob Summasi:{' '}
                          <span className="text-emerald-400 font-mono">{formatPrice(b2bOrd.totalAmount)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        )}

        {/* Tab: B2B buyurtmalar (B2B Kabineti uchun) */}
        {activeTab === 'b2b_orders' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-slate-950 border-2 border-slate-900 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 shadow-2xl">
              <div className="flex items-center gap-3.5">
                <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Building className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg sm:text-xl font-black text-white">B2B mijoz so‘rovlari</h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      B2B va B2C kabinetlardan
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    B2B va B2C kabinetlardan kelgan mahsulot so‘rovlari, hisob raqam jo‘natish, tayyorlash jarayoni va manzilga yuborish ({incomingManufacturerB2bOrders.length} ta)
                  </p>
                </div>
              </div>
              <div className="px-4 py-2 rounded-2xl bg-[#FFB800]/15 border border-[#FFB800]/40 text-[#FFB800] text-xs font-mono font-black shrink-0 self-start sm:self-auto">
                Jami B2B so‘rovlar: {incomingManufacturerB2bOrders.length} ta
              </div>
            </div>

            {incomingManufacturerB2bOrders.length === 0 ? (
              <div className="text-center py-16 bg-slate-950 rounded-3xl border-2 border-slate-900 p-8 space-y-3 shadow-2xl">
                <Building className="w-12 h-12 text-amber-400 mx-auto" />
                <p className="text-white font-bold text-sm">
                  Hozircha B2B va B2C kabinetlardan so‘rovlar kelib tushmagan.
                </p>
                <p className="text-slate-400 text-xs max-w-md mx-auto">
                  B2C kabinetlar sizning mahsulotlaringizni savatga yuklab «So‘rov yuborish» tugmasini bosganda, buyurtmalar korxona ma'lumotlari va PDF ro‘yxati bilan shu yerda ko‘rinadi.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {incomingManufacturerB2bOrders.map((b2bOrd) => (
                  <div
                    key={b2bOrd.id}
                    className="bg-slate-950 border-2 border-slate-800 hover:border-amber-500/50 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl transition-all"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 pb-4 border-b border-slate-800">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/20 text-[#FFB800] border border-amber-500/40 font-mono font-black text-xs">
                            #{b2bOrd.id}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">
                            {new Date(b2bOrd.createdAt).toLocaleString('uz-UZ')}
                          </span>
                          {b2bOrd.status === 'requested' && (
                            <span className="px-3 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500 text-slate-950 animate-pulse">
                              🔔 Yangi B2C So‘rov (Qabul qilish kutilmoqda)
                            </span>
                          )}
                          {b2bOrd.status === 'approved_awaiting_payment' && (
                            <span className="px-3 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-400/50 animate-pulse">
                              ⏳ So‘rov qabul qilindi — B2C to‘lovi kutilmoqda
                            </span>
                          )}
                          {b2bOrd.status === 'paid' && (
                            <span className="px-3 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500 text-slate-950 animate-pulse">
                              💳 To‘lov qilindi — Tayyorlashni boshlang!
                            </span>
                          )}
                          {b2bOrd.status === 'preparing' && (
                            <span className="px-3 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-400/50 animate-pulse">
                              📦 Mahsulot yuklash jarayonida
                            </span>
                          )}
                          {(b2bOrd.status === 'in_transit' || b2bOrd.status === 'paid_shipped') && (
                            <span className="px-3 py-0.5 rounded-full text-[10px] font-black uppercase bg-sky-500/20 text-sky-300 border border-sky-400/40">
                              🚚 Yetkazilmoqda
                            </span>
                          )}
                          {b2bOrd.status === 'delivered' && (
                            <span className="px-3 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                              ✅ Yetkazilgan (Yakunlangan)
                            </span>
                          )}
                        </div>

                        <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                          <Building className="w-5 h-5 text-[#FFB800] shrink-0" />
                          <span>So‘rov yuborgan B2C kabinet: «{b2bOrd.buyerCompanyName}»</span>
                        </h3>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
                          <span>STIR: <strong className="text-[#FFB800] font-mono">{b2bOrd.buyerInn || '—'}</strong></span>
                          <span>Rahbar: <strong className="text-white">{b2bOrd.buyerDirector || '—'}</strong></span>
                          <span>Tel: <strong className="text-emerald-400 font-mono">{b2bOrd.buyerPhone}</strong></span>
                          <span>Manzil: <strong className="text-sky-300">{b2bOrd.buyerAddress || b2bOrd.buyerRegion}</strong></span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setPreviewB2bManifest(b2bOrd)}
                          className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/40 font-black text-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Hujjatni ko‘rish</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handlePrintOrDownloadB2bPdf(b2bOrd)}
                          className="px-4 py-2.5 rounded-xl bg-sky-500/20 hover:bg-sky-500 hover:text-slate-950 text-sky-300 border border-sky-500/40 font-black text-xs flex items-center gap-1.5 cursor-pointer transition-all"
                        >
                          <Download className="w-4 h-4" />
                          <span>Ro‘yxatni PDF chiqarib olish</span>
                        </button>

                        {b2bOrd.status === 'requested' && (
                          <div className="w-full sm:w-auto flex flex-col gap-2 p-3 rounded-2xl bg-slate-900 border-2 border-amber-500/60 min-w-[290px]">
                            <label className="text-[10px] font-black text-amber-300 uppercase">
                              B2C kabinetga Hisob raqam ma'lumotlarini jo‘natish:
                            </label>
                            <input
                              type="text"
                              value={
                                b2bBankAccountInputs[b2bOrd.id] !== undefined
                                  ? b2bBankAccountInputs[b2bOrd.id]
                                  : b2bOrd.bankAccountDetails || getDefaultB2bBankAccountText(b2bOrd)
                              }
                              onChange={(e) => {
                                setB2bBankAccountInputs((prev) => ({
                                  ...prev,
                                  [b2bOrd.id]: e.target.value,
                                }));
                                if (b2bBankAccountErrors[b2bOrd.id]) {
                                  setB2bBankAccountErrors((prev) => {
                                    const n = { ...prev };
                                    delete n[b2bOrd.id];
                                    return n;
                                  });
                                }
                              }}
                              placeholder="H/R: 2020 8000 ... | MFO: ... | Bank nomi..."
                              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-amber-500/50 focus:border-emerald-400 text-white font-mono text-xs focus:outline-none"
                            />
                            {b2bBankAccountErrors[b2bOrd.id] && (
                              <span className="text-[10px] text-red-400 font-bold block">
                                {b2bBankAccountErrors[b2bOrd.id]}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleAcceptB2bRequestAndSendBankDetails(b2bOrd.id)}
                              className="w-full px-4 py-2.5 rounded-xl bg-[#FFB800] hover:bg-[#FFC928] text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/30 active:scale-95 transition-all"
                            >
                              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                              <span>So‘rovni qabul qilish va Hisob raqam jo‘natish</span>
                            </button>
                          </div>
                        )}

                        {b2bOrd.status === 'approved_awaiting_payment' && (
                          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-xs space-y-1 max-w-md">
                            <div className="text-amber-300 font-black flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 shrink-0" />
                              <span>So‘rov qabul qilindi — B2C kabinet to‘lovi kutilmoqda</span>
                            </div>
                            {b2bOrd.bankAccountDetails && (
                              <div className="text-[11px] font-mono text-emerald-300 bg-slate-950/90 px-2.5 py-1.5 rounded-lg border border-slate-800">
                                Jo‘natilgan hisob raqam: {b2bOrd.bankAccountDetails}
                              </div>
                            )}
                          </div>
                        )}

                        {b2bOrd.status === 'paid' && (
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 p-3 rounded-2xl bg-emerald-500/15 border-2 border-emerald-400">
                            <div className="text-xs">
                              <span className="text-emerald-300 font-black block">
                                💳 B2C kabinet to‘lovni jo‘natdi!
                              </span>
                              <span className="text-[11px] text-slate-300 block">
                                Endi mahsulotlarni tayyorlash jarayonini boshlang:
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleStartPreparingB2bOrder(b2bOrd.id)}
                              className="px-5 py-2.5 rounded-xl bg-[#FFB800] hover:bg-[#FFC928] text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/30 active:scale-95 transition-all"
                            >
                              <Package className="w-4 h-4 stroke-[2.5]" />
                              <span>Mahsulotlarni tayyorlash jarayoni</span>
                            </button>
                          </div>
                        )}

                        {b2bOrd.status === 'preparing' && (
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2.5 rounded-2xl bg-slate-900 border border-amber-500/40">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-amber-300 block">
                                Yetkazib beruvchi nomeri:
                              </label>
                              <input
                                type="text"
                                value={
                                  driverPhoneInputs[b2bOrd.id] !== undefined
                                    ? driverPhoneInputs[b2bOrd.id]
                                    : b2bOrd.driverPhone || '+998 '
                                }
                                onChange={(e) => {
                                  setDriverPhoneInputs((prev) => ({
                                    ...prev,
                                    [b2bOrd.id]: formatUzPhoneInput(e.target.value),
                                  }));
                                  if (driverPhoneErrors[b2bOrd.id]) {
                                    setDriverPhoneErrors((prev) => {
                                      const n = { ...prev };
                                      delete n[b2bOrd.id];
                                      return n;
                                    });
                                  }
                                }}
                                placeholder="+998 90 123 45 67"
                                className="px-3 py-1.5 rounded-xl bg-slate-950 border border-amber-500/50 focus:border-emerald-400 text-white font-mono text-xs focus:outline-none"
                              />
                              {driverPhoneErrors[b2bOrd.id] && (
                                <span className="text-[10px] text-red-400 font-bold block">
                                  {driverPhoneErrors[b2bOrd.id]}
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleShipB2bOrderWithDriverPhone(b2bOrd.id, b2bOrd.driverPhone)}
                              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg active:scale-95 transition-all"
                            >
                              <Truck className="w-4 h-4 stroke-[2.5]" />
                              <span>Mahsulotni manzilga yuborish</span>
                            </button>
                          </div>
                        )}

                        {(b2bOrd.status === 'in_transit' || b2bOrd.status === 'paid_shipped') && (
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-xs">
                            <div>
                              <span className="text-sky-300 font-black block">🚚 Yetkazilmoqda</span>
                              {b2bOrd.driverPhone && (
                                <span className="text-emerald-400 font-mono font-black block">
                                  Bog‘lanish uchun tel nomer: {b2bOrd.driverPhone}
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleMarkB2bOrderDelivered(b2bOrd.id)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[11px] cursor-pointer transition-colors"
                            >
                              ✓ Yetkazildi deb belgilash
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-slate-800">
                      <table className="w-full text-left text-xs text-slate-300">
                        <thead className="bg-slate-900 text-slate-400 uppercase text-[10px]">
                          <tr>
                            <th className="py-2.5 px-3 font-black">№</th>
                            <th className="py-2.5 px-3 font-black">Olinayotgan Yuk (Mahsulot)</th>
                            <th className="py-2.5 px-3 font-black">Xususiyat / Rang</th>
                            <th className="py-2.5 px-3 font-black">Miqdori</th>
                            <th className="py-2.5 px-3 font-black">Narxi</th>
                            <th className="py-2.5 px-3 font-black text-right">Jami Summa</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/70 bg-slate-950">
                          {b2bOrd.items.map((item, idx) => (
                            <tr key={`${b2bOrd.id}-${idx}`}>
                              <td className="py-2.5 px-3 font-mono font-bold text-amber-400">{idx + 1}</td>
                              <td className="py-2.5 px-3 font-bold text-white">{item.title}</td>
                              <td className="py-2.5 px-3 text-slate-300">
                                {[item.specification, item.color].filter(Boolean).join(' • ') || 'Standart'}
                              </td>
                              <td className="py-2.5 px-3 font-mono font-black text-amber-300">
                                {item.quantity} {item.unit}
                              </td>
                              <td className="py-2.5 px-3 font-mono">{formatPrice(item.price)}</td>
                              <td className="py-2.5 px-3 font-mono font-black text-emerald-400 text-right">
                                {formatPrice(item.totalSum)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex items-center justify-between pt-2 text-xs">
                      <span className="text-slate-400">
                        Jami yuk turlari: <strong className="text-white">{b2bOrd.items.length} xil</strong>
                      </span>
                      <div className="text-sm sm:text-base font-black text-white">
                        Jami B2B Hisob Summasi:{' '}
                        <span className="text-emerald-400 font-mono">{formatPrice(b2bOrd.totalAmount)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 5: B2B Mahsulotlar (B2C Kabinetida B2B kabinetlardan ulgurji xarid qilish bo'limi) */}
        {activeTab === 'b2b_manufacturers' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Header banner with Buyurtmalarim button */}
            <div className="bg-slate-950 border-2 border-slate-900 rounded-3xl p-5 sm:p-6 space-y-5 shadow-2xl">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <Building className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg sm:text-xl font-black text-white">B2B ta'minotchilar</h2>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        B2C ↔ B2B Savdo
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Mahsulot tanlang → B2B Savatga yuklang → B2B ta'minotchiga so‘rov yuboring → Tasdiqlangach pulni hisobga o‘tkazing va yuk manzilingizga yuboriladi ({manufacturerProducts.length} ta B2B mahsulot)
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsB2bMyOrdersOpen((prev) => !prev)}
                    className={`flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl font-black text-xs cursor-pointer transition-all border shadow-lg ${
                      isB2bMyOrdersOpen
                        ? 'bg-[#FFB800] text-slate-950 border-amber-300 shadow-amber-500/30'
                        : awaitingPaymentB2bCount > 0
                        ? 'bg-gradient-to-r from-amber-500 via-emerald-500 to-amber-500 text-slate-950 border-amber-300 shadow-[0_0_20px_rgba(255,184,0,0.5)] animate-pulse'
                        : b2bCart.length > 0 || myOutgoingB2bOrders.length > 0
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400 shadow-emerald-500/25'
                        : 'bg-[#0F2547] hover:bg-[#16335F] text-white border-[#1E3A6D]'
                    }`}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>Buyurtmalarim</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${
                        isB2bMyOrdersOpen
                          ? 'bg-slate-950 text-[#FFB800]'
                          : 'bg-slate-950/80 text-amber-300'
                      }`}
                    >
                      {myOutgoingB2bOrders.length + (b2bCart.length > 0 ? 1 : 0)}
                    </span>
                  </button>
                </div>
              </div>

              {/* Buyurtmalarim Paneli: Sotib olinayotgan va Sotib olingan mahsulotlar holati + B2B Savat */}
              {isB2bMyOrdersOpen && (() => {
                const buyingOrders = myOutgoingB2bOrders.filter(
                  (o) =>
                    o.status === 'requested' ||
                    o.status === 'approved_awaiting_payment' ||
                    o.status === 'paid' ||
                    o.status === 'preparing' ||
                    o.status === 'in_transit'
                );
                const boughtOrders = myOutgoingB2bOrders.filter(
                  (o) => o.status === 'paid_shipped' || o.status === 'delivered'
                );
                const displayedB2bOrders =
                  b2bMyOrdersTab === 'buying'
                    ? buyingOrders
                    : b2bMyOrdersTab === 'bought'
                    ? boughtOrders
                    : myOutgoingB2bOrders;

                return (
                  <div className="pt-4 border-t border-slate-800 space-y-5 animate-fadeIn">
                    {/* B2B Savatda yuborishga tayyor mahsulotlar bo'lsa ko'rsatiladi */}
                    {b2bCart.length > 0 && (
                      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border-2 border-amber-500/50 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                          <div className="flex items-center gap-2.5">
                            <ShoppingCart className="w-5 h-5 text-[#FFB800]" />
                            <div>
                              <h4 className="text-sm sm:text-base font-black text-white">
                                B2B Savat — So‘rov yuborishga tayyor mahsulotlar ({b2bCart.length} xil)
                              </h4>
                              <p className="text-[11px] text-slate-400">
                                B2B ta'minotchiga so‘rov yuborish uchun quyidagi tugmani bosing
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setB2bCart([])}
                            className="px-3 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30 font-bold text-xs cursor-pointer self-start sm:self-auto"
                          >
                            Savatni tozalash
                          </button>
                        </div>

                        <div className="overflow-x-auto rounded-xl border border-slate-800">
                          <table className="w-full text-left text-xs text-slate-200">
                            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px]">
                              <tr>
                                <th className="py-2 px-3 font-black">№</th>
                                <th className="py-2 px-3 font-black">Mahsulot</th>
                                <th className="py-2 px-3 font-black">B2B Ta'minotchi</th>
                                <th className="py-2 px-3 font-black">Variant / Rang</th>
                                <th className="py-2 px-3 font-black">Miqdori</th>
                                <th className="py-2 px-3 font-black">Narxi</th>
                                <th className="py-2 px-3 font-black text-right">Jami</th>
                                <th className="py-2 px-3 font-black text-right">Amal</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800 bg-slate-900">
                              {b2bCart.map((item, i) => (
                                <tr key={item.key}>
                                  <td className="py-2 px-3 font-mono font-bold text-amber-400">{i + 1}</td>
                                  <td className="py-2 px-3 font-bold text-white">{item.product.title}</td>
                                  <td className="py-2 px-3 text-amber-300 font-bold">{item.product.supplierName}</td>
                                  <td className="py-2 px-3 text-slate-300">
                                    {[item.specification, item.color].filter(Boolean).join(' • ') || item.unit}
                                  </td>
                                  <td className="py-2 px-3 font-mono font-black text-amber-400">
                                    {item.quantity} {item.unit}
                                  </td>
                                  <td className="py-2 px-3 font-mono">{formatPrice(item.price)}</td>
                                  <td className="py-2 px-3 font-mono font-black text-emerald-400 text-right">
                                    {formatPrice(item.price * item.quantity)}
                                  </td>
                                  <td className="py-2 px-3 text-right">
                                    <button
                                      type="button"
                                      onClick={() => setB2bCart((prev) => prev.filter((x) => x.key !== item.key))}
                                      className="text-red-400 hover:text-red-300 p-1 cursor-pointer"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                          <div className="text-sm font-black text-white">
                            B2B Savat Jami:{' '}
                            <span className="text-emerald-400 font-mono">
                              {formatPrice(b2bCart.reduce((s, it) => s + it.price * it.quantity, 0))}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2.5">
                            <button
                              type="button"
                              onClick={() => {
                                const draft = buildDraftB2bManifestFromCart();
                                if (draft) handlePrintOrDownloadB2bPdf(draft);
                              }}
                              className="px-4 py-2.5 rounded-xl bg-sky-500/20 hover:bg-sky-500 hover:text-slate-950 text-sky-300 border border-sky-500/40 font-black text-xs flex items-center gap-1.5 cursor-pointer transition-all"
                            >
                              <Download className="w-4 h-4" />
                              <span>Ro‘yxatni PDF chiqarib olish</span>
                            </button>
                            <button
                              type="button"
                              onClick={handleSendB2bRequest}
                              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/25 active:scale-95 transition-all"
                            >
                              <Send className="w-4 h-4" />
                              <span>B2B ta'minotchiga so‘rov yuborish</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Filter tabs: Barchasi | Sotib olinayotgan mahsulotlar | Sotib olingan mahsulotlar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setB2bMyOrdersTab('all')}
                          className={`px-4 py-2 rounded-xl text-xs font-black cursor-pointer transition-all border ${
                            b2bMyOrdersTab === 'all'
                              ? 'bg-[#FFB800] text-slate-950 border-amber-300'
                              : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          Barchasi ({myOutgoingB2bOrders.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setB2bMyOrdersTab('buying')}
                          className={`px-4 py-2 rounded-xl text-xs font-black cursor-pointer transition-all border ${
                            b2bMyOrdersTab === 'buying'
                              ? 'bg-amber-500 text-slate-950 border-amber-300'
                              : 'bg-slate-900 text-amber-300 border-amber-500/30 hover:border-amber-400'
                          }`}
                        >
                          Sotib olinayotgan mahsulotlar ({buyingOrders.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setB2bMyOrdersTab('bought')}
                          className={`px-4 py-2 rounded-xl text-xs font-black cursor-pointer transition-all border ${
                            b2bMyOrdersTab === 'bought'
                              ? 'bg-emerald-500 text-slate-950 border-emerald-300'
                              : 'bg-slate-900 text-emerald-300 border-emerald-500/30 hover:border-emerald-400'
                          }`}
                        >
                          Sotib olingan mahsulotlar ({boughtOrders.length})
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsB2bMyOrdersOpen(false)}
                        className="text-xs font-bold text-slate-400 hover:text-white cursor-pointer self-end sm:self-auto"
                      >
                        Yopish ▲
                      </button>
                    </div>

                    {displayedB2bOrders.length === 0 ? (
                      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-400">
                        {b2bMyOrdersTab === 'buying'
                          ? 'Hozircha sotib olinayotgan jarayondagi mahsulotlar yo‘q.'
                          : b2bMyOrdersTab === 'bought'
                          ? 'Hozircha sotib olingan (yakunlangan) mahsulotlar yo‘q.'
                          : 'Siz tomoningizdan yuborilgan mahsulot so‘rovlari hozircha yo‘q.'}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {displayedB2bOrders.map((ord) => {
                          const isCompleted = ord.status === 'paid_shipped' || ord.status === 'delivered';
                          const bankInfoText = ord.bankAccountDetails || getDefaultB2bBankAccountText(ord);
                          return (
                            <div
                              key={ord.id}
                              className={`p-4 rounded-2xl border-2 space-y-3 transition-all ${
                                ord.status === 'approved_awaiting_payment'
                                  ? 'bg-amber-500/15 border-amber-400 shadow-[0_0_24px_rgba(255,184,0,0.35)]'
                                  : ord.status === 'paid' || ord.status === 'preparing'
                                  ? 'bg-amber-500/10 border-amber-400/70 shadow-[0_0_16px_rgba(255,184,0,0.2)]'
                                  : ord.status === 'in_transit'
                                  ? 'bg-sky-500/10 border-sky-400/60 shadow-[0_0_20px_rgba(56,189,248,0.2)]'
                                  : isCompleted
                                  ? 'bg-emerald-500/10 border-emerald-500/50'
                                  : 'bg-slate-900/80 border-slate-800'
                              }`}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                <div className="space-y-2 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="px-2.5 py-1 rounded-lg bg-slate-950 text-[#FFB800] font-mono font-black text-xs border border-amber-500/40">
                                      #{ord.id}
                                    </span>
                                    <span className="font-black text-white text-sm">
                                      B2B Ta'minotchi: «{ord.manufacturerCompanyName}»
                                    </span>
                                    <span
                                      className={`px-3 py-1 rounded-full text-[11px] font-black uppercase border ${
                                        ord.status === 'requested'
                                          ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                                          : ord.status === 'approved_awaiting_payment'
                                          ? 'bg-amber-500 text-slate-950 border-amber-300 animate-pulse'
                                          : ord.status === 'paid'
                                          ? 'bg-emerald-500/25 text-emerald-300 border-emerald-400'
                                          : ord.status === 'preparing'
                                          ? 'bg-amber-500 text-slate-950 border-amber-300 animate-pulse'
                                          : ord.status === 'in_transit'
                                          ? 'bg-sky-500 text-slate-950 border-sky-300'
                                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                      }`}
                                    >
                                      {ord.status === 'requested'
                                        ? 'Sotib olinmoqda — So‘rov yuborilgan (B2B javobi kutilmoqda)'
                                        : ord.status === 'approved_awaiting_payment'
                                        ? '🔔 So‘rov qabul qilindi — To‘lov kutilmoqda!'
                                        : ord.status === 'paid'
                                        ? '💳 To‘lov jo‘natildi — B2B tayyorlashni boshlamoqda'
                                        : ord.status === 'preparing'
                                        ? '📦 Sotib olinmoqda — Mahsulot yuklash jarayonida'
                                        : ord.status === 'in_transit'
                                        ? '🚚 Sotib olinmoqda — Yetkazilmoqda'
                                        : '✅ Sotib olingan (Yetkazilgan)'}
                                    </span>
                                  </div>

                                  <div className="text-xs text-slate-300">
                                    Sana: {new Date(ord.createdAt).toLocaleString('uz-UZ')} • Mahsulotlar:{' '}
                                    <strong className="text-white">
                                      {ord.items.map((it) => `${it.title} (${it.quantity} ${it.unit})`).join(', ')}
                                    </strong>{' '}
                                    • Jami summa:{' '}
                                    <strong className="text-emerald-400 font-mono">{formatPrice(ord.totalAmount)}</strong>
                                  </div>

                                  {/* B2B Kabinet so'rovni qabul qilganda jo'natgan Hisob raqam ma'lumotlari va To'lov tugmasi */}
                                  {ord.status === 'approved_awaiting_payment' && (
                                    <div className="p-3.5 rounded-2xl bg-slate-950 border-2 border-amber-400/80 space-y-2.5">
                                      <div className="flex items-center gap-2 text-amber-300 font-black text-xs">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                        <span>
                                          Xabar: «{ord.manufacturerCompanyName}» (B2B kabinet) so‘rovingizni qabul qildi va to‘lov uchun Hisob raqam ma'lumotlarini jo‘natdi!
                                        </span>
                                      </div>
                                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                                        <div className="space-y-0.5">
                                          <span className="text-[10px] font-bold uppercase text-slate-400 block">
                                            B2B Kabinet Hisob Raqam Ma'lumotlari:
                                          </span>
                                          <span className="font-mono font-black text-xs sm:text-sm text-emerald-400 block break-all">
                                            {bankInfoText}
                                          </span>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            navigator.clipboard?.writeText(bankInfoText);
                                            setCopiedBankOrderId(ord.id);
                                            setTimeout(() => setCopiedBankOrderId(null), 2000);
                                          }}
                                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 font-bold text-[11px] flex items-center gap-1.5 cursor-pointer shrink-0 self-start sm:self-center"
                                        >
                                          <Copy className="w-3.5 h-3.5" />
                                          <span>{copiedBankOrderId === ord.id ? 'Nusxalandi ✓' : 'Hisob raqamni nusxalash'}</span>
                                        </button>
                                      </div>
                                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                                        <span className="text-[11px] text-slate-300">
                                          To‘lov jo‘natilgach, B2B kabinetda yuklash va manzilga yuborish jarayoni davom etadi.
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => handleSendB2bPaymentFromB2c(ord.id)}
                                          className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/30 active:scale-95 transition-all shrink-0"
                                        >
                                          <CreditCard className="w-4 h-4 stroke-[2.5]" />
                                          <span>To‘lov qilish (To‘lovni jo‘natish) — {formatPrice(ord.totalAmount)}</span>
                                        </button>
                                      </div>
                                    </div>
                                  )}

                                  {/* To'lov qilingandan keyin ham Hisob raqam ma'lumotlari ko'rinib turadi */}
                                  {ord.status !== 'requested' && ord.status !== 'approved_awaiting_payment' && ord.bankAccountDetails && (
                                    <div className="text-[11px] font-mono text-slate-300 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
                                      <span className="text-emerald-400 font-bold">To‘lov o‘tkazilgan B2B hisob raqam:</span> {ord.bankAccountDetails}
                                    </div>
                                  )}

                                  {(ord.status === 'in_transit' || ord.status === 'paid_shipped') && ord.driverPhone && (
                                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400 text-emerald-300 font-black text-xs">
                                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                                      <span>Bog‘lanish uchun tel nomer:</span>
                                      <a
                                        href={`tel:${ord.driverPhone}`}
                                        className="font-mono text-white underline hover:text-[#FFB800]"
                                      >
                                        {ord.driverPhone}
                                      </a>
                                    </div>
                                  )}
                                </div>

                                <div className="flex flex-wrap items-center gap-2 shrink-0">
                                  {ord.status === 'in_transit' && (
                                    <button
                                      type="button"
                                      onClick={() => handleMarkB2bOrderDelivered(ord.id)}
                                      className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      <span>Qabul qilindi (Sotib olindi)</span>
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => setPreviewB2bManifest(ord)}
                                    className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-amber-300 border border-amber-500/40 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>Hujjatni ko‘rish</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handlePrintOrDownloadB2bPdf(ord)}
                                    className="px-3.5 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500 hover:text-slate-950 text-sky-300 border border-sky-500/40 font-black text-xs flex items-center gap-1.5 cursor-pointer transition-all"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                    <span>Ro‘yxatni PDF chiqarib olish</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* B2B Notice Toast */}
            {b2bNoticeMessage && (
              <div className="p-4 rounded-2xl bg-emerald-500/20 border-2 border-emerald-400 text-emerald-200 text-xs sm:text-sm font-black flex items-center justify-between gap-3 shadow-lg animate-fadeIn">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>{b2bNoticeMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setB2bNoticeMessage(null)}
                  className="text-emerald-300 hover:text-white p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* B2C Kabinet Bildirishnomasi: B2B kabinet so'rovni qabul qilganda va Hisob raqam ma'lumotlarini jo'natganda chiqadi */}
            {awaitingPaymentB2bCount > 0 && (
              <div className="p-5 rounded-3xl bg-slate-950 border-2 border-amber-400 shadow-[0_0_25px_rgba(255,184,0,0.35)] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-amber-300 font-black text-sm sm:text-base">
                      <AlertCircle className="w-5 h-5 text-[#FFB800] shrink-0 animate-bounce" />
                      <span>
                        🔔 XABAR: B2B kabinet sizning {awaitingPaymentB2bCount} ta mahsulot so‘rovingizni qabul qildi va Hisob raqam ma'lumotlarini jo‘natdi!
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">
                      B2B kabinet yuborgan hisob raqam ma'lumotlari asosida to‘lovni jo‘nating. To‘lov jo‘natilgach mahsulotni tayyorlash va manzilga yetkazish jarayoni davom etadi.
                    </p>
                  </div>
                  {!isB2bMyOrdersOpen && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsB2bMyOrdersOpen(true);
                        setB2bMyOrdersTab('buying');
                      }}
                      className="px-4 py-2.5 rounded-xl bg-[#FFB800] hover:bg-[#FFC928] text-slate-950 font-black text-xs cursor-pointer shrink-0 self-start sm:self-center"
                    >
                      Buyurtmalarimni ochish
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {myOutgoingB2bOrders
                    .filter((o) => o.status === 'approved_awaiting_payment')
                    .map((ord) => {
                      const bankInfo = ord.bankAccountDetails || getDefaultB2bBankAccountText(ord);
                      return (
                        <div
                          key={ord.id}
                          className="p-4 rounded-2xl bg-slate-900 border border-amber-500/50 flex flex-col lg:flex-row lg:items-center justify-between gap-3"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap text-xs">
                              <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-[#FFB800] font-mono font-black border border-amber-500/40">
                                #{ord.id}
                              </span>
                              <span className="font-black text-white">
                                B2B Kabinet: «{ord.manufacturerCompanyName}»
                              </span>
                              <span className="text-emerald-400 font-mono font-black">
                                Summa: {formatPrice(ord.totalAmount)}
                              </span>
                            </div>
                            <div className="text-xs font-mono text-emerald-300 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 break-all">
                              <strong className="text-amber-300">Hisob raqam ma'lumotlari:</strong> {bankInfo}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard?.writeText(bankInfo);
                                setCopiedBankOrderId(ord.id);
                                setTimeout(() => setCopiedBankOrderId(null), 2000);
                              }}
                              className="px-3.5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-amber-300 border border-amber-500/40 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span>{copiedBankOrderId === ord.id ? 'Nusxalandi ✓' : 'Nusxalash'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSendB2bPaymentFromB2c(ord.id)}
                              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/25 active:scale-95 transition-all"
                            >
                              <CreditCard className="w-4 h-4 stroke-[2.5]" />
                              <span>To‘lov qilish (To‘lovni jo‘natish)</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Search and Category Filter */}
            <div className="bg-slate-950 border-2 border-slate-900 rounded-3xl p-4 sm:p-5 space-y-3 shadow-xl">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={b2bSearchQuery}
                    onChange={(e) => setB2bSearchQuery(e.target.value)}
                    placeholder="Ishlab chiqaruvchi zavod nomi, mahsulot nomi yoki hudud bo‘yicha qidirish..."
                    className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-2xl text-white text-xs focus:outline-none"
                  />
                </div>
                <select
                  value={b2bCategoryFilter}
                  onChange={(e) => setB2bCategoryFilter(e.target.value)}
                  className="px-4 py-3 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-2xl text-white text-xs font-bold focus:outline-none cursor-pointer"
                >
                  <option value="all">Barcha mahsulot turlari ({manufacturerProducts.length})</option>
                  {b2bCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* B2B Mahsulotlar — Bosh paneldagi kabi Katalog va Mahsulot ustiga bosilganda Batafsil oyna (Yon tarafda shu ta'minotchi yuklagan mahsulotlar, pastda boshqa B2B mahsulotlar) */}
            {selectedB2bProduct ? (
              (() => {
                const detailGalleryImages =
                  selectedB2bProduct.images && selectedB2bProduct.images.length > 0
                    ? selectedB2bProduct.images
                    : [selectedB2bProduct.image];
                const safeImgIdx = b2bDetailImgIdx < detailGalleryImages.length ? b2bDetailImgIdx : 0;
                const variantsList =
                  selectedB2bProduct.variants && selectedB2bProduct.variants.length > 0
                    ? selectedB2bProduct.variants
                    : [
                        {
                          id: 'default',
                          unit: selectedB2bProduct.unit,
                          colors: selectedB2bProduct.colors || [],
                          specification: '',
                          price: selectedB2bProduct.price,
                          originalPrice: selectedB2bProduct.originalPrice || selectedB2bProduct.price,
                          minOrder: selectedB2bProduct.minOrder || 1,
                        },
                      ];
                const selectedVarIdx = b2bVariantIdxInputs[selectedB2bProduct.id] ?? 0;
                const activeVar = variantsList[selectedVarIdx] || variantsList[0];
                const varColors =
                  activeVar.colors && activeVar.colors.length > 0
                    ? activeVar.colors
                    : selectedB2bProduct.colors || [];
                const selectedColor = b2bColorInputs[selectedB2bProduct.id] ?? (varColors[0] || '');
                const unitPrice =
                  activeVar.originalPrice || activeVar.price || selectedB2bProduct.originalPrice || selectedB2bProduct.price;
                const minOrd = activeVar.minOrder || selectedB2bProduct.minOrder || 1;
                const currentQty = Math.max(
                  1,
                  b2bQtyInputs[selectedB2bProduct.id] ?? minOrd
                );
                const availStock =
                  selectedB2bProduct.stock !== undefined && selectedB2bProduct.stock !== null
                    ? Number(selectedB2bProduct.stock)
                    : 1000;

                // Yon tarafdan: Korayotgan mahsulotni ishlab chiqarayotgan ta'minotchi yuklagan mahsulotlar ko'rinadi
                const sameSupplierProducts = manufacturerProducts.filter((item) => {
                  const sameId =
                    item.supplierId &&
                    selectedB2bProduct.supplierId &&
                    item.supplierId === selectedB2bProduct.supplierId;
                  const sameInn =
                    item.supplierInn &&
                    selectedB2bProduct.supplierInn &&
                    item.supplierInn === selectedB2bProduct.supplierInn;
                  const sameName =
                    (item.supplierName || '').trim().toLowerCase() ===
                    (selectedB2bProduct.supplierName || '').trim().toLowerCase();
                  return sameId || sameInn || sameName;
                });
                const sidebarSupplierProducts =
                  sameSupplierProducts.filter((item) => item.id !== selectedB2bProduct.id).length > 0
                    ? sameSupplierProducts.filter((item) => item.id !== selectedB2bProduct.id)
                    : sameSupplierProducts;

                // Pastki qismdan: Platformadagi boshqa B2B mahsulotlari
                const bottomOtherB2bProducts = manufacturerProducts.filter(
                  (item) => item.id !== selectedB2bProduct.id
                );

                return (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="bg-[#0A1931] border-2 border-[#1E3A6D] rounded-3xl overflow-hidden shadow-2xl">
                      {/* Top Header */}
                      <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-[#1E3A6D] bg-[#071326]">
                        <div className="flex items-center gap-2 text-xs sm:text-sm font-black text-white">
                          <Building className="w-4 h-4 text-[#FFB800] shrink-0" />
                          <span>Ta'minotchi: {selectedB2bProduct.supplierName}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedB2bProduct(null)}
                          className="px-3.5 py-1.5 rounded-xl bg-[#0F2547] hover:bg-red-600 text-sky-100 hover:text-white border border-[#1E3A6D] font-black text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <X className="w-4 h-4" />
                          <span>Yopish</span>
                        </button>
                      </div>

                      <div className="p-4 sm:p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                          {/* LEFT COLUMN (9 cols): Gallery + Order Box + Description */}
                          <div className="lg:col-span-9 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
                              {/* Image Gallery (5 cols) */}
                              <div className="md:col-span-5 flex flex-col gap-2.5">
                                <div className="relative h-64 sm:h-72 rounded-2xl overflow-hidden bg-[#071326] border-2 border-[#1E3A6D] group">
                                  <img
                                    src={detailGalleryImages[safeImgIdx]}
                                    alt={selectedB2bProduct.title}
                                    onClick={() => setB2bZoomedImage(detailGalleryImages[safeImgIdx])}
                                    className="w-full h-full object-cover cursor-zoom-in transition-transform duration-300 group-hover:scale-105"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setB2bZoomedImage(detailGalleryImages[safeImgIdx])}
                                    className="absolute bottom-2.5 right-2.5 px-2.5 py-1.5 rounded-lg bg-[#071326]/90 hover:bg-[#FFB800] text-white hover:text-slate-950 border border-[#1E3A6D] flex items-center gap-1 text-[10px] font-bold transition-colors cursor-pointer shadow-lg"
                                  >
                                    <Maximize2 className="w-3 h-3" />
                                    <span>Kattalashtirish</span>
                                  </button>

                                  {detailGalleryImages.length > 1 && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setB2bDetailImgIdx((prev) =>
                                            prev === 0 ? detailGalleryImages.length - 1 : prev - 1
                                          )
                                        }
                                        className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-[#071326]/85 hover:bg-[#FFB800] text-white hover:text-slate-950 border border-[#1E3A6D] transition-colors cursor-pointer"
                                      >
                                        <ChevronLeft className="w-4 h-4" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setB2bDetailImgIdx((prev) =>
                                            prev === detailGalleryImages.length - 1 ? 0 : prev + 1
                                          )
                                        }
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-[#071326]/85 hover:bg-[#FFB800] text-white hover:text-slate-950 border border-[#1E3A6D] transition-colors cursor-pointer"
                                      >
                                        <ChevronRight className="w-4 h-4" />
                                      </button>
                                    </>
                                  )}
                                </div>

                                {detailGalleryImages.length > 1 && (
                                  <div className="flex gap-2 overflow-x-auto pb-1">
                                    {detailGalleryImages.map((imgUrl, idx) => (
                                      <button
                                        key={idx}
                                        type="button"
                                        onClick={() => setB2bDetailImgIdx(idx)}
                                        className={`relative w-12 h-12 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                                          safeImgIdx === idx
                                            ? 'border-[#FFB800] scale-105'
                                            : 'border-[#1E3A6D] opacity-60 hover:opacity-100'
                                        }`}
                                      >
                                        <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Product Info & Add to Cart Box (7 cols) */}
                              <div className="md:col-span-7 bg-[#0F2547] border-2 border-[#1E3A6D] rounded-2xl p-4 sm:p-5 flex flex-col justify-between text-white">
                                <div className="space-y-3">
                                  <div>
                                    <h1 className="text-lg sm:text-2xl font-black text-white leading-snug">
                                      {selectedB2bProduct.title}
                                    </h1>
                                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                      <div className="flex items-center gap-1.5 text-xs text-sky-200 font-semibold">
                                        <MapPin className="w-3.5 h-3.5 text-[#FFB800] shrink-0" />
                                        <span>Yetkazib beruvchi manzili:</span>
                                        <span className="font-bold text-white">{selectedB2bProduct.region}</span>
                                      </div>
                                      {availStock <= 0 ? (
                                        <span className="px-2.5 py-0.5 rounded-lg bg-red-500/20 border border-red-400 text-red-400 font-black text-[11px] uppercase">
                                          Vaqtincha tugagan
                                        </span>
                                      ) : (
                                        <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 font-mono font-bold text-[11px]">
                                          Omborda mavjud: {availStock} {activeVar.unit}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Price + Order Quantity + Savatga qo'shish */}
                                  <div className="p-3.5 rounded-xl bg-[#071326] border border-[#1E3A6D] space-y-3">
                                    <div className="flex items-baseline gap-2 flex-wrap">
                                      <span className="text-xl sm:text-2xl font-black text-[#FFB800] font-mono">
                                        {new Intl.NumberFormat('uz-UZ').format(unitPrice)} so'm
                                      </span>
                                      <span className="text-xs text-sky-200 font-mono">
                                        / {activeVar.specification || activeVar.unit}
                                      </span>
                                    </div>

                                    <div className="pt-2.5 border-t border-[#1E3A6D] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                                      <div className="flex items-center gap-2">
                                        <span className="text-[11px] font-bold text-sky-200">
                                          Buyurtma miqdori ({activeVar.unit}):
                                        </span>
                                        <div className="flex items-center bg-[#0F2547] border border-[#1E3A6D] rounded-lg overflow-hidden">
                                          <button
                                            type="button"
                                            onClick={() =>
                                              setB2bQtyInputs((prev) => ({
                                                ...prev,
                                                [selectedB2bProduct.id]: Math.max(minOrd, currentQty - 1),
                                              }))
                                            }
                                            className="px-2.5 py-1 text-sky-200 hover:text-white hover:bg-[#16335F] transition-colors cursor-pointer font-black"
                                          >
                                            <Minus className="w-3.5 h-3.5" />
                                          </button>
                                          <input
                                            type="text"
                                            inputMode="numeric"
                                            value={currentQty}
                                            onChange={(e) => {
                                              const cleanDigits = e.target.value.replace(/\D/g, '');
                                              setB2bQtyInputs((prev) => ({
                                                ...prev,
                                                [selectedB2bProduct.id]: Math.max(1, Number(cleanDigits) || 1),
                                              }));
                                            }}
                                            className="w-16 text-center bg-transparent text-white font-mono font-black text-xs focus:outline-none py-1"
                                          />
                                          <button
                                            type="button"
                                            onClick={() =>
                                              setB2bQtyInputs((prev) => ({
                                                ...prev,
                                                [selectedB2bProduct.id]: currentQty + 1,
                                              }))
                                            }
                                            className="px-2.5 py-1 text-sky-200 hover:text-white hover:bg-[#16335F] transition-colors cursor-pointer font-black"
                                          >
                                            <Plus className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>

                                      <div className="text-right">
                                        <span className="text-[11px] text-sky-300 mr-1.5">Jami:</span>
                                        <span className="text-sm font-black text-emerald-400 font-mono">
                                          {new Intl.NumberFormat('uz-UZ').format(unitPrice * currentQty)} so'm
                                        </span>
                                      </div>
                                    </div>

                                    <button
                                      type="button"
                                      disabled={availStock <= 0}
                                      onClick={() => handleAddToB2bCart(selectedB2bProduct)}
                                      className={`w-full py-3 px-5 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-lg ${
                                        availStock <= 0
                                          ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                                          : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 active:scale-[0.99] cursor-pointer'
                                      }`}
                                    >
                                      <ShoppingCart className="w-4 h-4" />
                                      <span>
                                        {availStock <= 0 ? 'Vaqtincha tugagan' : 'Savatga qo‘shish'}
                                      </span>
                                    </button>
                                  </div>

                                  {/* Mavjud Variantlar & Minimal buyurtma */}
                                  <div className="space-y-2">
                                    <div>
                                      <span className="text-[10px] font-bold uppercase tracking-wider text-sky-200 block mb-1.5">
                                        Mavjud Variantlar:
                                      </span>
                                      <div className="flex flex-wrap gap-1.5">
                                        {variantsList.map((v, vIdx) => {
                                          const isSelected = selectedVarIdx === vIdx;
                                          const vPrice = v.originalPrice || v.price || selectedB2bProduct.price;
                                          return (
                                            <button
                                              key={v.id || vIdx}
                                              type="button"
                                              onClick={() =>
                                                setB2bVariantIdxInputs((prev) => ({
                                                  ...prev,
                                                  [selectedB2bProduct.id]: vIdx,
                                                }))
                                              }
                                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer flex items-center gap-1.5 ${
                                                isSelected
                                                  ? 'bg-[#FFB800] text-slate-950 border-[#FFB800] font-black shadow'
                                                  : 'bg-[#071326] text-white border-[#1E3A6D] hover:border-[#FFB800]'
                                              }`}
                                            >
                                              <span>{v.specification ? v.specification : v.unit}</span>
                                              <span
                                                className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                                                  isSelected
                                                    ? 'bg-slate-950/20 text-slate-950 font-black'
                                                    : 'bg-[#0F2547] text-[#FFB800]'
                                                }`}
                                              >
                                                {new Intl.NumberFormat('uz-UZ').format(vPrice)} so'm
                                              </span>
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>

                                    {varColors.length > 0 && (
                                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-sky-200 mr-1">
                                          Rangi:
                                        </span>
                                        {varColors.map((color) => {
                                          const colStyle = getColorPaletteItem(color);
                                          const isSel = selectedColor === color;
                                          return (
                                            <button
                                              key={color}
                                              type="button"
                                              onClick={() =>
                                                setB2bColorInputs((prev) => ({
                                                  ...prev,
                                                  [selectedB2bProduct.id]: color,
                                                }))
                                              }
                                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border cursor-pointer flex items-center gap-1.5 ${
                                                isSel
                                                  ? 'ring-2 ring-[#FFB800] scale-105 font-black'
                                                  : 'opacity-80 hover:opacity-100'
                                              }`}
                                              style={{ backgroundColor: colStyle.bg, color: colStyle.text }}
                                            >
                                              <span
                                                className="w-2.5 h-2.5 rounded-full border border-current/30 shrink-0"
                                                style={{ backgroundColor: colStyle.bg }}
                                              />
                                              <span>{color}</span>
                                            </button>
                                          );
                                        })}
                                      </div>
                                    )}

                                    <div className="text-[11px] text-sky-200 font-mono">
                                      Minimal buyurtma:{' '}
                                      <strong className="text-[#FFB800]">
                                        {minOrd} {activeVar.unit}
                                      </strong>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Mahsulot haqida ma'lumot */}
                            <div className="bg-[#0F2547] border-2 border-[#1E3A6D] rounded-2xl p-4 sm:p-5 space-y-4">
                              <h3 className="text-xs font-black uppercase tracking-wider text-[#FFB800] flex items-center gap-2">
                                <Package className="w-4 h-4 text-[#FFB800]" />
                                <span>Mahsulot haqida ma'lumot</span>
                              </h3>

                              {selectedB2bProduct.videoUrl && (
                                <div className="p-3.5 rounded-xl bg-[#071326] border border-[#FFB800]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow">
                                      <Play className="w-4 h-4 fill-current ml-0.5" />
                                    </div>
                                    <span className="text-xs sm:text-sm font-black text-white">
                                      Mahsulot haqida Video tavsilot
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setB2bVideoModalProduct(selectedB2bProduct)}
                                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all"
                                  >
                                    <Play className="w-3.5 h-3.5 fill-current" />
                                    <span>Videoni ko‘rish</span>
                                  </button>
                                </div>
                              )}

                              <p className="text-white text-xs sm:text-sm leading-relaxed">
                                {selectedB2bProduct.description ||
                                  `${selectedB2bProduct.title} — ${selectedB2bProduct.supplierName} tomonidan yetkazib beriladigan sifatli qurilish mahsuloti.`}
                              </p>

                              {selectedB2bProduct.detailBlocks && selectedB2bProduct.detailBlocks.length > 0 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-[#1E3A6D]">
                                  {selectedB2bProduct.detailBlocks.map((block, bIdx) => (
                                    <div
                                      key={bIdx}
                                      className="rounded-xl overflow-hidden bg-[#071326] border border-[#1E3A6D] flex flex-col"
                                    >
                                      {block.image && (
                                        <div
                                          onClick={() => setB2bZoomedImage(block.image)}
                                          className="h-44 w-full bg-[#050E1D] border-b border-[#1E3A6D] flex items-center justify-center p-2 cursor-zoom-in"
                                        >
                                          <img
                                            src={block.image}
                                            alt=""
                                            className="max-w-full max-h-full object-contain rounded-lg"
                                          />
                                        </div>
                                      )}
                                      {block.text && (
                                        <div className="p-3 text-xs text-sky-100 leading-relaxed">{block.text}</div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* RIGHT COLUMN (3 cols): Ko'rayotgan mahsulotni ishlab chiqarayotgan ta'minotchi yuklagan mahsulotlar */}
                          <div className="lg:col-span-3 space-y-3">
                            <div className="flex items-center justify-between border-b border-[#1E3A6D] pb-2">
                              <h3 className="text-xs font-black uppercase tracking-wider text-[#FFB800]">
                                Boshqa Mahsulotlar
                              </h3>
                              <span className="text-[10px] font-mono text-sky-300">
                                {sidebarSupplierProducts.length} ta
                              </span>
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-1 gap-2.5 max-h-[680px] overflow-y-auto pr-1">
                              {sidebarSupplierProducts.map((item) => (
                                <div
                                  key={item.id}
                                  onClick={() => {
                                    setSelectedB2bProduct(item);
                                    setB2bDetailImgIdx(0);
                                  }}
                                  className="group bg-[#0F2547] hover:bg-[#16335F] border border-[#1E3A6D] hover:border-[#FFB800] rounded-xl p-2.5 flex gap-2.5 items-center cursor-pointer transition-all"
                                >
                                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-[#071326] border border-[#1E3A6D] shrink-0">
                                    <img
                                      src={item.image}
                                      alt={item.title}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                  </div>
                                  <div className="min-w-0 flex-1 space-y-0.5">
                                    <h4 className="text-xs font-black text-white group-hover:text-[#FFB800] transition-colors line-clamp-1">
                                      {item.title}
                                    </h4>
                                    <div className="text-[10px] text-sky-200 truncate">
                                      Yetkazib beruvchi manzili: {item.region}
                                    </div>
                                    <div className="text-xs font-black text-[#FFB800] font-mono">
                                      {new Intl.NumberFormat('uz-UZ').format(item.originalPrice || item.price)} so'm
                                    </div>
                                    <span className="inline-block text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                      B2B mahsulotlar
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* PASTKI QISMDAN: Platformadagi boshqa B2B mahsulotlari */}
                    {bottomOtherB2bProducts.length > 0 && (
                      <div className="bg-[#0A1931] border-2 border-[#1E3A6D] rounded-3xl p-4 sm:p-6 space-y-4 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-[#1E3A6D] pb-3">
                          <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-[#FFB800] flex items-center gap-2">
                            <Building className="w-4 h-4 text-[#FFB800]" />
                            <span>B2B mahsulotlar ({bottomOtherB2bProducts.length} ta)</span>
                          </h3>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {bottomOtherB2bProducts.map((item) => (
                            <div
                              key={item.id}
                              onClick={() => {
                                setSelectedB2bProduct(item);
                                setB2bDetailImgIdx(0);
                              }}
                              className="group bg-[#0F2547] hover:bg-[#16335F] border-2 border-[#1E3A6D] hover:border-[#FFB800] rounded-2xl overflow-hidden flex flex-col justify-between cursor-pointer transition-all shadow-lg"
                            >
                              <div className="relative h-44 w-full bg-[#071326] overflow-hidden border-b border-[#1E3A6D]">
                                <img
                                  src={item.image}
                                  alt={item.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-lg bg-[#0A1931]/90 text-[#FFB800] border border-[#FFB800]/40 text-[10px] font-black uppercase">
                                  B2B mahsulotlar
                                </span>
                              </div>
                              <div className="p-3.5 space-y-1.5">
                                <h4 className="font-black text-white text-sm group-hover:text-[#FFB800] transition-colors line-clamp-1">
                                  {item.title}
                                </h4>
                                <div className="text-[11px] text-sky-200 flex items-center gap-1 truncate">
                                  <MapPin className="w-3 h-3 text-[#FFB800] shrink-0" />
                                  <span>Yetkazib beruvchi manzili: {item.region}</span>
                                </div>
                                <div className="text-xs text-sky-300 truncate">
                                  Ta'minotchi: {item.supplierName}
                                </div>
                                <div className="pt-2 border-t border-[#1E3A6D] flex items-center justify-between">
                                  <span className="font-mono font-black text-sm text-[#FFB800]">
                                    {new Intl.NumberFormat('uz-UZ').format(item.originalPrice || item.price)} so'm
                                  </span>
                                  <span className="text-[10px] font-mono text-sky-200">/ {item.unit}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()
            ) : filteredManufacturerProducts.length === 0 ? (
              <div className="bg-slate-950 border-2 border-slate-900 rounded-3xl p-12 text-center space-y-3 shadow-2xl">
                <Building className="w-12 h-12 text-amber-500/40 mx-auto" />
                <p className="text-base font-black text-white">
                  Hozircha ishlab chiqaruvchilar tomonidan yuklangan mahsulotlar mavjud emas
                </p>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Ishlab chiqaruvchi Kabineti orqali zavodlar mahsulot qo‘shganda, ularning barchasi shu B2B bo‘limida avtomatik tarzda namoyon bo‘ladi.
                </p>
              </div>
            ) : (
              <div className="bg-[#0A1931] border-2 border-[#1E3A6D] rounded-3xl p-4 sm:p-6 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between pb-3 border-b border-[#1E3A6D]">
                  <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                    <Package className="w-4 h-4 text-[#FFB800]" />
                    <span>B2B Mahsulotlar Katalogi (Mahsulot ustiga bosib batafsil ko‘ring va savatga qo‘shing)</span>
                  </h3>
                  <span className="text-xs font-mono font-bold text-[#FFB800]">
                    B2B Savatda: {b2bCart.length} xil mahsulot
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredManufacturerProducts.map((product) => {
                    const unitPrice = product.originalPrice || product.price;
                    const availStock =
                      product.stock !== undefined && product.stock !== null ? Number(product.stock) : 1000;
                    return (
                      <div
                        key={product.id}
                        onClick={() => {
                          setSelectedB2bProduct(product);
                          setB2bDetailImgIdx(0);
                        }}
                        className="group bg-[#0F2547] hover:bg-[#16335F] border-2 border-[#1E3A6D] hover:border-[#FFB800] rounded-2xl overflow-hidden flex flex-col justify-between cursor-pointer transition-all shadow-lg"
                      >
                        <div>
                          <div className="relative h-48 w-full bg-[#071326] overflow-hidden border-b border-[#1E3A6D]">
                            <img
                              src={product.image}
                              alt={product.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-lg bg-[#0A1931]/90 text-[#FFB800] border border-[#FFB800]/40 text-[10px] font-black uppercase">
                              B2B mahsulotlar
                            </span>
                            {availStock <= 0 && (
                              <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-lg bg-red-600 text-white text-[10px] font-black uppercase">
                                Vaqtincha tugagan
                              </span>
                            )}
                          </div>
                          <div className="p-4 space-y-1.5">
                            <div className="text-[11px] font-bold text-[#FFB800] truncate">
                              Ta'minotchi: {product.supplierName}
                            </div>
                            <h4 className="font-black text-white text-base group-hover:text-[#FFB800] transition-colors line-clamp-1">
                              {product.title}
                            </h4>
                            <div className="text-xs text-sky-200 flex items-center gap-1 truncate">
                              <MapPin className="w-3.5 h-3.5 text-[#FFB800] shrink-0" />
                              <span>Yetkazib beruvchi manzili: {product.region}</span>
                            </div>
                            <div className="text-[11px] text-emerald-300 font-mono">
                              Omborda mavjud: {availStock} {product.unit}
                            </div>
                          </div>
                        </div>

                        <div className="p-4 pt-2 border-t border-[#1E3A6D] space-y-2.5">
                          <div className="flex items-baseline justify-between">
                            <span className="font-mono font-black text-base text-[#FFB800]">
                              {new Intl.NumberFormat('uz-UZ').format(unitPrice)} so'm
                            </span>
                            <span className="text-xs font-mono text-sky-200">/ {product.unit}</span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToB2bCart(product);
                            }}
                            className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md active:scale-95 transition-all"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            <span>Savatga qo‘shish</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* B2B Rasmni Kattalashtirish va Video Modallari */}
            {b2bZoomedImage && (
              <div
                className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn cursor-zoom-out"
                onClick={() => setB2bZoomedImage(null)}
              >
                <button
                  type="button"
                  onClick={() => setB2bZoomedImage(null)}
                  className="absolute top-5 right-5 p-3 rounded-2xl bg-slate-900 text-white hover:bg-red-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
                <img
                  src={b2bZoomedImage}
                  alt="Kattalashtirilgan rasm"
                  className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
                />
              </div>
            )}

            {b2bVideoModalProduct && b2bVideoModalProduct.videoUrl && (
              <div
                className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
                onClick={() => setB2bVideoModalProduct(null)}
              >
                <div
                  className="bg-[#0A1931] border-2 border-[#FFB800] rounded-3xl max-w-3xl w-full p-5 space-y-4 shadow-2xl relative"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-[#1E3A6D]">
                    <h4 className="text-sm sm:text-base font-black text-white">
                      {b2bVideoModalProduct.title} — Video tavsilot
                    </h4>
                    <button
                      type="button"
                      onClick={() => setB2bVideoModalProduct(null)}
                      className="p-2 rounded-xl bg-[#071326] text-white hover:bg-red-600 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black">
                    <iframe
                      src={b2bVideoModalProduct.videoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'www.youtube.com/embed/')}
                      title={b2bVideoModalProduct.title}
                      className="w-full h-full border-0"
                      allowFullScreen
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 6: Sozlamalar (Login, Parol va Korxona Profil Ma'lumotlarini SMS tasdiqlash orqali o'zgartirish) */}
        {activeTab === 'settings' && (
          <div className="bg-slate-950 border-2 border-slate-900 rounded-3xl p-6 sm:p-8 max-w-2xl mx-auto space-y-6 shadow-2xl animate-fadeIn">
            
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
                  className="w-full px-3.5 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-amber-500"
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
                    className="w-full pr-10 pl-3.5 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-amber-500"
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
                    className="w-full px-3.5 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}

              {/* Korxona Profil Ma'lumotlari (STIR orginfo.uz va stat.uz integratsiyasi — bitta jadval asosida) */}
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-amber-500/40 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <label className="text-amber-400 font-black flex items-center gap-1.5 text-xs">
                      <Building className="w-4 h-4 text-amber-400" />
                      <span>
                        {supplierData.cabinetType === 'manufacturer'
                          ? "Ishlab chiqaruvchi Ta'minot Kabineti STIR Raqami:"
                          : 'STIR Raqami:'}
                      </span>
                    </label>
                    {settingsStirLoading && (
                      <span className="text-[11px] text-amber-300 font-mono flex items-center gap-1 animate-pulse">
                        <RefreshCw className="w-3 h-3 animate-spin" /> Tekshirilmoqda...
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      maxLength={9}
                      value={settingsStir}
                      onChange={(e) => handleSettingsStirLookup(e.target.value)}
                      placeholder="STIR kiriting"
                      className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl text-white text-xs font-mono font-bold tracking-wider focus:outline-none"
                    />
                    <button
                      type="button"
                      disabled={settingsStirLoading || settingsStir.replace(/\D/g, '').length !== 9}
                      onClick={() => handleSettingsStirLookup(settingsStir)}
                      className="px-4 py-2.5 rounded-xl bg-[#FFB800] hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-black text-xs transition-all cursor-pointer shrink-0 flex items-center justify-center gap-1.5"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>STIR Tekshirish</span>
                    </button>
                  </div>

                  {settingsStirError && (
                    <p className="text-red-400 text-[11px] font-bold">{settingsStirError}</p>
                  )}

                  {/* STIR aniqlanganda barcha ma'lumotlar bitta yig'iladigan/ochiladigan jadval asosida ko'rinadi */}
                  {settingsCompanyInfo && (
                    <div className="mt-2 rounded-2xl bg-slate-950 border-2 border-amber-500/50 overflow-hidden shadow-xl animate-fadeIn">
                      <div
                        onClick={() => setIsStirInfoCollapsed(!isStirInfoCollapsed)}
                        className="p-4 bg-slate-900 border-b border-slate-800 space-y-2 cursor-pointer select-none hover:bg-slate-900/80 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <h4 className="text-sm sm:text-base font-black text-[#FFB800] leading-snug">
                            {settingsCompanyInfo.companyName}
                          </h4>
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black uppercase border ${
                                settingsCompanyInfo.status === 'active'
                                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                                  : 'bg-red-500/20 text-red-400 border-red-500/40'
                              }`}
                            >
                              {settingsCompanyInfo.status === 'active' ? 'Faol tashkilot' : 'Tugatilgan'}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsStirInfoCollapsed(!isStirInfoCollapsed);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-slate-950 border border-amber-500/40 text-amber-300 font-black text-[11px] cursor-pointer"
                            >
                              {isStirInfoCollapsed ? 'Ochish ▼' : 'Yig‘ish ▲'}
                            </button>
                          </div>
                        </div>
                        {!isStirInfoCollapsed && (
                          <p className="text-xs text-slate-200 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800">
                            {(settingsCompanyInfo.summaryText || '').replace(
                              /\s*\d{2}\.\d{2}\.\d{4}\s+holatiga\s+ko['‘]ra\s+ma['‘]lumotlar.*$/i,
                              ''
                            )}
                          </p>
                        )}
                      </div>

                      {!isStirInfoCollapsed && (
                        <div className="overflow-x-auto animate-fadeIn">
                          <table className="w-full text-left text-xs text-slate-200 border-collapse">
                            <tbody className="divide-y divide-slate-800">
                              <tr>
                                <th className="py-2.5 px-3.5 font-bold text-slate-400 w-2/5 bg-slate-900/60">
                                  Tashkilotning rasmiy nomi
                                </th>
                                <td className="py-2.5 px-3.5 font-black text-white">
                                  {settingsCompanyInfo.companyName}
                                </td>
                              </tr>
                              {settingsCompanyInfo.shortName && (
                                <tr>
                                  <th className="py-2.5 px-3.5 font-bold text-slate-400 bg-slate-900/60">
                                    Qisqacha nomi
                                  </th>
                                  <td className="py-2.5 px-3.5 font-bold text-amber-300">
                                    {settingsCompanyInfo.shortName}
                                  </td>
                                </tr>
                              )}
                              <tr>
                                <th className="py-2.5 px-3.5 font-bold text-slate-400 bg-slate-900/60">
                                  STIR (TIN) / Faollik holati
                                </th>
                                <td className="py-2.5 px-3.5 font-mono font-black text-[#FFB800]">
                                  {settingsCompanyInfo.inn} —{' '}
                                  <span className="text-emerald-400">
                                    {settingsCompanyInfo.status === 'active'
                                      ? 'Faol tashkilotdir (Hozirda mavjud)'
                                      : settingsCompanyInfo.statusDescription}
                                  </span>
                                </td>
                              </tr>
                              {settingsCompanyInfo.registrationDate && (
                                <tr>
                                  <th className="py-2.5 px-3.5 font-bold text-slate-400 bg-slate-900/60">
                                    Ro'yxatdan o'tgan sana
                                  </th>
                                  <td className="py-2.5 px-3.5 font-mono font-bold text-white">
                                    {settingsCompanyInfo.registrationDate}
                                  </td>
                                </tr>
                              )}
                              {(settingsCompanyInfo.locality || settingsCompanyInfo.address) && (
                                <tr>
                                  <th className="py-2.5 px-3.5 font-bold text-slate-400 bg-slate-900/60">
                                    Viloyat / Manzil
                                  </th>
                                  <td className="py-2.5 px-3.5 font-medium text-white">
                                    {settingsCompanyInfo.locality || settingsCompanyInfo.address}
                                  </td>
                                </tr>
                              )}
                              {settingsCompanyInfo.director && (
                                <tr>
                                  <th className="py-2.5 px-3.5 font-bold text-slate-400 bg-slate-900/60">
                                    Direktor (Rahbar)
                                  </th>
                                  <td className="py-2.5 px-3.5 font-black text-amber-400">
                                    {settingsCompanyInfo.director.toUpperCase()}
                                  </td>
                                </tr>
                              )}
                              {settingsCompanyInfo.activityType && (
                                <tr>
                                  <th className="py-2.5 px-3.5 font-bold text-slate-400 bg-slate-900/60">
                                    Asosiy faoliyat turi {settingsCompanyInfo.okedCode ? `(OKED ${settingsCompanyInfo.okedCode})` : ''}
                                  </th>
                                  <td className="py-2.5 px-3.5 font-semibold text-white">
                                    {settingsCompanyInfo.activityType}
                                  </td>
                                </tr>
                              )}
                              {settingsCompanyInfo.charterCapital && (
                                <tr>
                                  <th className="py-2.5 px-3.5 font-bold text-slate-400 bg-slate-900/60">
                                    Ustav kapitali
                                  </th>
                                  <td className="py-2.5 px-3.5 font-mono font-black text-emerald-400">
                                    {settingsCompanyInfo.charterCapital}
                                  </td>
                                </tr>
                              )}
                              <tr>
                                <th className="py-2.5 px-3.5 font-bold text-slate-400 bg-slate-900/60">
                                  Ta'sischilar soni
                                </th>
                                <td className="py-2.5 px-3.5 font-bold text-white">
                                  {settingsCompanyInfo.foundersCount ?? 1}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Shartnoma Raqami:</label>
                  <input
                    type="text"
                    value={settingsContractNumber}
                    onChange={(e) => setSettingsContractNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-amber-400 text-xs font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Qo'shimcha telefon raqam kiritish (Asosiy raqamga SMS orqali tasdiqlanadi) */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-emerald-500/40 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <label className="text-emerald-400 font-black flex items-center gap-1.5 text-xs">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Qo‘shimcha telefon raqam kiritish (Asosiy raqamga SMS orqali):</span>
                  </label>
                  {supplierData.secondaryPhone && (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono text-[10px] font-black">
                      Biriktirilgan: {supplierData.secondaryPhone}
                    </span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold text-[11px] block">
                    Qo‘shimcha telefon raqam (mahsulot yuklashda SMS tasdiqlash uchun ham tanlash mumkin):
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="tel"
                      maxLength={17}
                      value={settingsSecondaryPhone}
                      onChange={(e) => {
                        setSettingsSecondaryPhone(formatUzPhoneInput(e.target.value));
                        setSecondaryPhoneError(null);
                      }}
                      placeholder="+998 90 123 45 67"
                      className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl text-white text-xs font-mono focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleSendSecondaryPhoneSms}
                      className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs cursor-pointer transition-colors shrink-0 shadow-md"
                    >
                      {secondaryPhoneSmsSent
                        ? 'Asosiy raqamga SMS qayta yuborish'
                        : `Asosiy raqamga (${supplierData.phone}) SMS yuborish`}
                    </button>
                  </div>
                </div>

                {secondaryPhoneSmsNotice && (
                  <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold animate-fadeIn">
                    {secondaryPhoneSmsNotice}
                  </div>
                )}

                {secondaryPhoneSmsSent && (
                  <div className="flex flex-col sm:flex-row gap-2 animate-fadeIn">
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={secondaryPhoneSmsInput}
                      onChange={(e) => {
                        setSecondaryPhoneSmsInput(e.target.value.replace(/\D/g, '').slice(0, 6));
                        setSecondaryPhoneError(null);
                      }}
                      placeholder="Asosiy raqamga kelgan 6 xonali SMS kod"
                      className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-emerald-500 rounded-xl text-white text-sm font-mono tracking-widest focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleSaveSecondaryPhone}
                      className="px-5 py-2.5 rounded-xl bg-[#FFB800] hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer shrink-0 shadow-md"
                    >
                      Qo‘shimcha raqamni saqlash
                    </button>
                  </div>
                )}

                {secondaryPhoneError && (
                  <div className="p-2.5 rounded-xl bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-bold">
                    {secondaryPhoneError}
                  </div>
                )}

                {secondaryPhoneSuccess && (
                  <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                    Qo‘shimcha telefon raqami asosiy raqam SMS tasdig‘i orqali saqlandi!
                  </div>
                )}
              </div>

              {/* Login va Parolni o'zgartirish uchun Asosiy raqam SMS Tasdiqlash bloki */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-amber-500/40 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-amber-400 font-bold flex items-center gap-1.5 text-xs">
                    <Phone className="w-3.5 h-3.5 text-amber-400" />
                    <span>Login va parolni o‘zgartirish (Asosiy raqamga SMS tasdiqlash):</span>
                  </label>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold text-[11px] block">
                    Kabinetning Asosiy telefon raqami (SMS kod faqat asosiy raqamga yuboriladi):
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      readOnly
                      value={supplierData.phone || settingsPhone}
                      className="flex-1 px-3.5 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-amber-300 text-xs font-mono font-bold cursor-not-allowed focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleSendSettingsSms}
                      className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer transition-colors shrink-0 shadow-md"
                    >
                      {settingsSmsSent ? 'SMS kodni qayta yuborish' : 'Tasdiqlash kodini yuborish'}
                    </button>
                  </div>
                </div>

                {settingsSmsNotice && (
                  <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold animate-fadeIn">
                    {settingsSmsNotice}
                  </div>
                )}

                {settingsSmsSent && (
                  <div className="space-y-1.5 animate-fadeIn">
                    <label className="text-slate-300 font-bold text-[11px]">
                      Asosiy raqamga yuborilgan 6 xonali SMS kodni kiriting:
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={settingsSmsInput}
                      onChange={(e) => {
                        setSettingsSmsInput(e.target.value.replace(/\D/g, '').slice(0, 6));
                        setSettingsError(null);
                      }}
                      placeholder="6 xonali SMS kodni kiriting"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-amber-500 rounded-xl text-white text-sm font-mono tracking-widest focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {settingsError && (
                <div className="p-3 rounded-xl bg-red-500/20 text-red-300 border border-red-500/30 text-xs flex items-center gap-2 font-bold animate-fadeIn">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{settingsError}</span>
                </div>
              )}

              {settingsSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs flex items-center gap-2 font-bold animate-fadeIn">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>Kabinet sozlamalari SMS tasdiqlash orqali muvaffaqiyatli saqlandi!</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full sm:w-auto px-7 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-500/20 cursor-pointer active:scale-95 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>{settingsSmsSent ? 'SMS Tasdiqlash va Saqlash' : 'Sozlamalarni Saqlash'}</span>
              </button>
            </form>

          </div>
        )}

          </div>
        </div>
      </main>

      {/* =========================================================================
          ADD PRODUCT MODAL (KATTALASHTIRILGAN OYNA: max-w-5xl):
          - Ketma-ketlik:
            1) Mahsulot Nomi va Mahsulot Turi
            2) Mahsulot Suratlari (12 tagacha) va Video havolasi
            3) Mavjudligi (O'lchov birligi: Kv, metr, kg, dona; Rang tanlash; Xususiyatlar; Narx) + "+ Mavjudlik qo'shish"
            4) Mahsulot haqida izoh va tavsif (0/300) + Rasmli tavsif (0/4 ta)
            5) SMS Tasdiqlash orqali yuklash
            6) Tugmalar: "Onlaynga chiqarish" (CRM dan kirilganda: "Onlayn savdoga chiqarish" va "Oflayn uchun")
          ========================================================================= */}
      {isAddProductOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border-2 border-amber-500/60 rounded-3xl max-w-5xl w-full p-5 sm:p-8 space-y-6 shadow-2xl relative max-h-[94vh] overflow-y-auto text-xs">
            
            {/* Close button */}
            <button
              type="button"
              onClick={() => {
                setIsAddProductOpen(false);
                setEditingProduct(null);
              }}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-2.5 rounded-xl bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Title */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pr-10 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3.5">
                <div className="p-3.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  {editingProduct ? <Settings className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl sm:text-2xl font-black text-white">
                      {editingProduct ? 'Mahsulotni Tahrirlash' : 'Yangi Mahsulot Qo‘shish'}
                    </h2>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                      addProductChannel === 'offline'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    }`}>
                      {addProductChannel === 'offline' ? 'Oflayn Mahsulot' : 'Onlayn Bunker Mahsuloti'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Mahsulot nomi, turi, narxi (Bunker narxi va CRM narxi), surati, video tavsifi va mavjudligi (o‘lchov birligi va ranglar)
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={(e) => handleCreateProduct(e)} noValidate className="space-y-5">
              
              {/* 1. MAHSULOT NOMI, MAHSULOT TURI (QO'LDA + TAVSIYA RO'YXATI), BUNKER NARXI, CRM NARXI VA MINIMAL BUYURTMA */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-200 font-black text-xs sm:text-sm flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-black text-[11px] flex items-center justify-center">
                        1
                      </span>
                      <span>Mahsulot Nomi:</span>
                    </label>
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="Masalan: Sement Portlend M500 D0 (Bekobod)"
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs sm:text-sm font-bold focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Mahsulot Turi — Qo'lda kiritiladi + platformada mavjud mahsulotlar tavsiya ro'yxati */}
                  <div className="space-y-1.5 relative">
                    <div className="flex items-center justify-between">
                      <label className="text-slate-200 font-black text-xs sm:text-sm">
                        Mahsulot Turi (Qo‘lda kiriting yoki tavsiyadan tanlang):
                      </label>
                      <span className="text-[10px] text-amber-400 font-mono">Tavsiya ro‘yxati</span>
                    </div>
                    <input
                      type="text"
                      value={newCategory}
                      onFocus={() => setShowCategorySuggestions(true)}
                      onBlur={() => setTimeout(() => setShowCategorySuggestions(false), 180)}
                      onChange={(e) => {
                        setNewCategory(e.target.value.replace(/[0-9]/g, ''));
                        setShowCategorySuggestions(true);
                      }}
                      placeholder="Masalan: Sement, Blok, Armatura, G‘isht..."
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs sm:text-sm font-bold focus:outline-none focus:border-amber-500"
                    />
                    {showCategorySuggestions && allPlatformCategorySuggestions.length > 0 && (() => {
                      const q = newCategory.trim().toLowerCase();
                      const matches = q
                        ? allPlatformCategorySuggestions.filter((c) => c.toLowerCase().includes(q))
                        : allPlatformCategorySuggestions;
                      if (matches.length === 0) return null;
                      return (
                        <div className="absolute z-30 left-0 right-0 top-full mt-1 max-h-48 overflow-y-auto rounded-xl bg-slate-900 border border-amber-500/60 shadow-2xl divide-y divide-slate-800">
                          <div className="px-3 py-1.5 text-[10px] font-mono font-bold text-amber-400 uppercase bg-slate-950/90">
                            Platformada mavjud mahsulot turlari ({matches.length})
                          </div>
                          {matches.map((cat) => (
                            <button
                              key={cat}
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setNewCategory(cat);
                                setShowCategorySuggestions(false);
                              }}
                              className="w-full text-left px-3.5 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-amber-500 hover:text-slate-950 transition-colors flex items-center justify-between cursor-pointer"
                            >
                              <span>{cat}</span>
                              <span className="text-[10px] font-mono opacity-75">Tanlash</span>
                            </button>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Narxi (Bunker Stroy narxi), CRM narxi, Asl narxi (Keltirilgan narxi) va Ombordagi miqdori */}
                {supplierData.cabinetType === 'manufacturer' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-3 border-t border-slate-800/80">
                    <div className="space-y-1.5 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/35">
                      <label className="text-amber-400 font-black text-xs sm:text-sm block">
                        Narxi (Bunker Stroy narxi — so‘m):
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Platformadagi onlayn narxi"
                        value={newPrice}
                        onChange={(e) => {
                          const cleanDigits = e.target.value.replace(/\D/g, '');
                          const val = cleanDigits ? Number(cleanDigits) : '';
                          setNewPrice(val);
                          setDraftVariants((prev) => prev.map((v) => ({ ...v, price: val })));
                        }}
                        className="w-full px-3.5 py-2.5 bg-slate-900 border border-amber-500/50 rounded-xl text-white text-xs sm:text-sm font-mono font-bold focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div className="space-y-1.5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/35">
                      <label className="text-emerald-400 font-black text-xs sm:text-sm block">
                        CRM narxi (CRMda ishlaydigan narx — so‘m):
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="CRM savdo tizimidagi narxi"
                        value={newOriginalPrice}
                        onChange={(e) => {
                          const cleanDigits = e.target.value.replace(/\D/g, '');
                          const val = cleanDigits ? Number(cleanDigits) : '';
                          setNewOriginalPrice(val);
                          setDraftVariants((prev) => prev.map((v) => ({ ...v, originalPrice: val })));
                        }}
                        className="w-full px-3.5 py-2.5 bg-slate-900 border border-emerald-500/50 rounded-xl text-white text-xs sm:text-sm font-mono font-bold focus:outline-none focus:border-emerald-400"
                      />
                    </div>

                    <div className="space-y-1.5 p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                      <label className="text-slate-200 font-black text-xs sm:text-sm block">
                        Minimal buyurtma miqdori:
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={newMinOrder}
                        onChange={(e) => {
                          const cleanDigits = e.target.value.replace(/\D/g, '');
                          const val = cleanDigits ? Math.max(1, Number(cleanDigits)) : '';
                          setNewMinOrder(val);
                          setDraftVariants((prev) => prev.map((v) => ({ ...v, minOrder: val || 1 })));
                        }}
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-amber-400 text-xs sm:text-sm font-mono font-bold focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div className="space-y-1.5 p-3.5 rounded-xl bg-sky-500/10 border border-sky-500/35">
                      <label className="text-sky-300 font-black text-xs sm:text-sm block">
                        Ombordagi miqdori:
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Ombordagi mavjud miqdor"
                        value={newStock}
                        onChange={(e) => {
                          const cleanDigits = e.target.value.replace(/\D/g, '');
                          const val = cleanDigits !== '' ? Number(cleanDigits) : '';
                          setNewStock(val);
                        }}
                        className="w-full px-3.5 py-2.5 bg-slate-900 border border-sky-500/50 rounded-xl text-white text-xs sm:text-sm font-mono font-bold focus:outline-none focus:border-sky-400"
                      />
                    </div>
                  </div>
                ) : (
                  /* B2C Kabinetida: Minimal buyurtma kiritilmaydi! Asl narxi (Keltirilgan / sotib olingan narxi), Sotuv narxlari va Ombordagi miqdori kiritiladi */
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-3 border-t border-slate-800/80">
                    <div className="space-y-1.5 p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/40">
                      <label className="text-purple-300 font-black text-xs sm:text-sm block">
                        Asl narxi (Keltirilgan / sotib olingan narxi — so‘m):
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Sotib olingan / keltirilgan narxi"
                        value={newCostPrice}
                        onChange={(e) => {
                          const cleanDigits = e.target.value.replace(/\D/g, '');
                          const val = cleanDigits ? Number(cleanDigits) : '';
                          setNewCostPrice(val);
                        }}
                        className="w-full px-3.5 py-2.5 bg-slate-900 border border-purple-500/50 rounded-xl text-white text-xs sm:text-sm font-mono font-bold focus:outline-none focus:border-purple-400"
                      />
                    </div>

                    <div className="space-y-1.5 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/35">
                      <label className="text-amber-400 font-black text-xs sm:text-sm block">
                        Narxi (Bunker Stroy sotuv narxi — so‘m):
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Platformadagi onlayn narxi"
                        value={newPrice}
                        onChange={(e) => {
                          const cleanDigits = e.target.value.replace(/\D/g, '');
                          const val = cleanDigits ? Number(cleanDigits) : '';
                          setNewPrice(val);
                          setDraftVariants((prev) => prev.map((v) => ({ ...v, price: val })));
                        }}
                        className="w-full px-3.5 py-2.5 bg-slate-900 border border-amber-500/50 rounded-xl text-white text-xs sm:text-sm font-mono font-bold focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div className="space-y-1.5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/35">
                      <label className="text-emerald-400 font-black text-xs sm:text-sm block">
                        CRM narxi (CRMda sotuv narxi — so‘m):
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="CRM savdo tizimidagi narxi"
                        value={newOriginalPrice}
                        onChange={(e) => {
                          const cleanDigits = e.target.value.replace(/\D/g, '');
                          const val = cleanDigits ? Number(cleanDigits) : '';
                          setNewOriginalPrice(val);
                          setDraftVariants((prev) => prev.map((v) => ({ ...v, originalPrice: val })));
                        }}
                        className="w-full px-3.5 py-2.5 bg-slate-900 border border-emerald-500/50 rounded-xl text-white text-xs sm:text-sm font-mono font-bold focus:outline-none focus:border-emerald-400"
                      />
                    </div>

                    <div className="space-y-1.5 p-3.5 rounded-xl bg-sky-500/10 border border-sky-500/40">
                      <label className="text-sky-300 font-black text-xs sm:text-sm block">
                        Ombordagi miqdori:
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Omborda mavjud miqdor"
                        value={newStock}
                        onChange={(e) => {
                          const cleanDigits = e.target.value.replace(/\D/g, '');
                          const val = cleanDigits !== '' ? Number(cleanDigits) : '';
                          setNewStock(val);
                        }}
                        className="w-full px-3.5 py-2.5 bg-slate-900 border border-sky-500/50 rounded-xl text-white text-xs sm:text-sm font-mono font-bold focus:outline-none focus:border-sky-400"
                      />
                    </div>
                  </div>
                )}

                {/* Ishlab chiqarilgan davlat — Faqat B2C kabinetida ko'rinadi (B2B da kerak emas) */}
                {supplierData.cabinetType !== 'manufacturer' && (
                  <div className="pt-3 border-t border-slate-800/80 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="text-slate-200 font-black text-xs sm:text-sm flex items-center gap-2">
                        <Globe className="w-4 h-4 text-amber-400" />
                        <span>Ishlab chiqarilgan davlat:</span>
                      </label>
                    </div>
                    <input
                      type="text"
                      value={newManufacturer}
                      onChange={(e) => setNewManufacturer(e.target.value.replace(/[0-9]/g, ''))}
                      placeholder="Ishlab chiqarilgan davlat nomini yozing (masalan: O‘zbekiston, Xitoy)..."
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs sm:text-sm font-bold focus:outline-none focus:border-amber-500"
                    />
                  </div>
                )}
              </div>

              {/* 2. MAHSULOT SURATLARI (Majburiy — 12 tagacha) VA MAHSULOTNING VIDEO TAVSIFI */}
              <div className="space-y-3 p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-slate-200 font-black text-xs sm:text-sm flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-black text-[11px] flex items-center justify-center">
                      2
                    </span>
                    <ImageIcon className="w-4 h-4 text-amber-400" />
                    <span>Mahsulot Suratlari:</span>
                    <span className="px-2 py-0.5 rounded-md bg-red-500/20 text-red-300 border border-red-500/40 text-[10px] font-black uppercase">
                      Majburiy
                    </span>
                  </label>
                  <span
                    className={`text-xs font-mono font-bold ${
                      newImages.length === 0
                        ? 'text-red-400'
                        : newImages.length >= 12
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {newImages.length} / 12 ta yuklandi
                  </span>
                </div>

                {newImages.length < 12 && (
                  <label className="flex items-center justify-center gap-3 p-4 bg-slate-900/60 hover:bg-slate-900 border-2 border-dashed border-amber-500/50 hover:border-amber-400 rounded-2xl text-slate-300 transition-all cursor-pointer group">
                    <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 group-hover:scale-110 transition-transform">
                      <Upload className="w-5 h-5" />
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-white">Surat yuklash</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleMultiImageUpload}
                      className="hidden"
                    />
                  </label>
                )}

                {newImages.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 pt-1">
                    {newImages.map((img, idx) => (
                      <div
                        key={idx}
                        className="relative rounded-xl overflow-hidden border border-slate-800 aspect-square group bg-slate-900"
                      >
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

                {/* Mahsulotning video tavsifi */}
                <div className="pt-3 border-t border-slate-800/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-200 font-black text-xs sm:text-sm">
                      Mahsulotning video tavsifi (YouTube video havolasi):
                    </span>
                    {newVideoUrl && (
                      <button
                        type="button"
                        onClick={() => setNewVideoUrl('')}
                        className="text-[11px] text-red-400 hover:underline cursor-pointer"
                      >
                        Havolani o‘chirish
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="Mahsulot video tavsifi uchun YouTube havolasini kiriting (masalan: https://youtu.be/...)"
                    value={newVideoUrl.startsWith('data:') ? '' : newVideoUrl}
                    onChange={(e) => setNewVideoUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-emerald-500/50 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* 3. MAVJUDLIGI: O'lchov birligi (har birining pastidan raqam kiritish bilan), Variant Narxi va Rang tanlash + Oynani yig'ib qo'yish imkoni */}
              <div className="space-y-4 p-4 sm:p-6 rounded-2xl bg-slate-950 border-2 border-amber-500/40">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div
                    onClick={() => setIsMavjudlikSectionCollapsed((prev) => !prev)}
                    className="cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-black text-[11px] flex items-center justify-center">
                        3
                      </span>
                      <Layers className="w-4 h-4 text-amber-400" />
                      <span className="text-sm sm:text-base font-black text-amber-400 uppercase tracking-wider">
                        Mavjudligi (O‘lchov birligi va Rang tanlash):
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Mijoz mahsulot tanlayotganda o‘lchov birligi, rangi va narxini ko‘rishi uchun mavjudlik variantlarini kiriting
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                    <button
                      type="button"
                      onClick={handleAddDraftVariant}
                      className="px-4 py-2.5 rounded-xl bg-[#FFB800] hover:bg-[#FFC928] text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/20"
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                      <span>+ Mavjudlik qo‘shish</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsMavjudlikSectionCollapsed((prev) => !prev)}
                      className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 border border-amber-500/40 font-mono font-black text-xs cursor-pointer transition-colors"
                    >
                      {isMavjudlikSectionCollapsed ? `Ochish (${draftVariants.length}) ▼` : 'Yig‘ish ▲'}
                    </button>
                  </div>
                </div>

                {/* Saqlangan mavjudliklar ro'yxati — saqlash bosilganda shu yerda yaqqol ko'rinadi */}
                {draftVariants.length > 0 && (
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-emerald-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Kiritilgan Mavjudliklar ({draftVariants.length} ta):</span>
                      </span>
                      <span className="text-[10px] text-slate-400">
                        SMS tasdiqlashsiz saqlanadi
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {draftVariants.map((dv, idx) => {
                        const dispSpec =
                          dv.unitValues?.[dv.unit]?.trim()
                            ? `${dv.unitValues[dv.unit].trim()} ${dv.unit}`
                            : dv.specification || `1 ${dv.unit}`;
                        const dispPrice = Number(dv.price) || Number(newPrice) || 0;
                        return (
                          <div
                            key={dv.id}
                            onClick={() => {
                              setIsMavjudlikSectionCollapsed(false);
                              handleUpdateDraftVariant(dv.id, { isCollapsed: !dv.isCollapsed });
                            }}
                            className={`px-3 py-2 rounded-xl border text-xs flex items-center gap-2 cursor-pointer transition-all ${
                              dv.isSaved
                                ? 'bg-emerald-500/15 border-emerald-500/50 text-white'
                                : 'bg-slate-950 border-amber-500/40 text-slate-200'
                            }`}
                          >
                            <span className="font-mono font-black text-[#FFB800]">#{idx + 1}</span>
                            <span className="font-black text-white">{dispSpec}</span>
                            {dispPrice > 0 && (
                              <span className="font-mono font-bold text-emerald-300">
                                • {formatPrice(dispPrice)}
                              </span>
                            )}
                            {dv.colors.length > 0 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-sky-300 font-mono">
                                {dv.colors.length} rang
                              </span>
                            )}
                            {dv.isSaved && <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {!isMavjudlikSectionCollapsed && (
                  <div className="space-y-4 animate-fadeIn">
                    {draftVariants.map((variant, vIdx) => {
                      const currentUnitNum = variant.unitValues?.[variant.unit]?.trim() || '';
                      const displaySpecLabel = currentUnitNum
                        ? `${currentUnitNum} ${variant.unit}`
                        : variant.specification || `1 ${variant.unit}`;
                      const displayVariantPrice =
                        Number(variant.price) || Number(newPrice) || 0;

                      return (
                        <div
                          key={variant.id}
                          className={`p-4 sm:p-5 rounded-2xl border space-y-4 relative transition-all ${
                            variant.isSaved && variant.isCollapsed
                              ? 'bg-slate-900/90 border-emerald-500/50'
                              : 'bg-slate-900 border-slate-700'
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-3 py-1 rounded-lg bg-amber-500/20 text-[#FFB800] border border-amber-500/40 font-mono font-black text-xs">
                                Mavjudlik #{vIdx + 1}
                              </span>
                              <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono font-black text-white">
                                {displaySpecLabel}
                              </span>
                              {displayVariantPrice > 0 && (
                                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-xs font-mono font-black text-emerald-300">
                                  {formatPrice(displayVariantPrice)}
                                </span>
                              )}
                              {variant.colors.length > 0 && (
                                <span className="text-[11px] font-mono text-sky-300">
                                  ({variant.colors.join(', ')})
                                </span>
                              )}
                              {variant.isSaved && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black">
                                  <Check className="w-3 h-3 stroke-[3]" /> Saqlangan
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              {!variant.isCollapsed && (
                                <button
                                  type="button"
                                  onClick={() => handleSaveSingleDraftVariant(variant.id)}
                                  className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1 cursor-pointer shadow"
                                >
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                  <span>Saqlash</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateDraftVariant(variant.id, { isCollapsed: !variant.isCollapsed })
                                }
                                className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-amber-400 border border-slate-700 font-mono font-black text-[11px] cursor-pointer"
                              >
                                {variant.isCollapsed ? 'Ochish ▼' : 'Yig‘ish ▲'}
                              </button>
                              {draftVariants.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveDraftVariant(variant.id)}
                                  className="px-3 py-1 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30 font-bold text-xs flex items-center gap-1 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>O‘chirish</span>
                                </button>
                              )}
                            </div>
                          </div>

                          {!variant.isCollapsed && (
                            <>
                              {/* A) O'lchov birligi tanlash va har bir o'lchov birligida pastidan raqam kiritish */}
                              <div className="space-y-2.5">
                                <div className="flex items-center justify-between">
                                  <label className="text-slate-200 font-bold flex items-center gap-1.5 text-xs sm:text-sm">
                                    <Scale className="w-3.5 h-3.5 text-amber-400" />
                                    <span>O‘lchov Birligi (pastidan raqam kiriting):</span>
                                  </label>
                                  <span className="text-[11px] text-amber-400 font-mono font-bold">
                                    Tanlangan: {displaySpecLabel}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                  {['Kv', 'metr', 'kg', 'dona'].map((u) => {
                                    const isUnitSelected = variant.unit === u;
                                    const unitNumVal = variant.unitValues?.[u] ?? '';
                                    return (
                                      <div
                                        key={u}
                                        className={`p-2.5 rounded-xl border transition-all space-y-2 ${
                                          isUnitSelected
                                            ? 'bg-amber-500/15 border-amber-400 shadow-md'
                                            : 'bg-slate-950 border-slate-800 hover:border-amber-400/50'
                                        }`}
                                      >
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const currentNum = variant.unitValues?.[u] || '';
                                            handleUpdateDraftVariant(variant.id, {
                                              unit: u,
                                              specification: currentNum ? `${currentNum} ${u}` : '',
                                              isSaved: false,
                                            });
                                            if (vIdx === 0) setNewUnit(u);
                                          }}
                                          className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                            isUnitSelected
                                              ? 'bg-amber-500 text-slate-950 font-black shadow'
                                              : 'bg-slate-900 text-slate-300 hover:text-white'
                                          }`}
                                        >
                                          <span>{u}</span>
                                          {isUnitSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                        </button>

                                        <input
                                          type="text"
                                          inputMode="decimal"
                                          placeholder={`${u} raqami (masalan: 1)`}
                                          value={unitNumVal}
                                          onFocus={() => {
                                            if (variant.unit !== u) {
                                              const currentNum = variant.unitValues?.[u] || '';
                                              handleUpdateDraftVariant(variant.id, {
                                                unit: u,
                                                specification: currentNum ? `${currentNum} ${u}` : '',
                                              });
                                              if (vIdx === 0) setNewUnit(u);
                                            }
                                          }}
                                          onChange={(e) => {
                                            const rawVal = e.target.value.replace(/[^0-9.]/g, '');
                                            const nextUnitValues = {
                                              ...(variant.unitValues || { Kv: '', metr: '', kg: '', dona: '' }),
                                              [u]: rawVal,
                                            };
                                            handleUpdateDraftVariant(variant.id, {
                                              unit: u,
                                              unitValues: nextUnitValues,
                                              specification: rawVal ? `${rawVal} ${u}` : '',
                                              isSaved: false,
                                            });
                                            if (vIdx === 0) setNewUnit(u);
                                          }}
                                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-lg text-white text-xs font-mono font-bold text-center focus:outline-none"
                                        />
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* B) Mavjudlik uchun Narx yozish (mijoz mos variantni tanlaganda narxni ko'rishi uchun) */}
                              <div className="pt-2.5 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <label className="text-amber-400 font-black text-xs block">
                                    Mavjudlik #{vIdx + 1} Narxi ({displaySpecLabel} uchun — so‘m):
                                  </label>
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    placeholder={
                                      newPrice
                                        ? `Variant narxi (Asosiy: ${newPrice} so'm)`
                                        : 'Ushbu variant narxini yozing (so‘m)'
                                    }
                                    value={variant.price}
                                    onChange={(e) => {
                                      const cleanDigits = e.target.value.replace(/\D/g, '');
                                      const val = cleanDigits ? Number(cleanDigits) : '';
                                      handleUpdateDraftVariant(variant.id, { price: val, isSaved: false });
                                      if (vIdx === 0 && !newPrice && val) {
                                        setNewPrice(val);
                                      }
                                    }}
                                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-amber-500/50 focus:border-amber-400 rounded-xl text-white text-xs sm:text-sm font-mono font-bold focus:outline-none"
                                  />
                                </div>

                                <div className="space-y-1">
                                  <label className="text-emerald-400 font-black text-xs block">
                                    CRM Narxi (ixtiyoriy — so‘m):
                                  </label>
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    placeholder={
                                      newOriginalPrice
                                        ? `CRM narxi (${newOriginalPrice} so'm)`
                                        : 'CRM uchun variant narxi (so‘m)'
                                    }
                                    value={variant.originalPrice}
                                    onChange={(e) => {
                                      const cleanDigits = e.target.value.replace(/\D/g, '');
                                      const val = cleanDigits ? Number(cleanDigits) : '';
                                      handleUpdateDraftVariant(variant.id, { originalPrice: val, isSaved: false });
                                    }}
                                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-emerald-500/40 focus:border-emerald-400 rounded-xl text-white text-xs sm:text-sm font-mono font-bold focus:outline-none"
                                  />
                                </div>
                              </div>

                              {/* C) Rang tanlash imkoni (32 xil asosiy rang palitrasi) */}
                              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                                <div className="flex items-center justify-between">
                                  <label className="text-slate-200 font-bold flex items-center gap-1.5 text-xs sm:text-sm">
                                    <Palette className="w-3.5 h-3.5 text-amber-400" />
                                    <span>Rang tanlash ({displaySpecLabel} mavjudligi uchun):</span>
                                  </label>
                                  <span className="text-[11px] font-mono font-bold text-emerald-400">
                                    {variant.colors.length} / 12 ta rang tanlandi
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateDraftVariant(variant.id, { isColorOpen: !variant.isColorOpen })
                                  }
                                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border font-bold text-xs transition-all cursor-pointer ${
                                    variant.isColorOpen
                                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                                      : 'bg-slate-950 text-slate-200 border-slate-800 hover:border-amber-500/50'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <Palette className="w-4 h-4 text-amber-400" />
                                    <span>Ranglar palitrasi (32 xil asosiy rangdan tanlash)</span>
                                  </div>
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 text-amber-400 font-mono font-black">
                                    {variant.isColorOpen ? 'Yopish ▲' : 'Ochish ▼'}
                                  </span>
                                </button>

                                {variant.isColorOpen && (
                                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl max-h-52 overflow-y-auto">
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                                      {PALETTE_32_COLORS.map((col) => {
                                        const isSel = variant.colors.includes(col.name);
                                        return (
                                          <button
                                            key={col.name}
                                            type="button"
                                            onClick={() => handleToggleVariantColor(variant.id, col.name)}
                                            className={`p-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                                              isSel
                                                ? 'bg-amber-500 text-slate-950 border-amber-300 font-black shadow-md'
                                                : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-amber-400/50'
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

                                {variant.colors.length > 0 && (
                                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                    {variant.colors.map((colName) => {
                                      const colObj = PALETTE_32_COLORS.find((c) => c.name === colName);
                                      return (
                                        <span
                                          key={colName}
                                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-medium"
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
                                            onClick={() => handleToggleVariantColor(variant.id, colName)}
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

                              {/* D) Mavjudlikni saqlash tugmasi (SMS tasdiqlashsiz saqlaydi va mavjudlikni ko'rsatadi) */}
                              <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
                                <span className="text-[11px] text-slate-400">
                                  Mavjudlikni saqlashda SMS kod talab qilinmaydi
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleSaveSingleDraftVariant(variant.id)}
                                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span>Mavjudlik #{vIdx + 1} ni saqlash</span>
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 4. MAHSULOT HAQIDA IZOH VA RASMLI TAVSIF */}
              <div className="space-y-4 p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-200 font-black text-xs sm:text-sm flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-black text-[11px] flex items-center justify-center">
                        4
                      </span>
                      <span>Mahsulot haqida izoh va tavsif:</span>
                    </label>
                    <span
                      className={`text-[10px] font-mono ${
                        newDesc.length >= 300
                          ? 'text-red-400 font-bold'
                          : newDesc.length >= 250
                          ? 'text-amber-400 font-bold'
                          : 'text-slate-500'
                      }`}
                    >
                      {newDesc.length} / 300
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    maxLength={300}
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value.slice(0, 300))}
                    placeholder="Mahsulot sifati, qo‘llanilishi va afzalliklari haqida qisqacha ma’lumot..."
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500 resize-none"
                  />
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-800/70">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-200 font-black text-xs sm:text-sm flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-amber-400" />
                      <span>Mahsulot haqida rasmli tavsif:</span>
                    </label>
                    <span className="text-xs font-mono font-black text-amber-400">
                      {detailBlocks.length} / 4 ta
                    </span>
                  </div>

                  {detailBlocks.length < 4 && (
                    <label className="flex items-center justify-center gap-2 p-3 bg-slate-900 hover:bg-slate-800 border-2 border-dashed border-amber-500/50 rounded-xl text-amber-400 font-black text-xs cursor-pointer transition-colors">
                      <Upload className="w-4 h-4" />
                      <span>Tavsif uchun rasm qo‘shish ({4 - detailBlocks.length} ta joy qoldi)</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleAddDetailBlockImage}
                        className="hidden"
                      />
                    </label>
                  )}

                  {detailBlocks.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                      {detailBlocks.map((block, bIdx) => (
                        <div
                          key={bIdx}
                          className="flex flex-col rounded-2xl bg-slate-900 border border-slate-700 overflow-hidden shadow-md"
                        >
                          <div className="px-3.5 py-2 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-2">
                            <span className="text-xs font-mono text-amber-400 font-black">
                              Mahsulot haqida ma'lumot #{bIdx + 1}
                            </span>
                            <div className="flex items-center gap-2">
                              <label className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 text-[11px] font-bold cursor-pointer transition-colors">
                                Rasmni almashtirish
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleReplaceDetailBlockImage(bIdx, e)}
                                  className="hidden"
                                />
                              </label>
                              <button
                                type="button"
                                onClick={() => handleRemoveDetailBlock(bIdx)}
                                className="px-2 py-1 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-400 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>O‘chirish</span>
                              </button>
                            </div>
                          </div>

                          {/* Yuklangan rasm kichik bo'lsa ham to'liq ko'rinishi uchun object-contain */}
                          <div className="relative h-44 w-full bg-slate-950 border-b border-slate-800 flex items-center justify-center p-2">
                            <img
                              src={block.image}
                              alt={`Tavsif ${bIdx + 1}`}
                              className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg"
                            />
                          </div>

                          <div className="p-3 space-y-1.5">
                            <label className="text-xs font-mono text-amber-400 font-bold block">
                              #{bIdx + 1} Rasm izohi:
                            </label>
                            <textarea
                              rows={3}
                              value={block.text}
                              onChange={(e) => handleUpdateDetailBlockText(bIdx, e.target.value)}
                              placeholder="Ushbu rasm bo‘yicha mahsulot tavsifini yozing..."
                              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl text-white text-xs focus:outline-none resize-none"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 5. SMS TASDIQLASH ORQALI YUKLASH (Faqat yangi mahsulotni Bunkerga chiqarishda kerak bo'ladi) */}
              {!editingProduct && addProductChannel === 'online' ? (
                <div className="space-y-3 bg-slate-950 p-4 sm:p-5 rounded-2xl border border-amber-500/40">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <label className="text-amber-400 font-black flex items-center gap-2 text-xs sm:text-sm">
                      <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-black text-[11px] flex items-center justify-center">
                        5
                      </span>
                      <Phone className="w-3.5 h-3.5 text-amber-400" />
                      <span>SMS Tasdiqlash (Bunkerga chiqarishda kabinet raqamiga yuboriladi):</span>
                    </label>
                  </div>

                  <div className="space-y-2">
                    <span className="text-slate-300 font-bold text-[11px] block">
                      SMS yuboriladigan kabinet telefon raqami:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          setProdSmsPhoneChoice('primary');
                          setProdSmsPhone(supplierData.phone || '+998 ');
                        }}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                          prodSmsPhoneChoice === 'primary'
                            ? 'bg-amber-500/20 border-amber-400 text-white shadow-md'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-amber-500/40'
                        }`}
                      >
                        <div>
                          <span className="text-[10px] font-mono uppercase text-amber-400 font-black block">
                            Asosiy raqam
                          </span>
                          <span className="font-mono font-black text-xs sm:text-sm text-white">
                            {supplierData.phone}
                          </span>
                        </div>
                        {prodSmsPhoneChoice === 'primary' && (
                          <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                        )}
                      </button>

                      {supplierData.secondaryPhone && supplierData.secondaryPhone.trim() && (
                        <button
                          type="button"
                          onClick={() => {
                            setProdSmsPhoneChoice('secondary');
                            setProdSmsPhone(supplierData.secondaryPhone || '+998 ');
                          }}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                            prodSmsPhoneChoice === 'secondary'
                              ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-md'
                              : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-emerald-500/40'
                          }`}
                        >
                          <div>
                            <span className="text-[10px] font-mono uppercase text-emerald-400 font-black block">
                              Qo‘shimcha raqam
                            </span>
                            <span className="font-mono font-black text-xs sm:text-sm text-white">
                              {supplierData.secondaryPhone}
                            </span>
                          </div>
                          {prodSmsPhoneChoice === 'secondary' && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {prodSmsNotice && (
                    <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold animate-fadeIn">
                      {prodSmsNotice}
                    </div>
                  )}

                  {prodSmsSent && (
                    <div className="space-y-2 animate-fadeIn">
                      <div className="flex items-center justify-between">
                        <label className="text-slate-300 font-bold text-[11px] block">
                          Telefonga yuborilgan 6 xonali SMS tasdiqlash kodi:
                        </label>
                        <button
                          type="button"
                          onClick={handleSendProductSms}
                          className="text-[11px] font-black text-amber-400 hover:underline cursor-pointer"
                        >
                          SMS kodni qayta yuborish
                        </button>
                      </div>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={prodSmsInput}
                        onChange={(e) => {
                          setProdSmsInput(e.target.value.replace(/\D/g, '').slice(0, 6));
                          setProductConfirmError(null);
                        }}
                        placeholder="6 xonali SMS kodni kiriting"
                        className="w-full px-3.5 py-2.5 bg-slate-900 border border-amber-500/60 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500 font-mono tracking-widest"
                      />
                    </div>
                  )}

                  {productConfirmError && (
                    <p className="text-red-400 text-xs font-bold">{productConfirmError}</p>
                  )}
                </div>
              ) : (
                productConfirmError && (
                  <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/40">
                    <p className="text-red-400 text-xs font-bold">{productConfirmError}</p>
                  </div>
                )
              )}

              {/* 6. TASDIQLASH VA BUNKERGA CHIQARISH TUGMASI */}
              <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddProductOpen(false);
                    setEditingProduct(null);
                  }}
                  className="px-5 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold cursor-pointer hover:bg-slate-700 transition-colors"
                >
                  Bekor qilish
                </button>

                <button
                  type="submit"
                  className="flex items-center gap-2 px-7 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/25 active:scale-95 transition-all cursor-pointer"
                >
                  <Globe className="w-4 h-4" />
                  <span>
                    {editingProduct
                      ? 'O‘zgarishlarni saqlash'
                      : addProductChannel === 'offline'
                      ? 'Oflayn mahsulotlarga saqlash'
                      : !prodSmsSent
                      ? 'Bunkerga chiqarish (SMS kod yuborish)'
                      : 'SMS kodni tasdiqlash va Bunkerga chiqarish'}
                  </span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* B2B Yuk Xati va Ta'minotchi Korxona Ma'lumotlari Modali (PDF chiqarib olish bilan) */}
      {previewB2bManifest && (
        <div
          className="fixed inset-0 z-[75] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn"
          onClick={() => setPreviewB2bManifest(null)}
        >
          <div
            className="bg-slate-950 border-2 border-amber-500/60 rounded-3xl max-w-4xl w-full p-5 sm:p-7 space-y-5 shadow-2xl relative max-h-[92vh] overflow-y-auto text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-amber-500/20 text-[#FFB800] border border-amber-500/40">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-xl font-black text-white">
                      B2B Yuk Ro‘yxati va Ta’minotchi Ma’lumotlari (#{previewB2bManifest.id})
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      Rasmiy B2B Hujjat
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Sana: {new Date(previewB2bManifest.createdAt).toLocaleString('uz-UZ')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePrintOrDownloadB2bPdf(previewB2bManifest)}
                  className="px-4 py-2.5 rounded-xl bg-[#FFB800] hover:bg-[#FFC928] text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-lg"
                >
                  <Download className="w-4 h-4" />
                  <span>Yuk ro‘yxati PDF chiqarib olish</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewB2bManifest(null)}
                  className="p-2.5 rounded-xl bg-slate-900 hover:bg-red-600 text-slate-300 hover:text-white border border-slate-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
                <div className="text-amber-400 font-black uppercase text-[11px] pb-1 border-b border-slate-800">
                  1. Sotib Oluvchi Ta’minotchi Korxona Ma’lumotlari
                </div>
                <div>Korxona: <strong className="text-white">{previewB2bManifest.buyerCompanyName}</strong></div>
                <div>STIR (INN): <strong className="text-[#FFB800] font-mono">{previewB2bManifest.buyerInn || '—'}</strong></div>
                <div>Rahbar (Direktor): <strong className="text-white">{previewB2bManifest.buyerDirector || '—'}</strong></div>
                <div>Telefon: <strong className="text-emerald-400 font-mono">{previewB2bManifest.buyerPhone}</strong></div>
                <div>Manzil: <strong className="text-sky-300">{previewB2bManifest.buyerAddress || previewB2bManifest.buyerRegion}</strong></div>
                <div>Shartnoma: <strong className="text-amber-300 font-mono">{previewB2bManifest.buyerContractNumber || '—'}</strong></div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
                <div className="text-emerald-400 font-black uppercase text-[11px] pb-1 border-b border-slate-800">
                  2. Yetkazib Beruvchi B2B Ta’minotchi Ma’lumotlari
                </div>
                <div>B2B Korxona: <strong className="text-white">{previewB2bManifest.manufacturerCompanyName}</strong></div>
                <div>STIR: <strong className="text-[#FFB800] font-mono">{previewB2bManifest.manufacturerInn || '—'}</strong></div>
                <div>Telefon: <strong className="text-emerald-400 font-mono">{previewB2bManifest.manufacturerPhone || '—'}</strong></div>
                <div>Hudud: <strong className="text-white">{previewB2bManifest.manufacturerRegion || '—'}</strong></div>
                {previewB2bManifest.bankAccountDetails && (
                  <div>
                    Hisob raqam: <strong className="text-emerald-400 font-mono">{previewB2bManifest.bankAccountDetails}</strong>
                  </div>
                )}
                <div>
                  Holati:{' '}
                  <strong className="text-amber-300">
                    {previewB2bManifest.status === 'requested'
                      ? 'So‘rov yuborilgan (B2B tasdiqlashi kutilmoqda)'
                      : previewB2bManifest.status === 'approved_awaiting_payment'
                      ? 'So‘rov qabul qilingan — Hisob raqam jo‘natildi (To‘lov kutilmoqda)'
                      : previewB2bManifest.status === 'paid'
                      ? 'To‘lov jo‘natildi — Tayyorlash kutilmoqda'
                      : previewB2bManifest.status === 'preparing'
                      ? 'Mahsulot yuklash jarayonida'
                      : previewB2bManifest.status === 'in_transit'
                      ? 'Yetkazilmoqda'
                      : 'Yetkazilgan (Yakunlangan)'}
                  </strong>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-left text-xs text-slate-200">
                <thead className="bg-slate-900 text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3 font-black">№</th>
                    <th className="py-2.5 px-3 font-black">Olinayotgan Yuk (Mahsulot)</th>
                    <th className="py-2.5 px-3 font-black">Xususiyat / Rang</th>
                    <th className="py-2.5 px-3 font-black">Miqdori</th>
                    <th className="py-2.5 px-3 font-black">Narxi</th>
                    <th className="py-2.5 px-3 font-black text-right">Jami Summa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-950">
                  {previewB2bManifest.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 px-3 font-mono font-bold text-amber-400">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-bold text-white">{it.title}</td>
                      <td className="py-2.5 px-3 text-slate-300">
                        {[it.specification, it.color].filter(Boolean).join(' • ') || 'Standart'}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-black text-amber-300">
                        {it.quantity} {it.unit}
                      </td>
                      <td className="py-2.5 px-3 font-mono">{formatPrice(it.price)}</td>
                      <td className="py-2.5 px-3 font-mono font-black text-emerald-400 text-right">
                        {formatPrice(it.totalSum)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-400">
                Jami mahsulot turlari: <strong className="text-white">{previewB2bManifest.items.length} xil</strong>
              </span>
              <div className="text-base sm:text-lg font-black text-white">
                Jami To‘lov Summasi:{' '}
                <span className="text-emerald-400 font-mono">{formatPrice(previewB2bManifest.totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mijoz manzili va lokatsiyasini xaritadan ko'rish modali (Google Maps) */}
      {selectedMapCustomer && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn"
          onClick={() => setSelectedMapCustomer(null)}
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
                    Mijoz Yetkazish Manzili va Lokatsiyasi
                  </h3>
                  <p className="text-xs text-slate-400">
                    {selectedMapCustomer.name} • <span className="text-emerald-400 font-mono">{selectedMapCustomer.phone}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSupplierMapType(supplierMapType === 'm' ? 'k' : 'm')}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-[#FFB800] border border-slate-700 font-bold text-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>{supplierMapType === 'm' ? "Sun'iy yo'ldosh" : 'Xarita'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMapCustomer(null)}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-red-600 text-slate-300 hover:text-white border border-slate-800 cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#FFB800] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[#FFB800] font-black text-xs sm:text-sm block">
                    {formatRegionAndDistrictOnly(selectedMapCustomer.address)}
                  </span>
                  <span className="text-slate-300 font-medium text-xs block mt-0.5">
                    {formatCleanFullAddress(selectedMapCustomer.address)}
                  </span>
                </div>
              </div>
              {selectedMapCustomer.coords && (
                <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-amber-500/40 text-[#FFB800] font-mono font-bold text-[11px] shrink-0">
                  {selectedMapCustomer.coords.lat.toFixed(5)}, {selectedMapCustomer.coords.lng.toFixed(5)}
                </span>
              )}
            </div>

            <div className="relative w-full h-80 sm:h-96 rounded-2xl overflow-hidden border-2 border-slate-800 bg-slate-900">
              <iframe
                title="Mijoz Yetkazish Lokatsiyasi"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://maps.google.com/maps?q=${encodeURIComponent(
                  selectedMapCustomer.coords
                    ? `${selectedMapCustomer.coords.lat},${selectedMapCustomer.coords.lng}`
                    : `${selectedMapCustomer.address.replace(/\[Google Maps:.*?\]/gi, '').trim()}, Uzbekistan`
                )}&hl=uz&z=16&t=${supplierMapType}&output=embed`}
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setSelectedMapCustomer(null)}
                className="px-5 py-2.5 rounded-xl bg-[#FFB800] hover:bg-[#FFC928] text-slate-950 font-black text-xs cursor-pointer"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAROL ASOSIDA MAHSULOTNI O'CHIRISHNI TASDIQLASH MODALI */}
      {productToDelete && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn"
          onClick={() => setProductToDelete(null)}
        >
          <div
            className="bg-[#1C1915] border-2 border-[#FFB800]/60 rounded-3xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl relative text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#4A4030]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/40">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#FFF8E7]">
                    Mahsulotni Parol Orqali O‘chirish
                  </h3>
                  <p className="text-[11px] text-[#D4C5A9]">
                    Xavfsizlik uchun kabinet parolini kiriting
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="p-2 rounded-xl bg-[#2B251D] hover:bg-red-600 text-slate-300 hover:text-white border border-[#5C503A] cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#14120E] border border-[#5C503A] flex items-center gap-3">
              <img
                src={productToDelete.image}
                alt={productToDelete.title}
                className="w-12 h-12 rounded-xl object-cover border border-[#5C503A] shrink-0"
              />
              <div className="min-w-0">
                <div className="text-[10px] font-mono text-[#FFB800] font-bold">
                  {productToDelete.category} • 1 {productToDelete.unit}
                </div>
                <div className="text-sm font-black text-white truncate">
                  {productToDelete.title}
                </div>
                <div className="text-xs font-mono text-emerald-400 font-bold">
                  {formatPrice(productToDelete.price)}
                </div>
              </div>
            </div>

            <form onSubmit={handleConfirmDeleteProductWithPassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[#FFF8E7] font-bold flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#FFB800]" />
                  <span>Kabinet Kirish Parolini Kiriting:</span>
                </label>
                <div className="relative">
                  <input
                    type={showDeleteProductPass ? 'text' : 'password'}
                    autoFocus
                    value={deleteProductPassword}
                    onChange={(e) => {
                      setDeleteProductPassword(e.target.value);
                      setDeleteProductPasswordError(null);
                    }}
                    placeholder="Kabinet parolini kiriting..."
                    className="w-full pr-10 pl-3.5 py-3 bg-[#14120E] border border-[#6B5B40] focus:border-[#FFB800] rounded-xl text-white text-xs font-mono focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowDeleteProductPass(!showDeleteProductPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                  >
                    {showDeleteProductPass ? (
                      <EyeOff className="w-4 h-4 text-[#FFB800]" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {deleteProductPasswordError && (
                <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{deleteProductPasswordError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setProductToDelete(null)}
                  className="px-4 py-2.5 rounded-xl bg-[#2B251D] hover:bg-[#3A3227] text-[#E6DCC8] font-bold text-xs cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-lg active:scale-95 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Tasdiqlash va O‘chirish</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
