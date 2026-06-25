# project_memory

> 项目级记忆，供未来重新接手时直接复用

## 仓库信息

- 实际路径: `D:\project\crz\myDoc\tauri-finder`
- temp 路径: `temp\projects\tauri-finder-c1d7876a`（是 junction，指向实际路径）
- GitHub: `ChaiRZy/tauri-finder`（公开仓库）
- 分支: `main`
- Remote: `git@github.com:ChaiRZy/tauri-finder.git`（**必须用 SSH**，HTTPS 443 被内网防火墙封了，`gh` CLI 能走 API 但 git HTTPS push 不通）
- .gitignore 已排除: `node_modules/`, `dist/`, `src-tauri/target/`（7GB 缓存）, `src-tauri/2`（npm 残留日志）

## 构建环境

- Tauri v2 + React 19 + TypeScript + Rust
- Cargo.toml 有 2 个 binary: `tauri-finder`(主应用) 和 `export_specta`(类型导出工具)
- ⚠️ 添加新 binary 后必须设 `[package] default-run = "tauri-finder"`，否则 `cargo run` / `npm run tauri dev` 报错
- `npm run dev` → Vite 开发服务器
- `npm run tauri dev` → Tauri 桌面应用开发模式
- `npm run tauri build` → 打包
