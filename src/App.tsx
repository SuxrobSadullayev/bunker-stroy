import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Marketplace } from './components/Marketplace';
import { LogisticsHub } from './components/LogisticsHub';
import { OrdersView } from './components/OrdersView';
import { CartModal } from './components/CartModal';
import { AuthModal } from './components/AuthModal';
import { OrderSuccessModal } from './components/OrderSuccessModal';
import { AdminCabinet } from './components/AdminCabinet';
import { BunkerAdminCabinet } from './components/BunkerAdminCabinet';
import { SupplierCabinet } from './components/SupplierCabinet';
import { CabinetLogsModal } from './components/CabinetLogsModal';
import { GlobalBunkerHub } from './components/GlobalBunkerHub';
import { Product, CartItem, UserProfile, Order, LogisticsVehicle, SubAdminCabinetAccount, SupplierPartner } from './types';
import { INITIAL_PRODUCTS, INITIAL_VEHICLES, MOCK_FAKE_PRODUCT_IDS, MOCK_FAKE_SUPPLIER_IDS } from './data/mockData';
import { isOrderAfterReset, DEFAULT_STATS_RESET_CUTOFF_MS } from './data/supplierReportsData';
import { auth, db, testConnection, logoutUser } from './lib/firebase';
import { recordCabinetLog } from './lib/cabinetLogs';
import { doc, setDoc, deleteDoc, collection, onSnapshot } from 'firebase/firestore';
import { HardHat, ShieldCheck, Truck, Phone, Mail, MapPin, ShieldAlert, ArrowLeft } from 'lucide-react';
import { getAdminConfig, AdminConfig, getSubAdmins, BUNKER_ADMIN_CREDENTIALS, getBunkerAdminCredentials } from './lib/adminSettings';
import { RealTelegramLogo, RealInstagramLogo, RealYouTubeLogo, RealPhoneLogo } from './components/SocialLogos';

