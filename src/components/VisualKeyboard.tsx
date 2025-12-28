import React from 'react';
import { KeyInfo, KEYBOARD_LAYOUT } from './KeyboardData';
import { useStore } from '../store/useStore';
import { getKeyLabel } from '../utils/keyboardLayouts';

interface VisualKeyboardProps {
  selectedKey: string | null;
  activeTriggers: string[];
  isLight: boolean;
  onSelectKey: (id: string) => void;
  onBindMacro?: (macroId: string, keyId: string) => void;
}

const VisualKeyboard: React.FC<VisualKeyboardProps> = ({ 
  selectedKey, activeTriggers, isLight, onSelectKey, onBindMacro 
}) => {
  const settings = useStore(state => state.settings);
  const layout = settings.keyboard_layout_type;
  
  // Logic for keyboard scaling
  const getScale = () => {
    switch (settings.keyboard_size) {
      case '60%': return 0.8;
      case '80%': return 0.9;
      case '100%': return 1.0;
      default: return 1.0;
    }
  };

  const scale = getScale() * (settings.keyboard_scale || 1);

  // Filter layout based on size
  const getVisibleLayout = () => {
    if (settings.keyboard_size === '60%') {
      return KEYBOARD_LAYOUT.filter((_, index) => index !== 0); // Hide F-row
    }
    return KEYBOARD_LAYOUT;
  };

  const visibleLayout = getVisibleLayout();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, keyId: string) => {
    e.preventDefault();
    const macroId = e.dataTransfer.getData("macroId");
    if (macroId && onBindMacro) {
      onBindMacro(macroId, keyId);
    }
  };

  // Function to get the correct label based on layout
  const getKeyDisplay = (key: KeyInfo) => {
    return {
      ...key,
      label: getKeyLabel(key.id, layout)
    };
  };

  return (
    <div 
      className={`flex flex-col gap-2 p-6 rounded-[2rem] border-[3px] transition-all duration-500 origin-center ${
        isLight ? 'bg-white border-slate-100 shadow-xl shadow-slate-200/50' : 'bg-[#1a1d23]/50 border-[#2a2d35] shadow-2xl shadow-black/20'
      }`}
      style={{ transform: `scale(${scale})` }}
    >
      {visibleLayout.map((row, rowIndex) => (
        <div key={rowIndex} className="flex gap-2">
          {row.map((baseKey) => {
            const key = getKeyDisplay(baseKey);
            const isSelected = selectedKey === key.id;
            const isActive = activeTriggers.includes(key.id);
            
            return (
              <button
                key={baseKey.id} // Use baseKey.id as key for stable rendering
                onClick={() => onSelectKey(key.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, key.id)}
                style={{ width: `${key.width * 50}px` }}
                className={`
                  h-12 flex items-center justify-center rounded-lg text-[11px] font-bold transition-all duration-200
                  active:scale-95 border
                  ${isSelected 
          ? 'bg-primary border-primary text-white ring-2 ring-primary ring-offset-2 scale-[1.02] z-10' 
          : isActive
            ? 'bg-primary/40 border-primary/50 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]'
            : isLight 
              ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-primary hover:text-primary'
              : 'bg-[#1a1d23] border-white/5 text-white/80 hover:bg-white/10 hover:border-primary/50 hover:text-white'
        }
                `}
              >
                {key.label}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default VisualKeyboard;
