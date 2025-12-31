import { AppData, UserProfile, Canvas, CanvasItem } from './schema';

const STORAGE_KEY = 'canvasflow_data_v2';

export const localDB = {
  saveData: (data: AppData) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  },

  loadData: (): AppData => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Failed to parse saved data', e);
        }
      }
    }
    return {
      user: null,
      canvases: [],
      items: {},
    };
  },

  clearData: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
};
