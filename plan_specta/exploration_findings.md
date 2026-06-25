# tauri-specta 集成环境探测报告

> 探测日期: 2026-06-23
> 项目: tauri-finder (Tauri v2)

---

## 环境现状

### 1. Rust 命令签名清单

共 **21 个 Tauri 命令** 通过 `invoke_handler` 注册（排除 watcher 模块）。

#### `file_ops.rs` — 5 个命令

| 命令 | 参数 | 返回类型 |
|------|------|----------|
| `list_directory` | `path: String` | `Result<Vec<FileEntry>, String>` |
| `get_file_info` | `path: String` | `Result<FileInfo, String>` |
| `create_directory` | `path: String` | `Result<FileEntry, String>` |
| `rename_item` | `old_path: String, new_path: String` | `Result<FileEntry, String>` |
| `delete_item` | `path: String` | `Result<(), String>` |

#### `clipboard.rs` — 2 个命令

| 命令 | 参数 | 返回类型 |
|------|------|----------|
| `copy_items` | `sources: Vec<String>, destination: String` | `Result<Vec<FileEntry>, String>` |
| `move_items` | `sources: Vec<String>, destination: String` | `Result<Vec<FileEntry>, String>` |

#### `diff.rs` — 1 个命令

| 命令 | 参数 | 返回类型 |
|------|------|----------|
| `diff_files` | `path_a: String, path_b: String` | `Result<Vec<DiffLine>, String>` |

#### `search.rs` — 2 个命令

| 命令 | 参数 | 返回类型 |
|------|------|----------|
| `search_files` | `query: String, base_path: String` | `Result<Vec<FileEntry>, String>` |
| `search_content` | `query: String, base_path: String` | `Result<Vec<ContentMatch>, String>` |

#### `highlight.rs` — 1 个命令

| 命令 | 参数 | 返回类型 |
|------|------|----------|
| `highlight_file` | `path: String` | `Result<Option<String>, String>` |

#### `system.rs` — 5 个命令

| 命令 | 参数 | 返回类型 |
|------|------|----------|
| `get_system_dirs` | 无参数 | `Result<Vec<FileEntry>, String>` |
| `get_drives` | 无参数 | `Result<Vec<FileEntry>, String>` |
| `get_home_dir` | 无参数 | `Result<FileEntry, String>` |
| `read_text_file` | `path: String` | `Result<String, String>` |
| `read_file_bytes` | `path: String, max_bytes: usize` | `Result<Vec<u8>, String>` |

#### `git.rs` — 1 个命令

| 命令 | 参数 | 返回类型 |
|------|------|----------|
| `get_git_status` | `path: String` | `Result<Vec<GitFileStatus>, String>` |

#### `write_file.rs` — 1 个命令

| 命令 | 参数 | 返回类型 |
|------|------|----------|
| `write_text_file` | `path: String, content: String` | `Result<(), String>` |

#### `ai.rs` — 1 个命令

| 命令 | 参数 | 返回类型 |
|------|------|----------|
| `ai_ask` | `prompt: String, current_dir: String` | `Result<String, String>` |

#### `mcp/mod.rs` — 2 个命令

| 命令 | 参数 | 返回类型 |
|------|------|----------|
| `mcp_list_tools` | 无参数 | `Result<Vec<McpToolDef>, String>` |
| `mcp_call_tool` | `name: String, _arguments: HashMap<String, Value>` | `Result<McpToolResult, String>` |

---

### 2. 使用的结构体/模型

#### 共享模型（`models/`）

| 结构体 | 定义位置 | 字段 | 备注 |
|--------|----------|------|------|
| `FileEntry` | `models/file_entry.rs` | `name, path, is_dir, size, modified_at, created_at, is_symlink, extension, mime_type: String` | 带 `Serialize + Deserialize` |
| `FileInfo` | `models/file_entry.rs` | `entry: FileEntry, permissions: String, accessible: bool` | 带 `Serialize + Deserialize` |

#### 局部结构体（命令文件内定义）

