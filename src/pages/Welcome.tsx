import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { NeonButton, HandwrittenText, LogoAnimation } from '../components/UI';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Plus } from 'lucide-react';

export const Welcome: React.FC<{ onSetup?: () => void; side?: 'left' | 'right'; isMobileBook?: boolean; isVertical?: boolean }> = ({ onSetup, side = 'left', isMobileBook, isVertical }) => {
  const navigate = useNavigate();
  
  // Decide logo styling based on mobile book constraints combined with vertical layout
  const isMobileVertical = isMobileBook && isVertical;

  return (
    <div className={cn("relative flex flex-col items-center justify-center text-center", isMobileBook ? "px-4 space-y-0 h-auto min-h-full" : "h-full p-8 space-y-4")}>
      <div className={cn("aspect-square relative flex-shrink-0", isMobileBook ? (isMobileVertical ? "w-[100%] sm:max-w-[400px] my-0" : "w-[50%] sm:max-w-[250px] my-0") : "w-[70%] max-w-[400px]")}>
        <LogoAnimation 
          containerClassName="absolute inset-0 mix-blend-multiply flex items-center justify-center"
          logoClassName={cn("w-full h-full", isMobileBook ? (isMobileVertical ? "max-h-[280px]" : "max-h-[140px]") : "")}
          imgClassName="w-full h-full object-contain filter contrast-125 select-none pointer-events-none"
        />
      </div>
      
      <div className={cn(isMobileBook ? "space-y-0 mt-0" : "space-y-1 mt-4")}>
        <p className={cn("text-pen-blue tracking-wide font-hand", isMobileBook ? "text-[20px] font-bold" : "text-xl sm:text-2xl font-medium")}>
          Цифровой Бестиарий
        </p>
      </div>

      <div className={cn("max-w-[280px] border-t border-black/5", isMobileBook ? "pt-1 text-[12px] leading-[20px] text-[#0047ab] font-normal" : "text-lg sm:text-xl text-pen-blue/40 font-black pt-2 leading-relaxed")}>
        <HandwrittenText 
          text="Инициализируйте протокол слияния для проявления вашей первой цифровой сущности." 
          speed={40}
        />
      </div>

      <div className={cn("flex flex-col items-center", isMobileBook ? "pt-1 gap-1" : "pt-2 gap-4")}>
        <NeonButton 
          onClick={onSetup}
          className={cn("bg-sticker-yellow font-black border-2 rotate-2 hover:rotate-1 transition-all", isMobileBook ? "px-6 py-0 min-h-[30px] border-[#0047ab] mt-1 mb-1" : "border-black px-12 py-4")}
        >
          <span className={cn(isMobileBook && "font-bold text-[16px]")}>Начать</span>
        </NeonButton>
        <div className={cn("opacity-20", isMobileBook ? "mt-0" : "mt-2")}>
          <div className={cn("bg-pen-blue mx-auto", isMobileBook ? "w-8 h-[1px] mb-0.5" : "w-12 h-0.5 mb-2")} />
          <p className="text-[10px] sm:text-[12px] font-black tracking-wide text-pen-blue">протокол 0.1.а</p>
        </div>
      </div>
    </div>
  );
};
