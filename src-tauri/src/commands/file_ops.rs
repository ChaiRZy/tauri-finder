use crate::models::file_entry::{FileEntry, FileInfo};
use chrono::{DateTime, Utc};
use std::fs;
use std::path::Path;

/// Build a FileEntry from a filesystem path for display.
/// Uses the metadata to populate all fields.
pub(super) fn entry_from_path(path: &Path) -> Result<FileEntry, String> {
    let meta = fs::metadata(path).map_err(|e| format!("Failed to read metadata: {}", e))?;
    let name = path
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_default();
    let extension = path
        .extension()
        .map(|e| e.to_string_lossy().to_lowercase())
        .unwrap_or_default();
    let mime_type = if meta.is_dir() {
        "inode/directory".to_string()
    } else {
        mime_guess::from_path(path)
            .first_or_octet_stream()
            .to_string()
    };

    Ok(FileEntry {
        name,
        path: path.to_string_lossy().to_string(),
        is_dir: meta.is_dir(),
        size: meta.len(),
        modified_at: meta
            .modified()
            .ok()
            .and_then(|t| {
                DateTime::<Utc>::from(t)
                    .to_rfc3339_opts(chrono::SecondsFormat::Secs, true)
                    .into()
            })
            .unwrap_or_default(),
        created_at: meta
            .created()
            .ok()
            .and_then(|t| {
                DateTime::<Utc>::from(t)
                    .to_rfc3339_opts(chrono::SecondsFormat::Secs, true)
                    .into()
            })
            .unwrap_or_default(),
        is_symlink: meta.file_type().is_symlink(),
        extension,
        mime_type,
    })
}

/// List all entries in a given directory.
/// Returns a sorted vector: directories first, then files, both alphabetically.
#[specta::specta]
#[tauri::command]
pub fn list_directory(path: String) -> Result<Vec<FileEntry>, String> {
    let dir = Path::new(&path);
    if !dir.is_dir() {
        return Err(format!("Not a directory: {}", path));
    }

    let mut entries: Vec<FileEntry> = Vec::new();
    let rd = fs::read_dir(dir).map_err(|e| format!("Failed to read directory: {}", e))?;

    for entry in rd {
        let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
        let file_entry = entry_from_path(&entry.path())?;
        entries.push(file_entry);
    }

    // Sort: directories first, then by name (case-insensitive)
    entries.sort_by(|a, b| {
        if a.is_dir != b.is_dir {
            b.is_dir.cmp(&a.is_dir)
        } else {
            a.name.to_lowercase().cmp(&b.name.to_lowercase())
        }
    });

    Ok(entries)
}

/// Get detailed info about a single file or directory.
#[specta::specta]
#[tauri::command]
pub fn get_file_info(path: String) -> Result<FileInfo, String> {
    let p = Path::new(&path);
    let entry = entry_from_path(p)?;
    let meta = fs::metadata(p).map_err(|e| format!("Failed to read metadata: {}", e))?;

    let mut perms = String::new();
    let p = meta.permissions();
    perms.push(if p.readonly() { 'r' } else { 'w' });
    perms.push_str("-------");

    Ok(FileInfo {
        entry,
        permissions: perms,
        accessible: true,
    })
}

/// Create a new directory at the given path.
/// The parent directory must already exist.
#[specta::specta]
#[tauri::command]
pub fn create_directory(path: String) -> Result<FileEntry, String> {
    let p = Path::new(&path);
    fs::create_dir(p).map_err(|e| format!("Failed to create directory: {}", e))?;
    entry_from_path(p)
}

/// Rename (or move) a file/directory from old_path to new_path.
#[specta::specta]
#[tauri::command]
pub fn rename_item(old_path: String, new_path: String) -> Result<FileEntry, String> {
    let old = Path::new(&old_path);
    let new = Path::new(&new_path);
    fs::rename(old, new).map_err(|e| format!("Failed to rename: {}", e))?;
    entry_from_path(new)
}

/// Delete a file or directory at the given path.
/// If permanent is true, deletion is irreversible. If false, we delete permanently for now.
/// Directory removal recursively deletes all contents.
#[specta::specta]
#[tauri::command]
pub fn delete_item(path: String) -> Result<(), String> {
    let p = Path::new(&path);
    if !p.exists() {
        return Err(format!("Path does not exist: {}", path));
    }
    if p.is_dir() {
        fs::remove_dir_all(p).map_err(|e| format!("Failed to remove directory: {}", e))?;
    } else {
        fs::remove_file(p).map_err(|e| format!("Failed to remove file: {}", e))?;
    }
    Ok(())
}
