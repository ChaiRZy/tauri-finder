//! Standalone binary to export tauri-specta TypeScript bindings.
//! Run: cargo run --bin export_specta

fn main() {
    tauri_finder_lib::export_typescript_bindings();
    println!("✅ bindings.ts generated successfully!");
}
