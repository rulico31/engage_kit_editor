// src/ItemTypes.ts

export const ItemTypes = {
  TOOL: "tool", // アートボード用ツールボックス
  PLACED_ITEM: "placed_item", // アートボード上のアイテム
  NODE_TOOL: "node_tool", // (新) ノードエディタ用ツールボックス
  NODE_PALETTE_ITEM: "node_palette_item", // ノードパレットのアイテム（react-dnd用）

  // Specific tool types
  BOX: "box",
  IMAGE: "image",
  TEXT: "text",
  BUTTON: "button",
  VIDEO: "video",
  COMMENT: "COMMENT"
};