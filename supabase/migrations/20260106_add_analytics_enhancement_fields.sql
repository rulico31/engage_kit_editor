-- Migration: add_analytics_enhancement_fields
-- Description: UTMパラメータとデバイス情報をanalytics_logsとleadsテーブルに追加
-- Created: 2026-01-06

-- =========================================
-- analytics_logs テーブル拡張
-- =========================================

-- UTMデータカラム追加
ALTER TABLE analytics_logs
ADD COLUMN IF NOT EXISTS utm_data JSONB;

-- デバイス情報カラム追加
ALTER TABLE analytics_logs
ADD COLUMN IF NOT EXISTS device_info JSONB;

-- =========================================
-- インデックス作成（検索パフォーマンス最適化）
-- =========================================

-- UTM source インデックス（流入元別分析用）
CREATE INDEX IF NOT EXISTS idx_analytics_logs_utm_source 
ON analytics_logs ((utm_data->>'utm_source'));

-- UTM campaign インデックス（キャンペーン別分析用）
CREATE INDEX IF NOT EXISTS idx_analytics_logs_utm_campaign 
ON analytics_logs ((utm_data->>'utm_campaign'));

-- デバイスタイプ インデックス（デバイス別分析用）
CREATE INDEX IF NOT EXISTS idx_analytics_logs_device_type 
ON analytics_logs ((device_info->>'device_type'));

-- OS名 インデックス（OS別分析用）
CREATE INDEX IF NOT EXISTS idx_analytics_logs_os_name 
ON analytics_logs ((device_info->>'os_name'));

-- =========================================
-- leads テーブル拡張
-- =========================================

-- UTMデータカラム追加（リード獲得時の流入元保存）
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS utm_data JSONB;

-- =========================================
-- コメント追加（ドキュメント用）
-- =========================================

COMMENT ON COLUMN analytics_logs.utm_data IS 'UTMパラメータ（流入元トラッキング）: { utm_source, utm_medium, utm_campaign, utm_term, utm_content, captured_at }';
COMMENT ON COLUMN analytics_logs.device_info IS 'デバイス情報: { device_type, os_name, os_version, browser_name, browser_version, screen_width, screen_height, pixel_ratio, viewport_width, viewport_height, language, timezone }';
COMMENT ON COLUMN leads.utm_data IS 'リード獲得時のUTMパラメータ（マーケティング分析用）';

-- =========================================
-- 分析用ビュー作成
-- =========================================

-- UTM別コンバージョン分析ビュー
CREATE OR REPLACE VIEW utm_conversion_analysis AS
SELECT 
  (utm_data->>'utm_source') as utm_source,
  (utm_data->>'utm_medium') as utm_medium,
  (utm_data->>'utm_campaign') as utm_campaign,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(*) as total_events,
  COUNT(DISTINCT CASE WHEN event_type = 'form_submit' THEN user_id END) as conversions
FROM analytics_logs
WHERE utm_data IS NOT NULL
GROUP BY 
  (utm_data->>'utm_source'),
  (utm_data->>'utm_medium'),
  (utm_data->>'utm_campaign')
ORDER BY unique_users DESC;

-- デバイス別パフォーマンス分析ビュー
CREATE OR REPLACE VIEW device_performance_analysis AS
SELECT 
  (device_info->>'device_type') as device_type,
  (device_info->>'os_name') as os_name,
  (device_info->>'browser_name') as browser_name,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(*) as total_events
FROM analytics_logs
WHERE device_info IS NOT NULL
GROUP BY 
  (device_info->>'device_type'),
  (device_info->>'os_name'),
  (device_info->>'browser_name')
ORDER BY unique_users DESC;

COMMENT ON VIEW utm_conversion_analysis IS 'UTMパラメータ別のユーザー数・イベント数・コンバージョン数を集計';
COMMENT ON VIEW device_performance_analysis IS 'デバイス・OS・ブラウザ別のユーザー数・イベント数を集計';
