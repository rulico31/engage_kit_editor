// src/lib/ValidationService.ts

import type { ProjectData, NodeGraph } from '../types';
import type { Node, Edge } from 'reactflow';

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
     */
    static validate(projectData: ProjectData): ValidationResult {
        const errors: ValidationIssue[] = [];
        const warnings: ValidationIssue[] = [];

        // 各ページを検証
        Object.entries(projectData.pages).forEach(([pageId, pageData]) => {
            // 各アイテムのロジックを検証
            Object.entries(pageData.allItemLogics || {}).forEach(([itemId, nodeGraph]) => {
                // 1. 孤立ノードのチェック
                const orphanedNodes = this.findOrphanedNodes(nodeGraph);
                orphanedNodes.forEach(nodeId => {
                    warnings.push({
                        type: 'warning',
                        category: 'orphaned_node',
                        message: `孤立したノードが検出されました（イベントノードから到達できません）`,
                        nodeId,
                        itemId,
                        pageId
                    });
                });

                // 2. リンク切れのチェック
                const brokenLinks = this.findBrokenLinks(nodeGraph, projectData, pageId);
                brokenLinks.forEach(issue => {
                    errors.push({
                        type: 'error',
                        category: 'broken_link',
                        message: issue.message,
                        nodeId: issue.nodeId,
                        itemId,
                        pageId
                    });
                });

                // 3. 必須設定のチェック
                const missingConfigs = this.findMissingConfigurations(nodeGraph);
                missingConfigs.forEach(issue => {
                    errors.push({
                        type: 'error',
                        category: 'missing_config',
                        message: issue.message,
                        nodeId: issue.nodeId,
                        itemId,
                        pageId
                    });
                });

                // 4. 無限ループ（危険なサイクル）のチェック
                const loops = this.detectInfiniteLoops(nodeGraph);
                loops.forEach(nodeId => {
                    errors.push({
                        type: 'error',
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
            isValid: errors.length === 0,
            errors,
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
     * リンク切れ（存在しないページやアイテムへの参照）を検出
     */
    private static findBrokenLinks(
        nodeGraph: NodeGraph,
        projectData: ProjectData,
        currentPageId: string
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

            // アクション/条件/アニメーション/クリック待ちノード
            if (['actionNode', 'ifNode', 'animateNode', 'waitForClickNode'].includes(node.type || '')) {
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

            // フォーム送信ノード: 現在は特に必須設定なし（変数があればOK）
            // 将来的にバリデーション追加可能
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
        const autoNodes = nodes.filter(n => {
            // ストッパーとなるノードタイプ
            if (n.type === 'waitForClickNode') return false;

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
