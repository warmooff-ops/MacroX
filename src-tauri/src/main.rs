// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod models;
mod hook;
mod engine;
mod persistence;

use models::{MacroConfig, Config, Profile};
use persistence::{
    load_all_macros, save_macro as save_macro_persistence, delete_macro as del_macro, 
    export_to_base64, import_from_base64, load_config, load_translations,
    load_all_profiles, save_profile as save_profile_persistence, delete_profile as del_profile
};
use hook::{start_hook, reload_macros};
use std::fs;
use std::path::PathBuf;
use std::process::Command;
use tauri::Manager; // Required for .path() and other handle methods in Tauri v2

// Fonction pour initialiser les dossiers de l'application
#[tauri::command]
fn init_folders() -> Result<String, String> {
    let app_data = persistence::get_app_data_dir();
    let _ = persistence::get_profiles_dir();
    let config = persistence::load_config();
    let _ = persistence::get_macros_dir(&config.settings.active_profile);
    
    Ok(app_data.to_str().unwrap().to_string())
}

#[tauri::command]
fn start_mouse_capture() {
    hook::set_capturing(true);
}

#[tauri::command]
fn get_mouse_position() -> (i32, i32) {
    use enigo::MouseControllable;
    let enigo = enigo::Enigo::new();
    enigo.mouse_location()
}

#[tauri::command]
fn get_active_app() -> Result<String, String> {
    #[cfg(target_os = "windows")]
    {
        // Script PowerShell amélioré pour filtrer les processus système
        let script = "
            $systemProcesses = @('explorer', 'ShellExperienceHost', 'StartMenuExperienceHost', 'SearchHost', 'Taskmgr', 'ApplicationFrameHost', 'SystemSettings', 'TextInputHost', 'MacroX', 'cmd', 'conhost', 'svchost', 'taskhostw', 'RuntimeBroker', 'ctfmon', 'dllhost')
            $proc = Get-Process | Where-Object { $_.MainWindowHandle -ne 0 -and $_.ProcessName -notin $systemProcesses } | Sort-Object -Property LastInputTime -Descending | Select-Object -First 1
            if ($proc) { $proc.ProcessName } else { 'Bureau' }
        ";
        
        let output = Command::new("powershell")
            .args(&["-NoProfile", "-Command", script])
            .output()
            .map_err(|e| e.to_string())?;
        
        let name = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if name.is_empty() {
            Ok("Bureau".to_string())
        } else {
            Ok(name)
        }
    }
    #[cfg(not(target_os = "windows"))]
    {
        Ok("Non-Windows OS".to_string())
    }
}

#[tauri::command]
fn get_active_apps() -> Result<Vec<String>, String> {
    #[cfg(target_os = "windows")]
    {
        let script = "
            $systemProcesses = @('explorer', 'ShellExperienceHost', 'StartMenuExperienceHost', 'SearchHost', 'Taskmgr', 'ApplicationFrameHost', 'SystemSettings', 'TextInputHost', 'MacroX', 'cmd', 'conhost', 'svchost', 'taskhostw', 'RuntimeBroker', 'ctfmon', 'dllhost')
            $procs = Get-Process | Where-Object { $_.MainWindowHandle -ne 0 -and $_.ProcessName -notin $systemProcesses } | Select-Object -Property ProcessName -Unique
            if ($procs) { $procs.ProcessName } else { @() }
        ";
        
        let output = Command::new("powershell")
            .args(&["-NoProfile", "-Command", script])
            .output()
            .map_err(|e| e.to_string())?;
        
        let stdout = String::from_utf8_lossy(&output.stdout);
        let apps: Vec<String> = stdout.lines()
            .map(|l| l.trim().to_string())
            .filter(|l| !l.is_empty())
            .collect();
        
        Ok(apps)
    }
    #[cfg(not(target_os = "windows"))]
    {
        Ok(vec!["Non-Windows OS".to_string()])
    }
}

#[tauri::command]
fn get_translations(lang: String) -> Result<serde_json::Value, String> {
    Ok(load_translations(&lang))
}

