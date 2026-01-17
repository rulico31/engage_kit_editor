import { supabase } from './supabaseClient';

export interface LeadData {
    id: string;
    project_id: string;
    session_id: string;
    data: Record<string, any>;
    ip_address: string | null;
    device_type: string | null;
    created_at: string;
    referrer: string | null;
    total_score?: number;
    maturity_rank?: string;
    behavior_flags?: {
        pasted?: boolean;
        long_idle?: boolean;
        rage?: boolean;
        mobile?: boolean;
        [key: string]: any;
    };
    device_category?: 'mobile' | 'tablet' | 'desktop';
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
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

export const getNodeLabel = (node: any): string => {
    if (!node || !node.data) return "削除されたアイテム";
    const data = node.data;
    if (data.adminLabel) return data.adminLabel;
    if (data.label) return data.label;
    if (data.question) return data.question;
    if (data.text) return truncateText(data.text, 20);
    if (data.buttonText) return `ボタン: ${data.buttonText}`;
    const typeLabel = node.type || 'Unknown';
    const idSuffix = node.id ? `...${node.id.slice(-4)}` : '';
    return `${typeLabel} (${idSuffix})`;
};

const truncateText = (text: string, limit: number) => {
    if (!text) return "";
    return text.length > limit ? text.substring(0, limit) + "..." : text;
};

export const fetchProjectStats = async (projectId: string) => {
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

    const { count: pvCount, error: pvError } = await supabase
        .from('analytics_logs')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId)
        .eq('event_type', 'page_view');

    if (pvError) console.error('Error fetching PV:', pvError);

