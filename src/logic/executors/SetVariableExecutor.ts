import type { Node } from "reactflow";
import type { NodeExecutor, ExecutionResult, RuntimeState } from "../NodeExecutor";
import type { LogicRuntimeContext } from "../../logicEngine";
import { findNextNodes } from "../NodeExecutor";
import { usePreviewStore } from "../../stores/usePreviewStore";

interface SetVariableNodeData {
    operationMode?: 'variable' | 'score';
    // 変数モード用
    variableName?: string;
    operation?: 'set' | 'add';
    value?: string | number;
    // スコアモード用
    scoreValue?: number;
    scoringReason?: string;
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
        const { operationMode = 'variable', variableName, operation = 'set', value, scoreValue, scoringReason } = node.data;

        console.log('📊 変数セットノード実行', {
            nodeId: node.id,
            operationMode,
            variableName,
            operation,
            value,
            scoreValue,
            scoringReason
        });

        // ★ スコアモードの場合
        if (operationMode === 'score') {
            const score = scoreValue || 0;
            const reason = scoringReason || '';

            usePreviewStore.getState().addScore(
                node.id,
                'setVariableNode',
                score,
                reason
            );

            console.log('✅ エンゲージメントスコア加算完了', {
                nodeId: node.id,
                scoreValue: score,
                reason
            });
        }
        // ★ 変数モードの場合（従来の処理）
        else if (variableName) {
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
