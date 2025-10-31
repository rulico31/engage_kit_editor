// src/components/PropertiesPanel.tsx

import React, { useState, useEffect } from "react";
import type { PlacedItemType } from "../types";
import "./PropertiesPanel.css";

// このコンポーネントが受け取るpropsの型
interface PropertiesPanelProps {
  item: PlacedItemType | null;
  onUpdate: (itemId: string, updatedProps: Partial<PlacedItemType>) => void;
}

// 編集用のローカルステートの型 (すべて文字列で保持)
interface EditValues {
  id: string;
  name: string;
  x: string;
  y: string;
  width: string;
  height: string;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ item, onUpdate }) => {
  // 編集中の値（文字列）を保持するローカルステート
  const [editValues, setEditValues] = useState<EditValues | null>(null);

  /**
   * 選択中のアイテム (item) が変更されたら、
   * ローカルの編集用ステート (editValues) を更新（同期）する
   */
  useEffect(() => {
    if (item) {
      // item (数値プロパティ) を editValues (文字列プロパティ) に変換
      setEditValues({
        id: item.id,
        name: item.name,
        x: String(Math.round(item.x)), // 数値を文字列に
        y: String(Math.round(item.y)),
        width: String(item.width),
        height: String(item.height),
      });
    } else {
      setEditValues(null); // 選択解除
    }
  }, [item]); // item が変更された時だけ実行

  /**
   * input の入力（onChange）をローカルステート (editValues) に反映する
   * (この時点ではまだ親コンポーネントに通知しない)
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editValues) return;

    const { name, value } = e.target; // value (文字列) をそのまま使う

    setEditValues({
      ...editValues,
      [name]: value, // 文字列のままローカルステートにセット (例: '', '123', '100a')
    });
  };

  /**
   * 変更を確定する（EnterキーまたはBlur時）
   * ローカルの文字列を数値にパースし、親コンポーネント(App.tsx)に通知(onUpdate)する
   */
  const commitChanges = () => {
    // 元のアイテム(item)か、編集中の値(editValues)がなければ何もしない
    if (!item || !editValues) return;

    // 編集中の文字列(editValues)を数値にパース
    // (注) parseFloat('') は NaN になり、 NaN || 0 は 0 になります。
    const newX = parseFloat(editValues.x) || 0;
    const newY = parseFloat(editValues.y) || 0;
    // サイズが 0 やマイナスになるのを防ぐ (例: 1未満は 1 にする)
    const newWidth = Math.max(1, parseFloat(editValues.width) || 1);
    const newHeight = Math.max(1, parseFloat(editValues.height) || 1);

    // 確定後の、正規化された値 (文字列型)
    const committedValues: EditValues = {
      id: editValues.id,
      name: editValues.name,
      x: String(newX),
      y: String(newY),
      width: String(newWidth),
      height: String(newHeight),
    };

    // 元のアイテム(item)と比較して、変更があったかチェック
    const hasChanged =
      item.name !== committedValues.name ||
      Math.round(item.x) !== newX ||
      Math.round(item.y) !== newY ||
      item.width !== newWidth ||
      item.height !== newHeight;

    // 変更があった場合のみ、親(App.tsx)に通知
    if (hasChanged) {
      onUpdate(item.id, {
        name: committedValues.name,
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight,
      });
    }

    // (重要) ユーザーの入力（例: '100a' や ''）を、
    // パース後の正規化された値（例: '100' や '0'）で上書きし、入力欄をクリーンナップする。
    // (hasChanged が false の場合でも、入力欄の表示を戻すために実行)
    if (JSON.stringify(editValues) !== JSON.stringify(committedValues)) {
      setEditValues(committedValues);
    }
  };

  // Enterキーが押された時の処理
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      commitChanges();
      e.currentTarget.blur(); // Enterを押したらフォーカスを外す
    }
  };

  // フォーカスが外れた時の処理
  const handleBlur = () => {
    commitChanges();
  };

  // フォーカスされた時の処理（全選択）
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  // --- JSX (表示部分) ---

  // ローカルステートが初期化される前 or アイテム未選択
  if (!editValues) {
    return (
      <div className="properties-panel-content">
        <div className="placeholder-text">アイテムを選択してください</div>
      </div>
    );
  }

  // アイテム選択中
  return (
    <div className="properties-panel-content">
      {/* Name */}
      <div className="prop-group">
        <div className="prop-label">Name</div>
        <input
          type="text"
          className="prop-input"
          name="name"
          value={editValues.name} // valueはローカルステート(string)
          onChange={handleChange} // ローカルステートを更新
          onKeyDown={handleKeyDown} // Enterで確定
          onBlur={handleBlur} // フォーカスが外れたら確定
          onFocus={handleFocus} // フォーカスで全選択
        />
      </div>

      {/* Position */}
      <div className="prop-label">Position</div>
      <div className="prop-row">
        {/* X */}
        <div className="prop-group prop-group-half">
          <div className="prop-label-inline">X</div>
          <input
            type="number" // (※)
            className="prop-input"
            name="x"
            value={editValues.x} // valueはローカルステート(string)
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            onFocus={handleFocus}
          />
        </div>
        {/* Y */}
        <div className="prop-group prop-group-half">
          <div className="prop-label-inline">Y</div>
          <input
            type="number" // (※)
            className="prop-input"
            name="y"
            value={editValues.y} // valueはローカルステート(string)
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            onFocus={handleFocus}
          />
        </div>
      </div>

      {/* Size */}
      <div className="prop-label">Size</div>
      <div className="prop-row">
        {/* Width */}
        <div className="prop-group prop-group-half">
          <div className="prop-label-inline">W</div>
          <input
            type="number" // (※)
            className="prop-input"
            name="width"
            value={editValues.width} // valueはローカルステート(string)
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            onFocus={handleFocus}
          />
        </div>
        {/* Height */}
        <div className="prop-group prop-group-half">
          <div className="prop-label-inline">H</div>
          <input
            type="number" // (※)
            className="prop-input"
            name="height"
            value={editValues.height} // valueはローカルステート(string)
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            onFocus={handleFocus}
          />
        </div>
      </div>
    </div>
  );
};
/*
(※) input の type="number" は、キーボード制御やブラウザのUI（矢印など）を提供しますが、
Reactの value プロパティは文字列を受け入れることができます。
これにより、'' や '-' のような数値に変換できない一時的な文字列も表示できます。
*/

export default PropertiesPanel;