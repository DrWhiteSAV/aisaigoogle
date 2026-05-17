import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { UserProgress, Pet, Rarity, InventoryItem } from '../types';
import { GlassCard, NeonButton, AnimatedEgg, ItemIcon } from '../components/UI';
import { Trash2, Scale, Plus, Package, Sparkles, ShoppingBag } from 'lucide-react';
import { getSummonerRank, calculateCP, generateUniqueCode } from '../lib/gameLogic';
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
  if (item && 'rarity' in item && 'stats' in item) { // It's a pet
    return Math.floor(calculateCP(item) * 10);
  }
  
  const type = item.type === 'skill' ? (item.skillData?.type || item.skill?.type) : (item.type || item.skillData?.type);
  if (['passive', 'active_buff', 'active_debuff'].includes(type) || item.targetStat) {
    if (type === 'passive') return 800;
    if (type === 'active_buff') return 500;
    if (type === 'active_debuff') return 300;
  }

  return SELLING_PRICES[item.type as keyof typeof SELLING_PRICES] || 500;
};

export const Market: React.FC<{ progress: UserProgress; setProgress: React.Dispatch<React.SetStateAction<UserProgress>>; onBuy?: Function; mode?: string; }> = ({ progress, setProgress, mode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = mode === 'sell' ? 'sell' : 'buy';
  const [buyCategory, setBuyCategory] = useState<'eggs' | 'artifacts' | 'skills' | 'resources'>('eggs');

  useEffect(() => {
    if (location.hash === '#resources') {
      setBuyCategory('resources');
    }
  }, [location.hash]);
  const [selectedItemInfo, setSelectedItemInfo] = useState<any | null>(null);
  const [calculatorModal, setCalculatorModal] = useState<{ type: 'sprouts' | 'energy' } | null>(null);
  const [rublesForSprouts, setRublesForSprouts] = useState<number>(100);
  const [rublesForEnergy, setRublesForEnergy] = useState<number>(100);
  const [timeLeft, setTimeLeft] = useState("");

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

  // Filters
  const [artifactStatFilter, setArtifactStatFilter] = useState<string | 'all'>('all');
  const [skillStatFilter, setSkillStatFilter] = useState<string | 'all'>('all');
  const [skillTypeFilter, setSkillTypeFilter] = useState<string | 'all'>('all');
  const [skillAffinityFilter, setSkillAffinityFilter] = useState<string | 'all'>('all');

  const [eggStyle, setEggStyle] = useState<{ hue: number, cardColor: any }>({ hue: 0, cardColor: 'yellow' });
  useEffect(() => {
    const colors = ['yellow', 'blue', 'pink', 'white'];
    setEggStyle({
      hue: Math.floor(Math.random() * 360),
      cardColor: colors[Math.floor(Math.random() * colors.length)]
    });
  }, []);

  const shopItems = progress.marketInventory || [];
  const shopEggs = shopItems.filter(i => i.type === 'egg').slice(0, 1);
  if (shopEggs.length === 0) {
    shopEggs.push({
      name: 'Яйцо Питомца',
      code: 'egg_standard',
      type: 'egg',
      value: 5000,
      price: 5000,
      currency: 'sprouts',
      isBuy: true
    } as any);
  }
  const shopArtifacts = shopItems.filter(i => i.type === 'artifact');
  const shopSkills = shopItems.filter(i => i.type === 'skill');

  const handleSellPet = (petId: string) => {
    const pet = progress.pets.find(p => p.id === petId);
    if (!pet) return;
    const price = calculateSellPrice(pet);
    
    setProgress(prev => ({
      ...prev,
      sprouts: prev.sprouts + price,
      pets: prev.pets.filter(p => p.id !== petId)
    }));
  };

  const handleSellPetSkill = (petId: string, skillCode: string) => {
    const pet = progress.pets.find(p => p.id === petId);
    // Find by code OR id as fallback, ensure we get the item
    const skill = pet?.skills?.find(s => s.code === skillCode || s.id === skillCode);
    if (!pet || !skill) return;

    const price = calculateSellPrice(skill);
    setProgress(prev => ({
      ...prev,
      sprouts: prev.sprouts + price,
      pets: prev.pets.map(p => p.id === petId ? {
        ...p,
        skills: p.skills?.filter(s => (s.code || s.id) !== (skill.code || skill.id))
      } : p)
    }));
    
    // Clear selection after sale
    setSelectedItemInfo(null);
  };

  const handleSellItem = (itemCode: string) => {
    const item = progress.inventory.find(i => i.code === itemCode || i.id === itemCode);
    if (!item) return;
    const price = calculateSellPrice(item);
    setProgress(prev => ({
      ...prev,
      sprouts: prev.sprouts + price,
      inventory: prev.inventory.filter(i => (i.code || i.id) !== (item.code || item.id))
    }));
  };

  const [insufficientFundsItem, setInsufficientFundsItem] = useState<any | null>(null);

  const handleBuy = (item: any) => {
    if (progress.sprouts < item.value) {
      setInsufficientFundsItem(item);
      return;
    }

    setProgress(prev => {
      const newInventory = [...prev.inventory];
      const newItem = {
        ...item,
        // Give it a fresh unique code for the user's inventory to track its instance
        code: generateUniqueCode(item.type === 'egg' ? 'EG' : item.type === 'artifact' ? 'AR' : 'SK', '-owned'),
        isBuy: undefined
      };
      // If it's an egg, retain the hue they saw in shop!
      if (item.type === 'egg' && eggStyle) {
        newItem.hue = eggStyle.hue;
      }
      newInventory.push(newItem);

      const nextMarketInventory = item.type === 'egg' 
        ? prev.marketInventory 
        : (prev.marketInventory || []).filter(i => i.code !== item.code);

      // Randomize next egg style if egg was bought
      if (item.type === 'egg') {
        const colors = ['yellow', 'blue', 'pink', 'white'];
        setEggStyle({
          hue: Math.floor(Math.random() * 360),
          cardColor: colors[Math.floor(Math.random() * colors.length)]
        });
      }

      return {
        ...prev,
        sprouts: prev.sprouts - item.value,
        inventory: newInventory,
        marketInventory: nextMarketInventory
      };
    });
    setSelectedItemInfo(null);

    // Navigate to inventory after purchase with a small delay to allow state to settle
    setTimeout(() => {
      navigate('/inventory');
    }, 100);
  };

  const handleSellAction = (item: any) => {
    if (item.isPet) {
      handleSellPet(item.id);
    } else if (item.isPetSkill) {
      handleSellPetSkill(item.petId, item.code || item.id);
    } else {
      handleSellItem(item.code || item.id);
    }
    setSelectedItemInfo(null);
  };

  return (
    <div className="space-y-6 pb-20">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-black text-pen-blue italic">Магазин Сада</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm font-black text-pen-blue bg-sticker-blue/10 px-3 py-1 border-2 border-black rotate-[-1deg]">
             <Sparkles className="h-4 w-4 fill-pen-blue" />
             <span>Заряд: {progress.energy}</span>
             <span className="text-[10px] opacity-40">({timeLeft})</span>
          </div>
          <motion.div 
            key={progress.sprouts}
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.1, 1] }}
            className="flex items-center gap-2 bg-sticker-yellow px-4 py-1.5 border-2 border-pen-blue -rotate-1 shadow-sm"
          >
             <span className="text-sm font-black text-pen-blue">{progress.sprouts.toLocaleString()} 🌱</span>
          </motion.div>
        </div>
      </header>

      <div className="flex gap-2">
        <button 
          onClick={() => navigate('/shop')}
          className={cn(
            "flex-1 py-3 font-black text-sm tracking-widest border-2 transition-all",
            activeTab === 'buy' ? "bg-pen-blue text-white border-pen-blue translate-y-[-2px] shadow-[0_4px_0_0_#003380]" : "bg-white text-pen-blue/40 border-pen-blue/10 hover:border-pen-blue/20"
          )}
        >Покупка</button>
        <button 
          onClick={() => navigate('/sale')}
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
                    {shopEggs.map((item, i) => {
                      const color = eggStyle.cardColor;
                      return (
                      <GlassCard 
                        key={item.code}
                        color={color} 
                        className={cn(
                          "p-6 text-center border-2 border-black/5 hover:border-black/10 transition-all cursor-pointer",
                          color === 'yellow' ? 'bg-sticker-yellow/30' : color === 'blue' ? 'bg-sticker-blue/30' : color === 'pink' ? 'bg-sticker-pink/30' : 'bg-white'
                        )} 
                        onClick={() => setSelectedItemInfo({ ...item, hue: eggStyle.hue, isBuy: true })}
                      >
                         <div className="mb-2 relative mx-auto w-44 h-44 flex items-center justify-center">
                            <AnimatedEgg hue={eggStyle.hue} className="h-40 w-40" />
                         </div>
                         <h3 className="text-[20px] font-black text-pen-blue mb-1">{item.name}</h3>
                         <p className="text-[24px] text-pen-blue font-black">{item.value} 🌱</p>
                      </GlassCard>
                    )})}
                    {shopEggs.length === 0 && (
                      <div className="text-center py-12 text-pen-blue/40 font-black italic">Яйца закончились...</div>
                    )}
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
                      {shopArtifacts
                        .filter(item => artifactStatFilter === 'all' || item.effect?.stat === artifactStatFilter)
                        .map((item, i) => {
                      const colors: ("white" | "yellow" | "blue" | "pink")[] = ["white", "yellow", "blue", "pink"];
                      const cardColor = colors[i % colors.length];
                      return (
                        <GlassCard 
                          key={item.code || item.id} 
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
                      {shopSkills
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
                          key={item.code || item.id} 
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
                              setProgress(prev => {
                                const nextSprouts = prev.sprouts + amount;
                                return { ...prev, sprouts: nextSprouts };
                              });
                              setRublesForSprouts(100);
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
                              setRublesForEnergy(100);
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
                        key={`${pet.id}-${skill.code || skill.id || i}`} 
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
                               <div className="text-[12px] font-black bg-pen-blue/10 text-[#0047ab] px-3 py-0.5 rounded-full tracking-tighter">
                                 {skill.type === 'passive' ? 'Пассив' : 
                                  skill.type === 'active_buff' ? 'Бафф' : 'Дебафф'}
                               </div>
                               <div className="text-[12px] font-black text-[#0047ab] italic">
                                 {skill.type === 'passive' 
                                   ? (AFFINITY_MAP_RU[skill.attribute || ''] || skill.attribute) 
                                   : (AFFINITY_MAP_RU[skill.element || ''] || skill.element)}
                               </div>
                             </div>
                             <div className="text-[18px] font-black text-pen-blue mt-2 italic">{calculateSellPrice(skill)} <span className="not-italic inline-block" style={{ fontStyle: 'normal', transform: 'none' }}>🌱</span></div>
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
                            key={item.code || item.id} 
                            color={cardColor} 
                            className={cn(
                              "p-2 border-2 border-black/5 flex flex-col items-center aspect-[1/1.7] text-center cursor-pointer hover:scale-105 transition-all gap-2",
                              cardColor === 'yellow' ? 'bg-sticker-yellow/10' : 
                              cardColor === 'blue' ? 'bg-sticker-blue/10' : 
                              cardColor === 'pink' ? 'bg-sticker-pink/10' : 'bg-white'
                            )}
                            onClick={() => setSelectedItemInfo(item)}
                          >
                             <div className={cn("group-hover:scale-110 transition-transform flex items-center justify-center mx-auto", item.type === 'egg' ? "w-24 h-24" : "h-24 w-full text-7xl")}>
                                <ItemIcon 
                                  type={item.type} 
                                  image={item.image} 
                                  hue={item.hue}
                                  fallbackEmoji={item.fallbackEmoji}
                                  className={cn(item.type === 'egg' ? "w-20 h-20 scale-100" : "text-6xl")}
                                />
                             </div>
                             <div className="flex-1 flex flex-col justify-start w-full overflow-hidden">
                                <div>
                                  <div className="text-[14px] font-black text-[#0047ab] leading-tight px-1 break-words line-clamp-2">{item.name}</div>
                                  {isSkill && (
                                    <div className="flex flex-col items-center gap-1 mt-1">
                                      <div className="text-[12px] font-black bg-white/80 border border-[#0047ab]/10 text-[#0047ab] px-2 py-0.5 rounded-full tracking-tighter">
                                        {(item.skillData?.value || (item as any).value)}% • {item.skillData?.type === 'passive' ? 'Пассив' : 'Актив'}
                                      </div>
                                      <div className="text-[12px] font-black text-[#0047ab] italic">
                                        {item.skillData?.type === 'passive' 
                                          ? (AFFINITY_MAP_RU[item.skillData?.attribute || item.attribute || ''] || item.skillData?.attribute || item.attribute) 
                                          : (AFFINITY_MAP_RU[item.skillData?.element || item.element || ''] || item.skillData?.element || item.element)}
                                      </div>
                                    </div>
                                  )}
                                  <div className="text-[16px] font-black mt-1 italic text-[#0047ab]">{calculateSellPrice(item)} <span className="not-italic inline-block text-[#0047ab]">🌱</span></div>
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
                      className={cn("text-[144px] animate-bounce-slow origin-center", selectedItemInfo.type === 'egg' && "scale-[0.7]")} 
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
        {insufficientFundsItem && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-lg"
            onClick={() => setInsufficientFundsItem(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              className="w-full max-w-sm bg-white border-4 border-pen-blue shadow-2xl p-8 space-y-6 text-center"
              onClick={e => e.stopPropagation()}
            >
              <div className="space-y-2">
                <div className="bg-pen-red/10 border-2 border-pen-red p-4 -rotate-1">
                  <h3 className="text-xl font-black text-pen-red">Недостаточно ростков!</h3>
                  <p className="text-xs font-bold text-pen-red/70 mt-1">
                    Для покупки "{insufficientFundsItem.name}" вам не хватает {insufficientFundsItem.value - progress.sprouts} 🌱
                  </p>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t-2 border-dashed border-black/5">
                <h4 className="text-sm font-black text-pen-blue tracking-tighter">Пополнить баланс:</h4>
                <div className="flex items-center gap-4">
                  <input 
                    type="number" 
                    value={rublesForSprouts}
                    autoFocus
                    className="flex-1 p-3 border-4 border-pen-blue bg-white font-black text-2xl text-pen-blue text-center outline-none"
                    onChange={(e) => setRublesForSprouts(Math.max(0, parseInt(e.target.value) || 0))}
                  />
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-black text-pen-blue/40 uppercase">Получите</span>
                    <span className="text-lg font-black text-pen-blue">{rublesForSprouts * 100} 🌱</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <NeonButton 
                  onClick={() => {
                    const amount = rublesForSprouts * 100;
                    if (amount > 0) {
                      setProgress(prev => ({ ...prev, sprouts: prev.sprouts + amount }));
                      setRublesForSprouts(100); 
                      // If they now have enough, maybe we can even close the modal?
                      // But let's let them see the balance update first.
                    }
                  }}
                  className="w-full py-4 bg-sticker-yellow text-lg border-2 border-pen-blue shadow-[4px_4px_0px_0px_#1e3a8a]"
                >
                  Купить {rublesForSprouts * 100} 🌱
                </NeonButton>
                
                {progress.sprouts >= insufficientFundsItem.value && (
                  <NeonButton 
                    onClick={() => {
                      handleBuy(insufficientFundsItem);
                      setInsufficientFundsItem(null);
                    }}
                    className="w-full py-4 bg-pen-blue text-white text-lg"
                  >
                    Теперь хватает! Купить
                  </NeonButton>
                )}

                <button 
                  onClick={() => setInsufficientFundsItem(null)}
                  className="text-xs font-black text-pen-blue/40 uppercase tracking-widest py-2 hover:text-pen-blue transition-colors"
                >
                  Вернуться в магазин
                </button>
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
