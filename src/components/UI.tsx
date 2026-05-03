import React, { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { PenLine } from 'lucide-react';

interface StickyNoteProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  delay?: number;
  rotation?: number;
  noPadding?: boolean;
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
  noPadding = false,
  color = 'yellow' 
}) => {
  const [randomRotation] = useState(() => rotation ?? (Math.random() * 4 - 2));
  
  const colors = {
    yellow: 'bg-sticker-yellow/100',
    pink: 'bg-sticker-pink/100',
    blue: 'bg-sticker-blue/100',
    white: 'bg-white/100'
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      onClick={onClick}
      className={cn(
        "mb-4 relative group",
        onClick && "cursor-pointer active:scale-[0.98]",
        className
      )}
    >
      {/* Tilted Background Layer */}
      <div 
        className={cn("sticker absolute inset-0 rounded-[2px]", colors[color])}
        style={{ '--rotation': `${randomRotation}deg` } as any}
      />

      {/* Straight Content Layer */}
      <div className={cn(
        "relative z-10 h-full w-full",
        !noPadding ? "p-6" : "p-0"
      )}>
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
  disabled?: boolean;
}> = ({ children, onClick, className, loading, disabled }) => {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className={cn(
        "scribble-border scribble-hover px-8 py-3 font-bold text-pen-blue bg-transparent transition-all duration-300 active:scale-95",
        "relative overflow-hidden disabled:opacity-50 cursor-pointer w-fit",
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
  text?: string;
  speed?: number;
  className?: string;
  delay?: number;
}> = ({ text, speed = 30, className, delay = 0 }) => {
  const [displayedText, setDisplayedText] = useState("");
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setStarted(true), delay * 1000);
    return () => clearTimeout(timer);
  }, [delay, started]); // Added started to deps although not strictly needed for the timer

  useEffect(() => {
    if (!started || !text) return;
    if (displayedText.length < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(text.slice(0, displayedText.length + 1));
      }, speed);
      return () => clearTimeout(timer);
    }
  }, [displayedText, text, speed, started]);

  return (
    <span className={cn("inline relative", className)}>
      {displayedText}
      {text && displayedText.length < text.length && started && (
        <motion.span
          animate={{ 
            rotate: [-15, 15, -15],
            x: [0, 2, 0],
            y: [0, -1, 0]
          }}
          transition={{ repeat: Infinity, duration: 0.2, ease: "linear" }}
          className="inline-block ml-1 align-top bg-transparent"
        >
          <PenLine className="w-5 h-5 text-pen-blue transform -scale-x-100 opacity-60" strokeWidth={3} />
        </motion.span>
      )}
    </span>
  );
};
