import type { Node } from "reactflow";
import type { NodeExecutor, ExecutionResult, RuntimeState } from "../NodeExecutor";
import type { LogicRuntimeContext } from "../../logicEngine";
import { findNextNodes as findNext, resolveTriggerItem as resolve } from "../NodeExecutor";

interface ActionNodeData {
    targetItemId?: string;
    mode?: 'show' | 'hide' | 'toggle';
}

/**
 * Executor for Action nodes (show/hide/toggle items)
 */
export class ActionExecutor implements NodeExecutor<ActionNodeData> {
    async execute(
        node: Node<ActionNodeData>,
        context: LogicRuntimeContext,
        state: RuntimeState
    ): Promise<ExecutionResult> {
        const { targetItemId, mode } = node.data;

        console.log('🎬 アクションノード実行', {
            nodeId: node.id,
            targetItemId,
            mode,
            currentPreviewState: state.getPreviewState()
        });

        // Resolve TRIGGER_ITEM placeholder
        const resolvedTargetId = resolve(targetItemId, state.triggerItemId);

        if (resolvedTargetId) {
            const currentState = state.getPreviewState();
            const targetItemState = currentState[resolvedTargetId];

            console.log('🎯 ターゲットアイテム状態 (Resolved)', {
                targetItemId,
                resolvedTargetId,
                targetItemState,
                exists: !!targetItemState
            });

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

                state.setPreviewState({
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

        return {
            nextNodes: findNext(node.id, null, state.allEdges)
        };
    }
}
