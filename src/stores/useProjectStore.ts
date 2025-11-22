// src/stores/useProjectStore.ts

import create from 'zustand';
import { supabase } from '../lib/supabaseClient';
import type { ProjectData, SavedProject } from '../types';
import { usePageStore } from './usePageStore';
import { usePreviewStore } from './usePreviewStore';
import { useEditorSettingsStore } from './useEditorSettingsStore';
import { useAuthStore } from './useAuthStore';

interface ProjectStoreState {
  currentProjectId: string | null; // 現在編集中のプロジェクトID (Supabase上のID)
  savedProjects: SavedProject[];
  isLoading: boolean;
  isSaving: boolean;

  // --- Actions ---
  fetchProjects: () => Promise<void>;
  createProject: (name: string) => Promise<void>;
  saveProject: () => Promise<void>;
  loadProject: (projectId: string) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  setCurrentProjectId: (id: string | null) => void;
}

export const useProjectStore = create<ProjectStoreState>((set, get) => ({
  currentProjectId: null,
  savedProjects: [],
  isLoading: false,
  isSaving: false,

  fetchProjects: async () => {
    set({ isLoading: true });
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
      alert('プロジェクト一覧の取得に失敗しました。');
    } else {
      set({ savedProjects: (data as SavedProject[]) || [] });
    }
    set({ isLoading: false });
  },

  createProject: async (name: string) => {
    // 新規プロジェクトを作成する際は、まずストアをリセットし、空の状態から開始する
    // (保存は「保存」ボタンを押したタイミングで行うため、ここではID管理と画面遷移のみ)
    
    // エディタの状態をリセット
    usePageStore.getState().resetPages();
    usePageStore.getState().addPage("Page 1");
    useEditorSettingsStore.getState().setProjectName(name);
    useEditorSettingsStore.getState().setView("editor");
    
    // 新規作成なのでIDはまだない
    set({ currentProjectId: null });
  },

  saveProject: async () => {
    const user = useAuthStore.getState().user;
    if (!user) {
      alert("保存するにはログインが必要です。");
      return;
    }

    set({ isSaving: true });

    // 現在のストアの状態から ProjectData を構築
    const { pages, pageOrder } = usePageStore.getState();
    const { variables } = usePreviewStore.getState();
    const projectName = useEditorSettingsStore.getState().projectName;

    const projectData: ProjectData = {
      projectName,
      pages,
      pageOrder,
      variables,
    };

    const currentId = get().currentProjectId;

    if (currentId) {
      // 更新 (Update)
      const { error } = await supabase
        .from('projects')
        .update({
          name: projectName,
          data: projectData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentId);

      if (error) {
        console.error('Error updating project:', error);
        alert('プロジェクトの保存に失敗しました。');
      } else {
        // alert('プロジェクトを保存しました！'); // 頻繁に保存する場合うるさいのでコメントアウトまたはToast推奨
        console.log("Project saved successfully.");
      }
    } else {
      // 新規保存 (Insert)
      const { data, error } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          name: projectName,
          data: projectData,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating project:', error);
        alert('プロジェクトの新規保存に失敗しました。');
      } else if (data) {
        set({ currentProjectId: data.id });
        console.log("New project created successfully.");
      }
    }

    set({ isSaving: false });
    
    // 一覧データを最新化しておく
    get().fetchProjects();
  },

  loadProject: async (projectId: string) => {
    set({ isLoading: true });
    
    // DBから取得
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (error || !data) {
      console.error('Error loading project:', error);
      alert('プロジェクトの読み込みに失敗しました。');
      set({ isLoading: false });
      return;
    }

    const project = data as SavedProject;
    const projectData = project.data;

    // ストアに展開
    usePageStore.getState().resetPages();
    
    // 少し待ってからデータを流し込む（リセットと競合しないように）
    setTimeout(() => {
      useEditorSettingsStore.getState().setProjectName(project.name);
      useEditorSettingsStore.getState().setView("editor");
      
      usePageStore.getState().loadProjectData(projectData);
      usePreviewStore.getState().setVariables(projectData.variables || {});
      
      set({ currentProjectId: project.id, isLoading: false });
    }, 10);
  },

  deleteProject: async (projectId: string) => {
    if (!confirm("本当にこのプロジェクトを削除しますか？")) return;

    set({ isLoading: true });
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) {
      console.error('Error deleting project:', error);
      alert('プロジェクトの削除に失敗しました。');
    } else {
      // 一覧を更新
      get().fetchProjects();
    }
    set({ isLoading: false });
  },

  setCurrentProjectId: (id) => set({ currentProjectId: id }),
}));