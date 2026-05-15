import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { NeonButton, HandwrittenText, LogoAnimation } from '../components/UI';
import { motion, AnimatePresence } from 'motion/react';
import { Plus } from 'lucide-react';

export const Welcome: React.FC<{ onSetup?: () => void; side?: 'left' | 'right' }> = ({ onSetup, side = 'left' }) => {
  const navigate = useNavigate();
  
  return (
    <div className="relative flex flex-col items-center justify-center h-full text-center p-8 space-y-4">
      <div className="w-[70%] max-w-[400px] aspect-square relative">
        <LogoAnimation 
          containerClassName="absolute inset-0 mix-blend-multiply"
          logoClassName="w-full h-full"
          imgClassName="w-full h-full object-contain filter contrast-125"
        />
      </div>
      
      <div className="space-y-1 mt-4">
        <p className="text-xl sm:text-2xl font-medium text-pen-blue tracking-wide font-hand">
          Цифровой Бестиарий
        </p>
      </div>

      <div className="max-w-[280px] text-lg sm:text-xl text-pen-blue/40 leading-relaxed font-black border-t border-black/5 pt-2">
        <HandwrittenText 
          text="Инициализируйте протокол слияния для проявления вашей первой цифровой сущности." 
          speed={40}
        />
      </div>

      <div className="pt-2 flex flex-col items-center gap-4">
        <NeonButton 
          onClick={onSetup}
          className="bg-sticker-yellow font-black px-12 py-4 border-2 border-black rotate-2 hover:rotate-1 transition-all"
        >
          Начать
        </NeonButton>
        <div className="opacity-20 mt-2">
          <div className="w-12 h-0.5 bg-pen-blue mx-auto mb-2" />
          <p className="text-[12px] font-black tracking-wide text-pen-blue">протокол 0.1.а</p>
        </div>
      </div>
    </div>
  );
};
