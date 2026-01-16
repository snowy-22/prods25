// Windows 11 Snap Layouts benzeri grid şablonları ve tipleri

export interface GridCell {
  x: number; // %
  y: number; // %
  w: number; // %
  h: number; // %
}

export interface TabGridTemplate {
  id: string;
  name: string;
  layout: GridCell[];
  icon?: string;
  isDefault?: boolean;
}

export const GRID_TEMPLATES: TabGridTemplate[] = [
  {
    id: 'single',
    name: 'Tek Ekran',
    icon: '▢',
    isDefault: true,
    layout: [ { x:0, y:0, w:100, h:100 } ]
  },
  {
    id: 'split-2',
    name: '2\'li Bölünmüş',
    icon: '▥',
    isDefault: true,
    layout: [
      { x:0, y:0, w:50, h:100 },
      { x:50, y:0, w:50, h:100 }
    ]
  },
  {
    id: 'split-3',
    name: '3\'lü',
    icon: '▦',
    isDefault: true,
    layout: [
      { x:0, y:0, w:33.3, h:100 },
      { x:33.3, y:0, w:33.3, h:100 },
      { x:66.6, y:0, w:33.4, h:100 }
    ]
  },
  {
    id: 'grid-4',
    name: '4\'lü Izgara',
    icon: '▧',
    isDefault: true,
    layout: [
      { x:0, y:0, w:50, h:50 },
      { x:50, y:0, w:50, h:50 },
      { x:0, y:50, w:50, h:50 },
      { x:50, y:50, w:50, h:50 }
    ]
  },
  {
    id: 'big-small',
    name: 'Büyük + Küçük',
    icon: '▨',
    isDefault: true,
    layout: [
      { x:0, y:0, w:70, h:100 },
      { x:70, y:0, w:30, h:50 },
      { x:70, y:50, w:30, h:50 }
    ]
  },
  // Mobil stack örneği
  {
    id: 'mobile-stack',
    name: 'Mobil Stack',
    icon: '▤',
    isDefault: true,
    layout: [
      { x:0, y:0, w:100, h:33.3 },
      { x:0, y:33.3, w:100, h:33.3 },
      { x:0, y:66.6, w:100, h:33.4 }
    ]
  }
];
