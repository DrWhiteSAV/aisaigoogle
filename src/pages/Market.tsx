import React, { useState } from 'react';
import { cn } from '../lib/utils';
import { UserProgress, Pet, Rarity, AgeStage } from '../types';
import { GlassCard, NeonButton } from '../components/UI';
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
    <div className="p-6 max-w-6xl mx-auto space-y-8 pt-12 pb-32">
       <header className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <h1 className="text-5xl font-black italic uppercase tracking-tighter">ПИТОМНИК</h1>
            <p className="text-white/50 text-xs uppercase tracking-[0.2em] font-medium opacity-60">Торговая площадка и приют для редких существ</p>
          </div>
          
          <div className="flex bg-white/5 rounded-2xl p-1 border border-white/10 w-full md:w-auto">
             <button 
               onClick={() => setTab('buy')}
               className={cn(
                 "flex-1 md:w-32 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                 tab === 'buy' ? "bg-neon-blue text-black shadow-lg" : "text-white/40"
               )}
             >КУПИТЬ</button>
             <button 
               onClick={() => setTab('sell')}
               className={cn(
                 "flex-1 md:w-32 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                 tab === 'sell' ? "bg-neon-pink text-white shadow-lg" : "text-white/40"
               )}
             >ПРОДАТЬ</button>
          </div>
       </header>

       <AnimatePresence mode="wait">
          {tab === 'buy' ? (
            <motion.div 
              key="buy"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            >
               {shopItems.map((item, idx) => (
                <GlassCard key={item.id} delay={idx * 0.1} className="p-0 overflow-hidden group border-white/10 hover:border-neon-blue/50 transition-all">
                   <div className="aspect-[4/5] relative overflow-hidden">
                      <img src={item.image} alt={item.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      <div className="absolute top-4 left-4 flex flex-col gap-2">
                        <div className="px-2 py-0.5 rounded-md bg-black/60 text-[8px] font-black uppercase tracking-tighter border border-white/10 backdrop-blur-md">
                          {item.rarity}
                        </div>
                      </div>
                      <div className="absolute bottom-4 left-4 right-4 z-10">
                         <div className="text-[10px] font-mono text-neon-blue uppercase tracking-[0.2em] mb-1">{item.species}</div>
                         <h3 className="text-xl font-black italic uppercase truncate">{item.name}</h3>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                   </div>
                   
                   <div className="p-5 flex items-center justify-between bg-black/40">
                      <div className="flex items-center gap-1.5">
                         <Coins className="h-4 w-4 text-rarity-legendary" />
                         <span className="font-black text-white text-lg">{item.price} ₽</span>
                      </div>
                      <NeonButton 
                        size="sm" 
                        variant="blue" 
                        onClick={() => handleBuy(item)}
                        className="py-2 px-6 rounded-full text-[10px]"
                      >
                        КУПИТЬ
                      </NeonButton>
                   </div>
                </GlassCard>
               ))}
            </motion.div>
          ) : (
            <motion.div 
              key="sell"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
               {progress.pets.map((pet, idx) => (
                <GlassCard key={pet.id} delay={idx * 0.1} className="flex gap-4 p-4 border-white/10 hover:border-neon-pink/50 transition-all">
                   <div className="h-24 w-24 rounded-2xl overflow-hidden shrink-0">
                      <img src={pet.image} className="h-full w-full object-cover" />
                   </div>
                   <div className="flex-1 flex flex-col justify-between py-1">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                           <h3 className="font-black italic uppercase tracking-tighter">{pet.name}</h3>
                           <span className="text-[9px] text-white/30 uppercase tracking-widest">LVL {pet.level}</span>
                        </div>
                        <div className="text-[9px] text-neon-blue uppercase tracking-widest font-bold">{pet.ageStage}</div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-2 border-t border-white/5">
                        <div className="flex items-center gap-1">
                           <Coins className="h-3 w-3 text-rarity-legendary" />
                           <span className="text-xs font-black">{calculateSellPrice(pet)} ₽</span>
                        </div>
                        <button 
                          onClick={() => handleSell(pet.id)}
                          className="flex items-center gap-1.5 text-neon-pink hover:text-white transition-colors text-[9px] font-black uppercase tracking-widest"
                        >
                           <Trash2 className="h-3 w-3" />
                           ПРОДАТЬ
                        </button>
                      </div>
                   </div>
                </GlassCard>
               ))}
            </motion.div>
          )}
       </AnimatePresence>

       <GlassCard className="border-dashed border-white/10 text-center py-10 opacity-60">
          <Scale className="h-8 w-8 mx-auto mb-4 text-white/20" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] italic">Цена зависит от уровня, редкости, стадии и характеристик</p>
       </GlassCard>
    </div>
  );
};

// removed local cn
