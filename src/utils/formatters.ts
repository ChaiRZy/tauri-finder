import type { FileEntry } from '../types/file';

/// Format file size from bytes to human-readable string.
export function formatSize(bytes: number): string {
  if (bytes === 0) return '--';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0);
  return `${size} ${units[i]}`;
}

/// Format ISO date string to localized date-time.
export function formatDate(isoString: string): string {
  if (!isoString) return '--';
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

/// Extract file extension from a path.
export function getExtension(path: string): string {
  const i = path.lastIndexOf('.');
  return i > 0 ? path.slice(i + 1).toLowerCase() : '';
}

/// Check if a file extension is an image type.
export function isImageExtension(ext: string): boolean {
  return ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp', 'ico'].includes(ext.toLowerCase());
}

/// Check if a file extension is a text type.
export function isTextExtension(ext: string): boolean {
  return ['txt', 'md', 'json', 'js', 'ts', 'jsx', 'tsx', 'css', 'html', 'xml', 'yaml', 'yml', 'toml', 'ini', 'cfg', 'log', 'sh', 'bat', 'ps1', 'env', 'gitignore'].includes(ext.toLowerCase());
}

/// Get a human-readable file type description.
export function getFileType(entry: { is_dir: boolean; extension: string; mime_type: string }): string {
  if (entry.is_dir) return 'Folder';
  const mime = entry.mime_type;
  if (mime.startsWith('image/')) return 'Image';
  if (mime.startsWith('video/')) return 'Video';
  if (mime.startsWith('audio/')) return 'Audio';
  if (mime.startsWith('text/')) return 'Text Document';
  if (entry.extension) return `${entry.extension.toUpperCase()} File`;
  return 'File';
}

/// Get a group label for an entry.
export function getFileGroup(entry: { is_dir: boolean; mime_type: string; extension: string }): string {
  if (entry.is_dir) return 'Folders';
  const mime = entry.mime_type;
  if (mime.startsWith('image/')) return 'Images';
  if (mime.startsWith('video/')) return 'Videos';
  if (mime.startsWith('audio/')) return 'Audio';
  if (mime.startsWith('text/')) return 'Documents';
  if (['pdf'].includes(entry.extension.toLowerCase())) return 'Documents';
  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(entry.extension.toLowerCase())) return 'Archives';
  if (['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'rs', 'go', 'c', 'cpp', 'h', 'css', 'html', 'json', 'xml', 'yaml', 'toml', 'sh', 'bat'].includes(entry.extension.toLowerCase())) return 'Code';
  if (['exe', 'dll', 'msi'].includes(entry.extension.toLowerCase())) return 'Executables';
  return 'Other';
}

/// Group entries by their type group.
export function groupEntries(entries: FileEntry[]): Map<string, FileEntry[]> {
  const groups = new Map<string, FileEntry[]>();
  for (const e of entries) {
    const key = getFileGroup(e);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(e);
  }
  return groups;
}
