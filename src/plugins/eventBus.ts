/**
 * 轻量级插件事件总线
 * 插件之间通过发布/订阅解耦通信
 */

type Listener = (...args: any[]) => void;

const listeners = new Map<string, Set<Listener>>();

/** 订阅事件，返回取消订阅函数 */
export function on(event: string, fn: Listener): () => void {
  if (!listeners.has(event)) {
    listeners.set(event, new Set());
  }
  listeners.get(event)!.add(fn);
  return () => { listeners.get(event)?.delete(fn); };
}

/** 发布事件 */
export function emit(event: string, ...args: any[]) {
  listeners.get(event)?.forEach((fn) => fn(...args));
}

/** 清空所有监听 */
export function clear() {
  listeners.clear();
}

/* ── 内置事件常量 ── */

/** 选中文件发生变化 */
export const EVENT_FILE_SELECTION = 'file-selection';
/** 用户打开文件 */
export const EVENT_FILE_OPENED = 'file-opened';
/** 当前目录变化 */
export const EVENT_DIRECTORY_CHANGED = 'directory-changed';
/** 剪贴板变化 */
export const EVENT_CLIPBOARD_CHANGED = 'clipboard-changed';
