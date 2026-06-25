use crate::commands::file_ops::entry_from_path;
use crate::models::file_entry::FileEntry;
use std::fs;
use std::path::Path;

/// Internal copy function that handles both files and directories.
fn copy_recursive(src: &Path, dst: &Path) -> Result<(), String> {
    if src.is_dir() {
        fs::create_dir_all(dst).map_err(|e| format!("Failed to create dir: {}", e))?;
        for entry in fs::read_dir(src).map_err(|e| format!("Failed to read dir: {}", e))? {
            let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
            let entry_type = entry
                .file_type()
                .map_err(|e| format!("Failed to read file type: {}", e))?;
            let src_path = entry.path();
            let dst_path = dst.join(entry.file_name());
            if entry_type.is_dir() {
                copy_recursive(&src_path, &dst_path)?;
            } else {
                fs::copy(&src_path, &dst_path)
                    .map_err(|e| format!("Failed to copy file: {}", e))?;
            }
        }
        Ok(())
    } else {
        fs::copy(src, dst).map_err(|e| format!("Failed to copy file: {}", e))?;
        Ok(())
    }
}

/// Copy multiple source files/directories to a destination directory.
#[specta::specta]
#[tauri::command]
pub fn copy_items(sources: Vec<String>, destination: String) -> Result<Vec<FileEntry>, String> {
    let dst = Path::new(&destination);
    if !dst.is_dir() {
        return Err(format!("Destination is not a directory: {}", destination));
    }

    let mut results: Vec<FileEntry> = Vec::new();
    for src_path in &sources {
        let src = Path::new(src_path);
        let file_name = src
            .file_name()
            .ok_or_else(|| format!("Invalid path: {}", src_path))?;
        let dst_path = dst.join(file_name);

        copy_recursive(src, &dst_path)?;
        results.push(entry_from_path(&dst_path)?);
    }

    Ok(results)
}

/// Move multiple source files/directories to a destination directory.
#[specta::specta]
#[tauri::command]
pub fn move_items(sources: Vec<String>, destination: String) -> Result<Vec<FileEntry>, String> {
    let dst = Path::new(&destination);
    if !dst.is_dir() {
        return Err(format!("Destination is not a directory: {}", destination));
    }

    let mut results: Vec<FileEntry> = Vec::new();
    for src_path in &sources {
        let src = Path::new(src_path);
        let file_name = src
            .file_name()
            .ok_or_else(|| format!("Invalid path: {}", src_path))?;
        let dst_path = dst.join(file_name);

        fs::rename(src, &dst_path).map_err(|e| format!("Failed to move: {}", e))?;
        results.push(entry_from_path(&dst_path)?);
    }

    Ok(results)
}
