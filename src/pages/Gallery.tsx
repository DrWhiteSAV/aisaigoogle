import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserProgress, Pet } from '../types';
import { cn } from '../lib/utils';
import { Image as ImageIcon, ChevronRight, ArrowRight, ArrowLeft } from 'lucide-react';
import { GalleryCard } from '../components/GalleryCard';
import { InfoModal } from '../components/GameUI';
import { motion, AnimatePresence } from 'motion/react';

export const Gallery: React.FC<{ progress: UserProgress; side?: 'left' | 'right'; manualId?: string }> = ({ progress, side = 'left', manualId }) => {
  const navigate = useNavigate();
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const pets = progress.pets || [];
  
  const petIndex = pets.findIndex(p => p.id === manualId);
  const pet = petIndex !== -1 ? pets[petIndex] : null;

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

  if (!pet) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-4">
        <h2 className="text-2xl font-black text-pen-blue">Сущность не найдена</h2>
      </div>
    );
  }

  const hasNext = petIndex < pets.length - 1;
  const targetPageNum = petIndex * 2 + (side === 'left' ? 1 : 2);

  if (side === 'left') {
    return (
      <div className="h-full flex flex-col ledger-grid">
        <div className="mb-4 flex items-center justify-between shrink-0 px-2 pt-2">
          <h2 className="text-lg font-black text-pen-blue italic tracking-tighter flex items-center gap-2 truncate max-w-full">
            <ImageIcon className="h-4 w-4 shrink-0" />
            Питомец {petIndex + 1} из {pets.length}
          </h2>
          <span className="text-[12px] text-pen-blue/40 font-mono">#{pet.id.slice(0,4)}</span>
        </div>

        <div className="flex-1 min-h-0 bg-white/10 border-2 border-black/5 rounded-sm p-3 overflow-hidden ml-2 mb-4">
          <div className="overflow-y-auto h-full pr-1 no-scrollbar">
            <div className="flex flex-col gap-4">
                {hasNext ? (
                  <div onClick={() => {
                    const nextPet = pets[petIndex + 1];
                    if (nextPet) navigate(`/gallery/${nextPet.id}`);
                  }} className="flex items-center justify-between p-3 bg-pen-blue/5 border border-pen-blue/10 rounded-sm cursor-pointer group hover:bg-pen-blue/10 transition-colors shrink-0">
                    <span className="text-[14px] font-black text-pen-blue">Следующая сущность</span>
                    <motion.div 
                      animate={{ x: [0, 5, 0] }} 
                      transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                      className="w-6 h-6 rounded-full border border-pen-blue flex items-center justify-center text-pen-blue group-hover:bg-pen-blue group-hover:text-white transition-colors"
                    >
                       <ArrowRight className="w-3 h-3" />
                    </motion.div>
                  </div>
                ) : (pets.length > 1 ? (
                  <div onClick={() => navigate(`/gallery/${pets[0].id}`)} className="flex items-center justify-between p-3 bg-pen-blue/5 border border-pen-blue/10 rounded-sm cursor-pointer group hover:bg-pen-blue/10 transition-colors shrink-0">
                    <span className="text-[14px] font-black text-pen-blue">К первой сущности</span>
                    <motion.div 
                      animate={{ x: [0, -5, 0] }} 
                      transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                      className="w-6 h-6 rounded-full border border-pen-blue flex items-center justify-center text-pen-blue group-hover:bg-pen-blue group-hover:text-white transition-colors"
                    >
                       <ArrowLeft className="w-3 h-3" />
                    </motion.div>
                  </div>
                ) : null)}

               <div className="w-full">
                 <div className="grid grid-cols-2 gap-3 pb-6">
                    {(pet.imageHistory && pet.imageHistory.length > 0 ? pet.imageHistory : [pet.image]).map((img, i) => {
                      const RANKS = ['F - младенчество', 'E - детство', 'D - отрочество', 'C - молодость', 'B - взросление', 'A - зрелость', 'S - мудрость', 'EX - единство', 'UX - пробуждение', 'Z - абсолютность'];
                      const stage = RANKS[i] || 'Загадочный Этап';
                      const historicalName = (pet.nameHistory && pet.nameHistory[i]) ? pet.nameHistory[i] : (i === 0 && pet.nameHistory ? pet.nameHistory[0] : pet.name);
                      const historicalPet = { ...pet, image: img, ageStage: stage, name: historicalName };
                      return (
                        <div key={i} className="relative group">
                          <GalleryCard 
                            pet={historicalPet} 
                            isCompact={true} 
                            hideStats={true} 
                            onOpenImage={() => setFullScreenImage(historicalPet.image)}
                          />
                        </div>
                      );
                    })}
                 </div>
               </div>
            </div>
          </div>
        </div>

        <InfoModal 
          isOpen={!!fullScreenImage} 
          onClose={() => setFullScreenImage(null)}
          title="Просмотр"
          showClose={true}
          plain={true}
        >
          {fullScreenImage && (
             <motion.img 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               src={fullScreenImage} 
               alt="Pet zoom" 
               className="max-w-[95%] max-h-[95%] object-contain shadow-2xl rounded-sm"
               referrerPolicy="no-referrer"
             />
          )}
        </InfoModal>
      </div>
    );
  }

  // Right side: Info and Next indicator
  return (
    <div className="h-full flex flex-col ledger-grid">
      <div className="mb-4 flex items-center justify-between shrink-0 px-2 pt-2">
        <h2 className="text-lg font-black text-pen-blue/40 italic tracking-tighter flex items-center gap-2 truncate max-w-full">
          {/* Empty Space */}
        </h2>
      </div>

      <div className="flex-1 min-h-0 bg-white/10 border-2 border-black/5 rounded-sm overflow-hidden mr-2 mb-4 flex flex-col items-center justify-center relative">
        <div className="p-8 text-center space-y-6">
           <div>
             <h3 className="text-2xl font-black text-pen-blue italic mb-2">{pet.name}</h3>
             <p className="text-sm font-medium text-pen-blue/60 tracking-wider">Сущность #{petIndex + 1} из {pets.length}</p>
           </div>
           
           <div className="flex justify-center py-4">
             <div className="w-16 h-[2px] bg-pen-blue/20" />
           </div>
           
           {hasNext ? (
             <div className="space-y-4">
                <p className="text-[16px] font-black text-pen-blue/80 italic tracking-widest">
                  Следующая сущность:
                </p>
                <div onClick={() => {
                  const nextPet = pets[petIndex + 1];
                  if (nextPet) navigate(`/gallery/${nextPet.id}`);
                }} className="cursor-pointer group flex flex-col items-center">
                   <p className="text-[20px] font-black text-pen-blue mb-4 group-hover:scale-105 transition-transform truncate max-w-full px-4">
                     {pets[petIndex + 1].name}
                   </p>
                   <motion.div 
                     animate={{ x: [0, 10, 0] }} 
                     transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                     className="w-12 h-12 rounded-full border-2 border-pen-blue flex items-center justify-center text-pen-blue group-hover:bg-pen-blue group-hover:text-white transition-colors"
                   >
                      <ArrowRight className="w-5 h-5" />
                   </motion.div>
                </div>
             </div>
           ) : (pets.length > 1 ? (
             <div className="space-y-4">
                <p className="text-[16px] font-black text-pen-blue/80 italic tracking-widest">
                  Конец галереи
                </p>
                <div onClick={() => {
                  navigate(`/gallery/${pets[0].id}`);
                }} className="cursor-pointer group flex flex-col items-center">
                   <p className="text-[20px] font-black text-pen-blue mb-4 group-hover:scale-105 transition-transform truncate max-w-full px-4">
                     Вернуться к началу
                   </p>
                   <motion.div 
                     animate={{ x: [0, -10, 0] }} 
                     transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                     className="w-12 h-12 rounded-full border-2 border-pen-blue flex items-center justify-center text-pen-blue group-hover:bg-pen-blue group-hover:text-white transition-colors"
                   >
                      <ArrowLeft className="w-5 h-5" />
                   </motion.div>
                </div>
             </div>
           ) : (
             <div className="space-y-4">
                <p className="text-[16px] font-black text-pen-blue/60 italic tracking-widest">
                  Это последняя сущность
                </p>
                <div className="flex justify-center">
                   <ImageIcon className="w-12 h-12 text-pen-blue/20" />
                </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
};
