import { InventoryItem, PetStats, SkillType } from "../types";

export const SELLING_PRICES = {
  egg: 500,
  artifact: 500,
  skill: 1000
};

export const BUYING_PRICES = {
  egg: 5000,
  sprouts_per_ruble: 100,
  energy_per_ruble: 10,
  battle_cost: 5,
  quest_cost: 10
};

export const STAT_MAP_RU: Record<string, string> = {
  attack: 'Атака',
  defense: 'Защита',
  speed: 'Скорость',
  magic: 'Магия',
  regeneration: 'Регенерация',
  health: 'Здоровье'
};

export const SHOP_ARTIFACTS: InventoryItem[] = [
  { name: 'Кольцо огня', stat: 'attack', value: 15, emoji: '1f48d' },
  { name: 'Щит порядка', stat: 'defense', value: 20, emoji: '1f6e1' },
  { name: 'Крылатые сандалии', stat: 'speed', value: 12, emoji: '1f45f' },
  { name: 'Магическая сфера', stat: 'magic', value: 18, emoji: '1f52e' },
  { name: 'Амулет жизни', stat: 'health', value: 50, emoji: '1f9ec' },
  { name: 'Золотая подкова', stat: 'regeneration', value: 10, emoji: '1f434' },
].map((item, i) => {
  const price = 2000 + (i * 1500);
  return {
    id: `shop-art-${i}`,
    type: 'artifact',
    name: item.name,
    description: `Древний артефакт, дарующий владельцу силу. Увеличивает ${STAT_MAP_RU[item.stat] || item.stat} на ${item.value} ед.`,
    value: price, 
    effect: { stat: item.stat, value: item.value },
    image: `https://fonts.gstatic.com/s/e/notoemoji/latest/${item.emoji}/512.png`,
    fallbackEmoji: String.fromCodePoint(parseInt(item.emoji, 16))
  } as any; 
});

export const SHOP_SKILLS: InventoryItem[] = [
  { name: 'Свиток мудрости', type: 'passive', stat: 'magic', value: 8, emoji: '1f4d6', attribute: 'time' },
  { name: 'Дух медведя', type: 'active_buff', stat: 'attack', value: 10, emoji: '1f43b', element: 'earth' },
  { name: 'Танец листа', type: 'passive', stat: 'speed', value: 7, emoji: '1f343', attribute: 'time' },
  { name: 'Каменная кожа', type: 'active_buff', stat: 'defense', value: 5, emoji: '1f7a8', element: 'earth' },
  { name: 'Теневой шаг', type: 'active_debuff', stat: 'speed', value: 15, emoji: '1f430', element: 'air' },
  { name: 'Взгляд горгоны', type: 'active_debuff', stat: 'defense', value: 25, emoji: '1f40d', element: 'earth' },
  { name: 'Зов феникса', type: 'passive', stat: 'regeneration', value: 9, emoji: '1f525', attribute: 'light' },
  { name: 'Сила титана', type: 'active_buff', stat: 'attack', value: 10, emoji: '1f4aa', element: 'fire' },
  { name: 'Взор дракона', type: 'passive', stat: 'attack', value: 10, emoji: '1f432', attribute: 'void' },
].map((item, i) => {
  const price = 5000 + (i * 2000);
  
  const elementRu: Record<string, string> = { fire: 'Огонь', water: 'Вода', air: 'Воздух', earth: 'Земля' };
  const attributeRu: Record<string, string> = { light: 'Свет', dark: 'Тьма', void: 'Пустота', time: 'Время' };
  
  let desc = '';
  const typeLabel = item.type === 'passive' ? 'Пассивный' : item.type === 'active_buff' ? 'Активный бафф' : 'Активный дебафф';
  const requirement = item.type === 'passive' ? `Атрибут: ${attributeRu[item.attribute || '']}` : `Стихия: ${elementRu[item.element || '']}`;
  
  if (item.type === 'passive') {
    desc = `${typeLabel}: +${item.value}% к ${STAT_MAP_RU[item.stat]}. Требуется ${requirement}.`;
  } else if (item.type === 'active_buff') {
    desc = `${typeLabel}: +${item.value}% к атакующим действиям. Требуется ${requirement}.`;
  } else {
    desc = `${typeLabel}: снижает ${STAT_MAP_RU[item.stat]} соперника на ${item.value}%. Требуется ${requirement}.`;
  }

  return {
    id: `shop-skill-${i}`,
    type: 'skill',
    name: item.name,
    description: desc,
    value: price,
    skillData: { 
      type: item.type, 
      targetStat: item.stat, 
      value: item.value,
      element: item.element,
      attribute: item.attribute
    },
    image: `https://fonts.gstatic.com/s/e/notoemoji/latest/${item.emoji}/512.png`,
    fallbackEmoji: String.fromCodePoint(parseInt(item.emoji, 16))
  } as InventoryItem;
});
