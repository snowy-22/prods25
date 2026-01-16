import React from 'react';
import { TabGridTemplate, GridCell } from '../lib/tab-grid-templates';
import { useAppStore, SplitTabSection } from '../lib/store';
import { cn } from '../lib/utils';

// Props: active template, sections, onSectionMove/Resize, children render
export interface TabGridLayoutProps {
  template: TabGridTemplate;
  sections: SplitTabSection[];
  onSectionResize?: (sectionId: string, newSize: { width?: number; height?: number }) => void;
  onSectionMove?: (sectionId: string, newPos: { x: number; y: number }) => void;
  renderSectionContent?: (section: SplitTabSection, cell: GridCell) => React.ReactNode;
  className?: string;
}

// Utility: get section for cell (by index)
function getSectionForCell(sections: SplitTabSection[], cellIdx: number): SplitTabSection | undefined {
  return sections[cellIdx];
}

export const TabGridLayout: React.FC<TabGridLayoutProps> = ({
  template,
  sections,
  onSectionResize,
  onSectionMove,
  renderSectionContent,
  className
}) => {
  // Container size (could be made responsive)
  // For now, 100% width/height, relative positioning
  return (
    <div
      className={cn(
        'relative w-full h-full bg-neutral-100 rounded-lg overflow-hidden',
        'tab-grid-layout',
        className
      )}
      style={{ minHeight: 320 }}
    >
      {template.layout.map((cell, idx) => {
        const section = getSectionForCell(sections, idx);
        // Calculate absolute position/size as %
        const left = `${cell.x}%`;
        const top = `${cell.y}%`;
        const width = `${cell.w}%`;
        const height = `${cell.h}%`;
        return (
          <div
            key={idx}
            className={cn(
              'absolute bg-white border border-neutral-200 shadow-sm rounded-md transition-all',
              'tab-grid-cell',
              section?.tabId ? 'has-tab' : 'empty-cell'
            )}
            style={{ left, top, width, height, minWidth: 40, minHeight: 40 }}
            data-cell-idx={idx}
            data-section-id={section?.id}
          >
            {/* TODO: Add drag-resize handles here (step 5) */}
            {renderSectionContent
              ? renderSectionContent(section!, cell)
              : section?.tabId
                ? <div className="flex items-center justify-center h-full text-sm font-medium text-neutral-700">{section.tabId}</div>
                : <div className="flex items-center justify-center h-full text-neutral-400">Empty</div>
            }
          </div>
        );
      })}
    </div>
  );
};

export default TabGridLayout;
