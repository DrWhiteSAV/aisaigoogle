import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { UserProgress, Pet } from '../types';
import { GlassCard, NeonButton, HandwrittenText } from '../components/UI';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Shield, Sword, Brain, Zap, Sparkles, Heart, Activity, Compass, Package, Plus, ArrowLeft } from 'lucide-react';
import { getPetRankByLevel, calculateCP, getExpNeeded } from '../lib/gameLogic';

export const PetDetail: React.FC<{ progress: UserProgress; setProgress: React.Dispatch<React.SetStateAction<UserProgress>> }> = ({ progress, setProgress }) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<'stats' | 'inventory'>('stats');
  
  const pet = (progress.pets || []).find(p => p.id === id);

  if (!pet) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-screen text-center space-y-4">
        <h2 className="text-3xl font-black italic text-pen-blue">Сущность не найдена</h2>
        <NeonButton onClick={() => navigate('/main')}>Вернуться в Бестиарий</NeonButton>
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
      pets: prev.pets.map(p => p.id === pet.id ? {
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
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-8 pt-12 pb-32 min-h-screen relative">
      <header className="flex items-center justify-between border-b-2 border-black/5 pb-6">
        <button 
          onClick={() => navigate('/main')}
          className="flex items-center gap-2 text-pen-blue/60 hover:text-pen-blue font-black italic transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Назад в Бестиарий</span>
        </button>
        <div className="text-right">
          <div className="text-[10px] font-black uppercase tracking-widest text-pen-blue/30 italic">ID профиля: {pet.id}</div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Col: Pet Visual */}
        <div className="lg:col-span-5 space-y-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <GlassCard color="white" noPadding className="border-2 border-black/10 overflow-hidden relative shadow-none bg-transparent">
              <div className="aspect-[3/4] w-full relative bg-transparent">
                <img src={pet.image} alt={pet.name} className="w-full h-full object-cover block grayscale-[0.1]" />
                
                <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
                   <div className="flex flex-col gap-2">
                       <div className="px-3 py-1 bg-black text-white text-[11px] font-black italic rotate-[-2deg]">
                          {pet.rarity}
                       </div>
                       <div className="px-3 py-1 bg-pen-red text-white text-[11px] font-black italic rotate-[1deg]">
                          {pet.element} / {pet.attribute}
                       </div>
                   </div>
                   <div className="h-16 w-16 bg-sticker-yellow border-2 border-black flex flex-col items-center justify-center rotate-6 shadow-sm">
                       <span className="text-[10px] font-black text-black/40 italic leading-none">CP</span>
                       <span className="text-2xl font-black italic leading-none">{petCP}</span>
                   </div>
                </div>

                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-white via-white/80 to-transparent p-6 pt-16">
                   <h2 className="text-4xl font-black italic leading-tight mb-2 tracking-tighter">
                      <HandwrittenText text={pet.name} speed={30} />
                   </h2>
                   <div className="space-y-2">
                      <div className="h-1.5 w-full bg-black/5 rounded-full overflow-hidden">
                        <motion.div className="h-full bg-pen-blue opacity-40" animate={{ width: `${(pet.experience / expNeeded) * 100}%` }} />
                      </div>
                      <div className="flex justify-between text-[11px] font-black italic text-pen-blue/40">
                        <span>Уровень {pet.level}</span>
                        <span>{currentRank}</span>
                      </div>
                   </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          <GlassCard color="blue" rotation={-1} className="border-2 border-black/5">
             <div className="text-xl leading-relaxed italic text-pen-blue/80 min-h-[100px]">
                <HandwrittenText text={pet.lore} delay={0.5} speed={35} />
             </div>
          </GlassCard>
        </div>

        {/* Right Col: Details */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex gap-4 border-b-2 border-black/5">
              <button 
                onClick={() => setActiveTab('stats')}
                className={cn(
                  "px-6 py-3 font-black italic text-lg transition-all relative",
                  activeTab === 'stats' ? "text-pen-blue" : "text-pen-blue/30 hover:text-pen-blue/60"
                )}
              >
                Параметры
                {activeTab === 'stats' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-pen-blue" />}
              </button>
              <button 
                onClick={() => setActiveTab('inventory')}
                className={cn(
                  "px-6 py-3 font-black italic text-lg transition-all relative",
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
                      <div className="flex items-center justify-between mb-8">
                         <div className="flex items-center gap-2 text-pen-blue/60">
                            <Activity className="h-4 w-4" />
                            <span className="text-sm font-black italic">Аналитика Характеристик</span>
                         </div>
                         {pet.statPoints > 0 && (
                            <div className="bg-pen-red text-white px-3 py-1 text-[12px] font-black italic rotate-2 animate-pulse">
                               Свободные Очки: {pet.statPoints}
                            </div>
                         )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6">
                        <StatItem icon={Sword} label="Атака" value={pet.stats.attack} max={1000} showAdd={pet.statPoints > 0} onAdd={() => allocatePoint('attack')} />
                        <StatItem icon={Shield} label="Защита" value={pet.stats.defense} max={1000} showAdd={pet.statPoints > 0} onAdd={() => allocatePoint('defense')} />
                        <StatItem icon={Zap} label="Скорость" value={pet.stats.speed} max={1000} showAdd={pet.statPoints > 0} onAdd={() => allocatePoint('speed')} />
                        <StatItem icon={Sparkles} label="Магия" value={pet.stats.magic} max={1000} showAdd={pet.statPoints > 0} onAdd={() => allocatePoint('magic')} />
                        <StatItem icon={Heart} label="HP" value={pet.stats.health} max={2000} showAdd={pet.statPoints > 0} onAdd={() => allocatePoint('health')} />
                        <StatItem icon={Brain} label="Реген" value={pet.stats.regeneration} max={200} showAdd={pet.statPoints > 0} onAdd={() => allocatePoint('regeneration')} />
                      </div>
                   </GlassCard>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <GlassCard color="pink" className="flex flex-col gap-4 border-2 border-black/5">
                         <h3 className="text-[12px] font-black italic text-pen-blue/60">Навыки Души</h3>
                         <div className="flex flex-wrap gap-2">
                            {pet.abilities.map((a, i) => (
                               <span key={i} className="px-3 py-1 bg-white border border-black/10 text-sm font-bold italic rotate-[0.5deg]">
                                 {a}
                               </span>
                            ))}
                         </div>
                      </GlassCard>
                      
                      <div className="flex flex-col gap-4">
                         <NeonButton onClick={() => {
                            setProgress(p => ({ ...p, activePetId: pet.id }));
                            navigate('/battle');
                         }} className="flex-1 py-4 text-xl font-black italic">
                            <Sword className="h-5 w-5" />
                            <span>В Бой</span>
                         </NeonButton>
                         <NeonButton onClick={() => {
                            setProgress(p => ({ ...p, activePetId: pet.id }));
                            navigate('/quest');
                         }} className="flex-1 py-4 text-xl font-black italic bg-sticker-yellow">
                            <Compass className="h-5 w-5" />
                            <span>Квест</span>
                         </NeonButton>
                         <NeonButton onClick={() => navigate(`/evolve/${pet.id}`)} className="flex-1 py-4 text-xl font-black italic bg-sticker-blue text-pen-blue">
                            <span>Развитие</span>
                         </NeonButton>
                      </div>
                   </div>
                </motion.div>
             ) : (
                <motion.div key="inventory" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                   {(progress.inventory || []).length > 0 ? (
                      progress.inventory.map((item, i) => (
                        <GlassCard key={i} color={item.type === 'egg' ? 'pink' : item.type === 'food' ? 'yellow' : 'blue'} className="p-4 border-2 border-black/10 group hover:-translate-y-1 transition-all">
                           <div className="flex flex-col items-center text-center gap-3">
                              <div className="h-12 w-12 bg-white/60 border border-black/10 flex items-center justify-center rotate-[-3deg]">
                                 <Package className="h-6 w-6 text-pen-blue/40" />
                              </div>
                              <div>
                                 <div className="text-sm font-black italic truncate max-w-full">{item.name}</div>
                                 <div className="text-[10px] font-bold text-black/40 italic">{item.type}</div>
                              </div>
                              <button className="w-full py-1.5 bg-black text-white text-[10px] font-black italic opacity-0 group-hover:opacity-100 transition-opacity">
                                 Использовать
                              </button>
                           </div>
                        </GlassCard>
                      ))
                   ) : (
                      <div className="col-span-full py-20 text-center border-2 border-dashed border-black/5">
                         <div className="text-pen-blue/30 font-black italic text-lg">Хранилище пусто</div>
                      </div>
                   )}
                </motion.div>
             )}
          </AnimatePresence>
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
