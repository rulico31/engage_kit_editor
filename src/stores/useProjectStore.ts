import create from 'zustand';
import { supabase } from '../lib/supabaseClient';
import type { ProjectData, SavedProject } from '../types';
import { usePageStore } from './usePageStore';

// 初期データの定義
const initialProjectData: ProjectData = {
  projectName: "新規プロジェクト",
  pages: {
    "page-1": {
      id: "page-1",
      name: "Page 1",
      placedItems: [],
      allItemLogics: {}
    }
  },
  pageOrder: ["page-1"],
  variables: {}
};

interface ProjectStoreState {
  currentProjectId: string | null;
  projectMeta: SavedProject | null; // ★ 追加: プロジェクトのメタデータ（ID, 名前, 作成日など）
  isLoading: boolean;
  error: string | null;

  // Actions
  createProject: (name: string) => Promise<string | null>;
  loadProject: (projectId: string) => Promise<void>;
  saveProject: () => Promise<void>;
  resetProject: () => void;
}

export const useProjectStore = create<ProjectStoreState>((set, get) => ({
  currentProjectId: null,
  projectMeta: null, // ★ 初期値
  isLoading: false,
  error: null,

  createProject: async (name: string) => {
    set({ isLoading: true, error: null });
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error("ユーザーがログインしていません");

      const newProjectData = { ...initialProjectData, projectName: name };

      const { data, error } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          name: name,
          data: newProjectData
        })
        .select()
        .single();

      if (error) throw error;

      // PageStoreの状態も初期化
      usePageStore.getState().loadFromData(newProjectData);

      set({ 
        currentProjectId: data.id, 
        projectMeta: data, // ★ 設定
        isLoading: false 
      });
      
      return data.id;
    } catch (err: any) {
      console.error(err);
      set({ error: err.message, isLoading: false });
      return null;
    }
  },

  loadProject: async (projectId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) throw error;

      // PageStoreにデータを反映
      if (data.data) {
        usePageStore.getState().loadFromData(data.data as ProjectData);
      }

      set({ 
        currentProjectId: data.id, 
        projectMeta: data, // ★ 設定
        isLoading: false 
      });
    } catch (err: any) {
      console.error(err);
      set({ error: err.message, isLoading: false });
    }
  },

  saveProject: async () => {
    const { currentProjectId, projectMeta } = get();
    if (!currentProjectId) return;

    set({ isLoading: true, error: null });
    try {
      // PageStoreから最新のデータを取得して保存用に整形
      const pageState = usePageStore.getState();
      
      const projectDataToSave: ProjectData = {
        projectName: projectMeta?.name || "無題",
        pages: pageState.pages,
        pageOrder: pageState.pageOrder,
        variables: {} // 変数の初期値を保存したい場合はここに追加
      };

      const { error } = await supabase
        .from('projects')
        .update({
          data: projectDataToSave,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentProjectId);

      if (error) throw error;

      set({ isLoading: false });
    } catch (err: any) {
      console.error(err);
      set({ error: err.message, isLoading: false });
      throw err; // UI側でキャッチさせる
    }
  },

  resetProject: () => {
    set({ currentProjectId: null, projectMeta: null, error: null });
    // PageStoreもリセットする場合はここで呼び出す
  }
}));