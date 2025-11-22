// src/components/PropertiesPanel.tsx

import React, { useState, useRef, useEffect } from "react";
import type { Node } from "reactflow";
import "./PropertiesPanel.css";
import "./NodePropertiesEditor.css";
import type { 
  NodePropertyConfig, 
  PropertyConfig, 
  PropertySelectOption,
  PlacedItemType, // ★ インポート
} from "../types";

// ★ ノード設定のインポート
import { actionNodeConfig } from "./nodes/ActionNode";
import { animateNodeConfig } from "./nodes/AnimateNode";
import { delayNodeConfig } from "./nodes/DelayNode";
import { eventNodeConfig } from "./nodes/EventNode";
import { ifNodeConfig } from "./nodes/IfNode";
import { pageNodeConfig } from "./nodes/PageNode";
import { setVariableNodeConfig } from "./nodes/SetVariableNode";
import { waitForClickNodeConfig } from "./nodes/WaitForClickNode";

// ★ Zustand ストアをインポート
import { usePageStore } from "../stores/usePageStore";
import { useSelectionStore } from "../stores/useSelectionStore";

// ★ Supabaseクライアントをインポート (画像アップロード用)
import { supabase } from "../lib/supabaseClient";

// ★ ノードタイプと設定を紐付けるマップ
const nodeConfigMap: Record<string, NodePropertyConfig | NodePropertyConfig[]> = {
  "actionNode": actionNodeConfig,
  "animateNode": animateNodeConfig,
  "delayNode": delayNodeConfig,
  "eventNode": eventNodeConfig,
  "ifNode": ifNodeConfig,
  "pageNode": pageNodeConfig,
  "setVariableNode": setVariableNodeConfig,
  "waitForClickNode": waitForClickNodeConfig,
};


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
  
  // ★ 変更: selection ではなく tabs を取得
  const { tabs, activeTabId, handleTabSelect, handleTabClose } = useSelectionStore(
    (s) => ({
      tabs: s.tabs,
      activeTabId: s.activeTabId,
      handleTabSelect: s.handleTabSelect,
      handleTabClose: s.handleTabClose,
    })
  );
  
  const tabsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = tabsContainerRef.current;
    if (!container) return;
    
    const handleWheel = (e: WheelEvent) => {
      // 縦スクロールの入力（マウスホイール）があった場合
      if (e.deltaY !== 0) {
        // 親要素へのスクロール伝播などを防ぎ、横スクロールに変換する
        e.preventDefault();
        // スクロール量を加算（+=）することで、ホイール下回転で右へ進む自然な挙動にする
        container.scrollLeft += e.deltaY;
      }
    };
    
    // passive: false にしないと preventDefault が効かない
    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, []);
  
  if (tabs.length === 0) {
    return null; 
  }

  return (
    <div className="inspector-tabs-container" ref={tabsContainerRef}>
      {tabs.map((entry) => (
        <div
          key={entry.id}
          className={`inspector-tab ${entry.id === activeTabId ? "is-active" : ""}`}
          onClick={() => handleTabSelect(entry.id)}
        >
          <span className="tab-label">{entry.label}</span>
          <span
            className="tab-close"
            onClick={(e) => {
              e.stopPropagation();
              handleTabClose(entry.id);
            }}
          >
            ×
          </span>
        </div>
      ))}
    </div>
  );
};

// --- (★ 汎用プロパティ入力コンポーネント) ---
interface DynamicPropertyInputProps {
  node: Node;
  propConfig: PropertyConfig;
}

