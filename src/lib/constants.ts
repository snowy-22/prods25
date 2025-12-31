export const MENU_H = 64;

export const DEFAULT_CHANNEL_LISTS = [
  {
    id: 'default-1',
    name: 'Örnek TV',
    author: 'Admin',
    items: [
      { id: '1', type: 'youtube', data: { url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk' } },
      { id: '2', type: 'youtube', data: { url: 'https://www.youtube.com/watch?v=l_0a8hOcC8c' } },
    ],
  },
];

export const WIDGET_DEFINITIONS = [
    { key: 'notes', name: 'Notlar', icon: 'StickyNote', type: 'notes' },
    { key: 'clock', name: 'Saat', icon: 'Clock', type: 'clock' },
    { key: 'calendar', name: 'Takvim', icon: 'Calendar', type: 'calendar' },
];

export const MINI_MENU_BUTTONS = [
    { key: 'menu', icon: 'PanelLeft' },
    { key: 'channels', icon: 'ListVideo' },
    { key: 'style', icon: 'Palette' },
    { key: 'widgets', icon: 'LayoutGrid' },
    { key: 'ai', icon: 'Sparkles' },
    { key: 'fullscreen', icon: 'Fullscreen' },
    { key: 'playall', icon: 'Play' },
    { key: 'muteall', icon: 'VolumeX' },
];
