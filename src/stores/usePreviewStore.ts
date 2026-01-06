// src/stores/usePreviewStore.ts

import { create } from 'zustand';
import type {
  PreviewState,
  VariableState,

} from '../types';
import { type ActiveListeners, type LogicRuntimeContext } from '../logicEngine';
import { triggerEvent } from '../logic/triggerEvent'; // ★ 新しいLogicEngine実装を使用
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

  // ノード滞在時間計測
  currentNodeExecution: {
    nodeId: string;
    nodeType: string;
    startTime: number; // Date.now()
  } | null;

  // エンゲージメントスコア
  engagementScore: number;
  scoreBreakdown: Array<{
    node_id: string;
    node_type: string;
    score_added: number;
    reason: string;
    timestamp: string;
  }>;

  // ナビゲーション履歴（バックトラッキング検知用）
  navigationHistory: Array<{
    pageId: string;
    nodeId?: string;
    visitedAt: number;
  }>;
  currentHistoryIndex: number;
  nodeRevisitCounts: Record<string, number>; // { [nodeId]: count }

  // --- Actions ---
  initPreview: () => void;
  stopPreview: () => void;

  setPreviewState: (newState: PreviewState | ((prev: PreviewState) => PreviewState)) => void;
  setVariables: (newVars: VariableState | ((prev: VariableState) => VariableState)) => void;

  // ページ遷移リクエスト処理
  handlePageChangeRequest: (pageId: string) => void;
  handleVariableChangeFromItem: (variableName: string, value: any) => void;
  handleItemEvent: (eventName: string, itemId: string) => void;

  // ノード滞在時間計測
  startNodeExecution: (nodeId: string, nodeType: string) => void;
  endNodeExecution: () => void;

  // エンゲージメントスコア
  addScore: (nodeId: string, nodeType: string, scoreValue: number, reason: string) => void;
  getScoreTier: () => 'cold' | 'warm' | 'hot' | 'super_hot';
  resetScore: () => void;

  // バックトラッキング検知
  recordNavigation: (pageId: string, nodeId?: string) => void;
  goBack: () => void;
  canGoBack: () => boolean;
}

// プレビュー状態はZustandの外部でRefとして保持する
// (logicEngine内の高頻度更新による再描画を防ぐため)
const previewStateRef = { current: {} as PreviewState };
const variablesRef = { current: {} as VariableState };

