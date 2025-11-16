// src/stores/usePreviewStore.ts

import create from 'zustand';
import type { 
  PreviewState, 
  VariableState, 
  PreviewBackground,
  NodeGraph
} from '../types';
import { triggerEvent, type ActiveListeners } from '../logicEngine';
import { usePageStore } from './usePageStore';
import { useRef } from 'react';

const initialPreviewBackground: PreviewBackground = { src: null, position: undefined };

interface PreviewStoreState {
  previewState: PreviewState;
  variables: VariableState;
  previewBackground: PreviewBackground;
  activeListeners: ActiveListeners;
  
  // --- Actions ---
  initPreview: () => void;
  stopPreview: () => void;
  
  setPreviewState: (newState: PreviewState | ((prev: PreviewState) => PreviewState)) => void;
  setVariables: (newVars: VariableState | ((prev: VariableState) => VariableState)) => void;
  
  handlePageChangeRequest: (targetPageId: string) => void;
  handleVariableChangeFromItem: (variableName: string, value: any) => void;
  handleItemEvent: (eventName: string, itemId: string) => void;
}

// プレビュー状態はZustandの外部でRefとして保持する
// (logicEngine内の高頻度更新による再描画を防ぐため)
const previewStateRef = { current: {} as PreviewState };
const variablesRef = { current: {} as VariableState };

export const usePreviewStore = create<PreviewStoreState>((set, get) => ({
  previewState: {},
  variables: {},
  previewBackground: initialPreviewBackground,
  activeListeners: new Map(),

  // --- Actions ---
  
  initPreview: () => {
    const { pages, selectedPageId } = usePageStore.getState();
    const currentPage = pages[selectedPageId!];
    if (!currentPage) return;
    
    // 1. BG と State を初期化
    const bgItem = currentPage.placedItems.find(p => p.data.isArtboardBackground);
    const initialBG = bgItem 
      ? { src: bgItem.data.src, position: bgItem.data.artboardBackgroundPosition }
      : initialPreviewBackground;
      
    const initialPS: PreviewState = {};
    currentPage.placedItems.forEach(item => {
      initialPS[item.id] = { isVisible: true, x: item.x, y: item.y, opacity: 1, scale: 1, rotation: 0, transition: null };
    });
    
    // 2. Refを初期化
    previewStateRef.current = initialPS;
    variablesRef.current = {};
    
    // 3. ストアをセット
    set({
      previewState: initialPS,
      variables: {},
      previewBackground: initialBG,
      activeListeners: new Map(),
    });
  },

  stopPreview: () => {
    previewStateRef.current = {};
    variablesRef.current = {};
    set({
      previewState: {},
      variables: {},
      previewBackground: initialPreviewBackground,
      activeListeners: new Map(),
    });
  },
  
  setPreviewState: (newState) => {
    if (typeof newState === 'function') {
      previewStateRef.current = newState(previewStateRef.current);
    } else {
      previewStateRef.current = newState;
    }
    set({ previewState: previewStateRef.current });
  },

  setVariables: (newVars) => {
    if (typeof newVars === 'function') {
      variablesRef.current = newVars(variablesRef.current);
    } else {
      variablesRef.current = newVars;
    }
    set({ variables: variablesRef.current });
  },

  handlePageChangeRequest: (targetPageId) => {
    const { pages } = usePageStore.getState();
    const targetPageData = pages[targetPageId];
    
    if (!targetPageData) {
      console.warn(`[PreviewStore] 存在しないページ (ID: ${targetPageId}) への遷移リクエスト`);
      return;
    }

    // 1. (外部ストア) PageStore の選択ページIDを更新
    usePageStore.getState().setSelectedPageId(targetPageId);
    
    // 2. (内部ストア) プレビュー状態をリセット
    const initialPS: PreviewState = {};
    targetPageData.placedItems.forEach(item => {
      initialPS[item.id] = { isVisible: true, x: item.x, y: item.y, opacity: 1, scale: 1, rotation: 0, transition: null };
    });
    
    const bgItem = targetPageData.placedItems.find(p => p.data.isArtboardBackground);
    const initialBG = bgItem 
      ? { src: bgItem.data.src, position: bgItem.data.artboardBackgroundPosition }
      : initialPreviewBackground;
      
    previewStateRef.current = initialPS;
    
    set({
      previewState: initialPS,
      previewBackground: initialBG,
    });
  },
  
  handleVariableChangeFromItem: (variableName, value) => {
    if (!variableName) return;
    variablesRef.current = { ...variablesRef.current, [variableName]: value };
    set({ variables: variablesRef.current });
  },
  
  handleItemEvent: (eventName, itemId) => {
    const { pages, selectedPageId } = usePageStore.getState();
    const currentPage = pages[selectedPageId!];
    if (!currentPage) return;
    
    const { placedItems, allItemLogics } = currentPage;
    const targetGraph = allItemLogics[itemId];
    const graphToUse = targetGraph || { nodes: [], edges: [] };
    
    triggerEvent(
      eventName,
      itemId,
      graphToUse,
      placedItems,
      () => previewStateRef.current,
      get().setPreviewState,
      get().handlePageChangeRequest,
      () => variablesRef.current,
      get().setVariables,
      get().activeListeners
    );
  },
}));