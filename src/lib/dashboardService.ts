// src/lib/dashboardService.ts

import { supabase } from './supabaseClient';

export interface LeadData {
  id: string;
  session_id: string;
  data: Record<string, any>; // 回答データ
  ip_address: string | null;
  device_type: string | null;
  created_at: string;
  referrer: string | null;
}

export interface AnalyticsStats {
  totalViews: number;
  totalLeads: number;
  conversionRate: number;
  deviceBreakdown: { desktop: number; mobile: number; tablet: number };
}

export interface DailyStats {
  date: string;
  pv: number;
  uu: number;
  cv: number;
  cvr: number;
}

export interface NodeStats {
  node_id: string;
  interaction_count: number;
  unique_users: number;
}

export interface ABTestStats {
  variant: string;
  conversion_rate: number;
}

/**
 * ノードデータから「人間が分かる名前」を抽出するヘルパー関数
 * 優先順位: Admin Label > Question/Label/Text > Button Text > Type+ID
 */
export const getNodeLabel = (node: any): string => {
  if (!node || !node.data) return "削除されたアイテム";

  const data = node.data;

  // 1. 管理用ラベル（もし実装していれば最優先）
  if (data.adminLabel) return data.adminLabel;

  // 2. 設問のテキスト/ラベル
  if (data.label) return data.label; // Input系のラベル
  if (data.question) return data.question; // Survey系の質問文
  if (data.text) return truncateText(data.text, 20); // テキストノード

  // 3. ボタンの文字
  if (data.buttonText) return `ボタン: ${data.buttonText}`;

  // 4. それでもなければタイプ名 + ID
  const typeLabel = node.type || 'Unknown';
  const idSuffix = node.id ? `...${node.id.slice(-4)}` : '';
  return `${typeLabel} (${idSuffix})`;
};

// 文字数制限用
const truncateText = (text: string, limit: number) => {
  if (!text) return "";
  return text.length > limit ? text.substring(0, limit) + "..." : text;
};

/**
 * プロジェクトの統計情報とリード一覧を取得
 */
export const fetchProjectStats = async (projectId: string) => {
  // ローカルプロジェクトまたはIDなしの場合は、APIコールをスキップして空データを返す
  if (!projectId || projectId.startsWith('local-')) {
    console.log('[Dashboard/Dev] Skipping stats fetch for local project:', projectId);
    return {
      stats: {
        totalViews: 0,
        totalLeads: 0,
        conversionRate: 0,
        deviceBreakdown: { desktop: 0, mobile: 0, tablet: 0 },
      },
      leads: [],
      dailyStats: [],
      nodeStats: [],
      abStats: [],
    };
  }

  // 1. PV数の取得 (analytics_logs)
  const { count: pvCount, error: pvError } = await supabase
    .from('analytics_logs')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .eq('event_type', 'page_view');

  // Debug log
  console.log('[Dashboard] PV Stats raw:', { pvCount, pvError });

  if (pvError) console.error('Error fetching PV:', pvError);

  // 2. リードデータの取得 (leads)
  const { data: leads, error: leadsError } = await supabase
    .from('leads')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (leadsError) console.error('Error fetching leads:', leadsError);

  // 3. 日次統計の取得 (analytics_daily_stats view)
  const { data: dailyStats, error: dailyError } = await supabase
    .from('analytics_daily_stats')
    .select('*')
    .eq('project_id', projectId)
    .order('date', { ascending: true });

  console.log('[Dashboard] Daily Stats raw:', { dailyStats, dailyError });

  if (dailyError) console.error('Error fetching daily stats:', dailyError);

  // 4. ノード別統計の取得 (analytics_node_stats view)
  const { data: nodeStats, error: nodeError } = await supabase
    .from('analytics_node_stats')
    .select('*')
    .eq('project_id', projectId);

  if (nodeError) console.error('Error fetching node stats:', nodeError);

  // 5. A/Bテスト結果の取得 (analytics_ab_test_stats view)
  const { data: abStats, error: abError } = await supabase
    .from('analytics_ab_test_stats')
    .select('*')
    .eq('project_id', projectId);

  if (abError) console.error('Error fetching AB stats:', abError);


  const safeLeads = (leads as LeadData[]) || [];
  const totalViews = pvCount || 0;
  const totalLeads = safeLeads.length;

  // デバイス別集計
  const devices = { desktop: 0, mobile: 0, tablet: 0 };
  safeLeads.forEach(l => {
    const type = (l.device_type || 'desktop') as keyof typeof devices;
    if (devices[type] !== undefined) devices[type]++;
  });

  return {
    stats: {
      totalViews,
      totalLeads,
      conversionRate: totalViews > 0 ? (totalLeads / totalViews) * 100 : 0,
      deviceBreakdown: devices,
    },
    leads: safeLeads,
    dailyStats: (dailyStats as DailyStats[]) || [],
    nodeStats: (nodeStats as NodeStats[]) || [],
    abStats: (abStats as ABTestStats[]) || [],
  };
};

// --- Phase 4: Extended Analytics ---

