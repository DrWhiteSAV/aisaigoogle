import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { UserProgress, Pet, Element, Attribute } from '../types';
import { GlassCard, NeonButton, HandwrittenText } from '../components/UI';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Shield, Sword, Brain, Zap, Sparkles, Heart, Activity, Compass, Package, Plus, ArrowLeft } from 'lucide-react';
import { getPetRankByLevel, calculateCP, getExpNeeded } from '../lib/gameLogic';
import { ElementSticker, AttributeSticker, InfoModal, TypeChartContent } from '../components/GameUI';
import { RARITY_LABELS } from '../constants/gameData';
import { PetCard } from '../components/PetCard';

export const PetDetail: React.FC<{ 
  progress: UserProgress; 
  setProgress: React.Dispatch<React.SetStateAction<UserProgress>>;
  manualId?: string | null;
  initialTab?: 'stats' | 'inventory';
  toggleFlipLock?: (id: string, locked: boolean) => void;
  id?: string;
}> = ({ progress, setProgress, manualId, initialTab = 'stats', toggleFlipLock, id: manualPageId }) => {
  const navigate = useNavigate();
  const componentId = React.useId();
  const lockId = `pet-detail-${manualPageId || componentId}`;
  
  const { id: paramsId } = useParams<{ id: string }>();
  const id = manualId || paramsId;
  const [activeTab, setActiveTab] = useState<'stats' | 'inventory'>(initialTab);
  const [modalType, setModalType] = useState<{ element?: Element, attribute?: Attribute, rank?: boolean, stats?: boolean, fullScreenImage?: string } | null>(null);

  // Sync tab state if initialTab prop changes (important for flipbook)
  React.useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const pet = (progress.pets || []).find(p => p.id === id);

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

  const currentRank = getPetRankByLevel(pet.level);
  const expNeeded = getExpNeeded(pet.level);
  const petCP = calculateCP(pet);

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

  return (
    <div className="space-y-8 pb-10">
      <header className="flex items-center justify-between border-b-2 border-black/5 pb-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={handleBack}
            className="p-2 hover:bg-black/5 rounded-full transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-pen-blue" />
          </button>
          <div 
            className="text-2xl font-black text-pen-blue hover:opacity-70 cursor-pointer"
            onClick={handleTitleClick}
          >
            {pet.name}
          </div>
        </div>
      </header>

      <div className="space-y-8 flex flex-col items-center">
        {/* Only show card if it's NOT the book view (manualId is null in normal routes) */}
        {!manualId && pet && (
          <PetCard 
            pet={pet} 
            className="w-full max-w-[320px]"
            onOpenRankInfo={() => setModalType({ rank: true })}
            onOpenImage={() => setModalType({ fullScreenImage: pet.image })}
            onOpenElementInfo={(el) => setModalType({ element: el })}
            onOpenAttributeInfo={(attr) => setModalType({ attribute: attr })}
            onOpenStore={() => navigate('/shop')}
            onOpenInventory={() => navigate(`/inventory/${pet.id}`)}
            hideDetailsText
          />
        )}
        
        <div className="space-y-6 w-full text-center">
          {/* Section title (Pet Name removed as requested to avoid duplication) */}
          <div className="flex justify-center gap-8 mb-2">
            <button 
              onClick={() => navigate(`/pet/${id}`)}
              className={cn(
                "pb-1 border-b-2 font-black transition-all text-base px-2",
                activeTab === 'stats' ? "border-pen-blue text-pen-blue scale-110" : "border-transparent text-pen-blue/20 hover:text-pen-blue/40"
              )}
            >
              Параметры
            </button>
            <button 
              onClick={() => navigate(`/inventory/${id}`)}
              className={cn(
                "pb-1 border-b-2 font-black transition-all text-base px-2",
                activeTab === 'inventory' ? "border-pen-blue text-pen-blue scale-110" : "border-transparent text-pen-blue/20 hover:text-pen-blue/40"
              )}
            >
              Инвентарь
            </button>
          </div>

          <AnimatePresence mode="wait">
              {activeTab === 'stats' ? (
                <motion.div 
                   key="stats" 
                   initial={{ opacity: 0, rotateY: -30, x: -50, filter: 'blur(10px)' }} 
                   animate={{ opacity: 1, rotateY: 0, x: 0, filter: 'blur(0px)' }} 
                   exit={{ opacity: 0, rotateY: 30, x: 50, filter: 'blur(10px)' }}
                   transition={{ type: "spring", damping: 25, stiffness: 120 }}
                   className="space-y-6"
                >
                   <div className="border-4 border-pen-blue p-4 sm:px-6 rounded-sm bg-white/50 ledger-grid shadow-[8px_8px_0px_0px_rgba(28,49,152,0.1)]">
                      <div className="flex items-center justify-between mb-4 border-b-2 border-pen-blue pb-2">
                         <div className="flex items-center gap-2 text-pen-blue">
                            <Sword className="h-5 w-5" />
                            <span className="text-lg font-black italic uppercase tracking-tighter">Характеристики</span>
                         </div>
                         {pet.statPoints > 0 && (
                            <div className="bg-pen-red text-white px-2 py-0.5 rounded-full text-[10px] font-black animate-pulse">
                               +{pet.statPoints} ОЧКОВ
                            </div>
                         )}
                      </div>
                      
                      <div className="grid grid-cols-1 gap-4 px-1">
                        <StatItem icon={Heart} label="Здоровье" value={pet.stats.health} max={999} showAdd={pet.statPoints > 0} onAdd={() => allocatePoint('health')} />
                        <StatItem icon={Sword} label="Атака" value={pet.stats.attack} max={999} showAdd={pet.statPoints > 0} onAdd={() => allocatePoint('attack')} />
                        <StatItem icon={Shield} label="Защита" value={pet.stats.defense} max={999} showAdd={pet.statPoints > 0} onAdd={() => allocatePoint('defense')} />
                        <StatItem icon={Zap} label="Скорость" value={pet.stats.speed} max={999} showAdd={pet.statPoints > 0} onAdd={() => allocatePoint('speed')} />
                        <StatItem icon={Brain} label="Магия" value={pet.stats.magic} max={999} showAdd={pet.statPoints > 0} onAdd={() => allocatePoint('magic')} />
                        <StatItem icon={Activity} label="Регенерация" value={pet.stats.regeneration} max={999} showAdd={pet.statPoints > 0} onAdd={() => allocatePoint('regeneration')} />
                      </div>
                   </div>

                   <div className="border-2 border-pen-blue/10 p-6 rounded-sm bg-white/30">
                      <div className="flex items-center justify-between mb-6 border-b border-pen-blue/10 pb-4">
                         <div className="flex items-center gap-2 text-pen-blue/60">
                            <Compass className="h-4 w-4" />
                            <span className="text-sm font-black italic">Биологическая Сводка</span>
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
                      <h3 className="text-sm font-black text-pen-blue/60 tracking-tight">Навыки Души</h3>
                      <div className="flex flex-wrap gap-2">
                         {pet.abilities.map((a, i) => (
                            <span key={i} className="px-3 py-1.5 bg-white border-2 border-black text-xs font-black italic -rotate-1">
                               {a}
                            </span>
                         ))}
                      </div>
                   </GlassCard>

                   <div className="grid grid-cols-2 gap-4">
                      <NeonButton onClick={() => {
                         setProgress(p => ({ ...p, activePetId: pet.id }));
                         navigate(`/battle/${pet.id}`);
                      }} className="py-3 text-base px-4 bg-sticker-yellow flex-1">
                         <Sword className="h-4 w-4 mr-2" />
                         <span>В Бой</span>
                      </NeonButton>
                      <NeonButton onClick={() => {
                         setProgress(p => ({ ...p, activePetId: pet.id }));
                         navigate(`/quest/${pet.id}`);
                      }} className="py-3 text-sm px-4 bg-sticker-blue flex-1">
                         <Compass className="h-4 w-4 mr-2" />
                         <span>Квест</span>
                      </NeonButton>
                      <NeonButton onClick={() => navigate(`/inventory/${pet.id}`)} className="py-3 text-sm px-4 bg-sticker-pink flex-1">
                         <Package className="h-4 w-4 mr-2" />
                         <span>Инвентарь</span>
                      </NeonButton>
                      <NeonButton onClick={() => navigate(`/evolve/${pet.id}`)} className="py-3 text-sm px-4 bg-white border-2 border-black flex-1">
                         <Sparkles className="h-4 w-4 mr-2 text-pen-blue" />
                         <span>Развитие</span>
                      </NeonButton>
                   </div>

                   <GlassCard color="blue" rotation={-1} className="border-2 border-black/5 p-6 mt-6">
                      <div className="text-lg leading-relaxed text-pen-blue/80">
                         <HandwrittenText text={pet.lore} delay={0.1} speed={30} />
                      </div>
                   </GlassCard>
                </motion.div>
              ) : (
                <motion.div 
                   key="inventory" 
                   initial={{ opacity: 0, rotateY: 30, x: 50, filter: 'blur(10px)' }} 
                   animate={{ opacity: 1, rotateY: 0, x: 0, filter: 'blur(0px)' }} 
                   exit={{ opacity: 0, rotateY: -30, x: -50, filter: 'blur(10px)' }}
                   transition={{ type: "spring", damping: 25, stiffness: 120 }}
                   className="grid grid-cols-2 gap-4"
                >
                   {(progress.inventory || []).length > 0 ? (
                      progress.inventory.map((item, i) => (
                        <GlassCard key={i} color="white" className="p-3 border-2 border-black/10 text-center transition-shadow">
                           <div className="text-xs font-black">{item.name}</div>
                        </GlassCard>
                      ))
                   ) : (
                      <div className="col-span-full py-12 text-center border-2 border-dashed border-black/5 rounded-xl">
                         <div className="text-pen-blue/20 font-black tracking-tighter">Сумка пуста</div>
                      </div>
                   )}
                </motion.div>
              )}
          </AnimatePresence>
        </div>
      </div>

      <InfoModal 
        isOpen={!!modalType} 
        onClose={() => setModalType(null)}
        title={modalType?.rank ? "Ранг Сущности" : modalType?.stats ? "Аналитика Потенциала" : modalType?.element ? "Узы Элемента" : "Суть Атрибута"}
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
        ) : modalType?.rank ? (
          <div className="space-y-4">
             <p className="text-sm font-black text-pen-blue/70 leading-relaxed border-b border-black/5 pb-4">
               Ранг Питомца определяется текущим уровнем физического и духовного созревания:
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
                ].map((r, i) => (
                  <div key={i} className={cn(
                    "flex items-center justify-between p-2 border-2 transition-all",
                    pet.level >= parseInt(r.range.split('-')[0]) && pet.level <= parseInt(r.range.split('-')[1])
                      ? "bg-sticker-yellow border-black rotate-1"
                      : "border-black/5 opacity-40"
                  )}>
                    <span className="text-[10px] font-black">{r.range}</span>
                    <span className="text-xs font-black text-pen-blue">{r.code} - {r.label}</span>
                  </div>
                ))}
             </div>
          </div>
        ) : modalType?.stats ? (
          <div className="space-y-4">
             <p className="text-sm font-black text-pen-blue/70 leading-relaxed border-b border-black/5 pb-4">
                Начальные характеристики и потенциал роста зависят от редкости питомца:
             </p>
             <div className="grid grid-cols-1 gap-2">
                {[
                  { label: "Обычный", base: 20, growth: 5 },
                  { label: "Продвинутый", base: 50, growth: 10 },
                  { label: "Редкий", base: 100, growth: 15 },
                  { label: "Идеальный", base: 200, growth: 20 },
                  { label: "Эпический", base: 300, growth: 25 },
                  { label: "Легендарный", base: 400, growth: 30 },
                  { label: "Мифический", base: 500, growth: 35 },
                  { label: "Вечный", base: 600, growth: 40 },
                  { label: "Божественный", base: 800, growth: 45 },
                  { label: "Трансцендентный", base: 1000, growth: 50 }
                ].map((r, i) => (
                  <div key={i} className={cn(
                    "flex items-center justify-between p-2 border-2 transition-all",
                    RARITY_LABELS[pet.rarity] === r.label
                      ? "bg-sticker-pink border-black rotate-1"
                      : "border-black/5 opacity-40"
                  )}>
                    <span className="text-[10px] font-black">{r.label}</span>
                    <span className="text-xs font-black text-pen-blue">{r.base} / +{r.growth} lvl</span>
                  </div>
                ))}
             </div>
             <p className="text-[10px] font-black italic text-pen-blue/40 mt-4 leading-relaxed">
               * Очки за уровень начисляются для ручного распределения. 
               1 Здоровье = 1 Макс. Здоровье.
             </p>
          </div>
        ) : (
          <TypeChartContent element={modalType?.element} attribute={modalType?.attribute} />
        )}
      </InfoModal>
    </div>
  );
};

