import { GoogleGenAI } from "@google/genai";
import { Pet, PetStats, Rarity, Element, Attribute, UserProfile, InventoryItem, Skill, Classification } from "../types";
import { RARITY_WEIGHTS, generateUniqueCode, distributeStats } from "../lib/gameLogic";

// Safe way to access environment variables in Vite/React
const getApiKey = () => {
  try {
    // Priority: process.env.GEMINI_API_KEY (polyfilled by platform)
    const envKey = (typeof process !== 'undefined' ? (process.env as any).GEMINI_API_KEY : '');
    if (envKey) return envKey;
    
    // Fallback: window.process.env (sometimes polyfilled here)
    const windowEnvKey = (window as any).process?.env?.GEMINI_API_KEY;
    if (windowEnvKey) return windowEnvKey;

    return '';
  } catch (e) {
    return '';
  }
};

let aiInstance: GoogleGenAI | null = null;
const getAI = () => {
  if (!aiInstance) {
    const apiKey = getApiKey();
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not set. AI features will likely fail.");
    }
    // Handle empty apiKey gracefully if the SDK throws
    try {
      aiInstance = new GoogleGenAI({ apiKey: apiKey || 'dummy-key' });
    } catch (e) {
      console.error("Failed to initialize GoogleGenAI:", e);
      return null;
    }
  }
  return aiInstance;
};

// Use recommended models for this environment
const TEXT_MODEL = "gemini-3-flash-preview";
const IMAGE_MODEL = "gemini-2.5-flash-image";

const cleanAIJson = (str: string) => {
  if (!str) return "";
  
  // Strategy 1: Look for matching braces (most robust for LLM output)
  let depth = 0;
  let firstCurly = -1;
  let lastCurly = -1;
  
  for (let i = 0; i < str.length; i++) {
    if (str[i] === '{') {
      if (firstCurly === -1) firstCurly = i;
      depth++;
    } else if (str[i] === '}') {
      depth--;
      if (depth === 0 && firstCurly !== -1) {
        lastCurly = i;
        break; // Found the first complete object
      }
    }
  }
  
  if (firstCurly !== -1 && lastCurly !== -1) {
    return str.substring(firstCurly, lastCurly + 1);
  }

  // Strategy 2: Fallback to existing logic if no matching braces found (e.g. for arrays)
  let cleaned = str.replace(/```json\n?|\n?```/g, '').trim();
  const firstSquare = cleaned.indexOf('[');
  if (firstSquare !== -1) {
    const lastSquare = cleaned.lastIndexOf(']');
    if (lastSquare > firstSquare) {
      return cleaned.substring(firstSquare, lastSquare + 1);
    }
  }
  
  return cleaned;
};

