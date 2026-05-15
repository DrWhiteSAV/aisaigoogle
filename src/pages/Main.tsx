import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Pet, Element, Attribute, UserProgress } from '../types';
import { GlassCard, NeonButton, HandwrittenText, LogoAnimation } from '../components/UI';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Shield, Sword, Brain, Zap, Star, Sparkles, Heart, Activity, Compass, Sprout, Plus, Box, Package, ChevronRight, Zap as EnergyIcon, ShoppingBag } from 'lucide-react';
import { getPetRankByLevel, calculateCP, getExpNeeded, getSummonerRank } from '../lib/gameLogic';
import { ELEMENT_DATA, RARITY_LABELS } from '../constants/gameData';
import { ElementSticker, InfoModal, TypeChartContent, RankInfoModal } from '../components/GameUI';

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
  const [modalType, setModalType] = useState<{ element?: Element, attribute?: Attribute, rank?: boolean, rarity?: boolean, fullScreenImage?: string, pet?: Pet } | null>(null);
  const [showRankModal, setShowRankModal] = useState(false);

  const petCount = progress.pets.length;
  const rankInfo = getSummonerRank(progress.pets);

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
      <header className="flex flex-row justify-between items-start gap-4 border-b-2 border-black/5 pb-6">
        <div 
          className="flex items-center gap-4 shrink-0 cursor-pointer hover:scale-105 transition-transform"
          onClick={() => navigate('/main')}
        >
          <div className="h-10 w-10 sm:h-16 sm:w-16 relative">
            <LogoAnimation 
              containerClassName="absolute inset-0 mix-blend-multiply"
              logoClassName="w-full h-full"
              imgClassName="w-full h-full object-contain filter contrast-125"
            />
          </div>
          <div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tighter text-pen-blue leading-none">aiSai</h1>
            <div className="text-[10px] sm:text-sm font-black text-pen-blue/30 mt-1">Бестиарий: {petCount} сущ.</div>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-2 shrink-0 pr-2">
          <div className="flex flex-row items-center gap-2 sm:gap-4 shrink-0 mt-1">
            {/* Energy Section */}
            <div className="flex flex-col gap-1 items-end">
               <div 
                 onClick={() => navigate('/shop#resources')}
                 className="cursor-pointer flex items-center gap-1 sm:gap-2 text-[12px] sm:text-sm font-black text-pen-blue bg-white/50 px-2 py-1 rounded-full border border-pen-blue/20 hover:bg-white/80 transition-colors"
               >
                  <EnergyIcon className="h-3 w-3 sm:h-4 sm:w-4 fill-pen-blue" />
                  <span>{progress.energy}</span>
                  <span className="text-[10px] opacity-40">({timeLeft})</span>
               </div>
            </div>

            <div
              onClick={() => navigate('/shop#resources')}
              className="group cursor-pointer bg-sticker-blue px-2 py-1 sm:px-3 sm:py-2 border-2 border-black rotate-1 flex items-center justify-center text-[12px] sm:text-sm font-black hover:-translate-y-1 transition-all"
            >
              <span>{progress.sprouts.toLocaleString()} 🌱</span>
            </div>
          </div>
          <button 
             onClick={() => setShowRankModal(true)}
             className="text-xs font-black text-pen-blue/40 border-b border-dashed border-pen-blue/40 hover:text-pen-blue transition-colors mt-2"
          >
             Ранг: {rankInfo.name}
          </button>
        </div>
      </header>

      <section className="space-y-8">
        <div className="grid grid-cols-2 gap-4 sm:gap-6">
           {progress.pets.map((pet, i) => (
             <motion.div
               key={pet.id}
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: i * 0.05 }}
               className={cn(
                 "transition-all duration-300 w-full",
                 activeId === pet.id ? "scale-105 z-20" : "scale-100"
               )}
             >
               <PetCard 
                 pet={pet} 
                 onClick={() => navigate(`/pet/${pet.id}`)}
                 onOpenRankInfo={() => setModalType({ rank: true, pet })}
                 onOpenRarityInfo={() => setModalType({ rarity: true, pet })}
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
        title={modalType?.rank ? "Ранг Сущности" : modalType?.rarity ? "Аналитика Потенциала" : modalType?.element ? "Узы Элемента" : "Суть Атрибута"}
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
        ) : (modalType?.rank && modalType?.pet) ? (
          <div className="space-y-4">
             <p className="text-[16px] font-black text-pen-blue leading-relaxed border-b border-black/5 pb-4">
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
                ].map((r, i) => {
                  const [min, max] = r.range.split('-').map(Number);
                  const isSelected = modalType.pet && modalType.pet.level >= min && modalType.pet.level <= (max || min);
                  return (
                    <div key={i} className={cn(
                      "flex items-center justify-between p-2 border-2 transition-all",
                      isSelected
                        ? "border-pen-blue ring-4 ring-pen-blue/10 rotate-1 bg-transparent z-10"
                        : "border-black/10 bg-transparent opacity-60"
                    )}>
                      <span className="text-[16px] font-black text-pen-blue">{r.range}</span>
                      <span className="text-[16px] font-black text-pen-blue">{r.code} - {r.label}</span>
                    </div>
                  );
                })}
             </div>
          </div>
        ) : (modalType?.rarity && modalType?.pet) ? (
          <div className="space-y-4">
             <p className="text-[16px] font-black text-pen-blue leading-relaxed border-b border-black/5 pb-4">
                Начальные характеристики и потенциал роста зависят от редкости питомца:
             </p>
             <div className="grid grid-cols-1 gap-2">
                {[
                  { label: "Обычный", base: 20, growth: 5 },
                  { label: "Продвинутый", base: 50, growth: 10 },
                  { label: "Редкий", base: 100, growth: 15 },
                  { label: "Совершенный", base: 200, growth: 20 },
                  { label: "Эпический", base: 300, growth: 25 },
                  { label: "Легендарный", base: 400, growth: 30 },
                  { label: "Мифический", base: 500, growth: 35 },
                  { label: "Вечный", base: 600, growth: 40 },
                  { label: "Божественный", base: 800, growth: 45 },
                  { label: "Трансцендентный", base: 1000, growth: 50 }
                ].map((r, i) => {
                  const isSelected = modalType.pet && RARITY_LABELS[modalType.pet.rarity] === r.label;
                  return (
                    <div key={i} className={cn(
                      "flex items-center justify-between p-2 border-2 transition-all",
                      isSelected
                        ? "border-pen-blue ring-4 ring-pen-blue/10 rotate-1 bg-transparent z-10"
                        : "border-black/10 bg-transparent opacity-60"
                    )}>
                      <span className="text-[16px] font-black text-pen-blue">{r.label}</span>
                      <span className="text-[16px] font-black text-pen-blue">{r.base} / +{r.growth} lvl</span>
                    </div>
                  );
                })}
             </div>
          </div>
        ) : modalType?.rank ? (
          <div className="space-y-4">
             <p className="text-[16px] font-black text-pen-blue leading-relaxed border-b border-black/5 pb-4">
               Ранг Питомца определяется текущим уровнем созревания:
             </p>
             <div className="grid grid-cols-1 gap-2 opacity-60">
                {[
                  { range: "1-10", label: "младенчество" },
                  { range: "11-20", label: "детство" },
                  { range: "21-30", label: "отрочество" },
                  { range: "31-40", label: "молодость" },
                  { range: "41-50", label: "взросление" },
                  { range: "51-60", label: "зрелость" },
                  { range: "61-70", label: "мудрость" },
                  { range: "71-80", label: "единство" },
                  { range: "81-90", label: "пробуждение" },
                  { range: "91-100", label: "абсолютность" }
                ].map((r, i) => (
                  <div key={i} className="flex items-center justify-between p-2 border-2 border-black/10">
                    <span className="text-sm font-black text-pen-blue">{r.range}</span>
                    <span className="text-sm font-black text-pen-blue">{r.label}</span>
                  </div>
                ))}
             </div>
          </div>
        ) : modalType?.rarity ? (
          <div className="space-y-4">
             <p className="text-[16px] font-black text-pen-blue leading-relaxed border-b border-black/5 pb-4">
                Потенциал роста зависит от редкости:
             </p>
             <div className="grid grid-cols-1 gap-2 opacity-60">
                {Object.values(RARITY_LABELS).map((label, i) => (
                  <div key={i} className="flex items-center justify-between p-2 border-2 border-black/10">
                    <span className="text-sm font-black text-pen-blue">{label}</span>
                  </div>
                ))}
             </div>
          </div>
        ) : (
          <TypeChartContent element={modalType?.element} attribute={modalType?.attribute} />
        )}
      </InfoModal>

      <RankInfoModal 
        isOpen={showRankModal} 
        onClose={() => setShowRankModal(false)} 
        rankInfo={rankInfo} 
      />
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
