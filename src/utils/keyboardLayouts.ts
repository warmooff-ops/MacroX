export type KeyboardLayout = 'AZERTY' | 'QWERTY' | 'QWERTZ';

export interface KeyMapping {
  id: string;      // The system/HID key ID (e.g., 'KeyQ')
  labels: {
    [key in KeyboardLayout]: string;
  };
}

export const KEY_MAPPINGS: Record<string, KeyMapping> = {
  // Row 1 (Numbers & Special)
  'Backquote': { id: 'Backquote', labels: { AZERTY: '²', QWERTY: '`', QWERTZ: '^' } },
  'Digit1': { id: 'Digit1', labels: { AZERTY: '1', QWERTY: '1', QWERTZ: '1' } },
  'Digit2': { id: 'Digit2', labels: { AZERTY: '2', QWERTY: '2', QWERTZ: '2' } },
  'Digit3': { id: 'Digit3', labels: { AZERTY: '3', QWERTY: '3', QWERTZ: '3' } },
  'Digit4': { id: 'Digit4', labels: { AZERTY: '4', QWERTY: '4', QWERTZ: '4' } },
  'Digit5': { id: 'Digit5', labels: { AZERTY: '5', QWERTY: '5', QWERTZ: '5' } },
  'Digit6': { id: 'Digit6', labels: { AZERTY: '6', QWERTY: '6', QWERTZ: '6' } },
  'Digit7': { id: 'Digit7', labels: { AZERTY: '7', QWERTY: '7', QWERTZ: '7' } },
  'Digit8': { id: 'Digit8', labels: { AZERTY: '8', QWERTY: '8', QWERTZ: '8' } },
  'Digit9': { id: 'Digit9', labels: { AZERTY: '9', QWERTY: '9', QWERTZ: '9' } },
  'Digit0': { id: 'Digit0', labels: { AZERTY: '0', QWERTY: '0', QWERTZ: '0' } },
  'DigitDegree': { id: 'DigitDegree', labels: { AZERTY: '°', QWERTY: '°', QWERTZ: '°' } },
  'Minus': { id: 'Minus', labels: { AZERTY: ')', QWERTY: '-', QWERTZ: 'ß' } },
  'Equal': { id: 'Equal', labels: { AZERTY: '=', QWERTY: '=', QWERTZ: '´' } },

  // Row 2
  'KeyQ': { id: 'KeyQ', labels: { AZERTY: 'Q', QWERTY: 'Q', QWERTZ: 'Q' } },
  'KeyW': { id: 'KeyW', labels: { AZERTY: 'W', QWERTY: 'W', QWERTZ: 'W' } },
  'KeyE': { id: 'KeyE', labels: { AZERTY: 'E', QWERTY: 'E', QWERTZ: 'E' } },
  'KeyR': { id: 'KeyR', labels: { AZERTY: 'R', QWERTY: 'R', QWERTZ: 'R' } },
  'KeyT': { id: 'KeyT', labels: { AZERTY: 'T', QWERTY: 'T', QWERTZ: 'T' } },
  'KeyY': { id: 'KeyY', labels: { AZERTY: 'Y', QWERTY: 'Y', QWERTZ: 'Z' } }, // QWERTZ swap Y/Z
  'KeyU': { id: 'KeyU', labels: { AZERTY: 'U', QWERTY: 'U', QWERTZ: 'U' } },
  'KeyI': { id: 'KeyI', labels: { AZERTY: 'I', QWERTY: 'I', QWERTZ: 'I' } },
  'KeyO': { id: 'KeyO', labels: { AZERTY: 'O', QWERTY: 'O', QWERTZ: 'O' } },
  'KeyP': { id: 'KeyP', labels: { AZERTY: 'P', QWERTY: 'P', QWERTZ: 'P' } },
  'BracketLeft': { id: 'BracketLeft', labels: { AZERTY: '^', QWERTY: '[', QWERTZ: 'Ü' } },
  'BracketRight': { id: 'BracketRight', labels: { AZERTY: '$', QWERTY: ']', QWERTZ: '*' } },

  // Row 3
  'KeyA': { id: 'KeyA', labels: { AZERTY: 'A', QWERTY: 'A', QWERTZ: 'A' } },
  'KeyS': { id: 'KeyS', labels: { AZERTY: 'S', QWERTY: 'S', QWERTZ: 'S' } },
  'KeyD': { id: 'KeyD', labels: { AZERTY: 'D', QWERTY: 'D', QWERTZ: 'D' } },
  'KeyF': { id: 'KeyF', labels: { AZERTY: 'F', QWERTY: 'F', QWERTZ: 'F' } },
  'KeyG': { id: 'KeyG', labels: { AZERTY: 'G', QWERTY: 'G', QWERTZ: 'G' } },
  'KeyH': { id: 'KeyH', labels: { AZERTY: 'H', QWERTY: 'H', QWERTZ: 'H' } },
  'KeyJ': { id: 'KeyJ', labels: { AZERTY: 'J', QWERTY: 'J', QWERTZ: 'J' } },
  'KeyK': { id: 'KeyK', labels: { AZERTY: 'K', QWERTY: 'K', QWERTZ: 'K' } },
  'KeyL': { id: 'KeyL', labels: { AZERTY: 'L', QWERTY: 'L', QWERTZ: 'L' } },
  'KeyM': { id: 'KeyM', labels: { AZERTY: 'M', QWERTY: ';', QWERTZ: 'Ö' } },
  'Quote': { id: 'Quote', labels: { AZERTY: '%', QWERTY: "'", QWERTZ: 'Ä' } },
  'Backslash': { id: 'Backslash', labels: { AZERTY: 'µ', QWERTY: '\\', QWERTZ: '#' } },

  // Row 4
  'IntlBackslash': { id: 'IntlBackslash', labels: { AZERTY: '<', QWERTY: '\\', QWERTZ: '<' } },
  'KeyZ': { id: 'KeyZ', labels: { AZERTY: 'Z', QWERTY: 'Z', QWERTZ: 'Y' } }, // QWERTZ swap Y/Z
  'KeyX': { id: 'KeyX', labels: { AZERTY: 'X', QWERTY: 'X', QWERTZ: 'X' } },
  'KeyC': { id: 'KeyC', labels: { AZERTY: 'C', QWERTY: 'C', QWERTZ: 'C' } },
  'KeyV': { id: 'KeyV', labels: { AZERTY: 'V', QWERTY: 'V', QWERTZ: 'V' } },
  'KeyB': { id: 'KeyB', labels: { AZERTY: 'B', QWERTY: 'B', QWERTZ: 'B' } },
  'KeyN': { id: 'KeyN', labels: { AZERTY: 'N', QWERTY: 'N', QWERTZ: 'N' } },
  'Comma': { id: 'Comma', labels: { AZERTY: ',', QWERTY: ',', QWERTZ: 'M' } },
  'Period': { id: 'Period', labels: { AZERTY: ';', QWERTY: '.', QWERTZ: ',' } },
  'Slash': { id: 'Slash', labels: { AZERTY: ':', QWERTY: '/', QWERTZ: '.' } },
  'Exclamation': { id: 'Exclamation', labels: { AZERTY: '!', QWERTY: '!', QWERTZ: '-' } },
};

