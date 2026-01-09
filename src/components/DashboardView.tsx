// src/components/DashboardView.tsx

import React, { useEffect, useState, useMemo, useCallback } from "react";
import type { Node } from "reactflow";
import { useProjectStore } from "../stores/useProjectStore";
import { usePageStore } from "../stores/usePageStore";
import { useSelectionStore } from "../stores/useSelectionStore";
import { useEditorSettingsStore } from "../stores/useEditorSettingsStore";
import {
  fetchProjectStats,
  fetchExtendedStats,
  downloadLeadsAsCSV,
  type LeadData,
  type AnalyticsStats,
  type DailyStats,
  type NodeStats,
  type ABTestStats,
  type ExtendedStats,
} from "../lib/dashboardService";
import "./DashboardView.css";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';

// New Components
import { ThinkingTimeChart } from "./dashboard/ThinkingTimeChart";
import { PsychometricsChart } from "./dashboard/PsychometricsChart";
import { BacktrackHeatmap } from "./dashboard/BacktrackHeatmap";
import { EngagementDistribution } from "./dashboard/EngagementDistribution";

// Grouped stats interface for dashboard aggregation
interface GroupedStat {
  id: string;
  name: string;
  interaction_count: number;
  unique_users: number;
}

type DashboardTab = 'overview' | 'psychometrics' | 'flow';