export const generatePetArt = async (pet: Partial<Pet>) => {
  let visualAge = 'adult';
  let details = 'Powerful, majestic, fully developed features.';
  
  if (!pet.ageStage || pet.ageStage.startsWith('F')) {
    visualAge = 'NEWBORN / INFANT / HATCHLING';
    details = 'Small, cute, helpless but wild, youthful features, hatching from egg or just born, mostly head.';
  } else if (pet.ageStage.startsWith('E')) {
    visualAge = 'CHILD / TODDLER / CUB';
    details = 'Cute, playful, curious child. Slightly bigger than infant, still very youthful and undeveloped, rounded features.';
  } else if (pet.ageStage.startsWith('D')) {
    visualAge = 'TEENAGER / ADOLESCENT';
    details = 'Lanky, growing teenager. Features becoming sharper, awkward but energetic, partial adult traits appearing.';
  } else if (pet.ageStage.startsWith('C') || pet.ageStage.startsWith('B')) {
    visualAge = 'YOUNG ADULT / PRIME';
    details = 'Athletic, capable young adult. Features are fully formed and strong, shedding all childish roundness.';
  } else if (pet.ageStage.startsWith('A')) {
    visualAge = 'MATURE ADULT';
    details = 'Mature, powerful, imposing adult. Thick, muscular, experienced warrior with scars or marks.';
  } else {
    visualAge = 'ELDER / ANCIENT / DIVINE';
    details = 'Ancient, wise, transcendent being. Epic, majestic, godly, glowing with power and extreme detail.';
  }

  const prompt = `A hand-drawn BLUE PEN SKETCH of a mythical creature in its ${visualAge} stage. 
                  SUBJECT: ${visualAge} stage ${pet.rarity} ${pet.element} ${pet.attribute} creature, biology based on ${pet.classification?.species}.
                  DETAILS: ${details}
                  ART STYLE: Scribbled ballpoint pen illustration, blue ink drawing only, with hatching and cross-hatching shadows.
                  ENVIRONMENT: Centered on white GRID GRAPH PAPER.
                  FORMAT: Vertical portrait 9:16 aspect ratio.
                  MANDATORY: MONOCHROMATIC BLUE PEN INK ON WHITE PAPER.`;
  
  try {
    const ai = getAI();
    if (!ai) throw new Error("AI not initialized");
    
    // Using image generation model
    console.log("Starting image generation for:", pet.name);
    const response = await ai.models.generateContent({
      model: IMAGE_MODEL,
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: {
          aspectRatio: "9:16"
        }
      }
    });
    console.log("Image generation response received");

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    
    // Fallback seed as standard response for now since we want consistency
    const seed = `${pet.element}-${pet.attribute}-${pet.rarity}-${Date.now()}`;
    return `https://picsum.photos/seed/${seed}/1080/1920`;
  } catch (error) {
    console.error("Image generation failed:", error);
    return `https://picsum.photos/seed/fallback-${Date.now()}/1080/1920`;
  }
};

