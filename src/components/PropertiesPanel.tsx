// src/components/PropertiesPanel.tsx

import React, { useState, useRef, useEffect } from "react";
import type { Node } from "reactflow";
import "./PropertiesPanel.css";
import "./NodePropertiesEditor.css";
import { useEditorContext } from "../contexts/EditorContext";

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
  
  // (★ 変更なし) Context から取得
  const {
    placedItems,
    onNodeDataChange,
    pageInfoList,
    activeLogicGraphId,
  } = useEditorContext();

  const parentItem = placedItems.find(p => p.id === activeLogicGraphId);
  const isInputItem = parentItem?.name.startsWith("テキスト入力欄") || false;

  // (汎用) データ変更ハンドラ
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement>) => {
    onNodeDataChange(node.id, { [e.target.name]: e.target.value });
  };
  const handleDataChange = (key: string, value: any) => {
    onNodeDataChange(node.id, { [key]: value });
  };
  
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") e.currentTarget.blur();
  };
  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  // (★ 変更なし) UI切り替え
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
    const comparisonType = node.data.comparisonType || 'string';
    
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
              <label className="prop-label">種類 (として比較):</label>
              <select
                className="prop-select"
                name="comparisonType"
                value={comparisonType}
                onChange={handleChange}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <option value="string">文字列</option>
                <option value="number">数値</option>
              </select>
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
                {comparisonType === 'number' && (
                  <>
                    <option value=">">&gt; (より大きい)</option>
                    <option value=">=">&gt;= (以上)</option>
                    <option value="<">&lt; (より小さい)</option>
                    <option value="<=">&lt;= (以下)</option>
                  </>
                )}
                {comparisonType === 'string' && (
                  <>
                    <option value="contains">含む (文字列)</option>
                    <option value="not_contains">含まない (文字列)</option>
                  </>
                )}
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
                placeholder={comparisonType === 'number' ? "例: 10" : "例: Hello"}
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
    const animationMode = node.data.animationMode || 'absolute';
    const animType = node.data.animType || 'opacity';
    const relativeOp = node.data.relativeOperation || 'multiply';
    
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
              value={animType}
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
            <label className="prop-label">指定方法:</label>
            <div className="prop-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                id={`anim-mode-abs-${node.id}`}
                style={{ width: '16px', height: '16px' }}
                checked={animationMode === 'absolute'}
                onChange={() => handleDataChange('animationMode', 'absolute')}
              />
              <label htmlFor={`anim-mode-abs-${node.id}`} style={{ fontSize: '0.9em', color: '#ccc', cursor: 'pointer' }}>
                指定した値にする (絶対値)
              </label>
            </div>
            <div className="prop-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px', marginTop: '5px' }}>
              <input
                type="checkbox"
                id={`anim-mode-rel-${node.id}`}
                style={{ width: '16px', height: '16px' }}
                checked={animationMode === 'relative'}
                onChange={() => handleDataChange('animationMode', 'relative')}
              />
              <label htmlFor={`anim-mode-rel-${node.id}`} style={{ fontSize: '0.9em', color: '#ccc', cursor: 'pointer' }}>
                現在の値に追加/増減 (相対値)
              </label>
            </div>
          </div>
          
          {animationMode === 'relative' && animType === 'opacity' && (
            <div className="prop-group">
              <label className="prop-label">計算方法 (不透明度):</label>
              <select
                className="prop-select"
                name="relativeOperation"
                value={relativeOp}
                onChange={handleChange}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <option value="multiply">乗算 (現在の値 * X)</option>
                <option value="subtract">減算 (現在の値 - X)</option>
              </select>
            </div>
          )}
          
          <div className="prop-group">
            <label className="prop-label">
              {animationMode === 'relative' ? '増減値:' : '目標値:'}
            </label>
            <input
              type="number"
              className="prop-input"
              name="value"
              value={node.data.value ?? 0}
              onChange={handleChange}
              onKeyDown={handleInputKeyDown}
              onFocus={handleInputFocus}
              placeholder={animationMode === 'relative' ? "例: 90 (90追加) または 0.5" : "例: 0 (0にする)"}
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
        
        <AccordionSection title="▼ 繰り返し (オプション)" defaultOpen={false}>
          <div className="prop-group">
            <label className="prop-label">繰り返しモード:</label>
            <select
              className="prop-select"
              name="loopMode"
              value={node.data.loopMode || "none"}
              onChange={handleChange}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <option value="none">一度だけ再生</option>
              <option value="count">回数を指定</option>
            </select>
          </div>
          
          {node.data.loopMode === 'count' && (
            <div className="prop-group">
              <label className="prop-label">繰り返し回数:</label>
              <input
                type="number"
                className="prop-input"
                name="loopCount"
                value={node.data.loopCount ?? 2}
                onChange={handleChange}
                onKeyDown={handleInputKeyDown}
                onFocus={handleInputFocus}
                step="1"
                min="2"
              />
            </div>
          )}
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
  
  // (★ 変更なし) ラッパー
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
  
  // ★ 修正: Context から onOpenBackgroundModal を取得
  const {
    selection,
    activeTabId,
    activeLogicGraphId,
    placedItems,
    allItemLogics,
    onItemUpdate,
    onOpenBackgroundModal, // ★ 追加
  } = useEditorContext();

  // (★ 変更なし) アクティブなタブのエントリを取得
  const activeEntry = selection.find((s) => s.id === activeTabId);

  let content = null;

  // (1) UIアイテムが選択されている場合
  if (activeEntry && activeEntry.type === 'item') {
    const item = placedItems.find((p) => p.id === activeEntry.id);
    
    if (item) {
      // (アイテム編集UI)
      
      // (★ 変更なし) ローカルステート管理
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

      // (★ 変更なし) 縦横比の基準を取得
      const ratioToUse = item.data?.originalAspectRatio || ( (item.width && item.height) ? item.height / item.width : 1 );

      const handleLocalXChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLocalX(e.target.valueAsNumber);
      };
      
      const handleLocalYChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLocalY(e.target.valueAsNumber);
      };

      // (★ 変更なし) 幅(W)の入力中 (縦横比維持を考慮)
      const handleLocalWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newWidth = e.target.valueAsNumber;
        setLocalWidth(newWidth);
        if (item.data?.keepAspectRatio) {
          setLocalHeight(Math.round(newWidth * ratioToUse));
        }
      };
      
      // (★ 変更なし) 高さ(H)の入力中 (縦横比維持を考慮)
      const handleLocalHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newHeight = e.target.valueAsNumber;
        setLocalHeight(newHeight);
        if (item.data?.keepAspectRatio) {
          setLocalWidth(Math.round(newHeight / ratioToUse));
        }
      };
      
      // (★ 変更なし) 幅(W)の入力完了 (Blur)
      const handleLocalWidthBlur = () => {
        let valW = (isNaN(localWidth) || localWidth < 1) ? 1 : localWidth;
        
        if (item.data?.keepAspectRatio) {
          const valH = Math.round(valW * ratioToUse);
          setLocalWidth(valW);
          setLocalHeight(valH);
          onItemUpdate(item.id, { width: valW, height: valH });
        } else {
          setLocalWidth(valW);
          onItemUpdate(item.id, { width: valW });
        }
      };
      
      // (★ 変更なし) 高さ(H)の入力完了 (Blur)
      const handleLocalHeightBlur = () => {
        let valH = (isNaN(localHeight) || localHeight < 1) ? 1 : localHeight;
        
        if (item.data?.keepAspectRatio) {
          const valW = Math.round(valH / ratioToUse);
          setLocalHeight(valH);
          setLocalWidth(valW);
          onItemUpdate(item.id, { height: valH, width: valW });
        } else {
          setLocalHeight(valH);
          onItemUpdate(item.id, { height: valH });
        }
      };
      
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
      
      const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === "Enter") e.currentTarget.blur(); };
      const handleBlur = () => { /* (テキスト入力欄は onBlur で何もしない) */ };
      const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => { e.target.select(); };

      // (★ 変更なし) 画像アップロードハンドラ (自動リサイズロジック)
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
            
            const img = new Image();
            img.onload = () => {
              const MAX_UPLOAD_WIDTH = 450;
              const MAX_UPLOAD_HEIGHT = 300;

              let newWidth = img.width;
              let newHeight = img.height;
              const newAspectRatio = img.height / img.width;

              const widthRatio = img.width / MAX_UPLOAD_WIDTH;
              const heightRatio = img.height / MAX_UPLOAD_HEIGHT;

              if (widthRatio > 1 || heightRatio > 1) {
                if (widthRatio > heightRatio) {
                  newWidth = MAX_UPLOAD_WIDTH;
                  newHeight = img.height * (MAX_UPLOAD_WIDTH / img.width);
                } else {
                  newHeight = MAX_UPLOAD_HEIGHT;
                  newWidth = img.width * (MAX_UPLOAD_HEIGHT / img.height);
                }
              }

              newWidth = Math.round(newWidth);
              newHeight = Math.round(newHeight);

              onItemUpdate(item.id, {
                data: { 
                  ...item.data, 
                  src: base64data,
                  originalAspectRatio: newAspectRatio,
                  keepAspectRatio: true,
                  isTransparent: false,
                },
                width: newWidth,
                height: newHeight,
              });
            };
            img.onerror = () => {
              alert("画像の読み込み中にエラーが発生しました。");
            };
            img.src = base64data;
          }
        };
        reader.onerror = () => {
          alert("ファイルの読み込みに失敗しました。");
        };
        reader.readAsDataURL(file);
        e.target.value = "";
      };
      
      // (★ 変更なし) 画像削除
      const handleImageRemove = () => {
        onItemUpdate(item.id, {
          data: { 
            ...item.data, 
            src: null,
            originalAspectRatio: undefined,
            keepAspectRatio: false,
            isArtboardBackground: false,
            artboardBackgroundPosition: undefined,
          },
        });
      };
      
      // (★ 変更なし) テキスト/テキストエリア/入力欄用のデータハンドラ
      const handleItemDataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        onItemUpdate(item.id, {
          data: {
            ...item.data,
            [e.target.name]: e.target.value,
          },
        });
      };
      
      // (★ 変更なし) 枠線表示チェックボックスのハンドラ
      const handleShowBorderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onItemUpdate(item.id, {
          data: {
            ...item.data,
            showBorder: e.target.checked,
          },
        });
      };

      // (★ 変更なし) 背景透過チェックボックスのハンドラ
      const handleTransparentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onItemUpdate(item.id, {
          data: {
            ...item.data,
            isTransparent: e.target.checked,
          },
        });
      };

      // (★ 変更なし) 縦横比維持チェックボックスのハンドラ
      const handleKeepAspectRatioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const isChecked = e.target.checked;
        onItemUpdate(item.id, {
          data: {
            ...item.data,
            keepAspectRatio: isChecked,
          },
        });
        
        if (isChecked && item.data?.originalAspectRatio) {
          const newHeight = Math.round(localWidth * item.data.originalAspectRatio);
          if (localHeight !== newHeight) {
            setLocalHeight(newHeight);
            onItemUpdate(item.id, { height: newHeight });
          }
        }
      };
      
      // ★ 修正: アートボード背景チェックボックスのハンドラ
      const handleIsBackgroundChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const isChecked = e.target.checked;
        if (isChecked && item.data.src) {
          // ★ チェックされたらモーダルを開く
          onOpenBackgroundModal(item.id, item.data.src);
        } else if (!isChecked) {
          // チェックが外されたら背景設定を解除
          onItemUpdate(item.id, {
            data: {
              ...item.data,
              isArtboardBackground: false,
              artboardBackgroundPosition: undefined,
            },
          });
        } else if (isChecked && !item.data.src) {
           // 画像がないのにチェックしようとした
           alert("先に画像をアップロードしてください。");
           e.target.checked = false; // チェックを元に戻す
        }
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
                <textarea
                  className="prop-input"
                  name="text"
                  value={item.data?.text || ""}
                  onChange={handleItemDataChange}
                  onBlur={handleBlur}
                  rows={4}
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
                  id={`file-input-${item.id}`}
                  style={{ display: "none" }}
                  accept="image/*"
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

          {(item.name.startsWith("テキスト") || item.name.startsWith("ボタン") || item.name.startsWith("画像")) && (
            <AccordionSection title="外観" defaultOpen={true}>
              <div className="prop-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id={`show-border-${item.id}`}
                  style={{ width: '16px', height: '16px' }}
                  checked={item.data?.showBorder !== false} 
                  onChange={handleShowBorderChange}
                />
                <label 
                  htmlFor={`show-border-${item.id}`}
                  style={{ fontSize: '0.9em', color: '#ccc', cursor: 'pointer' }}
                >
                  枠線を表示する
                </label>
              </div>
              
              <div className="prop-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
                <input
                  type="checkbox"
                  id={`is-transparent-${item.id}`}
                  style={{ width: '16px', height: '16px' }}
                  checked={!!item.data?.isTransparent} 
                  onChange={handleTransparentChange}
                />
                <label 
                  htmlFor={`is-transparent-${item.id}`}
                  style={{ fontSize: '0.9em', color: '#ccc', cursor: 'pointer' }}
                >
                  背景を透過する
                </label>
              </div>
              
              {/* ★ 修正: アートボード背景 (画像のみ) */}
              {item.name.startsWith("画像") && (
                <>
                  <div className="prop-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
                    <input
                      type="checkbox"
                      id={`is-artboard-bg-${item.id}`}
                      style={{ width: '16px', height: '16px' }}
                      checked={!!item.data?.isArtboardBackground} 
                      onChange={handleIsBackgroundChange} // ★ ハンドラを変更
                    />
                    <label 
                      htmlFor={`is-artboard-bg-${item.id}`}
                      style={{ fontSize: '0.9em', color: '#ccc', cursor: 'pointer' }}
                    >
                      アートボードの背景にする
                    </label>
                  </div>
                  
                  {/* ★ 追加: 背景がONの時だけ「位置調整」ボタンを表示 */}
                  {item.data?.isArtboardBackground && item.data.src && (
                     <div className="prop-group" style={{marginTop: '8px', paddingLeft: '24px'}}>
                       <button 
                         className="prop-button" 
                         style={{backgroundColor: '#555'}}
                         onClick={() => onOpenBackgroundModal(item.id, item.data.src!)}
                       >
                         位置を調整する...
                       </button>
                     </div>
                  )}
                </>
              )}
              
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
            
            {(item.name.startsWith("画像")) && (
              <div className="prop-group" style={{ marginTop: '10px', flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id={`keep-ratio-${item.id}`}
                  style={{ width: '16px', height: '16px' }}
                  checked={!!item.data?.keepAspectRatio}
                  onChange={handleKeepAspectRatioChange}
                />
                <label 
                  htmlFor={`keep-ratio-${item.id}`}
                  style={{ fontSize: '0.9em', color: '#ccc', cursor: 'pointer' }}
                >
                  縦横比を維持する
                </label>
              </div>
            )}
            
          </AccordionSection>
        </div>
      );
    }
  } 
  // (2) ノードが選択されている場合 (★ 変更なし)
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
  
  // (3) 何も選択されていない場合 (★ 変更なし)
  if (!content) {
    content = (
      <div className="properties-panel-content">
        <div className="placeholder-text">アイテムまたはノードを選択してください</div>
      </div>
    );
  }

  // (★ 変更なし) ラッパー
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