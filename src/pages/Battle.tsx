import React, { useState, useEffect, useMemo, useCallback, createContext, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Pet, UserProgress } from '../types';
import { NeonButton } from '../components/UI';
import { motion, AnimatePresence } from 'motion/react';
import { Sword, Shield, Zap, Coins, Flame, Droplets, Wind, Mountain, Star, Sparkles, Timer, Target, Heart, PenLine } from 'lucide-react';
import { cn } from '../lib/utils';
import { ElementSticker, AttributeSticker } from '../components/GameUI';
import { getElementAdvantageMultiplier, getAttributeDefenseMultiplier, calculateCP, getNextLevelReward, checkLevelUp } from '../lib/gameLogic';

const Typewriter: React.FC<{ text: string; delay?: number; className?: string }> = ({ text, delay = 30, className }) => {
  const [displayedText, setDisplayedText] = useState("");
  
  useEffect(() => {
    setDisplayedText("");
    let i = 0;
    const timer = setInterval(() => {
      setDisplayedText(text.slice(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(timer);
    }, delay);
    return () => clearInterval(timer);
  }, [text, delay]);

  return <span className={className}>{displayedText}</span>;
};

interface BattleState {
  enemy: Pet | null;
  battleLog: string[];
  hp: { player: number; enemy: number };
  rage: { player: number; enemy: number };
  turn: 'player' | 'enemy' | 'waiting';
  winner: 'player' | 'enemy' | null;
  rewards: { rubles: number; xp: number } | null;
  isEnemyHit: boolean;
  isPlayerHit: boolean;
  isPlayerAttacking: boolean;
  isEnemyAttacking: boolean;
  activeActionEffect: { type: 'attack' | 'ult' | 'regen', isPlayer: boolean } | null;
  showUlt: boolean;
  isPlayerRegen: boolean;
  isEnemyRegen: boolean;
  handleAction: (type: 'attack' | 'ult' | 'regen') => Promise<void>;
  playerPet: Pet | null;
}

const BattleContext = createContext<BattleState | null>(null);

const UltAnimation: React.FC<{ element: string }> = ({ element }) => {
  const getElementColor = () => {
    switch (element) {
      case 'fire': return 'bg-pen-red';
      case 'water': return 'bg-blue-600';
      case 'air': return 'bg-sky-400';
      case 'earth': return 'bg-[#5c4033]';
      default: return 'bg-sticker-yellow';
    }
  };

  const particles = Array.from({ length: 40 });

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[500] pointer-events-none flex items-center justify-center overflow-hidden bg-black/20"
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: [0, 0.8, 0], scale: [0, 2, 3] }}
        transition={{ duration: 1.5 }}
        className={cn("absolute w-[500px] h-[500px] rounded-full", getElementColor())}
      />

      {particles.map((_, i) => (
        <motion.div
          key={i}
          initial={{ x: 0, y: 0, scale: 0 }}
          animate={{ 
            x: (Math.random() - 0.5) * 1600, 
            y: (Math.random() - 0.5) * 1600, 
            scale: [0, Math.random() * 3 + 1, 0],
            rotate: Math.random() * 1080
          }}
          transition={{ duration: 1.8, ease: "easeOut", delay: Math.random() * 0.2 }}
          className={cn("absolute w-16 h-16 rounded-full flex items-center justify-center border-4 border-pen-blue", getElementColor())}
        >
          {element === 'fire' && <Flame className="w-10 h-10 text-white fill-current" />}
          {element === 'water' && <Droplets className="w-10 h-10 text-white fill-current" />}
          {element === 'air' && <Wind className="w-10 h-10 text-white fill-current" />}
          {element === 'earth' && <Mountain className="w-10 h-10 text-white fill-current" />}
        </motion.div>
      ))}

      <motion.div
        initial={{ scale: 0, rotate: -30, y: 100, opacity: 0 }}
        animate={{ scale: [0, 1.2, 1], rotate: [0, 10, 0], y: 0, opacity: 1 }}
        transition={{ type: "spring", damping: 12 }}
        className="relative z-10 bg-white border-[12px] border-pen-blue p-16"
      >
        <span className="text-8xl font-black text-pen-blue italic tracking-tighter block text-center min-w-[600px]">
          {element === 'fire' && "Пылающий гнев!"}
          {element === 'water' && "Водный поток!"}
          {element === 'air' && "Ураганный удар!"}
          {element === 'earth' && "Сейсмический разлом!"}
        </span>
      </motion.div>
    </motion.div>
  );
};

