import React, { useState } from 'react';
import './EmbedModal.css';

interface EmbedModalProps {
    projectId: string;
    onClose: () => void;
}

const EmbedModal: React.FC<EmbedModalProps> = ({ projectId, onClose }) => {
    const viewerUrl = `https://viewer.engage-kit.com/v/${projectId}`;
    const embedCode = `<iframe
  src="${viewerUrl}"
  width="100%"
  height="600"
  frameborder="0"
  allow="camera; microphone; fullscreen"
></iframe>`;

    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(embedCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content embed-modal" onClick={e => e.stopPropagation()}>
                <h3>埋め込みコードの取得</h3>
                <p>以下のコードをコピーして、WebサイトのHTMLに貼り付けてください。</p>

                <div className="embed-code-container">
                    <pre>{embedCode}</pre>
                </div>

                <div className="modal-actions">
                    <button className="copy-button" onClick={handleCopy}>
                        {copied ? 'コピーしました！' : 'コードをコピー'}
                    </button>
                    <button className="close-button" onClick={onClose}>
                        閉じる
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EmbedModal;
