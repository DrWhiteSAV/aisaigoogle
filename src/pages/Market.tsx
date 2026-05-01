import React, { useState } from 'react';
import { cn } from '../lib/utils';
import { UserProgress, Pet, Rarity, AgeStage } from '../types';
import { GlassCard, NeonButton, HandwrittenText } from '../components/UI';
import { ShoppingBag, Coins, TrendingUp, Tag, Trash2, Heart, Scale } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const calculateSellPrice = (pet: Pet) => {
  const basePrices = { common: 500, rare: 1500, epic: 4000, mythic: 8000, legendary: 20000, divine: 80000 };
  const stageMultipliers = { 'детство': 1, 'молодость': 1.8, 'зрелость': 3, 'мудрость': 6, 'божественность': 15 };
  
  const base = basePrices[pet.rarity] || 500;
  const mult = stageMultipliers[pet.ageStage] || 1;
  const levelBonus = pet.level * 150;
  
  return Math.floor((base + levelBonus) * mult);
};

export const Market: React.FC<{ progress: UserProgress; setProgress: React.Dispatch<React.SetStateAction<UserProgress>>; onBuy: (pet: Pet) => void }> = ({ progress, setProgress, onBuy }) => {
  const [tab, setTab] = useState<'buy' | 'sell'>('buy');

  const shopItems = [
    { id: 'shop_1', name: 'Синее Жало', rarity: 'rare', price: 2500, element: 'ice', image: 'https://picsum.photos/seed/shop1/400/400', species: 'Ледяной Скорпион' },
    { id: 'shop_2', name: 'Пепельный Голем', rarity: 'epic', price: 6500, element: 'fire', image: 'https://picsum.photos/seed/shop2/400/400', species: 'Магматический Титан' },
    { id: 'shop_3', name: 'Тень Бездны', rarity: 'mythic', price: 15000, element: 'dark', image: 'https://picsum.photos/seed/shop3/400/400', species: 'Эфирный Ужас' },
    { id: 'shop_4', name: 'Золотой Дракон', rarity: 'legendary', price: 45000, element: 'light', image: 'https://picsum.photos/seed/shop4/400/400', species: 'Солнечный Змей' },
  ];

  const handleBuy = (item: any) => {
    if (progress.currency < item.price) {
      alert('Недостаточно рублей!');
      return;
    }

    const newPet: Pet = {
      id: Math.random().toString(36).substr(2, 9),
      name: item.name,
      rarity: item.rarity as Rarity,
      element: item.element as any,
      personality: 'calm',
      habitat: 'forest',
      image: item.image,
      stats: {
        attack: 8, defense: 6, speed: 7, magic: 9, regeneration: 2, health: 10
      },
      classification: {
        type: 'Животное', class: 'Магический', order: 'Хищник', family: 'Астральные', genus: 'Магазинный', species: item.species
      },
      abilities: ['Базовая атака'],
      lore: 'Был приобретен в элитном питомнике aiSai.',
      level: 1,
      experience: 0,
      materials: {},
      ageStage: 'детство',
      isRankRevealed: false,
      statPoints: 0
    };

    setProgress(prev => ({ ...prev, currency: prev.currency - item.price }));
    onBuy(newPet);
  };

  const handleSell = (petId: string) => {
    const petToSell = progress.pets.find(p => p.id === petId);
    if (!petToSell) return;

    if (progress.pets.length <= 1) {
      alert('Нельзя продать последнее животное!');
      return;
    }

    const price = calculateSellPrice(petToSell);
    if (!confirm(`Продать ${petToSell.name} за ${price} ₽?`)) return;

    setProgress(prev => ({
      ...prev,
      currency: prev.currency + price,
      pets: prev.pets.filter(p => p.id !== petId),
      activePetId: prev.activePetId === petId ? prev.pets.find(p => p.id !== petId)?.id || null : prev.activePetId
    }));
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-12 pt-12 pb-32">
       <header className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-center md:text-left space-y-1">
            <h1 className="text-6xl font-black italic text-pen-blue uppercase tracking-tighter">ПИТОМНИК</h1>
            <div className="text-pen-blue/40 text-[11px] font-bold uppercase tracking-[0.2em] italic">
               <HandwrittenText text="Торговая площадка и приют для редких существ..." speed={35} />
            </div>
          </div>
          
          <div className="flex bg-pen-blue/5 rounded-sm p-1 border-2 border-black/5 w-full md:w-auto hatching-shadow">
             <button 
               onClick={() => setTab('buy')}
               className={cn(
                 "flex-1 md:w-36 py-3 px-6 rounded-sm text-xs font-black uppercase tracking-widest transition-all italic",
                 tab === 'buy' ? "bg-sticker-yellow border-2 border-pen-blue text-pen-blue rotate-1 shadow-sm" : "text-pen-blue/30"
               )}
             >КУПИТЬ</button>
             <button 
               onClick={() => setTab('sell')}
               className={cn(
                 "flex-1 md:w-36 py-3 px-6 rounded-sm text-xs font-black uppercase tracking-widest transition-all italic",
                 tab === 'sell' ? "bg-sticker-pink border-2 border-pen-blue text-pen-blue -rotate-1 shadow-sm" : "text-pen-blue/30"
               )}
             >ПРОДАТЬ</button>
          </div>
       </header>

       <AnimatePresence mode="wait">
          {tab === 'buy' ? (
            <motion.div 
              key="buy"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
            >
               {shopItems.map((item, idx) => (
                <GlassCard key={item.id} color="white" delay={idx * 0.1} className="p-4 overflow-visible group border-2 border-black/5 hatching-shadow rounded-[2px] hover:-translate-y-2 transition-all">
                   <div className="aspect-[4/5] relative overflow-hidden rounded-sm border border-black/5 bg-white mb-4">
                      <img src={item.image} alt={item.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      <div className="absolute top-2 right-2">
                         <div className="px-3 py-1 rounded-sm bg-sticker-yellow text-[10px] font-black uppercase tracking-widest border-2 border-pen-blue rotate-6 shadow-sm">
                           {item.rarity}
                         </div>
                      </div>
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-6 bg-white/40 shadow-sm" />
                   </div>
                   
                   <div className="space-y-4">
                      <div className="text-center">
                         <div className="text-[10px] font-bold text-pen-blue/30 uppercase tracking-[0.2em] italic mb-1">{item.species}</div>
                         <h3 className="text-2xl font-black italic text-pen-blue leading-none mb-4">{item.name}</h3>
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t-2 border-pen-blue/5">
                         <div className="font-black text-pen-blue text-xl italic">{item.price} ₽</div>
                         <NeonButton 
                           onClick={() => handleBuy(item)}
                           className="py-2 px-10 text-[11px]"
                         >
                           КУПИТЬ
                         </NeonButton>
                      </div>
                   </div>
                </GlassCard>
               ))}
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
                <GlassCard key={pet.id} color="white" delay={idx * 0.1} className="flex gap-6 p-6 border-2 border-black/5 group hover:border-pen-red/20 transition-all hatching-shadow rounded-[4px] items-center">
                   <div className="h-24 w-24 rounded-sm overflow-hidden shrink-0 border-2 border-black/5 rotate-2">
                      <img src={pet.image} className="h-full w-full object-cover" />
                   </div>
                   <div className="flex-1 flex flex-col justify-between py-1 text-left">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                           <h3 className="text-2xl font-black italic text-pen-blue leading-none">{pet.name}</h3>
                           <span className="text-[11px] text-pen-blue/40 font-bold italic">LVL {pet.level}</span>
                        </div>
                        <div className="text-[10px] text-pen-blue/40 uppercase tracking-widest font-black italic">{pet.ageStage}</div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 mt-2 border-t-2 border-pen-blue/5">
                        <div className="font-black text-pen-blue text-lg italic">{calculateSellPrice(pet)} ₽</div>
                        <button 
                          onClick={() => handleSell(pet.id)}
                          className="flex items-center gap-1.5 text-pen-red hover:scale-110 transition-transform text-[11px] font-black uppercase tracking-widest italic"
                        >
                           <Trash2 className="h-4 w-4" />
                           ПРОДАТЬ
                        </button>
                      </div>
                   </div>
                </GlassCard>
               ))}
            </motion.div>
          )}
       </AnimatePresence>

       <GlassCard color="white" className="border-2 border-dashed border-black/10 text-center py-10 opacity-60 rounded-sm">
          <Scale className="h-10 w-10 mx-auto mb-4 text-pen-blue/20" />
          <p className="text-xs font-black uppercase tracking-[0.3em] italic text-pen-blue/40">Цена зависит от уровня, редкости, стадии и характеристик сущности</p>
       </GlassCard>
    </div>
  );
};

// removed local cn
