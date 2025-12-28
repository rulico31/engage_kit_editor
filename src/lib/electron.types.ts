// ElectronAPI Type Definitions
// This file provides type definitions for the Electron preload API

/**
 * ElectronAPI interface
 * Note: This is a reference type definition only.
 * The actual Window.electronAPI type is defined in electron/preload.ts
 */
export interface ElectronAPI {
    /**
     * Open a project file dialog and return the file contents
     */
    openProjectFile(): Promise<{
        success: boolean;
        data?: string;
        filePath?: string;
        error?: string;
    } | null>;

    /**
     * Save project file to disk
     */
    saveProjectFile(
        content: string,
        filePath?: string,
        projectName?: string
    ): Promise<{
        success: boolean;
        filePath?: string;
        error?: string;
    }>;

    /**
     * Select an image file
     */
    selectImageFile(): Promise<string | null>;
}
