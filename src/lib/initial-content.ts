
import { CSSProperties } from "react";
import { IconName } from "./icons";
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { DeviceType, OsType, BrowserType } from '@/hooks/use-device';

export type ItemType = 'website' | 'image' | 'video' | 'audio' | 'pdf' | 'map' | 'folder' | 'list' | 'clock' | 'notes' | 'player' | 'calendar' | '3dplayer' | 'award' | 'todolist' | 'weather' | 'calculator' | 'currencyConverter' | 'unitConverter' | 'currencyRates' | 'playerControls' | 'navigation' | 'mediaHub' | 'aiImage' | 'inventory' | 'space' | 'file' | 'pharmacy' | 'trash-folder' | 'flowchart' | 'kanban' | 'swot' | 'fishbone' | '5s' | 'six-s' | 'kaizen-platform' | 'agile-calendar' | 'qfd' | 'processchart' | 'pmp' | 'rss' | 'devices' | 'profile-card' | 'profile-share' | 'mindmap' | 'financial-engineering' | 'financial-calculator' | 'book' | 'item' | 'saved-items' | 'alarm' | 'stopwatch' | 'timer' | 'world-clock' | 'pomodoro' | 'user-profile' | 'awards-folder' | 'spaces-folder' | 'devices-folder' | 'root' | 'match' | 'league-table' | 'fixture' | 'scan' | 'search' | 'todo' | 'social-feed' | 'user-list' | 'screenshot' | 'screen-recorder' | 'qrcode' | 'color-picker' | 'clipboard-manager' | 'gradient-generator' | 'lorem-ipsum' | 'business-model-canvas' | 'hue' | 'reservation' | 'purchase' | 'achievements' | 'training-module' | 'award-card' | 'new-tab' | 'device' | 'hue-light' | 'organization-chart' | 'business-analysis' | 'product-catalog' | 'stock-management' | 'sales-card' | 'advanced-table' | 'speed-test' | 'performance-monitor' | 'macro-pad' | 'player-controls-widget';

export type SortOption = 'manual' | 'name' | 'createdAt' | 'updatedAt' | 'itemCount' | 'averageRating' | 'platformViews' | 'platformLikes' | 'sourceViews' | 'sourceLikes' | 'sourceCreatedAt';
export type SortDirection = 'asc' | 'desc';


export type PatternSettings = {
  color?: string;
  lineWidth?: number;
  dotSize?: number;
};

export type Alignment = {
  h: 'left' | 'center' | 'right';
  v: 'top' | 'center' | 'bottom';
}

export type GridSizingMode = 'auto' | 'fixed';

export type SharingSettings = {
  isPublic?: boolean;
  privacy: 'public' | 'private' | 'password' | 'invited';
  password?: string;
  allowedUsers?: string[]; // user IDs
  userRoles?: Record<string, 'viewer' | 'editor'>;
  identityDisplay?: 'full' | 'initials' | 'anonymous';
  canShare?: boolean;
  canCopy?: boolean;
  canEdit?: boolean;
  canBeSaved?: boolean;
  canRate?: boolean;
  canSetPriority?: boolean;
  canComment?: boolean;
  canAddDetails?: boolean;
};

export type ClockMode = 'digital' | 'gradient' | 'astronomical';

export type Priority = '+' | '++' | '+++';

export type Task = {
  id: string;
  content: string;
  isCompleted: boolean;
};

export type ReadingStatus = 'to-read' | 'reading' | 'read';

export type TaskStatus = 'todo' | 'doing' | 'done';

export type DeviceInfo = {
    type: DeviceType;
    os: OsType;
    browser: BrowserType;
};

export type ItemLayout = 'default' | 'vertical-list' | 'horizontal-strip';

export type Comment = {
  id: string;
  userId: string;
  userName?: string;
  userAvatar?: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  likes?: number;
  replies?: Comment[];
};

export type Analysis = {
  id: string;
  userId: string;
  title: string;
  content: string;
  type: 'observation' | 'insight' | 'summary' | 'recommendation';
  tags?: string[];
  createdAt: string;
  updatedAt?: string;
};

export type StudioView = {
    detailsHtml?: string;
    comments?: Comment[];
    analyses?: Analysis[];
}

export type LetterGrade = 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D' | 'F';
export type EnergyScore = 'A+++' | 'A++' | 'A+' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';
export type Metric = {
    key: string;
    value: string | number;
};

export type InfoBarSettings = {
    visible?: boolean;
    displayMode?: 'hidden' | 'visible' | 'on-hover';
    visibleButtons?: string[]; // Button keys to show: 'rating', 'priority', 'metrics', 'score', etc.
    buttonOrder?: string[]; // Order of buttons in info bar
};

export type RatingEvent = {
  userId: string;
  rating: number; // 1-10 scale
  timestamp: string; // ISO 8601 format with high precision
};

// Sports Types
export type MatchStatus = 'finished' | 'live' | 'upcoming';

export type Team = {
  name: string;
  logo: string; // URL to logo
};

export type MatchData = {
  homeTeam: Team;
  awayTeam: Team;
  score?: string; // e.g., "2 - 1"
  status: MatchStatus;
  date: string; // ISO date string
  league?: string;
};

export type LeagueTableRow = {
  rank: number;
  team: Team;
  played: number;
  win: number;
  draw: number;
  loss: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
};

export type LeagueTableData = {
  leagueName: string;
  rows: LeagueTableRow[];
};

export type FixtureData = {
    title: string;
    matches: MatchData[];
};


