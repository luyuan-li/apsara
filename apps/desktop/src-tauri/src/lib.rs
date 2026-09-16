use serde::Serialize;
use std::path::{Path, PathBuf};
use std::process::Command;

#[derive(Debug, Serialize)]
struct FsError {
    message: String,
}

fn home_dir() -> Result<PathBuf, String> {
    dirs::home_dir().ok_or_else(|| "cannot resolve home directory".into())
}

fn expand_user_path(raw: &str) -> Result<PathBuf, String> {
    if let Some(rest) = raw.strip_prefix("~/") {
        Ok(home_dir()?.join(rest))
    } else if raw == "~" {
        home_dir()
    } else {
        Ok(PathBuf::from(raw))
    }
}

fn is_allowed(path: &Path) -> Result<(), String> {
    let home = home_dir()?;
    let allow = ["Desktop", "Downloads", "Documents"];
    let canon = path.canonicalize().or_else(|_| {
        path.parent()
            .ok_or_else(|| "invalid path".to_string())
            .and_then(|p| p.canonicalize().map_err(|e| e.to_string()))
            .map(|parent| parent.join(path.file_name().unwrap_or_default()))
    })?;
    for name in allow {
        let base = home.join(name);
        if let Ok(base_c) = base.canonicalize() {
            if canon.starts_with(&base_c) {
                return Ok(());
            }
        }
    }
    Err(format!(
        "path not in allowlist (Desktop/Downloads/Documents): {}",
        canon.display()
    ))
}

fn move_to_trash(path: &Path) -> Result<(), String> {
    // Prefer macOS `trash` (Sequoia+); fallback to Finder AppleScript.
    if Command::new("trash").arg(path).status().map(|s| s.success()).unwrap_or(false) {
        return Ok(());
    }
    let script = format!(
        "tell application \"Finder\" to delete (POSIX file \"{}\" as alias)",
        path.display().to_string().replace('\\', "\\\\").replace('"', "\\\"")
    );
    let status = Command::new("osascript")
        .args(["-e", &script])
        .status()
        .map_err(|e| e.to_string())?;
    if status.success() {
        Ok(())
    } else {
        Err("trash and AppleScript both failed".into())
    }
}

#[tauri::command]
fn trash_path(path: String) -> Result<String, String> {
    let expanded = expand_user_path(&path)?;
    if !expanded.exists() {
        return Err(format!("file not found: {}", expanded.display()));
    }
    is_allowed(&expanded)?;
    let absolute = expanded
        .canonicalize()
        .map_err(|e| e.to_string())?;
    move_to_trash(&absolute)?;
    Ok(absolute.display().to_string())
}

#[tauri::command]
fn list_desktop() -> Result<Vec<String>, String> {
    let desk = home_dir()?.join("Desktop");
    let mut names = Vec::new();
    for entry in std::fs::read_dir(&desk).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        names.push(entry.file_name().to_string_lossy().to_string());
    }
    names.sort();
    Ok(names)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![trash_path, list_desktop])
        .run(tauri::generate_context!())
        .expect("error while running Apsara");
}
