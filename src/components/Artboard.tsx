import React, { useRef, useCallback, useMemo, useState, useEffect } from "react";
import { useDrop, type DropTargetMonitor } from "react-dnd";
import { ItemTypes } from "../ItemTypes";
import type { PlacedItemType, PreviewState, VariableState } from "../types";
// import { useEditorContext } from "../contexts/EditorContext"; // 削除
import "./Artboard.css";

// ★ Zustand ストアをインポート
import { usePageStore } from "../stores/usePageStore";
import { useSelectionStore } from "../stores/useSelectionStore";
import { useEditorSettingsStore } from "../stores/useEditorSettingsStore";
import { usePreviewStore } from "../stores/usePreviewStore";

type ResizeDirection = 
  | "top-left" | "top-center" | "top-right"
  | "middle-left" | "middle-right"
  | "bottom-left" | "bottom-center" | "bottom-right";

const RESIZE_HANDLES: ResizeDirection[] = [
  "top-left", "top-center", "top-right",
  "middle-left", "middle-right",
  "bottom-left", "bottom-center", "bottom-right",
];

// --- (A) アイテムコンポーネント ---
interface ArtboardItemProps {
  item: PlacedItemType;
  onItemSelect: (id: string, label: string) => void; // (★ ラベル引数を追加)
  onItemDragStart: (e: React.MouseEvent, id: string) => void;
  onItemResizeStart: (e: React.MouseEvent, id: string, direction: ResizeDirection) => void;
  selectedItemId: string | null;
  isPreviewing: boolean;
  previewState: PreviewState | null;
  onItemEvent: (eventName: string, itemId: string) => void;
  variables: VariableState;
  onVariableChange: (variableName: string, value: any) => void;
  isDragging: boolean;
}

