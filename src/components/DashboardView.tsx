// src/components/DashboardView.tsx

import React, { useEffect, useState } from "react";
import { useProjectStore } from "../stores/useProjectStore";
import { fetchProjectStats, downloadLeadsAsCSV, type LeadData, type AnalyticsStats } from "../lib/dashboardService";
import "./DashboardView.css"; // スタイルは後述

const DashboardView: React.FC = () => {
  const currentProjectId = useProjectStore(state => state.currentProjectId);
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [leads, setLeads] = useState<LeadData[]>([]);
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
      setLoading(false);
    };

    loadData();
  }, [currentProjectId]);

  const handleDownloadCSV = () => {
    downloadLeadsAsCSV(leads, `leads_${new Date().toISOString().slice(0,10)}.csv`);
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
        <button className="dashboard-csv-button" onClick={handleDownloadCSV} disabled={leads.length === 0}>
          📥 CSVダウンロード
        </button>
      </div>

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