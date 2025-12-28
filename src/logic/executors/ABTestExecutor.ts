import type { Node } from "reactflow";
import type { NodeExecutor, ExecutionResult, RuntimeState } from "../NodeExecutor";
import type { LogicRuntimeContext } from "../../logicEngine";
import { findNextNodes } from "../NodeExecutor";

interface ABTestNodeData {
    ratioA?: number;
}

/**
 * Executor for A/B Test nodes
 * Randomly routes to path A or B based on probability
 */
export class ABTestExecutor implements NodeExecutor<ABTestNodeData> {
    async execute(
        node: Node<ABTestNodeData>,
        context: LogicRuntimeContext,
        state: RuntimeState
    ): Promise<ExecutionResult> {
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

        return {
            nextNodes: findNextNodes(node.id, resultPath, state.allEdges)
        };
    }
}
