import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { UserProgress, Pet, Rarity, AgeStage } from '../types';
import { GlassCard, NeonButton, HandwrittenText } from '../components/UI';
import { ShoppingBag, Coins, TrendingUp, Tag, Trash2, Heart, Scale, Sparkles, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getSummonerRank } from '../lib/gameLogic';

const calculateSellPrice = (pet: Pet) => {
  const basePrices: Record<string, number> = { common: 500, rare: 1500, epic: 4000, mythic: 8000, legendary: 20000, divine: 80000 };
  const stageMultipliers: Record<string, number> = { 'F': 1, 'E': 1.2, 'D': 1.5, 'C': 2, 'B': 3, 'A': 5 };
  
  const stageCode = (pet.ageStage || 'F').split(' ')[0];
  const base = basePrices[pet.rarity] || 500;
  const mult = stageMultipliers[stageCode] || 1;
  const levelBonus = pet.level * 150;
  
  return Math.floor((base + levelBonus) * mult);
};

export const Market: React.FC<{ progress: UserProgress; setProgress: React.Dispatch<React.SetStateAction<UserProgress>>; onBuy: (pet: Pet) => void }> = ({ progress, setProgress, onBuy }) => {
  const [tab, setTab] = useState<'buy' | 'sell' | 'summon'>('summon');
  const navigate = useNavigate();

  const rankInfo = getSummonerRank(progress.pets);
  const summonCost = 5000;
  const canSummon = progress.pets.length < rankInfo.limit;

  const handleSell = (petId: string) => {
    const petToSell = progress.pets.find(p => p.id === petId);
    if (!petToSell) return;

    if (progress.pets.length <= 1) {
      return;
    }

    const price = calculateSellPrice(petToSell);
    
    setProgress(prev => ({
      ...prev,
      currency: prev.currency + price,
      pets: prev.pets.filter(p => p.id !== petId),
      activePetId: prev.activePetId === petId ? prev.pets.find(p => p.id !== petId)?.id || null : prev.activePetId
    }));
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-12 pt-12 pb-32 min-h-screen">
       <header className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-center md:text-left space-y-1">
            <h1 className="text-4xl sm:text-6xl font-black italic text-pen-blue tracking-tighter leading-tight">Пристанище aiSai</h1>
            <div className="text-pen-blue/40 text-[14px] font-black italic mt-2">
               Центр призыва и обмена редкими сущностями
            </div>
          </div>
          
          <div className="flex bg-transparent rounded-none p-1 border-2 border-black/5 w-full md:w-auto shadow-sm">
             <button 
               onClick={() => setTab('summon')}
               className={cn(
                 "flex-1 md:w-36 py-3 px-6 text-sm font-black italic transition-all",
                 tab === 'summon' ? "bg-sticker-yellow border-2 border-black text-pen-blue rotate-1 shadow-sm" : "text-pen-blue/30"
               )}
             >Призыв</button>
             <button 
               onClick={() => setTab('sell')}
               className={cn(
                 "flex-1 md:w-36 py-3 px-6 text-sm font-black italic transition-all",
                 tab === 'sell' ? "bg-sticker-pink border-2 border-black text-pen-blue -rotate-1 shadow-sm" : "text-pen-blue/30"
               )}
             >Продажа</button>
          </div>
       </header>

       <AnimatePresence mode="wait">
          {tab === 'summon' ? (
            <motion.div 
              key="summon"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="flex flex-col items-center gap-10 py-12"
            >
               <GlassCard color="white" className="max-w-2xl w-full p-10 text-center border-4 border-black/5 hatching-shadow">
                  <div className="mb-8 relative mx-auto w-32 h-32 flex items-center justify-center">
                     <Sparkles className="h-20 w-32 text-pen-blue/10 animate-pulse absolute" />
                     <div className="h-24 w-24 bg-sticker-yellow border-2 border-black rotate-12 flex items-center justify-center shadow-xl">
                        <Plus className="h-12 w-12 text-pen-blue" />
                     </div>
                  </div>
                  
                  <h2 className="text-4xl font-black italic text-pen-blue mb-4">Ритуал Синтеза</h2>
                  <p className="text-pen-blue/60 font-black italic max-w-md mx-auto mb-8">
                     aiSai подготовит уникальную сущность, связанную с вашей цифровой аурой. 
                     Стоимость проведения ритуала: <span className="text-pen-blue font-black">{summonCost} ₽</span>
                  </p>

                  <div className="space-y-6">
                     <div className="flex justify-center gap-10">
                        <div className="text-center">
                           <div className="text-[10px] font-black text-black/30 italic mb-1">Ранг</div>
                           <div className="font-black italic text-pen-blue">{rankInfo.name}</div>
                        </div>
                        <div className="text-center">
                           <div className="text-[10px] font-black text-black/30 italic mb-1">Лимит</div>
                           <div className="font-black italic text-pen-blue">{progress.pets.length} / {rankInfo.limit}</div>
                        </div>
                     </div>

                     <div className="pt-4">
                        {canSummon ? (
                           <NeonButton 
                             onClick={() => {
                               if (progress.currency < summonCost) {
                                  // Fail silently or handle with UI in future
                               } else {
                                  setProgress(p => ({ ...p, currency: p.currency - summonCost }));
                                  navigate('/setup');
                               }
                             }}
                             className="w-full py-6 text-2xl font-black italic"
                           >
                              Начать Призыв {summonCost} ₽
                           </NeonButton>
                        ) : (
                           <div className="p-6 bg-pen-red/5 border-2 border-pen-red/20 text-pen-red font-black italic">
                              Лимит сущностей достигнут для ранга {rankInfo.name}. 
                              Развивайте текущих существ, чтобы повысить ранг призывателя.
                           </div>
                        )}
                     </div>
                  </div>
               </GlassCard>
            </motion.div>
          ) : (
            <motion.div 
              key="sell"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
            >
               {progress.pets.map((pet, idx) => (
                <GlassCard 
                  key={pet.id} 
                  color="white" 
                  delay={idx * 0.05} 
                  className="flex gap-6 p-6 border-2 border-black/5 group hover:border-pen-red/20 transition-all hatching-shadow rounded-[4px] items-center cursor-pointer"
                  onClick={() => navigate(`/pet/${pet.id}`)}
                >
                   <div className="h-24 w-24 rounded-sm overflow-hidden shrink-0 border-2 border-black/5 rotate-2">
                      <img src={pet.image} className="h-full w-full object-cover" />
                   </div>
                   <div className="flex-1 flex flex-col justify-between py-1 text-left">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                           <h3 className="text-2xl font-black italic text-pen-blue leading-none">{pet.name}</h3>
                           <span className="text-[12px] text-pen-blue/40 font-black italic">LVL {pet.level}</span>
                        </div>
                        <div className="text-[11px] text-pen-blue/40 font-black italic">{pet.ageStage}</div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 mt-2 border-t-2 border-pen-blue/5">
                        <div className="font-black text-pen-blue text-lg italic">{calculateSellPrice(pet)} ₽</div>
                        <button 
                          onClick={(e) => {
                             e.stopPropagation();
                             handleSell(pet.id);
                          }}
                          className="flex items-center gap-1.5 text-pen-red hover:scale-110 transition-transform text-[12px] font-black italic"
                        >
                           <Trash2 className="h-4 w-4" />
                           Продать
                        </button>
                      </div>
                   </div>
                </GlassCard>
               ))}

               {progress.pets.length === 0 && (
                  <div className="col-span-full py-20 text-center border-2 border-dashed border-black/5">
                     <p className="text-pen-blue/30 font-black italic">У вас нет существ для продажи</p>
                  </div>
               )}
            </motion.div>
          )}
       </AnimatePresence>

       <GlassCard color="white" className="border-2 border-dashed border-black/10 text-center py-10 opacity-60 rounded-sm">
          <Scale className="h-10 w-10 mx-auto mb-4 text-pen-blue/20" />
          <p className="text-sm font-black italic text-pen-blue/40">Стоимость призыва фиксирована, а цена продажи зависит от параметров сущности</p>
       </GlassCard>
    </div>
  );
};

// removed local cn
