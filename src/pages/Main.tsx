import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { UserProgress, Pet } from '../types';
import { GlassCard, NeonButton, HandwrittenText } from '../components/UI';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Shield, Sword, Brain, Zap, Star, Sparkles, Heart, Activity, Compass, Coins, Plus, Box, Package, ChevronRight, Zap as EnergyIcon, ShoppingBag } from 'lucide-react';
import { getPetRankByLevel, calculateCP, getExpNeeded } from '../lib/gameLogic';
import { ELEMENT_DATA, RARITY_LABELS } from '../constants/gameData';
import { ElementSticker } from '../components/GameUI';

export const Main: React.FC<{ 
  progress: UserProgress; 
  setProgress: React.Dispatch<React.SetStateAction<UserProgress>>;
  manualActiveId?: string | null;
}> = ({ progress, setProgress, manualActiveId }) => {
  const navigate = useNavigate();
  const { id: paramsId } = useParams();
  const activeId = manualActiveId || paramsId;
  const [timeLeft, setTimeLeft] = useState("");

  const petCount = progress.pets.length;

  useEffect(() => {
    // Sync with active pet id in state if provided through URL
    if (activeId && progress.activePetId !== activeId) {
       // setProgress(prev => ({ ...prev, activePetId: activeId })); // Avoid side effect in render/effect if possible
    }
  }, [activeId]);

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
          <div className="h-16 w-16 bg-sticker-yellow border-2 border-black rotate-3 flex items-center justify-center p-2 cursor-pointer hover:scale-110 transition-transform" onClick={() => navigate('/main')}>
             <img src="https://i.ibb.co/k2PN7Q8y/aisailogo.png" alt="aiSai" className="h-full w-full object-contain mix-blend-multiply" />
          </div>
          <div>
            <h1 className="text-4xl font-black italic tracking-tighter text-pen-blue leading-none">aiSai</h1>
            <div className="text-sm font-black italic text-pen-blue/30 mt-1 uppercase tracking-wider">Бестиарий: {petCount} сущностей</div>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-6">
          {/* Energy Section */}
          <div className="flex flex-col gap-1 flex-1 min-w-[120px]">
             <div className="flex items-center gap-2 text-sm font-black italic text-pen-blue">
                <EnergyIcon className="h-4 w-4 fill-pen-blue" />
                <span>Заряд: {progress.energy}</span>
                <span className="text-[10px] opacity-40">({timeLeft})</span>
             </div>
          </div>

          <div
            onClick={() => navigate('/topup')}
            className="group cursor-pointer bg-sticker-blue px-4 py-2 border-2 border-black rotate-1 flex items-center gap-3 text-lg font-black italic hover:-translate-y-1 transition-all"
          >
            <Coins className="h-5 w-5" />
            <span>{progress.currency.toLocaleString()} ₽</span>
          </div>
        </div>
      </header>

      <section className="space-y-8">
        <div className="flex items-center justify-between">
           <h2 className="text-3xl font-black italic text-pen-blue">Ваши Сущности</h2>
           <button 
             onClick={() => navigate('/shop')}
             className="text-pen-blue/40 hover:text-pen-blue font-black italic text-sm transition-colors"
           >
             + Магазин
           </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
           {progress.pets.map((pet, i) => {
             const cp = calculateCP(pet);
             return (
               <motion.div
                 key={pet.id}
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: i * 0.05 }}
                 onClick={() => navigate(`/pet/${pet.id}`)}
                 className={cn(
                   "group cursor-pointer transition-all duration-300",
                   activeId === pet.id ? "scale-105 z-20" : "scale-100"
                 )}
               >
                 <GlassCard 
                   color="white" 
                   noPadding 
                   className={cn(
                     "border-2 overflow-hidden rotation-1 group-hover:rotate-0 transition-all",
                     activeId === pet.id ? "border-pen-blue !rotate-0 scale-[1.02]" : "border-black/10"
                   )}
                 >
                   <div className="aspect-[9/16] relative bg-white">
                     <img src={pet.image} alt={pet.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 grayscale-[10%]" />
                     
                     <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                        <div className="px-2 py-0.5 bg-black text-white text-[9px] font-black italic lowercase">
                           {RARITY_LABELS[pet.rarity] || pet.rarity}
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); navigate(`/inventory/${pet.id}`); }}
                          className="h-8 w-8 bg-sticker-blue border border-black flex items-center justify-center hover:bg-sticker-yellow transition-colors"
                        >
                           <ShoppingBag className="h-4 w-4" />
                        </button>
                     </div>

                     <div className="absolute top-2 right-2 h-8 w-8 bg-sticker-yellow border border-black rotate-6 flex flex-col items-center justify-center z-10">
                        <span className="text-[10px] font-black italic leading-none">{cp}</span>
                     </div>

                     <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-white via-white/80 to-transparent p-4 pt-12 z-10">
                        {/* XP Progress Bar */}
                        <div className="w-full h-1 bg-black/5 rounded-full overflow-hidden mb-3">
                          <motion.div 
                            className="h-full bg-pen-blue opacity-40"
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((pet.experience / getExpNeeded(pet.level)) * 100, 100)}%` }}
                          />
                        </div>
                        
                        <h3 className="text-xl font-black italic truncate leading-none mb-1">
                          {pet.name}
                        </h3>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black italic text-pen-blue/40 uppercase">LVL {pet.level}</span>
                          <ElementSticker element={pet.element} showLabel={true} className="scale-90 origin-right" />
                        </div>
                     </div>
                   </div>
                 </GlassCard>
               </motion.div>
             );
           })}
           
           {progress.pets.length === 0 && (
              <div className="col-span-full py-16 text-center border-4 border-dashed border-black/5 rounded-2xl">
                 <Package className="h-12 w-12 mx-auto text-black/10 mb-4" />
                 <h3 className="text-lg font-black italic text-pen-blue/30">Бестиарий пуст</h3>
                 <NeonButton onClick={() => navigate('/shop')} className="mt-4">В магазин</NeonButton>
              </div>
           )}
        </div>
      </section>
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
        <span className="text-lg font-black italic text-pen-blue">{value}</span>
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
