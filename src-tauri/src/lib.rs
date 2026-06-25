mod commands;
mod models;

use specta_typescript::Typescript;
use tauri_specta::Builder;

/// Build the tauri_specta collector with all commands registered.
/// This is shared between the app and the type export test.
fn specta_builder() -> Builder<tauri::Wry> {
    Builder::new()
        .commands(tauri_specta::collect_commands![
            commands::file_ops::list_directory,
            commands::file_ops::get_file_info,
            commands::file_ops::create_directory,
            commands::file_ops::rename_item,
            commands::file_ops::delete_item,
            commands::clipboard::copy_items,
            commands::clipboard::move_items,
            commands::diff::diff_files,
            commands::search::search_files,
            commands::search::search_content,
            commands::highlight::highlight_file,
            commands::system::get_system_dirs,
            commands::system::get_drives,
            commands::system::get_home_dir,
            commands::system::read_text_file,
            commands::system::read_file_bytes,
            commands::git::get_git_status,
            commands::write_file::write_text_file,
            commands::ai::ai_ask,
            // 注意: MCP 命令使用了递归的 serde_json::Value (input_schema/arguments/data)，
            // specta-typescript 处理递归类型时会栈溢出。MCP 命令不需要前端 TS 绑定，
            // 已在 run() 中通过 tauri::generate_handler! 单独注册。
        ])
}

/// Export TypeScript bindings to the frontend src directory.
/// Can be called from a standalone binary or tests.
pub fn export_typescript_bindings() {
    let builder = specta_builder();
    builder
        .export(Typescript::default(), "../src/bindings.ts")
        .expect("Failed to export typescript bindings");
    println!("✅ bindings.ts exported to ../src/bindings.ts");
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = specta_builder();

    #[cfg(debug_assertions)]
    builder
        .export(Typescript::default(), "../src/bindings.ts")
        .expect("Failed to export typescript bindings");

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_notification::init())
        .setup(|app| {
            // Start watching the home directory; will be updated as user navigates
            if let Some(home) = dirs::home_dir() {
                commands::watcher::start_watcher(app.handle().clone(), home);
            }
            Ok(())
        })
        .invoke_handler(builder.invoke_handler())
        .invoke_handler(tauri::generate_handler![
            commands::mcp::mcp_list_tools,
            commands::mcp::mcp_call_tool,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod test {
    use super::*;

    #[test]
    fn export_types() {
        let builder = specta_builder();
        builder
            .export(Typescript::default(), "../src/bindings.ts")
            .expect("Failed to export typescript bindings");
        println!("Typescript bindings exported to ../src/bindings.ts");
        assert!(std::path::Path::new("../src/bindings.ts").exists());
    }
}
