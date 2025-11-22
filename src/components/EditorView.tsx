// src/components/EditorView.tsx

import React, { useState, useRef, useCallback, useEffect } from "react";
import Header from "./Header";
import Artboard from "./Artboard";
import PropertiesPanel from "./PropertiesPanel";
import NodeEditor from "./NodeEditor";
import LeftPanel from "./LeftPanel";
import "./EditorView.css";
import { GridIcon } from "./icons/GridIcon";
import { SlashIcon } from "./icons/SlashIcon";
import "./GridPopover.css";

// ★ 修正: 未使用の ViewMode インポートを削除
// import type { ViewMode } from "../types";

import { useEditorSettingsStore } from "../stores/useEditorSettingsStore";
import { usePreviewStore } from "../stores/usePreviewStore";
import { usePageStore } from "../stores/usePageStore";

interface EditorViewProps {
  projectName: string;
  onGoHome: () => void;
  onExportProject: () => void;
  onImportProject: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenBackgroundModal: (itemId: string, src: string) => void;
  onPublish: () => void; 
}

// グリッド/スナップ設定のポップオーバー
const GridPopover: React.FC = () => {
  const { gridSize, setGridSize, showGrid, setShowGrid } = useEditorSettingsStore(state => ({
    gridSize: state.gridSize,
    setGridSize: state.setGridSize,
    showGrid: state.showGrid,
    setShowGrid: state.setShowGrid,
  }));

  const snapOptions = [null, 1, 2, 4, 8, 16, 32];
  
  return (
    <div className="grid-popover">
      {/* グリッド表示設定セクション */}
      <div className="grid-popover-section">
        <label className="grid-popover-label">グリッド線</label>
        <div className="grid-toggle-row">
          <button 
            className={`grid-visibility-button ${showGrid ? 'active' : ''}`}
            onClick={() => setShowGrid(!showGrid)}
          >
            {showGrid ? "表示中 (ON)" : "非表示 (OFF)"}
          </button>
        </div>
      </div>

      <div className="grid-popover-divider" />

      {/* スナップ設定セクション */}
      <div className="grid-popover-section">
        <label className="grid-popover-label">スナップ (PX)</label>
        <div className="grid-button-group">
          {snapOptions.map((size) => (
            <button
              key={size === null ? 'null' : size}
              className={`grid-snap-button ${gridSize === size ? 'active' : ''}`}
              onClick={() => setGridSize(size)}
              title={
                size === null ? "スナップ OFF" : 
                size === 1 ? "ピクセル (1px) スナップ" : 
                `${size}px グリッド`
              }
            >
              {size === null ? <SlashIcon /> : size}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};


const EditorView: React.FC<EditorViewProps> = ({
  projectName,
  onGoHome,
  onExportProject,
  onImportProject,
  onOpenBackgroundModal,
  onPublish, 
}) => {
  
  const { 
    viewMode, 
    setViewMode, 
    isPreviewing, 
    togglePreview 
  } = useEditorSettingsStore(state => ({
    viewMode: state.viewMode,
    setViewMode: state.setViewMode,
    isPreviewing: state.isPreviewing,
    togglePreview: state.togglePreview,
  }));
  
  const initPreview = usePreviewStore(state => state.initPreview);
  const stopPreview = usePreviewStore(state => state.stopPreview);

  const handleTogglePreview = () => {
    if (!isPreviewing) {
      initPreview(); 
    } else {
      stopPreview(); 
    }
    togglePreview();
  };
  
  const [isGridPopoverOpen, setIsGridPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // =========================================================
  // リサイズ管理ステート
  // =========================================================
  const [splitRatio, setSplitRatio] = useState(0.6);
  const [leftWidth, setLeftWidth] = useState(260);
  const [rightWidth, setRightWidth] = useState(280);
  const isDraggingSplitRef = useRef(false);
  const isDraggingLeftRef = useRef(false);
  const isDraggingRightRef = useRef(false);
  const workspaceRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((type: "split" | "left" | "right") => (e: React.MouseEvent) => {
    e.preventDefault();
    if (type === "split") isDraggingSplitRef.current = true;
    if (type === "left") isDraggingLeftRef.current = true;
    if (type === "right") isDraggingRightRef.current = true;
    document.body.style.cursor = type === "split" ? "row-resize" : "col-resize";
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDraggingSplitRef.current && workspaceRef.current) {
      const rect = workspaceRef.current.getBoundingClientRect();
      const relativeY = e.clientY - rect.top;
      let newRatio = relativeY / rect.height;
      if (newRatio < 0.2) newRatio = 0.2;
      if (newRatio > 0.8) newRatio = 0.8;
      setSplitRatio(newRatio);
    }
    if (isDraggingLeftRef.current) {
      let newWidth = e.clientX;
      if (newWidth < 150) newWidth = 150;
      if (newWidth > 500) newWidth = 500;
      setLeftWidth(newWidth);
    }
    if (isDraggingRightRef.current) {
      let newWidth = window.innerWidth - e.clientX;
      if (newWidth < 200) newWidth = 200;
      if (newWidth > 600) newWidth = 600;
      setRightWidth(newWidth);
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    isDraggingSplitRef.current = false;
    isDraggingLeftRef.current = false;
    isDraggingRightRef.current = false;
    document.body.style.cursor = "";
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
  }, [handleMouseMove]);

  useEffect(() => {
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsGridPopoverOpen(false);
      }
    };
    if (isGridPopoverOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isGridPopoverOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (useEditorSettingsStore.getState().isPreviewing) return;
      if (e.metaKey || e.ctrlKey) {
        if (e.key === 'z') {
          e.preventDefault();
          if (e.shiftKey) {
            if (usePageStore.getState().canRedo) usePageStore.getState().redo();
          } else {
            if (usePageStore.getState().canUndo) usePageStore.getState().undo();
          }
        } else if (e.key === 'y') {
          e.preventDefault();
          if (usePageStore.getState().canRedo) usePageStore.getState().redo();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);


  return (
    <div className="editor-container">
      <Header
        projectName={projectName}
        isPreviewing={isPreviewing}
        onGoHome={onGoHome}
        onExportProject={onExportProject}
        onImportProject={onImportProject}
        onTogglePreview={handleTogglePreview}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onPublish={onPublish}
      />

      {isPreviewing ? (
        <div className="preview-viewport">
          <Artboard />
        </div>
      ) : (
        <div className="editor-workspace-vertical" ref={workspaceRef}>
          
          <div 
            className="workspace-upper-row"
            style={{ 
              height: viewMode === 'split' ? `${splitRatio * 100}%` : '100%',
              flexShrink: 0
            }}
          >
            
            {viewMode !== "logic" && (
              <>
                <div className="panel-left" style={{ width: leftWidth }}>
                  <LeftPanel />
                </div>
                <div 
                  className="resize-separator-vertical"
                  onMouseDown={handleMouseDown("left")}
                  title="ドラッグして左パネル幅を変更"
                >
                  <div className="resize-handle-pill-vertical" />
                </div>
              </>
            )}

            <div className="panel-center">
              
              {viewMode !== "logic" && (
                <div className="grid-controls-wrapper" ref={popoverRef}>
                  <button 
                    className="grid-toggle-button" 
                    onClick={() => setIsGridPopoverOpen(prev => !prev)}
                    title="グリッドとスナップの設定"
                  >
                    <GridIcon className="grid-icon" />
                  </button>
                  {isGridPopoverOpen && <GridPopover />}
                </div>
              )}

              <div className="workspace-content">
                {viewMode === "logic" ? (
                  <div className="workspace-section logic-section" style={{ flex: 1 }}>
                    <NodeEditor />
                  </div>
                ) : (
                  <div className="workspace-section design-section" style={{ flex: 1 }}>
                    <div className="canvas-viewport">
                      <Artboard />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <>
              <div 
                className="resize-separator-vertical"
                onMouseDown={handleMouseDown("right")}
                title="ドラッグして右パネル幅を変更"
              >
                <div className="resize-handle-pill-vertical" />
              </div>
              <div className="panel-right" style={{ width: rightWidth }}>
                <PropertiesPanel 
                  onOpenBackgroundModal={onOpenBackgroundModal}
                />
              </div>
            </>
          </div>

          {viewMode === 'split' && (
            <div 
              className="resize-separator-horizontal"
              onMouseDown={handleMouseDown("split")}
              title="ドラッグして上下比率を変更"
            >
              <div className="resize-handle-pill-horizontal">
                <div className="resize-handle-dots-horizontal"></div>
              </div>
            </div>
          )}

          {viewMode === 'split' && (
            <div className="workspace-lower-row" style={{ flex: 1 }}>
              <div className="workspace-section logic-section" style={{ width: '100%', height: '100%' }}>
                <NodeEditor />
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};

export default EditorView;