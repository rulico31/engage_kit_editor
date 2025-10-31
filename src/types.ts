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