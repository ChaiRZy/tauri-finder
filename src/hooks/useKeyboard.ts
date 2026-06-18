import { useEffect } from 'react';
import { useFileStore } from '../stores/fileStore';
import { useUiStore } from '../stores/uiStore';
import { useFileSystem } from './useFileSystem';

export function useKeyboard() {
  const { goUp, currentDir, entries } = useFileStore();
  const { selectedPaths, toggleSelection, clearSelection, selectAll, setClipboard, openDialog, togglePreview } = useUiStore();
  const { deleteItem, copyItems, moveItems } = useFileSystem();

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      const ctrl = e.ctrlKey || e.metaKey;

      // Navigation
      if (e.key === 'Backspace' && !ctrl) {
        e.preventDefault();
        goUp();
        return;
      }

      // Arrow navigation
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const paths = entries.map(e => e.path);
        const selArr = Array.from(selectedPaths);
        let idx = selArr.length > 0 ? paths.indexOf(selArr[selArr.length - 1]) : -1;
        idx = e.key === 'ArrowDown' ? Math.min(idx + 1, paths.length - 1) : Math.max(idx - 1, 0);
        if (paths[idx]) {
          clearSelection();
          toggleSelection(paths[idx]);
          const el = document.querySelector(`[data-path="${paths[idx]}"]`);
          el?.scrollIntoView({ block: 'nearest' });
        }
        return;
      }

      // Enter - open selected
      if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedPaths.size === 1) {
          const path = Array.from(selectedPaths)[0];
          const entry = entries.find(e => e.path === path);
          if (entry?.is_dir) {
            useFileStore.getState().navigateTo(path);
          }
        }
        return;
      }

      // Select all
      if (ctrl && e.key === 'a') {
        e.preventDefault();
        selectAll(entries);
        return;
      }

      // Copy
      if (ctrl && e.key === 'c') {
        if (selectedPaths.size > 0) {
          setClipboard('copy', Array.from(selectedPaths));
        }
        return;
      }

      // Cut
      if (ctrl && e.key === 'x') {
        if (selectedPaths.size > 0) {
          setClipboard('cut', Array.from(selectedPaths));
        }
        return;
      }

      // Paste
      if (ctrl && e.key === 'v') {
        const clip = useUiStore.getState().clipboard;
        if (clip.mode && clip.sources.length > 0) {
          if (clip.mode === 'copy') {
            await copyItems(clip.sources);
          } else {
            await moveItems(clip.sources);
          }
          clearSelection();
          useUiStore.getState().clearClipboard();
        }
        return;
      }

      // Delete
      if (e.key === 'Delete') {
        if (selectedPaths.size > 0) {
          for (const path of Array.from(selectedPaths)) {
            await deleteItem(path);
          }
          clearSelection();
        }
        return;
      }

      // F2 - Rename
      if (e.key === 'F2') {
        if (selectedPaths.size === 1) {
          const path = Array.from(selectedPaths)[0];
          const entry = entries.find(e => e.path === path);
          if (entry) {
            openDialog({ type: 'rename', entry, parentPath: currentDir });
          }
        }
        return;
      }

      // Ctrl+N - New folder
      if (ctrl && e.key === 'n') {
        e.preventDefault();
        openDialog({ type: 'create', parentPath: currentDir });
        return;
      }

      // Ctrl+F - Focus search
      if (ctrl && e.key === 'f') {
        e.preventDefault();
        const input = document.querySelector<HTMLInputElement>('[data-search-input]');
        input?.focus();
        return;
      }

      // Ctrl+P - Toggle preview
      if (ctrl && e.key === 'p') {
        e.preventDefault();
        togglePreview();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [entries, selectedPaths, currentDir]);
}
