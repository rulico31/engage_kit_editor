// src/components/nodes/ActionNode.tsx

import React, { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import "./ActionNode.css";
import type { PlacedItemType } from "../../types";

// (NodeEditor から注入される Props)
interface ActionNodeProps extends NodeProps {
  placedItems: PlacedItemType[];
  onDataChange: (nodeId: string, dataUpdate: any) => void;
}

const ActionNode: React.FC<ActionNodeProps> = ({
  id,
  data,
  placedItems,
  onDataChange,
}) => {
  const handleTargetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onDataChange(id, { targetItemId: e.target.value });
  };

  const handleModeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onDataChange(id, { mode: e.target.value });
  };

  return (
    <div className="action-node">
      {/* (入力ハンドル) */}
      <Handle type="target" position={Position.Left} />

      {/* ノードの本文 */}
      <div className="action-node-label">{data.label || "アクション"}</div>

      {/* (ターゲット選択用ドロップダウン) */}
      <div className="action-node-select-wrapper">
        <label>ターゲット:</label>
        <select
          className="action-node-select"
          value={data.targetItemId || ""}
          onChange={handleTargetChange}
          onMouseDown={(e) => e.stopPropagation()} 
        >
          <option value="">-- アイテムを選択 --</option>
          {placedItems.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </div>

      {/* (モード選択用ドロップダウン) */}
      <div className="action-node-select-wrapper">
        <label>モード:</label>
        <select
          className="action-node-select"
          value={data.mode || "show"}
          onChange={handleModeChange}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <option value="show">表示する</option>
          <option value="hide">非表示にする</option>
          <option value="toggle">切り替える</option>
        </select>
      </div>

      {/* (出力ハンドル) */}
      <Handle type="source" position={Position.Right} />
    </div>
  );
};

export default memo(ActionNode);