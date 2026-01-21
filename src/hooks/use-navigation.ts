'use client';

import { useCallback, useMemo } from 'react';
import { ContentItem } from '@/lib/initial-content';
import { useAppStore } from '@/lib/store';

/**
 * Evrensel Navigasyon Hook'u
 * 
 * Tüm navigasyon işlemlerini merkezi bir yerden yönetir:
 * - Yeni sekmede aç
 * - Görünüm değiştir
 * - Geri/İleri git
 * - Tab yönetimi
 * 
 * @example
 * const { navigateTo, goBack, goForward, openInNewTab } = useNavigation();
 * navigateTo(item); // Mevcut sekmede aç
 * openInNewTab(item); // Yeni sekmede aç
 */

export interface NavigationOptions {
  /** Yeni sekmede mi açılsın */
  newTab?: boolean;
  /** Geçici sekme mi */
  temporary?: boolean;
  /** Animasyonlu geçiş */
  animated?: boolean;
  /** Callback: navigasyon tamamlandığında */
  onComplete?: () => void;
}

export interface NavigationState {
  /** Aktif tab ID */
  activeTabId: string;
  /** Aktif view ID */
  activeViewId: string;
  /** Geri gidilebilir mi */
  canGoBack: boolean;
  /** İleri gidilebilir mi */
  canGoForward: boolean;
  /** Mevcut geçmiş index'i */
  historyIndex: number;
  /** Geçmiş uzunluğu */
  historyLength: number;
  /** Breadcrumb navigasyon geçmişi */
  breadcrumbs: string[];
}

export interface UseNavigationReturn {
  // State
  state: NavigationState;
  
  // Actions
  /** Bir öğeye git (mevcut sekmede veya yeni sekmede) */
  navigateTo: (item: ContentItem, options?: NavigationOptions) => void;
  /** Yeni sekmede aç */
  openInNewTab: (item: ContentItem, temporary?: boolean) => void;
  /** Geri git */
  goBack: () => void;
  /** İleri git */
  goForward: () => void;
  /** Belirli bir geçmiş noktasına git */
  goToHistoryIndex: (index: number) => void;
  /** Undo */
  undo: () => void;
  /** Redo */
  redo: () => void;
  /** Sekmeyi kapat */
  closeTab: (tabId?: string) => void;
  /** Yeni sekme oluştur */
  createNewTab: () => void;
  /** Aktif sekmeyi değiştir */
  switchTab: (tabId: string) => void;
  /** Breadcrumb'dan navigasyon */
  navigateToBreadcrumb: (index: number) => void;
}

