import React, { useState } from 'react';
import './EmbedModal.css';

interface EmbedModalProps {
    projectId: string;
    onClose: () => void;
}

const EmbedModal: React.FC<EmbedModalProps> = ({ projectId, onClose }) => {
    const viewerUrl = `https://viewer.engage-kit.com/v/${projectId}`;

    // 高さ自動調整スクリプトを含む埋め込みコード
    const embedCode = `<iframe
  id="engage-kit-frame-${projectId}"
  src="${viewerUrl}"
  width="100%"
  style="border: none; overflow: hidden; width: 100%;"
  scrolling="no"
></iframe>
<script>
window.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'ENGAGE_KIT_RESIZE') {
    var frame = document.getElementById('engage-kit-frame-${projectId}');
    if (frame) {
      frame.style.height = e.data.height + 'px';
    }
  }
});
</script>`;

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