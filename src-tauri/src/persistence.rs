use std::fs;
use std::path::PathBuf;
use crate::models::{MacroConfig, AppSettings, Config, Profile};
use base64::{Engine as _, engine::general_purpose};

pub fn get_app_data_dir() -> PathBuf {
    // Récupère le chemin vers C:\Users\Nom\Documents\MacroX
    let mut path = directories::UserDirs::new()
        .and_then(|dirs| dirs.document_dir().map(|d| d.to_path_buf()))
        .unwrap_or_else(|| {
            // Fallback si document_dir échoue
            match std::env::var("USERPROFILE") {
                Ok(val) => PathBuf::from(val).join("Documents"),
                Err(_) => PathBuf::from("./data")
            }
        });
    
    path.push("MacroX");

    if !path.exists() {
        fs::create_dir_all(&path).expect("Failed to create MacroX directory in Documents");
    }
    path
}

pub fn get_macros_dir(profile: &str) -> PathBuf {
    let mut path = get_app_data_dir();
    path.push("macros");
    path.push(profile);
    if !path.exists() {
        fs::create_dir_all(&path).expect("Failed to create macros directory");
    }
    path
}

pub fn get_languages_dir() -> PathBuf {
    let mut path = get_app_data_dir();
    path.push("languages");
    if !path.exists() {
        fs::create_dir_all(&path).expect("Failed to create languages directory");
    }
    path
}

pub fn save_config(config: &Config) {
    let config_path = get_app_data_dir().join("settings.json");
    let content = serde_json::to_string_pretty(config).expect("Failed to serialize config");
    fs::write(config_path, content).expect("Failed to write config");
}

pub fn load_config() -> Config {
    let config_path = get_app_data_dir().join("settings.json");
    if config_path.exists() {
        if let Ok(content) = fs::read_to_string(config_path) {
            if let Ok(config) = serde_json::from_str(&content) {
                return config;
            }
        }
    }
    let config = default_config();
    save_config(&config);
    config
}

fn default_config() -> Config {
    Config {
        settings: AppSettings {
            language: "fr".to_string(),
            auto_start: false,
            theme: "dark".to_string(),
            layout: "AZERTY".to_string(),
            keyboard_layout_type: "AZERTY".to_string(),
            keyboard_size: "100%".to_string(),
            keyboard_scale: 1.2, // 20% larger
            cursor_scale: 0.9,   // 10% smaller
            active_profile: "Default".to_string(),
        },
    }
}

pub fn get_profiles_dir() -> PathBuf {
    let mut path = get_app_data_dir();
    path.push("profiles");
    if !path.exists() {
        fs::create_dir_all(&path).expect("Failed to create profiles directory");
    }
    path
}

pub fn load_all_profiles() -> Vec<Profile> {
    let profiles_dir = get_profiles_dir();
    let mut profiles = Vec::new();
    
    // Default profile with current global settings if no file exists
    let default_profile_path = profiles_dir.join("Default.json");
    if !default_profile_path.exists() {
        let default_p = Profile {
            name: "Default".to_string(),
            settings: Some(default_config().settings),
            macros: Some(Vec::new()),
        };
        let _ = save_profile(&default_p);
        profiles.push(default_p);
    }

    if let Ok(entries) = fs::read_dir(profiles_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.extension().and_then(|s| s.to_str()) == Some("json") {
                if let Ok(content) = fs::read_to_string(path) {
                    if let Ok(profile) = serde_json::from_str::<Profile>(&content) {
                        // Avoid duplicates if Default was already added
                        if !profiles.iter().any(|p| p.name == profile.name) {
                            profiles.push(profile);
                        }
                    }
                }
            }
        }
    }
    profiles
}

pub fn save_profile(profile: &Profile) -> Result<(), String> {
    let profiles_dir = get_profiles_dir();
    
    let safe_name = profile.name.chars()
        .map(|c: char| if c.is_alphanumeric() { c } else { '_' })
        .collect::<String>();
        
    let path = profiles_dir.join(format!("{}.json", safe_name));
    let content = serde_json::to_string_pretty(profile)
        .map_err(|e| format!("Erreur de sérialisation : {}", e))?;
        
    fs::write(path, content)
        .map_err(|e| format!("Erreur d'écriture du fichier : {}", e))?;
        
    Ok(())
}

pub fn delete_profile(name: &str) -> Result<(), String> {
    if name == "Default" {
        return Err("Cannot delete Default profile".to_string());
    }
    let safe_name = name.replace(|c: char| !c.is_alphanumeric(), "_");
    let path = get_profiles_dir().join(format!("{}.json", safe_name));
    if path.exists() {
        fs::remove_file(path).map_err(|e| format!("Erreur de suppression : {}", e))?;
    }
    Ok(())
}

pub fn load_all_macros(profile: &str) -> Vec<MacroConfig> {
    let macros_dir = get_macros_dir(profile);
    let mut macros = Vec::new();
    if let Ok(entries) = fs::read_dir(macros_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.extension().and_then(|s| s.to_str()) == Some("json") {
                if let Ok(content) = fs::read_to_string(path) {
                    if let Ok(macro_config) = serde_json::from_str::<MacroConfig>(&content) {
                        macros.push(macro_config);
                    }
                }
            }
        }
    }
    macros
}

