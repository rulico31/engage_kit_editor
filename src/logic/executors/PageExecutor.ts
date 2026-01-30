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
            // ★ 修正: 必須項目だけでなく、すべての入力項目をチェック対象にする (形式エラーもチェックするため)
            const inputItems = placedItems.filter(item =>
                (item.name.startsWith("テキスト入力欄") || item.type === 'input')
            );

            if (import.meta.env.DEV) {
                console.log('🔍 入力項目バリデーション開始', {
                    totalItems: placedItems.length,
                    inputCount: inputItems.length,
                    items: inputItems.map(i => ({ id: i.id, name: i.name, type: i.data.inputType, required: i.data.required }))
                });
            }

            // 非同期インポートだとNodeExecutor内で扱いづらいため、トップレベルでインポート済みと仮定するか、動的インポートする
            // ここではトップレベルでimportできない(module type制約があるかも)ので、動的インポートする
            // ただし、パフォーマンスを考慮して上部でimportを追加する方が良いが、ツール制約上ここで書き換える
            const { validateInput } = await import('../../lib/validation');

            if (inputItems.length > 0) {
                const currentVars = getVariables();
                const currentPreviewState = getPreviewState();
                const newPreviewState = { ...currentPreviewState };
                let hasError = false;

                inputItems.forEach(item => {
                    const varName = item.data.variableName || item.id;
                    const rawValue = currentVars[varName];
                    const value = String(rawValue ?? ""); // trimはvalidateInput内で行う

                    // バリデーション実行
                    const error = validateInput(value, {
                        required: !!item.data.required,
                        inputType: item.data.inputType,
                        enableCountryCode: item.data.enableCountryCode
                    });

                    if (import.meta.env.DEV) {
                        console.log(`Checking item: ${item.name} (${item.id})`, { varName, rawValue, error });
                    }

                    if (error) {
                        hasError = true;
                        newPreviewState[item.id] = {
                            ...(newPreviewState[item.id] || {}), // Ensure object exists
                            isVisible: true,
                            opacity: 1,
                            error: error
                        };
                    } else {
                        // エラーがない場合、既存のエラーがあればクリア
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
