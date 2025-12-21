// src/lib/DataMinifier.ts

import type { ProjectData, PageData, NodeGraph } from '../types';

/**
 * 公開用データの最適化クラス
 * エディタ専用のプロパティを削除してデータサイズを削減
 */
export class DataMinifier {
    /**
     * プロジェクトデータを公開用に最適化
     * エディタ専用プロパティを削除し、Viewerに必要な情報のみを残す
     */
    static minifyForPublish(projectData: ProjectData): ProjectData {
        return {
            projectName: projectData.projectName,
            pages: this.minifyPages(projectData.pages),
            pageOrder: projectData.pageOrder,
            variables: projectData.variables,
            cloud_id: projectData.cloud_id
        };
    }

    /**
     * ページデータの最適化
     */
    private static minifyPages(pages: Record<string, PageData>): Record<string, PageData> {
        const minifiedPages: Record<string, PageData> = {};

        Object.entries(pages).forEach(([pageId, pageData]) => {
            minifiedPages[pageId] = {
                id: pageData.id,
                name: pageData.name,
                placedItems: pageData.placedItems, // Viewer表示に必要なのでそのまま保持
                allItemLogics: this.minifyAllItemLogics(pageData.allItemLogics),
                // comments は削除（エディタ専用）
                backgroundColor: pageData.backgroundColor,
                backgroundImage: pageData.backgroundImage
            };
        });

        return minifiedPages;
    }

    /**
     * アイテムロジックの最適化
     */
    private static minifyAllItemLogics(
        allItemLogics: Record<string, NodeGraph>
    ): Record<string, NodeGraph> {
        const minified: Record<string, NodeGraph> = {};

        Object.entries(allItemLogics).forEach(([itemId, nodeGraph]) => {
            minified[itemId] = {
                nodes: nodeGraph.nodes,
                edges: nodeGraph.edges
                // comments は削除（エディタ専用）
            };
        });

        return minified;
    }
}
