import { GoogleGenAI, Type } from "@google/genai";
import { Pet, PetStats, Rarity, Element, Attribute, Personality, Habitat, Classification, UserProfile, InventoryItem } from "../types";
import { RARITY_WEIGHTS } from "../lib/gameLogic";

// Safe way to access environment variables in Vite/React
const getApiKey = () => {
  try {
    return (typeof process !== 'undefined' ? (process.env as any).GEMINI_API_KEY : '') || '';
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

export const generatePetArt = async (pet: Partial<Pet>) => {
  const isInfant = !pet.ageStage || pet.ageStage === 'F - младенчество';
  const prompt = `A hand-drawn BLUE PEN SKETCH of a mythical creature in its ${isInfant ? 'INFANCY/BABY/NEWBORN' : 'ADULT/EVOLVED'} stage. 
                  SUBJECT: ${isInfant ? 'Newborn' : 'Evolved'} ${pet.rarity} ${pet.element} ${pet.attribute} creature, biology based on ${pet.classification?.species}.
                  DETAILS: ${isInfant ? 'Small, cute but wild, youthful features, hatching from egg or just born.' : 'Powerful, majestic, fully developed features.'}
                  ART STYLE: Scribbled ballpoint pen illustration, blue ink drawing only, with hatching and cross-hatching shadows.
                  ENVIRONMENT: Centered on white GRID GRAPH PAPER.
                  FORMAT: Vertical portrait 9:16 aspect ratio.
                  MANDATORY: MONOCHROMATIC BLUE PEN INK ON WHITE PAPER.`;
  
  try {
    const ai = getAI();
    if (!ai) throw new Error("AI not initialized");
    
    // Using image generation model
    const response = await ai.models.generateContent({
      model: IMAGE_MODEL,
      contents: prompt,
      config: {
        imageConfig: {
          aspectRatio: "9:16"
        }
      }
    });

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
): Promise<{ abilities: string[]; lore: string }> => {
  const prompt = `Питомец ${pet.name} эволюционировал до ранга ${newRank}!
    Текущая информация:
    - Биологическая классификация: ${pet.classification.genus} ${pet.classification.species} (${pet.classification.family})
    - Элемент: ${pet.element}
    - Атрибут: ${pet.attribute}
    - Текущие способности: ${pet.abilities.join(', ')}
    - Текущая легенда: ${pet.lore}
    
    Сгенерируй:
    1. Новую уникальную способность, которая добавляется к текущему списку. Она должна строго соответствовать биологическому виду (${pet.classification.species}), элементу (${pet.element}) и атрибуту (${pet.attribute}).
    2. Обновленную легенду, описывающую качественное биологическое изменение существа на новом этапе развития.
    
    Верни JSON объект на русском языке.`;

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
      // Remove possible markdown code blocks if the model returned them
      const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
      data = JSON.parse(cleanedText);
    } catch (e) {
      console.error("Failed to parse AI response as JSON:", text);
      throw new Error("Invalid format from AI");
    }
    
    return {
      abilities: [...pet.abilities, data.newAbility || "Пробуждение"],
      lore: data.updatedLore || pet.lore
    };
  } catch (error) {
    console.error("Evolution generation failed:", error);
    return { abilities: [...pet.abilities, "Мощный Всплеск"], lore: pet.lore };
  }
};

export const generatePetStatsAndLore = async (
  profile: UserProfile,
  forcedRarity: Rarity
): Promise<{ 
  name: string; 
  stats: PetStats; 
  abilities: string[]; 
  lore: string;
  classification: Classification;
  element: Element;
  attribute: Attribute;
}> => {
  const baseStatsTotal = RARITY_WEIGHTS[forcedRarity].base;
  
  const prompt = `Сгенерируй данные для уникального существа в игре aiSai, которое является истинным отражением личности пользователя.
    
    Данные пользователя:
    - Имя: ${profile.name}
    - Возраст: ${profile.age}
    - Город: ${profile.city}
    - Манифест: ${profile.about}
    - Хобби: ${profile.hobbies.join(', ')}
    - Черты души: ${profile.traits.join(', ')}
    - Потенциал: ${RARITY_WEIGHTS[forcedRarity].label} (${forcedRarity})
    
    Задача: Создай ЕДИНСТВЕННОЕ В СВОЕМ РОДЕ существо в стадии МЛАДЕНЧЕСТВА (INFANCY), которое духовно связано с этим человеком.
    Существо должно базироваться на РЕАЛЬНО СУЩЕСТВУЮЩЕМ биологическом виде, но быть ГИБРИДИЗИРОВАННЫМ с фантастическими элементами.
    
    ВАЖНО: Обеспечь МАКСИМАЛЬНОЕ РАЗНООБРАЗИЕ. Не ограничивайся млекопитающими. Выбирай среди насекомых, глубоководных существ, грибов, растений, редких птиц, рептилий или даже микроорганизмов. Каждое создание должно быть уникальным.
    
    Важно: Так как это стадия МЛАДЕНЧЕСТВА, описание должно подчеркивать его потенциал и хрупкость, но в рамках его вида.
    
    Верни JSON (ВСЕ ТЕКСТОВЫЕ ПОЛЯ ДОЛЖНЫ БЫТЬ НА РУССКОМ ЯЗЫКЕ):
    {
      "name": "Эпичное имя на русском",
      "element": "water|fire|air|earth",
      "attribute": "light|dark|void|time",
      "classification": {
        "type": "Тип (напр. Хордовые)",
        "class": "Класс (напр. Млекопитающие)",
        "order": "Отряд (напр. Хищные)",
        "family": "Семейство (напр. Пандовые)",
        "genus": "Род (напр. Малые панды)",
        "species": "Биологический вид-основа"
      },
      "stats_distribution": {
        "attack": 0.1,
        "defense": 0.2,
        "health": 0.4,
        "speed": 0.1,
        "regeneration": 0.1,
        "magic": 0.1
      },
      "abilities": ["название способности"],
      "lore": "легенда появления (акцент на рождении и связи с пользователем)"
    }

    Условия для stats_distribution:
    - Сумма всех значений в stats_distribution должна быть равна 1.0. 
    - Это определит, на какие характеристики существо опирается биологически.`;

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

    if (!text) throw new Error("Empty response from AI for Stats");
    let parsed;
    try {
      const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
      parsed = JSON.parse(cleanedText);
    } catch (e) {
      console.error("JSON parse failed for stats:", text);
      throw new Error("Invalid format from AI");
    }

    const name = parsed.name || "Безымянный Питомец";
    const element = (parsed.element || "water") as Element;
    const attribute = (parsed.attribute || "void") as Attribute;
    const classification = parsed.classification || {
        type: "Неизвестно",
        class: "Неизвестно",
        order: "Неизвестно",
        family: "Неизвестно",
        genus: "Неизвестно",
        species: "Неизвестно"
    };

    return {
      name,
      element,
      attribute,
      classification,
      stats: {
        attack: Math.round(baseStatsTotal * (parsed.stats_distribution?.attack || 0.15)),
        defense: Math.round(baseStatsTotal * (parsed.stats_distribution?.defense || 0.15)),
        speed: Math.round(baseStatsTotal * (parsed.stats_distribution?.speed || 0.15)),
        magic: Math.round(baseStatsTotal * (parsed.stats_distribution?.magic || 0.15)),
        regeneration: Math.round(baseStatsTotal * (parsed.stats_distribution?.regeneration || 0.1)),
        health: Math.round(baseStatsTotal * (parsed.stats_distribution?.health || 0.3)),
        maxHealth: Math.round(baseStatsTotal * (parsed.stats_distribution?.health || 0.3)),
        luck: 5,
        maxRage: 100,
        rage: 0
      },
      abilities: Array.isArray(parsed.abilities) ? parsed.abilities : ["Базовая Атака"],
      lore: parsed.lore || "Легенда еще не написана."
    };
  } catch (error) {
    console.error("Generation failed:", error);
    throw error;
  }
};

