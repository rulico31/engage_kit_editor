import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';
import type { ProjectData, SavedProject } from '../types';
import { usePageStore } from './usePageStore';
import { ValidationService } from '../lib/ValidationService';
import type { ValidationResult } from '../lib/ValidationService';
import { DataMinifier } from '../lib/DataMinifier';
import { useToastStore } from './useToastStore';
import type { ThemeConfig } from '../types';

// =========================================================
// Electron APIの型定義（安全のためローカルでも定義）
declare const window: Window & {
  electronAPI?: {
    saveProjectFile: (data: string, filePath?: string) => Promise<{ success: boolean; filePath?: string; error?: string }>;
    openProjectFile: () => Promise<{ data: string; filePath: string } | null>;
  };
};
// =========================================================

// ローカルプロジェクト用のID生成ヘルパー
const generateLocalId = () => `local-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

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
  localFilePath: string | null;

  // Actions
  createProject: (name: string) => Promise<string | null>;
  loadProject: (projectId?: string) => Promise<void>;
  saveProject: (dataOverrides?: Partial<ProjectData>) => Promise<boolean>;
  saveProjectAs: () => Promise<boolean>;
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
  localFilePath: null,

  // --- プロジェクト作成 ---
  createProject: async (name: string) => {
    // 1. Electronアプリの場合: ローカルIDで初期化
    if (window.electronAPI) {
      const newProjectId = generateLocalId();
      const newProjectData: ProjectData = { ...initialProjectData, projectName: name };

      usePageStore.getState().loadFromData(newProjectData);

      set({
        currentProjectId: newProjectId,
        projectMeta: {
          id: newProjectId,
          name: name,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_published: false,
          user_id: 'local_user',
          data: newProjectData
        } as SavedProject,
        isLoading: false,
        error: null,
        localFilePath: null,
      });
      useToastStore.getState().addToast("プロジェクトを作成しました", "success");
      return newProjectId;
    }

    // 2. FALLBACK: Web (Supabase) の既存ロジック
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
  loadProject: async (projectId?: string) => {
    // 1. Electronアプリの場合: ローカルファイルを開くダイアログを表示
    if (window.electronAPI && !projectId) {
      set({ isLoading: true, error: null });
      try {
        const result = await window.electronAPI.openProjectFile();

        if (!result) {
          set({ isLoading: false });
          return;
        }

        const { data: jsonString, filePath } = result as any;
        const loadedData = JSON.parse(jsonString) as ProjectData;

        usePageStore.getState().loadFromData(loadedData);

        const localId = generateLocalId();

        set({
          currentProjectId: localId,
          projectMeta: {
            id: localId,
            name: loadedData.projectName || "ローカルプロジェクト",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_published: false,
            user_id: 'local_user',
            data: loadedData,
            cloud_id: loadedData.cloud_id
          } as SavedProject,
          isLoading: false,
          localFilePath: filePath
        });
        return;

      } catch (err: any) {
        console.error('ローカルファイル読込エラー:', err);
        set({ error: "ファイルの読み込みに失敗しました。", isLoading: false });
        return;
      }
    }

    // 2. Web (Supabase) の既存ロジック
    if (!projectId) return;

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
    const projectDataToSave: ProjectData = {
      projectName: projectMeta?.name || "無題",
      pages: pageState.pages,
      pageOrder: pageState.pageOrder,
      variables: {},
      cloud_id: projectMeta?.cloud_id,
      theme: projectMeta?.data?.theme,
      dataRetentionPeriod: projectMeta?.data?.dataRetentionPeriod,
      ...dataOverrides // ★ここで上書きデータをマージ
    };

    // 1. Electronアプリの場合
    if (window.electronAPI) {
      try {
        const jsonString = JSON.stringify(projectDataToSave, null, 2);
        const currentPath = get().localFilePath;

        // パスがあれば上書き、なければダイアログ
        const projectName = projectMeta?.name || "無題";
        const result = await window.electronAPI.saveProjectFile(jsonString, currentPath || undefined, projectName);

        if (result.success && result.filePath) {
          console.log("プロジェクトがローカルファイルに保存されました。", result.filePath);

          set({ localFilePath: result.filePath });

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
        } else if (result.error) {
          console.error('ローカルファイル保存エラー:', result.error);

          if (currentPath) {
            console.warn("既存パスへの保存に失敗しました。パスをリセットします。");
            set({ localFilePath: null });
            set({ error: "保存に失敗しました。もう一度保存してください。", isLoading: false });
            return false;
          }

          set({ error: "ファイルの保存に失敗しました。", isLoading: false });
          return false;
        } else {
          console.log("プロジェクトの保存がキャンセルされました。");
          set({ isLoading: false });
          return false;
        }
      } catch (err: any) {
        console.error('ローカルファイル保存エラー:', err);
        set({ error: "ファイルの保存に失敗しました。", isLoading: false });
        throw err;
      }
    }

    // 2. Web (Supabase) の場合
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

  // --- 別名で保存 ---
  saveProjectAs: async () => {
    const { currentProjectId, projectMeta } = get();
    if (!currentProjectId || !window.electronAPI) return false;

    set({ isLoading: true, error: null });
    const pageState = usePageStore.getState();
    const projectDataToSave: ProjectData = {
      projectName: projectMeta?.name || "無題",
      pages: pageState.pages,
      pageOrder: pageState.pageOrder,
      variables: {},
      cloud_id: projectMeta?.cloud_id
    };

    try {
      const jsonString = JSON.stringify(projectDataToSave, null, 2);
      // undefined を渡して強制的にダイアログを開く
      const projectName = projectMeta?.name || "無題";
      const result = await window.electronAPI.saveProjectFile(jsonString, undefined, projectName);

      if (result.success && result.filePath) {
        set({
          localFilePath: result.filePath,
          isLoading: false
        });
        useToastStore.getState().addToast("名前を付けて保存しました", "success");
        return true;
      }
      set({ isLoading: false });
      return false;
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
      return false;
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

    // 1. Electronアプリの場合
    if (window.electronAPI) {
      console.log('Local Publish: Just saving with is_published=true');
      if (projectMeta) {
        set({
          projectMeta: { ...projectMeta, is_published: true }
        });
      }

      const saved = await get().saveProject();
      set({ isLoading: false });

      // saveProject内でトーストが出るのでここでは不要かもしれないが、
      // 明示的に「公開」のメッセージを出したい場合は追加する（重複に注意）
      // ここでは saveProject の成功トーストに任せるか、別途出すか。
      // saveProjectが成功したら "プロジェクトを保存しました" が出る。
      // "公開しました" も出したいが2つ重なる。
      // 一旦 saveProject に任せるが、UX的には「公開しました」が良い。
      // ここでは追加のトーストを出さない。

      return saved;
    }

    // 2. Web (Supabase) の場合
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

    // 1. Electronアプリの場合
    if (window.electronAPI) {
      if (projectMeta) {
        set({
          projectMeta: { ...projectMeta, is_published: false },
          isLoading: false
        });
      }
      useToastStore.getState().addToast("プロジェクトを非公開にしました", "info");
      return true;
    }

    // 2. Web (Supabase) の場合
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
      localFilePath: null,
    });
    usePageStore.getState().loadFromData(initialProjectData);
  }
}));