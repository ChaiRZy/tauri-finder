import { useEffect, useState } from 'react';
import { typedInvoke } from '../utils/invoke';
import type { GitFileStatus as TauriGitFileStatus } from '../bindings';

export type GitFileStatus = TauriGitFileStatus;

export interface GitStatusMap {
  [relativePath: string]: GitFileStatus;
}

export function useGitStatus(currentDir: string): {
  gitStatus: GitStatusMap;
  isRepo: boolean;
  branch: string | null;
  loading: boolean;
} {
  const [gitStatus, setGitStatus] = useState<GitStatusMap>({});
  const [isRepo, setIsRepo] = useState(false);
  const [branch, setBranch] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentDir) {
      setGitStatus({});
      setIsRepo(false);
      setBranch(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const list: GitFileStatus[] = await typedInvoke.getGitStatus(currentDir);
        if (cancelled) return;
        const map: GitStatusMap = {};
        for (const item of list) {
          map[item.path] = item;
        }
        setGitStatus(map);
        setIsRepo(true);
      } catch {
        if (!cancelled) {
          setGitStatus({});
          setIsRepo(false);
          setBranch(null);
        }
      }
      if (!cancelled) setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [currentDir]);

  return { gitStatus, isRepo, branch, loading };
}
