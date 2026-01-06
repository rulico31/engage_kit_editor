-- Migration: add_phase2_phase3_analytics_fields
-- Description: Phase 2（滞在時間・入力修正検知）とPhase 3（スコアリング）のフィールドを追加
-- Created: 2026-01-06
-- 実行方法: Supabase Dashboard → SQL Editor → このスクリプトを貼り付けて実行

-- =========================================
--  Phase 2: 心理・迷いの可視化
-- =========================================

-- 
-- 注意: Phase 2の機能はmetadataフィールド（JSONB）内に記録されます
-- analytics_logsテーブルの構造変更は不要ですが、
-- 分析を容易にするためのインデックスとビューを作成します
--

-- 滞在時間分析用インデックス
-- metadata内のduration_msフィールドに対するインデックス
CREATE INDEX IF NOT EXISTS idx_analytics_logs_duration 
ON analytics_logs ((metadata->>'duration_ms')) 
WHERE event_type = 'node_execution' 
AND metadata->>'duration_ms' IS NOT NULL;

-- 即断判定用インデックス
CREATE INDEX IF NOT EXISTS idx_analytics_logs_quick_decision 
ON analytics_logs ((metadata->>'is_quick_decision')) 
WHERE event_type = 'node_execution';

-- 熟考判定用インデックス
CREATE INDEX IF NOT EXISTS idx_analytics_logs_deep_thinking 
ON analytics_logs ((metadata->>'is_deep_thinking')) 
WHERE event_type = 'node_execution';

-- 入力修正検知用インデックス
-- hesitation_scoreフィールドに対するインデックス
CREATE INDEX IF NOT EXISTS idx_analytics_logs_hesitation_score 
ON analytics_logs ((metadata->>'hesitation_score')) 
WHERE metadata->>'hesitation_score' IS NOT NULL;

-- バックトラッキング用インデックス
CREATE INDEX IF NOT EXISTS idx_analytics_logs_backtracking 
ON analytics_logs (event_type) 
WHERE event_type = 'backtracking';

-- =========================================
-- Phase 2: 分析用ビュー
-- =========================================

-- ノード滞在時間分析ビュー
CREATE OR REPLACE VIEW node_dwell_time_analysis AS
SELECT 
  project_id,
  user_id,
  session_id,
  (metadata->>'node_id') as node_id,
  (metadata->>'node_type') as node_type,
  (metadata->>'duration_ms')::integer as duration_ms,
  (metadata->>'is_quick_decision')::boolean as is_quick_decision,
  (metadata->>'is_deep_thinking')::boolean as is_deep_thinking,
  (metadata->>'is_anomaly')::boolean as is_anomaly,
  created_at
FROM analytics_logs
WHERE event_type = 'node_execution'
AND metadata->>'duration_ms' IS NOT NULL
ORDER BY created_at DESC;

COMMENT ON VIEW node_dwell_time_analysis IS 
'ノード滞在時間の分析用ビュー。即断（<3秒）、熟考（>10秒）、異常（>3分）を判定';

-- 入力修正行動分析ビュー
CREATE OR REPLACE VIEW input_correction_analysis AS
SELECT 
  project_id,
  user_id,
  session_id,
  (metadata->>'hesitation_score')::integer as hesitation_score,
  (metadata->>'backspace_count')::integer as backspace_count,
  (metadata->>'delete_count')::integer as delete_count,
  (metadata->>'major_deletion_count')::integer as major_deletion_count,
  (metadata->>'ime_backspace_count')::integer as ime_backspace_count,
  (metadata->>'first_value') as first_value,
  (metadata->>'final_value') as final_value,
  (metadata->>'max_char_delta')::integer as char_change,
  created_at
FROM analytics_logs
WHERE metadata->>'hesitation_score' IS NOT NULL
ORDER BY (metadata->>'hesitation_score')::integer DESC;

COMMENT ON VIEW input_correction_analysis IS 
'入力修正行動の分析用ビュー。迷いスコア、バックスペース回数、IME対応済み';

