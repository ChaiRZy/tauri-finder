import type { PluginDefinition, PluginMcpTool } from './types';

const registry = new Map<string, PluginDefinition>();

/** 注册一个插件 */
export function registerPlugin(def: PluginDefinition): void {
  if (registry.has(def.id)) {
    console.warn(`[plugin] "${def.id}" already registered, skipping`);
    return;
  }
  registry.set(def.id, def);
}

/** 获取所有已注册的插件 */
export function getAllPlugins(): PluginDefinition[] {
  return Array.from(registry.values());
}

/** 按位置分组获取插件 */
export function getPluginsByPosition(position: PluginDefinition['position']): PluginDefinition[] {
  return getAllPlugins().filter((p) => p.position === position);
}

/** 获取单个插件定义 */
export function getPlugin(id: string): PluginDefinition | undefined {
  return registry.get(id);
}

/** 收集所有插件声明的 MCP 工具 */
export function getAllMcpTools(): PluginMcpTool[] {
  const tools: PluginMcpTool[] = [];
  for (const def of registry.values()) {
    if (def.mcpTools) {
      tools.push(...def.mcpTools);
    }
  }
  return tools;
}

/** 获取指定插件的 MCP 工具 */
export function getPluginMcpTools(id: string): PluginMcpTool[] {
  return registry.get(id)?.mcpTools ?? [];
}
