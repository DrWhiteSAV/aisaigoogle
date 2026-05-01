import React from 'react';
import { GlassCard, HandwrittenText } from '../components/UI';
import { UserProgress } from '../types';
import { Book, Search, Shield, Zap, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

const rarityMap: Record<string, string> = {
  common: 'ОБЫЧНЫЙ',
  rare: 'РЕДКИЙ',
  epic: 'ЭПИЧЕСКИЙ',
  mythic: 'МИФИЧЕСКИЙ',
  legendary: 'ЛЕГЕНДАРНЫЙ',
  divine: 'БОЖЕСТВЕННЫЙ'
};

export const Bestiary: React.FC<{ progress: UserProgress }> = ({ progress }) => {
  const discovered = progress.bestiary || [];

  return (
    <div className="container mx-auto px-6 py-12 max-w-6xl pb-32">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-pen-blue/40 font-black tracking-[0.2em] text-xs uppercase italic">
            <Book className="h-4 w-4" />
            <span>Дневник Наблюдений</span>
          </div>
          <h1 className="text-6xl font-black italic text-pen-blue uppercase tracking-tighter">БЕСТИАРИЙ</h1>
        </div>
        
        <div className="relative group hatching-shadow">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-pen-blue/20 group-focus-within:text-pen-blue transition-colors" />
          <input 
            type="text" 
            placeholder="Поиск по виду..."
             className="bg-white border-2 border-black/5 rounded-sm py-3 pl-12 pr-6 text-sm font-bold italic text-pen-blue outline-none focus:border-pen-blue transition-all w-full md:w-[300px]"
          />
        </div>
      </div>

      {discovered.length === 0 ? (
        <GlassCard color="white" className="p-20 text-center border-dashed border-pen-blue/10 opacity-50 hatching-shadow">
          <Sparkles className="h-12 w-12 text-pen-blue/10 mx-auto mb-4" />
          <p className="text-xl font-bold uppercase tracking-widest italic text-pen-blue/40">Твой архив открытий пока пуст</p>
          <div className="text-sm text-pen-blue/20 mt-2 max-w-xs mx-auto">
            <HandwrittenText text="Генерируй новых существ, чтобы заполнить эти страницы своими зарисовками..." speed={35} />
          </div>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {discovered.map((c, i) => (
            <motion.div
              key={`${c.species}-${i}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
            >
              <GlassCard 
                color={i % 4 === 0 ? 'yellow' : i % 4 === 1 ? 'pink' : i % 4 === 2 ? 'blue' : 'white'}
                rotation={(i % 3 === 0 ? 1 : i % 3 === 1 ? -1 : 2)}
                className="p-8 group hover:-translate-y-2 transition-all border-2 border-black/5 hatching-shadow h-full"
              >
                <div className="space-y-4 relative z-10 text-left">
                  <div className="inline-block px-3 py-1 bg-white/60 border border-pen-blue/20 rounded-sm text-[10px] font-black uppercase tracking-widest text-pen-blue">
                    {c.type}
                  </div>
                  
                  <div>
                    <h3 className="text-3xl font-black italic text-pen-blue tracking-tighter uppercase mb-1 leading-none">{c.species}</h3>
                    <p className="text-[10px] text-pen-blue/40 uppercase tracking-[0.2em] font-bold italic">{c.genus} • {c.family}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-[11px] font-bold uppercase tracking-widest text-pen-blue/30 italic">
                     <div className="space-y-1">
                        <div className="opacity-50">КЛАСС</div>
                        <div className="text-pen-blue/60">{c.class}</div>
                     </div>
                     <div className="space-y-1">
                        <div className="opacity-50">ОТРЯД</div>
                        <div className="text-pen-blue/60">{c.order}</div>
                     </div>
                  </div>

                  <div className="pt-4 border-t-2 border-pen-blue/5 flex items-center justify-between">
                     <div className="flex items-center gap-2 text-pen-blue/40 text-[10px] font-bold tracking-widest italic leading-none">
                        <Zap className="h-3 w-3" />
                        <span>ЭКСПОНАТ #{String(i+1).padStart(3, '0')}</span>
                     </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
