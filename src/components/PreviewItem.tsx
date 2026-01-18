// src/components/PreviewItem.tsx

import React, { useState, useEffect } from "react";
import type { PlacedItemType, PreviewState, NodeGraph } from "../types";
import "./PreviewItem.css";
import { usePreviewStore } from "../stores/usePreviewStore";
import { InputTracker } from "../lib/InputTracker";
import { logAnalyticsEvent } from "../lib/analytics";

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
}) => {
  const { id, name } = item;
  const itemState = previewState[id];

  // ★ ミニチュア方式: 常にPC座標・サイズのみ使用
  const x = itemState?.x ?? item.x;
  const y = itemState?.y ?? item.y;
  const width = item.width;
  const height = item.height;

  const onItemEvent = usePreviewStore(state => state.handleItemEvent);
  const onVariableChange = usePreviewStore(state => state.handleVariableChangeFromItem);
  const variables = usePreviewStore(state => state.variables);

  const variableName = item.data.variableName || item.id;
  const [inputValue, setInputValue] = useState("");
  const [inputTracker] = useState(() => new InputTracker()); // InputTrackerインスタンス

  useEffect(() => {
    if (variableName && variables[variableName] !== undefined) {
      setInputValue(variables[variableName]);
    }
  }, [variableName]);

  const handleClick = async () => {
    console.log("📍 PreviewItem clicked:", name, id);

    // ★★ 重要: すべてのボタン/選択肢クリックでまずclickイベントを発火
    // これにより logicEngine でスコア加算処理が実行される
    if (!name.startsWith("テキスト入力欄")) {
      onItemEvent("click", id);
    }

    // ★ ワンクリック送信 (Simplified CV)
    if (item.data.actionType === 'submit') {
      console.log('🚀 One-Click Submit Triggered');

      try {
        // 1. データ収集 (variablesから)
        const submitData = { ...variables };

        // 2. submitLeadData を使用してリードを送信
        // これにより _system_total_score が正しくDBに保存される
        const { submitLeadData } = await import('../lib/leads');

        // projectIdはURLから取得される (leads.ts内部で処理)
        await submitLeadData(submitData);

        console.log('✅ Lead Submitted via submitLeadData');

        // リダイレクト処理
        if (item.data.submitRedirectUrl) {
          window.location.href = item.data.submitRedirectUrl;
        } else {
          alert('送信しました！ (Thank you for submitting!)');
        }

      } catch (err) {
        console.error('❌ Submit Failed:', err);
        alert('送信に失敗しました。(Submission Failed)');
      }
      return;
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

  // リアルタイムバリデーション（デバウンス処理）
  // ユーザーが入力を止めてから一定時間後に検証を行う
  useEffect(() => {
    // 値が空の場合は検証しない（必須チェックはBlur時のみでUXとしては十分）
    if (!inputValue) return;

    // 既にエラーが表示されている場合は、onChangeハンドラ内で即時検証が行われているため
    // ここでのデバウンス検証は不要（二重処理を防ぐ）
    if (error) return;

    // 入力タイプがテキスト以外（検証が必要なタイプ）の場合のみタイマーセット
    if (item.data.inputType === 'email' || item.data.inputType === 'tel' || item.data.inputType === 'number') {
      const timer = setTimeout(() => {
        validate(inputValue);
      }, 800); // 0.8秒待機
      return () => clearTimeout(timer);
    }
  }, [inputValue, error, item.data.inputType, item.data.required]);

  const handleBlur = () => {
    console.log('🔍 [PreviewItem] handleBlur called', {
      id,
      name,
      inputValue,
      inputTrackerState: inputTracker
    });

    // InputTrackerのレポートを取得してログ記録（バリデーション結果に関係なく記録）
    const report = inputTracker.getReport(inputValue);
    console.log('🔍 [PreviewItem] InputTracker report:', report);

    // ★ Supabaseに入力修正データを記録
    const hasInput = inputValue.length > 0;
    const hasCorrection = report.input_correction_count > 0;

    if (hasInput || hasCorrection) {
      console.log('🔍 [PreviewItem] Calling logAnalyticsEvent...', {
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
        console.log('✅ [PreviewItem] logAnalyticsEvent promise resolved');
      }).catch(err => {
        console.error('❌ [PreviewItem] logAnalyticsEvent failed:', err);
      });
    } else {
      // 入力放棄 (Focusしたのに何もせずBlur)
      console.log('⚠️ [PreviewItem] Input Abandonment detected');
      logAnalyticsEvent('input_abandonment', {
        nodeId: id,
        nodeType: 'text_input',
        metadata: {
          item_name: name,
          timestamp: Date.now()
        }
      });
    }

    // バリデーションを実行し、成功した場合のみ完了イベントを発火
    const isValid = validate(inputValue);
    if (isValid) {
      onItemEvent("onInputComplete", id);
    }
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

    // 国コード選択が有効な場合のstate
    const [countryCode, setCountryCode] = useState(item.data?.countryCode || "+81");

    // 主要国の国コードリスト
    const countryCodes = [
      { code: "+81", name: "日本 (+81)" },
      { code: "+1", name: "アメリカ/カナダ (+1)" },
      { code: "+86", name: "中国 (+86)" },
      { code: "+82", name: "韓国 (+82)" },
      { code: "+44", name: "イギリス (+44)" },
      { code: "+33", name: "フランス (+33)" },
      { code: "+49", name: "ドイツ (+49)" },
      { code: "+61", name: "オーストラリア (+61)" },
    ];

    content = (
      <>
        {error && <div className="input-error-message">{error}</div>}
        {item.data?.enableCountryCode && item.data?.inputType === 'tel' && (
          <div className="country-code-wrapper">
            <select
              className="country-code-select"
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
            >
              {countryCodes.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>
        )}
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
          onCompositionStart={() => inputTracker.onCompositionStart()}
          onCompositionEnd={() => inputTracker.onCompositionEnd()}
          onChange={(e) => {
            const newValue = e.target.value;
            setInputValue(newValue);
            inputTracker.onInput(newValue);
            onVariableChange(variableName, newValue);
            // 入力中にエラーをクリアするか？ UX的にはBlurまで待つのが一般的だが、即座に消すのもあり
            if (error) validate(newValue);
          }}
          onKeyDown={(e) => {
            inputTracker.onKeyDown(e.nativeEvent, inputValue);
            if (e.key === "Enter") {
              e.currentTarget.blur();
              // 注意: ここで直接onItemEventを呼ばない。blur()経由でhandleBlurが呼ばれるため。
            }
          }}
          onBlur={handleBlur}
          onClick={(e) => e.stopPropagation()}
        />
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
        fontSize: item.data.fontSize ? `${item.data.fontSize}px` : '15px',

        // 枠線の制御
        border: (item.data.showBorder === false) ? 'none' : undefined,

        // 背景色: 透明 -> 個別設定
        // @ts-ignore
        backgroundColor: (item.data.isTransparent)
          ? 'transparent'
          : ((item.style as any)?.backgroundColor || undefined),

        // テーマ変数の適用
        fontFamily: 'var(--theme-font-family, inherit)',
        // @ts-ignore
        borderRadius: (typeof (item.style as any)?.borderRadius === 'number') ? `${(item.style as any).borderRadius}px` : '0px',
        overflow: 'hidden',
      }}
      onClick={handleClick}
    >
      {content}
    </div >
  );
};

export default PreviewItem;