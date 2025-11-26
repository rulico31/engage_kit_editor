// src/lib/analytics.ts

import { supabase } from './supabaseClient';
import { useProjectStore } from '../stores/useProjectStore';

// セッションIDのキー
const SESSION_KEY = 'engage_kit_session_id';

/**
 * セッションIDを取得または生成する
 * (ユニークユーザー数 UU の計測に使用)
 */
export const getOrCreateSessionId = (): string => {
  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
};

/**
 * 分析イベントの種類
 */
export type AnalyticsEventType = 
  | 'page_view'       // ビュー数 (PV)
  | 'node_execution'  // ノード実行 (ステップ進行・完了率・離脱率の基礎)
  | 'logic_branch'    // ロジック分岐 (Ifノードの結果など)
  | 'interaction';    // ユーザー操作 (クリックなど)

/**
 * ログ送信関数
 */
export const logAnalyticsEvent = async (
  eventType: AnalyticsEventType,
  payload?: {
    nodeId?: string;
    nodeType?: string;
    metadata?: Record<string, any>;
  }
) => {
  try {
    // 現在のプロジェクトIDを取得
    const projectId = useProjectStore.getState().currentProjectId;
    
    // プロジェクトIDがない場合（エディタでのプレビュー中など）は送信しない、またはコンソールのみ
    if (!projectId) {
      if (import.meta.env.DEV) {
        console.log(`[Analytics/Dev] ${eventType}`, payload);
      }
      return;
    }

    const sessionId = getOrCreateSessionId();

    const { error } = await supabase
      .from('analytics_logs')
      .insert({
        project_id: projectId,
        session_id: sessionId,
        event_type: eventType,
        node_id: payload?.nodeId || null,
        node_type: payload?.nodeType || null,
        metadata: payload?.metadata || {},
      });

    if (error) {
      console.error('[Analytics] Error logging event:', error);
    }
  } catch (err) {
    console.error('[Analytics] Unexpected error:', err);
  }
};