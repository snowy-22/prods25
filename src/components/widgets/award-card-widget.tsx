'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ContentItem } from '@/lib/initial-content';
import { 
  ACHIEVEMENTS, 
  AwardedAchievement, 
  AchievementBlockchain 
} from '@/lib/achievement-system';
import { motion } from 'framer-motion';
import { Award, Trophy, Medal, Star, Lock, Share2, Download, Eye, EyeOff } from 'lucide-react';

interface AwardCardWidgetProps {
  item: ContentItem;
  onUpdate?: (updates: Partial<ContentItem>) => void;
}

const RARITY_COLORS: Record<string, string> = {
  common: 'bg-gray-500',
  uncommon: 'bg-green-600',
  rare: 'bg-blue-600',
  epic: 'bg-purple-600',
  legendary: 'bg-orange-600'
};

const RARITY_LABELS: Record<string, string> = {
  common: 'Yaygın',
  uncommon: 'Nadir',
  rare: 'Çok Nadir',
  epic: 'Epik',
  legendary: 'Efsanevi'
};

/**
 * Profil Ödül Kartı Widget
 * 
 * Kullanıcının kazandığı başarıları profilinde kompakt bir şekilde sergiler.
 * İki görüntüleme modu sunar:
 * - Top 3: En değerli 3 başarı (rarity ve points'e göre)
 * - Tam Koleksiyon: Tüm kazanılmış başarılar (sayfalama ile)
 * 
 * Özellikler:
 * - Blockchain doğrulama rozeti
 * - NFT export butonu
 * - Görünürlük kontrolü (public/private)
 * - Başarı detay modalı
 * - Paylaşım butonu
 */
