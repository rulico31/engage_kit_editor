// src/components/nodes/DelayNode.tsx

import React, { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import "./DelayNode.css"; // (★ 新規作成)

interface DelayNodeProps extends NodeProps {}

const DelayNode: React.FC<DelayNodeProps> = ({
  data,
}) => {
  return (
    <div className="delay-node">
      {/* (入力ハンドル) */}
      <Handle type="target" position={Position.Left} />

      {/* ノードの本文 */}
      <div className="delay-node-label">
        {data.label || "⏱️ 遅延"}
      </div>

      {/* (設定はプロパティパネルで行う) */}
      
      {/* (出力ハンドル) */}
      <Handle type="source" position={Position.Right} />
    </div>
  );
};

export default memo(DelayNode);