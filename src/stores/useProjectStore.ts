// src/stores/useProjectStore.ts

import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';
import type { ProjectData, SavedProject } from '../types';
import { usePageStore } from './usePageStore';

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