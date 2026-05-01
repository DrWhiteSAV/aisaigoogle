import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserProgress, Pet } from '../types';
import { GlassCard, NeonButton, HandwrittenText } from '../components/UI';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Shield, Sword, Brain, Zap, Star, Sparkles, Heart, Activity, Compass, Coins, Plus, Box, Package, ChevronRight, Zap as EnergyIcon } from 'lucide-react';
import { getPetRankByLevel, calculateCP } from '../lib/gameLogic';

export const Main: React.FC<{ progress: UserProgress; setProgress: React.Dispatch<React.SetStateAction<UserProgress>> }> = ({ progress, setProgress }) => {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState("");

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
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-12 pt-12 pb-32 min-h-screen relative">
      {/* Header with Energy & Currency */}
      <header className="flex flex-col sm:flex-row gap-6 items-center justify-between border-b-2 border-black/5 pb-10">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 bg-sticker-yellow border-2 border-black rotate-3 flex items-center justify-center shadow-lg p-2">
             <img src="https://i.ibb.co/k2PN7Q8y/aisailogo.png" alt="aiSai" className="h-full w-full object-contain mix-blend-multiply" />
          </div>
          <div>
            <h1 className="text-4xl font-black italic tracking-tighter text-pen-blue leading-none">aiSai</h1>
            <div className="text-sm font-black italic text-pen-blue/30 mt-1">Протокол Бестиария: {petCount} сущностей</div>
          </div>
        </div>
        
        <div className="flex items-center gap-8">
          {/* Energy Section */}
          <div className="flex flex-col items-end gap-1">
             <div className="flex items-center gap-2 text-sm font-black italic text-pen-blue">
                <EnergyIcon className="h-4 w-4 fill-pen-blue" />
                <span>Заряд: {progress.energy}</span>
                <span className="text-[10px] opacity-40">({timeLeft})</span>
             </div>
             <div className="w-40 h-2.5 bg-black/5 rounded-full overflow-hidden border border-black/5">
                <motion.div 
                  className="h-full bg-pen-blue opacity-50" 
                  animate={{ width: `${Math.min((progress.energy / 50) * 100, 100)}%` }} 
                />
             </div>
          </div>

          <div
            onClick={() => navigate('/topup')}
            className="group cursor-pointer bg-sticker-blue px-6 py-3 border-2 border-black rotate-1 flex items-center gap-3 text-lg font-black italic shadow-sm hover:-translate-y-1 transition-all"
          >
            <Coins className="h-5 w-5" />
            <span>{progress.currency.toLocaleString()} ₽</span>
            <Plus className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </header>

      <section className="space-y-8">
        <div className="flex items-center justify-between">
           <h2 className="text-3xl font-black italic text-pen-blue">Ваши Сущности</h2>
           <button 
             onClick={() => navigate('/shop')}
             className="text-pen-blue/40 hover:text-pen-blue font-black italic text-sm transition-colors border-b-2 border-dashed border-transparent hover:border-pen-blue"
           >
             + Призвать новую в Магазине
           </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
           {progress.pets.map((pet, i) => {
             const cp = calculateCP(pet);
             const expNeeded = Math.floor(100 * Math.pow(1.1, pet.level));
             return (
               <motion.div
                 key={pet.id}
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: i * 0.05 }}
                 onClick={() => navigate(`/pet/${pet.id}`)}
                 className="group cursor-pointer"
               >
                 <GlassCard color="white" noPadding className="border-2 border-black/10 overflow-hidden rotation-1 group-hover:rotation-neg-1 transition-transform">
                   <div className="aspect-[4/5] relative bg-white">
                     <img src={pet.image} alt={pet.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                     
                     <div className="absolute top-3 left-3 flex flex-col gap-1">
                        <div className="px-2 py-0.5 bg-black text-white text-[10px] font-black italic">
                          {pet.rarity}
                        </div>
                        <div className="px-2 py-0.5 bg-pen-red text-white text-[10px] font-black italic">
                          {pet.element}
                        </div>
                     </div>

                     <div className="absolute top-3 right-3 h-10 w-10 bg-sticker-yellow border border-black rotate-6 flex flex-col items-center justify-center">
                        <span className="text-[8px] font-black text-black/40 italic leading-none">CP</span>
                        <span className="text-sm font-black italic leading-none">{cp}</span>
                     </div>

                     <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-white via-white/80 to-transparent p-4 pt-12">
                        <h3 className="text-2xl font-black italic truncate leading-none">
                          {pet.name}
                        </h3>
                        <div className="text-[10px] font-black italic text-pen-blue/40 mt-1 mb-2">
                          Уровень {pet.level} • {getPetRankByLevel(pet.level)}
                        </div>
                        <div className="h-1 w-full bg-black/5 rounded-full overflow-hidden">
                           <motion.div 
                             className="h-full bg-pen-blue opacity-40" 
                             initial={{ width: 0 }}
                             animate={{ width: `${Math.min((pet.experience / expNeeded) * 100, 100)}%` }} 
                           />
                        </div>
                     </div>
                   </div>
                 </GlassCard>
               </motion.div>
             );
           })}
           
           {progress.pets.length === 0 && (
              <div className="col-span-full py-24 text-center border-4 border-dashed border-black/5 rounded-2xl">
                 <Package className="h-16 w-16 mx-auto text-black/10 mb-4" />
                 <h3 className="text-xl font-black italic text-pen-blue/30">Бестиарий пуст</h3>
                 <NeonButton onClick={() => navigate('/shop')} className="mt-6">Отправиться в магазин</NeonButton>
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


