// src/components/PreviewItem.tsx

import React from "react";
import type { PlacedItemType, PreviewState, NodeGraph } from "../types";
// ★ 修正: executeLogicGraph のインポートを削除
// import { executeLogicGraph } from "../logicEngine";
import "./PreviewItem.css"; 
import { usePreviewStore } from "../stores/usePreviewStore"; // ★ ストアをインポート

interface PreviewItemProps {
  item: PlacedItemType;
  previewState: PreviewState;
  setPreviewState: (
    newState: PreviewState | ((prev: PreviewState) => PreviewState)
  ) => void;
  allItemLogics: Record<string, NodeGraph>;
}

const PreviewItem: React.FC<PreviewItemProps> = ({
  item,
  previewState,
  // setPreviewState, // ★ 使用しないため削除(Props定義には残すが無視)
  // allItemLogics,   // ★ ストア側で処理するため基本不要だが互換性のため残す
}) => {
  const { id, name, width, height } = item;

  // ★ ストアからイベントハンドラを取得
  const onItemEvent = usePreviewStore(state => state.handleItemEvent);

  const handleClick = () => {
    // ★ ロジックエンジンを直接呼ぶのではなく、ストアのアクションを経由する
    // これにより、triggerEvent が適切に呼び出され、状態管理が一元化される
    if (name.includes("ボタン")) {
        onItemEvent("click", id);
    }
  };

  const itemClassName = `preview-item ${
    name.includes("ボタン") ? "is-button" : ""
  }`;
  
  const itemState = previewState[id];
  // 万が一 state がない場合のフォールバック
  if (!itemState) return null;

  return (
    <div
      className={itemClassName}
      style={{
        position: "absolute",
        left: `${itemState.x}px`, // ★ item.x ではなく state から取得 (アニメーション対応)
        top: `${itemState.y}px`,
        width: `${width}px`,
        height: `${height}px`,
        zIndex: 0,
        opacity: itemState.opacity,
        transform: `scale(${itemState.scale}) rotate(${itemState.rotation}deg)`,
        transition: itemState.transition || 'none',
        // プレビュー時はドラッグ無効などをCSSで制御
      }}
      onClick={handleClick}
    >
      {item.data.text || name}
    </div>
  );
};

export default PreviewItem;