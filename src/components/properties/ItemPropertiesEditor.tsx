import React, { useState, useEffect, useRef, useCallback } from "react";
import type { PlacedItemType } from "../../types";
import { AccordionSection } from "./SharedComponents";
import { useSelectionStore } from '../../stores/useSelectionStore';
import { usePageStore } from "../../stores/usePageStore";

import ImageCropModal from "../ImageCropModal";
// 型定義のために必要ならインポート
import type { Crop } from 'react-image-crop';

// 型定義の補完（types.tsを変更せずに対応）
type ItemStyle = NonNullable<PlacedItemType['style']> & { borderRadius?: number | string };

interface ItemPropertiesEditorProps {
  item: PlacedItemType;
  onItemUpdate: (id: string, updates: Partial<PlacedItemType> | { data: any }, options?: { addToHistory?: boolean; immediate?: boolean }) => void;
  onItemMoveToFront: (id: string) => void;
  onItemMoveToBack: (id: string) => void;
  onItemMoveForward: (id: string) => void;
  onItemMoveBackward: (id: string) => void;
}

// カスタムフック：ローカル状態と画像アップロードロジックの分離
const useItemEditorLogic = (item: PlacedItemType, onItemUpdate: ItemPropertiesEditorProps['onItemUpdate']) => {
  const [localRect, setLocalRect] = useState({ x: item.x, y: item.y, w: item.width, h: item.height });
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    setLocalRect({ x: item.x, y: item.y, w: item.width, h: item.height });
  }, [item.id, item.x, item.y, item.width, item.height]);

  const ratioToUse = item.data?.originalAspectRatio || ((item.width && item.height) ? item.height / item.width : 1);

  // 位置・サイズ変更ハンドラ
  const handleRectChange = (key: keyof typeof localRect, val: number) => {
    setLocalRect(prev => ({ ...prev, [key]: val }));
    if (key === 'w' && item.data?.keepAspectRatio) {
      setLocalRect(prev => ({ ...prev, h: Math.round(val * ratioToUse) }));
    }
    if (key === 'h' && item.data?.keepAspectRatio) {
      setLocalRect(prev => ({ ...prev, w: Math.round(val / ratioToUse) }));
    }
  };

  const commitRectChange = (key: keyof typeof localRect) => {
    let val = localRect[key];
    if (key === 'w' || key === 'h') val = Math.max(1, val || 1);
    else val = isNaN(val) ? 0 : val;

    if (item.data?.keepAspectRatio && (key === 'w' || key === 'h')) {
      const w = key === 'w' ? val : Math.round(val / ratioToUse);
      const h = key === 'h' ? val : Math.round(val * ratioToUse);
      onItemUpdate(item.id, { width: w, height: h }, { addToHistory: true, immediate: true });
      setLocalRect(prev => ({ ...prev, w, h }));
    } else {
      const propMap = { x: 'x', y: 'y', w: 'width', h: 'height' };
      onItemUpdate(item.id, { [propMap[key]]: val }, { addToHistory: true, immediate: true });
    }
  };

  // ★共通処理: 画像URLをアイテムに適用するロジック
  const applyImageToItem = (srcToUse: string, originalSrcToUse: string) => {
    console.log('🎨 applyImageToItem開始:', {
      srcLength: srcToUse.length,
      originalSrcLength: originalSrcToUse.length
    });

    const img = new Image();
    img.onload = () => {
      console.log('✅ 画像ロード成功:', {
        width: img.width,
        height: img.height
      });

      const MAX_W = 450, MAX_H = 300;
      let w = img.width, h = img.height;
      const ratio = h / w;

      console.log('📐 元のサイズ:', { w, h, ratio });

      if (w / MAX_W > 1 || h / MAX_H > 1) {
        if (w / MAX_W > h / MAX_H) { w = MAX_W; h = img.height * (MAX_W / img.width); }
        else { h = MAX_H; w = img.width * (MAX_H / img.height); }
      }

      console.log('📐 調整後のサイズ:', { w, h });

      onItemUpdate(item.id, {
        data: {
          ...item.data,
          src: srcToUse,
          originalSrc: originalSrcToUse,
          originalAspectRatio: ratio,
          keepAspectRatio: true,
          isTransparent: false,
          cropState: null, // 新しい画像になったらクロップ状態はリセット
        },
        width: Math.round(w), height: Math.round(h),
      });

      console.log('✅ アイテム更新完了');
      setIsUploading(false);
    };
    img.onerror = (event) => {
      console.error('❌ 画像ロードエラー:', event);
      console.error('❌ img.src:', img.src.substring(0, 100) + '...');
      console.error('❌ srcToUse (first 100 chars):', srcToUse.substring(0, 100));
      alert("画像の読み込みに失敗しました");
      setIsUploading(false);
    };
    img.src = srcToUse;
    console.log('🔄 画像ロード開始...');
  };

  // Web用: 画像アップロード
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('📸 画像アップロード開始');
    const file = e.target.files?.[0];
    console.log('📸 選択されたファイル:', file);

    if (!file) {
      console.warn('⚠️ ファイルが選択されていません');
      return;
    }

    if (!file.type.startsWith("image/")) {
      console.error('❌ 画像ファイルではありません:', file.type);
      alert("5MB以下の画像ファイルを選択してください");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      console.error('❌ ファイルサイズが大きすぎます:', file.size);
      alert("5MB以下の画像ファイルを選択してください");
      return;
    }

    console.log('✅ ファイル検証成功:', {
      name: file.name,
      type: file.type,
      size: file.size,
      sizeKB: Math.round(file.size / 1024) + 'KB'
    });

    setIsUploading(true);

    const readAsDataURL = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    };

    try {
      console.log('🔄 Base64エンコード開始...');
      // ★修正: Supabaseアップロードを無効化し、常にBase64として保存
      const srcToUse = await readAsDataURL(file);
      console.log('✅ Base64エンコード完了:', {
        dataUrlLength: srcToUse.length,
        preview: srcToUse.substring(0, 50) + '...'
      });

      console.log('🖼️ applyImageToItem呼び出し中...');
      applyImageToItem(srcToUse, srcToUse);
      console.log('✅ 画像アップロード完了');
    } catch (err: any) {
      console.error('❌ 画像アップロードエラー:', err);
      alert("画像の読み込みに失敗しました: " + err.message);
      setIsUploading(false);
    } finally {
      e.target.value = "";
    }
  };

  return { localRect, handleRectChange, commitRectChange, handleImageUpload, isUploading };
};

