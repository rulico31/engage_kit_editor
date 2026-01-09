import type { NodeExecutor, ExecutionParams } from "../NodeExecutor";

export class IfExecutor implements NodeExecutor {
    async execute(params: ExecutionParams): Promise<void> {
        const { node, getPreviewState, getVariables, triggerItemId, pushNext, allEdges, context, accumulatedQueue } = params;
        const {
            conditionSource = 'item',
            conditionTargetId,
            conditionType,
            variableName,
            comparisonType = 'string',
            comparison = '==',
            comparisonValue
        } = node.data;

        const resolvedTargetId = conditionTargetId === 'TRIGGER_ITEM' ? triggerItemId : conditionTargetId;

        console.log('🔀 Ifノード実行', {
            nodeId: node.id,
            conditionSource,
            conditionTargetId,
        });

        let conditionResult = false;

        if (conditionSource === 'item') {
            const currentState = getPreviewState();
            const targetItemState = resolvedTargetId ? currentState[resolvedTargetId] : undefined;
            if (targetItemState) {
                if (conditionType === "isVisible") {
                    conditionResult = targetItemState.isVisible === true;
                } else if (conditionType === "isHidden") {
                    conditionResult = targetItemState.isVisible === false;
                }
            }
        } else if (conditionSource === 'variable') {
            const currentVars = getVariables();
            const varValue = currentVars[variableName];

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

        context.logEvent('logic_branch', {
            nodeId: node.id,
            nodeType: node.type,
            metadata: {
                result: conditionResult ? 'true' : 'false',
                conditionSource,
                variableName
            }
        });

        pushNext(node.id, conditionResult ? "true" : "false", allEdges, accumulatedQueue);
    }
}
