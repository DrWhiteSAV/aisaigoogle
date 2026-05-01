import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserProgress } from '../types';
import { GlassCard, NeonButton } from '../components/UI';
import { Coins, ArrowLeft, CreditCard, ShieldCheck } from 'lucide-react';

export const TopUp: React.FC<{ progress: UserProgress; setProgress: React.Dispatch<React.SetStateAction<UserProgress>> }> = ({ progress, setProgress }) => {
  const navigate = useNavigate();

  const handleTopup = (amount: number) => {
    setProgress(prev => ({ ...prev, currency: prev.currency + amount }));
  };

  return (
    <div className="p-6 h-full flex flex-col space-y-8">
      <header className="space-y-4">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-pen-blue/40 hover:text-pen-blue font-black italic transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Назад
        </button>
        <div>
          <h1 className="text-3xl font-black italic text-pen-blue leading-none">aiSai Pay</h1>
          <div className="text-[10px] font-black italic text-pen-blue/30 mt-1 uppercase tracking-widest">Протокол пополнения баланса</div>
        </div>
      </header>

      <div className="space-y-6">
        <GlassCard color="white" className="border-2 border-black/5 p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black italic text-pen-blue/40 uppercase">Текущий баланс:</span>
            <div className="flex items-center gap-2 text-lg font-black italic text-pen-blue">
               <Coins className="h-4 w-4" />
               {progress.currency.toLocaleString()} ₽
            </div>
          </div>
        </GlassCard>

        <div className="grid grid-cols-1 gap-4">
          {[
            { amount: 5000, label: 'Стандартный пакет', bonus: '0' },
            { amount: 15000, label: 'Премиум пакет', bonus: '500' },
            { amount: 50000, label: 'Легендарный пакет', bonus: '5000' },
          ].map((pkg, i) => (
            <button 
              key={i}
              onClick={() => handleTopup(pkg.amount + parseInt(pkg.bonus))}
              className="group"
            >
              <GlassCard 
                color={i === 1 ? "blue" : "white"} 
                className="p-5 flex items-center justify-between border-2 border-black/5 group-hover:border-pen-blue/20 transition-all text-left"
              >
                <div>
                   <div className="text-sm font-black italic text-pen-blue">{pkg.label}</div>
                   <div className="text-[10px] font-black italic text-pen-blue/40">+{pkg.amount} ₽ {pkg.bonus !== '0' && <span className="text-pen-red">+{pkg.bonus} BONUS</span>}</div>
                </div>
                <div className="text-lg font-black italic text-pen-blue">
                   {(pkg.amount * 0.1).toFixed(0)} <span className="text-[10px]">USD</span>
                </div>
              </GlassCard>
            </button>
          ))}
        </div>

        <div className="p-8 border-2 border-dashed border-black/5 rounded-none text-center space-y-2 opacity-50">
           <CreditCard className="mx-auto h-6 w-6 text-pen-blue/20" />
           <p className="text-[10px] font-black italic text-pen-blue/30 leading-none">Другие способы оплаты временно недоступны</p>
        </div>

        <div className="mt-auto flex items-center gap-3 opacity-30">
          <ShieldCheck className="h-4 w-4 text-pen-blue" />
          <p className="text-[9px] font-black italic leading-tight">Ваши транзакции защищены протоколом шифрования aiSai</p>
        </div>
      </div>
    </div>
  );
};
