// src/components/Artboard.tsx

// (★ 変更なし)
import React, { useRef, useCallback, useMemo, useState, useEffect } from "react";
import { useDrop, type DropTargetMonitor } from "react-dnd";
import { ItemTypes } from "../ItemTypes";
// (★ 変更なし) Context をインポート
import type { PlacedItemType, NodeGraph, PreviewState, VariableState } from "../types";
import { useEditorContext } from "../contexts/EditorContext";
import "./Artboard.css";

// (★ 変更なし) リサイズハンドルの定義
type ResizeDirection = 
  | "top-left" | "top-center" | "top-right"
  | "middle-left" | "middle-right"
  | "bottom-left" | "bottom-center" | "bottom-right";

const RESIZE_HANDLES: ResizeDirection[] = [
  "top-left", "top-center", "top-right",
  "middle-left", "middle-right",
  "bottom-left", "bottom-center", "bottom-right",
];


// --- (A) アイテムの型定義 ---
interface ArtboardItemProps {
  item: PlacedItemType;
  onItemSelect: (id: string) => void;
  onItemDragStart: (e: React.MouseEvent, id: string) => void;
  onItemResizeStart: (e: React.MouseEvent, id: string, direction: ResizeDirection) => void;
  selectedItemId: string | null;
  // (プレビュー用)
  isPreviewing: boolean;
  previewState: PreviewState | null;
  onItemEvent: (eventName: string, itemId: string) => void;
  
  // (★ 変更なし) 変数関連のProps
  variables: VariableState;
  onVariableChange: (variableName: string, value: any) => void;
  
  // (★ 変更なし) ドラッグ中フラグ
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
  // (★ 変更なし)
  const isSelected = item.id === selectedItemId;

  // (★ 変更なし) プレビュースタイル
  const style: React.CSSProperties = {
    width: item.width,
    height: item.height,
  };
  
  // (★ 変更なし) ドラッグ中の transition を制御
  if (isPreviewing && previewState && previewState[item.id]) {
    const itemState = previewState[item.id];
    style.visibility = itemState.isVisible ? 'visible' : 'hidden';
    style.opacity = itemState.opacity;
    style.transform = `translate(${itemState.x}px, ${itemState.y}px) scale(${itemState.scale}) rotate(${itemState.rotation}deg)`;
    style.transition = itemState.transition || 'none';
  } else {
    // 編集モード
    style.transform = `translate(${item.x}px, ${item.y}px)`;
    style.opacity = 1;
    
    if (isDragging) {
      style.transition = 'none';
    }
  }

  // (★ 変更なし) テキスト入力欄のローカルステート管理
  const variableName = item.data?.variableName || "";
  const externalValue = variables[variableName] || "";
  const [inputValue, setInputValue] = useState(externalValue);

  // (★ 変更済) プレビュー終了時に値をクリアするロジック
  useEffect(() => {
    if (isPreviewing) {
      if (externalValue !== inputValue) {
        setInputValue(externalValue);
      }
    } else {
      setInputValue(""); 
    }
  }, [externalValue, isPreviewing]);


  // (★ 変更なし) イベントハンドラ
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

  // (★ 変更なし) レンダリング
  let content = null;
  let itemClassName = "artboard-item";
  if (isSelected && !isPreviewing) {
    itemClassName += " selected";
  }
  if (isPreviewing) {
    itemClassName += " preview";
  }

