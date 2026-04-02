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
import { useEditorSettingsStore } from './useEditorSettingsStore';
import { ensureMobileLayout, calculateAutoMobileStack } from '../lib/layoutUtils';

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

  // クリップボード管理
  copiedItems: PlacedItemType[];

  copiedLogics: Record<string, NodeGraph>;
  copiedNodes: Node[]; // ★追加: コピーされたノード

  // 履歴管理
  history: HistoryState[];
  historyIndex: number;
  canUndo: boolean;
  canRedo: boolean;

  // Actions
  setSelectedPageId: (pageId: string) => void;
  addPage: (name?: string) => void;
  deletePage: (pageId: string) => void;
  duplicatePage: (pageId: string) => void;
  reorderPages: (oldIndex: number, newIndex: number) => void;
  updatePageName: (pageId: string, name: string) => void;
  updatePage: (pageId: string, updates: Partial<PageData>) => void; // 型を簡略化

  // アイテム操作
  addItem: (item: PlacedItemType) => void;
  updateItem: (id: string, updates: Partial<PlacedItemType> | { data: any }, options?: { addToHistory?: boolean; immediate?: boolean }) => void;
  updateItems: (updates: { id: string, props: Partial<PlacedItemType> }[], addToHistory?: boolean) => void;
  deleteItems: (ids: string[]) => void;
  copyItems: (ids: string[]) => void;

  pasteItems: (pastePosition?: { x: number; y: number } | null) => void;

  // ノード操作（コピペ用）
  copyNodes: (ids: string[]) => void;
  pasteNodes: (position?: { x: number; y: number } | null) => void;

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
  syncMobileLayouts: () => void; // ★ 追加: モバイルレイアウト同期用
}

