import React from 'react';
import { ShoppingCart, User as UserIcon, LogOut, HardHat, Building } from 'lucide-react';
import { UserProfile } from '../types';
import { RealTelegramLogo, RealInstagramLogo } from './SocialLogos';

interface NavbarProps {
  activeTab: 'marketplace' | 'logistics' | 'global_bunker' | 'orders' | 'admin' | 'bunker_admin' | 'supplier' | 'cart_bunker';
  setActiveTab: (tab: any) => void;
  cartCount: number;
  onOpenCart: () => void;
  user: UserProfile | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenLogsModal?: () => void;
  logoUrl?: string | null;
  telegram?: string;
  instagram?: string;
  phone?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  cartCount,
  onOpenCart,
  user,
  onOpenAuth,
  onLogout,
  logoUrl,
  telegram,
  instagram,
}) => {
  const isAdmin = user?.role === 'admin' || user?.role === 'bunker_admin';
  const isSupplier = user?.role === 'supplier';

  const handleLogoClick = () => {
    setActiveTab('marketplace');
  };

  const getUserInitials = (u: UserProfile | null) => {
    if (!u) return 'BS';
    if (u.role === 'admin') return 'BA';
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

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-200/80 shadow-xs text-gray-900 transition-all">
      <div className="w-full px-4 sm:px-6 lg:px-10">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          
          {/* Brand Logo & Social Icons */}
          <div className="flex items-center gap-3 sm:gap-6">
            <div 
              onClick={handleLogoClick}
              className="flex items-center gap-3 cursor-pointer group select-none py-1"
              title="BunkerStroy (Asosiy sahifa)"
            >
              {logoUrl ? (
                <div className="relative p-1 rounded-xl bg-amber-50 border border-amber-200 group-hover:border-amber-400 transition-colors shadow-xs">
                  <img
                    src={logoUrl}
                    alt="BunkerStroy Logo"
                    className="w-8 h-8 sm:w-10 sm:h-10 object-contain rounded-lg"
                  />
                </div>
              ) : (
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-amber-400 text-gray-950 flex items-center justify-center font-black shadow-xs group-hover:scale-105 transition-transform">
                  <HardHat className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.4]" />
                </div>
              )}
              
              <div className="flex flex-col">
                <span className="text-xl sm:text-2xl font-black tracking-tight leading-none text-gray-950">
                  <span className="text-[#FFB800]">BUNKER</span>{' '}
                  <span className="text-gray-900">STROY</span>
                </span>
                <span className="text-[10px] tracking-wider text-gray-500 uppercase font-medium mt-0.5 hidden sm:block">
                  Qurilish mollari bozori va logistika platformasi
                </span>
              </div>
            </div>

            {/* Subtle Divider */}
            <div className="hidden sm:block h-6 w-[1px] bg-gray-200" />

            {/* Telegram & Instagram Icons */}
            <div className="hidden sm:flex items-center gap-1.5">
              {telegram && (
                <a
                  href={telegram.startsWith('http') ? telegram : `https://t.me/${telegram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 border border-gray-200 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                  title="Telegram"
                >
                  <RealTelegramLogo className="w-4.5 h-4.5" />
                </a>
              )}

              {instagram && (
                <a
                  href={instagram.startsWith('http') ? instagram : `https://instagram.com/${instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 border border-gray-200 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                  title="Instagram"
                >
                  <RealInstagramLogo className="w-4.5 h-4.5" />
                </a>
              )}
            </div>
          </div>

          {/* Center Navigation - Uzum Market uslubidagi toza tablar */}
          <nav className="hidden lg:flex items-center gap-2 text-sm font-semibold">
            <button
              onClick={() => setActiveTab('marketplace')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'marketplace'
                  ? 'bg-amber-400 text-gray-950 font-bold shadow-xs'
                  : 'text-gray-600 hover:text-gray-950 hover:bg-gray-100'
              }`}
            >
              Mahsulotlar
            </button>
            <button
              onClick={() => setActiveTab('global_bunker')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'global_bunker'
                  ? 'bg-amber-400 text-gray-950 font-bold shadow-xs'
                  : 'text-gray-600 hover:text-gray-950 hover:bg-gray-100'
              }`}
            >
              B2B Ulgurji
            </button>
            <button
              onClick={() => setActiveTab('logistics')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'logistics'
                  ? 'bg-amber-400 text-gray-950 font-bold shadow-xs'
                  : 'text-gray-600 hover:text-gray-950 hover:bg-gray-100'
              }`}
            >
              Maxsus Texnika
            </button>
            {isSupplier && (
              <button
                onClick={() => setActiveTab('supplier')}
                className="px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm font-bold flex items-center gap-1.5 hover:bg-blue-100 transition-all cursor-pointer"
              >
                <Building className="w-4 h-4" />
                <span>Ta'minotchi</span>
              </button>
            )}
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">

            {/* Shopping Cart Button */}
            <button
              onClick={onOpenCart}
              className={`relative px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 group border ${
                cartCount > 0
                  ? 'bg-amber-50 border-amber-300 text-gray-950 shadow-xs'
                  : 'bg-gray-100 hover:bg-gray-200/80 border-gray-200 text-gray-800'
              }`}
              aria-label="Savat"
              title="Savat"
            >
              <ShoppingCart className={`w-5 h-5 transition-transform group-hover:scale-105 ${cartCount > 0 ? 'text-[#FFB800]' : 'text-gray-700'}`} />
              <span className="text-xs font-bold hidden sm:inline text-gray-900">
                Savat
              </span>
              {cartCount > 0 && (
                <span className="bg-[#FFB800] text-gray-950 text-[11px] font-black px-1.5 py-0.5 rounded-full min-w-[20px] text-center shadow-xs">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Auth / Profile Button */}
            {user && !isAdmin ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (isSupplier) {
                      setActiveTab('supplier');
                    } else {
                      setActiveTab('orders');
                    }
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    (isSupplier && activeTab === 'supplier') ||
                    (!isSupplier && activeTab === 'orders')
                      ? 'bg-amber-400 text-gray-950 font-bold border-amber-500'
                      : 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200'
                  }`}
                  title={isSupplier ? "Ta'minotchi Kabineti" : "Mijoz Kabineti"}
                >
                  <div className="w-5 h-5 rounded-full bg-amber-400 text-gray-950 font-bold flex items-center justify-center text-[10px]">
                    {getUserInitials(user)}
                  </div>
                  <span className="max-w-[120px] truncate hidden sm:inline">
                    {isSupplier ? (user.companyName || 'Ta\'minotchi') : (user.firstName || user.displayName || 'Kabinet')}
                  </span>
                </button>
                <button
                  onClick={onLogout}
                  title="Kabinetdan chiqish"
                  className="p-2 rounded-xl bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 border border-gray-200 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="btn-bunker-yellow flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-xs cursor-pointer whitespace-nowrap"
              >
                <UserIcon className="w-4 h-4 stroke-[2.5]" />
                <span>Kabinetga Kirish</span>
              </button>
            )}

          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex lg:hidden border-t border-gray-200/80 py-2 overflow-x-auto gap-2 scrollbar-none text-xs">
          <button
            onClick={() => setActiveTab('marketplace')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'marketplace' ? 'bg-amber-400 text-gray-950 font-bold' : 'text-gray-700 bg-gray-100'
            }`}
          >
            Mahsulotlar
          </button>
          <button
            onClick={() => setActiveTab('global_bunker')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'global_bunker' ? 'bg-amber-400 text-gray-950 font-bold' : 'text-gray-700 bg-gray-100'
            }`}
          >
            B2B Ulgurji
          </button>
          <button
            onClick={() => setActiveTab('logistics')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'logistics' ? 'bg-amber-400 text-gray-950 font-bold' : 'text-gray-700 bg-gray-100'
            }`}
          >
            Maxsus Texnika
          </button>
        </div>

      </div>
    </header>
  );
};
