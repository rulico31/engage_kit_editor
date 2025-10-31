// src/main.tsx

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// ↓↓↓↓↓↓↓↓↓↓ 必要なものをインポート ↓↓↓↓↓↓↓↓↓↓
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
// ↑↑↑↑↑↑↑↑↑↑ ここまで ↑↑↑↑↑↑↑↑↑↑

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {/* ↓↓↓↓↓↓↓↓↓↓ DndProviderでAppを囲む ↓↓↓↓↓↓↓↓↓↓ */}
    <DndProvider backend={HTML5Backend}>
      <App />
    </DndProvider>
    {/* ↑↑↑↑↑↑↑↑↑↑ ここまで ↑↑↑↑↑↑↑↑↑↑ */}
  </React.StrictMode>
);