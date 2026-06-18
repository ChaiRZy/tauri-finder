import { create } from 'zustand';
import type { TagDefinition, FolderTags } from '../types/file';
import { DEFAULT_TAGS } from '../types/file';

const TAGS_KEY = 'finder-tag-definitions';
const FOLDER_TAGS_KEY = 'finder-folder-tags';

function loadTagDefs(): TagDefinition[] {
  try {
    const raw = localStorage.getItem(TAGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return JSON.parse(JSON.stringify(DEFAULT_TAGS));
}

function saveTagDefs(defs: TagDefinition[]) {
  localStorage.setItem(TAGS_KEY, JSON.stringify(defs));
}

function loadFolderTags(): FolderTags {
  try {
    const raw = localStorage.getItem(FOLDER_TAGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

function saveFolderTags(tags: FolderTags) {
  localStorage.setItem(FOLDER_TAGS_KEY, JSON.stringify(tags));
}

interface TagStore {
  tagDefs: TagDefinition[];
  folderTags: FolderTags;

  addTagDef: (def: TagDefinition) => void;
  updateTagDef: (id: string, patch: Partial<TagDefinition>) => void;
  removeTagDef: (id: string) => void;

  setTagsForFolder: (path: string, tagIds: string[]) => void;
  clearFolderTags: (path: string) => void;
}

export const useTagStore = create<TagStore>((set) => ({
  tagDefs: loadTagDefs(),
  folderTags: loadFolderTags(),

  addTagDef: (def) => set((state) => {
    const next = [...state.tagDefs, def];
    saveTagDefs(next);
    return { tagDefs: next };
  }),

  updateTagDef: (id, patch) => set((state) => {
    const next = state.tagDefs.map((d) => d.id === id ? { ...d, ...patch } : d);
    saveTagDefs(next);
    return { tagDefs: next };
  }),

  removeTagDef: (id) => set((state) => {
    const next = state.tagDefs.filter((d) => d.id !== id);
    // Also remove this tag from all folders
    const newFolderTags: FolderTags = {};
    for (const [p, ids] of Object.entries(state.folderTags)) {
      const filtered = ids.filter((tid) => tid !== id);
      if (filtered.length > 0) newFolderTags[p] = filtered;
    }
    saveTagDefs(next);
    saveFolderTags(newFolderTags);
    return { tagDefs: next, folderTags: newFolderTags };
  }),

  setTagsForFolder: (path, tagIds) => set((state) => {
    const next = { ...state.folderTags, [path]: tagIds };
    saveFolderTags(next);
    return { folderTags: next };
  }),

  clearFolderTags: (path) => set((state) => {
    const next = { ...state.folderTags };
    delete next[path];
    saveFolderTags(next);
    return { folderTags: next };
  }),
}));
