// src/components/nodes/AnimateNode.tsx

import React, { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import "./AnimateNode.css"; // (★ 対応するCSSを次に作成します)

interface AnimateNodeProps extends NodeProps {}

const AnimateNode: React.FC<AnimateNodeProps> = ({
  data,
}) => {
  return (
    <div className="animate-node">
      {/* (入力ハンドル) */}
      <Handle type="target" position={Position.Left} />

      {/* ノードの本文 */}
      <div className="animate-node-label">
        {data.label || "アニメーション"}
      </div>

      {/* (設定はプロパティパネルで行う) */}
      
      {/* (出力ハンドル) */}
      <Handle type="source" position={Position.Right} />
    </div>
  );
};

export default memo(AnimateNode);