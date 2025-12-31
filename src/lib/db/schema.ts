export type UserProfile = {
  id: string;
  username: string;
  email?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
};

export type Canvas = {
  id: string;
  userId: string;
  title: string;
  description?: string;
  layoutMode: 'grid' | 'free' | 'masonry' | 'studio';
  settings: Record<string, any>;
  createdAt: string;
  updatedAt: string;
};

export type CanvasItem = {
  id: string;
  canvasId: string;
  type: string;
  title: string;
  content?: string;
  url?: string;
  metadata: Record<string, any>;
  position: { x: number; y: number; z: number };
  size: { width: number; height: number };
  order: number;
  assignedSpaceId?: string; // For assigning items to spaces
  deviceInfo?: {
    type?: 'phone' | 'tablet' | 'desktop' | 'tv' | 'iot';
    os?: string;
    browser?: string;
    ip?: string;
    sessionId?: string;
  };
  spaceInfo?: {
    location?: string;
    floor?: string;
    coordinates?: { lat: number; lng: number };
    capacity?: number;
    features?: string[];
  };
  productInfo?: {
    barcode?: string;
    sku?: string;
    category?: string;
    brand?: string;
    price?: number;
    currency?: string;
    aiAnalysis?: {
      detectedLabels?: string[];
      confidence?: number;
      webEntities?: Array<{ description: string; score: number }>;
    };
  };
  createdAt: string;
  updatedAt: string;
};

export type AppData = {
  user: UserProfile | null;
  canvases: Canvas[];
  items: Record<string, CanvasItem[]>; // canvasId -> items
};
