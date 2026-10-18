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
  CheckCircle2
} from 'lucide-react';
import { Product, UserProfile } from '../types';
import { REGIONS_AND_DISTRICTS } from '../data/regionsData';
import { getProductTypes, ProductTypeItem } from '../data/productTypes';

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

export const Marketplace: React.FC<MarketplaceProps> = ({ products, onAddToCart, currentUser }) => {
  const isLegalCabinet = currentUser?.userType === 'legal' || currentUser?.role === 'legal';
  const [search, setSearch] = useState('');
  const [showRegionSelector, setShowRegionSelector] = useState(false);
  // Qidiruv filtri: Viloyat/shahar, Ta'mir kategoriyasi, Xususiyatlar (kv.m, rang) va Narx
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterTab, setFilterTab] = useState<'region' | 'category' | 'specs' | 'price'>('region');
  
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

  // Xususiyatlar: kv Metr (m²) va Rang
  const [minSquareMeters, setMinSquareMeters] = useState<number | ''>('');
  const [maxSquareMeters, setMaxSquareMeters] = useState<number | ''>('');
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [onlyDelivery, setOnlyDelivery] = useState(false);
  const [onlyWarranty, setOnlyWarranty] = useState(false);
  const [onlyBonus, setOnlyBonus] = useState(false);

  // Narx filtri
  const [minPrice, setMinPrice] = useState<number | ''>('');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');

  // Tanlangan mahsulotni to'liq ekranni egallamasdan modal ko'rinishida ko'rish
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
  const [previewQuantity, setPreviewQuantity] = useState<number>(1);
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  // ESC tugmasi bosilganda yon filtr yoki modalni yopish
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFilterOpen(false);
        setPreviewProduct(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  // Tanlangan viloyatlarga tegishli (yoki barcha) tuman va shaharlar ro'yxati
  const availableDistricts = selectedRegions.length > 0
    ? selectedRegions.flatMap((reg) => REGIONS_AND_DISTRICTS[reg] || [])
    : Object.values(REGIONS_AND_DISTRICTS).flat();

  // Qidiruv sozlamalari bo'yicha nomzod tovarlar (narx oralig'ini avtomatik hisoblash uchun)
  const candidateProducts = products.filter((p) => {
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

  // Yakuniy narx filtri qo'llangan mahsulotlar
  const filteredProducts = candidateProducts.filter((p) => {
    const matchesMinPrice = minPrice === '' || p.price >= minPrice;
    const matchesMaxPrice = maxPrice === '' || p.price <= maxPrice;
    return matchesMinPrice && matchesMaxPrice;
  });

  // Mahsulot modalini ochish (Ekranni ikkiga bo'lmasdan tezkor ko'rish)
  const handleOpenPreview = (product: Product) => {
    setPreviewProduct(product);
    setPreviewQuantity(Math.max(1, product.minOrder || 1));
  };

  const handleAdd = (product: Product, quantity = 1) => {
    onAddToCart(product, quantity);
    setAddedIds((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [product.id]: false }));
    }, 1500);
  };

  // Barcha filtrlarni tozalash (drawer ichida ham, tashqarisida ham)
  const handleClearAllFilterCriteria = () => {
    setSelectedTypes([]);
    setSelectedRegions([]);
    setSelectedDistricts([]);
    setMinPrice('');
    setMaxPrice('');
    setMinSquareMeters('');
    setMaxSquareMeters('');
    setSelectedColors([]);
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

  const hasPriceFilter = minPrice !== '' || maxPrice !== '';
  const hasSquareMetersFilter = minSquareMeters !== '' || maxSquareMeters !== '';
  const hasSpecsFilter =
    hasSquareMetersFilter ||
    selectedColors.length > 0 ||
    onlyDelivery ||
    onlyWarranty ||
    onlyBonus;

  const totalActiveCriteria =
    selectedRegions.length +
    selectedDistricts.length +
    selectedTypes.length +
    (hasPriceFilter ? 1 : 0) +
    (hasSquareMetersFilter ? 1 : 0) +
    selectedColors.length +
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
    hasPriceFilter ||
    hasSpecsFilter;

  const filteredRegionsList = allRegionsList.filter((reg) =>
    reg.toLowerCase().includes(regionSearch.toLowerCase())
  );

  const filteredDistrictsList = availableDistricts.filter((dist) =>
    dist.toLowerCase().includes(districtSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      


      {/* 4. Search and Filter Bar: One horizontal search panel */}
      <div className="relative z-30 p-3 sm:p-4 rounded-xl bg-[#222528] border border-[#51504A] shadow-md space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          
          {/* Qidiruv inputi: "Mahsulotlarni qidirish..." */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[#FFB800]" />
            <input
              type="text"
              placeholder="Mahsulotlarni qidirish..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 bg-[#151719] border border-[#51504A] focus:border-[#FFB800] rounded-lg text-[#F5F5F2] placeholder-[#B8B8B3]/60 text-xs sm:text-sm outline-none transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B8B8B3] hover:text-[#F5F5F2] p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Tugmalar: Qidiruv + Qidiruv filtri + Product count */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            {/* Yellow "Qidiruv" button */}
            <button
              type="button"
              className="btn-industrial-yellow px-4 sm:px-5 py-2.5 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm cursor-pointer whitespace-nowrap"
            >
              <Search className="w-4 h-4" />
              <span>Qidiruv</span>
            </button>

            {/* Dark "Qidiruv filtri" button with sliders icon */}
            <button
              type="button"
              onClick={() => setIsFilterOpen(true)}
              className={`btn-industrial-dark px-4 sm:px-5 py-2.5 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                totalActiveCriteria > 0 ? 'border-[#FFB800] text-[#FFB800]' : ''
              }`}
            >
              <SlidersHorizontal className="w-4 h-4 text-[#FFB800]" />
              <span>Bunker Qidiruv filtri</span>
              {totalActiveCriteria > 0 && (
                <span className="px-1.5 py-0.2 rounded text-[11px] font-mono font-bold bg-[#FFB800] text-[#151719]">
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
                className="p-2.5 rounded-lg bg-[#292C2F] border border-[#51504A] hover:border-red-400 text-red-400 hover:text-red-300 text-xs font-semibold cursor-pointer transition-colors"
                title="Barcha filtrlarni tozalash"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}

            {/* Product count: "0 ta mahsulot" */}
            <div className="text-xs text-[#B8B8B3] font-mono px-3 py-2 rounded-lg bg-[#151719] border border-[#51504A] shrink-0 whitespace-nowrap">
              {filteredProducts.length} ta mahsulot
            </div>
          </div>

        </div>

        {/* Faol filtrlar teglari */}
        {totalActiveCriteria > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#51504A] text-xs">
            <span className="text-[11px] text-[#FFB800] font-mono font-bold uppercase tracking-wider">Faol filtrlar:</span>
            
            {/* Tanlangan viloyatlar */}
            {selectedRegions.map((reg) => (
              <span
                key={reg}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#292C2F] border border-[#51504A] text-[#F5F5F2] text-xs font-medium"
              >
                <MapPin className="w-3 h-3 text-[#FFB800]" />
                <span>{reg}</span>
                <button
                  type="button"
                  onClick={() => toggleRegion(reg)}
                  className="hover:text-red-400 cursor-pointer ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {/* Tanlangan tumanlar */}
            {selectedDistricts.map((dist) => (
              <span
                key={dist}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#292C2F] border border-[#51504A] text-[#F5F5F2] text-xs font-medium"
              >
                <Building2 className="w-3 h-3 text-[#FFB800]" />
                <span>{dist}</span>
                <button
                  type="button"
                  onClick={() => toggleDistrict(dist)}
                  className="hover:text-red-400 cursor-pointer ml-0.5"
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
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#292C2F] border border-[#51504A] text-[#F5F5F2] text-xs font-medium"
                >
                  <LayoutGrid className="w-3 h-3 text-[#FFB800]" />
                  <span>{item?.label || tid}</span>
                  <button
                    type="button"
                    onClick={() => toggleSearchType(tid)}
                    className="hover:text-red-400 cursor-pointer ml-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}

            {/* Narx filtri */}
            {hasPriceFilter && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#292C2F] border border-[#51504A] text-[#F5F5F2] text-xs font-medium font-mono">
                <Coins className="w-3 h-3 text-[#FFB800]" />
                <span>
                  {minPrice !== '' ? formatPrice(Number(minPrice)) : '0'} - {maxPrice !== '' ? formatPrice(Number(maxPrice)) : '∞'}
                </span>
                <button
                  type="button"
                  onClick={() => { setMinPrice(''); setMaxPrice(''); }}
                  className="hover:text-red-400 cursor-pointer ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* kv Metr filtri */}
            {hasSquareMetersFilter && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#292C2F] border border-[#51504A] text-[#F5F5F2] text-xs font-medium font-mono">
                <Ruler className="w-3 h-3 text-[#FFB800]" />
                <span>
                  {minSquareMeters !== '' ? `${minSquareMeters} m²` : '0 m²'} - {maxSquareMeters !== '' ? `${maxSquareMeters} m²` : '∞'}
                </span>
                <button
                  type="button"
                  onClick={() => { setMinSquareMeters(''); setMaxSquareMeters(''); }}
                  className="hover:text-red-400 cursor-pointer ml-0.5"
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
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#292C2F] border border-[#51504A] text-[#F5F5F2] text-xs font-medium"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-white/50"
                    style={{ backgroundColor: col?.bg || '#ffffff' }}
                  />
                  <span>{col?.label || colId}</span>
                  <button
                    type="button"
                    onClick={() => toggleColor(colId)}
                    className="hover:text-red-400 cursor-pointer ml-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}
          </div>
        )}
      </div>





      {/* =========================================================================
          YON TARAFIQDAN OCHILADIGAN QIDIRUV FILTRI PANELI
          (Butun panelning/ekranning 50% qismini oladi, chetdan silliq ochiladi)
          ========================================================================= */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Orqa fon (Backdrop) */}
          <div
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm transition-opacity"
            onClick={() => setIsFilterOpen(false)}
          />

          {/* O'ng tomondan butun panelning yarmini oluvchi yon filtr paneli (Drawer - md:w-[50%]) */}
          <div
            className="relative z-50 w-full sm:w-[540px] md:w-[50%] lg:w-[50%] max-w-3xl h-full bg-[#222528] border-l border-[#51504A] shadow-2xl flex flex-col animate-slide-left text-[#F5F5F2]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-[#51504A] flex items-center justify-between bg-[#1D2023] shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#292C2F] text-[#FFB800] border border-[#51504A]">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-[#F5F5F2]">Bunker Qidiruv filtri</h3>
                    {totalActiveCriteria > 0 && (
                      <span className="text-[11px] font-bold font-mono px-2 py-0.5 rounded bg-[#FFB800] text-[#151719]">
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
                    className="text-xs font-bold text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 cursor-pointer transition-colors"
                  >
                    Tozalash
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsFilterOpen(false)}
                  className="p-2 rounded-lg bg-[#292C2F] hover:bg-[#151719] text-[#B8B8B3] hover:text-[#F5F5F2] border border-[#51504A] transition-colors cursor-pointer"
                  title="Yopish"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 4 ta Bo'lim Tugmalari (Tablar): Viloyat & Shahar, Ta'mir kategoriyasi, Xususiyatlar, Narx oralig'i */}
            <div className="p-3 bg-[#1D2023] border-b border-[#51504A] shrink-0">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 p-1 bg-[#151719] rounded-xl border border-[#51504A] text-xs">
                <button
                  type="button"
                  onClick={() => setFilterTab('region')}
                  className={`py-2 px-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center ${
                    filterTab === 'region'
                      ? 'bg-[#FFB800] text-[#151719] shadow-sm font-bold'
                      : 'text-[#B8B8B3] hover:text-[#F5F5F2] hover:bg-[#292C2F]'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Viloyat & Shahar</span>
                  {(selectedRegions.length > 0 || selectedDistricts.length > 0) && (
                    <span className="w-2 h-2 rounded-full bg-[#FFB800] shrink-0"></span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setFilterTab('category')}
                  className={`py-2 px-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center ${
                    filterTab === 'category'
                      ? 'bg-[#FFB800] text-[#151719] shadow-sm font-bold'
                      : 'text-[#B8B8B3] hover:text-[#F5F5F2] hover:bg-[#292C2F]'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Ta'mir kategoriyasi</span>
                  {selectedTypes.length > 0 && (
                    <span className="w-2 h-2 rounded-full bg-[#FFB800] shrink-0"></span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setFilterTab('specs')}
                  className={`py-2 px-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center ${
                    filterTab === 'specs'
                      ? 'bg-[#FFB800] text-[#151719] shadow-sm font-bold'
                      : 'text-[#B8B8B3] hover:text-[#F5F5F2] hover:bg-[#292C2F]'
                  }`}
                >
                  <Palette className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Xususiyatlar</span>
                  {hasSpecsFilter && (
                    <span className="w-2 h-2 rounded-full bg-[#FFB800] shrink-0"></span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setFilterTab('price')}
                  className={`py-2 px-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center ${
                    filterTab === 'price'
                      ? 'bg-[#FFB800] text-[#151719] shadow-sm font-bold'
                      : 'text-[#B8B8B3] hover:text-[#F5F5F2] hover:bg-[#292C2F]'
                  }`}
                >
                  <Coins className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Narx oralig'i</span>
                  {hasPriceFilter && (
                    <span className="w-2 h-2 rounded-full bg-red-500 shrink-0"></span>
                  )}
                </button>
              </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
              {/* TAB 1: VILOYAT VA SHAHAR / TUMAN */}
              {filterTab === 'region' && (
                <div className="space-y-4 animate-fadeIn">
                  {/* Viloyatlar qismi */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-amber-400" />
                        <span>Viloyatlar</span>
                        {selectedRegions.length > 0 && (
                          <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
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
                          className="text-[11px] text-red-400 hover:text-red-300 cursor-pointer"
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
                            className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold transition-all text-left cursor-pointer border ${
                              isSelected
                                ? 'bg-[#FFB800] text-[#151719] border-[#FFC928] shadow-sm font-bold'
                                : 'bg-[#222528] text-[#B8B8B3] hover:bg-[#292C2F] hover:text-[#F5F5F2] border-[#51504A]'
                            }`}
                          >
                            <span className="truncate">{reg}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3] shrink-0 ml-1" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Shahar va tumanlar qismi */}
                  <div className="space-y-2 pt-3 border-t border-[#51504A]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#FFB800] uppercase tracking-wider flex items-center gap-1.5 font-mono">
                        <Building2 className="w-3.5 h-3.5 text-[#FFB800]" />
                        <span>Tuman va shaharlar</span>
                        {selectedDistricts.length > 0 && (
                          <span className="text-[11px] font-bold font-mono px-2 py-0.2 rounded bg-[#FFB800] text-[#151719]">
                            {selectedDistricts.length}
                          </span>
                        )}
                      </span>
                      {selectedDistricts.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedDistricts([])}
                          className="text-[11px] text-red-400 hover:text-red-300 cursor-pointer"
                        >
                          Tumanlarni tozalash
                        </button>
                      )}
                    </div>

                    {/* Tuman qidiruvi */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#B8B8B3]" />
                      <input
                        type="text"
                        placeholder="Tuman yoki shahar nomini qidirish..."
                        value={districtSearch}
                        onChange={(e) => setDistrictSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 bg-[#151719] border border-[#51504A] rounded-lg text-xs text-[#F5F5F2] placeholder-[#B8B8B3]/60 focus:outline-none focus:border-[#FFB800]"
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
                            className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all text-left cursor-pointer border ${
                              isSelected
                                ? 'bg-[#FFB800] text-[#151719] border-[#FFC928] shadow-sm font-bold'
                                : 'bg-[#222528] text-[#B8B8B3] hover:bg-[#292C2F] hover:text-[#F5F5F2] border-[#51504A]'
                            }`}
                          >
                            <span className="truncate">{dist}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3] shrink-0 ml-1" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: TA'MIR KATEGORIYASI (8 ta kategoriya) */}
              {filterTab === 'category' && (
                <div className="space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#FFB800] uppercase tracking-wider flex items-center gap-1.5 font-mono">
                      <LayoutGrid className="w-3.5 h-3.5 text-[#FFB800]" />
                      Ta'mir kategoriyasi ({productTypes.length} ta):
                    </span>
                    {selectedTypes.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedTypes([])}
                        className="text-[11px] text-red-400 hover:text-red-300 cursor-pointer"
                      >
                        Tozalash ({selectedTypes.length})
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-80 overflow-y-auto pr-1">
                    {productTypes.map((pt) => {
                      const isSelected = selectedTypes.includes(pt.id);
                      return (
                        <button
                          key={pt.id}
                          type="button"
                          onClick={() => toggleSearchType(pt.id)}
                          className={`flex items-center justify-between px-4 py-3 rounded-lg text-xs font-bold transition-all text-left cursor-pointer border ${
                            isSelected
                              ? 'bg-[#FFB800] text-[#151719] border-[#FFC928] shadow-sm font-bold'
                              : 'bg-[#222528] text-[#B8B8B3] hover:bg-[#292C2F] hover:text-[#F5F5F2] border-[#51504A]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            {pt.id === 'ishchi_kuchi' && <Briefcase className="w-4 h-4 shrink-0" />}
                            {pt.id === 'asbob_uskunalar' && <Wrench className="w-4 h-4 shrink-0" />}
                            {pt.id === 'texnika_ijarasi' && <Truck className="w-4 h-4 shrink-0" />}
                            <span className="truncate">{pt.label}</span>
                          </div>
                          {isSelected && <Check className="w-4 h-4 stroke-[3] shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 3: XUSUSIYATLAR (kv Metr, Rang va qo'shimcha parametrlar) */}
              {filterTab === 'specs' && (
                <div className="space-y-4 animate-fadeIn">
                  
                  {/* 1. kv Metr (m²) xususiyati */}
                  <div className="space-y-3 p-4 rounded-xl bg-[#292C2F] border border-[#51504A]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#FFB800] uppercase tracking-wider flex items-center gap-1.5 font-mono">
                        <Ruler className="w-4 h-4 text-[#FFB800]" />
                        <span>kv Metr (Maydon / O'lcham m²)</span>
                        {hasSquareMetersFilter && (
                          <span className="text-[11px] font-bold font-mono px-2 py-0.2 rounded bg-[#FFB800] text-[#151719]">
                            Faol
                          </span>
                        )}
                      </span>
                      {hasSquareMetersFilter && (
                        <button
                          type="button"
                          onClick={() => { setMinSquareMeters(''); setMaxSquareMeters(''); }}
                          className="text-[11px] text-red-400 hover:text-red-300 cursor-pointer"
                        >
                          Tozalash
                        </button>
                      )}
                    </div>

                    <p className="text-xs text-[#B8B8B3]">
                      Obyekt, xona yoki materialning qamrov maydonini kvadrat metrda (kv.m) belgilang:
                    </p>

                    {/* Min va Max kv metr inputlari */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] text-[#B8B8B3] font-semibold block">Min kv.m (m²):</label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={minSquareMeters}
                            onChange={(e) => setMinSquareMeters(e.target.value ? Number(e.target.value) : '')}
                            className="w-full bg-[#151719] border border-[#51504A] rounded-lg px-3.5 py-2 text-xs text-[#F5F5F2] placeholder-[#B8B8B3]/60 focus:outline-none focus:border-[#FFB800] font-mono"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#B8B8B3] font-bold">m²</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] text-[#B8B8B3] font-semibold block">Max kv.m (m²):</label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            placeholder="Cheksiz"
                            value={maxSquareMeters}
                            onChange={(e) => setMaxSquareMeters(e.target.value ? Number(e.target.value) : '')}
                            className="w-full bg-[#151719] border border-[#51504A] rounded-lg px-3.5 py-2 text-xs text-[#F5F5F2] placeholder-[#B8B8B3]/60 focus:outline-none focus:border-[#FFB800] font-mono"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#B8B8B3] font-bold">m²</span>
                        </div>
                      </div>
                    </div>

                    {/* Tezkor kv. metr tugmalari */}
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] text-[#B8B8B3] font-semibold block">Tezkor maydon tanlash:</span>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                        {[
                          { label: "< 20 m²", min: '', max: 20 },
                          { label: "20 - 50 m²", min: 20, max: 50 },
                          { label: "50 - 100 m²", min: 50, max: 100 },
                          { label: "100 - 200 m²", min: 100, max: 200 },
                          { label: "200+ m²", min: 200, max: '' },
                        ].map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setMinSquareMeters(preset.min as any);
                              setMaxSquareMeters(preset.max as any);
                            }}
                            className={`py-2 px-1 rounded-lg text-xs font-bold transition-colors cursor-pointer border text-center ${
                              minSquareMeters === preset.min && maxSquareMeters === preset.max
                                ? 'bg-[#FFB800] text-[#151719] border-[#FFC928] font-bold'
                                : 'bg-[#222528] text-[#B8B8B3] border-[#51504A] hover:border-[#777A7C] hover:text-[#F5F5F2]'
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 2. Rang (Color) xususiyati */}
                  <div className="space-y-3 p-4 rounded-xl bg-[#292C2F] border border-[#51504A]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#FFB800] uppercase tracking-wider flex items-center gap-1.5 font-mono">
                        <Palette className="w-4 h-4 text-[#FFB800]" />
                        <span>Rang bo'yicha saralash</span>
                        {selectedColors.length > 0 && (
                          <span className="text-[11px] font-bold font-mono px-2 py-0.2 rounded bg-[#FFB800] text-[#151719]">
                            {selectedColors.length} ta
                          </span>
                        )}
                      </span>
                      {selectedColors.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedColors([])}
                          className="text-[11px] text-red-400 hover:text-red-300 cursor-pointer"
                        >
                          Ranglarni tozalash
                        </button>
                      )}
                    </div>

                    <p className="text-xs text-[#B8B8B3]">
                      Material yoki mahsulot rangini tanlang (bir nechta rangni tanlash mumkin):
                    </p>

                    {/* Ranglar palitrasi grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
                      {COLOR_OPTIONS.map((c) => {
                        const isSelected = selectedColors.includes(c.id);
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => toggleColor(c.id)}
                            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold transition-all text-left cursor-pointer border ${
                              isSelected
                                ? 'bg-[#FFB800] text-[#151719] border-[#FFC928] shadow-sm font-bold'
                                : 'bg-[#222528] text-[#B8B8B3] hover:bg-[#292C2F] hover:text-[#F5F5F2] border-[#51504A]'
                            }`}
                          >
                            <span
                              className="w-4 h-4 rounded-full shrink-0 shadow border"
                              style={{ backgroundColor: c.bg, borderColor: c.border }}
                            />
                            <span className="truncate flex-1">{c.label}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3] shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. Qo'shimcha xususiyatlar */}
                  <div className="space-y-2 p-4 rounded-xl bg-[#292C2F] border border-[#51504A]">
                    <span className="text-xs font-bold text-[#FFB800] uppercase tracking-wider flex items-center gap-1.5 font-mono">
                      <Sparkles className="w-4 h-4 text-[#FFB800]" />
                      Qo'shimcha xususiyatlar:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setOnlyDelivery(!onlyDelivery)}
                        className={`p-2.5 rounded-lg text-xs font-bold border transition-colors flex items-center justify-between cursor-pointer ${
                          onlyDelivery
                            ? 'bg-[#FFB800] text-[#151719] border-[#FFC928] font-bold'
                            : 'bg-[#222528] text-[#B8B8B3] border-[#51504A] hover:bg-[#292C2F] hover:text-[#F5F5F2]'
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5" />
                          Yetkazib berish
                        </span>
                        {onlyDelivery && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => setOnlyWarranty(!onlyWarranty)}
                        className={`p-2.5 rounded-lg text-xs font-bold border transition-colors flex items-center justify-between cursor-pointer ${
                          onlyWarranty
                            ? 'bg-[#FFB800] text-[#151719] border-[#FFC928] font-bold'
                            : 'bg-[#222528] text-[#B8B8B3] border-[#51504A] hover:bg-[#292C2F] hover:text-[#F5F5F2]'
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Kafolat mavjud
                        </span>
                        {onlyWarranty && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => setOnlyBonus(!onlyBonus)}
                        className={`p-2.5 rounded-lg text-xs font-bold border transition-colors flex items-center justify-between cursor-pointer ${
                          onlyBonus
                            ? 'bg-[#FFB800] text-[#151719] border-[#FFC928] font-bold'
                            : 'bg-[#222528] text-[#B8B8B3] border-[#51504A] hover:bg-[#292C2F] hover:text-[#F5F5F2]'
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" />
                          Bonusli
                        </span>
                        {onlyBonus && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 4: NARX ORALIG'I */}
              {filterTab === 'price' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#FFB800] uppercase tracking-wider flex items-center gap-1.5 font-mono">
                      <Coins className="w-3.5 h-3.5 text-[#FFB800]" />
                      Narx oralig‘ini belgilash (so'm):
                    </span>
                    {hasPriceFilter && (
                      <button
                        type="button"
                        onClick={() => { setMinPrice(''); setMaxPrice(''); }}
                        className="text-[11px] text-red-400 hover:text-red-300 cursor-pointer"
                      >
                        Narxni tozalash
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs text-[#B8B8B3] font-semibold block">Minimal narx (so'm):</label>
                      <input
                        type="number"
                        placeholder={autoMinPrice > 0 ? formatPrice(autoMinPrice) : "0"}
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value ? Number(e.target.value) : '')}
                        className="w-full bg-[#151719] border border-[#51504A] rounded-lg px-3.5 py-2.5 text-xs text-[#F5F5F2] placeholder-[#B8B8B3]/60 focus:outline-none focus:border-[#FFB800] font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-[#B8B8B3] font-semibold block">Maksimal narx (so'm):</label>
                      <input
                        type="number"
                        placeholder={autoMaxPrice > 0 ? formatPrice(autoMaxPrice) : "Cheksiz"}
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : '')}
                        className="w-full bg-[#151719] border border-[#51504A] rounded-lg px-3.5 py-2.5 text-xs text-[#F5F5F2] placeholder-[#B8B8B3]/60 focus:outline-none focus:border-[#FFB800] font-mono"
                      />
                    </div>
                  </div>

                  {/* Tezkor narx oralig'i tugmalari */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] text-[#B8B8B3] font-semibold">Tezkor narx tanlash:</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {[
                        { label: "< 100 ming", min: '', max: 100000 },
                        { label: "100 ming - 1 mln", min: 100000, max: 1000000 },
                        { label: "1 mln - 10 mln", min: 1000000, max: 10000000 },
                        { label: "10 mln +", min: 10000000, max: '' },
                      ].map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setMinPrice(preset.min as any);
                            setMaxPrice(preset.max as any);
                          }}
                          className={`py-2 px-2 rounded-lg text-xs font-bold transition-colors cursor-pointer border text-center ${
                            minPrice === preset.min && maxPrice === preset.max
                              ? 'bg-[#FFB800] text-[#151719] border-[#FFC928] font-bold'
                              : 'bg-[#222528] text-[#B8B8B3] border-[#51504A] hover:border-[#777A7C] hover:text-[#F5F5F2]'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sticky Bottom Actions */}
            <div className="p-4 sm:p-5 border-t border-[#51504A] bg-[#1D2023] flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={handleClearAllFilterCriteria}
                className="px-4 py-2.5 rounded-lg text-xs font-bold text-[#B8B8B3] hover:text-[#F5F5F2] hover:bg-[#292C2F] border border-[#51504A] transition-colors cursor-pointer"
              >
                Barchasini tozalash
              </button>

              <button
                type="button"
                onClick={() => setIsFilterOpen(false)}
                className="btn-industrial-yellow px-6 py-2.5 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Search className="w-4 h-4" />
                <span>Qidiruv</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MAHSULOTNING QISQA MODAL OYNASI (1 ta mahsulot butun ekranni egallamaydi)
          ========================================================================= */}
      {previewProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div
            className="w-full max-w-2xl bg-[#222528] border border-[#51504A] rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#51504A] bg-[#1D2023] flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded bg-[#151719] text-[#FFB800] text-xs font-mono font-bold border border-[#51504A]">
                {previewProduct.category}
              </span>
              <button
                type="button"
                onClick={() => setPreviewProduct(null)}
                className="p-1.5 rounded-lg bg-[#292C2F] hover:bg-[#151719] text-[#B8B8B3] hover:text-[#F5F5F2] border border-[#51504A] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
              <div className="relative h-60 w-full rounded-lg overflow-hidden bg-[#151719] border border-[#51504A]">
                <img
                  src={previewProduct.image}
                  alt={previewProduct.title}
                  className="w-full h-full object-cover"
                />
                {previewProduct.isEscoCertified && (
                  <span className="absolute top-3 right-3 bg-[#FFB800] text-[#151719] text-xs font-black px-2.5 py-1 rounded flex items-center gap-1 shadow-sm font-mono">
                    <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                    GOST Sertifikati
                  </span>
                )}
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#F5F5F2]">{previewProduct.title}</h2>
                <div className="text-xl sm:text-2xl font-bold text-[#FFB800] font-mono-numbers mt-1">
                  {formatPrice(previewProduct.price)} <span className="text-xs text-[#B8B8B3] font-normal font-sans">/ {previewProduct.unit}</span>
                </div>
              </div>

              <p className="text-[#B8B8B3] text-sm leading-relaxed bg-[#292C2F] p-4 rounded-lg border border-[#51504A]">
                {previewProduct.description}
              </p>

              <div className="grid grid-cols-2 gap-3 text-xs bg-[#292C2F] p-3.5 rounded-lg border border-[#51504A]">
                <div>
                  <span className="text-[#B8B8B3] block mb-0.5">Yetkazib beruvchi:</span>
                  <span className="text-[#F5F5F2] font-bold">{previewProduct.supplierName}</span>
                </div>
                <div>
                  <span className="text-[#B8B8B3] block mb-0.5">Hudud:</span>
                  <span className="text-[#F5F5F2] font-bold">{previewProduct.region || 'Toshkent'}</span>
                </div>
                <div>
                  <span className="text-[#B8B8B3] block mb-0.5">Omborda:</span>
                  <span className="text-[#FFB800] font-mono font-bold">{previewProduct.stock} {previewProduct.unit}</span>
                </div>
                <div>
                  <span className="text-[#B8B8B3] block mb-0.5">Minimal buyurtma:</span>
                  <span className="text-[#F5F5F2] font-mono font-bold">{previewProduct.minOrder || 1} {previewProduct.unit}</span>
                </div>
                {getProductSquareMeters(previewProduct) && (
                  <div>
                    <span className="text-[#B8B8B3] block mb-0.5">Qamrov / Maydon:</span>
                    <span className="text-[#FFB800] font-mono font-bold">{getProductSquareMeters(previewProduct)} m²</span>
                  </div>
                )}
                {previewProduct.colors && previewProduct.colors.length > 0 && (
                  <div>
                    <span className="text-[#B8B8B3] block mb-0.5">Mavjud ranglar:</span>
                    <span className="text-[#F5F5F2] font-bold">{previewProduct.colors.join(', ')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-[#51504A] bg-[#1D2023] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 bg-[#151719] border border-[#51504A] rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setPreviewQuantity((q) => Math.max(previewProduct.minOrder || 1, q - 1))}
                  className="w-8 h-8 rounded bg-[#292C2F] hover:bg-[#34373B] text-[#F5F5F2] flex items-center justify-center font-bold cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="px-3 font-mono font-bold text-[#F5F5F2] text-sm">{previewQuantity}</span>
                <button
                  type="button"
                  onClick={() => setPreviewQuantity((q) => q + 1)}
                  className="w-8 h-8 rounded bg-[#292C2F] hover:bg-[#34373B] text-[#F5F5F2] flex items-center justify-center font-bold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewProduct(null)}
                  className="btn-industrial-dark px-4 py-2 rounded-lg text-xs cursor-pointer"
                >
                  Ortga
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleAdd(previewProduct, previewQuantity);
                    setPreviewProduct(null);
                  }}
                  className="btn-industrial-yellow px-5 py-2 rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Savatga qo'shish</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TO'LIQ TOVARLAR SETKASI (Barcha mahsulotlar kafelari har doim to'liq ko'rinadi)
          ========================================================================= */}
        {/* 7. Product Cards Grid */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-5">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              onClick={() => handleOpenPreview(product)}
              className="industrial-card rounded-xl overflow-hidden flex flex-col group cursor-pointer shadow-sm"
            >
              {/* Image & Badges */}
              <div className="relative h-44 w-full bg-[#151719] overflow-hidden">
                <img
                  src={product.image}
                  alt={product.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#151719] via-transparent to-transparent opacity-80"></div>

                {/* Category Badge */}
                <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start">
                  <span className="bg-[#151719]/90 backdrop-blur text-[#F5F5F2] text-[10px] font-semibold px-2 py-0.5 rounded border border-[#51504A]">
                    {product.category}
                  </span>
                  {product.repairType && product.repairType !== 'universal' && (
                    <span className="bg-[#222528] text-[#FFB800] text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border border-[#51504A]">
                      {product.repairType === 'ichki'
                        ? 'Ichki ta\'mir'
                        : product.repairType === 'tashqi'
                        ? 'Tashqi ta\'mir'
                        : product.repairType === 'ishchi_kuchi'
                        ? 'Ishchi kuchi'
                        : product.repairType === 'asbob_uskunalar'
                        ? 'Asbob-uskunalar'
                        : 'Texnik Ijara'}
                    </span>
                  )}
                </div>

                {/* Supplier and Region info */}
                <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-[10px] text-[#B8B8B3]">
                  <span className="truncate flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#FFB800] shrink-0" />
                    {product.region || product.supplierName}
                  </span>
                  <span className="font-mono text-[#FFB800] shrink-0">
                    {product.stock} {product.unit}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h3 className="font-bold text-[#F5F5F2] text-sm leading-snug line-clamp-2 group-hover:text-[#FFB800] transition-colors">
                    {product.title}
                  </h3>
                  <p className="text-[11px] text-[#B8B8B3] line-clamp-2 mt-1 leading-relaxed">
                    {product.description}
                  </p>
                </div>

                {/* Delivery, Warranty, Specs Badges */}
                {(product.hasDelivery || product.warranty || product.hasBonus || getProductSquareMeters(product)) && (
                  <div className="flex flex-wrap items-center gap-1 pt-1 text-[10px] text-[#B8B8B3]">
                    {getProductSquareMeters(product) && (
                      <span className="px-1.5 py-0.5 rounded bg-[#151719] border border-[#51504A] font-mono text-[#FFB800]">
                        {getProductSquareMeters(product)} m²
                      </span>
                    )}
                    {product.hasDelivery && (
                      <span className="px-1.5 py-0.5 rounded bg-[#151719] border border-[#51504A]">
                        Yetkazib berish
                      </span>
                    )}
                    {product.warranty && (
                      <span className="px-1.5 py-0.5 rounded bg-[#151719] border border-[#51504A]">
                        Kafolat: {product.warranty}
                      </span>
                    )}
                  </div>
                )}

                <div className="pt-2 border-t border-[#51504A] flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-[#B8B8B3]">Narxi ({product.unit} uchun)</div>
                    <div className="text-base font-bold text-[#FFB800] font-mono-numbers">
                      {formatPrice(product.price)}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleOpenPreview(product)}
                      className="p-1.5 rounded-lg bg-[#222528] hover:bg-[#151719] border border-[#51504A] text-[#B8B8B3] hover:text-[#FFB800] transition-colors cursor-pointer"
                      title="Ko'rish"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleAdd(product, 1)}
                      className={`btn-industrial-yellow flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        addedIds[product.id] ? 'bg-[#222528] text-[#FFB800] border-[#FFB800]' : ''
                      }`}
                    >
                      {addedIds[product.id] ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> Qo‘shildi
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" /> Savatga
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

            </div>
          ))}
        </div>

      {/* 6. Empty Product State: Spacious dark results panel with steel texture and thin border */}
      {filteredProducts.length === 0 && (
        <div className="text-center py-16 px-6 bg-[#222528] rounded-xl border border-[#51504A] shadow-md max-w-2xl mx-auto space-y-4 my-8">
          <div className="w-16 h-16 mx-auto rounded-xl bg-[#292C2F] border border-[#51504A] flex items-center justify-center text-[#FFB800]">
            <Package className="w-8 h-8 stroke-[1.8]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-[#F5F5F2]">
              So‘rovingiz bo‘yicha qurilish mollari topilmadi.
            </h3>
            <p className="text-xs text-[#B8B8B3]">
              Qidiruv so‘zini o‘zgartiring yoki filtrlarni qayta o‘rnating.
            </p>
          </div>
          <button
            onClick={handleResetFilters}
            className="btn-industrial-yellow inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs sm:text-sm font-bold cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Filtrlarni tozalash</span>
          </button>
        </div>
      )}

    </div>
  );
};
