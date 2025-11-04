// src/components/PreviewHost.tsx

import React from "react";
import type { PlacedItemType, PreviewState } from "../types";
import type { NodeGraph } from "../App";
import { executeLogicGraph } from "../utils/logicEngine";
import PreviewItem from "./PreviewItem";
// Artboard のスタイルを流用
import "./Artboard.css"; 

interface PreviewHostProps {
  placedItems: PlacedItemType[];
  previewState: PreviewState;
  setPreviewState: React.Dispatch<React.SetStateAction<PreviewState>>;
  allItemLogics: Record<string, NodeGraph>;
}

const PreviewHost: React.FC<PreviewHostProps> = ({
  placedItems,
  previewState,
  setPreviewState,
  allItemLogics,
}) => {
  
  // イベント（クリックなど）を処理するハンドラ
  const handleEvent = (itemId: string, eventType: "onClick") => {
    const graph = allItemLogics[itemId];
    if (!graph) return;

    // "ボタンがクリックされた時" に対応するEventNodeを探す
    // (将来的に "onLoad" など他のイベントタイプも考慮)
    let startNodeId: string | undefined = undefined;
    if (eventType === "onClick") {
      const clickEventNode = graph.nodes.find(
        (n) => n.type === "eventNode" && n.data?.label?.includes("クリック")
      );
      startNodeId = clickEventNode?.id;
    }
    
    // 対応するイベントノードが見つかったら、ロジックエンジンを実行
    if (startNodeId) {
      executeLogicGraph(startNodeId, graph, previewState, setPreviewState);
    }
  };

  return (
    // Artboard と同じスタイルを適用
    <div className="artboard">
      {placedItems.map((item) => {
        const itemState = previewState[item.id];
        // 状態が未定義の場合はフォールバック (表示)
        if (!itemState) {
          console.warn(`Preview state for item ${item.id} not found.`);
          return null;
        }
        
        return (
          <PreviewItem
            key={item.id}
            item={item}
            state={itemState}
            // "ボタン" がクリックされた時にロジック実行をトリガー
            onClick={() => handleEvent(item.id, "onClick")}
          />
        );
      })}
    </div>
  );
};

export default PreviewHost;
