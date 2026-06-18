/// Represents a file or directory entry from the Rust backend.
export interface FileEntry {
  name: string;
  path: string;
  is_dir: boolean;
  size: number;
  modified_at: string;
  created_at: string;
  is_symlink: boolean;
  extension: string;
  mime_type: string;
}

export type ViewMode = 'list' | 'grid' | 'columns';

/** Context menu item identifiers for customizable right-click menu. */
export type ContextMenuItemId =
  | 'rename'
  | 'copy'
  | 'cut'
  | 'delete'
  | 'getInfo'
  | 'newFolder'
  | 'paste';

export interface ContextMenuConfig {
  items: Record<ContextMenuItemId, boolean>;
}

export type ShellType = 'cmd' | 'powershell' | 'gitbash';

export interface QuickCommand {
  id: string;
  name: string;
  command: string;
  mode: 'current' | 'fixed';
  fixedPath?: string;
}

export const DEFAULT_SHELL: ShellType = 'cmd';

export const DEFAULT_CONTEXT_MENU_CONFIG: ContextMenuConfig = {
  items: {
    rename: true,
    copy: true,
    cut: true,
    delete: true,
    getInfo: true,
    newFolder: true,
    paste: true,
  },
};
export type SortBy = 'name' | 'size' | 'modified_at';
export type SortOrder = 'asc' | 'desc';
export type ClipMode = 'copy' | 'cut';

export interface ClipboardState {
  mode: ClipMode | null;
  sources: string[];
}

export interface ContextMenuState {
  x: number;
  y: number;
  entries: FileEntry[];
}

export type DialogType = 'create' | 'rename' | 'properties' | 'contextMenuSettings' | 'quickCommand' | 'tagManager' | null;

export interface DialogState {
  type: DialogType;
  entry?: FileEntry;
  parentPath?: string;
}

/* ── Tag System ── */

export type DisplayMode = 'flat' | 'merge' | 'tree' | 'group' | 'icon';

export interface TagDefinition {
  id: string;
  name: string;
  color: string;
  displayMode: DisplayMode;
}

export type FolderTags = Record<string, string[]>; // folder path → tag ids

export const DEFAULT_TAGS: TagDefinition[] = [
  { id: 'project', name: 'Project', color: '#4A90D9', displayMode: 'merge' },
  { id: 'important', name: 'Important', color: '#e5534b', displayMode: 'flat' },
  { id: 'archive', name: 'Archive', color: '#6e7681', displayMode: 'flat' },
  { id: 'work', name: 'Work', color: '#3fb950', displayMode: 'merge' },
  { id: 'personal', name: 'Personal', color: '#bc8cff', displayMode: 'flat' },
];

/* ── Terminal ── */

export interface TerminalTab {
  id: string;
  shellType: ShellType;
}
