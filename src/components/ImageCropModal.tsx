// src/components/ImageCropModal.tsx

import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import { getCroppedImg } from '../utils/cropImage';
import './ImageCropModal.css';

interface ImageCropModalProps {
    isOpen: boolean;
    imageSrc: string;
    initialCrop?: Crop;
    initialZoom?: number;
    onComplete: (croppedImageUrl: string, cropState: { crop: Crop, zoom: number }) => void;
    onCancel: () => void;
}

type Mode = 'crop' | 'pan';

const ImageCropModal: React.FC<ImageCropModalProps> = ({
    isOpen,
    imageSrc,
    initialCrop,
    initialZoom,
    onComplete,
    onCancel,
}) => {
    // --- State Management ---
    const [crop, setCrop] = useState<Crop | undefined>(undefined);
    const [completedCrop, setCompletedCrop] = useState<PixelCrop | undefined>(undefined);
    const [zoom, setZoom] = useState<number>(1.0);
    const [mode, setMode] = useState<Mode>('crop');

    // 画像のアスペクト比判定
    const [baseDimensions, setBaseDimensions] = useState<{ width: number; height: number } | null>(null);

    const [isPanning, setIsPanning] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);

    // --- Refs ---
    const imgRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const panStartRef = useRef({ x: 0, y: 0 });
    const scrollStartRef = useRef({ left: 0, top: 0 });

    // モーダルが開いたとき、または画像ソースが変わったときの初期化処理
    useEffect(() => {
        if (isOpen) {
            // 新しく開くときは、まずロード状態と基準サイズをリセットする
            setImageLoaded(false);
            setBaseDimensions(null);
            setIsPanning(false);

            // 前回の状態があれば復元
            if (initialCrop && initialZoom) {
                setCrop(initialCrop);
                setZoom(initialZoom);
                setMode('crop');
            } else {
                // デフォルト状態
                setZoom(1.0);
                setMode('crop');
                setCrop(undefined);
                setCompletedCrop(undefined);
            }

            // コンテナのスクロール位置リセット
            if (containerRef.current) {
                containerRef.current.scrollTop = 0;
                containerRef.current.scrollLeft = 0;
            }
        }
    }, [isOpen, imageSrc]);

    // --- Actions ---

    // リセットボタン用のハンドラ（基準サイズ baseDimensions は破棄しない）
    const handleReset = () => {
        setZoom(1.0);
        setMode('crop');
        setCrop(undefined);
        setCompletedCrop(undefined);
        setIsPanning(false);
        if (containerRef.current) {
            containerRef.current.scrollTop = 0;
            containerRef.current.scrollLeft = 0;
        }
    };

    const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setZoom(parseFloat(e.target.value));
    };

    const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();

        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoom(prev => {
            const newZoom = prev + delta;
            return Math.max(1.0, Math.min(3.0, newZoom));
        });
    }, []);

    // --- Image Load Handler ---
    const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const img = e.currentTarget;
        const { width, height } = img.getBoundingClientRect();

        // 初回ロード時のサイズ（100%フィットサイズ）を基準として保存
        setBaseDimensions({ width, height });
        setImageLoaded(true);

        // 状態復元時に completedCrop (px単位) を再計算
        if (crop && crop.unit === '%') {
            const pixelCrop: PixelCrop = {
                x: (crop.x / 100) * width,
                y: (crop.y / 100) * height,
                width: (crop.width / 100) * width,
                height: (crop.height / 100) * height,
                unit: 'px'
            };
            setCompletedCrop(pixelCrop);
        }
    };

    // --- Pan (Move) Handlers ---

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (mode !== 'pan' || !containerRef.current) return;

        e.preventDefault();
        setIsPanning(true);
        panStartRef.current = { x: e.clientX, y: e.clientY };
        scrollStartRef.current = {
            left: containerRef.current.scrollLeft,
            top: containerRef.current.scrollTop
        };

        document.addEventListener('mousemove', handleMouseMoveGlobal);
        document.addEventListener('mouseup', handleMouseUpGlobal);
    };

    const handleMouseMoveGlobal = useCallback((e: MouseEvent) => {
        if (!containerRef.current) return;

        const dx = e.clientX - panStartRef.current.x;
        const dy = e.clientY - panStartRef.current.y;

        containerRef.current.scrollLeft = scrollStartRef.current.left - dx;
        containerRef.current.scrollTop = scrollStartRef.current.top - dy;
    }, []);

    const handleMouseUpGlobal = useCallback(() => {
        setIsPanning(false);
        document.removeEventListener('mousemove', handleMouseMoveGlobal);
        document.removeEventListener('mouseup', handleMouseUpGlobal);
    }, [handleMouseMoveGlobal]);

    useEffect(() => {
        return () => {
            document.removeEventListener('mousemove', handleMouseMoveGlobal);
            document.removeEventListener('mouseup', handleMouseUpGlobal);
        };
    }, [handleMouseMoveGlobal, handleMouseUpGlobal]);


    // --- Apply / Save Handler ---

    const handleApply = async () => {
        const image = imgRef.current;
        if (!image) return;

        // 画面上の現在の画像サイズを取得（ズーム反映済み）
        const rect = image.getBoundingClientRect();

        let targetPixelCrop = completedCrop;

        // crop(%) がある場合は必ずそこから現在のrectに基づいてpx値を再計算する
        if (crop && crop.unit === '%') {
            targetPixelCrop = {
                unit: 'px',
                x: (crop.x / 100) * rect.width,
                y: (crop.y / 100) * rect.height,
                width: (crop.width / 100) * rect.width,
                height: (crop.height / 100) * rect.height,
            };
        }

        // 有効なクロップ範囲がない場合は何もしない
        if (!targetPixelCrop || targetPixelCrop.width === 0 || targetPixelCrop.height === 0) return;

        try {
            // 1. 画像切り抜き処理 (元画像の解像度に合わせて座標変換)
            const scaleX = image.naturalWidth / rect.width;
            const scaleY = image.naturalHeight / rect.height;

            const naturalCrop = {
                x: targetPixelCrop.x * scaleX,
                y: targetPixelCrop.y * scaleY,
                width: targetPixelCrop.width * scaleX,
                height: targetPixelCrop.height * scaleY,
            };

            const croppedImageUrl = await getCroppedImg(imageSrc, naturalCrop);

            // 2. 次回復元用のデータを「パーセント単位」で生成
            const percentCrop: Crop = {
                unit: '%',
                x: (targetPixelCrop.x / rect.width) * 100,
                y: (targetPixelCrop.y / rect.height) * 100,
                width: (targetPixelCrop.width / rect.width) * 100,
                height: (targetPixelCrop.height / rect.height) * 100,
            };

            // 3. 保存
            onComplete(croppedImageUrl, { crop: percentCrop, zoom });

        } catch (error) {
            console.error('Error cropping image:', error);
            alert('画像のトリミングに失敗しました');
        }
    };

    if (!isOpen) return null;

    // --- Dynamic Styles ---

    const imgStyle: React.CSSProperties = {
        display: 'block',
        pointerEvents: 'none',

        // baseDimensions（基準サイズ）× ズーム倍率 でサイズを決定
        width: baseDimensions ? `${baseDimensions.width * zoom}px` : 'auto',
        height: baseDimensions ? `${baseDimensions.height * zoom}px` : 'auto',

        maxWidth: baseDimensions ? 'none' : '85vw',
        maxHeight: baseDimensions ? 'none' : '70vh',
    };

    // 適用ボタンの有効化判定
    const canApply = (completedCrop?.width && completedCrop?.height) || (crop?.width && crop?.height);

    return (
        <div className="image-crop-modal-overlay">
            <div className="image-crop-modal-content">
                <div className="image-crop-modal-header">
                    <h3>画像をトリミング</h3>
                </div>

                <div
                    ref={containerRef}
                    className="image-crop-modal-body"
                    onWheel={handleWheel}
                    onMouseDown={handleMouseDown}
                    style={{
                        cursor: mode === 'pan' ? (isPanning ? 'grabbing' : 'grab') : 'default',
                    }}
                >
                    {!imageLoaded && (
                        <div style={{ position: 'absolute', color: '#888' }}>
                            Loading...
                        </div>
                    )}

                    <div className="image-crop-content-wrapper">
                        <ReactCrop
                            crop={crop}
                            // ★修正ポイント: 第2引数の percentCrop を使用して、常に%単位で更新する
                            // これにより、画像サイズ(ズーム)が変わっても相対的な選択範囲が維持される
                            onChange={(_pixelCrop, percentCrop) => setCrop(percentCrop)}
                            onComplete={(c) => setCompletedCrop(c)}
                            disabled={mode === 'pan'}
                        >
                            <img
                                ref={imgRef}
                                src={imageSrc}
                                alt="Crop target"
                                onLoad={handleImageLoad}
                                style={imgStyle}
                            />
                        </ReactCrop>
                    </div>
                </div>

                <div className="image-crop-modal-footer">
                    <div className="zoom-controls">
                        <label className="zoom-label">ズーム:</label>
                        <input
                            type="range"
                            min="1.0"
                            max="3.0"
                            step="0.1"
                            value={zoom}
                            onChange={handleZoomChange}
                            className="zoom-slider"
                        />
                        <span className="zoom-value">{Math.round(zoom * 100)}%</span>

                        <button
                            className="mode-btn"
                            onClick={handleReset}
                            title="全体表示に戻す"
                            style={{ marginLeft: 8 }}
                        >
                            ⟲ Reset
                        </button>
                    </div>

                    <div className="mode-controls">
                        <button
                            className={`mode-btn ${mode === 'crop' ? 'active' : ''}`}
                            onClick={() => setMode('crop')}
                            title="範囲選択モード"
                        >
                            ✂️ 範囲選択
                        </button>
                        <button
                            className={`mode-btn ${mode === 'pan' ? 'active' : ''}`}
                            onClick={() => setMode('pan')}
                            title="移動モード"
                        >
                            ✋ 移動
                        </button>
                    </div>

                    <div className="action-buttons">
                        <button className="image-crop-modal-btn cancel" onClick={onCancel}>
                            キャンセル
                        </button>
                        <button
                            className="image-crop-modal-btn apply"
                            onClick={handleApply}
                            disabled={!canApply}
                        >
                            適用
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImageCropModal;