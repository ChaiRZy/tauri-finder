import { useEffect, useCallback } from 'react';
import { useUiStore } from '../stores/uiStore';

export function useContextMenu() {
  const hideContextMenu = useUiStore((s) => s.hideContextMenu);

  const handleClick = useCallback(() => {
    hideContextMenu();
  }, [hideContextMenu]);

  useEffect(() => {
    window.addEventListener('click', handleClick);
    window.addEventListener('scroll', handleClick, true);
    return () => {
      window.removeEventListener('click', handleClick);
      window.removeEventListener('scroll', handleClick, true);
    };
  }, [handleClick]);
}
