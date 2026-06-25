use arborium::{Config, Highlighter, HtmlFormat};

/// Highlight source code and return HTML with class-based syntax spans.
#[specta::specta]
#[tauri::command]
pub fn highlight_file(path: String) -> Result<Option<String>, String> {
    let content = std::fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read file: {}", e))?;

    let ext = std::path::Path::new(&path)
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("");

    let lang = extension_to_language(ext);
    if lang.is_empty() {
        return Ok(None);
    }

    let config = Config {
        html_format: HtmlFormat::ClassNames,
        ..Default::default()
    };
    let mut hl = Highlighter::with_config(config);
    let html = hl
        .highlight(lang, &content)
        .map_err(|e| format!("Highlight error: {}", e))?;

    Ok(Some(html))
}

fn extension_to_language(ext: &str) -> &'static str {
    match ext {
        "rs" => "rust",
        "go" => "go",
        "py" => "python",
        "js" | "mjs" => "javascript",
        "ts" => "typescript",
        "tsx" => "tsx",
        "jsx" => "tsx",
        "java" => "java",
        "c" | "h" => "c",
        "cpp" | "cc" | "cxx" | "hpp" => "cpp",
        "cs" => "c-sharp",
        "html" | "htm" => "html",
        "css" => "css",
        "json" => "json",
        "yaml" | "yml" => "yaml",
        "toml" => "toml",
        "lua" => "lua",
        "rb" => "ruby",
        "php" => "php",
        "swift" => "swift",
        "sql" => "sql",
        "xml" | "svg" | "xhtml" => "xml",
        "sh" | "bash" | "zsh" => "bash",
        "md" | "markdown" => "markdown",
        _ => "",
    }
}
