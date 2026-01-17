import { supabase } from './supabaseClient';

export type AnalyticsEventType =
  | 'page_view'
  | 'node_execution'
  | 'lead_submit'
  | 'session_start'
  | 'input_paste'        // B2B: 外部テキスト貼り付け
  | 'input_correction'   // B2B: 推敲・修正
  | 'input_abandonment'  // B2B: 入力放棄
  | 'idle_hesitation'    // B2B: 熟考・停止
  | 'rage_click'         // B2B: イライラ
  | 'interaction'        // B2B: 汎用インタラクション (Thinking Time計測用)
  | 'exit_context';      // B2B: 離脱時の状況

export interface AnalyticsEvent {
  project_id: string;
  session_id: string;
  event_type: AnalyticsEventType;
  node_id?: string;
  page_id?: string;
  metadata?: Record<string, any>;
  created_at?: string;
}

// セッションIDの生成・取得 (簡易実装)
const getSessionId = () => {
  let sid = sessionStorage.getItem('engage_session_id');
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem('engage_session_id', sid);
  }
  return sid;
};

export const logAnalyticsEvent = async (
  eventType: AnalyticsEventType,
  metadata: Record<string, any> = {},
  projectId?: string
) => {
  const sessionId = getSessionId();
  // プロジェクトIDは引数で渡されるか、storeなどから取得する必要がある
  // ここでは簡易的に引数または空文字とする(実際はViewerContext等から注入推奨)
  const pid = projectId || '';

  // 開発環境のコンソールログ
  if (import.meta.env.DEV) {
    console.log(`[Analytics] ${eventType}`, metadata);
  }

  if (!pid) return;

  try {
    const { error } = await supabase
      .from('analytics_logs')
      .insert({
        project_id: pid,
        session_id: sessionId,
        event_type: eventType,
        metadata: metadata,
        // node_id, page_id は metadata から抽出して保存してもよい
      });

    if (error) {
      console.error('Failed to log analytics event:', error);
    }
  } catch (err) {
    console.error('Analytics logging error:', err);
  }
};