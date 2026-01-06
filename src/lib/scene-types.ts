/**
 * Scene & Presentation Editor Types
 * High-quality scene editing, transitions, effects, and animations
 */

import { ContentItem } from './initial-content';

// =====================================================
// SCENE TYPES
// =====================================================

export type TransitionType = 
  | 'fade'
  | 'slide-left'
  | 'slide-right'
  | 'slide-up'
  | 'slide-down'
  | 'zoom-in'
  | 'zoom-out'
  | 'rotate'
  | 'flip'
  | 'scale-bounce'
  | 'blur'
  | 'pixelate'
  | 'wave'
  | 'curtain'
  | 'vignette'
  | 'morph';

export type EaseFunction = 
  | 'linear'
  | 'ease-in'
  | 'ease-out'
  | 'ease-in-out'
  | 'ease-in-quad'
  | 'ease-out-quad'
  | 'ease-in-cubic'
  | 'ease-out-cubic'
  | 'ease-in-elastic'
  | 'ease-out-elastic'
  | 'ease-in-back'
  | 'ease-out-back'
  | 'ease-in-bounce'
  | 'ease-out-bounce';

export interface TransitionEffect {
  id: string;
  type: TransitionType;
  duration: number; // milliseconds
  delay?: number;
  ease: EaseFunction;
  direction?: 'in' | 'out' | 'both';
  intensity?: number; // 0-100 for effects like blur, pixelate
  color?: string; // For fade with color overlay
  metadata?: Record<string, any>;
}

export interface AnimationKeyframe {
  id: string;
  timestamp: number; // milliseconds from scene start
  properties: {
    opacity?: number;
    scale?: number;
    rotation?: number;
    x?: number;
    y?: number;
    skewX?: number;
    skewY?: number;
    blur?: number;
    brightness?: number;
    contrast?: number;
    saturate?: number;
    hueRotate?: number;
    dropShadow?: {
      offsetX: number;
      offsetY: number;
      blur: number;
      color: string;
      opacity: number;
    };
    customCSS?: string;
  };
  ease: EaseFunction;
}

export interface Animation {
  id: string;
  item_id: string;
  name: string;
  description?: string;
  keyframes: AnimationKeyframe[];
  loop: boolean;
  loopCount?: number;
  autoPlay: boolean;
  startDelay: number; // milliseconds
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Scene {
  id: string;
  user_id: string;
  presentation_id: string;
  title: string;
  description?: string;
  
  // Content
  background?: {
    type: 'color' | 'image' | 'gradient' | 'video';
    value: string;
    opacity?: number;
    blur?: number;
  };
  items: ContentItem[]; // Scene items/layers
  
  // Dimensions
  width: number;
  height: number;
  aspectRatio?: string; // '16:9', '4:3', etc.
  
  // Duration & Timing
  duration: number; // milliseconds
  auto_advance: boolean;
  advance_delay?: number; // milliseconds
  
  // Transitions
  transition?: TransitionEffect;
  animations: Animation[];
  
  // Organization
  order: number;
  is_visible: boolean;
  is_locked: boolean;
  
  // Metadata
  tags: string[];
  metadata?: Record<string, any>;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  accessed_at?: string;
}

// =====================================================
// PRESENTATION TYPES
// =====================================================

export type PresentationMode = 'edit' | 'preview' | 'fullscreen' | 'slideshow';

export interface PresentationSettings {
  autoPlay: boolean;
  autoPlayDelay: number; // milliseconds between scenes
  loop: boolean;
  loopDelay: number;
  sceneTransitionOverride?: TransitionEffect;
  quality: 'low' | 'medium' | 'high' | 'ultra';
  recordingEnabled: boolean;
  analyticsEnabled: boolean;
  shareableLink?: string;
  password?: string;
}

export interface PresentationStatistics {
  views: number;
  totalDuration: number; // milliseconds
  completionRate: number; // 0-100
  avgWatchTime: number; // milliseconds
  lastViewed?: string;
  viewHistory: Array<{
    timestamp: string;
    duration: number;
    completionRate: number;
  }>;
}

export interface Presentation {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  
  // Scenes
  scenes: Scene[];
  total_duration: number; // milliseconds
  
  // Settings
  settings: PresentationSettings;
  
  // Content Stream
  stream_id?: string; // For broadcasting
  stream_url?: string;
  stream_key?: string;
  
  // Organization
  tags: string[];
  category?: string;
  is_draft: boolean;
  is_published: boolean;
  is_featured: boolean;
  
  // Metadata
  metadata?: Record<string, any>;
  custom_css?: string;
  
  // Statistics
  statistics?: PresentationStatistics;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  published_at?: string;
  archived_at?: string;
}

// =====================================================
// VIEWPORT EDITOR STATE
// =====================================================

export interface ViewportEditorState {
  // View
  currentSceneId: string;
  zoom: number; // 0.1 - 3.0
  panX: number;
  panY: number;
  
  // Selection
  selectedItemIds: string[];
  selectedAnimationId?: string;
  
  // Tools
  currentTool: 'select' | 'hand' | 'text' | 'shape' | 'animation' | 'transition';
  
  // Panels
  showLayers: boolean;
  showTimeline: boolean;
  showAnimations: boolean;
  showTransitions: boolean;
  showProperties: boolean;
  
  // Guides
  showGuides: boolean;
  showRulers: boolean;
  snapToGrid: boolean;
  gridSize: number;
  
  // Preview
  isPreviewMode: boolean;
  isFullscreen: boolean;

  // Editor extras
  remoteControls?: RemoteControlConfig[];
  codeSnapshots?: CodeSnapshot[];
}

export interface RemoteControlAction {
  id: string;
  label: string;
  action: string;
  payload?: Record<string, any>;
}

export interface RemoteControlConfig {
  id: string;
  name: string;
  target: 'scene' | 'folder' | 'item';
  targetId?: string;
  actions: RemoteControlAction[];
  isPinned?: boolean;
  metadata?: Record<string, any>;
}

export interface CodeSnapshot {
  sceneId: string;
  label: string;
  code: string;
  createdAt: string;
}

// =====================================================
// STREAM & BROADCAST
// =====================================================

export interface StreamSettings {
  platform: 'youtube' | 'twitch' | 'rtmp' | 'custom';
  resolution: '720p' | '1080p' | '1440p' | '4k';
  bitrate: number; // kbps
  fps: number; // 24, 30, 60
  audioEnabled: boolean;
  recordStream: boolean;
  saveReplay: boolean;
}

export interface BroadcastSession {
  id: string;
  presentation_id: string;
  user_id: string;
  stream_settings: StreamSettings;
  
  // Status
  status: 'idle' | 'starting' | 'live' | 'paused' | 'ended';
  started_at?: string;
  ended_at?: string;
  duration?: number; // milliseconds
  
  // Statistics
  viewers: number;
  peak_viewers: number;
  comments: number;
  likes: number;
  shares: number;
  
  // Recording
  recording_url?: string;
  replay_url?: string;
  
  metadata?: Record<string, any>;
}
