import React, { useState } from 'react';
import { 
  Globe, 
  ShieldCheck, 
  Truck, 
  Building2, 
  FileText, 
  Train, 
  Send, 
  CheckCircle2, 
  Download, 
  HelpCircle, 
  X, 
  MapPin, 
  Phone, 
  Mail,
  BadgeCheck,
  TrendingUp,
  Layers,
  Container
} from 'lucide-react';

interface GlobalPartner {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  category: string;
  materials: string[];
  capacity: string;
  transitTime: string;
  deliveryMethod: string;
  certified: string;
  status: 'active' | 'in_transit' | 'approved';
}

const INITIAL_GLOBAL_PARTNERS: GlobalPartner[] = [
  {
    id: 'gp-1',
    name: 'Heidelberg Materials AG',
    country: 'Germaniya',
    countryCode: 'DE',
    category: 'Sement Klinkeri & Maxsus Bog‘lovchilar',
    materials: ['Portlandshement M600-D0', 'Sulfatga chidamli klinker', 'Gidrotexnik sement'],
    capacity: '25,000 tonna / oy',
    transitTime: '12-16 kun',
    deliveryMethod: 'Temir yo‘l hopper vagonlari',
    certified: 'ISO 9001, EN 197-1, GOST 31108',
    status: 'active'
  },
  {
    id: 'gp-2',
    name: 'POSCO Steel Corporation',
    country: 'Janubiy Koreya',
    countryCode: 'KR',
    category: 'Konstruksion Metall & Yuqori Markali Armatura',
    materials: ['Armatura A500C / A600C', 'Dvuhtavr (Beam)', 'Issiq prokat listli po‘lat'],
    capacity: '18,000 tonna / oy',
    transitTime: '18-22 kun',
    deliveryMethod: 'Multimodal (Dengiz + TY Container)',
    certified: 'ASTM A615, KS D 3504, GOST 5781',
    status: 'active'
  },
  {
    id: 'gp-3',
    name: 'Saint-Gobain Weber',
    country: 'Fransiya',
    countryCode: 'FR',
    category: 'Izolyatsiya & Akustik Qoplamalar',
    materials: ['Bazalt mineral plitalar', 'Akustik gipsokarton', 'Fasad namlik to‘siqlari'],
    capacity: '12,000 kv.m / oy',
    transitTime: '10-14 kun',
    deliveryMethod: 'TIR Avto-fura va TY vagon',
    certified: 'CE Mark, ISO 14001, GOST 9573',
    status: 'active'
  },
  {
    id: 'gp-4',
    name: 'Knauf Gips KG',
    country: 'Germaniya / MDH',
    countryCode: 'DE',
    category: 'Gips Aralashmalari & Konstruktiv Profillar',
    materials: ['Rotband mashinali suvoq', 'Namga chidamli gips plitalar', 'Ruxlangan metall profil'],
    capacity: '35,000 tonna / oy',
    transitTime: '4-7 kun',
    deliveryMethod: 'To‘g‘ridan-to‘g‘ri blok poyezdlar',
    certified: 'DIN 18180, GOST 6266',
    status: 'active'
  },
  {
    id: 'gp-5',
    name: 'Holcim Group',
    country: 'Shveytsariya',
    countryCode: 'CH',
    category: 'Maxsus Kimyoviy Qo‘shimchalar & Superplastifikatorlar',
    materials: ['Sovuqqa qarshi qo‘shimchalar (-25°C)', 'Yuqori mustahkamlik giperplastifikatorlari', 'Gidrofoblashtiruvchi moddalar'],
    capacity: '5,000 tonna / oy',
    transitTime: '8-12 kun',
    deliveryMethod: 'Evro-kub va sisterna vagonlar',
    certified: 'EN 934-2, ISO 9001',
    status: 'active'
  },
  {
    id: 'gp-6',
    name: 'Magnitogorsk Metallurgiya Kombinati (MMK)',
    country: 'Rossiya',
    countryCode: 'RU',
    category: 'Og‘ir Prokat & Quvurlar',
    materials: ['Katta diametrli po‘lat quvurlar', 'Shveller 10-30', 'Ugolnik 50x50 - 160x160'],
    capacity: '30,000 tonna / oy',
    transitTime: '5-9 kun',
    deliveryMethod: 'Ochiq yarim-vagonlar (TY)',
    certified: 'GOST 8509, GOST 8240, ISO 9001',
    status: 'active'
  }
];

