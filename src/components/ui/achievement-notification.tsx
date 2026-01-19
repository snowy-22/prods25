'use client';

import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { 
  X, Trophy, Star, Folder, Sparkles, Gift, Award, 
  Target, Zap, Crown, Heart, Flame, Check 
} from 'lucide-react';

// Achievement interface - Görselleştirme özellikleriyle zenginleştirildi
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: 'trophy' | 'star' | 'folder' | 'sparkles' | 'gift' | 'award' | 'target' | 'zap' | 'crown' | 'heart' | 'flame' | 'check';
  timestamp?: number;
  // Görsel özellikleri
  image?: string; // Özel görsel URL (gif, png, svg, 3d modeller)
  imageType?: '2d' | '3d' | 'gif'; // Görsel tipi
  color?: string; // Ana renk
  gradient?: [string, string]; // Gradyan renkleri
  rarity?: 'common' | 'rare' | 'epic' | 'legendary'; // Nadirlik seviyesi (renk ve glow efektlerini belirler)
}

// Context tanımla
interface AchievementContextType {
  achievements: Achievement[];
  addAchievement: (achievement: Achievement) => void;
  removeAchievement: (id: string) => void;
}

const AchievementContext = createContext<AchievementContextType | undefined>(undefined);

// Provider Component
export function AchievementProvider({ children }: { children: React.ReactNode }) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  const addAchievement = useCallback((achievement: Achievement) => {
    setAchievements((prev) => [...prev, achievement]);
  }, []);

  const removeAchievement = useCallback((id: string) => {
    setAchievements((prev) => prev.filter((a) => a.id !== id));
  }, []);

  return (
    <AchievementContext.Provider value={{ achievements, addAchievement, removeAchievement }}>
      {children}
    </AchievementContext.Provider>
  );
}

// Hook - Provider içinde kullanılmalı
export function useAchievements() {
  const context = useContext(AchievementContext);
  if (!context) {
    throw new Error('useAchievements must be used within AchievementProvider');
  }
  return context;
}

