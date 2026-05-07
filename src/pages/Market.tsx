import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { UserProgress, Pet, Rarity, InventoryItem } from '../types';
import { GlassCard, NeonButton, AnimatedEgg, ItemIcon } from '../components/UI';
import { Trash2, Scale, Plus, Package, Sparkles, ShoppingBag } from 'lucide-react';
import { getSummonerRank, calculateCP } from '../lib/gameLogic';
import { SELLING_PRICES, BUYING_PRICES, SHOP_ARTIFACTS, SHOP_SKILLS, STAT_MAP_RU } from '../constants/shop';

import { GalleryCard } from '../components/GalleryCard';
import { MarketPetCard } from '../components/MarketPetCard';

const AFFINITY_MAP_RU: Record<string, string> = {
  fire: 'Огонь',
  water: 'Вода',
  air: 'Воздух',
  earth: 'Земля',
  light: 'Свет',
  dark: 'Тьма',
  time: 'Время',
  void: 'Пустота'
};

const RARITY_MAP_RU: Record<string, string> = {
  normal: 'Нормальный',
  advanced: 'Продвинутый',
  rare: 'Редкий',
  perfect: 'Совершенный',
  epic: 'Эпический',
  legendary: 'Легендарный',
  mythical: 'Мифический',
  eternal: 'Вечный',
  divine: 'Божественный',
  transcendent: 'Трансцендентный'
};

const ITEM_TYPE_MAP_RU: Record<string, string> = {
  egg: 'Яйцо',
  artifact: 'Артефакт',
  skill: 'Навык',
  energy: 'Энергия',
  sprouts: 'Ростки',
  inventory: 'Предмет'
};

const calculateSellPrice = (item: any) => {
  if ('rarity' in item) { // It's a pet
    const basePrices: Record<string, number> = { 
      normal: 500, advanced: 1000, rare: 2500, perfect: 5000, 
      epic: 10000, legendary: 25000, mythical: 60000, eternal: 150000, 
      divine: 500000, transcendent: 1000000 
    };
    const stageMultipliers: Record<string, number> = { 
      'F': 1, 'E': 1.2, 'D': 1.5, 'C': 2, 'B': 3, 'A': 5, 'S': 8, 'EX': 15, 'UX': 30, 'Z': 100 
    };
    const rarity = item.rarity.toLowerCase() as string;
    const base = basePrices[rarity] || 500;
    const stage = item.ageStage.split(' ')[0];
    const mult = stageMultipliers[stage] || 1;
    return Math.floor(base * mult);
  }
  
  // Handle skills (both in inventory and on pets)
  if (item.type === 'skill' || item.targetStat) {
    const type = item.type === 'skill' ? item.skillData?.type : item.type;
    if (type === 'passive') return 800;
    if (type === 'active_buff') return 500;
    if (type === 'active_debuff') return 300;
  }

  return SELLING_PRICES[item.type as keyof typeof SELLING_PRICES] || 500;
};

