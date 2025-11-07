// src/logicEngine.ts

import type { Node, Edge } from "reactflow";
import type { PreviewState, NodeGraph } from "./types";

/**
 * 渡されたノードID配列（次に実行すべきノード）を処理する
 * @param executionQueue - 実行待機中のノードIDの配列
 * @param allNodes - グラフ内の全ノード
 * @param allEdges - グラフ内の全エッジ
 * @param getPreviewState - 現在のプレビュー状態を取得する関数
 * @param setPreviewState - プレビュー状態を更新する関数
 */
const processQueue = (
  executionQueue: string[],
  allNodes: Node[],
  allEdges: Edge[],
  getPreviewState: () => PreviewState,
  setPreviewState: (newState: PreviewState) => void
) => {
  const nextQueue: string[] = [];

  for (const nodeId of executionQueue) {
    const node = allNodes.find((n) => n.id === nodeId);
    if (!node) continue;

    console.log(`[LogicEngine] ⚡ 実行中: ${node.data.label || node.id}`);

    // --- ノードの種類に応じて処理を実行 ---

    // (1) アクションノード (表示/非表示)
    if (node.type === "actionNode") {
      const { targetItemId, mode } = node.data;
      if (targetItemId) {
        const currentState = getPreviewState();
        const targetItemState = currentState[targetItemId];

        if (targetItemState) {
          let newVisibility = targetItemState.isVisible;
          if (mode === "show") newVisibility = true;
          else if (mode === "hide") newVisibility = false;
          else if (mode === "toggle") newVisibility = !targetItemState.isVisible;

          // 状態を更新
          setPreviewState({
            ...currentState,
            [targetItemId]: { ...targetItemState, isVisible: newVisibility },
          });
        }
      }
      // ↓↓↓↓↓↓↓↓↓↓ (★ 修正) "source" ではなく null を渡す ↓↓↓↓↓↓↓↓↓↓
      // 次のノード（"source" ハンドルから）を探してキューに追加
      const nextNode = findNextNode(node.id, null, allEdges);
      // ↑↑↑↑↑↑↑↑↑↑ (★ 修正) ↑↑↑↑↑↑↑↑↑↑
      if (nextNode) nextQueue.push(nextNode);
    }

    // (2) If ノード (条件分岐)
    else if (node.type === "ifNode") {
      const { conditionTargetId, conditionType } = node.data;
      const currentState = getPreviewState();
      const targetItemState = currentState[conditionTargetId];

      let conditionResult = false; // デフォルトは False
      if (targetItemState) {
        if (conditionType === "isVisible") {
          conditionResult = targetItemState.isVisible === true;
        } else if (conditionType === "isHidden") {
          conditionResult = targetItemState.isVisible === false;
        }
      }

      console.log(`[LogicEngine] 🧠 条件 (${conditionType}): ${conditionResult}`);

      // 結果に応じて "true" または "false" ハンドルから次のノードを探す
      const nextNode = findNextNode(
        node.id,
        conditionResult ? "true" : "false",
        allEdges
      );
      if (nextNode) nextQueue.push(nextNode);
    }

    // (3) イベントノード (通常はここから始まらないが、念のため)
    else if (node.type === "eventNode") {
      // ↓↓↓↓↓↓↓↓↓↓ (★ 修正) "source" ではなく null を渡す ↓↓↓↓↓↓↓↓↓↓
      const nextNode = findNextNode(node.id, null, allEdges);
      // ↑↑↑↑↑↑↑↑↑↑ (★ 修正) ↑↑↑↑↑↑↑↑↑↑
      if (nextNode) nextQueue.push(nextNode);
    }
  }

  // 次のキューが溜まったら、再帰的に処理（非同期の代わり）
  if (nextQueue.length > 0) {
    processQueue(nextQueue, allNodes, allEdges, getPreviewState, setPreviewState);
  }
};

/**
 * 指定されたソースノードとハンドルに接続されているターゲットノードIDを見つける
 */
const findNextNode = (
  sourceNodeId: string,
  sourceHandle: string | null, // "source", "true", "false", または null
  allEdges: Edge[]
): string | undefined => {
  const edge = allEdges.find(
    (e) => e.source === sourceNodeId && e.sourceHandle === sourceHandle
  );
  return edge?.target;
};

/**
 * 外部から呼び出す実行トリガー
 * @param eventName - "click", "onLoad" など
 * @param targetItemId - イベントが発生したアイテムID
 * @param currentPageGraph - 現在のページの全ロジックグラフ
 * @param getPreviewState - 現在のプレビュー状態を取得する関数
 * @param setPreviewState - プレビュー状態を更新する関数
 */
export const triggerEvent = (
  eventName: string, // "click"
  targetItemId: string, // "item-123"
  currentPageGraph: NodeGraph,
  getPreviewState: () => PreviewState,
  setPreviewState: (newState: PreviewState) => void
) => {
  const { nodes, edges } = currentPageGraph;

  // このイベント（例: "item-123" の "click"）に該当するイベントノードを探す
  // (注: App.tsx側で、allItemLogics[targetItemId] のグラフを渡す想定)
  const startingNode = nodes.find(
    (n) => n.type === "eventNode" && n.data.eventType === eventName
  );

  if (!startingNode) {
    console.warn(`[LogicEngine] イベント (${eventName}) に紐づくノードが見つかりません`);
    return;
  }

  console.log(`[LogicEngine] 🎬 イベント発生: ${startingNode.data.label}`);
  
  // ↓↓↓↓↓↓↓↓↓↓ (★ 修正) "source" ではなく null を渡す ↓↓↓↓↓↓↓↓↓↓
  // イベントノードの次から実行キューを開始
  const nextNodeId = findNextNode(startingNode.id, null, edges);
  // ↑↑↑↑↑↑↑↑↑↑ (★ 修正) ↑↑↑↑↑↑↑↑↑↑
  if (nextNodeId) {
    processQueue([nextNodeId], nodes, edges, getPreviewState, setPreviewState);
  }
};