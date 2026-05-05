import React, { useState } from 'react';
import { cn } from '../lib/utils';
import { Pet, UserProgress } from '../types';
import { GlassCard, NeonButton, HandwrittenText } from '../components/UI';
import { motion, AnimatePresence } from 'motion/react';
import { GitBranch, Zap, Sparkles, AlertCircle, TrendingUp, FlaskConical, Plus, Info, ArrowLeft } from 'lucide-react';
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
}> = ({ progress, setProgress, manualId, toggleFlipLock, side }) => {
  const navigate = useNavigate();
  const componentId = React.useId();
  const lockId = `evolve-${componentId}`;
  
  const { id: paramsId } = useParams<{ id: string }>();
  const [evolving, setEvolving] = useState(false);
  const [evolutionResult, setEvolutionResult] = useState<Pet | null>(null);

  React.useEffect(() => {
    if (toggleFlipLock) {
      toggleFlipLock(lockId, evolving || !!evolutionResult);
    }
  }, [evolving, evolutionResult, toggleFlipLock, lockId]);
  
  const id = manualId || paramsId;
  const pet = progress.pets.find(p => p.id === id);

  if (!pet) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-screen text-center space-y-4">
        <h2 className="text-3xl font-black text-pen-blue">Сущность не найдена</h2>
        <NeonButton onClick={() => navigate('/main')}>Вернуться в Бестиарий</NeonButton>
      </div>
    );
  }

  const costPerLevel = Math.floor(pet.level * 500 * Math.pow(1.05, pet.level - 1));
  const expNeeded = getExpNeeded(pet.level);
  const canLevelUp = pet.experience >= expNeeded && pet.level < MAX_LEVEL;
  const growthPerLevel = RARITY_WEIGHTS[pet.rarity].growth;
  
  const potentialRank = getPetRankByLevel(pet.level);
  const currentRankCode = pet.ageStage.split(' ')[0];
  const potentialRankCode = potentialRank.split(' ')[0];
  
  const rankIndex = ['F', 'E', 'D', 'C', 'B', 'A', 'S', 'EX', 'UX', 'Z'].indexOf(potentialRankCode);
  const expectedSkills = (rankIndex * 2) + 2;
  const currentSkillsCount = (pet.skills || []).length;

  const isMajorEvolution = potentialRankCode !== currentRankCode || (pet.level >= 11 && currentSkillsCount < expectedSkills);

  const handleLevelUp = async () => {
    if (pet.level >= MAX_LEVEL) return;
    if (pet.experience < expNeeded) return;
    if (progress.currency < costPerLevel && !isMajorEvolution) return;

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
        currency: prev.currency - (isMajorEvolution ? 0 : costPerLevel),
        pets: prev.pets.map(p => p.id === pet.id ? updatedPet : p)
      }));
    } catch (e) {
      console.error("Evolution failed", e);
    } finally {
      if (!isMajorEvolution) {
        setEvolving(false);
      }
    }
  };

  const handleFinishEvolution = () => {
    setEvolving(false);
    setEvolutionResult(null);
    navigate(`/pet/${pet.id}`);
  };

  const renderGallery = () => (
    <div className="space-y-6 h-full flex flex-col">
       <header className="flex items-center justify-between border-b-2 border-black/5 pb-4 shrink-0">
        <div className="flex items-center gap-3">
          <NeonButton 
            onClick={() => navigate('/pet/' + pet.id)}
            className="text-[16px] px-4 py-1"
          >
            <ArrowLeft className="h-5 w-5" />
            Назад
          </NeonButton>
          <div 
             className="text-[16px] font-black text-pen-blue cursor-pointer hover:opacity-70 truncate max-w-[150px] sm:max-w-none"
             onClick={() => navigate('/pet/' + pet.id)}
          >
            {pet.name}
          </div>
        </div>
        <div className="text-[12px] font-black text-pen-blue/20 tracking-tighter">
           {isMajorEvolution ? "Великая эволюция" : "Развитие"}
        </div>
      </header>

       <div className="flex items-center justify-between px-2 pt-2">
          <span className="text-[10px] font-black text-pen-blue/30 tracking-widest">Ваши сущности</span>
       </div>
       
       <div className="grid grid-cols-2 gap-4 overflow-y-auto pr-2 custom-scrollbar flex-1">
          {progress.pets.map((p) => {
            const pRankCode = getPetRankByLevel(p.level).split(' ')[0];
            const pCurrentRankCode = p.ageStage.split(' ')[0];
            const pRankIndex = ['F', 'E', 'D', 'C', 'B', 'A', 'S', 'EX', 'UX', 'Z'].indexOf(pRankCode);
            const pExpectedSkills = (pRankIndex * 2) + 2;
            const pIsReady = pRankCode !== pCurrentRankCode || (p.level >= 11 && (p.skills || []).length < pExpectedSkills);
            
            const pCostPerLevel = Math.floor(p.level * 500 * Math.pow(1.05, p.level - 1));
            const pExpNeeded = getExpNeeded(p.level);
            const pCanLevelUp = p.experience >= pExpNeeded && p.level < MAX_LEVEL;
            const pIsMajor = pRankCode !== pCurrentRankCode || (p.level >= 11 && (p.skills || []).length < pExpectedSkills);
            const isSelected = p.id === id;
            const pRarityType = p.rarity.toLowerCase() as Rarity;
            const pRarityStyle = RARITY_STYLES[pRarityType] || RARITY_STYLES.normal;

            return (
              <div 
                key={p.id}
                onClick={() => navigate(`/evolve/${p.id}`)}
                className={cn(
                  "group relative aspect-[9/16] bg-white border-2 transition-all duration-300 cursor-pointer overflow-visible mb-8",
                  isSelected ? "scale-100" : "border-black/5 hover:scale-100 scale-[0.98]"
                )}
                style={isSelected ? { borderColor: pRarityStyle.color } : {}}
              >
                 <div className="absolute inset-0 overflow-hidden">
                    <img src={p.image} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent opacity-80" />
                 </div>

                 {/* Potential & Level */}
                 <div className="absolute top-2 left-2 z-10 space-y-2">
                    <div 
                      className="px-2 py-0.5 text-[12px] font-black border-2 bg-white shadow-sm"
                      style={{ 
                        borderColor: pRarityStyle.color,
                        color: pRarityStyle.color
                      }}
                    >
                      {RARITY_LABELS[pRarityType]}
                    </div>
                    <div className="text-[16px] font-black text-pen-blue bg-transparent px-0 drop-shadow-sm">
                       Ур. {p.level}
                    </div>
                 </div>
                 
                 <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-col gap-2">
                    <div className="pointer-events-none">
                      <div className="text-[16px] font-black text-pen-blue truncate drop-shadow-sm">{p.name}</div>
                      <div className="text-[16px] font-black text-pen-blue/80 tracking-tight drop-shadow-sm">{p.ageStage}</div>
                    </div>

                    {isSelected && (
                      <div className="pt-2 flex justify-center">
                         {pIsMajor ? (
                           <NeonButton 
                             onClick={(e) => { e.stopPropagation(); handleLevelUp(); }}
                             disabled={evolving}
                             className="px-6 py-2 bg-pen-red text-white text-[16px] font-black scale-105 shadow-[0_5px_15px_rgba(196,30,58,0.4)] animate-pulse"
                           >
                             Возвыситься
                           </NeonButton>
                         ) : (
                           <NeonButton 
                             onClick={(e) => { e.stopPropagation(); handleLevelUp(); }}
                             disabled={evolving || !pCanLevelUp || progress.currency < pCostPerLevel}
                             className="px-6 py-2 bg-pen-blue text-white text-[16px] font-black shadow-[0_5px_15px_rgba(0,71,171,0.2)]"
                           >
                             Повысить уровень
                           </NeonButton>
                         )}
                      </div>
                    )}
                 </div>
              </div>
            );
          })}
       </div>
    </div>
  );

  const renderEvolution = () => (
    <div className="h-full flex flex-col items-center justify-center space-y-4">
       <div className="relative">
          <div className="absolute inset-0 bg-pen-blue/5 rounded-full blur-3xl animate-pulse" />
          <GitBranch className="h-20 w-20 text-pen-blue/10 relative z-10" />
       </div>
       <div className="text-center space-y-2">
          <h3 className="text-xl font-black text-pen-blue/30 italic">Ожидание эволюции</h3>
          <p className="text-xs font-black text-pen-blue/10 max-w-[200px] mx-auto">
             Выберите сущность из списка слева для проведения трансформации
          </p>
       </div>
       
       <div className="pt-8 grid grid-cols-3 gap-2 opacity-10">
          {[1,2,3].map(i => (
            <div key={i} className="h-10 w-10 border-2 border-dashed border-pen-blue rounded-sm" />
          ))}
       </div>
    </div>
  );

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
                  <div className="text-[10px] font-black text-pen-blue/30 uppercase tracking-widest">Прошлое</div>
                  <div className="relative aspect-[9/16] max-h-[400px] mx-auto border-2 border-dashed border-black/10 rounded-sm overflow-hidden grayscale opacity-50">
                     <img src={pet.image} className="w-full h-full object-cover" />
                  </div>
                  <div className="font-black text-pen-blue/40">{pet.ageStage}</div>
               </div>

               <div className="space-y-4 text-center">
                  <div className="text-[10px] font-black text-sticker-pink uppercase tracking-widest animate-pulse">Новая Форма</div>
                  <motion.div 
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="relative aspect-[9/16] max-h-[400px] mx-auto border-4 border-pen-blue rounded-sm overflow-hidden shadow-[20px_20px_0_rgba(0,71,171,0.1)]"
                  >
                     <img src={evolutionResult.image} className="w-full h-full object-cover" />
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
    return <div className="p-4 sm:p-2">{renderGallery()}</div>;
  }

  if (side === 'right') {
    return <div className="p-4 sm:p-2">{renderEvolution()}</div>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-12 pt-12 pb-32 min-h-screen relative">
       <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-5 hidden lg:block">
            {renderGallery()}
          </div>
          <div className="lg:col-span-7">
            {renderEvolution()}
          </div>
       </div>
    </div>
  );
};
