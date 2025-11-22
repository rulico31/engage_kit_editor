// src/stores/useSelectionStore.ts

import create from 'zustand';
import type { SelectionEntry } from '../types';
import type { Node } from 'reactflow';

interface SelectionStoreState {
  // ★ 変更: タブ管理と選択状態を分離
  tabs: SelectionEntry[];        // プロパティパネルに表示するタブ一覧（履歴）
  selectedIds: string[];         // キャンバス上で選択されているアイテムID一覧
  
  activeTabId: string | null;    // 現在プロパティパネルで表示中のタブID
  activeLogicGraphId: string | null; // ロジックエディタで表示する対象ID
  
  // --- Actions ---
  resetSelection: () => void;
  
  // アイテム選択時の処理（タブ追加 ＋ 選択状態更新）
  handleItemSelect: (itemId: string, label: string, multiSelect?: boolean) => void;
  
  // ノード選択時の処理
  handleNodeClick: (nodeId: string, label: string) => void;
  
  // 背景クリック（選択解除）
  handleBackgroundClick: () => void;
  
  // タブをクリックした時の処理（選択状態も切り替える）
  handleTabSelect: (tabId: string) => void;
  
  // タブを閉じる処理
  handleTabClose: (idToClose: string) => void;
  
  // 一括選択（レイヤーパネル等から）
  setSelection: (items: { id: string; label: string }[]) => void;

  // --- ストア間通信用アクション ---
  updateTabLabel: (id: string, newLabel: string) => void;
  updateNodeTabLabels: (nodes: Node[]) => void;
}

const initialState = {
  tabs: [],
  selectedIds: [],
  activeTabId: null,
  activeLogicGraphId: null,
};

export const useSelectionStore = create<SelectionStoreState>((set, get) => ({
  ...initialState,
  
  resetSelection: () => {
    // 全選択解除するが、タブは残すかどうか？
    // 通常「リセット」は選択解除を意味するので、selectedIdsのみクリアし、タブは残す方針とする
    // ただし、ページ切り替え時などはタブもクリアしたい場合があるため、
    // ここでは「完全リセット」として初期状態に戻す（タブも消える）
    set(initialState);
  },
  
  handleItemSelect: (itemId, label, multiSelect = false) => {
    set(state => {
      // 1. タブリストへの追加（まだ無ければ）
      let newTabs = [...state.tabs];
      const existingTabIndex = newTabs.findIndex(t => t.id === itemId);
      if (existingTabIndex === -1) {
        newTabs.push({ id: itemId, type: 'item', label: `🔘 ${label}` });
      }

      // 2. 選択状態の更新
      let newSelectedIds = [...state.selectedIds];
      const isAlreadySelected = newSelectedIds.includes(itemId);

      if (multiSelect) {
        // 複数選択モード: トグル
        if (isAlreadySelected) {
          newSelectedIds = newSelectedIds.filter(id => id !== itemId);
        } else {
          newSelectedIds.push(itemId);
        }
      } else {
        // 単一選択モード: これだけを選択
        newSelectedIds = [itemId];
      }

      // 3. アクティブタブの更新
      // 選択された(クリックされた)ものをアクティブにする
      // 解除された場合でも、そのアイテムがまだタブにあればアクティブのままにするか、
      // 最後に選択されたものをアクティブにするか。
      // ここではシンプルに「クリックしたものをアクティブ化」する（選択解除操作であってもタブは見せる）
      return {
        tabs: newTabs,
        selectedIds: newSelectedIds,
        activeTabId: itemId,
        activeLogicGraphId: itemId,
      };
    });
  },
  
  setSelection: (items) => {
    // レイヤーパネル等からの一括選択
    if (items.length === 0) {
      set({ selectedIds: [], activeTabId: null, activeLogicGraphId: null });
      return;
    }

    set(state => {
      let newTabs = [...state.tabs];
      const newSelectedIds = items.map(i => i.id);
      
      // タブにないものは追加
      items.forEach(item => {
        if (!newTabs.find(t => t.id === item.id)) {
          newTabs.push({ id: item.id, type: 'item', label: `🔘 ${item.label}` });
        }
      });

      const lastItem = items[items.length - 1];

      return {
        tabs: newTabs,
        selectedIds: newSelectedIds,
        activeTabId: lastItem.id,
        activeLogicGraphId: lastItem.id,
      };
    });
  },
  
  handleNodeClick: (nodeId, label) => {
    set(state => {
      // ノードもタブとして管理する
      let newTabs = [...state.tabs];
      if (!newTabs.find(t => t.id === nodeId)) {
        newTabs.push({ id: nodeId, type: 'node', label: label || 'ノード' });
      }

      return {
        tabs: newTabs,
        // ノード選択時はキャンバスアイテムの選択状態は維持する（または変更しない）
        activeTabId: nodeId,
      };
    });
  },
  
  handleBackgroundClick: () => {
    // 選択解除（タブは残す）
    set({ selectedIds: [], activeTabId: null });
  },
  
  handleTabSelect: (tabId) => {
    set(state => {
      const entry = state.tabs.find(s => s.id === tabId);
      
      // タブをクリックしたら、そのアイテムを「単一選択」状態にする
      let newSelectedIds = state.selectedIds;
      let newActiveLogicGraphId = state.activeLogicGraphId;

      if (entry && entry.type === 'item') {
        newSelectedIds = [tabId]; // 選択状態もこれ一つにする
        newActiveLogicGraphId = tabId;
      }
      
      return { 
        selectedIds: newSelectedIds,
        activeTabId: tabId, 
        activeLogicGraphId: newActiveLogicGraphId 
      };
    });
  },
  
  handleTabClose: (idToClose) => {
    set(state => {
      const closedEntry = state.tabs.find(s => s.id === idToClose);
      if (!closedEntry) return state;

      // タブ一覧から削除
      const newTabs = state.tabs.filter(s => s.id !== idToClose);
      
      // 選択状態からも削除
      const newSelectedIds = state.selectedIds.filter(id => id !== idToClose);

      // アクティブだった場合、別のタブへ移動
      let newActiveTabId = state.activeTabId;
      if (state.activeTabId === idToClose) {
        newActiveTabId = newTabs.length > 0 ? newTabs[newTabs.length - 1].id : null;
      }

      // ロジック表示対象の更新
      let newActiveLogicGraphId = state.activeLogicGraphId;
      if (closedEntry.type === 'item' && state.activeLogicGraphId === idToClose) {
        newActiveLogicGraphId = null;
        // 次のアクティブタブがアイテムなら、それをロジック対象にする
        const nextActive = newTabs.find(s => s.id === newActiveTabId);
        if (nextActive && nextActive.type === 'item') {
          newActiveLogicGraphId = nextActive.id;
        }
      }

      return {
        tabs: newTabs,
        selectedIds: newSelectedIds,
        activeTabId: newActiveTabId,
        activeLogicGraphId: newActiveLogicGraphId,
      };
    });
  },

  // --- ストア間通信用アクション ---
  updateTabLabel: (id, newLabel) => {
    set(state => ({
      tabs: state.tabs.map(s => 
        s.id === id ? { ...s, label: s.type === 'item' ? `🔘 ${newLabel}` : newLabel } : s
      ),
    }));
  },
  
  updateNodeTabLabels: (nodes) => {
    set(state => {
      const newTabs = [...state.tabs];
      nodes.forEach(node => {
        const tabEntry = newTabs.find(s => s.id === node.id);
        if (tabEntry && tabEntry.label !== node.data.label) {
          tabEntry.label = node.data.label;
        }
      });
      return { tabs: newTabs };
    });
  },
}));