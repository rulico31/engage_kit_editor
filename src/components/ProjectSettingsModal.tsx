import React, { useState } from 'react';
import { useProjectStore } from '../stores/useProjectStore';

import type { ValidationResult } from '../lib/ValidationService';
import './ProjectSettingsModal.css';
import { PublishWarningModal } from "./PublishWarningModal";

interface ProjectSettingsModalProps {
    onClose: () => void;
}

const IconCopy = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
);

const IconCheck = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

export const ProjectSettingsModal: React.FC<ProjectSettingsModalProps> = ({ onClose }) => {
    const { currentProjectId, projectMeta, publishProject, unpublishProject, updateProjectName, saveProject } = useProjectStore();
    const [projectName, setProjectName] = useState(projectMeta?.name || '');
    const [isPublishing, setIsPublishing] = useState(false);
    const [copied, setCopied] = useState(false);
    const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
    const [showWarningModal, setShowWarningModal] = useState(false);



    // 公開URLの生成
    const publicUrl = currentProjectId
        ? `${window.location.origin} /view/${currentProjectId} `
        : '';

    const handleCopyUrl = async () => {
        if (publicUrl) {
            await navigator.clipboard.writeText(publicUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleSaveName = () => {
        if (projectName.trim() && projectName !== projectMeta?.name) {
            updateProjectName(projectName.trim());
            alert('プロジェクト名を更新しました');
        }
    };

    // 設定のみ保存
    const handleSaveSettings = async () => {
        setIsPublishing(true); // ローディング表示
        try {
            // プロジェクト名更新（変更があれば）
            if (projectName.trim() && projectName !== projectMeta?.name) {
                updateProjectName(projectName.trim());
            }

            // ストア保存（永続化）
            await saveProject();

            // alert('設定を保存しました'); // トーストが出るのでアラートは不要かもだが、明示的に
            alert('設定を保存しました');
        } catch (e) {
            console.error(e);
            alert('保存に失敗しました');
        } finally {
            setIsPublishing(false);
        }
    };

    const handlePublish = async () => {
        setIsPublishing(true);
        setValidationResult(null); // リセット
        setShowWarningModal(false); // リセット

        try {
            // 公開前に最新の設定を保存・適用
            if (projectName.trim() && projectName !== projectMeta?.name) {
                updateProjectName(projectName.trim());
            }
            // saveProjectはpublishProject内でも呼ばれる可能性があるが、念のため
            await saveProject();

            const result = await publishProject();

            // 検証結果が返された場合（警告あり）
            if (typeof result === 'object' && 'isValid' in result) {
                setValidationResult(result);
                // 警告がある場合はモーダルを表示
                if (result.warnings && result.warnings.length > 0) {
                    setShowWarningModal(true);
                } else {
                    // 警告がない場合は通常通り公開完了
                    alert('プロジェクトを公開しました');
                }
            } else if (result === true) {
                alert('プロジェクトを公開しました');
                setValidationResult(null);
            } else {
                alert('公開に失敗しました');
            }
        } catch (e) {
            console.error(e);
            alert('公開中にエラーが発生しました');
        } finally {
            setIsPublishing(false);
        }
    };

    // 警告を無視して強制的に公開
    const handleForcePublish = async () => {
        setIsPublishing(true);
        setShowWarningModal(false);

        try {
            // forceフラグを有効にして公開
            const result = await publishProject(true);

            if (result === true) {
                alert('プロジェクトを公開しました');
                setValidationResult(null);
            } else {
                alert('公開に失敗しました');
            }
        } catch (e) {
            console.error(e);
            alert('公開中にエラーが発生しました');
        } finally {
            setIsPublishing(false);
        }
    };

    const handleUnpublish = async () => {
        if (!confirm('プロジェクトを非公開にしますか?\n\n公開URLは無効になりますが、再公開は可能です。')) {
            return;
        }

        setIsPublishing(true);
        try {
            const success = await unpublishProject();
            if (success) {
                alert('プロジェクトを非公開にしました');
            } else {
                alert('非公開化に失敗しました');
            }
        } catch (e) {
            console.error(e);
            alert('非公開化中にエラーが発生しました');
        } finally {
            setIsPublishing(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
                <div className="settings-modal-header">
                    <h2>プロジェクト設定</h2>
                    <button className="close-button" onClick={onClose}>×</button>
                </div>

                <div className="settings-modal-body">
                    {/* プロジェクト名 */}
                    <div className="settings-section">
                        <label className="settings-label">プロジェクト名</label>
                        <div className="settings-input-group">
                            <input
                                type="text"
                                className="settings-input"
                                value={projectName}
                                onChange={(e) => setProjectName(e.target.value)}
                                placeholder="プロジェクト名を入力"
                            />
                            <button
                                className="settings-button-secondary"
                                onClick={handleSaveName}
                                disabled={!projectName.trim() || projectName === projectMeta?.name}
                            >
                                保存
                            </button>
                        </div>
                    </div>

                    {/* 公開URL */}
                    <div className="settings-section">
                        <label className="settings-label">公開URL</label>
                        <div className="settings-url-group">
                            <input
                                type="text"
                                className="settings-input"
                                value={publicUrl}
                                readOnly
                                placeholder="プロジェクトID が必要です"
                            />
                            <button
                                className="settings-button-icon"
                                onClick={handleCopyUrl}
                                disabled={!publicUrl}
                                title="URLをコピー"
                            >
                                {copied ? <IconCheck /> : <IconCopy />}
                            </button>
                        </div>
                        {copied && <span className="copy-feedback">コピーしました</span>}
                    </div>

                    {/* 公開ステータス */}
                    <div className="settings-section">
                        <label className="settings-label">公開ステータス</label>
                        <div className="settings-status-row">
                            <span className={`status - badge ${projectMeta?.is_published ? 'published' : 'draft'} `}>
                                {projectMeta?.is_published ? '公開中' : '非公開'}
                            </span>
                            {!projectMeta?.is_published && (
                                <p className="settings-hint">
                                    「公開」ボタンを押すと、現在の下書きが公開されます。
                                </p>
                            )}
                            {projectMeta?.is_published && (
                                <button
                                    className="settings-button-secondary"
                                    onClick={handleUnpublish}
                                    disabled={isPublishing}
                                    style={{ marginTop: '8px' }}
                                >
                                    非公開にする
                                </button>
                            )}
                        </div>
                    </div>

                    {/* データ保持期間設定 - 削除 */}

                    {/* バリデーションエラー・警告表示 */}
                    {validationResult && (
                        <div className="validation-results">
                            {validationResult.errors.length > 0 && (
                                <div className="validation-section validation-errors">
                                    <h4 className="validation-title">❌ エラー ({validationResult.errors.length}件)</h4>
                                    <p className="validation-hint">以下のエラーを修正してから公開してください。</p>
                                    <ul className="validation-list">
                                        {validationResult.errors.map((issue, idx) => (
                                            <li key={idx} className="validation-item error">
                                                <strong>{issue.message}</strong>
                                                {issue.pageId && <span className="validation-meta">ページ: {issue.pageId}</span>}
                                                {issue.nodeId && <span className="validation-meta">ノード: {issue.nodeId}</span>}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {validationResult.warnings.length > 0 && (
                                <div className="validation-section validation-warnings">
                                    <h4 className="validation-title">⚠️ 警告 ({validationResult.warnings.length}件)</h4>
                                    <p className="validation-hint">以下の警告は公開をブロックしませんが、確認をお勧めします。</p>
                                    <ul className="validation-list">
                                        {validationResult.warnings.map((issue, idx) => (
                                            <li key={idx} className="validation-item warning">
                                                <strong>{issue.message}</strong>
                                                {issue.pageId && <span className="validation-meta">ページ: {issue.pageId}</span>}
                                                {issue.nodeId && <span className="validation-meta">ノード: {issue.nodeId}</span>}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="settings-modal-footer">
                    <button className="settings-button-secondary" onClick={onClose}>
                        閉じる
                    </button>
                    {/* 設定保存ボタン追加 */}
                    <button
                        className="settings-button-secondary"
                        onClick={handleSaveSettings}
                        disabled={isPublishing}
                        style={{ marginLeft: 'auto', marginRight: '8px' }}
                        title="公開せずに現在の設定を保存します"
                    >
                        {isPublishing ? '保存中...' : '設定を保存'}
                    </button>
                    <button
                        className="settings-button-primary"
                        onClick={handlePublish}
                        disabled={isPublishing}
                    >
                        {isPublishing ? '公開中...' : '公開'}
                    </button>
                </div>
            </div>

            {/* 警告モーダル */}
            {showWarningModal && validationResult && (
                <PublishWarningModal
                    validationResult={validationResult}
                    onClose={() => setShowWarningModal(false)}
                    onProceed={handleForcePublish}
                />
            )}
        </div>
    );
};