export type ContentItem = {
  id: string;
  url?: string;
  type: ItemType;
  title: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  startDate?: string; // For calendar events
  endDate?: string;   // For calendar events
  icon?: IconName;
  children?: ContentItem[];
  playerIndex?: number;
  thumbnail_url?: string;
  author_name?: string;
  styles?: CSSProperties;
  animation?: string | null;
  content?: string; // For notes or item description
  itemImageUrl?: string; // For inventory item photo
  itemVideoUrl?: string; // For inventory item video
  item3dModelUrl?: string; // For inventory item 3D model
  calendarSources?: string[]; // For calendar widget sources

  clockMode?: ClockMode; // For clock widgets
  gridSpanCol?: number;
  gridSpanRow?: number;
  tasksByStatus?: Record<TaskStatus, Task[]>; // For todolist widget
  isExpanded?: boolean; // For todolist widget
  isMuted?: boolean; // For sound-emitting players
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  isInvalid?: boolean;
  error?: string;
  isBroadcastScreen?: boolean;
  screenIndex?: number;
  previewIndex?: number;
  isPublic?: boolean; // For discoverability
  isPinned?: boolean; // For favoriting
  isDeletable?: boolean; // To prevent deleting preset items
  sharing?: SharingSettings;
  published_at?: string; // For social feed
  isExpandableOnHover?: boolean;
  html?: string; // For oEmbed HTML
  provider_name?: string; // For oEmbed provider

  // Award-specific properties
  awardInstanceId?: string; // Unique ID for this specific instance of the award
  awardee?: string; // Username of the person who received the award
  awardedAt?: string; // ISO string date of when it was awarded
  showInLibrary?: boolean; // To show/hide in the library view

  // --- NEW & EXPANDED RATING/METRICS SYSTEM ---
  myRating?: number; // The current user's rating
  ratings?: RatingEvent[];
  priority?: Priority; // '+', '++', '+++'
  letterGrade?: LetterGrade; // 'A+', 'B-', etc.
  fiveStarRating?: number; // 1-5 stars
  hundredPointScale?: number; // 0-100 score
  energyScore?: EnergyScore; // 'A+++' to 'G'
  metrics?: Record<string, string | number>; // For custom user-defined metrics e.g. { "Ekran Boyutu": "27 inç", "Ağırlık": "1.2 kg" }
  
  // View options for metrics on the player card
  visibleMetrics?: string[]; // Array of metric keys to display, e.g., ['rating', 'priority', 'Ekran Boyutu']
  // The order of this array determines the display order.
  
  // Info Bar Settings
  infoBarSettings?: InfoBarSettings;

  overallRating?: number; // Manual 1-10 rating for a list/folder
  averageRating?: number; // Calculated average rating of children
  itemCount?: number; // Number of children
  hierarchyId?: string; // Calculated property
  isLiked?: boolean;
  likeCount?: number;
  commentCount?: number;
  
    // Per-view settings for how this item renders its children
    layoutMode?: 'grid' | 'studio' | 'presentation' | 'stream' | 'free' | 'carousel';  lockedLayoutMode?: boolean; // Prevents layout mode change by viewers
  allowedItemTypes?: ItemType[]; // Which item types can be opened/added  itemLayout?: ItemLayout;
  
  // Flow mode connections
  connections?: Array<{ from: string; to: string; label?: string; style?: 'solid' | 'dashed' | 'dotted' }>;
  flowPosition?: { x: number; y: number };

  // Space/Location Properties
  spaceType?: 'residential' | 'commercial' | 'storage' | 'garage' | 'office' | 'other';
  address?: string; // Gerçek adres
  coordinates?: { lat: number; lng: number }; // Harita koordinatları
  hideAddressInUI?: boolean; // Adresi gizle
  hideSpaceTypeInUI?: boolean; // Mekan tipini gizle
  spaceAbbreviation?: string; // Kısaltma (örn: "ME" = Merkez Ev)
  floorPlanUrl?: string; // Kat planı görseli
  floorPlanData?: string; // JSON formatında kat planı verisi
  containerInventory?: Array<{ // Konteynerler ve raf yapısı
    id: string;
    name: string;
    type: 'shelf' | 'cabinet' | 'drawer' | 'box' | 'container' | 'room';
    items: string[]; // item id'leri
  }>;
  spaceMetadata?: Record<string, any>; // Genişletilebilir mekan verileri
  assignedSpaceId?: string; // Bu öğenin atandığı mekan ID'si
  metadata?: Record<string, any>; // For hue-light and device metadata

  sortOption?: SortOption;
  sortDirection?: SortDirection;
  
  gridSizingMode?: GridSizingMode;
  gridItemAspectRatio?: '1/1' | '9/16' | '16/9';
  gridSize?: number;
  columnCount?: number;
  rowCount?: number;
  gap?: number;
  borderRadius?: number;
  padding?: number;
  baseFrameStyles?: CSSProperties;
  
  // Frame Effects
  frameEffect?: 'none' | 'glowing' | 'neon' | 'pulsing' | 'patterned' | 'braided';
  frameColor?: string;
  frameWidth?: number;
  frameStyle?: 'solid' | 'dashed' | 'dotted' | 'double';
  
  // Dynamic Frame Features
  pointerFrameEnabled?: boolean; // Pointer-tracking frame
  audioTrackerEnabled?: boolean; // Auto-focus on playing audio
  mouseTrackerEnabled?: boolean; // Mouse tracker frame
  virtualizerMode?: boolean; // Color change based on audio/rhythm
  visualizerMode?: 'off' | 'bars' | 'wave' | 'circular' | 'particles'; // Visualizer easter egg

  activeAnimation?: string | null;
  background?: Partial<CSSProperties> & { webgl?: string };
  pattern?: 'grid' | 'dots' | 'lined' | 'isometric' | 'folderName' | null;
  patternSettings?: PatternSettings;
  alignment?: Alignment;
  isGridLocked?: boolean;
  isMaxMode?: boolean;
  isPlayerHeaderVisible?: boolean;
  isPlayerSettingsVisible?: boolean;
  isScreensaverEnabled?: boolean;
  screensaverTimeout?: number; // in seconds
  screensaverShortcut?: string;
  scale?: number;
  studioView?: StudioView;
  
  // Folder cell appearance
  cellBackgroundColor?: string;
  cellAnimation?: 'none' | 'fade-in' | 'slide-up' | 'zoom-in' | 'bounce' | 'rotate';
  cellTitleFont?: 'default' | 'mono' | 'serif' | 'display';
  cellTitleSize?: number;
  cellTitleColor?: string;
  cellTitleBold?: boolean;
  cellTitleItalic?: boolean;

  // Comments and Analysis
  comments?: Comment[];
  analyses?: Analysis[];
  explanation?: string; // Detailed explanation/description
  analyticsData?: {
    viewCount?: number;
    analyzeCount?: number;
    lastAnalyzed?: string;
  };

  // Social stats
  saveCount?: number;
  viewCount?: number;
  
  // Device-specific properties
  isCurrentDevice?: boolean;
  deviceInfo?: DeviceInfo;
  parentId?: string | null;
  order?: number;
  level?: number;
  
  // Aesthetic properties
  coverImage?: string;
  logo?: string;
  gridSketch?: string;
  
  // Book-specific properties
  isbn?: string;
  publisher?: string;
  pageCount?: number;
  readingStatus?: ReadingStatus;

  // Sports data
  matchData?: MatchData;
  leagueTableData?: LeagueTableData;
  fixtureData?: FixtureData;
};

