import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

// ★ここがポイント：Appを「後から読み込む」設定にします。
// これにより、読み込みに失敗しても真っ白にならず、エラー画面を出せます。
const App = React.lazy(() => import("./App"));

// エラー画面を表示するコンポーネント
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: any; errorInfo: any }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("❌ エラーをキャッチしました:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "40px", color: "#333", fontFamily: "sans-serif", overflow: "auto", height: "100vh" }}>
          <h1 style={{ color: "#e74c3c" }}>⚠️ アプリの起動に失敗しました</h1>
          <p>以下のエラー内容を教えてください（スマホで撮影など）：</p>
          <div style={{ background: "#f8f9fa", padding: "20px", borderRadius: "8px", border: "1px solid #ddd" }}>
            <h3 style={{ marginTop: 0, color: "#c0392b" }}>{this.state.error?.toString()}</h3>
            <pre style={{ fontSize: "12px", color: "#666", whiteSpace: "pre-wrap" }}>
              {this.state.errorInfo?.componentStack || "スタックトレースなし"}
            </pre>
          </div>
          <p style={{ marginTop: "20px" }}>
            <strong>よくある原因:</strong><br/>
            ・import文のパス間違い<br/>
            ・環境変数(.env)の読み込み失敗<br/>
            ・Supabaseクライアントの初期化エラー
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

// 実行
const rootElement = document.getElementById("root");
if (!rootElement) {
  document.body.innerHTML = "<h1 style='color:red'>root要素が見つかりません</h1>";
} else {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ErrorBoundary>
        <Suspense fallback={<div style={{padding: "50px"}}>🚀 アプリを読み込んでいます...</div>}>
          <DndProvider backend={HTML5Backend}>
            <App />
          </DndProvider>
        </Suspense>
      </ErrorBoundary>
    </React.StrictMode>
  );
}