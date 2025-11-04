// src/components/ProjectNameModal.tsx

import React, { useState } from "react";
import "./ProjectNameModal.css";

// このコンポーネントが受け取るPropsの型
interface ProjectNameModalProps {
  onClose: () => void;
  onConfirm: (projectName: string) => void;
}

const ProjectNameModal: React.FC<ProjectNameModalProps> = ({
  onClose,
  onConfirm,
}) => {
  // モーダル内部で入力中のプロジェクト名を管理
  const [name, setName] = useState<string>("Untitled Project");

  const handleConfirmClick = () => {
    // 名前が空でないことを確認（任意）
    if (name.trim()) {
      onConfirm(name.trim());
    } else {
      alert("プロジェクト名を入力してください。");
    }
  };

  // Enterキーでも確定できるように
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleConfirmClick();
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose} // 背景クリックで閉じる
    >
      <div
        className="modal-box"
        onClick={(e) => e.stopPropagation()} // モーダル自体はクリックしても閉じない
      >
        <h2 className="modal-title">プロジェクトを新規作成</h2>
        <div className="modal-content">
          <label htmlFor="project-name-input" className="modal-label">
            プロジェクト名:
          </label>
          <input
            id="project-name-input"
            type="text"
            className="modal-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus // モーダルが開いたら自動でフォーカス
            onFocus={(e) => e.target.select()} // フォーカス時に全選択
          />
        </div>
        <div className="modal-buttons">
          <button className="modal-button secondary" onClick={onClose}>
            キャンセル
          </button>
          <button className="modal-button primary" onClick={handleConfirmClick}>
            作成
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectNameModal;