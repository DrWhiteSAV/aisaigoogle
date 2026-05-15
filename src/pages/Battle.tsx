import React, { useState, useEffect, useMemo, useCallback, createContext, useContext } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { Pet, UserProgress, Skill, PetStats } from '../types';
import { NeonButton, LogoAnimation } from '../components/UI';
import { motion, AnimatePresence } from 'motion/react';
import { Sword, Shield, Zap, Sprout, Flame, Droplets, Wind, Mountain, Star, Sparkles, Timer, Target, Heart, PenLine } from 'lucide-react';
import { cn } from '../lib/utils';
import { ElementSticker, AttributeSticker } from '../components/GameUI';
import { getElementAdvantageMultiplier, getAttributeDefenseMultiplier, calculateCP, getBattleRewards, checkLevelUp, getEffectiveStat, getPassiveBonus } from '../lib/gameLogic';

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

interface FloatingDamage {
  id: string;
  value: number;
  isPlayer: boolean;
  x: number;
  y: number;
  type: 'damage' | 'heal' | 'ult';
}

interface BattleState {
  enemy: Pet | null;
  battleLog: string[];
  hp: { player: number; enemy: number };
  rage: { player: number; enemy: number };
  turn: 'player' | 'enemy' | 'waiting';
  lastTurnSide: 'player' | 'enemy' | null;
  winner: 'player' | 'enemy' | null;
  rewards: { sprouts: number; xp: number } | null;
  defenseBoost: { player: number; enemy: number };
  speedGauge: { player: number; enemy: number };
  isEnemyHit: boolean;
  isPlayerHit: boolean;
  isPlayerAttacking: boolean;
  isEnemyAttacking: boolean;
  activeActionEffect: { type: 'attack' | 'ult' | 'regen', isPlayer: boolean } | null;
  showUlt: boolean;
  isPlayerRegen: boolean;
  isEnemyRegen: boolean;
  floatingDamages: FloatingDamage[];
  debuffs: {
    player: Partial<Record<keyof PetStats, number>>;
    enemy: Partial<Record<keyof PetStats, number>>;
  };
  handleAction: (type: 'attack' | 'ult' | 'regen') => Promise<void>;
  playerPet: Pet | null;
}

const BattleContext = createContext<BattleState | null>(null);

const DamageNumber: React.FC<{ damage: FloatingDamage }> = ({ damage }) => (
  <motion.div
    initial={{ opacity: 0, y: damage.y, x: damage.x, scale: 0.5 }}
    animate={{ opacity: [0, 1, 1, 0], y: damage.y - 100, scale: [0.5, 1.5, 1.2, 1] }}
    transition={{ duration: 1, ease: "easeOut" }}
    className={cn(
      "absolute z-[400] font-black text-3xl italic pointer-events-none drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]",
      damage.type === 'heal' ? "text-green-500" : damage.type === 'ult' ? "text-sticker-yellow" : "text-pen-red"
    )}
  >
    {damage.type === 'heal' ? `+${damage.value}` : `-${damage.value}`}
  </motion.div>
);
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
  battleId?: string;
}> = ({ progress, setProgress, toggleFlipLock, manualId, side = 'left', battleId: propBattleId }) => {
  const location = useLocation();
  const pathParts = location.pathname.split('/');
  // /battle/:id/:battleId
  const urlPetId = pathParts[2];
  const urlBattleId = pathParts[3];
  
  const battleId = propBattleId || urlBattleId;
  const petIdFromUrl = manualId || urlPetId || progress.activePetId;
  const playerPet = useMemo(() => (progress.pets || []).find(p => p.id === petIdFromUrl), [progress.pets, petIdFromUrl]);

  return (
    <BattleProvider 
      progress={progress} 
      setProgress={setProgress} 
      playerPet={playerPet || null} 
      toggleFlipLock={toggleFlipLock}
      battleId={battleId}
    >
      <BattleContent side={side} setProgress={setProgress} />
    </BattleProvider>
  );
};

let globalBattleState: any = null;
let listeners: Array<() => void> = [];

export const resetBattleState = () => {
  globalBattleState = null;
  listeners.forEach(l => l());
};

