// src/components/PreviewItem.tsx

import React, { useState, useEffect } from "react";
import type { PlacedItemType, PreviewState, NodeGraph } from "../types";
import "./PreviewItem.css";
import { usePreviewStore } from "../stores/usePreviewStore";

interface PreviewItemProps {
  item: PlacedItemType;
  previewState: PreviewState;
  allItemLogics: Record<string, NodeGraph>;
  isMobile?: boolean;
  setPreviewState: (newState: PreviewState | ((prev: PreviewState) => PreviewState)) => void;
}

const PreviewItem: React.FC<PreviewItemProps> = ({
  item,
  previewState,
  setPreviewState,
  isMobile = false,
}) => {
  const { id, name } = item;
  const itemState = previewState[id];

  // モバイル表示時の座標・サイズ
  const x = isMobile && item.mobileX !== undefined ? item.mobileX : itemState?.x ?? item.x;
  const y = isMobile && item.mobileY !== undefined ? item.mobileY : itemState?.y ?? item.y;
  const width = isMobile && item.mobileWidth !== undefined ? item.mobileWidth : item.width;
  const height = isMobile && item.mobileHeight !== undefined ? item.mobileHeight : item.height;

  const onItemEvent = usePreviewStore(state => state.handleItemEvent);
  const onVariableChange = usePreviewStore(state => state.handleVariableChangeFromItem);
  const variables = usePreviewStore(state => state.variables);

  const variableName = item.data.variableName || "";
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    if (variableName && variables[variableName] !== undefined) {
      setInputValue(variables[variableName]);
    }
  }, [variableName]);

  const handleClick = () => {
    if (name.includes("ボタン") || name.includes("画像")) {
      onItemEvent("click", id);
    }
  };

  if (!itemState) return null;

  let content: React.ReactNode = null;

  const isAutoHeight = !name.startsWith("画像") && !id.startsWith("group");
  const isInput = name.startsWith("テキスト入力欄");
  const isButton = name.includes("ボタン");

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 外部からのエラーステート更新 (submitFormNode等から) を反映
    if (itemState?.error) {
      setError(itemState.error);
    }
  }, [itemState?.error]);

  const validate = (val: string) => {
    let newError: string | null = null;
    const trimmed = val ? val.trim() : "";

    // 1. 必須チェック
    if (item.data.required && !trimmed) {
      newError = "必須項目です";
    }
    // 2. 入力タイプ別チェック
    else if (trimmed) {
      if (item.data.inputType === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmed)) {
          newError = "メールアドレスの形式が正しくありません";
        }
      } else if (item.data.inputType === 'tel') {
        const telRegex = /^[0-9-]{10,}$/;
        if (!telRegex.test(trimmed)) {
          newError = "電話番号の形式が正しくありません";
        }
      } else if (item.data.inputType === 'number') {
        if (isNaN(Number(trimmed))) {
          newError = "数値を入力してください";
        }
      }
    }

    // エラー状態更新（前回と異なる場合のみ）
    if (newError !== error) {
      setError(newError);
      // store側の状態もクリア（ユーザーが修正し始めたらエラーを消すため）
      if (!newError && itemState?.error) {
        setPreviewState(prev => ({
          ...prev,
          [id]: { ...prev[id], error: null }
        }));
      }
    }
    return newError === null;
  };

  const handleBlur = () => {
    validate(inputValue);
    onItemEvent("onInputComplete", id);
  };

  if (name.startsWith("画像")) {
    if (item.data.src) {
      content = (
        <img
          src={item.data.src}
          alt={item.data.text || "image"}
          className="preview-image-content"
          draggable={false}
          onLoad={() => {
            onItemEvent("onImageLoad", id);
          }}
        />
      );
    } else {
      content = <div className="preview-placeholder">No Image</div>;
    }
  }
  else if (isInput) {
    let placeholder = item.data.placeholder || "入力してください";
    // 必須入力の場合、プレースホルダーにアスタリスクを追加
    if (item.data?.required) {
      placeholder = `* ${placeholder}`;
    }

    content = (
      <>
        <textarea
          className={`preview-input-content ${error ? 'has-error' : ''}`}
          style={{
            // @ts-ignore - CSS変数の設定
            '--placeholder-color': item.data?.color || '#999999',
            color: item.data?.color || '#333333',
            fontSize: item.data?.fontSize ? `${item.data.fontSize}px` : '15px',
          }}
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            onVariableChange(variableName, e.target.value);
            // 入力中にエラーをクリアするか？ UX的にはBlurまで待つのが一般的だが、即座に消すのもあり
            if (error) validate(e.target.value);
          }}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.currentTarget.blur();
            }
          }}
          onClick={(e) => e.stopPropagation()}
        />
        {error && <div className="input-error-message">{error}</div>}
      </>
    );
  }
  else {
    content = item.data.text || name;
  }

  // クラス名の動的生成
  const itemClassName = `preview-item ${isButton ? "is-button" : ""} ${isInput ? "is-input" : ""}`;

  return (
    <div
      className={itemClassName}
      style={{
        position: "absolute",
        left: `${x}px`,
        top: `${y}px`,
        width: `${width}px`,

        height: isAutoHeight ? 'auto' : `${height}px`,
        minHeight: isAutoHeight ? `${height}px` : undefined,

        zIndex: 0,
        opacity: itemState.opacity,
        transform: `scale(${itemState.scale}) rotate(${itemState.rotation}deg)`,
        transition: itemState.transition || 'none',
        color: item.data.color || '#333333',
        fontSize: item.data.fontSize ? `${item.data.fontSize}px` : '15px', // ★ 追加: フォントサイズ適用

        // 枠線の制御
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