export interface ThinkingTimeStat {
  pattern: 'intuitive' | 'normal' | 'hesitation' | 'noise';
  count: number;
  percentage: number;
}

export interface InputAnalyticsStat {
  nodeId: string;
  nodeName: string; // metadata.item_name
  avgExploration: number;
  avgReversal: number;
  avgConfidence: number;
  avgHesitation: number;
  sampleCount: number;
  avgDuration: number; // 平均検討時間(秒)
}

export interface BacktrackStat {
  fromPage: string;
  toPage: string;
  count: number;
}

export interface ExtendedStats {
  thinkingTime: ThinkingTimeStat[];
  inputAnalytics: InputAnalyticsStat[];
  backtracks: BacktrackStat[];
  engagementDistribution: { range: string; count: number }[];
}

export interface StatFilters {
  dateRange?: { start: Date; end: Date };
}

/**
 * 詳細分析データの取得（心理分析・フロー）
 * 現時点ではRawログを取得してクライアント集計する
 */
export const fetchExtendedStats = async (projectId: string, filters?: StatFilters): Promise<ExtendedStats> => {
  if (!projectId || projectId.startsWith('local-')) {
    return { thinkingTime: [], inputAnalytics: [], backtracks: [], engagementDistribution: [] };
  }

  // クエリビルダヘルパー
  const applyFilters = (query: any) => {
    if (filters?.dateRange) {
      query = query.gte('created_at', filters.dateRange.start.toISOString())
        .lte('created_at', filters.dateRange.end.toISOString());
    }
    return query;
  };

  // 1. 入力心理データの取得 (inputLogs)
  let inputQuery = supabase
    .from('analytics_logs')
    .select('node_id, metadata, created_at, device_info')
    .eq('project_id', projectId)
    .eq('event_type', 'input_analysis');

  inputQuery = applyFilters(inputQuery);
  const { data: inputLogs } = await inputQuery;

  // テキスト入力のnodeIdセットを作成
  const inputNodeIds = new Set<string>();
  (inputLogs || []).forEach((log: any) => {
    if (log.node_id) inputNodeIds.add(log.node_id);
  });

  // 2. 思考時間データの取得 (interactionLogs)
  let interactionQuery = supabase
    .from('analytics_logs')
    .select('node_id, metadata, created_at, device_info')
    .eq('project_id', projectId)
    .eq('event_type', 'interaction');

  interactionQuery = applyFilters(interactionQuery);
  const { data: interactionLogs } = await interactionQuery;

  const thinkingTimeCounts: Record<string, number> = { intuitive: 0, normal: 0, hesitation: 0, noise: 0 };

  // マップ definition
  const inputMap = new Map<string, {
    name: string;
    exp: number; rev: number; conf: number; hes: number;
    count: number;
    totalDuration: number; // ms
  }>();

  // interactionログの処理
  (interactionLogs || []).forEach((log: any) => {

    // 思考時間集計
    const pattern = log.metadata?.thinking_pattern || 'normal';
    if (thinkingTimeCounts[pattern] !== undefined) {
      thinkingTimeCounts[pattern]++;
    }

    // ノイズは除外
    if (pattern === 'noise') return;

    const nodeId = log.node_id;
    // input_analysisが存在するノード（テキスト入力）は詳細分析側を優先するためスキップ
    if (!nodeId || inputNodeIds.has(nodeId)) return;

    const current = inputMap.get(nodeId) || {
      name: log.metadata?.node_name || nodeId,
      exp: 0, rev: 0, conf: 0, hes: 0, count: 0,
      totalDuration: 0
    };

    // 簡易的な迷いスコアの割り当て
    let score = 50;
    if (pattern === 'intuitive') score = 10;
    else if (pattern === 'normal') score = 40;
    else if (pattern === 'hesitation') score = 90;

    current.hes += score;
    current.count++;
    current.totalDuration += (log.metadata?.duration_ms || 0);

    inputMap.set(nodeId, current);
  });

  const totalInteractions = Object.values(thinkingTimeCounts).reduce((a, b) => a + b, 0);
  const thinkingTimeStats: ThinkingTimeStat[] = Object.entries(thinkingTimeCounts).map(([pattern, count]) => ({
    pattern: pattern as any,
    count,
    percentage: totalInteractions > 0 ? (count / totalInteractions) * 100 : 0
  }));

  // input_analysisログの処理
  (inputLogs || []).forEach((log: any) => {

    const nodeId = log.node_id;
    const meta = log.metadata;
    const metrics = meta?.metrics;

    if (!metrics) return;

    const current = inputMap.get(nodeId) || {
      name: meta.item_name || nodeId,
      exp: 0, rev: 0, conf: 0, hes: 0, count: 0,
      totalDuration: 0
    };

    current.exp += (metrics.exploration || 0);
    current.rev += (metrics.reversal || 0);
    current.conf += (metrics.confidence || 0);
    current.hes += (metrics.hesitation_score || 0);
    current.count++;
    current.totalDuration += (meta.raw?.input_duration_ms || 0);

    inputMap.set(nodeId, current);
  });

  const inputStats: InputAnalyticsStat[] = Array.from(inputMap.entries()).map(([nodeId, val]) => ({
    nodeId,
    nodeName: val.name,
    avgExploration: val.exp / val.count,
    avgReversal: val.rev / val.count,
    avgConfidence: val.conf / val.count,
    avgHesitation: val.hes / val.count,
    sampleCount: val.count,
    avgDuration: (val.totalDuration / val.count) / 1000 // ms -> sec
  })).sort((a, b) => b.avgHesitation - a.avgHesitation);

  // 3. バックトラッキングの取得
  let backtrackQuery = supabase
    .from('analytics_logs')
    .select('metadata, created_at')
    .eq('project_id', projectId)
    .eq('event_type', 'backtracking');

  backtrackQuery = applyFilters(backtrackQuery);
  const { data: backtrackLogs } = await backtrackQuery;

  const backtrackMap = new Map<string, number>();
  (backtrackLogs || []).forEach((log: any) => {
    const from = log.metadata?.from_page_name || 'Unknown';
    const to = log.metadata?.to_page_name || 'Unknown';
    const key = `${from} → ${to}`;
    backtrackMap.set(key, (backtrackMap.get(key) || 0) + 1);
  });

  const backtrackStats: BacktrackStat[] = Array.from(backtrackMap.entries())
    .map(([key, count]) => {
      const [fromPage, toPage] = key.split(' → ');
      return { fromPage, toPage, count };
    })
    .sort((a, b) => b.count - a.count);

  // 4. エンゲージメントスコア分布 (leadsテーブルから最新スコアを取得)
  // Leads table has 'created_at', 'device_type'.
  let leadsQuery = supabase
    .from('leads')
    .select('engagement_score, created_at, device_type')
    .eq('project_id', projectId);

  if (filters?.dateRange) {
    leadsQuery = leadsQuery.gte('created_at', filters.dateRange.start.toISOString())
      .lte('created_at', filters.dateRange.end.toISOString());
  }

  const { data: leads } = await leadsQuery;

  const scoreRanges = {
    '0-20 (Cold)': 0,
    '21-50 (Warm)': 0,
    '51-80 (Hot)': 0,
    '81+ (Super Hot)': 0
  };

  (leads || []).forEach((l: any) => {
    const score = l.engagement_score || 0;
    if (score <= 20) scoreRanges['0-20 (Cold)']++;
    else if (score <= 50) scoreRanges['21-50 (Warm)']++;
    else if (score <= 80) scoreRanges['51-80 (Hot)']++;
    else scoreRanges['81+ (Super Hot)']++;
  });

  const engagementDistribution = Object.entries(scoreRanges).map(([range, count]) => ({
    range, count
  }));

  return {
    thinkingTime: thinkingTimeStats,
    inputAnalytics: inputStats,
    backtracks: backtrackStats,
    engagementDistribution
  };
};

