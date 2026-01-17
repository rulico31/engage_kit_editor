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

  // Store actions
  const setPages = usePageStore((state) => state.setPages);
  const setPlacedItems = usePageStore((state) => state.setPlacedItems);
  const setPreviewState = usePreviewStore((state) => state.setPreviewState);
  const previewState = usePreviewStore((state) => state.previewState);
  const setProjectInfo = useProjectStore((state) => state.setProjectInfo);

  // Store data
  const pages = usePageStore((state) => state.pages);
  const placedItems = usePageStore((state) => state.placedItems);

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
        setLoading(true);
        // 公開プロジェクトの取得
        // RLSポリシーにより、公開プロジェクトのみ取得可能である前提
        const { data, error } = await supabase
          .from("projects")
          .select("*")
          .eq("id", projectId)
          .single();

        if (error) throw error;
        if (!data) throw new Error("Project not found");

        const loadedProject = data as ProjectData;
        setProjectData(loadedProject);

        // ストアにデータをセット
        setProjectInfo(loadedProject.id, loadedProject.name);
        setPages(loadedProject.pages || []);

        // 初期ページのアイテムを展開 (簡易実装: 全ページのアイテムを持つか、ページ遷移ごとに切り替えるか)
        // ここでは最初のページのアイテムをセットする例、または全アイテムをストアで管理する仕様に合わせて調整
        const initialPage = loadedProject.pages[0];
        if (initialPage) {
          // usePageStoreの仕様に合わせてセット
          // Viewerではページ遷移ごとに placedItems を更新するロジックが必要だが
          // ここではデータロード完了として処理
          setPages(loadedProject.pages);
          setPreviewState({
            currentPageId: initialPage.id,
            variables: {},
            history: [initialPage.id]
          });
        }

        // UTM & Device Tracking Initialization
        initializeUTMTracking();
        initializeDeviceTracking();

        // PV計測
        logAnalyticsEvent('page_view', { pageId: initialPage?.id }, projectId);

      } catch (err: any) {
        console.error("Error fetching project:", err);
        setError(err.message || "Failed to load content");
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchProject();
    }
  }, [projectId, setPages, setProjectInfo, setPreviewState]);

  // ■ 行動分析監視ロジック (Smart Action Analytics)
  useActionAnalytics(projectId, true);


  // レイアウト計算
  const FIXED_WIDTH = 1000;
  const FIXED_HEIGHT = 700; // 基準の高さ

  const [scale, setScale] = useState(1);
  const [wrapperHeight, setWrapperHeight] = useState(FIXED_HEIGHT);

  useEffect(() => {
    const handleResize = () => {
      const windowWidth = window.innerWidth;
      // 1000pxより小さい場合のみ縮小
      const newScale = windowWidth < FIXED_WIDTH ? windowWidth / FIXED_WIDTH : 1;
      setScale(newScale);
      setWrapperHeight(FIXED_HEIGHT * newScale);
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // 初期実行
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 現在のページの背景設定を取得
  const currentPage = pages.find(p => p.id === previewState.currentPageId);
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

  if (loading) return <div className="viewer-loading">Loading...</div>;
  if (error) return <div className="viewer-error">Error: {error}</div>;
  if (!projectData) return <div className="viewer-error">No Data</div>;

  // コンテンツの高さ計算 (ページ内の最下部アイテムを探す)
  const currentPageItems = placedItems.filter(item => {
    // 簡易的: 現在のページのアイテムのみ抽出するロジックが必要
    // ReactFlowのnodesから判断するか、item自体にpageIdを持たせる必要がある
    // ここでは、usePageStoreが「現在のページのアイテム」だけを持っている前提で動作させる
    return true;
  });

  const maxY = currentPageItems.reduce((max, item) => Math.max(max, item.position.y + item.size.height), FIXED_HEIGHT);
  const contentHeight = Math.max(FIXED_HEIGHT, maxY + 50); // 余白

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