export const generateBonusItem = async (type: 'material' | 'food' | 'egg'): Promise<InventoryItem> => {
  const prompt = `Сгенерируй описание предмета типа "${type}" для игры aiSai.
    Это должен быть либо редкий материал для эволюции, либо особая еда, либо мистическое яйцо.
    Верни JSON с полями: name, description, value (сила предмета от 10 до 50).`;

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

    if (!text) throw new Error("Empty response from AI for Item");
    try {
      const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
      const data = JSON.parse(cleanedText);
      return {
        id: Math.random().toString(36).substr(2, 9),
        type,
        name: data.name || "Странный объект",
        description: data.description || "Не описано",
        value: data.value || 0
      };
    } catch (e) {
      throw new Error("Parse failed");
    }
  } catch (e) {
    return {
      id: 'fallback',
      type: 'food',
      name: 'Медовый Сгусток',
      description: 'Восстанавливает силы.',
      value: 20
    };
  }
};

export const generateQuest = async (pet: Pet) => {
  const prompt = `Сгенерируй случайное испытание (квест) для ИИ-питомца ${pet.name} (${pet.classification.species}).
    Питомец находится в Среде: ${pet.habitat}.
    Верни JSON объект на русском языке.
    
    1. Название (title): Эпичное название задания.
    2. Сценарий (scenario): Описание ситуации (1-2 предложения).
    3. Варианты (options): массив из 4 объектов { text, outcome, rewardXP, rewardRubles }.
    4. Награды: от 50 до 1000.`;

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
      const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleanedText);
    } catch (e) {
      console.error("Quest parse failed:", text);
      return null;
    }
  } catch (error) {
    console.error("Quest generation failed:", error);
    return null;
  }
};
