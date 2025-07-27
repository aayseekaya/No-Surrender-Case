import { motion } from 'framer-motion';
import Card from './Card';
import { Card as CardType } from '@/types';

interface CardGridProps {
  cards: CardType[];
  onProgress: (cardId: string) => void;
  onLevelUp: (cardId: string) => void;
  currentEnergy: number;
}

export default function CardGrid({ cards, onProgress, onLevelUp, currentEnergy }: CardGridProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
    >
      {cards.map((card) => (
        <Card
          key={card.id}
          card={card}
          onProgress={onProgress}
          onLevelUp={onLevelUp}
          currentEnergy={currentEnergy}
        />
      ))}
    </motion.div>
  );
} 