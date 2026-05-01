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
      console.warn("GEMINI_API_KEY is not set. AI features may fail.");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
};

export const generatePetArt = async (pet: Partial<Pet>) => {
  const ai = getAI();
  const prompt = `Hand-drawn blue pen sketch of a ${pet.rarity} ${pet.element} ${pet.attribute} creature based on a real-world ${pet.classification?.species}.
                  Art Stage: ${pet.ageStage}.
                  Art Style: Scribbled ballpoint pen illustration, blue ink drawing. 
                  Background: Hand-drawn on a white GRID graph paper notebook page (checkered).
                  Visual character: Manga style sketch, hatching shadows, sketchy lines, mystical aura.
                  Strict requirement: monochromatic BLUE PEN INK only on WHITE GRAPH PAPER SQUARE GRID background.
                  MANDATORY: NO COLORS other than blue pen ink. NO TEXT, NO UI.
                  Vertical 9:16 portrait, high quality detailed sketch art.`;
  
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] }
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    
    return `https://picsum.photos/seed/${pet.id}-${pet.level}/1080/1920`;
  } catch (error) {
    console.error("Image generation failed:", error);
    return `https://picsum.photos/seed/${pet.id}-${pet.level}/1080/1920`;
  }
};

export const generateEvolutionUpdate = async (
  pet: Pet,
  newRank: string
): Promise<{ abilities: string[]; lore: string }> => {
  const prompt = `Питомец ${pet.name} эволюционировал до ранга ${newRank}!
    Текущая информация:
    - Вид: ${pet.classification.species}
    - Элемент: ${pet.element}
    - Атрибут: ${pet.attribute}
    - Текущие способности: ${pet.abilities.join(', ')}
    - Легенда: ${pet.lore}
    
    Сгенерируй:
    1. Новую уникальную способность, которая добавляется к текущему списку. Она должна соответствовать элементу (${pet.element}) и атрибуту (${pet.attribute}) и быть мощнее предыдущих.
    2. Обновленную легенду, описывающую качественное изменение существа на новом этапе развития (${newRank}).
    
    Верни JSON объект на русском языке.`;

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            newAbility: { type: Type.STRING },
            updatedLore: { type: Type.STRING }
          },
          required: ['newAbility', 'updatedLore']
        }
      }
    });

    if (!response.text) throw new Error("Empty response from AI");
    const data = JSON.parse(response.text);
    return {
      abilities: [...pet.abilities, data.newAbility],
      lore: data.updatedLore
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
    - Имя: ${profile.name}, Хобби: ${profile.hobbies.join(', ')}, Черты: ${profile.traits.join(', ')}
    - Потенциал: ${RARITY_WEIGHTS[forcedRarity].label} (${forcedRarity})
    - Общий бюджет очков характеристик: ${baseStatsTotal}
    
    Задача: Создай ЕДИНСТВЕННОЕ В СВОЕМ РОДЕ существо в стадии МЛАДЕНЧЕСТВА.
    Существо должно базироваться на РЕАЛЬНО СУЩЕСТВУЮЩЕМ биологическом виде, но быть ГИБРИДИЗИРОВАННЫМ с фантастическими элементами.
    
    Верни JSON:
    1. name: Эпичное имя (а-ля манхуа).
    2. element: одна из [water, fire, air, earth].
    3. attribute: одна из [light, dark, void, time].
    4. classification: биологическая структура.
    5. stats: распредели ${baseStatsTotal} очков между attack, defense, speed, magic, regeneration, health. health и maxHealth должны быть одинаковыми. rage=0, maxRage=100.
    6. abilities: 1 начальный навык.
    7. lore: легенда появления.`;

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            element: { type: Type.STRING },
            attribute: { type: Type.STRING },
            classification: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING },
                class: { type: Type.STRING },
                order: { type: Type.STRING },
                family: { type: Type.STRING },
                genus: { type: Type.STRING },
                species: { type: Type.STRING }
              }
            },
            stats: {
              type: Type.OBJECT,
              properties: {
                attack: { type: Type.NUMBER },
                defense: { type: Type.NUMBER },
                speed: { type: Type.NUMBER },
                magic: { type: Type.NUMBER },
                regeneration: { type: Type.NUMBER },
                health: { type: Type.NUMBER }
              }
            },
            abilities: { type: Type.ARRAY, items: { type: Type.STRING } },
            lore: { type: Type.STRING }
          }
        }
      }
    });

    if (!response.text) throw new Error("Empty response from AI for Stats");
    const parsed = JSON.parse(response.text);
    return {
      ...parsed,
      stats: {
        ...parsed.stats,
        maxHealth: parsed.stats.health,
        maxRage: 100,
        rage: 0
      }
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
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    if (!response.text) throw new Error("Empty response from AI for Item");
    const data = JSON.parse(response.text);
    return {
      id: Math.random().toString(36).substr(2, 9),
      type,
      name: data.name,
      description: data.description,
      value: data.value
    };
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
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            scenario: { type: Type.STRING },
            options: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  outcome: { type: Type.STRING },
                  rewardXP: { type: Type.NUMBER },
                  rewardRubles: { type: Type.NUMBER }
                },
                required: ['text', 'outcome', 'rewardXP', 'rewardRubles']
              }
            }
          },
          required: ['title', 'scenario', 'options']
        }
      }
    });

    if (!response.text) return null;
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Quest generation failed:", error);
    return null;
  }
};
