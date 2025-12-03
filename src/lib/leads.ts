// src/lib/leads.ts

import { supabase } from './supabaseClient';
import { useProjectStore } from '../stores/useProjectStore';
import { getOrCreateSessionId } from './analytics';

/**
 * ユーザーのIPアドレスを取得するヘルパー関数
 * (外部APIを使用する簡易実装)
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

  // プレビュー中などでプロジェクトIDがない場合はスキップ
  if (!projectId) {
    console.log('[Leads/Dev] Data submission simulation:', variables);
    return true; // Simulate success
  }

  const sessionId = getOrCreateSessionId();
  const ipAddress = await fetchIpAddress();

  const payload = {
    project_id: projectId,
    session_id: sessionId,
    data: variables, // 全変数をJSONとして保存
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