type TabType = 'content' | 'design' | 'settings';

export const ItemPropertiesEditor: React.FC<ItemPropertiesEditorProps> = (props) => {
  const { item, onItemUpdate } = props;
  const { localRect, handleRectChange, commitRectChange, handleImageUpload, isUploading } = useItemEditorLogic(item, onItemUpdate);
  const [activeTab, setActiveTab] = useState<TabType>('content');  // useProjectStoreからテーマ情報を取得
  /* useProjectStoreフック削除（テーマ参照不要） */


  // ローカルステート（トリミングモーダル）
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);

  const updateTabLabel = useSelectionStore(state => state.updateTabLabel);
  const commitHistory = usePageStore(state => state.commitHistory);

  // onChange: 状態のみ更新（履歴には保存しない）
  const handleDataChange = (name: string, value: any) => {
    onItemUpdate(item.id, { data: { ...item.data, [name]: value } });
  };

  // onBlur: 履歴に保存
  const handleDataBlur = () => {
    onItemUpdate(item.id, {}, { addToHistory: true, immediate: true });
  };

  const handleNameChange = (newDisplayName: string) => {
    onItemUpdate(item.id, { displayName: newDisplayName });
    const displayLabel = newDisplayName ? item.name + ": " + newDisplayName : item.name;
    updateTabLabel(item.id, displayLabel);
  };

  const handleNameBlur = () => {
    commitHistory(false);
  };

  const handleStyleChange = useCallback((key: keyof ItemStyle, subKey: string, value: any, addToHistory = true) => {
    if (!item) return;

    let newStyle: ItemStyle = { ...item.style };

    // undefined (同期モードへの切り替え) の場合はプロパティを削除する
    if (value === undefined) {
      if (subKey) {
        if (newStyle[key]) {
          delete (newStyle[key] as any)[subKey];
          // サブキーがなくなったら親キーも消す判定が必要だが、今回は簡易的に
        }
      } else {
        delete newStyle[key];
      }
    } else {
      if (subKey) {
        // ネストされたプロパティの更新 (shadow, glowなど)
        newStyle[key] = {
          ...((newStyle[key] as any) || {}),
          [subKey]: value
        };
      } else {
        // トップレベルプロパティの更新
        newStyle[key] = value;
      }
    }

    onItemUpdate(item.id, { style: newStyle }, { addToHistory });
  }, [item, onItemUpdate]);



  const handleStyleBlur = () => {
    onItemUpdate(item.id, {}, { addToHistory: true, immediate: true });
  };

  // トリミング完了ハンドラ
  // ★変更: Match機能と同じ精密計算ロジックを使用してリサイズを行う
  const handleCropComplete = async (croppedImageUrl: string, cropState: { crop: Crop, zoom: number }) => {
    try {
      // 1. 画像をロードして naturalWidth/naturalHeight を取得
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('画像のロードに失敗しました'));
        img.src = croppedImageUrl;
      });

      // 2. アスペクト比を計算
      const aspectRatio = img.naturalHeight / img.naturalWidth;

      // 3. Match機能と同じロジックで高さを計算 (padding/border考慮)
      // Artboard.css に基づき、枠線は常に4px(透明含む)、パディングは24px/20px
      const BORDER_W = 4; // CSSで固定されているため
      const PADDING_X = 24;
      const PADDING_Y = 20;

      const imageDisplayWidth = item.width - BORDER_W - PADDING_X;

      let newHeight = item.height;
      if (imageDisplayWidth > 0) {
        const requiredImageHeight = imageDisplayWidth * aspectRatio;
        newHeight = Math.round(requiredImageHeight + BORDER_W + PADDING_Y);
      }

      // 4. 一括更新（data、width、height）
      onItemUpdate(item.id, {
        data: {
          ...item.data,
          src: croppedImageUrl,
          cropState: cropState, // ★状態を保存
          originalAspectRatio: aspectRatio, // ★新しいアスペクト比を保存
        },
        width: item.width, // 幅は維持
        height: newHeight, // 高さを再計算
      });

      setIsCropModalOpen(false);
      commitHistory(false);
    } catch (error) {
      console.error('トリミング処理中にエラーが発生しました:', error);
      alert('画像のトリミング処理に失敗しました。');
    }
  };

  // 画像サイズをアスペクト比に合わせるハンドラ（枠線とパディングを考慮）
  const handleMatchSize = async () => {
    if (!item.data?.src) {
      alert('画像が設定されていません。');
      return;
    }

    try {
      const img = new Image();
      const imageSrc = item.data.src;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('画像のロードに失敗しました'));
        img.src = imageSrc;
      });

      // 定数の定義 (Artboard.cssに準拠)
      // showBorderがfalseでもCSSクラス'.no-border'は'border-color: transparent'のみで
      // 'border-width'は維持されるため、BORDER_Wは常に4とする。
      const BORDER_W = 4;
      const PADDING_X = 24; // (12px + 12px)
      const PADDING_Y = 20; // (10px + 10px)

      const imageDisplayWidth = item.width - BORDER_W - PADDING_X;

      if (imageDisplayWidth <= 0) {
        alert('要素の幅が小さすぎて画像を表示できません。');
        return;
      }

      const aspectRatio = img.naturalHeight / img.naturalWidth;
      const requiredImageHeight = imageDisplayWidth * aspectRatio;
      const newHeight = Math.round(requiredImageHeight + BORDER_W + PADDING_Y);

      onItemUpdate(item.id, {
        height: newHeight,
      });

      commitHistory(false);
    } catch (error) {
      console.error('画像サイズの調整中にエラーが発生しました:', error);
      alert('画像サイズの調整に失敗しました。');
    }
  };

  return (
    <div className="properties-panel-content" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 0 }}>
      {/* タブヘッダー */}
      <div className="prop-tabs-root">
        <button
          className={`prop-tab-btn ${activeTab === 'content' ? 'active' : ''}`}
          onClick={() => setActiveTab('content')}
        >
          コンテンツ
        </button>
        <button
          className={`prop-tab-btn ${activeTab === 'design' ? 'active' : ''}`}
          onClick={() => setActiveTab('design')}
        >
          デザイン
        </button>
        <button
          className={`prop-tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          設定
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>

        {/* --- Content Tab --- */}
        {activeTab === 'content' && (
          <>
            <AccordionSection title="基本情報" defaultOpen={true}>
              <div className="prop-group">
                <div className="prop-label">要素タイプ (Type)</div>
                <input
                  type="text"
                  className="prop-input prop-input-disabled"
                  value={item.name}
                  disabled
                />
                <div style={{ fontSize: '10px', color: '#666', marginTop: 4 }}>
                  要素のタイプ（変更不可）
                </div>
              </div>
              <div className="prop-group" style={{ marginTop: 12 }}>
                <div className="prop-label">カスタム名 (Display Name)</div>
                <input
                  type="text"
                  className="prop-input"
                  value={item.displayName || ''}
                  onChange={(e) => handleNameChange(e.target.value)}
                  onBlur={handleNameBlur}
                  placeholder="わかりやすい名前を入力（任意）"
                />
                <div style={{ fontSize: '10px', color: '#666', marginTop: 4 }}>
                  確認画面や送信データで表示される名前です（例: メールアドレス、お名前）
                </div>
              </div>
            </AccordionSection>

            {/* テキスト/ボタンの内容（テキスト入力欄は除外） */}
            {(item.name.startsWith("テキスト") || item.name.startsWith("ボタン")) &&
              !item.name.startsWith("テキスト入力欄") && (
                <AccordionSection title="テキスト内容" defaultOpen={true}>
                  <div className="prop-group">
                    <div className="prop-label">
                      {item.name.startsWith("ボタン") ? "ボタンテキスト" : "表示テキスト"}
                    </div>
                    <textarea
                      className="prop-textarea"
                      value={item.data?.text || ""}
                      onChange={(e) => handleDataChange("text", e.target.value)}
                      onBlur={handleDataBlur}
                      rows={4}
                    />
                  </div>
                </AccordionSection>
              )}

            {/* 画像ソース */}
            {item.name.startsWith("画像") && (
              <AccordionSection title="画像素材" defaultOpen={true}>
                <div className="prop-group">
                  {/* 通常のfile input（すべての環境で使用） */}
                  <label
                    className="prop-button"
                    style={{ opacity: isUploading ? 0.6 : 1, cursor: isUploading ? 'not-allowed' : 'pointer' }}
                  >
                    {isUploading ? "アップロード中..." : "画像を選択 / アップロード"}
                    <input type="file" style={{ display: "none" }} accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                  </label>
                </div>
                {item.data?.src && (
                  <div className="prop-group">
                    <img src={item.data.src} alt="Preview" className="prop-image-preview" />

                    {/* トリミング・Matchボタン */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                      <button
                        className="prop-button"
                        onClick={() => setIsCropModalOpen(true)}
                        style={{ flex: 1, minWidth: '140px' }}
                      >
                        ✂️ 画像をトリミング
                      </button>
                      <button
                        className="prop-button"
                        onClick={handleMatchSize}
                        style={{ flex: 1, minWidth: '140px' }}
                        title="画像のアスペクト比に合わせて要素サイズを調整"
                      >
                        📐 Match
                      </button>
                    </div>

                    <button className="prop-button-danger" onClick={() => handleDataChange("src", null)}>画像を削除</button>
                  </div>
                )}
              </AccordionSection>
            )}

            {/* 入力欄設定 */}
            {item.name.startsWith("テキスト入力欄") && (
              <AccordionSection title="入力フォーム設定" defaultOpen={true}>
                <div className="prop-group">
                  <div className="prop-label">プレースホルダー</div>
                  <input type="text" className="prop-input" value={item.data?.placeholder || ""} onChange={(e) => handleDataChange("placeholder", e.target.value)} />
                </div>
                <div className="prop-group">
                  <div className="prop-label">入力タイプ</div>
                  <select
                    className="prop-select"
                    value={item.data?.inputType || "text"}
                    onChange={(e) => handleDataChange("inputType", e.target.value)}
                  >
                    <option value="text">通常テキスト</option>
                    <option value="email">メールアドレス</option>
                    <option value="number">数値</option>
                    <option value="tel">電話番号</option>
                  </select>
                </div>
                <div className="prop-group">
                  <div className="prop-label">変数名 (Variable Name)</div>
                  <input
                    type="text"
                    className="prop-input"
                    value={item.data?.variableName || ""}
                    onChange={(e) => handleDataChange("variableName", e.target.value)}
                    onBlur={handleDataBlur}
                    placeholder="例: email, age"
                  />
                  <div style={{ fontSize: '10px', color: '#ff6b6b', marginTop: 4 }}>
                    ※ 同じ変数名は使用しないでください。
                  </div>
                </div>
                {item.data?.inputType === 'email' && (
                  <div style={{ fontSize: '11px', color: '#888', marginTop: 4, marginBottom: 8 }}>
                    ℹ️ メールアドレスは@を含む形式でドメインチェックが行われます
                  </div>
                )}
                {item.data?.inputType === 'tel' && (
                  <CheckboxProp
                    label="国コード選択を有効にする"
                    checked={!!item.data?.enableCountryCode}
                    onChange={(v) => handleDataChange("enableCountryCode", v)}
                    onBlur={handleDataBlur}
                  />
                )}
                <CheckboxProp
                  label="必須入力にする"
                  checked={!!item.data?.required}
                  onChange={(v) => handleDataChange("required", v)}
                  onBlur={handleDataBlur}
                />
              </AccordionSection>
            )}
          </>
        )}

        {/* --- Design Tab --- */}
        {activeTab === 'design' && (
          <>
            {/* ... Design Tab Content ... */}
            {/* ... Design Tab Content ... */}
            <AccordionSection title="塗り・背景・角丸" defaultOpen={true}>
              {/* 背景色 */}
              <div className="prop-group">
                <div className="prop-label">背景色</div>
                <div className="prop-color-picker-wrapper">
                  <ThrottledColorInput
                    className="prop-color-picker"
                    value={item.style?.backgroundColor || "#ffffff"}
                    onChange={(val) => handleStyleChange('backgroundColor', '', val)}
                    onBlur={handleStyleBlur}
                  />
                  <input
                    type="text"
                    className="prop-input"
                    style={{ flexGrow: 1 }}
                    value={item.style?.backgroundColor || ""}
                    placeholder="transparent"
                    onChange={(e) => handleStyleChange('backgroundColor', '', e.target.value)}
                    onBlur={handleStyleBlur}
                  />
                </div>
              </div>

              {/* 角丸 */}
              <div className="prop-group" style={{ marginTop: 12 }}>
                <div className="prop-label">角丸 (Radius)</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="range"
                    min="0" max="50"
                    className="prop-range"
                    style={{ flex: 1 }}
                    // @ts-ignore
                    value={typeof (item.style as any)?.borderRadius === 'number' ? (item.style as any).borderRadius : 0}
                    // @ts-ignore
                    onChange={(e) => handleStyleChange('borderRadius', '', parseInt(e.target.value))}
                    onMouseUp={handleStyleBlur}
                  />
                  <NumberInput
                    label=""
                    // @ts-ignore
                    value={typeof (item.style as any)?.borderRadius === 'number' ? (item.style as any).borderRadius : 0}
                    // @ts-ignore
                    onChange={(v) => handleStyleChange('borderRadius', '', v)}
                    onBlur={handleStyleBlur}
                  />
                </div>
              </div>

              <div className="prop-separator" />
              <CheckboxProp label="背景を透過しない(不透明)" checked={!item.data?.isTransparent} onChange={(v) => handleDataChange("isTransparent", !v)} onBlur={handleDataBlur} />
            </AccordionSection>

            {/* Typography */}
            {(item.name.startsWith("テキスト") || item.name.startsWith("ボタン") || item.name.startsWith("テキスト入力欄")) && (
              <AccordionSection title="文字スタイル" defaultOpen={true}>
                <div className="prop-group">
                  <label className="prop-label">文字色</label>
                  <div className="prop-color-picker-wrapper">
                    <ThrottledColorInput
                      className="prop-color-picker"
                      value={item.data?.color || "#333333"}
                      onChange={(val) => handleDataChange("color", val)}
                      onBlur={handleDataBlur}
                    />
                    <input
                      type="text"
                      className="prop-input"
                      style={{ flexGrow: 1 }}
                      value={item.data?.color || "#333333"}
                      onChange={(e) => handleDataChange("color", e.target.value)}
                      onBlur={handleDataBlur}
                    />
                  </div>
                </div>
                <div className="prop-group">
                  <label className="prop-label">フォントサイズ (px)</label>
                  <FontSizeInput
                    value={item.data?.fontSize ?? 15}
                    onChange={(value) => handleDataChange("fontSize", value)}
                    onBlur={handleDataBlur}
                  />
                </div>

                <div style={{ marginTop: 15, borderTop: '1px solid #333', paddingTop: 10 }}>
                  <CheckboxProp label="文字の影 (Text Shadow)" checked={!!item.style?.textShadow?.enabled} onChange={(v) => handleStyleChange('textShadow', 'enabled', v)} onBlur={handleStyleBlur} />
                  {item.style?.textShadow?.enabled && (
                    <div style={{ paddingLeft: 10, marginBottom: 10 }}>
                      <div className="prop-row">
                        <NumberInput label="X" value={item.style.textShadow.x || 0} onChange={(v) => handleStyleChange('textShadow', 'x', v)} onBlur={handleStyleBlur} />
                        <NumberInput label="Y" value={item.style.textShadow.y || 0} onChange={(v) => handleStyleChange('textShadow', 'y', v)} onBlur={handleStyleBlur} />
                      </div>
                      <div className="prop-row" style={{ marginTop: 5 }}>
                        <NumberInput label="Blur" value={item.style.textShadow.blur || 0} onChange={(v) => handleStyleChange('textShadow', 'blur', v)} onBlur={handleStyleBlur} />
                        <ColorInput label="Color" value={item.style.textShadow.color || "#000000"} onChange={(v) => handleStyleChange('textShadow', 'color', v)} onBlur={handleStyleBlur} />
                      </div>
                    </div>
                  )}

                  <CheckboxProp label="文字の光彩 (Text Glow)" checked={!!item.style?.textGlow?.enabled} onChange={(v) => handleStyleChange('textGlow', 'enabled', v)} onBlur={handleStyleBlur} />
                  {item.style?.textGlow?.enabled && (
                    <div style={{ paddingLeft: 10 }}>
                      <div className="prop-row">
                        <NumberInput label="Blur" value={item.style.textGlow.blur || 0} onChange={(v) => handleStyleChange('textGlow', 'blur', v)} onBlur={handleStyleBlur} />
                        <ColorInput label="Color" value={item.style.textGlow.color || "#ffffff"} onChange={(v) => handleStyleChange('textGlow', 'color', v)} onBlur={handleStyleBlur} />
                      </div>
                    </div>
                  )}
                </div>
              </AccordionSection>
            )}

            {/* Effects */}
            <AccordionSection title="エフェクト (Effects)" defaultOpen={false}>
              <CheckboxProp label="枠線を表示 (Border)" checked={item.data?.showBorder !== false} onChange={(v) => handleDataChange("showBorder", v)} onBlur={handleDataBlur} />

              <div className="prop-separator" />

              <CheckboxProp label="ドロップシャドウ (Box Shadow)" checked={!!item.style?.shadow?.enabled} onChange={(v) => handleStyleChange('shadow', 'enabled', v)} onBlur={handleStyleBlur} />
              {item.style?.shadow?.enabled && (
                <div style={{ paddingLeft: 10, marginBottom: 12 }}>
                  <div className="prop-row">
                    <NumberInput label="X" value={item.style.shadow.x || 0} onChange={(v) => handleStyleChange('shadow', 'x', v)} onBlur={handleStyleBlur} />
                    <NumberInput label="Y" value={item.style.shadow.y || 0} onChange={(v) => handleStyleChange('shadow', 'y', v)} onBlur={handleStyleBlur} />
                  </div>
                  <div className="prop-row" style={{ marginTop: 5 }}>
                    <NumberInput label="Blur" value={item.style.shadow.blur || 0} onChange={(v) => handleStyleChange('shadow', 'blur', v)} onBlur={handleStyleBlur} />
                    <ColorInput label="Color" value={item.style.shadow.color || "#000000"} onChange={(v) => handleStyleChange('shadow', 'color', v)} onBlur={handleStyleBlur} />
                  </div>
                </div>
              )}

              <CheckboxProp label="光彩 (Box Glow)" checked={!!item.style?.glow?.enabled} onChange={(v) => handleStyleChange('glow', 'enabled', v)} onBlur={handleStyleBlur} />
              {item.style?.glow?.enabled && (
                <div style={{ paddingLeft: 10 }}>
                  <div className="prop-row">
                    <NumberInput label="Blur" value={item.style.glow.blur || 0} onChange={(v) => handleStyleChange('glow', 'blur', v)} onBlur={handleStyleBlur} />
                    <NumberInput label="Spread" value={item.style.glow.spread || 0} onChange={(v) => handleStyleChange('glow', 'spread', v)} onBlur={handleStyleBlur} />
                  </div>
                  <div style={{ marginTop: 5 }}>
                    <ColorInput label="Color" value={item.style.glow.color || "#ffffff"} onChange={(v) => handleStyleChange('glow', 'color', v)} onBlur={handleStyleBlur} />
                  </div>
                </div>
              )}
            </AccordionSection>
          </>
        )}

        {/* --- Settings Tab --- */}
        {activeTab === 'settings' && (
          <>
            {/* ... Settings Tab Content ... */}
            <AccordionSection title="位置とサイズ (Layout)" defaultOpen={true}>
              <div className="prop-row">
                <NumberInput label="X" value={localRect.x} onChange={(v) => handleRectChange('x', v)} onBlur={() => commitRectChange('x')} />
                <NumberInput label="Y" value={localRect.y} onChange={(v) => handleRectChange('y', v)} onBlur={() => commitRectChange('y')} />
              </div>
              <div className="prop-row" style={{ marginTop: 10 }}>
                <NumberInput label="W" value={localRect.w} onChange={(v) => handleRectChange('w', v)} onBlur={() => commitRectChange('w')} />
                <NumberInput label="H" value={localRect.h} onChange={(v) => handleRectChange('h', v)} onBlur={() => commitRectChange('h')} />
              </div>
              {item.name.startsWith("画像") && (
                <div style={{ marginTop: 8 }}>
                  <CheckboxProp label="縦横比を維持する" checked={!!item.data?.keepAspectRatio} onChange={(v) => handleDataChange("keepAspectRatio", v)} onBlur={handleDataBlur} />
                </div>
              )}
            </AccordionSection>

            <AccordionSection title="表示設定・レイヤー" defaultOpen={true}>
              <div className="prop-label">重ね順 (Layer Order)</div>
              <div className="prop-grid-buttons-4">
                <button className="prop-button" onClick={() => props.onItemMoveToFront(item.id)}>最前面</button>
                <button className="prop-button" onClick={() => props.onItemMoveForward(item.id)}>前面</button>
                <button className="prop-button" onClick={() => props.onItemMoveBackward(item.id)}>背面</button>
                <button className="prop-button" onClick={() => props.onItemMoveToBack(item.id)}>最背面</button>
              </div>

              <div className="prop-separator" />

              <CheckboxProp label="初期状態で表示する" checked={item.data?.initialVisibility !== false} onChange={(v) => handleDataChange("initialVisibility", v)} onBlur={handleDataBlur} />
            </AccordionSection>

            {/* B2B Scoring Section */}
            {(item.name.startsWith("ボタン") || item.name.startsWith("テキスト入力欄")) && (
              <AccordionSection title="スコアリング (B2B Analysis)" defaultOpen={true}>
                <div className="prop-group">
                  <div className="prop-label">
                    スコア加算値 (Score Weight)
                  </div>
                  <NumberInput
                    label="Points"
                    value={item.data?.score || 0}
                    onChange={(v) => handleDataChange("score", v)}
                    onBlur={handleDataBlur}
                  />
                  <div style={{ fontSize: '10px', color: '#888', marginTop: 4 }}>
                    ユーザーがこのアクションを行った際に加算されるスコア (Hot Lead判定に使用)
                  </div>
                </div>
              </AccordionSection>
            )}


          </>
        )}

      </div>

      {/* 画像トリミングモーダル */}
      {item.name.startsWith("画像") && (item.data?.src || item.data?.originalSrc) && (
        <ImageCropModal
          isOpen={isCropModalOpen}
          imageSrc={item.data?.originalSrc || item.data?.src || ''}
          initialCrop={item.data?.cropState?.crop}
          initialZoom={item.data?.cropState?.zoom}
          onComplete={handleCropComplete}
          onCancel={() => setIsCropModalOpen(false)}
        />
      )}
    </div>
  );
};

// --- Helper Components ---
const CheckboxProp = ({ label, checked, onChange, onBlur }: {
  label: string,
  checked: boolean,
  onChange: (v: boolean) => void,
  onBlur?: () => void
}) => (
  <label className="prop-checkbox-row">
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => {
        onChange(e.target.checked);
        onBlur?.();
      }}
    />
    <span>{label}</span>
  </label>
);

const NumberInput = ({ label, value, onChange, onBlur }: { label: string, value: number, onChange: (v: number) => void, onBlur: () => void }) => {
  const [localValue, setLocalValue] = useState(String(isNaN(value) ? 0 : Math.round(value)));

  useEffect(() => {
    setLocalValue(String(isNaN(value) ? 0 : Math.round(value)));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalValue(val);
    const num = parseInt(val);
    if (!isNaN(num)) onChange(num);
    else if (val === '' || val === '-') onChange(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  return (
    <div className="prop-group-half">
      <div className="prop-label-inline">{label}</div>
      <input
        type="text"
        className="prop-input"
        value={localValue}
        onChange={handleChange}
        onBlur={onBlur}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
};

const ColorInput = ({ label, value, onChange, onBlur }: {
  label: string,
  value: string,
  onChange: (v: string) => void,
  onBlur?: () => void
}) => (
  <div className="prop-group-half">
    <div className="prop-label-inline">{label}</div>
    <div className="prop-color-picker-wrapper">
      <ThrottledColorInput
        className="prop-color-picker-small"
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        style={{ width: 24, height: 24, padding: 0, border: 'none' }}
      />
      <input
        type="text"
        className="prop-input"
        style={{ fontSize: 11, padding: '4px' }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
      />
    </div>
  </div>
);

// FontSizeInput: ローカル状態で編集中の値を保持
const FontSizeInput = ({ value, onChange, onBlur }: { value: number, onChange: (v: number | undefined) => void, onBlur: () => void }) => {
  const [localValue, setLocalValue] = useState(String(value));

  useEffect(() => {
    setLocalValue(String(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 編集中はローカル状態のみを更新（ストアには反映しない）
    setLocalValue(e.target.value);
  };

  const handleBlur = () => {
    // フォーカスが外れたときに値を確定してストアに反映
    const num = parseInt(localValue);
    if (isNaN(num) || num < 1) {
      // 無効な値の場合はデフォルト値に戻す
      const defaultValue = value || 15;
      setLocalValue(String(defaultValue));
      onChange(defaultValue);
    } else {
      // 有効な値の場合はストアに反映
      onChange(num);
    }
    onBlur();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  return (
    <input
      type="text"
      className="prop-input"
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    />
  );
};

// ThrottledColorInput: カラーピッカーの動作を軽量化するためのラッパー
// requestAnimationFrameを使用して、親への通知（=再描画）を間引く
const ThrottledColorInput = ({
  value,
  onChange,
  onBlur,
  className,
  style
}: {
  value: string,
  onChange: (val: string) => void,
  onBlur?: () => void,
  className?: string,
  style?: React.CSSProperties
}) => {
  const [localValue, setLocalValue] = useState(value);
  const requestRef = useRef<number | null>(null);

  // 親からの値変更を反映 (外部からの変更のみ)
  // ただし、ドラッグ中はlocalValueが優先されるべきだが、
  // Reactのサイクル上、useEffectで同期してもonChangeが即座に走れば問題ない
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setLocalValue(newVal);

    if (requestRef.current) return; // 前回のフレーム処理中ならスキップ

    requestRef.current = requestAnimationFrame(() => {
      onChange(newVal);
      requestRef.current = null;
    });
  };

  return (
    <input
      type="color"
      className={className}
      style={style}
      value={localValue}
      onChange={handleChange}
      onBlur={onBlur}
    />
  );
};