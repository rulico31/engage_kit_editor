// src/components/nodes/SetVariableNode.tsx

import React, { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import "./SetVariableNode.css"; // (★ 対応するCSSを次に作成します)
import type { NodePropertyConfig } from "../../types"; // ★ 型をインポート

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

// ★ 以下をファイル末尾に追加
export const setVariableNodeConfig: NodePropertyConfig = {
  title: "ノード設定",
  properties: [
    {
      name: "variableName",
      label: "変数名:",
      type: "text",
      defaultValue: "",
    },
    {
      name: "operation",
      label: "操作:",
      type: "select",
      defaultValue: "set",
      options: [
        { label: "= (代入)", value: "set" },
        { label: "+ (加算)", value: "add" },
      ],
    },
    {
      name: "value",
      label: "値:",
      type: "text",
      defaultValue: "",
    },
  ],
};