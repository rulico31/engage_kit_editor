// src/components/PublishModal.tsx

import React, { useState } from "react";
import { useProjectStore } from "../stores/useProjectStore";
import { usePageStore } from "../stores/usePageStore";
import { supabase } from "../lib/supabaseClient";
import { DataMinifier } from "../lib/DataMinifier";
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

  const { projectMeta, updateCloudId, saveProject } = useProjectStore((state) => ({
    projectMeta: state.projectMeta,
    updateCloudId: state.updateCloudId,
    saveProject: state.saveProject,
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

      // 前提: assetSrc が blob: か data: の場合、fetch(assetSrc) で直接 Blob を取得できる。
      // Canvas経由の再描画は非常に重いため、必要な場合に限定する。
      if (assetSrc.startsWith("blob:") || assetSrc.startsWith("data:")) {
        const res = await fetch(assetSrc);
        fileBody = await res.blob();
      } else {
        // file:// や通常のパスの場合
        let fetchUrl = assetSrc;

        // Electron環境でローカルパス(絶対パス)がそのまま渡ってきた場合の補正
        if (!assetSrc.startsWith("http")) {
          if (!assetSrc.startsWith("file://") && !assetSrc.startsWith("engage://")) {
            // C:/Users/... のようなパスに file:// を付与
            fetchUrl = `file://${assetSrc}`;
          }
        }

        // ★ ローカルファイルを fetch で取得 (webSecurity: false なので可能)
        const response = await fetch(fetchUrl);
        if (!response.ok) throw new Error(`Failed to load local file: ${fetchUrl}`);

        fileBody = await response.blob();
      }

      // 拡張子の判定
      const mimeType = fileBody.type; // image/png など
      const ext = mimeType.split("/")[1] || "png";
      // ファイル名をランダム生成 (衝突防止)
      fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      // Supabase Storageへのアップロード
      const filePath = `${projectId}/${fileName}`;

      console.log('📤 ストレージアップロード開始:', {
        filePath,
        fileSize: fileBody.size,
        mimeType: fileBody.type
      });

      const { data, error } = await supabase.storage
        .from("project-assets")
        .upload(filePath, fileBody, {
          cacheControl: "3600",
          upsert: false,
          contentType: fileBody.type || 'image/png',
        });

      if (error) {
        console.error('❌ ストレージアップロードエラー:', {
          error,
          filePath,
          errorMessage: error.message,
          errorDetails: error
        });
        throw error;
      }

      console.log('✅ ストレージアップロード成功:', { filePath, data });

      // Public URLの取得
      const { data: publicUrlData } = supabase.storage
        .from("project-assets")
        .getPublicUrl(filePath);

      console.log('🔗 Public URL取得:', publicUrlData.publicUrl);

      return publicUrlData.publicUrl;

    } catch (e: any) {
      console.error("❌ Asset upload failed:", {
        error: e,
        message: e?.message,
        assetSrc: assetSrc.substring(0, 100) + '...',
        stack: e?.stack
      });
      // エラーを投げて公開を中断
      throw new Error(`画像のアップロードに失敗しました: ${e?.message || e}`);
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

    // ★ Local ID check & Auto-Link logic
    let targetProjectId = projectId;

    try {
      if (projectId.startsWith("local-")) {
        if (projectMeta?.cloud_id) {
          targetProjectId = projectMeta.cloud_id;
        } else {
          // クラウドプロジェクトが存在しないため、新規作成してリンクする
          setPublishStep("saving"); // "クラウドへ保存中..." の表示を利用

          const initialData: ProjectData = {
            projectName: projectMeta?.name || "Untitled",
            pages: JSON.parse(JSON.stringify(pages)),
            pageOrder: [...pageOrder],
            variables: { ...variables },
          };

          const { data: newProject, error: createError } = await supabase
            .from('projects')
            .insert({
              name: projectMeta?.name || "Untitled",
              data: initialData
            })
            .select('id')
            .single();

          if (createError) throw createError;
          if (!newProject) throw new Error("クラウドプロジェクトの作成に失敗しました。");

          targetProjectId = newProject.id;

          // ローカルストアとファイルを更新
          updateCloudId(targetProjectId);
          await saveProject(); // cloud_idを永続化

          // ステップ表示を戻す
          setPublishStep("assets");
        }
      }

      // 1. 公開用のプロジェクトデータを構築
      const publishData: ProjectData = {
        projectName: projectMeta?.name || "Untitled",
        pages: JSON.parse(JSON.stringify(pages)),
        pageOrder: [...pageOrder],
        variables: { ...variables },
        cloud_id: targetProjectId, // 確実にcloud_idを入れる
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

      // 3. 並列アップロード (最大同時実行数を制限するための簡易実装)
      const CONCURRENCY_LIMIT = 5;
      const allTasks = [
        ...itemsToProcess.map(entry => async () => {
          if (entry.item.data.src) {
            const newUrl = await uploadAsset(entry.item.data.src, targetProjectId);
            entry.item.data.src = newUrl;
          }
        }),
        ...pagesToProcess.map(entry => async () => {
          const newUrl = await uploadAsset(entry.bgSrc, targetProjectId);
          if (publishData.pages[entry.pageId].backgroundImage) {
            publishData.pages[entry.pageId].backgroundImage!.src = newUrl;
          }
        })
      ];

      // チャンクに分けて実行
      for (let i = 0; i < allTasks.length; i += CONCURRENCY_LIMIT) {
        const chunk = allTasks.slice(i, i + CONCURRENCY_LIMIT);
        await Promise.all(chunk.map(task => task().then(() => {
          processedCount++;
          setProgress(totalAssets > 0 ? Math.round((processedCount / totalAssets) * 100) : 100);
        })));
      }

      setPublishStep("saving");

      // 4. Supabaseへ公開データを保存
      const minifiedData = DataMinifier.minifyForPublish(publishData);
      
      const viewerBaseUrl = import.meta.env.VITE_VIEWER_URL || `${window.location.origin}/viewer.html`;
      // ローカル開発時は localhost:5173/viewer.html になるが、
      // 本番(Vercel等)に上げた場合はそのURLにする必要があるため、後で環境変数などで調整可能にします。
      // いったん動的に生成されるURLを使用します。

      // Use targetProjectId for the public URL parameter
      const publicUrl = `${viewerBaseUrl}?project_id=${targetProjectId}`;

      const { error: dbError } = await supabase
        .from("projects")
        .update({
          published_content: minifiedData,
          is_published: true,
          published_url: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", targetProjectId); // Use targetProjectId for the DB update

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