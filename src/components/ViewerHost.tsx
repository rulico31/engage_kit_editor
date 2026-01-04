// src/components/ViewerHost.tsx

import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { usePreviewStore } from "../stores/usePreviewStore";
import { usePageStore } from "../stores/usePageStore";
import { useProjectStore } from "../stores/useProjectStore";
import PreviewHost from "./PreviewHost";
import type { ProjectData } from "../types";
import "./Artboard.css";
import { logAnalyticsEvent } from "../lib/analytics";
import { ViewerErrorBoundary } from "./ViewerErrorBoundary";

interface ViewerHostProps {
  projectId: string;
}

// ★ Phase 4: Watermark Component
const PoweredByBadge: React.FC = () => (
  <div
    style={{
      position: 'fixed',
      bottom: '12px',
      right: '12px',
      backgroundColor: 'rgba(255, 255, 255, 0.85)',
      backdropFilter: 'blur(4px)',
      padding: '6px 10px',
      borderRadius: '6px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      zIndex: 9999,
      fontSize: '11px',
      color: '#444',
      fontFamily: 'sans-serif',
      transition: 'opacity 0.2s',
      border: '1px solid rgba(0,0,0,0.05)',
      userSelect: 'none',
      pointerEvents: 'none' // クリックを透過させる
    }}
  >
    <span style={{ fontWeight: 500 }}>Powered by</span>
    <span style={{ fontWeight: 700, color: '#3b82f6' }}>EngageKit</span>
  </div>
);

