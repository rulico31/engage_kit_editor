-- ------------------------------------------------------------------------------
-- 0. RLS (Row Level Security) 自体の有効化
-- ------------------------------------------------------------------------------
-- これを実行しないとポリシーを作っても適用されません
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_logs ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 1. Projectsテーブルの閲覧権限ポリシーを修正
-- ------------------------------------------------------------------------------
-- 既存の「誰でも見れる」ポリシーを削除
DROP POLICY IF EXISTS "Public can view projects" ON projects;

-- 既存の新しいポリシーも念のため削除（エラー回避）
DROP POLICY IF EXISTS "Users can view own or published projects" ON projects;

-- 新しいポリシー: 「自分のもの OR 公開済み」のみ閲覧可能
-- ※ is_published = true はWebViewerなどで公開ページを見るために必要
CREATE POLICY "Users can view own or published projects" 
ON projects FOR SELECT 
USING (
  (auth.uid() = user_id) 
  OR 
  (is_published = true)
);

-- ------------------------------------------------------------------------------
-- 2. 注意: 既存の「孤立した」プロジェクトについて
-- ------------------------------------------------------------------------------
-- 以前作成した user_id が NULL の古いプロジェクトは、このポリシー適用後
-- 所有者も誰でもないため、一覧から見えなくなります（意図通りの挙動です）。
-- テストデータとして消えて良いものと判断して進めてください。
