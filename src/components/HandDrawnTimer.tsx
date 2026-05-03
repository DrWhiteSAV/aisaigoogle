import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';

interface HandDrawnTimerProps {
  duration: number; // in seconds
  onComplete?: () => void;
  label?: string;
}

export const HandDrawnTimer: React.FC<HandDrawnTimerProps> = ({ duration, onComplete, label }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const nextProgress = Math.min((elapsed / (duration * 1000)) * 100, 100);
      setProgress(nextProgress);
      
      if (nextProgress >= 100) {
        clearInterval(interval);
        onComplete?.();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [duration, onComplete]);

  return (
    <div className="w-full max-w-md mx-auto space-y-4 text-center">
      {label && (
        <div className="text-sm font-black tracking-[0.2em] text-pen-blue/40">
          {label}
        </div>
      )}
      
      <div className="relative h-4 w-full bg-white border-2 border-black/10 rounded-sm overflow-hidden">
        {/* Sketchy progress fill */}
        <motion.div 
          className="h-full bg-sticker-yellow"
          style={{ width: `${progress}%` }}
          initial={{ width: 0 }}
          animate={{ x: [0, 1, -1, 0], y: [0, -1, 1, 0] }}
          transition={{ repeat: Infinity, duration: 0.2 }}
        />
        
        {/* Hatching patterns over the bar */}
        <div className="absolute inset-0 pointer-events-none opacity-20 bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,black_5px,black_6px)]" />
      </div>

      <div className="text-xs font-black text-pen-blue/30 tracking-widest">
        {Math.round(progress)}% • В процессе синтеза...
      </div>
    </div>
  );
};
