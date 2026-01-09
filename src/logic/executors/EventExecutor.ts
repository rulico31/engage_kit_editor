import type { NodeExecutor, ExecutionParams } from "../NodeExecutor";

export class EventExecutor implements NodeExecutor {
    async execute(params: ExecutionParams): Promise<void> {
        const { node, pushNext, allEdges, accumulatedQueue } = params;

        console.log('🎯 イベントノード通過', {
            nodeId: node.id,
            eventType: node.data.eventType
        });

        pushNext(node.id, null, allEdges, accumulatedQueue);
    }
}
