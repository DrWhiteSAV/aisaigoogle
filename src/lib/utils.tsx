import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import React from 'react';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateUniqueCode(prefix: string = 'ITEM', suffix: string = ''): string {
  return `${prefix}-${Math.random().toString(36).substring(2, 9).toUpperCase()}${suffix}`;
}

export function renderWithEmojis(text: string | null | undefined): React.ReactNode {
  if (!text) return null;
  // Regex range that matches most common emojis used in the game
  const emojiRegex = /([\u{1F300}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}\u{2B50}🔥💧🌿🌪️✨⛰️🛡️⚡️]+)/gu;
  const parts = text.split(emojiRegex);
  if (parts.length === 1) return text;
  
  return parts.map((part, i) => 
    emojiRegex.test(part) ? <span key={i} className="not-italic inline-block font-sans px-[1px] transform-none" style={{ fontStyle: 'normal', transform: 'none' }}>{part}</span> : part
  );
}
