import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserProgress } from '../types';
import { GlassCard, NeonButton, HandwrittenText } from '../components/UI';
import { motion, AnimatePresence } from 'motion/react';
import { User, Settings, LogOut, Trash2, Award, Zap, Coins, ShieldCheck } from 'lucide-react';
import { getSummonerRank } from '../lib/gameLogic';

export const Profile: React.FC<{ 
  progress: UserProgress; 
  setProgress: React.Dispatch<React.SetStateAction<UserProgress>>;
  view?: 'main' | 'settings';
}> = ({ progress, setProgress, view = 'main' }) => {
  const navigate = useNavigate();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const rankInfo = getSummonerRank(progress.pets);

  const handleReset = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  if (view === 'settings') {
    return (
      <div className="p-4 h-full flex flex-col space-y-8">
        <header className="space-y-1">
          <h2 className="text-2xl font-black italic text-pen-blue flex items-center gap-2 leading-none">
            <Settings className="h-6 w-6" />
            <span>Конфигурации</span>
          </h2>
          <p className="text-[10px] font-black italic text-pen-blue/30 uppercase tracking-widest">Системные пресеты</p>
        </header>

        <div className="space-y-4">
           <button className="flex items-center justify-between p-4 bg-transparent border-2 border-black/5 rounded-none hover:bg-black/5 transition-all text-left w-full group">
              <div>
                 <div className="font-black italic text-pen-blue group-hover:text-pen-blue/80 transition-colors">Звуковой Протокол</div>
                 <div className="text-[9px] uppercase font-black text-black/30 italic">Активен</div>
              </div>
              <div className="h-5 w-10 bg-pen-blue/10 border border-pen-blue/20 rounded-full flex items-center px-1">
                 <div className="h-3 w-3 bg-pen-blue rounded-full translate-x-5" />
              </div>
           </button>

           <button className="flex items-center justify-between p-4 bg-transparent border-2 border-black/5 rounded-none hover:bg-black/5 transition-all text-left w-full group">
              <div>
                 <div className="font-black italic text-pen-blue group-hover:text-pen-blue/80 transition-colors">Тактильный Отклик</div>
                 <div className="text-[9px] uppercase font-black text-black/30 italic">Включен</div>
              </div>
              <div className="h-5 w-10 bg-black/5 border border-black/10 rounded-full flex items-center px-1">
                 <div className="h-3 w-3 bg-black/20 rounded-full" />
              </div>
           </button>
        </div>

        <div className="mt-auto space-y-4 pt-10 border-t-2 border-dashed border-black/5">
           <button 
             onClick={() => setShowResetConfirm(true)}
             className="flex items-center gap-3 text-pen-red font-black italic hover:brightness-125 transition-all w-fit"
           >
              <Trash2 className="h-4 w-4" />
              <span className="text-xs">Сброс данных протокола</span>
           </button>
           <div className="text-[9px] font-black italic text-pen-red/50 leading-relaxed">
              Внимание: Полная очистка без возможности восстановления.
           </div>
        </div>

        {/* Reset Confirmation Overlay */}
        <AnimatePresence>
           {showResetConfirm && (
              <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                 <motion.div 
                   initial={{ opacity: 0, scale: 0.9 }}
                   animate={{ opacity: 1, scale: 1 }}
                   exit={{ opacity: 0, scale: 0.9 }}
                   className="relative max-w-sm w-full"
                 >
                    <GlassCard color="pink" className="border-4 border-pen-red p-8 text-center space-y-6 rotate-1">
                       <div className="h-16 w-16 bg-transparent border-2 border-pen-red rounded-full flex items-center justify-center mx-auto">
                          <Trash2 className="h-8 w-8 text-pen-red" />
                       </div>
                       <h2 className="text-2xl font-black italic text-pen-red leading-tight">Подтверждаете?</h2>
                       <p className="text-xs font-black italic text-pen-blue/70 leading-relaxed">Все ваши достижения и существа будут стерты навсегда.</p>
                       
                       <div className="flex flex-col gap-2 pt-4">
                          <NeonButton onClick={handleReset} className="bg-pen-red text-white py-3 font-black italic text-lg border-none shadow-none">
                             ДА, СТЕРЕТЬ
                          </NeonButton>
                          <button 
                            onClick={() => setShowResetConfirm(false)}
                            className="font-black italic text-[11px] text-pen-blue/40 mt-2 hover:text-pen-blue transition-colors"
                          >
                             ОТМЕНА
                          </button>
                       </div>
                    </GlassCard>
                 </motion.div>
              </div>
           )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="p-4 h-full flex flex-col space-y-8">
      <header className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 bg-sticker-yellow border-2 border-black rotate-6 flex items-center justify-center shadow-md">
             <User className="h-7 w-7 text-pen-blue" />
          </div>
          <div>
            <h1 className="text-2xl font-black italic text-pen-blue leading-none">Личное Дело</h1>
            <div className="text-[9px] font-black italic text-pen-blue/30 mt-1 uppercase tracking-widest leading-none">ID: {progress.id}</div>
          </div>
        </div>
      </header>

      <div className="flex-1 space-y-6">
        {/* Status Card */}
        <GlassCard color="white" className="border-2 border-black/5 rotate-1 p-5 shadow-sm">
           <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-black/5 pb-3">
                 <h3 className="text-sm font-black italic text-pen-blue/60 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    <span>Статус</span>
                 </h3>
                 <div className="px-2 py-0.5 bg-pen-blue text-white text-[10px] font-black italic rotate-2">
                    {rankInfo.name}
                 </div>
              </div>

              <div className="space-y-2">
                 <div className="flex justify-between items-center text-[11px] font-black italic">
                    <span className="text-pen-blue/40 uppercase">Под контролем:</span>
                    <span className="text-pen-blue">{progress.pets.length} / {rankInfo.limit}</span>
                 </div>
                 <div className="flex justify-between items-center text-[11px] font-black italic">
                    <span className="text-pen-blue/40 uppercase">Битв:</span>
                    <span className="text-pen-blue">0</span>
                 </div>
              </div>
           </div>
        </GlassCard>

        {/* Currency Card */}
        <GlassCard color="blue" className="border-2 border-black/5 -rotate-1 p-5 shadow-sm">
           <div className="space-y-4">
              <h3 className="text-sm font-black italic text-pen-blue/60 flex items-center gap-2">
                 <Coins className="h-4 w-4" />
                 <span>Баланс</span>
              </h3>
              
              <div className="text-3xl font-black italic text-pen-blue leading-none">
                 {progress.currency.toLocaleString()} ₽
              </div>

              <button 
                onClick={() => navigate('/topup')} 
                className="w-full py-3 text-sm font-black italic bg-white border-2 border-pen-blue/10 text-pen-blue hover:bg-pen-blue/5 transition-colors"
                style={{ borderStyle: 'dashed' }}
              >
                 Пополнить Счёт
              </button>
           </div>
        </GlassCard>

        <div className="flex items-center gap-3 p-4 opacity-30 mt-auto">
           <Award className="h-5 w-5 text-pen-blue shrink-0" />
           <p className="text-[10px] font-black italic text-pen-blue italic leading-tight">Почетный член гильдии призывателей aiSai</p>
        </div>
      </div>
    </div>
  );
};
