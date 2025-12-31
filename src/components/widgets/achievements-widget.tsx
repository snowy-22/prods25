"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Achievement, 
  AwardedAchievement, 
  ACHIEVEMENTS,
  AchievementBlockchain,
  AchievementCategory 
} from '@/lib/achievement-system';
import { ContentItem } from '@/lib/initial-content';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface AchievementsWidgetProps {
  item: ContentItem;
  onUpdate?: (updates: Partial<ContentItem>) => void;
}

const RARITY_COLORS = {
  common: 'bg-gray-500',
  uncommon: 'bg-green-500',
  rare: 'bg-blue-500',
  epic: 'bg-purple-500',
  legendary: 'bg-orange-500'
};

const RARITY_LABELS = {
  common: 'Yaygın',
  uncommon: 'Yaygın Olmayan',
  rare: 'Nadir',
  epic: 'Epik',
  legendary: 'Efsanevi'
};

export default function AchievementsWidget({ item, onUpdate }: AchievementsWidgetProps) {
  const [userAchievements, setUserAchievements] = useState<AwardedAchievement[]>([]);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [selectedAward, setSelectedAward] = useState<AwardedAchievement | null>(null);
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [categoryFilter, setCategoryFilter] = useState<AchievementCategory | 'all'>('all');

  const blockchain = new AchievementBlockchain();

  // Demo: Award some achievements
  useEffect(() => {
    const demoAwards: AwardedAchievement[] = [
      blockchain.awardAchievement('ach-first-steps', 'user-123', 'system'),
      blockchain.awardAchievement('ach-layout-master', 'user-123', 'system'),
      blockchain.awardAchievement('ach-creator', 'user-123', 'user'),
      blockchain.awardAchievement('ach-smart-home-master', 'user-123', 'admin')
    ];
    setUserAchievements(demoAwards);
  }, []);

  const totalPoints = userAchievements.reduce((sum, award) => {
    const ach = ACHIEVEMENTS.find(a => a.id === award.achievementId);
    return sum + (ach?.points || 0);
  }, 0);

  const unlockedAchievements = new Set(userAchievements.map(a => a.achievementId));

  const filteredAchievements = ACHIEVEMENTS.filter((ach) => {
    const isUnlocked = unlockedAchievements.has(ach.id);
    const matchesLockFilter = 
      filter === 'all' || 
      (filter === 'unlocked' && isUnlocked) ||
      (filter === 'locked' && !isUnlocked);
    
    const matchesCategory = categoryFilter === 'all' || ach.category === categoryFilter;

    return matchesLockFilter && matchesCategory && !ach.isSecret;
  });

  const rarityCount = {
    common: 0,
    uncommon: 0,
    rare: 0,
    epic: 0,
    legendary: 0
  };

  userAchievements.forEach(award => {
    const ach = ACHIEVEMENTS.find(a => a.id === award.achievementId);
    if (ach) rarityCount[ach.rarity]++;
  });

  return (
    <Card className="w-full h-full overflow-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🏆 Başarılar ve Ödüller
          <Badge className="ml-auto" variant="secondary">
            {totalPoints} puan
          </Badge>
        </CardTitle>
        <CardDescription>
          {userAchievements.length} / {ACHIEVEMENTS.filter(a => !a.isSecret).length} başarı kilidi açıldı
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats Overview */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold">{userAchievements.length}</div>
            <div className="text-xs text-muted-foreground">Açılan</div>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold">{totalPoints}</div>
            <div className="text-xs text-muted-foreground">Toplam Puan</div>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold">
              {Math.round((userAchievements.length / ACHIEVEMENTS.length) * 100)}%
            </div>
            <div className="text-xs text-muted-foreground">Tamamlama</div>
          </div>
        </div>

        {/* Rarity Distribution */}
        <div className="flex gap-1 h-6 rounded-lg overflow-hidden">
          {Object.entries(rarityCount).map(([rarity, count]) => {
            const total = userAchievements.length || 1;
            const percentage = (count / total) * 100;
            return percentage > 0 ? (
              <div
                key={rarity}
                className={`${RARITY_COLORS[rarity as keyof typeof RARITY_COLORS]} transition-all`}
                style={{ width: `${percentage}%` }}
                title={`${RARITY_LABELS[rarity as keyof typeof RARITY_LABELS]}: ${count}`}
              />
            ) : null;
          })}
        </div>

        {/* Filters */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
            >
              Tümü
            </Button>
            <Button 
              size="sm" 
              variant={filter === 'unlocked' ? 'default' : 'outline'}
              onClick={() => setFilter('unlocked')}
            >
              Açılanlar
            </Button>
            <Button 
              size="sm" 
              variant={filter === 'locked' ? 'default' : 'outline'}
              onClick={() => setFilter('locked')}
            >
              Kilitli
            </Button>
          </div>

          <select 
            className="w-full p-2 rounded border bg-background text-sm"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as any)}
          >
            <option value="all">Tüm Kategoriler</option>
            <option value="first-steps">İlk Adımlar</option>
            <option value="content-creation">İçerik Yaratma</option>
            <option value="organization">Organizasyon</option>
            <option value="customization">Özelleştirme</option>
            <option value="api-mastery">API Ustalığı</option>
            <option value="productivity">Verimlilik</option>
            <option value="social">Sosyal</option>
            <option value="ecommerce">E-Ticaret</option>
            <option value="training">Eğitim</option>
            <option value="special">Özel</option>
          </select>
        </div>

        {/* Achievement Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[500px] overflow-auto">
          {filteredAchievements.map((achievement) => {
            const isUnlocked = unlockedAchievements.has(achievement.id);
            const award = userAchievements.find(a => a.achievementId === achievement.id);

            return (
              <motion.button
                key={achievement.id}
                onClick={() => {
                  setSelectedAchievement(achievement);
                  setSelectedAward(award || null);
                }}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  isUnlocked 
                    ? `border-${achievement.rarity} hover:scale-105 cursor-pointer` 
                    : 'border-muted opacity-50 grayscale'
                }`}
                whileHover={isUnlocked ? { scale: 1.05 } : {}}
                whileTap={isUnlocked ? { scale: 0.95 } : {}}
              >
                <div className="text-3xl mb-2">{achievement.icon}</div>
                <div className="font-semibold text-sm line-clamp-1">
                  {achievement.titleTr}
                </div>
                <div className="flex items-center gap-1 mt-2">
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${RARITY_COLORS[achievement.rarity]} text-white`}
                  >
                    {RARITY_LABELS[achievement.rarity]}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {achievement.points}p
                  </Badge>
                </div>
                
                {isUnlocked && award && (
                  <div className="mt-2 flex items-center gap-1">
                    <Badge variant="outline" className="text-xs bg-green-50 dark:bg-green-950">
                      ✓ Açıldı
                    </Badge>
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Achievement Detail Modal */}
        {selectedAchievement && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-background rounded-lg p-6 max-w-md w-full space-y-4 border-2"
              style={{ borderColor: RARITY_COLORS[selectedAchievement.rarity] }}
            >
              <div className="text-center">
                <div className="text-6xl mb-3">{selectedAchievement.icon}</div>
                <h3 className="text-xl font-bold">{selectedAchievement.titleTr}</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  {selectedAchievement.descriptionTr}
                </p>
              </div>

              <div className="flex items-center justify-center gap-2">
                <Badge className={`${RARITY_COLORS[selectedAchievement.rarity]} text-white`}>
                  {RARITY_LABELS[selectedAchievement.rarity]}
                </Badge>
                <Badge variant="outline">
                  {selectedAchievement.points} puan
                </Badge>
                <Badge variant="secondary">
                  {selectedAchievement.category}
                </Badge>
              </div>

              {selectedAward && (
                <div className="bg-muted rounded-lg p-4 space-y-2 text-sm">
                  <h4 className="font-semibold mb-2">🔗 Blockchain Doğrulama</h4>
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Açılış Tarihi:</span>
                    <span className="font-mono text-xs">
                      {new Date(selectedAward.unlockedAt).toLocaleDateString('tr-TR')}
                    </span>
                  </div>

                  <div className="flex justify-between items-start">
                    <span className="text-muted-foreground">Hash:</span>
                    <span className="font-mono text-xs truncate max-w-[200px]">
                      {selectedAward.blockchainHash}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Doğrulama:</span>
                    <Badge variant="outline" className="bg-green-100 dark:bg-green-900">
                      ✓ {selectedAward.verificationChain.length} node
                    </Badge>
                  </div>

                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full mt-2"
                    onClick={() => {
                      const nft = blockchain.exportAsNFT(selectedAward);
                      console.log('NFT Metadata:', nft);
                      alert('NFT metadatası konsola yazdırıldı!');
                    }}
                  >
                    📄 NFT Olarak Dışa Aktar
                  </Button>
                </div>
              )}

              {!selectedAward && (
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    🔒 Bu başarı henüz açılmadı
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Koşul: {selectedAchievement.unlockCriteria.requirement}
                  </p>
                </div>
              )}

              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setSelectedAchievement(null)}
              >
                Kapat
              </Button>
            </motion.div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-2 text-xs">
          <Button variant="outline" size="sm" className="flex-1">
            📤 Profilde Sergile
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            📊 İstatistikler
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
