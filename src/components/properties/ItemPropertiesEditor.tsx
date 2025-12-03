import React, { useState, useEffect } from "react";
import type { PlacedItemType } from "../../types";
import { AccordionSection } from "./SharedComponents";
import { supabase } from "../../lib/supabaseClient";

interface ItemPropertiesEditorProps {
  item: PlacedItemType;
  onItemUpdate: (id: string, updates: Partial<PlacedItemType> | { data: any }) => void;
  onItemMoveToFront: (id: string) => void;
  onItemMoveToBack: (id: string) => void;
  onItemMoveForward: (id: string) => void;
  onItemMoveBackward: (id: string) => void;
  onOpenBackgroundModal: (itemId: string, src: string) => void;
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

    // Base64読み込みヘルパー
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
        // 1. Supabaseへのアップロードを試みる
        const fileExt = file.name.split('.').pop();
        const filePath = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('project-assets').upload(filePath, file, { cacheControl: '3600', upsert: false });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('project-assets').getPublicUrl(filePath);
        srcToUse = publicUrl;

      } catch (uploadErr: any) {
        console.warn("Supabase upload failed, falling back to Base64:", uploadErr);
        // 2. 失敗した場合はBase64フォールバック
        srcToUse = await readAsDataURL(file);
        alert("サーバーへのアップロードに失敗したため、ローカルデータとして保存しました。\n(プロジェクトデータが大きくなる可能性があります)");
      }

      const img = new Image();
      img.onload = () => {
        const MAX_W = 450, MAX_H = 300;
        let w = img.width, h = img.height;
        const ratio = h / w;

        // リサイズ計算
        if (w / MAX_W > 1 || h / MAX_H > 1) {
          if (w / MAX_W > h / MAX_H) { w = MAX_W; h = img.height * (MAX_W / img.width); }
          else { h = MAX_H; w = img.width * (MAX_H / img.height); }
        }

        onItemUpdate(item.id, {
          data: { ...item.data, src: srcToUse, originalAspectRatio: ratio, keepAspectRatio: true, isTransparent: false },
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

export const ItemPropertiesEditor: React.FC<ItemPropertiesEditorProps> = (props) => {
  const { item, onItemUpdate, onOpenBackgroundModal } = props;
  const { localRect, handleRectChange, commitRectChange, handleImageUpload, isUploading } = useItemEditorLogic(item, onItemUpdate);

  const handleDataChange = (name: string, value: any) => {
    onItemUpdate(item.id, { data: { ...item.data, [name]: value } });
  };

  return (
    <div className="properties-panel-content">
      <AccordionSection title="基本情報">
        <div className="prop-group">
          <div className="prop-label">Name</div>
          <input type="text" className="prop-input prop-input-disabled" value={item.name} disabled />
        </div>
      </AccordionSection>

      {/* コンテンツセクション (テキスト/ボタン) */}
      {(item.name.startsWith("テキスト") || item.name.startsWith("ボタン")) && (
        <AccordionSection title="コンテンツ">
          <div className="prop-group">
            <div className="prop-label">{item.name.startsWith("ボタン") ? "ボタンテキスト" : "テキスト内容"}</div>
            <textarea
              className="prop-input"
              value={item.data?.text || ""}
              onChange={(e) => handleDataChange("text", e.target.value)}
              rows={4}
            />
          </div>
          <div className="prop-group">
            <label className="prop-label">文字色</label>
            <div className="prop-color-picker-wrapper">
              <input type="color" className="prop-color-picker" value={item.data?.color || "#333333"} onChange={(e) => handleDataChange("color", e.target.value)} />
              <input type="text" className="prop-input" style={{ flexGrow: 1 }} value={item.data?.color || "#333333"} onChange={(e) => handleDataChange("color", e.target.value)} />
            </div>
          </div>
          <div className="prop-group">
            <label className="prop-label">文字サイズ (px)</label>
            <input type="number" className="prop-input" value={item.data?.fontSize ?? 15} onChange={(e) => handleDataChange("fontSize", e.target.value === "" ? undefined : parseInt(e.target.value))} min={1} />
          </div>
        </AccordionSection>
      )}

      {/* 画像ソースセクション */}
      {item.name.startsWith("画像") && (
        <AccordionSection title="画像ソース">
          <div className="prop-group">
            <label className="prop-button" style={{ opacity: isUploading ? 0.6 : 1, cursor: isUploading ? 'not-allowed' : 'pointer' }}>
              {isUploading ? "アップロード中..." : "画像をアップロード"}
              <input type="file" style={{ display: "none" }} accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
            </label>
          </div>
          {item.data?.src && (
            <div className="prop-group">
              <img src={item.data.src} alt="Preview" className="prop-image-preview" />
              <button className="prop-button-danger" onClick={() => handleDataChange("src", null)}>画像を削除</button>
            </div>
          )}
        </AccordionSection>
      )}

      {/* 入力欄設定 */}
      {item.name.startsWith("テキスト入力欄") && (
        <AccordionSection title="入力欄設定">
          <div className="prop-group">
            <div className="prop-label">変数名</div>
            <input type="text" className="prop-input" value={item.data?.variableName || ""} onChange={(e) => handleDataChange("variableName", e.target.value)} />
          </div>
          <div className="prop-group">
            <div className="prop-label">プレースホルダー</div>
            <input type="text" className="prop-input" value={item.data?.placeholder || ""} onChange={(e) => handleDataChange("placeholder", e.target.value)} />
          </div>
          <div className="prop-group">
            <div className="prop-label">入力タイプ</div>
            <select
              className="prop-input"
              value={item.data?.inputType || "text"}
              onChange={(e) => handleDataChange("inputType", e.target.value)}
            >
              <option value="text">テキスト</option>
              <option value="email">メールアドレス</option>
              <option value="number">数値</option>
              <option value="tel">電話番号</option>
            </select>
          </div>
          <CheckboxProp
            label="必須項目にする"
            checked={!!item.data?.required}
            onChange={(v) => handleDataChange("required", v)}
          />
        </AccordionSection>
      )}

      {/* 配置（レイヤー） */}
      <AccordionSection title="配置">
        <div className="prop-label">重ね順</div>
        <div className="prop-grid-buttons-4">
          <button className="prop-button" onClick={() => props.onItemMoveToFront(item.id)}>最前面</button>
          <button className="prop-button" onClick={() => props.onItemMoveForward(item.id)}>前面</button>
          <button className="prop-button" onClick={() => props.onItemMoveBackward(item.id)}>背面</button>
          <button className="prop-button" onClick={() => props.onItemMoveToBack(item.id)}>最背面</button>
        </div>
      </AccordionSection>

      {/* 外観 */}
      {(item.name.startsWith("テキスト") || item.name.startsWith("ボタン") || item.name.startsWith("画像")) && (
        <AccordionSection title="外観">
          <CheckboxProp label="初期状態で表示する" checked={item.data?.initialVisibility !== false} onChange={(v) => handleDataChange("initialVisibility", v)} />
          <CheckboxProp label="枠線を表示する" checked={item.data?.showBorder !== false} onChange={(v) => handleDataChange("showBorder", v)} />
          <CheckboxProp label="背景を透過する" checked={!!item.data?.isTransparent} onChange={(v) => handleDataChange("isTransparent", v)} />

          {item.name.startsWith("画像") && (
            <>
              <CheckboxProp label="アートボードの背景にする" checked={!!item.data?.isArtboardBackground}
                onChange={(v) => {
                  if (v && !item.data.src) { alert("先に画像をアップロードしてください"); return; }
                  if (v) onOpenBackgroundModal(item.id, item.data.src!);
                  handleDataChange("isArtboardBackground", v);
                }}
              />
              {item.data?.isArtboardBackground && item.data.src && (
                <button className="prop-button" style={{ marginTop: 8, backgroundColor: '#555' }} onClick={() => onOpenBackgroundModal(item.id, item.data.src!)}>位置を調整...</button>
              )}
            </>
          )}
        </AccordionSection>
      )}

      {/* 位置・サイズ */}
      <AccordionSection title="位置とサイズ">
        <div className="prop-row">
          <NumberInput label="X" value={localRect.x} onChange={(v) => handleRectChange('x', v)} onBlur={() => commitRectChange('x')} />
          <NumberInput label="Y" value={localRect.y} onChange={(v) => handleRectChange('y', v)} onBlur={() => commitRectChange('y')} />
        </div>
        <div className="prop-row" style={{ marginTop: 10 }}>
          <NumberInput label="W" value={localRect.w} onChange={(v) => handleRectChange('w', v)} onBlur={() => commitRectChange('w')} />
          <NumberInput label="H" value={localRect.h} onChange={(v) => handleRectChange('h', v)} onBlur={() => commitRectChange('h')} />
        </div>
        {item.name.startsWith("画像") && (
          <CheckboxProp label="縦横比を維持する" checked={!!item.data?.keepAspectRatio} onChange={(v) => handleDataChange("keepAspectRatio", v)} />
        )}
      </AccordionSection>
    </div>
  );
};

// ヘルパーコンポーネント
const CheckboxProp = ({ label, checked, onChange }: { label: string, checked: boolean, onChange: (v: boolean) => void }) => (
  <div className="prop-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px', marginTop: 5 }}>
    <input type="checkbox" style={{ width: 16, height: 16 }} checked={checked} onChange={(e) => onChange(e.target.checked)} />
    <label style={{ fontSize: '0.9em', color: '#ccc', cursor: 'pointer' }} onClick={() => onChange(!checked)}>{label}</label>
  </div>
);

const NumberInput = ({ label, value, onChange, onBlur }: { label: string, value: number, onChange: (v: number) => void, onBlur: () => void }) => (
  <div className="prop-group prop-group-half">
    <div className="prop-label-inline">{label}</div>
    <input type="number" className="prop-input" value={isNaN(value) ? "" : Math.round(value)} onChange={(e) => onChange(e.target.valueAsNumber)} onBlur={onBlur} />
  </div>
);