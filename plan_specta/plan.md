# tauri-specta 类型安全层集成计划

## 目标
为 tauri-finder 引入 tauri-specta，实现 Rust ↔ TypeScript 双向类型安全，消除 35 处手动 invoke 调用的类型风险。

## 依赖图

```
Phase 1: 基础依赖 + 共享模型
  ├─ 1.1 Cargo.toml 添加 specta + tauri-specta
  ├─ 1.2 共享模型添加 #[derive(Type)]
  └─ 1.3 编译验证 (cargo check)
          │
Phase 2: 命令添加 #[specta] 注解
  ├─ 2.1 file_ops.rs (5命令, P0优先)
  ├─ 2.2 system.rs (5命令)
  ├─ 2.3 clipboard.rs / diff.rs / git.rs / write_file.rs
  ├─ 2.4 search.rs (局部结构体需提取)
  ├─ 2.5 highlight.rs
  ├─ 2.6 ai.rs
  └─ 2.7 mcp 模块跳过（HashMap<String, Value> 动态参数）
          │
Phase 3: 生成 TypeScript 类型文件
  ├─ 3.1 添加 export_specta_types 构建脚本/命令行
  └─ 3.2 生成 src/types/commands.ts
          │
Phase 4: 前端迁移 (35处 invoke 替换)
  ├─ 4.1 stores/fileStore.ts (3处)
  ├─ 4.2 hooks/useFileSystem.ts (7处) + useGitStatus.ts (1处)
  ├─ 4.3 组件层替换 (PreviewPanel/SearchBar/插件等, ~15处)
  ├─ 4.4 utils/constants.ts (3处)
  └─ 4.5 插件系统替换 (AiAssistant/DiffViewer/DirectoryTree等, ~6处)
```

## 任务清单

### Phase 1: 基础依赖与模型 (预估: 10min)
- [ ] 1.1 `Cargo.toml` 添加 `specta = { version = "2", features = ["derive"] }` 和 `tauri-specta = "2"`
- [ ] 1.2 `models/file_entry.rs`: `FileEntry` + `FileInfo` 添加 `#[derive(Type)]` + `#[specta]`
- [ ] 1.3 局部结构体确认：`DiffLine`, `GitFileStatus`, `ContentMatch`, `McpToolDef`, `McpToolResult`
- [ ] 1.4 `cargo check` 确认无编译错误

### Phase 2: 命令注解 (预估: 20min)
- [ ] 2.1 `file_ops.rs`: 5个命令加 `#[specta]`
- [ ] 2.2 `system.rs`: 5个命令加 `#[specta]`
- [ ] 2.3 `clipboard.rs`: 2个命令加 `#[specta]`
- [ ] 2.4 `diff.rs`: `diff_files` + `DiffLine` 处理
- [ ] 2.5 `git.rs`: `get_git_status` + `GitFileStatus` 处理
- [ ] 2.6 `write_file.rs`: `write_text_file` 加 `#[specta]`
- [ ] 2.7 `search.rs`: 提取 `ContentMatch` 到模型层 + 2个命令加 `#[specta]`
- [ ] 2.8 `highlight.rs`: `highlight_file` 加 `#[specta]`
- [ ] 2.9 `ai.rs`: `ai_ask` 加 `#[specta]`
- [ ] 2.10 `cargo check` 确认无编译错误

### Phase 3: 类型生成 (预估: 15min)
- [ ] 3.1 添加 `generate_specta_types.rs` 构建脚本或独立脚本
- [ ] 3.2 运行生成 → `src/types/commands.ts`
- [ ] 3.3 验证生成结果：类型定义完整，与 Rust 端一致

### Phase 4: 前端迁移 (预估: 30min)
- [ ] 4.1 `fileStore.ts`: 替换 invoke 为类型安全调用
- [ ] 4.2 `useFileSystem.ts`: 替换 7 处 invoke
- [ ] 4.3 `useGitStatus.ts`: 替换 1 处 invoke
- [ ] 4.4 `PreviewPanel.tsx`: 替换 2 处 invoke
- [ ] 4.5 `SearchBar.tsx`: 替换 1 处 invoke
- [ ] 4.6 6个插件文件替换 invoke
- [ ] 4.7 `constants.ts`: 替换 3 处 invoke
- [ ] 4.8 `tsc --noEmit` 检查类型错误

### MCP 模块 (跳过)
- `mcp_list_tools` / `mcp_call_tool` 保留手动类型，不纳入 specta

## 验证标准
1. ✅ `cargo check` 通过
2. ✅ 生成正确的 `.ts` 类型文件
3. ✅ `npm run tsc --noEmit` 通过
4. ✅ 运行无运行时类型错误

## 不纳入范围
- MCP 模块（动态参数无法静态类型化）
- `watcher` 模块（无 `#[tauri::command]` 注册）
- 安全审计（`write_text_file` 路径校验等）
- 测试编写
