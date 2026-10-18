import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Marketplace } from './components/Marketplace';
import { LogisticsHub } from './components/LogisticsHub';
import { OrdersView } from './components/OrdersView';
import { CartModal } from './components/CartModal';
import { AuthModal } from './components/AuthModal';
import { OrderSuccessModal } from './components/OrderSuccessModal';
import { AdminCabinet } from './components/AdminCabinet';
import { SupplierCabinet } from './components/SupplierCabinet';
import { CabinetLogsModal } from './components/CabinetLogsModal';
import { GlobalBunkerHub } from './components/GlobalBunkerHub';
import { Product, CartItem, UserProfile, Order, LogisticsVehicle } from './types';
import { INITIAL_PRODUCTS, INITIAL_VEHICLES } from './data/mockData';
import { auth, db, testConnection, logoutUser } from './lib/firebase';
import { recordCabinetLog } from './lib/cabinetLogs';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, onSnapshot } from 'firebase/firestore';
import { HardHat, ShieldCheck, Truck, Phone, Mail, MapPin, Sparkles, ShieldAlert } from 'lucide-react';
import { getAdminConfig, AdminConfig } from './lib/adminSettings';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const savedUser = localStorage.getItem('bunkerstroy_active_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed) return parsed;
      }
    } catch {}
    return null;
  });

  const [activeTab, setActiveTab] = useState<'marketplace' | 'logistics' | 'orders' | 'admin' | 'supplier' | 'global_bunker'>(() => {
    try {
      const savedTab = localStorage.getItem('bunkerstroy_active_tab');
      if (savedTab && ['marketplace', 'logistics', 'orders', 'admin', 'supplier', 'global_bunker'].includes(savedTab)) {
        return savedTab as any;
      }
    } catch {}
    return 'marketplace';
  });

  // Sync activeTab to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('bunkerstroy_active_tab', activeTab);
    } catch {}
  }, [activeTab]);

  // Sync user to localStorage
  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem('bunkerstroy_active_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('bunkerstroy_active_user');
      }
    } catch {}
  }, [user]);

  const [adminConfig, setAdminConfig] = useState<AdminConfig>(() => getAdminConfig());
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('bunkerstroy_products');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  });
  const [vehicles, setVehicles] = useState<LogisticsVehicle[]>(INITIAL_VEHICLES);
  const [orders, setOrders] = useState<Order[]>([]);

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      localStorage.removeItem('bunkerstroy_cart');
      return [];
    } catch {
      return [];
    }
  });
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Modals state
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);
  const [isOrderSuccessOpen, setIsOrderSuccessOpen] = useState(false);
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Admin config real-time update listener
  useEffect(() => {
    const handleAdminConfigUpdate = (e: any) => {
      if (e.detail) {
        setAdminConfig(e.detail);
      } else {
        setAdminConfig(getAdminConfig());
      }
    };
    window.addEventListener('bunkerstroy_admin_config_updated', handleAdminConfigUpdate);
    return () => {
      window.removeEventListener('bunkerstroy_admin_config_updated', handleAdminConfigUpdate);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        } else if ((document.documentElement as any).webkitRequestFullscreen) {
          await (document.documentElement as any).webkitRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        }
      }
    } catch (err) {
      console.warn('Fullscreen request:', err);
    }
  };

  // Sync cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('bunkerstroy_cart', JSON.stringify(cart));
    } catch {}
  }, [cart]);

  // Sync products to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('bunkerstroy_products', JSON.stringify(products));
    } catch {}
  }, [products]);

  // Test Firebase connection & listen to Auth
  useEffect(() => {
    testConnection();

    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      // Bosh Admin yoki Ta'minotchi sessiyasini Firebase anonymous user bilan almashtirib yubormaslik
      try {
        const saved = localStorage.getItem('bunkerstroy_active_user');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && (parsed.role === 'admin' || parsed.role === 'supplier')) {
            return;
          }
        }
      } catch {}

      if (fbUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data() as UserProfile;
            setUser(data);
          } else {
            const fallback: UserProfile = {
              id: fbUser.uid,
              email: fbUser.email || '',
              displayName: fbUser.displayName || 'Quruvchi Foydalanuvchi',
              photoURL: fbUser.photoURL || undefined,
              role: 'customer',
              createdAt: new Date().toISOString(),
            };
            setUser(fallback);
          }
        } catch {
          setUser({
            id: fbUser.uid,
            email: fbUser.email || '',
            displayName: fbUser.displayName || 'Foydalanuvchi',
            photoURL: fbUser.photoURL || undefined,
            role: 'customer',
            createdAt: new Date().toISOString(),
          });
        }
      }
    });

    // Sync products from Firestore if available
    const unsubscribeProducts = onSnapshot(
      collection(db, 'products'),
      (snapshot) => {
        if (!snapshot.empty) {
          const fetched: Product[] = [];
          snapshot.forEach((d) => fetched.push(d.data() as Product));
          setProducts(fetched);
        }
      },
      () => {}
    );

    // Sync all orders for admin view
    const unsubscribeOrders = onSnapshot(
      collection(db, 'orders'),
      (snapshot) => {
        const fetched: Order[] = [];
        snapshot.forEach((d) => fetched.push(d.data() as Order));
        fetched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setOrders(fetched);
      },
      () => {}
    );

    return () => {
      unsubscribeAuth();
      unsubscribeProducts();
      unsubscribeOrders();
    };
  }, []);

  const handleAddToCart = (product: Product, quantity: number = 1) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, { product, quantity }];
    });
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    setCart((prev) =>
      prev.map((i) => (i.product.id === productId ? { ...i, quantity } : i))
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
    try {
      localStorage.removeItem('bunkerstroy_cart');
    } catch {}
  };

  const handleLogout = async () => {
    if (user) {
      recordCabinetLog({
        userId: user.id,
        userLogin: user.email || user.displayName,
        userName: user.displayName,
        action: 'logout',
        actionLabel: 'Kabinetdan chiqildi',
        details: 'Foydalanuvchi shaxsiy kabinetidan chiqdi.',
      });
    }
    await logoutUser();
    setUser(null);
    setActiveTab('marketplace');
    try {
      localStorage.removeItem('bunkerstroy_active_user');
      localStorage.removeItem('bunkerstroy_active_tab');
    } catch {}
  };

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen w-full bg-[#151719] text-[#F5F5F2] flex flex-col font-sans selection:bg-[#FFB800] selection:text-[#151719]">
      
      {activeTab === 'admin' ? (
        <AdminCabinet
          currentUser={user}
          onGoToShop={() => setActiveTab('marketplace')}
          onLogout={handleLogout}
          onConfigChange={(newCfg) => setAdminConfig(newCfg)}
          cartCount={totalCartCount}
          onOpenCart={() => setIsCartOpen(true)}
          onOpenAuth={() => setIsAuthOpen(true)}
        />
      ) : activeTab === 'supplier' && user ? (
        <SupplierCabinet
          currentUser={user}
          products={products}
          onAddProduct={(newProd) => setProducts((prev) => [newProd, ...prev])}
          onDeleteProduct={(id) => setProducts((prev) => prev.filter((p) => p.id !== id))}
          onGoToShop={() => setActiveTab('marketplace')}
          onLogout={handleLogout}
        />
      ) : (
        <>
          {/* Main Navbar */}
          <Navbar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            cartCount={totalCartCount}
            onOpenCart={() => setIsCartOpen(true)}
            user={user}
            onOpenAuth={() => setIsAuthOpen(true)}
            onLogout={handleLogout}
            onOpenLogsModal={() => setIsLogsModalOpen(true)}
            logoUrl={adminConfig.logoUrl}
            telegram={adminConfig.telegram}
            instagram={adminConfig.instagram}
            phone={adminConfig.phone}
          />

          {/* Main Content Body */}
          <main className="flex-1 w-full px-4 sm:px-6 lg:px-10 pt-6 pb-12">
            {activeTab === 'marketplace' && (
              <Marketplace
                products={products}
                onAddToCart={handleAddToCart}
                currentUser={user}
              />
            )}

            {activeTab === 'logistics' && <LogisticsHub />}
            {activeTab === 'global_bunker' && <GlobalBunkerHub />}

            {activeTab === 'orders' && (
              <OrdersView
                user={user}
                onOpenAuth={() => setIsAuthOpen(true)}
                onGoToShop={() => setActiveTab('marketplace')}
                cart={cart}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
                onClearCart={handleClearCart}
                onUserUpdate={(updatedUser) => setUser(updatedUser)}
              />
            )}
          </main>

          {/* Footer - Mijoz kabinetida (orders) bu footer ko'rsatilmaydi */}
          {activeTab !== 'orders' && (
            <footer className="brushed-steel border-t border-[#51504A] text-[#B8B8B3] text-xs py-10 mt-auto">
              <div className="w-full px-4 sm:px-6 lg:px-10 grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-[#F5F5F2] font-black text-lg">
                    <div className="w-8 h-8 rounded bg-[#222528] border border-[#51504A] flex items-center justify-center text-[#FFB800]">
                      <HardHat className="w-4.5 h-4.5 stroke-[2.2]" />
                    </div>
                    <span>
                      <span className="text-[#FFB800]">BUNKER</span> <span className="text-[#F5F5F2]">STROY</span>
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-[#B8B8B3]">
                    O‘zbekistonda qurilish mollari savdosi, maxsus og‘ir texnika logistikasi va sanoat xomashyo ta’minotini birlashtiruvchi raqamli platforma.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-[#F5F5F2] font-bold text-xs uppercase tracking-wider text-[#FFB800]">Tezkor Havolalar</h4>
                  <ul className="space-y-1.5 text-[11px] text-[#B8B8B3]">
                    <li><button onClick={() => setActiveTab('marketplace')} className="hover:text-[#FFB800] cursor-pointer">Bunker - Qurilish Mollari</button></li>
                    <li><button onClick={() => setIsCartOpen(true)} className="hover:text-[#FFB800] cursor-pointer">Buyurtma Berish Savati</button></li>
                    <li><button onClick={() => setIsAuthOpen(true)} className="hover:text-[#FFB800] text-[#FFB800] font-bold cursor-pointer">Bunker Kabinetiga Kirish</button></li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="text-[#F5F5F2] font-bold text-xs uppercase tracking-wider text-[#FFB800]">Sertifikatlar</h4>
                  <ul className="space-y-1.5 text-[11px] text-[#B8B8B3]">
                    <li className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-[#FFB800]" /> Sertifikatlangan M500 / A500C</li>
                    <li className="flex items-center gap-1.5"><Truck className="w-3.5 h-3.5 text-[#FFB800]" /> Samosval & Manipulyatorlar</li>
                    <li className="flex items-center gap-1.5"><ShieldAlert className="w-3.5 h-3.5 text-[#FFB800]" /> Bosh Admin Nazorati</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="text-[#F5F5F2] font-bold text-xs uppercase tracking-wider text-[#FFB800]">Aloqa & Manzil</h4>
                  <div className="space-y-1.5 text-[11px] text-[#B8B8B3]">
                    <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-[#FFB800]" /> Toshkent sh., Sergeli tumani, Qurilish klasteri</p>
                    <p className="flex items-center gap-1.5 font-bold text-[#F5F5F2] font-mono">
                      <Phone className="w-3.5 h-3.5 text-[#FFB800]" /> 
                      <a href={`tel:${adminConfig.phone.replace(/[^0-9+]/g, '')}`} className="hover:text-[#FFB800]">
                        {adminConfig.phone || '+998 (71) 200-00-50'}
                      </a>
                    </p>
                    <p className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-[#FFB800]" /> info@bunkerstroy.uz</p>
                  </div>
                </div>
              </div>

              <div className="w-full px-4 sm:px-6 lg:px-10 mt-8 pt-6 border-t border-[#51504A] flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#B8B8B3]">
                <span>© {new Date().getFullYear()} BunkerStroy. Minimal Retro Industrial Architecture.</span>
                <span className="font-mono text-[#777A7C] mt-2 sm:mt-0">TOSHKENT · UZBEKISTAN</span>
              </div>
            </footer>
          )}
        </>
      )}

      {/* Cart Modal */}
      <CartModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        user={user}
        onOpenAuth={() => {
          setIsCartOpen(false);
          setIsAuthOpen(true);
        }}
        onOrderSuccess={(orderId) => {
          setLastOrderId(orderId);
          setIsOrderSuccessOpen(true);
        }}
      />

      {/* Auth Modal with Login & Password + Bosh Admin Credentials */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        user={user}
        onUserChange={(updatedUser) => {
          setUser(updatedUser);
          if (updatedUser.role === 'admin') {
            setActiveTab('admin');
          } else if (updatedUser.role === 'supplier') {
            setActiveTab('supplier');
          }
        }}
        onAdminLogin={() => {
          setActiveTab('admin');
        }}
        onSupplierLogin={() => {
          setActiveTab('supplier');
        }}
      />

      {/* Order Success Modal */}
      <OrderSuccessModal
        isOpen={isOrderSuccessOpen}
        orderId={lastOrderId}
        onClose={() => setIsOrderSuccessOpen(false)}
        onViewOrders={() => {
          setIsOrderSuccessOpen(false);
          setActiveTab(user?.role === 'admin' ? 'admin' : 'orders');
        }}
      />

      {/* BunkerStroy 3 marta bosilganda ochiladigan Kabinet Xavfsizlik & Faollik Loglari */}
      <CabinetLogsModal
        isOpen={isLogsModalOpen}
        onClose={() => setIsLogsModalOpen(false)}
        currentUser={user}
      />

    </div>
  );
}
