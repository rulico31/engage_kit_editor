// src/lib/ValidationService.ts

import type { ProjectData, NodeGraph } from '../types';


export interface ValidationIssue {
    type: 'error' | 'warning';
    category: 'orphaned_node' | 'broken_link' | 'missing_config' | 'other';
    message: string;
    nodeId?: string;
    itemId?: string;
    pageId?: string;
}

export interface ValidationResult {
    isValid: boolean;
    errors: ValidationIssue[];
    warnings: ValidationIssue[];
}

export class ValidationService {
    /**
     * プロジェクトデータを検証し、公開に適しているかチェックする
     * 注意: すべての問題は「警告」として扱われ、公開をブロックしません
     */
    static validate(projectData: ProjectData): ValidationResult {
        const warnings: ValidationIssue[] = [];

        // pagesをRecord<string, any>として扱う（型の不整合を回避）
        const pages = projectData.pages as any as Record<string, any>;

        // 各ページを検証
        Object.entries(pages).forEach(([pageId, pageData]) => {
            // 各アイテムのロジックを検証
            const allItemLogics = (pageData as any).allItemLogics || {};
            Object.entries(allItemLogics).forEach(([itemId, nodeGraph]) => {
                // 1. 孤立ノードのチェック（イベントノードから到達できないノード）
                const orphanedNodes = this.findOrphanedNodes(nodeGraph as NodeGraph);
                orphanedNodes.forEach((nodeId: string) => {
                    warnings.push({
                        type: 'warning',
                        category: 'orphaned_node',
                        message: `孤立したノードが検出されました（イベントノードから到達できません）`,
                        nodeId,
                        itemId,
                        pageId
                    });
                });

                // 2. 未接続ノードのチェック（エッジで他のノードと接続されていない）
                const disconnectedNodes = this.findDisconnectedNodes(nodeGraph as NodeGraph);
                disconnectedNodes.forEach((nodeId: string) => {
                    warnings.push({
                        type: 'warning',
                        category: 'orphaned_node',
                        message: `未接続のノードが検出されました（他のノードと線で繋がっていません）`,
                        nodeId,
                        itemId,
                        pageId
                    });
                });

                // 3. リンク切れのチェック
                const brokenLinks = this.findBrokenLinks(nodeGraph as NodeGraph, projectData, pageId);
                brokenLinks.forEach(issue => {
                    warnings.push({
                        type: 'warning',
                        category: 'broken_link',
                        message: issue.message,
                        nodeId: issue.nodeId,
                        itemId,
                        pageId
                    });
                });

                // 4. 必須設定のチェック
                const missingConfigs = this.findMissingConfigurations(nodeGraph as NodeGraph);
                missingConfigs.forEach(issue => {
                    warnings.push({
                        type: 'warning',
                        category: 'missing_config',
                        message: issue.message,
                        nodeId: issue.nodeId,
                        itemId,
                        pageId
                    });
                });

                // 5. 無限ループ（危険なサイクル）のチェック
                const loops = this.detectInfiniteLoops(nodeGraph as NodeGraph);
                loops.forEach((nodeId: string) => {
                    warnings.push({
                        type: 'warning',
                        category: 'other',
                        message: `無限ループの可能性があります。ユーザー操作を待たないノードだけでループが形成されています。`,
                        nodeId,
                        itemId,
                        pageId
                    });
                });
            });
        });

        return {
            isValid: true, // 常にtrue（警告は公開をブロックしない）
            errors: [], // エラーは廃止
            warnings
        };
    }

    /**
     * 孤立したノード（イベントノードから到達できないノード）を検出
     */
    private static findOrphanedNodes(nodeGraph: NodeGraph): string[] {
        const { nodes, edges } = nodeGraph;

        // イベントノードを探す
        const eventNodes = nodes.filter(n => n.type === 'eventNode');

        // イベントノードがない場合、全てのノードが孤立とみなす（警告のみ）
        if (eventNodes.length === 0) {
            return nodes.map(n => n.id);
        }

        // BFSで到達可能なノードを探索
        const reachable = new Set<string>();
        const queue = [...eventNodes.map(n => n.id)];

        while (queue.length > 0) {
            const current = queue.shift()!;
            if (reachable.has(current)) continue;

            reachable.add(current);

            // このノードから出ているエッジを探す
            const outgoingEdges = edges.filter(e => e.source === current);
            outgoingEdges.forEach(edge => {
                if (!reachable.has(edge.target)) {
                    queue.push(edge.target);
                }
            });
        }

        // 到達できないノードが孤立ノード
        return nodes
            .filter(n => !reachable.has(n.id))
            .map(n => n.id);
    }

