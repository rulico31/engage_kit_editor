// src/components/PreviewHost.tsx

import React from "react";
import type { PlacedItemType, PreviewState, NodeGraph } from "../types";
import PreviewItem from "./PreviewItem";
import "./Artboard.css"; // (Artboard のスタイルを流用)

interface PreviewHostProps {
  placedItems: PlacedItemType[];
  previewState: PreviewState;
  // (★ 修正: App.tsx のラッパー関数に型を合わせる)
  setPreviewState: (
    newState: PreviewState | ((prev: PreviewState) => PreviewState)
  ) => void;
  allItemLogics: Record<string, NodeGraph>;
}

const PreviewHost: React.FC<PreviewHostProps> = ({
  placedItems,
  previewState,
  setPreviewState,
  allItemLogics,
}) => {
  return (
    // Artboard と同じクラス名とレイアウトを使用
    <div className="artboard">
      {placedItems.map((item) => {
        const itemState = previewState[item.id];
        
        // アイテムが非表示状態なら null を返す
        if (!itemState || !itemState.isVisible) {
          return null;
        }

        // 表示状態なら PreviewItem を描画
        return (
          <PreviewItem
            key={item.id}
            item={item}
            previewState={previewState}
            setPreviewState={setPreviewState}
            allItemLogics={allItemLogics}
          />
        );
      })}
    </div>
  );
};

export default PreviewHost;

