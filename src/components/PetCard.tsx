import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Pet, Element, Attribute } from '../types';
import { getPetRankByLevel, calculateCP, getExpNeeded } from '../lib/gameLogic';
import { RARITY_STYLES, RARITY_LABELS } from '../constants/gameData';
import { ElementSticker, AttributeSticker } from './GameUI';
import { ShoppingBag, Briefcase, ChevronRight, Maximize2, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';

interface PetCardProps {
  pet: Pet;
  onClick?: () => void;
  onOpenRankInfo?: (e: React.MouseEvent) => void;
  onOpenRarityInfo?: (e: React.MouseEvent) => void;
  onOpenImage?: (e: React.MouseEvent) => void;
  onOpenElementInfo?: (element: Element, e: React.MouseEvent) => void;
  onOpenAttributeInfo?: (attribute: Attribute, e: React.MouseEvent) => void;
  onOpenStore?: (e: React.MouseEvent) => void;
  onOpenInventory?: (e: React.MouseEvent) => void;
  showDetails?: boolean;
  className?: string;
  hideDetailsText?: boolean;
  showPrice?: number;
}

export const PetCard: React.FC<PetCardProps> = ({ 
  pet, 
  onClick, 
  onOpenRankInfo,
  onOpenRarityInfo,
  onOpenImage,
  onOpenElementInfo,
  onOpenAttributeInfo,
  onOpenStore,
  onOpenInventory,
  showDetails = false, 
  className = "",
  hideDetailsText = false,
  showPrice
}) => {
  const navigate = useNavigate();
  const cp = calculateCP(pet);
  const rarityStyle = RARITY_STYLES[pet?.rarity] || RARITY_STYLES.normal;
  const expNeeded = getExpNeeded(pet?.level || 1);
  const expProgress = ((pet?.experience || 0) / expNeeded) * 100;
  const ageStage = pet?.ageStage || 'F - младенчество';
  const rankLetter = ageStage.split(' ')[0];

  const potentialRank = getPetRankByLevel(pet?.level || 1);
  const potentialRankCode = potentialRank.split(' ')[0];
  const currentRankIndex = ['F', 'E', 'D', 'C', 'B', 'A', 'S', 'EX', 'UX', 'Z'].indexOf(potentialRankCode);
  const expectedSkills = (currentRankIndex * 2) + 2;
  const isEvolutionReady = potentialRankCode !== rankLetter || (pet.level >= 11 && (pet.skills || []).length < expectedSkills);

  const handleEvolutionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/evolve/${pet.id}`);
  };

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className={cn("relative group cursor-pointer aspect-[9/16]", className)}
    >
      {/* Evolution Badge TOP CENTER */}
      {isEvolutionReady && (
        <motion.div 
          initial={{ y: -10, opacity: 0, x: '-50%' }}
          animate={{ y: -5, opacity: 1, x: '-50%' }}
          className="absolute -top-3 left-1/2 z-[70] bg-pen-red text-white p-2 rounded-full cursor-pointer shadow-[0_0_15px_rgba(196,30,58,0.6)] hover:scale-110 active:scale-95 transition-all"
          onClick={handleEvolutionClick}
        >
           <Sparkles className="h-4 w-4 animate-spin-slow" />
        </motion.div>
      )}

      {/* CP Badge - No shadow, rarity color border */}
      <div 
        className="absolute -top-2 -right-3 z-[60] bg-sticker-yellow border-2 px-2 py-0.5 rotate-3"
        style={{ borderColor: rarityStyle.color }}
        onClick={(e) => e.stopPropagation()}
      >
        <span className="font-black text-[16px]">{cp}</span>
      </div>

      {/* Rarity Tag - No shadow, rarity color border */}
      <div 
        className="absolute -top-2 -left-3 z-[60] border-2 px-2 py-0.5 -rotate-3 cursor-pointer hover:scale-105 transition-transform"
        style={{ backgroundColor: rarityStyle.bgColor, color: rarityStyle.color, borderColor: rarityStyle.color }}
        onClick={(e) => { e.stopPropagation(); onOpenRarityInfo?.(e); }}
      >
        <span className="font-black text-[16px]">{RARITY_LABELS[pet.rarity]}</span>
      </div>

      {/* Large Rank Letter - Positioned below the rarity tag on the left edge */}
      <div 
        className="absolute top-8 -left-[11px] z-[70] cursor-pointer hover:scale-110 transition-transform"
        onClick={(e) => { e.stopPropagation(); onOpenRankInfo?.(e); }}
      >
        <span className="text-[64px] font-black italic select-none leading-none tracking-tighter" style={{ color: '#0047ab', WebkitTextStroke: '0px transparent' }}>{rankLetter}</span>
      </div>

      <div 
        onClick={onClick}
        className="w-full h-full relative group"
      >
        {/* The Card Body with Internal Overflow Hidden for the Background Image */}
        <div 
          className="absolute inset-0 bg-white border-2 overflow-visible"
          style={{ 
            borderColor: rarityStyle.color,
          }}
        >
          {/* Background Image Layer */}
          <div className="absolute inset-0 z-0 overflow-hidden">
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

            {/* Vignette Effect (Color insets) - Removed blur to keep it crisp */}
            <div 
              className="absolute inset-0 pointer-events-none z-10"
              style={{ 
                border: `inset 4px ${rarityStyle.color}22`
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
                    <ElementSticker element={pet.element} />
                 </div>
                 <div 
                   className="hover:scale-110 transition-transform origin-bottom-right w-fit rotate-[4deg] pointer-events-auto"
                   onClick={(e) => { e.stopPropagation(); onOpenAttributeInfo?.(pet.attribute, e); }}
                 >
                    <AttributeSticker attribute={pet.attribute} />
                 </div>
              </div>

              {/* Text Information Block - Transparent Background */}
              <div className="w-full space-y-1 p-3 pb-4">
                <div className="flex justify-between items-start gap-2 mb-1">
                  <h3 className="font-black text-pen-blue leading-[1.1] text-balance text-[16px]">
                    {pet.name}
                  </h3>
                  <span className="font-black text-pen-blue whitespace-nowrap leading-none text-[16px]">LVL {pet.level}</span>
                </div>
                
                <div 
                  className="flex items-center justify-between font-black text-pen-blue italic leading-tight cursor-pointer hover:opacity-60 transition-opacity text-[16px]"
                  onClick={(e) => { e.stopPropagation(); onOpenRankInfo?.(e); }}
                >
                  <span className="opacity-80">{ageStage.split(' - ')[1] || ageStage}</span>
                  <span className="opacity-80">{(pet?.experience || 0)}/{expNeeded} XP</span>
                </div>

                {/* XP Bar */}
                <div className="h-1.5 bg-black/10 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${expProgress}%` }}
                    className="h-full bg-pen-blue"
                  />
                </div>

                {showPrice !== undefined && (
                  <div className="text-[16px] font-black text-pen-blue mt-1 italic text-center w-full">{showPrice} 🌱</div>
                )}

                {/* Removed "Подробнее" button for less UI noise */}
              </div>
            </div>
          </div>
        </div>

        {/* --- UI Elements Crossing the Borders (Sibling to the body to avoid clipping) --- */}
        
        {/* Top Right Zoom Button */}
        <button 
          onClick={(e) => { e.stopPropagation(); onOpenImage?.(e); }}
          className="absolute top-[-14px] right-12 z-50 p-1.5 bg-sticker-yellow border-2 rounded-full text-pen-blue hover:bg-white hover:scale-120 transition-all rotate-[-3deg] active:scale-95"
          style={{ borderColor: rarityStyle.color }}
          title="Просмотр"
        >
          <Maximize2 className="h-4 w-4" />
        </button>

        {/* Top Right Quick Actions */}
        <div className="absolute top-10 right-[-14px] flex flex-col gap-2 z-50">
          <button 
            onClick={(e) => { e.stopPropagation(); navigate('/shop'); }}
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
      </div>
    </motion.div>
  );
};
