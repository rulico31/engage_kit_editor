import type { Node } from "reactflow";
import type { NodeExecutor, ExecutionResult, RuntimeState } from "../NodeExecutor";
import type { LogicRuntimeContext } from "../../logicEngine";
import { findNextNodes } from "../NodeExecutor";

interface SubmitFormNodeData {
    targetItemIds?: string[];
}

interface ExternalApiNodeData {
    url?: string;
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD';
    variableName?: string;
}

/**
 * Executor for SubmitForm nodes
 * Submits current variables as lead data
 */
export class SubmitFormExecutor implements NodeExecutor<SubmitFormNodeData> {
    async execute(
        node: Node<SubmitFormNodeData>,
        context: LogicRuntimeContext,
        state: RuntimeState
    ): Promise<ExecutionResult> {
        try {
            const currentVars = state.getVariables();
            const success = await context.submitLead(currentVars);
            const resultPath = success ? "success" : "error";

            const submittedFieldTypes = state.placedItems
                .filter(i => i.name.startsWith("テキスト入力欄"))
                .map(i => ({ name: i.data.variableName || i.id, type: i.data.inputType || 'text' }));

            context.logEvent('logic_branch', {
                nodeId: node.id,
                nodeType: node.type,
                metadata: {
                    result: resultPath,
                    submittedFields: submittedFieldTypes
                }
            });

            return {
                nextNodes: findNextNodes(node.id, resultPath, state.allEdges)
            };
        } catch (error) {
            console.error("Submit failed:", error);
            context.logEvent('logic_branch', {
                nodeId: node.id,
                nodeType: node.type,
                metadata: {
                    result: 'error',
                    error: String(error)
                }
            });
            return {
                nextNodes: findNextNodes(node.id, "error", state.allEdges)
            };
        }
    }
}

/**
 * Executor for ExternalAPI nodes
 * Calls external webhooks/APIs with current variables
 */
export class ExternalApiExecutor implements NodeExecutor<ExternalApiNodeData> {
    async execute(
        node: Node<ExternalApiNodeData>,
        context: LogicRuntimeContext,
        state: RuntimeState
    ): Promise<ExecutionResult> {
        const { url, method = "POST", variableName } = node.data;

        console.log('🌐 外部APIノード実行', {
            nodeId: node.id,
            url,
            method,
            variableName
        });

        if (!url) {
            console.error('❌ API URL未設定', { nodeId: node.id });
            return {
                nextNodes: findNextNodes(node.id, "error", state.allEdges)
            };
        }

        try {
            const currentVars = state.getVariables();
            const options: RequestInit = { method };

            if (method !== 'GET' && method !== 'HEAD') {
                options.headers = { 'Content-Type': 'application/json' };
                options.body = JSON.stringify(currentVars);
            }

            const responseData = await context.fetchApi(url, options);

            if (variableName) {
                const currentVars = state.getVariables();
                state.setVariables({ ...currentVars, [variableName]: responseData });
            }

            context.logEvent('node_execution', {
                nodeId: node.id,
                nodeType: node.type,
                metadata: { status: 'success', url }
            });

            return {
                nextNodes: findNextNodes(node.id, "success", state.allEdges)
            };
        } catch (e) {
            console.error("API fetch error:", e);
            context.logEvent('node_execution', {
                nodeId: node.id,
                nodeType: node.type,
                metadata: { status: 'error', url, error: String(e) }
            });
            return {
                nextNodes: findNextNodes(node.id, "error", state.allEdges)
            };
        }
    }
}
