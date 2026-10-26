import React, { useState, useEffect } from 'react';
import { 
  Search, 
  ShieldCheck, 
  Plus, 
  Minus,
  Check, 
  MapPin, 
  Coins, 
  X,
  RotateCcw,
  Briefcase,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Truck,
  Wrench,
  LayoutGrid,
  Phone,
  ShoppingCart,
  Eye,
  SlidersHorizontal,
  Sparkles,
  Building2,
  Palette,
  Ruler,
  Package,
  Clock,
  CheckCircle2,
  Play,
  Maximize2,
  Factory,
  Globe,
  Heart,
  Star
} from 'lucide-react';
import { Product, UserProfile } from '../types';
import { REGIONS_AND_DISTRICTS } from '../data/regionsData';
import { getProductTypes, ProductTypeItem, getManufacturers, isCabinetCompanyName } from '../data/productTypes';
import { getColorPaletteItem } from './SupplierCabinet';
import { recordProductSearchQuery } from '../data/supplierReportsData';

interface MarketplaceProps {
  products: Product[];
  onAddToCart: (product: Product, quantity: number) => void;
  currentUser?: UserProfile | null;
}

export type SearchTypeOption = string;

export interface ColorOption {
  id: string;
  label: string;
  bg: string;
  border: string;
  text: string;
}

export const COLOR_OPTIONS: ColorOption[] = [
  { id: 'oq', label: 'Oq', bg: '#FFFFFF', border: '#cbd5e1', text: '#0f172a' },
  { id: 'kulrang', label: 'Kulrang', bg: '#64748b', border: '#475569', text: '#ffffff' },
  { id: 'qora', label: 'Qora', bg: '#0f172a', border: '#334155', text: '#ffffff' },
  { id: 'jigarrang', label: 'Jigarrang', bg: '#78350f', border: '#92400e', text: '#ffffff' },
  { id: 'qizil', label: 'Qizil / G‘isht', bg: '#dc2626', border: '#ef4444', text: '#ffffff' },
  { id: 'bej', label: 'Bej / Qum', bg: '#d4b996', border: '#bfa07a', text: '#0f172a' },
  { id: 'sariq', label: 'Sariq', bg: '#eab308', border: '#facc15', text: '#0f172a' },
  { id: 'kok', label: 'Ko‘k / Moviy', bg: '#2563eb', border: '#3b82f6', text: '#ffffff' },
  { id: 'yashil', label: 'Yashil', bg: '#16a34a', border: '#22c55e', text: '#ffffff' },
  { id: 'metall', label: 'Metall / Kumush', bg: '#94a3b8', border: '#cbd5e1', text: '#0f172a' },
  { id: 'toq_sariq', label: 'To‘q sariq / Apelsin', bg: '#f97316', border: '#fb923c', text: '#ffffff' },
  { id: 'binafsha', label: 'Binafsha / Siyohrang', bg: '#7c3aed', border: '#8b5cf6', text: '#ffffff' },
  { id: 'pushti', label: 'Pushti', bg: '#ec4899', border: '#f472b6', text: '#ffffff' },
  { id: 'feruza', label: 'Feruza / Turkuaz', bg: '#06b6d4', border: '#22d3ee', text: '#0f172a' },
  { id: 'oltin', label: 'Oltin / Bronza', bg: '#d97706', border: '#f59e0b', text: '#ffffff' },
];

const COLOR_KEYWORDS: Record<string, string[]> = {
  oq: ['oq', 'white', 'белый', 'beliy'],
  kulrang: ['kulrang', 'gray', 'grey', 'серый', 'seriy'],
  qora: ['qora', 'black', 'черный', 'chorniy'],
  jigarrang: ['jigarrang', 'brown', 'коричневый', 'korichnev'],
  qizil: ['qizil', 'red', 'красный', 'gisht', 'g‘isht', 'qizg‘ish'],
  bej: ['bej', 'beige', 'бежевый', 'qum', 'pesoch'],
  sariq: ['sariq', 'yellow', 'желтый', 'jeltiy'],
  kok: ['ko‘k', 'kok', 'moviy', 'blue', 'синий', 'голубой'],
  yashil: ['yashil', 'green', 'зеленый', 'zeleniy'],
  metall: ['metall', 'kumush', 'silver', 'sink', 'temir', 'metallik'],
  toq_sariq: ['to‘q sariq', 'toq sariq', 'apelsin', 'orange', 'оранжевый'],
  binafsha: ['binafsha', 'siyohrang', 'purple', 'violet', 'фиолетовый'],
  pushti: ['pushti', 'pink', 'розовый'],
  feruza: ['feruza', 'turkuaz', 'turquoise', 'cyan', 'бирюзовый'],
  oltin: ['oltin', 'bronza', 'gold', 'bronze', 'золотой', 'бронза'],
};

export function getProductSquareMeters(p: Product): number | null {
  if ((p as any).squareMeters && typeof (p as any).squareMeters === 'number') {
    return (p as any).squareMeters;
  }
  if (p.sizes && p.sizes.length > 0) {
    for (const s of p.sizes) {
      const match = s.match(/(\d+(?:\.\d+)?)\s*(?:m²|m2|kv\.?m|kvadrat)/i);
      if (match) return parseFloat(match[1]);
    }
  }
  const text = `${p.title} ${p.description || ''}`;
  const match = text.match(/(\d+(?:\.\d+)?)\s*(?:m²|m2|kv\.?\s*m|kvadrat\s*metr)/i);
  if (match) {
    return parseFloat(match[1]);
  }
  return null;
}

export function matchesSquareMeters(p: Product, minM2: number | '', maxM2: number | ''): boolean {
  if (minM2 === '' && maxM2 === '') return true;
  const area = getProductSquareMeters(p);
  if (area !== null) {
    if (minM2 !== '' && area < minM2) return false;
    if (maxM2 !== '' && area > maxM2) return false;
    return true;
  }
  if (p.unit && p.unit.toLowerCase().includes('m²')) {
    return true;
  }
  return false;
}

export function matchesProductColor(p: Product, selectedCols: string[]): boolean {
  if (selectedCols.length === 0) return true;
  if (p.colors && p.colors.length > 0) {
    const hasDirectMatch = p.colors.some((c) =>
      selectedCols.some((sc) => c.toLowerCase().includes(sc.toLowerCase()))
    );
    if (hasDirectMatch) return true;
  }
  const text = `${p.title} ${p.category} ${p.description || ''}`.toLowerCase();
  return selectedCols.some((colId) => {
    const keywords = COLOR_KEYWORDS[colId] || [colId];
    return keywords.some((kw) => text.includes(kw));
  });
}

interface UzumProductCardProps {
  product: Product;
  onOpenPreview: (product: Product) => void;
  onAdd: (product: Product, quantity: number) => void;
  isAdded: boolean;
  formatPrice: (p: number) => string;
}

