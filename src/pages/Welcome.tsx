import React from 'react';
import { useNavigate } from 'react-router-dom';
import { NeonButton, HandwrittenText } from '../components/UI';
import { motion } from 'motion/react';

export const Welcome: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="relative flex h-screen flex-col items-center justify-center px-4 text-center overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -z-10 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-neon-purple/20 blur-[120px]" />
      
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="flex flex-col items-center"
      >
        <img 
          src="https://i.ibb.co/k2PN7Q8y/aisailogo.png" 
          alt="aiSai Logo" 
          className="mb-8 w-64 object-contain sm:w-80 transform -rotate-2"
        />
        
        <h1 className="mb-4 text-6xl font-black italic tracking-tighter text-pen-blue uppercase">
          AISAI
        </h1>
        
        <div className="mb-12 max-w-sm text-lg italic text-pen-blue/60 leading-tight min-h-[60px]">
          <HandwrittenText 
            text="Твоя личная армия уникальных ИИ-зверей, которых нет ни у кого. Генерируй, сражайся, эволюционируй." 
            speed={35}
          />
        </div>

        <NeonButton 
          onClick={() => navigate('/setup')}
          className="px-16 py-6 text-xl tracking-widest"
        >
          НАЧАТЬ ПУТЕШЕСТВИЕ
        </NeonButton>
      </motion.div>

      {/* Footer Info */}
      <div className="absolute bottom-10 text-xs font-bold text-pen-blue/30 uppercase tracking-[0.4em]">
        GENERATE • BATTLE • EVOLVE
      </div>
    </div>
  );
};
