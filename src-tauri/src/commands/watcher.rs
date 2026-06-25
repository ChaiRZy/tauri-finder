use notify_debouncer_full::notify::{RecursiveMode, Watcher};
use notify_debouncer_full::new_debouncer;
use std::path::PathBuf;
use std::sync::mpsc;
use std::time::Duration;
use tauri::{AppHandle, Emitter};

/// Start a file watcher for the given directory.
/// When changes are detected, emits a `watcher-event` to the frontend.
pub fn start_watcher(app_handle: AppHandle, watch_path: PathBuf) {
    std::thread::spawn(move || {
        let (tx, rx) = mpsc::channel();
        let mut debouncer = match new_debouncer(Duration::from_millis(500), None, tx) {
            Ok(d) => d,
            Err(e) => {
                eprintln!("[watcher] failed to create debouncer: {}", e);
                return;
            }
        };

        if let Err(e) = debouncer
            .watcher()
            .watch(&watch_path, RecursiveMode::NonRecursive)
        {
            eprintln!("[watcher] failed to watch {}: {}", watch_path.display(), e);
            return;
        }

        // Keep the debouncer alive (its Drop stops watching)
        let _debouncer = debouncer;

        for event in rx {
            match event {
                Ok(events) => {
                    if !events.is_empty() {
                        let _ = app_handle.emit("watcher-event", ());
                    }
                }
                Err(e) => {
                    eprintln!("[watcher] error: {:?}", e);
                }
            }
        }
    });
}
