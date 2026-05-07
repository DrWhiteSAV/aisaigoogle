import React, { useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { UserProgress, Pet, Element, Attribute, InventoryItem, Skill, PetStats } from '../types';
import { GlassCard, NeonButton, HandwrittenText, ItemIcon } from '../components/UI';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Shield, Sword, Brain, Zap, Sparkles, Heart, Activity, Compass, Package, Plus, ArrowLeft } from 'lucide-react';
import { getPetRankByLevel, calculateCP, getExpNeeded, getPassiveBonus, getEffectiveStat } from '../lib/gameLogic';
import { ElementSticker, AttributeSticker, InfoModal, TypeChartContent } from '../components/GameUI';
import { RARITY_LABELS } from '../constants/gameData';
import { STAT_MAP_RU } from '../constants/shop';
import { PetCard } from '../components/PetCard';

const SkillItem: React.FC<{ skill: Skill; onClick: () => void }> = ({ skill, onClick }) => (
  <button 
    onClick={onClick}
    className={cn(
      "px-3 py-1.5 bg-white border-2 border-black text-xs font-black italic -rotate-1 transition-transform hover:scale-105 hover:bg-sticker-yellow flex items-center gap-2",
      skill.type === 'passive' ? "border-green-600 border-dashed" : "border-pen-blue"
    )}
  >
    <ItemIcon 
      type="skill" 
      image={skill.image} 
      fallbackEmoji={skill.fallbackEmoji} 
      className="w-4 h-4" 
    />
    <span>{skill.name}</span>
  </button>
);

