import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap } from 'lucide-react';
import MouseComponent from './Mouse';

import { getKeyLabel, normalizeKeyId } from '../utils/keyboardLayouts';

interface KeyInfo {
  id: string;
  label: string;
  width: number;
  row: number;
  block: 'alpha' | 'system' | 'numpad';
  offset?: number; // horizontal offset in U
  isISOEnter?: boolean;
  isVertical?: boolean; // For Numpad + and Enter
}

const KEYBOARD_DATA: KeyInfo[] = [
  // --- ALPHA BLOCK ---
  // Row 0 (Function keys)
  { id: 'Escape', label: 'Esc', width: 1, row: 0, block: 'alpha' },
  { id: 'F1', label: 'F1', width: 1.1, row: 0, block: 'alpha', offset: 1 },
  { id: 'F2', label: 'F2', width: 1.1, row: 0, block: 'alpha' },
  { id: 'F3', label: 'F3', width: 1.1, row: 0, block: 'alpha' },
  { id: 'F4', label: 'F4', width: 1.1, row: 0, block: 'alpha' },
  { id: 'F5', label: 'F5', width: 1.1, row: 0, block: 'alpha', offset: 0.5 },
  { id: 'F6', label: 'F6', width: 1.1, row: 0, block: 'alpha' },
  { id: 'F7', label: 'F7', width: 1.1, row: 0, block: 'alpha' },
  { id: 'F8', label: 'F8', width: 1.1, row: 0, block: 'alpha' },
  { id: 'F9', label: 'F9', width: 1.1, row: 0, block: 'alpha', offset: 0.5 },
  { id: 'F10', label: 'F10', width: 1.1, row: 0, block: 'alpha' },
  { id: 'F11', label: 'F11', width: 1.1, row: 0, block: 'alpha' },
  { id: 'F12', label: 'F12', width: 1.1, row: 0, block: 'alpha' },

  // Row 1 (Numbers)
  { id: 'Backquote', label: '²', width: 1, row: 1, block: 'alpha' },
  { id: 'Digit1', label: '1', width: 1, row: 1, block: 'alpha' },
  { id: 'Digit2', label: '2', width: 1, row: 1, block: 'alpha' },
  { id: 'Digit3', label: '3', width: 1, row: 1, block: 'alpha' },
  { id: 'Digit4', label: '4', width: 1, row: 1, block: 'alpha' },
  { id: 'Digit5', label: '5', width: 1, row: 1, block: 'alpha' },
  { id: 'Digit6', label: '6', width: 1, row: 1, block: 'alpha' },
  { id: 'Digit7', label: '7', width: 1, row: 1, block: 'alpha' },
  { id: 'Digit8', label: '8', width: 1, row: 1, block: 'alpha' },
  { id: 'Digit9', label: '9', width: 1, row: 1, block: 'alpha' },
  { id: 'Digit0', label: '0', width: 1, row: 1, block: 'alpha' },
  { id: 'DigitDegree', label: '°', width: 1, row: 1, block: 'alpha' },
  { id: 'Minus', label: ')', width: 1, row: 1, block: 'alpha' },
  { id: 'Backspace', label: '⌫', width: 2, row: 1, block: 'alpha' },

  // Row 2 (AZERTY)
  { id: 'Tab', label: '↹', width: 1.5, row: 2, block: 'alpha' },
  { id: 'KeyA', label: 'A', width: 1, row: 2, block: 'alpha' },
  { id: 'KeyZ', label: 'Z', width: 1, row: 2, block: 'alpha' },
  { id: 'KeyE', label: 'E', width: 1, row: 2, block: 'alpha' },
  { id: 'KeyR', label: 'R', width: 1, row: 2, block: 'alpha' },
  { id: 'KeyT', label: 'T', width: 1, row: 2, block: 'alpha' },
  { id: 'KeyY', label: 'Y', width: 1, row: 2, block: 'alpha' },
  { id: 'KeyU', label: 'U', width: 1, row: 2, block: 'alpha' },
  { id: 'KeyI', label: 'I', width: 1, row: 2, block: 'alpha' },
  { id: 'KeyO', label: 'O', width: 1, row: 2, block: 'alpha' },
  { id: 'KeyP', label: 'P', width: 1, row: 2, block: 'alpha' },
  { id: 'BracketLeft', label: '^', width: 1, row: 2, block: 'alpha' },
  { id: 'BracketRight', label: '$', width: 1, row: 2, block: 'alpha' },

  // Row 3 (QSDFG)
  { id: 'CapsLock', label: '⇪', width: 1.75, row: 3, block: 'alpha' },
  { id: 'KeyQ', label: 'Q', width: 1, row: 3, block: 'alpha' },
  { id: 'KeyS', label: 'S', width: 1, row: 3, block: 'alpha' },
  { id: 'KeyD', label: 'D', width: 1, row: 3, block: 'alpha' },
  { id: 'KeyF', label: 'F', width: 1, row: 3, block: 'alpha' },
  { id: 'KeyG', label: 'G', width: 1, row: 3, block: 'alpha' },
  { id: 'KeyH', label: 'H', width: 1, row: 3, block: 'alpha' },
  { id: 'KeyJ', label: 'J', width: 1, row: 3, block: 'alpha' },
  { id: 'KeyK', label: 'K', width: 1, row: 3, block: 'alpha' },
  { id: 'KeyL', label: 'L', width: 1, row: 3, block: 'alpha' },
  { id: 'KeyM', label: 'M', width: 1, row: 3, block: 'alpha' },
  { id: 'Quote', label: 'ù', width: 1, row: 3, block: 'alpha' },
  { id: 'Backslash', label: 'µ', width: 1, row: 3, block: 'alpha' },
  { id: 'Enter', label: '↵', width: 1.5, row: 2, block: 'alpha', isISOEnter: true },

  // Row 4 (WXCVB)
  { id: 'ShiftLeft', label: '⇧', width: 1.25, row: 4, block: 'alpha' },
  { id: 'IntlBackslash', label: '<', width: 1, row: 4, block: 'alpha' },
  { id: 'KeyW', label: 'W', width: 1, row: 4, block: 'alpha' },
  { id: 'KeyX', label: 'X', width: 1, row: 4, block: 'alpha' },
  { id: 'KeyC', label: 'C', width: 1, row: 4, block: 'alpha' },
  { id: 'KeyV', label: 'V', width: 1, row: 4, block: 'alpha' },
  { id: 'KeyB', label: 'B', width: 1, row: 4, block: 'alpha' },
  { id: 'KeyN', label: 'N', width: 1, row: 4, block: 'alpha' },
  { id: 'Comma', label: ',', width: 1, row: 4, block: 'alpha' },
  { id: 'Period', label: ';', width: 1, row: 4, block: 'alpha' },
  { id: 'Slash', label: ':', width: 1, row: 4, block: 'alpha' },
  { id: 'Exclamation', label: '!', width: 1, row: 4, block: 'alpha' },
  { id: 'ShiftRight', label: '⇧', width: 2.75, row: 4, block: 'alpha' },

  // Row 5 (Modifiers)
  { id: 'ControlLeft', label: 'Ctrl', width: 1.25, row: 5, block: 'alpha' },
  { id: 'MetaLeft', label: 'Win', width: 1.25, row: 5, block: 'alpha' },
  { id: 'AltLeft', label: 'Alt', width: 1.25, row: 5, block: 'alpha' },
  { id: 'Space', label: ' ', width: 6.25, row: 5, block: 'alpha' },
  { id: 'AltRight', label: 'AltGr', width: 1.25, row: 5, block: 'alpha' },
  { id: 'ContextMenu', label: 'Menu', width: 1.25, row: 5, block: 'alpha' }, 
  { id: 'Fn', label: 'Fn', width: 1.25, row: 5, block: 'alpha' },
  { id: 'ControlRight', label: 'Ctrl', width: 1.25, row: 5, block: 'alpha' },

  { id: 'ArrowUp', label: '↑', width: 1, row: 4, block: 'system', offset: 1 },
  { id: 'ArrowLeft', label: '←', width: 1, row: 5, block: 'system' },
  { id: 'ArrowDown', label: '↓', width: 1, row: 5, block: 'system' },
  { id: 'ArrowRight', label: '→', width: 1, row: 5, block: 'system' },
  
  // Row 1 (System)
  { id: 'Insert', label: 'Ins', width: 1, row: 1, block: 'system' },
  { id: 'Home', label: 'Hme', width: 1, row: 1, block: 'system' },
  { id: 'PageUp', label: 'PgU', width: 1, row: 1, block: 'system' },

  // Row 2 (System)
  { id: 'Delete', label: 'Del', width: 1, row: 2, block: 'system' },
  { id: 'End', label: 'End', width: 1, row: 2, block: 'system' },
  { id: 'PageDown', label: 'PgD', width: 1, row: 2, block: 'system' },

  // --- NUMPAD BLOCK ---
  { id: 'NumLock', label: 'Num', width: 1, row: 0, block: 'numpad' },
  { id: 'NumpadEqual', label: '=', width: 1, row: 0, block: 'numpad' },
  { id: 'NumpadClear', label: 'Clr', width: 1, row: 0, block: 'numpad' },
  { id: 'NumpadBackspace', label: '⌫', width: 1, row: 0, block: 'numpad' },

  { id: 'NumpadTab', label: 'Tab', width: 1, row: 1, block: 'numpad' },
  { id: 'NumpadDivide', label: '/', width: 1, row: 1, block: 'numpad' },
  { id: 'NumpadMultiply', label: '*', width: 1, row: 1, block: 'numpad' },
  { id: 'NumpadSubtract', label: '-', width: 1, row: 1, block: 'numpad' },

  { id: 'Numpad7', label: '7', width: 1, row: 2, block: 'numpad' },
  { id: 'Numpad8', label: '8', width: 1, row: 2, block: 'numpad' },
  { id: 'Numpad9', label: '9', width: 1, row: 2, block: 'numpad' },
  { id: 'NumpadAdd', label: '+', width: 1, row: 2, block: 'numpad', isVertical: true },

  { id: 'Numpad4', label: '4', width: 1, row: 3, block: 'numpad' },
  { id: 'Numpad5', label: '5', width: 1, row: 3, block: 'numpad' },
  { id: 'Numpad6', label: '6', width: 1, row: 3, block: 'numpad' },

  { id: 'Numpad1', label: '1', width: 1, row: 4, block: 'numpad' },
  { id: 'Numpad2', label: '2', width: 1, row: 4, block: 'numpad' },
  { id: 'Numpad3', label: '3', width: 1, row: 4, block: 'numpad' },
  { id: 'NumpadEnter', label: '↵', width: 1, row: 4, block: 'numpad', isVertical: true },

  { id: 'Numpad0', label: '0', width: 2, row: 5, block: 'numpad' },
  { id: 'NumpadDecimal', label: ',', width: 1, row: 5, block: 'numpad' },
];

