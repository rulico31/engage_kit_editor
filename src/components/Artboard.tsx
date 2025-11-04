// src/components/Artboard.tsx

import React, { useRef } from "react";
import { useDrop, type DropTargetMonitor } from "react-dnd";
import { ItemTypes } from "../ItemTypes";
import PlacedItem from "./PlacedItem";
// (★ 修正: NodeGraph を App.tsx からではなく types.ts からインポート)
import type { PlacedItemType, NodeGraph } from "../types";
import "./Artboard.css";
// (★ 修正: App.tsx からの NodeGraph インポートを削除)

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

// --- (★ 修正: Props の型定義を変更) ---
interface ArtboardProps {
  placedItems: PlacedItemType[];
  // (App.tsx のラッパー関数に型を合わせる)
  setPlacedItems: (newItems: PlacedItemType[] | ((prev: PlacedItemType[]) => PlacedItemType[])) => void;
  selectedItemId: string | null;
  // (App.tsx のラッパー関数に型を合わせる)
  setAllItemLogics: (newLogics: Record<string, NodeGraph> | ((prev: Record<string, NodeGraph>) => Record<string, NodeGraph>)) => void;
  nodeGraphTemplates: Record<string, NodeGraph>;
  onItemSelect: (id: string) => void;
  onBackgroundClick: () => void;
}

const Artboard: React.FC<ArtboardProps> = ({
  placedItems,
  setPlacedItems,
  selectedItemId,
  setAllItemLogics,
  nodeGraphTemplates,
  onItemSelect, // (受け取る)
  onBackgroundClick, // (受け取る)
}) => {
  const artboardRef = useRef<HTMLDivElement>(null);

  const [, drop] = useDrop(
    () => ({
      accept: [ ItemTypes.TOOL, ItemTypes.PLACED_ITEM ],
      
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
          
          const graphTemplate = nodeGraphTemplates[name] || nodeGraphTemplates["Default"];
          setAllItemLogics((prevLogics) => ({
            ...prevLogics, [newItem.id]: graphTemplate,
          }));
          
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
          
          onItemSelect(id);
        }
      },
    }),
    [setPlacedItems, setAllItemLogics, nodeGraphTemplates, onItemSelect] 
  );
  
  drop(artboardRef); // ref を dnd に接続

  const handleArtboardClick = (e: React.MouseEvent) => {
    if (e.target === artboardRef.current) {
      onBackgroundClick(); // App.tsx のハンドラを呼ぶ
    }
  };

  return (
    <div className="artboard" ref={artboardRef} onClick={handleArtboardClick}>
      {placedItems.map((item) => (
        <PlacedItem
          key={item.id}
          item={item}
          onSelect={() => onItemSelect(item.id)}
          isSelected={item.id === selectedItemId}
        />
      ))}
    </div>
  );
};

export default Artboard;

