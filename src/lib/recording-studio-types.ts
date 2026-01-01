/**
 * Recording Studio - Type Definitions
 * 
 * Milisaniye hassasiyetli otomasyon ve kayıt sistemi için tip tanımları
 */

export type ActionType = 
  | 'scroll'           // Scroll animasyonu
  | 'navigate'         // Sayfa/tab geçişi
  | 'style-change'     // Stil değişikliği
  | 'item-change'      // Öğe değişikliği
  | 'zoom'             // Zoom seviyesi değişikliği
  | 'layout-change'    // Layout modu değişikliği
  | 'item-add'         // Öğe ekleme
  | 'item-remove'      // Öğe silme
  | 'item-move'        // Öğe taşıma
  | 'animation'        // Özel animasyon
  | 'wait'             // Bekleme
  | 'camera-move';     // Kamera hareketi (canvas modu)

export type EasingFunction = 
  | 'linear'
  | 'ease-in'
  | 'ease-out'
  | 'ease-in-out'
  | 'ease-in-sine'
  | 'ease-out-sine'
  | 'ease-in-out-sine'
  | 'ease-in-quad'
  | 'ease-out-quad'
  | 'ease-in-out-quad'
  | 'ease-in-cubic'
  | 'ease-out-cubic'
  | 'ease-in-out-cubic'
  | 'ease-in-quart'
  | 'ease-out-quart'
  | 'ease-in-out-quart'
  | 'ease-in-expo'
  | 'ease-out-expo'
  | 'ease-in-out-expo'
  | 'bounce';

export interface Position {
  x: number; // Milimetrik hassasiyet için float
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface ActionBase {
  id: string;
  type: ActionType;
  startTime: number; // Milisaniye cinsinden başlangıç zamanı
  duration: number;  // Milisaniye cinsinden süre
  easing: EasingFunction;
  label?: string;    // Kullanıcı dostu etiket
}

export interface ScrollAction extends ActionBase {
  type: 'scroll';
  targetPosition: Position;
  smooth: boolean;
}

export interface NavigateAction extends ActionBase {
  type: 'navigate';
  targetItemId: string;
  targetTabId?: string;
  transition?: 'fade' | 'slide-left' | 'slide-right' | 'zoom';
}

export interface StyleChangeAction extends ActionBase {
  type: 'style-change';
  targetItemId: string;
  styleChanges: Record<string, any>;
  transitionDuration?: number;
}

export interface ItemChangeAction extends ActionBase {
  type: 'item-change';
  targetItemId: string;
  property: string;
  fromValue: any;
  toValue: any;
}

export interface ZoomAction extends ActionBase {
  type: 'zoom';
  fromZoom: number;
  toZoom: number;
}

export interface LayoutChangeAction extends ActionBase {
  type: 'layout-change';
  targetLayout: 'grid' | 'canvas';
}

export interface ItemAddAction extends ActionBase {
  type: 'item-add';
  itemData: any;
  parentId: string;
  position?: Position;
  animateIn?: 'fade' | 'scale' | 'slide';
}

export interface ItemRemoveAction extends ActionBase {
  type: 'item-remove';
  targetItemId: string;
  animateOut?: 'fade' | 'scale' | 'slide';
}

export interface ItemMoveAction extends ActionBase {
  type: 'item-move';
  targetItemId: string;
  fromPosition: Position;
  toPosition: Position;
}

export interface AnimationAction extends ActionBase {
  type: 'animation';
  targetItemId?: string;
  keyframes: Array<{
    time: number; // 0-1 arası normalize edilmiş zaman
    properties: Record<string, any>;
  }>;
}

export interface WaitAction extends ActionBase {
  type: 'wait';
  // Sadece duration kullanılır
}

export interface CameraMoveAction extends ActionBase {
  type: 'camera-move';
  fromPosition: Position;
  toPosition: Position;
  fromZoom?: number;
  toZoom?: number;
}

export type Action = 
  | ScrollAction
  | NavigateAction
  | StyleChangeAction
  | ItemChangeAction
  | ZoomAction
  | LayoutChangeAction
  | ItemAddAction
  | ItemRemoveAction
  | ItemMoveAction
  | AnimationAction
  | WaitAction
  | CameraMoveAction;

export interface Scene {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  actions: Action[];
  duration: number; // Toplam süre (milisaniye)
  createdAt: string;
  updatedAt: string;
}

export interface Timeline {
  id: string;
  name: string;
  description?: string;
  scenes: Scene[];
  totalDuration: number; // Tüm sahnelerin toplam süresi
  fps: number; // Kayıt için frame rate (default 60)
  resolution: {
    width: number;
    height: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PlaybackState {
  isPlaying: boolean;
  isPaused: boolean;
  currentTime: number; // Milisaniye
  currentSceneId: string | null;
  currentActionId: string | null;
  loop: boolean;
  speed: number; // 0.25x, 0.5x, 1x, 2x, 4x
}

export interface RecordingSettings {
  autoRecord: boolean; // Otomatik kayıt
  recordAudio: boolean;
  quality: 'low' | 'medium' | 'high' | 'ultra';
  format: 'webm' | 'mp4';
  countdown: number; // Kayıt öncesi geri sayım (saniye)
}

export interface AutomationState {
  timeline: Timeline | null;
  playbackState: PlaybackState;
  recordingSettings: RecordingSettings;
  isRecording: boolean;
  recordingStartTime: number | null;
  executedActions: string[]; // Çalıştırılan action ID'leri
}

export interface StudioProject {
  id: string;
  name: string;
  description?: string;
  timelines: Timeline[];
  activeTimelineId: string | null;
  createdAt: string;
  updatedAt: string;
}
