import React, { useState } from 'react';
import { MapPin, Search, ExternalLink, Navigation, Compass, Layers, Sparkles, Building, Loader2 } from 'lucide-react';
import { MapPlace } from '../types';

export const MapsGroundingView: React.FC = () => {
  const [query, setQuery] = useState('Toshkentdagi eng yirik qurilish mollari bozorlari va omborlari');
  const [loading, setLoading] = useState(false);
  const [resultText, setResultText] = useState<string>('');
  const [places, setPlaces] = useState<MapPlace[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);

  const presetQueries = [
    { label: 'Qurilish Bozorlari', text: 'Toshkentdagi eng yirik qurilish mollari bozorlari (O‘rikzor, Bekto‘pi, Qoraqamish)' },
    { label: 'Beton Zavodlari', text: 'Toshkent shahri va viloyatidagi yirik tayyor beton (RBU) zavodlari' },
    { label: 'Sement & Metall Omborlari', text: 'Sergeli va Chilonzor hududidagi ulgurji sement va armatura omborlari' },
    { label: 'Qum-Shag‘al Karyerlari', text: 'Keles va Chirchiq daryosi bo‘yidagi qum va shag‘al karyerlari' },
  ];

  const detectLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setLocating(false);
      },
      (err) => {
        console.warn('Geolocation denied or unavailable:', err);
        setLocating(false);
      }
    );
  };

  const handleSearch = async (searchQuery: string = query) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setResultText('');
    setPlaces([]);

    try {
      const res = await fetch('/api/maps/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          latitude: userLocation?.lat,
          longitude: userLocation?.lng,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setResultText(data.text);
        setPlaces(data.places || []);
      } else {
        setResultText("Google Maps ma'lumotlarini olishda xatolik yuz berdi.");
      }
    } catch (err) {
      console.error('Maps search error:', err);
      setResultText("Tarmoq xatosi. Iltimos qayta urinib ko'ring.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 p-6 sm:p-10 rounded-3xl border border-sky-500/30 shadow-2xl">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-semibold border border-sky-500/30">
            <Compass className="w-4 h-4 text-sky-400" />
            Google Maps Grounding & Geografik Monitoring
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Qurilish Bozorlari, Zavodlar & <span className="text-sky-400">Logistika Xaritasi</span>
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Google Maps real vaqt ma'lumotlari orqali eng yaqin qurilish mollari bozorlari, beton uzellari, g'isht zavodlari va qum karyerlarini toping hamda to'g'ridan-to'g'ri xaritada marshrut quring.
          </p>
        </div>
      </div>

      {/* Search Bar & Geolocation */}
      <div className="bg-slate-800/80 p-5 rounded-3xl border border-slate-700/80 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Qidiruv"
              className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-sky-500 text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={detectLocation}
              disabled={locating}
              className={`px-3.5 py-3 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                userLocation
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
              title="Mening joylashuvimni aniqlash"
            >
              <Navigation className="w-4 h-4 text-sky-400" />
              <span className="hidden sm:inline">
                {userLocation ? 'Joylashuv aniqlandi' : locating ? 'Aniqlanmoqda...' : 'Joylashuvim'}
              </span>
            </button>

            <button
              onClick={() => handleSearch()}
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs shadow-md shadow-sky-500/20 flex items-center gap-2 active:scale-95 transition-all"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span>Qidirish</span>
            </button>
          </div>
        </div>

        {/* Preset chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[11px] font-semibold text-slate-400 shrink-0 mr-1">Tavsiya so‘rovlar:</span>
          {presetQueries.map((pq, i) => (
            <button
              key={i}
              onClick={() => {
                setQuery(pq.text);
                handleSearch(pq.text);
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-700/80 text-sky-300 hover:text-white border border-slate-700 text-xs font-medium whitespace-nowrap transition-colors"
            >
              {pq.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grounding Results Display */}
      {(loading || resultText || places.length > 0) && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Grounded Places Cards (Mandatory Links) */}
          {places.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-sky-400" />
                Google Maps Aniq Geografik Havolalari ({places.length} ta joy):
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {places.map((place, idx) => (
                  <a
                    key={idx}
                    href={place.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-4 rounded-2xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700 hover:border-sky-500/60 transition-all flex items-start justify-between gap-3 group shadow-md"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-white group-hover:text-sky-300 transition-colors">
                        <Building className="w-4 h-4 text-sky-400 shrink-0" />
                        <span className="truncate">{place.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-400">Google Xaritasida ochish va marshrut tuzish</p>
                    </div>
                    <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 group-hover:bg-sky-500 group-hover:text-slate-950 transition-all shrink-0">
                      <ExternalLink className="w-4 h-4" />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* AI Grounded Insights text */}
          {resultText && (
            <div className="bg-slate-800/80 p-6 rounded-3xl border border-slate-700 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-sky-400" />
                Google Maps Grounding Tahlili & Tavsiyalar
              </h3>

              <div className="prose prose-invert max-w-none text-slate-200 text-sm leading-relaxed whitespace-pre-line bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                {resultText}
              </div>
            </div>
          )}

          {loading && (
            <div className="p-8 text-center bg-slate-800/40 rounded-2xl border border-slate-700 space-y-3">
              <Loader2 className="w-8 h-8 text-sky-400 animate-spin mx-auto" />
              <p className="text-sm text-slate-300 font-medium">
                Gemini 3.5 Flash Google Maps orqali O'zbekiston qurilish ob'ektlarini aniqlamoqda...
              </p>
            </div>
          )}

        </div>
      )}

      {!loading && !resultText && places.length === 0 && (
        <div className="p-8 text-center bg-slate-800/30 rounded-3xl border border-dashed border-slate-700/80 space-y-2">
          <p className="text-sm text-slate-400">Yuqoridagi so‘rovlardan birini tanlang yoki o‘z manzilingiz bo‘yicha qidiruv bering.</p>
        </div>
      )}

    </div>
  );
};
