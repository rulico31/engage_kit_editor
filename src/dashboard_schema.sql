-- Analytics Dashboard Schema
-- Execute this in Supabase SQL Editor to create Views for the dashboard

-- ==============================================================================
-- 1. Daily Statistics View (PV, UU, CVR)
-- ==============================================================================
CREATE OR REPLACE VIEW analytics_daily_stats AS
SELECT
  project_id,
  DATE(created_at) as date,
  COUNT(*) as pv,
  COUNT(DISTINCT session_id) as uu,
  COUNT(CASE WHEN event_type = 'lead_submit' THEN 1 END) as cv,
  CASE 
    WHEN COUNT(DISTINCT session_id) > 0 
    THEN (COUNT(CASE WHEN event_type = 'lead_submit' THEN 1 END)::float / COUNT(DISTINCT session_id)) * 100 
    ELSE 0 
  END as cvr
FROM analytics_logs
GROUP BY project_id, DATE(created_at);

-- ==============================================================================
-- 2. Node Drop-off View
-- ==============================================================================
-- This view aggregates how many times each node was "viewed" or "interacted with".
-- Note: This requires 'node_view' or similar events to be logged. 
-- If we only have 'page_view' and 'click', we can approximate.
-- For now, we'll assume 'click' events on nodes count as interactions.
CREATE OR REPLACE VIEW analytics_node_stats AS
SELECT
  project_id,
  metadata->>'nodeId' as node_id,
  COUNT(*) as interaction_count,
  COUNT(DISTINCT session_id) as unique_users
FROM analytics_logs
WHERE event_type = 'click' OR event_type = 'node_view'
GROUP BY project_id, metadata->>'nodeId';

-- ==============================================================================
-- 3. A/B Test Results View
-- ==============================================================================
-- Aggregates performance by A/B test groups (assigned via metadata)
CREATE OR REPLACE VIEW analytics_ab_test_stats AS
SELECT
  project_id,
  metadata->>'abGroup' as variant, -- e.g., 'A' or 'B'
  COUNT(DISTINCT session_id) as visitors,
  COUNT(DISTINCT CASE WHEN event_type = 'lead_submit' THEN session_id END) as conversions,
  CASE 
    WHEN COUNT(DISTINCT session_id) > 0 
    THEN (COUNT(DISTINCT CASE WHEN event_type = 'lead_submit' THEN session_id END)::float / COUNT(DISTINCT session_id)) * 100 
    ELSE 0 
  END as conversion_rate
FROM analytics_logs
WHERE metadata->>'abGroup' IS NOT NULL
GROUP BY project_id, metadata->>'abGroup';
