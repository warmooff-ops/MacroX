export interface KeyInfo { 
   id: string; 
   label: string; 
   width: number; // en unités 'U' (1U = touche carrée) 
 } 
 
 export const KEYBOARD_LAYOUT: KeyInfo[][] = [ 
   // Rangée 0 (Fonction) 
   [ 
     { id: "Escape", label: "Esc", width: 1 }, 
     { id: "F1", label: "F1", width: 1 }, { id: "F2", label: "F2", width: 1 }, { id: "F3", label: "F3", width: 1 }, { id: "F4", label: "F4", width: 1 }, 
     { id: "F5", label: "F5", width: 1 }, { id: "F6", label: "F6", width: 1 }, { id: "F7", label: "F7", width: 1 }, { id: "F8", label: "F8", width: 1 }, 
     { id: "F9", label: "F9", width: 1 }, { id: "F10", label: "F10", width: 1 }, { id: "F11", label: "F11", width: 1 }, { id: "F12", label: "F12", width: 1 }, 
   ], 
   // Rangée 1 (Nombres) 
   [ 
     { id: "Backquote", label: "²", width: 1 }, 
     { id: "Digit1", label: "1", width: 1 }, { id: "Digit2", label: "2", width: 1 }, { id: "Digit3", label: "3", width: 1 }, 
     { id: "Digit4", label: "4", width: 1 }, { id: "Digit5", label: "5", width: 1 }, { id: "Digit6", label: "6", width: 1 }, 
     { id: "Digit7", label: "7", width: 1 }, { id: "Digit8", label: "8", width: 1 }, { id: "Digit9", label: "9", width: 1 }, 
     { id: "Digit0", label: "0", width: 1 }, { id: "Minus", label: ")", width: 1 }, { id: "Equal", label: "=", width: 1 }, 
     { id: "Backspace", label: "⌫", width: 2 }, 
   ], 
   // Rangée 2 (Top)
  [
    { id: "Tab", label: "↹", width: 1.5 },
    { id: "KeyQ", label: "Q", width: 1 }, { id: "KeyW", label: "W", width: 1 }, { id: "KeyE", label: "E", width: 1 },
    { id: "KeyR", label: "R", width: 1 }, { id: "KeyT", label: "T", width: 1 }, { id: "KeyY", label: "Y", width: 1 },
    { id: "KeyU", label: "U", width: 1 }, { id: "KeyI", label: "I", width: 1 }, { id: "KeyO", label: "O", width: 1 },
    { id: "KeyP", label: "P", width: 1 }, { id: "BracketLeft", label: "^", width: 1 }, { id: "BracketRight", label: "$", width: 1 },
    { id: "Enter", label: "↵", width: 1.5 }, // Note: simplification pour le visuel
  ],
  // Rangée 3 (Home)
  [
    { id: "CapsLock", label: "⇪", width: 1.75 },
    { id: "KeyA", label: "A", width: 1 }, { id: "KeyS", label: "S", width: 1 }, { id: "KeyD", label: "D", width: 1 },
    { id: "KeyF", label: "F", width: 1 }, { id: "KeyG", label: "G", width: 1 }, { id: "KeyH", label: "H", width: 1 },
    { id: "KeyJ", label: "J", width: 1 }, { id: "KeyK", label: "K", width: 1 }, { id: "KeyL", label: "L", width: 1 },
    { id: "KeyM", label: "M", width: 1 }, { id: "Quote", label: "%", width: 1 }, { id: "Backslash", label: "*", width: 1 },
  ],
  // Rangée 4 (Bottom)
  [
    { id: "ShiftLeft", label: "⇧", width: 1.25 },
    { id: "IntlBackslash", label: "<", width: 1 },
    { id: "KeyZ", label: "Z", width: 1 }, { id: "KeyX", label: "X", width: 1 }, { id: "KeyC", label: "C", width: 1 },
    { id: "KeyV", label: "V", width: 1 }, { id: "KeyB", label: "B", width: 1 }, { id: "KeyN", label: "N", width: 1 },
    { id: "Comma", label: ",", width: 1 }, { id: "Period", label: ";", width: 1 }, { id: "Slash", label: ":", width: 1 },
    { id: "ShiftRight", label: "⇧", width: 2.75 },
  ], 
   // Rangée 5 (Modificateurs) 
   [ 
     { id: "ControlLeft", label: "Ctrl", width: 1.25 }, 
     { id: "MetaLeft", label: "Win", width: 1.25 }, 
     { id: "AltLeft", label: "Alt", width: 1.25 }, 
     { id: "Space", label: " ", width: 6.25 }, 
     { id: "AltRight", label: "AltGr", width: 1.25 }, 
     { id: "Fn", label: "Fn", width: 1.25 }, 
     { id: "ControlRight", label: "Ctrl", width: 1.25 }, 
   ] 
 ]; 
