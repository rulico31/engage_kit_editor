// src/stores/useProjectStore.ts

import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';
import type { ProjectData, SavedProject } from '../types';
import { usePageStore } from './usePageStore';
import { ValidationService } from '../lib/ValidationService';
import type { ValidationResult } from '../lib/ValidationService';
import { DataMinifier } from '../lib/DataMinifier';
import type { ThemeConfig } from '../types';

// =========================================================
// ★ 修正 1: Electron APIの型定義の参照
// global.d.tsで定義されていることを想定していますが、ストア内でも安全のために宣言します。
declare const window: Window & {
  electronAPI?: {
    saveProjectFile: (data: string) => Promise<boolean>;
    openProjectFile: () => Promise<string | null>;
  };
};
// =========================================================

// ★ 修正 2: ローカルプロジェクト用のID生成ヘルパー (ローカルプロジェクトであることを識別するためのプレフィックス)
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

  // Actions
  createProject: (name: string) => Promise<string | null>;
  // projectIdをオプションにして、未指定ならローカルファイルオープンダイアログを起動
  loadProject: (projectId?: string) => Promise<void>;
  saveProject: () => Promise<boolean>;
  resetProject: () => void;
  // ★追加: クラウドIDを更新するアクション（Publish完了時に呼ぶ）
  updateCloudId: (cloudId: string) => void;
  // ★追加: プロジェクトの公開アクション
  publishProject: () => Promise<ValidationResult | boolean>;
  // ★追加: プロジェクトの非公開化アクション
  unpublishProject: () => Promise<boolean>;
  // ★追加: プロジェクト名の更新アクション
  updateProjectName: (name: string) => void;
}

