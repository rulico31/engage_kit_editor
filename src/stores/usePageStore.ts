// src/stores/usePageStore.ts

import { create } from 'zustand';
import {
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  type NodeChange,
  type EdgeChange,
  type Connection,
  type Node
} from 'reactflow';
import type { PlacedItemType, NodeGraph, ProjectData, CommentType, PageData } from '../types';
import { useSelectionStore } from './useSelectionStore';

// Undo/Redo履歴の最大数
const MAX_HISTORY = 20;

// デバウンス用のタイマー（グローバル変数）
let commitHistoryTimer: number | null = null;

// ★修正: 履歴にはアイテム、コメント、ロジックグラフ、全ページ情報を含める
interface HistoryState {
  // 現在選択中のページの状態（下位互換性のため残す）
  placedItems: PlacedItemType[];
  comments: CommentType[];
  allItemLogics: Record<string, NodeGraph>;
  // 全ページの状態
  pages: Record<string, PageData>;
  pageOrder: string[];
  selectedPageId: string | null;
}

interface PageStoreState {
  // 複数ページ管理
  pages: Record<string, PageData>;
  pageOrder: string[];
  selectedPageId: string | null;

  // 履歴管理
  history: HistoryState[];
  historyIndex: number;
  canUndo: boolean;
  canRedo: boolean;

  // Actions
  setSelectedPageId: (pageId: string) => void;
  addPage: (name?: string) => void;
  deletePage: (pageId: string) => void;
  updatePageName: (pageId: string, name: string) => void;
  updatePage: (pageId: string, updates: Partial<PageData>) => void; // 型を簡略化

  // アイテム操作
  addItem: (item: PlacedItemType) => void;
  updateItem: (id: string, updates: Partial<PlacedItemType> | { data: any }, options?: { addToHistory?: boolean; immediate?: boolean }) => void;
  updateItems: (updates: { id: string, props: Partial<PlacedItemType> }[], addToHistory?: boolean) => void;
  deleteItems: (ids: string[]) => void;

