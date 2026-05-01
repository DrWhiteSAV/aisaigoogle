import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { GlassCard, NeonButton, HandwrittenText } from '../components/UI';
import { Pet, Rarity, UserProfile } from '../types';
import { generatePetStatsAndLore, generatePetArt } from '../services/aiService';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Save, User, MapPin, Smile, BookOpen, Activity, ChevronRight, Plus } from 'lucide-react';

const forcedRarityMap: Record<string, string> = {
  common: 'ОБЫЧНЫЙ',
  rare: 'РЕДКИЙ',
  epic: 'ЭПИЧЕСКИЙ',
  mythic: 'МИФИЧЕСКИЙ',
  legendary: 'ЛЕГЕНДАРНЫЙ',
  divine: 'БОЖЕСТВЕННЫЙ'
};

export const Setup: React.FC<{ onComplete: (pet: Pet) => void }> = ({ onComplete }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('aisai_user_profile');
    return saved ? JSON.parse(saved) : {
      name: '',
      gender: 'male',
      age: 18,
      city: '',
      hobbies: [],
      traits: [],
      about: ''
    };
  });
  const [pet, setGeneratedPet] = useState<Pet | null>(null);

  React.useEffect(() => {
    localStorage.setItem('aisai_user_profile', JSON.stringify(profile));
  }, [profile]);

  const HOBBIES = [
    'Рисование', 'Пение', 'Танцы', 'Чтение', 'Кино', 'Видеоигры', 'Программирование', 
    'Кулинария', 'Путешествия', 'Спорт', 'Йога', 'Фотография', 'Садоводство', 'Аниме', 
    'Коллекционирование', 'Музыка', 'Писательство', 'Рыбалка', 'Походы', 'Волонтерство', 
    'Шахматы', 'Космос', 'Астрономия', 'Наука', 'Мода', 'Блогинг', 'Языки', 'Психология', 
    'Эзотерика', 'Театр'
  ];

  const MALE_TRAITS = [
    'Добрый', 'Смелый', 'Умный', 'Веселый', 'Спокойный', 'Честный', 'Трудолюбивый', 
    'Мечтательный', 'Ответственный', 'Решительный', 'Скромный', 'Энергичный', 
    'Творческий', 'Серьезный', 'Дружелюбный'
  ];

  const FEMALE_TRAITS = [
    'Добрая', 'Смелая', 'Умная', 'Веселая', 'Спокойная', 'Честная', 'Трудолюбивая', 
    'Мечтательная', 'Ответственная', 'Решительная', 'Скромная', 'Энергичная', 
    'Творческая', 'Серьезная', 'Дружелюбная'
  ];

  const currentTraitsList = profile.gender === 'male' ? MALE_TRAITS : FEMALE_TRAITS;

  const toggleSelection = (list: string[], item: string, limit: number) => {
    if (list.includes(item)) {
      return list.filter(i => i !== item);
    }
    if (list.length < limit) {
      return [...list, item];
    }
    return list;
  };

  const pickRarity = (): Rarity => {
    const r = Math.random() * 100;
    if (r < 1) return 'divine';
    if (r < 5) return 'legendary';
    if (r < 10) return 'mythic';
    if (r < 25) return 'epic';
    if (r < 50) return 'rare';
    return 'common';
  };

  const handleGenerate = async () => {
    if (!profile.name || !profile.city || profile.hobbies.length === 0 || profile.traits.length === 0) {
      alert('Пожалуйста, заполни все обязательные поля анкеты!');
      return;
    }

    setLoading(true);
    try {
      const forcedRarity = pickRarity();
      const { name, stats, abilities, lore, classification } = await generatePetStatsAndLore(
        profile,
        forcedRarity
      );
      
      const petId = Math.random().toString(36).substr(2, 9);
      const art = await generatePetArt({ 
        id: petId,
        rarity: forcedRarity, 
        personality: profile.traits[0] as any,
        habitat: 'forest',
        classification
      });

      setGeneratedPet({
        id: petId,
        name,
        rarity: forcedRarity,
        element: 'light',
        personality: profile.traits[0] as any,
        habitat: 'forest', 
        image: art,
        stats: {
          attack: Math.min(Math.max(stats.attack, 1), 10),
          defense: Math.min(Math.max(stats.defense, 1), 10),
          speed: Math.min(Math.max(stats.speed, 1), 10),
          magic: Math.min(Math.max(stats.magic, 1), 10),
          regeneration: Math.min(Math.max(stats.regeneration, 1), 10),
          health: Math.min(Math.max(stats.health, 1), 10),
        },
        classification,
        abilities,
        lore,
        level: 1,
        experience: 0,
        materials: {},
        ageStage: 'детство',
        isRankRevealed: false,
        statPoints: 0,
      });
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (pet) {
      onComplete(pet);
      navigate('/main');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-paper relative">
      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div 
            key="step1"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="w-full max-w-4xl space-y-8 py-12"
          >
            <div className="text-center">
              <h2 className="text-5xl font-black italic text-pen-blue mb-4 tracking-tighter uppercase">АНКЕТА ГЕРОЯ</h2>
              <div className="text-pen-blue/40 text-sm font-bold uppercase tracking-[0.2em] italic max-w-md mx-auto">
                <HandwrittenText text="ИИ создаст уникальное существо, которое станет твоим истинным отражением..." speed={40} />
              </div>
            </div>

            <GlassCard color="white" className="p-8 md:p-12 space-y-10 border-2 border-black/5 hatching-shadow rounded-[4px] relative overflow-hidden">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-8">
                    <div className="space-y-2 text-left">
                      <label className="text-xs font-bold uppercase text-pen-blue/40 tracking-[0.2em] flex items-center gap-2">
                        <User className="h-3 w-3" /> Имя
                      </label>
                      <input 
                        type="text" 
                        value={profile.name}
                        onChange={(e) => setProfile({...profile, name: e.target.value})}
                        placeholder="Запиши здесь..."
                        className="w-full bg-transparent border-b-2 border-pen-blue/10 px-0 py-2 text-xl font-bold italic text-pen-blue focus:border-pen-blue outline-none transition-all placeholder:text-pen-blue/10"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                       <div className="space-y-4 text-left">
                          <label className="text-xs font-bold uppercase text-pen-blue/40 tracking-[0.2em]">
                             Возраст: {profile.age}
                          </label>
                          <input 
                            type="range" 
                            min="5" 
                            max="99" 
                            value={profile.age}
                            onChange={(e) => setProfile({...profile, age: parseInt(e.target.value)})}
                            className="w-full h-1.5 bg-pen-blue/5 rounded-full appearance-none cursor-pointer accent-pen-blue"
                          />
                       </div>
                       <div className="space-y-2 text-left">
                          <label className="text-xs font-bold uppercase text-pen-blue/40 tracking-[0.2em]">
                             Пол
                          </label>
                          <div className="flex bg-pen-blue/5 rounded-sm p-1 border border-pen-blue/10">
                             <button 
                               onClick={() => setProfile({...profile, gender: 'male', traits: []})}
                               className={cn(
                                 "flex-1 py-1 px-4 rounded-sm text-xs font-bold transition-all",
                                 profile.gender === 'male' ? "bg-pen-blue text-white shadow-sm" : "text-pen-blue/30"
                               )}
                             >М</button>
                             <button 
                               onClick={() => setProfile({...profile, gender: 'female', traits: []})}
                               className={cn(
                                 "flex-1 py-1 px-4 rounded-sm text-xs font-bold transition-all",
                                 profile.gender === 'female' ? "bg-pen-red text-white shadow-sm" : "text-pen-blue/30"
                               )}
                             >Ж</button>
                          </div>
                       </div>
                    </div>

                    <div className="space-y-2 text-left">
                      <label className="text-xs font-bold uppercase text-pen-blue/40 tracking-[0.2em] flex items-center gap-2">
                        <MapPin className="h-3 w-3" /> Родной Край
                      </label>
                      <input 
                        type="text" 
                        value={profile.city}
                        onChange={(e) => setProfile({...profile, city: e.target.value})}
                        placeholder="Откуда ты?.."
                        className="w-full bg-transparent border-b-2 border-pen-blue/10 px-0 py-2 text-lg font-bold italic text-pen-blue focus:border-pen-blue outline-none transition-all placeholder:text-pen-blue/10"
                      />
                    </div>

                    <div className="space-y-4 text-left">
                      <label className="text-xs font-bold uppercase text-pen-blue/40 tracking-[0.2em] flex items-center gap-2">
                        <BookOpen className="h-3 w-3" /> Манифест
                      </label>
                      <textarea 
                        value={profile.about}
                        onChange={(e) => setProfile({...profile, about: e.target.value})}
                        placeholder="Твое видение мира..."
                        rows={3}
                        className="w-full bg-white/40 border-2 border-black/5 rounded-sm p-4 text-sm font-bold italic text-pen-blue focus:border-pen-blue outline-none transition-all resize-none hatching-shadow"
                      />
                    </div>
                  </div>

                  <div className="space-y-8 text-left">
                     <div className="space-y-4">
                        <label className="text-xs font-bold uppercase text-pen-blue/40 tracking-[0.2em] flex items-center justify-between">
                           <span className="flex items-center gap-2"><Smile className="h-3 w-3" /> Увлечения ({profile.hobbies.length}/5)</span>
                        </label>
                        <div className="flex flex-wrap gap-2 max-h-[160px] overflow-y-auto no-scrollbar pt-1 pr-2">
                           {HOBBIES.map((h) => (
                              <button 
                                key={h}
                                onClick={() => setProfile({...profile, hobbies: toggleSelection(profile.hobbies, h, 5)})}
                                className={cn(
                                  "px-3 py-1 rounded-sm text-[11px] font-bold transition-all border-2 italic",
                                  profile.hobbies.includes(h) 
                                    ? "bg-sticker-yellow border-pen-blue text-pen-blue rotate-2 shadow-sm" 
                                    : "bg-white border-black/5 text-pen-blue/30 hover:border-pen-blue/20"
                                )}
                              >{h}</button>
                           ))}
                        </div>
                     </div>

                     <div className="space-y-4">
                        <label className="text-xs font-bold uppercase text-pen-blue/40 tracking-[0.2em] flex items-center justify-between">
                           <span className="flex items-center gap-2"><Activity className="h-3 w-3" /> Черты Души ({profile.traits.length}/3)</span>
                        </label>
                        <div className="flex flex-wrap gap-2 pt-1 pr-2">
                           {currentTraitsList.map((t) => (
                              <button 
                                key={t}
                                onClick={() => setProfile({...profile, traits: toggleSelection(profile.traits, t, 3)})}
                                className={cn(
                                  "px-3 py-1 rounded-sm text-[11px] font-bold transition-all border-2 italic",
                                  profile.traits.includes(t) 
                                    ? "bg-sticker-pink border-pen-blue text-pen-blue -rotate-1 shadow-sm" 
                                    : "bg-white border-black/5 text-pen-blue/30 hover:border-pen-blue/20"
                                )}
                              >{t}</button>
                           ))}
                        </div>
                     </div>
                  </div>
               </div>

               <NeonButton 
                 onClick={handleGenerate} 
                 loading={loading}
                 className="w-full py-6 text-2xl tracking-widest mt-4"
               >
                 {loading ? <Sparkles className="animate-spin h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
                 <span>ПРИЗВАТЬ СУТЬ</span>
               </NeonButton>
            </GlassCard>
          </motion.div>
        ) : (
          <motion.div 
            key="step2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-5xl px-4 py-12"
          >
            <div className="text-center mb-10">
              <h2 className="text-6xl font-black italic italic uppercase tracking-tighter text-pen-blue">ДУХОВНОЕ ВОПЛОЩЕНИЕ</h2>
            </div>
            
            {pet && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                {/* Image Section */}
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                  <GlassCard color="white" className="overflow-visible p-4 border-2 border-black/10 hatching-shadow rounded-[2px] relative lg:sticky lg:top-12">
                     <div className="aspect-[9/16] w-full bg-white relative rounded-sm overflow-hidden border border-black/5">
                        <img src={pet.image} alt={pet.name} className="h-full w-full object-cover" />
                        
                        <div className="absolute top-4 right-4 flex flex-col items-end gap-3 z-10">
                           <div className="bg-sticker-yellow text-xs font-black text-pen-blue px-4 py-2 border-2 border-pen-blue rotate-3 shadow-md">
                             {forcedRarityMap[pet.rarity] || pet.rarity}
                           </div>
                           <div className="bg-white/90 text-pen-blue text-2xl font-black px-4 py-2 border-2 border-pen-blue/20 -rotate-2">
                             RANK ???
                           </div>
                        </div>

                        <div className="absolute left-4 bottom-4 z-20">
                          <div className="bg-sticker-blue text-[10px] font-black text-pen-blue px-4 py-1.5 border-2 border-pen-blue/20 rotate-1">
                            СТАДИЯ: {pet.ageStage.toUpperCase()}
                          </div>
                        </div>
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-8 bg-white/40 shadow-sm -rotate-2" />
                     </div>
                  </GlassCard>
                </motion.div>

                {/* Info Section */}
                <div className="space-y-8">
                  <GlassCard color="yellow" delay={0.3} className="p-10 space-y-8 rounded-[4px] border-2 border-black/5 hatching-shadow">
                    <div>
                      <div className="text-sm font-bold text-pen-blue/40 uppercase tracking-[0.4em] mb-2">
                         {pet.classification.type} • {pet.classification.species}
                      </div>
                      <h3 className="text-5xl font-black italic text-pen-blue mb-8 tracking-tighter">
                         <HandwrittenText text={pet.name} speed={30} />
                      </h3>
                      <p className="text-xl text-pen-blue italic leading-snug px-4 py-4 bg-white/40 rounded-sm border-l-4 border-pen-blue min-h-[100px]">
                        <HandwrittenText text={pet.lore} delay={1} speed={35} />
                      </p>
                    </div>

                    <div className="space-y-6">
                      <h4 className="text-xs font-bold uppercase text-pen-blue/30 tracking-[0.4em] border-b-2 border-pen-blue/5 pb-2">Боевой Потенциал</h4>
                      <div className="grid grid-cols-2 gap-4 uppercase tracking-[0.1em] text-sm font-black italic">
                        <StatPreview label="Сила" value={pet.stats.attack} />
                        <StatPreview label="Защита" value={pet.stats.defense} />
                        <StatPreview label="Скорость" value={pet.stats.speed} />
                        <StatPreview label="Магия" value={pet.stats.magic} />
                        <StatPreview label="Здоровье" value={pet.stats.health} />
                        <StatPreview label="Реген" value={pet.stats.regeneration} isSpecial />
                      </div>
                    </div>

                    <div className="space-y-4">
                       <h4 className="text-xs font-bold uppercase text-pen-blue/30 tracking-[0.4em] border-b-2 border-pen-blue/5 pb-2 pt-4">Биологический Шифр</h4>
                       <div className="grid grid-cols-1 gap-2 text-xs font-bold uppercase tracking-widest text-pen-blue/40">
                         <div className="flex justify-between border-b border-pen-blue/5 pb-1"><span>КЛАСС</span> <span className="text-pen-blue">{pet.classification.class}</span></div>
                         <div className="flex justify-between border-b border-pen-blue/5 pb-1"><span>ОТРЯД</span> <span className="text-pen-blue">{pet.classification.order}</span></div>
                         <div className="flex justify-between border-b border-pen-blue/5 pb-1"><span>СЕМЬЯ</span> <span className="text-pen-blue">{pet.classification.family}</span></div>
                         <div className="flex justify-between border-b border-pen-blue/5 pb-1"><span>РОД</span> <span className="text-pen-blue">{pet.classification.genus}</span></div>
                       </div>
                    </div>

                    <NeonButton onClick={handleSave} className="w-full py-6 text-xl mt-4">
                      <Save className="h-6 w-6" />
                      <span>ПРИНЯТЬ КОНТРАКТ</span>
                    </NeonButton>
                  </GlassCard>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const StatPreview = ({ label, value, isSpecial }: { label: string, value: number, isSpecial?: boolean }) => (
  <div className={cn(
    "flex justify-between items-center bg-white border-2 border-black/5 px-4 py-3 rounded-sm shadow-sm",
    isSpecial && "border-pen-blue bg-sticker-blue/20"
  )}>
    <span className="opacity-40">{label}</span>
    <span className="text-lg text-pen-blue">{value}</span>
  </div>
);

// removed local cn
