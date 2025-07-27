import { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Card as CardType } from '@/types';
import { getCardDescription } from '@/lib/cardData';

interface CardProps {
  card: CardType;
  onProgress: (cardId: string) => void;
  onLevelUp: (cardId: string) => void;
  currentEnergy: number;
}

export default function Card({ card, onProgress, onLevelUp, currentEnergy }: CardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isAutoClicking, setIsAutoClicking] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const autoClickInterval = useRef<NodeJS.Timeout | null>(null);
  const lastClickTime = useRef<number>(0);

  const handleAction = async (clicks: number = 1) => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      if (card.progress >= 100) {
        await onLevelUp(card.id);
      } else {
        // Use batch API for multiple clicks
        if (clicks > 1) {
          await fetch('/api/batch-progress', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-user-id': 'demo-user',
            },
            body: JSON.stringify({ cardId: card.id, clicks }),
          }).then(res => res.json()).then(data => {
            if (data.success) {
              // Update card progress
              onProgress(card.id);
            }
          });
        } else {
          await onProgress(card.id);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const startAutoClick = useCallback(() => {
    const hasEnoughEnergy = currentEnergy >= 1;
    const isReadyForLevelUp = card.progress >= 100;
    const isMaxLevel = card.level >= 3;
    const isDisabled = isLoading || (!hasEnoughEnergy && !isReadyForLevelUp) || isMaxLevel;
    
    if (isAutoClicking || currentEnergy < 1 || isDisabled) return;

    setIsAutoClicking(true);
    setClickCount(0);

    // Use interval for continuous clicking
    autoClickInterval.current = setInterval(() => {
      if (currentEnergy >= 1 && card.progress < 100 && !isLoading) {
        setClickCount(prev => prev + 1);
        handleAction(1);
      } else {
        stopAutoClick();
      }
    }, 100); // 100ms interval
  }, [isAutoClicking, currentEnergy, card.progress, card.id, isLoading, card.level]);

  const stopAutoClick = useCallback(() => {
    setIsAutoClicking(false);
    if (autoClickInterval.current) {
      clearInterval(autoClickInterval.current);
      autoClickInterval.current = null;
    }
  }, []);

  const handleMouseDown = () => {
    if (card.progress >= 100 || currentEnergy < 1 || isDisabled) return;
    startAutoClick();
  };

  const handleMouseUp = () => {
    stopAutoClick();
  };

  const handleMouseLeave = () => {
    stopAutoClick();
  };

  const handleQuickProgress = async () => {
    if (isLoading || card.progress >= 100 || currentEnergy < 1) return;

    // Calculate how many clicks needed to reach 100%
    const clicksNeeded = Math.ceil((100 - card.progress) / 2);
    const maxClicks = Math.min(clicksNeeded, currentEnergy, 10); // Limit by current energy and batch limit

    if (maxClicks > 0) {
      await handleAction(maxClicks);
    }
  };

  const isReadyForLevelUp = card.progress >= 100;
  const hasEnoughEnergy = currentEnergy >= 1;
  const isMaxLevel = card.level >= 3;
  const isDisabled = isLoading || (!hasEnoughEnergy && !isReadyForLevelUp) || isMaxLevel;

  const buttonText = isMaxLevel
    ? 'Maksimum Seviye'
    : isReadyForLevelUp
    ? 'Yükselt'
    : isAutoClicking
    ? `Otomatik (${clickCount})`
    : '-1 Geliştir';

  const buttonColor = isMaxLevel
    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
    : isReadyForLevelUp
    ? 'bg-pink-600 hover:bg-pink-700 text-white'
    : hasEnoughEnergy
    ? 'bg-orange-500 hover:bg-orange-600 text-white'
    : 'bg-gray-600 text-gray-400 cursor-not-allowed';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-gray-800 rounded-lg p-3 sm:p-4 border border-gray-700 hover:border-gray-600 transition-colors"
    >
      {/* Card Image */}
      <div className="relative mb-3 sm:mb-4">
        <img
          src={card.image || getCardImage(card.type, card.level)}
          alt={card.name}
          className="w-full h-32 sm:h-48 object-cover rounded-lg"
        />

        {/* Level Badge */}
        <div className="absolute top-1 sm:top-2 right-1 sm:right-2 bg-black bg-opacity-75 text-white px-1 sm:px-2 py-0.5 sm:py-1 rounded text-xs sm:text-sm font-medium">
          Seviye {card.level}
        </div>
      </div>

      {/* Card Info */}
      <div className="space-y-1.5 sm:space-y-2">
        <h3 className="text-sm sm:text-lg font-semibold text-white">{card.name}</h3>
        <p className="text-gray-400 text-xs sm:text-sm">{getCardDescription(card.type as any, card.level)}</p>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs sm:text-sm">
            <span className="text-gray-400">İlerleme</span>
            <span className="text-pink-500 font-medium">%{card.progress}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-1.5 sm:h-2">
            <motion.div
              className="bg-pink-500 h-1.5 sm:h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${card.progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-1.5 sm:space-y-2">
          {/* Main Action Button */}
          <motion.button
            onClick={() => handleAction(1)}
            onMouseDown={!isDisabled ? handleMouseDown : undefined}
            onMouseUp={!isDisabled ? handleMouseUp : undefined}
            onMouseLeave={!isDisabled ? handleMouseLeave : undefined}
            disabled={isDisabled}
            className={`w-full py-1.5 sm:py-2 px-2 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center justify-center space-x-1 sm:space-x-2 ${
              isDisabled ? buttonColor : buttonColor
            }`}
            whileHover={!isDisabled ? { scale: 1.02 } : {}}
            whileTap={!isDisabled ? { scale: 0.98 } : {}}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div data-testid="loading-spinner" className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white"></div>
              </div>
            ) : (
              <>
                {/* Energy Icon for development buttons */}
                {!isReadyForLevelUp && !isMaxLevel && (
                  <div className="relative">
                    <img 
                      src="/images/energy.png" 
                      alt="Energy" 
                      className="h-3 w-3 sm:h-4 sm:w-4"
                      onError={(e) => {
                        // Fallback to text if image fails to load
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <span>{buttonText}</span>
              </>
            )}
          </motion.button>

          {/* Quick Progress Button (only show if not ready for level up and has enough energy) */}
          {!isReadyForLevelUp && !isMaxLevel && hasEnoughEnergy && currentEnergy >= 10 && (
            <motion.button
              onClick={handleQuickProgress}
              disabled={isLoading}
              className="w-full py-1 px-2 sm:px-3 rounded-lg text-xs sm:text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center justify-center space-x-1 sm:space-x-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="relative">
                <img 
                  src="/images/energy.png" 
                  alt="Energy" 
                  className="h-2.5 w-2.5 sm:h-3 sm:w-3"
                  onError={(e) => {
                    // Fallback to text if image fails to load
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
              <span>Hızlı Geliştir</span>
            </motion.button>
          )}
        </div>

        {/* Energy Warning */}
        {!hasEnoughEnergy && !isReadyForLevelUp && !isMaxLevel && (
          <p className="text-red-400 text-xs text-center">
            Yetersiz enerji
          </p>
        )}

        {/* Auto-click Instructions */}
        {!isReadyForLevelUp && !isMaxLevel && hasEnoughEnergy && currentEnergy >= 1 && (
          <p className="text-gray-500 text-xs text-center">
            Basılı tut: Otomatik geliştir
          </p>
        )}
      </div>
    </motion.div>
  );
}

// Helper functions
function getCardImage(type: string, level: number): string {
  return `/images/${type}_${level}.png`;
} 