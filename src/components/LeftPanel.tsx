// src/components/LeftPanel.tsx

import React, { useState, useRef, useCallback, useEffect } from "react";
import ToolboxItem from "./ToolboxItem";
import ContentBrowser from "./ContentBrowser";
// import { useEditorContext } from "../contexts/EditorContext"; // 削除

// ★ Zustand ストアをインポート
import { usePageStore } from "../stores/usePageStore";

// ★ 新しいCSSファイルをインポート
import "./LeftPanel.css";

export const LeftPanel: React.FC = React.memo(() => {
  // ★ 修正: ストアから購読
  const { 
    pageInfoList, 
    selectedPageId, 
    onSelectPage, 
    onAddPage 
  } = usePageStore(state => ({
    // 派生状態 (セレクタで計算)
    pageInfoList: state.pageOrder.map(id => ({ id: id, name: state.pages[id]?.name || "無題" })),
    selectedPageId: state.selectedPageId,
    onSelectPage: state.setSelectedPageId,
    onAddPage: state.addPage, // (★ addPage はプロンプトを必要とする...ストアの実装を修正)
  }));

  // ★ 修正: addPage のラップ
  const handleAddPageClick = () => {
    const newPageName = prompt("新しいページ名を入力してください:", `Page ${pageInfoList.length + 1}`);
    if (newPageName) {
      onAddPage(newPageName);
    }
  };

  // 上部（ツールボックス）の高さ比率
  const [splitRatio, setSplitRatio] = useState(0.4);
  
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
    <div 
      ref={containerRef} 
      className="left-panel-container" // CSSクラスを使用
    >
      {/* (A) 上部: ツールボックス */}
      <div 
        style={{ height: `${splitRatio * 100}%` }}
        className="tool-list-container panel-content"
      >
        <div className="tool-list" style={{ overflowY: "auto", flex: 1, paddingRight: "4px" }}>
          <ToolboxItem name="テキスト" />
          <ToolboxItem name="ボタン" />
          <ToolboxItem name="画像" />
          <ToolboxItem name="テキスト入力欄" />
        </div>
      </div>
      
      {/* ★ 修正: CSSクラス (.left-panel-separator) を適用 */}
      <div 
        className="left-panel-separator"
        onMouseDown={handleMouseDown}
        title="ドラッグして高さを変更"
      >
        <div className="left-panel-handle" />
      </div>
      
      {/* (B) 下部: コンテンツブラウザ */}
      <div 
        style={{ 
          flex: 1, 
          overflow: "hidden",
          display: "flex",
          flexDirection: "column"
        }}
        className="panel-content"
      >
        <ContentBrowser
          pages={pageInfoList}
          selectedPageId={selectedPageId}
          onSelectPage={onSelectPage}
          onAddPage={handleAddPageClick} // ★ 修正
        />
      </div>
    </div>
  );
});

export default LeftPanel;