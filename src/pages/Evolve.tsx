import React, { useState } from 'react';
import { cn } from '../lib/utils';
import { Pet, UserProgress } from '../types';
import { GlassCard, NeonButton, HandwrittenText } from '../components/UI';
import { motion, AnimatePresence } from 'motion/react';
import { GitBranch, Zap, Sparkles, AlertCircle, TrendingUp, FlaskConical, Plus, Info, ArrowLeft } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPetRankByLevel, getExpNeeded, RARITY_WEIGHTS } from '../lib/gameLogic';
import { generateEvolutionUpdate, generatePetArt } from '../services/aiService';

const MAX_LEVEL = 100;

export const Evolve: React.FC<{ progress: UserProgress; setProgress: React.Dispatch<React.SetStateAction<UserProgress>> }> = ({ progress, setProgress }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [evolving, setEvolving] = useState(false);
  
  const pet = progress.pets.find(p => p.id === id);

  if (!pet) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-screen text-center space-y-4">
        <h2 className="text-3xl font-black italic text-pen-blue">Сущность не найдена</h2>
        <NeonButton onClick={() => navigate('/main')}>Вернуться в Бестиарий</NeonButton>
      </div>
    );
  }

  const costPerLevel = Math.floor(pet.level * 500 * Math.pow(1.05, pet.level - 1));
  const expNeeded = getExpNeeded(pet.level);
  const canLevelUp = pet.experience >= expNeeded && pet.level < MAX_LEVEL;
  const growthPerLevel = RARITY_WEIGHTS[pet.rarity].growth;

  const handleLevelUp = async () => {
    if (pet.level >= MAX_LEVEL) return;
    if (pet.experience < expNeeded) {
      return;
    }
    if (progress.currency < costPerLevel) {
      return;
    }

    setEvolving(true);
    
    try {
      const nextLevel = pet.level + 1;
      const nextStage = getPetRankByLevel(nextLevel);
      let updatedAbilities = [...pet.abilities];
      let updatedLore = pet.lore;
      let updatedImage = pet.image;

      // Major Rank Up every 10 levels
      if (nextLevel % 10 === 1 || (nextLevel === 11 || nextLevel === 21 || nextLevel === 31 || nextLevel === 41 || nextLevel === 51 || nextLevel === 61 || nextLevel === 71 || nextLevel === 81 || nextLevel === 91)) {
        const evolutionData = await generateEvolutionUpdate(pet, nextStage);
        updatedAbilities = evolutionData.abilities;
        updatedLore = evolutionData.lore;
        updatedImage = await generatePetArt({ ...pet, level: nextLevel, ageStage: nextStage });
      }

      const updatedPet: Pet = {
        ...pet,
        level: nextLevel,
        experience: pet.experience - expNeeded,
        ageStage: nextStage,
        abilities: updatedAbilities,
        lore: updatedLore,
        image: updatedImage,
        statPoints: pet.statPoints + growthPerLevel,
      };

      setProgress(prev => ({
        ...prev,
        currency: prev.currency - costPerLevel,
        pets: prev.pets.map(p => p.id === pet.id ? updatedPet : p)
      }));
    } catch (e) {
      console.error("Evolution failed", e);
    } finally {
      setEvolving(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-12 pt-12 pb-32 min-h-screen relative">
       <header className="flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-pen-blue/60 hover:text-pen-blue font-black italic transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Назад</span>
          </button>
          <div className="space-y-1 text-center flex-1 pr-12">
            <h1 className="text-4xl sm:text-6xl font-black italic text-pen-blue tracking-tighter leading-tight">Древо Развития</h1>
            <div className="text-pen-blue/40 text-[14px] font-black italic mt-2">
               Гармонизация и эволюция внутренней силы сущности
            </div>
          </div>
       </header>

       <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7">
            <GlassCard color="white" className="p-10 border-2 border-black/5 hatching-shadow relative overflow-hidden group">
               <div className="relative z-10 space-y-12">
                  <div className="text-center space-y-2">
                     <div className="text-[12px] font-black text-pen-blue/30 italic">Текущая Стадия</div>
                     <h2 className="text-5xl font-black italic text-pen-blue tracking-tighter leading-none">{pet.ageStage}</h2>
                     <div className="flex items-center justify-center gap-4 text-pen-blue/40 text-[12px] font-black italic pt-2">
                        <span className="flex items-center gap-1.5"><Zap className="h-4 w-4" /> Ур. {pet.level} / {MAX_LEVEL}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-pen-blue/10" />
                        <span>Оп. {pet.experience}/{expNeeded}</span>
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
                             <span className="text-[12px] font-black italic text-pen-blue">Сенситизация...</span>
                          </div>
                        )}
                     </div>
                  </div>

                  <div className="space-y-6 pt-4">
                     <div className="text-center">
                        <div className="text-[12px] font-black text-pen-blue/30 italic mb-2">Стоимость перехода</div>
                        <div className="text-4xl font-black italic text-pen-blue">{costPerLevel} ₽</div>
                     </div>
                     <NeonButton 
                       onClick={handleLevelUp} 
                       disabled={evolving || !canLevelUp}
                       className="w-full py-8 text-2xl font-black italic"
                     >
                       <GitBranch className="h-6 w-6" />
                       <span>Повысить Уровень</span>
                     </NeonButton>
                     {!canLevelUp && pet.level < MAX_LEVEL && (
                        <p className="text-center text-pen-red/40 text-[10px] font-black italic">Недостаточно опыта для трансформации</p>
                     )}
                  </div>
               </div>
            </GlassCard>
          </div>

          <div className="lg:col-span-5 space-y-8">
             <GlassCard color="blue" rotation={-1} className="p-8 border-2 border-black/5 hatching-shadow">
                <h3 className="text-lg font-black text-pen-blue/60 mb-8 flex items-center gap-2 italic">
                   <FlaskConical className="h-5 w-5" />
                   Лаборатория материалов
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 py-10 text-center border-2 border-dashed border-black/10 flex flex-col items-center justify-center gap-2 opacity-30">
                       <Plus className="h-6 w-6 text-pen-blue" />
                       <span className="text-[12px] font-black italic">Пусто</span>
                       <span className="text-[10px] font-black">Материалы будут доступны в будущих обновлениях</span>
                    </div>
                </div>
             </GlassCard>

             <GlassCard color="pink" rotation={1} className="p-8 border-2 border-black/5 hatching-shadow">
                <h4 className="text-lg font-black text-pen-blue/60 mb-4 flex items-center gap-2 italic">
                   <Info className="h-4 w-4" />
                   Справочник эволюции
                </h4>
                <ul className="space-y-4 text-[12px] text-pen-blue/50 font-black italic leading-relaxed list-none">
                   <li className="flex gap-2"><span>•</span> <span>Каждый уровень дает 30 свободных очков характеристик.</span></li>
                   <li className="flex gap-2"><span>•</span> <span>С ростом уровня меняется стадия развития сущности.</span></li>
                   <li className="flex gap-2"><span>•</span> <span>Успешный призыв зависит от вашего ранга призывателя.</span></li>
                </ul>
             </GlassCard>
          </div>
       </div>
    </div>
  );
};

// removed local cn
