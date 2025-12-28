import React, { useState, useEffect } from "react";
import { usePageStore } from "../../stores/usePageStore";
import { AccordionSection } from "./SharedComponents";
import ImageCropModal from "../ImageCropModal";
import type { Crop } from 'react-image-crop';


interface PagePropertiesEditorProps {
    pageId: string;
}

export const PagePropertiesEditor: React.FC<PagePropertiesEditorProps> = ({ pageId }) => {
    const { page, updatePage, updatePageName } = usePageStore(state => ({
        page: state.pages[pageId],
        updatePage: state.updatePage,
        updatePageName: state.updatePageName,
    }));

    const [name, setName] = useState(page?.name || "");
    const [isUploading, setIsUploading] = useState(false);
    const [isCropModalOpen, setIsCropModalOpen] = useState(false);

    useEffect(() => {
        setName(page?.name || "");
    }, [page?.name]);

    if (!page) return <div className="properties-panel-content">ページが見つかりません</div>;

    const handleNameBlur = () => {
        if (name !== page.name) {
            updatePageName(pageId, name);
        }
    };

    const handleBgColorChange = (color: string) => {
        updatePage(pageId, { backgroundColor: color });
    };

    // 背景画像アップロード処理
    const handleBackgroundImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
            alert("5MB以下の画像ファイルを選択してください");
            return;
        }

        setIsUploading(true);

        const readAsDataURL = (file: File): Promise<string> => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        };

        try {
            // ★修正: Supabaseアップロードを無効化し、常にBase64として保存
            const srcToUse = await readAsDataURL(file);

            // originalSrcも保存する（再編集用）
            updatePage(pageId, {
                backgroundImage: {
                    src: srcToUse,
                    originalSrc: srcToUse,
                    cropState: undefined
                }
            });
            setIsUploading(false);
        } catch (err: any) {
            alert("画像の読み込みに失敗しました: " + err.message);
            setIsUploading(false);
        } finally {
            e.target.value = "";
        }
    };

    // トリミング完了ハンドラ
    const handleCropComplete = async (croppedImageUrl: string, cropState: { crop: Crop, zoom: number }) => {
        try {
            // トリミング後の画像とcropStateを保存
            // originalSrcは維持（再編集用）
            updatePage(pageId, {
                backgroundImage: {
                    src: croppedImageUrl,
                    cropState: cropState,
                    originalSrc: page.backgroundImage?.originalSrc || page.backgroundImage?.src
                }
            });
            setIsCropModalOpen(false);
        } catch (error) {
            console.error('トリミング処理中にエラーが発生しました:', error);
            alert('背景画像のトリミング処理に失敗しました。');
        }
    };

    const handleBackgroundImageRemove = () => {
        updatePage(pageId, { backgroundImage: undefined });
    };


    return (
        <div className="properties-panel-content" style={{ padding: '16px' }}>
            <div className="prop-group" style={{ marginBottom: 20 }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#fff' }}>ページ設定</h3>
            </div>

            <AccordionSection title="基本情報" defaultOpen={true}>
                <div className="prop-group">
                    <div className="prop-label">ページ名</div>
                    <input
                        type="text"
                        className="prop-input"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onBlur={handleNameBlur}
                    />
                </div>
            </AccordionSection>

            <AccordionSection title="外観 (Appearance)" defaultOpen={true}>
                <div className="prop-group">
                    <div className="prop-label">背景色 (Background Color)</div>

                    {/* 透明チェックボックス */}
                    <label className="prop-checkbox-row" style={{ marginBottom: '8px' }}>
                        <input
                            type="checkbox"
                            checked={page.backgroundColor === 'transparent'}
                            onChange={(e) => {
                                if (e.target.checked) {
                                    handleBgColorChange('transparent');
                                } else {
                                    handleBgColorChange('#ffffff');
                                }
                            }}
                        />
                        <span>透明 (Transparent)</span>
                    </label>

                    {/* 色選択（透明でない場合のみ有効） */}
                    <div className="prop-color-picker-wrapper">
                        <input
                            type="color"
                            className="prop-color-picker"
                            value={page.backgroundColor === 'transparent' ? '#ffffff' : (page.backgroundColor || "#ffffff")}
                            onChange={(e) => handleBgColorChange(e.target.value)}
                            disabled={page.backgroundColor === 'transparent'}
                            style={{ opacity: page.backgroundColor === 'transparent' ? 0.5 : 1 }}
                        />
                        <input
                            type="text"
                            className="prop-input"
                            style={{ flexGrow: 1 }}
                            value={page.backgroundColor === 'transparent' ? 'transparent' : (page.backgroundColor || "")}
                            placeholder="#ffffff"
                            onChange={(e) => handleBgColorChange(e.target.value)}
                            disabled={page.backgroundColor === 'transparent'}
                        />
                    </div>
                </div>

                {/* 背景画像設定 */}
                <div className="prop-group" style={{ marginTop: 16 }}>
                    <div className="prop-label">背景画像 (Background Image)</div>
                    <label className="prop-button" style={{ opacity: isUploading ? 0.6 : 1, cursor: isUploading ? 'not-allowed' : 'pointer' }}>
                        {isUploading ? "アップロード中..." : "画像を選択 / アップロード"}
                        <input type="file" style={{ display: "none" }} accept="image/*" onChange={handleBackgroundImageUpload} disabled={isUploading} />
                    </label>
                    {page.backgroundImage?.src && (
                        <div style={{ marginTop: '12px' }}>
                            <img src={page.backgroundImage.src} alt="Background Preview" className="prop-image-preview" />

                            {/* 表示モード選択 */}
                            <div className="prop-group" style={{ marginTop: '12px' }}>
                                <div className="prop-label">表示モード (Display Mode)</div>
                                <select
                                    className="prop-select"
                                    value={page.backgroundImage?.displayMode || 'cover'}
                                    onChange={(e) => {
                                        if (page.backgroundImage?.src) {
                                            updatePage(pageId, {
                                                backgroundImage: {
                                                    src: page.backgroundImage.src,
                                                    cropState: page.backgroundImage.cropState,
                                                    originalSrc: page.backgroundImage.originalSrc,
                                                    displayMode: e.target.value as 'cover' | 'contain' | 'stretch' | 'tile' | 'custom',
                                                    position: page.backgroundImage.position,
                                                    scale: page.backgroundImage.scale
                                                }
                                            });
                                        }
                                    }}
                                >
                                    <option value="cover">埋め込み (Cover)</option>
                                    <option value="contain">全体を表示 (Contain)</option>
                                    <option value="stretch">引き伸ばし (Stretch)</option>
                                    <option value="tile">繰り返し (Tile)</option>
                                    <option value="custom">自由 (Custom)</option>
                                </select>
                            </div>

                            {/* サイズ調整スライダー */}
                            <div className="prop-group" style={{ marginTop: '12px' }}>
                                <div className="prop-label">サイズ (Scale)</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <input
                                        type="range"
                                        min="1"
                                        max="200"
                                        value={(page.backgroundImage?.scale || 1) * 100}
                                        disabled={!page.backgroundImage?.displayMode || ['cover', 'contain', 'stretch'].includes(page.backgroundImage.displayMode)}
                                        onChange={(e) => {
                                            if (page.backgroundImage?.src) {
                                                updatePage(pageId, {
                                                    backgroundImage: {
                                                        src: page.backgroundImage.src,
                                                        cropState: page.backgroundImage.cropState,
                                                        originalSrc: page.backgroundImage.originalSrc,
                                                        displayMode: page.backgroundImage.displayMode,
                                                        position: page.backgroundImage.position,
                                                        scale: parseInt(e.target.value) / 100
                                                    }
                                                });
                                            }
                                        }}
                                        style={{
                                            flex: 1,
                                            cursor: (!page.backgroundImage?.displayMode || ['cover', 'contain', 'stretch'].includes(page.backgroundImage.displayMode)) ? 'not-allowed' : 'pointer',
                                            opacity: (!page.backgroundImage?.displayMode || ['cover', 'contain', 'stretch'].includes(page.backgroundImage.displayMode)) ? 0.5 : 1
                                        }}
                                    />
                                    <span style={{ minWidth: '50px', textAlign: 'right', fontSize: '14px', color: '#ccc' }}>
                                        {Math.round((page.backgroundImage?.scale || 1) * 100)}%
                                    </span>
                                </div>
                                {(!page.backgroundImage?.displayMode || ['cover', 'contain', 'stretch'].includes(page.backgroundImage.displayMode)) && (
                                    <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>
                                        ※ Tile / Custom モードで調整可能
                                    </div>
                                )}
                            </div>

                            {/* 位置選択 */}
                            <div className="prop-group" style={{ marginTop: '12px' }}>
                                <div className="prop-label">位置 (Position)</div>
                                <select
                                    className="prop-select"
                                    value={page.backgroundImage?.position || 'center center'}
                                    onChange={(e) => {
                                        if (page.backgroundImage?.src) {
                                            updatePage(pageId, {
                                                backgroundImage: {
                                                    src: page.backgroundImage.src,
                                                    cropState: page.backgroundImage.cropState,
                                                    originalSrc: page.backgroundImage.originalSrc,
                                                    displayMode: page.backgroundImage.displayMode,
                                                    position: e.target.value,
                                                    scale: page.backgroundImage.scale
                                                }
                                            });
                                        }
                                    }}
                                >
                                    <option value="center center">中央 (Center)</option>
                                    <option value="top left">左上 (Top Left)</option>
                                    <option value="top center">上 (Top Center)</option>
                                    <option value="top right">右上 (Top Right)</option>
                                    <option value="center left">左 (Left)</option>
                                    <option value="center right">右 (Right)</option>
                                    <option value="bottom left">左下 (Bottom Left)</option>
                                    <option value="bottom center">下 (Bottom Center)</option>
                                    <option value="bottom right">右下 (Bottom Right)</option>
                                </select>
                            </div>

                            {/* トリミングボタン */}
                            <button
                                className="prop-button"
                                onClick={() => setIsCropModalOpen(true)}
                                style={{ marginTop: '8px' }}
                            >
                                ✂️ 背景をトリミング
                            </button>

                            <button className="prop-button-danger" onClick={handleBackgroundImageRemove} style={{ marginTop: '8px' }}>背景画像を削除</button>
                        </div>
                    )}
                </div>
            </AccordionSection>



            {/* 画像トリミングモーダル */}
            {page.backgroundImage?.src && (
                <ImageCropModal
                    isOpen={isCropModalOpen}
                    imageSrc={page.backgroundImage?.originalSrc || page.backgroundImage?.src}
                    initialCrop={page.backgroundImage?.cropState?.crop}
                    initialZoom={page.backgroundImage?.cropState?.zoom}
                    onComplete={handleCropComplete}
                    onCancel={() => setIsCropModalOpen(false)}
                />
            )}
        </div>
    );
};