export const generateEvolutionUpdate = async (
  pet: Pet,
  newRank: string
): Promise<{ newName: string; abilities: string[]; lore: string; newSkills: Skill[] }> => {
  const RANKS = ['F - младенчество', 'E - детство', 'D - отрочество', 'C - молодость', 'B - взросление', 'A - зрелость', 'S - мудрость', 'EX - единство', 'UX - пробуждение', 'Z - абсолютность'];
  const nextRanks = RANKS.slice(RANKS.indexOf((newRank || 'E - детство').replace(/элита|легенда|миф|божество/g, match => ({ 'элита': 'мудрость', 'легенда': 'единство', 'миф': 'пробуждение', 'божество': 'абсолютность' }[match] as string)) ) + 1).join(' -> ');

  const prompt = `Питомец ${pet.name} перешел на новый этап развития! 
    Было: ${pet.ageStage}
    Стало: ${newRank}
    (Возможные следующие ранги в будущем: ${nextRanks || 'отсутствуют, это почти финальная форма'})

    Текущая информация:
    - Имя: ${pet.name}
    - Биологическая классификация: ${pet.classification.genus} ${pet.classification.species} (${pet.classification.family})
    - Элемент: ${pet.element}
    - Атрибут: ${pet.attribute}
    - Текущие способности: ${pet.abilities.join(', ')}
    - Текущая легенда: ${pet.lore}
    
    Сгенерируй (используй нормальный регистр по правилам языка: заглавные и строчные буквы, без сплошного КАПСЛОКА):
    1. Новое эпичное имя (newName), которое отражает его новую форму, взросление и силу (логичное взросление: от простого детского до более величественного взрослого, сохраняя связь со старым).
    2. Новую уникальную способность, которая добавляется к текущему списку.
    3. Обновленную легенду: опиши сам факт взросления и перехода из ${pet.ageStage} в форму ${newRank}. Как он изменился внешне и ментально, опираясь на свою классификацию.
    4. ТРИ новых навыка: 
       - Один ПАССИВНЫЙ (passive) - влияет на любой из статов (health, attack, defense, speed, magic, regeneration).
       - Один БАФФ (active_buff) - БОЕВОЙ БАФФ НА АТАКУ. Усиливает СТРОГО attack питомца.
       - Один ДЕБАФФ (active_debuff) - ослабляет противника (влияет на любой стат).
    
    Верни JSON объект на русском языке:
    {
      "newName": "...",
      "updatedLore": "...",
      "newSkills": [
        { 
          "name": "Название навыка", 
          "description": "ПОДРОБНОЕ ОПИСАНИЕ (2+ предложения): Как именно питомец делает это с точки зрения биологии.", 
          "type": "passive", 
          "targetStat": "health|attack|defense|speed|magic|regeneration",
          "emoji": "ОДИН ПОДХОДЯЩИЙ ЭМОДЗИ"
        },
        { 
          "name": "Название активного навыка", 
          "description": "ПОДРОБНОЕ ОПИСАНИЕ (2+ предложения): Как именно питомец использует стихию для баффа атаки.", 
          "type": "active_buff", 
          "targetStat": "attack",
          "emoji": "ОДИН ПОДХОДЯЩИЙ ЭМОДЗИ"
        },
        { 
          "name": "Название дебаффа", 
          "description": "ПОДРОБНОЕ ОПИСАНИЕ (2+ предложения): Как именно питомец воздействует на врага.", 
          "type": "active_debuff", 
          "targetStat": "health|attack|defense|speed|magic|regeneration",
          "emoji": "ОДИН ПОДХОДЯЩИЙ ЭМОДЗИ"
        }
      ]
    }`;

  try {
    const ai = getAI();
    if (!ai) throw new Error("AI not initialized");
    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text;

    if (!text) throw new Error("Empty response from AI");
    
    let data;
    try {
      const clean = cleanAIJson(text);
      console.log("Evolution JSON Cleaned:", clean);
      data = JSON.parse(clean);
      console.log("=== EVOLUTION AI RESPONSE LOG ===");
      console.log("New Name:", data.newName);
      console.log("New Skills Count:", data.newSkills?.length);
      console.log("Updated Lore (preview):", String(data.updatedLore || "").substring(0, 50) + "...");
      console.log("===============================");
    } catch (e) {
      console.error("Failed to parse AI response as JSON:", text);
      throw new Error(`Внутренняя ошибка нейросети (неверный формат): ${text.substring(0, 100)}...`);
    }

    const newSkills: Skill[] = (data.newSkills || []).map((s: any) => ({
      id: Math.random().toString(36).substr(2, 9),
      code: generateUniqueCode('SK'),
      name: s.name || "Пробужденная Сила",
      description: s.description || "Новый уровень мастерства.",
      type: s.type || 'passive',
      targetStat: s.targetStat || 'attack',
      fallbackEmoji: s.emoji || (s.type === 'passive' ? '🎐' : '💥'),
      element: s.type !== 'passive' ? pet.element : undefined,
      attribute: s.type === 'passive' ? pet.attribute : undefined,
      value: s.type === 'active_debuff' 
        ? Math.floor(Math.random() * 41) + 10 // 10-50%
        : Math.floor(Math.random() * 10) + 1  // 1-10%
    }));

    return {
      newName: data.newName || pet.name,
      abilities: [], 
      lore: data.updatedLore || pet.lore,
      newSkills
    };
  } catch (error) {
    console.error("Evolution generation failed:", error);
    return { newName: pet.name, abilities: [], lore: pet.lore, newSkills: [] };
  }
};

