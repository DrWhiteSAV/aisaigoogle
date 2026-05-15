import React, { useState } from 'react';
import { cn } from '../lib/utils';
import { Pet, UserProgress } from '../types';
import { GlassCard, NeonButton, HandwrittenText, LogoAnimation } from '../components/UI';
import { PetEvolutionCard } from '../components/PetEvolutionCard';
import { motion, AnimatePresence } from 'motion/react';
import { GitBranch, Zap, Sparkles, AlertCircle, TrendingUp, FlaskConical, Plus, Info, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPetRankByLevel, getExpNeeded, RARITY_WEIGHTS } from '../lib/gameLogic';
import { RARITY_STYLES, RARITY_LABELS } from '../constants/gameData';
import { Rarity } from '../types';
import { generateEvolutionUpdate, generatePetArt } from '../services/aiService';

const MAX_LEVEL = 100;

export const Evolve: React.FC<{ 
  progress: UserProgress; 
  setProgress: React.Dispatch<React.SetStateAction<UserProgress>>; 
  manualId?: string;
  toggleFlipLock?: (id: string, locked: boolean) => void;
  side?: 'left' | 'right';
  spreadIndex?: number;
}> = ({ progress, setProgress, manualId, toggleFlipLock, side, spreadIndex = 0 }) => {
  const { id: paramsId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const componentId = React.useId();
  const lockId = `evolve-${componentId}`;
  
  // Decide if paramsId represents a page number (1-3 digits) or a pet ID
  const isPageNum = paramsId && /^\d{1,3}$/.test(paramsId);
  const pageNumFromRoute = isPageNum ? parseInt(paramsId) : 1;
  const currentPetId = isPageNum ? null : paramsId;

  const [evolving, setEvolving] = useState(false);
  const [evolutionResult, setEvolutionResult] = useState<Pet | null>(null);

  React.useEffect(() => {
    if (toggleFlipLock) {
      toggleFlipLock(lockId, evolving || !!evolutionResult);
    }
  }, [evolving, evolutionResult, toggleFlipLock, lockId]);
  
  const id = manualId || currentPetId;
  const pet = progress.pets.find(p => p.id === id) || progress.pets[0];

  // Find which page this pet belongs to, or use the page number from route
  const currentPetIndex = progress.pets.findIndex(p => p.id === id);
  const effectivePageNum = currentPetIndex !== -1 ? Math.floor(currentPetIndex / 4) + 1 : (spreadIndex + 1);
  const totalPages = Math.ceil((progress.pets?.length || 0) / 4);

  if (!pet && progress.pets.length === 0) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-screen text-center space-y-4">
        <h2 className="text-3xl font-black text-pen-blue">Сущностей пока нет</h2>
        <NeonButton onClick={() => navigate('/summon')}>Призвать первую</NeonButton>
      </div>
    );
  }

  const costPerLevel = pet ? Math.floor(pet.level * 500 * Math.pow(1.05, pet.level - 1)) : 0;
  const expNeeded = pet ? getExpNeeded(pet.level) : 0;
  const canLevelUp = pet ? (pet.experience >= expNeeded && pet.level < MAX_LEVEL) : false;
  const growthPerLevel = pet ? RARITY_WEIGHTS[pet.rarity].growth : 0;
  
  const potentialRank = pet ? getPetRankByLevel(pet.level) : '';
  const currentRankCode = pet ? pet.ageStage.split(' ')[0] : '';
  const potentialRankCode = pet ? potentialRank.split(' ')[0] : '';
  
  const rankIndex = ['F', 'E', 'D', 'C', 'B', 'A', 'S', 'EX', 'UX', 'Z'].indexOf(potentialRankCode);
  const expectedSkills = (rankIndex * 2) + 2;
  const currentSkillsCount = pet ? (pet.skills || []).length : 0;

  const isMajorEvolution = potentialRankCode !== currentRankCode || (pet && pet.level >= 11 && currentSkillsCount < expectedSkills);

  const handleLevelUp = async () => {
    if (!pet || pet.level >= MAX_LEVEL) return;
    if (pet.experience < expNeeded) return;
    if (progress.sprouts < costPerLevel && !isMajorEvolution) return;

    setEvolving(true);
    
    try {
      let updatedPet: Pet;

      if (isMajorEvolution) {
        const nextStage = getPetRankByLevel(pet.level);
        const evolutionData = await generateEvolutionUpdate(pet, nextStage);
        const updatedImage = await generatePetArt({ ...pet, ageStage: nextStage });

        updatedPet = {
          ...pet,
          name: evolutionData.newName,
          ageStage: nextStage,
          skills: [...(pet.skills || []), ...evolutionData.newSkills],
          lore: evolutionData.lore,
          image: updatedImage,
          imageHistory: [...(pet.imageHistory || [pet.image]), updatedImage],
          statPoints: pet.statPoints + growthPerLevel,
        };
        
        setEvolutionResult(updatedPet);
      } else {
        const nextLevel = pet.level + 1;
        const nextStage = getPetRankByLevel(nextLevel);
        
        updatedPet = {
          ...pet,
          level: nextLevel,
          experience: pet.experience - expNeeded,
          ageStage: nextStage,
          statPoints: pet.statPoints + growthPerLevel,
        };
      }

      setProgress(prev => ({
        ...prev,
        sprouts: prev.sprouts - (isMajorEvolution ? 0 : costPerLevel),
        pets: prev.pets.map(p => p.id === pet.id ? updatedPet : p)
      }));
    } catch (e) {
      console.error("Evolution failed", e);
    } finally {
      if (!isMajorEvolution) {
        setEvolving(false);
        navigate(`/pet/${pet.id}`);
      }
    }
  };

  const handleFinishEvolution = () => {
    setEvolving(false);
    setEvolutionResult(null);
    navigate(`/pet/${pet.id}`);
  };

  const renderGallery = (sidePets: Pet[]) => (
    <div className="space-y-4 h-full flex flex-col">
       <header className="flex items-center justify-between border-b-2 border-black/5 pb-2 shrink-0">
        <div className="flex items-center gap-2">
          {side === 'left' && (
            <button 
              onClick={() => navigate('/pet/' + (pet?.id || progress.pets[0]?.id))}
              className="p-1 hover:bg-black/5 rounded-full transition-colors text-pen-blue"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <h2 className="text-lg font-black text-pen-blue italic tracking-tighter flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            Эволюция
          </h2>
        </div>
      </header>

       <div className="flex-1 overflow-visible">
          <div className="grid grid-cols-2 gap-x-3 h-full">
             {sidePets.map((p) => (
               <PetEvolutionCard 
                 key={p.id}
                 pet={p}
                 isSelected={p.id === id}
                 isEvolving={evolving}
                 onSelect={() => navigate(`/evolve/${p.id}`)}
                 onLevelUp={() => handleLevelUp()}
               />
             ))}
          </div>
       </div>

       <div className="pt-2 border-t border-black/5 flex items-center justify-between shrink-0">
          <div className="text-[16px] font-black text-pen-blue">
            Лист {effectivePageNum} / {totalPages}
          </div>
       </div>
    </div>
  );

  const renderEvolution = () => {
    if (!pet) return null;
    
    return (
      <div className="h-full flex flex-col space-y-6">
         <header className="flex items-center justify-between border-b-2 border-black/5 pb-2 shrink-0">
            <div className="flex items-center gap-2">
              <div className="text-[14px] font-black text-pen-blue truncate max-w-[150px]">
                {pet.name}
              </div>
            </div>
            <div className="text-[10px] font-black text-pen-blue/30 italic">
               {pet.level >= MAX_LEVEL ? "Абсолютная Форма" : (isMajorEvolution ? "Великая трансформация" : "Стабильный рост")}
            </div>
         </header>

         <div className="flex-1 flex flex-col items-center justify-center space-y-8 bg-white/5 rounded-sm p-4 border border-black/5">
            <div className="relative group">
               <div className="absolute inset-0 bg-pen-blue/5 rounded-full blur-3xl group-hover:bg-pen-blue/10 transition-colors" />
               <GitBranch className={cn(
                 "h-16 w-16 text-pen-blue/20 relative z-10 transition-transform duration-700",
                 evolving && "rotate-180 scale-75"
               )} />
               {evolving && (
                 <motion.div 
                   animate={{ rotate: 360 }}
                   transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                   className="absolute inset-0 border-2 border-dashed border-pen-blue/20 rounded-full"
                 />
               )}
            </div>

            <div className="text-center space-y-4 max-w-[240px]">
               <div className="space-y-1">
                  <h3 className="text-xl font-black text-pen-blue italic tracking-tighter whitespace-nowrap">
                    {pet.level >= MAX_LEVEL ? "Развитие завершено" : (evolving ? "Идет слияние..." : (isMajorEvolution ? "Готов к Возвышению" : "Накоплен опыт"))}
                  </h3>
                  <p className="text-[10px] font-black text-pen-blue/40 leading-tight">
                    {pet.level >= MAX_LEVEL 
                      ? "Этот питомец раскрыл весь свой потенциал и полностью эволюционировал."
                      : (isMajorEvolution 
                      ? "Сущность достигла предела текущей оболочки" 
                      : (canLevelUp ? "Достаточно опыта для укрепления формы" : "Продолжайте тренировки для роста"))}
                  </p>
               </div>

               {pet.level < MAX_LEVEL && isMajorEvolution && (
                 <div className="flex flex-col gap-3 pt-4">
                    <NeonButton 
                      onClick={handleLevelUp}
                      disabled={evolving}
                      className={cn(
                        "w-fit mx-auto px-8 py-3 text-[20px] font-black tracking-wider",
                        "bg-pen-red text-white shadow-xl animate-pulse"
                      )}
                    >
                      {evolving ? "Трансмутация..." : "Возвыситься"}
                    </NeonButton>
                 </div>
               )}
            </div>

            {!isMajorEvolution && !canLevelUp && pet.level < MAX_LEVEL && (
              <div className="flex items-center gap-2 px-4 py-2 bg-black/5 rounded-full mt-4">
                 <AlertCircle className="h-3 w-3 text-pen-blue/40" />
                 <span className="text-[9px] font-black text-pen-blue/40">Недостаточно опыта</span>
              </div>
            )}
            {!isMajorEvolution && canLevelUp && pet.level < MAX_LEVEL && (
              <div className="flex items-center gap-2 px-4 py-2 bg-black/5 rounded-full mt-4">
                 <Sparkles className="h-3 w-3 text-pen-blue/40" />
                 <span className="text-[9px] font-black text-pen-blue/40">Опыт накоплен, скоро вознесется</span>
              </div>
            )}
         </div>

         <div className="grid grid-cols-3 gap-2 opacity-20 shrink-0">
            {[1,2,3].map(i => (
              <div key={i} className="h-12 border-2 border-dashed border-pen-blue rounded-sm" />
            ))}
         </div>
      </div>
    );
  };

  if (evolutionResult) {
    return (
      <div className="fixed inset-0 z-[600] bg-white flex flex-col items-center justify-center p-6 sm:p-12 overflow-y-auto ledger-grid">
         <motion.div 
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
           className="w-full max-w-5xl space-y-12"
         >
            <div className="text-center space-y-4">
               <motion.div 
                 initial={{ y: 20, opacity: 0 }}
                 animate={{ y: 0, opacity: 1 }}
                 className="text-sticker-pink font-black text-xl tracking-[0.3em] italic"
               >
                 Эволюция завершена!
               </motion.div>
               <h2 className="text-6xl font-black text-pen-blue tracking-tighter">
                  {pet.name} <span className="text-pen-blue/20">→</span> {evolutionResult.name}
               </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
               <div className="space-y-4 text-center">
                  <div className="text-[10px] font-black text-pen-blue/30 tracking-widest">Прошлое</div>
                  <div className="relative aspect-[9/16] max-h-[400px] mx-auto border-2 border-dashed border-black/10 rounded-sm overflow-hidden grayscale opacity-50">
                     <img src={pet.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="font-black text-pen-blue/40">{pet.ageStage}</div>
               </div>

               <div className="space-y-4 text-center">
                  <div className="text-[10px] font-black text-sticker-pink tracking-widest animate-pulse">Новая Форма</div>
                  <motion.div 
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="relative aspect-[9/16] max-h-[400px] mx-auto border-4 border-pen-blue rounded-sm overflow-hidden shadow-[20px_20px_0_rgba(0,71,171,0.1)]"
                  >
                     <img src={evolutionResult.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </motion.div>
                  <div className="font-black text-pen-blue">{evolutionResult.ageStage}</div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <GlassCard color="blue" rotation={-1} className="p-6">
                  <h4 className="text-sm font-black text-pen-blue/40 mb-2">Новая Легенда</h4>
                  <p className="text-sm font-black text-pen-blue leading-relaxed italic">
                    "{evolutionResult.lore}"
                  </p>
               </GlassCard>
               <GlassCard color="pink" rotation={1} className="p-6">
                  <h4 className="text-sm font-black text-pen-blue/40 mb-2">Полученные Навыки</h4>
                  <div className="space-y-2">
                     {(evolutionResult.skills || []).slice(-2).map((s: any, i: number) => (
                       <div key={i} className="bg-white/50 p-2 border-2 border-black/5 rounded-sm">
                          <div className="text-xs font-black text-pen-blue">{s.name}</div>
                          <div className="text-[10px] font-black text-pen-blue/40">{s.description}</div>
                       </div>
                     ))}
                  </div>
               </GlassCard>
            </div>

            <div className="flex justify-center pt-8">
               <NeonButton onClick={handleFinishEvolution} className="px-12 py-6 text-xl bg-sticker-yellow">
                  Продолжить путь
               </NeonButton>
            </div>
         </motion.div>
      </div>
    );
  }

  if (side === 'left') {
    return (
      <div className="p-4 h-full flex flex-col ledger-grid">
         <header className="flex items-center justify-between border-b-2 border-black/5 pb-2 shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-pen-blue italic tracking-tighter flex items-center gap-2">
              <GitBranch className="h-4 w-4" />
              Статус: {pet.name}
            </h2>
          </div>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center p-4">
           {/* Force PetEvolutionCard to maintain original bounds with max-widths */}
           <div className="w-full max-w-[260px] mx-auto">
             <PetEvolutionCard 
               pet={pet}
               isSelected={true}
               isEvolving={evolving}
               onSelect={() => {}}
               onLevelUp={handleLevelUp}
             />
           </div>
        </div>
      </div>
    );
  }

  if (side === 'right') {
    return (
      <div className="h-full">
        <LogoAnimation />
      </div>
    );
  }

  return null;
};
