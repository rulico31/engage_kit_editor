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

/**
 * プロジェクトの統計情報とリード一覧を取得
 */
export const fetchProjectStats = async (projectId: string) => {
  // 1. PV数の取得 (analytics_logs)
  const { count: pvCount, error: pvError } = await supabase
    .from('analytics_logs')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .eq('event_type', 'page_view');

  if (pvError) console.error('Error fetching PV:', pvError);

  // 2. リードデータの取得 (leads)
  const { data: leads, error: leadsError } = await supabase
    .from('leads')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (leadsError) console.error('Error fetching leads:', leadsError);

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
  };
};

/**
 * リードデータをCSV形式に変換してダウンロード
 */
export const downloadLeadsAsCSV = (leads: LeadData[], fileName: string = 'leads_data.csv') => {
  if (leads.length === 0) {
    alert("データがありません");
    return;
  }

  // 1. JSONデータのキーを全網羅してヘッダーを作成
  // (ユーザーによって回答項目が異なる可能性があるため)
  const dataKeys = new Set<string>();
  leads.forEach(lead => {
    Object.keys(lead.data).forEach(k => dataKeys.add(k));
  });
  
  const sortedDataKeys = Array.from(dataKeys).sort();
  const headers = ['ID', 'Date', 'IP Address', 'Device', 'Referrer', ...sortedDataKeys];

  // 2. CSV行の作成
  const rows = leads.map(lead => {
    const date = new Date(lead.created_at).toLocaleString();
    const baseInfo = [
      lead.id,
      `"${date}"`, // 日付にカンマが含まれる場合のためクォート
      lead.ip_address || '',
      lead.device_type || '',
      `"${lead.referrer || ''}"`
    ];

    const answers = sortedDataKeys.map(key => {
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