use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, TrayIconBuilder, TrayIconEvent},
    AppHandle, Manager,
};
use tauri_plugin_window_state::StateFlags; //  new import for window state flags

#[tauri::command]
fn swap_to_widget(app: AppHandle) -> Result<(), String> {
    let main_win = app
        .get_webview_window("main")
        .ok_or_else(|| "Window 'main' not found".to_string())?;

    let widget_win = app
        .get_webview_window("widget")
        .ok_or_else(|| "Window 'widget' not found".to_string())?;

    main_win.hide().map_err(|e| e.to_string())?;
    widget_win.show().map_err(|e| e.to_string())?;
    widget_win.set_focus().map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
fn swap_to_main(app: AppHandle) -> Result<(), String> {
    let widget_win = app
        .get_webview_window("widget")
        .ok_or_else(|| "Window 'widget' not found".to_string())?;

    let main_win = app
        .get_webview_window("main")
        .ok_or_else(|| "Window 'main' not found".to_string())?;

    widget_win.hide().map_err(|e| e.to_string())?;
    main_win.show().map_err(|e| e.to_string())?;
    main_win.set_focus().map_err(|e| e.to_string())?;

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        //  Window state plugin ko enable karein
        .plugin(
            tauri_plugin_window_state::Builder::default()
                .with_state_flags(StateFlags::POSITION)
                .build(),
        )
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--minimized"]), 
        ))
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .setup(|app| {
            let quit_i = MenuItem::with_id(app, "quit", "Exit ZenStick", true, None::<&str>)?;
            let show_i = MenuItem::with_id(app, "show", "Open Dashboard", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_i, &quit_i])?;

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "quit" => app.exit(0),
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click { button: MouseButton::Left, .. } = event {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;

            //  WIDGET-ONLY STARTUP LOGIC 
            let args: Vec<String> = std::env::args().collect();
            if args.contains(&"--minimized".to_string()) {
                // Main window ko hide karein
                if let Some(main_win) = app.get_webview_window("main") {
                    let _ = main_win.hide();
                }
                // Sirf Widget window ko show karein
                if let Some(widget_win) = app.get_webview_window("widget") {
                    let _ = widget_win.show();
                }
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![swap_to_widget, swap_to_main])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}