-- バックトラッキング分析ビュー
CREATE OR REPLACE VIEW backtracking_analysis AS
SELECT 
  project_id,
  user_id,
  session_id,
  (metadata->>'from_page_id') as from_page_id,
  (metadata->>'from_node_id') as from_node_id,
  (metadata->>'to_page_id') as to_page_id,
  (metadata->>'to_node_id') as to_node_id,
  (metadata->>'backtrack_distance')::integer as backtrack_distance,
  (metadata->>'revisit_count')::integer as revisit_count,
  (metadata->>'total_backtracks')::integer as total_backtracks,
  created_at
FROM analytics_logs
WHERE event_type = 'backtracking'
ORDER BY created_at DESC;

COMMENT ON VIEW backtracking_analysis IS 
'バックトラッキング（戻る操作）の分析用ビュー。不安ポイントの特定に使用';

-- =========================================
--  Phase 3: スコアリングと連携
-- =========================================

-- leads テーブル拡張
-- エンゲージメントスコア関連カラムを追加
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS engagement_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS score_breakdown JSONB,
ADD COLUMN IF NOT EXISTS score_tier TEXT;

-- コメント追加
COMMENT ON COLUMN leads.engagement_score IS 'エンゲージメントスコア（0-100点）';
COMMENT ON COLUMN leads.score_breakdown IS 'スコア履歴の詳細（最大50件、JSONB配列）';
COMMENT ON COLUMN leads.score_tier IS 'スコア帯（cold/warm/hot/super_hot）';

-- スコア帯自動計算トリガー関数
CREATE OR REPLACE FUNCTION update_score_tier()
RETURNS TRIGGER AS $$
BEGIN
  -- engagement_scoreに基づいてscore_tierを自動設定
  NEW.score_tier := CASE
    WHEN NEW.engagement_score >= 76 THEN 'super_hot'
    WHEN NEW.engagement_score >= 51 THEN 'hot'
    WHEN NEW.engagement_score >= 26 THEN 'warm'
    ELSE 'cold'
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_score_tier() IS 
'エンゲージメントスコアに基づいてスコア帯を自動計算（cold/warm/hot/super_hot）';

-- トリガーの作成（既存の場合は削除して再作成）
DROP TRIGGER IF EXISTS trigger_update_score_tier ON leads;

CREATE TRIGGER trigger_update_score_tier
BEFORE INSERT OR UPDATE OF engagement_score ON leads
FOR EACH ROW
EXECUTE FUNCTION update_score_tier();

-- スコア関連インデックス
CREATE INDEX IF NOT EXISTS idx_leads_engagement_score 
ON leads (engagement_score DESC);

CREATE INDEX IF NOT EXISTS idx_leads_score_tier 
ON leads (score_tier);

-- =========================================
-- Phase 3: 分析用ビュー
-- =========================================

-- エンゲージメントスコア変更履歴ビュー
CREATE OR REPLACE VIEW score_change_history AS
SELECT 
  project_id,
  user_id,
  session_id,
  (metadata->>'current_score')::integer as current_score,
  (metadata->>'score_delta')::integer as score_delta,
  (metadata->>'score_tier') as score_tier,
  (metadata->>'reason') as reason,
  node_id,
  node_type,
  created_at
FROM analytics_logs
WHERE event_type = 'score_change'
ORDER BY created_at DESC;

COMMENT ON VIEW score_change_history IS 
'エンゲージメントスコア変更履歴。スコア加算の理由と変動を追跡';

-- リード品質分析ビュー（スコア帯別）
CREATE OR REPLACE VIEW lead_quality_analysis AS
SELECT 
  score_tier,
  COUNT(*) as total_leads,
  AVG(engagement_score) as avg_score,
  MIN(engagement_score) as min_score,
  MAX(engagement_score) as max_score,
  ROUND(AVG(engagement_score)::numeric, 2) as average
FROM leads
WHERE engagement_score IS NOT NULL
GROUP BY score_tier
ORDER BY 
  CASE score_tier
    WHEN 'super_hot' THEN 1
    WHEN 'hot' THEN 2
    WHEN 'warm' THEN 3
    WHEN 'cold' THEN 4
  END;

