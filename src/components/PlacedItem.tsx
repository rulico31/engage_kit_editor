// src/components/PlacedItem.tsx

import React, { useState, useEffect } from "react";
import type { PlacedItemType, PreviewState, NodeGraph } from "../types";
import "./PreviewItem.css";
import { usePreviewStore } from "../stores/usePreviewStore";
import { InputTracker } from "../lib/InputTracker";
import { logAnalyticsEvent } from "../lib/analytics";

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

  const variableName = item.data.variableName || "";
  const [inputValue, setInputValue] = useState("");
  const [inputTracker] = useState(() => new InputTracker()); // InputTrackerインスタンス

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

  const itemState = previewState[id];
  if (!itemState) return null;

  let content: React.ReactNode = null;

  const isAutoHeight = !name.startsWith("画像") && !id.startsWith("group");
  const isInput = name.startsWith("テキスト入力欄");
  const isButton = name.includes("ボタン");

  if (name.startsWith("画像")) {
    if (item.data.src) {
      content = (
        <img
          src={item.data.src}
          alt={item.data.text || "image"}
          className="preview-image-content"
          draggable={false}
          onLoad={() => {
            // ★ 追加: 画像読み込み完了時にイベントを発火
            onItemEvent("onImageLoad", id);
          }}
        />
      );
    } else {
      content = <div className="preview-placeholder">No Image</div>;
    }
  }
  else if (isInput) {
    content = (
      <textarea
        className="preview-input-content"
        placeholder={item.data.placeholder || "入力してください"}
        value={inputValue}
        onCompositionStart={() => inputTracker.onCompositionStart()}
        onCompositionEnd={() => inputTracker.onCompositionEnd()}
        onChange={(e) => {
          const newValue = e.target.value;
          setInputValue(newValue);
          inputTracker.onInput(newValue);
          onVariableChange(variableName, newValue);
        }}
        onBlur={() => {
          console.log('🔍 [PlacedItem] onBlur called', {
            id,
            name,
            inputValue,
            inputTrackerState: inputTracker
          });

          // InputTrackerのレポートを取得してログ記録
          const report = inputTracker.getReport(inputValue);
          console.log('🔍 [PlacedItem] InputTracker report:', report);

          // Supabaseに入力修正データを記録
          const shouldLog = inputValue.length > 0 || report.input_correction_count > 0;

          if (shouldLog) {
            console.log('🔍 [PlacedItem] Calling logAnalyticsEvent...', {
              eventType: 'input_correction',
              nodeId: id
            });

            logAnalyticsEvent('input_correction', {
              nodeId: id,
              nodeType: 'text_input',
              metadata: {
                ...report,
                item_name: name,
              }
            }).then(() => {
              console.log('✅ [PlacedItem] logAnalyticsEvent promise resolved');
            }).catch(err => {
              console.error('❌ [PlacedItem] logAnalyticsEvent failed:', err);
            });
          } else {
            console.log('⚠️ [PlacedItem] Skipping log: No input or correction detected');
          }

          onItemEvent("onInputComplete", id);
        }}
        onKeyDown={(e) => {
          inputTracker.onKeyDown(e.nativeEvent, inputValue);
          if (e.key === "Enter") {
            e.currentTarget.blur();
          }
        }}
        onClick={(e) => e.stopPropagation()}
      />
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
        left: `${itemState.x}px`,
        top: `${itemState.y}px`,
        width: `${width}px`,

        height: isAutoHeight ? 'auto' : `${height}px`,
        minHeight: isAutoHeight ? `${height}px` : undefined,

        zIndex: 0,
        opacity: itemState.opacity,
        transform: `scale(${itemState.scale}) rotate(${itemState.rotation}deg)`,
        transition: itemState.transition || 'none',
        color: item.data.color || '#333333',

        // 枠線の制御（入力欄はCSSで制御するためここではborder指定をスキップする場合もあるが、一貫性のため残す）
        border: (item.data.showBorder === false) ? 'none' : undefined,
        backgroundColor: (item.data.isTransparent) ? 'transparent' : ((item.style as any)?.backgroundColor || undefined),
        // @ts-ignore
        borderRadius: (typeof (item.style as any)?.borderRadius === 'number') ? `${(item.style as any).borderRadius}px` : '0px',
        overflow: 'hidden',
      }}
      onClick={handleClick}
    >
      {content}
    </div>
  );
};

export default PreviewItem;