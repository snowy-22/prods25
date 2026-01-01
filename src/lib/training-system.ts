/**
 * Training & Tutorial System
 * 
 * Comprehensive training modules with completion tracking,
 * AI-assisted guidance, and achievement rewards
 */

export type TrainingCategory = 
  | 'basics' 
  | 'advanced' 
  | 'api-integration' 
  | 'widgets' 
  | 'layouts' 
  | 'security' 
  | 'ecommerce' 
  | 'achievements';

export type TrainingDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface TrainingModule {
  id: string;
  title: string;
  titleTr: string;
  description: string;
  descriptionTr: string;
  category: TrainingCategory;
  difficulty: TrainingDifficulty;
  estimatedMinutes: number;
  prerequisiteModules?: string[];
  steps: TrainingStep[];
  completionReward?: string; // achievement ID
  icon: string;
  coverImage?: string;
  videoUrl?: string;
  order: number;
}

export interface TrainingStep {
  id: string;
  title: string;
  titleTr: string;
  content: string;
  contentTr: string;
  type: 'text' | 'video' | 'interactive' | 'quiz' | 'practice';
  aiHint?: string; // AI assistant guidance
  aiHintTr?: string;
  requiredAction?: TrainingAction;
  verificationCode?: string; // Code to verify completion
  resources?: TrainingResource[];
}

export interface TrainingAction {
  type: 'click' | 'create' | 'configure' | 'navigate' | 'complete-quiz';
  target?: string;
  expectedValue?: any;
}

export interface TrainingResource {
  type: 'doc' | 'video' | 'code' | 'link';
  title: string;
  url: string;
}

export interface UserTrainingProgress {
  userId: string;
  moduleId: string;
  startedAt: string;
  completedAt?: string;
  currentStepId: string;
  completedSteps: string[];
  progress: number; // 0-100
  quizScores?: Record<string, number>;
  achievementsEarned: string[];
}

