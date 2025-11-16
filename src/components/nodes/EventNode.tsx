// src/components/nodes/EventNode.tsx

import React, { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import "./EventNode.css";
import type { NodePropertyConfig } from "../../types"; // ★ 型をインポート

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

// ★ 以下をファイル末尾に追加
export const eventNodeConfig: NodePropertyConfig = {
  title: "イベント設定",
  properties: [
    {
      name: "eventType",
      label: "トリガーの種類:",
      type: "select", // (PropertiesPanel側で動的に options を生成)
      defaultValue: "click",
    },
  ],
};