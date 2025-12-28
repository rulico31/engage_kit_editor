import { create } from 'zustand';

export type LogLevel = 'info' | 'success' | 'error' | 'warning';

export interface DebugLogEntry {
    id: string;
    timestamp: Date;
    level: LogLevel;
    message: string;
    details?: any;
}

interface DebugLogStore {
    logs: DebugLogEntry[];
    addLog: (log: Omit<DebugLogEntry, 'id' | 'timestamp'>) => void;
    clearLogs: () => void;
}

const MAX_LOGS = 100;

export const useDebugLogStore = create<DebugLogStore>((set) => ({
    logs: [],

    addLog: (log) => set((state) => {
        const newLog: DebugLogEntry = {
            ...log,
            id: `${Date.now()}-${Math.random()}`,
            timestamp: new Date(),
        };

        const newLogs = [...state.logs, newLog];

        // 最大ログ数を超えたら古いものを削除
        if (newLogs.length > MAX_LOGS) {
            newLogs.shift();
        }

        return { logs: newLogs };
    }),

    clearLogs: () => set({ logs: [] }),
}));
