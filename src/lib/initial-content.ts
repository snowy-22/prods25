
import { CSSProperties } from "react";
import { IconName } from "./icons";
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { DeviceType, OsType, BrowserType } from '@/hooks/use-device';

export type ItemType = 'website' | 'image' | 'video' | 'audio' | 'pdf' | 'map' | 'folder' | 'list' | 'clock' | 'notes' | 'player' | 'calendar' | '3dplayer' | 'award' | 'todolist' | 'weather' | 'calculator' | 'currencyConverter' | 'unitConverter' | 'currencyRates' | 'playerControls' | 'navigation' | 'mediaHub' | 'aiImage' | 'inventory' | 'space' | 'file' | 'pharmacy' | 'trash-folder' | 'flowchart' | 'kanban' | 'swot' | 'fishbone' | '5s' | 'qfd' | 'processchart' | 'pmp' | 'rss' | 'devices' | 'profile-card' | 'profile-share' | 'mindmap' | 'financial-engineering' | 'book' | 'item' | 'saved-items' | 'alarm' | 'stopwatch' | 'timer' | 'world-clock' | 'pomodoro' | 'user-profile' | 'awards-folder' | 'spaces-folder' | 'devices-folder' | 'root' | 'match' | 'league-table' | 'fixture' | 'scan' | 'search' | 'todo' | 'social-feed' | 'user-list' | 'screenshot' | 'screen-recorder' | 'qrcode' | 'color-picker' | 'clipboard-manager' | 'gradient-generator' | 'lorem-ipsum' | 'business-model-canvas' | 'hue' | 'reservation' | 'purchase' | 'achievements' | 'training-module' | 'award-card' | 'new-tab';

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
  assignedSpaceId?: string; // To assign an item to a space
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
        { type: 'currencyConverter', title: 'Döviz Çevirici', icon: 'currencyConverter' },
        { type: 'currencyRates', title: 'Canlı Kurlar', icon: 'currencyRates' },
    ],
    "Araçlar": [
        { type: 'weather', title: 'Hava Durumu', icon: 'weather' },
        { type: 'calculator', title: 'Hesap Makinesi', icon: 'calculator' },
        { type: 'unitConverter', title: 'Birim Çevirici', icon: 'unitConverter' },
        { type: 'navigation', title: 'Navigasyon', icon: 'navigation' },
        { type: 'pharmacy', title: 'Nöbetçi Eczane', icon: 'pharmacy' },
        { type: 'screenshot', title: 'Ekran Görüntüsü', icon: 'camera' },
        { type: 'screen-recorder', title: 'Ekran Kaydı', icon: 'video' },
        { type: 'qrcode', title: 'QR Kod Üretici', icon: 'qrcode' },
        { type: 'color-picker', title: 'Renk Seçici', icon: 'palette' },
        { type: 'clipboard-manager', title: 'Pano Yöneticisi', icon: 'clipboard' },
        { type: 'gradient-generator', title: 'Gradient Üretici', icon: 'gradient' },
        { type: 'lorem-ipsum', title: 'Lorem Ipsum Üretici', icon: 'text' },
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
    { id: 'welcome-folder', type: 'folder', title: 'Hoş Geldiniz', icon: 'folder', createdAt: now, updatedAt: now, parentId: 'root', content: "CanvasFlow'a hoş geldiniz!", order: 2, styles: { width: '400px', height: '300px' } },
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
];

