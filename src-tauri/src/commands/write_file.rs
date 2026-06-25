/// 写入文本文件（供 AI 助手使用）
#[specta::specta]
#[tauri::command]
pub fn write_text_file(path: String, content: String) -> Result<(), String> {
    std::fs::write(&path, &content)
        .map_err(|e| format!("写入文件失败 {}: {}", path, e))
}