export const generatePetStatsAndLore = async (
  profile: UserProfile,
  forcedRarity: Rarity
): Promise<{ 
  name: string; 
  stats: PetStats; 
  abilities: string[]; 
  skills: Skill[];
  lore: string;
  classification: Classification;
  element: Element;
  attribute: Attribute;
}> => {
  const baseStatsTotal = RARITY_WEIGHTS[forcedRarity].base;
  const initialStats = distributeStats(baseStatsTotal);
  
  const getRandomItem = <T>(arr: T[]): T => {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return arr[array[0] % arr.length];
  };

  const randomElement = getRandomItem<Element>(['water', 'fire', 'air', 'earth']);
  const randomAttribute = getRandomItem<Attribute>(['light', 'dark', 'void', 'time']);
  
  const prompt = `Сгенерируй данные для уникального существа в игре aiSai, которое является истинным отражением личности пользователя.
    
    Данные пользователя:
    - Имя: ${profile.name}
    - Возраст: ${profile.age}
    - Город: ${profile.city}
    - Манифест: ${profile.about}
    - Хобби: ${profile.hobbies.join(', ')}
    - Черты души: ${profile.traits.join(', ')}
    - Редкость: ${RARITY_WEIGHTS[forcedRarity].label} (${forcedRarity})
    
    Распределение характеристик существа (СГЕНЕРИРОВАНО СИСТЕМОЙ):
    - Атака: ${initialStats.attack}
    - Защита: ${initialStats.defense}
    - Здоровье: ${initialStats.health}
    - Скорость: ${initialStats.speed}
    - Восстановление: ${initialStats.regeneration}
    - Магия: ${initialStats.magic}
    
    Стихия (ЗАДАНА СИСТЕМОЙ): ${randomElement}
    Атрибут (ЗАДАН СИСТЕМОЙ): ${randomAttribute}
    
    Задача: Создай ЕДИНСТВЕННОЕ В СВОЕМ РОДЕ существо в стадии МЛАДЕНЧЕСТВА (INFANCY), которое духовно связано с этим человеком, а также воплощает свою стихию (${randomElement}) и атрибут (${randomAttribute}).
    Существо должно базироваться на РЕАЛЬНО СУЩЕСТВУЮЩЕМ биологическом виде, но быть ГИБРИДИЗИРОВАННЫМ с фантастическими элементами.
    Опирайся на его сгенерированные выше характеристики для формирования лора, классификации и навыков.
    
    ВАЖНО: Обеспечь МАКСИМАЛЬНОЕ РАЗНООБРАЗИЕ. Не ограничивайся млекопитающими. Выбирай среди насекомых, глубоководных существ, грибов, растений, редких птиц, рептилий или даже микроорганизмов. Каждое создание должно быть уникальным.
    
    Важно: Так как это стадия МЛАДЕНЧЕСТВА, описание должно подчеркивать его потенциал и хрупкость, но в рамках его вида.
    
    Верни JSON (ВСЕ ТЕКСТОВЫЕ ПОЛЯ ДОЛЖНЫ БЫТЬ НА РУССКОМ ЯЗЫКЕ. ИСПОЛЬЗУЙ НОРМАЛЬНЫЙ РЕГИСТР: ЗАГЛАВНЫЕ И СТРОЧНЫЕ БУКВЫ, БЕЗ СПЛОШНОГО КАПСЛОКА):
    {
      "name": "Эпичное имя на русском",
      "classification": {
        "type": "Тип (напр. Хордовые)",
        "class": "Класс (напр. Млекопитающие)",
        "order": "Отряд (напр. Хищные)",
        "family": "Семейство (напр. Пандовые)",
        "genus": "Род (напр. Малые панды)",
        "species": "Биологический вид-основа"
      },
      "skills": [
        { 
          "name": "...", 
          "description": "Подробное описание (2+ предложения): Как именно питомец использует свою биологию или магию для достиж... Учитывай сильные характеристики существа.", 
          "type": "passive", 
          "targetStat": "health|attack|defense|speed|magic|regeneration",
          "emoji": "ОДИН ПОДХОДЯЩИЙ ЭМОДЗИ (напр. 🛡️, 🧬, 🧿, 💎, 🧊 - НЕ ИСПОЛЬЗУЙ 🎐)"
        },
        { 
          "name": "...", 
          "description": "Подробное описание (2+ предложения): Как именно питомец концентрирует энергию... Учитывай сильные характеристики существа.", 
          "type": "active_buff", 
          "targetStat": "attack",
          "emoji": "ОДИН ПОДХОДЯЩИЙ ЭМОДЗИ (напр. 🔥, ⚡, 🧬, 🌀 - НЕ ИСПОЛЬЗУЙ 💥)"
        },
        { 
          "name": "...", 
          "description": "Подробное описание (2+ предложения): Как именно питомец воздействует на противника... Учитывай сильные характеристики существа.", 
          "type": "active_debuff", 
          "targetStat": "health|attack|defense|speed|magic|regeneration",
          "emoji": "ОДИН ПОДХОДЯЩИЙ ЭМОДЗИ (напр. 📢, 🌫️, 🍄, 🥀, 🧿 - НЕ ИСПОЛЬЗУЙ 💥)"
        }
      ],
      "lore": "легенда появления (акцент на рождении, связи с пользователем и его сильных характеристиках)"
    }
    
    Для навыков выбери targetStat с учетом выданных характеристик. Например, если Атака высокая, сделай акцент на атакующих способностях.`;

  try {
    const ai = getAI();
    if (!ai) throw new Error("AI not initialized");
    console.log("Starting stats & lore generation for profile:", profile.name);
    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: { parts: [{ text: prompt }] },
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text;
    console.log("Stats & lore raw response:", text ? (text.substring(0, 100) + '...') : 'EMPTY');

    if (!text) throw new Error("Empty response from AI for Stats");
    let parsed;
    try {
      const cleaned = cleanAIJson(text);
      if (!cleaned) throw new Error("Could not extract JSON from AI response");
      parsed = JSON.parse(cleaned);
      // DETAILED LOGGING & TESTING FOR AI RESPONSE
      console.log("=== AI GENERATION LOG ===");
      console.log("Name:", parsed.name);
      console.log("Element:", parsed.element);
      console.log("Attribute:", parsed.attribute);
      console.log("Classification:", JSON.stringify(parsed.classification));
      console.log("Skills Count:", parsed.skills?.length);
      console.log("Lore (preview):", String(parsed.lore || "").substring(0, 50) + "...");
      console.log("=========================");
    } catch (e) {
      console.error("JSON parse failed for stats:", text);
      throw new Error("Неверный формат данных от ИИ. Попробуйте еще раз.");
    }

    const name = parsed.name || "Безымянный Питомец";
    const element = randomElement;
    const attribute = randomAttribute;
    const classification = parsed.classification || {
        type: "Неизвестно",
        class: "Неизвестно",
        order: "Неизвестно",
        family: "Неизвестно",
        genus: "Неизвестно",
        species: "Неизвестно"
    };

    const getEmojiUrl = (emoji: string) => {
      if (!emoji) return undefined;
      const codePoints = Array.from(emoji).map(c => c.codePointAt(0)?.toString(16)).filter(Boolean);
      return codePoints.length > 0 ? `https://fonts.gstatic.com/s/e/notoemoji/latest/${codePoints.join('_')}/512.png` : undefined;
    };

    const skills: Skill[] = (parsed.skills || []).map((s: any) => ({
      id: Math.random().toString(36).substr(2, 9),
      code: generateUniqueCode('SK'),
      name: s.name || "Мистический Дар",
      description: s.description || "Древняя сила пробуждается и течет по жилам существа, раскрывая его истинный боевой потенциал.",
      type: s.type || 'passive',
      targetStat: s.targetStat || 'attack',
      image: getEmojiUrl(s.emoji),
      fallbackEmoji: s.emoji,
      element: s.type !== 'passive' ? element : undefined,
      attribute: s.type === 'passive' ? attribute : undefined,
      value: s.type === 'active_debuff' 
        ? Math.floor(Math.random() * 41) + 10 // 10-50%
        : Math.floor(Math.random() * 10) + 1  // 1-10%
    }));

    return {
      name,
      element,
      attribute,
      classification,
      stats: initialStats,
      skills,
      abilities: [],
      lore: parsed.lore || "Легенда еще не написана."
    };
  } catch (error) {
    console.error("Generation failed:", error);
    throw error;
  }
};

