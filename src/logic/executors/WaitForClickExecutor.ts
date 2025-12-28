import type { Node } from "reactflow";
import type { NodeExecutor, ExecutionResult, RuntimeState } from "../NodeExecutor";
import type { LogicRuntimeContext } from "../../logicEngine";
import { findNextNodes, resolveTriggerItem } from "../NodeExecutor";

interface WaitForClickNodeData {
    targetItemId?: string;
}

/**
 * Executor for WaitForClick nodes
 * Registers a listener and pauses execution until the target item is clicked
 */
export class WaitForClickExecutor implements NodeExecutor<WaitForClickNodeData> {
    async execute(
        node: Node<WaitForClickNodeData>,
        context: LogicRuntimeContext,
        state: RuntimeState
    ): Promise<ExecutionResult> {
        const { targetItemId } = node.data;
        const resolvedTargetId = resolveTriggerItem(targetItemId, state.triggerItemId);

        console.log('⏸️ クリック待ちノード実行', {
            nodeId: node.id,
            targetItemId: resolvedTargetId
        });

        if (!resolvedTargetId) {
            return { nextNodes: findNextNodes(node.id, null, state.allEdges) };
        }

        // This node registers a listener but doesn't immediately proceed
        // The actual continuation is handled by ViewerHost when the item is clicked
        const nextNodeIds = findNextNodes(node.id, null, state.allEdges);

        // Return empty nextNodes to pause execution
        // The listener system will resume from nextNodeIds when the item is clicked
        return {
            nextNodes: [],
            isAsync: true // Flag that this is waiting for external event
        };
    }
}
