use std::process::Command;

/// 向 opencode CLI 发送自然语言指令并获取结果
#[specta::specta]
#[tauri::command]
pub fn ai_ask(prompt: String, current_dir: String) -> Result<String, String> {
    // 构建一个系统提示，描述可用的工具
    let system_hint = format!(
        "你是 tauri-finder 文件管理器的 AI 助手。\
        你可以使用以下工具操作文件系统：\
        list_directory、search_files、search_content、read_text_file、\
        get_file_info、create_directory、rename_item、delete_item、\
        copy_items、move_items、diff_files、highlight_file、get_git_status。\
        \
        请分析用户需求并逐步执行。\
        每次返回 JSON 格式：{{\"tool\": \"工具名\", \"args\": {{...}}}}\
        或直接回复文本。\
        \
        当前目录: {}",
        current_dir
    );

    // 尝试调用 opencode CLI
    let output = Command::new("opencode")
        .args(["run", "--format", "json", "--dangerously-skip-permissions"])
        .arg(&system_hint)
        .arg(&prompt)
        .output()
        .map_err(|e| format!("opencode 调用失败: {}。请确保已安装 opencode (npm install -g opencode-ai)", e))?;

    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout);
        Ok(stdout.to_string())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        // opencode 不可用时的回退提示
        Err(format!(
            "opencode 执行失败: {}\n\
             请安装 opencode: npm install -g opencode-ai\n\
             或在 AI 助手面板中切换到 API 模式并配置 API Key",
            stderr
        ))
    }
}
