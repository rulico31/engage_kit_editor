import React, { useState } from 'react';
import type { LeadData } from '../../lib/dashboardService';
import { MicroJourneyModal } from './MicroJourneyModal';

interface HotLeadsTableProps {
    leads: LeadData[];
}

export const HotLeadsTable: React.FC<HotLeadsTableProps> = ({ leads }) => {
    const [selectedLead, setSelectedLead] = useState<LeadData | null>(null);

    return (
        <div className="hot-leads-container" style={{ padding: '20px', background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🔥 Hot Leads (有望見込み客)
                <span style={{ fontSize: '12px', background: '#fef3c7', color: '#d97706', padding: '2px 8px', borderRadius: '12px' }}>B2B行動分析</span>
            </h3>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                    <thead>
                        <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
                            <th style={{ padding: '12px 16px', fontWeight: 600, color: '#374151' }}>ランク</th>
                            <th style={{ padding: '12px 16px', fontWeight: 600, color: '#374151' }}>スコア</th>
                            <th style={{ padding: '12px 16px', fontWeight: 600, color: '#374151' }}>リード情報</th>
                            <th style={{ padding: '12px 16px', fontWeight: 600, color: '#374151' }}>行動インサイト</th>
                            <th style={{ padding: '12px 16px', fontWeight: 600, color: '#374151' }}>発生日時/デバイス</th>
                            <th style={{ padding: '12px 16px', fontWeight: 600, color: '#374151' }}>詳細</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leads.length === 0 ? (
                            <tr>
                                <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>
                                    データがまだありません
                                </td>
                            </tr>
                        ) : (
                            leads.map((lead) => {
                                const rank = lead.maturity_rank || 'Cold';
                                const rankColor = rank === 'Hot' ? '#ef4444' : rank === 'Warm' ? '#d97706' : '#3b82f6';
                                const rankBg = rank === 'Hot' ? '#fee2e2' : rank === 'Warm' ? '#fef3c7' : '#dbeafe';

                                // リード情報の抽出 (メール > 名前 > ID)
                                const leadInfo = lead.data?.email || lead.data?.name || lead.data?.company || lead.session_id.slice(0, 8);

                                // 行動フラグ
                                const flags = lead.behavior_flags || {};

                                return (
                                    <tr key={lead.id} style={{ borderBottom: '1px solid #f3f4f6', transition: 'background-color 0.2s' }} className="hover:bg-gray-50">
                                        <td style={{ padding: '12px 16px' }}>
                                            <span style={{
                                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                padding: '4px 12px', borderRadius: '999px',
                                                fontSize: '12px', fontWeight: 700,
                                                color: rankColor, backgroundColor: rankBg,
                                                border: `1px solid ${rankColor}30`
                                            }}>
                                                {rank === 'Hot' && '🔥 '}
                                                {rank}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#111827' }}>
                                                {lead.total_score || 0}
                                                <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: 'normal', marginLeft: '2px' }}>pt</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <div style={{ fontWeight: 600, color: '#1f2937' }}>{leadInfo}</div>
                                            <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>ID: {lead.id.slice(0, 8)}...</div>
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                                {flags.pasted && (
                                                    <span title="テキストペースト検知 (準備済み/転載の可能性)" style={{ cursor: 'help', fontSize: '16px' }}>📋</span>
                                                )}
                                                {flags.long_idle && (
                                                    <span title="長時間の熟考あり (迷い/検討)" style={{ cursor: 'help', fontSize: '16px' }}>🤔</span>
                                                )}
                                                {flags.rage && (
                                                    <span title="レイジクリック検知 (ストレス/UI課題)" style={{ cursor: 'help', fontSize: '16px' }}>😡</span>
                                                )}
                                                {flags.mobile && (
                                                    <span title="モバイルからのアクセス" style={{ cursor: 'help', fontSize: '16px' }}>📱</span>
                                                )}
                                                {!flags.pasted && !flags.long_idle && !flags.rage && !flags.mobile && (
                                                    <span style={{ fontSize: '11px', color: '#d1d5db' }}>-</span>
                                                )}
                                            </div>
                                        </td>
                                        <td style={{ padding: '12px 16px', color: '#6b7280', fontSize: '13px' }}>
                                            <div>{new Date(lead.created_at).toLocaleString('ja-JP')}</div>
                                            <div style={{ marginTop: '2px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                {lead.device_category === 'mobile' ? '📱 Mobile' :
                                                    lead.device_category === 'tablet' ? '📲 Tablet' : '💻 Desktop'}
                                            </div>
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <button
                                                style={{
                                                    border: '1px solid #dbeafe', background: '#eff6ff', color: '#2563eb',
                                                    cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                                                    padding: '6px 12px', borderRadius: '6px',
                                                    transition: 'all 0.2s'
                                                }}
                                                onClick={() => setSelectedLead(lead)}
                                            >
                                                行動ログを見る
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {selectedLead && (
                <MicroJourneyModal
                    sessionId={selectedLead.session_id}
                    leadId={selectedLead.id}
                    onClose={() => setSelectedLead(null)}
                />
            )}
        </div>
    );
};
