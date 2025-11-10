// src/components/PropertiesPanel.tsx

import React, { useState, useRef, useEffect } from "react";
import type { PlacedItemType, PageInfo, SelectionEntry } from "../types";
import type { NodeGraph } from "../App.tsx";
import type { Node } from "reactflow";
import "./PropertiesPanel.css";
// (ノードエディタ用のCSSをインポート)
import "./NodePropertiesEditor.css";

// (★ 変更なし) アコーディオンコンポーネント
interface AccordionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}
const AccordionSection: React.FC<AccordionProps> = ({
  title,
  children,
  defaultOpen = true,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="accordion-section">
      <div className="accordion-header" onClick={() => setIsOpen(!isOpen)}>
        <span className={`accordion-icon ${isOpen ? "is-open" : ""}`}>▼</span>
        <span className="accordion-title">{title}</span>
      </div>
      {isOpen && <div className="accordion-content">{children}</div>}
    </div>
  );
};

// (★ 変更なし) タブUIコンポーネント
interface InspectorTabsProps {
  selection: SelectionEntry[];
  activeTabId: string | null;
  onTabSelect: (id: string) => void;
  onTabClose: (id: string) => void;
}
const InspectorTabs: React.FC<InspectorTabsProps> = ({
  selection,
  activeTabId,
  onTabSelect,
  onTabClose,
}) => {
  const tabsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = tabsContainerRef.current;
    if (!container) return;
    const handleWheel = (e: WheelEvent) => {
      if (e.deltaX !== 0) return;
      if (e.deltaY !== 0) {
        e.preventDefault();
        container.scrollLeft += e.deltaY;
      }
    };
    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, []);
  
  if (selection.length === 0) {
    return null; // タブがなければ何も表示しない
  }

  return (
    <div className="inspector-tabs-container" ref={tabsContainerRef}>
      {selection.map((entry) => (
        <div
          key={entry.id}
          className={`inspector-tab ${entry.id === activeTabId ? "is-active" : ""}`}
          onClick={() => onTabSelect(entry.id)}
        >
          <span className="tab-label">{entry.label}</span>
          <span
            className="tab-close"
            onClick={(e) => {
              e.stopPropagation(); // 親の onTabSelect を発火させない
              onTabClose(entry.id);
            }}
          >
            ×
          </span>
        </div>
      ))}
    </div>
  );
};

// --- (A) App.tsx から渡される Props ---
interface PropertiesPanelProps {
  selection: SelectionEntry[];
  activeTabId: string | null;
  activeLogicGraphId: string | null;
  onTabSelect: (id: string) => void;
  onTabClose: (id: string) => void;
  placedItems: PlacedItemType[];
  allItemLogics: Record<string, NodeGraph>;
  onItemUpdate: (itemId: string, updatedProps: Partial<PlacedItemType>) => void;
  onNodeDataChange: (nodeId: string, dataUpdate: any) => void;
  pageInfoList: PageInfo[];
}

