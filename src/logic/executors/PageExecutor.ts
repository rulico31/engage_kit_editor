import type { NodeExecutor, ExecutionParams } from "../NodeExecutor";

export class PageExecutor implements NodeExecutor {
    async execute(params: ExecutionParams): Promise<void> {
        const { node, placedItems, getVariables, getPreviewState, setPreviewState, requestPageChange } = params;
        const { targetPageId, enableValidation = true } = node.data;


        if (import.meta.env.DEV) {
            console.log('📄 ページ遷移ノード実行', {
                nodeId: node.id,
                targetPageId,
                enableValidation
            });
        }

        if (enableValidation) {
            const requiredItems = placedItems.filter(item =>
                item.name.startsWith("テキスト入力欄") &&
                item.data.required === true
            );

            if (requiredItems.length > 0) {
                const currentVars = getVariables();
                const currentPreviewState = getPreviewState();
                const newPreviewState = { ...currentPreviewState };
                let hasError = false;

                requiredItems.forEach(item => {
                    const varName = item.data.variableName || item.id;
                    const value = String(currentVars[varName] || "").trim();

                    if (!value) {
                        hasError = true;
                        newPreviewState[item.id] = {
                            ...newPreviewState[item.id],
                            isVisible: true,
                            opacity: 1,
                            error: "必須項目です"
                        };
                    } else {
                        if (newPreviewState[item.id]?.error) {
                            newPreviewState[item.id] = {
                                ...newPreviewState[item.id], // keep other props
                                isVisible: true,
                                opacity: 1,
                                error: undefined
                            };
                        }
                    }
                });

                setPreviewState(newPreviewState);

                if (hasError) {
                    if (import.meta.env.DEV) {
                        console.log("🚫 ページ遷移ブロック - 必須入力エラー");
                    }
                    return;
                }
            }
        }

        if (targetPageId) {
            requestPageChange(targetPageId);
        } else {
            console.warn('⚠️ targetPageIdが設定されていません');
        }
    }
}
