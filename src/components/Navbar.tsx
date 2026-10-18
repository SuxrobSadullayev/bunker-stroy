import React, { useRef } from 'react';
import { ShoppingCart, User as UserIcon, LogOut, HardHat, ShieldAlert, Building, Lock } from 'lucide-react';
import { UserProfile } from '../types';
import { RealTelegramLogo, RealInstagramLogo } from './SocialLogos';

interface NavbarProps {
  activeTab: 'marketplace' | 'logistics' | 'global_bunker' | 'orders' | 'admin' | 'supplier' | 'cart_bunker';
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
  onOpenLogsModal,
  logoUrl,
  telegram,
  instagram,
}) => {
  const isAdmin = user?.role === 'admin';
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
    <header className="sticky top-0 z-50 w-full brushed-steel-header text-[#F5F5F2]">
      {/* Top subtle hazard hairline accent */}
      <div className="h-[2px] w-full hazard-stripe-sm opacity-80" />

      <div className="w-full px-4 sm:px-6 lg:px-10">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Brand Logo & Social Icons */}
          <div className="flex items-center gap-4 sm:gap-6">
            <div 
              onClick={handleLogoClick}
              className="flex items-center gap-3 cursor-pointer group select-none py-1"
              title="BunkerStroy (Asosiy sahifa)"
            >
              {logoUrl ? (
                <div className="relative p-1 rounded-lg bg-[#222528] border border-[#51504A] group-hover:border-[#FFB800] transition-colors">
                  <div className="absolute top-0.5 left-0.5 industrial-rivet" />
                  <div className="absolute top-0.5 right-0.5 industrial-rivet" />
                  <img
                    src={logoUrl}
                    alt="BunkerStroy Logo"
                    className="w-8 h-8 sm:w-10 sm:h-10 object-contain rounded"
                  />
                </div>
              ) : (
                <div className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-lg bg-[#222528] border border-[#51504A] group-hover:border-[#FFB800] flex items-center justify-center transition-all shadow-md">
                  <div className="absolute top-1 left-1 industrial-rivet" />
                  <div className="absolute top-1 right-1 industrial-rivet" />
                  <HardHat className="w-5 h-5 sm:w-6 sm:h-6 text-[#FFB800] stroke-[2.2]" />
                </div>
              )}
              
              <div className="flex flex-col">
                <span className="text-xl sm:text-2xl font-black tracking-wider leading-none">
                  <span className="text-[#FFB800]">BUNKER</span>{' '}
                  <span className="text-[#F5F5F2]">STROY</span>
                </span>
                <span className="text-[10px] tracking-widest text-[#B8B8B3] uppercase font-mono mt-0.5 hidden sm:block">
                  Ichki va tashqi qurilish mahsulotlari markazi B2B
                </span>
              </div>
            </div>

            {/* Subtle Divider */}
            <div className="hidden sm:block h-6 w-[1px] bg-[#51504A]" />

            {/* Telegram & Instagram Icons */}
            <div className="hidden sm:flex items-center gap-2">
              {telegram && (
                <a
                  href={telegram.startsWith('http') ? telegram : `https://t.me/${telegram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg bg-[#222528] border border-[#51504A] hover:border-[#FFB800] flex items-center justify-center text-[#B8B8B3] hover:text-[#FFB800] transition-all hover:scale-105 active:scale-95"
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
                  className="w-8 h-8 rounded-lg bg-[#222528] border border-[#51504A] hover:border-[#FFB800] flex items-center justify-center text-[#B8B8B3] hover:text-[#FFB800] transition-all hover:scale-105 active:scale-95"
                  title="Instagram"
                >
                  <RealInstagramLogo className="w-4.5 h-4.5" />
                </a>
              )}
            </div>
          </div>

          {/* Center Navigation - Clean Typography Links */}
          <nav className="hidden lg:flex items-center gap-6 text-xs uppercase tracking-wider font-semibold">
            <button
              onClick={() => setActiveTab('marketplace')}
              className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'marketplace'
                  ? 'text-[#FFB800] border-b-2 border-[#FFB800] pb-1'
                  : 'text-[#B8B8B3] hover:text-[#F5F5F2]'
              }`}
            >
              Bunker
            </button>
            <button
              onClick={() => setActiveTab('logistics')}
              className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'logistics'
                  ? 'text-[#FFB800] border-b-2 border-[#FFB800] pb-1'
                  : 'text-[#B8B8B3] hover:text-[#F5F5F2]'
              }`}
            >
              Logistika
            </button>
            <button
              onClick={() => setActiveTab('global_bunker')}
              className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'global_bunker'
                  ? 'text-[#FFB800] border-b-2 border-[#FFB800] pb-1'
                  : 'text-[#B8B8B3] hover:text-[#F5F5F2]'
              }`}
            >
              Global Bunker
            </button>
            {user && (
              <button
                onClick={() => setActiveTab('orders')}
                className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === 'orders'
                    ? 'text-[#FFB800] border-b-2 border-[#FFB800] pb-1'
                    : 'text-[#B8B8B3] hover:text-[#F5F5F2]'
                }`}
              >
                Buyurtmalarim
              </button>
            )}

            {user && (
              <button
                onClick={() => setActiveTab('orders')}
                className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'orders'
                    ? 'text-[#FFB800] border-b-2 border-[#FFB800] pb-1'
                    : 'text-[#B8B8B3] hover:text-[#F5F5F2]'
                }`}
              >
                <span>Mijoz Kabineti</span>
              </button>
            )}

            {isSupplier && (
              <button
                onClick={() => setActiveTab('supplier')}
                className="px-2.5 py-1 rounded bg-[#292C2F] border border-[#FFB800]/50 text-[#FFB800] text-xs font-bold flex items-center gap-1.5 hover:bg-[#FFB800] hover:text-[#151719] transition-all cursor-pointer whitespace-nowrap"
              >
                <Building className="w-3.5 h-3.5" />
                <span>Ta'minotchi</span>
              </button>
            )}
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">

            {/* Alohida Admin Panel tugmasi */}
            <button
              onClick={() => setActiveTab('admin')}
              className="px-3 py-1.5 rounded-lg bg-[#222528] hover:bg-[#292C2F] border border-[#FFB800]/60 hover:border-[#FFB800] text-[#FFB800] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shadow-sm"
              title="Alohida Admin Boshqaruv Paneliga o'tish"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-[#FFB800]" />
              <span>Admin Panel</span>
            </button>
            
            {/* Shopping Cart Button - Bosh panelda doimo ko'rinadi */}
            <button
              onClick={onOpenCart}
              className="relative p-2 sm:px-3 sm:py-2 rounded-lg bg-[#222528] hover:bg-[#292C2F] border border-[#51504A] hover:border-[#777A7C] text-[#F5F5F2] transition-all shadow-sm cursor-pointer flex items-center gap-2 group"
              aria-label="Savat"
              title="Savat"
            >
              <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-[#FFB800] group-hover:scale-105 transition-transform" />
              <span className="text-xs font-mono hidden sm:inline text-[#B8B8B3] group-hover:text-[#F5F5F2]">
                Savat
              </span>
              {cartCount > 0 && (
                <span className="bg-[#FFB800] text-[#151719] text-[11px] font-bold font-mono px-1.5 py-0.2 rounded min-w-[18px] text-center border border-[#151719]">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Auth / Profile Button (YE va yelenabe yo'q; Admin bosilganda qulflanadi va parol so'raydi) */}
            {user ? (
              <div className="flex items-center gap-2">
                {isAdmin ? (
                  <button
                    onClick={() => {
                      try {
                        localStorage.setItem('bunkerstroy_admin_locked', 'true');
                      } catch {}
                      window.dispatchEvent(new CustomEvent('bunkerstroy_lock_admin'));
                      setActiveTab('admin');
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#FFB800] bg-[#222528] hover:bg-[#292C2F] text-[#FFB800] text-xs font-bold transition-all cursor-pointer shadow-sm group"
                    title="Bosh Admin Kabinetini Bloklash (Lock Screen) - Parol so'raydi"
                  >
                    <div className="w-5 h-5 rounded bg-[#151719] text-[#FFB800] flex items-center justify-center border border-[#51504A] group-hover:border-[#FFB800]">
                      <Lock className="w-3 h-3 text-[#FFB800]" />
                    </div>
                    <span className="hidden sm:inline font-mono">Bosh Admin</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#FFB800]/20 text-[#FFB800] border border-[#FFB800]/40 font-mono">
                      Qulflash
                    </span>
                  </button>
                ) : (
                  <button
                    onClick={() => setActiveTab(isSupplier ? 'supplier' : 'orders')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs transition-all cursor-pointer ${
                      activeTab === 'orders' || activeTab === 'supplier'
                        ? 'bg-[#FFB800] text-[#151719] font-bold border-[#FFC928]'
                        : 'bg-[#222528] text-[#F5F5F2] border-[#51504A] hover:border-[#777A7C]'
                    }`}
                    title="Kabinet"
                  >
                    <div className="w-5 h-5 rounded bg-[#151719] text-[#FFB800] font-mono font-bold flex items-center justify-center text-[10px] border border-[#51504A]">
                      {getUserInitials(user)}
                    </div>
                    <span className="max-w-[120px] truncate hidden sm:inline font-medium">
                      {user.firstName || user.displayName || 'Kabinet'}
                    </span>
                  </button>
                )}
                <button
                  onClick={onLogout}
                  title="Chiqish"
                  className="p-2 rounded-lg bg-[#222528] hover:bg-[#292C2F] text-[#B8B8B3] hover:text-[#FFB800] border border-[#51504A] transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="bg-[#DC2626] hover:bg-[#B91C1C] active:bg-[#991B1B] text-white border border-red-500/80 flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold shadow-md cursor-pointer whitespace-nowrap transition-colors"
              >
                <UserIcon className="w-4 h-4 stroke-[2.5]" />
                <span>Kabinetga Kirish</span>
              </button>
            )}

          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex lg:hidden border-t border-[#51504A] py-2 overflow-x-auto gap-2 scrollbar-none text-xs">
          <button
            onClick={() => setActiveTab('marketplace')}
            className={`px-3 py-1 rounded text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'marketplace' ? 'bg-[#FFB800] text-[#151719]' : 'text-[#B8B8B3] bg-[#222528]'
            }`}
          >
            Bunker
          </button>
          <button
            onClick={() => setActiveTab('logistics')}
            className={`px-3 py-1 rounded text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'logistics' ? 'bg-[#FFB800] text-[#151719]' : 'text-[#B8B8B3] bg-[#222528]'
            }`}
          >
            Logistika
          </button>
          <button
            onClick={() => setActiveTab('global_bunker')}
            className={`px-3 py-1 rounded text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'global_bunker' ? 'bg-[#FFB800] text-[#151719]' : 'text-[#B8B8B3] bg-[#222528]'
            }`}
          >
            Global Bunker
          </button>
          {user && (
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-3 py-1 rounded text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === 'orders' ? 'bg-[#FFB800] text-[#151719]' : 'text-[#B8B8B3] bg-[#222528]'
              }`}
            >
              Buyurtmalarim
            </button>
          )}
          <button
            onClick={() => setActiveTab('admin')}
            className={`px-3 py-1 rounded text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1 ${
              activeTab === 'admin' ? 'bg-[#FFB800] text-[#151719]' : 'text-[#FFB800] bg-[#222528] border border-[#FFB800]/40'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Admin</span>
          </button>
        </div>

      </div>
    </header>
  );
};
