import React, { useRef, useMemo, useCallback, useState } from "react";
import { useDrop } from "react-dnd";
import { ItemTypes } from "../ItemTypes";
import type { PlacedItemType } from "../types";

import "./Artboard.css";

// Store
import { usePageStore } from "../stores/usePageStore";
import { useSelectionStore } from "../stores/useSelectionStore";
import { useEditorSettingsStore } from "../stores/useEditorSettingsStore";
import { usePreviewStore } from "../stores/usePreviewStore";
import { useProjectStore } from "../stores/useProjectStore";

// Components & Hooks
import { ArtboardItem } from "./artboard/ArtboardItem";
import { Comment } from "./artboard/Comment";
import { ContextMenu } from "./artboard/ContextMenu";
import { useArtboardLogic, snapToGrid } from "./artboard/useArtboardLogic";
import ConfirmationModal from "./ConfirmationModal";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";

const Artboard: React.FC = () => {
  // ストアデータの取得
  const { addItem, updateItem } = usePageStore(state => ({ addItem: state.addItem, updateItem: state.updateItem }));
  const { placedItems, comments, addComment, updateComment, deleteComment, backgroundColor, backgroundImage } = usePageStore(state => {
    const page = state.selectedPageId ? state.pages[state.selectedPageId] : undefined;
    return {
      placedItems: page?.placedItems || [],
      comments: page?.comments || [],
      addComment: state.addComment,
      updateComment: state.updateComment,
      deleteComment: state.deleteComment,
      backgroundColor: page?.backgroundColor,
      backgroundImage: page?.backgroundImage,
    };
  });

  const { activeTabId, handleItemSelect, handleBackgroundClick } = useSelectionStore(state => ({
    activeTabId: state.activeTabId,
    handleItemSelect: state.handleItemSelect,
    handleBackgroundClick: state.handleBackgroundClick,
  }));

  const { isPreviewing, gridSize, showGrid, isMobileView, pendingFocusNodeId, setPendingFocusNodeId, zoomLevel, setZoomLevel } = useEditorSettingsStore(state => ({
    isPreviewing: state.isPreviewing,
    gridSize: state.gridSize,
    showGrid: state.showGrid,
    isMobileView: state.isMobileView,
    pendingFocusNodeId: state.pendingFocusNodeId,
    setPendingFocusNodeId: state.setPendingFocusNodeId,
    zoomLevel: state.zoomLevel,
    setZoomLevel: state.setZoomLevel,
  }));

  const { previewState, variables, onItemEvent, onVariableChange, initPreview, stopPreview } = usePreviewStore(state => ({
    previewState: state.previewState,
    variables: state.variables,
    onItemEvent: state.handleItemEvent,
    onVariableChange: state.handleVariableChangeFromItem,
    initPreview: state.initPreview,
    stopPreview: state.stopPreview,
  }));

  // プレビューモードの切り替えを監視して状態をリセット
  React.useEffect(() => {
    if (isPreviewing) {
      initPreview();
    } else {
      stopPreview();
    }
  }, [isPreviewing, initPreview, stopPreview]);

  // テーマ設定の取得
  const { projectMeta } = useProjectStore(state => ({ projectMeta: state.projectMeta }));
  const theme = projectMeta?.data?.theme;

  // テーマ変数のCSSプロパティ生成
  const themeStyles = useMemo(() => {
    // デフォルト値
    const defaults = {
      fontFamily: 'system-ui',
      accentColor: '#3b82f6',
      backgroundColor: '#ffffff',
      borderRadius: 8
    };

    // テーマがあればマージ
    const current = { ...defaults, ...theme };

    return {
      '--theme-font-family': current.fontFamily,
      '--theme-accent-color': current.accentColor,
      '--theme-background-color': current.backgroundColor,
      '--theme-border-radius': `${current.borderRadius}px`,
    } as React.CSSProperties;
  }, [theme]);

  const artboardRef = useRef<HTMLDivElement>(null);

  // グローバルショートカットの設定
  useKeyboardShortcuts({
    currentRoute: "editor",
    zoomLevel,
    setZoomLevel,
    artboardRef
  });

  // Focus Management (Scrolling)
  React.useEffect(() => {
    if (pendingFocusNodeId && artboardRef.current) {
      // Try to find DOM element
      // Note: PlacedItem and Comment components should have IDs that can be targeted.
      // Assuming PlacedItems are rendered with some ID attribute or we can find them via data attributes.
      // If ArtboardItem wrapper doesn't have the ID, we might need to rely on the fact that they are children.
      // Let's assume for now we can find by ID if the implementation supports it, otherwise we might need to iterate children.

      // Actually, ArtboardItem is a component. We need checks.
      // But simply searching for ID might work if the rendered HTML has it.
      // If not, we might need a map of refs, but that's complex.
      // Let's rely on `document.getElementById` if possible, or querySelector with data-id.
      // Looking at ArtboardItem implementation (not fully visible here but assuming standard), it might not have the exact ID on wrapper.
      // Let's try `[data-item-id="${pendingFocusNodeId}"]` which is common practice.

      const el = artboardRef.current.querySelector(`[data-item-id="${pendingFocusNodeId}"]`) || document.getElementById(pendingFocusNodeId);

      if (el) {
        console.log('[Artboard] Scrolling to item:', pendingFocusNodeId);
        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });

        // Highlight/Select
        handleItemSelect(pendingFocusNodeId, 'item', false); // Select it

        setPendingFocusNodeId(null);
      }
    }
  }, [pendingFocusNodeId, setPendingFocusNodeId, handleItemSelect]);

  // updateItem のラッパー（型の互換性のため）
  const handleItemUpdate = useCallback((id: string, updates: Partial<PlacedItemType>, addToHistory?: boolean) => {
    updateItem(id, updates, { addToHistory });
  }, [updateItem]);

  // useArtboardLogic hook
  const {
    contextMenu,
    setContextMenu,
    handleItemDragStart,
    deleteItems,
    selectedIds
  } = useArtboardLogic(artboardRef);

  // マウス位置を追跡（ペースト位置計算用）
  const lastMousePosRef = React.useRef<{ x: number; y: number } | null>(null);


  // コメントの選択状態
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(null);

  // アイテム選択ラッパー
  const onArtboardItemSelect = useCallback((e: React.MouseEvent, id: string, name: string) => {
    // ★追加: アイテムを選択したら、コメントの選択を解除する
    setSelectedCommentId(null);

    const isMulti = e.ctrlKey || e.metaKey || e.shiftKey;
    // アイテムを検索してdisplayNameを取得
    const item = placedItems.find(i => i.id === id);
    const displayLabel = item?.displayName ? `${name}: ${item.displayName}` : name;
    handleItemSelect(id, displayLabel, isMulti);
  }, [handleItemSelect, placedItems]);

  // コメントドラッグ処理
  const handleCommentDragStart = useCallback((e: React.MouseEvent, commentId: string) => {
    e.stopPropagation();
    if (isPreviewing) return;

    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;

    const artboardRect = artboardRef.current?.getBoundingClientRect();
    if (!artboardRect) return;

    // ドラッグ開始位置を記録
    const dragStart = {
      x: (e.clientX - artboardRect.left) / zoomLevel,
      y: (e.clientY - artboardRect.top) / zoomLevel,
      commentX: comment.x,
      commentY: comment.y
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const currentX = (moveEvent.clientX - artboardRect.left) / zoomLevel;
      const currentY = (moveEvent.clientY - artboardRect.top) / zoomLevel;

      const dx = currentX - dragStart.x;
      const dy = currentY - dragStart.y;

      const newX = snapToGrid(dragStart.commentX + dx, gridSize);
      const newY = snapToGrid(dragStart.commentY + dy, gridSize);

      updateComment(commentId, { x: newX, y: newY });
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [comments, isPreviewing, zoomLevel, gridSize, updateComment]);

  // ドロップ処理
  const acceptedTypes = useMemo(() => [
    ItemTypes.BOX,
    ItemTypes.IMAGE,
    ItemTypes.TEXT,
    ItemTypes.BUTTON,
    ItemTypes.VIDEO,
    "EXISTING_ITEM",
    "COMMENT"
  ], []);

  const [{ isOver }, drop] = useDrop(() => ({
    accept: acceptedTypes,
    drop: (item: any, monitor) => {
      const offset = monitor.getClientOffset();
      if (!offset || !artboardRef.current) {
        return;
      }

      const rect = artboardRef.current.getBoundingClientRect();
      const x = (offset.x - rect.left) / zoomLevel;
      const y = (offset.y - rect.top) / zoomLevel;

      if (item.type === "EXISTING_ITEM") {
        return;
      }

      // グリッドスナップ
      const snappedX = snapToGrid(x, gridSize);
      const snappedY = snapToGrid(y, gridSize);

      if (item.type === "COMMENT") {
        return;
      }

      // 新規追加
      const newItemId = `${item.type}-${Date.now()}`;

      const pcWidth = (item.type === ItemTypes.TEXT || item.type === ItemTypes.BUTTON || item.type === ItemTypes.BOX) ? 200 : 100;
      const pcHeight = (item.type === ItemTypes.TEXT || item.type === ItemTypes.BUTTON || item.type === ItemTypes.BOX) ? 50 : 100;

      // モバイルレイアウト計算
      const mobileScaleRatio = 375 / 1000;
      const mobileWidth = Math.max(20, Math.round(pcWidth * mobileScaleRatio));
      const mobileHeight = Math.max(20, Math.round(pcHeight * mobileScaleRatio));

      // X座標もスケーリング（ただし最大幅を超えないように）
      let mobileX = Math.round(snappedX * mobileScaleRatio);
      if (mobileX + mobileWidth > 375) {
        mobileX = 375 - mobileWidth;
      }
      if (mobileX < 0) mobileX = 0;

      const mobileY = Math.round(snappedY * mobileScaleRatio);

      addItem({
        id: newItemId,
        name: item.label || item.type || "Item",
        type: item.type,
        x: snappedX,
        y: snappedY,
        width: pcWidth,
        height: pcHeight,
        position: { x: snappedX, y: snappedY },
        size: { width: pcWidth, height: pcHeight },
        zIndex: placedItems.length + 1,

        // モバイル用プロパティを初期設定
        mobileX,
        mobileY,
        mobileWidth,
        mobileHeight,

        data: {
          text: item.label || "New Item",
        },
      });
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }), [acceptedTypes, addItem, gridSize, zoomLevel]);

  // DropターゲットをArtboardに接続
  drop(artboardRef);

  // 背景スタイル計算
  const backgroundStyle = useMemo(() => {
    const style: React.CSSProperties = {
      backgroundColor: backgroundColor || '#ffffff',
    };

    // 背景画像が設定されている場合は追加
    if (backgroundImage?.src) {
      style.backgroundImage = `url(${backgroundImage.src})`;

      // displayModeに応じてスタイルを切り替え
      const displayMode = backgroundImage.displayMode || 'cover';
      const position = backgroundImage.position ? `${backgroundImage.position.x}px ${backgroundImage.position.y}px` : 'center center';
      const scale = backgroundImage.scale || 1;

      switch (displayMode) {
        case 'cover':
          style.backgroundSize = 'cover';
          style.backgroundRepeat = 'no-repeat';
          style.backgroundPosition = position;
          break;
        case 'contain':
          style.backgroundSize = 'contain';
          style.backgroundRepeat = 'no-repeat';
          style.backgroundPosition = position;
          break;
        case 'stretch':
          style.backgroundSize = '100% 100%';
          style.backgroundRepeat = 'no-repeat';
          style.backgroundPosition = position;
          break;
        case 'tile':
          style.backgroundSize = `${scale * 100}% auto`;
          style.backgroundRepeat = 'repeat';
          style.backgroundPosition = position;
          break;
        case 'custom':
          style.backgroundSize = `${scale * 100}% auto`;
          style.backgroundRepeat = 'no-repeat';
          style.backgroundPosition = position;
          break;
      }
    }

    return style;
  }, [backgroundColor, backgroundImage]);


  const showGridOverlay = !isPreviewing && showGrid && gridSize !== null;
  const gridStyle = useMemo<React.CSSProperties>(() => {
    return {
      backgroundSize: `${gridSize}px ${gridSize}px`,
      backgroundImage: `linear-gradient(to right, rgba(0, 0, 0, 0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 0, 0, 0.08) 1px, transparent 1px)`,
    };
  }, [showGridOverlay, gridSize]);

  // 背景クリックハンドラ
  const handleArtboardBackgroundClick = useCallback(() => {
    if (isPreviewing) return;
    handleBackgroundClick(); // アイテム選択解除
    setSelectedCommentId(null); // ★追加: コメント選択も解除
  }, [isPreviewing, handleBackgroundClick]);

  // レンダリング用関数
  const renderChildren = useCallback((parentId: string | undefined) => {
    return placedItems.filter((item: PlacedItemType) => item.groupId === parentId).map((item: PlacedItemType) => (
      <MemoizedArtboardItem
        key={item.id}
        item={item}
        renderChildren={renderChildren}
        onItemSelect={onArtboardItemSelect}
        // ★修正: ドラッグ開始時もコメント選択を解除する
        onItemDragStart={(e: React.MouseEvent, id: string) => {
          setSelectedCommentId(null);
          handleItemDragStart(e, id, handleItemSelect);
        }}
        selectedIds={selectedIds}
        activeTabId={activeTabId}
        isPreviewing={isPreviewing}
        isMobileView={isMobileView}
        previewState={previewState}
        onItemEvent={onItemEvent}
        variables={variables}
        onVariableChange={onVariableChange}
        zoomLevel={zoomLevel}
        onItemUpdate={handleItemUpdate}
      />
    ));
  }, [placedItems, onArtboardItemSelect, handleItemDragStart, selectedIds, activeTabId, isPreviewing, isMobileView, previewState, onItemEvent, variables, onVariableChange, handleItemSelect, zoomLevel, handleItemUpdate]);

  const MemoizedArtboardItem = useMemo(() => React.memo(ArtboardItem), []);






  // アートボードのサイズ決定
  // モバイル時は「はみ出し」を確認しやすくするため、標準の375pxより広めに設定（ガイド表示用）
  const artboardWidth = isMobileView ? 450 : 1000;
  
  // スマホビュー時の最大高さを算出（要素がはみ出さないように）
  const mobileMaxHeight = useMemo(() => {
    if (!isMobileView) return 700;
    const maxY = placedItems.reduce((acc, item) => {
      const h = item.mobileHeight ?? 0;
      const y = item.mobileY ?? 0;
      return Math.max(acc, y + h);
    }, 0);
    return Math.max(667, maxY + 40); // 40pxの余裕を持たせる
  }, [placedItems, isMobileView]);

  const artboardHeight = isMobileView ? mobileMaxHeight : 700;

  return (
    <div
      className="artboard-wrapper"
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "auto",
        WebkitOverflowScrolling: "touch"
      }}
      onContextMenu={(e) => { e.preventDefault(); if (!isPreviewing) setContextMenu({ visible: true, x: e.clientX, y: e.clientY }); }}
    >


      <div
        ref={artboardRef}
        className={`artboard ${isOver ? "is-over" : ""}`}
        style={{
          transform: `scale(${zoomLevel})`,
          margin: "20px auto",
          ...backgroundStyle,
          ...themeStyles,
          width: `${artboardWidth}px`,
          height: `${artboardHeight}px`
        }}
        onClick={handleArtboardBackgroundClick}
        onMouseMove={(e) => {
          lastMousePosRef.current = { x: e.clientX, y: e.clientY };
        }}
      >
        {showGridOverlay && <div className="artboard-grid-overlay" style={gridStyle} />}
        {renderChildren(undefined)}

        {/* モバイルビュー時の境界線（Fold Line & Safety Line） */}
        {isMobileView && !isPreviewing && (
          <>
            {/* 1. 縦方向のファーストビュー境界 (667px) */}
            <div
              title="スマホ（iPhone 8等）でページを開いた際、スクロールせずに最初に見える範囲（ファーストビュー）の目安です。重要な情報は、この線より上に配置することを推奨します。"
              style={{
                position: 'absolute',
                top: `${667}px`,
                left: 0,
                width: '100%',
                cursor: 'help',
                pointerEvents: 'auto', // ツールチップ表示のためautoに変更
                zIndex: 9998,
              }}
            >
              {/* 境界線本体 */}
              <div style={{
                width: '100%',
                height: '2px',
                background: 'linear-gradient(90deg, transparent, #3b82f6 10%, #3b82f6 90%, transparent)',
                opacity: 0.7,
              }} />
              {/* ラベル */}
              <div style={{
                position: 'absolute',
                right: '4px',
                top: '4px',
                fontSize: '10px',
                color: '#3b82f6',
                fontWeight: 700,
                letterSpacing: '0.05em',
                background: 'rgba(255,255,255,0.85)',
                padding: '1px 5px',
                borderRadius: '3px',
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
              }}>
                📱 縦の表示境界 (667px)
              </div>
            </div>

            {/* 2. 横方向の表示境界 (350px) */}
            {/* iframeのデフォルトサイズや余白を考慮した安全ライン */}
            <div
              title="HTMLのデフォルト設定での iframe は、何も指定しないと「幅300px・高さ150px程度の、細い枠線がついた小さな四角」として表示される仕様になっています。この線は、その枠線や余白の設定を解除した際に、一般的なスマホで安全に表示される範囲を示しています。"
              style={{
                position: 'absolute',
                top: 0,
                left: `${350}px`,
                height: '100%',
                width: '10px', // ホバーしやすくするために少し幅を持たせる
                cursor: 'help',
                pointerEvents: 'auto',
                zIndex: 9998,
                transform: 'translateX(-4px)', // 10pxの幅を中央に寄せる
              }}
            >
              {/* 境界線本体 */}
              <div style={{
                height: '100%',
                width: '2px',
                margin: '0 auto',
                background: 'linear-gradient(180deg, transparent, #10b981 10%, #10b981 90%, transparent)',
                opacity: 0.7,
              }} />
              {/* ラベル */}
              <div style={{
                position: 'absolute',
                top: '10px',
                left: '12px',
                fontSize: '10px',
                color: '#10b981',
                fontWeight: 700,
                letterSpacing: '0.01em',
                background: 'rgba(255,255,255,0.85)',
                padding: '2px 6px',
                borderRadius: '3px',
                whiteSpace: 'nowrap',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                pointerEvents: 'none',
              }}>
                📱 横の安全範囲 (350px)
              </div>
            </div>
          </>
        )}

        {/* コメント表示（プレビュー時は非表示） */}
        {!isPreviewing && comments.map(comment => {
          // コメントの想定サイズ（最小化時と展開時）
          const commentWidth = comment.isMinimized ? 40 : 200;
          const commentHeight = comment.isMinimized ? 40 : 150;

          // アートボードの境界内に収まるように位置を調整
          const clampedX = Math.max(0, Math.min(comment.x, artboardWidth - commentWidth));
          const clampedY = Math.max(0, Math.min(comment.y, artboardHeight - commentHeight));

          // 位置が調整された場合（クランプされた場合）
          const clampedComment = {
            ...comment,
            x: clampedX,
            y: clampedY,
          };

          return (
            <Comment
              key={comment.id}
              comment={clampedComment}
              onUpdate={(updates) => updateComment(comment.id, updates)}
              onDelete={() => deleteComment(comment.id)}
              isSelected={selectedCommentId === comment.id}
              onClick={() => {
                setSelectedCommentId(comment.id);
                // コメントクリック時に背景クリック処理（アイテム選択解除）を呼ぶ
                handleBackgroundClick();
              }}
              onDragStart={(e) => handleCommentDragStart(e, comment.id)}
            />
          );
        })}
      </div>

      {contextMenu?.visible && (
        <ContextMenu
          x={contextMenu.x} y={contextMenu.y} selectedCount={selectedIds.length}
          copiedItemsCount={usePageStore.getState().copiedItems.length}
          onDelete={() => { deleteItems(selectedIds); setContextMenu(null); }}
          onCopy={() => {
            usePageStore.getState().copyItems(selectedIds);
            setContextMenu(null);
          }}
          onPaste={() => {
            // 画面座標をアートボード内座標に変換
            const artboardRect = artboardRef.current?.getBoundingClientRect();
            if (artboardRect) {
              const artboardX = (contextMenu.x - artboardRect.left) / zoomLevel;
              const artboardY = (contextMenu.y - artboardRect.top) / zoomLevel;
              usePageStore.getState().pasteItems({ x: artboardX, y: artboardY });
            } else {
              usePageStore.getState().pasteItems();
            }
            setContextMenu(null);
          }}
          onAddComment={() => {
            // 画面座標をアートボード内座標に変換
            const artboardRect = artboardRef.current?.getBoundingClientRect();
            if (!artboardRect) {
              setContextMenu(null);
              return;
            }

            // クライアント座標からアートボード内座標への変換（ズームレベル考慮）
            const artboardX = (contextMenu.x - artboardRect.left) / zoomLevel;
            const artboardY = (contextMenu.y - artboardRect.top) / zoomLevel;

            // グリッドスナップ
            const snappedX = snapToGrid(artboardX, gridSize);
            const snappedY = snapToGrid(artboardY, gridSize);

            addComment({
              content: '',
              x: snappedX,
              y: snappedY,
              isMinimized: false,
              // color: '#FFE082', // Removed to use default white
            });
            setContextMenu(null);
          }}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* プレビューモード時に確認モーダルを表示 */}
      {isPreviewing && <ConfirmationModal />}
    </div>
  );
};

export default React.memo(Artboard);