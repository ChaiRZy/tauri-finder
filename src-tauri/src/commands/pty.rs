use std::collections::HashMap;
use std::io::{Read, Write};
use std::sync::{Arc, Mutex};
use std::thread;

use portable_pty::{native_pty_system, CommandBuilder, PtySize, PtySystem};
use serde::Serialize;
use tauri::{AppHandle, Emitter};

#[derive(Debug, Clone, Serialize)]
pub struct PtyOutput {
    pub id: String,
    pub data: Vec<u8>,
}

#[derive(Debug, Clone, Serialize)]
pub struct PtyExit {
    pub id: String,
    pub code: u32,
}

struct PtyProcess {
    child: Box<dyn portable_pty::Child + Send + Sync>,
    master: Box<dyn portable_pty::MasterPty + Send>,
    writer: Box<dyn Write + Send>,
}

pub struct PtyManager {
    processes: HashMap<String, PtyProcess>,
    next_id: u64,
}

impl PtyManager {
    pub fn new() -> Self {
        PtyManager {
            processes: HashMap::new(),
            next_id: 0,
        }
    }
}

type PtyStateInner = Arc<Mutex<PtyManager>>;

pub struct PtyState {
    pub inner: PtyStateInner,
}

impl PtyState {
    pub fn new() -> Self {
        PtyState {
            inner: Arc::new(Mutex::new(PtyManager::new())),
        }
    }
}

#[tauri::command]
pub fn pty_spawn(
    app: AppHandle,
    state: tauri::State<'_, PtyState>,
    shell: String,
    cwd: String,
    cols: u16,
    rows: u16,
) -> Result<String, String> {
    let pty_system = native_pty_system();
    let size = PtySize {
        rows,
        cols,
        pixel_width: 0,
        pixel_height: 0,
    };

    let pair = pty_system
        .openpty(size)
        .map_err(|e| format!("Failed to open PTY: {}", e))?;

    let cmd = if shell.is_empty() {
        #[cfg(target_os = "windows")]
        {
            CommandBuilder::new("cmd.exe")
        }
        #[cfg(not(target_os = "windows"))]
        {
            CommandBuilder::new(std::env::var("SHELL").unwrap_or_else(|_| "sh".to_string()))
        }
    } else {
        CommandBuilder::new(&shell)
    };
    let cmd = cmd.cwd(&cwd);

    let child = pair
        .slave
        .spawn_command(cmd)
        .map_err(|e| format!("Failed to spawn shell: {}", e))?;

    let master = pair.master;
    let writer = master
        .take_writer()
        .map_err(|e| format!("Failed to get writer: {}", e))?;

    let mut reader = master
        .try_clone_reader()
        .map_err(|e| format!("Failed to get reader: {}", e))?;

    let id = {
        let mut mgr = state.inner.lock().map_err(|e| format!("Lock error: {}", e))?;
        let id = format!("pty-{}", mgr.next_id);
        mgr.next_id += 1;
        id
    };

    // Spawn reader thread: reads PTY output, emits events to frontend
    let id_clone = id.clone();
    let app_reader = app.clone();
    let inner_drop = state.inner.clone();
    let id_drop = id.clone();
    thread::spawn(move || {
        let mut buf = [0u8; 4096];
        loop {
            match reader.read(&mut buf) {
                Ok(0) => {
                    // EOF: child process exited
                    let _ = app_reader.emit(
                        "pty-exit",
                        PtyExit {
                            id: id_clone,
                            code: 0,
                        },
                    );
                    break;
                }
                Ok(n) => {
                    let _ = app_reader.emit(
                        "pty-output",
                        PtyOutput {
                            id: id_clone.clone(),
                            data: buf[..n].to_vec(),
                        },
                    );
                }
                Err(_) => {
                    let _ = app_reader.emit(
                        "pty-exit",
                        PtyExit {
                            id: id_clone,
                            code: 1,
                        },
                    );
                    break;
                }
            }
        }
        // Clean up process entry on exit
        if let Ok(mut mgr) = inner_drop.lock() {
            mgr.processes.remove(&id_drop);
        }
    });

    {
        let mut mgr = state.inner.lock().map_err(|e| format!("Lock error: {}", e))?;
        mgr.processes.insert(
            id.clone(),
            PtyProcess {
                child: Box::new(child),
                master,
                writer,
            },
        );
    }

    Ok(id)
}

#[tauri::command]
pub fn pty_write(
    state: tauri::State<'_, PtyState>,
    id: String,
    data: Vec<u8>,
) -> Result<(), String> {
    let mut mgr = state.inner.lock().map_err(|e| format!("Lock error: {}", e))?;
    let proc = mgr
        .processes
        .get_mut(&id)
        .ok_or_else(|| format!("PTY {} not found", id))?;
    proc.writer
        .write_all(&data)
        .map_err(|e| format!("Write error: {}", e))?;
    proc.writer
        .flush()
        .map_err(|e| format!("Flush error: {}", e))?;
    Ok(())
}

#[tauri::command]
pub fn pty_resize(
    state: tauri::State<'_, PtyState>,
    id: String,
    cols: u16,
    rows: u16,
) -> Result<(), String> {
    let mgr = state.inner.lock().map_err(|e| format!("Lock error: {}", e))?;
    let proc = mgr
        .processes
        .get(&id)
        .ok_or_else(|| format!("PTY {} not found", id))?;
    let size = PtySize {
        rows,
        cols,
        pixel_width: 0,
        pixel_height: 0,
    };
    proc.master
        .resize(size)
        .map_err(|e| format!("Resize error: {}", e))?;
    Ok(())
}

#[tauri::command]
pub fn pty_kill(
    state: tauri::State<'_, PtyState>,
    id: String,
) -> Result<(), String> {
    let mut mgr = state.inner.lock().map_err(|e| format!("Lock error: {}", e))?;
    if let Some(mut proc) = mgr.processes.remove(&id) {
        // Dropping writer sends EOF to the slave
        drop(proc.writer);
        let _ = proc.child.kill();
        drop(proc.master);
    }
    Ok(())
}
