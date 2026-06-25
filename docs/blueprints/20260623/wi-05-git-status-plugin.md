# WI-05: Git Status 插件

## 概述

在文件浏览区域集成 Git 状态指示：当用户在 Git 仓库目录内时，FileRow 显示文件的状态图标（staged / modified / untracked / deleted / renamed），并在底部或右侧提供一个 Git 状态总览面板。

## 文件清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `src-tauri/Cargo.toml` | 修改 | 新增 `git2` crate |
| `src-tauri/src/commands/mod.rs` | 修改 | 新增 `pub mod git;` |
| `src-tauri/src/commands/git.rs` | 新增 | `get_git_status` 命令实现 |
| `src-tauri/src/lib.rs` | 修改 | 注册 `get_git_status` 命令 |
| `src/hooks/useGitStatus.ts` | 新增 | React hook：获取当前目录的 Git 状态 |
| `src/components/FileList/FileRow.tsx` | 修改 | 新增 Git 状态图标（colored dot/badge） |
| `src/components/FileList/FileList.css` | 修改 | Git 状态图标样式 |
| `src/plugins/GitStatus/index.tsx` | 新增 | Git 状态总览面板插件（可选底部/右侧） |
| `src/plugins/index.ts` | 修改 | 注册 `git-status` 插件 |

## 契约与骨架

### Rust 命令

```rust
// git.rs

use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct GitFileStatus {
    pub path: String,         // 相对于仓库根
    pub status: String,       // "staged" | "modified" | "untracked" | "deleted" | "renamed" | "conflict"
    pub staged: bool,         // 是否已暂存
}

#[tauri::command]
pub fn get_git_status(path: String) -> Result<Vec<GitFileStatus>, String> {
    // 1. 从 path 向上查找 .git 目录
    // 2. 打开仓库
    // 3. 获取 statuses 列表
    // 4. 过滤出匹配当前目录的文件
    // 5. 返回 Vec<GitFileStatus>
}
```

### useGitStatus Hook

```ts
// src/hooks/useGitStatus.ts

interface GitStatusMap {
  [relativePath: string]: GitFileStatus;
}

export function useGitStatus(currentDir: string): {
  gitStatus: GitStatusMap;
  isRepo: boolean;
  branch: string | null;
  loading: boolean;
}
```

- 每次 `currentDir` 变化时调用 `invoke('get_git_status', { path: currentDir })`
- 返回 `{ path: relativePath, status, staged }[]` 转换为 Map
- 检测是否在 Git 仓库内（通过返回空 vs 错误区分）

### FileRow Git 指示

在文件名左侧/右侧显示小圆点或 badge：

| 状态 | 颜色 | 图标 |
|------|------|------|
| staged | 🟢 green | ● |
| modified | 🟡 yellow | ● |
| untracked | 🔵 blue | ● |
| deleted | 🔴 red | ● |
| renamed | 🟣 purple | ● |
| conflict | ⭕ orange | ! |

### GitStatus 插件面板

底部/右侧面板，显示当前仓库的状态总览：
- 当前分支名
- 各状态的统计（X staged, Y modified, Z untracked...）
- 文件列表（可点击跳转）

## 流程概述

```
用户导航到目录
  → useGitStatus 检测是否在 Git 仓库
  → 若是，调用 get_git_status 获取状态
  → 状态以 Map 形式缓存
  → FileRow 读取状态并显示指示器
  → GitStatus 面板（如开启）显示总览
```

## 任务拆分

| ID | 标题 | 复杂度 | 依赖 | 验收点 |
|----|------|--------|------|--------|
| WI-05-01 | 添加 git2 crate + Rust status 命令 | M | 无 | `cargo build` 通过，命令返回正确 |
| WI-05-02 | useGitStatus React Hook | S | WI-05-01 | hook 返回当前目录的 git 状态 |
| WI-05-03 | FileRow Git 指示器 | S | WI-05-02 | FileRow 显示颜色圆点 + title 提示 |
| WI-05-04 | GitStatus 总览面板插件 | M | WI-05-02 | 面板显示分支名 + 状态统计 + 文件列表 |
| WI-05-05 | 注册插件 + 回归构建 | S | WI-05-03~04 | `npm run build` 通过 |

## Sub-agent Briefing

### WI-05-01: Rust git2 命令

- 目标：添加 git2 依赖，实现 get_git_status 命令
- 复杂度：M
- 允许修改：`src-tauri/Cargo.toml`, `src-tauri/src/commands/mod.rs`, `src-tauri/src/commands/git.rs`, `src-tauri/src/lib.rs`
- 关键契约：
  - `fn get_git_status(path: String) -> Result<Vec<GitFileStatus>, String>`
  - `GitFileStatus { path: String, status: String, staged: bool }`
  - 向上查找 .git 目录，只返回当前目录下的文件状态
- 验收点：在 Git 仓库内调用命令返回正确状态列表

### WI-05-02: useGitStatus Hook

- 目标：React hook 封装 git status 调用
- 复杂度：S
- 依赖：WI-05-01
- 允许修改：新建 `src/hooks/useGitStatus.ts`
- 关键契约：返回 `{ gitStatus, isRepo, branch, loading }`
- 验收点：在 Git 仓库目录中调用返回非空数据

### WI-05-03: FileRow 指示器

- 目标：在 FileRow 中显示 Git 状态圆点
- 复杂度：S
- 依赖：WI-05-02
- 允许修改：`src/components/FileList/FileRow.tsx`, `src/components/FileList/FileList.css`
- 关键契约：文件名左侧显示彩色小圆点（6px），title 显示状态文字
- 验收点：Git 仓库中的文件显示正确的状态颜色

### WI-05-04: GitStatus 总览面板

- 目标：底部/右侧面板显示仓库状态总览
- 复杂度：M
- 依赖：WI-05-02
- 允许修改：新建 `src/plugins/GitStatus/index.tsx`, `src/plugins/index.ts`
- 关键契约：左侧显示分支名和统计，右侧显示文件列表
- 验收点：面板开启后正确显示仓库状态
