import type { NodeExecutor, ExecutionParams } from "../NodeExecutor";

export class ActionExecutor implements NodeExecutor {
    async execute(params: ExecutionParams): Promise<void> {
        const { node, getPreviewState, setPreviewState, triggerItemId, pushNext, allEdges, accumulatedQueue } = params;
        const { targetItemId, mode } = node.data;


        if (import.meta.env.DEV) {
            console.log('🎬 アクションノード実行', {
                nodeId: node.id,
                targetItemId,
                mode,
            });
        }

        const resolvedTargetId = targetItemId === 'TRIGGER_ITEM' ? triggerItemId : targetItemId;

        if (resolvedTargetId) {
            const currentState = getPreviewState();
            const targetItemState = currentState[resolvedTargetId];

            if (targetItemState) {
                let newVisibility = targetItemState.isVisible;
                if (mode === "show") newVisibility = true;
                else if (mode === "hide") newVisibility = false;
                else if (mode === "toggle") newVisibility = !targetItemState.isVisible;

                setPreviewState({
                    ...currentState,
                    [resolvedTargetId]: { ...targetItemState, isVisible: newVisibility },
                });
            } else {
                console.warn('⚠️ ターゲットアイテムが見つかりません', { resolvedTargetId });
            }
        } else {
            console.warn('⚠️ targetItemIdが設定されていません', { nodeId: node.id });
        }

        // 同期的に次のノードをキューに追加
        pushNext(node.id, null, allEdges, accumulatedQueue);
    }
}
