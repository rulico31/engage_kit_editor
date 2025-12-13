// src/components/ViewerHost.tsx

import React, { useEffect, useState } from "react";
import { useProjectStore } from "../stores/useProjectStore";
import { usePreviewStore } from "../stores/usePreviewStore";
import { usePageStore } from "../stores/usePageStore";
import PreviewHost from "./PreviewHost";
import "./Artboard.css"; // デザイン用のCSSを流用
import { logAnalyticsEvent } from "../lib/analytics"; // ★ 追加: 分析ログ用

interface ViewerHostProps {
  projectId: string;
}

const ViewerHost: React.FC<ViewerHostProps> = ({ projectId }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false); // Moved to top

  // ストアのアクションを取得
  const loadProject = useProjectStore(state => state.loadProject);
  const initPreview = usePreviewStore(state => state.initPreview);

  // 描画に必要なデータをストアから取得
  const { placedItems, allItemLogics, backgroundColor, backgroundImage, mobileBackgroundImage } = usePageStore(state => {
    const page = state.selectedPageId ? state.pages[state.selectedPageId] : undefined;
    return {
      placedItems: page?.placedItems || [],
      allItemLogics: page?.allItemLogics || {},
      backgroundColor: page?.backgroundColor,
      backgroundImage: page?.backgroundImage,
      mobileBackgroundImage: page?.mobileBackgroundImage,
    };
  });

  const { previewState, setPreviewState } = usePreviewStore(state => ({
    previewState: state.previewState,
    setPreviewState: state.setPreviewState,
  }));

  // マウント時にプロジェクトをロードし、プレビューを開始する
  useEffect(() => {
    const fetchAndInit = async () => {
      try {
        // 1. データベースからプロジェクトをロード
        // (注: loadProjectは内部でEditorSettingsStoreを更新しますが、Viewerモードでは無視します)
        await loadProject(projectId);

        // 2. ロード完了後、プレビュー状態を初期化
        // (少し待ってデータがストアに反映されてから実行)
        setTimeout(() => {
          initPreview();
          setIsLoaded(true);

          // ★ 追加: PVとUUの計測開始
          // プロジェクトロードと初期化が完了した時点でカウントします
          logAnalyticsEvent('page_view', {
            metadata: { referrer: document.referrer }
          });

        }, 100);

      } catch (err) {
        console.error(err);
        setError("コンテンツの読み込みに失敗しました。");
      }
    };

    if (projectId) {
      fetchAndInit();
    }
  }, [projectId, loadProject, initPreview]);

  // リサイズイベントでモバイル判定 (Moved to top)
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 480);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Conditional returns MUST be after all hooks
  if (error) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        color: "#ff6b6b",
        backgroundColor: "#111"
      }}>
        {error}
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        color: "#888",
        backgroundColor: "#111"
      }}>
        Loading content...
      </div>
    );
  }

  // 自動スケーリング用の設定
  const ARTBOARD_WIDTH = 1920; // PCの標準アートボード幅
  const ARTBOARD_HEIGHT = 1080; // PCの標準アートボード高さ
  const scale = isMobile ? Math.min(
    window.innerWidth / ARTBOARD_WIDTH,
    window.innerHeight / ARTBOARD_HEIGHT
  ) : 1;

  // 背景スタイルの適用
  const currentBg = isMobile ? mobileBackgroundImage : backgroundImage;
  const backgroundStyle: React.CSSProperties = {
    backgroundColor: backgroundColor || "#ffffff", // デフォルト背景
    width: "100vw",
    height: "100vh",
    overflow: "hidden",
    position: "relative",
  };

  if (currentBg?.src) {
    backgroundStyle.backgroundImage = `url(${currentBg.src})`;
    backgroundStyle.backgroundPosition = currentBg.position || '50% 50%';
    backgroundStyle.backgroundSize = currentBg.size || 'cover';
    backgroundStyle.backgroundRepeat = 'no-repeat';
  }

  // コンテナスタイル（スケーリング適用）
  const containerStyle: React.CSSProperties = {
    width: `${ARTBOARD_WIDTH}px`,
    height: `${ARTBOARD_HEIGHT}px`,
    transform: `scale(${scale})`,
    transformOrigin: "top left",
    position: "absolute",
    top: 0,
    left: 0,
  };

  return (
    <div style={backgroundStyle}>
      <div style={containerStyle}>
        <PreviewHost
          placedItems={placedItems}
          previewState={previewState}
          setPreviewState={setPreviewState}
          allItemLogics={allItemLogics}
          isMobile={isMobile}
        />
      </div>
    </div>
  );
};

export default ViewerHost;