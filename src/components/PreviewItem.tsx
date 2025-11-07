// src/components/PreviewItem.tsx

import React from "react";
// (★ 修正: NodeGraph も types からインポート)
import type { PlacedItemType, PreviewState, NodeGraph } from "../types";
import { executeLogicGraph } from "../logicEngine";
import "./PreviewItem.css"; // (専用のCSSをインポート)

// (★ 修正: Props の型定義を更新)
interface PreviewItemProps {
  item: PlacedItemType;
  previewState: PreviewState; // (★ この行が重要です)
  setPreviewState: (
    newState: PreviewState | ((prev: PreviewState) => PreviewState)
  ) => void;
  allItemLogics: Record<string, NodeGraph>;
}

const PreviewItem: React.FC<PreviewItemProps> = ({
  item,
  previewState,
  setPreviewState,
  allItemLogics,
}) => {
  const { id, name, x, y, width, height } = item;

  // このアイテムに紐づくロジックグラフを取得
  const logicGraph = allItemLogics[id];

  // クリックイベントハンドラ
  const handleClick = () => {
    // 1. "ボタンクリック時" のロジックグラフが存在するか確認
    if (!logicGraph) return;

    // 2. "btn-click" ノード (または "default-load" など) を探す
    // (簡易的に、最初の eventNode をトリガーとします)
    const eventNode = logicGraph.nodes.find(
      (node) => node.type === "eventNode"
    );
    if (!eventNode) return;

    // 3. ロジックエンジンを実行
    executeLogicGraph(
      eventNode.id,
      logicGraph,
      previewState, // (現在の状態を渡す)
      setPreviewState // (状態更新関数を渡す)
    );
  };

  // アイテムのタイプに応じてクラス名を変更 (例: ボタン)
  const itemClassName = `preview-item ${
    name.includes("ボタン") ? "is-button" : ""
  }`;

  return (
    <div
      className={itemClassName}
      style={{
        position: "absolute",
        left: `${x}px`,
        top: `${y}px`,
        width: `${width}px`,
        height: `${height}px`,
        zIndex: 0,
      }}
      // (★ 修正: "ボタン" を含むアイテムのみ onClick をアタッチ)
      onClick={name.includes("ボタン") ? handleClick : undefined}
    >
      {name}
    </div>
  );
};

export default PreviewItem;