export const socialUsers = [
  { id: 'user-1', name: 'Ahmet Yılmaz', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmet', status: 'online', lastSeen: 'Şimdi' },
  { id: 'user-2', name: 'Ayşe Demir', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ayse', status: 'offline', lastSeen: '2s önce' },
];

export const socialContent = [
  { id: 'post-1', userId: 'user-1', content: 'Bugün harika bir gün! #mutluluk', timestamp: '10dk önce', likes: 12, comments: 3 },
  { id: 'post-2', userId: 'user-2', content: 'Hafta sonu doğa yürüyüşü harikaydı. 🌲 #doğa #huzur', timestamp: '5s önce', likes: 56, comments: 4 },
];

/**
 * Misafir kullanıcılar için özel başlangıç içeriği
 * - Tutorial klasörü ile uygulama özellikleri
 * - Demo widget'lar ve örnekler
 * - "Kayıt ol" teşvik mesajları
 */
export function getGuestInitialContent(): ContentItem[] {
  const now = new Date().toISOString();
  
  return [
    // Root klasör (misafir için)
    {
      id: 'root',
      type: 'root',
      title: 'Kitaplık',
      icon: 'library',
      createdAt: now,
      updatedAt: now,
      parentId: null,
      isDeletable: false,
      order: 0,
      content: 'Misafir olarak keşfediyorsunuz. Verileriniz cihazınızda saklanır.',
      styles: { width: '100%', height: '100%' }
    },
    
    // 1. Hoş Geldiniz & Tutorial Klasörü
    {
      id: 'guest-welcome',
      type: 'folder',
      title: '👋 CanvasFlow\'a Hoş Geldiniz!',
      icon: 'info',
      createdAt: now,
      updatedAt: now,
      parentId: 'root',
      isDeletable: false,
      order: 1,
      content: 'CanvasFlow ile dijital içeriklerinizi organize edin, widget\'lar ekleyin ve kişiselleştirin!',
      styles: { 
        width: '600px', 
        height: '400px',
        backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }
    },
    
    // Tutorial içerikleri
    {
      id: 'tutorial-1',
      type: 'notes',
      title: '📚 Nasıl Kullanılır?',
      icon: 'book-open',
      createdAt: now,
      updatedAt: now,
      parentId: 'guest-welcome',
      order: 1,
      content: `# CanvasFlow Kullanım Kılavuzu

## 🎯 Temel Özellikler

### 1. İçerik Ekleme
- **Sürükle-Bırak**: Herhangi bir URL'yi tuvalinize sürükleyin
- **Sağ Tıklama Menüsü**: Yeni klasör, video, widget ekleyin
- **Hızlı Ekleme**: Üst menüden "+" butonuna tıklayın

### 2. Düzenleme Modları
- **Grid Modu**: Otomatik düzenleme, responsive tasarım
- **Canvas Modu**: Serbest konumlandırma, sonsuz tuval

### 3. Widget'lar
- ⏰ Saat, ⏱️ Kronometre, 📝 Notlar, ✅ Yapılacaklar
- 🌤️ Hava Durumu, 💱 Döviz Kurları, 🧮 Hesap Makinesi
- Ve daha fazlası...

### 4. Organizasyon
- Klasörler ile içeriklerinizi düzenleyin
- Etiketler ve kategoriler ekleyin
- Arama ile hızlıca bulun

## 💾 Verileriniz
- Misafir modda verileriniz **cihazınızda** saklanır
- Kayıt olursanız verilerinizi **bulutta** senkronize edebilirsiniz
- Tüm cihazlarınızdan erişim sağlayabilirsiniz

## 🚀 Kayıt Olun!
Ücretsiz hesap oluşturarak:
- ☁️ Bulut senkronizasyonu
- 📱 Çoklu cihaz desteği
- 👥 İçerik paylaşımı
- 🔒 Güvenli yedekleme

özelliklerinden yararlanabilirsiniz!`,
      styles: { width: '500px', height: '600px' }
    },
    
    {
      id: 'tutorial-2',
      type: 'video',
      title: '🎥 Demo Video',
      icon: 'play',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Placeholder - gerçek demo videosu eklenebilir
      createdAt: now,
      updatedAt: now,
      parentId: 'guest-welcome',
      order: 2,
      content: 'CanvasFlow özelliklerini keşfedin',
      styles: { width: '640px', height: '360px' }
    },
    
    // 2. Örnek Widget'lar Klasörü
    {
      id: 'sample-widgets',
      type: 'folder',
      title: '🎨 Örnek Widget\'lar',
      icon: 'grid',
      createdAt: now,
      updatedAt: now,
      parentId: 'root',
      order: 2,
      content: 'Kullanabileceğiniz widget örnekleri',
      styles: { width: '800px', height: '600px' }
    },
    
    {
      id: 'sample-clock',
      type: 'clock',
      title: '⏰ Dijital Saat',
      icon: 'clock',
      createdAt: now,
      updatedAt: now,
      parentId: 'sample-widgets',
      order: 1,
      clockMode: 'digital',
      styles: { width: '300px', height: '200px' }
    },
    
    {
      id: 'sample-notes',
      type: 'notes',
      title: '📝 Notlar',
      icon: 'file-text',
      createdAt: now,
      updatedAt: now,
      parentId: 'sample-widgets',
      order: 2,
      content: '# Notlarınızı Buraya Yazın\n\nMarkdown formatını destekler:\n- **Kalın** metin\n- *İtalik* metin\n- [Linkler](https://example.com)\n- Başlıklar, listeler ve daha fazlası!',
      styles: { width: '400px', height: '300px' }
    },
    
    {
      id: 'sample-todo',
      type: 'todolist',
      title: '✅ Yapılacaklar',
      icon: 'check-square',
      createdAt: now,
      updatedAt: now,
      parentId: 'sample-widgets',
      order: 3,
      tasks: [
        { id: 'task-1', content: 'CanvasFlow\'u keşfet', completed: true, createdAt: now },
        { id: 'task-2', content: 'Kendi widget\'larını ekle', completed: false, createdAt: now },
        { id: 'task-3', content: 'Kayıt ol ve verileri senkronize et!', completed: false, createdAt: now }
      ],
      styles: { width: '350px', height: '400px' }
    },
    
    {
      id: 'sample-weather',
      type: 'weather',
      title: '🌤️ Hava Durumu',
      icon: 'cloud',
      createdAt: now,
      updatedAt: now,
      parentId: 'sample-widgets',
      order: 4,
      content: 'İstanbul',
      styles: { width: '300px', height: '200px' }
    },
    
    // 3. Demo İçerikler Klasörü
    {
      id: 'demo-content',
      type: 'folder',
      title: '🎬 Demo İçerikler',
      icon: 'folder',
      createdAt: now,
      updatedAt: now,
      parentId: 'root',
      order: 3,
      content: 'Video, müzik ve web sitesi örnekleri',
      styles: { width: '900px', height: '700px' }
    },
    
    {
      id: 'demo-youtube',
      type: 'video',
      title: '🎵 Lofi Müzik',
      icon: 'youtube',
      url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk',
      createdAt: now,
      updatedAt: now,
      parentId: 'demo-content',
      order: 1,
      content: 'Lofi Girl - beats to relax/study to',
      styles: { width: '640px', height: '360px' }
    },
    
    {
      id: 'demo-spotify',
      type: 'website',
      title: '🎧 Spotify Playlist',
      icon: 'music',
      url: 'https://open.spotify.com/track/7ouMYWpwJ422jRcDASZB7P',
      createdAt: now,
      updatedAt: now,
      parentId: 'demo-content',
      order: 2,
      content: 'Focus Flow - Spotify Playlist',
      styles: { width: '500px', height: '300px' }
    },
    
    {
      id: 'demo-map',
      type: 'map',
      title: '🗺️ Harita',
      icon: 'map-pin',
      url: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3010.2604822279044!2d28.97931331541988!3d41.01014997929786!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14cab9bd6570f4e1%3A0xe8d0f0b5f3f8b0!2sSultan%20Ahmed%20Mosque!5e0!3m2!1sen!2str!4v1234567890',
      createdAt: now,
      updatedAt: now,
      parentId: 'demo-content',
      order: 3,
      content: 'Sultan Ahmed Camii, İstanbul',
      styles: { width: '600px', height: '450px' }
    },
    
    // 4. Kayıt Teşvik Kartı
    {
      id: 'signup-cta',
      type: 'notes',
      title: '🚀 Hesap Oluştur',
      icon: 'user-plus',
      createdAt: now,
      updatedAt: now,
      parentId: 'root',
      isDeletable: false,
      order: 4,
      content: `# 💾 Verilerinizi Kaydedin!

Şu anda **misafir modda** geziniyorsunuz. Verileriniz sadece bu cihazda saklanıyor.

## ✨ Ücretsiz Hesap Oluşturun

### Avantajlar:
- ☁️ **Bulut Yedekleme**: Verilerinizi kaybetmeyin
- 📱 **Çoklu Cihaz**: Telefon, tablet, bilgisayar - her yerden erişin
- 👥 **Paylaşım**: İçeriklerinizi arkadaşlarınızla paylaşın
- 🔒 **Güvenli**: End-to-end şifreleme ile verileriniz güvende
- 🎨 **Kişiselleştirme**: Temalar, düzenler ve daha fazlası
- 🤖 **AI Asistan**: Yapay zeka destekli içerik önerileri

### Hemen Başlayın!
Sağ üst köşedeki **"Kayıt Ol"** butonuna tıklayın.

⚡ Google veya GitHub ile tek tıkla kayıt olabilirsiniz!`,
      styles: { 
        width: '500px', 
        height: '550px',
        backgroundColor: '#10b981',
        color: 'white'
      }
    },
    
    // 5. Çöp Kutusu
    {
      id: 'trash-folder',
      type: 'trash-folder',
      title: '🗑️ Çöp Kutusu',
      icon: 'trash-2',
      createdAt: now,
      updatedAt: now,
      parentId: 'root',
      isDeletable: false,
      order: 10,
      content: 'Silinen öğeler buraya taşınır',
      styles: { width: '400px', height: '300px' }
    }
  ];
}

/**
 * Kullanıcının misafir olup olmadığını kontrol eder
 * @param username Kullanıcı adı
 * @returns Misafir kullanıcı mı?
 */
export function isGuestUser(username: string | null): boolean {
  if (!username) return false;
  return username.startsWith('misafir-');
}

/**
 * Kullanıcı tipine göre uygun başlangıç içeriğini döndürür
 * @param username Kullanıcı adı (misafir kontrolü için)
 * @returns İçerik dizisi
 */
export function getInitialContentForUser(username: string | null): ContentItem[] {
  if (isGuestUser(username)) {
    return getGuestInitialContent();
  }
  return initialContent;
}
