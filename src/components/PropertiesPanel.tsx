import React from "react";
import "./PropertiesPanel.css";
import "./NodePropertiesEditor.css";

// ストア
import { usePageStore } from "../stores/usePageStore";
import { useSelectionStore } from "../stores/useSelectionStore";
import type { SelectionEntry } from "../types"; // 型定義をインポート

// 分割したコンポーネントのインポート
import { InspectorTabs } from "./properties/SharedComponents";
import { NodePropertiesEditor } from "./properties/NodePropertiesEditor";
import { ItemPropertiesEditor } from "./properties/ItemPropertiesEditor";
import { PagePropertiesEditor } from "./properties/PagePropertiesEditor";

const PropertiesPanel: React.FC = () => {
  const { tabs, activeTabId, activeLogicGraphId } = useSelectionStore(state => ({
    tabs: state.tabs || [], // 安全のためデフォルト値を設定
    activeTabId: state.activeTabId,
    activeLogicGraphId: state.activeLogicGraphId,
  }));

  const {
    placedItems,
    allItemLogics,
    updateItem,
    moveItemToFront,
    moveItemToBack,
    moveItemForward,
    moveItemBackward,
    selectedPageId,
  } = usePageStore(s => {
    const page = s.selectedPageId ? s.pages[s.selectedPageId] : undefined;
    return {
      placedItems: page?.placedItems ?? [],
      allItemLogics: page?.allItemLogics ?? {},
      updateItem: s.updateItem,
      moveItemToFront: s.moveItemToFront,
      moveItemToBack: s.moveItemToBack,
      moveItemForward: s.moveItemForward,
      moveItemBackward: s.moveItemBackward,
      selectedPageId: s.selectedPageId,
    };
  });

  // 's' に型注釈を追加して any エラーを解消
  const activeEntry = tabs.find((s: SelectionEntry) => s.id === activeTabId);

  let content = null;

  if (activeEntry && activeEntry.type === 'item') {
    const item = placedItems.find((p) => p.id === activeEntry.id);
    if (item) {
      content = (
        <ItemPropertiesEditor
          key={item.id}
          item={item}
          onItemUpdate={updateItem}
          onItemMoveToFront={moveItemToFront}
          onItemMoveToBack={moveItemToBack}
          onItemMoveForward={moveItemForward}
          onItemMoveBackward={moveItemBackward}
        />
      );
    } else {
      // Item selected but not found in current page
      content = <div className="properties-panel-content">Item not found (ID: {activeEntry.id})</div>;
    }
  }
  else if (activeEntry && activeEntry.type === 'node') {
    if (!activeLogicGraphId || !allItemLogics) {
      content = <Placeholder>ノードデータ読込中...</Placeholder>;
    } else {
      const logicTree = allItemLogics[activeLogicGraphId];
      if (logicTree) {
        const node = logicTree.nodes.find((n) => n.id === activeEntry.id);
        if (node) {
          content = <NodePropertiesEditor node={node} />;
        } else {
          content = <Placeholder>選択されたノードが見つかりません</Placeholder>;
        }
      } else {
        content = <Placeholder>ロジックツリーが見つかりません</Placeholder>;
      }
    }
  }

  // If no content (nothing selected), show Page Properties
  if (!activeEntry && !content) {
    content = <PagePropertiesEditor pageId={selectedPageId || ""} />;
  }

  return (
    <div className="panel-content-wrapper">
      <InspectorTabs />
      <div className="panel-content-scrollable">
        {content}
      </div>
    </div>
  );
};

const Placeholder: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="properties-panel-content">
    <div className="placeholder-text">{children}</div>
  </div>
);

export default React.memo(PropertiesPanel);