const ArtboardItem: React.FC<ArtboardItemProps> = ({
  item,
  onItemSelect,
  onItemDragStart, 
  onItemResizeStart,
  selectedItemId,
  isPreviewing,
  previewState,
  onItemEvent,
  variables,
  onVariableChange,
  isDragging,
}) => {
  const isSelected = item.id === selectedItemId;

  const isAutoHeight = item.name.startsWith("テキスト") || item.name.startsWith("ボタン") || item.name.startsWith("テキスト入力欄");

  const style: React.CSSProperties = {
    width: item.width,
    height: isAutoHeight ? 'auto' : item.height,
    minHeight: item.height, 
    color: item.data?.color || '#333333',
  };
  
  if (isPreviewing && previewState && previewState[item.id]) {
    const itemState = previewState[item.id];
    style.visibility = itemState.isVisible ? 'visible' : 'hidden';
    style.opacity = itemState.opacity;
    style.transform = `translate(${itemState.x}px, ${itemState.y}px) scale(${itemState.scale}) rotate(${itemState.rotation}deg)`;
    style.transition = itemState.transition || 'none';
  } else {
    style.transform = `translate(${item.x}px, ${item.y}px)`;
    style.opacity = 1;
    if (isDragging) {
      style.transition = 'none';
    }
  }

  if (!isPreviewing && item.data?.isArtboardBackground) {
    style.display = 'none';
  }

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

  useEffect(() => {
    if (item.name.startsWith("テキスト入力欄") && textareaRef.current) {
      const el = textareaRef.current;
      el.style.height = "0px";
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [inputValue, item.width, item.name]);

  const handleClick = (e: React.MouseEvent) => {
    if (isPreviewing) {
      if (e.target instanceof HTMLTextAreaElement) return;
      onItemEvent("click", item.id);
    } else {
      onItemSelect(item.id, item.data.text || item.name); // (★ ラベルを渡す)
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

  let content = null;
  let itemClassName = "artboard-item";
  if (isSelected && !isPreviewing) {
    itemClassName += " selected";
  }
  if (isPreviewing) {
    itemClassName += " preview";
  }
  
  if (item.data?.showBorder === false) {
    itemClassName += " no-border";
  }
  if (item.data?.isTransparent === true) {
    itemClassName += " is-transparent";
  }

  if (item.name.startsWith("ボタン")) {
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
          onBlur={() => {
            if (isPreviewing) {
              onItemEvent("onInputComplete", item.id);
            }
          }}
          onClick={(e) => {
            if (!isPreviewing) {
              e.stopPropagation();
              onItemSelect(item.id, item.data.text || item.name); // (★ ラベルを渡す)
            }
          }}
          onMouseDown={(e) => e.stopPropagation()}
        />
      </div>
    );
  } else {
    // テキスト
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
      {isSelected && !isPreviewing && !item.data?.isArtboardBackground && (
        <>
          {RESIZE_HANDLES.map((dir) => (
            <div
              key={dir}
              className={`resize-handle ${dir}`}
              onMouseDown={(e) => {
                e.stopPropagation();
                onItemResizeStart(e, item.id, dir);
              }}
            />
          ))}
        </>
      )}
    </div>
  );
};

// --- (B) スナップ用ヘルパー関数 ---
const snapToGrid = (value: number, size: number | null, min: number = -Infinity): number => {
  if (size === null) {
    return Math.max(min, value);
  }
  if (size === 1) {
    return Math.max(min, Math.round(value));
  }
  const snapped = Math.round(value / size) * size;
  return Math.max(min, snapped);
};

// --- (C) アートボード本体 ---
const Artboard: React.FC = () => {
  
  // ★ 修正: 派生状態 (セレクタ) を安全に修正
  const { placedItems, updateItem, addItem } = usePageStore(state => {
    const page = state.selectedPageId ? state.pages[state.selectedPageId] : undefined;
    return {
      placedItems: page?.placedItems || [],
      updateItem: state.updateItem,
      addItem: state.addItem,
    };
  });

  // SelectionStore (UI状態)
  const { activeTabId, handleItemSelect, handleBackgroundClick } = useSelectionStore(state => ({
    activeTabId: state.activeTabId,
    handleItemSelect: state.handleItemSelect,
    handleBackgroundClick: state.handleBackgroundClick,
  }));
  
  // SettingsStore (エディタ設定)
  const { isPreviewing, gridSize } = useEditorSettingsStore(state => ({
    isPreviewing: state.isPreviewing,
    gridSize: state.gridSize,
  }));
  
  // PreviewStore (プレビュー状態)
  const { previewState, previewBackground, variables, onItemEvent, onVariableChange } = usePreviewStore(state => ({
    previewState: state.previewState,
    previewBackground: state.previewBackground,
    variables: state.variables,
    onItemEvent: state.handleItemEvent,
    onVariableChange: state.handleVariableChangeFromItem,
  }));

  const selectedItemId = activeTabId; 

  const [zoomLevel, setZoomLevel] = useState(1.0);

  const artboardRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const draggedItemIdRef = useRef<string | null>(null);
  const resizeInfoRef = useRef<{
    startPos: { x: number; y: number };
    startItem: PlacedItemType;
    direction: ResizeDirection;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "=" || e.key === "+" || e.key === ";") {
          e.preventDefault();
          setZoomLevel(prev => Math.min(prev + 0.1, 5.0));
        } else if (e.key === "-") {
          e.preventDefault();
          setZoomLevel(prev => Math.max(prev - 0.1, 0.2));
        } else if (e.key === "0") {
          e.preventDefault();
          setZoomLevel(1.0);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);


  const [{ isOver }, drop] = useDrop(
    () => ({
      accept: ItemTypes.TOOL,
      collect: (monitor: DropTargetMonitor) => ({
        isOver: !!monitor.isOver(),
      }),
      drop: (item: { name: string }, monitor: DropTargetMonitor) => {
        const artboardRect = artboardRef.current?.getBoundingClientRect();
        if (!artboardRect) return;
        const clientOffset = monitor.getClientOffset();
        if (!clientOffset) return;
        
        const x = (clientOffset.x - artboardRect.left) / zoomLevel;
        const y = (clientOffset.y - artboardRect.top) / zoomLevel;

        const newItemId = `item-${Date.now()}`;
        const newItem: PlacedItemType = {
          id: newItemId,
          name: item.name,
          x: snapToGrid(x, gridSize),
          y: snapToGrid(y, gridSize),
          width: 100,
          height: 40,
          data: { text: item.name, src: null, showBorder: true, isTransparent: false, isArtboardBackground: false, color: "#333333" },
        };
        
        if (item.name === "画像") {
          newItem.width = 150; newItem.height = 100; newItem.data.text = "画像";
          newItem.data.keepAspectRatio = true;
          newItem.data.color = undefined;
        } else if (item.name === "テキスト") {
          newItem.width = 120; newItem.data.text = "テキスト";
        } else if (item.name === "テキスト入力欄") {
          newItem.width = 200; newItem.height = 45;
          newItem.data = {
            text: "", src: null, variableName: `input_${Date.now()}`, placeholder: "テキストを入力...", showBorder: true, isTransparent: false, color: "#333333"
          };
        }

        addItem(newItem);
      },
    }),
    [addItem, zoomLevel, gridSize]
  );
  drop(artboardRef); 

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!draggedItemIdRef.current || !dragStartPos.current || !artboardRef.current) return;
      const artboardRect = artboardRef.current.getBoundingClientRect();
      
      const mouseXInArtboard = (e.clientX - artboardRect.left) / zoomLevel;
      const mouseYInArtboard = (e.clientY - artboardRect.top) / zoomLevel;

      const newX = mouseXInArtboard - dragStartPos.current.x;
      const newY = mouseYInArtboard - dragStartPos.current.y;

      updateItem(draggedItemIdRef.current, {
        x: snapToGrid(newX, gridSize),
        y: snapToGrid(newY, gridSize)
      });
    },
    [updateItem, zoomLevel, gridSize]
  );

  const handleMouseUp = useCallback(() => {
    dragStartPos.current = null;
    draggedItemIdRef.current = null;
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
    setIsDragging(false);
  }, [handleMouseMove]);

  const handleItemMouseDown = useCallback((e: React.MouseEvent, itemId: string) => {
    if (isPreviewing) return;
    
    const item = placedItems.find((p) => p.id === itemId);
    if (!item) return;
    
    if (item.data.isArtboardBackground) return;

    handleItemSelect(itemId, item.data.text || item.name);
    draggedItemIdRef.current = itemId;
    setIsDragging(true);
    
    const artboardRect = artboardRef.current?.getBoundingClientRect();
    if (!artboardRect) return;

    const mouseXInArtboard = (e.clientX - artboardRect.left) / zoomLevel;
    const mouseYInArtboard = (e.clientY - artboardRect.top) / zoomLevel;
    
    dragStartPos.current = {
      x: mouseXInArtboard - snapToGrid(item.x, gridSize),
      y: mouseYInArtboard - snapToGrid(item.y, gridSize),
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    e.stopPropagation();
  }, [isPreviewing, placedItems, handleItemSelect, handleMouseMove, handleMouseUp, zoomLevel, gridSize]);
  
  const handleResizing = useCallback((e: MouseEvent) => {
    if (!resizeInfoRef.current) return;
    const { startPos, startItem, direction } = resizeInfoRef.current;
    
    const dx = (e.clientX - startPos.x) / zoomLevel;
    const dy = (e.clientY - startPos.y) / zoomLevel;
    
    let newX = startItem.x;
    let newY = startItem.y;
    let newWidth = startItem.width;
    let newHeight = startItem.height;
    
    const minDim = snapToGrid(10, gridSize, 10);

    if (direction.includes("bottom")) newHeight = startItem.height + dy;
    if (direction.includes("top")) newHeight = startItem.height - dy;
    if (direction.includes("right")) newWidth = startItem.width + dx;
    if (direction.includes("left")) newWidth = startItem.width - dx;
    
    const snappedWidth = snapToGrid(newWidth, gridSize, minDim);
    const snappedHeight = snapToGrid(newHeight, gridSize, minDim);
    
    let snappedX = startItem.x;
    let snappedY = startItem.y;

    if (direction.includes("left")) {
      snappedX = snapToGrid(startItem.x + (startItem.width - snappedWidth), gridSize);
    }
    if (direction.includes("top")) {
      snappedY = snapToGrid(startItem.y + (startItem.height - snappedHeight), gridSize);
    }

    updateItem(startItem.id, {
      x: snappedX,
      y: snappedY,
      width: snappedWidth,
      height: snappedHeight,
    });
  }, [updateItem, zoomLevel, gridSize]);

  const handleResizeEnd = useCallback(() => {
    resizeInfoRef.current = null;
    window.removeEventListener("mousemove", handleResizing);
    window.removeEventListener("mouseup", handleResizeEnd);
    setIsDragging(false);
  }, [handleResizing]);

  const handleItemResizeStart = useCallback((
    e: React.MouseEvent,
    itemId: string,
    direction: ResizeDirection
  ) => {
    const item = placedItems.find((p) => p.id === itemId);
    if (!item) return;
    setIsDragging(true);
    resizeInfoRef.current = {
      startPos: { x: e.clientX, y: e.clientY },
      startItem: {
        ...item,
        x: snapToGrid(item.x, gridSize),
        y: snapToGrid(item.y, gridSize),
        width: snapToGrid(item.width, gridSize, 10),
        height: snapToGrid(item.height, gridSize, 10),
      },
      direction: direction,
    };
    window.addEventListener("mousemove", handleResizing);
    window.addEventListener("mouseup", handleResizeEnd);
    e.stopPropagation();
  }, [placedItems, handleResizing, handleResizeEnd, gridSize]);
  

  const MemoizedArtboardItem = useMemo(() => React.memo(ArtboardItem), []); 

  const backgroundStyle = useMemo(() => {
    if (isPreviewing) {
      if (previewBackground.src) {
        return {
          backgroundImage: `url(${previewBackground.src})`,
          backgroundPosition: previewBackground.position || '50% 50%',
        };
      }
    } else {
      const bgItem = placedItems.find(p => p.data.isArtboardBackground === true && p.data.src);
      if (bgItem) {
        return {
          backgroundImage: `url(${bgItem.data.src})`,
          backgroundPosition: bgItem.data.artboardBackgroundPosition || '50% 50%',
        };
      }
    }
    return {
      backgroundImage: 'none',
      backgroundPosition: '50% 50%',
    };
  }, [placedItems, isPreviewing, previewBackground]);

  return (
    <div 
      className="artboard-wrapper" 
      style={{ 
        width: `${1000 * zoomLevel}px`, 
        height: `${700 * zoomLevel}px`,
        margin: "20px auto",
        position: "relative"
      }}
    >
      <div
        ref={artboardRef}
        className={`artboard ${isOver ? "is-over" : ""} ${backgroundStyle.backgroundImage !== 'none' ? 'has-background-image' : ''}`}
        style={{
          transform: `scale(${zoomLevel})`,
          margin: 0,
          backgroundImage: backgroundStyle.backgroundImage,
          backgroundPosition: backgroundStyle.backgroundPosition,
        }}
        onClick={handleBackgroundClick}
      >
        {placedItems.map((item) => (
          <MemoizedArtboardItem
            key={item.id}
            item={item}
            onItemSelect={handleItemSelect}
            onItemDragStart={handleItemMouseDown}
            onItemResizeStart={handleItemResizeStart}
            selectedItemId={selectedItemId}
            isPreviewing={isPreviewing}
            previewState={previewState}
            onItemEvent={onItemEvent}
            variables={variables}
            onVariableChange={onVariableChange}
            isDragging={isDragging}
          />
        ))}
      </div>
    </div>
  );
};

export default React.memo(Artboard);