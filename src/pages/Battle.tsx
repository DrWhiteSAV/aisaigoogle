import React, { useState, useEffect, useMemo, useCallback, createContext, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Pet, UserProgress } from '../types';
import { NeonButton } from '../components/UI';
import { motion, AnimatePresence } from 'motion/react';
import { Sword, Shield, Zap, Coins, Flame } from 'lucide-react';
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

  // If we are on the left side, we might be the "Master" component if we were rendered alone.
  // But since App.tsx renders both, we need a way to share state.
  // For simplicity since I can't easily add a wrapper around both <Page> in FlipBook without breaking it, 
  // I will use a simple global singleton for the CURRENT battle state if it matches the current pet/location.
  
  return (
    <BattleProvider progress={progress} setProgress={setProgress} playerPet={playerPet || null} toggleFlipLock={toggleFlipLock}>
      <BattleContent side={side} />
    </BattleProvider>
  );
};

// Global singleton to sync two instances of the same battle
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

  // Notify other instances when state changes
  useEffect(() => {
    if (globalBattleState && globalBattleState.petId === playerPet?.id && globalBattleState.state === state) {
      // Use a timeout to ensure we don't trigger state updates in other components 
      // while this component is still in its render/mount phase
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
  }, [playerPet?.id]);

  useEffect(() => {
    if (toggleFlipLock) {
      toggleFlipLock(lockId, !!state.winner);
    }
  }, [state.winner, toggleFlipLock, lockId]);

  const calculateDamage = useCallback((attacker: Pet, defender: Pet, isUlt: boolean = false, targetIsBlocking: boolean = false) => {
    if (!attacker?.stats || !defender?.stats) return 0;
    const elemMult = getElementAdvantageMultiplier(attacker.element, defender.element);
    const attrMult = getAttributeDefenseMultiplier(attacker.attribute, defender.attribute);
    const baseDmg = isUlt ? ((attacker.stats.attack || 0) + (attacker.stats.magic || 0)) * 1.8 : (attacker.stats.attack || 0);
    let finalDmg = Math.max(1, (baseDmg * elemMult) - ((defender.stats.defense || 0) * attrMult));
    if (targetIsBlocking) finalDmg = Math.floor(finalDmg / 2);
    return Math.floor(finalDmg);
  }, []);

  const handleEndBattle = useCallback((playerWon: boolean, currentEnemy: Pet) => {
    if (!currentEnemy || !playerPet) return;
    const playerCP = calculateCP(playerPet);
    const enemyCP = calculateCP(currentEnemy);
    const cpRatio = enemyCP / (playerCP || 1); 
    const xpBase = getNextLevelReward(playerPet.level, playerWon);
    const xpAwarded = Math.floor(xpBase * cpRatio);
    const rublesAwarded = playerWon ? Math.floor(150 * cpRatio) : 20;

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
    const shouldBlock = enemyIsLow && Math.random() > 0.5;

    if (shouldBlock) {
      syncState({ isEnemyBlocking: true, battleLog: [`[Враг] ${currentEnemy.name} блокирует следующий удар!`, ...state.battleLog] });
      setTimeout(() => syncState({ turn: 'player' }), 1000);
      return;
    }

    const useUlt = currentRage.enemy >= 100;
    const speed = currentEnemy.stats?.speed || 1;
    const hits = useUlt ? 1 : Math.max(1, Math.min(3, Math.floor(speed / 15)));

    let currentPlayerHp = currentHp.player;
    let newRage = { ...currentRage };

    for (let i = 0; i < hits; i++) {
        if (state.winner || currentPlayerHp <= 0) break;
        const damage = calculateDamage(currentEnemy, playerPet, useUlt, currentIsPlayerBlocking);
        const log = useUlt 
          ? `[Враг] ${currentEnemy.name} использует СПОСОБНОСТЬ: ${damage} урона!`
          : `[Враг] ${currentEnemy.name} ударяет: ${damage} урона!`;

        currentPlayerHp = Math.max(0, currentPlayerHp - damage);
        newRage = {
          enemy: useUlt ? 0 : Math.min(100, newRage.enemy + 12),
          player: Math.min(100, newRage.player + 15)
        };
        
        syncState({ 
          hp: { ...currentHp, player: currentPlayerHp },
          rage: newRage,
          battleLog: [log, ...state.battleLog],
          isPlayerHit: true
        });
        
        setTimeout(() => syncState({ isPlayerHit: false }), 300);
        await new Promise(r => setTimeout(r, 600));
    }

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

    if (type === 'block') {
      syncState({ isPlayerBlocking: true, battleLog: [`${playerPet.name} уходит в защиту (урон -50%)`, ...state.battleLog] });
      setTimeout(() => {
        syncState({ turn: 'enemy' });
        performEnemyTurn(state.enemy!, state.hp, state.rage, true);
      }, 1000);
      return;
    }

    let hits = 1;
    if (type === 'attack') {
      const speed = playerPet.stats?.speed || 1;
      hits = Math.max(1, Math.min(3, Math.floor(speed / 15)));
    }

    let currentEnemyHp = state.hp.enemy;
    let newRage = { ...state.rage };

    for (let i = 0; i < hits; i++) {
        if (state.winner || currentEnemyHp <= 0) break;
        
        let damage = 0;
        let log = '';

        if (type === 'attack') {
          damage = calculateDamage(playerPet, state.enemy, false, state.isEnemyBlocking);
          log = `${playerPet.name} атакует: ${damage} урона!`;
        } else if (type === 'ult') {
          damage = calculateDamage(playerPet, state.enemy, true, state.isEnemyBlocking);
          log = `УЛЬТА: ${playerPet.name} наносит ${damage} урона!`;
          newRage.player = 0;
          syncState({ showUlt: true });
          setTimeout(() => syncState({ showUlt: false }), 1500);
        }

        if (damage > 0) {
          currentEnemyHp = Math.max(0, currentEnemyHp - damage);
          newRage = {
            player: type === 'ult' ? 0 : Math.min(100, newRage.player + 12),
            enemy: Math.min(100, newRage.enemy + 15)
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
    }

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
      // Double check if already initialized globally to prevent double energy drain
      if (globalBattleState && globalBattleState.petId === playerPet.id && globalBattleState.state.enemy) {
        setState(globalBattleState.state);
        return;
      }

      if (progress.energy < 1) {
        navigate('/main');
        return;
      }

      const playerCP = calculateCP(playerPet);
      const cpModifier = 0.8 + (Math.random() * 0.4); 

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
        }
      };

      const initialHp = playerPet.stats?.health || 100;
      const initialTurn = (playerPet.stats?.speed || 0) >= (mockEnemy.stats?.speed || 0) ? 'player' : 'enemy';
      
      const newState = {
        enemy: mockEnemy,
        hp: { player: initialHp, enemy: mockEnemy.stats.health },
        turn: initialTurn,
      };

      syncState(newState);
      setProgress(prev => ({ ...prev, energy: prev.energy - 1 }));

      if (initialTurn === 'enemy') {
        setTimeout(() => performEnemyTurn(mockEnemy, { player: initialHp, enemy: mockEnemy.stats.health }, { player: 0, enemy: 0 }, false), 1500);
      }
    }
  }, [playerPet?.id, location.pathname]);

  const value = useMemo(() => ({ ...state, handleAction, playerPet }), [state, handleAction, playerPet]);

  return <BattleContext.Provider value={value}>{children}</BattleContext.Provider>;
};

