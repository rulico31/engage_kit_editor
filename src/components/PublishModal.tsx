// src/components/PublishModal.tsx

import React, { useState } from "react";
import "./PublishModal.css";
import { CodeIcon } from "./icons/CodeIcon";

interface PublishModalProps {
  onClose: () => void;
  projectId: string | null;
}

const PublishModal: React.FC<PublishModalProps> = ({ onClose, projectId }) => {
  const [activeTab, setActiveTab] = useState<'iframe' | 'script' | 'url'>('iframe');
  const [isCopied, setIsCopied] = useState(false);

  // ★ 修正: 現在のオリジン（例: http://localhost:5173）を使用する
  const baseUrl = window.location.origin;
  const viewUrl = projectId ? `${baseUrl}/view/${projectId}` : "";

  // コード生成ロジック
  const generateCode = () => {
    if (!projectId) return "";

    if (activeTab === 'iframe') {
      // ★ Iframeのallow属性にfullscreenなどを追加
      return `<iframe \n  src="${viewUrl}" \n  width="100%" \n  height="600" \n  frameborder="0" \n  allow="camera; microphone; fullscreen"\n  style="border: none; box-shadow: 0 4px 12px rgba(0,0,0,0.1); border-radius: 8px;"\n></iframe>`;
    } else if (activeTab === 'script') {
      return `<div id="engage-kit-root-${projectId}"></div>\n<script src="${baseUrl}/embed.js" data-project-id="${projectId}" async></script>`;
    } else {
      return viewUrl;
    }
  };

  const code = generateCode();

  const handleCopy = () => {
    if (!code) return;
    navigator.clipboard.writeText(code).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  return (
    <div className="publish-modal-overlay" onClick={onClose}>
      <div className="publish-modal-box" onClick={(e) => e.stopPropagation()}>

        {/* ヘッダー */}
        <div className="publish-modal-header">
          <h2 className="publish-modal-title">
            <CodeIcon className="w-5 h-5" />
            公開・埋め込み
          </h2>
          <button className="publish-close-button" onClick={onClose}>×</button>
        </div>

        {/* コンテンツ */}
        <div className="publish-modal-content">

          {!projectId ? (
            <div className="publish-warning">
              ⚠️ プロジェクトが保存されていません。コードを発行するには先に保存してください。
            </div>
          ) : (
            <>
              {/* タブ */}
              <div className="publish-tabs">
                <button
                  className={`publish-tab ${activeTab === 'iframe' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('iframe'); setIsCopied(false); }}
                >
                  Iframe
                </button>
                <button
                  className={`publish-tab ${activeTab === 'script' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('script'); setIsCopied(false); }}
                >
                  Script
                </button>
                <button
                  className={`publish-tab ${activeTab === 'url' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('url'); setIsCopied(false); }}
                >
                  URL
                </button>
              </div>

              {/* 説明書き */}
              <p style={{ fontSize: '0.9em', color: '#aaa', marginBottom: '12px' }}>
                {activeTab === 'iframe'
                  ? 'Webサイトやブログ記事の中に、独立したウィンドウとしてコンテンツを表示します。デザイン崩れが起きにくく、最も安全な方法です。'
                  : activeTab === 'script'
                    ? 'サイトの一部としてシームレスに統合します。より高度な連携が可能ですが、スタイルの競合に注意が必要です。'
                    : '直接アクセス可能なURLです。SNSでシェアしたり、QRコードを生成したりする際に使用します。'}
              </p>

              {/* コード表示エリア */}
              <div className="code-preview-area">
                <pre className="code-preview-text">{code}</pre>
              </div>

              {/* コピーボタン */}
              <div className="copy-button-wrapper">
                <button
                  className={`copy-button ${isCopied ? 'copied' : ''}`}
                  onClick={handleCopy}
                >
                  {isCopied ? "コピーしました！" : activeTab === 'url' ? "URLをコピー" : "コードをコピー"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublishModal;