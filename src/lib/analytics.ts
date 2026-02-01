import { supabase } from './supabaseClient';

export type AnalyticsEventType =
  | 'page_view'
  | 'node_execution'
  | 'lead_submit'
  | 'session_start'
  | 'input_paste'        // B2B: 外部テキスト貼り付け
  | 'input_correction'   // B2B: 推敲・修正
  | 'input_abandonment'  // B2B: 入力放棄
  | 'idle_hesitation'    // B2B: 熟考・停止
  | 'rage_click'         // B2B: イライラ
  | 'interaction'        // B2B: 汎用インタラクション (Thinking Time計測用)
  | 'exit_context'       // B2B: 離脱時の状況
  | 'backtracking'       // B2B: 戻る行動
  | 'score_change'       // B2B: スコア変動
  | 'logic_branch'      // ロジック分岐結果
  | 'error';

export interface AnalyticsEvent {
  project_id: string;
  session_id: string;
  event_type: AnalyticsEventType;
  node_id?: string;
  page_id?: string;
  metadata?: Record<string, any>;
  created_at?: string;
}

// UUID生成のフォールバック関数（crypto.randomUUIDが使えない場合）
const generateUUID = (): string => {
  // crypto.randomUUID() はセキュアコンテキスト（HTTPS）でのみ利用可能
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // フォールバック: 簡易的なUUID生成
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// セッションIDの生成・取得 (簡易実装)
const getSessionId = () => {
  let sid = sessionStorage.getItem('engage_session_id');
  if (!sid) {
    sid = generateUUID();
    sessionStorage.setItem('engage_session_id', sid);
  }
  return sid;
};


// 環境判定 (簡易実装)
export const detectEnvironment = (): 'production' | 'preview' | 'development' | 'unknown' => {
  if (typeof window === 'undefined') return 'unknown';
  const { hostname, pathname, search } = window.location;

  console.log('[Analytics] detectEnvironment called:', { hostname, pathname, search });

  // Viewer判定用のヘルパー関数
  const isViewerPath = () => pathname.includes('/view/') || pathname.includes('/viewer');

  // クエリパラメータでの判定 (App.tsxのルーティング仕様に合わせる)
  const isViewModeParam = () => {
    const params = new URLSearchParams(search);
    return params.get('mode') === 'view';
  };

  // ローカル/プライベートネットワーク判定
  const isLocalOrPrivateNetwork = () => {
    // localhost / 127.0.0.1
    if (hostname === 'localhost' || hostname === '127.0.0.1') return true;

    // Vercel Preview Deployments (AWS/Vercel URLs) - often have unique subdomains but not local IPs
    // If it's vercel.app, it's remote.

    // プライベートIPアドレス
    // 192.168.x.x
    if (hostname.startsWith('192.168.')) return true;
    // 10.x.x.x
    if (hostname.startsWith('10.')) return true;
    // 172.16.x.x - 172.31.x.x
    if (hostname.startsWith('172.')) {
      const secondOctet = parseInt(hostname.split('.')[1], 10);
      if (secondOctet >= 16 && secondOctet <= 31) return true;
    }
    return false;
  };

  // ローカル開発環境
  if (isLocalOrPrivateNetwork()) {
    // ローカルでも /view/ または /viewer があれば production 扱い（テスト用）
    if (isViewerPath() || isViewModeParam()) {
      console.log('[Analytics] Local/Private + viewer path/mode -> production');
      return 'production';
    }
    console.log('[Analytics] Local/Private without viewer path -> development');
    return 'development';
  }

  // 本番環境の判定: /view/ または /viewer パス、あるいは mode=view は公開ページ
  if (isViewerPath() || isViewModeParam()) {
    console.log('[Analytics] Remote + viewer path/mode -> production');
    return 'production';
  }

  // エディタ画面はプレビュー扱い
  if (pathname.includes('/editor')) {
    console.log('[Analytics] Editor path -> preview');
    return 'preview';
  }

  // その他（ホーム等）はプレビュー扱い
  console.log('[Analytics] Other path -> preview');
  return 'preview';
};

// ログフォーマット用ヘルパー
export const formatLogMessage = (eventType: AnalyticsEventType, metadata: Record<string, any>): { title: string, details: string, emoji: string } => {
  // メタデータがネストしている場合があるため、フラットに検索するヘルパー
  const getMeta = (key: string): any => {
    return metadata[key] ?? metadata.metadata?.[key] ?? undefined;
  };

  const getItemName = () => getMeta('item_name') || getMeta('node_name') || getMeta('page_name') || getMeta('label') || getMeta('pageId') || '要素';
  const getThinkingPattern = () => getMeta('thinking_pattern');
  const getDurationMs = () => getMeta('duration_ms');
  const getCorrectionCount = () => getMeta('input_correction_count');
  const getFinalLength = () => getMeta('final_length');
  const getPasteCount = () => getMeta('paste_count');
  const getTargetNodeId = () => getMeta('target_node_id');
  const getTextLength = () => getMeta('text_length');
  const getHistoryLength = () => getMeta('history_length');
  const getFromPageId = () => getMeta('from_page_id');
  const getToPageId = () => getMeta('to_page_id');
  const getDelta = () => getMeta('delta');
  const getNewScore = () => getMeta('newScore');
  const getReason = () => getMeta('reason');
  const getLogicNodeId = () => getMeta('logicNodeId');
  const getLastInteractedNodeName = () => getMeta('last_interacted_node_name');
  const getTimestamp = () => getMeta('timestamp');
  const getSessionIdVal = () => getMeta('session_id');
  const getDuration = () => getMeta('duration');
  const getEventName = () => getMeta('event_name');

  const itemName = getItemName();
  const nodeType = getMeta('nodeType') || metadata.nodeType;

  switch (eventType) {
    case 'page_view':
      return {
        emoji: '👀',
        title: `[ページ閲覧] ${getMeta('pageName') || getMeta('pageId') || 'ページ'} を開きました`,
        details: `Page ID: ${getMeta('pageId') || 'unknown'}`
      };
    case 'node_execution':
      // ノードタイプに応じたメッセージの出し分け
      let nodeAction = 'が実行されました';
      let nodeEmoji = '⚡';

      if (nodeType === 'pageNode') {
        nodeAction = 'により次ページへ遷移します';
        nodeEmoji = '📄';
      } else if (nodeType === 'actionNode') {
        nodeAction = 'のアクションを実行しました';
        nodeEmoji = '🎬';
      } else if (nodeType === 'delayNode') {
        nodeAction = `により待機を開始します`;
        nodeEmoji = '⌛';
      } else if (nodeType === 'externalApiNode' || nodeType === 'submitFormNode') {
        nodeAction = 'によりデータを送信します';
        nodeEmoji = '🌐';
      } else if (nodeType === 'animateNode') {
        nodeAction = 'のアニメーションを開始しました';
        nodeEmoji = '✨';
      }

      return {
        emoji: nodeEmoji,
        title: `[処理実行] 「${itemName}」${nodeAction}`,
        details: `Node: ${getMeta('nodeId') || getMeta('node_id') || 'unknown'}`
      };
    case 'lead_submit':
      return {
        emoji: '✅',
        title: `[コンバージョン] リード情報が送信されました`,
        details: `Session: ${getSessionIdVal() || 'unknown'}`
      };
    case 'session_start':
      return {
        emoji: '🚀',
        title: `[セッション開始] アプリケーションが起動されました`,
        details: `Referrer: ${getMeta('referrer') || 'direct'}`
      };
    case 'logic_branch':
      const result = getMeta('result') || '不明';
      let branchMsg = `の判定結果: ${result}`;

      if (nodeType === 'ifNode') {
        const boolResult = result === 'true' ? '成立' : '不成立';
        branchMsg = `の条件判定: ${boolResult} (${result})`;
      } else if (nodeType === 'abTestNode') {
        branchMsg = `のABテスト結果: ${result}`;
      }

      return {
        emoji: '🔀',
        title: `[条件分岐] 「${itemName}」${branchMsg}`,
        details: `Logic Node: ${getLogicNodeId() || 'unknown'}`
      };
    case 'error':
      return {
        emoji: '❌',
        title: `[システムエラー] ${getMeta('message') || '予期せぬエラーが発生しました'}`,
        details: `Node: ${getMeta('nodeId') || 'unknown'}`
      };
    case 'interaction':
      const patternMap: Record<string, string> = {
        intuitive: '直感的操作',
        normal: '通常',
        hesitation: '迷い・熟考',
        noise: 'ノイズ(誤操作?)'
      };
      const thinkingPattern = getThinkingPattern();
      const pattern = patternMap[thinkingPattern as string] || thinkingPattern || '不明';
      const durationMs = getDurationMs();
      const duration = durationMs ? `${(durationMs / 1000).toFixed(1)}秒` : '不明';
      return {
        emoji: '👆',
        title: `[操作] 「${itemName}」を操作 (思考時間: ${duration} - ${pattern})`,
        details: `Event: ${getEventName()}, Duration: ${durationMs}ms`
      };
    case 'input_correction':
      const durMs = getDurationMs();
      const durationSec = durMs ? (durMs / 1000).toFixed(1) : '?';
      return {
        emoji: '✏️',
        title: `[入力修正] 「${itemName}」の入力を完了 (修正: ${getCorrectionCount()}回, 滞在: ${durationSec}秒)`,
        details: `Length: ${getFinalLength()}, Paste: ${getPasteCount()}`
      };
    case 'input_abandonment':
      return {
        emoji: '⚠️',
        title: `[入力放棄] 「${itemName}」を入力せずに移動しました`,
        details: '2秒未満の滞在、または未入力でのフォーカスアウト'
      };
    case 'idle_hesitation':
      return {
        emoji: '🤔',
        title: `[熟考中] ${getDuration()}秒間操作が止まっています (迷い検知)`,
        details: `Session ID: ${getSessionIdVal()}`
      };
    case 'rage_click':
      return {
        emoji: '⚡',
        title: `[連打検知] 「${itemName}」が激しく連打されています (イライラ指標)`,
        details: `${getTargetNodeId()}`
      };
    case 'input_paste':
      return {
        emoji: '📋',
        title: `[ペースト] 「${itemName}」にテキストを貼り付けました (${getTextLength()}文字)`,
        details: ''
      };
    case 'backtracking':
      return {
        emoji: '🔙',
        title: `[戻る] 前のページに戻りました (履歴数: ${getHistoryLength()})`,
        details: `${getFromPageId()} -> ${getToPageId()}`
      };
    case 'score_change':
      const delta = getDelta();
      const sign = (delta > 0) ? '+' : '';
      return {
        emoji: '📈',
        title: `[スコア変動] ${getReason() || 'Logic'} により ${sign}${delta}点 (合計: ${getNewScore()}点)`,
        details: `Logic Node: ${getLogicNodeId()}`
      };
    case 'exit_context':
      return {
        emoji: '🚪',
        title: `[離脱] ページを離れました (Last: ${getLastInteractedNodeName() || 'None'})`,
        details: `Timestamp: ${getTimestamp()}`
      };
    default:
      return {
        emoji: 'ℹ️',
        title: `[Analytics] ${eventType}`,
        details: JSON.stringify(metadata)
      };
  }
};

export const logAnalyticsEvent = async (
  eventType: AnalyticsEventType,
  metadata: Record<string, any> = {},
  projectId?: string
) => {
  const sessionId = getSessionId();
  const pid = projectId || '';
  const env = detectEnvironment();
  const finalMetadata = { ...metadata, environment: env };

  // ログフォーマット生成
  const { emoji, title, details } = formatLogMessage(eventType, finalMetadata);

  // DB保存用のメタデータに表示用情報を追加 (メッセージ保存方式)
  const dbMetadata = {
    ...finalMetadata,
    display_emoji: emoji,
    display_title: title
  };

  // コンソール出力の改善 (グループ化で見やすく)
  // Preview/Devモード、またはProductionでログ確認したい場合に見やすい形式で出力
  const style = `font-weight: bold; font-size: 1.1em; ${env === 'production' ? 'color: #10b981;' : 'color: #3b82f6;'}`;
  console.groupCollapsed(`%c${emoji} ${title}`, style);
  console.log(`%cEnvironment: ${env}`, 'color: gray; font-size: 0.9em;');
  if (details) console.log(`%cDetails: ${details}`, 'color: #555;');
  console.log('Metadata:', dbMetadata);
  console.groupEnd();

  if (!pid) return;

  // PreviewやDevelopment環境ではDBへの保存を行わない
  if (env !== 'production') {
    console.log(`%c🚧 [Preview Mode] DB保存はスキップされました`, 'color: #f59e0b; font-style: italic;');
    return;
  }

  try {
    const { error } = await supabase
      .from('analytics_logs')
      .insert({
        project_id: pid,
        session_id: sessionId,
        event_type: eventType,
        node_id: metadata.nodeId || null,
        metadata: dbMetadata,
      });

    if (error) {
      console.error('Failed to log analytics event - Details:', JSON.stringify(error, null, 2));
    } else {
      console.log(`%c🚀 [Success] DBに保存されました`, 'color: #10b981; font-weight: bold;');
    }
  } catch (err) {
    console.error('Analytics logging error:', err);
  }
};