// Notification Component - Görsel olarak zenginleştirildi
export function AchievementNotification() {
  const { achievements, removeAchievement } = useAchievements();
  const [visibleIndex, setVisibleIndex] = useState(0);

  useEffect(() => {
    if (achievements.length === 0) return;
    
    // Auto-dismiss after 5 seconds
    const timer = setTimeout(() => {
      handleClose();
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [visibleIndex, achievements]);

  const handleClose = () => {
    if (achievements.length === 0) return;
    
    const currentId = achievements[visibleIndex]?.id;
    if (currentId) {
      removeAchievement(currentId);
      
      // Move to next achievement if available
      if (visibleIndex < achievements.length - 1) {
        setTimeout(() => setVisibleIndex(visibleIndex + 1), 300);
      } else {
        setVisibleIndex(0);
      }
    }
  };

  // Nadirlik bazlı renkler ve efektler
  const getRarityColors = (rarity?: Achievement['rarity']) => {
    switch (rarity) {
      case 'legendary':
        return {
          bg: 'from-amber-500/20 via-yellow-500/20 to-orange-500/20',
          border: 'border-amber-500/40',
          glow: 'shadow-lg shadow-amber-500/30',
          shine: 'from-amber-400 to-yellow-400',
          text: 'text-amber-200',
        };
      case 'epic':
        return {
          bg: 'from-purple-500/20 via-pink-500/20 to-fuchsia-500/20',
          border: 'border-purple-500/40',
          glow: 'shadow-lg shadow-purple-500/30',
          shine: 'from-purple-400 to-pink-400',
          text: 'text-purple-200',
        };
      case 'rare':
        return {
          bg: 'from-blue-500/20 via-cyan-500/20 to-sky-500/20',
          border: 'border-blue-500/40',
          glow: 'shadow-lg shadow-blue-500/30',
          shine: 'from-blue-400 to-cyan-400',
          text: 'text-blue-200',
        };
      default: // common
        return {
          bg: 'from-slate-500/20 via-gray-500/20 to-zinc-500/20',
          border: 'border-slate-500/40',
          glow: 'shadow-md shadow-slate-500/20',
          shine: 'from-slate-400 to-gray-400',
          text: 'text-slate-200',
        };
    }
  };

  // İkon render - Genişletilmiş ikon seti
  const renderIcon = (icon: Achievement['icon']) => {
    const iconProps = { className: 'w-8 h-8' };
    switch (icon) {
      case 'trophy':
        return <Trophy {...iconProps} />;
      case 'star':
        return <Star {...iconProps} />;
      case 'folder':
        return <Folder {...iconProps} />;
      case 'sparkles':
        return <Sparkles {...iconProps} />;
      case 'gift':
        return <Gift {...iconProps} />;
      case 'award':
        return <Award {...iconProps} />;
      case 'target':
        return <Target {...iconProps} />;
      case 'zap':
        return <Zap {...iconProps} />;
      case 'crown':
        return <Crown {...iconProps} />;
      case 'heart':
        return <Heart {...iconProps} />;
      case 'flame':
        return <Flame {...iconProps} />;
      case 'check':
        return <Check {...iconProps} />;
      default:
        return <Trophy {...iconProps} />;
    }
  };

  if (achievements.length === 0 || visibleIndex >= achievements.length) return null;

  const currentAchievement = achievements[visibleIndex];
  const colors = getRarityColors(currentAchievement.rarity);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentAchievement.id}
        initial={{ opacity: 0, y: -50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -50, scale: 0.9 }}
        transition={{ duration: 0.4, type: 'spring', bounce: 0.3 }}
        className="fixed top-4 right-4 z-[9999] max-w-md w-full"
      >
        <Card className={`relative overflow-hidden bg-gradient-to-br ${colors.bg} backdrop-blur-xl border-2 ${colors.border} ${colors.glow}`}>
          {/* Animated Shine Effect */}
          <motion.div 
            className={`absolute inset-0 bg-gradient-to-r ${colors.shine} opacity-20`}
            animate={{ 
              x: ['-100%', '100%'],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
          
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-black/30 hover:bg-black/50 transition-colors z-10 backdrop-blur-sm"
          >
            <X className="w-4 h-4 text-white" />
          </button>

          <div className="p-6 flex items-start gap-4">
            {/* Görsel veya İkon */}
            {currentAchievement.image ? (
              <div className="flex-shrink-0 w-24 h-24 rounded-2xl overflow-hidden bg-black/20 border-2 border-white/20 relative">
                <img
                  src={currentAchievement.image}
                  alt={currentAchievement.title}
                  className="w-full h-full object-cover"
                />
                {/* 3D veya GIF görselleri için ekstra efekt */}
                {(currentAchievement.imageType === '3d' || currentAchievement.imageType === 'gif') && (
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </div>
            ) : (
              <motion.div 
                className={`flex-shrink-0 w-20 h-20 rounded-2xl bg-gradient-to-br ${colors.shine} flex items-center justify-center text-white shadow-lg`}
                animate={{ 
                  scale: [1, 1.05, 1],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                {renderIcon(currentAchievement.icon)}
              </motion.div>
            )}

            {/* Content */}
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-bold text-white truncate">
                  {currentAchievement.title}
                </h3>
                {currentAchievement.rarity && currentAchievement.rarity !== 'common' && (
                  <motion.span 
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      currentAchievement.rarity === 'legendary' ? 'bg-amber-500/30 text-amber-200' :
                      currentAchievement.rarity === 'epic' ? 'bg-purple-500/30 text-purple-200' :
                      'bg-blue-500/30 text-blue-200'
                    }`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                  >
                    {currentAchievement.rarity}
                  </motion.span>
                )}
              </div>
              <p className="text-sm text-white/90 leading-relaxed">
                {currentAchievement.description}
              </p>
            </div>
          </div>

          {/* Progress Indicator - Çoklu başarım için */}
          {achievements.length > 1 && (
            <div className="px-6 pb-5">
              <div className="flex gap-2">
                {achievements.map((_, index) => (
                  <motion.div
                    key={index}
                    className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                      index === visibleIndex
                        ? 'bg-white shadow-sm'
                        : index < visibleIndex
                        ? 'bg-white/60'
                        : 'bg-white/20'
                    }`}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: index * 0.1 }}
                  />
                ))}
              </div>
              <p className="text-xs text-white/60 text-center mt-2">
                {visibleIndex + 1} / {achievements.length}
              </p>
            </div>
          )}
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
