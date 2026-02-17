import React, { useState } from 'react';
import { useProjectStore } from '../../stores/useProjectStore';
import { supabase } from '../../lib/supabaseClient';
import type { ProjectData, PlacedItemType } from '../../types';
import { X, Loader2, Link, Check, ExternalLink, Plus, Trash2 } from 'lucide-react';
import './BatchCreateModal.css';

interface BatchCreateModalProps {
    isOpen: boolean;
    onClose: () => void;
    templateProjectId?: string; // ベースにするテンプレートID（オプション）
}

export const BatchCreateModal: React.FC<BatchCreateModalProps> = ({ isOpen, onClose, templateProjectId }) => {
    const [projectName, setProjectName] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [resultUrl, setResultUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [categories, setCategories] = useState<string[]>([
        '設定 1'
    ]);

    // 各職種（カテゴリ）ごとの設定
    const [categorySettings, setCategorySettings] = useState<{
        itemId: string;
        text: string;
        url: string;
        color: string;
    }[]>(categories.map(cat => ({
        itemId: '',
        text: cat + 'の求人を見る',
        url: '',
        color: '#ffffff'
    })));

    // テンプレート内の利用可能なボタンアイテム
    const [availableItems, setAvailableItems] = useState<{ id: string; name: string; pageName: string; text: string; color: string }[]>([]);

    const duplicateProject = useProjectStore(state => state.duplicateProject);

    // 初期化時にアイテムをスキャン
    React.useEffect(() => {
        const scanItems = async () => {
            if (!isOpen) return;

            const baseId = templateProjectId || useProjectStore.getState().currentProjectId;
            if (!baseId) return;

            try {
                // 確実に最新のデータを取得
                const { data: project, error: fetchError } = await supabase
                    .from('projects')
                    .select('data')
                    .eq('id', baseId)
                    .single();

                if (fetchError || !project) throw new Error('テンプレートデータの取得に失敗しました');
                const projectData = project.data as ProjectData;

                const items: { id: string; name: string; pageName: string; text: string; color: string }[] = [];
                Object.keys(projectData.pages).forEach(pageId => {
                    const page = projectData.pages[pageId];
                    page.placedItems.forEach((item: PlacedItemType) => {
                        if (item.type === 'button') {
                            items.push({
                                id: item.id,
                                name: item.data.text || '無題ボタン',
                                pageName: page.name,
                                text: item.data.text || '',
                                color: item.data.backgroundColor || '#ffffff'
                            });
                        }
                    });
                });
                setAvailableItems(items);

                // 初期設定の構築（バリエーション数に合わせて初期化）
                const initialSettings = categories.map((cat, idx) => {
                    const matchedItem = items[idx] || null;
                    return {
                        itemId: matchedItem ? matchedItem.id : '',
                        text: matchedItem ? matchedItem.text : `項目を表示する`,
                        url: '',
                        color: matchedItem ? matchedItem.color : '#ffffff'
                    };
                });
                setCategorySettings(initialSettings);

            } catch (err: any) {
                console.error(err);
                setError(err.message);
            }
        };

        scanItems();
    }, [isOpen, templateProjectId]);

    if (!isOpen) return null;

    const handleCreate = async () => {
        if (!projectName) {
            setError('プロジェクト名を入力してください');
            return;
        }
        if (categorySettings.some(s => !s.url || !s.itemId)) {
            setError('すべての職種に対してボタンの選択とURLの入力を行ってください');
            return;
        }

        setIsProcessing(true);
        setError(null);

        try {
            // 1. テンプレートの複製
            const baseId = templateProjectId || useProjectStore.getState().currentProjectId;
            if (!baseId) throw new Error('ベースとなるプロジェクトが見つかりません');

            const newProjectId = await duplicateProject(baseId);
            if (!newProjectId) throw new Error('プロジェクトの複製に失敗しました');

            // 2. 複製されたプロジェクトのデータを直接更新
            const { data: project, error: fetchError } = await supabase
                .from('projects')
                .select('data')
                .eq('id', newProjectId)
                .single();

            if (fetchError || !project) throw new Error('複製データの取得に失敗しました');

            const projectData = project.data as ProjectData;

            // 3. 選択されたボタンの属性を置換
            categorySettings.forEach(setting => {
                Object.keys(projectData.pages).forEach(pageId => {
                    const page = projectData.pages[pageId];
                    const targetItem = page.placedItems.find((item: PlacedItemType) => item.id === setting.itemId);
                    if (targetItem) {
                        targetItem.data.linkUrl = setting.url;
                        targetItem.data.text = setting.text;
                        targetItem.data.backgroundColor = setting.color;
                    }
                });
            });

            // プロジェクト名を更新
            projectData.projectName = projectName;

            // 4. 保存
            const { error: updateError } = await supabase
                .from('projects')
                .update({ name: projectName, data: projectData })
                .eq('id', newProjectId);

            if (updateError) throw new Error('データの保存に失敗しました');

            // 5. 公開
            const projectStore = useProjectStore.getState();
            await projectStore.loadProject(newProjectId);
            const publishResult = await projectStore.publishProject(true);

            if (!publishResult) throw new Error('公開処理に失敗しました');

            const publicUrl = `${window.location.origin}/viewer.html?project_id=${newProjectId}`;
            setResultUrl(publicUrl);

        } catch (err: any) {
            console.error(err);
            setError(err.message || '予期せぬエラーが発生しました');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="batch-modal-overlay">
            <div className="batch-modal-content">
                <div className="batch-modal-header">
                    <h2>
                        <Link style={{ color: '#3b82f6' }} size={20} />
                        プロジェクト一括作成
                    </h2>
                    <button onClick={onClose} className="close-btn">
                        <X size={20} />
                    </button>
                </div>

                <div className="batch-modal-body">
                    {!resultUrl ? (
                        <>
                            <div className="form-field">
                                <label className="form-label">新プロジェクト名</label>
                                <input
                                    type="text"
                                    value={projectName}
                                    onChange={(e) => setProjectName(e.target.value)}
                                    placeholder="例：Engage-kit 2"
                                    className="form-input"
                                />
                            </div>

                            <div className="form-field">
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <label className="form-label" style={{ marginBottom: 0 }}>バリエーション別詳細設定</label>
                                    <button
                                        onClick={() => {
                                            const newCatName = `新規設定 ${categories.length + 1}`;
                                            setCategories([...categories, newCatName]);
                                            setCategorySettings([...categorySettings, {
                                                itemId: '',
                                                text: `項目を表示する`,
                                                url: '',
                                                color: '#ffffff'
                                            }]);
                                        }}
                                        className="add-category-btn"
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            fontSize: '12px',
                                            color: '#3b82f6',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            fontWeight: 600
                                        }}
                                    >
                                        <Plus size={14} />
                                        設定を追加
                                    </button>
                                </div>
                                <div className="category-settings-list" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    {categorySettings.length > 0 ? categories.map((cat, idx) => {
                                        const setting = categorySettings[idx];
                                        if (!setting) return null;

                                        return (
                                            <div key={idx} className="category-card" style={{ padding: '16px', backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '12px', position: 'relative' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                                    <span
                                                        className="category-label"
                                                        style={{
                                                            marginTop: 0,
                                                            marginBottom: 0,
                                                            color: '#3b82f6',
                                                            fontSize: '14px',
                                                            fontWeight: 600,
                                                            flex: 1
                                                        }}
                                                    >
                                                        {cat}
                                                    </span>
                                                    {categories.length > 1 && (
                                                        <button
                                                            onClick={() => {
                                                                const newCats = categories.filter((_, i) => i !== idx);
                                                                const newSettings = categorySettings.filter((_, i) => i !== idx);
                                                                setCategories(newCats);
                                                                setCategorySettings(newSettings);
                                                            }}
                                                            style={{
                                                                background: 'none',
                                                                border: 'none',
                                                                color: '#f87171',
                                                                cursor: 'pointer',
                                                                padding: '4px'
                                                            }}
                                                            title="設定を削除"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>

                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                    <div>
                                                        <label className="form-label" style={{ fontSize: '11px' }}>対応するボタンを選択</label>
                                                        <select
                                                            className="form-input"
                                                            value={setting.itemId}
                                                            onChange={(e) => {
                                                                const newSettings = [...categorySettings];
                                                                const selectedId = e.target.value;
                                                                newSettings[idx].itemId = selectedId;

                                                                // 選択されたボタンの現在の値を反映
                                                                const selectedItem = availableItems.find(item => item.id === selectedId);
                                                                if (selectedItem) {
                                                                    newSettings[idx].text = selectedItem.text;
                                                                    newSettings[idx].color = selectedItem.color;
                                                                }

                                                                setCategorySettings(newSettings);
                                                            }}
                                                        >
                                                            <option value="">-- ボタンを選択してください --</option>
                                                            {availableItems.map(item => (
                                                                <option key={item.id} value={item.id}>
                                                                    [{item.pageName}] {item.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <div style={{ flex: 1 }}>
                                                            <label className="form-label" style={{ fontSize: '11px' }}>ボタン文面</label>
                                                            <input
                                                                type="text"
                                                                value={setting.text}
                                                                onChange={(e) => {
                                                                    const newSettings = [...categorySettings];
                                                                    newSettings[idx].text = e.target.value;
                                                                    setCategorySettings(newSettings);
                                                                }}
                                                                className="form-input"
                                                            />
                                                        </div>
                                                        <div style={{ width: '80px' }}>
                                                            <label className="form-label" style={{ fontSize: '11px' }}>ボタン色</label>
                                                            <input
                                                                type="color"
                                                                value={setting.color}
                                                                onChange={(e) => {
                                                                    const newSettings = [...categorySettings];
                                                                    newSettings[idx].color = e.target.value;
                                                                    setCategorySettings(newSettings);
                                                                }}
                                                                style={{ height: '38px', padding: '2px' }}
                                                                className="form-input"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label className="form-label" style={{ fontSize: '11px' }}>遷移先URL</label>
                                                        <input
                                                            type="url"
                                                            value={setting.url}
                                                            onChange={(e) => {
                                                                const newSettings = [...categorySettings];
                                                                newSettings[idx].url = e.target.value;
                                                                setCategorySettings(newSettings);
                                                            }}
                                                            placeholder="https://..."
                                                            className="form-input"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }) : (
                                        <div style={{ textAlign: 'center', padding: '20px' }}>
                                            <Loader2 style={{ animation: 'spin 1s linear infinite' }} size={24} />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {error && (
                                <div className="error-banner">
                                    {error}
                                </div>
                            )}

                            <button
                                onClick={handleCreate}
                                disabled={isProcessing}
                                className="submit-btn"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 style={{ animation: 'spin 1s linear infinite' }} size={20} />
                                        生成・公開中...
                                    </>
                                ) : (
                                    '一括生成して公開する'
                                )}
                            </button>
                        </>
                    ) : (
                        <div className="success-screen">
                            <div className="success-icon-wrapper">
                                <Check size={32} />
                            </div>
                            <h3 className="success-title">プロジェクトの公開が完了しました！</h3>
                            <p className="success-desc">以下のURLをコピーして営業メールに利用してください。</p>

                            <div className="result-url-box">
                                <input
                                    type="text"
                                    readOnly
                                    value={resultUrl}
                                    className="result-url-input"
                                />
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(resultUrl);
                                        alert('コピーしました');
                                    }}
                                    className="copy-button"
                                >
                                    コピー
                                </button>
                            </div>

                            <div className="action-row">
                                <button
                                    onClick={() => setResultUrl(null)}
                                    className="secondary-action-btn"
                                >
                                    続けて作成
                                </button>
                                <a
                                    href={resultUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="primary-action-link"
                                >
                                    確認する
                                    <ExternalLink size={16} />
                                </a>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}} />
        </div>
    );
};
