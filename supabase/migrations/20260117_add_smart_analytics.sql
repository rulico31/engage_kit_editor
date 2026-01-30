-- B2B行動ログ分析機能のためのカラム追加
-- 2026-01-17

-- リードテーブルに行動分析用のカラムを追加
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS total_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS maturity_rank TEXT DEFAULT 'Cold', -- 'Hot', 'Warm', 'Cold'
ADD COLUMN IF NOT EXISTS behavior_flags JSONB DEFAULT '{}'::jsonb, -- 行動フラグキャッシュ (例: {"pasted": true, "mobile": true})
ADD COLUMN IF NOT EXISTS utm_source TEXT,
ADD COLUMN IF NOT EXISTS utm_medium TEXT,
ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
ADD COLUMN IF NOT EXISTS device_category TEXT DEFAULT 'desktop'; -- 'mobile', 'tablet', 'desktop'

-- ダッシュボード表示の高速化用インデックス
CREATE INDEX IF NOT EXISTS idx_leads_ranking ON leads (total_score DESC, maturity_rank);