export default function AwardCardWidget({ item, onUpdate }: AwardCardWidgetProps) {
  const [awards, setAwards] = useState<AwardedAchievement[]>([]);
  const [displayMode, setDisplayMode] = useState<'top3' | 'full'>('top3');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const blockchain = new AchievementBlockchain();

  // Demo: Kullanıcı başarılarını yükle (gerçek uygulamada API'den gelir)
  useEffect(() => {
    const demoAwards: AwardedAchievement[] = [
      blockchain.awardAchievement('ach-first-steps', 'user123', 'system'),
      blockchain.awardAchievement('ach-layout-master', 'user123', 'system'),
      blockchain.awardAchievement('ach-smart-home-master', 'user123', 'admin'),
      blockchain.awardAchievement('ach-early-adopter', 'user123', 'system'),
      blockchain.awardAchievement('ach-completionist', 'user123', 'admin'),
      blockchain.awardAchievement('ach-master', 'user123', 'system'),
    ];
    setAwards(demoAwards);
  }, []);

  // Top 3 başarıyı hesapla (rarity ve points'e göre)
  const getTop3Awards = () => {
    const rarityValue = { legendary: 5, epic: 4, rare: 3, uncommon: 2, common: 1 };
    return [...awards]
      .filter(a => a.isPubliclyDisplayed !== false)
      .sort((a, b) => {
        const achA = ACHIEVEMENTS.find(ach => ach.id === a.achievementId);
        const achB = ACHIEVEMENTS.find(ach => ach.id === b.achievementId);
        if (!achA || !achB) return 0;
        
        // Önce rarity'ye göre
        const rarityDiff = (rarityValue[achB.rarity] || 0) - (rarityValue[achA.rarity] || 0);
        if (rarityDiff !== 0) return rarityDiff;
        
        // Sonra points'e göre
        return achB.points - achA.points;
      })
      .slice(0, 3);
  };

  // Sayfalanmış başarılar
  const getPaginatedAwards = () => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return awards
      .filter(a => a.isPubliclyDisplayed !== false)
      .slice(start, end);
  };

  const totalPages = Math.ceil(awards.filter(a => a.isPubliclyDisplayed !== false).length / itemsPerPage);

  // Görünürlük değiştir
  const toggleVisibility = (awardId: string) => {
    setAwards(prev => prev.map(a => 
      a.id === awardId ? { ...a, isPubliclyDisplayed: !(a.isPubliclyDisplayed !== false) } : a
    ));
  };

  // NFT export
  const exportAsNFT = (award: AwardedAchievement) => {
    const nft = blockchain.exportAsNFT(award);
    console.log('NFT Exported:', nft);
    
    // Download as JSON
    const blob = new Blob([JSON.stringify(nft, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `award-${award.id}-nft.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const AwardCard = ({ award }: { award: AwardedAchievement }) => {
    const achievement = ACHIEVEMENTS.find(a => a.id === award.achievementId);
    if (!achievement) return null;

    return (
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
        className="relative"
      >
        <Card className={`border-2 ${RARITY_COLORS[achievement.rarity]} border-opacity-50 hover:shadow-lg transition-shadow`}>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                {achievement.rarity === 'legendary' ? <Trophy className="w-5 h-5 text-orange-500" /> :
                 achievement.rarity === 'epic' ? <Medal className="w-5 h-5 text-purple-500" /> :
                 achievement.rarity === 'rare' ? <Award className="w-5 h-5 text-blue-500" /> :
                 <Star className="w-5 h-5 text-gray-500" />}
                <div>
                  <CardTitle className="text-sm">{achievement.title}</CardTitle>
                  <CardDescription className="text-xs">{achievement.description}</CardDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleVisibility(award.id)}
              >
                {award.isPubliclyDisplayed !== false ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="flex flex-wrap gap-1">
              <Badge variant="secondary" className={`${RARITY_COLORS[achievement.rarity]} text-white text-xs`}>
                {RARITY_LABELS[achievement.rarity]}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {achievement.points} puan
              </Badge>
              {award.verificationChain.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  ✓ {award.verificationChain.length} doğrulama
                </Badge>
              )}
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              <div className="truncate" title={award.blockchainHash}>
                🔗 {award.blockchainHash.slice(0, 16)}...
              </div>
              <div className="text-xs mt-1">
                {new Date(award.awardedAt).toLocaleDateString('tr-TR')}
              </div>
            </div>
          </CardContent>
          <CardFooter className="pt-0 pb-2 flex gap-1">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 text-xs h-7"
              onClick={() => exportAsNFT(award)}
            >
              <Download className="w-3 h-3 mr-1" /> NFT
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 text-xs h-7"
            >
              <Share2 className="w-3 h-3 mr-1" /> Paylaş
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    );
  };

  const totalPoints = awards.reduce((sum, award) => {
    const ach = ACHIEVEMENTS.find(a => a.id === award.achievementId);
    return sum + (ach?.points || 0);
  }, 0);

  const publicAwardsCount = awards.filter(a => a.isPubliclyDisplayed !== false).length;

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              {item.title || 'Ödül Vitrini'}
            </CardTitle>
            <CardDescription>
              {publicAwardsCount} başarı sergileniyor • {totalPoints} toplam puan
            </CardDescription>
          </div>
          <Tabs value={displayMode} onValueChange={(v) => setDisplayMode(v as 'top3' | 'full')}>
            <TabsList className="grid w-[200px] grid-cols-2">
              <TabsTrigger value="top3">Top 3</TabsTrigger>
              <TabsTrigger value="full">Tümü</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-auto">
        {displayMode === 'top3' ? (
          <div className="space-y-3">
            {getTop3Awards().length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Lock className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p>Henüz sergilenen başarı yok</p>
              </div>
            ) : (
              getTop3Awards().map((award, idx) => (
                <div key={award.id}>
                  <div className="text-xs text-muted-foreground mb-1 font-semibold">
                    #{idx + 1}
                  </div>
                  <AwardCard award={award} />
                </div>
              ))
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {getPaginatedAwards().map(award => (
                <AwardCard key={award.id} award={award} />
              ))}
            </div>
            
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Önceki
                </Button>
                <span className="text-sm text-muted-foreground">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Sonraki
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>

      <CardFooter className="flex-col gap-2">
        <div className="w-full flex gap-2">
          <Button variant="outline" className="flex-1" size="sm">
            <Share2 className="w-4 h-4 mr-2" />
            Profili Paylaş
          </Button>
          <Button variant="outline" className="flex-1" size="sm">
            Ayarlar
          </Button>
        </div>
        <div className="text-xs text-muted-foreground text-center w-full">
          Blockchain doğrulamalı başarı sistemi
        </div>
      </CardFooter>
    </Card>
  );
}
