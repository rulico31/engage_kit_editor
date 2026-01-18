import type { Node, Edge } from "reactflow";
import type { PlacedItemType, VariableState, PreviewState, NodeGraph } from "./types";
import { submitLeadData } from "./lib/leads";
import { logAnalyticsEvent } from "./lib/analytics";


export type ActiveListeners = Map<string, Array<() => void>>;

/**
 * ロジック実行時に外部に依存する処理を注入するためのコンテキスト
 */
export interface LogicRuntimeContext {
  logEvent: typeof logAnalyticsEvent;
  submitLead: typeof submitLeadData;
  fetchApi: (url: string, options: RequestInit) => Promise<any>;
}
const findNextNodes = (srcId: string, handle: string | null, edges: Edge[]): string[] => {
  return edges
    .filter((e) => {
      if (e.source !== srcId) return false;
      // ★修正: handle が null (指定なし) の場合、どのsourceHandleから出ているエッジも許容する
      // これにより、sourceHandle="source" などのエッジも正しく検出されるようになる
      if (handle === null) {
        return true;
      }
      return e.sourceHandle === handle;
    })
    .map((e) => e.target);
};

/**
 * ヘルパー: 次のノード群をキューに追加する
 */
const pushNext = (srcId: string, handle: string | null, edges: Edge[], queue: string[]) => {
  const nextIds = findNextNodes(srcId, handle, edges);
  queue.push(...nextIds);
};

/**
 * REFACTORED LOGIC ENGINE
 * - Uses Strategy Pattern via NodeExecutor Registry
 * - Separates concerns into individual executor classes
 */

import { registry } from "./logic/NodeExecutor";
// Import Executors
import { ActionExecutor } from "./logic/executors/ActionExecutor";
import { IfExecutor } from "./logic/executors/IfExecutor";
import { PageExecutor } from "./logic/executors/PageExecutor";
import { DelayExecutor } from "./logic/executors/DelayExecutor";
import { EventExecutor } from "./logic/executors/EventExecutor";
import { AnimateExecutor } from "./logic/executors/AnimateExecutor";
import { SetVariableExecutor } from "./logic/executors/SetVariableExecutor";
import { NetworkExecutor } from "./logic/executors/NetworkExecutor";
import { AbTestExecutor } from "./logic/executors/AbTestExecutor";
import { ConfirmationExecutor } from "./logic/executors/ConfirmationExecutor";

// Register Executors
registry.register("actionNode", new ActionExecutor());
registry.register("ifNode", new IfExecutor());
registry.register("pageNode", new PageExecutor());
registry.register("delayNode", new DelayExecutor());
registry.register("eventNode", new EventExecutor());
registry.register("animateNode", new AnimateExecutor());
registry.register("setVariableNode", new SetVariableExecutor());
registry.register("externalApiNode", new NetworkExecutor());
registry.register("submitFormNode", new NetworkExecutor()); // Unified Network Executor
registry.register("submitDataNode", new NetworkExecutor()); // Legacy support
registry.register("abTestNode", new AbTestExecutor());
registry.register("confirmationNode", new ConfirmationExecutor());

/**
 * ロジック実行エンジン (Refactored)
 */
const processQueue = async (
  executionQueue: string[],
  allNodes: Node[],
  allEdges: Edge[],
  placedItems: PlacedItemType[],
  getPreviewState: () => PreviewState,
  setPreviewState: (newState: PreviewState) => void,
  requestPageChange: (pageId: string) => void,
  getVariables: () => VariableState,
  setVariables: (newVars: VariableState) => void,
  activeListeners: ActiveListeners,
  context: LogicRuntimeContext,
  triggerItemId: string | null = null
) => {
  // 再帰呼び出し用のバインド済み関数を作成
  const boundProcessQueue = async (nextQueue: string[]) => {
    if (nextQueue.length > 0) {
      await processQueue(
        nextQueue, allNodes, allEdges, placedItems, getPreviewState, setPreviewState,
        requestPageChange, getVariables, setVariables, activeListeners, context, triggerItemId
      );
    }
  };

  // 1回のループで実行するキュー (非同期でなければここに溜まっていく)
  const currentLevelNextQueue: string[] = [];

  for (const nodeId of executionQueue) {
    const node = allNodes.find((n) => n.id === nodeId);
    if (!node) continue;

    context.logEvent('node_execution', {
      nodeId: node.id,
      nodeType: node.type,
      metadata: { label: node.data.label }
    });

    try {
      const executor = node.type ? registry.getExecutor(node.type) : undefined;
      if (executor) {
        await executor.execute({
          node,
          allNodes,
          allEdges,
          placedItems,
          getPreviewState,
          setPreviewState,
          requestPageChange,
          getVariables,
          setVariables,
          activeListeners,
          context,
          triggerItemId,
          // Utils
          pushNext,
          processQueue: boundProcessQueue,
          accumulatedQueue: currentLevelNextQueue
        });
      } else {
        console.warn(`⚠️ Unhandled Node Type: ${node.type}`);
        // Unknown nodes just pass through if possible, or stop.
        // Let's try to pass through by default logic if we ever had one, but strict is better.
      }
    } catch (error: any) {
      console.error(`❌ Node execution error[${node.id}]: `, error);
      context.logEvent('error', {
        nodeId: node.id,
        nodeType: node.type,
        metadata: {
          message: error?.message || 'Unknown logic error',
          stack: error?.stack
        }
      });
    }
  }

  // 同期的に蓄積されたキューがあれば、再帰的に実行
  if (currentLevelNextQueue.length > 0) {
    await boundProcessQueue(currentLevelNextQueue);
  }
};