export const useProjectStore = create<ProjectStoreState>((set, get) => ({
  currentProjectId: null,
  projectMeta: null,
  isLoading: false,
  error: null,

  // --- プロジェクト作成 ---
  createProject: async (name: string) => {
    // 1. Electronアプリの場合: ローカルIDで初期化
    if (window.electronAPI) {
      const newProjectId = generateLocalId();

      // 新規プロジェクト用のデータを作成
      const newProjectData: ProjectData = { ...initialProjectData, projectName: name };

      // PageStoreを初期化（新規プロジェクトの状態にする）
      usePageStore.getState().loadFromData(newProjectData);

      // メタデータを設定
      set({
        currentProjectId: newProjectId,
        projectMeta: {
          id: newProjectId,
          name: name,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_published: false,
          user_id: 'local_user', // ダミーID
          data: newProjectData
        } as SavedProject,
        isLoading: false,
        error: null,
      });
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
      return data.id;

    } catch (err: any) {
      console.error(err);
      set({ error: err.message, isLoading: false });
      return null;
    }
  },


  // --- プロジェクト読み込み ---
  loadProject: async (projectId?: string) => {

    // 1. Electronアプリの場合: ローカルファイルを開くダイアログを表示 (projectIdが指定されていない場合)
    if (window.electronAPI && !projectId) {
      set({ isLoading: true, error: null });
      try {
        // IPCを通じてファイルを開くダイアログを起動し、内容を取得
        const jsonString = await window.electronAPI.openProjectFile();

        if (!jsonString) {
          // キャンセルされた
          set({ isLoading: false });
          return;
        }

        // ファイル内容をパース
        const loadedData = JSON.parse(jsonString) as ProjectData;

        // PageStoreにデータを反映
        usePageStore.getState().loadFromData(loadedData);

        // ローカルプロジェクトとしてストアの状態を更新
        const localId = generateLocalId(); // 読み込みごとに新しいローカルIDを生成

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
            cloud_id: loadedData.cloud_id // ★ローカルファイルからcloud_idを復元
          } as SavedProject,
          isLoading: false
        });
        return;

      } catch (err: any) {
        console.error('ローカルファイル読込エラー:', err);
        set({ error: "ファイルの読み込みに失敗しました。形式が正しくない可能性があります。", isLoading: false });
        return;
      }
    }

    // 2. FALLBACK: Web (Supabase) の既存ロジック (projectIdが指定された場合)
    if (!projectId) {
      // projectIdが指定されておらず、かつElectronでない場合は処理しない
      return;
    }

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
        projectMeta: data as SavedProject,
        isLoading: false
      });
    } catch (err: any) {
      console.error(err);
      set({ error: err.message, isLoading: false });
    }
  },

  // --- プロジェクト保存 ---
  saveProject: async () => {
    const { currentProjectId, projectMeta } = get();
    if (!currentProjectId) return false;

    set({ isLoading: true, error: null });

    // PageStoreから最新のデータを取得して保存用に整形
    const pageState = usePageStore.getState();

    const projectDataToSave: ProjectData = {
      projectName: projectMeta?.name || "無題",
      pages: pageState.pages,
      pageOrder: pageState.pageOrder,
      variables: {},
      cloud_id: projectMeta?.cloud_id // ★重要: クラウドIDもJSONに含めて保存する
    };

    // 1. Electronアプリの場合: ローカルIDプロジェクトをローカルファイルに保存
    if (window.electronAPI) {
      try {
        const jsonString = JSON.stringify(projectDataToSave, null, 2);
        // IPCを通じて保存ダイアログを起動し、ファイルを書き込む
        const success = await window.electronAPI.saveProjectFile(jsonString);

        if (success) {
          console.log("プロジェクトがローカルファイルに保存されました。cloud_id:", projectMeta?.cloud_id);
          // 保存成功後、プロジェクトの更新時刻を更新
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
          return true;
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


    // 2. FALLBACK: Web (Supabase) の既存ロジック
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          data: projectDataToSave,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentProjectId);

      if (error) throw error;

      // クラウド保存成功後、プロジェクトの更新時刻を更新
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
      return true;
    } catch (err: any) {
      console.error(err);
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  // --- ★追加: プロジェクト公開 ---
  publishProject: async (): Promise<ValidationResult | boolean> => {
    const { currentProjectId, projectMeta } = get();
    if (!currentProjectId) return false;

    set({ isLoading: true, error: null });

    // 現状の下書きデータ ("data") を取得
    // 注: saveProject() が直前に呼ばれている前提、またはここで明示的に最新をとる
    const pageState = usePageStore.getState();
    const dataToPublish: ProjectData = {
      projectName: projectMeta?.name || "無題",
      pages: pageState.pages,
      pageOrder: pageState.pageOrder,
      variables: {},
      cloud_id: projectMeta?.cloud_id
    };

    // ★ 検証: データの品質チェック
    const validationResult = ValidationService.validate(dataToPublish);

    // エラーがある場合は公開を中止
    if (!validationResult.isValid) {
      console.error('Validation failed:', validationResult);
      set({ isLoading: false });
      return validationResult; // 検証結果を返す
    }

    // 警告がある場合はログ出力（公開は続行）
    if (validationResult.warnings.length > 0) {
      console.warn('Validation warnings:', validationResult.warnings);
    }

    // 1. Electronアプリの場合 (ローカル)
    // ローカル環境での「公開」のセマンティクスは曖昧だが、ここでは
    // メタデータの is_published フラグを立てるのみとする (または外部へのアップロード処理などをここに記述)
    if (window.electronAPI) {
      // ローカルでは実質的な「公開」はないため、保存と同様の扱い + フラグ更新
      // 本来はここでデプロイ等の処理が入る
      console.log('Local Publish: Just saving with is_published=true');

      // 保存処理を呼んでファイルを更新 (メタデータも更新される)
      // ただしローカルファイルに is_published を持たせるかどうかは仕様次第 => SavedProject型にはある
      if (projectMeta) {
        set({
          projectMeta: { ...projectMeta, is_published: true }
        });
      }

      // まずは保存を実行
      const saved = await get().saveProject();
      set({ isLoading: false });
      return saved;
    }

    // 2. Web (Supabase) の場合
    try {
      // ★ 最適化: 公開用データをminify（エディタ専用プロパティを削除）
      const minifiedData = DataMinifier.minifyForPublish(dataToPublish);

      // transactions的な処理が望ましいが、Supabase単体ではRPC等が必要。
      // ここでは update で data を published_data にコピーする
      const { error } = await supabase
        .from('projects')
        .update({
          published_data: minifiedData, // 最適化されたデータを公開
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
            // メモリ上のメタデータに published_data を持たせるかは任意だが、
            // SavedProject型には通常 data があるのみ。
            // 必要なら拡張するが、ここではフラグ更新のみに留める
          },
          isLoading: false
        });
      }
      return true;

    } catch (err: any) {
      console.error('Publish error:', err);
      set({ error: err.message, isLoading: false });
      return false;
    }
  },

  // --- ★追加: プロジェクトの非公開化 ---
  unpublishProject: async (): Promise<boolean> => {
    const { currentProjectId, projectMeta } = get();
    if (!currentProjectId) return false;

    set({ isLoading: true, error: null });

    // 1. Electronアプリの場合 (ローカル)
    if (window.electronAPI) {
      // ローカルではメタデータのフラグのみ更新
      if (projectMeta) {
        set({
          projectMeta: { ...projectMeta, is_published: false },
          isLoading: false
        });
      }
      return true;
    }

    // 2. Web (Supabase) の場合
    try {
      // published_dataは保持したまま、is_publishedのみfalseにする
      // これにより再公開が高速に行える
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
      return true;

    } catch (err: any) {
      console.error('Unpublish error:', err);
      set({ error: err.message, isLoading: false });
      return false;
    }
  },

  // --- ★追加: プロジェクト名の更新 ---
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

  // --- ★追加: テーマ更新 ---
  updateTheme: (theme) => {
    const pageState = usePageStore.getState();
    const currentData = {
      projectName: get().projectMeta?.name || "無題",
      pages: pageState.pages,
      pageOrder: pageState.pageOrder,
      variables: {},
      cloud_id: get().projectMeta?.cloud_id,
      theme: theme
    };

    // PageStoreに反映
    usePageStore.getState().loadFromData(currentData);
  },

  // --- ★追加: クラウドIDの更新 ---
  updateCloudId: (cloudId: string) => {
    const { projectMeta } = get();
    if (projectMeta) {
      set({
        projectMeta: {
          ...projectMeta,
          cloud_id: cloudId
        }
      });
      // 注意: この時点ではメモリ上の更新のみ。
      // ユーザーが次に「保存」を押したときに、このcloudIdがファイルに書き込まれます。
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