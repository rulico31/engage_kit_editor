// src/components/nodes/ActionNode.tsx

import React, { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import "./ActionNode.css";
import type { NodePropertyConfig } from "../../types";

// ★ 修正: id を削除 (または _id とする)
interface ActionNodeProps extends NodeProps {}

const ActionNode: React.FC<ActionNodeProps> = ({
  data,
}) => {
  return (
    <div className="action-node">
      {/* (入力ハンドル) */}
      <Handle type="target" position={Position.Left} />

      {/* ノードの本文 */}
      <div className="action-node-label">{data.label || "アクション"}</div>
      
      {/* (出力ハンドル) */}
      <Handle type="source" position={Position.Right} />
    </div>
  );
};

export default memo(ActionNode);

// ★ 設定オブジェクトは変更なし
export const actionNodeConfig: NodePropertyConfig = {
  title: "ノード設定",
  properties: [
    {
      name: "targetItemId",
      label: "ターゲット:",
      type: "select", 
    },
    {
      name: "mode",
      label: "モード:",
      type: "select",
      defaultValue: "show",
      options: [
        { label: "表示する", value: "show" },
        { label: "非表示にする", value: "hide" },
        { label: "切り替える", value: "toggle" },
      ],
    },
  ],
};