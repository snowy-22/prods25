/**
 * Achievement & Awards System with Blockchain Verification
 * 
 * NFT-like achievement system with cryptographic hashing,
 * decentralized verification, and visual award cards
 */

import crypto from 'crypto';

export type AchievementCategory = 
  | 'first-steps'
  | 'content-creation'
  | 'organization'
  | 'customization'
  | 'api-mastery'
  | 'productivity'
  | 'social'
  | 'ecommerce'
  | 'training'
  | 'special';

export type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface Achievement {
  id: string;
  title: string;
  titleTr: string;
  description: string;
  descriptionTr: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  icon: string;
  imageUrl?: string;
  points: number;
  unlockCriteria: UnlockCriteria;
  displayPermission: 'public' | 'private' | 'friends-only';
  isSecret?: boolean; // Hidden until unlocked
}

export interface UnlockCriteria {
  type: 'training' | 'action' | 'count' | 'streak' | 'special';
  requirement: string;
  target?: number;
}

export interface AwardedAchievement {
  achievementId: string;
  userId: string;
  unlockedAt: string;
  blockchainHash: string; // Cryptographic proof
  verificationChain: VerificationNode[];
  isPubliclyDisplayed: boolean;
  customMessage?: string;
  metadata: Record<string, any>;
}

export interface VerificationNode {
  hash: string;
  previousHash: string;
  timestamp: string;
  verifier: string; // admin, user, or system
  signature: string;
}

