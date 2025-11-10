// src/components/nodes/SetVariableNode.tsx

import React, { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import "./SetVariableNode.css"; // (★ 対応するCSSを次に作成します)

// (Props は NodeProps のみ)
interface SetVariableNodeProps extends NodeProps {}

const SetVariableNode: React.FC<SetVariableNodeProps> = ({
  data,
}) => {
  return (
    <div className="set-variable-node">
      {/* (入力ハンドル) */}
      <Handle type="target" position={Position.Left} />

      {/* ノードの本文 */}
      <div className="set-variable-node-label">
        {data.label || "変数をセット"}
      </div>

      {/* (設定はプロパティパネルで行うため、ここにはUIなし) */}
      
      {/* (出力ハンドル) */}
      <Handle type="source" position={Position.Right} />
    </div>
  );
};

export default memo(SetVariableNode);