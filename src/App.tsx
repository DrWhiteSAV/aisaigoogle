/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Welcome } from './pages/Welcome';
import { Setup } from './pages/Setup';
import { Main } from './pages/Main';
import { Battle } from './pages/Battle';
import { Market } from './pages/Market';
import { Evolve } from './pages/Evolve';
import { Bestiary } from './pages/Bestiary';
import { Navbar } from './components/Navbar';
import { UserProgress, Pet } from './types';

const INITIAL_PROGRESS: UserProgress = {
  pets: [],
  activePetId: null,
  currency: 5000, // Initial 5000 Rubles
  inventory: {},
  bestiary: [],
};

const BackgroundDoodles = () => {
  const [doodles] = useState(() => Array.from({ length: 15 }).map(() => ({
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    rotate: Math.random() * 360,
    scale: 0.5 + Math.random() * 1.5,
    type: Math.floor(Math.random() * 3)
  })));

  return (
    <div className="fixed inset-0 pointer-events-none -z-20 overflow-hidden opacity-30">
      {doodles.map((d, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.1 }}
          className="absolute text-pen-blue/30"
          style={{ top: d.top, left: d.left, rotate: d.rotate, scale: d.scale }}
        >
          {d.type === 0 ? (
            /* Sparkle / Star */
            <svg width="60" height="60" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M50 10 L50 90 M10 50 L90 50 M25 25 L75 75 M75 25 L25 75" />
            </svg>
          ) : d.type === 1 ? (
            /* Swirl / Spiral */
            <svg width="80" height="80" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M50 50 C50 20 80 20 80 50 C80 80 20 80 20 50 C20 30 40 30 40 50" />
            </svg>
          ) : (
             /* Scribble / Hatching mark */
             <svg width="70" height="70" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
               <path d="M10 20 L30 10 M15 40 L45 25 M20 60 L60 40 M30 80 L80 50" />
             </svg>
          )}
        </motion.div>
      ))}
    </div>
  );
};

export default function App() {
  const [progress, setProgress] = useState<UserProgress>(() => {
    const saved = localStorage.getItem('aisai_progress');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure all required fields exist for backward compatibility
        return {
          ...INITIAL_PROGRESS,
          ...parsed,
          pets: parsed.pets || INITIAL_PROGRESS.pets,
          bestiary: parsed.bestiary || INITIAL_PROGRESS.bestiary,
          inventory: parsed.inventory || INITIAL_PROGRESS.inventory,
          currency: typeof parsed.currency === 'number' ? parsed.currency : INITIAL_PROGRESS.currency,
        };
      } catch (e) {
        return INITIAL_PROGRESS;
      }
    }
    return INITIAL_PROGRESS;
  });

  useEffect(() => {
    localStorage.setItem('aisai_progress', JSON.stringify(progress));
  }, [progress]);

  // Migration: If bestiary is empty but pets exist, populate it
  useEffect(() => {
    if (progress.pets.length > 0 && (progress.bestiary || []).length === 0) {
      setProgress(prev => {
        const uniqueSpecies = new Set();
        const newBestiary = [];
        prev.pets.forEach(p => {
          if (!uniqueSpecies.has(p.classification.species)) {
            uniqueSpecies.add(p.classification.species);
            newBestiary.push(p.classification);
          }
        });
        return { ...prev, bestiary: newBestiary };
      });
    }
  }, []);

  const hasPets = progress.pets.length > 0;

  const handleAddNewPet = (pet: Pet) => {
    setProgress(prev => {
      const currentBestiary = prev.bestiary || [];
      // Check if species already in bestiary
      const isNewSpecies = !currentBestiary.some(c => c.species === pet.classification.species);
      const newBestiary = isNewSpecies ? [...currentBestiary, pet.classification] : currentBestiary;
      
      return {
        ...prev,
        pets: [...prev.pets, pet],
        activePetId: prev.activePetId || pet.id,
        bestiary: newBestiary
      };
    });
  };

  return (
    <BrowserRouter>
      <div className="flex min-h-screen flex-col sm:flex-row relative selection:bg-sticker-blue selection:text-pen-blue">
        <BackgroundDoodles />
        {hasPets && <Navbar rubles={progress.currency} />}
        <main className="flex-1 overflow-y-auto no-scrollbar relative max-h-screen">
          <Routes>
            <Route path="/" element={<Navigate to={hasPets ? "/main" : "/start"} replace />} />
            <Route path="/start" element={<Welcome />} />
            <Route path="/setup" element={<Setup onComplete={handleAddNewPet} />} />
            <Route path="/main" element={hasPets ? <Main progress={progress} setProgress={setProgress} /> : <Navigate to="/start" />} />
            <Route path="/battle" element={hasPets ? <Battle progress={progress} setProgress={setProgress} /> : <Navigate to="/start" />} />
            <Route path="/market" element={hasPets ? <Market progress={progress} setProgress={setProgress} onBuy={handleAddNewPet} /> : <Navigate to="/start" />} />
            <Route path="/evolve" element={hasPets ? <Evolve progress={progress} setProgress={setProgress} /> : <Navigate to="/start" />} />
            <Route path="/bestiary" element={hasPets ? <Bestiary progress={progress} /> : <Navigate to="/start" />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

