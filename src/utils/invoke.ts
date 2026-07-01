import { commands } from '../bindings';
import type { FileEntry, FileInfo, DiffLine, ContentMatch, GitFileStatus } from '../bindings';

async function unwrap<T>(promise: Promise<{ status: "ok"; data: T } | { status: "error"; error: string }>): Promise<T> {
  const res = await promise;
  if (res.status === 'ok') return res.data;
  throw new Error(res.error);
}

export const typedInvoke = {
  async listDirectory(path: string): Promise<FileEntry[]> {
    return unwrap(commands.listDirectory(path));
  },
  async getFileInfo(path: string): Promise<FileInfo> {
    return unwrap(commands.getFileInfo(path));
  },
  async createDirectory(path: string): Promise<FileEntry> {
    return unwrap(commands.createDirectory(path));
  },
  async renameItem(oldPath: string, newPath: string): Promise<FileEntry> {
    return unwrap(commands.renameItem(oldPath, newPath));
  },
  async deleteItem(path: string): Promise<null> {
    return unwrap(commands.deleteItem(path));
  },
  async copyItems(sources: string[], destination: string): Promise<FileEntry[]> {
    return unwrap(commands.copyItems(sources, destination));
  },
  async moveItems(sources: string[], destination: string): Promise<FileEntry[]> {
    return unwrap(commands.moveItems(sources, destination));
  },
  async diffFiles(pathA: string, pathB: string): Promise<DiffLine[]> {
    return unwrap(commands.diffFiles(pathA, pathB));
  },
  async searchFiles(query: string, basePath: string): Promise<FileEntry[]> {
    return unwrap(commands.searchFiles(query, basePath));
  },
  async searchContent(query: string, basePath: string): Promise<ContentMatch[]> {
    return unwrap(commands.searchContent(query, basePath));
  },
  async highlightFile(path: string): Promise<string | null> {
    return unwrap(commands.highlightFile(path));
  },
  async getSystemDirs(): Promise<FileEntry[]> {
    return unwrap(commands.getSystemDirs());
  },
  async getDrives(): Promise<string[]> {
    return unwrap(commands.getDrives());
  },
  async getHomeDir(): Promise<string> {
    return unwrap(commands.getHomeDir());
  },
  async getGitStatus(path: string): Promise<GitFileStatus[]> {
    return unwrap(commands.getGitStatus(path));
  },
  async aiAsk(prompt: string, currentDir: string): Promise<string> {
    return unwrap(commands.aiAsk(prompt, currentDir));
  },
};
