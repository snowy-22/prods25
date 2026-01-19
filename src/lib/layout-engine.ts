
import { ContentItem } from "./initial-content";
import { CSSProperties } from "react";

export type LayoutMode = 'grid' | 'canvas' | 'grid-vertical' | 'grid-square' | 'studio' | 'presentation' | 'stream' | 'free' | 'carousel';

export interface GridModeState {
  enabled: boolean;
  type: 'vertical' | 'square'; // vertical = 1 column, square = equal cols/rows
  columns: number;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
  paginationMode: 'pagination' | 'infinite'; // pagination = page-based, infinite = scroll-load
}

export interface GridPaginationInfo {
  currentPage: number;
  totalPages: number;
  itemsOnCurrentPage: number;
  totalItems: number;
  columns: number;
  rows: number;
  itemsPerPage: number;
  startIndex: number;
  endIndex: number;
}

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
    
    // Grid Vertical Mode: Single column vertical flow
    if (mode === 'grid-vertical') {
        return {
            styles: {
                gridColumn: 'span 1',
                gridRow: 'auto',
                aspectRatio: 'unset',
                position: 'relative',
                width: '100%',
                height: 'auto',
                zIndex: 1,
                minHeight: '160px',
                maxHeight: 'none'
            }
        };
    }

    // Grid Square Mode: Equal columns and responsive grid
    if (mode === 'grid-square' || mode === 'grid') {
        // Responsive threshold: container genişliğine göre maksimum span hesapla
        // XXL ekranlarda daha büyük grid size kullan
        const baseGridSize = containerWidth >= 2560 ? 480 : containerWidth >= 1920 ? 360 : 280;
        const gap = 24;
        const safeWidth = Math.max(containerWidth, 320);
        const maxColumns = Math.max(1, Math.floor((safeWidth + gap) / (baseGridSize + gap)));
        
        // Span değerlerini container genişliğine göre sınırla ve 1-4 arasında tut
        const requestedColSpan = item.gridSpanCol || 1;
        const requestedRowSpan = item.gridSpanRow || 1;
        const effectiveColSpan = Math.min(Math.max(1, requestedColSpan), Math.min(maxColumns, 4));
        const effectiveRowSpan = Math.min(Math.max(1, requestedRowSpan), 4);
        
        // Klasör kapakları için özel boyutlandırma
        const isFolderCover = item.type === 'folder' && (item as any).coverImage;
        const minHeight = isFolderCover ? '240px' : '200px';
        
        return {
            styles: {
                gridColumn: `span ${effectiveColSpan}`,
                gridRow: `span ${effectiveRowSpan}`,
                position: 'relative',
                width: '100%',
                height: '100%',
                zIndex: 1,
                minHeight,
                maxHeight: effectiveRowSpan > 2 ? 'none' : '600px'
            },
            className: isFolderCover ? 'folder-cover-grid-item' : undefined
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

/**
 * Grid Mode Pagination: Calculate pagination info for grid mode
 * @param totalItems Total number of items to display
 * @param columns Number of columns in grid (for square mode, rows = columns)
 * @param isSquareMode If true, rows = columns. If false, rows = 1 (vertical mode)
 * @param currentPage Current page number (1-indexed)
 * @returns Pagination info with page calculations
 */
export function calculateGridPagination(
    totalItems: number,
    columns: number,
    isSquareMode: boolean = false,
    currentPage: number = 1
): GridPaginationInfo {
    const rows = isSquareMode ? columns : 1;
    const itemsPerPage = columns * rows;
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
    const validPage = Math.max(1, Math.min(currentPage, totalPages));
    
    const startIndex = (validPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    const itemsOnCurrentPage = endIndex - startIndex;
    
    return {
        currentPage: validPage,
        totalPages,
        itemsOnCurrentPage,
        totalItems,
        columns,
        rows,
        itemsPerPage,
        startIndex,
        endIndex
    };
}

/**
 * Get paginated items for grid mode
 */
export function getPaginatedGridItems(
    items: ContentItem[],
    columns: number,
    isSquareMode: boolean,
    currentPage: number
): ContentItem[] {
    const pagination = calculateGridPagination(items.length, columns, isSquareMode, currentPage);
    return items.slice(pagination.startIndex, pagination.endIndex);
}
