// src/components/nodes/IfNode.tsx

import React, { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import "./IfNode.css";
import type { NodePropertyConfig } from "../../types";

// ★ 修正: id を削除
interface IfNodeProps extends NodeProps {}

const IfNode: React.FC<IfNodeProps> = ({
  data,
}) => {
  return (
    <div className="if-node">
      {/* (1) 入力ハンドル (左) */}
      <Handle type="target" position={Position.Left} />

      {/* ノードの本文 */}
      <div className="if-node-label">{data.label || "もし〜なら"}</div>
      
      {/* (3) 出力ハンドル (True / False) */}
      <div className="if-node-output-group">
        <div className="if-node-output-label">True (真)</div>
        <Handle
          type="source"
          position={Position.Right}
          id="true"
          style={{ top: "auto", bottom: 40 }}
        />
      </div>
      
      <div className="if-node-output-group">
        <div className="if-node-output-label">False (偽)</div>
        <Handle
          type="source"
          position={Position.Right}
          id="false"
          style={{ top: "auto", bottom: 15 }}
        />
      </div>
    </div>
  );
};

export default memo(IfNode);

export const ifNodeConfig: NodePropertyConfig = {
  title: "ノード設定",
  properties: [
    {
      name: "conditionSource",
      label: "比較対象のソース:",
      type: "select",
      defaultValue: "item",
      options: [
        { label: "アイテムのプロパティ", value: "item" },
        { label: "変数の値", value: "variable" },
      ],
    },
    {
      name: "conditionTargetId",
      label: "IF (もし):",
      type: "select",
      condition: {
        name: "conditionSource",
        value: "item",
      },
    },
    {
      name: "conditionType",
      label: "IS (が):",
      type: "select",
      defaultValue: "isVisible",
      options: [
        { label: "表示されている (True)", value: "isVisible" },
        { label: "非表示である (False)", value: "isHidden" },
      ],
      condition: {
        name: "conditionSource",
        value: "item",
      },
    },
    {
      name: "variableName",
      label: "変数名:",
      type: "text",
      defaultValue: "",
      condition: {
        name: "conditionSource",
        value: "variable",
      },
    },
    {
      name: "comparisonType",
      label: "種類 (として比較):",
      type: "select",
      defaultValue: "string",
      options: [
        { label: "文字列", value: "string" },
        { label: "数値", value: "number" },
      ],
      condition: {
        name: "conditionSource",
        value: "variable",
      },
    },
    {
      name: "comparison",
      label: "比較:",
      type: "select",
      defaultValue: "==",
      condition: {
        name: "conditionSource",
        value: "variable",
      },
    },
    {
      name: "comparisonValue",
      label: "比較する値:",
      type: "text",
      defaultValue: "",
      condition: {
        name: "conditionSource",
        value: "variable",
      },
    },
  ],
};