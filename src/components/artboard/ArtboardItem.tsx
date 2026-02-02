import React, { useState, useRef, useEffect } from "react";
import type { PlacedItemType, PreviewState, VariableState } from "../../types";
import "../Artboard.css";
import { ResizeHandles } from "./ResizeHandles";
import { useSelectionStore } from "../../stores/useSelectionStore";
import { usePreviewStore } from "../../stores/usePreviewStore";
import { usePageStore } from "../../stores/usePageStore";
import { useProjectStore } from "../../stores/useProjectStore"; // Added
import { InputTracker } from "../../lib/InputTracker"; // 追加
import { logAnalyticsEvent } from "../../lib/analytics"; // 追加
import { validateInput } from "../../lib/validation"; // 追加

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
  const isAutoHeight = !isGroup && ((item.name.startsWith("テキスト") && !item.name.startsWith("テキスト入力欄")) || item.name.startsWith("ボタン"));

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
    // @ts-ignore - 個別のborderRadius設定を使用 (data優先、fallback to style)
    borderRadius: item.data?.borderRadius ? `${item.data.borderRadius}px` : ((typeof (item.style as any)?.borderRadius === 'number') ? `${(item.style as any).borderRadius}px` : '0px'),
    // 重なり順 (zIndex)
    zIndex: item.zIndex || 0,
    // 選択時はリサイズハンドルを表示するためoverflowをvisibleに
    // また、プレビュー中の入力欄もスクロールバーを表示するためにvisibleにする
    overflow: ((isSelected && !isPreviewing) || (isPreviewing && item.name.startsWith("テキスト入力欄"))) ? 'visible' : 'hidden',
    // テキスト入力欄の場合はコンテナのパディングを0にする（入力エリアを最大化するため）
    padding: item.name.startsWith("テキスト入力欄") ? 0 : undefined,
  };

  // 背景色（isTransparentがtrueの場合は強制的にtransparent）
  if (item.data?.isTransparent === true) {
    containerStyle.backgroundColor = 'transparent';
  } else if (item.data?.backgroundColor) {
    // プロパティパネルで設定された背景色 (data.backgroundColor)
    containerStyle.backgroundColor = item.data.backgroundColor;
  } else if (item.style?.backgroundColor) {
    // 個別に背景色が設定されている場合 (style.backgroundColor - legacy fallback)
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
    color: item.data?.textColor || item.data?.color || '#333333',
    fontSize: `${item.data?.fontSize || 15}px`,
    textAlign: item.data?.textAlign || 'left',
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
  const [isEditing, setIsEditing] = useState(false); // 編集モード管理用
  const [inputTracker] = useState(() => new InputTracker()); // InputTracker初期化
  const focusTimeRef = useRef<number>(0); // 滞在時間計測用

  useEffect(() => {
    if (isPreviewing) {
      if (externalValue !== inputValue) {
        setInputValue(externalValue);
      }
    } else {
      // エディタモードではプレースホルダーを初期値としてセット
      setInputValue(item.data.placeholder || "");
      setError(null);
    }
  }, [externalValue, isPreviewing, item.data.placeholder]);

  // Debug: Layout check
  useEffect(() => {
    if (isPreviewing && item.name.startsWith("テキスト入力欄")) {
      const ta = textareaRef.current;
      if (ta) {
        console.log('📏 [ArtboardItem] Layout Debug:', {
          id: item.id,
          name: item.name,
          inputValueLength: inputValue.length,
          styleHeight: containerStyle.height,
          textarea: {
            clientHeight: ta.clientHeight,
            scrollHeight: ta.scrollHeight,
            offsetHeight: ta.offsetHeight,
            computedHeight: window.getComputedStyle(ta).height,
            computedOverflowY: window.getComputedStyle(ta).overflowY
          }
        });
      }
    }
  }, [isPreviewing, inputValue, item.name, item.id, containerStyle.height]);

  // バリデーション関数 (validation.tsを使用)
  const validate = (val: string) => {
    if (!isPreviewing) return true; // 編集モード時はバリデーションしない

    const errorMsg = validateInput(val, {
      required: !!item.data.required,
      inputType: item.data.inputType,
      enableCountryCode: item.data.enableCountryCode
    });

    setError(errorMsg);
    return errorMsg === null;
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
      const hasInput = inputValue.length > 0;
      const hasCorrection = report.input_correction_count > 0;
      // usePreviewStore.projectId はエディタプレビューでは設定されないため、useProjectStoreから取得
      // usePreviewStore.projectId はエディタプレビューでは設定されないため、useProjectStoreから取得 + URLフォールバック
      let projectId = useProjectStore.getState().currentProjectId || usePreviewStore.getState().projectId || undefined;

      if (!projectId) {
        const params = new URLSearchParams(window.location.search);
        projectId = params.get('project_id') || undefined;
      }

      // ★ 滞在時間 (Duration) の計算
      const now = Date.now();
      const durationMs = (focusTimeRef.current > 0) ? (now - focusTimeRef.current) : 0;
      focusTimeRef.current = 0; // リセット

      console.log('🔍 [ArtboardItem] handleBlur - projectId:', projectId, 'hasInput:', hasInput, 'hasCorrection:', hasCorrection, 'duration:', durationMs);

      // 入力がある、修正がある、または一定時間以上滞在した場合にログ送信
      if (hasInput || hasCorrection || durationMs > 2000) {
        console.log('🔍 [ArtboardItem] Sending input_correction log...');
        // @ts-ignore - input_analysis was invalid, changed to input_correction
        logAnalyticsEvent('input_correction', {
          nodeId: item.id,
          nodeType: 'text_input',
          metadata: {
            ...report, // フラットな構造を展開
            item_name: item.name,
            duration_ms: durationMs, // ★ 滞在時間を追加
          }
        }, projectId).then(() => {
          console.log('✅ [ArtboardItem] Log sent successfully');
        }).catch(err => {
          console.error('❌ [ArtboardItem] Log failed:', err);
        });
      } else {
        // 入力放棄 (Focusしたのに何もせずBlur)
        console.log('⚠️ [ArtboardItem] Input Abandonment detected');
        logAnalyticsEvent('input_abandonment', {
          nodeId: item.id,
          nodeType: 'text_input',
          metadata: {
            item_name: item.name,
            timestamp: Date.now()
          }
        }, projectId);
      }

      const isValid = validate(inputValue);
      if (isValid) {
        onItemEvent("onInputComplete", item.id);
      }
    }
  };

  // ★ プレースホルダーに応じた自動高さ調整
  // 自動高さ調整ロジックは廃止 (固定高さ + スクロールに変更)
  // 以前のロジックがあった場所



  // イベントハンドラ
  // イベントハンドラ
  const handleClick = async (e: React.MouseEvent) => {
    if (isPreviewing) {
      if (e.target instanceof HTMLTextAreaElement) return;

      // ★ ワンクリック送信 (Simplified CV) - Editor Preview Support
      if (item.data.actionType === 'submit') {
        console.log('🚀 One-Click Submit Triggered (Editor Preview)');
        e.stopPropagation(); // イベント伝播を止める

        // ★★ 重要: スコア加算のためにまずclickイベントを発火
        // これにより handleItemEvent 内で _system_total_score が加算される
        onItemEvent("click", item.id);

        try {
          // 1. 変数の取得
          const variables = usePreviewStore.getState().variables; // ストアから直接取得
          const submitData = { ...variables };

          // 2. Project IDの取得 (URL or Store)
          // Editorの場合はURLに project_id がある場合が多い、または store から
          let projectId: string | undefined = useProjectStore.getState().currentProjectId || undefined;
          if (!projectId) {
            const params = new URLSearchParams(window.location.search);
            projectId = params.get('project_id') || undefined;
          }

          // 3. データ送信 (leads.ts の submitLeadData を使用)
          // Editor Previewではページ全体の状態を取得してスコア計算に利用する
          const currentPageId = usePageStore.getState().selectedPageId;
          const pages = usePageStore.getState().pages;
          const placedItems = (currentPageId && pages[currentPageId]) ? pages[currentPageId].placedItems : [];

          // leads.tsのsubmitLeadDataを呼び出し（ここでleadsテーブルへのINSERTとanalyticsログ送信が行われる）
          const { submitLeadData } = await import("../../lib/leads"); // Dynamic import to avoid circular dependency issues if any

          await submitLeadData(
            submitData,
            projectId,
            placedItems
          );

          console.log('✅ Lead Submitted via submitLeadData (Editor Preview)');

          // 4. リダイレクト処理 (Editor上ではAlertのみにするか、window.openにするか)
          if (item.data.submitRedirectUrl) {
            // Editor Previewなので、遷移せずにアラートだけ出すのが安全かも
            alert(`送信成功！\n本来は "${item.data.submitRedirectUrl}" に遷移します。\n(Editor Preview Mode)`);
          } else {
            alert('送信しました！ (Thank you for submitting!)');
          }

        } catch (err) {
          console.error('❌ Submit Failed:', err);
          alert('送信に失敗しました。(Submission Failed)');
        }
        return;
      }

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
  } else if (item.name.startsWith("画像") || item.type === 'image') {
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
            // エディタモード時はプレースホルダーとして表示するため、文字色をグレーにする
            color: !isPreviewing ? '#999999' : textStyle.color,
            // @ts-ignore - CSS変数の設定
            '--placeholder-color': item.data?.color || '#999999',
            overflow: 'hidden',
            resize: 'none',
            padding: '10px 12px', // コンテナのパディングの代わりに入力エリアにパディングを設定
            boxSizing: 'border-box', // パディングを含めたサイズ計算にする
            // プレビュー中以外で、かつ編集モードでない場合はクリックを透過させる（ドラッグ移動を優先）
            pointerEvents: !isPreviewing && !isEditing ? 'none' : 'auto',
            // スクロール関連のスタイルをインラインで強制適用
            height: '100%',
            maxHeight: '100%',
            overflowY: 'auto',
            overflowX: 'hidden',
            whiteSpace: 'pre-wrap',
            overflowWrap: 'break-word',
            wordBreak: 'break-all',
          }}
          // エディタモード時はプレースホルダー文字列自体を編集するため、placeholder属性は空にする（重複表示防止）
          placeholder={isPreviewing ? placeholder : ""}
          value={inputValue}
          readOnly={!isPreviewing && !isEditing}
          onCompositionStart={() => isPreviewing && inputTracker.onCompositionStart()}
          onCompositionEnd={() => isPreviewing && inputTracker.onCompositionEnd()}
          onChange={(e) => {
            if (isPreviewing || isEditing) {
              const newValue = e.target.value;
              setInputValue(newValue);
              if (isPreviewing) {
                inputTracker.onInput(newValue); //InputTrackerへ通知
                onVariableChange(variableName, newValue);
                // 入力中にエラーをクリア
                if (error) validate(newValue);
              } else {
                // 編集モード時の変更を反映（プレースホルダーを更新）
                onItemUpdate(item.id, { data: { ...item.data, placeholder: newValue } }, false);
              }
            }
          }}
          onKeyDown={(e) => {
            if (isPreviewing) {
              inputTracker.onKeyDown(e.nativeEvent, inputValue); // KeyDown通知
              if (e.key === "Enter") {
                // 長文テキスト以外の場合のみBlurさせる (textareaは改行)
                if (item.data.inputType !== 'textarea') {
                  e.currentTarget.blur();
                }
                // blurイベントでhandleBlurが呼ばれるため、ここでは呼び出さない
              }
            } else if (isEditing && e.key === "Enter") {
              // 編集モードでのEnterキーは改行として扱う（イベント伝播のみ止める）
              e.stopPropagation();
            }
          }}
          onBlur={() => {
            handleBlur();
            if (!isPreviewing) {
              setIsEditing(false); // 編集モード終了
            }
          }}
          onFocus={() => {
            if (isPreviewing) {
              focusTimeRef.current = Date.now();
            }
          }}
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
      onDoubleClick={() => {
        if (!isPreviewing && item.name.startsWith("テキスト入力欄")) {
          // ダブルクリックで編集モード開始
          setIsEditing(true);
          // ステート更新後にフォーカスを当てる
          setTimeout(() => {
            if (textareaRef.current) {
              textareaRef.current.focus();
              // カーソルを末尾に移動（任意）
              const len = textareaRef.current.value.length;
              textareaRef.current.setSelectionRange(len, len);
            }
          }, 0);
        }
      }}
      onMouseDown={handleMouseDown}
      data-node-id={item.id}
      data-node-name={item.data.customName || item.name}
      data-node-type={item.type || 'unknown'}
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