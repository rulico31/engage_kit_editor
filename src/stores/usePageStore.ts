// src/stores/usePageStore.ts

import create from 'zustand';
import { 
  applyNodeChanges, 
  applyEdgeChanges, 
  addEdge,
  type NodeChange,
  type EdgeChange,
  type Connection,
  type Node
  // 修正: 未使用の 'type Edge' を削除しました
} from 'reactflow';
import type { PlacedItemType, NodeGraph, ProjectData } from '../types';
import { useSelectionStore } from './useSelectionStore';

// Undo/Redo履歴の最大数
const MAX_HISTORY = 20;

interface HistoryState {
  placedItems: PlacedItemType[];
}

interface PageStoreState {
  // 複数ページ管理
  pages: Record<string, {
    id: string;
    name: string;
    placedItems: PlacedItemType[];
    allItemLogics: Record<string, NodeGraph>;
  }>;
  pageOrder: string[];
  selectedPageId: string | null;

  // 履歴管理
  history: HistoryState[];
  historyIndex: number;
  canUndo: boolean;
  canRedo: boolean;

  // Actions
  setSelectedPageId: (pageId: string) => void;
  addPage: () => void;
  deletePage: (pageId: string) => void;
  updatePageName: (pageId: string, name: string) => void;
  
  // アイテム操作
  addItem: (item: PlacedItemType) => void;
  updateItem: (id: string, updates: Partial<PlacedItemType> | { data: any }, addToHistory?: boolean) => void;
  updateItems: (updates: { id: string, props: Partial<PlacedItemType> }[], addToHistory?: boolean) => void;
  deleteItems: (ids: string[]) => void;
  
  // グループ化
  groupItems: (ids: string[]) => void;
  ungroupItems: (groupId: string) => void;
  
  // 重なり順
  moveItemToFront: (id: string) => void;
  moveItemToBack: (id: string) => void;
  moveItemForward: (id: string) => void;
  moveItemBackward: (id: string) => void;

  // ノード操作 (基本)
  updateNodeData: (nodeId: string, data: any) => void;
  setLogicGraph: (itemId: string, graph: NodeGraph) => void;

  // React Flow グラフ操作用アクション
  applyNodesChange: (changes: NodeChange[]) => void;
  applyEdgesChange: (changes: EdgeChange[]) => void;
  applyConnect: (connection: Connection) => void;
  addNodeToCurrentGraph: (node: Node) => void;

  // 履歴操作
  commitHistory: () => void;
  undo: () => void;
  redo: () => void;

  // データロード
  loadFromData: (data: ProjectData) => void;
}