const BattleProvider: React.FC<{ 
  children: React.ReactNode; 
  progress: UserProgress; 
  setProgress: React.Dispatch<React.SetStateAction<UserProgress>>;
  playerPet: Pet | null;
  toggleFlipLock?: (id: string, locked: boolean) => void;
  battleId?: string;
}> = ({ children, progress, setProgress, playerPet, toggleFlipLock, battleId }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const componentId = React.useId();
  const lockId = `battle-${componentId}`;

  // Reset global state on unmount to handle page flipping as completion
  useEffect(() => {
    return () => {
      resetBattleState();
    };
  }, []);

  const initStarted = React.useRef(false);
  
  const [state, setState] = useState<Omit<BattleState, 'handleAction' | 'playerPet'>>(() => {
    // Check both petId AND battleId to ensure we are looking at the same fight
    if (globalBattleState && globalBattleState.battleId === battleId) {
       return globalBattleState.state;
    }
    return {
      enemy: null,
      battleLog: ['Битва началась!'],
      hp: { player: 100, enemy: 100 },
      rage: { player: 0, enemy: 0 },
      speedGauge: { player: 100, enemy: 100 },
      turn: 'waiting',
      lastTurnSide: null,
      winner: null,
      rewards: null,
      defenseBoost: { player: 1, enemy: 1 },
      isEnemyHit: false,
      isPlayerHit: false,
      isPlayerAttacking: false,
      isEnemyAttacking: false,
      activeActionEffect: null,
      showUlt: false,
      isPlayerRegen: false,
      isEnemyRegen: false,
      debuffs: { player: {}, enemy: {} },
    };
  });

  const syncState = useCallback((newStateOrFn: any) => {
    setState(prev => {
      const updates = typeof newStateOrFn === 'function' ? newStateOrFn(prev) : newStateOrFn;
      const next = { ...prev, ...updates };
      globalBattleState = { petId: playerPet?.id, battleId, state: next };
      return next;
    });
  }, [playerPet?.id, battleId]);

  useEffect(() => {
    initStarted.current = false;
    if (globalBattleState && globalBattleState.battleId === battleId) {
       setState(globalBattleState.state);
    } else {
       setState({
          enemy: null,
          battleLog: ['Битва началась!'],
          hp: { player: 100, enemy: 100 },
          rage: { player: 0, enemy: 0 },
          speedGauge: { player: 100, enemy: 100 },
          turn: 'waiting',
          lastTurnSide: null,
          winner: null,
          rewards: null,
          defenseBoost: { player: 1, enemy: 1 },
          isEnemyHit: false,
          isPlayerHit: false,
          isPlayerAttacking: false,
          isEnemyAttacking: false,
          activeActionEffect: null,
          showUlt: false,
          isPlayerRegen: false,
          isEnemyRegen: false,
          floatingDamages: []
       });
    }
  }, [battleId]);

  useEffect(() => {
    if (globalBattleState && globalBattleState.battleId === battleId && globalBattleState.state === state) {
      const timer = setTimeout(() => {
        listeners.forEach(l => l());
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [state, battleId]);

  useEffect(() => {
    const listener = () => {
      if (globalBattleState && globalBattleState.battleId === battleId && globalBattleState.state !== state) {
        setState(globalBattleState.state);
      }
    };
    listeners.push(listener);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  }, [playerPet?.id, state, battleId]);

  // Remove the aggressive flip lock that breaks the book navigation
  /*
  useEffect(() => {
    if (toggleFlipLock) {
      toggleFlipLock(lockId, !!state.winner);
    }
  }, [state.winner, toggleFlipLock, lockId]);
  */

  const getVal = useCallback((pet: Pet, key: keyof PetStats, side: 'player' | 'enemy', currentDebuffs: any) => {
    const base = getEffectiveStat(pet, key);
    const debuff = currentDebuffs[side][key] || 0;
    return Math.max(1, base - debuff);
  }, []);

  const calculateDamageDetailed = useCallback((attacker: Pet, defender: Pet, isUlt: boolean = false, defBoost: number = 1.0, side: 'player' | 'enemy' = 'player', buffMult: number = 1.0, currentDebuffs: any) => {
    if (!attacker?.stats || !defender?.stats) return { total: 0, attack: 0, defense: 0, magic: 0 };
    
    const opponentSide = side === 'player' ? 'enemy' : 'player';
    
    const elemMult = getElementAdvantageMultiplier(attacker.element, defender.element);
    const attrMult = getAttributeDefenseMultiplier(attacker.attribute, defender.attribute);

    // Defense: base random from 50% to 100% of stat, multiplied by defBoost
    const defenseStat = getVal(defender, 'defense', opponentSide, currentDebuffs);
    const defenseVar = (0.5 + (Math.random() * 0.5)) * defBoost;
    const finalDefense = Math.floor(defenseStat * defenseVar * attrMult);

    const attackStat = getVal(attacker, 'attack', side, currentDebuffs) * buffMult;
    const magicStat = getVal(attacker, 'magic', side, currentDebuffs) * buffMult;
    
    if (isUlt) {
      // Ult = (Attack + Magic) * ElementBonus
      const finalAttack = Math.floor(attackStat * elemMult);
      const finalMagic = Math.floor(magicStat * elemMult);
      
      const total = Math.max(10, (finalAttack + finalMagic) - finalDefense);
      
      return {
        total,
        attack: finalAttack,
        defense: finalDefense,
        magic: finalMagic
      };
    } else {
      // Normal Attack: random from 80% to 100% of stat
      const attackVar = 0.8 + (Math.random() * 0.2);
      const finalAttack = Math.floor(attackStat * attackVar * elemMult);
      
      const total = Math.max(5, finalAttack - finalDefense);
      
      return {
        total,
        attack: finalAttack,
        defense: finalDefense,
        magic: 0
      };
    }
  }, [getVal]);

  const calculateRageGain = useCallback((attackVal: number) => {
    if (!playerPet || !state.enemy) return 0;
    const playerMaxHp = playerPet.stats?.health || 100;
    const enemyMaxHp = state.enemy.stats?.health || 100;
    const playerDef = playerPet.stats?.defense || 10;
    const enemyDef = state.enemy.stats?.defense || 10;
    
    // Based on Attack value as requested, divided by health/def sum
    const sum = playerMaxHp + enemyMaxHp + playerDef + enemyDef;
    return (attackVal / sum) * 200;
  }, [playerPet, state.enemy]);

  const getSpeedGainFormatted = (pSpeed: number, eSpeed: number) => {
    const sum = pSpeed + eSpeed;
    if (sum === 0) return "";
    const pGain = Math.floor((pSpeed / sum) * 100);
    const eGain = Math.floor((eSpeed / sum) * 100);
    return ` | Скор: ${pGain}/${eGain}% (${pSpeed}v${eSpeed})`;
  };

  const updateSpeedAndDecideTurn = useCallback((prev: Omit<BattleState, 'handleAction' | 'playerPet'>) => {
    if (!playerPet || !prev.enemy) return prev;
    
    let currentP = prev.speedGauge.player;
    let currentE = prev.speedGauge.enemy;

    const EPSILON = 0.1;

    // 1. Если кто-то уже готов (100+), выбираем его.
    if (currentP >= 100 - EPSILON || currentE >= 100 - EPSILON) {
      let turn: 'player' | 'enemy' = 'player';
      if (currentP >= 100 - EPSILON && currentE >= 100 - EPSILON) {
        // Если перебор почти одинаковый (допуск 2.0 ед.), используем строгое чередование
        if (Math.abs(currentP - currentE) > 2.0) { 
          turn = currentP > currentE ? 'player' : 'enemy';
        } else {
          turn = prev.lastTurnSide === 'player' ? 'enemy' : 'player';
        }
      } else {
        turn = currentP >= 100 - EPSILON ? 'player' : 'enemy';
      }
      return { ...prev, turn };
    }

    // 2. Иначе наращиваем шкалы.
    const pSpeed = Math.max(1, getVal(playerPet, 'speed', 'player', prev.debuffs));
    const eSpeed = Math.max(1, getVal(prev.enemy, 'speed', 'enemy', prev.debuffs));
    
    const sum = pSpeed + eSpeed;
    const pGainPerStep = (pSpeed / sum) * 100;
    const eGainPerStep = (eSpeed / sum) * 100;

    // Считаем сколько "шагов" нужно до ближайшего 100
    const stepsToP = (100 - currentP) / pGainPerStep;
    const stepsToE = (100 - currentE) / eGainPerStep;
    const minSteps = Math.max(0.01, Math.min(stepsToP, stepsToE));
    
    // Продвигаем шкалы и округляем для стабильности
    const nextP = Math.round((Math.min(200, currentP + pGainPerStep * minSteps)) * 10) / 10;
    const nextE = Math.round((Math.min(200, currentE + eGainPerStep * minSteps)) * 10) / 10;

    let nextTurn: 'player' | 'enemy' = 'player';
    if (nextP >= 100 - EPSILON && nextE >= 100 - EPSILON) {
      nextTurn = prev.lastTurnSide === 'player' ? 'enemy' : 'player';
    } else {
      nextTurn = nextP >= 100 - EPSILON ? 'player' : 'enemy';
    }

    return {
      ...prev,
      speedGauge: { player: nextP, enemy: nextE },
      turn: nextTurn
    };
  }, [playerPet, getVal]);

  const handleEndBattleActionSnapshot = useCallback((playerWon: boolean, currentEnemy: Pet) => {
    if (!currentEnemy || !playerPet) return;
    const playerCP = calculateCP(playerPet);
    const enemyCP = calculateCP(currentEnemy);
    const cpRatio = enemyCP / (playerCP || 1); 
    
    const { xp: xpAwarded, sprouts: sproutsAwarded } = getBattleRewards(playerPet.level, playerWon, cpRatio);

    syncState({ rewards: { sprouts: sproutsAwarded, xp: xpAwarded } });

    setProgress(prev => {
      const updatedPets = prev.pets.map(p => {
        if (p.id === playerPet.id) {
          return checkLevelUp({ ...p, experience: p.experience + xpAwarded });
        }
        return p;
      });
      return {
        ...prev,
        sprouts: prev.sprouts + sproutsAwarded,
        pets: updatedPets
      };
    });
  }, [playerPet, setProgress, syncState]);

  useEffect(() => {
    if (state.winner && !state.rewards && state.enemy) {
      handleEndBattleActionSnapshot(state.winner === 'player', state.enemy);
    }
  }, [state.winner, state.rewards, state.enemy, handleEndBattleActionSnapshot]);

  const performEnemyTurn = useCallback(async (currentEnemy: Pet, currentHp: any, currentRage: any) => {
    if (state.winner || !currentEnemy || !playerPet) return;

    // Turn Start: Card Enlarge
    syncState({ turn: 'enemy', isEnemyAttacking: true });
    await new Promise(r => setTimeout(r, 600));

    const enemyIsLow = currentHp.enemy < ((getEffectiveStat(currentEnemy, 'health') || 100) * 0.3);
    const shouldRegen = enemyIsLow && Math.random() > 0.4 && (getEffectiveStat(currentEnemy, 'regeneration') > 0);
    const useUlt = !shouldRegen && currentRage.enemy >= 100;

    const actionType = shouldRegen ? 'regen' : (useUlt ? 'ult' : 'attack');
    
    let activeBuff: Skill | null = null;
    let buffMult = 1.0;
    let skillLog = '';
    
    if (actionType !== 'regen') {
      const buffs = (currentEnemy.skills || []).filter(s => s.type === 'active_buff');
      if (buffs.length > 0) {
        activeBuff = buffs[Math.floor(Math.random() * buffs.length)];
        buffMult = 1.0 + (activeBuff.value / 100);
        skillLog = ` [Навык: ${activeBuff.name} +${activeBuff.value}%]`;
      }
    }

    if (shouldRegen) {
        let debuffLog = '';
        const debuffs = (currentEnemy.skills || []).filter(s => s.type === 'active_debuff');
        let newDebuffs = { ...state.debuffs };
        if (debuffs.length > 0) {
          const activeDebuff = debuffs[Math.floor(Math.random() * debuffs.length)];
          const debuffValue = Math.floor(getEffectiveStat(playerPet, activeDebuff.targetStat) * (activeDebuff.value / 100));
          newDebuffs.player = { ...newDebuffs.player, [activeDebuff.targetStat]: (newDebuffs.player[activeDebuff.targetStat] || 0) + debuffValue };
          debuffLog = ` [${activeDebuff.name}: -${activeDebuff.value}% ${activeDebuff.targetStat}]`;
        }

        const regenStat = getVal(currentEnemy, 'regeneration', 'enemy', state.debuffs);
        const actualRegen = Math.floor(regenStat * (0.8 + Math.random() * 0.2));
        const finalRegen = Math.min(actualRegen, (getEffectiveStat(currentEnemy, 'health') || 100) - currentHp.enemy);
        const defenseBoostVal = 1.0 + (Math.random() * 0.2); // 100-120%
        const newHp = { ...currentHp, enemy: currentHp.enemy + finalRegen };
        
        const pSpeed = Math.max(1, getVal(playerPet, 'speed', 'player', newDebuffs));
        const eSpeed = Math.max(1, getVal(currentEnemy, 'speed', 'enemy', newDebuffs));
        const speedSuffix = getSpeedGainFormatted(pSpeed, eSpeed);
        
        syncState((prev: any) => {
          const intermediate = {
            ...prev,
            hp: newHp,
            speedGauge: { ...prev.speedGauge, enemy: prev.speedGauge.enemy - 100 },
            lastTurnSide: 'enemy',
            defenseBoost: { ...prev.defenseBoost, enemy: defenseBoostVal },
            debuffs: newDebuffs,
            battleLog: [
              `🛡️ [Враг] ${currentEnemy.name} регенерирует: +${finalRegen} HP. Защита усилена до ${Math.floor(defenseBoostVal * 100)}%!${debuffLog}${speedSuffix}`,
              ...prev.battleLog
            ],
          };
          return updateSpeedAndDecideTurn(intermediate);
        });
        return;
    }

    const { total, attack, defense, magic } = calculateDamageDetailed(currentEnemy, playerPet, useUlt, state.defenseBoost.player, 'enemy', buffMult, state.debuffs);
    const log = useUlt 
      ? `[Враг] ${currentEnemy.name} (УЛЬТА): Нанесено ${total} Ур (Атк+Маг: ${attack + magic}, Защ: ${defense})${skillLog}`
      : `[Враг] ${currentEnemy.name}: Удар на ${total} Ур (Атк: ${attack}, Защ: ${defense})${skillLog}`;

    const currentPlayerHp = Math.max(0, currentHp.player - total);
    
    const gain = calculateRageGain(attack + magic);
    let nextEnemyRage = currentRage.enemy;
    let logSuffix = '';
    
    // Add floating damage
    const damageId = Math.random().toString(36).substring(7);
    const newDamage: FloatingDamage = {
      id: damageId,
      value: total,
      isPlayer: true,
      x: -50 + Math.random() * 100, // randomized around center
      y: 100 + Math.random() * 50,
      type: actionType === 'ult' ? 'ult' : 'damage'
    };

    if (useUlt) {
      nextEnemyRage -= 100;
      logSuffix = ' | Ярость: -100%';
    } else {
      nextEnemyRage = Math.min(100, currentRage.enemy + gain);
      logSuffix = ` | Ярость: +${Math.floor(gain)}%`;
    }
    
    const pSpeed = Math.max(1, getVal(playerPet, 'speed', 'player', state.debuffs));
    const eSpeed = Math.max(1, getVal(currentEnemy, 'speed', 'enemy', state.debuffs));
    const speedSuffix = getSpeedGainFormatted(pSpeed, eSpeed);
    
    syncState((prev: any) => {
      const intermediate = {
        ...prev,
        hp: { ...currentHp, player: currentPlayerHp },
        rage: { ...currentRage, enemy: nextEnemyRage },
        speedGauge: { ...prev.speedGauge, enemy: prev.speedGauge.enemy - 100 },
        lastTurnSide: 'enemy',
        floatingDamages: [...prev.floatingDamages, newDamage],
        isPlayerHit: true,
        defenseBoost: { ...prev.defenseBoost, player: 1.0 }, // Reset player boost after being hit
        battleLog: [log + logSuffix + speedSuffix, ...prev.battleLog],
      };
      
      if (currentPlayerHp <= 0 && !prev.winner) {
          return { ...intermediate, winner: 'enemy' };
      }
      return updateSpeedAndDecideTurn(intermediate);
    });

    // Reset hit effects and remove damage numbers after delay
    setTimeout(() => {
      syncState({ isPlayerHit: false, isEnemyAttacking: false });
    }, 500);

    setTimeout(() => {
      syncState(prev => ({
        ...prev,
        floatingDamages: prev.floatingDamages.filter(d => d.id !== damageId)
      }));
    }, 2000);
  }, [state.winner, playerPet, calculateDamageDetailed, syncState, state.debuffs]);

  const handleAction = async (type: 'attack' | 'ult' | 'regen') => {
    if (state.turn !== 'player' || state.winner || !state.enemy || !playerPet) return;

    console.log(`[Battle] Player action: ${type}`);
    syncState({ turn: 'waiting' });

    if (type === 'regen') {
      let debuffLog = '';
      const debuffs = (playerPet.skills || []).filter(s => s.type === 'active_debuff');
      let newDebuffs = { ...state.debuffs };
      if (debuffs.length > 0) {
        const activeDebuff = debuffs[Math.floor(Math.random() * debuffs.length)];
        const debuffValue = Math.floor(getEffectiveStat(state.enemy, activeDebuff.targetStat) * (activeDebuff.value / 100));
        newDebuffs.enemy = { ...newDebuffs.enemy, [activeDebuff.targetStat]: (newDebuffs.enemy[activeDebuff.targetStat] || 0) + debuffValue };
        debuffLog = ` [Навык ${activeDebuff.name}: -${activeDebuff.value}% ${activeDebuff.targetStat}]`;
      }

      const regenStat = getVal(playerPet, 'regeneration', 'player', state.debuffs);
      const actualRegen = Math.floor(regenStat * (0.8 + Math.random() * 0.2));
      const finalRegen = Math.min(actualRegen, (getEffectiveStat(playerPet, 'health') || 100) - state.hp.player);
      const defenseBoostVal = 1.0 + (Math.random() * 0.2); // 100-120%
      const newHp = { ...state.hp, player: state.hp.player + finalRegen };
      
      const damageId = Math.random().toString(36).substring(7);
      const newDamage: FloatingDamage = {
        id: damageId,
        value: finalRegen,
        isPlayer: true,
        x: -50 + Math.random() * 100,
        y: 100 + Math.random() * 50,
        type: 'heal'
      };

      const pSpeed = Math.max(1, getVal(playerPet, 'speed', 'player', newDebuffs));
      const eSpeed = Math.max(1, getVal(state.enemy, 'speed', 'enemy', newDebuffs));
      const speedSuffix = getSpeedGainFormatted(pSpeed, eSpeed);
      
      syncState((prev: any) => {
        const intermediate = {
          ...prev,
          hp: newHp,
          speedGauge: { ...prev.speedGauge, player: prev.speedGauge.player - 100 },
          lastTurnSide: 'player',
          floatingDamages: [...prev.floatingDamages, newDamage],
          defenseBoost: { ...prev.defenseBoost, player: defenseBoostVal },
          debuffs: newDebuffs,
          battleLog: [
            `🛡️ ${playerPet.name}: +${finalRegen} HP (Реген). Защита на полную: ${Math.floor(defenseBoostVal * 100)}%!${debuffLog}${speedSuffix}`,
            ...prev.battleLog
          ],
        };
        return updateSpeedAndDecideTurn(intermediate);
      });

      setTimeout(() => {
        syncState(prev => ({
          ...prev,
          floatingDamages: prev.floatingDamages.filter(d => d.id !== damageId)
        }));
      }, 2000);

      return;
    }

    let activeBuff: Skill | null = null;
    let buffMult = 1.0;
    let skillLog = '';
    const buffs = (playerPet.skills || []).filter(s => s.type === 'active_buff');
    if (buffs.length > 0) {
      activeBuff = buffs[Math.floor(Math.random() * buffs.length)];
      buffMult = 1.0 + (activeBuff.value / 100);
      skillLog = ` [Навык: ${activeBuff.name} +${activeBuff.value}%]`;
    }

    const { total, attack, defense, magic } = calculateDamageDetailed(playerPet, state.enemy, type === 'ult', state.defenseBoost.enemy, 'player', buffMult, state.debuffs);
    
    let log = '';
    if (type === 'attack') {
      log = `${playerPet.name} ударил на ${total} Ур (Атк: ${attack}, Защ: ${defense})${skillLog}`;
    } else if (type === 'ult') {
      log = `⚡️ УЛЬТА ${playerPet.name}: ${total} Ур (Атк+Маг: ${attack + magic}, Защ врага: ${defense})${skillLog}`;
    }

    const currentEnemyHp = Math.max(0, state.hp.enemy - total);
    
    // Add floating damage
    const damageId = Math.random().toString(36).substring(7);
    const newDamage: FloatingDamage = {
      id: damageId,
      value: total,
      isPlayer: false,
      x: -50 + Math.random() * 100,
      y: 100 + Math.random() * 50,
      type: type === 'ult' ? 'ult' : 'damage'
    };

    let newRage = { ...state.rage };
    let logSuffix = '';
    const gain = calculateRageGain(attack + magic);
    if (type === 'ult') {
      newRage.player -= 100;
      logSuffix = ' | Ярость: -100%';
    } else if (type === 'attack') {
      newRage.player = Math.min(100, newRage.player + gain);
      logSuffix = ` | Ярость: +${Math.floor(gain)}%`;
    }
    
    const pSpeed = Math.max(1, getVal(playerPet, 'speed', 'player', state.debuffs));
    const eSpeed = Math.max(1, getVal(state.enemy, 'speed', 'enemy', state.debuffs));
    const speedSuffix = getSpeedGainFormatted(pSpeed, eSpeed);
    
    syncState((prev: any) => {
      const intermediate = {
        ...prev,
        hp: { ...prev.hp, enemy: currentEnemyHp },
        rage: newRage,
        speedGauge: { ...prev.speedGauge, player: prev.speedGauge.player - 100 },
        lastTurnSide: 'player',
        floatingDamages: [...prev.floatingDamages, newDamage],
        isEnemyHit: true,
        defenseBoost: { ...prev.defenseBoost, enemy: 1.0 }, // Reset enemy boost after being hit
        battleLog: [log + logSuffix + speedSuffix, ...prev.battleLog],
      };
      
      if (currentEnemyHp <= 0 && !prev.winner) {
          return { ...intermediate, winner: 'player' };
      }
      return updateSpeedAndDecideTurn(intermediate);
    });

    // Cleanup effects
    setTimeout(() => {
      syncState({ isEnemyHit: false, isPlayerAttacking: false, activeActionEffect: null, showUlt: false });
    }, 600);

    setTimeout(() => {
      syncState(prev => ({
        ...prev,
        floatingDamages: prev.floatingDamages.filter(d => d.id !== damageId)
      }));
    }, 2000);
  };

  // Trigger enemy turn when it's their turn
  useEffect(() => {
    if (state.turn === 'enemy' && !state.winner && state.enemy) {
      console.log('[Battle] Triggering Enemy Turn effect');
      const timer = setTimeout(() => {
        performEnemyTurn(state.enemy!, state.hp, state.rage);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [state.turn, state.winner]);

  useEffect(() => {
    if (!state.enemy && playerPet && location.pathname.startsWith('/battle')) {
      if (initStarted.current) return;
      
      if (globalBattleState && globalBattleState.battleId === battleId && globalBattleState.state.enemy) {
        setState(globalBattleState.state);
        return;
      }

      if (progress.energy < 5) {
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
        skills: [
          { id: 'ep1', name: 'Дикая Стойкость', description: 'Природная закалка.', type: 'passive', targetStat: 'defense', value: Math.floor(5 + Math.random() * 5) },
          { id: 'ea1', name: 'Ярость Леса', description: 'Дикая атака.', type: 'active_buff', targetStat: 'attack', value: Math.floor(5 + Math.random() * 5) },
          { id: 'ed1', name: 'Жуткий Вой', description: 'Пугает врага.', type: 'active_debuff', targetStat: 'attack', value: Math.floor(15 + Math.random() * 20) }
        ]
      } as Pet;

      const initialHp = getEffectiveStat(playerPet, 'health') || 100;
      
      const initialState = {
        enemy: mockEnemy,
        hp: { player: initialHp, enemy: getEffectiveStat(mockEnemy, 'health') || 100 },
        turn: 'waiting' as any,
        speedGauge: { player: 0, enemy: 0 },
        lastTurnSide: null,
        battleLog: [`${playerPet.name} против ${mockEnemy.name}!`],
        rage: { player: 0, enemy: 0 },
        isEnemyHit: false,
        isPlayerHit: false,
        isPlayerAttacking: false,
        isEnemyAttacking: false,
        activeActionEffect: null,
        showUlt: false,
        isPlayerRegen: false,
        isEnemyRegen: false,
        floatingDamages: [],
        winner: null,
        rewards: null,
        debuffs: { player: {}, enemy: {} },
        defenseBoost: { player: 1.0, enemy: 1.0 }
      };

      const withTurn = updateSpeedAndDecideTurn(initialState);
      syncState(withTurn);
      setProgress(prev => {
        console.log('[Battle] Consuming energy');
        return { ...prev, energy: prev.energy - 5 };
      });
    }
  }, [playerPet?.id, location.pathname, navigate, progress.energy, setProgress, syncState, state.enemy, playerPet]);

  const value = useMemo(() => ({ ...state, handleAction, playerPet }), [state, handleAction, playerPet]);

  return <BattleContext.Provider value={value}>{children}</BattleContext.Provider>;
};

const BattleCard = React.memo(({ pet, currentHp, maxHp, isPlayer, rage, speedGauge, opponent, sideDebuffs, isHit }: { 
  pet: Pet, 
  currentHp: number, 
  maxHp: number, 
  isPlayer: boolean, 
  rage: { player: number, enemy: number }, 
  speedGauge: { player: number, enemy: number }, 
  opponent: Pet,
  sideDebuffs: Partial<Record<keyof PetStats, number>>,
  isHit?: boolean
}) => {
    const cp = calculateCP(pet);

    const getEff = (key: keyof PetStats) => {
      const base = getEffectiveStat(pet, key);
      const debuff = sideDebuffs[key] || 0;
      return Math.max(1, base - debuff);
    };

    const effAttack = getEff('attack');
    const effDefense = getEff('defense');
    const effMagic = getEff('magic');
    const effRegen = getEff('regeneration');
    const effSpeed = getEff('speed');
    
    // Element advantage
    const elementMult = getElementAdvantageMultiplier(pet.element, opponent.element);
    const finalAttack = Math.floor(effAttack * elementMult);
    const finalMagic = Math.floor(effMagic * elementMult);
    
    // Defense advantage
    const attributeMult = getAttributeDefenseMultiplier(opponent.attribute, pet.attribute);
    const finalDefense = Math.floor(effDefense * attributeMult);

    return (
      <motion.div 
        initial={{ rotate: isPlayer ? -1.5 : 1.5 }}
        animate={isHit ? { 
          x: [0, -10, 10, -10, 10, 0],
          rotate: isPlayer ? [-1.5, -5, 5, -5, 5, -1.5] : [1.5, 5, -5, 5, -5, 1.5]
        } : { 
          rotate: isPlayer ? -1.5 : 1.5 
        }}
        transition={isHit ? { duration: 0.4 } : { type: "spring", damping: 30, stiffness: 400 }}
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
            <span className="text-[10px] font-black text-pen-blue leading-none">{effRegen}</span>
          </div>
          <div className={cn(
            "bg-white border-2 border-pen-blue px-2 py-0.5 rounded flex items-center gap-1 shadow-none",
            isPlayer ? "-rotate-1" : "rotate-1 flex-row-reverse"
          )}>
            <Flame className={cn("w-3 h-3", finalMagic > effMagic ? "text-pen-red" : "text-pen-blue")} strokeWidth={3} />
            <span className={cn("text-[10px] font-black leading-none", finalMagic > effMagic ? "text-pen-red" : "text-pen-blue")}>{finalMagic}</span>
          </div>
          <div className={cn(
            "bg-white border-2 border-pen-blue px-2 py-0.5 rounded flex items-center gap-1 shadow-none",
            isPlayer ? "rotate-2" : "-rotate-2 flex-row-reverse"
          )}>
            <Zap className="w-3 h-3 text-pen-blue" strokeWidth={3} />
            <span className="text-[10px] font-black text-pen-blue leading-none">{effSpeed}</span>
          </div>
          <div className={cn(
            "bg-white border-2 border-pen-blue px-2 py-0.5 rounded flex items-center gap-1 shadow-none",
            isPlayer ? "-rotate-2" : "rotate-2 flex-row-reverse"
          )}>
            <Shield className={cn("w-3 h-3", finalDefense > effDefense ? "text-pen-red" : "text-pen-blue")} strokeWidth={3} />
            <span className={cn("text-[10px] font-black leading-none", finalDefense > effDefense ? "text-pen-red" : "text-pen-blue")}>{finalDefense}</span>
          </div>
          <div className={cn(
            "bg-white border-2 border-pen-blue px-2 py-0.5 rounded flex items-center gap-1 shadow-none",
            isPlayer ? "rotate-1" : "-rotate-1 flex-row-reverse"
          )}>
            <Sword className={cn("w-3 h-3", finalAttack > effAttack ? "text-pen-red" : "text-pen-blue")} strokeWidth={3} />
            <span className={cn("text-[10px] font-black leading-none", finalAttack > effAttack ? "text-pen-red" : "text-pen-blue")}>{finalAttack}</span>
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
            animate={{ width: `${Math.max(0, (maxHp > 0 ? currentHp / maxHp : 0) * 100)}%` }}
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

        {/* Rage bar */}
        <div className="h-4 bg-black/10 w-full overflow-hidden border-t-2 border-black/5 relative">
           <motion.div 
             className="h-full bg-pen-red" 
             animate={{ width: `${Math.min(100, isPlayer ? rage.player : rage.enemy)}%` }} 
             transition={{ duration: 0.3 }}
           />
           <div className={cn(
             "absolute inset-0 flex items-center justify-center text-[8px] font-black pointer-events-none",
             (isPlayer ? rage.player : rage.enemy) > 50 ? "text-white" : "text-pen-red"
           )}>
              Ярость: {Math.floor(isPlayer ? rage.player : rage.enemy)}%
           </div>
        </div>

        {/* Speed bar */}
        <div className="h-3 bg-black/5 w-full overflow-hidden relative border-t border-black/5">
           <motion.div 
             className="h-full bg-green-500" 
             animate={{ width: `${Math.min(100, isPlayer ? speedGauge.player : speedGauge.enemy)}%` }} 
             transition={{ duration: 0.3 }}
           />
           <div className={cn(
             "absolute inset-0 flex items-center justify-center text-[8px] font-black pointer-events-none",
             (isPlayer ? speedGauge.player : speedGauge.enemy) > 50 ? "text-white" : "text-pen-blue"
           )}>
              Скорость: {Math.floor(isPlayer ? speedGauge.player : speedGauge.enemy)}%
           </div>
        </div>
      </motion.div>
    );
});

const BattleContent: React.FC<{ side: 'left' | 'right', setProgress: React.Dispatch<React.SetStateAction<UserProgress>> }> = ({ side, setProgress }) => {
  const context = useContext(BattleContext);
  const navigate = useNavigate();

  if (!context || !context.enemy || !context.playerPet) {
    return (
      <div className="p-12 text-center h-full flex flex-col items-center justify-center font-bold text-pen-blue">
        {!context?.playerPet ? "Выберите питомца" : "Инициализация битвы..."}
      </div>
    );
  }

  const { playerPet, enemy, hp, rage, speedGauge, turn, winner, rewards, isEnemyHit, isPlayerHit, isPlayerAttacking, isEnemyAttacking, activeActionEffect, showUlt, isPlayerRegen, isEnemyRegen, handleAction, battleLog, debuffs, floatingDamages } = context;

  if (side === 'left') {
    return (
      <div className="h-full flex flex-col pt-4 pb-8 px-4 relative overflow-hidden ledger-grid">
        <AnimatePresence>
          {showUlt && <UltAnimation element={playerPet.element} />}
          {floatingDamages.map(d => (
            <DamageNumber key={d.id} damage={d} />
          ))}
        </AnimatePresence>
        
        <div className="flex-1 relative mb-2 min-h-[550px]">
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

          <div className="absolute top-20 left-[5%] w-[44.5%] flex justify-start z-30">
             <BattleCard pet={playerPet} currentHp={hp.player} maxHp={getEffectiveStat(playerPet, 'health')} isPlayer={true} rage={rage} speedGauge={speedGauge} opponent={enemy} sideDebuffs={debuffs.player} isHit={isPlayerHit} />
          </div>

          <div className="absolute bottom-20 right-[5%] w-[44.5%] flex justify-end z-10">
             <BattleCard pet={enemy} currentHp={hp.enemy} maxHp={getEffectiveStat(enemy, 'health')} isPlayer={false} rage={rage} speedGauge={speedGauge} opponent={playerPet} sideDebuffs={debuffs.enemy} isHit={isEnemyHit} />
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
                  <div className={cn("flex items-center justify-center rounded-full w-full h-full", rage.player >= 100 ? "bg-sticker-yellow/10" : "bg-transparent")}>
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

        <div className="flex flex-col bg-[#fdfaf3]/40 border border-pen-blue/20 p-2 overflow-hidden relative rounded-xl h-[200px] mb-4">
           <div className="text-[9px] font-black text-pen-blue/30 mb-1 tracking-[0.2em] italic border-b border-pen-blue/5 pb-0.5">Журнал боя:</div>
           <div className="flex flex-col gap-1 flex-1 pt-1 overflow-y-auto">
              {battleLog.map((log, i) => (
                <motion.div 
                   key={`${i}-${log.length}`}
                   initial={{ opacity: 0, x: -10 }}
                   animate={{ opacity: 1, x: 0 }}
                   className="text-[12px] font-black italic py-1 leading-[1.2] text-pen-blue"
                >
                  {i === 0 ? <Typewriter text={log} delay={20} className="text-pen-blue" /> : log}
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
          <LogoAnimation />
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
                  <span className="text-[28px] font-black text-pen-blue italic">{rewards?.sprouts || 0} 🌱</span>
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
                 const playerWon = winner === 'player';
                 setProgress(prev => ({
                   ...prev,
                   totalBattles: (prev.totalBattles || 0) + 1,
                   wonBattles: playerWon ? (prev.wonBattles || 0) + 1 : (prev.wonBattles || 0),
                   lostBattles: !playerWon ? (prev.lostBattles || 0) + 1 : (prev.lostBattles || 0),
                 }));
                 resetBattleState();
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
