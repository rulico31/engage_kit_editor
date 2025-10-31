// src/components/ToolboxItem.tsx

import React, { useRef } from "react"; // 1. useRef をインポート
import { useDrag } from "react-dnd";
import { ItemTypes } from "../ItemTypes"; // 先ほど定義した種類

// このコンポーネントが受け取るprops（名前）の型を定義
interface ToolboxItemProps {
  name: string;
}

const ToolboxItem: React.FC<ToolboxItemProps> = ({ name }) => {
  // 2. div要素への参照（ref）を作成
  const dragRef = useRef<HTMLDivElement>(null);

  // useDragフック（react-dndの機能）
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.TOOL, // ドラッグする種類
    item: { name }, // ドロップ先に渡すデータ (どのアイテムか)
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(), // ドラッグ中かどうかのフラグ
    }),
  }));

  // 3. dragコネクタ関数を、作成したrefに「接続」する
  drag(dragRef);

  return (
    // 4. divのrefには、drag関数ではなく、作成した dragRef を渡す
    <div
      ref={dragRef}
      className="tool-item"
      // ドラッグ中は少し透明にする
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      {name}
    </div>
  );
};

export default ToolboxItem;