COMMENT ON VIEW lead_quality_analysis IS 
'リードの品質分析。スコア帯別の統計情報';

-- =========================================
-- 分析用の便利な関数
-- =========================================

-- ユーザーの迷いポイントを抽出する関数
CREATE OR REPLACE FUNCTION get_user_hesitation_points(
  p_user_id TEXT,
  p_session_id TEXT
)
RETURNS TABLE (
  node_id TEXT,
  node_type TEXT,
  duration_ms INTEGER,
  hesitation_score INTEGER,
  backtrack_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (l.metadata->>'node_id')::TEXT as node_id,
    (l.metadata->>'node_type')::TEXT as node_type,
    (l.metadata->>'duration_ms')::INTEGER as duration_ms,
    (l.metadata->>'hesitation_score')::INTEGER as hesitation_score,
    COUNT(b.*)::INTEGER as backtrack_count
  FROM analytics_logs l
  LEFT JOIN analytics_logs b 
    ON b.user_id = p_user_id 
    AND b.session_id = p_session_id
    AND b.event_type = 'backtracking'
    AND b.metadata->>'to_node_id' = l.metadata->>'node_id'
  WHERE l.user_id = p_user_id
    AND l.session_id = p_session_id
    AND (
      (l.event_type = 'node_execution' AND (l.metadata->>'is_deep_thinking')::boolean = true)
      OR (l.metadata->>'hesitation_score' IS NOT NULL AND (l.metadata->>'hesitation_score')::integer > 50)
    )
  GROUP BY l.metadata->>'node_id', l.metadata->>'node_type', 
           l.metadata->>'duration_ms', l.metadata->>'hesitation_score'
  ORDER BY hesitation_score DESC NULLS LAST, duration_ms DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_user_hesitation_points IS 
'特定ユーザーの迷いポイントを抽出（滞在時間・入力修正・バックトラッキングを統合）';

-- =========================================
-- データ整合性チェック
-- =========================================

-- このスクリプト実行後に以下を確認してください:

-- 1. インデックスの確認
-- SELECT schemaname, tablename, indexname 
-- FROM pg_indexes 
-- WHERE tablename IN ('analytics_logs', 'leads')
-- ORDER BY tablename, indexname;

-- 2. トリガーの確認
-- SELECT trigger_name, event_manipulation, event_object_table 
-- FROM information_schema.triggers 
-- WHERE event_object_table = 'leads';

-- 3. ビューの確認
-- SELECT table_name 
-- FROM information_schema.views 
-- WHERE table_schema = 'public' 
-- AND table_name LIKE '%analysis%';

-- 4. テストデータでの動作確認（オプション）
-- INSERT INTO leads (user_id, email, data, engagement_score) 
-- VALUES ('test-user', 'test@example.com', '{}', 80);
-- 
-- SELECT engagement_score, score_tier FROM leads WHERE user_id = 'test-user';
-- -- 期待結果: engagement_score=80, score_tier='super_hot'
-- 
-- DELETE FROM leads WHERE user_id = 'test-user'; -- テストデータ削除

-- =========================================
-- マイグレーション完了
-- =========================================

-- このマイグレーションにより以下が利用可能になります:
-- 
-- Phase 2:
-- - node_dwell_time_analysis ビュー: ノード滞在時間分析
-- - input_correction_analysis ビュー: 入力修正行動分析  
-- - backtracking_analysis ビュー: バックトラッキング分析
-- - get_user_hesitation_points() 関数: ユーザーの迷いポイント抽出
--
-- Phase 3:
-- - leads.engagement_score カラム: エンゲージメントスコア（0-100）
-- - leads.score_breakdown カラム: スコア履歴（JSONB）
-- - leads.score_tier カラム: スコア帯（自動計算）
-- - score_change_history ビュー: スコア変更履歴
-- - lead_quality_analysis ビュー: リード品質分析

SELECT 'マイグレーション完了: Phase 2 & 3 Analytics Enhancement' as status;
