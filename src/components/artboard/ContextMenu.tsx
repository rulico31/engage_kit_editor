import React from "react";
import "../Artboard.css";

interface ContextMenuProps {
  x: number;
  y: number;
  selectedCount: number;
  onDelete: () => void;
  onAddComment: () => void;
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  selectedCount,
  onDelete,
  onAddComment,
  onClose
}) => {
  return (
    <>
      {/* 背景クリックで閉じるための透明なレイヤー */}
      <div
        style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 9998 }}
        onClick={onClose}
        onContextMenu={(e) => { e.preventDefault(); onClose(); }}
      />
      <div
        className="context-menu"
        style={{ top: y, left: x }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="context-menu-item"
          onClick={onAddComment}
        >
          <span>💬 コメントを追加</span>
        </div>
        <div className="context-menu-separator" />
        <div
          className={`context-menu-item ${selectedCount === 0 ? "disabled" : ""}`}
          onClick={onDelete}
        >
          <span>削除 (Delete)</span>
          <span className="shortcut-hint">Del</span>
        </div>
      </div>
    </>
  );
};