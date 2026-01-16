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
  score?: number;
  maturity_rank?: string;
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

  // 2. リードの取得 (Hot Leads順: スコア降順 > 作成日降順)
  const { data: leads, error: leadsError } = await supabase
    .from('leads')
    .select('*')
    .eq('project_id', projectId)
    .order('score', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(100); // パフォーマンスのため直近100件に制限 (必要に応じてページネーション)

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

export interface StatFilters {
  dateRange?: { start: Date; end: Date };
}

// --- Advanced Stats Interfaces ---

export interface DeviceStatItem {
  name: string;
  sessions: number;
  conversions: number;
  cvr: number;
}

export interface ScoreFlowStat {
  nodeId: string;
  nodeName: string;
  avgScoreDelta: number;
  cumulativeScore: number;
  count: number;
}

export interface PageDwellTimeStat {
  pageId: string;
  pageName: string;
  avgTimeSec: number;
  sampleCount: number;
}

export interface AdvancedStats {
  deviceStats: {
    os: DeviceStatItem[];
    browser: DeviceStatItem[];
  };
  scoreFlow: ScoreFlowStat[];
  pageDwellTime: PageDwellTimeStat[];
}

export interface ExtendedStats {
  thinkingTime: ThinkingTimeStat[];
  inputAnalytics: InputAnalyticsStat[];
  backtracks: BacktrackStat[];
  engagementDistribution: { range: string; count: number }[];
  advanced: AdvancedStats; // Added
}

// --- Helpers ---

const normalizeOS = (os: string | undefined): string => {
  if (!os) return 'Unknown';
  if (os.match(/iOS|iPhone|iPad|iPod/i)) return 'Mobile iOS';
  if (os.match(/Android/i)) return 'Android';
  if (os.match(/Mac/i)) return 'Mac OS';
  if (os.match(/Windows/i)) return 'Windows';
  return os;
};

const normalizeBrowser = (browser: string | undefined): string => {
  if (!browser) return 'Unknown';
  if (browser.match(/Chrome|CriOS/i)) return 'Chrome';
  if (browser.match(/Safari/i) && !browser.match(/Chrome|CriOS/i)) return 'Safari';
  if (browser.match(/Firefox|FxiOS/i)) return 'Firefox';
  if (browser.match(/Edge/i)) return 'Edge';
  return browser;
};

/**
 * 詳細分析データの取得（心理分析・フロー）
 * 現時点ではRawログを取得してクライアント集計する
 */
export const fetchExtendedStats = async (projectId: string, filters?: StatFilters): Promise<ExtendedStats> => {
  console.log('[Dashboard-Extended] fetchExtendedStats called with projectId:', projectId, 'filters:', filters);

  if (!projectId || projectId.startsWith('local-')) {
    console.warn('[Dashboard-Extended] Skipping stats fetch for local/empty projectId:', projectId);
    return {
      thinkingTime: [],
      inputAnalytics: [],
      backtracks: [],
      engagementDistribution: [],
      advanced: {
        deviceStats: { os: [], browser: [] },
        scoreFlow: [],
        pageDwellTime: []
      }
    };
  }

  // クエリビルダヘルパー
  const applyFilters = (query: any) => {
    if (filters?.dateRange) {
      console.log('[Dashboard-Extended] Applying Filter:', { start: filters.dateRange.start.toISOString(), end: filters.dateRange.end.toISOString() });
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
  const { data: inputLogs, error: inputError } = await inputQuery;
  console.log('[Dashboard-Extended] Input Logs:', { count: inputLogs?.length, sample: inputLogs?.[0], error: inputError });

  // テキスト入力のnodeIdセットを作成
  const inputNodeIds = new Set<string>();
  (inputLogs || []).forEach((log: any) => {
    if (log.node_id) inputNodeIds.add(log.node_id);
  });

  // 2. 思考時間データの取得 (interactionLogs)
  let interactionQuery = supabase
    .from('analytics_logs')
    .select('node_id, metadata, created_at, device_info, session_id, event_type')
    .eq('project_id', projectId)
    .eq('event_type', 'interaction');

  interactionQuery = applyFilters(interactionQuery);
  const { data: interactionLogs, error: interactionError } = await interactionQuery;
  console.log('[Dashboard-Extended] Interaction Logs:', { count: interactionLogs?.length, sample: interactionLogs?.[0], error: interactionError });

  // ...



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
  console.log('[Dashboard-Extended] Backtrack Logs:', { count: backtrackLogs?.length });

  // --- Advanced Analytics Fetching ---

  // 4. デバイス分析用（Page View + Leads）
  // セッションベースでCVRを出すため、page_viewログとleadsを取得して突き合わせる
  let pvQuery = supabase
    .from('analytics_logs')
    .select('session_id, device_info, created_at')
    .eq('project_id', projectId)
    .eq('event_type', 'page_view');
  pvQuery = applyFilters(pvQuery);
  const { data: pvLogs } = await pvQuery;

  // Leads for CV matching (reuse logic below for query construction if needed, but fetch minimal fields)
  let advLeadsQuery = supabase
    .from('leads')
    .select('session_id, created_at')
    .eq('project_id', projectId);
  if (filters?.dateRange) {
    advLeadsQuery = advLeadsQuery.gte('created_at', filters.dateRange.start.toISOString())
      .lte('created_at', filters.dateRange.end.toISOString());
  }
  const { data: advLeads } = await advLeadsQuery;
  const cvSessionIds = new Set((advLeads || []).map((l: any) => l.session_id));

  // 5. スコア変動分析用
  let scoreQuery = supabase
    .from('analytics_logs')
    .select('node_id, metadata, created_at, session_id, event_type')
    .eq('project_id', projectId)
    .eq('event_type', 'score_change');
  scoreQuery = applyFilters(scoreQuery);
  const { data: scoreLogs } = await scoreQuery;
  console.log('[Dashboard-Extended] Score Logs:', { count: scoreLogs?.length });

  // 6. 滞在時間分析用 (Page Execution + Interactions to determine dwell time)
  // ページ表示(node_execution:page)のログを取得。
  // 終了時刻を知るために、同セッションの「次のイベント」を探す必要があるため、全イベント簡易ログが必要だが、
  // 量が多いので、ここでは `interaction` と `node_execution` を merge して近似計算する。
  let pageExecQuery = supabase
    .from('analytics_logs')
    .select('session_id, node_id, metadata, created_at, event_type')
    .eq('project_id', projectId)
    .eq('event_type', 'node_execution'); // type=page is in metadata
  pageExecQuery = applyFilters(pageExecQuery);
  const { data: pageLogs } = await pageExecQuery;
  console.log('[Dashboard-Extended] Page Execution Logs:', { count: pageLogs?.length, sample: pageLogs?.[0] });
  console.log('[Dashboard-Extended] PV Logs (for Dwell Time):', { count: pvLogs?.length, sample: pvLogs?.[0] });

  // --- Advanced Aggregation Logic ---

  // A. Device Stats Aggregation
  const osStats: Record<string, { sessions: number; conversions: number }> = {};
  const browserStats: Record<string, { sessions: number; conversions: number }> = {};
  const processedSessions = new Set<string>();

  (pvLogs || []).forEach((log: any) => {
    if (processedSessions.has(log.session_id)) return; // 1セッション1回カウント
    processedSessions.add(log.session_id);

    const info = log.device_info || {};
    const osName = normalizeOS(info.os_name);
    const browserName = normalizeBrowser(info.browser_name);

    if (!osStats[osName]) osStats[osName] = { sessions: 0, conversions: 0 };
    osStats[osName].sessions++;

    if (!browserStats[browserName]) browserStats[browserName] = { sessions: 0, conversions: 0 };
    browserStats[browserName].sessions++;

    if (cvSessionIds.has(log.session_id)) {
      osStats[osName].conversions++;
      browserStats[browserName].conversions++;
    }
  });

  const totalSessions = processedSessions.size || 1;

  const advancedDeviceStats = {
    os: Object.entries(osStats).map(([name, val]) => ({
      name,
      sessions: val.sessions,
      sessionPercentage: (val.sessions / totalSessions) * 100, // Added percentage
      conversions: val.conversions,
      cvr: val.sessions > 0 ? (val.conversions / val.sessions) * 100 : 0
    })).sort((a, b) => b.sessions - a.sessions),
    browser: Object.entries(browserStats).map(([name, val]) => ({
      name,
      sessions: val.sessions,
      sessionPercentage: (val.sessions / totalSessions) * 100, // Added percentage
      conversions: val.conversions,
      cvr: val.sessions > 0 ? (val.conversions / val.sessions) * 100 : 0
    })).sort((a, b) => b.sessions - a.sessions)
  };

  // B. Score Flow Aggregation (Waterfall)
  const nodeScoreMap = new Map<string, { totalDelta: number; count: number; name: string }>();
  (scoreLogs || []).forEach((log: any) => {
    const nodeId = log.node_id;
    const delta = log.metadata?.delta || 0;
    const name = log.metadata?.node_name || nodeId;

    const current = nodeScoreMap.get(nodeId) || { totalDelta: 0, count: 0, name };
    current.totalDelta += delta;
    current.count++;
    nodeScoreMap.set(nodeId, current);
  });

  let currentCumulative = 0;
  const advancedScoreFlow = Array.from(nodeScoreMap.entries()).map(([nodeId, val]) => {
    const avgDelta = val.totalDelta / val.count;
    currentCumulative += avgDelta;
    return {
      nodeId,
      nodeName: val.name,
      avgScoreDelta: avgDelta,
      cumulativeScore: currentCumulative,
      count: val.count
    };
  }).sort((a, b) => b.count - a.count);

  // C. Page Dwell Time Aggregation (Improved)
  const sessionEventsMap = new Map<string, any[]>();
  const allActivityLogs = [
    ...(pageLogs || []),
    ...(interactionLogs || []),
    ...(scoreLogs || []),
    ...(pvLogs || []),
    ...(inputLogs || []) // ★追加: 入力イベントも含める
  ];

  allActivityLogs.forEach((log: any) => {
    if (!log.session_id) return;
    if (!sessionEventsMap.has(log.session_id)) sessionEventsMap.set(log.session_id, []);
    sessionEventsMap.get(log.session_id)?.push({
      ...log,
      timestamp: new Date(log.created_at).getTime()
    });
  });

  const pageDwellMap = new Map<string, { totalTime: number; count: number; name: string }>();

  sessionEventsMap.forEach((events) => {
    // Sort by time
    events.sort((a, b) => a.timestamp - b.timestamp);

    let currentPageStart = 0;
    let currentPageId = "";
    let currentPageName = "";

    events.forEach((ev, index) => {
      // ページ開始の判定条件を緩和（複数のパターンに対応）
      const isPageStart = (
        // パターン1: page_viewイベント（LP）
        ev.event_type === 'page_view' ||
        // パターン2: node_executionでmetadata.nodeTypeがpageNode
        (ev.event_type === 'node_execution' && ev.metadata?.nodeType === 'pageNode') ||
        // パターン3: node_executionでmetadata.typeがpage
        (ev.event_type === 'node_execution' && ev.metadata?.type === 'page') ||
        // パターン4: node_executionでpage_nameが存在（明らかにページ遷移）
        (ev.event_type === 'node_execution' && ev.metadata?.page_name)
      );

      const nextEv = events[index + 1];

      if (isPageStart) {
        // If we were already on a page, calculate its duration using this new page start as the end
        if (currentPageId && currentPageStart > 0) {
          const timeData = pageDwellMap.get(currentPageId) || { totalTime: 0, count: 0, name: currentPageName };
          const diff = ev.timestamp - currentPageStart;
          // Cap at 30 mins
          if (diff > 0 && diff < 30 * 60 * 1000) {
            timeData.totalTime += diff;
            timeData.count++;
            pageDwellMap.set(currentPageId, timeData);
          }
        }

        // Start tracking new page
        currentPageStart = ev.timestamp;
        currentPageId = ev.node_id || 'landing_page';
        currentPageName = ev.metadata?.page_name || 'ランディングページ (LP)';

        // If this is the last event in session, or next event is far away, allow using the last activity logic below?
        // Actually, if this is the last event, duration is roughly 0 unless we assume something.
        // We will rely on future events to close this page visit.
      }

      // If NOT a page start, providing we have a current page, we update the implicit "end" time
      // But simpler approach: Dwell time = Time(Next Page Start) - Time(Current Page Start)
      // OR Time(Last Interaction on Page) - Time(Current Page Start).

      // Look ahead: If next event is null (Session End), verify duration from CurrentPageStart to THIS event
      // Look ahead: If next event is null (Session End), verify duration from CurrentPageStart to THIS event
      if (!nextEv && currentPageId && currentPageStart > 0) {
        // End of session. Dwell is Time(Last Event) - PageStart
        const diff = ev.timestamp - currentPageStart;
        // Even if the last event IS the page view itself, diff is 0.
        // We need at least one interaction (click, scroll, etc) to measure time.
        // If ev is the same as start, diff=0, so it won't be added (which is correct, 0s dwell).
        if (diff > 0 && diff < 30 * 60 * 1000) {
          const timeData = pageDwellMap.get(currentPageId) || { totalTime: 0, count: 0, name: currentPageName };
          timeData.totalTime += diff;
          timeData.count++;
          pageDwellMap.set(currentPageId, timeData);
          console.log('[Dashboard-Extended] Last Page Dwell:', { page: currentPageName, time: diff });
        }
      }
    });
  });

  console.log('[Dashboard-Extended] Dwell Time Map Size:', pageDwellMap.size);
  console.log('[Dashboard-Extended] Dwell Time Map Entries:', Array.from(pageDwellMap.entries()));

  const advancedPageDwellTime = Array.from(pageDwellMap.entries()).map(([pageId, val]) => ({
    pageId,
    pageName: val.name,
    avgTimeSec: (val.totalTime / val.count) / 1000,
    sampleCount: val.count
  })).sort((a, b) => b.avgTimeSec - a.avgTimeSec);

  console.log('[Dashboard-Extended] Final Page Dwell Time Stats:', advancedPageDwellTime);

  const advancedStats: AdvancedStats = {
    deviceStats: advancedDeviceStats,
    scoreFlow: advancedScoreFlow,
    pageDwellTime: advancedPageDwellTime
  };

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
    engagementDistribution,
    advanced: advancedStats
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