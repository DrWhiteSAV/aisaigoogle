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

export const PetDetail: React.FC<{ 
  progress: UserProgress; 
  setProgress: React.Dispatch<React.SetStateAction<UserProgress>>;
  manualId?: string | null;
  initialTab?: 'stats' | 'inventory';
}> = ({ progress, setProgress, manualId, initialTab = 'stats' }) => {
  const navigate = useNavigate();
  const { id: paramsId } = useParams<{ id: string }>();
  const id = manualId || paramsId;
  const [activeTab, setActiveTab] = useState<'stats' | 'inventory'>(initialTab);
  const [modalType, setModalType] = useState<{ element?: Element, attribute?: Attribute, rank?: boolean } | null>(null);

  React.useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, id]);

  const pet = (progress.pets || []).find(p => p.id === id);

  if (!pet) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-6">
        <div className="h-24 w-24 border-4 border-dashed border-black/5 rounded-full flex items-center justify-center">
            <Sparkles className="h-10 w-10 text-black/10" />
        </div>
        <div>
          <h2 className="text-3xl font-black italic text-pen-blue">Сущность не выбрана</h2>
          <p className="text-pen-blue/40 font-black italic mt-2">Нажмите на карточку в Бестиарии слева</p>
        </div>
      </div>
    );
  }

  const currentRank = getPetRankByLevel(pet.level);
  const expNeeded = getExpNeeded(pet.level);
  const petCP = calculateCP(pet);

  const allocatePoint = (stat: keyof typeof pet.stats) => {
    if (pet.statPoints <= 0) return;
    
    setProgress(prev => ({
      ...prev,
      pets: (Array.isArray(prev.pets) ? prev.pets : []).map(p => p.id === pet.id ? {
        ...p,
        statPoints: p.statPoints - 1,
        stats: {
          ...p.stats,
          [stat]: (p.stats[stat] || 0) + 1
        }
      } : p)
    }));
  };

  return (
    <div className="space-y-8 pb-10">
      <header className="flex items-center justify-between border-b-2 border-black/5 pb-4">
        <div className="text-[10px] font-black uppercase tracking-widest text-pen-blue/30 italic">Протокол: {pet.id}</div>
        <div className="px-3 py-1 bg-black text-white text-[10px] font-black italic uppercase rotate-2">
          {RARITY_LABELS[pet.rarity] || pet.rarity}
        </div>
      </header>

      <div className="space-y-8 flex flex-col items-center">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-[320px]">
          <GlassCard color="white" noPadding className="border-2 border-black/10 overflow-hidden relative bg-white rotate-1">
            <div className="aspect-[9/16] w-full relative bg-transparent">
              <img src={pet.image} alt={pet.name} className="w-full h-full object-cover block grayscale-[15%] hover:grayscale-0 transition-all duration-700" />
              
              <div className="absolute top-4 right-4 h-12 w-12 bg-sticker-yellow border-2 border-black flex flex-col items-center justify-center rotate-6 z-20">
                  <span className="text-[8px] font-black text-black/40 italic leading-none">CP</span>
                  <span className="text-lg font-black italic leading-none">{petCP}</span>
              </div>

              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-white via-white/95 to-transparent p-6 pt-16 z-10">
                 <h2 className="text-3xl font-black italic leading-tight tracking-tighter mb-2">
                    {pet.name}
                 </h2>
                 <div className="flex flex-wrap gap-2 items-center">
                    <button 
                      onClick={() => setModalType({ rank: true })}
                      className="text-[10px] font-black italic text-pen-blue/40 mr-2 hover:text-pen-blue transition-colors"
                    >
                      LVL {pet.level} • {currentRank}
                    </button>
                    <ElementSticker element={pet.element} onClick={() => setModalType({ element: pet.element })} />
                    <AttributeSticker attribute={pet.attribute} onClick={() => setModalType({ attribute: pet.attribute })} />
                 </div>
                 
                 {/* XP Progress Bar */}
                 <div className="mt-4 w-full h-1.5 bg-black/5 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-pen-blue opacity-40"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((pet.experience / getExpNeeded(pet.level)) * 100, 100)}%` }}
                    />
                    <div className="flex justify-between mt-1">
                       <span className="text-[8px] font-black italic text-pen-blue/20 uppercase tracking-tighter">Опыт: {pet.experience}</span>
                       <span className="text-[8px] font-black italic text-pen-blue/20 uppercase tracking-tighter">Цель: {expNeeded}</span>
                    </div>
                 </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <div className="space-y-6 w-full">
          <div className="flex gap-4 border-b-2 border-black/5 justify-center">
              <button 
                onClick={() => {
                   setActiveTab('stats');
                   navigate(`/pet/${pet.id}`);
                }}
                className={cn(
                  "px-4 py-2 font-black italic text-base transition-all relative",
                  activeTab === 'stats' ? "text-pen-blue" : "text-pen-blue/30 hover:text-pen-blue/60"
                )}
              >
                Параметры
                {activeTab === 'stats' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-pen-blue" />}
              </button>
              <button 
                onClick={() => {
                   setActiveTab('inventory');
                   navigate(`/inventory/${pet.id}`);
                }}
                className={cn(
                  "px-4 py-2 font-black italic text-base transition-all relative",
                  activeTab === 'inventory' ? "text-pen-blue" : "text-pen-blue/30 hover:text-pen-blue/60"
                )}
              >
                Инвентарь ({progress.inventory?.length || 0})
                {activeTab === 'inventory' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-pen-blue" />}
              </button>
          </div>

          <AnimatePresence mode="wait">
              {activeTab === 'stats' ? (
                <motion.div key="stats" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                   <div className="border-2 border-pen-blue/10 p-6 rounded-sm bg-white/30">
                      <div className="flex items-center justify-between mb-6 border-b border-pen-blue/10 pb-4">
                         <div className="flex items-center gap-2 text-pen-blue/60">
                            <Activity className="h-4 w-4" />
                            <span className="text-xs font-black italic uppercase">Аналитика Потенциала</span>
                         </div>
                         {pet.statPoints > 0 && (
                            <div className="bg-pen-red text-white px-2 py-0.5 text-[10px] font-black italic rotate-2">
                               Очки: {pet.statPoints}
                            </div>
                         )}
                      </div>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                        <StatItem icon={Heart} label="Здоровье" value={pet.stats.health} max={999} showAdd={pet.statPoints > 0} onAdd={() => allocatePoint('health')} />
                        <StatItem icon={Sword} label="Атака" value={pet.stats.attack} max={999} showAdd={pet.statPoints > 0} onAdd={() => allocatePoint('attack')} />
                        <StatItem icon={Shield} label="Защита" value={pet.stats.defense} max={999} showAdd={pet.statPoints > 0} onAdd={() => allocatePoint('defense')} />
                        <StatItem icon={Zap} label="Скорость" value={pet.stats.speed} max={999} showAdd={pet.statPoints > 0} onAdd={() => allocatePoint('speed')} />
                        <StatItem icon={Brain} label="Магия" value={pet.stats.magic} max={999} showAdd={pet.statPoints > 0} onAdd={() => allocatePoint('magic')} />
                        <StatItem icon={Activity} label="Реген." value={pet.stats.regeneration} max={999} showAdd={pet.statPoints > 0} onAdd={() => allocatePoint('regeneration')} />
                      </div>
                   </div>

                   <GlassCard color="pink" className="border-2 border-black/5 space-y-4">
                      <h3 className="text-[12px] font-black italic text-pen-blue/60 uppercase tracking-widest">Навыки Души</h3>
                      <div className="flex flex-wrap gap-2">
                         {pet.abilities.map((a, i) => (
                            <span key={i} className="px-3 py-1.5 bg-white border-2 border-black text-xs font-black italic -rotate-1">
                              {a}
                            </span>
                         ))}
                      </div>
                   </GlassCard>

                   <div className="flex gap-4">
                      <NeonButton onClick={() => {
                         setProgress(p => ({ ...p, activePetId: pet.id }));
                         navigate('/battle');
                      }} className="flex-1 py-4 text-xl">
                         <Sword className="h-5 w-5 mr-2" />
                         <span>В Бой</span>
                      </NeonButton>
                      <NeonButton onClick={() => navigate(`/evolve/${pet.id}`)} className="flex-1 py-4 text-xl bg-sticker-blue text-pen-blue">
                         <span>Развитие</span>
                      </NeonButton>
                   </div>
                </motion.div>
             ) : (
                <motion.div key="inventory" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-2 gap-4">
                   {(progress.inventory || []).length > 0 ? (
                      progress.inventory.map((item, i) => (
                        <GlassCard key={i} color="white" className="p-3 border-2 border-black/10 text-center transition-shadow">
                           <div className="text-xs font-black italic">{item.name}</div>
                        </GlassCard>
                      ))
                   ) : (
                      <div className="col-span-full py-12 text-center border-2 border-dashed border-black/5 rounded-xl">
                         <div className="text-pen-blue/20 font-black italic uppercase tracking-tighter">Сумка пуста</div>
                      </div>
                   )}
                </motion.div>
             )}
          </AnimatePresence>

          <GlassCard color="blue" rotation={-1} className="border-2 border-black/5 p-6">
             <div className="text-lg leading-relaxed italic text-pen-blue/80">
                <HandwrittenText text={pet.lore} delay={0.2} speed={30} />
             </div>
          </GlassCard>
        </div>
      </div>

      <InfoModal 
        isOpen={!!modalType} 
        onClose={() => setModalType(null)}
        title={modalType?.rank ? "Ранг Сущности" : modalType?.element ? "Узы Элемента" : "Суть Атрибута"}
      >
        {modalType?.rank ? (
          <div className="space-y-4">
             <p className="text-sm font-black italic text-pen-blue/70 leading-relaxed border-b border-black/5 pb-4">
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
                    <span className="text-[10px] font-black italic">{r.range}</span>
                    <span className="text-xs font-black italic uppercase text-pen-blue">{r.code} - {r.label}</span>
                  </div>
                ))}
             </div>
          </div>
        ) : (
          <TypeChartContent element={modalType?.element} attribute={modalType?.attribute} />
        )}
      </InfoModal>
    </div>
  );
};

const StatItem = ({ icon: Icon, label, value, max, showAdd, onAdd }: any) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-pen-blue/30" />
        <span className="text-[12px] font-black italic text-pen-blue/50">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {showAdd && (
          <button 
            onClick={onAdd}
            className="h-5 w-5 bg-white border-2 border-black flex items-center justify-center hover:bg-sticker-pink transition-all rotate-[5deg] active:scale-90"
          >
            <Plus className="h-3 w-3" />
          </button>
        )}
        <span className="text-xl font-black italic text-pen-blue">{value || 0}</span>
      </div>
    </div>
    <div className="h-1.5 w-full bg-black/5 rounded-full overflow-hidden">
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(((value || 0) / max) * 100, 100)}%` }}
        className="h-full bg-pen-blue opacity-30"
      />
    </div>
  </div>
);
