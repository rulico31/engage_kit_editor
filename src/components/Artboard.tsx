// src/components/Artboard.tsx

import React, { useRef, useCallback, useMemo, useState, useEffect } from "react";
import { useDrop, type DropTargetMonitor } from "react-dnd";
import { ItemTypes } from "../ItemTypes";
import type { PlacedItemType, PreviewState, VariableState } from "../types";
import { useEditorContext } from "../contexts/EditorContext";
import "./Artboard.css";

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
  onItemSelect: (id: string) => void;
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

  const style: React.CSSProperties = {
    width: item.width,
    height: item.height,
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

  const variableName = item.data?.variableName || "";
  const externalValue = variables[variableName] || "";
  const [inputValue, setInputValue] = useState(externalValue);

  useEffect(() => {
    if (isPreviewing) {
      if (externalValue !== inputValue) {
        setInputValue(externalValue);
      }
    } else {
      setInputValue(""); 
    }
  }, [externalValue, isPreviewing]);

  const handleClick = (e: React.MouseEvent) => {
    if (isPreviewing) {
      if (e.target instanceof HTMLInputElement) return;
      onItemEvent("click", item.id);
    } else {
      onItemSelect(item.id);
      e.stopPropagation();
    }
  };
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target instanceof HTMLInputElement) {
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

  if (item.name.startsWith("ボタン")) {
    content = <button className="item-button-content">{item.data.text}</button>;
  } else if (item.name.startsWith("画像")) {
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
        <input
          type="text"
          className="artboard-item-input"
          placeholder={placeholder}
          value={inputValue}
          readOnly={!isPreviewing}
          // ★ 変更: 入力中は変数更新のみ行い、イベントは発火しない
          onChange={(e) => {
            if (isPreviewing) {
              setInputValue(e.target.value);
              onVariableChange(variableName, e.target.value);
            }
          }}
          // ★ 追加: エンターキーが押されたら完了とみなす
          onKeyDown={(e) => {
            if (isPreviewing && e.key === "Enter") {
              e.currentTarget.blur(); // フォーカスを外す
              onItemEvent("onInputComplete", item.id);
            }
          }}
          // ★ 追加: フォーカスが外れたら完了とみなす
          onBlur={() => {
            if (isPreviewing) {
              onItemEvent("onInputComplete", item.id);
            }
          }}
          onClick={(e) => {
            if (!isPreviewing) {
              e.stopPropagation();
              onItemSelect(item.id);
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
      {isSelected && !isPreviewing && (
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

// --- (B) アートボード本体 ---
const Artboard: React.FC = () => {
  const {
    placedItems,
    setPlacedItems,
    onItemSelect,
    onBackgroundClick,
    selection,
    activeTabId,
    setAllItemLogics,
    nodeGraphTemplates,
    isPreviewing,
    previewState,
    onItemEvent,
    variables,
    onVariableChange,
  } = useEditorContext();
  
  const selectedItemId = selection.find(s => s.id === activeTabId && s.type === 'item')?.id || null;

  // Zoom State
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

  // ショートカットキーによるズーム制御
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


  // --- D&D ---
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
        
        // Zoom補正
        const x = (clientOffset.x - artboardRect.left) / zoomLevel;
        const y = (clientOffset.y - artboardRect.top) / zoomLevel;

        const newItemId = `item-${Date.now()}`;
        const newItem: PlacedItemType = {
          id: newItemId,
          name: item.name,
          x: x,
          y: y,
          width: 100,
          height: 40,
          data: { text: item.name, src: null },
        };
        
        if (item.name === "画像") {
          newItem.width = 150; newItem.height = 100; newItem.data.text = "画像";
        } else if (item.name === "テキスト") {
          newItem.width = 120; newItem.data.text = "テキスト";
        } else if (item.name === "テキスト入力欄") {
          newItem.width = 200; newItem.height = 45;
          newItem.data = {
            text: "", src: null, variableName: `input_${Date.now()}`, placeholder: "テキストを入力...",
          };
        }

        setPlacedItems((prev) => [...prev, newItem]);
        const templateKey = Object.keys(nodeGraphTemplates).find(key => item.name.startsWith(key)) || "Default";
        const newGraph = nodeGraphTemplates[templateKey];
        setAllItemLogics((prev) => ({ ...prev, [newItemId]: newGraph }));
        onItemSelect(newItemId);
      },
    }),
    [setPlacedItems, setAllItemLogics, nodeGraphTemplates, onItemSelect, zoomLevel]
  );
  drop(artboardRef); 

  // --- アイテム移動 ---
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!draggedItemIdRef.current || !dragStartPos.current || !artboardRef.current) return;
      const artboardRect = artboardRef.current.getBoundingClientRect();
      
      // Zoom補正
      const mouseXInArtboard = (e.clientX - artboardRect.left) / zoomLevel;
      const mouseYInArtboard = (e.clientY - artboardRect.top) / zoomLevel;

      const newX = mouseXInArtboard - dragStartPos.current.x;
      const newY = mouseYInArtboard - dragStartPos.current.y;

      setPlacedItems((prev) =>
        prev.map((item) =>
          item.id === draggedItemIdRef.current ? { ...item, x: newX, y: newY } : item
        )
      );
    },
    [setPlacedItems, zoomLevel]
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

    onItemSelect(itemId);
    draggedItemIdRef.current = itemId;
    setIsDragging(true);
    
    const artboardRect = artboardRef.current?.getBoundingClientRect();
    if (!artboardRect) return;

    // Zoom補正
    const mouseXInArtboard = (e.clientX - artboardRect.left) / zoomLevel;
    const mouseYInArtboard = (e.clientY - artboardRect.top) / zoomLevel;
    
    dragStartPos.current = {
      x: mouseXInArtboard - item.x,
      y: mouseYInArtboard - item.y,
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    e.stopPropagation();
  }, [isPreviewing, placedItems, onItemSelect, handleMouseMove, handleMouseUp, zoomLevel]);
  
  // --- リサイズ ---
  const handleResizing = useCallback((e: MouseEvent) => {
    if (!resizeInfoRef.current) return;
    const { startPos, startItem, direction } = resizeInfoRef.current;
    
    // Zoom補正
    const dx = (e.clientX - startPos.x) / zoomLevel;
    const dy = (e.clientY - startPos.y) / zoomLevel;
    
    let newX = startItem.x;
    let newY = startItem.y;
    let newWidth = startItem.width;
    let newHeight = startItem.height;

    if (direction.includes("bottom")) newHeight = Math.max(10, startItem.height + dy);
    if (direction.includes("top")) {
      newHeight = Math.max(10, startItem.height - dy);
      newY = startItem.y + dy;
    }
    if (direction.includes("right")) newWidth = Math.max(10, startItem.width + dx);
    if (direction.includes("left")) {
      newWidth = Math.max(10, startItem.width - dx);
      newX = startItem.x + dx;
    }
    
    if (newWidth <= 10 && direction.includes("left")) newX = startItem.x + startItem.width - 10;
    if (newHeight <= 10 && direction.includes("top")) newY = startItem.y + startItem.height - 10;

    setPlacedItems((prev) =>
      prev.map((item) => item.id === startItem.id ? { ...item, x: newX, y: newY, width: newWidth, height: newHeight } : item)
    );
  }, [setPlacedItems, zoomLevel]);

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
      startItem: item,
      direction: direction,
    };
    window.addEventListener("mousemove", handleResizing);
    window.addEventListener("mouseup", handleResizeEnd);
    e.stopPropagation();
  }, [placedItems, handleResizing, handleResizeEnd]);
  

  const MemoizedArtboardItem = useMemo(() => React.memo(ArtboardItem), []); 

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
        className={`artboard ${isOver ? "is-over" : ""}`}
        style={{
          transform: `scale(${zoomLevel})`,
          transformOrigin: "0 0",
          margin: 0,
        }}
        onClick={onBackgroundClick}
      >
        {placedItems.map((item) => (
          <MemoizedArtboardItem
            key={item.id}
            item={item}
            onItemSelect={onItemSelect}
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