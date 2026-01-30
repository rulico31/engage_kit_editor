# Vercelへのデプロイ手順

このプロジェクトをVercelにデプロイするための手順です。

## 1. Vercelプロジェクトの作成

1. [Vercelダッシュボード](https://vercel.com/dashboard)にアクセスします。
2. **"Add New..."** > **"Project"** をクリックします。
3. GitHubリポジトリ（`engage-kit-editor`）をインポートします。

## 2. デプロイ設定（重要）

インポート時の設定画面で以下を確認・設定してください。

- **Framework Preset**: `Vite` が自動選択されているはずです。そのままでOKです。
- **Root Directory**: `./` （デフォルトのまま）
- **Build Command**: `npm run build` （デフォルトのまま）
- **Output Directory**: `dist` （デフォルトのまま）
- **Install Command**: `npm install` （デフォルトのまま）

### 環境変数の設定 (Environment Variables)

Supabaseなどの環境変数が必要です。`.env` または `.env.local` の内容をコピーして設定してください。

- `VITE_SUPABASE_URL`: あなたのSupabase URL
- `VITE_SUPABASE_ANON_KEY`: あなたのSupabase Anon Key

## 3. デプロイするブランチ

現在、開発は `develop` ブランチで行われています。
Vercelはデフォルトで `main` ブランチをProductionデプロイとして扱いますが、設定で `develop` をデプロイ対象にできます。

### 方法A: Settingsで変更する
1. プロジェクト作成後、**Settings** > **Git** に移動します。
2. **Production Branch** を `develop` に変更して保存します。
3. これで `develop` へのプッシュが自動的に本番環境にデプロイされます。

### 方法B: 手動デプロイまたはPreviewとして扱う
- そのままデプロイすると、`develop` ブランチは "Preview" Deploymentとして扱われる場合があります。
- URLは `project-name-git-develop-user.vercel.app` のようになります。

## 4. 動作確認

デプロイ完了後、発行されたURLにアクセスして確認します。

- **エディタ画面**:  
  `https://your-project.vercel.app/`  
  → ログイン画面またはエディタが表示されること。

- **ビューワー画面**:  
  `https://your-project.vercel.app/viewer?project_id=YOUR_ID`  
  → 指定したプロジェクトのビューワーが表示されること。

## トラブルシューティング

- **404エラーが出る場合**:
  - `vercel.json` の設定が反映されているか確認してください。
  - ルートURL以外でリロードした際に404になる場合は、SPAルーティング設定（rewrite）が効いていない可能性があります。

- **画面が真っ白になる場合**:
  - ブラウザのコンソール（F12）を確認し、JavaScriptエラーが出ているか確認してください。
  - 環境変数が不足している可能性があります。