export type CanvasDraft = {
    id: string;
    name: string;
    layout: Partial<ContentItem>;
}


export const calculateAverageRating = (items: ContentItem[] = []): number => {
    if (!items || items.length === 0) return 5.0; // Default to 5.0 if no items
    const ratedItems = items.filter(item => item.ratings && item.ratings.length > 0);
    if (ratedItems.length === 0) return 5.0; // Default to 5.0 if no ratings yet

    const allRatings = ratedItems.flatMap(item => item.ratings || []);
    if (allRatings.length === 0) return 5.0; // Should be redundant, but safe

    const totalRating = allRatings.reduce((sum, event) => sum + event.rating, 0);
    return totalRating / allRatings.length;
};

export const addHierarchyAndStats = (items: ContentItem[]): ContentItem[] => {
    const itemMap = new Map<string, ContentItem>();
    items.forEach(item => {
        itemMap.set(item.id, { ...item, children: [] });
    });

    const rootItems: ContentItem[] = [];

    items.forEach(item => {
        const currentItem = itemMap.get(item.id)!;
        // Prevent self-parenting which causes infinite loops
        if (item.parentId === item.id) {
            rootItems.push(currentItem);
            return;
        }
        
        if ((item.parentId === 'root' || item.parentId === null) && item.id !== 'root') {
             rootItems.push(currentItem);
        } else if (item.parentId && itemMap.has(item.parentId)) {
            const parent = itemMap.get(item.parentId)!;
            if (!parent.children) {
                parent.children = [];
            }
            parent.children.push(currentItem);
        }
    });

    const finalItems: ContentItem[] = [];

    const processNodes = (nodes: ContentItem[], level: number, prefix: string) => {
        // Filter out system/profile folders from hierarchical numbering if they are at the root
        const itemsToNumber = level === 0 
            ? nodes.filter(node => node.type !== 'user-profile' && node.id !== 'awards-folder' && node.id !== 'trash-folder' && node.id !== 'spaces-folder' && node.id !== 'devices-folder') 
            : nodes;

        nodes.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        let itemCounter = 0;

        nodes.forEach((node) => {
            let hierarchyId = '';
            // Only assign a hierarchical ID if it's part of the numberable items
            if (itemsToNumber.includes(node)) {
                 itemCounter++;
                 hierarchyId = prefix ? `${prefix}.${itemCounter}` : `${itemCounter}`;
            }
            
            let children: ContentItem[] = [];
            if (node.children) {
                children = [...node.children];
                processNodes(children, level + 1, hierarchyId);
            }
            
            const itemCount = children.length;
            const averageRating = calculateAverageRating(children);

            const { children: _, ...rest } = node;
            finalItems.push({ 
                ...rest, 
                level, 
                hierarchyId, 
                itemCount, 
                averageRating 
            });
        });
    };
    
    processNodes(rootItems, 0, '');

    return [...finalItems];
};




const now = "2024-05-24T12:00:00.000Z";