export const GlobalBunkerHub: React.FC = () => {
  const [partners] = useState<GlobalPartner[]>(INITIAL_GLOBAL_PARTNERS);
  const [selectedPartner, setSelectedPartner] = useState<GlobalPartner | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [countryFilter, setCountryFilter] = useState('all');

  // Order form state
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [requestedMaterial, setRequestedMaterial] = useState('');
  const [requestedVolume, setRequestedVolume] = useState('');
  const [destinationHub, setDestinationHub] = useState('Toshkent-Tovarniy (TY kodi: 722400)');
  const [orderSent, setOrderSent] = useState(false);

  const filtered = partners.filter((p) => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      p.category.toLowerCase().includes(searchFilter.toLowerCase()) ||
      p.materials.some((m) => m.toLowerCase().includes(searchFilter.toLowerCase()));
    const matchesCountry = countryFilter === 'all' || p.country === countryFilter;
    return matchesSearch && matchesCountry;
  });

  const countries = Array.from(new Set(partners.map((p) => p.country)));

  const handleOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOrderSent(true);
    setTimeout(() => {
      setOrderSent(false);
      setIsOrderModalOpen(false);
      setSelectedPartner(null);
      setCompanyName('');
      setContactName('');
      setPhone('');
      setRequestedMaterial('');
      setRequestedVolume('');
    }, 2200);
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn text-[#F5F5F2]">
      
      {/* Top Banner: Global Bunker International Industrial Platform */}
      <div className="relative overflow-hidden rounded-xl brushed-steel border border-[#51504A] p-6 sm:p-8 shadow-xl">
        <div className="absolute top-2.5 left-2.5 industrial-rivet" />
        <div className="absolute top-2.5 right-2.5 industrial-rivet" />
        <div className="absolute bottom-2.5 left-2.5 industrial-rivet" />
        <div className="absolute bottom-2.5 right-2.5 industrial-rivet" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded bg-[#222528] border border-[#FFB800] text-[#FFB800] text-[11px] font-mono font-bold tracking-wider uppercase flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" />
                GLOBAL BUNKER B2B
              </span>
              <span className="text-xs text-[#B8B8B3] font-mono uppercase tracking-wider">
                Xalqaro Qurilish Xomashyosi & Transchegaraviy Ta'minot
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#F5F5F2] tracking-tight leading-tight">
              Dunyoning Yetakchi Ishlab Chiqaruvchilaridan To‘g‘ridan-To‘g‘ri Ta'minot
            </h1>

            <p className="text-xs sm:text-sm text-[#B8B8B3] leading-relaxed">
              Yevropa, Janubiy Koreya va MDH sanoat gigantlaridan to‘g‘ridan-to‘g‘ri vagon va konteyner partiyalari. 
              Bojxona rasmiylashtiruvi, laboratoriya sifat sertifikatlari va O‘zbekiston temir yo‘llari bo‘ylab kafolatli yetkazib berish.
            </p>

            <div className="flex items-center gap-4 pt-1 flex-wrap text-xs font-mono text-[#FFB800]">
              <span className="flex items-center gap-1.5 bg-[#151719] px-3 py-1.5 rounded-lg border border-[#51504A]">
                <Train className="w-4 h-4 text-[#FFB800]" />
                Temir Yo‘l & Multimodal
              </span>
              <span className="flex items-center gap-1.5 bg-[#151719] px-3 py-1.5 rounded-lg border border-[#51504A]">
                <ShieldCheck className="w-4 h-4 text-[#FFB800]" />
                100% Rasmiy Akkreditiv & Shartnoma
              </span>
              <span className="flex items-center gap-1.5 bg-[#151719] px-3 py-1.5 rounded-lg border border-[#51504A]">
                <BadgeCheck className="w-4 h-4 text-[#FFB800]" />
                ISO / EN / GOST Kafolati
              </span>
            </div>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row lg:flex-col gap-3">
            <button
              onClick={() => {
                setSelectedPartner(null);
                setIsOrderModalOpen(true);
              }}
              className="btn-industrial-yellow px-6 py-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer whitespace-nowrap active:scale-95 transition-all"
            >
              <FileText className="w-4 h-4 stroke-[2.5]" />
              <span>Import So‘rovi Yuborish</span>
            </button>
            <div className="p-3 bg-[#151719] border border-[#51504A] rounded-xl text-center">
              <span className="text-[10px] uppercase font-mono text-[#B8B8B3] block">Bojxona & Logistika Aloqasi</span>
              <span className="text-xs font-mono font-bold text-[#F5F5F2]">+998 (71) 200-00-50</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 sm:p-4 rounded-xl bg-[#222528] border border-[#51504A] shadow-md flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex-1 flex items-center gap-2">
          <input
            type="text"
            placeholder="Kompaniya, xomashyo turi yoki brend nomi..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full px-4 py-2.5 bg-[#151719] border border-[#51504A] rounded-lg text-xs text-[#F5F5F2] placeholder-[#B8B8B3]/60 focus:outline-none focus:border-[#FFB800]"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0 text-xs">
          <button
            onClick={() => setCountryFilter('all')}
            className={`px-3 py-2 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
              countryFilter === 'all'
                ? 'bg-[#FFB800] text-[#151719]'
                : 'bg-[#151719] text-[#B8B8B3] hover:text-[#F5F5F2] border border-[#51504A]'
            }`}
          >
            Barcha Davlatlar ({partners.length})
          </button>
          {countries.map((c) => (
            <button
              key={c}
              onClick={() => setCountryFilter(c)}
              className={`px-3 py-2 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                countryFilter === c
                  ? 'bg-[#FFB800] text-[#151719]'
                  : 'bg-[#151719] text-[#B8B8B3] hover:text-[#F5F5F2] border border-[#51504A]'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Global Partners Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((partner) => (
          <div
            key={partner.id}
            className="bg-[#222528] border border-[#51504A] hover:border-[#FFB800] rounded-xl p-5 shadow-lg flex flex-col justify-between space-y-4 group transition-all"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-lg bg-[#151719] border border-[#51504A] group-hover:border-[#FFB800] flex items-center justify-center text-[#FFB800] shrink-0 font-mono font-black text-sm">
                    {partner.countryCode}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#F5F5F2] group-hover:text-[#FFB800] transition-colors">
                      {partner.name}
                    </h3>
                    <span className="text-xs text-[#B8B8B3] flex items-center gap-1 font-mono">
                      <MapPin className="w-3 h-3 text-[#FFB800]" />
                      {partner.country}
                    </span>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shrink-0">
                  Faol Ta'minot
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-[#151719] border border-[#51504A] space-y-1">
                <span className="text-[10px] uppercase font-mono text-[#B8B8B3] block">Asosiy Kategoriya:</span>
                <span className="text-xs font-bold text-[#F5F5F2] block">{partner.category}</span>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-mono text-[#B8B8B3]">Yetkazib Beriladigan Mahsulotlar:</span>
                <div className="flex flex-wrap gap-1.5">
                  {partner.materials.map((m, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-[#292C2F] border border-[#51504A] text-[11px] text-[#F5F5F2]"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-2 border-t border-[#51504A]">
                <div>
                  <span className="text-[#B8B8B3] block text-[10px]">Oylik Quvvat:</span>
                  <span className="text-[#F5F5F2] font-bold">{partner.capacity}</span>
                </div>
                <div>
                  <span className="text-[#B8B8B3] block text-[10px]">Tranzit Muddati:</span>
                  <span className="text-[#FFB800] font-bold">{partner.transitTime}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[#B8B8B3] block text-[10px]">Transport:</span>
                  <span className="text-[#F5F5F2]">{partner.deliveryMethod}</span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  setSelectedPartner(partner);
                  setRequestedMaterial(partner.materials[0] || partner.category);
                  setIsOrderModalOpen(true);
                }}
                className="btn-industrial-dark group-hover:btn-industrial-yellow w-full py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm"
              >
                <Container className="w-4 h-4" />
                <span>Import Shartnoma So‘rovi</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Inquiry / Import Order Modal */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div 
            className="w-full max-w-xl bg-[#222528] border-2 border-[#FFB800] rounded-xl shadow-2xl p-6 sm:p-7 space-y-5 relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsOrderModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-[#292C2F] text-[#B8B8B3] hover:text-[#F5F5F2] border border-[#51504A] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-[#151719] border border-[#FFB800] text-[#FFB800]">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#F5F5F2]">Global Bunker Import Buyurtmasi</h2>
                <p className="text-xs text-[#B8B8B3]">
                  {selectedPartner ? `${selectedPartner.name} (${selectedPartner.country}) orqali` : 'Xalqaro to‘g‘ridan-to‘g‘ri ta’minot shartnomasi'}
                </p>
              </div>
            </div>

            {orderSent ? (
              <div className="p-8 text-center space-y-3 bg-[#151719] rounded-xl border border-emerald-500/50 animate-fadeIn">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <h3 className="text-base font-bold text-white">Import So‘rovi Muvaffaqiyatli Qabul Qilindi!</h3>
                <p className="text-xs text-[#B8B8B3] max-w-md mx-auto">
                  BunkerStroy xalqaro savdo departamenti va bojxona brokerlari 2 ish soati ichida siz bilan bog‘lanadi hamda tijoriy taklif (Incoterms 2020) yuboradi.
                </p>
              </div>
            ) : (
              <form onSubmit={handleOrderSubmit} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="text-[#F5F5F2] font-bold">Kompaniya yoki Bosh Pudratchi Nomi:</label>
                  <input
                    type="text"
                    required
                    placeholder="MCHJ 'Modern Stroy Invest'"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#151719] border border-[#51504A] rounded-lg text-[#F5F5F2] focus:outline-none focus:border-[#FFB800]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[#F5F5F2] font-bold">Mas'ul Shaxs:</label>
                    <input
                      type="text"
                      required
                      placeholder="Shavkat Rahimov"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#151719] border border-[#51504A] rounded-lg text-[#F5F5F2] focus:outline-none focus:border-[#FFB800]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[#F5F5F2] font-bold">Telefon Raqami:</label>
                    <input
                      type="text"
                      required
                      placeholder="+998 90 123 45 67"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#151719] border border-[#51504A] rounded-lg text-[#F5F5F2] font-mono focus:outline-none focus:border-[#FFB800]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[#F5F5F2] font-bold">Xomashyo Turi / Markasi:</label>
                    <input
                      type="text"
                      required
                      placeholder="Armatura A500C yoki Klinker M600"
                      value={requestedMaterial}
                      onChange={(e) => setRequestedMaterial(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#151719] border border-[#51504A] rounded-lg text-[#F5F5F2] focus:outline-none focus:border-[#FFB800]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[#F5F5F2] font-bold">Talab Qilingan Hajm:</label>
                    <input
                      type="text"
                      required
                      placeholder="Masalan: 500 tonna / 8 vagon"
                      value={requestedVolume}
                      onChange={(e) => setRequestedVolume(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#151719] border border-[#51504A] rounded-lg text-[#F5F5F2] focus:outline-none focus:border-[#FFB800]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[#F5F5F2] font-bold">Yetkazish va Bojxona Qabul Stansiyasi:</label>
                  <select
                    value={destinationHub}
                    onChange={(e) => setDestinationHub(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#151719] border border-[#51504A] rounded-lg text-[#F5F5F2] focus:outline-none focus:border-[#FFB800] cursor-pointer"
                  >
                    <option value="Toshkent-Tovarniy (TY kodi: 722400)">Toshkent-Tovarniy (TY kodi: 722400)</option>
                    <option value="Chuqursoy Bojxona Posti (TY kodi: 720000)">Chuqursoy Bojxona Posti (TY kodi: 720000)</option>
                    <option value="Sergeli Logistika Markazi (TY kodi: 723507)">Sergeli Logistika Markazi (TY kodi: 723507)</option>
                    <option value="Samarqand TY Stansiyasi">Samarqand TY Stansiyasi</option>
                    <option value="Navoiy EIZ Erkin Bojxona Hududi">Navoiy EIZ Erkin Bojxona Hududi</option>
                  </select>
                </div>

                <div className="p-3 bg-[#151719] rounded-lg border border-[#51504A] text-[11px] text-[#B8B8B3]">
                  ℹ️ Shartnoma to‘g‘ridan-to‘g‘ri BunkerStroy xalqaro akkreditiv tizimi va O‘zbekiston Respublikasi Tashqi Savdo Qonunchiligiga muvofiq rasmiylashtiriladi.
                </div>

                <button
                  type="submit"
                  className="btn-industrial-yellow w-full py-3 rounded-lg font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <Send className="w-4 h-4 stroke-[2.5]" />
                  <span>Ariza va Shartnoma So‘rovini Tasdiqlash</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