const BattleContent: React.FC<{ side: 'left' | 'right' }> = ({ side }) => {
  const context = useContext(BattleContext);
  const navigate = useNavigate();

  if (!context || !context.enemy || !context.playerPet) {
    return (
      <div className="p-12 text-center h-full flex flex-col items-center justify-center font-bold text-pen-blue">
        {!context?.playerPet ? "Выберите питомца" : "Загрузка поля боя..."}
      </div>
    );
  }

  const { playerPet, enemy, hp, rage, turn, winner, rewards, isEnemyHit, isPlayerHit, showUlt, isPlayerBlocking, isEnemyBlocking, handleAction, battleLog } = context;

  // Helper for the "Gallery Card" style inside battle
  const BattleCard = ({ pet, currentHp, isPlayer, isHit, isBlocking, isTop }: { pet: Pet, currentHp: number, isPlayer: boolean, isHit?: boolean, isBlocking?: boolean, isTop?: boolean }) => (
    <motion.div 
      animate={{ 
        scale: (isPlayer ? (turn === 'player' ? 1.05 : 1) : (turn === 'enemy' ? 1.05 : 1)),
        y: isHit ? [0, -10, 10, -5, 5, 0] : 0,
        z: isTop ? 50 : 0
      }}
      className={cn(
        "relative w-[70%] aspect-[3/4] bg-[#fdfaf3] border-[3px] border-pen-blue shadow-lg overflow-hidden flex flex-col p-2 select-none",
        isPlayer ? "rotate-[-2deg]" : "rotate-[2deg] opacity-90",
        !isPlayer && "grayscale-[0.4]"
      )}
    >
      {/* Mini Header Inside Card */}
      <div className="flex justify-between items-center mb-1 pb-1 border-b border-pen-blue/10">
        <span className="text-[10px] font-black text-pen-blue uppercase tracking-tighter">{pet.name}</span>
        <span className="text-[9px] font-black text-pen-blue/40">LVL {pet.level}</span>
      </div>

      {/* Image Area */}
      <div className="relative flex-1 bg-white border-2 border-pen-blue/5 overflow-hidden mb-2">
        <img src={pet.image} className="w-full h-full object-cover" alt={pet.name} />
        {isBlocking && (
          <div className="absolute inset-0 bg-pen-blue/20 flex items-center justify-center">
            <Shield className="w-12 h-12 text-pen-blue/60" />
          </div>
        )}
      </div>

      {/* Stats Bar (Gallery Style) */}
      <div className="grid grid-cols-4 gap-1">
         <div className="flex flex-col items-center bg-pen-blue/5 p-0.5 rounded">
            <Sword className="w-2.5 h-2.5 text-pen-blue/40" />
            <span className="text-[8px] font-black text-pen-blue">{pet.stats?.attack}</span>
         </div>
         <div className="flex flex-col items-center bg-pen-blue/5 p-0.5 rounded">
            <Shield className="w-2.5 h-2.5 text-pen-blue/40" />
            <span className="text-[8px] font-black text-pen-blue">{pet.stats?.defense}</span>
         </div>
         <div className="flex flex-col items-center bg-pen-blue/5 p-0.5 rounded">
            <Zap className="w-2.5 h-2.5 text-pen-blue/40" />
            <span className="text-[8px] font-black text-pen-blue">{pet.stats?.speed}</span>
         </div>
         <div className="flex flex-col items-center bg-pen-blue/5 p-0.5 rounded">
            <Flame className="w-2.5 h-2.5 text-pen-blue/40" />
            <span className="text-[8px] font-black text-pen-blue">{pet.stats?.magic}</span>
         </div>
      </div>

      {/* Rage Line */}
      <div className="absolute bottom-0 left-0 h-1 w-full bg-black/5">
        <motion.div 
          className="h-full bg-sticker-yellow" 
          animate={{ width: `${isPlayer ? rage.player : rage.enemy}%` }} 
        />
      </div>
    </motion.div>
  );

  if (side === 'left') {
    return (
      <div className="h-full flex flex-col py-8 px-2 relative overflow-hidden">
        {/* Top Health Bars Section */}
        <div className="w-full space-y-4 mb-6">
          {/* Player HP Above Card */}
          <div className="space-y-1">
            <div className="flex justify-between items-end px-1">
              <span className="text-[11px] font-black text-pen-blue italic uppercase">{playerPet.name}</span>
              <span className="text-[10px] font-black text-pen-blue">{Math.max(0, Math.floor(hp.player))} / {playerPet.stats?.health}</span>
            </div>
            <div className="h-2.5 bg-black/5 rounded-full border-2 border-pen-blue overflow-hidden shadow-inner">
              <motion.div className="h-full bg-pen-blue" animate={{ width: `${(hp.player / (playerPet.stats?.health || 100)) * 100}%` }} />
            </div>
          </div>

          {/* Enemy HP Above Card */}
          <div className="space-y-1">
            <div className="flex justify-between items-end px-1">
              <span className="text-[11px] font-black text-pen-blue/40 italic uppercase text-right w-full">{enemy.name}</span>
            </div>
            <div className="h-2.5 bg-black/5 rounded-full border-2 border-black/20 overflow-hidden shadow-inner flex justify-end">
              <motion.div className="h-full bg-pen-red" animate={{ width: `${(hp.enemy / (enemy.stats?.health || 100)) * 100}%` }} />
            </div>
            <div className="text-[9px] font-black text-pen-blue/30 text-right">{Math.max(0, Math.floor(hp.enemy))} / {enemy.stats?.health}</div>
          </div>
        </div>

        {/* Action Area: Cards + Vertical Buttons */}
        <div className="flex-1 relative mb-4">
          <AnimatePresence>
            {showUlt && (
              <motion.div 
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [1, 1.5, 0], opacity: [0, 1, 0] }}
                className="absolute inset-0 flex items-center justify-center z-[100] pointer-events-none"
              >
                <div className="bg-sticker-yellow text-pen-blue font-black text-4xl px-6 py-2 border-4 border-black rotate-[-15deg] shadow-lg">
                  МЕГА УДАР!
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Enemy Card (Bottom-Right, Behind) */}
          <div className="absolute bottom-4 right-2 w-full flex justify-end z-0">
             <BattleCard pet={enemy} currentHp={hp.enemy} isPlayer={false} isHit={isEnemyHit} isBlocking={isEnemyBlocking} />
          </div>

          {/* Molniya / Lightning Break Effect in middle over cards */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
             <div className="h-full w-12 opacity-10 bg-gradient-to-r from-transparent via-pen-blue to-transparent transform -skew-x-[20deg]" />
          </div>

          {/* Player Card (Top-Left, Front) */}
          <div className="absolute top-4 left-2 w-full flex justify-start z-30">
             <BattleCard pet={playerPet} currentHp={hp.player} isPlayer={true} isHit={isPlayerHit} isBlocking={isPlayerBlocking} isTop />
          </div>

          {/* Vertical Action Buttons in the Center overlap */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] flex flex-col gap-3">
             <button 
                disabled={turn !== 'player' || !!winner}
                onClick={() => handleAction('attack')}
                className={cn(
                  "w-12 h-12 flex items-center justify-center rounded-full border-2 border-black transition-all bg-[#fdfaf3]",
                  turn === 'player' ? "hover:scale-110 active:scale-95" : "opacity-30 grayscale cursor-not-allowed"
                )}
             >
                <Sword className="w-6 h-6 text-pen-blue" />
             </button>
             <button 
                disabled={turn !== 'player' || rage.player < 100 || !!winner}
                onClick={() => handleAction('ult')}
                className={cn(
                  "w-12 h-12 flex items-center justify-center rounded-full border-2 border-black transition-all",
                  turn === 'player' && rage.player >= 100 ? "bg-sticker-yellow animate-pulse scale-110" : "bg-white/50 opacity-30 grayscale cursor-not-allowed"
                )}
             >
                <Zap className={cn("w-6 h-6 text-pen-blue", rage.player >= 100 && "fill-current")} />
             </button>
             <button 
                disabled={turn !== 'player' || !!winner}
                onClick={() => handleAction('block')}
                className={cn(
                  "w-12 h-12 flex items-center justify-center rounded-full border-2 border-black transition-all bg-[#fdfaf3]",
                  turn === 'player' ? "hover:scale-110 active:scale-95" : "opacity-30 grayscale cursor-not-allowed"
                )}
             >
                <Shield className="w-6 h-6 text-pen-blue" />
             </button>
          </div>
        </div>

        {/* Battle Log at the bottom */}
        <div className="h-32 bg-black/5 border-2 border-black/5 p-3 overflow-y-auto ledger-grid relative rounded">
           <div className="text-[9px] font-black text-pen-blue/20 mb-2 uppercase tracking-widest sticky top-0 bg-transparent">Лог сражения</div>
           <div className="space-y-1.5">
              {battleLog.map((log, i) => (
                <div key={i} className={cn("text-[11px] font-bold leading-tight", i === 0 ? "text-pen-blue" : "text-pen-blue/30")}>
                  {i === 0 ? "» " : ""} {log}
                </div>
              ))}
           </div>
        </div>
      </div>
    );
  }

  // RIGHT SIDE - Show results or empty
  return (
    <div className="h-full flex flex-col justify-center px-4">
      <AnimatePresence>
        {!winner ? (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="flex flex-col items-center gap-4 text-center"
          >
             <div className="text-4xl font-black text-pen-blue/5 italic uppercase">Битва в разгаре</div>
             <Sword className="w-16 h-16 text-pen-blue/5 animate-bounce" />
          </motion.div>
        ) : (
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white border-2 border-black p-6 text-center space-y-6 rotate-1 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
          >
            <h2 className="text-4xl font-black text-pen-blue tracking-tighter">
              {winner === 'player' ? 'ПОБЕДА!' : 'ФИАСКО'}
            </h2>
            
            <div className="space-y-3 py-4 border-y-2 border-black/5">
               <div className="flex justify-between items-center text-lg font-black text-pen-blue">
                  <span>Монеты:</span>
                  <span>+{rewards?.rubles || 0} ₽</span>
               </div>
               <div className="flex justify-between items-center text-lg font-black text-pen-blue">
                  <span>Опыт:</span>
                  <span>+{rewards?.xp || 0} XP</span>
               </div>
            </div>

            <div className="bg-pen-blue/5 p-3 rounded text-left">
               <div className="text-[9px] font-black text-pen-blue/30 uppercase mb-1">Итоговое достижение</div>
               <div className="text-xs font-bold text-pen-blue italic">
                  {winner === 'player' 
                    ? "Ваш питомец проявил небывалую храбрость и одолел противника!" 
                    : "Поражение - лишь шаг к будущим победам. Тренируйтесь усерднее!"}
               </div>
            </div>

            <NeonButton onClick={() => navigate('/main')} className="w-full py-4 bg-sticker-yellow border-2 border-black text-xl font-black">
              ЗАКОНЧИТЬ
            </NeonButton>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
