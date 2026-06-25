import { useCallback } from 'react';
import { usePluginStore } from '../../plugins/pluginStore';
import { useUiStore } from '../../stores/uiStore';
import { getAllPlugins } from '../../plugins/registry';
import {
  FolderOpen, Terminal, ScrollText, ListChecks, Eye,
  GitCompare, FileText, GitBranch, Paintbrush,
} from 'lucide-react';
import type { ElementType } from 'react';
import './ActivityBar.css';

const ICON_MAP: Record<string, ElementType> = {
  'file-explorer': FolderOpen,
  'terminal': Terminal,
  'output': ScrollText,
  'tasks': ListChecks,
  'preview': Eye,
  'diff-viewer': GitCompare,
  'markdown-preview': FileText,
  'git-status': GitBranch,
  'theme-manager': Paintbrush,
};

export default function ActivityBar() {
  const visible = usePluginStore((s) => s.visible);
  const togglePlugin = usePluginStore((s) => s.togglePlugin);
  const showActivityBar = useUiStore((s) => s.showActivityBar);
  const toggleActivityBar = useUiStore((s) => s.toggleActivityBar);

  const plugins = getAllPlugins();

  const handleToggle = useCallback((id: string) => {
    togglePlugin(id);
  }, [togglePlugin]);

  if (!showActivityBar) return null;

  return (
    <div className="activity-bar">
      <div className="activity-bar__items">
        {plugins.map((p) => {
          const Icon = ICON_MAP[p.id];
          const isActive = visible[p.id];
          return (
            <button
              key={p.id}
              className={`activity-bar__item ${isActive ? 'activity-bar__item--active' : ''}`}
              onClick={() => handleToggle(p.id)}
              title={`${p.title} (${p.position})`}
            >
              {Icon ? <Icon size={16} /> : null}
              <span className="activity-bar__label">{p.title}</span>
            </button>
          );
        })}
      </div>
      <button
        className="activity-bar__toggle"
        onClick={toggleActivityBar}
        title="Hide activity bar"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
    </div>
  );
}
