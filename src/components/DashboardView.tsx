import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import type { Node } from "reactflow";
import { Calendar, Clock } from "lucide-react";
import { useProjectStore } from "../stores/useProjectStore";
import { usePageStore } from "../stores/usePageStore";
import { useSelectionStore } from "../stores/useSelectionStore";
import { useEditorSettingsStore } from "../stores/useEditorSettingsStore";
import type { NodeGraph, PlacedItemType } from "../types";
import {
    fetchProjectStats,
    fetchDailyStats,
    fetchExtendedStats,
    fetchHourlyStats,
    fetchRawLogs,
    downloadLeadsAsCSV,
    downloadRawLogsAsCSV,
    downloadSummaryStatsAsCSV, // Added
    type LeadData,
    type AnalyticsStats,
    type DailyStats,
    type NodeStats,
    type ABTestStats,
    type ExtendedStats,
    getNodeLabel,
} from "../lib/dashboardService";
import "./DashboardView.css";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, Cell, PieChart, Pie, ComposedChart, Area
} from 'recharts';
import { KPICard } from "./dashboard/KPICard";
import { ThinkingTimeChart } from "./dashboard/ThinkingTimeChart";
import { PsychometricsChart } from "./dashboard/PsychometricsChart";
import { BacktrackHeatmap } from "./dashboard/BacktrackHeatmap";
import { EngagementDistribution } from "./dashboard/EngagementDistribution";
import { HotLeadsTable } from "./dashboard/HotLeadsTable";
import { RageClickTable } from "./dashboard/RageClickTable";
import { ItemScatterPlot } from "./dashboard/ItemScatterPlot";
import { DashboardDetailModal } from "./dashboard/DashboardDetailModal";
import { BatchCreateModal } from "./dashboard/BatchCreateModal";

// Local interface for pages with item logics (used by projectMeta.data.pages)
interface PageWithLogics {
    id: string;
    name: string;
    placedItems: (PlacedItemType & { displayName?: string })[];
    allItemLogics?: Record<string, NodeGraph>;
}

// Grouped stats interface for dashboard aggregation

type DashboardTab = 'overview' | 'behavior' | 'content';