export interface RewardData {
  type: InventoryItem['type'];
  stat?: keyof PetStats;
  value?: number;
  skillType?: 'passive' | 'active_buff' | 'active_debuff';
  targetStat?: keyof PetStats;
}

export const preRollQuestReward = (pet: Pet): RewardData | null => {
  const roll = Math.random();
  
  if (roll < 0.5) return null; // 50% Nothing
  
  const stats: (keyof PetStats)[] = ['attack', 'defense', 'speed', 'magic', 'regeneration', 'luck'];

  if (roll < 0.85) {
    // 35% Artifact (+1-5 stats)
    const stat = stats[Math.floor(Math.random() * stats.length)];
    return { type: 'artifact', stat, value: Math.floor(Math.random() * 5) + 1 };
  }
  
  if (roll < 0.95) {
    // 10% Skill
    const skillTypes: RewardData['skillType'][] = ['passive', 'active_buff', 'active_debuff'];
    const skillType = skillTypes[Math.floor(Math.random() * skillTypes.length)];
    const targetStat = skillType === 'active_buff' ? 'attack' : stats[Math.floor(Math.random() * Math.max(1, stats.length))];
    const value = Math.floor(Math.random() * 15) + 5; // 5-20% boost
    return { type: 'skill', skillType, targetStat, value };
  }
  
  // 5% Egg
  return { type: 'egg' };
};

