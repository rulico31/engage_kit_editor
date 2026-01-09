import React, { useState, useRef, useEffect } from "react";
import type { PlacedItemType, PreviewState, VariableState } from "../../types";
import "../Artboard.css";
import { ResizeHandles } from "./ResizeHandles";
import { useSelectionStore } from "../../stores/useSelectionStore";
import { InputTracker } from "../../lib/InputTracker"; // 追加
import { logAnalyticsEvent } from "../../lib/analytics"; // 追加

// 国コードリスト（PreviewItemと共通）
const COUNTRY_CODES = [
  { code: "+81", name: "日本 (+81)" },
  { code: "+1", name: "アメリカ/カナダ (+1)" },
  { code: "+86", name: "中国 (+86)" },
  { code: "+82", name: "韓国 (+82)" },
  { code: "+44", name: "イギリス (+44)" },
  { code: "+33", name: "フランス (+33)" },
  { code: "+49", name: "ドイツ (+49)" },
  { code: "+61", name: "オーストラリア (+61)" },
];

interface ArtboardItemProps {
  item: PlacedItemType;
  renderChildren: (parentId: string) => React.ReactNode;
  onItemSelect: (e: React.MouseEvent, id: string, label: string) => void;
  onItemDragStart: (e: React.MouseEvent, id: string) => void;
  selectedIds: string[];
  activeTabId: string | null;
  isPreviewing: boolean;
  isMobileView?: boolean;
  previewState: PreviewState | null;
  onItemEvent: (eventName: string, itemId: string) => void;
  variables: VariableState;
  onVariableChange: (variableName: string, value: any) => void;
  zoomLevel: number;
  onItemUpdate: (id: string, updates: Partial<PlacedItemType>, addToHistory?: boolean) => void;
}

