// src/stores/useSelectionStore.ts

import { create } from 'zustand';
import type { SelectionEntry } from '../types';
import { usePageStore } from './usePageStore';

interface SelectionState {
  // Data
  selectedIds: string[];
  tabs: SelectionEntry[]; // プロパティパネルのタブとして使用
  activeTabId: string | null; // 現在表示中のプロパティタブID
  highlightedItemIds: string[]; // ハイライト表示するアイテムのID（WaitForClickノードのターゲット等）

  // Logic Editor state
  activeLogicGraphId: string | null;

  // Actions
  // 汎用的な選択アクション (Artboard等で使用)
  handleItemSelect: (id: string, label: string, isMulti: boolean) => void;
  handleBackgroundClick: () => void;

  // 低レベル/特定用途のアクション
  selectItem: (id: string, type?: 'item' | 'node', label?: string) => void;
  toggleSelection: (id: string, type?: 'item' | 'node', label?: string) => void;
  clearSelection: () => void;
  setSelection: (ids: string[]) => void;

  setActiveTabId: (id: string) => void;
  setActiveLogicGraphId: (id: string | null) => void;
  handleTabSelect: (id: string) => void;
  handleTabClose: (id: string) => void;
  updateTabLabel: (id: string, newLabel: string) => void;
  setHighlightedItems: (ids: string[]) => void;
  clearHighlightedItems: () => void;
}

