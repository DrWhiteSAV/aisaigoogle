import React from 'react';
import { GlassCard } from '../components/UI';
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
    <div className="container mx-auto px-6 py-12 max-w-6xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-neon-blue font-black tracking-[0.3em] text-xs uppercase italic">
            <Book className="h-4 w-4" />
            <span>Энциклопедия aiSai</span>
          </div>
          <h1 className="text-5xl font-black italic uppercase tracking-tighter">БЕСТИАРИЙ</h1>
        </div>
        
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-neon-blue transition-colors" />
          <input 
            type="text" 
            placeholder="Поиск по виду..."
             className="bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-6 text-sm outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue transition-all w-full md:w-[300px]"
          />
        </div>
      </div>

      {discovered.length === 0 ? (
        <GlassCard className="p-20 text-center border-dashed border-white/5 opacity-50">
          <Sparkles className="h-12 w-12 text-white/10 mx-auto mb-4" />
          <p className="text-lg font-bold uppercase tracking-widest italic">Ваш список открытых существ пока пуст</p>
          <p className="text-sm text-white/40 mt-2">Генерируйте новых питомцев или покупайте их в питомнике, чтобы заполнить энциклопедию.</p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {discovered.map((c, i) => (
            <motion.div
              key={`${c.species}-${i}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
            >
              <GlassCard className="p-6 group hover:border-neon-blue/40 transition-all border-white/10 relative overflow-hidden">
                {/* Decorative BG element */}
                <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                   <Shield className="h-32 w-32" />
                </div>
                
                <div className="space-y-4 relative z-10 text-left">
                  <div className="inline-block px-3 py-1 bg-neon-blue/10 border border-neon-blue/20 rounded-md text-[9px] font-black uppercase tracking-widest text-neon-blue">
                    {c.type}
                  </div>
                  
                  <div>
                    <h3 className="text-2xl font-black italic tracking-tighter uppercase mb-1">{c.species}</h3>
                    <p className="text-[10px] text-white/30 uppercase tracking-[0.2em]">{c.genus} • {c.family}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-[9px] font-bold uppercase tracking-widest opacity-60">
                     <div className="space-y-1">
                        <div className="text-white/20">Класс</div>
                        <div className="text-white">{c.class}</div>
                     </div>
                     <div className="space-y-1">
                        <div className="text-white/20">Отряд</div>
                        <div className="text-white">{c.order}</div>
                     </div>
                  </div>

                  <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                     <div className="flex items-center gap-2 text-neon-purple text-[10px] font-bold tracking-widest">
                        <Zap className="h-3 w-3" />
                        <span>ЗАПИСЬ #00{i+1}</span>
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
