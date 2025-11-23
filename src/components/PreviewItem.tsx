// src/components/PreviewItem.tsx

import React, { useState, useEffect } from "react";
import type { PlacedItemType, PreviewState, NodeGraph } from "../types";
import "./PreviewItem.css"; 
import { usePreviewStore } from "../stores/usePreviewStore"; 

interface PreviewItemProps {
  item: PlacedItemType;
  previewState: PreviewState;
  setPreviewState: (
    newState: PreviewState | ((prev: PreviewState) => PreviewState)
  ) => void;
  allItemLogics: Record<string, NodeGraph>;
}

const PreviewItem: React.FC<PreviewItemProps> = ({
  item,
  previewState,
}) => {
  const { id, name, width, height } = item;
  const onItemEvent = usePreviewStore(state => state.handleItemEvent);
  const onVariableChange = usePreviewStore(state => state.handleVariableChangeFromItem);
  const variables = usePreviewStore(state => state.variables);

  // テキスト入力欄用のステート
  const variableName = item.data.variableName || "";
  const [inputValue, setInputValue] = useState("");

  // 変数の初期値を反映
  useEffect(() => {
    if (variableName && variables[variableName] !== undefined) {
      setInputValue(variables[variableName]);
    }
  }, [variableName]); // variablesを依存に含めると無限ループの恐れがあるため、マウント時や名前変更時のみ

  const handleClick = () => {
    // ボタン、または画像がボタンとして機能する場合
    if (name.includes("ボタン") || name.includes("画像")) {
        onItemEvent("click", id);
    }
  };

  const itemState = previewState[id];
  if (!itemState) return null;

  // --- コンテンツの決定 ---
  let content: React.ReactNode = null;

  // 1. 画像の場合
  if (name.startsWith("画像")) {
    if (item.data.src) {
      content = (
        <img 
          src={item.data.src} 
          alt={item.data.text || "image"} 
          className="preview-image-content"
          draggable={false}
        />
      );
    } else {
      content = <div className="preview-placeholder">No Image</div>;
    }
  } 
  // 2. テキスト入力欄の場合
  else if (name.startsWith("テキスト入力欄")) {
    content = (
      <textarea
        className="preview-input-content"
        placeholder={item.data.placeholder || "入力してください"}
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
          onVariableChange(variableName, e.target.value);
        }}
        onBlur={() => {
          onItemEvent("onInputComplete", id);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.currentTarget.blur(); // フォーカスを外して onInputComplete を発火
          }
        }}
        // 入力欄クリックでイベントが発火しないようにバブリングを止める
        onClick={(e) => e.stopPropagation()}
      />
    );
  }
  // 3. その他（テキスト、ボタン）
  else {
    content = item.data.text || name;
  }

  const itemClassName = `preview-item ${
    name.includes("ボタン") ? "is-button" : ""
  }`;

  return (
    <div
      className={itemClassName}
      style={{
        position: "absolute",
        left: `${itemState.x}px`,
        top: `${itemState.y}px`,
        width: `${width}px`,
        height: `${height}px`,
        zIndex: 0, // 必要に応じて調整
        opacity: itemState.opacity,
        transform: `scale(${itemState.scale}) rotate(${itemState.rotation}deg)`,
        transition: itemState.transition || 'none',
        color: item.data.color || '#333333',
        // 枠線と背景透過の設定
        border: (item.data.showBorder === false) ? 'none' : undefined,
        backgroundColor: (item.data.isTransparent) ? 'transparent' : undefined,
      }}
      onClick={handleClick}
    >
      {content}
    </div>
  );
};

export default PreviewItem;