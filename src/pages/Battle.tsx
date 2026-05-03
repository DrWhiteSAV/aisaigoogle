import React, { useState, useEffect, useMemo, useCallback, createContext, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Pet, UserProgress } from '../types';
import { NeonButton } from '../components/UI';
import { motion, AnimatePresence } from 'motion/react';
import { Sword, Shield, Zap, Coins, Flame, Droplets, Wind, Mountain, Star, Sparkles, Timer, Target, Heart } from 'lucide-react';
import { cn } from '../lib/utils';
import { getElementAdvantageMultiplier, getAttributeDefenseMultiplier, calculateCP, getNextLevelReward, checkLevelUp } from '../lib/gameLogic';

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
  showUlt: boolean;
  isPlayerBlocking: boolean;
  isEnemyBlocking: boolean;
  handleAction: (type: 'attack' | 'ult' | 'block') => Promise<void>;
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
        className={cn("absolute w-[500px] h-[500px] rounded-full blur-[100px]", getElementColor())}
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
          className={cn("absolute w-16 h-16 rounded-full flex items-center justify-center shadow-2xl", getElementColor())}
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
        className="relative z-10 bg-white border-[12px] border-pen-blue p-16 shadow-[40px_40px_0px_0px_rgba(28,49,152,1)]"
      >
        <span className="text-8xl font-black text-pen-blue italic uppercase tracking-tighter block text-center min-w-[600px] drop-shadow-lg">
          {element === 'fire' && "ПЫЛАЮЩИЙ ГНЕВ!"}
          {element === 'water' && "ВОДНЫЙ ПОТОК!"}
          {element === 'air' && "УРАГАННЫЙ УДАР!"}
          {element === 'earth' && "СЕЙСМИЧЕСКИЙ РАЗЛОМ!"}
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
      showUlt: false,
      isPlayerBlocking: false,
      isEnemyBlocking: false,
    };
  });

  const syncState = useCallback((newState: Partial<Omit<BattleState, 'handleAction' | 'playerPet'>>) => {
    setState(prev => {
      const next = { ...prev, ...newState };
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

  useEffect(() => {
    if (toggleFlipLock) {
      toggleFlipLock(lockId, !!state.winner);
    }
  }, [state.winner, toggleFlipLock, lockId]);

  const calculateDamage = useCallback((attacker: Pet, defender: Pet, isUlt: boolean = false, targetIsBlocking: boolean = false) => {
    if (!attacker?.stats || !defender?.stats) return 0;
    const elemMult = getElementAdvantageMultiplier(attacker.element, defender.element);
    const attrMult = getAttributeDefenseMultiplier(attacker.attribute, defender.attribute);
    const baseDmg = isUlt ? ((attacker.stats.attack || 0) + (attacker.stats.magic || 0)) * 2.5 : (attacker.stats.attack || 0);
    let finalDmg = Math.max(1, (baseDmg * elemMult) - ((defender.stats.defense || 0) * attrMult));
    if (targetIsBlocking) finalDmg = Math.floor(finalDmg / 2.5);
    return Math.floor(finalDmg);
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

  const performEnemyTurn = useCallback(async (currentEnemy: Pet, currentHp: any, currentRage: any, currentIsPlayerBlocking: boolean) => {
    if (state.winner || !currentEnemy || !playerPet) return;

    const enemyIsLow = currentHp.enemy < (currentEnemy.stats.health * 0.3);
    const shouldBlock = enemyIsLow && Math.random() > 0.45;

    if (shouldBlock) {
      syncState({ isEnemyBlocking: true, battleLog: [`[Враг] ${currentEnemy.name} занял глухую оборону!`, ...state.battleLog] });
      setTimeout(() => syncState({ turn: 'player' }), 1000);
      return;
    }

    // Enemy Regeneration
    const regen = currentEnemy.stats?.regeneration || 0;
    if (regen > 0 && currentHp.enemy < (currentEnemy.stats?.health || 100)) {
      const actualRegen = Math.min(regen, (currentEnemy.stats?.health || 100) - currentHp.enemy);
      syncState({ 
        hp: { ...currentHp, enemy: currentHp.enemy + actualRegen },
        battleLog: [`[Враг] ${currentEnemy.name} восстанавливает +${actualRegen} HP`, ...state.battleLog]
      });
      await new Promise(r => setTimeout(r, 600));
    }

    const useUlt = currentRage.enemy >= 100;
    const hits = useUlt ? 1 : 1; // Simplified to 1 hit per turn as requested by "why attack 3 times"

    let currentPlayerHp = currentHp.player;
    let newRage = { ...currentRage };
    const damage = calculateDamage(currentEnemy, playerPet, useUlt, currentIsPlayerBlocking);
    
    // Add exact numbers to logs
    const log = useUlt 
      ? `[Враг] ${currentEnemy.name} ИСПОЛЬЗУЕТ ТЕХНИКУ: -${damage} HP!`
      : `[Враг] ${currentEnemy.name} наносит удар: -${damage} HP!`;

    currentPlayerHp = Math.max(0, currentPlayerHp - damage);
        newRage = {
          enemy: useUlt ? 0 : Math.min(100, newRage.enemy + 15),
          player: Math.min(100, newRage.player + 18)
        };
        
        syncState({ 
          hp: { ...currentHp, player: currentPlayerHp },
          rage: newRage,
          battleLog: [log, ...state.battleLog],
          isPlayerHit: true
        });
        
        setTimeout(() => syncState({ isPlayerHit: false }), 300);
        await new Promise(r => setTimeout(r, 600));

    syncState({ isPlayerBlocking: false });
    if (currentPlayerHp > 0 && !state.winner) {
        syncState({ turn: 'player' });
    } else if (currentPlayerHp <= 0) {
        syncState({ winner: 'enemy' });
        handleEndBattle(false, currentEnemy);
    }
  }, [state.winner, playerPet, calculateDamage, state.battleLog, syncState, handleEndBattle]);

  const handleAction = async (type: 'attack' | 'ult' | 'block') => {
    if (state.turn !== 'player' || state.winner || !state.enemy || !playerPet) return;

    syncState({ turn: 'waiting', isPlayerBlocking: false });

    // Regeneration logic at start of turn
    const regen = playerPet.stats?.regeneration || 0;
    if (regen > 0 && state.hp.player < (playerPet.stats?.health || 100)) {
      const actualRegen = Math.min(regen, (playerPet.stats?.health || 100) - state.hp.player);
      syncState({ 
        hp: { ...state.hp, player: state.hp.player + actualRegen },
        battleLog: [`${playerPet.name} восстанавливает +${actualRegen} HP`, ...state.battleLog]
      });
      await new Promise(r => setTimeout(r, 600));
    }

    if (type === 'block') {
      syncState({ isPlayerBlocking: true, battleLog: [`${playerPet.name} готовится отразить атаку (-60% урона)`, ...state.battleLog] });
      setTimeout(() => {
        syncState({ turn: 'enemy' });
        performEnemyTurn(state.enemy!, state.hp, state.rage, true);
      }, 1000);
      return;
    }

    let hits = 1;

    let currentEnemyHp = state.hp.enemy;
    let newRage = { ...state.rage };

    const damage = type === 'ult' 
        ? calculateDamage(playerPet, state.enemy, true, state.isEnemyBlocking)
        : calculateDamage(playerPet, state.enemy, false, state.isEnemyBlocking);
    
    let log = '';
    if (type === 'attack') {
      log = `${playerPet.name} атакует: -${damage} HP!`;
    } else if (type === 'ult') {
      log = `КОМБО-УДАР: ${playerPet.name} наносит -${damage} HP!`;
      newRage.player = 0;
      syncState({ showUlt: true });
      setTimeout(() => syncState({ showUlt: false }), 2000);
      await new Promise(r => setTimeout(r, 1000));
    } else if (type === 'block') {
      // Logic handled above but for completion
    }

    if (damage > 0 || type === 'attack') {
      currentEnemyHp = Math.max(0, currentEnemyHp - damage);
      newRage = {
        player: type === 'ult' ? 0 : Math.min(100, newRage.player + 15),
        enemy: Math.min(100, newRage.enemy + 18)
      };
      syncState({ 
        hp: { ...state.hp, enemy: currentEnemyHp },
        rage: newRage,
        battleLog: [log, ...state.battleLog],
        isEnemyHit: true
      });
      setTimeout(() => syncState({ isEnemyHit: false }), 300);
    }
    
    await new Promise(r => setTimeout(r, 600));

    syncState({ isEnemyBlocking: false });

    if (currentEnemyHp > 0 && !state.winner) {
        syncState({ turn: 'enemy' });
        setTimeout(() => performEnemyTurn(state.enemy!, { ...state.hp, enemy: currentEnemyHp }, newRage, false), 800);
    } else if (currentEnemyHp <= 0) {
        syncState({ winner: 'player' });
        handleEndBattle(true, state.enemy);
    }
  };

  useEffect(() => {
    if (!state.enemy && playerPet && location.pathname.startsWith('/battle')) {
      if (globalBattleState && globalBattleState.petId === playerPet.id && globalBattleState.state.enemy) {
        setState(globalBattleState.state);
        return;
      }

      if (progress.energy < 1) {
        navigate('/main');
        return;
      }

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
      setProgress(prev => ({ ...prev, energy: prev.energy - 1 }));

      if (initialTurn === 'enemy') {
        setTimeout(() => performEnemyTurn(mockEnemy, { player: initialHp, enemy: mockEnemy.stats.health }, { player: 0, enemy: 0 }, false), 1500);
      }
    }
  }, [playerPet?.id, location.pathname, navigate, performEnemyTurn, progress.energy, setProgress, syncState, state.enemy, playerPet]);

  const value = useMemo(() => ({ ...state, handleAction, playerPet }), [state, handleAction, playerPet]);

  return <BattleContext.Provider value={value}>{children}</BattleContext.Provider>;
};

const BattleContent: React.FC<{ side: 'left' | 'right' }> = ({ side }) => {
  const context = useContext(BattleContext);
  const navigate = useNavigate();

  if (!context || !context.enemy || !context.playerPet) {
    return (
      <div className="p-12 text-center h-full flex flex-col items-center justify-center font-bold text-pen-blue">
        {!context?.playerPet ? "Выберите питомца" : "Инициализация..."}
      </div>
    );
  }

  const { playerPet, enemy, hp, rage, turn, winner, rewards, isEnemyHit, isPlayerHit, showUlt, isPlayerBlocking, isEnemyBlocking, handleAction, battleLog } = context;

  const BattleCard = ({ pet, currentHp, maxHp, isPlayer, isHit, isBlocking, isTop }: { pet: Pet, currentHp: number, maxHp: number, isPlayer: boolean, isHit?: boolean, isBlocking?: boolean, isTop?: boolean }) => {
    const cp = calculateCP(pet);
    
    const translateElement = (el: string) => {
      switch(el) {
        case 'fire': return 'ОГОНЬ';
        case 'water': return 'ВОДА';
        case 'air': return 'ВОЗДУХ';
        case 'earth': return 'ЗЕМЛЯ';
        default: return el.toUpperCase();
      }
    };

    const translateAttribute = (attr: string) => {
      switch(attr) {
        case 'light': return 'СВЕТ';
        case 'dark': return 'ТЬМА';
        case 'void': return 'ПУСТОТА';
        case 'time': return 'ВРЕМЯ';
        default: return attr.toUpperCase();
      }
    };

    return (
      <motion.div 
        animate={{ 
          scale: (isPlayer ? (turn === 'player' ? 0.85 : 0.8) : (turn === 'enemy' ? 0.85 : 0.8)),
          y: isHit ? [0, -10, 10, -5, 5, 0] : 0,
          zIndex: isTop ? 40 : 20,
          rotate: isPlayer ? -1.5 : 1.5
        }}
        className={cn(
          "relative w-[85%] aspect-[3/4.8] bg-white border-[5px] border-pen-blue shadow-2xl flex flex-col select-none",
          !isPlayer && "brightness-95"
        )}
      >
        {/* Header with integrated Health Bar */}
        <div className="relative h-10 border-b-[4px] border-pen-blue/40 overflow-hidden bg-white">
          <motion.div 
            initial={{ width: "100%" }}
            animate={{ width: `${(currentHp / maxHp) * 100}%` }}
            className={cn(
              "absolute inset-0 opacity-40",
              isPlayer ? "bg-pen-blue" : "bg-pen-red"
            )}
          />
          <div className="relative h-full flex justify-between items-center px-4">
            <span className="truncate pr-2 text-[16px] font-black italic tracking-wide text-pen-blue uppercase">{pet.name}</span>
            <span className="bg-pen-blue text-white px-2 py-0.5 rounded-sm font-black text-[12px] shadow-sm">LV.{pet.level}</span>
          </div>
        </div>

        <div className="flex-1 relative overflow-hidden group">
          <img src={pet.image} className="w-full h-full object-cover pointer-events-none" alt={pet.name} />
          
          {/* Bottom Info Overlay with distinct gradient */}
          <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-white via-white/80 to-transparent flex justify-between items-end z-10">
             <div className="flex flex-col">
                <span className="text-[10px] font-black text-pen-blue italic uppercase tracking-tighter opacity-70">Стихия</span>
                <span className="text-[14px] font-black text-pen-blue italic uppercase tracking-tighter">{translateElement(pet.element)}</span>
             </div>
             <div className="text-right flex flex-col">
                <span className="text-[10px] font-black text-pen-blue italic uppercase tracking-tighter opacity-70">Атрибут</span>
                <span className="text-[14px] font-black text-pen-blue italic uppercase tracking-tighter">{translateAttribute(pet.attribute)}</span>
             </div>
          </div>
          
          {isBlocking && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-pen-blue/40 flex items-center justify-center backdrop-blur-[1px] z-10"
            >
              <Shield className="w-20 h-20 text-white animate-pulse drop-shadow-2xl" />
            </motion.div>
          )}
          {isHit && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: [1, 0], scale: [0.8, 1.5] }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
            >
               <div className="w-full h-full bg-gradient-to-tr from-pen-red/60 via-sticker-yellow/40 to-transparent animate-pulse" />
            </motion.div>
          )}

          <div className="absolute top-2 right-2 flex flex-col gap-2 items-end pointer-events-none z-10">
             <div className="bg-white border-[3px] border-pen-blue px-2 py-0.5 rounded-sm shadow-md">
                <span className="text-[11px] font-black text-pen-blue italic uppercase tracking-tighter">CP: {cp}</span>
             </div>
             <div className={cn("px-2 py-0.5 rounded-sm shadow-md border-[3px] border-pen-blue", 
               pet.rank === 'S' || pet.rank === 'SS' ? "bg-sticker-yellow" : "bg-white"
             )}>
                <span className="text-[10px] font-black text-pen-blue tracking-[0.1em] uppercase">РАНГ {pet.rank ?? 'B'}</span>
             </div>
          </div>
        </div>

        <div className="bg-white p-3 grid grid-cols-2 gap-x-4 gap-y-3 border-t-[3px] border-pen-blue/20">

           <div className="flex items-center gap-2 border-b-2 border-pen-blue/10 pb-1">
              <Sword className="w-6 h-6 text-pen-blue" />
              <div className="flex flex-col">
                 <span className="text-[8px] font-black text-pen-blue/50 uppercase leading-none mb-0.5">АТАКА</span>
                 <span className="text-[14px] font-black text-pen-blue leading-none">{pet.stats?.attack}</span>
              </div>
           </div>
           <div className="flex items-center gap-2 border-b-2 border-pen-blue/10 pb-1">
              <Shield className="w-6 h-6 text-pen-blue" />
              <div className="flex flex-col">
                 <span className="text-[8px] font-black text-pen-blue/50 uppercase leading-none mb-0.5">ЗАЩИТА</span>
                 <span className="text-[14px] font-black text-pen-blue leading-none">{pet.stats?.defense}</span>
              </div>
           </div>
           <div className="flex items-center gap-2 border-b-2 border-pen-blue/10 pb-1">
              <Zap className="w-6 h-6 text-pen-blue" />
              <div className="flex flex-col">
                 <span className="text-[8px] font-black text-pen-blue/50 uppercase leading-none mb-0.5">СКОРОСТЬ</span>
                 <span className="text-[14px] font-black text-pen-blue leading-none">{pet.stats?.speed}</span>
              </div>
           </div>
           <div className="flex items-center gap-2 border-b-2 border-pen-blue/10 pb-1">
              <Flame className="w-6 h-6 text-pen-blue" />
              <div className="flex flex-col">
                 <span className="text-[8px] font-black text-pen-blue/50 uppercase leading-none mb-0.5">МАГИЯ</span>
                 <span className="text-[14px] font-black text-pen-blue leading-none">{pet.stats?.magic}</span>
              </div>
           </div>
           <div className="flex items-center gap-2">
              <Timer className="w-6 h-6 text-pen-blue" />
              <div className="flex flex-col">
                 <span className="text-[8px] font-black text-pen-blue/50 uppercase leading-none mb-0.5">РЕГЕН.</span>
                 <span className="text-[14px] font-black text-pen-blue leading-none">{pet.stats?.regeneration}</span>
              </div>
           </div>
           <div className="flex items-center gap-2">
              <Heart className="w-6 h-6 text-pen-red" />
              <div className="flex flex-col">
                 <span className="text-[8px] font-black text-pen-red/50 uppercase leading-none mb-0.5">ЗДОРОВЬЕ</span>
                 <span className="text-[14px] font-black text-pen-red leading-none">{Math.floor(currentHp)}</span>
              </div>
           </div>
        </div>

        <div className="h-2 bg-black/10 w-full overflow-hidden border-t-2 border-black/5">
           <motion.div 
             className="h-full bg-sticker-yellow" 
             animate={{ width: `${Math.min(100, isPlayer ? rage.player : rage.enemy)}%` }} 
           />
        </div>
      </motion.div>
    );
  };

  if (side === 'left') {
    return (
      <div className="h-full flex flex-col pt-4 pb-8 px-4 relative overflow-hidden ledger-grid">
        <AnimatePresence>
          {showUlt && <UltAnimation element={playerPet.element} />}
        </AnimatePresence>
        
        <div className="flex-1 relative mb-4 min-h-0">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          </div>

          <div className="absolute bottom-16 right-[-5%] w-[65%] flex justify-end z-10">
             <BattleCard pet={enemy} currentHp={hp.enemy} maxHp={enemy.stats?.health || 100} isPlayer={false} isHit={isEnemyHit} isBlocking={isEnemyBlocking} />
          </div>

          <div className="absolute top-16 left-[-5%] w-[65%] flex justify-start z-30">
             <BattleCard pet={playerPet} currentHp={hp.player} maxHp={playerPet.stats?.health || 100} isPlayer={true} isHit={isPlayerHit} isBlocking={isPlayerBlocking} isTop />
          </div>

          <div className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] flex flex-col gap-8 scale-110">
             <motion.div className="flex flex-col items-center">
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  disabled={turn !== 'player' || !!winner}
                  onClick={() => handleAction('attack')}
                  className={cn(
                    "w-22 h-22 flex items-center justify-center rounded-full border-[5px] border-pen-blue bg-white shadow-xl transition-all",
                    turn === 'player' ? "cursor-pointer" : "opacity-30 grayscale cursor-not-allowed"
                  )}
                >
                  <motion.div 
                    animate={turn === 'player' ? { 
                      rotate: [-10, 10, -10], 
                      scale: [1, 1.1, 1],
                      boxShadow: ["0 0 0px rgba(28,49,152,0)", "0 0 15px rgba(28,49,152,0.4)", "0 0 0px rgba(28,49,152,0)"]
                    } : {}} 
                    transition={{ repeat: Infinity, duration: 1.2 }}
                    className="flex items-center justify-center"
                  >
                    <Sword className="w-12 h-12 text-pen-blue" strokeWidth={2.5} />
                  </motion.div>
                </motion.button>
                <div className="mt-1 bg-white/90 border-2 border-pen-blue px-3 py-0.5 rounded shadow-sm rotate-[-2deg]">
                  <span className="text-[12px] font-black text-pen-blue uppercase tracking-widest italic">АТАКА</span>
                </div>
             </motion.div>

             <motion.div className="flex flex-col items-center">
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  disabled={turn !== 'player' || rage.player < 100 || !!winner}
                  onClick={() => handleAction('ult')}
                  className={cn(
                    "w-22 h-22 flex items-center justify-center rounded-full border-[5px] border-pen-blue bg-white shadow-xl transition-all overflow-hidden",
                    turn === 'player' && rage.player >= 100 ? "bg-sticker-yellow" : "opacity-30 grayscale cursor-not-allowed"
                  )}
                >
                  <motion.div
                    animate={rage.player >= 100 ? { scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] } : {}}
                    transition={{ repeat: Infinity, duration: 0.7 }}
                  >
                    <Zap className={cn("w-12 h-12 text-pen-blue", rage.player >= 100 && "fill-current")} strokeWidth={2.5} />
                  </motion.div>
                </motion.button>
                <div className="mt-1 bg-white/90 border-2 border-pen-blue px-3 py-0.5 rounded shadow-sm rotate-[3deg]">
                  <span className="text-[12px] font-black text-pen-blue uppercase tracking-widest italic">УЛЬТА</span>
                </div>
             </motion.div>

             <motion.div className="flex flex-col items-center">
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  disabled={turn !== 'player' || !!winner}
                  onClick={() => handleAction('block')}
                  className={cn(
                    "w-22 h-22 flex items-center justify-center rounded-full border-[5px] border-pen-blue bg-white shadow-xl transition-all",
                    turn === 'player' ? "cursor-pointer" : "opacity-30 grayscale cursor-not-allowed"
                  )}
                >
                  <Shield className="w-12 h-12 text-pen-blue" strokeWidth={2.5} />
                </motion.button>
                <div className="mt-1 bg-white/90 border-2 border-pen-blue px-3 py-0.5 rounded shadow-sm rotate-[-1deg]">
                  <span className="text-[12px] font-black text-pen-blue uppercase tracking-widest italic">БЛОК</span>
                </div>
             </motion.div>
          </div>
        </div>

        <div className="h-44 bg-[#fdfaf3] border-[6px] border-pen-blue p-5 overflow-y-auto relative rounded-2xl shadow-[inset_0_4px_15px_rgba(0,0,0,0.1)] scrollbar-hide">
           <div className="text-[14px] font-black text-pen-blue/40 mb-4 uppercase tracking-[0.2em] sticky top-0 bg-[#fdfaf3]/95 pb-2 backdrop-blur-none italic border-b-2 border-pen-blue/10">ЛОГ СРАЖЕНИЯ:</div>
           <div className="space-y-4">
              {battleLog.map((log, i) => (
                <div key={i} className={cn("text-[24px] font-black leading-[1.1] tracking-tight italic", i === 0 ? "text-pen-blue" : "text-pen-blue/40")}>
                  {i === 0 ? "⚡ " : "• "} {log}
                </div>
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
             <div className="text-8xl font-black text-pen-blue/5 italic uppercase tracking-[0.4em] transform -rotate-6 select-none leading-none">
                БИТВА В РАЗГАРЕ
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
            className="w-full max-w-lg bg-white border-[8px] border-pen-blue p-10 flex flex-col items-center ledger-grid relative"
          >
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-sticker-yellow border-[4px] border-pen-blue px-8 py-2 rotate-[-3deg] shadow-lg z-10">
               <span className="text-4xl font-black text-pen-blue italic uppercase tracking-tighter">ИТОГ</span>
            </div>

            <h2 className={cn(
              "text-8xl font-black italic uppercase tracking-tighter mb-10 transform -rotate-2 mt-4",
              winner === 'player' ? "text-pen-blue" : "text-pen-red"
            )}>
              {winner === 'player' ? "ПОБЕДА!" : "ПОРАЖЕНИЕ"}
            </h2>

            <div className="w-full space-y-6 mb-10">
               <div className="flex justify-between items-center border-b-[4px] border-pen-blue/10 pb-3">
                  <span className="text-[24px] font-black text-pen-blue/60 italic uppercase tracking-widest">ДОБЫЧА:</span>
                  <span className="text-[32px] font-black text-pen-blue italic">{rewards?.rubles || 0} ₽</span>
               </div>
               <div className="flex justify-between items-center border-b-[4px] border-pen-blue/10 pb-3">
                  <span className="text-[24px] font-black text-pen-blue/60 italic uppercase tracking-widest">ОПЫТ:</span>
                  <span className="text-[32px] font-black text-pen-blue italic">+{rewards?.xp || 0} XP</span>
               </div>
            </div>

            <div className="w-full bg-pen-blue/5 border-[4px] border-pen-blue/20 p-8 rounded-2xl mb-10 rotate-[1deg]">
               <span className="text-[14px] font-black text-pen-blue/40 uppercase tracking-[0.2em] block mb-3">АНАЛИЗ БИТВЫ:</span>
               <p className="text-[28px] font-black text-pen-blue italic leading-[1.1]">
                  {winner === 'player' 
                    ? "Ваша стратегия и мощь питомца сокрушили оппонента. Вы достойны звания ветерана!"
                    : "Противник оказался хитрее. Но каждое поражение — это лишь шаг к будущей победе!"}
               </p>
            </div>

            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                // Return leads to pet parameters with flipping animation
                navigate(`/pet/${playerPet.id}`, { state: { flipFromBattle: true } });
              }}
              className="w-full py-5 bg-sticker-yellow border-[6px] border-pen-blue text-[36px] font-black text-pen-blue uppercase italic tracking-widest transition-all"
            >
              ВЕРНУТЬСЯ
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
