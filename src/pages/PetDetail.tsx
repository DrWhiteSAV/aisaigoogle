import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { UserProgress, Pet } from '../types';
import { GlassCard, NeonButton, HandwrittenText } from '../components/UI';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Shield, Sword, Brain, Zap, Sparkles, Heart, Activity, Compass, Package, Plus, ArrowLeft } from 'lucide-react';
import { getPetRankByLevel, calculateCP, getExpNeeded } from '../lib/gameLogic';

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
          [stat]: p.stats[stat] + 1
        }
      } : p)
    }));
  };

  return (
    <div className="space-y-8 pb-10">
      <header className="flex items-center justify-between border-b-2 border-black/5 pb-6">
        <div className="text-[10px] font-black uppercase tracking-widest text-pen-blue/30 italic">Протокол: {pet.id}</div>
        <div className="px-2 py-1 bg-black text-white text-[10px] font-black italic">
          {pet.rarity}
        </div>
      </header>

      <div className="space-y-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard color="white" noPadding className="border-2 border-black/10 overflow-hidden relative shadow-none bg-transparent">
            <div className="aspect-[16/9] w-full relative bg-transparent">
              <img src={pet.image} alt={pet.name} className="w-full h-full object-cover block" />
              
              <div className="absolute top-4 right-4 h-12 w-12 bg-sticker-yellow border-2 border-black flex flex-col items-center justify-center rotate-6 shadow-sm">
                  <span className="text-[8px] font-black text-black/40 italic leading-none">CP</span>
                  <span className="text-lg font-black italic leading-none">{petCP}</span>
              </div>

              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-white via-white/90 to-transparent p-6 pt-12">
                 <h2 className="text-3xl font-black italic leading-tight tracking-tighter">
                    {pet.name}
                 </h2>
                 <div className="flex justify-between text-[11px] font-black italic text-pen-blue/40 mt-1">
                   <span>LVL {pet.level} • {currentRank}</span>
                   <span>{pet.element} / {pet.attribute}</span>
                 </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <div className="space-y-6">
          <div className="flex gap-4 border-b-2 border-black/5">
              <button 
                onClick={() => setActiveTab('stats')}
                className={cn(
                  "px-4 py-2 font-black italic text-base transition-all relative",
                  activeTab === 'stats' ? "text-pen-blue" : "text-pen-blue/30 hover:text-pen-blue/60"
                )}
              >
                Параметры
                {activeTab === 'stats' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-pen-blue" />}
              </button>
              <button 
                onClick={() => setActiveTab('inventory')}
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
                   <GlassCard color="yellow" className="border-2 border-black/5">
                      <div className="flex items-center justify-between mb-6">
                         <div className="flex items-center gap-2 text-pen-blue/60">
                            <Activity className="h-4 w-4" />
                            <span className="text-xs font-black italic uppercase">Аналитика</span>
                         </div>
                         {pet.statPoints > 0 && (
                            <div className="bg-pen-red text-white px-2 py-0.5 text-[10px] font-black italic rotate-2">
                               Очки: {pet.statPoints}
                            </div>
                         )}
                      </div>
                      <div className="space-y-4">
                        <StatItem icon={Sword} label="Атака" value={pet.stats.attack} max={1000} showAdd={pet.statPoints > 0} onAdd={() => allocatePoint('attack')} />
                        <StatItem icon={Shield} label="Защита" value={pet.stats.defense} max={1000} showAdd={pet.statPoints > 0} onAdd={() => allocatePoint('defense')} />
                        <StatItem icon={Zap} label="Скорость" value={pet.stats.speed} max={1000} showAdd={pet.statPoints > 0} onAdd={() => allocatePoint('speed')} />
                      </div>
                   </GlassCard>

                   <GlassCard color="pink" className="border-2 border-black/5 space-y-4">
                      <h3 className="text-[12px] font-black italic text-pen-blue/60">Навыки Души</h3>
                      <div className="flex flex-wrap gap-2">
                         {pet.abilities.map((a, i) => (
                            <span key={i} className="px-2 py-1 bg-white border border-black/10 text-xs font-bold italic">
                              {a}
                            </span>
                         ))}
                      </div>
                   </GlassCard>

                   <div className="flex gap-4">
                      <NeonButton onClick={() => {
                         setProgress(p => ({ ...p, activePetId: pet.id }));
                         navigate('/battle');
                      }} className="flex-1 py-3 text-lg">
                         <Sword className="h-4 w-4" />
                         <span>В Бой</span>
                      </NeonButton>
                      <NeonButton onClick={() => navigate(`/evolve/${pet.id}`)} className="flex-1 py-3 text-lg bg-sticker-blue text-pen-blue">
                         <span>Развитие</span>
                      </NeonButton>
                   </div>
                </motion.div>
             ) : (
                <motion.div key="inventory" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-2 gap-4">
                   {(progress.inventory || []).length > 0 ? (
                      progress.inventory.map((item, i) => (
                        <GlassCard key={i} color="white" className="p-3 border-2 border-black/10 text-center">
                           <div className="text-xs font-black italic">{item.name}</div>
                        </GlassCard>
                      ))
                   ) : (
                      <div className="col-span-full py-12 text-center border-2 border-dashed border-black/5">
                         <div className="text-pen-blue/20 font-black italic">Пусто</div>
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
            className="h-5 w-5 bg-white border border-black/20 flex items-center justify-center hover:bg-sticker-pink transition-all rotate-[5deg] active:scale-95"
          >
            <Plus className="h-3 w-3" />
          </button>
        )}
        <span className="text-xl font-black italic text-pen-blue">{value}</span>
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
