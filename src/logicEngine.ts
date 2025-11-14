// src/logicEngine.ts

import type { Node, Edge } from "reactflow";
import type { PreviewState, NodeGraph, VariableState, PreviewItemState } from "./types";

// ★ リスナー管理用の型定義
export type ResumeListener = () => void;
export type ActiveListeners = Map<string, ResumeListener[]>;

/**
 * ロジック実行エンジン
 */
const processQueue = (
  executionQueue: string[],
  allNodes: Node[],
  allEdges: Edge[],
  getPreviewState: () => PreviewState,
  setPreviewState: (newState: PreviewState) => void,
  requestPageChange: (pageId: string) => void,
  getVariables: () => VariableState,
  setVariables: (newVars: VariableState) => void,
  activeListeners: ActiveListeners // ★ 追加: リスナー管理マップ
) => {
  const nextQueue: string[] = [];

  for (const nodeId of executionQueue) {
    const node = allNodes.find((n) => n.id === nodeId);
    if (!node) continue;

    console.log(`[LogicEngine] ⚡ 実行中: ${node.type} / ${node.id}`);

    // (1) アクションノード
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

          setPreviewState({
            ...currentState,
            [targetItemId]: { ...targetItemState, isVisible: newVisibility },
          });
        }
      }
      pushNext(node.id, null, allEdges, nextQueue);
    }

    // (2) If ノード
    else if (node.type === "ifNode") {
      const { 
        conditionSource = 'item', conditionTargetId, conditionType,
        variableName, comparison, comparisonValue
      } = node.data;

      let conditionResult = false;
      if (conditionSource === 'item') {
        const currentState = getPreviewState();
        const targetItemState = currentState[conditionTargetId];
        if (targetItemState) {
          if (conditionType === "isVisible") conditionResult = targetItemState.isVisible === true;
          else if (conditionType === "isHidden") conditionResult = targetItemState.isVisible === false;
        }
      } else if (conditionSource === 'variable') {
        const currentVars = getVariables();
        const varValue = currentVars[variableName];
        // (簡易比較ロジック)
        // eslint-disable-next-line eqeqeq
        if (comparison === '==') conditionResult = varValue == comparisonValue;
        // ... (他の比較は省略せず実装しても良いが、長くなるため既存機能維持)
        else if (comparison === '!=') conditionResult = varValue != comparisonValue;
        else if (comparison === '>') conditionResult = Number(varValue) > Number(comparisonValue);
        else if (comparison === '>=') conditionResult = Number(varValue) >= Number(comparisonValue);
        else if (comparison === '<') conditionResult = Number(varValue) < Number(comparisonValue);
        else if (comparison === '<=') conditionResult = Number(varValue) <= Number(comparisonValue);
        else if (comparison === 'contains') conditionResult = String(varValue).includes(String(comparisonValue));
        else if (comparison === 'not_contains') conditionResult = !String(varValue).includes(String(comparisonValue));
      }
      pushNext(node.id, conditionResult ? "true" : "false", allEdges, nextQueue);
    }
    
    // (3) ページ遷移ノード
    else if (node.type === "pageNode") {
      const { targetPageId } = node.data;
      if (targetPageId) requestPageChange(targetPageId);
    }
    
    // (4) 変数セットノード
    else if (node.type === "setVariableNode") {
      const { variableName, operation = 'set', value } = node.data;
      if (variableName) {
        const currentVars = getVariables();
        let newValue = value;
        if (operation === 'add') newValue = Number(currentVars[variableName] || 0) + Number(value || 0);
        setVariables({ ...currentVars, [variableName]: newValue });
      }
      pushNext(node.id, null, allEdges, nextQueue);
    }
    
    // (5) アニメーションノード
    else if (node.type === "animateNode") {
      const { targetItemId, animType, value, durationS = 0.5, delayS = 0, easing = 'ease' } = node.data;
      if (targetItemId) {
        const currentState = getPreviewState();
        const targetItemState = currentState[targetItemId];
        if (targetItemState) {
          const newItemState: PreviewItemState = { ...targetItemState };
          let cssProperty = '';
          if (animType === 'opacity') { cssProperty = 'opacity'; newItemState.opacity = Number(value); }
          else if (animType === 'moveX') { cssProperty = 'transform'; newItemState.x = Number(value); }
          else if (animType === 'moveY') { cssProperty = 'transform'; newItemState.y = Number(value); }
          else if (animType === 'scale') { cssProperty = 'transform'; newItemState.scale = Number(value); }
          else if (animType === 'rotate') { cssProperty = 'transform'; newItemState.rotation = Number(value); }
          
          if (cssProperty) {
            newItemState.transition = `${cssProperty} ${durationS}s ${easing} ${delayS}s`;
            setPreviewState({ ...currentState, [targetItemId]: newItemState });
          }
        }
      }
      pushNext(node.id, null, allEdges, nextQueue);
    }
    
    // (6) 遅延ノード
    else if (node.type === "delayNode") {
      const { durationS = 1.0 } = node.data;
      setTimeout(() => {
        const nextNode = findNextNode(node.id, null, allEdges);
        if (nextNode) {
          processQueue([nextNode], allNodes, allEdges, getPreviewState, setPreviewState, requestPageChange, getVariables, setVariables, activeListeners);
        }
      }, Number(durationS) * 1000);
      // ここでキュー処理を終了（非同期で再開）
    }

    // (7) イベントノード (通過点として機能する場合)
    else if (node.type === "eventNode") {
      pushNext(node.id, null, allEdges, nextQueue);
    }

    // ★ (8) 新機能: クリック待ちノード (WaitForClickNode)
    else if (node.type === "waitForClickNode") {
      const { targetItemId } = node.data;
      
      if (targetItemId) {
        console.log(`[LogicEngine] 🛑 クリック待機中... ターゲット: ${targetItemId}`);
        
        // 次のノードを探しておく
        const nextNodeId = findNextNode(node.id, null, allEdges);
        
        if (nextNodeId) {
          // 再開用関数 (Closure)
          const resumeFlow = () => {
            console.log(`[LogicEngine] ▶️ 待機解除: フロー再開`);
            processQueue(
              [nextNodeId], 
              allNodes, allEdges, getPreviewState, setPreviewState, requestPageChange, getVariables, setVariables, activeListeners
            );
          };

          // リスナーマップに登録
          const listeners = activeListeners.get(targetItemId) || [];
          listeners.push(resumeFlow);
          activeListeners.set(targetItemId, listeners);
        }
      } else {
        // ターゲット未設定ならスルーして次へ
        pushNext(node.id, null, allEdges, nextQueue);
      }
      // ここでキュー処理を中断（クリックされるまで進まない）
    }
  }

  // 次の同期キューがあれば処理
  if (nextQueue.length > 0) {
    processQueue(nextQueue, allNodes, allEdges, getPreviewState, setPreviewState, requestPageChange, getVariables, setVariables, activeListeners);
  }
};

