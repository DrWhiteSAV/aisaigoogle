import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { NeonButton, HandwrittenText } from '../components/UI';
import { motion, AnimatePresence } from 'motion/react';
import { Plus } from 'lucide-react';

export const Welcome: React.FC<{ onSetup?: () => void; side?: 'left' | 'right' }> = ({ onSetup, side = 'left' }) => {
  const navigate = useNavigate();
  
  return (
    <div className="relative flex flex-col items-center justify-center h-full text-center p-8 space-y-8">
      <motion.div
        initial={{ clipPath: 'inset(0 100% 0 0)', opacity: 0, scale: 0.95 }}
        animate={{ clipPath: 'inset(0 0% 0 0)', opacity: 1, scale: 1 }}
        transition={{ duration: 2.5, ease: "easeInOut" }}
        className="w-[70%] max-w-[400px]"
      >
        <img 
          src="https://i.ibb.co/k2PN7Q8y/aisailogo.png" 
          alt="aiSai Logo" 
          className="w-full object-contain transform -rotate-1 mix-blend-multiply filter contrast-125"
        />
      </motion.div>
      
      <div className="space-y-1">
        <h1 className="text-6xl sm:text-7xl font-black tracking-tighter text-pen-blue leading-none mb-1">
          aiSai
        </h1>
        <p className="text-xl sm:text-2xl font-medium text-pen-blue/50 tracking-wide font-hand">
          цифровой бестиарий
        </p>
      </div>

      <div className="max-w-[280px] text-lg sm:text-xl text-pen-blue/40 leading-relaxed font-black pt-4 border-t border-black/5">
        <HandwrittenText 
          text="Инициализируйте протокол слияния для проявления вашей первой цифровой сущности." 
          speed={40}
        />
      </div>

      <div className="pt-4 flex flex-col items-center gap-4">
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
