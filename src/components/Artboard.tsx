// src/components/Artboard.tsx

import React, { useRef, useCallback, useMemo, useState, useEffect } from "react";
import { useDrop, type DropTargetMonitor } from "react-dnd";
import { ItemTypes } from "../ItemTypes";
import type { PlacedItemType, PreviewState, VariableState } from "../types";
import "./Artboard.css";

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
  renderChildren: (parentId: string) => React.ReactNode;
  
  onItemSelect: (e: React.MouseEvent, id: string, label: string) => void;
  onItemDragStart: (e: React.MouseEvent, id: string) => void;
  onItemResizeStart: (e: React.MouseEvent, id: string, direction: ResizeDirection) => void;
  selectedIds: string[];
  activeTabId: string | null;
  isPreviewing: boolean;
  previewState: PreviewState | null;
  onItemEvent: (eventName: string, itemId: string) => void;
  variables: VariableState;
  onVariableChange: (variableName: string, value: any) => void;
}

const ArtboardItem: React.FC<ArtboardItemProps> = ({
  item,
  renderChildren,
  onItemSelect,
  onItemDragStart, 
  onItemResizeStart,
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

  const isAutoHeight = !isGroup && (item.name.startsWith("テキスト") || item.name.startsWith("ボタン") || item.name.startsWith("テキスト入力欄"));

  const style: React.CSSProperties = {
    width: item.width,
    height: isAutoHeight ? 'auto' : item.height,
    minHeight: item.height, 
    color: item.data?.color || '#333333',
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

  let content = null;
  let itemClassName = "artboard-item";
  if (isSelected && !isPreviewing) {
    itemClassName += " selected";
  }
  if (isActive && !isPreviewing) {
    itemClassName += " active-item";
  }
  if (isPreviewing) {
    itemClassName += " preview";
  }
  if (isGroup) {
    itemClassName += " is-group";
  }
  
  if (item.data?.showBorder === false) {
    itemClassName += " no-border";
  }
  if (item.data?.isTransparent === true) {
    itemClassName += " is-transparent";
  }

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

const snapToGrid = (value: number, size: number | null, min: number = -Infinity): number => {
  if (size === null) return Math.max(min, value);
  if (size === 1) return Math.max(min, Math.round(value));
  const snapped = Math.round(value / size) * size;
  return Math.max(min, snapped);
};

const Artboard: React.FC = () => {
  
  const { placedItems, updateItem, updateItems, addItem, commitHistory, deleteItems } = usePageStore(state => {
    const page = state.selectedPageId ? state.pages[state.selectedPageId] : undefined;
    return {
      placedItems: page?.placedItems || [],
      updateItem: state.updateItem,
      updateItems: state.updateItems,
      addItem: state.addItem,
      commitHistory: state.commitHistory,
      deleteItems: state.deleteItems,
    };
  });

  const { selectedIds, activeTabId, handleItemSelect, handleBackgroundClick } = useSelectionStore(state => ({
    selectedIds: state.selectedIds,
    activeTabId: state.activeTabId,
    handleItemSelect: state.handleItemSelect,
    handleBackgroundClick: state.handleBackgroundClick,
  }));
  
  const { isPreviewing, gridSize, showGrid } = useEditorSettingsStore(state => ({
    isPreviewing: state.isPreviewing,
    gridSize: state.gridSize,
    showGrid: state.showGrid,
  }));
  
  const { previewState, previewBackground, variables, onItemEvent, onVariableChange } = usePreviewStore(state => ({
    previewState: state.previewState,
    previewBackground: state.previewBackground,
    variables: state.variables,
    onItemEvent: state.handleItemEvent,
    onVariableChange: state.handleVariableChangeFromItem,
  }));

  const [zoomLevel, setZoomLevel] = useState(1.0);
  const artboardRef = useRef<HTMLDivElement>(null);
  
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const dragStartItemStates = useRef<Record<string, { x: number, y: number }>>({});
  const isDraggingRef = useRef(false);

  const ignoreNextClickRef = useRef(false);

  const resizeInfoRef = useRef<{
    startPos: { x: number; y: number };
    startItem: PlacedItemType;
    direction: ResizeDirection;
  } | null>(null);

  const showGridOverlay = !isPreviewing && showGrid && gridSize !== null && gridSize > 2;

  const gridStyle = useMemo<React.CSSProperties>(() => {
    if (!showGridOverlay || !gridSize) return { display: 'none' };
    return {
      backgroundSize: `${gridSize}px ${gridSize}px`,
      backgroundImage: `
        linear-gradient(to right, rgba(0, 0, 0, 0.08) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(0, 0, 0, 0.08) 1px, transparent 1px)
      `,
    };
  }, [showGridOverlay, gridSize]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (useEditorSettingsStore.getState().isPreviewing) return;

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

      if (e.key === "Delete" || e.key === "Backspace") {
        const activeEl = document.activeElement;
        const isInput = activeEl?.tagName === "INPUT" || activeEl?.tagName === "TEXTAREA" || (activeEl as HTMLElement)?.isContentEditable;
        if (isInput) return;

        const currentSelectedIds = useSelectionStore.getState().selectedIds;
        if (currentSelectedIds.length > 0) {
          e.preventDefault();
          deleteItems(currentSelectedIds);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [deleteItems]);

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

  const onArtboardItemSelect = useCallback((e: React.MouseEvent, id: string, label: string) => {
    if (ignoreNextClickRef.current) {
      ignoreNextClickRef.current = false;
      return;
    }

    const multiSelect = e.ctrlKey || e.metaKey;
    handleItemSelect(id, label, multiSelect);
  }, [handleItemSelect]);

  const onArtboardItemDragStart = useCallback((e: React.MouseEvent, itemId: string) => {
    if (isPreviewing) return;
    
    ignoreNextClickRef.current = false;

    const item = placedItems.find((p) => p.id === itemId);
    if (!item) return;
    if (item.data.isArtboardBackground) return;

    let targets = new Set<string>();
    const isMultiSelect = e.ctrlKey || e.metaKey;

    if (selectedIds.includes(itemId)) {
      targets = new Set(selectedIds);
    } else {
      handleItemSelect(itemId, item.data.text || item.name, isMultiSelect);
      ignoreNextClickRef.current = true;

      if (isMultiSelect) {
        targets = new Set([...selectedIds, itemId]);
      } else {
        targets = new Set([itemId]);
      }
    }

    const validTargets = new Set<string>();
    targets.forEach(id => {
      const targetItem = placedItems.find(p => p.id === id);
      if (!targetItem) return;
      
      let parent = targetItem.groupId ? placedItems.find(p => p.id === targetItem.groupId) : null;
      let parentIsTarget = false;
      
      while (parent) {
        if (targets.has(parent.id)) {
          parentIsTarget = true;
          break;
        }
        const currentParentGroupId = parent.groupId;
        parent = currentParentGroupId ? placedItems.find(p => p.id === currentParentGroupId) : null;
      }
      
      if (!parentIsTarget) {
        validTargets.add(id);
      }
    });

    isDraggingRef.current = true;
    
    const artboardRect = artboardRef.current?.getBoundingClientRect();
    if (!artboardRect) return;

    const mouseXInArtboard = (e.clientX - artboardRect.left) / zoomLevel;
    const mouseYInArtboard = (e.clientY - artboardRect.top) / zoomLevel;
    
    dragStartPos.current = { x: mouseXInArtboard, y: mouseYInArtboard };
    
    const initialStates: Record<string, { x: number, y: number }> = {};
    placedItems.forEach(p => {
      if (validTargets.has(p.id)) {
        initialStates[p.id] = { x: p.x, y: p.y };
      }
    });
    dragStartItemStates.current = initialStates;

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    e.stopPropagation();
  }, [isPreviewing, placedItems, selectedIds, handleItemSelect, zoomLevel]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingRef.current || !dragStartPos.current || !artboardRef.current) return;
    
    const artboardRect = artboardRef.current.getBoundingClientRect();
    const mouseXInArtboard = (e.clientX - artboardRect.left) / zoomLevel;
    const mouseYInArtboard = (e.clientY - artboardRect.top) / zoomLevel;

    const dx = mouseXInArtboard - dragStartPos.current.x;
    const dy = mouseYInArtboard - dragStartPos.current.y;

    const updates = Object.entries(dragStartItemStates.current).map(([id, startState]) => {
      const newX = startState.x + dx;
      const newY = startState.y + dy;
      const validX = isNaN(newX) ? startState.x : newX;
      const validY = isNaN(newY) ? startState.y : newY;
      
      return {
        id,
        props: {
          x: snapToGrid(validX, gridSize),
          y: snapToGrid(validY, gridSize)
        }
      };
    });

    if (updates.length > 0) {
      updateItems(updates, true);
      ignoreNextClickRef.current = true;
    }
  }, [updateItems, zoomLevel, gridSize]);

  const handleMouseUp = useCallback(() => {
    if (isDraggingRef.current) {
      commitHistory();
    }

    isDraggingRef.current = false;
    dragStartPos.current = null;
    dragStartItemStates.current = {};
    
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
  }, [commitHistory, handleMouseMove]);

  const handleResizing = useCallback((e: MouseEvent) => {
    if (!resizeInfoRef.current) return;
    const { startPos, startItem, direction } = resizeInfoRef.current;
    
    const dx = (e.clientX - startPos.x) / zoomLevel;
    const dy = (e.clientY - startPos.y) / zoomLevel;
    
    let newWidth = startItem.width;
    let newHeight = startItem.height;
    
    const minDim = snapToGrid(10, gridSize, 10);

    if (direction.includes("bottom")) newHeight = startItem.height + dy;
    if (direction.includes("top")) newHeight = startItem.height - dy;
    if (direction.includes("right")) newWidth = startItem.width + dx;
    if (direction.includes("left")) newWidth = startItem.width - dx;
    
    const snappedWidth = snapToGrid(newWidth, gridSize, minDim);
    const snappedHeight = snapToGrid(newHeight, gridSize, minDim);
    
    // ★ 修正: newX, newY を計算式の中で直接使用し、変数を削除
    // let snappedX = startItem.x;
    // let snappedY = startItem.y;

    // ↓↓↓ 直接計算と代入を行う形に修正 ↓↓↓
    const finalX = direction.includes("left") 
        ? snapToGrid(startItem.x + (startItem.width - snappedWidth), gridSize) 
        : startItem.x;
        
    const finalY = direction.includes("top") 
        ? snapToGrid(startItem.y + (startItem.height - snappedHeight), gridSize)
        : startItem.y;

    updateItem(startItem.id, {
      x: finalX,
      y: finalY,
      width: snappedWidth,
      height: snappedHeight,
    }, true);
  }, [updateItem, zoomLevel, gridSize]);

  const handleResizeEnd = useCallback(() => {
    if (resizeInfoRef.current) {
        commitHistory();
    }
    resizeInfoRef.current = null;
    window.removeEventListener("mousemove", handleResizing);
    window.removeEventListener("mouseup", handleResizeEnd);
  }, [commitHistory, handleResizing]);

  const onArtboardItemResizeStart = useCallback((
    e: React.MouseEvent,
    itemId: string,
    direction: ResizeDirection
  ) => {
    const item = placedItems.find((p) => p.id === itemId);
    if (!item) return;
    resizeInfoRef.current = {
      startPos: { x: e.clientX, y: e.clientY },
      startItem: { ...item },
      direction: direction,
    };
    window.addEventListener("mousemove", handleResizing);
    window.addEventListener("mouseup", handleResizeEnd);
    e.stopPropagation();
  }, [placedItems, handleResizing, handleResizeEnd]);

  const renderChildren = useCallback((parentId: string | undefined) => {
    const children = placedItems.filter(item => item.groupId === parentId);
    
    return children.map(item => (
      <MemoizedArtboardItem
        key={item.id}
        item={item}
        renderChildren={renderChildren}
        onItemSelect={onArtboardItemSelect}
        onItemDragStart={onArtboardItemDragStart}
        onItemResizeStart={onArtboardItemResizeStart}
        selectedIds={selectedIds}
        activeTabId={activeTabId}
        isPreviewing={isPreviewing}
        previewState={previewState}
        onItemEvent={onItemEvent}
        variables={variables}
        onVariableChange={onVariableChange}
      />
    ));
  }, [placedItems, onArtboardItemSelect, onArtboardItemDragStart, onArtboardItemResizeStart, selectedIds, activeTabId, isPreviewing, previewState, onItemEvent, variables, onVariableChange]);

  const MemoizedArtboardItem = useMemo(() => React.memo(ArtboardItem), []); 

  const backgroundStyle = useMemo(() => {
    if (isPreviewing) {
      if (previewBackground.src) {
        return {
          backgroundImage: `url(${previewBackground.src})`,
          backgroundPosition: previewBackground.position || '50% 50%',
          backgroundSize: 'cover',
        };
      }
    } else {
      const bgItem = placedItems.find(p => p.data.isArtboardBackground === true && p.data.src);
      if (bgItem) {
        return {
          backgroundImage: `url(${bgItem.data.src})`,
          backgroundPosition: bgItem.data.artboardBackgroundPosition || '50% 50%',
          backgroundSize: bgItem.data.artboardBackgroundSize || 'cover',
        };
      }
    }
    return {
      backgroundImage: 'none',
      backgroundPosition: '50% 50%',
      backgroundSize: 'cover',
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
          backgroundSize: backgroundStyle.backgroundSize,
        }}
        onClick={handleBackgroundClick}
      >
        {showGridOverlay && <div className="artboard-grid-overlay" style={gridStyle} />}

        {renderChildren(undefined)}
      </div>
    </div>
  );
};

export default React.memo(Artboard);