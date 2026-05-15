import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Element, Attribute, Rarity } from '../types';
import { ELEMENT_DATA, ATTRIBUTE_DATA, RARITY_LABELS } from '../constants/gameData';
import { getSummonerRank, RANKS_INFO } from '../lib/gameLogic';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Info, X } from 'lucide-react';

export const RankInfoModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  rankInfo: { name: string, limit: number };
}> = ({ isOpen, onClose, rankInfo }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative max-w-md w-full max-h-[80vh] overflow-y-auto no-scrollbar bg-[#f2ede0] ledger-grid border-4 border-pen-blue p-6 text-left space-y-4 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b-2 border-pen-blue/20 pb-2 mb-4">
               <h2 className="text-[20px] font-black text-pen-blue">Ранг Призывателя</h2>
               <button onClick={onClose} className="flex items-center justify-center text-pen-blue text-[50px] leading-none hover:rotate-90 transition-transform origin-center">&times;</button>
            </div>
            <div className="space-y-2">
               {RANKS_INFO.map(rank => {
                  const isCurrent = rank.name === rankInfo.name;
                  return (
                    <div 
                      key={rank.id} 
                      className={cn(
                        "p-3 flex justify-between items-center text-pen-blue font-black transition-colors border-2",
                        isCurrent ? "bg-transparent border-pen-blue" : "border-transparent bg-pen-blue/5 hover:bg-pen-blue/10"
                      )}
                    >
                       <div className="flex gap-3 items-center">
                  <span className="text-[20px] text-pen-blue font-black w-6 text-left">{rank.id}.</span>
                          <div className="flex flex-col">
                             <span className="text-[20px] text-pen-blue font-black">{rank.name}</span>
                             <span className="text-[20px] text-pen-blue font-black">(есть питомец {rank.req} ранга)</span>
                          </div>
                       </div>
                       <div className="text-[20px] text-pen-blue font-black text-right">
                          <span>право на {rank.limit} пит.</span>
                       </div>
                    </div>
                  )
               })}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// LogoAnimation removed

export const ElementSticker: React.FC<{ 
  element: Element; 
  showLabel?: boolean; 
  className?: string; 
  labelClassName?: string;
  onClick?: () => void;
}> = ({ element, showLabel = true, className, labelClassName, onClick }) => {
  const data = ELEMENT_DATA[element];
  const Icon = data.icon;

  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 transition-all bg-stone-50/40 rounded-lg px-2 py-0.5 border border-white/20",
        className
      )}
      style={{ color: data.color }}
    >
      <Icon className="h-6 w-6" />
      {showLabel && <span className={cn("text-[16px] font-black", labelClassName)}>{data.label}</span>}
    </button>
  );
};

export const AttributeSticker: React.FC<{ 
  attribute: Attribute; 
  showLabel?: boolean; 
  className?: string;
  labelClassName?: string;
  onClick?: () => void;
}> = ({ attribute, showLabel = true, className, labelClassName, onClick }) => {
  const data = ATTRIBUTE_DATA[attribute];
  const Icon = data.icon;

  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 transition-all bg-stone-50/40 rounded-lg px-2 py-0.5 border border-white/20",
        className
      )}
      style={{ color: data.color }}
    >
      <Icon className="h-6 w-6" />
      {showLabel && <span className={cn("text-[16px] font-black", labelClassName)}>{data.label}</span>}
    </button>
  );
};

