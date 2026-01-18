import { supabase } from './supabaseClient';
import { usePageStore } from '../stores/usePageStore';

import type { PlacedItemType } from '../types';

/**
 * URLからproject_idを取得するヘルパー
 */
const getProjectIdFromUrl = (): string | null => {
  const params = new URLSearchParams(window.location.search);
  return params.get('project_id');
};

/**
 * リードデータを送信する
 * B2B行動分析機能: 送信時スコア再計算 & 行動フラグ生成を含む
 * 
 * @param data - フォームデータ（変数の値）
 * @param projectId - オプショナル。省略時はURLから取得
 * @param _placedItems - 互換性維持用（内部ではストアを使用）
 * @param _analyticsLogs - 互換性維持用
 */
export const submitLeadData = async (
  data: Record<string, any>,
  projectId?: string,
  _placedItems?: PlacedItemType[],
  _analyticsLogs?: any[]
) => {
  // projectIdが指定されていない場合はURLから取得
  const resolvedProjectId = projectId || getProjectIdFromUrl();
  if (!resolvedProjectId) {
    throw new Error('Project ID is required. Please provide it as an argument or ensure it is in the URL.');
  }

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
  // dataがnull/undefinedの場合は空オブジェクトとして扱う
  const safeData = data || {};
  Object.values(safeData).forEach(value => {
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
  // session_idの取得または生成
  let sessionId = sessionStorage.getItem('engage_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem('engage_session_id', sessionId);
  }

  const { error } = await supabase.from('leads').insert({
    project_id: resolvedProjectId,
    session_id: sessionId, // Added: Required field
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
