import React, { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import { Database } from "lucide-react";
import "./SetVariableNode.css";
import type { PropertyConfig } from "../../types";

const SetVariableNode: React.FC<NodeProps> = ({ data, isConnectable }) => {
  const variableName = data.variableName || "variable";
  const value = data.value || "0";
  const operation = data.operation || "set";

  // 操作内容の表示テキストを生成
  const getOperationSummary = () => {
    if (operation === "add") {
      return `+= ${value}`;
    }
    return `= ${value}`; // set
  };

  const operationSummary = getOperationSummary();

  return (
    <div className="set-variable-node">
      {/* 入力ハンドル (Left) */}
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="set-variable-node-handle"
      />

      <div className="set-variable-node-header">
        <Database className="set-variable-node-icon" />
        <span className="set-variable-node-title">変数操作</span>
        <span className="set-variable-node-badge">
          {operation === "add" ? "加算" : "代入"}
        </span>
      </div>

      <div className="set-variable-node-body">
        <div className="set-variable-node-info-row">
          <span className="label">変数:</span>
          <span className="value variable-name" title={variableName}>{variableName}</span>
        </div>
        <div className="set-variable-node-code-block">
          <span className="code-variable">{variableName}</span>
          <span className="code-operator"> {operationSummary}</span>
        </div>
      </div>

      {/* 出力ハンドル (Right) */}
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="set-variable-node-handle"
      />
    </div>
  );
};

export default memo(SetVariableNode);

export const setVariableNodeConfig: any = {
  title: "変数操作設定",
  properties: [
    {
      name: "variableName",
      label: "変数名:",
      type: "text",
      defaultValue: "score",
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
      defaultValue: "0",
    },
  ],
};