import React, { useState, useRef, useEffect } from "react";
import { Type, Image as ImageIcon, MousePointerClick } from "lucide-react";
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
  isViewerMode?: boolean; // 追加
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
  isViewerMode = false, // 追加
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
  const x = isMobileView && item.mobileX !== undefined ? item.mobileX : (isMobileView ? item.x * 0.375 : item.x);
  const y = isMobileView && item.mobileY !== undefined ? item.mobileY : (isMobileView ? item.y * 0.375 : item.y);
  const width = isMobileView && item.mobileWidth !== undefined ? item.mobileWidth : (isMobileView ? item.width * 0.375 : item.width);
  const height = isMobileView && item.mobileHeight !== undefined ? item.mobileHeight : (isMobileView ? item.height * 0.375 : item.height);
  
  // 子要素があるかどうかを判定（プレースホルダー表示用）
  const hasChildren = usePageStore((s) => {
    if (!s.selectedPageId) return false;
    return s.pages[s.selectedPageId].placedItems.some(i => i.groupId === item.id);
  });

  // --- スタイルの分離 ---

  // 1. コンテナ用スタイル (位置、サイズ、背景、ボックスシャドウ)
  const containerStyle: React.CSSProperties = {
    width: width,
    height: isAutoHeight ? 'auto' : height,
    minHeight: height,
    display: isGroup ? 'block' : 'flex',
    // テーマ変数の適用
    // テーマ・ページ・アイテムごとのフォント設定
    fontFamily: item.data?.fontFamily || 'var(--page-font-family, var(--theme-font-family, inherit))',
    // @ts-ignore - 個別のborderRadius設定を使用 (data優先、fallback to style)
    borderRadius: item.data?.borderRadius ? `${item.data.borderRadius}px` : ((typeof (item.style as any)?.borderRadius === 'number') ? `${(item.style as any).borderRadius}px` : '0px'),
    // 重なり順 (zIndex)
    zIndex: item.zIndex || 0,
    // 選択時はリサイズハンドルを表示するためoverflowをvisibleに
    // また、プレビュー中の入力欄もスクロールバーを表示するためにvisibleにする
    overflow: ((isSelected && !isPreviewing && !isViewerMode) || (isPreviewing && item.name.startsWith("テキスト入力欄")) || (isViewerMode && item.name.startsWith("テキスト入力欄"))) ? 'visible' : 'hidden',
    // テキスト入力欄またはカスタムHTMLの場合はコンテナのパディングを0にする
    padding: (item.name.startsWith("テキスト入力欄") || item.type === 'custom_html') ? 0 : undefined,
    // 公開ビュワーモードではcursorをdefaultにする（ボタン等は別途設定）
    cursor: isViewerMode ? 'default' : undefined,
  };

  // 背景色（isTransparentがtrueの場合は強制的にtransparent）
  if (item.data?.isTransparent === true) {
    containerStyle.backgroundColor = 'transparent';
  } else if (item.data?.backgroundColor) {
    // プロパティパネルで設定された背景色
    const baseColor = item.data.backgroundColor;
    // 背景の不透明度が設定されている場合はrgbaに変換
    // ぼかしが設定されている場合、不透明度が指定されていなければデフォルトで半透明(0.5)にする
    const opacity = item.data.backgroundOpacity ?? (item.data.backdropBlur ? 0.5 : 1);
    
    if (opacity < 1) {
      // Hex to RGBA conversion
      const color = baseColor.replace('#', '');
      const r = parseInt(color.substring(0, 2), 16);
      const g = parseInt(color.substring(2, 4), 16);
      const b = parseInt(color.substring(4, 6), 16);
      containerStyle.backgroundColor = `rgba(${r}, ${g}, ${b}, ${opacity})`;
    } else {
      containerStyle.backgroundColor = baseColor;
    }
  } else if (item.style?.backgroundColor) {
    containerStyle.backgroundColor = item.style.backgroundColor;
  } else if (item.data?.backdropBlur) {
    // ぼかしがあるが背景色が指定されていない場合、デフォルトの半透明背景を付与
    containerStyle.backgroundColor = 'rgba(255, 255, 255, 0.3)';
  }

  // 背面のぼかし (Backdrop Blur)
  if (item.data?.backdropBlur) {
    containerStyle.backdropFilter = `blur(${item.data.backdropBlur}px)`;
    containerStyle.WebkitBackdropFilter = `blur(${item.data.backdropBlur}px)`;
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
    containerStyle.position = 'absolute';
    containerStyle.left = itemState.x;
    containerStyle.top = itemState.y;
    containerStyle.visibility = itemState.isVisible ? 'visible' : 'hidden';
    containerStyle.opacity = itemState.opacity;
    containerStyle.transform = `scale(${itemState.scale}) rotate(${itemState.rotation}deg)`;
    containerStyle.transition = itemState.transition || 'none';
  } else {
    containerStyle.position = 'absolute';
    containerStyle.left = x;
    containerStyle.top = y;
    // エディタモードではカスタムCSSによる意図しないトランジションを防止
    containerStyle.transition = 'none !important';

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
    fontSize: isMobileView ? `${item.mobileFontSize ?? (item.data?.fontSize || 15) * 0.7}px` : `${item.data?.fontSize || 15}px`,
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
  // バリデーション関数 (validation.tsを使用)
  const validate = (val: string) => {
    // 編集モード（エディタの非プレビュー時）は何もしない
    if (!isPreviewing && !isViewerMode) return true;

    const errorMsg = validateInput(val, {
      required: !!item.data.required,
      inputType: item.data.inputType,
      enableCountryCode: item.data.enableCountryCode
    });

    setError(errorMsg);
    
    // Store側のプレビュー状態にもエラーを反映させる（共有化のため）
    if (isPreviewing || isViewerMode) {
      // 実際には previewState を更新するアクションが必要だが、
      // 簡易的にコンポーネント内ステートで管理しつつ、
      // 必要があれば親に通知する仕組みを検討
    }
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
    // 公開ビュワーまたはプレビューモードの場合
    if (isViewerMode || isPreviewing) {
      if (e.target instanceof HTMLTextAreaElement) return;

      console.log("📍 Item clicked (Viewer/Preview):", item.name, item.id);

      // 自爆バリデーション (PreviewItem.tsxから移植)
      if (item.data.linkUrl || item.data.actionType === 'submit') {
        const { pages, selectedPageId } = usePageStore.getState();
        const currentPage = pages[selectedPageId!];
        
        if (currentPage) {
          let hasValidationError = false;
          const currentVars = usePreviewStore.getState().variables;

          // ページ内の全入力項目をチェック
          currentPage.placedItems.forEach((pi: PlacedItemType) => {
            const isInputItem = pi.name.startsWith("テキスト入力欄") || pi.type === 'input';
            if (isInputItem) {
              const vName = pi.data.variableName || pi.id;
              const val = currentVars[vName];
              const errorMsg = validateInput(val, {
                required: !!pi.data.required,
                inputType: pi.data.inputType,
                enableCountryCode: pi.data.enableCountryCode
              });

              if (errorMsg) {
                hasValidationError = true;
                // 注意: ここで store を直接たたくか、prop経由で通知するか
                // とりあえず previewState がある場合は、個別の項目のエラーとして表示されるように期待
              }
            }
          });

          if (hasValidationError) {
            console.warn('🛑 Validation failed. Blocking action.');
            // エラー表示のステート更新ロジックは別途検討（現状はPreviewItemと同様の動きを目指す）
            return;
          }
        }
      }

      // 隠し変数の保存
      if (item.data.variableName && item.data.variableValue !== undefined && item.data.variableValue !== "") {
        onVariableChange(item.data.variableName, item.data.variableValue);
      }

      // 外部リンク遷移
      if (item.data.linkUrl) {
        if (item.data.linkUrl.startsWith('http://') || item.data.linkUrl.startsWith('https://')) {
          window.open(item.data.linkUrl, '_blank', 'noopener,noreferrer');
        }
      }

      // ワンクリック送信 (Simplified CV)
      if (item.data.actionType === 'submit') {
        console.log('🚀 One-Click Submit Triggered');
        onItemEvent("click", item.id); // スコア加算

        try {
          const variables = usePreviewStore.getState().variables;
          const submitData = { ...variables };
          let projectId: string | undefined = useProjectStore.getState().currentProjectId || usePreviewStore.getState().projectId || undefined;
          
          if (!projectId) {
            const params = new URLSearchParams(window.location.search);
            projectId = params.get('project_id') || undefined;
          }

          const { submitLeadData } = await import("../../lib/leads");
          await submitLeadData(submitData, projectId);

          if (item.data.submitRedirectUrl) {
            window.location.href = item.data.submitRedirectUrl;
          } else {
            alert('送信しました！');
          }
        } catch (err) {
          console.error('❌ Submit Failed:', err);
          alert('送信に失敗しました。');
        }
        return;
      }

      onItemEvent("click", item.id);
    } else {
      // エディタモード
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

  // アニメーションクラスの追加
  if (item.data?.animationType && item.data.animationType !== 'none') {
    itemClassName += ` animate-${item.data.animationType}`;
    containerStyle.animationDuration = `${item.data.animationDuration ?? 0.5}s`;
    // プレビュー中でない（エディタモード）場合は一度だけ再生させるか、
    // あるいはアニメーションを無効化する選択肢もありますが、
    // ここでは単純にクラスを追加します。
  }

  const [showQuickAdd, setShowQuickAdd] = useState(false);

  // クイック追加アクション
  const handleQuickAdd = (type: string) => {
    const timestamp = Date.now();
    const id = `${type}-${timestamp}`;
    
    let newItem: PlacedItemType = {
      id,
      name: `${type === 'text' ? 'テキスト' : type === 'image' ? '画像' : 'ボタン'}-${timestamp}`,
      type: type as any,
      groupId: item.id,
      x: 20,
      y: 20,
      width: type === 'image' ? 100 : 160,
      height: type === 'image' ? 100 : 40,
      position: { x: 20, y: 20 },
      size: { width: type === 'image' ? 100 : 160, height: type === 'image' ? 100 : 40 },
      zIndex: 10,
      data: {
        text: type === 'text' ? '新しいテキスト' : type === 'button' ? 'ボタン' : '',
        fontSize: 16,
        backgroundColor: type === 'button' ? '#3b82f6' : undefined,
        textColor: type === 'button' ? '#ffffff' : '#333333',
        borderRadius: type === 'button' ? 4 : 0,
      }
    };

    usePageStore.getState().addItem(newItem);
    setShowQuickAdd(false);
  };

  if (isGroup) {
    content = null;
  } else if (item.type === 'box' || item.name.startsWith("ボックス") || (item.name.startsWith("テキスト入力欄") === false && item.type === 'box')) {
    // ボックス (カラム等のコンテナとしても使用)
    content = (
      <div 
        className="item-box-content" 
        style={{ 
          width: '100%', 
          height: '100%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          position: 'relative'
        }}
        onClick={(e) => {
          if (!isPreviewing && item.data?.isPlaceholder && !hasChildren) {
            e.stopPropagation();
            setShowQuickAdd(!showQuickAdd);
          }
        }}
      >
          {/* プレースホルダー表示（エディタモードのみ、かつ子要素がなく、かつプレースホルダーフラグがある場合） */}
          {(!isPreviewing && item.data?.isPlaceholder && !hasChildren) && (
            <div 
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                color: '#8b5cf6',
                opacity: 0.8,
                cursor: 'pointer'
              }}
            >
            <div style={{ 
              width: '40px', 
              height: '40px', 
              borderRadius: '50%', 
              border: '2px dashed #8b5cf6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              fontWeight: 'bold',
              backgroundColor: showQuickAdd ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
              transition: 'all 0.2s'
            }}>+</div>
            <span style={{ fontSize: '11px', fontWeight: '600' }}>要素を追加</span>
          </div>
        )}

        {/* クイック追加メニュー */}
        {showQuickAdd && (
          <div 
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
              padding: '12px',
              display: 'flex',
              gap: '12px',
              zIndex: 100,
              border: '1px solid #e5e7eb',
              animation: 'fadeIn 0.2s ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => handleQuickAdd('text')}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '8px', transition: 'background 0.2s' }}
              className="quick-add-btn"
            >
              <Type size={20} color="#4b5563" />
              <span style={{ fontSize: '10px', color: '#6b7280' }}>テキスト</span>
            </button>
            <button 
              onClick={() => handleQuickAdd('image')}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '8px', transition: 'background 0.2s' }}
              className="quick-add-btn"
            >
              <ImageIcon size={20} color="#4b5563" />
              <span style={{ fontSize: '10px', color: '#6b7280' }}>画像</span>
            </button>
            <button 
              onClick={() => handleQuickAdd('button')}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '8px', transition: 'background 0.2s' }}
              className="quick-add-btn"
            >
              <MousePointerClick size={20} color="#4b5563" />
              <span style={{ fontSize: '10px', color: '#6b7280' }}>ボタン</span>
            </button>
          </div>
        )}
      </div>
    );
  } else if (item.name.startsWith("ボタン")) {
    content = (
      <button className="item-button-content" style={textStyle}>
        {item.data.text}
      </button>
    );
    containerStyle.height = height;
    containerStyle.minHeight = undefined;
    if (item.data?.src) {
      // 画像の縦横比（aspect-ratio）
      const pcWidth = item.width ?? 100;
      const pcHeight = item.height ?? 100;
      const imageAspectRatio = pcWidth > 0 && pcHeight > 0 ? `${pcWidth} / ${pcHeight}` : undefined;

      content = (
        <div className="item-image-content">
          <img 
            src={item.data.src} 
            alt={item.data.text} 
            draggable={false} 
            style={{ 
              aspectRatio: imageAspectRatio, 
              width: '100%', 
              height: '100%', 
              objectFit: 'contain' 
            }}
            onLoad={() => {
              if (isPreviewing || isViewerMode) {
                onItemEvent("onImageLoad", item.id);
              }
            }}
          />
        </div>
      );
    } else {
      content = (
        <div className="item-image-content is-placeholder">
          🖼️ 画像をドロップ
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
            pointerEvents: (!isPreviewing && !isViewerMode && !isEditing) ? 'none' : 'auto',
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
          placeholder={(isPreviewing || isViewerMode) ? placeholder : ""}
          value={inputValue}
          readOnly={!isPreviewing && !isViewerMode && !isEditing}
          onCompositionStart={() => (isPreviewing || isViewerMode) && inputTracker.onCompositionStart()}
          onCompositionEnd={() => (isPreviewing || isViewerMode) && inputTracker.onCompositionEnd()}
          onChange={(e) => {
            if (isPreviewing || isViewerMode || isEditing) {
              const newValue = e.target.value;
              setInputValue(newValue);
              if (isPreviewing || isViewerMode) {
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
            if (isPreviewing || isViewerMode) {
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
            if (!isPreviewing && !isViewerMode) {
              setIsEditing(false); // 編集モード終了
            }
          }}
          onFocus={() => {
            if (isPreviewing || isViewerMode) {
              focusTimeRef.current = Date.now();
            }
          }}
          onClick={(e) => {
            if (!isPreviewing && !isViewerMode) {
              e.stopPropagation();
              onItemSelect(e, item.id, item.data.text || item.name);
            }
          }}
          onMouseDown={(e) => e.stopPropagation()}
        />
      </div>
    );
  } else if (item.type === 'custom_html') {
    content = (
      <div 
        className="item-custom-html-content" 
        style={{ width: '100%', height: '100%', overflow: isPreviewing ? 'auto' : 'hidden' }}
        dangerouslySetInnerHTML={{ __html: item.data.html || "" }}
      />
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
      {!isViewerMode && renderChildren(item.id)}

      {isSelected && !isPreviewing && !isViewerMode && (
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