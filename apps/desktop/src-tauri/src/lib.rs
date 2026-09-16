use serde::Serialize;
use std::path::{Path, PathBuf};
use std::process::Command;
use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    Manager,
};

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
    if Command::new("trash")
        .arg(path)
        .status()
        .map(|s| s.success())
        .unwrap_or(false)
    {
        return Ok(());
    }
    let script = format!(
        "tell application \"Finder\" to delete (POSIX file \"{}\" as alias)",
        path.display()
            .to_string()
            .replace('\\', "\\\\")
            .replace('"', "\\\"")
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
    let absolute = expanded.canonicalize().map_err(|e| e.to_string())?;
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
        .setup(|app| {
            let show_i = MenuItem::with_id(app, "show", "显示窗口", true, None::<&str>)?;
            let hide_i = MenuItem::with_id(app, "hide", "隐藏窗口", true, None::<&str>)?;
            let quit_i = MenuItem::with_id(app, "quit", "退出 Apsara", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_i, &hide_i, &quit_i])?;

            let icon = app
                .default_window_icon()
                .cloned()
                .ok_or_else(|| "missing window icon for tray".to_string())?;

            let _tray = TrayIconBuilder::with_id("apsara-tray")
                .icon(icon)
                .menu(&menu)
                .tooltip("Apsara")
                .show_menu_on_left_click(true)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "quit" => {
                        app.exit(0);
                    }
                    "show" => {
                        if let Some(w) = app.get_webview_window("main") {
                            let _ = w.set_ignore_cursor_events(false);
                            let _ = w.show();
                            let _ = w.set_focus();
                        }
                    }
                    "hide" => {
                        if let Some(w) = app.get_webview_window("main") {
                            let _ = w.hide();
                        }
                    }
                    _ => {}
                })
                .build(app)?;

            if let Some(w) = app.get_webview_window("main") {
                let _ = w.set_ignore_cursor_events(false);
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![trash_path, list_desktop])
        .run(tauri::generate_context!())
        .expect("error while running Apsara");
}
