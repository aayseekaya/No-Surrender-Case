import { motion } from 'framer-motion';

interface LevelFilterProps {
  selectedLevel: string;
  onLevelChange: (level: string) => void;
}

export default function LevelFilter({ selectedLevel, onLevelChange }: LevelFilterProps) {
  const levels = [
    { id: 'all', label: 'Tüm Seviyeler' },
    { id: 'sv1', label: 'Sv1' },
    { id: 'sv2', label: 'Sv2' },
    { id: 'max', label: 'Max Sv' },
  ];

  return (
    <div className="bg-gray-800 border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex space-x-1">
          {levels.map((level) => (
            <motion.button
              key={level.id}
              onClick={() => onLevelChange(level.id)}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedLevel === level.id
                  ? 'bg-pink-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {level.label}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
} 