export const PetDetail: React.FC<{ 
  progress: UserProgress; 
  setProgress: React.Dispatch<React.SetStateAction<UserProgress>>;
  manualId?: string | null;
  initialTab?: 'stats' | 'inventory';
  toggleFlipLock?: (id: string, locked: boolean) => void;
  id?: string;
  onAddNewPet?: (pet: Pet) => void;
}> = ({ progress, setProgress, manualId, initialTab = 'stats', toggleFlipLock, id: manualPageId, onAddNewPet }) => {
  const navigate = useNavigate();
  const componentId = React.useId();
  const lockId = `pet-detail-${manualPageId || componentId}`;
  
  const { id: paramsId } = useParams<{ id: string }>();
  const location = useLocation();
  const id = manualId || paramsId;
  const [activeTab, setActiveTab] = useState<'stats' | 'inventory'>(location.state?.openInventory ? 'inventory' : initialTab);
  const [modalType, setModalType] = useState<{ element?: Element, attribute?: Attribute, rank?: boolean, stats?: boolean, fullScreenImage?: string, selectedSkill?: Skill } | null>(null);
  const [itemToUse, setItemToUse] = useState<InventoryItem | null>(null);
  const [selectedItemInfo, setSelectedItemInfo] = useState<InventoryItem | null>(null);

  // Inventory Filters
  const [invCategoryFilter, setInvCategoryFilter] = useState<'all' | 'egg' | 'artifact' | 'skill'>('all');
  const [invStatFilter, setInvStatFilter] = useState<string | 'all'>('all');
  const [invSkillTypeFilter, setInvSkillTypeFilter] = useState<string | 'all'>('all');
  const [invAffinityFilter, setInvAffinityFilter] = useState<string | 'all'>('all');

  React.useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const pet = (progress.pets || []).find(p => p.id === id);
  const potentialRank = pet ? getPetRankByLevel(pet.level) : null;
  const currentRankCode = pet?.ageStage.split(' ')[0];
  const potentialRankCode = potentialRank?.split(' ')[0];
  const rankIndex = ['F', 'E', 'D', 'C', 'B', 'A', 'S', 'EX', 'UX', 'Z'].indexOf(potentialRankCode || 'F');
  const expectedSkills = (rankIndex * 2) + 2;
  const isEvolutionReady = pet && potentialRank && (
    potentialRankCode !== currentRankCode || (pet.level >= 11 && (pet.skills || []).length < expectedSkills)
  );

  React.useEffect(() => {
    if (toggleFlipLock) {
      toggleFlipLock(lockId, !!modalType);
    }
  }, [modalType, toggleFlipLock, lockId]);

  if (!pet) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-6">
        <div className="h-24 w-24 border-4 border-dashed border-black/5 rounded-full flex items-center justify-center">
            <Sparkles className="h-10 w-10 text-black/10" />
        </div>
        <div>
          <h2 className="text-3xl font-black text-pen-blue">Сущность не выбрана</h2>
          <p className="text-pen-blue/40 font-black mt-2">Нажмите на карточку в Бестиарии слева</p>
        </div>
      </div>
    );
  }

  const handleBack = () => {
    if (initialTab === 'inventory' || activeTab === 'inventory') {
      navigate(`/pet/${id}`);
    } else {
      navigate('/main');
    }
  };

  const handleTitleClick = () => {
    if (initialTab === 'inventory' || activeTab === 'inventory') {
      navigate(`/pet/${id}`);
    }
  };

  const allocatePoint = (stat: keyof typeof pet.stats) => {
    if (pet.statPoints <= 0) return;
    setProgress(prev => ({
      ...prev,
      pets: (Array.isArray(prev.pets) ? prev.pets : []).map(p => p.id === pet.id ? {
        ...p,
        statPoints: p.statPoints - 1,
        stats: {
          ...p.stats,
          [stat]: (p.stats[stat] || 0) + 1,
          maxHealth: stat === 'health' ? (p.stats.maxHealth || 100) + 1 : (p.stats.maxHealth || 100)
        }
      } : p)
    }));
  };

  const handleUseItem = (item: InventoryItem, targetPetId: string) => {
    setProgress(prev => {
      const updatedInventory = prev.inventory.filter(i => i.id !== item.id);
      const updatedPets = prev.pets.map(p => {
        if (p.id === targetPetId) {
          if (item.type === 'artifact' && item.effect) {
            const stat = item.effect.stat;
            const val = item.effect.value;
            return {
              ...p,
              stats: {
                ...p.stats,
                [stat]: (p.stats[stat] || 0) + val,
                maxHealth: stat === 'health' ? (p.stats.maxHealth || 100) + val : p.stats.maxHealth
              }
            };
          }
          if (item.type === 'skill' && item.skillData) {
            const newSkill: Skill = {
              id: 'skill-' + Date.now(),
              name: item.name,
              description: item.description,
              type: item.skillData.type,
              targetStat: item.skillData.targetStat,
              value: item.skillData.value
            };
            return {
              ...p,
              skills: [...(p.skills || []), newSkill]
            };
          }
        }
        return p;
      });

      return {
        ...prev,
        inventory: updatedInventory,
        pets: updatedPets
      };
    });
    setItemToUse(null);
    navigate(`/pet/${targetPetId}`);
  };

  const handleSellSkill = (skillId: string) => {
    const skill = pet.skills?.find(s => s.id === skillId);
    if (!skill) return;

    let price = 800; // default for passive
    if (skill.type === 'active_buff') price = 500;
    if (skill.type === 'active_debuff') price = 300;

    if (confirm(`Продать навык "${skill.name}" за ${price} 🌱?`)) {
      setProgress(prev => ({
        ...prev,
        sprouts: prev.sprouts + price,
        pets: prev.pets.map(p => p.id === pet.id ? {
          ...p,
          skills: p.skills?.filter(s => s.id !== skillId)
        } : p)
      }));
      setModalType(null);
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <header className="flex items-center justify-between border-b-2 border-black/5 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={handleBack} className="p-2 hover:bg-black/5 rounded-full transition-colors">
            <ArrowLeft className="h-5 w-5 text-pen-blue" />
          </button>
          <div className="text-2xl font-black text-pen-blue hover:opacity-70 cursor-pointer" onClick={handleTitleClick}>
            {pet.name}
            {isEvolutionReady && (
              <motion.span 
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                className="ml-3 text-[10px] bg-pen-red text-white px-2 py-0.5 rounded-full tracking-widest align-middle"
              >
                Готов к эволюции!
              </motion.span>
            )}
          </div>
        </div>
      </header>

      <div className="space-y-8 flex flex-col items-center">
        {!manualId && pet && (
          <PetCard 
            pet={pet} 
            className="w-full max-w-[320px]"
            onOpenRankInfo={() => setModalType({ rank: true })}
            onOpenRarityInfo={() => setModalType({ stats: true })}
            onOpenImage={() => setModalType({ fullScreenImage: pet.image })}
            onOpenElementInfo={(el) => setModalType({ element: el })}
            onOpenAttributeInfo={(attr) => setModalType({ attribute: attr })}
            onOpenStore={() => navigate('/shop')}
            onOpenInventory={() => navigate(`/inventory/${pet.id}`)}
            hideDetailsText
          />
        )}
        
        <div className="space-y-6 w-full text-center">
          <AnimatePresence mode="wait">
              {activeTab === 'stats' ? (
                <motion.div 
                   key="stats" initial={{ opacity: 0, rotateY: -30, x: -50 }} animate={{ opacity: 1, rotateY: 0, x: 0 }} exit={{ opacity: 0, rotateY: 30, x: 50 }}
                   transition={{ type: "spring", damping: 25, stiffness: 120 }} className="space-y-6"
                >
                   <div className="grid grid-cols-2 gap-4">
                      <NeonButton onClick={() => {
                         setProgress(p => ({ ...p, activePetId: pet.id }));
                         navigate(`/battle/${pet.id}/${Math.random().toString(36).substring(7)}`);
                      }} className="py-3 text-base px-4 bg-sticker-yellow flex-1">
                         <Sword className="h-4 w-4 mr-2" />
                         <span>В Бой (5 ⚡)</span>
                      </NeonButton>
                      <NeonButton onClick={() => {
                         setProgress(p => ({ ...p, activePetId: pet.id }));
                         navigate(`/quest/${pet.id}`);
                      }} className="py-3 text-sm px-4 bg-sticker-blue flex-1">
                         <Compass className="h-4 w-4 mr-2" />
                         <span>Квест (10 ⚡)</span>
                      </NeonButton>
                      <NeonButton onClick={() => navigate(`/inventory/${pet.id}`)} className="py-3 text-sm px-4 bg-sticker-pink flex-1">
                         <Package className="h-4 w-4 mr-2" />
                         <span>Инвентарь</span>
                      </NeonButton>
                      <NeonButton 
                        onClick={() => { if (isEvolutionReady) navigate(`/evolve/${pet.id}`); }} disabled={!isEvolutionReady}
                        className={cn("py-3 text-sm px-4 flex-1 border-none", isEvolutionReady ? "bg-pen-red text-white animate-pulse" : "bg-transparent border-2 border-pen-blue text-pen-blue opacity-40")}
                      >
                         <Sparkles className={cn("h-4 w-4 mr-2", isEvolutionReady ? "text-white" : "text-pen-blue")} />
                         <span>Эволюция</span>
                      </NeonButton>
                   </div>

                   <div className="border-2 border-pen-blue p-4 sm:px-6 rounded-sm bg-white/50 ledger-grid">
                      <div className="flex items-center justify-between mb-2 border-b-2 border-pen-blue pb-1">
                         <div className="flex items-center gap-2 text-pen-blue">
                            <Sword className="h-4 w-4" />
                            <span className="text-base font-black italic tracking-tighter">Характеристики</span>
                         </div>
                         {pet.statPoints > 0 && (
                            <div className="bg-pen-red text-white px-2 py-0.5 rounded-full text-[10px] font-black animate-pulse">+{pet.statPoints} очков</div>
                         )}
                      </div>
                      <div className="grid grid-cols-1 gap-1 px-1">
                        {(['health', 'attack', 'defense', 'speed', 'magic', 'regeneration'] as (keyof PetStats)[]).map(key => (
                          <StatItem 
                            key={key}
                            icon={key === 'health' ? Heart : key === 'attack' ? Sword : key === 'defense' ? Shield : key === 'speed' ? Zap : key === 'magic' ? Brain : Activity} 
                            label={key === 'health' ? 'Здоровье' : key === 'attack' ? 'Атака' : key === 'defense' ? 'Защита' : key === 'speed' ? 'Скорость' : key === 'magic' ? 'Магия' : 'Регенерация'} 
                            value={pet.stats[key]} passiveBonus={getPassiveBonus(pet, key)} max={999} showAdd={pet.statPoints > 0} onAdd={() => allocatePoint(key)} 
                          />
                        ))}
                      </div>
                   </div>

                   <div className="bg-sticker-yellow border-2 border-pen-blue p-6 rounded-sm rotate-1 mt-4">
                      <div className="flex items-center justify-between mb-6 border-b border-pen-blue/20 pb-4">
                         <div className="flex items-center gap-2 text-pen-blue">
                            <Compass className="h-4 w-4" />
                            <span className="text-sm font-black italic">Биологическая сводка</span>
                         </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                         <ClassificationItem label="Тип" value={pet.classification?.type} />
                         <ClassificationItem label="Класс" value={pet.classification?.class} />
                         <ClassificationItem label="Отряд" value={pet.classification?.order} />
                         <ClassificationItem label="Семейство" value={pet.classification?.family} />
                         <ClassificationItem label="Род" value={pet.classification?.genus} />
                         <ClassificationItem label="Вид" value={pet.classification?.species} />
                      </div>
                   </div>

                   <GlassCard color="pink" className="border-2 border-black/5 space-y-4">
                      <h3 className="text-sm font-black text-pen-blue/60 tracking-tight">Навыки сущности</h3>
                      <div className="flex flex-wrap gap-2">
                         {(pet.skills || []).map((skill, i) => (
                           <SkillItem key={skill.id || i} skill={skill} onClick={() => setModalType({ selectedSkill: skill })} />
                         ))}
                      </div>
                   </GlassCard>

                   <GlassCard key={`lore-${pet.id}-${Date.now()}`} color="blue" rotation={-1} className="border-2 border-black/5 p-4 mt-4 text-left">
                      <div className="text-base leading-relaxed text-pen-blue/80">
                         <HandwrittenText text={pet.lore} delay={0.2} speed={25} />
                      </div>
                   </GlassCard>
                </motion.div>
                  ) : (
                    <motion.div 
                       key="inventory" initial={{ opacity: 0, rotateY: 30, x: 50 }} animate={{ opacity: 1, rotateY: 0, x: 0 }} exit={{ opacity: 0, rotateY: -30, x: -50 }}
                       transition={{ type: "spring", damping: 25, stiffness: 120 }} className="space-y-4"
                    >
                       {/* Category Selector */}
                       <div className="flex flex-wrap gap-2 p-3 bg-pen-blue/5 border border-pen-blue/10 rounded-lg">
                         {[
                           { id: 'all', label: 'Все' },
                           { id: 'egg', label: 'Яйца' },
                           { id: 'artifact', label: 'Артефакты' },
                           { id: 'skill', label: 'Навыки' }
                         ].map(cat => (
                           <button
                             key={cat.id}
                             onClick={() => {
                               setInvCategoryFilter(cat.id as any);
                               setInvStatFilter('all');
                               setInvSkillTypeFilter('all');
                               setInvAffinityFilter('all');
                             }}
                             className={cn(
                               "px-3 py-1.5 text-[10px] font-black rounded-sm border transition-all",
                               invCategoryFilter === cat.id ? "bg-pen-blue text-white border-pen-blue" : "bg-white text-pen-blue/40 border-pen-blue/10 hover:border-pen-blue/20"
                             )}
                           >
                             {cat.label}
                           </button>
                         ))}
                       </div>

                       {/* Sub-filters */}
                       {(invCategoryFilter === 'artifact' || invCategoryFilter === 'skill' || invCategoryFilter === 'all') && (
                          <div className="space-y-2 p-3 bg-pen-blue/5 border border-pen-blue/10 rounded-lg text-left">
                            {(invCategoryFilter === 'artifact' || invCategoryFilter === 'skill' || invCategoryFilter === 'all') && (
                              <div className="flex flex-wrap gap-2 text-[9px] font-black text-pen-blue/40 tracking-tighter">
                                 <span className="w-full mb-1">Характеристика:</span>
                                 {['all', 'attack', 'defense', 'speed', 'magic', 'health', 'regeneration'].map(st => (
                                   <button key={st} onClick={() => setInvStatFilter(st)} className={cn("px-2 py-0.5 rounded-full border", invStatFilter === st ? "bg-pen-blue text-white" : "bg-white")}>
                                     {st === 'all' ? 'Все' : (STAT_MAP_RU[st] || st)}
                                   </button>
                                 ))}
                              </div>
                            )}
                            
                            {(invCategoryFilter === 'skill' || invCategoryFilter === 'all') && (
                              <div className="flex flex-wrap gap-2 text-[9px] font-black text-pen-blue/40 tracking-tighter">
                                 <span className="w-full mb-1">Тип навыка:</span>
                                 {['all', 'passive', 'active_buff', 'active_debuff'].map(t => (
                                   <button key={t} onClick={() => setInvSkillTypeFilter(t)} className={cn("px-2 py-0.5 rounded-full border", invSkillTypeFilter === t ? "bg-pen-blue text-white" : "bg-white")}>
                                     {t === 'all' ? 'Все' : t === 'passive' ? 'Пассивный' : t === 'active_buff' ? 'Боевой Бафф' : 'Боевой Дебафф'}
                                   </button>
                                 ))}
                              </div>
                            )}

                            {(invCategoryFilter === 'skill' || invCategoryFilter === 'all') && (
                              <div className="flex flex-wrap gap-2 text-[9px] font-black text-pen-blue/40 tracking-tighter">
                                 <span className="w-full mb-1">Стихия/Атрибут:</span>
                                 {[
                                   { id: 'all', label: 'Все' },
                                   { id: 'fire', label: 'Огонь' }, { id: 'water', label: 'Вода' }, { id: 'air', label: 'Воздух' }, { id: 'earth', label: 'Земля' },
                                   { id: 'light', label: 'Свет' }, { id: 'dark', label: 'Тьма' }, { id: 'time', label: 'Время' }, { id: 'void', label: 'Пустота' }
                                 ].map(a => (
                                   <button key={a.id} onClick={() => setInvAffinityFilter(a.id)} className={cn("px-2 py-0.5 rounded-full border", invAffinityFilter === a.id ? "bg-pen-blue text-white" : "bg-white")}>
                                     {a.label}
                                   </button>
                                 ))}
                              </div>
                            )}
                          </div>
                       )}

                       <div className="grid grid-cols-3 gap-3">
                       {(() => {
                          const filtered = (progress.inventory || []).filter(item => {
                            const categoryMatch = invCategoryFilter === 'all' || item.type === invCategoryFilter;
                            if (!categoryMatch) return false;

                            const stat = item.type === 'artifact' ? item.effect?.stat : item.skillData?.targetStat;
                            const sMatch = invStatFilter === 'all' || stat === invStatFilter;
                            const typeMatch = invSkillTypeFilter === 'all' || 
                                             (item.type === 'skill' && item.skillData?.type === invSkillTypeFilter);
                            
                            const affinityMatch = invAffinityFilter === 'all' || 
                                                 (item.type === 'skill' && (item.skillData?.element === invAffinityFilter || item.skillData?.attribute === invAffinityFilter));

                            if (invCategoryFilter === 'egg') return true;
                            if (invCategoryFilter === 'artifact') return sMatch;
                            if (invCategoryFilter === 'skill') return sMatch && typeMatch && affinityMatch;
                            
                            // For 'all'
                            if (item.type === 'egg') return true;
                            if (item.type === 'artifact') return sMatch;
                            if (item.type === 'skill') return sMatch && typeMatch && affinityMatch;

                            return true;
                          });
                          if (filtered.length === 0) return <div className="col-span-full py-12 text-pen-blue/20 font-black">Пусто</div>;
                          return filtered.map((item, i) => {
                            const colors: ("white" | "yellow" | "blue" | "pink")[] = ["white", "yellow", "blue", "pink"];
                            const cardColor = colors[i % colors.length];
                             return (
                               <GlassCard 
                                 key={item.id || i} 
                                 color={cardColor} 
                                 noPadding
                                 className={cn(
                                   "border-2 border-black/10 group relative cursor-pointer hover:scale-105 transition-all text-center aspect-square flex flex-col",
                                   cardColor === 'yellow' ? 'bg-sticker-yellow/10' : 
                                   cardColor === 'blue' ? 'bg-sticker-blue/10' : 
                                   cardColor === 'pink' ? 'bg-sticker-pink/10' : 'bg-white'
                                 )}
                                 onClick={() => setSelectedItemInfo(item)}
                               >
                                  <div className="flex flex-col items-center justify-between h-full w-full p-2 pt-4 relative overflow-visible">
                                      <div className="flex-1 flex items-center justify-center w-full overflow-hidden">
                                         <ItemIcon 
                                           type={item.type} 
                                           image={item.image} 
                                           hue={item.hue}
                                           fallbackEmoji={item.fallbackEmoji}
                                           className="w-24 h-24 sm:w-28 sm:h-28 group-hover:scale-110 transition-transform" 
                                         />
                                      </div>
                                      <div className="w-full mt-1 min-h-[4rem] flex flex-col items-center justify-center z-10 px-1">
                                         <div className="text-[14px] sm:text-[16px] font-black text-pen-blue leading-tight italic line-clamp-2">
                                           {item.name}
                                         </div>
                                         {item.skillData && (
                                           <div className="flex flex-col items-center gap-0.5 mt-1">
                                              <div className="text-[9px] font-black bg-pen-blue/10 text-pen-blue rounded-full px-1.5 py-0.5 tracking-tighter">
                                                {item.skillData.type === 'passive' ? 'Пассивный' : 
                                                 item.skillData.type === 'active_buff' ? 'Боевой Бафф' : 'Боевой Дебафф'}
                                              </div>
                                              <div className="text-[10px] font-black text-pen-blue/50">
                                                {item.skillData.type === 'passive' 
                                                  ? (item.skillData.attribute === 'light' ? 'Свет' : item.skillData.attribute === 'dark' ? 'Тьма' : item.skillData.attribute === 'time' ? 'Время' : 'Пустота')
                                                  : (item.skillData.element === 'fire' ? 'Огонь' : item.skillData.element === 'water' ? 'Вода' : item.skillData.element === 'air' ? 'Воздух' : 'Земля')
                                                }
                                              </div>
                                           </div>
                                         )}
                                      </div>
                                  </div>
                               </GlassCard>
                             );
                           });
                        })()}
                       </div>
                    </motion.div>
                  )}
          </AnimatePresence>
        </div>
      </div>

      <InfoModal 
        isOpen={!!modalType} onClose={() => setModalType(null)}
        title={modalType?.rank ? "Ранг Сущности" : modalType?.stats ? "Аналитика Потенциала" : modalType?.element ? "Элемент" : modalType?.attribute ? "Атрибут" : modalType?.selectedSkill?.name || "Инфо"}
        showClose={true} plain={!!modalType?.fullScreenImage}
      >
        {modalType?.fullScreenImage ? (
           <motion.img initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} src={modalType.fullScreenImage} className="max-w-[95%] max-h-[95%] object-contain shadow-2xl rounded-sm" />
        ) : modalType?.selectedSkill ? (
          <div className="space-y-6">
            <div className="bg-pen-blue/5 p-4 border-l-4 border-pen-blue">
              <div className="flex items-center gap-4 mb-4">
                 <div className="h-16 w-16 bg-white border-2 border-pen-blue flex items-center justify-center p-2 shadow-sm rounded-sm">
                    <ItemIcon 
                      type="skill" 
                      image={modalType.selectedSkill.image} 
                      fallbackEmoji={modalType.selectedSkill.fallbackEmoji} 
                      className="w-full h-full" 
                    />
                 </div>
                 <div>
                    <div className="text-[10px] font-black text-pen-blue/40 tracking-[0.2em]">
                      {modalType.selectedSkill.type === 'passive' ? "Пассивный навык" : modalType.selectedSkill.type === 'active_buff' ? "Боевой бафф" : "Боевой дебафф"}
                    </div>
                    <div className="text-xl font-black text-pen-blue">{modalType.selectedSkill.name}</div>
                    <div className="text-[11px] font-black text-pen-blue/60 mt-0.5 capitalize">
                      {modalType.selectedSkill.type === 'passive' ? 'Атрибут: ' : 'Стихия: '}
                      {modalType.selectedSkill.type === 'passive' 
                        ? (modalType.selectedSkill.attribute === 'light' ? 'Свет' : modalType.selectedSkill.attribute === 'dark' ? 'Тьма' : modalType.selectedSkill.attribute === 'time' ? 'Время' : 'Пустота')
                        : (modalType.selectedSkill.element === 'fire' ? 'Огонь' : modalType.selectedSkill.element === 'water' ? 'Вода' : modalType.selectedSkill.element === 'air' ? 'Воздух' : 'Земля')
                      }
                    </div>
                 </div>
              </div>
              <p className="text-[16px] font-bold text-pen-blue mb-4">{modalType.selectedSkill.description}</p>
              <div className="grid grid-cols-2 gap-4 border-t border-pen-blue/10 pt-4 pb-4">
                <div>
                   <div className="text-[10px] font-black text-pen-blue/30">влияние</div>
                   <div className="text-[20px] font-black text-pen-blue">{modalType.selectedSkill.value}%</div>
                </div>
                <div>
                   <div className="text-[10px] font-black text-pen-blue/30">цель</div>
                   <div className="text-[20px] font-black text-pen-blue capitalize">
                     {modalType.selectedSkill.targetStat === 'health' ? 'Здоровье' : 
                      modalType.selectedSkill.targetStat === 'attack' ? 'Атака' : 
                      modalType.selectedSkill.targetStat === 'defense' ? 'Защита' : 
                      modalType.selectedSkill.targetStat === 'speed' ? 'Скорость' : 
                      modalType.selectedSkill.targetStat === 'magic' ? 'Магия' : 'Регенерация'}
                   </div>
                </div>
              </div>
              <NeonButton 
                onClick={() => handleSellSkill(modalType.selectedSkill!.id!)}
                className="w-full py-4 bg-pen-red text-white text-[16px] font-black"
              >
                Продать навык
              </NeonButton>
            </div>
          </div>
        ) : modalType?.rank ? (
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
                  const isSelected = pet.level >= min && pet.level <= (max || min);
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
        ) : modalType?.stats ? (
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
                  const isSelected = RARITY_LABELS[pet.rarity] === r.label;
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
        ) : <TypeChartContent element={modalType?.element} attribute={modalType?.attribute} />}
      </InfoModal>

      {/* PET SELECTION MODAL */}
      <AnimatePresence>
        {itemToUse && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/50 backdrop-blur-md"
            onClick={() => setItemToUse(null)}
          >
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-sm bg-white border-4 border-pen-blue p-6 shadow-2xl relative" onClick={e => e.stopPropagation()}>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-black text-pen-blue mb-2">Применить</h2>
                <p className="text-sm text-pen-blue/60 font-bold">Выберите питомца</p>
              </div>
              <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2 force-scrollbar">
                {(() => {
                  const eligiblePets = (progress.pets || []).filter(p => {
                    if (itemToUse.type !== 'skill' || !itemToUse.skillData) return true;
                    const sd = itemToUse.skillData;
                    if (sd.type === 'passive') {
                      return p.attribute === sd.attribute;
                    } else {
                      return p.element === sd.element;
                    }
                  });

                  if (eligiblePets.length === 0) {
                    const reqRu = itemToUse.skillData?.type === 'passive' 
                      ? (itemToUse.skillData.attribute === 'light' ? 'Свет' : itemToUse.skillData.attribute === 'dark' ? 'Тьма' : itemToUse.skillData.attribute === 'time' ? 'Время' : 'Пустота')
                      : (itemToUse.skillData.element === 'fire' ? 'Огонь' : itemToUse.skillData.element === 'water' ? 'Вода' : itemToUse.skillData.element === 'air' ? 'Воздух' : 'Земля');

                    return (
                      <div className="py-8 px-4 text-center border-2 border-dashed border-pen-blue/20 rounded-lg">
                        <div className="text-sm font-black text-pen-blue/60 italic leading-relaxed">
                          У вас нет питомцев с подходящим {itemToUse.skillData?.type === 'passive' ? 'атрибутом' : 'стихией'} ({reqRu}) для этого навыка.
                        </div>
                      </div>
                    );
                  }

                  return eligiblePets.map(p => (
                    <button key={p.id} onClick={() => handleUseItem(itemToUse, p.id)} className="w-full flex items-center gap-3 p-3 bg-pen-blue/5 hover:bg-pen-blue/10 border-2 border-transparent hover:border-pen-blue transition-all group">
                      <img src={p.image} className="h-12 w-12 rounded-lg border border-pen-blue/20 overflow-hidden shrink-0 bg-white object-cover" />
                      <div className="text-left flex-1 min-w-0 font-black text-pen-blue truncate">{p.name}</div>
                    </button>
                  ));
                })()}
              </div>
              <NeonButton onClick={() => setItemToUse(null)} className="w-full mt-6 py-2 bg-pen-blue/5 border-2 border-black/10 text-pen-blue text-sm font-black italic">Отмена</NeonButton>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ITEM INFO MODAL */}
      <AnimatePresence>
        {selectedItemInfo && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/50 backdrop-blur-md"
            onClick={() => setSelectedItemInfo(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              className="w-full max-w-xs bg-[#f2ede0] ledger-grid border-4 border-pen-blue shadow-2xl relative overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-8 text-center space-y-6">
              <div className="h-44 w-44 mx-auto flex items-center justify-center">
                  <ItemIcon 
                    type={selectedItemInfo.type} 
                    image={selectedItemInfo.image} 
                    hue={selectedItemInfo.hue}
                    fallbackEmoji={selectedItemInfo.fallbackEmoji}
                    className="w-full h-full animate-bounce-slow" 
                  />
              </div>
                <div className="space-y-1">
                  <div className="text-[12px] font-black text-pen-blue/40 tracking-[0.2em]">Информация</div>
                  <h3 className="text-2xl font-black text-pen-blue leading-tight">{selectedItemInfo.name}</h3>
                  <div className="text-[10px] font-black text-pen-blue/30 tracking-widest">
                    {selectedItemInfo.type === 'artifact' ? 'артефакт' : selectedItemInfo.type === 'skill' ? 'навык' : 'яйцо'}
                  </div>
                </div>
                <p className="text-[16px] font-bold text-pen-blue/60 leading-relaxed italic">{selectedItemInfo.description}</p>
                
                {selectedItemInfo.type === 'artifact' && selectedItemInfo.effect && (
                  <div className="p-3 bg-pen-blue/5 border border-pen-blue/20 rounded flex items-center justify-center gap-2">
                    <Sparkles className="h-6 w-6 text-pen-blue/40" />
                    <span className="text-[20px] font-black text-pen-blue">+{selectedItemInfo.effect.value} {STAT_MAP_RU[selectedItemInfo.effect.stat] || selectedItemInfo.effect.stat}</span>
                  </div>
                )}

                 {selectedItemInfo.type === 'skill' && selectedItemInfo.skillData && (
                  <div className="p-3 bg-pen-blue/5 border border-pen-blue/20 rounded flex flex-col items-center gap-1">
                    <div className="flex flex-col items-center gap-1 mb-2">
                      <div className="text-[10px] font-black bg-pen-blue/10 text-pen-blue rounded-full px-2 py-0.5 tracking-tighter">
                        {selectedItemInfo.skillData.type === 'passive' ? 'Пассивный' : 
                         selectedItemInfo.skillData.type === 'active_buff' ? 'Боевой Бафф' : 'Боевой Дебафф'}
                      </div>
                      <div className="text-[12px] font-black text-pen-blue/70">
                        {selectedItemInfo.skillData.type === 'passive' ? 'Атрибут: ' : 'Стихия: '}
                        {selectedItemInfo.skillData.type === 'passive' 
                          ? (selectedItemInfo.skillData.attribute === 'light' ? 'Свет' : selectedItemInfo.skillData.attribute === 'dark' ? 'Тьма' : selectedItemInfo.skillData.attribute === 'time' ? 'Время' : 'Пустота')
                          : (selectedItemInfo.skillData.element === 'fire' ? 'Огонь' : selectedItemInfo.skillData.element === 'water' ? 'Вода' : selectedItemInfo.skillData.element === 'air' ? 'Воздух' : 'Земля')
                        }
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <Sparkles className="h-6 w-6 text-pen-blue/40" />
                       <span className="text-[20px] font-black text-pen-blue">+{selectedItemInfo.skillData.value}% {STAT_MAP_RU[selectedItemInfo.skillData.targetStat] || selectedItemInfo.skillData.targetStat}</span>
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <NeonButton onClick={() => {
                      const item = selectedItemInfo;
                      setSelectedItemInfo(null);
                      if (item.type === 'egg') {
                         setProgress(prev => ({ ...prev, inventory: prev.inventory.filter(inv => inv.id !== item.id) }));
                         navigate('/summon', { state: { autoSummon: true } });
                      } else { setItemToUse(item); }
                    }} className="w-full py-4 bg-sticker-yellow border-2 border-pen-blue text-[20px] font-black"
                  >Использовать</NeonButton>
                  <button onClick={() => setSelectedItemInfo(null)} className="text-[16px] font-black text-pen-blue/40 tracking-widest py-2">Отмена</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const StatItem = ({ icon: Icon, label, value, passiveBonus, max, showAdd, onAdd }: any) => (
  <div className="flex items-center gap-2 py-1 border-b border-pen-blue/5">
    <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
      <Icon className="h-3.5 w-3.5 text-pen-blue/40" />
    </div>
    <span className="text-[12px] font-black text-pen-blue/60 tracking-tight w-20 text-left truncate">{label}</span>
    <div className="flex-1 h-1.5 bg-black/5 rounded-full overflow-hidden mx-1">
      <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min((((value || 0) + (passiveBonus || 0)) / max) * 100, 100)}%` }} className="h-full bg-pen-blue opacity-40" />
    </div>
    <div className="flex items-center gap-2 min-w-[100px] justify-end">
      <span className="text-[11px] font-black tabular-nums" style={{ color: '#0047ac' }}>
        {value || 0} {passiveBonus > 0 && <span className="text-green-600 ml-0.5"> (+{passiveBonus})</span>}
      </span>
      {showAdd && <button onClick={(e) => { e.stopPropagation(); onAdd(); }} className="h-5 w-5 bg-white border-2 border-pen-blue flex items-center justify-center hover:bg-sticker-yellow transition-colors cursor-pointer"><Plus className="h-3 w-3 text-pen-blue" strokeWidth={4} /></button>}
    </div>
  </div>
);

const ClassificationItem = ({ label, value }: { label: string, value?: string }) => (
  <div className="space-y-0.5">
    <div className="font-black" style={{ color: '#0047ab', fontSize: '12px' }}>{label}</div>
    <div className="text-[12px] font-black text-pen-blue truncate">{value || '---'}</div>
  </div>
);
