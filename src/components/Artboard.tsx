import React, { useRef, useMemo, useCallback, useState, useEffect } from "react";
import { useDrop } from "react-dnd";
import { ItemTypes } from "../ItemTypes";

import "./Artboard.css";

// Store
import { usePageStore } from "../stores/usePageStore";
import { useSelectionStore } from "../stores/useSelectionStore";
import { useEditorSettingsStore } from "../stores/useEditorSettingsStore";
import { usePreviewStore } from "../stores/usePreviewStore";

// Components & Hooks
import { ArtboardItem } from "./artboard/ArtboardItem";
import { Comment } from "./artboard/Comment";
import { ContextMenu } from "./artboard/ContextMenu";
import { useArtboardLogic, snapToGrid } from "./artboard/useArtboardLogic";

const Artboard: React.FC = () => {
  // ストアデータの取得
  const { addItem, updateItem } = usePageStore(state => ({ addItem: state.addItem, updateItem: state.updateItem }));
  const { placedItems, comments, addComment, updateComment, deleteComment, backgroundColor } = usePageStore(state => {
    const page = state.selectedPageId ? state.pages[state.selectedPageId] : undefined;
    return {
      placedItems: page?.placedItems || [],
      comments: page?.comments || [],
      addComment: state.addComment,
      updateComment: state.updateComment,
      deleteComment: state.deleteComment,
      backgroundColor: page?.backgroundColor,
    };
  });

  const { activeTabId, handleItemSelect, handleBackgroundClick } = useSelectionStore(state => ({
    activeTabId: state.activeTabId,
    handleItemSelect: state.handleItemSelect,
    handleBackgroundClick: state.handleBackgroundClick,
  }));

  const { isPreviewing, gridSize, showGrid, isMobileView } = useEditorSettingsStore(state => ({
    isPreviewing: state.isPreviewing,
    gridSize: state.gridSize,
    showGrid: state.showGrid,
    isMobileView: state.isMobileView,
  }));

  const { previewState, previewBackground, variables, onItemEvent, onVariableChange } = usePreviewStore(state => ({
    previewState: state.previewState,
    previewBackground: state.previewBackground,
    variables: state.variables,
    onItemEvent: state.handleItemEvent,
    onVariableChange: state.handleVariableChangeFromItem,
  }));

  const artboardRef = useRef<HTMLDivElement>(null);

  // useArtboardLogic hook
  const {
    zoomLevel,
    contextMenu,
    setContextMenu,
    handleItemDragStart,
    groupItems,
    ungroupItems,
    deleteItems,
    selectedIds
  } = useArtboardLogic(artboardRef);

  // コメントの選択状態
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(null);

  // アイテム選択ラッパー
  const onArtboardItemSelect = useCallback((e: React.MouseEvent, id: string, name: string) => {
    const isMulti = e.ctrlKey || e.metaKey || e.shiftKey;
    handleItemSelect(id, name, isMulti);
  }, [handleItemSelect]);

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
  }, [comments, isPreviewing, zoomLevel, gridSize, updateComment, artboardRef]);

  // ドロップ処理
  const [{ isOver }, drop] = useDrop(() => ({
    accept: [ItemTypes.BOX, ItemTypes.IMAGE, ItemTypes.TEXT, ItemTypes.BUTTON, ItemTypes.VIDEO, "EXISTING_ITEM", "COMMENT"],
    drop: (item: any, monitor) => {
      const offset = monitor.getClientOffset();
      if (!offset || !artboardRef.current) return;

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
      addItem({
        id: newItemId,
        name: item.label || item.type || "Item",
        type: item.type,
        x: snappedX,
        y: snappedY,
        width: (item.type === ItemTypes.TEXT || item.type === ItemTypes.BUTTON || item.type === ItemTypes.BOX) ? 200 : 100,
        height: (item.type === ItemTypes.TEXT || item.type === ItemTypes.BUTTON || item.type === ItemTypes.BOX) ? 50 : 100,
        data: {
          text: item.label || "New Item",
        },
      });
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }), [addItem, gridSize, zoomLevel, artboardRef]);

  // DropターゲットをArtboardに接続
  drop(artboardRef);

  // 背景スタイル計算
  const backgroundStyle = useMemo(() => {
    const bgItem = !isPreviewing
      ? placedItems.find(p => p.data.isArtboardBackground && p.data.src)
      : undefined;

    const src = isPreviewing ? previewBackground.src : bgItem?.data.src;
    const pos = isPreviewing ? previewBackground.position : bgItem?.data.artboardBackgroundPosition;

    const bgColor = backgroundColor || '#ffffff';

    const style: React.CSSProperties = {
      backgroundColor: bgColor,
      backgroundSize: 'cover',
      backgroundPosition: '50% 50%',
      backgroundImage: 'none',
    };

    if (src) {
      style.backgroundImage = `url(${src})`;
      style.backgroundPosition = pos || '50% 50%';
    }

    return style;
  }, [placedItems, isPreviewing, previewBackground, backgroundColor]);


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
    const bgItem = placedItems.find(p => p.data.isArtboardBackground);
    if (bgItem) {
      handleItemSelect(bgItem.id, bgItem.name, false);
    } else {
      handleBackgroundClick();
    }
  }, [isPreviewing, placedItems, handleItemSelect, handleBackgroundClick]);

  // レンダリング用関数
  const renderChildren = useCallback((parentId: string | undefined) => {
    return placedItems.filter(item => item.groupId === parentId).map(item => (
      <MemoizedArtboardItem
        key={item.id}
        item={item}
        renderChildren={renderChildren}
        onItemSelect={onArtboardItemSelect}
        onItemDragStart={(e, id) => handleItemDragStart(e, id, handleItemSelect)}
        selectedIds={selectedIds}
        activeTabId={activeTabId}
        isPreviewing={isPreviewing}
        isMobileView={useEditorSettingsStore.getState().isMobileView}
        previewState={previewState}
        onItemEvent={onItemEvent}
        variables={variables}
        onVariableChange={onVariableChange}
        zoomLevel={zoomLevel}
        onItemUpdate={updateItem}
      />
    ));
  }, [placedItems, onArtboardItemSelect, handleItemDragStart, selectedIds, activeTabId, isPreviewing, previewState, onItemEvent, variables, onVariableChange, handleItemSelect, zoomLevel, updateItem]);

  const MemoizedArtboardItem = useMemo(() => React.memo(ArtboardItem), []);

  // グリッドコントロールの状態管理
  const [isGridMenuOpen, setIsGridMenuOpen] = useState(false);
  const gridMenuRef = useRef<HTMLDivElement>(null);
  const { setGridSize, setShowGrid } = useEditorSettingsStore(state => ({
    setGridSize: state.setGridSize,
    setShowGrid: state.setShowGrid,
  }));

  // グリッドメニュー外クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (gridMenuRef.current && !gridMenuRef.current.contains(event.target as Node)) {
        setIsGridMenuOpen(false);
      }
    };
    if (isGridMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isGridMenuOpen]);


  // アートボードのサイズ決定
  const artboardWidth = isMobileView ? 375 : 1000;
  const artboardHeight = isMobileView ? 667 : 700;

  return (
    <div
      className="artboard-wrapper"
      style={{ width: `${artboardWidth * zoomLevel}px`, height: `${artboardHeight * zoomLevel}px`, margin: "20px auto", position: "relative" }}
      onContextMenu={(e) => { e.preventDefault(); if (!isPreviewing) setContextMenu({ visible: true, x: e.clientX, y: e.clientY }); }}
    >

      {/* グリッドコントロール - プレビュー時は非表示 */}
      {!isPreviewing && (
        <div ref={gridMenuRef} style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 50 }}>
          <button
            onClick={() => setIsGridMenuOpen(!isGridMenuOpen)}
            style={{
              padding: '8px 12px',
              backgroundColor: '#333',
              color: '#fff',
              border: '1px solid #555',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            Grid
          </button>

          {isGridMenuOpen && (
            <div
              className="grid-popover"
              style={{
                position: 'absolute',
                top: '40px',
                right: '0',
                width: '240px',
                backgroundColor: '#252526',
                border: '1px solid #454545',
                borderRadius: '6px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              {/* グリッド線表示切り替え */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.75em', fontWeight: 600, color: '#999', textTransform: 'uppercase' }}>
                  グリッド線
                </label>
                <button
                  onClick={() => setShowGrid(!showGrid)}
                  style={{
                    padding: '8px',
                    backgroundColor: showGrid ? '#2a8a4a' : '#333',
                    color: '#fff',
                    border: `1px solid ${showGrid ? '#2a8a4a' : '#444'}`,
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  {showGrid ? '表示中 (ON)' : '非表示 (OFF)'}
                </button>
              </div>

              <div style={{ height: '1px', backgroundColor: '#3e3e3e' }} />

              {/* グリッドサイズ選択 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.75em', fontWeight: 600, color: '#999', textTransform: 'uppercase' }}>
                  グリッドサイズ (PX)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                  {[null, 1, 2, 4, 8, 16, 32].map((size) => (
                    <button
                      key={size === null ? 'null' : size}
                      onClick={() => setGridSize(size)}
                      style={{
                        padding: '8px 0',
                        backgroundColor: gridSize === size ? '#007acc' : '#333',
                        color: gridSize === size ? '#fff' : '#ccc',
                        border: `1px solid ${gridSize === size ? '#007acc' : '#444'}`,
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.9em',
                        fontWeight: 600,
                      }}
                    >
                      {size === null ? 'なし' : size}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div
        ref={artboardRef}
        className={`artboard ${isOver ? "is-over" : ""} ${backgroundStyle.backgroundImage !== 'none' ? 'has-background-image' : ''}`}
        style={{ transform: `scale(${zoomLevel})`, margin: 0, ...backgroundStyle, width: `${artboardWidth}px`, height: `${artboardHeight}px` }}
        onClick={handleArtboardBackgroundClick}
      >
        {showGridOverlay && <div className="artboard-grid-overlay" style={gridStyle} />}
        {renderChildren(undefined)}

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
          onGroup={() => { groupItems(selectedIds); setContextMenu(null); }}
          onUngroup={() => { selectedIds.forEach(id => ungroupItems(id)); setContextMenu(null); }}
          onDelete={() => { deleteItems(selectedIds); setContextMenu(null); }}
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
    </div>
  );
};

export default React.memo(Artboard);