export const generateQuestBonusItem = async (reward: RewardData): Promise<InventoryItem> => {
  const getRandomItem = <T>(arr: T[]): T => {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return arr[array[0] % arr.length];
  };

  const customElement = getRandomItem(['water', 'fire', 'air', 'earth']);
  const customAttribute = getRandomItem(['light', 'dark', 'void', 'time']);
  
  const prompt = `Сгенерируй название и атмосферное описание предмета для игры aiSai. ИСПОЛЬЗУЙ НОРМАЛЬНЫЙ РЕГИСТР: ЗАГЛАВНЫЕ И СТРОЧНЫЕ БУКВЫ, БЕЗ СПЛОШНОГО КАПСЛОКА.
    ТИП ПРЕДМЕТА: ${
      reward.type === 'artifact' ? `Артефакт, увеличивающий характеристику ${reward.stat} на ${reward.value} ед.` : 
      reward.type === 'skill' ? `Свиток с навыком (Тип: ${reward.skillType === 'passive' ? 'Пассивный' : reward.skillType === 'active_buff' ? 'Активное усиление' : 'Активное ослабление врага'}), который повышает характеристику ${reward.targetStat} на ${reward.value}%.` : 
      reward.type === 'egg' ? 'Яйцо Питомца, содержащее в себе искру новой жизни.' : 'Особая находка'
    }
    
    ВАЖНО: Нейросеть генерирует только название (name) и художественное описание (description), объясняющее ОТКУДА взялся этот предмет и как его магические/биологические свойства связаны с его эффектом. Пожалуйста, НЕ ВКЛЮЧАЙ числовые значения и проценты в описание.
    
    ДЛЯ АРТЕФАКТОВ:
    - emoji: ОДИН ПОДХОДЯЩИЙ ЭМОДЗИ (напр. 💍, 🛡️, 👟, 🔮, 🧬, 🧿)
    
    ДЛЯ СВИТКОВ НАВЫКОВ (skill):
    - emoji: ОДИН ПОДХОДЯЩИЙ ЭМОДЗИ (напр. 📜, 🧬, ⚡, 🔥, 🛡️)
    ${
      reward.type === 'skill' 
        ? reward.skillType === 'passive' 
          ? `- Атрибут этого навыка - ${customAttribute}. Отрази это в названии/описании.` 
          : `- Стихия этого навыка - ${customElement}. Отрази это в названии/описании.`
        : ''
    }
    
    Верни JSON с полями: name, description, emoji. Текст на русском языке.`;

  try {
    const ai = getAI();
    if (!ai) throw new Error("AI not initialized");
    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response");
    const data = JSON.parse(cleanAIJson(text));
    
    return {
      id: Math.random().toString(36).substr(2, 9),
      code: generateUniqueCode(reward.type === 'egg' ? 'EG' : reward.type === 'artifact' ? 'AR' : 'SK'),
      type: reward.type,
      name: data.name || "Странный объект",
      description: data.description || "Мистический артефакт",
      value: reward.value || 10,
      image: reward.type === 'egg' ? 'https://i.ibb.co/JwYQcc2D/egg.png' : undefined,
      effect: reward.stat ? { stat: reward.stat, value: reward.value || 1 } : undefined,
      skillData: reward.type === 'skill' ? {
        type: reward.skillType!,
        targetStat: reward.targetStat!,
        value: reward.value!,
        element: reward.skillType !== 'passive' ? (customElement as any) : undefined,
        attribute: reward.skillType === 'passive' ? (customAttribute as any) : undefined
      } : undefined,
      hue: reward.type === 'egg' ? Math.floor(Math.random() * 360) : undefined,
      // Pass the raw emoji as fallback
      fallbackEmoji: data.emoji || (reward.type === 'egg' ? '🥚' : '💎')
    };
  } catch (e) {
    return {
      id: 'fallback-' + Date.now(),
      code: generateUniqueCode(reward.type === 'egg' ? 'EG' : reward.type === 'artifact' ? 'AR' : 'SK'),
      type: reward.type,
      name: reward.type === 'artifact' ? 'Древний Тотем' : 'Мистический Сгусток',
      description: 'Обладает скрытой силой.',
      value: reward.value || 10,
      image: reward.type === 'egg' ? 'https://i.ibb.co/JwYQcc2D/egg.png' : undefined,
      hue: reward.type === 'egg' ? Math.floor(Math.random() * 360) : undefined,
      effect: reward.stat ? { stat: reward.stat, value: reward.value || 1 } : undefined,
      skillData: reward.type === 'skill' ? {
        type: 'passive',
        targetStat: 'attack',
        value: 10
      } : undefined,
      fallbackEmoji: reward.type === 'egg' ? '🥚' : '💎'
    };
  }
};