const StatItem = ({ icon: Icon, label, value, max, showAdd, onAdd }: any) => (
  <div className="space-y-2 py-2 border-b border-pen-blue/5">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-pen-blue/[0.03] flex items-center justify-center">
          <Icon className="h-4 w-4 text-pen-blue/40" />
        </div>
        <span className="text-[14px] font-black text-pen-blue/60 tracking-tight">{label}</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-xl font-black text-pen-blue tabular-nums">
          {value || 0} <span className="text-pen-blue/20 text-sm">/ {max}</span>
        </span>
        {showAdd && (
          <motion.button 
            whileHover={{ scale: 1.2, rotate: 5 }}
            whileTap={{ scale: 0.8 }}
            onClick={(e) => {
              e.stopPropagation();
              onAdd();
            }}
            className="h-8 w-8 bg-white border-[3px] border-pen-blue flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(28,49,152,1)] hover:bg-sticker-yellow transition-colors relative z-[100] cursor-pointer"
          >
            <Plus className="h-5 w-5 text-pen-blue" strokeWidth={3} />
          </motion.button>
        )}
      </div>
    </div>
    <div className="h-2 bg-black/5 rounded-full overflow-hidden">
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(((value || 0) / max) * 100, 100)}%` }}
        className="h-full bg-pen-blue opacity-40 shadow-[0_0_10px_rgba(28,49,152,0.2)]"
      />
    </div>
  </div>
);

const ClassificationItem = ({ label, value }: { label: string, value?: string }) => (
  <div className="space-y-0.5">
    <div className="text-[10px] font-black text-pen-blue/30">{label}</div>
    <div className="text-sm font-black text-pen-blue truncate">{value || '---'}</div>
  </div>
);
