// src/components/nodes/ActionNode.tsx

import React, { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import "./ActionNode.css";
// (★ 削除)
// import type { PlacedItemType } from "../../types";
// ★ 型をインポート
import type { NodePropertyConfig } from "../../types";

// (★ 変更) Props の型から不要なものを削除
interface ActionNodeProps extends NodeProps {
  // (★ 削除) placedItems: PlacedItemType[];
  // (★ 削除) onDataChange: (nodeId: string, dataUpdate: any) => void;
}

const ActionNode: React.FC<ActionNodeProps> = ({
  id,
  data,
  // (★ 削除) placedItems,
  // (★ 削除) onDataChange,
}) => {
  // (★ 削除) すべてのハンドラを削除
  // const handleTargetChange = ...
  // const handleModeChange = ...

  return (
    <div className="action-node">
      {/* (入力ハンドル) */}
      <Handle type="target" position={Position.Left} />

      {/* ノードの本文 */}
      <div className="action-node-label">{data.label || "アクション"}</div>

      {/* (★ 削除) ここからドロップダウンUIをすべて削除 */}
      {/*
      <div className="action-node-select-wrapper">
        <label>ターゲット:</label>
        <select ... >
          ...
        </select>
      </div>
      <div className="action-node-select-wrapper">
        <label>モード:</label>
        <select ... >
          ...
        </select>
      </div>
      */}
      {/* (★ 削除) ここまで */}
      
      {/* (出力ハンドル) */}
      <Handle type="source" position={Position.Right} />
    </div>
  );
};

export default memo(ActionNode);

// ★ 以下をファイル末尾に追加
export const actionNodeConfig: NodePropertyConfig = {
  title: "ノード設定",
  properties: [
    {
      name: "targetItemId",
      label: "ターゲット:",
      type: "select", // (PropertiesPanel側で placedItems から options を生成)
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