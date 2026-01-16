import React from 'react';
import { LeadData } from '../../lib/dashboardService';

interface HotLeadsTableProps {
    leads: LeadData[];
}

export const HotLeadsTable: React.FC<HotLeadsTableProps> = ({ leads }) => {
    return (
        <div className="hot-leads-container" style={{ padding: '20px', background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 'bold' }}>🔥 Hot Leads (有望見込み客)</h3>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                    <thead>
                        <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
                            <th style={{ padding: '12px 16px', fontWeight: 600, color: '#374151' }}>ランク</th>
                            <th style={{ padding: '12px 16px', fontWeight: 600, color: '#374151' }}>スコア</th>
                            <th style={{ padding: '12px 16px', fontWeight: 600, color: '#374151' }}>リード情報</th>
                            <th style={{ padding: '12px 16px', fontWeight: 600, color: '#374151' }}>発生日時/デバイス</th>
                            <th style={{ padding: '12px 16px', fontWeight: 600, color: '#374151' }}>詳細</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leads.length === 0 ? (
                            <tr>
                                <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>
                                    データがまだありません
                                </td>
                            </tr>
                        ) : (
                            leads.map((lead) => {
                                const rank = lead.maturity_rank || 'Cold';
                                const rankColor = rank === 'Hot' ? '#ef4444' : rank === 'Warm' ? '#f59e0b' : '#3b82f6';
                                const rankBg = rank === 'Hot' ? '#fee2e2' : rank === 'Warm' ? '#fef3c7' : '#dbeafe';

                                // リード情報の抽出 (メール > 名前 > ID)
                                const leadInfo = lead.data?.email || lead.data?.name || lead.data?.company || lead.session_id.slice(0, 8);

                                return (
                                    <tr key={lead.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                        <td style={{ padding: '12px 16px' }}>
                                            <span style={{
                                                display: 'inline-block', padding: '4px 12px', borderRadius: '999px',
                                                fontSize: '12px', fontWeight: 600,
                                                color: rankColor, backgroundColor: rankBg
                                            }}>
                                                {rank}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 16px', fontWeight: 'bold', fontSize: '15px' }}>
                                            {lead.score || 0}
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <div style={{ fontWeight: 500 }}>{leadInfo}</div>
                                            <div style={{ fontSize: '12px', color: '#9ca3af' }}>ID: {lead.id.slice(0, 8)}...</div>
                                        </td>
                                        <td style={{ padding: '12px 16px', color: '#6b7280', fontSize: '13px' }}>
                                            <div>{new Date(lead.created_at).toLocaleString('ja-JP')}</div>
                                            <div>{lead.device_type || 'Unknown'}</div>
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <button
                                                style={{ border: 'none', background: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}
                                                onClick={() => alert('詳細表示は次のフェーズで実装予定')} // Placeholder
                                            >
                                                分析データを見る &rarr;
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
