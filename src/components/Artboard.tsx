import React, { useRef, useMemo, useCallback } from "react";
import { useDrop, type DropTargetMonitor } from "react-dnd";
import { ItemTypes } from "../ItemTypes";
import type { PlacedItemType } from "../types";
import "./Artboard.css";

// Store
import { usePageStore } from "../stores/usePageStore";
import { useSelectionStore } from "../stores/useSelectionStore";
import { useEditorSettingsStore } from "../stores/useEditorSettingsStore";
import { usePreviewStore } from "../stores/usePreviewStore";

// Components & Hooks
import { ArtboardItem } from "./artboard/ArtboardItem";
import { ContextMenu } from "./artboard/ContextMenu";
import { useArtboardLogic, snapToGrid } from "./artboard/useArtboardLogic";

const Artboard: React.FC = () => {
  // ストアデータの取得
  const { addItem, updateItem } = usePageStore(state => ({ addItem: state.addItem, updateItem: state.updateItem }));
  const { placedItems } = usePageStore(state => {
    const page = state.selectedPageId ? state.pages[state.selectedPageId] : undefined;
    return { placedItems: page?.placedItems || [] };
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

  // カスタムフックからロジック呼び出し
  const {
    zoomLevel,
    ignoreNextClickRef,
    contextMenu,
    setContextMenu,
    handleItemDragStart,
    groupItems,
    ungroupItems,
    deleteItems,
    selectedIds
  } = useArtboardLogic(artboardRef);

  // アイテム選択ハンドラ
  const onArtboardItemSelect = useCallback((e: React.MouseEvent, id: string, label: string) => {
    if (ignoreNextClickRef.current) {
      ignoreNextClickRef.current = false;
      return;
    }
    const multiSelect = e.ctrlKey || e.metaKey;
    handleItemSelect(id, label, multiSelect);
  }, [handleItemSelect, ignoreNextClickRef]);

  // DnD (Drop) 処理
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ItemTypes.TOOL,
    collect: (monitor: DropTargetMonitor) => ({ isOver: !!monitor.isOver() }),
    drop: (item: { name: string }, monitor: DropTargetMonitor) => {
      const artboardRect = artboardRef.current?.getBoundingClientRect();
      if (!artboardRect) return;
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;

      let x = (clientOffset.x - artboardRect.left) / zoomLevel;
      let y = (clientOffset.y - artboardRect.top) / zoomLevel;

      const newItemId = `item-${Date.now()}`;
      const newItem: PlacedItemType = {
        id: newItemId,
        name: item.name,
        x: snapToGrid(x, gridSize),
        y: snapToGrid(y, gridSize),
        width: 100, height: 40,
        data: { text: item.name, src: null, showBorder: true, isTransparent: false, initialVisibility: true, isArtboardBackground: false, color: "#333333" },
      };

      // アイテムごとの初期設定
      if (item.name === "画像") {
        newItem.width = 150; newItem.height = 100; newItem.data.text = "画像";
        newItem.data.keepAspectRatio = true; newItem.data.color = undefined;
      } else if (item.name === "テキスト") {
        newItem.width = 120; newItem.data.text = "テキスト";
      } else if (item.name === "テキスト入力欄") {
        newItem.width = 200; newItem.height = 45;
        newItem.data = { ...newItem.data, text: "", variableName: `input_${Date.now()}`, placeholder: "テキストを入力..." };
      }

      // モバイルモード時の自動配置 (Auto-Stack)
      if (isMobileView) {
        const mobileWidth = 375;
        // 既存のアイテムの中で一番下にあるアイテムを探す
        let maxY = 0;
        let lastItemHeight = 0;

        placedItems.forEach(p => {
          if (p.y > maxY) {
            maxY = p.y;
            lastItemHeight = p.height;
          }
        });

        // 一番下のアイテムの下に配置 (マージン 20px)
        const nextY = maxY + lastItemHeight + 20;

        // Y座標を更新 (最初のアイテムの場合は少し上を空ける)
        newItem.y = placedItems.length === 0 ? 50 : nextY;

        // X座標を中央揃えに
        newItem.x = (mobileWidth - newItem.width) / 2;
      }

      addItem(newItem);
    },
  }), [addItem, zoomLevel, gridSize, isMobileView, placedItems]);
  drop(artboardRef);

  // 背景スタイル計算
  const backgroundStyle = useMemo(() => {
    const bgItem = !isPreviewing
      ? placedItems.find(p => p.data.isArtboardBackground && p.data.src)
      : undefined;

    const src = isPreviewing ? previewBackground.src : bgItem?.data.src;
    const pos = isPreviewing ? previewBackground.position : bgItem?.data.artboardBackgroundPosition;

    if (src) {
      return { backgroundImage: `url(${src})`, backgroundPosition: pos || '50% 50%', backgroundSize: 'cover' };
    }
    return { backgroundImage: 'none', backgroundPosition: '50% 50%', backgroundSize: 'cover' };
  }, [placedItems, isPreviewing, previewBackground]);

  const showGridOverlay = !isPreviewing && showGrid && gridSize !== null && gridSize > 2;
  const gridStyle = useMemo<React.CSSProperties>(() => {
    return {
      backgroundSize: `${gridSize}px ${gridSize}px`,
      backgroundImage: `linear-gradient(to right, rgba(0, 0, 0, 0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 0, 0, 0.08) 1px, transparent 1px)`,
    };
  }, [showGridOverlay, gridSize]);

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

  // アートボードのサイズ決定
  const artboardWidth = isMobileView ? 375 : 1000;
  const artboardHeight = isMobileView ? 667 : 700;

  return (
    <div
      className="artboard-wrapper"
      style={{ width: `${artboardWidth * zoomLevel}px`, height: `${artboardHeight * zoomLevel}px`, margin: "20px auto", position: "relative" }}
      onContextMenu={(e) => { e.preventDefault(); if (!isPreviewing) setContextMenu({ visible: true, x: e.clientX, y: e.clientY }); }}
    >
      <div
        ref={artboardRef}
        className={`artboard ${isOver ? "is-over" : ""} ${backgroundStyle.backgroundImage !== 'none' ? 'has-background-image' : ''}`}
        style={{ transform: `scale(${zoomLevel})`, margin: 0, ...backgroundStyle, width: `${artboardWidth}px`, height: `${artboardHeight}px` }}
        onClick={handleBackgroundClick}
      >
        {showGridOverlay && <div className="artboard-grid-overlay" style={gridStyle} />}
        {renderChildren(undefined)}
      </div>

      {contextMenu?.visible && (
        <ContextMenu
          x={contextMenu.x} y={contextMenu.y} selectedCount={selectedIds.length}
          onGroup={() => { groupItems(selectedIds); setContextMenu(null); }}
          onUngroup={() => { selectedIds.forEach(id => ungroupItems(id)); setContextMenu(null); }}
          onDelete={() => { deleteItems(selectedIds); setContextMenu(null); }}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
};

export default React.memo(Artboard);