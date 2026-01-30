import type { NodeExecutor, ExecutionParams } from "../NodeExecutor";

export class ConfirmationExecutor implements NodeExecutor {
    async execute(params: ExecutionParams): Promise<void> {
        const { node, placedItems, getVariables, getPreviewState, setPreviewState } = params;

        // Confirmation is a pause point. It does NOT push automatically to queue (except validation failure).
        // The flow resumes via callback onConfirmationResult called from UI.

        const targetIds = node.data.targetItemIds || [];
        let hasValidationError = false;
        const validationErrors: Array<{ id: string; name: string; msg: string }> = [];

        const newPreviewState = { ...getPreviewState() };

        const itemsToCheck = targetIds.length > 0
            ? placedItems.filter(item => targetIds.includes(item.id))
            : placedItems.filter(item => item.name.startsWith("テキスト入力欄"));

        itemsToCheck.forEach(item => {
            if (!item.name.startsWith("テキスト入力欄")) return;

            const variableName = item.data.variableName || item.id;
            const currentVars = getVariables();
            const value = variableName ? currentVars[variableName] : "";

            const trimmed = String(value || "").trim();
            let errorMsg: string | null = null;

            if (item.data.required && !trimmed) {
                errorMsg = "必須項目です";
            }
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
                newPreviewState[item.id] = {
                    ...newPreviewState[item.id],
                    isVisible: true,
                    opacity: 1,
                    error: errorMsg
                };
                validationErrors.push({ id: item.id, name: variableName, msg: errorMsg });
            } else {
                if (newPreviewState[item.id]?.error) {
                    newPreviewState[item.id] = {
                        ...newPreviewState[item.id], // keep state
                        isVisible: true,
                        opacity: 1,
                        error: undefined
                    };
                }
            }
        });

        if (hasValidationError) {
            if (import.meta.env.DEV) {
                console.log("🚫 Validation failed at confirmation node", validationErrors);
            }
            setPreviewState(newPreviewState);
            return;
        }


        if (import.meta.env.DEV) {
            console.log('✅ Validation OK. Showing confirmation modal.');
        }
        const currentVars = getVariables();

        setPreviewState({
            ...newPreviewState,
            confirmationModal: {
                isOpen: true,
                nodeId: node.id,
                variables: currentVars,
                headerText: node.data.headerText,
                noticeText: node.data.noticeText,
                targetItemIds: targetIds,
                backPageId: node.data.backPageId,
                isSubmitConfirmation: false
            }
        });

        // Flow pauses here.
    }
}
