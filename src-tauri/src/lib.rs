mod commands;
mod models;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::file_ops::list_directory,
            commands::file_ops::get_file_info,
            commands::file_ops::create_directory,
            commands::file_ops::rename_item,
            commands::file_ops::delete_item,
            commands::clipboard::copy_items,
            commands::clipboard::move_items,
            commands::search::search_files,
            commands::system::get_system_dirs,
            commands::system::get_drives,
            commands::system::get_home_dir,
            commands::system::read_text_file,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
