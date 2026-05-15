import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Setup } from './Setup';
import { UserProgress, UserProfile } from '../types';
import { GlassCard, NeonButton, HandwrittenText } from '../components/UI';
import { motion, AnimatePresence } from 'motion/react';
import { User, Settings, LogOut, Trash2, Award, Zap, Sprout, ShieldCheck, Compass, MessageCircle, Mail } from 'lucide-react';
import { RankInfoModal } from '../components/GameUI';
import { getSummonerRank, RANKS_INFO } from '../lib/gameLogic';
import { cn } from '../lib/utils';

export const Profile: React.FC<{ 
  progress: UserProgress; 
  setProgress: React.Dispatch<React.SetStateAction<UserProgress>>;
  view?: 'main' | 'settings' | 'questionnaire' | 'setup';
  userProfile?: UserProfile;
  setUserProfile?: React.Dispatch<React.SetStateAction<UserProfile>>;
}> = ({ progress, setProgress, view = 'main', userProfile, setUserProfile }) => {
  const navigate = useNavigate();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showRankModal, setShowRankModal] = useState(false);
  const rankInfo = getSummonerRank(progress.pets);

  const handleReset = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  if (view === 'settings' && userProfile && setUserProfile) {
    return (
      <div className="relative h-full flex flex-col pt-16">
         <div className="flex-1 overflow-y-auto no-scrollbar pb-16 space-y-4">
           <Setup 
             profile={userProfile} 
             setProfile={setUserProfile} 
             onComplete={() => {}} 
             step={2} 
             hideAction 
           />
         </div>
         <div className="absolute top-4 right-4 flex gap-2 z-[100]">
            <NeonButton onClick={() => navigate('/profile')} className="p-2 border-2 text-white bg-pen-blue border-pen-blue hover:brightness-110">
               <span className="sr-only">Назад</span>
               <span aria-hidden="true" className="text-xl">←</span>
            </NeonButton>
         </div>
      </div>
    );
  }

   return (
    <div className="p-4 h-full flex flex-col space-y-6 relative overflow-y-auto no-scrollbar pb-24">
        <div className="absolute top-4 right-4 z-[100]">
          <NeonButton onClick={() => navigate('/profile/settings')} className="px-3 py-2 border-2 text-white bg-pen-blue border-pen-blue hover:brightness-110 flex items-center gap-2">
             <Settings className="w-5 h-5" />
             <span className="font-black text-sm tracking-wider">Настройки</span>
          </NeonButton>
        </div>
      <header className="space-y-4 pt-2">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 bg-sticker-yellow border-2 border-black rotate-6 flex items-center justify-center">
             <User className="h-7 w-7 text-pen-blue" />
          </div>
          <div>
            <h1 className="text-[20px] font-black text-pen-blue leading-none">Личное Дело</h1>
            <div className="text-[20px] font-black text-pen-blue mt-1 tracking-widest leading-none">ID: {progress.id}</div>
          </div>
        </div>
      </header>

      <div className="flex-1 space-y-6">
        {userProfile && setUserProfile && (
           <Setup 
             profile={userProfile} 
             setProfile={setUserProfile} 
             onComplete={() => {}} 
             step={1} 
             hideAction 
           />
        )}

        {/* Status Card */}
        <GlassCard color="white" className="border-2 border-black/5 rotate-1 p-5">
           <div className="space-y-4">
              <div className="space-y-2">
                 <div className="flex justify-between items-center font-black cursor-pointer group" onClick={() => setShowRankModal(true)}>
                    <span className="text-pen-blue text-[20px] group-hover:underline decoration-2 underline-offset-4">Уровень Призывателя:</span>
                    <span className="text-pen-blue text-[20px] group-hover:scale-105 transition-transform">{rankInfo.name}</span>
                 </div>
                 <div className="flex justify-between items-center font-black">
                    <span className="text-pen-blue text-[20px]">Питомцев:</span>
                    <span className="text-pen-blue text-[20px]">{progress.pets.length} / {rankInfo.limit}</span>
                 </div>
                 <div className="flex justify-between items-center font-black">
                    <span className="text-pen-blue text-[20px]">Боев:</span>
                    <span className="text-pen-blue text-[20px]">{progress.totalBattles || 0} <span className="text-[20px] ml-1">(Поб: {progress.wonBattles || 0} / Пор: {progress.lostBattles || 0})</span></span>
                 </div>
                 <div className="flex justify-between items-center font-black">
                    <span className="text-pen-blue text-[20px]">Квестов:</span>
                    <span className="text-pen-blue text-[20px]">{progress.totalQuests || 0} <span className="text-[20px] ml-1">(Усп: {progress.successfulQuests || 0} / Неусп: {progress.failedQuests || 0})</span></span>
                 </div>
              </div>
           </div>
        </GlassCard>

        {/* Telegram Account */}
        <GlassCard color="blue" className="border-2 border-black/5 -rotate-1 p-5">
           <div className="space-y-4">
              <h3 className="text-[20px] font-black text-pen-blue flex items-center gap-2 border-b border-black/5 pb-3">
                 <MessageCircle className="h-5 w-5" />
                 <span>Профиль Telegram</span>
              </h3>
              
              <div className="flex items-center gap-4">
                 <div className="h-24 w-24 bg-black/10 rounded-full flex items-center justify-center shrink-0">
                    <User className="h-12 w-12 text-pen-blue" />
                 </div>
                 <div className="overflow-hidden space-y-1">
                    <div className="text-[20px] font-black text-pen-blue truncate">Имя Фамилия</div>
                    <div className="text-[20px] font-black text-pen-blue truncate">@username</div>
                    <div className="text-[20px] font-black text-pen-blue font-mono truncate">ID: 123456789</div>
                 </div>
              </div>
              <div className="pt-2">
                 <a href="#" className="text-[20px] font-black text-pen-blue underline underline-offset-4 decoration-2 decoration-pen-blue hover:decoration-pen-blue transition-colors">
                   t.me/username
                 </a>
              </div>
           </div>
        </GlassCard>

        {/* Google Account */}
        <GlassCard color="yellow" className="border-2 border-black/5 rotate-1 p-5">
           <div className="space-y-4">
              <h3 className="text-[20px] font-black text-pen-blue flex items-center gap-2 border-b border-black/5 pb-3">
                 <Mail className="h-5 w-5" />
                 <span>Аккаунт Google</span>
              </h3>
              
              <div className="flex items-center gap-4">
                 <div className="h-24 w-24 bg-white rounded-full flex items-center justify-center shrink-0">
                    <User className="h-12 w-12 text-pen-blue" />
                 </div>
                 <div className="overflow-hidden space-y-1">
                    <div className="text-[20px] font-black text-pen-blue truncate">Google User</div>
                    <div className="text-[20px] font-black text-pen-blue truncate">user@gmail.com</div>
                 </div>
              </div>
           </div>
        </GlassCard>

        {/* Promo Blocks */}
        <div className="pt-2 space-y-4">
           <a href="https://t.me/SAV_AI" target="_blank" rel="noopener noreferrer" className="block w-full">
              <GlassCard color="blue" className="border-2 border-black/5 hover:bg-pen-blue/5 transition-colors cursor-pointer p-4 text-center group">
                 <span className="text-[20px] text-pen-blue font-black group-hover:underline underline-offset-4 pointer-events-none">канал про Нейросети</span>
              </GlassCard>
           </a>
           <a href="https://t.me/shishkarnem" target="_blank" rel="noopener noreferrer" className="block w-full">
              <GlassCard color="yellow" className="border-2 border-black/5 hover:bg-pen-blue/5 transition-colors cursor-pointer p-4 text-center group">
                 <span className="text-[20px] text-pen-blue font-black group-hover:underline underline-offset-4 pointer-events-none">Написать разработчику</span>
              </GlassCard>
           </a>
        </div>

        {/* Reset Progress Button */}
        <div className="pt-6">
           <button onClick={() => setShowResetConfirm(true)} className="flex items-center justify-between p-4 bg-pen-red/5 border-2 border-pen-red/20 rounded-sm hover:bg-pen-red/10 transition-all text-left w-full group mt-4">
              <div>
                 <div className="text-[20px] font-black text-pen-red group-hover:text-red-700 transition-colors">Сброс прогресса</div>
                 <div className="text-[20px] font-black text-pen-red">Необратимо. Возврат к началу.</div>
              </div>
              <Trash2 className="h-6 w-6 text-pen-red group-hover:scale-110 transition-transform" />
           </button>
        </div>

        <div className="flex items-center gap-3 p-4 mt-auto">
           <Award className="h-6 w-6 text-pen-blue shrink-0" />
           <p className="text-[20px] font-black text-pen-blue shrink-0 leading-tight">Почетный член гильдии призывателей aiSai</p>
        </div>
      </div>

      {/* Reset Confirmation Overlay */}
      <AnimatePresence>
         {showResetConfirm && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40" onClick={() => setShowResetConfirm(false)}>
               <motion.div 
                 initial={{ opacity: 0, scale: 0.9, y: 20 }}
                 animate={{ opacity: 1, scale: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.9, y: 20 }}
                 transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                 className="relative max-w-sm w-full bg-[#f2ede0] ledger-grid border-4 border-pen-red p-8 text-center space-y-6 rotate-1"
                 onClick={e => e.stopPropagation()}
               >
                  <div className="h-16 w-16 bg-transparent border-2 border-pen-red rounded-full flex items-center justify-center mx-auto">
                     <Trash2 className="h-8 w-8 text-pen-red" />
                  </div>
                  <h2 className="text-[20px] font-black text-pen-red leading-tight">Подтверждаете?</h2>
                  <p className="text-[20px] font-black text-pen-blue leading-relaxed">Все ваши достижения и существа будут стерты навсегда.</p>
                  
                  <div className="flex flex-col items-center gap-2 pt-4">
                     <NeonButton onClick={handleReset} className="bg-pen-red text-white py-4 font-black text-[20px] border-2 border-black px-10">
                        Сбросить
                     </NeonButton>
                     <button 
                       onClick={() => setShowResetConfirm(false)}
                       className="font-black text-[20px] text-pen-blue border-2 border-pen-blue/20 px-8 py-3 bg-white/20 hover:bg-white/40 transition-colors"
                     >
                        Отмена
                     </button>
                  </div>
               </motion.div>
            </div>
         )}
      </AnimatePresence>

      {/* Rank Info Modal */}
      <RankInfoModal 
        isOpen={showRankModal} 
        onClose={() => setShowRankModal(false)} 
        rankInfo={rankInfo} 
      />
    </div>
  );
};
