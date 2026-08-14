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
  style?: React.CSSProperties;
  contentStyle?: React.CSSProperties;
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
  color = 'yellow',
  style,
  contentStyle
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
      style={style}
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
      <div 
        style={contentStyle}
        className={cn(
          "relative z-10 h-full w-full",
          !noPadding ? "p-6" : "p-0"
        )}
      >
        {children}
      </div>
    </motion.div>
  );
};

export const AnimatedEgg: React.FC<{ 
  hue?: number; 
  className?: string;
  pulseScale?: number;
}> = ({ hue = 0, className, pulseScale = 1.15 }) => (
  <motion.div
    animate={{ 
      scale: [1, pulseScale, 1],
      rotate: [-1, 1, -1]
    }}
    transition={{ 
      duration: 1.5, 
      repeat: Infinity, 
      ease: "easeInOut" 
    }}
    className={cn("relative flex items-center justify-center", className)}
    style={{ 
      filter: `hue-rotate(${hue}deg) brightness(1.1) contrast(1.1)`
    }}
  >
    <img 
      src="https://i.ibb.co/JwYQcc2D/egg.png" 
      alt="Egg" 
      className="w-full h-full object-contain"
    />
  </motion.div>
);

export const ItemIcon: React.FC<{
  type: string;
  image?: string;
  hue?: number;
  fallbackEmoji?: string;
  className?: string;
}> = ({ type, image, hue, fallbackEmoji, className }) => {
  const [imgError, setImgError] = useState(false);

  // Use raw emoji if image loading failed or if it was requested
  const emoji = fallbackEmoji || (type === 'egg' ? '🥚' : '📦');

  if (type === 'egg') {
    return <AnimatedEgg hue={hue} className={className} />;
  }

  // If we have an image and it's not a shop item (implied by removal of image from shop constants), try to show it
  if (image && !imgError && !image.includes('fonts.gstatic.com')) {
    return (
      <img 
        src={image} 
        onError={(e) => {
          setImgError(true);
        }} 
        className={cn("w-full h-full object-contain", className)} 
        alt="" 
      />
    );
  }

  return (
    <div className={cn("flex items-center justify-center select-none not-italic", className)}>
      <span 
        className="drop-shadow-sm leading-none inline-block italic-fix" 
        style={{ 
          fontStyle: 'normal', 
          fontFamily: '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif',
          transform: 'none',
          display: 'inline-block'
        }}
      >
        {emoji}
      </span>
    </div>
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
        "scribble-border scribble-hover px-4 py-3 sm:px-6 font-bold text-pen-blue bg-transparent transition-all duration-300 active:scale-95",
        "relative disabled:opacity-50 cursor-pointer w-fit overflow-visible",
        className
      )}
    >
      {loading ? (
        <div className="flex items-center justify-center relative z-10">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-pen-blue/30 border-t-pen-blue" />
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2 relative z-10">
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
          <PenLine className="w-5 h-5 text-pen-blue opacity-60" strokeWidth={3} />
        </motion.span>
      )}
    </span>
  );
};

export const LogoAnimation: React.FC<{
  containerClassName?: string;
  logoClassName?: string;
  imgClassName?: string;
}> = ({ 
  containerClassName = "h-full flex w-full items-center justify-center p-8",
  logoClassName = "relative w-[70%] max-w-[400px] aspect-square flex items-center justify-center",
  imgClassName = "w-full h-full object-contain filter contrast-125 -rotate-1"
}) => {
  const maskId = React.useId().replace(/:/g, '');
  
  return (
    <div className={containerClassName}>
      <div className={logoClassName}>
        <svg width="0" height="0" className="absolute">
          <defs>
            <mask id={`stroke-mask-${maskId}`} maskUnits="objectBoundingBox" maskContentUnits="objectBoundingBox">
              <style>
                {`
                  .stroke-anim-${maskId} {
                    stroke: white;
                    fill: none;
                    stroke-width: 0.2;
                    stroke-linecap: round;
                    stroke-linejoin: round;
                    stroke-dasharray: 15;
                    stroke-dashoffset: 15;
                    animation: draw-erase-${maskId} 6s infinite ease-in-out;
                  }
                  .stroke-1-${maskId} { animation-delay: 0s; }
                  .stroke-2-${maskId} { animation-delay: 0.3s; }
                  @keyframes draw-erase-${maskId} {
                    0%, 15% { stroke-dashoffset: 15; }
                    40%, 60% { stroke-dashoffset: 0; }
                    85%, 100% { stroke-dashoffset: -15; }
                  }
                `}
              </style>
              <path className={`stroke-anim-${maskId} stroke-1-${maskId}`} d="M -0.2,0.1 L 1.2,0.2 L -0.2,0.3 L 1.2,0.4 L -0.2,0.5 L 1.2,0.6 L -0.2,0.7 L 1.2,0.8 L -0.2,0.9 L 1.2,1.0" />
              <path className={`stroke-anim-${maskId} stroke-2-${maskId}`} d="M 1.2,0.05 L -0.2,0.15 L 1.2,0.25 L -0.2,0.35 L 1.2,0.45 L -0.2,0.55 L 1.2,0.65 L -0.2,0.75 L 1.2,0.85 L -0.2,0.95 L 1.2,1.05" />
            </mask>
          </defs>
        </svg>
        <img 
          src="https://i.ibb.co/k2PN7Q8y/aisailogo.png" 
          alt="AiSai Logo"
          className={imgClassName}
          style={{ maskImage: `url(#stroke-mask-${maskId})`, WebkitMaskImage: `url(#stroke-mask-${maskId})` }}
        />
      </div>
    </div>
  );
};
