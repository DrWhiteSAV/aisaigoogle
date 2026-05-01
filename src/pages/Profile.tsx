import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserProgress } from '../types';
import { GlassCard, NeonButton, HandwrittenText } from '../components/UI';
import { motion, AnimatePresence } from 'motion/react';
import { User, Settings, LogOut, Trash2, Award, Zap, Coins, ShieldCheck } from 'lucide-react';
import { getSummonerRank } from '../lib/gameLogic';

export const Profile: React.FC<{ progress: UserProgress; setProgress: React.Dispatch<React.SetStateAction<UserProgress>> }> = ({ progress, setProgress }) => {
  const navigate = useNavigate();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  
  const rankInfo = getSummonerRank(progress.pets);

  const handleReset = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-10 pt-12 pb-32 min-h-screen relative">
      <header className="space-y-2 mb-12">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 bg-sticker-yellow border-2 border-black rotate-6 flex items-center justify-center shadow-lg">
             <User className="h-8 w-8 text-pen-blue" />
          </div>
          <div>
            <h1 className="text-4xl font-black italic text-pen-blue leading-none">Личное Дело Призывателя</h1>
            <div className="text-[12px] font-black italic text-pen-blue/30 mt-1">Протокол доступа: {progress.id}</div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Summoner Bio Card */}
        <GlassCard color="white" className="border-2 border-black/10 rotation-1">
           <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-black/5 pb-4">
                 <h3 className="text-xl font-black italic text-pen-blue/60 flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5" />
                    <span>Статус Объекта</span>
                 </h3>
                 <div className="px-3 py-1 bg-pen-blue text-white text-xs font-black italic rotate-2">
                    {rankInfo.name}
                 </div>
              </div>

              <div className="space-y-4">
                 <div className="flex justify-between items-center text-sm">
                    <span className="font-black italic text-pen-blue/40 uppercase">Сущностей в контроле:</span>
                    <span className="font-black italic text-pen-blue">{progress.pets.length} / {rankInfo.limit}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                    <span className="font-black italic text-pen-blue/40 uppercase">Проведенных битв:</span>
                    <span className="font-black italic text-pen-blue">0</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                    <span className="font-black italic text-pen-blue/40 uppercase">Бонусный лимит:</span>
                    <span className="font-black italic text-pen-blue">не ограничен</span>
                 </div>
              </div>
           </div>
        </GlassCard>

        {/* Economy Status */}
        <GlassCard color="blue" className="border-2 border-black/10 rotation-neg-1">
           <div className="space-y-6">
              <h3 className="text-xl font-black italic text-pen-blue/60 flex items-center gap-2">
                 <Coins className="h-5 w-5" />
                 <span>Баланс Счета</span>
              </h3>
              
              <div className="text-5xl font-black italic text-pen-blue">
                 {progress.currency.toLocaleString()} ₽
              </div>

              <NeonButton onClick={() => navigate('/topup')} className="w-full py-4 text-xl font-black italic bg-white text-pen-blue border-pen-blue/20">
                 Пополнить Баланс
              </NeonButton>
           </div>
        </GlassCard>
      </div>

      <div className="space-y-6 pt-10">
         <h3 className="text-2xl font-black italic text-pen-blue flex items-center gap-2">
            <Settings className="h-6 w-6" />
            <span>Конфигурации</span>
         </h3>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <button className="flex items-center justify-between p-6 bg-transparent border-2 border-black/5 rounded-none hover:bg-black/5 transition-all text-left">
               <div>
                  <div className="font-black italic text-pen-blue">Звуковой Протокол</div>
                  <div className="text-[10px] uppercase font-black text-black/30">Активен</div>
               </div>
               <div className="h-6 w-12 bg-pen-blue/10 border border-pen-blue/20 rounded-full flex items-center px-1">
                  <div className="h-4 w-4 bg-pen-blue rounded-full translate-x-6" />
               </div>
            </button>

            <button className="flex items-center justify-between p-6 bg-transparent border-2 border-black/5 rounded-none hover:bg-black/5 transition-all text-left">
               <div>
                  <div className="font-black italic text-pen-blue">Тактильный Отклик</div>
                  <div className="text-[10px] uppercase font-black text-black/30">Вибрация при атаке</div>
               </div>
               <div className="h-6 w-12 bg-pen-blue/10 border border-pen-blue/20 rounded-full flex items-center px-1">
                  <div className="h-4 w-4 bg-pen-blue rounded-full translate-x-6" />
               </div>
            </button>
         </div>

         <div className="pt-10 space-y-4">
            <button 
              onClick={() => setShowResetConfirm(true)}
              className="flex items-center gap-3 text-pen-red font-black italic hover:brightness-125 transition-all w-fit"
            >
               <Trash2 className="h-5 w-5" />
               <span>Удалить все данные протокола</span>
            </button>
            <div className="text-[10px] font-black text-pen-red/50">
               Внимание: Сброс кэша приведет к полной потере всех сущностей, уровней и валюты без возможности восстановления.
            </div>
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
                  <GlassCard color="pink" className="border-4 border-pen-red p-8 text-center space-y-6 rotation-1">
                     <div className="h-20 w-20 bg-transparent border-2 border-pen-red rounded-full flex items-center justify-center mx-auto">
                        <Trash2 className="h-10 w-10 text-pen-red" />
                     </div>
                     <h2 className="text-3xl font-black italic text-pen-red leading-tight">Вы уверены?</h2>
                     <p className="text-pen-blue font-black italic">Все ваши достижения и существа будут стерты навсегда.</p>
                     
                     <div className="flex flex-col gap-3 pt-4">
                        <NeonButton onClick={handleReset} className="bg-pen-red text-white py-4 font-black italic text-xl border-none">
                           ДА, СТЕРЕТЬ ВСЁ
                        </NeonButton>
                        <button 
                          onClick={() => setShowResetConfirm(false)}
                          className="font-black italic text-pen-blue/40 hover:text-pen-blue"
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
};