export const useSelectionStore = create<SelectionState>((set, get) => ({
  selectedIds: [],
  tabs: [],
  activeTabId: null,
  activeLogicGraphId: null,
  highlightedItemIds: [],

  // アイテム選択のメインロジック（複数選択対応）
  handleItemSelect: (id, label, isMulti) => {
    const { selectedIds, tabs, activeTabId, activeLogicGraphId } = get();
    const currentPageId = usePageStore.getState().selectedPageId;

    if (isMulti) {
      const isSelected = selectedIds.includes(id);
      if (isSelected) {
        // 選択解除
        const newIds = selectedIds.filter(pid => pid !== id);
        const newTabs = tabs.filter(t => t.id !== id);

        // アクティブなタブが消えた場合、別のタブをアクティブにする
        let newActiveId = activeTabId;
        if (activeTabId === id) {
          newActiveId = newTabs.length > 0 ? newTabs[newTabs.length - 1].id : null;
        }

        // ロジックエディタのアクティブIDも同期させる
        let newActiveLogicId = activeLogicGraphId;
        if (activeLogicGraphId === id) {
          // 選択解除されたアイテムがロジック表示中だった場合、新しいアクティブタブに合わせる
          newActiveLogicId = newActiveId;
        }

        set({
          selectedIds: newIds,
          tabs: newTabs,
          activeTabId: newActiveId,
          activeLogicGraphId: newActiveLogicId
        });
      } else {
        // 追加選択
        set({
          selectedIds: [...selectedIds, id],
          tabs: [...tabs, { id, type: 'item', label, pageId: currentPageId || undefined }],
          activeTabId: id, // 新しく選択したものをアクティブに
          activeLogicGraphId: id // ★ロジックエディタもこのアイテムを表示
        });
      }
    } else {
      // 単一選択（アイテム選択は置き換え、タブは履歴として維持）
      const existingTab = tabs.find(t => t.id === id);
      let newTabs = tabs;
      if (!existingTab) {
        newTabs = [...tabs, { id, type: 'item', label, pageId: currentPageId || undefined }];
      }

      set({
        selectedIds: [id],
        tabs: newTabs,
        activeTabId: id,
        activeLogicGraphId: id // ★ロジックエディタもこのアイテムを表示
      });
    }
  },

  handleBackgroundClick: () => {
    set({
      selectedIds: [],
      // tabs: [], // タブ履歴は維持する
      activeTabId: null,
      activeLogicGraphId: null // ★ロジック表示もクリア
    });
  },

  selectItem: (id, type = 'item', label = '') => {
    const currentState = get();
    const currentPageId = usePageStore.getState().selectedPageId;

    // 既存タブ確認
    const existingTab = currentState.tabs.find(t => t.id === id);
    let newTabs = currentState.tabs;
    if (!existingTab) {
      newTabs = [...currentState.tabs, { id, type, label, pageId: currentPageId || undefined }];
    }

    set({
      selectedIds: [id],
      tabs: newTabs,
      activeTabId: id,
      // ノード選択時はactiveLogicGraphIdを変更しない(アイテム選択時のみ変更)
      activeLogicGraphId: type === 'node' ? currentState.activeLogicGraphId : id
    });
  },

  toggleSelection: (id, type = 'item', label = '') => {
    const state = get();
    const currentPageId = usePageStore.getState().selectedPageId;
    const isSelected = state.selectedIds.includes(id);

    if (isSelected) {
      const newIds = state.selectedIds.filter(pid => pid !== id);
      const newTabs = state.tabs.filter(t => t.id !== id);

      let newActiveId = state.activeTabId;
      if (state.activeTabId === id) {
        newActiveId = newTabs.length > 0 ? newTabs[newTabs.length - 1].id : null;
      }

      let newActiveLogicId = state.activeLogicGraphId;
      if (state.activeLogicGraphId === id) {
        newActiveLogicId = newActiveId;
      }

      set({
        selectedIds: newIds,
        tabs: newTabs,
        activeTabId: newActiveId,
        activeLogicGraphId: newActiveLogicId
      });
    } else {
      set({
        selectedIds: [...state.selectedIds, id],
        tabs: [...state.tabs, { id, type, label, pageId: currentPageId || undefined }],
        activeTabId: id,
        // ノード選択時はactiveLogicGraphIdを変更しない
        activeLogicGraphId: type === 'node' ? state.activeLogicGraphId : id
      });
    }
  },

  clearSelection: () => set({
    selectedIds: [],
    tabs: [],
    activeTabId: null,
    activeLogicGraphId: null
  }),

  setSelection: (ids) => set({ selectedIds: ids }), // 注: tabsの整合性は呼び出し元で管理が必要になる場合があります

  setActiveTabId: (id) => set({ activeTabId: id }),

  setActiveLogicGraphId: (id) => set({ activeLogicGraphId: id }),

  handleTabSelect: (id: string) => {
    const state = get();
    const tab = state.tabs.find(t => t.id === id);
    if (tab && tab.pageId) {
      const currentPageId = usePageStore.getState().selectedPageId;
      if (tab.pageId !== currentPageId) {
        usePageStore.getState().setSelectedPageId(tab.pageId);
      }
    }

    set({
      selectedIds: [id],
      activeTabId: id,
      activeLogicGraphId: id // タブ切り替え時にロジックエディタも同期
    });
  },

  handleTabClose: (id: string) => {
    const state = get();
    // 選択状態からも削除
    const newIds = state.selectedIds.filter(pid => pid !== id);
    const newTabs = state.tabs.filter(t => t.id !== id);

    // アクティブなタブが消えた場合、別のタブをアクティブにする
    let newActiveId = state.activeTabId;
    if (state.activeTabId === id) {
      newActiveId = newTabs.length > 0 ? newTabs[newTabs.length - 1].id : null;
    }

    // ロジックエディタのアクティブIDも同期させる
    let newActiveLogicId = state.activeLogicGraphId;
    if (state.activeLogicGraphId === id) {
      newActiveLogicId = newActiveId;
    }

    set({
      selectedIds: newIds,
      tabs: newTabs,
      activeTabId: newActiveId,
      activeLogicGraphId: newActiveLogicId
    });
  },

  updateTabLabel: (id: string, newLabel: string) => set((state) => ({
    tabs: state.tabs.map(tab => tab.id === id ? { ...tab, label: newLabel } : tab)
  })),

  setHighlightedItems: (ids: string[]) => set({ highlightedItemIds: ids }),

  clearHighlightedItems: () => set({ highlightedItemIds: [] }),
}));