const DynamicPropertyInput: React.FC<DynamicPropertyInputProps> = ({
  node,
  propConfig,
}) => {
  const { updateNodeData, placedItems, pageInfoList } = usePageStore((s) => {
    const page = s.selectedPageId ? s.pages[s.selectedPageId] : undefined;
    return {
      updateNodeData: s.updateNodeData,
      placedItems: page?.placedItems ?? [],
      pageInfoList: s.pageOrder.map((id) => ({ id, name: s.pages[id]?.name ?? "無題" })),
    };
  });
  const activeLogicGraphId = useSelectionStore(state => state.activeLogicGraphId);

  const parentItem = placedItems.find(p => p.id === activeLogicGraphId);
  const isInputItem = parentItem?.name.startsWith("テキスト入力欄") || false;

  const { name, label, type, defaultValue, step, min } = propConfig;
  const value = node.data[name] ?? defaultValue;

  // --- 汎用ハンドラ ---
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement>) => {
    let newValue: any = e.target.value;
    if (type === 'number') {
      newValue = Number(newValue);
    }
    if (type === 'checkbox') {
      newValue = (e.target as HTMLInputElement).checked;
    }
    
    if (node.type === "waitForClickNode" && name === "targetItemId") {
      const selectedItem = placedItems.find(p => p.id === newValue);
      const newLabel = selectedItem ? `待ち: ${selectedItem.data.text || selectedItem.name}` : "ターゲット未設定";
      updateNodeData(node.id, { [name]: newValue, label: newLabel });
    } else {
      updateNodeData(node.id, { [name]: newValue });
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") e.currentTarget.blur();
  };
  
  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  // --- 動的オプションの生成 ---
  let dynamicOptions: PropertySelectOption[] = propConfig.options || [];

  if (type === "select") {
    if (name === "targetItemId") {
      dynamicOptions = [
        { label: "-- アイテムを選択 --", value: "" },
        ...placedItems.map(item => ({
          label: item.data.text || item.name,
          value: item.id,
        })),
      ];
    }
    else if (name === "targetPageId") {
      dynamicOptions = [
        { label: "-- ページを選択 --", value: "" },
        ...pageInfoList.map(page => ({
          label: page.name,
          value: page.id,
        })),
      ];
    }
    else if (name === "eventType") {
      dynamicOptions = [
        { label: "👆 クリック時 (On Click)", value: "click" },
      ];
      if (isInputItem) {
        dynamicOptions.push({
          label: "✅ 入力完了時 (On Submit)", value: "onInputComplete"
        });
      }
    }
    else if (name === "comparison") {
      const comparisonType = node.data.comparisonType || 'string';
      dynamicOptions = [
        { label: "== (等しい)", value: "==" },
        { label: "!= (等しくない)", value: "!=" },
      ];
      if (comparisonType === 'number') {
        dynamicOptions.push(
          { label: "> (より大きい)", value: ">" },
          { label: ">= (以上)", value: ">=" },
          { label: "< (より小さい)", value: "<" },
          { label: "<= (以下)", value: "<=" }
        );
      } else { // string
        dynamicOptions.push(
          { label: "含む (文字列)", value: "contains" },
          { label: "含まない (文字列)", value: "not_contains" }
        );
      }
    }
  }

  // --- レンダリング ---
  let control: React.ReactNode = null;

  switch (type) {
    case 'text':
    case 'number':
      control = (
        <input
          type={type}
          className="prop-input"
          name={name}
          value={value ?? ''}
          onChange={handleChange}
          onKeyDown={handleInputKeyDown}
          onFocus={handleInputFocus}
          step={step}
          min={min}
        />
      );
      break;

    case 'select':
      control = (
        <select
          className="prop-select"
          name={name}
          value={value ?? ''}
          onChange={handleChange}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {dynamicOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
      break;
  }

  return (
    <div className="prop-group">
      <label className="prop-label">{label}</label>
      {control}
    </div>
  );
};


// --- (B) ノード専用の編集UI (★ リファクタリング済み) ---
const NodePropertiesEditor: React.FC<{
  node: Node;
}> = ({ node }) => { 
  
  const baseInfo = (
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
  );
  
  const configOrConfigs = node.type ? nodeConfigMap[node.type] : undefined;

  if (!configOrConfigs) {
    return (
      <div className="properties-panel-content">
        {baseInfo}
      </div>
    );
  }

  const configs = Array.isArray(configOrConfigs) ? configOrConfigs : [configOrConfigs];

  return (
    <div className="properties-panel-content">
      {baseInfo}
      
      {configs.map((config, index) => (
        <AccordionSection key={index} title={config.title} defaultOpen={true}>
          {config.properties.map((prop: PropertyConfig) => {
            
            if (prop.condition && node.data[prop.condition.name] !== prop.condition.value) {
              return null;
            }

            return (
              <DynamicPropertyInput
                key={prop.name}
                node={node}
                propConfig={prop}
              />
            );
          })}
        </AccordionSection>
      ))}
    </div>
  );
};


// ★★★ ここからが新しいコンポーネント ★★★
// アイテム専用の編集UIを別コンポーネントとして分離
// これにより、フックが条件付きで呼び出されるのを防ぐ

interface ItemPropertiesEditorProps {
  item: PlacedItemType;
  onItemUpdate: (id: string, updates: Partial<PlacedItemType> | { data: any }) => void;
  onItemMoveToFront: (id: string) => void;
  onItemMoveToBack: (id: string) => void;
  onItemMoveForward: (id: string) => void;
  onItemMoveBackward: (id: string) => void;
  onOpenBackgroundModal: (itemId: string, src: string) => void;
}

const ItemPropertiesEditor: React.FC<ItemPropertiesEditorProps> = ({
  item,
  onItemUpdate,
  onItemMoveToFront,
  onItemMoveToBack,
  onItemMoveForward,
  onItemMoveBackward,
  onOpenBackgroundModal
}) => {

  // ★ フック(useState, useEffect)はすべてこのコンポーネントのトップレベルで呼び出す
  const [localX, setLocalX] = useState(item.x);
  const [localY, setLocalY] = useState(item.y);
  const [localWidth, setLocalWidth] = useState(item.width);
  const [localHeight, setLocalHeight] = useState(item.height);
  
  // ★ アップロード中の状態管理
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    setLocalX(item.x);
    setLocalY(item.y);
    setLocalWidth(item.width);
    setLocalHeight(item.height);
  }, [item.id, item.x, item.y, item.width, item.height]);

  const ratioToUse = item.data?.originalAspectRatio || ( (item.width && item.height) ? item.height / item.width : 1 );

  const handleLocalXChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalX(e.target.valueAsNumber);
  };
  
  const handleLocalYChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalY(e.target.valueAsNumber);
  };

  const handleLocalWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newWidth = e.target.valueAsNumber;
    setLocalWidth(newWidth);
    if (item.data?.keepAspectRatio) {
      setLocalHeight(Math.round(newWidth * ratioToUse));
    }
  };
  
  const handleLocalHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHeight = e.target.valueAsNumber;
    setLocalHeight(newHeight);
    if (item.data?.keepAspectRatio) {
      setLocalWidth(Math.round(newHeight / ratioToUse));
    }
  };
  
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

  // ★ Supabase Storage へのアップロード処理に変更
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // ファイル形式チェック
    if (!file.type.startsWith("image/")) {
      alert("画像ファイルを選択してください (jpg, png, gifなど)");
      return;
    }

    // 簡易サイズチェック (例: 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("ファイルサイズは5MB以下にしてください。");
      return;
    }

    setIsUploading(true);

    try {
      // 1. ユニークなファイル名を生成 (タイムスタンプ + ランダム文字列 + 拡張子)
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${fileName}`; // バケット直下に配置

      // 2. Supabase Storage にアップロード
      const { error: uploadError } = await supabase.storage
        .from('project-assets')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // 3. 公開URLを取得
      const { data: { publicUrl } } = supabase.storage
        .from('project-assets')
        .getPublicUrl(filePath);

      // 4. 画像をプリロードしてサイズを取得 (既存ロジック流用)
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

        // 5. ストアを更新 (URLを保存)
        onItemUpdate(item.id, {
          data: { 
            ...item.data, 
            src: publicUrl, // ★ ここにURLが入る
            originalAspectRatio: newAspectRatio,
            keepAspectRatio: true,
            isTransparent: false,
          },
          width: newWidth,
          height: newHeight,
        });
        
        setIsUploading(false);
      };
      
      img.onerror = () => {
        alert("アップロードされた画像の読み込みに失敗しました。");
        setIsUploading(false);
      };
      
      // URLをセットしてロード開始
      img.src = publicUrl;

    } catch (error: any) {
      console.error("Upload error:", error);
      alert("画像のアップロードに失敗しました: " + error.message);
      setIsUploading(false);
    } finally {
      e.target.value = ""; // inputをリセット
    }
  };
  
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
  
  const handleItemDataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onItemUpdate(item.id, {
      data: {
        ...item.data,
        [e.target.name]: e.target.value,
      },
    });
  };
  
  const handleShowBorderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onItemUpdate(item.id, {
      data: {
        ...item.data,
        showBorder: e.target.checked,
      },
    });
  };

  const handleTransparentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onItemUpdate(item.id, {
      data: {
        ...item.data,
        isTransparent: e.target.checked,
      },
    });
  };

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
  
  const handleIsBackgroundChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    if (isChecked && item.data.src) {
      onOpenBackgroundModal(item.id, item.data.src);
    } else if (!isChecked) {
      onItemUpdate(item.id, {
        data: {
          ...item.data,
          isArtboardBackground: false,
          artboardBackgroundPosition: undefined,
        },
      });
    } else if (isChecked && !item.data.src) {
       alert("先に画像をアップロードしてください。");
       e.target.checked = false;
    }
  };

  // ★ 元の `content = ( ... )` の中身をここで return する
  return (
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
          
          <div className="prop-group">
            <label className="prop-label">文字色:</label>
            <div className="prop-color-picker-wrapper">
              <input
                type="color"
                className="prop-color-picker"
                name="color"
                value={item.data?.color || "#333333"} 
                onChange={handleItemDataChange}
              />
              <input
                type="text"
                className="prop-input"
                style={{ flexGrow: 1 }}
                name="color"
                value={item.data?.color || "#333333"}
                onChange={handleItemDataChange}
              />
            </div>
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
              disabled={isUploading} // アップロード中は無効化
            />
            <label
              htmlFor={`file-input-${item.id}`}
              className="prop-button"
              style={{ 
                opacity: isUploading ? 0.6 : 1, 
                cursor: isUploading ? 'not-allowed' : 'pointer' 
              }}
            >
              {isUploading ? "アップロード中..." : "画像をアップロード"}
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
                disabled={isUploading}
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

      <AccordionSection title="配置" defaultOpen={true}>
        <div className="prop-label">重ね順</div>
        <div className="prop-grid-buttons-4">
          <button className="prop-button" onClick={() => onItemMoveToFront(item.id)}>
            最前面へ
          </button>
          <button className="prop-button" onClick={() => onItemMoveForward(item.id)}>
            前面へ
          </button>
          <button className="prop-button" onClick={() => onItemMoveBackward(item.id)}>
            背面へ
          </button>
          <button className="prop-button" onClick={() => onItemMoveToBack(item.id)}>
            最背面へ
          </button>
        </div>
      </AccordionSection>

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
          
          {item.name.startsWith("画像") && (
            <>
              <div className="prop-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
                <input
                  type="checkbox"
                  id={`is-artboard-bg-${item.id}`}
                  style={{ width: '16px', height: '16px' }}
                  checked={!!item.data?.isArtboardBackground} 
                  onChange={handleIsBackgroundChange}
                />
                <label 
                  htmlFor={`is-artboard-bg-${item.id}`}
                  style={{ fontSize: '0.9em', color: '#ccc', cursor: 'pointer' }}
                >
                  アートボードの背景にする
                </label>
              </div>
              
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
};


// --- (C) メインの PropertiesPanel (UIスイッチャー) ---
const PropertiesPanel: React.FC<{
  onOpenBackgroundModal: (itemId: string, src: string) => void;
}> = ({
  onOpenBackgroundModal
}) => {
  
  // ★ 修正: tabs と activeTabId を取得
  const { 
    tabs, 
    activeTabId, 
    activeLogicGraphId 
  } = useSelectionStore(state => ({
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
  
  // ★ 変更: selection ではなく tabs から active なものを探す
  const activeEntry = tabs.find((s) => s.id === activeTabId);

  let content = null;

  // (1) UIアイテムが選択されている場合
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
          onOpenBackgroundModal={onOpenBackgroundModal}
        />
      );
    }
  } 
  // (2) ノードが選択されている場合
  else if (activeEntry && activeEntry.type === 'node') {
    
    if (!activeLogicGraphId || !allItemLogics) {
      content = (
        <div className="properties-panel-content">
          <div className="placeholder-text">ノードのデータがまだ読み込まれていません。少し待ってから再選択してください。</div>
        </div>
      );
    } else {
      const logicTree = allItemLogics[activeLogicGraphId];
      
      if (logicTree) {
        const node = logicTree.nodes.find((n) => n.id === activeEntry.id);
        if (node) {
          content = (
            <NodePropertiesEditor
              node={node}
            />
          );
        } else {
           content = (
            <div className="properties-panel-content">
              <div className="placeholder-text">選択されたノードが見つかりません。</div>
            </div>
          );
        }
      } else {
        content = (
          <div className="properties-panel-content">
            <div className="placeholder-text">該当するロジックツリーが見つかりません。</div>
          </div>
        );
      }
    }
  } 
  
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