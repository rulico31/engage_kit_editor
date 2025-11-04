// src/types.ts

// アートボードに配置されたアイテムが持つデータの型
export interface PlacedItemType {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

// (ここから新規追加)
// プレビューモード中の各アイテムが持つ状態の型
export interface PreviewItemState {
  isVisible: boolean;
  // (将来的に text: string など他の状態も追加可能)
}

// プレビュー状態全体（アイテムIDと状態のマップ）
export type PreviewState = Record<string, PreviewItemState>;
// (ここまで新規追加)