export const InfoModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  showClose?: boolean;
  plain?: boolean;
  centerTitle?: boolean;
}> = ({ isOpen, onClose, title, children, showClose = true, plain = false, centerTitle = false }) => {
  return createPortal(
    <AnimatePresence>
      {isOpen && (
      <div 
        className="fixed inset-0 z-[1000] flex items-center justify-center p-0 md:p-4 h-screen w-screen"
        onMouseDown={(e) => {
          e.stopPropagation();
          e.nativeEvent.stopImmediatePropagation();
        }}
        onMouseMove={(e) => e.stopPropagation()}
        onTouchStart={(e) => {
          e.stopPropagation();
          e.nativeEvent.stopImmediatePropagation();
        }}
        onTouchMove={(e) => e.stopPropagation()}
      >
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 cursor-pointer"
        />
        <motion.div 
          initial={plain ? { opacity: 0, scale: 0.98 } : { opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={plain ? { opacity: 0, scale: 0.98 } : { opacity: 0, scale: 0.9, y: 20 }}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "relative pointer-events-auto z-10",
            plain 
              ? "flex items-center justify-center p-4 max-h-screen" 
              : "w-full max-w-sm bg-[#f2ede0] ledger-grid border-2 border-black p-6 rotate-1 shadow-2xl"
          )}
        >
          {showClose && (
            <button 
              onClick={onClose} 
              className={cn(
                "absolute z-50 p-2 hover:bg-white/10 rounded-full transition-colors",
                plain ? "top-4 right-4 sm:top-[-50px] sm:right-[-50px] text-white hover:scale-110" : "top-4 right-4 text-pen-blue"
              )}
            >
              <X className={plain ? "h-8 w-8" : "h-6 w-6"} strokeWidth={3} />
            </button>
          )}
          {!plain && <h3 className={cn("text-[24px] font-black text-pen-blue mb-4 tracking-tight", centerTitle && "text-center")}>{title}</h3>}
          <div className={plain ? "flex flex-col items-center justify-center overflow-hidden rounded-lg max-h-[85vh] aspect-[9/16]" : "space-y-4"}>
            {children}
          </div>
        </motion.div>
      </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export const TypeChartContent: React.FC<{ element?: Element; attribute?: Attribute }> = ({ element, attribute }) => {
  if (element) {
    const data = ELEMENT_DATA[element];
    const sequence: Element[] = ['water', 'fire', 'air', 'earth'];
    const currentIndex = sequence.indexOf(element);
    
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <p className="text-[16px] font-black text-pen-blue leading-tight">
            {data.description}
          </p>
          <p className="text-[16px] font-bold text-pen-blue italic leading-snug">
            Цикл стихий: Вода → Огонь → Воздух → Земля → Вода. Питомец с превосходящей стихией наносит на 20% больше урона (Атака и Магия x1.2).
          </p>
        </div>
        
        <div className="flex flex-col items-center gap-4 py-4">
           <div className="flex items-center gap-4">
              <ElementSticker element={sequence[0]} className={cn(element === sequence[0] && "ring-2 ring-pen-blue ring-offset-2")} />
              <span className="text-xl text-pen-blue/30">→</span>
              <ElementSticker element={sequence[1]} className={cn(element === sequence[1] && "ring-2 ring-pen-blue ring-offset-2")} />
           </div>
           <div className="flex items-center gap-4">
              <span className="text-xl text-pen-blue/30 leading-none">↑</span>
              <div className="w-[120px]" />
              <span className="text-xl text-pen-blue/30 leading-none">↓</span>
           </div>
           <div className="flex items-center gap-4">
              <ElementSticker element={sequence[3]} className={cn(element === sequence[3] && "ring-2 ring-pen-blue ring-offset-2")} />
              <span className="text-xl text-pen-blue/30">←</span>
              <ElementSticker element={sequence[2]} className={cn(element === sequence[2] && "ring-2 ring-pen-blue ring-offset-2")} />
           </div>
        </div>

        <div className="space-y-3 pt-4 border-t border-black/5">
          <div className="flex items-center justify-between">
            <span className="text-[16px] font-black text-pen-blue tracking-widest">Атака x1.2 над:</span>
            <ElementSticker element={data.strongAgainst} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[16px] font-black text-pen-blue tracking-widest">Уязвим к:</span>
            <ElementSticker element={data.weakTo} />
          </div>
        </div>
      </div>
    );
  }

  if (attribute) {
    const data = ATTRIBUTE_DATA[attribute];
    const sequence: Attribute[] = ['light', 'dark', 'void', 'time'];
    
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <p className="text-[16px] font-black text-pen-blue leading-tight">
            {data.description}
          </p>
          <p className="text-[16px] font-bold text-pen-blue italic leading-snug">
            Цикл атрибутов: Свет → Тьма → Пустота → Время → Свет. Питомец с превосходящим атрибутом получает на 20% больше Защиты (Защита x1.2).
          </p>
        </div>

        <div className="flex flex-col items-center gap-4 py-4">
           <div className="flex items-center gap-4">
              <AttributeSticker attribute={sequence[0]} className={cn(attribute === sequence[0] && "ring-2 ring-pen-blue ring-offset-2")} />
              <span className="text-xl text-pen-blue/30">→</span>
              <AttributeSticker attribute={sequence[1]} className={cn(attribute === sequence[1] && "ring-2 ring-pen-blue ring-offset-2")} />
           </div>
           <div className="flex items-center gap-4">
              <span className="text-xl text-pen-blue/30 leading-none">↑</span>
              <div className="w-[120px]" />
              <span className="text-xl text-pen-blue/30 leading-none">↓</span>
           </div>
           <div className="flex items-center gap-4">
              <AttributeSticker attribute={sequence[3]} className={cn(attribute === sequence[3] && "ring-2 ring-pen-blue ring-offset-2")} />
              <span className="text-xl text-pen-blue/30">←</span>
              <AttributeSticker attribute={sequence[2]} className={cn(attribute === sequence[2] && "ring-2 ring-pen-blue ring-offset-2")} />
           </div>
        </div>
        
        <div className="space-y-3 pt-4 border-t border-black/5">
          <div className="flex items-center justify-between">
            <span className="text-[16px] font-black text-pen-blue tracking-widest">Защита x1.2 от:</span>
            <AttributeSticker attribute={data.opponent} />
          </div>
        </div>
      </div>
    );
  }

  return null;
};
