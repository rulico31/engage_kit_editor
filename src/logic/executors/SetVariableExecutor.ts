import type { NodeExecutor, ExecutionParams } from "../NodeExecutor";

export class SetVariableExecutor implements NodeExecutor {
    async execute(params: ExecutionParams): Promise<void> {
        const { node, getVariables, setVariables, pushNext, allEdges, accumulatedQueue } = params;
        const { variableName, operation = 'set', value } = node.data;


        if (import.meta.env.DEV) {
            console.log('📊 変数セットノード実行', {
                nodeId: node.id,
                variableName,
                operation,
                value
            });
        }

        if (variableName) {
            const currentVars = getVariables();
            let newValue = value;
            // シンプルな型変換と演算
            if (operation === 'add') {
                newValue = Number(currentVars[variableName] || 0) + Number(value || 0);
            }
            setVariables({ ...currentVars, [variableName]: newValue });
        } else {
            console.warn('⚠️ variableNameが設定されていません');
        }

        pushNext(node.id, null, allEdges, accumulatedQueue);
    }
}
