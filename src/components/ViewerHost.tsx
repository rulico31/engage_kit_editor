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
import { ensureMobileLayout } from "../lib/layoutUtils"; // ★ 追加


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

        // ★ 追加: モバイルレイアウト情報の自動補完
        // 古いデータや、スマホ調整せずに公開されたデータ救済のため、
        // ロード時に mobileX 等が欠落しているアイテムに対して自動計算を行う
        if (projectData.pages) {
          Object.keys(projectData.pages).forEach(pageId => {
            const page = projectData.pages[pageId];
            if (page.placedItems && Array.isArray(page.placedItems)) {
              page.placedItems = page.placedItems.map(item => ensureMobileLayout(item));
            }
          });
        }

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
          // ★ 修正: 画面幅を確認して、モバイルならモバイルモードでプレビューを初期化する
          // これにより、PC用プロジェクトでもスマホで見ればモバイル座標が適用される
          const isMobileEnvironment = window.innerWidth <= 480;

          // isMobileステートもこのタイミングで更新しておく（useEffectを待たない）
          setIsMobile(isMobileEnvironment);

          initPreview(isMobileEnvironment);

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

  // ★ レスポンシブ対応: 画面幅に応じたスケール計算（高さは無視）
  // プロジェクトのデバイスタイプに応じたアートボードサイズを使用
  useEffect(() => {
    const handleResize = () => {
      const viewportWidth = window.innerWidth;
      // ★ 修正: スマホで見ている時は、プロジェクト設定に関わらずモバイル幅(375)を基準にする
      // これをしないと、PC用(1000px)の画用紙にモバイル配置(375px用)が描画され、さらに縮小されて豆粒になる
      const targetWidth = isMobile ? 375 : artboardWidth;

      // 幅のみを考慮してスケールを採用（高さはスクロールで対応）
      const scaleX = viewportWidth / targetWidth;

      // PCでもモバイルでも、画面幅よりコンテンツ幅が大きい場合は縮小する
      // ただし、モバイルデバイスでPCサイトを見る場合などは、極端に小さくならないように最小値を設ける手もあるが
      // 基本的には「幅ピッタリ」に合わせるのがレスポンシブの基本
      const newScale = Math.min(scaleX, 1); // 最大1倍（拡大しない）

      setScale(newScale);
    };

    handleResize(); // 初回実行
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [artboardWidth, isMobile]); // isMobileを依存配列に追加

  // ★ コンテンツの高さを計算 (スクロール量を正しく確保するため)
  const contentHeight = React.useMemo(() => {
    // 基準となるアートボード高さ（スマホなら667、PCなら設定値）
    const baseHeight = isMobile ? 667 : artboardHeight;

    if (placedItems.length === 0) return baseHeight;

    // 現在のアートボード幅が狭い（モバイル）の場合は、モバイル用座標で高さを計算すべき
    // ただし、PreviewHost側でどうレンダリングされるかに依存する。
    // ここでは簡易的に、"モバイル用プロジェクト"ならモバイル座標、そうでなければPC座標を見る
    // もしくは、scale < 1 の時はモバイル座標を見る？
    // いや、EngageKitのデータ構造上、PreviewHost内で isMobile プロップによって座標が切り替わる。
    // ViewerHost側でもそれに合わせる必要がある。

    // 現在の isMobile ステート（画面幅依存）を使用
    // スマホで見ているならモバイル座標、PCならPC座標を使用して高さを計算
    const shouldUseMobileProps = isMobile;

    let maxY = 0;
    placedItems.forEach(item => {
      const y = (shouldUseMobileProps && item.mobileY !== undefined) ? item.mobileY : item.y;
      const h = (shouldUseMobileProps && item.mobileHeight !== undefined) ? item.mobileHeight : item.height;

      // Visibilityチェックも入れるべきだが、非表示アイテムがレイアウトのスペースを取る場合もあるので
      // いったんは全アイテム対象で計算
      if (y + h > maxY) maxY = y + h;
    });

    // 余白を少し持たせる (+50px)
    // ただし、最低でも設定されたアートボードの高さは確保する
    return Math.max(baseHeight, maxY + 50);
  }, [placedItems, artboardHeight, isMobile]);

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
    minHeight: "100vh", // height: 100vh だとスクロールできない場合がある
    overflowX: "hidden", // 横スクロールは禁止
    overflowY: "auto",   // 縦スクロールは許可
    position: "relative",
    backgroundImage: backgroundImage?.src ? `url(${backgroundImage.src})` : undefined,
    backgroundSize: backgroundImage?.displayMode === 'tile' ? 'auto' : (backgroundImage?.displayMode || 'cover'),
    backgroundPosition: backgroundImage?.position || 'center center',
    backgroundRepeat: backgroundImage?.displayMode === 'tile' ? 'repeat' : 'no-repeat',

    // ★ 文字サイズ自動膨張の禁止
    WebkitTextSizeAdjust: '100%',
    textSizeAdjust: '100%',
  };

  // 実際に描画するコンテナの幅
  const renderWidth = isMobile ? 375 : artboardWidth;

  return (
    <div style={backgroundStyle}>
      <div style={{
        width: "100%",
        // height: "100%", // これを指定すると親の100vhに制限されてしまう
        minHeight: "100%", // コンテンツに合わせて伸びるように
        position: "relative",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start", // 上詰め配置 (centerだと上下に余白ができる)
        // overflow: "auto" // 親でスクロール制御するのでここは不要
      }}>
        {/* ★ レスポンシブ対応: transform: scale() でコンテンツを縮小 */}
        <div style={{
          width: `${renderWidth}px`,
          height: `${contentHeight}px`, // ★ 計算したコンテンツ高さを適用
          transform: `scale(${scale})`,
          transformOrigin: "top center", // ★ 上詰め基準で縮小
          position: "relative",
          marginBottom: '50px' // 下部に少し余白
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