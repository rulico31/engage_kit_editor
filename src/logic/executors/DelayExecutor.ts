import type { Node } from "reactflow";
import type { NodeExecutor, ExecutionResult, RuntimeState } from "../NodeExecutor";
import type { LogicRuntimeContext } from "../../logicEngine";
import { findNextNodes } from "../NodeExecutor";

interface DelayNodeData {
    durationS?: number;
}

/**
 * Executor for Delay nodes
 * This is an async executor that waits for a specified duration
 */
export class DelayExecutor implements NodeExecutor<DelayNodeData> {
    async execute(
        node: Node<DelayNodeData>,
        context: LogicRuntimeContext,
        state: RuntimeState
    ): Promise<ExecutionResult> {
        const { durationS = 1.0 } = node.data;

        console.log('⏱️ 遅延ノード実行', {
            nodeId: node.id,
            durationS
        });

        // Wait for the specified duration
        await new Promise(resolve => setTimeout(resolve, Number(durationS) * 1000));

        console.log('✅ 遅延完了', { nodeId: node.id, durationS });

        return {
            nextNodes: findNextNodes(node.id, null, state.allEdges)
        };
    }
}
