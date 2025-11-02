// src/components/PropertiesPanel.tsx

import React from "react";
import type { PlacedItemType } from "../types";
import type { NodeGraph } from "../App";
import type { Node } from "reactflow";
import "./PropertiesPanel.css";
// (ノードエディタ用のCSSをインポート)
import "./NodePropertiesEditor.css";

// --- (A) App.tsx から渡される Props ---
interface PropertiesPanelProps {
  selectedItemId: string | null;
  selectedNodeId: string | null;
  activeLogicGraphId: string | null;
  placedItems: PlacedItemType[];
  allItemLogics: Record<string, NodeGraph>;
  onItemUpdate: (itemId: string, updatedProps: Partial<PlacedItemType>) => void;
  onNodeDataChange: (nodeId: string, dataUpdate: any) => void;
}

// --- (B) (タスク4) ノード専用の編集UI ---
const NodePropertiesEditor: React.FC<{
  node: Node;
  placedItems: PlacedItemType[];
  onNodeDataChange: (nodeId: string, dataUpdate: any) => void;
}> = ({ node, placedItems, onNodeDataChange }) => {
  
  // (汎用) データ変更ハンドラ
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    onNodeDataChange(node.id, { [e.target.name]: e.target.value });
  };

  // どのノードが選択されているかに基づいて、UIを切り替える
  let editorUI = null;
  
  // (1) アクションノード (表示/非表示)
  if (node.type === "actionNode") {
    editorUI = (
      <>
        <div className="prop-group">
          <label className="prop-label">ターゲット:</label>
          <select
            className="prop-select"
            name="targetItemId" // data.targetItemId に対応
            value={node.data.targetItemId || ""}
            onChange={handleChange}
          >
            <option value="">-- アイテムを選択 --</option>
            {placedItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
        <div className="prop-group">
          <label className="prop-label">モード:</label>
          <select
            className="prop-select"
            name="mode" // data.mode に対応
            value={node.data.mode || "show"}
            onChange={handleChange}
          >
            <option value="show">表示する</option>
            <option value="hide">非表示にする</option>
            <option value="toggle">切り替える</option>
          </select>
        </div>
      </>
    );
  }
  // (2) Ifノード (もし〜なら)
  else if (node.type === "ifNode") {
    editorUI = (
      <>
        <div className="prop-group">
          <label className="prop-label">IF (もし):</label>
          <select
            className="prop-select"
            name="conditionTargetId" // data.conditionTargetId に対応
            value={node.data.conditionTargetId || ""}
            onChange={handleChange}
          >
            <option value="">-- アイテムを選択 --</option>
            {placedItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
        <div className="prop-group">
          <label className="prop-label">IS (が):</label>
          <select
            className="prop-select"
            name="conditionType" // data.conditionType に対応
            value={node.data.conditionType || "isVisible"}
            onChange={handleChange}
          >
            <option value="isVisible">表示されている (True)</option>
            <option value="isHidden">非表示である (False)</option>
          </select>
        </div>
      </>
    );
  }
  // (3) イベントノード (設定項目なし)
  else if (node.type === "eventNode") {
    editorUI = (
      <div className="placeholder-text">(このノードに設定項目はありません)</div>
    );
  }
  
  return (
    <div className="properties-panel-content">
      <div className="prop-group">
        <label className="prop-label">Node Type</label>
        <div className="prop-value">{node.type}</div>
      </div>
      <div className="prop-group">
        <label className="prop-label">Node Name</label>
        <div className="prop-value">{node.data.label}</div>
      </div>
      
      {/* ノード固有のUI (ドロップダウンなど) */}
      {editorUI}
    </div>
  );
};


// --- (C) メインの PropertiesPanel (UIスイッチャー) ---
const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedItemId,
  selectedNodeId,
  activeLogicGraphId,
  placedItems,
  allItemLogics,
  onItemUpdate,
  onNodeDataChange,
}) => {
  
  // (1) UIアイテムが選択されている場合
  if (selectedItemId) {
    const item = placedItems.find((p) => p.id === selectedItemId);
    if (!item) return <div className="placeholder-text">アイテムが見つかりません</div>;

    // (アイテム編集UI)
    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => { onItemUpdate(item.id, { name: e.target.value }); };
    const handleXChange = (e: React.ChangeEvent<HTMLInputElement>) => { onItemUpdate(item.id, { x: e.target.valueAsNumber || 0 }); };
    const handleYChange = (e: React.ChangeEvent<HTMLInputElement>) => { onItemUpdate(item.id, { y: e.target.valueAsNumber || 0 }); };
    const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => { onItemUpdate(item.id, { width: e.target.valueAsNumber || 1 }); };
    const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => { onItemUpdate(item.id, { height: e.target.valueAsNumber || 1 }); };
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === "Enter") e.currentTarget.blur(); };
    const handleBlur = () => { /* (ロジックは不要になった) */ };
    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => { e.target.select(); };

    return (
      <div className="properties-panel-content">
        <div className="prop-group">
          <div className="prop-label">Name</div>
          <input type="text" className="prop-input" value={item.name} onChange={handleNameChange} onKeyDown={handleKeyDown} onBlur={handleBlur} onFocus={handleFocus} />
        </div>
        <div className="prop-label">Position</div>
        <div className="prop-row">
          <div className="prop-group prop-group-half">
            <div className="prop-label-inline">X</div>
            <input type="number" className="prop-input" value={Math.round(item.x)} onChange={handleXChange} onKeyDown={handleKeyDown} onBlur={handleBlur} onFocus={handleFocus} />
          </div>
          <div className="prop-group prop-group-half">
            <div className="prop-label-inline">Y</div>
            <input type="number" className="prop-input" value={Math.round(item.y)} onChange={handleYChange} onKeyDown={handleKeyDown} onBlur={handleBlur} onFocus={handleFocus} />
          </div>
        </div>
        <div className="prop-label">Size</div>
        <div className="prop-row">
          <div className="prop-group prop-group-half">
            <div className="prop-label-inline">W</div>
            <input type="number" className="prop-input" value={item.width} onChange={handleWidthChange} onKeyDown={handleKeyDown} onBlur={handleBlur} onFocus={handleFocus} />
          </div>
          <div className="prop-group prop-group-half">
            <div className="prop-label-inline">H</div>
            <input type="number" className="prop-input" value={item.height} onChange={handleHeightChange} onKeyDown={handleKeyDown} onBlur={handleBlur} onFocus={handleFocus} />
          </div>
        </div>
      </div>
    );

  } 
  // (2) ノードが選択されている場合
  else if (selectedNodeId && activeLogicGraphId) {
    const logicTree = allItemLogics[activeLogicGraphId];
    if (!logicTree) return <div className="placeholder-text">ロジックツリーが見つかりません</div>;
    
    const node = logicTree.nodes.find((n) => n.id === selectedNodeId);
    if (!node) return <div className="placeholder-text">ノードが見つかりません</div>;

    // (タスク4) ノード専用エディタをレンダリング
    return (
      <NodePropertiesEditor
        node={node}
        placedItems={placedItems}
        onNodeDataChange={onNodeDataChange}
      />
    );

  } 
  // (3) 何も選択されていない場合
  else {
    return (
      <div className="properties-panel-content">
        <div className="placeholder-text">アイテムまたはノードを選択してください</div>
      </div>
    );
  }
};

export default PropertiesPanel;