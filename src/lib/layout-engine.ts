
import { ContentItem } from "./initial-content";
import { CSSProperties } from "react";

export type LayoutMode = 'grid' | 'canvas';

interface LayoutCalculation {
    styles: CSSProperties;
    className?: string;
}

interface LayoutOptions {
    carouselCenterIndex?: number;
}

export function calculateLayout(
    mode: LayoutMode,
    index: number,
    totalItems: number,
    containerWidth: number,
    containerHeight: number,
    item: ContentItem,
    options?: LayoutOptions
): LayoutCalculation {
    
    // Grid Mode: Responsive ızgara düzeninde organize edilmiş içerik
    if (mode === 'grid') {
        return {
            styles: {
                gridColumn: `span ${Math.min(item.gridSpanCol || 1, 4)}`,
                gridRow: `span ${Math.min(item.gridSpanRow || 1, 4)}`,
                aspectRatio: '1',
                position: 'relative',
                width: '100%',
                height: 'auto',
                zIndex: 1,
                minHeight: '160px',
                maxHeight: '600px'
            }
        };
    }

    // Canvas Mode: Sınırsız 2D tuval, özgür konumlandırma
    if (mode === 'canvas') {
        // Varsayılan pozisyon - yapılandırılmış ızgara stilinde başla
        const defaultWidth = item.width ?? 320;
        const defaultHeight = item.height ?? 240;
        const gap = 24;
        const safeContainerWidth = Math.max(containerWidth, 1200);
        const columns = Math.max(1, Math.floor((safeContainerWidth - gap) / (defaultWidth + gap)));
        const col = index % columns;
        const row = Math.floor(index / columns);

        const fallbackX = gap + col * (defaultWidth + gap);
        const fallbackY = gap + row * (defaultHeight + gap);

        const x = item.x ?? fallbackX;
        const y = item.y ?? fallbackY;
        const width = item.width ?? defaultWidth;
        const height = item.height ?? defaultHeight;
        const zIndex = (item.order ?? index) + 1;

        return {
            styles: {
                position: 'absolute',
                left: `${x}px`,
                top: `${y}px`,
                width: `${width}px`,
                height: `${height}px`,
                zIndex,
                minWidth: '120px',
                minHeight: '100px',
                maxWidth: '80vw',
                maxHeight: '80vh'
            }
        };
    }

    return { styles: {} };
}

// Collision Detection - İki nesnenin çakışıp çakışmadığını kontrol et
export function checkCollision(
    rect1: { x: number; y: number; width: number; height: number },
    rect2: { x: number; y: number; width: number; height: number },
    padding: number = 0
): boolean {
    return !(
        rect1.x + rect1.width + padding < rect2.x ||
        rect2.x + rect2.width + padding < rect1.x ||
        rect1.y + rect1.height + padding < rect2.y ||
        rect2.y + rect2.height + padding < rect1.y
    );
}

// Intelligent Positioning - Çakışmayan bir pozisyon bul
export function findNonOverlappingPosition(
    newItem: { width: number; height: number },
    existingItems: Array<{ x: number; y: number; width: number; height: number }>,
    containerWidth: number,
    containerHeight: number,
    startX: number = 24,
    startY: number = 24,
    padding: number = 12
): { x: number; y: number } {
    let x = startX;
    let y = startY;
    const gap = padding;
    const gridSize = 40;
    
    let attempts = 0;
    const maxAttempts = 100;
    
    while (attempts < maxAttempts) {
        const candidate = { x, y, width: newItem.width, height: newItem.height };
        const hasCollision = existingItems.some(item => checkCollision(candidate, item, gap));
        
        if (!hasCollision) {
            return { x: Math.round(x / gridSize) * gridSize, y: Math.round(y / gridSize) * gridSize };
        }
        
        x += newItem.width + gap;
        
        if (x + newItem.width > containerWidth - gap) {
            x = startX;
            y += newItem.height + gap;
        }
        
        if (y + newItem.height > containerHeight * 2) {
            break;
        }
        
        attempts++;
    }
    
    return { x: startX, y: startY };
}

