import React, { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import { Database } from "lucide-react";
import "./SetVariableNode.css";

const SetVariableNode: React.FC<NodeProps> = ({ data, isConnectable }) => {
  const operationMode = data.operationMode || "variable";
  const variableName = data.variableName || "variable";
  const value = data.value || "0";
  const operation = data.operation || "set";
  const scoreValue = data.scoreValue || 0;
  const scoringReason = data.scoringReason || "";

  // 操作内容の表示テキストを生成
  const getOperationSummary = () => {
    if (operationMode === "score") {
      return `+${scoreValue}点`;
    }
    if (operation === "add") {
      return `+= ${value}`;
    }
    return `= ${value}`; // set
  };

  const operationSummary = getOperationSummary();
  const badgeText = operationMode === "score" ? "スコア" : (operation === "add" ? "加算" : "代入");
  const displayLabel = operationMode === "score" ? "エンゲージメント" : variableName;
  const displayReason = operationMode === "score" && scoringReason ? scoringReason : "";

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
        <span className="set-variable-node-title">{operationMode === "score" ? "スコア管理" : "変数操作"}</span>
        <span className="set-variable-node-badge">
          {badgeText}
        </span>
      </div>

      <div className="set-variable-node-body">
        <div className="set-variable-node-info-row">
          <span className="label">{operationMode === "score" ? "対象:" : "変数:"}</span>
          <span className="value variable-name" title={displayLabel}>{displayLabel}</span>
        </div>
        <div className="set-variable-node-code-block">
          <span className="code-variable">{displayLabel}</span>
          <span className="code-operator"> {operationSummary}</span>
        </div>
        {displayReason && (
          <div className="set-variable-node-info-row" style={{ marginTop: '4px', fontSize: '11px', color: '#aaa' }}>
            <span className="label">理由:</span>
            <span className="value" title={displayReason}>{displayReason}</span>
          </div>
        )}
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
      name: "operationMode",
      label: "設定モード:",
      type: "select",
      defaultValue: "variable",
      options: [
        { label: "変数の設定", value: "variable" },
        { label: "エンゲージメントスコアの設定", value: "score" },
      ],
    },
    // --- 変数モード用プロパティ ---
    {
      name: "variableName",
      label: "変数名:",
      type: "text",
      defaultValue: "score",
      visibleWhen: { operationMode: "variable" }, // 変数モードのみ表示
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
      visibleWhen: { operationMode: "variable" },
    },
    {
      name: "value",
      label: "値:",
      type: "text",
      defaultValue: "0",
      visibleWhen: { operationMode: "variable" },
    },
    // --- エンゲージメントスコアモード用プロパティ ---
    {
      name: "scoreValue",
      label: "エンゲージメントスコア:",
      type: "number",
      defaultValue: 10,
      min: 0,
      visibleWhen: { operationMode: "score" }, // スコアモードのみ表示
    },
    {
      name: "scoringReason",
      label: "スコア理由:",
      type: "text",
      defaultValue: "",
      visibleWhen: { operationMode: "score" },
    },
  ],
};
