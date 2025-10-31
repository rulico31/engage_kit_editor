// src/components/Artboard.tsx

import React, { useRef } from "react";
import { useDrop, type DropTargetMonitor } from "react-dnd";
import { ItemTypes } from "../ItemTypes";
import PlacedItem from "./PlacedItem";
import type { PlacedItemType } from "../types";
import "./Artboard.css";

// 型定義 (ResizeDragItem を削除)
interface ToolDragItem { name: string; }
interface PlacedDragItem { id: string; x: number; y: number; }

// (AllDragItems を修正)
type AllDragItems = ToolDragItem | PlacedDragItem;

interface ArtboardProps {
  placedItems: PlacedItemType[];
  setPlacedItems: React.Dispatch<React.SetStateAction<PlacedItemType[]>>;
  setSelectedItemId: (id: string | null) => void;
  selectedItemId: string | null;
}

// (MIN_SIZE は削除)

const Artboard: React.FC<ArtboardProps> = ({
  placedItems,
  setPlacedItems,
  setSelectedItemId,
  selectedItemId,
}) => {
  const artboardRef = useRef<HTMLDivElement>(null);

  // (リサイズ関連のロジックは削除)

  const [, drop] = useDrop(
    () => ({
      // (accept から RESIZE_HANDLE を削除)
      accept: [
        ItemTypes.TOOL,
        ItemTypes.PLACED_ITEM,
      ],

      // (hover 関数 (リサイズ用) は削除)

      drop: (item: AllDragItems, monitor: DropTargetMonitor) => {
        if (!artboardRef.current) return;
        const itemType = monitor.getItemType();

        // --- 新規作成 (ツールボックスから) ---
        if (itemType === ItemTypes.TOOL) {
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
          setSelectedItemId(newItem.id);

        } else if (itemType === ItemTypes.PLACED_ITEM) {
          // --- アイテム移動 (アートボード上) ---
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
          setSelectedItemId(id);
        }
        // (RESIZE_HANDLE の else if ブロックは削除)
      },
    }),
    // 依存配列 (Stale State バグ修正済み)
    [setPlacedItems, setSelectedItemId] 
  );

  drop(artboardRef);

  const handleArtboardClick = (e: React.MouseEvent) => {
    if (e.target === artboardRef.current) {
      setSelectedItemId(null);
    }
  };

  return (
    <div className="artboard" ref={artboardRef} onClick={handleArtboardClick}>
      {placedItems.map((item) => (
        <PlacedItem
          key={item.id}
          item={item}
          onSelect={() => setSelectedItemId(item.id)}
          isSelected={item.id === selectedItemId}
          // (onResizeStop は削除)
        />
      ))}
    </div>
  );
};

export default Artboard;