export const Battle: React.FC<{ 
  progress: UserProgress; 
  setProgress: React.Dispatch<React.SetStateAction<UserProgress>>;
  toggleFlipLock?: (id: string, locked: boolean) => void;
  manualId?: string;
  side?: 'left' | 'right';
}> = ({ progress, setProgress, toggleFlipLock, manualId, side = 'left' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const petIdFromUrl = manualId || progress.activePetId;
  const playerPet = useMemo(() => (progress.pets || []).find(p => p.id === petIdFromUrl), [progress.pets, petIdFromUrl]);

  return (
    <BattleProvider progress={progress} setProgress={setProgress} playerPet={playerPet || null} toggleFlipLock={toggleFlipLock}>
      <BattleContent side={side} />
    </BattleProvider>
  );
};

let globalBattleState: any = null;
let listeners: Array<() => void> = [];

const BattleProvider: React.FC<{ 
  children: React.ReactNode; 
  progress: UserProgress; 
  setProgress: React.Dispatch<React.SetStateAction<UserProgress>>;
  playerPet: Pet | null;
  toggleFlipLock?: (id: string, locked: boolean) => void;
}> = ({ children, progress, setProgress, playerPet, toggleFlipLock }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const componentId = React.useId();
  const lockId = `battle-${componentId}`;

  // Reset global state on unmount to handle page flipping as completion
  useEffect(() => {
    return () => {
      globalBattleState = null;
    };
  }, []);

  const [state, setState] = useState<Omit<BattleState, 'handleAction' | 'playerPet'>>(() => {
    if (globalBattleState && globalBattleState.petId === playerPet?.id) {
       return globalBattleState.state;
    }
    return {
      enemy: null,
      battleLog: ['Битва началась!'],
      hp: { player: 100, enemy: 100 },
      rage: { player: 0, enemy: 0 },
      turn: 'waiting',
      winner: null,
      rewards: null,
      isEnemyHit: false,
      isPlayerHit: false,
      isPlayerAttacking: false,
      isEnemyAttacking: false,
      activeActionEffect: null,
      showUlt: false,
      isPlayerRegen: false,
      isEnemyRegen: false,
    };
  });

  const syncState = useCallback((newStateOrFn: any) => {
    setState(prev => {
      const updates = typeof newStateOrFn === 'function' ? newStateOrFn(prev) : newStateOrFn;
      const next = { ...prev, ...updates };
      globalBattleState = { petId: playerPet?.id, state: next };
      return next;
    });
  }, [playerPet?.id]);

  useEffect(() => {
    if (globalBattleState && globalBattleState.petId === playerPet?.id && globalBattleState.state === state) {
      const timer = setTimeout(() => {
        listeners.forEach(l => l());
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [state, playerPet?.id]);

  useEffect(() => {
    const listener = () => {
      if (globalBattleState && globalBattleState.petId === playerPet?.id && globalBattleState.state !== state) {
        setState(globalBattleState.state);
      }
    };
    listeners.push(listener);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  }, [playerPet?.id, state]);

  // Remove the aggressive flip lock that breaks the book navigation
  /*
  useEffect(() => {
    if (toggleFlipLock) {
      toggleFlipLock(lockId, !!state.winner);
    }
  }, [state.winner, toggleFlipLock, lockId]);
  */

  const calculateDamageDetailed = useCallback((attacker: Pet, defender: Pet, isUlt: boolean = false) => {
    if (!attacker?.stats || !defender?.stats) return { total: 0, base: 0, defense: 0, magicBonus: 0 };
    const elemMult = getElementAdvantageMultiplier(attacker.element, defender.element);
    const attrMult = getAttributeDefenseMultiplier(attacker.attribute, defender.attribute);
    
    const attackPower = attacker.stats.attack || 10;
    const magicPower = attacker.stats.magic || 10;
    
    const baseDmg = attackPower * 1.5;
    const magicBonus = isUlt ? (magicPower * 2.5) : 0;
    const defenseValue = (defender.stats.defense || 5) * 0.5 * attrMult;
    
    let total = Math.max(5, Math.floor(((baseDmg + magicBonus) * elemMult) - defenseValue));
    
    return {
      total,
      base: Math.floor(baseDmg),
      defense: Math.floor(defenseValue),
      magicBonus: Math.floor(magicBonus)
    };
  }, []);

  const handleEndBattle = useCallback((playerWon: boolean, currentEnemy: Pet) => {
    if (!currentEnemy || !playerPet) return;
    const playerCP = calculateCP(playerPet);
    const enemyCP = calculateCP(currentEnemy);
    const cpRatio = enemyCP / (playerCP || 1); 
    const xpBase = getNextLevelReward(playerPet.level, playerWon);
    const xpAwarded = Math.floor(xpBase * cpRatio);
    const rublesAwarded = playerWon ? Math.floor(250 * cpRatio) : 30;

    syncState({ rewards: { rubles: rublesAwarded, xp: xpAwarded } });

    setProgress(prev => {
      const updatedPets = prev.pets.map(p => {
        if (p.id === playerPet.id) {
          const addedXp = playerWon ? xpAwarded : Math.floor(xpAwarded * 0.2);
          return checkLevelUp({ ...p, experience: p.experience + addedXp });
        }
        return p;
      });
      return {
        ...prev,
        currency: playerWon ? prev.currency + rublesAwarded : prev.currency,
        pets: updatedPets
      };
    });
  }, [playerPet, setProgress, syncState]);

  const performEnemyTurn = useCallback(async (currentEnemy: Pet, currentHp: any, currentRage: any) => {
    if (state.winner || !currentEnemy || !playerPet) return;

    // Turn Start: Card Enlarge
    syncState({ turn: 'enemy', isEnemyAttacking: true });
    await new Promise(r => setTimeout(r, 600));

    const enemyIsLow = currentHp.enemy < (currentEnemy.stats.health * 0.3);
    const shouldRegen = enemyIsLow && Math.random() > 0.4 && (currentEnemy.stats.regeneration > 0);
    const useUlt = !shouldRegen && currentRage.enemy >= 100;

    const actionType = shouldRegen ? 'regen' : (useUlt ? 'ult' : 'attack');
    
    if (shouldRegen) {
        const regen = currentEnemy.stats.regeneration || 20;
        const actualRegen = Math.min(regen, (currentEnemy.stats.health || 100) - currentHp.enemy);
        const newHp = { ...currentHp, enemy: currentHp.enemy + actualRegen };
        
        syncState((prev: any) => ({
          hp: newHp,
          battleLog: [`[Враг] ${currentEnemy.name} использует регенерацию: +${actualRegen} HP`, ...prev.battleLog],
        }));

        setTimeout(() => syncState({ turn: 'player' }), 100);
        return;
    }

    const { total, defense, magicBonus } = calculateDamageDetailed(currentEnemy, playerPet, useUlt);
    const abilityText = currentEnemy.abilities?.length > 0 ? ` (${currentEnemy.abilities[0]})` : "";
    const log = useUlt 
      ? `[Враг] ${currentEnemy.name}: Магический взрыв! Нанесено ${total} HP (Магия: +${magicBonus}, Броня: -${defense})${abilityText}`
      : `[Враг] ${currentEnemy.name} ударил на ${total} HP (Броня поглотила ${defense})${abilityText}`;

    const currentPlayerHp = Math.max(0, currentHp.player - total);
    const newRage = {
      enemy: useUlt ? 0 : Math.min(100, currentRage.enemy + 15),
      player: Math.min(100, currentRage.player + 18)
    };
    
    syncState((prev: any) => ({
      hp: { ...currentHp, player: currentPlayerHp },
      rage: newRage,
      battleLog: [log, ...prev.battleLog],
    }));
    
    if (currentPlayerHp > 0 && !state.winner) {
        syncState({ turn: 'player' });
    } else if (currentPlayerHp <= 0 && !state.winner) {
        console.log('[Battle] Enemy victory detected');
        handleEndBattle(false, currentEnemy);
        syncState({ winner: 'enemy' });
    }
  }, [state.winner, playerPet, calculateDamageDetailed, syncState, handleEndBattle]);

  const handleAction = async (type: 'attack' | 'ult' | 'regen') => {
    if (state.turn !== 'player' || state.winner || !state.enemy || !playerPet) return;

    console.log(`[Battle] Player action: ${type}`);
    syncState({ turn: 'waiting' });

    if (type === 'regen') {
      const regen = playerPet.stats.regeneration || 20;
      const actualRegen = Math.min(regen, (playerPet.stats.health || 100) - state.hp.player);
      const newHp = { ...state.hp, player: state.hp.player + actualRegen };
      syncState((prev: any) => ({
        hp: newHp,
        battleLog: [`${playerPet.name} использует исцеление: +${actualRegen} HP`, ...prev.battleLog],
      }));
      syncState({ turn: 'enemy' });
      return;
    }

    const { total, defense, magicBonus } = calculateDamageDetailed(playerPet, state.enemy, type === 'ult');
    const abilityText = playerPet.abilities?.length > 0 ? ` (${playerPet.abilities[0]})` : "";
    
    let log = '';
    if (type === 'attack') {
      log = `${playerPet.name} нанес ${total} HP (Защита врага: -${defense})${abilityText}`;
    } else if (type === 'ult') {
      log = `Ульта ${playerPet.name}: Нанесено ${total} HP (Магия: +${magicBonus}, Деф: -${defense})${abilityText}`;
    }

    const currentEnemyHp = Math.max(0, state.hp.enemy - total);
    const newRage = {
      player: type === 'ult' ? 0 : Math.min(100, state.rage.player + 15),
      enemy: Math.min(100, state.rage.enemy + 18)
    };
    
    syncState((prev: any) => ({
      hp: { ...prev.hp, enemy: currentEnemyHp },
      rage: newRage,
      battleLog: [log, ...prev.battleLog],
    }));

    const playerWon = currentEnemyHp <= 0;
    if (currentEnemyHp > 0 && !state.winner) {
        syncState({ turn: 'enemy' }); 
    } else if (playerWon && !state.winner) {
        console.log('[Battle] Player victory detected');
        handleEndBattle(true, state.enemy!);
        syncState({ winner: 'player' });
    }
  };

  const initStarted = React.useRef(false);

  // Trigger enemy turn when it's their turn
  useEffect(() => {
    if (state.turn === 'enemy' && !state.winner && state.enemy) {
      console.log('[Battle] Triggering Enemy Turn effect');
      const timer = setTimeout(() => {
        performEnemyTurn(state.enemy!, state.hp, state.rage);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [state.turn, state.winner]); // Only trigger when turn or winner changes

  useEffect(() => {
    if (!state.enemy && playerPet && location.pathname.startsWith('/battle')) {
      if (initStarted.current) return;
      
      if (globalBattleState && globalBattleState.petId === playerPet.id && globalBattleState.state.enemy) {
        setState(globalBattleState.state);
        return;
      }

      if (progress.energy < 1) {
        navigate('/main');
        return;
      }

      initStarted.current = true;
      console.log('[Battle] Initializing battle state');
      const cpModifier = 0.85 + (Math.random() * 0.35); 
      const mockEnemy: Pet = {
        ...playerPet,
        id: 'enemy-' + Date.now(),
        name: 'Дикий Страж',
        rarity: playerPet.rarity,
        element: ['water', 'fire', 'air', 'earth'][Math.floor(Math.random() * 4)] as any,
        attribute: ['light', 'dark', 'void', 'time'][Math.floor(Math.random() * 4)] as any,
        stats: {
          ...playerPet.stats,
          attack: Math.floor((playerPet.stats?.attack || 10) * cpModifier),
          defense: Math.floor((playerPet.stats?.defense || 10) * cpModifier),
          health: Math.floor((playerPet.stats?.health || 100) * cpModifier),
          maxHealth: Math.floor((playerPet.stats?.health || 100) * cpModifier),
          speed: Math.floor((playerPet.stats?.speed || 10) * cpModifier),
          magic: Math.floor((playerPet.stats?.magic || 10) * cpModifier),
          regeneration: Math.floor((playerPet.stats?.regeneration || 5) * cpModifier),
          luck: Math.floor((playerPet.stats?.luck || 5) * cpModifier),
          rage: 0,
          maxRage: 100
        },
        rank: playerPet.rank || 'B',
        potential: Math.floor((playerPet.potential || 80) * (0.9 + Math.random() * 0.2))
      };

      const initialHp = playerPet.stats?.health || 100;
      const initialTurn = (playerPet.stats?.speed || 0) >= (mockEnemy.stats?.speed || 0) ? 'player' : 'enemy';
      
      const newState = {
        enemy: mockEnemy,
        hp: { player: initialHp, enemy: mockEnemy.stats.health },
        turn: initialTurn,
        battleLog: [`${playerPet.name} против ${mockEnemy.name}!`],
      };

      syncState(newState);
      setProgress(prev => {
        console.log('[Battle] Consuming energy');
        return { ...prev, energy: prev.energy - 1 };
      });
    }
  }, [playerPet?.id, location.pathname, navigate, progress.energy, setProgress, syncState, state.enemy, playerPet]);

  const value = useMemo(() => ({ ...state, handleAction, playerPet }), [state, handleAction, playerPet]);

  return <BattleContext.Provider value={value}>{children}</BattleContext.Provider>;
};

const BattleCard = React.memo(({ pet, currentHp, maxHp, isPlayer, rage }: { pet: Pet, currentHp: number, maxHp: number, isPlayer: boolean, rage: { player: number, enemy: number } }) => {
    const cp = calculateCP(pet);

    return (
      <motion.div 
        initial={{ rotate: isPlayer ? -1.5 : 1.5 }}
        animate={{ rotate: isPlayer ? -1.5 : 1.5 }}
        transition={{ type: "spring", damping: 30, stiffness: 400 }}
        className={cn(
          "relative w-full aspect-[3/4.8] bg-white border-2 border-pen-blue flex flex-col select-none rounded-sm"
        )}
      >
        {/* Stat Icons - Positioned on the border away from center, moved up */}
        <div className={cn(
          "absolute bottom-16 flex flex-col gap-1 z-[60] px-2",
          isPlayer ? "-left-6 items-start" : "-right-6 items-end"
        )}>
          <div className={cn(
            "bg-sticker-yellow border-2 border-pen-blue px-2 py-0.5 rounded flex items-center gap-1 shadow-none",
            isPlayer ? "rotate-2" : "-rotate-2 flex-row-reverse"
          )}>
            <Target className="w-3 h-3 text-pen-blue" strokeWidth={2.5} />
            <span className="text-[10px] font-black text-pen-blue leading-none">{cp}</span>
          </div>
          <div className={cn(
            "bg-white border-2 border-pen-blue px-2 py-0.5 rounded flex items-center gap-1 shadow-none",
            isPlayer ? "rotate-1" : "-rotate-1 flex-row-reverse"
          )}>
            <Timer className="w-3 h-3 text-pen-blue" strokeWidth={3} />
            <span className="text-[10px] font-black text-pen-blue leading-none">{pet.stats?.regeneration}</span>
          </div>
          <div className={cn(
            "bg-white border-2 border-pen-blue px-2 py-0.5 rounded flex items-center gap-1 shadow-none",
            isPlayer ? "-rotate-1" : "rotate-1 flex-row-reverse"
          )}>
            <Flame className="w-3 h-3 text-pen-blue" strokeWidth={3} />
            <span className="text-[10px] font-black text-pen-blue leading-none">{pet.stats?.magic}</span>
          </div>
          <div className={cn(
            "bg-white border-2 border-pen-blue px-2 py-0.5 rounded flex items-center gap-1 shadow-none",
            isPlayer ? "rotate-2" : "-rotate-2 flex-row-reverse"
          )}>
            <Zap className="w-3 h-3 text-pen-blue" strokeWidth={3} />
            <span className="text-[10px] font-black text-pen-blue leading-none">{pet.stats?.speed}</span>
          </div>
          <div className={cn(
            "bg-white border-2 border-pen-blue px-2 py-0.5 rounded flex items-center gap-1 shadow-none",
            isPlayer ? "-rotate-2" : "rotate-2 flex-row-reverse"
          )}>
            <Shield className="w-3 h-3 text-pen-blue" strokeWidth={3} />
            <span className="text-[10px] font-black text-pen-blue leading-none">{pet.stats?.defense}</span>
          </div>
          <div className={cn(
            "bg-white border-2 border-pen-blue px-2 py-0.5 rounded flex items-center gap-1 shadow-none",
            isPlayer ? "rotate-1" : "-rotate-1 flex-row-reverse"
          )}>
            <Sword className="w-3 h-3 text-pen-blue" strokeWidth={3} />
            <span className="text-[10px] font-black text-pen-blue leading-none">{pet.stats?.attack}</span>
          </div>
          <div className={cn(
            "bg-white border-2 border-pen-red px-2 py-0.5 rounded flex items-center gap-1 shadow-none",
            isPlayer ? "-rotate-1" : "rotate-1 flex-row-reverse"
          )}>
            <Heart className="w-3 h-3 text-pen-red" />
            <span className="text-[10px] font-black text-pen-red leading-none">{Math.floor(currentHp)}/{Math.floor(maxHp)}</span>
          </div>
        </div>

        {/* Header with integrated Health Bar */}
        <div className="relative h-10 border-b-2 border-pen-blue/40 overflow-hidden bg-white">
          <motion.div 
            initial={false}
            animate={{ width: `${Math.max(0, (currentHp / maxHp) * 100)}%` }}
            transition={{ type: "tween", duration: 0.4, ease: "easeInOut" }}
            className={cn(
              "absolute inset-0 opacity-40",
              isPlayer ? "bg-pen-blue" : "bg-pen-red"
            )}
          />
          <div className="relative h-full flex justify-between items-center px-4">
            <span className="truncate pr-2 text-[14px] font-black italic tracking-wide text-pen-blue">{pet.name}</span>
            <span className="bg-pen-blue text-white px-2 py-0.5 rounded-sm font-black text-[12px]">Lv.{pet.level}</span>
          </div>
        </div>

        <div className="flex-1 relative overflow-hidden group">
          <img src={pet.image} className="w-full h-full object-cover pointer-events-none" alt={pet.name} />
          
          {/* Bottom Info Overlay - stickers match gallery */}
          <div className="absolute inset-x-0 bottom-2 px-2 flex justify-between items-end z-20 pointer-events-none">
             <div className="rotate-[-4deg] scale-[0.55] origin-bottom-left">
                <ElementSticker element={pet.element} className="bg-white/90" />
             </div>
             <div className="rotate-[4deg] scale-[0.55] origin-bottom-right">
                <AttributeSticker attribute={pet.attribute} className="bg-white/90" />
             </div>
          </div>
        </div>

        <div className="h-3 bg-black/10 w-full overflow-hidden border-t-2 border-black/5 relative">
           <motion.div 
             className="h-full bg-pen-red" 
             animate={{ width: `${Math.min(100, isPlayer ? rage.player : rage.enemy)}%` }} 
             transition={{ duration: 0.3 }}
           />
           <div className="absolute inset-0 flex items-center justify-center text-[8px] font-black text-white mix-blend-difference">
              {Math.floor(isPlayer ? rage.player : rage.enemy)}%
           </div>
        </div>
      </motion.div>
    );
});

const BattleContent: React.FC<{ side: 'left' | 'right' }> = ({ side }) => {
  const context = useContext(BattleContext);
  const navigate = useNavigate();

  if (!context || !context.enemy || !context.playerPet) {
    return (
      <div className="p-12 text-center h-full flex flex-col items-center justify-center font-bold text-pen-blue">
        {!context?.playerPet ? "Выберите питомца" : "Инициализация битвы..."}
      </div>
    );
  }

  const { playerPet, enemy, hp, rage, turn, winner, rewards, isEnemyHit, isPlayerHit, isPlayerAttacking, isEnemyAttacking, activeActionEffect, showUlt, isPlayerRegen, isEnemyRegen, handleAction, battleLog } = context;

  if (side === 'left') {
    return (
      <div className="h-full flex flex-col pt-4 pb-8 px-4 relative overflow-hidden ledger-grid">
        <AnimatePresence>
          {showUlt && <UltAnimation element={playerPet.element} />}
        </AnimatePresence>
        
        <div className="flex-1 relative mb-2 min-h-0">
          <AnimatePresence>
            {activeActionEffect && (
              <motion.div 
                 initial={{ scale: 0, opacity: 0 }}
                 animate={{ scale: 1, opacity: 1 }}
                 exit={{ scale: 2, opacity: 0 }}
                 className="absolute inset-x-0 top-1/2 -translate-y-1/2 z-[300] flex items-center justify-center pointer-events-none"
              >
                 <div className="bg-white border-[10px] border-pen-blue p-8 rounded-full overflow-hidden">
                    {activeActionEffect.type === 'attack' && <Sword className="w-32 h-32 text-pen-blue" strokeWidth={3} />}
                    {activeActionEffect.type === 'regen' && <Heart className="w-32 h-32 text-pen-red fill-current" />}
                    {activeActionEffect.type === 'ult' && <Zap className="w-32 h-32 text-sticker-yellow fill-current" strokeWidth={3} />}
                 </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="absolute top-2 left-[5%] w-[44.5%] flex justify-start z-30">
             <BattleCard pet={playerPet} currentHp={hp.player} maxHp={playerPet.stats?.health || 100} isPlayer={true} rage={rage} />
          </div>

          <div className="absolute bottom-2 right-[5%] w-[44.5%] flex justify-end z-10">
             <BattleCard pet={enemy} currentHp={hp.enemy} maxHp={enemy.stats?.health || 100} isPlayer={false} rage={rage} />
          </div>

          <div className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] flex flex-col gap-3 scale-[0.8]">
             <motion.div className="flex flex-col items-center">
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  disabled={turn !== 'player' || !!winner}
                  onClick={() => handleAction('attack')}
                  className={cn(
                    "w-20 h-20 flex items-center justify-center rounded-full border-[4px] border-pen-blue bg-transparent transition-all relative overflow-hidden",
                    turn === 'player' ? "cursor-pointer" : "opacity-30 grayscale cursor-not-allowed"
                  )}
                >
                  <motion.div 
                    animate={turn === 'player' ? { 
                      borderColor: ["#1c3198", "#ffc107", "#1c3198"],
                    } : {}} 
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="absolute inset-0 border-[4px] rounded-full pointer-events-none"
                  />
                  <div className="flex items-center justify-center bg-transparent rounded-full w-full h-full">
                    <Sword className="w-10 h-10 text-pen-blue" strokeWidth={3} />
                  </div>
                </motion.button>
                <div className="mt-1 bg-white/80 border border-pen-blue px-2 py-0 min-w-[70px] text-center rounded rotate-[-2deg]">
                  <span className="text-[10px] font-black text-pen-blue tracking-widest italic leading-tight">Атака</span>
                </div>
             </motion.div>

             <motion.div className="flex flex-col items-center">
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  disabled={turn !== 'player' || rage.player < 100 || !!winner}
                  onClick={() => handleAction('ult')}
                  className={cn(
                    "w-20 h-20 flex items-center justify-center rounded-full border-[4px] border-pen-blue bg-transparent transition-all relative overflow-hidden",
                    turn === 'player' && rage.player >= 100 ? "" : "opacity-30 grayscale cursor-not-allowed"
                  )}
                >
                  <motion.div
                    animate={rage.player >= 100 ? { 
                      borderColor: ["#ffc107", "#ff4444", "#ffc107"],
                      scale: [1, 1.05, 1]
                    } : {}}
                    transition={{ repeat: Infinity, duration: 0.8 }}
                    className={cn("absolute inset-0 border-[4px] rounded-full pointer-events-none", rage.player >= 100 ? "border-sticker-yellow" : "border-pen-blue")}
                  />
                  <div className={cn("flex items-center justify-center rounded-full w-full h-full uppercase", rage.player >= 100 ? "bg-sticker-yellow/10" : "bg-transparent")}>
                    <Zap className={cn("w-10 h-10 text-pen-blue", rage.player >= 100 && "fill-current")} strokeWidth={3} />
                  </div>
                </motion.button>
                <div className="mt-1 bg-white/80 border border-pen-blue px-2 py-0 min-w-[70px] text-center rounded rotate-[3deg]">
                  <span className="text-[10px] font-black text-pen-blue tracking-widest italic leading-tight">Ульта</span>
                </div>
             </motion.div>

             <motion.div className="flex flex-col items-center">
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  disabled={turn !== 'player' || !!winner}
                  onClick={() => handleAction('regen')}
                  className={cn(
                    "w-20 h-20 flex items-center justify-center rounded-full border-[4px] border-pen-blue bg-transparent transition-all relative overflow-hidden",
                    turn === 'player' ? "cursor-pointer" : "opacity-30 grayscale cursor-not-allowed"
                  )}
                >
                  <div className="flex items-center justify-center bg-transparent rounded-full w-full h-full">
                    <Heart className="w-10 h-10 text-pen-red fill-current" strokeWidth={3} />
                  </div>
                </motion.button>
                <div className="mt-1 bg-white/80 border border-pen-blue px-2 py-0 min-w-[70px] text-center rounded rotate-[-1deg]">
                  <span className="text-[10px] font-black text-pen-blue tracking-widest italic leading-tight">Реген</span>
                </div>
             </motion.div>
          </div>
        </div>

        <div className="flex flex-col bg-[#fdfaf3]/40 border border-pen-blue/20 p-2 overflow-hidden relative rounded-xl min-h-[140px] max-h-[140px]">
           <div className="text-[9px] font-black text-pen-blue/30 mb-1 tracking-[0.2em] italic border-b border-pen-blue/5 pb-0.5">Журнал боя:</div>
           <div className="flex flex-col gap-1 overflow-y-auto scrollbar-hide flex-1 pt-1 overflow-x-visible">
              {battleLog.map((log, i) => (
                <motion.div 
                   key={`${i}-${log.length}`}
                   initial={{ opacity: 0, x: -10 }}
                   animate={{ opacity: 1, x: 0 }}
                   className={cn("text-[12px] font-black italic py-2 leading-[1.4]", i === 0 ? "text-pen-blue" : "text-pen-blue/20")}
                >
                  <Typewriter text={log} delay={20} />
                </motion.div>
              ))}
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col justify-center px-10 relative bg-[#fdfaf3]/20">
      <AnimatePresence>
        {!winner ? (
          <motion.div 
            initial={{ opacity: 0, scale: 1 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="flex flex-col items-center gap-10 text-center pointer-events-none"
          >
             <div className="text-8xl font-black text-pen-blue/5 italic tracking-[0.4em] transform -rotate-6 select-none leading-none">
                Битва в разгаре
             </div>
             <motion.div 
               animate={{ rotate: [0, 360], scale: [1, 1.2, 1] }} 
               transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
             >
                <Sword className="w-48 h-48 text-pen-blue/5" />
             </motion.div>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ scale: 0.9, rotate: -2, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            className="w-full max-w-lg bg-transparent border-2 border-pen-blue p-10 flex flex-col items-center relative pointer-events-auto"
          >
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-sticker-yellow border-2 border-pen-blue px-8 py-2 rotate-[-3deg] z-10">
               <span className="text-3xl font-black text-pen-blue italic tracking-tighter">Итог</span>
            </div>

            <h2 className={cn(
              "text-4xl font-black italic tracking-tighter mb-10 transform -rotate-2 mt-4",
              winner === 'player' ? "text-pen-blue" : "text-pen-red"
            )}>
              {winner === 'player' ? "Победа!" : "Поражение"}
            </h2>

            <div className="w-full space-y-6 mb-10">
               <div className="flex justify-between items-center border-b-2 border-pen-blue/10 pb-3">
                  <span className="text-[18px] font-black text-pen-blue/60 italic tracking-widest">Добыча:</span>
                  <span className="text-[28px] font-black text-pen-blue italic">{rewards?.rubles || 0} ₽</span>
               </div>
               <div className="flex justify-between items-center border-b-2 border-pen-blue/10 pb-3">
                  <span className="text-[18px] font-black text-pen-blue/60 italic tracking-widest">Опыт:</span>
                  <span className="text-[28px] font-black text-pen-blue italic">+{rewards?.xp || 0} XP</span>
               </div>
            </div>

            <div className="w-full bg-pen-blue/5 border-2 border-pen-blue/20 p-8 rounded-2xl mb-10 rotate-[1deg]">
               <span className="text-[14px] font-black text-pen-blue/40 tracking-[0.2em] block mb-3">Анализ битвы:</span>
               <p className="text-[22px] font-black text-pen-blue italic leading-[1.1]">
                  {winner === 'player' 
                    ? "Ваша стратегия и мощь питомца сокрушили оппонента. Вы достойны звания ветерана!"
                    : "Противник оказался хитрее. Но каждое поражение — это лишь шаг к будущей победе!"}
               </p>
            </div>

            <NeonButton 
              onClick={() => {
                 globalBattleState = null;
                 navigate(`/pet/${playerPet.id}`);
              }}
              className="w-full py-5 bg-sticker-yellow text-[28px] font-black text-pen-blue italic tracking-widest"
            >
              Завершить
            </NeonButton>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
