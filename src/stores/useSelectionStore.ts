// src/stores/useSelectionStore.ts

import create from 'zustand';
// ★ 修正: 'Node' のインポートを削除
import type { SelectionEntry } from '../types';
import { usePageStore } from './usePageStore';
import type { Node } from 'reactflow'; // ★ 修正: Node 型を reactflow からインポート

interface SelectionStoreState {
  selection: SelectionEntry[];
  activeTabId: string | null;
  activeLogicGraphId: string | null;
  
  // --- Actions ---
  resetSelection: () => void;
  handleItemSelect: (itemId: string, label: string) => void;
  handleNodeClick: (nodeId: string, label: string) => void;
  handleBackgroundClick: () => void;
  handleTabSelect: (tabId: string) => void;
  handleTabClose: (idToClose: string) => void;
  
  // --- ストア間通信用アクション ---
  updateTabLabel: (id: string, newLabel: string) => void;
  updateNodeTabLabels: (nodes: Node[]) => void;
}

const initialState = {
  selection: [],
  activeTabId: null,
  activeLogicGraphId: null,
};

export const useSelectionStore = create<SelectionStoreState>((set, get) => ({
  ...initialState,
  
  resetSelection: () => {
    set(initialState);
  },
  
  handleItemSelect: (itemId, label) => {
    set(state => {
      const exists = state.selection.find(s => s.id === itemId);
      if (exists) {
        return { activeTabId: itemId, activeLogicGraphId: itemId };
      }
      return {
        selection: [...state.selection, { id: itemId, type: 'item', label: `🔘 ${label}` }],
        activeTabId: itemId,
        activeLogicGraphId: itemId,
      };
    });
  },
  
  handleNodeClick: (nodeId, label) => {
    set(state => {
      const exists = state.selection.find(s => s.id === nodeId);
      if (exists) {
        return { activeTabId: nodeId };
      }
      return {
        selection: [...state.selection, { id: nodeId, type: 'node', label: label || 'ノード' }],
        activeTabId: nodeId,
      };
    });
  },
  
  handleBackgroundClick: () => {
    set({ activeTabId: null });
  },
  
  handleTabSelect: (tabId) => {
    set(state => {
      const entry = state.selection.find(s => s.id === tabId);
      if (entry && entry.type === 'item') {
        return { activeTabId: tabId, activeLogicGraphId: tabId };
      }
      return { activeTabId: tabId };
    });
  },
  
  handleTabClose: (idToClose) => {
    set(state => {
      const closedEntry = state.selection.find(s => s.id === idToClose);
      if (!closedEntry) return state;

      let newSelection = state.selection.filter(s => s.id !== idToClose);
      let newActiveTabId = state.activeTabId;
      if (state.activeTabId === idToClose) {
        newActiveTabId = null;
      }

      let newActiveLogicGraphId = state.activeLogicGraphId;
      
      // (★) ストア間通信: 閉じているのがロジックグラフの親アイテムか？
      if (closedEntry.type === 'item' && state.activeLogicGraphId === idToClose) {
        // PageStore からグラフ情報を取得 (getState)
        const pages = usePageStore.getState().pages;
        const selectedPageId = usePageStore.getState().selectedPageId;
        const graph = pages[selectedPageId!]?.allItemLogics[idToClose];
        
        if (graph) {
          const nodeIds = graph.nodes.map(n => n.id);
          newSelection = newSelection.filter(s => !nodeIds.includes(s.id));
          if (newActiveTabId && nodeIds.includes(newActiveTabId)) {
            newActiveTabId = null;
          }
        }
        newActiveLogicGraphId = null;
      }
      
      // (★) アイテムが閉じられたら、アイテムも削除する
      if (closedEntry.type === 'item') {
        usePageStore.getState().deleteItem(idToClose);
      }

      return {
        selection: newSelection,
        activeTabId: newActiveTabId,
        activeLogicGraphId: newActiveLogicGraphId,
      };
    });
  },

  // --- ストア間通信用アクション ---
  updateTabLabel: (id, newLabel) => {
    set(state => ({
      selection: state.selection.map(s => 
        s.id === id ? { ...s, label: s.type === 'item' ? `🔘 ${newLabel}` : newLabel } : s
      ),
    }));
  },
  
  updateNodeTabLabels: (nodes) => {
    set(state => {
      const newSel = [...state.selection];
      nodes.forEach(node => {
        const selEntry = newSel.find(s => s.id === node.id);
        if (selEntry && selEntry.label !== node.data.label) {
          selEntry.label = node.data.label;
        }
      });
      return { selection: newSel };
    });
  },
}));