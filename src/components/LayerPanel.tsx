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
  const isSelected = selectedIds.includes(item.id);

  const handleClick = (e: React.MouseEvent) => {
    const multiSelect = e.ctrlKey || e.metaKey;
    onSelect(item.id, item.data.text || item.name, multiSelect);
  };

  return (
    <div
      className={`layer-item ${isSelected ? "selected" : ""}`}
      onClick={handleClick}
    >
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
  const placedItems = usePageStore(state => {
    const page = state.selectedPageId ? state.pages[state.selectedPageId] : undefined;
    return page?.placedItems || [];
  });

  const { selectedIds, handleItemSelect } = useSelectionStore(state => ({
    selectedIds: state.selectedIds,
    handleItemSelect: state.handleItemSelect,
  }));

  const displayItems = [...placedItems].reverse();

  return (
    <div className="layer-panel">
      <div className="layer-header">
        <span>レイヤー</span>
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