    /**
     * 未接続ノード（エッジで他のノードと接続されていないノード）を検出
     * イベントノードは除外（イベントノードは起点なので接続がなくても問題ない）
     */
    private static findDisconnectedNodes(nodeGraph: NodeGraph): string[] {
        const { nodes, edges } = nodeGraph;

        return nodes
            .filter(node => {
                // イベントノードは除外
                if (node.type === 'eventNode') return false;

                // このノードに接続されているエッジがあるかチェック
                const hasIncomingEdge = edges.some(e => e.target === node.id);
                const hasOutgoingEdge = edges.some(e => e.source === node.id);

                // 入力も出力もエッジがない場合は未接続
                return !hasIncomingEdge && !hasOutgoingEdge;
            })
            .map(n => n.id);
    }

    /**
     * リンク切れ（存在しないページやアイテムへの参照）を検出
     */
    private static findBrokenLinks(
        nodeGraph: NodeGraph,
        projectData: ProjectData,
        _currentPageId: string
    ): Array<{ nodeId: string; message: string }> {
        const issues: Array<{ nodeId: string; message: string }> = [];
        const { nodes } = nodeGraph;

        // 全アイテムIDのセットを作成
        const allItemIds = new Set<string>();
        Object.values(projectData.pages).forEach(page => {
            page.placedItems.forEach(item => allItemIds.add(item.id));
        });

        // 全ページIDのセット
        const allPageIds = new Set(Object.keys(projectData.pages));

        nodes.forEach(node => {
            // ページ遷移ノード
            if (node.type === 'pageNode') {
                const targetPageId = node.data.targetPageId;
                if (targetPageId && !allPageIds.has(targetPageId)) {
                    issues.push({
                        nodeId: node.id,
                        message: `存在しないページ「${targetPageId}」への遷移が設定されています`
                    });
                }
            }

            // アクション/条件/アニメーションノード
            if (['actionNode', 'ifNode', 'animateNode'].includes(node.type || '')) {
                const targetItemId = node.data.targetItemId;
                if (targetItemId && !allItemIds.has(targetItemId)) {
                    issues.push({
                        nodeId: node.id,
                        message: `存在しないアイテム「${targetItemId}」への参照が設定されています`
                    });
                }
            }

            // If ノードの複数ターゲット
            if (node.type === 'ifNode' && Array.isArray(node.data.targetItemIds)) {
                node.data.targetItemIds.forEach((itemId: string) => {
                    if (!allItemIds.has(itemId)) {
                        issues.push({
                            nodeId: node.id,
                            message: `存在しないアイテム「${itemId}」への参照が設定されています`
                        });
                    }
                });
            }

            // イベントノードの複数ターゲット
            if (node.type === 'eventNode' && Array.isArray(node.data.targetItemIds)) {
                node.data.targetItemIds.forEach((itemId: string) => {
                    if (!allItemIds.has(itemId)) {
                        issues.push({
                            nodeId: node.id,
                            message: `存在しないアイテム「${itemId}」への参照が設定されています`
                        });
                    }
                });
            }
        });

        return issues;
    }

