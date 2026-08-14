import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserProgress, Pet, InventoryItem, UserProfile, PetStats } from '../types';
import { GlassCard, NeonButton, HandwrittenText, ItemIcon } from '../components/UI';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Compass, ArrowLeft, Trophy, Sprout, Box } from 'lucide-react';
import { QuestTree, QuestNode, generateQuest, generateQuestBonusItem, preRollQuestReward } from '../services/aiService';
import { checkLevelUp, getQuestRewards } from '../lib/gameLogic';
import { HandDrawnTimer } from '../components/HandDrawnTimer';

type QuestStage = 'INTRO' | 'LOADING' | 'SCENE' | 'CHOICE_FEEDBACK' | 'RESULT' | 'ERROR';

export const Quest: React.FC<{ 
  progress: UserProgress; 
  setProgress: React.Dispatch<React.SetStateAction<UserProgress>>;
  toggleFlipLock?: (id: string, locked: boolean) => void;
  profile: UserProfile;
}> = ({ progress, setProgress, toggleFlipLock, profile }) => {
  const navigate = useNavigate();
  const componentId = React.useId();
  const lockId = `quest-${componentId}`;
  
  const location = useLocation();
  const [stage, setStage] = useState<QuestStage>('INTRO');
  const [questTree, setQuestTree] = useState<QuestTree | null>(null);
  const [currentSceneId, setCurrentSceneId] = useState<string>('root');
  const [correctCount, setCorrectCount] = useState(0);
  const [lastChoice, setLastChoice] = useState<{ text: string, outcome: string, isCorrect: boolean, nextNodeId: string | null } | null>(null);
  const [bonusItem, setBonusItem] = useState<InventoryItem | null>(null);
  const [rewardData, setRewardData] = useState<{ xp: number, sprouts: number, isOverallSuccess: boolean } | null>(null);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const pet = progress.pets.find(p => p.id === progress.activePetId);

  // Reset quest state when navigating away
  useEffect(() => {
    const isQuestRoute = location.pathname.includes('/quest');
    if (!isQuestRoute) {
      resetQuest();
    }
  }, [location.pathname]);

  const resetQuest = () => {
    setStage('INTRO');
    setQuestTree(null);
    setCurrentSceneId('root');
    setCorrectCount(0);
    setLastChoice(null);
    setBonusItem(null);
    setRewardData(null);
    setSelectedItem(null);
  };

  useEffect(() => {
    const isLocked = stage === 'LOADING';
    if (toggleFlipLock) {
      toggleFlipLock(lockId, isLocked);
    }
    return () => {
      if (toggleFlipLock) {
        toggleFlipLock(lockId, false);
      }
    };
  }, [stage, toggleFlipLock, lockId]);

  const startQuestSearch = async () => {
    if (!pet) return;
    if (progress.energy < 10) {
      navigate('/main');
      return;
    }

    setStage('LOADING');
    setProgress(prev => ({ ...prev, energy: prev.energy - 10 }));

    try {
      const rewardInfo = preRollQuestReward(pet);
      const tree = await generateQuest(profile, pet, rewardInfo);
      
      if (tree) {
        setQuestTree(tree);
        setCurrentSceneId('root');
        setCorrectCount(0);
        setStage('SCENE');
        
        // If we pre-rolled a reward, generate the item data now in background
        if (rewardInfo) {
          generateQuestBonusItem(rewardInfo)
            .then(item => setBonusItem(item))
            .catch(err => console.error("Quest bonus item generation failed:", err));
        }
      } else {
        setStage('ERROR');
      }
    } catch (error) {
      console.error("Quest generation failed", error);
      setStage('ERROR');
    }
  };

  const handleHandleChoice = (option: any) => {
    setLastChoice(option);
    if (option.isCorrect) {
      setCorrectCount(prev => prev + 1);
    }
    setStage('CHOICE_FEEDBACK');
  };

  const handleNextScene = () => {
    if (!lastChoice) return;

    if (lastChoice.nextNodeId && questTree?.scenes[lastChoice.nextNodeId]) {
      setCurrentSceneId(lastChoice.nextNodeId);
      setStage('SCENE');
      setLastChoice(null);
    } else {
      // End of quest - calculate results
      const isOverallSuccess = correctCount >= 2;
      const { xp, sprouts } = getQuestRewards(pet!.level, isOverallSuccess);
      
      setRewardData({ xp, sprouts, isOverallSuccess });
      
      // Update progress
      setProgress(prev => {
        const finalBonus = isOverallSuccess && bonusItem ? bonusItem : null;
        
        const updatedPets = prev.pets.map(p => {
          if (p.id === pet!.id) {
            return checkLevelUp({ ...p, experience: p.experience + xp });
          }
          return p;
        });

        const updatedInventory = finalBonus 
          ? [...(Array.isArray(prev.inventory) ? prev.inventory : []), finalBonus]
          : (Array.isArray(prev.inventory) ? prev.inventory : []);

        return {
          ...prev,
          sprouts: prev.sprouts + sprouts,
          pets: updatedPets,
          inventory: updatedInventory,
          totalQuests: (prev.totalQuests || 0) + 1,
          successfulQuests: isOverallSuccess ? (prev.successfulQuests || 0) + 1 : (prev.successfulQuests || 0),
          failedQuests: !isOverallSuccess ? (prev.failedQuests || 0) + 1 : (prev.failedQuests || 0),
        };
      });

      setStage('RESULT');
    }
  };

  if (!pet) {
    return (
      <div className="p-12 text-center h-full flex flex-col items-center justify-center font-bold text-pen-blue">
        Выберите питомца для квеста
      </div>
    );
  }

  const currentScene = questTree?.scenes[currentSceneId];

  return (
    <div className="p-4 max-w-2xl mx-auto h-full flex flex-col items-center relative overflow-y-auto force-scrollbar">
      <header className="w-full flex items-center justify-between mb-8 border-b border-pen-blue/10 pb-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => stage === 'INTRO' ? navigate(-1) : resetQuest()}
            className="p-2 hover:bg-pen-blue/5 rounded-full transition-colors group flex items-center gap-2"
          >
            <ArrowLeft className="h-6 w-6 text-pen-blue group-hover:-translate-x-1 transition-transform" />
            <span className="font-hand text-lg text-pen-blue">Назад</span>
          </button>
          <div className="flex flex-col cursor-pointer" onClick={() => navigate('/pet/' + pet.id)}>
            <h1 className="text-2xl font-hand leading-none text-pen-blue">{pet.name}</h1>
            <span className="text-[10px] font-hand text-pen-blue/40 tracking-widest truncate">история</span>
          </div>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {stage === 'INTRO' && (
          <motion.div 
            key="intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="w-full flex flex-col items-center space-y-4"
          >
            <div className="w-60 aspect-[9/16] bg-white border border-pen-blue/40 shadow-sm relative overflow-hidden rotate-1 group">
                <img 
                  src={pet.image} 
                  className="w-full h-full object-cover bg-white transition-opacity duration-300" 
                  alt={pet.name} 
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-x-2 bottom-3 z-30">
                  <NeonButton onClick={startQuestSearch} className="w-full py-2 text-lg bg-sticker-yellow border border-pen-blue/40 shadow-sm hover:scale-[1.02] active:scale-95 transition-all font-hand">
                    Помчали
                  </NeonButton>
                </div>
                <div className="absolute inset-0 bg-pen-blue/5 pointer-events-none" />
            </div>
            <div className="text-center space-y-2 max-w-sm px-4">
              <h1 className="text-2xl font-hand text-pen-blue leading-tight">{pet.name} готов к приключениям</h1>
              <p className="text-pen-blue/60 font-hand text-base leading-snug">
                Впереди тебя ждет полноценная история. Твои решения определят исход приключения.
              </p>
            </div>
          </motion.div>
        )}

        {stage === 'LOADING' && (
          <motion.div 
            key="loading"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full flex flex-col items-center justify-center flex-1 space-y-8 py-10"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-sticker-yellow/20 rounded-full animate-ping" />
              <Compass className="h-40 w-40 text-pen-blue animate-spin-slow relative z-10" strokeWidth={1} />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-hand text-pen-blue">Плетем нити судьбы...</h2>
              <p className="max-w-xs mx-auto text-pen-blue/60 font-hand text-lg">Создаем уникальную историю для вас и вашего питомца.</p>
            </div>
            <HandDrawnTimer duration={30} onComplete={() => stage === 'LOADING' && !questTree && setStage('ERROR')} label="Загрузка истории" />
          </motion.div>
        )}

        {stage === 'SCENE' && currentScene && (
          <motion.div 
            key={currentSceneId}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full space-y-6 px-2"
          >
            <div className="text-center">
              <h1 className="text-2xl font-hand text-pen-blue mb-1">{questTree?.title}</h1>
              <div className="flex justify-center gap-1">
                {[0, 1, 2].map(i => (
                  <div key={i} className={`h-1 w-8 rounded-full ${i <= (currentSceneId === 'root' ? 0 : currentSceneId.startsWith('s2') ? 1 : 2) ? 'bg-pen-blue' : 'bg-pen-blue/10'}`} />
                ))}
              </div>
            </div>

            <GlassCard color="white" className="p-6 border border-pen-blue/30 bg-white/50 relative min-h-[160px]">
              <div className="text-xl text-pen-blue font-hand leading-relaxed">
                <HandwrittenText text={currentScene.scenario} speed={20} />
              </div>
            </GlassCard>

            <div className="grid grid-cols-1 gap-3 pt-2">
              {currentScene.options.map((opt: any, i: number) => (
                <button key={i} onClick={() => handleHandleChoice(opt)} className="w-full group">
                  <GlassCard color="blue" className="p-4 border border-pen-blue/20 hover:border-pen-blue/60 transition-all text-left">
                    <div className="text-lg font-hand text-pen-blue leading-tight tracking-tight opacity-40 mb-1">
                      выбор {i + 1}
                    </div>
                    <div className="text-xl font-hand text-pen-blue leading-tight">
                      {opt.text}
                    </div>
                  </GlassCard>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {stage === 'CHOICE_FEEDBACK' && lastChoice && (
          <motion.div 
            key="feedback"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full flex flex-col items-center space-y-6 pt-10"
          >
            <div className={`h-16 w-16 flex items-center justify-center rotate-3 border border-pen-blue/20 shadow-sm ${lastChoice.isCorrect ? 'bg-sticker-yellow text-pen-blue' : 'bg-sticker-pink text-pen-blue'}`}>
               {lastChoice.isCorrect ? <Sparkles className="h-8 w-8" /> : <Box className="h-8 w-8 opacity-40" />}
            </div>
            
            <div className="text-center space-y-4 max-w-sm">
              <h2 className="text-2xl font-hand text-pen-blue">
                {lastChoice.isCorrect ? 'Отличный выбор!' : 'Не совсем удачно...'}
              </h2>
              <GlassCard color={lastChoice.isCorrect ? "yellow" : "white"} className="p-6 border border-pen-blue/20 bg-white/60">
                <p className="text-xl font-hand text-pen-blue leading-relaxed">
                  <HandwrittenText text={lastChoice.outcome} speed={30} />
                </p>
              </GlassCard>
            </div>

            <NeonButton onClick={handleNextScene} className="px-12 py-3 text-xl bg-sticker-yellow border border-pen-blue/30 shadow-md">
              Далее
            </NeonButton>
          </motion.div>
        )}

        {stage === 'RESULT' && rewardData && (
          <motion.div 
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full flex flex-col items-center space-y-6 pt-4 px-4"
          >
            <div className={`h-16 w-16 flex items-center justify-center rotate-3 border-2 border-pen-blue shadow-lg ${rewardData.isOverallSuccess ? 'bg-sticker-yellow' : 'bg-sticker-pink'}`}>
               {rewardData.isOverallSuccess ? <Trophy className="h-8 w-8 text-pen-blue" /> : <Box className="h-8 w-8 text-pen-blue" />}
            </div>

            <div className="text-center space-y-2">
              <h1 className="text-3xl font-hand text-pen-blue">
                Приключение окончено
              </h1>
              <p className="text-xl font-hand text-pen-blue/60">
                Результат: {rewardData.isOverallSuccess ? 'Триумф' : 'Ценный опыт'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full max-w-[280px]">
              <div className="flex flex-col items-center bg-sticker-yellow border-2 border-pen-blue p-3 rotate-1 shadow-md">
                <span className="text-2xl font-hand text-pen-blue">+{rewardData.sprouts} 🌱</span>
                <span className="text-[10px] font-hand text-pen-blue/40 tracking-widest truncate">ростки</span>
              </div>
              <div className="flex flex-col items-center bg-sticker-pink border-2 border-pen-blue p-3 -rotate-1 shadow-md">
                <span className="text-2xl font-hand text-pen-blue">+{rewardData.xp} XP</span>
                <span className="text-[10px] font-hand text-pen-blue/40 tracking-widest truncate">опыт</span>
              </div>
            </div>

            {rewardData.isOverallSuccess && bonusItem && (
               <motion.div 
                 initial={{ y: 10, opacity: 0 }}
                 animate={{ y: 0, opacity: 1 }}
                 onClick={() => setSelectedItem(bonusItem)}
                 className="w-full max-w-[300px] flex items-center gap-4 bg-sticker-blue border-2 border-pen-blue -rotate-1 shadow-xl cursor-pointer hover:scale-[1.02] transition-transform p-4"
               >
                 <div className="h-12 w-12 bg-white/50 rounded flex items-center justify-center shrink-0 p-1">
                    <ItemIcon 
                      type={bonusItem.type} 
                      image={bonusItem.image} 
                      hue={bonusItem.hue}
                      fallbackEmoji={(bonusItem as any).fallbackEmoji}
                      className="w-full h-full" 
                    />
                 </div>
                 <div className="min-w-0">
                   <div className="text-lg font-hand text-pen-blue leading-none mb-1">Особая находка!</div>
                   <div className="text-xl font-hand text-pen-blue leading-tight truncate">{bonusItem.name}</div>
                 </div>
               </motion.div>
            )}

            <div className="flex flex-col w-full max-w-[200px] gap-3 pt-4">
              <NeonButton onClick={startQuestSearch} className="w-full py-2 text-xl bg-sticker-yellow border-2 border-pen-blue shadow-lg">
                Продолжить
              </NeonButton>
              <NeonButton onClick={() => navigate('/main')} className="w-full py-2 text-xl bg-white border-2 border-pen-blue/20">
                Домой
              </NeonButton>
            </div>
          </motion.div>
        )}

        {stage === 'ERROR' && (
          <motion.div key="error" className="w-full flex flex-col items-center justify-center space-y-8 py-20">
            <div className="text-8xl not-italic">🏜️</div>
            <h2 className="text-3xl font-hand text-pen-blue tracking-widest text-center">история оборвалась...</h2>
            <NeonButton onClick={resetQuest} className="px-12 py-3 text-xl bg-sticker-blue border-2 border-pen-blue">
              Вернуться
            </NeonButton>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedItem && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-md"
            onClick={() => setSelectedItem(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              className="w-full max-w-xs bg-[#f8fafc] border border-pen-blue/30 shadow-2xl relative overflow-hidden"
              style={{ backgroundImage: 'linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px)', backgroundSize: '16px 16px' }}
              onClick={e => e.stopPropagation()}
            >
              <div className="p-8 text-center space-y-6">
                <div className="h-24 w-24 bg-sticker-blue border border-pen-blue/20 mx-auto flex items-center justify-center rotate-3 shadow-xl p-2 bg-white/50">
                    <ItemIcon 
                      type={selectedItem.type} 
                      image={selectedItem.image} 
                      fallbackEmoji={(selectedItem as any).fallbackEmoji}
                      hue={(selectedItem as any).hue}
                      className="text-7xl"
                    />
                </div>
                <div className="space-y-2">
                  <div className="text-[16px] font-hand text-pen-blue/40 tracking-widest">находка!</div>
                  <h3 className="text-2xl font-hand text-pen-blue leading-tight">{selectedItem.name}</h3>
                  <div className="text-xs font-hand text-pen-blue/30 tracking-widest">
                    {selectedItem.type === 'artifact' ? 'артефакт' : selectedItem.type === 'skill' ? 'навык' : 'яйцо'}
                  </div>
                </div>
                <p className="text-xl font-hand text-pen-blue leading-tight italic">
                  {selectedItem.description}
                </p>
                {selectedItem.effect && (
                  <div className="p-3 bg-sticker-yellow/20 border border-pen-blue/10 rounded flex items-center justify-center gap-2">
                    <Sparkles className="h-4 w-4 text-pen-blue/20" />
                    <span className="text-lg font-hand text-pen-blue">+{selectedItem.effect.value} {selectedItem.effect.stat === 'attack' ? 'атака' : selectedItem.effect.stat}</span>
                  </div>
                )}
                <NeonButton onClick={() => setSelectedItem(null)} className="w-full py-2 bg-sticker-yellow border border-pen-blue/20 shadow-sm text-xl">
                  Понятно
                </NeonButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

