import React, { useEffect } from "react";
import PreviewItem from "./PreviewItem";
import { ArtboardItem } from "./artboard/ArtboardItem";
import ConfirmationModal from "./ConfirmationModal";
import DebugLogPanel from "./DebugLogPanel";
import { useDebugLogStore } from "../stores/useDebugLogStore";
import { usePreviewStore } from "../stores/usePreviewStore";
import type { PlacedItemType, PreviewState, NodeGraph } from "../types";
import "./Artboard.css"; // (Artboard のスタイルを流用)
import { usePageStore } from "../stores/usePageStore";

interface PreviewHostProps {
  placedItems: PlacedItemType[];
  previewState: PreviewState;
  setPreviewState: (
    newState: PreviewState | ((prev: PreviewState) => PreviewState)
  ) => void;
  allItemLogics: Record<string, NodeGraph>;
  isMobile?: boolean; // 追加
  projectId?: string; // 追加
}

const PreviewHost: React.FC<PreviewHostProps> = ({
  placedItems,
  previewState,
  setPreviewState,
  allItemLogics,
  isMobile = false,
  projectId,
}) => {
  const clearLogs = useDebugLogStore(state => state.clearLogs);
  const { variables, handleItemEvent, handleVariableChangeFromItem } = usePreviewStore(state => ({
    variables: state.variables,
    handleItemEvent: state.handleItemEvent,
    handleVariableChangeFromItem: state.handleVariableChangeFromItem
  }));

  // プロジェクトメタデータやその他の必要な情報をストアから取得（ダミーまたはビュワー用）
  const updateItem = () => {}; // ビュワーではアイテム更新は不要（またはロジック経由のみ）

  // プレビュー開始時にログをクリア
  useEffect(() => {
    clearLogs();
  }, [clearLogs]);

  // コンテナのスタイル
  // 背景設定は親コンポーネント（ViewerHostやEditorView）側で行うため、ここでは指定しない
  const containerStyle: React.CSSProperties = {
    position: "relative",
    width: "100%",
    height: "100%",
    overflow: "hidden", // アイテムがはみ出さないように
  };

  // 再帰的なレンダリング関数 (Artboard.tsx と共通化)
  const renderChildren = (parentId: string | undefined) => {
    return placedItems
      .filter((item: PlacedItemType) => item.groupId === parentId)
      .map((item: PlacedItemType) => {
        const itemState = previewState[item.id];

        // 背景アイテム、またはステートが存在しない/非表示の場合は描画しない
        if (item.data.isArtboardBackground || !itemState || !itemState.isVisible) {
          return null;
        }

        return (
          <ArtboardItem
            key={item.id}
            item={item}
            renderChildren={renderChildren}
            onItemSelect={() => {}} // ビュワーでは不要
            onItemDragStart={() => {}} // ビュワーでは不要
            selectedIds={[]} // ビュワーでは不要
            activeTabId={null} // ビュワーでは不要
            isPreviewing={true} // ビュワーでもプレビューモードと同じ振る舞いをさせる
            isMobileView={isMobile}
            previewState={previewState}
            onItemEvent={handleItemEvent}
            variables={variables}
            onVariableChange={handleVariableChangeFromItem}
            zoomLevel={1} // ビュワーのベーススケールは1 (親がscaleで制御)
            onItemUpdate={updateItem}
            isViewerMode={true} // ★重要: 閲覧モードフラグ
          />
        );
      });
  };

  return (
    <div style={containerStyle}>
      {renderChildren(undefined)}

      {/* 確認モーダル */}
      <ConfirmationModal />

      {/* デバッグログパネル - 本番では非表示 */}
      {/* <DebugLogPanel /> */}
    </div>
  );
};

export default PreviewHost;