// src/components/PublishModal.tsx

import React, { useState } from "react";
import { useProjectStore } from "../stores/useProjectStore";
import { usePageStore } from "../stores/usePageStore";
import { supabase } from "../lib/supabaseClient";
import type { ProjectData, PlacedItemType } from "../types";
import "./PublishModal.css";

interface PublishModalProps {
  projectId: string | null;
  onClose: () => void;
}

const PublishModal: React.FC<PublishModalProps> = ({ projectId, onClose }) => {
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishStep, setPublishStep] = useState<string>("");
  const [progress, setProgress] = useState(0);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [embedCode, setEmbedCode] = useState<string>("");

  const { projectMeta } = useProjectStore((state) => ({
    projectMeta: state.projectMeta,
  }));

  const pages = usePageStore((state) => state.pages);
  const pageOrder = usePageStore((state) => state.pageOrder);
  const variables = useProjectStore((state) => state.projectMeta?.data.variables || {});

  // 画像をSupabase Storageにアップロードするヘルパー関数
  const uploadAsset = async (assetSrc: string, projectId: string): Promise<string> => {
    // 1. すでにSupabaseのURLになっている場合はスキップ
    if (assetSrc.startsWith("http") && assetSrc.includes("supabase.co")) {
      return assetSrc;
    }

    try {
      let fileBody: Blob | File;
      let fileName = "";

      // ソースのクリーニング (file:// プレフィックスの揺れを吸収)
      // Windowsの場合 "file:///C:/..." となることがあるため、fetchで扱える形式にする
      let fetchUrl = assetSrc;

      // Electron環境でローカルパス(絶対パス)がそのまま渡ってきた場合の補正
      if (!assetSrc.startsWith("http") && !assetSrc.startsWith("blob:") && !assetSrc.startsWith("data:")) {
        if (!assetSrc.startsWith("file://") && !assetSrc.startsWith("engage://")) {
          // C:/Users/... のようなパスに file:// を付与
          fetchUrl = `file://${assetSrc}`;
        }
      }

      // ★ ローカルファイルを fetch で取得 (webSecurity: false なので可能)
      const response = await fetch(fetchUrl);
      if (!response.ok) throw new Error(`Failed to load local file: ${fetchUrl}`);

      fileBody = await response.blob();

      // 拡張子の判定
      const mimeType = fileBody.type; // image/png など
      const ext = mimeType.split("/")[1] || "png";
      // ファイル名をランダム生成 (衝突防止)
      fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      // Supabase Storageへのアップロード
      const filePath = `${projectId}/${fileName}`;
      const { error } = await supabase.storage
        .from("project-assets")
        .upload(filePath, fileBody, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) throw error;

      // Public URLの取得
      const { data: publicUrlData } = supabase.storage
        .from("project-assets")
        .getPublicUrl(filePath);

      return publicUrlData.publicUrl;

    } catch (e) {
      console.error("Asset upload failed:", e, assetSrc);
      // エラー時は元のパスを返して、少なくともリンク切れ状態で公開処理を続行させるか、エラーにするか
      // ここでは安全のため元のパスを返します
      return assetSrc;
    }
  };

  const handlePublish = async () => {
    if (!projectId) {
      setError("プロジェクトIDが見つかりません。");
      return;
    }

    setIsPublishing(true);
    setPublishStep("assets");
    setProgress(0);
    setError(null);

    try {
      // 1. 公開用のプロジェクトデータを構築
      const publishData: ProjectData = {
        projectName: projectMeta?.name || "Untitled",
        pages: JSON.parse(JSON.stringify(pages)),
        pageOrder: [...pageOrder],
        variables: { ...variables },
        cloud_id: projectMeta?.cloud_id,
      };

      // 2. アップロード対象のリストアップ
      const itemsToProcess: { pageId: string; itemIndex: number; item: PlacedItemType }[] = [];

      Object.keys(publishData.pages).forEach((pageId) => {
        const page = publishData.pages[pageId];
        page.placedItems.forEach((item, index) => {
          if (item.type === "image" && item.data.src) {
            itemsToProcess.push({ pageId, itemIndex: index, item });
          }
        });
      });

      const pagesToProcess: { pageId: string; bgSrc: string }[] = [];
      Object.keys(publishData.pages).forEach((pageId) => {
        const page = publishData.pages[pageId];
        if (page.backgroundImage?.src) {
          pagesToProcess.push({ pageId, bgSrc: page.backgroundImage.src });
        }
      });

      const totalAssets = itemsToProcess.length + pagesToProcess.length;
      let processedCount = 0;

      // 3. 順次アップロード
      for (const entry of itemsToProcess) {
        const { item } = entry;
        if (item.data.src) {
          const newUrl = await uploadAsset(item.data.src, projectId);
          item.data.src = newUrl; // URLをSupabaseのものに置換
        }
        processedCount++;
        setProgress(totalAssets > 0 ? Math.round((processedCount / totalAssets) * 100) : 100);
      }

      for (const entry of pagesToProcess) {
        const { pageId, bgSrc } = entry;
        const newUrl = await uploadAsset(bgSrc, projectId);
        if (publishData.pages[pageId].backgroundImage) {
          publishData.pages[pageId].backgroundImage!.src = newUrl;
        }
        processedCount++;
        setProgress(totalAssets > 0 ? Math.round((processedCount / totalAssets) * 100) : 100);
      }

      setPublishStep("saving");

      // 4. Supabaseへ公開データを保存
      const viewerBaseUrl = import.meta.env.VITE_VIEWER_URL || `${window.location.origin}/viewer.html`;
      // ローカル開発時は localhost:5173/viewer.html になるが、
      // 本番(Vercel等)に上げた場合はそのURLにする必要があるため、後で環境変数などで調整可能にします。
      // いったん動的に生成されるURLを使用します。

      const publicUrl = `${viewerBaseUrl}?project_id=${projectId}`;

      const { error: dbError } = await supabase
        .from("projects")
        .update({
          published_content: publishData,
          is_published: true,
          published_url: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", projectId);

      if (dbError) throw dbError;

      setPublishedUrl(publicUrl);

      // 埋め込み用コードの生成
      const code = `<iframe
  src="${publicUrl}"
  width="100%"
  height="600"
  style="border: none; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);"
  allow="clipboard-write"
  loading="lazy"
></iframe>`;
      setEmbedCode(code);

      setPublishStep("done");

      // ストア更新
      if (projectMeta) {
        useProjectStore.setState({
          projectMeta: {
            ...projectMeta,
            is_published: true,
            published_url: publicUrl
          }
        });
      }

    } catch (err: any) {
      console.error("Publish Error:", err);
      setError(err.message || "公開中にエラーが発生しました。");
      setPublishStep("error");
    } finally {
      setIsPublishing(false);
    }
  };

  const copyEmbedCode = () => {
    if (embedCode) {
      navigator.clipboard.writeText(embedCode);
      alert("埋め込みコードをコピーしました！");
    }
  };

  return (
    <div className="publish-modal-overlay">
      <div className="publish-modal-content">
        <div className="publish-modal-header">
          <h2>プロジェクトを公開</h2>
          {!isPublishing && publishStep !== "done" && (
            <button className="close-button" onClick={onClose}>
              ×
            </button>
          )}
        </div>

        <div className="publish-modal-body">
          {error && (
            <div className="error-message">
              <p>エラーが発生しました:</p>
              <code>{error}</code>
            </div>
          )}

          {publishStep === "" && !error && (
            <div className="publish-confirm">
              <p>プロジェクトをクラウドに公開し、埋め込み用コードを発行します。</p>
              <div className="publish-info">
                <ul>
                  <li>画像アセットはクラウド(Supabase)にアップロードされます。</li>
                  <li>編集中のデータはローカルに残ります。</li>
                </ul>
              </div>
              <div className="action-buttons">
                <button className="cancel-btn" onClick={onClose}>キャンセル</button>
                <button className="publish-btn" onClick={handlePublish}>
                  公開する
                </button>
              </div>
            </div>
          )}

          {(publishStep === "assets" || publishStep === "saving") && (
            <div className="publishing-progress">
              <div className="spinner"></div>
              <p>
                {publishStep === "assets" ? "アセットをアップロード中..." : "クラウドへ保存中..."}
              </p>
              <div className="progress-bar-container">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <span className="progress-text">{progress}%</span>
            </div>
          )}

          {publishStep === "done" && (
            <div className="publish-success">
              <div className="success-icon">🎉</div>
              <h3>公開準備が完了しました</h3>
              <p>以下のコードをWebサイトのHTMLに貼り付けてください。</p>

              <div className="embed-code-container">
                <textarea
                  readOnly
                  value={embedCode}
                  onClick={(e) => e.currentTarget.select()}
                />
                <button className="copy-btn" onClick={copyEmbedCode}>
                  コードをコピー
                </button>
              </div>

              <div className="preview-link">
                <a
                  href={publishedUrl || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  プレビューページを開く
                </a>
              </div>

              <div className="publish-actions">
                <button className="close-btn" onClick={onClose}>
                  閉じる
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublishModal;