// src/logicEngine.ts

import type { Node, Edge } from "reactflow";
import type { 
  PreviewState, 
  NodeGraph, 
  VariableState, 
  PreviewItemState,
  PlacedItemType 
} from "./types";
import { logAnalyticsEvent } from "./lib/analytics"; // ★ 追加: 分析モジュールのインポート

// リスナー管理用の型定義
export type ResumeListener = () => void;
export type ActiveListeners = Map<string, ResumeListener[]>;

/**
 * ロジック実行エンジン (内部処理用)
 */
const processQueue = (
  executionQueue: string[],
  allNodes: Node[],
  allEdges: Edge[],
  placedItems: PlacedItemType[], // 初期状態の参照用
  getPreviewState: () => PreviewState,
  setPreviewState: (newState: PreviewState) => void,
  requestPageChange: (pageId: string) => void,
  getVariables: () => VariableState,
  setVariables: (newVars: VariableState) => void,
  activeListeners: ActiveListeners
) => {
  const nextQueue: string[] = [];

  for (const nodeId of executionQueue) {
    const node = allNodes.find((n) => n.id === nodeId);
    if (!node) continue;

    // ★ 追加: ノード実行ログを送信 (ステップ別離脱率・通過数の計測用)
    logAnalyticsEvent('node_execution', {
      nodeId: node.id,
      nodeType: node.type,
      metadata: { label: node.data.label }
    });

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
        conditionSource = 'item', 
        conditionTargetId, 
        conditionType,
        variableName,
        comparisonType = 'string',
        comparison = '==',
        comparisonValue 
      } = node.data;

      let conditionResult = false;

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
        
        if (comparisonType === 'number') {
          const numVarValue = Number(varValue || 0);
          const numCompValue = Number(comparisonValue || 0);

          switch (comparison) {
            case '==': conditionResult = numVarValue === numCompValue; break;
            case '!=': conditionResult = numVarValue !== numCompValue; break;
            case '>': conditionResult = numVarValue > numCompValue; break;
            case '>=': conditionResult = numVarValue >= numCompValue; break;
            case '<': conditionResult = numVarValue < numCompValue; break;
            case '<=': conditionResult = numVarValue <= numCompValue; break;
          }
        } else {
          const strVarValue = String(varValue ?? "");
          const strCompValue = String(comparisonValue ?? "");

          switch (comparison) {
            case '==': conditionResult = strVarValue === strCompValue; break;
            case '!=': conditionResult = strVarValue !== strCompValue; break;
            case 'contains': conditionResult = strVarValue.includes(strCompValue); break;
            case 'not_contains': conditionResult = !strVarValue.includes(strCompValue); break;
          }
        }
      }

      // ★ 追加: ロジック分岐の結果をログ送信 (Aルート/Bルートの割合計測用)
      logAnalyticsEvent('logic_branch', {
        nodeId: node.id,
        nodeType: node.type,
        metadata: { 
          result: conditionResult ? 'true' : 'false',
          conditionSource,
          variableName 
        }
      });

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
      const { 
        targetItemId, 
        animType, 
        value,
        durationS = 0.5, 
        delayS = 0, 
        easing = 'ease',
        animationMode = 'absolute',
        loopMode = 'none',
        loopCount = 2,
        relativeOperation = 'multiply'
      } = node.data;

      if (targetItemId) {
        const currentState = getPreviewState();
        const targetItemState = currentState[targetItemId];
        const initialItem = placedItems.find(p => p.id === targetItemId);

        if (targetItemState && initialItem) {
          
          let cssProperty = '';
          const durationMs = (Number(durationS) + Number(delayS)) * 1000;
          let toState: Partial<PreviewItemState>;

          const playAnimation = (remaining: number) => {
            let fromState: PreviewItemState;
            
            if (animationMode === 'relative') {
              fromState = { ...getPreviewState()[targetItemId], transition: 'none' };
              toState = { ...fromState };
              const numValue = Number(value || 0);
              
              if (animType === 'opacity') { 
                cssProperty = 'opacity';
                if (relativeOperation === 'subtract') {
                  toState.opacity = fromState.opacity - numValue;
                } else {
                  toState.opacity = fromState.opacity * numValue; 
                }
              }
              else if (animType === 'moveX') { cssProperty = 'transform'; toState.x = fromState.x + numValue; }
              else if (animType === 'moveY') { cssProperty = 'transform'; toState.y = fromState.y + numValue; }
              else if (animType === 'scale') { cssProperty = 'transform'; toState.scale = fromState.scale * numValue; }
              else if (animType === 'rotate') { cssProperty = 'transform'; toState.rotation = fromState.rotation + numValue; }
              
            } else {
              fromState = {
                ...getPreviewState()[targetItemId],
                x: initialItem.x, y: initialItem.y, opacity: 1, scale: 1, rotation: 0,
                transition: 'none',
              };
              toState = { ...fromState };
              
              if (animType === 'opacity') { cssProperty = 'opacity'; toState.opacity = Number(value); }
              else if (animType === 'moveX') { cssProperty = 'transform'; toState.x = Number(value); }
              else if (animType === 'moveY') { cssProperty = 'transform'; toState.y = Number(value); }
              else if (animType === 'scale') { cssProperty = 'transform'; toState.scale = Number(value); }
              else if (animType === 'rotate') { cssProperty = 'transform'; toState.rotation = Number(value); }
            }
            
            if (!cssProperty) {
              pushNext(node.id, null, allEdges, nextQueue);
              return;
            }

            if (animationMode === 'absolute') {
              const current = getPreviewState()[targetItemId];
              if (
                (animType === 'opacity' && current.opacity === toState.opacity) ||
                (animType === 'moveX' && current.x === toState.x) ||
                (animType === 'moveY' && current.y === toState.y) ||
                (animType === 'scale' && current.scale === toState.scale) ||
                (animType === 'rotate' && current.rotation === toState.rotation)
              ) {
                pushNext(node.id, null, allEdges, nextQueue);
                return;
              }
            }
            
            setPreviewState({
              ...getPreviewState(),
              [targetItemId]: fromState,
            });

            setTimeout(() => {
              setPreviewState({
                ...getPreviewState(),
                [targetItemId]: { 
                  ...getPreviewState()[targetItemId], 
                  ...toState,
                  transition: `${cssProperty} ${durationS}s ${easing} ${delayS}s`
                },
              });
            }, 10);

            setTimeout(() => {
              if (loopMode === 'count' && remaining > 1) {
                const nextRemaining = remaining - 1;
                playAnimation(nextRemaining);
              } else {
                const nextNode = findNextNode(node.id, null, allEdges);
                if (nextNode) {
                  processQueue([nextNode], allNodes, allEdges, placedItems, getPreviewState, setPreviewState, requestPageChange, getVariables, setVariables, activeListeners);
                }
              }
            }, durationMs + 20);
          };

          const initialPlays = (loopMode === 'count') ? Number(loopCount) : 1;
          playAnimation(initialPlays);
          
        } else {
          pushNext(node.id, null, allEdges, nextQueue);
        }
      } else {
        pushNext(node.id, null, allEdges, nextQueue);
      }
    }
    
    // (6) 遅延ノード
    else if (node.type === "delayNode") {
      const { durationS = 1.0 } = node.data;
      setTimeout(() => {
        const nextNode = findNextNode(node.id, null, allEdges);
        if (nextNode) {
          processQueue([nextNode], allNodes, allEdges, placedItems, getPreviewState, setPreviewState, requestPageChange, getVariables, setVariables, activeListeners);
        }
      }, Number(durationS) * 1000);
    }

    // (7) イベントノード
    else if (node.type === "eventNode") {
      pushNext(node.id, null, allEdges, nextQueue);
    }

    // (8) クリック待ちノード
    else if (node.type === "waitForClickNode") {
      const { targetItemId } = node.data;
      
      if (targetItemId) {
        const nextNodeId = findNextNode(node.id, null, allEdges);
        
        if (nextNodeId) {
          const resumeFlow = () => {
            processQueue(
              [nextNodeId], 
              allNodes, allEdges, placedItems, getPreviewState, setPreviewState, requestPageChange, getVariables, setVariables, activeListeners
            );
          };

          const listeners = activeListeners.get(targetItemId) || [];
          listeners.push(resumeFlow);
          activeListeners.set(targetItemId, listeners);
        }
      } else {
        pushNext(node.id, null, allEdges, nextQueue);
      }
    }
  }

  if (nextQueue.length > 0) {
    processQueue(nextQueue, allNodes, allEdges, placedItems, getPreviewState, setPreviewState, requestPageChange, getVariables, setVariables, activeListeners);
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
  placedItems: PlacedItemType[],
  getPreviewState: () => PreviewState,
  setPreviewState: (newState: PreviewState) => void,
  requestPageChange: (pageId: string) => void,
  getVariables: () => VariableState,
  setVariables: (newVars: VariableState) => void,
  activeListeners: ActiveListeners
) => {
  const { nodes, edges } = currentPageGraph;

  // 1. 「待機中」のフローを再開させる
  if (eventName === "click" && activeListeners.has(targetItemId)) {
    const listeners = activeListeners.get(targetItemId);
    if (listeners) {
      listeners.forEach(resume => resume());
      activeListeners.delete(targetItemId);
      return; 
    }
  }

  // 2. 通常のイベント開始ノードを探す
  const startingNodes = nodes.filter(
    (n) => n.type === "eventNode" && n.data.eventType === eventName
  );

  if (startingNodes.length > 0) {
    const nextQueue = startingNodes.map(n => {
        return findNextNode(n.id, null, edges);
    }).filter((id): id is string => !!id);

    if (nextQueue.length > 0) {
        processQueue(nextQueue, nodes, edges, placedItems, getPreviewState, setPreviewState, requestPageChange, getVariables, setVariables, activeListeners);
    }
  }
};

// ★ 追加: PreviewItem.tsx から呼ばれる executeLogicGraph を実装
export const executeLogicGraph = (
  startNodeId: string,
  graph: NodeGraph,
  previewState: PreviewState,
  setPreviewState: (newState: PreviewState | ((prev: PreviewState) => PreviewState)) => void
) => {
  // 引数を使用することで TS6133 エラーを回避
  console.warn(
    "executeLogicGraph is deprecated.", 
    startNodeId, 
    graph, 
    previewState, 
    setPreviewState
  );
  console.warn("Use usePreviewStore.handleItemEvent instead.");
};