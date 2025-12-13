import React, { useState, useEffect } from "react";
import type { PlacedItemType } from "../../types";
import { AccordionSection } from "./SharedComponents";
import { supabase } from "../../lib/supabaseClient";
import { useSelectionStore } from "../../stores/useSelectionStore";
import { usePageStore } from "../../stores/usePageStore";
import ImageCropModal from "../ImageCropModal";

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
      onItemUpdate(item.id, { width: w, height: h });
      setLocalRect(prev => ({ ...prev, w, h }));
    } else {
      const propMap = { x: 'x', y: 'y', w: 'width', h: 'height' };
      onItemUpdate(item.id, { [propMap[key]]: val });
    }
  };

  // 画像アップロード
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
      alert("5MB以下の画像ファイルを選択してください");
      return;
    }

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
      let srcToUse = '';
      try {
        const fileExt = file.name.split('.').pop();
        const filePath = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('project-assets').upload(filePath, file, { cacheControl: '3600', upsert: false });
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('project-assets').getPublicUrl(filePath);
        srcToUse = publicUrl;
      } catch (uploadErr: any) {
        console.warn("Supabase upload failed, falling back to local:", uploadErr);
        srcToUse = await readAsDataURL(file);
        alert("サーバーへのアップロードに失敗したため、ローカルデータとして保存しました。");
      }

      const img = new Image();
      img.onload = () => {
        const MAX_W = 450, MAX_H = 300;
        let w = img.width, h = img.height;
        const ratio = h / w;
        if (w / MAX_W > 1 || h / MAX_H > 1) {
          if (w / MAX_W > h / MAX_H) { w = MAX_W; h = img.height * (MAX_W / img.width); }
          else { h = MAX_H; w = img.width * (MAX_H / img.height); }
        }
        onItemUpdate(item.id, {
          data: {
            ...item.data,
            src: srcToUse,
            originalSrc: srcToUse,  // 元画像も保存
            originalAspectRatio: ratio,
            keepAspectRatio: true,
            isTransparent: false
          },
          width: Math.round(w), height: Math.round(h),
        });
        setIsUploading(false);
      };
      img.src = srcToUse;
    } catch (err: any) {
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
  const [activeTab, setActiveTab] = useState<TabType>('content');
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);

  const updateTabLabel = useSelectionStore(state => state.updateTabLabel);
  const commitHistory = usePageStore(state => state.commitHistory);

  // onChange: 状態のみ更新（履歴には保存しない）
  const handleDataChange = (name: string, value: any) => {
    onItemUpdate(item.id, { data: { ...item.data, [name]: value } });
  };

  // onBlur: 履歴に保存
  const handleDataBlur = () => {
    commitHistory(false);
  };

  const handleNameChange = (newDisplayName: string) => {
    onItemUpdate(item.id, { displayName: newDisplayName });
    // タブのラベルも更新（タイプ: カスタム名 の形式）
    const displayLabel = newDisplayName ? `${item.name}: ${newDisplayName}` : item.name;
    updateTabLabel(item.id, displayLabel);
  };

  const handleNameBlur = () => {
    commitHistory(false);
  };

  // onChange: スタイル更新のみ（履歴には保存しない）
  const handleStyleChange = (category: 'shadow' | 'glow' | 'textShadow' | 'textGlow' | 'backgroundColor', key: string, value: any) => {
    const currentStyle = item.style || {};
    let newStyle = { ...currentStyle };
    if (category === 'backgroundColor') {
      newStyle.backgroundColor = value;
    } else {
      const currentCategory = (currentStyle as any)[category] || { enabled: false, color: '#000000', x: 0, y: 0, blur: 0, spread: 0 };
      newStyle = { ...newStyle, [category]: { ...currentCategory, [key]: value } };
    }
    onItemUpdate(item.id, { style: newStyle });
  };

  // onBlur: 履歴に保存
  const handleStyleBlur = () => {
    commitHistory(false);
  };

  // トリミング完了ハンドラ
  const handleCropComplete = (croppedImageUrl: string) => {
    onItemUpdate(item.id, {
      data: {
        ...item.data,
        src: croppedImageUrl,
        // originalSrc は変更しない
      },
    });
    setIsCropModalOpen(false);
    commitHistory(false);
  };

  return (
    <div className="properties-panel-content" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 0 }}>
      {/* タブヘッダー */}
      <div className="prop-tabs-root">
        <button className={`prop-tab-btn ${activeTab === 'content' ? 'active' : ''}`} onClick={() => setActiveTab('content')}>
          コンテンツ
        </button>
        <button className={`prop-tab-btn ${activeTab === 'design' ? 'active' : ''}`} onClick={() => setActiveTab('design')}>
          デザイン
        </button>
        <button className={`prop-tab-btn ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
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
                  この名前はタブやアウトライナーで表示されます
                </div>
              </div>
            </AccordionSection>




            {/* テキスト/ボタンの内容 */}
            {(item.name.startsWith("テキスト") || item.name.startsWith("ボタン")) && (
              <AccordionSection title="テキスト内容" defaultOpen={true}>
                <div className="prop-group">
                  <div className="prop-label">{item.name.startsWith("ボタン") ? "ボタンテキスト" : "表示テキスト"}</div>
                  <textarea
                    className="prop-textarea"
                    value={item.data?.text || ""}
                    onChange={(e) => handleDataChange("text", e.target.value)}
                    rows={4}
                  />
                </div>
              </AccordionSection>
            )}

            {/* 画像ソース */}
            {item.name.startsWith("画像") && (
              <AccordionSection title="画像素材" defaultOpen={true}>
                <div className="prop-group">
                  <label className="prop-button" style={{ opacity: isUploading ? 0.6 : 1, cursor: isUploading ? 'not-allowed' : 'pointer' }}>
                    {isUploading ? "アップロード中..." : "画像を選択 / アップロード"}
                    <input type="file" style={{ display: "none" }} accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                  </label>
                </div>
                {item.data?.src && (
                  <div className="prop-group">
                    <img src={item.data.src} alt="Preview" className="prop-image-preview" />
                    <button className="prop-button" onClick={() => setIsCropModalOpen(true)}>画像をトリミング</button>
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
                <CheckboxProp
                  label="必須入力にする"
                  checked={!!item.data?.required}
                  onChange={(v) => handleDataChange("required", v)}
                />
              </AccordionSection>
            )}
          </>
        )}

        {/* --- Design Tab --- */}
        {activeTab === 'design' && (
          <>
            <AccordionSection title="塗り・背景" defaultOpen={true}>
              <div className="prop-group">
                <label className="prop-label">背景色 (Background)</label>
                <div className="prop-color-picker-wrapper">
                  <input
                    type="color"
                    className="prop-color-picker"
                    value={item.style?.backgroundColor || "#ffffff"}
                    onChange={(e) => handleStyleChange('backgroundColor', '', e.target.value)}
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
              <CheckboxProp label="背景を透過しない(不透明)" checked={!item.data?.isTransparent} onChange={(v) => handleDataChange("isTransparent", !v)} />


            </AccordionSection>

            {/* Typography */}
            {(item.name.startsWith("テキスト") || item.name.startsWith("ボタン")) && (
              <AccordionSection title="文字スタイル" defaultOpen={true}>
                <div className="prop-group">
                  <label className="prop-label">文字色</label>
                  <div className="prop-color-picker-wrapper">
                    <input
                      type="color"
                      className="prop-color-picker"
                      value={item.data?.color || "#333333"}
                      onChange={(e) => handleDataChange("color", e.target.value)}
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
                  <input
                    type="text"
                    className="prop-input"
                    value={item.data?.fontSize ?? 15}
                    onChange={(e) => handleDataChange("fontSize", e.target.value === "" ? undefined : parseInt(e.target.value))}
                    onBlur={handleDataBlur}
                  />
                </div>

                {/* Text Shadow */}
                <div style={{ marginTop: 15, borderTop: '1px solid #333', paddingTop: 10 }}>
                  <CheckboxProp label="文字の影 (Text Shadow)" checked={!!item.style?.textShadow?.enabled} onChange={(v) => handleStyleChange('textShadow', 'enabled', v)} />
                  {item.style?.textShadow?.enabled && (
                    <div style={{ paddingLeft: 10, marginBottom: 10 }}>
                      <div className="prop-row">
                        <NumberInput label="X" value={item.style.textShadow.x || 0} onChange={(v) => handleStyleChange('textShadow', 'x', v)} onBlur={() => { }} />
                        <NumberInput label="Y" value={item.style.textShadow.y || 0} onChange={(v) => handleStyleChange('textShadow', 'y', v)} onBlur={() => { }} />
                      </div>
                      <div className="prop-row" style={{ marginTop: 5 }}>
                        <NumberInput label="Blur" value={item.style.textShadow.blur || 0} onChange={(v) => handleStyleChange('textShadow', 'blur', v)} onBlur={() => { }} />
                        <ColorInput label="Color" value={item.style.textShadow.color || "#000000"} onChange={(v) => handleStyleChange('textShadow', 'color', v)} />
                      </div>
                    </div>
                  )}

                  <CheckboxProp label="文字の光彩 (Text Glow)" checked={!!item.style?.textGlow?.enabled} onChange={(v) => handleStyleChange('textGlow', 'enabled', v)} />
                  {item.style?.textGlow?.enabled && (
                    <div style={{ paddingLeft: 10 }}>
                      <div className="prop-row">
                        <NumberInput label="Blur" value={item.style.textGlow.blur || 0} onChange={(v) => handleStyleChange('textGlow', 'blur', v)} onBlur={() => { }} />
                        <ColorInput label="Color" value={item.style.textGlow.color || "#ffffff"} onChange={(v) => handleStyleChange('textGlow', 'color', v)} />
                      </div>
                    </div>
                  )}
                </div>
              </AccordionSection>
            )}

            {/* Effects */}
            <AccordionSection title="エフェクト (Effects)" defaultOpen={false}>
              <CheckboxProp label="枠線を表示 (Border)" checked={item.data?.showBorder !== false} onChange={(v) => handleDataChange("showBorder", v)} />

              <div className="prop-separator" />

              <CheckboxProp label="ドロップシャドウ (Box Shadow)" checked={!!item.style?.shadow?.enabled} onChange={(v) => handleStyleChange('shadow', 'enabled', v)} />
              {item.style?.shadow?.enabled && (
                <div style={{ paddingLeft: 10, marginBottom: 12 }}>
                  <div className="prop-row">
                    <NumberInput label="X" value={item.style.shadow.x || 0} onChange={(v) => handleStyleChange('shadow', 'x', v)} onBlur={() => { }} />
                    <NumberInput label="Y" value={item.style.shadow.y || 0} onChange={(v) => handleStyleChange('shadow', 'y', v)} onBlur={() => { }} />
                  </div>
                  <div className="prop-row" style={{ marginTop: 5 }}>
                    <NumberInput label="Blur" value={item.style.shadow.blur || 0} onChange={(v) => handleStyleChange('shadow', 'blur', v)} onBlur={() => { }} />
                    <ColorInput label="Color" value={item.style.shadow.color || "#000000"} onChange={(v) => handleStyleChange('shadow', 'color', v)} />
                  </div>
                </div>
              )}

              <CheckboxProp label="光彩 (Box Glow)" checked={!!item.style?.glow?.enabled} onChange={(v) => handleStyleChange('glow', 'enabled', v)} />
              {item.style?.glow?.enabled && (
                <div style={{ paddingLeft: 10 }}>
                  <div className="prop-row">
                    <NumberInput label="Blur" value={item.style.glow.blur || 0} onChange={(v) => handleStyleChange('glow', 'blur', v)} onBlur={() => { }} />
                    <NumberInput label="Spread" value={item.style.glow.spread || 0} onChange={(v) => handleStyleChange('glow', 'spread', v)} onBlur={() => { }} />
                  </div>
                  <div style={{ marginTop: 5 }}>
                    <ColorInput label="Color" value={item.style.glow.color || "#ffffff"} onChange={(v) => handleStyleChange('glow', 'color', v)} />
                  </div>
                </div>
              )}
            </AccordionSection>
          </>
        )}

        {/* --- Settings Tab --- */}
        {activeTab === 'settings' && (
          <>
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
                  <CheckboxProp label="縦横比を維持する" checked={!!item.data?.keepAspectRatio} onChange={(v) => handleDataChange("keepAspectRatio", v)} />
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

              <CheckboxProp label="初期状態で表示する" checked={item.data?.initialVisibility !== false} onChange={(v) => handleDataChange("initialVisibility", v)} />
            </AccordionSection>

            {item.name.startsWith("テキスト入力欄") && (
              <AccordionSection title="開発者向け設定 (Variables)">
                <div className="prop-group">
                  <div className="prop-label">変数名 (Variable Name)</div>
                  <input type="text" className="prop-input" value={item.data?.variableName || ""} onChange={(e) => handleDataChange("variableName", e.target.value)} />
                  <div style={{ fontSize: '10px', color: '#666', marginTop: 4 }}>この値はlogicEngineから参照できます</div>
                </div>
              </AccordionSection>
            )}
          </>
        )}

      </div>

      {/* 画像トリミングモーダル */}
      {item.name.startsWith("画像") && (
        <ImageCropModal
          isOpen={isCropModalOpen}
          imageSrc={item.data?.originalSrc || item.data?.src || ''}
          onComplete={handleCropComplete}
          onCancel={() => setIsCropModalOpen(false)}
        />
      )}
    </div>
  );
};

// --- Helper Components ---

const CheckboxProp = ({ label, checked, onChange }: { label: string, checked: boolean, onChange: (v: boolean) => void }) => (
  <label className="prop-checkbox-row">
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
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

  return (
    <div className="prop-group-half">
      <div className="prop-label-inline">{label}</div>
      <input
        type="text"
        className="prop-input"
        value={localValue}
        onChange={handleChange}
        onBlur={onBlur}
      />
    </div>
  );
};

const ColorInput = ({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) => (
  <div className="prop-group-half">
    <div className="prop-label-inline">{label}</div>
    <div className="prop-color-picker-wrapper">
      <input type="color" className="prop-color-picker-small" value={value} onChange={(e) => onChange(e.target.value)} style={{ width: 24, height: 24, padding: 0, border: 'none' }} />
      <input type="text" className="prop-input" style={{ fontSize: 11, padding: '4px' }} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  </div>
);