import React from "react";

import type { Node } from "reactflow";
import type { PropertyConfig, PropertySelectOption } from "../../types";
import { AccordionSection } from "./SharedComponents";
import { usePageStore } from "../../stores/usePageStore";
import { useSelectionStore } from "../../stores/useSelectionStore";

// ノード設定のインポート
import { actionNodeConfig } from "../nodes/ActionNode";
import { animateNodeConfig } from "../nodes/AnimateNode";
import { delayNodeConfig } from "../nodes/DelayNode";
import { eventNodeConfig } from "../nodes/EventNode";
import { ifNodeConfig } from "../nodes/IfNode";
import { pageNodeConfig } from "../nodes/PageNode";
import { setVariableNodeConfig } from "../nodes/SetVariableNode";
import { waitForClickNodeConfig } from "../nodes/WaitForClickNode";
import { submitDataNodeConfig } from "../nodes/SubmitDataNode";
import { externalApiNodeConfig } from "../nodes/ExternalApiNode";
import { abTestNodeConfig } from "../nodes/ABTestNode"; // 追加

const nodeConfigMap: Record<string, any> = {
  "actionNode": actionNodeConfig,
  "animateNode": animateNodeConfig,
  "delayNode": delayNodeConfig,
  "eventNode": eventNodeConfig,
  "ifNode": ifNodeConfig,
  "pageNode": pageNodeConfig,
  "setVariableNode": setVariableNodeConfig,
  "waitForClickNode": waitForClickNodeConfig,
  "submitDataNode": submitDataNodeConfig,
  "externalApiNode": externalApiNodeConfig,
  "abTestNode": abTestNodeConfig, // 追加
};

// --- プロパティ入力コンポーネント ---
interface DynamicPropertyInputProps {
  node: Node;
  propConfig: PropertyConfig;
}