    /**
     * 必須設定の不足を検出
     */
    private static findMissingConfigurations(nodeGraph: NodeGraph): Array<{ nodeId: string; message: string }> {
        const issues: Array<{ nodeId: string; message: string }> = [];
        const { nodes } = nodeGraph;

        nodes.forEach(node => {
            // ページ遷移ノード: targetPageIdが必須
            if (node.type === 'pageNode') {
                const targetPageId = node.data.targetPageId;
                if (!targetPageId || targetPageId.trim() === '') {
                    issues.push({
                        nodeId: node.id,
                        message: `ページ遷移ノードに遷移先ページが設定されていません`
                    });
                }
            }

            // アクションノード: targetItemIdが必要（一部のモードでは不要）
            if (node.type === 'actionNode') {
                const mode = node.data.mode;
                const targetItemId = node.data.targetItemId;

                // toggle/show/hide モードではtargetItemIdが必須
                if (['toggle', 'show', 'hide'].includes(mode)) {
                    if (!targetItemId || targetItemId.trim() === '') {
                        issues.push({
                            nodeId: node.id,
                            message: `アクションノードに対象アイテムが設定されていません`
                        });
                    }
                }
            }

            // 条件分岐ノード: conditionまたはtargetItemIdが必要
            if (node.type === 'ifNode') {
                const condition = node.data.condition;
                if (!condition || condition.trim() === '') {
                    issues.push({
                        nodeId: node.id,
                        message: `条件分岐ノードに条件が設定されていません`
                    });
                }
            }

            // 変数設定ノード: variableName, operation, valueが必須
            if (node.type === 'setVariableNode') {
                const variableName = node.data.variableName;
                const operation = node.data.operation;
                const value = node.data.value;

                if (!variableName || variableName.trim() === '') {
                    issues.push({
                        nodeId: node.id,
                        message: `変数設定ノードに変数名が設定されていません`
                    });
                }
                if (!operation) {
                    issues.push({
                        nodeId: node.id,
                        message: `変数設定ノードに操作が設定されていません`
                    });
                }
                if (value === undefined || value === null || value === '') {
                    issues.push({
                        nodeId: node.id,
                        message: `変数設定ノードに値が設定されていません`
                    });
                }
            }

            // 外部APIノード: URLが必須
            if (node.type === 'externalApiNode') {
                const url = node.data.url;
                if (!url || url.trim() === '') {
                    issues.push({
                        nodeId: node.id,
                        message: `外部APIノードにURLが設定されていません`
                    });
                }
            }

            // アニメーションノード: targetItemIdが必要
            if (node.type === 'animateNode') {
                const targetItemId = node.data.targetItemId;
                if (!targetItemId || targetItemId.trim() === '') {
                    issues.push({
                        nodeId: node.id,
                        message: `アニメーションノードに対象アイテムが設定されていません`
                    });
                }
            }
        });

        return issues;
    }

    /**
     * 無限ループ（ユーザー介入なしでの循環）を検出
     * Action -> If -> Action などの自動実行ノードのみで構成されるループは危険
     */
    private static detectInfiniteLoops(nodeGraph: NodeGraph): string[] {
        const { nodes, edges } = nodeGraph;
        const dangerousNodes = new Set<string>();

        // 1. 自動実行ノードのみを対象としたサブグラフを作成
        // ユーザー介入が必要なノード（waitForClickNodeや、開始点であるeventNode）は
        // ループを止めるストッパーになるため、これらを含まないループのみを検出する。
        const autoNodes = nodes.filter(() => {
            // ストッパーとなるノードタイプ


            // アニメーションノードで「完了を待つ」場合はストッパーになり得るが、
            // 現状は安全側に倒してwait: trueでもストッパー扱いしない（自動で進むため）
            // 明示的なタイマーなどは将来的に考慮

            return true;
        });

        const autoNodeIds = new Set(autoNodes.map(n => n.id));

        // 自動ノード間のエッジのみ抽出
        const autoEdges = edges.filter(e =>
            autoNodeIds.has(e.source) && autoNodeIds.has(e.target)
        );

        // 2. DFSでサイクル検出
        const visited = new Set<string>();
        const recursionStack = new Set<string>();

        const hasCycle = (nodeId: string): boolean => {
            visited.add(nodeId);
            recursionStack.add(nodeId);

            const outgoing = autoEdges.filter(e => e.source === nodeId);
            for (const edge of outgoing) {
                if (!autoNodeIds.has(edge.target)) continue;

                if (!visited.has(edge.target)) {
                    if (hasCycle(edge.target)) return true;
                } else if (recursionStack.has(edge.target)) {
                    // サイクル発見
                    return true;
                }
            }

            recursionStack.delete(nodeId);
            return false;
        };

        // 全ての自動ノードを開始点としてチェック
        for (const node of autoNodes) {
            if (node.type === 'eventNode') continue;

            if (!visited.has(node.id)) {
                if (hasCycle(node.id)) {
                    // サイクル内のどれか一つでも返せば警告になる
                    dangerousNodes.add(node.id);
                }
            }
        }

        return Array.from(dangerousNodes);
    }
}
