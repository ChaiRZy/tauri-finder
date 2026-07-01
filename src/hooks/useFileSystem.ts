import { useCallback } from 'react';
import { typedInvoke } from '../utils/invoke';
import { useFileStore } from '../stores/fileStore';
import { useUiStore } from '../stores/uiStore';
import type { FileEntry } from '../types/file';

export function useFileSystem() {
  const navigateTo = useFileStore((s) => s.navigateTo);
  const refresh = useFileStore((s) => s.refresh);
  const currentDir = useFileStore((s) => s.currentDir);
  const clearSelection = useUiStore((s) => s.clearSelection);
  const clearClipboard = useUiStore((s) => s.clearClipboard);

  const createDirectory = useCallback(async (name: string) => {
    if (!currentDir) return;
    const path = `${currentDir.replace(/\/$/,'')}/${name}`;
    await typedInvoke.createDirectory(path);
    await refresh();
  }, [currentDir, refresh]);

  const renameItem = useCallback(async (oldPath: string, newName: string) => {
    const parts = oldPath.replace(/\\/g, '/').split('/');
    parts.pop();
    const newPath = [...parts, newName].join('/');
    await typedInvoke.renameItem(oldPath, newPath);
    await refresh();
  }, [refresh]);

  const deleteItem = useCallback(async (path: string) => {
    await typedInvoke.deleteItem(path);
    await refresh();
  }, [refresh]);

  const copyItems = useCallback(async (sources: string[], destination?: string) => {
    const dst = destination || currentDir;
    if (!dst) return;
    await typedInvoke.copyItems(sources, dst);
    await refresh();
  }, [currentDir, refresh]);

  const moveItems = useCallback(async (sources: string[], destination?: string) => {
    const dst = destination || currentDir;
    if (!dst) return;
    await typedInvoke.moveItems(sources, dst);
    await refresh();
  }, [currentDir, refresh]);

  const readText = useCallback(async (path: string): Promise<string> => {
    const { readTextFile } = await import('@tauri-apps/plugin-fs');
    return await readTextFile(path);
  }, []);

  const searchFiles = useCallback(async (query: string): Promise<FileEntry[]> => {
    if (!currentDir) return [];
    return await typedInvoke.searchFiles(query, currentDir);
  }, [currentDir]);

  return {
    createDirectory,
    renameItem,
    deleteItem,
    copyItems,
    moveItems,
    readTextFile: readText,
    searchFiles,
    navigateTo,
    refresh,
    clearSelection,
    clearClipboard,
  };
}
