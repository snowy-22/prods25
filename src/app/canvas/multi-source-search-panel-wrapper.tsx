import dynamic from 'next/dynamic';

const MultiSourceSearchPanel = dynamic(() => import('@/components/search/multi-source-search-panel'), { ssr: false });

export default function MultiSourceSearchPanelWrapper() {
  return (
    <div className="fixed top-0 left-0 w-full z-50 flex justify-center pointer-events-none">
      <div className="w-full max-w-5xl pointer-events-auto">
        <MultiSourceSearchPanel />
      </div>
    </div>
  );
}
