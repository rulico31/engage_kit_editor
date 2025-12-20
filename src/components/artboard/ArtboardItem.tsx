import React, { useState, useRef, useEffect } from "react";
import type { PlacedItemType, PreviewState, VariableState } from "../../types";
import "../Artboard.css";
import { ResizeHandles } from "./ResizeHandles";
import { useSelectionStore } from "../../stores/useSelectionStore";

interface ArtboardItemProps {
  item: PlacedItemType;
  renderChildren: (parentId: string) => React.ReactNode;
  onItemSelect: (e: React.MouseEvent, id: string, label: string) => void;
  onItemDragStart: (e: React.MouseEvent, id: string) => void;
  selectedIds: string[];
  activeTabId: string | null;
  isPreviewing: boolean;
  isMobileView?: boolean;
  previewState: PreviewState | null;
  onItemEvent: (eventName: string, itemId: string) => void;
  variables: VariableState;
  onVariableChange: (variableName: string, value: any) => void;
  zoomLevel: number;
  onItemUpdate: (id: string, updates: Partial<PlacedItemType>, addToHistory?: boolean) => void;
}

export const ArtboardItem: React.FC<ArtboardItemProps> = ({
  item,
  renderChildren,
  onItemSelect,
  onItemDragStart,
  selectedIds,
  activeTabId,
  isPreviewing,
  isMobileView = false,
  previewState,
  onItemEvent,
  variables,
  onVariableChange,
  zoomLevel,
  onItemUpdate,
}) => {
  // activeLogicGraphIdを取得（ロジック編集中のアイテムIDを保持）
  const activeLogicGraphId = useSelectionStore((s) => s.activeLogicGraphId);

  // selectedIdsに含まれているか、またはactiveLogicGraphIdと一致するかで選択状態を判定
  const isSelected = selectedIds.includes(item.id) || item.id === activeLogicGraphId;
  const isActive = item.id === activeTabId;
  const isGroup = item.id.startsWith("group");

  // ハイライト状態を取得
  const highlightedItemIds = useSelectionStore((s) => s.highlightedItemIds);
  const isHighlighted = highlightedItemIds.includes(item.id);

  // 入力系アイテムの自動高さ調整除外設定
  const isAutoHeight = !isGroup && (item.name.startsWith("テキスト") || item.name.startsWith("ボタン"));

  // モバイル表示時の座標・サイズ (相対配置ロジック)
  const mobileScale = 375 / 1000;

  const x = isMobileView ? item.x * mobileScale : item.x;
  const y = isMobileView ? item.y * mobileScale : item.y;
  const width = isMobileView ? item.width * mobileScale : item.width;
  const height = isMobileView ? item.height * mobileScale : item.height;

  // --- スタイルの分離 ---

  // 1. コンテナ用スタイル (位置、サイズ、背景、ボックスシャドウ)
  const containerStyle: React.CSSProperties = {
    width: width,
    height: isAutoHeight ? 'auto' : height,
    minHeight: height,
    display: isGroup ? 'block' : 'flex',
  };

  // 背景色（isTransparentがtrueの場合は強制的にtransparent）
  if (item.data?.isTransparent === true) {
    containerStyle.backgroundColor = 'transparent';
  } else if (item.style?.backgroundColor) {
    containerStyle.backgroundColor = item.style.backgroundColor;
  }

  // ボックスシャドウ (Shadow & Glow)
  const boxShadows: string[] = [];
  if (item.style?.shadow?.enabled) {
    const { x, y, blur, color } = item.style.shadow;
    boxShadows.push(`${x}px ${y}px ${blur}px ${color}`);
  }
  if (item.style?.glow?.enabled) {
    const { blur, spread, color } = item.style.glow;
    boxShadows.push(`0 0 ${blur}px ${spread}px ${color}`);
  }
  if (boxShadows.length > 0) {
    containerStyle.boxShadow = boxShadows.join(', ');
  }

  // プレビュー状態の反映 (コンテナ)
  if (isPreviewing && previewState && previewState[item.id]) {
    const itemState = previewState[item.id];
    containerStyle.visibility = itemState.isVisible ? 'visible' : 'hidden';
    containerStyle.opacity = itemState.opacity;
    containerStyle.transform = `translate(${itemState.x}px, ${itemState.y}px) scale(${itemState.scale}) rotate(${itemState.rotation}deg)`;
    containerStyle.transition = itemState.transition || 'none';
  } else {
    containerStyle.position = 'absolute';
    containerStyle.left = x;
    containerStyle.top = y;

    if (item.data.initialVisibility === false) {
      containerStyle.opacity = 0.5;
    }
  }

  // 背景設定されている場合は表示しない
  if (item.data?.isArtboardBackground) {
    containerStyle.display = 'none';
  }

  // 2. テキストコンテンツ用スタイル (色、フォントサイズ、テキストシャドウ)
  const textStyle: React.CSSProperties = {
    color: item.data?.color || '#333333',
    fontSize: `${(item.data?.fontSize || 15) * (isMobileView ? mobileScale : 1)}px`,
    width: '100%', // 親に合わせる
    height: '100%',
  };

  // テキストシャドウ (Shadow & Glow)
  const textShadows: string[] = [];
  if (item.style?.textShadow?.enabled) {
    const { x, y, blur, color } = item.style.textShadow;
    textShadows.push(`${x}px ${y}px ${blur}px ${color}`);
  }
  if (item.style?.textGlow?.enabled) {
    const { blur, color } = item.style.textGlow;
    textShadows.push(`0 0 ${blur}px ${color}`);
  }
  if (textShadows.length > 0) {
    textStyle.textShadow = textShadows.join(', ');
  }

  // 入力値の同期処理
  const variableName = item.data?.variableName || "";
  const externalValue = variables[variableName] || "";
  const [inputValue, setInputValue] = useState(externalValue);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isPreviewing) {
      if (externalValue !== inputValue) {
        setInputValue(externalValue);
      }
    } else {
      setInputValue("");
    }
  }, [externalValue, isPreviewing]);

  // イベントハンドラ
  const handleClick = (e: React.MouseEvent) => {
    if (isPreviewing) {
      if (e.target instanceof HTMLTextAreaElement) return;
      onItemEvent("click", item.id);
    } else {
      onItemSelect(e, item.id, item.data.text || item.name);
      e.stopPropagation();
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target instanceof HTMLTextAreaElement) {
      e.stopPropagation();
      return;
    }
    if (!isPreviewing) {
      onItemDragStart(e, item.id);
      e.stopPropagation();
    }
  };

  // コンテンツの生成
  let content = null;
  let itemClassName = "artboard-item";
  if (isSelected && !isPreviewing) itemClassName += " selected";
  if (isActive && !isPreviewing) itemClassName += " active-item";
  if (isPreviewing) itemClassName += " preview";
  if (isGroup) itemClassName += " is-group";
  if (item.data?.showBorder === false) itemClassName += " no-border";
  if (item.data?.isTransparent === true) itemClassName += " is-transparent";
  if (item.name.startsWith("テキスト入力欄")) itemClassName += " is-input";
  if (isHighlighted && !isPreviewing) itemClassName += " highlighted";

  if (isGroup) {
    content = null;
  } else if (item.name.startsWith("ボタン")) {
    content = (
      <button className="item-button-content" style={textStyle}>
        {item.data.text}
      </button>
    );
  } else if (item.name.startsWith("画像")) {
    containerStyle.height = item.height;
    containerStyle.minHeight = undefined;
    if (item.data?.src) {
      content = (
        <div className="item-image-content">
          <img src={item.data.src} alt={item.data.text} draggable={false} />
        </div>
      );
    } else {
      content = (
        <div className="item-image-content is-placeholder">
          {item.data.text} (No Image)
        </div>
      );
    }
  } else if (item.name.startsWith("テキスト入力欄")) {
    let placeholder = item.data?.placeholder || "テキストを入力...";
    // 必須入力の場合、プレースホルダーにアスタリスクを追加
    if (item.data?.required) {
      placeholder = `* ${placeholder}`;
    }

    content = (
      <div className="item-input-content">
        <textarea
          ref={textareaRef}
          className="artboard-item-textarea"
          style={{
            ...textStyle,
            // @ts-ignore - CSS変数の設定
            '--placeholder-color': item.data?.color || '#999999',
          }}
          placeholder={placeholder}
          value={inputValue}
          readOnly={!isPreviewing}
          onChange={(e) => {
            if (isPreviewing) {
              setInputValue(e.target.value);
              onVariableChange(variableName, e.target.value);
            }
          }}
          onKeyDown={(e) => {
            if (isPreviewing && e.key === "Enter") {
              e.currentTarget.blur();
              onItemEvent("onInputComplete", item.id);
            }
          }}
          onBlur={() => { if (isPreviewing) onItemEvent("onInputComplete", item.id); }}
          onClick={(e) => {
            if (!isPreviewing) {
              e.stopPropagation();
              onItemSelect(e, item.id, item.data.text || item.name);
            }
          }}
          onMouseDown={(e) => e.stopPropagation()}
        />
      </div>
    );
  } else {
    // 通常のテキスト
    content = (
      <div className="item-text-content" style={textStyle}>
        {item.data.text}
      </div>
    );
  }

  return (
    <div
      className={itemClassName}
      style={containerStyle}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
    >
      {content}
      {renderChildren(item.id)}

      {isSelected && !isPreviewing && (
        <ResizeHandles
          item={item}
          zoomLevel={zoomLevel}
          onResizeStart={() => { }}
          onResize={(updates) => onItemUpdate(item.id, updates, false)}
          onResizeEnd={() => onItemUpdate(item.id, {}, true)}
        />
      )}
    </div>
  );
};