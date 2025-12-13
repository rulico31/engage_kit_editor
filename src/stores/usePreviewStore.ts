// src/stores/usePreviewStore.ts

import { create } from 'zustand';
import type {
  PreviewState,
  VariableState,

} from '../types';
import { triggerEvent, type ActiveListeners, type LogicRuntimeContext } from '../logicEngine';
import { usePageStore } from './usePageStore';
import { logAnalyticsEvent } from '../lib/analytics';
import { submitLeadData } from '../lib/leads';



// ランタイムコンテキストの実装
const runtimeContext: LogicRuntimeContext = {
  logEvent: logAnalyticsEvent,
  submitLead: submitLeadData,
  fetchApi: async (url, options) => {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    return response.json();
  },
};

interface PreviewStoreState {
  previewState: PreviewState;
  variables: VariableState;

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
  activeListeners: new Map(),

  // --- Actions ---

  initPreview: () => {
    const { pages, selectedPageId } = usePageStore.getState();
    const currentPage = pages[selectedPageId!];
    if (!currentPage) return;



    const initialPS: PreviewState = {};
    currentPage.placedItems.forEach(item => {
      // 初期表示設定を反映 (未設定の場合は true)
      const isVisible = item.data.initialVisibility !== false;
      initialPS[item.id] = { isVisible, x: item.x, y: item.y, opacity: 1, scale: 1, rotation: 0, transition: null };
    });

    // 2. Refを初期化
    previewStateRef.current = initialPS;
    variablesRef.current = {};

    // 3. ストアをセット
    set({
      previewState: initialPS,
      variables: {},
      activeListeners: new Map(),
    });
  },

  stopPreview: () => {
    previewStateRef.current = {};
    variablesRef.current = {};
    set({
      previewState: {},
      variables: {},
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
      const isVisible = item.data.initialVisibility !== false;
      initialPS[item.id] = { isVisible, x: item.x, y: item.y, opacity: 1, scale: 1, rotation: 0, transition: null };
    });

    set({
      previewState: initialPS,
    });
  },

  handleVariableChangeFromItem: (variableName, value) => {
    if (!variableName) return;
    variablesRef.current = { ...variablesRef.current, [variableName]: value };
    set({ variables: variablesRef.current });
  },

  handleItemEvent: (eventName, originItemId) => {
    const { pages, selectedPageId } = usePageStore.getState();
    const currentPage = pages[selectedPageId!];
    if (!currentPage) return;

    const { placedItems, allItemLogics } = currentPage;

    // ★ イベントバブリングの実装
    // クリックされたアイテムから開始し、親グループ(groupId)を辿って順にロジックを実行する
    let currentId: string | undefined = originItemId;

    while (currentId) {
      const targetGraph = allItemLogics[currentId];

      // 該当アイテム(またはグループ)にロジックが設定されていれば実行
      if (targetGraph && targetGraph.nodes.length > 0) {
        triggerEvent(
          eventName,
          currentId, // ロジックの所有者IDとして実行
          targetGraph,
          placedItems,
          () => previewStateRef.current,
          get().setPreviewState,
          get().handlePageChangeRequest,
          () => variablesRef.current,
          get().setVariables,
          get().activeListeners,
          runtimeContext
        );
      }

      // 親グループを探してループ継続
      const currentItem = placedItems.find(p => p.id === currentId);
      currentId = currentItem?.groupId;
    }
  },
}));