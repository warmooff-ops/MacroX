use crate::models::{Action, MacroConfig, ExecutionMode};
use enigo::{Enigo, KeyboardControllable, MouseControllable, Key, MouseButton};
use std::time::Duration;
use tokio::time::sleep;

pub async fn execute_actions(actions: Vec<Action>, macro_id: Option<&str>, layout: &str) {
    let mut enigo = Enigo::new();
    for action in actions {
        // If this is a hold macro, check if it's still active before each action
        if let Some(id) = macro_id {
            let active = crate::hook::ACTIVE_MACROS.lock().unwrap();
            if !active.contains(id) {
                return;
            }
        }

        match action {
            Action::KeyDown { value, delay_ms } => {
                if let Some(key) = parse_key(&value, layout) {
                    enigo.key_down(key);
                }
                sleep(Duration::from_millis(delay_ms)).await;
            }
            Action::KeyUp { value, delay_ms } => {
                if let Some(key) = parse_key(&value, layout) {
                    enigo.key_up(key);
                }
                sleep(Duration::from_millis(delay_ms)).await;
            }
            Action::MouseClick { button, delay_ms } => {
                if let Some(btn) = parse_mouse_button(&button) {
                    enigo.mouse_click(btn);
                }
                sleep(Duration::from_millis(delay_ms)).await;
            }
            Action::MouseDown { button, delay_ms } => {
                if let Some(btn) = parse_mouse_button(&button) {
                    enigo.mouse_down(btn);
                }
                sleep(Duration::from_millis(delay_ms)).await;
            }
            Action::MouseUp { button, delay_ms } => {
                if let Some(btn) = parse_mouse_button(&button) {
                    enigo.mouse_up(btn);
                }
                sleep(Duration::from_millis(delay_ms)).await;
            }
            Action::MouseMove { x, y, delay_ms } => {
                enigo.mouse_move_to(x, y);
                sleep(Duration::from_millis(delay_ms)).await;
            }
        }
    }
}

pub async fn run_macro(config: MacroConfig) {
    let id = config.id.clone();
    let settings = crate::persistence::load_config().settings;
    let layout = settings.keyboard_layout_type;

    match config.mode {
        ExecutionMode::Once => {
            execute_actions(config.actions, None, &layout).await;
        }
        ExecutionMode::Toggle => {
            while crate::hook::ACTIVE_MACROS.lock().unwrap().contains(&id) {
                execute_actions(config.actions.clone(), Some(&id), &layout).await;
                sleep(Duration::from_millis(10)).await;
            }
        }
        ExecutionMode::Hold => {
            while crate::hook::ACTIVE_MACROS.lock().unwrap().contains(&id) {
                execute_actions(config.actions.clone(), Some(&id), &layout).await;
                sleep(Duration::from_millis(10)).await;
            }
        }
        ExecutionMode::Repeat => {
            let count = config.repeat_count.unwrap_or(1);
            for _ in 0..count {
                execute_actions(config.actions.clone(), None, &layout).await;
            }
        }
    }
}

fn parse_key(key_str: &str, layout: &str) -> Option<Key> {
    let k = key_str.to_uppercase();
    
    // Mapping des touches physiques vers les caractères selon le layout
    // On suit la même logique que keyboardLayouts.ts dans le frontend
    let char_to_press = match layout {
        "AZERTY" => {
            match k.as_str() {
                "Q" => 'a',
                "W" => 'z',
                "E" => 'e',
                "R" => 'r',
                "T" => 't',
                "Y" => 'y',
                "U" => 'u',
                "I" => 'i',
                "O" => 'o',
                "P" => 'p',
                "A" => 'q',
                "S" => 's',
                "D" => 'd',
                "F" => 'f',
                "G" => 'g',
                "H" => 'h',
                "J" => 'j',
                "K" => 'k',
                "L" => 'l',
                "M" => 'm',
                "Z" => 'w',
                "X" => 'x',
                "C" => 'c',
                "V" => 'v',
                "B" => 'b',
                "N" => 'n',
                _ => k.chars().next().unwrap_or(' ').to_ascii_lowercase(),
            }
        },
        "QWERTZ" => {
            match k.as_str() {
                "Y" => 'z',
                "Z" => 'y',
                _ => k.chars().next().unwrap_or(' ').to_ascii_lowercase(),
            }
        },
        _ => k.chars().next().unwrap_or(' ').to_ascii_lowercase(), // QWERTY ou défaut
    };

    match k.as_str() {
        "SPACE" => Some(Key::Space),
        "ENTER" => Some(Key::Return),
        "ESC" => Some(Key::Escape),
        "SHIFT" => Some(Key::Shift),
        "CTRL" => Some(Key::Control),
        "ALT" => Some(Key::Alt),
        "TAB" => Some(Key::Tab),
        "BACKSPACE" => Some(Key::Backspace),
        "UP" => Some(Key::UpArrow),
        "DOWN" => Some(Key::DownArrow),
        "LEFT" => Some(Key::LeftArrow),
        "RIGHT" => Some(Key::RightArrow),
        _ => Some(Key::Layout(char_to_press)),
    }
}

fn parse_mouse_button(btn_str: &str) -> Option<MouseButton> {
    match btn_str.to_lowercase().as_str() {
        "left" => Some(MouseButton::Left),
        "right" => Some(MouseButton::Right),
        "middle" => Some(MouseButton::Middle),
        _ => None,
    }
}