const DynamicPropertyInput: React.FC<DynamicPropertyInputProps> = ({ node, propConfig }) => {
  const { updateNodeData, placedItems, pageInfoList } = usePageStore((s) => {
    const page = s.selectedPageId ? s.pages[s.selectedPageId] : undefined;
    return {
      updateNodeData: s.updateNodeData,
      placedItems: page?.placedItems ?? [],
      pageInfoList: s.pageOrder.map((id) => ({ id, name: s.pages[id]?.name ?? "無題" })),
    };
  });
  const activeLogicGraphId = useSelectionStore(state => state.activeLogicGraphId);

  // placedItemsのfind結果がundefinedになる可能性があるためオプショナルチェーンを使用
  const parentItem = activeLogicGraphId ? placedItems.find(p => p.id === activeLogicGraphId) : undefined;

  const isInputItem = parentItem?.name.startsWith("テキスト入力欄") || false;
  const isImageItem = parentItem?.name.startsWith("画像") || false;

  const { name, label, type, defaultValue, step, min } = propConfig;
  const value = node.data[name] ?? defaultValue;

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement>) => {
    let newValue: any = e.target.value;
    if (type === 'number') {
      newValue = newValue === "" ? "" : Number(newValue);
    }
    if (type === 'checkbox') {
      newValue = (e.target as HTMLInputElement).checked;
    }

    console.log('[handleChange] name:', name, 'type:', type, 'newValue:', newValue);

    // WaitForClickNodeの旧形式targetItemId対応（一応保持）
    if (node.type === "waitForClickNode" && name === "targetItemId") {
      const selectedItem = placedItems.find(p => p.id === newValue);
      const newLabel = selectedItem ? `待ち: ${selectedItem.data.text || selectedItem.name} ` : "ターゲット未設定";

      // selectタイプの場合は即座に履歴保存、それ以外はデバウンス
      const shouldSaveImmediately = type === 'select';
      updateNodeData(node.id, { [name]: newValue, label: newLabel }, { addToHistory: true, historyDebounce: !shouldSaveImmediately });
    } else {
      // select, checkbox, numberの場合は即座に履歴保存
      // textの場合のみデバウンスで履歴保存
      const shouldSaveImmediately = type === 'select' || type === 'checkbox' || type === 'number';
      updateNodeData(node.id, { [name]: newValue }, { addToHistory: true, historyDebounce: !shouldSaveImmediately });
    }
  };

  const handleBlur = () => {
    // フォーカスが外れたタイミングで履歴に保存
    updateNodeData(node.id, {}, { addToHistory: true });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    }
  };

  // multiselect用のチェックボックス変更ハンドラ
  const handleMultiSelectChange = (itemId: string, checked: boolean) => {
    const currentIds = (value as string[]) || [];
    const newIds = checked
      ? [...currentIds, itemId]
      : currentIds.filter(id => id !== itemId);
    updateNodeData(node.id, { [name]: newIds }, { addToHistory: true, historyDebounce: false });
  };

  // オプション生成ロジック
  let dynamicOptions: PropertySelectOption[] = propConfig.options || [];
  if (type === "select") {
    if (name === "targetItemId" || name === "conditionTargetId") {
      // アートボード上に実際に配置されているアイテムのみをフィルタリング
      const validItems = placedItems.filter(item => {
        return item.x !== undefined && item.y !== undefined &&
          !item.id.startsWith('temp-') &&
          !item.id.startsWith('upload-');
      });
      dynamicOptions = [
        { label: "-- アイテムを選択 --", value: "" },
        ...validItems.map(item => ({ label: item.data.text || item.name, value: item.id })),
      ];
    } else if (name === "targetPageId") {
      dynamicOptions = [
        { label: "-- ページを選択 --", value: "" },
        ...pageInfoList.map(page => ({ label: page.name, value: page.id })),
      ];
    } else if (name === "eventType") {
      dynamicOptions = [{ label: "👆 クリック時", value: "click" }];
      if (isInputItem) dynamicOptions.push({ label: "✅ 入力完了時", value: "onInputComplete" });
      if (isImageItem) dynamicOptions.push({ label: "🖼️ 画像読み込み時", value: "onImageLoad" });
    } else if (name === "comparison") {
      const isNumber = node.data.comparisonType === 'number';
      dynamicOptions = [
        { label: "== (等しい)", value: "==" },
        { label: "!= (等しくない)", value: "!=" },
      ];
      if (isNumber) {
        dynamicOptions.push(
          { label: "> (より大きい)", value: ">" },
          { label: ">= (以上)", value: ">=" },
          { label: "< (より小さい)", value: "<" },
          { label: "<= (以下)", value: "<=" }
        );
      } else {
        dynamicOptions.push(
          { label: "含む (文字列)", value: "contains" },
          { label: "含まない (文字列)", value: "not_contains" }
        );
      }
    }
  }

  // レンダリング
  if (type === 'multiselect') {
    // アートボード上に実際に配置されているアイテムのみをフィルタリング
    const validItems = placedItems.filter(item => {
      return item.x !== undefined && item.y !== undefined &&
        !item.id.startsWith('temp-') &&
        !item.id.startsWith('upload-');
    });
    return (
      <div className="prop-group">
        <label className="prop-label">{label}</label>
        <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #3e3e3e', borderRadius: '4px', padding: '8px' }}>
          {validItems.map(item => (
            <label key={item.id} style={{ display: 'block', padding: '4px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={((value as string[]) || []).includes(item.id)}
                onChange={(e) => handleMultiSelectChange(item.id, e.target.checked)}
                style={{ marginRight: '8px' }}
              />
              <span>{item.displayName || item.data.text || item.name}</span>
            </label>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'select') {
    return (
      <div className="prop-group">
        <label className="prop-label">{label}</label>
        <select
          className="prop-select"
          name={name}
          value={value ?? ''}
          onChange={handleChange}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {dynamicOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
      </div>
    );
  }

  if (type === 'textarea') {
    return (
      <div className="prop-group">
        <label className="prop-label">{label}</label>
        <textarea
          className="prop-textarea"
          name={name}
          value={value ?? ''}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          rows={4}
        />
      </div>
    );
  }

  return (
    <div className="prop-group">
      <label className="prop-label">{label}</label>
      <input
        type={type}
        className="prop-input"
        name={name}
        value={value ?? ''}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onFocus={(e) => e.target.select()}
        step={step}
        min={min}
      />
    </div>
  );
};

// --- メインコンポーネント ---
export const NodePropertiesEditor: React.FC<{ node: Node }> = ({ node }) => {
  const updateNodeData = usePageStore((state) => state.updateNodeData);

  const baseInfo = (
    <AccordionSection title="基本情報" defaultOpen={true}>
      <div className="prop-group">
        <label className="prop-label">ノードタイプ</label>
        <div className="prop-value">{node.type}</div>
      </div>
      <div className="prop-group">
        <label className="prop-label">ノード名</label>
        <div className="prop-value">{node.data.label}</div>
      </div>
    </AccordionSection>
  );

  const configOrConfigs = node.type ? nodeConfigMap[node.type] : undefined;

  // ABTestNode専用の処理
  if (node.type === 'abTestNode') {
    const ratioA = node.data.ratioA ?? 50;

    return (
      <div className="properties-panel-content">
        {baseInfo}
        <AccordionSection title="分岐設定" defaultOpen={true}>
          <div className="prop-group">
            <label className="prop-label">分岐比率 (Split Ratio)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
              <input
                type="range"
                min="0"
                max="100"
                value={ratioA}
                onChange={(e) => {
                  // ドラッグ中は履歴保存しない（UIのみ更新）
                  updateNodeData(node.id, { ratioA: Number(e.target.value) });
                }}
                onMouseUp={() => {
                  // スライダーを離したときに履歴保存
                  updateNodeData(node.id, {}, { addToHistory: true });
                }}
                onTouchEnd={() => {
                  // タッチデバイス対応
                  updateNodeData(node.id, {}, { addToHistory: true });
                }}
                className="prop-input"
                style={{
                  flex: 1,
                  padding: 0,
                  border: 'none',
                  height: '6px',
                  background: `linear-gradient(to right, #0d9488 0%, #0d9488 ${ratioA}%, #99f6e4 ${ratioA}%, #99f6e4 100%)`,
                  borderRadius: '3px',
                  appearance: 'none',
                  outline: 'none',
                }}
              />
              <span style={{ minWidth: '120px', textAlign: 'right', fontSize: '14px', color: '#ccc', fontFamily: 'monospace' }}>
                A: {ratioA}% / B: {100 - ratioA}%
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#888', marginTop: '8px' }}>
              Path Aに進む確率を設定します
            </div>
          </div>
        </AccordionSection>
      </div>
    );
  }

  if (!configOrConfigs) {
    return <div className="properties-panel-content">{baseInfo}</div>;
  }

  const configs = Array.isArray(configOrConfigs) ? configOrConfigs : [configOrConfigs];

  return (
    <div className="properties-panel-content">
      {baseInfo}

      {configs.map((config, index) => (
        <AccordionSection key={index} title={config.title} defaultOpen={true}>
          {config.properties.map((prop: PropertyConfig) => {
            // 条件付き表示の評価
            if (prop.condition) {
              // conditionが関数の場合
              if (typeof prop.condition === 'function') {
                if (!prop.condition(node.data)) return null;
              }
              // conditionがオブジェクト形式 { name: string, value: any } の場合
              else if (typeof prop.condition === 'object' && 'name' in prop.condition && 'value' in prop.condition) {
                const conditionName = prop.condition.name;
                const conditionValue = prop.condition.value;
                const currentValue = node.data[conditionName];

                // 条件が一致しない場合は表示しない
                if (currentValue !== conditionValue) return null;
              }
            }

            return <DynamicPropertyInput key={prop.name} node={node} propConfig={prop} />;
          })}
        </AccordionSection>
      ))}
    </div>
  );
};