/**
 * 確認画面の結果を処理する関数
 */
export const onConfirmationResult = (
  nodeId: string,
  result: 'back' | 'confirm',
  currentPageGraph: NodeGraph,
  placedItems: PlacedItemType[],
  getPreviewState: () => PreviewState,
  setPreviewState: (newState: PreviewState) => void,
  requestPageChange: (pageId: string) => void,
  getVariables: () => VariableState,
  setVariables: (newVars: VariableState) => void,
  activeListeners: ActiveListeners,
  context: LogicRuntimeContext
) => {
  if (import.meta.env.DEV) {
    console.log('📋 確認画面の結果を処理', {
      nodeId,
      result
    });
  }

  // モーダルを閉じる
  const currentState = getPreviewState();
  setPreviewState({
    ...currentState,
    confirmationModal: {
      ...currentState.confirmationModal!,
      isOpen: false
    }
  });

  context.logEvent('logic_branch', {
    nodeId,
    nodeType: 'confirmationNode',
    metadata: {
      result,
      action: result === 'confirm' ? 'confirmed' : 'back'
    }
  });

  // 次のノードに進む
  const { nodes, edges } = currentPageGraph;
  const nextNodeIds = findNextNodes(nodeId, result, edges);

  if (nextNodeIds.length > 0) {
    processQueue(
      nextNodeIds,
      nodes,
      edges,
      placedItems,
      getPreviewState,
      setPreviewState,
      requestPageChange,
      getVariables,
      setVariables,
      activeListeners,
      context,
      null
    );
  }
};

/**
 * イベントトリガー
 */
export const triggerEvent = (
  eventName: string,
  targetItemId: string,
  logicOwnerId: string, // ★追加: ロジックの所有者ID
  currentPageGraph: NodeGraph,
  placedItems: PlacedItemType[],
  getPreviewState: () => PreviewState,
  setPreviewState: (newState: PreviewState) => void,
  requestPageChange: (pageId: string) => void,
  getVariables: () => VariableState,
  setVariables: (newVars: VariableState) => void,
  activeListeners: ActiveListeners,
  context: LogicRuntimeContext
) => {
  const { nodes, edges } = currentPageGraph;

  if (import.meta.env.DEV) {
    console.log('🔔 イベント発火', {
      eventName,
      targetItemId,
      logicOwnerId,
      totalNodes: nodes.length,
      totalEdges: edges.length
    });
  }

  // 1. 「待機中」のフローを再開させる
  if (eventName === "click" && activeListeners.has(targetItemId)) {
    const listeners = activeListeners.get(targetItemId);
    if (listeners) {
      listeners.forEach(resume => resume());
      activeListeners.delete(targetItemId);
    }
  }

  // --- B2B Scoring Logic は usePreviewStore.handleItemEvent に移動済み ---
  // triggerEvent は複数回呼ばれるため、ここではスコア加算しない

  // 2. イベント開始ノードを探す
  const startingNodes = nodes.filter((n) => {
    if (n.type !== "eventNode" || n.data.eventType !== eventName) return false;

    // A. 複数ターゲット指定 (targetItemIds) がある場合
    if (Array.isArray(n.data.targetItemIds) && n.data.targetItemIds.length > 0) {
      return n.data.targetItemIds.includes(targetItemId);
    }

    // B. 単一ターゲット指定 (targetItemId / targetName) がある場合 (Legacy)
    if (n.data.targetItemId) {
      return n.data.targetItemId === targetItemId;
    }

    // C. ターゲット指定なし (Implicit Self)
    // 所有者とターゲットが一致する場合のみ発火 (自分自身のクリックイベントなど)
    return logicOwnerId === targetItemId;
  });

  if (import.meta.env.DEV) {
    console.log('🎯 見つかったイベントノード', {
      count: startingNodes.length,
      nodes: startingNodes.map(n => ({ id: n.id, label: n.data.label }))
    });
  }

  if (startingNodes.length > 0) {
    const initialQueue: string[] = [];

    startingNodes.forEach(startNode => {
      // イベントノードからの出力を探す（ハンドル指定なし）
      const nextIds = findNextNodes(startNode.id, null, edges);
      initialQueue.push(...nextIds);
    });

    if (initialQueue.length > 0) {
      if (initialQueue.length > 0) {
        processQueue(initialQueue, nodes, edges, placedItems, getPreviewState, setPreviewState, requestPageChange, getVariables, setVariables, activeListeners, context, targetItemId);
      }
    }
  }
};

// 互換性維持
export const executeLogicGraph = (
  startNodeId: string,
  graph: NodeGraph,
  previewState: PreviewState,
  setPreviewState: (newState: PreviewState | ((prev: PreviewState) => PreviewState)) => void
) => {
  console.warn(
    "executeLogicGraph is deprecated.",
    startNodeId,
    graph,
    previewState,
    setPreviewState
  );
};