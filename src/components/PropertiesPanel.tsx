// src/components/PropertiesPanel.tsx

import React, { useState, useEffect } from "react";
// (★ 修正: NodeGraph も ../types からインポート)
import type { PlacedItemType, NodeGraph } from "../types";
// (★ 修正: App.tsx からの NodeGraph インポートを削除)
import type { Node } from "reactflow";
import "./PropertiesPanel.css";
import "./NodePropertiesEditor.css";

// --- (A) App.tsx から渡される Props (変更なし) ---
interface PropertiesPanelProps {
  selectedItemId: string | null;
  selectedNodeId: string | null;
  activeLogicGraphId: string | null;
  placedItems: PlacedItemType[];
  allItemLogics: Record<string, NodeGraph>;
  onItemUpdate: (itemId: string, updatedProps: Partial<PlacedItemType>) => void;
  onNodeDataChange: (nodeId: string, dataUpdate: any) => void;
}

// --- (B) ノード専用の編集UI (変更なし) ---
const NodePropertiesEditor: React.FC<{
  node: Node;
  placedItems: PlacedItemType[];
  onNodeDataChange: (nodeId: string, dataUpdate: any) => void;
}> = ({ node, placedItems, onNodeDataChange }) => {
  
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    onNodeDataChange(node.id, { [e.target.name]: e.target.value });
  };

  let editorUI = null;
  
  if (node.type === "actionNode") {
    editorUI = (
      <>
        <div className="prop-group">
          <label className="prop-label">ターゲット:</label>
          <select
            className="prop-select"
            name="targetItemId"
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
            name="mode"
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
  else if (node.type === "ifNode") {
    editorUI = (
      <>
        <div className="prop-group">
          <label className="prop-label">IF (もし):</label>
          <select
            className="prop-select"
            name="conditionTargetId"
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
            name="conditionType"
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
  else if (node.type === "eventNode") {
    editorUI = (
      <div className="placeholder-text">(このノードに設定項目はありません)</div>
    );
  }
  
  return (
    <div className="properties-panel-content">
      <div className="prop-group">
        <label className="prop-label">Node Type</label>
        <div className="prop-value-display">{node.type}</div>
      </div>
      <div className="prop-group">
        <label className="prop-label">Node Name</label>
        <div className="prop-value-display">{node.data.label}</div>
      </div>
      {editorUI}
    </div>
  );
};


// --- (C) UIアイテム編集用の型 (ローカルステート用) ---
type ItemEditValues = Omit<PlacedItemType, 'id' | 'x' | 'y' | 'width' | 'height'> & {
  x: string;
  y: string;
  width: string;
  height: string;
};

// --- (D) メインの PropertiesPanel (UIスイッチャー) ---
const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedItemId,
  selectedNodeId,
  activeLogicGraphId,
  placedItems,
  allItemLogics,
  onItemUpdate,
  onNodeDataChange,
}) => {
  
  // (1) UIアイテムが選択されている場合 (変更なし)
  if (selectedItemId) {
    const item = placedItems.find((p) => p.id === selectedItemId);
    
    // (A) 「Enterで確定」ロジック
    const [editValues, setEditValues] = useState<ItemEditValues | null>(null);
    useEffect(() => {
      if (item) {
        setEditValues({
          name: item.name,
          x: String(Math.round(item.x)),
          y: String(Math.round(item.y)),
          width: String(item.width),
          height: String(item.height),
        });
      } else {
        setEditValues(null);
      }
    }, [item]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!editValues) return;
      const { name, value } = e.target;
      setEditValues({ ...editValues, [name]: value, });
    };

    const commitChanges = () => {
      if (!item || !editValues) return;
      const newX = parseFloat(editValues.x) || 0;
      const newY = parseFloat(editValues.y) || 0;
      const newWidth = Math.max(1, parseFloat(editValues.width) || 1);
      const newHeight = Math.max(1, parseFloat(editValues.height) || 1);
      const newName = editValues.name;

      const hasChanged =
        item.name !== newName ||
        Math.round(item.x) !== newX ||
        Math.round(item.y) !== newY ||
        item.width !== newWidth ||
        item.height !== newHeight;

      if (hasChanged) {
        onItemUpdate(item.id, {
          name: newName, x: newX, y: newY, width: newWidth, height: newHeight,
        });
      } else if (
        editValues.x !== String(Math.round(item.x)) ||
        editValues.y !== String(Math.round(item.y)) ||
        editValues.width !== String(item.width) ||
        editValues.height !== String(item.height)
      ) {
         setEditValues({
          name: item.name,
          x: String(Math.round(item.x)),
          y: String(Math.round(item.y)),
          width: String(item.width),
          height: String(item.height),
        });
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        commitChanges();
        e.currentTarget.blur();
      }
    };
    const handleBlur = () => { commitChanges(); };
    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => { e.target.select(); };
    
    if (!item || !editValues) {
      return <div className="placeholder-text">...</div>;
    }
    
    return (
      <div className="properties-panel-content">
        <div className="prop-group">
          <div className="prop-label">Name</div>
          <input type="text" className="prop-input" name="name" value={editValues.name} onChange={handleChange} onKeyDown={handleKeyDown} onBlur={handleBlur} onFocus={handleFocus} />
        </div>
        <div className="prop-label">Position</div>
        <div className="prop-row">
          <div className="prop-group prop-group-half">
            <div className="prop-label-inline">X</div>
            <input type="number" className="prop-input" name="x" value={editValues.x} onChange={handleChange} onKeyDown={handleKeyDown} onBlur={handleBlur} onFocus={handleFocus} />
          </div>
          <div className="prop-group prop-group-half">
            <div className="prop-label-inline">Y</div>
            <input type="number" className="prop-input" name="y" value={editValues.y} onChange={handleChange} onKeyDown={handleKeyDown} onBlur={handleBlur} onFocus={handleFocus} />
          </div>
        </div>
        <div className="prop-label">Size</div>
        <div className="prop-row">
          <div className="prop-group prop-group-half">
            <div className="prop-label-inline">W</div>
            <input type="number" className="prop-input" name="width" value={editValues.width} onChange={handleChange} onKeyDown={handleKeyDown} onBlur={handleBlur} onFocus={handleFocus} />
          </div>
          <div className="prop-group prop-group-half">
            <div className="prop-label-inline">H</div>
            <input type="number" className="prop-input" name="height" value={editValues.height} onChange={handleChange} onKeyDown={handleKeyDown} onBlur={handleBlur} onFocus={handleFocus} />
          </div>
        </div>
      </div>
    );
  } 
  // (2) ノードが選択されている場合
  else if (selectedNodeId && activeLogicGraphId) {
    const logicTree = allItemLogics[activeLogicGraphId];
    if (!logicTree) return <div className="placeholder-text">ロジックツリーが見つかりません</div>;
    
    // (★ 修正: (n) を (n: Node) に変更)
    const node = logicTree.nodes.find((n: Node) => n.id === selectedNodeId);
    
    if (!node) return <div className="placeholder-text">ノードが見つかりません</div>;

    return (
      <NodePropertiesEditor
        node={node}
        placedItems={placedItems}
        onNodeDataChange={onNodeDataChange}
      />
    );
  } 
  // (3) 何も選択されていない場合 (変更なし)
  else {
    return (
      <div className="properties-panel-content">
        <div className="placeholder-text">アイテムまたはノードを選択してください</div>
      </div>
    );
  }
};

export default PropertiesPanel;

