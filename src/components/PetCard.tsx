import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Pet, Element, Attribute } from '../types';
import { calculateCP, getExpNeeded } from '../lib/gameLogic';
import { RARITY_STYLES, RARITY_LABELS } from '../constants/gameData';
import { ElementSticker, AttributeSticker } from './GameUI';
import { ShoppingBag, Briefcase, ChevronRight, Maximize2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface PetCardProps {
  pet: Pet;
  onClick?: () => void;
  onOpenRankInfo?: (e: React.MouseEvent) => void;
  onOpenImage?: (e: React.MouseEvent) => void;
  onOpenElementInfo?: (element: Element, e: React.MouseEvent) => void;
  onOpenAttributeInfo?: (attribute: Attribute, e: React.MouseEvent) => void;
  onOpenStore?: (e: React.MouseEvent) => void;
  onOpenInventory?: (e: React.MouseEvent) => void;
  showDetails?: boolean;
  className?: string;
  hideDetailsText?: boolean;
}

export const PetCard: React.FC<PetCardProps> = ({ 
  pet, 
  onClick, 
  onOpenRankInfo,
  onOpenImage,
  onOpenElementInfo,
  onOpenAttributeInfo,
  onOpenStore,
  onOpenInventory,
  showDetails = false, 
  className = "",
  hideDetailsText = false
}) => {
  const navigate = useNavigate();
  const cp = calculateCP(pet);
  const rarityStyle = RARITY_STYLES[pet.rarity];
  const expNeeded = getExpNeeded(pet.level);
  const expProgress = (pet.experience / expNeeded) * 100;
  const rankLetter = pet.ageStage.split(' ')[0];

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className={cn("relative group cursor-pointer", className)}
    >
      {/* CP Badge - No shadow, rarity color border */}
      <div 
        className="absolute -top-2 -right-3 z-[60] bg-sticker-yellow border-2 px-2 py-0.5 rotate-3"
        style={{ borderColor: rarityStyle.color }}
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-[10px] font-black">{cp}</span>
      </div>

      {/* Rarity Tag - No shadow, rarity color border */}
      <div 
        className="absolute -top-2 -left-3 z-[60] border-2 px-2 py-0.5 -rotate-3 pointer-events-none"
        style={{ backgroundColor: rarityStyle.bgColor, color: rarityStyle.color, borderColor: rarityStyle.color }}
      >
        <span className="text-[8px] font-black uppercase">{RARITY_LABELS[pet.rarity]}</span>
      </div>

      <div 
        onClick={onClick}
        className="w-full h-full relative aspect-[9/16] group"
      >
        {/* The Card Body with Internal Overflow Hidden for the Background Image */}
        <div 
          className="absolute inset-0 bg-white border-2 overflow-hidden"
          style={{ 
            borderColor: rarityStyle.color,
          }}
        >
          {/* Background Image Layer */}
          <div className="absolute inset-0 z-0">
            <img 
              src={pet.image} 
              alt={pet.name} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
              referrerPolicy="no-referrer"
            />
            
            {/* Bottom-up Gradient Overlay - Height adjusted to end near stickers as requested */}
            <div 
              className="absolute inset-x-0 bottom-0 h-[40%] bg-gradient-to-t from-stone-50 via-stone-50/80 to-transparent pointer-events-none" 
            />

            {/* Vignette Effect (Color insets) */}
            <div 
              className="absolute inset-0 pointer-events-none z-10"
              style={{ 
                boxShadow: `inset 0 0 48px 8px ${rarityStyle.color}66`
              }}
            />
          </div>

          {/* Content Overlay - Text and stickers (Inside overflow-hidden container) */}
          <div className="absolute inset-0 z-20 flex flex-col">
            <div className="mt-auto flex flex-col gap-1 pb-1">
              {/* Stickers (Element/Attribute) - Pinned to respective sides */}
              <div className="flex justify-between items-end w-full px-3 mb-2">
                 <div 
                   className="hover:scale-110 transition-transform origin-bottom-left w-fit rotate-[-4deg] pointer-events-auto"
                   onClick={(e) => { e.stopPropagation(); onOpenElementInfo?.(pet.element, e); }}
                 >
                    <ElementSticker element={pet.element} className="scale-[0.8]" />
                 </div>
                 <div 
                   className="hover:scale-110 transition-transform origin-bottom-right w-fit rotate-[4deg] pointer-events-auto"
                   onClick={(e) => { e.stopPropagation(); onOpenAttributeInfo?.(pet.attribute, e); }}
                 >
                    <AttributeSticker attribute={pet.attribute} className="scale-[0.8]" />
                 </div>
              </div>

              {/* Text Information Block - Transparent Background */}
              <div className="w-full space-y-1 p-4 pb-5">
                <div className="flex justify-between items-end gap-2 mb-1">
                  <h3 
                    className={cn(
                      "font-black text-pen-blue leading-none truncate drop-shadow-sm",
                      pet.name.length > 20 ? "text-[10px]" : 
                      pet.name.length > 15 ? "text-xs" : 
                      "text-sm"
                    )}
                  >
                    {pet.name}
                  </h3>
                  <span className="text-[18px] font-black text-pen-blue whitespace-nowrap leading-none drop-shadow-sm">LVL {pet.level}</span>
                </div>
                
                <div className="flex items-center justify-between text-[14px] font-black text-pen-blue italic leading-tight">
                  <span className="opacity-80">{pet.ageStage.split(' - ')[1] || pet.ageStage}</span>
                  <span className="opacity-80">{pet.experience}/{expNeeded} XP</span>
                </div>

                {/* XP Bar */}
                <div className="h-1 bg-black/10 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${expProgress}%` }}
                    className="h-full bg-pen-blue"
                  />
                </div>

                {showDetails && !hideDetailsText && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); onClick?.(); }}
                    className="w-full mt-1 pt-1 border-t border-dashed border-black/10 flex items-center justify-between hover:text-pen-blue transition-colors text-pen-blue/40"
                  >
                    <span className="text-[9px] font-black uppercase tracking-widest">Подробнее</span>
                    <ChevronRight className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* --- UI Elements Crossing the Borders (Sibling to the body to avoid clipping) --- */}
        
        {/* Top Right Zoom Button */}
        <button 
          onClick={(e) => { e.stopPropagation(); onOpenImage?.(e); }}
          className="absolute top-[-14px] right-12 z-50 p-1.5 bg-sticker-yellow border-2 rounded-full text-pen-blue hover:bg-white hover:scale-120 transition-all rotate-[-3deg] active:scale-95 shadow-sm"
          style={{ borderColor: rarityStyle.color }}
          title="Просмотр"
        >
          <Maximize2 className="h-4 w-4" />
        </button>

        {/* Top Right Quick Actions */}
        <div className="absolute top-10 right-[-14px] flex flex-col gap-2 z-50">
          <button 
            onClick={(e) => { e.stopPropagation(); navigate('/sale'); }}
            className="bg-sticker-yellow border-2 p-1.5 hover:bg-white transition-colors rotate-[4deg] active:scale-95"
            style={{ borderColor: rarityStyle.color }}
          >
            <ShoppingBag className="h-4 w-4 text-pen-blue" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onOpenInventory?.(e); }}
            className="bg-sticker-blue border-2 p-1.5 hover:bg-white transition-colors rotate-[-4deg] active:scale-95"
            style={{ borderColor: rarityStyle.color }}
          >
            <Briefcase className="h-4 w-4 text-pen-blue" />
          </button>
        </div>

        {/* Rank Letter */}
        <button 
          onClick={(e) => { e.stopPropagation(); onOpenRankInfo?.(e); }}
          className="absolute top-8 left-[-16px] z-50 text-6xl font-black text-pen-blue hover:scale-110 transition-transform leading-none mix-blend-multiply rotate-[-6deg] active:scale-95"
        >
          {rankLetter}
        </button>
      </div>
    </motion.div>
  );
};
