// src/components/Artboard.tsx

// (★ 変更なし)
import React, { useRef, useCallback, useMemo, useState, useEffect } from "react";
import { useDrop, type DropTargetMonitor } from "react-dnd";
import { ItemTypes } from "../ItemTypes";
import type { PlacedItemType, NodeGraph, PreviewState, VariableState } from "../types";
import "./Artboard.css";

// --- (A) アイテムの型定義 ---
// (★ 変更なし)
interface ArtboardItemProps {
  item: PlacedItemType;
  onItemSelect: (id: string) => void;
  onItemDragStart: (e: React.MouseEvent, id: string) => void;
  selectedItemId: string | null;
  isPreviewing: boolean;
  previewState: PreviewState | null;
  onItemEvent: (eventName: string, itemId: string) => void;
  variables: VariableState;
  onVariableChange: (variableName: string, value: any) => void;
}

const ArtboardItem: React.FC<ArtboardItemProps> = ({
  item,
  onItemSelect,
  onItemDragStart, 
  selectedItemId,
  isPreviewing,
  previewState,
  onItemEvent,
  variables,
  onVariableChange,
}) => {
  // (★ 変更なし)
  const isSelected = item.id === selectedItemId;

  // (★ 変更なし) プレビュースタイル
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
      // 編集モードに戻ったら、入力欄をクリアする
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
    content = <button className="item-button-content">{item.name}</button>;
  // ↓↓↓↓↓↓↓↓↓↓ (★ 修正) <img> タグに draggable={false} を追加 ↓↓↓↓↓↓↓↓↓↓
  } else if (item.name.startsWith("画像")) {
    if (item.data?.src) {
      content = (
        <div className="item-image-content">
          <img
            src={item.data.src}
            alt={item.name}
            draggable={false} // (★) これが修正点です
          />
        </div>
      );
    } else {
      content = (
        <div className="item-image-content is-placeholder">
          {item.name} (No Image)
        </div>
      );
    }
  // ↑↑↑↑↑↑↑↑↑↑ (★ 修正) ↑↑↑↑↑↑↑↑↑↑
  } else if (item.name.startsWith("テキスト入力欄")) {
    const placeholder = item.data?.placeholder || "テキストを入力...";
    content = (
      <div className="item-input-content">
        <input
          type="text"
          className="artboard-item-input"
          placeholder={placeholder}
          value={inputValue} // (★) ローカルステートを参照
          readOnly={!isPreviewing} // (★) 編集モードでは読み取り専用
          onChange={(e) => {
            // (★) プレビューモード中のみ、入力イベントを許可
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
    content = <div className="item-text-content">{item.name}</div>;
  }

  return (
    <div
      className={itemClassName}
      style={style}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
    >
      {content}
    </div>
  );
};

// --- (B) アートボード本体の型定義 ---
// (★ 変更なし)
interface ArtboardProps {
  placedItems: PlacedItemType[];
  setPlacedItems: React.Dispatch<React.SetStateAction<PlacedItemType[]>>;
  onItemSelect: (id: string) => void;
  onBackgroundClick: () => void;
  selectedItemId: string | null;
  setAllItemLogics: React.Dispatch<React.SetStateAction<Record<string, NodeGraph>>>;
  nodeGraphTemplates: Record<string, NodeGraph>;
  isPreviewing: boolean;
  previewState: PreviewState;
  onItemEvent: (eventName: string, itemId: string) => void;
  variables: VariableState;
  onVariableChange: (variableName: string, value: any) => void;
}

const Artboard: React.FC<ArtboardProps> = ({
  placedItems,
  setPlacedItems,
  onItemSelect,
  onBackgroundClick,
  selectedItemId,
  setAllItemLogics,
  nodeGraphTemplates,
  isPreviewing,
  previewState,
  onItemEvent,
  variables,
  onVariableChange,
}) => {
  // (★ 変更なし)
  const artboardRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const draggedItemIdRef = useRef<string | null>(null);

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
          data: { src: null },
        };
        if (item.name === "画像") {
          newItem.width = 150;
          newItem.height = 100;
        } else if (item.name === "テキスト") {
          newItem.width = 120;
        } else if (item.name === "テキスト入力欄") {
          newItem.width = 200;
          newItem.height = 45;
          newItem.data = {
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
  }, [handleMouseMove]);

  // (★ 変更なし) useCallback でラップ（依存配列を修正）
  const handleItemMouseDown = useCallback((e: React.MouseEvent, itemId: string) => {
    if (isPreviewing) return;
    
    // (★) placedItems をここで再検索 (依存配列から削除するため)
    const item = placedItems.find((p) => p.id === itemId);
    if (!item) return;

    onItemSelect(itemId);
    draggedItemIdRef.current = itemId;
    
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
  }, [isPreviewing, placedItems, onItemSelect, handleMouseMove, handleMouseUp]); // (★) 安定化のため placedItems を依存配列に追加

  // --- (3) ArtboardItem をメモ化 ---
  const MemoizedArtboardItem = useMemo(() => {
    return React.memo((props: ArtboardItemProps) => (
      <ArtboardItem
        {...props}
        onItemSelect={onItemSelect}
        onItemDragStart={handleItemMouseDown}
      />
    ));
  // (★ 変更なし)
  }, [onItemSelect, handleItemMouseDown]);

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
          selectedItemId={selectedItemId}
          // (プレビュー用)
          isPreviewing={isPreviewing}
          previewState={previewState}
          onItemEvent={onItemEvent}
          // (変数関連)
          variables={variables}
          onVariableChange={onVariableChange}
        />
      ))}
    </div>
  );
};

export default Artboard;