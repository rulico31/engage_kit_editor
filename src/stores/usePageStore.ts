// src/stores/usePageStore.ts

import create from 'zustand';
import type { 
  PageData, 
  PlacedItemType, 
  NodeGraph, 
  PageInfo,
  ProjectData
} from '../types';
// ★ 修正: Node と Edge の import を reactflow に統一
import { 
  applyNodeChanges, 
  applyEdgeChanges, 
  addEdge, 
  type Connection, 
  type OnNodesChange, 
  type OnEdgesChange,
  type Node,
  type Edge
} from 'reactflow';
import { useSelectionStore } from './useSelectionStore';

// (App.tsx からテンプレート定義を移行)
const NODE_GRAPH_TEMPLATES: Record<string, NodeGraph> = {
  "ボタン": {
    nodes: [{
      id: "btn-click",
      type: "eventNode",
      data: { label: "🎬 イベント: クリックされた時", eventType: "click" },
      position: { x: 50, y: 50 },
    }],
    edges: [],
  },
  "テキスト": {
    nodes: [{
      id: "text-click",
      type: "eventNode",
      data: { label: "🎬 イベント: クリックされた時", eventType: "click" },
      position: { x: 50, y: 50 },
    }],
    edges: [],
  },
  "画像": {
    nodes: [{
      id: "img-click",
      type: "eventNode",
      data: { label: "🎬 イベント: クリックされた時", eventType: "click" },
      position: { x: 50, y: 50 },
    }],
    edges: [],
  },
  "テキスト入力欄": {
    nodes: [
      {
        id: "input-click",
        type: "eventNode",
        data: { label: "🎬 イベント: クリックされた時", eventType: "click" },
        position: { x: 50, y: 50 },
      },
      {
        id: "input-change",
        type: "eventNode",
        data: { label: "🎬 イベント: 入力完了時", eventType: "onInputComplete" },
        position: { x: 50, y: 150 },
      }
    ],
    edges: [],
  },
  "Default": {
    nodes: [{
      id: "default-click",
      type: "eventNode",
      data: { label: "🎬 イベント: クリックされた時", eventType: "click" },
      position: { x: 50, y: 50 },
    }],
    edges: [],
  },
};


interface PageStoreState {
  pages: Record<string, PageData>;
  pageOrder: string[];
  selectedPageId: string | null;
  
  // --- Actions (App.tsx からロジックを移行) ---
  loadProjectData: (data: ProjectData) => void;
  resetPages: () => void;
  setSelectedPageId: (pageId: string) => void;
  
  addPage: (newPageName: string) => void;
  
  // アイテム操作
  addItem: (item: PlacedItemType) => void;
  deleteItem: (itemId: string) => void;
  updateItem: (itemId: string, updatedProps: Partial<PlacedItemType>) => void;
  
  // ★ 修正: moveItemInArray をインターフェースに追加
  moveItemInArray: (itemId: string, moveFn: (items: PlacedItemType[], index: number) => PlacedItemType[]) => void;
  
  // アイテム重ね順
  moveItemToFront: (itemId: string) => void;
  moveItemToBack: (itemId: string) => void;
  moveItemForward: (itemId: string) => void;
  moveItemBackward: (itemId: string) => void;

  // ノードグラフ操作
  applyNodesChange: OnNodesChange;
  applyEdgesChange: OnEdgesChange;
  applyConnect: (connection: Connection) => void;
  addNodeToCurrentGraph: (newNode: Node) => void;
  updateNodeData: (nodeId: string, dataUpdate: any) => void;
}

const initialState = {
  pages: {},
  pageOrder: [],
  selectedPageId: null,
};

