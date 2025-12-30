# Edge Function: external-api-proxy

このEdge Functionは、外部APIへのリクエストをプロキシして、ブラウザのCORS制限を回避します。

## 機能

- 外部API（webhook.siteなど）へのHTTPリクエストを中継
- CORSヘッダーを適切に設定
- GET、POST、PUT、PATCH、DELETE、HEADメソッドをサポート

## デプロイ方法

### 前提条件

Supabase CLIがインストールされていること:

```bash
# Mac (Homebrew)
brew install supabase/tap/supabase

# Windows (Scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### ログインと初期化

```bash
# Supabaseにログイン
supabase login

# プロジェクトのリンク（初回のみ）
supabase link --project-ref <your-project-ref>
```

### デプロイ

> **注**: この関数はコード内でJWT認証を完全にバイパスしているため、`config.toml`での設定は不要です。

```bash
# Edge Functionをデプロイ
supabase functions deploy external-api-proxy
```

### ローカルテスト

```bash
# ローカルでEdge Functionを起動
supabase functions serve external-api-proxy

# テストリクエスト（別ターミナルで実行）
curl -i --location --request POST 'http://localhost:54321/functions/v1/external-api-proxy' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"url":"https://webhook.site/YOUR-WEBHOOK-ID","method":"POST","body":{"test":"data"}}'
```

## 使用方法

フロントエンド（NetworkExecutor）から以下のように呼び出されます：

```typescript
const { data, error } = await supabase.functions.invoke('external-api-proxy', {
  body: {
    url: 'https://webhook.site/...',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { /* データ */ }
  }
});
```

## トラブルシューティング

### デプロイエラー

```bash
# プロジェクトのリンクを確認
supabase projects list

# 再度リンク
supabase link --project-ref <your-project-ref>
```

### CORS エラー

Edge Functionは `Access-Control-Allow-Origin: *` を設定しているため、CORS問題は発生しないはずです。それでもエラーが発生する場合は、Supabaseダッシュボードでログを確認してください。
