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
}> = ({ progress, setProgress, manualId, toggleFlipLock }) => {
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
  
  // Ritual is ready if rank code differs OR if we are at/past a threshold but lack the ritual skills
  // F (lvl 1-10) -> 2 skills. E (lvl 11-20) -> 4 skills. D (lvl 21-30) -> 6 skills.
  const rankIndex = ['F', 'E', 'D', 'C', 'B', 'A', 'S', 'EX', 'UX', 'Z'].indexOf(potentialRankCode);
  const expectedSkills = (rankIndex * 2) + 2;
  const currentSkillsCount = (pet.skills || []).length;

  const isMajorEvolution = potentialRankCode !== currentRankCode || (pet.level >= 11 && currentSkillsCount < expectedSkills);

  const handleLevelUp = async () => {
    if (pet.level >= MAX_LEVEL) return;
    if (pet.experience < expNeeded) return;
    if (progress.currency < costPerLevel && !isMajorEvolution) return; // Evolution might be free or have separate cost, let's keep it for now

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
          statPoints: pet.statPoints + growthPerLevel, // Evolution also counts as a level-up-like boost
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
        currency: prev.currency - (isMajorEvolution ? 0 : costPerLevel), // Evolution itself is a reward/ritual
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
                     {evolutionResult.skills.slice(-2).map((s, i) => (
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

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-12 pt-12 pb-32 min-h-screen relative">
       <header className="w-full flex items-center justify-between mb-8 border-b-2 border-black/5 pb-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/pet/' + pet.id)}
            className="p-2 hover:bg-black/5 rounded-full transition-colors flex items-center gap-2 font-black text-pen-blue"
          >
            <ArrowLeft className="h-5 w-5" />
            Назад
          </button>
          <div 
            className="text-2xl font-black text-pen-blue hover:opacity-70 cursor-pointer"
            onClick={() => navigate('/pet/' + pet.id)}
          >
            {pet.name}
          </div>
        </div>
        <div className="text-xl font-black text-pen-blue/20 uppercase">
           {isMajorEvolution ? "Великая Эволюция" : "Развитие"}
        </div>
      </header>

       <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* LEFT: Mini Pet Gallery */}
          <div className="lg:col-span-5 space-y-6">
             <div className="flex items-center justify-between px-2">
                <span className="text-[10px] font-black text-pen-blue/30 uppercase tracking-widest">Ваши Сущности</span>
             </div>
             
             <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
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
                        "group relative p-4 bg-white border-2 transition-all duration-300 cursor-pointer overflow-hidden",
                        p.id === id ? "border-pen-blue shadow-[8px_8px_0_rgba(0,71,171,0.1)]" : "border-black/5 hover:border-pen-blue/30 hover:scale-[1.01]"
                      )}
                    >
                       {pIsReady && (
                         <div className="absolute top-2 right-2 z-10">
                            <Sparkles className="h-3 w-3 text-pen-red animate-pulse" />
                         </div>
                       )}
                       
                       <div className="flex gap-4 items-center">
                          <div className="h-16 w-16 rounded-sm overflow-hidden border border-black/5 bg-white">
                             <img src={p.image} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                             <div className="text-xs font-black text-pen-blue truncate">{p.name}</div>
                             <div className="text-[10px] font-black text-pen-blue/40 uppercase">{p.ageStage}</div>
                             <div className="mt-1 h-1 w-full bg-black/5 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-pen-blue transition-all duration-500" 
                                  style={{ width: `${(p.experience / getExpNeeded(p.level)) * 100}%` }}
                                />
                             </div>
                          </div>
                          <div className="text-right">
                             <div className="text-[10px] font-black text-pen-blue/20">УР</div>
                             <div className="text-sm font-black text-pen-blue">{p.level}</div>
                          </div>
                       </div>
                    </div>
                  );
                })}
             </div>
          </div>

          {/* RIGHT: Evolution UI */}
          <div className="lg:col-span-7">
            <GlassCard color="white" className="p-6 sm:p-10 border-2 border-black/5 relative overflow-hidden group">
               {isMajorEvolution && (
                 <div className="absolute top-4 right-4 bg-pen-red text-white px-3 py-1 text-[10px] font-black uppercase tracking-widest rotate-12 animate-pulse z-20 shadow-lg">
                    К Ритуалу Готов
                 </div>
               )}
               
               <div className="relative z-10 space-y-8 sm:space-y-12">
                  <div className="text-center space-y-2">
                     <div className="text-[12px] font-black text-pen-blue/30">Стадия Развития</div>
                     <h2 className="text-3xl sm:text-5xl font-black text-pen-blue tracking-tighter leading-none">{pet.ageStage}</h2>
                     <div className="flex items-center justify-center gap-4 text-pen-blue/40 text-[10px] sm:text-[12px] font-black pt-2">
                        <span className="flex items-center gap-1.5"><Zap className="h-4 w-4" /> Ур. {pet.level}</span>
                        {!isMajorEvolution && (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-pen-blue/10" />
                            <span>Оп. {pet.experience}/{expNeeded}</span>
                          </>
                        )}
                     </div>
                  </div>

                  <div className="flex justify-center relative">
                     <div className="relative h-40 w-40 sm:h-56 sm:w-56 flex items-center justify-center">
                        <AnimatePresence>
                          {evolving && (
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1.2 }}
                              exit={{ opacity: 0, scale: 1.5 }}
                              className="absolute inset-0 bg-sticker-pink/20 rounded-full blur-3xl z-0"
                            />
                          )}
                        </AnimatePresence>

                        <div className={cn(
                          "absolute inset-0 rounded-full border-2 border-dashed border-pen-blue/10 animate-[spin_15s_linear_infinite]",
                          evolving ? "border-pen-red border-solid border-4 opacity-70 animate-[spin_1s_linear_infinite]" : ""
                        )} />
                        <div className={cn(
                          "absolute inset-6 rounded-full overflow-hidden border-2 border-black/5 bg-white shadow-inner transition-transform duration-700",
                          evolving ? "scale-90" : "group-hover:scale-105"
                        )}>
                           <img src={pet.image} className="h-full w-full object-cover group-hover:scale-110 transition-all duration-700" />
                        </div>
                        {evolving && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/40 z-20 rounded-full text-center p-4">
                             <Sparkles className="h-10 w-10 text-pen-red animate-spin" />
                             <span className="text-[12px] font-black text-pen-blue mt-2 uppercase tracking-tighter">Метаморфоза...</span>
                          </div>
                        )}
                     </div>
                  </div>

                  <div className="space-y-6 pt-4">
                     {!isMajorEvolution ? (
                       <>
                         <div className="text-center">
                            <div className="text-[12px] font-black text-pen-blue/30 mb-2">Стоимость перехода</div>
                            <div className="text-4xl font-black text-pen-blue">{costPerLevel} ₽</div>
                         </div>
                         <NeonButton 
                           onClick={handleLevelUp} 
                           disabled={evolving || !canLevelUp || progress.currency < costPerLevel}
                           className="w-full py-8 text-2xl font-black"
                         >
                           <TrendingUp className="h-6 w-6" />
                           <span>Повысить Уровень</span>
                         </NeonButton>
                       </>
                     ) : (
                       <NeonButton 
                         onClick={handleLevelUp} 
                         disabled={evolving}
                         className="w-full py-10 text-3xl font-black bg-pen-red text-white border-none shadow-[0_10px_30px_rgba(196,30,58,0.3)] hover:scale-[1.02]"
                       >
                         <Sparkles className="h-8 w-8" />
                         <span>НАЧАТЬ ЭВОЛЮЦИЮ</span>
                       </NeonButton>
                     )}
                     
                     {!canLevelUp && !isMajorEvolution && pet.level < MAX_LEVEL && (
                        <p className="text-center text-pen-red/40 text-[10px] font-black">Недостаточно опыта для трансформации</p>
                     )}
                  </div>
               </div>
            </GlassCard>
          </div>
       </div>
    </div>
  );
};

// removed local cn