export const widgetTemplates: Record<string, Omit<ContentItem, 'id' | 'createdAt' | 'updatedAt' | 'parentId'>[]> = {
    "Genel": [
        { type: 'player', title: 'Oynatıcı', url: '', icon: 'player' },
        { type: 'notes', title: 'Not Defteri', content: '', url: '', isExpandableOnHover: true, icon: 'notes' },
        { type: 'todolist', title: 'Yapılacaklar Listesi', icon: 'todolist' },
        { type: 'calendar', title: 'Takvim', icon: 'calendar' },
        { type: 'rss', title: 'RSS Akışı', icon: 'rss' },
        { type: 'mindmap', title: 'Zihin Haritası', icon: 'mindmap' },
    ],
    "Saatler": [
        { type: 'clock', title: 'Dijital Saat', icon: 'clock', clockMode: 'digital' },
        { type: 'clock', title: 'Gradyan Saat', icon: 'clock', clockMode: 'gradient' },
        { type: 'clock', title: 'Astronomik Saat', icon: 'clock', clockMode: 'astronomical' },
        { type: 'alarm', title: 'Alarm', icon: 'alarm' },
        { type: 'stopwatch', title: 'Kronometre', icon: 'stopwatch' },
        { type: 'timer', title: 'Zamanlayıcı', icon: 'timer' },
        { type: 'world-clock', title: 'Dünya Saatleri', icon: 'globe' },
        { type: 'pomodoro', title: 'Pomodoro', icon: 'pomodoro' },
    ],
    "Medya & Kontrol": [
        { type: 'playerControls', title: 'Oynatıcı Kontrolleri', icon: 'playerControls' },
        { type: 'mediaHub', title: 'Medya Merkezi', icon: 'mediaHub' },
    ],
    "Finans": [
        { type: 'financial-engineering', title: 'Finans Mühendisliği', icon: 'financial-engineering' },
        { type: 'financial-calculator', title: 'Enflasyon & Fiyat Hesaplayıcı', icon: 'financial-engineering' },
        { type: 'currencyConverter', title: 'Döviz Çevirici', icon: 'currencyConverter' },
        { type: 'currencyRates', title: 'Canlı Kurlar', icon: 'currencyRates' },
    ],
    "Araçlar": [
        { type: 'weather', title: 'Hava Durumu', icon: 'weather' },
        { type: 'calculator', title: 'Hesap Makinesi', icon: 'calculator' },
        { type: 'unitConverter', title: 'Birim Çevirici', icon: 'unitConverter' },
        { type: 'navigation', title: 'Navigasyon', icon: 'navigation' },
        { type: 'pharmacy', title: 'Nöbetçi Eczane', icon: 'pharmacy' },
        { type: 'screenshot', title: 'Ekran Görüntüsü', icon: 'image' },
        { type: 'screen-recorder', title: 'Ekran Kaydı', icon: 'video' },
        { type: 'qrcode', title: 'QR Kod Üretici', icon: 'qrcode' },
        { type: 'color-picker', title: 'Renk Seçici', icon: 'palette' },
        { type: 'clipboard-manager', title: 'Pano Yöneticisi', icon: 'list' },
        { type: 'gradient-generator', title: 'Gradient Üretici', icon: 'paintbrush' },
        { type: 'lorem-ipsum', title: 'Lorem Ipsum Üretici', icon: 'file-text' },
        { type: 'speed-test', title: 'İnternet Hız Testi', icon: 'zap' },
        { type: 'performance-monitor', title: 'Sistem Performans', icon: 'activity' },
    ],
    "Yapay Zeka": [
        { type: 'aiImage', title: 'AI Görüntü Üretici', icon: 'aiImage' },
    ],
    "Profil": [
        { type: 'profile-card', title: 'Profil Kartı', icon: 'profile-card' },
        { type: 'profile-share', title: 'Profil Paylaşım Kartı', icon: 'profile-share' },
    ],
    "İş ve Verimlilik": [
        { type: 'flowchart', title: 'Akış Şeması', icon: 'flowchart' },
        { type: 'kanban', title: 'Kanban Tahtası', icon: 'kanban' },
        { type: 'swot', title: 'SWOT Analizi', icon: 'swot' },
        { type: 'fishbone', title: 'Balık Kılçığı Diyagramı', icon: 'fishbone' },
        { type: '5s', title: '5S Panosu', icon: '5s' },
        { type: 'six-s', title: '6S Uygulaması', icon: 'processchart' },
        { type: 'kaizen-platform', title: 'Kaizen Platformu', icon: 'layout' },
        { type: 'agile-calendar', title: 'Agile Takvimi', icon: 'calendar' },
        { type: 'qfd', title: 'QFD Matrisi', icon: 'qfd' },
        { type: 'processchart', title: 'Süreç Şeması', icon: 'processchart' },
        { type: 'pmp', title: 'Proje Yönetimi Panosu', icon: 'pmp' },
        { type: 'business-model-canvas', title: 'İşletme Modeli Canvas', icon: 'layout' },
    ],
     "Akıllı Ev": [
        { type: 'playerControls', title: 'Hue Ampul', icon: 'lightbulb' },
        { type: 'playerControls', title: 'Hue Parlaklık', icon: 'lightbulb' },
        { type: 'playerControls', title: 'Okuma Sahnesi', icon: 'lightbulb' },
        { type: 'playerControls', title: 'TV Sahnesi', icon: 'lightbulb' },
        { type: 'playerControls', title: 'Parti Sahnesi', icon: 'lightbulb' },
        { type: 'playerControls', title: 'Termostat', icon: 'thermometer' },
        { type: 'playerControls', title: 'Kapı Kilidi', icon: 'shield' },
    ],
    "Spor": [
      { type: 'match', title: 'Maç Sonucu', url: '', icon: 'trophy' },
      { type: 'league-table', title: 'Puan Durumu', url: '', icon: 'list' },
      { type: 'fixture', title: 'Fikstür', url: '', icon: 'calendar' },
    ],
    "E-Ticaret": [
      { type: 'product-catalog', title: 'Ürün Kataloğu', icon: 'package' },
      { type: 'stock-management', title: 'Stok Hareketleri', icon: 'package-2' },
      { type: 'sales-card', title: 'Satış Kartları', icon: 'dollar-sign' },
      { type: 'advanced-table', title: 'Gelişmiş Tablo', icon: 'table' },
    ]
};

