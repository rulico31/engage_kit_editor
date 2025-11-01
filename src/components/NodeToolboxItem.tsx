// src/components/NodeToolboxItem.tsx

import React, { memo, useRef } from "react"; // (1) useRef をインポート
import { useDrag } from "react-dnd";
import { ItemTypes } from "../ItemTypes";

interface NodeToolboxItemProps {
  nodeType: string;
  nodeName: string;
  children: React.ReactNode;
}

const NodeToolboxItem: React.FC<NodeToolboxItemProps> = memo(
  ({ nodeType, nodeName, children }) => {
    
    // (2) ref を作成
    const dragRef = useRef<HTMLDivElement>(null);

    const [{ isDragging }, drag] = useDrag(() => ({
      type: ItemTypes.NODE_TOOL,
      item: { nodeType, nodeName },
      collect: (monitor) => ({
        isDragging: !!monitor.isDragging(),
      }),
    }));

    // (3) drag コネクタを ref に接続
    drag(dragRef);

    return (
      <div
        ref={dragRef} // (4) div には dragRef を渡す
        className="toolbox-item"
        style={{ opacity: isDragging ? 0.5 : 1 }}
      >
        {children}
      </div>
    );
  }
);

export default NodeToolboxItem;