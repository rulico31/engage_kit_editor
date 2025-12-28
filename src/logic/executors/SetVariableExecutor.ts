import type { Node } from "reactflow";
import type { NodeExecutor, ExecutionResult, RuntimeState } from "../NodeExecutor";
import type { LogicRuntimeContext } from "../../logicEngine";
import { findNextNodes } from "../NodeExecutor";

interface SetVariableNodeData {
    variableName?: string;
    operation?: 'set' | 'add';
    value?: string | number;
}

/**
 * Executor for SetVariable nodes
 */
export class SetVariableExecutor implements NodeExecutor<SetVariableNodeData> {
    async execute(
        node: Node<SetVariableNodeData>,
        context: LogicRuntimeContext,
        state: RuntimeState
    ): Promise<ExecutionResult> {
        const { variableName, operation = 'set', value } = node.data;

        console.log('📊 変数セットノード実行', {
            nodeId: node.id,
            variableName,
            operation,
            value
        });

        if (variableName) {
            const currentVars = state.getVariables();
            let newValue = value;

            if (operation === 'add') {
                newValue = Number(currentVars[variableName] || 0) + Number(value || 0);
            }

            state.setVariables({ ...currentVars, [variableName]: newValue });

            console.log('✅ 変数更新完了', {
                variableName,
                oldValue: currentVars[variableName],
                newValue
            });
        } else {
            console.warn('⚠️ variableNameが設定されていません');
        }

        return {
            nextNodes: findNextNodes(node.id, null, state.allEdges)
        };
    }
}
