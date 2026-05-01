import React, { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface StickyNoteProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  delay?: number;
  rotation?: number;
  color?: 'yellow' | 'pink' | 'blue' | 'white';
}

const Doodle = ({ style }: { style: React.CSSProperties, [key: string]: any }) => (
  <svg 
    viewBox="0 0 100 100" 
    style={style} 
    className="absolute w-20 h-20 text-pen-blue/40 fill-none stroke-current stroke-[2.5] stroke-linecap-round"
  >
    {Math.random() > 0.66 ? (
      /* Hand-drawn scribble star */
      <motion.path 
        d="M 50 10 L 50 90 M 10 50 L 90 50 M 20 20 L 80 80 M 80 20 L 20 80" 
        initial={{ pathLength: 0 }} 
        animate={{ pathLength: 1 }} 
        transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }} 
      />
    ) : Math.random() > 0.33 ? (
      /* Sketchy lines */
      <motion.path 
        d="M 10 10 Q 50 20 90 10 M 10 30 Q 50 40 90 30 M 10 50 Q 50 60 90 50" 
        initial={{ pathLength: 0 }} 
        animate={{ pathLength: 1 }} 
        transition={{ duration: 1.5, repeat: Infinity, repeatType: 'reverse' }} 
      />
    ) : (
      /* Rough circle */
      <motion.path 
        d="M 50 10 C 10 10 10 90 50 90 C 90 90 90 10 50 10" 
        initial={{ pathLength: 0 }} 
        animate={{ pathLength: 1 }} 
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
    )}
  </svg>
);

export const GlassCard: React.FC<StickyNoteProps> = ({ 
  children, 
  className, 
  onClick, 
  delay = 0, 
  rotation,
  color = 'yellow' 
}) => {
  const [randomRotation] = useState(() => rotation ?? (Math.random() * 4 - 2));
  const [doodles] = useState(() => Array.from({ length: 2 }).map(() => ({
    top: `${Math.random() * 80}%`,
    left: `${Math.random() * 80}%`,
    transform: `rotate(${Math.random() * 360}deg) scale(${0.5 + Math.random()})`
  })));
  
  const colors = {
    yellow: 'bg-sticker-yellow',
    pink: 'bg-sticker-pink',
    blue: 'bg-sticker-blue',
    white: 'bg-white'
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20, rotate: randomRotation - 5 }}
      animate={{ opacity: 1, y: 0, rotate: randomRotation }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      onClick={onClick}
      style={{ '--rotation': `${randomRotation}deg` } as any}
      className={cn(
        "sticker p-6 rounded-[2px] hatching-shadow mb-4 relative",
        colors[color],
        onClick && "cursor-pointer active:scale-[0.98] active:rotate-0",
        className
      )}
    >
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-4 bg-white/70 rotate-1 rounded-sm shadow-sm z-20" />
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
};

export const NeonButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'purple' | 'blue' | 'pink' | 'legendary';
  loading?: boolean;
}> = ({ children, onClick, className, variant = 'purple', loading }) => {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={cn(
        "scribble-border scribble-hover px-8 py-3 font-bold text-pen-blue bg-white transition-all duration-300 active:scale-95",
        "relative overflow-hidden disabled:opacity-50",
        className
      )}
    >
      {loading ? (
        <div className="flex items-center justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-pen-blue/30 border-t-pen-blue" />
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2">
          {children}
        </div>
      )}
    </button>
  );
};

export const HandwrittenText: React.FC<{
  text: string;
  speed?: number;
  className?: string;
  delay?: number;
}> = ({ text, speed = 30, className, delay = 0 }) => {
  const [displayedText, setDisplayedText] = useState("");
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setStarted(true), delay * 1000);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    if (displayedText.length < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(text.slice(0, displayedText.length + 1));
      }, 1000 / speed);
      return () => clearTimeout(timer);
    }
  }, [displayedText, text, speed, started]);

  return (
    <span className={cn("handwritten-writing", className)}>
      {displayedText}
      {displayedText.length < text.length && started && (
        <span className="inline-block w-1 h-[1.2em] bg-pen-blue/40 ml-1 animate-pulse" />
      )}
    </span>
  );
};
