// src/components/Artboard.tsx

import React, { useRef, useCallback, useMemo } from "react";
import { useDrop, type DropTargetMonitor } from "react-dnd";
import { ItemTypes } from "../ItemTypes";
import type { PlacedItemType, NodeGraph, PreviewState } from "../types";
import "./Artboard.css";

// --- (A) アイテムの型定義 ---
interface ArtboardItemProps {
  item: PlacedItemType;
  onItemSelect: (id: string) => void;
  // (★) ドラッグ開始専用のProp
  onItemDragStart: (e: React.MouseEvent, id: string) => void;
  selectedItemId: string | null;
  // (プレビュー用)
  isPreviewing: boolean;
  previewState: PreviewState | null;
  onItemEvent: (eventName: string, itemId: string) => void;
}

const ArtboardItem: React.FC<ArtboardItemProps> = ({
  item,
  onItemSelect,
  // (★) 正しいProp名
  onItemDragStart, 
  selectedItemId,
  isPreviewing,
  previewState,
  onItemEvent,
}) => {
  const isSelected = item.id === selectedItemId;

  // --- (★ 変更) プレビュー用のスタイルを previewState から生成 ---
  const style: React.CSSProperties = {
    width: item.width,
    height: item.height,
  };

  if (isPreviewing && previewState && previewState[item.id]) {
    // (1) プレビューモード: previewState から動的にスタイルを構築
    const itemState = previewState[item.id];
    
    style.visibility = itemState.isVisible ? 'visible' : 'hidden';
    style.opacity = itemState.opacity;
    // (★) x, y, scale, rotation を transform に集約
    style.transform = `translate(${itemState.x}px, ${itemState.y}px) scale(${itemState.scale}) rotate(${itemState.rotation}deg)`;
    // (★) transition を適用
    style.transition = itemState.transition || 'none';
    
  } else {
    // (2) 編集モード: item の静的な位置を使用
    style.transform = `translate(${item.x}px, ${item.y}px)`;
    style.opacity = 1; // (常に 1)
  }
  // --- (★ 変更) スタイル生成ここまで ---

  // --- イベントハンドラ ---
  const handleClick = (e: React.MouseEvent) => {
    if (isPreviewing) {
      // プレビュー中は "click" イベントを発火
      onItemEvent("click", item.id);
    } else {
      // 編集中はアイテムを選択
      onItemSelect(item.id); // (★) これは (id: string) => void で正しい
      e.stopPropagation(); // 背景クリックをトリガーしない
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // 編集モードでのみドラッグ開始
    if (!isPreviewing) {
      // ↓↓↓↓↓↓↓↓↓↓ (★ 修正) "onltemDragStart" -> "onItemDragStart" ↓↓↓↓↓↓↓↓↓↓
      onItemDragStart(e, item.id); // (タイポを修正)
      // ↑↑↑↑↑↑↑↑↑↑ (★ 修正) ↑↑↑↑↑↑↑↑↑↑
      e.stopPropagation();
    }
  };

  // --- レンダリング ---
  let content = null;
  let itemClassName = "artboard-item";
  if (isSelected && !isPreviewing) {
    itemClassName += " selected";
  }
  if (isPreviewing) {
    itemClassName += " preview";
  }

  // (アイテムの種類によって中身を切り替え)
  if (item.name.startsWith("ボタン")) {
    content = <button className="item-button-content">{item.name}</button>;
  } else if (item.name.startsWith("画像")) {
    content = <div className="item-image-content">{item.name}</div>;
  } else {
    // (デフォルトはテキスト)
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
interface ArtboardProps {
  placedItems: PlacedItemType[];
  setPlacedItems: React.Dispatch<React.SetStateAction<PlacedItemType[]>>;
  onItemSelect: (id: string) => void;
  onBackgroundClick: () => void;
  selectedItemId: string | null;
  setAllItemLogics: React.Dispatch<React.SetStateAction<Record<string, NodeGraph>>>;
  nodeGraphTemplates: Record<string, NodeGraph>;
  // (プレビュー用)
  isPreviewing: boolean;
  previewState: PreviewState;
  onItemEvent: (eventName: string, itemId: string) => void;
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
}) => {
  const artboardRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);

  // --- (1) アイテムのドラッグ＆ドロップ (D&D) ---
  const [{ isOver }, drop] = useDrop(
    () => ({
      // (★ 修正) TOOLBOX_ITEM -> TOOL
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
        };

        // (アイテムの種類に応じてサイズを変更)
        if (item.name === "画像") {
          newItem.width = 150;
          newItem.height = 100;
        } else if (item.name === "テキスト") {
          newItem.width = 120;
        }

        setPlacedItems((prev) => [...prev, newItem]);
        
        // (★) 新しいアイテムに対応するロジックグラフを作成
        const templateKey = Object.keys(nodeGraphTemplates).find(key => item.name.startsWith(key)) || "Default";
        const newGraph = nodeGraphTemplates[templateKey];
        
        setAllItemLogics((prev) => ({
          ...prev,
          [newItemId]: newGraph
        }));
        
        // (★) 作成したアイテムを即座に選択
        onItemSelect(newItemId);
      },
    }),
    [setPlacedItems, setAllItemLogics, nodeGraphTemplates, onItemSelect]
  );
  drop(artboardRef); // drop コネクタを ref に接続

  // --- (2) アートボード上でのアイテム移動 (ドラッグ) ---
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!selectedItemId || !dragStartPos.current || !artboardRef.current) return;
      
      const artboardRect = artboardRef.current.getBoundingClientRect();
      const newX = e.clientX - artboardRect.left - dragStartPos.current.x;
      const newY = e.clientY - artboardRect.top - dragStartPos.current.y;

      setPlacedItems((prev) =>
        prev.map((item) =>
          item.id === selectedItemId ? { ...item, x: newX, y: newY } : item
        )
      );
    },
    [selectedItemId, setPlacedItems]
  );

  const handleMouseUp = useCallback(() => {
    dragStartPos.current = null;
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
  }, [handleMouseMove]);

  const handleItemMouseDown = (e: React.MouseEvent, itemId: string) => {
    if (isPreviewing) return; // (★) プレビュー中はドラッグしない
    
    const item = placedItems.find((p) => p.id === itemId);
    if (!item) return;

    // (★) アイテム選択を ArtboardItem から Artboard に移動 (イベントバブリング)
    onItemSelect(itemId);
    
    const artboardRect = artboardRef.current?.getBoundingClientRect();
    if (!artboardRect) return;

    // (★) マウスポインタの「アイテムの左上からの相対位置」を計算
    const mouseXInArtboard = e.clientX - artboardRect.left;
    const mouseYInArtboard = e.clientY - artboardRect.top;
    
    dragStartPos.current = {
      x: mouseXInArtboard - item.x,
      y: mouseYInArtboard - item.y,
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    
    e.stopPropagation(); // (★) 背景クリックをトリガーしない
  };

  // --- (3) ArtboardItem をメモ化 ---
  // (★) PlacedItem, previewState を props で渡すように変更
  const MemoizedArtboardItem = useMemo(() => {
    return React.memo((props: ArtboardItemProps) => (
      <ArtboardItem
        {...props}
        // (★) 2つのPropを正しく渡す
        onItemSelect={onItemSelect} // (★) クリック選択
        onItemDragStart={handleItemMouseDown} // (★) ドラッグ開始
      />
    ));
  }, [onItemSelect, handleItemMouseDown]); // (★) 依存配列を修正

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
          previewState={previewState} // (★) previewState を丸ごと渡す
          onItemEvent={onItemEvent}
        />
      ))}
    </div>
  );
};

export default Artboard;