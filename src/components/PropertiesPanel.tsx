// src/components/PropertiesPanel.tsx

import React, { useState, useRef, useEffect } from "react";
import type { Node } from "reactflow";
import "./PropertiesPanel.css";
import "./NodePropertiesEditor.css";
import { useEditorContext } from "../contexts/EditorContext";

// アコーディオンコンポーネント
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

// タブUIコンポーネント
interface InspectorTabsProps {
}
const InspectorTabs: React.FC<InspectorTabsProps> = () => {
  
  const {
    selection,
    activeTabId,
    onTabSelect,
    onTabClose,
  } = useEditorContext();
  
  const tabsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = tabsContainerRef.current;
    if (!container) return;
    const handleWheel = (e: WheelEvent) => {
      if (e.deltaX !== 0) return;
      if (e.deltaY !== 0) {
        e.preventDefault();
        container.scrollLeft -= e.deltaY;
      }
    };
    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, []);
  
  if (selection.length === 0) {
    return null; 
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
              e.stopPropagation();
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

// --- (B) ノード専用の編集UI ---
const NodePropertiesEditor: React.FC<{
  node: Node;
}> = ({ node }) => { 
  
  // Context から取得
  const {
    placedItems,
    onNodeDataChange,
    pageInfoList,
    activeLogicGraphId,
  } = useEditorContext();

  // 親アイテムを特定
  const parentItem = placedItems.find(p => p.id === activeLogicGraphId);
  const isInputItem = parentItem?.name.startsWith("テキスト入力欄") || false;

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
  
  if (node.type === "actionNode") {
    editorUI = (
      <AccordionSection title="ノード設定" defaultOpen={true}>
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
                {item.data.text || item.name}
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
  else if (node.type === "ifNode") {
    const conditionSource = node.data.conditionSource || 'item'; 
    
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
        
        {conditionSource === 'item' && (
          <>
            <div className="prop-group">
              <label className="prop-label">IF (もし):</label>
              <select
                className="prop-select"
                name="conditionTargetId"
                value={node.data.conditionTargetId || ""}
                onChange={handleChange}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <option value="">-- アイテムを選択 --</option>
                {placedItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.data.text || item.name}
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
                onMouseDown={(e) => e.stopPropagation()}
              >
                <option value="isVisible">表示されている (True)</option>
                <option value="isHidden">非表示である (False)</option>
              </select>
            </div>
          </>
        )}
        
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
  else if (node.type === "pageNode") {
    editorUI = (
      <AccordionSection title="ノード設定" defaultOpen={true}>
        <div className="prop-group">
          <label className="prop-label">遷移先ページ:</label>
          <select
            className="prop-select"
            name="targetPageId"
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
                  {item.data.text || item.name}
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
              value={node.data.value ?? 0}
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
              value={node.data.durationS ?? 0.5}
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
              value={node.data.delayS ?? 0}
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
  else if (node.type === "delayNode") {
    editorUI = (
      <AccordionSection title="ノード設定" defaultOpen={true}>
        <div className="prop-group">
          <label className="prop-label">遅延 (秒):</label>
          <input
            type="number"
            className="prop-input"
            name="durationS"
            value={node.data.durationS ?? 1.0}
            onChange={handleChange}
            onKeyDown={handleInputKeyDown}
            onFocus={handleInputFocus}
            step="0.1"
            min="0"
          />
        </div>
      </AccordionSection>
    );
  }
  else if (node.type === "waitForClickNode") {
    editorUI = (
      <AccordionSection title="待機設定" defaultOpen={true}>
        <div className="prop-group">
          <label className="prop-label">クリックを待つ対象:</label>
          <select
            className="prop-select"
            name="targetItemId"
            value={node.data.targetItemId || ""}
            onChange={(e) => {
              const selectedItem = placedItems.find(p => p.id === e.target.value);
              const newLabel = selectedItem ? `待ち: ${selectedItem.data.text || selectedItem.name}` : "ターゲット未設定";
              
              onNodeDataChange(node.id, { 
                targetItemId: e.target.value,
                label: newLabel
              });
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <option value="">-- アイテムを選択 --</option>
            {placedItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.data.text || item.name}
              </option>
            ))}
          </select>
        </div>
        <div className="prop-description" style={{fontSize: '0.8em', color: '#888', marginTop: '8px'}}>
          ※ このノードに到達すると、指定したアイテムがクリックされるまで処理を一時停止します。
        </div>
      </AccordionSection>
    );
  }
  else if (node.type === "eventNode") {
    editorUI = (
      <AccordionSection title="イベント設定" defaultOpen={true}>
        <div className="prop-group">
          <label className="prop-label">トリガーの種類:</label>
          <select
            className="prop-select"
            name="eventType"
            value={node.data.eventType || "click"}
            onChange={handleChange}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <option value="click">👆 クリック時 (On Click)</option>
            <option value="onLoad">🚀 読み込み時 (On Load)</option>
            
            {/* ★ 修正: 入力完了時を選択肢として追加 */}
            {isInputItem && (
              <option value="onInputComplete">✅ 入力完了時 (On Submit)</option>
            )}
          </select>
        </div>
        <div className="prop-description" style={{fontSize: '0.8em', color: '#888', marginTop: '8px'}}>
          ※ このフローが実行されるきっかけを指定します。
        </div>
      </AccordionSection>
    );
  }
  
  // ラッパー
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
      {editorUI}
    </div>
  );
};


// --- (C) メインの PropertiesPanel (UIスイッチャー) ---
const PropertiesPanel: React.FC = () => {
  
  // Context から必要なデータ/関数を取得
  const {
    selection,
    activeTabId,
    activeLogicGraphId,
    placedItems,
    allItemLogics,
    onItemUpdate,
  } = useEditorContext();

  // アクティブなタブのエントリを取得
  const activeEntry = selection.find((s) => s.id === activeTabId);

  let content = null;

  // (1) UIアイテムが選択されている場合
  if (activeEntry && activeEntry.type === 'item') {
    const item = placedItems.find((p) => p.id === activeEntry.id);
    
    if (item) {
      // (アイテム編集UI)
      
      // ローカルステート管理
      const [localX, setLocalX] = useState(item.x);
      const [localY, setLocalY] = useState(item.y);
      const [localWidth, setLocalWidth] = useState(item.width);
      const [localHeight, setLocalHeight] = useState(item.height);

      useEffect(() => {
        setLocalX(item.x);
        setLocalY(item.y);
        setLocalWidth(item.width);
        setLocalHeight(item.height);
      }, [item.id, item.x, item.y, item.width, item.height]);

      const handleLocalXChange = (e: React.ChangeEvent<HTMLInputElement>) => { setLocalX(e.target.valueAsNumber); };
      const handleLocalYChange = (e: React.ChangeEvent<HTMLInputElement>) => { setLocalY(e.target.valueAsNumber); };
      const handleLocalWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => { setLocalWidth(e.target.valueAsNumber); };
      const handleLocalHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => { setLocalHeight(e.target.valueAsNumber); };
      
      const handleLocalXBlur = () => {
        const val = isNaN(localX) ? 0 : localX;
        setLocalX(val);
        onItemUpdate(item.id, { x: val });
      };
      const handleLocalYBlur = () => {
        const val = isNaN(localY) ? 0 : localY;
        setLocalY(val);
        onItemUpdate(item.id, { y: val });
      };
      const handleLocalWidthBlur = () => {
        const val = (isNaN(localWidth) || localWidth < 1) ? 1 : localWidth;
        setLocalWidth(val);
        onItemUpdate(item.id, { width: val });
      };
      const handleLocalHeightBlur = () => {
        const val = (isNaN(localHeight) || localHeight < 1) ? 1 : localHeight;
        setLocalHeight(val);
        onItemUpdate(item.id, { height: val });
      };
      
      const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === "Enter") e.currentTarget.blur(); };
      const handleBlur = () => { /* (テキスト入力欄は onBlur で何もしない) */ };
      const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => { e.target.select(); };

      // 画像アップロードハンドラ
      const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) {
          alert("画像ファイルを選択してください (jpg, png, gifなど)");
          return;
        }
        const reader = new FileReader();
        reader.onload = (loadEvent) => {
          const base64data = loadEvent.target?.result;
          if (typeof base64data === "string") {
            onItemUpdate(item.id, {
              data: { ...item.data, src: base64data, },
            });
          }
        };
        reader.onerror = () => {
          alert("ファイルの読み込みに失敗しました。");
        };
        reader.readAsDataURL(file);
        e.target.value = "";
      };
      const handleImageRemove = () => {
        onItemUpdate(item.id, {
          data: { ...item.data, src: null, },
        });
      };
      
      // テキスト入力欄用のデータハンドラ
      const handleItemDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onItemUpdate(item.id, {
          data: {
            ...item.data,
            [e.target.name]: e.target.value,
          },
        });
      };

      content = (
        <div className="properties-panel-content">
          <AccordionSection title="基本情報" defaultOpen={true}>
            <div className="prop-group">
              <div className="prop-label">Name (アイテム種別)</div>
              <input
                type="text"
                className="prop-input prop-input-disabled"
                value={item.name}
                disabled 
              />
            </div>
          </AccordionSection>
          
          {(item.name.startsWith("テキスト") || item.name.startsWith("ボタン")) && (
            <AccordionSection title="コンテンツ" defaultOpen={true}>
              <div className="prop-group">
                <div className="prop-label">
                  {item.name.startsWith("ボタン") ? "ボタンテキスト" : "テキスト内容"}
                </div>
                <input
                  type="text"
                  className="prop-input"
                  name="text"
                  value={item.data?.text || ""}
                  onChange={handleItemDataChange}
                  onKeyDown={handleKeyDown}
                  onBlur={handleBlur}
                  onFocus={handleFocus}
                  placeholder="表示するテキスト"
                />
              </div>
            </AccordionSection>
          )}


          {item.name.startsWith("画像") && (
            <AccordionSection title="画像ソース" defaultOpen={true}>
              <div className="prop-group">
                <input
                  type="file"
                  id={`file-input-${item.id}`} // 複数アイテム対応
                  style={{ display: "none" }}
                  accept="image/*" // 画像ファイルのみ
                  onChange={handleImageUpload}
                />
                <label
                  htmlFor={`file-input-${item.id}`}
                  className="prop-button"
                >
                  画像をアップロード
                </label>
              </div>
              
              {item.data?.src && (
                <div className="prop-group">
                  <label className="prop-label">プレビュー:</label>
                  <img
                    src={item.data.src}
                    alt="アップロードプレビュー"
                    className="prop-image-preview"
                  />
                  <button
                    className="prop-button-danger"
                    onClick={handleImageRemove}
                  >
                    画像を削除
                  </button>
                </div>
              )}
            </AccordionSection>
          )}
          
          {item.name.startsWith("テキスト入力欄") && (
            <AccordionSection title="入力欄設定" defaultOpen={true}>
              <div className="prop-group">
                <div className="prop-label">入力値の保存名</div>
                <input
                  type="text"
                  className="prop-input"
                  name="variableName"
                  value={item.data?.variableName || ""}
                  onChange={handleItemDataChange}
                  onKeyDown={handleKeyDown}
                  onBlur={handleBlur}
                  onFocus={handleFocus}
                  placeholder="例: userName"
                />
              </div>
              <div className="prop-group">
                <div className="prop-label">プレースホルダー</div>
                <input
                  type="text"
                  className="prop-input"
                  name="placeholder"
                  value={item.data?.placeholder || ""}
                  onChange={handleItemDataChange}
                  onKeyDown={handleKeyDown}
                  onBlur={handleBlur}
                  onFocus={handleFocus}
                  placeholder="例: お名前を入力..."
                />
              </div>
            </AccordionSection>
          )}


          <AccordionSection title="位置" defaultOpen={true}>
            <div className="prop-row">
              <div className="prop-group prop-group-half">
                <div className="prop-label-inline">X</div>
                <input
                  type="number"
                  className="prop-input"
                  value={isNaN(localX) ? "" : Math.round(localX)}
                  onChange={handleLocalXChange}
                  onKeyDown={handleKeyDown}
                  onBlur={handleLocalXBlur}
                  onFocus={handleFocus}
                />
              </div>
              <div className="prop-group prop-group-half">
                <div className="prop-label-inline">Y</div>
                <input
                  type="number"
                  className="prop-input"
                  value={isNaN(localY) ? "" : Math.round(localY)}
                  onChange={handleLocalYChange}
                  onKeyDown={handleKeyDown}
                  onBlur={handleLocalYBlur}
                  onFocus={handleFocus}
                />
              </div>
            </div>
          </AccordionSection>
          
          <AccordionSection title="サイズ" defaultOpen={true}>
            <div className="prop-row">
              <div className="prop-group prop-group-half">
                <div className="prop-label-inline">W</div>
                <input
                  type="number"
                  className="prop-input"
                  value={isNaN(localWidth) ? "" : localWidth}
                  onChange={handleLocalWidthChange}
                  onKeyDown={handleKeyDown}
                  onBlur={handleLocalWidthBlur}
                  onFocus={handleFocus}
                />
              </div>
              <div className="prop-group prop-group-half">
                <div className="prop-label-inline">H</div>
                <input
                  type="number"
                  className="prop-input"
                  value={isNaN(localHeight) ? "" : localHeight}
                  onChange={handleLocalHeightChange}
                  onKeyDown={handleKeyDown}
                  onBlur={handleLocalHeightBlur}
                  onFocus={handleFocus}
                />
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
        content = (
          <NodePropertiesEditor
            node={node}
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

  return (
    <div className="panel-content-wrapper">
      <InspectorTabs />
      <div className="panel-content-scrollable">
        {content}
      </div>
    </div>
  );
};

export default React.memo(PropertiesPanel);