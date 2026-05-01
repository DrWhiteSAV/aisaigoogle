import { GoogleGenAI, Type } from "@google/genai";
import { Pet, PetStats, Rarity, Element, Personality, Habitat, Classification, UserProfile } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const generatePetArt = async (pet: Partial<Pet>) => {
  const prompt = `Hand-drawn blue pen sketch of a ${pet.rarity} ${pet.element} creature based on a real-world ${pet.classification?.species}.
                  Art Style: Scribbled ballpoint pen illustration, blue ink drawing. 
                  Background: Hand-drawn on a white GRID graph paper notebook page (checkered).
                  Visual character: Manga style sketch, hatching shadows, sketchy lines, mystical aura.
                  Strict requirement: monochromatic BLUE PEN INK only on WHITE GRAPH PAPER SQUARE GRID background.
                  MANDATORY: NO COLORS other than blue pen ink. NO TEXT, NO UI.
                  Vertical 9:16 portrait, high quality detailed sketch art.`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
      config: { 
        imageConfig: {
          aspectRatio: '9:16' 
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  } catch (error) {
    console.error("Image generation failed:", error);
    return `https://picsum.photos/seed/${pet.id}/1080/1920`;
  }
  return `https://picsum.photos/seed/${pet.id}/1080/1920`;
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
}> => {
  const prompt = `Сгенерируй данные для уникального существа в игре aiSai, которое является истинным отражением личности пользователя.
    
    Данные пользователя:
    - Имя: ${profile.name}
    - Пол: ${profile.gender === 'male' ? 'Мужской' : 'Женский'}
    - Возраст: ${profile.age}
    - Город: ${profile.city}
    - Хобби: ${profile.hobbies.join(', ')}
    - Характер/Черты: ${profile.traits.join(', ')}
    - О себе: ${profile.about}
    - Редкость души: ${forcedRarity}

    Задача: На основе этих ТЕРРАБАЙТОВ данных о человеке, создай ЕДИНСТВЕННОЕ В СВОЕМ РОДЕ существо в стадии ДЕТСТВА (детеныш, малек или росток).
    ВАЖНОЕ ТРЕБОВАНИЕ К ДИЗАЙНУ: Существо должно базироваться на РЕАЛЬНО СУЩЕСТВУЮЩЕМ биологическом виде (например, Полярная лиса, Глубоководный кальмар, Сокол-сапсан), но быть ГИБРИДИЗИРОВАННЫМ с фантастическими элементами в стиле культивационных МАНХУА/МАНХВЫ (божественная энергия, мистические узоры, эфирные конечности).
    Верни JSON объект на русском языке.
    
    1. Имя (name): Звучное и интересное в стиле манхуа (например, "Лазурный Вестник Резонанса", "Золотой Солнечный Клык").
    2. Классификация (classification): тип, класс, отряд, семейство, род, вид. Классификация должна быть СТРОГО биологически корректной для базового реального животного, но с добавлением магического подзаголовка.
    3. Характеристики (stats): магия (magic), скорость (speed), защита (defense), атака (attack), регенерация (regeneration), здоровье (health). 
       ВАЖНО: Поскольку это стадия ДЕТСТВА, все характеристики должны быть в диапазоне от 1 до 10.
    4. Способности (abilities): список из 3 уникальных способностей, которые ПРЕДПОЛАГАЮТСЯ у взрослой особи, но сейчас находятся в зачаточном состоянии.
    5. Легенда (lore): один абзац захватывающей истории, объясняющей, как этот детеныш воплощает дух ${profile.name} и каким великим существом он может стать в будущем.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            classification: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING },
                class: { type: Type.STRING },
                order: { type: Type.STRING },
                family: { type: Type.STRING },
                genus: { type: Type.STRING },
                species: { type: Type.STRING }
              },
              required: ['type', 'class', 'order', 'family', 'genus', 'species']
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
              },
              required: ['attack', 'defense', 'speed', 'magic', 'regeneration', 'health']
            },
            abilities: { type: Type.ARRAY, items: { type: Type.STRING } },
            lore: { type: Type.STRING }
          },
          required: ['name', 'classification', 'stats', 'abilities', 'lore']
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Generation failed:", error);
    throw error;
  }
};

export const generateQuest = async (pet: Pet) => {
  const prompt = `Ты — мастер квестов в аниме-игре "aiSai". Создай короткое испытание для питомца:
    Питомец: ${pet.name} (${pet.classification.species})
    Редкость: ${pet.rarity}
    Стадия: ${pet.ageStage}
    
    Испытание должно быть в стиле аниме/манхуа. Опиши ситуацию и 4 варианта действия.
    Верни JSON объект на русском языке.
    
    1. Название (title): Эпичное название задания.
    2. Сценарий (scenario): Описание ситуации (1-2 предложения).
    3. Варианты (options): массив из 4 объектов { text, outcome, rewardXP, rewardRubles }.
       Награды: от 50 до 1000.`;

  try {
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

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Quest generation failed:", error);
    return null;
  }
};
