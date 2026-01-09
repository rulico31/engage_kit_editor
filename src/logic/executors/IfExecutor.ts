import type { Node } from "reactflow";
import type { NodeExecutor, ExecutionResult, RuntimeState } from "../NodeExecutor";
import type { LogicRuntimeContext } from "../../logicEngine";
import { findNextNodes, resolveTriggerItem } from "../NodeExecutor";
import { usePreviewStore } from "../../stores/usePreviewStore";

interface IfNodeData {
    conditionSource?: 'item' | 'variable';
    conditionTargetId?: string;
    conditionType?: 'isVisible' | 'isHidden';
    variableName?: string;
    comparisonType?: 'string' | 'number';
    comparison?: '==' | '!=' | 'contains' | 'not_contains' | '>' | '>=' | '<' | '<=';
    comparisonValue?: string | number;
}

/**
 * Executor for If/Condition nodes
 */
export class IfExecutor implements NodeExecutor<IfNodeData> {
    async execute(
        node: Node<IfNodeData>,
        context: LogicRuntimeContext,
        state: RuntimeState
    ): Promise<ExecutionResult> {
        const {
            conditionSource = 'item',
            conditionTargetId,
            conditionType,
            variableName,
            comparisonType = 'string',
            comparison = '==',
            comparisonValue
        } = node.data;

        const resolvedTargetId = resolveTriggerItem(conditionTargetId, state.triggerItemId);

        console.log('🔀 Ifノード実行', {
            nodeId: node.id,
            conditionSource,
            conditionTargetId,
            conditionType,
            variableName,
            comparisonType,
            comparison,
            comparisonValue
        });

        // ノード滞在時間計測開始
        usePreviewStore.getState().startNodeExecution(node.id, 'IfNode');

        let conditionResult = false;

        if (conditionSource === 'item') {
            const currentState = state.getPreviewState();
            const targetItemState = resolvedTargetId ? currentState[resolvedTargetId] : undefined;
            if (targetItemState) {
                if (conditionType === "isVisible") {
                    conditionResult = targetItemState.isVisible === true;
                } else if (conditionType === "isHidden") {
                    conditionResult = targetItemState.isVisible === false;
                }
            }
        } else if (conditionSource === 'variable') {
            const currentVars = state.getVariables();
            const varValue = currentVars[variableName || ''];

            if (comparisonType === 'number') {
                const numVarValue = Number(varValue || 0);
                const numCompValue = Number(comparisonValue || 0);

                switch (comparison) {
                    case '==': conditionResult = numVarValue === numCompValue; break;
                    case '!=': conditionResult = numVarValue !== numCompValue; break;
                    case '>': conditionResult = numVarValue > numCompValue; break;
                    case '>=': conditionResult = numVarValue >= numCompValue; break;
                    case '<': conditionResult = numVarValue < numCompValue; break;
                    case '<=': conditionResult = numVarValue <= numCompValue; break;
                }
            } else {
                const strVarValue = String(varValue ?? "");
                const strCompValue = String(comparisonValue ?? "");

                switch (comparison) {
                    case '==': conditionResult = strVarValue === strCompValue; break;
                    case '!=': conditionResult = strVarValue !== strCompValue; break;
                    case 'contains': conditionResult = strVarValue.includes(strCompValue); break;
                    case 'not_contains': conditionResult = !strVarValue.includes(strCompValue); break;
                }
            }
        }

        console.log('✅ If条件結果', {
            nodeId: node.id,
            conditionResult,
            nextPath: conditionResult ? 'true' : 'false'
        });

        context.logEvent('logic_branch', {
            nodeId: node.id,
            nodeType: node.type,
            metadata: {
                result: conditionResult ? 'true' : 'false',
                conditionSource,
                variableName
            }
        });

        // 滞在時間計測終了
        usePreviewStore.getState().endNodeExecution();

        return {
            nextNodes: findNextNodes(node.id, conditionResult ? "true" : "false", state.allEdges)
        };
    }
}
