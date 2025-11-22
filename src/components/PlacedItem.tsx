// src/components/PlacedItem.tsx

import React, { useRef } from "react";
import { useDrag } from "react-dnd";
import { ItemTypes } from "../ItemTypes";
import type { PlacedItemType } from "../types";
import "./PlacedItem.css";

interface PlacedItemProps {
  item: PlacedItemType;
  onSelect: (e: React.MouseEvent) => void; // クリックイベントを受け取るように変更
  isSelected: boolean;
  
  // プレビュー用Props
  isPreviewing: boolean;
  isVisible: boolean;
  onItemEvent: (eventName: string, itemId: string) => void;
  
  // ★ 追加: 子要素
  children?: React.ReactNode;
}

const PlacedItem: React.FC<PlacedItemProps> = ({
  item,
  onSelect,
  isSelected,
  isPreviewing,
  isVisible,
  onItemEvent,
  children,
}) => {
  const { id, name, x, y, width, height } = item;
  
  const dragRef = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: ItemTypes.PLACED_ITEM,
      item: { id, x, y }, // ドラッグ開始時の情報を渡す
      collect: (monitor) => ({
        isDragging: !!monitor.isDragging(),
      }),
      canDrag: !isPreviewing,
    }),
    [id, x, y, isPreviewing]
  );
  drag(dragRef);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPreviewing) {
      onItemEvent("click", id);
    } else {
      onSelect(e); // イベントオブジェクトを渡す
    }
  };

  let itemClassName = `placed-item ${isSelected ? "is-selected" : ""} ${isPreviewing ? "is-preview" : ""}`;
  
  // グループの場合のスタイル調整
  if (item.id.startsWith("group")) {
    itemClassName += " is-group";
  }

  return (
    <div
      ref={dragRef}
      className={itemClassName}
      style={{
        position: "absolute",
        left: `${x}px`,
        top: `${y}px`,
        width: `${width}px`,
        height: `${height}px`,
        opacity: isDragging ? 0.5 : 1,
        // 選択されている場合はz-indexを上げて手前に表示したいが、
        // グループ内の相対順序を保つ必要もあるため、単純な zIndex: 1 は危険。
        // 基本的にDOM順序（Artboardでのレンダリング順）に任せる。
        // zIndex: isSelected ? 1000 : undefined, 
        display: isVisible ? "flex" : "none",
        // グループの場合は枠線のみ、または透明にするなどのスタイル
        border: item.id.startsWith("group") ? "1px dashed #aaa" : undefined,
        backgroundColor: item.id.startsWith("group") ? "rgba(0,0,0,0.05)" : undefined,
      }}
      onClick={handleClick}
    >
      {/* グループ以外なら名前を表示 */}
      {!item.id.startsWith("group") && name}
      
      {/* 子要素のレンダリング */}
      {children}
    </div>
  );
};

export default PlacedItem;