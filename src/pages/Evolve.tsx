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
    <div className="space-y-6">
       <div className="flex items-center justify-between px-2">
          <span className="text-[10px] font-black text-pen-blue/30 uppercase tracking-widest">Ваши Сущности</span>
       </div>
       
       <div className="grid grid-cols-2 gap-3 overflow-y-auto pr-2 custom-scrollbar max-h-[85vh]">
          {progress.pets.map((p) => {
            const pRankCode = getPetRankByLevel(p.level).split(' ')[0];
            const pCurrentRankCode = p.ageStage.split(' ')[0];
            const pRankIndex = ['F', 'E', 'D', 'C', 'B', 'A', 'S', 'EX', 'UX', 'Z'].indexOf(pRankCode);
            const pExpectedSkills = (pRankIndex * 2) + 2;
            const pIsReady = pRankCode !== pCurrentRankCode || (p.level >= 11 && (p.skills || []).length < pExpectedSkills);
            
            return (
              <div 
                key={p.id}
                onClick={() => navigate(`/evolve/${p.id}`)}
                className={cn(
                  "group relative aspect-[9/16] bg-white border-2 transition-all duration-300 cursor-pointer overflow-visible shadow-none",
                  p.id === id ? "border-pen-blue" : "border-black/5 hover:border-pen-blue/20 scale-[0.98] hover:scale-100"
                )}
              >
                 <div className="absolute inset-0 overflow-hidden">
                    <img src={p.image} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                 </div>

                 {pIsReady && (
                   <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white border-2 border-pen-red rounded-full p-1.5 shadow-md scale-110">
                      <Sparkles className="h-4 w-4 text-pen-red animate-pulse" />
                   </div>
                 )}
                 
                 <div className="absolute bottom-2 left-2 right-2 z-10 pointer-events-none">
                    <div className="text-[10px] font-black text-white truncate drop-shadow-md">{p.name}</div>
                    <div className="text-[8px] font-black text-white/70 uppercase drop-shadow-md">{p.ageStage}</div>
                 </div>
              </div>
            );
          })}
       </div>
    </div>
  );

  const renderEvolution = () => (
    <div className="space-y-6 h-full flex flex-col">
       <header className="flex items-center justify-between border-b-2 border-black/5 pb-4 shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/pet/' + pet.id)}
            className="p-1 hover:bg-black/5 rounded-full transition-colors flex items-center gap-1 font-black text-pen-blue text-[12px]"
          >
            <ArrowLeft className="h-4 w-4" />
            Назад
          </button>
          <div className="text-xl font-black text-pen-blue truncate max-w-[150px] sm:max-w-none">
            {pet.name}
          </div>
        </div>
        <div className="text-[12px] font-black text-pen-blue/20 uppercase tracking-tighter">
           {isMajorEvolution ? "Великая Эволюция" : "Развитие"}
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center py-4">
        <div className="w-[70%] max-w-[320px] aspect-[9/16] relative group">
           {/* Main Card */}
           <div className={cn(
             "absolute inset-0 bg-white border-4 transition-all duration-700 overflow-hidden flex flex-col",
             evolving ? "border-pen-red scale-95 grayscale" : "border-black/5 hover:border-pen-blue/20"
           )}>
              {/* Image background */}
              <img src={pet.image} className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/40" />

              {/* Top Floating Content */}
              <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-20">
                 <div className="bg-white/95 backdrop-blur-sm px-3 py-1 border-2 border-black -mt-2 -ml-2 rotate-[-2deg] shadow-[4px_4px_0_rgba(0,0,0,0.1)]">
                    <div className="text-lg font-black text-pen-blue tracking-tighter leading-none">{pet.ageStage}</div>
                    <div className="text-[7px] font-black text-pen-blue/40 uppercase tracking-widest">Текущий Ранг</div>
                 </div>

                 {isMajorEvolution && (
                   <div className="bg-pen-red text-white px-3 py-1 text-[8px] font-black uppercase tracking-widest rotate-3 animate-pulse shadow-lg -mr-2 -mt-2 border-2 border-white/20">
                      К Ритуалу Готов
                   </div>
                 )}
              </div>

              {/* Evolution Animation Overlays */}
              <AnimatePresence>
                {evolving && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-white/40 backdrop-blur-[2px] z-30 flex flex-col items-center justify-center p-6 text-center"
                  >
                     <motion.div
                       animate={{ 
                         rotate: 360,
                         scale: [1, 1.2, 1]
                       }}
                       transition={{ repeat: Infinity, duration: 2 }}
                     >
                       <Sparkles className="h-16 w-16 text-pen-red" />
                     </motion.div>
                     <div className="mt-4 text-xl font-black text-pen-blue uppercase italic tracking-tighter">Метаморфоза...</div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Bottom Info & Stats */}
              <div className="absolute bottom-0 left-0 right-0 p-5 space-y-4 z-20 bg-gradient-to-t from-black via-black/60 to-transparent pt-12">
                 <div className="flex items-center justify-between text-white border-b border-white/10 pb-2">
                    <div className="flex items-center gap-2">
                       <Zap className="h-4 w-4 text-sticker-yellow" />
                       <span className="text-xs font-black">УР. {pet.level}</span>
                    </div>
                    {!isMajorEvolution && (
                       <div className="text-[9px] font-black opacity-60">
                          {pet.experience}/{expNeeded} EXP
                       </div>
                    )}
                 </div>

                 {!isMajorEvolution && (
                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                       <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: `${(pet.experience / expNeeded) * 100}%` }}
                         className="h-full bg-pen-blue shadow-[0_0_10px_rgba(0,71,171,0.5)]" 
                       />
                    </div>
                 )}

                 <div className="pt-2">
                    {!isMajorEvolution ? (
                      <div className="space-y-3">
                         <div className="flex justify-between items-end">
                            <span className="text-[8px] text-white/40 font-black uppercase tracking-widest">Протокол Перехода</span>
                            <span className="text-xl font-black text-white tracking-tighter">{costPerLevel} ₽</span>
                         </div>
                         <NeonButton 
                           onClick={handleLevelUp} 
                           disabled={evolving || !canLevelUp || progress.currency < costPerLevel}
                           className="w-full py-4 text-sm font-black bg-white text-pen-blue border-none shadow-xl hover:scale-105 active:scale-95 transition-all"
                         >
                           <span>ПОВЫСИТЬ ПРЕДЕЛ</span>
                         </NeonButton>
                      </div>
                    ) : (
                      <NeonButton 
                        onClick={handleLevelUp} 
                        disabled={evolving}
                        className="w-full py-6 text-xl font-black bg-pen-red text-white border-none shadow-[0_10px_30px_rgba(196,30,58,0.5)] animate-bounce-subtle hover:brightness-110"
                      >
                        <Sparkles className="h-6 w-6 mr-2" />
                        <span>ВОЗВЫСИТЬСЯ</span>
                      </NeonButton>
                    )}
                 </div>
              </div>
           </div>

           {/* Corner Accents */}
           <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-pen-blue/40 z-30" />
           <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-pen-blue/40 z-30" />
        </div>
      </div>

      {!canLevelUp && !isMajorEvolution && pet.level < MAX_LEVEL && (
         <p className="text-center text-pen-red/40 text-[9px] font-black uppercase tracking-widest shrink-0">Недостаточно резонанса для трансформации</p>
      )}
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
                 className="text-sticker-pink font-black text-xl tracking-[0.3em] uppercase italic"
               >
                 Эволюция Завершена!
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
                  Продолжить Путь
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
