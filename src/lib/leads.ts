import { supabase } from './supabaseClient';
import { usePageStore } from '../stores/usePageStore';

import type { PlacedItemType } from '../types';

/**
 * リードデータを送信する
 * B2B行動分析機能: 送信時スコア再計算 & 行動フラグ生成を含む
 */
export const submitLeadData = async (
  projectId: string,
  data: Record<string, any>,
  // 引数互換性のため残すが、内部ではStoreの最新状態を優先して使用することを推奨
  _placedItems?: PlacedItemType[],
  _analyticsLogs?: any[]
) => {

  // 1. 最新のマスタデータとログを取得 (Storeから直接取得して整合性を担保)
  // 1. 最新のマスタデータとログを取得
  const state = usePageStore.getState();
  const pageId = state.selectedPageId;
  const placedItems = (pageId && state.pages[pageId]) ? state.pages[pageId].placedItems : (_placedItems || []);

  // NOTE: Analytics logs are now sent directly to DB, so we rely on what's passed or fetch if critical.
  // For this implementation, we use the passed _analyticsLogs if available, or empty array.
  // In a real scenario, we might want to fetch from DB or keep a short buffer in a store.
  const analyticsLogs = _analyticsLogs || [];

  // UTMパラメータの取得
  const utmParams = {
    source: sessionStorage.getItem('utm_source'),
    medium: sessionStorage.getItem('utm_medium'),
    campaign: sessionStorage.getItem('utm_campaign'),
  };

  // 2. スコア再計算 (送信時計算モデル)
  let totalScore = 0;

  // 回答データ(data)の値と、アイテムIDを照合
  Object.values(data).forEach(value => {
    // valueが配列(複数選択)の場合と、単一の値の場合がある
    const valuesToCheck = Array.isArray(value) ? value : [value];

    valuesToCheck.forEach(val => {
      // 値(val)がアイテムIDと一致するものを探す
      const item = placedItems.find(i => i.id === val);
      if (item && item.data.score) {
        totalScore += item.data.score;
      }
    });
  });

  // 3. ランク判定
  let rank = 'Cold';
  if (totalScore >= 80) rank = 'Hot';
  else if (totalScore >= 30) rank = 'Warm';

  // 4. 行動フラグ生成 (JSONB)
  const behaviorFlags: any = {};

  // ペースト検知
  if (analyticsLogs.some((l: any) => l.event_type === 'input_paste')) {
    behaviorFlags.pasted = true;
  }
  // 熟考検知
  if (analyticsLogs.some((l: any) => l.event_type === 'idle_hesitation')) {
    behaviorFlags.long_idle = true;
  }
  // レイジクリック
  if (analyticsLogs.some((l: any) => l.event_type === 'rage_click')) {
    behaviorFlags.rage = true;
  }
  // モバイル判定
  if (/Mobi|Android/i.test(navigator.userAgent)) {
    behaviorFlags.mobile = true;
  }

  // 5. DB保存
  const { error } = await supabase.from('leads').insert({
    project_id: projectId,
    data: data,
    total_score: totalScore,
    maturity_rank: rank,
    behavior_flags: behaviorFlags,
    device_category: behaviorFlags.mobile ? 'mobile' : 'desktop',
    utm_source: utmParams.source,
    utm_medium: utmParams.medium,
    utm_campaign: utmParams.campaign,
    // ip_address等はSupabase側で取得するか、Edge Functions経由が必要(ここでは省略)
  });

  if (error) {
    console.error('Lead submission failed:', error);
    throw error;
  } else {
    console.log('Lead submitted successfully:', { rank, totalScore, flags: behaviorFlags });
  }
};
