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
      <div className="flex min-h-screen flex-col sm:flex-row bg-[#050510] relative">
        <div className="cinematic-overlay" />
        
        {/* Floating Particles */}
        <div className="fixed inset-0 pointer-events-none -z-30 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-1 w-1 bg-white rounded-full opacity-20"
              initial={{ 
                x: Math.random() * 2000, 
                y: Math.random() * 2000,
                scale: Math.random() * 0.5 + 0.5 
              }}
              animate={{ 
                y: [null, -1000],
                opacity: [0, 0.4, 0]
              }}
              transition={{ 
                duration: Math.random() * 10 + 10, 
                repeat: Infinity,
                ease: "linear",
                delay: Math.random() * 10
              }}
            />
          ))}
        </div>

        {hasPets && <Navbar rubles={progress.currency} />}
        <main className="flex-1 overflow-y-auto no-scrollbar pb-24 sm:pb-0">
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

