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
  const [timer, setTimer] = useState(100);
  const [oldPet, setOldPet] = useState<Pet | null>(null);

  React.useEffect(() => {
    let interval: any;
    if (evolving && !evolutionResult && timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [evolving, evolutionResult, timer]);

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
    if (!pet) return;
    if (!isMajorEvolution && pet.level >= MAX_LEVEL) return;
    if (!isMajorEvolution && pet.experience < expNeeded) return;
    if (!isMajorEvolution && progress.sprouts < costPerLevel) return;

    setEvolving(true);
    setTimer(100);
    setEvolutionResult(null);
    setOldPet(pet);
    
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
          nameHistory: [...(pet.nameHistory || [pet.name]), evolutionData.newName],
        };
        
        setEvolutionResult(updatedPet);
      } else {
        const nextLevel = pet.level + 1;
        const nextStage = getPetRankByLevel(nextLevel);
        
        updatedPet = {
          ...pet,
          level: nextLevel,
          experience: pet.experience - expNeeded,
          statPoints: pet.statPoints + growthPerLevel,
        };
      }

      setProgress(prev => ({
        ...prev,
        sprouts: prev.sprouts - (isMajorEvolution ? 0 : costPerLevel),
        pets: prev.pets.map(p => p.id === pet.id ? updatedPet : p)
      }));
    } catch (e: any) {
      console.error("Evolution failed. Error details:", {
         error: e,
         message: e?.message,
         petId: pet.id,
         level: pet.level,
         isMajorEvolution
      });
      alert(`Ошибка вознесения: ${e?.message || String(e)}`);
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-3 h-full">
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

  // --- NEW FULL SCREEN LOADING MODAL ---
  if (evolving && !evolutionResult && isMajorEvolution) {
    return (
      <div className="fixed inset-0 z-[600] bg-transparent backdrop-blur-sm flex flex-col items-center justify-center p-6 sm:p-12">
         <div className="space-y-8 text-center max-w-md w-full">
            <h2 className="text-4xl font-black text-pen-blue italic tracking-tighter">Трансмутация...</h2>
            
            <div className="relative aspect-square max-w-[240px] mx-auto flex items-center justify-center">
               <div className="absolute inset-0 bg-pen-blue/10 rounded-full blur-3xl animate-pulse" />
               <motion.div 
                 animate={{ scale: [0.95, 1.05, 0.95], opacity: [0.7, 1, 0.7] }}
                 transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                 className="relative z-10"
               >
                 {pet?.image ? (
                    <div className="w-32 h-32 sm:w-48 sm:h-48 rounded overflow-hidden border-2 border-pen-blue/40 bg-transparent">
                      <img src={pet.image} className="w-full h-full object-cover mix-blend-multiply" referrerPolicy="no-referrer" />
                    </div>
                 ) : (
                    <GitBranch className="h-24 w-24 text-pen-blue/60 relative z-10" />
                 )}
               </motion.div>
               
               <motion.div 
                 animate={{ rotate: 360 }}
                 transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                 className="absolute inset-[-10%] flex items-center justify-center pointer-events-none opacity-60"
               >
                 <svg viewBox="0 0 200 200" className="w-full h-full text-pen-blue" style={{ transformOrigin: 'center' }}>
                   <circle cx="100" cy="100" r="95" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 8" />
                   <circle cx="100" cy="100" r="85" fill="none" stroke="currentColor" strokeWidth="0.5" />
                   {Array.from({ length: 8 }).map((_, i) => {
                     const angle = (i * 45) * Math.PI / 180;
                     const x1 = 100 + Math.cos(angle) * 85;
                     const y1 = 100 + Math.sin(angle) * 85;
                     const x2 = 100 + Math.cos(angle) * 95;
                     const y2 = 100 + Math.sin(angle) * 95;
                     return (
                       <g key={`rune-${i}`}>
                         <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth="1.5" />
                         <circle cx={x2} cy={y2} r="2" fill="currentColor" />
                       </g>
                     );
                   })}
                   <path d="M 100 5 L 105 15 L 95 15 Z" fill="currentColor" />
                   <path d="M 100 195 L 95 185 L 105 185 Z" fill="currentColor" />
                   <path d="M 5 100 L 15 95 L 15 105 Z" fill="currentColor" />
                   <path d="M 195 100 L 185 105 L 185 95 Z" fill="currentColor" />
                 </svg>
               </motion.div>
               <motion.div 
                 animate={{ rotate: -360 }}
                 transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
                 className="absolute inset-[0%] flex items-center justify-center pointer-events-none opacity-40 text-[#0047ab]"
               >
                 <svg viewBox="0 0 200 200" className="w-full h-full" style={{ transformOrigin: 'center' }}>
                   <circle cx="100" cy="100" r="75" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="1 10" />
                   <polygon points="100,20 175,145 25,145" fill="none" stroke="currentColor" strokeWidth="0.5" />
                   <polygon points="100,180 25,55 175,55" fill="none" stroke="currentColor" strokeWidth="0.5" />
                 </svg>
               </motion.div>
            </div>

            {timer > 0 ? (
              <GlassCard color="blue" rotation={-1} className="p-6">
                 <div className="text-sm font-black text-pen-blue/80 italic leading-relaxed">
                    Эфир формирует новую оболочку... ({timer}s)
                 </div>
                 <div className="text-[14px] font-black text-pen-blue mt-2 animate-pulse tracking-wide">
                   Ожидание Великой Эволюции
                 </div>
              </GlassCard>
            ) : (
              <div className="space-y-4">
                <GlassCard color="pink" rotation={1} className="p-4 bg-red-50">
                  <div className="text-sm font-black text-red-900 border-2 border-red-500/50 p-2 text-center bg-white">
                    Ответ от эфира задерживается...
                  </div>
                </GlassCard>
                <NeonButton onClick={() => {
                   setEvolving(false);
                   setEvolutionResult(null);
                }} color="blue" className="w-full text-center">
                  Отменить
                </NeonButton>
              </div>
            )}
         </div>
      </div>
    );
  }

  if (evolutionResult) {
    return (
      <div className="fixed inset-0 z-[600] bg-transparent backdrop-blur-sm flex flex-col items-center justify-center p-6 sm:p-12 overflow-y-auto">
          <motion.div 
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
           className="w-full max-w-5xl space-y-4"
         >
            <div className="text-center space-y-1 relative z-10 pt-1">
               <motion.div 
                 initial={{ y: 20, opacity: 0 }}
                 animate={{ y: 0, opacity: 1 }}
                 className="text-[#0047ab] font-black text-[18px] tracking-[0.2em] italic uppercase"
               >
                 Новая форма
               </motion.div>
            </div>

            <div className="flex flex-row justify-center gap-4 sm:gap-8 items-end max-w-3xl mx-auto">
               <div className="space-y-1 pb-2 text-center w-[120px] sm:w-[160px]">
                  <div className="text-[9px] font-black text-pen-blue/40 tracking-widest uppercase">Прошлое</div>
                  <div className="relative aspect-[9/16] w-full mx-auto border-2 border-dashed border-black/10 rounded-sm overflow-hidden grayscale opacity-50 bg-transparent">
                     <img src={oldPet?.image || (pet.imageHistory ? pet.imageHistory[pet.imageHistory.length - 2] : pet.image)} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="font-black text-pen-blue/60 text-[10px] sm:text-xs truncate">{oldPet?.name || pet.name}</div>
                  <div className="font-black text-pen-blue/40 text-[9px] sm:text-[10px] truncate">{oldPet?.ageStage || pet.ageStage}</div>
               </div>

               <div className="space-y-1 text-center w-[140px] sm:w-[180px]">
                  <motion.div 
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="relative aspect-[9/16] w-full mx-auto border-4 border-pen-blue rounded-sm overflow-hidden shadow-lg bg-transparent"
                  >
                     <img src={evolutionResult.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </motion.div>
                  <div className="font-black text-[#0047ab] text-[12px] sm:text-sm truncate drop-shadow-sm">{evolutionResult.name || evolutionResult.newName}</div>
                  <div className="font-black text-pen-blue/80 text-[10px] sm:text-xs truncate">{evolutionResult.ageStage}</div>
               </div>
            </div>

            <div className="w-[90%] mx-auto mt-4 px-1">
               <div className="text-center mb-1">
                 <h3 className="text-[14px] font-black text-[#0047ab]/40 uppercase tracking-wider">Новые Навыки</h3>
               </div>
               <div className="grid grid-cols-3 gap-2">
                 {(evolutionResult.skills || []).slice(-3).map((s: any, i: number) => {
                   const colors: ("white" | "yellow" | "blue" | "pink")[] = ["yellow", "blue", "pink", "white"];
                   const cardColor = colors[i % colors.length];
                   return (
                      <GlassCard 
                         key={i}
                         color={cardColor}
                         className={cn(
                           "border border-pen-blue/20 rounded-sm flex flex-col p-1 relative h-[65px] justify-end",
                           cardColor === 'yellow' ? 'bg-sticker-yellow/80 hover:bg-sticker-yellow' : 
                           cardColor === 'blue' ? 'bg-sticker-blue/80 hover:bg-sticker-blue' : 
                           cardColor === 'pink' ? 'bg-sticker-pink/80 hover:bg-sticker-pink' : 'bg-white hover:bg-gray-50'
                         )}
                      >
                         <div className="absolute left-1/2 -top-4 -translate-x-1/2 pointer-events-none z-0">
                            <div className="text-3xl object-contain z-0 relative drop-shadow-md">{s.emoji || '✨'}</div>
                         </div>
                         <div className="w-full flex flex-col items-center justify-end z-20 relative pb-0.5">
                            <div className="text-[12px] font-black text-[#0047ab] leading-[1.1] italic max-w-full px-0.5 whitespace-normal break-words drop-shadow-md relative z-20 text-center">{s.name}</div>
                            <div className="text-[10px] font-black bg-white/80 border border-[#0047ab]/10 relative z-20 whitespace-nowrap text-[#0047ab] rounded-full px-1 mt-0.5 leading-tight">
                              {s.value || Math.floor(Math.random() * 15) + 5}% • {s.type === 'passive' ? 'Пассив' : s.type === 'active_buff' ? 'Бафф' : 'Дебафф'}
                            </div>
                         </div>
                      </GlassCard>
                   );
                 })}
               </div>
            </div>

            <div className="w-[90%] mx-auto mt-4 px-1">
               <div className="text-center mb-1">
                 <h3 className="text-[14px] font-thin text-[#0047ab] tracking-wider">Новая Легенда</h3>
               </div>
               <p className="text-[14px] font-thin text-pen-blue leading-relaxed text-center w-full">
                 "{evolutionResult.lore}"
               </p>
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
