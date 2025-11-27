import React from "react";
import "./PropertiesPanel.css";
import "./NodePropertiesEditor.css";

// ストア
import { usePageStore } from "../stores/usePageStore";
import { useSelectionStore } from "../stores/useSelectionStore";

// 分割したコンポーネントのインポート
import { InspectorTabs } from "./properties/SharedComponents";
import { NodePropertiesEditor } from "./properties/NodePropertiesEditor";
import { ItemPropertiesEditor } from "./properties/ItemPropertiesEditor";

interface PropertiesPanelProps {
  onOpenBackgroundModal: (itemId: string, src: string) => void;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ onOpenBackgroundModal }) => {
  const { tabs, activeTabId, activeLogicGraphId } = useSelectionStore(state => ({
    tabs: state.tabs,
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
    };
  });
  
  const activeEntry = tabs.find((s) => s.id === activeTabId);
  let content = null;

  // --- 表示内容の切り替えロジック ---
  if (activeEntry && activeEntry.type === 'item') {
    const item = placedItems.find((p) => p.id === activeEntry.id);
    if (item) {
      content = (
        <ItemPropertiesEditor
          key={item.id} // keyを変えることで選択変更時にstateをリセット
          item={item}
          onItemUpdate={updateItem}
          onItemMoveToFront={moveItemToFront}
          onItemMoveToBack={moveItemToBack}
          onItemMoveForward={moveItemForward}
          onItemMoveBackward={moveItemBackward}
          onOpenBackgroundModal={onOpenBackgroundModal}
        />
      );
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
  
  if (!content) {
    content = <Placeholder>アイテムまたはノードを選択してください</Placeholder>;
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

const Placeholder: React.FC<{children: React.ReactNode}> = ({ children }) => (
  <div className="properties-panel-content">
    <div className="placeholder-text">{children}</div>
  </div>
);

export default React.memo(PropertiesPanel);