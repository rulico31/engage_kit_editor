// src/stores/usePreviewStore.ts

import { create } from 'zustand';
import type {
  PreviewState,
  VariableState,

} from '../types';
import { type ActiveListeners, type LogicRuntimeContext } from '../logicEngine';
import { triggerEvent } from '../logic/triggerEvent'; // ★ 新しいLogicEngine実装を使用
import { usePageStore } from './usePageStore';
import { useEditorSettingsStore } from './useEditorSettingsStore';
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

    // Content-Typeをチェックして適切に処理
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    } else {
      // JSON以外（HTML、テキストなど）はテキストとして返す
      return response.text();
    }
  },
};

interface PreviewStoreState {
  previewState: PreviewState;
  variables: VariableState;

  activeListeners: ActiveListeners;

  // --- Actions ---
  initPreview: (isMobileOverride?: boolean) => void;
  stopPreview: () => void;

  setPreviewState: (newState: PreviewState | ((prev: PreviewState) => PreviewState)) => void;
  setVariables: (newVars: VariableState | ((prev: VariableState) => VariableState)) => void;

  // ページ遷移リクエスト処理
  handlePageChangeRequest: (pageId: string) => void;
  handleVariableChangeFromItem: (variableName: string, value: any) => void;
  handleItemEvent: (eventName: string, itemId: string) => void;
  // ビューモード切り替え時にレイアウトを即座に更新するアクション
  updateLayoutForViewMode: (isMobile: boolean) => void;
}

// プレビュー状態はZustandの外部でRefとして保持する
// (logicEngine内の高頻度更新による再描画を防ぐため)
const previewStateRef = { current: {} as PreviewState };
const variablesRef = { current: {} as VariableState };

export const usePreviewStore = create<PreviewStoreState>((set, get) => ({
  previewState: { currentPageId: '', isFinished: false },
  variables: {},
  activeListeners: new Map(),

  // --- Actions ---

  initPreview: (isMobileOverride?: boolean) => {
    const pageId = usePageStore.getState().selectedPageId;
    if (!pageId) return;

    const page = usePageStore.getState().pages[pageId];
    if (!page) return; // Ensure page exists
    const items = page.placedItems;
    const initialPS: PreviewState = { currentPageId: pageId, isFinished: false }; // Use PreviewState type

    // ★ 修正: 引数で指定があればそれを優先、なければエディタ設定を使う
    // ViewerHostからは閲覧環境に合わせて true/false が渡される
    const isMobileView = isMobileOverride !== undefined
      ? isMobileOverride
      : useEditorSettingsStore.getState().isMobileView;

    items.forEach(item => {
      // 初期表示設定を反映 (未設定の場合は true)
      let isVisible = item.data.initialVisibility !== false;

      // 表示・非表示の判定 (deviceVisibility)
      // モバイルビューなら mobile隠しがtrueでないかチェック
      // PCビューなら pc隠しがtrueでないかチェック
      if (item.deviceVisibility) {
        if (isMobileView) {
          if (item.deviceVisibility.hideOnMobile) isVisible = false;
        } else {
          if (item.deviceVisibility.hideOnDesktop) isVisible = false;
        }
      }

      // モバイルビューの場合はモバイル座標を初期値にする
      const initialX = isMobileView && item.mobileX !== undefined ? item.mobileX : item.x;
      const initialY = isMobileView && item.mobileY !== undefined ? item.mobileY : item.y;

      initialPS[item.id] = { isVisible, x: initialX, y: initialY, opacity: 1, scale: 1, rotation: 0, transition: null };
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
    previewStateRef.current = { currentPageId: '', isFinished: false };
    variablesRef.current = {};
    set({
      previewState: { currentPageId: '', isFinished: false },
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
    const isMobileView = useEditorSettingsStore.getState().isMobileView; // ★ モバイル判定取得
    const targetPageData = pages[targetPageId];

    if (!targetPageData) {
      console.warn(`[PreviewStore] 存在しないページ (ID: ${targetPageId}) への遷移リクエスト`);
      return;
    }

    // 1. (外部ストア) PageStore の選択ページIDを更新
    usePageStore.getState().setSelectedPageId(targetPageId);

    // 2. (内部ストア) プレビュー状態をリセット
    const initialPS: PreviewState = { currentPageId: targetPageId, isFinished: false };
    targetPageData.placedItems.forEach(item => {
      const isVisible = item.data.initialVisibility !== false;

      // モバイルビューの場合はモバイル座標を初期値にする
      const initialX = isMobileView && item.mobileX !== undefined ? item.mobileX : item.x;
      const initialY = isMobileView && item.mobileY !== undefined ? item.mobileY : item.y;

      initialPS[item.id] = { isVisible, x: initialX, y: initialY, opacity: 1, scale: 1, rotation: 0, transition: null };
    });

    // Refも更新（triggerEventがこちらを参照するため重要）
    previewStateRef.current = initialPS;

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

    // ★ 全ロジックグラフをスキャンするように変更
    // (特定のアイテムだけでなく、他のアイテムのロジック内に定義されたイベントハンドラも発火させるため)
    Object.entries(allItemLogics).forEach(([logicOwnerId, targetGraph]) => {
      // グラフが存在し、ノードが含まれている場合のみ実行
      if (targetGraph && targetGraph.nodes.length > 0) {
        triggerEvent(
          eventName,
          originItemId,
          logicOwnerId, // ★第三引数として logicOwnerId を渡す (logicEngine側も修正が必要)
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
    });
  },

  updateLayoutForViewMode: (isMobile: boolean) => {
    const { pages, selectedPageId } = usePageStore.getState();
    const currentPage = pages[selectedPageId!];
    if (!currentPage) return;

    // 現在のプレビュー状態をベースにする
    const currentPS = previewStateRef.current;
    if (!currentPS || !currentPS.currentPageId) return;

    const newPS = { ...currentPS };

    // 現在のページのアイテム座標をビューモードに合わせて更新
    // (isVisibleやopacityなどの動的な状態は維持される)
    currentPage.placedItems.forEach(item => {
      if (newPS[item.id]) {
        const x = isMobile && item.mobileX !== undefined ? item.mobileX : item.x;
        const y = isMobile && item.mobileY !== undefined ? item.mobileY : item.y;

        newPS[item.id] = {
          ...newPS[item.id],
          x,
          y
        };
      }
    });

    previewStateRef.current = newPS;
    set({ previewState: newPS });
  },
}));