import React from 'react';
import MultiSourceSearchPanel from './multi-source-search-panel';

export default function SearchPanelWrapper() {
  // Burada paneli modal, drawer veya sayfa olarak gösterebilirsiniz
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-6xl">
        <MultiSourceSearchPanel />
      </div>
    </div>
  );
}
