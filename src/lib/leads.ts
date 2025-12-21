// src/lib/leads.ts

import { supabase } from './supabaseClient';
import { useProjectStore } from '../stores/useProjectStore';
import { getOrCreateSessionId } from './analytics';

/**
 * ユーザーのIPアドレスを取得するヘルパー関数
 */
const fetchIpAddress = async (): Promise<string | null> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    if (response.ok) {
      const data = await response.json();
      return data.ip;
    }
    return null;
  } catch (e) {
    console.warn('Failed to fetch IP address', e);
    return null;
  }
};

/**
 * デバイスタイプを簡易判定
 */
const getDeviceType = (): string => {
  const ua = navigator.userAgent;
  if (/mobile/i.test(ua)) return 'mobile';
  if (/iPad|Android|Touch/i.test(ua)) return 'tablet';
  return 'desktop';
};

/**
 * リードデータの送信
 * @param variables 現在の全変数（回答データ、スコア等）
 * @returns 送信成功時はtrue, 失敗時はfalse
 */
export const submitLeadData = async (variables: Record<string, any>): Promise<boolean> => {
  const projectId = useProjectStore.getState().currentProjectId;

  // プレビュー中などでプロジェクトIDがない場合、またはローカルプロジェクトの場合はスキップ
  if (!projectId || projectId.startsWith('local-')) {
    console.log('[Leads/Dev] Data submission simulation (Local/No ID):', variables);
    return true;
  }

  // 1. 月間回答数制限のチェック (Phase 4: Billing Gate)
  try {
    const { data: isAllowed, error: rpcError } = await supabase.rpc('check_monthly_lead_limit', {
      project_uuid: projectId
    });

    if (rpcError) {
      console.error('[Leads] Limit check failed:', rpcError);
      // チェックに失敗しても、サーバーエラーでユーザーをブロックしないように
      // 安全側に倒して送信を許可するか、厳格にするかはビジネス判断。
      // ここでは厳格にエラーログを出して続行とします（ベータ版想定）。
    }

    if (isAllowed === false) {
      console.warn('[Leads] Monthly limit reached for project:', projectId);
      alert("このプロジェクトの今月の回答受付数は上限に達しました。\n(Monthly submission limit reached)");
      return false; // 送信ブロック
    }

  } catch (e) {
    console.error('[Leads] Exception during limit check:', e);
  }

  // 2. データ送信処理
  const sessionId = getOrCreateSessionId();
  const ipAddress = await fetchIpAddress();

  const payload = {
    project_id: projectId,
    session_id: sessionId,
    data: variables,
    ip_address: ipAddress,
    user_agent: navigator.userAgent,
    referrer: document.referrer,
    device_type: getDeviceType(),
  };

  const { error } = await supabase
    .from('leads')
    .insert(payload);

  if (error) {
    console.error('[Leads] Error submitting data:', error);
    return false;
  } else {
    console.log('[Leads] Data submitted successfully');
    return true;
  }
};