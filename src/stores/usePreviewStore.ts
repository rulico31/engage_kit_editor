// src/stores/usePreviewStore.ts

import { create } from 'zustand';
import type {
  PreviewState,
  VariableState,
  PlacedItemType,
  NodeGraph,
} from '../types';
import { type ActiveListeners, type LogicRuntimeContext } from '../logicEngine';
import { triggerEvent } from "../logicEngine"; // ★ 新しいLogicEngine実装を使用
import { usePageStore } from './usePageStore';
import { useProjectStore } from './useProjectStore';
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

  // プロジェクト情報
  projectId: string | null;

  // ページごとの状態スナップショット (戻る機能用)
  pageStateCache: Record<string, PreviewState>;

  // --- Actions ---
  initPreview: () => void;
  stopPreview: () => void;

  setPreviewState: (newState: PreviewState | ((prev: PreviewState) => PreviewState)) => void;
  setVariables: (newVars: VariableState | ((prev: VariableState) => VariableState)) => void;
  setProjectId: (id: string) => void;

  // ページ遷移リクエスト処理
  handlePageChangeRequest: (pageId: string, options?: { skipHistory?: boolean; restoreFromCache?: boolean }) => void;
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
const variablesRef = { current: {} as VariableState }; // 復元
// 思考時間計測用タイマー (Zustand外で管理)
const interactionTimerRef = { current: 0 };

