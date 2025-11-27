import React from "react";
import type { Node } from "reactflow";
import type { NodePropertyConfig, PropertyConfig, PropertySelectOption } from "../../types";
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
import { submitDataNodeConfig } from "../nodes/SubmitDataNode"; // ★ 追加

const nodeConfigMap: Record<string, NodePropertyConfig | NodePropertyConfig[]> = {
  "actionNode": actionNodeConfig,
  "animateNode": animateNodeConfig,
  "delayNode": delayNodeConfig,
  "eventNode": eventNodeConfig,
  "ifNode": ifNodeConfig,
  "pageNode": pageNodeConfig,
  "setVariableNode": setVariableNodeConfig,
  "waitForClickNode": waitForClickNodeConfig,
  "submitDataNode": submitDataNodeConfig, // ★ 追加
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
    
    if (node.type === "waitForClickNode" && name === "targetItemId") {
      const selectedItem = placedItems.find(p => p.id === newValue);
      const newLabel = selectedItem ? `待ち: ${selectedItem.data.text || selectedItem.name}` : "ターゲット未設定";
      updateNodeData(node.id, { [name]: newValue, label: newLabel });
    } else {
      updateNodeData(node.id, { [name]: newValue });
    }
  };

  // オプション生成ロジック
  let dynamicOptions: PropertySelectOption[] = propConfig.options || [];
  if (type === "select") {
    if (name === "targetItemId") {
      dynamicOptions = [
        { label: "-- アイテムを選択 --", value: "" },
        ...placedItems.map(item => ({ label: item.data.text || item.name, value: item.id })),
      ];
    } else if (name === "targetPageId") {
      dynamicOptions = [
        { label: "-- ページを選択 --", value: "" },
        ...pageInfoList.map(page => ({ label: page.name, value: page.id })),
      ];
    } else if (name === "eventType") {
      dynamicOptions = [{ label: "👆 クリック時 (On Click)", value: "click" }];
      if (isInputItem) dynamicOptions.push({ label: "✅ 入力完了時 (On Submit)", value: "onInputComplete" });
      if (isImageItem) dynamicOptions.push({ label: "🖼️ 画像読み込み時 (On Load)", value: "onImageLoad" });
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

  return (
    <div className="prop-group">
      <label className="prop-label">{label}</label>
      <input
        type={type}
        className="prop-input"
        name={name}
        value={value ?? ''}
        onChange={handleChange}
        onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
        onFocus={(e) => e.target.select()}
        step={step}
        min={min}
      />
    </div>
  );
};

// --- メインコンポーネント ---
export const NodePropertiesEditor: React.FC<{ node: Node }> = ({ node }) => {
  const baseInfo = (
    <AccordionSection title="基本情報" defaultOpen={true}>
      <div className="prop-group">
        <label className="prop-label">Node Type</label>
        <div className="prop-value">{node.type}</div>
      </div>
      <div className="prop-group">
        <label className="prop-label">Node Name</label>
        <div className="prop-value">{node.data.label}</div>
      </div>
    </AccordionSection>
  );

  const configOrConfigs = node.type ? nodeConfigMap[node.type] : undefined;
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
            if (prop.condition && node.data[prop.condition.name] !== prop.condition.value) return null;
            return <DynamicPropertyInput key={prop.name} node={node} propConfig={prop} />;
          })}
        </AccordionSection>
      ))}
    </div>
  );
};