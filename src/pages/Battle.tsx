import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Pet, UserProgress } from '../types';
import { GlassCard, NeonButton, HandwrittenText } from '../components/UI';
import { motion, AnimatePresence } from 'motion/react';
import { Sword, Shield, Zap, Sparkles, Coins, Flame, Droplets, Wind, Mountain, Sun, Moon, Ghost, Clock } from 'lucide-react';
import { cn } from '../lib/utils';
import { getElementAdvantageMultiplier, getAttributeDefenseMultiplier, calculateCP, getExpNeeded, getNextLevelReward, checkLevelUp } from '../lib/gameLogic';

export const Battle: React.FC<{ progress: UserProgress; setProgress: React.Dispatch<React.SetStateAction<UserProgress>> }> = ({ progress, setProgress }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const playerPet = useMemo(() => (progress.pets || []).find(p => p.id === progress.activePetId), [progress.pets, progress.activePetId]);
  const [enemy, setEnemy] = useState<Pet | null>(null);
  const [battleLog, setBattleLog] = useState<string[]>(['Битва началась!']);
  
  // HP must be initialized safely
  const [hp, setHp] = useState({ 
    player: playerPet?.stats?.health ?? 100, 
    enemy: 100 
  });
  const [rage, setRage] = useState({ player: 0, enemy: 0 });
  const [turn, setTurn] = useState<'player' | 'enemy' | 'waiting'>('waiting');
  const [winner, setWinner] = useState<'player' | 'enemy' | null>(null);
  const [rewards, setRewards] = useState<{ rubles: number; xp: number } | null>(null);
  const [isEnemyHit, setIsEnemyHit] = useState(false);
  const [isPlayerHit, setIsPlayerHit] = useState(false);
  const [showUlt, setShowUlt] = useState(false);

  useEffect(() => {
    if (!location.pathname.startsWith('/battle')) return;
    
    if (!playerPet) {
      navigate('/main');
      return;
    }
    
    if (progress.energy < 1) {
      navigate('/main');
      return;
    }

    const playerCP = calculateCP(playerPet);
    // Range 40% higher or lower
    const cpModifier = 0.6 + (Math.random() * 0.8); 
    const targetCP = playerCP * cpModifier;

    // Mock Enemy based on player CP
    const mockEnemy: Pet = {
      ...playerPet,
      id: 'enemy-' + Date.now(),
      name: 'Призрачный Отражатель',
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

    setEnemy(mockEnemy);
    setHp({ player: playerPet.stats?.health || 100, enemy: mockEnemy.stats.health });
    
    // Who starts?
    if ((playerPet.stats?.speed || 0) >= (mockEnemy.stats?.speed || 0)) {
      setTurn('player');
    } else {
      setTurn('enemy');
      setTimeout(() => performEnemyTurn(mockEnemy), 1000);
    }

    // Spend energy
    setProgress(prev => ({ ...prev, energy: prev.energy - 1 }));
  }, []);

  const calculateDamage = useCallback((attacker: Pet, defender: Pet, isUlt: boolean = false) => {
    if (!attacker?.stats || !defender?.stats) return 0;
    const elemMult = getElementAdvantageMultiplier(attacker.element, defender.element);
    const attrMult = getAttributeDefenseMultiplier(attacker.attribute, defender.attribute);

    const baseDmg = isUlt ? ((attacker.stats.attack || 0) + (attacker.stats.magic || 0)) * 1.5 : (attacker.stats.attack || 0);
    const finalDmg = Math.max(1, (baseDmg * elemMult) - ((defender.stats.defense || 0) * attrMult));
    return Math.floor(finalDmg);
  }, []);

  const handleAction = async (type: 'attack' | 'ult' | 'defend') => {
    if (turn !== 'player' || winner || !enemy) return;

    let hits = 1;
    // Speed-based multi-attacks: speed ratio
    if (type === 'attack') {
      const speed = playerPet?.stats?.speed || 1;
      // Proportional hits: speed of 20 = 2 hits, 30 = 3 hits. Divisor of 10.
      hits = Math.max(1, Math.min(5, Math.floor(speed / 10)));
    }

    setTurn('waiting');

    let currentEnemyHp = hp.enemy;
    for (let i = 0; i < hits; i++) {
        if (winner || currentEnemyHp <= 0) break;
        
        let damage = 0;
        let log = '';

        if (type === 'attack') {
          damage = calculateDamage(playerPet, enemy);
          log = `${playerPet.name} наносит ${damage} урона! ${hits > 1 ? `(Удар ${i + 1}/${hits})` : ''}`;
        } else if (type === 'ult') {
          damage = calculateDamage(playerPet, enemy, true);
          log = `${playerPet.name} высвобождает УЛЬТУ [${playerPet.element}] и наносит ${damage} урона!`;
          setRage(prev => ({ ...prev, player: 0 }));
          setShowUlt(true);
          setTimeout(() => setShowUlt(false), 1500);
        } else if (type === 'defend') {
          const regen = playerPet.stats?.regeneration || 0;
          log = `${playerPet.name} восстанавливает ${regen} HP!`;
          setHp(prev => ({ ...prev, player: Math.min(playerPet.stats?.health || 100, prev.player + regen) }));
        }

        if (damage > 0) {
          currentEnemyHp -= damage;
          setHp(prev => ({ ...prev, enemy: Math.max(0, currentEnemyHp) }));
          setRage(prev => ({ 
            player: Math.min(100, prev.player + 10), 
            enemy: Math.min(100, prev.enemy + 15)
          }));
          setIsEnemyHit(true);
          setTimeout(() => setIsEnemyHit(false), 300);
        }

        // Passive Regen for player
        if ((playerPet.stats?.regeneration || 0) > 0 && i === hits - 1) {
            const regen = playerPet.stats?.regeneration || 0;
            setHp(prev => ({ ...prev, player: Math.min(playerPet.stats?.health || 100, prev.player + regen) }));
            setBattleLog(prev => [`${playerPet.name} восстанавливает ${regen} HP`, ...prev]);
        }
        
        setBattleLog(prev => [log, ...prev]);
        await new Promise(r => setTimeout(r, 600));
    }

    if (currentEnemyHp > 0 && !winner) {
        setTurn('enemy');
        setTimeout(() => performEnemyTurn(enemy), 800);
    }
  };

  const handleEndBattle = useCallback((playerWon: boolean) => {
    if (!enemy || !playerPet) return;
    const playerCP = calculateCP(playerPet);
    const enemyCP = calculateCP(enemy);
    
    // Reward based on CP diff
    const cpRatio = enemyCP / (playerCP || 1); 
    const xpBase = getNextLevelReward(playerPet.level, playerWon);
    const xpAwarded = Math.floor(xpBase * cpRatio);
    const rublesAwarded = playerWon ? Math.floor(100 * cpRatio) : 10;

    setRewards({ rubles: rublesAwarded, xp: xpAwarded });

    if (playerWon) {
      setProgress(prev => ({
        ...prev,
        currency: prev.currency + rublesAwarded,
        pets: prev.pets.map(p => p.id === playerPet.id ? checkLevelUp({ ...p, experience: p.experience + xpAwarded }) : p)
      }));
    } else {
      // Small consolidation XP for losing
      setProgress(prev => ({
        ...prev,
        pets: prev.pets.map(p => p.id === playerPet.id ? checkLevelUp({ ...p, experience: p.experience + Math.floor(xpAwarded * 0.1) }) : p)
      }));
    }
  }, [enemy, playerPet, setProgress]);

  const performEnemyTurn = useCallback(async (currentEnemy: Pet) => {
    if (winner || !currentEnemy || !playerPet) return;

    const useUlt = rage.enemy >= 100;
    const speed = currentEnemy?.stats?.speed || 1;
    const hits = useUlt ? 1 : Math.max(1, Math.min(5, Math.floor(speed / 10)));

    let currentPlayerHp = hp.player;
    for (let i = 0; i < hits; i++) {
        if (winner || currentPlayerHp <= 0) break;

        const damage = calculateDamage(currentEnemy, playerPet, useUlt);
        const log = useUlt 
          ? `[ВРАГ] ${currentEnemy.name} ИСПОЛЬЗУЕТ УЛЬТУ: ${damage} УРОНА!`
          : `[ВРАГ] ${currentEnemy.name} наносит удар: ${damage}! ${hits > 1 ? `(${i+1}/${hits})` : ''}`;

        currentPlayerHp -= damage;
        setHp(prev => ({ ...prev, player: Math.max(0, currentPlayerHp) }));
        setRage(prev => ({ 
            enemy: useUlt ? 0 : Math.min(100, prev.enemy + 10),
            player: Math.min(100, prev.player + 15)
        }));
        
        setBattleLog(prev => [log, ...prev]);
        setIsPlayerHit(true);
        setTimeout(() => setIsPlayerHit(false), 300);

        // Passive Regen for enemy
        if ((currentEnemy?.stats?.regeneration || 0) > 0 && i === hits - 1) {
            const regen = currentEnemy.stats?.regeneration || 0;
            const maxHp = currentEnemy.stats?.health || 100;
            setHp(prev => ({ ...prev, enemy: Math.min(maxHp, prev.enemy + regen) }));
            setBattleLog(prev => [`[ВРАГ] ${currentEnemy.name} восстанавливает ${regen} HP`, ...prev]);
        }
        
        await new Promise(r => setTimeout(r, 600));
    }

    if (currentPlayerHp > 0 && !winner) {
        setTurn('player');
    }
  }, [winner, rage.enemy, playerPet?.stats?.speed, hp.player, calculateDamage, playerPet]);

  // Watch for HP changes
  useEffect(() => {
    if (hp.enemy <= 0 && !winner) {
      setWinner('player');
      handleEndBattle(true);
    } else if (hp.player <= 0 && !winner) {
      setWinner('enemy');
      handleEndBattle(false);
    }
  }, [hp, winner, handleEndBattle]);

  const UltAnimation = () => {
    const icons = {
      water: <Droplets className="w-64 h-64 text-blue-400" />,
      fire: <Flame className="w-64 h-64 text-red-500" />,
      air: <Wind className="w-64 h-64 text-cyan-300" />,
      earth: <Mountain className="w-64 h-64 text-amber-800" />,
      light: <Sun className="w-64 h-64 text-yellow-400" />,
      dark: <Moon className="w-64 h-64 text-indigo-900" />,
      void: <Ghost className="w-64 h-64 text-purple-600" />,
      time: <Clock className="w-64 h-64 text-slate-400" />
    };

    return (
      <motion.div 
        initial={{ scale: 0, opacity: 0, rotate: -45 }}
        animate={{ scale: [1, 1.2, 1], opacity: [0, 1, 1, 0], rotate: 45 }}
        transition={{ duration: 1.5 }}
        className="fixed inset-0 flex items-center justify-center z-[200] pointer-events-none"
      >
        <div className="relative">
             {playerPet && icons[playerPet.element as keyof typeof icons]}
             <div className="absolute inset-0 flex items-center justify-center">
                 {playerPet && icons[playerPet.attribute as keyof typeof icons]}
             </div>
        </div>
      </motion.div>
    );
  };

  if (!enemy || !playerPet) {
    return (
      <div className="p-12 text-center h-full flex flex-col items-center justify-center font-bold italic text-pen-blue">
        {!playerPet ? "Выберите питомца для битвы" : "Подготовка поля боя..."}
      </div>
    );
  }

  return (
    <div className="p-6 flex flex-col items-center pb-32 pt-12 max-w-6xl mx-auto min-h-screen relative">
      {/* Brand Header */}
      <div className="absolute top-4 left-6 flex items-center gap-2 opacity-40">
        <div className="h-8 w-8 bg-sticker-yellow border border-black rotate-6 flex items-center justify-center">
           <img src="https://i.ibb.co/k2PN7Q8y/aisailogo.png" alt="aiSai" className="h-5 w-5" />
        </div>
        <span className="text-xl font-black italic tracking-tighter text-pen-blue">aiSai BATTLE</span>
      </div>

      <AnimatePresence>
        {showUlt && <UltAnimation />}
      </AnimatePresence>

      <div className="w-full flex flex-col md:flex-row gap-12 items-center justify-center mb-10">
        {/* Enemy Side */}
        <motion.div 
          className={cn("flex flex-col items-center gap-4", isEnemyHit && "animate-shake")}
          animate={{ x: turn === 'enemy' ? [0, -20, 0] : 0 }}
        >
          <div className="relative">
            <GlassCard color="pink" noPadding className="border-2 border-black/10 w-32 h-56 sm:w-48 sm:h-80 overflow-hidden rotation-[-1deg]">
               <img src={enemy.image} className="w-full h-full object-cover opacity-90 block grayscale-[0.2]" />
            </GlassCard>
            
            {/* Enemy HP Bar Floating */}
            <div className="absolute -top-12 left-0 right-0 flex flex-col items-center gap-1 z-30">
               <div className="w-full h-4 bg-black/10 rounded-full overflow-hidden border-2 border-black backdrop-blur-sm">
                  <motion.div 
                    className="h-full bg-pen-red" 
                    animate={{ width: `${(hp.enemy / (enemy?.stats?.health || 100)) * 100}%` }} 
                  />
               </div>
               <div className="flex justify-between w-full px-1">
                  <div className="text-[10px] font-black text-pen-blue italic bg-white/80 px-1">HP: {Math.max(0, hp.enemy)} / {enemy?.stats?.health || 100}</div>
                  <div className="text-[10px] font-black text-pen-blue italic bg-white/80 px-1">CP: {calculateCP(enemy)}</div>
               </div>
            </div>
            
            {/* Rage Bar Enemy */}
            <div className="absolute -bottom-4 -left-4 flex flex-col items-start gap-1">
               <div className="w-24 h-2 bg-black/5 rounded-full overflow-hidden border border-black/5 rotate-3">
                  <motion.div 
                    className="h-full bg-sticker-yellow opacity-80" 
                    animate={{ width: `${rage.enemy}%` }} 
                  />
               </div>
               <div className="text-[10px] font-black text-pen-blue/40 italic">Ярость {rage.enemy}%</div>
            </div>
          </div>
          <div className="text-center">
            <span className="text-[10px] font-black text-pen-blue/40 italic">{enemy.rarity} • {enemy.element}</span>
            <h3 className="text-xl font-black italic text-pen-blue/60">Отражение</h3>
          </div>
        </motion.div>

        <div className="hidden md:flex flex-col items-center gap-2">
           <div className="text-4xl font-black italic text-pen-blue/5 uppercase tracking-tighter">VS</div>
        </div>

        {/* Player Side */}
        <motion.div 
           className={cn("flex flex-col items-center gap-4", isPlayerHit && "animate-shake")}
           animate={{ x: turn === 'player' ? [0, 20, 0] : 0 }}
        >
          <div className="relative">
            <GlassCard color="blue" noPadding className="border-2 border-black/10 w-32 h-56 sm:w-48 sm:h-80 overflow-hidden rotation-[1deg]">
               <img src={playerPet.image} className="w-full h-full object-cover block" />
            </GlassCard>

            {/* Player HP Bar Floating */}
            <div className="absolute -top-12 left-0 right-0 flex flex-col items-center gap-1 z-30">
               <div className="w-full h-4 bg-black/10 rounded-full overflow-hidden border-2 border-black backdrop-blur-sm">
                  <motion.div 
                    className="h-full bg-pen-blue" 
                    animate={{ width: `${(hp.player / (playerPet?.stats?.health || 100)) * 100}%` }} 
                  />
               </div>
               <div className="flex justify-between w-full px-1">
                  <div className="text-[10px] font-black text-pen-blue italic bg-white/80 px-1">HP: {Math.max(0, hp.player)} / {playerPet?.stats?.health || 100}</div>
                  <div className="text-[10px] font-black text-pen-blue italic bg-white/80 px-1">CP: {calculateCP(playerPet)}</div>
               </div>
            </div>

            {/* Rage Bar Player */}
            <div className="absolute -bottom-4 -right-4 flex flex-col items-end gap-1">
               <div className="w-24 h-2 bg-black/5 rounded-full overflow-hidden border border-black/5 -rotate-3">
                  <motion.div 
                    className="h-full bg-sticker-yellow opacity-80" 
                    animate={{ width: `${rage.player}%` }} 
                  />
               </div>
               <div className="text-[10px] font-black text-pen-blue/40 italic">Ярость {rage.player}%</div>
            </div>
          </div>
          <div className="text-center">
            <span className="text-[10px] font-black text-pen-blue/40 italic">{playerPet.rarity} • {playerPet.element}</span>
            <h3 className="text-xl font-black italic text-pen-blue leading-none">{playerPet.name}</h3>
          </div>
        </motion.div>
      </div>

      {/* Controls */}
      {!winner && turn === 'player' && (
        <div className="w-full max-w-xl grid grid-cols-2 gap-4 mb-8">
          <button 
            onClick={() => handleAction('attack')} 
            className="flex flex-col items-center p-4 bg-white border-2 border-black/10 hover:border-black/30 active:scale-95 transition-all shadow-sm"
          >
            <Sword className="h-8 w-8 mb-2" />
            <span className="text-[12px] font-black italic">Атака</span>
          </button>
          
          <button 
            onClick={() => handleAction('ult')} 
            disabled={rage.player < 100}
            className={cn(
              "flex flex-col items-center p-4 border-2 transition-all shadow-sm active:scale-95",
              rage.player >= 100 
                ? "bg-sticker-yellow border-black animate-pulse cursor-pointer" 
                : "bg-white border-black/10 opacity-50 cursor-not-allowed"
            )}
          >
            <Zap className={cn("h-8 w-8 mb-2", rage.player >= 100 && "fill-current")} />
            <span className="text-[12px] font-black italic">Ульта</span>
          </button>
        </div>
      )}

      {/* Battle Log */}
      <div className="w-full max-w-xl border-2 border-black/10 p-6 text-left relative bg-transparent mb-12">
        <div className="absolute top-2 right-4 text-[11px] font-black italic text-pen-blue/20">Протокол сражения</div>
        <div className="space-y-3">
          {battleLog.map((msg, i) => (
            <div key={i} className={cn(
              "text-base leading-snug",
              i === 0 ? 'text-pen-blue font-bold italic' : 'text-pen-blue/40 font-medium'
            )}>
              {i === 0 ? <HandwrittenText text={msg} speed={40} /> : `» ${msg}`}
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {winner && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-md p-6"
          >
            <GlassCard color={winner === 'player' ? "yellow" : "pink"} className="text-center p-12 max-w-sm border-2 border-black">
              <h2 className="text-6xl font-black italic mb-6 text-pen-blue tracking-tighter">
                {winner === 'player' ? 'Победа!' : 'Фиаско'}
              </h2>
              {rewards && (
                <div className="flex justify-center gap-8 mb-10">
                  <div className="flex flex-col items-center gap-2">
                    <Coins className="h-8 w-8 text-pen-blue/40" />
                    <span className="text-2xl font-black text-pen-blue">+{rewards.rubles} ₽</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <Zap className="h-8 w-8 text-pen-blue/40" />
                    <span className="text-2xl font-black text-pen-blue">+{rewards.xp} XP</span>
                  </div>
                </div>
              )}
              <NeonButton onClick={() => navigate('/main')} className="w-full font-black italic text-lg py-5">
                Вернуться
              </NeonButton>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
