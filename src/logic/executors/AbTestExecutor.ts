import type { NodeExecutor, ExecutionParams } from "../NodeExecutor";

export class AbTestExecutor implements NodeExecutor {
    async execute(params: ExecutionParams): Promise<void> {
        const { node, pushNext, allEdges, context, accumulatedQueue } = params;

        const { ratioA = 50 } = node.data;
        const probability = Number(ratioA);

        const randomValue = Math.random() * 100;
        const isPathA = randomValue < probability;
        const resultPath = isPathA ? "pathA" : "pathB";

        console.log('🎲 A/Bテストノード実行', {
            nodeId: node.id,
            probability,
            randomValue,
            resultPath
        });

        context.logEvent('logic_branch', {
            nodeId: node.id,
            nodeType: node.type,
            metadata: {
                result: resultPath,
                probability,
                randomValue
            }
        });

        pushNext(node.id, resultPath, allEdges, accumulatedQueue);
    }
}
