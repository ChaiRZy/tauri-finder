use crate::commands::file_ops::entry_from_path;
use crate::models::file_entry::FileEntry;
use std::path::PathBuf;

/// Get the standard system directories (Desktop, Downloads, Documents, etc.).
#[specta::specta]
#[tauri::command]
pub fn get_system_dirs() -> Result<Vec<FileEntry>, String> {
    let mut entries: Vec<FileEntry> = Vec::new();

    // Known system folder names
    let folder_names = [
        "Desktop",
        "Downloads",
        "Documents",
        "Pictures",
        "Music",
        "Videos",
    ];

    for name in &folder_names {
        if let Some(path) = dirs_data_dir(name) {
            if path.exists() {
                if let Ok(entry) = entry_from_path(&path) {
                    entries.push(entry);
                }
            }
        }
    }

    // Add home directory
    if let Some(home) = dirs::home_dir() {
        if let Ok(entry) = entry_from_path(&home) {
            entries.push(entry);
        }
    }

    Ok(entries)
}

/// Helper to get platform-specific data directories.
fn dirs_data_dir(name: &str) -> Option<PathBuf> {
    match name {
        "Desktop" => dirs::desktop_dir(),
        "Downloads" => dirs::download_dir(),
        "Documents" => dirs::document_dir(),
        "Pictures" => dirs::picture_dir(),
        "Music" => dirs::audio_dir(),
        "Videos" => dirs::video_dir(),
        _ => None,
    }
}

/// Get the list of available drives on Windows (e.g. C:\, D:\).
/// On non-Windows systems, returns the root "/" directory.
#[specta::specta]
#[tauri::command]
pub fn get_drives() -> Result<Vec<String>, String> {
    let mut drives: Vec<String> = Vec::new();

    #[cfg(target_os = "windows")]
    {
        for letter in 'A'..='Z' {
            let path = format!("{}:\\", letter);
            if std::path::Path::new(&path).exists() {
                drives.push(path);
            }
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        drives.push("/".to_string());
    }

    Ok(drives)
}

/// Get the current user's home directory path.
#[specta::specta]
#[tauri::command]
pub fn get_home_dir() -> Result<String, String> {
    dirs::home_dir()
        .map(|p| p.to_string_lossy().to_string())
        .ok_or_else(|| "Could not determine home directory".to_string())
}

/// Read a text file's contents (first 10KB) for preview purposes.
#[specta::specta]
#[tauri::command]
pub fn read_text_file(path: String) -> Result<String, String> {
    use std::fs;
    use std::io::Read;

    let max_bytes: usize = 10 * 1024; // 10KB limit
    let mut file = fs::File::open(&path).map_err(|e| format!("Failed to open file: {}", e))?;

    let mut buffer = vec![0u8; max_bytes];
    let n = file
        .read(&mut buffer)
        .map_err(|e| format!("Failed to read file: {}", e))?;
    buffer.truncate(n);

    String::from_utf8(buffer).map_err(|_| "File is not valid UTF-8 text".to_string())
}

/// Read raw bytes from a file (up to max_bytes).
#[specta::specta]
#[tauri::command]
pub fn read_file_bytes(path: String, max_bytes: u32) -> Result<Vec<u8>, String> {
    use std::io::Read;

    let mut f = std::fs::File::open(&path).map_err(|e| e.to_string())?;
    let mut buf = vec![0u8; max_bytes as usize];
    let n = f.read(&mut buf).map_err(|e| e.to_string())?;
    buf.truncate(n);
    Ok(buf)
}
