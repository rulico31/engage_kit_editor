// Auto-generated Supabase Database Types
// Generated from schema.sql

export interface Database {
    public: {
        Tables: {
            projects: {
                Row: {
                    id: string;
                    user_id: string;
                    name: string;
                    data: ProjectData | null;
                    published_content: ProjectData | null;
                    is_published: boolean;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    name: string;
                    data?: ProjectData | null;
                    published_content?: ProjectData | null;
                    is_published?: boolean;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    name?: string;
                    data?: ProjectData | null;
                    published_content?: ProjectData | null;
                    is_published?: boolean;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            analytics_logs: {
                Row: {
                    id: string;
                    project_id: string;
                    event_type: AnalyticsEventType;
                    payload: Record<string, any>;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    project_id: string;
                    event_type: AnalyticsEventType;
                    payload?: Record<string, any>;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    project_id?: string;
                    event_type?: AnalyticsEventType;
                    payload?: Record<string, any>;
                    created_at?: string;
                };
            };
            leads: {
                Row: {
                    id: string;
                    project_id: string;
                    data: Record<string, any>;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    project_id: string;
                    data: Record<string, any>;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    project_id?: string;
                    data?: Record<string, any>;
                    created_at?: string;
                };
            };
        };
        Views: {
            analytics_dashboard: {
                Row: {
                    project_id: string;
                    total_page_views: number;
                    total_conversions: number;
                    conversion_rate: number;
                    unique_sessions: number;
                };
            };
        };
        Functions: {
            check_monthly_lead_limit: {
                Args: { project_uuid: string };
                Returns: boolean;
            };
        };
    };
}

export type AnalyticsEventType =
    | 'page_view'
    | 'conversion'
    | 'node_execution'
    | 'logic_branch'
    | 'error';

// Import ProjectData from main types
import type { ProjectData } from '../types';