// ヘルパー: 次のノードを探してキューに追加
const pushNext = (srcId: string, handle: string | null, edges: Edge[], queue: string[]) => {
  const next = findNextNode(srcId, handle, edges);
  if (next) queue.push(next);
};

const findNextNode = (srcId: string, handle: string | null, edges: Edge[]): string | undefined => {
  const edge = edges.find((e) => e.source === srcId && e.sourceHandle === handle);
  return edge?.target;
};

/**
 * イベントトリガー (App.tsx から呼ばれる)
 */
export const triggerEvent = (
  eventName: string,
  targetItemId: string,
  currentPageGraph: NodeGraph,
  getPreviewState: () => PreviewState,
  setPreviewState: (newState: PreviewState) => void,
  requestPageChange: (pageId: string) => void,
  getVariables: () => VariableState,
  setVariables: (newVars: VariableState) => void,
  activeListeners: ActiveListeners // ★ 追加
) => {
  const { nodes, edges } = currentPageGraph;

  // 1. まず「待機中」のフローがあるかチェックして再開させる
  if (eventName === "click" && activeListeners.has(targetItemId)) {
    const listeners = activeListeners.get(targetItemId);
    if (listeners) {
      // 登録されている全ての再開関数を実行
      listeners.forEach(resume => resume());
      // 実行したらリストから削除（One-shot動作）
      activeListeners.delete(targetItemId);
      // ★ 待機解除だけで終了せず、通常のクリックイベントも発火させたい場合は下へ続く
      // ここでは「待機解除」を優先し、通常の開始イベントとは独立させる想定
      return; 
    }
  }

  // 2. 通常のイベント開始ノードを探す (On Click Nodeなど)
  const startingNodes = nodes.filter(
    (n) => n.type === "eventNode" && n.data.eventType === eventName
    // (将来的に「特定のアイテムのクリック」をStartにする場合、ここで data.targetId もチェック可能)
  );

  if (startingNodes.length > 0) {
    const nextQueue = startingNodes.map(n => {
        // イベントノード自体に処理はないので、その次から開始
        return findNextNode(n.id, null, edges);
    }).filter((id): id is string => !!id);

    if (nextQueue.length > 0) {
        processQueue(nextQueue, nodes, edges, getPreviewState, setPreviewState, requestPageChange, getVariables, setVariables, activeListeners);
    }
  }
};