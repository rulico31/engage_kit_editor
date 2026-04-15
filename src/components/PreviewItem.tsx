// src/components/PreviewItem.tsx

import React, { useState, useEffect } from "react";
import type { PlacedItemType, PreviewState, NodeGraph } from "../types";
import "./PreviewItem.css";
import { usePreviewStore } from "../stores/usePreviewStore";
import { useProjectStore } from "../stores/useProjectStore";
import { usePageStore } from "../stores/usePageStore";
import { InputTracker } from "../lib/InputTracker";
import { logAnalyticsEvent } from "../lib/analytics";
import { validateInput } from "../lib/validation";

interface PreviewItemProps {
  item: PlacedItemType;
  previewState: PreviewState;
  allItemLogics: Record<string, NodeGraph>;
  isMobile?: boolean;
  setPreviewState: (newState: PreviewState | ((prev: PreviewState) => PreviewState)) => void;
  projectId?: string; // Added prop
}

const PreviewItem: React.FC<PreviewItemProps> = ({
  item,
  previewState,
  setPreviewState,
  isMobile = false,
  projectId: propProjectId, // Rename to avoid conflict with local variable if any, or just use it
}) => {
  const { id, name } = item;
  const itemState = previewState[id];

  // isMobile=true の場合はモバイル専用座標・サイズを優先して使用
  // モバイル座標が未設定の場合は PC 座標にフォールバック
  const x = isMobile
    ? (itemState?.x ?? item.mobileX ?? item.x)
    : (itemState?.x ?? item.x);
  const y = isMobile
    ? (itemState?.y ?? item.mobileY ?? item.y)
    : (itemState?.y ?? item.y);
  const width = isMobile
    ? (item.mobileWidth ?? item.width)
    : item.width;
  const height = isMobile
    ? (item.mobileHeight ?? item.height)
    : item.height;

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

    // [NEW] 自身が入力項目の場合、最新の値を確実に variables に反映させる
    if (isInput) {
      onVariableChange(variableName, inputValue);
    }

    // [NEW] 外部リンク遷移または送信前にバリデーションチェック
    // 自身、またはページ上の全入力項目のバリデーションが必要なアクションの場合
    if (item.data.linkUrl || item.data.actionType === 'submit') {
      const { pages, selectedPageId } = usePageStore.getState();
      const currentPage = pages[selectedPageId!];

      if (currentPage) {
        let hasValidationError = false;
        const updates: Record<string, any> = {};
        // 最新の variables を直接取得 (クロージャ対策 + 上記の反映後)
        const currentVars = usePreviewStore.getState().variables;

        // ページ内の全アイテムをチェック
        currentPage.placedItems.forEach((pi: PlacedItemType) => {
          const isInputItem = pi.name.startsWith("テキスト入力欄") || pi.type === 'input';
          if (isInputItem) { // バリデーションが必要な全ての入力項目
            const vName = pi.data.variableName || pi.id;
            const val = currentVars[vName];

            const errorMsg = validateInput(val, {
              required: !!pi.data.required,
              inputType: pi.data.inputType,
              enableCountryCode: pi.data.enableCountryCode
            });

            if (errorMsg) {
              hasValidationError = true;
              updates[pi.id] = { ...previewState[pi.id], error: errorMsg };
            } else if (previewState[pi.id]?.error) {
              // 修正済みならエラーを消す
              updates[pi.id] = { ...previewState[pi.id], error: null };
            }
          }
        });

        // エラー状態を一括更新
        if (Object.keys(updates).length > 0) {
          setPreviewState((prev: PreviewState) => ({
            ...prev,
            ...updates
          }));
        }

        if (hasValidationError) {
          console.warn('🛑 Validation failed. Blocking action.');
          return;
        }
      }
    }

    // [NEW] 隠し変数の保存 (onItemEvent経由 - 疎結合の維持)
    // 変数名と値が両方設定されている場合のみ実行
    if (item.data.variableName && item.data.variableValue) {
      console.log('💾 Setting hidden variable:', item.data.variableName, '=', item.data.variableValue);
      onVariableChange(item.data.variableName, item.data.variableValue);
    }

    // [NEW] 外部リンク遷移
    // クリックと同時に別タブで開く。もしページ遷移アクションが設定されていれば
    // 元のタブはそのまま次のページへ遷移する（仕様通り）
    if (item.data.linkUrl) {
      console.log('🔗 Opening external link:', item.data.linkUrl);
      // URLの形式チェック（簡易）
      if (item.data.linkUrl.startsWith('http://') || item.data.linkUrl.startsWith('https://')) {
        window.open(item.data.linkUrl, '_blank', 'noopener,noreferrer');
      } else {
        console.warn('⚠️ Invalid URL format. Must start with http:// or https://');
      }
    }

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

  // Debug: Track element size
  const rootRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  const isAutoHeight = !id.startsWith("group") && ((name.startsWith("テキスト") && !name.startsWith("テキスト入力欄")) || name.startsWith("ボタン"));
  const isInput = name.startsWith("テキスト入力欄") || item.type === 'input';
  const isButton = name.includes("ボタン") || item.type === 'button';

  useEffect(() => {
    if (isInput) {
      const root = rootRef.current;
      const input = inputRef.current;

      console.log('📏 [PreviewItem] Layout Debug:', {
        id,
        name,
        inputValueLength: inputValue.length,
        root: root ? {
          clientHeight: root.clientHeight,
          scrollHeight: root.scrollHeight,
          overflow: root.style.overflow,
          computedOverflow: window.getComputedStyle(root).overflow
        } : null,
        input: input ? {
          clientHeight: input.clientHeight,
          scrollHeight: input.scrollHeight,
          scrollTop: input.scrollTop,
          computedOverflowY: window.getComputedStyle(input).overflowY,
          computedWhiteSpace: window.getComputedStyle(input).whiteSpace
        } : null
      });
    }
  }, [id, name, isInput, inputValue]);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 外部からのエラーステート更新 (submitFormNode等から) を反映
    if (itemState?.error) {
      setError(itemState.error);
    }
  }, [itemState?.error]);

  const validate = (val: string) => {
    const newError = validateInput(val, {
      required: !!item.data.required,
      inputType: item.data.inputType,
      enableCountryCode: item.data.enableCountryCode
    });

    // エラー状態更新（前回と異なる場合のみ）
    if (newError !== error) {
      setError(newError);
      // store側の状態もクリア（ユーザーが修正し始めたらエラーを消すため）
      if (!newError && itemState?.error) {
        setPreviewState((prev: PreviewState) => ({
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

  // 滞在時間計測用
  const focusTimeRef = React.useRef<number>(0);

  const handleFocus = () => {
    focusTimeRef.current = Date.now();
  };

  const handleBlur = () => {
    const now = Date.now();
    // フォーカス時間がない場合は0 (一瞬で外れた場合など)
    const durationMs = focusTimeRef.current > 0 ? now - focusTimeRef.current : 0;
    focusTimeRef.current = 0; // リセット

    console.log('🔍 [PreviewItem] handleBlur called', {
      id,
      name,
      inputValue,
      durationMs, // Log duration
      inputTrackerState: inputTracker
    });

    // InputTrackerのレポートを取得してログ記録（バリデーション結果に関係なく記録）
    const report = inputTracker.getReport(inputValue);

    // ★ Supabaseに入力修正データを記録
    const hasInput = inputValue.length > 0;
    const hasCorrection = report.input_correction_count > 0;

    // usePreviewStore.projectId はエディタプレビューでは設定されないため、useProjectStoreから取得 + URLフォールバック
    let projectId = propProjectId || useProjectStore.getState().currentProjectId || usePreviewStore.getState().projectId || undefined;
    if (!projectId) {
      const params = new URLSearchParams(window.location.search);
      projectId = params.get('project_id') || undefined;
    }

    if (hasInput || hasCorrection || durationMs > 2000) { // ArtboardItemと条件を統一 (2秒以上滞在も記録)
      logAnalyticsEvent('input_correction', {
        nodeId: id,
        nodeType: 'text_input',
        metadata: {
          ...report,
          item_name: name,
          duration_ms: durationMs, // ★ 追加: 滞在時間を記録
        }
      }, projectId);
    } else {
      // 入力放棄 (Focusしたのに何もせずBlur)
      logAnalyticsEvent('input_abandonment', {
        nodeId: id,
        nodeType: 'text_input',
        metadata: {
          item_name: name,
          timestamp: Date.now()
        }
      }, projectId);
    }

    // バリデーションを実行し、成功した場合のみ完了イベントを発火
    const isValid = validate(inputValue);
    if (isValid) {
      onItemEvent("onInputComplete", id);
    }
  };

  // 画像判定の強化: 名前が変更されていても type で判定
  const isImage = name.startsWith("画像") || item.type === 'image';

  // Debug logging for image items
  if (isImage) {
    console.log('[PreviewItem] Image detected:', { id, name, type: item.type, hasSrc: !!item.data.src, srcPreview: item.data.src?.substring(0, 50) });
  }

  if (isImage) {
    if (item.data.src) {
      // 画像の縦横比（aspect-ratio）
      // PC版の width/height から元の比率を計算して保持
      const pcWidth = item.width ?? 100;
      const pcHeight = item.height ?? 100;
      const imageAspectRatio = pcWidth > 0 && pcHeight > 0 ? `${pcWidth} / ${pcHeight}` : undefined;
      content = (
        <img
          src={item.data.src}
          alt={item.data.text || "image"}
          className="preview-image-content"
          draggable={false}
          style={{ aspectRatio: imageAspectRatio, width: '100%', height: '100%', objectFit: 'contain' }}
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
        {item.data?.required && (
          <div style={{
            position: 'absolute',
            top: '2px',
            right: '5px',
            color: '#ff4d4f',
            fontSize: '16px',
            fontWeight: 'bold',
            zIndex: 1,
            pointerEvents: 'none'
          }}>*</div>
        )}
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
          ref={inputRef}
          className={`preview-input-content ${error ? 'has-error' : ''} ${item.data.inputType === 'textarea' ? 'is-textarea' : 'is-singleline'}`}
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
          onScroll={(e) => {
            console.log('📜 Textarea Scrolled:', e.currentTarget.scrollTop);
          }}
          onKeyDown={(e) => {
            inputTracker.onKeyDown(e.nativeEvent, inputValue);
            if (e.key === "Enter") {
              // 長文テキスト以外の場合のみBlurさせる (textareaは改行)
              if (item.data.inputType !== 'textarea') {
                e.currentTarget.blur();
              }
              // 注意: ここで直接onItemEventを呼ばない。blur()経由でhandleBlurが呼ばれるため。
            }
          }}
          onBlur={handleBlur}
          onFocus={handleFocus} // Track focus start time
          onClick={(e) => e.stopPropagation()}
        />
      </>
    );
  }
  else if (item.type === 'custom_html') {
    content = (
      <div 
        className="preview-custom-html-content" 
        style={{ width: '100%', height: '100%', overflow: 'auto' }}
        dangerouslySetInnerHTML={{ __html: item.data.html || "" }}
      />
    );
  }
  else if (item.type === 'box') {
    content = null; // Box は中身を表示しない (コンテナとしてのみ機能)
  }
  else {
    content = (
      <div className="item-text-content" style={{
        textAlign: item.data.textAlign || 'left',
        width: '100%',
        height: '100%'
      }}>
        {item.data.text || name}
      </div>
    );
  }

  // クラス名の動的生成
  let itemClassName = `preview-item ${isButton ? "is-button" : ""} ${isInput ? "is-input" : ""} ${item.type === 'custom_html' ? "is-custom-html" : ""}`;

  // アニメーションクラスの追加
  if (item.data?.animationType && item.data.animationType !== 'none') {
    itemClassName += ` animate-${item.data.animationType}`;
  }

  return (
    <div
      ref={rootRef}
      className={itemClassName}
      data-node-id={id}
      data-node-name={item.data.customName || name}
      data-node-type={item.type}
      style={{
        position: "absolute",
        left: `${x}px`,
        top: `${y}px`,
        width: `${width}px`,

        height: isAutoHeight ? 'auto' : `${height}px`,
        minHeight: isAutoHeight ? `${height}px` : undefined,

        zIndex: item.zIndex || 0,
        opacity: itemState.opacity,
        transform: `scale(${itemState.scale}) rotate(${itemState.rotation}deg)`,
        transition: itemState.transition || 'none',

        // Typography styles
        color: item.data.textColor || item.data.color || '#333333',
        fontSize: isMobile ? `${item.mobileFontSize ?? (item.data.fontSize || 15) * 0.7}px` : (item.data.fontSize ? `${item.data.fontSize}px` : '15px'),
        textAlign: item.data.textAlign || 'left',

        // 枠線の制御
        border: (item.data.showBorder === false) ? 'none' : undefined,
        padding: item.type === 'custom_html' ? 0 : undefined,

        // 背景色: 透明 -> data.backgroundColor -> style.backgroundColor
        // @ts-ignore
        backgroundColor: (item.data.isTransparent)
          ? 'transparent'
          : (item.data?.backgroundColor)
            ? (item.data.backgroundOpacity !== undefined && item.data.backgroundOpacity < 1)
              ? (() => {
                const color = item.data.backgroundColor.replace('#', '');
                const r = parseInt(color.substring(0, 2), 16);
                const g = parseInt(color.substring(2, 4), 16);
                const b = parseInt(color.substring(4, 6), 16);
                return `rgba(${r}, ${g}, ${b}, ${item.data.backgroundOpacity})`;
              })()
              : item.data.backgroundColor
            : (item.style as any)?.backgroundColor || undefined,

        // 背面のぼかし (Backdrop Blur)
        // @ts-ignore
        backdropFilter: item.data?.backdropBlur ? `blur(${item.data.backdropBlur}px)` : undefined,
        // @ts-ignore
        WebkitBackdropFilter: item.data?.backdropBlur ? `blur(${item.data.backdropBlur}px)` : undefined,

        // テーマ変数の適用
        fontFamily: item.data?.fontFamily || 'var(--page-font-family, var(--theme-font-family, inherit))',
        borderRadius: item.data.borderRadius ? `${item.data.borderRadius}px` : ((item.style as any)?.borderRadius ? `${(item.style as any).borderRadius}px` : '0px'),
        overflow: isInput ? 'visible' : 'hidden',

        // アニメーション時間
        // @ts-ignore
        animationDuration: item.data?.animationType && item.data.animationType !== 'none' ? `${item.data.animationDuration ?? 0.5}s` : undefined,
      }}
      onClick={handleClick}
    >
      {content}
      {item.customCss && (
        <style>
          {item.customCss.includes('&') || item.customCss.includes('.this-item') 
            ? item.customCss.replace(/&|\.this-item/g, `[data-node-id="${item.id}"]`)
            : `[data-node-id="${item.id}"] { ${item.customCss} }`
          }
        </style>
      )}
    </div >
  );
};

export default PreviewItem;