export function getKeyLabel(id: string, layout: KeyboardLayout = 'AZERTY'): string {
  // Systematic abbreviations
  const abbreviations: Record<string, string> = {
    'Insert': 'Ins', 'INSERT': 'Ins',
    'Delete': 'Del', 'DELETE': 'Del',
    'Home': 'Hme', 'HOME': 'Hme',
    'PageUp': 'PgU', 'PAGEUP': 'PgU',
    'PageDown': 'PgD', 'PAGEDOWN': 'PgD',
    'End': 'End', 'END': 'End',
    'Numpad7': '7',
    'Numpad8': '8',
    'Numpad9': '9',
    'Numpad4': '4',
    'Numpad5': '5',
    'Numpad6': '6',
    'Numpad1': '1',
    'Numpad2': '2',
    'Numpad3': '3',
    'Numpad0': '0',
    'NumpadAdd': '+', 'NUMPADADD': '+',
    'NumpadSubtract': '-', 'NUMPADSUBTRACT': '-',
    'NumpadMultiply': '*', 'NUMPADMULTIPLY': '*',
    'NumpadDivide': '/', 'NUMPADDIVIDE': '/',
    'NumpadDecimal': '.', 'NUMPADDECIMAL': '.',
    'NumpadEnter': '↵', 'NUMPADENTER': '↵',
    'Enter': '↵', 'ENTER': '↵',
    'Backspace': '⌫', 'BACKSPACE': '⌫',
    'Tab': '↹', 'TAB': '↹',
    'CapsLock': '⇪', 'CAPSLOCK': '⇪',
    'ShiftLeft': '⇧', 'SHIFTLEFT': '⇧',
    'ShiftRight': '⇧', 'SHIFTRIGHT': '⇧',
    'ControlLeft': 'Ctrl', 'CONTROLLEFT': 'Ctrl',
    'ControlRight': 'Ctrl', 'CONTROLRIGHT': 'Ctrl',
    'AltLeft': 'Alt', 'ALTLEFT': 'Alt',
    'AltRight': 'AltGr', 'ALTRIGHT': 'AltGr',
    'MetaLeft': 'Win', 'METALEFT': 'Win',
    'Escape': 'Esc', 'ESCAPE': 'Esc',
    'ArrowUp': '↑', 'ARROWUP': '↑',
    'ArrowDown': '↓', 'ARROWDOWN': '↓',
    'ArrowLeft': '←', 'ARROWLEFT': '←',
    'ArrowRight': '→', 'ARROWRIGHT': '→',
    'NumpadPlus': '+',
    'MouseButtonLeft': 'G',
    'MouseButtonRight': 'D',
    'MouseButtonMiddle': 'Milieu',
    'MouseButtonForward': 'F',
    'MouseButtonBack': 'B',
    'MouseLeft': 'G',
    'MouseRight': 'D',
    'MouseMiddle': 'Milieu',
    'MouseForward': 'F',
    'MouseBack': 'B',
    'Space': 'Espace',
    'SPACE': 'Espace',
  };

  if (abbreviations[id]) return abbreviations[id];

  const mapping = KEY_MAPPINGS[id];
  if (mapping) {
    return mapping.labels[layout];
  }
  
  // Return the ID itself if no mapping found, but cleaned up
  return id.replace('Key', '').replace('Digit', '').replace('Numpad', 'Num ');
}

/**
 * Normalizes key names between frontend (e.g. "KeyQ") and backend (e.g. "Q")
 */
export function normalizeKeyId(id: string): string {
  if (!id || id === 'UNASSIGNED') return id;
  // Keep mouse buttons as they are but ensure consistency
  if (id.startsWith('Mouse')) return id;
  return id.replace('Key', '').replace('Digit', '').toUpperCase();
}

/**
 * Denormalizes key names from backend (e.g. "Q") to frontend (e.g. "KeyQ")
 */
export function denormalizeKeyId(id: string): string {
  if (id === 'UNASSIGNED') return id;
  if (id.length === 1 && /[A-Z]/.test(id)) {
    return `Key${id}`;
  }
  if (id.length === 1 && /[0-9]/.test(id)) {
    return `Digit${id}`;
  }
  return id;
}
