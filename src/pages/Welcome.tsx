import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { NeonButton, HandwrittenText } from '../components/UI';
import { motion, AnimatePresence } from 'motion/react';
import { Plus } from 'lucide-react';

export const Welcome: React.FC<{ onSetup?: () => void; side?: 'left' | 'right' }> = ({ onSetup, side = 'left' }) => {
  const navigate = useNavigate();
  
  if (side === 'left') {
    return (
      <div className="relative flex flex-col items-center justify-center h-full text-center p-8 space-y-10">
        <motion.div
          initial={{ clipPath: 'inset(0 100% 0 0)', opacity: 0, scale: 0.95 }}
          animate={{ clipPath: 'inset(0 0% 0 0)', opacity: 1, scale: 1 }}
          transition={{ duration: 2.5, ease: "easeInOut" }}
          className="w-[80%] max-w-[450px]"
        >
          <img 
            src="https://i.ibb.co/k2PN7Q8y/aisailogo.png" 
            alt="aiSai Logo" 
            className="w-full object-contain transform -rotate-1 mix-blend-multiply drop-shadow-sm filter contrast-125"
          />
        </motion.div>
        
        <div className="space-y-2">
          <h1 className="text-7xl sm:text-8xl font-black italic tracking-tighter text-pen-blue leading-none mb-1">
            aiSai
          </h1>
          <p className="text-2xl sm:text-3xl font-medium italic text-pen-blue/50 tracking-wide font-hand">
            цифровой бестиарий
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center justify-center h-full text-center p-8 space-y-12">
      <div className="max-w-xs text-xl sm:text-2xl italic text-pen-blue/60 leading-relaxed font-black">
        <HandwrittenText 
          text="Инициализируйте протокол слияния для проявления вашей первой цифровой сущности." 
          speed={30}
        />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5 }}
      >
        <NeonButton 
          onClick={onSetup || (() => navigate('/setup'))}
          className="px-12 py-8 text-2xl font-black italic shadow-xl bg-sticker-yellow"
        >
          <Plus className="h-8 w-8 mr-4" />
          <span>Призвать сущность</span>
        </NeonButton>
      </motion.div>
    </div>
  );
};