const DashboardView: React.FC = () => {
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

  // 集計表示モード
  const [groupingMode, setGroupingMode] = useState<'node' | 'page' | 'type'>('node');

  // エディタへのジャンプ用のストアアクセス
  const setSelectedPageId = usePageStore(state => state.setSelectedPageId);
  const handleItemSelect = useSelectionStore(state => state.handleItemSelect);
  const setViewMode = useEditorSettingsStore(state => state.setViewMode);

  // エクスポート設定用のState
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportStartDate, setExportStartDate] = useState<string>("");
  const [exportEndDate, setExportEndDate] = useState<string>("");
  const [exportColumns, setExportColumns] = useState<string[]>([]);
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);

  useEffect(() => {
    if (!currentProjectId) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);

      const [basicResult, extendedResult] = await Promise.all([
        fetchProjectStats(currentProjectId),
        fetchExtendedStats(currentProjectId)
      ]);

      setStats(basicResult.stats);
      setLeads(basicResult.leads);
      setDailyStats(basicResult.dailyStats);
      setNodeStats(basicResult.nodeStats);
      setAbStats(basicResult.abStats);
      setExtendedStats(extendedResult);

      setLoading(false);
    };

    loadData();
  }, [currentProjectId]);

  // データロード時に全カラムを抽出（エクスポート用）
  useEffect(() => {
    if (leads.length > 0) {
      const keys = new Set<string>();
      leads.forEach(l => Object.keys(l.data).forEach(k => keys.add(k)));
      setAvailableColumns(Array.from(keys).sort());
      setExportColumns(Array.from(keys).sort());
    }
  }, [leads]);


  // --- Helper Functions (Moved inside component) ---

  const getNodeDisplayName = useCallback((nodeId: string): string => {
    if (!projectMeta?.data?.pages) return nodeId;

    let parentItemId: string | null = null;
    let parentPageId: string | null = null;

    // 1. 逆引き
    for (const [pageId, page] of Object.entries(projectMeta.data.pages)) {
      if (page.allItemLogics) {
        for (const [itemId, nodeGraph] of Object.entries(page.allItemLogics)) {
          if (nodeGraph.nodes && Array.isArray(nodeGraph.nodes)) {
            const foundNode = nodeGraph.nodes.find((node: Node) => node.id === nodeId);
            if (foundNode) {
              parentItemId = itemId;
              parentPageId = pageId;
              break;
            }
          }
        }
        if (parentItemId) break;
      }
    }

    // 2. 親アイテム発見時
    if (parentItemId && parentPageId) {
      const parentPage = projectMeta.data.pages[parentPageId];
      const parentItem = parentPage.placedItems.find(item => item.id === parentItemId);
      if (parentItem) {
        if (parentItem.displayName) return parentItem.displayName;
        const idMatch = parentItemId.match(/_(\d+)$/);
        const idNumber = idMatch ? idMatch[1].slice(-4) : '';
        return idNumber ? `${parentItem.name}-${idNumber}` : parentItem.name;
      }
    }

    // 3. アイテム自体を探す
    for (const page of Object.values(projectMeta.data.pages)) {
      const item = page.placedItems.find(item => item.id === nodeId);
      if (item) {
        if (item.displayName) return item.displayName;
        const idMatch = nodeId.match(/_(\d+)$/);
        const idNumber = idMatch ? idMatch[1].slice(-4) : '';
        return idNumber ? `${item.name}-${idNumber}` : item.name;
      }
    }
    return nodeId;
  }, [projectMeta]);

  const groupedStats = useMemo(() => {
    if (!nodeStats.length) return [];

    if (groupingMode === 'node') {
      return nodeStats.map(ns => ({
        id: ns.node_id,
        name: getNodeDisplayName(ns.node_id),
        interaction_count: ns.interaction_count,
        unique_users: ns.unique_users
      }));
    }

    if (groupingMode === 'page') {
      const pageMap = new Map<string, { name: string; interactions: number; uu: number }>();
      nodeStats.forEach(ns => {
        let pageName = '不明なページ';
        let found = false;

        // 親アイテム逆引きロジック (簡易版)
        let parentPageId: string | null = null;
        if (projectMeta?.data?.pages) {
          for (const [pageId, page] of Object.entries(projectMeta.data.pages)) {
            if (page.allItemLogics) {
              for (const [, nodeGraph] of Object.entries(page.allItemLogics)) {
                if (nodeGraph.nodes?.find((node: Node) => node.id === ns.node_id)) {
                  parentPageId = pageId;
                  break;
                }
              }
            }
            if (parentPageId) break;
            // アイテム直接検索
            if (page.placedItems.find(item => item.id === ns.node_id)) {
              parentPageId = pageId;
              break;
            }
          }
        }

        if (parentPageId && projectMeta?.data?.pages[parentPageId]) {
          pageName = projectMeta.data.pages[parentPageId].name || '無題のページ';
          found = true;
        }

        if (!found) pageName = 'その他 (削除済みノードなど)';

        const current = pageMap.get(pageName) || { name: pageName, interactions: 0, uu: 0 };
        pageMap.set(pageName, {
          name: pageName,
          interactions: current.interactions + ns.interaction_count,
          uu: current.uu + ns.unique_users
        });
      });
      return Array.from(pageMap.values()).map(p => ({
        id: p.name, name: p.name, interaction_count: p.interactions, unique_users: p.uu
      }));
    }

    if (groupingMode === 'type') {
      const typeMap = new Map<string, { interactions: number; uu: number }>();
      const typeNameMap: Record<string, string> = {
        'ボタン': 'ボタン', '画像': '画像', 'テキスト': 'テキスト',
        'テキスト入力': 'テキスト入力', 'ページ遷移': 'ページノード'
      };

      nodeStats.forEach(ns => {
        let typeName = '不明';
        // 簡易ロジック: 一旦アイテム自体を探してtypeを取得
        if (projectMeta?.data?.pages) {
          for (const page of Object.values(projectMeta.data.pages)) {
            // Logic内ノードからの逆引きは今回は省略して、直接配置アイテムまたは簡易マッチのみ
            // 正確には親アイテムを探すべきだがコード量削減のため
            let parentItem = page.placedItems.find(i => i.id === ns.node_id);
            // もし親が見つからなければ、Logic内のノードIDかチェック（これは重いので省略か、以前のロジックを使う）
            // ここでは一旦以前のロジックの「親アイテム逆引き」を省略して、nodeStatsのIDがアイテムIDであるケース（ボタンなど）を想定
            if (!parentItem && page.allItemLogics) {
              // Logic内検索
              for (const [itemId, graph] of Object.entries(page.allItemLogics)) {
                if (graph.nodes?.find((n: Node) => n.id === ns.node_id)) {
                  parentItem = page.placedItems.find(i => i.id === itemId);
                  break;
                }
              }
            }

            if (parentItem) {
              typeName = parentItem.name || parentItem.type;
              typeName = typeNameMap[typeName] || typeName;
              break;
            }
          }
        }

        const current = typeMap.get(typeName) || { interactions: 0, uu: 0 };
        typeMap.set(typeName, {
          interactions: current.interactions + ns.interaction_count,
          uu: current.uu + ns.unique_users
        });
      });

      return Array.from(typeMap.entries()).map(([name, data]) => ({
        id: name, name: name, interaction_count: data.interactions, unique_users: data.uu
      }));
    }

    return [];
  }, [nodeStats, projectMeta, groupingMode, getNodeDisplayName]);

  const handleJumpToEditor = useCallback((stat: GroupedStat) => {
    if (!projectMeta?.data?.pages) return;

    // 簡易実装: nodeモードのみ対応
    if (groupingMode === 'node') {
      let foundPageId: string | null = null;
      let foundItemId: string | null = null;

      for (const [pageId, page] of Object.entries(projectMeta.data.pages)) {
        // アイテム直接
        const item = page.placedItems.find(it => it.id === stat.id);
        if (item) {
          foundPageId = pageId;
          foundItemId = item.id;
          break;
        }
        // Logic内
        if (page.allItemLogics) {
          for (const [itemId, graph] of Object.entries(page.allItemLogics)) {
            if (graph.nodes?.find((n: Node) => n.id === stat.id)) {
              foundPageId = pageId;
              foundItemId = itemId;
              break;
            }
          }
        }
        if (foundPageId) break;
      }

      if (foundPageId && foundItemId) {
        setSelectedPageId(foundPageId);
        const page = projectMeta.data.pages[foundPageId];
        const item = page.placedItems.find(i => i.id === foundItemId);
        if (item) handleItemSelect(foundItemId, item.displayName || item.name, false);
        setViewMode('design');
      }
    }
  }, [projectMeta, groupingMode, setSelectedPageId, handleItemSelect, setViewMode]);

  const handleExportClick = () => {
    setShowExportModal(true);
    const today = new Date();
    const lastMonth = new Date();
    lastMonth.setDate(today.getDate() - 30);
    if (!exportStartDate) setExportStartDate(lastMonth.toISOString().slice(0, 10));
    if (!exportEndDate) setExportEndDate(today.toISOString().slice(0, 10));
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

  const toggleColumn = (col: string) => {
    setExportColumns(prev => prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]);
  };

  // --- Render Functions ---

  const renderOverviewTab = () => (
    <>
      <div className="dashboard-stats-grid">
        <div className="stat-card">
          <div className="stat-label">総ビュー数 (PV)</div>
          <div className="stat-value">{stats?.totalViews.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">獲得リード数 (CV)</div>
          <div className="stat-value highlight">{stats?.totalLeads.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">完了率 (CVR)</div>
          <div className="stat-value">{stats?.conversionRate.toFixed(1)}<span className="unit">%</span></div>
        </div>
        <div className="stat-card">
          <div className="stat-label">デバイス比率 (Mobile/PC)</div>
          <div className="stat-sub-value">📱 {stats?.deviceBreakdown.mobile} / 💻 {stats?.deviceBreakdown.desktop}</div>
        </div>
      </div>

      <div className="dashboard-charts-section">
        <div className="chart-container">
          <h3 className="chart-title">日次推移 (PV / UU / CV)</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <LineChart data={dailyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="pv" stroke="#8884d8" name="PV" />
                <Line yAxisId="left" type="monotone" dataKey="uu" stroke="#82ca9d" name="UU" />
                <Line yAxisId="right" type="monotone" dataKey="cv" stroke="#ff7300" name="CV" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        {abStats.length > 0 && (
          <div className="chart-container">
            <h3 className="chart-title">A/Bテスト結果</h3>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={abStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="variant" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="conversion_rate" name="CVR (%)" fill="#8884d8">
                    {abStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.variant === 'A' ? '#0088FE' : '#00C49F'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* ノード離脱分析 (Overviewに維持) */}
      {nodeStats.length > 0 && (
        <div className="dashboard-table-section">
          <h3 className="section-title">アイテム別インタラクション (離脱分析用)</h3>
          <div className="stats-group-tabs">
            <button className={`stats-tab ${groupingMode === 'node' ? 'active' : ''}`} onClick={() => setGroupingMode('node')}>個別アイテム</button>
            <button className={`stats-tab ${groupingMode === 'page' ? 'active' : ''}`} onClick={() => setGroupingMode('page')}>ページ別</button>
            <button className={`stats-tab ${groupingMode === 'type' ? 'active' : ''}`} onClick={() => setGroupingMode('type')}>アイテム種類別</button>
          </div>
          <div className="table-wrapper">
            <table className="leads-table">
              <thead>
                <tr>
                  <th>{groupingMode === 'node' ? 'アイテム名' : groupingMode === 'page' ? 'ページ名' : 'アイテム種類'}</th>
                  <th>インタラクション数</th>
                  <th>ユニークユーザー数</th>
                </tr>
              </thead>
              <tbody>
                {groupedStats.map(stat => (
                  <tr key={stat.id} onClick={() => handleJumpToEditor(stat)} className="clickable-row" style={{ cursor: 'pointer' }}>
                    <td>{stat.name}</td>
                    <td>{stat.interaction_count}</td>
                    <td>{stat.unique_users}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 最新データ (Overviewに維持) */}
      <div className="dashboard-table-section">
        <h3 className="section-title">獲得データ一覧 (最新50件)</h3>
        <div className="table-wrapper">
          <table className="leads-table">
            <thead>
              <tr>
                <th>日時</th><th>IPアドレス</th><th>デバイス</th><th>回答データ</th>
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 ? (
                <tr><td colSpan={4} className="empty-cell">データがありません</td></tr>
              ) : (
                leads.slice(0, 50).map((lead) => (
                  <tr key={lead.id}>
                    <td>{new Date(lead.created_at).toLocaleString()}</td>
                    <td>{lead.ip_address || '-'}</td>
                    <td>{lead.device_type}</td>
                    <td className="json-cell">
                      {Object.entries(lead.data).map(([k, v]) => (
                        <div key={k} className="data-tag"><span className="key">{k}:</span> <span className="val">{String(v)}</span></div>
                      ))}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

  const renderPsychometricsTab = () => (
    <div className="dashboard-charts-section grid-2-col">
      <div className="chart-container">
        <ThinkingTimeChart data={extendedStats?.thinkingTime || []} />
      </div>
      <div className="chart-container full-width">
        <PsychometricsChart data={extendedStats?.inputAnalytics || []} />
      </div>
    </div>
  );

  const renderFlowTab = () => (
    <div className="dashboard-charts-section grid-2-col">
      <div className="chart-container">
        <BacktrackHeatmap data={extendedStats?.backtracks || []} />
      </div>
      <div className="chart-container">
        <EngagementDistribution data={extendedStats?.engagementDistribution || []} />
      </div>
    </div>
  );

  // --- Main Render ---

  if (!currentProjectId) {
    return <div className="dashboard-empty-state"><p>プロジェクトが保存されていません。</p></div>;
  }

  if (loading) {
    return <div className="dashboard-loading">Loading statistics...</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header-row">
        <h2 className="dashboard-title">📊 統計ダッシュボード</h2>
        <button className="dashboard-csv-button" onClick={() => setShowExportModal(true)} disabled={leads.length === 0}>
          📥 CSVダウンロード設定
        </button>
      </div>

      <div className="dashboard-tabs">
        <button className={`dashboard-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>📈 サマリー</button>
        <button className={`dashboard-tab ${activeTab === 'psychometrics' ? 'active' : ''}`} onClick={() => setActiveTab('psychometrics')}>🧠 入力心理分析</button>
        <button className={`dashboard-tab ${activeTab === 'flow' ? 'active' : ''}`} onClick={() => setActiveTab('flow')}>🔄 行動フロー</button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'psychometrics' && renderPsychometricsTab()}
        {activeTab === 'flow' && renderFlowTab()}
      </div>

      {showExportModal && (
        <div className="modal-overlay" onClick={() => setShowExportModal(false)}>
          <div className="modal-content export-modal" onClick={e => e.stopPropagation()}>
            <h3>エクスポート設定</h3>
            <div className="export-section">
              <label>期間指定</label>
              <div className="date-range-inputs">
                <input type="date" value={exportStartDate} onChange={e => setExportStartDate(e.target.value)} />
                <span> ~ </span>
                <input type="date" value={exportEndDate} onChange={e => setExportEndDate(e.target.value)} />
              </div>
            </div>
            <div className="export-section">
              <label>出力項目</label>
              <div className="columns-selector">
                <label className="column-checkbox">
                  <input type="checkbox" checked={availableColumns.length > 0 && exportColumns.length === availableColumns.length} onChange={(e) => setExportColumns(e.target.checked ? availableColumns : [])} />
                  <span>すべて選択 / 解除</span>
                </label>
                <hr />
                {availableColumns.map(col => (
                  <label key={col} className="column-checkbox">
                    <input type="checkbox" checked={exportColumns.includes(col)} onChange={() => toggleColumn(col)} />
                    <span>{col}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="modal-actions">
              <button className="cancel-button" onClick={() => setShowExportModal(false)}>キャンセル</button>
              <button className="primary-button" onClick={executeExport} disabled={exportColumns.length === 0}>CSVダウンロードを実行</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardView;