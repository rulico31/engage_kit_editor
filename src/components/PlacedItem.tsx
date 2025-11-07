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
  
  // プレビュー用Props
  isPreviewing: boolean;
  isVisible: boolean; // (プレビュー状態から渡される)
  onItemEvent: (eventName: string, itemId: string) => void;
}

const PlacedItem: React.FC<PlacedItemProps> = ({
  item,
  onSelect,
  isSelected,
  // プレビュー用
  isPreviewing,
  isVisible,
  onItemEvent,
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
      canDrag: !isPreviewing, // プレビュー中はドラッグを無効化
    }),
    [id, x, y, isPreviewing] // 依存配列 (ジャンプバグ修正済み + isPreviewing)
  );
  drag(dragRef); // (A) ref を (1) に接続

  // ---

  // クリックイベントハンドラ
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPreviewing) {
      // プレビューモード中: ロジックエンジンにイベントを送信
      onItemEvent("click", id);
    } else {
      // 編集モード中: アイテムを選択
      onSelect();
    }
  };

  const itemClassName = `placed-item ${isSelected ? "is-selected" : ""} ${
    isPreviewing ? "is-preview" : ""
  }`;

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
        // プレビュー中の表示/非表示を制御
        display: isVisible ? "flex" : "none",
      }}
      onClick={handleClick} // (C) 選択 or イベント発火
    >
      {name}
      {/* (リサイズハンドルは削除) */}
    </div>
  );
};

export default PlacedItem;