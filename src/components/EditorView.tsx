// src/components/EditorView.tsx

import React, { useState, useRef, useCallback, useEffect } from "react";
import Header from "./Header";
import Artboard from "./Artboard";
import PropertiesPanel from "./PropertiesPanel";
import NodeEditor from "./NodeEditor";
import LeftPanel from "./LeftPanel";
import DashboardView from "./DashboardView";
import "./EditorView.css";
import "./GridPopover.css";
import EmbedModal from "./EmbedModal";

import { useEditorSettingsStore } from "../stores/useEditorSettingsStore";
import { usePageStore } from "../stores/usePageStore";
import { useSelectionStore } from "../stores/useSelectionStore";
import { useProjectStore } from "../stores/useProjectStore";

interface EditorViewProps {
  projectName: string;
  onGoHome: () => void;
  onOpenBackgroundModal: (itemId: string, src: string) => void;
  onPublish: () => void;
}

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
      <div className="grid-popover-section">
        <label className="grid-popover-label">スナップ (PX)</label>
        <div className="grid-button-group">
          {snapOptions.map((size) => (
            <button
              key={size === null ? 'null' : size}
              className={`grid-snap-button ${gridSize === size ? 'active' : ''}`}
              onClick={() => setGridSize(size)}
              title={size === null ? "スナップ OFF" : size === 1 ? "ピクセル (1px) スナップ" : `${size}px グリッド`}
            >
              {size === null ? 'OFF' : size}
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

  const { saveProject } = useProjectStore();
  const [isEmbedModalOpen, setIsEmbedModalOpen] = useState(false);

  const handleSave = async () => {
    try {
      await saveProject();
      alert("プロジェクトを保存しました (Supabase)");
    } catch (e) {
      console.error(e);
      alert("保存に失敗しました");
    }
  };

  const handleOpenEmbedModal = async () => {
    // 保存してからモーダルを開く (ID確定のため)
    await handleSave();
    setIsEmbedModalOpen(true);
  };

  const handleEnterFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((e) => {
        console.error(`Error attempting to enable fullscreen: ${e instanceof Error ? e.message : String(e)}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const [isGridPopoverOpen, setIsGridPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

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

        else if (e.key === 'g') {
          e.preventDefault();
          const currentSelectedIds = useSelectionStore.getState().selectedIds;

          if (e.shiftKey) {
            if (currentSelectedIds.length > 0) {
              currentSelectedIds.forEach(id => {
                usePageStore.getState().ungroupItems(id);
              });
            }
          } else {
            if (currentSelectedIds.length >= 2) {
              usePageStore.getState().groupItems(currentSelectedIds);
            }
          }
        }
        else if (e.key === 's') {
          e.preventDefault();
          handleSave();
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
        onSave={handleSave}
        onTogglePreview={togglePreview}
        onEnterFullscreen={handleEnterFullscreen}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onPublish={onPublish}
      />

      <div className="editor-workspace-vertical" ref={workspaceRef}>
        {viewMode === "dashboard" ? (
          <div className="workspace-section dashboard-section" style={{ width: '100%', height: '100%' }}>
            <DashboardView />
          </div>
        ) : (
          <>
            <div
              className="workspace-upper-row"
              style={{
                height: viewMode === 'split' && !isPreviewing ? `${splitRatio * 100}%` : '100%',
                flexShrink: 0
              }}
            >
              {/* Left Panel & Artboard Area */}
              {viewMode !== "logic" ? (<>
                {/* Left Panel - Hidden during preview */}
                {!isPreviewing && (
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
                <div className="workspace-section design-section" style={{ flex: 1 }}>
                  <div className="canvas-viewport">
                    <Artboard />
                  </div>
                </div>
              </>
              ) : (
                !isPreviewing ? (
                  <div className="workspace-section logic-section" style={{ flex: 1 }}>
                    <NodeEditor />
                  </div>
                ) : (
                  <div className="workspace-section design-section" style={{ flex: 1 }}>
                    <div className="canvas-viewport">
                      <Artboard />
                    </div>
                  </div>
                )
              )}

              {/* Right Panel (Properties) - Hidden during preview */}
              {!isPreviewing && (
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
              )}
            </div>

            {/* Split View: Lower Row */}
            {/* Split View: Lower Row - Hidden during preview */}
            {viewMode === 'split' && !isPreviewing && (
              <>
                <div
                  className="resize-separator-horizontal"
                  onMouseDown={handleMouseDown("split")}
                  title="ドラッグして上下比率を変更"
                >
                  <div className="resize-handle-pill-horizontal">
                    <div className="resize-handle-dots-horizontal"></div>
                  </div>
                </div>
                <div className="workspace-lower-row" style={{ flex: 1 }}>
                  <div className="workspace-section logic-section" style={{ width: '100%', height: '100%' }}>
                    <NodeEditor />
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {isEmbedModalOpen && (
        <EmbedModal
          projectId={useProjectStore.getState().currentProjectId || ""}
          onClose={() => setIsEmbedModalOpen(false)}
        />
      )}

      {isGridPopoverOpen && popoverRef.current && (
        <div style={{ position: 'absolute', top: 50, right: 100, zIndex: 9999 }}>
          <GridPopover />
        </div>
      )}
    </div>
  );
};

export default EditorView;