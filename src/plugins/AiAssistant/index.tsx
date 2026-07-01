import { useState, useRef, useEffect, useCallback } from 'react';
import { typedInvoke } from '../../utils/invoke';
import { useFileStore } from '../../stores/fileStore';

interface Message {
  role: 'user' | 'assistant' | 'tool';
  content: string;
  toolCall?: {
    name: string;
    args: Record<string, unknown>;
    result?: string;
  };
}

/**
 * AI 助手插件
 * 在右侧面板中提供基于自然语言的文件操作能力。
 *
 * 后端调用模式：
 *   1. 直接模式：Rust 侧通过 `opencode run` 调用 LLM 并解析 tool calls
 *   2. 回退模式：直接发送 HTTP 请求到 LLM API
 */
export default function AiAssistant() {
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: '你好！我是 AI 助手。我可以帮你操作文件：\n\n列出文件、搜索内容、创建目录、复制/移动/删除文件等。\n\n请描述你要做什么。',
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [backendMode, setBackendMode] = useState<'opencode' | 'direct'>('direct');
  const listEndRef = useRef<HTMLDivElement>(null);
  const currentDir = useFileStore((s) => s.currentDir);

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (msg: Message) => {
    setMessages((prev) => [...prev, msg]);
  };

  /** 执行一个 tool call：将 LLM 请求的工具调用转译为 Tauri invoke */
  const executeToolCall = useCallback(async (name: string, args: Record<string, unknown>): Promise<string> => {
    try {
      let result: unknown;
      switch (name) {
        case 'list_directory':
          result = await typedInvoke.listDirectory(args.path as string ?? currentDir);
          break;
        case 'search_files':
          result = await typedInvoke.searchFiles(args.query as string, args.basePath as string ?? currentDir);
          break;
        case 'search_content':
          result = await typedInvoke.searchContent(args.query as string, args.basePath as string ?? currentDir);
          break;
        case 'read_text_file': {
          const { readTextFile } = await import('@tauri-apps/plugin-fs');
          result = await readTextFile(args.path as string);
          break;
        }
        case 'get_file_info':
          result = await typedInvoke.getFileInfo(args.path as string);
          break;
        case 'create_directory':
          result = await typedInvoke.createDirectory(args.path as string);
          break;
        case 'rename_item':
          result = await typedInvoke.renameItem(args.oldPath as string, args.newPath as string);
          break;
        case 'delete_item':
          result = await typedInvoke.deleteItem(args.path as string);
          break;
        case 'copy_items':
          result = await typedInvoke.copyItems(args.sources as string[], args.destination as string);
          break;
        case 'move_items':
          result = await typedInvoke.moveItems(args.sources as string[], args.destination as string);
          break;
        case 'diff_files':
          result = await typedInvoke.diffFiles(args.pathA as string, args.pathB as string);
          break;
        case 'highlight_file':
          result = await typedInvoke.highlightFile(args.path as string);
          break;
        case 'get_git_status':
          result = await typedInvoke.getGitStatus(args.path as string ?? currentDir);
          break;
        default:
          return `未知工具: ${name}`;
      }
      return JSON.stringify(result, null, 2);
    } catch (e) {
      return `工具调用失败: ${e}`;
    }
  }, [currentDir]);

  /** 调用 LLM（直接 HTTP 模式） */
  const callLlmDirect = useCallback(async (prompt: string) => {
    const toolDescriptions = [
      { name: 'list_directory', description: '列出目录内容', args: { path: 'string' } },
      { name: 'search_files', description: '按文件名搜索', args: { query: 'string', basePath: 'string' } },
      { name: 'search_content', description: '全文内容搜索', args: { query: 'string', basePath: 'string' } },
      { name: 'read_text_file', description: '读取文本文件', args: { path: 'string' } },
      { name: 'get_file_info', description: '获取文件信息', args: { path: 'string' } },
      { name: 'create_directory', description: '创建目录', args: { path: 'string' } },
      { name: 'rename_item', description: '重命名', args: { oldPath: 'string', newPath: 'string' } },
      { name: 'delete_item', description: '删除文件或目录', args: { path: 'string' } },
      { name: 'copy_items', description: '复制文件', args: { sources: 'string[]', destination: 'string' } },
      { name: 'move_items', description: '移动文件', args: { sources: 'string[]', destination: 'string' } },
      { name: 'diff_files', description: '比较两个文件', args: { pathA: 'string', pathB: 'string' } },
    ];

    const systemPrompt = `你是一个文件管理助手。当前目录: ${currentDir}。
你可以使用以下工具操作文件系统（以 JSON 格式回复，格式: {"tool": "工具名", "args": {...}} 或 {"reply": "你的回答"}）:
${toolDescriptions.map((t) => `- ${t.name}: ${t.description}`).join('\n')}`;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('ai-api-key') ?? ''}`,
        },
        body: JSON.stringify({
          model: localStorage.getItem('ai-model') ?? 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.filter((m) => m.role !== 'tool').map((m) => ({
              role: m.role,
              content: m.content,
            })),
            { role: 'user', content: prompt },
          ],
          temperature: 0.1,
        }),
      });

      if (!response.ok) {
        // 回退：尝试用 opencode
        return await callOpencode(prompt);
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content ?? '';

      // 尝试解析 JSON tool call
      try {
        const parsed = JSON.parse(text);
        if (parsed.tool) {
          addMessage({ role: 'assistant', content: `正在调用: ${parsed.tool}`, toolCall: { name: parsed.tool, args: parsed.args } });
          const result = await executeToolCall(parsed.tool, parsed.args ?? {});
          addMessage({ role: 'tool', content: `工具结果:\n${result.slice(0, 2000)}`, toolCall: { name: parsed.tool, args: parsed.args ?? {}, result } });
          return result;
        }
      } catch {}

      return text;
    } catch {
      return await callOpencode(prompt);
    }
  }, [messages, currentDir, executeToolCall]);

  /** 回退：使用 opencode 命令处理 */
  const callOpencode = useCallback(async (prompt: string): Promise<string> => {
    try {
      const result: string = await typedInvoke.aiAsk(prompt, currentDir);
      return result;
    } catch (e) {
      return `AI 助手暂不可用。请配置 API Key 或安装 opencode。\n\n错误: ${e}`;
    }
  }, []);

  const handleSend = useCallback(async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setLoading(true);

    addMessage({ role: 'user', content: userMsg });

    try {
      const response = backendMode === 'opencode'
        ? await callOpencode(userMsg)
        : await callLlmDirect(userMsg);

      addMessage({ role: 'assistant', content: response });
    } catch (e) {
      addMessage({ role: 'assistant', content: `发生错误: ${e}` });
    }

    setLoading(false);
  }, [input, loading, backendMode, callOpencode, callLlmDirect]);

  return (
    <div style={{ padding: 0, fontSize: 12, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 头部 */}
      <div style={{
        padding: '8px 12px', borderBottom: '1px solid #e8e8e8',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontWeight: 600, fontSize: 13 }}>AI 助手</span>
        <select
          value={backendMode}
          onChange={(e) => setBackendMode(e.target.value as 'opencode' | 'direct')}
          style={{ fontSize: 11, padding: '2px 6px', border: '1px solid #ddd', borderRadius: 4 }}
        >
          <option value="direct">API 模式</option>
          <option value="opencode">opencode 模式</option>
        </select>
      </div>

      {/* 消息列表 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            padding: '8px 10px',
            borderRadius: 8,
            background: msg.role === 'user' ? '#e3f2fd' : msg.role === 'tool' ? '#f5f5f5' : '#fff',
            border: '1px solid #e8e8e8',
            maxWidth: '90%',
            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
            fontSize: 11,
            lineHeight: 1.5,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}>
            {msg.toolCall && (
              <div style={{ fontSize: 10, color: '#666', marginBottom: 4 }}>
                工具: {msg.toolCall.name}({JSON.stringify(msg.toolCall.args)})
              </div>
            )}
            {msg.content}
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: 'flex-start', color: '#999', fontSize: 11, padding: '4px 8px' }}>
            思考中...
          </div>
        )}
        <div ref={listEndRef} />
      </div>

      {/* 输入区 */}
      <div style={{
        padding: '8px 12px', borderTop: '1px solid #e8e8e8',
        display: 'flex', gap: 8, alignItems: 'center',
      }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder="描述你要做的操作..."
          disabled={loading}
          style={{
            flex: 1, padding: '6px 10px', fontSize: 12, borderRadius: 6,
            border: '1px solid #ddd', outline: 'none',
          }}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          style={{
            padding: '6px 14px', fontSize: 12, borderRadius: 6,
            border: 'none', background: loading ? '#ccc' : '#1976d2',
            color: '#fff', cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          发送
        </button>
      </div>

      {/* API Key 配置提示 */}
      {backendMode === 'direct' && !localStorage.getItem('ai-api-key') && (
        <div style={{
          padding: '6px 12px', fontSize: 10, color: '#f57c00',
          background: '#fff3e0', borderTop: '1px solid #ffe0b2',
        }}>
          请在 localStorage 中设置 <code>ai-api-key</code>（OpenAI API Key），或切换到 "opencode 模式"
        </div>
      )}
    </div>
  );
}
