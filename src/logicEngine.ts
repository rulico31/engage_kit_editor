import type { Node, Edge } from "reactflow";
import type { PlacedItemType, VariableState, PreviewState, NodeGraph } from "./types";
import { submitLeadData } from "./lib/leads";
import { logAnalyticsEvent } from "./lib/analytics";
import { useDebugLogStore } from "./stores/useDebugLogStore";

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
  context: LogicRuntimeContext,
  triggerItemId: string | null = null // ★追加: 発火元アイテムID
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

    try {

      // (1) アクションノード (表示・非表示)
      if (node.type === "actionNode") {
        const { targetItemId, mode } = node.data;

        console.log('🎬 アクションノード実行', {
          nodeId: node.id,
          targetItemId,
          mode,
          currentPreviewState: getPreviewState()
        });

        // ★修正: TRIGGER_ITEM の動的解決
        const resolvedTargetId = targetItemId === 'TRIGGER_ITEM' ? triggerItemId : targetItemId;

        if (resolvedTargetId) {
          const currentState = getPreviewState();
          const targetItemState = currentState[resolvedTargetId];

          console.log('🎯 ターゲットアイテム状態 (Resolved)', {
            targetItemId,
            resolvedTargetId,
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
              targetItemId: resolvedTargetId,
              oldVisibility: targetItemState.isVisible,
              newVisibility,
              mode
            });

            setPreviewState({
              ...currentState,
              [resolvedTargetId]: { ...targetItemState, isVisible: newVisibility },
            });
          } else {
            console.warn('⚠️ ターゲットアイテムが見つかりません', {
              resolvedTargetId,
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

        // ★修正: TRIGGER_ITEM の動的解決 (conditionTargetId)
        const resolvedTargetId = conditionTargetId === 'TRIGGER_ITEM' ? triggerItemId : conditionTargetId;

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
          const targetItemState = resolvedTargetId ? currentState[resolvedTargetId] : undefined;
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
        const { targetPageId, enableValidation = true } = node.data;
        console.log('📄 ページ遷移ノード実行', {
          nodeId: node.id,
          targetPageId,
          enableValidation
        });

        // バリデーション実行（デフォルト有効）
        if (enableValidation) {
          // 現在のページの必須入力欄を取得
          const requiredItems = placedItems.filter(item =>
            item.name.startsWith("テキスト入力欄") &&
            item.data.required === true
          );

          if (requiredItems.length > 0) {
            const currentVars = getVariables();
            const currentPreviewState = getPreviewState();
            const newPreviewState = { ...currentPreviewState };
            let hasError = false;
            const errors: any[] = [];

            requiredItems.forEach(item => {
              const varName = item.data.variableName || item.id;
              const value = String(currentVars[varName] || "").trim();

              if (!value) {
                hasError = true;
                errors.push({
                  id: item.id,
                  name: item.displayName || item.name,
                  msg: "必須項目です"
                });

                // エラー状態を設定（既存の表示状態を保持）
                newPreviewState[item.id] = {
                  isVisible: true,  // デフォルト値
                  opacity: 1,       // デフォルト値
                  ...newPreviewState[item.id],  // 既存の状態があれば上書き
                  error: "必須項目です"
                };
              } else {
                // エラーがない場合はエラー状態をクリア
                if (newPreviewState[item.id]?.error) {
                  newPreviewState[item.id] = {
                    isVisible: true,  // デフォルト値
                    opacity: 1,       // デフォルト値
                    ...newPreviewState[item.id],
                    error: undefined
                  };
                }
              }
            });

            if (hasError) {
              console.log("🚫 ページ遷移ブロック - 必須入力エラー", errors);
              setPreviewState(newPreviewState);
              // ページ遷移をブロック
              return;
            }

            // エラー状態のクリアを反映
            setPreviewState(newPreviewState);
          }
        }

        // バリデーションOKまたは無効の場合、ページ遷移を実行
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

        // ★修正: TRIGGER_ITEM の動的解決
        const resolvedTargetId = targetItemId === 'TRIGGER_ITEM' ? triggerItemId : targetItemId;

        if (resolvedTargetId) {
          const currentState = getPreviewState();
          const initialItem = placedItems.find(p => p.id === resolvedTargetId);

          // PreviewState にアイテムが存在する場合のみ実行
          if (currentState[resolvedTargetId] && initialItem) {

            let cssProperty = '';
            const durationMs = (Number(durationS) + Number(delayS)) * 1000;
            let toState: Partial<any>;

            const playAnimation = (remaining: number) => {
              let fromState: any;
              const currentItemState = getPreviewState()[resolvedTargetId];

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
                [resolvedTargetId]: fromState,
              });

              // 2. わずかに遅らせて transition を有効にし、目標値をセット
              setTimeout(() => {
                setPreviewState({
                  ...getPreviewState(),
                  [resolvedTargetId]: {
                    ...getPreviewState()[resolvedTargetId],
                    ...toState,
                    transition: `${cssProperty} ${durationS}s ${easing} ${delayS} s`
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
                    processQueue(nextNodeIds, allNodes, allEdges, placedItems, getPreviewState, setPreviewState, requestPageChange, getVariables, setVariables, activeListeners, context, triggerItemId);
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
            processQueue(nextNodeIds, allNodes, allEdges, placedItems, getPreviewState, setPreviewState, requestPageChange, getVariables, setVariables, activeListeners, context, triggerItemId);
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
        // ★修正: TRIGGER_ITEM の動的解決
        const resolvedTargetId = targetItemId === 'TRIGGER_ITEM' ? triggerItemId : targetItemId;

        console.log('⏸️ クリック待ちノード実行', {
          nodeId: node.id,
          targetItemId: resolvedTargetId
        });

        if (resolvedTargetId) {
          const nextNodeIds = findNextNodes(node.id, null, allEdges);

          if (nextNodeIds.length > 0) {
            const resumeFlow = () => {
              processQueue(
                nextNodeIds,
                allNodes, allEdges, placedItems, getPreviewState, setPreviewState, requestPageChange, getVariables, setVariables, activeListeners, context,
                resolvedTargetId // ★重要: クリック待ち解除後は、解除したアイテムを新たな triggerItem として伝播させる
              );
            };

            const listeners = activeListeners.get(resolvedTargetId) || [];
            listeners.push(resumeFlow);
            activeListeners.set(resolvedTargetId, listeners);
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

      // (11) フォーム送信ノード (旧来の場所に位置していたもの - 現在は (5) として定義)
      // ここにあった重複ブロックは削除

      // (4.5) Confirmation Node (New)
      else if (node.type === "confirmationNode") {
        const targetIds = node.data.targetItemIds || [];
        let hasValidationError = false;
        const validationErrors: Array<{ id: string; name: string; msg: string }> = [];

        // バリデーション結果を反映するための新しいPreviewState
        const newPreviewState = { ...getPreviewState() };

        // ターゲットアイテム（またはターゲット指定がない場合は全てのテキスト入力欄）をチェック
        const itemsToCheck = targetIds.length > 0
          ? placedItems.filter(item => targetIds.includes(item.id))
          : placedItems.filter(item => item.name.startsWith("テキスト入力欄"));

        itemsToCheck.forEach(item => {
          // テキスト入力欄以外はスキップ（念のため）
          if (!item.name.startsWith("テキスト入力欄")) return;

          const variableName = item.data.variableName || item.id;
          // 変数が紐づいていない場合はinputValueを直接チェック（プレビュー状態から） or 変数マップから
          const currentVars = getVariables();
          const value = variableName ? currentVars[variableName] : "";

          const trimmed = String(value || "").trim();
          let errorMsg: string | null = null;

          // 1. 必須チェック
          if (item.data.required && !trimmed) {
            errorMsg = "必須項目です";
          }
          // 2. 形式チェック
          else if (trimmed) {
            if (item.data.inputType === 'email') {
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              if (!emailRegex.test(trimmed)) errorMsg = "メールアドレスの形式が正しくありません";
            } else if (item.data.inputType === 'tel') {
              const telRegex = /^[0-9-]{10,}$/;
              if (!telRegex.test(trimmed)) errorMsg = "電話番号の形式が正しくありません";
            } else if (item.data.inputType === 'number') {
              if (isNaN(Number(trimmed))) errorMsg = "数値を入力してください";
            }
          }

          if (errorMsg) {
            hasValidationError = true;
            // stateにエラー情報を書き込み（既存の表示状態を保持）
            newPreviewState[item.id] = {
              isVisible: true,  // デフォルト値
              opacity: 1,       // デフォルト値
              ...newPreviewState[item.id],  // 既存の状態があれば上書き
              error: errorMsg
            };
            validationErrors.push({ id: item.id, name: variableName, msg: errorMsg });
          } else {
            // エラーがない場合はエラー状態をクリア
            if (newPreviewState[item.id]?.error) {
              newPreviewState[item.id] = {
                isVisible: true,  // デフォルト値
                opacity: 1,       // デフォルト値
                ...newPreviewState[item.id],
                error: undefined
              };
            }
          }
        });

        if (hasValidationError) {
          console.log("🚫 Validation failed at confirmation node", validationErrors);
          setPreviewState(newPreviewState);
          // alert()はUXを阻害するため削除。画面上の赤字エラー表示で通知する。
          return;
        }

        // バリデーションOK -> 確認画面表示
        console.log('✅ Validation OK. Showing confirmation modal.');
        const currentVars = getVariables();

        setPreviewState({
          ...newPreviewState, // エラークリア状態も反映
          confirmationModal: {
            isOpen: true,
            nodeId: node.id,
            variables: currentVars,
            headerText: node.data.headerText,
            noticeText: node.data.noticeText,
            targetItemIds: targetIds,
            backPageId: node.data.backPageId, // 戻る先ページIDを追加
            isSubmitConfirmation: false
          }
        });
        return;
      }

      // (5) Submit Form Node
      else if (node.type === "submitFormNode") {
        try {
          const currentVars = getVariables();
          const success = await context.submitLead(currentVars);
          const resultPath = success ? "success" : "error";

          const submittedFieldTypes = placedItems
            .filter(i => i.name.startsWith("テキスト入力欄"))
            .map(i => ({ name: i.data.variableName || i.id, type: i.data.inputType || 'text' }));

          context.logEvent('logic_branch', {
            nodeId: node.id,
            nodeType: node.type,
            metadata: {
              result: resultPath,
              submittedFields: submittedFieldTypes
            }
          });

          pushNext(node.id, resultPath, allEdges, nextQueue);
        } catch (error) {
          console.error("Submit failed:", error);
          context.logEvent('logic_branch', {
            nodeId: node.id,
            nodeType: node.type,
            metadata: {
              result: 'error',
              error: String(error)
            }
          });
          pushNext(node.id, "error", allEdges, nextQueue);
        }
      }

      // (6) External API Node
      else if (node.type === "externalApiNode") {
        const { url, method = "POST", variableName } = node.data;
        console.log('🌐 外部APIノード実行', {
          nodeId: node.id,
          url,
          method,
          variableName
        });

        if (!url) {
          useDebugLogStore.getState().addLog({
            level: 'error',
            message: `❌ API URL未設定`,
            details: { nodeId: node.id }
          });
          pushNext(node.id, "error", allEdges, nextQueue);
          continue;
        }

        try {
          const currentVars = getVariables();
          const options: any = { method };

          // GET/HEAD以外ならbodyに全変数をJSONで付与
          if (method !== 'GET' && method !== 'HEAD') {
            options.headers = { 'Content-Type': 'application/json' };
            options.body = JSON.stringify(currentVars);
          }

          // 送信ログ
          useDebugLogStore.getState().addLog({
            level: 'info',
            message: `🌐 API送信: ${method} ${url} `,
            details: {
              url,
              method,
              body: options.body ? JSON.parse(options.body) : undefined,
              headers: options.headers
            }
          });

          const responseData = await context.fetchApi(url, options);

          // 成功ログ
          useDebugLogStore.getState().addLog({
            level: 'success',
            message: `✅ API成功: ${url} `,
            details: { responseData }
          });

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
        } catch (e: any) {
          console.error("API fetch error:", e);

          // エラーログ
          useDebugLogStore.getState().addLog({
            level: 'error',
            message: `❌ API失敗: ${url} `,
            details: {
              url,
              method,
              error: e.message || String(e),
              stack: e.stack
            }
          });

          context.logEvent('node_execution', {
            nodeId: node.id,
            nodeType: node.type,
            metadata: { status: 'error', url, error: String(e) }
          });
          pushNext(node.id, "error", allEdges, nextQueue);
        }
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

  if (nextQueue.length > 0) {
    if (nextQueue.length > 0) {
      await processQueue(nextQueue, allNodes, allEdges, placedItems, getPreviewState, setPreviewState, requestPageChange, getVariables, setVariables, activeListeners, context, triggerItemId);
    }
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
  console.log('📋 確認画面の結果を処理', {
    nodeId,
    result
  });

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