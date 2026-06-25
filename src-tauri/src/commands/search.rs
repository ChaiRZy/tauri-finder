use crate::commands::file_ops::entry_from_path;
use crate::models::file_entry::FileEntry;
use serde::Serialize;
use specta::Type;
use std::io::Read;
use walkdir::WalkDir;

/// Search for files and directories by name (case-insensitive matching).
/// Stops recursing into directories named 'node_modules', '.git', '.svn' to avoid deep scans.
#[specta::specta]
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

    results.truncate(200);
    Ok(results)
}

/// A single match result from content search.
#[derive(Serialize, Type)]
pub struct ContentMatch {
    pub path: String,
    pub line: u32,
    pub content: String,
}

/// Search file contents for a given query string.
/// Only searches text-like files (by extension). Returns matching lines.
#[specta::specta]
#[tauri::command]
pub fn search_content(query: String, base_path: String) -> Result<Vec<ContentMatch>, String> {
    if query.trim().is_empty() {
        return Ok(Vec::new());
    }

    let query_lower = query.to_lowercase();
    let mut results: Vec<ContentMatch> = Vec::new();

    for entry in WalkDir::new(&base_path)
        .follow_links(false)
        .into_iter()
        .filter_entry(|e| {
            let name = e.file_name().to_string_lossy();
            !matches!(name.as_ref(), "node_modules" | ".git" | ".svn" | "target")
        })
    {
        let entry = match entry {
            Ok(e) => e,
            Err(_) => continue,
        };

        if !entry.file_type().is_file() {
            continue;
        }

        // Only search text-like extensions
        let ext = entry
            .path()
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("");
        if !is_text_extension(ext) {
            continue;
        }

        // Skip binary files by checking first few bytes
        let path = entry.path();
        let mut file = match std::fs::File::open(path) {
            Ok(f) => f,
            Err(_) => continue,
        };

        let mut first_bytes = [0u8; 512];
        let n = file.read(&mut first_bytes).unwrap_or(0);
        if n > 0 && first_bytes[..n].contains(&0) {
            continue; // likely binary
        }

        // Re-read the file as text
        let mut content = String::new();
        if std::fs::read_to_string(path).ok().map_or(true, |text| {
            content = text;
            false
        }) {
            continue;
        }

        for (i, line) in content.lines().enumerate() {
            if line.to_lowercase().contains(&query_lower) {
                results.push(ContentMatch {
                    path: path.to_string_lossy().to_string(),
                    line: i as u32 + 1,
                    content: line.to_string(),
                });
                if results.len() >= 100 {
                    // cap results
                    return Ok(results);
                }
            }
        }
    }

    Ok(results)
}

fn is_text_extension(ext: &str) -> bool {
    matches!(
        ext,
        "txt" | "md"
            | "json" | "js" | "ts" | "jsx" | "tsx"
            | "css" | "scss" | "less"
            | "html" | "htm" | "xml" | "svg"
            | "yaml" | "yml" | "toml" | "ini" | "cfg"
            | "py" | "rb" | "rs" | "go" | "java" | "c" | "cpp" | "h" | "hpp" | "cs"
            | "swift" | "kt" | "scala"
            | "php" | "pl" | "lua"
            | "sh" | "bash" | "zsh" | "bat" | "ps1"
            | "sql" | "r" | "m" | "mm"
            | "log" | "env" | "gitignore" | "dockerfile"
            | "gradle" | "sbt" | "lock" | "conf"
    )
}
