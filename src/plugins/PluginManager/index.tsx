import { usePluginStore } from '../pluginStore';
import { getAllPlugins } from '../registry';
import { getAllMcpTools } from '../registry';

/**
 * 插件管理面板
 * 列出所有插件及其 MCP 能力，支持全局开关
 */
export default function PluginManager() {
  const disabled = usePluginStore((s) => s.disabled);
  const setPluginDisabled = usePluginStore((s) => s.setPluginDisabled);

  const plugins = getAllPlugins();
  const allTools = getAllMcpTools();

  return (
    <div style={{ padding: 12, fontSize: 12, height: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>插件管理</div>

      <div style={{ fontSize: 11, color: '#888', marginBottom: 8 }}>
        共 {plugins.length} 个插件 · {allTools.length} 个 MCP 工具
      </div>

      {/* 插件列表 */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {plugins.map((p) => {
          const isOff = disabled.has(p.id);
          const tools = p.mcpTools ?? [];
          return (
            <div
              key={p.id}
              style={{
                padding: '8px 10px',
                borderRadius: 6,
                background: isOff ? '#f5f5f5' : '#fff',
                border: '1px solid #e8e8e8',
                opacity: isOff ? 0.55 : 1,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontWeight: 500, fontSize: 12 }}>{p.title}</span>
                  <span style={{ color: '#aaa', fontSize: 11, marginLeft: 6, textTransform: 'uppercase' }}>
                    {p.position}
                  </span>
                </div>
                <label style={{ position: 'relative', display: 'inline-block', width: 36, height: 20, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={!isOff}
                    onChange={() => setPluginDisabled(p.id, !isOff)}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span
                    style={{
                      position: 'absolute', inset: 0, borderRadius: 20,
                      background: isOff ? '#ccc' : '#4caf50',
                      transition: 'background 0.2s',
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute', top: 2, width: 16, height: 16,
                        borderRadius: '50%', background: '#fff',
                        left: isOff ? 2 : 18, transition: 'left 0.2s',
                      }}
                    />
                  </span>
                </label>
              </div>

              {p.summary && (
                <div style={{ color: '#888', fontSize: 11, marginTop: 4 }}>{p.summary}</div>
              )}

              {tools.length > 0 && (
                <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {tools.map((t) => (
                    <span
                      key={t.name}
                      style={{
                        fontSize: 10, padding: '2px 6px', borderRadius: 4,
                        background: '#e3f2fd', color: '#1565c0',
                      }}
                      title={t.description}
                    >
                      {t.name}
                    </span>
                  ))}
                </div>
              )}

              {tools.length === 0 && (
                <div style={{ marginTop: 4, fontSize: 10, color: '#bbb' }}>
                  无 MCP 工具
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
