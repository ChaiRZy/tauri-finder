use serde::Serialize;
use specta::Type;
use std::path::Path;

#[derive(Debug, Serialize, Type)]
pub struct GitFileStatus {
    pub path: String,
    pub status: String,
    pub staged: bool,
}

/// Retrieve git status for files under the given directory.
/// Returns an empty vec if the directory is not inside a git repository.
#[specta::specta]
#[tauri::command]
pub fn get_git_status(path: String) -> Result<Vec<GitFileStatus>, String> {
    let repo_path = find_git_repo(&path).ok_or_else(|| "Not a git repository".to_string())?;
    let repo = git2::Repository::open(&repo_path).map_err(|e| e.to_string())?;

    let mut opts = git2::StatusOptions::new();
    opts.include_untracked(true)
        .recurse_untracked_dirs(true);

    let statuses = repo.statuses(Some(&mut opts)).map_err(|e| e.to_string())?;

    let mut result = Vec::new();
    for entry in statuses.iter() {
        let path_str = entry
            .path()
            .unwrap_or("")
            .to_string();

        // Only include files within the requested directory
        let full_path = repo_path.join(&path_str);
        let req_path = Path::new(&path);
        if !full_path.starts_with(req_path) {
            continue;
        }

        let flags = entry.status();
        let (status, staged) = classify_status(flags);

        result.push(GitFileStatus {
            path: path_str,
            status,
            staged,
        });
    }

    Ok(result)
}

fn classify_status(flags: git2::Status) -> (String, bool) {
    if flags.intersects(git2::Status::CONFLICTED) {
        ("conflict".into(), false)
    } else if flags.intersects(git2::Status::INDEX_NEW) {
        ("staged".into(), true)
    } else if flags.intersects(git2::Status::INDEX_MODIFIED) {
        ("staged".into(), true)
    } else if flags.intersects(git2::Status::INDEX_DELETED) {
        ("staged".into(), true)
    } else if flags.intersects(git2::Status::INDEX_RENAMED) {
        ("staged".into(), true)
    } else if flags.intersects(git2::Status::WT_MODIFIED) {
        ("modified".into(), false)
    } else if flags.intersects(git2::Status::WT_DELETED) {
        ("deleted".into(), false)
    } else if flags.intersects(git2::Status::WT_RENAMED) {
        ("renamed".into(), false)
    } else if flags.intersects(git2::Status::WT_NEW) {
        ("untracked".into(), false)
    } else {
        ("unknown".into(), false)
    }
}

/// Walk up from `path` to find the nearest `.git` directory.
fn find_git_repo(path: &str) -> Option<std::path::PathBuf> {
    let mut current = std::path::PathBuf::from(path);
    loop {
        let git_dir = current.join(".git");
        if git_dir.exists() {
            return Some(current);
        }
        if !current.pop() {
            return None;
        }
    }
}
