// src/components/EditorView.tsx

import React, { useState, useRef, useCallback, useEffect } from "react";
import Header, { type ViewMode } from "./Header";
import Artboard from "./Artboard";
import PropertiesPanel from "./PropertiesPanel";
import NodeEditor from "./NodeEditor";
import LeftPanel from "./LeftPanel";
// import { useEditorContext } from "../contexts/EditorContext"; // 削除
import "./EditorView.css";
import { GridIcon } from "./icons/GridIcon";
import { SlashIcon } from "./icons/SlashIcon";
import "./GridPopover.css";

// ★ Zustand ストアをインポート
import { useEditorSettingsStore } from "../stores/useEditorSettingsStore";
import { usePreviewStore } from "../stores/usePreviewStore";

interface EditorViewProps {
  projectName: string;
  // ★ App.tsx から渡される Props を修正
  // isPreviewing: boolean; // (ストアから取得)
  onGoHome: () => void;
  onExportProject: () => void;
  onImportProject: (event: React.ChangeEvent<HTMLInputElement>) => void;
  // onTogglePreview: () => void; // (ストアのアクションを呼ぶ)
  onOpenBackgroundModal: (itemId: string, src: string) => void;
}

// ★ グリッド/スナップ設定のポップオーバー
const GridPopover: React.FC = () => {
  // ★ 修正: ストアから購読
  const { gridSize, setGridSize } = useEditorSettingsStore(state => ({
    gridSize: state.gridSize,
    setGridSize: state.setGridSize,
  }));

  const snapOptions = [null, 1, 2, 4, 8, 16, 32];
  
  return (
    <div className="grid-popover">
      <div className="grid-popover-section">
        <label className="grid-popover-label">スナップ (px)</label>
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
      {/* (★ グリッド表示セクションは削除済み) */}
    </div>
  );
};


const EditorView: React.FC<EditorViewProps> = ({
  projectName,
  onGoHome,
  onExportProject,
  onImportProject,
  onOpenBackgroundModal, // (★ App.tsx から受け取る)
}) => {
  
  // ★ 修正: ストアから購読
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
  
  // ★ プレビューストアのアクションを取得
  const initPreview = usePreviewStore(state => state.initPreview);
  const stopPreview = usePreviewStore(state => state.stopPreview);

  // ★ 修正: onTogglePreview をラップ
  const handleTogglePreview = () => {
    if (!isPreviewing) {
      initPreview(); // プレビュー開始時に状態を初期化
    } else {
      stopPreview(); // プレビュー終了時に状態をクリア
    }
    togglePreview(); // エディタの設定ストアの状態を切り替え
  };
  
  // ★ グリッドポップオーバーの表示状態 (これはローカルUI状態)
  const [isGridPopoverOpen, setIsGridPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // =========================================================
  // ★ リサイズ管理ステート (これはローカルUI状態)
  // =========================================================
  const [splitRatio, setSplitRatio] = useState(0.6);
  const [leftWidth, setLeftWidth] = useState(260);
  const [rightWidth, setRightWidth] = useState(280);
  const isDraggingSplitRef = useRef(false);
  const isDraggingLeftRef = useRef(false);
  const isDraggingRightRef = useRef(false);
  const workspaceRef = useRef<HTMLDivElement>(null);

  // =========================================================
  // ハンドラ定義
  // =========================================================

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

  // ★ ポップオーバーの外側クリックで閉じる
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


  return (
    <div className="editor-container">
      <Header
        projectName={projectName}
        isPreviewing={isPreviewing}
        onGoHome={onGoHome}
        onExportProject={onExportProject}
        onImportProject={onImportProject}
        onTogglePreview={handleTogglePreview} // ★ 修正
        viewMode={viewMode}
        onViewModeChange={setViewMode} // ★ 修正
      />

      {isPreviewing ? ( // ★ 修正
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
                {/* ★ 修正: onOpenBackgroundModal を渡す */}
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