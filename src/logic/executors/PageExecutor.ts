import type { Node } from "reactflow";
import type { NodeExecutor, ExecutionResult, RuntimeState } from "../NodeExecutor";
import type { LogicRuntimeContext } from "../../logicEngine";
import { usePreviewStore } from "../../stores/usePreviewStore";
import { usePageStore } from "../../stores/usePageStore"; // 追加
import { logAnalyticsEvent } from "../../lib/analytics";

interface PageNodeData {
    targetPageId?: string;
    enableValidation?: boolean;
}

interface ValidationError {
    id: string;
    name: string;
    msg: string;
}

/**
 * Executor for Page transition nodes
 */
export class PageExecutor implements NodeExecutor<PageNodeData> {
    async execute(
        node: Node<PageNodeData>,
        context: LogicRuntimeContext,
        state: RuntimeState
    ): Promise<ExecutionResult> {
        const { targetPageId, enableValidation = true } = node.data;

        console.log('📄 ページ遷移ノード実行', {
            nodeId: node.id,
            targetPageId,
            enableValidation
        });

        // ノード滞在時間計測開始
        usePreviewStore.getState().startNodeExecution(node.id, 'PageNode');

        // Validation (enabled by default)
        if (enableValidation) {
            const requiredItems = state.placedItems.filter(item =>
                item.name.startsWith("テキスト入力欄") &&
                item.data.required === true
            );

            if (requiredItems.length > 0) {
                const currentVars = state.getVariables();
                const currentPreviewState = state.getPreviewState();
                const newPreviewState = { ...currentPreviewState };
                let hasError = false;
                const errors: ValidationError[] = [];

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

                        newPreviewState[item.id] = {
                            isVisible: true,
                            opacity: 1,
                            ...newPreviewState[item.id],
                            error: "必須項目です"
                        };
                    } else {
                        if (newPreviewState[item.id]?.error) {
                            newPreviewState[item.id] = {
                                isVisible: true,
                                opacity: 1,
                                ...newPreviewState[item.id],
                                error: undefined
                            };
                        }
                    }
                });

                if (hasError) {
                    console.log("🚫 ページ遷移ブロック - 必須入力エラー", errors);
                    state.setPreviewState(newPreviewState);
                    // 滞在時間計測終了
                    usePreviewStore.getState().endNodeExecution();
                    // Block page transition (return empty nextNodes)
                    return { nextNodes: [] };
                }

                // Clear error states
                state.setPreviewState(newPreviewState);
            }
        }

        // Execute page transition
        if (targetPageId) {
            // 現在の履歴を取得（recordNavigation前）
            const historyBeforeTransition = usePreviewStore.getState().navigationHistory;
            const currentIndexBeforeTransition = usePreviewStore.getState().currentHistoryIndex;
            const fromPageId = historyBeforeTransition[currentIndexBeforeTransition]?.pageId;

            // ナビゲーション履歴記録とページ遷移
            usePreviewStore.getState().recordNavigation(targetPageId, node.id);

            // ★ バックトラッキング自動検知
            // 履歴の中に遷移先ページが既に存在するか確認（最新のエントリを除く）
            const previousVisitIndex = historyBeforeTransition.findIndex((entry, idx) =>
                idx < historyBeforeTransition.length && entry.pageId === targetPageId
            );

            if (previousVisitIndex >= 0) {
                // 前に訪問したページに戻っている = バックトラッキング
                const revisitCount = historyBeforeTransition.filter(e => e.pageId === targetPageId).length + 1;

                console.log('🔙 バックトラッキング検知', {
                    from: fromPageId,
                    to: targetPageId,
                    previousVisitIndex,
                    currentIndex: currentIndexBeforeTransition,
                    revisitCount
                });



                // usePreviewStoreのgetState()からはpagesは取れないので、usePageStoreを使う
                const { pages: allPages } = usePageStore.getState();

                const fromPageName = allPages[fromPageId]?.name || "Unknown Page";
                const toPageName = allPages[targetPageId]?.name || "Unknown Page";
                const fromNodeId = historyBeforeTransition[currentIndexBeforeTransition]?.nodeId;

                logAnalyticsEvent('backtracking', {
                    metadata: {
                        from_page_id: fromPageId,
                        from_page_name: fromPageName, // 追加: 遷移元ページ名
                        from_node_id: fromNodeId,     // 追加: 遷移元ノードID
                        to_page_id: targetPageId,
                        to_page_name: toPageName,     // 追加: 遷移先ページ名
                        to_node_id: node.id,          // 今回の遷移ノード
                        backtrack_distance: (currentIndexBeforeTransition - previousVisitIndex),
                        revisit_count: revisitCount,
                        total_backtracks: historyBeforeTransition.length,
                    }
                });
            }

            state.requestPageChange(targetPageId);
            console.log('✅ ページ遷移実行', { targetPageId });
        } else {
            console.warn('⚠️ targetPageIdが設定されていません');
        }

        // 滞在時間計測終了
        usePreviewStore.getState().endNodeExecution();

        // Page nodes don't have outgoing edges (terminal nodes)
        return { nextNodes: [] };
    }
}
