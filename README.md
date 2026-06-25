# Finder

A macOS Finder-style cross-platform file manager built with **Tauri v2** + **React 19** + **TypeScript** + **Rust**.

> 一个仿 macOS Finder 风格、支持 Windows 的跨平台文件管理器，基于 Tauri v2 + React 19 + TypeScript + Rust 构建。

## 功能简介

- **三种文件视图**：列表、网格、列视图（Finder 级联式）
- **完整文件操作**：新建/重命名/删除/复制/剪切/粘贴
- **右键菜单可定制**：自由开关菜单项
- **搜索过滤**：实时文件名搜索
- **预览面板**：图片、文本/代码高亮、视频、音频、PDF、JSON 折叠树、Hex dump
- **Markdown 预览**：右侧插件，选中 .md 文件自动渲染
- **分组排布**：按类型分组展示
- **内置终端**：支持 cmd / PowerShell / Git Bash，交互式 CLI，快捷命令一键执行
- **侧边栏**：系统目录、收藏夹、驱动器
- **属性对话框**：查看文件/文件夹详细信息
- **状态栏**：路径显示、复制、快速命令、终端切换
- **键盘快捷键**：Ctrl+C/V/X/A、Delete、F2、Ctrl+N/F/P 等
- **多列导航（列视图）**：级联展开，支持回退
- **Git 状态指示**：文件列表显示 staged / modified / untracked 等颜色圆点
- **Git 状态面板**：右侧插件，展示分支、变更统计、文件列表
- **Diff 对比**：选中两个文件后一键对比
- **插件系统**：VS Code 风格 Activity Bar 统一开关，事件总线解耦通信

## Features

### File Browsing
- **List View** — table with Name/Size/Date/Kind columns, sortable by any column
- **Grid View** — icon-based grid layout with file thumbnail preview
- **Column View** — macOS Finder-style cascading columns; single-click folders to drill in, auto-scroll to the rightmost column
- **Breadcrumb Path Bar** — clickable path segments, back/forward/up navigation

### File Operations
- **Create** new folders
- **Rename** files and folders (F2 shortcut, auto-selects name without extension)
- **Delete** items (Delete key)
- **Copy / Cut / Paste** — clipboard with keyboard shortcuts (Ctrl+C/X/V)
- **Copy path** to clipboard via status bar button

### Context Menu
- Right-click on files/folders for: Rename, Copy, Cut, Delete, Get Info
- Right-click on empty area for: New Folder, Paste
- **Customizable** — open Customize Menu... dialog to toggle which items appear

### Search
- Client-side file name search (Ctrl+F to focus)
- Search bar can be toggled via toolbar button

### Preview Panel
- Toggle preview with Activity Bar or Ctrl+P
- Image preview (PNG, JPG, GIF, SVG, WebP, BMP)
- Text/code file preview with syntax highlighting (Arborium)
- Video preview (MP4, WebM, AVI, MOV, MKV)
- Audio preview (MP3, WAV, FLAC, OGG)
- PDF preview (via iframe)
- JSON preview with collapsible tree
- Large file (>10MB) warning before loading
- Binary hex dump preview
- File metadata (kind, size, dates, path)

### Markdown Preview
- Dedicated right-side plugin for .md files
- GitHub Flavored Markdown (GFM) support
- Code blocks, tables, blockquotes, images, etc.

### Plugin System
- **Activity Bar** — 48px left-side strip with clickable icons for all plugins
- **Left position** — file-explorer sidebar
- **Right position** — preview, markdown-preview, diff-viewer, git-status
- **Bottom position** — terminal, output, tasks
- **Event Bus** — publish/subscribe for cross-plugin communication
- **Persistent layout** — plugin sizes and visibility saved in localStorage

### Git Integration
- Automatic git repository detection
- File status indicators in list view (staged/modified/untracked/deleted/renamed/conflict)
- Git status overview panel with branch, change counts, and file list