// Platformani to'liq 0 holatga keltirish (barcha mahsulotlar, kabinetlar, buyurtmalar, loglar va qoldiqlar 0 holatdan boshlanadi)
try {
  if (typeof window !== 'undefined' && localStorage.getItem('bunkerstroy_platform_zero_reset_v10') !== 'done') {
    localStorage.setItem('bunkerstroy_products', JSON.stringify([]));
    localStorage.setItem('bunkerstroy_suppliers', JSON.stringify([]));
    localStorage.setItem('bunkerstroy_sub_admins_v1', JSON.stringify([]));
    localStorage.setItem('bunkerstroy_vehicles', JSON.stringify([]));
    localStorage.setItem('bunkerstroy_global_partners', JSON.stringify([]));
    localStorage.setItem('bunkerstroy_customers', JSON.stringify([]));
    localStorage.setItem('bunkerstroy_orders', JSON.stringify([]));
    localStorage.setItem('bunkerstroy_b2b_orders', JSON.stringify([]));
    localStorage.setItem('bunkerstroy_transactions', JSON.stringify([]));
    localStorage.setItem('bunkerstroy_logs', JSON.stringify([]));
    localStorage.setItem('bunkerstroy_cabinet_logs', JSON.stringify([]));
    localStorage.setItem('bunkerstroy_search_queries', JSON.stringify([]));
    localStorage.setItem('bunkerstroy_ack_req_problems', JSON.stringify([]));
    localStorage.setItem('bunkerstroy_product_types', JSON.stringify([]));
    localStorage.removeItem('bunkerstroy_cart');
    localStorage.removeItem('bunkerstroy_supplier_seen_orders');
    localStorage.removeItem('bunkerstroy_admin_locked');
    localStorage.removeItem('bunkerstroy_single_admin_config_v2');
    localStorage.removeItem('bunkerstroy_bunker_admin_creds_v1');
    localStorage.removeItem('bunkerstroy_active_user');
    localStorage.setItem('bunkerstroy_active_tab', 'marketplace');
    localStorage.setItem('bunkerstroy_stats_cutoff_ms', String(Date.now()));
    localStorage.setItem('bunkerstroy_platform_zero_reset_v10', 'done');
  }
} catch {}

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      // Tozalash: mijozlar ro'yxatida admin yoki Yelenabe / aaaa qolib ketgan bo'lsa olib tashlash
      const rawCusts = localStorage.getItem('bunkerstroy_customers');
      if (rawCusts) {
        const parsedCusts = JSON.parse(rawCusts);
        if (Array.isArray(parsedCusts)) {
          const cleanedCusts = parsedCusts.filter(
            (c: any) =>
              c &&
              c.role !== 'admin' &&
              c.role !== 'bunker_admin' &&
              c.id !== 'admin-master' &&
              c.id !== 'bunker-admin-master' &&
              c.id !== 'super-admin-master' &&
              String(c.login || '').trim().toLowerCase() !== 'yelenabe' &&
              String(c.login || '').trim().toLowerCase() !== 'aaaa'
          );
          if (cleanedCusts.length !== parsedCusts.length) {
            localStorage.setItem('bunkerstroy_customers', JSON.stringify(cleanedCusts));
          }
        }
      }

      const savedUser = localStorage.getItem('bunkerstroy_active_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed) {
          if (parsed.role === 'bunker_admin') {
            const bunkerCreds = getBunkerAdminCredentials();
            if (parsed.id === 'bunker-admin-master' && parsed.firstName === bunkerCreds.login) {
              return parsed;
            }
            localStorage.removeItem('bunkerstroy_active_user');
            localStorage.setItem('bunkerstroy_active_tab', 'marketplace');
            return null;
          }
          if (parsed.role === 'admin') {
            if (parsed.isSubAdmin) {
              const subAdmins = getSubAdmins();
              const matchedSub = subAdmins.find((sa) => sa.id === parsed.id && sa.status !== 'blocked');
              if (matchedSub) {
                return {
                  ...parsed,
                  displayName: matchedSub.cabinetName,
                  firstName: matchedSub.login,
                  companyName: matchedSub.cabinetName,
                  subAdminPermissions: matchedSub.permissions || [],
                };
              }
              localStorage.removeItem('bunkerstroy_active_user');
              localStorage.setItem('bunkerstroy_active_tab', 'marketplace');
              return null;
            }
            const currentCfg = getAdminConfig();
            const expectedAdminLogin = (currentCfg.login || 'ADMIN.').trim();
            if (
              parsed.id === 'admin-master' &&
              parsed.firstName === expectedAdminLogin
            ) {
              return parsed;
            }
            localStorage.removeItem('bunkerstroy_active_user');
            localStorage.setItem('bunkerstroy_active_tab', 'marketplace');
            return null;
          }
          if (parsed.role === 'supplier') {
            const savedSupps = localStorage.getItem('bunkerstroy_suppliers');
            const suppList = savedSupps ? JSON.parse(savedSupps) : [];
            const exists = Array.isArray(suppList) && suppList.some((s: any) => s && s.id === parsed.id && !MOCK_FAKE_SUPPLIER_IDS.includes(s.id));
            return exists ? parsed : null;
          }
          const savedCusts = localStorage.getItem('bunkerstroy_customers');
          const custList = savedCusts ? JSON.parse(savedCusts) : [];
          const custExists = Array.isArray(custList) && custList.some((c: any) => c && c.id === parsed.id);
          return custExists ? parsed : null;
        }
      }
    } catch {}
    return null;
  });

  const [activeTab, setActiveTab] = useState<'marketplace' | 'logistics' | 'orders' | 'admin' | 'bunker_admin' | 'supplier' | 'global_bunker'>(() => {
    try {
      const savedTab = localStorage.getItem('bunkerstroy_active_tab');
      if (savedTab === 'bunker_admin') {
        const savedUser = localStorage.getItem('bunkerstroy_active_user');
        if (!savedUser) return 'marketplace';
        const parsed = JSON.parse(savedUser);
        if (!parsed || parsed.role !== 'bunker_admin' || parsed.id !== 'bunker-admin-master') {
          return 'marketplace';
        }
        return 'bunker_admin';
      }
      if (savedTab === 'admin') {
        const savedUser = localStorage.getItem('bunkerstroy_active_user');
        if (!savedUser) return 'marketplace';
        const parsed = JSON.parse(savedUser);
        if (!parsed || parsed.role !== 'admin') return 'marketplace';
        if (parsed.isSubAdmin) {
          const subAdmins = getSubAdmins();
          const matchedSub = subAdmins.find((sa) => sa.id === parsed.id && sa.status !== 'blocked');
          return matchedSub ? 'admin' : 'marketplace';
        }
        const currentCfg = getAdminConfig();
        if (parsed.id !== 'admin-master' || parsed.firstName !== (currentCfg.login || 'ADMIN.').trim()) {
          return 'marketplace';
        }
        return 'admin';
      }
      if (savedTab && ['marketplace', 'logistics', 'orders', 'admin', 'bunker_admin', 'supplier', 'global_bunker'].includes(savedTab)) {
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
        if (Array.isArray(parsed)) {
          return parsed.filter((p: Product) => p && p.id && !MOCK_FAKE_PRODUCT_IDS.includes(p.id));
        }
      }
      return [];
    } catch {
      return [];
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
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'register'>('login');
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);
  const [isOrderSuccessOpen, setIsOrderSuccessOpen] = useState(false);
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);

  // B2B Bunker uchun B2B ta'minotchilar yuklagan mahsulotlar ro'yxati (faqat B2B Bunkerda ko'rinadi)
  const b2bProducts = React.useMemo(() => {
    try {
      const savedSupps = localStorage.getItem('bunkerstroy_suppliers');
      const suppList: any[] = savedSupps ? JSON.parse(savedSupps) : [];
      const b2bMatched = products.filter((p) => {
        if (p.supplierCabinetType === 'manufacturer') return true;
        if (p.supplierCabinetType === 'partner') return false;
        const matchedSup = Array.isArray(suppList)
          ? suppList.find(
              (s) =>
                s &&
                ((p.supplierId && s.id === p.supplierId) ||
                  (p.supplierInn && s.inn && s.inn === p.supplierInn) ||
                  (p.supplierName &&
                    s.companyName &&
                    String(s.companyName).trim().toLowerCase() === String(p.supplierName).trim().toLowerCase()))
            )
          : null;
        if (matchedSup) {
          return matchedSup.cabinetType === 'manufacturer';
        }
        return false;
      });
      return b2bMatched;
    } catch {
      return products.filter((p) => p.supplierCabinetType === 'manufacturer');
    }
  }, [products]);

  // Bosh paneldagi "Mahsulotlar" bo'limi uchun faqat B2C mahsulotlar (B2B Bunker mahsulotlari kirmaydi)
  const b2cProducts = React.useMemo(() => {
    const b2bIds = new Set(b2bProducts.map((p) => p.id));
    return products.filter((p) => !b2bIds.has(p.id));
  }, [products, b2bProducts]);

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

  // Sync products to localStorage (quota-safe so customer & supplier credentials always have space)
  useEffect(() => {
    try {
      const serialized = JSON.stringify(products);
      if (serialized.length < 2200000) {
        localStorage.setItem('bunkerstroy_products', serialized);
      } else {
        const lightProducts = products.map((p) => ({
          ...p,
          images: p.images ? p.images.slice(0, 2) : undefined,
          detailBlocks: undefined,
        }));
        localStorage.setItem('bunkerstroy_products', JSON.stringify(lightProducts));
      }
    } catch {
      try {
        const minimalProducts = products.map((p) => ({
          ...p,
          images: undefined,
          detailBlocks: undefined,
        }));
        localStorage.setItem('bunkerstroy_products', JSON.stringify(minimalProducts));
      } catch {}
    }
  }, [products]);

  // Test Firebase connection & sync real products and orders
  useEffect(() => {
    testConnection();

    // Sync products from localStorage changes (e.g. when Admin deletes a supplier cabinet)
    const handleStorageSync = () => {
      try {
        const saved = localStorage.getItem('bunkerstroy_products');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setProducts(parsed.filter((p: Product) => p && p.id && !MOCK_FAKE_PRODUCT_IDS.includes(p.id)));
          }
        }
      } catch {}
    };
    window.addEventListener('storage', handleStorageSync);
    window.addEventListener('bunkerstroy_products_updated', handleStorageSync);

    // Sync products from Firestore (filter out and delete any old mock or pre-reset products)
    const unsubscribeProducts = onSnapshot(
      collection(db, 'products'),
      (snapshot) => {
        const needFullZeroReset = localStorage.getItem('bunkerstroy_firestore_zero_v10') !== 'done';
        const fetched: Product[] = [];
        snapshot.forEach((d) => {
          const data = d.data() as Product;
          if (needFullZeroReset || (data && data.id && MOCK_FAKE_PRODUCT_IDS.includes(data.id))) {
            deleteDoc(doc(db, 'products', d.id)).catch(() => {});
          } else if (data && data.id) {
            fetched.push(data);
          }
        });
        if (needFullZeroReset) {
          localStorage.setItem('bunkerstroy_firestore_zero_v10', 'done');
        }
        if (fetched.length > 0) {
          setProducts((prev) => {
            const fetchedIds = new Set(fetched.map((f) => f.id));
            const localOnly = prev.filter((p) => p && p.id && !fetchedIds.has(p.id) && !MOCK_FAKE_PRODUCT_IDS.includes(p.id));
            return [...localOnly, ...fetched];
          });
        }
      },
      () => {}
    );

    // One-time cleanup of old users in Firestore for 0-state reset
    if (localStorage.getItem('bunkerstroy_firestore_users_zero_v10') !== 'done') {
      const unsubUsers = onSnapshot(
        collection(db, 'users'),
        (snap) => {
          snap.forEach((d) => {
            deleteDoc(doc(db, 'users', d.id)).catch(() => {});
          });
          localStorage.setItem('bunkerstroy_firestore_users_zero_v10', 'done');
          unsubUsers();
        },
        () => {}
      );
    }

    // Sync all orders for admin view (and purge any pre-reset orders)
    const unsubscribeOrders = onSnapshot(
      collection(db, 'orders'),
      (snapshot) => {
        const fetched: Order[] = [];
        snapshot.forEach((d) => {
          const ord = d.data() as Order;
          if (!isOrderAfterReset(ord)) {
            deleteDoc(doc(db, 'orders', d.id)).catch(() => {});
          } else {
            fetched.push(ord);
          }
        });
        fetched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setOrders(fetched);
        try {
          const savedLocal = localStorage.getItem('bunkerstroy_orders');
          const localList: Order[] = savedLocal ? JSON.parse(savedLocal) : [];
          const map = new Map<string, Order>();
          fetched.forEach((o) => map.set(o.id, o));
          if (Array.isArray(localList)) {
            localList.forEach((lo) => {
              if (!lo || !lo.id || !isOrderAfterReset(lo)) return;
              const ex = map.get(lo.id);
              if (!ex) {
                map.set(lo.id, lo);
              } else {
                const lTime = lo.updatedAt ? new Date(lo.updatedAt).getTime() : 0;
                const fTime = ex.updatedAt ? new Date(ex.updatedAt).getTime() : 0;
                if (lTime > fTime) map.set(lo.id, lo);
              }
            });
          }
          const merged = Array.from(map.values()).sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          localStorage.setItem('bunkerstroy_orders', JSON.stringify(merged));
          window.dispatchEvent(new CustomEvent('bunkerstroy_orders_updated'));
        } catch {}
      },
      () => {}
    );

    return () => {
      window.removeEventListener('storage', handleStorageSync);
      window.removeEventListener('bunkerstroy_products_updated', handleStorageSync);
      unsubscribeProducts();
      unsubscribeOrders();
    };
  }, []);

  const handleAddToCart = (product: Product, quantity: number = 1) => {
    const maxStock = typeof product.stock === 'number' ? Math.max(0, product.stock) : 0;
    if (maxStock <= 0) return;
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        const nextQty = Math.min(maxStock, existing.quantity + quantity);
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, product, quantity: nextQty } : i
        );
      }
      return [...prev, { product, quantity: Math.min(maxStock, quantity) }];
    });
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    setCart((prev) =>
      prev.map((i) => {
        if (i.product.id !== productId) return i;
        const latestProd = products.find((p) => p.id === productId) || i.product;
        const maxStock = typeof latestProd.stock === 'number' ? Math.max(0, latestProd.stock) : i.quantity;
        const safeQty = Math.max(1, Math.min(maxStock, quantity));
        return { ...i, product: latestProd, quantity: safeQty };
      })
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

  // Mijoz kabinetiga kirish (yaratilgandan so'ng) va chiqish uchun maxsus Loading Page holati
  const [customerLoadingState, setCustomerLoadingState] = useState<'entering' | 'exiting' | null>(null);

  const handleReturnToBunkerAdmin = () => {
    const bunkerCreds = getBunkerAdminCredentials();
    const bunkerAdminProfile: UserProfile = {
      id: 'bunker-admin-master',
      email: 'bunker-admin@bunkerstroy.uz',
      displayName: 'Bunker Admin',
      firstName: bunkerCreds.login,
      role: 'bunker_admin',
      phone: '+998 71 200 00 50',
      companyName: 'BunkerStroy Bunker Admin Boshqaruvi',
      createdAt: new Date().toISOString(),
    };
    setUser(bunkerAdminProfile);
    setActiveTab('bunker_admin');
  };

  const handleLogout = async () => {
    const isCustomerUser = Boolean(
      user && user.role !== 'admin' && user.role !== 'bunker_admin' && user.role !== 'supplier'
    );

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

    if (isCustomerUser) {
      setCustomerLoadingState('exiting');
      setTimeout(async () => {
        await logoutUser();
        setUser(null);
        setActiveTab('marketplace');
        try {
          localStorage.removeItem('bunkerstroy_active_user');
          localStorage.removeItem('bunkerstroy_active_tab');
        } catch {}
        setCustomerLoadingState(null);
      }, 1500);
      return;
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

  // Faqat mijoz kabineti uchun Loading Page (Kabinet yaratilganda va kabinetdan chiqish bosilganda)
  if (customerLoadingState) {
    return (
      <div className="min-h-screen w-full bg-white text-white flex items-center justify-center p-4 font-sans">
        <div className="bg-[#0A1931] border-2 border-[#1E3A6D] rounded-2xl max-w-md w-full p-8 shadow-2xl relative text-center space-y-6 animate-fadeIn">
          <div className="absolute top-2.5 left-2.5 industrial-rivet" />
          <div className="absolute top-2.5 right-2.5 industrial-rivet" />
          <div className="absolute bottom-2.5 left-2.5 industrial-rivet" />
          <div className="absolute bottom-2.5 right-2.5 industrial-rivet" />

          <div className="relative w-20 h-20 rounded-2xl bg-[#071326] border-2 border-[#FFB800] flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(255,184,0,0.25)]">
            <HardHat className="w-10 h-10 text-[#FFB800] animate-bounce stroke-[2.2]" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-black tracking-wider text-white">
              <span className="text-[#FFB800]">BUNKER</span> STROY
            </h2>
            <p className="text-sm font-bold text-[#FFB800] font-mono uppercase tracking-wider">
              {customerLoadingState === 'entering'
                ? 'Shaxsiy Kabinetingiz Ochilmoqda...'
                : 'Kabinetdan Chiqilmoqda...'}
            </p>
            <p className="text-xs text-sky-100/80 max-w-xs mx-auto leading-relaxed">
              {customerLoadingState === 'entering'
                ? 'Bunker, Global Bunker, Savat, Buyurtmalarim va Sozlamalar bo‘limlari tayyorlanmoqda...'
                : 'Mijoz kabineti xavfsiz yopilmoqda, bosh sahifaga qaytilmoqda...'}
            </p>
          </div>

          <div className="w-full h-2.5 bg-[#071326] rounded-full overflow-hidden border border-[#1E3A6D] p-0.5">
            <div className="h-full bg-[#FFB800] rounded-full animate-pulse w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-white text-black flex flex-col font-sans selection:bg-[#FFB800] selection:text-black">
      
      {activeTab === 'bunker_admin' && user?.role === 'bunker_admin' ? (
        <BunkerAdminCabinet
          currentUser={user}
          onGoToShop={() => setActiveTab('marketplace')}
          onLogout={handleLogout}
          onMainAdminConfigChange={(newCfg) => setAdminConfig(newCfg)}
          onEnterMainAdminCabinet={() => {
            const currentCfg = getAdminConfig();
            const currentAdminLogin = (currentCfg.login || 'ADMIN.').trim();
            const mainAdminProfile: UserProfile = {
              id: 'admin-master',
              email: `${currentAdminLogin.toLowerCase()}@bunkerstroy.uz`,
              displayName: 'Bosh Admin',
              firstName: currentAdminLogin,
              role: 'admin',
              phone: '+998 71 200 00 50',
              companyName: 'BunkerStroy Bosh Boshqarmasi',
              createdAt: new Date().toISOString(),
              isSubAdmin: false,
              impersonatedByBunkerAdmin: true,
            };
            setUser(mainAdminProfile);
            setActiveTab('admin');
          }}
          onEnterSubAdminCabinet={(subAdmin: SubAdminCabinetAccount) => {
            const subAdminProfile: UserProfile = {
              id: subAdmin.id,
              email: `${subAdmin.login.toLowerCase()}@bunkerstroy.uz`,
              displayName: subAdmin.cabinetName,
              firstName: subAdmin.login,
              role: 'admin',
              phone: '+998 71 200 00 50',
              companyName: subAdmin.cabinetName,
              createdAt: subAdmin.createdAt || new Date().toISOString(),
              isSubAdmin: true,
              subAdminId: subAdmin.id,
              subAdminPermissions: subAdmin.permissions || [],
              impersonatedByBunkerAdmin: true,
            };
            setUser(subAdminProfile);
            setActiveTab('admin');
          }}
          onEnterSupplierCabinet={(sup: SupplierPartner) => {
            const supplierProfile: UserProfile = {
              id: sup.id,
              email: sup.email || `${sup.login}@bunkerstroy.uz`,
              displayName: sup.companyName,
              firstName: sup.directorName,
              role: 'supplier',
              phone: sup.phone,
              companyName: sup.companyName,
              inn: sup.inn,
              region: sup.region,
              district: sup.district,
              createdAt: sup.joinedAt || new Date().toISOString(),
              impersonatedByBunkerAdmin: true,
            };
            setUser(supplierProfile);
            setActiveTab('supplier');
          }}
        />
      ) : activeTab === 'admin' && user?.role === 'admin' ? (
        <AdminCabinet
          currentUser={user}
          onGoToShop={() => setActiveTab('marketplace')}
          onLogout={handleLogout}
          onConfigChange={(newCfg) => {
            setAdminConfig(newCfg);
            setUser((prev) =>
              prev && prev.role === 'admin' && !prev.isSubAdmin
                ? { ...prev, firstName: newCfg.login, email: `${newCfg.login.toLowerCase()}@bunkerstroy.uz` }
                : prev
            );
          }}
          cartCount={totalCartCount}
          onOpenCart={() => setIsCartOpen(true)}
          onOpenAuth={() => setIsAuthOpen(true)}
          onReturnToBunkerAdmin={user.impersonatedByBunkerAdmin ? handleReturnToBunkerAdmin : undefined}
        />
      ) : activeTab === 'supplier' && user ? (
        <div className="flex flex-col min-h-screen">
          {user.impersonatedByBunkerAdmin && (
            <div className="bg-[#071326] border-b-2 border-[#FFB800] px-4 py-2 flex items-center justify-between text-white z-50">
              <div className="flex items-center gap-2 text-xs font-bold">
                <ShieldCheck className="w-4 h-4 text-[#FFB800]" />
                <span>
                  Bunker Admin orqali <span className="text-[#FFB800]">{user.companyName || user.displayName}</span> kabinetiga o‘tildi
                </span>
              </div>
              <button
                onClick={handleReturnToBunkerAdmin}
                className="px-3 py-1 rounded-lg bg-[#FFB800] hover:bg-[#FFC928] text-[#071326] text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Bunker Adminga qaytish</span>
              </button>
            </div>
          )}
          <SupplierCabinet
            currentUser={user}
            products={products}
            onAddProduct={(newProd) => {
              const cleanProd: Product = JSON.parse(JSON.stringify(newProd));
              setProducts((prev) => {
                const next = [cleanProd, ...prev.filter((p) => p.id !== cleanProd.id)];
                try {
                  localStorage.setItem('bunkerstroy_products', JSON.stringify(next));
                } catch {}
                return next;
              });
              try {
                setDoc(doc(db, 'products', cleanProd.id), cleanProd, { merge: true }).catch(() => {});
              } catch {}
            }}
            onDeleteProduct={(id) => {
              setProducts((prev) => {
                const next = prev.filter((p) => p.id !== id);
                try {
                  localStorage.setItem('bunkerstroy_products', JSON.stringify(next));
                } catch {}
                return next;
              });
              try {
                deleteDoc(doc(db, 'products', id)).catch(() => {});
              } catch {}
            }}
            onGoToShop={() => setActiveTab('marketplace')}
            onLogout={handleLogout}
          />
        </div>
      ) : activeTab === 'orders' && user ? (
        <OrdersView
          user={user}
          products={products}
          onAddToCart={handleAddToCart}
          onOpenAuth={() => setIsAuthOpen(true)}
          onGoToShop={() => setActiveTab('marketplace')}
          onLogout={handleLogout}
          cart={cart}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onClearCart={handleClearCart}
          onUserUpdate={(updatedUser) => setUser(updatedUser)}
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
            onOpenAuth={() => {
              setAuthInitialMode('login');
              setIsAuthOpen(true);
            }}
            onLogout={handleLogout}
            onOpenLogsModal={() => setIsLogsModalOpen(true)}
            logoUrl={adminConfig.logoUrl}
            telegram={adminConfig.telegram}
            instagram={adminConfig.instagram}
            phone={adminConfig.phone}
          />

          {/* Main Content Body */}
          <main className="flex-1 w-full px-4 sm:px-6 lg:px-10 pt-6 pb-12 bg-white text-black">
            {activeTab === 'marketplace' && (
              <Marketplace
                products={b2cProducts}
                onAddToCart={handleAddToCart}
                currentUser={user}
              />
            )}

            {activeTab === 'logistics' && <LogisticsHub />}
            {activeTab === 'global_bunker' && (
              <Marketplace
                products={b2bProducts}
                onAddToCart={handleAddToCart}
                currentUser={user}
              />
            )}

            {activeTab === 'orders' && (
              <OrdersView
                user={user}
                products={products}
                onAddToCart={handleAddToCart}
                onOpenAuth={() => {
                  setAuthInitialMode('login');
                  setIsAuthOpen(true);
                }}
                onGoToShop={() => setActiveTab('marketplace')}
                onLogout={handleLogout}
                cart={cart}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
                onClearCart={handleClearCart}
                onUserUpdate={(updatedUser) => setUser(updatedUser)}
              />
            )}
          </main>

          {/* Footer - Faqat bosh panelda (Mahsulotlar oxiriga yetganda eng pastda) ko'rsatiladi */}
          {activeTab === 'marketplace' && (
            <footer className="bg-gradient-to-b from-[#0A1931] to-[#071326] border-t-2 border-[#1E3A6D] text-sky-100/80 text-[11px] py-3.5 mt-auto">
              <div className="w-full px-4 sm:px-6 lg:px-10 grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-white font-black text-sm">
                    <div className="w-6 h-6 rounded bg-[#0F2547] border border-[#254B85] flex items-center justify-center text-[#FFB800]">
                      <HardHat className="w-3.5 h-3.5 stroke-[2.2]" />
                    </div>
                    <span>
                      <span className="text-[#FFB800]">BUNKER</span> <span className="text-white">STROY</span>
                    </span>
                  </div>
                  <p className="text-[11px] leading-snug text-sky-100/90 font-medium">
                    Viloyatlararo Qurilish kategoriyasidagi mahsulotlarni Va Ta'minotchilarni Birlashtiruvchi (B2B2C) Onlayn market Platform.
                  </p>
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-[10px] uppercase tracking-wider text-[#FFB800]">Tezkor Havolalar</h4>
                  <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-sky-100/90 font-semibold">
                    <li><button onClick={() => setActiveTab('marketplace')} className="hover:text-[#FFB800] cursor-pointer">Mahsulotlar</button></li>
                    <li><button onClick={() => setActiveTab('global_bunker')} className="hover:text-[#FFB800] cursor-pointer">B2B Bunker</button></li>
                    <li><button onClick={() => setActiveTab('logistics')} className="hover:text-[#FFB800] cursor-pointer">Biz Haqimizda</button></li>
                    <li><button onClick={() => { setAuthInitialMode('login'); setIsAuthOpen(true); }} className="hover:text-[#FFB800] text-[#FFB800] font-bold cursor-pointer">Kabinetga Kirish</button></li>
                  </ul>
                </div>

                <div className="flex flex-wrap items-center justify-start md:justify-end gap-5">
                  <div className="space-y-1">
                    <h4 className="font-bold text-[10px] uppercase tracking-wider text-[#FFB800]">Ijtimoiy tarmoqlar</h4>
                    <div className="flex items-center gap-2">
                      <a
                        href={
                          adminConfig.telegram
                            ? adminConfig.telegram.startsWith('http')
                              ? adminConfig.telegram
                              : `https://t.me/${adminConfig.telegram.replace(/^@/, '')}`
                            : 'https://t.me/bunkerstroy_uz'
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Telegram"
                        aria-label="Telegram"
                      >
                        <RealTelegramLogo className="w-7 h-7" />
                      </a>

                      <a
                        href={
                          adminConfig.instagram
                            ? adminConfig.instagram.startsWith('http')
                              ? adminConfig.instagram
                              : `https://instagram.com/${adminConfig.instagram.replace(/^@/, '')}`
                            : 'https://instagram.com/bunkerstroy.uz'
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Instagram"
                        aria-label="Instagram"
                      >
                        <RealInstagramLogo className="w-7 h-7" />
                      </a>

                      <a
                        href={
                          adminConfig.youtube
                            ? adminConfig.youtube.startsWith('http')
                              ? adminConfig.youtube
                              : `https://youtube.com/${adminConfig.youtube}`
                            : 'https://youtube.com/@bunkerstroy'
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        title="YouTube"
                        aria-label="YouTube"
                      >
                        <RealYouTubeLogo className="w-7 h-7" />
                      </a>
                    </div>
                  </div>

                  <div className="space-y-1 pl-4 border-l border-[#1E3A6D]/80">
                    <h4 className="font-bold text-[10px] uppercase tracking-wider text-[#FFB800]">Aloqa uchun</h4>
                    <div className="flex items-center gap-2">
                      <a
                        href={`tel:${(adminConfig.phone || '+998 (71) 200-00-50').replace(/[^0-9+]/g, '')}`}
                        title={`Telefon: ${adminConfig.phone || '+998 (71) 200-00-50'}`}
                        aria-label="Telefon"
                      >
                        <RealPhoneLogo className="w-7 h-7" />
                      </a>

                      <a
                        href={
                          (adminConfig.telegram2 || adminConfig.telegram)
                            ? (adminConfig.telegram2 || adminConfig.telegram).startsWith('http')
                              ? (adminConfig.telegram2 || adminConfig.telegram)
                              : `https://t.me/${(adminConfig.telegram2 || adminConfig.telegram).replace(/^@/, '')}`
                            : 'https://t.me/bunkerstroy_uz'
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Telegram orqali aloqa"
                        aria-label="Telegram orqali aloqa"
                      >
                        <RealTelegramLogo className="w-7 h-7" />
                      </a>
                    </div>
                  </div>
                </div>
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
        onUserUpdate={setUser}
        onOpenAuth={(mode) => {
          setIsCartOpen(false);
          setAuthInitialMode(mode || 'register');
          setIsAuthOpen(true);
        }}
        onOrderSuccess={(orderId) => {
          setLastOrderId(orderId);
          setIsOrderSuccessOpen(true);
        }}
      />

      {/* Auth Modal with Login & Password + Bosh Admin & Bunker Admin Credentials */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        user={user}
        initialMode={authInitialMode}
        onUserChange={(updatedUser, isNewCabinet) => {
          setUser(updatedUser);
          if (updatedUser.role === 'bunker_admin') {
            setActiveTab('bunker_admin');
          } else if (updatedUser.role === 'admin') {
            setActiveTab('admin');
          } else if (updatedUser.role === 'supplier') {
            setActiveTab('supplier');
          } else {
            // Mijoz kabineti uchun Loading Page (yaratishdan so'ng kabinetga kirilguncha)
            if (isNewCabinet) {
              setCustomerLoadingState('entering');
              setActiveTab('orders');
              setTimeout(() => {
                setCustomerLoadingState(null);
              }, 1600);
            } else {
              setActiveTab('orders');
            }
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
