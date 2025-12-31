use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum ExecutionMode {
    Once,
    Hold,
    Toggle,
    Repeat,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum Action {
    KeyDown { value: String, delay_ms: u64 },
    KeyUp { value: String, delay_ms: u64 },
    MouseClick { button: String, delay_ms: u64 },
    MouseDown { button: String, delay_ms: u64 },
    MouseUp { button: String, delay_ms: u64 },
    MouseMove { x: i32, y: i32, delay_ms: u64 },
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Trigger {
    pub device: String, // "keyboard" or "mouse"
    pub key: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct MacroConfig {
    pub id: String,
    pub name: String,
    pub trigger: Trigger,
    pub mode: ExecutionMode,
    pub repeat_count: Option<u32>,
    pub repeat_delay_ms: Option<u64>,
    pub actions: Vec<Action>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AppSettings {
    pub language: String,
    pub auto_start: bool,
    pub theme: String, // "light" or "dark"
    pub layout: String,
    pub keyboard_layout_type: String, // "AZERTY" or "QWERTY"
    pub keyboard_size: String, // "60%", "80%", "100%"
    pub keyboard_scale: f32, // Default: 1.2 (20% larger)
    pub cursor_scale: f32,   // Default: 0.9 (10% smaller)
    pub active_profile: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Profile {
    pub name: String,
    pub settings: Option<AppSettings>,
    pub macros: Option<Vec<MacroConfig>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Config {
    pub settings: AppSettings,
}
