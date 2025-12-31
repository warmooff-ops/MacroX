use rdev::{grab, Event, EventType};
use std::collections::{HashMap, HashSet};
use std::sync::Mutex;
use std::thread;
use lazy_static::lazy_static;
use crate::models::{MacroConfig, ExecutionMode};
use crate::engine::run_macro;
use crate::persistence::{load_all_macros, load_config};
use tauri::AppHandle;
use tauri::Emitter;

lazy_static! {
    static ref MACROS: Mutex<HashMap<String, MacroConfig>> = Mutex::new(HashMap::new());
    pub static ref ACTIVE_MACROS: Mutex<HashSet<String>> = Mutex::new(HashSet::new());
    static ref GRABBED_KEYS: Mutex<HashSet<String>> = Mutex::new(HashSet::new());
    static ref APP_HANDLE: Mutex<Option<AppHandle>> = Mutex::new(None);
    static ref IS_CAPTURING: Mutex<bool> = Mutex::new(false);
}

pub fn set_capturing(capturing: bool) {
    let mut is_capturing = IS_CAPTURING.lock().unwrap();
    *is_capturing = capturing;
    println!("🦀 Rust: Capture d'écran définie sur {}", capturing);
}

pub fn start_hook(app_handle: AppHandle) {
    *APP_HANDLE.lock().unwrap() = Some(app_handle.clone());
    reload_macros();

    thread::spawn(move || {
        println!("🦀 Rust: Démarrage du hook grab...");
        if let Err(error) = grab(move |event| {
            handle_event(event)
        }) {
            eprintln!("Error grabbing events: {:?}", error);
        }
    });
}

pub fn reload_macros() {
    let config = load_config();
    let profile = config.settings.active_profile;
    let all_macros = load_all_macros(&profile);
    let mut macros_map = MACROS.lock().unwrap();
    let mut grabbed_keys = GRABBED_KEYS.lock().unwrap();
    
    macros_map.clear();
    grabbed_keys.clear();
    
    for m in all_macros {
        grabbed_keys.insert(m.trigger.key.clone());
        macros_map.insert(m.trigger.key.clone(), m);
    }
}

