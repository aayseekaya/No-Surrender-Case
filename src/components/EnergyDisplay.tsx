import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Battery } from 'lucide-react';
import { EnergyInfo } from '@/types';

interface EnergyDisplayProps {
  energy: EnergyInfo;
  onEnergyUpdate?: (newEnergy: EnergyInfo) => void;
}

export default function EnergyDisplay({ energy, onEnergyUpdate }: EnergyDisplayProps) {
  const [timeString, setTimeString] = useState('');
  const [currentRegenerationTime, setCurrentRegenerationTime] = useState(energy.regenerationTime);

  // Fetch new energy data when timer reaches 0
  const fetchNewEnergyData = async () => {
    try {
      const response = await fetch('/api/energy', {
        headers: {
          'x-user-id': 'demo-user',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const newEnergy: EnergyInfo = {
          current: data.energy,
          max: 100,
          regenerationTime: data.regenerationTime,
          regenerationRate: data.regenerationRate,
        };
        
        // Update parent component
        if (onEnergyUpdate) {
          onEnergyUpdate(newEnergy);
        }
      }
    } catch (error) {
      console.error('Energy fetch error:', error);
    }
  };

  // Update timer every second
  useEffect(() => {
    const updateTimer = () => {
      setCurrentRegenerationTime(prev => {
        const newTime = Math.max(0, prev - 1);
        const minutes = Math.floor(newTime / 60);
        const seconds = Math.floor(newTime % 60);
        setTimeString(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        
        // If timer reaches 0, fetch new energy data
        if (newTime === 0) {
          fetchNewEnergyData();
        }
        
        return newTime;
      });
    };

    // Initial update - only set if not already set or if energy changed significantly
    if (currentRegenerationTime === 0 || Math.abs(currentRegenerationTime - energy.regenerationTime) > 5) {
      const minutes = Math.floor(energy.regenerationTime / 60);
      const seconds = Math.floor(energy.regenerationTime % 60);
      setTimeString(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      setCurrentRegenerationTime(energy.regenerationTime);
    }

    // Update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [energy.regenerationTime, onEnergyUpdate, currentRegenerationTime]);

  const energyPercentage = (energy.current / energy.max) * 100;
  const energyColor = energyPercentage > 50 ? 'bg-green-500' : 
                     energyPercentage > 20 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="bg-gray-800 border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <img 
                src="/images/energy.png" 
                alt="Energy" 
                className="h-6 w-6"
                onError={(e) => {
                  // Fallback to Battery icon if image fails to load
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <Battery className="h-6 w-6 text-pink-500 hidden" />
            </div>
            <span className="text-sm font-medium">Enerji</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">
              %{energy.regenerationRate} Yenilenmesine Kalan: {timeString}
            </span>
          </div>
        </div>

        <div className="mt-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex-1 mr-4">
              <div className="w-full bg-gray-700 rounded-full h-3">
                <motion.div
                  className={`h-3 rounded-full ${energyColor}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${energyPercentage}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
            </div>
            <span className="text-2xl font-bold text-pink-500">
              {energy.current}/{energy.max}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
} 