// src/components/nodes/DelayNode.tsx

import React, { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import "./DelayNode.css"; // (★ 新規作成)
import type { NodePropertyConfig } from "../../types"; // ★ 型をインポート

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

// ★ 以下をファイル末尾に追加
export const delayNodeConfig: NodePropertyConfig = {
  title: "ノード設定",
  properties: [
    {
      name: "durationS",
      label: "遅延 (秒)",
      type: "number",
      defaultValue: 1.0,
      step: 0.1,
      min: 0,
    },
  ],
};