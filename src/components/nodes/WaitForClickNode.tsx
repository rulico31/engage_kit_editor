// src/components/nodes/WaitForClickNode.tsx

import React, { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import "./WaitForClickNode.css";

interface WaitForClickNodeProps extends NodeProps {}

const WaitForClickNode: React.FC<WaitForClickNodeProps> = ({
  data,
}) => {
  return (
    <div className="wait-for-click-node">
      {/* 入力ハンドル (フローを受け取る) */}
      <Handle type="target" position={Position.Left} />

      <div className="wait-for-click-node-header">
        👆 クリック待ち
      </div>
      
      <div className="wait-for-click-node-label">
        {data.label || "ターゲット未設定"}
      </div>

      {/* 出力ハンドル (クリック後に進む) */}
      <Handle type="source" position={Position.Right} />
    </div>
  );
};

export default memo(WaitForClickNode);