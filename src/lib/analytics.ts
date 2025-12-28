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
  | 'interaction'     // ユーザー操作 (クリックなど)
  | 'error';          // ランタイムエラー

/**
 * 分析イベントのペイロード型
 */
export type AnalyticsEventPayload = {
  nodeId?: string;
  nodeType?: string;
  metadata?: Record<string, any>;
  // 他にも必要に応じて追加
};

/**
 * ログ送信関数
 */
export const logAnalyticsEvent = async (
  eventType: AnalyticsEventType,
  payload?: AnalyticsEventPayload,
  explicitProjectId?: string // ★追加: プロジェクトIDを明示的に指定可能にする
): Promise<void> => {
  try {
    // 引数で渡されたIDを優先し、なければStoreから取得
    const projectId = explicitProjectId || useProjectStore.getState().currentProjectId;

    // ローカルプロジェクトの場合はSupabaseに送信しない（UUID形式ではないため）
    if (!projectId || projectId.startsWith('local-')) {
      console.log('[Analytics] (Local Project - Not sent to Supabase)', {
        eventType,
        payload,
        projectId
      });
      return; // ローカルプロジェクトの場合は早期リターン
    }

    const timestamp = new Date().toISOString();

    const sessionId = getOrCreateSessionId(); // セッションIDを取得

    console.log('[Analytics] Event logged:', {
      eventType,
      projectId,
      sessionId, // ログにも表示
      payload,
      timestamp
    });

    const { error } = await supabase
      .from('analytics_logs')
      .insert({
        project_id: projectId,
        session_id: sessionId, // ★追加: 必須カラム
        event_type: eventType,
        node_id: payload?.nodeId,
        node_type: payload?.nodeType,
        metadata: payload?.metadata || {},
        created_at: timestamp
      });

    if (error) {
      console.error('[Analytics] Error logging event:', error);
    } else {
      console.log(`[Analytics] Success (${eventType}):`, payload);
    }
  } catch (error) {
    console.error('[Analytics] Unexpected error:', error);
  }
};