// --- (B) ノード専用の編集UI ---
const NodePropertiesEditor: React.FC<{
  node: Node;
  placedItems: PlacedItemType[];
  onNodeDataChange: (nodeId: string, dataUpdate: any) => void;
  pageInfoList: PageInfo[];
}> = ({ node, placedItems, onNodeDataChange, pageInfoList }) => {
  
  // (汎用) データ変更ハンドラ
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    onNodeDataChange(node.id, { [e.target.name]: e.target.value });
  };
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") e.currentTarget.blur();
  };
  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  // どのノードが選択されているかに基づいて、UIを切り替える
  let editorUI: React.ReactNode | null = null;
  
  // (1) アクションノード (表示/非表示)
  if (node.type === "actionNode") {
    editorUI = (
      <AccordionSection title="ノード設定" defaultOpen={true}>
        <div className="prop-group">
          <label className="prop-label">ターゲット:</label>
          <select
            className="prop-select"
            name="targetItemId" // data.targetItemId に対応
            value={node.data.targetItemId || ""}
            onChange={handleChange}
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
        <div className="prop-group">
          <label className="prop-label">モード:</label>
          <select
            className="prop-select"
            name="mode" // data.mode に対応
            value={node.data.mode || "show"}
            onChange={handleChange}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <option value="show">表示する</option>
            <option value="hide">非表示にする</option>
            <option value="toggle">切り替える</option>
          </select>
        </div>
      </AccordionSection>
    );
  }
  // (2) Ifノード (もし〜なら)
  else if (node.type === "ifNode") {
    const conditionSource = node.data.conditionSource || 'item'; // デフォルトは 'item'
    
    editorUI = (
      <AccordionSection title="ノード設定" defaultOpen={true}>
        <div className="prop-group">
          <label className="prop-label">比較対象のソース:</label>
          <select
            className="prop-select"
            name="conditionSource"
            value={conditionSource}
            onChange={handleChange}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <option value="item">アイテムのプロパティ</option>
            <option value="variable">変数の値</option>
          </select>
        </div>
        
        {/* (A) アイテムのプロパティを比較する場合 */}
        {conditionSource === 'item' && (
          <>
            <div className="prop-group">
              <label className="prop-label">IF (もし):</label>
              <select
                className="prop-select"
                name="conditionTargetId" // data.conditionTargetId に対応
                value={node.data.conditionTargetId || ""}
                onChange={handleChange}
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
            <div className="prop-group">
              <label className="prop-label">IS (が):</label>
              <select
                className="prop-select"
                name="conditionType" // data.conditionType に対応
                value={node.data.conditionType || "isVisible"}
                onChange={handleChange}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <option value="isVisible">表示されている (True)</option>
                <option value="isHidden">非表示である (False)</option>
              </select>
            </div>
          </>
        )}
        
        {/* (B) 変数の値を比較する場合 */}
        {conditionSource === 'variable' && (
          <>
            <div className="prop-group">
              <label className="prop-label">変数名:</label>
              <input
                type="text"
                className="prop-input"
                name="variableName"
                value={node.data.variableName || ""}
                onChange={handleChange}
                onKeyDown={handleInputKeyDown}
                onFocus={handleInputFocus}
                placeholder="例: score"
              />
            </div>
            <div className="prop-group">
              <label className="prop-label">比較:</label>
              <select
                className="prop-select"
                name="comparison"
                value={node.data.comparison || "=="}
                onChange={handleChange}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <option value="==">== (等しい)</option>
                <option value="!=">!= (等しくない)</option>
                <option value=">">&gt; (より大きい)</option>
                <option value=">=">&gt;= (以上)</option>
                <option value="<">&lt; (より小さい)</option>
                <option value="<=">&lt;= (以下)</option>
                <option value="contains">含む (文字列)</option>
                <option value="not_contains">含まない (文字列)</option>
              </select>
            </div>
            <div className="prop-group">
              <label className="prop-label">比較する値:</label>
              <input
                type="text"
                className="prop-input"
                name="comparisonValue"
                value={node.data.comparisonValue || ""}
                onChange={handleChange}
                onKeyDown={handleInputKeyDown}
                onFocus={handleInputFocus}
                placeholder="例: 100 や true"
              />
            </div>
          </>
        )}
      </AccordionSection>
    );
  }
  // (3) ページ遷移ノード
  else if (node.type === "pageNode") {
    editorUI = (
      <AccordionSection title="ノード設定" defaultOpen={true}>
        <div className="prop-group">
          <label className="prop-label">遷移先ページ:</label>
          <select
            className="prop-select"
            name="targetPageId" // data.targetPageId に対応
            value={node.data.targetPageId || ""}
            onChange={handleChange}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <option value="">-- ページを選択 --</option>
            {pageInfoList.map((page) => (
              <option key={page.id} value={page.id}>
                {page.name}
              </option>
            ))}
          </select>
        </div>
      </AccordionSection>
    );
  }
  // (4) 変数セットノード
  else if (node.type === "setVariableNode") {
    editorUI = (
      <AccordionSection title="ノード設定" defaultOpen={true}>
        <div className="prop-group">
          <label className="prop-label">変数名:</label>
          <input
            type="text"
            className="prop-input"
            name="variableName"
            value={node.data.variableName || ""}
            onChange={handleChange}
            onKeyDown={handleInputKeyDown}
            onFocus={handleInputFocus}
            placeholder="例: score"
          />
        </div>
        <div className="prop-group">
          <label className="prop-label">操作:</label>
          <select
            className="prop-select"
            name="operation"
            value={node.data.operation || "set"}
            onChange={handleChange}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <option value="set">= (代入)</option>
            <option value="add">+ (加算)</option>
          </select>
        </div>
        <div className="prop-group">
          <label className="prop-label">値:</label>
          <input
            type="text"
            className="prop-input"
            name="value"
            value={node.data.value || ""}
            onChange={handleChange}
            onKeyDown={handleInputKeyDown}
            onFocus={handleInputFocus}
            placeholder="例: 10 や Taro"
          />
        </div>
      </AccordionSection>
    );
  }
  // ↓↓↓↓↓↓↓↓↓↓ (★ 追加) AnimateNode用のUI ↓↓↓↓↓↓↓↓↓↓
  // (5) アニメーションノード
  else if (node.type === "animateNode") {
    editorUI = (
      <>
        <AccordionSection title="▼ ターゲット" defaultOpen={true}>
          <div className="prop-group">
            <label className="prop-label">ターゲット:</label>
            <select
              className="prop-select"
              name="targetItemId"
              value={node.data.targetItemId || ""}
              onChange={handleChange}
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
        </AccordionSection>
        
        <AccordionSection title="▼ アニメーション設定" defaultOpen={true}>
          <div className="prop-group">
            <label className="prop-label">種類:</label>
            <select
              className="prop-select"
              name="animType"
              value={node.data.animType || "opacity"}
              onChange={handleChange}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <option value="opacity">不透明度 (Opacity)</option>
              <option value="moveX">X位置 (Move X)</option>
              <option value="moveY">Y位置 (Move Y)</option>
              <option value="scale">拡大縮小 (Scale)</option>
              <option value="rotate">回転 (Rotate)</option>
            </select>
          </div>
          <div className="prop-group">
            <label className="prop-label">目標値:</label>
            <input
              type="number"
              className="prop-input"
              name="value"
              value={node.data.value || 0}
              onChange={handleChange}
              onKeyDown={handleInputKeyDown}
              onFocus={handleInputFocus}
              placeholder="例: 0 (Opacity) や 100 (Move X)"
            />
          </div>
          <div className="prop-group">
            <label className="prop-label">時間 (秒):</label>
            <input
              type="number"
              className="prop-input"
              name="durationS"
              value={node.data.durationS || 0.5}
              onChange={handleChange}
              onKeyDown={handleInputKeyDown}
              onFocus={handleInputFocus}
              step="0.1"
              min="0"
            />
          </div>
        </AccordionSection>
        
        <AccordionSection title="▼ 詳細設定 (オプション)" defaultOpen={false}>
          <div className="prop-group">
            <label className="prop-label">遅延 (秒):</label>
            <input
              type="number"
              className="prop-input"
              name="delayS"
              value={node.data.delayS || 0}
              onChange={handleChange}
              onKeyDown={handleInputKeyDown}
              onFocus={handleInputFocus}
              step="0.1"
              min="0"
            />
          </div>
          <div className="prop-group">
            <label className="prop-label">イージング:</label>
            <select
              className="prop-select"
              name="easing"
              value={node.data.easing || "ease"}
              onChange={handleChange}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <option value="ease">ease</option>
              <option value="ease-in">ease-in</option>
              <option value="ease-out">ease-out</option>
              <option value="ease-in-out">ease-in-out</option>
              <option value="linear">linear</option>
            </select>
          </div>
        </AccordionSection>
      </>
    );
  }
  // ↑↑↑↑↑↑↑↑↑↑ (★ 追加) ↑↑↑↑↑↑↑↑↑↑
  // (6) イベントノード (設定項目なし)
  else if (node.type === "eventNode") {
    editorUI = (
      <AccordionSection title="ノード設定" defaultOpen={true}>
        <div className="placeholder-text">(このノードに設定項目はありません)</div>
      </AccordionSection>
    );
  }
  
  // (★ 修正) ラッパーを変更
  return (
    <div className="properties-panel-content">
      <AccordionSection title="基本情報" defaultOpen={true}>
        <div className="prop-group">
          <label className="prop-label">Node Type</label>
          <div className="prop-value">{node.type}</div>
        </div>
        <div className="prop-group">
          <label className="prop-label">Node Name</label>
          <div className="prop-value">{node.data.label}</div>
        </div>
      </AccordionSection>
      
      {/* (★ 修正) editorUI が複数のアコーディオンを含むため、そのままレンダリング */}
      {editorUI}
    </div>
  );
};