const DashboardView: React.FC = () => {
    const dateInputRef = useRef<HTMLInputElement>(null);
    const currentProjectId = useProjectStore(state => state.currentProjectId);
    const projectMeta = useProjectStore(state => state.projectMeta);

    const [activeTab, setActiveTab] = useState<DashboardTab>('overview');

    const [stats, setStats] = useState<AnalyticsStats | null>(null);
    const [leads, setLeads] = useState<LeadData[]>([]);
    const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
    const [nodeStats, setNodeStats] = useState<NodeStats[]>([]);
    const [abStats, setAbStats] = useState<ABTestStats[]>([]);
    const [extendedStats, setExtendedStats] = useState<ExtendedStats | null>(null);

    const [loading, setLoading] = useState(true);
    const [isGraphLoading, setIsGraphLoading] = useState(false); // Added

    // Filters
    const [dateRangeFilter, setDateRangeFilter] = useState<number>(30); // days
    const [timeGranularity, setTimeGranularity] = useState<'daily' | 'hourly'>('daily'); // Added
    const [selectedHourlyDate, setSelectedHourlyDate] = useState<Date>(new Date()); // Added date picker state

    // 集計表示モード
    const [groupingMode, setGroupingMode] = useState<'node' | 'page' | 'type'>('node');

    // エディタへのジャンプ用のストアアクセス
    const setSelectedPageId = usePageStore(state => state.setSelectedPageId);
    const handleItemSelect = useSelectionStore(state => state.handleItemSelect);
    const { setViewMode, setPendingFocusNodeId } = useEditorSettingsStore(state => ({
        setViewMode: state.setViewMode,
        setPendingFocusNodeId: state.setPendingFocusNodeId
    }));

    // エクスポート設定用のState
    const [showExportModal, setShowExportModal] = useState(false);
    const [showDropoutModal, setShowDropoutModal] = useState(false);
    const [showBatchModal, setShowBatchModal] = useState(false); // [NEW] 一括作成モーダル
    const [exportStartDate, setExportStartDate] = useState<string>("");
    const [exportEndDate, setExportEndDate] = useState<string>("");
    const [exportColumns, setExportColumns] = useState<string[]>([]);
    // Note: availableColumns is set but not used in current implementation (future feature)
    const [, setAvailableColumns] = useState<string[]>([]);

    // Initial Load & Global Stats (Top Cards & Tables)
    useEffect(() => {
        if (!currentProjectId) {
            setLoading(false);
            return;
        }

        const loadGlobalData = async () => {
            // Only show full loader if we have no data at all
            if (!stats) setLoading(true);

            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - dateRangeFilter);

            const filters = {
                dateRange: { start: startDate, end: endDate }
            };

            const [basicResult, extendedResult] = await Promise.all([
                fetchProjectStats(currentProjectId),
                fetchExtendedStats(currentProjectId, filters)
            ]);

            setStats(basicResult.stats);
            setLeads(basicResult.leads);
            setNodeStats(basicResult.nodeStats);
            setAbStats(basicResult.abStats);
            // Note: basicResult.dailyStats is ignored here, handled by graph effect
            setExtendedStats(extendedResult);

            if (basicResult.leads.length > 0) {
                const keysSet = new Set<string>();
                basicResult.leads.forEach(lead => {
                    Object.keys(lead.data || {}).forEach(k => keysSet.add(k));
                });
                setAvailableColumns(Array.from(keysSet).sort());
            }

            setLoading(false);
        };

        loadGlobalData();
    }, [currentProjectId, dateRangeFilter]);

    // Graph Only Update
    useEffect(() => {
        if (!currentProjectId) return;

        const loadGraphData = async () => {
            setIsGraphLoading(true);

            if (timeGranularity === 'hourly') {
                const hourlyData = await fetchHourlyStats(currentProjectId, selectedHourlyDate);
                console.log('[DEBUG] Hourly data:', hourlyData);
                // hourlyData is compatible with dailyStats structure for charting
                setDailyStats(hourlyData as any);
            } else {
                const dailyData = await fetchDailyStats(currentProjectId);
                console.log('[DEBUG] Daily stats data:', dailyData);
                setDailyStats(dailyData);
            }

            setIsGraphLoading(false);
        };

        loadGraphData();
    }, [currentProjectId, timeGranularity, selectedHourlyDate]);

    // Export columns initialization
    useEffect(() => {
        if (leads.length > 0) {
            const keys = new Set<string>();
            leads.forEach(l => Object.keys(l.data).forEach(k => keys.add(k)));
            setAvailableColumns(Array.from(keys).sort());
            setExportColumns(Array.from(keys).sort());
        }
    }, [leads]);


    // --- Helper Functions ---

    const getNodeDisplayName = useCallback((nodeId: string): string => {
        if (!projectMeta?.data?.pages) return nodeId;

        let foundNode: Node | null = null;
        let foundItem: any = null;

        // 1. 逆引き (Logic Nodes)
        for (const [, pageRaw] of Object.entries(projectMeta.data.pages)) {
            const page = pageRaw as PageWithLogics;
            if (page.allItemLogics) {
                for (const [, nodeGraphRaw] of Object.entries(page.allItemLogics)) {
                    const nodeGraph = nodeGraphRaw as NodeGraph;
                    if (nodeGraph.nodes && Array.isArray(nodeGraph.nodes)) {
                        const n = nodeGraph.nodes.find((node: Node) => node.id === nodeId);
                        if (n) {
                            foundNode = n;
                            break;
                        }
                    }
                }
            }
            if (foundNode) break;

            // 2. アイテム直接 (Placed Items)
            const item = page.placedItems.find((it: PlacedItemType) => it.id === nodeId);
            if (item) {
                foundItem = item;
                break;
            }
        }

        if (foundNode) return ""; // 内部ロジックノードはリストに表示しない
        if (foundItem) {
            const label = foundItem.data?.customName || foundItem.displayName || foundItem.name || foundItem.type;
            const mockNode = {
                id: foundItem.id,
                type: foundItem.type,
                data: {
                    ...foundItem.data,
                    label: label,
                }
            };
            return getNodeLabel(mockNode);
        }

        return "";
    }, [projectMeta]);

    const groupedStats = useMemo(() => {
        // if (!nodeStats.length) return []; // 統計がなくてもアイテムがあれば表示したいため削除

        if (groupingMode === 'node') {
            const nodeMap = new Map<string, { name: string; interactions: number; uu: number }>();

            // 1. 全アイテムを走査して初期化
            if (projectMeta?.data?.pages) {
                Object.values(projectMeta.data.pages).forEach((pageRaw: any) => {
                    const page = pageRaw as PageWithLogics;
                    page.placedItems.forEach(item => {
                        const name = getNodeDisplayName(item.id);
                        if (name) {
                            nodeMap.set(item.id, { name, interactions: 0, uu: 0 });
                        }
                    });
                });
            }

            // 2. 統計データを反映
            nodeStats.forEach(ns => {
                // 既存のリストにあれば更新、なければ追加（ロジックノードなどの場合）
                // ただし getNodeDisplayName で名前が取れない（空文字）場合は除外される
                const existing = nodeMap.get(ns.node_id);
                if (existing) {
                    existing.interactions = ns.interaction_count;
                    existing.uu = ns.unique_users;
                } else {
                    const name = getNodeDisplayName(ns.node_id);
                    if (name) {
                        nodeMap.set(ns.node_id, {
                            name,
                            interactions: ns.interaction_count,
                            uu: ns.unique_users
                        });
                    }
                }
            });

            return Array.from(nodeMap.entries()).map(([itemId, item]) => ({
                id: itemId, // アイテムIDを一意なキーとして使用
                name: item.name,
                interaction_count: item.interactions,
                unique_users: item.uu
            }));
        }

        if (groupingMode === 'page') {
            const pageMap = new Map<string, { name: string; interactions: number; uu: number }>();
            nodeStats.forEach(ns => {
                let pageName = '不明なページ';
                let found = false;
                let parentPageId: string | null = null;
                if (projectMeta?.data?.pages) {
                    for (const [pageId, pageRaw] of Object.entries(projectMeta.data.pages)) {
                        const page = pageRaw as PageWithLogics;
                        if (page.allItemLogics) {
                            for (const [, nodeGraphRaw] of Object.entries(page.allItemLogics)) {
                                const nodeGraph = nodeGraphRaw as NodeGraph;
                                if (nodeGraph.nodes?.find((node: Node) => node.id === ns.node_id)) {
                                    parentPageId = pageId;
                                    break;
                                }
                            }
                        }
                        if (parentPageId) break;
                        if (page.placedItems.find((it: PlacedItemType) => it.id === ns.node_id)) {
                            parentPageId = pageId;
                            break;
                        }
                    }
                }

                if (parentPageId && projectMeta?.data?.pages[parentPageId]) {
                    pageName = projectMeta.data.pages[parentPageId].name || '無題のページ';
                    found = true;
                }

                // ページが見つからない場合は集計から除外（「その他」を表示しない）
                if (found) {
                    const current = pageMap.get(pageName) || { name: pageName, interactions: 0, uu: 0 };
                    pageMap.set(pageName, {
                        name: pageName,
                        interactions: current.interactions + ns.interaction_count,
                        uu: current.uu + ns.unique_users
                    });
                }
            });
            return Array.from(pageMap.values()).map(p => ({
                id: p.name, name: p.name, interaction_count: p.interactions, unique_users: p.uu
            }));
        }

        if (groupingMode === 'type') {
            const typeMap = new Map<string, { interactions: number; uu: number }>();

            // 英語のtypeから日本語表記へのマッピング
            const typeLabelMap: Record<string, string> = {
                'button': 'ボタン',
                'image': '画像',
                'text': 'テキスト',
                'input': 'テキスト入力',
                'textarea': 'テキストエリア',
                'choice': '選択肢',
                'video': '動画',
                'embed': '埋め込み',
                // 必要に応じて追加
            };

            // 1. プロジェクト内の全アイテムを走査して初期化（データがなくても表示するため）
            if (projectMeta?.data?.pages) {
                Object.values(projectMeta.data.pages).forEach((pageRaw: any) => {
                    const page = pageRaw as PageWithLogics;
                    page.placedItems.forEach(item => {
                        // マッピングにある正当なタイプ、または未知のタイプでもキーとして使用
                        const typeKey = typeLabelMap[item.type] || item.type;
                        if (!typeMap.has(typeKey)) {
                            typeMap.set(typeKey, { interactions: 0, uu: 0 });
                        }
                    });
                });
            }

            // 2. 統計データを加算
            nodeStats.forEach(ns => {
                let typeName = null;
                if (projectMeta?.data?.pages) {
                    for (const pageRaw of Object.values(projectMeta.data.pages)) {
                        const page = pageRaw as PageWithLogics;
                        let parentItem = page.placedItems.find((i: PlacedItemType) => i.id === ns.node_id);

                        // ロジックノードの場合、親アイテムを探す
                        if (!parentItem && page.allItemLogics) {
                            for (const [itemId, graphRaw] of Object.entries(page.allItemLogics)) {
                                const graph = graphRaw as NodeGraph;
                                if (graph.nodes?.find((n: Node) => n.id === ns.node_id)) {
                                    parentItem = page.placedItems.find((i: PlacedItemType) => i.id === itemId);
                                    break;
                                }
                            }
                        }

                        if (parentItem) {
                            // 日本語名に変換
                            typeName = typeLabelMap[parentItem.type] || parentItem.type;
                            break;
                        }
                    }
                }

                // アイテムが見つかった場合のみ加算（不明なデータは除外）
                if (typeName) {
                    const current = typeMap.get(typeName) || { interactions: 0, uu: 0 };
                    typeMap.set(typeName, {
                        interactions: current.interactions + ns.interaction_count,
                        uu: current.uu + ns.unique_users
                    });
                }
            });

            return Array.from(typeMap.entries()).map(([name, data]) => ({
                id: name, name: name, interaction_count: data.interactions, unique_users: data.uu
            }));
        }

        return [];
    }, [nodeStats, projectMeta, groupingMode, getNodeDisplayName]);

    const handleJumpToEditor = useCallback((nodeId: string) => {
        if (!projectMeta?.data?.pages) return;

        let foundPageId: string | null = null;
        let foundItemId: string | null = null;
        let isLogicNode = false;

        for (const [pageId, pageRaw] of Object.entries(projectMeta.data.pages)) {
            const page = pageRaw as PageWithLogics;
            const item = page.placedItems.find((it: PlacedItemType) => it.id === nodeId);
            if (item) {
                foundPageId = pageId;
                foundItemId = item.id;
                break;
            }
            if (page.allItemLogics) {
                for (const [itemId, graphRaw] of Object.entries(page.allItemLogics)) {
                    const graph = graphRaw as NodeGraph;
                    if (graph.nodes?.find((n: Node) => n.id === nodeId)) {
                        foundPageId = pageId;
                        foundItemId = itemId;
                        isLogicNode = true;
                        break;
                    }
                }
            }
            if (foundPageId) break;
        }

        if (foundPageId && foundItemId) {
            setSelectedPageId(foundPageId);
            const foundPage = projectMeta.data.pages[foundPageId] as PageWithLogics;
            const foundItem = foundPage.placedItems.find((i: PlacedItemType) => i.id === foundItemId);

            if (foundItem) {
                handleItemSelect(foundItemId, foundItem.displayName || foundItem.name, false);
            }

            if (isLogicNode) {
                setViewMode('split');
                setPendingFocusNodeId(nodeId);
            } else {
                setViewMode('design');
                setPendingFocusNodeId(nodeId);
            }
        }
    }, [projectMeta, setSelectedPageId, handleItemSelect, setViewMode, setPendingFocusNodeId]);

    const handleExportClick = async () => {
        console.log("Export clicked. Fetching specific logs...");

        // 1. Download Leads CSV (if any)
        if (leads.length > 0) {
            const today = new Date();
            const endDateStr = today.toISOString().slice(0, 10);
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - dateRangeFilter);
            const startDateStr = startDate.toISOString().slice(0, 10);

            downloadLeadsAsCSV(leads, {
                fileName: `leads_${startDateStr}_to_${endDateStr}.csv`
            });
        }

        // 2. Download Raw Logs CSV (Always try)
        const today = new Date();
        const startDate = new Date();
        startDate.setDate(today.getDate() - dateRangeFilter);

        try {
            if (!currentProjectId) {
                console.error("No Project ID found");
                return;
            }
            const rawLogs = await fetchRawLogs(currentProjectId, startDate, today);
            console.log("Raw Logs fetched:", rawLogs.length);

            if (rawLogs.length > 0) {
                const endDateStr = today.toISOString().slice(0, 10);
                const startDateStr = startDate.toISOString().slice(0, 10);
                downloadRawLogsAsCSV(rawLogs, `raw_logs_${startDateStr}_to_${endDateStr}.csv`);
            } else {
                if (leads.length === 0) {
                    // Data might still exist in stats
                }
            }

            // 3. Download Summary Stats CSV (Always, if stats exist)
            if (stats) {
                const endDateStr = today.toISOString().slice(0, 10);
                const startDateStr = startDate.toISOString().slice(0, 10);
                downloadSummaryStatsAsCSV(stats, dailyStats, nodeStats, `summary_stats_${startDateStr}_to_${endDateStr}.csv`);
            }

            // Alert with complete summary
            setTimeout(() => {
                let msg = 'エクスポート完了\n\n';
                if (stats) msg += '・統計サマリー (PV/CV/CVR等)\n';
                if (rawLogs.length > 0) msg += `・行動ログ (Raw): ${rawLogs.length}件\n`;
                if (leads.length > 0) msg += `・獲得リード (CV): ${leads.length}件\n`;
                msg += '\nファイルをダウンロードしました。';
                alert(msg);
            }, 1000);

        } catch (e) {
            console.error("Export failed", e);
            alert("エクスポート中にエラーが発生しました。");
        }
    };

    const executeExport = () => {
        let filteredLeads = leads;
        if (exportStartDate && exportEndDate) {
            const start = new Date(exportStartDate);
            const end = new Date(exportEndDate);
            end.setHours(23, 59, 59, 999);
            filteredLeads = leads.filter(l => {
                const d = new Date(l.created_at);
                return d >= start && d <= end;
            });
        }
        if (filteredLeads.length === 0) {
            alert("指定された期間にデータがありません");
            return;
        }
        downloadLeadsAsCSV(filteredLeads, {
            fileName: `leads_${exportStartDate}_to_${exportEndDate}.csv`,
            columns: exportColumns.length > 0 ? exportColumns : undefined
        });
        setShowExportModal(false);
    };

    // --- Data Preparation for Visuals ---

    // Device Ratio for Chart
    const deviceData = [
        { name: 'Mobile', value: stats?.deviceBreakdown.mobile || 0, color: '#3b82f6' },
        { name: 'Desktop', value: stats?.deviceBreakdown.desktop || 0, color: '#10b981' },
    ];


    // --- Render Sections ---

    const renderOverviewStats = () => {
        const hasData = stats !== null;
        const noDataText = "データがありません";

        return (
            <div className="bento-grid mb-6">
                <div className="col-span-3">
                    <KPICard
                        title="総ビュー数 (PV)"
                        value={hasData ? stats.totalViews.toLocaleString() : noDataText}
                    />
                </div>
                <div className="col-span-3">
                    <KPICard
                        title="獲得リード数 (CV)"
                        value={hasData ? stats.totalLeads.toLocaleString() : noDataText}
                    />
                </div>
                <div className="col-span-3">
                    <KPICard
                        title="完了率 (CVR)"
                        value={hasData ? stats.conversionRate.toFixed(1) : noDataText}
                        unit={hasData ? "%" : undefined}
                    />
                </div>
                {/* Device Ratio Donut */}
                <div className="col-span-3 bento-card flex flex-col items-center justify-center relative p-4">
                    <h3 className="absolute top-4 left-4 text-xs text-zinc-500 font-medium">デバイス比率</h3>
                    {hasData ? (
                        <>
                            <div style={{ width: '100%', height: 120 }}>
                                <ResponsiveContainer width="100%" height={120}>
                                    <PieChart>
                                        <Pie
                                            data={deviceData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={35}
                                            outerRadius={50}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {deviceData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: '#27272a', borderColor: '#3f3f46', fontSize: '12px' }} itemStyle={{ color: '#fff' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex gap-4 text-xs text-zinc-400 mt-2">
                                <div className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                    <span>モバイル: {hasData ? ((deviceData[0].value / (deviceData[0].value + deviceData[1].value || 1)) * 100).toFixed(1) : '0.0'}%</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                    <span>パソコン: {hasData ? ((deviceData[1].value / (deviceData[0].value + deviceData[1].value || 1)) * 100).toFixed(1) : '0.0'}%</span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
                            {noDataText}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderOverviewTab = () => (
        <div className="animate-fade-in space-y-6">
            {renderOverviewStats()}

            <div className="bento-grid">
                {/* Main Trend Chart */}
                <div className="col-span-12 bento-card h-[500px] flex flex-col relative">
                    {isGraphLoading && (
                        <div className="absolute inset-0 z-20 bg-black/50 flex items-center justify-center rounded-xl backdrop-blur-sm transition-all duration-300">
                            <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent shadow-lg text-blue-500"></div>
                        </div>
                    )}
                    <div className="card-title flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <span>日次推移 <span className="card-subtitle">PV / UU / CV トレンド</span></span>
                            <div className="flex items-center gap-3">
                                {/* Segmented Control */}
                                <div style={{ display: 'flex', backgroundColor: '#18181b', padding: '4px', borderRadius: '6px', border: '1px solid #27272a' }}>
                                    <button
                                        onClick={() => setTimeGranularity('daily')}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            padding: '6px 12px',
                                            fontSize: '12px',
                                            fontWeight: 500,
                                            borderRadius: '4px',
                                            border: 'none',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            backgroundColor: timeGranularity === 'daily' ? '#8b5cf6' : 'transparent',
                                            color: timeGranularity === 'daily' ? '#ffffff' : '#a1a1aa',
                                            boxShadow: timeGranularity === 'daily' ? '0 1px 2px rgba(0,0,0,0.2)' : 'none'
                                        }}
                                    >
                                        <Calendar size={14} strokeWidth={2.5} />
                                        <span>Daily</span>
                                    </button>
                                    <button
                                        onClick={() => setTimeGranularity('hourly')}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            padding: '6px 12px',
                                            fontSize: '12px',
                                            fontWeight: 500,
                                            borderRadius: '4px',
                                            border: 'none',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            backgroundColor: timeGranularity === 'hourly' ? '#8b5cf6' : 'transparent',
                                            color: timeGranularity === 'hourly' ? '#ffffff' : '#a1a1aa',
                                            boxShadow: timeGranularity === 'hourly' ? '0 1px 2px rgba(0,0,0,0.2)' : 'none'
                                        }}
                                    >
                                        <Clock size={14} strokeWidth={2.5} />
                                        <span>Hourly</span>
                                    </button>
                                </div>

                                {/* Date Picker Overlay */}
                                {timeGranularity === 'hourly' && (
                                    <div className="relative group animate-fade-in" style={{ marginLeft: '4px' }}>
                                        {/* Visual Display - Click Triggers Picker */}
                                        <div
                                            onClick={() => dateInputRef.current?.showPicker()}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                backgroundColor: '#18181b',
                                                border: '1px solid #27272a',
                                                borderRadius: '6px',
                                                padding: '4px 12px',
                                                height: '32px',
                                                cursor: 'pointer',
                                                transition: 'border-color 0.2s'
                                            }} className="group-hover:border-zinc-600">
                                            <span style={{ fontSize: '10px', color: '#71717a', fontWeight: 'bold', letterSpacing: '0.05em' }}>TARGET</span>
                                            <span style={{ fontSize: '12px', fontFamily: 'monospace', color: '#e4e4e7' }}>
                                                {selectedHourlyDate.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                                            </span>
                                            <Calendar size={14} className="text-zinc-500 group-hover:text-zinc-300" />
                                        </div>

                                        {/* Hidden Input for API */}
                                        <input
                                            ref={dateInputRef}
                                            type="date"
                                            max={new Date().toISOString().split('T')[0]}
                                            value={selectedHourlyDate.getFullYear() + '-' + String(selectedHourlyDate.getMonth() + 1).padStart(2, '0') + '-' + String(selectedHourlyDate.getDate()).padStart(2, '0')}
                                            onChange={(e) => {
                                                if (!e.target.value) return;
                                                const [y, m, d] = e.target.value.split('-').map(Number);
                                                const newDate = new Date(y, m - 1, d);
                                                if (!isNaN(newDate.getTime())) setSelectedHourlyDate(newDate);
                                            }}
                                            style={{
                                                visibility: 'hidden',
                                                position: 'absolute',
                                                bottom: 0,
                                                left: 0,
                                                width: 0,
                                                height: 0
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <span className="flex items-center gap-1 text-xs text-zinc-400"><div className="w-2 h-2 rounded-full bg-[#3b82f6]"></div> PV</span>
                            <span className="flex items-center gap-1 text-xs text-zinc-400"><div className="w-2 h-2 rounded-full bg-[#8b5cf6]"></div> UU</span>
                            <span className="flex items-center gap-1 text-xs text-zinc-400"><div className="w-2 h-2 rounded-full bg-[#10b981]"></div> CV</span>
                        </div>
                    </div>
                    <div className="flex-1 min-h-0">
                        {(() => {
                            const tomorrow = new Date();
                            tomorrow.setDate(tomorrow.getDate() + 1);
                            tomorrow.setHours(0, 0, 0, 0);
                            const isFutureDate = timeGranularity === 'hourly' && selectedHourlyDate >= tomorrow;

                            if (isFutureDate) {
                                return (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500 pb-10">
                                        <div className="text-4xl mb-2">📅</div>
                                        <p className="text-sm font-medium">未来の日付が選択されています</p>
                                        <p className="text-xs opacity-70 mt-1">データはまだ存在しません</p>
                                    </div>
                                );
                            }

                            return (
                                <div style={{ width: '100%', height: 400 }}>
                                    <ResponsiveContainer width="100%" height={400}>
                                        <ComposedChart data={dailyStats} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                            <defs>
                                                <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                                            <XAxis
                                                dataKey="date"
                                                stroke="#71717a"
                                                fontSize={12}
                                                tickLine={false}
                                                axisLine={false}
                                                tickFormatter={(value) => {
                                                    // 時間別の場合はすでに "HH:00" 形式になっている想定
                                                    if (timeGranularity === 'hourly') return value;

                                                    // 日次などの場合は日付オブジェクトに変換して整形
                                                    const d = new Date(value);
                                                    if (isNaN(d.getTime())) return value;
                                                    return `${d.getMonth() + 1}/${d.getDate()}`;
                                                }}
                                            />
                                            <YAxis
                                                yAxisId="left"
                                                stroke="#A1A1AA"
                                                fontSize={12}
                                                tickLine={false}
                                                axisLine={false}
                                                allowDecimals={false}
                                                label={{
                                                    content: ({ viewBox }: any) => {
                                                        const { x, y, height } = viewBox;
                                                        const cx = x + 15;
                                                        const cy = y + height / 2;
                                                        return (
                                                            <text x={cx} y={cy} transform={`rotate(-90, ${cx}, ${cy})`} textAnchor="middle" fontSize={12}>
                                                                <tspan fill="#3b82f6" fontWeight="bold">PV</tspan>
                                                                <tspan fill="#71717a"> / </tspan>
                                                                <tspan fill="#8b5cf6" fontWeight="bold">UU</tspan>
                                                            </text>
                                                        );
                                                    }
                                                }}
                                            />
                                            <YAxis
                                                yAxisId="right"
                                                orientation="right"
                                                stroke="#10b981"
                                                fontSize={12}
                                                tickLine={false}
                                                axisLine={false}
                                                allowDecimals={false}
                                                label={{ value: 'CV', angle: 90, position: 'insideRight', style: { fill: '#10b981', fontSize: '12px', fontWeight: 'bold' }, offset: 0 }}
                                            />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', color: '#fff' }}
                                                labelFormatter={(value) => {
                                                    if (timeGranularity === 'hourly') return value;
                                                    const d = new Date(value);
                                                    if (isNaN(d.getTime())) return value;
                                                    return `${d.getMonth() + 1}/${d.getDate()}`;
                                                }}
                                            />
                                            <Area yAxisId="left" type="monotone" dataKey="pv" stroke="#3b82f6" fillOpacity={1} fill="url(#colorPv)" name="PV" strokeWidth={2} dot={{ r: 4, fill: '#18181b', stroke: '#3b82f6', strokeWidth: 2 }} activeDot={{ r: 6, fill: '#3b82f6', stroke: '#18181b', strokeWidth: 2 }} />
                                            <Line yAxisId="left" type="monotone" dataKey="uu" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#18181b', strokeWidth: 2 }} activeDot={{ r: 6 }} name="UU" />
                                            <Line yAxisId="right" type="monotone" dataKey="cv" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#18181b', strokeWidth: 2 }} name="CV" />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                </div>
                            );
                        })()}
                    </div>
                </div>

                {/* Hot Leads (Now in Bento) */}
                <div className="col-span-12">
                    <HotLeadsTable leads={leads} />
                </div>
            </div>

            {/* Secondary Stats Row */}
            <div className="bento-grid">
                {/* Interaction Table */}
                {/* Interaction Table */}
                <div className={`${abStats.length > 0 ? 'col-span-8' : 'col-span-12'} bento-card`}>
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-y-2">
                        <div className="card-title mb-0">離脱要因分析</div>
                        <div className="stats-group-tabs">
                            <button className={`stats-tab ${groupingMode === 'node' ? 'active' : ''}`} onClick={() => setGroupingMode('node')}>個別アイテム</button>
                            <button className={`stats-tab ${groupingMode === 'page' ? 'active' : ''}`} onClick={() => setGroupingMode('page')}>ページ別</button>
                            <button className={`stats-tab ${groupingMode === 'type' ? 'active' : ''}`} onClick={() => setGroupingMode('type')}>アイテム種類別</button>
                        </div>
                    </div>

                    <div className="table-wrapper">
                        <table className="leads-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '40%' }}>{groupingMode === 'node' ? 'アイテム名' : groupingMode === 'page' ? 'ページ名' : 'アイテム種類'}</th>
                                    <th style={{ width: '40%' }}>インタラクション</th>
                                    <th style={{ width: '20%', textAlign: 'right' }}>UU</th>
                                </tr>
                            </thead>
                            <tbody>
                                {groupedStats.slice(0, 5).map((stat) => { // Top 5 only for overview
                                    const maxInteractions = Math.max(...groupedStats.map(s => s.interaction_count));
                                    const percentage = maxInteractions > 0 ? (stat.interaction_count / maxInteractions) * 100 : 0;
                                    return (
                                        <tr key={stat.id} onClick={() => handleJumpToEditor(stat.id)} className="clickable-row">
                                            <td className="relative">
                                                <div className="relative z-10">{stat.name}</div>
                                            </td>
                                            <td className="relative font-medium">
                                                <div className="absolute inset-y-0 left-0 bg-blue-500/10 rounded-r" style={{ width: `${percentage}%` }} />
                                                <div className="relative z-10 flex items-center gap-2">
                                                    {stat.interaction_count}
                                                    <span className="text-[10px] text-zinc-500 font-normal ml-1">({percentage.toFixed(0)}%)</span>
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'right', padding: '12px 16px', borderBottom: '1px solid #27272a', fontWeight: 500, color: '#e4e4e7' }}>
                                                {stat.unique_users}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        <div className="mt-4 flex justify-start">
                            <button
                                onClick={() => setShowDropoutModal(true)}
                                style={{
                                    backgroundColor: '#27272a',
                                    color: '#ffffff',
                                    border: '1px solid #3f3f46',
                                    padding: '6px 16px',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    cursor: 'pointer'
                                }}
                                className="font-medium hover:opacity-80 transition-opacity"
                            >
                                すべて見る
                            </button>
                        </div>
                    </div>
                </div>

                {/* A/B Test Results */}
                {abStats.length > 0 && (
                    <div className="col-span-4 bento-card">
                        <div className="card-title">A/Bテスト結果</div>
                        <ResponsiveContainer width="100%" height={250} minWidth={0} minHeight={0}>
                            <BarChart data={abStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="variant" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46' }} itemStyle={{ color: '#fff' }} />
                                <Bar dataKey="conversion_rate" name="CVR (%)" radius={[4, 4, 0, 0]}>
                                    {abStats.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.variant === 'A' ? '#3b82f6' : '#10b981'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )
                }
            </div>
        </div >
    );

    const renderBehaviorTab = () => {
        if (!extendedStats?.advanced) return <div className="p-8 text-center text-zinc-500">データ収集中...</div>;
        const { deviceStats } = extendedStats.advanced;

        return (
            <div className="space-y-6 animate-fade-in">
                {/* Environment Analysis */}
                <div className="bento-grid">
                    <div className="col-span-6 bento-card">
                        <div className="card-title">OS別パフォーマンス</div>
                        <div style={{ height: 300 }}>
                            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                                <BarChart data={deviceStats.os} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                    <XAxis type="number" stroke="#71717a" fontSize={12} />
                                    <YAxis dataKey="name" type="category" stroke="#71717a" fontSize={12} width={80} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46' }}
                                        itemStyle={{ color: '#fff' }}
                                        content={(props: any) => {
                                            if (!props.active || !props.payload || !props.payload.length) return null;
                                            const data = props.payload[0].payload;
                                            return (
                                                <div style={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', padding: '8px 12px', borderRadius: '6px' }}>
                                                    <p style={{ color: '#e4e4e7', fontWeight: 'bold', marginBottom: '4px' }}>{data.name}</p>
                                                    <p style={{ color: '#3b82f6', fontSize: '12px', margin: '2px 0' }}>シェア: {data.sessionPercentage.toFixed(1)}%</p>
                                                    <p style={{ color: '#10b981', fontSize: '12px', margin: '2px 0' }}>CVR: {data.cvr.toFixed(1)}%</p>
                                                    <p style={{ color: '#a1a1aa', fontSize: '12px', margin: '2px 0' }}>サンプル数: {data.sessions}</p>
                                                </div>
                                            );
                                        }}
                                    />
                                    <Legend />
                                    <Bar dataKey="sessionPercentage" name="シェア(%)" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                                    <Bar dataKey="cvr" name="CVR(%)" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="col-span-6 bento-card">
                        <div className="card-title">ブラウザ別パフォーマンス</div>
                        <div style={{ height: 300 }}>
                            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                                <BarChart data={deviceStats.browser} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#27272a" />
                                    <XAxis type="number" stroke="#71717a" fontSize={12} />
                                    <YAxis dataKey="name" type="category" stroke="#71717a" fontSize={12} width={80} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46' }}
                                        itemStyle={{ color: '#fff' }}
                                        content={(props: any) => {
                                            if (!props.active || !props.payload || !props.payload.length) return null;
                                            const data = props.payload[0].payload;
                                            return (
                                                <div style={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', padding: '8px 12px', borderRadius: '6px' }}>
                                                    <p style={{ color: '#e4e4e7', fontWeight: 'bold', marginBottom: '4px' }}>{data.name}</p>
                                                    <p style={{ color: '#3b82f6', fontSize: '12px', margin: '2px 0' }}>シェア: {data.sessionPercentage.toFixed(1)}%</p>
                                                    <p style={{ color: '#10b981', fontSize: '12px', margin: '2px 0' }}>CVR: {data.cvr.toFixed(1)}%</p>
                                                    <p style={{ color: '#a1a1aa', fontSize: '12px', margin: '2px 0' }}>サンプル数: {data.sessions}</p>
                                                </div>
                                            );
                                        }}
                                    />
                                    <Legend />
                                    <Bar dataKey="sessionPercentage" name="シェア(%)" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                                    <Bar dataKey="cvr" name="CVR(%)" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* User Frustration */}
                <div className="bento-grid">
                    <div className="col-span-4 bento-card border-rose-500/30 bg-rose-950/10">
                        <div className="card-title text-rose-400">⚠️ フラストレーション検知</div>
                        <div className="flex flex-col gap-4">
                            <div>
                                <div className="text-zinc-400 text-xs mb-1">ヘジテーション発生率 (迷い)</div>
                                <div className="text-3xl font-bold text-white">
                                    {(extendedStats?.hesitationStats?.rate || 0).toFixed(1)}<span className="text-sm font-normal text-zinc-500">%</span>
                                </div>
                            </div>
                            <div>
                                <div className="text-zinc-400 text-xs mb-1">影響セッション</div>
                                <div className="text-xl text-white">
                                    {extendedStats?.hesitationStats?.hesitationSessions || 0}<span className="text-sm text-zinc-500"> / {extendedStats?.hesitationStats?.totalSessions || 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-span-8 bento-card">
                        <div className="card-title">Rage Click 発生箇所 (イライラ)</div>
                        <RageClickTable data={(extendedStats?.rageClicks || []).map(item => {
                            // 1. ノード名: プロジェクトデータがあればそちらのカスタム名（getNodeDisplayName）を優先
                            // ただし、空白エリアの場合は targetNodeId が null なので getNodeDisplayName は使えない想定だが、念のためチェック
                            let finalName = item.nodeName;
                            if (item.targetNodeId) {
                                const liveName = getNodeDisplayName(item.targetNodeId);
                                if (liveName && liveName !== item.targetNodeId && liveName !== "削除されたアイテム") {
                                    finalName = liveName;
                                }
                            }

                            // 2. ページ名の解決と付与
                            // ログにあるページ名(item.pageName)か、プロジェクト構造からページID(item.pageId)で名前を探す
                            let pageName = item.pageName;
                            if (!pageName && item.pageId && projectMeta?.data?.pages) {
                                const p = projectMeta.data.pages[item.pageId];
                                if (p) pageName = p.name;
                            }

                            // 表示形式の調整
                            if (!item.targetNodeId) {
                                // 空白エリアの場合
                                if (pageName) {
                                    finalName = `${pageName}：空白エリア`;
                                } else {
                                    finalName = "空白エリア";
                                }
                            } else {
                                // 通常アイテムの場合も、ページ名を補足した方が親切かもしれないが、
                                // 要望は「空白エリアとなっているが、これをページごとに分けて」なので、
                                // 少なくとも空白エリアは分ける。
                                // 他のアイテムも一意性を高めるならページ名があってもいいが、
                                // ここでは空白エリアの対応を主とする。
                            }

                            return {
                                ...item,
                                nodeName: finalName
                            };
                        })} />
                    </div>
                </div>

                {/* Navigation & Heatmaps */}
                <div className="bento-grid">
                    <div className="col-span-6 bento-card" style={{ minHeight: '350px' }}>
                        <div className="card-title">バックトラック (戻る行動)</div>
                        <BacktrackHeatmap data={extendedStats?.backtracks || []} />
                    </div>
                    <div className="col-span-6 bento-card" style={{ minHeight: '350px' }}>
                        <div className="card-title">エンゲージメント分布</div>
                        <EngagementDistribution data={extendedStats?.engagementDistribution || []} />
                    </div>
                </div>

                {/* Psychometrics Analysis (Added) */}
                <div className="bento-grid">
                    <div className="col-span-12 bento-card">
                        <PsychometricsChart data={(extendedStats?.inputAnalytics || []).map(item => ({
                            ...item,
                            nodeName: getNodeDisplayName(item.nodeId) || item.nodeName
                        }))} />
                    </div>
                </div>
            </div>
        );
    };

    const renderContentTab = () => {
        const analysisData = extendedStats?.inputAnalytics || [];
        const sortedData = [...analysisData].sort((a, b) => b.avgHesitation - a.avgHesitation);

        // Custom Nameを反映させるためにmap処理を追加
        const scoreFlowData = (extendedStats?.advanced?.scoreFlow || []).map(item => ({
            ...item,
            nodeName: getNodeDisplayName(item.nodeId) || item.nodeName
        }));

        // Scatter Plot Data preparation
        const scatterData = sortedData.map(item => ({
            nodeId: item.nodeId,
            nodeName: getNodeDisplayName(item.nodeId), // 名前を取得
            avgDuration: item.avgDuration,
            avgHesitation: item.avgHesitation,
            sampleCount: item.sampleCount
        })).filter(item => item.nodeName !== ""); // 名前が空（削除済みまたはロジックノード）の場合は除外

        return (
            <div className="space-y-6 animate-fade-in">
                {/* Scatter Plot - Key Insight */}
                <div className="bento-grid">
                    <div className="col-span-8 bento-card" style={{ height: '400px' }}>
                        <div className="card-title">
                            設問の品質分析マトリクス
                            <span className="card-subtitle">右上ほど改善優先度・高</span>
                        </div>
                        <ItemScatterPlot data={scatterData} onNodeClick={handleJumpToEditor} />
                    </div>
                    <div className="col-span-4 bento-card">
                        <div className="card-title">検討時間分布</div>
                        <ThinkingTimeChart data={extendedStats?.thinkingTime || []} />
                    </div>
                </div>

                {/* Score Flow */}
                <div className="bento-card">
                    <div className="card-title">スコア変動フロー (熱量推移)</div>
                    <div style={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                            <LineChart data={scoreFlowData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                <XAxis dataKey="nodeName" stroke="#71717a" fontSize={12} angle={-15} textAnchor="end" height={60} />
                                <YAxis stroke="#71717a" fontSize={12} label={{ value: '累積スコア', angle: -90, position: 'insideLeft', fill: '#71717a' }} />
                                <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46' }} />
                                <Legend />
                                <Line type="monotone" dataKey="cumulativeScore" name="平均累積スコア" stroke="#f472b6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                <Line type="monotone" dataKey="avgScoreDelta" name="平均増減(Delta)" stroke="#60a5fa" strokeDasharray="5 5" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>


            </div>
        );
    };

    return (
        <div className="dashboard-container custom-scrollbar">
            <div className="dashboard-header">
                <div className="dashboard-title">
                    <h1>Dashboard</h1>
                    <p>プロジェクトのパフォーマンスとユーザーインサイト</p>
                </div>
                <div className="dashboard-actions">
                    <div className="control-group">
                        <Calendar size={16} className="text-zinc-400" />
                        <select
                            className="filter-select border-none bg-transparent p-0 focus:ring-0"
                            value={dateRangeFilter}
                            onChange={(e) => setDateRangeFilter(Number(e.target.value))}
                        >
                            <option value="7">過去7日間</option>
                            <option value="30">過去30日間</option>
                            <option value="90">過去90日間</option>
                            <option value="365">全期間</option>
                        </select>
                    </div>
                    <button className="action-btn" onClick={handleExportClick}>
                        CSVエクスポート
                    </button>
                    <button className="action-btn primary" onClick={() => setShowBatchModal(true)}>
                        一括作成
                    </button>
                </div>
            </div>

            <div className="dashboard-controls">
                <div className="dashboard-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                        onClick={() => setActiveTab('overview')}
                    >
                        全体サマリー
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'behavior' ? 'active' : ''}`}
                        onClick={() => setActiveTab('behavior')}
                    >
                        ユーザー行動分析
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'content' ? 'active' : ''}`}
                        onClick={() => setActiveTab('content')}
                    >
                        コンテンツ別分析
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-96">
                    <div className="animate-pulse text-zinc-500">データを読み込み中...</div>
                </div>
            ) : (
                <>
                    {activeTab === 'overview' && renderOverviewTab()}
                    {activeTab === 'behavior' && renderBehaviorTab()}
                    {activeTab === 'content' && renderContentTab()}
                </>
            )}

            {/* Export Modal (Simplified for view) */}
            {showExportModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="bg-zinc-900 border border-zinc-700 p-6 rounded-lg w-96 shadow-2xl relative" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-white mb-4">CSVエクスポート</h3>
                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-xs text-zinc-400 mb-1">開始日</label>
                                <input
                                    type="date"
                                    value={exportStartDate}
                                    onChange={e => setExportStartDate(e.target.value)}
                                    className="w-full bg-zinc-800 border border-zinc-700 text-white p-2 rounded focus:outline-none focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-zinc-400 mb-1">終了日</label>
                                <input
                                    type="date"
                                    value={exportEndDate}
                                    onChange={e => setExportEndDate(e.target.value)}
                                    className="w-full bg-zinc-800 border border-zinc-700 text-white p-2 rounded focus:outline-none focus:border-blue-500"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setShowExportModal(false)} className="px-4 py-2 text-zinc-400 hover:text-white transition-colors">キャンセル</button>
                            <button onClick={executeExport} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors">ダウンロード</button>
                        </div>
                    </div>
                </div>
            )}
            {/* Modals */}
            <DashboardDetailModal
                title={`離脱要因分析 (${groupingMode === 'node' ? 'アイテム別' : groupingMode === 'page' ? 'ページ別' : 'タイプ別'})`}
                isOpen={showDropoutModal}
                onClose={() => setShowDropoutModal(false)}
                data={groupedStats}
                type="dropout"
                onItemClick={handleJumpToEditor}
            />

            {/* [NEW] 一括作成モーダル */}
            <BatchCreateModal
                isOpen={showBatchModal}
                onClose={() => setShowBatchModal(false)}
            />
        </div>
    );
};

export default DashboardView;
