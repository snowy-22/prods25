import { ContentItem, CanvasDraft } from '@/lib/initial-content';

export const defaultDrafts: CanvasDraft[] = [
    {
        id: 'default-grid',
        name: 'Varsayılan Izgara',
        layout: {
            layoutMode: 'grid',
            gridSize: 320,
            columnCount: 4,
            rowCount: 3,
            gap: 16,
            borderRadius: 8,
            padding: 16,
        }
    }
];
