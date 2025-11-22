// src/lib/supabaseClient.ts

import { createClient } from '@supabase/supabase-js';

// 環境変数の読み込みチェック
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("🚨 Supabaseの環境変数が設定されていません！.envファイルを確認してください。");
}

// ★ ここが重要！ 'export const supabase' となっている必要があります。
// 'export default' になっているとエラーになります。
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co", 
  supabaseAnonKey || "placeholder-key"
);