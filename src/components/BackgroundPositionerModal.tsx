// src/components/BackgroundPositionerModal.tsx

import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import './BackgroundPositionerModal.css';

interface BackgroundPositionerModalProps {
  imageUrl: string;
  onClose: () => void;
  onConfirm: (position: string, size: string) => void;
}

// アートボードの固定サイズ (比率計算用)
const ARTBOARD_WIDTH = 1000;
const ARTBOARD_HEIGHT = 700;
const ARTBOARD_ASPECT_RATIO = ARTBOARD_WIDTH / ARTBOARD_HEIGHT;

const BackgroundPositionerModal: React.FC<BackgroundPositionerModalProps> = ({
  imageUrl,
  onClose,
  onConfirm,
}) => {
  const [imageNaturalSize, setImageNaturalSize] = useState({ width: 0, height: 0 });
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  
  // 状態管理: ズーム倍率(scale) と 位置オフセット(x, y)
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const offsetStart = useRef({ x: 0, y: 0 });
  
  const overlayRef = useRef<HTMLDivElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // 1. 画像読み込み完了時
  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
  };

  // 2. 初期配置とウィンドウサイズ計算
  useLayoutEffect(() => {
    if (overlayRef.current && imageNaturalSize.width > 0) {
      const overlayWidth = overlayRef.current.clientWidth;
      const overlayHeight = overlayRef.current.clientHeight;

      // 「切り抜き枠」のサイズ決定 (画面の80%)
      let frameW = overlayWidth * 0.8;
      let frameH = frameW / ARTBOARD_ASPECT_RATIO;

      if (frameH > overlayHeight * 0.8) {
        frameH = overlayHeight * 0.8;
        frameW = frameH * ARTBOARD_ASPECT_RATIO;
      }
      setWindowSize({ width: frameW, height: frameH });

      // 初期状態: 「全体を表示 (Fit)」を適用
      fitImageToWindow(frameW, frameH, imageNaturalSize.width, imageNaturalSize.height);
    }
  }, [imageNaturalSize]);

  // ★ 便利関数: 枠内に収める (Fit)
  const fitImageToWindow = (frameW: number, frameH: number, imgW: number, imgH: number) => {
    if (!imgW || !imgH) return;
    const widthRatio = frameW / imgW;
    const heightRatio = frameH / imgH;
    // 小さい方の比率に合わせれば全体が入る
    const newScale = Math.min(widthRatio, heightRatio) * 0.95; // 少し余白
    setScale(newScale);
    setOffset({ x: 0, y: 0 });
  };

  // ★ 便利関数: 枠を埋める (Cover)
  const coverImageToWindow = () => {
    if (!imageNaturalSize.width || !windowSize.width) return;
    const widthRatio = windowSize.width / imageNaturalSize.width;
    const heightRatio = windowSize.height / imageNaturalSize.height;
    // 大きい方の比率に合わせれば隙間なく埋まる
    const newScale = Math.max(widthRatio, heightRatio);
    setScale(newScale);
    setOffset({ x: 0, y: 0 });
  };

  // ★ 便利関数: 等倍に戻す (100%)
  const resetImageScale = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  // 3. マウスホイールでのズーム
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomSensitivity = 0.001;
      const delta = -e.deltaY * zoomSensitivity;
      setScale(prevScale => {
        const newScale = prevScale * (1 + delta);
        return Math.min(Math.max(newScale, 0.01), 100); 
      });
    };

    const overlay = overlayRef.current;
    if (overlay) {
      overlay.addEventListener('wheel', handleWheel, { passive: false });
    }
    return () => {
      if (overlay) {
        overlay.removeEventListener('wheel', handleWheel);
      }
    };
  }, []);

  // 4. ドラッグ操作
  const handleMouseDown = (e: React.MouseEvent) => {
    // ツールバーやボタン上のクリックならドラッグを開始しない
    if ((e.target as HTMLElement).closest('.bg-modal-toolbar')) return;

    e.preventDefault();
    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
    offsetStart.current = { ...offset };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setOffset({
      x: offsetStart.current.x + dx,
      y: offsetStart.current.y + dy,
    });
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  // 5. 完了
  const handleConfirm = () => {
    if (!windowRef.current || !imageRef.current) {
      onClose();
      return;
    }
    const frameRect = windowRef.current.getBoundingClientRect();
    const imgRect = imageRef.current.getBoundingClientRect();

    const relativeX = imgRect.left - frameRect.left;
    const relativeY = imgRect.top - frameRect.top;
    const scaleFactor = ARTBOARD_WIDTH / frameRect.width;

    const finalX = relativeX * scaleFactor;
    const finalY = relativeY * scaleFactor;
    const finalW = imgRect.width * scaleFactor;
    const finalH = imgRect.height * scaleFactor;

    const positionStr = `${Math.round(finalX)}px ${Math.round(finalY)}px`;
    const sizeStr = `${Math.round(finalW)}px ${Math.round(finalH)}px`;

    onConfirm(positionStr, sizeStr);
  };

  return (
    <div 
      className="bg-modal-overlay" 
      ref={overlayRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* ★ ツールバーを追加 */}
      <div className="bg-modal-toolbar">
        <div className="toolbar-title">位置調整</div>
        <div className="toolbar-buttons">
          <button onClick={() => fitImageToWindow(windowSize.width, windowSize.height, imageNaturalSize.width, imageNaturalSize.height)} title="全体を表示">
            全体 (Fit)
          </button>
          <button onClick={coverImageToWindow} title="枠を埋める">
            埋める (Cover)
          </button>
          <button onClick={resetImageScale} title="等倍表示">
            100%
          </button>
        </div>
        <div className="toolbar-instruction">
          ホイール: 拡大縮小 / ドラッグ: 移動
        </div>
      </div>

      {/* 画像 */}
      <img
        ref={imageRef}
        src={imageUrl}
        alt="背景プレビュー"
        className="bg-modal-image"
        style={{
          width: imageNaturalSize.width,
          height: imageNaturalSize.height,
          transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${scale})`,
          opacity: imageNaturalSize.width ? 1 : 0,
        }}
        onLoad={onImageLoad}
        draggable={false}
      />
      
      {/* 切り抜き枠 */}
      <div 
        ref={windowRef}
        className="bg-modal-window" 
        style={{
          width: windowSize.width || 0,
          height: windowSize.height || 0,
        }}
      />

      {/* 下部ボタン */}
      <div className="bg-modal-buttons">
        <button className="bg-modal-button cancel" onClick={onClose}>
          Cancel
        </button>
        <button className="bg-modal-button ok" onClick={handleConfirm}>
          OK
        </button>
      </div>
    </div>
  );
};

export default BackgroundPositionerModal;