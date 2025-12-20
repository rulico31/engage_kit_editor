// src/logicEngine.ts

import type { Node, Edge } from "reactflow";
import type {
  PreviewState,
  NodeGraph,
  VariableState,
  PlacedItemType
} from "./types";
import type { AnalyticsEventType } from "./lib/analytics";

// 実行コンテキスト（外部依存の注入用）
export interface LogicRuntimeContext {
  logEvent: (eventType: AnalyticsEventType, payload?: any) => void;
  submitLead: (variables: Record<string, any>) => Promise<boolean>;
  fetchApi: (url: string, options: RequestInit) => Promise<any>;
}

// リスナー管理用の型定義
export type ResumeListener = () => void;
export type ActiveListeners = Map<string, ResumeListener[]>;

/**
 * ヘルパー: 次のノード群を探してIDの配列を返す (1対多対応)
 * ★修正: ハンドルIDが null/undefined の場合の互換性を考慮
 */
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
 * ロジック実行エンジン (内部処理用)
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
  context: LogicRuntimeContext
) => {
  const nextQueue: string[] = [];

  for (const nodeId of executionQueue) {
    const node = allNodes.find((n) => n.id === nodeId);
    if (!node) continue;

    context.logEvent('node_execution', {
      nodeId: node.id,
      nodeType: node.type,
      metadata: { label: node.data.label }
    });

    // (1) アクションノード (表示・非表示)
    if (node.type === "actionNode") {
      const { targetItemId, mode } = node.data;

      console.log('🎬 アクションノード実行', {
        nodeId: node.id,
        targetItemId,
        mode,
        currentPreviewState: getPreviewState()
      });

      if (targetItemId) {
        const currentState = getPreviewState();
        const targetItemState = currentState[targetItemId];

        console.log('🎯 ターゲットアイテム状態', {
          targetItemId,
          targetItemState,
          exists: !!targetItemState
        });

        // アイテムが存在する場合のみ更新
        if (targetItemState) {
          let newVisibility = targetItemState.isVisible;
          if (mode === "show") newVisibility = true;
          else if (mode === "hide") newVisibility = false;
          else if (mode === "toggle") newVisibility = !targetItemState.isVisible;

          console.log('✨ 表示状態を更新', {
            targetItemId,
            oldVisibility: targetItemState.isVisible,
            newVisibility,
            mode
          });

          setPreviewState({
            ...currentState,
            [targetItemId]: { ...targetItemState, isVisible: newVisibility },
          });
        } else {
          console.warn('⚠️ ターゲットアイテムが見つかりません', {
            targetItemId,
            availableItems: Object.keys(currentState).filter(k => k !== 'currentPageId' && k !== 'isFinished')
          });
        }
      } else {
        console.warn('⚠️ targetItemIdが設定されていません', { nodeId: node.id, nodeData: node.data });
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

      console.log('🔀 Ifノード実行', {
        nodeId: node.id,
        conditionSource,
        conditionTargetId,
        conditionType,
        variableName,
        comparisonType,
        comparison,
        comparisonValue
      });

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

      console.log('✅ If条件結果', {
        nodeId: node.id,
        conditionResult,
        nextPath: conditionResult ? 'true' : 'false'
      });

      context.logEvent('logic_branch', {
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
      console.log('📄 ページ遷移ノード実行', {
        nodeId: node.id,
        targetPageId
      });
      if (targetPageId) {
        requestPageChange(targetPageId);
        console.log('✅ ページ遷移実行', { targetPageId });
      } else {
        console.warn('⚠️ targetPageIdが設定されていません');
      }
    }

    // (4) 変数セットノード
    else if (node.type === "setVariableNode") {
      const { variableName, operation = 'set', value } = node.data;
      console.log('📊 変数セットノード実行', {
        nodeId: node.id,
        variableName,
        operation,
        value
      });
      if (variableName) {
        const currentVars = getVariables();
        let newValue = value;
        if (operation === 'add') newValue = Number(currentVars[variableName] || 0) + Number(value || 0);
        setVariables({ ...currentVars, [variableName]: newValue });
        console.log('✅ 変数更新完了', {
          variableName,
          oldValue: currentVars[variableName],
          newValue
        });
      } else {
        console.warn('⚠️ variableNameが設定されていません');
      }
      pushNext(node.id, null, allEdges, nextQueue);
    }

    // (5) アニメーションノード
    else if (node.type === "animateNode") {
      console.log('🎬 アニメーションノード実行', {
        nodeId: node.id,
        nodeData: node.data,
        targetItemId: node.data.targetItemId
      });

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
        const initialItem = placedItems.find(p => p.id === targetItemId);

        // PreviewState にアイテムが存在する場合のみ実行
        if (currentState[targetItemId] && initialItem) {

          let cssProperty = '';
          const durationMs = (Number(durationS) + Number(delayS)) * 1000;
          let toState: Partial<any>;

          const playAnimation = (remaining: number) => {
            let fromState: any;
            const currentItemState = getPreviewState()[targetItemId];

            if (animationMode === 'relative') {
              fromState = { ...currentItemState, transition: 'none' };
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
              else if (animType === 'moveX') {
                cssProperty = 'left';
                toState.x = fromState.x + numValue;
              }
              else if (animType === 'moveY') {
                cssProperty = 'top';
                toState.y = fromState.y + numValue;
              }
              else if (animType === 'scale') {
                cssProperty = 'transform';
                toState.scale = fromState.scale * numValue;
              }
              else if (animType === 'rotate') {
                cssProperty = 'transform';
                toState.rotation = fromState.rotation + numValue;
              }

            } else {
              // 絶対値モード
              fromState = {
                ...currentItemState,
                transition: 'none',
              };
              toState = { ...fromState };

              if (animType === 'opacity') { cssProperty = 'opacity'; toState.opacity = Number(value); }
              else if (animType === 'moveX') { cssProperty = 'left'; toState.x = Number(value); }
              else if (animType === 'moveY') { cssProperty = 'top'; toState.y = Number(value); }
              else if (animType === 'scale') { cssProperty = 'transform'; toState.scale = Number(value); }
              else if (animType === 'rotate') { cssProperty = 'transform'; toState.rotation = Number(value); }
            }

            if (!cssProperty) {
              pushNext(node.id, null, allEdges, nextQueue);
              return;
            }

            // 1. まず transition: none で開始状態をセット (リセット)
            setPreviewState({
              ...getPreviewState(),
              [targetItemId]: fromState,
            });

            // 2. わずかに遅らせて transition を有効にし、目標値をセット
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

            // 3. アニメーション終了後の処理 (ループまたは次のノードへ)
            setTimeout(() => {
              if (loopMode === 'count' && remaining > 1) {
                const nextRemaining = remaining - 1;
                playAnimation(nextRemaining);
              } else {
                const nextNodeIds = findNextNodes(node.id, null, allEdges);
                if (nextNodeIds.length > 0) {
                  processQueue(nextNodeIds, allNodes, allEdges, placedItems, getPreviewState, setPreviewState, requestPageChange, getVariables, setVariables, activeListeners, context);
                }
              }
            }, durationMs + 20); // 少し余裕を持たせる
          };

          const initialPlays = (loopMode === 'count') ? Number(loopCount) : 1;
          playAnimation(initialPlays);

        } else {
          // ターゲットが見つからない場合はスキップ
          pushNext(node.id, null, allEdges, nextQueue);
        }
      } else {
        pushNext(node.id, null, allEdges, nextQueue);
      }
    }

    // (6) 遅延ノード
    else if (node.type === "delayNode") {
      const { durationS = 1.0 } = node.data;
      console.log('⏱️ 遅延ノード実行', {
        nodeId: node.id,
        durationS
      });
      setTimeout(() => {
        console.log('✅ 遅延完了', { nodeId: node.id, durationS });
        const nextNodeIds = findNextNodes(node.id, null, allEdges);
        if (nextNodeIds.length > 0) {
          processQueue(nextNodeIds, allNodes, allEdges, placedItems, getPreviewState, setPreviewState, requestPageChange, getVariables, setVariables, activeListeners, context);
        }
      }, Number(durationS) * 1000);
    }

    // (7) イベントノード
    else if (node.type === "eventNode") {
      console.log('🎯 イベントノード通過', {
        nodeId: node.id,
        eventType: node.data.eventType
      });
      pushNext(node.id, null, allEdges, nextQueue);
    }

    // (8) クリック待ちノード
    else if (node.type === "waitForClickNode") {
      const { targetItemId } = node.data;
      console.log('⏸️ クリック待ちノード実行', {
        nodeId: node.id,
        targetItemId
      });

      if (targetItemId) {
        const nextNodeIds = findNextNodes(node.id, null, allEdges);

        if (nextNodeIds.length > 0) {
          const resumeFlow = () => {
            processQueue(
              nextNodeIds,
              allNodes, allEdges, placedItems, getPreviewState, setPreviewState, requestPageChange, getVariables, setVariables, activeListeners, context
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

    // (10) A/Bテストノード
    else if (node.type === "abTestNode") {
      // ★ 修正: エディタ側の保存プロパティ名は ratioA です
      const { ratioA = 50 } = node.data;
      const probability = Number(ratioA); // ratioA を probability として扱う

      const randomValue = Math.random() * 100;
      const isPathA = randomValue < probability;
      const resultPath = isPathA ? "pathA" : "pathB";

      console.log('🎲 A/Bテストノード実行', {
        nodeId: node.id,
        probability,
        randomValue,
        resultPath
      });

      context.logEvent('logic_branch', {
        nodeId: node.id,
        nodeType: node.type,
        metadata: {
          result: resultPath,
          probability,
          randomValue
        }
      });

      pushNext(node.id, resultPath, allEdges, nextQueue);
    }

    // (9) データ送信ノード (Legacy)
    else if (node.type === "submitDataNode") {
      const currentVars = getVariables();
      context.submitLead(currentVars);
      pushNext(node.id, null, allEdges, nextQueue);
    }

    // (11) フォーム送信ノード
    else if (node.type === "submitFormNode") {
      const currentVars = getVariables();
      console.log('📤 フォーム送信ノード実行', {
        nodeId: node.id,
        variables: currentVars
      });

      try {
        const success = await context.submitLead(currentVars);
        const resultPath = success ? "success" : "error";

        context.logEvent('logic_branch', {
          nodeId: node.id,
          nodeType: node.type,
          metadata: { result: resultPath }
        });

        pushNext(node.id, resultPath, allEdges, nextQueue);
      } catch (e) {
        console.error("Form submission error:", e);
        pushNext(node.id, "error", allEdges, nextQueue);
      }
    }

    // (12) 外部APIノード
    else if (node.type === "externalApiNode") {
      const { url, method = "GET", variableName } = node.data;
      console.log('🌐 外部APIノード実行', {
        nodeId: node.id,
        url,
        method,
        variableName
      });

      if (!url) {
        pushNext(node.id, "error", allEdges, nextQueue);
        continue;
      }

      try {
        const responseData = await context.fetchApi(url, { method });

        if (variableName) {
          const currentVars = getVariables();
          setVariables({ ...currentVars, [variableName]: responseData });
        }

        context.logEvent('node_execution', {
          nodeId: node.id,
          nodeType: node.type,
          metadata: { status: 'success', url }
        });

        pushNext(node.id, "success", allEdges, nextQueue);
      } catch (e) {
        console.error("API fetch error:", e);
        context.logEvent('node_execution', {
          nodeId: node.id,
          nodeType: node.type,
          metadata: { status: 'error', url, error: String(e) }
        });
        pushNext(node.id, "error", allEdges, nextQueue);
      }
    }
  }

  if (nextQueue.length > 0) {
    await processQueue(nextQueue, allNodes, allEdges, placedItems, getPreviewState, setPreviewState, requestPageChange, getVariables, setVariables, activeListeners, context);
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

  console.log('🔔 イベント発火', {
    eventName,
    targetItemId,
    logicOwnerId,
    totalNodes: nodes.length,
    totalEdges: edges.length
  });

  // 1. 「待機中」のフローを再開させる
  if (eventName === "click" && activeListeners.has(targetItemId)) {
    const listeners = activeListeners.get(targetItemId);
    if (listeners) {
      listeners.forEach(resume => resume());
      activeListeners.delete(targetItemId);
    }
  }

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

  console.log('🎯 見つかったイベントノード', {
    count: startingNodes.length,
    nodes: startingNodes.map(n => ({ id: n.id, label: n.data.label }))
  });

  if (startingNodes.length > 0) {
    const initialQueue: string[] = [];

    startingNodes.forEach(startNode => {
      // イベントノードからの出力を探す（ハンドル指定なし）
      const nextIds = findNextNodes(startNode.id, null, edges);
      initialQueue.push(...nextIds);
    });

    if (initialQueue.length > 0) {
      processQueue(initialQueue, nodes, edges, placedItems, getPreviewState, setPreviewState, requestPageChange, getVariables, setVariables, activeListeners, context);
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