// src/components/nodes/IfNode.tsx

import React, { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import "./IfNode.css";
// ↓↓↓↓↓↓↓↓↓↓ (1) 必要な型をインポート ↓↓↓↓↓↓↓↓↓↓
import type { PlacedItemType } from "../../types";
// ↑↑↑↑↑↑↑↑↑↑ ここまで ↑↑↑↑↑↑↑↑↑↑

// ↓↓↓↓↓↓↓↓↓↓ (2) NodeEditor から注入される Props を定義 ↓↓↓↓↓↓↓↓↓↓
interface IfNodeProps extends NodeProps {
  placedItems: PlacedItemType[];
  onDataChange: (nodeId: string, dataUpdate: any) => void;
}
// ↑↑↑↑↑↑↑↑↑↑ ここまで ↑↑↑↑↑↑↑↑↑↑

const IfNode: React.FC<IfNodeProps> = ({
  id, // ノード自身のID
  data, // data.label, data.conditionTargetId など
  placedItems,
  onDataChange,
}) => {

  // --- (3) ハンドラを定義 ---
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
      
      {/* ↓↓↓↓↓↓↓↓↓↓ (4) 条件入力をドロップダウンに変更 ↓↓↓↓↓↓↓↓↓↓ */}
      <div className="if-node-condition">
        <label>IF (もし):</label>
        {/* どのアイテムを条件にするか */}
        <select 
          className="if-node-select" 
          value={data.conditionTargetId || ""} // 保存された値
          onChange={handleTargetChange}
          onMouseDown={(e) => e.stopPropagation()} // ドラッグを止める
        >
          <option value="">-- アイテムを選択 --</option>
          {placedItems.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        
        {/* どういう条件か */}
        <label>IS (が):</label>
        <select 
          className="if-node-select" 
          value={data.conditionType || "isVisible"} // 保存された値
          onChange={handleConditionChange}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <option value="isVisible">表示されている (True)</option>
          <option value="isHidden">非表示である (False)</option>
          {/* (将来的に「クリックされた」などのトリガーも追加可能) */}
        </select>
      </div>
      {/* ↑↑↑↑↑↑↑↑↑↑ ここまで ↑↑↑↑↑↑↑↑↑↑ */}

      {/* (5) 出力ハンドル (True / False) - 変更なし */}
      <div className="if-node-output-group">
        <div className="if-node-output-label">True (真)</div>
        <Handle
          type="source"
          position={Position.Right}
          id="true" // Handleに一意のIDを付与
          style={{ top: "auto", bottom: 40 }} // 位置調整
        />
      </div>
      
      <div className="if-node-output-group">
        <div className="if-node-output-label">False (偽)</div>
        <Handle
          type="source"
          position={Position.Right}
          id="false" // Handleに一意のIDを付与
          style={{ top: "auto", bottom: 15 }} // 位置調整
        />
      </div>
    </div>
  );
};

export default memo(IfNode);