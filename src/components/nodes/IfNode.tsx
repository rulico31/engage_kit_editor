// src/components/nodes/IfNode.tsx

import React, { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import "./IfNode.css";
import type { PlacedItemType } from "../../types";

// (NodeEditor から注入される Props)
interface IfNodeProps extends NodeProps {
  placedItems: PlacedItemType[];
  onDataChange: (nodeId: string, dataUpdate: any) => void;
}

const IfNode: React.FC<IfNodeProps> = ({
  id,
  data,
  placedItems,
  onDataChange,
}) => {
  const handleTargetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onDataChange(id, { conditionTargetId: e.target.value });
  };

  const handleConditionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onDataChange(id, { conditionType: e.target.value });
  };

  return (
    <div className="if-node">
      {/* (1) 入力ハンドル (左) */}
      <Handle type="target" position={Position.Left} />

      {/* ノードの本文 */}
      <div className="if-node-label">{data.label || "もし〜なら"}</div>
      
      {/* (2) 条件入力をドロップダウンに変更 */}
      <div className="if-node-condition">
        <label>IF (もし):</label>
        <select 
          className="if-node-select" 
          value={data.conditionTargetId || ""}
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
        
        <label>IS (が):</label>
        <select 
          className="if-node-select" 
          value={data.conditionType || "isVisible"}
          onChange={handleConditionChange}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <option value="isVisible">表示されている (True)</option>
          <option value="isHidden">非表示である (False)</option>
        </select>
      </div>

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