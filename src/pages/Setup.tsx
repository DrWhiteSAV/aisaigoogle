import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { GlassCard, NeonButton } from '../components/UI';
import { Pet, Rarity, UserProfile } from '../types';
import { generatePetStatsAndLore, generatePetArt } from '../services/aiService';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Save } from 'lucide-react';
import { getPowerRank } from '../constants/game';

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
        habitat: 'mystic mountains and ethereal flows',
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
    <div className="flex min-h-screen items-center justify-center p-6 bg-[#050510]">
      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div 
            key="step1"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="w-full max-w-4xl space-y-8 py-12"
          >
            <div className="text-center animate-in fade-in slide-in-from-top-4 duration-1000">
              <h2 className="text-4xl font-black neon-glow-blue mb-2 tracking-tighter uppercase italic">АНКЕТА ПОЛЬЗОВАТЕЛЯ</h2>
              <p className="#94a3b8 text-sm uppercase tracking-[0.2em] font-medium opacity-60">ИИ создаст уникальное существо, которое станет твоим истинным отражением</p>
            </div>

            <GlassCard delay={0.2} className="p-8 md:p-12 space-y-10 border-white/10 shadow-2xl rounded-[40px] relative overflow-hidden">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="space-y-2 text-left">
                      <label className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em] flex items-center gap-2">
                        Имя
                      </label>
                      <input 
                        type="text" 
                        value={profile.name}
                        onChange={(e) => setProfile({...profile, name: e.target.value})}
                        placeholder="Твое имя..."
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:border-neon-blue outline-none transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2 text-left">
                          <label className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em] flex items-center gap-2">
                             Возраст: {profile.age}
                          </label>
                          <input 
                            type="range" 
                            min="5" 
                            max="99" 
                            value={profile.age}
                            onChange={(e) => setProfile({...profile, age: parseInt(e.target.value)})}
                            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-neon-blue"
                          />
                       </div>
                       <div className="space-y-2 text-left">
                          <label className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em]">
                             Пол
                          </label>
                          <div className="flex bg-white/5 rounded-2xl p-1 border border-white/10">
                             <button 
                               onClick={() => setProfile({...profile, gender: 'male', traits: []})}
                               className={cn(
                                 "flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all",
                                 profile.gender === 'male' ? "bg-neon-blue text-black shadow-lg" : "text-white/40"
                               )}
                             >M</button>
                             <button 
                               onClick={() => setProfile({...profile, gender: 'female', traits: []})}
                               className={cn(
                                 "flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all",
                                 profile.gender === 'female' ? "bg-neon-pink text-white shadow-lg" : "text-white/40"
                               )}
                             >Ж</button>
                          </div>
                       </div>
                    </div>

                    <div className="space-y-2 text-left">
                      <label className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em]">Город</label>
                      <input 
                        type="text" 
                        value={profile.city}
                        onChange={(e) => setProfile({...profile, city: e.target.value})}
                        placeholder="Ваш город..."
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:border-neon-blue outline-none transition-all"
                      />
                    </div>

                    <div className="space-y-2 text-left">
                      <label className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em]">О себе</label>
                      <textarea 
                        value={profile.about}
                        onChange={(e) => setProfile({...profile, about: e.target.value})}
                        placeholder="Расскажи немного о себе..."
                        rows={3}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:border-neon-blue outline-none transition-all resize-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-6 text-left">
                     <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em] flex items-center justify-between">
                           <span>Хобби ({profile.hobbies.length}/5)</span>
                        </label>
                        <div className="flex flex-wrap gap-2 max-h-[160px] overflow-y-auto no-scrollbar p-1">
                           {HOBBIES.map((h) => (
                              <button 
                                key={h}
                                onClick={() => setProfile({...profile, hobbies: toggleSelection(profile.hobbies, h, 5)})}
                                className={cn(
                                  "px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border",
                                  profile.hobbies.includes(h) 
                                    ? "bg-neon-purple border-neon-purple text-white shadow-[0_0_10px_rgba(188,0,255,0.3)]" 
                                    : "bg-white/5 border-white/10 text-white/40 hover:border-white/30"
                                )}
                              >{h}</button>
                           ))}
                        </div>
                     </div>

                     <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em] flex items-center justify-between">
                           <span>Характер ({profile.traits.length}/3)</span>
                        </label>
                        <div className="flex flex-wrap gap-2 p-1">
                           {currentTraitsList.map((t) => (
                              <button 
                                key={t}
                                onClick={() => setProfile({...profile, traits: toggleSelection(profile.traits, t, 3)})}
                                className={cn(
                                  "px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border",
                                  profile.traits.includes(t) 
                                    ? "bg-neon-blue border-neon-blue text-black shadow-[0_0_10px_rgba(0,242,255,0.3)]" 
                                    : "bg-white/5 border-white/10 text-white/40 hover:border-white/30"
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
                 className="w-full py-6 text-base tracking-[0.3em] font-black italic rounded-[24px]"
                 variant="blue"
               >
                 <Sparkles className={cn("h-5 w-5", loading ? "animate-spin" : "")} />
                 <span>УЗНАТЬ СВОЕ СУЩЕСТВО</span>
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
              <h2 className="text-5xl font-black italic uppercase tracking-tighter logo-text-gradient">ТВОЙ ДУХОВНЫЙ ПАРТНЕР</h2>
            </div>
            
            {pet && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
                {/* Image Section */}
                <GlassCard delay={0.1} className="overflow-hidden p-0 border border-white/12 shadow-[0_0_60px_rgba(255,204,0,0.15)] rounded-[48px] group lg:sticky lg:top-12">
                  <div className="aspect-[9/16] w-full bg-black/40 relative">
                    <img src={pet.image} alt={pet.name} className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                    <div className="absolute top-8 right-8 flex flex-col items-end gap-3 z-10">
                       <div className="bg-rarity-legendary text-[10px] font-[900] text-black px-6 py-2 rounded-full uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(255,204,0,0.6)] border border-white/20">
                         {forcedRarityMap[pet.rarity] || pet.rarity}
                       </div>
                       <div className="bg-white/10 text-white/50 text-[18px] font-black px-5 py-2 rounded-2xl border border-white/10 backdrop-blur-2xl uppercase tracking-[0.2em]">
                         RANK ???
                       </div>
                    </div>
                    <div className="absolute left-8 bottom-8 z-20">
                      <div className="bg-neon-blue/80 text-black text-[10px] font-black px-4 py-1.5 rounded-lg border border-white/20 uppercase tracking-widest backdrop-blur-md">
                        СТАДИЯ: {pet.ageStage.toUpperCase()}
                      </div>
                    </div>
                    <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#050510] to-transparent" />
                  </div>
                </GlassCard>

                {/* Info Section */}
                <div className="space-y-8">
                  <GlassCard delay={0.2} className="p-10 space-y-8 rounded-[40px] border-white/10">
                    <div>
                      <div className="text-[14px] font-mono text-neon-blue uppercase tracking-[0.4em] mb-3 font-black">
                         {pet.classification.type} • {pet.classification.species}
                      </div>
                      <h3 className="text-5xl font-black font-serif italic tracking-tight mb-6 leading-tight">{pet.name}</h3>
                      <div className="relative">
                        <div className="absolute -left-4 top-0 bottom-0 w-1 bg-neon-purple rounded-full opacity-50" />
                        <p className="text-sm text-[#94a3b8] leading-relaxed uppercase tracking-widest font-medium opacity-100 italic pl-6">
                          "{pet.lore}"
                        </p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h4 className="text-[11px] font-black uppercase text-white/30 tracking-[0.4em] border-b border-white/5 pb-3">Боевой Потенциал</h4>
                      <div className="grid grid-cols-2 gap-4 uppercase tracking-[0.1em] text-[12px] font-black">
                        <StatPreview label="Сила" value={pet.stats.attack} />
                        <StatPreview label="Защита" value={pet.stats.defense} />
                        <StatPreview label="Скор" value={pet.stats.speed} />
                        <StatPreview label="Магия" value={pet.stats.magic} />
                        <StatPreview label="ХП" value={pet.stats.health} />
                        <StatPreview label="Реген" value={pet.stats.regeneration} isSpecial />
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h4 className="text-[11px] font-black uppercase text-white/30 tracking-[0.4em] border-b border-white/5 pb-3">Биологические данные</h4>
                      <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-[10px] font-black uppercase tracking-widest text-white/50">
                        <div className="flex justify-between"><span>Класс:</span> <span className="text-white/80">{pet.classification.class}</span></div>
                        <div className="flex justify-between"><span>Отряд:</span> <span className="text-white/80">{pet.classification.order}</span></div>
                        <div className="flex justify-between"><span>Семья:</span> <span className="text-white/80">{pet.classification.family}</span></div>
                        <div className="flex justify-between"><span>Род:</span> <span className="text-white/80">{pet.classification.genus}</span></div>
                        <div className="flex justify-between"><span>Вид:</span> <span className="text-white/80">{pet.classification.species}</span></div>
                      </div>
                    </div>

                    <NeonButton onClick={handleSave} variant="purple" className="w-full flex items-center justify-center space-x-4 mt-6 rounded-[32px] py-6 text-lg font-black italic tracking-[0.2em] shadow-[0_20px_40px_rgba(188,0,255,0.2)]">
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
  <div className={cn("flex justify-between items-center bg-white/[0.03] px-4 py-3 rounded-2xl border border-white/5 shadow-inner", isSpecial && "text-neon-blue border-neon-blue/20 bg-neon-blue/5")}>
    <span className="text-white/40 font-bold">{label}</span>
    <span className="text-white text-base">{value}</span>
  </div>
);

// removed local cn
