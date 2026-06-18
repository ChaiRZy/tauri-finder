import { invoke } from '@tauri-apps/api/core';
import type { FileEntry } from '../types/file';

/// File size formatting unit thresholds.
export const SIZE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB'] as const;

/// Default excluded directories when searching.
export const EXCLUDED_DIRS = ['node_modules', '.git', '.svn', 'target'];

/// Sort column definitions.
export const SORT_COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'size', label: 'Size' },
  { key: 'modified_at', label: 'Date Modified' },
] as const;

/// Known system path names.
export const SYSTEM_DIR_NAMES = ['Desktop', 'Downloads', 'Documents', 'Pictures', 'Music', 'Videos'] as const;

/// Icon color map for file extensions.
export const EXT_ICON_COLORS: Record<string, string> = {
  folder: '#4A90D9',
  image: '#50C878',
  video: '#E74C3C',
  audio: '#9B59B6',
  pdf: '#E74C3C',
  zip: '#F39C12',
  exe: '#3498DB',
  code: '#2ECC71',
  text: '#95A5A6',
  default: '#7F8C8D',
};

/// Get the home directory from the Rust backend.
export async function getHomeDir(): Promise<string> {
  return await invoke('get_home_dir');
}

/// Get system directories from the Rust backend.
export async function getSystemDirs(): Promise<FileEntry[]> {
  return await invoke('get_system_dirs');
}

/// Get drive list from the Rust backend.
export async function getDrives(): Promise<string[]> {
  return await invoke('get_drives');
}
