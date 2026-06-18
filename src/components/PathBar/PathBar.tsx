import { useFileStore } from '../../stores/fileStore';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import './PathBar.css';

export default function PathBar() {
  const currentDir = useFileStore((s) => s.currentDir);
  const navigateTo = useFileStore((s) => s.navigateTo);
  const goBack = useFileStore((s) => s.goBack);
  const goForward = useFileStore((s) => s.goForward);
  const goUp = useFileStore((s) => s.goUp);
  const historyIndex = useFileStore((s) => s.historyIndex);
  const history = useFileStore((s) => s.history);

  if (!currentDir) return null;

  const segments = currentDir.replace(/\\/g, '/').split('/').filter(Boolean);

  return (
    <div className="pathbar">
      <div className="pathbar-nav">
        <button className="pathbar-btn" onClick={goBack} disabled={historyIndex <= 0} title="Back">
          <ChevronLeft size={16} />
        </button>
        <button className="pathbar-btn" onClick={goForward} disabled={historyIndex >= history.length - 1} title="Forward">
          <ChevronRight size={16} />
        </button>
        <button className="pathbar-btn" onClick={goUp} title="Go up">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 3L3 8h3v5h4V8h3L8 3z" fill="currentColor" />
          </svg>
        </button>
      </div>
      <div className="pathbar-breadcrumbs">
        {segments.map((seg, i) => {
          const path = segments.slice(0, i + 1).join('/');
          const fullPath = currentDir.startsWith('/') ? '/' + path : path;
          return (
            <span key={fullPath} className="breadcrumb-segment">
              {i > 0 && <ChevronRight size={12} className="breadcrumb-sep" />}
              <span
                className={`breadcrumb-link ${i === segments.length - 1 ? 'active' : ''}`}
                onClick={() => navigateTo(fullPath)}
              >
                {seg}
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
