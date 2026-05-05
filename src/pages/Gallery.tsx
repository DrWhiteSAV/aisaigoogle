import React from 'react';
import { UserProgress, Pet, Rarity } from '../types';
import { cn } from '../lib/utils';
import { RARITY_LABELS, RARITY_STYLES } from '../constants/gameData';
import { ElementSticker, AttributeSticker } from '../components/GameUI';
import { Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';

interface GalleryPetCardProps {
  pet: Pet;
}

const GalleryPetCard: React.FC<GalleryPetCardProps> = ({ pet }) => {
  const rarityType = pet.rarity.toLowerCase() as Rarity;
  const style = RARITY_STYLES[rarityType] || RARITY_STYLES.normal;

  return (
    <div className="flex flex-col items-center gap-2 w-full h-full p-1">
      <div 
        className="relative aspect-[9/16] w-full bg-white border shadow-sm flex flex-col overflow-hidden"
        style={{ borderColor: style.color }}
      >
        <img 
          src={pet.image} 
          alt={pet.name} 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-2 left-2 z-10">
          <div 
            className="px-2 py-0.5 text-[10px] sm:text-[11px] font-black border-2 bg-white shadow-sm"
            style={{ 
              borderColor: style.color,
              color: style.color
            }}
          >
            {RARITY_LABELS[rarityType]}
          </div>
        </div>
      </div>
      
      <div className="w-full space-y-0.5 mt-auto">
        <div className="flex items-center justify-center gap-0 -mt-1.5 h-10">
          <ElementSticker element={pet.element} className="scale-[0.65] origin-center border-none bg-transparent p-0 flex-shrink-0" />
          <AttributeSticker attribute={pet.attribute} className="scale-[0.65] origin-center border-none bg-transparent p-0 flex-shrink-0" />
        </div>
        <div className="text-center font-black text-pen-blue text-[13px] sm:text-[14px] truncate px-1 -mt-2">
          {pet.name}
        </div>
      </div>
    </div>
  );
};

export const Gallery: React.FC<{ progress: UserProgress; side?: 'left' | 'right' }> = ({ progress, side = 'left' }) => {
  const { pageNum } = useParams<{ pageNum: string }>();
  const navigate = useNavigate();
  const pets = progress.pets || [];
  
  const currentPage = parseInt(pageNum || '1');
  const petsPerPage = 4;
  const totalPages = Math.ceil(pets.length / petsPerPage);
  
  // Determine which pets to show on this side
  // Spread p: pets [(p-1)*4, (p-1)*4 + 1] on Left, [(p-1)*4 + 2, (p-1)*4 + 3] on Right
  const startIndex = (currentPage - 1) * 4 + (side === 'left' ? 0 : 2);
  const sidePets = pets.slice(startIndex, startIndex + 2);

  if (pets.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-4">
        <div className="w-24 h-24 border-4 border-dashed border-black/10 rounded-full flex items-center justify-center">
          <ImageIcon className="h-10 w-10 text-black/10" />
        </div>
        <h2 className="text-2xl font-black text-pen-blue">Галерея пуста</h2>
        <p className="text-pen-blue/60 font-medium italic">Призовите сущностей, чтобы наполнить книгу</p>
      </div>
    );
  }

  const handlePrev = () => {
    if (currentPage > 1) navigate(`/gallery/${currentPage - 1}`);
  };

  const handleNext = () => {
    if (currentPage < totalPages) navigate(`/gallery/${currentPage + 1}`);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4 flex items-center justify-between shrink-0">
        <h2 className="text-lg font-black text-pen-blue italic tracking-tighter uppercase flex items-center gap-2">
          <ImageIcon className="h-4 w-4" />
          Галерея {side === 'left' ? 'Питомцев' : 'Сущностей'}
        </h2>
        <div className="text-[10px] font-black text-pen-blue/40 uppercase tracking-widest">{pets.length} форм</div>
      </div>

      <div className="flex-1 min-h-0 bg-white/10 border-2 border-black/5 rounded-sm p-3 overflow-hidden">
        <div className="grid grid-cols-2 gap-x-3 h-full">
           {sidePets.map((pet) => (
             <GalleryPetCard key={pet.id} pet={pet} />
           ))}
           {sidePets.length === 0 && (
             <div className="col-span-2 h-full flex items-center justify-center border-2 border-dashed border-black/5">
                <div className="text-[10px] font-black text-pen-blue/20 uppercase tracking-widest text-center">
                  Эта страница<br/>пока пуста
                </div>
             </div>
           )}
        </div>
      </div>
      
      <div className="pt-4 flex items-center justify-between shrink-0">
        <button 
          onClick={handlePrev}
          disabled={currentPage <= 1 || side === 'right'}
          className={cn(
            "p-1 rounded-full transition-colors",
            (currentPage <= 1 || side === 'right') ? "opacity-0 pointer-events-none" : "hover:bg-black/5 text-pen-blue"
          )}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="text-center font-black italic text-pen-blue/40 text-[10px] uppercase tracking-widest">
           Страница {currentPage} из {totalPages} | Всего {pets.length} созревших
        </div>

        <button 
          onClick={handleNext}
          disabled={currentPage >= totalPages || side === 'left'}
          className={cn(
            "p-1 rounded-full transition-colors",
            (currentPage >= totalPages || side === 'left') ? "opacity-0 pointer-events-none" : "hover:bg-black/5 text-pen-blue"
          )}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};
