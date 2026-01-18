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
import { initializeDeviceTracking } from "../lib/DeviceDetector";
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

  // PV重複防止用のRef（React Strict Mode対策）
  const hasLoggedPV = useRef(false);

  // Store actions
  const loadFromData = usePageStore((state) => state.loadFromData);
  const setPreviewState = usePreviewStore((state) => state.setPreviewState);
  const previewState = usePreviewStore((state) => state.previewState);

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
          // 全アイテムの初期表示状態を作成
          const initialItemStates: Record<string, { isVisible: boolean }> = {};
          Object.values(normalizedPages).forEach((page: any) => {
            (page.placedItems || []).forEach((item: any) => {
              initialItemStates[item.id] = { isVisible: true };
            });
          });
          console.log('[ViewerHost] Initial item states:', initialItemStates);

          setPreviewState({
            currentPageId: firstPageId,
            variables: {},
            history: [firstPageId],
            ...initialItemStates
          } as any);
          console.log('[ViewerHost] Preview state set with item visibility');
        }

        // UTM & Device Tracking Initialization
        initializeUTMTracking();
        const deviceInfo = initializeDeviceTracking();

        // PV計測 (device_info を含める) - 重複防止ガード
        if (!hasLoggedPV.current) {
          hasLoggedPV.current = true;
          logAnalyticsEvent('page_view', {
            pageId: firstPageId,
            device_info: deviceInfo
          }, projectId);
          console.log('[ViewerHost] page_view logged');
        } else {
          console.log('[ViewerHost] page_view skipped (already logged)');
        }

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

  // ■ 行動分析監視ロジック (Smart Action Analytics)
  useActionAnalytics(projectId, true);


  // レイアウト計算
  const FIXED_WIDTH = 1000;
  const FIXED_HEIGHT = 700; // 基準の高さ

  const [scale, setScale] = useState(1);

  useEffect(() => {
    const handleResize = () => {
      const windowWidth = window.innerWidth;
      // 1000pxより小さい場合のみ縮小
      const newScale = windowWidth < FIXED_WIDTH ? windowWidth / FIXED_WIDTH : 1;
      setScale(newScale);
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // 初期実行
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 現在のページの背景設定を取得
  const currentPage = previewState.currentPageId ? pages[previewState.currentPageId] : null;
  const backgroundColor = currentPage?.backgroundColor || '#ffffff';
  const backgroundImage = currentPage?.backgroundImage;

  // 背景画像のスタイル
  const backgroundStyle: React.CSSProperties = {
    backgroundColor: backgroundColor,
    backgroundImage: backgroundImage ? `url(${backgroundImage.url})` : 'none',
    backgroundSize: backgroundImage?.displayMode === 'cover' ? 'cover' :
      backgroundImage?.displayMode === 'contain' ? 'contain' : 'auto',
    backgroundPosition: 'center center',
    backgroundRepeat: backgroundImage?.displayMode === 'tile' ? 'repeat' : 'no-repeat',
  };

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

  // コンテンツの高さ計算 (ページ内の最下部アイテムを探す)
  const currentPageData = previewState.currentPageId ? pages[previewState.currentPageId] : null;
  const placedItems = currentPageData?.placedItems || [];
  const currentPageItems = placedItems;

  console.log('[ViewerHost] Rendering content:', { currentPageData, placedItems: placedItems.length, currentPageItems });

  const maxY = currentPageItems.reduce((max: number, item: PlacedItemType) => Math.max(max, item.position.y + item.size.height), FIXED_HEIGHT);
  const contentHeight = Math.max(FIXED_HEIGHT, maxY + 50); // 余白

  console.log('[ViewerHost] About to render main content with', placedItems.length, 'items');

  return (
    <div style={backgroundStyle}>
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
          width: `${FIXED_WIDTH * scale}px`,
          height: `${contentHeight * scale}px`, // スクロール対応のためwrapperHeightではなくコンテンツに合わせる
          position: "relative",
          overflow: "hidden", // はみ出し防止
        }}>

          {/* 中身: scale変換 */}
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

          </div>
        </div>
      </div>

      {/* 無料プラン等の場合のみ表示 (ロジック実装時は条件分岐) */}
      <PoweredByBadge />
    </div>
  );
};

export default ViewerHost;