import React from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { UserProgress, Pet, Rarity } from '../types';
import { GlassCard, NeonButton } from '../components/UI';
import { Trash2, Scale, Plus } from 'lucide-react';
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

export const Market: React.FC<{ 
  progress: UserProgress; 
  setProgress: React.Dispatch<React.SetStateAction<UserProgress>>; 
  onBuy: (pet: Pet) => void;
  mode?: 'buy' | 'sell';
}> = ({ progress, setProgress, mode = 'buy' }) => {
  const navigate = useNavigate();
  const rankInfo = getSummonerRank(progress.pets);
  const summonCost = 5000;

  const handleSell = (petId: string) => {
    const petToSell = progress.pets.find(p => p.id === petId);
    if (!petToSell || progress.pets.length <= 1) return;
    const price = calculateSellPrice(petToSell);
    setProgress(prev => ({
      ...prev,
      currency: prev.currency + price,
      pets: prev.pets.filter(p => p.id !== petId),
      activePetId: prev.activePetId === petId ? prev.pets.find(p => p.id !== petId)?.id || null : prev.activePetId
    }));
  };

  return (
    <div className="p-4 h-full flex flex-col space-y-6">
       <header className="flex flex-col gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-black italic text-pen-blue tracking-tighter leading-tight">Пристанище aiSai</h1>
            <div className="text-pen-blue/40 text-[10px] font-black italic uppercase">
               {mode === 'sell' ? 'Протокол реализации сущностей' : 'Центр призыва и обмена'}
            </div>
          </div>
          
          <div className="flex bg-transparent rounded-none p-1 border-2 border-black/5 w-full">
             <button 
               onClick={() => navigate('/shop')}
               className={cn(
                 "flex-1 py-3 px-4 text-xs font-black italic transition-all",
                 mode === 'buy' ? "bg-sticker-yellow border-2 border-black text-pen-blue rotate-1" : "text-pen-blue/30"
               )}
             >Товары</button>
             <button 
               onClick={() => navigate('/sale')}
               className={cn(
                 "flex-1 py-3 px-4 text-xs font-black italic transition-all",
                 mode === 'sell' ? "bg-sticker-pink border-2 border-black text-pen-blue -rotate-1" : "text-pen-blue/30"
               )}
             >Продажа</button>
          </div>
       </header>

       <div className="flex-1 overflow-y-auto no-scrollbar py-2">
          {mode === 'buy' ? (
            <div className="space-y-4">
               <GlassCard color="white" className="p-6 text-center border-2 border-black/5 hover:border-black/10 transition-all cursor-pointer" onClick={() => navigate('/summon')}>
                  <div className="mb-4 relative mx-auto w-12 h-12 flex items-center justify-center">
                     <div className="h-10 w-10 bg-sticker-yellow border-2 border-black rotate-12 flex items-center justify-center">
                        <Plus className="h-5 w-5 text-pen-blue" />
                     </div>
                  </div>
                  <h3 className="text-lg font-black italic text-pen-blue mb-1">Ритуал Синтеза</h3>
                  <p className="text-[9px] text-pen-blue/60 font-black italic">
                     Призыв новой уникальной сущности за {summonCost} ₽
                  </p>
               </GlassCard>

               <div className="grid grid-cols-1 gap-4 opacity-30 grayscale pointer-events-none">
                  {[1].map(i => (
                    <GlassCard key={i} color="white" className="p-4 border-2 border-dashed border-black/5">
                        <div className="h-8 w-full bg-black/5" />
                        <div className="mt-2 h-3 w-1/2 bg-black/5" />
                    </GlassCard>
                  ))}
               </div>
               <p className="text-center text-[9px] font-black italic text-pen-blue/30">Ожидание поставок...</p>
            </div>
          ) : (
            <div className="space-y-3">
               {progress.pets.map((pet) => (
                <GlassCard 
                  key={pet.id} 
                  color="white" 
                  className="flex gap-4 p-3 border-2 border-black/5 group hover:border-pen-red/20 transition-all items-center cursor-pointer"
                  onClick={() => navigate(`/pet/${pet.id}`)}
                >
                   <div className="h-14 w-14 rounded-sm overflow-hidden shrink-0 border-2 border-black/5 rotate-1">
                      <img src={pet.image} className="h-full w-full object-cover" />
                   </div>
                   <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center justify-between gap-2">
                         <h3 className="text-base font-black italic text-pen-blue leading-none truncate">{pet.name}</h3>
                         <span className="text-[9px] text-pen-blue/40 font-black shrink-0">LVL {pet.level}</span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <div className="font-black text-pen-blue text-xs italic">{calculateSellPrice(pet)} ₽</div>
                        <button 
                          onClick={(e) => {
                             e.stopPropagation();
                             handleSell(pet.id);
                          }}
                          className="flex items-center gap-1 text-pen-red hover:scale-110 transition-transform text-[9px] font-black italic"
                        >
                           <Trash2 className="h-3 w-3" />
                           Продать
                        </button>
                      </div>
                   </div>
                </GlassCard>
               ))}
               {progress.pets.length === 0 && <p className="text-center italic text-pen-blue/30 py-10">Пусто...</p>}
            </div>
          )}
       </div>

       <div className="border-t-2 border-dashed border-black/5 pt-4 text-center mt-auto">
          <p className="text-[9px] font-black italic text-pen-blue/30 uppercase tracking-widest leading-none">
            {progress.currency.toLocaleString()} ₽ • Лимит: {progress.pets.length}/{rankInfo.limit}
          </p>
          <div className="flex items-center justify-center gap-2 mt-2 opacity-30">
             <Scale className="h-3 w-3 text-pen-blue" />
             <span className="text-[8px] font-black italic text-pen-blue">БАЛАНС СИСТЕМЫ СТАБИЛЕН</span>
          </div>
       </div>
    </div>
  );
};
