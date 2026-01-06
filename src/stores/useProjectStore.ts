import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';
import type { ProjectData, SavedProject } from '../types';
import { usePageStore } from './usePageStore';
import { ValidationService } from '../lib/ValidationService';
import type { ValidationResult } from '../lib/ValidationService';
import { DataMinifier } from '../lib/DataMinifier';
import { useToastStore } from './useToastStore';
import type { ThemeConfig } from '../types';
import { useEditorSettingsStore } from './useEditorSettingsStore'; // ★追加: デバイスタイプ取得用

// Electron関連のコードは削除されました

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
  projectMeta: SavedProject | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  createProject: (name: string) => Promise<string | null>;
  loadProject: (projectId: string) => Promise<void>;
  saveProject: (dataOverrides?: Partial<ProjectData>) => Promise<boolean>;
  resetProject: () => void;
  updateCloudId: (cloudId: string) => void;
  publishProject: () => Promise<ValidationResult | boolean>;
  unpublishProject: () => Promise<boolean>;
  updateProjectName: (name: string) => void;
  updateTheme: (theme: ThemeConfig) => void;
}

export const useProjectStore = create<ProjectStoreState>((set, get) => ({
  currentProjectId: null,
  projectMeta: null,
  isLoading: false,
  error: null,

  // --- プロジェクト作成 ---
  createProject: async (name: string) => {
    set({ isLoading: true, error: null });
    try {
      const initialData = { ...initialProjectData, projectName: name };
      const { data, error } = await supabase
        .from('projects')
        .insert({ name, data: initialData })
        .select()
        .single();

      if (error) throw error;

      usePageStore.getState().loadFromData(data.data as ProjectData);

      set({
        currentProjectId: data.id,
        projectMeta: data as SavedProject,
        isLoading: false
      });
      useToastStore.getState().addToast("プロジェクトを作成しました", "success");
      return data.id;

    } catch (err: any) {
      console.error(err);
      set({ error: err.message, isLoading: false });
      return null;
    }
  },

  // --- プロジェクト読み込み ---
  loadProject: async (projectId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) throw error;

      if (data.data) {
        usePageStore.getState().loadFromData(data.data as ProjectData);
      }

      set({
        currentProjectId: data.id,
        projectMeta: data as SavedProject,
        isLoading: false
      });
    } catch (err: any) {
      console.error(err);
      set({ error: err.message, isLoading: false });
    }
  },

  // --- プロジェクト保存 ---
  saveProject: async (dataOverrides?: Partial<ProjectData>) => {
    const { currentProjectId, projectMeta } = get();
    if (!currentProjectId) {
      // プロジェクトがない場合はエラー
      set({ error: "保存するプロジェクトがありません。" });
      return false;
    }

    set({ isLoading: true, error: null });

    const pageState = usePageStore.getState();
    const editorSettings = useEditorSettingsStore.getState(); // ★追加: エディタ設定を取得
    const projectDataToSave: ProjectData = {
      projectName: projectMeta?.name || "無題",
      pages: pageState.pages,
      pageOrder: pageState.pageOrder,
      variables: {},
      cloud_id: projectMeta?.cloud_id,
      theme: projectMeta?.data?.theme,
      dataRetentionPeriod: projectMeta?.data?.dataRetentionPeriod,
      deviceType: editorSettings.isMobileView ? 'mobile' : 'desktop', // ★追加: デバイスタイプを保存
      ...dataOverrides // ★ここで上書きデータをマージ
    };


    // Supabaseに保存
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          data: projectDataToSave,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentProjectId);

      if (error) throw error;

      if (projectMeta) {
        set({
          isLoading: false,
          projectMeta: {
            ...projectMeta,
            updated_at: new Date().toISOString(),
            data: projectDataToSave
          }
        });
      }
      useToastStore.getState().addToast("プロジェクトを保存しました", "success");
      return true;
    } catch (err: any) {
      console.error(err);
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },


  // --- プロジェクト公開 ---
  publishProject: async (): Promise<ValidationResult | boolean> => {
    const { currentProjectId, projectMeta } = get();
    if (!currentProjectId) return false;

    set({ isLoading: true, error: null });

    const pageState = usePageStore.getState();
    const dataToPublish: ProjectData = {
      projectName: projectMeta?.name || "無題",
      pages: pageState.pages,
      pageOrder: pageState.pageOrder,
      variables: {},
      cloud_id: projectMeta?.cloud_id
    };

    const validationResult = ValidationService.validate(dataToPublish);

    if (!validationResult.isValid) {
      console.error('Validation failed:', validationResult);
      set({ isLoading: false });
      return validationResult;
    }

    if (validationResult.warnings.length > 0) {
      console.warn('Validation warnings:', validationResult.warnings);
    }


    // Supabaseで公開
    try {
      const minifiedData = DataMinifier.minifyForPublish(dataToPublish);

      const { error } = await supabase
        .from('projects')
        .update({
          published_data: minifiedData,
          is_published: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentProjectId);

      if (error) throw error;

      console.log('Project published successfully via Supabase!');

      if (projectMeta) {
        set({
          projectMeta: {
            ...projectMeta,
            is_published: true,
            updated_at: new Date().toISOString(),
          },
          isLoading: false
        });
      }
      useToastStore.getState().addToast("プロジェクトを公開しました", "success");
      return true;

    } catch (err: any) {
      console.error('Publish error:', err);
      set({ error: err.message, isLoading: false });
      return false;
    }
  },

  // --- プロジェクトの非公開化 ---
  unpublishProject: async (): Promise<boolean> => {
    const { currentProjectId, projectMeta } = get();
    if (!currentProjectId) return false;

    set({ isLoading: true, error: null });


    // Supabaseで非公開
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          is_published: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentProjectId);

      if (error) throw error;

      console.log('Project unpublished successfully');

      if (projectMeta) {
        set({
          projectMeta: {
            ...projectMeta,
            is_published: false,
            updated_at: new Date().toISOString(),
          },
          isLoading: false
        });
      }
      useToastStore.getState().addToast("プロジェクトを非公開にしました", "info");
      return true;

    } catch (err: any) {
      console.error('Unpublish error:', err);
      set({ error: err.message, isLoading: false });
      return false;
    }
  },

  // --- プロジェクト名の更新 ---
  updateProjectName: (name: string) => {
    const { projectMeta } = get();
    if (projectMeta) {
      set({
        projectMeta: {
          ...projectMeta,
          name: name
        }
      });
    }
  },

  // --- テーマ更新 ---
  updateTheme: (theme: ThemeConfig) => {
    const { projectMeta } = get();
    if (projectMeta) {
      // ストアのメタデータを更新
      const updatedMeta = {
        ...projectMeta,
        data: {
          ...projectMeta.data,
          theme
        }
      };
      set({ projectMeta: updatedMeta });
    }

    // エディタへの反映（ページレンダリング用）
    // ※ usePageStoreへの反映が必要だが、loadFromDataは全体リセットになるので注意。
    // 現状はprojectMetaが正となっていれば、レンダリング時に参照するように修正すべきだが、
    // ここではメタデータ更新を優先。
  },

  // --- クラウドIDの更新 ---
  updateCloudId: (cloudId: string) => {
    const { projectMeta } = get();
    if (projectMeta) {
      set({
        projectMeta: {
          ...projectMeta,
          cloud_id: cloudId
        }
      });
    }
  },

  // --- その他のアクション ---
  resetProject: () => {
    set({
      currentProjectId: null,
      projectMeta: null,
      isLoading: false,
      error: null,
    });
    usePageStore.getState().loadFromData(initialProjectData);
  }
}));