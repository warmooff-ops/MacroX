import React, { useState, useEffect, useRef } from 'react';
import { motion, Reorder } from 'framer-motion';
import { Play, Square, Trash2, Clock, MousePointer, Keyboard, Save, X, FileSearch, List, Target, MousePointer2, Plus, ArrowLeftRight } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { save as saveDialog } from '@tauri-apps/plugin-dialog';
import { writeTextFile } from '@tauri-apps/plugin-fs';
import { useStore } from '../store/useStore';
import DeviceMapper from './DeviceMapper';

import { getKeyLabel, normalizeKeyId } from '../utils/keyboardLayouts';

export type Action = 
  | { type: 'key_down', value: string, delay_ms: number }
  | { type: 'key_up', value: string, delay_ms: number }
  | { type: 'mouse_click', button: string, delay_ms: number }
  | { type: 'mouse_down', button: string, delay_ms: number }
  | { type: 'mouse_up', button: string, delay_ms: number }
  | { type: 'mouse_move', x: number, y: number, delay_ms: number };

interface MacroEditorProps {
  selectedKey: string | null;
  onBack: () => void;
  initialMacro?: any;
  theme?: 'light' | 'dark';
}

const MacroEditor: React.FC<MacroEditorProps> = ({ selectedKey, onBack, initialMacro, theme = 'dark' }) => {
  // --- TOUS LES HOOKS AU DÉBUT ---
  const { saveMacro, deleteMacro, loadMacros, settings, setSelectedKey, setView, isSidebarOpen, macros } = useStore();
  const isLight = theme === 'light';
  const timeUnit = settings.time_unit || 'ms';
  
  const [name, setName] = useState(initialMacro?.name || '');
  const [executionMode, setExecutionMode] = useState<'once' | 'hold' | 'toggle' | 'repeat'>(initialMacro?.mode || 'once');
  const [repeatCount, setRepeatCount] = useState(initialMacro?.repeatCount || 1);
  const [actions, setActions] = useState<Action[]>(initialMacro?.actions || []);
  const [selectedActionIndex, setSelectedActionIndex] = useState<number | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [globalDelay, setGlobalDelay] = useState<string>('50');
  const [showGlobalDelayMenu, setShowGlobalDelayMenu] = useState(false);
  const [showKeyPicker, setShowKeyPicker] = useState(false);
  const [exportStatus, setExportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  
  const globalDelayRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Memoize macros map for O(1) lookup
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

  // Sync with selectedKey or initialMacro
  useEffect(() => {
    if (selectedKey) {
      const existingMacro = macrosMap[selectedKey];
      if (existingMacro) {
        setName(existingMacro.name);
        setExecutionMode(existingMacro.mode || 'once');
        setRepeatCount(existingMacro.repeatCount || 1);
        setActions(existingMacro.actions || []);
      } else {
        setName(`Macro ${selectedKey}`);
        setExecutionMode('once');
        setRepeatCount(1);
        setActions([]);
      }
    }
  }, [selectedKey, macrosMap]);

  // Capture position logic
  useEffect(() => {
    const setupPositionListener = async () => {
      const unlisten = await listen<[number, number]>('position-captured', (event) => {
        const [x, y] = event.payload;
        const newAction: Action = {
          type: 'mouse_move',
          x,
          y,
          delay_ms: parseInt(globalDelay) || 50
        };
        setActions(prev => [...prev, newAction]);
        setIsCapturing(false);
      });
      return unlisten;
    };

    const unlistenPromise = setupPositionListener();
    return () => {
      unlistenPromise.then(f => f());
    };
  }, [globalDelay]);

  // F key capture
  useEffect(() => {
    const handleCaptureKey = async (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'f' && isCapturing) {
        e.preventDefault();
        try {
          const pos = await invoke<[number, number]>('get_mouse_position');
          if (pos) {
            const [x, y] = pos;
            const newAction: Action = {
              type: 'mouse_move',
              x,
              y,
              delay_ms: parseInt(globalDelay) || 50
            };
            setActions(prev => [...prev, newAction]);
            setIsCapturing(false);
          }
        } catch (err) {
          console.error("Erreur capture F:", err);
        }
      }
    };

    window.addEventListener('keydown', handleCaptureKey);
    return () => window.removeEventListener('keydown', handleCaptureKey);
  }, [isCapturing, globalDelay]);

  // Global events
  useEffect(() => {
    const handleMacroCreated = (event: any) => {
      if (event.detail && event.detail.key) {
        setSelectedKey(event.detail.key);
        setShowKeyPicker(false);
      }
    };
    window.addEventListener('macro-key-selected', handleMacroCreated);
    return () => window.removeEventListener('macro-key-selected', handleMacroCreated);
  }, [setSelectedKey]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (globalDelayRef.current && !globalDelayRef.current.contains(event.target as Node)) {
        setShowGlobalDelayMenu(false);
      }
    };
    if (showGlobalDelayMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showGlobalDelayMenu]);

  useEffect(() => {
    if (isRecording && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [actions, isRecording]);

  // Recording Logic
  useEffect(() => {
    if (isRecording) {
      let lastTime = Date.now();

      const handleGlobalKeyDown = (event: KeyboardEvent) => {
        if (event.code !== 'F12' && event.code !== 'F11') event.preventDefault();
        const currentTime = Date.now();
        const delay = currentTime - lastTime;
        lastTime = currentTime;

        let keyValue = normalizeKeyId(event.code);

        if (event.code === 'Space') keyValue = 'SPACE';
        if (event.code === 'Enter') keyValue = 'ENTER';
        if (event.code === 'Backspace') keyValue = 'BACKSPACE';
        if (event.code === 'Tab') keyValue = 'TAB';
        if (event.code === 'Escape') keyValue = 'ESC';

        setActions(prev => [...prev, { type: 'key_down', value: keyValue, delay_ms: delay > 0 ? delay : 50 }]);
      };

      const handleGlobalKeyUp = (event: KeyboardEvent) => {
        if (event.code !== 'F12' && event.code !== 'F11') event.preventDefault();
        const currentTime = Date.now();
        const delay = currentTime - lastTime;
        lastTime = currentTime;

        let keyValue = normalizeKeyId(event.code);

        if (event.code === 'Space') keyValue = 'SPACE';
        if (event.code === 'Enter') keyValue = 'ENTER';
        if (event.code === 'Backspace') keyValue = 'BACKSPACE';
        if (event.code === 'Tab') keyValue = 'TAB';
        if (event.code === 'Escape') keyValue = 'ESC';

        setActions(prev => [...prev, { type: 'key_up', value: keyValue, delay_ms: delay > 0 ? delay : 50 }]);
      };

      const handleGlobalMouseDown = (event: MouseEvent) => {
        const currentTime = Date.now();
        const delay = currentTime - lastTime;
        lastTime = currentTime;
        const buttons = ['left', 'middle', 'right', 'back', 'forward'];
        setActions(prev => [...prev, { type: 'mouse_down', button: buttons[event.button] || 'left', delay_ms: 0 }]);
      };

      const handleGlobalMouseUp = (event: MouseEvent) => {
        const currentTime = Date.now();
        const delay = currentTime - lastTime;
        lastTime = currentTime;
        const buttons = ['left', 'middle', 'right', 'back', 'forward'];
        setActions(prev => [...prev, { type: 'mouse_up', button: buttons[event.button] || 'left', delay_ms: 0 }]);
      };

      window.addEventListener('keydown', handleGlobalKeyDown, true);
      window.addEventListener('keyup', handleGlobalKeyUp, true);
      window.addEventListener('mousedown', handleGlobalMouseDown, true);
      window.addEventListener('mouseup', handleGlobalMouseUp, true);

      return () => {
        window.removeEventListener('keydown', handleGlobalKeyDown, true);
        window.removeEventListener('keyup', handleGlobalKeyUp, true);
        window.removeEventListener('mousedown', handleGlobalMouseDown, true);
        window.removeEventListener('mouseup', handleGlobalMouseUp, true);
      };
    }
  }, [isRecording]);

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

  // --- EARLY RETURN APRES TOUS LES HOOKS ---
  if (!selectedKey && !showKeyPicker) {
    return (
      <div className={`flex-1 flex flex-col items-center justify-center p-10 text-center ${isLight ? 'bg-slate-50' : 'bg-[#0f1115]'}`}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md space-y-8"
        >
          <div className="relative">
            <div className={`absolute inset-0 blur-3xl opacity-20 bg-primary rounded-full animate-pulse`} />
            <div className={`relative w-24 h-24 mx-auto mb-8 rounded-3xl flex items-center justify-center border-2 border-dashed ${isLight ? 'bg-white border-slate-200 text-slate-300' : 'bg-white/5 border-white/10 text-white/20'}`}>
              <Plus size={40} strokeWidth={1} />
            </div>
          </div>
          
          <div className="space-y-4">
            <h2 className={`text-4xl font-black tracking-tight ${isLight ? 'text-slate-800' : 'text-white'}`}>
              Étape 1
            </h2>
            <p className={`text-xl font-bold leading-relaxed ${isLight ? 'text-slate-500' : 'text-white/40'}`}>
              Sélectionnez une touche sur le Dashboard pour commencer la configuration.
            </p>
          </div>

          <button
            onClick={() => setShowKeyPicker(true)}
            className="group relative px-8 py-4 rounded-2xl bg-primary text-white font-black uppercase tracking-widest shadow-lg shadow-primary/25 hover:scale-105 hover:shadow-primary/40 active:scale-95 transition-all"
          >
            Sélectionner une touche
          </button>

          <div className={`pt-12 grid grid-cols-3 gap-6 opacity-30 ${isLight ? 'text-slate-400' : 'text-white'}`}>
            <div className="space-y-2">
              <div className="w-10 h-10 mx-auto rounded-xl border-2 border-current flex items-center justify-center font-black">1</div>
              <p className="text-[10px] font-bold uppercase tracking-widest">Choisir</p>
            </div>
            <div className="space-y-2">
              <div className="w-10 h-10 mx-auto rounded-xl border-2 border-current flex items-center justify-center font-black">2</div>
              <p className="text-[10px] font-bold uppercase tracking-widest">Enregistrer</p>
            </div>
            <div className="space-y-2">
              <div className="w-10 h-10 mx-auto rounded-xl border-2 border-current flex items-center justify-center font-black">3</div>
              <p className="text-[10px] font-bold uppercase tracking-widest">Sauvegarder</p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // --- LOGIQUE AUXILIAIRE ---
  const convertFromMs = (valueInMs: number) => {
    switch (timeUnit) {
      case 's': return parseFloat((valueInMs / 1000).toFixed(3));
      case 'm': return parseFloat((valueInMs / 60000).toFixed(3));
      default: return valueInMs;
    }
  };

  const convertToMs = (value: number) => {
    switch (timeUnit) {
      case 's': return Math.round(value * 1000);
      case 'm': return Math.round(value * 60000);
      default: return value;
    }
  };

  const updateAllDelays = (newDelayValue: string) => {
    const val = parseInt(newDelayValue);
    if (!isNaN(val)) {
      setActions(prev => prev.map(action => ({ ...action, delay_ms: val })));
    }
  };

  const applyGlobalDelay = () => {
    updateAllDelays(globalDelay);
    setShowGlobalDelayMenu(false);
  };

  const handleSave = async () => {
    if (!name.trim() || actions.length === 0 || !selectedKey) {
      setError("Veuillez remplir tous les champs");
      return;
    }
    setIsSaving(true);
    try {
      const macro = {
        id: initialMacro?.id || crypto.randomUUID(),
        name: name.trim(),
        trigger: { device: selectedKey.startsWith('Mouse') ? 'mouse' : 'keyboard', key: selectedKey },
        mode: executionMode,
        repeatCount: executionMode === 'repeat' ? repeatCount : undefined,
        actions
      };
      const result = await saveMacro(macro as any);
      if (result.success) {
        // Le toast est déjà géré par useStore
      } else {
        setError("Erreur lors de la sauvegarde");
      }
    } catch (error) {
      setError("Erreur fatale lors de la sauvegarde");
    } finally {
      setIsSaving(false);
    }
  };

  if (showKeyPicker) {
    return (
      <div className={`fixed inset-0 z-[200] flex flex-col transition-colors duration-500 ${isLight ? 'bg-slate-50' : 'bg-[#0f1115]'}`}>
        <div className={`flex items-center justify-between p-6 border-b ${isLight ? 'bg-white border-slate-100' : 'bg-[#0f1115] border-white/5'}`}>
          <div className="flex items-center gap-4">
            <button onClick={() => setShowKeyPicker(false)} className={`p-3 rounded-xl border transition-all ${isLight ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}>
              <X size={20} />
            </button>
            <h2 className="text-xl font-black uppercase tracking-widest italic">Sélectionner une <span className="text-primary">touche</span></h2>
          </div>
        </div>
        <div className="flex-1 overflow-auto flex items-center justify-center p-12">
          <DeviceMapper selectedKey={selectedKey} onSelectKey={(key) => { setSelectedKey(key); setShowKeyPicker(false); }} />
        </div>
      </div>
    );
  }

  const getActionDetails = (action: Action) => {
    const layout = settings.keyboard_layout_type || 'AZERTY';
    
    const getButtonName = (button: string) => {
      switch (button) {
        case 'left': return 'Gauche';
        case 'right': return 'Droit';
        case 'middle': return 'Milieu';
        case 'back': return 'Précédent';
        case 'forward': return 'Suivant';
        default: return button.charAt(0).toUpperCase() + button.slice(1);
      }
    };

    const getKeyDisplay = (val: string) => {
      const special: Record<string, string> = {
        'SPACE': 'Espace',
        'ENTER': 'Entrée',
        'BACKSPACE': 'Retour',
        'TAB': 'Tab',
        'ESC': 'Echap'
      };
      if (special[val]) return special[val];
      return getKeyLabel(denormalizeKeyId(val), layout);
    };

    switch (action.type) {
      case 'key_down':
        return `Appui Touche ${getKeyDisplay(action.value)}`;
      case 'key_up':
        return `Relâcher Touche ${getKeyDisplay(action.value)}`;
      case 'mouse_move':
        return `Déplacer X: ${action.x}, Y: ${action.y}`;
      case 'mouse_click':
        return `Clic ${getButtonName(action.button)}`;
      case 'mouse_down':
        return `Presser ${getButtonName(action.button)}`;
      case 'mouse_up':
        return `Relâcher ${getButtonName(action.button)}`;
      default:
        return '';
    }
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`flex items-center justify-between p-6 border-b ${isLight ? 'bg-white border-slate-100' : 'bg-[#0f1115] border-white/5'}`}
      >
        <div className="flex items-center gap-8">
          <h2 className="text-xl font-black uppercase tracking-widest flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary"><Keyboard size={20} /></div>
            Éditeur de Macro
          </h2>
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-black opacity-30 uppercase">Cible :</span>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowKeyPicker(true)} 
              className="px-4 py-1.5 bg-primary/10 text-primary rounded-lg text-[10px] font-black uppercase tracking-widest border border-primary/20 hover:bg-primary/20 transition-all"
            >
              {selectedKey || "Choisir..."}
            </motion.button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsRecording(!isRecording)} 
            className={`px-6 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center gap-2 ${isRecording ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20'}`}
          >
            {isRecording ? <Square size={14} className="animate-pulse" /> : <Play size={14} />}
            {isRecording ? "Arrêter" : "Enregistrer"}
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSave} 
            disabled={isSaving} 
            className="px-6 py-2.5 bg-primary text-white rounded-xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-primary/20"
          >
            <Save size={14} />
            {isSaving ? "Enregistrement..." : "Sauvegarder"}
          </motion.button>
        </div>
      </motion.div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* TOP: Actions List (Reordered to top) */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className={`flex-1 flex flex-col min-h-0 ${isLight ? 'bg-white' : 'bg-[#0f1115]'}`}
        >
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg text-primary"><List size={16} /></div>
              <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Séquence d'actions ({actions.length})</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative" ref={globalDelayRef}>
                <motion.button 
                  whileHover={{ scale: 1.1, rotate: 15 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowGlobalDelayMenu(!showGlobalDelayMenu)} 
                  className="p-2 hover:bg-primary/10 rounded-lg text-primary transition-colors flex items-center gap-2"
                >
                  <Clock size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Délai Global</span>
                </motion.button>
                {showGlobalDelayMenu && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="absolute top-full right-0 mt-2 p-4 rounded-2xl border shadow-2xl z-50 w-64 bg-white border-slate-100 dark:bg-[#1e2235] dark:border-white/10"
                  >
                    <p className="text-[10px] font-black uppercase tracking-widest mb-3 opacity-50 text-center">Ajuster tous les délais</p>
                    <div className="flex items-center gap-3">
                      <input type="number" value={globalDelay} onChange={(e) => setGlobalDelay(e.target.value)} className="flex-1 px-3 py-2 rounded-xl border text-sm font-black outline-none bg-slate-50 border-slate-200 dark:bg-black/20 dark:border-white/10 dark:text-white" />
                      <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={applyGlobalDelay} 
                        className="p-2 bg-primary text-white rounded-xl hover:bg-primary/80 transition-colors"
                      >
                        <Save size={18} />
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative" ref={scrollRef}>
            {actions.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center">
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", damping: 20 }}
                  className="relative group"
                >
                  <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full animate-pulse group-hover:bg-primary/30 transition-all duration-700" />
                  
                  <button 
                    onClick={() => setIsRecording(true)}
                    className="relative w-[450px] h-[450px] rounded-[100px] border-8 border-dashed border-primary/20 bg-primary/5 flex flex-col items-center justify-center gap-10 transition-all duration-500 hover:border-primary/60 hover:bg-primary/10 hover:scale-[1.02] active:scale-95 shadow-[0_0_100px_rgba(139,92,246,0.15)] overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="relative">
                      <Plus size={120} className="text-primary group-hover:rotate-180 transition-transform duration-700 ease-in-out" strokeWidth={1.5} />
                      <motion.div 
                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="absolute inset-0 bg-primary/20 blur-2xl rounded-full -z-10"
                      />
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <span className="text-3xl font-black uppercase tracking-[0.4em] text-primary group-hover:tracking-[0.5em] transition-all duration-500">
                        Nouvelle Action
                      </span>
                      <span className="text-xs font-bold uppercase tracking-[0.8em] opacity-30 group-hover:opacity-60 transition-all">
                        Cliquez pour enregistrer
                      </span>
                    </div>

                    {/* Decorative elements */}
                    <div className="absolute top-10 left-10 w-4 h-4 border-t-2 border-l-2 border-primary/30 group-hover:border-primary/60 transition-all" />
                    <div className="absolute top-10 right-10 w-4 h-4 border-t-2 border-r-2 border-primary/30 group-hover:border-primary/60 transition-all" />
                    <div className="absolute bottom-10 left-10 w-4 h-4 border-b-2 border-l-2 border-primary/30 group-hover:border-primary/60 transition-all" />
                    <div className="absolute bottom-10 right-10 w-4 h-4 border-b-2 border-r-2 border-primary/30 group-hover:border-primary/60 transition-all" />
                  </button>

                  <div className="mt-16 flex items-center justify-center gap-12 opacity-20 group-hover:opacity-40 transition-all duration-500">
                    <div className="flex flex-col items-center gap-2">
                      <Keyboard size={24} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Clavier</span>
                    </div>
                    <div className="w-px h-8 bg-current" />
                    <div className="flex flex-col items-center gap-2">
                      <MousePointer2 size={24} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Souris</span>
                    </div>
                    <div className="w-px h-8 bg-current" />
                    <div className="flex flex-col items-center gap-2">
                      <Clock size={24} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Délais</span>
                    </div>
                  </div>
                </motion.div>
              </div>
            ) : (
              <Reorder.Group axis="y" values={actions} onReorder={setActions} className="space-y-3" style={{ listStyleType: 'none' }}>
                {actions.map((action, index) => {
                  return (
                    <Reorder.Item 
                      key={`${index}-${action.type}`} 
                      value={action}
                      onPointerDown={() => setSelectedActionIndex(index)}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 group transition-all ${isLight ? 'bg-slate-50 border-slate-200 hover:border-primary/30' : 'bg-white/5 border-white/5 hover:border-primary/30 hover:bg-white/10'}`}>
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-xs font-black text-primary group-hover:bg-primary group-hover:text-white transition-all">{index + 1}</div>
                          <div className="flex flex-col">
                            <span className="text-[8px] font-black uppercase opacity-40 mb-0.5 tracking-tighter">{action.type.replace('_', ' ')}</span>
                            <p className={`text-[10px] font-bold mt-1 uppercase tracking-widest ${isLight ? 'text-slate-400' : 'text-white/30'}`}>
                              {getActionDetails(action)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-2">
                            <Clock size={12} className="opacity-30" />
                            <input 
                              type="number" 
                              value={convertFromMs(action.delay_ms)} 
                              onChange={(e) => {
                                const newActions = [...actions];
                                newActions[index] = { ...action, delay_ms: convertToMs(parseFloat(e.target.value) || 0) };
                                setActions(newActions);
                              }}
                              className={`w-20 bg-transparent border-none text-right font-black text-sm outline-none focus:text-primary transition-colors ${isLight ? 'text-slate-600' : 'text-white'}`}
                            />
                            <span className="text-[10px] font-black opacity-30 uppercase">{timeUnit}</span>
                          </div>
                          
                          <motion.button 
                            whileHover={{ scale: 1.2, color: '#ef4444' }}
                            whileTap={{ scale: 0.8 }}
                            onClick={() => setActions(actions.filter((_, i) => i !== index))}
                            className="p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 size={16} />
                          </motion.button>
                        </div>
                      </div>
                    </Reorder.Item>
                  );
                })}
              </Reorder.Group>
            )}
          </div>
        </motion.div>

        {/* BOTTOM: Secondary Info Bar (Fixed at bottom) */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className={`p-8 border-t space-y-8 ${isLight ? 'bg-slate-50 border-slate-100' : 'bg-[#12141a] border-white/5'}`}
        >
          <div className="grid grid-cols-12 gap-8 items-end">
            {/* Macro Name */}
            <div className="col-span-4 flex flex-col gap-3">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Nom de la macro</label>
              <input 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                className={`w-full px-6 py-4 rounded-2xl border text-lg font-black outline-none transition-all ${isLight ? 'bg-white border-slate-200 focus:border-primary' : 'bg-white/5 border-white/5 focus:border-primary focus:bg-white/10'}`} 
                placeholder="Ex: Combo ZQSD..." 
              />
            </div>

            {/* Execution Mode */}
            <div className="col-span-4 flex flex-col gap-3">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Mode d'exécution</label>
              <div className="relative">
                <select 
                  value={executionMode} 
                  onChange={(e) => setExecutionMode(e.target.value as any)} 
                  className={`w-full px-6 py-4 rounded-2xl border font-black outline-none appearance-none transition-all cursor-pointer ${isLight ? 'bg-white border-slate-200 hover:border-primary/50 focus:border-primary' : 'bg-[#1f2937] border-white/5 text-white hover:border-primary/50 focus:border-primary'}`}
                  style={!isLight ? { backgroundColor: '#1f2937', color: 'white' } : {}}
                >
                  <option value="once" style={!isLight ? { backgroundColor: '#1f2937' } : {}}>Une fois</option>
                  <option value="hold" style={!isLight ? { backgroundColor: '#1f2937' } : {}}>Maintenir</option>
                  <option value="toggle" style={!isLight ? { backgroundColor: '#1f2937' } : {}}>Bascule (ON/OFF)</option>
                  <option value="repeat" style={!isLight ? { backgroundColor: '#1f2937' } : {}}>Répéter</option>
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-30">
                  <ArrowLeftRight size={16} className="rotate-90" />
                </div>
              </div>
            </div>

            {/* Stats Summary */}
            <div className="col-span-4 flex items-center justify-between gap-4 p-4 rounded-2xl bg-primary/5 border border-primary/10">
              <div className="text-center flex-1">
                <p className="text-[8px] font-black uppercase opacity-40 mb-1 tracking-tighter">Durée</p>
                <p className="text-lg font-black text-primary">
                  {actions.reduce((acc, curr) => acc + (curr.delay_ms || 0), 0)}
                  <span className="text-[10px] ml-1 opacity-50 uppercase">ms</span>
                </p>
              </div>
              <div className="w-px h-8 bg-primary/20" />
              <div className="text-center flex-1">
                <p className="text-[8px] font-black uppercase opacity-40 mb-1 tracking-tighter">Touche liée</p>
                <p className="text-lg font-black text-primary uppercase">{selectedKey || '---'}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default MacroEditor;