### File Diff
- Side-by-side diff comparison (select two files → right-click → Compare Selected)
- Insert/delete/equal highlighting with line numbers

### Grouping
- Toggle grouping by type (Folders, Images, Documents, Code, Archives, Audio, Video, Executables, Other)
- Group headers in list view

### Sidebar
- **System directories** — Desktop, Downloads, Documents, Pictures, Music, Videos
- **Favorites** — right-click a system dir to add, right-click a favorite to remove
- **Drives** — list of available drives

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Backspace` | Go up one directory |
| `Arrow Up/Down` | Navigate between files |
| `Enter` | Open selected directory |
| `Ctrl+A` | Select all |
| `Ctrl+C` | Copy |
| `Ctrl+X` | Cut |
| `Ctrl+V` | Paste |
| `Delete` | Delete selected |
| `F2` | Rename |
| `Ctrl+N` | New folder |
| `Ctrl+F` | Focus search |

### Properties Dialog
- View file/folder info: name, kind, size, path, modified date, created date, extension, MIME type

### Terminal
- Built-in terminal panel (togglable from Activity Bar or status bar)
- Supports **cmd**, **PowerShell**, and **Git Bash**
- **Quick Commands** — save and run frequently used commands with one click
  - Configure name, command, and execution mode (current directory or fixed path)
  - Commands persist in localStorage
- Command output displayed in the terminal panel

### Status Bar
- Full current directory path display
- Item count
- Copy path button
- Quick commands manager (`+`)
- Terminal toggle

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop Shell | [Tauri v2](https://v2.tauri.app/) |
| Frontend | React 19 + TypeScript |
| Build Tool | Vite |
| State Management | [Zustand](https://github.com/pmndrs/zustand) |
| Icons | [Lucide React](https://lucide.dev/) |
| Markdown | [marked](https://marked.js.org/) |
| Syntax Highlight | Arborium (20+ languages) |
| Terminal | xterm.js |
| Backend | Rust (file system, clipboard, search, git, diff, file watching) |
| Git | git2 (libgit2 bindings) |
| File Watching | notify-debouncer-full |
| Plugin: Opener | `@tauri-apps/plugin-opener` |
| Plugin: Shell | `@tauri-apps/plugin-shell` |

## Project Structure

```
tauri-finder/
├── src/                          # React frontend
│   ├── App.tsx                   # Root component
│   ├── App.css                   # Global styles
│   ├── main.tsx                  # Entry point
│   ├── components/
│   │   ├── ActivityBar/          # VS Code-style plugin toggle bar
│   │   ├── ContextMenu/          # Right-click menu
│   │   ├── Dialogs/              # Create, Rename, Properties, ContextMenuSettings, QuickCommand
│   │   ├── FileList/             # FileRow, FileGrid, FileColumns, FileIcon
│   │   ├── Layout/               # AppLayout (main layout shell), SplitPane
│   │   ├── PathBar/              # Breadcrumb navigation + back/forward/up
│   │   ├── Preview/              # File preview panel (multi-type)
│   │   ├── SearchBar/            # Search input
│   │   ├── Sidebar/              # Sidebar with system dirs, favorites, drives
│   │   ├── StatusBar/            # Bottom bar with path, copy, quick commands, terminal toggle
│   │   ├── Terminal/             # Built-in terminal panel (xterm.js)
│   │   └── Toolbar/              # Top toolbar with view mode, sort, search, group
│   ├── hooks/
│   │   ├── useContextMenu.ts     # Global click-to-close for context menu
│   │   ├── useFileSystem.ts      # Wraps Tauri invoke calls for file operations
│   │   ├── useFileWatcher.ts     # Auto-refresh on filesystem changes
│   │   ├── useGitStatus.ts       # Git repository status hook
│   │   └── useKeyboard.ts        # Global keyboard shortcuts
│   ├── layout/
│   │   ├── types.ts              # LayoutNode / LayoutSplit / LayoutLeaf
│   │   ├── LayoutEngine.tsx      # Recursive layout renderer
│   │   └── index.ts              # Barrel export
│   ├── plugins/
│   │   ├── types.ts              # PluginDefinition, PluginPosition, etc.
│   │   ├── registry.ts           # registerPlugin / getAllPlugins
│   │   ├── pluginStore.ts        # Zustand store for plugin visibility, sizes, active tab
│   │   ├── eventBus.ts           # Lightweight pub/sub event bus
│   │   ├── index.ts              # Init all built-in plugins
│   │   ├── FileExplorer/         # Left sidebar plugin
│   │   ├── Terminal/             # Bottom terminal plugin
│   │   ├── Output/               # Bottom output log plugin
│   │   ├── Tasks/                # Bottom tasks panel
│   │   ├── PreviewPlugin/        # Right preview panel plugin wrapper
│   │   ├── MarkdownPreview/      # Right markdown preview plugin
│   │   ├── DiffViewer/           # Right diff comparison plugin
│   │   └── GitStatus/            # Right git status overview plugin
│   ├── stores/
│   │   ├── fileStore.ts          # Zustand store: navigation, entries, columns, sorting, grouping, tabs
│   │   └── uiStore.ts            # Zustand store: view mode, selection, clipboard, dialogs, quick cmds
│   ├── types/
│   │   └── file.ts               # TypeScript interfaces and enums
│   └── utils/
│       ├── constants.ts          # Size units, system dir names, icon colors
│       ├── formatters.ts         # Size, date, file type formatting + grouping + extension checks
│       └── fuzzyMatch.ts         # Fuzzy string matching for search
├── src-tauri/                    # Rust backend
│   ├── src/
│   │   ├── lib.rs                # Tauri builder with all command registrations
│   │   ├── main.rs               # Entry point
│   │   ├── models/
│   │   │   └── file_entry.rs     # FileEntry struct + FileInfo
│   │   └── commands/
│   │       ├── file_ops.rs       # list_directory, create_directory, rename_item, delete_item, get_file_info
│   │       ├── clipboard.rs      # copy_items, move_items
│   │       ├── search.rs         # search_files, search_content
│   │       ├── diff.rs           # diff_files (similar crate)
│   │       ├── highlight.rs      # highlight_file (Arborium)
│   │       ├── watcher.rs        # File system change watcher (notify)
│   │       ├── git.rs            # get_git_status (git2)
│   │       └── system.rs         # get_system_dirs, get_drives, get_home_dir, read_text_file, read_file_bytes
│   ├── Cargo.toml
│   └── tauri.conf.json           # Tauri configuration
├── package.json
└── vite.config.ts
```

## 常用命令 / Quick Reference

| 操作 | 命令 |
|------|------|
| 安装依赖 | `npm install` |
| 本地调试（前端热重载 + Rust） | `npm run tauri dev` |
| 单独前端开发服务器 | `npm run dev` |
| TypeScript 类型检查 | `npx tsc --noEmit` |
| Rust 编译检查 | `cd src-tauri && cargo check` |
| Vite 生产构建 | `npx vite build` |
| **完整 Tauri 打包** | `npm run tauri build` |

### 构建产物 / Build Artifacts

```
src-tauri/target/release/
├── tauri-finder.exe                 # 独立可执行文件
└── bundle/
    ├── msi/Finder_0.1.0_x64_en-US.msi   # MSI 安装包
    └── nsis/Finder_0.1.0_x64-setup.exe  # NSIS 安装包
```

## Prerequisites

- **Node.js** 18+
- **Rust** toolchain (install via [rustup.rs](https://rustup.rs/))
- **Visual Studio 2022/2026** Build Tools with "Desktop development with C++" workload
  (provides MSVC linker and Windows SDK)

## Getting Started

```bash
# Install frontend dependencies
npm install

# Run in development mode (hot-reload frontend + Rust backend)
npm run tauri dev

# Build for production
npm run tauri build
```

## License

MIT