| 结构体 | 定义位置 | 字段 | 备注 |
|--------|----------|------|------|
| `DiffLine` | `diff.rs` | `tag: String, line_a: Option<usize>, line_b: Option<usize>, content: String` | 仅 `Serialize` |
| `GitFileStatus` | `git.rs` | `path: String, status: String, staged: bool` | 仅 `Serialize` |
| `ContentMatch` | `search.rs` | `path: String, line: usize, content: String` | 仅 `Serialize` |
| `McpToolDef` | `mcp/mod.rs` | `name, description, input_schema, command` | 带 `Serialize + Deserialize` |
| `McpToolResult` | `mcp/mod.rs` | `success: bool, data: Option<Value>, error: Option<String>` | 仅 `Serialize` |

---

### 3. Cargo.toml 依赖分析

当前依赖概况：

| 类别 | 依赖 | 版本 | 备注 |
|------|------|------|------|
| **Tauri 核心** | `tauri` | `2` | Tauri v2 |
| **构建** | `tauri-build` | `2` | |
| **序列化** | `serde` | `1` (features: derive) | |
| | `serde_json` | `1` | |
| **时间** | `chrono` | `0.4` (features: serde) | |
| **文件系统** | `walkdir` | `2` | 目录遍历 |
| | `mime_guess` | `2` | MIME 类型 |
| | `dirs` | `5` | 系统目录 |
| **文件监控** | `notify-debouncer-full` | `0.3` | watcher 模块 |
| **差异比较** | `similar` | `2.7` | diff 功能 |
| **Git** | `git2` | `0.20` | |
| **语法高亮** | `arborium` | `2` | 带多语言 feature |
| **Tauri 插件** | `tauri-plugin-opener` | `2` | |
| | `tauri-plugin-shell` | `2` | |
| | `tauri-plugin-dialog` | `2.7.1` | |
| | `tauri-plugin-fs` | `2.5.1` | |
| | `tauri-plugin-notification` | `2.3.3` | |

> ⚠️ **关键发现：当前 Cargo.toml 中不包含 `specta` 或 `tauri-specta` 依赖。**

tauri-specta 需要与 Tauri v2 兼容的版本（`tauri-specta = "2"`），当前 Tauri 版本为 `2`，理论上兼容。

---

### 4. 前端调用模式

扫描 `src/` 目录下所有 `.ts`/`.tsx` 文件，发现 **35 处 `invoke()` 调用**。

**调用分布：**

| 文件 | 调用次数 | 调用的命令 |
|------|---------|-----------|
| `stores/fileStore.ts` | 3 | `list_directory` |
| `hooks/useFileSystem.ts` | 7 | `create_directory`, `rename_item`, `delete_item`, `copy_items`, `move_items`, `read_text_file`, `search_files` |
| `hooks/useGitStatus.ts` | 1 | `get_git_status` |
| `components/Preview/PreviewPanel.tsx` | 2 | `highlight_file`, `read_file_bytes` |
| `components/SearchBar/SearchBar.tsx` | 1 | `search_content` |
| `plugins/AiAssistant/index.tsx` | 7+ | `list_directory`, `search_files`, `read_text_file`, `diff_files`, `highlight_file`, `get_git_status`, `ai_ask` |
| `plugins/DiffViewer/index.tsx` | 1 | `diff_files` |
| `plugins/DirectoryTree/index.tsx` | 1 | `list_directory` |
| `plugins/HtmlPreview/index.tsx` | 1 | `read_text_file` |
| `plugins/MarkdownPreview/index.tsx` | 1 | `read_text_file` |
| `utils/constants.ts` | 3 | `get_home_dir`, `get_system_dirs`, `get_drives` |

**调用模式：**
- 全部使用 `invoke('command_name', { paramKey: value })` 格式
- **无手动类型声明** — 所有返回值通过 `as` 或类型标注推断
- 示例：`const entries: FileEntry[] = await invoke('list_directory', { path })`
- 无 `@tauri-apps/api` 的 `tauri` 导入之外的其他封装

---

## 关键发现

