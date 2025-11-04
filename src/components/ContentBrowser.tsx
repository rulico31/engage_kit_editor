// src/components/ContentBrowser.tsx

import React from "react";
import type { PageInfo } from "../types";
import "./ContentBrowser.css";

interface ContentBrowserProps {
  pages: PageInfo[]; // App.tsx から渡されるページ情報
  selectedPageId: string | null;
  onSelectPage: (pageId: string) => void;
  onAddPage: () => void;
}

const ContentBrowser: React.FC<ContentBrowserProps> = ({
  pages,
  selectedPageId,
  onSelectPage,
  onAddPage,
}) => {
  return (
    <div className="page-browser-content">
      {/* ページ一覧 */}
      <ul className="page-list">
        {pages.map((page) => (
          <li
            key={page.id}
            className={`page-list-item ${
              page.id === selectedPageId ? "is-selected" : ""
            }`}
            onClick={() => onSelectPage(page.id)}
            title={page.name} // ホバー時にフルネーム表示
          >
            {page.name}
          </li>
        ))}
      </ul>

      {/* フッターの「追加」ボタン */}
      <div className="page-add-footer">
        <button className="page-add-button" onClick={onAddPage}>
          ページを追加 (+)
        </button>
      </div>
    </div>
  );
};

export default ContentBrowser;

