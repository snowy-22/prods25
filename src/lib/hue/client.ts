/**
 * Philips Hue API Client
 * Local bridge ile ışıkları kontrol etmek için
 */

import axios, { AxiosInstance } from 'axios';

export interface HueLight {
  id: string;
  name: string;
  state: {
    on: boolean;
    bri?: number;      // 0-254
    hue?: number;      // 0-65535
    sat?: number;      // 0-254
    ct?: number;       // renk sıcaklığı
    xy?: [number, number];
    alert?: string;
    effect?: string;
  };
  type: string;
  modelid: string;
  manufacturername: string;
  productname: string;
}

export interface HueGroup {
  id: string;
  name: string;
  lights: string[];
  type: string;
  state: {
    on: boolean;
    bri?: number;
  };
}

export interface HueScene {
  id: string;
  name: string;
  lights: string[];
  group: string;
  type?: string;
  lastUpdated?: string;
}

export interface HueConfig {
  bridgeIP: string;
  apiKey: string;
}

export class PhilipsHueClient {
  private client: AxiosInstance;
  private bridgeIP: string;
  private apiKey: string;
  private baseURL: string;

  constructor(config: HueConfig) {
    this.bridgeIP = config.bridgeIP;
    this.apiKey = config.apiKey;
    this.baseURL = `http://${this.bridgeIP}/api/${this.apiKey}`;

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 5000,
    });
  }

  /**
   * Bridge'e bağlantı kontrolü
   */
  async checkConnection(): Promise<boolean> {
    try {
      const response = await this.client.get('/config');
      return !!response.data;
    } catch (error) {
      console.error('Hue Bridge bağlantı hatası:', error);
      return false;
    }
  }

  /**
   * Tüm ışıkları getir
   */
  async getLights(): Promise<Map<string, HueLight>> {
    try {
      const response = await this.client.get('/lights');
      const lights = new Map<string, HueLight>();

      for (const [id, light] of Object.entries(response.data)) {
        const lightData = light as any;
        lights.set(id, {
          id,
          name: lightData.name,
          state: lightData.state,
          type: lightData.type,
          modelid: lightData.modelid,
          manufacturername: lightData.manufacturername,
          productname: lightData.productname,
        });
      }

      return lights;
    } catch (error) {
      console.error('Işıkları getirme hatası:', error);
      return new Map();
    }
  }

  /**
   * Tek bir ışığın durumunu getir
   */
  async getLight(lightId: string): Promise<HueLight | null> {
    try {
      const response = await this.client.get(`/lights/${lightId}`);
      return {
        id: lightId,
        name: response.data.name,
        state: response.data.state,
        type: response.data.type,
        modelid: response.data.modelid,
        manufacturername: response.data.manufacturername,
        productname: response.data.productname,
      };
    } catch (error) {
      console.error(`Işık ${lightId} getirme hatası:`, error);
      return null;
    }
  }

  /**
   * Işığı açıp kapat
   */
  async setLightState(
    lightId: string,
    state: { on: boolean; bri?: number; hue?: number; sat?: number }
  ): Promise<boolean> {
    try {
      await this.client.put(`/lights/${lightId}/state`, state);
      return true;
    } catch (error) {
      console.error(`Işık ${lightId} durumu değiştirme hatası:`, error);
      return false;
    }
  }

  /**
   * Işığı aç
   */
  async turnOnLight(lightId: string): Promise<boolean> {
    return this.setLightState(lightId, { on: true });
  }

  /**
   * Işığı kapat
   */
  async turnOffLight(lightId: string): Promise<boolean> {
    return this.setLightState(lightId, { on: false });
  }

  /**
   * Işığın parlaklığını değiştir
   */
  async setBrightness(lightId: string, brightness: number): Promise<boolean> {
    if (brightness < 0 || brightness > 254) {
      console.error('Parlaklık 0-254 arasında olmalı');
      return false;
    }
    return this.setLightState(lightId, { on: brightness > 0, bri: brightness });
  }

  /**
   * Işığın rengini değiştir (Hue/Saturation)
   */
  async setColor(
    lightId: string,
    hue: number,
    saturation: number = 200
  ): Promise<boolean> {
    if (hue < 0 || hue > 65535 || saturation < 0 || saturation > 254) {
      console.error('Hue: 0-65535, Saturation: 0-254 arasında olmalı');
      return false;
    }
    return this.setLightState(lightId, { on: true, hue, sat: saturation });
  }

  /**
   * Renk adından hue değeri döndür
   */
  getHueFromColorName(colorName: string): number | null {
    const colors: Record<string, number> = {
      red: 0,
      orange: 5000,
      yellow: 12750,
      green: 25500,
      blue: 46920,
      purple: 54600,
      pink: 56100,
    };
    return colors[colorName.toLowerCase()] || null;
  }

  /**
   * Tüm grupları getir
   */
  async getGroups(): Promise<Map<string, HueGroup>> {
    try {
      const response = await this.client.get('/groups');
      const groups = new Map<string, HueGroup>();

      for (const [id, group] of Object.entries(response.data)) {
        const groupData = group as any;
        groups.set(id, {
          id,
          name: groupData.name,
          lights: groupData.lights,
          type: groupData.type,
          state: groupData.state,
        });
      }

      return groups;
    } catch (error) {
      console.error('Grupları getirme hatası:', error);
      return new Map();
    }
  }

  /**
   * Grubu kontrol et
   */
  async setGroupState(
    groupId: string,
    state: { on: boolean; bri?: number; hue?: number }
  ): Promise<boolean> {
    try {
      await this.client.put(`/groups/${groupId}/action`, state);
      return true;
    } catch (error) {
      console.error(`Grup ${groupId} durumu değiştirme hatası:`, error);
      return false;
    }
  }

  /**
   * Sahne (Scene) listesini getir
   */
  async getScenes(): Promise<Map<string, HueScene>> {
    try {
      const response = await this.client.get('/scenes');
      const scenes = new Map<string, HueScene>();

      for (const [id, scene] of Object.entries(response.data)) {
        const sceneData = scene as any;
        scenes.set(id, {
          id,
          name: sceneData.name,
          lights: sceneData.lights,
          group: sceneData.group,
          lastUpdated: sceneData.lastupdate,
        });
      }

      return scenes;
    } catch (error) {
      console.error('Sahneleri getirme hatası:', error);
      return new Map();
    }
  }

  /**
   * Sahne uygula
   */
  async activateScene(groupId: string, sceneId: string): Promise<boolean> {
    try {
      await this.client.put(`/groups/${groupId}/action`, { scene: sceneId });
      return true;
    } catch (error) {
      console.error(`Sahne ${sceneId} uygulama hatası:`, error);
      return false;
    }
  }

  /**
   * Işığın adını değiştir
   */
  async setLightName(lightId: string, name: string): Promise<boolean> {
    try {
      await this.client.put(`/lights/${lightId}`, { name });
      return true;
    } catch (error) {
      console.error(`Işık ${lightId} adı değiştirme hatası:`, error);
      return false;
    }
  }

  /**
   * Işığı kayıt altına al (alert effect)
   */
  async alertLight(lightId: string): Promise<boolean> {
    try {
      await this.client.put(`/lights/${lightId}/state`, { alert: 'select' });
      return true;
    } catch (error) {
      console.error(`Işık ${lightId} alert hatası:`, error);
      return false;
    }
  }
}

export default PhilipsHueClient;
