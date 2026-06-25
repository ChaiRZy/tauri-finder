# WI-03: Preview Panel 预览增强

## 概述

增强现有的 `PreviewPanel` 组件，支持更多文件类型的预览：视频、音频、PDF、JSON 格式化树、大文件安全警告、二进制 hex 视图。

## 文件清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/utils/formatters.ts` | 修改 | 新增 `isVideoExtension` `isAudioExtension` `isPdfExtension` 等方法 |
| `src/components/Preview/PreviewPanel.tsx` | 修改 | 增加多类型渲染分支 |
| `src/components/Preview/PreviewPanel.css` | 修改 | 新增视频/音频/PDF/hex 样式 |

## 契约与骨架

### 新增工具函数（formatters.ts）

```ts
isVideoExtension(ext: string): boolean  // mp4, webm, avi, mov, mkv, flv
isAudioExtension(ext: string): boolean  // mp3, wav, flac, ogg, aac, m4a
isPdfExtension(ext: string): boolean    // pdf
isJsonExtension(ext: string): boolean   // json
isBinaryExtension(ext: string): boolean // exe, dll, bin, dat, etc.
```

### PreviewPanel 渲染分支

```
选中文件
  ├─ 图片 (.png/.jpg/...):   <img> (已有)
  ├─ 视频 (.mp4/.webm/...):  <video controls src="file://..." />
  ├─ 音频 (.mp3/.wav/...):   <audio controls src="file://..." />
  ├─ PDF (.pdf):             <iframe src="file://..." />
  ├─ JSON (.json):           带格式化 + 折叠的 JSON 树（轻量实现）
  ├─ 文本 (.txt/.js/...):    syntax highlight (已有)
  ├─ 大文件 (>10MB):         先显示警告，用户确认后再渲染
  ├─ 二进制 (其他):           hex dump 前 512 字节
  └─ 目录:                   现有信息面板
```

### JSON 树渲染

轻量实现（不引入第三方 JSON viewer）：
- 用 `JSON.parse` 解析后递归渲染
- 缩进 + 颜色区分 key/value/type
- 可折叠对象/数组（用 `<details>` + `<summary>`）

### 大文件安全

```ts
const LARGE_FILE_THRESHOLD = 10 * 1024 * 1024; // 10MB
if (selectedEntry.size > LARGE_FILE_THRESHOLD) {
  // 显示警告按钮，点击后继续渲染
}
```

### Hex Dump

```ts
async function renderHexDump(path: string): Promise<string> {
  const buffer = await invoke('read_file_bytes', { path, maxBytes: 512 });
  // 按 16 字节一行格式化: offset | hex | ascii
}
```

需要新增 Rust command `read_file_bytes`。

## Rust 端新增

### `src-tauri/src/commands/system.rs` 新增命令

```rust
#[tauri::command]
fn read_file_bytes(path: String, max_bytes: usize) -> Result<Vec<u8>, String> {
    let mut f = std::fs::File::open(&path).map_err(|e| e.to_string())?;
    let mut buf = vec![0u8; max_bytes];
    let n = f.read(&mut buf).map_err(|e| e.to_string())?;
    buf.truncate(n);
    Ok(buf)
}
```

需在 `lib.rs` 注册。

## 流程概述

```
PreviewPanel useEffect(selectedEntry)
  → 判断文件类型（extension/mime）
  → 按类型分支渲染
    - video: <video> tag with file:// URL
    - audio: <audio> tag with file:// URL
    - pdf: <iframe> tag with file:// URL
    - json: 递归渲染折叠树
    - text: 现有 syntax highlight
    - binary: hex dump via read_file_bytes
    - default: 现有信息面板
```

## 任务拆分

| ID | 标题 | 复杂度 | 依赖 | 验收点 |
|----|------|--------|------|--------|
| WI-03-01 | 新增工具函数 + Rust read_file_bytes | S | 无 | 编译通过，formatters 新增 4 个函数 |
| WI-03-02 | 视频/音频/PDF 渲染分支 | S | WI-03-01 | 选中 .mp4/.mp3/.pdf 正确渲染 |
| WI-03-03 | JSON 格式化折叠树 | M | WI-03-01 | JSON 文件显示可折叠树 |
| WI-03-04 | 大文件警告 + Hex dump | S | WI-03-01 | 大文件显示确认按钮，二进制显示 hex |
| WI-03-05 | 回归验证：构建 + 多类型文件预览测试 | S | WI-03-02~04 | `npm run build` 通过，各类型预览正常 |

## Sub-agent Briefing

### WI-03-01: 工具函数 + Rust 命令

- 目标：在 formatters.ts 添加 isVideo/Audio/Pdf/Json/Binary 函数，新增 Rust read_file_bytes 命令
- 复杂度：S
- 允许修改：`src/utils/formatters.ts`, `src-tauri/src/commands/system.rs`, `src-tauri/src/lib.rs`
- 关键契约：
  - 新增 `isVideoExtension`, `isAudioExtension`, `isPdfExtension`, `isJsonExtension`, `isBinaryExtension`
  - Rust 命令签名: `fn read_file_bytes(path: String, max_bytes: usize) -> Result<Vec<u8>, String>`
- 验收点：编译通过

### WI-03-02: 视频/音频/PDF 渲染

- 目标：在 PreviewPanel 中增加 3 个渲染分支
- 复杂度：S
- 依赖：WI-03-01
- 允许修改：`src/components/Preview/PreviewPanel.tsx`
- 关键契约：
  - video: `<video controls src="file://${path}" style="max-width:100%;max-height:70%">`
  - audio: `<audio controls src="file://${path}" style="width:100%">`
  - pdf: `<iframe src="file://${path}" style="width:100%;height:70%">`
- 验收点：选中对应文件类型时正确渲染媒体元素

### WI-03-03: JSON 格式化树

- 目标：JSON 文件显示递归可折叠树
- 复杂度：M
- 依赖：WI-03-01
- 允许修改：`src/components/Preview/PreviewPanel.tsx`
- 验收点：JSON 文件渲染结构清晰，可折叠展开

### WI-03-04: 大文件 + Hex 视图

- 目标：大文件(>10MB)显示警告；二进制文件显示 hex dump
- 复杂度：S
- 依赖：WI-03-01
- 允许修改：`src/components/Preview/PreviewPanel.tsx`, `PreviewPanel.css`
- 验收点：大文件先弹警告后渲染；二进制显示 hex 格子
