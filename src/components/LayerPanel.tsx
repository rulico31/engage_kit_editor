// src/components/LayerPanel.tsx

import React from "react";
import { usePageStore } from "../stores/usePageStore";
import { useSelectionStore } from "../stores/useSelectionStore";
import "./LayerPanel.css";
import type { PlacedItemType } from "../types";

interface LayerItemProps {
  item: PlacedItemType;
  selectedIds: string[];
  onSelect: (id: string, label: string, multiSelect: boolean) => void;
}

const LayerItem: React.FC<LayerItemProps> = ({ 
  item, 
  selectedIds, 
  onSelect 
}) => {
  // IDが含まれているかで判定
  const isSelected = selectedIds.includes(item.id);

  const handleClick = (e: React.MouseEvent) => {
    const multiSelect = e.ctrlKey || e.metaKey;
    onSelect(item.id, item.data.text || item.name, multiSelect);
  };

  // グループの子ならインデント
  const isChild = !!item.groupId;

  return (
    <div
      className={`layer-item ${isSelected ? "selected" : ""}`}
      onClick={handleClick}
    >
      {isChild && <span className="layer-indent" />}
      <span className="layer-icon">
        {item.id.startsWith("group") ? "📁" : item.name.startsWith("画像") ? "🖼️" : "📄"}
      </span>
      <span className="layer-name">
        {item.data.text || item.name}
      </span>
    </div>
  );
};

export const LayerPanel: React.FC = () => {
  // ストアからデータを取得
  const { placedItems, groupItems, ungroupItems } = usePageStore(state => {
    const page = state.selectedPageId ? state.pages[state.selectedPageId] : undefined;
    return {
      placedItems: page?.placedItems || [],
      groupItems: state.groupItems,
      ungroupItems: state.ungroupItems,
    };
  });

  // ★ 修正: selection ではなく selectedIds を直接取得する
  const { selectedIds, handleItemSelect } = useSelectionStore(state => ({
    selectedIds: state.selectedIds,
    handleItemSelect: state.handleItemSelect,
  }));

  const handleGroup = () => {
    if (selectedIds.length > 1) {
      groupItems(selectedIds);
    }
  };

  const handleUngroup = () => {
    if (selectedIds.length === 1) {
      ungroupItems(selectedIds[0]);
    }
  };

  // レイヤーパネル用に表示順を逆にする（上が前面）
  const displayItems = [...placedItems].reverse();

  return (
    <div className="layer-panel">
      <div className="layer-header">
        <span>レイヤー</span>
        <div className="layer-actions">
          <button className="layer-action-btn" onClick={handleGroup} title="グループ化">G</button>
          <button className="layer-action-btn" onClick={handleUngroup} title="グループ解除">U</button>
        </div>
      </div>
      
      <div className="layer-list">
        {displayItems.map((item) => (
          <LayerItem
            key={item.id}
            item={item}
            selectedIds={selectedIds}
            onSelect={handleItemSelect}
          />
        ))}
      </div>
    </div>
  );
};