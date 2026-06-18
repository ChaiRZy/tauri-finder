use serde::{Deserialize, Serialize};

/// Represents a file or directory entry in the file system.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileEntry {
    /// File name (last component of path)
    pub name: String,
    /// Absolute path of the file/directory
    pub path: String,
    /// Whether this entry is a directory
    pub is_dir: bool,
    /// File size in bytes (0 for directories)
    pub size: u64,
    /// Last modification time as ISO 8601 string
    pub modified_at: String,
    /// Creation time as ISO 8601 string
    pub created_at: String,
    /// Whether the entry is a symbolic link
    pub is_symlink: bool,
    /// File extension in lowercase (empty for directories or no-extension files)
    pub extension: String,
    /// MIME type string (e.g. "text/plain", "image/png")
    pub mime_type: String,
}

/// Detailed file information including permissions.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileInfo {
    /// The basic file entry info
    pub entry: FileEntry,
    /// Unix-style permission string (e.g. "rw-r--r--")
    pub permissions: String,
    /// Whether the current user can access this file
    pub accessible: bool,
}
