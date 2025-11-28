import React, { useState, useRef, useEffect } from "react";
import type { PlacedItemType, PreviewState, VariableState } from "../../types";
import "../Artboard.css";

interface ArtboardItemProps {
  item: PlacedItemType;
  renderChildren: (parentId: string) => React.ReactNode;
  onItemSelect: (e: React.MouseEvent, id: string, label: string) => void;
  onItemDragStart: (e: React.MouseEvent, id: string) => void;
  selectedIds: string[];
  activeTabId: string | null;
  isPreviewing: boolean;
  previewState: PreviewState | null;
  onItemEvent: (eventName: string, itemId: string) => void;
  variables: VariableState;
  onVariableChange: (variableName: string, value: any) => void;
}

export const ArtboardItem: React.FC<ArtboardItemProps> = ({
  item,
  renderChildren,
  onItemSelect,
  onItemDragStart,
  selectedIds,
  activeTabId,
  isPreviewing,
  previewState,
  onItemEvent,
  variables,
  onVariableChange,
}) => {
  const isSelected = selectedIds.includes(item.id);
  const isActive = item.id === activeTabId;
  const isGroup = item.id.startsWith("group");

  // 入力系アイテムの自動高さ調整除外設定
  const isAutoHeight = !isGroup && (item.name.startsWith("テキスト") || item.name.startsWith("ボタン"));

  // スタイル計算
  const style: React.CSSProperties = {
    width: item.width,
    height: isAutoHeight ? 'auto' : item.height,
    minHeight: item.height,
    color: item.data?.color || '#333333',
    fontSize: item.data?.fontSize ? `${item.data.fontSize}px` : '15px',
    display: isGroup ? 'block' : 'flex',
  };

  if (isPreviewing && previewState && previewState[item.id]) {
    const itemState = previewState[item.id];
    style.visibility = itemState.isVisible ? 'visible' : 'hidden';
    style.opacity = itemState.opacity;
    style.transform = `translate(${itemState.x}px, ${itemState.y}px) scale(${itemState.scale}) rotate(${itemState.rotation}deg)`;
    style.transition = itemState.transition || 'none';
  } else {
    style.position = 'absolute';
    style.left = item.x;
    style.top = item.y;

    if (item.data.initialVisibility === false) {
      style.opacity = 0.5;
    }
  }

  // 背景設定されている場合は表示しない
  if (item.data?.isArtboardBackground) {
    style.display = 'none';
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

  if (isGroup) {
    content = null;
  } else if (item.name.startsWith("ボタン")) {
    content = <button className="item-button-content">{item.data.text}</button>;
  } else if (item.name.startsWith("画像")) {
    style.height = item.height;
    style.minHeight = undefined;
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
    const placeholder = item.data?.placeholder || "テキストを入力...";
    content = (
      <div className="item-input-content">
        <textarea
          ref={textareaRef}
          className="artboard-item-textarea"
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
    content = <div className="item-text-content">{item.data.text}</div>;
  }

  return (
    <div
      className={itemClassName}
      style={style}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
    >
      {content}
      {renderChildren(item.id)}
    </div>
  );
};