    const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .eq('project_id', projectId)
        .order('total_score', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(100);

    if (leadsError) console.error('Error fetching leads:', leadsError);

    const { data: dailyStats, error: dailyError } = await supabase
        .from('analytics_daily_stats')
        .select('*')
        .eq('project_id', projectId)
        .order('date', { ascending: true });

    if (dailyError) console.error('Error fetching daily stats:', dailyError);

    const { data: nodeStats, error: nodeError } = await supabase
        .from('analytics_node_stats')
        .select('*')
        .eq('project_id', projectId);

    if (nodeError) console.error('Error fetching node stats:', nodeError);

    const { data: abStats, error: abError } = await supabase
        .from('analytics_ab_test_stats')
        .select('*')
        .eq('project_id', projectId);

    if (abError) console.error('Error fetching AB stats:', abError);

    const safeLeads = (leads as LeadData[]) || [];
    const totalViews = pvCount || 0;
    const totalLeads = safeLeads.length;

    const devices = { desktop: 0, mobile: 0, tablet: 0 };
    safeLeads.forEach(l => {
        let type = 'desktop';
        if (l.device_category === 'mobile') type = 'mobile';
        else if (l.device_category === 'tablet') type = 'tablet';
        else if (l.device_category === 'desktop') type = 'desktop';
        else {
            const lowerType = (l.device_type || '').toLowerCase();
            if (lowerType.includes('mobile')) type = 'mobile';
            else if (lowerType.includes('tablet')) type = 'tablet';
        }

        if (devices[type as keyof typeof devices] !== undefined) {
            devices[type as keyof typeof devices]++;
        } else {
            devices.desktop++;
        }
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

export interface ThinkingTimeStat {
    pattern: 'intuitive' | 'normal' | 'hesitation' | 'noise';
    count: number;
    percentage: number;
}

export interface InputAnalyticsStat {
    nodeId: string;
    nodeName: string;
    avgExploration: number;
    avgReversal: number;
    avgConfidence: number;
    avgHesitation: number;
    sampleCount: number;
    avgDuration: number;
}

export interface BacktrackStat {
    fromPage: string;
    toPage: string;
    count: number;
}

export interface StatFilters {
    dateRange?: { start: Date; end: Date };
}

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

export interface RageClickStat {
    targetNodeId: string | null;
    targetNodeType: string | null;
    nodeName: string;
    count: number;
}

export interface HesitationStat {
    rate: number;
    hesitationSessions: number;
    totalSessions: number;
}

export interface ExtendedStats {
    thinkingTime: ThinkingTimeStat[];
    inputAnalytics: InputAnalyticsStat[];
    backtracks: BacktrackStat[];
    engagementDistribution: { range: string; count: number }[];
    advanced: AdvancedStats;
    rageClicks: RageClickStat[];
    hesitationStats: HesitationStat;
}

export interface AdvancedStats {
    deviceStats: {
        os: DeviceStatItem[];
        browser: DeviceStatItem[];
    };
    scoreFlow: ScoreFlowStat[];
    pageDwellTime: PageDwellTimeStat[];
}

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

export const fetchExtendedStats = async (projectId: string, filters?: StatFilters): Promise<ExtendedStats> => {
    console.log('[Dashboard-Extended] fetchExtendedStats called with projectId:', projectId);

    if (!projectId || projectId.startsWith('local-')) {
        return {
            thinkingTime: [],
            inputAnalytics: [],
            backtracks: [],
            engagementDistribution: [],
            advanced: {
                deviceStats: { os: [], browser: [] },
                scoreFlow: [],
                pageDwellTime: []
            },
            rageClicks: [],
            hesitationStats: { rate: 0, hesitationSessions: 0, totalSessions: 0 }
        };
    }

    const applyFilters = (query: any) => {
        if (filters?.dateRange) {
            query = query.gte('created_at', filters.dateRange.start.toISOString())
                .lte('created_at', filters.dateRange.end.toISOString());
        }
        return query;
    };

    // 1. Frustration Analytics (Rage Click & Hesitation)
    let frustrationQuery = supabase
        .from('analytics_logs')
        .select('event_type, metadata, session_id, created_at, node_id')
        .eq('project_id', projectId)
        .in('event_type', ['rage_click', 'idle_hesitation']);

    frustrationQuery = applyFilters(frustrationQuery);
    const { data: frustrationLogs, error: frustrationError } = await frustrationQuery;

    if (frustrationError) console.error('Error fetching frustration logs:', frustrationError);

    const rageMap = new Map<string, { count: number; type: string | null; name: string | null }>();
    const hesitationSessions = new Set<string>();

    (frustrationLogs || []).forEach((log: any) => {
        if (log.event_type === 'rage_click') {
            const targetId = log.metadata?.target_node_id || null;
            const key = targetId || 'empty_space';
            const current = rageMap.get(key) || {
                count: 0,
                type: log.metadata?.target_node_type || null,
                name: null
            };
            current.count++;
            if (!current.name && log.metadata?.item_name) current.name = log.metadata.item_name;
            rageMap.set(key, current);
        } else if (log.event_type === 'idle_hesitation') {
            if (log.session_id) hesitationSessions.add(log.session_id);
        }
    });

    const rageClicks: RageClickStat[] = Array.from(rageMap.entries()).map(([key, val]) => {
        const isEmpty = key === 'empty_space';
        let displayName = isEmpty ? '空白エリア (Empty Space)' : (val.name || `Node: ${key}`);
        if (!isEmpty && !val.name) {
            if (val.type) displayName = `${val.type} (${key.slice(-4)})`;
            else displayName = `削除された要素 (${key.slice(-4)})`;
        }
        return {
            targetNodeId: isEmpty ? null : key,
            targetNodeType: val.type,
            nodeName: displayName,
            count: val.count
        };
    }).sort((a, b) => b.count - a.count);

    // 2. 入力心理データの取得
    let inputQuery = supabase
        .from('analytics_logs')
        .select('node_id, metadata, created_at, device_info')
        .eq('project_id', projectId)
        .eq('event_type', 'input_analysis');

    inputQuery = applyFilters(inputQuery);
    const { data: inputLogs, error: inputError } = await inputQuery;

    if (inputError) console.error('Error fetching input logs:', inputError);

    const inputNodeIds = new Set<string>();
    (inputLogs || []).forEach((log: any) => {
        if (log.node_id) inputNodeIds.add(log.node_id);
    });

    // 3. 思考時間データの取得
    let interactionQuery = supabase
        .from('analytics_logs')
        .select('node_id, metadata, created_at, device_info, session_id, event_type')
        .eq('project_id', projectId)
        .eq('event_type', 'interaction');

    interactionQuery = applyFilters(interactionQuery);
    const { data: interactionLogs } = await interactionQuery;

    const thinkingTimeCounts: Record<string, number> = { intuitive: 0, normal: 0, hesitation: 0, noise: 0 };
    const inputMap = new Map<string, {
        name: string;
        exp: number; rev: number; conf: number; hes: number;
        count: number;
        totalDuration: number;
    }>();

    (interactionLogs || []).forEach((log: any) => {
        const pattern = log.metadata?.thinking_pattern || 'normal';
        if (thinkingTimeCounts[pattern] !== undefined) thinkingTimeCounts[pattern]++;
        if (pattern === 'noise') return;
        const nodeId = log.node_id;
        if (!nodeId || inputNodeIds.has(nodeId)) return;

        const current = inputMap.get(nodeId) || {
            name: log.metadata?.node_name || nodeId,
            exp: 0, rev: 0, conf: 0, hes: 0, count: 0,
            totalDuration: 0
        };
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
        avgDuration: (val.totalDuration / val.count) / 1000
    })).sort((a, b) => b.avgHesitation - a.avgHesitation);

    // 4. バックトラッキングの取得
    let backtrackQuery = supabase.from('analytics_logs').select('metadata, created_at').eq('project_id', projectId).eq('event_type', 'backtracking');
    backtrackQuery = applyFilters(backtrackQuery);
    const { data: backtrackLogs } = await backtrackQuery;
    const backtrackMap = new Map<string, number>();
    (backtrackLogs || []).forEach((log: any) => {
        const from = log.metadata?.from_page_name || 'Unknown';
        const to = log.metadata?.to_page_name || 'Unknown';
        const key = `${from} → ${to}`;
        backtrackMap.set(key, (backtrackMap.get(key) || 0) + 1);
    });
    const backtrackStats: BacktrackStat[] = Array.from(backtrackMap.entries()).map(([key, count]) => {
        const [fromPage, toPage] = key.split(' → ');
        return { fromPage, toPage, count };
    }).sort((a, b) => b.count - a.count);

    // 5. Advanced Stats (Device, Page Dwell, Score Flow)
    let pvQuery = supabase.from('analytics_logs').select('session_id, device_info, created_at').eq('project_id', projectId).eq('event_type', 'page_view');
    pvQuery = applyFilters(pvQuery);
    const { data: pvLogs } = await pvQuery;

    let advLeadsQuery = supabase.from('leads').select('session_id, created_at').eq('project_id', projectId);
    if (filters?.dateRange) {
        advLeadsQuery = advLeadsQuery.gte('created_at', filters.dateRange.start.toISOString()).lte('created_at', filters.dateRange.end.toISOString());
    }
    const { data: advLeads } = await advLeadsQuery;
    const cvSessionIds = new Set((advLeads || []).map((l: any) => l.session_id));

    let scoreQuery = supabase.from('analytics_logs').select('node_id, metadata, created_at, session_id, event_type').eq('project_id', projectId).eq('event_type', 'score_change');
    scoreQuery = applyFilters(scoreQuery);
    const { data: scoreLogs } = await scoreQuery;

    let pageExecQuery = supabase.from('analytics_logs').select('session_id, node_id, metadata, created_at, event_type').eq('project_id', projectId).eq('event_type', 'node_execution');
    pageExecQuery = applyFilters(pageExecQuery);
    const { data: pageLogs } = await pageExecQuery;

    // A. Device Stats
    const osStats: Record<string, { sessions: number; conversions: number }> = {};
    const browserStats: Record<string, { sessions: number; conversions: number }> = {};
    const processedSessions = new Set<string>();

    (pvLogs || []).forEach((log: any) => {
        if (processedSessions.has(log.session_id)) return;
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
            name, sessions: val.sessions, sessionPercentage: (val.sessions / totalSessions) * 100, conversions: val.conversions, cvr: val.sessions > 0 ? (val.conversions / val.sessions) * 100 : 0
        })).sort((a, b) => b.sessions - a.sessions),
        browser: Object.entries(browserStats).map(([name, val]) => ({
            name, sessions: val.sessions, sessionPercentage: (val.sessions / totalSessions) * 100, conversions: val.conversions, cvr: val.sessions > 0 ? (val.conversions / val.sessions) * 100 : 0
        })).sort((a, b) => b.sessions - a.sessions)
    };

    // B. Score Flow
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
        return { nodeId, nodeName: val.name, avgScoreDelta: avgDelta, cumulativeScore: currentCumulative, count: val.count };
    }).sort((a, b) => b.count - a.count);

    // C. Page Dwell Time
    const sessionEventsMap = new Map<string, any[]>();
    const allActivityLogs = [...(pageLogs || []), ...(interactionLogs || []), ...(scoreLogs || []), ...(pvLogs || []), ...(inputLogs || [])];
    allActivityLogs.forEach((log: any) => {
        if (!log.session_id) return;
        if (!sessionEventsMap.has(log.session_id)) sessionEventsMap.set(log.session_id, []);
        sessionEventsMap.get(log.session_id)?.push({ ...log, timestamp: new Date(log.created_at).getTime() });
    });

    const pageDwellMap = new Map<string, { totalTime: number; count: number; name: string }>();
    sessionEventsMap.forEach((events) => {
        events.sort((a, b) => a.timestamp - b.timestamp);
        let currentPageStart = 0; let currentPageId = ""; let currentPageName = "";
        events.forEach((ev, index) => {
            const isPageStart = (
                ev.event_type === 'page_view' ||
                (ev.event_type === 'node_execution' && (ev.metadata?.nodeType === 'pageNode' || ev.metadata?.type === 'page' || ev.metadata?.page_name))
            );
            const nextEv = events[index + 1];
            if (isPageStart) {
                if (currentPageId && currentPageStart > 0) {
                    const diff = ev.timestamp - currentPageStart;
                    if (diff > 0 && diff < 30 * 60 * 1000) {
                        const timeData = pageDwellMap.get(currentPageId) || { totalTime: 0, count: 0, name: currentPageName };
                        timeData.totalTime += diff; timeData.count++; pageDwellMap.set(currentPageId, timeData);
                    }
                }
                currentPageStart = ev.timestamp; currentPageId = ev.node_id || 'landing_page'; currentPageName = ev.metadata?.page_name || 'ランディングページ (LP)';
            }
            if (!nextEv && currentPageId && currentPageStart > 0) {
                const diff = ev.timestamp - currentPageStart;
                if (diff > 0 && diff < 30 * 60 * 1000) {
                    const timeData = pageDwellMap.get(currentPageId) || { totalTime: 0, count: 0, name: currentPageName };
                    timeData.totalTime += diff; timeData.count++; pageDwellMap.set(currentPageId, timeData);
                }
            }
        });
    });
    const advancedPageDwellTime = Array.from(pageDwellMap.entries()).map(([pageId, val]) => ({
        pageId, pageName: val.name, avgTimeSec: (val.totalTime / val.count) / 1000, sampleCount: val.count
    })).sort((a, b) => b.avgTimeSec - a.avgTimeSec);

    const advancedStats: AdvancedStats = { deviceStats: advancedDeviceStats, scoreFlow: advancedScoreFlow, pageDwellTime: advancedPageDwellTime };

    // 6. Engagement Distribution
    let leadsQuery = supabase.from('leads').select('total_score, created_at, device_category').eq('project_id', projectId);
    if (filters?.dateRange) {
        leadsQuery = leadsQuery.gte('created_at', filters.dateRange.start.toISOString()).lte('created_at', filters.dateRange.end.toISOString());
    }
    const { data: leadsForDist } = await leadsQuery;
    const scoreRanges = { '0-20 (Cold)': 0, '21-50 (Warm)': 0, '51-80 (Hot)': 0, '81+ (Super Hot)': 0 };
    (leadsForDist || []).forEach((l: any) => {
        const score = l.total_score || 0;
        if (score <= 20) scoreRanges['0-20 (Cold)']++;
        else if (score <= 50) scoreRanges['21-50 (Warm)']++;
        else if (score <= 80) scoreRanges['51-80 (Hot)']++;
        else scoreRanges['81+ (Super Hot)']++;
    });
    const engagementDistribution = Object.entries(scoreRanges).map(([range, count]) => ({ range, count }));


    // Hesitation Stats Aggregation
    const hesitationSessionsCount = hesitationSessions.size;
    const hesitationRate = totalSessions > 0 ? (hesitationSessionsCount / totalSessions) * 100 : 0;

    return {
        thinkingTime: thinkingTimeStats,
        inputAnalytics: inputStats,
        backtracks: backtrackStats,
        engagementDistribution,
        advanced: advancedStats,
        rageClicks: rageClicks,
        hesitationStats: {
            rate: hesitationRate,
            hesitationSessions: hesitationSessionsCount,
            totalSessions: totalSessions
        }
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

    const headers = ['ID', 'Date', 'Rank', 'Score', 'IP Address', 'Device', 'Flags', 'Referrer', ...dataKeys];

    // 2. CSV行の作成
    const rows = leads.map(lead => {
        // 日付フォーマット: YYYY-MM-DD HH:mm:ss
        const d = new Date(lead.created_at);
        const dateStr = d.getFullYear() + '-' +
            String(d.getMonth() + 1).padStart(2, '0') + '-' +
            String(d.getDate()).padStart(2, '0') + ' ' +
            String(d.getHours()).padStart(2, '0') + ':' +
            String(d.getMinutes()).padStart(2, '0') + ':' +
            String(d.getSeconds()).padStart(2, '0');

        // フラグをテキスト化
        const flags = [];
        if (lead.behavior_flags?.pasted) flags.push("Paste");
        if (lead.behavior_flags?.long_idle) flags.push("Idle");
        if (lead.behavior_flags?.rage) flags.push("Rage");
        if (lead.behavior_flags?.mobile) flags.push("Mobile");

        const baseInfo = [
            lead.id,
            dateStr,
            lead.maturity_rank || 'Cold',
            lead.total_score || 0,
            lead.ip_address || '',
            lead.device_category || lead.device_type || '', // Use new category if avail
            `"${flags.join('|')}"`,
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