  // コメント管理（アートボード用）
  addComment: (comment: Omit<CommentType, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateComment: (commentId: string, updates: Partial<CommentType>) => void;
  deleteComment: (commentId: string) => void;

  // コメント管理（ノードエディタ用）
  addGraphComment: (comment: Omit<CommentType, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateGraphComment: (commentId: string, updates: Partial<CommentType>) => void;
  deleteGraphComment: (commentId: string) => void;

  // グループ化・順序

  moveItemToFront: (id: string) => void;
  moveItemToBack: (id: string) => void;
  moveItemForward: (id: string) => void;
  moveItemBackward: (id: string) => void;

  // 自動レイアウト
  autoStackItems: () => void;

  // ノード操作
  updateNodeData: (nodeId: string, data: any, options?: { addToHistory?: boolean; historyDebounce?: boolean }) => void;
  setLogicGraph: (itemId: string, graph: NodeGraph) => void;

  // React Flow グラフ操作用アクション
  applyNodesChange: (changes: NodeChange[]) => void;
  applyEdgesChange: (changes: EdgeChange[]) => void;
  applyConnect: (connection: Connection) => void;
  addNodeToCurrentGraph: (node: Node) => void;

  // 履歴操作
  commitHistory: (debounce?: boolean) => void;
  undo: () => void;
  redo: () => void;

  // データロード
  loadFromData: (data: ProjectData) => void;
  resetState: () => void; // 追加: 完全リセット用
}

export const usePageStore = create<PageStoreState>((set, get) => ({
  // 初期状態
  pages: {
    "page-1": {
      id: "page-1",
      name: "Page 1",
      placedItems: [],
      allItemLogics: {},
      comments: []
    }
  },
  pageOrder: ["page-1"],
  selectedPageId: "page-1",

  history: [{
    placedItems: [],
    comments: [],
    allItemLogics: {},
    pages: {
      "page-1": {
        id: "page-1",
        name: "Page 1",
        placedItems: [],
        allItemLogics: {},
        comments: []
      }
    },
    pageOrder: ["page-1"],
    selectedPageId: "page-1"
  }],
  historyIndex: 0,
  canUndo: false,
  canRedo: false,

  // --- ページ管理 ---
  setSelectedPageId: (pageId: string) => set({ selectedPageId: pageId }),

  addPage: (name?: string) => {
    const newId = `page-${Date.now()}`;
    set(state => ({
      pages: {
        ...state.pages,
        [newId]: { id: newId, name: name || `Page ${state.pageOrder.length + 1}`, placedItems: [], allItemLogics: {}, comments: [] }
      },
      pageOrder: [...state.pageOrder, newId],
      selectedPageId: newId
    }));
    get().commitHistory();
  },

  deletePage: (pageId: string) => {
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
    get().commitHistory();
  },

  updatePageName: (pageId: string, name: string) => {
    set(state => ({
      pages: {
        ...state.pages,
        [pageId]: { ...state.pages[pageId], name }
      }
    }));
    get().commitHistory();
  },

  updatePage: (pageId: string, updates: Partial<PageData>) => {
    set(state => ({
      pages: {
        ...state.pages,
        [pageId]: { ...state.pages[pageId], ...updates }
      }
    }));
  },

  // --- データロード ---
  loadFromData: (data: ProjectData) => {
    const firstPageId = data.pageOrder[0];
    const initialPage = firstPageId ? data.pages[firstPageId] : null;
    const initialItems = initialPage ? initialPage.placedItems : [];
    const initialComments = initialPage ? (initialPage.comments || []) : [];

    set({
      pages: data.pages,
      pageOrder: data.pageOrder,
      selectedPageId: firstPageId || null,
      history: [{
        placedItems: JSON.parse(JSON.stringify(initialItems)),
        comments: JSON.parse(JSON.stringify(initialComments)),
        allItemLogics: JSON.parse(JSON.stringify(initialPage?.allItemLogics || {})),
        pages: JSON.parse(JSON.stringify(data.pages)),
        pageOrder: [...data.pageOrder],
        selectedPageId: firstPageId
      }],
      historyIndex: 0,
      canUndo: false,
      canRedo: false,
    });
  },

  resetState: () => {
    set({
      pages: {
        "page-1": {
          id: "page-1",
          name: "Page 1",
          placedItems: [],
          allItemLogics: {},
          comments: []
        }
      },
      pageOrder: ["page-1"],
      selectedPageId: "page-1",
      history: [{
        placedItems: [],
        comments: [],
        allItemLogics: {},
        pages: {
          "page-1": {
            id: "page-1",
            name: "Page 1",
            placedItems: [],
            allItemLogics: {},
            comments: []
          }
        },
        pageOrder: ["page-1"],
        selectedPageId: "page-1"
      }],
      historyIndex: 0,
      canUndo: false,
      canRedo: false,
    });
  },

  // --- アイテム操作 ---
  addItem: (item: PlacedItemType) => {
    set(state => {
      const pageId = state.selectedPageId!;
      const page = state.pages[pageId];
      const newItems = [...page.placedItems, item];

      // 新しいアイテムのロジックグラフに初期イベントノードを追加（グループ以外）
      const newLogics = { ...page.allItemLogics };

      if (item.type !== 'group') {
        // 初期イベントノードを作成
        const initialEventNode = {
          id: `eventNode_${item.id}_init`,
          type: 'eventNode',
          position: { x: 100, y: 100 },
          data: { label: 'イベント', eventType: 'click' }
        };

        // このアイテムのロジックグラフを初期化
        newLogics[item.id] = {
          nodes: [initialEventNode],
          edges: []
        };
      }

      return {
        pages: {
          ...state.pages,
          [pageId]: {
            ...page,
            placedItems: newItems,
            allItemLogics: newLogics
          }
        }
      };
    });
    get().commitHistory();
  },

  updateItem: (id: string, updates: Partial<PlacedItemType> | { data: any }, options?: { addToHistory?: boolean; immediate?: boolean }) => {
    const addToHistory = options?.addToHistory ?? false;
    const immediate = options?.immediate ?? false;

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

    if (addToHistory) {
      get().commitHistory(!immediate);
    }
  },

  updateItems: (updatesList: { id: string, props: Partial<PlacedItemType> }[], addToHistory = false) => {
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
    if (addToHistory) get().commitHistory(true);
  },

  deleteItems: (ids: string[]) => {
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

  // --- コメント管理 ---
  addComment: (commentData) => {
    set(state => {
      const pageId = state.selectedPageId!;
      const page = state.pages[pageId];

      const newComment: CommentType = {
        id: `comment-${Date.now()}`,
        ...commentData,
        createdAt: Date.now(),
      };

      const newComments = [...(page.comments || []), newComment];

      return {
        pages: { ...state.pages, [pageId]: { ...page, comments: newComments } }
      };
    });
    get().commitHistory();
  },

  updateComment: (commentId, updates) => {
    set(state => {
      const pageId = state.selectedPageId!;
      const page = state.pages[pageId];

      const newComments = (page.comments || []).map(c => {
        if (c.id === commentId) {
          return { ...c, ...updates };
        }
        return c;
      });

      return {
        pages: { ...state.pages, [pageId]: { ...page, comments: newComments } }
      };
    });
    get().commitHistory();
  },

  deleteComment: (commentId) => {
    set(state => {
      const pageId = state.selectedPageId!;
      const page = state.pages[pageId];

      const newComments = (page.comments || []).filter(c => c.id !== commentId);

      return {
        pages: { ...state.pages, [pageId]: { ...page, comments: newComments } }
      };
    });
    get().commitHistory();
  },

  // --- コメント管理（ノードエディタ用） ---
  addGraphComment: (commentData) => {
    set(state => {
      const pageId = state.selectedPageId!;
      const activeGraphId = useSelectionStore.getState().activeLogicGraphId;
      if (!activeGraphId) return state;

      const page = state.pages[pageId];
      const currentGraph = page.allItemLogics[activeGraphId] || { nodes: [], edges: [] };

      const newComment: CommentType = {
        id: `comment-${Date.now()}`,
        ...commentData,
        createdAt: Date.now(),
      };

      const newComments = [...(currentGraph.comments || []), newComment];

      return {
        pages: {
          ...state.pages,
          [pageId]: {
            ...page,
            allItemLogics: {
              ...page.allItemLogics,
              [activeGraphId]: { ...currentGraph, comments: newComments }
            }
          }
        }
      };
    });
    get().commitHistory();
  },

  updateGraphComment: (commentId, updates) => {
    set(state => {
      const pageId = state.selectedPageId!;
      const activeGraphId = useSelectionStore.getState().activeLogicGraphId;
      if (!activeGraphId) return state;

      const page = state.pages[pageId];
      const currentGraph = page.allItemLogics[activeGraphId] || { nodes: [], edges: [] };

      const newComments = (currentGraph.comments || []).map(c => {
        if (c.id === commentId) {
          return { ...c, ...updates };
        }
        return c;
      });

      return {
        pages: {
          ...state.pages,
          [pageId]: {
            ...page,
            allItemLogics: {
              ...page.allItemLogics,
              [activeGraphId]: { ...currentGraph, comments: newComments }
            }
          }
        }
      };
    });
    get().commitHistory();
  },

  deleteGraphComment: (commentId) => {
    set(state => {
      const pageId = state.selectedPageId!;
      const activeGraphId = useSelectionStore.getState().activeLogicGraphId;
      if (!activeGraphId) return state;

      const page = state.pages[pageId];
      const currentGraph = page.allItemLogics[activeGraphId] || { nodes: [], edges: [] };

      const newComments = (currentGraph.comments || []).filter(c => c.id !== commentId);

      return {
        pages: {
          ...state.pages,
          [pageId]: {
            ...page,
            allItemLogics: {
              ...page.allItemLogics,
              [activeGraphId]: { ...currentGraph, comments: newComments }
            }
          }
        }
      };
    });
    get().commitHistory();
  },



  // --- 重なり順 ---
  moveItemToFront: (id: string) => {
    set(state => {
      const pageId = state.selectedPageId!;
      const items = [...state.pages[pageId].placedItems];
      const idx = items.findIndex(i => i.id === id);
      if (idx === -1) return state;
      const [item] = items.splice(idx, 1);
      items.push(item);
      return { pages: { ...state.pages, [pageId]: { ...state.pages[pageId], placedItems: items } } };
    });
    get().commitHistory();
  },
  moveItemToBack: (id: string) => {
    set(state => {
      const pageId = state.selectedPageId!;
      const items = [...state.pages[pageId].placedItems];
      const idx = items.findIndex(i => i.id === id);
      if (idx === -1) return state;
      const [item] = items.splice(idx, 1);
      items.unshift(item);
      return { pages: { ...state.pages, [pageId]: { ...state.pages[pageId], placedItems: items } } };
    });
    get().commitHistory();
  },
  moveItemForward: (id: string) => {
    set(state => {
      const pageId = state.selectedPageId!;
      const items = [...state.pages[pageId].placedItems];
      const idx = items.findIndex(i => i.id === id);
      if (idx === -1 || idx === items.length - 1) return state;
      [items[idx], items[idx + 1]] = [items[idx + 1], items[idx]];
      return { pages: { ...state.pages, [pageId]: { ...state.pages[pageId], placedItems: items } } };
    });
    get().commitHistory();
  },
  moveItemBackward: (id: string) => {
    set(state => {
      const pageId = state.selectedPageId!;
      const items = [...state.pages[pageId].placedItems];
      const idx = items.findIndex(i => i.id === id);
      if (idx === -1 || idx === 0) return state;
      [items[idx - 1], items[idx]] = [items[idx], items[idx - 1]];
      return { pages: { ...state.pages, [pageId]: { ...state.pages[pageId], placedItems: items } } };
    });
    get().commitHistory();
  },

  // --- 自動レイアウト ---
  autoStackItems: () => {
    set(state => {
      const pageId = state.selectedPageId!;
      const page = state.pages[pageId];
      const items = [...page.placedItems];

      items.sort((a, b) => a.y - b.y);

      let currentY = 20;
      const newItems = items.map(item => {
        const newItem = { ...item };
        newItem.mobileX = 20;
        newItem.mobileY = currentY;
        newItem.mobileWidth = 335;
        newItem.mobileHeight = item.height;
        currentY += newItem.mobileHeight + 20;
        return newItem;
      });

      return {
        pages: { ...state.pages, [pageId]: { ...page, placedItems: newItems } }
      };
    });
    get().commitHistory();
  },

  // --- Node Operations (Basic) ---
  updateNodeData: (nodeId: string, data: any, options?: { addToHistory?: boolean; historyDebounce?: boolean }) => {
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

    if (options?.addToHistory) {
      get().commitHistory(options.historyDebounce);
    }
  },

  setLogicGraph: (itemId: string, graph: NodeGraph) => {
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
  applyNodesChange: (changes: NodeChange[]) => {
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

    // ノードの移動は頻繁に発生するのでデバウンス
    // 削除は即座に履歴保存
    const hasRemoval = changes.some(c => c.type === 'remove');
    get().commitHistory(!hasRemoval);
  },

  applyEdgesChange: (changes: EdgeChange[]) => {
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

    // エッジの削除時は即座に履歴保存
    const hasRemoval = changes.some(c => c.type === 'remove');
    if (hasRemoval) {
      get().commitHistory();
    }
  },

  applyConnect: (connection: Connection) => {
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
    get().commitHistory();
  },

  addNodeToCurrentGraph: (node: Node) => {
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
    get().commitHistory();
  },

  // --- 履歴管理 ---
  commitHistory: (debounce = false) => {
    console.log('[COMMIT_HISTORY] called with debounce:', debounce);

    if (debounce) {
      if (commitHistoryTimer !== null) {
        clearTimeout(commitHistoryTimer);
      }
      commitHistoryTimer = window.setTimeout(() => {
        console.log('[COMMIT_HISTORY] debounce timer fired');
        get().commitHistory(false);
        commitHistoryTimer = null;
      }, 500);
      return;
    }

    console.log('[COMMIT_HISTORY] saving history NOW');

    set(state => {
      const pageId = state.selectedPageId;
      if (!pageId) return state;

      const currentPage = state.pages[pageId];
      const currentItems = currentPage.placedItems;
      const currentComments = currentPage.comments || [];
      const currentLogics = currentPage.allItemLogics || {};

      // 現在のインデックスより後の履歴を削除（新しい分岐を作る）
      const newHistory = state.history.slice(0, state.historyIndex + 1);

      // ★修正: コメント、ロジックグラフ、全ページ情報も履歴に含める
      newHistory.push({
        placedItems: JSON.parse(JSON.stringify(currentItems)),
        comments: JSON.parse(JSON.stringify(currentComments)),
        allItemLogics: JSON.parse(JSON.stringify(currentLogics)),
        pages: JSON.parse(JSON.stringify(state.pages)),
        pageOrder: [...state.pageOrder],
        selectedPageId: state.selectedPageId
      });

      if (newHistory.length > MAX_HISTORY) newHistory.shift();

      const newIndex = newHistory.length - 1;

      return {
        history: newHistory,
        historyIndex: newIndex,
        canUndo: newIndex > 0,
        canRedo: false
      };
    });
  },

  undo: () => {
    const currentState = get();
    console.log('[UNDO] historyIndex:', currentState.historyIndex, 'history.length:', currentState.history.length);

    set(state => {
      if (state.historyIndex <= 0) {
        console.log('[UNDO] Cannot undo - at beginning of history');
        return state;
      }
      const newIndex = state.historyIndex - 1;
      const historyState = state.history[newIndex];
      console.log('[UNDO] Applying undo, new index:', newIndex);

      return {
        historyIndex: newIndex,
        pages: historyState.pages,
        pageOrder: historyState.pageOrder,
        selectedPageId: historyState.selectedPageId,
        canUndo: newIndex > 0,
        canRedo: true
      };
    });
  },

  redo: () => {
    const currentState = get();
    console.log('[REDO] historyIndex:', currentState.historyIndex, 'history.length:', currentState.history.length, 'canRedo:', currentState.canRedo);

    set(state => {
      if (state.historyIndex >= state.history.length - 1) {
        console.log('[REDO] Cannot redo - at end of history');
        return state;
      }
      const newIndex = state.historyIndex + 1;
      const historyState = state.history[newIndex];
      console.log('[REDO] Applying redo, new index:', newIndex);

      return {
        historyIndex: newIndex,
        pages: historyState.pages,
        pageOrder: historyState.pageOrder,
        selectedPageId: historyState.selectedPageId,
        canUndo: true,
        canRedo: newIndex < state.history.length - 1
      };
    });
  }
}));