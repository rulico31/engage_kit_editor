import React, { useEffect, useState, useRef } from "react";
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

// PoweredByBadge: 無料プランなどで表示する透かし
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
      pointerEvents: 'none'
    }}
  >
    <span style={{ fontWeight: 500 }}>Powered by</span>
    <span style={{ fontWeight: 700, color: '#3b82f6' }}>EngageKit</span>
  </div>
);

const ViewerHost: React.FC<ViewerHostProps> = ({ projectId }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWatermark] = useState(true);
  const hasLogged = useRef(false);

  // ★ PC基準の固定サイズ (このサイズを基準にスマホ用に縮小します)
  const FIXED_WIDTH = 1000;
  const FIXED_HEIGHT = 700;

  const [scale, setScale] = useState(1);

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

        const { data, error } = await supabase
          .from("projects")
          .select("published_content, is_published")
          .eq("id", projectId)
          .single();

        if (error) throw error;
        if (!data) throw new Error("プロジェクトが見つかりません");

        if (!data.is_published || !data.published_content) {
          throw new Error("このプロジェクトは現在公開されていません。");
        }

        const projectData = data.published_content as ProjectData;

        // テーマ適用
        if (projectData.theme) {
          const root = document.documentElement;
          if (projectData.theme.fontFamily) root.style.setProperty('--theme-font-family', projectData.theme.fontFamily);
          if (projectData.theme.accentColor) root.style.setProperty('--theme-accent-color', projectData.theme.accentColor);
          if (projectData.theme.backgroundColor) root.style.setProperty('--theme-background-color', projectData.theme.backgroundColor);
          if (projectData.theme.borderRadius !== undefined) root.style.setProperty('--theme-border-radius', `${projectData.theme.borderRadius}px`);
        }

        loadFromData(projectData);

        setTimeout(() => {
          initPreview();
          setIsLoaded(true);
          logAnalyticsEvent('page_view', {
            metadata: { referrer: document.referrer }
          }, projectId);
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

  // ★ スケール計算ロジック (幅合わせミニチュア化)
  useEffect(() => {
    const handleResize = () => {
      const viewportWidth = window.innerWidth;
      // 画面幅 ÷ 1000px で縮小率を決定 (最大1倍)
      const newScale = Math.min(viewportWidth / FIXED_WIDTH, 1);
      setScale(newScale);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (error) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", color: "#ff6b6b", backgroundColor: "#111", flexDirection: "column", gap: "1rem" }}>
        <p>{error}</p>
        <p style={{ fontSize: "0.8rem", color: "#666" }}>Project ID: {projectId}</p>
      </div>
    );
  }

  if (!isLoaded) {
    return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", color: "#888", backgroundColor: "#111" }}>Loading...</div>;
  }

  const backgroundStyle: React.CSSProperties = {
    backgroundColor: backgroundColor || "#ffffff",
    width: "100vw",
    height: "100vh",
    overflowX: "hidden",
    overflowY: "auto",
    position: "relative",
    backgroundImage: backgroundImage?.src ? `url(${backgroundImage.src})` : undefined,
    backgroundSize: backgroundImage?.displayMode === 'tile' ? 'auto' : (backgroundImage?.displayMode || 'cover'),
    backgroundPosition: backgroundImage?.position || 'center center',
    backgroundRepeat: backgroundImage?.displayMode === 'tile' ? 'repeat' : 'no-repeat',
  };

  // ★ 縮小後の実質的な高さを計算
  const wrapperHeight = FIXED_HEIGHT * scale;

  return (
    <div style={backgroundStyle}>
      <div style={{
        width: "100%",
        minHeight: "100%",
        position: "relative",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        paddingTop: "20px",
        paddingBottom: "40px"
      }}>
        {/* コンテンツラッパー: 縮小後のサイズを確保して余白を消す */}
        <div style={{
          width: `${FIXED_WIDTH * scale}px`,
          height: `${wrapperHeight}px`,
          position: "relative",
          overflow: "hidden"
        }}>
          {/* 中身: scaleで縮小し、左上基準(top left)で配置 */}
          <div style={{
            width: `${FIXED_WIDTH}px`,
            height: `${FIXED_HEIGHT}px`,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            position: "absolute",
            top: 0,
            left: 0
          }}>
            <ViewerErrorBoundary>
              {/* isMobile={false} に固定してPCレイアウトを維持 */}
              <PreviewHost
                placedItems={placedItems}
                previewState={previewState}
                setPreviewState={setPreviewState}
                allItemLogics={allItemLogics}
                isMobile={false}
              />
            </ViewerErrorBoundary>
            {showWatermark && <PoweredByBadge />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewerHost;