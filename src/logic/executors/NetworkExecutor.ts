import type { NodeExecutor, ExecutionParams } from "../NodeExecutor";
import { useDebugLogStore } from "../../stores/useDebugLogStore";

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
                const options: any = { method };

                if (method !== 'GET' && method !== 'HEAD') {
                    options.headers = { 'Content-Type': 'application/json' };
                    options.body = JSON.stringify(currentVars);
                }

                useDebugLogStore.getState().addLog({
                    level: 'info',
                    message: `🌐 API送信: ${method} ${url} `,
                    details: { url, method, body: options.body ? JSON.parse(options.body) : undefined, headers: options.headers }
                });

                const responseData = await context.fetchApi(url, options);

                useDebugLogStore.getState().addLog({
                    level: 'success',
                    message: `✅ API成功: ${url} `,
                    details: { responseData }
                });

                if (variableName) {
                    // Re-fetch variables to ensure we have the latest state (though it shouldn't have changed much)
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
                    message: `❌ API失敗: ${url} `,
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
                const success = await context.submitLead(currentVars);
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
