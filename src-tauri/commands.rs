use tauri::{AppHandle, Manager};

#[tauri::command]
pub fn swap_to_widget(app: AppHandle) -> Result<(), String> {
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
pub fn swap_to_main(app: AppHandle) -> Result<(), String> {
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