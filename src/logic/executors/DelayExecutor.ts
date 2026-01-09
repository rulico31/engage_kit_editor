import type { NodeExecutor, ExecutionParams } from "../NodeExecutor";

export class DelayExecutor implements NodeExecutor {
    async execute(params: ExecutionParams): Promise<void> {
        const { node, allEdges, pushNext, processQueue } = params;
        const { durationS = 1.0 } = node.data;

        console.log('⏱️ 遅延ノード実行', {
            nodeId: node.id,
            durationS
        });

        return new Promise((resolve) => {
            setTimeout(() => {
                console.log('✅ 遅延完了', { nodeId: node.id, durationS });
                const nextQueue: string[] = [];
                pushNext(node.id, null, allEdges, nextQueue);

                // 再帰的に次のノードを実行
                if (nextQueue.length > 0) {
                    processQueue(nextQueue).then(() => resolve());
                } else {
                    resolve();
                }
            }, Number(durationS) * 1000);
        });
    }
}
