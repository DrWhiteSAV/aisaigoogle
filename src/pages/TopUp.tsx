import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserProgress } from '../types';
import { GlassCard, NeonButton } from '../components/UI';
import { Sprout, ArrowLeft, CreditCard, ShieldCheck, Zap } from 'lucide-react';
import { BUYING_PRICES } from '../constants/shop';

export const TopUp: React.FC<{ progress: UserProgress; setProgress: React.Dispatch<React.SetStateAction<UserProgress>> }> = ({ progress, setProgress }) => {
  const navigate = useNavigate();
  const [sproutInput, setSproutInput] = useState<string>('1000');
  const [energyInput, setEnergyInput] = useState<string>('100');

  const handleBuySprouts = () => {
    const amount = parseInt(sproutInput);
    if (!isNaN(amount) && amount > 0) {
      setProgress(prev => ({ ...prev, sprouts: prev.sprouts + amount }));
      // alert(`Пополнено на ${amount} 🌱`); // UI would be better but simple for now
    }
  };

  const handleBuyEnergy = () => {
    const amount = parseInt(energyInput);
    if (!isNaN(amount) && amount > 0) {
      setProgress(prev => ({ ...prev, energy: prev.energy + amount }));
    }
  };

  const sproutsRubles = (parseInt(sproutInput) || 0) / BUYING_PRICES.sprouts_per_ruble;
  const energyRubles = (parseInt(energyInput) || 0) / BUYING_PRICES.energy_per_ruble;

  return (
    <div className="p-6 h-full flex flex-col space-y-8">
      <header className="space-y-4">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-pen-blue/40 hover:text-pen-blue font-black transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Назад
        </button>
        <div>
          <h1 className="text-3xl font-black text-pen-blue leading-none">aiSai Терминал</h1>
          <div className="text-[10px] font-black text-pen-blue/30 mt-1 tracking-widest">Протокол энергообмена и ресурсов</div>
        </div>
      </header>

      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-3">
          <GlassCard color="white" className="border-2 border-black/5 p-4 flex flex-col items-center">
            <span className="text-[9px] font-black text-pen-blue/40 mb-2">Баланс</span>
            <div className="flex items-center gap-1 text-lg font-black text-pen-blue">
               <Sprout className="h-4 w-4" />
               {progress.sprouts.toLocaleString()}
            </div>
          </GlassCard>
          <GlassCard color="white" className="border-2 border-black/5 p-4 flex flex-col items-center">
            <span className="text-[9px] font-black text-pen-blue/40 mb-2">Энергия</span>
            <div className="flex items-center gap-1 text-lg font-black text-pen-blue">
               <Zap className="h-4 w-4 text-orange-400" />
               {progress.energy}
            </div>
          </GlassCard>
        </div>

        <div className="space-y-6">
          <GlassCard color="white" className="p-5 border-2 border-black/10">
            <div className="flex items-center gap-2 mb-4">
              <Sprout className="h-5 w-5 text-pen-blue" />
              <h2 className="text-sm font-black text-pen-blue tracking-widest">Купить Ростки</h2>
            </div>
            <div className="space-y-4">
              <div className="relative">
                <input 
                  type="number" 
                  value={sproutInput}
                  onChange={e => setSproutInput(e.target.value)}
                  className="w-full bg-pen-blue/5 border-2 border-black/5 rounded-none p-3 pl-10 text-lg font-black text-pen-blue focus:border-pen-blue outline-none"
                />
                <Sprout className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-pen-blue/20" />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-pen-blue/20">🌱</div>
              </div>
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-black text-pen-blue/40">Цена: {sproutsRubles} руб.</span>
                <span className="text-[10px] font-black text-pen-blue/40">100 🌱 = 1 руб.</span>
              </div>
              <NeonButton onClick={handleBuySprouts} className="w-full py-2 bg-sticker-yellow border-2 border-pen-blue text-sm font-black">
                Оплатить {sproutsRubles} руб.
              </NeonButton>
            </div>
          </GlassCard>

          <GlassCard color="white" className="p-5 border-2 border-black/10">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-5 w-5 text-orange-400" />
              <h2 className="text-sm font-black text-pen-blue tracking-widest">Купить Энергию</h2>
            </div>
            <div className="space-y-4">
              <div className="relative">
                <input 
                  type="number" 
                  value={energyInput}
                  onChange={e => setEnergyInput(e.target.value)}
                  className="w-full bg-pen-blue/5 border-2 border-black/5 rounded-none p-3 pl-10 text-lg font-black text-pen-blue focus:border-pen-blue outline-none"
                />
                <Zap className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-pen-blue/20" />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-pen-blue/20">⚡</div>
              </div>
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-black text-pen-blue/40">Цена: {energyRubles} руб.</span>
                <span className="text-[10px] font-black text-pen-blue/40">10 ⚡ = 1 руб.</span>
              </div>
              <NeonButton onClick={handleBuyEnergy} className="w-full py-2 bg-sticker-blue border-2 border-pen-blue text-sm font-black">
                Оплатить {energyRubles} руб.
              </NeonButton>
            </div>
          </GlassCard>
        </div>

        <div className="p-8 border-2 border-dashed border-black/5 rounded-none text-center space-y-2 opacity-50">
           <CreditCard className="mx-auto h-6 w-6 text-pen-blue/20" />
           <p className="text-[10px] font-black text-pen-blue/30 leading-none">Другие способы оплаты временно недоступны</p>
        </div>

        <div className="mt-auto flex items-center gap-3 opacity-30">
          <ShieldCheck className="h-4 w-4 text-pen-blue" />
          <p className="text-[9px] font-black leading-tight">Ваши транзакции защищены протоколом шифрования aiSai</p>
        </div>
      </div>
    </div>
  );
};
