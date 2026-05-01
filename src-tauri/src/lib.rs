use std::sync::Mutex;
use tauri::{
    menu::{CheckMenuItem, Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager,
};
use tauri_plugin_autostart::MacosLauncher;
use tauri_plugin_autostart::ManagerExt;

struct AotState(Mutex<bool>);

#[tauri::command]
fn show_main_window(app: tauri::AppHandle, state: tauri::State<AotState>) {
    let aot_was_on = *state.0.lock().unwrap();
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.set_always_on_top(true);
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
        if !aot_was_on {
            let window_clone = window.clone();
            std::thread::spawn(move || {
                std::thread::sleep(std::time::Duration::from_millis(300));
                let _ = window_clone.set_always_on_top(false);
            });
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(AotState(Mutex::new(true)))
        .invoke_handler(tauri::generate_handler![show_main_window])
        .plugin(tauri_plugin_autostart::init(MacosLauncher::LaunchAgent, None))
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .setup(|app| {
            let quit_item = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let show_item = MenuItem::with_id(app, "show", "Show", true, None::<&str>)?;
            let hide_item = MenuItem::with_id(app, "hide", "Hide", true, None::<&str>)?;
            let aot_item = CheckMenuItem::with_id(app, "aot", "Always on top", true, true, None::<&str>)?;
            let open_data_item = MenuItem::with_id(app, "open-data", "Open data folder", true, None::<&str>)?;

            let autostart_enabled = app.autolaunch().is_enabled().unwrap_or(false);
            let autostart_item = CheckMenuItem::with_id(app, "autostart", "Start with Windows", true, autostart_enabled, None::<&str>)?;

            let menu = Menu::with_items(app, &[
                &show_item,
                &hide_item,
                &aot_item,
                &autostart_item,
                &open_data_item,
                &quit_item,
            ])?;

            if let Some(window) = app.get_webview_window("main") {
                if let Ok(Some(monitor)) = window.primary_monitor() {
                    let scale = monitor.scale_factor();
                    let screen_h = monitor.size().height as f64;
                    let win_h = 440.0 * scale;
                    let y = (screen_h - win_h) as i32;
                    let _ = window.set_position(tauri::PhysicalPosition::new(0, y));
                }
            }

            let aot_for_handler = aot_item.clone();
            let autostart_for_handler = autostart_item.clone();
            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .on_menu_event(move |app, event| match event.id.as_ref() {
                    "quit" => {
                        app.exit(0);
                    }
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    "hide" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.hide();
                        }
                    }
                    "aot" => {
                        let checked = aot_for_handler.is_checked().unwrap_or(false);
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.set_always_on_top(checked);
                        }
                        *app.state::<AotState>().0.lock().unwrap() = checked;
                    }
                    "autostart" => {
                        let checked = autostart_for_handler.is_checked().unwrap_or(false);
                        let autolaunch = app.autolaunch();
                        if checked {
                            let _ = autolaunch.enable();
                        } else {
                            let _ = autolaunch.disable();
                        }
                    }
                    "open-data" => {
                        if let Ok(data_dir) = app.path().app_data_dir() {
                            let _ = std::process::Command::new("explorer").arg(data_dir).spawn();
                        }
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                let _ = window.hide();
                api.prevent_close();
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