export function useNavigation(): UseNavigationReturn {
  const store = useAppStore();
  
  // Aktif tab ve view bilgisi
  const activeTab = useMemo(() => {
    return store.tabs.find(t => t.id === store.activeTabId);
  }, [store.tabs, store.activeTabId]);
  
  // Navigation state
  const state: NavigationState = useMemo(() => {
    const historyIndex = activeTab?.historyIndex ?? 0;
    const historyLength = activeTab?.history?.length ?? 0;
    const navHistory = activeTab?.navigationHistory ?? [];
    
    return {
      activeTabId: store.activeTabId,
      activeViewId: activeTab?.activeViewId ?? '',
      canGoBack: historyIndex > 0,
      canGoForward: historyIndex < historyLength - 1,
      historyIndex,
      historyLength,
      breadcrumbs: navHistory,
    };
  }, [store.activeTabId, activeTab]);

  // Tüm sidebar items'ı al (navigasyon için)
  const getAllItems = useCallback((): ContentItem[] => {
    // Store'dan tüm items'ı topla
    const allItems: ContentItem[] = [];
    
    store.tabs.forEach(tab => {
      if (tab.children) {
        allItems.push(...tab.children);
      }
    });
    
    return allItems;
  }, [store.tabs]);

  // Navigasyon: Bir öğeye git
  const navigateTo = useCallback((item: ContentItem, options?: NavigationOptions) => {
    const { newTab = false, temporary = false, onComplete } = options ?? {};
    
    if (newTab) {
      store.openInNewTab(item, getAllItems(), temporary);
    } else {
      // Mevcut tab'da görünümü değiştir
      if (activeTab) {
        store.updateTab(activeTab.id, {
          activeViewId: item.id,
        });
        store.pushNavigationHistory(activeTab.id, item.id);
      } else {
        // Tab yoksa yeni oluştur
        store.openInNewTab(item, getAllItems(), temporary);
      }
    }
    
    onComplete?.();
  }, [store, activeTab, getAllItems]);

  // Yeni sekmede aç
  const openInNewTab = useCallback((item: ContentItem, temporary = false) => {
    store.openInNewTab(item, getAllItems(), temporary);
  }, [store, getAllItems]);

  // Geri git
  const goBack = useCallback(() => {
    if (!activeTab || !state.canGoBack) return;
    
    const newIndex = state.historyIndex - 1;
    const history = activeTab.history ?? [];
    const targetViewId = history[newIndex];
    
    if (targetViewId) {
      store.updateTab(activeTab.id, {
        activeViewId: targetViewId,
        historyIndex: newIndex,
      });
    }
  }, [store, activeTab, state.canGoBack, state.historyIndex]);

  // İleri git
  const goForward = useCallback(() => {
    if (!activeTab || !state.canGoForward) return;
    
    const newIndex = state.historyIndex + 1;
    const history = activeTab.history ?? [];
    const targetViewId = history[newIndex];
    
    if (targetViewId) {
      store.updateTab(activeTab.id, {
        activeViewId: targetViewId,
        historyIndex: newIndex,
      });
    }
  }, [store, activeTab, state.canGoForward, state.historyIndex]);

  // Belirli geçmiş noktasına git
  const goToHistoryIndex = useCallback((index: number) => {
    if (!activeTab) return;
    
    const history = activeTab.history ?? [];
    if (index < 0 || index >= history.length) return;
    
    const targetViewId = history[index];
    if (targetViewId) {
      store.updateTab(activeTab.id, {
        activeViewId: targetViewId,
        historyIndex: index,
      });
    }
  }, [store, activeTab]);

  // Undo
  const undo = useCallback(() => {
    if (!activeTab) return;
    store.undo(activeTab.id);
  }, [store, activeTab]);

  // Redo
  const redo = useCallback(() => {
    if (!activeTab) return;
    store.redo(activeTab.id);
  }, [store, activeTab]);

  // Sekme kapat
  const closeTab = useCallback((tabId?: string) => {
    const targetTabId = tabId ?? store.activeTabId;
    store.closeTab(targetTabId);
  }, [store]);

  // Yeni sekme oluştur
  const createNewTab = useCallback(() => {
    store.createNewTab();
  }, [store]);

  // Sekme değiştir
  const switchTab = useCallback((tabId: string) => {
    store.setActiveTab(tabId);
  }, [store]);

  // Breadcrumb navigasyonu
  const navigateToBreadcrumb = useCallback((index: number) => {
    if (!activeTab) return;
    
    const navHistory = activeTab.navigationHistory ?? [];
    if (index < 0 || index >= navHistory.length) return;
    
    // Navigation history'yi kes
    const newNavHistory = navHistory.slice(0, index + 1);
    const targetViewId = navHistory[index];
    
    store.updateTab(activeTab.id, {
      activeViewId: targetViewId,
      navigationHistory: newNavHistory,
      navigationIndex: index,
    });
  }, [store, activeTab]);

  return {
    state,
    navigateTo,
    openInNewTab,
    goBack,
    goForward,
    goToHistoryIndex,
    undo,
    redo,
    closeTab,
    createNewTab,
    switchTab,
    navigateToBreadcrumb,
  };
}

export default useNavigation;
