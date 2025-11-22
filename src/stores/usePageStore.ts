// src/stores/usePageStore.ts

import create from 'zustand';
import type { 
  PageData, 
  PlacedItemType, 
  NodeGraph, 
  ProjectData
} from '../types';
import { 
  applyNodeChanges, 
  applyEdgeChanges, 
  addEdge, 
  type Connection, 
  type OnNodesChange, 
  type OnEdgesChange, 
  type Node
} from 'reactflow';
import { useSelectionStore } from './useSelectionStore';

interface HistorySnapshot {
  pages: Record<string, PageData>;
  pageOrder: string[];
  selectedPageId: string | null;
}

const NODE_GRAPH_TEMPLATES: Record<string, NodeGraph> = {
  "ボタン": {
    nodes: [{ id: "btn-click", type: "eventNode", data: { label: "🎬 イベント: クリックされた時", eventType: "click" }, position: { x: 50, y: 50 }, }], edges: [],
  },
  "テキスト": {
    nodes: [{ id: "text-click", type: "eventNode", data: { label: "🎬 イベント: クリックされた時", eventType: "click" }, position: { x: 50, y: 50 }, }], edges: [],
  },
  "画像": {
    nodes: [{ id: "img-click", type: "eventNode", data: { label: "🎬 イベント: クリックされた時", eventType: "click" }, position: { x: 50, y: 50 }, }], edges: [],
  },
  "テキスト入力欄": {
    nodes: [
      { id: "input-click", type: "eventNode", data: { label: "🎬 イベント: クリックされた時", eventType: "click" }, position: { x: 50, y: 50 }, },
      { id: "input-change", type: "eventNode", data: { label: "🎬 イベント: 入力完了時", eventType: "onInputComplete" }, position: { x: 50, y: 150 }, }
    ], edges: [],
  },
  "Default": {
    nodes: [{ id: "default-click", type: "eventNode", data: { label: "🎬 イベント: クリックされた時", eventType: "click" }, position: { x: 50, y: 50 }, }], edges: [],
  },
};

interface PageStoreState {
  pages: Record<string, PageData>;
  pageOrder: string[];
  selectedPageId: string | null;
  
  past: HistorySnapshot[];
  future: HistorySnapshot[];
  canUndo: boolean;
  canRedo: boolean;
  
  undo: () => void;
  redo: () => void;
  commitHistory: () => void;

  loadProjectData: (data: ProjectData) => void;
  resetPages: () => void;
  setSelectedPageId: (pageId: string) => void;
  addPage: (newPageName: string) => void;
  
  addItem: (item: PlacedItemType) => void;
  deleteItem: (itemId: string) => void;
  deleteItems: (itemIds: string[]) => void;
  
  updateItem: (itemId: string, updatedProps: Partial<PlacedItemType>, skipHistory?: boolean) => void;
  updateItems: (updates: { id: string; props: Partial<PlacedItemType> }[], skipHistory?: boolean) => void;

  reorderItems: (sourceIndex: number, destinationIndex: number) => void;
  groupItems: (itemIds: string[]) => void;
  ungroupItems: (groupId: string) => void;
  
  moveItemInArray: (itemId: string, moveFn: (items: PlacedItemType[], index: number) => PlacedItemType[]) => void;
  moveItemToFront: (itemId: string) => void;
  moveItemToBack: (itemId: string) => void;
  moveItemForward: (itemId: string) => void;
  moveItemBackward: (itemId: string) => void;

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
  past: [],
  future: [],
  canUndo: false,
  canRedo: false,
};

const MAX_HISTORY_LENGTH = 30;

