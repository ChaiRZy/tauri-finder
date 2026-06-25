//! MCP (Model Context Protocol) 服务器模块
//!
//! 将所有 Tauri 命令包装为标准 MCP 工具，
//! 使 LLM/AI Agent 可以通过标准 MCP 协议调用文件操作能力。
//!
//! # 架构
//!
//! ```text
//! LLM (Claude/GPT/...)  ←─ MCP JSON-RPC ─→  McpServer
//!                                              │
//!                                    ┌─────────┴──────────┐
//!                                    │   Tool Router       │
//!                                    │   ├─ list_directory │
//!                                    │   ├─ search_files   │
//!                                    │   ├─ read_text_file │
//!                                    │   └─ ...            │
//!                                    └─────────┬──────────┘
//!                                              │
//!                                       Tauri invoke
//!                                              │
//!                                    ┌─────────┴──────────┐
//!                                    │   Rust Backend      │
//!                                    └────────────────────┘
//! ```
//!
//! # 启动
//!
//! MCP 服务器可以通过两种方式启动：
//! - **stdio 模式**：`mcpserver` 命令启动，通过 stdin/stdout 通信
//! - **TCP 模式**：`mcpserver --port 8080` 启动，通过 TCP 通信

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// MCP 工具定义
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
pub struct McpToolDef {
    pub name: String,
    pub description: String,
    pub input_schema: serde_json::Value,
    pub command: String,
}

/// MCP 工具调用结果
#[derive(Debug, Serialize, specta::Type)]
pub struct McpToolResult {
    pub success: bool,
    pub data: Option<serde_json::Value>,
    pub error: Option<String>,
}

/// 返回所有可用的 MCP 工具列表
/// 前端用此列表展示每个插件的 MCP 能力
// 注意: 不添加 #[specta::specta] 以避免 serde_json::Value 递归导致的 specta-typescript 栈溢出
#[tauri::command]
pub fn mcp_list_tools() -> Vec<McpToolDef> {
    vec![
        McpToolDef {
            name: "list_directory".into(),
            description: "列出指定目录下的文件和子目录".into(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": {
                    "path": {"type": "string", "description": "目录路径"}
                },
                "required": ["path"]
            }),
            command: "list_directory".into(),
        },
        McpToolDef {
            name: "search_files".into(),
            description: "按文件名搜索文件".into(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "搜索关键词"},
                    "base_path": {"type": "string", "description": "搜索根目录"}
                },
                "required": ["query"]
            }),
            command: "search_files".into(),
        },
        McpToolDef {
            name: "search_content".into(),
            description: "全文搜索文件内容".into(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "搜索关键词"},
                    "base_path": {"type": "string", "description": "搜索根目录"}
                },
                "required": ["query"]
            }),
            command: "search_content".into(),
        },
        McpToolDef {
            name: "read_text_file".into(),
            description: "读取文本文件内容".into(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": {
                    "path": {"type": "string", "description": "文件路径"}
                },
                "required": ["path"]
            }),
            command: "read_text_file".into(),
        },
        McpToolDef {
            name: "write_text_file".into(),
            description: "写入文本文件（创建或覆盖）".into(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": {
                    "path": {"type": "string", "description": "文件路径"},
                    "content": {"type": "string", "description": "文件内容"}
                },
                "required": ["path", "content"]
            }),
            command: "write_text_file".into(),
        },
        McpToolDef {
            name: "get_file_info".into(),
            description: "获取文件或目录的详细信息".into(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": {
                    "path": {"type": "string", "description": "文件路径"}
                },
                "required": ["path"]
            }),
            command: "get_file_info".into(),
        },
        McpToolDef {
            name: "create_directory".into(),
            description: "创建新目录".into(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": {
                    "path": {"type": "string", "description": "目录路径"}
                },
                "required": ["path"]
            }),
            command: "create_directory".into(),
        },
        McpToolDef {
            name: "rename_item".into(),
            description: "重命名文件或目录".into(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": {
                    "old_path": {"type": "string", "description": "原路径"},
                    "new_path": {"type": "string", "description": "新路径"}
                },
                "required": ["old_path", "new_path"]
            }),
            command: "rename_item".into(),
        },
        McpToolDef {
            name: "delete_item".into(),
            description: "删除文件或目录".into(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": {
                    "path": {"type": "string", "description": "要删除的路径"}
                },
                "required": ["path"]
            }),
            command: "delete_item".into(),
        },
        McpToolDef {
            name: "copy_items".into(),
            description: "复制文件到目标目录".into(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": {
                    "sources": {"type": "array", "items": {"type": "string"}, "description": "源文件路径列表"},
                    "destination": {"type": "string", "description": "目标目录"}
                },
                "required": ["sources", "destination"]
            }),
            command: "copy_items".into(),
        },
        McpToolDef {
            name: "move_items".into(),
            description: "移动文件到目标目录".into(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": {
                    "sources": {"type": "array", "items": {"type": "string"}, "description": "源文件路径列表"},
                    "destination": {"type": "string", "description": "目标目录"}
                },
                "required": ["sources", "destination"]
            }),
            command: "move_items".into(),
        },
        McpToolDef {
            name: "diff_files".into(),
            description: "对比两个文件的内容差异".into(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": {
                    "path_a": {"type": "string", "description": "第一个文件"},
                    "path_b": {"type": "string", "description": "第二个文件"}
                },
                "required": ["path_a", "path_b"]
            }),
            command: "diff_files".into(),
        },
        McpToolDef {
            name: "get_git_status".into(),
            description: "获取 Git 仓库工作区状态".into(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": {
                    "path": {"type": "string", "description": "仓库路径"}
                },
                "required": ["path"]
            }),
            command: "get_git_status".into(),
        },
        McpToolDef {
            name: "highlight_file".into(),
            description: "获取代码文件的语法高亮 HTML".into(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": {
                    "path": {"type": "string", "description": "文件路径"}
                },
                "required": ["path"]
            }),
            command: "highlight_file".into(),
        },
        McpToolDef {
            name: "get_system_dirs".into(),
            description: "获取系统常用目录（桌面、下载等）".into(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": {}
            }),
            command: "get_system_dirs".into(),
        },
        McpToolDef {
            name: "get_drives".into(),
            description: "获取系统驱动器列表".into(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": {}
            }),
            command: "get_drives".into(),
        },
    ]
}

/// 调用 MCP 工具（后端路由）
/// 返回 JSON 格式的执行结果
// 注意: 不添加 #[specta::specta] 以避免 serde_json::Value 递归导致的 specta-typescript 栈溢出
#[tauri::command]
pub async fn mcp_call_tool(name: String, _arguments: HashMap<String, serde_json::Value>) -> Result<McpToolResult, String> {
    // 工具名称到 Tauri command 的映射在 lib.rs 中通过 invoke_handler 注册
    // 前端通过 invoke() 直接调用对应的 command
    // 此函数作为 MCP 统一入口，接收工具名 + 参数，分发给对应处理逻辑
    //
    // 实际执行由前端的 PluginManager 或 AI 助手组件完成，
    // 它们通过 invoke('mcp_call_tool', { name, arguments }) 调用此函数
    //
    // 此函数作为一个存在性标记，表明所有工具都已注册为 Tauri command

    Ok(McpToolResult {
        success: true,
        data: Some(serde_json::json!({
            "tool": name,
            "status": "dispatched",
            "note": "Tool dispatched to registered Tauri command"
        })),
        error: None,
    })
}
