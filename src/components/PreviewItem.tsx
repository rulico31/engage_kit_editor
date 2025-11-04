// src/components/PreviewItem.tsx

import React from "react";
import type { PlacedItemType, PreviewItemState } from "../types";
import "./PreviewItem.css";

interface PreviewItemProps {
  item: PlacedItemType;
  state: PreviewItemState;
  onClick: () => void; // ロジック実行エンジンを呼び出す関数
}

const PreviewItem: React.FC<PreviewItemProps> = ({
  item,
  state,
  onClick,
}) => {
  const { name, x, y, width, height } = item;

  // D&D (useDrag) や選択 (onSelect) ロジックはすべて削除

  // プレビュー状態に基づいてスタイルを決定
  const style: React.CSSProperties = {
    position: "absolute",
    left: `${x}px`,
    top: `${y}px`,
    width: `${width}px`,
    height: `${height}px`,
    // isVisible が false の場合は非表示
    display: state.isVisible ? "block" : "none",
  };

  // "ボタン" の場合にのみクリックイベントをアタッチ
  const handleClick = name === "ボタン" ? onClick : undefined;

  return (
    <div
      className="preview-item"
      style={style}
      onClick={handleClick}
      // data-item-type を追加 (CSSでのカーソル制御用)
      data-item-type={name}
    >
      {name}
    </div>
  );
};

export default PreviewItem;
