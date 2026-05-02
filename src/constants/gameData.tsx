import { Element, Attribute, Rarity } from '../types';
import { 
  Flame, 
  Droplets, 
  Wind, 
  Mountain, 
  Sun, 
  Moon, 
  Eye, 
  Clock 
} from 'lucide-react';

export const ELEMENT_DATA: Record<Element, { 
  label: string; 
  icon: any; 
  color: string; 
  bgColor: string;
  weakTo: Element;
  strongAgainst: Element;
  description: string;
}> = {
  fire: {
    label: 'Огонь',
    icon: Flame,
    color: '#FF4D00',
    bgColor: '#FFF5F0',
    weakTo: 'water',
    strongAgainst: 'earth',
    description: 'Сила разрушения и перерождения. Сокрушает Землю своим жаром, но гаснет под натиском Воды.'
  },
  water: {
    label: 'Вода',
    icon: Droplets,
    color: '#00A3FF',
    bgColor: '#F0F9FF',
    weakTo: 'earth',
    strongAgainst: 'fire',
    description: 'Текучесть и адаптация. Поглощает Огонь, но бессильна против устойчивости Земли.'
  },
  air: {
    label: 'Воздух',
    icon: Wind,
    color: '#00E0FF',
    bgColor: '#F0FDFF',
    weakTo: 'fire',
    strongAgainst: 'water',
    description: 'Свобода и скорость. Раздувает пламя, но направляет потоки Воды.'
  },
  earth: {
    label: 'Земля',
    icon: Mountain,
    color: '#A16207',
    bgColor: '#FEFCE8',
    weakTo: 'air',
    strongAgainst: 'water',
    description: 'Стабильность и защита. Сдерживает Воду, но размывается потоками Воздуха.'
  }
};

export const ATTRIBUTE_DATA: Record<Attribute, { 
  label: string; 
  icon: any; 
  color: string; 
  bgColor: string;
  opponent: Attribute;
  description: string;
}> = {
  light: {
    label: 'Свет',
    icon: Sun,
    color: '#EAB308',
    bgColor: '#FEFCE8',
    opponent: 'dark',
    description: 'Порядок и ясность. Противостоит Тьме в вечном цикле равновесия.'
  },
  dark: {
    label: 'Тьма',
    icon: Moon,
    color: '#7C3AED',
    bgColor: '#F5F3FF',
    opponent: 'light',
    description: 'Хаос и тайны. Поглощает Свет, стремясь к изначальному покою.'
  },
  void: {
    label: 'Бездна',
    icon: Eye,
    color: '#DB2777',
    bgColor: '#FFF1F2',
    opponent: 'time',
    description: 'Пустота и исчезновение. Растворяет саму ткань Времени.'
  },
  time: {
    label: 'Время',
    icon: Clock,
    color: '#059669',
    bgColor: '#ECFDF5',
    opponent: 'void',
    description: 'Постоянство и цикл. Сковывает Бездну в рамках вечного сейчас.'
  }
};

export const RARITY_LABELS: Record<Rarity, string> = {
  normal: 'Обычный',
  advanced: 'Продвинутый',
  rare: 'Редкий',
  perfect: 'Совершенный',
  epic: 'Эпический',
  legendary: 'Легендарный',
  mythical: 'Мифический',
  eternal: 'Вечный',
  divine: 'Божественный',
  transcendent: 'Трансцендентный'
};
