import React from 'react';
import { useNavigate } from 'react-router-dom';
import { NeonButton } from '../components/UI';
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
          src="https://i.ibb.co/vCDztLGH/aisaimain.png" 
          alt="aiSai Logo" 
          className="mb-8 w-64 object-contain sm:w-80"
        />
        
        <h1 className="mb-4 text-5xl font-black tracking-[4px] sm:text-7xl uppercase logo-text-gradient italic">
          AISAI
        </h1>
        
        <p className="mb-12 max-w-sm text-sm uppercase tracking-widest text-[#94a3b8] leading-relaxed">
          Твоя личная армия уникальных ИИ-зверей, которых нет ни у кого. Генерируй, сражайся, эволюционируй.
        </p>

        <NeonButton 
          onClick={() => navigate('/setup')}
          variant="purple"
          className="btn-generate text-base px-16 py-5 tracking-[2px] rounded-[16px]"
        >
          НАЧАТЬ ПУТЕШЕСТВИЕ
        </NeonButton>
      </motion.div>

      {/* Footer Info */}
      <div className="absolute bottom-10 text-xs font-mono text-white/30 uppercase tracking-[0.2em]">
        GENERATE • BATTLE • EVOLVE
      </div>
    </div>
  );
};