const ViewerHost: React.FC<ViewerHostProps> = ({ projectId }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showWatermark] = useState(true);
  // 二重送信防止（Strict Mode対策）
  const hasLogged = React.useRef(false);

  // ★ レスポンシブ対応: スケール状態とアートボードサイズ
  const [scale, setScale] = useState(1);
  const [artboardWidth, setArtboardWidth] = useState(1000); // デフォルトはデスクトップ
  const [artboardHeight, setArtboardHeight] = useState(700);

  const initPreview = usePreviewStore(state => state.initPreview);
  const loadFromData = usePageStore(state => state.loadFromData);

  const { placedItems, allItemLogics, backgroundColor, backgroundImage } = usePageStore(state => {
    const page = state.selectedPageId ? state.pages[state.selectedPageId] : undefined;
    return {
      placedItems: page?.placedItems || [],
      allItemLogics: page?.allItemLogics || {},
      backgroundColor: page?.backgroundColor,
      backgroundImage: page?.backgroundImage,
    };
  });

  const { previewState, setPreviewState } = usePreviewStore(state => ({
    previewState: state.previewState,
    setPreviewState: state.setPreviewState,
  }));

  useEffect(() => {
    const fetchAndInit = async () => {
      try {
        useProjectStore.setState({ currentProjectId: projectId });

        // 1. データベースからデータを取得
        // ★修正: 'published_content' を取得するように変更 (published_data -> published_content)
        const { data, error } = await supabase
          .from("projects")
          .select("published_content, is_published")
          .eq("id", projectId)
          .single();

        if (error) throw error;
        if (!data) throw new Error("プロジェクトが見つかりません");

        // 公開状態かつ公開データがある場合のみ表示
        // 下書きデータ ('data') へのフォールバックは廃止 (Safe Integrity)
        if (!data.is_published || !data.published_content) {
          throw new Error("このプロジェクトは現在公開されていません。");
        }

        const projectData = data.published_content as ProjectData;

        // ★ デバイスタイプに応じたアートボードサイズを設定
        // Artboard.tsx (L323-324) と同じ値を使用
        const isMobileProject = projectData.deviceType === 'mobile';
        const width = isMobileProject ? 375 : 1000;
        const height = isMobileProject ? 667 : 700;
        setArtboardWidth(width);
        setArtboardHeight(height);

        // ★ テーマをCSS変数として適用
        if (projectData.theme) {
          const root = document.documentElement;
          if (projectData.theme.fontFamily) {
            root.style.setProperty('--theme-font-family', projectData.theme.fontFamily);
          }
          if (projectData.theme.accentColor) {
            root.style.setProperty('--theme-accent-color', projectData.theme.accentColor);
          }
          if (projectData.theme.backgroundColor) {
            root.style.setProperty('--theme-background-color', projectData.theme.backgroundColor);
          }
          if (projectData.theme.borderRadius !== undefined) {
            root.style.setProperty('--theme-border-radius', `${projectData.theme.borderRadius}px`);
          }
        }

        if (!projectData) {
          throw new Error("表示できるコンテンツがありません");
        }

        loadFromData(projectData);

        setTimeout(() => {
          initPreview();
          setIsLoaded(true);

          logAnalyticsEvent('page_view', {
            metadata: { referrer: document.referrer }
          }, projectId); // ★修正: プロジェクトIDを明示的に渡す

        }, 50);

      } catch (err: any) {
        console.error(err);
        setError(err.message || "コンテンツの読み込みに失敗しました。");
      }
    };

    if (projectId && !hasLogged.current) {
      fetchAndInit();
      hasLogged.current = true;
    }
  }, [projectId, loadFromData, initPreview]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 480);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ★ レスポンシブ対応: 画面幅と高さに応じたスケール計算
  // プロジェクトのデバイスタイプに応じたアートボードサイズを使用
  useEffect(() => {
    const handleResize = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const targetWidth = artboardWidth; // プロジェクトのアートボード幅を使用
      const targetHeight = artboardHeight; // プロジェクトのアートボード高さを使用

      // 幅と高さの両方を考慮して、小さい方のスケールを採用（アートボード全体が収まるように）
      const scaleX = viewportWidth / targetWidth;
      const scaleY = viewportHeight / targetHeight;
      const newScale = Math.min(scaleX, scaleY, 1); // 最大1倍（拡大しない）

      setScale(newScale);
    };

    handleResize(); // 初回実行
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [artboardWidth, artboardHeight]); // artboardWidthとartboardHeightを依存配列に追加


  if (error) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        color: "#ff6b6b",
        backgroundColor: "#111",
        flexDirection: "column",
        gap: "1rem"
      }}>
        <p>{error}</p>
        <p style={{ fontSize: "0.8rem", color: "#666" }}>Project ID: {projectId}</p>
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

  const backgroundStyle: React.CSSProperties = {
    backgroundColor: backgroundColor || "#ffffff",
    width: "100vw",
    height: "100vh",
    overflow: "hidden",
    position: "relative",
    backgroundImage: backgroundImage?.src ? `url(${backgroundImage.src})` : undefined,
    backgroundSize: backgroundImage?.displayMode === 'tile' ? 'auto' : (backgroundImage?.displayMode || 'cover'),
    backgroundPosition: backgroundImage?.position || 'center center',
    backgroundRepeat: backgroundImage?.displayMode === 'tile' ? 'repeat' : 'no-repeat',
  };

  return (
    <div style={backgroundStyle}>
      <div style={{
        width: "100%",
        height: "100%",
        position: "relative",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        overflow: "auto"
      }}>
        {/* ★ レスポンシブ対応: transform: scale() でコンテンツを縮小 */}
        <div style={{
          width: `${artboardWidth}px`,
          height: `${artboardHeight}px`,
          transform: `scale(${scale})`,
          transformOrigin: "center center",
          position: "relative"
        }}>

          <ViewerErrorBoundary>
            <PreviewHost
              placedItems={placedItems}
              previewState={previewState}
              setPreviewState={setPreviewState}
              allItemLogics={allItemLogics}
              isMobile={isMobile}
            />
          </ViewerErrorBoundary>

          {showWatermark && <PoweredByBadge />}
        </div>
      </div>
    </div>
  );
};

export default ViewerHost;