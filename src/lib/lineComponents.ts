import type { PlacedItemType } from "../types";
import { ItemTypes } from "../ItemTypes";

export const createLineRegistrationComponent = (
  baseX: number,
  baseY: number,
  lineUrl: string = "https://line.me/R/ti/p/@line"
): PlacedItemType[] => {
  const timestamp = Date.now();
  const groupId = `group-line-${timestamp}`;
  const width = 350;
  const height = 120;

  const group: PlacedItemType = {
    id: groupId,
    name: "LINE登録誘導コンポーネント",
    type: 'group',
    x: baseX,
    y: baseY,
    width: width,
    height: height,
    position: { x: baseX, y: baseY },
    size: { width: width, height: height },
    zIndex: 1,
    data: {
      backgroundColor: '#ffffff',
      borderRadius: 12,
      showBorder: true,
      initialVisibility: true,
    },
    style: {
      shadow: { enabled: true, blur: 10, color: 'rgba(0,0,0,0.1)' }
    }
  };

  const lineLogo: PlacedItemType = {
    id: `img-line-logo-${timestamp}`,
    name: "LINEロゴ",
    type: ItemTypes.IMAGE,
    groupId: groupId,
    x: 20,
    y: 20,
    width: 40,
    height: 40,
    position: { x: 20, y: 20 },
    size: { width: 40, height: 40 },
    zIndex: 1,
    data: {
      src: "https://upload.wikimedia.org/wikipedia/commons/4/41/LINE_logo.svg",
    }
  };

  const text: PlacedItemType = {
    id: `txt-line-desc-${timestamp}`,
    name: "テキスト",
    type: ItemTypes.TEXT,
    groupId: groupId,
    x: 70,
    y: 20,
    width: 260,
    height: 40,
    position: { x: 70, y: 20 },
    size: { width: 260, height: 40 },
    zIndex: 2,
    data: {
      text: "最新情報をLINEで受け取ろう！",
      fontSize: 16,
      textAlign: 'left',
    }
  };

  const button: PlacedItemType = {
    id: `btn-line-reg-${timestamp}`,
    name: "登録ボタン",
    type: ItemTypes.BUTTON,
    groupId: groupId,
    x: 70,
    y: 70,
    width: 260,
    height: 35,
    position: { x: 70, y: 70 },
    size: { width: 260, height: 35 },
    zIndex: 3,
    data: {
      text: "友だち追加する",
      backgroundColor: '#06C755',
      color: '#ffffff',
      fontSize: 14,
      linkUrl: lineUrl,
    }
  };

  return [group, lineLogo, text, button];
};