fn handle_event(event: Event) -> Option<Event> {
    let app_handle_guard = APP_HANDLE.lock().unwrap();
    let app_handle = app_handle_guard.as_ref();

    // Gestion de la capture de position (Touche F ou Clic Gauche)
    let mut capturing = IS_CAPTURING.lock().unwrap();
    if *capturing {
        println!("🦀 Rust: Événement reçu pendant capture: {:?}", event.event_type);
        let should_capture = match event.event_type {
            EventType::KeyPress(rdev::Key::KeyF) => {
                println!("🦀 Rust: Touche F pressée pendant la capture");
                true
            },
            EventType::ButtonPress(rdev::Button::Left) => {
                println!("🦀 Rust: Clic Gauche pressé pendant la capture");
                true
            },
            _ => false,
        };

        if should_capture {
            if let Some(handle) = app_handle {
                // On utilise enigo pour obtenir la position globale car rdev n'est pas fiable pour ça sur toutes les plateformes
                use enigo::MouseControllable;
                let enigo = enigo::Enigo::new();
                let (x, y) = enigo.mouse_location();
                
                println!("🦀 Rust: Position capturée: X={}, Y={}", x, y);
                let _ = handle.emit("position-captured", (x, y));
                *capturing = false; // On arrête la capture après le premier F ou clic
                return None; // On bloque l'événement pendant la capture
            }
        } else if let EventType::KeyPress(rdev::Key::Escape) = event.event_type {
            println!("🦀 Rust: Capture annulée par ESC");
            *capturing = false; // Annuler la capture avec Escape
            return None;
        }
    }

    let key_name_option = match event.event_type {
        EventType::KeyPress(_) | EventType::KeyRelease(_) => get_key_name(&event.event_type),
        EventType::ButtonPress(_) | EventType::ButtonRelease(_) => get_mouse_button_name(&event.event_type),
        _ => None,
    };

    let key_name = if let Some(name) = key_name_option {
        name
    } else {
        return Some(event);
    };

    let macros = MACROS.lock().unwrap();
    if let Some(m) = macros.get(&key_name) {
        match event.event_type {
            EventType::KeyPress(_) | EventType::ButtonPress(_) => {
                match m.mode {
                    ExecutionMode::Once => {
                        let m_clone = m.clone();
                        tauri::async_runtime::spawn(async move {
                            run_macro(m_clone).await;
                        });
                    }
                    ExecutionMode::Toggle => {
                        let is_already_active = {
                            let active = ACTIVE_MACROS.lock().unwrap();
                            active.contains(&m.id)
                        };

                        if is_already_active {
                            let mut active = ACTIVE_MACROS.lock().unwrap();
                            active.remove(&m.id);
                        } else {
                            {
                                let mut active = ACTIVE_MACROS.lock().unwrap();
                                active.insert(m.id.clone());
                            }
                            let m_clone = m.clone();
                            tauri::async_runtime::spawn(async move {
                                run_macro(m_clone).await;
                            });
                        }
                    }
                    ExecutionMode::Hold => {
                        let is_already_active = {
                            let active = ACTIVE_MACROS.lock().unwrap();
                            active.contains(&m.id)
                        };

                        if !is_already_active {
                            {
                                let mut active = ACTIVE_MACROS.lock().unwrap();
                                active.insert(m.id.clone());
                            }
                            let m_clone = m.clone();
                            tauri::async_runtime::spawn(async move {
                                run_macro(m_clone).await;
                            });
                        }
                    }
                    ExecutionMode::Repeat => {
                        let m_clone = m.clone();
                        tauri::async_runtime::spawn(async move {
                            run_macro(m_clone).await;
                        });
                    }
                }
                if m.mode == ExecutionMode::Hold || m.mode == ExecutionMode::Toggle {
                    return None; // Swallow the event if it's a hold or toggle macro
                } else {
                    return Some(event); // Let the event pass through for Once and Repeat modes
                }
            }
            EventType::KeyRelease(_) | EventType::ButtonRelease(_) => {
                let mut active = ACTIVE_MACROS.lock().unwrap();
                if active.contains(&m.id) && m.mode == ExecutionMode::Hold {
                    active.remove(&m.id);
                }
                return Some(event); // Always let release events pass through
            }
            _ => {}
        }
    }

    if let Some(handle) = app_handle {
        let _ = handle.emit("key-pressed", key_name);
    }
    Some(event)
}

fn get_key_name(event_type: &EventType) -> Option<String> {
    match event_type {
        EventType::KeyPress(key) | EventType::KeyRelease(key) => {
            let s = format!("{:?}", key);
            let name = s.replace("Key", "").to_uppercase();
            
            // Harmonisation avec les IDs du frontend
            match name.as_str() {
                "RETURN" => Some("ENTER".to_string()),
                "ESCAPE" => Some("ESC".to_string()),
                "CONTROLLEFT" | "CONTROLRIGHT" => Some("CTRL".to_string()),
                "SHIFTLEFT" | "SHIFTRIGHT" => Some("SHIFT".to_string()),
                "ALTLEFT" | "ALTRIGHT" => Some("ALT".to_string()),
                "UPARROW" => Some("ARROWUP".to_string()),
                "DOWNARROW" => Some("ARROWDOWN".to_string()),
                "LEFTARROW" => Some("ARROWLEFT".to_string()),
                "RIGHTARROW" => Some("ARROWRIGHT".to_string()),
                _ => Some(name),
            }
        }
        _ => None,
    }
}

fn get_mouse_button_name(event_type: &EventType) -> Option<String> {
    match event_type {
        EventType::ButtonPress(btn) | EventType::ButtonRelease(btn) => {
            match btn {
                rdev::Button::Left => Some("MouseLeft".to_string()),
                rdev::Button::Right => Some("MouseRight".to_string()),
                rdev::Button::Middle => Some("MouseMiddle".to_string()),
                rdev::Button::Unknown(1) => Some("MouseX1".to_string()),
                rdev::Button::Unknown(2) => Some("MouseX2".to_string()),
                _ => None,
            }
        }
        _ => None,
    }
}