const UzumProductCard: React.FC<UzumProductCardProps> = ({
  product,
  onOpenPreview,
  onAdd,
  isAdded,
  formatPrice,
}) => {
  // Uzum Market galereya rasmlari
  const galleryImages = React.useMemo(() => {
    const list: string[] = [];
    if (product.image) list.push(product.image);
    if (product.images && Array.isArray(product.images)) {
      product.images.forEach((img) => {
        if (img && !list.includes(img)) list.push(img);
      });
    }
    if (product.variants && Array.isArray(product.variants)) {
      product.variants.forEach((v: any) => {
        if (v.image && !list.includes(v.image)) list.push(v.image);
      });
    }
    // Agar bitta rasm bo'lsa, Uzum Market harakat effektini ko'rsatish uchun uning variantlari
    if (list.length === 1 && list[0]) {
      return [list[0], `${list[0]}?img=2`, `${list[0]}?img=3`, `${list[0]}?img=4`];
    }
    return list.length > 0 ? list : [product.image];
  }, [product]);

  const [activeIdx, setActiveIdx] = useState(0);
  const [isLiked, setIsLiked] = useState(false);

  // Uzum Market uslubi: Sichqonchaning rasm ustidagi gorizontal harakatiga qarab rasmni tezkor almashtirish
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (galleryImages.length <= 1) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const segmentWidth = rect.width / galleryImages.length;
    const nextIdx = Math.min(galleryImages.length - 1, Math.max(0, Math.floor(x / segmentWidth)));
    if (nextIdx !== activeIdx) {
      setActiveIdx(nextIdx);
    }
  };

  const handleMouseLeave = () => {
    setActiveIdx(0);
  };

  const displayPrice = product.price;
  const displayUnit = product.unit || 'dona';
  const oldPrice = product.originalPrice || Math.round(displayPrice * 1.18);
  const isOutOfStock = (product.stock ?? 0) <= 0;
  const monthlyPrice = Math.round(displayPrice / 12);

  // Uzum Market screenshotidagi badge: "ARZON NARX KAFOLATI" yoki "ORIGINAL"
  const isOriginal = !product.isEscoCertified && (product.id.charCodeAt(0) % 2 === 0);

  return (
    <div
      onClick={() => onOpenPreview(product)}
      className="bg-white rounded-2xl border border-gray-100 shadow-xs hover:shadow-xl transition-all duration-200 flex flex-col group cursor-pointer overflow-hidden p-2.5 relative"
    >
      {/* Rasm qismi (Uzum Market kabi toza oq fonda, aspect-[4/5]) */}
      <div
        className="relative w-full aspect-[4/5] bg-gray-50 rounded-xl overflow-hidden select-none"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <img
          src={galleryImages[activeIdx] || product.image}
          alt={product.title}
          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-103"
          loading="lazy"
        />

        {/* Yurakcha (Wishlist / Sevimlilar) ikonkasi (Uzum uslubi o'ng tepada) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsLiked(!isLiked);
          }}
          className="absolute top-2 right-2 z-20 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-gray-400 hover:text-red-500 flex items-center justify-center shadow-xs transition-transform active:scale-90 cursor-pointer"
          title="Sevimlilar"
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
        </button>

        {/* Uzum Market indikator chiziqchalari (Sichqoncha siljiganda almashadi) */}
        {galleryImages.length > 1 && (
          <div className="absolute bottom-1.5 inset-x-2 flex items-center justify-center gap-1 z-30 pointer-events-none">
            {galleryImages.map((_, i) => (
              <div
                key={i}
                className={`h-0.5 rounded-full transition-all duration-150 ${
                  i === activeIdx ? 'w-5 bg-gray-900 shadow-sm' : 'w-1.5 bg-gray-300/80'
                }`}
              />
            ))}
          </div>
        )}

        {/* Badjlar: Uzum Market skrinshotidagi pushti "ARZON NARX KAFOLATI" yoki yashil "ORIGINAL" */}
        <div className="absolute bottom-3.5 left-2 z-20 flex flex-col gap-1 pointer-events-none">
          {product.isEscoCertified ? (
            <span className="bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs uppercase">
              ESCO SERTIFIKAT
            </span>
          ) : isOriginal ? (
            <span className="bg-white/95 text-emerald-700 text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs flex items-center gap-1 border border-emerald-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              ORIGINAL
            </span>
          ) : (
            <span className="bg-[#E6007A] text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs uppercase tracking-tight flex items-center gap-1">
              ARZON NARX KAFOLATI
            </span>
          )}
        </div>

        {isOutOfStock && (
          <div className="absolute top-2 left-2 z-20 px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-bold shadow-xs">
            Vaqtincha tugagan
          </div>
        )}
      </div>

      {/* Ma'lumotlar qismi (Uzum Market tartibi bo'yicha) */}
      <div className="pt-2 flex-1 flex flex-col justify-between">
        <div>
          {/* Asosiy narx */}
          <div className="flex items-baseline gap-1">
            <span className="text-[16px] sm:text-[18px] font-extrabold text-gray-950 leading-tight">
              {formatPrice(displayPrice)}
            </span>
            <span className="text-[12px] font-bold text-gray-900">
              so'm
            </span>
            {displayUnit && displayUnit !== 'dona' && (
              <span className="text-[11px] text-gray-400 font-normal">
                /{displayUnit}
              </span>
            )}
          </div>

          {/* Ustki chizilgan eski narx (Uzum Market uslubi) */}
          <div className="text-[11px] text-gray-400 line-through leading-none font-normal mt-0.5">
            {formatPrice(oldPrice)}
          </div>

          {/* Muddatli to'lov badji (Sariq fon - Uzum uslubi) */}
          <div className="mt-1.5">
            <span className="inline-block bg-[#FFE600] text-gray-950 text-[10px] sm:text-[11px] font-bold px-1.5 py-0.5 rounded leading-none">
              {formatPrice(monthlyPrice)} so'mdan
            </span>
          </div>

          {/* Mahsulot nomi (2 qator, hoverda rang o'zgaradi) */}
          <h3
            className="text-xs sm:text-sm text-gray-800 line-clamp-2 leading-snug font-normal mt-1.5 group-hover:text-amber-600 transition-colors"
            title={product.title}
          >
            {product.title}
          </h3>

          {/* Reyting va sharhlar (Uzum uslubi) */}
          <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
            <span className="text-amber-400 font-bold">★</span>
            <span className="font-semibold text-gray-900">4.8</span>
            <span className="text-gray-400 text-[11px]">
              ({product.salesCount ? `${product.salesCount} sharhlar` : 'Yangi'})
            </span>
          </div>

          {/* Yetkazib berish manzili */}
          <div className="flex items-center gap-1 text-[11px] text-gray-400 mt-0.5 truncate">
            <MapPin className="w-3 h-3 shrink-0 text-gray-400" />
            <span className="truncate">{product.region || 'O‘zbekiston'}</span>
          </div>
        </div>

        {/* Asosiy Sotib Olish Tugmasi (Foydalanuvchi qat'iy talabi: SARIQ rangda qolsin) */}
        <button
          type="button"
          disabled={isOutOfStock}
          onClick={(e) => {
            e.stopPropagation();
            onAdd(product, Math.min(product.stock || 1, product.minOrder || 1));
          }}
          className={`w-full mt-2.5 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs sm:text-sm font-bold transition-all shadow-xs active:scale-97 cursor-pointer ${
            isOutOfStock
              ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
              : 'bg-[#FFB800] hover:bg-[#FFC928] text-gray-950 border border-[#E5A600]'
          }`}
        >
          {isAdded ? (
            <>
              <Check className="w-4 h-4 stroke-[3]" /> Qo‘shildi
            </>
          ) : (
            <>
              <ShoppingCart className="w-4 h-4" /> Savatga
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export const Marketplace: React.FC<MarketplaceProps> = ({ products, onAddToCart, currentUser }) => {
  const isLegalCabinet = currentUser?.userType === 'legal' || currentUser?.role === 'legal';
  const [search, setSearch] = useState('');
  const [showRegionSelector, setShowRegionSelector] = useState(false);
  // Qidiruv filtri: Viloyat/shahar, Ta'mir kategoriyasi, Xususiyatlar (kv.m, rang) va Narx
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterTab, setFilterTab] = useState<'region' | 'category' | 'specs'>('region');
  
  // Mahsulot turlari (standart va qo'shilgan yangi toifalar)
  const [productTypes, setProductTypes] = useState<ProductTypeItem[]>(() => getProductTypes());
  // Bir nechta mahsulot turlarini belgilash
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  useEffect(() => {
    const handleTypesUpdate = () => {
      setProductTypes(getProductTypes());
    };
    window.addEventListener('bunkerstroy_product_types_updated', handleTypesUpdate);
    return () => {
      window.removeEventListener('bunkerstroy_product_types_updated', handleTypesUpdate);
    };
  }, []);

  // Bir nechta viloyatlarni tanlash imkoni
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [isRegionOpen, setIsRegionOpen] = useState(false);
  const [regionSearch, setRegionSearch] = useState('');
  // Belgilangan viloyatdagi shahar va tumanlarni tanlash imkoni
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);
  const [isDistrictOpen, setIsDistrictOpen] = useState(false);
  const [districtSearch, setDistrictSearch] = useState('');

  // Xususiyatlar: kv Metr (m²), 15 ta Rang va Ishlab chiqaruvchi
  const [minSquareMeters, setMinSquareMeters] = useState<number | ''>('');
  const [maxSquareMeters, setMaxSquareMeters] = useState<number | ''>('');
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [manufacturersList, setManufacturersList] = useState<string[]>(() => getManufacturers());
  const [selectedManufacturers, setSelectedManufacturers] = useState<string[]>([]);
  const [manufacturerSearch, setManufacturerSearch] = useState<string>('');
  const [onlyDelivery, setOnlyDelivery] = useState(false);
  const [onlyWarranty, setOnlyWarranty] = useState(false);
  const [onlyBonus, setOnlyBonus] = useState(false);

  // Narx filtri
  const [minPrice, setMinPrice] = useState<number | ''>('');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');

  // Sichqoncha mahsulot ustiga borganda 1.5 soniyada suratlar va variantlar almashishi
  const [hoveredProductId, setHoveredProductId] = useState<string | null>(null);
  const [hoverTick, setHoverTick] = useState<number>(0);

  useEffect(() => {
    const syncMfg = () => {
      const saved = getManufacturers();
      const fromProducts = products
        .map((p) => (p.manufacturerName || '').trim())
        .filter((val) => val && !isCabinetCompanyName(val));
      setManufacturersList(Array.from(new Set([...saved, ...fromProducts])));
    };
    syncMfg();
    window.addEventListener('bunkerstroy_manufacturers_updated', syncMfg);
    return () => window.removeEventListener('bunkerstroy_manufacturers_updated', syncMfg);
  }, [products]);

  useEffect(() => {
    if (!hoveredProductId) {
      setHoverTick(0);
      return;
    }
    const timer = setInterval(() => {
      setHoverTick((prev) => prev + 1);
    }, 1500);
    return () => clearInterval(timer);
  }, [hoveredProductId]);

  // Mijoz qidiruv so'rovlarini Admin "So'rov va Mijozlar" tahlili uchun real qayd etish (1 ta qidiruv = 1 ta so'rov)
  const lastLoggedSearchRef = React.useRef<string>('');
  const logCustomerSearch = (rawQuery: string) => {
    const trimmed = rawQuery.trim();
    if (trimmed.length < 2) return;
    const activeRegion =
      selectedRegions[0] ||
      currentUser?.region ||
      'Toshkent shahri';
    const qLower = trimmed.toLowerCase();
    const matchedCount = products.filter(
      (p) =>
        (p.title || '').toLowerCase().includes(qLower) ||
        (p.category || '').toLowerCase().includes(qLower) ||
        (p.description || '').toLowerCase().includes(qLower)
    ).length;
    const dedupeKey = `${qLower}__${activeRegion.toLowerCase()}`;
    if (lastLoggedSearchRef.current === dedupeKey) return;
    lastLoggedSearchRef.current = dedupeKey;
    recordProductSearchQuery(trimmed, activeRegion, currentUser?.id, matchedCount);
  };

  useEffect(() => {
    const trimmed = search.trim();
    if (trimmed.length < 2) {
      lastLoggedSearchRef.current = '';
      return;
    }
    const timer = setTimeout(() => {
      logCustomerSearch(trimmed);
    }, 1000);
    return () => clearTimeout(timer);
  }, [search, selectedRegions]);

  // Tanlangan mahsulotni bir tomonda, qolgan mahsulotlarni yon tarafda ustun shaklida ko'rish
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
  const [selectedVariantIdx, setSelectedVariantIdx] = useState<number>(0);
  const [selectedPreviewColor, setSelectedPreviewColor] = useState<string>('');
  const [previewQuantity, setPreviewQuantity] = useState<number>(1);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [fullscreenVideo, setFullscreenVideo] = useState<string | null>(null);

  // ESC tugmasi bosilganda yon filtr yoki modalni yopish
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (fullscreenImage) {
          setFullscreenImage(null);
          return;
        }
        if (fullscreenVideo) {
          setFullscreenVideo(null);
          return;
        }
        setIsFilterOpen(false);
        setPreviewProduct(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fullscreenImage, fullscreenVideo]);

  const allRegionsList = [
    'Toshkent shahri',
    'Toshkent viloyati',
    'Samarqand',
    'Buxoro',
    'Andijon',
    'Farg‘ona',
    'Namangan',
    'Qashqadaryo',
    'Surxondaryo',
    'Navoiy',
    'Jizzax',
    'Sirdaryo',
    'Xorazm',
    'Qoraqalpog‘iston Res.',
  ];

  // Qidiruv turlarini toggle qilish (bir nechtasini tanlash)
  const toggleSearchType = (type: SearchTypeOption) => {
    setSelectedTypes((prev) => 
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  // Viloyatlarni toggle qilish (bir nechtasini tanlash)
  const toggleRegion = (regionName: string) => {
    setSelectedRegions((prev) => {
      const next = prev.includes(regionName)
        ? prev.filter((r) => r !== regionName)
        : [...prev, regionName];
      // Agar viloyat olib tashlansa, shu viloyatga tegishli tanlangan tumanlarni ham tozalash
      return next;
    });
  };

  // Tuman va shaharlarni toggle qilish
  const toggleDistrict = (districtName: string) => {
    setSelectedDistricts((prev) =>
      prev.includes(districtName)
        ? prev.filter((d) => d !== districtName)
        : [...prev, districtName]
    );
  };

  // Ranglarni toggle qilish (bir nechtasini tanlash)
  const toggleColor = (colorId: string) => {
    setSelectedColors((prev) =>
      prev.includes(colorId) ? prev.filter((c) => c !== colorId) : [...prev, colorId]
    );
  };

  // Ishlab chiqaruvchini toggle qilish
  const toggleManufacturer = (mfgName: string) => {
    setSelectedManufacturers((prev) =>
      prev.includes(mfgName) ? prev.filter((m) => m !== mfgName) : [...prev, mfgName]
    );
  };

  // Tanlangan viloyatlarga tegishli tuman va shaharlar ro'yxati (faqat viloyat tanlangandan so'ng chiqadi)
  const availableDistricts = selectedRegions.length > 0
    ? selectedRegions.flatMap((reg) => REGIONS_AND_DISTRICTS[reg] || [])
    : [];

  // Qidiruv sozlamalari bo'yicha nomzod tovarlar (faqat Onlayn savdoga chiqarilgan mahsulotlar)
  const candidateProducts = products.filter((p) => {
    // Oflayn uchun yuklangan mahsulotlar Onlayn vitrinada ko'rinmaydi
    if (p.saleChannel === 'offline') return false;
    // Qum va shaghal kerak emas
    if (p.category === 'Qum va shaghal') return false;

    // Search filter
    const matchesSearch =
      search === '' ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.supplierName.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase());

    // Mahsulot turi filteri (bir nechta tanlangan bo'lsa)
    let matchesType = true;
    if (selectedTypes.length > 0) {
      matchesType = selectedTypes.some((type) => {
        if (type === 'ichki') {
          return p.repairType === 'ichki' || p.repairType === 'universal';
        }
        if (type === 'tashqi') {
          return p.repairType === 'tashqi' || p.repairType === 'universal';
        }
        if (type === 'ishchi_kuchi') {
          return p.repairType === 'ishchi_kuchi' || p.itemType === 'labor';
        }
        if (type === 'asbob_uskunalar') {
          return p.repairType === 'asbob_uskunalar' || p.itemType === 'tool' || p.category === 'Asbob uskunalar';
        }
        if (type === 'texnika_ijarasi') {
          return p.repairType === 'texnika_ijarasi' || p.itemType === 'rental' || p.category === 'Texnik Asbob-uskunalar ijarasi' || p.category.includes('ijara');
        }
        if (type === 'kardon') {
          return p.category.toLowerCase().includes('kardon') || p.title.toLowerCase().includes('kardon') || (p.description && p.description.toLowerCase().includes('kardon'));
        }
        if (type === 'sement') {
          return p.category.toLowerCase().includes('sement') || p.title.toLowerCase().includes('sement') || (p.description && p.description.toLowerCase().includes('sement'));
        }
        if (type === 'gisht') {
          const t = (p.category + ' ' + p.title + ' ' + (p.description || '')).toLowerCase().replace(/['`‘’ʻʼ]/g, '');
          return t.includes('gisht');
        }
        // Yangi qo'shilgan / maxsus mahsulot turi
        const pt = productTypes.find((item) => item.id === type || item.label.toLowerCase() === type.toLowerCase());
        const term = (pt ? pt.label : type).toLowerCase().replace(/['`‘’ʻʼ]/g, '');
        const pCat = (p.category || '').toLowerCase().replace(/['`‘’ʻʼ]/g, '');
        const pTitle = (p.title || '').toLowerCase().replace(/['`‘’ʻʼ]/g, '');
        const pDesc = (p.description || '').toLowerCase().replace(/['`‘’ʻʼ]/g, '');
        const pRepair = (p.repairType || '').toLowerCase().replace(/['`‘’ʻʼ]/g, '');
        return (
          pCat.includes(term) ||
          pTitle.includes(term) ||
          pRepair.includes(term) ||
          pDesc.includes(term)
        );
      });
    }

    // Region filter (bir nechta viloyat tanlangan bo'lsa)
    let matchesRegion = true;
    if (selectedRegions.length > 0) {
      matchesRegion = selectedRegions.some((reg) => 
        p.region === reg || p.supplierName.toLowerCase().includes(reg.toLowerCase())
      );
    }

    // Tuman / Shahar filteri (bir nechta tuman tanlangan bo'lsa)
    let matchesDistrict = true;
    if (selectedDistricts.length > 0) {
      matchesDistrict = selectedDistricts.some((dist) =>
        p.district === dist ||
        p.supplierName.toLowerCase().includes(dist.toLowerCase()) ||
        p.description.toLowerCase().includes(dist.toLowerCase())
      );
    }

    // Xususiyatlar: kv Metr (m²) filtri
    const matchesSqM = matchesSquareMeters(p, minSquareMeters, maxSquareMeters);

    // Xususiyatlar: Rang filtri
    const matchesColor = matchesProductColor(p, selectedColors);

    // Xususiyatlar: Ishlab chiqarilgan davlat filtri (kabinet nomi emas)
    const productCountry = (
      p.manufacturerName && !isCabinetCompanyName(p.manufacturerName)
        ? p.manufacturerName
        : 'O‘zbekiston'
    ).toLowerCase();
    const matchesManufacturer =
      selectedManufacturers.length === 0 ||
      selectedManufacturers.some((m) => productCountry.includes(m.toLowerCase()));

    // Xususiyatlar: Qo'shimcha parametrlar
    const matchesDelivery = !onlyDelivery || !!p.hasDelivery;
    const matchesWarranty = !onlyWarranty || !!p.warranty;
    const matchesBonus = !onlyBonus || !!p.hasBonus;

    return (
      matchesSearch &&
      matchesType &&
      matchesRegion &&
      matchesDistrict &&
      matchesSqM &&
      matchesColor &&
      matchesManufacturer &&
      matchesDelivery &&
      matchesWarranty &&
      matchesBonus
    );
  });

  // Joriy qidiruv sozlamalari bo'yicha avtomatik eng arzon va eng qimmat narx
  const candidatePrices = candidateProducts.map((p) => p.price);
  const autoMinPrice = candidatePrices.length > 0 ? Math.min(...candidatePrices) : 0;
  const autoMaxPrice = candidatePrices.length > 0 ? Math.max(...candidatePrices) : 0;

  // Bitta jamlangan filtr tugmasi bosilganda
  const handleToggleFilter = () => {
    setIsFilterOpen((prev) => !prev);
  };

  // Yakuniy mahsulotlar (Bunker qidiruv filtrida narx oralig'i talab qilinmagan)
  const filteredProducts = candidateProducts;

  // Mahsulot modalini va videosini ochish (Mijoz qiziqishlari va video ko'rishlar sonini qayd etish)
  const handleOpenPreview = (product: Product) => {
    const nextViews = (Number(product.videoViews) || Number(product.viewsCount) || 0) + 1;
    const updatedProduct: Product = {
      ...product,
      videoViews: nextViews,
      viewsCount: nextViews,
    };
    setPreviewProduct(updatedProduct);
    setSelectedVariantIdx(0);
    const firstVar = product.variants && product.variants.length > 0 ? product.variants[0] : undefined;
    const initColors =
      firstVar && firstVar.colors && firstVar.colors.length > 0
        ? firstVar.colors
        : product.colors || [];
    setSelectedPreviewColor(initColors[0] || '');
    setPreviewQuantity(Math.max(1, firstVar?.minOrder || product.minOrder || 1));
    setActiveImageIndex(0);

    try {
      const savedProds = localStorage.getItem('bunkerstroy_products');
      if (savedProds) {
        const list = JSON.parse(savedProds);
        if (Array.isArray(list)) {
          const nextList = list.map((p: any) =>
            p && p.id === product.id
              ? {
                  ...p,
                  videoViews: (Number(p.videoViews) || Number(p.viewsCount) || 0) + 1,
                  viewsCount: (Number(p.viewsCount) || Number(p.videoViews) || 0) + 1,
                }
              : p
          );
          localStorage.setItem('bunkerstroy_products', JSON.stringify(nextList));
        }
      }

      const savedViews = localStorage.getItem('bunkerstroy_video_views');
      const viewsMap: Record<string, any> = savedViews ? JSON.parse(savedViews) : {};
      const prevEntry = viewsMap[product.id] || {};
      viewsMap[product.id] = {
        id: product.id,
        title: product.title,
        category: product.category,
        supplierName: product.supplierName,
        price: product.price,
        unit: product.unit,
        image: product.image,
        videoUrl: product.videoUrl || '',
        views: (Number(prevEntry.views) || Number(product.videoViews) || 0) + 1,
        lastViewedAt: new Date().toISOString(),
      };
      localStorage.setItem('bunkerstroy_video_views', JSON.stringify(viewsMap));
      window.dispatchEvent(new CustomEvent('bunkerstroy_finance_updated'));
    } catch {}
  };

  const [stockErrorNotice, setStockErrorNotice] = useState<string | null>(null);

  const handleAdd = (product: Product, quantity = 1) => {
    const avail = typeof product.stock === 'number' ? Math.max(0, product.stock) : 0;
    if (avail <= 0) {
      setStockErrorNotice(`«${product.title}» — Ombordagi miqdor yetarli emas! (Omborda mavjud: 0 ${product.unit})`);
      setTimeout(() => setStockErrorNotice(null), 3500);
      return;
    }
    if (quantity > avail) {
      setStockErrorNotice(`«${product.title}» — Ombordagi miqdor yetarli emas! (Omborda mavjud: ${avail} ${product.unit})`);
      setTimeout(() => setStockErrorNotice(null), 3500);
      return;
    }
    setStockErrorNotice(null);
    onAddToCart(product, quantity);
    setAddedIds((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [product.id]: false }));
    }, 1500);
  };

  const handleClearAllFilterCriteria = () => {
    setSelectedTypes([]);
    setSelectedRegions([]);
    setSelectedDistricts([]);
    setMinSquareMeters('');
    setMaxSquareMeters('');
    setSelectedColors([]);
    setSelectedManufacturers([]);
    setManufacturerSearch('');
    setOnlyDelivery(false);
    setOnlyWarranty(false);
    setOnlyBonus(false);
  };

  const handleResetFilters = () => {
    setSearch('');
    handleClearAllFilterCriteria();
    setIsFilterOpen(false);
    setIsRegionOpen(false);
    setIsDistrictOpen(false);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('uz-UZ').format(price) + " so'm";
  };

  const hasSquareMetersFilter = minSquareMeters !== '' || maxSquareMeters !== '';
  const hasSpecsFilter =
    hasSquareMetersFilter ||
    selectedColors.length > 0 ||
    selectedManufacturers.length > 0 ||
    onlyDelivery ||
    onlyWarranty ||
    onlyBonus;

  const totalActiveCriteria =
    selectedRegions.length +
    selectedDistricts.length +
    selectedTypes.length +
    (hasSquareMetersFilter ? 1 : 0) +
    selectedColors.length +
    selectedManufacturers.length +
    (onlyDelivery ? 1 : 0) +
    (onlyWarranty ? 1 : 0) +
    (onlyBonus ? 1 : 0);

  const getFilterButtonLabel = () => {
    if (totalActiveCriteria === 0) {
      return "Bunker Qidiruv filtri";
    }
    return `Bunker Qidiruv filtri (${totalActiveCriteria})`;
  };

  const hasActiveFilters =
    search !== '' ||
    selectedTypes.length > 0 ||
    selectedRegions.length > 0 ||
    selectedDistricts.length > 0 ||
    hasSpecsFilter;

  const filteredRegionsList = allRegionsList.filter((reg) =>
    reg.toLowerCase().includes(regionSearch.toLowerCase())
  );

  const filteredDistrictsList = availableDistricts.filter((dist) =>
    dist.toLowerCase().includes(districtSearch.toLowerCase())
  );

  return (
    <div className="max-w-[1440px] mx-auto space-y-6 pb-12 bg-white text-black min-h-[75vh] rounded-2xl">
      
      {/* 4. Search and Filter Bar: Mahsulot ko'rayotganda (previewProduct ochiq bo'lganda) ko'rinmaydi */}
      {!previewProduct && (
      <div className="relative z-30 p-3.5 sm:p-4 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-3 text-gray-900">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          
          {/* Qidiruv inputi: "Mahsulotlarni qidirish..." */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
            <input
              type="text"
              placeholder="Mahsulotlarni qidirish..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 bg-gray-50 border border-gray-200 focus:border-[#FFB800] focus:bg-white rounded-xl text-gray-900 placeholder-gray-400 text-xs sm:text-sm outline-none transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Tugmalar: Qidiruv + Bunker Qidiruv filtri */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            {/* Yellow "Qidiruv" button with black text */}
            <button
              type="button"
              onClick={() => {
                if (search.trim().length >= 2) {
                  logCustomerSearch(search.trim());
                }
              }}
              className="bg-[#FFB800] hover:bg-[#FFC928] text-gray-950 border border-[#E5A600] px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs cursor-pointer whitespace-nowrap transition-all active:scale-95"
            >
              <Search className="w-4 h-4 text-gray-950 stroke-[2.5]" />
              <span>Qidiruv</span>
            </button>

            {/* "Bunker Qidiruv filtri" button */}
            <button
              type="button"
              onClick={() => setIsFilterOpen(true)}
              className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap border shadow-xs ${
                totalActiveCriteria > 0
                  ? 'bg-amber-50 border-[#FFB800] text-gray-950'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-200'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4 text-[#FFB800]" />
              <span>Bunker Filtrlari</span>
              {totalActiveCriteria > 0 && (
                <span className="px-1.5 py-0.2 rounded text-[11px] font-bold bg-[#FFB800] text-gray-950">
                  {totalActiveCriteria}
                </span>
              )}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isFilterOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Tozalash agar filtr bor bo'lsa */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="p-2.5 rounded-xl bg-gray-100 border border-gray-200 hover:border-red-400 text-red-500 hover:text-red-600 text-xs font-semibold cursor-pointer transition-colors"
                title="Barcha filtrlarni tozalash"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}

          </div>

        </div>

        {/* Faol filtrlar teglari */}
        {totalActiveCriteria > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100 text-xs">
            <span className="text-[11px] text-[#FFB800] font-bold uppercase tracking-wider">Faol filtrlar:</span>
            
            {/* Tanlangan viloyatlar */}
            {selectedRegions.map((reg) => (
              <span
                key={reg}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 border border-gray-200 text-gray-800 text-xs font-medium"
              >
                <MapPin className="w-3 h-3 text-[#FFB800]" />
                <span>{reg}</span>
                <button
                  type="button"
                  onClick={() => toggleRegion(reg)}
                  className="hover:text-red-500 cursor-pointer ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {/* Tanlangan tumanlar */}
            {selectedDistricts.map((dist) => (
              <span
                key={dist}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 border border-gray-200 text-gray-800 text-xs font-medium"
              >
                <Building2 className="w-3 h-3 text-[#FFB800]" />
                <span>{dist}</span>
                <button
                  type="button"
                  onClick={() => toggleDistrict(dist)}
                  className="hover:text-red-500 cursor-pointer ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {/* Tanlangan mahsulot/ta'mir turlari */}
            {selectedTypes.map((tid) => {
              const item = productTypes.find((pt) => pt.id === tid);
              return (
                <span
                  key={tid}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 border border-gray-200 text-gray-800 text-xs font-medium"
                >
                  <LayoutGrid className="w-3 h-3 text-[#FFB800]" />
                  <span>{item?.label || tid}</span>
                  <button
                    type="button"
                    onClick={() => toggleSearchType(tid)}
                    className="hover:text-red-500 cursor-pointer ml-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}

            {/* kv Metr filtri */}
            {hasSquareMetersFilter && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 border border-gray-200 text-gray-800 text-xs font-medium font-mono">
                <Ruler className="w-3 h-3 text-[#FFB800]" />
                <span>
                  {minSquareMeters !== '' ? `${minSquareMeters} m²` : '0 m²'} - {maxSquareMeters !== '' ? `${maxSquareMeters} m²` : '∞'}
                </span>
                <button
                  type="button"
                  onClick={() => { setMinSquareMeters(''); setMaxSquareMeters(''); }}
                  className="hover:text-red-500 cursor-pointer ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Rang filtrlari */}
            {selectedColors.map((colId) => {
              const col = COLOR_OPTIONS.find((c) => c.id === colId);
              return (
                <span
                  key={colId}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 border border-gray-200 text-gray-800 text-xs font-medium"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-gray-300"
                    style={{ backgroundColor: col?.bg || '#ffffff' }}
                  />
                  <span>{col?.label || colId}</span>
                  <button
                    type="button"
                    onClick={() => toggleColor(colId)}
                    className="hover:text-red-500 cursor-pointer ml-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}

            {/* Ishlab chiqaruvchi filtrlari */}
            {selectedManufacturers.map((mfg) => (
              <span
                key={mfg}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 border border-gray-200 text-gray-800 text-xs font-medium"
              >
                <Factory className="w-3 h-3 text-[#FFB800]" />
                <span>{mfg}</span>
                <button
                  type="button"
                  onClick={() => toggleManufacturer(mfg)}
                  className="hover:text-red-500 cursor-pointer ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
      )}

      {/* =========================================================================
          YON TARAFDAN OCHILADIGAN QIDIRUV FILTRI PANELI (UZUM USLUBI OQ FON)
          ========================================================================= */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Orqa fon (Backdrop) */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsFilterOpen(false)}
          />

          {/* O'ng tomondan butun panelning yarmini oluvchi yon filtr paneli */}
          <div
            className="relative z-50 w-full sm:w-[540px] md:w-[50%] lg:w-[50%] max-w-3xl h-full bg-white border-l border-gray-200 shadow-2xl flex flex-col animate-slide-left text-gray-900"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-gray-200 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-50 text-[#FFB800] border border-amber-200">
                  <SlidersHorizontal className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900">Bunker Qidiruv filtri</h3>
                    {totalActiveCriteria > 0 && (
                      <span className="text-[11px] font-bold font-mono px-2 py-0.5 rounded-full bg-[#FFB800] text-gray-950">
                        {totalActiveCriteria} ta faol
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {totalActiveCriteria > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllFilterCriteria}
                    className="text-xs font-bold text-red-500 hover:text-red-600 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 cursor-pointer transition-colors"
                  >
                    Tozalash
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsFilterOpen(false)}
                  className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-950 border border-gray-200 transition-colors cursor-pointer"
                  title="Yopish"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 3 ta Bo'lim Tugmalari (Tablar): Viloyat & Shahar, Ta'mir kategoriyasi, Xususiyatlar */}
            <div className="p-3 bg-gray-50 border-b border-gray-200 shrink-0">
              <div className="grid grid-cols-3 gap-1 p-1 bg-gray-200/70 rounded-xl border border-gray-300/60 text-xs">
                <button
                  type="button"
                  onClick={() => setFilterTab('region')}
                  className={`py-2 px-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center ${
                    filterTab === 'region'
                      ? 'bg-[#FFB800] text-gray-950 shadow-xs font-black'
                      : 'text-gray-700 hover:text-gray-950 hover:bg-white/60'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Viloyat & Shahar</span>
                  {(selectedRegions.length > 0 || selectedDistricts.length > 0) && (
                    <span className="w-2 h-2 rounded-full bg-gray-950 shrink-0"></span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setFilterTab('category')}
                  className={`py-2 px-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center ${
                    filterTab === 'category'
                      ? 'bg-[#FFB800] text-gray-950 shadow-xs font-black'
                      : 'text-gray-700 hover:text-gray-950 hover:bg-white/60'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Ta'mir kategoriyasi</span>
                  {selectedTypes.length > 0 && (
                    <span className="w-2 h-2 rounded-full bg-gray-950 shrink-0"></span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setFilterTab('specs')}
                  className={`py-2 px-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center ${
                    filterTab === 'specs'
                      ? 'bg-[#FFB800] text-gray-950 shadow-xs font-black'
                      : 'text-gray-700 hover:text-gray-950 hover:bg-white/60'
                  }`}
                >
                  <Palette className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Xususiyatlar</span>
                  {hasSpecsFilter && (
                    <span className="w-2 h-2 rounded-full bg-gray-950 shrink-0"></span>
                  )}
                </button>
              </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-white">
              {/* TAB 1: VILOYAT VA SHAHAR / TUMAN */}
              {filterTab === 'region' && (
                <div className="space-y-4 animate-fadeIn">
                  {/* Viloyatlar qismi */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#FFB800]" />
                        <span>Viloyatlar</span>
                        {selectedRegions.length > 0 && (
                          <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-[#FFB800] text-gray-950">
                            {selectedRegions.length}
                          </span>
                        )}
                      </span>
                      {selectedRegions.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRegions([]);
                            setSelectedDistricts([]);
                          }}
                          className="text-[11px] text-red-500 hover:text-red-600 cursor-pointer font-medium"
                        >
                          Viloyatlarni tozalash
                        </button>
                      )}
                    </div>

                    {/* 14 ta viloyat grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
                      {allRegionsList.map((reg) => {
                        const isSelected = selectedRegions.includes(reg);
                        return (
                          <button
                            key={reg}
                            type="button"
                            onClick={() => toggleRegion(reg)}
                            className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer border ${
                              isSelected
                                ? 'bg-[#FFB800] text-gray-950 border-[#E5A600] shadow-xs font-black'
                                : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:text-gray-900 border-gray-200'
                            }`}
                          >
                            <span className="truncate">{reg}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3] shrink-0 ml-1 text-gray-950" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Shahar va tumanlar qismi (Faqat viloyat belgilagandan so'ng chiqadi) */}
                  <div className="pt-3 border-t border-gray-200">
                    {selectedRegions.length === 0 ? (
                      <div className="p-4 rounded-xl bg-gray-50 border border-dashed border-gray-300 text-center space-y-2">
                        <Building2 className="w-6 h-6 text-[#FFB800] mx-auto opacity-90" />
                        <div className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                          Tuman va shaharlar
                        </div>
                        <p className="text-xs text-gray-500 font-medium">
                          Tumanlar ro‘yxati viloyat belgilangandan so‘ng chiqadi.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-[#FFB800]" />
                            <span>Tuman va shaharlar</span>
                            {selectedDistricts.length > 0 && (
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#FFB800] text-gray-950">
                                {selectedDistricts.length}
                              </span>
                            )}
                          </span>
                          {selectedDistricts.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setSelectedDistricts([])}
                              className="text-[11px] text-red-500 hover:text-red-600 cursor-pointer font-medium"
                            >
                              Tumanlarni tozalash
                            </button>
                          )}
                        </div>

                        {/* Tuman qidiruvi */}
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Tuman yoki shahar nomini qidirish..."
                            value={districtSearch}
                            onChange={(e) => setDistrictSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-[#FFB800]"
                          />
                        </div>

                        {/* Tumanlar grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
                          {filteredDistrictsList.map((dist) => {
                            const isSelected = selectedDistricts.includes(dist);
                            return (
                              <button
                                key={dist}
                                type="button"
                                onClick={() => toggleDistrict(dist)}
                                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer border ${
                                  isSelected
                                    ? 'bg-[#FFB800] text-gray-950 border-[#E5A600] shadow-xs font-black'
                                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:text-gray-900 border-gray-200'
                                }`}
                              >
                                <span className="truncate">{dist}</span>
                                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3] shrink-0 ml-1 text-gray-950" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: TA'MIR KATEGORIYASI (8 ta kategoriya) */}
              {filterTab === 'category' && (
                <div className="space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                      <LayoutGrid className="w-3.5 h-3.5 text-[#FFB800]" />
                      <span>Ta'mir kategoriyasi ({productTypes.length} ta):</span>
                    </span>
                    {selectedTypes.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedTypes([])}
                        className="text-[11px] text-red-500 hover:text-red-600 cursor-pointer font-medium"
                      >
                        Tozalash ({selectedTypes.length})
                      </button>
                    )}
                  </div>

                  {productTypes.length === 0 ? (
                    <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-center text-xs text-gray-600 space-y-1">
                      <p className="font-semibold text-gray-900">Hozircha kategoriyalar kiritilmagan</p>
                      <p className="text-[11px]">Admin kabinetida ta'minotchi qo‘shilganda kiritilgan toifalar shu yerda avtomatik paydo bo‘ladi.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-80 overflow-y-auto pr-1">
                      {productTypes.map((pt) => {
                        const isSelected = selectedTypes.includes(pt.id);
                        return (
                          <button
                            key={pt.id}
                            type="button"
                            onClick={() => toggleSearchType(pt.id)}
                            className={`flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all text-left cursor-pointer border ${
                              isSelected
                                ? 'bg-[#FFB800] text-gray-950 border-[#E5A600] shadow-xs font-black'
                                : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:text-gray-900 border-gray-200'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              {pt.id === 'ishchi_kuchi' && <Briefcase className="w-4 h-4 shrink-0 text-gray-700" />}
                              {pt.id === 'asbob_uskunalar' && <Wrench className="w-4 h-4 shrink-0 text-gray-700" />}
                              {pt.id === 'texnika_ijarasi' && <Truck className="w-4 h-4 shrink-0 text-gray-700" />}
                              <span className="truncate">{pt.label}</span>
                            </div>
                            {isSelected && <Check className="w-4 h-4 stroke-[3] shrink-0 text-gray-950" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: XUSUSIYATLAR (kv Metr, Rang va qo'shimcha parametrlar) */}
              {filterTab === 'specs' && (
                <div className="space-y-4 animate-fadeIn">
                  
                  {/* 1. kv Metr (m²) xususiyati */}
                  <div className="space-y-3 p-4 rounded-xl bg-gray-50 border border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Ruler className="w-4 h-4 text-[#FFB800]" />
                        <span>kv Metr (Maydon / O'lcham m²)</span>
                        {hasSquareMetersFilter && (
                          <span className="text-[11px] font-bold font-mono px-2 py-0.5 rounded-full bg-[#FFB800] text-gray-950">
                            Faol
                          </span>
                        )}
                      </span>
                      {hasSquareMetersFilter && (
                        <button
                          type="button"
                          onClick={() => { setMinSquareMeters(''); setMaxSquareMeters(''); }}
                          className="text-[11px] text-red-500 hover:text-red-600 cursor-pointer font-medium"
                        >
                          Tozalash
                        </button>
                      )}
                    </div>

                    <p className="text-xs text-gray-600 font-medium">
                      Obyekt, xona yoki materialning qamrov maydonini kvadrat metrda (kv.m) belgilang:
                    </p>

                    {/* Min va Max kv metr inputlari */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] text-gray-700 font-semibold block">Min kv.m (m²):</label>
                        <div className="relative">
                          <input
                            type="text"
                            inputMode="numeric"
                            placeholder="0"
                            value={minSquareMeters}
                            onChange={(e) => {
                              const cleaned = e.target.value.replace(/\D/g, '');
                              setMinSquareMeters(cleaned ? Number(cleaned) : '');
                            }}
                            className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#FFB800] font-mono"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-bold">m²</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] text-gray-700 font-semibold block">Max kv.m (m²):</label>
                        <div className="relative">
                          <input
                            type="text"
                            inputMode="numeric"
                            placeholder="Cheksiz"
                            value={maxSquareMeters}
                            onChange={(e) => {
                              const cleaned = e.target.value.replace(/\D/g, '');
                              setMaxSquareMeters(cleaned ? Number(cleaned) : '');
                            }}
                            className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#FFB800] font-mono"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-bold">m²</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 2. Rang (Color) xususiyati */}
                  <div className="space-y-3 p-4 rounded-xl bg-gray-50 border border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Palette className="w-4 h-4 text-[#FFB800]" />
                        <span>Rang bo'yicha saralash</span>
                        {selectedColors.length > 0 && (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#FFB800] text-gray-950">
                            {selectedColors.length} ta
                          </span>
                        )}
                      </span>
                      {selectedColors.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedColors([])}
                          className="text-[11px] text-red-500 hover:text-red-600 cursor-pointer font-medium"
                        >
                          Ranglarni tozalash
                        </button>
                      )}
                    </div>

                    <p className="text-xs text-gray-600 font-medium">
                      Material yoki mahsulot rangini tanlang (bir nechta rangni tanlash mumkin):
                    </p>

                    {/* 15 ta Asosiy Ranglar palitrasi grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {COLOR_OPTIONS.map((c) => {
                        const isSelected = selectedColors.includes(c.id);
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => toggleColor(c.id)}
                            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer border ${
                              isSelected
                                ? 'bg-[#FFB800] text-gray-950 border-[#E5A600] shadow-xs font-black'
                                : 'bg-white text-gray-700 hover:bg-gray-100 hover:text-gray-900 border-gray-200'
                            }`}
                          >
                            <span
                              className="w-4 h-4 rounded-full shrink-0 shadow-xs border"
                              style={{ backgroundColor: c.bg, borderColor: c.border }}
                            />
                            <span className="truncate flex-1">{c.label}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3] shrink-0 text-gray-950" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. Ishlab chiqarilgan davlat bo'yicha saralash */}
                  <div className="space-y-3 p-4 rounded-xl bg-gray-50 border border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Globe className="w-4 h-4 text-[#FFB800]" />
                        <span>Ishlab chiqarilgan davlat</span>
                        {selectedManufacturers.length > 0 && (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#FFB800] text-gray-950">
                            {selectedManufacturers.length} ta
                          </span>
                        )}
                      </span>
                      {selectedManufacturers.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedManufacturers([])}
                          className="text-[11px] text-red-500 hover:text-red-600 cursor-pointer font-medium"
                        >
                          Tozalash
                        </button>
                      )}
                    </div>

                    <p className="text-xs text-gray-600 font-medium">
                      Mahsulot platformaga yuklanayotganda kiritilgan ishlab chiqarilgan davlatni qidiring yoki ro‘yxatdan tanlang:
                    </p>

                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                      <input
                        type="text"
                        value={manufacturerSearch}
                        onChange={(e) => setManufacturerSearch(e.target.value.replace(/[0-9]/g, ''))}
                        placeholder="Ishlab chiqarilgan davlat nomini yozing..."
                        className="w-full pl-9 pr-8 py-2 bg-white border border-gray-200 focus:border-[#FFB800] rounded-xl text-xs text-gray-900 placeholder-gray-400 focus:outline-none"
                      />
                      {manufacturerSearch && (
                        <button
                          type="button"
                          onClick={() => setManufacturerSearch('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {(() => {
                      const q = manufacturerSearch.trim().toLowerCase();
                      const filteredMfgs = q
                        ? manufacturersList.filter((m) => m.toLowerCase().includes(q))
                        : manufacturersList;

                      if (filteredMfgs.length === 0) {
                        return (
                          <div className="p-3 rounded-xl bg-gray-100 border border-gray-200 text-xs text-gray-600 flex items-center justify-between gap-2">
                            <span>
                              {q
                                ? `"${manufacturerSearch}" bo‘yicha ro‘yxatda topilmadi`
                                : "Hozircha ro‘yxatda davlatlar yo‘q"}
                            </span>
                            {q && (
                              <button
                                type="button"
                                onClick={() => {
                                  toggleManufacturer(manufacturerSearch.trim());
                                  setManufacturerSearch('');
                                }}
                                className="px-2.5 py-1 rounded-lg bg-[#FFB800] text-gray-950 font-bold text-[11px] cursor-pointer shrink-0"
                              >
                                + Tanlash
                              </button>
                            )}
                          </div>
                        );
                      }

                      return (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                          {filteredMfgs.map((mfg) => {
                            const isSel = selectedManufacturers.includes(mfg);
                            return (
                              <button
                                key={mfg}
                                type="button"
                                onClick={() => toggleManufacturer(mfg)}
                                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer border ${
                                  isSel
                                    ? 'bg-[#FFB800] text-gray-950 border-[#E5A600] shadow-xs font-black'
                                    : 'bg-white text-gray-700 hover:bg-gray-100 hover:text-gray-900 border-gray-200'
                                }`}
                              >
                                <span className="truncate">{mfg}</span>
                                {isSel && <Check className="w-3.5 h-3.5 stroke-[3] shrink-0 ml-1 text-gray-950" />}
                              </button>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>

                </div>
              )}

            </div>

            {/* Sticky Bottom Actions */}
            <div className="p-4 sm:p-5 border-t border-gray-200 bg-white flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={handleClearAllFilterCriteria}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-700 hover:text-gray-950 hover:bg-gray-100 border border-gray-200 transition-colors cursor-pointer"
              >
                Barchasini tozalash
              </button>

              <button
                type="button"
                onClick={() => setIsFilterOpen(false)}
                className="bg-[#FFB800] hover:bg-[#FFC928] text-gray-950 border border-[#E5A600] px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer shadow-xs active:scale-95 transition-all"
              >
                <Search className="w-4 h-4 text-gray-950 stroke-[2.5]" />
                <span>Qidiruv</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MAHSULOT TANLANGANDA: BIR TOMONDA TANLANGAN MAHSULOT, YON TARAFDA QOLGAN
          MAHSULOTLAR USTUN SHAKLIDA KO'RINADI. TANLANMAGANDA TO'LIQ KATALOG SETKASI.
          ========================================================================= */}
      {previewProduct ? (
        <div className="relative z-10 flex flex-col lg:flex-row items-start gap-6 animate-fadeIn">
          {/* CHAP / ASOSIY TOMON: TANLANGAN MAHSULOT TO'LIQ KO'RINISHI (UZUM USLUBI OQ FON) */}
          <div className="flex-1 min-w-0 w-full bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden text-gray-900">
            {/* Header: Ishlab chiqaruvchi ta'minotchi (B2B) yoki Ta'minotchi va X tugmasi */}
            <div className="p-4 sm:p-5 border-b border-gray-200 bg-gray-50 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm text-gray-600 font-medium">
                  {previewProduct.supplierCabinetType === 'manufacturer' ||
                  (previewProduct.supplierName || '').toUpperCase().includes('NATIONAL AI TECHNOLOGY')
                    ? "Ishlab chiqaruvchi ta'minotchi:"
                    : "Ta'minotchi:"}{' '}
                  <strong className="text-gray-950 font-black">{previewProduct.supplierName}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewProduct(null)}
                className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 border border-gray-200 transition-colors cursor-pointer flex items-center justify-center"
                title="Yopish"
                aria-label="Yopish"
              >
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              {/* 1. Suratlar galereyasi */}
              <div className="space-y-3">
                {(() => {
                  const galleryImages =
                    previewProduct.images && previewProduct.images.length > 0
                      ? previewProduct.images
                      : [previewProduct.image];
                  const safeIdx = activeImageIndex < galleryImages.length ? activeImageIndex : 0;
                  const currentImg = galleryImages[safeIdx] || previewProduct.image;

                  return (
                    <>
                      <div
                        onDoubleClick={() => setFullscreenImage(currentImg)}
                        className="relative h-64 sm:h-96 w-full rounded-2xl overflow-hidden bg-gray-50 border border-gray-200 group cursor-zoom-in select-none"
                      >
                        <img
                          src={currentImg}
                          alt={`${previewProduct.title} - ${safeIdx + 1}`}
                          onDoubleClick={() => setFullscreenImage(currentImg)}
                          className="w-full h-full object-contain transition-all duration-300"
                        />

                        {/* Kattalashtirish belgisi */}
                        <button
                          type="button"
                          onClick={() => setFullscreenImage(currentImg)}
                          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-gray-700 hover:text-amber-500 border border-gray-200 flex items-center justify-center shadow-xs transition-all cursor-pointer"
                          title="Kattalashtirish"
                          aria-label="Kattalashtirish"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>

                        {galleryImages.length > 1 && (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveImageIndex((prev) =>
                                  prev <= 0 ? galleryImages.length - 1 : prev - 1
                                );
                              }}
                              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-gray-800 border border-gray-200 flex items-center justify-center shadow-md transition-all cursor-pointer"
                              title="Oldingi surat"
                            >
                              <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveImageIndex((prev) =>
                                  prev >= galleryImages.length - 1 ? 0 : prev + 1
                                );
                              }}
                              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-gray-800 border border-gray-200 flex items-center justify-center shadow-md transition-all cursor-pointer"
                              title="Keyingi surat"
                            >
                              <ChevronRight className="w-5 h-5 stroke-[2.5]" />
                            </button>
                            <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-full bg-black/70 text-white font-mono text-[11px] font-bold">
                              {safeIdx + 1} / {galleryImages.length}
                            </div>
                          </>
                        )}
                      </div>

                      {galleryImages.length > 1 && (
                        <div className="flex items-center gap-2 overflow-x-auto pb-1">
                          {galleryImages.map((imgUrl, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setActiveImageIndex(idx)}
                              className={`relative w-14 h-14 rounded-xl overflow-hidden border-2 shrink-0 cursor-pointer transition-all ${
                                safeIdx === idx
                                  ? 'border-amber-400 ring-2 ring-amber-300 scale-105'
                                  : 'border-gray-200 opacity-70 hover:opacity-100'
                              }`}
                            >
                              <img
                                src={imgUrl}
                                alt={`${idx + 1}-rasm`}
                                className="w-full h-full object-cover"
                              />
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>

              {/* 2. Asosiy Tafsilotlar Bloki */}
              <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-200 text-gray-900">
                {(() => {
                  const variantsList =
                    previewProduct.variants && previewProduct.variants.length > 0
                      ? previewProduct.variants
                      : [
                          {
                            id: 'default',
                            unit: previewProduct.unit,
                            colors: previewProduct.colors || [],
                            specification: '',
                            price: previewProduct.price,
                            originalPrice: previewProduct.originalPrice || previewProduct.price,
                            minOrder: previewProduct.minOrder || 1,
                          },
                        ];
                  const safeVarIdx =
                    selectedVariantIdx < variantsList.length ? selectedVariantIdx : 0;
                  const activeVar = variantsList[safeVarIdx] || variantsList[0];
                  const activePrice = activeVar.price || previewProduct.price;
                  const activeUnit = activeVar.unit || previewProduct.unit;
                  const activeMinOrder = activeVar.minOrder || previewProduct.minOrder || 1;
                  const activeColors =
                    activeVar.colors && activeVar.colors.length > 0
                      ? activeVar.colors
                      : previewProduct.colors || [];

                  return (
                    <>
                      {/* 1-qator: Mahsulot nomi, manzili, ombor holati va narxi */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 pb-3">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 min-w-0">
                          <h2 className="text-lg sm:text-xl font-black text-gray-950 group-hover/detail:text-amber-600 transition-colors leading-tight">
                            {previewProduct.title}
                          </h2>
                          <span className="flex items-center gap-1 text-xs font-medium text-gray-600">
                            <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            Yetkazib beruvchi manzili: <strong className="text-gray-900 font-semibold">{previewProduct.region || 'O‘zbekiston'}</strong>
                          </span>
                          {previewProduct.manufacturerName && !isCabinetCompanyName(previewProduct.manufacturerName) && (
                            <span className="flex items-center gap-1 text-xs font-medium text-gray-600">
                              <Globe className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              Ishlab chiqarilgan davlat: <strong className="text-gray-900 font-semibold">{previewProduct.manufacturerName}</strong>
                            </span>
                          )}
                          {(previewProduct.stock ?? 0) <= 0 ? (
                            <span className="px-2.5 py-0.5 rounded-md bg-red-600 text-white font-bold text-[11px] uppercase shadow-xs">
                              Vaqtincha tugagan
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-[11px]">
                              Omborda mavjud: {previewProduct.stock} {activeUnit}
                            </span>
                          )}
                        </div>

                        <div className="flex items-baseline gap-1.5 shrink-0">
                          <span className="text-xl sm:text-2xl font-black text-gray-950">
                            {formatPrice(activePrice)}
                          </span>
                          <span className="text-xs text-gray-500 font-normal">
                            / {activeUnit}
                          </span>
                          {activeVar.specification && (
                            <span className="text-[10px] text-sky-100 font-bold ml-1">
                              ({activeVar.specification})
                            </span>
                          )}
                        </div>
                      </div>

                      {stockErrorNotice && (
                        <div className="p-2.5 rounded-lg bg-red-500/20 border border-red-500 text-red-500 text-xs font-black">
                          {stockErrorNotice}
                        </div>
                      )}

                      {/* 2-qator: Buyurtma miqdori + Jami + Savatga qo'shish */}
                      <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-3.5 py-3 rounded-xl border border-gray-200">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-xs text-gray-700 font-semibold">
                            Buyurtma miqdori ({activeUnit}):
                          </span>
                          <div className="flex items-center gap-1 bg-gray-100 border border-gray-200 rounded-lg p-0.5">
                            <button
                              type="button"
                              onClick={() => {
                                setStockErrorNotice(null);
                                setPreviewQuantity((q) => Math.max(activeMinOrder, q - 1));
                              }}
                              className="w-7 h-7 rounded bg-white hover:bg-gray-200 text-gray-900 flex items-center justify-center font-bold cursor-pointer transition-colors shadow-xs"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={previewQuantity}
                              onChange={(e) => {
                                const cleaned = e.target.value.replace(/\D/g, '');
                                const val = cleaned ? Number(cleaned) : 0;
                                const avail = typeof previewProduct.stock === 'number' ? Math.max(0, previewProduct.stock) : 0;
                                if (val > avail) {
                                  setStockErrorNotice(
                                    `«${previewProduct.title}» — Ombordagi miqdor yetarli emas! (Omborda mavjud: ${avail} ${activeUnit})`
                                  );
                                  setPreviewQuantity(Math.max(1, avail));
                                  return;
                                }
                                setStockErrorNotice(null);
                                if (val >= activeMinOrder) {
                                  setPreviewQuantity(val);
                                }
                              }}
                              className="w-12 text-center bg-transparent font-mono font-bold text-gray-950 text-xs focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const avail = typeof previewProduct.stock === 'number' ? Math.max(0, previewProduct.stock) : 0;
                                if (previewQuantity + 1 > avail) {
                                  setStockErrorNotice(
                                    `«${previewProduct.title}» — Ombordagi miqdor yetarli emas! (Omborda mavjud: ${avail} ${activeUnit})`
                                  );
                                  return;
                                }
                                setStockErrorNotice(null);
                                setPreviewQuantity((q) => q + 1);
                              }}
                              className="w-7 h-7 rounded bg-white hover:bg-gray-200 text-gray-900 flex items-center justify-center font-bold cursor-pointer transition-colors shadow-xs"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="text-xs text-gray-600">
                            Jami:{' '}
                            <strong className="text-gray-950 font-black text-sm">
                              {formatPrice(activePrice * previewQuantity)}
                            </strong>
                          </div>
                        </div>

                        {(previewProduct.stock ?? 0) <= 0 ? (
                          <button
                            type="button"
                            disabled
                            className="bg-gray-200 text-gray-500 py-2 px-4 rounded-xl text-xs font-bold cursor-not-allowed flex items-center justify-center gap-1.5 shrink-0"
                          >
                            <span>Vaqtincha tugagan</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              const suffixParts = [
                                activeVar.specification || '',
                                selectedPreviewColor ? `Rang: ${selectedPreviewColor}` : '',
                              ].filter(Boolean);
                              const customizedProduct: Product = {
                                ...previewProduct,
                                unit: activeUnit,
                                price: activePrice,
                                minOrder: activeMinOrder,
                                title:
                                  suffixParts.length > 0
                                    ? `${previewProduct.title} (${suffixParts.join(', ')})`
                                    : previewProduct.title,
                              };
                              handleAdd(customizedProduct, previewQuantity);
                            }}
                            className="bg-[#FFB800] hover:bg-[#FFC928] text-gray-950 border border-[#E5A600] py-2 px-5 rounded-xl text-xs sm:text-sm font-bold cursor-pointer flex items-center justify-center gap-2 shadow-xs transition-all active:scale-97 shrink-0"
                          >
                            <ShoppingCart className="w-4 h-4" />
                            <span>
                              {addedIds[previewProduct.id] ? '✓ Savatga qo‘shildi' : 'Savatga qo‘shish'}
                            </span>
                          </button>
                        )}
                      </div>

                      {/* 3-qator: Mavjud Variantlar, Rang va Minimal buyurtma */}
                      <div className="space-y-2 text-xs bg-white p-3.5 rounded-xl border border-gray-200">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-gray-900 font-bold mr-1">Mavjud Variantlar:</span>
                            {variantsList.map((v, vIdx) => {
                              const isSel = safeVarIdx === vIdx;
                              const rawSpec = (v.specification || '').trim();
                              const rawUnit = (v.unit || '').trim();
                              const variantLabel = rawSpec
                                ? rawUnit && !rawSpec.toLowerCase().includes(rawUnit.toLowerCase())
                                  ? `${rawSpec} ${rawUnit}`
                                  : rawSpec
                                : rawUnit || 'dona';
                              return (
                                <button
                                  key={v.id || vIdx}
                                  type="button"
                                  onClick={() => {
                                    setSelectedVariantIdx(vIdx);
                                    const nextColors =
                                      v.colors && v.colors.length > 0
                                        ? v.colors
                                        : previewProduct.colors || [];
                                    if (nextColors.length > 0 && !nextColors.includes(selectedPreviewColor)) {
                                      setSelectedPreviewColor(nextColors[0]);
                                    }
                                    setPreviewQuantity((q) => Math.max(v.minOrder || 1, q));
                                  }}
                                  className={`px-3 py-1 rounded-lg border transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                                    isSel
                                      ? 'bg-amber-400 text-gray-950 border-amber-500 font-bold shadow-xs'
                                      : 'bg-gray-100 text-gray-800 border-gray-200 hover:border-amber-400'
                                  }`}
                                >
                                  <span className="font-bold">{variantLabel}</span>
                                  {isSel && <Check className="w-3.5 h-3.5 stroke-[3] shrink-0" />}
                                </button>
                              );
                            })}
                          </div>

                          {activeMinOrder >= 1 && (
                            <span className="text-gray-500 font-medium shrink-0">
                              Minimal buyurtma:{' '}
                              <strong className="text-gray-900 font-bold">
                                {activeMinOrder} {activeUnit}
                              </strong>
                            </span>
                          )}
                        </div>

                        {activeColors.length > 0 && (
                          <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center gap-1.5">
                            <span className="text-gray-600 font-medium mr-1">Rangni tanlang:</span>
                            {activeColors.map((c) => {
                              const colStyle = getColorPaletteItem(c);
                              const isColorChosen = selectedPreviewColor === c;
                              return (
                                <button
                                  key={c}
                                  type="button"
                                  onClick={() => setSelectedPreviewColor(c)}
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border font-semibold text-[11px] shadow-xs transition-all cursor-pointer ${
                                    isColorChosen
                                      ? 'ring-2 ring-amber-400 border-gray-900'
                                      : 'border-gray-200 opacity-90 hover:opacity-100'
                                  }`}
                                  style={{
                                    backgroundColor: colStyle.bg,
                                    color: colStyle.text,
                                  }}
                                >
                                  <span
                                    className="w-2.5 h-2.5 rounded-full border border-current/30 shrink-0"
                                    style={{ backgroundColor: colStyle.bg }}
                                  />
                                  <span>{c}</span>
                                  {isColorChosen && <Check className="w-3 h-3 stroke-[3]" />}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* 3. Pastki qismdan: Mahsulot Haqida Video Tavsilot va Mahsulot haqida ma'lumot */}
              <div className="pt-2 border-t border-gray-200 space-y-3">
                {previewProduct.videoUrl && (
                  <div className="bg-amber-50 px-4 py-3 rounded-xl border border-amber-200 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-amber-400 text-gray-950 flex items-center justify-center shrink-0 shadow-xs">
                        <Play className="w-4 h-4 fill-current" />
                      </div>
                      <h4 className="text-xs font-bold text-gray-900 uppercase truncate">
                        Mahsulot haqida Video tavsilot
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFullscreenVideo(previewProduct.videoUrl || null)}
                      className="py-1.5 px-3.5 rounded-lg bg-amber-400 hover:bg-amber-500 text-gray-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95 border border-amber-500/50 shrink-0"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Videoni ko‘rish</span>
                    </button>
                  </div>
                )}

                <div className="space-y-1.5">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Mahsulot haqida ma'lumot
                  </h3>

                  {previewProduct.description &&
                  !previewProduct.description.includes(
                    'tomonidan taqdim etilayotgan yuqori sifatli mahsulot'
                  ) ? (
                    <p className="text-gray-800 text-xs sm:text-sm leading-relaxed bg-white p-3.5 rounded-xl border border-gray-200 font-normal">
                      {previewProduct.description}
                    </p>
                  ) : (
                    <p className="text-gray-600 text-xs sm:text-sm leading-relaxed bg-white p-3.5 rounded-xl border border-gray-200 font-normal">
                      {previewProduct.title} — {previewProduct.supplierName} tomonidan yetkazib beriladigan sifatli qurilish mahsuloti.
                    </p>
                  )}
                </div>

                {previewProduct.detailBlocks && previewProduct.detailBlocks.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {previewProduct.detailBlocks.slice(0, 4).map((block, bIdx) => (
                      <div
                        key={bIdx}
                        className="bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col shadow-xs"
                      >
                        <div className="px-3.5 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-900">
                            Mahsulot tafsiloti {bIdx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => setFullscreenImage(block.image)}
                            className="p-1 rounded-md bg-white hover:bg-gray-100 text-gray-600 border border-gray-200 transition-colors cursor-pointer"
                            title="Kattalashtirish"
                          >
                            <Maximize2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div
                          onDoubleClick={() => setFullscreenImage(block.image)}
                          className="relative h-48 sm:h-52 w-full bg-gray-50 p-2 flex items-center justify-center overflow-hidden cursor-zoom-in group"
                        >
                          <img
                            src={block.image}
                            alt={`Mahsulot haqida ma'lumot ${bIdx + 1}`}
                            onDoubleClick={() => setFullscreenImage(block.image)}
                            className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg group-hover:scale-[1.03] transition-transform duration-300"
                          />
                        </div>
                        {block.text && (
                          <div className="p-3 text-xs text-gray-700 leading-snug border-t border-gray-100 font-medium">
                            {block.text}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* O'NG TOMON: QOLGAN MAHSULOTLAR USTUN SHAKLIDA */}
          <div className="w-full lg:w-80 xl:w-96 shrink-0 bg-white border border-gray-200 rounded-2xl p-4 space-y-3 max-h-[85vh] overflow-y-auto shadow-xs text-gray-900">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                Boshqa Mahsulotlar
              </h3>
            </div>

            <div className="flex flex-col gap-3">
              {filteredProducts.map((item) => {
                const isCurrent = item.id === previewProduct.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleOpenPreview(item)}
                    className={`group flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-amber-50 border-amber-400 ring-1 ring-amber-400'
                        : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
                    }`}
                  >
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-16 h-16 rounded-xl object-cover bg-gray-100 border border-gray-200 shrink-0"
                    />
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="text-xs font-bold text-gray-900 group-hover:text-amber-600 transition-colors truncate">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-gray-500 truncate font-medium flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-amber-500 shrink-0" />
                        <span className="truncate">
                          Yetkazib beruvchi manzili: {item.region || 'O‘zbekiston'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-0.5">
                        <span className="text-xs font-bold text-gray-950 font-mono">
                          {formatPrice(item.price)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* 7. Product Cards Grid: Uzum Market oq dizayni, rasmlar hoverda almashadi, sariq sotib olish tugmasi */
        <div className="space-y-4">
          <div className="flex items-center justify-between pt-1">
            <h2 className="text-xl sm:text-2xl font-black text-gray-950 flex items-center gap-1.5 cursor-pointer hover:text-amber-600 transition-colors">
              <span>Mashhur</span>
              <ChevronRight className="w-5 h-5 text-gray-400 stroke-[2.5]" />
            </h2>
            {filteredProducts.length > 0 && (
              <span className="text-xs text-gray-400 font-medium font-mono">
                {filteredProducts.length} ta mahsulot
              </span>
            )}
          </div>

          <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-3 sm:gap-4">
            {filteredProducts.map((product) => (
              <UzumProductCard
                key={product.id}
                product={product}
                onOpenPreview={handleOpenPreview}
                onAdd={handleAdd}
                isAdded={!!addedIds[product.id]}
                formatPrice={formatPrice}
              />
            ))}
          </div>
        </div>
      )}

      {/* 6. Empty Product State */}
      {filteredProducts.length === 0 && (
        <div className="text-center py-16 px-6 bg-white rounded-2xl border border-gray-200 shadow-sm max-w-2xl mx-auto space-y-4 my-8 text-gray-900">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-[#FFB800]">
            <Package className="w-8 h-8 stroke-[2]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-gray-900">
              So‘rovingiz bo‘yicha qurilish mollari topilmadi.
            </h3>
            <p className="text-xs text-gray-500 font-medium">
              Qidiruv so‘zini o‘zgartiring yoki filtrlarni qayta o‘rnating.
            </p>
          </div>
          <button
            onClick={handleResetFilters}
            className="bg-[#FFB800] hover:bg-[#FFC928] text-gray-950 border border-[#E5A600] inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold cursor-pointer shadow-xs active:scale-95 transition-all"
          >
            <RotateCcw className="w-4 h-4 text-gray-950" />
            <span>Filtrlarni tozalash</span>
          </button>
        </div>
      )}

      {/* =========================================================================
          KATTALASHTIRILGAN (FULL SCREEN) MAHSULOT VA SURAT KO'RISH MODALI
          Kattalashtirganda ham: Rasm -> Mahsulot nomi -> pastki qismdan narxi ->
          Mavjud Variantlar -> Savatga qo'shish -> Uning pastki qismidan Mahsulot tavsifi
          ========================================================================= */}
      {fullscreenImage && (
        <div
          className="fixed inset-0 z-[100] w-screen h-screen bg-black/75 backdrop-blur-sm overflow-y-auto p-4 sm:p-6 animate-fadeIn"
          onClick={() => setFullscreenImage(null)}
        >
          <div className="max-w-4xl mx-auto bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-2xl text-gray-900 my-4" onClick={(e) => e.stopPropagation()}>
            {/* Yuqori panel faqat X bilan */}
            <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <div className="text-xs sm:text-sm text-gray-600 font-medium">
                {previewProduct ? (
                  <>
                    {previewProduct.supplierCabinetType === 'manufacturer' ||
                    (previewProduct.supplierName || '').toUpperCase().includes('NATIONAL AI TECHNOLOGY')
                      ? "Ishlab chiqaruvchi ta'minotchi:"
                      : "Ta'minotchi:"}{' '}
                    <strong className="text-gray-950 font-black">{previewProduct.supplierName}</strong>
                  </>
                ) : (
                  <strong className="text-gray-950 font-black">Mahsulot tasviri</strong>
                )}
              </div>
              <button
                type="button"
                onClick={() => setFullscreenImage(null)}
                className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 border border-gray-200 flex items-center justify-center cursor-pointer transition-colors"
                title="Yopish"
                aria-label="Yopish"
              >
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>

            {/* Katta rasm */}
            <div className="bg-gray-50 flex items-center justify-center p-2 sm:p-4 border-b border-gray-200">
              <img
                src={fullscreenImage}
                alt={previewProduct?.title || 'Mahsulot tasviri'}
                className="max-h-[65vh] w-auto object-contain rounded-xl"
              />
            </div>

            {/* Kattalashtirganda ham pastki qismda: Mahsulot nomi -> Narxi -> Mavjud Variantlar -> Savatga qo'shish -> Mahsulot tavsifi */}
            {previewProduct && (() => {
              const variantsList =
                previewProduct.variants && previewProduct.variants.length > 0
                  ? previewProduct.variants
                  : [
                      {
                        id: 'default',
                        unit: previewProduct.unit,
                        colors: previewProduct.colors || [],
                        specification: '',
                        price: previewProduct.price,
                        originalPrice: previewProduct.originalPrice || previewProduct.price,
                        minOrder: previewProduct.minOrder || 1,
                      },
                    ];
              const safeVarIdx =
                selectedVariantIdx < variantsList.length ? selectedVariantIdx : 0;
              const activeVar = variantsList[safeVarIdx] || variantsList[0];
              const activePrice = activeVar.price || previewProduct.price;
              const activeUnit = activeVar.unit || previewProduct.unit;
              const activeMinOrder = activeVar.minOrder || previewProduct.minOrder || 1;
              const activeColors =
                activeVar.colors && activeVar.colors.length > 0
                  ? activeVar.colors
                  : previewProduct.colors || [];

              return (
                <div className="p-5 sm:p-6 space-y-5">
                  {/* Mahsulot nomi va pastki qismdan narxi */}
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-gray-950">
                      {previewProduct.title}
                    </h2>
                    <div className="text-2xl font-extrabold text-gray-950 font-mono-numbers mt-1.5">
                      {formatPrice(activePrice)}{' '}
                      <span className="text-xs text-gray-500 font-bold font-sans">
                        / {activeUnit}
                      </span>
                    </div>
                  </div>

                  {/* Mavjud Variantlar */}
                  <div className="space-y-3 text-xs bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <div className="flex items-center justify-between py-1 border-b border-gray-200 gap-2">
                      <span className="text-gray-500 font-semibold">
                        {previewProduct.supplierCabinetType === 'manufacturer' ||
                        (previewProduct.supplierName || '').toUpperCase().includes('NATIONAL AI TECHNOLOGY')
                          ? "Ishlab chiqaruvchi ta'minotchi:"
                          : "Ta'minotchi:"}
                      </span>
                      <span className="text-gray-950 font-black text-right">{previewProduct.supplierName}</span>
                    </div>

                    <div className="space-y-2 pt-1">
                      <span className="text-gray-900 font-bold block">
                        Mavjud Variantlar:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {variantsList.map((v, vIdx) => {
                          const isSel = safeVarIdx === vIdx;
                          const rawSpec = (v.specification || '').trim();
                          const rawUnit = (v.unit || '').trim();
                          const variantLabel = rawSpec
                            ? rawUnit && !rawSpec.toLowerCase().includes(rawUnit.toLowerCase())
                              ? `${rawSpec} ${rawUnit}`
                              : rawSpec
                            : rawUnit || 'dona';
                          return (
                            <button
                              key={v.id || vIdx}
                              type="button"
                              onClick={() => {
                                setSelectedVariantIdx(vIdx);
                                const nextColors =
                                  v.colors && v.colors.length > 0
                                    ? v.colors
                                    : previewProduct.colors || [];
                                if (nextColors.length > 0 && !nextColors.includes(selectedPreviewColor)) {
                                  setSelectedPreviewColor(nextColors[0]);
                                }
                                setPreviewQuantity((q) => Math.max(v.minOrder || 1, q));
                              }}
                              className={`px-3.5 py-2 rounded-xl border text-left transition-all cursor-pointer inline-flex items-center gap-2 ${
                                isSel
                                  ? 'bg-[#FFB800] text-gray-950 border-[#E5A600] font-bold shadow-xs'
                                  : 'bg-white text-gray-800 border-gray-200 hover:border-amber-400'
                              }`}
                            >
                              <span className="font-bold text-xs">{variantLabel}</span>
                              {isSel && <Check className="w-4 h-4 stroke-[3] shrink-0 text-gray-950" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {activeColors.length > 0 && (
                      <div className="pt-2.5 border-t border-gray-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-700 font-bold">Rangni tanlang:</span>
                          {selectedPreviewColor && (
                            <span className="text-amber-600 font-mono font-bold text-[11px]">
                              Tanlangan: {selectedPreviewColor}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {activeColors.map((c) => {
                            const colStyle = getColorPaletteItem(c);
                            const isColorChosen = selectedPreviewColor === c;
                            return (
                              <button
                                key={c}
                                type="button"
                                onClick={() => setSelectedPreviewColor(c)}
                                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border font-bold text-xs shadow-xs transition-all cursor-pointer ${
                                  isColorChosen
                                    ? 'ring-2 ring-[#FFB800] scale-105 border-gray-400'
                                    : 'border-gray-200 opacity-90 hover:opacity-100'
                                }`}
                                style={{
                                  backgroundColor: colStyle.bg,
                                  color: colStyle.text,
                                }}
                              >
                                <span
                                  className="w-3.5 h-3.5 rounded-full border border-current/40 shrink-0 shadow-inner"
                                  style={{ backgroundColor: colStyle.bg }}
                                />
                                <span>{c}</span>
                                {isColorChosen && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                      <span className="text-gray-500 font-medium">Minimal buyurtma:</span>
                      <span className="text-gray-950 font-mono font-bold">
                        {activeMinOrder} {activeUnit}
                      </span>
                    </div>
                  </div>

                  {/* Savatga qo'shish (Sariq asosiy tugma) */}
                  <button
                    type="button"
                    onClick={() => {
                      const suffixParts = [
                        activeVar.specification || '',
                        selectedPreviewColor ? `Rang: ${selectedPreviewColor}` : '',
                      ].filter(Boolean);
                      const customizedProduct: Product = {
                        ...previewProduct,
                        unit: activeUnit,
                        price: activePrice,
                        minOrder: activeMinOrder,
                        title:
                          suffixParts.length > 0
                            ? `${previewProduct.title} (${suffixParts.join(', ')})`
                            : previewProduct.title,
                      };
                      handleAdd(customizedProduct, previewQuantity);
                    }}
                    className="w-full bg-[#FFB800] hover:bg-[#FFC928] text-gray-950 border border-[#E5A600] py-3.5 px-5 rounded-xl text-xs sm:text-sm font-bold cursor-pointer flex items-center justify-center gap-2 shadow-xs transition-all active:scale-97"
                  >
                    <ShoppingCart className="w-4 h-4 text-gray-950" />
                    <span>
                      {addedIds[previewProduct.id] ? '✓ Savatga qo‘shildi' : 'Savatga qo‘shish'}
                    </span>
                  </button>

                  {/* Uning pastki qismidan Mahsulot tavsifi */}
                  <div className="pt-4 border-t border-gray-200 space-y-3">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                      Mahsulot tavsifi
                    </h3>
                    <p className="text-gray-700 text-xs sm:text-sm leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-200 font-medium">
                      {previewProduct.description &&
                      !previewProduct.description.includes(
                        'tomonidan taqdim etilayotgan yuqori sifatli mahsulot'
                      )
                        ? previewProduct.description
                        : `${previewProduct.title} — ${previewProduct.supplierName} tomonidan yetkazib beriladigan sifatli qurilish mahsuloti.`}
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* =========================================================================
          KATTA EKRAN (FULL SCREEN) MAHSULOT VIDEOSINI KO'RISH MODALI
          ========================================================================= */}
      {fullscreenVideo && (
        <div
          className="fixed inset-0 z-[100] w-screen h-screen bg-black/95 backdrop-blur-md flex flex-col animate-fadeIn"
          onClick={() => setFullscreenVideo(null)}
        >
          <div
            className="px-6 py-4 bg-[#151719] border-b border-[#51504A] flex items-center justify-between shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-600 text-white">
                <Play className="w-5 h-5 fill-current" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#F5F5F2]">
                  {previewProduct?.title || 'Mahsulot Videosi'}
                </h3>
                <p className="text-xs text-[#B8B8B3]">Katta ekranda video namoyishi</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFullscreenVideo(null)}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer shadow-lg transition-colors"
            >
              <X className="w-5 h-5" />
              <span>Videoni yopish</span>
            </button>
          </div>

          <div
            className="flex-1 w-full h-full flex items-center justify-center p-2 sm:p-6 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const rawUrl = fullscreenVideo.trim();
              const ytMatch = rawUrl.match(
                /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/i
              );
              if (ytMatch && ytMatch[1]) {
                return (
                  <iframe
                    src={`https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0`}
                    title={previewProduct?.title || 'Mahsulot Videosi'}
                    className="w-full h-full max-w-[1600px] rounded-2xl border border-[#51504A] bg-black shadow-2xl"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                    allowFullScreen
                  />
                );
              }
              return (
                <video
                  src={rawUrl}
                  controls
                  autoPlay
                  className="w-full h-full max-w-[1600px] max-h-[85vh] rounded-2xl border border-[#51504A] bg-black shadow-2xl"
                />
              );
            })()}
          </div>
        </div>
      )}

    </div>
  );
};