interface DeviceMapperProps {
  selectedKey: string | null;
  onSelectKey: (id: string) => void;
  layoutType?: '100%' | '80%' | '60%';
  activeTriggers?: string[];
  onDrop?: (e: React.DragEvent, keyId: string) => void;
  onDragOver?: (e: React.DragEvent) => void;
}

const DeviceMapper: React.FC<DeviceMapperProps> = ({
  selectedKey: propSelectedKey,
  onSelectKey: propOnSelectKey,
  layoutType: propLayoutType,
  activeTriggers = [],
  onDrop,
  onDragOver,
}) => {
  const { settings, macros, setSelectedKey, selectedKey, isSidebarOpen } = useStore();
  const isLight = settings.theme === 'light';
  const layoutSize = settings.keyboard_size || propLayoutType || '100%';
  const layoutType = settings.keyboard_layout_type || 'AZERTY';

  if (!macros || !settings) {
    return (
      <div className={`flex-1 flex items-center justify-center ${isLight ? 'bg-slate-50' : 'bg-[#0f111a]'}`}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-black uppercase tracking-widest opacity-40">Chargement des données...</p>
        </div>
      </div>
    );
  }
  
  // Memoize macros map for O(1) lookup in renderKey
  const macrosMap = React.useMemo(() => {
    const map: Record<string, any> = {};
    if (macros && Array.isArray(macros)) {
      macros.forEach((m: any) => {
        if (m.trigger && m.trigger.key) {
          map[m.trigger.key] = m;
        }
      });
    }
    return map;
  }, [macros]);

  // Use store values if available, otherwise fallback to props
  const currentSelectedKey = selectedKey ?? propSelectedKey;
  const handleSelectKey = (keyId: string) => {
    setSelectedKey(keyId);
    if (propOnSelectKey) propOnSelectKey(keyId);
    
    // Dispatch custom event for MacroEditor if in picker mode
    window.dispatchEvent(new CustomEvent('macro-key-selected', { detail: { key: keyId } }));
  };
  const containerRef = React.useRef<HTMLDivElement>(null);

  const handleKeyClick = (e: React.MouseEvent, keyId: string) => {
    e.preventDefault();
    e.stopPropagation();
    handleSelectKey(keyId);
  };

  const calculateWidth = (width: number) => width * 54 + (width - 1) * 6;

  const isLastInRow = (key: KeyInfo) => {
    const keysInRow = KEYBOARD_DATA.filter(k => k.block === key.block && k.row === key.row);
    return keysInRow[keysInRow.length - 1]?.id === key.id;
  };

  const getDisplayLabel = (physicalKey: string, defaultLabel: string) => {
    return getKeyLabel(physicalKey, layoutType) || defaultLabel;
  };

  const renderKey = (key: KeyInfo) => {
    const isSelected = currentSelectedKey === key.id;
    const isActive = activeTriggers.includes(key.id);
    const hasMacro = !!macrosMap[key.id];
    const label = key.id === 'Space' ? '' : getDisplayLabel(key.id, key.label);

    const keyWidth = calculateWidth(key.width);
    const commonStyles = {
      marginLeft: key.offset ? `${key.offset * 60}px` : '0px',
    };

    const truncateName = (name: string, limit: number = 8) => {
      if (!name) return "";
      return name.length > limit ? name.substring(0, limit - 2) + ".." : name;
    };

    const macroName = hasMacro ? truncateName(macrosMap[key.id].name, 6) : null;

    const getSelectedStyles = () => {
      if (!isSelected && !hasMacro) return '';
      return isLight 
        ? 'border-primary bg-primary/10 shadow-[0_0_15px_rgba(139,92,246,0.3)]' 
        : 'border-primary bg-primary/20 shadow-[0_0_25px_rgba(139,92,246,0.5)]';
    };

    if (key.id === 'Enter') return null; // Handled in renderBlock

    if (key.isISOEnter) {
      return (
        <div key={key.id} className="relative" style={{ ...commonStyles, width: `${keyWidth}px`, height: '54px', marginLeft: 'auto' }}>
          <motion.button
            whileHover={{ scale: 1.01, y: -1 }}
            whileTap={{ scale: 0.98, y: 0 }}
            onMouseDown={(e) => handleKeyClick(e as any, key.id)}
            onDragOver={onDragOver}
            onDrop={(e) => onDrop?.(e, key.id)}
            style={{ 
              width: `${keyWidth}px`,
              height: '114px',
              position: 'absolute',
              right: '0px',
              top: '0px',
              zIndex: 10,
              clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 16.66% 100%, 16.66% 47.82%, 0% 47.82%)'
            }}
            className={`
              keyboard-key flex flex-col items-center justify-end pb-3 rounded-xl text-[11px] font-black transition-all duration-200
              border shadow-sm
              ${getSelectedStyles()}
              ${!isSelected && !hasMacro ? (
                isActive
                  ? 'bg-primary/40 border-primary/50 text-white shadow-[0_0_15px_rgba(139,92,246,0.5)]'
                  : isLight 
                    ? 'bg-white border-[#E9ECEF] text-[#212529] shadow-sm hover:bg-[#F8F9FA] hover:border-[#E9ECEF]'
                    : 'bg-[#1a1d23] border-white/10 text-white hover:bg-white/20 hover:border-primary/50 hover:text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]'
              ) : ''}
              ${isSelected ? 'border-primary bg-primary shadow-[0_0_15px_rgba(139,92,246,0.3)]' : ''}
            `}
          >
            {macroName && (
              <span className="text-[7px] text-primary absolute top-2 left-1/2 -translate-x-1/2 uppercase tracking-tighter opacity-80 whitespace-nowrap overflow-hidden">
                {macroName}
              </span>
            )}
            <span className="relative z-10">{label}</span>
          </motion.button>
        </div>
      );
    }

    if (key.isVertical) {
      return (
        <motion.button
          key={key.id}
          whileHover={{ scale: 1.01, y: -1 }}
          whileTap={{ scale: 0.98, y: 0 }}
          onMouseDown={(e) => handleKeyClick(e as any, key.id)}
          onDragOver={onDragOver}
          onDrop={(e) => onDrop?.(e, key.id)}
          style={{ 
            ...commonStyles,
            width: `${keyWidth}px`,
            height: key.id === 'NumpadAdd' || key.id === 'NumpadEnter' ? '114px' : '54px', 
            zIndex: 5
          }}
          className={`
            keyboard-key flex flex-col items-center justify-center rounded-xl text-[11px] font-black transition-all duration-200
            border shadow-sm relative
            ${getSelectedStyles()}
            ${isSelected 
              ? 'border-primary bg-primary shadow-[0_0_15px_rgba(139,92,246,0.3)]' 
              : isLight
                ? 'bg-white border-[#E9ECEF] text-[#212529] shadow-sm hover:bg-[#F8F9FA] hover:border-[#E9ECEF]'
                : 'bg-[#1A1D23] border-white/5 text-white/80 hover:bg-white/10 hover:border-primary/50 hover:text-white'
            }
          `}
        >
          {macroName && (
            <span className="text-[7px] text-primary absolute top-2 left-1/2 -translate-x-1/2 uppercase tracking-tighter opacity-80 whitespace-nowrap overflow-hidden truncate w-[90%] text-center">
              {macroName}
            </span>
          )}
          <span className="relative z-10">{label}</span>
        </motion.button>
      );
    }

    if (!label && key.id.startsWith('empty')) {
      return (
        <div 
          key={key.id} 
          style={{ ...commonStyles, width: `${keyWidth}px` }} 
          className="h-[54px]"
        />
      );
    }

    return (
      <motion.button
        key={key.id}
        whileHover={{ scale: 1.01, y: -1 }}
        whileTap={{ scale: 0.98, y: 0 }}
        onMouseDown={(e) => handleKeyClick(e as any, key.id)}
        onDragOver={onDragOver}
        onDrop={(e) => onDrop?.(e, key.id)}
        style={{ 
          ...commonStyles, 
          width: `${keyWidth}px`,
        }}
        className={`
          keyboard-key h-[54px] flex flex-col items-center justify-center rounded-xl text-[11px] font-black transition-all duration-200
          border shadow-sm relative
          ${getSelectedStyles()}
          ${!isSelected && !hasMacro ? (
            isActive
              ? 'bg-primary/40 border-primary/50 text-white shadow-[0_0_15px_rgba(139,92,246,0.5)]'
              : isLight
                ? 'bg-white border-[#E9ECEF] text-[#212529] shadow-sm hover:bg-[#F8F9FA] hover:border-primary/50 hover:text-slate-900'
                : 'bg-[#1a1d23] border-white/10 text-white hover:bg-white/20 hover:border-primary/50 hover:text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]'
          ) : ''}
        `}
      >
        {macroName && (
          <span className="text-[7px] text-primary absolute top-1.5 left-1/2 -translate-x-1/2 uppercase tracking-tighter opacity-80 whitespace-nowrap overflow-hidden truncate w-[90%] text-center">
            {macroName}
          </span>
        )}
        <span className={`relative z-10 ${macroName ? 'mt-2' : ''}`}>{label}</span>
      </motion.button>
    );
  };

  const renderBlock = (blockName: 'alpha' | 'system' | 'numpad') => {
    // Show numpad ONLY if layout is 100%
    if (layoutSize === '60%' && blockName !== 'alpha') return null;
    if (layoutSize === '80%' && blockName === 'numpad') return null;
    if (layoutSize === '100%' && blockName === 'numpad') {
        // Numpad is always shown for 100%
    } else if (layoutSize !== '100%' && blockName === 'numpad') {
        return null;
    }

    if (blockName === 'numpad') {
      return (
          <div className="flex flex-col gap-1.5 justify-start">
            {/* Numpad Row 0: NumLk, =, Clr, ⌫ */}
            <div key="numpad-row-0" className="flex gap-1.5 mb-[20px] h-[54px]">
              {KEYBOARD_DATA.filter(k => k.block === 'numpad' && k.row === 0).map((key, i) => renderKey(key))}
            </div>

            {/* Numpad Row 1: Tab, /, *, - */}
            <div key="numpad-row-1" className="flex gap-1.5 h-[54px]">
              {KEYBOARD_DATA.filter(k => k.block === 'numpad' && k.row === 1).map((key, i) => renderKey(key))}
            </div>
            
            <div className="grid grid-cols-4 gap-1.5">
              {/* Row 2: 7, 8, 9, + (vertical) */}
              {KEYBOARD_DATA.filter(k => k.block === 'numpad' && k.row === 2 && k.id !== 'NumpadAdd').map((key, i) => renderKey(key))}
              <div key="numpad-add-vertical" className="row-span-2">
                {renderKey(KEYBOARD_DATA.find(k => k.id === 'NumpadAdd')!)}
              </div>

              {/* Row 3: 4, 5, 6 */}
              {KEYBOARD_DATA.filter(k => k.block === 'numpad' && k.row === 3).map((key, i) => renderKey(key))}

              {/* Row 4: 1, 2, 3, Enter (vertical) */}
              {KEYBOARD_DATA.filter(k => k.block === 'numpad' && k.row === 4 && k.id !== 'NumpadEnter').map((key, i) => renderKey(key))}
              <div key="numpad-enter-vertical" className="row-span-2">
                {renderKey(KEYBOARD_DATA.find(k => k.id === 'NumpadEnter')!)}
              </div>

              {/* Row 5: 0 (width 2), . */}
              <div key="numpad-0-container" className="col-span-2">
                {renderKey(KEYBOARD_DATA.find(k => k.id === 'Numpad0')!)}
              </div>
              {renderKey(KEYBOARD_DATA.find(k => k.id === 'NumpadDecimal')!)}
            </div>
          </div>
      );
    }

    return (
      <div className="flex flex-col gap-1.5 justify-start">
        {[0, 1, 2, 3, 4, 5].map((rowIdx) => {
          const keysInRow = KEYBOARD_DATA.filter(k => k.block === blockName && k.row === rowIdx);
          
          let blockWidth = blockName === 'alpha' ? '894px' : '164px';

          return (
            <div 
              key={rowIdx} 
              className={`flex gap-1.5 relative h-[54px] ${keysInRow.length === 0 ? 'pointer-events-none' : ''} ${rowIdx === 0 ? 'mb-[20px]' : ''}`} 
              style={{ width: blockWidth }}
            >
              {keysInRow.map(key => {
                if (key.id === 'Enter') {
                  const isSelected = currentSelectedKey === 'Enter';
                  const hasMacro = !!macrosMap['Enter'];
                  // ISO Enter: 
                  // Row 2: width 1.5 (starts at 13.5)
                  // Row 3: width 2.25 (starts at 12.75)
                  // Total width 2.25, height 2 rows + gap
                  // ISO Enter dimensions for AZERTY
                  // Top part: 1.5U, Bottom part: 1.25U
                  // Total width for flex flow: 1.5U
                  const enterWidth = calculateWidth(1.5);
                  const enterHeight = 54 * 2 + 6;

                  return (
                    <div key={key.id} className="relative" style={{ width: `${enterWidth}px` }}>
                      <motion.button
                        whileHover={{ scale: 1.01, zIndex: 10 }}
                        whileTap={{ scale: 0.98 }}
                        onMouseDown={(e) => handleKeyClick(e as any, 'Enter')}
                        onDragOver={onDragOver}
                        onDrop={(e) => onDrop?.(e, 'Enter')}
                        className={`
                          absolute right-0 top-0 z-20
                          rounded-xl border transition-all duration-300 flex items-center justify-center
                          ${isSelected || hasMacro 
                            ? isLight 
                              ? 'border-primary bg-primary/10 shadow-[0_0_15px_rgba(139,92,246,0.3)]' 
                              : 'border-primary bg-primary/20 shadow-[0_0_25px_rgba(139,92,246,0.5)]'
                            : isLight ? 'bg-white border-[#E9ECEF]' : 'bg-[#12141a] border-white/5'}
                        `}
                        style={{
                          width: `${enterWidth}px`,
                          height: `${enterHeight}px`,
                          marginTop: '0px',
                          // ISO Shape: Total 1.5U. 
                          // Top part: 1.5U (0% to 100%)
                          // Bottom part: 1.25U (starts at 0.25U from left of 1.5U)
                          // 0.25 / 1.5 = 16.66%
                          clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 16.66% 100%, 16.66% 50%, 0% 50%)'
                        }}
                      >
                        <span className="text-[14px] font-black opacity-40">↵</span>
                      </motion.button>
                    </div>
                  );
                }
                return renderKey(key);
              })}
              {/* Add placeholder for Enter in Row 3 to maintain alignment (1.25U for ISO Enter bottom) */}
              {blockName === 'alpha' && rowIdx === 3 && (
                <div style={{ width: `${calculateWidth(1.25)}px` }} className="h-[54px] ml-auto" />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderMouseButton = (id: string, label: string, className: string) => {
    const isSelected = currentSelectedKey === id;
    const hasMacro = !!macrosMap[id];
    const isActive = activeTriggers.includes(id);

    return (
      <motion.button
        whileHover={{ scale: 1.01, filter: 'brightness(1.1)' }}
        whileTap={{ scale: 0.98 }}
        onMouseDown={(e) => handleKeyClick(e as any, id)}
        className={`${className} transition-all duration-300 flex items-center justify-center rounded-2xl border
          ${isSelected || hasMacro ? 'border-primary bg-primary/10 shadow-[0_0_20px_rgba(139,92,246,0.4)]' : isLight ? 'bg-white border-[#E9ECEF] text-[#212529] hover:bg-[#F8F9FA] hover:border-[#E9ECEF]' : 'bg-white/5 border-white/5 text-slate-400 hover:border-primary/50 hover:text-primary'}
          group
        `}
        style={{
          boxShadow: !isSelected && !hasMacro && !isLight ? 'inset 0 1px 1px rgba(255,255,255,0.05), 0 4px 6px -1px rgba(0,0,0,0.3)' : undefined
        }}
      >
        <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
      </motion.button>
    );
  };



  return (
    <div className={`flex-1 flex flex-col items-center justify-center p-8 ${isLight ? 'bg-slate-50' : 'bg-[#0f111a]'}`}>
      <div className="relative group">
        {/* Main Device Container - Improved Visibility */}
        <div 
          className={`
            relative p-10 rounded-[40px] border-2 transition-all duration-500
            ${isLight 
              ? 'bg-white border-slate-200 shadow-2xl' 
              : 'bg-[#12141a] border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.6)]'}
          `}
        >
          <div className="flex items-start gap-12">
            {/* Keyboard Section */}
            <div className="flex flex-col gap-8">
              <div className="flex gap-10">
                {renderBlock('alpha')}
                {renderBlock('system')}
                {renderBlock('numpad')}
              </div>
              
              {/* Keyboard Label */}
              <div className="flex flex-col items-center gap-2 mt-4">
                <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] opacity-40">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span className={isLight ? 'text-slate-400' : 'text-white'}>G915 LIGHTSPEED</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                </div>
                <div className="h-0.5 w-24 bg-gradient-to-r from-transparent via-primary/30 to-transparent rounded-full" />
              </div>
            </div>

            {/* Mouse Section */}
            <div className="flex flex-col items-center justify-between h-full pt-10">
              <div className="flex-1 flex items-center">
                <MouseComponent 
                  selectedKey={currentSelectedKey}
                  onAction={handleSelectKey}
                  onDragOver={onDragOver || (() => {})}
                  onDrop={onDrop || (() => {})}
                  theme={settings.theme}
                />
              </div>

              {/* Mouse Label */}
              <div className="flex flex-col items-center gap-2 mt-8">
                <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] opacity-40">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span className={isLight ? 'text-slate-400' : 'text-white'}>G502 LIGHTSPEED</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                </div>
                <div className="h-0.5 w-24 bg-gradient-to-r from-transparent via-primary/30 to-transparent rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeviceMapper;
