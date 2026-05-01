import React, { useState, useEffect, useMemo } from 'react';
import { Pet, UserProgress } from '../types';
import { GlassCard, NeonButton, HandwrittenText } from '../components/UI';
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
    <div className="p-6 flex flex-col items-center justify-between pb-32 pt-12 max-w-6xl mx-auto min-h-screen">
      <div className="w-full grid grid-cols-2 gap-12 items-center mb-12">
        {/* Enemy Side */}
        <motion.div 
          className={cn("flex flex-col items-center gap-6", isEnemyHit && "animate-shake animate-flash")}
          animate={{ x: turn === 'enemy' ? [0, -20, 0] : 0 }}
        >
          <div className="relative">
            <GlassCard color="pink" className="p-4 border-2 border-pen-blue/20 w-48 h-48 sm:w-64 sm:h-64 hatching-shadow rotate-1">
               <div className="w-full h-full border-2 border-pen-blue/10 rounded-sm overflow-hidden bg-white">
                 <img src={enemy.image} className="w-full h-full object-cover opacity-80" />
               </div>
            </GlassCard>
            <div className="absolute -top-4 -right-4 h-14 w-14 bg-sticker-yellow border-2 border-pen-blue rotate-12 flex items-center justify-center font-black italic text-pen-blue shadow-sm">
               {hp.enemy.toFixed(0)}
            </div>
          </div>
          <span className="font-black italic text-pen-red uppercase tracking-tight text-xl">Mirror AI: {enemy.name}</span>
        </motion.div>

        {/* Player Side */}
        <motion.div 
          className={cn("flex flex-col items-center gap-6", isPlayerHit && "animate-shake animate-flash")}
          animate={{ x: turn === 'player' ? [0, 20, 0] : 0 }}
        >
          <div className="relative">
            <GlassCard color="blue" className="p-4 border-2 border-pen-blue/20 w-48 h-48 sm:w-64 sm:h-64 hatching-shadow -rotate-1">
               <div className="w-full h-full border-2 border-pen-blue/10 rounded-sm overflow-hidden bg-white">
                 <img src={pet.image} className="w-full h-full object-cover" />
               </div>
            </GlassCard>
            <div className="absolute -top-4 -left-4 h-14 w-14 bg-sticker-yellow border-2 border-pen-blue -rotate-12 flex items-center justify-center font-black italic text-pen-blue shadow-sm">
               {hp.player.toFixed(0)}
            </div>
          </div>
          <span className="font-black italic text-pen-blue uppercase tracking-tight text-xl">{pet.name}</span>
        </motion.div>
      </div>

      {/* Battle Log */}
      <GlassCard color="white" className="w-full max-w-2xl h-40 overflow-y-auto no-scrollbar border-2 border-black/5 hatching-shadow my-8 p-6 text-left relative">
        <div className="absolute top-2 right-4 text-[10px] font-black italic text-pen-blue/20 uppercase tracking-[0.2em]">Протокол сражения</div>
        <div className="space-y-2">
          {battleLog.map((msg, i) => (
            <div key={i} className={cn(
              "text-sm font-bold italic",
              i === 0 ? 'text-pen-blue leading-relaxed' : 'text-pen-blue/30'
            )}>
              {i === 0 ? <HandwrittenText text={msg} speed={40} /> : `» ${msg}`}
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Controls */}
      <div className="w-full max-w-2xl grid grid-cols-3 gap-6">
        <NeonButton 
          onClick={() => handleAction('attack')} 
          disabled={turn !== 'player' || !!winner}
          className="flex flex-col items-center py-6 h-auto"
        >
          <Sword className="h-8 w-8 mb-2" />
          <span className="text-[11px] uppercase font-black italic tracking-widest leading-none">Удар</span>
        </NeonButton>
        <NeonButton 
          onClick={() => handleAction('skill')} 
          disabled={turn !== 'player' || !!winner}
          className="flex flex-col items-center py-6 h-auto"
        >
          <Sparkles className="h-8 w-8 mb-2" />
          <span className="text-[11px] uppercase font-black italic tracking-widest leading-none">Ульта</span>
        </NeonButton>
        <NeonButton 
          onClick={() => handleAction('defend')} 
          disabled={turn !== 'player' || !!winner}
          className="flex flex-col items-center py-6 h-auto"
        >
          <Shield className="h-8 w-8 mb-2" />
          <span className="text-[11px] uppercase font-black italic tracking-widest leading-none">Блок</span>
        </NeonButton>
      </div>

      <AnimatePresence>
        {winner && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-white/60 backdrop-blur-sm p-6"
          >
            <GlassCard color="yellow" rotation={1} className="text-center p-12 max-w-sm border-2 border-pen-blue hatching-shadow">
              <h2 className="text-6xl font-black italic mb-6 uppercase text-pen-blue tracking-tighter">
                {winner === 'Игрок' ? 'ПОБЕДА!' : 'ПОРАЖЕНИЕ'}
              </h2>
              {rewards && winner === 'Игрок' && (
                <div className="flex justify-center gap-8 mb-10">
                  <div className="flex flex-col items-center gap-2">
                    <Coins className="h-8 w-8 text-black/40" />
                    <span className="text-2xl font-black text-pen-blue italic">+{rewards.rubles} ₽</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <Zap className="h-8 w-8 text-pen-blue/40" />
                    <span className="text-2xl font-black text-pen-blue italic">+{rewards.xp} XP</span>
                  </div>
                </div>
              )}
              <div className="text-pen-blue/60 mb-10 font-bold italic uppercase tracking-widest text-sm leading-relaxed">
                {winner === 'Игрок' ? 'Твой зверь стал сильнее!' : 'Попробуй еще раз после тренировки.'}
              </div>
              <NeonButton onClick={() => window.location.href = '/main'} className="w-full font-black italic text-lg py-5">
                ВЕРНУТЬСЯ В ШТАБ
              </NeonButton>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
