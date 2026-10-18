import React, { useState } from 'react';
import { Truck, Phone, Navigation, Clock, CheckCircle2, AlertCircle, Compass, Calculator } from 'lucide-react';
import { LogisticsVehicle } from '../types';
import { INITIAL_VEHICLES } from '../data/mockData';

export const LogisticsHub: React.FC = () => {
  const [vehicles] = useState<LogisticsVehicle[]>(INITIAL_VEHICLES);
  const [selectedVehicle, setSelectedVehicle] = useState<LogisticsVehicle>(INITIAL_VEHICLES[0]);
  const [distanceKm, setDistanceKm] = useState<number>(25);
  const [weightTons, setWeightTons] = useState<number>(15);
  const [origin, setOrigin] = useState<string>('Keles daryosi qum karyeri');
  const [destination, setDestination] = useState<string>('Toshkent sh., Yunusobod 14-mavze, yangi turar joy');
  const [dispatchedSuccess, setDispatchedSuccess] = useState<boolean>(false);

  const calculateCost = () => {
    return selectedVehicle.basePrice + distanceKm * selectedVehicle.pricePerKm;
  };

  const formatPrice = (p: number) => new Intl.NumberFormat('uz-UZ').format(p) + " so'm";

  const handleBookVehicle = () => {
    setDispatchedSuccess(true);
    setTimeout(() => setDispatchedSuccess(false), 4000);
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 p-6 sm:p-8 rounded-3xl border border-amber-500/30">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold">
            <Truck className="w-4 h-4" />
            BunkerStroy Maxsus Qurilish Texnikalari & Yuk Logistikasi
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white">
            Qurilish Maydonlariga Og'ir Yuk & Texnika Yetkazib Berish
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Samosvallar, avtokran-manipulyatorlar, beton mikserlari va tezkor Gazellar.
            Yuk ko'tarish me'yorlariga rioya qilingan holda, GPS monitoring ostida real vaqtda harakatlanadi.
          </p>
        </div>
      </div>

      {/* Calculator & Booking Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Vehicle selection & parameters */}
        <div className="lg:col-span-7 bg-slate-800/80 p-6 rounded-3xl border border-slate-700/80 space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Calculator className="w-5 h-5 text-amber-400" />
            Yuk Tashish Narxini Hisoblang & Texnika Buyurtma Qiling
          </h2>

          {/* Vehicle cards */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              1. Maxsus Texnika Turini Tanlang:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {vehicles.map((v) => (
                <div
                  key={v.id}
                  onClick={() => setSelectedVehicle(v)}
                  className={`p-3.5 rounded-2xl cursor-pointer border transition-all flex items-center gap-3 ${
                    selectedVehicle.id === v.id
                      ? 'bg-amber-500/15 border-amber-400 text-white shadow-lg shadow-amber-500/10'
                      : 'bg-slate-900/60 border-slate-700/70 text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  <img src={v.image} alt={v.name} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold truncate text-white">{v.name}</h4>
                    <p className="text-[11px] text-amber-400 font-semibold">{v.capacityTons} tonnagacha</p>
                    <p className="text-[10px] text-slate-400">{formatPrice(v.pricePerKm)} / km</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Route inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1">
                <Navigation className="w-3.5 h-3.5 text-amber-400" /> Yuk ortish manzili:
              </label>
              <input
                type="text"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1">
                <Navigation className="w-3.5 h-3.5 text-emerald-400" /> Yetkazish (ob'ekt) manzili:
              </label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Distance and Weight Sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-900/60 p-4 rounded-2xl border border-slate-700/60">
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Taxminiy masofa:</span>
                <span className="font-bold text-amber-400">{distanceKm} km</span>
              </div>
              <input
                type="range"
                min="5"
                max="150"
                value={distanceKm}
                onChange={(e) => setDistanceKm(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Yuk og'irligi:</span>
                <span className="font-bold text-amber-400">{weightTons} tonna</span>
              </div>
              <input
                type="range"
                min="1"
                max={selectedVehicle.capacityTons}
                value={weightTons}
                onChange={(e) => setWeightTons(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Summary and booking action */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs text-slate-400">Jami transport xarajati:</div>
              <div className="text-2xl font-black text-amber-400">{formatPrice(calculateCost())}</div>
              <div className="text-[11px] text-slate-400">Bazaviy to‘lov + {distanceKm} km x {formatPrice(selectedVehicle.pricePerKm)}</div>
            </div>

            <button
              onClick={handleBookVehicle}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
            >
              Texnikani Ob'ektga Chaqirish
            </button>
          </div>

          {dispatchedSuccess && (
            <div className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs animate-fadeIn">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>Buyurtma qabul qilindi! Haydovchi {selectedVehicle.driverName} tez orada ob'ektga yo'l oladi.</span>
            </div>
          )}

        </div>

        {/* Right: Live Fleet & Tracking Card */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-slate-800/80 p-6 rounded-3xl border border-slate-700/80 space-y-5">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Compass className="w-5 h-5 text-amber-400" />
              Navbatchi Haydovchi & Texnika Kartasi
            </h3>

            <div className="relative h-44 rounded-2xl overflow-hidden bg-slate-950 border border-slate-700">
              <img src={selectedVehicle.image} alt={selectedVehicle.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                <div>
                  <span className="text-xs px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-bold">
                    Faol holatda
                  </span>
                  <h4 className="text-sm font-bold text-white mt-1">{selectedVehicle.name}</h4>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-300">Hozirgi manzil:</span>
                  <p className="text-xs font-semibold text-amber-400">{selectedVehicle.currentLocation}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-800 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">Mas'ul Haydovchi:</span>
                <span className="font-semibold text-white">{selectedVehicle.driverName}</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">Aloqa:</span>
                <a href={`tel:${selectedVehicle.phone}`} className="font-semibold text-amber-400 flex items-center gap-1 hover:underline">
                  <Phone className="w-3.5 h-3.5" /> {selectedVehicle.phone}
                </a>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">Yuk hajmi:</span>
                <span className="font-semibold text-white">{selectedVehicle.capacityTons} tonnagacha</span>
              </div>
            </div>

            {/* Live Timeline status preview */}
            <div className="space-y-2 pt-2 border-t border-slate-700/60">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Yuk Yetkazish Bosqichlari:</span>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2.5 text-emerald-400 font-semibold">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
                  <span>1. Texnika tayyor & marshrut belgilandi</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-400">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-600"></div>
                  <span>2. Karyer / Zavoddan material yuklash</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-400">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-600"></div>
                  <span>3. Ob'ektga yetkazish va tushirish</span>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
