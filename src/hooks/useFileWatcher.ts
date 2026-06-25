import { useEffect, useRef } from 'react';
import { listen } from '@tauri-apps/api/event';
import { useFileStore } from '../stores/fileStore';

/**
 * 监听 Rust 端文件变更事件，自动刷新当前目录
 */
export function useFileWatcher() {
  const refresh = useFileStore((s) => s.refresh);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unlisten = listen('watcher-event', () => {
      // debounce: 500ms 内多次事件只刷新一次
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        refresh();
      }, 500);
    });

    return () => {
      unlisten.then((fn) => fn());
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [refresh]);
}
