import React from "react";
import PreviewItem from "./PreviewItem";
import type { PlacedItemType, PreviewState, NodeGraph } from "../types";
import "./Artboard.css"; // (Artboard のスタイルを流用)

interface PreviewHostProps {
  placedItems: PlacedItemType[];
  previewState: PreviewState;
  setPreviewState: (
    newState: PreviewState | ((prev: PreviewState) => PreviewState)
  ) => void;
  allItemLogics: Record<string, NodeGraph>;
  isMobile?: boolean; // 追加
}

const PreviewHost: React.FC<PreviewHostProps> = ({
  placedItems,
  previewState,
  setPreviewState,
  allItemLogics,
  isMobile = false,
}) => {
  // コンテナのスタイル
  // 背景設定は親コンポーネント（ViewerHostやEditorView）側で行うため、ここでは指定しない
  const containerStyle: React.CSSProperties = {
    position: "relative",
    width: "100%",
    height: "100%",
    overflow: "hidden", // アイテムがはみ出さないように
  };

  return (
    <div style={containerStyle}>
      {placedItems.map((item) => {
        const itemState = previewState[item.id];

        // ★ 修正: 背景として設定されているアイテムは描画しない
        if (item.data.isArtboardBackground) {
          return null;
        }

        // アイテムの状態が存在しない、または非表示設定の場合は描画しない
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
            isMobile={isMobile}
          />
        );
      })}
    </div>
  );
};

export default PreviewHost;