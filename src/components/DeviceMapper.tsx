import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';

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
  { id: 'F1', label: 'F1', width: 1, row: 0, block: 'alpha', offset: 1 }, // F1 above '2'
  { id: 'F2', label: 'F2', width: 1, row: 0, block: 'alpha' },
  { id: 'F3', label: 'F3', width: 1, row: 0, block: 'alpha' },
  { id: 'F4', label: 'F4', width: 1, row: 0, block: 'alpha' },
  { id: 'F5', label: 'F5', width: 1, row: 0, block: 'alpha', offset: 0.5 },
  { id: 'F6', label: 'F6', width: 1, row: 0, block: 'alpha' },
  { id: 'F7', label: 'F7', width: 1, row: 0, block: 'alpha' },
  { id: 'F8', label: 'F8', width: 1, row: 0, block: 'alpha' },
  { id: 'F9', label: 'F9', width: 1, row: 0, block: 'alpha', offset: 0.5 },
  { id: 'F10', label: 'F10', width: 1, row: 0, block: 'alpha' },
  { id: 'F11', label: 'F11', width: 1, row: 0, block: 'alpha' },
  { id: 'F12', label: 'F12', width: 1, row: 0, block: 'alpha' },

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
  { id: 'Minus', label: ')', width: 1, row: 1, block: 'alpha' },
  { id: 'Equal', label: '=', width: 1, row: 1, block: 'alpha' },
  { id: 'Backspace', label: '⌫', width: 2, row: 1, block: 'alpha' },

  // Row 2 (AZERTY) - Tab 1.5U
  { id: 'Tab', label: '↹', width: 1.5, row: 2, block: 'alpha' },
  { id: 'KeyQ', label: 'A', width: 1, row: 2, block: 'alpha' },
  { id: 'KeyW', label: 'Z', width: 1, row: 2, block: 'alpha' },
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
  { id: 'Enter', label: '↵', width: 1.25, row: 2, block: 'alpha', isISOEnter: true }, 

  // Row 3 (QSDFG) - CapsLock 1.75U
  { id: 'CapsLock', label: '⇪', width: 1.75, row: 3, block: 'alpha' },
  { id: 'KeyA', label: 'Q', width: 1, row: 3, block: 'alpha' },
  { id: 'KeyS', label: 'S', width: 1, row: 3, block: 'alpha' },
  { id: 'KeyD', label: 'D', width: 1, row: 3, block: 'alpha' },
  { id: 'KeyF', label: 'F', width: 1, row: 3, block: 'alpha' },
  { id: 'KeyG', label: 'G', width: 1, row: 3, block: 'alpha' },
  { id: 'KeyH', label: 'H', width: 1, row: 3, block: 'alpha' },
  { id: 'KeyJ', label: 'J', width: 1, row: 3, block: 'alpha' },
  { id: 'KeyK', label: 'K', width: 1, row: 3, block: 'alpha' },
  { id: 'KeyL', label: 'L', width: 1, row: 3, block: 'alpha' },
  { id: 'KeyM', label: 'M', width: 1, row: 3, block: 'alpha' },
  { id: 'Quote', label: '%', width: 1, row: 3, block: 'alpha' },
  { id: 'Backslash', label: 'µ', width: 1, row: 3, block: 'alpha' },

  // Row 4 (WXCVB) - ShiftLeft 1.25U + IntlBackslash 1U = 2.25U
  { id: 'ShiftLeft', label: '⇧', width: 1.25, row: 4, block: 'alpha' },
  { id: 'IntlBackslash', label: '<', width: 1, row: 4, block: 'alpha' },
  { id: 'KeyZ', label: 'W', width: 1, row: 4, block: 'alpha' },
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

  // --- SYSTEM BLOCK ---
  { id: 'PrintScreen', label: 'PrtSc', width: 1, row: 0, block: 'system' },
  { id: 'ScrollLock', label: 'ScLk', width: 1, row: 0, block: 'system' },
  { id: 'Pause', label: 'Pause', width: 1, row: 0, block: 'system' },

  { id: 'Insert', label: 'Ins', width: 1, row: 1, block: 'system' },
  { id: 'Home', label: 'Home', width: 1, row: 1, block: 'system' },
  { id: 'PageUp', label: 'PgUp', width: 1, row: 1, block: 'system' },

  { id: 'Delete', label: 'Del', width: 1, row: 2, block: 'system' },
  { id: 'End', label: 'End', width: 1, row: 2, block: 'system' },
  { id: 'PageDown', label: 'PgDn', width: 1, row: 2, block: 'system' },

  // Empty rows for alignment
  { id: 'empty_sys_3', label: '', width: 1, row: 3, block: 'system' },
  { id: 'empty_sys_3_2', label: '', width: 1, row: 3, block: 'system', offset: 1 },
  { id: 'empty_sys_3_3', label: '', width: 1, row: 3, block: 'system', offset: 1 },

  { id: 'ArrowUp', label: '↑', width: 1, row: 4, block: 'system', offset: 1 }, // Perfect T-Shape
  { id: 'ArrowLeft', label: '←', width: 1, row: 5, block: 'system' },
  { id: 'ArrowDown', label: '↓', width: 1, row: 5, block: 'system' },
  { id: 'ArrowRight', label: '→', width: 1, row: 5, block: 'system' },

  // --- NUMPAD BLOCK ---
  { id: 'empty_num_0', label: '', width: 1, row: 0, block: 'numpad' },
  { id: 'empty_num_0_2', label: '', width: 1, row: 0, block: 'numpad', offset: 1 },
  { id: 'empty_num_0_3', label: '', width: 1, row: 0, block: 'numpad', offset: 1 },
  { id: 'empty_num_0_4', label: '', width: 1, row: 0, block: 'numpad', offset: 1 },

  { id: 'NumLock', label: 'NL', width: 1, row: 1, block: 'numpad' },
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
  { id: 'NumpadEnter', label: 'Ent', width: 1, row: 4, block: 'numpad', isVertical: true },

  { id: 'Numpad0', label: '0', width: 2, row: 5, block: 'numpad' },
  { id: 'NumpadDecimal', label: '.', width: 1, row: 5, block: 'numpad' },
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
      <div className={`flex-1 flex items-center justify-center ${isLight ? 'bg-slate-50' : 'bg-[#0f1115]'}`}>
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
    const label = getDisplayLabel(key.id, key.label);

    const calculateWidth = (w: number) => {
      const baseSize = 54;
      if (w <= 1) return w * baseSize;
      return w * baseSize + (Math.floor(w - 0.01) * 6);
    };

    const keyWidth = calculateWidth(key.width);
    const commonStyles = {
      marginLeft: key.offset ? `${key.offset * 60}px` : '0px',
    };

    const truncateName = (name: string, limit: number = 8) => {
      if (!name) return "";
      return name.length > limit ? name.substring(0, limit - 2) + ".." : name;
    };

    const macroName = hasMacro ? truncateName(macrosMap[key.id].name, 6) : null;

    if (key.isISOEnter) {
      return (
        <div key={key.id} className="relative" style={{ ...commonStyles, width: `${keyWidth}px`, height: '54px', marginLeft: 'auto' }}>
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.95, y: 0 }}
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
              ${isSelected || hasMacro ? 'key-glow-active' : ''}
              ${!isSelected && !hasMacro ? (
                isActive
                  ? 'bg-blue-500/40 border-blue-400/50 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]'
                  : isLight 
                    ? 'bg-white border-gray-300 text-black hover:bg-gray-50'
                    : 'bg-[#1a1d23] border-white/5 text-white/80 hover:bg-white/10 hover:border-blue-500/50 hover:text-white'
              ) : ''}
            `}
          >
            {macroName && (
              <span className="text-[7px] text-primary absolute top-2 left-1/2 -translate-x-1/2 uppercase tracking-tighter opacity-80 whitespace-nowrap overflow-hidden">
                {macroName}
              </span>
            )}
            {label}
          </motion.button>
        </div>
      );
    }

    if (key.isVertical) {
      return (
        <motion.button
          key={key.id}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.95, y: 0 }}
          onMouseDown={(e) => handleKeyClick(e as any, key.id)}
          onDragOver={onDragOver}
          onDrop={(e) => onDrop?.(e, key.id)}
          style={{ 
            ...commonStyles,
            width: `${keyWidth}px`,
            height: '114px',
            marginBottom: '-60px',
            zIndex: 5
          }}
          className={`
            keyboard-key flex flex-col items-center justify-center rounded-xl text-[11px] font-black transition-all duration-200
            border shadow-sm relative
            ${isSelected || hasMacro ? 'key-glow-active' : ''}
            ${!isSelected && !hasMacro ? (
              isActive
                ? 'bg-blue-500/40 border-blue-400/50 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]'
                : isLight
                  ? 'bg-white border-gray-300 text-black hover:bg-gray-50'
                  : 'bg-[#1a1d23] border-white/5 text-white/80 hover:bg-white/10 hover:border-blue-500/50 hover:text-white'
            ) : ''}
          `}
        >
          {macroName && (
            <span className="text-[7px] text-primary absolute top-2 left-1/2 -translate-x-1/2 uppercase tracking-tighter opacity-80 whitespace-nowrap overflow-hidden truncate w-[90%] text-center">
              {macroName}
            </span>
          )}
          {label}
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
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.95, y: 0 }}
        onMouseDown={(e) => handleKeyClick(e as any, key.id)}
        onDragOver={onDragOver}
        onDrop={(e) => onDrop?.(e, key.id)}
        style={{ 
          ...commonStyles, 
          width: `${keyWidth}px`,
          ...(key.block === 'alpha' && isLastInRow(key) ? { marginLeft: 'auto' } : {})
        }}
        className={`
          keyboard-key h-[54px] flex flex-col items-center justify-center rounded-xl text-[11px] font-black transition-all duration-200
          border shadow-sm relative
          ${isSelected || hasMacro ? 'key-glow-active' : ''}
          ${!isSelected && !hasMacro ? (
            isActive
              ? 'bg-blue-500/40 border-blue-400/50 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]'
              : isLight
                ? 'bg-white border-gray-300 text-black hover:bg-gray-50'
                : 'bg-[#1a1d23] border-white/5 text-white/80 hover:bg-white/10 hover:border-blue-500/50 hover:text-white'
          ) : ''}
        `}
      >
        {macroName && (
          <span className="text-[7px] text-primary absolute top-1.5 left-1/2 -translate-x-1/2 uppercase tracking-tighter opacity-80 whitespace-nowrap overflow-hidden truncate w-[90%] text-center">
            {macroName}
          </span>
        )}
        <span className={macroName ? 'mt-2' : ''}>{label}</span>
      </motion.button>
    );
  };

  const renderBlock = (blockName: 'alpha' | 'system' | 'numpad') => {
    if (layoutSize === '60%' && blockName !== 'alpha') return null;
    if (layoutSize === '80%' && blockName === 'numpad') return null;

    return (
      <div className="flex flex-col gap-[6px] justify-start">
        {[0, 1, 2, 3, 4, 5].map((rowIdx) => {
          const keysInRow = KEYBOARD_DATA.filter(k => k.block === blockName && k.row === rowIdx);
          if (keysInRow.length === 0) return null;
          
          let blockWidth = '894px'; // alpha (54 * 15 + 14 * 6)
          if (blockName === 'system') blockWidth = '174px'; // system (54 * 3 + 2 * 6)
          if (blockName === 'numpad') blockWidth = '234px'; // numpad (54 * 4 + 3 * 6)

          return (
            <div 
              key={rowIdx} 
              className={`flex gap-[6px] relative h-[54px]`} 
              style={{ width: blockWidth }}
            >
              {keysInRow.map(key => renderKey(key))}
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
          ${isSelected || hasMacro ? 'key-glow-active' : ''}
          ${!isSelected && !hasMacro ? (
            isActive
              ? 'bg-blue-500/40 border-blue-400/50 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]'
              : isLight 
                ? 'bg-white border-slate-200 hover:bg-slate-50 text-slate-400 shadow-sm' 
                : 'bg-gradient-to-b from-[#1a1d23] to-[#111418] border-white/5 hover:border-white/10 text-white/30 shadow-lg'
          ) : ''}
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
    <div ref={containerRef} className={`flex-1 flex flex-col items-center justify-center p-8 transition-all duration-700 ${isLight ? 'bg-white' : 'bg-transparent'} keyboard-container overflow-hidden`}>
      <div className="keyboard-scale-wrapper">
        {/* Keyboard Case */}
        <div className={`
          flex items-start gap-[60px] p-8 rounded-[40px] border-t-2 border-x transition-all duration-500 relative
          ${isLight 
            ? 'bg-slate-100 border-white shadow-[0_20px_50px_rgba(0,0,0,0.1),inset_0_2px_4px_rgba(255,255,255,1)]' 
            : 'bg-[#12141a] border-white/10 shadow-[0_40px_80px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.05)]'}
        `}>
          {/* Mechanical Details (Screws) */}
          {[
            'top-6 left-6', 'top-6 right-6', 
            'bottom-6 left-6', 'bottom-6 right-6',
            'top-6 left-1/2 -translate-x-1/2',
            'bottom-6 left-1/2 -translate-x-1/2'
          ].map((pos, i) => (
            <div key={i} className={`absolute ${pos} w-3 h-3 rounded-full shadow-inner ${isLight ? 'bg-slate-300' : 'bg-black/40'}`}>
              <div className={`absolute inset-0.5 rounded-full ${isLight ? 'bg-slate-200' : 'bg-white/5'}`} />
            </div>
          ))}

          <div className="flex items-start gap-[60px] relative z-10">
            {renderBlock('alpha')}
            {renderBlock('system')}
            {renderBlock('numpad')}
          </div>

          {/* Status Indicators (Optional) */}
          {!isLight && (
            <div className="absolute top-10 right-20 flex gap-4 opacity-30">
              <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_5px_#3b82f6]" />
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_5px_#22c55e]" />
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_5px_#f59e0b]" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeviceMapper;