pub fn save_macro(macro_config: &MacroConfig, profile: &str) -> Result<(), String> {
    let macros_dir = get_macros_dir(profile);
    
    // S'assurer que le dossier existe (Double vérification pour la robustesse)
    if !macros_dir.exists() {
        fs::create_dir_all(&macros_dir).map_err(|e| format!("Impossible de créer le dossier des macros : {}", e))?;
    }
    
    // Nettoyage rigoureux du nom de fichier pour Windows
    // On remplace tout ce qui n'est pas alphanumérique par un underscore
    let safe_name = macro_config.name.chars()
        .map(|c: char| if c.is_alphanumeric() { c } else { '_' })
        .collect::<String>();
        
    let path = macros_dir.join(format!("{}.json", safe_name));

    let content = serde_json::to_string_pretty(macro_config)
        .map_err(|e| format!("Erreur de sérialisation : {}", e))?;
        
    fs::write(path, content)
        .map_err(|e| format!("Erreur d'écriture du fichier : {}", e))?;
        
    Ok(())
}

pub fn delete_macro(name: &str, profile: &str) -> Result<(), String> {
    if name.is_empty() {
        return Err("Le nom de la macro ne peut pas être vide".to_string());
    }

    let safe_name = name.chars()
        .map(|c: char| if c.is_alphanumeric() { c } else { '_' })
        .collect::<String>();
    
    let macros_dir = get_macros_dir(profile);
    let path = macros_dir.join(format!("{}.json", safe_name));
    
    println!("Tentative de suppression de la macro : {} (fichier: {:?})", name, path);

    if path.exists() {
        fs::remove_file(&path).map_err(|e| format!("Erreur lors de la suppression du fichier {:?} : {}", path, e))?;
        println!("Macro '{}' supprimée avec succès.", name);
        Ok(())
    } else {
        // Si le fichier direct n'existe pas, essayons de trouver un fichier qui contient cet ID
        // (au cas où le nom du fichier et le nom interne seraient désynchronisés)
        println!("Fichier non trouvé par nom normalisé. Recherche par contenu...");
        
        if let Ok(entries) = fs::read_dir(&macros_dir) {
            for entry in entries.flatten() {
                let entry_path = entry.path();
                if entry_path.extension().and_then(|s| s.to_str()) == Some("json") {
                    if let Ok(content) = fs::read_to_string(&entry_path) {
                        if let Ok(macro_config) = serde_json::from_str::<MacroConfig>(&content) {
                            if macro_config.name == name {
                                fs::remove_file(&entry_path).map_err(|e| format!("Erreur lors de la suppression du fichier trouvé par contenu {:?} : {}", entry_path, e))?;
                                println!("Macro '{}' trouvée par contenu et supprimée ({:?}).", name, entry_path);
                                return Ok(());
                            }
                        }
                    }
                }
            }
        }

        Err(format!("La macro '{}' n'a pas pu être trouvée (chemin tenté: {:?})", name, path))
    }
}

pub fn export_to_base64(macro_config: &MacroConfig) -> String {
    let json = serde_json::to_string(macro_config).expect("Failed to serialize macro");
    general_purpose::STANDARD.encode(json)
}

pub fn import_from_base64(data: &str) -> Result<MacroConfig, String> {
    let decoded = general_purpose::STANDARD
        .decode(data)
        .map_err(|e| format!("Base64 decode error: {}", e))?;
    let json = String::from_utf8(decoded).map_err(|e| format!("UTF8 error: {}", e))?;
    let macro_config: MacroConfig = serde_json::from_str(&json)
        .map_err(|e| format!("JSON parse error: {}", e))?;
    
    validate_macro(&macro_config)?;
    
    Ok(macro_config)
}

fn validate_macro(m: &MacroConfig) -> Result<(), String> {
    if m.id.is_empty() { return Err("ID cannot be empty".into()); }
    if m.name.is_empty() { return Err("Name cannot be empty".into()); }
    if m.trigger.key.is_empty() { return Err("Trigger key cannot be empty".into()); }
    if m.actions.is_empty() { return Err("Macro must have at least one action".into()); }

    // Security: Check for suspicious number of actions or extreme delays
    if m.actions.len() > 1000 {
        return Err("Too many actions in a single macro (max 1000)".into());
    }

    for action in &m.actions {
        let delay = match action {
            crate::models::Action::KeyDown { delay_ms, .. } => *delay_ms,
            crate::models::Action::KeyUp { delay_ms, .. } => *delay_ms,
            crate::models::Action::MouseClick { delay_ms, .. } => *delay_ms,
            crate::models::Action::MouseDown { delay_ms, .. } => *delay_ms,
            crate::models::Action::MouseUp { delay_ms, .. } => *delay_ms,
            crate::models::Action::MouseMove { delay_ms, .. } => *delay_ms,
        };

        if delay > 30000 { // 30 seconds max delay per action
            return Err("Delay too long (max 30s per action)".into());
        }
    }

    Ok(())
}

pub fn load_translations(lang: &str) -> serde_json::Value {
    // Check config/languages first (dev/portable)
    let mut path = std::env::current_dir().unwrap_or_default();
    path.push("config");
    path.push("languages");
    path.push(format!("{}.json", lang));

    if !path.exists() {
        // Fallback to AppData
        path = get_languages_dir().join(format!("{}.json", lang));
    }

    if path.exists() {
        let content = fs::read_to_string(path).expect("Failed to read translation file");
        serde_json::from_str(&content).unwrap_or_default()
    } else {
        serde_json::Value::Object(serde_json::Map::new())
    }
}
