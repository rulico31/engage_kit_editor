import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

// アプリ本体を読み込む
// React.lazyを使うことで、読み込みエラー時も真っ白にならずエラーを表示できます
const App = React.lazy(() => import("./App"));

// 安全装置: エラーが起きたら赤い画面を表示するコンポーネント
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
        <div style={{ padding: "40px", color: "#333", fontFamily: "sans-serif", overflow: "auto", height: "100vh", backgroundColor: "#fff" }}>
          <h1 style={{ color: "#e74c3c", borderBottom: "2px solid #e74c3c", paddingBottom: "10px" }}>
            ⚠️ アプリの起動に失敗しました
          </h1>
          <p>以下のエラー内容を教えてください：</p>
          <div style={{ background: "#f8f9fa", padding: "20px", borderRadius: "8px", border: "1px solid #ddd" }}>
            <h3 style={{ marginTop: 0, color: "#c0392b" }}>{this.state.error?.toString()}</h3>
            <pre style={{ fontSize: "12px", color: "#666", whiteSpace: "pre-wrap" }}>
              {this.state.errorInfo?.componentStack || "スタックトレースなし"}
            </pre>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// 実行処理
const rootElement = document.getElementById("root");

if (!rootElement) {
  document.body.innerHTML = "<h1 style='color:red'>エラー: root要素が見つかりません (index.htmlを確認してください)</h1>";
} else {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ErrorBoundary>
        <Suspense fallback={
          <div style={{ 
            display: "flex", 
            justifyContent: "center", 
            alignItems: "center", 
            height: "100vh", 
            fontSize: "18px", 
            color: "#666" 
          }}>
            🚀 アプリを読み込んでいます...
          </div>
        }>
          <DndProvider backend={HTML5Backend}>
            <App />
          </DndProvider>
        </Suspense>
      </ErrorBoundary>
    </React.StrictMode>
  );
}