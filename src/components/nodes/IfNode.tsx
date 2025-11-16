// src/components/nodes/IfNode.tsx

import React, { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import "./IfNode.css";
// (★ 削除)
// import type { PlacedItemType } from "../../types";
import type { NodePropertyConfig } from "../../types"; // ★ 型をインポート

// (★ 変更) Props の型から不要なものを削除
interface IfNodeProps extends NodeProps {
  // (★ 削除) placedItems: PlacedItemType[];
  // (★ 削除) onDataChange: (nodeId: string, dataUpdate: any) => void;
}

const IfNode: React.FC<IfNodeProps> = ({
  id,
  data,
  // (★ 削除) placedItems,
  // (★ 削除) onDataChange,
}) => {
  // (★ 削除) すべてのハンドラを削除
  // const handleTargetChange = ...
  // const handleConditionChange = ...

  return (
    <div className="if-node">
      {/* (1) 入力ハンドル (左) */}
      <Handle type="target" position={Position.Left} />

      {/* ノードの本文 */}
      <div className="if-node-label">{data.label || "もし〜なら"}</div>
      
      {/* (★ 削除) ここからドロップダウンUIをすべて削除 */}
      {/*
      <div className="if-node-condition">
        <label>IF (もし):</label>
        <select ... >
          ...
        </select>
        
        <label>IS (が):</label>
        <select ... >
          ...
        </select>
      </div>
      */}
      {/* (★ 削除) ここまで */}

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

// ★ 以下をファイル末尾に追加
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
    // --- アイテムのプロパティ ---
    {
      name: "conditionTargetId",
      label: "IF (もし):",
      type: "select", // (PropertiesPanel側で placedItems から options を生成)
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
    // --- 変数の値 ---
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
      type: "select", // (PropertiesPanel側で comparisonType に応じて options を生成)
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