// Grid Snap
export function snapToGrid(position: { x: number; y: number }, gridSize: number = 16): { x: number; y: number } {
    return {
        x: Math.round(position.x / gridSize) * gridSize,
        y: Math.round(position.y / gridSize) * gridSize
    };
}

// Alignment Helpers
export interface AlignmentGuide {
    type: 'vertical' | 'horizontal';
    position: number;
    offset: number;
    snappedItem: string;
}

export function getAlignmentGuides(
    movingItem: { x: number; y: number; width: number; height: number },
    otherItems: Array<{ id: string; x: number; y: number; width: number; height: number }>,
    threshold: number = 10
): AlignmentGuide[] {
    const guides: AlignmentGuide[] = [];
    
    otherItems.forEach(item => {
        const leftDiff = Math.abs(movingItem.x - item.x);
        if (leftDiff < threshold) {
            guides.push({
                type: 'vertical',
                position: item.x,
                offset: leftDiff,
                snappedItem: item.id
            });
        }
        
        const rightDiff = Math.abs((movingItem.x + movingItem.width) - (item.x + item.width));
        if (rightDiff < threshold) {
            guides.push({
                type: 'vertical',
                position: item.x + item.width - movingItem.width,
                offset: rightDiff,
                snappedItem: item.id
            });
        }
        
        const movingCenter = movingItem.x + movingItem.width / 2;
        const itemCenter = item.x + item.width / 2;
        const centerDiff = Math.abs(movingCenter - itemCenter);
        if (centerDiff < threshold) {
            guides.push({
                type: 'vertical',
                position: itemCenter - movingItem.width / 2,
                offset: centerDiff,
                snappedItem: item.id
            });
        }
        
        const topDiff = Math.abs(movingItem.y - item.y);
        if (topDiff < threshold) {
            guides.push({
                type: 'horizontal',
                position: item.y,
                offset: topDiff,
                snappedItem: item.id
            });
        }
        
        const bottomDiff = Math.abs((movingItem.y + movingItem.height) - (item.y + item.height));
        if (bottomDiff < threshold) {
            guides.push({
                type: 'horizontal',
                position: item.y + item.height - movingItem.height,
                offset: bottomDiff,
                snappedItem: item.id
            });
        }
        
        const movingVCenter = movingItem.y + movingItem.height / 2;
        const itemVCenter = item.y + item.height / 2;
        const vCenterDiff = Math.abs(movingVCenter - itemVCenter);
        if (vCenterDiff < threshold) {
            guides.push({
                type: 'horizontal',
                position: itemVCenter - movingItem.height / 2,
                offset: vCenterDiff,
                snappedItem: item.id
            });
        }
    });
    
    const verticalGuides = guides.filter(g => g.type === 'vertical').sort((a, b) => a.offset - b.offset);
    const horizontalGuides = guides.filter(g => g.type === 'horizontal').sort((a, b) => a.offset - b.offset);
    
    return [
        ...(verticalGuides.length > 0 ? [verticalGuides[0]] : []),
        ...(horizontalGuides.length > 0 ? [horizontalGuides[0]] : [])
    ];
}

// Distance Measurement
export function measureDistance(
    point1: { x: number; y: number },
    point2: { x: number; y: number }
): number {
    return Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2));
}

export function measureRectDistance(
    rect1: { x: number; y: number; width: number; height: number },
    rect2: { x: number; y: number; width: number; height: number }
): number {
    const center1 = { x: rect1.x + rect1.width / 2, y: rect1.y + rect1.height / 2 };
    const center2 = { x: rect2.x + rect2.width / 2, y: rect2.y + rect2.height / 2 };
    return measureDistance(center1, center2);
}