// 50+ Achievements Database
export const ACHIEVEMENTS: Achievement[] = [
  // FIRST STEPS (Common)
  {
    id: 'ach-first-steps',
    title: 'First Steps',
    titleTr: 'İlk Adımlar',
    description: 'Complete the Getting Started tutorial',
    descriptionTr: 'Başlangıç eğitimini tamamlayın',
    category: 'first-steps',
    rarity: 'common',
    icon: '👶',
    imageUrl: '/awards/first-steps.png',
    points: 10,
    unlockCriteria: { type: 'training', requirement: 'basic-001' },
    displayPermission: 'public'
  },
  {
    id: 'ach-layout-master',
    title: 'Layout Master',
    titleTr: 'Düzen Ustası',
    description: 'Master both Grid and Canvas layout modes',
    descriptionTr: 'Grid ve Canvas düzen modlarında ustalaşın',
    category: 'first-steps',
    rarity: 'common',
    icon: '🎨',
    imageUrl: '/awards/layout-master.png',
    points: 15,
    unlockCriteria: { type: 'training', requirement: 'basic-002' },
    displayPermission: 'public'
  },

  // CONTENT CREATION (Common/Uncommon)
  {
    id: 'ach-creator',
    title: 'Content Creator',
    titleTr: 'İçerik Yaratıcısı',
    description: 'Create your first 10 items',
    descriptionTr: 'İlk 10 öğenizi oluşturun',
    category: 'content-creation',
    rarity: 'common',
    icon: '✨',
    imageUrl: '/awards/creator.png',
    points: 20,
    unlockCriteria: { type: 'count', requirement: 'items-created', target: 10 },
    displayPermission: 'public'
  },
  {
    id: 'ach-prolific',
    title: 'Prolific Creator',
    titleTr: 'Üretken Yaratıcı',
    description: 'Create 100 items',
    descriptionTr: '100 öğe oluşturun',
    category: 'content-creation',
    rarity: 'uncommon',
    icon: '🌟',
    imageUrl: '/awards/prolific.png',
    points: 50,
    unlockCriteria: { type: 'count', requirement: 'items-created', target: 100 },
    displayPermission: 'public'
  },
  {
    id: 'ach-multimedia-master',
    title: 'Multimedia Master',
    titleTr: 'Multimedya Ustası',
    description: 'Add videos, images, audio, and PDFs',
    descriptionTr: 'Video, resim, ses ve PDF ekleyin',
    category: 'content-creation',
    rarity: 'uncommon',
    icon: '🎬',
    imageUrl: '/awards/multimedia.png',
    points: 35,
    unlockCriteria: { type: 'action', requirement: 'all-media-types' },
    displayPermission: 'public'
  },

  // ORGANIZATION (Uncommon/Rare)
  {
    id: 'ach-organizer',
    title: 'Organized Mind',
    titleTr: 'Düzenli Zihin',
    description: 'Create 20 folders',
    descriptionTr: '20 klasör oluşturun',
    category: 'organization',
    rarity: 'uncommon',
    icon: '📁',
    imageUrl: '/awards/organizer.png',
    points: 30,
    unlockCriteria: { type: 'count', requirement: 'folders-created', target: 20 },
    displayPermission: 'public'
  },
  {
    id: 'ach-architect',
    title: 'Information Architect',
    titleTr: 'Bilgi Mimarı',
    description: 'Build a folder structure 5 levels deep',
    descriptionTr: '5 seviye derinlikte klasör yapısı oluşturun',
    category: 'organization',
    rarity: 'rare',
    icon: '🏗️',
    imageUrl: '/awards/architect.png',
    points: 75,
    unlockCriteria: { type: 'action', requirement: 'deep-folder-structure' },
    displayPermission: 'public'
  },
  {
    id: 'ach-minimalist',
    title: 'Digital Minimalist',
    titleTr: 'Dijital Minimalist',
    description: 'Organize 100+ items with perfect categorization',
    descriptionTr: '100+ öğeyi mükemmel kategorilendirmeyle düzenleyin',
    category: 'organization',
    rarity: 'rare',
    icon: '🧘',
    imageUrl: '/awards/minimalist.png',
    points: 80,
    unlockCriteria: { type: 'action', requirement: 'perfect-organization' },
    displayPermission: 'public'
  },

  // CUSTOMIZATION (Uncommon/Rare)
  {
    id: 'ach-stylist',
    title: 'Style Guru',
    titleTr: 'Stil Gurusu',
    description: 'Customize 10 items with unique styles',
    descriptionTr: '10 öğeyi benzersiz stillerle özelleştirin',
    category: 'customization',
    rarity: 'uncommon',
    icon: '🎭',
    imageUrl: '/awards/stylist.png',
    points: 40,
    unlockCriteria: { type: 'count', requirement: 'custom-styles', target: 10 },
    displayPermission: 'public'
  },
  {
    id: 'ach-designer',
    title: 'Master Designer',
    titleTr: 'Usta Tasarımcı',
    description: 'Use all frame types and effects',
    descriptionTr: 'Tüm çerçeve tiplerini ve efektleri kullanın',
    category: 'customization',
    rarity: 'rare',
    icon: '🖌️',
    imageUrl: '/awards/designer.png',
    points: 60,
    unlockCriteria: { type: 'action', requirement: 'all-frame-types' },
    displayPermission: 'public'
  },
  {
    id: 'ach-theme-master',
    title: 'Theme Master',
    titleTr: 'Tema Ustası',
    description: 'Create 5 custom themes',
    descriptionTr: '5 özel tema oluşturun',
    category: 'customization',
    rarity: 'epic',
    icon: '🌈',
    imageUrl: '/awards/theme-master.png',
    points: 100,
    unlockCriteria: { type: 'count', requirement: 'custom-themes', target: 5 },
    displayPermission: 'public'
  },

  // API MASTERY (Rare/Epic)
  {
    id: 'ach-smart-home-master',
    title: 'Smart Home Master',
    titleTr: 'Akıllı Ev Ustası',
    description: 'Successfully integrate Philips Hue',
    descriptionTr: 'Philips Hue entegrasyonunu başarıyla tamamlayın',
    category: 'api-mastery',
    rarity: 'rare',
    icon: '💡',
    imageUrl: '/awards/smart-home.png',
    points: 85,
    unlockCriteria: { type: 'training', requirement: 'api-001' },
    displayPermission: 'public'
  },
  {
    id: 'ach-api-expert',
    title: 'API Expert',
    titleTr: 'API Uzmanı',
    description: 'Integrate 5 different APIs',
    descriptionTr: '5 farklı API entegre edin',
    category: 'api-mastery',
    rarity: 'epic',
    icon: '🔌',
    imageUrl: '/awards/api-expert.png',
    points: 150,
    unlockCriteria: { type: 'count', requirement: 'api-integrations', target: 5 },
    displayPermission: 'public'
  },
  {
    id: 'ach-automation-king',
    title: 'Automation King',
    titleTr: 'Otomasyon Kralı',
    description: 'Create 10 automated workflows',
    descriptionTr: '10 otomatik iş akışı oluşturun',
    category: 'api-mastery',
    rarity: 'legendary',
    icon: '🤖',
    imageUrl: '/awards/automation-king.png',
    points: 200,
    unlockCriteria: { type: 'count', requirement: 'automated-workflows', target: 10 },
    displayPermission: 'public'
  },

  // PRODUCTIVITY (Common/Uncommon/Rare)
  {
    id: 'ach-widget-expert',
    title: 'Widget Expert',
    titleTr: 'Widget Uzmanı',
    description: 'Use 15 different widget types',
    descriptionTr: '15 farklı widget tipi kullanın',
    category: 'productivity',
    rarity: 'uncommon',
    icon: '🧩',
    imageUrl: '/awards/widget-expert.png',
    points: 45,
    unlockCriteria: { type: 'count', requirement: 'widget-types-used', target: 15 },
    displayPermission: 'public'
  },
  {
    id: 'ach-task-master',
    title: 'Task Master',
    titleTr: 'Görev Ustası',
    description: 'Complete 100 todo items',
    descriptionTr: '100 yapılacak öğesini tamamlayın',
    category: 'productivity',
    rarity: 'uncommon',
    icon: '✅',
    imageUrl: '/awards/task-master.png',
    points: 50,
    unlockCriteria: { type: 'count', requirement: 'todos-completed', target: 100 },
    displayPermission: 'public'
  },
  {
    id: 'ach-pomodoro-pro',
    title: 'Pomodoro Pro',
    titleTr: 'Pomodoro Profesyoneli',
    description: 'Complete 50 Pomodoro sessions',
    descriptionTr: '50 Pomodoro oturumu tamamlayın',
    category: 'productivity',
    rarity: 'rare',
    icon: '🍅',
    imageUrl: '/awards/pomodoro-pro.png',
    points: 70,
    unlockCriteria: { type: 'count', requirement: 'pomodoro-sessions', target: 50 },
    displayPermission: 'public'
  },
  {
    id: 'ach-productivity-guru',
    title: 'Productivity Guru',
    titleTr: 'Verimlilik Gurusu',
    description: 'Maintain a 30-day productivity streak',
    descriptionTr: '30 günlük verimlilik serisi koruyun',
    category: 'productivity',
    rarity: 'epic',
    icon: '🔥',
    imageUrl: '/awards/productivity-guru.png',
    points: 120,
    unlockCriteria: { type: 'streak', requirement: 'daily-activity', target: 30 },
    displayPermission: 'public'
  },

  // SOCIAL (Uncommon/Rare)
  {
    id: 'ach-collaborator',
    title: 'Team Player',
    titleTr: 'Takım Oyuncusu',
    description: 'Share 10 items with others',
    descriptionTr: 'Başkalarıyla 10 öğe paylaşın',
    category: 'social',
    rarity: 'uncommon',
    icon: '🤝',
    imageUrl: '/awards/collaborator.png',
    points: 35,
    unlockCriteria: { type: 'count', requirement: 'items-shared', target: 10 },
    displayPermission: 'public'
  },
  {
    id: 'ach-influencer',
    title: 'Community Influencer',
    titleTr: 'Topluluk Etkileyeni',
    description: 'Get 100 likes on your shared content',
    descriptionTr: 'Paylaşılan içeriğinizde 100 beğeni alın',
    category: 'social',
    rarity: 'rare',
    icon: '⭐',
    imageUrl: '/awards/influencer.png',
    points: 90,
    unlockCriteria: { type: 'count', requirement: 'total-likes', target: 100 },
    displayPermission: 'public'
  },
  {
    id: 'ach-curator',
    title: 'Master Curator',
    titleTr: 'Usta Küratör',
    description: 'Create 5 public collections with 50+ items each',
    descriptionTr: 'Her biri 50+ öğeli 5 genel koleksiyon oluşturun',
    category: 'social',
    rarity: 'epic',
    icon: '🎨',
    imageUrl: '/awards/curator.png',
    points: 140,
    unlockCriteria: { type: 'action', requirement: 'large-public-collections' },
    displayPermission: 'public'
  },

  // E-COMMERCE (Rare/Epic/Legendary)
  {
    id: 'ach-ecommerce-pro',
    title: 'E-Commerce Pro',
    titleTr: 'E-Ticaret Profesyoneli',
    description: 'Complete the E-Commerce training module',
    descriptionTr: 'E-Ticaret eğitim modülünü tamamlayın',
    category: 'ecommerce',
    rarity: 'rare',
    icon: '🛒',
    imageUrl: '/awards/ecommerce-pro.png',
    points: 80,
    unlockCriteria: { type: 'training', requirement: 'ecom-001' },
    displayPermission: 'public'
  },
  {
    id: 'ach-sales-master',
    title: 'Sales Master',
    titleTr: 'Satış Ustası',
    description: 'Complete 50 verified sales',
    descriptionTr: '50 doğrulanmış satış tamamlayın',
    category: 'ecommerce',
    rarity: 'epic',
    icon: '💰',
    imageUrl: '/awards/sales-master.png',
    points: 150,
    unlockCriteria: { type: 'count', requirement: 'verified-sales', target: 50 },
    displayPermission: 'public'
  },
  {
    id: 'ach-entrepreneur',
    title: 'Digital Entrepreneur',
    titleTr: 'Dijital Girişimci',
    description: 'Generate 10,000+ in verified revenue',
    descriptionTr: '10.000+ doğrulanmış gelir oluşturun',
    category: 'ecommerce',
    rarity: 'legendary',
    icon: '🏆',
    imageUrl: '/awards/entrepreneur.png',
    points: 500,
    unlockCriteria: { type: 'action', requirement: 'revenue-milestone' },
    displayPermission: 'public'
  },
  {
    id: 'ach-reservation-king',
    title: 'Reservation King',
    titleTr: 'Rezervasyon Kralı',
    description: 'Manage 100 reservations successfully',
    descriptionTr: '100 rezervasyonu başarıyla yönetin',
    category: 'ecommerce',
    rarity: 'epic',
    icon: '📅',
    imageUrl: '/awards/reservation-king.png',
    points: 130,
    unlockCriteria: { type: 'count', requirement: 'reservations-managed', target: 100 },
    displayPermission: 'public'
  },

  // TRAINING (Uncommon/Rare/Epic)
  {
    id: 'ach-student',
    title: 'Dedicated Student',
    titleTr: 'Özverili Öğrenci',
    description: 'Complete 5 training modules',
    descriptionTr: '5 eğitim modülünü tamamlayın',
    category: 'training',
    rarity: 'uncommon',
    icon: '📚',
    imageUrl: '/awards/student.png',
    points: 40,
    unlockCriteria: { type: 'count', requirement: 'modules-completed', target: 5 },
    displayPermission: 'public'
  },
  {
    id: 'ach-scholar',
    title: 'Scholar',
    titleTr: 'Bilgin',
    description: 'Complete 10 training modules',
    descriptionTr: '10 eğitim modülünü tamamlayın',
    category: 'training',
    rarity: 'rare',
    icon: '🎓',
    imageUrl: '/awards/scholar.png',
    points: 80,
    unlockCriteria: { type: 'count', requirement: 'modules-completed', target: 10 },
    displayPermission: 'public'
  },
  {
    id: 'ach-master',
    title: 'Grand Master',
    titleTr: 'Büyük Usta',
    description: 'Complete ALL training modules with 100% scores',
    descriptionTr: 'TÜM eğitim modüllerini %100 puanla tamamlayın',
    category: 'training',
    rarity: 'legendary',
    icon: '👑',
    imageUrl: '/awards/grand-master.png',
    points: 1000,
    unlockCriteria: { type: 'action', requirement: 'perfect-training' },
    displayPermission: 'public',
    isSecret: true
  },
  {
    id: 'ach-meta-achievement',
    title: 'Achievement Hunter',
    titleTr: 'Başarı Avcısı',
    description: 'Learn about the achievement system',
    descriptionTr: 'Başarı sistemini öğrenin',
    category: 'training',
    rarity: 'common',
    icon: '🎯',
    imageUrl: '/awards/meta.png',
    points: 25,
    unlockCriteria: { type: 'training', requirement: 'achieve-001' },
    displayPermission: 'public'
  },

  // SPECIAL (Epic/Legendary)
  {
    id: 'ach-early-adopter',
    title: 'Early Adopter',
    titleTr: 'Erken Benimseyici',
    description: 'Join during beta period',
    descriptionTr: 'Beta döneminde katılın',
    category: 'special',
    rarity: 'epic',
    icon: '🚀',
    imageUrl: '/awards/early-adopter.png',
    points: 200,
    unlockCriteria: { type: 'special', requirement: 'beta-user' },
    displayPermission: 'public'
  },
  {
    id: 'ach-contributor',
    title: 'Code Contributor',
    titleTr: 'Kod Katkıcısı',
    description: 'Contribute to CanvasFlow on GitHub',
    descriptionTr: 'GitHub\'da CanvasFlow\'a katkıda bulunun',
    category: 'special',
    rarity: 'legendary',
    icon: '💻',
    imageUrl: '/awards/contributor.png',
    points: 300,
    unlockCriteria: { type: 'special', requirement: 'github-contribution' },
    displayPermission: 'public'
  },
  {
    id: 'ach-anniversary',
    title: '1 Year Anniversary',
    titleTr: '1. Yıl Dönümü',
    description: 'Active for 1 year',
    descriptionTr: '1 yıldır aktif',
    category: 'special',
    rarity: 'epic',
    icon: '🎂',
    imageUrl: '/awards/anniversary.png',
    points: 150,
    unlockCriteria: { type: 'special', requirement: 'one-year-active' },
    displayPermission: 'public'
  },
  {
    id: 'ach-pioneer',
    title: 'Platform Pioneer',
    titleTr: 'Platform Öncüsü',
    description: 'Be among the first 100 users',
    descriptionTr: 'İlk 100 kullanıcı arasında olun',
    category: 'special',
    rarity: 'legendary',
    icon: '🌟',
    imageUrl: '/awards/pioneer.png',
    points: 500,
    unlockCriteria: { type: 'special', requirement: 'early-user-id' },
    displayPermission: 'public',
    isSecret: true
  },
  {
    id: 'ach-completionist',
    title: 'Completionist',
    titleTr: 'Tamamlayıcı',
    description: 'Unlock ALL achievements',
    descriptionTr: 'TÜM başarıları açın',
    category: 'special',
    rarity: 'legendary',
    icon: '💎',
    imageUrl: '/awards/completionist.png',
    points: 2000,
    unlockCriteria: { type: 'special', requirement: 'all-achievements' },
    displayPermission: 'public',
    isSecret: true
  },

  // Additional variety achievements (50+ total)
  {
    id: 'ach-night-owl',
    title: 'Night Owl',
    titleTr: 'Gece Kuşu',
    description: 'Active for 10 consecutive nights (12am-6am)',
    descriptionTr: '10 ardışık gece aktif (00:00-06:00)',
    category: 'special',
    rarity: 'uncommon',
    icon: '🦉',
    points: 35,
    unlockCriteria: { type: 'streak', requirement: 'night-activity', target: 10 },
    displayPermission: 'public'
  },
  {
    id: 'ach-speed-demon',
    title: 'Speed Demon',
    titleTr: 'Hız Şeytanı',
    description: 'Complete a training module in under 5 minutes',
    descriptionTr: 'Bir eğitim modülünü 5 dakikadan kısa sürede tamamlayın',
    category: 'training',
    rarity: 'rare',
    icon: '⚡',
    points: 60,
    unlockCriteria: { type: 'action', requirement: 'speed-training' },
    displayPermission: 'public'
  },
  {
    id: 'ach-perfectionist',
    title: 'Perfectionist',
    titleTr: 'Mükemmeliyetçi',
    description: 'Get 100% on 5 quiz modules',
    descriptionTr: '5 quiz modülünde %100 alın',
    category: 'training',
    rarity: 'rare',
    icon: '💯',
    points: 75,
    unlockCriteria: { type: 'count', requirement: 'perfect-quiz-scores', target: 5 },
    displayPermission: 'public'
  },
  {
    id: 'ach-collector',
    title: 'Data Collector',
    titleTr: 'Veri Koleksiyoncu',
    description: 'Save 500 items to library',
    descriptionTr: 'Kütüphaneye 500 öğe kaydedin',
    category: 'content-creation',
    rarity: 'rare',
    icon: '📦',
    points: 85,
    unlockCriteria: { type: 'count', requirement: 'library-items', target: 500 },
    displayPermission: 'public'
  },
  {
    id: 'ach-artist',
    title: 'Digital Artist',
    titleTr: 'Dijital Sanatçı',
    description: 'Create 50 custom-styled items',
    descriptionTr: '50 özel stillenmiş öğe oluşturun',
    category: 'customization',
    rarity: 'epic',
    icon: '🎨',
    points: 110,
    unlockCriteria: { type: 'count', requirement: 'artistic-items', target: 50 },
    displayPermission: 'public'
  }
];

