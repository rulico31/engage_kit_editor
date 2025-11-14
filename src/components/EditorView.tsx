// src/components/EditorView.tsx

import React, { useState, useRef, useCallback, useEffect } from "react";
import Header, { type ViewMode } from "./Header";
import Artboard from "./Artboard";
import PropertiesPanel from "./PropertiesPanel";
import NodeEditor from "./NodeEditor";
import LeftPanel from "./LeftPanel";
import { useEditorContext } from "../contexts/EditorContext";
import "./EditorView.css";

interface EditorViewProps {
  projectName: string;
  isPreviewing: boolean;
  onGoHome: () => void;
  onExportProject: () => void;
  onImportProject: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onTogglePreview: () => void;
}

const EditorView: React.FC<EditorViewProps> = ({
  projectName,
  isPreviewing,
  onGoHome,
  onExportProject,
  onImportProject,
  onTogglePreview,
}) => {
  const { isPreviewing: isPreviewingFromContext } = useEditorContext();
  
  // 画面モード
  const [viewMode, setViewMode] = useState<ViewMode>("split");

  // =========================================================
  // ★ リサイズ管理ステート
  // =========================================================

  // 1. 上下分割の比率 (Splitモード時の上段の高さ)
  const [splitRatio, setSplitRatio] = useState(0.6); // デフォルトは上6割

  // 2. 左パネルの幅 (px)
  const [leftWidth, setLeftWidth] = useState(260);

  // 3. 右パネルの幅 (px)
  const [rightWidth, setRightWidth] = useState(280);

  // ドラッグ管理
  const isDraggingSplitRef = useRef(false);
  const isDraggingLeftRef = useRef(false);
  const isDraggingRightRef = useRef(false);
  
  // コンテナ参照 (上下分割計算用)
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
    // 1. 上下分割 (workspace全体に対する比率)
    if (isDraggingSplitRef.current && workspaceRef.current) {
      const rect = workspaceRef.current.getBoundingClientRect();
      const relativeY = e.clientY - rect.top;
      let newRatio = relativeY / rect.height;
      // 制限
      if (newRatio < 0.2) newRatio = 0.2;
      if (newRatio > 0.8) newRatio = 0.8;
      setSplitRatio(newRatio);
    }

    // 2. 左パネル幅
    if (isDraggingLeftRef.current) {
      let newWidth = e.clientX;
      if (newWidth < 150) newWidth = 150;
      if (newWidth > 500) newWidth = 500;
      setLeftWidth(newWidth);
    }

    // 3. 右パネル幅
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


  return (
    <div className="editor-container">
      <Header
        projectName={projectName}
        isPreviewing={isPreviewing}
        onGoHome={onGoHome}
        onExportProject={onExportProject}
        onImportProject={onImportProject}
        onTogglePreview={onTogglePreview}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {isPreviewingFromContext ? (
        <div className="preview-viewport">
          <Artboard />
        </div>
      ) : (
        // ワークスペース全体 (縦方向Flex)
        <div className="editor-workspace-vertical" ref={workspaceRef}>
          
          {/* =============================================
              上段エリア (Left + Center + Right)
              Design/Logicモード時は高さ100%、Split時は可変
             ============================================= */}
          <div 
            className="workspace-upper-row"
            style={{ 
              height: viewMode === 'split' ? `${splitRatio * 100}%` : '100%',
              flexShrink: 0 // サイズ固定用
            }}
          >
            
            {/* (1) 左パネル (Logic以外で表示) */}
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

            {/* (2) 中央メイン (Artboard または Logicモード時のNodeEditor) */}
            <div className="panel-center">
              <div className="workspace-content">
                {/* Logicモードならここにノードエディタを表示 (サイドバー付き) */}
                {viewMode === "logic" ? (
                  <div className="workspace-section logic-section" style={{ flex: 1 }}>
                    <NodeEditor />
                  </div>
                ) : (
                  /* Design/Splitモードならここにアートボードを表示 */
                  <div className="workspace-section design-section" style={{ flex: 1 }}>
                    <div className="canvas-viewport">
                      <Artboard />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* (3) 右パネル (常に表示) */}
            <>
              <div 
                className="resize-separator-vertical"
                onMouseDown={handleMouseDown("right")}
                title="ドラッグして右パネル幅を変更"
              >
                <div className="resize-handle-pill-vertical" />
              </div>
              <div className="panel-right" style={{ width: rightWidth }}>
                <PropertiesPanel />
              </div>
            </>
          </div>

          {/* =============================================
              リサイズハンドル (Splitモード時のみ)
             ============================================= */}
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

          {/* =============================================
              下段エリア (Node Editor)
              Splitモード時のみ表示 (全幅)
             ============================================= */}
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