export const usePageStore = create<PageStoreState>((set, get) => ({
  ...initialState,

  commitHistory: () => {
    set(state => {
      const snapshot: HistorySnapshot = {
        pages: state.pages,
        pageOrder: state.pageOrder,
        selectedPageId: state.selectedPageId,
      };
      const newPast = [...state.past, snapshot];
      if (newPast.length > MAX_HISTORY_LENGTH) newPast.shift();
      return { past: newPast, future: [], canUndo: true, canRedo: false };
    });
  },

  undo: () => {
    set(state => {
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1];
      const newPast = state.past.slice(0, -1);
      const currentSnapshot: HistorySnapshot = {
        pages: state.pages,
        pageOrder: state.pageOrder,
        selectedPageId: state.selectedPageId,
      };
      useSelectionStore.getState().resetSelection();
      return {
        pages: previous.pages,
        pageOrder: previous.pageOrder,
        selectedPageId: previous.selectedPageId,
        past: newPast,
        future: [currentSnapshot, ...state.future],
        canUndo: newPast.length > 0,
        canRedo: true,
      };
    });
  },

  redo: () => {
    set(state => {
      if (state.future.length === 0) return state;
      const next = state.future[0];
      const newFuture = state.future.slice(1);
      const currentSnapshot: HistorySnapshot = {
        pages: state.pages,
        pageOrder: state.pageOrder,
        selectedPageId: state.selectedPageId,
      };
      useSelectionStore.getState().resetSelection();
      return {
        pages: next.pages,
        pageOrder: next.pageOrder,
        selectedPageId: next.selectedPageId,
        past: [...state.past, currentSnapshot],
        future: newFuture,
        canUndo: true,
        canRedo: newFuture.length > 0,
      };
    });
  },

  loadProjectData: (data) => {
    set({
      pages: data.pages,
      pageOrder: data.pageOrder,
      selectedPageId: data.pageOrder[0] || null,
      past: [], future: [], canUndo: false, canRedo: false,
    });
  },
  
  resetPages: () => set(initialState),

  setSelectedPageId: (pageId) => {
    if (get().selectedPageId === pageId) return;
    set({ selectedPageId: pageId });
    useSelectionStore.getState().resetSelection();
  },
  
  addPage: (newPageName) => {
    get().commitHistory();
    const newPageId = `page-${Date.now()}`;
    const newPage: PageData = { id: newPageId, name: newPageName, placedItems: [], allItemLogics: {} };
    set(state => ({
      pages: { ...state.pages, [newPageId]: newPage },
      pageOrder: [...state.pageOrder, newPageId],
      selectedPageId: newPageId,
    }));
    useSelectionStore.getState().resetSelection();
  },

  addItem: (item) => {
    get().commitHistory();
    const newItemId = item.id;
    const templateKey = Object.keys(NODE_GRAPH_TEMPLATES).find(key => item.name.startsWith(key)) || "Default";
    const newGraph = { ...NODE_GRAPH_TEMPLATES[templateKey] };

    set(state => {
      const { selectedPageId, pages } = state;
      if (!selectedPageId) return state;
      const currentPage = pages[selectedPageId];
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
    useSelectionStore.getState().handleItemSelect(newItemId, item.data.text || item.name);
  },

  deleteItem: (itemId) => {
    get().deleteItems([itemId]);
  },

  deleteItems: (itemIds) => {
    if (itemIds.length === 0) return;
    get().commitHistory();
    
    set(state => {
      const { selectedPageId, pages } = state;
      if (!selectedPageId) return state;
      const currentPage = pages[selectedPageId];
      
      const itemsToDelete = new Set<string>(itemIds);
      
      let changed = true;
      while(changed) {
        changed = false;
        currentPage.placedItems.forEach(item => {
          if (item.groupId && itemsToDelete.has(item.groupId) && !itemsToDelete.has(item.id)) {
            itemsToDelete.add(item.id);
            changed = true;
          }
        });
      }

      const newPlacedItems = currentPage.placedItems.filter(item => !itemsToDelete.has(item.id));
      const newAllItemLogics = { ...currentPage.allItemLogics };
      itemsToDelete.forEach(id => delete newAllItemLogics[id]);
      
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
    
    // 削除後は選択解除
    // ★ タブは残す方針なので、resetSelection ではなく handleBackgroundClick 相当の処理にする
    // しかし、削除されたアイテムのタブが残っていても仕方ないので、タブも閉じるべきかもしれない。
    // ここでは resetSelection を呼び、タブも閉じる挙動とする。
    useSelectionStore.getState().resetSelection();
  },

  updateItem: (itemId, updatedProps, skipHistory = false) => {
    if (!skipHistory) get().commitHistory();
    set(state => {
      const { selectedPageId, pages } = state;
      if (!selectedPageId) return state;
      const currentPage = pages[selectedPageId];
      const newPlacedItems = currentPage.placedItems.map(item => {
        if (item.id === itemId) {
          if (updatedProps.data) {
            return { ...item, ...updatedProps, data: { ...item.data, ...updatedProps.data } };
          }
          return { ...item, ...updatedProps };
        }
        return item;
      });
      return { pages: { ...pages, [selectedPageId]: { ...currentPage, placedItems: newPlacedItems } } };
    });
    const newLabel = (updatedProps.data as Partial<PlacedItemType['data']>)?.text || updatedProps.name;
    if (newLabel) useSelectionStore.getState().updateTabLabel(itemId, newLabel);
  },

  updateItems: (updates, skipHistory = false) => {
    if (!skipHistory) get().commitHistory();
    set(state => {
      const { selectedPageId, pages } = state;
      if (!selectedPageId) return state;
      const currentPage = pages[selectedPageId];
      
      const newPlacedItems = currentPage.placedItems.map(item => {
        const update = updates.find(u => u.id === item.id);
        if (update) {
          if (update.props.data) {
            return { ...item, ...update.props, data: { ...item.data, ...update.props.data } };
          }
          return { ...item, ...update.props };
        }
        return item;
      });
      return { pages: { ...pages, [selectedPageId]: { ...currentPage, placedItems: newPlacedItems } } };
    });
  },

  reorderItems: (sourceIndex, destinationIndex) => {
    get().commitHistory();
    set(state => {
      const { selectedPageId, pages } = state;
      if (!selectedPageId) return state;
      const currentPage = pages[selectedPageId];
      const newItems = [...currentPage.placedItems];
      const [removed] = newItems.splice(sourceIndex, 1);
      newItems.splice(destinationIndex, 0, removed);
      return { pages: { ...pages, [selectedPageId]: { ...currentPage, placedItems: newItems } } };
    });
  },

  groupItems: (itemIds) => {
    if (itemIds.length < 2) return;
    get().commitHistory();
    set(state => {
      const { selectedPageId, pages } = state;
      if (!selectedPageId) return state;
      const currentPage = pages[selectedPageId];
      const itemsToGroup = currentPage.placedItems.filter(item => itemIds.includes(item.id));
      if (itemsToGroup.length === 0) return state;

      const minX = Math.min(...itemsToGroup.map(i => i.x));
      const minY = Math.min(...itemsToGroup.map(i => i.y));
      const maxX = Math.max(...itemsToGroup.map(i => i.x + i.width));
      const maxY = Math.max(...itemsToGroup.map(i => i.y + i.height));
      
      const groupItem: PlacedItemType = {
        id: `group-${Date.now()}`,
        name: "グループ",
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
        data: { text: "Group", src: null }
      };

      const newItems = currentPage.placedItems.map(item => {
        if (itemIds.includes(item.id)) {
          return {
            ...item,
            x: item.x - minX,
            y: item.y - minY,
            groupId: groupItem.id
          };
        }
        return item;
      });
      newItems.push(groupItem);
      useSelectionStore.getState().handleItemSelect(groupItem.id, "グループ");
      return { pages: { ...pages, [selectedPageId]: { ...currentPage, placedItems: newItems } } };
    });
  },

  ungroupItems: (groupId) => {
    get().commitHistory();
    set(state => {
      const { selectedPageId, pages } = state;
      if (!selectedPageId) return state;
      const currentPage = pages[selectedPageId];
      const groupItem = currentPage.placedItems.find(i => i.id === groupId);
      if (!groupItem) return state;

      const newItems = currentPage.placedItems.map(item => {
        if (item.groupId === groupId) {
          return {
            ...item,
            x: item.x + groupItem.x,
            y: item.y + groupItem.y,
            groupId: undefined
          };
        }
        return item;
      }).filter(item => item.id !== groupId);

      useSelectionStore.getState().resetSelection();
      return { pages: { ...pages, [selectedPageId]: { ...currentPage, placedItems: newItems } } };
    });
  },

  moveItemInArray: (itemId, moveFn) => {
    get().commitHistory();
    set(state => {
      const { selectedPageId, pages } = state;
      if (!selectedPageId) return state;
      const currentPage = pages[selectedPageId];
      const index = currentPage.placedItems.findIndex(item => item.id === itemId);
      if (index === -1) return state;
      const newPlacedItems = moveFn(currentPage.placedItems, index);
      return { pages: { ...pages, [selectedPageId]: { ...currentPage, placedItems: newPlacedItems }, } };
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

  applyNodesChange: (changes) => {
    get().commitHistory();
    set(state => {
      const { selectedPageId, pages } = state;
      const activeLogicGraphId = useSelectionStore.getState().activeLogicGraphId;
      if (!selectedPageId || !activeLogicGraphId) return state;
      const currentPage = pages[selectedPageId];
      const currentGraph = currentPage.allItemLogics[activeLogicGraphId];
      if (!currentGraph) return state;
      const newNodes = applyNodeChanges(changes, currentGraph.nodes);
      useSelectionStore.getState().updateNodeTabLabels(newNodes);
      const newAllItemLogics = { ...currentPage.allItemLogics, [activeLogicGraphId]: { ...currentGraph, nodes: newNodes } };
      return { pages: { ...pages, [selectedPageId]: { ...currentPage, allItemLogics: newAllItemLogics } } };
    });
  },
  applyEdgesChange: (changes) => {
    get().commitHistory();
    set(state => {
      const { selectedPageId, pages } = state;
      const activeLogicGraphId = useSelectionStore.getState().activeLogicGraphId;
      if (!selectedPageId || !activeLogicGraphId) return state;
      const currentPage = pages[selectedPageId];
      const currentGraph = currentPage.allItemLogics[activeLogicGraphId];
      if (!currentGraph) return state;
      const newEdges = applyEdgeChanges(changes, currentGraph.edges);
      const newAllItemLogics = { ...currentPage.allItemLogics, [activeLogicGraphId]: { ...currentGraph, edges: newEdges } };
      return { pages: { ...pages, [selectedPageId]: { ...currentPage, allItemLogics: newAllItemLogics } } };
    });
  },
  applyConnect: (connection) => {
    get().commitHistory();
    set(state => {
      const { selectedPageId, pages } = state;
      const activeLogicGraphId = useSelectionStore.getState().activeLogicGraphId;
      if (!selectedPageId || !activeLogicGraphId) return state;
      const currentPage = pages[selectedPageId];
      const currentGraph = currentPage.allItemLogics[activeLogicGraphId];
      if (!currentGraph) return state;
      const newEdges = addEdge(connection, currentGraph.edges);
      const newAllItemLogics = { ...currentPage.allItemLogics, [activeLogicGraphId]: { ...currentGraph, edges: newEdges } };
      return { pages: { ...pages, [selectedPageId]: { ...currentPage, allItemLogics: newAllItemLogics } } };
    });
  },
  addNodeToCurrentGraph: (newNode) => {
    get().commitHistory();
    set(state => {
      const { selectedPageId, pages } = state;
      const activeLogicGraphId = useSelectionStore.getState().activeLogicGraphId;
      if (!selectedPageId || !activeLogicGraphId) return state;
      const currentPage = pages[selectedPageId];
      const currentGraph = currentPage.allItemLogics[activeLogicGraphId];
      if (!currentGraph) return state;
      const newAllItemLogics = { ...currentPage.allItemLogics, [activeLogicGraphId]: { ...currentGraph, nodes: [...currentGraph.nodes, newNode] } };
      return { pages: { ...pages, [selectedPageId]: { ...currentPage, allItemLogics: newAllItemLogics } } };
    });
  },
  updateNodeData: (nodeId, dataUpdate) => {
    get().commitHistory();
    set(state => {
      const { selectedPageId, pages } = state;
      const activeLogicGraphId = useSelectionStore.getState().activeLogicGraphId;
      if (!selectedPageId || !activeLogicGraphId) return state;
      const currentPage = pages[selectedPageId];
      const currentGraph = currentPage.allItemLogics[activeLogicGraphId];
      if (!currentGraph) return state;
      const newNodes = currentGraph.nodes.map(node => 
        node.id === nodeId ? { ...node, data: { ...node.data, ...dataUpdate } } : node
      );
      if (dataUpdate.label) useSelectionStore.getState().updateTabLabel(nodeId, dataUpdate.label);
      const newAllItemLogics = { ...currentPage.allItemLogics, [activeLogicGraphId]: { ...currentGraph, nodes: newNodes } };
      return { pages: { ...pages, [selectedPageId]: { ...currentPage, allItemLogics: newAllItemLogics } } };
    });
  },
}));