import React, { useState } from 'react';
import { UserProgress, Pet } from '../types';
import { GlassCard, NeonButton } from '../components/UI';
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
    
    // Check if enough XP for level up is handled in Evolve usually, but quests give it too.
    // However, user said levels are 300 max and 30 points per level.
    // I will handle the basic XP gain here. 
    // If I want to trigger auto-levelup, I would do it here. 
    // The user didn't explicitly say "auto level up", but normally XP leads to level up.
    // Let's keep it consistent: XP just adds up, Level Up is a manual "Evolution" step for now in this game.
    
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
      <header className="flex h-16 items-center justify-between glass px-6 rounded-2xl border border-white/12 backdrop-blur-[20px] animate-in fade-in slide-in-from-top-4 duration-1000">
        <div className="flex items-center gap-3">
          <img src="https://i.ibb.co/vCDztLGH/aisaimain.png" alt="aiSai" className="h-8 w-8 rounded-md" />
          <div>
            <h1 className="text-xl font-black italic tracking-wider logo-text-gradient uppercase leading-none">AISAI</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="bg-black/30 px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2 text-[11px] font-bold">
            <span className="text-rarity-legendary">₽</span>
            <span className="text-white">{progress.currency.toLocaleString()}</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left: Pet Visual */}
        <motion.div
           initial={{ opacity: 0, x: -20 }}
           animate={{ opacity: 1, x: 0 }}
        >
          <GlassCard delay={0.2} className="p-0 overflow-hidden aspect-[9/16] relative shadow-2xl rounded-[32px] border-white/20">
            <img src={pet.image} alt={pet.name} className="w-full h-full object-cover" />
            <div className="absolute top-6 right-6 flex flex-col items-end gap-2">
               <div className="bg-rarity-legendary text-[10px] font-[900] text-black px-4 py-1 rounded-full uppercase tracking-widest shadow-[0_0_20px_rgba(255,204,0,0.5)]">
                 {pet.rarity}
               </div>
               <div className={cn(
                  "text-white text-2xl font-black px-4 py-2 rounded-xl shadow-2xl border border-white/30 backdrop-blur-md",
                  isRankRevealed ? "bg-neon-blue" : "bg-white/10 opacity-60"
               )}>
                 {isRankRevealed ? getPowerRank(pet.level) : "???"}
               </div>
               <div className="bg-black/60 text-[9px] font-black text-white/80 px-3 py-1 rounded-md border border-white/10 uppercase tracking-widest whitespace-nowrap">
                 {currentStage}
               </div>
            </div>
            <div className={`absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black via-black/60 to-transparent pt-20`}>
              <div className="text-[10px] font-mono text-neon-blue uppercase tracking-[0.3em] mb-2">
                {pet.classification.type} • {pet.classification.species}
              </div>
              <h2 className="text-4xl font-black font-serif italic tracking-tight">{pet.name}</h2>
              <div className="h-1.5 w-full bg-white/10 rounded-full mt-4 overflow-hidden">
                <div className="h-full bg-neon-purple shadow-[0_0_10px_#bc00ff]" style={{ width: `${(pet.experience / expNeeded) * 100}%` }} />
              </div>
              <div className="flex justify-between mt-2 text-[10px] font-bold uppercase tracking-widest text-white/40">
                <span>LVL {pet.level} / 300</span>
                <span>EXP {pet.experience}/{expNeeded}</span>
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
          <GlassCard delay={0.3}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-bold uppercase text-white/40 tracking-[0.2em] flex items-center gap-2">
                <Activity className="h-4 w-4 text-neon-blue" />
                Боевые Характеристики
              </h3>
              {pet.statPoints > 0 && (
                <div className="bg-neon-blue/20 text-neon-blue px-3 py-1 rounded-full text-[10px] font-black border border-neon-blue shadow-[0_0_10px_rgba(0,242,255,0.2)] animate-pulse">
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
                color="from-red-500 to-orange-500" 
                showAdd={pet.statPoints > 0} 
                onAdd={() => allocatePoint('attack')} 
              />
              <StatItem 
                icon={Shield} 
                label="Защита" 
                value={pet.stats.defense} 
                max={999} 
                color="from-blue-500 to-indigo-500" 
                showAdd={pet.statPoints > 0} 
                onAdd={() => allocatePoint('defense')} 
              />
              <StatItem 
                icon={Zap} 
                label="Скорость" 
                value={pet.stats.speed} 
                max={999} 
                color="from-cyan-400 to-blue-500" 
                showAdd={pet.statPoints > 0} 
                onAdd={() => allocatePoint('speed')} 
              />
              <StatItem 
                icon={Sparkles} 
                label="Магия" 
                value={pet.stats.magic} 
                max={999} 
                color="from-purple-500 to-pink-500" 
                showAdd={pet.statPoints > 0} 
                onAdd={() => allocatePoint('magic')} 
              />
              <StatItem 
                icon={Heart} 
                label="Здоровье" 
                value={pet.stats.health} 
                max={999} 
                color="from-emerald-500 to-teal-500" 
                showAdd={pet.statPoints > 0} 
                onAdd={() => allocatePoint('health')} 
              />
              <StatItem 
                icon={Brain} 
                label="Реген" 
                value={pet.stats.regeneration} 
                max={999} 
                color="from-amber-400 to-yellow-600" 
                showAdd={pet.statPoints > 0} 
                onAdd={() => allocatePoint('regeneration')} 
              />
            </div>
          </GlassCard>

          <GlassCard delay={0.4}>
            <h3 className="text-xs font-bold uppercase text-white/40 mb-4 tracking-[0.2em]">Происхождение</h3>
            <p className="text-xs text-[#94a3b8] leading-relaxed uppercase tracking-widest">
              {pet.lore}
            </p>
            <div className="mt-6 pt-4 border-t border-white/10 grid grid-cols-2 gap-4 text-[9px] font-bold uppercase tracking-widest text-white/30">
               <div>Класс: {pet.classification.class}</div>
               <div>Отряд: {pet.classification.order}</div>
               <div>Семья: {pet.classification.family}</div>
               <div>Род: {pet.classification.genus}</div>
            </div>
          </GlassCard>

          <GlassCard delay={0.5} className="bg-gradient-to-br from-neon-pink/10 to-transparent border-neon-pink/20">
             <h3 className="text-xs font-bold uppercase text-neon-pink mb-4 tracking-[0.2em]">Способности</h3>
             <div className="flex flex-wrap gap-2">
                {pet.abilities.map((a, i) => (
                   <span key={i} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-wide text-white/70">
                     {a}
                   </span>
                ))}
             </div>
          </GlassCard>

          <NeonButton 
            onClick={handleStartQuest} 
            loading={loadingQuest}
            variant="purple" 
            className="w-full py-6 rounded-2xl text-[12px] tracking-[0.3em] font-black italic animate-in fade-in slide-in-from-bottom-4 duration-700 delay-700 fill-mode-both"
          >
            {loadingQuest ? <Loader2 className="animate-spin h-5 w-5" /> : <Compass className="h-5 w-5" />}
            <span>ОТПРАВИТЬСЯ В ИСПЫТАНИЕ</span>
          </NeonButton>
        </motion.div>
      </div>

      <AnimatePresence>
        {quest && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-6"
          >
            <GlassCard className="max-w-xl w-full p-10 border-neon-purple shadow-[0_0_50px_rgba(188,0,255,0.2)]">
               {!questResult ? (
                 <div className="space-y-8">
                    <div className="text-center space-y-2">
                       <span className="text-[10px] font-black text-neon-purple uppercase tracking-[0.4em]">ИИ-ИСПЫТАНИЕ</span>
                       <h2 className="text-3xl font-black italic uppercase tracking-tighter">{quest.title}</h2>
                    </div>
                    
                    <p className="text-sm text-white/70 leading-relaxed text-center px-4 italic">
                       "{quest.scenario}"
                    </p>

                    <div className="grid grid-cols-1 gap-3">
                       {quest.options.map((opt: any, i: number) => (
                          <button 
                            key={i}
                            onClick={() => handleQuestChoice(opt)}
                            className="w-full text-left p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-neon-blue transition-all group"
                          >
                             <div className="text-xs font-bold text-white group-hover:text-neon-blue mb-1">{opt.text}</div>
                             <div className="flex items-center gap-4 text-[9px] font-black text-white/30 uppercase tracking-widest">
                                <span className="flex items-center gap-1"><Zap className="h-3 w-3 text-neon-blue" /> +{opt.rewardXP} XP</span>
                                <span className="flex items-center gap-1"><Coins className="h-3 w-3 text-rarity-legendary" /> +{opt.rewardRubles} ₽</span>
                             </div>
                          </button>
                       ))}
                    </div>
                 </div>
               ) : (
                 <div className="text-center space-y-8 py-4">
                    <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-neon-blue/20 border border-neon-blue shadow-[0_0_30px_rgba(0,242,255,0.3)] mb-4">
                       <Sparkles className="h-10 w-10 text-neon-blue" />
                    </div>
                    <div className="space-y-4">
                       <h3 className="text-2xl font-black italic uppercase tracking-tighter">РЕЗУЛЬТАТ</h3>
                       <p className="text-sm text-white/70 italic leading-relaxed">
                          {questResult.outcome}
                       </p>
                    </div>

                    <div className="flex justify-center gap-6 pt-4 border-t border-white/5">
                        <div className="flex flex-col items-center gap-1">
                          <Coins className="h-5 w-5 text-rarity-legendary" />
                          <span className="text-md font-black text-white">+{questResult.rewardRubles} ₽</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <Zap className="h-5 w-5 text-neon-blue" />
                          <span className="text-md font-black text-white">+{questResult.rewardXP} XP</span>
                        </div>
                    </div>

                    <NeonButton variant="blue" onClick={closeQuest} className="w-full py-4 rounded-xl font-black italic tracking-widest mt-6">
                       ПРОДОЛЖИТЬ ПУТЬ
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

const StatItem = ({ icon: Icon, label, value, max, color, showAdd, onAdd }: any) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest">
      <div className="flex items-center gap-2">
        <Icon className="h-3 w-3 text-white/40" />
        <span className="text-[#94a3b8]">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        {showAdd && (
          <button 
            onClick={onAdd}
            className="h-5 w-5 rounded-full bg-neon-blue/20 flex items-center justify-center border border-neon-blue/40 hover:bg-neon-blue hover:text-black transition-all"
          >
            <Plus className="h-3 w-3" />
          </button>
        )}
        <span className="text-white">{value}</span>
      </div>
    </div>
    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${Math.min((value / max) * 100, 100)}%` }}
        className={`h-full bg-gradient-to-r ${color} rounded-full`}
      />
    </div>
  </div>
);
