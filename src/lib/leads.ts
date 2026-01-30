import { supabase } from './supabaseClient';
import { detectEnvironment } from './analytics';
import { usePageStore } from '../stores/usePageStore';
import { usePreviewStore } from '../stores/usePreviewStore';

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
  // projectIdが指定されていない場合はURLから取得、それでもなければStoreから取得
  let resolvedProjectId = projectId || getProjectIdFromUrl();

  if (!resolvedProjectId) {
    // Import store dynamically to avoid circular dependencies if this file is imported by stores
    const { useProjectStore } = await import('../stores/useProjectStore');
    resolvedProjectId = useProjectStore.getState().currentProjectId || null;
  }

  if (!resolvedProjectId) {
    console.error('Project ID missing. URL:', window.location.href);
    throw new Error('Project ID is required. Please provide it as an argument or ensure it is in the URL.');
  }

  // 1. 最新のマスタデータとログを取得 (Storeから直接取得して整合性を担保)
  const pageState = usePageStore.getState();
  const previewState = usePreviewStore.getState();
  const pageId = pageState.selectedPageId;

  // 全ページのアイテムを取得（スコア計算のため）
  const allPlacedItems: PlacedItemType[] = [];
  Object.values(pageState.pages).forEach(page => {
    if (page && page.placedItems) {
      allPlacedItems.push(...page.placedItems);
    }
  });

  // フォールバック: 現在ページのアイテムのみ
  const placedItems = allPlacedItems.length > 0 ? allPlacedItems :
    ((pageId && pageState.pages[pageId]) ? pageState.pages[pageId].placedItems : (_placedItems || []));

  // NOTE: Analytics logs are now sent directly to DB, so we fetch from DB to ensure accuracy.
  // Get session_id to fetch relevant logs
  let sessionId = sessionStorage.getItem('engage_session_id');
  if (!sessionId) {
    // crypto.randomUUID() はセキュアコンテキスト（HTTPS）でのみ利用可能なためフォールバック
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      sessionId = crypto.randomUUID();
    } else {
      sessionId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }
    sessionStorage.setItem('engage_session_id', sessionId);
  }

  // 最後のリード送信時刻を取得（それ以降のログだけを検知対象とする）
  const lastLeadSubmitTime = sessionStorage.getItem('engage_last_lead_submit');
  const filterTimestamp = lastLeadSubmitTime || new Date(0).toISOString();

  // Fetch analytics logs from DB for this session to detect behavior flags
  // Only fetch logs created AFTER the last lead submission
  let analyticsLogs: any[] = [];
  try {
    const { data: logs, error: logsError } = await supabase
      .from('analytics_logs')
      .select('event_type, metadata, created_at')
      .eq('project_id', resolvedProjectId)
      .eq('session_id', sessionId)
      .in('event_type', ['input_paste', 'idle_hesitation', 'rage_click'])
      .gt('created_at', filterTimestamp); // 前回送信以降のログのみ

    if (logsError) {
      console.warn('[Lead Submit] Failed to fetch analytics logs:', logsError);
      analyticsLogs = _analyticsLogs || [];
    } else {
      analyticsLogs = logs || [];
      if (import.meta.env.DEV) {
        console.log('🔍 [Lead Submit] Fetched analytics logs:', {
          sessionId,
          filterTimestamp,
          logCount: analyticsLogs.length,
          eventTypes: analyticsLogs.map(l => l.event_type)
        });
      }
    }
  } catch (err) {
    console.warn('[Lead Submit] Error fetching analytics logs:', err);
    analyticsLogs = _analyticsLogs || [];
  }

  // UTMパラメータの取得
  const utmParams = {
    source: sessionStorage.getItem('utm_source'),
    medium: sessionStorage.getItem('utm_medium'),
    campaign: sessionStorage.getItem('utm_campaign'),
  };

  // 2. スコア再計算 (送信時計算モデル)
  // ★ 重要: usePreviewStoreのvariablesから_system_total_scoreを取得
  // logicEngine.tsでイベント発火時にここにスコアが蓄積される
  const variablesScore = Number(previewState.variables?._system_total_score || 0);

  // NOTE: dataパラメータにも_system_total_scoreが含まれる場合があるが、
  // variablesScoreと同じ値なので二重カウントを避けるため使用しない
  let totalScore = variablesScore;

  // 回答データ(data)の値と、アイテムIDを照合
  // dataがnull/undefinedの場合は空オブジェクトとして扱う
  const safeData = data || {};
  Object.values(safeData).forEach(value => {
    // valueが配列(複数選択)の場合と、単一の値の場合がある
    const valuesToCheck = Array.isArray(value) ? value : [value];

    valuesToCheck.forEach(val => {
      // 値(val)がアイテムIDと一致するものを探す（全ページから検索）
      const item = placedItems.find((i: PlacedItemType) => i.id === val);
      if (item && item.data.score) {
        totalScore += item.data.score;
      }
    });
  });

  if (import.meta.env.DEV) {
    console.log('📊 [Lead Submit] Score Calculation:', {
      variablesScore,
      itemBasedScore: totalScore - variablesScore,
      finalScore: totalScore
    });
  }

  // 3. ランク判定 (フォールバック用: DBトリガーでも計算されるが、即時反映のため)
  let rank = 'Cold';
  if (totalScore >= 76) rank = 'Super Hot';
  else if (totalScore >= 51) rank = 'Hot';
  else if (totalScore >= 26) rank = 'Warm';

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

  if (import.meta.env.DEV) {
    console.log('🚩 [Lead Submit] Behavior Flags:', behaviorFlags);
  }


  // 5. DB保存
  // session_id は既に上で取得済み




  const env = detectEnvironment();
  if (env !== 'production') {
    console.log(`%c🚧 [Lead Submit] Preview Mode - DB保存はスキップされました`, 'color: #f59e0b; font-style: italic;');
    return true; // 成功したふりをする
  }

  const { getClientIpAddress } = await import('./IpAddressTracker');
  const ipAddress = await getClientIpAddress();

  const { error } = await supabase.from('leads').insert({
    project_id: resolvedProjectId,
    session_id: sessionId, // Added: Required field
    data: data,
    total_score: totalScore, // Legacy support
    engagement_score: totalScore, // New standard
    maturity_rank: rank,
    behavior_flags: behaviorFlags,
    device_category: behaviorFlags.mobile ? 'mobile' : 'desktop',
    utm_source: utmParams.source,
    utm_medium: utmParams.medium,
    utm_campaign: utmParams.campaign,
    ip_address: ipAddress, // IPアドレスを保存
  });

  if (error) {
    console.error('Lead submission failed:', error);
    throw error;
  } else {
    // 送信成功時、現在時刻を記録（次回送信時のフィルタリングに使用）
    sessionStorage.setItem('engage_last_lead_submit', new Date().toISOString());
    console.log('Lead submitted successfully:', { rank, totalScore, flags: behaviorFlags });
    return true; // 成功を示す
  }
};
