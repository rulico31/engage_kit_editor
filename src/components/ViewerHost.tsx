import React, { useEffect, useState, useRef, useMemo } from "react";
import { supabase } from "../lib/supabaseClient";
import { usePreviewStore } from "../stores/usePreviewStore";
import { usePageStore } from "../stores/usePageStore";
import { useProjectStore } from "../stores/useProjectStore";
import PreviewHost from "./PreviewHost";
import type { ProjectData } from "../types";
import "./Artboard.css";
import { logAnalyticsEvent } from "../lib/analytics";
import { ViewerErrorBoundary } from "./ViewerErrorBoundary";
import { initializeUTMTracking } from "../lib/UTMTracker";
import { initializeDeviceTracking } from "../lib/DeviceDetector";

interface ViewerHostProps {
  projectId: string;
}

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

  // PC基準の固定幅
  const FIXED_WIDTH = 1000;

  const [scale, setScale] = useState(1);

  // --- B2B Analytics Refs ---
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const maxScrollDepthRef = useRef(0);
  const readTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastInteractedItemRef = useRef<{ id: string, type: string, timestamp: number } | null>(null);
  const loggedThresholdsRef = useRef<Set<number>>(new Set());

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

  // コンテンツの「本当の高さ」を自動計算
  const contentHeight = useMemo(() => {
    if (!placedItems || placedItems.length === 0) return 700; // アイテムがない時のデフォルト

    // すべてのアイテムの中で「一番下のY座標」を探す
    const bottomY = Math.max(...placedItems.map(item => item.y + item.height));

    // 余白バッファを完全に削除 (bottomYのみ)
    // 最低でも100pxは確保
    return Math.max(bottomY, 100);
  }, [placedItems]);

  // UTMパラメータとデバイス情報の初期化
  useEffect(() => {
    // UTMパラメータ取得・保存（初回アクセス時のみ）
    const utmData = initializeUTMTracking();
    if (utmData) {
      console.log('📊 UTM Parameters captured:', utmData);
    }

    // デバイス情報取得・保存
    const deviceInfo = initializeDeviceTracking();
    console.log('📱 Device Info captured:', deviceInfo);
  }, []); // 1回のみ実行

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

  // スケール計算ロジック
  useEffect(() => {
    const handleResize = () => {
      const viewportWidth = window.innerWidth;
      const newScale = Math.min(viewportWidth / FIXED_WIDTH, 1);
      setScale(newScale);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- B2B Analytics Logic ---

  // 1. Scroll Depth & Read Content
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      if (scrollHeight <= clientHeight) return;

      // Scroll Depth (0-100)
      const scrollPercent = Math.round(((scrollTop + clientHeight) / scrollHeight) * 100);

      if (scrollPercent > maxScrollDepthRef.current) {
        maxScrollDepthRef.current = scrollPercent;

        // Thresholds: 25, 50, 75, 90
        [25, 50, 75, 90].forEach(threshold => {
          if (scrollPercent >= threshold && !loggedThresholdsRef.current.has(threshold)) {
            loggedThresholdsRef.current.add(threshold);
            logAnalyticsEvent('scroll_depth', {
              metadata: { depth: threshold, percent: scrollPercent }
            }, projectId);
          }
        });
      }

      // Read Content (Stop for > 3s)
      if (readTimerRef.current) clearTimeout(readTimerRef.current);
      readTimerRef.current = setTimeout(() => {
        // Calculate logical position (0.0 - 1.0)
        const positionRatio = scrollTop / (scrollHeight - clientHeight);
        logAnalyticsEvent('read_content', {
          metadata: {
            position_ratio: Math.round(positionRatio * 100) / 100,
            duration_ms: 3000
          }
        }, projectId);
      }, 3000);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (readTimerRef.current) clearTimeout(readTimerRef.current);
    };
  }, [projectId]);

  // 2. Exit Intent (True Exit)
  useEffect(() => {
    const handleBeforeUnload = () => {
      const lastItem = lastInteractedItemRef.current;
      // 最後の操作から10秒以内なら「その操作で離脱した」とみなす
      if (lastItem && (Date.now() - lastItem.timestamp < 10000)) {
        // Note: beforeunloadでの非同期通信は保証されないため、navigator.sendBeaconがあれば使う
        // logAnalyticsEvent内部実装に任せるが、ここではベストエフォート
        const payload = {
          nodeId: lastItem.id,
          nodeType: lastItem.type,
          metadata: { exit_type: 'window_close' }
        };
        // 同期的に送信できないため、sendBeacon推奨だが、簡易的に呼び出す
        logAnalyticsEvent('exit_intent', payload, projectId);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [projectId]);

  // 3. User Interaction Tracking (Capture Phase)
  // onClickCaptureでページ内のクリックを監視し、最後に触ったアイテムを記録
  const handleGlobalClickCapture = (e: React.MouseEvent) => {
    // data-node-id 属性を持つ要素を探す (PreviewItemなどで付与されていると仮定、または付与する必要あり)
    // 現状はDOM構造に依存するため、簡易的にターゲット情報を保存
    const target = e.target as HTMLElement;
    // もし要素にIDがあれば記録
    // 実際のアイテムIDを拾うには PreviewItem 側で data-id をつけるのがベストだが
    // ここでは座標やクラス名などをヒントにするか、PreviewStateの更新を監視する方が正確かもしれない
    // いったん「最後にクリックが発生した」事実のみ記録
    lastInteractedItemRef.current = {
      id: target.id || 'unknown',
      type: target.tagName,
      timestamp: Date.now()
    };
  };

  // 計算した高さをスケールに合わせて適用
  const wrapperHeight = contentHeight * scale;

  // iframeの高さを自動調整するためのメッセージ送信
  useEffect(() => {
    if (wrapperHeight > 0) {
      window.parent.postMessage({
        type: 'ENGAGE_KIT_RESIZE',
        height: wrapperHeight
      }, '*');
    }
  }, [wrapperHeight]);

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
    overflowX: "hidden",
    overflowY: "auto",
    position: "relative",
    backgroundImage: backgroundImage?.src ? `url(${backgroundImage.src})` : undefined,
    backgroundSize: backgroundImage?.displayMode === 'tile' ? 'auto' : (backgroundImage?.displayMode || 'cover'),
    backgroundPosition: backgroundImage?.position || 'center center',
    backgroundRepeat: backgroundImage?.displayMode === 'tile' ? 'repeat' : 'no-repeat',
  };

  return (
    <div
      ref={scrollContainerRef}
      style={backgroundStyle}
      onClickCapture={handleGlobalClickCapture}
    >
      <div style={{
        width: "100%",
        minHeight: "100%",
        position: "relative",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        paddingTop: "0px", // 余白削除
        paddingBottom: "0px" // 余白削除
      }}>

        {/* コンテンツラッパー: 自動計算された高さを使用 */}
        <div style={{
          width: `${FIXED_WIDTH * scale}px`,
          height: `${wrapperHeight}px`,
          position: "relative",
          overflow: "hidden",
        }}>

          {/* 中身: 自動計算された contentHeight を使用 */}
          <div style={{
            width: `${FIXED_WIDTH}px`,
            height: `${contentHeight}px`,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            position: "absolute",
            top: 0,
            left: 0
          }}>

            <ViewerErrorBoundary>
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