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
 * Calls external webhooks/APIs with current variables via Supabase Edge Function proxy
 */
export class ExternalApiExecutor implements NodeExecutor<ExternalApiNodeData> {
    async execute(
        node: Node<ExternalApiNodeData>,
        context: LogicRuntimeContext,
        state: RuntimeState
    ): Promise<ExecutionResult> {
        const { url, method = "POST", variableName } = node.data;

        console.log('🌐 外部APIノード実行 (Edge Function経由)', {
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

            // Edge Functionを経由して外部APIにリクエスト
            // これによりCORS制限を回避
            const { supabase } = await import('../../lib/supabaseClient');

            const requestBody: any = {
                url,
                method,
                headers: {}
            };

            // GET/HEAD以外の場合はボディを追加
            if (method !== 'GET' && method !== 'HEAD') {
                requestBody.headers['Content-Type'] = 'application/json';
                requestBody.body = currentVars;
            }

            console.log('📡 Edge Functionに送信', requestBody);

            const { data, error } = await supabase.functions.invoke('external-api-proxy', {
                body: requestBody
            });

            if (error) {
                throw new Error(`Edge Function error: ${error.message}`);
            }

            console.log('✅ Edge Functionからのレスポンス', data);

            // レスポンスを変数に保存
            if (variableName && data) {
                const currentVars = state.getVariables();
                // dataが文字列の場合はJSONパースを試みる
                let parsedData = data;
                if (typeof data === 'string') {
                    try {
                        parsedData = JSON.parse(data);
                    } catch (e) {
                        // パースできない場合はそのまま使用
                        parsedData = data;
                    }
                }
                state.setVariables({ ...currentVars, [variableName]: parsedData });
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
            console.error("API fetch error (Edge Function):", e);
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
