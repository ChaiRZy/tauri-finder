import { usePluginStore } from './pluginStore';
import { getPluginsByPosition } from './registry';
import type { PluginPosition } from './types';

interface Props {
  position: PluginPosition;
  /** 渲染在 tab 行之后的额外操作按钮 */
  extraActions?: React.ReactNode;
}

/**
 * 插件标签切换条
 * 显示指定位置的所有可见插件，点击切换 activeTab
 */
export default function PluginTabs({ position, extraActions }: Props) {
  const activeTab = usePluginStore((s) => s.activeTab);
  const setActiveTab = usePluginStore((s) => s.setActiveTab);
  const visible = usePluginStore((s) => s.visible);
  const disabled = usePluginStore((s) => s.disabled);

  const plugins = getPluginsByPosition(position)
    .filter((p) => visible[p.id] && !disabled.has(p.id));

  if (plugins.length <= 1) return null;

  const activeId = activeTab[position];

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 0,
      borderBottom: '1px solid #e5e5e5',
      background: '#fafafa',
      flexShrink: 0,
      height: 30,
      padding: '0 4px',
    }}>
      {plugins.map((p) => {
        const isActive = p.id === activeId;
        return (
          <div
            key={p.id}
            onClick={() => setActiveTab(position, p.id)}
            style={{
              padding: '4px 12px',
              fontSize: 11,
              cursor: 'pointer',
              borderBottom: isActive ? '2px solid #4A90D9' : '2px solid transparent',
              color: isActive ? '#333' : '#888',
              fontWeight: isActive ? 500 : 400,
              whiteSpace: 'nowrap',
              userSelect: 'none',
              transition: 'color 0.15s, border-color 0.15s',
            }}
          >
            {p.title}
          </div>
        );
      })}
      {extraActions && (
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 2 }}>
          {extraActions}
        </div>
      )}
    </div>
  );
}
