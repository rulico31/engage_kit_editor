// src/components/nodes/IfNode.tsx

import React, { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import "./IfNode.css";
// (★ 削除)
// import type { PlacedItemType } from "../../types";

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