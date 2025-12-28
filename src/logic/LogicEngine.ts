import type { Node } from "reactflow";
import type { NodeExecutor, RuntimeState } from "./NodeExecutor";
import type { LogicRuntimeContext, ActiveListeners } from "../logicEngine";
import type { VariableState, PreviewState, PlacedItemType } from "../types";

// Import all executors
import { ActionExecutor } from "./executors/ActionExecutor";
import { IfExecutor } from "./executors/IfExecutor";
import { PageExecutor } from "./executors/PageExecutor";
import { SetVariableExecutor } from "./executors/SetVariableExecutor";
import { DelayExecutor } from "./executors/DelayExecutor";
import { WaitForClickExecutor } from "./executors/WaitForClickExecutor";
import { ABTestExecutor } from "./executors/ABTestExecutor";
import { SubmitFormExecutor, ExternalApiExecutor } from "./executors/NetworkExecutor";

/**
 * Main LogicEngine class
 * Orchestrates node execution using the Strategy pattern
 */
export class LogicEngine {
    private executors: Map<string, NodeExecutor>;

    constructor() {
        this.executors = new Map();

        // Register all executors
        this.executors.set("actionNode", new ActionExecutor());
        this.executors.set("ifNode", new IfExecutor());
        this.executors.set("pageNode", new PageExecutor());
        this.executors.set("setVariableNode", new SetVariableExecutor());
        this.executors.set("delayNode", new DelayExecutor());
        this.executors.set("waitForClickNode", new WaitForClickExecutor());
        this.executors.set("abTestNode", new ABTestExecutor());
        this.executors.set("submitFormNode", new SubmitFormExecutor());
        this.executors.set("externalApiNode", new ExternalApiExecutor());

        // Legacy/passthrough nodes
        this.executors.set("eventNode", {
            async execute(node, context, state) {
                console.log('🎯 イベントノード通過', {
                    nodeId: node.id,
                    eventType: node.data.eventType
                });
                const { findNextNodes } = await import("./NodeExecutor");
                return {
                    nextNodes: findNextNodes(node.id, null, state.allEdges)
                };
            }
        });
    }

    /**
     * Execute a queue of nodes
     */
    async executeQueue(
        executionQueue: string[],
        allNodes: Node[],
        allEdges: import("reactflow").Edge[],
        placedItems: PlacedItemType[],
        getPreviewState: () => PreviewState,
        setPreviewState: (newState: PreviewState) => void,
        requestPageChange: (pageId: string) => void,
        getVariables: () => VariableState,
        setVariables: (newVars: VariableState) => void,
        activeListeners: ActiveListeners,
        context: LogicRuntimeContext,
        triggerItemId: string | null = null
    ): Promise<void> {
        const nextQueue: string[] = [];

        for (const nodeId of executionQueue) {
            const node = allNodes.find((n) => n.id === nodeId);
            if (!node) continue;

            // Log execution
            context.logEvent('node_execution', {
                nodeId: node.id,
                nodeType: node.type,
                metadata: { label: node.data.label }
            });

            try {
                const executor = this.executors.get(node.type || '');

                if (!executor) {
                    console.warn(`⚠️ No executor found for node type: ${node.type}`, { nodeId: node.id });
                    continue;
                }

                // Build runtime state
                const state: RuntimeState = {
                    placedItems,
                    allNodes,
                    allEdges,
                    getPreviewState,
                    setPreviewState,
                    getVariables,
                    setVariables,
                    requestPageChange,
                    activeListeners,
                    triggerItemId
                };

                // Execute the node
                const result = await executor.execute(node, context, state);

                // Add next nodes to queue (if not async)
                if (result.nextNodes && !result.isAsync) {
                    nextQueue.push(...result.nextNodes);
                }

            } catch (error) {
                console.error(`❌ Node execution error[${node.id}]:`, error);
                context.logEvent('error', {
                    nodeId: node.id,
                    nodeType: node.type,
                    metadata: {
                        message: (error as Error)?.message || 'Unknown logic error',
                        stack: (error as Error)?.stack
                    }
                });
            }
        }

        // Process next queue recursively
        if (nextQueue.length > 0) {
            await this.executeQueue(
                nextQueue,
                allNodes,
                allEdges,
                placedItems,
                getPreviewState,
                setPreviewState,
                requestPageChange,
                getVariables,
                setVariables,
                activeListeners,
                context,
                triggerItemId
            );
        }
    }
}

// Export singleton instance for backward compatibility
export const logicEngine = new LogicEngine();
