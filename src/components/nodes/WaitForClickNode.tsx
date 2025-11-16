// src/components/nodes/WaitForClickNode.tsx

import React, { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import "./WaitForClickNode.css";
import type { NodePropertyConfig } from "../../types"; // ★ 型をインポート

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

// ★ 以下をファイル末尾に追加
export const waitForClickNodeConfig: NodePropertyConfig = {
  title: "待機設定",
  properties: [
    {
      name: "targetItemId",
      label: "クリックを待つ対象:",
      type: "select", // (PropertiesPanel側で placedItems から options を生成)
    },
  ],
};