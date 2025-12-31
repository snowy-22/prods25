export type GridItemType = 'youtube' | 'twitch' | 'iframe' | 'notes' | 'clock' | 'calendar';

export interface GridItem {
  id: string;
  type: GridItemType;
  data: any;
  colSpan?: number;
  rowSpan?: number;
  gridCol?: number;
  gridRow?: number;
  meta?: {
    title: string;
    author_name: string;
    thumbnail_url: string;
  }
}

export interface Playlist {
  id: string;
  name: string;
  author: string;
  items: GridItem[];
  isShared?: boolean;
}

export interface GridCellHandle {
  setPlayState: (play: boolean) => void;
  mute: () => void;
  unMute: () => void;
  setVolume: (volume: number) => void;
}

export type DragState = {
  type: 'drag' | 'resize';
  index: number;
  draggedIndex?: any;
  dropIndex?: any;
  initialX?: number;
  initialY?: number;
  initialW?: number;
  initialH?: number;
};

export type PanelState = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type PanelStates = {
  channels: PanelState;
  style: PanelState;
  mini: PanelState;
  ai: PanelState;
  widgets: PanelState;
  social: PanelState;
  analysis: PanelState;
  '3d': PanelState;
  presentation: PanelState;
  venues: PanelState;
};

export type NotesData = {
    content?: string;
    bgColor?: string;
    textColor?: string;
    fontSize?: number;
    fontFamily?: string;
    textAlign?: 'left' | 'center' | 'right';
};
