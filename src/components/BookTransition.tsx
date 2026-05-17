import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, Sparkles } from 'lucide-react';

export const GlobalBookTransition = ({ currentBook }: { currentBook: string }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const prevBook = useRef<string | null>(null);

  useEffect(() => {
    if (prevBook.current !== null && prevBook.current !== currentBook) {
      // Only animate transitions between main sections (not during initial load)
      setIsAnimating(true);
      const t = setTimeout(() => setIsAnimating(false), 1200);
      prevBook.current = currentBook;
      return () => clearTimeout(t);
    }
    prevBook.current = currentBook;
  }, [currentBook]);

  return (
    <AnimatePresence>
      {isAnimating && (
        <motion.div 
          className="fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center overflow-hidden"
        >
          {/* Swirling Pen Lines */}
          <svg className="absolute w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 1000">
             {/* Main Scribble Array */}
             {Array.from({ length: 5 }).map((_, i) => (
               <motion.path
                  key={`swish-${i}`}
                  d={`M ${-200 + Math.random() * 400} ${100 + Math.random() * 800} Q ${300 + Math.random() * 400} ${100 + Math.random() * 800} 500 500 T ${1200 + Math.random() * 200} ${100 + Math.random() * 800}`}
                  fill="none"
                  stroke="#0047AB"
                  strokeWidth={2 + Math.random() * 6}
                  strokeDasharray={Math.random() > 0.5 ? "15 10" : "none"}
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: [0, 0.8, 0] }}
                  transition={{ duration: 0.7 + Math.random() * 0.4, ease: "easeInOut" }}
               />
             ))}

             {/* Burst Lines from Center */}
             {Array.from({ length: 12 }).map((_, i) => (
                <motion.line
                  key={`burst-${i}`}
                  x1="500" y1="500"
                  x2={500 + Math.cos((i * Math.PI) / 6) * (300 + Math.random() * 200)}
                  y2={500 + Math.sin((i * Math.PI) / 6) * (300 + Math.random() * 200)}
                  stroke="#0047AB"
                  strokeWidth={1 + Math.random() * 3}
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: [0, 1, 0], opacity: [0, 0.6, 0] }}
                  transition={{ duration: 0.6, delay: 0.1 + Math.random() * 0.2 }}
                />
             ))}

             {/* Outline Expanding Rings */}
             {Array.from({ length: 3 }).map((_, i) => (
                 <motion.circle
                    key={`ring-${i}`}
                    cx="500" cy="500" r="50"
                    fill="none"
                    stroke="#0047AB"
                    strokeWidth={4 - i}
                    strokeDasharray={i % 2 === 0 ? "8 8" : "none"}
                    initial={{ scale: 0, opacity: 0, rotate: 0 }}
                    animate={{ scale: 10 + i * 2, opacity: [0, 0.4, 0], rotate: i % 2 === 0 ? 45 : -45 }}
                    transition={{ duration: 1 + i * 0.2, ease: "easeOut" }}
                 />
             ))}
          </svg>
          
          {/* Floating Doodle Icons */}
          <div className="absolute inset-0 flex items-center justify-center">
             {Array.from({ length: 15 }).map((_, i) => {
               const angle = Math.random() * Math.PI * 2;
               const distance = 50 + Math.random() * 400;
               return (
                 <motion.div
                   key={`icon-${i}`}
                   className="absolute text-pen-blue"
                   initial={{ 
                     opacity: 0, 
                     scale: 0, 
                     x: 0, 
                     y: 0,
                     rotate: 0 
                   }}
                   animate={{ 
                     opacity: [0, 1, 0], 
                     scale: [0, 1.2, 0.5],
                     x: Math.cos(angle) * distance,
                     y: Math.sin(angle) * distance,
                     rotate: Math.random() * 360
                   }}
                   transition={{ duration: 0.8, delay: Math.random() * 0.3 }}
                 >
                   {Math.random() > 0.5 ? 
                     <Star size={12 + Math.random() * 20} strokeWidth={1.5} /> : 
                     <Sparkles size={12 + Math.random() * 20} strokeWidth={1.5} />
                   }
                 </motion.div>
               );
             })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
