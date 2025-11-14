// src/components/nodes/EventNode.tsx

import React, { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import "./EventNode.css";

const EventNode: React.FC<NodeProps> = () => {
  return (
    <div className="event-node">
      {/* 常に「イベント」とだけ表示 */}
      <div>イベント</div>

      {/* 出力ハンドル */}
      <Handle type="source" position={Position.Right} />
    </div>
  );
};

export default memo(EventNode);