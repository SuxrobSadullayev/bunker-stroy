import React, { useState } from 'react';
import { 
  TrendingUp, 
  ArrowUpRight, 
  Wallet, 
  Package, 
  Truck, 
  Globe, 
  ShieldCheck, 
  ChevronRight, 
  BarChart3, 
  Layers, 
  MapPin, 
  Calendar, 
  ArrowRight,
  HardHat,
  Phone,
  Mail,
  Building2,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  RefreshCw,
  ShoppingCart
} from 'lucide-react';

interface BunkerStatsDashboardProps {
  onNavigateToCatalog: () => void;
  onNavigateToLogistics: () => void;
  onNavigateToGlobal: () => void;
  onNavigateToAdmin?: () => void;
  onOpenCart?: () => void;
  onOpenAuth?: () => void;
  cartCount?: number;
}

type PeriodFilter = 'all' | 'today' | 'week' | 'month';

export const BunkerStatsDashboard: React.FC<BunkerStatsDashboardProps> = ({
  onNavigateToCatalog,
  onNavigateToLogistics,
  onNavigateToGlobal,
  onNavigateToAdmin,
  onOpenCart,
  onOpenAuth,
  cartCount = 0,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>('all');
  const [activeBarHover, setActiveBarHover] = useState<number | null>(null);

  // Period-adjusted values (exact numbers based on the user's specification for all-time, with logical proportions for other periods)
  const getStatsByPeriod = () => {
    switch (selectedPeriod) {
      case 'today':
        return {
          totalTurnover: '58,400,000 so‘m',
          turnoverGrowth: '+4.2% kechagidan',
          netProfit: '12,848,000 so‘m',
          profitMargin: '22.0%',
          income: '16,350,000 so‘m',
          stockTons: '4,840 tonna',
          stockPositions: '12 xil tovar pozitsiyasi',
          heavyFleet: '4 ta Og‘ir Texnika',
          completedTrips: '8 ta yakunlangan reys',
          globalFactories: '5 Xalqaro Zavod',
          globalContract: '136,200 t/yil shartnoma',
          returnedCount: '0 ta (0%)',
          returnedCert: 'Laboratoriya tekshiruvi: 100% sertifikatlangan',
        };
      case 'week':
        return {
          totalTurnover: '342,000,000 so‘m',
          turnoverGrowth: '+12.6% o‘tgan haftadan',
          netProfit: '75,240,000 so‘m',
          profitMargin: '22.0%',
          income: '95,760,000 so‘m',
          stockTons: '4,840 tonna',
          stockPositions: '12 xil tovar pozitsiyasi',
          heavyFleet: '4 ta Og‘ir Texnika',
          completedTrips: '34 ta yakunlangan reys',
          globalFactories: '5 Xalqaro Zavod',
          globalContract: '136,200 t/yil shartnoma',
          returnedCount: '0 ta (0%)',
          returnedCert: 'Laboratoriya tekshiruvi: 100% sertifikatlangan',
        };
      case 'month':
        return {
          totalTurnover: '1,485,000,000 so‘m',
          turnoverGrowth: '+18.4% o‘sish sur‘ati o‘tgan oydan',
          netProfit: '326,700,000 so‘m',
          profitMargin: '22.0%',
          income: '415,800,000 so‘m',
          stockTons: '4,840 tonna',
          stockPositions: '12 xil tovar pozitsiyasi',
          heavyFleet: '4 ta Og‘ir Texnika',
          completedTrips: '146 ta yakunlangan reys',
          globalFactories: '5 Xalqaro Zavod',
          globalContract: '136,200 t/yil shartnoma',
          returnedCount: '0 ta (0%)',
          returnedCert: 'Laboratoriya tekshiruvi: 100% sertifikatlangan',
        };
      case 'all':
      default:
        return {
          totalTurnover: '1,485,000,000 so‘m',
          turnoverGrowth: '+18.4% o‘sish sur‘ati o‘tgan oydan',
          netProfit: '326,700,000 so‘m',
          profitMargin: '22.0%',
          income: '415,800,000 so‘m',
          stockTons: '4,840 tonna',
          stockPositions: '12 xil tovar pozitsiyasi',
          heavyFleet: '4 ta Og‘ir Texnika',
          completedTrips: '146 ta yakunlangan reys',
          globalFactories: '5 Xalqaro Zavod',
          globalContract: '136,200 t/yil shartnoma',
          returnedCount: '0 ta (0%)',
          returnedCert: 'Laboratoriya tekshiruvi: 100% sertifikatlangan',
        };
    }
  };

  const stats = getStatsByPeriod();

  // Monthly turnover dynamic data
  const monthlyData = [
    { month: 'Yan', val: 120, display: '120m', full: '120,000,000 so‘m', pct: 40 },
    { month: 'Fev', val: 145, display: '145m', full: '145,000,000 so‘m', pct: 49 },
    { month: 'Mar', val: 190, display: '190m', full: '190,000,000 so‘m', pct: 64 },
    { month: 'Apr', val: 230, display: '230m', full: '230,000,000 so‘m', pct: 78 },
    { month: 'May', val: 260, display: '260m', full: '260,000,000 so‘m', pct: 88 },
    { month: 'Iyun', val: 295, display: '295m', full: '295,000,000 so‘m', pct: 100 },
  ];

  // Warehouse Category Stock Distribution
  const warehouseCategories = [
    {
      name: 'Sement & Quruq qorishmalar (M400, M500)',
      amount: '2,450 tonna',
      percentage: '42%',
      color: 'bg-[#FFB800]',
      trackColor: 'bg-[#FFB800]/20',
      badge: 'Bunker Ombori #1',
    },
    {
      name: 'Metall prokati & Armatura (A500C, Katanka)',
      amount: '1,120 tonna',
      percentage: '28%',
      color: 'bg-blue-500',
      trackColor: 'bg-blue-500/20',
      badge: 'Og‘ir Prokat',
    },
    {
      name: 'Devorbop bloklar & G‘isht (Gazoblok, Pishiq)',
      amount: '850 m³',
      percentage: '18%',
      color: 'bg-emerald-500',
      trackColor: 'bg-emerald-500/20',
      badge: 'Konstruktiv Bloklar',
    },
    {
      name: 'Issiqlik & Gidroizolyatsiya materiallari',
      amount: '420 m³',
      percentage: '12%',
      color: 'bg-rose-500',
      trackColor: 'bg-rose-500/20',
      badge: 'TechnoNIKOL / Penoplast',
    },
  ];

  // Logistics Fleet Trips
  const fleetTrips = [
    {
      name: 'Samosval KAMAZ (20t)',
      status: '100% Shay',
      trips: '48 ta muvaffaqiyatli reys',
      volume: '960 tonna',
      icon: '🚛',
    },
    {
      name: 'Beton Mikser HOWO (10m³)',
      status: '100% Shay',
      trips: '35 ta muvaffaqiyatli reys',
      volume: '350 m³',
      icon: '🚚',
    },
    {
      name: 'Kran-Manipulyator ISUZU',
      status: '100% Shay',
      trips: '22 ta muvaffaqiyatli reys',
      volume: '110 tonna',
      icon: '🏗️',
    },
    {
      name: 'Gazel Next Bortli (2.5t)',
      status: '100% Shay',
      trips: '41 ta muvaffaqiyatli reys',
      volume: '85 tonna',
      icon: '🚐',
    },
  ];

  // Regional Demands
  const regionalDemands = [
    { region: 'Toshkent shahri', orders: '154 buyurtma', share: '48%', color: 'bg-[#FFB800]' },
    { region: 'Toshkent viloyati', orders: '76 buyurtma', share: '24%', color: 'bg-blue-500' },
    { region: 'Samarqand viloyati', orders: '38 buyurtma', share: '12%', color: 'bg-emerald-500' },
    { region: 'Farg‘ona vodiysi', orders: '31 buyurtma', share: '10%', color: 'bg-amber-400' },
    { region: 'Boshqa viloyatlar', orders: '19 buyurtma', share: '6%', color: 'bg-slate-400' },
  ];

  return (
    <div className="w-full space-y-8 animate-fadeIn text-[#F5F5F2]">
      
      {/* =========================================================================
          TOP BREADCRUMBS & LIVE HEADER (BUNKER ASOSIY BOSHQARUV PANELI · JONLI REJIM)
          ========================================================================= */}
      <div className="bg-[#222528] border border-[#51504A] rounded-2xl p-5 sm:p-7 shadow-2xl relative overflow-hidden">
        {/* Subtle Hazard Top Hairline */}
        <div className="absolute top-0 left-0 right-0 h-1.5 hazard-stripe-sm opacity-90" />
        
        {/* Industrial Rivets */}
        <div className="absolute top-3 left-3 industrial-rivet" />
        <div className="absolute top-3 right-3 industrial-rivet" />
        <div className="absolute bottom-3 left-3 industrial-rivet" />
        <div className="absolute bottom-3 right-3 industrial-rivet" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono tracking-wider text-[#FFB800] uppercase font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping inline-block" />
              <span>BUNKER ASOSIY BOSHQARUV PANELI · JONLI REJIM</span>
              <span className="text-[#51504A]">|</span>
              <span className="text-[#B8B8B3]">TOSHKENT KLINIK KLASTERI</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#F5F5F2] tracking-tight">
              Bunker Statistikasi & Operatsion Tahlil
            </h1>
            
            <p className="text-xs sm:text-sm text-[#B8B8B3] max-w-3xl leading-relaxed">
              BunkerStroy sanoat klasteri bo‘yicha real-vaqt aylanmasi, ombor qoldiqlari, og‘ir yuk logistikasi va xalqaro import dinamikasi monitoringi.
            </p>
          </div>

          {/* Quick period filters */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-[#151719] border border-[#51504A] shrink-0">
            <button
              type="button"
              onClick={() => setSelectedPeriod('all')}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedPeriod === 'all'
                  ? 'bg-[#FFB800] text-[#151719] font-black shadow-md'
                  : 'text-[#B8B8B3] hover:text-[#F5F5F2]'
              }`}
            >
              Barcha davr
            </button>
            <button
              type="button"
              onClick={() => setSelectedPeriod('today')}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedPeriod === 'today'
                  ? 'bg-[#FFB800] text-[#151719] font-black shadow-md'
                  : 'text-[#B8B8B3] hover:text-[#F5F5F2]'
              }`}
            >
              Bugun
            </button>
            <button
              type="button"
              onClick={() => setSelectedPeriod('week')}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedPeriod === 'week'
                  ? 'bg-[#FFB800] text-[#151719] font-black shadow-md'
                  : 'text-[#B8B8B3] hover:text-[#F5F5F2]'
              }`}
            >
              Ushbu hafta
            </button>
            <button
              type="button"
              onClick={() => setSelectedPeriod('month')}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedPeriod === 'month'
                  ? 'bg-[#FFB800] text-[#151719] font-black shadow-md'
                  : 'text-[#B8B8B3] hover:text-[#F5F5F2]'
              }`}
            >
              Ushbu oy
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          6 ASOSIY OPERATSION KO'RSATKICHLAR (KPI CARDS)
          ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        
        {/* Card 1: Jami Aylanma */}
        <div className="bg-[#222528] border border-[#51504A] hover:border-[#FFB800] rounded-xl p-5 sm:p-6 shadow-xl transition-all relative overflow-hidden group">
          <div className="flex items-center justify-between pb-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#B8B8B3]">
              Jami Aylanma
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#FFB800]/10 border border-[#FFB800]/30 text-[#FFB800] flex items-center justify-center">
              <TrendingUp className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#F5F5F2] font-mono tracking-tight">
            {stats.totalTurnover}
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-xs font-bold text-emerald-400">
            <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
            <span>{stats.turnoverGrowth}</span>
          </div>
        </div>

        {/* Card 2: Sof Foyda / Rentabellik */}
        <div className="bg-[#222528] border border-[#51504A] hover:border-[#FFB800] rounded-xl p-5 sm:p-6 shadow-xl transition-all relative overflow-hidden group">
          <div className="flex items-center justify-between pb-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#B8B8B3]">
              Sof Foyda / Rentabellik
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <Wallet className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono tracking-tight">
            {stats.netProfit}
          </div>
          <div className="mt-2.5 text-xs text-[#B8B8B3] font-medium flex items-center gap-2">
            <span className="text-[#FFB800] font-bold">Rentabellik: {stats.profitMargin}</span>
            <span className="text-[#51504A]">·</span>
            <span>Kirim: {stats.income}</span>
          </div>
        </div>

        {/* Card 3: Bunker Mahsulot Qoldig'i */}
        <div className="bg-[#222528] border border-[#51504A] hover:border-[#FFB800] rounded-xl p-5 sm:p-6 shadow-xl transition-all relative overflow-hidden group">
          <div className="flex items-center justify-between pb-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#B8B8B3]">
              Bunker Mahsulot Qoldig'i
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center">
              <Package className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#F5F5F2] font-mono tracking-tight">
            {stats.stockTons}
          </div>
          <div className="mt-2.5 flex items-center justify-between text-xs">
            <span className="text-[#B8B8B3]">{stats.stockPositions}</span>
            <button
              type="button"
              onClick={onNavigateToCatalog}
              className="text-[#FFB800] hover:text-[#FFC928] font-bold flex items-center gap-1 cursor-pointer hover:underline"
            >
              <span>Katalogga o'tish →</span>
            </button>
          </div>
        </div>

        {/* Card 4: Logistika & Avtopark */}
        <div className="bg-[#222528] border border-[#51504A] hover:border-[#FFB800] rounded-xl p-5 sm:p-6 shadow-xl transition-all relative overflow-hidden group">
          <div className="flex items-center justify-between pb-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#B8B8B3]">
              Logistika & Avtopark
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <Truck className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#F5F5F2] font-mono tracking-tight">
            {stats.heavyFleet}
          </div>
          <div className="mt-2.5 flex items-center justify-between text-xs">
            <span className="text-[#B8B8B3]">{stats.completedTrips}</span>
            <button
              type="button"
              onClick={onNavigateToLogistics}
              className="text-[#FFB800] hover:text-[#FFC928] font-bold flex items-center gap-1 cursor-pointer hover:underline"
            >
              <span>Logistikaga o'tish →</span>
            </button>
          </div>
        </div>

        {/* Card 5: Global Bunker Import */}
        <div className="bg-[#222528] border border-[#51504A] hover:border-[#FFB800] rounded-xl p-5 sm:p-6 shadow-xl transition-all relative overflow-hidden group">
          <div className="flex items-center justify-between pb-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#B8B8B3]">
              Global Bunker Import
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
              <Globe className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#F5F5F2] font-mono tracking-tight">
            {stats.globalFactories}
          </div>
          <div className="mt-2.5 flex items-center justify-between text-xs">
            <span className="text-[#B8B8B3]">{stats.globalContract}</span>
            <button
              type="button"
              onClick={onNavigateToGlobal}
              className="text-[#FFB800] hover:text-[#FFC928] font-bold flex items-center gap-1 cursor-pointer hover:underline"
            >
              <span>Globalga o'tish →</span>
            </button>
          </div>
        </div>

        {/* Card 6: Qaytarilgan Tovarlar */}
        <div className="bg-[#222528] border border-[#51504A] hover:border-[#FFB800] rounded-xl p-5 sm:p-6 shadow-xl transition-all relative overflow-hidden group">
          <div className="flex items-center justify-between pb-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#B8B8B3]">
              Qaytarilgan Tovarlar
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono tracking-tight">
            {stats.returnedCount}
          </div>
          <div className="mt-2.5 text-xs text-emerald-300 font-medium">
            {stats.returnedCert}
          </div>
        </div>

      </div>

      {/* =========================================================================
          OYLIK AYLANMA DINAMIKASI GRAFIGI (MLRD SO'M)
          ========================================================================= */}
      <div className="bg-[#222528] border border-[#51504A] rounded-2xl p-6 sm:p-7 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-[#51504A]">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-[#F5F5F2] flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#FFB800]" />
              <span>Bunker Oylik Aylanma Dinamikasi (mlrd so'm)</span>
            </h2>
            <p className="text-xs text-[#B8B8B3] mt-0.5">
              So'nggi 6 oy bo'yicha savdo va yuk jo'natmalari hajmi
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-lg bg-[#FFB800]/15 text-[#FFB800] border border-[#FFB800]/30 text-xs font-mono font-black">
              Jami: 1.48 Mlrd
            </span>
            <span className="text-xs font-bold text-emerald-400 font-mono hidden sm:inline">
              O'rtacha oylik o'sish: +16.2%
            </span>
          </div>
        </div>

        {/* Dynamic Industrial Bar Chart */}
        <div className="pt-6 pb-2">
          <div className="h-64 sm:h-72 w-full flex items-end justify-between gap-3 sm:gap-6 px-2 sm:px-6 relative">
            
            {/* Background grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-15">
              <div className="border-b border-[#51504A] w-full" />
              <div className="border-b border-[#51504A] w-full" />
              <div className="border-b border-[#51504A] w-full" />
              <div className="border-b border-[#51504A] w-full" />
            </div>

            {monthlyData.map((item, idx) => {
              const isHovered = activeBarHover === idx;
              return (
                <div
                  key={item.month}
                  className="flex-1 flex flex-col items-center h-full justify-end relative group cursor-pointer"
                  onMouseEnter={() => setActiveBarHover(idx)}
                  onMouseLeave={() => setActiveBarHover(null)}
                >
                  {/* Tooltip on hover */}
                  <div className={`absolute -top-12 z-20 px-2.5 py-1.5 rounded-lg bg-[#151719] border border-[#FFB800] text-center pointer-events-none transition-all duration-200 ${
                    isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                  }`}>
                    <div className="text-[10px] text-[#B8B8B3] uppercase font-mono">{item.month} oylik hajmi</div>
                    <div className="text-xs font-black text-[#FFB800] font-mono">{item.full}</div>
                  </div>

                  {/* Top value badge */}
                  <span className={`text-[11px] sm:text-xs font-mono font-black mb-2 transition-colors ${
                    isHovered ? 'text-[#FFB800]' : 'text-[#F5F5F2]'
                  }`}>
                    {item.display}
                  </span>

                  {/* The bar */}
                  <div className="w-full max-w-[54px] bg-[#151719] rounded-t-lg border border-[#51504A] overflow-hidden p-0.5 group-hover:border-[#FFB800] transition-all">
                    <div
                      className={`w-full rounded-t transition-all duration-700 ease-out ${
                        isHovered
                          ? 'bg-[#FFC928]'
                          : idx === monthlyData.length - 1
                          ? 'bg-[#FFB800]'
                          : 'bg-[#FFB800]/80 group-hover:bg-[#FFB800]'
                      }`}
                      style={{ height: `${item.pct * 2.1}px` }}
                    />
                  </div>

                  {/* Month Label */}
                  <span className={`mt-3 text-xs font-mono uppercase font-bold transition-colors ${
                    isHovered ? 'text-[#FFB800]' : 'text-[#B8B8B3]'
                  }`}>
                    {item.month}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-[#51504A] flex flex-wrap items-center justify-between text-xs text-[#B8B8B3] font-mono">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-[#FFB800] inline-block" />
              <span>Oylik aylanma</span>
            </div>
            <div className="text-emerald-400 font-bold">
              O'rtacha oylik o'sish: +16.2%
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          QURILISH MOLLARI TOIFALARI VA LOGISTIKA FLOTI REYSLARI (2 USTUNLI)
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Kolonka 1: Qurilish Mollari Toifalari Taqsimoti (Bunker Ombori) */}
        <div className="bg-[#222528] border border-[#51504A] rounded-2xl p-6 shadow-2xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#51504A]">
            <div>
              <h3 className="text-base sm:text-lg font-black text-[#F5F5F2] flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#FFB800]" />
                <span>Qurilish Mollari Toifalari Taqsimoti</span>
              </h3>
              <p className="text-xs text-[#B8B8B3]">Bunker Ombori umumiy zaxira balansi</p>
            </div>
            <span className="text-xs font-mono font-bold text-[#FFB800] px-2 py-0.5 rounded bg-[#FFB800]/10 border border-[#FFB800]/30">
              Bunker Ombori
            </span>
          </div>

          <div className="space-y-4">
            {warehouseCategories.map((cat) => (
              <div key={cat.name} className="space-y-1.5 p-3 rounded-xl bg-[#151719] border border-[#51504A] hover:border-[#FFB800]/40 transition-colors">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#F5F5F2] max-w-[260px] truncate sm:max-w-none">
                    {cat.name}
                  </span>
                  <div className="font-mono font-black text-right shrink-0">
                    <span className="text-[#F5F5F2]">{cat.amount}</span>
                    <span className="text-[#FFB800] ml-1">({cat.percentage})</span>
                  </div>
                </div>

                <div className="w-full h-2 rounded-full bg-[#292C2F] overflow-hidden">
                  <div
                    className={`h-full ${cat.color} rounded-full transition-all duration-700`}
                    style={{ width: cat.percentage }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Kolonka 2: Logistika Floti Reyslari */}
        <div className="bg-[#222528] border border-[#51504A] rounded-2xl p-6 shadow-2xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#51504A]">
            <div>
              <h3 className="text-base sm:text-lg font-black text-[#F5F5F2] flex items-center gap-2">
                <Truck className="w-5 h-5 text-[#FFB800]" />
                <span>Logistika Floti Reyslari</span>
              </h3>
              <p className="text-xs text-[#B8B8B3]">Og‘ir texnikalar harakati va yuk tashish unumdorligi</p>
            </div>
            <button
              type="button"
              onClick={onNavigateToLogistics}
              className="text-xs font-mono font-bold text-[#FFB800] hover:text-[#FFC928] flex items-center gap-1 cursor-pointer hover:underline"
            >
              <span>Barchasi →</span>
            </button>
          </div>

          <div className="space-y-3">
            {fleetTrips.map((trip) => (
              <div 
                key={trip.name}
                className="p-3.5 rounded-xl bg-[#151719] border border-[#51504A] hover:border-[#FFB800]/50 transition-colors flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{trip.icon}</span>
                  <div>
                    <h4 className="font-black text-xs sm:text-sm text-[#F5F5F2]">
                      {trip.name}
                    </h4>
                    <div className="text-[11px] text-[#B8B8B3] flex items-center gap-2 mt-0.5">
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        {trip.status}
                      </span>
                      <span>·</span>
                      <span>{trip.trips}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs sm:text-sm font-mono font-black text-[#FFB800] bg-[#FFB800]/10 px-2 py-1 rounded-lg border border-[#FFB800]/30 block">
                    {trip.volume}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* =========================================================================
          HUDUDLAR BO'YICHA TALAB (O'ZBEKISTON)
          ========================================================================= */}
      <div className="bg-[#222528] border border-[#51504A] rounded-2xl p-6 sm:p-7 shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#51504A]">
          <div>
            <h3 className="text-base sm:text-lg font-black text-[#F5F5F2] flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#FFB800]" />
              <span>Hududlar bo'yicha Talab</span>
            </h3>
            <p className="text-xs text-[#B8B8B3]">Yetkazib berilgan va amaldagi qurilish obyektlari taqsimoti</p>
          </div>
          <span className="text-xs font-mono font-bold text-[#FFB800] px-2.5 py-1 rounded-lg bg-[#151719] border border-[#51504A]">
            O'zbekiston
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {regionalDemands.map((reg) => (
            <div
              key={reg.region}
              className="p-4 rounded-xl bg-[#151719] border border-[#51504A] hover:border-[#FFB800]/50 transition-colors space-y-2 text-center sm:text-left"
            >
              <div className="flex items-center justify-between text-xs font-bold text-[#F5F5F2]">
                <span className="truncate">{reg.region}</span>
                <span className="text-[#FFB800] font-mono font-black">{reg.share}</span>
              </div>
              <div className="text-sm font-black font-mono text-[#F5F5F2]">
                {reg.orders}
              </div>
              <div className="w-full h-1.5 rounded-full bg-[#292C2F] overflow-hidden">
                <div
                  className={`h-full ${reg.color} rounded-full`}
                  style={{ width: reg.share }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* =========================================================================
          BUNKER ASOSIY BO'LIMLARIGA TEZKOR O'TISH
          ========================================================================= */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center gap-2 text-sm font-mono font-bold uppercase tracking-wider text-[#FFB800]">
          <Sparkles className="w-4 h-4 text-[#FFB800]" />
          <span>BUNKER ASOSIY BO'LIMLARIGA TEZKOR O'TISH</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          {/* Card 1: Bunker — Qurilish Mollari */}
          <div className="bg-[#222528] border border-[#51504A] hover:border-[#FFB800] rounded-2xl p-6 shadow-2xl flex flex-col justify-between transition-all group">
            <div className="space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#151719] border border-[#51504A] group-hover:border-[#FFB800] flex items-center justify-center text-[#FFB800]">
                <Package className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-black text-[#F5F5F2] group-hover:text-[#FFB800] transition-colors">
                Bunker — Qurilish Mollari
              </h3>
              <p className="text-xs text-[#B8B8B3] leading-relaxed">
                M400 / M500 Sement, A500C Armatura, gazoblok, g'isht va quruq qurilish qorishmalari katalogi.
              </p>
            </div>

            <div className="pt-5">
              <button
                type="button"
                onClick={onNavigateToCatalog}
                className="btn-industrial-yellow w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md group-hover:scale-102 transition-transform"
              >
                <span>Bo'limni ochish</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Card 2: Logistika — Og'ir Texnika Floti */}
          <div className="bg-[#222528] border border-[#51504A] hover:border-[#FFB800] rounded-2xl p-6 shadow-2xl flex flex-col justify-between transition-all group">
            <div className="space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#151719] border border-[#51504A] group-hover:border-[#FFB800] flex items-center justify-center text-[#FFB800]">
                <Truck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-black text-[#F5F5F2] group-hover:text-[#FFB800] transition-colors">
                Logistika — Og'ir Texnika Floti
              </h3>
              <p className="text-xs text-[#B8B8B3] leading-relaxed">
                Samosvallar, avtokran-manipulyatorlar, HOWO mikserlar va tezkor avtotransport kalkulyatori.
              </p>
            </div>

            <div className="pt-5">
              <button
                type="button"
                onClick={onNavigateToLogistics}
                className="btn-industrial-yellow w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md group-hover:scale-102 transition-transform"
              >
                <span>Bo'limni ochish</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Card 3: Global Bunker — Xalqaro Klaster */}
          <div className="bg-[#222528] border border-[#51504A] hover:border-[#FFB800] rounded-2xl p-6 shadow-2xl flex flex-col justify-between transition-all group">
            <div className="space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#151719] border border-[#51504A] group-hover:border-[#FFB800] flex items-center justify-center text-[#FFB800]">
                <Globe className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-black text-[#F5F5F2] group-hover:text-[#FFB800] transition-colors">
                Global Bunker — Xalqaro Klaster
              </h3>
              <p className="text-xs text-[#B8B8B3] leading-relaxed">
                Qozog'iston, Rossiya, Turkiya va Xitoy yirik sanoat ishlab chiqaruvchilari bilan to'g'ridan-to'g'ri import.
              </p>
            </div>

            <div className="pt-5">
              <button
                type="button"
                onClick={onNavigateToGlobal}
                className="btn-industrial-yellow w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md group-hover:scale-102 transition-transform"
              >
                <span>Bo'limni ochish</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* =========================================================================
          FOOTER: ADMIN KABINETI UCHUN TALAB QILINGAN KENGAYTIRILGAN MAZMUN
          ========================================================================= */}
      <footer className="mt-12 pt-10 border-t border-[#51504A] bg-[#1a1c1e] -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pb-10 space-y-8 rounded-b-2xl">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Col 1: Brand & Desc */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#222528] border border-[#51504A] text-[#FFB800] flex items-center justify-center">
                <HardHat className="w-4 h-4" />
              </div>
              <span className="text-xl font-black tracking-wider">
                <span className="text-[#FFB800]">BUNKER</span> <span className="text-[#F5F5F2]">STROY</span>
              </span>
            </div>
            <p className="text-xs text-[#B8B8B3] leading-relaxed">
              O‘zbekistonda qurilish mollari savdosi, maxsus og‘ir texnika logistikasi va xalqaro import xomashyo ta’minotini birlashtiruvchi sanoat platformasi.
            </p>
          </div>

          {/* Col 2: Asosiy Bo'limlar */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#FFB800]">
              Asosiy Bo'limlar
            </h4>
            <ul className="space-y-2 text-xs text-[#B8B8B3]">
              <li>
                <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-[#FFB800] transition-colors cursor-pointer text-left">
                  Bunker Statistikasi (Asosiy)
                </button>
              </li>
              <li>
                <button type="button" onClick={onNavigateToCatalog} className="hover:text-[#FFB800] transition-colors cursor-pointer text-left">
                  Bunker — Qurilish Mollari
                </button>
              </li>
              <li>
                <button type="button" onClick={onNavigateToLogistics} className="hover:text-[#FFB800] transition-colors cursor-pointer text-left">
                  Logistika — Og'ir Texnika Floti
                </button>
              </li>
              <li>
                <button type="button" onClick={onNavigateToGlobal} className="hover:text-[#FFB800] transition-colors cursor-pointer text-left">
                  Global Bunker — Xalqaro Import
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Sertifikatlar */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#FFB800]">
              Sertifikatlar
            </h4>
            <ul className="space-y-2 text-xs text-[#B8B8B3]">
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>M500 / A500C Laboratoriya Kafolati</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#FFB800] shrink-0" />
                <span>Samosval & Manipulyatorlar 100% Shay</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>Xalqaro Zavod Shartnomalari</span>
              </li>
            </ul>
          </div>

          {/* Col 4: Aloqa & Boshqaruv */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#FFB800]">
              Aloqa & Boshqaruv
            </h4>
            <div className="space-y-2 text-xs text-[#B8B8B3]">
              <p className="flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#FFB800] shrink-0 mt-0.5" />
                <span>Toshkent sh., Sergeli tumani, Qurilish klasteri</span>
              </p>
              <p className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#FFB800] shrink-0" />
                <a href="tel:+998712000050" className="hover:text-[#F5F5F2] font-mono">
                  +998 (71) 200-00-50
                </a>
              </p>
              <p className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#FFB800] shrink-0" />
                <a href="mailto:info@bunkerstroy.uz" className="hover:text-[#F5F5F2] font-mono">
                  info@bunkerstroy.uz
                </a>
              </p>

              {onNavigateToAdmin && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={onNavigateToAdmin}
                    className="w-full py-2 px-3 rounded-lg bg-[#222528] hover:bg-[#292C2F] text-[#FFB800] border border-[#FFB800]/50 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <HardHat className="w-3.5 h-3.5" />
                    <span>Admin Kabinetiga O'tish</span>
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>

        <div className="pt-6 border-t border-[#51504A] text-center text-xs text-[#B8B8B3] flex flex-col sm:flex-row items-center justify-between gap-3 font-mono">
          <span>© 2026 BunkerStroy. Sanoat Qurilish & Logistika Platformasi.</span>
          <span className="text-[#FFB800] font-bold">TOSHKENT · UZBEKISTAN</span>
        </div>
      </footer>

    </div>
  );
};