  // (★ 変更なし) アイテム種別切り替え
  if (item.name.startsWith("ボタン")) {
    content = <button className="item-button-content">{item.data.text}</button>;
  } else if (item.name.startsWith("画像")) {
    if (item.data?.src) {
      content = (
        <div className="item-image-content">
          <img
            src={item.data.src}
            alt={item.data.text}
            draggable={false}
          />
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
          onChange={(e) => {
            if (isPreviewing) {
              setInputValue(e.target.value);
              onVariableChange(variableName, e.target.value);
              onItemEvent("onInputChanged", item.id);
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
      
      {/* (★ 変更なし) リサイズハンドルの描画 */}
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

// --- (B) アートボード本体の型定義 ---
// (★ 変更なし) Props の定義を削除

// (★ 変更なし) Props を受け取らない
const Artboard: React.FC = () => {

  // (★ 変更なし) Context から必要なデータ/関数を取得
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

  // (★ 変更なし)
  const artboardRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const draggedItemIdRef = useRef<string | null>(null);
  const resizeInfoRef = useRef<{
    startPos: { x: number; y: number };
    startItem: PlacedItemType;
    direction: ResizeDirection;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // (★ 変更なし) アイテムのドラッグ＆ドロップ (D&D)
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
        const x = clientOffset.x - artboardRect.left;
        const y = clientOffset.y - artboardRect.top;
        const newItemId = `item-${Date.now()}`;
        const newItem: PlacedItemType = {
          id: newItemId,
          name: item.name,
          x: x,
          y: y,
          width: 100,
          height: 40,
          data: {
            text: item.name,
            src: null,
          },
        };
        if (item.name === "画像") {
          newItem.width = 150;
          newItem.height = 100;
          newItem.data.text = "画像";
        } else if (item.name === "テキスト") {
          newItem.width = 120;
          newItem.data.text = "テキスト";
        } else if (item.name === "テキスト入力欄") {
          newItem.width = 200;
          newItem.height = 45;
          newItem.data = {
            text: "", 
            src: null,
            variableName: `input_${Date.now()}`,
            placeholder: "テキストを入力...",
          };
        }
        setPlacedItems((prev) => [...prev, newItem]);
        const templateKey = Object.keys(nodeGraphTemplates).find(key => item.name.startsWith(key)) || "Default";
        const newGraph = nodeGraphTemplates[templateKey];
        setAllItemLogics((prev) => ({
          ...prev,
          [newItemId]: newGraph
        }));
        onItemSelect(newItemId);
      },
    }),
    [setPlacedItems, setAllItemLogics, nodeGraphTemplates, onItemSelect]
  );
  drop(artboardRef); 

  // (★ 変更なし) アートボード上でのアイテム移動 (ドラッグ)
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!draggedItemIdRef.current || !dragStartPos.current || !artboardRef.current) return;
      const artboardRect = artboardRef.current.getBoundingClientRect();
      const newX = e.clientX - artboardRect.left - dragStartPos.current.x;
      const newY = e.clientY - artboardRect.top - dragStartPos.current.y;
      setPlacedItems((prev) =>
        prev.map((item) =>
          item.id === draggedItemIdRef.current ? { ...item, x: newX, y: newY } : item
        )
      );
    },
    [setPlacedItems]
  );
  // (★ 変更なし)
  const handleMouseUp = useCallback(() => {
    dragStartPos.current = null;
    draggedItemIdRef.current = null;
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
    
    setIsDragging(false);
  }, [handleMouseMove]);

  // (★ 変更なし) useCallback でラップ（依存配列を修正）
  const handleItemMouseDown = useCallback((e: React.MouseEvent, itemId: string) => {
    if (isPreviewing) return;
    
    const item = placedItems.find((p) => p.id === itemId);
    if (!item) return;

    onItemSelect(itemId);
    draggedItemIdRef.current = itemId;
    
    setIsDragging(true);
    
    const artboardRect = artboardRef.current?.getBoundingClientRect();
    if (!artboardRect) return;

    const mouseXInArtboard = e.clientX - artboardRect.left;
    const mouseYInArtboard = e.clientY - artboardRect.top;
    
    dragStartPos.current = {
      x: mouseXInArtboard - item.x,
      y: mouseYInArtboard - item.y,
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    
    e.stopPropagation();
  }, [isPreviewing, placedItems, onItemSelect, handleMouseMove, handleMouseUp]);
  
  // (★ 変更なし) リサイズ処理
  const handleResizing = useCallback((e: MouseEvent) => {
    if (!resizeInfoRef.current) return;
    
    const { startPos, startItem, direction } = resizeInfoRef.current;
    
    const dx = e.clientX - startPos.x;
    const dy = e.clientY - startPos.y;
    
    let newX = startItem.x;
    let newY = startItem.y;
    let newWidth = startItem.width;
    let newHeight = startItem.height;

    if (direction.includes("bottom")) {
      newHeight = Math.max(10, startItem.height + dy);
    }
    if (direction.includes("top")) {
      newHeight = Math.max(10, startItem.height - dy);
      newY = startItem.y + dy;
    }
    if (direction.includes("right")) {
      newWidth = Math.max(10, startItem.width + dx);
    }
    if (direction.includes("left")) {
      newWidth = Math.max(10, startItem.width - dx);
      newX = startItem.x + dx;
    }
    
    if (newWidth <= 10) {
      if (direction.includes("left")) newX = startItem.x + startItem.width - 10;
    }
    if (newHeight <= 10) {
      if (direction.includes("top")) newY = startItem.y + startItem.height - 10;
    }

    setPlacedItems((prev) =>
      prev.map((item) =>
        item.id === startItem.id
          ? { ...item, x: newX, y: newY, width: newWidth, height: newHeight }
          : item
      )
    );
  }, [setPlacedItems]);

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
  

  // --- (3) ArtboardItem をメモ化 ---
  // (★ 変更なし)
  const MemoizedArtboardItem = useMemo(() => {
    return React.memo(ArtboardItem);
  }, []); 

  return (
    <div
      ref={artboardRef}
      className={`artboard ${isOver ? "is-over" : ""}`}
      onClick={onBackgroundClick}
    >
      {placedItems.map((item) => (
        <MemoizedArtboardItem
          key={item.id}
          item={item}
          // (★) 2つのPropを正しく渡す
          onItemSelect={onItemSelect}
          onItemDragStart={handleItemMouseDown}
          onItemResizeStart={handleItemResizeStart}
          selectedItemId={selectedItemId}
          // (プレビュー用)
          isPreviewing={isPreviewing}
          previewState={previewState}
          onItemEvent={onItemEvent}
          // (変数関連)
          variables={variables}
          onVariableChange={onVariableChange}
          // (★ 変更なし) ドラッグ中フラグを渡す
          isDragging={isDragging}
        />
      ))}
    </div>
  );
};

// (★ 変更なし) Artboard コンポーネント自体をメモ化
export default React.memo(Artboard);