#[tauri::command]
async fn get_all_macros() -> Result<Vec<MacroConfig>, String> {
    let config = load_config();
    let profile = config.settings.active_profile;
    Ok(load_all_macros(&profile))
}

// Logic for saving a macro, separated from the Tauri command
async fn internal_save_macro(macro_config: MacroConfig) -> Result<String, String> {
    let name = macro_config.name.clone();
    let config = load_config();
    let profile = config.settings.active_profile;
    save_macro_persistence(&macro_config, &profile)?;
    reload_macros();
    Ok(format!("Macro '{}' sauvegardée avec succès dans le profil {} !", name, profile))
}

#[tauri::command]
async fn save_macro(macro_config: MacroConfig) -> Result<String, String> {
    internal_save_macro(macro_config).await
}

// Aliases pour la compatibilité avec la logique "ultra-robuste" demandée
#[tauri::command]
async fn save_macro_robust(macro_obj: MacroConfig) -> Result<String, String> {
    internal_save_macro(macro_obj).await
}

#[tauri::command]
async fn load_macros_robust() -> Result<Vec<MacroConfig>, String> {
    get_all_macros().await
}

#[tauri::command]
async fn delete_macro(name: String) -> Result<(), String> {
    let config = load_config();
    let profile = config.settings.active_profile;
    del_macro(&name, &profile);
    reload_macros();
    Ok(())
}

#[tauri::command]
async fn export_macro_base64(macro_config: MacroConfig) -> Result<String, String> {
    Ok(export_to_base64(&macro_config))
}

#[tauri::command]
async fn get_all_profiles() -> Result<Vec<Profile>, String> {
    Ok(load_all_profiles())
}

#[tauri::command]
async fn save_profile(profile: Profile) -> Result<(), String> {
    save_profile_persistence(&profile)?;
    Ok(())
}

#[tauri::command]
async fn delete_profile(name: String) -> Result<(), String> {
    del_profile(&name)?;
    Ok(())
}

#[tauri::command]
async fn import_macro_base64(data: String) -> Result<MacroConfig, String> {
    let m = import_from_base64(&data)?;
    let config = load_config();
    let profile = config.settings.active_profile;
    save_macro_persistence(&m, &profile)?;
    reload_macros();
    Ok(m)
}

#[tauri::command]
fn get_config() -> Result<Config, String> {
    Ok(load_config())
}

#[tauri::command]
fn save_config(config: Config) -> Result<(), String> {
    persistence::save_config(&config);
    Ok(())
}

#[tauri::command]
fn close_app(window: tauri::Window) {
    window.close().unwrap();
}

#[tauri::command]
fn minimize_app(window: tauri::Window) {
    window.minimize().unwrap();
}

#[tauri::command]
fn open_macros_folder() -> Result<(), String> {
    let config = load_config();
    let profile = config.settings.active_profile;
    let path = persistence::get_macros_dir(&profile);
    
    #[cfg(target_os = "windows")]
    {
        Command::new("explorer")
            .arg(&path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg(&path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "linux")]
    {
        Command::new("xdg-open")
            .arg(&path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    
    Ok(())
}

#[tauri::command]
fn open_profiles_folder() -> Result<(), String> {
    let path = persistence::get_profiles_dir();
    
    #[cfg(target_os = "windows")]
    {
        Command::new("explorer")
            .arg(&path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg(&path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "linux")]
    {
        Command::new("xdg-open")
            .arg(&path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    
    Ok(())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            println!("Initialisation de l'application MacroX...");
            let app_handle = app.handle();
            
            // Log du chemin des données pour le débogage
            let data_path = persistence::get_app_data_dir();
            println!("Dossier des données : {:?}", data_path);
            
            start_hook(app_handle.clone());
            println!("Hook clavier/souris démarré.");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_translations,
            get_all_macros,
            save_macro,
            save_macro_robust,
            load_macros_robust,
            delete_macro,
            export_macro_base64,
            import_macro_base64,
            get_all_profiles,
            save_profile,
            delete_profile,
            get_config,
            save_config,
            close_app,
            minimize_app,
            get_active_app,
            get_active_apps,
            init_folders,
            start_mouse_capture,
            get_mouse_position,
            open_macros_folder,
            open_profiles_folder
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
