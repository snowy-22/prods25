import React from 'react';
import { TabGridLayout } from './tab-grid-layout';
import { useAppStore } from '../lib/store';
import { GRID_TEMPLATES } from '../lib/tab-grid-templates';

/**
 * TabGridViewportEditor: Integrates TabGridLayout with splitView state and provides a UI for editing the tab grid layout.
 * - Renders the current splitView using the selected grid template
 * - Allows future extension for template switching, drag-resize, and saving templates
 */
export const TabGridViewportEditor: React.FC = () => {
  const splitView = useAppStore(s => s.splitView);
  const setSplitView = useAppStore(s => s.setSplitView);
  // For now, use the template matching splitView.mode, fallback to first default
  const template = React.useMemo(() => {
    return (
      GRID_TEMPLATES.find(t => t.id === splitView.mode) || GRID_TEMPLATES[0]
    );
  }, [splitView.mode]);

  // Placeholder: handle section resize (future: drag-resize)
  const handleSectionResize = (sectionId: string, newSize: { width?: number; height?: number }) => {
    setSplitView({
      sections: splitView.sections.map(sec =>
        sec.id === sectionId ? { ...sec, ...newSize } : sec
      ),
    });
  };

  // Placeholder: render tab name or index in each cell
  return (
    <div className="p-4">
      <TabGridLayout
        template={template}
        sections={splitView.sections}
        onSectionResize={handleSectionResize}
        renderSectionContent={(section, cell) => (
          <div className="flex flex-col items-center justify-center h-full">
            <span className="font-semibold text-xs text-neutral-700">
              {section?.tabId || 'Empty'}
            </span>
            <span className="text-[10px] text-neutral-400">{cell.id}</span>
          </div>
        )}
      />
    </div>
  );
};

export default TabGridViewportEditor;
