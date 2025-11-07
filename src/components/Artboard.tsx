// src/components/Artboard.tsx

import React, { useRef } from "react";
import { useDrop, type DropTargetMonitor } from "react-dnd";
import { ItemTypes } from "../ItemTypes";
import PlacedItem from "./PlacedItem";
import type { PlacedItemType, PreviewState, NodeGraph } from "../types";
import "./Artboard.css";

// --- 型定義 ---
interface ToolDragItem { 
  name: string;
}
interface PlacedDragItem { 
  id: string; 
  x: number;
  y: number;
}
type AllDragItems = ToolDragItem | PlacedDragItem;

// --- (1) (タスク2) Props の型を変更 ---
interface ArtboardProps {
  placedItems: PlacedItemType[];
  setPlacedItems: React.Dispatch<React.SetStateAction<PlacedItemType[]>>;
  selectedItemId: string | null;
  setAllItemLogics: React.Dispatch<React.SetStateAction<Record<string, NodeGraph>>>;
  nodeGraphTemplates: Record<string, NodeGraph>;
  // (App.tsx から渡される新しいコールバック)
  onItemSelect: (id: string) => void;
  onBackgroundClick: () => void;

  // プレビュー用Props
  isPreviewing: boolean;
  previewState: PreviewState;
  onItemEvent: (eventName: string, itemId: string) => void;
}

const Artboard: React.FC<ArtboardProps> = ({
  placedItems,
  setPlacedItems,
  selectedItemId,
  setAllItemLogics,
  nodeGraphTemplates,
  onItemSelect, // (受け取る)
  onBackgroundClick, // (受け取る)
  // プレビュー用
  isPreviewing,
  previewState,
  onItemEvent,
}) => {
  const artboardRef = useRef<HTMLDivElement>(null);

  const [, drop] = useDrop(
    () => ({
      accept: isPreviewing ? [] : [ ItemTypes.TOOL, ItemTypes.PLACED_ITEM ],
      
      drop: (item: AllDragItems, monitor: DropTargetMonitor) => {
        if (!artboardRef.current) return;
        const itemType = monitor.getItemType();

        if (itemType === ItemTypes.TOOL) {
          // --- 新規作成 ---
          const clientOffset = monitor.getClientOffset();
          if (!clientOffset) return;
          const artboardRect = artboardRef.current.getBoundingClientRect();
          const x = clientOffset.x - artboardRect.left;
          const y = clientOffset.y - artboardRect.top;
          
          const { name } = item as ToolDragItem;
          const newItem: PlacedItemType = {
            id: `item-${Date.now()}`,
            name: name, x: x, y: y, width: 100, height: 40,
          };
          
          setPlacedItems((prevItems) => [...prevItems, newItem]);
          
          // "ボタン" の場合、クリックイベントを追加
          const graphTemplate = (name === "ボタン")
            ? nodeGraphTemplates["ボタン"]
            : (nodeGraphTemplates[name] || nodeGraphTemplates["Default"]);
          
          setAllItemLogics((prevLogics) => ({
            ...prevLogics, [newItem.id]: graphTemplate,
          }));
          
          // (2) (タスク2) 選択ハンドラを呼ぶ
          onItemSelect(newItem.id);

        } else if (itemType === ItemTypes.PLACED_ITEM) {
          // --- アイテム移動 ---
          const delta = monitor.getDifferenceFromInitialOffset();
          if (!delta) return;
          
          const { id, x: originalX, y: originalY } = item as PlacedDragItem;
          const newX = originalX + delta.x;
          const newY = originalY + delta.y;

          setPlacedItems((prevItems) =>
            prevItems.map((pi) =>
              pi.id === id ? { ...pi, x: newX, y: newY } : pi
            )
          );
          
          // (3) (タスク2) 選択ハンドラを呼ぶ
          onItemSelect(id);
        }
      },
    }),
    [setPlacedItems, setAllItemLogics, nodeGraphTemplates, onItemSelect, isPreviewing] 
  );
  
  drop(artboardRef); // ref を dnd に接続

  // (4) (タスク2) 背景クリックハンドラ
  const handleArtboardClick = (e: React.MouseEvent) => {
    if (e.target === artboardRef.current) {
      if (!isPreviewing) {
        onBackgroundClick(); // App.tsx のハンドラを呼ぶ
      }
    }
  };

  return (
    <div 
      className={`artboard ${isPreviewing ? "is-preview" : ""}`} 
      ref={artboardRef} 
      onClick={handleArtboardClick}
    >
      {placedItems.map((item) => {
        // プレビュー状態を取得
        const pState = previewState[item.id];
        
        return (
          <PlacedItem
            key={item.id}
            item={item}
            // (5) (タスク2) onSelect ハンドラ
            onSelect={() => onItemSelect(item.id)}
            isSelected={item.id === selectedItemId}
            
            // プレビュー用Props
            isPreviewing={isPreviewing}
            isVisible={pState?.isVisible ?? true} // デフォルトは表示
            onItemEvent={onItemEvent}
          />
        );
      })}
    </div>
  );
};

export default Artboard;