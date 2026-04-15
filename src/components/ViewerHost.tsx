import React, { useEffect, useState, useMemo, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import { usePreviewStore } from "../stores/usePreviewStore";
import { usePageStore } from "../stores/usePageStore";
import PreviewHost from "./PreviewHost";
import type { ProjectData, PlacedItemType } from "../types";
import "./Artboard.css";
import { logAnalyticsEvent } from "../lib/analytics";
import { ViewerErrorBoundary } from "./ViewerErrorBoundary";
import { initializeUTMTracking } from "../lib/UTMTracker";
import { initializeDeviceTracking, getDeviceInfo } from "../lib/DeviceDetector";
import { useActionAnalytics } from "../hooks/useActionAnalytics";

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
      pointerEvents: 'none',
      userSelect: 'none',
    }}
  >
    <span style={{ opacity: 0.7 }}>Powered by</span>
    <span style={{ fontWeight: 600, color: '#2563eb' }}>EngageKit</span>
  </div>
);

const ViewerHost: React.FC<ViewerHostProps> = ({ projectId }) => {
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // PV重複防止用のRef（React Strict Mode対策 & ページ遷移追跡）
  const lastLoggedPageId = useRef<string | null>(null);

  // Store actions
  const loadFromData = usePageStore((state) => state.loadFromData);
  const setPreviewState = usePreviewStore((state) => state.setPreviewState);
  const previewState = usePreviewStore((state) => state.previewState);
  const currentHistoryIndex = usePreviewStore((state) => state.currentHistoryIndex);

  console.log('[ViewerHost] Top-Level Log -> currentHistoryIndex:', currentHistoryIndex);

  // Store data
  const pages = usePageStore((state) => state.pages);

  // Logic
  // ノードごとのロジックマップを作成 (NodeExecutor等で使用)
  const allItemLogics = useMemo(() => {
    // 実際の実装では、pages から nodes/edges を抽出してマップ化する
    // 簡易的に全ページのノードを集約
    const logics: Record<string, any> = {};
    // ...ロジック抽出処理があればここに記述
    return logics;
  }, [pages]);

  // 初期化: Supabaseからプロジェクトデータを取得
  useEffect(() => {
    const fetchProject = async () => {
      try {
        console.log('[ViewerHost] Starting fetch for projectId:', projectId);
        setLoading(true);
        // 公開プロジェクトの取得
        // RLSポリシーにより、公開プロジェクトのみ取得可能である前提
        const { data, error } = await supabase
          .from("projects")
          .select("*")
          .eq("id", projectId)
          .single();

        console.log('[ViewerHost] Supabase response:', { data, error });

        if (error) throw error;
        if (!data) throw new Error("Project not found");

        // Supabaseのprojectsテーブルから取得したデータ
        // Viewerでは published_content を使用（公開済みコンテンツ）
        const rawData = data as any;
        setProjectData(rawData);
        console.log('[ViewerHost] Raw data:', rawData);

        // published_content から pages と pageOrder を取得
        // データはすでに { pages: Record<string, PageData>, pageOrder: string[] } 形式
        const publishedContent = rawData.published_content;
        console.log('[ViewerHost] Published content:', publishedContent);

        if (!publishedContent) {
          throw new Error("Project is not published");
        }

        const pagesRecord = publishedContent.pages || {};
        const pageOrder = publishedContent.pageOrder || [];
        console.log('[ViewerHost] Pages record:', pagesRecord);
        console.log('[ViewerHost] Page order:', pageOrder);

        // placedItems の position と size を正規化（x,y,width,height → position, size形式）
        const normalizedPages: Record<string, any> = {};
        Object.keys(pagesRecord).forEach(pageId => {
          const page = pagesRecord[pageId];
          normalizedPages[pageId] = {
            ...page,
            placedItems: (page.placedItems || []).map((item: any) => ({
              ...item,
              // Flatten position and size for PreviewItem compatibility
              x: item.x ?? item.position?.x ?? 0,
              y: item.y ?? item.position?.y ?? 0,
              width: item.width ?? item.size?.width ?? 200,
              height: item.height ?? item.size?.height ?? 50,
              // Also keep nested structure for compatibility
              position: item.position || { x: item.x || 0, y: item.y || 0 },
              size: item.size || { width: item.width || 200, height: item.height || 50 }
            }))
          };
        });
        console.log('[ViewerHost] Normalized pages:', normalizedPages);

        // ストアにデータをセット（loadFromDataを使用）
        console.log('[ViewerHost] Calling loadFromData...');
        loadFromData({
          pages: normalizedPages,
          pageOrder: pageOrder
        } as any);
        console.log('[ViewerHost] loadFromData complete');

        // 初期ページを取得してプレビュー状態を設定
        const firstPageId = pageOrder.length > 0 ? pageOrder[0] : null;
        console.log('[ViewerHost] First page ID:', firstPageId);

        if (firstPageId) {
          // デバイス判定（UserAgentベースの判定を優先）
          const deviceInfo = getDeviceInfo();
          const isActuallyMobile = deviceInfo.device_type === 'mobile';

          // 全アイテムの初期表示状態を作成
          const initialItemStates: Record<string, any> = {};
          Object.values(normalizedPages).forEach((page: any) => {
            (page.placedItems || []).forEach((item: any) => {
              // モバイルモード時はモバイル座標を優先
              const initialX = isActuallyMobile && item.mobileX !== undefined
                ? item.mobileX
                : (item.x ?? item.position?.x ?? 0);
              const initialY = isActuallyMobile && item.mobileY !== undefined
                ? item.mobileY
                : (item.y ?? item.position?.y ?? 0);

              initialItemStates[item.id] = {
                isVisible: item.data?.initialVisibility !== false,
                x: initialX,
                y: initialY,
                opacity: 1,
                scale: 1,
                rotation: 0,
                transition: null
              };
            });
          });
          console.log('[ViewerHost] Initial item states:', initialItemStates);

          setPreviewState({
            currentPageId: firstPageId,
            variables: {},
            history: [firstPageId],
            ...initialItemStates
          } as any);

          // 履歴インデックスとモバイル状態の初期化
          usePreviewStore.setState({
            navigationHistory: [{ pageId: firstPageId, visitedAt: Date.now() }],
            currentHistoryIndex: 0,
            isMobile: isActuallyMobile
          });

          // プロジェクトIDを明示的にセット
          if (projectId) {
            usePreviewStore.getState().setProjectId(projectId);
          }

          console.log('[ViewerHost] Preview state set with item visibility');
        }

        // UTM & Device Tracking Initialization
        initializeUTMTracking();
        initializeDeviceTracking();

        // IP Address Pre-fetch (リード送信時の遅延を防ぐ)
        const { prefetchIpAddress } = await import('../lib/IpAddressTracker');
        prefetchIpAddress();

        console.log('[ViewerHost] Initialization complete!');

      } catch (err: any) {
        console.error("[ViewerHost] Error fetching project:", err);
        setError(err.message || "Failed to load content");
      } finally {
        setLoading(false);
        console.log('[ViewerHost] Loading set to false');
      }
    };

    if (projectId) {
      fetchProject();
    }
  }, [projectId, loadFromData, setPreviewState]);

  // Page View Logging Effect (Tracks navigation)
  useEffect(() => {
    const currentPageId = previewState.currentPageId;
    if (!currentPageId || !projectId) return;

    // Prevent duplicate logs for the same page (and Strict Mode double-fire)
    if (lastLoggedPageId.current === currentPageId) return;

    const pageName = pages[currentPageId]?.name || 'Unknown Page';
    // Ensure accurate device info is available
    const deviceInfo = initializeDeviceTracking();

    logAnalyticsEvent('page_view', {
      pageId: currentPageId,
      pageName: pageName,
      device_info: deviceInfo
    }, projectId);

    console.log('[ViewerHost] page_view logged', { pageId: currentPageId, pageName });
    lastLoggedPageId.current = currentPageId;
  }, [previewState.currentPageId, projectId, pages]);

  // ■ 行動分析監視ロジック (Smart Action Analytics)
  // usePreviewStore から現在のページ情報を取得
  const currentId = previewState.currentPageId;
  const currentName = currentId ? pages[currentId]?.name : null;
  useActionAnalytics(projectId, true, currentId, currentName);


  // レイアウト計算
  const FIXED_WIDTH = 1000;
  const MOBILE_WIDTH = 375;
  const MOBILE_BREAKPOINT = 480; // 480px未満をスマホとして扱う（タブレットはPC版縮小表示）
  const FIXED_HEIGHT = 700; // 基準の高さ

  const [scale, setScale] = useState(1);
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const windowWidth = window.innerWidth;
      const deviceInfo = getDeviceInfo();

      // UserAgent判定または画面幅判定
      if (deviceInfo.device_type === 'mobile' || windowWidth < MOBILE_BREAKPOINT) {
        // スマホ：スケーリングせず375px等倍表示
        setIsMobileDevice(true);
        setScale(1);
        // store側のisMobileも同期させる（再表示時などのため）
        if (!usePreviewStore.getState().isMobile) {
          usePreviewStore.setState({ isMobile: true });
        }
      } else {
        // PC・タブレット：1000pxより小さい場合のみ縮小（従来通り）
        setIsMobileDevice(false);
        const newScale = windowWidth < FIXED_WIDTH ? windowWidth / FIXED_WIDTH : 1;
        setScale(newScale);
        if (usePreviewStore.getState().isMobile) {
          usePreviewStore.setState({ isMobile: false });
        }
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // 初期実行
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // テーマ設定の取得 (published_content から)
  // @ts-ignore - projectData は Supabase の行データを含んでいるため
  const theme = projectData?.published_content?.theme;

  // 現在のページの背景設定を取得
  const currentPage = previewState.currentPageId ? pages[previewState.currentPageId] : null;

  // テーマ変数のCSSプロパティ生成
  const themeStyles = useMemo(() => {
    const defaults = {
      fontFamily: 'system-ui',
      accentColor: '#3b82f6',
      backgroundColor: '#ffffff',
      borderRadius: 8
    };
    const current = { ...defaults, ...theme };
    return {
      '--theme-font-family': current.fontFamily,
      '--page-font-family': currentPage?.fontFamily || current.fontFamily,
      '--theme-accent-color': current.accentColor,
      '--theme-background-color': current.backgroundColor,
      '--theme-border-radius': `${current.borderRadius}px`,
    } as React.CSSProperties;
  }, [theme, currentPage?.fontFamily]);

  const backgroundColor = currentPage?.backgroundColor || '#ffffff';
  const backgroundImage = currentPage?.backgroundImage;

  // 背景画像のスタイル
  const backgroundStyle: React.CSSProperties = {
    ...themeStyles, // テーマ変数を追加
    backgroundColor: backgroundColor,
    backgroundImage: backgroundImage?.src ? `url(${backgroundImage.src})` : 'none',
    backgroundSize: backgroundImage?.displayMode === 'cover' ? 'cover' :
      backgroundImage?.displayMode === 'contain' ? 'contain' : 'auto',
    backgroundPosition: 'center center',
    backgroundRepeat: backgroundImage?.displayMode === 'tile' ? 'repeat' : 'no-repeat',
  };

  // コンテンツの高さ計算 (ページ内の最下部アイテムを探す)
  // フックの順序を守るため、条件分岐（早期リターン）の前に配置
  const currentPageData = previewState.currentPageId ? pages[previewState.currentPageId] : null;
  const placedItems = currentPageData?.placedItems || [];
  const currentPageItems = placedItems;

  const maxY = isMobileDevice
    ? currentPageItems.reduce((max: number, item: PlacedItemType) => {
      const mobileY = item.mobileY ?? item.position.y * 0.375;
      const mobileH = item.mobileHeight ?? item.size.height * 0.45;
      return Math.max(max, mobileY + mobileH);
    }, FIXED_HEIGHT)
    : currentPageItems.reduce((max: number, item: PlacedItemType) => Math.max(max, item.position.y + item.size.height), FIXED_HEIGHT);
  const contentHeight = Math.max(FIXED_HEIGHT, maxY + 50); // 余白

  // 親サイトへの高さ通知
  useEffect(() => {
    // iframe内での動作確認 (親ウィンドウが存在し、かつデータロードが完了している場合のみ)
    if (window.parent !== window && !loading && projectData) {
      const finalHeight = contentHeight * (isMobileDevice ? 1 : scale);
      window.parent.postMessage({
        type: 'ENGAGE_KIT_RESIZE',
        height: Math.ceil(finalHeight),
        projectId: projectId
      }, '*');
      console.log('[ViewerHost] Sent resize message to parent:', Math.ceil(finalHeight));
    }
  }, [contentHeight, scale, isMobileDevice, projectId, loading, !!projectData]);

  // デバッグログ: レンダリング状態
  console.log('[ViewerHost] Render state:', { loading, error, projectData: !!projectData, previewState, currentPage, pages });

  if (loading) {
    console.log('[ViewerHost] Rendering: Loading...');
    return <div className="viewer-loading">Loading...</div>;
  }
  if (error) {
    console.log('[ViewerHost] Rendering: Error', error);
    return <div className="viewer-error">Error: {error}</div>;
  }
  if (!projectData) {
    console.log('[ViewerHost] Rendering: No Data');
    return <div className="viewer-error">No Data</div>;
  }

  console.log('[ViewerHost] Rendering content:', { currentPageData, placedItems: placedItems.length, currentPageItems });

  console.log('[ViewerHost] About to render main content with', placedItems.length, 'items');

  return (
    <div style={{ ...backgroundStyle, height: '100vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <div style={{
        width: "100%",
        minHeight: "100%",
        position: "relative",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        paddingTop: "0px",
        paddingBottom: "0px"
      }}>

        {/* コンテンツラッパー: 自動計算された高さを使用 */}
        <div style={{
          width: isMobileDevice ? `${MOBILE_WIDTH}px` : `${FIXED_WIDTH * scale}px`,
          height: `${contentHeight * (isMobileDevice ? 1 : scale)}px`,
          position: "relative",
          overflow: "hidden", // はみ出し防止
        }}>

          {/* 中身: scale変換（モバイル時はスケールなし） */}
          <div style={{
            width: isMobileDevice ? `${MOBILE_WIDTH}px` : `${FIXED_WIDTH}px`,
            height: `${contentHeight}px`,
            transform: isMobileDevice ? 'none' : `scale(${scale})`,
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
                isMobile={isMobileDevice}
                projectId={projectId || undefined} // Pass projectId
              />
            </ViewerErrorBoundary>

          </div>
        </div>
      </div>

      {/* 無料プラン等の場合のみ表示 (ロジック実装時は条件分岐) */}
      <PoweredByBadge />

      {/* Debug Info (To be removed) */}
      <div style={{ position: 'fixed', bottom: 40, right: 10, fontSize: 10, color: 'red', zIndex: 10000, background: 'white' }}>
        Idx: {currentHistoryIndex}
      </div>

      {/* 戻るボタン (履歴がある場合のみ表示) */}
      {currentHistoryIndex > 0 && (
        <button
          onClick={() => usePreviewStore.getState().goBack()}
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '20px',
            zIndex: 9999,
            padding: '10px 20px',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid #e4e4e7',
            borderRadius: '30px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: 600,
            color: '#18181b',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            backdropFilter: 'blur(8px)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.12)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span style={{ paddingTop: '1px' }}>戻る</span>
        </button>
      )}
    </div>
  );
};

export default ViewerHost;