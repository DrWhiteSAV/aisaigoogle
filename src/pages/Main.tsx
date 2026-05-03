import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Pet, Element, Attribute, UserProgress } from '../types';
import { GlassCard, NeonButton, HandwrittenText } from '../components/UI';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Shield, Sword, Brain, Zap, Star, Sparkles, Heart, Activity, Compass, Coins, Plus, Box, Package, ChevronRight, Zap as EnergyIcon, ShoppingBag } from 'lucide-react';
import { getPetRankByLevel, calculateCP, getExpNeeded } from '../lib/gameLogic';
import { ELEMENT_DATA, RARITY_LABELS } from '../constants/gameData';
import { ElementSticker, InfoModal, TypeChartContent } from '../components/GameUI';

import { PetCard } from '../components/PetCard';

export const Main: React.FC<{ 
  progress: UserProgress; 
  setProgress: React.Dispatch<React.SetStateAction<UserProgress>>;
  manualActiveId?: string | null;
}> = ({ progress, setProgress, manualActiveId }) => {
  const navigate = useNavigate();
  const { id: paramsId } = useParams();
  const activeId = manualActiveId || paramsId;
  const [timeLeft, setTimeLeft] = useState("");
  const [modalType, setModalType] = useState<{ element?: Element, attribute?: Attribute, rank?: boolean, fullScreenImage?: string } | null>(null);

  const petCount = progress.pets.length;

  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      const nextUpdate = progress.lastEnergyUpdate + (5 * 60 * 1000);
      const diff = nextUpdate - now;
      
      if (diff <= 0) {
        setTimeLeft("00:00");
      } else {
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
      }
    };

    const interval = setInterval(updateTimer, 1000);
    updateTimer();
    return () => clearInterval(interval);
  }, [progress.lastEnergyUpdate]);

  return (
    <div className="space-y-12 pb-32 relative">
      {/* Header with Energy & Currency */}
      <header className="flex flex-col gap-6 border-b-2 border-black/5 pb-10">
        <div className="flex items-center gap-4">
          <img 
            src="https://i.ibb.co/k2PN7Q8y/aisailogo.png" 
            alt="aiSai" 
            className="h-16 w-16 object-contain cursor-pointer hover:scale-110 transition-transform mix-blend-multiply" 
            onClick={() => navigate('/main')}
          />
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-pen-blue leading-none">aiSai</h1>
            <div className="text-sm font-black text-pen-blue/30 mt-1">Бестиарий: {petCount} сущностей</div>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-6">
          {/* Energy Section */}
          <div className="flex flex-col gap-1 flex-1 min-w-[120px]">
             <div className="flex items-center gap-2 text-sm font-black text-pen-blue">
                <EnergyIcon className="h-4 w-4 fill-pen-blue" />
                <span>Заряд: {progress.energy}</span>
                <span className="text-[10px] opacity-40">({timeLeft})</span>
             </div>
          </div>

          <div
            onClick={() => navigate('/topup')}
            className="group cursor-pointer bg-sticker-blue px-4 py-2 border-2 border-black rotate-1 flex items-center gap-3 text-lg font-black hover:-translate-y-1 transition-all"
          >
            <Coins className="h-5 w-5" />
            <span>{progress.currency.toLocaleString()} ₽</span>
          </div>
        </div>
      </header>

      <section className="space-y-8">
        <div className="flex items-center justify-between">
           <h2 className="text-3xl font-black text-pen-blue">Ваши Сущности</h2>
           <button 
             onClick={() => navigate('/shop')}
             className="text-pen-blue/40 hover:text-pen-blue font-black text-sm transition-colors"
           >
             + Магазин
           </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
           {progress.pets.map((pet, i) => (
             <motion.div
               key={pet.id}
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: i * 0.05 }}
               className={cn(
                 "transition-all duration-300",
                 activeId === pet.id ? "scale-105 z-20" : "scale-100"
               )}
             >
               <PetCard 
                 pet={pet} 
                 onClick={() => navigate(`/pet/${pet.id}`)}
                 onOpenRankInfo={() => setModalType({ rank: true })}
                 onOpenImage={() => setModalType({ fullScreenImage: pet.image })}
                 onOpenElementInfo={(el) => setModalType({ element: el })}
                 onOpenAttributeInfo={(attr) => setModalType({ attribute: attr })}
                 onOpenStore={() => navigate('/shop')}
                 onOpenInventory={() => navigate(`/inventory/${pet.id}`)}
                 className={cn(
                   activeId === pet.id ? "border-pen-blue !rotate-0" : ""
                 )}
                 showDetails={activeId === pet.id}
               />
             </motion.div>
           ))}
           
           {progress.pets.length === 0 && (
              <div className="col-span-full py-16 text-center border-4 border-dashed border-black/5 rounded-2xl">
                 <Package className="h-12 w-12 mx-auto text-black/10 mb-4" />
                 <h3 className="text-lg font-black text-pen-blue/30">Бестиарий пуст</h3>
                 <NeonButton onClick={() => navigate('/shop')} className="mt-4">В магазин</NeonButton>
              </div>
           )}
        </div>
      </section>

      <InfoModal 
        isOpen={!!modalType} 
        onClose={() => setModalType(null)}
        title={modalType?.rank ? "Ранг Сущности" : modalType?.element ? "Узы Элемента" : "Суть Атрибута"}
        showClose={true}
        plain={!!modalType?.fullScreenImage}
      >
        {modalType?.fullScreenImage ? (
           <motion.img 
             initial={{ scale: 0.9, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             src={modalType.fullScreenImage} 
             alt="Pet zoom" 
             className="max-w-[95%] max-h-[95%] object-contain shadow-2xl rounded-sm"
             referrerPolicy="no-referrer"
           />
        ) : modalType?.rank ? (
          <div className="space-y-4">
             <p className="text-sm font-black text-pen-blue/70 leading-relaxed border-b border-black/5 pb-4">
               Ранг Питомца определяется текущим уровнем созревания:
             </p>
             <div className="grid grid-cols-1 gap-2">
                {[
                  { range: "1-10", code: "F", label: "младенчество" },
                  { range: "11-20", code: "E", label: "детство" },
                  { range: "21-30", code: "D", label: "отрочество" },
                  { range: "31-40", code: "C", label: "молодость" },
                  { range: "41-50", code: "B", label: "взросление" },
                  { range: "51-60", code: "A", label: "зрелость" },
                  { range: "61-70", code: "S", label: "мудрость" },
                  { range: "71-80", code: "EX", label: "единство" },
                  { range: "81-90", code: "UX", label: "пробуждение" },
                  { range: "91-100", code: "Z", label: "абсолютность" }
                ].map((r, i) => (
                  <div key={i} className={cn(
                    "flex items-center justify-between p-2 border-2",
                    progress.pets.some(p => p.level >= parseInt(r.range.split('-')[0]) && p.level <= parseInt(r.range.split('-')[1]))
                      ? "bg-sticker-yellow border-black rotate-1"
                      : "border-black/5 opacity-40"
                  )}>
                    <span className="text-[10px] font-black">{r.range}</span>
                    <span className="text-xs font-black text-pen-blue">{r.code} - {r.label}</span>
                  </div>
                ))}
             </div>
          </div>
        ) : (
          <TypeChartContent element={modalType?.element} attribute={modalType?.attribute} />
        )}
      </InfoModal>
    </div>
  );
};

const StatItem = ({ icon: Icon, label, value, max, showAdd, onAdd }: any) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-pen-blue/30" />
        <span className="text-[11px] font-black text-pen-blue/50">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {showAdd && (
          <button 
            onClick={onAdd}
            className="h-5 w-5 bg-white border border-black/20 flex items-center justify-center hover:bg-sticker-pink transition-all rotate-[5deg] active:scale-95"
          >
            <Plus className="h-3 w-3" />
          </button>
        )}
        <span className="text-lg font-black text-pen-blue">{value}</span>
      </div>
    </div>
    <div className="h-1.5 w-full bg-black/5 rounded-full overflow-hidden">
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${Math.min((value / max) * 100, 100)}%` }}
        className="h-full bg-pen-blue opacity-25"
      />
    </div>
  </div>
);
