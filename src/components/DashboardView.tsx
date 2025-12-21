// src/components/DashboardView.tsx

import React, { useEffect, useState } from "react";
import { useProjectStore } from "../stores/useProjectStore";
import {
  fetchProjectStats,
  downloadLeadsAsCSV,
  type LeadData,
  type AnalyticsStats,
  type DailyStats,
  type NodeStats,
  type ABTestStats
} from "../lib/dashboardService";
import "./DashboardView.css";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';

const DashboardView: React.FC = () => {
  const currentProjectId = useProjectStore(state => state.currentProjectId);
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [leads, setLeads] = useState<LeadData[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [nodeStats, setNodeStats] = useState<NodeStats[]>([]);
  const [abStats, setAbStats] = useState<ABTestStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentProjectId) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      const result = await fetchProjectStats(currentProjectId);
      setStats(result.stats);
      setLeads(result.leads);
      setDailyStats(result.dailyStats);
      setNodeStats(result.nodeStats);
      setAbStats(result.abStats);
      setLoading(false);
    };

    loadData();
  }, [currentProjectId]);

  /* エクスポート設定用のState */
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportStartDate, setExportStartDate] = useState<string>("");
  const [exportEndDate, setExportEndDate] = useState<string>("");
  const [exportColumns, setExportColumns] = useState<string[]>([]);

  // 利用可能な全カラムのリスト（データから抽出）
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);

  // データロード時に全カラムを抽出
  useEffect(() => {
    if (leads.length > 0) {
      const keys = new Set<string>();
      leads.forEach(l => Object.keys(l.data).forEach(k => keys.add(k)));
      setAvailableColumns(Array.from(keys).sort());
      setExportColumns(Array.from(keys).sort()); // デフォルトで全選択
    }
  }, [leads]);

  const handleExportClick = () => {
    setShowExportModal(true);
    // 日付初期値（直近30日など）
    const today = new Date();
    const lastMonth = new Date();
    lastMonth.setDate(today.getDate() - 30);
    if (!exportStartDate) setExportStartDate(lastMonth.toISOString().slice(0, 10));
    if (!exportEndDate) setExportEndDate(today.toISOString().slice(0, 10));
  };

  const executeExport = () => {
    // 1. 日付フィルタリング
    let filteredLeads = leads;
    if (exportStartDate && exportEndDate) {
      const start = new Date(exportStartDate);
      const end = new Date(exportEndDate);
      end.setHours(23, 59, 59, 999); // 終了日の終わりまで

      filteredLeads = leads.filter(l => {
        const d = new Date(l.created_at);
        return d >= start && d <= end;
      });
    }

    if (filteredLeads.length === 0) {
      alert("指定された期間にデータがありません");
      return;
    }

    // 2. CSVダウンロード実行
    downloadLeadsAsCSV(filteredLeads, {
      fileName: `leads_${exportStartDate}_to_${exportEndDate}.csv`,
      columns: exportColumns.length > 0 ? exportColumns : undefined
    });
    setShowExportModal(false);
  };

  const toggleColumn = (col: string) => {
    setExportColumns(prev =>
      prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
    );
  };

  if (!currentProjectId) {
    return (
      <div className="dashboard-empty-state">
        <p>プロジェクトが保存されていません。まずはプロジェクトを保存してください。</p>
      </div>
    );
  }

  if (loading) {
    return <div className="dashboard-loading">Loading statistics...</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header-row">
        <h2 className="dashboard-title">📊 統計ダッシュボード</h2>
        <button className="dashboard-csv-button" onClick={handleExportClick} disabled={leads.length === 0}>
          📥 CSVダウンロード設定
        </button>
      </div>

      {/* エクスポート設定モーダル */}
      {showExportModal && (
        <div className="modal-overlay" onClick={() => setShowExportModal(false)}>
          <div className="modal-content export-modal" onClick={e => e.stopPropagation()}>
            <h3>エクスポート設定</h3>

            <div className="export-section">
              <label>期間指定</label>
              <div className="date-range-inputs">
                <input
                  type="date"
                  value={exportStartDate}
                  onChange={e => setExportStartDate(e.target.value)}
                />
                <span> ~ </span>
                <input
                  type="date"
                  value={exportEndDate}
                  onChange={e => setExportEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="export-section">
              <label>出力項目 (選択: {exportColumns.length}/{availableColumns.length})</label>
              <div className="columns-selector">
                <label className="column-checkbox">
                  <input
                    type="checkbox"
                    checked={availableColumns.length > 0 && exportColumns.length === availableColumns.length}
                    onChange={(e) => setExportColumns(e.target.checked ? availableColumns : [])}
                  />
                  <span>すべて選択 / 解除</span>
                </label>
                <hr />
                {availableColumns.map(col => (
                  <label key={col} className="column-checkbox">
                    <input
                      type="checkbox"
                      checked={exportColumns.includes(col)}
                      onChange={() => toggleColumn(col)}
                    />
                    <span>{col}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="modal-actions">
              <button className="cancel-button" onClick={() => setShowExportModal(false)}>キャンセル</button>
              <button className="primary-button" onClick={executeExport} disabled={exportColumns.length === 0}>
                CSVダウンロードを実行
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 統計カードエリア */}
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
          <div className="stat-value">
            {stats?.conversionRate.toFixed(1)}<span className="unit">%</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">デバイス比率 (Mobile/PC)</div>
          <div className="stat-sub-value">
            📱 {stats?.deviceBreakdown.mobile} / 💻 {stats?.deviceBreakdown.desktop}
          </div>
        </div>
      </div>

      {/* グラフエリア */}
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

      {/* ノード離脱分析 (簡易リスト) */}
      {nodeStats.length > 0 && (
        <div className="dashboard-table-section">
          <h3 className="section-title">ノード別インタラクション (離脱分析用)</h3>
          <div className="table-wrapper">
            <table className="leads-table">
              <thead>
                <tr>
                  <th>Node ID</th>
                  <th>Interaction Count</th>
                  <th>Unique Users</th>
                </tr>
              </thead>
              <tbody>
                {nodeStats.map(ns => (
                  <tr key={ns.node_id}>
                    <td>{ns.node_id}</td>
                    <td>{ns.interaction_count}</td>
                    <td>{ns.unique_users}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* データ一覧テーブル */}
      <div className="dashboard-table-section">
        <h3 className="section-title">獲得データ一覧 (最新50件)</h3>
        <div className="table-wrapper">
          <table className="leads-table">
            <thead>
              <tr>
                <th>日時</th>
                <th>IPアドレス</th>
                <th>デバイス</th>
                <th>回答データ (JSON)</th>
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={4} className="empty-cell">データがありません</td>
                </tr>
              ) : (
                leads.slice(0, 50).map((lead) => (
                  <tr key={lead.id}>
                    <td>{new Date(lead.created_at).toLocaleString()}</td>
                    <td>{lead.ip_address || '-'}</td>
                    <td>{lead.device_type}</td>
                    <td className="json-cell">
                      {/* JSONデータを見やすく表示 */}
                      {Object.entries(lead.data).map(([k, v]) => (
                        <div key={k} className="data-tag">
                          <span className="key">{k}:</span> <span className="val">{String(v)}</span>
                        </div>
                      ))}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="table-footer-note">※ 全データはCSVダウンロードで確認できます。</div>
      </div>
    </div>
  );
};

export default DashboardView;