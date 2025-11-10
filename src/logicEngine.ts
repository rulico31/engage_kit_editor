// src/logicEngine.ts

import type { Node, Edge } from "reactflow";
import type { PreviewState, NodeGraph, VariableState, PreviewItemState } from "./types";

/**
 * 渡されたノードID配列（次に実行すべきノード）を処理する
 * @param executionQueue - 実行待機中のノードIDの配列
 * @param allNodes - グラフ内の全ノード
 * @param allEdges - グラフ内の全エッジ
 * @param getPreviewState - 現在のプレビュー状態を取得する関数
 * @param setPreviewState - プレビュー状態を更新する関数
 * @param requestPageChange - ページ遷移をリクエストする関数
 * @param getVariables - 現在の変数を取得する関数
 * @param setVariables - 変数を更新する関数
 */
const processQueue = (
  executionQueue: string[],
  allNodes: Node[],
  allEdges: Edge[],
  getPreviewState: () => PreviewState,
  setPreviewState: (newState: PreviewState) => void,
  requestPageChange: (pageId: string) => void,
  getVariables: () => VariableState,
  setVariables: (newVars: VariableState) => void
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

          // (★ 変更) 状態を更新
          setPreviewState({
            ...currentState,
            [targetItemId]: { ...targetItemState, isVisible: newVisibility },
          });
        }
      }
      const nextNode = findNextNode(node.id, null, allEdges);
      if (nextNode) nextQueue.push(nextNode);
    }

    // (2) If ノード (条件分岐)
    else if (node.type === "ifNode") {
      const { 
        conditionSource = 'item', 
        conditionTargetId, 
        conditionType,
        variableName,
        comparison,
        comparisonValue
      } = node.data;

      let conditionResult = false; // デフォルトは False

      if (conditionSource === 'item') {
        const currentState = getPreviewState();
        const targetItemState = currentState[conditionTargetId];
        if (targetItemState) {
          if (conditionType === "isVisible") {
            conditionResult = targetItemState.isVisible === true;
          } else if (conditionType === "isHidden") {
            conditionResult = targetItemState.isVisible === false;
          }
        }
      } else if (conditionSource === 'variable') {
        const currentVars = getVariables();
        const varValue = currentVars[variableName];
        
        switch (comparison) {
          case '==':
            // eslint-disable-next-line eqeqeq
            conditionResult = varValue == comparisonValue;
            break;
          case '!=':
            // eslint-disable-next-line eqeqeq
            conditionResult = varValue != comparisonValue;
            break;
          case '>':
            conditionResult = Number(varValue) > Number(comparisonValue);
            break;
          case '>=':
            conditionResult = Number(varValue) >= Number(comparisonValue);
            break;
          case '<':
            conditionResult = Number(varValue) < Number(comparisonValue);
            break;
          case '<=':
            conditionResult = Number(varValue) <= Number(comparisonValue);
            break;
          case 'contains':
            conditionResult = String(varValue).includes(String(comparisonValue));
            break;
          case 'not_contains':
            conditionResult = !String(varValue).includes(String(comparisonValue));
            break;
        }
      }

      console.log(`[LogicEngine] 🧠 条件 (${conditionSource}): ${conditionResult}`);

      const nextNode = findNextNode(
        node.id,
        conditionResult ? "true" : "false",
        allEdges
      );
      if (nextNode) nextQueue.push(nextNode);
    }
    
    // (3) ページ遷移ノード
    else if (node.type === "pageNode") {
      const { targetPageId } = node.data;
      if (targetPageId) {
        console.log(`[LogicEngine] 🚀 ページ遷移: ${targetPageId} へ`);
        requestPageChange(targetPageId);
      }
    }
    
    // (4) 変数セットノード
    else if (node.type === "setVariableNode") {
      const { variableName, operation = 'set', value } = node.data;
      
      if (variableName) {
        const currentVars = getVariables();
        let newValue = value;
        
        if (operation === 'add') {
          const currentValueNum = Number(currentVars[variableName] || 0);
          const valueToAddNum = Number(value || 0);
          newValue = currentValueNum + valueToAddNum;
        }
        
        console.log(`[LogicEngine] 💾 変数セット: ${variableName} = ${newValue}`);
        setVariables({
          ...currentVars,
          [variableName]: newValue
        });
      }

      const nextNode = findNextNode(node.id, null, allEdges);
      if (nextNode) nextQueue.push(nextNode);
    }
    
    // ↓↓↓↓↓↓↓↓↓↓ (★ 追加) AnimateNodeの処理 ↓↓↓↓↓↓↓↓↓↓
    // (5) アニメーションノード
    else if (node.type === "animateNode") {
      const { 
        targetItemId, 
        animType, 
        value, 
        durationS = 0.5, 
        delayS = 0, 
        easing = 'ease' 
      } = node.data;

      if (targetItemId) {
        const currentState = getPreviewState();
        const targetItemState = currentState[targetItemId];

        if (targetItemState) {
          const newItemState: PreviewItemState = { ...targetItemState };
          let cssProperty = ''; // transition に適用するCSSプロパティ名

          // どのプロパティを変更するか
          if (animType === 'opacity') {
            cssProperty = 'opacity';
            newItemState.opacity = Number(value);
          } else if (animType === 'moveX') {
            cssProperty = 'transform';
            newItemState.x = Number(value);
          } else if (animType === 'moveY') {
            cssProperty = 'transform';
            newItemState.y = Number(value);
          } else if (animType === 'scale') {
            cssProperty = 'transform';
            newItemState.scale = Number(value);
          } else if (animType === 'rotate') {
            cssProperty = 'transform';
            newItemState.rotation = Number(value);
          }
          
          // transform系は transition: 'transform ...'
          // opacity系は transition: 'opacity ...'
          if (cssProperty) {
            newItemState.transition = `${cssProperty} ${durationS}s ${easing} ${delayS}s`;
            
            console.log(`[LogicEngine] 🎨 アニメーション実行: ${targetItemId} -> ${cssProperty} = ${value}`);
            
            setPreviewState({
              ...currentState,
              [targetItemId]: newItemState,
            });
          }
        }
      }
      
      const nextNode = findNextNode(node.id, null, allEdges);
      if (nextNode) nextQueue.push(nextNode);
    }
    // ↑↑↑↑↑↑↑↑↑↑ (★ 追加) ↑↑↑↑↑↑↑↑↑↑

    // (6) イベントノード
    else if (node.type === "eventNode") {
      const nextNode = findNextNode(node.id, null, allEdges);
      if (nextNode) nextQueue.push(nextNode);
    }
  }

  // 次のキューが溜まったら、再帰的に処理（非同期の代わり）
  if (nextQueue.length > 0) {
    processQueue(
      nextQueue, 
      allNodes, 
      allEdges, 
      getPreviewState, 
      setPreviewState, 
      requestPageChange,
      getVariables,
      setVariables
    );
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
 */
export const triggerEvent = (
  eventName: string, // "click"
  targetItemId: string, // "item-123"
  currentPageGraph: NodeGraph,
  getPreviewState: () => PreviewState,
  setPreviewState: (newState: PreviewState) => void,
  requestPageChange: (pageId: string) => void,
  getVariables: () => VariableState,
  setVariables: (newVars: VariableState) => void
) => {
  const { nodes, edges } = currentPageGraph;

  const startingNode = nodes.find(
    (n) => n.type === "eventNode" && n.data.eventType === eventName
  );

  if (!startingNode) {
    console.warn(`[LogicEngine] イベント (${eventName}) に紐づくノードが見つかりません`);
    return;
  }

  console.log(`[LogicEngine] 🎬 イベント発生: ${startingNode.data.label}`);
  
  const nextNodeId = findNextNode(startingNode.id, null, edges);
  if (nextNodeId) {
    processQueue(
      [nextNodeId], 
      nodes, 
      edges, 
      getPreviewState, 
      setPreviewState, 
      requestPageChange,
      getVariables,
      setVariables
    );
  }
};