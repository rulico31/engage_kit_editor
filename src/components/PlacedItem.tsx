// src/components/PlacedItem.tsx

import React, { useRef } from "react";
import { useDrag } from "react-dnd";
import { ItemTypes } from "../ItemTypes";
import type { PlacedItemType } from "../types";
import "./PlacedItem.css";

// (useResizeHandle フックは削除)

interface PlacedItemProps {
  item: PlacedItemType;
  onSelect: () => void;
  isSelected: boolean;
}

const PlacedItem: React.FC<PlacedItemProps> = ({
  item,
  onSelect,
  isSelected,
}) => {
  const { id, name, x, y, width, height } = item;
  
  // (移動用の ref)
  const dragRef = useRef<HTMLDivElement>(null);

  // --- (A) アイテム全体を「移動」させるための useDrag ---
  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: ItemTypes.PLACED_ITEM,
      item: { id, x, y },
      collect: (monitor) => ({
        isDragging: !!monitor.isDragging(),
      }),
    }),
    [id, x, y] // 依存配列 (ジャンプバグ修正済み)
  );
  drag(dragRef); // (A) ref を (1) に接続

  // ---

  // クリックイベントハンドラ
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
  };

  const itemClassName = `placed-item ${isSelected ? "is-selected" : ""}`;

  return (
    // (1) シンプルな Div 構造に戻す
    <div
      ref={dragRef} // (A) 移動用 ref
      className={itemClassName}
      style={{
        position: "absolute",
        left: `${x}px`,
        top: `${y}px`,
        width: `${width}px`,
        height: `${height}px`,
        opacity: isDragging ? 0 : 1, // 移動中は非表示
        zIndex: isSelected ? 1 : 0,
      }}
      onClick={handleClick} // (C) 選択用
    >
      {name}
      {/* (リサイズハンドルは削除) */}
    </div>
  );
};

export default PlacedItem;