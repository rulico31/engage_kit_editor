import type { Node } from "reactflow";
import type { NodeExecutor, ExecutionResult, RuntimeState } from "../NodeExecutor";
import type { LogicRuntimeContext } from "../../logicEngine";

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
                    // Block page transition (return empty nextNodes)
                    return { nextNodes: [] };
                }

                // Clear error states
                state.setPreviewState(newPreviewState);
            }
        }

        // Execute page transition
        if (targetPageId) {
            state.requestPageChange(targetPageId);
            console.log('✅ ページ遷移実行', { targetPageId });
        } else {
            console.warn('⚠️ targetPageIdが設定されていません');
        }

        // Page nodes don't have outgoing edges (terminal nodes)
        return { nextNodes: [] };
    }
}
