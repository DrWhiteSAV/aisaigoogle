import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserProgress, Pet, InventoryItem } from '../types';
import { GlassCard, NeonButton, HandwrittenText } from '../components/UI';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Compass, ArrowLeft, Trophy, Coins, Box } from 'lucide-react';
import { generateQuest, generateBonusItem } from '../services/aiService';
import { checkLevelUp, getBattleRewards } from '../lib/gameLogic';
import { HandDrawnTimer } from '../components/HandDrawnTimer';

export const Quest: React.FC<{ 
  progress: UserProgress; 
  setProgress: React.Dispatch<React.SetStateAction<UserProgress>>;
  toggleFlipLock?: (id: string, locked: boolean) => void;
}> = ({ progress, setProgress, toggleFlipLock }) => {
  const navigate = useNavigate();
  const componentId = React.useId();
  const lockId = `quest-${componentId}`;
  
  const location = useLocation();
  const [quest, setQuest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [questResult, setQuestResult] = useState<any>(null);
  const [bonusItem, setBonusItem] = useState<InventoryItem | null>(null);
  const pet = progress.pets.find(p => p.id === progress.activePetId);

  useEffect(() => {
    if (toggleFlipLock) {
      toggleFlipLock(lockId, loading || !!questResult);
    }
  }, [loading, questResult, toggleFlipLock, lockId]);

  useEffect(() => {
    if (!location.pathname.startsWith('/quest')) return;

    if (!pet) {
      navigate('/start');
      return;
    }

    if (progress.energy < 1) {
      navigate('/main');
      return;
    }

    const fetchQuest = async () => {
      try {
        const newQuest = await generateQuest(pet);
        setQuest(newQuest);
      } catch (error) {
        console.error("Failed to generate quest", error);
      }
    };

    fetchQuest();
    // Spend energy
    setProgress(prev => ({ ...prev, energy: prev.energy - 1 }));
  }, [pet, navigate]);

  const handleTimerComplete = () => {
    setLoading(false);
  };

  const handleQuestChoice = async (option: any) => {
    if (!pet) return;
    // Determine success/failure for reward calculation
    const isSuccess = Math.random() > 0.3; // 70% success rate for quests
    const { xp: calculatedXP, rubles: calculatedRubles } = getBattleRewards(pet.level, isSuccess, 1);

    // TZ Rewards Distribution:
    // 1. Nothing 50%
    // 2. 5 Energy 25%
    // 3. Material/Feed 20%
    // 4. Egg 5%
    const rewardRoll = Math.random();
    let droppedItem: InventoryItem | null = null;
    let energyBonus = 0;

    if (isSuccess) {
        if (rewardRoll < 0.25) {
            energyBonus = 5;
        } else if (rewardRoll < 0.45) {
             const types: ('material' | 'food')[] = ['material', 'food'];
             droppedItem = await generateBonusItem(types[Math.floor(Math.random() * 2)]);
        } else if (rewardRoll < 0.50) {
             droppedItem = await generateBonusItem('egg');
        }
    }
    
    if (droppedItem) {
        setBonusItem(droppedItem);
    }

    setQuestResult({ ...option, rewardXP: calculatedXP, rewardRubles: calculatedRubles });
    
    setProgress(prev => {
      const updatedPets = prev.pets.map(p => {
        if (p.id === pet!.id) {
          return checkLevelUp({ ...p, experience: p.experience + calculatedXP });
        }
        return p;
      });

      const updatedInventory = droppedItem 
        ? [...(Array.isArray(prev.inventory) ? prev.inventory : []), droppedItem]
        : (Array.isArray(prev.inventory) ? prev.inventory : []);

      return {
        ...prev,
        currency: prev.currency + calculatedRubles,
        pets: updatedPets,
        inventory: updatedInventory
      };
    });
  };

  if (!pet) {
    return (
      <div className="p-12 text-center h-full flex flex-col items-center justify-center font-bold text-pen-blue">
        Выберите питомца для квеста
      </div>
    );
  }

  return (
    <div className="p-4 max-w-2xl mx-auto min-h-screen pb-24 pt-6 flex flex-col items-center relative">
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
        <div className="text-xl font-black text-pen-blue/20 uppercase">Квест</div>
      </header>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div 
            key="loading"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full flex flex-col items-center justify-center flex-1 space-y-12"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-sticker-yellow/10 rounded-full animate-pulse" />
              <Compass className="h-32 w-32 text-pen-blue animate-spin-slow relative z-10" strokeWidth={1} />
            </div>
            
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-black text-pen-blue tracking-tighter">
                Исследование
              </h2>
              <p className="max-w-md mx-auto text-pen-blue/60 font-black">
                Твой спутник погружается в информационные слои реальности...
              </p>
            </div>

            <HandDrawnTimer duration={3} onComplete={handleTimerComplete} label="Синхронизация" />
          </motion.div>
        ) : !questResult ? (
          <motion.div 
            key="quest"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full space-y-6"
          >
            <div className="text-center space-y-2">
              <span className="inline-block px-3 py-0.5 bg-pen-red text-white text-[10px] font-black tracking-[0.2em] rotate-1">
                Событие
              </span>
              <h1 className="text-3xl font-black text-pen-blue tracking-tighter">
                {quest?.title}
              </h1>
            </div>

            <GlassCard color="white" className="p-6 border-2 border-black/10">
              <div className="text-lg text-pen-blue/80 leading-relaxed min-h-[80px]">
                <HandwrittenText text={quest?.scenario} speed={30} />
              </div>
            </GlassCard>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quest?.options?.map((opt: any, i: number) => {
                if (!opt) return null;
                const isSuccess = i % 2 === 0; // Simple pattern for UI preview
                const { xp: previewXP, rubles: previewRubles } = getBattleRewards(pet?.level || 1, isSuccess, 1);
                
                return (
                  <button 
                    key={i}
                    onClick={() => handleQuestChoice(opt)}
                    className="group relative"
                  >
                    <GlassCard 
                      color={i % 2 === 0 ? "blue" : "pink"} 
                      className="p-5 text-left h-full border-2 border-black/5 group-hover:border-pen-blue/30 group-hover:-translate-y-1 transition-all"
                    >
                      <div className="text-lg font-black mb-3 tracking-tight leading-tight">
                        {opt.text}
                      </div>
                      <div className="flex items-center gap-4 pt-3 border-t border-black/5">
                        <div className="flex items-center gap-1.5 text-[11px] font-black text-pen-blue/40">
                          <Coins className="h-3 w-3" /> +{previewRubles}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] font-black text-pen-blue/40">
                          <Trophy className="h-3 w-3" /> +{previewXP}
                        </div>
                      </div>
                    </GlassCard>
                  </button>
                );
              })}

              {(!quest || !quest.options) && (
                <div className="col-span-full p-8 text-center bg-white border border-black/5 italic text-pen-blue/40">
                  Не удалось загрузить данные квеста. Пожалуйста, попробуйте позже.
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full flex flex-col items-center space-y-8"
          >
            <div className="h-20 w-20 bg-sticker-yellow border-4 border-pen-blue flex items-center justify-center rotate-6">
               <Sparkles className="h-10 w-10 text-pen-blue" />
            </div>

            <div className="text-center space-y-4 max-w-lg">
              <h2 className="text-3xl font-black text-pen-blue tracking-tighter">
                Результат
              </h2>
              <GlassCard color="yellow" className="p-6 border-2 border-black/5 rotate-1">
                <div className="text-lg text-pen-blue/80 leading-snug min-h-[60px]">
                  <HandwrittenText text={questResult.outcome} speed={35} />
                </div>
              </GlassCard>
            </div>

            {bonusItem && (
               <motion.div 
                 initial={{ y: 20, opacity: 0 }}
                 animate={{ y: 0, opacity: 1 }}
                 className="w-full max-w-sm flex items-center gap-4 bg-pen-blue text-white p-4"
               >
                 <Box className="h-12 w-12" />
                 <div>
                   <div className="text-[10px] font-black text-white/60 italic">Находка!</div>
                   <div className="text-lg font-black italic">{bonusItem.name}</div>
                 </div>
               </motion.div>
            )}

            <div className="flex justify-center gap-4 w-full max-w-sm">
              <div className="flex-1 flex flex-col items-center bg-sticker-yellow border-2 border-black/10 p-4 rotate-2">
                <span className="text-2xl font-black text-pen-blue">+{questResult.rewardRubles}</span>
                <span className="text-[11px] font-black text-pen-blue/40">Рублей</span>
              </div>
              <div className="flex-1 flex flex-col items-center bg-sticker-pink border-2 border-black/10 p-4 -rotate-2">
                <span className="text-2xl font-black text-pen-blue">+{questResult.rewardXP}</span>
                <span className="text-[11px] font-black text-pen-blue/40">Опыта</span>
              </div>
            </div>

            <NeonButton onClick={() => navigate('/main')} className="px-8 py-4 text-xl font-black mt-6 bg-sticker-yellow">
               В Бестиарий
            </NeonButton>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

