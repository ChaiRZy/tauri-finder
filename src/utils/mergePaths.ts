import type { FileEntry } from '../types/file';

/**
 * IntelliJ-style compact middle packages.
 * Given a list of entries in a "project" directory, merge chains of
 * single-child intermediate directories into a single combined node.
 *
 * Example:
 *   src/main/java/com/example/app/
 *   ├── MyClass.java
 *   └── controller/
 *       └── HomeController.java
 *
 * If each intermediate directory has exactly ONE subdirectory and no files,
 * they get merged into a single row showing the full relative path.
 */

export interface MergedEntry {
  name: string;          // display name (could be merged path)
  isMerged: boolean;     // true if this is a merged directory chain
  mergedPath: string;    // the full merged path
  children: FileEntry[]; // actual entries inside the merged directory
  originalEntries: FileEntry[]; // original directory entries (flat)
}

/**
 * Analyze a directory listing for a tagged folder (especially "project" tag)
 * and return a processed list where single-child directory chains are merged.
 */
export function applyMergeView(entries: FileEntry[], basePath: string): (FileEntry | MergedEntry)[] {
  const dirs = entries.filter(e => e.is_dir);
  const files = entries.filter(e => !e.is_dir);
  const result: (FileEntry | MergedEntry)[] = [...files];

  for (const dir of dirs) {
    const merged = followSingleChildChain(dir, basePath);
    if (merged.children.length > 0) {
      result.push({
        name: merged.displayPath,
        isMerged: merged.isChain,
        mergedPath: merged.fullPath,
        children: merged.children,
        originalEntries: merged.originalEntries,
      });
    } else {
      // fallback: keep original dir entry
      result.push(dir);
    }
  }

  return result;
}

interface ChainResult {
  displayPath: string;
  fullPath: string;
  isChain: boolean;
  children: FileEntry[];
  originalEntries: FileEntry[];
}

function followSingleChildChain(dirEntry: FileEntry, _basePath: string): ChainResult {
  const parts: string[] = [dirEntry.name];
  let currentPath = dirEntry.path;
  let lastEntries: FileEntry[] | null = null;
  let maxDepth = 20; // prevent infinite loops

  while (maxDepth-- > 0) {
    const { listDir } = getListDir();
      const sub = listDir(currentPath);
      if (!sub) break;

    const subDirs = sub.filter(e => e.is_dir);
    const subFiles = sub.filter(e => !e.is_dir);

    if (subDirs.length === 1 && subFiles.length === 0) {
      // single child, continue chain
      parts.push(subDirs[0].name);
      currentPath = subDirs[0].path;
      lastEntries = null;
    } else {
      // can't go further: either multiple dirs, has files, or no dirs
      lastEntries = sub;
      break;
    }
  }

  if (!lastEntries) {
    // reached leaf with no entries
    return {
      displayPath: parts.join('/'),
      fullPath: currentPath,
      isChain: parts.length > 1,
      children: [],
      originalEntries: [],
    };
  }

  return {
    displayPath: parts.join('/'),
    fullPath: currentPath,
    isChain: parts.length > 1,
    children: lastEntries.filter(e => !e.is_dir),
    originalEntries: lastEntries,
  };
}

/**
 * Hook for synchronous in-memory directory listing.
 * Set by fileStore when entries are loaded.
 */
let _listDirFn: ((path: string) => FileEntry[]) | null = null;

export function setListDirFn(fn: (path: string) => FileEntry[]) {
  _listDirFn = fn;
}

function getListDir(): { listDir: (path: string) => FileEntry[] | null } {
  return {
    listDir: (path: string) => {
      if (_listDirFn) return _listDirFn(path);
      return [];
    },
  };
}