// Training Modules Database
export const TRAINING_MODULES: TrainingModule[] = [
  // BASICS
  {
    id: 'basic-001',
    title: 'Getting Started with tv25',
    titleTr: 'tv25 ile Başlarken',
    description: 'Learn the fundamentals of tv25 interface and navigation',
    descriptionTr: 'tv25 arayüzü ve navigasyon temellerini öğrenin',
    category: 'basics',
    difficulty: 'beginner',
    estimatedMinutes: 15,
    icon: '🚀',
    order: 1,
    steps: [
      {
        id: 'step-001-1',
        title: 'Interface Overview',
        titleTr: 'Arayüz Genel Bakış',
        content: 'Welcome to tv25! This is your digital canvas for organizing content.',
        contentTr: 'tv25\'e hoş geldiniz! Bu, içeriği düzenlemek için dijital kanvasınızdır.',
        type: 'text',
        aiHint: 'Guide user through the main interface elements: canvas, sidebar, tabs',
        aiHintTr: 'Kullanıcıya ana arayüz öğelerini göster: kanvas, kenar çubuğu, sekmeler',
      },
      {
        id: 'step-001-2',
        title: 'Create Your First Item',
        titleTr: 'İlk Öğenizi Oluşturun',
        content: 'Click the + button to add your first content item to the canvas.',
        contentTr: '+ butonuna tıklayarak kanvasa ilk içerik öğenizi ekleyin.',
        type: 'interactive',
        requiredAction: { type: 'create', target: 'content-item' },
        aiHint: 'Encourage user to add a folder, video, or widget',
        aiHintTr: 'Kullanıcıyı klasör, video veya widget eklemeye teşvik et',
      }
    ],
    completionReward: 'ach-first-steps'
  },
  
  {
    id: 'basic-002',
    title: 'Layout Modes: Grid vs Canvas',
    titleTr: 'Düzen Modları: Grid vs Canvas',
    description: 'Master the two layout modes for organizing your content',
    descriptionTr: 'İçeriğinizi düzenlemek için iki düzen modunda ustalaşın',
    category: 'basics',
    difficulty: 'beginner',
    estimatedMinutes: 20,
    icon: '🎨',
    order: 2,
    steps: [
      {
        id: 'step-002-1',
        title: 'Understanding Grid Mode',
        titleTr: 'Grid Modunu Anlamak',
        content: 'Grid mode organizes items in a responsive grid layout.',
        contentTr: 'Grid modu, öğeleri duyarlı bir grid düzeninde organize eder.',
        type: 'text',
      },
      {
        id: 'step-002-2',
        title: 'Switch to Canvas Mode',
        titleTr: 'Canvas Moduna Geçin',
        content: 'Canvas mode allows free-form positioning with drag and drop.',
        contentTr: 'Canvas modu, sürükle-bırak ile serbest konumlandırma sağlar.',
        type: 'interactive',
        requiredAction: { type: 'click', target: 'layout-mode-toggle' },
      }
    ],
    completionReward: 'ach-layout-master'
  },

  // API INTEGRATIONS
  {
    id: 'api-001',
    title: 'Philips Hue Integration',
    titleTr: 'Philips Hue Entegrasyonu',
    description: 'Connect and control your Philips Hue smart lights',
    descriptionTr: 'Philips Hue akıllı ışıklarınızı bağlayın ve kontrol edin',
    category: 'api-integration',
    difficulty: 'intermediate',
    estimatedMinutes: 30,
    icon: '💡',
    order: 10,
    steps: [
      {
        id: 'step-hue-1',
        title: 'Find Bridge IP Address',
        titleTr: 'Bridge IP Adresini Bulun',
        content: 'Use https://discovery.meethue.com/ to find your Hue Bridge IP',
        contentTr: 'Hue Bridge IP\'nizi bulmak için https://discovery.meethue.com/ kullanın',
        type: 'interactive',
        aiHint: 'Help user discover their Hue Bridge on local network',
        aiHintTr: 'Kullanıcının yerel ağdaki Hue Bridge\'i bulmasına yardım et',
        resources: [
          { type: 'doc', title: 'Hue Setup Guide', url: '/docs/PHILIPS_HUE_KURULUM.md' },
          { type: 'link', title: 'Hue Discovery', url: 'https://discovery.meethue.com/' }
        ]
      },
      {
        id: 'step-hue-2',
        title: 'Generate API Key',
        titleTr: 'API Key Oluşturun',
        content: 'Press the physical button on your Hue Bridge and generate an API key',
        contentTr: 'Hue Bridge\'deki fiziksel butona basın ve API key oluşturun',
        type: 'interactive',
        aiHint: 'Guide user through API key generation process',
        aiHintTr: 'API key oluşturma sürecinde kullanıcıya rehberlik et',
      },
      {
        id: 'step-hue-3',
        title: 'Configure Environment',
        titleTr: 'Ortam Yapılandırması',
        content: 'Add NEXT_PUBLIC_HUE_BRIDGE_IP and HUE_API_KEY to .env.local',
        contentTr: '.env.local dosyasına NEXT_PUBLIC_HUE_BRIDGE_IP ve HUE_API_KEY ekleyin',
        type: 'practice',
        verificationCode: 'check-env-hue',
      },
      {
        id: 'step-hue-4',
        title: 'Add Hue Widget',
        titleTr: 'Hue Widget Ekleyin',
        content: 'Add the Philips Hue widget to your canvas and test light control',
        contentTr: 'Kanvasınıza Philips Hue widget\'ını ekleyin ve ışık kontrolünü test edin',
        type: 'interactive',
        requiredAction: { type: 'create', target: 'hue-widget' },
      }
    ],
    completionReward: 'ach-smart-home-master'
  },

  // WIDGETS
  {
    id: 'widget-001',
    title: 'Widget Mastery',
    titleTr: 'Widget Ustalığı',
    description: 'Learn to use all available widgets effectively',
    descriptionTr: 'Tüm mevcut widget\'ları etkili kullanmayı öğrenin',
    category: 'widgets',
    difficulty: 'intermediate',
    estimatedMinutes: 45,
    icon: '🧩',
    order: 15,
    steps: [
      {
        id: 'step-widget-1',
        title: 'Clock Widgets',
        titleTr: 'Saat Widget\'ları',
        content: 'Explore digital, gradient, and astronomical clock widgets',
        contentTr: 'Dijital, gradyan ve astronomik saat widget\'larını keşfedin',
        type: 'interactive',
      },
      {
        id: 'step-widget-2',
        title: 'Productivity Widgets',
        titleTr: 'Üretkenlik Widget\'ları',
        content: 'Master todo lists, notes, timers, and pomodoro',
        contentTr: 'Yapılacaklar listesi, notlar, zamanlayıcılar ve pomodoro\'da ustalaşın',
        type: 'interactive',
      }
    ],
    completionReward: 'ach-widget-expert'
  },

  // E-COMMERCE
  {
    id: 'ecom-001',
    title: 'Reservation System',
    titleTr: 'Rezervasyon Sistemi',
    description: 'Set up and manage calendar-based reservations',
    descriptionTr: 'Takvim tabanlı rezervasyonları kurun ve yönetin',
    category: 'ecommerce',
    difficulty: 'advanced',
    estimatedMinutes: 40,
    icon: '📅',
    order: 20,
    steps: [
      {
        id: 'step-ecom-1',
        title: 'Create Reservation Widget',
        titleTr: 'Rezervasyon Widget\'ı Oluşturun',
        content: 'Add a reservation calendar widget to accept bookings',
        contentTr: 'Rezervasyon kabul etmek için takvim widget\'ı ekleyin',
        type: 'interactive',
        requiredAction: { type: 'create', target: 'reservation-widget' },
      },
      {
        id: 'step-ecom-2',
        title: 'Configure Pricing',
        titleTr: 'Fiyatlandırma Yapılandırın',
        content: 'Set up pricing tiers and availability slots',
        contentTr: 'Fiyat katmanlarını ve müsaitlik slotlarını ayarlayın',
        type: 'practice',
      }
    ],
    completionReward: 'ach-ecommerce-pro'
  },

  // ACHIEVEMENTS
  {
    id: 'achieve-001',
    title: 'Achievement System',
    titleTr: 'Başarı Sistemi',
    description: 'Understand how to earn and display achievements',
    descriptionTr: 'Başarıları nasıl kazanacağınızı ve sergileyeceğinizi öğrenin',
    category: 'achievements',
    difficulty: 'beginner',
    estimatedMinutes: 20,
    icon: '🏆',
    order: 25,
    steps: [
      {
        id: 'step-ach-1',
        title: 'View Your Awards',
        titleTr: 'Ödüllerinizi Görüntüleyin',
        content: 'Open the Awards & Achievements panel to see your collection',
        contentTr: 'Koleksiyonunuzu görmek için Ödüller ve Başarılar panelini açın',
        type: 'interactive',
        requiredAction: { type: 'navigate', target: 'awards-panel' },
      },
      {
        id: 'step-ach-2',
        title: 'Blockchain Verification',
        titleTr: 'Blockchain Doğrulaması',
        content: 'Learn how achievements are cryptographically hashed and verified',
        contentTr: 'Başarıların kriptografik olarak nasıl hash\'lendiğini ve doğrulandığını öğrenin',
        type: 'text',
      }
    ],
    completionReward: 'ach-meta-achievement'
  }
];

