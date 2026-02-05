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
      nodes: [],
      edges: [],
      placedItems: [],
      allItemLogics: {},
      comments: []
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
  publishProject: (force?: boolean) => Promise<ValidationResult | boolean>;
  unpublishProject: () => Promise<boolean>;
  updateProjectName: (name: string) => void;
  updateTheme: (theme: ThemeConfig) => void;
  duplicateProject: (projectId: string) => Promise<string | null>;
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
      const initialData = { ...initialProjectData, projectName: name, version: 1 };
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      const { data, error } = await supabase
        .from('projects')
        .insert({
          name,
          data: initialData,
          user_id: userId // 所有者を明示的に設定
        })
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
      version: 1, // ★追加: 常にバージョン1として保存
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
  publishProject: async (force = false): Promise<ValidationResult | boolean> => {
    const { currentProjectId, projectMeta } = get();
    if (!currentProjectId) return false;

    set({ isLoading: true, error: null });

    const pageState = usePageStore.getState();
    const dataToPublish: ProjectData = {
      projectName: projectMeta?.name || "無題",
      pages: pageState.pages,
      pageOrder: pageState.pageOrder,
      variables: {},
      cloud_id: projectMeta?.cloud_id,
      theme: projectMeta?.data?.theme,
    };

    // forceがfalseの場合はバリデーションを実行
    if (!force) {
      const validationResult = ValidationService.validate(dataToPublish);

      //警告がある場合は、結果を返す（公開をブロックしないが、UIで確認を求める）
      if (validationResult.warnings.length > 0) {
        console.warn('Validation warnings:', validationResult.warnings);
        set({ isLoading: false });
        return validationResult;
      }
    }


    // Supabaseで公開
    try {
      const minifiedData = DataMinifier.minifyForPublish(dataToPublish);

      const { error } = await supabase
        .from('projects')
        .update({
          published_content: minifiedData,
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
  },

  // --- プロジェクト複製 ---
  duplicateProject: async (projectId: string) => {
    set({ isLoading: true, error: null });
    try {
      // 1. 元のプロジェクトを取得
      const { data: originalProject, error: fetchError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (fetchError) throw fetchError;
      if (!originalProject) throw new Error('プロジェクトが見つかりません');

      // 2. ユーザー情報を取得
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      // 3. 全プロジェクトを取得して重複しない名前を生成
      const { data: allProjects } = await supabase
        .from('projects')
        .select('name')
        .eq('user_id', userId);

      // 4. ベース名を抽出（末尾の数字を除去）
      const baseName = originalProject.name.replace(/\d+$/, '');

      // 5. 既存の連番を検索
      const existingNumbers: number[] = [];
      allProjects?.forEach(p => {
        const match = p.name.match(new RegExp(`^${baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\d+)$`));
        if (match) {
          existingNumbers.push(parseInt(match[1], 10));
        }
      });

      // 6. 次に利用可能な番号を決定
      let nextNumber = 1;
      while (existingNumbers.includes(nextNumber)) {
        nextNumber++;
      }

      const newName = `${baseName}${nextNumber}`;

      // 7. プロジェクトデータをコピー（公開関連情報は除外）
      const newProjectData = {
        ...originalProject.data,
        projectName: newName
      };

      // 8. 新しいプロジェクトを作成
      const { data, error } = await supabase
        .from('projects')
        .insert({
          name: newName,
          data: newProjectData,
          user_id: userId,
          // cloud_id, is_published, published_dataは新規プロジェクトなので含めない
        })
        .select()
        .single();

      if (error) throw error;

      set({ isLoading: false });
      useToastStore.getState().addToast(`プロジェクト「${newName}」を作成しました`, "success");
      return data.id;

    } catch (err: any) {
      console.error('複製エラー:', err);
      set({ error: err.message, isLoading: false });
      useToastStore.getState().addToast("プロジェクトの複製に失敗しました", "error");
      return null;
    }
  }
}));