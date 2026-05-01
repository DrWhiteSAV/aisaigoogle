import React from 'react';
import { useNavigate } from 'react-router-dom';
import { NeonButton, HandwrittenText } from '../components/UI';
import { motion } from 'motion/react';
import { Plus } from 'lucide-react';

export const Welcome: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center p-10 text-center overflow-y-auto force-scrollbar">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -z-10 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-neon-purple/5 blur-[120px]" />
      
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="flex flex-col items-center space-y-4 my-auto"
      >
        <img 
          src="https://i.ibb.co/k2PN7Q8y/aisailogo.png" 
          alt="aiSai Logo" 
          className="w-48 sm:w-64 object-contain transform -rotate-2 mix-blend-multiply"
        />
        
        <h1 className="text-6xl sm:text-8xl font-black italic tracking-tighter text-pen-blue">
          aiSai
        </h1>
        
        <div className="max-w-md text-lg sm:text-xl italic text-pen-blue/60 leading-tight min-h-[60px] font-black">
          <HandwrittenText 
            text="Ваша уникальная коллекция ИИ-сущностей, воплощенных из цифрового эфира. Начните свое прихождение прямо сейчас." 
            speed={35}
          />
        </div>

        <div className="pt-8">
          <NeonButton 
            onClick={() => navigate('/setup')}
            className="px-16 py-8 text-2xl font-black italic"
          >
            <Plus className="h-8 w-8" />
            <span>Призвать первую сущность</span>
          </NeonButton>
        </div>
      </motion.div>
    </div>
  );
};
