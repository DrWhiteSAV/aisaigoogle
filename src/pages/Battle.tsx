import React, { useState, useEffect, useMemo } from 'react';
import { Pet, UserProgress } from '../types';
import { GlassCard, NeonButton } from '../components/UI';
import { motion, AnimatePresence } from 'motion/react';
import { Sword, Shield, Zap, Sparkles, Coins } from 'lucide-react';
import { cn } from '../lib/utils';

export const Battle: React.FC<{ progress: UserProgress; setProgress: React.Dispatch<React.SetStateAction<UserProgress>> }> = ({ progress, setProgress }) => {
  const pet = useMemo(() => progress.pets.find(p => p.id === progress.activePetId)!, [progress.pets, progress.activePetId]);
  const [enemy, setEnemy] = useState<Pet | null>(null);
  const [battleLog, setBattleLog] = useState<string[]>(['Битва началась!']);
  const [hp, setHp] = useState({ player: pet.stats.health, enemy: pet.stats.health * 1.2 });
  const [turn, setTurn] = useState<'player' | 'enemy'>('player');
  const [winner, setWinner] = useState<string | null>(null);
  const [rewards, setRewards] = useState<{ rubles: number; xp: number } | null>(null);
  const [isEnemyHit, setIsEnemyHit] = useState(false);
  const [isPlayerHit, setIsPlayerHit] = useState(false);

  useEffect(() => {
    // Generate a simulated enemy
    setEnemy({
      ...pet,
      id: 'enemy-1',
      name: 'Меха-Тень',
      stats: {
        attack: Math.max(1, pet.stats.attack + Math.floor(Math.random() * 4 - 2)),
        defense: Math.max(1, pet.stats.defense + Math.floor(Math.random() * 4 - 2)),
        speed: pet.stats.speed,
        magic: pet.stats.magic,
        regeneration: pet.stats.regeneration,
        health: Math.floor(pet.stats.health * 1.2),
      },
      image: "https://picsum.photos/seed/enemy/400/400",
    });
    setHp({ player: pet.stats.health, enemy: Math.floor(pet.stats.health * 1.2) });
  }, [pet]);

  const handleAction = (type: 'attack' | 'skill' | 'defend') => {
    if (turn !== 'player' || winner) return;

    let damage = 0;
    let log = '';

    if (type === 'attack') {
      damage = Math.max(1, pet.stats.attack - (enemy?.stats.defense || 0) / 4);
      log = `${pet.name} атакует и наносит ${damage.toFixed(0)} урона!`;
    } else if (type === 'skill') {
      damage = Math.max(2, pet.stats.magic * 1.5);
      log = `${pet.name} использует мощный навык и наносит ${damage.toFixed(0)} ед. урона!`;
    } else {
       log = `${pet.name} встает в защитную стойку!`;
    }

    const newEnemyHp = Math.max(0, hp.enemy - damage);
    setHp(prev => ({ ...prev, enemy: newEnemyHp }));
    setBattleLog(prev => [log, ...prev]);
    
    if (damage > 0) {
      setIsEnemyHit(true);
      setTimeout(() => setIsEnemyHit(false), 300);
    }
    
    if (newEnemyHp <= 0) {
      handleVictory();
    } else {
      setTurn('enemy');
      setTimeout(enemyTurn, 800);
    }
  };

  const enemyTurn = () => {
    if (!enemy || winner) return;

    const damage = Math.max(1, enemy.stats.attack - pet.stats.defense / 4);
    const newPlayerHp = Math.max(0, hp.player - damage);
    setHp(prev => ({ ...prev, player: newPlayerHp }));
    setBattleLog(prev => [`${enemy.name} наносит ответный удар: ${damage.toFixed(0)}!`, ...prev]);
    
    if (damage > 0) {
      setIsPlayerHit(true);
      setTimeout(() => setIsPlayerHit(false), 300);
    }
    
    if (newPlayerHp <= 0) {
      setWinner('Враг');
    } else {
      setTurn('player');
    }
  };

  const handleVictory = () => {
    const rublesAwarded = Math.floor(Math.random() * 200) + 100;
    const xpAwarded = 50;
    setWinner('Игрок');
    setRewards({ rubles: rublesAwarded, xp: xpAwarded });

    setProgress(prev => ({
      ...prev,
      currency: prev.currency + rublesAwarded,
      pets: prev.pets.map(p => p.id === pet.id ? { ...p, experience: p.experience + xpAwarded } : p)
    }));
  };

  if (!enemy) return null;

  return (
    <div className="min-h-screen bg-[#050510] p-6 flex flex-col items-center justify-between pb-32 pt-12">
      <div className="w-full max-w-4xl grid grid-cols-2 gap-12 items-center">
        {/* Enemy Side */}
        <motion.div 
          className={cn("flex flex-col items-center gap-4", isEnemyHit && "animate-shake animate-flash")}
          animate={{ x: turn === 'enemy' ? [0, -20, 0] : 0 }}
        >
          <div className="relative">
            <GlassCard className="p-0 overflow-hidden w-48 h-48 sm:w-64 sm:h-64 border-neon-pink/50">
              <img src={enemy.image} className="w-full h-full object-cover grayscale opacity-80" />
            </GlassCard>
            <div className="absolute -top-4 -right-4 h-12 w-12 rounded-full border-4 border-[#050510] bg-neon-pink flex items-center justify-center font-bold">
               {hp.enemy.toFixed(0)}
            </div>
          </div>
          <span className="font-black italic text-neon-pink uppercase">Mirror AI: {enemy.name}</span>
        </motion.div>

        {/* Player Side */}
        <motion.div 
          className={cn("flex flex-col items-center gap-4", isPlayerHit && "animate-shake animate-flash")}
          animate={{ x: turn === 'player' ? [0, 20, 0] : 0 }}
        >
          <div className="relative">
            <GlassCard className="p-0 overflow-hidden w-48 h-48 sm:w-64 sm:h-64 border-neon-blue/50">
              <img src={pet.image} className="w-full h-full object-cover" />
            </GlassCard>
            <div className="absolute -top-4 -left-4 h-12 w-12 rounded-full border-4 border-[#050510] bg-neon-blue flex items-center justify-center font-bold">
               {hp.player.toFixed(0)}
            </div>
          </div>
          <span className="font-black italic text-neon-blue uppercase">{pet.name}</span>
        </motion.div>
      </div>

      {/* Battle Log */}
      <GlassCard className="w-full max-w-xl h-32 overflow-y-auto no-scrollbar bg-black/40 border-white/5 my-8">
        <div className="space-y-1">
          {battleLog.map((msg, i) => (
            <div key={i} className={`text-xs ${i === 0 ? 'text-white' : 'text-white/30'}`}>
              [{battleLog.length - i}] {msg}
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Controls */}
      <div className="w-full max-w-xl grid grid-cols-3 gap-4">
        <NeonButton 
          variant="pink" 
          onClick={() => handleAction('attack')} 
          disabled={turn !== 'player' || !!winner}
          className="flex flex-col items-center py-4"
        >
          <Sword className="h-6 w-6 mb-1" />
          <span className="text-[10px] uppercase">Удар</span>
        </NeonButton>
        <NeonButton 
          variant="purple" 
          onClick={() => handleAction('skill')} 
          disabled={turn !== 'player' || !!winner}
          className="flex flex-col items-center py-4"
        >
          <Sparkles className="h-6 w-6 mb-1" />
          <span className="text-[10px] uppercase">Ульта</span>
        </NeonButton>
        <NeonButton 
          variant="blue" 
          onClick={() => handleAction('defend')} 
          disabled={turn !== 'player' || !!winner}
          className="flex flex-col items-center py-4"
        >
          <Shield className="h-6 w-6 mb-1" />
          <span className="text-[10px] uppercase">Блок</span>
        </NeonButton>
      </div>

      <AnimatePresence>
        {winner && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6"
          >
            <GlassCard className="text-center p-12 max-w-sm border-neon-blue">
              <h2 className="text-5xl font-black italic mb-4 uppercase">
                {winner === 'Игрок' ? 'ПОБЕДА!' : 'ПОРАЖЕНИЕ'}
              </h2>
              {rewards && winner === 'Игрок' && (
                <div className="flex justify-center gap-6 mb-8">
                  <div className="flex flex-col items-center gap-1">
                    <Coins className="h-6 w-6 text-rarity-legendary" />
                    <span className="text-lg font-black text-white">+{rewards.rubles} ₽</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <Zap className="h-6 w-6 text-neon-blue" />
                    <span className="text-lg font-black text-white">+{rewards.xp} XP</span>
                  </div>
                </div>
              )}
              <p className="text-white/50 mb-8">
                {winner === 'Игрок' ? 'Твой зверь стал сильнее!' : 'Попробуй еще раз после тренировки.'}
              </p>
              <NeonButton variant="purple" onClick={() => window.location.href = '/main'} className="w-full font-black italic">
                ВЕРНУТЬСЯ
              </NeonButton>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
