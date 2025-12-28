// src/logic/triggerEvent.ts
// Wrapper function for backward compatibility with existing code using triggerEvent

import type { PlacedItemType, VariableState, PreviewState, NodeGraph } from "../types";
import type { LogicRuntimeContext, ActiveListeners } from "../logicEngine";
import { logicEngine } from "./LogicEngine";
import { findNextNodes } from "./NodeExecutor";

/**
 * Event trigger function (backward compatible wrapper)
 * This function wraps the new LogicEngine to maintain compatibility with existing code
 */
export const triggerEvent = (
    eventName: string,
    targetItemId: string,
    logicOwnerId: string,
    currentPageGraph: NodeGraph,
    placedItems: PlacedItemType[],
    getPreviewState: () => PreviewState,
    setPreviewState: (newState: PreviewState) => void,
    requestPageChange: (pageId: string) => void,
    getVariables: () => VariableState,
    setVariables: (newVars: VariableState) => void,
    activeListeners: ActiveListeners,
    context: LogicRuntimeContext
) => {
    const { nodes, edges } = currentPageGraph;

    console.log('🔔 イベント発火', {
        eventName,
        targetItemId,
        logicOwnerId,
        totalNodes: nodes.length,
        totalEdges: edges.length
    });

    // 1. Resume waiting flows (for click events)
    if (eventName === "click" && activeListeners.has(targetItemId)) {
        const listeners = activeListeners.get(targetItemId);
        if (listeners) {
            listeners.forEach(resume => resume());
            activeListeners.delete(targetItemId);
        }
    }

    // 2. Find starting event nodes
    const startingNodes = nodes.filter((n) => {
        if (n.type !== "eventNode" || n.data.eventType !== eventName) return false;

        // A. Multiple target specification (targetItemIds)
        if (Array.isArray(n.data.targetItemIds) && n.data.targetItemIds.length > 0) {
            return n.data.targetItemIds.includes(targetItemId);
        }

        // B. Single target specification (targetItemId) - Legacy
        if (n.data.targetItemId) {
            return n.data.targetItemId === targetItemId;
        }

        // C. No target specification (Implicit Self)
        // Fire only when owner and target match (e.g., self click event)
        return logicOwnerId === targetItemId;
    });

    console.log('🎯 見つかったイベントノード', {
        count: startingNodes.length,
        nodes: startingNodes.map(n => ({ id: n.id, label: n.data.label }))
    });

    if (startingNodes.length > 0) {
        const initialQueue: string[] = [];

        startingNodes.forEach(startNode => {
            const nextIds = findNextNodes(startNode.id, null, edges);
            initialQueue.push(...nextIds);
        });

        if (initialQueue.length > 0) {
            // Use new LogicEngine to execute the queue
            logicEngine.executeQueue(
                initialQueue,
                nodes,
                edges,
                placedItems,
                getPreviewState,
                setPreviewState,
                requestPageChange,
                getVariables,
                setVariables,
                activeListeners,
                context,
                targetItemId // Pass trigger item ID for TRIGGER_ITEM resolution
            );
        }
    }
};