// --- (C) メインの PropertiesPanel (UIスイッチャー) (★ 変更なし) ---
const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selection,
  activeTabId,
  activeLogicGraphId,
  onTabSelect,
  onTabClose,
  placedItems,
  allItemLogics,
  onItemUpdate,
  onNodeDataChange,
  pageInfoList,
}) => {
  
  // (★ 変更なし) アクティブなタブのエントリを取得
  const activeEntry = selection.find((s) => s.id === activeTabId);

  let content = null;

  // (1) UIアイテムが選択されている場合
  if (activeEntry && activeEntry.type === 'item') {
    const item = placedItems.find((p) => p.id === activeEntry.id);
    
    if (item) {
      // (アイテム編集UI)
      const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => { onItemUpdate(item.id, { name: e.target.value }); };
      const handleXChange = (e: React.ChangeEvent<HTMLInputElement>) => { onItemUpdate(item.id, { x: e.target.valueAsNumber || 0 }); };
      const handleYChange = (e: React.ChangeEvent<HTMLInputElement>) => { onItemUpdate(item.id, { y: e.target.valueAsNumber || 0 }); };
      const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => { onItemUpdate(item.id, { width: e.target.valueAsNumber || 1 }); };
      const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => { onItemUpdate(item.id, { height: e.target.valueAsNumber || 1 }); };
      const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === "Enter") e.currentTarget.blur(); };
      const handleBlur = () => { /* (ロジックは不要になった) */ };
      const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => { e.target.select(); };

      content = (
        <div className="properties-panel-content">
          <AccordionSection title="基本情報" defaultOpen={true}>
            <div className="prop-group">
              <div className="prop-label">Name</div>
              <input type="text" className="prop-input" value={item.name} onChange={handleNameChange} onKeyDown={handleKeyDown} onBlur={handleBlur} onFocus={handleFocus} />
            </div>
          </AccordionSection>

          <AccordionSection title="位置" defaultOpen={true}>
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
          </AccordionSection>
          
          <AccordionSection title="サイズ" defaultOpen={true}>
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
          </AccordionSection>
        </div>
      );
    }
  } 
  // (2) ノードが選択されている場合
  else if (activeEntry && activeEntry.type === 'node' && activeLogicGraphId) {
    const logicTree = allItemLogics[activeLogicGraphId];
    
    if (logicTree) {
      const node = logicTree.nodes.find((n) => n.id === activeEntry.id);
      if (node) {
        // (タスク4) ノード専用エディタをレンダリング
        content = (
          <NodePropertiesEditor
            node={node}
            placedItems={placedItems}
            onNodeDataChange={onNodeDataChange}
            pageInfoList={pageInfoList}
          />
        );
      }
    }
  } 
  
  // (3) 何も選択されていない場合
  if (!content) {
    content = (
      <div className="properties-panel-content">
        <div className="placeholder-text">アイテムまたはノードを選択してください</div>
      </div>
    );
  }

  // (★ 変更なし) タブとコンテンツを両方レンダリング
  return (
    <div className="panel-content-wrapper">
      <InspectorTabs
        selection={selection}
        activeTabId={activeTabId}
        onTabSelect={onTabSelect}
        onTabClose={onTabClose}
      />
      <div className="panel-content-scrollable">
        {content}
      </div>
    </div>
  );
};

export default PropertiesPanel;