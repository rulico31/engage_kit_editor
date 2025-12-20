// src/components/nodes/SubmitDataNode.ts

import type { PropertyConfig } from "../../types";

export const submitDataNodeConfig: any = {
  title: "データ送信設定",
  properties: [
    {
      name: "label",
      label: "ノード名",
      type: "text",
      defaultValue: "データ送信",
    },
    // 将来的に「送信後にページ遷移」などのオプションを追加可能
    // 現状は変数を送るだけのシンプルな機能とするためプロパティは最小限
  ],
};