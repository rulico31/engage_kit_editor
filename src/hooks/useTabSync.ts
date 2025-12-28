import { useEffect, useRef } from 'react';
import { shallow } from 'zustand/shallow';
import { usePageStore } from '../stores/usePageStore';
import { useSelectionStore } from '../stores/useSelectionStore';
import type { SelectionEntry } from '../types';

/**
 * アイテムやノードの削除・復元（Undo/Redo）に合わせて
 * プロパティパネルのタブを自動的に開閉同期させるフック
 */
export const useTabSync = () => {
    // アイテムIDのリスト（変更時のみ検知するためshallow比較を使用）
    const itemIds = usePageStore(
        (state) => Object.values(state.pages).flatMap(p => p.placedItems.map(i => i.id)),
        shallow
    );

    // ノードIDのリスト（変更時のみ検知するためshallow比較を使用）
    const nodeIds = usePageStore(
        (state) => Object.values(state.pages).flatMap(p =>
            Object.values(p.allItemLogics).flatMap(g => g.nodes.map(n => n.id))
        ),
        shallow
    );

    const { tabs, handleTabClose, selectItem } = useSelectionStore(
        (state) => ({
            tabs: state.tabs,
            handleTabClose: state.handleTabClose,
            selectItem: state.selectItem
        }),
        shallow
    );

    // 前回のIDセットを保持して差分検知（厳密には今回レンダリング時の比較用）
    const prevItemIdsRef = useRef<Set<string>>(new Set());
    const prevNodeIdsRef = useRef<Set<string>>(new Set());

    // 自動的に閉じたタブの履歴（復元用）
    // 削除によって閉じたタブの情報を一時保存しておく
    const closedTabsHistoryRef = useRef<SelectionEntry[]>([]);

    useEffect(() => {
        const currentItemIds = new Set(itemIds);
        const currentNodeIds = new Set(nodeIds);

        // --- 1. 削除検知: 存在しなくなったタブを閉じる ---
        tabs.forEach(tab => {
            const exists = tab.type === 'item'
                ? currentItemIds.has(tab.id)
                : currentNodeIds.has(tab.id);

            if (!exists) {
                // アイテム/ノード削除によりタブを閉じる
                handleTabClose(tab.id);

                // 履歴に保存（復活時に使うため）
                // 既に履歴にある場合は最新を優先して重複排除
                closedTabsHistoryRef.current = [
                    tab,
                    ...closedTabsHistoryRef.current.filter(t => t.id !== tab.id)
                ].slice(0, 50); // 履歴サイズ制限
            }
        });

        // --- 2. 復活検知: 履歴にあるタブが復活したら再度開く ---

        // 前回無くて今回あるID（＝追加または復活したID）
        const addedItemIds = itemIds.filter(id => !prevItemIdsRef.current.has(id));
        const addedNodeIds = nodeIds.filter(id => !prevNodeIdsRef.current.has(id));

        const restoreTabs = (ids: string[], type: 'item' | 'node') => {
            ids.forEach(id => {
                // 履歴から検索（型も一致するもの）
                const historyIndex = closedTabsHistoryRef.current.findIndex(t => t.id === id && t.type === type);

                if (historyIndex !== -1) {
                    const tabToRestore = closedTabsHistoryRef.current[historyIndex];

                    // タブを復元（selectItemはタブが無い場合追加し、アクティブにする）
                    // ※Undo直後にそのアイテムを選択状態にするのが自然な挙動
                    selectItem(id, type, tabToRestore.label);

                    // 復元したので履歴から削除
                    closedTabsHistoryRef.current.splice(historyIndex, 1);
                }
            });
        };

        if (addedItemIds.length > 0) restoreTabs(addedItemIds, 'item');
        if (addedNodeIds.length > 0) restoreTabs(addedNodeIds, 'node');

        // 参照更新
        prevItemIdsRef.current = currentItemIds;
        prevNodeIdsRef.current = currentNodeIds;

    }, [itemIds, nodeIds, tabs, handleTabClose, selectItem]);
};
