import { useState, useRef, useEffect } from 'react';
import { getAllPlugins } from '../../plugins/registry';
import { usePluginStore } from '../../plugins/pluginStore';

/**
 * 左下角插件启动器
 * - 固定定位在左下角的圆形按钮
 * - 点击弹出插件列表浮层
 * - 点击列表项切换对应插件的 visible 状态
 */
export default function PluginLauncher() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const visible = usePluginStore((s) => s.visible);
  const togglePlugin = usePluginStore((s) => s.togglePlugin);

  // 点击外部关闭
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const plugins = getAllPlugins();

  return (
    <div ref={containerRef} style={{ position: 'fixed', bottom: 16, left: 16, zIndex: 10000 }}>
      {/* 弹出列表 */}
      {open && (
        <div
          style={{
            position: 'absolute',
            bottom: 48,
            left: 0,
            background: 'var(--bg-secondary, #2d2d2d)',
            border: '1px solid var(--border-color, #444)',
            borderRadius: 8,
            padding: '8px 0',
            minWidth: 200,
            maxWidth: 320,
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
            maxHeight: 400,
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              padding: '6px 12px',
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--text-muted, #888)',
              textTransform: 'uppercase',
              letterSpacing: 1,
              borderBottom: '1px solid var(--border-color, #444)',
              marginBottom: 4,
            }}
          >
            插件列表
          </div>
          {plugins.map((p) => {
            const isVisible = visible[p.id] ?? false;
            return (
              <div
                key={p.id}
                onClick={() => {
                  togglePlugin(p.id);
                  setOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  cursor: 'pointer',
                  background: isVisible ? 'var(--accent-bg, rgba(0,122,255,0.15))' : 'transparent',
                  color: isVisible ? 'var(--accent-color, #007aff)' : 'var(--text-primary, #ccc)',
                  transition: 'background 0.15s',
                  fontSize: 13,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = isVisible
                    ? 'var(--accent-bg-hover, rgba(0,122,255,0.25))'
                    : 'var(--hover-bg, rgba(255,255,255,0.08))';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isVisible
                    ? 'var(--accent-bg, rgba(0,122,255,0.15))'
                    : 'transparent';
                }}
              >
                {/* 复选框 */}
                <span
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 3,
                    border: `1.5px solid ${isVisible ? 'var(--accent-color, #007aff)' : 'var(--border-color, #666)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10,
                    flexShrink: 0,
                  }}
                >
                  {isVisible && '✓'}
                </span>
                <span style={{ flex: 1 }}>{p.title}</span>
                <span
                  style={{
                    fontSize: 10,
                    color: 'var(--text-muted, #666)',
                    padding: '2px 6px',
                    borderRadius: 3,
                    background: 'var(--bg-tertiary, rgba(255,255,255,0.05))',
                  }}
                >
                  {p.position === 'left' ? '左' : p.position === 'right' ? '右' : '底'}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* 触发按钮 */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          border: '1px solid var(--border-color, #555)',
          background: 'var(--bg-secondary, #333)',
          color: 'var(--text-primary, #ddd)',
          fontSize: 18,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          transition: 'transform 0.15s, box-shadow 0.15s',
          padding: 0,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
        }}
        title="插件列表"
      >
        ⚙
      </button>
    </div>
  );
}
