// src/utils/logicEngine.ts

import type { Node, Edge } from "reactflow";
import type { NodeGraph } from "../App";
import type { PreviewState } from "../types";

/**
 * 接続された次のノードID（複数可）を取得する
 * @param currentNodeId - 現在のノードID
 * @param graph - ノードグラフ全体
 * @param sourceHandleId - (オプション) 分岐ノード（IfNodeなど）用の出力ハンドルID
 * @returns 次に実行すべきノードIDの配列
 */
const getNextNodeIds = (
  currentNodeId: string,
  graph: NodeGraph,
  sourceHandleId?: string
): string[] => {
  return graph.edges
    .filter((edge) => {
      // 始点が現在のノードIDと一致するか
      if (edge.source !== currentNodeId) {
        return false;
      }
      // 分岐（true/false）が指定されている場合、ハンドルのIDも一致するか
      if (sourceHandleId && edge.sourceHandle !== sourceHandleId) {
        return false;
      }
      return true;
    })
    .map((edge) => edge.target); // 終点のノードIDを返す
};

/**
 * ノードグラフを実行するメイン関数
 * @param startNodeId - 実行を開始するノード（通常はEventNode）のID
 * @param graph - 実行対象のノードグラフ
 * @param currentState - 現在のプレビュー状態
 * @param setState - プレビュー状態を更新するためのReactのsetState関数
 */
export const executeLogicGraph = (
  startNodeId: string,
  graph: NodeGraph,
  currentState: PreviewState,
  setState: React.Dispatch<React.SetStateAction<PreviewState>>
): void => {
  
  // 実行するノードを管理するキュー（FIFO）
  const executionQueue: { nodeId: string; sourceHandleId?: string }[] = [
    { nodeId: startNodeId },
  ];
  
  // 安全装置（無限ループ防止）
  let executionLimit = 100;

  // 状態の更新を一時的に溜めるバッチ
  let stateUpdates: PreviewState = {};

  // キューが空になるまで、または制限に達するまで実行
  while (executionQueue.length > 0 && executionLimit > 0) {
    executionLimit--;
    const task = executionQueue.shift();
    if (!task) continue;

    const { nodeId, sourceHandleId } = task;

    // (1) 次に実行すべきノードID群を取得
    const nextNodeIds = getNextNodeIds(nodeId, graph, sourceHandleId);

    // (2) 次のノード群をキューに追加
    for (const nextId of nextNodeIds) {
      const nextNode = graph.nodes.find((n) => n.id === nextId);
      if (!nextNode) continue;

      // (3) ノードタイプに応じて処理を実行
      switch (nextNode.type) {
        
        // --- アクションノードの処理 ---
        case "actionNode": {
          const { targetItemId, mode } = nextNode.data;
          if (targetItemId && currentState[targetItemId]) {
            const currentVisibility = currentState[targetItemId].isVisible;
            let newVisibility: boolean;

            if (mode === "show") {
              newVisibility = true;
            } else if (mode === "hide") {
              newVisibility = false;
            } else { // toggle
              newVisibility = !currentVisibility;
            }
            
            // 更新をバッチに追加
            stateUpdates[targetItemId] = { 
              ...currentState[targetItemId],
              ...stateUpdates[targetItemId], // 既にバッチにあれば上書き
              isVisible: newVisibility 
            };
          }
          // このアクションノードからさらに先に接続されているノードをキューに追加
          executionQueue.push({ nodeId: nextNode.id });
          break;
        }

        // --- IFノードの処理 ---
        case "ifNode": {
          const { conditionTargetId, conditionType } = nextNode.data;
          let conditionResult = false; // デフォルトは False

          if (conditionTargetId && currentState[conditionTargetId]) {
            const targetState = { ...currentState[conditionTargetId], ...stateUpdates[conditionTargetId] };
            
            if (conditionType === "isVisible") {
              conditionResult = targetState.isVisible === true;
            } else if (conditionType === "isHidden") {
              conditionResult = targetState.isVisible === false;
            }
          }
          
          // 条件分岐の結果（"true" または "false"）を次のタスクのハンドルIDとして指定
          executionQueue.push({ 
            nodeId: nextNode.id, 
            sourceHandleId: conditionResult ? "true" : "false" 
          });
          break;
        }

        // --- イベントノードやその他のノード ---
        // (EventNodeは起点なので、実行フローの途中では何もしない)
        // (他のノードタイプは将来的にここに追加)
        default:
          break;
      }
    }
  }

  // (4) バッチ処理した状態の更新を一度に適用する
  if (Object.keys(stateUpdates).length > 0) {
    setState((prevState) => ({
      ...prevState,
      ...stateUpdates,
    }));
  }

  if (executionLimit === 0) {
    console.warn("Logic execution limit reached. Check for infinite loops in nodes.");
  }
};
