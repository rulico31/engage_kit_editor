import React, { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import { Timer, Hourglass } from "lucide-react";
import "./DelayNode.css";
import type { PropertyConfig } from "../../types";

const DelayNode: React.FC<NodeProps> = ({ data, isConnectable }) => {
  const duration = data.durationS || "1.0";

  return (
    <div className="delay-node">
      {/* 入力ハンドル (Left) */}
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="delay-node-handle"
      />

      <div className="delay-node-header">
        <Timer className="delay-node-icon" />
        <span className="delay-node-title">待機</span>
      </div>

      <div className="delay-node-body">
        <div className="delay-node-info-row">
          <span className="label">待機時間:</span>
        </div>
        <div className="delay-node-timer-display">
          <Hourglass className="timer-icon-small" />
          <span className="timer-value">{duration}秒</span>
        </div>
      </div>

      {/* 出力ハンドル (Right) */}
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="delay-node-handle"
      />
    </div>
  );
};

export default memo(DelayNode);

export const delayNodeConfig: any = {
  title: "遅延時間設定",
  properties: [
    {
      name: "durationS",
      label: "待機時間 (秒):",
      type: "text",
      defaultValue: "1.0",
      step: 0.1,
      min: 0,
    },
  ],
};