// Training completion tracker
export class TrainingTracker {
  private progress: Map<string, UserTrainingProgress> = new Map();

  startModule(userId: string, moduleId: string): UserTrainingProgress {
    const module = TRAINING_MODULES.find(m => m.id === moduleId);
    if (!module) throw new Error('Module not found');

    const progress: UserTrainingProgress = {
      userId,
      moduleId,
      startedAt: new Date().toISOString(),
      currentStepId: module.steps[0]?.id || '',
      completedSteps: [],
      progress: 0,
      achievementsEarned: []
    };

    this.progress.set(`${userId}-${moduleId}`, progress);
    return progress;
  }

  completeStep(userId: string, moduleId: string, stepId: string): UserTrainingProgress {
    const key = `${userId}-${moduleId}`;
    const progress = this.progress.get(key);
    if (!progress) throw new Error('Module not started');

    if (!progress.completedSteps.includes(stepId)) {
      progress.completedSteps.push(stepId);
    }

    const module = TRAINING_MODULES.find(m => m.id === moduleId);
    if (module) {
      progress.progress = (progress.completedSteps.length / module.steps.length) * 100;
      
      // Check if module completed
      if (progress.progress === 100 && !progress.completedAt) {
        progress.completedAt = new Date().toISOString();
        
        // Award achievement if configured
        if (module.completionReward) {
          progress.achievementsEarned.push(module.completionReward);
        }
      }
    }

    this.progress.set(key, progress);
    return progress;
  }

  getUserProgress(userId: string): UserTrainingProgress[] {
    return Array.from(this.progress.values()).filter(p => p.userId === userId);
  }

  getModuleProgress(userId: string, moduleId: string): UserTrainingProgress | undefined {
    return this.progress.get(`${userId}-${moduleId}`);
  }
}