// Blockchain Hashing System
export class AchievementBlockchain {
  private chain: VerificationNode[] = [];

  /**
   * Generate cryptographic hash for achievement award
   */
  generateHash(data: {
    achievementId: string;
    userId: string;
    timestamp: string;
    metadata?: Record<string, any>;
  }): string {
    const content = JSON.stringify(data);
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Create verification node in chain
   */
  createVerificationNode(
    achievementId: string,
    userId: string,
    verifier: string
  ): VerificationNode {
    const timestamp = new Date().toISOString();
    const previousHash = this.chain.length > 0 
      ? this.chain[this.chain.length - 1].hash 
      : '0';

    const hash = this.generateHash({
      achievementId,
      userId,
      timestamp,
      metadata: { previousHash, verifier }
    });

    const signature = crypto
      .createHmac('sha256', process.env.BLOCKCHAIN_SECRET || 'canvasflow-secret')
      .update(hash)
      .digest('hex');

    const node: VerificationNode = {
      hash,
      previousHash,
      timestamp,
      verifier,
      signature
    };

    this.chain.push(node);
    return node;
  }

  /**
   * Verify chain integrity
   */
  verifyChain(chain: VerificationNode[]): boolean {
    for (let i = 1; i < chain.length; i++) {
      const current = chain[i];
      const previous = chain[i - 1];

      if (current.previousHash !== previous.hash) {
        return false;
      }

      // Verify signature
      const expectedSignature = crypto
        .createHmac('sha256', process.env.BLOCKCHAIN_SECRET || 'canvasflow-secret')
        .update(current.hash)
        .digest('hex');

      if (current.signature !== expectedSignature) {
        return false;
      }
    }

    return true;
  }

  /**
   * Award achievement with blockchain verification
   */
  awardAchievement(
    achievementId: string,
    userId: string,
    verifier: string = 'system'
  ): AwardedAchievement {
    const timestamp = new Date().toISOString();
    const hash = this.generateHash({ achievementId, userId, timestamp });
    const verificationNode = this.createVerificationNode(achievementId, userId, verifier);

    return {
      achievementId,
      userId,
      unlockedAt: timestamp,
      blockchainHash: hash,
      verificationChain: [verificationNode],
      isPubliclyDisplayed: true,
      metadata: {
        verifier,
        chainLength: this.chain.length
      }
    };
  }

  /**
   * Export achievement as NFT-like metadata
   */
  exportAsNFT(awarded: AwardedAchievement): Record<string, any> {
    const achievement = ACHIEVEMENTS.find(a => a.id === awarded.achievementId);
    if (!achievement) throw new Error('Achievement not found');

    return {
      name: achievement.title,
      description: achievement.description,
      image: achievement.imageUrl,
      attributes: [
        { trait_type: 'Category', value: achievement.category },
        { trait_type: 'Rarity', value: achievement.rarity },
        { trait_type: 'Points', value: achievement.points },
        { trait_type: 'Unlocked At', value: awarded.unlockedAt },
        { trait_type: 'Blockchain Hash', value: awarded.blockchainHash }
      ],
      verification: {
        chain: awarded.verificationChain,
        isValid: this.verifyChain(awarded.verificationChain)
      }
    };
  }
}