export const usePreviewStore = create<PreviewStoreState>((set, get) => ({
  previewState: { currentPageId: '', isFinished: false },
  variables: {},
  activeListeners: new Map(),
  currentNodeExecution: null, // 滞在時間計測用
  engagementScore: 0, // エンゲージメントスコア
  scoreBreakdown: [], // スコア履歴
  navigationHistory: [], // ナビゲーション履歴
  currentHistoryIndex: -1, // 現在の履歴インデックス
  nodeRevisitCounts: {}, // ノード再訪回数

  // --- Actions ---

  initPreview: () => {
    const pageId = usePageStore.getState().selectedPageId;
    if (!pageId) return;

    const page = usePageStore.getState().pages[pageId];
    if (!page) return;
    const items = page.placedItems;
    const initialPS: PreviewState = { currentPageId: pageId, isFinished: false };

    items.forEach(item => {
      // 初期表示設定を反映 (未設定の場合は true)
      let isVisible = item.data.initialVisibility !== false;

      // ★ ミニチュア方式: 常にPC座標のみ使用
      const initialX = item.x;
      const initialY = item.y;

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

      // ★ ミニチュア方式: 常にPC座標のみ使用
      const initialX = item.x;
      const initialY = item.y;

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

  // ノード滞在時間計測開始
  startNodeExecution: (nodeId, nodeType) => {
    set({
      currentNodeExecution: {
        nodeId,
        nodeType,
        startTime: Date.now(),
      }
    });
  },

  // ノード滞在時間計測終了
  endNodeExecution: () => {
    const state = get();
    if (!state.currentNodeExecution) return;

    const { nodeId, nodeType, startTime } = state.currentNodeExecution;
    const endTime = Date.now();
    const durationMs = endTime - startTime;

    // 滞在時間の分類
    const isQuickDecision = durationMs < 3000;      // 3秒以内の即断
    const isDeepThinking = durationMs > 10000;      // 10秒以上の熟考
    const isAnomaly = durationMs > 180000;          // 3分以上の異常な長時間

    // ログ記録
    logAnalyticsEvent('node_execution', {
      nodeId,
      nodeType,
      metadata: {
        started_at: new Date(startTime).toISOString(),
        ended_at: new Date(endTime).toISOString(),
        duration_ms: durationMs,
        is_quick_decision: isQuickDecision,
        is_deep_thinking: isDeepThinking,
        is_anomaly: isAnomaly,
      }
    });

    // 計測状態をクリア
    set({ currentNodeExecution: null });
  },

  // エンゲージメントスコア加算
  addScore: (nodeId, nodeType, scoreValue, reason) => {
    const state = get();
    const newScore = state.engagementScore + scoreValue;

    // スコア履歴に追加（最大50件に制限）
    const newEntry = {
      node_id: nodeId,
      node_type: nodeType,
      score_added: scoreValue,
      reason: reason,
      timestamp: new Date().toISOString(),
    };

    const breakdown = [...state.scoreBreakdown, newEntry];

    // 直近50件に制限
    if (breakdown.length > 50) {
      breakdown.shift();
    }

    set({
      engagementScore: newScore,
      scoreBreakdown: breakdown,
    });

    // ログ記録
    logAnalyticsEvent('score_change', {
      nodeId,
      nodeType,
      metadata: {
        current_score: newScore,
        score_delta: scoreValue,
        score_tier: get().getScoreTier(),
        reason: reason,
      }
    });
  },

  // スコア帯判定
  getScoreTier: () => {
    const score = get().engagementScore;
    if (score >= 76) return 'super_hot';
    if (score >= 51) return 'hot';
    if (score >= 26) return 'warm';
    return 'cold';
  },

  // スコアリセット
  resetScore: () => {
    set({
      engagementScore: 0,
      scoreBreakdown: [],
    });
  },

  // ナビゲーション記録
  recordNavigation: (pageId, nodeId) => {
    const state = get();
    const newEntry = {
      pageId,
      nodeId,
      visitedAt: Date.now(),
    };

    // 現在のインデックス以降を削除して新しい履歴を追加
    const newHistory = [
      ...state.navigationHistory.slice(0, state.currentHistoryIndex + 1),
      newEntry
    ];

    // ノード再訪回数を更新
    const revisitCounts = { ...state.nodeRevisitCounts };
    if (nodeId) {
      revisitCounts[nodeId] = (revisitCounts[nodeId] || 0) + 1;
    }

    set({
      navigationHistory: newHistory,
      currentHistoryIndex: newHistory.length - 1,
      nodeRevisitCounts: revisitCounts,
    });
  },

  // 戻る
  goBack: () => {
    const state = get();
    if (state.currentHistoryIndex <= 0) {
      console.warn('これ以上戻れません');
      return;
    }

    const newIndex = state.currentHistoryIndex - 1;
    const fromEntry = state.navigationHistory[state.currentHistoryIndex];
    const toEntry = state.navigationHistory[newIndex];

    // バックトラッキングログ記録
    logAnalyticsEvent('backtracking', {
      metadata: {
        from_page_id: fromEntry.pageId,
        from_node_id: fromEntry.nodeId,
        to_page_id: toEntry.pageId,
        to_node_id: toEntry.nodeId,
        backtrack_distance: state.currentHistoryIndex - newIndex,
        revisit_count: toEntry.nodeId ? state.nodeRevisitCounts[toEntry.nodeId] : 0,
        total_backtracks: Object.values(state.nodeRevisitCounts).reduce((a, b) => a + b, 0),
      }
    });

    // ページ遷移
    if (toEntry.pageId !== fromEntry.pageId) {
      get().handlePageChangeRequest(toEntry.pageId);
    }

    set({ currentHistoryIndex: newIndex });
  },

  // 戻れるか判定
  canGoBack: () => {
    return get().currentHistoryIndex > 0;
  },
}));