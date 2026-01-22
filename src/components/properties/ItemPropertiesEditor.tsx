import React from "react";
import { useState } from "react";
import type { PlacedItemType } from "../../types";
import { AccordionSection } from "./SharedComponents";
import ImageCropModal from "../ImageCropModal";
import {
    Type,
    MousePointerClick,
    AlignLeft,
    List,
    Box,
    LayoutTemplate,

    Maximize,
    Move,

    ChartBar, // For B2B Score
    Layers
} from "lucide-react";

interface Props {
    item: PlacedItemType;
    onItemUpdate: (id: string, data: Partial<PlacedItemType["data"]> | Partial<PlacedItemType>, options?: { addToHistory?: boolean; immediate?: boolean }) => void;
    onItemMoveToFront?: (id: string) => void;
    onItemMoveToBack?: (id: string) => void;
    onItemMoveForward?: (id: string) => void;
    onItemMoveBackward?: (id: string) => void;
}

export const ItemPropertiesEditor: React.FC<Props> = ({ item, onItemUpdate }) => {
    const [isCropModalOpen, setIsCropModalOpen] = useState(false);

    // 共通の更新ハンドラ (data配下のプロパティ更新用)
    const handleDataChange = (key: string, value: any) => {
        onItemUpdate(item.id, {
            data: {
                ...item.data,
                [key]: value
            }
        }, { addToHistory: true });
    };

    // ルートレベルのプロパティ更新ハンドラ (x, y, width, height, etc.)
    const handleRootChange = (key: string, value: any) => {
        onItemUpdate(item.id, {
            [key]: value
        }, { addToHistory: true });
    };

    // ヘルパ: 安全な値の取得
    const getX = () => (item as any).x ?? (item as any).position?.x ?? 0;
    const getY = () => (item as any).y ?? (item as any).position?.y ?? 0;
    const getWidth = () => (item as any).width ?? (item as any).size?.width ?? 100;
    const getHeight = () => (item as any).height ?? (item as any).size?.height ?? 40;
    const getZIndex = () => (item as any).zIndex ?? 0;

    // アイコン取得
    const getTypeIcon = () => {
        switch (item.type) {
            case 'text': return <Type size={14} />;
            case 'button': return <MousePointerClick size={14} />;
            case 'input': return <AlignLeft size={14} />;
            case 'choice': return <List size={14} />;
            case 'box': return <Box size={14} />;
            default: return <LayoutTemplate size={14} />;
        }
    };



    return (
        <div className="properties-container">
            {/* Header */}
            {/* Header */}
            <div className="prop-group" style={{ padding: '16px 16px 0 16px', marginBottom: 20 }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#fff' }}>アイテム設定</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#aaa' }}>
                    <span style={{ display: 'flex' }}>{getTypeIcon()}</span>
                    <span>{item.type.toUpperCase()} - {item.id.slice(0, 6)}</span>
                </div>
            </div>

            {/* General Settings */}
            <AccordionSection title="基本設定 (General)" defaultOpen={true}>
                <div className="prop-group">
                    <div className="prop-label">カスタム名 (Custom Name)</div>
                    <input
                        type="text"
                        value={item.data?.customName || ""}
                        onChange={(e) => handleDataChange("customName", e.target.value)}
                        className="prop-input"
                        placeholder="ダッシュボード表示用..."
                    />
                    <div style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>
                        分析画面で識別するための名前です
                    </div>
                </div>
            </AccordionSection>

            {/* Transform (Layout) */}
            <AccordionSection title="レイアウト (Layout)" defaultOpen={true}>
                <div className="prop-group">
                    {/* Position X/Y */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                        <div>
                            <div className="prop-label">X座標</div>
                            <div style={{ position: 'relative' }}>
                                <Move size={12} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
                                <input
                                    type="number"
                                    value={getX()}
                                    onChange={(e) => handleRootChange("x", parseInt(e.target.value) || 0)}
                                    className="prop-input"
                                    style={{ paddingLeft: '26px' }}
                                />
                            </div>
                        </div>
                        <div>
                            <div className="prop-label">Y座標</div>
                            <div style={{ position: 'relative' }}>
                                <Move size={12} style={{ position: 'absolute', left: 8, top: '50%', color: '#666', transform: 'translateY(-50%) rotate(90deg)' }} />
                                <input
                                    type="number"
                                    value={getY()}
                                    onChange={(e) => handleRootChange("y", parseInt(e.target.value) || 0)}
                                    className="prop-input"
                                    style={{ paddingLeft: '26px' }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Size W/H */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div>
                            <div className="prop-label">幅 (Width)</div>
                            <div style={{ position: 'relative' }}>
                                <Maximize size={12} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
                                <input
                                    type="number"
                                    value={getWidth()}
                                    onChange={(e) => handleRootChange("width", parseInt(e.target.value) || 0)}
                                    className="prop-input"
                                    style={{ paddingLeft: '26px' }}
                                />
                            </div>
                        </div>
                        <div>
                            <div className="prop-label">高さ (Height)</div>
                            <div style={{ position: 'relative' }}>
                                <Maximize size={12} style={{ position: 'absolute', left: 8, top: '50%', color: '#666', transform: 'translateY(-50%) rotate(90deg)' }} />
                                <input
                                    type="number"
                                    value={getHeight()}
                                    onChange={(e) => handleRootChange("height", parseInt(e.target.value) || 0)}
                                    className="prop-input"
                                    style={{ paddingLeft: '26px' }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </AccordionSection>

            {/* Content */}
            <AccordionSection title="コンテンツ (Content)" defaultOpen={true}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                    {/* Text / Label */}
                    {(item.type === 'button' || item.type === 'text' || item.type === 'choice') && (
                        <div className="prop-group">
                            <div className="prop-label">テキスト内容</div>
                            <textarea
                                value={item.data?.label || item.data?.text || ""}
                                onChange={(e) => handleDataChange("text", e.target.value)}
                                className="prop-textarea"
                                rows={2}
                                style={{ resize: 'vertical', minHeight: '60px' }}
                                placeholder="テキストを入力..."
                            />
                        </div>
                    )}

                    {/* Image Import */}
                    {item.type === 'image' && (
                        <div className="prop-group">
                            <div className="prop-label">画像ソース</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {/* File Upload Button */}
                                <label className="prop-button" style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                    cursor: 'pointer',
                                    background: '#333',
                                    border: '1px solid #444',
                                    padding: '8px',
                                    borderRadius: '4px',
                                    color: '#eee',
                                    fontSize: '12px'
                                }}>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                const reader = new FileReader();
                                                reader.onload = (ev) => {
                                                    const result = ev.target?.result as string;
                                                    handleDataChange("src", result);
                                                };
                                                reader.readAsDataURL(file);
                                            }
                                        }}
                                        style={{ display: 'none' }}
                                    />
                                    <span>画像をアップロード</span>
                                </label>

                                {/* URL Input fallback */}
                                <input
                                    type="text"
                                    value={item.data?.src || ""}
                                    onChange={(e) => handleDataChange("src", e.target.value)}
                                    className="prop-input"
                                    placeholder="https://..."
                                />
                            </div>

                            {/* Preview Thumbnail */}
                            {item.data?.src && (
                                <div style={{
                                    marginTop: '8px',
                                    border: '1px solid #333',
                                    borderRadius: '4px',
                                    overflow: 'hidden',
                                    background: '#111',
                                    height: '100px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    position: 'relative'
                                }}>
                                    <img
                                        src={item.data.src}
                                        alt="Preview"
                                        style={{
                                            maxWidth: '100%',
                                            maxHeight: '100%',
                                            objectFit: 'contain'
                                        }}
                                    />
                                    {/* Crop Button Overlay */}
                                    <div style={{
                                        position: 'absolute',
                                        bottom: 5,
                                        right: 5,
                                        background: 'rgba(0,0,0,0.7)',
                                        borderRadius: '4px',
                                        padding: '4px',
                                    }}>
                                        <button
                                            className="prop-button"
                                            onClick={() => setIsCropModalOpen(true)}
                                            style={{ fontSize: '10px', padding: '4px 8px', height: 'auto' }}
                                        >
                                            ✂️ Crop
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Image Crop Modal */}
                    {item.type === 'image' && item.data?.src && (
                        <ImageCropModal
                            isOpen={isCropModalOpen}
                            imageSrc={item.data.originalSrc || item.data.src}
                            initialCrop={item.data.crop}
                            initialZoom={item.data.zoom}
                            onComplete={(croppedUrl, { crop, zoom }) => {
                                onItemUpdate(item.id, {
                                    data: {
                                        ...item.data,
                                        // Save original if not exists
                                        originalSrc: item.data.originalSrc || item.data.src,
                                        src: croppedUrl,
                                        crop,
                                        zoom
                                    }
                                }, { addToHistory: true });
                                setIsCropModalOpen(false);
                            }}
                            onCancel={() => setIsCropModalOpen(false)}
                        />
                    )}

                    {/* Placeholder */}
                    {(item.type === 'input' || item.type === 'textarea') && (
                        <div className="prop-group">
                            <div className="prop-label">プレースホルダー</div>
                            <input
                                type="text"
                                value={item.data?.placeholder || ""}
                                onChange={(e) => handleDataChange("placeholder", e.target.value)}
                                className="prop-input"
                                placeholder="入力例..."
                            />
                        </div>
                    )}

                    {/* B2B Score (Special Styling) */}
                    {(item.type === 'button' || item.type === 'choice') && (
                        <div style={{
                            background: '#2a2a2e',
                            border: '1px solid #3e3e42',
                            borderRadius: '6px',
                            padding: '10px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#a78bfa' }}>
                                    <ChartBar size={14} />
                                    <span style={{ fontSize: '11px', fontWeight: 600 }}>エンゲージメントスコア</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input
                                    type="number"
                                    value={item.data?.score || 0}
                                    onChange={(e) => handleDataChange("score", parseInt(e.target.value) || 0)}
                                    className="prop-input"
                                    style={{ flex: 1, borderColor: '#4c4c52' }}
                                />
                                <span style={{ fontSize: '11px', color: '#888' }}>points</span>
                            </div>
                            <div style={{ fontSize: '10px', color: '#666', marginTop: '6px' }}>
                                選択時に加算されるスコア
                            </div>
                        </div>
                    )}

                    {/* Validation */}
                    {(item.type === 'input' || item.type === 'choice') && (
                        <div style={{ paddingTop: '4px' }}>
                            <label className="prop-checkbox-row">
                                <input
                                    type="checkbox"
                                    checked={item.data?.required || false}
                                    onChange={(e) => handleDataChange("required", e.target.checked)}
                                />
                                <span style={{ fontSize: '12px' }}>必須項目にする</span>
                            </label>
                        </div>
                    )}
                </div>
            </AccordionSection>

            {/* ACTION (Button Only) */}
            {item.type === 'button' && (
                <AccordionSection title="アクション (Action)" defaultOpen={true}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {/* Action Type */}
                        <div className="prop-group">
                            <div className="prop-label">クリック時の動作</div>
                            <select
                                value={item.data?.actionType || 'none'}
                                onChange={(e) => handleDataChange("actionType", e.target.value)}
                                className="prop-select"
                                style={{
                                    width: '100%',
                                    padding: '6px',
                                    background: '#333',
                                    border: '1px solid #444',
                                    color: '#eee',
                                    borderRadius: '4px'
                                }}
                            >
                                <option value="none">ノードフロー (デフォルト)</option>
                                <option value="submit">フォーム送信</option>
                            </select>
                        </div>

                        {/* Submit Settings */}
                        {item.data?.actionType === 'submit' && (
                            <div style={{
                                padding: '10px',
                                background: '#2a2a2e',
                                borderRadius: '6px',
                                border: '1px solid #444'
                            }}>
                                <div style={{ marginBottom: '8px' }}>
                                    <div className="prop-label">リダイレクトURL (任意)</div>
                                    <input
                                        type="text"
                                        value={item.data?.submitRedirectUrl || ""}
                                        onChange={(e) => handleDataChange("submitRedirectUrl", e.target.value)}
                                        className="prop-input"
                                        placeholder="https://example.com/thanks"
                                    />
                                    <div style={{ fontSize: '10px', color: '#888', marginTop: '4px' }}>
                                        空欄の場合、デフォルトの完了メッセージを表示します
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </AccordionSection>
            )}

            {/* Design / Appearance */}
            <AccordionSection title="外観 (Appearance)" defaultOpen={true}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                    {/* Background Color */}
                    <div className="prop-group">
                        <div className="prop-label">背景色 (Background Color)</div>
                        <div className="prop-color-picker-wrapper">
                            <input
                                type="color"
                                value={item.data?.backgroundColor || "#ffffff"}
                                onChange={(e) => handleDataChange("backgroundColor", e.target.value)}
                                className="prop-color-picker"
                            />
                            <input
                                type="text"
                                value={item.data?.backgroundColor || ""}
                                onChange={(e) => handleDataChange("backgroundColor", e.target.value)}
                                className="prop-input"
                                style={{ fontFamily: 'monospace' }}
                            />
                        </div>
                    </div>

                    {/* Z-Index */}
                    <div className="prop-group">
                        <div className="prop-label">重ね順 (Z-Index)</div>
                        <div style={{ position: 'relative' }}>
                            <Layers size={12} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
                            <input
                                type="number"
                                value={getZIndex()}
                                onChange={(e) => handleRootChange("zIndex", parseInt(e.target.value) || 0)}
                                className="prop-input"
                                style={{ paddingLeft: '26px' }}
                            />
                        </div>
                    </div>

                </div>
            </AccordionSection>
        </div >
    );
};
