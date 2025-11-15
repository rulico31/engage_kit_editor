// src/components/BackgroundPositionerModal.tsx

import React, { useState, useRef, useLayoutEffect } from 'react';
import './BackgroundPositionerModal.css';

interface BackgroundPositionerModalProps {
  imageUrl: string;
  onClose: () => void;
  onConfirm: (position: string) => void;
}

// アートボードの固定比率
const ARTBOARD_ASPECT_RATIO = 1000 / 700; // 1.428...

const BackgroundPositionerModal: React.FC<BackgroundPositionerModalProps> = ({
  imageUrl,
  onClose,
  onConfirm,
}) => {
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [scaledImageSize, setScaledImageSize] = useState({ width: 0, height: 0 });
  
  // X, Y のオフセット (px指定)
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  
  const overlayRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // 1. 画像が読み込まれたら、その「元サイズ」を取得
  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
  };

  // 2. 「切り抜き枠」と「プレビュー画像」のサイズを計算
  useLayoutEffect(() => {
    if (overlayRef.current && imageSize.width > 0) {
      const overlayWidth = overlayRef.current.clientWidth;
      const overlayHeight = overlayRef.current.clientHeight;

      // 2a. 「切り抜き枠」のサイズを決定 (画面の80%)
      let frameW = overlayWidth * 0.8;
      let frameH = frameW / ARTBOARD_ASPECT_RATIO;

      if (frameH > overlayHeight * 0.8) {
        frameH = overlayHeight * 0.8;
        frameW = frameH * ARTBOARD_ASPECT_RATIO;
      }
      setWindowSize({ width: frameW, height: frameH });

      // 2b. 「プレビュー画像」の 'cover' サイズを計算
      // (アートボードの background-size: cover と同じ計算)
      const imgRatio = imageSize.width / imageSize.height;
      const frameRatio = frameW / frameH;

      let imgScaledW: number, imgScaledH: number;
      if (imgRatio > frameRatio) {
        // 画像が枠より「横長」 -> 高さを枠に合わせる
        imgScaledH = frameH;
        imgScaledW = frameH * imgRatio;
      } else {
        // 画像が枠より「縦長」 -> 幅を枠に合わせる
        imgScaledW = frameW;
        imgScaledH = frameW / imgRatio;
      }
      setScaledImageSize({ width: imgScaledW, height: imgScaledH });
      
      // 初期位置を中央にセット (オフセット 0, 0 は中央寄せを意味する)
      setOffset({ x: 0, y: 0 });
    }
  }, [imageSize]); // 画像サイズが確定した後

  // 3. ドラッグ操作
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    dragStart.current = {
      x: e.clientX - offset.x,
      y: e.clientY - offset.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    
    let newX = e.clientX - dragStart.current.x;
    let newY = e.clientY - dragStart.current.y;

    // 画像が枠から出すぎないように制限
    // (画像の右端 = newX + scaledW/2 が 枠の右端 = windowW/2 を下回らない)
    // (newX は中央(0)からのオフセット)
    const minX = (windowSize.width - scaledImageSize.width) / 2;
    const maxX = (scaledImageSize.width - windowSize.width) / 2;
    const minY = (windowSize.height - scaledImageSize.height) / 2;
    const maxY = (scaledImageSize.height - windowSize.height) / 2;
    
    if (newX < minX) newX = minX;
    if (newX > maxX) newX = maxX;
    if (newY < minY) newY = minY;
    if (newY > maxY) newY = maxY;

    setOffset({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  // 4. OKボタン押下時
  const handleConfirm = () => {
    if (!scaledImageSize.width || !windowSize.width) {
      onConfirm('50% 50%'); // デフォルト
      return;
    }
    
    // background-position は、(0% 0% = 左上), (100% 100% = 右下)
    
    // 枠に対する画像の「左上」の座標
    const imgLeft = (windowSize.width / 2) - (scaledImageSize.width / 2) + offset.x;
    const imgTop = (windowSize.height / 2) - (scaledImageSize.height / 2) + offset.y;

    // はみ出している総量
    const overflowX = scaledImageSize.width - windowSize.width;
    const overflowY = scaledImageSize.height - windowSize.height;

    // 0% (左寄せ) ～ 100% (右寄せ) のどの位置か
    // (imgLeft は 0 ～ -overflowX の範囲で動く)
    const percentX = (overflowX > 0) ? (-imgLeft / overflowX) * 100 : 50;
    const percentY = (overflowY > 0) ? (-imgTop / overflowY) * 100 : 50;
    
    onConfirm(`${percentX.toFixed(2)}% ${percentY.toFixed(2)}%`);
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
      {/* プレビュー画像本体 (中央揃えで配置) */}
      <img
        ref={imageRef}
        src={imageUrl}
        alt="背景プレビュー"
        className="bg-modal-image"
        style={{
          width: scaledImageSize.width || 0,
          height: scaledImageSize.height || 0,
          transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
        }}
        onLoad={onImageLoad}
        draggable={false}
      />
      
      {/* アートボード比率の「切り抜き枠」 (暗転マスク) */}
      <div 
        className="bg-modal-window" 
        style={{
          width: windowSize.width || 0,
          height: windowSize.height || 0,
        }}
      />

      {/* 右下のボタン */}
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