### 1. ✅ 集成门槛较低
- 所有命令返回值类型都是 Rust 原生类型 + `String` 错误类型
- 无泛型命令参数
- 所有序列化结构体均已标注 `#[derive(Serialize)]` 或 `#[derive(Serialize, Deserialize)]`

### 2. ⚠️ 需优先处理的命令（复杂返回类型）
以下命令返回复杂集合类型，specta 需要为这些类型生成 TS 类型：

| 优先级 | 命令 | 返回类型 | 复杂度 |
|--------|------|----------|--------|
| P0 | `list_directory` | `Vec<FileEntry>` | 高（8字段复合结构） |
| P0 | `get_file_info` | `FileInfo` | 高（嵌套 FileEntry） |
| P0 | `copy_items` / `move_items` | `Vec<FileEntry>` | 高 |
| P1 | `search_content` | `Vec<ContentMatch>` | 中 |
| P1 | `diff_files` | `Vec<DiffLine>` | 中 |
| P1 | `get_git_status` | `Vec<GitFileStatus>` | 中 |
| P2 | `get_system_dirs` / `get_drives` | `Vec<FileEntry>` | 中 |
| P2 | `read_file_bytes` | `Vec<u8>` | 低（基本类型） |
| P3 | `get_home_dir` / `create_directory` / `rename_item` | `FileEntry` | 低 |
| P3 | `highlight_file` | `Option<String>` | 低 |

### 3. 🔧 MCP 模块的特殊性
- `mcp_call_tool` 使用 `HashMap<String, Value>` 动态参数，specta 无法直接生成精确类型
- 建议：对 MCP 模块单独处理，不做 specta 自动类型生成

### 4. 📝 前端可立即受益
- 35 处 `invoke()` 调用可替换为类型安全调用
- 现有 `FileEntry` 等类型在前端已有手动声明（需确认 `src/types/` 目录）

---

## 风险/不确定点

### 🔴 高风险

| 风险 | 说明 | 影响 |
|------|------|------|
| **文件写入安全性** | `write_text_file(path, content)` 接受任意路径 + 内容，无路径校验 | 可被用于覆盖任意文件 |
| **递归删除** | `delete_item` 使用 `remove_dir_all`，无回收站机制 | 数据不可恢复 |
| **任意文件读取** | `read_text_file` / `read_file_bytes` 可读取任何系统文件 | 信息泄露 |
| **命令执行** | `ai_ask` 通过 `opencode` CLI 执行系统命令 | 间接命令注入风险 |

### 🟡 中风险

| 风险 | 说明 |
|------|------|
| `read_file_bytes` 返回 `Vec<u8>` | specta 需要确认如何处理二进制类型的 TS 映射 |
| `mcp_call_tool` 的 `HashMap<String, Value>` | 动态参数无法静态类型化 |
| `highlight_file` 返回 `Option<String>` | specta 需要处理 Optional 类型的 TS 映射 |
| `search_content` 的 `ContentMatch` 定义在命令文件中 | 需要提取到共享模型以统一代码生成 |

### 🟢 低风险/兼容良好

| 项 | 状态 |
|----|------|
| 所有命令使用 `Result<T, String>` 错误模式 | ✅ 与 specta 兼容良好 |
| 无泛型参数 | ✅ 简化代码生成 |
| 无 `async` 标注（除 `mcp_call_tool`） | ✅ 同步命令兼容 |
| 所有模型均已 `Serialize` | ✅ 可直接用 `#[specta]` 派生 |
| Tauri v2 与 tauri-specta v2 | ✅ 版本兼容 |

### 建议集成顺序

1. **Phase 1**: 在 Cargo.toml 添加 `specta` + `tauri-specta`；为共享模型添加 `#[derive(Type)]`；为 `file_ops` 系列命令添加 `#[specta]`
2. **Phase 2**: 处理 `search` / `diff` / `git` 模块中的局部结构体，提取或加 `#[derive(Type)]`
3. **Phase 3**: 前端生成 `.ts` 文件，替换 35 处 `invoke()` 为类型安全调用
4. **Phase 4**: MCP 模块保留手动类型（不纳入 specta），处理 `read_file_bytes` 的 `Vec<u8>` 边界情况
