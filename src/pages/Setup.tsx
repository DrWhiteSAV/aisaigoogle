import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { GlassCard, NeonButton, HandwrittenText } from '../components/UI';
import { Pet, Rarity, UserProfile } from '../types';
import { generatePetStatsAndLore, generatePetArt } from '../services/aiService';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Save, User, MapPin, Smile, BookOpen, Activity, ChevronRight, Plus, Loader2 } from 'lucide-react';
import { HandDrawnTimer } from '../components/HandDrawnTimer';

const forcedRarityMap: Record<string, string> = {
  normal: 'ОБЫЧНЫЙ',
  advanced: 'ПРОДВИНУТЫЙ',
  rare: 'РЕДКИЙ',
  perfect: 'ИДЕАЛЬНЫЙ',
  epic: 'ЭПИЧЕСКИЙ',
  legendary: 'ЛЕГЕНДАРНЫЙ',
  mythical: 'МИФИЧЕСКИЙ',
  eternal: 'ВЕЧНЫЙ',
  divine: 'БОЖЕСТВЕННЫЙ',
  transcendent: 'ТРАНСЦЕНДЕНТНЫЙ'
};

export const Setup: React.FC<{ onComplete: (pet: Pet) => void }> = ({ onComplete }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('aisai_user_profile');
    const defaults: UserProfile = {
      name: '',
      gender: 'male',
      age: 18,
      city: '',
      hobbies: [],
      traits: [],
      about: ''
    };
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...defaults, ...parsed };
      } catch (e) {
        return defaults;
      }
    }
    return defaults;
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

  const toggleSelection = (list: string[] = [], item: string, limit: number) => {
    const currentList = list || [];
    if (currentList.includes(item)) {
      return currentList.filter(i => i !== item);
    }
    if (currentList.length < limit) {
      return [...currentList, item];
    }
    return currentList;
  };

  const pickRarity = (): Rarity => {
    const r = Math.random() * 100;
    if (r < 1) return 'divine';
    if (r < 5) return 'legendary';
    if (r < 10) return 'mythical';
    if (r < 25) return 'epic';
    if (r < 50) return 'rare';
    return 'normal';
  };

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGenerate = async () => {
    const hobbiesCount = (profile.hobbies || []).length;
    const traitsCount = (profile.traits || []).length;
    
    if (!profile.name || !profile.city || hobbiesCount === 0 || traitsCount === 0) {
      setErrorMessage('Пожалуйста, заполни все обязательные поля анкеты!');
      return;
    }

    setErrorMessage(null);
    setLoading(true);
    try {
      const forcedRarity = pickRarity();
      const { name, stats, abilities, lore, classification, element, attribute } = await generatePetStatsAndLore(
        profile,
        forcedRarity
      );
      
      const petId = Math.random().toString(36).substr(2, 9);
      const art = await generatePetArt({ 
        id: petId,
        rarity: forcedRarity, 
        personality: profile.traits[0] as any,
        habitat: 'forest',
        classification,
        element,
        attribute
      });

      setGeneratedPet({
        id: petId,
        name,
        rarity: forcedRarity,
        element: element || 'light',
        attribute: attribute || 'void',
        personality: profile.traits[0] as any,
        habitat: 'forest', 
        image: art,
        stats: {
          attack: stats.attack,
          defense: stats.defense,
          speed: stats.speed,
          magic: stats.magic,
          regeneration: stats.regeneration,
          health: stats.health,
          maxHealth: stats.health,
          maxRage: 100,
          rage: 0
        },
        classification,
        abilities,
        lore,
        level: 1,
        experience: 0,
        materials: {},
        ageStage: 'F - младенчество',
        isRankRevealed: false,
        statPoints: 0,
      });
      setStep(2);
    } catch (error) {
      console.error("Critical failure during pet generation:", error);
      setErrorMessage("Критическая ошибка при генерации. Проверьте API ключ или соединение.");
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
    <div className="flex min-h-screen items-center justify-center p-6 relative overflow-y-auto no-scrollbar">
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-lg space-y-12 flex flex-col items-center text-center"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-sticker-yellow/30 blur-3xl animate-pulse rounded-full" />
              <div className="relative z-10 p-8 bg-transparent border-4 border-pen-blue rotate-6 shadow-2xl">
                <Sparkles className="h-20 w-20 text-pen-blue animate-pulse" />
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="text-4xl font-black italic text-pen-blue tracking-tighter">Ритуал Синтеза</h2>
              <p className="text-pen-blue/60 italic font-black px-8">
                Пробуждение спящих энергий и формирование цифрового аватара вашей души...
              </p>
            </div>

            <HandDrawnTimer duration={10} label="ГЕНЕРАЦИЯ ОБРАЗА" />
          </motion.div>
        ) : step === 1 ? (
          <motion.div 
            key="step1"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="w-full max-w-4xl space-y-8 py-12"
          >
            <div className="text-center mb-12">
              <div className="mb-6 flex justify-center">
                 <div className="h-16 w-16 bg-sticker-yellow border-2 border-black rotate-6 flex items-center justify-center shadow-lg p-3">
                    <img src="https://i.ibb.co/k2PN7Q8y/aisailogo.png" alt="aiSai" className="h-full w-full object-contain mix-blend-multiply" />
                 </div>
              </div>
              <h2 className="text-4xl sm:text-6xl font-black italic text-pen-blue mb-4 tracking-tighter leading-tight">Анкета Призывателя</h2>
              <div className="text-pen-blue/60 text-sm font-black italic max-w-md mx-auto">
                <HandwrittenText text="aiSai подготовит уникальную сущность на основе ваших ментальных паттернов..." speed={40} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
               {/* Column 1: Identity */}
               <div className="space-y-4">
                 <GlassCard color="white" rotation={-1.5} className="p-8 space-y-6 border-2 border-black/10 rounded-[2px]">
                    <div className="space-y-4 text-left">
                      <label className="text-xs font-bold uppercase text-pen-blue/40 tracking-[0.2em] flex items-center gap-2">
                        <User className="h-4 w-4" /> Личность
                      </label>
                      <div className="space-y-4">
                        <input 
                          type="text" 
                          value={profile.name}
                          onChange={(e) => setProfile({...profile, name: e.target.value})}
                          placeholder="Имя..."
                          className="w-full bg-transparent border-b border-pen-blue/10 px-0 py-2 text-xl font-black italic text-pen-blue focus:border-pen-blue outline-none transition-all brightness-50"
                        />
                        <input 
                          type="text" 
                          value={profile.city}
                          onChange={(e) => setProfile({...profile, city: e.target.value})}
                          placeholder="Город..."
                          className="w-full bg-transparent border-b border-pen-blue/10 px-0 py-2 text-lg font-bold italic text-pen-blue focus:border-pen-blue outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-4 text-left">
                        <div className="flex justify-between items-end">
                           <label className="text-[10px] font-black uppercase text-pen-blue/30 tracking-widest">Возраст: {profile.age}</label>
                           <label className="text-[10px] font-black uppercase text-pen-blue/30 tracking-widest">Пол</label>
                        </div>
                        <div className="grid grid-cols-2 gap-4 items-center">
                          <input 
                            type="range" 
                            min="5" 
                            max="99" 
                            value={profile.age}
                            onChange={(e) => setProfile({...profile, age: parseInt(e.target.value)})}
                            className="w-full h-1 bg-pen-blue/10 rounded-full appearance-none cursor-pointer accent-pen-blue"
                          />
                          <div className="flex bg-pen-blue/5 rounded-sm p-0.5 border border-pen-blue/10">
                             <button 
                               onClick={() => setProfile({...profile, gender: 'male', traits: []})}
                               className={cn("flex-1 py-1 px-2 rounded-sm text-[10px] font-black transition-all", profile.gender === 'male' ? "bg-pen-blue text-white" : "text-pen-blue/20")}
                             >M</button>
                             <button 
                               onClick={() => setProfile({...profile, gender: 'female', traits: []})}
                               className={cn("flex-1 py-1 px-2 rounded-sm text-[10px] font-black transition-all", profile.gender === 'female' ? "bg-pen-red text-white" : "text-pen-blue/20")}
                             >F</button>
                          </div>
                        </div>
                    </div>
                 </GlassCard>

                 <GlassCard color="yellow" rotation={1} className="p-8 space-y-4 border-2 border-black/10 rounded-[2px]">
                    <label className="text-xs font-bold uppercase text-pen-blue/40 tracking-[0.2em] flex items-center gap-2">
                       <BookOpen className="h-4 w-4" /> Манифест
                    </label>
                    <textarea 
                      value={profile.about}
                      onChange={(e) => setProfile({...profile, about: e.target.value})}
                      placeholder="О чем ты думаешь?.."
                      rows={4}
                      className="w-full bg-transparent border-2 border-black/5 rounded-sm p-4 text-sm font-bold italic text-pen-blue focus:border-pen-blue/30 outline-none transition-all resize-none"
                    />
                 </GlassCard>
               </div>

               {/* Column 2: Interests */}
               <div className="lg:col-span-2 space-y-4">
                  <GlassCard color="white" rotation={0.5} className="p-8 border-2 border-black/10 rounded-[2px]">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-4 text-left">
                           <label className="text-xs font-bold uppercase text-pen-blue/40 tracking-[0.2em] flex items-center justify-between">
                              <span className="flex items-center gap-2"><Smile className="h-4 w-4" /> Увлечения ({(profile.hobbies || []).length}/5)</span>
                           </label>
                           <div className="flex flex-wrap gap-2 max-h-[220px] overflow-y-auto force-scrollbar pr-2 pt-1">
                              {HOBBIES.map((h) => (
                                 <button 
                                   key={h}
                                   onClick={() => setProfile({...profile, hobbies: toggleSelection(profile.hobbies, h, 5)})}
                                   className={cn(
                                     "px-3 py-1 rounded-sm text-[11px] font-bold transition-all border italic",
                                     profile.hobbies.includes(h) 
                                       ? "bg-sticker-yellow border-pen-blue text-pen-blue rotate-2" 
                                       : "bg-transparent border-black/10 text-pen-blue/30 hover:border-pen-blue/20"
                                   )}
                                 >{h}</button>
                              ))}
                           </div>
                        </div>

                        <div className="space-y-4 text-left">
                           <label className="text-xs font-bold uppercase text-pen-blue/40 tracking-[0.2em] flex items-center justify-between">
                              <span className="flex items-center gap-2"><Activity className="h-4 w-4" /> Черты Души ({(profile.traits || []).length}/3)</span>
                           </label>
                           <div className="flex flex-wrap gap-2 max-h-[220px] overflow-y-auto force-scrollbar pr-2 pt-1">
                              {currentTraitsList.map((t) => (
                                 <button 
                                   key={t}
                                   onClick={() => setProfile({...profile, traits: toggleSelection(profile.traits, t, 3)})}
                                   className={cn(
                                     "px-3 py-1 rounded-sm text-[11px] font-bold transition-all border italic",
                                     profile.traits.includes(t) 
                                       ? "bg-sticker-pink border-pen-blue text-pen-blue -rotate-1" 
                                       : "bg-transparent border-black/10 text-pen-blue/30 hover:border-pen-blue/20"
                                   )}
                                 >{t}</button>
                              ))}
                           </div>
                        </div>
                     </div>
                  </GlassCard>

                  <NeonButton 
                    onClick={handleGenerate} 
                    loading={loading}
                    className="w-full py-10 text-3xl tracking-[0.2em] bg-sticker-yellow -rotate-1 font-black italic hover:rotate-0"
                  >
                    {loading ? <Sparkles className="animate-spin h-8 w-8 text-white" /> : <Sparkles className="h-8 w-8" />}
                    <span>ПРИЗВАТЬ СУТЬ</span>
                  </NeonButton>

                  {errorMessage && (
                    <motion.div 
                      initial={{ opacity: 0, y: 5 }} 
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-pen-red/10 border border-pen-red text-pen-red text-xs font-black italic p-4 rounded-sm"
                    >
                      {errorMessage}
                    </motion.div>
                  )}
               </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="step2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-5xl px-4 py-12"
          >
            <div className="text-center mb-10">
              <h2 className="text-4xl sm:text-6xl font-black italic tracking-tighter text-pen-blue leading-tight">Духовное Воплощение</h2>
            </div>
            
            {pet && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                {/* Image Section */}
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                  <GlassCard color="white" noPadding className="overflow-hidden border-2 border-black/10 rounded-[2px] relative group bg-transparent">
                     <div className="aspect-[9/16] w-full bg-transparent relative rounded-sm overflow-hidden">
                        <img src={pet.image} alt={pet.name} className="h-full w-full object-cover" />
                        
                        {/* Overlay Content */}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-white via-white/80 to-transparent p-6 pt-16">
                           <div className="text-[10px] font-black text-pen-blue/40 uppercase tracking-[0.2em] mb-1">
                              {pet.classification.type} • {pet.classification.species}
                           </div>
                           <h3 className="text-2xl sm:text-3xl font-black italic brightness-50 leading-tight mb-2 tracking-tighter break-words">
                              <HandwrittenText text={pet.name} speed={30} />
                           </h3>
                        </div>

                        <div className="absolute top-4 right-4 flex flex-col items-end gap-3 z-10">
                           <div className="bg-sticker-yellow text-xs font-black text-pen-blue px-4 py-2 border-2 border-pen-blue rotate-3 shadow-none">
                             {forcedRarityMap[pet.rarity] || pet.rarity}
                           </div>
                           <div className="bg-white/90 text-pen-blue text-2xl font-black px-4 py-2 border-2 border-pen-blue/20 -rotate-2">
                             RANK ???
                           </div>
                        </div>

                        <div className="absolute left-4 top-4 z-20">
                          <div className="bg-sticker-blue text-[10px] font-black text-pen-blue px-4 py-1.5 border-2 border-pen-blue/20 rotate-1">
                            {pet.ageStage.toUpperCase()}
                          </div>
                        </div>
                     </div>
                  </GlassCard>
                </motion.div>

                {/* Info Section */}
                <div className="space-y-8">
                  <GlassCard color="yellow" delay={0.3} className="p-10 space-y-8 rounded-[4px] border-2 border-black/5 hatching-shadow">
                    <div>
                      <div className="text-sm font-bold text-pen-blue/40 uppercase tracking-[0.4em] mb-2 truncate">
                         {pet.classification.type} • {pet.classification.species}
                      </div>
                      <h3 className="text-3xl sm:text-5xl font-black italic text-pen-blue mb-8 tracking-tighter break-words leading-tight">
                         <HandwrittenText text={pet.name} speed={30} />
                      </h3>
                      <div className="text-xl text-pen-blue italic leading-snug px-4 py-4 bg-white/40 rounded-sm border-l-4 border-pen-blue min-h-[100px]">
                        <HandwrittenText text={pet.lore} delay={1} speed={35} />
                      </div>
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
    "flex justify-between items-center bg-transparent border-2 border-black/5 px-4 py-3 rounded-sm shadow-sm",
    isSpecial && "border-pen-blue bg-sticker-blue/20"
  )}>
    <span className="opacity-40">{label}</span>
    <span className="text-lg text-pen-blue">{value}</span>
  </div>
);

// removed local cn
