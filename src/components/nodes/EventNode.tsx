// src/components/nodes/EventNode.tsx

import React, { memo } from "react";
// Handle はノードの「接続点」
import { Handle, Position, type NodeProps } from "reactflow";
import "./EventNode.css";

// memo でラップし、不要な再描画を防ぎます
const EventNode: React.FC<NodeProps> = ({ data }) => {
  return (
    <div className="event-node">
      {/* ノードの本文 */}
      <div>{data.label || "イベントノード"}</div>

      {/* Handle (接続点)
        - type="source" (ここから線が出る)
        - position={Position.Right} (右側に配置)
      */}
      <Handle type="source" position={Position.Right} />
    </div>
  );
};

export default memo(EventNode);