export const initialContent: ContentItem[] = [
    { id: 'root', type: 'root', title: 'Kitaplık', icon: 'library', createdAt: now, updatedAt: now, parentId: null, isDeletable: false },
  { id: 'awards-folder', type: 'awards-folder', title: 'Başarılar', icon: 'award', createdAt: now, updatedAt: now, parentId: 'root', isDeletable: false, order: 0, styles: { width: '640px', height: '480px' } },
  { id: 'award-behance', type: 'award', title: 'Behance Best of the Day', icon: 'award', content: 'Behance tasarım seçkisine giren proje.', createdAt: now, updatedAt: now, parentId: 'awards-folder', order: 0, url: 'https://www.behance.net/' },
  { id: 'award-dribbble', type: 'award', title: 'Dribbble Highlight', icon: 'award', content: 'Öne çıkan konsept tasarım yayını.', createdAt: now, updatedAt: now, parentId: 'awards-folder', order: 1, url: 'https://dribbble.com/' },
  { id: 'award-ux', type: 'award', title: 'UX Case Study', icon: 'award', content: 'Kullanıcı odaklı vaka çalışması ödülü.', createdAt: now, updatedAt: now, parentId: 'awards-folder', order: 2, url: 'https://uxdesign.cc/' },
  { id: 'award-motion', type: 'award', title: 'Motion Design', icon: 'award', content: 'Animasyon ve mikro etkileşimlerde mansiyon.', createdAt: now, updatedAt: now, parentId: 'awards-folder', order: 3, url: 'https://www.awwwards.com/' },
    { 
        id: 'user-profile-doruk', 
        type: 'user-profile', 
        title: 'Doruk Karlıkaya', 
        icon: 'user', 
        createdAt: now, 
        updatedAt: now, 
        parentId: 'root', 
        content: "Dijital Deneyim Tasarımcısı", 
        isDeletable: false, 
        order: 1,
        itemImageUrl: 'https://pbs.twimg.com/profile_images/1782015034379399168/k2s7i0-6_400x400.jpg',
        styles: { width: '300px', height: '400px' }
    },
    { id: 'welcome-folder', type: 'folder', title: 'Hoş Geldiniz', icon: 'folder', createdAt: now, updatedAt: now, parentId: 'root', content: "tv25.app'e hoş geldiniz!", order: 2, styles: { width: '400px', height: '300px' } },
    { id: 'social-examples', type: 'folder', title: 'Sosyal Medya Örnekleri', icon: 'folder', createdAt: now, updatedAt: now, parentId: 'root', order: 3, styles: { width: '800px', height: '600px' }, content: 'Instagram, Facebook, Spotify, Twitch, Kick örnekleri' },
    // Example items inside the Social Media Examples folder
    { id: 'ex-youtube-lofi', type: 'video', title: 'YouTube Lofi Girl (Autoplay/Mute)', icon: 'youtube', url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk', createdAt: now, updatedAt: now, parentId: 'social-examples' },
    { id: 'ex-twitch-monstercat', type: 'video', title: 'Twitch: Monstercat (Autoplay/Mute)', icon: 'tv', url: 'https://www.twitch.tv/monstercat', createdAt: now, updatedAt: now, parentId: 'social-examples' },
    { id: 'ex-spotify-track', type: 'website', title: 'Spotify Track (Embed)', icon: 'music', url: 'https://open.spotify.com/track/7ouMYWpwJ422jRcDASZB7P', createdAt: now, updatedAt: now, parentId: 'social-examples' },
    { id: 'ex-instagram-post', type: 'website', title: 'Instagram Post (Embed)', icon: 'instagram', url: 'https://www.instagram.com/p/CxVjVbOPQy1/', createdAt: now, updatedAt: now, parentId: 'social-examples' },
    { id: 'ex-facebook-video', type: 'website', title: 'Facebook Video (Embed)', icon: 'globe', url: 'https://www.facebook.com/facebookapp/videos/10153231379946729/', createdAt: now, updatedAt: now, parentId: 'social-examples' },
    { id: 'ex-kick-channel', type: 'video', title: 'Kick: Channel (Autoplay/Mute)', icon: 'tv', url: 'https://kick.com/trainwreckstv', createdAt: now, updatedAt: now, parentId: 'social-examples' },
    { id: 'trash-folder', type: 'trash-folder', title: 'Çöp Kutusu', icon: 'trash-2', createdAt: now, updatedAt: now, parentId: 'root', isDeletable: false, order: 10, styles: { width: '400px', height: '300px' } },
    { id: 'bmc-example', type: 'business-model-canvas', title: 'İşletme Modeli Canvas', icon: 'layout', createdAt: now, updatedAt: now, parentId: 'root', order: 4, styles: { width: '1200px', height: '800px' }, content: 'İşletme modelinizi yapılandırmak ve analiz etmek için Business Model Canvas' },
    
    // Mekan Yönetimi - Merkez Ev Örneği
    { 
        id: 'merkez-ev', 
        type: 'space', 
        title: 'Merkez Ev', 
        icon: 'home', 
        createdAt: now, 
        updatedAt: now, 
        parentId: 'root', 
        isDeletable: true,
        order: 5,
        spaceType: 'residential',
        spaceAbbreviation: 'ME',
        address: 'İstanbul, Türkiye',
        hideAddressInUI: true,
        hideSpaceTypeInUI: false,
        containerInventory: [
            { id: 'cont-bedroom', name: 'Yatak Odası', type: 'room', items: ['item-bed-light'] },
            { id: 'cont-corridor', name: 'Koridor', type: 'room', items: ['item-corridor-light-1', 'item-corridor-light-2', 'item-corridor-light-3', 'item-corridor-light-4'] },
            { id: 'cont-living-room', name: 'Oturma Odası', type: 'room', items: ['item-living-light-1', 'item-living-light-2', 'item-tv', 'item-pc'] }
        ],
        spaceMetadata: {
            totalLights: 8,
            totalDevices: 2,
            lastUpdated: now,
            description: 'Ev merkezi mekan örneği'
        }
    },

    // Merkez Ev Cihazları ve Eşyaları
    { id: 'item-tv', type: 'device', title: 'Samsung QN85A 65"', icon: 'tv', content: 'Qled TV', createdAt: now, updatedAt: now, parentId: 'merkez-ev', isDeletable: true, assignedSpaceId: 'merkez-ev' },
    { id: 'item-pc', type: 'device', title: 'İş Bilgisayarı', icon: 'monitor', content: 'PC', createdAt: now, updatedAt: now, parentId: 'merkez-ev', isDeletable: true, assignedSpaceId: 'merkez-ev' },
    
    // Philips Hue Işıkları - Yatak Odası
    { id: 'item-bed-light', type: 'hue-light', title: 'Yatak Odası Işığı', icon: 'lightbulb', content: 'Philips Hue', createdAt: now, updatedAt: now, parentId: 'merkez-ev', isDeletable: true, assignedSpaceId: 'merkez-ev', metadata: { hueId: 'bed-1', color: '#FFD700', brightness: 100 } },
    
    // Philips Hue Işıkları - Koridor (4 adet)
    { id: 'item-corridor-light-1', type: 'hue-light', title: 'Koridor Işığı 1', icon: 'lightbulb', content: 'Philips Hue', createdAt: now, updatedAt: now, parentId: 'merkez-ev', isDeletable: true, assignedSpaceId: 'merkez-ev', metadata: { hueId: 'corridor-1', color: '#FFD700', brightness: 100 } },
    { id: 'item-corridor-light-2', type: 'hue-light', title: 'Koridor Işığı 2', icon: 'lightbulb', content: 'Philips Hue', createdAt: now, updatedAt: now, parentId: 'merkez-ev', isDeletable: true, assignedSpaceId: 'merkez-ev', metadata: { hueId: 'corridor-2', color: '#FFD700', brightness: 100 } },
    { id: 'item-corridor-light-3', type: 'hue-light', title: 'Koridor Işığı 3', icon: 'lightbulb', content: 'Philips Hue', createdAt: now, updatedAt: now, parentId: 'merkez-ev', isDeletable: true, assignedSpaceId: 'merkez-ev', metadata: { hueId: 'corridor-3', color: '#FFD700', brightness: 100 } },
    { id: 'item-corridor-light-4', type: 'hue-light', title: 'Koridor Işığı 4', icon: 'lightbulb', content: 'Philips Hue', createdAt: now, updatedAt: now, parentId: 'merkez-ev', isDeletable: true, assignedSpaceId: 'merkez-ev', metadata: { hueId: 'corridor-4', color: '#FFD700', brightness: 100 } },
    
    // Philips Hue Işıkları - Oturma Odası (2 adet)
    { id: 'item-living-light-1', type: 'hue-light', title: 'Oturma Odası Işığı 1', icon: 'lightbulb', content: 'Philips Hue', createdAt: now, updatedAt: now, parentId: 'merkez-ev', isDeletable: true, assignedSpaceId: 'merkez-ev', metadata: { hueId: 'living-1', color: '#FFD700', brightness: 100 } },
    { id: 'item-living-light-2', type: 'hue-light', title: 'Oturma Odası Işığı 2', icon: 'lightbulb', content: 'Philips Hue', createdAt: now, updatedAt: now, parentId: 'merkez-ev', isDeletable: true, assignedSpaceId: 'merkez-ev', metadata: { hueId: 'living-2', color: '#FFD700', brightness: 100 } },
    
    // Yeni Widget'lar
    { 
        id: 'org-chart-example', 
        type: 'organization-chart', 
        title: 'Organizasyon Şeması', 
        icon: 'share-2', 
        content: 'Şirket hiyerarşisi ve organizasyon yapısını görselleştirin',
        createdAt: now, 
        updatedAt: now, 
        parentId: 'root', 
        isDeletable: true,
        order: 7,
        styles: { width: '1000px', height: '600px' },
        metadata: {
            nodes: [
                { id: 'ceo', title: 'CEO', position: 'Yönetici', color: '#FF6B6B', children: ['dev', 'sales'] },
                { id: 'dev', title: 'Geliştirme Müdürü', position: 'Teknik Lider', color: '#4ECDC4', children: [] },
                { id: 'sales', title: 'Satış Müdürü', position: 'Pazarlama', color: '#45B7D1', children: [] }
            ]
        }
    },
    
    { 
        id: 'business-analysis-example', 
        type: 'business-analysis', 
        title: 'İş Analizi Formu', 
        icon: 'bar-chart-2', 
        content: 'Proje ve iş analizi raporlarını yönetin',
        createdAt: now, 
        updatedAt: now, 
        parentId: 'root', 
        isDeletable: true,
        order: 8,
        styles: { width: '900px', height: '700px' },
        metadata: {
            analyses: []
        }
    },
    
    // Mekanlar Klasörü
    { id: 'spaces-folder', type: 'spaces-folder', title: 'Mekanlar', icon: 'home', createdAt: now, updatedAt: now, parentId: 'root', isDeletable: false, order: 6, styles: { width: '400px', height: '300px' }, content: 'Tüm mekanlar burda saklanır' },
    
    // Mekan 2 - Feriköy Evim
    { 
        id: 'ferikoy-evim', 
        type: 'space', 
        title: 'Feriköy Evim', 
        icon: 'home', 
        createdAt: now, 
        updatedAt: now, 
        parentId: 'spaces-folder', 
        isDeletable: true,
        order: 1,
        spaceType: 'residential',
        spaceAbbreviation: 'FE',
        address: 'Feriköy, İstanbul',
        hideAddressInUI: true,
        hideSpaceTypeInUI: false,
        containerInventory: [
            { id: 'cont-fk-bedroom', name: 'Yatak Odası', type: 'room', items: [] },
            { id: 'cont-fk-living', name: 'Oturma Odası', type: 'room', items: [] }
        ]
    },
    
    // Mekan 3 - Edirne Evim
    { 
        id: 'edirne-evim', 
        type: 'space', 
        title: 'Edirne Evim', 
        icon: 'home', 
        createdAt: now, 
        updatedAt: now, 
        parentId: 'spaces-folder', 
        isDeletable: true,
        order: 2,
        spaceType: 'residential',
        spaceAbbreviation: 'EE',
        address: 'Edirne, Türkiye',
        hideAddressInUI: true,
        hideSpaceTypeInUI: false,
        containerInventory: [
            { id: 'cont-ed-bedroom', name: 'Yatak Odası', type: 'room', items: [] },
            { id: 'cont-ed-living', name: 'Oturma Odası', type: 'room', items: [] }
        ]
    },
    
    // Mekan 4 - Edirne 1+1
    { 
        id: 'edirne-1plus1', 
        type: 'space', 
        title: 'Edirne 1+1', 
        icon: 'home', 
        createdAt: now, 
        updatedAt: now, 
        parentId: 'spaces-folder', 
        isDeletable: true,
        order: 3,
        spaceType: 'residential',
        spaceAbbreviation: 'E1',
        address: 'Edirne, Türkiye',
        hideAddressInUI: true,
        hideSpaceTypeInUI: false,
        containerInventory: [
            { id: 'cont-e1-main', name: 'Ana Oda', type: 'room', items: [] },
            { id: 'cont-e1-kitchen', name: 'Mutfak', type: 'room', items: [] }
        ]
    },
    
    // Mekan 5 - Edirne Dedem
    { 
        id: 'edirne-dedem', 
        type: 'space', 
        title: 'Edirne Dedem', 
        icon: 'home', 
        createdAt: now, 
        updatedAt: now, 
        parentId: 'spaces-folder', 
        isDeletable: true,
        order: 4,
        spaceType: 'residential',
        spaceAbbreviation: 'ED',
        address: 'Edirne, Türkiye',
        hideAddressInUI: true,
        hideSpaceTypeInUI: false,
        containerInventory: [
            { id: 'cont-ed-bed1', name: 'Yatak Odası 1', type: 'room', items: [] },
            { id: 'cont-ed-bed2', name: 'Yatak Odası 2', type: 'room', items: [] }
        ]
    },
    
    // Mekan 6 - Urla Annem
    { 
        id: 'urla-annem', 
        type: 'space', 
        title: 'Urla Annem', 
        icon: 'home', 
        createdAt: now, 
        updatedAt: now, 
        parentId: 'spaces-folder', 
        isDeletable: true,
        order: 5,
        spaceType: 'residential',
        spaceAbbreviation: 'UA',
        address: 'Urla, İzmir',
        hideAddressInUI: true,
        hideSpaceTypeInUI: false,
        containerInventory: [
            { id: 'cont-ua-main', name: 'Salon', type: 'room', items: [] },
            { id: 'cont-ua-kitchen', name: 'Mutfak', type: 'room', items: [] }
        ]
    },
    
    // Mekan 7 - Urla Kira 1
    { 
        id: 'urla-kira-1', 
        type: 'space', 
        title: 'Urla Kira 1', 
        icon: 'home', 
        createdAt: now, 
        updatedAt: now, 
        parentId: 'spaces-folder', 
        isDeletable: true,
        order: 6,
        spaceType: 'residential',
        spaceAbbreviation: 'UK1',
        address: 'Urla, İzmir',
        hideAddressInUI: true,
        hideSpaceTypeInUI: false,
        containerInventory: [
            { id: 'cont-uk1-main', name: 'Ana Oda', type: 'room', items: [] }
        ]
    },
    
    // Mekan 8 - Urla Kira 2
    { 
        id: 'urla-kira-2', 
        type: 'space', 
        title: 'Urla Kira 2', 
        icon: 'home', 
        createdAt: now, 
        updatedAt: now, 
        parentId: 'spaces-folder', 
        isDeletable: true,
        order: 7,
        spaceType: 'residential',
        spaceAbbreviation: 'UK2',
        address: 'Urla, İzmir',
        hideAddressInUI: true,
        hideSpaceTypeInUI: false,
        containerInventory: [
            { id: 'cont-uk2-main', name: 'Ana Oda', type: 'room', items: [] }
        ]
    },
    
    // Mekan 9 - Urla Kira 3
    { 
        id: 'urla-kira-3', 
        type: 'space', 
        title: 'Urla Kira 3', 
        icon: 'home', 
        createdAt: now, 
        updatedAt: now, 
        parentId: 'spaces-folder', 
        isDeletable: true,
        order: 8,
        spaceType: 'residential',
        spaceAbbreviation: 'UK3',
        address: 'Urla, İzmir',
        hideAddressInUI: true,
        hideSpaceTypeInUI: false,
        containerInventory: [
            { id: 'cont-uk3-main', name: 'Ana Oda', type: 'room', items: [] }
        ]
    },
    
    // Mekan 10 - Urla Annanem
    { 
        id: 'urla-annanem', 
        type: 'space', 
        title: 'Urla Annanem', 
        icon: 'home', 
        createdAt: now, 
        updatedAt: now, 
        parentId: 'spaces-folder', 
        isDeletable: true,
        order: 9,
        spaceType: 'residential',
        spaceAbbreviation: 'UAN',
        address: 'Urla, İzmir',
        hideAddressInUI: true,
        hideSpaceTypeInUI: false,
        containerInventory: [
            { id: 'cont-uan-living', name: 'Oturma Odası', type: 'room', items: [] },
            { id: 'cont-uan-kitchen', name: 'Mutfak', type: 'room', items: [] }
        ]
    },
    
    // Mekan 11 - İzmir Annanem
    { 
        id: 'izmir-annanem', 
        type: 'space', 
        title: 'İzmir Annanem', 
        icon: 'home', 
        createdAt: now, 
        updatedAt: now, 
        parentId: 'spaces-folder', 
        isDeletable: true,
        order: 10,
        spaceType: 'residential',
        spaceAbbreviation: 'İAN',
        address: 'İzmir, Türkiye',
        hideAddressInUI: true,
        hideSpaceTypeInUI: false,
        containerInventory: [
            { id: 'cont-ian-main', name: 'Salon', type: 'room', items: [] },
            { id: 'cont-ian-bedroom', name: 'Yatak Odası', type: 'room', items: [] }
        ]
    },
];

export const socialUsers = [
  { id: 'user-1', name: 'Ahmet Yılmaz', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmet', status: 'online', lastSeen: 'Şimdi' },
  { id: 'user-2', name: 'Ayşe Demir', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ayse', status: 'offline', lastSeen: '2s önce' },
];

export const socialContent = [
  { id: 'post-1', userId: 'user-1', content: 'Bugün harika bir gün! #mutluluk', timestamp: '10dk önce', likes: 12, comments: 3 },
  { id: 'post-2', userId: 'user-2', content: 'Hafta sonu doğa yürüyüşü harikaydı. 🌲 #doğa #huzur', timestamp: '5s önce', likes: 56, comments: 4 },
];

// ========================================
// KEYBOARD SHORTCUTS, MACROS & GESTURES
// ========================================

export type KeyboardModifier = 'ctrl' | 'shift' | 'alt' | 'meta' | 'ctrlOrMeta';

export type KeyboardShortcut = {
  id: string;
  name: string;
  description: string;
  keys: string[]; // e.g., ['ctrl', 'k'] or ['shift', 'alt', 'p']
  action: string; // Action identifier
  category: 'navigation' | 'player' | 'editing' | 'view' | 'macro' | 'custom';
  isEnabled: boolean;
  isCustom?: boolean; // User-defined shortcut
  canBeOverridden?: boolean; // System shortcuts that can be modified
};

export type GestureType = 
  | 'swipe-left' 
  | 'swipe-right' 
  | 'swipe-up' 
  | 'swipe-down'
  | 'pinch-in' 
  | 'pinch-out'
  | 'two-finger-tap'
  | 'three-finger-tap'
  | 'long-press'
  | 'double-tap';

export type Gesture = {
  id: string;
  name: string;
  description: string;
  type: GestureType;
  action: string; // Action identifier
  isEnabled: boolean;
  sensitivity?: number; // 0-1 (for swipe/pinch)
  duration?: number; // ms (for long-press)
};

export type MacroActionType = 
  | 'navigate' // Navigate to item/folder
  | 'play' // Play video/audio
  | 'pause' // Pause playback
  | 'mute' // Mute audio
  | 'volume' // Set volume level
  | 'speed' // Set playback speed
  | 'skip' // Skip forward/backward
  | 'fullscreen' // Toggle fullscreen
  | 'layout' // Change layout mode
  | 'theme' // Change theme
  | 'execute-script' // Run custom script
  | 'open-url' // Open URL
  | 'create-item' // Create new item
  | 'delete-item' // Delete item
  | 'copy' // Copy item
  | 'paste' // Paste item
  | 'search' // Open search
  | 'ai-chat' // Open AI chat
  | 'screenshot' // Take screenshot
  | 'wait' // Wait for duration
  | 'custom'; // Custom action

export type MacroAction = {
  id: string;
  type: MacroActionType;
  parameters: Record<string, any>; // Action-specific parameters
  delay?: number; // Delay before execution (ms)
};

export type MacroDefinition = {
  id: string;
  name: string;
  description: string;
  icon?: string;
  color?: string; // Button color in macro pad
  category: string; // User-defined category
  actions: MacroAction[]; // Sequence of actions
  shortcut?: string[]; // Optional keyboard shortcut
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type MacroPadLayout = {
  id: string;
  name: string;
  columns: number; // Grid columns
  rows: number; // Grid rows
  buttonSize: 'small' | 'medium' | 'large';
  showLabels: boolean;
  showIcons: boolean;
  theme: 'dark' | 'light' | 'colorful';
  buttons: MacroPadButton[];
};

export type MacroPadButton = {
  id: string;
  position: { row: number; col: number }; // Grid position
  span?: { rows?: number; cols?: number }; // Spanning multiple cells
  macroId: string; // Reference to MacroDefinition
  customLabel?: string; // Override macro name
  customIcon?: string; // Override macro icon
  customColor?: string; // Override macro color
};

export type PlayerControlGroup = {
  id: string;
  name: string;
  type: 'smart' | 'defined'; // Smart = auto-detect players, Defined = specific players
  playerIds?: string[]; // For defined type
  controls: PlayerControlType[];
  layout: 'horizontal' | 'vertical' | 'grid';
  isPinned: boolean; // Pinned to player-controls-widget
  isPinnedToMiniMap: boolean; // Pinned to mini-map
  position?: { x: number; y: number }; // For mini-map pinning
};

export type PlayerControlType = 
  | 'play-pause'
  | 'stop'
  | 'previous'
  | 'next'
  | 'volume'
  | 'mute'
  | 'speed'
  | 'progress'
  | 'fullscreen'
  | 'pip' // Picture-in-picture
  | 'subtitle'
  | 'quality'
  | 'loop'
  | 'shuffle';