/**
 * リードデータをCSV形式に変換してダウンロード
 */
export interface ExportOptions {
  fileName?: string;
  columns?: string[]; // 出力するカラム（変数のキー）の指定。未指定の場合は全カラム
}

/**
 * リードデータをCSV形式に変換してダウンロード
 */
export const downloadLeadsAsCSV = (leads: LeadData[], options: ExportOptions = {}) => {
  if (leads.length === 0) {
    alert("データがありません");
    return;
  }

  const { fileName = 'leads_data.csv', columns } = options;

  // 1. ヘッダーの決定
  // columns指定があればそれを使用、なければデータから全キーを抽出
  let dataKeys: string[] = [];

  if (columns && columns.length > 0) {
    dataKeys = columns;
  } else {
    const keysSet = new Set<string>();
    leads.forEach(lead => {
      Object.keys(lead.data).forEach(k => keysSet.add(k));
    });
    dataKeys = Array.from(keysSet).sort();
  }

  const headers = ['ID', 'Date', 'IP Address', 'Device', 'Referrer', ...dataKeys];

  // 2. CSV行の作成
  const rows = leads.map(lead => {
    // 日付フォーマット: YYYY-MM-DD HH:mm:ss (Excelでソートしやすい形式)
    const d = new Date(lead.created_at);
    // 日本時間(JST)などローカルを意識しつつ、フォーマットを固定
    const dateStr = d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0') + ' ' +
      String(d.getHours()).padStart(2, '0') + ':' +
      String(d.getMinutes()).padStart(2, '0') + ':' +
      String(d.getSeconds()).padStart(2, '0');

    const baseInfo = [
      lead.id,
      dateStr,
      lead.ip_address || '',
      lead.device_type || '',
      `"${(lead.referrer || '').replace(/"/g, '""')}"`
    ];

    const answers = dataKeys.map(key => {
      const val = lead.data[key];
      // 値にカンマや改行が含まれる場合はエスケープ
      if (typeof val === 'string') {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val ?? '';
    });

    return [...baseInfo, ...answers].join(',');
  });

  // 3. CSV文字列の結合 (BOM付きでExcel文字化け防止)
  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');

  // 4. ダウンロード処理
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};