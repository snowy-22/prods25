/**
 * Philips Hue Integration Types
 * Personal API and Bridge Configuration
 * 
 * All personal Hue data stored in encrypted private database
 */

export interface HueBridge {
  id: string;
  bridgeId: string;
  ipAddress: string;
  port: number;
  username: string; // API token
  name: string;
  isConnected: boolean;
  lastSyncAt?: string;
  createdAt: string;
  updatedAt: string;
  userId: string; // Owner of the bridge
}

export interface HueLight {
  id: string;
  bridgeId: string;
  lightId: string;
  name: string;
  type: 'color' | 'dimmer' | 'switch' | 'unknown';
  state: {
    on: boolean;
    brightness: number; // 0-254
    saturation?: number; // 0-254
    hue?: number; // 0-65535
    colorTemp?: number;
  };
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HueScene {
  id: string;
  bridgeId: string;
  sceneId: string;
  name: string;
  lightsInScene: string[];
  createdAt: string;
  updatedAt: string;
}

export interface HueSync {
  id: string;
  bridgeId: string;
  itemId: string; // Canvas item this syncs with
  lightId: string;
  syncType: 'brightness' | 'color' | 'on-off' | 'custom';
  customRule?: string; // JSON-based rule for custom sync
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HueApiConfig {
  bridgeId: string;
  ipAddress: string;
  port: number;
  username: string;
}

export interface HueApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

export interface HueLightState {
  on: boolean;
  brightness?: number;
  saturation?: number;
  hue?: number;
  colorTemp?: number;
  transitionTime?: number;
}