export interface QuestNode {
  scenario: string;
  options: {
    text: string;
    outcome: string;
    isCorrect: boolean;
    nextNodeId: string | null;
  }[];
}

export interface QuestTree {
  title: string;
  scenes: Record<string, QuestNode>;
}

export const generateQuest = async (
  profile: UserProfile, 
  pet: Pet, 
  reward: RewardData | null
): Promise<QuestTree | null> => {
    const rewardDesc = reward 
    ? `В конце успешного прохождения герои должны найти: ${
        reward.type === 'artifact' ? `Артефакт, дающий +${reward.value} к ${reward.stat}` :
        reward.type === 'skill' ? `Свиток с навыком (Тип: ${reward.skillType === 'passive' ? 'пассивный' : reward.skillType === 'active_buff' ? 'активный бафф' : 'активный дебафф'}). Эффект: ${reward.value}% к характеристике ${reward.targetStat}` :
        reward.type === 'egg' ? `Загадочное яйцо нового существа` : 'сокровище'
      }.`
    : "В конце успешного прохождения герои получают опыт и ростки, но новых предметов не находят.";

  const prompt = `Сгенерируй полноценную приключенческую историю для Призывателя и его Питомца. 
    ПРАВИЛА ДЛЯ ПРЕДМЕТОВ:
    - ИСПОЛЬЗУЙ НОРМАЛЬНЫЙ РЕГИСТР: ЗАГЛАВНЫЕ И СТРОЧНЫЕ БУКВЫ. Все названия и тексты должны быть на русском без сплошного КАПСЛОКА.
    - Пассивные навыки: +1-10% к статам, связаны с Атрибутами (Свет, Тьма, Время, Пустота).
    - Активные баффы: +1-10% к атаке (СТРОГО attack), связаны со Стихиями (Огонь, Вода, Земля, Воздух).
    - Активные дебаффы: -10-50% от стата соперника (любой стат), связаны со стихией.
    - Доступные статы: Атака, Защита, Здоровье, Скорость, Магия, Регенерация.
    
    ИНФОРМАЦИЯ О ГЕРОЯХ:
    Призыватель: Имя: ${profile.name}, Пол: ${profile.gender === 'male' ? 'Мужской' : 'Женский'}, Город: ${profile.city}, Манифест: ${profile.about}, Возраст: ${profile.age}.
    Питомец: Имя: ${pet.name}, Стихия: ${pet.element}, Атрибут: ${pet.attribute}, Ранг: ${pet.rank}, Редкость: ${pet.rarity}, Уровень: ${pet.level}.
    Классификация питомца: Тип: ${pet.classification.type}, Класс: ${pet.classification.class}, Семейство: ${pet.classification.family}, Отряд: ${pet.classification.order}, Род: ${pet.classification.genus}, Вид: ${pet.classification.species}.
    Лор питомца: ${pet.lore}.
    Навыки питомца: ${pet.skills.map(s => `${s.name} (${s.description})`).join(', ')}.
    Место действия: ${pet.habitat}.
    
    СТРУКТУРА КВЕСТА (ТРИ АКТА):
    Эта история должна быть классическим приключением в трех актах:
    1. Акт I (Завязка): Сцена "root". Герои сталкиваются с проблемой или вызовом в ${pet.habitat}. Постепенное знакомство с обстановкой.
    2. Акт II (Развитие и Напряжение): Сцены s2_a и s2_b. Ситуация усложняется, герои должны использовать свои навыки для преодоления препятствий.
    3. Акт III (Кульминация и Финал): Сцены s3_a, s3_b, s3_c, s3_d. Решающее столкновение или открытие. В каждом финальном результате должен быть четкий вывод от Призывателя и Питомца, завершающий сюжетную арку.
    
    УСЛОВИЕ УСПЕХА: ${rewardDesc}
    
    ТРЕБОВАНИЯ К ТЕКСТУ:
    1. Полноценная история с завязкой, развитием и финальным выводом. 
    2. В каждом варианте выбора (option) поле outcome должно описывать, ЧТО ПРОИЗОШЛО сразу после выбора (успех или неудача этого шага) и как это продвигает сюжет дальше.
    3. Используй особенности стихии (${pet.element}), атрибута (${pet.attribute}) и биологического вида питомца в деталях повествовании.
    4. ВАЖНО: В каждой сцене ОБЯЗАТЕЛЬНО ровно 2 варианта выбора (options), не больше и не меньше. 
    5. КРИТИЧЕСКИ ВАЖНО ДЛЯ ГЕЙМПЛЕЯ: Правильный вариант (isCorrect: true) должен распределяться СЛУЧАЙНЫМ ОБРАЗОМ между первым и вторым индексом. Мы фиксируем аномалию, где второй вариант почти всегда ведет к неудаче — исправь это, делая выбор непредсказуемым.
    6. Если общее приключение в 3 актах, то в 3-ем акте (финальные сцены) обязательно завершай историю полноценным финалом.
    7. Текст должен быть атмосферным, в стиле фэнтези-дневника или визуальной новеллы.
    
    Верни JSON объект на русском языке:
    {
      "title": "Название приключения",
      "scenes": {
        "root": {
          "scenario": "Завязка истории...",
          "options": [
            { "text": "Вариант 1", "outcome": "Текст результата...", "isCorrect": true/false (СЛУЧАЙНО!), "nextNodeId": "s2_a" / "s2_b" },
            { "text": "Вариант 2", "outcome": "Текст результата...", "isCorrect": false/true (СЛУЧАЙНО!), "nextNodeId": "s2_a" / "s2_b" }
          ]
        },
        "s2_a": { "scenario": "Обстановка во втором акте...", "options": [ { "text": "...", "outcome": "...", "isCorrect": true/false, "nextNodeId": "s3_a" / "s3_b" }, { "text": "...", "outcome": "...", "isCorrect": false/true, "nextNodeId": "s3_a" / "s3_b" } ] },
        "s2_b": { "scenario": "...", "options": [...] },
        "s3_a": { "scenario": "Финал истории...", "options": [ { "text": "Вариант 1", "outcome": "Завершение сюжета...", "isCorrect": true/false, "nextNodeId": null }, { "text": "Вариант 2", "outcome": "Завершение сюжета...", "isCorrect": false/true, "nextNodeId": null } ] },
        "s3_b": { "scenario": "...", "options": [...] },
        "s3_c": { "scenario": "...", "options": [...] },
        "s3_d": { "scenario": "...", "options": [...] }
      }
    }`;

  try {
    const ai = getAI();
    if (!ai) throw new Error("AI not initialized");
    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text;
    if (!text) return null;
    try {
      const parsed = JSON.parse(cleanAIJson(text)) as QuestTree;
      console.log("=== QUEST AI RESPONSE LOG ===");
      console.log("Quest Title:", parsed.title);
      console.log("Scenes count:", Object.keys(parsed.scenes || {}).length);
      console.log("===============================");
      return parsed;
    } catch (e) {
      console.error("Quest tree parse failed:", text);
      return null;
    }
  } catch (error) {
    console.error("Quest tree generation failed:", error);
    return null;
  }
};