export const Market: React.FC<{ progress: UserProgress; setProgress: React.Dispatch<React.SetStateAction<UserProgress>> }> = ({ progress, setProgress }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');
  const [buyCategory, setBuyCategory] = useState<'eggs' | 'artifacts' | 'skills' | 'resources'>('eggs');
  const [selectedItemInfo, setSelectedItemInfo] = useState<any | null>(null);
  const [calculatorModal, setCalculatorModal] = useState<{ type: 'sprouts' | 'energy' } | null>(null);
  const [rublesForSprouts, setRublesForSprouts] = useState<number>(100);
  const [rublesForEnergy, setRublesForEnergy] = useState<number>(100);

  // Filters
  const [artifactStatFilter, setArtifactStatFilter] = useState<string | 'all'>('all');
  const [skillStatFilter, setSkillStatFilter] = useState<string | 'all'>('all');
  const [skillTypeFilter, setSkillTypeFilter] = useState<string | 'all'>('all');
  const [skillAffinityFilter, setSkillAffinityFilter] = useState<string | 'all'>('all');

  const handleSellPet = (petId: string) => {
    const pet = progress.pets.find(p => p.id === petId);
    if (!pet) return;
    const price = calculateSellPrice(pet);
    if (confirm(`Продать ${pet.name} за ${price} 🌱?`)) {
      setProgress(prev => ({
        ...prev,
        sprouts: prev.sprouts + price,
        pets: prev.pets.filter(p => p.id !== petId)
      }));
    }
  };

  const handleSellPetSkill = (petId: string, skillId: string) => {
    const pet = progress.pets.find(p => p.id === petId);
    const skill = pet?.skills?.find(s => s.id === skillId);
    if (!pet || !skill) return;

    const price = calculateSellPrice(skill);
    if (confirm(`Продать навык "${skill.name}" за ${price} 🌱?`)) {
      setProgress(prev => ({
        ...prev,
        sprouts: prev.sprouts + price,
        pets: prev.pets.map(p => p.id === petId ? {
          ...p,
          skills: p.skills?.filter(s => s.id !== skillId)
        } : p)
      }));
    }
  };

  const handleSellItem = (itemId: string) => {
    const item = progress.inventory.find(i => i.id === itemId);
    if (!item) return;
    const price = calculateSellPrice(item);
    setProgress(prev => ({
      ...prev,
      sprouts: prev.sprouts + price,
      inventory: prev.inventory.filter(i => i.id !== itemId)
    }));
  };

  const handleBuy = (item: any) => {
    if (progress.sprouts < item.value) {
      alert('Недостаточно ростков!');
      return;
    }

    setProgress(prev => {
      const newInven = [...prev.inventory];
      if (item.type === 'egg') {
        newInven.push({
          id: 'egg-' + Date.now(),
          type: 'egg',
          name: 'Яйцо Питомца',
          description: 'Яйцо случайной сущности.',
          image: 'https://i.ibb.co/JwYQcc2D/egg.png',
          value: item.value,
          hue: Math.floor(Math.random() * 360)
        });
      } else {
        newInven.push({
          ...item,
          id: item.id + '-' + Date.now(),
          isBuy: undefined
        });
      }

      return {
        ...prev,
        sprouts: prev.sprouts - item.value,
        inventory: newInven
      };
    });
    setSelectedItemInfo(null);

    // Navigate to inventory after purchase
    navigate('/inventory');
  };

  const handleSellAction = (item: any) => {
    if (item.isPet) {
      handleSellPet(item.id);
    } else if (item.isPetSkill) {
      handleSellPetSkill(item.petId, item.id);
    } else {
      handleSellItem(item.id);
    }
    setSelectedItemInfo(null);
  };

  return (
    <div className="space-y-6 pb-20">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-black text-pen-blue italic">Магазин Сада</h1>
        <div className="flex items-center gap-2 bg-sticker-yellow px-4 py-1.5 border-2 border-pen-blue -rotate-1 shadow-sm">
           <span className="text-sm font-black text-pen-blue">{progress.sprouts} 🌱</span>
        </div>
      </header>

      <div className="flex gap-2">
        <button 
          onClick={() => setActiveTab('buy')}
          className={cn(
            "flex-1 py-3 font-black text-sm tracking-widest border-2 transition-all",
            activeTab === 'buy' ? "bg-pen-blue text-white border-pen-blue translate-y-[-2px] shadow-[0_4px_0_0_#003380]" : "bg-white text-pen-blue/40 border-pen-blue/10 hover:border-pen-blue/20"
          )}
        >Покупка</button>
        <button 
          onClick={() => setActiveTab('sell')}
          className={cn(
            "flex-1 py-3 font-black text-sm tracking-widest border-2 transition-all",
            activeTab === 'sell' ? "bg-pen-blue text-white border-pen-blue translate-y-[-2px] shadow-[0_4px_0_0_#003380]" : "bg-white text-pen-blue/40 border-pen-blue/10 hover:border-pen-blue/20"
          )}
        >Продажа</button>
      </div>

      <div className="min-h-[60vh]">
        {activeTab === 'buy' ? (
          <div className="space-y-6">
             <div className="flex flex-wrap gap-2">
                {[
                  { id: 'eggs', label: 'Яйца', icon: Plus },
                  { id: 'artifacts', label: 'Артефакты', icon: Package },
                  { id: 'skills', label: 'Навыки', icon: Sparkles },
                  { id: 'resources', label: 'Валюта', icon: Scale }
                ].map(cat => (
                  <button 
                    key={cat.id}
                    onClick={() => setBuyCategory(cat.id as any)}
                    className={cn(
                      "px-4 py-2 text-xs font-black tracking-tighter border-2 transition-all flex items-center gap-2",
                      buyCategory === cat.id ? "bg-sticker-yellow border-pen-blue -rotate-1" : "bg-white border-black/5 text-pen-blue/40 hover:border-pen-blue/20"
                    )}
                  >
                    <cat.icon className="h-3 w-3" />
                    {cat.label}
                  </button>
                ))}
             </div>

             <div className="space-y-4">
                {buyCategory === 'eggs' && (
                  <div className="grid grid-cols-1 gap-4">
                    <GlassCard 
                      color="yellow" 
                      className="p-6 text-center border-2 border-black/5 hover:border-black/10 transition-all cursor-pointer bg-sticker-yellow/30" 
                      onClick={() => setSelectedItemInfo({
                        id: `egg-shop`,
                        name: "Яйцо Питомца",
                        type: 'egg',
                        value: BUYING_PRICES.egg,
                        description: "Яйцо неведомого существа. Содержит в себе энергию случайной сущности. Можно высидеть в инкубаторе.",
                        image: "https://i.ibb.co/JwYQcc2D/egg.png",
                        isBuy: true,
                        isEgg: true,
                        hue: 30 // Shop egg color
                      })}
                    >
                       <div className="mb-2 relative mx-auto w-36 h-36 flex items-center justify-center">
                          <AnimatedEgg hue={30} className="h-32 w-32" />
                       </div>
                       <h3 className="text-[20px] font-black text-pen-blue mb-1">Яйцо Питомца</h3>
                       <p className="text-[24px] text-pen-blue font-black">{BUYING_PRICES.egg} 🌱</p>
                    </GlassCard>
                  </div>
                )}
                {buyCategory === 'artifacts' && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2 mb-2 p-3 bg-pen-blue/5 border border-pen-blue/10 rounded-lg">
                      <div className="text-[10px] font-black text-pen-blue/40 w-full mb-1">Фильтр по статам:</div>
                      {['all', 'attack', 'defense', 'speed', 'magic', 'health', 'regeneration'].map(st => (
                        <button
                          key={st}
                          onClick={() => setArtifactStatFilter(st)}
                          className={cn(
                            "px-3 py-1 text-[10px] font-black rounded-full border transition-all",
                            artifactStatFilter === st ? "bg-pen-blue text-white border-pen-blue" : "bg-white text-pen-blue/40 border-pen-blue/10 hover:border-pen-blue/20"
                          )}
                        >
                          {st === 'all' ? 'Все' : (STAT_MAP_RU[st] || st)}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      {SHOP_ARTIFACTS
                        .filter(item => artifactStatFilter === 'all' || item.effect?.stat === artifactStatFilter)
                        .map((item, i) => {
                      const colors: ("white" | "yellow" | "blue" | "pink")[] = ["white", "yellow", "blue", "pink"];
                      const cardColor = colors[i % colors.length];
                      return (
                        <GlassCard 
                          key={item.id} 
                          color={cardColor} 
                          className={cn(
                            "p-2 pt-4 border-2 border-black/5 flex flex-col items-center justify-between aspect-[1/1.5] cursor-pointer group hover:scale-105 transition-all text-center overflow-visible",
                            cardColor === 'yellow' ? 'bg-sticker-yellow/30' : 
                            cardColor === 'blue' ? 'bg-sticker-blue/30' : 
                            cardColor === 'pink' ? 'bg-sticker-pink/30' : 'bg-white'
                          )}
                          onClick={() => setSelectedItemInfo({ ...item, isBuy: true })}
                        >
                          <div className="w-full flex-1 flex flex-col items-center justify-center gap-1 z-10">
                             <div className="h-14 w-14 shrink-0 flex items-center justify-center">
                                <ItemIcon 
                                  type={item.type} 
                                  image={item.image} 
                                  hue={(item as any).hue}
                                  fallbackEmoji={item.fallbackEmoji}
                                  className="text-5xl group-hover:scale-110 transition-transform" 
                                />
                             </div>
                             <div className="text-[16px] font-black text-pen-blue leading-tight px-1 mt-1 z-20">
                               {item.name}
                             </div>
                             {item.effect && (
                               <div className="text-[12px] font-black text-pen-blue/60 flex items-center gap-1 mt-1">
                                 <Sparkles className="h-3 w-3" />
                                 <span>+{item.effect.value} {STAT_MAP_RU[item.effect.stat] || item.effect.stat}</span>
                               </div>
                             )}
                          </div>
                          <div className="w-full pt-1 border-t border-black/5 mt-1 relative z-10">
                             <div className="text-[18px] font-black text-pen-blue italic">{item.value} 🌱</div>
                          </div>
                        </GlassCard>
                      );
                    })}
                    </div>
                  </div>
                )}

                {buyCategory === 'skills' && (
                  <div className="space-y-4">
                    <div className="space-y-2 p-3 bg-pen-blue/5 border border-pen-blue/10 rounded-lg">
                      <div className="flex flex-wrap gap-2">
                        <div className="text-[10px] font-black text-pen-blue/40 w-full text-left">Тип навыка:</div>
                        {['all', 'passive', 'active_buff', 'active_debuff'].map(t => (
                          <button
                            key={t}
                            onClick={() => setSkillTypeFilter(t)}
                            className={cn(
                              "px-3 py-1 text-[10px] font-black rounded-full border transition-all",
                              skillTypeFilter === t ? "bg-pen-blue text-white border-pen-blue" : "bg-white text-pen-blue/40 border-pen-blue/10 hover:border-pen-blue/20"
                            )}
                          >
                            {t === 'all' ? 'Все' : t === 'passive' ? 'Пассивный' : t === 'active_buff' ? 'Боевой Бафф' : 'Боевой Дебафф'}
                          </button>
                        ))}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <div className="text-[10px] font-black text-pen-blue/40 w-full text-left">Характеристика:</div>
                        {['all', 'attack', 'defense', 'speed', 'magic', 'health', 'regeneration'].map(st => (
                          <button
                            key={st}
                            onClick={() => setSkillStatFilter(st)}
                            className={cn(
                              "px-3 py-1 text-[10px] font-black rounded-full border transition-all",
                              skillStatFilter === st ? "bg-pen-blue text-white border-pen-blue" : "bg-white text-pen-blue/40 border-pen-blue/10 hover:border-pen-blue/20"
                            )}
                          >
                            {st === 'all' ? 'Все' : (STAT_MAP_RU[st] || st)}
                          </button>
                        ))}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <div className="text-[10px] font-black text-pen-blue/40 w-full text-left">Стихия/Атрибут:</div>
                        {[
                          { id: 'all', label: 'Все' },
                          { id: 'fire', label: 'Огонь' }, { id: 'water', label: 'Вода' }, { id: 'air', label: 'Воздух' }, { id: 'earth', label: 'Земля' },
                          { id: 'light', label: 'Свет' }, { id: 'dark', label: 'Тьма' }, { id: 'time', label: 'Время' }, { id: 'void', label: 'Пустота' }
                        ].map(a => (
                          <button
                            key={a.id}
                            onClick={() => setSkillAffinityFilter(a.id)}
                            className={cn(
                              "px-3 py-1 text-[10px] font-black rounded-full border transition-all",
                              skillAffinityFilter === a.id ? "bg-pen-blue text-white border-pen-blue" : "bg-white text-pen-blue/40 border-pen-blue/10 hover:border-pen-blue/20"
                            )}
                          >
                            {a.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      {SHOP_SKILLS
                        .filter(item => {
                          if (!item.skillData) return true;
                          const t = skillTypeFilter === 'all' || item.skillData.type === skillTypeFilter;
                          const s = skillStatFilter === 'all' || item.skillData.targetStat === skillStatFilter;
                          const affinity = skillAffinityFilter === 'all' || 
                                          item.skillData.element === skillAffinityFilter || 
                                          item.skillData.attribute === skillAffinityFilter;
                          return t && s && affinity;
                        })
                        .map((item, i) => {
                      const colors: ("white" | "yellow" | "blue" | "pink")[] = ["white", "yellow", "blue", "pink"];
                      const cardColor = colors[(i + 2) % colors.length];
                      return (
                        <GlassCard 
                          key={item.id} 
                          color={cardColor} 
                          className={cn(
                            "p-2 pt-4 border-2 border-black/5 flex flex-col items-center justify-between aspect-[1/1.5] cursor-pointer group hover:scale-105 transition-all text-center overflow-visible",
                            cardColor === 'yellow' ? 'bg-sticker-yellow/30' : 
                            cardColor === 'blue' ? 'bg-sticker-blue/30' : 
                            cardColor === 'pink' ? 'bg-sticker-pink/30' : 'bg-white'
                          )}
                          onClick={() => setSelectedItemInfo({ ...item, isBuy: true })}
                        >
                          <div className="w-full flex-1 flex flex-col items-center justify-center gap-1 z-10">
                             <div className="h-14 w-14 shrink-0 flex items-center justify-center">
                                <ItemIcon 
                                  type={item.type} 
                                  image={item.image} 
                                  hue={(item as any).hue}
                                  fallbackEmoji={item.fallbackEmoji}
                                  className="text-5xl group-hover:scale-110 transition-transform" 
                                />
                             </div>
                             <div className="text-[16px] font-black text-pen-blue leading-tight px-1 mt-1 z-20">
                               {item.name}
                             </div>
                             {item.skillData && (
                               <div className="flex flex-col items-center gap-1 mt-1">
                                 <div className="text-[10px] font-black bg-pen-blue/10 text-pen-blue rounded-full px-2 py-0.5 tracking-tighter">
                                   {item.skillData.type === 'passive' ? 'Пассивный' : 
                                    item.skillData.type === 'active_buff' ? 'Боевой Бафф' : 'Боевой Дебафф'}
                                 </div>
                                 <div className="text-[11px] font-black text-pen-blue/70">
                                   {item.skillData.type === 'passive' 
                                     ? (item.skillData.attribute === 'light' ? 'Свет' : item.skillData.attribute === 'dark' ? 'Тьма' : item.skillData.attribute === 'time' ? 'Время' : 'Пустота')
                                     : (item.skillData.element === 'fire' ? 'Огонь' : item.skillData.element === 'water' ? 'Вода' : item.skillData.element === 'air' ? 'Воздух' : 'Земля')
                                   }
                                 </div>
                                 <div className="text-[12px] font-black text-pen-blue/60 flex items-center gap-1">
                                   <Sparkles className="h-3 w-3" />
                                   <span>+{item.skillData.value}% {STAT_MAP_RU[item.skillData.targetStat] || item.skillData.targetStat}</span>
                                 </div>
                               </div>
                             )}
                          </div>
                          <div className="w-full pt-1 border-t border-black/5 mt-1 relative z-10">
                             <div className="text-[18px] font-black text-pen-blue italic">{item.value} 🌱</div>
                          </div>
                        </GlassCard>
                      );
                    })}
                    </div>
                  </div>
                )}

                {buyCategory === 'resources' && (
                   <div className="space-y-4">
                      <GlassCard color="blue" className="p-6 border-2 border-black/5 flex flex-col items-center gap-4">
                         <div className="text-center">
                            <h3 className="text-xl font-black text-pen-blue">Покупка Ростков</h3>
                            <p className="text-sm text-pen-blue/60 font-bold">Курс: 100 🌱 = 1 ₽</p>
                         </div>
                         <div className="flex items-center gap-4 w-full cursor-pointer" onClick={() => setCalculatorModal({ type: 'sprouts' })}>
                            <div className="flex-1 p-3 border-2 border-pen-blue/20 bg-white font-black text-pen-blue outline-none flex items-center justify-between">
                               <span>{rublesForSprouts} ₽</span>
                               <Plus className="h-4 w-4 opacity-40" />
                            </div>
                            <div className="text-sm font-black text-pen-blue">Получите: {rublesForSprouts * 100} 🌱</div>
                         </div>
                         <NeonButton 
                           onClick={() => {
                              if (rublesForSprouts <= 0) return;
                              const amount = rublesForSprouts * 100;
                              setProgress(prev => ({ ...prev, sprouts: prev.sprouts + amount }));
                              setRublesForSprouts(0);
                              alert(`Пополнено на ${amount} 🌱!`);
                           }}
                           className="w-full py-3 bg-sticker-yellow text-sm"
                         >
                           Купить Ростки
                         </NeonButton>
                      </GlassCard>

                      <GlassCard color="pink" className="p-6 border-2 border-black/5 flex flex-col items-center gap-4">
                         <div className="text-center">
                            <h3 className="text-xl font-black text-pen-blue">Покупка Энергии</h3>
                            <p className="text-sm text-pen-blue/60 font-bold">Курс: 10 ⚡ = 1 ₽</p>
                         </div>
                         <div className="flex items-center gap-4 w-full cursor-pointer" onClick={() => setCalculatorModal({ type: 'energy' })}>
                            <div className="flex-1 p-3 border-2 border-pen-blue/20 bg-white font-black text-pen-blue outline-none flex items-center justify-between">
                               <span>{rublesForEnergy} ₽</span>
                               <Plus className="h-4 w-4 opacity-40" />
                            </div>
                            <div className="text-sm font-black text-pen-blue">Получите: {rublesForEnergy * 10} ⚡</div>
                         </div>
                         <NeonButton 
                           onClick={() => {
                              if (rublesForEnergy <= 0) return;
                              const amount = rublesForEnergy * 10;
                              setProgress(prev => ({ ...prev, energy: prev.energy + amount }));
                              setRublesForEnergy(0);
                              alert(`Пополнено на ${amount} ⚡!`);
                           }}
                           className="w-full py-3 bg-sticker-pink text-sm"
                         >
                           Купить Энергию
                         </NeonButton>
                      </GlassCard>
                   </div>
                )}
             </div>
          </div>
        ) : (
          <div className="space-y-8">
             <div className="space-y-4">
                <div className="text-[16px] font-black text-pen-blue px-1 opacity-100">Ваши питомцы</div>
                <div className="grid grid-cols-3 gap-3">
                  {progress.pets.map((pet) => (
                    <MarketPetCard 
                      key={pet.id}
                      pet={pet}
                      isCompact
                      className="w-full"
                      showPrice={calculateSellPrice(pet)}
                      onClick={() => setSelectedItemInfo({ ...pet, isPet: true })}
                    />
                  ))}
                </div>
             </div>

             <div className="space-y-4">
                <div className="text-[16px] font-black text-pen-blue px-1 opacity-100">Навыки на питомцах</div>
                <div className="grid grid-cols-3 gap-3">
                  {progress.pets.flatMap(p => (p.skills || []).map(s => ({ pet: p, skill: s }))).map(({ pet, skill }, i) => {
                     const colors: ("white" | "yellow" | "blue" | "pink")[] = ["white", "yellow", "blue", "pink"];
                     const cardColor = colors[i % colors.length];
                     return (
                      <GlassCard 
                        key={`${pet.id}-${skill.id}`} 
                        color={cardColor} 
                        className={cn(
                          "p-2 border-2 border-black/5 flex flex-col items-center cursor-pointer group text-center aspect-[1/1.8] hover:scale-105 transition-all",
                          cardColor === 'yellow' ? 'bg-sticker-yellow/20' : 
                          cardColor === 'blue' ? 'bg-sticker-blue/20' : 
                          cardColor === 'pink' ? 'bg-sticker-pink/20' : 'bg-white/50'
                        )}
                        onClick={() => setSelectedItemInfo({ 
                         ...skill, 
                         id: skill.id, 
                         isPetSkill: true, 
                         petId: pet.id,
                         petName: pet.name,
                         skillData: skill // for modal compatibility
                        })}
                      >
                       <div className="h-24 w-full flex items-center justify-center mb-1">
                          <ItemIcon 
                            type="skill" 
                            image={skill.image} 
                            fallbackEmoji={skill.fallbackEmoji} 
                            className="text-7xl group-hover:scale-110 transition-transform" 
                          />
                       </div>
                        <div className="flex-1 w-full min-h-0 flex flex-col justify-between">
                           <div className="space-y-1">
                             <h3 className="text-[16px] font-black text-pen-blue leading-tight px-1 break-words">{skill.name}</h3>
                             <div className="text-[10px] font-black text-pen-blue/40">Владелец: {pet.name}</div>
                             <div className="flex flex-col items-center gap-1 mt-2">
                               <div className="text-[12px] font-black bg-pen-blue/10 text-pen-blue px-3 py-0.5 rounded-full tracking-tighter">
                                 {skill.type === 'passive' ? 'Пассивный' : 
                                  skill.type === 'active_buff' ? 'Бафф' : 'Дебафф'}
                               </div>
                               <div className="text-[11px] font-black text-pen-blue/60 italic">
                                 {skill.type === 'passive' 
                                   ? (AFFINITY_MAP_RU[skill.attribute || ''] || skill.attribute) 
                                   : (AFFINITY_MAP_RU[skill.element || ''] || skill.element)}
                               </div>
                             </div>
                             <div className="text-[18px] font-black text-pen-blue mt-2 italic">{calculateSellPrice(skill)} 🌱</div>
                           </div>
                        </div>
                      </GlassCard>
                     );
                  })}
                </div>
             </div>

             {progress.inventory.length > 0 && (
               <div className="space-y-4">
                  <div className="text-[16px] font-black text-pen-blue px-1 opacity-100">Ваш инвентарь</div>
                  <div className="grid grid-cols-3 gap-3">
                    {progress.inventory.map((item, i) => {
                       const colors: ("white" | "yellow" | "blue" | "pink")[] = ["white", "yellow", "blue", "pink"];
                       const cardColor = colors[i % colors.length];
                       const isSkill = item.type === 'skill' || item.targetStat;
                       const isEgg = item.type === 'egg';
                       return (
                          <GlassCard 
                            key={item.id} 
                            color={cardColor} 
                            className={cn(
                              "p-2 border-2 border-black/5 flex flex-col items-center aspect-[1/1.7] text-center cursor-pointer hover:scale-105 transition-all gap-2",
                              cardColor === 'yellow' ? 'bg-sticker-yellow/10' : 
                              cardColor === 'blue' ? 'bg-sticker-blue/10' : 
                              cardColor === 'pink' ? 'bg-sticker-pink/10' : 'bg-white'
                            )}
                            onClick={() => setSelectedItemInfo(item)}
                          >
                             <div className="h-24 w-full flex items-center justify-center mb-1">
                                <ItemIcon 
                                  type={item.type} 
                                  image={item.image} 
                                  hue={item.hue}
                                  fallbackEmoji={item.fallbackEmoji}
                                  className="text-7xl group-hover:scale-110 transition-transform" 
                                />
                             </div>
                             <div className="flex-1 flex flex-col justify-between w-full">
                                <div>
                                  <div className="text-[16px] font-black leading-tight px-1 break-words">{item.name}</div>
                                  {isSkill && (
                                    <div className="flex flex-col items-center gap-1 mt-2">
                                      <div className="text-[16px] font-black bg-pen-blue/10 text-pen-blue px-3 py-0.5 rounded-full tracking-tighter">
                                        {item.type === 'passive' ? 'Пассивный' : 
                                         item.type === 'active_buff' ? 'Бафф' : 'Дебафф'}
                                      </div>
                                      <div className="text-[12px] font-black text-pen-blue/60 italic">
                                        {item.type === 'passive' 
                                          ? (AFFINITY_MAP_RU[item.attribute || ''] || item.attribute) 
                                          : (AFFINITY_MAP_RU[item.element || ''] || item.element)}
                                      </div>
                                    </div>
                                  )}
                                  <div className="text-[18px] font-black mt-2 italic">{calculateSellPrice(item)} 🌱</div>
                                </div>
                             </div>
                          </GlassCard>
                       );
                    })}
                  </div>
               </div>
             )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedItemInfo && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/50 backdrop-blur-md"
            onClick={() => setSelectedItemInfo(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              className="w-full max-w-sm bg-[#f2ede0] ledger-grid border-4 border-pen-blue shadow-2xl relative overflow-visible text-center p-8 space-y-6"
              onClick={e => e.stopPropagation()}
            >
              <div className="absolute top-0 right-0 p-4">
                <button onClick={() => setSelectedItemInfo(null)} className="text-pen-blue hover:scale-110 transition-transform">
                  <Plus className="h-8 w-8 rotate-45" />
                </button>
              </div>

              {selectedItemInfo.isPet ? (
                <div className="space-y-6">
                  <div className="bg-transparent mx-auto relative h-[420px] w-[236px] flex items-center justify-center p-4">
                    <div className="relative group w-full h-full">
                       <MarketPetCard 
                         pet={selectedItemInfo} 
                         className="w-full h-full"
                       />
                       <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-[100] bg-sticker-yellow border-2 border-pen-blue px-3 py-0.5 font-black text-[12px] -rotate-2 whitespace-nowrap">
                          {selectedItemInfo.ageStage}
                       </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="bg-transparent mx-auto relative h-[200px] w-full flex items-center justify-center p-4">
                    <ItemIcon 
                      type={selectedItemInfo.type || 'inventory'} 
                      image={selectedItemInfo.image} 
                      hue={selectedItemInfo.hue}
                      fallbackEmoji={selectedItemInfo.fallbackEmoji}
                      className="text-[144px] animate-bounce-slow" 
                    />
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-2xl font-black text-pen-blue leading-tight">{selectedItemInfo.name}</h3>
                    {selectedItemInfo.petName && (
                      <div className="text-xs font-black text-pen-blue/40">Питомец: {selectedItemInfo.petName}</div>
                    )}
                    <div className="text-[10px] font-black text-pen-blue/30 tracking-widest">
                      {(ITEM_TYPE_MAP_RU[selectedItemInfo.type] || selectedItemInfo.type)}
                    </div>
                  </div>

                  {selectedItemInfo.description && (
                    <div className="bg-white/50 p-4 border-2 border-black/5 rotate-1">
                      <p className="text-[14px] font-bold text-pen-blue/80 italic leading-snug">{selectedItemInfo.description}</p>
                    </div>
                  )}

                  {(selectedItemInfo.skillData || selectedItemInfo.effect) && (
                    <div className="grid grid-cols-2 gap-4 border-t border-b border-black/5 py-4">
                        {selectedItemInfo.skillData ? (
                         <>
                            <div>
                              <div className="text-[10px] font-black text-pen-blue/30">Влияние</div>
                              <div className="text-lg font-black text-pen-blue tracking-tighter">+{selectedItemInfo.skillData.value}%</div>
                            </div>
                            <div>
                              <div className="text-[10px] font-black text-pen-blue/30">Тип</div>
                              <div className="text-xs font-black text-pen-blue truncate">
                                {selectedItemInfo.skillData.type === 'passive' ? 'Пассив' : 'Актив'}
                              </div>
                            </div>
                         </>
                       ) : (
                         <div className="col-span-2">
                            <div className="text-[10px] font-black text-pen-blue/30">Бонус характеристик</div>
                            <div className="text-lg font-black text-pen-blue">
                              +{selectedItemInfo.effect?.value} {STAT_MAP_RU[selectedItemInfo.effect?.stat] || selectedItemInfo.effect?.stat}
                            </div>
                         </div>
                       )}
                    </div>
                  )}
                </>
              )}
              
              <div className="flex flex-col gap-3">
                {selectedItemInfo.isBuy ? (
                  <NeonButton 
                    onClick={() => handleBuy(selectedItemInfo)} 
                    className="w-full py-4 bg-sticker-yellow border-2 border-pen-blue text-[20px] font-black"
                  >
                    Купить за {selectedItemInfo.price || selectedItemInfo.value} 🌱
                  </NeonButton>
                ) : (
                  <NeonButton 
                    onClick={() => handleSellAction(selectedItemInfo)} 
                    className="w-full py-4 bg-pen-red text-white border-2 border-pen-blue text-[20px] font-black shadow-[4px_4px_0px_0px_#1e3a8a]"
                  >
                    Продать за {calculateSellPrice(selectedItemInfo)} 🌱
                  </NeonButton>
                )}
                <button onClick={() => setSelectedItemInfo(null)} className="text-[14px] font-black text-pen-blue/40 tracking-widest py-1 hover:text-pen-blue transition-colors">Вернуться</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


      <AnimatePresence>
        {calculatorModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1100] flex items-center justify-center p-6 bg-black/50 backdrop-blur-md"
            onClick={() => setCalculatorModal(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              className="w-full max-w-xs bg-white border-4 border-pen-blue shadow-2xl p-8 space-y-6"
              onClick={e => e.stopPropagation()}
            >
              <div className="text-center space-y-2">
                <h3 className="text-xl font-black text-pen-blue">Калькулятор</h3>
                <p className="text-sm text-pen-blue/60 font-bold">Введите сумму в рублях</p>
              </div>

              <div className="space-y-4">
                <input 
                  type="number" 
                  autoFocus
                  value={calculatorModal.type === 'sprouts' ? rublesForSprouts : rublesForEnergy}
                  className="w-full p-4 border-4 border-pen-blue bg-white font-black text-3xl text-pen-blue text-center outline-none"
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    if (calculatorModal.type === 'sprouts') setRublesForSprouts(val);
                    else setRublesForEnergy(val);
                  }}
                />
                <div className="text-center p-4 bg-pen-blue/5 border-2 border-dashed border-pen-blue/20">
                  <div className="text-[10px] font-black text-pen-blue/40">Вы получите</div>
                  <div className="text-2xl font-black text-pen-blue">
                    {calculatorModal.type === 'sprouts' ? rublesForSprouts * 100 : rublesForEnergy * 10}
                    {calculatorModal.type === 'sprouts' ? ' 🌱' : ' ⚡'}
                  </div>
                </div>
              </div>

              <NeonButton 
                onClick={() => setCalculatorModal(null)}
                className="w-full py-4 bg-sticker-yellow text-lg"
              >
                Подтвердить
              </NeonButton>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
