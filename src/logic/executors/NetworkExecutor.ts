import type { NodeExecutor, ExecutionParams } from "../NodeExecutor";
import { useDebugLogStore } from "../../stores/useDebugLogStore";
import { supabase } from "../../lib/supabaseClient";

export class NetworkExecutor implements NodeExecutor {
    async execute(params: ExecutionParams): Promise<void> {
        const { node, getVariables, setVariables, pushNext, allEdges, processQueue, context, placedItems } = params;

        // --- External API Node ---
        if (node.type === "externalApiNode") {
            const { url, method = "POST", variableName } = node.data;
            console.log('🌐 外部APIノード実行', { nodeId: node.id, url, method, variableName });

            if (!url) {
                useDebugLogStore.getState().addLog({
                    level: 'error',
                    message: `❌ API URL未設定`,
                    details: { nodeId: node.id }
                });
                const nextQ: string[] = [];
                pushNext(node.id, "error", allEdges, nextQ);
                if (nextQ.length > 0) processQueue(nextQ);
                return;
            }

            try {
                const currentVars = getVariables();

                // Construct payload for the proxy
                let bodyData = undefined;
                let headers = {};

                if (method !== 'GET' && method !== 'HEAD') {
                    headers = { 'Content-Type': 'application/json' };
                    bodyData = currentVars; // Send all variables as body
                }

                useDebugLogStore.getState().addLog({
                    level: 'info',
                    message: `🌐 API送信 (Proxy経由): ${method} ${url}`,
                    details: { url, method, body: bodyData }
                });

                // Call Supabase Edge Function 'external-api-proxy'
                const { data, error } = await supabase.functions.invoke('external-api-proxy', {
                    body: {
                        url: url,
                        method: method,
                        headers: headers,
                        body: bodyData
                    }
                });

                if (error) {
                    throw new Error(`Proxy error: ${error.message || String(error)}`);
                }

                // Proxy returns the response data directly in 'data'
                const responseData = data;

                // Check if proxy returned an error object
                if (responseData && typeof responseData === 'object' && 'error' in responseData) {
                    throw new Error(`External API error: ${responseData.error}`);
                }

                useDebugLogStore.getState().addLog({
                    level: 'success',
                    message: `✅ API成功: ${url}`,
                    details: { responseData }
                });
                console.log('✅ API Proxy Response:', responseData);

                if (variableName) {
                    // Re-fetch variables to ensure we have the latest state
                    const latestVars = getVariables();
                    setVariables({ ...latestVars, [variableName]: responseData });
                }

                context.logEvent('node_execution', {
                    nodeId: node.id,
                    nodeType: node.type,
                    metadata: { status: 'success', url }
                });

                const nextQ: string[] = [];
                pushNext(node.id, "success", allEdges, nextQ);
                if (nextQ.length > 0) processQueue(nextQ);

            } catch (e: any) {
                console.error("API fetch error:", e);
                useDebugLogStore.getState().addLog({
                    level: 'error',
                    message: `❌ API失敗: ${url}`,
                    details: { url, method, error: e.message || String(e), stack: e.stack }
                });

                context.logEvent('node_execution', {
                    nodeId: node.id,
                    nodeType: node.type,
                    metadata: { status: 'error', url, error: String(e) }
                });

                const nextQ: string[] = [];
                pushNext(node.id, "error", allEdges, nextQ);
                if (nextQ.length > 0) processQueue(nextQ);
            }
        }

        // --- Submit Form Node ---
        else if (node.type === "submitFormNode") {
            try {
                const currentVars = getVariables();

                // Retrieve project ID from store (for Editor Preview) or context
                // Dynamic import to avoid circular dependency if any, though store should be fine
                const { useProjectStore } = await import('../../stores/useProjectStore');
                const projectId = useProjectStore.getState().currentProjectId || undefined;

                const success = await context.submitLead(currentVars, projectId);
                const resultPath = success ? "success" : "error";

                const submittedFieldTypes = placedItems
                    .filter(i => i.name.startsWith("テキスト入力欄"))
                    .map(i => ({ name: i.data.variableName || i.id, type: i.data.inputType || 'text' }));

                context.logEvent('logic_branch', {
                    nodeId: node.id,
                    nodeType: node.type,
                    metadata: { result: resultPath, submittedFields: submittedFieldTypes }
                });

                const nextQ: string[] = [];
                pushNext(node.id, resultPath, allEdges, nextQ);
                if (nextQ.length > 0) processQueue(nextQ);

            } catch (error) {
                console.error("Submit failed:", error);
                context.logEvent('logic_branch', {
                    nodeId: node.id,
                    nodeType: node.type,
                    metadata: { result: 'error', error: String(error) }
                });

                const nextQ: string[] = [];
                pushNext(node.id, "error", allEdges, nextQ);
                if (nextQ.length > 0) processQueue(nextQ);
            }
        }
    }
}