export const usePageStore = create<PageStoreState>((set, get) => ({
  ...initialState,

  loadProjectData: (data) => {
    set({
      pages: data.pages,
      pageOrder: data.pageOrder,
      selectedPageId: data.pageOrder[0] || null,
    });
  },
  
  resetPages: () => {
    set(initialState);
  },

  setSelectedPageId: (pageId) => {
    if (get().selectedPageId === pageId) return;
    set({ selectedPageId: pageId });
    // ページを切り替えたら選択状態もリセット
    useSelectionStore.getState().resetSelection();
  },
  
  addPage: (newPageName) => {
    const newPageId = `page-${Date.now()}`;
    const newPage: PageData = { 
      id: newPageId, 
      name: newPageName, 
      placedItems: [], 
      allItemLogics: {} 
    };
    
    set(state => ({
      pages: { ...state.pages, [newPageId]: newPage },
      pageOrder: [...state.pageOrder, newPageId],
      selectedPageId: newPageId,
    }));
    useSelectionStore.getState().resetSelection();
  },

  // --- アイテム操作 ---
  addItem: (item) => {
    const newItemId = item.id;
    const templateKey = Object.keys(NODE_GRAPH_TEMPLATES).find(key => item.name.startsWith(key)) || "Default";
    const newGraph = { ...NODE_GRAPH_TEMPLATES[templateKey] }; // (クローンして渡す)

    set(state => {
      const { selectedPageId, pages } = state;
      if (!selectedPageId) return state;
      const currentPage = pages[selectedPageId];
      if (!currentPage) return state;
      
      return {
        pages: {
          ...pages,
          [selectedPageId]: {
            ...currentPage,
            placedItems: [...currentPage.placedItems, item],
            allItemLogics: { ...currentPage.allItemLogics, [newItemId]: newGraph },
          }
        }
      };
    });
    
    // アイテム追加と同時に選択する
    useSelectionStore.getState().handleItemSelect(newItemId, item.data.text || item.name);
  },

  deleteItem: (itemId) => {
    set(state => {
      const { selectedPageId, pages } = state;
      if (!selectedPageId) return state;
      const currentPage = pages[selectedPageId];
      if (!currentPage) return state;
      
      const newPlacedItems = currentPage.placedItems.filter(item => item.id !== itemId);
      const newAllItemLogics = { ...currentPage.allItemLogics };
      delete newAllItemLogics[itemId];
      
      return {
        pages: {
          ...pages,
          [selectedPageId]: {
            ...currentPage,
            placedItems: newPlacedItems,
            allItemLogics: newAllItemLogics,
          }
        }
      };
    });
  },

  // ★ 修正: `data` オブジェクトをディープマージするように修正
  updateItem: (itemId, updatedProps) => {
    set(state => {
      const { selectedPageId, pages } = state;
      if (!selectedPageId) return state;
      const currentPage = pages[selectedPageId];
      if (!currentPage) return state;
      
      const newPlacedItems = currentPage.placedItems.map(item => {
        if (item.id === itemId) {
          // 'data' プロパティが更新対象かチェック
          if (updatedProps.data) {
            return { 
              ...item, 
              ...updatedProps, // (x, y, width など、他のトップレベルプロパティをマージ)
              data: { // (★) 'data' オブジェクトを明示的にディープマージ
                ...item.data, 
                ...updatedProps.data 
              } 
            };
          }
          // 'data' がない場合は、通常のシャローマージ
          return { ...item, ...updatedProps };
        }
        return item;
      });
      
      return {
        pages: {
          ...pages,
          [selectedPageId]: { ...currentPage, placedItems: newPlacedItems }
        }
      };
    });
    
    // (★) ストア間通信: SelectionStore のタブ ラベルも更新する
    const newLabel = (updatedProps.data as Partial<PlacedItemType['data']>)?.text || updatedProps.name;
    if (newLabel) {
      useSelectionStore.getState().updateTabLabel(itemId, newLabel);
    }
  },
  
  // --- 重ね順 ---
  moveItemInArray: (itemId, moveFn) => {
    set(state => {
      const { selectedPageId, pages } = state;
      if (!selectedPageId) return state;
      const currentPage = pages[selectedPageId];
      if (!currentPage) return state;

      const index = currentPage.placedItems.findIndex(item => item.id === itemId);
      if (index === -1) return state;

      const newPlacedItems = moveFn(currentPage.placedItems, index);
      
      return {
        pages: {
          ...pages,
          [selectedPageId]: { ...currentPage, placedItems: newPlacedItems },
        }
      };
    });
  },

  moveItemToFront: (itemId) => {
    get().moveItemInArray(itemId, (items, index) => {
      if (index === items.length - 1) return items;
      const item = items[index];
      const newItems = [...items];
      newItems.splice(index, 1);
      newItems.push(item);
      return newItems;
    });
  },
  
  moveItemToBack: (itemId) => {
    get().moveItemInArray(itemId, (items, index) => {
      if (index === 0) return items;
      const item = items[index];
      const newItems = [...items];
      newItems.splice(index, 1);
      newItems.unshift(item);
      return newItems;
    });
  },

  moveItemForward: (itemId) => {
    get().moveItemInArray(itemId, (items, index) => {
      if (index >= items.length - 1) return items;
      const newItems = [...items];
      const temp = newItems[index + 1];
      newItems[index + 1] = newItems[index];
      newItems[index] = temp;
      return newItems;
    });
  },
  
  moveItemBackward: (itemId) => {
    get().moveItemInArray(itemId, (items, index) => {
      if (index <= 0) return items;
      const newItems = [...items];
      const temp = newItems[index - 1];
      newItems[index - 1] = newItems[index];
      newItems[index] = temp;
      return newItems;
    });
  },

  // --- ノードグラフ操作 ---
  applyNodesChange: (changes) => {
    set(state => {
      const { selectedPageId, pages } = state;
      // (★) ストア間通信: SelectionStore から activeLogicGraphId を取得
      const activeLogicGraphId = useSelectionStore.getState().activeLogicGraphId;
      
      if (!selectedPageId || !activeLogicGraphId) return state;
      const currentPage = pages[selectedPageId];
      if (!currentPage) return state;
      const currentGraph = currentPage.allItemLogics[activeLogicGraphId];
      if (!currentGraph) return state;
      
      const newNodes = applyNodeChanges(changes, currentGraph.nodes);
      
      // (★) ストア間通信: SelectionStore のタブ ラベルも更新する
      useSelectionStore.getState().updateNodeTabLabels(newNodes);

      const newAllItemLogics = { ...currentPage.allItemLogics, [activeLogicGraphId]: { ...currentGraph, nodes: newNodes } };
      return { pages: { ...pages, [selectedPageId]: { ...currentPage, allItemLogics: newAllItemLogics } } };
    });
  },
  
  applyEdgesChange: (changes) => {
    set(state => {
      const { selectedPageId, pages } = state;
      const activeLogicGraphId = useSelectionStore.getState().activeLogicGraphId;
      
      if (!selectedPageId || !activeLogicGraphId) return state;
      const currentPage = pages[selectedPageId];
      if (!currentPage) return state;
      const currentGraph = currentPage.allItemLogics[activeLogicGraphId];
      if (!currentGraph) return state;
      
      const newEdges = applyEdgeChanges(changes, currentGraph.edges);
      const newAllItemLogics = { ...currentPage.allItemLogics, [activeLogicGraphId]: { ...currentGraph, edges: newEdges } };
      return { pages: { ...pages, [selectedPageId]: { ...currentPage, allItemLogics: newAllItemLogics } } };
    });
  },

  applyConnect: (connection) => {
    set(state => {
      const { selectedPageId, pages } = state;
      const activeLogicGraphId = useSelectionStore.getState().activeLogicGraphId;
      
      if (!selectedPageId || !activeLogicGraphId) return state;
      const currentPage = pages[selectedPageId];
      if (!currentPage) return state;
      const currentGraph = currentPage.allItemLogics[activeLogicGraphId];
      if (!currentGraph) return state;
      
      const newEdges = addEdge(connection, currentGraph.edges);
      const newAllItemLogics = { ...currentPage.allItemLogics, [activeLogicGraphId]: { ...currentGraph, edges: newEdges } };
      return { pages: { ...pages, [selectedPageId]: { ...currentPage, allItemLogics: newAllItemLogics } } };
    });
  },
  
  addNodeToCurrentGraph: (newNode) => {
    set(state => {
      const { selectedPageId, pages } = state;
      const activeLogicGraphId = useSelectionStore.getState().activeLogicGraphId;
      
      if (!selectedPageId || !activeLogicGraphId) return state;
      const currentPage = pages[selectedPageId];
      if (!currentPage) return state;
      const currentGraph = currentPage.allItemLogics[activeLogicGraphId];
      if (!currentGraph) return state;
      
      const newAllItemLogics = { ...currentPage.allItemLogics, [activeLogicGraphId]: { ...currentGraph, nodes: [...currentGraph.nodes, newNode] } };
      return { pages: { ...pages, [selectedPageId]: { ...currentPage, allItemLogics: newAllItemLogics } } };
    });
  },
  
  updateNodeData: (nodeId, dataUpdate) => {
    set(state => {
      const { selectedPageId, pages } = state;
      const activeLogicGraphId = useSelectionStore.getState().activeLogicGraphId;
      
      if (!selectedPageId || !activeLogicGraphId) return state;
      const currentPage = pages[selectedPageId];
      if (!currentPage) return state;
      const currentGraph = currentPage.allItemLogics[activeLogicGraphId];
      if (!currentGraph) return state;

      const newNodes = currentGraph.nodes.map(node => 
        node.id === nodeId ? { ...node, data: { ...node.data, ...dataUpdate } } : node
      );
      
      // (★) ストア間通信: SelectionStore のタブ ラベルも更新する
      if (dataUpdate.label) {
        useSelectionStore.getState().updateTabLabel(nodeId, dataUpdate.label);
      }

      const newAllItemLogics = { ...currentPage.allItemLogics, [activeLogicGraphId]: { ...currentGraph, nodes: newNodes } };
      return { pages: { ...pages, [selectedPageId]: { ...currentPage, allItemLogics: newAllItemLogics } } };
    });
  },

}));