export const ArtboardItem: React.FC<ArtboardItemProps> = ({
  item,
  renderChildren,
  onItemSelect,
  onItemDragStart,
  selectedIds,
  activeTabId,
  isPreviewing,
  isMobileView = false,
  previewState,
  onItemEvent,
  variables,
  onVariableChange,
  zoomLevel,
  onItemUpdate,
}) => {
  // activeLogicGraphIdを取得（ロジック編集中のアイテムIDを保持）
  const activeLogicGraphId = useSelectionStore((s) => s.activeLogicGraphId);

  // selectedIdsに含まれているか、またはactiveLogicGraphIdと一致するかで選択状態を判定
  const isSelected = selectedIds.includes(item.id) || item.id === activeLogicGraphId;
  const isActive = item.id === activeTabId;
  const isGroup = item.id.startsWith("group");

  // ハイライト状態を取得
  const highlightedItemIds = useSelectionStore((s) => s.highlightedItemIds);
  const isHighlighted = highlightedItemIds.includes(item.id);

  // 入力系アイテムの自動高さ調整除外設定
  const isAutoHeight = !isGroup && (item.name.startsWith("テキスト") || item.name.startsWith("ボタン"));

  // モバイル用の座標・サイズ（未設定時はデスクトップ値を使用）
  const x = isMobileView && item.mobileX !== undefined ? item.mobileX : item.x;
  const y = isMobileView && item.mobileY !== undefined ? item.mobileY : item.y;
  const width = isMobileView && item.mobileWidth !== undefined ? item.mobileWidth : item.width;
  const height = isMobileView && item.mobileHeight !== undefined ? item.mobileHeight : item.height;

  // --- スタイルの分離 ---

  // 1. コンテナ用スタイル (位置、サイズ、背景、ボックスシャドウ)
  const containerStyle: React.CSSProperties = {
    width: width,
    height: isAutoHeight ? 'auto' : height,
    minHeight: height,
    display: isGroup ? 'block' : 'flex',
    // テーマ変数の適用
    fontFamily: 'var(--theme-font-family, inherit)',
    // @ts-ignore - 個別のborderRadius設定を使用
    borderRadius: (typeof (item.style as any)?.borderRadius === 'number') ? `${(item.style as any).borderRadius}px` : '0px',
    // 選択時はリサイズハンドルを表示するためoverflowをvisibleに、それ以外はhidden
    overflow: (isSelected && !isPreviewing) ? 'visible' : 'hidden',
  };

  // 背景色（isTransparentがtrueの場合は強制的にtransparent）
  if (item.data?.isTransparent === true) {
    containerStyle.backgroundColor = 'transparent';
  } else if (item.style?.backgroundColor) {
    // 個別に背景色が設定されている場合
    containerStyle.backgroundColor = item.style.backgroundColor;
  }

  // ボックスシャドウ (Shadow & Glow)
  const boxShadows: string[] = [];
  if (item.style?.shadow?.enabled) {
    const { x = 0, y = 0, blur = 0, color = '#000000' } = item.style.shadow;
    boxShadows.push(`${x}px ${y}px ${blur}px ${color}`);
  }
  if (item.style?.glow?.enabled) {
    const { blur = 0, spread = 0, color = '#ffffff' } = item.style.glow;
    boxShadows.push(`0 0 ${blur}px ${spread}px ${color}`);
  }
  if (boxShadows.length > 0) {
    containerStyle.boxShadow = boxShadows.join(', ');
  }

  // プレビュー状態の反映 (コンテナ)
  if (isPreviewing && previewState && previewState[item.id]) {
    const itemState = previewState[item.id];
    containerStyle.visibility = itemState.isVisible ? 'visible' : 'hidden';
    containerStyle.opacity = itemState.opacity;
    containerStyle.transform = `translate(${itemState.x}px, ${itemState.y}px) scale(${itemState.scale}) rotate(${itemState.rotation}deg)`;
    containerStyle.transition = itemState.transition || 'none';
  } else {
    containerStyle.position = 'absolute';
    containerStyle.left = x;
    containerStyle.top = y;

    if (item.data.initialVisibility === false) {
      containerStyle.opacity = 0.5;
    }
  }

  // 背景設定されている場合は表示しない
  if (item.data?.isArtboardBackground) {
    containerStyle.display = 'none';
  }

  const textStyle: React.CSSProperties = {
    color: item.data?.color || '#333333',
    fontSize: `${item.data?.fontSize || 15}px`,
    width: '100%', // 親に合わせる
    height: '100%',
  };

  // テキストシャドウ (Shadow & Glow)
  const textShadows: string[] = [];
  if (item.style?.textShadow?.enabled) {
    const { x = 0, y = 0, blur = 0, color = '#000000' } = item.style.textShadow;
    textShadows.push(`${x}px ${y}px ${blur}px ${color}`);
  }
  if (item.style?.textGlow?.enabled) {
    const { blur = 0, color = '#ffffff' } = item.style.textGlow;
    textShadows.push(`0 0 ${blur}px ${color}`);
  }
  if (textShadows.length > 0) {
    textStyle.textShadow = textShadows.join(', ');
  }

  // 入力値の同期処理
  // 変数名が設定されていない場合はitem.idをデフォルトの変数名として使用する
  const variableName = item.data?.variableName || item.id;
  const externalValue = variables[variableName] || "";
  const [inputValue, setInputValue] = useState(externalValue);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [countryCode, setCountryCode] = useState(item.data?.countryCode || "+81");
  const [inputTracker] = useState(() => new InputTracker()); // InputTracker初期化

  useEffect(() => {
    if (isPreviewing) {
      if (externalValue !== inputValue) {
        setInputValue(externalValue);
      }
    } else {
      setInputValue("");
      setError(null);
    }
  }, [externalValue, isPreviewing]);

  // バリデーション関数（PreviewItemと同じロジック）
  const validate = (val: string) => {
    if (!isPreviewing) return true; // 編集モード時はバリデーションしない

    let newError: string | null = null;
    const trimmed = val ? val.trim() : "";

    // 1. 必須チェック
    if (item.data.required && !trimmed) {
      newError = "必須項目です";
    }
    // 2. 入力タイプ別チェック
    else if (trimmed) {
      if (item.data.inputType === 'email') {
        // メールアドレスの形式チェック（ドメインチェック強化）
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmed)) {
          newError = "メールアドレスの形式が正しくありません";
        } else {
          // ドメイン部分の検証
          const domain = trimmed.split('@')[1];
          if (!domain || domain.length < 3 || !domain.includes('.')) {
            newError = "有効なドメイン名を含むメールアドレスを入力してください";
          }
        }
      } else if (item.data.inputType === 'tel') {
        // 電話番号の検証（国コード対応）
        if (item.data.enableCountryCode) {
          // 国コード選択が有効な場合は数字のみ許可（ハイフンは任意）
          const telRegex = /^[0-9\-\s]{8,}$/;
          if (!telRegex.test(trimmed)) {
            newError = "電話番号は8桁以上の数字で入力してください";
          }
        } else {
          // 国コード選択が無効な場合は通常の電話番号形式
          const telRegex = /^[0-9\-]{10,}$/;
          if (!telRegex.test(trimmed)) {
            newError = "電話番号の形式が正しくありません";
          }
        }
      } else if (item.data.inputType === 'number') {
        if (isNaN(Number(trimmed))) {
          newError = "数値を入力してください";
        }
      }
    }

    setError(newError);
    return newError === null;
  };

  const handleBlur = () => {
    if (isPreviewing) {
      // InputTrackerのレポートを取得してログ記録
      const report = inputTracker.getReport(inputValue);
      console.log('🔍 [ArtboardItem] handleBlur called', {
        id: item.id,
        name: item.name,
        inputValue,
        report
      });

      // 入力または修正があった場合のみログ送信
      const shouldLog = inputValue.length > 0 || report.raw.correction_count > 0;
      if (shouldLog) {
        console.log('🔍 [ArtboardItem] Sending input_analysis log...');
        logAnalyticsEvent('input_analysis', {
          nodeId: item.id,
          nodeType: 'text_input',
          metadata: {
            metrics: report.metrics,
            raw: report.raw,
            item_name: item.name,
          }
        }).then(() => {
          console.log('✅ [ArtboardItem] Log sent successfully');
        }).catch(err => {
          console.error('❌ [ArtboardItem] Log failed:', err);
        });
      }

      const isValid = validate(inputValue);
      if (isValid) {
        onItemEvent("onInputComplete", item.id);
      }
    }
  };

  // イベントハンドラ
  const handleClick = (e: React.MouseEvent) => {
    if (isPreviewing) {
      if (e.target instanceof HTMLTextAreaElement) return;
      onItemEvent("click", item.id);
    } else {
      onItemSelect(e, item.id, item.data.text || item.name);
      e.stopPropagation();
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target instanceof HTMLTextAreaElement) {
      e.stopPropagation();
      return;
    }
    if (!isPreviewing) {
      onItemDragStart(e, item.id);
      e.stopPropagation();
    }
  };

  // コンテンツの生成
  let content = null;
  let itemClassName = "artboard-item";
  if (isSelected && !isPreviewing) itemClassName += " selected";
  if (isActive && !isPreviewing) itemClassName += " active-item";
  if (isPreviewing) itemClassName += " preview";
  if (isGroup) itemClassName += " is-group";
  if (item.data?.showBorder === false) itemClassName += " no-border";
  if (item.data?.isTransparent === true) itemClassName += " is-transparent";
  if (item.name.startsWith("テキスト入力欄")) itemClassName += " is-input";
  if (isHighlighted && !isPreviewing) itemClassName += " highlighted";

  if (isGroup) {
    content = null;
  } else if (item.name.startsWith("ボタン")) {
    content = (
      <button className="item-button-content" style={textStyle}>
        {item.data.text}
      </button>
    );
  } else if (item.name.startsWith("画像")) {
    containerStyle.height = item.height;
    containerStyle.minHeight = undefined;
    if (item.data?.src) {
      content = (
        <div className="item-image-content">
          <img src={item.data.src} alt={item.data.text} draggable={false} />
        </div>
      );
    } else {
      content = (
        <div className="item-image-content is-placeholder">
          {item.data.text} (No Image)
        </div>
      );
    }
  } else if (item.name.startsWith("テキスト入力欄")) {
    let placeholder = item.data?.placeholder || "テキストを入力...";
    // 必須入力の場合、プレースホルダーにアスタリスクを追加
    if (item.data?.required) {
      placeholder = `* ${placeholder}`;
    }

    content = (
      <div className="item-input-content">
        {isPreviewing && error && <div className="input-error-message">{error}</div>}
        {isPreviewing && item.data?.enableCountryCode && item.data?.inputType === 'tel' && (
          <div className="country-code-wrapper">
            <select
              className="country-code-select"
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
            >
              {COUNTRY_CODES.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <textarea
          ref={textareaRef}
          className={`artboard-item-textarea ${isPreviewing && error ? 'has-error' : ''}`}
          style={{
            ...textStyle,
            // @ts-ignore - CSS変数の設定
            '--placeholder-color': item.data?.color || '#999999',
          }}
          placeholder={placeholder}
          value={inputValue}
          readOnly={!isPreviewing}
          onCompositionStart={() => isPreviewing && inputTracker.onCompositionStart()}
          onCompositionEnd={(e) => isPreviewing && inputTracker.onCompositionEnd(e.nativeEvent.data)}
          onChange={(e) => {
            if (isPreviewing) {
              const newValue = e.target.value;
              setInputValue(newValue);
              inputTracker.onInput(newValue); //InputTrackerへ通知
              onVariableChange(variableName, newValue);
              // 入力中にエラーをクリア
              if (error) validate(newValue);
            }
          }}
          onKeyDown={(e) => {
            if (isPreviewing) {
              inputTracker.onKeyDown(e.nativeEvent, inputValue); // KeyDown通知
              if (e.key === "Enter") {
                e.currentTarget.blur();
                // blurイベントでhandleBlurが呼ばれるため、ここでは呼び出さない
              }
            }
          }}
          onBlur={handleBlur}
          onClick={(e) => {
            if (!isPreviewing) {
              e.stopPropagation();
              onItemSelect(e, item.id, item.data.text || item.name);
            }
          }}
          onMouseDown={(e) => e.stopPropagation()}
        />
      </div>
    );
  } else {
    // 通常のテキスト
    content = (
      <div className="item-text-content" style={textStyle}>
        {item.data.text}
      </div>
    );
  }

  return (
    <div
      className={itemClassName}
      style={containerStyle}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
    >
      {content}
      {renderChildren(item.id)}

      {isSelected && !isPreviewing && (
        <ResizeHandles
          item={item}
          zoomLevel={zoomLevel}
          onResizeStart={() => { }}
          onResize={(updates) => onItemUpdate(item.id, updates, false)}
          onResizeEnd={() => onItemUpdate(item.id, {}, true)}
        />
      )}
    </div>
  );
};