import React, { useState } from 'react';
import { cn } from '../lib/utils';
import { Pet, UserProgress } from '../types';
import { GlassCard, NeonButton } from '../components/UI';
import { motion, AnimatePresence } from 'motion/react';
import { GitBranch, Zap, Sparkles, AlertCircle, TrendingUp, FlaskConical, Plus } from 'lucide-react';
import { getAgeStage, getExpNeeded, MAX_LEVEL, POINTS_PER_LEVEL } from '../constants/game';

const POSSIBLE_ABILITIES = [
  'Небесный клинок', 'Звездный щит', 'Эфирный взрыв', 'Ледяная буря',
  'Пламенная ярость', 'Пространственный прыжок', 'Духовная броня',
  'Песнь ветра', 'Удар бездны', 'Святое исцеление', 'Мантра мудрости',
  'Гром небес', 'Танец теней', 'Ядовитый туман', 'Кровавая жатва'
];

export const Evolve: React.FC<{ progress: UserProgress; setProgress: React.Dispatch<React.SetStateAction<UserProgress>> }> = ({ progress, setProgress }) => {
  const [evolving, setEvolving] = useState(false);
  const pet = progress.pets.find(p => p.id === progress.activePetId);

  if (!pet) return null;

  const currentStage = getAgeStage(pet.level);
  const costPerLevel = Math.floor(pet.level * 500 * Math.pow(1.05, pet.level - 1));
  const expNeeded = getExpNeeded(pet.level);
  const canLevelUp = pet.experience >= expNeeded && pet.level < MAX_LEVEL;

  const handleLevelUp = () => {
    if (pet.level >= MAX_LEVEL) return;
    if (pet.experience < expNeeded) {
      alert('Недостаточно опыта!');
      return;
    }
    if (progress.currency < costPerLevel) {
      alert('Недостаточно рублей!');
      return;
    }

    setEvolving(true);
    
    setTimeout(() => {
      const nextLevel = pet.level + 1;
      const nextStage = getAgeStage(nextLevel);
      let newAbilities = [...pet.abilities];
      let rankRevealed = pet.isRankRevealed;

      // Logic: Transition to Youth (Молодость) reveals rank and adds ability
      if (nextStage === 'молодость' && pet.ageStage === 'детство') {
        rankRevealed = true;
        const randomAbility = POSSIBLE_ABILITIES[Math.floor(Math.random() * POSSIBLE_ABILITIES.length)];
        if (!newAbilities.includes(randomAbility)) {
          newAbilities.push(randomAbility);
        }
      }

      // Small chance for random ability on ANY level up
      if (Math.random() < 0.1) {
        const randomAbility = POSSIBLE_ABILITIES[Math.floor(Math.random() * POSSIBLE_ABILITIES.length)];
        if (!newAbilities.includes(randomAbility)) {
          newAbilities.push(randomAbility);
        }
      }

      const updatedPet: Pet = {
        ...pet,
        level: nextLevel,
        experience: pet.experience - expNeeded, // Carry over leftover XP
        ageStage: nextStage,
        isRankRevealed: rankRevealed || nextLevel >= 60,
        abilities: newAbilities,
        statPoints: pet.statPoints + POINTS_PER_LEVEL,
      };

      setProgress(prev => ({
        ...prev,
        currency: prev.currency - costPerLevel,
        pets: prev.pets.map(p => p.id === pet.id ? updatedPet : p)
      }));
      setEvolving(false);
    }, 1000);
  };

  const materialSlots = [
    { name: 'Эссенция Жизни', icon: Heart, count: pet.materials['essence_life'] || 0 },
    { name: 'Ядро Стихии', icon: FlaskConical, count: pet.materials['element_core'] || 0 },
    { name: 'Звездная Пыль', icon: Sparkles, count: pet.materials['star_dust'] || 0 },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8 pt-12 pb-32">
       <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <h1 className="text-5xl font-black italic uppercase tracking-tighter">ДЕРЕВО РАЗВИТИЯ</h1>
            <p className="text-white/50 text-xs uppercase tracking-[0.2em] font-medium opacity-60">Смешивай материалы для ускорения эволюции</p>
          </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Main Leveling Card */}
          <GlassCard className="relative overflow-hidden group">
             <div className="absolute inset-0 bg-gradient-to-br from-neon-blue/10 via-transparent to-transparent opacity-50" />
             <div className="relative z-10 space-y-10 py-10 px-8">
                <div className="text-center space-y-2">
                   <div className="text-[10px] font-black text-neon-blue uppercase tracking-[0.3em]">Текущая Стадия</div>
                   <h2 className="text-4xl font-black italic uppercase tracking-tighter">{pet.ageStage}</h2>
                   <div className="flex items-center justify-center gap-2 text-white/40 text-[10px] font-bold">
                      <Zap className="h-3 w-3" />
                      <span>LVL {pet.level} / {MAX_LEVEL}</span>
                      <span>•</span>
                      <span>EXP {pet.experience}/{expNeeded}</span>
                   </div>
                </div>

                <div className="flex justify-center py-6">
                   <div className="relative h-40 w-40">
                      <div className={cn(
                        "absolute inset-0 rounded-full border-4 border-dashed border-white/5 animate-[spin_10s_linear_infinite]",
                        evolving ? "border-neon-blue border-solid animate-[spin_1s_linear_infinite]" : ""
                      )} />
                      <div className="absolute inset-4 rounded-full overflow-hidden border border-white/10">
                         <img src={pet.image} className="h-full w-full object-cover grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700" />
                      </div>
                      {evolving && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-20">
                           <TrendingUp className="h-8 w-8 text-neon-blue animate-bounce" />
                        </div>
                      )}
                   </div>
                </div>

                <div className="space-y-4">
                   <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-white/60">
                      <span>Стоимость Улучшения</span>
                      <span className="text-white">{costPerLevel} ₽</span>
                   </div>
                   <NeonButton 
                     onClick={handleLevelUp} 
                     loading={evolving}
                     variant="blue" 
                     className="w-full py-6 rounded-2xl text-[12px] tracking-[0.3em] font-black italic"
                   >
                     ПОВЫСИТЬ ПЕРСОНАЛЬНЫЙ УРОВЕНЬ
                   </NeonButton>
                </div>
             </div>
          </GlassCard>

          {/* Mixing Box */}
          <div className="space-y-6">
             <GlassCard className="p-8">
                <h3 className="text-xs font-black uppercase text-neon-purple mb-8 tracking-[0.3em] flex items-center gap-2">
                   <FlaskConical className="h-4 w-4" />
                   Смешение Материалов
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                   {materialSlots.map((m, i) => (
                      <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center gap-3 relative group hover:border-white/20 transition-all">
                         <div className="absolute top-2 right-3 text-[10px] font-black text-white/30">x{m.count}</div>
                         <m.icon className="h-6 w-6 text-white/20 group-hover:text-neon-blue transition-colors" />
                         <span className="text-[8px] font-bold text-center uppercase tracking-widest opacity-60 leading-tight">{m.name}</span>
                         <button className="w-full bg-white/5 hover:bg-white/10 text-[8px] font-bold py-1.5 rounded-lg border border-white/5 uppercase tracking-widest transition-all">Добавить</button>
                      </div>
                   ))}
                   <div className="border border-dashed border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 opacity-30">
                      <Plus className="h-5 w-5" />
                      <span className="text-[8px] font-bold">ПУСТО</span>
                   </div>
                </div>

                <NeonButton variant="purple" className="w-full mt-8 py-4 rounded-xl text-[10px] tracking-widest uppercase" disabled>
                   ИНИЦИИРОВАТЬ МУТАЦИЮ
                </NeonButton>
             </GlassCard>

             <GlassCard className="bg-neon-pink/5 border-neon-pink/20">
                <h4 className="text-[10px] font-black uppercase text-neon-pink tracking-[0.2em] mb-3">Важная информация</h4>
                <ul className="space-y-2 text-[9px] text-white/50 uppercase tracking-widest font-bold leading-relaxed list-disc pl-4">
                   <li>На стадии <span className="text-white italic">Молодость</span> (Ур. 60) откроется Ранг (E-SSS).</li>
                   <li>Каждый уровень дает <span className="text-white">30 очков</span> распределения характеристик.</li>
                    <li>Необходимо накопить достаточно опыта (EXP) для перехода на следующий уровень.</li>
                   <li>Ранг и способности существенно влияют на цену продажи на Рынке.</li>
                </ul>
             </GlassCard>
          </div>
       </div>
    </div>
  );
};

const Heart = ({ className }: any) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>;

// removed local cn
