import { useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
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
    await invoke('create_directory', { path });
    await refresh();
  }, [currentDir, refresh]);

  const renameItem = useCallback(async (oldPath: string, newName: string) => {
    const parts = oldPath.replace(/\\/g, '/').split('/');
    parts.pop();
    const newPath = [...parts, newName].join('/');
    await invoke('rename_item', { oldPath, newPath });
    await refresh();
  }, [refresh]);

  const deleteItem = useCallback(async (path: string) => {
    await invoke('delete_item', { path });
    await refresh();
  }, [refresh]);

  const copyItems = useCallback(async (sources: string[], destination?: string) => {
    const dst = destination || currentDir;
    if (!dst) return;
    await invoke('copy_items', { sources, destination: dst });
    await refresh();
  }, [currentDir, refresh]);

  const moveItems = useCallback(async (sources: string[], destination?: string) => {
    const dst = destination || currentDir;
    if (!dst) return;
    await invoke('move_items', { sources, destination: dst });
    await refresh();
  }, [currentDir, refresh]);

  const readTextFile = useCallback(async (path: string): Promise<string> => {
    return await invoke('read_text_file', { path });
  }, []);

  const searchFiles = useCallback(async (query: string): Promise<FileEntry[]> => {
    if (!currentDir) return [];
    return await invoke('search_files', { query, basePath: currentDir });
  }, [currentDir]);

  return {
    createDirectory,
    renameItem,
    deleteItem,
    copyItems,
    moveItems,
    readTextFile,
    searchFiles,
    navigateTo,
    refresh,
    clearSelection,
    clearClipboard,
  };
}
