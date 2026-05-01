import React, { useState } from 'react';
import { cn } from '../lib/utils';
import { Pet, UserProgress } from '../types';
import { GlassCard, NeonButton, HandwrittenText } from '../components/UI';
import { motion, AnimatePresence } from 'motion/react';
import { GitBranch, Zap, Sparkles, AlertCircle, TrendingUp, FlaskConical, Plus, Info } from 'lucide-react';
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

      if (nextStage === 'молодость' && pet.ageStage === 'детство') {
        rankRevealed = true;
        const randomAbility = POSSIBLE_ABILITIES[Math.floor(Math.random() * POSSIBLE_ABILITIES.length)];
        if (!newAbilities.includes(randomAbility)) {
          newAbilities.push(randomAbility);
        }
      }

      if (Math.random() < 0.1) {
        const randomAbility = POSSIBLE_ABILITIES[Math.floor(Math.random() * POSSIBLE_ABILITIES.length)];
        if (!newAbilities.includes(randomAbility)) {
          newAbilities.push(randomAbility);
        }
      }

      const updatedPet: Pet = {
        ...pet,
        level: nextLevel,
        experience: pet.experience - expNeeded,
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
    }, 1200);
  };

  const materialSlots = [
    { id: 'essence', name: 'Эссенция Жизни', icon: Sparkles, count: pet.materials['essence_life'] || 0 },
    { id: 'core', name: 'Ядро Стихии', icon: FlaskConical, count: pet.materials['element_core'] || 0 },
    { id: 'dust', name: 'Звездная Пыль', icon: Sparkles, count: pet.materials['star_dust'] || 0 },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-12 pt-12 pb-32">
       <header className="flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
          <div className="space-y-1">
            <h1 className="text-6xl font-black italic text-pen-blue uppercase tracking-tighter">ДЕРЕВО РАЗВИТИЯ</h1>
            <div className="text-pen-blue/40 text-[11px] font-bold uppercase tracking-[0.2em] italic">
               <HandwrittenText text="Смешивай редкие материалы для ускорения вечного цикла эволюции..." speed={35} />
            </div>
          </div>
       </header>

       <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7">
            <GlassCard color="white" className="p-10 border-2 border-black/5 hatching-shadow relative overflow-hidden group">
               <div className="relative z-10 space-y-12">
                  <div className="text-center space-y-2">
                     <div className="text-[12px] font-black text-pen-blue/30 uppercase tracking-[0.3em] italic">Текущая Стадия</div>
                     <h2 className="text-5xl font-black italic uppercase text-pen-blue tracking-tighter leading-none">{pet.ageStage}</h2>
                     <div className="flex items-center justify-center gap-4 text-pen-blue/40 text-[11px] font-black italic uppercase tracking-widest pt-2">
                        <span className="flex items-center gap-1.5"><Zap className="h-4 w-4" /> LVL {pet.level} / {MAX_LEVEL}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-pen-blue/10" />
                        <span>EXP {pet.experience}/{expNeeded}</span>
                     </div>
                  </div>

                  <div className="flex justify-center relative">
                     <div className="relative h-56 w-56 flex items-center justify-center">
                        <div className={cn(
                          "absolute inset-0 rounded-full border-2 border-dashed border-pen-blue/10 animate-[spin_15s_linear_infinite]",
                          evolving ? "border-pen-blue border-solid border-4 opacity-50 animate-[spin_2s_linear_infinite]" : ""
                        )} />
                        <div className={cn(
                          "absolute inset-6 rounded-full overflow-hidden border-2 border-black/5 bg-white shadow-inner transition-transform duration-700",
                          evolving ? "scale-90" : "group-hover:scale-105"
                        )}>
                           <img src={pet.image} className="h-full w-full object-cover group-hover:scale-110 transition-all duration-700" />
                        </div>
                        {evolving && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/40 backdrop-blur-[2px] z-20 rounded-full">
                             <TrendingUp className="h-10 w-10 text-pen-blue animate-bounce" />
                             <span className="text-[10px] font-black italic uppercase text-pen-blue tracking-widest">Эволюция...</span>
                          </div>
                        )}
                        
                        {/* Decorative sketchy accents */}
                        <div className="absolute -top-4 -right-4 bg-sticker-yellow border-2 border-pen-blue p-2 rounded-sm rotate-6 shadow-sm">
                           <Sparkles className="h-4 w-4 text-pen-blue" />
                        </div>
                     </div>
                  </div>

                  <div className="space-y-6 pt-4">
                     <div className="text-center">
                        <div className="text-[11px] font-black uppercase tracking-[0.2em] text-pen-blue/30 italic mb-2">Стоимость перехода</div>
                        <div className="text-3xl font-black italic text-pen-blue">{costPerLevel} ₽</div>
                     </div>
                     <NeonButton 
                       onClick={handleLevelUp} 
                       loading={evolving}
                       className="w-full py-8 text-lg font-black italic uppercase tracking-widest"
                     >
                       <GitBranch className="h-6 w-6" />
                       <span>ПОВЫСИТЬ ПЕРСОНАЛЬНЫЙ УРОВЕНЬ</span>
                     </NeonButton>
                  </div>
               </div>
            </GlassCard>
          </div>

          <div className="lg:col-span-5 space-y-8">
             <GlassCard color="blue" rotation={-1} className="p-8 border-2 border-black/5 hatching-shadow">
                <h3 className="text-xs font-black uppercase text-pen-blue/60 mb-8 tracking-[0.3em] flex items-center gap-2 italic">
                   <FlaskConical className="h-5 w-5" />
                   ЛАБОРАТОРИЯ МАТЕРИАЛОВ
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                   {materialSlots.map((m, i) => (
                      <div key={m.id} className="bg-white border-2 border-black/5 rounded-sm p-5 flex flex-col items-center gap-3 relative group hover:-translate-y-1 transition-all shadow-sm">
                         <div className="absolute top-2 right-3 text-[11px] font-black text-pen-blue/20 italic">x{m.count}</div>
                         <m.icon className="h-6 w-6 text-pen-blue/40 group-hover:text-pen-blue transition-colors" />
                         <span className="text-[9px] font-black text-center uppercase tracking-widest text-pen-blue/40 leading-tight italic">{m.name}</span>
                         <button className="w-full bg-pen-blue/5 hover:bg-pen-blue/10 text-[9px] font-black py-2 rounded-sm border border-pen-blue/5 uppercase tracking-widest transition-all italic text-pen-blue">Добавить</button>
                      </div>
                   ))}
                   <div className="border-2 border-dashed border-black/10 rounded-sm p-5 flex flex-col items-center justify-center gap-2 opacity-30">
                      <Plus className="h-6 w-6 text-pen-blue" />
                      <span className="text-[9px] font-black italic uppercase">Пусто</span>
                   </div>
                </div>

                <NeonButton className="w-full mt-8 py-5 text-sm uppercase font-black italic" disabled>
                   ИНИЦИИРОВАТЬ МУТАЦИЮ
                </NeonButton>
             </GlassCard>

             <GlassCard color="pink" rotation={1} className="p-8 border-2 border-black/5 hatching-shadow">
                <h4 className="text-[11px] font-black uppercase text-pen-blue/60 tracking-[0.2em] mb-4 flex items-center gap-2 italic">
                   <Info className="h-4 w-4" />
                   Методические указания
                </h4>
                <ul className="space-y-3 text-[10px] text-pen-blue/50 uppercase tracking-widest font-black leading-relaxed italic list-none">
                   <li className="flex gap-2"><span>-</span> <span>На стадии Молодость (Ур. 6) откроется Ранг (E-SSS).</span></li>
                   <li className="flex gap-2"><span>-</span> <span>Каждый уровень дает 30 очков характеристик.</span></li>
                   <li className="flex gap-2"><span>-</span> <span>Необходимо накопить достаточно опыта (EXP).</span></li>
                   <li className="flex gap-2"><span>-</span> <span>Ранг влияет на статус существа в Бестиарии.</span></li>
                </ul>
             </GlassCard>
          </div>
       </div>
    </div>
  );
};

// removed local cn
