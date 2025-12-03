// src/components/LeftPanel.tsx

import React, { useRef } from "react";
import { useDrag } from "react-dnd";
import { ItemTypes } from "../ItemTypes";
import "./LeftPanel.css";
import { usePageStore } from "../stores/usePageStore";
import { PageNameModal } from "./PageNameModal";

// --- レイヤーパネルのインポート (内部コンポーネント) ---
const LayerPanel: React.FC = () => {
  const { placedItems, selectedPageId } = usePageStore(state => ({
    placedItems: state.selectedPageId ? state.pages[state.selectedPageId].placedItems : [],
    selectedPageId: state.selectedPageId,
  }));

  // 重ね順（DOM順）の逆順で表示すると、上が「手前」に見える
  const reversedItems = [...placedItems].reverse();

  if (!selectedPageId) return <div className="layer-empty">ページを選択してください</div>;

  return (
    <div className="layer-list">
      {reversedItems.length === 0 && <div className="layer-empty">アイテムがありません</div>}
      {reversedItems.map((item) => (
        <div key={item.id} className="layer-item">
          <span className="layer-icon">
            {item.name.startsWith("画像") ? "🖼️" :
              item.name.startsWith("テキスト") ? "T" :
                item.name.startsWith("ボタン") ? "🔘" : "⬜"}
          </span>
          <span className="layer-name">{item.data.text || item.name}</span>
        </div>
      ))}
    </div>
  );
};

// --- ページリスト (左下) ---
const PageList: React.FC = () => {
  const { pages, pageOrder, selectedPageId, addPage, setSelectedPageId, deletePage } = usePageStore(state => ({
    pages: state.pages,
    pageOrder: state.pageOrder,
    selectedPageId: state.selectedPageId,
    addPage: state.addPage,
    setSelectedPageId: state.setSelectedPageId,
    deletePage: state.deletePage,
  }));

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [initialPageName, setInitialPageName] = React.useState("");

  const handleOpenModal = () => {
    setInitialPageName(`Page ${pageOrder.length + 1}`);
    setIsModalOpen(true);
  };

  const handleAddPage = (name: string) => {
    addPage(name);
    setIsModalOpen(false);
  };

  return (
    <div className="page-list-container">
      <div className="page-list-scroll">
        {pageOrder.map((pageId) => {
          const page = pages[pageId];
          return (
            <div
              key={pageId}
              className={`page-list-item ${selectedPageId === pageId ? "selected" : ""}`}
              onClick={() => setSelectedPageId(pageId)}
            >
              <span className="page-name">{page.name}</span>
              {pageOrder.length > 1 && (
                <button
                  className="page-delete-btn"
                  onClick={(e) => { e.stopPropagation(); deletePage(pageId); }}
                >
                  ×
                </button>
              )}
            </div>
          );
        })}
      </div>
      <button className="add-page-button" onClick={handleOpenModal}>
        ページを追加 (+)
      </button>
      <PageNameModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleAddPage}
        initialName={initialPageName}
      />
    </div>
  );
};

// --- ドラッグ可能なツールアイコン ---
const DraggableTool: React.FC<{ name: string; label: string; icon: string }> = ({ name, label, icon }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.TOOL,
    item: { name },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const ref = useRef<HTMLDivElement>(null);
  drag(ref);

  return (
    <div ref={ref} className={`tool-item ${isDragging ? "dragging" : ""}`}>
      <span className="tool-icon">{icon}</span>
      <span className="tool-label">{label}</span>
    </div>
  );
};

// --- LeftPanel Main ---
const LeftPanel: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState<'tools' | 'layers'>('tools');

  // 修正: 初期値を '70%' から '50%' に変更し、ページリストの領域を確保
  const [contentHeight, setContentHeight] = React.useState<string | number>('50%');
  const panelRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY;

    // Convert percentage to pixels on first drag
    let startHeight = 0;
    if (typeof contentHeight === 'number') {
      startHeight = contentHeight;
    } else if (panelRef.current) {
      // 修正: 現在のパーセンテージ設定に基づいてピクセル高さを計算 (以前は0.7固定だった)
      const currentPercent = parseFloat(contentHeight as string) || 50;
      startHeight = panelRef.current.clientHeight * (currentPercent / 100);
    } else {
      startHeight = 400; // Fallback
    }

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      // 最小高さ100px、最大高さ(パネル全体 - 100px)の制限
      const newHeight = Math.max(100, Math.min(startHeight + deltaY, (panelRef.current?.clientHeight || 600) - 100));
      setContentHeight(newHeight);
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  return (
    <div className="left-panel" ref={panelRef}>
      {/* タブ切り替え */}
      <div className="left-panel-tabs">
        <button
          className={`panel-tab ${activeTab === 'tools' ? 'active' : ''}`}
          onClick={() => setActiveTab('tools')}
        >
          ツール
        </button>
        <button
          className={`panel-tab ${activeTab === 'layers' ? 'active' : ''}`}
          onClick={() => setActiveTab('layers')}
        >
          レイヤー
        </button>
      </div>

      {/* 上部コンテンツ (ツール or レイヤー) */}
      <div className="left-panel-content" style={{ height: contentHeight, flex: 'none' }}>
        {activeTab === 'tools' ? (
          <div className="tools-grid">
            <DraggableTool name="テキスト" label="テキスト" icon="T" />
            <DraggableTool name="ボタン" label="ボタン" icon="🔘" />
            <DraggableTool name="画像" label="画像" icon="🖼️" />
            <DraggableTool name="テキスト入力欄" label="テキスト入力欄" icon="📝" />
          </div>
        ) : (
          <LayerPanel />
        )}
      </div>

      {/* Splitter */}
      <div className="panel-splitter" onMouseDown={handleMouseDown} />

      {/* 下部: ページリスト (常に表示) */}
      <div className="left-panel-footer" style={{ flex: 1, overflow: 'hidden' }}>
        <PageList />
      </div>
    </div>
  );
};

export default LeftPanel;