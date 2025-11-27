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

  // 初期値の解析 (例: "50% 50%")
  const initialPos = targetItem?.data.artboardBackgroundPosition || "50% 50%";
  const [posX, posY] = initialPos.split(" ").map((v: string) => parseInt(v) || 50);
  
  const [x, setX] = useState(posX);
  const [y, setY] = useState(posY);
  const [sizeMode, setSizeMode] = useState<"cover" | "contain">("cover");

  // 値が変更されたらストアを更新
  useEffect(() => {
    // ★ 修正: targetItemが存在しない場合は何もしない (Type guard)
    if (!targetItem) return;

    updateItem(itemId, {
      data: {
        ...targetItem.data, // 既存のデータを展開することで required なプロパティ(text等)を維持
        artboardBackgroundPosition: `${x}% ${y}%`,
        artboardBackgroundSize: sizeMode,
      }
    });
  }, [x, y, sizeMode, itemId, updateItem]); // targetItem.data を依存配列から除外

  if (!targetItem) return null; // アイテムがない場合は描画しない

  return (
    <div className="bg-modal-overlay">
      <div className="bg-modal-content">
        <div className="bg-modal-header">
          <h3>背景画像の位置調整</h3>
          <button className="bg-modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="bg-preview-area">
          <div 
            className="bg-preview-canvas"
            style={{
              backgroundImage: `url(${imageSrc})`,
              backgroundPosition: `${x}% ${y}%`,
              backgroundSize: sizeMode,
            }}
          >
            <div className="bg-preview-guide">Preview</div>
          </div>
        </div>

        <div className="bg-controls">
          <div className="control-group">
            <label>水平位置 (X): {x}%</label>
            <input 
              type="range" 
              min="0" max="100" 
              value={x} 
              onChange={(e) => setX(Number(e.target.value))} 
            />
          </div>
          
          <div className="control-group">
            <label>垂直位置 (Y): {y}%</label>
            <input 
              type="range" 
              min="0" max="100" 
              value={y} 
              onChange={(e) => setY(Number(e.target.value))} 
            />
          </div>

          <div className="control-group">
            <label>サイズモード</label>
            <div className="radio-group">
              <label>
                <input 
                  type="radio" 
                  name="size" 
                  checked={sizeMode === "cover"} 
                  onChange={() => setSizeMode("cover")} 
                />
                Cover (埋める)
              </label>
              <label>
                <input 
                  type="radio" 
                  name="size" 
                  checked={sizeMode === "contain"} 
                  onChange={() => setSizeMode("contain")} 
                />
                Contain (収める)
              </label>
            </div>
          </div>
        </div>

        <div className="bg-modal-footer">
          <button className="bg-modal-btn" onClick={onClose}>完了</button>
        </div>
      </div>
    </div>
  );
};

export default BackgroundModal;