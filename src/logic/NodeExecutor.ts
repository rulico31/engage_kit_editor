import type { Node, Edge } from "reactflow";
import type { PlacedItemType, VariableState, PreviewState } from "../types";
import type { LogicRuntimeContext, ActiveListeners } from "../logicEngine";

/**
 * Result of a node execution
 */
export interface ExecutionResult {
    /**
     * IDs of the next nodes to execute
     * If undefined, execution stops at this node
     */
    nextNodes?: string[];

    /**
     * Whether to wait for async operation (e.g., animation, delay)
     * If true, the engine will not proceed to nextNodes immediately
     */
    isAsync?: boolean;
}

/**
 * Runtime state bundle to reduce parameter passing
 */
export interface RuntimeState {
    placedItems: PlacedItemType[];
    allNodes: Node[];
    allEdges: Edge[];

    getPreviewState: () => PreviewState;
    setPreviewState: (newState: PreviewState) => void;

    getVariables: () => VariableState;
    setVariables: (newVars: VariableState) => void;

    requestPageChange: (pageId: string) => void;

    activeListeners: ActiveListeners;

    /**
     * ID of the item that triggered the current execution flow
     * Used for resolving TRIGGER_ITEM placeholders
     */
    triggerItemId: string | null;
}

/**
 * Base interface for all node executors
 */
export interface NodeExecutor<TData = any> {
    /**
     * Execute the node logic
     * @param node The node to execute
     * @param context External dependencies (logging, API calls)
     * @param state Runtime state bundle
     * @returns Execution result with next nodes to execute
     */
    execute(
        node: Node<TData>,
        context: LogicRuntimeContext,
        state: RuntimeState
    ): Promise<ExecutionResult>;
}

/**
 * Helper to find next nodes from a source node and handle
 */
export const findNextNodes = (
    srcId: string,
    handle: string | null,
    edges: Edge[]
): string[] => {
    return edges
        .filter((e) => {
            if (e.source !== srcId) return false;
            if (handle === null) return true;
            return e.sourceHandle === handle;
        })
        .map((e) => e.target);
};

/**
 * Helper to resolve TRIGGER_ITEM placeholder
 */
export const resolveTriggerItem = (
    targetItemId: string | undefined,
    triggerItemId: string | null
): string | undefined => {
    if (targetItemId === 'TRIGGER_ITEM') {
        return triggerItemId || undefined;
    }
    return targetItemId;
};
