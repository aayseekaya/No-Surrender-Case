import { useState } from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { Battery, Zap, Clock } from 'lucide-react';
import CardGrid from '@/components/CardGrid';
import EnergyDisplay from '@/components/EnergyDisplay';
import LevelFilter from '@/components/LevelFilter';
import { Card, EnergyInfo } from '@/types';
import { getCardData } from '@/lib/cardData';
import { useCards, useEnergy } from '@/hooks/useCards';
import { useOptimisticUpdate } from '@/hooks/useOptimisticUpdate';

export default function Home() {
  const { cards, isLoading: cardsLoading, mutate: mutateCards } = useCards();
  const { energy: currentEnergy, regenerationTime, isLoading: energyLoading, mutate: mutateEnergy } = useEnergy();
  const { updateCardProgress, updateCardBatchProgress, isUpdating } = useOptimisticUpdate();
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  
  const energy: EnergyInfo = {
    current: currentEnergy,
    max: 100,
    regenerationTime,
    regenerationRate: 1,
  };

  // Optimistic update handlers
  const handleCardProgress = async (cardId: string) => {
    try {
      // Optimistic update
      const card = cards.find(c => c.id === cardId);
      if (card) {
        const newProgress = Math.min(100, card.progress + 2);
        const isLevelUp = newProgress >= 100 && card.progress < 100;
        
        // Update cards optimistically
        mutateCards(
          {
            cards: cards.map(c => 
              c.id === cardId 
                ? { 
                    ...c, 
                    progress: isLevelUp ? 0 : newProgress,
                    level: isLevelUp ? Math.min(3, c.level + 1) : c.level,
                    image: isLevelUp ? `/images/${c.type}_${Math.min(3, c.level + 1)}.png` : c.image
                  }
                : c
            ),
            success: true
          },
          false // Don't revalidate immediately
        );
        
        // Update energy optimistically
        if (!isLevelUp) {
          mutateEnergy(
            {
              energy: Math.max(0, currentEnergy - 1),
              regenerationTime,
              success: true
            },
            false
          );
        }
      }
      
      // Make actual API call
      await updateCardProgress(cardId, 2, 1, 1, {
        onSuccess: () => {
          // Revalidate data
          mutateCards();
          mutateEnergy();
        },
        onError: () => {
          // Revert optimistic updates on error
          mutateCards();
          mutateEnergy();
        }
      });
    } catch (error) {
      console.error('Error updating card progress:', error);
      // Revert optimistic updates
      mutateCards();
      mutateEnergy();
    }
  };

  const handleCardLevelUp = async (cardId: string) => {
    try {
      // Optimistic update for level up
      const card = cards.find(c => c.id === cardId);
      if (card && card.progress >= 100) {
        mutateCards(
          {
            cards: cards.map(c => 
              c.id === cardId 
                ? { 
                    ...c, 
                    progress: 0,
                    level: Math.min(3, c.level + 1),
                    image: `/images/${c.type}_${Math.min(3, c.level + 1)}.png`
                  }
                : c
            ),
            success: true
          },
          false
        );
      }
      
      // Make actual API call
      await updateCardProgress(cardId, 0, 1, 0, {
        onSuccess: () => {
          mutateCards();
        },
        onError: () => {
          mutateCards();
        }
      });
    } catch (error) {
      console.error('Error leveling up card:', error);
      mutateCards();
    }
  };

  // Filter cards based on selected level
  const filteredCards = cards.filter(card => {
    if (selectedLevel === 'all') return true;
    if (selectedLevel === 'sv1') return card.level === 1;
    if (selectedLevel === 'sv2') return card.level === 2;
    if (selectedLevel === 'max') return card.level === 3;
    return true;
  });

  const loading = cardsLoading || energyLoading;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>No Surrender - Card Development</title>
        <meta name="description" content="Card development system with energy management" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gray-900 text-white">
        {/* Energy Display */}
        <EnergyDisplay 
          energy={energy} 
          onEnergyUpdate={() => mutateEnergy()}
        />

        {/* Level Filter */}
        <LevelFilter
          selectedLevel={selectedLevel}
          onLevelChange={setSelectedLevel}
        />

        {/* Cards Grid */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <CardGrid
            cards={filteredCards}
            onProgress={handleCardProgress}
            onLevelUp={handleCardLevelUp}
            currentEnergy={currentEnergy}
          />
        </main>
      </div>
    </>
  );
} 