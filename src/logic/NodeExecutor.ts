import type { Node, Edge } from "reactflow";
import type { PlacedItemType, VariableState, PreviewState } from "../types";
import { logAnalyticsEvent } from "../lib/analytics";
import { submitLeadData } from "../lib/leads";

export interface LogicRuntimeContext {
    logEvent: typeof logAnalyticsEvent;
    submitLead: typeof submitLeadData;
    fetchApi: (url: string, options: RequestInit) => Promise<any>;
}

export type ActiveListeners = Map<string, Array<() => void>>;

export interface ExecutionParams {
    node: Node;
    allNodes: Node[];
    allEdges: Edge[];
    placedItems: PlacedItemType[];
    getPreviewState: () => PreviewState;
    setPreviewState: (newState: PreviewState) => void;
    requestPageChange: (pageId: string) => void;
    getVariables: () => VariableState;
    setVariables: (newVars: VariableState) => void;
    activeListeners: ActiveListeners;
    context: LogicRuntimeContext;
    triggerItemId: string | null;
    // ヘルパー
    pushNext: (srcId: string, handle: string | null, edges: Edge[], queue: string[]) => void;
    // 再帰呼び出し用 (非同期フロー用)
    processQueue: (queue: string[]) => Promise<void>;
    // 同期フロー用キュー (呼び出し元で管理されている配列)
    accumulatedQueue: string[];
}

export interface NodeExecutor {
    execute(params: ExecutionParams): Promise<void>;
}

export class ExecutorRegistry {
    private executors: Record<string, NodeExecutor> = {};

    register(nodeType: string, executor: NodeExecutor) {
        this.executors[nodeType] = executor;
    }

    getExecutor(nodeType: string): NodeExecutor | undefined {
        return this.executors[nodeType];
    }
}

export const registry = new ExecutorRegistry();
