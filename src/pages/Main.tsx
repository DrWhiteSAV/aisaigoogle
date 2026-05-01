import React, { useState } from 'react';
import { UserProgress, Pet } from '../types';
import { GlassCard, NeonButton, HandwrittenText } from '../components/UI';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Shield, Sword, Brain, Zap, Star, Sparkles, Heart, Activity, Compass, Loader2, Coins, Plus } from 'lucide-react';
import { generateQuest } from '../services/aiService';
import { getAgeStage, getPowerRank, getExpNeeded } from '../constants/game';

export const Main: React.FC<{ progress: UserProgress; setProgress: React.Dispatch<React.SetStateAction<UserProgress>> }> = ({ progress, setProgress }) => {
  const [quest, setQuest] = useState<any>(null);
  const [loadingQuest, setLoadingQuest] = useState(false);
  const [questResult, setQuestResult] = useState<any>(null);
  const pet = progress.pets.find(p => p.id === progress.activePetId);

  if (!pet) return null;

  const currentStage = getAgeStage(pet.level);
  const isRankRevealed = pet.level >= 60;
  const expNeeded = getExpNeeded(pet.level);

  const handleStartQuest = async () => {
    setLoadingQuest(true);
    const newQuest = await generateQuest(pet);
    setQuest(newQuest);
    setLoadingQuest(false);
  };

  const handleQuestChoice = (option: any) => {
    setQuestResult(option);
    const newXP = pet.experience + option.rewardXP;
    
    setProgress(prev => ({
      ...prev,
      currency: prev.currency + option.rewardRubles,
      pets: prev.pets.map(p => p.id === pet.id ? { ...p, experience: newXP } : p)
    }));
  };

  const allocatePoint = (stat: keyof typeof pet.stats) => {
    if (pet.statPoints <= 0) return;
    
    setProgress(prev => ({
      ...prev,
      pets: prev.pets.map(p => p.id === pet.id ? {
        ...p,
        statPoints: p.statPoints - 1,
        stats: {
          ...p.stats,
          statPoints: p.statPoints, // Keeping for type safety if needed
          [stat]: p.stats[stat] + 1
        }
      } : p)
    }));
  };

  const closeQuest = () => {
    setQuest(null);
    setQuestResult(null);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8 pt-12 pb-32">
      <header className="flex h-20 items-center justify-between border-2 border-black/10 px-8 rounded-lg bg-sticker-yellow rotate-1 hatching-shadow animate-in fade-in slide-in-from-top-4 duration-1000">
        <div className="flex items-center gap-3">
          <img src="https://i.ibb.co/k2PN7Q8y/aisailogo.png" alt="aiSai" className="h-12 w-12" />
          <div>
            <h1 className="text-2xl font-black italic tracking-wider text-pen-blue leading-none">AISAI</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="bg-white/40 px-4 py-1.5 rounded-sm border-2 border-pen-blue/20 flex items-center gap-2 text-sm font-bold -rotate-2">
            <Coins className="h-4 w-4 text-pen-blue" />
            <span className="text-pen-blue">{progress.currency.toLocaleString()} ₽</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Left: Pet Visual */}
        <motion.div
           initial={{ opacity: 0, x: -20 }}
           animate={{ opacity: 1, x: 0 }}
        >
          <GlassCard color="white" delay={0.2} className="p-4 border-2 border-pen-blue/10 rounded-[2px] hatching-shadow overflow-visible">
            <div className="aspect-[9/16] w-full relative bg-white border border-pen-blue/5 rounded-sm overflow-hidden">
              <img src={pet.image} alt={pet.name} className="w-full h-full object-cover" />
              <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
                 <div className="bg-sticker-pink text-[10px] font-bold text-pen-blue px-3 py-1 rounded-sm uppercase tracking-widest border border-pen-blue/10 rotate-3 shadow-sm">
                   {pet.rarity}
                 </div>
                 <div className={cn(
                    "text-pen-blue text-2xl font-black px-4 py-2 rounded-sm border-2 border-pen-blue/20 bg-white/90 shadow-sm",
                    !isRankRevealed && "opacity-40"
                 )}>
                   {isRankRevealed ? getPowerRank(pet.level) : "???"}
                 </div>
                 <div className="bg-sticker-blue text-[10px] font-bold text-pen-blue px-3 py-1 rounded-sm border border-pen-blue/10 uppercase tracking-widest -rotate-2">
                   {currentStage}
                 </div>
              </div>
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-6 bg-white/60 opacity-80 rounded-sm -rotate-1 shadow-sm" />
            </div>
            
            <div className="mt-8 space-y-2">
              <div className="text-[12px] font-bold text-pen-blue/60 uppercase tracking-[0.2em]">
                {pet.classification.type} • {pet.classification.species}
              </div>
              <h2 className="text-4xl font-black italic">
                <HandwrittenText text={pet.name} speed={30} />
              </h2>
              <div className="h-2 w-full bg-pen-blue/5 rounded-full mt-6 border border-pen-blue/10">
                <div className="h-full bg-pen-blue bg-opacity-40" style={{ width: `${(pet.experience / expNeeded) * 100}%` }} />
              </div>
              <div className="flex justify-between mt-2 text-[12px] font-bold uppercase tracking-tight text-pen-blue/40">
                <span>УРОВЕНЬ {pet.level} / 300</span>
                <span>ОПЫТ {pet.experience}/{expNeeded}</span>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Right: Stats & Info */}
        <motion.div 
           initial={{ opacity: 0, x: 20 }}
           animate={{ opacity: 1, x: 0 }}
           className="space-y-6"
        >
          <GlassCard color="yellow" delay={0.3}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold uppercase text-pen-blue/60 tracking-[0.1em] flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Характеристики
              </h3>
              {pet.statPoints > 0 && (
                <div className="bg-sticker-pink text-pen-blue px-3 py-1 rounded-sm text-[11px] font-bold border border-pen-blue/20 rotate-3 animate-pulse">
                  ОЧКИ: {pet.statPoints}
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 gap-5">
              <StatItem 
                icon={Sword} 
                label="Атака" 
                value={pet.stats.attack} 
                max={999} 
                showAdd={pet.statPoints > 0} 
                onAdd={() => allocatePoint('attack')} 
              />
              <StatItem 
                icon={Shield} 
                label="Защита" 
                value={pet.stats.defense} 
                max={999} 
                showAdd={pet.statPoints > 0} 
                onAdd={() => allocatePoint('defense')} 
              />
              <StatItem 
                icon={Zap} 
                label="Скорость" 
                value={pet.stats.speed} 
                max={999} 
                showAdd={pet.statPoints > 0} 
                onAdd={() => allocatePoint('speed')} 
              />
              <StatItem 
                icon={Sparkles} 
                label="Магия" 
                value={pet.stats.magic} 
                max={999} 
                showAdd={pet.statPoints > 0} 
                onAdd={() => allocatePoint('magic')} 
              />
              <StatItem 
                icon={Heart} 
                label="Здоровье" 
                value={pet.stats.health} 
                max={999} 
                showAdd={pet.statPoints > 0} 
                onAdd={() => allocatePoint('health')} 
              />
              <StatItem 
                icon={Brain} 
                label="Реген" 
                value={pet.stats.regeneration} 
                max={999} 
                showAdd={pet.statPoints > 0} 
                onAdd={() => allocatePoint('regeneration')} 
              />
            </div>
          </GlassCard>

          <GlassCard color="blue" delay={0.4} rotation={-1}>
            <h3 className="text-sm font-bold uppercase text-pen-blue/60 mb-2 tracking-[0.1em]">Записи Атласа</h3>
            <p className="text-lg leading-snug italic text-pen-blue/80 px-2 min-h-[80px]">
              <HandwrittenText text={pet.lore} delay={0.8} speed={35} />
            </p>
            <div className="mt-8 pt-4 border-t-2 border-pen-blue/10 grid grid-cols-2 gap-y-2 text-[10px] font-bold uppercase tracking-widest text-pen-blue/50">
               <div>Класс: {pet.classification.class}</div>
               <div>Отряд: {pet.classification.order}</div>
               <div>Семья: {pet.classification.family}</div>
               <div>Род: {pet.classification.genus}</div>
            </div>
          </GlassCard>

          <GlassCard color="pink" delay={0.5} rotation={2}>
             <h3 className="text-sm font-bold uppercase text-pen-blue/60 mb-4 tracking-[0.1em]">Способности</h3>
             <div className="flex flex-wrap gap-2 pt-2">
                {pet.abilities.map((a, i) => (
                   <span key={i} className="px-4 py-1.5 bg-white/60 border-2 border-pen-blue/10 rounded-sm text-sm font-bold italic rotate-1">
                     {a}
                   </span>
                ))}
             </div>
          </GlassCard>

          <NeonButton 
            onClick={handleStartQuest} 
            loading={loadingQuest}
            className="w-full py-6 text-xl tracking-[0.1em] font-black italic mt-4"
          >
            {loadingQuest ? <Loader2 className="animate-spin h-6 w-6" /> : <Compass className="h-6 w-6" />}
            <span>ВСТУПИТЬ В ИСПЫТАНИЕ</span>
          </NeonButton>
        </motion.div>
      </div>

      <AnimatePresence>
        {quest && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6"
          >
            <div className="absolute inset-0 bg-paper/60 backdrop-blur-sm" onClick={closeQuest} />
            <GlassCard color="white" className="max-w-2xl w-full p-10 border-2 border-pen-blue/20 relative z-10 hatching-shadow">
               {!questResult ? (
                 <div className="space-y-8">
                    <div className="text-center space-y-2">
                       <span className="text-sm font-bold text-pen-red uppercase tracking-[0.4em]">ОБНАРУЖЕНО ИСПЫТАНИЕ</span>
                       <h2 className="text-4xl font-black italic tracking-tight">{quest.title}</h2>
                    </div>
                    
                    <p className="text-xl text-pen-blue/80 leading-snug text-center px-4 italic min-h-[60px]">
                       <HandwrittenText text={quest.scenario} speed={35} />
                    </p>

                    <div className="grid grid-cols-1 gap-4 pt-4">
                       {quest.options.map((opt: any, i: number) => (
                          <button 
                            key={i}
                            onClick={() => handleQuestChoice(opt)}
                            className="w-full text-left p-6 bg-white border-2 border-pen-blue/10 rounded-sm hover:-translate-y-1 hover:rotate-1 hover:border-pen-blue/30 transition-all group hatching-shadow"
                          >
                             <div className="text-lg font-bold text-pen-blue mb-2">{opt.text}</div>
                             <div className="flex items-center gap-6 text-[11px] font-bold text-pen-blue/40 uppercase tracking-widest">
                                <span className="flex items-center gap-1">+{opt.rewardXP} ОПЫТА</span>
                                <span className="flex items-center gap-1">+{opt.rewardRubles} МОНЕТ</span>
                             </div>
                          </button>
                       ))}
                    </div>
                 </div>
               ) : (
                 <div className="text-center space-y-8 py-4">
                    <div className="inline-flex h-20 w-20 items-center justify-center rounded-sm bg-sticker-yellow border-2 border-pen-blue/10 rotate-6 shadow-sm mb-4">
                       <Sparkles className="h-10 w-10 text-pen-blue" />
                    </div>
                    <div className="space-y-4">
                       <h3 className="text-3xl font-black italic uppercase">ЗАПИСЬ О РЕЗУЛЬТАТЕ</h3>
                       <p className="text-xl text-pen-blue/80 italic leading-snug px-6">
                          <HandwrittenText text={questResult.outcome} speed={40} />
                       </p>
                    </div>

                    <div className="flex justify-center gap-8 pt-8 border-t-2 border-pen-blue/5">
                        <div className="flex flex-col items-center gap-1 px-4 py-2 bg-sticker-yellow rotate-3 border-2 border-pen-blue/10">
                          <span className="text-lg font-black text-pen-blue">+{questResult.rewardRubles} ₽</span>
                        </div>
                        <div className="flex flex-col items-center gap-1 px-4 py-2 bg-sticker-pink -rotate-3 border-2 border-pen-blue/10">
                          <span className="text-lg font-black text-pen-blue">+{questResult.rewardXP} XP</span>
                        </div>
                    </div>

                    <NeonButton onClick={closeQuest} className="w-full py-5 text-xl mt-6">
                       ПРОДОЛЖИТЬ ЖУРНАЛ
                    </NeonButton>
                 </div>
               )}
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const StatItem = ({ icon: Icon, label, value, max, showAdd, onAdd }: any) => (
  <div className="space-y-1">
    <div className="flex items-center justify-between text-sm font-bold uppercase tracking-tight">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-pen-blue/40" />
        <span className="text-pen-blue/70">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {showAdd && (
          <button 
            onClick={onAdd}
            className="h-6 w-6 rounded-sm bg-white border-2 border-pen-blue/20 flex items-center justify-center hover:bg-sticker-pink transition-all rotate-3"
          >
            <Plus className="h-4 w-4" />
          </button>
        )}
        <span className="text-pen-blue text-lg italic">{value}</span>
      </div>
    </div>
    <div className="h-1.5 w-full bg-pen-blue/5 rounded-full overflow-hidden border border-pen-blue/10">
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${Math.min((value / max) * 100, 100)}%` }}
        className="h-full bg-pen-blue opacity-30"
      />
    </div>
  </div>
);
