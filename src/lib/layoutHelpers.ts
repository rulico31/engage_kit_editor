import type { PlacedItemType } from "../types";
import { ItemTypes } from "../ItemTypes";

export const createColumnLayout = (
  type: '50-50' | '60-40',
  baseX: number,
  baseY: number,
  baseWidth: number = 800,
  baseHeight: number = 200
): PlacedItemType[] => {
  const timestamp = Date.now();
  const groupId = `group-col-${timestamp}`;
  
  const gap = 20;
  let leftWidth: number;
  let rightWidth: number;

  if (type === '50-50') {
    leftWidth = (baseWidth - gap) / 2;
    rightWidth = (baseWidth - gap) / 2;
  } else {
    leftWidth = (baseWidth - gap) * 0.6;
    rightWidth = (baseWidth - gap) * 0.4;
  }

  const group: PlacedItemType = {
    id: groupId,
    name: `カラムレイアウト (${type})`,
    type: 'group',
    x: baseX,
    y: baseY,
    width: baseWidth,
    height: baseHeight,
    position: { x: baseX, y: baseY },
    size: { width: baseWidth, height: baseHeight },
    zIndex: 1,
    data: {
      isTransparent: true,
      showBorder: false,
    }
  };

  const colLeft: PlacedItemType = {
    id: `box-left-${timestamp}`,
    name: "左カラム",
    type: ItemTypes.BOX,
    groupId: groupId,
    x: 0,
    y: 0,
    width: leftWidth,
    height: baseHeight,
    position: { x: 0, y: 0 },
    size: { width: leftWidth, height: baseHeight },
    zIndex: 1,
    data: {
      backgroundColor: '#f8f9fa',
      borderRadius: 8,
      isPlaceholder: true,
    }
  };

  const colRight: PlacedItemType = {
    id: `box-right-${timestamp}`,
    name: "右カラム",
    type: ItemTypes.BOX,
    groupId: groupId,
    x: leftWidth + gap,
    y: 0,
    width: rightWidth,
    height: baseHeight,
    position: { x: leftWidth + gap, y: 0 },
    size: { width: rightWidth, height: baseHeight },
    zIndex: 2,
    data: {
      backgroundColor: '#f8f9fa',
      borderRadius: 8,
      isPlaceholder: true,
    }
  };

  return [group, colLeft, colRight];
};