export const usePageStore = create<PageStoreState>((set, get) => ({
  // 初期状態
  pages: {
    "page-1": {
      id: "page-1",
      name: "Page 1",
      placedItems: [],
      allItemLogics: {}
    }
  },
  pageOrder: ["page-1"],
  selectedPageId: "page-1",
  
  history: [],
  historyIndex: -1,
  canUndo: false,
  canRedo: false,

  // --- ページ管理 ---
  setSelectedPageId: (pageId) => set({ selectedPageId: pageId }),
  
  addPage: () => {
    const newId = `page-${Date.now()}`;
    set(state => ({
      pages: {
        ...state.pages,
        [newId]: { id: newId, name: `Page ${state.pageOrder.length + 1}`, placedItems: [], allItemLogics: {} }
      },
      pageOrder: [...state.pageOrder, newId],
      selectedPageId: newId
    }));
  },

  deletePage: (pageId) => {
    const { pageOrder, pages } = get();
    if (pageOrder.length <= 1) return; 
    
    const newOrder = pageOrder.filter(id => id !== pageId);
    const newPages = { ...pages };
    delete newPages[pageId];
    
    set({
      pages: newPages,
      pageOrder: newOrder,
      selectedPageId: newOrder[0]
    });
  },

  updatePageName: (pageId, name) => {
    set(state => ({
      pages: {
        ...state.pages,
        [pageId]: { ...state.pages[pageId], name }
      }
    }));
  },

  // --- データロード ---
  loadFromData: (data: ProjectData) => {
    set({
      pages: data.pages,
      pageOrder: data.pageOrder,
      selectedPageId: data.pageOrder[0] || null,
      history: [],
      historyIndex: -1,
      canUndo: false,
      canRedo: false,
    });
  },

  // --- アイテム操作 ---
  addItem: (item) => {
    set(state => {
      const pageId = state.selectedPageId!;
      const page = state.pages[pageId];
      const newItems = [...page.placedItems, item];
      
      return {
        pages: { ...state.pages, [pageId]: { ...page, placedItems: newItems } }
      };
    });
    get().commitHistory();
  },

  updateItem: (id, updates, addToHistory = false) => {
    set(state => {
      const pageId = state.selectedPageId!;
      const page = state.pages[pageId];
      
      const newItems = page.placedItems.map(item => {
        if (item.id !== id) return item;
        if ('data' in updates) {
          return {
            ...item,
            ...updates,
            data: { ...item.data, ...updates.data }
          };
        }
        return { ...item, ...updates } as PlacedItemType;
      });

      return {
        pages: { ...state.pages, [pageId]: { ...page, placedItems: newItems } }
      };
    });
    if (addToHistory) get().commitHistory();
  },

  updateItems: (updatesList, addToHistory = false) => {
    set(state => {
      const pageId = state.selectedPageId!;
      const page = state.pages[pageId];
      const newItems = [...page.placedItems];

      updatesList.forEach(({ id, props }) => {
        const idx = newItems.findIndex(i => i.id === id);
        if (idx !== -1) {
          newItems[idx] = { ...newItems[idx], ...props };
        }
      });

      return {
        pages: { ...state.pages, [pageId]: { ...page, placedItems: newItems } }
      };
    });
    if (addToHistory) get().commitHistory();
  },

  deleteItems: (ids) => {
    set(state => {
      const pageId = state.selectedPageId!;
      const page = state.pages[pageId];
      const newItems = page.placedItems.filter(i => !ids.includes(i.id));
      
      return {
        pages: { ...state.pages, [pageId]: { ...page, placedItems: newItems } }
      };
    });
    get().commitHistory();
  },

  // --- グループ化 ---
  groupItems: (ids) => {
    const { pages, selectedPageId } = get();
    const page = pages[selectedPageId!];
    const items = page.placedItems;
    
    const targets = items.filter(i => ids.includes(i.id));
    if (targets.length < 2) return;

    const minX = Math.min(...targets.map(t => t.x));
    const minY = Math.min(...targets.map(t => t.y));
    const maxX = Math.max(...targets.map(t => t.x + t.width));
    const maxY = Math.max(...targets.map(t => t.y + t.height));

    const groupId = `group-${Date.now()}`;
    const groupItem: PlacedItemType = {
      id: groupId,
      name: "Group",
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      data: { text: "", src: null, showBorder: false, isTransparent: true, initialVisibility: true }
    };

    const newItems = items.map(item => {
      if (ids.includes(item.id)) {
        return { ...item, groupId: groupId };
      }
      return item;
    });

    set(state => ({
      pages: { ...state.pages, [selectedPageId!]: { ...page, placedItems: [...newItems, groupItem] } }
    }));
    get().commitHistory();
  },

  ungroupItems: (targetId) => {
    set(state => {
      const pageId = state.selectedPageId!;
      const page = state.pages[pageId];
      
      let groupId = targetId;
      const targetItem = page.placedItems.find(i => i.id === targetId);
      if (targetItem?.groupId) groupId = targetItem.groupId;
      
      if (!targetId.startsWith("group") && !targetItem?.groupId) return state;

      const newItems = page.placedItems.map(item => {
        if (item.groupId === groupId) {
          return { ...item, groupId: undefined };
        }
        return item;
      }).filter(item => item.id !== groupId);

      return {
        pages: { ...state.pages, [pageId]: { ...page, placedItems: newItems } }
      };
    });
    get().commitHistory();
  },

  // --- 重なり順 ---
  moveItemToFront: (id) => {
    set(state => {
      const pageId = state.selectedPageId!;
      const items = [...state.pages[pageId].placedItems];
      const idx = items.findIndex(i => i.id === id);
      if (idx === -1) return state;
      const [item] = items.splice(idx, 1);
      items.push(item);
      return { pages: { ...state.pages, [pageId]: { ...state.pages[pageId], placedItems: items } } };
    });
  },
  moveItemToBack: (id) => {
    set(state => {
      const pageId = state.selectedPageId!;
      const items = [...state.pages[pageId].placedItems];
      const idx = items.findIndex(i => i.id === id);
      if (idx === -1) return state;
      const [item] = items.splice(idx, 1);
      items.unshift(item);
      return { pages: { ...state.pages, [pageId]: { ...state.pages[pageId], placedItems: items } } };
    });
  },
  moveItemForward: (id) => {
    set(state => {
      const pageId = state.selectedPageId!;
      const items = [...state.pages[pageId].placedItems];
      const idx = items.findIndex(i => i.id === id);
      if (idx === -1 || idx === items.length - 1) return state;
      [items[idx], items[idx + 1]] = [items[idx + 1], items[idx]];
      return { pages: { ...state.pages, [pageId]: { ...state.pages[pageId], placedItems: items } } };
    });
  },
  moveItemBackward: (id) => {
    set(state => {
      const pageId = state.selectedPageId!;
      const items = [...state.pages[pageId].placedItems];
      const idx = items.findIndex(i => i.id === id);
      if (idx === -1 || idx === 0) return state;
      [items[idx - 1], items[idx]] = [items[idx], items[idx - 1]];
      return { pages: { ...state.pages, [pageId]: { ...state.pages[pageId], placedItems: items } } };
    });
  },

  // --- ノード操作 (基本) ---
  updateNodeData: (nodeId, data) => {
    set(state => {
      const pageId = state.selectedPageId!;
      const page = state.pages[pageId];
      const newLogics = { ...page.allItemLogics };
      
      Object.keys(newLogics).forEach(itemId => {
        const graph = newLogics[itemId];
        const nodeIndex = graph.nodes.findIndex(n => n.id === nodeId);
        if (nodeIndex !== -1) {
          const newNodes = [...graph.nodes];
          newNodes[nodeIndex] = {
            ...newNodes[nodeIndex],
            data: { ...newNodes[nodeIndex].data, ...data }
          };
          newLogics[itemId] = { ...graph, nodes: newNodes };
        }
      });
      return { pages: { ...state.pages, [pageId]: { ...page, allItemLogics: newLogics } } };
    });
  },

  setLogicGraph: (itemId, graph) => {
    set(state => {
      const pageId = state.selectedPageId!;
      return {
        pages: {
          ...state.pages,
          [pageId]: {
            ...state.pages[pageId],
            allItemLogics: {
              ...state.pages[pageId].allItemLogics,
              [itemId]: graph
            }
          }
        }
      };
    });
  },

  // --- React Flow グラフ操作 ---
  applyNodesChange: (changes) => {
    set(state => {
      const pageId = state.selectedPageId!;
      const activeGraphId = useSelectionStore.getState().activeLogicGraphId;
      if (!activeGraphId) return state;

      const page = state.pages[pageId];
      const currentGraph = page.allItemLogics[activeGraphId] || { nodes: [], edges: [] };
      const newNodes = applyNodeChanges(changes, currentGraph.nodes);

      return {
        pages: {
          ...state.pages,
          [pageId]: {
            ...page,
            allItemLogics: {
              ...page.allItemLogics,
              [activeGraphId]: { ...currentGraph, nodes: newNodes }
            }
          }
        }
      };
    });
  },

  applyEdgesChange: (changes) => {
    set(state => {
      const pageId = state.selectedPageId!;
      const activeGraphId = useSelectionStore.getState().activeLogicGraphId;
      if (!activeGraphId) return state;

      const page = state.pages[pageId];
      const currentGraph = page.allItemLogics[activeGraphId] || { nodes: [], edges: [] };
      const newEdges = applyEdgeChanges(changes, currentGraph.edges);

      return {
        pages: {
          ...state.pages,
          [pageId]: {
            ...page,
            allItemLogics: {
              ...page.allItemLogics,
              [activeGraphId]: { ...currentGraph, edges: newEdges }
            }
          }
        }
      };
    });
  },

  applyConnect: (connection) => {
    set(state => {
      const pageId = state.selectedPageId!;
      const activeGraphId = useSelectionStore.getState().activeLogicGraphId;
      if (!activeGraphId) return state;

      const page = state.pages[pageId];
      const currentGraph = page.allItemLogics[activeGraphId] || { nodes: [], edges: [] };
      const newEdges = addEdge(connection, currentGraph.edges);

      return {
        pages: {
          ...state.pages,
          [pageId]: {
            ...page,
            allItemLogics: {
              ...page.allItemLogics,
              [activeGraphId]: { ...currentGraph, edges: newEdges }
            }
          }
        }
      };
    });
  },

  addNodeToCurrentGraph: (node) => {
    set(state => {
      const pageId = state.selectedPageId!;
      const activeGraphId = useSelectionStore.getState().activeLogicGraphId;
      if (!activeGraphId) return state;

      const page = state.pages[pageId];
      const currentGraph = page.allItemLogics[activeGraphId] || { nodes: [], edges: [] };
      
      return {
        pages: {
          ...state.pages,
          [pageId]: {
            ...page,
            allItemLogics: {
              ...page.allItemLogics,
              [activeGraphId]: { 
                ...currentGraph, 
                nodes: [...currentGraph.nodes, node] 
              }
            }
          }
        }
      };
    });
  },

  // --- 履歴管理 ---
  commitHistory: () => {
    set(state => {
      const pageId = state.selectedPageId;
      if (!pageId) return state;
      
      const currentItems = state.pages[pageId].placedItems;
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      
      newHistory.push({ placedItems: JSON.parse(JSON.stringify(currentItems)) });
      
      if (newHistory.length > MAX_HISTORY) newHistory.shift();
      
      return {
        history: newHistory,
        historyIndex: newHistory.length - 1,
        canUndo: true,
        canRedo: false
      };
    });
  },

  undo: () => {
    set(state => {
      if (state.historyIndex <= 0) return state;
      const newIndex = state.historyIndex - 1;
      const pageId = state.selectedPageId!;
      
      return {
        historyIndex: newIndex,
        pages: {
          ...state.pages,
          [pageId]: { ...state.pages[pageId], placedItems: state.history[newIndex].placedItems }
        },
        canUndo: newIndex > 0,
        canRedo: true
      };
    });
  },

  redo: () => {
    set(state => {
      if (state.historyIndex >= state.history.length - 1) return state;
      const newIndex = state.historyIndex + 1;
      const pageId = state.selectedPageId!;

      return {
        historyIndex: newIndex,
        pages: {
          ...state.pages,
          [pageId]: { ...state.pages[pageId], placedItems: state.history[newIndex].placedItems }
        },
        canUndo: true,
        canRedo: newIndex < state.history.length - 1
      };
    });
  }
}));