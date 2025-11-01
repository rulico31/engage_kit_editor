// src/components/nodes/ActionNode.tsx

import React, { memo } from "react";
// Handle (接続点) と Position (位置) をインポート
import { Handle, Position, type NodeProps } from "reactflow";
import "./ActionNode.css"; // 専用のスタイルを読み込む

const ActionNode: React.FC<NodeProps> = ({ data }) => {
  return (
    <div className="action-node">
      {/* Handle (入力/Target)
        - type="target" (線を受け取る側)
        - position={Position.Left} (左側に配置)
      */}
      <Handle type="target" position={Position.Left} />

      {/* ノードの本文 */}
      <div className="action-node-label">{data.label || "アクション"}</div>

      {/* Handle (出力/Source)
        - type="source" (線を出す側)
        - position={Position.Right} (右側に配置)
      */}
      <Handle type="source" position={Position.Right} />
    </div>
  );
};

export default memo(ActionNode);