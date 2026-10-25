import React, { useState } from 'react';
import {
  Trash2,
  Plus,
  Minus,
  MapPin,
  CheckCircle,
  AlertCircle,
  HardHat,
  Package,
  ArrowLeft,
  Check,
  ChevronRight,
  X,
} from 'lucide-react';
import { CartItem, UserProfile } from '../types';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { CheckoutModal } from './CheckoutModal';
import { getColorPaletteItem } from './SupplierCabinet';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  user: UserProfile | null;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onOrderSuccess: (orderId: string) => void;
  onUserUpdate?: (updatedUser: UserProfile) => void;
}

export const CartModal: React.FC<CartModalProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  user,
  onOpenAuth,
  onOrderSuccess,
  onUserUpdate,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  if (!isOpen) return null;

  const grandTotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const formatPrice = (p: number) => new Intl.NumberFormat('uz-UZ').format(p) + " so'm";

  const selectedItem = items.find((i) => i.product.id === selectedProductId);
  const otherItems = items.filter((i) => i.product.id !== selectedProductId);

  const handleStartCheckout = () => {
    if (!user) {
      onOpenAuth('register');
      return;
    }
    if (items.length === 0) return;
    setIsCheckoutOpen(true);
  };

  const handleCreateOrder = async () => {
    if (!user) {
      onOpenAuth('register');
      return;
    }

    if (items.length === 0) return;

    // Ombor qoldig'ini tekshirish
    for (const item of items) {
      const avail = typeof item.product.stock === 'number' ? Math.max(0, item.product.stock) : 0;
      if (item.quantity > avail) {
        setError(`«${item.product.title}» — Ombordagi miqdor yetarli emas! (Omborda mavjud: ${avail} ${item.product.unit})`);
        return;
      }
    }

    setLoading(true);
    setError(null);

    const orderId = 'ord-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);
    const orderData = {
      id: orderId,
      buyerId: user.id,
      buyerName: user.displayName || 'Mijoz',
      buyerPhone: user.phone || 'Kelishilgan',
      items: items.map((i) => ({
        productId: i.product.id,
        title: i.product.title,
        quantity: i.quantity,
        unit: i.product.unit,
        price: i.product.price,
        supplierId: i.product.supplierId,
        supplierInn: i.product.supplierInn,
        supplierName: i.product.supplierName,
      })),
      totalAmount: grandTotal,
      status: 'pending',
      deliveryAddress: user.region
        ? `${user.region}${user.district ? ', ' + user.district : ''}`
        : 'Bunker orqali rasmiylashtirilgan',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'orders', orderId), orderData);

      // Real ma'lumotlar bilan ishlash: mahalliy xotirada ham buyurtma va moliyaviy operatsiya saqlanadi
      try {
        const savedOrders = localStorage.getItem('bunkerstroy_orders');
        const ordersList = savedOrders ? JSON.parse(savedOrders) : [];
        ordersList.unshift(orderData);
        localStorage.setItem('bunkerstroy_orders', JSON.stringify(ordersList));

        // Sotilgan mahsulotlarni ombor qoldig'idan ayirish
        const savedProds = localStorage.getItem('bunkerstroy_products');
        if (savedProds) {
          const prodsList = JSON.parse(savedProds);
          if (Array.isArray(prodsList)) {
            const updatedProds = prodsList.map((p: any) => {
              const orderedItem = items.find((it) => it.product.id === p.id);
              if (!orderedItem) return p;
              const nextSales = (Number(p.salesCount) || 0) + orderedItem.quantity;
              const nextStock = Math.max(0, (Number(p.stock) || 0) - orderedItem.quantity);
              setDoc(doc(db, 'products', p.id), { stock: nextStock, salesCount: nextSales }, { merge: true }).catch(() => {});
              return {
                ...p,
                salesCount: nextSales,
                stock: nextStock,
              };
            });
            localStorage.setItem('bunkerstroy_products', JSON.stringify(updatedProds));
            window.dispatchEvent(new CustomEvent('bunkerstroy_products_updated'));
          }
        }

        // Moliyaviy kirim operatsiyasi yaratish
        const savedTx = localStorage.getItem('bunkerstroy_transactions');
        const txList = savedTx ? JSON.parse(savedTx) : [];
        const newTx = {
          id: 'tx-' + Date.now().toString(36),
          type: 'income',
          category: 'Mahsulotlar savdosi',
          sourceOrDestination: `«${user.displayName || 'Mijoz'}» buyurtmasi (#${orderId.slice(-6).toUpperCase()})`,
          amount: grandTotal,
          paymentMethod: 'Bank hisob raqami (Perechisleniye)',
          date: new Date().toISOString().replace('T', ' ').slice(0, 16),
          status: 'completed',
        };
        txList.unshift(newTx);
        localStorage.setItem('bunkerstroy_transactions', JSON.stringify(txList));

        // Tizim logini yozish
        const savedLogs = localStorage.getItem('bunkerstroy_logs');
        const logsList = savedLogs ? JSON.parse(savedLogs) : [];
        const newLog = {
          id: `log-${Date.now()}`,
          action: 'Yangi buyurtma qabul qilindi',
          actor: user.displayName || 'Xaridor',
          category: 'order',
          details: `Buyurtma #${orderId.slice(-6).toUpperCase()} rasmiylashtirildi. Jami summa: ${new Intl.NumberFormat('uz-UZ').format(grandTotal)} so'm. Manzil: ${orderData.deliveryAddress}`,
          timestamp: new Date().toISOString(),
          ip: '195.158.12.84',
          level: 'success'
        };
        logsList.unshift(newLog);
        localStorage.setItem('bunkerstroy_logs', JSON.stringify(logsList));

        // Admin va boshqa oynalar uchun event yuborish
        window.dispatchEvent(new CustomEvent('bunkerstroy_finance_updated'));
      } catch (locErr) {
        console.warn('Local storage sync warning:', locErr);
      }

      onClearCart();
      onClose();
      onOrderSuccess(orderId);
    } catch (err: any) {
      console.error('Order creation error:', err);
      try {
        handleFirestoreError(err, OperationType.CREATE, 'orders');
      } catch (e: any) {
        setError("Buyurtmani saqlashda xatolik yuz berdi. Iltimos qayta urinib ko'ring.");
      }
    } finally {
      setLoading(false);
    }
  };

  const getSupplierAddress = (item: CartItem) => {
    if (item.product.region) {
      return `${item.product.region}${item.product.district ? ', ' + item.product.district : ''}`;
    }
    const sup = (item.product.supplierName || '').toLowerCase();
    if (sup.includes('navoiy')) return 'Navoiy viloyati, Karmana';
    if (sup.includes('bekobod') || sup.includes('metallurgiya')) return 'Toshkent vil., Bekobod sh.';
    if (sup.includes('ohangaron')) return 'Toshkent vil., Ohangaron t.';
    if (sup.includes('quvasoy')) return "Farg'ona vil., Quvasoy sh.";
    if (sup.includes('knauf')) return 'Buxoro vil., Kogon t.';
    return 'Toshkent sh., Bosh omborxona';
  };

  return (
    <div className="fixed inset-0 z-50 w-screen h-screen bg-white flex flex-col overflow-hidden text-black animate-fadeIn">
      {/* To'liq ekranni (Full Screen Oq Fon) egallovchi Buyurtma Berish Savati */}
      <div className="bg-white w-full h-full flex flex-col overflow-hidden text-black">
        
        {/* Header: Tyomniy Siniy Header */}
        <div className="px-6 sm:px-8 py-4 border-b-2 border-[#1E3A6D] flex items-center justify-between bg-gradient-to-r from-[#0A1931] to-[#071326] text-white shadow-md">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-lg bg-[#0F2547] text-[#FFB800] border border-[#254B85]">
              <HardHat className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-wide">
                  Bunkerdagi Materiallar
                </h2>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#0F2547] text-[#FFB800] border border-[#254B85]">
                  BUNKERSTROY
                </span>
              </div>
              <p className="text-[11px] text-sky-200 mt-0.5">
                Tanlangan mahsulotlar bu yerda buyurtma qilish uchun. Sonini qo'shish, ko'paytirish yoki kamaytirish imkoni.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-white hover:bg-red-600 p-2 rounded-lg bg-[#132C54] border border-[#2E5A9C] transition-all cursor-pointer shadow-sm"
            title="Yopish"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content: Full Screen Oq Fon (#ffffff) */}
        <div className="p-4 sm:p-6 lg:p-8 overflow-y-auto space-y-6 flex-1 bg-white">
          {items.length === 0 ? (
            <div className="text-center py-20 space-y-4 max-w-md mx-auto bg-[#0A1931] border-2 border-[#1E3A6D] rounded-2xl p-8 text-white shadow-xl my-8">
              <div className="w-16 h-16 rounded-xl bg-[#0F2547] border border-[#254B85] flex items-center justify-center mx-auto text-[#FFB800] shadow-md">
                <Package className="w-8 h-8 stroke-[1.8]" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-white">Bunkerdagi Materiallar bo'sh</h3>
                <p className="text-xs sm:text-sm text-sky-100/80">
                  Hozirda tanlangan materiallar yo'q. Bunker platformasidan kerakli qurilish mahsulotlarini tanlashingiz mumkin.
                </p>
              </div>
              <button
                onClick={onClose}
                className="bg-[#FFB800] hover:bg-[#FFC928] text-black px-6 py-2.5 rounded-lg text-xs sm:text-sm font-black cursor-pointer transition-all inline-block border border-[#E5A600]"
              >
                Mahsulotlarga qaytish
              </button>
            </div>
          ) : selectedItem ? (
            /* ============================================================ */
            /* 1-REJIM: TANLANGAN MAHSULOTNING BATAFSIL MA'LUMOTLARI        */
            /* YON TARAFIDAN ESA QOLGAN SAVATDAGI MAHSULOTLAR RO'YXATI      */
            /* ============================================================ */
            <div className="space-y-5 animate-fadeIn">
              {/* Yuqori boshqaruv navigatsiyasi */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => setSelectedProductId(null)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold text-white bg-[#0A1931] hover:bg-[#132C54] border border-[#1E3A6D] transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  <ArrowLeft className="w-4 h-4 text-[#FFB800]" />
                  <span>Tanlangan Qurilish Mahsulotlari jadvaliga qaytish</span>
                </button>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-white font-mono font-bold bg-[#0A1931] px-3.5 py-2 rounded-lg border border-[#1E3A6D] shadow-sm">
                    Jami savatda: {items.length} xil mahsulot
                  </span>
                </div>
              </div>

              {/* 2 Ustunli Kengaytirilgan Split View */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Asosiy (Chap) Blok: Tanlangan Mahsulotning Barcha Ma'lumotlari */}
                <div className="lg:col-span-7 xl:col-span-8 bg-[#0A1931] rounded-xl border-2 border-[#1E3A6D] p-5 sm:p-7 text-white shadow-xl space-y-6">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    
                    {/* Rasm va Galereya */}
                    <div className="space-y-3">
                      <div
                        onDoubleClick={() =>
                          setFullscreenImage(
                            selectedItem.product.images && selectedItem.product.images.length > 0
                              ? selectedItem.product.images[activeImageIndex] || selectedItem.product.image
                              : selectedItem.product.image
                          )
                        }
                        className="relative rounded-lg overflow-hidden bg-[#151719] border border-[#51504A] aspect-square flex items-center justify-center shadow-md cursor-zoom-in"
                        title="Katta ekranda ko‘rish uchun ikki marta bosing"
                      >
                        <img
                          src={
                            selectedItem.product.images && selectedItem.product.images.length > 0
                              ? selectedItem.product.images[activeImageIndex] || selectedItem.product.image
                              : selectedItem.product.image
                          }
                          alt={selectedItem.product.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                          <span className="px-2.5 py-1 rounded bg-[#151719]/90 border border-[#51504A] text-xs font-bold text-[#FFB800] shadow-sm font-mono">
                            {selectedItem.product.category}
                          </span>
                        </div>
                      </div>

                      {/* Agar 12 tagacha surat yuklangan bo'lsa */}
                      {selectedItem.product.images && selectedItem.product.images.length > 1 && (
                        <div className="space-y-1.5">
                          <div className="text-[11px] font-bold text-[#B8B8B3]">
                            Mahsulot suratlari ({selectedItem.product.images.length} ta):
                          </div>
                          <div className="flex items-center gap-2 overflow-x-auto pb-1">
                            {selectedItem.product.images.map((img, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => setActiveImageIndex(i)}
                                onDoubleClick={() => setFullscreenImage(img)}
                                className={`w-12 h-12 rounded-lg overflow-hidden border shrink-0 transition-all cursor-pointer ${
                                  activeImageIndex === i
                                    ? 'border-[#FFB800] ring-1 ring-[#FFB800]'
                                    : 'border-[#51504A] opacity-60 hover:opacity-100'
                                }`}
                              >
                                <img src={img} alt={`${i + 1}-rasm`} className="w-full h-full object-cover" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Mahsulot ma'lumotlari, ta'minotchi va narx */}
                    <div className="space-y-4 flex flex-col justify-between">
                      <div className="space-y-3.5">
                        <div>
                          <h3 className="text-xl sm:text-2xl font-bold text-[#F5F5F2] leading-tight">
                            {selectedItem.product.title}
                          </h3>
                          <span className="inline-block mt-1 text-xs text-[#FFB800] font-mono font-bold">
                            Kategoriya: {selectedItem.product.category}
                          </span>
                        </div>

                        {/* Narxi */}
                        <div className="p-3.5 rounded-lg bg-[#292C2F] border border-[#51504A] space-y-1">
                          <div className="text-xs text-[#B8B8B3] font-bold uppercase tracking-wider">Narxi:</div>
                          <div className="text-2xl sm:text-3xl font-bold text-[#FFB800] font-mono-numbers">
                            {formatPrice(selectedItem.product.price)}
                          </div>
                          <div className="text-xs text-[#B8B8B3] font-mono">
                            1 {selectedItem.product.unit} uchun belgilangan narx
                          </div>
                        </div>

                        {/* Ta'minotchi va Manzil */}
                        <div className="p-3.5 rounded-lg bg-[#292C2F] border border-[#51504A] space-y-1.5">
                          <div className="text-xs text-[#B8B8B3] font-bold uppercase tracking-wider">
                            Ta'minotchi Manzili:
                          </div>
                          <div className="font-bold text-[#F5F5F2] text-sm">
                            {selectedItem.product.supplierName || "Rasmiy Qurilish Ta'minotchisi"}
                          </div>
                          <div className="flex items-start gap-1.5 text-xs text-[#B8B8B3]">
                            <MapPin className="w-4 h-4 text-[#FFB800] shrink-0 mt-0.5" />
                            <span>{getSupplierAddress(selectedItem)}</span>
                          </div>
                        </div>

                        {/* Yetkazib berish xizmati */}
                        <div className="flex items-center gap-2.5">
                          <span className="text-xs text-[#B8B8B3] font-bold">Yetkazib berish:</span>
                          {selectedItem.product.hasDelivery !== false ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-[#292C2F] text-emerald-400 border border-[#51504A] shadow-sm">
                              <Check className="w-4 h-4 stroke-[3]" />
                              <span>✓ Mavjud</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-[#292C2F] text-rose-400 border border-[#51504A] shadow-sm">
                              <span>✕ Mavjud emas</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Buyurtma miqdorini boshqarish */}
                      <div className="p-4 rounded-lg bg-[#292C2F] border border-[#51504A] space-y-3 mt-2">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-[#B8B8B3] uppercase tracking-wider">Buyurtma Miqdori:</span>
                          <span className="text-[#FFB800] font-mono text-sm">
                            Jami: {formatPrice(selectedItem.product.price * selectedItem.quantity)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-3">
                          <div className="inline-flex items-center gap-3 bg-[#151719] px-3.5 py-1.5 rounded-lg border border-[#51504A]">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onUpdateQuantity(selectedItem.product.id, Math.max(1, selectedItem.quantity - 1));
                              }}
                              className="p-1 text-[#B8B8B3] hover:text-[#F5F5F2] rounded hover:bg-[#292C2F] transition-colors cursor-pointer"
                              title="Kamaytirish"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="text-base sm:text-lg font-bold text-[#F5F5F2] px-2 min-w-[36px] text-center font-mono">
                              {selectedItem.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onUpdateQuantity(selectedItem.product.id, selectedItem.quantity + 1);
                              }}
                              className="p-1 text-[#B8B8B3] hover:text-[#F5F5F2] rounded hover:bg-[#292C2F] transition-colors cursor-pointer"
                              title="Oshirish"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="text-right">
                            <div className="text-xs text-[#B8B8B3] font-bold font-mono">
                              {selectedItem.quantity} {selectedItem.product.unit}
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Qo'shimcha parametrlar (Ranglar, O'lchov, Og'irlik, Uzunlik) */}
                  {((selectedItem.product.colors && selectedItem.product.colors.length > 0) ||
                    (selectedItem.product.sizes && selectedItem.product.sizes.length > 0) ||
                    (selectedItem.product.weights && selectedItem.product.weights.length > 0) ||
                    (selectedItem.product.lengths && selectedItem.product.lengths.length > 0)) && (
                    <div className="p-4 rounded-lg bg-[#292C2F] border border-[#51504A] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      {selectedItem.product.colors && selectedItem.product.colors.length > 0 && (
                        <div className="space-y-1.5">
                          <div className="text-xs text-[#B8B8B3] font-bold uppercase tracking-wider">Ranglar:</div>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedItem.product.colors.map((c, i) => {
                              const colStyle = getColorPaletteItem(c);
                              return (
                                <span
                                  key={i}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border border-white/30 shadow-sm"
                                  style={{ backgroundColor: colStyle.bg, color: colStyle.text }}
                                >
                                  <span
                                    className="w-3 h-3 rounded-full border border-current/40 shrink-0"
                                    style={{ backgroundColor: colStyle.bg }}
                                  />
                                  <span>{c}</span>
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      {selectedItem.product.sizes && selectedItem.product.sizes.length > 0 && (
                        <div className="space-y-1.5">
                          <div className="text-xs text-[#B8B8B3] font-bold uppercase tracking-wider">O'lchov:</div>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedItem.product.sizes.map((s, i) => (
                              <span
                                key={i}
                                className="px-2.5 py-1 rounded text-xs font-bold bg-[#151719] text-[#FFB800] border border-[#51504A] font-mono"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {selectedItem.product.weights && selectedItem.product.weights.length > 0 && (
                        <div className="space-y-1.5">
                          <div className="text-xs text-[#B8B8B3] font-bold uppercase tracking-wider">Og'irlik:</div>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedItem.product.weights.map((w, i) => (
                              <span
                                key={i}
                                className="px-2.5 py-1 rounded text-xs font-bold bg-[#151719] text-[#FFB800] border border-[#51504A] font-mono"
                              >
                                {w}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {selectedItem.product.lengths && selectedItem.product.lengths.length > 0 && (
                        <div className="space-y-1.5">
                          <div className="text-xs text-[#B8B8B3] font-bold uppercase tracking-wider">Uzunlik:</div>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedItem.product.lengths.map((l, i) => (
                              <span
                                key={i}
                                className="px-2.5 py-1 rounded text-xs font-bold bg-[#151719] text-[#FFB800] border border-[#51504A] font-mono"
                              >
                                {l}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Izoh va Tavsif (300 tagacha harf) */}
                  {selectedItem.product.description && (
                    <div className="p-4 rounded-lg bg-[#292C2F] border border-[#51504A] space-y-1.5">
                      <div className="text-xs text-[#B8B8B3] font-bold uppercase tracking-wider">
                        Mahsulot Izohi va Tavsifi:
                      </div>
                      <p className="text-xs sm:text-sm text-[#F5F5F2] leading-relaxed">
                        {selectedItem.product.description}
                      </p>
                    </div>
                  )}

                </div>

                {/* Yon (O'ng) Blok: Savatdagi Qolgan Mahsulotlar */}
                <div className="lg:col-span-5 xl:col-span-4 bg-[#0A1931] rounded-xl border-2 border-[#1E3A6D] p-5 sm:p-6 text-white shadow-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-[#1E3A6D] pb-3.5">
                    <div>
                      <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                        Savatdagi Qolgan Mahsulotlar
                      </h4>
                      <p className="text-xs text-sky-200 mt-0.5">
                        Ma'lumotlarini ko'rish uchun tanlang
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold bg-[#071326] px-3 py-1 rounded-lg text-[#FFB800] border border-[#1E3A6D]">
                      {otherItems.length} ta
                    </span>
                  </div>

                  {otherItems.length === 0 ? (
                    <div className="py-12 text-center space-y-3">
                      <Package className="w-12 h-12 text-sky-300/50 mx-auto" />
                      <p className="text-xs text-sky-200 max-w-[240px] mx-auto">
                        Savatda boshqa mahsulot yo'q. Faqat ushbu tanlangan mahsulot mavjud.
                      </p>
                      <button
                        type="button"
                        onClick={() => setSelectedProductId(null)}
                        className="bg-[#132C54] hover:bg-[#1B3B6F] text-white border border-[#2E5A9C] px-4 py-2 rounded-lg text-xs font-bold cursor-pointer"
                      >
                        Jadval ko'rinishiga qaytish
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
                      {otherItems.map((other) => (
                        <div
                          key={other.product.id}
                          onClick={() => {
                            setSelectedProductId(other.product.id);
                            setActiveImageIndex(0);
                          }}
                          className="p-3.5 rounded-lg bg-[#0F2547] hover:bg-[#132C54] border border-[#1E3A6D] hover:border-[#FFB800] transition-all cursor-pointer flex items-center justify-between gap-3 group shadow-sm"
                          title="Ushbu mahsulot tafsilotlarini ko'rish"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={other.product.image}
                              alt={other.product.title}
                              className="w-12 h-12 rounded-lg object-cover shrink-0 bg-[#071326] border border-[#254B85] group-hover:scale-105 transition-transform"
                            />
                            <div className="min-w-0 space-y-1">
                              <h5 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-[#FFB800] transition-colors">
                                {other.product.title}
                              </h5>
                              <div className="text-[11px] text-sky-200">
                                {other.quantity} {other.product.unit} •{' '}
                                <span className="font-mono text-[#FFB800] font-bold">
                                  {formatPrice(other.product.price * other.quantity)}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-1 text-xs text-[#FFB800] font-bold group-hover:translate-x-1 transition-transform">
                            <span>Ko'rish</span>
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>
          ) : (
            /* ============================================================ */
            /* 2-REJIM: TO'LIQ JADVAL KO'RINISHI (Tanlangan Qurilish Mahsulotlari) */
            /* ============================================================ */
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#0A1931] flex items-center gap-2">
                  <Package className="w-4 h-4 text-[#0A1931]" />
                  <span>Tanlangan Qurilish Mahsulotlari</span>
                </h3>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-white font-mono font-bold bg-[#0A1931] px-3.5 py-1.5 rounded-lg border border-[#1E3A6D] shadow-sm">
                    Jami: {items.length} xil mahsulot
                  </span>
                </div>
              </div>

              {/* To'liq Kengaytirilgan Jadval: Tyomniy Siniy */}
              <div className="overflow-x-auto rounded-xl border-2 border-[#1E3A6D] bg-[#0A1931] shadow-xl text-white">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-[#071326] border-b border-[#1E3A6D] text-xs sm:text-sm font-bold uppercase tracking-wider text-sky-200">
                      <th className="py-4 px-5 text-center w-14">№</th>
                      <th className="py-4 px-5 min-w-[260px]">Mahsulot Nomi</th>
                      <th className="py-4 px-5 min-w-[220px]">Ta'minotchi Manzili</th>
                      <th className="py-4 px-5 whitespace-nowrap text-right min-w-[130px]">Narxi</th>
                      <th className="py-4 px-5 text-center whitespace-nowrap min-w-[150px]">Buyurtma Miqdori</th>
                      <th className="py-4 px-5 whitespace-nowrap text-right min-w-[140px]">Umumiy Narx</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E3A6D] text-xs sm:text-sm md:text-base bg-[#0A1931]">
                    {items.map((item, idx) => {
                      const supplierAddr = getSupplierAddress(item);

                      return (
                        <tr
                          key={item.product.id}
                          onClick={() => {
                            setSelectedProductId(item.product.id);
                            setActiveImageIndex(0);
                          }}
                          className="hover:bg-[#292C2F] transition-colors cursor-pointer group"
                          title="Batafsil ma'lumotlarini ko'rish uchun bosing"
                        >
                          {/* 1. № */}
                          <td className="py-4 px-5 text-center text-[#B8B8B3] font-mono font-bold text-sm sm:text-base align-middle">
                            {idx + 1}
                          </td>

                          {/* 2. Mahsulot Nomi */}
                          <td className="py-4 px-5 align-middle">
                            <div className="flex items-center gap-3.5">
                              <img
                                src={item.product.image}
                                alt={item.product.title}
                                className="w-12 h-12 rounded-lg object-cover shrink-0 bg-[#151719] border border-[#51504A] shadow-sm group-hover:scale-105 transition-transform"
                              />
                              <div className="space-y-1">
                                <span className="font-bold text-[#F5F5F2] text-sm sm:text-base leading-snug line-clamp-2 group-hover:text-[#FFB800] transition-colors">
                                  {item.product.title}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="inline-block text-xs text-[#FFB800] font-mono font-bold">
                                    {item.product.category}
                                  </span>
                                  <span className="text-[11px] text-[#B8B8B3] opacity-80 group-hover:opacity-100 font-medium">
                                    (Batafsil →)
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* 3. Ta'minotchi Manzili */}
                          <td className="py-4 px-5 align-middle">
                            <div className="space-y-1 max-w-[240px]">
                              <div
                                className="font-bold text-[#F5F5F2] text-xs sm:text-sm truncate"
                                title={item.product.supplierName || "Rasmiy Ta'minotchi"}
                              >
                                {item.product.supplierName || "Rasmiy Ta'minotchi"}
                              </div>
                              <div
                                className="flex items-center gap-1.5 text-xs text-[#B8B8B3] truncate"
                                title={supplierAddr}
                              >
                                <MapPin className="w-3.5 h-3.5 text-[#FFB800] shrink-0" />
                                <span className="truncate">{supplierAddr}</span>
                              </div>
                            </div>
                          </td>

                          {/* 4. Narxi */}
                          <td className="py-4 px-5 text-right whitespace-nowrap align-middle">
                            <div className="font-bold text-[#F5F5F2] text-sm sm:text-base font-mono">
                              {formatPrice(item.product.price)}
                            </div>
                            <div className="text-xs text-[#B8B8B3] font-mono mt-0.5">
                              1 {item.product.unit} uchun
                            </div>
                          </td>

                          {/* 5. Buyurtma Miqdori */}
                          <td
                            className="py-4 px-5 text-center align-middle whitespace-nowrap"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="inline-flex items-center gap-2 bg-[#151719] px-3 py-1.5 rounded-lg border border-[#51504A]">
                              <button
                                type="button"
                                onClick={() => onUpdateQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                                className="p-1 text-[#B8B8B3] hover:text-[#F5F5F2] rounded hover:bg-[#292C2F] transition-colors cursor-pointer"
                                title="Kamaytirish"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="text-sm sm:text-base font-bold text-[#F5F5F2] px-2.5 min-w-[32px] text-center font-mono">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                                className="p-1 text-[#B8B8B3] hover:text-[#F5F5F2] rounded hover:bg-[#292C2F] transition-colors cursor-pointer"
                                title="Oshirish"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="text-xs text-[#B8B8B3] mt-1 font-bold font-mono">
                              {item.quantity} {item.product.unit}
                            </div>
                          </td>

                          {/* 6. Umumiy Narx */}
                          <td className="py-4 px-5 text-right whitespace-nowrap align-middle">
                            <div className="text-sm sm:text-base md:text-lg font-bold text-[#FFB800] font-mono">
                              {formatPrice(item.product.price * item.quantity)}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>

                  {/* Jadval Tagidagi Umumiy Narx Qatori */}
                  <tfoot className="bg-[#071326] border-t border-[#1E3A6D] font-bold">
                    <tr>
                      <td
                        colSpan={3}
                        className="py-4 px-6 text-left text-sky-200 uppercase tracking-wider text-xs sm:text-sm font-semibold"
                      >
                        Jami: {items.reduce((s, i) => s + i.quantity, 0)} ta birlik tovar | {items.length} xil mahsulot
                      </td>
                      <td
                        colSpan={2}
                        className="py-4 px-4 text-right text-[#FFB800] uppercase tracking-wider font-bold text-xs sm:text-sm"
                      >
                        Umumiy Narx:
                      </td>
                      <td className="py-4 px-5 text-right text-base sm:text-xl md:text-2xl text-[#FFB800] font-mono font-bold whitespace-nowrap">
                        {formatPrice(grandTotal)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3.5 rounded-lg bg-red-500/15 text-red-500 border border-red-500/40 text-xs font-black animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer actions: Tyomniy Siniy panel, Buyurtma berish tugmasi SARIQ */}
        {items.length > 0 && (
          <div className="px-6 sm:px-8 py-5 border-t-2 border-[#1E3A6D] bg-gradient-to-r from-[#0A1931] to-[#071326] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-baseline gap-3">
              <span className="text-xs sm:text-sm text-sky-200 font-bold uppercase tracking-wider">
                To'lanadigan Jami Summa:
              </span>
              <span className="text-xl sm:text-2xl md:text-3xl font-bold text-[#FFB800] font-mono tracking-tight">
                {formatPrice(grandTotal)}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="bg-[#132C54] hover:bg-[#1B3B6F] text-white border border-[#2E5A9C] px-5 py-3 rounded-lg text-xs sm:text-sm font-bold cursor-pointer transition-colors"
              >
                Bekor qilish
              </button>

              <button
                type="button"
                onClick={handleStartCheckout}
                disabled={loading}
                className="bg-[#FFB800] hover:bg-[#FFC928] text-black border border-[#E5A600] flex items-center gap-2.5 px-6 sm:px-8 py-3 rounded-lg font-black text-sm sm:text-base shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer transition-all"
              >
                <CheckCircle className="w-5 h-5 stroke-[2.5] text-black" />
                <span>Buyurtma berish</span>
              </button>
            </div>
          </div>
        )}

      </div>

      {/* 4-bosqichli Jismoniy shaxs buyurtma berish darchasi */}
      {isCheckoutOpen && (
        <CheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          items={items}
          user={user}
          onUserUpdate={onUserUpdate}
          onUpdateQuantity={onUpdateQuantity}
          onRemoveItem={onRemoveItem}
          onClearCart={onClearCart}
          onOrderCompleted={(order) => {
            setIsCheckoutOpen(false);
            onClose();
            onOrderSuccess(order.id);
          }}
          onOpenAuth={onOpenAuth}
        />
      )}

      {/* Katta ekran (Full Screen) rasm ko'rish modali */}
      {fullscreenImage && (
        <div
          className="fixed inset-0 z-[100] w-screen h-screen bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-fadeIn"
          onClick={() => setFullscreenImage(null)}
        >
          <button
            type="button"
            onClick={() => setFullscreenImage(null)}
            className="absolute top-4 right-4 px-4 py-2.5 rounded-xl bg-[#222528] hover:bg-red-600 text-[#F5F5F2] border border-[#51504A] font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer shadow-2xl"
          >
            <X className="w-5 h-5" />
            <span>Yopish</span>
          </button>
          <img
            src={fullscreenImage}
            alt="Katta ekran"
            onClick={(e) => e.stopPropagation()}
            className="max-w-[95vw] max-h-[90vh] object-contain rounded-xl border border-[#51504A] shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};
