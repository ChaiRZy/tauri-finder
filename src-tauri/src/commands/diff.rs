use serde::Serialize;
use similar::{ChangeTag, TextDiff};
use specta::Type;

/// A single diff operation (insertion, deletion, or unchanged line).
#[derive(Serialize, Type)]
pub struct DiffLine {
    pub tag: String,    // "equal" | "insert" | "delete"
    pub line_a: Option<u32>,
    pub line_b: Option<u32>,
    pub content: String,
}

/// Diff the contents of two files line by word level, returning all changes.
#[specta::specta]
#[tauri::command]
pub fn diff_files(path_a: String, path_b: String) -> Result<Vec<DiffLine>, String> {
    let text_a = std::fs::read_to_string(&path_a)
        .map_err(|e| format!("Failed to read {}: {}", path_a, e))?;
    let text_b = std::fs::read_to_string(&path_b)
        .map_err(|e| format!("Failed to read {}: {}", path_b, e))?;

    let diff = TextDiff::from_lines(&text_a, &text_b);
    let mut result: Vec<DiffLine> = Vec::new();

    for change in diff.iter_all_changes() {
        let tag = match change.tag() {
            ChangeTag::Equal => "equal",
            ChangeTag::Insert => "insert",
            ChangeTag::Delete => "delete",
        };

        result.push(DiffLine {
            tag: tag.to_string(),
            line_a: change.old_index().map(|i| i as u32 + 1),
            line_b: change.new_index().map(|i| i as u32 + 1),
            content: change.value().to_string(),
        });
    }

    Ok(result)
}
