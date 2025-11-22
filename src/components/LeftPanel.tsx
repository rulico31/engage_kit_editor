// src/components/LeftPanel.tsx

import React, { useState, useRef, useCallback, useEffect } from "react";
import ToolboxItem from "./ToolboxItem";
import ContentBrowser from "./ContentBrowser";
import { LayerPanel } from "./LayerPanel"; // ★ 新規
import { usePageStore } from "../stores/usePageStore";
import "./LeftPanel.css";

type LeftTab = 'tools' | 'layers';

export const LeftPanel: React.FC = React.memo(() => {
  const { 
    pageInfoList, 
    selectedPageId, 
    onSelectPage, 
    onAddPage 
  } = usePageStore(state => ({
    pageInfoList: state.pageOrder.map(id => ({ id: id, name: state.pages[id]?.name || "無題" })),
    selectedPageId: state.selectedPageId,
    onSelectPage: state.setSelectedPageId,
    onAddPage: state.addPage,
  }));

  const handleAddPageClick = () => {
    const newPageName = prompt("新しいページ名を入力してください:", `Page ${pageInfoList.length + 1}`);
    if (newPageName) {
      onAddPage(newPageName);
    }
  };

  // タブ状態
  const [activeTab, setActiveTab] = useState<LeftTab>('tools');

  // リサイズ比率
  const [splitRatio, setSplitRatio] = useState(0.5);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    document.body.style.cursor = "row-resize";
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relativeY = e.clientY - rect.top;
    let newRatio = relativeY / rect.height;
    if (newRatio < 0.2) newRatio = 0.2;
    if (newRatio > 0.8) newRatio = 0.8;
    setSplitRatio(newRatio);
  }, []);

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
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
    <div ref={containerRef} className="left-panel-container">
      {/* 上部: タブ切り替えエリア */}
      <div className="left-panel-tabs">
        <button 
          className={`left-panel-tab ${activeTab === 'tools' ? 'active' : ''}`}
          onClick={() => setActiveTab('tools')}
        >
          ツール
        </button>
        <button 
          className={`left-panel-tab ${activeTab === 'layers' ? 'active' : ''}`}
          onClick={() => setActiveTab('layers')}
        >
          レイヤー
        </button>
      </div>

      {/* 上部コンテンツエリア */}
      <div style={{ height: `${splitRatio * 100}%` }} className="panel-content-area">
        {activeTab === 'tools' ? (
          <div className="tool-list-container">
            <div className="tool-list">
              <ToolboxItem name="テキスト" />
              <ToolboxItem name="ボタン" />
              <ToolboxItem name="画像" />
              <ToolboxItem name="テキスト入力欄" />
            </div>
          </div>
        ) : (
          <LayerPanel />
        )}
      </div>
      
      {/* リサイズバー */}
      <div 
        className="left-panel-separator"
        onMouseDown={handleMouseDown}
        title="ドラッグして高さを変更"
      >
        <div className="left-panel-handle" />
      </div>
      
      {/* 下部: コンテンツブラウザ */}
      <div style={{ flex: 1, overflow: "hidden" }} className="panel-content-area">
        <ContentBrowser
          pages={pageInfoList}
          selectedPageId={selectedPageId}
          onSelectPage={onSelectPage}
          onAddPage={handleAddPageClick}
        />
      </div>
    </div>
  );
});

export default LeftPanel;