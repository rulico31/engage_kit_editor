// src/components/ToolboxItem.tsx

import React, { useState, useRef } from "react";
import { useDrag } from "react-dnd";
import { ItemTypes } from "../ItemTypes";

interface ToolboxItemProps {
  name: string;
}

const ToolboxItem: React.FC<ToolboxItemProps> = React.memo(({ name }) => {
  // refオブジェクトを作成
  const dragRef = useRef<HTMLDivElement>(null);

  // useDrag フック
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.TOOL,
    item: { name },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  // dragコネクタをrefに接続
  drag(dragRef);

  // ホバー状態を管理
  const [hover, setHover] = useState(false);

  // スタイル定義
  const itemStyle: React.CSSProperties = {
    // ベースのスタイル
    color: "#eee",
    padding: "10px 15px",
    // ★ 修正: margin "8px" を削除し、親要素の gap (8px) に任せる
    // 必要であれば微調整用に marginBottom: "0" を明示
    margin: "0", 
    
    borderRadius: "6px",
    cursor: "grab",
    textAlign: "center",
    fontSize: "14px", // 少しサイズを調整して上品に
    fontWeight: "500",
    transition: "all 0.2s ease",
    
    // 横幅を親要素に合わせる
    width: "100%",
    boxSizing: "border-box",

    // 状態によって変化するスタイル
    backgroundColor: isDragging ? "#666" : (hover ? "#555" : "#444"),
    
    // ドラッグ中は半透明に
    opacity: isDragging ? 0.6 : 1,
    
    // ドラッグ中は少し縮小
    transform: isDragging ? "scale(0.95)" : "scale(1)",
    
    // ドラッグ中またはホバー中は影を濃く
    boxShadow: (isDragging || hover)
      ? "0 4px 8px rgba(0,0,0,0.5)"
      : "0 1px 3px rgba(0,0,0,0.3)",
  };

  return (
    <div
      ref={dragRef}
      style={itemStyle}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      data-testid={`toolbox-item-${name}`}
    >
      {name}
    </div>
  );
});

export default ToolboxItem;