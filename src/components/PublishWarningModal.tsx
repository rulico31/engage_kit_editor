import React from 'react';
import type { ValidationResult } from '../lib/ValidationService';
import './PublishWarningModal.css';

// ノードタイプの日本語マッピング
const NODE_TYPE_NAMES: Record<string, string> = {
    'eventNode': 'イベント',
    'actionNode': 'アクション',
    'pageNode': 'ページ遷移',
    'ifNode': '条件分岐',
    'setVariableNode': '変数操作',
    'animateNode': 'アニメーション',
    'externalApiNode': 'API連携',
    'waitForClickNode': 'クリック待機',
    'delayNode': '遅延',
    'logNode': 'ログ出力',
};

interface ProjectDataForModal {
    pages: Record<string, any>;
}

interface PublishWarningModalProps {
    validationResult: ValidationResult;
    projectData: ProjectDataForModal;
    onClose: () => void;
    onProceed: () => void;
}

export const PublishWarningModal: React.FC<PublishWarningModalProps> = ({
    validationResult,
    projectData,
    onClose,
    onProceed
}) => {
    const { warnings } = validationResult;

    // ページIDからページ名を解決するヘルパー関数
    const getPageName = (pageId: string): string => {
        const page = projectData.pages[pageId];
        return page?.name || pageId;
    };

    // アイテムIDからアイテム名を解決するヘルパー関数
    const getItemName = (itemId: string): string => {
        // 全ページからアイテムを検索
        for (const page of Object.values(projectData.pages)) {
            const item = page.placedItems.find((i: any) => i.id === itemId);
            if (item) {
                // customName > name > id の優先順位
                return item.data?.customName || item.name || itemId;
            }
        }
        return itemId;
    };

    // ノードIDからノード種類名を解決するヘルパー関数
    const getNodeTypeName = (nodeId: string): string => {
        // 全ページの全アイテムのロジックからノードを検索
        for (const page of Object.values(projectData.pages)) {
            const allItemLogics = page.allItemLogics || {};
            for (const logic of Object.values(allItemLogics)) {
                const node = (logic as any)?.nodes?.find((n: any) => n.id === nodeId);
                if (node) {
                    // ノードタイプを日本語に変換
                    return NODE_TYPE_NAMES[node.type] || node.type || 'ノード';
                }
            }
        }
        // 見つからない場合はIDをそのまま返す
        return nodeId;
    };

    return (
        <div className="publish-warning-overlay" onClick={onClose}>
            <div className="publish-warning-modal" onClick={(e) => e.stopPropagation()}>
                <div className="publish-warning-header">
                    <h2>⚠️ 公開前の確認</h2>
                    <button className="publish-warning-close-button" onClick={onClose}>×</button>
                </div>

                <div className="publish-warning-body">
                    <p className="publish-warning-intro">
                        以下の警告が検出されました。問題を確認して、修正するか無視して公開するかを選択してください。
                    </p>

                    <div className="publish-warning-list-container">
                        <h3 className="publish-warning-section-title">警告 ({warnings.length}件)</h3>
                        <ul className="publish-warning-list">
                            {warnings.map((warning, idx) => (
                                <li key={idx} className="publish-warning-item">
                                    <div className="publish-warning-item-icon">⚠️</div>
                                    <div className="publish-warning-item-content">
                                        <strong className="publish-warning-item-message">{warning.message}</strong>
                                        <div className="publish-warning-item-meta">
                                            {warning.pageId && <span className="publish-warning-meta-badge">ページ: {getPageName(warning.pageId)}</span>}
                                            {warning.itemId && <span className="publish-warning-meta-badge">アイテム: {getItemName(warning.itemId)}</span>}
                                            {warning.nodeId && <span className="publish-warning-meta-badge">ノード種類: {getNodeTypeName(warning.nodeId)}</span>}
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="publish-warning-footer">
                    <button className="publish-warning-button publish-warning-button-secondary" onClick={onClose}>
                        修正する
                    </button>
                    <button className="publish-warning-button publish-warning-button-primary" onClick={onProceed}>
                        無視して公開
                    </button>
                </div>
            </div>
        </div>
    );
};