export const usePreviewStore = create<PreviewStoreState>((set, get) => ({
  previewState: { currentPageId: '', variables: {}, history: [] },
  variables: {},
  activeListeners: new Map(),
  currentNodeExecution: null, // 削除予定だが型定義に残っているためnull
  engagementScore: 0,
  scoreBreakdown: [],
  navigationHistory: [],
  currentHistoryIndex: -1,
  nodeRevisitCounts: {},
  projectId: null,
  pageStateCache: {}, // キャッシュ初期化

  // --- Actions ---

  initPreview: () => {
    const pageId = usePageStore.getState().selectedPageId;
    if (!pageId) return;

    const page = usePageStore.getState().pages[pageId];
    if (!page) return;
    const items = page.placedItems;
    const initialPS: PreviewState = { currentPageId: pageId, variables: {}, history: [] };

    items.forEach((item: PlacedItemType) => {
      let isVisible = item.data.initialVisibility !== false;
      const initialX = item.x;
      const initialY = item.y;
      initialPS[item.id] = { isVisible, x: initialX, y: initialY, opacity: 1, scale: 1, rotation: 0, transition: null };
    });

    previewStateRef.current = initialPS;
    variablesRef.current = {};
    interactionTimerRef.current = Date.now(); // ★ タイマー初期化

    set({
      previewState: initialPS,
      variables: {},
      activeListeners: new Map(),
    });

    // 古い計測開始コードは削除
  },

  stopPreview: () => {
    previewStateRef.current = { currentPageId: '', variables: {}, history: [] };
    variablesRef.current = {};
    set({
      previewState: { currentPageId: '', variables: {}, history: [] },
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

  setProjectId: (id) => {
    set({ projectId: id });
  },

  handlePageChangeRequest: (targetPageId, options = {}) => {
    const { pages } = usePageStore.getState();

    // ★ 現在のページの状態をキャッシュに保存 (ページIDがある場合のみ)
    const currentState = get();
    const currentPageId = currentState.previewState.currentPageId;
    if (currentPageId) {
      const currentSnapshot = { ...previewStateRef.current };
      set((state) => ({
        pageStateCache: {
          ...state.pageStateCache,
          [currentPageId]: currentSnapshot
        }
      }));
    }

    const targetPageData = pages[targetPageId];

    if (!targetPageData) {
      console.warn(`[PreviewStore] 存在しないページ (ID: ${targetPageId}) への遷移リクエスト`);
      return;
    }

    usePageStore.getState().setSelectedPageId(targetPageId);

    // ★ 履歴記録 (戻る操作以外の場合)
    if (!options?.skipHistory) {
      get().recordNavigation(targetPageId);
    }

    let nextPreviewState: PreviewState;

    // ★ キャッシュからの復元を試みる (restoreFromCacheオプションがあり、かつキャッシュが存在する場合)
    if (options.restoreFromCache && currentState.pageStateCache[targetPageId]) {
      console.log(`[PreviewStore] Restoring snapshot for page: ${targetPageId}`);
      nextPreviewState = {
        ...currentState.pageStateCache[targetPageId],
        currentPageId: targetPageId //念のためIDはターゲットにする
      };
    } else {
      // 通常の初期化
      const initialPS: PreviewState = { currentPageId: targetPageId, variables: {}, history: [] };
      targetPageData.placedItems.forEach((item: PlacedItemType) => {
        const isVisible = item.data.initialVisibility !== false;
        const initialX = item.x;
        const initialY = item.y;
        initialPS[item.id] = { isVisible, x: initialX, y: initialY, opacity: 1, scale: 1, rotation: 0, transition: null };
      });
      nextPreviewState = initialPS;
    }

    previewStateRef.current = nextPreviewState;

    // ★ ページ遷移時にタイマーリセット（前のページの最後の思考時間は遷移トリガーのアクションで記録済み）
    interactionTimerRef.current = Date.now();

    set({
      previewState: nextPreviewState,
    });

    // 古い計測開始コードは削除
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

    // ★ 思考時間 (Thinking Time) の計測とログ記録
    // ユーザー操作 (click, input completion) のみを対象とする
    if (eventName === 'click' || eventName === 'onInputComplete') {
      const now = Date.now();
      const durationMs = now - interactionTimerRef.current;
      interactionTimerRef.current = now; // タイマーリセット

      // 除外ルールの適用
      // 1. 極端に短い (100ms未満) -> ノイズ
      // 2. 極端に長い (30分以上) -> 除外
      if (durationMs < 1800000) { // 30分未満
        let thinkingPattern: 'intuitive' | 'normal' | 'hesitation' | 'noise' = 'normal';

        if (durationMs < 100) {
          thinkingPattern = 'noise';
        } else if (durationMs < 2500) {
          thinkingPattern = 'intuitive';
        } else if (durationMs < 8000) {
          thinkingPattern = 'normal';
        } else {
          thinkingPattern = 'hesitation';
        }

        // ノイズ以外、またはノイズも記録して分析側で弾く方針なら記録
        // 仕様では「記録はするがundefinedまたはnoise」とのこと

        // ページ名・ノード名の解決
        let nodeName = originItemId;
        const item = currentPage.placedItems.find((i: PlacedItemType) => i.id === originItemId);
        if (item) {
          nodeName = item.data?.text || item.name;

          // ★ テキスト入力に対する 'click' と 'onInputComplete' イベントはログ記録しない
          // 理由: ArtboardItem.handleBlur で 'input_correction' ログが送られるため、
          //       ここでも送信するとダブルカウントになってしまう。
          // 入力欄については 'input_correction' のみを使用する。
          if ((eventName === 'click' || eventName === 'onInputComplete') && item.name.startsWith('テキスト入力欄')) {
            return;
          }
        }


        // Fix for missing projectId: Try getting from URL if store is empty
        let projectId = useProjectStore.getState().currentProjectId || get().projectId || undefined;
        if (!projectId) {
          const params = new URLSearchParams(window.location.search);
          projectId = params.get('project_id') || undefined;
        }

        logAnalyticsEvent('interaction', {
          nodeId: originItemId,
          nodeType: 'interaction', // イベントタイプとして使用
          metadata: {
            event_name: eventName,
            duration_ms: durationMs,
            thinking_pattern: thinkingPattern,
            page_id: selectedPageId,
            page_name: currentPage.name,
            node_name: nodeName,
          }
        }, projectId); // ★ Editor/Preview両対応
      }
    }

    const { placedItems, allItemLogics } = currentPage;

    // ★★ B2B Scoring: スコア加算はここで1回だけ行う（triggerEventループの前）
    // これにより、複数のロジックグラフに対してtriggerEventが呼ばれても、スコアは1回だけ加算される
    if (eventName === 'click') {
      const targetItem = placedItems.find((i: PlacedItemType) => i.id === originItemId);
      if (targetItem && targetItem.data.score && typeof targetItem.data.score === 'number') {
        const currentScore = (variablesRef.current._system_total_score as number) || 0;
        const scoreToAdd = targetItem.data.score;
        const newScore = currentScore + scoreToAdd;

        console.log(`📈 [handleItemEvent] Score Update: ${currentScore} + ${scoreToAdd} = ${newScore}`);

        variablesRef.current = {
          ...variablesRef.current,
          _system_total_score: newScore
        };
        set({ variables: variablesRef.current });

        // スコア変更のアナリティクスログ
        logAnalyticsEvent('score_change', {
          nodeId: originItemId,
          nodeType: 'item_interaction',
          metadata: {
            oldScore: currentScore,
            newScore: newScore,
            added: scoreToAdd,
            itemLabel: targetItem.data?.text || targetItem.data?.label || targetItem.name
          }
        }, useProjectStore.getState().currentProjectId || get().projectId || undefined); // ★ Editor用にuseProjectStoreを優先
      }
    }

    Object.entries(allItemLogics).forEach(([logicOwnerId, targetGraph]) => {
      const graph = targetGraph as NodeGraph;
      if (graph && graph.nodes && graph.nodes.length > 0) {
        triggerEvent(
          eventName,
          originItemId,
          logicOwnerId,
          graph,
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

  // 古い計測メソッドは空の実装にするか警告を出す（インターフェース維持のため）
  startNodeExecution: (_nodeId, _nodeType) => { /* Deprecated */ },
  endNodeExecution: () => { /* Deprecated */ },

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

    // ページ名解決
    const { pages } = usePageStore.getState();
    const fromPageName = pages[fromEntry.pageId]?.name || fromEntry.pageId;
    const toPageName = pages[toEntry.pageId]?.name || toEntry.pageId;

    console.log('[usePreviewStore] Sending Backtrack Log:', { fromPageName, toPageName, projectId: get().projectId });

    // バックトラッキングログ記録
    logAnalyticsEvent('backtracking', {
      from_page_id: fromEntry.pageId,
      from_page_name: fromPageName,
      from_node_id: fromEntry.nodeId,
      to_page_id: toEntry.pageId,
      to_page_name: toPageName,
      to_node_id: toEntry.nodeId,
      backtrack_distance: state.currentHistoryIndex - newIndex,
      revisit_count: toEntry.nodeId ? state.nodeRevisitCounts[toEntry.nodeId] : 0,
      total_backtracks: Object.values(state.nodeRevisitCounts).reduce((a, b) => a + b, 0),
    }, get().projectId || undefined);

    console.log('[usePreviewStore] Backtrack Log Sent');

    // ページ遷移 (キャッシュからの復元を有効化)
    if (toEntry.pageId !== fromEntry.pageId) {
      get().handlePageChangeRequest(toEntry.pageId, { skipHistory: true, restoreFromCache: true });
    }

    set({ currentHistoryIndex: newIndex });
  },

  // 戻れるか判定
  canGoBack: () => {
    return get().currentHistoryIndex > 0;
  },
}));