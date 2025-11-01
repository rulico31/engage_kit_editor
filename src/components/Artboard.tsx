// src/components/Artboard.tsx

import React, { useRef } from "react";
import { useDrop, type DropTargetMonitor } from "react-dnd";
import { ItemTypes } from "../ItemTypes";
import PlacedItem from "./PlacedItem";
import type { PlacedItemType } from "../types";
import "./Artboard.css";

import type { NodeGraph } from "../App";

// (型定義は変更なし)
interface ToolDragItem { name: string; }
interface PlacedDragItem { id: string; x: number; y: number; }
type AllDragItems = ToolDragItem | PlacedDragItem;

interface ArtboardProps {
  placedItems: PlacedItemType[];
  setPlacedItems: React.Dispatch<React.SetStateAction<PlacedItemType[]>>;
  setSelectedItemId: (id: string | null) => void;
  selectedItemId: string | null;
  
  // ↓↓↓↓↓↓↓↓↓↓ 受け取る Props を変更 ↓↓↓↓↓↓↓↓↓↓
  setAllItemLogics: React.Dispatch<React.SetStateAction<Record<string, NodeGraph>>>;
  nodeGraphTemplates: Record<string, NodeGraph>; // (initialNodeGraph ではなく)
  // ↑↑↑↑↑↑↑↑↑↑ ここまで ↑↑↑↑↑↑↑↑↑↑
}

const Artboard: React.FC<ArtboardProps> = ({
  placedItems,
  setPlacedItems,
  setSelectedItemId,
  selectedItemId,
  // (Props を展開)
  setAllItemLogics,
  nodeGraphTemplates, // (名前を変更)
}) => {
  const artboardRef = useRef<HTMLDivElement>(null);

  const [, drop] = useDrop(
    () => ({
      accept: [
        ItemTypes.TOOL,
        ItemTypes.PLACED_ITEM,
      ],

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

          const { name } = item as ToolDragItem; // (例: "ボタン")
          const newItem: PlacedItemType = {
            id: `item-${Date.now()}`,
            name: name, x: x, y: y, width: 100, height: 40,
          };
          
          setPlacedItems((prevItems) => [...prevItems, newItem]);
          
          // ↓↓↓↓↓↓↓↓↓↓ (重要) アイテム名に応じたグラフをセット ↓↓↓↓↓↓↓↓↓↓
          
          // テンプレートから該当のグラフを探す (該当がなければ "Default" を使う)
          const graphTemplate = nodeGraphTemplates[name] || nodeGraphTemplates["Default"];

          setAllItemLogics((prevLogics) => ({
            ...prevLogics,
            [newItem.id]: graphTemplate, // 新しいIDに、選んだグラフを割り当て
          }));
          // ↑↑↑↑↑↑↑↑↑↑ ここまで ↑↑↑↑↑↑↑↑↑↑
          
          setSelectedItemId(newItem.id);

        } else if (itemType === ItemTypes.PLACED_ITEM) {
          // --- アイテム移動 (変更なし) ---
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
      },
    }),
    // 依存配列に nodeGraphTemplates を追加
    [setPlacedItems, setSelectedItemId, setAllItemLogics, nodeGraphTemplates] 
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
        />
      ))}
    </div>
  );
};

export default Artboard;