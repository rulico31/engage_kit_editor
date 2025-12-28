import React from "react";
import { usePreviewStore } from "../stores/usePreviewStore";
import { usePageStore } from "../stores/usePageStore";
import { logAnalyticsEvent } from "../lib/analytics";
import { submitLeadData } from "../lib/leads";
import { onConfirmationResult } from "../logicEngine";
import { X } from "lucide-react";
import "./ConfirmationModal.css";

const findNextNodes = (srcId: string, handle: string | null, edges: any[]): string[] => {
    return edges
        .filter(e => e.source === srcId && (handle === null || e.sourceHandle === handle))
        .map(e => e.target);
};

const ConfirmationModal: React.FC = () => {
    const previewState = usePreviewStore(state => state.previewState);
    const confirmationModal = previewState?.confirmationModal;
    const pages = usePageStore(state => state.pages);
    const pageOrder = usePageStore(state => state.pageOrder);

    if (!confirmationModal || !confirmationModal.isOpen) {
        return null;
    }

    const { nodeId, variables, headerText, noticeText, targetItemIds } = confirmationModal;
    const currentPageGraph = usePageStore.getState().pages[usePageStore.getState().selectedPageId!]?.allItemLogics || {};

    // 全ページのアイテムを取得
    const allPlacedItems = pageOrder.flatMap((pageId) => {
        const page = pages[pageId];
        return page?.placedItems.map(item => ({
            ...item,
            pageName: page.name
        })) || [];
    });

    // グラフの取得
    const placedItems = allPlacedItems;
    const pageGraph = Object.values(currentPageGraph).find(g => g.nodes.some(n => n.id === nodeId));

    if (!pageGraph) {
        console.error('Could not find graph for confirmation node', nodeId);
        return null;
    }

    const currentPageGraph2 = pageGraph;

    // 表示するアイテムのリストを作成
    const displayItems = targetItemIds && targetItemIds.length > 0
        ? targetItemIds.map(id => {
            const item = allPlacedItems.find(p => p.id === id);

            // デバッグログ: アイテム情報の確認
            if (item) {
                console.log('🧐 確認画面アイテム詳細:', {
                    id: item.id,
                    displayName: item.displayName,
                    variableName: item.data?.variableName,
                    name: item.name,
                    finalLabel: item.displayName || item.data.variableName || item.name
                });
            }

            if (!item) return null;

            // 変数名が未設定の場合はIDをキーとして使用
            const varName = item.data.variableName || item.id;

            // BOX-で始まる名前はユーザーにとって無意味なので、より分かりやすい情報を探す
            const safeName = item.name.startsWith('BOX-') ? (item.data.inputType || '入力項目') : item.name;

            return {
                // ラベル: カスタム名 > 変数名 > プレースホルダー > アイテム名 > 変数ID の順
                label: item.displayName || item.data.variableName || item.data.placeholder || safeName || varName,
                value: variables[varName],
                pageName: item.pageName
            };
        }).filter(Boolean)
        : Object.entries(variables).map(([key, value]) => {
            // keyがアイテムIDの可能性があるので、アイテムを探す
            // 変数名がkeyと一致する、またはIDがkeyと一致するアイテムを探す
            const item = allPlacedItems.find(p => p.id === key || p.data.variableName === key);

            let label = key;
            if (item) {
                // BOX-で始まる名前はユーザーにとって無意味なので、より分かりやすい情報を探す
                const safeName = item.name.startsWith('BOX-') ? (item.data.inputType || '入力項目') : item.name;
                label = item.displayName || item.data.variableName || item.data.placeholder || safeName || key;
            }

            return {
                label,
                value,
                pageName: undefined // 型の一貫性のため追加
            };
        }); // 旧互換: 全変数表示

    const handleChoice = (result: 'back' | 'confirm') => {
        // モーダルを閉じる
        usePreviewStore.getState().setPreviewState((prev) => ({
            ...prev,
            confirmationModal: {
                ...prev.confirmationModal!,
                isOpen: false
            }
        }));

        // ログを記録
        logAnalyticsEvent('logic_branch', {
            nodeId,
            nodeType: 'confirmationNode',
            metadata: {
                result,
                action: result === 'confirm' ? 'confirmed' : 'back'
            }
        });

        // submitNodeからの確認の場合 (後方互換または将来の拡張用)
        if (result === 'confirm' && confirmationModal?.isSubmitConfirmation) {
            // ...既存のsubmit処理 (省略せず残すか、削除するか。今回は残しておくが簡略化)
            submitLeadData(variables).then((success) => {
                if (success) {
                    const { edges } = currentPageGraph2;
                    const nextNodeIds = findNextNodes(nodeId, "success", edges);
                    // ...遷移処理
                    if (nextNodeIds.length > 0) {
                        const { nodes } = currentPageGraph2;
                        nextNodeIds.forEach(nextId => {
                            const nextNode = nodes.find(n => n.id === nextId);
                            if (nextNode?.type === 'pageNode' && nextNode.data.targetPageId) {
                                usePreviewStore.getState().handlePageChangeRequest(nextNode.data.targetPageId);
                            }
                        });
                    }
                }
            });
            return;
        }

        // 通常のノード遷移処理 (ConfirmationNode)
        if (result === 'confirm' || result === 'back') {
            // onConfirmationResultを使用して次のノードを実行
            onConfirmationResult(
                nodeId,
                result,
                currentPageGraph2,
                placedItems,
                () => usePreviewStore.getState().previewState,
                usePreviewStore.getState().setPreviewState,
                (pageId: string) => usePreviewStore.getState().handlePageChangeRequest(pageId),
                () => usePreviewStore.getState().variables,
                usePreviewStore.getState().setVariables,
                usePreviewStore.getState().activeListeners,
                {
                    logEvent: logAnalyticsEvent,
                    submitLead: submitLeadData,
                    fetchApi: async (url: string, options: RequestInit) => {
                        const response = await fetch(url, options);
                        if (!response.ok) {
                            throw new Error(`API Error: ${response.status} ${response.statusText}`);
                        }
                        const contentType = response.headers.get('content-type');
                        if (contentType && contentType.includes('application/json')) {
                            return response.json();
                        } else {
                            return response.text();
                        }
                    }
                }
            );
        }
    };

    const handleBack = () => handleChoice('back');
    const handleConfirm = () => handleChoice('confirm');

    return (
        <div className="confirmation-modal-overlay">
            <div className="confirmation-modal">
                <div className="confirmation-modal-header">
                    <h2>{headerText}</h2>
                    <button className="confirmation-modal-close" onClick={handleBack} title="閉じる">
                        <X size={20} />
                    </button>
                </div>

                <div className="confirmation-modal-body">
                    {noticeText && <p className="confirmation-notice">{noticeText}</p>}

                    <div className="confirmation-variables">
                        {displayItems.map((item, index) => (
                            <div key={index} className="confirmation-variable-row">
                                <span className="variable-label">
                                    {item?.label}
                                    {item?.pageName && (
                                        <span style={{ marginLeft: '8px', color: '#888', fontSize: '11px' }}>
                                            ({item.pageName})
                                        </span>
                                    )}:
                                </span>
                                <span className="variable-value">{String(item?.value || '')}</span>
                            </div>
                        ))}
                    </div>

                    {displayItems.length === 0 && (
                        <div className="confirmation-empty">
                            確認項目がありません
                        </div>
                    )}
                </div>

                <div className="confirmation-modal-footer">
                    <button className="confirmation-btn back" onClick={handleBack}>
                        ← 戻る
                    </button>
                    <button className="confirmation-btn confirm" onClick={handleConfirm}>
                        OK →
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
