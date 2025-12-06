import React, { useState, useEffect } from "react";
import { usePageStore } from "../stores/usePageStore";
import "./BackgroundModal.css";

interface BackgroundModalProps {
  itemId: string;
  imageSrc: string;
  onClose: () => void;
}

const BackgroundModal: React.FC<BackgroundModalProps> = ({ itemId, imageSrc, onClose }) => {
  const updateItem = usePageStore((state) => state.updateItem);
  const placedItems = usePageStore((state) =>
    state.selectedPageId ? state.pages[state.selectedPageId].placedItems : []
  );

  const targetItem = placedItems.find(p => p.id === itemId);

  // Parse initial position
  const initialPos = targetItem?.data.artboardBackgroundPosition || "50% 50%";
  const [initialX, initialY] = initialPos.split(" ").map((v: string) => parseInt(v) || 50);

  const [x, setX] = useState(initialX);
  const [y, setY] = useState(initialY);
  const [sizeMode, setSizeMode] = useState<"cover" | "contain">(
    (targetItem?.data.artboardBackgroundSize as "cover" | "contain") || "cover"
  );

  // Debounced update to store
  useEffect(() => {
    if (!targetItem) return;
    const timeoutId = setTimeout(() => {
      updateItem(itemId, {
        data: {
          ...targetItem.data,
          artboardBackgroundPosition: `${x}% ${y}%`,
          artboardBackgroundSize: sizeMode,
        }
      });
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [x, y, sizeMode, itemId, updateItem]); // Note: removed targetItem from dependency to avoid loop if object ref changes

  if (!targetItem) return null;

  return (
    <div className="bg-modal-overlay">
      <div className="bg-modal-content">
        <div className="bg-modal-header">
          <h3>背景画像の位置調整</h3>
          <button className="bg-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="bg-modal-body">
          <div className="bg-preview-area">
            <div className="bg-preview-label">プレビュー</div>
            <div
              className="bg-preview-canvas"
              style={{
                backgroundImage: `url(${imageSrc})`,
                backgroundPosition: `${x}% ${y}%`,
                backgroundSize: sizeMode,
              }}
            >
              {/* Dashed border or artboard feel */}
            </div>
          </div>

          <div className="bg-controls-area">
            <div className="bg-control-group">
              <label className="bg-control-label">水平位置 (X): {x}%</label>
              <input
                type="range"
                className="bg-slider"
                min="0" max="100"
                value={x}
                onChange={(e) => setX(Number(e.target.value))}
              />
            </div>

            <div className="bg-control-group">
              <label className="bg-control-label">垂直位置 (Y): {y}%</label>
              <input
                type="range"
                className="bg-slider"
                min="0" max="100"
                value={y}
                onChange={(e) => setY(Number(e.target.value))}
              />
            </div>

            <div className="bg-control-separator" />

            <div className="bg-control-group">
              <label className="bg-control-label">サイズモード</label>
              <div className="bg-radio-group">
                <label className={`bg-radio-option ${sizeMode === 'cover' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="size"
                    checked={sizeMode === "cover"}
                    onChange={() => setSizeMode("cover")}
                  />
                  <span className="radio-text">Cover (全体を埋める)</span>
                </label>
                <label className={`bg-radio-option ${sizeMode === 'contain' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="size"
                    checked={sizeMode === "contain"}
                    onChange={() => setSizeMode("contain")}
                  />
                  <span className="radio-text">Contain (全体を表示)</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-modal-footer">
          <button className="bg-modal-btn primary" onClick={onClose}>完了</button>
        </div>
      </div>
    </div>
  );
};

export default BackgroundModal;