export const usePageStore = create<PageStoreState>((set, get) => ({
  // 初期状態
  pages: {
    "page-1": {
      id: "page-1",
      name: "Page 1",
      nodes: [],
      edges: [],
      placedItems: [],
      allItemLogics: {},
      comments: []
    }
  },
  pageOrder: ["page-1"],
  selectedPageId: "page-1",

  // クリップボード初期値
  copiedItems: [],

  copiedLogics: {},
  copiedNodes: [],

  history: [{
    placedItems: [],
    comments: [],
    allItemLogics: {},
    pages: {
      "page-1": {
        id: "page-1",
        name: "Page 1",
        nodes: [],
        edges: [],
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
        [newId]: { id: newId, name: name || `Page ${state.pageOrder.length + 1}`, nodes: [], edges: [], placedItems: [], allItemLogics: {}, comments: [] }
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

  duplicatePage: (pageId: string) => {
    const { pages } = get();
    const originalPage = pages[pageId];
    if (!originalPage) return;

    // 新しいページIDを生成
    const newPageId = `page-${Date.now()}`;

    // アイテムIDのマッピング（古いID -> 新しいID）
    const itemIdMap = new Map<string, string>();

    // アイテムを深くコピーし、新しいIDを割り当て
    const newItems = originalPage.placedItems.map((item: PlacedItemType) => {
      const newItemId = `${item.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      itemIdMap.set(item.id, newItemId);
      return {
        ...JSON.parse(JSON.stringify(item)),
        id: newItemId
      };
    });

    // ロジックグラフをコピーし、IDを更新
    const newLogics: Record<string, NodeGraph> = {};
    Object.entries(originalPage.allItemLogics || {}).forEach(([oldItemId, graph]: [string, NodeGraph]) => {
      const newItemId = itemIdMap.get(oldItemId);
      if (!newItemId) return;

      // ノードIDのマッピング
      const nodeIdMap = new Map<string, string>();

      // ノードをコピーし、新しいIDを割り当て
      const newNodes = graph.nodes.map(node => {
        const newNodeId = `${node.type}_${newItemId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        nodeIdMap.set(node.id, newNodeId);
        return {
          ...JSON.parse(JSON.stringify(node)),
          id: newNodeId
        };
      });

      // エッジをコピーし、ノードIDを更新
      const newEdges = graph.edges.map(edge => ({
        ...JSON.parse(JSON.stringify(edge)),
        id: `${nodeIdMap.get(edge.source)}-${nodeIdMap.get(edge.target)}`,
        source: nodeIdMap.get(edge.source) || edge.source,
        target: nodeIdMap.get(edge.target) || edge.target
      }));

      newLogics[newItemId] = {
        nodes: newNodes,
        edges: newEdges,
        comments: graph.comments ? JSON.parse(JSON.stringify(graph.comments)) : undefined
      };
    });

    // コメントをコピー
    const newComments = originalPage.comments ? JSON.parse(JSON.stringify(originalPage.comments)).map((comment: CommentType) => ({
      ...comment,
      id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    })) : [];

    // 新しいページを作成
    const newPage = {
      id: newPageId,
      name: `${originalPage.name} (コピー)`,
      placedItems: newItems,
      allItemLogics: newLogics,
      nodes: [],
      edges: [],
      comments: newComments,
      backgroundColor: originalPage.backgroundColor,
      backgroundImage: originalPage.backgroundImage ? JSON.parse(JSON.stringify(originalPage.backgroundImage)) : undefined
    };

    // ページを追加
    set(state => ({
      pages: {
        ...state.pages,
        [newPageId]: newPage
      },
      pageOrder: [...state.pageOrder, newPageId],
      selectedPageId: newPageId
    }));
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

  reorderPages: (oldIndex: number, newIndex: number) => {
    set(state => {
      const newOrder = [...state.pageOrder];
      const [movedPage] = newOrder.splice(oldIndex, 1);
      newOrder.splice(newIndex, 0, movedPage);
      return { pageOrder: newOrder };
    });
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
          nodes: [],
          edges: [],
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
            nodes: [],
            edges: [],
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

  syncMobileLayouts: () => {
    set(state => {
      const pageId = state.selectedPageId;
      if (!pageId) return state;

      const page = state.pages[pageId];
      if (!page) return state;

      const newItems = page.placedItems.map((item: PlacedItemType) => ensureMobileLayout(item));

      // 変更があるか確認（ディープチェックはコストが高いので、ここでは簡易的に常に更新オブジェクトを作成）
      // 厳密には、何かが変わった場合のみ更新すべきだが、ensureMobileLayoutは常に新しいオブジェクトを返す可能性がある
      // 実装を最適化するなら、ensureMobileLayout内で変更不要なら元の参照を返すようにするべきだが、
      // ここではわかりやすさ優先で更新する。

      return {
        pages: {
          ...state.pages,
          [pageId]: {
            ...page,
            placedItems: newItems
          }
        }
      };
    });
    // 履歴には追加しないでおくか、追加するか？
    // ユーザー操作の結果として行われるので追加したほうが自然かもしれないが、
    // ビュー切り替えのたびに追加されるとundoが汚れる。
    // 今回は「自動調整」なのでhistoryには入れない、または変更があった場合のみ入れる等の制御が理想。
    // いったんhistory追加はスキップする（明示的な操作ではないため）。
  },

  // --- アイテム操作 ---
  autoStackItems: () => {
    set(state => {
      const pageId = state.selectedPageId;
      if (!pageId) return state;

      const page = state.pages[pageId];
      if (!page) return state;

      const newItems = calculateAutoMobileStack(page.placedItems);

      return {
        pages: {
          ...state.pages,
          [pageId]: {
            ...page,
            placedItems: newItems
          }
        }
      };
    });
    get().commitHistory();
  },

  addItem: (item: PlacedItemType) => {
    set(state => {
      const pageId = state.selectedPageId!;
      const page = state.pages[pageId];
      const newItems = [...page.placedItems, item];

      // 新しいアイテムのロジックグラフに初期イベントノードを追加（グループ以外）
      const newLogics = { ...page.allItemLogics };

      if (item.type !== 'group') {
        // 初期イベントノードを作成（削除不可に設定）
        const initialEventNode = {
          id: `eventNode_${item.id}_init`,
          type: 'eventNode',
          position: { x: 100, y: 100 },
          data: { label: 'イベント', eventType: 'click' },
          deletable: false  // ★ 削除不可に設定
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

      const newItems = page.placedItems.map((item: PlacedItemType) => {
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
        const idx = newItems.findIndex((i: PlacedItemType) => i.id === id);
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

  copyItems: (ids: string[]) => {
    const state = get();
    const pageId = state.selectedPageId;
    if (!pageId) return;

    const page = state.pages[pageId];
    const itemsToCopy = page.placedItems.filter((item: PlacedItemType) => ids.includes(item.id));

    // ロジックグラフもコピー
    const logicsToCopy: Record<string, NodeGraph> = {};
    ids.forEach(id => {
      if (page.allItemLogics[id]) {
        logicsToCopy[id] = JSON.parse(JSON.stringify(page.allItemLogics[id]));
      }
    });

    set({
      copiedItems: JSON.parse(JSON.stringify(itemsToCopy)),
      copiedLogics: logicsToCopy
    });
  },

  pasteItems: (pastePosition?: { x: number; y: number } | null) => {
    const state = get();
    const pageId = state.selectedPageId;
    if (!pageId || state.copiedItems.length === 0) return;

    const page = state.pages[pageId];
    const itemIdMap = new Map<string, string>();

    const isMobileView = useEditorSettingsStore.getState().isMobileView;

    // 複数アイテムの場合、全体のバウンディングボックスの中心を計算
    let centerX = 0;
    let centerY = 0;
    let centerMobileX = 0;
    let centerMobileY = 0;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    let minMX = Infinity, minMY = Infinity, maxMX = -Infinity, maxMY = -Infinity;

    state.copiedItems.forEach(item => {
      const x = item.x || 0, y = item.y || 0, w = item.width || 0, h = item.height || 0;
      if (x < minX) minX = x; if (y < minY) minY = y; if (x + w > maxX) maxX = x + w; if (y + h > maxY) maxY = y + h;

      const mx = item.mobileX || 0, my = item.mobileY || 0, mw = item.mobileWidth || 0, mh = item.mobileHeight || 0;
      if (mx < minMX) minMX = mx; if (my < minMY) minMY = my; if (mx + mw > maxMX) maxMX = mx + mw; if (my + mh > maxMY) maxMY = my + mh;
    });

    centerX = (minX + maxX) / 2;
    centerY = (minY + maxY) / 2;
    centerMobileX = (minMX + maxMX) / 2;
    centerMobileY = (minMY + maxMY) / 2;

    // ペースト基準位置の決定（提供されない場合は現在の中央＝重なり配置）
    const targetPos = pastePosition || (isMobileView
      ? { x: centerMobileX, y: centerMobileY }
      : { x: centerX, y: centerY });

    // 移動量の計算
    let dx: number, dy: number, dMX: number, dMY: number;

    if (isMobileView) {
      dMX = targetPos.x - centerMobileX;
      dMY = targetPos.y - centerMobileY;
      dx = dMX * (1000 / 375);
      dy = dMY * (1000 / 375);
    } else {
      dx = targetPos.x - centerX;
      dy = targetPos.y - centerY;
      dMX = dx * (375 / 1000);
      dMY = dy * (375 / 1000);
    }

    // コピーしたアイテムに新しいIDを割り当て、位置を調整
    const newItems = state.copiedItems.map(item => {
      const newItemId = `${item.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      itemIdMap.set(item.id, newItemId);

      return {
        ...item,
        id: newItemId,
        x: (item.x || 0) + dx,
        y: (item.y || 0) + dy,
        mobileX: (item.mobileX || 0) + dMX,
        mobileY: (item.mobileY || 0) + dMY
      };
    });

    // ロジックグラフも新しいIDでコピー
    const newLogics = { ...page.allItemLogics };
    state.copiedItems.forEach(item => {
      const newItemId = itemIdMap.get(item.id);
      if (!newItemId || !state.copiedLogics[item.id]) return;

      const graph = state.copiedLogics[item.id];
      const nodeIdMap = new Map<string, string>();

      // ノードIDを更新
      const newNodes = graph.nodes.map(node => {
        const newNodeId = `${node.type}_${newItemId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        nodeIdMap.set(node.id, newNodeId);
        return {
          ...node,
          id: newNodeId
        };
      });

      // エッジのID参照を更新
      const newEdges = graph.edges.map(edge => ({
        ...edge,
        id: `${nodeIdMap.get(edge.source)}-${nodeIdMap.get(edge.target)}`,
        source: nodeIdMap.get(edge.source) || edge.source,
        target: nodeIdMap.get(edge.target) || edge.target
      }));

      newLogics[newItemId] = {
        nodes: newNodes,
        edges: newEdges,
        comments: graph.comments ? JSON.parse(JSON.stringify(graph.comments)) : undefined
      };
    });

    set(state => ({
      pages: {
        ...state.pages,
        [pageId]: {
          ...page,
          placedItems: [...page.placedItems, ...newItems],
          allItemLogics: newLogics
        }
      }
    }));
    get().commitHistory();
  },

  // --- コメント管理 ---
  addComment: (commentData: Omit<CommentType, 'id' | 'createdAt' | 'updatedAt'>) => {
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

  updateComment: (commentId: string, updates: Partial<CommentType>) => {
    set(state => {
      const pageId = state.selectedPageId!;
      const page = state.pages[pageId];

      const newComments = (page.comments || []).map((c: CommentType) => {
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

  deleteComment: (commentId: string) => {
    set(state => {
      const pageId = state.selectedPageId!;
      const page = state.pages[pageId];

      const newComments = (page.comments || []).filter((c: CommentType) => c.id !== commentId);

      return {
        pages: { ...state.pages, [pageId]: { ...page, comments: newComments } }
      };
    });
    get().commitHistory();
  },

  // --- コメント管理（ノードエディタ用） ---
  addGraphComment: (commentData: Omit<CommentType, 'id' | 'createdAt' | 'updatedAt'>) => {
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

  updateGraphComment: (commentId: string, updates: Partial<CommentType>) => {
    set(state => {
      const pageId = state.selectedPageId!;
      const activeGraphId = useSelectionStore.getState().activeLogicGraphId;
      if (!activeGraphId) return state;

      const page = state.pages[pageId];
      const currentGraph = page.allItemLogics[activeGraphId] || { nodes: [], edges: [] };

      const newComments = (currentGraph.comments || []).map((c: CommentType) => {
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

  deleteGraphComment: (commentId: string) => {
    set(state => {
      const pageId = state.selectedPageId!;
      const activeGraphId = useSelectionStore.getState().activeLogicGraphId;
      if (!activeGraphId) return state;

      const page = state.pages[pageId];
      const currentGraph = page.allItemLogics[activeGraphId] || { nodes: [], edges: [] };

      const newComments = (currentGraph.comments || []).filter((c: CommentType) => c.id !== commentId);

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





  // --- ノードのコピペ ---
  copyNodes: (ids: string[]) => {
    const state = get();
    const pageId = state.selectedPageId;
    const activeLogicGraphId = useSelectionStore.getState().activeLogicGraphId;

    if (!pageId || !activeLogicGraphId) return;

    const page = state.pages[pageId];
    const graph = page.allItemLogics[activeLogicGraphId];
    if (!graph) return;

    // 選択されたノードを抽出
    const nodesToCopy = graph.nodes.filter(node => ids.includes(node.id));

    set({ copiedNodes: JSON.parse(JSON.stringify(nodesToCopy)) });
    console.log('[usePageStore] Copied nodes:', nodesToCopy.length);
  },

  pasteNodes: (position?: { x: number; y: number } | null) => {
    const state = get();
    const pageId = state.selectedPageId;
    const activeLogicGraphId = useSelectionStore.getState().activeLogicGraphId;

    if (!pageId || !activeLogicGraphId || state.copiedNodes.length === 0) return;

    const page = state.pages[pageId];
    const graph = page.allItemLogics[activeLogicGraphId];
    if (!graph) return;

    // 中心座標を計算
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    state.copiedNodes.forEach(node => {
      if (node.position.x < minX) minX = node.position.x;
      if (node.position.y < minY) minY = node.position.y;
      if (node.position.x > maxX) maxX = node.position.x;
      if (node.position.y > maxY) maxY = node.position.y;
    });

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    // ペースト位置の決定（指定がない場合は少しずらす）
    // ※注意: positionはReactFlowの座標系であることを期待
    // マウス位置を指定されない場合は、元の位置から少しずらす
    const targetPos = position || { x: centerX + 50, y: centerY + 50 };

    const dx = targetPos.x - centerX;
    const dy = targetPos.y - centerY;

    // 新しいノードを作成
    const newNodes = state.copiedNodes.map(node => {
      const newNodeId = `${node.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      return {
        ...node,
        id: newNodeId,
        position: {
          x: node.position.x + dx,
          y: node.position.y + dy
        },
        data: {
          ...node.data,
          label: node.data.label ? `${node.data.label} (コピー)` : node.data.label
        },
        selected: true // 新しいノードを選択状態に
      };
    });

    // 既存のノードの選択を解除
    const existingNodes = graph.nodes.map(n => ({ ...n, selected: false }));

    // グラフ更新
    const updatedGraph = {
      ...graph,
      nodes: [...existingNodes, ...newNodes]
    };

    set({
      pages: {
        ...state.pages,
        [pageId]: {
          ...page,
          allItemLogics: {
            ...page.allItemLogics,
            [activeLogicGraphId]: updatedGraph
          }
        }
      }
    });

    // 選択状態を更新
    // Note: useSelectionStoreの更新はコンポーネント側で行われることが多いが、
    // ここでIDだけはとれるので、複数選択としてセットする
    useSelectionStore.getState().setSelection(newNodes.map(n => n.id));

    get().commitHistory();
    console.log('[usePageStore] Pasted nodes:', newNodes.length);
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

    if (debounce) {
      if (commitHistoryTimer !== null) {
        clearTimeout(commitHistoryTimer);
      }
      commitHistoryTimer = window.setTimeout(() => {
        get().commitHistory(false);
        commitHistoryTimer = null;
      }, 500);
      return;
    }

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
    set(state => {
      if (state.historyIndex <= 0) {
        return state;
      }
      const newIndex = state.historyIndex - 1;
      const historyState = state.history[newIndex];

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
    set(state => {
      if (state.historyIndex >= state.history.length - 1) {
        return state;
      }
      const newIndex = state.historyIndex + 1;
      const historyState = state.history[newIndex];

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