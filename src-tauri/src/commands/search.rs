use crate::commands::file_ops::entry_from_path;
use crate::models::file_entry::FileEntry;
use walkdir::WalkDir;

/// Search for files and directories by name (case-insensitive matching).
/// Stops recursing into directories named 'node_modules', '.git', '.svn' to avoid deep scans.
#[tauri::command]
pub fn search_files(query: String, base_path: String) -> Result<Vec<FileEntry>, String> {
    if query.trim().is_empty() {
        return Ok(Vec::new());
    }

    let query_lower = query.to_lowercase();
    let mut results: Vec<FileEntry> = Vec::new();

    for entry in WalkDir::new(&base_path)
        .follow_links(false)
        .into_iter()
        .filter_entry(|e| {
            let name = e.file_name().to_string_lossy();
            !matches!(name.as_ref(), "node_modules" | ".git" | ".svn" | "target")
        })
    {
        let entry = entry.map_err(|e| format!("Walk error: {}", e))?;
        let name = entry.file_name().to_string_lossy().to_string();
        if name.to_lowercase().contains(&query_lower) {
            let file_entry = entry_from_path(entry.path())?;
            results.push(file_entry);
        }
    }

    // Limit results to a reasonable number
    results.truncate(200);

    Ok(results)
}
