import React, { useState, useEffect, useRef } from 'react';
import { motion, Reorder, AnimatePresence } from 'framer-motion';
import { Play, Square, Trash2, Clock, MousePointer, Keyboard, Save, X, FileSearch, List, Target, MousePointer2, Plus, ArrowLeftRight, ArrowLeft, Check } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { save as saveDialog } from '@tauri-apps/plugin-dialog';
import { writeTextFile } from '@tauri-apps/plugin-fs';
import { useStore } from '../store/useStore';
import DeviceMapper from './DeviceMapper';
import Mouse from './Mouse';

import { getKeyLabel, normalizeKeyId, denormalizeKeyId } from '../utils/keyboardLayouts';

export type Action =
  | { type: 'key_down', value: string, delay_ms: number }
  | { type: 'key_up', value: string, delay_ms: number }
  | { type: 'mouse_click', button: string, delay_ms: number, duration_ms?: number }
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
  const [isRenaming, setIsRenaming] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [executionMode, setExecutionMode] = useState<'once' | 'hold' | 'toggle' | 'repeat'>(initialMacro?.mode || 'once');
  const [repeatCount, setRepeatCount] = useState(initialMacro?.repeatCount || 1);
  const [repeatDelay, setRepeatDelay] = useState(initialMacro?.repeatDelayMs || 50);
  const [isRepeatEnabled, setIsRepeatEnabled] = useState(initialMacro?.mode === 'repeat' || initialMacro?.mode === 'toggle');
  const [actions, setActions] = useState<Action[]>(initialMacro?.actions || []);
  const [selectedActionIndex, setSelectedActionIndex] = useState<number | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isFCapturing, setIsFCapturing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [globalDelay, setGlobalDelay] = useState<string>('50');
  const [msDuration, setMsDuration] = useState<string>('50');
  const [showGlobalDelayMenu, setShowGlobalDelayMenu] = useState(false);
  const [showModeDropdown, setShowModeDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [exportStatus, setExportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const globalDelayRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number>(Date.now());

  // Memoize macros map for O(1) lookup
  const macrosMap = React.useMemo(() => {
    const map: Record<string, any> = {};
    if (macros && Array.isArray(macros)) {
      macros.forEach((m: any) => {
        if (m.trigger && m.trigger.key) {
          const normalizedKey = normalizeKeyId(m.trigger.key);
          map[normalizedKey] = m;
        }
      });
    }
    return map;
  }, [macros]);

  // Sync with store data ONLY on mount or when initialMacro changes
  useEffect(() => {
     if (initialMacro) {
       console.log("📥 [MacroEditor] Initialisation avec la macro:", JSON.stringify(initialMacro, null, 2));
       setName(initialMacro.name || '');
      setExecutionMode(initialMacro.mode || 'once');
      setRepeatCount(initialMacro.repeatCount || 1);
      setRepeatDelay(initialMacro.repeatDelayMs || 50);
      setActions(initialMacro.actions || []);
    } else if (selectedKey) {
      console.log("🆕 Création d'une nouvelle macro pour la touche:", selectedKey);
      setName(`Macro ${selectedKey}`);
      setExecutionMode('once');
      setRepeatCount(1);
      setActions([]);
    }
  }, [initialMacro?.id]); // Ne réagir qu'au changement d'ID de la macro initiale

  // Handle key change (only when selectedKey actually changes to a DIFFERENT key AND we are not editing an existing macro)
  const lastSelectedKeyRef = useRef(selectedKey);
  useEffect(() => {
    if (selectedKey && selectedKey !== lastSelectedKeyRef.current) {
      const normalizedSelected = normalizeKeyId(selectedKey);
      lastSelectedKeyRef.current = normalizedSelected;
      
      // Si on n'est pas déjà en train d'éditer une macro existante, on peut charger celle de la touche
      if (!initialMacro) {
        const existingMacro = macrosMap[normalizedSelected];
        if (existingMacro) {
          console.log("⌨️ Touche changée : chargement de la macro sur cette touche", normalizedSelected);
          setName(existingMacro.name);
          setExecutionMode(existingMacro.mode || 'once');
          setRepeatCount(existingMacro.repeatCount || 1);
          setRepeatDelay(existingMacro.repeatDelayMs || 50);
          setActions(existingMacro.actions || []);
        } else {
          setName(`Macro ${normalizedSelected}`);
          setExecutionMode('once');
          setRepeatCount(1);
          setRepeatDelay(50);
          setActions([]);
        }
      }
    }
  }, [selectedKey, macrosMap, initialMacro]);

  // Capture position logic
  useEffect(() => {
    let unlistenFn: (() => void) | null = null;
    let isActive = true;

    const setupPositionListener = async () => {
      console.log("👂 En attente de position-captured...");
      const unlisten = await listen<[number, number]>('position-captured', (event) => {
        if (!isActive) return;
        
        const [x, y] = event.payload;
        console.log("📍 Position reçue dans le frontend:", x, y);
        
        const moveAction: Action = {
          type: 'mouse_move',
          x,
          y,
          delay_ms: parseInt(globalDelay) || 50
        };
        
        const clickAction: Action = {
          type: 'mouse_click',
          button: 'Left',
          delay_ms: 10,
          duration_ms: 50
        };

        setActions(prev => [...prev, moveAction, clickAction]);
        setIsFCapturing(false);
      });

      if (isActive) {
        unlistenFn = unlisten;
      } else {
        unlisten();
      }
    };

    if (isFCapturing) {
      console.log("🎯 Activation de la capture...");
      invoke('start_mouse_capture').catch(err => {
        console.error("Erreur lors de l'activation de la capture:", err);
        setIsFCapturing(false);
      });
      setupPositionListener();
    }

    return () => {
      isActive = false;
      if (unlistenFn) {
        console.log("🛑 Nettoyage de l'écouteur de capture");
        unlistenFn();
      }
      if (isFCapturing) {
        // On demande au backend d'arrêter la capture si on quitte ou désactive
        invoke('stop_mouse_capture').catch(() => {});
      }
    };
  }, [isFCapturing, globalDelay]);

  // Global events
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (globalDelayRef.current && !globalDelayRef.current.contains(event.target as Node)) {
        setShowGlobalDelayMenu(false);
      }
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowModeDropdown(false);
      }
    };
    if (showGlobalDelayMenu || showModeDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showGlobalDelayMenu, showModeDropdown]);

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
        // Empêcher d'enregistrer les touches si on interagit avec l'interface de l'éditeur
        const target = event.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

        if (event.code !== 'F12' && event.code !== 'F11') event.preventDefault();
        
        // Empêcher d'ajouter les touches d'activation du bouton Stop
        if (isRecording && (event.code === 'Enter' || event.code === 'Space')) {
          const activeEl = document.activeElement;
          if (activeEl && activeEl.hasAttribute('data-ignore-record')) {
            console.log("⌨️ Touche ignorée (focus sur bouton interface):", event.code);
            return;
          }
        }

        const currentTime = Date.now();
        const delay = currentTime - lastTime;
        lastTime = currentTime;

        let keyValue = event.key.toUpperCase();
        if (event.code === 'Enter') keyValue = 'ENTER';
        if (event.code === 'Backspace') keyValue = 'BACKSPACE';
        if (event.code === 'Tab') keyValue = 'TAB';
        if (event.code === 'Escape') keyValue = 'ESC';
        if (event.code === 'Space') keyValue = 'SPACE';

        if (event.code.startsWith('Control')) keyValue = 'CTRL';
        if (event.code.startsWith('Shift')) keyValue = 'SHIFT';
        if (event.code.startsWith('Alt')) keyValue = event.code === 'AltRight' ? 'ALTGR' : 'ALT';
        if (event.code.startsWith('Meta')) keyValue = 'WIN';

        console.log("✅ Action enregistrée: key_down", keyValue);
        setActions(prev => [...prev, { type: 'key_down', value: keyValue, delay_ms: delay > 0 ? delay : 50 }]);
      };

      const handleGlobalKeyUp = (event: KeyboardEvent) => {
        const target = event.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

        if (event.code !== 'F12' && event.code !== 'F11') event.preventDefault();

        if (isRecording && (event.code === 'Enter' || event.code === 'Space')) {
          const activeEl = document.activeElement;
          if (activeEl && activeEl.hasAttribute('data-ignore-record')) {
            return;
          }
        }

        const currentTime = Date.now();
        const delay = currentTime - lastTime;
        lastTime = currentTime;

        let keyValue = event.key.toUpperCase();
        if (event.code === 'Enter') keyValue = 'ENTER';
        if (event.code === 'Backspace') keyValue = 'BACKSPACE';
        if (event.code === 'Tab') keyValue = 'TAB';
        if (event.code === 'Escape') keyValue = 'ESC';
        if (event.code === 'Space') keyValue = 'SPACE';

        if (event.code.startsWith('Control')) keyValue = 'CTRL';
        if (event.code.startsWith('Shift')) keyValue = 'SHIFT';
        if (event.code.startsWith('Alt')) keyValue = event.code === 'AltRight' ? 'ALTGR' : 'ALT';
        if (event.code.startsWith('Meta')) keyValue = 'WIN';

        console.log("✅ Action enregistrée: key_up", keyValue);
        setActions(prev => [...prev, { type: 'key_up', value: keyValue, delay_ms: delay > 0 ? delay : 50 }]);
      };

      const handleGlobalMouseDown = (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        console.log("🖱 MouseDown détecté. Target:", target.tagName, "Ignore record:", !!target.closest('[data-ignore-record]'));
        if (target.closest('[data-ignore-record]')) return;

        const currentTime = Date.now();
        const delay = currentTime - lastTime;
        lastTime = currentTime;
        const buttons = ['left', 'middle', 'right', 'back', 'forward'];
        const buttonName = buttons[event.button] || 'left';
        const finalButton = event.button === 1 ? 'middle' : buttonName;

        console.log("✅ Action enregistrée: mouse_down", finalButton);
        setActions(prev => [...prev, { type: 'mouse_down', button: finalButton, delay_ms: delay > 0 ? delay : 50 }]);
      };

      const handleGlobalMouseUp = (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        if (target.closest('[data-ignore-record]')) return;

        const currentTime = Date.now();
        const delay = currentTime - lastTime;
        lastTime = currentTime;
        const buttons = ['left', 'middle', 'right', 'back', 'forward'];
        const buttonName = buttons[event.button] || 'left';
        const finalButton = event.button === 1 ? 'middle' : buttonName;

        console.log("✅ Action enregistrée: mouse_up", finalButton);
        setActions(prev => [...prev, { type: 'mouse_up', button: finalButton, delay_ms: delay > 0 ? delay : 50 }]);
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
      <div className={`flex-1 flex items-center justify-center ${isLight ? 'bg-slate-50' : 'bg-[#0f111a]'}`}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-black uppercase tracking-widest opacity-40">Chargement des données...</p>
        </div>
      </div>
    );
  }

  // --- EARLY RETURN APRES TOUS LES HOOKS ---
  // Supprimé : On ne veut plus de l'écran "Étape 1" de sélection de touche
  
  // --- LOGIQUE AUXILIAIRE ---
  const convertFromMs = (valueInMs: number) => {
    switch (timeUnit) {
      case 's': return parseFloat((valueInMs / 1000).toFixed(2));
      case 'm': return parseFloat((valueInMs / 60000).toFixed(2));
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

  const handleDelete = async () => {
    if (!initialMacro?.id) return;

    if (confirm(`Êtes-vous sûr de vouloir supprimer la macro "${initialMacro.name}" ?`)) {
      try {
        const result = await deleteMacro(initialMacro.id);
        if (result.success) {
          onBack();
          setView('dashboard');
        } else {
          setError(result.error || "Erreur lors de la suppression");
        }
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
        setError("Erreur lors de la suppression");
      }
    }
  };

  const toggleRenaming = () => {
    if (isRenaming) {
      setIsRenaming(false);
    } else {
      setIsRenaming(true);
      setTimeout(() => nameInputRef.current?.focus(), 50);
    }
  };

  const updateDelay = (index: number, newMs: string) => {
    const val = parseInt(newMs) || 0;
    setActions(prev => prev.map((a, i) => i === index ? { ...a, delay_ms: val } : a));
  };

  const updateAllDelays = (newDelayValue: string) => {
    const val = parseInt(newDelayValue);
    if (!isNaN(val)) {
      setActions(prev => prev.map(action => ({ ...action, delay_ms: val })));
    }
  };

  const toggleRecording = () => {
    console.log("🎬 toggleRecording appelé. État actuel isRecording:", isRecording);
    if (isRecording) {
      setIsRecording(false);
      console.log("🛑 Arrêt de l'enregistrement");

      // Nettoyage pour empêcher d'ajouter le clic sur le bouton "ARRÊTER" à la macro
      setActions(prev => {
        if (prev.length === 0) return prev;
        
        let newActions = [...prev];
        // On retire les dernières actions si ce sont des clics sur l'interface
        // (généralement mouse_down + mouse_up)
        let count = 0;
        while (newActions.length > 0 && count < 2) {
          const last = newActions[newActions.length - 1];
          if (last.type === 'mouse_up' || last.type === 'mouse_down') {
            newActions.pop();
            count++;
          } else {
            break;
          }
        }
        return newActions;
      });
    } else {
      console.log("⏺ Démarrage de l'enregistrement");
      setActions([]);
      setIsRecording(true);
    }
  };

  const handleSave = async () => {
    console.log("💾 Tentative de sauvegarde...");
    console.log("Informations actuelles :", {
      name,
      executionMode,
      repeatCount,
      actionsCount: actions.length,
      selectedKey
    });

    if (!name.trim() || actions.length === 0) {
      console.warn("⚠️ Sauvegarde annulée : nom vide ou aucune action.");
      setError("Veuillez remplir tous les champs");
      return;
    }
    setIsSaving(true);
    try {
      const macro = {
        id: initialMacro?.id || crypto.randomUUID(),
        name: name.trim(),
        trigger: { 
          device: selectedKey?.startsWith('Mouse') ? 'mouse' : 'keyboard', 
          key: selectedKey || 'UNASSIGNED' 
        },
        mode: executionMode,
        repeatCount: executionMode === 'repeat' ? repeatCount : undefined,
        repeatDelayMs: executionMode !== 'once' ? repeatDelay : undefined,
        actions
      };
      
      console.log("📤 Envoi de la macro au backend:", macro);
      const result = await saveMacro(macro as any);
      console.log("📥 Résultat de la sauvegarde:", result);

      if (result.success) {
        console.log("✅ Sauvegarde réussie, retour au dashboard");
        onBack();
        setView('dashboard');
      } else {
        console.error("❌ Erreur retournée par saveMacro:", result.error);
        setError("Erreur lors de la sauvegarde");
      }
    } catch (error) {
      console.error("💥 Erreur fatale lors de la sauvegarde:", error);
      setError("Erreur fatale lors de la sauvegarde");
    } finally {
      setIsSaving(false);
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'key_down': return <Keyboard size={14} className="text-blue-400" />;
      case 'key_up': return <Keyboard size={14} className="text-slate-400" />;
      case 'mouse_down': return <MousePointer2 size={14} className="text-purple-400" />;
      case 'mouse_up': return <MousePointer2 size={14} className="text-slate-400" />;
      case 'mouse_click': return <MousePointer size={14} className="text-primary" />;
      case 'mouse_move': return <Target size={14} className="text-green-400" />;
      case 'middle_click': return <ArrowLeftRight size={14} className="text-orange-400" />;
      default: return <Plus size={14} />;
    }
  };

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
        'ENTER': 'Entrée',
        'BACKSPACE': 'Retour',
        'TAB': 'Tab',
        'ESC': 'Echap',
        'SPACE': 'Espace'
      };
      if (special[val]) return special[val];
      return getKeyLabel(denormalizeKeyId(val), layout);
    };

    const actionTypeDisplay = (type: string) => {
      switch (type) {
        case 'key_down': return 'Presser';
        case 'key_up': return 'Relâcher';
        case 'mouse_down': return 'Presser';
        case 'mouse_up': return 'Relâcher';
        default: return '';
      }
    };

    switch (action.type) {
      case 'key_down':
      case 'key_up':
        return (
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] opacity-40 font-black uppercase tracking-widest">{actionTypeDisplay(action.type)}</span>
            <span className="text-sm font-black text-white">{getKeyDisplay(action.value || '')}</span>
          </div>
        );
      case 'mouse_down':
      case 'mouse_up':
        return (
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] opacity-40 font-black uppercase tracking-widest">{actionTypeDisplay(action.type)}</span>
            <span className="text-sm font-black text-white">{getButtonName(action.button || '')}</span>
          </div>
        );
      case 'mouse_move':
        return (
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] opacity-40 font-black uppercase tracking-widest">Déplacer</span>
            <span className="text-sm font-black text-white">X: {action.x}, Y: {action.y}</span>
          </div>
        );
      default:
        return null;
    }
  };

  const renderContent = () => {
    return (
      <div className={`flex flex-col h-full overflow-hidden ${isLight ? 'bg-[#F8F9FA]' : 'bg-[#0f111a]'} text-white relative`}>
        {/* Header simple avec back et titre */}
        <div data-tauri-drag-region className={`h-24 flex-none flex items-center justify-between px-12 border-b ${isLight ? 'bg-white border-[#E9ECEF] shadow-sm' : 'bg-[#0f111a]/20 border-white/5'}`}>
          <div className="flex items-center gap-8 no-drag">
            <button onClick={onBack} className={`p-4 rounded-2xl transition-all ${isLight ? 'bg-slate-50 text-slate-400 hover:bg-slate-100 border border-slate-100' : 'bg-white/5 text-slate-500 hover:bg-white/10'}`}>
              <ArrowLeft size={22} />
            </button>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-3">
                {isRenaming ? (
                  <input
                    ref={nameInputRef}
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={() => setIsRenaming(false)}
                    onKeyDown={(e) => e.key === 'Enter' && setIsRenaming(false)}
                    className={`bg-white/5 border border-primary/30 rounded-lg px-2 text-2xl font-black uppercase tracking-tight outline-none focus:ring-1 focus:ring-primary/50 ${isLight ? 'text-slate-900' : 'text-white'}`}
                  />
                ) : (
                  <h2
                    onClick={toggleRenaming}
                    className={`text-2xl font-black uppercase tracking-tight cursor-pointer hover:text-primary transition-colors ${isLight ? 'text-slate-900' : 'text-white'}`}
                  >
                    {name || "Nouvelle Macro"}
                  </h2>
                )}
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={toggleRenaming}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all"
                    title="Renommer"
                  >
                    <FileSearch size={16} />
                  </button>
                </div>
              </div>
              <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${isLight ? 'text-slate-400' : 'opacity-40'}`}>
                Séquence d'actions pour <span className="text-primary">{selectedKey || "Non assigné"}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 no-drag">
            <button
              onClick={() => setIsFCapturing(!isFCapturing)}
              data-ignore-record="true"
              className={`flex items-center gap-3 px-6 py-4 rounded-2xl border transition-all font-black uppercase tracking-widest text-[10px] ${isFCapturing
                ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20 animate-pulse'
                : isLight ? 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100' : 'bg-white/5 border-white/10 text-slate-500 hover:bg-white/10'
                }`}
              title="Activer la capture de position (Appuyez sur 'F' ou Cliquez)"
            >
              <Target size={16} className={isFCapturing ? 'animate-spin-slow' : ''} />
              {isFCapturing ? "Capture active (Clic ou 'F')" : "Capture Position"}
            </button>

            <div className="flex items-center gap-4 px-6 py-3 rounded-2xl border border-white/5 bg-white/5" data-ignore-record="true">
              <div className="flex flex-col gap-0.5">
                <span className="text-[8px] font-black uppercase tracking-widest opacity-40">Délai d'activation</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={globalDelay}
                    onChange={(e) => setGlobalDelay(e.target.value)}
                    className="w-12 bg-transparent border-none text-xs font-black text-primary outline-none text-center"
                  />
                  <span className="text-[10px] font-black uppercase opacity-30">ms</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={isSaving || isRecording}
              data-ignore-record="true"
              className="flex items-center gap-3 px-10 py-4 rounded-2xl bg-primary text-white font-black uppercase tracking-[0.2em] text-xs transition-all shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save size={16} />
              )}
              Enregistrer la Macro
            </button>
          </div>
        </div>

        <div className="flex-1 flex gap-8 p-8 overflow-hidden">
          {/* Liste des actions - Verticale */}
          <div
            ref={scrollRef}
            className={`flex-1 flex flex-col gap-3 p-8 rounded-[32px] border overflow-y-auto custom-scrollbar ${isLight ? 'bg-white border-slate-100 shadow-sm' : 'bg-[#0a0c14] border-white/5 shadow-inner'
              }`}
          >
            {actions.length === 0 ? (
              <div className={`flex-1 flex flex-col items-center justify-center gap-6 ${isLight ? 'text-slate-200' : 'opacity-10'}`}>
                <div className="w-20 h-20 rounded-full border-2 border-dashed border-current flex items-center justify-center">
                  <Play size={40} strokeWidth={1} />
                </div>
                <p className="text-sm font-black uppercase tracking-[0.3em]">Séquence vide - Enregistrez pour commencer</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {actions.map((action, index) => (
                  <React.Fragment key={`${index}-${action.type}`}>
                    <motion.div
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`group relative flex items-center gap-4 px-6 py-4 rounded-2xl border transition-all ${isLight ? 'bg-slate-50 border-slate-100 shadow-sm' : 'bg-white/5 border-white/10'
                        }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isLight ? 'bg-white text-slate-400 shadow-sm border border-slate-100' : 'bg-white/5 text-slate-500'}`}>
                        {getActionIcon(action.type)}
                      </div>
                      <div className="flex-1 flex items-center justify-between">
                        <div className={`text-xs font-black uppercase tracking-widest ${isLight ? 'text-slate-600' : 'text-white/80'}`}>
                          {getActionDetails(action)}
                        </div>

                        <div className="flex items-center gap-6">
                          <button
                            onClick={() => setActions(prev => prev.filter((_, i) => i !== index))}
                            className="p-2 rounded-lg text-red-500/40 hover:text-red-500 hover:bg-red-500/10 transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </motion.div>

                    {index < actions.length - 1 && (
                      <div className="flex justify-center py-2">
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${isLight ? 'bg-white border-slate-100 shadow-sm' : 'bg-[#1a1d23] border-white/5 shadow-lg'
                            }`}
                        >
                          <Clock size={12} className="text-primary opacity-50" />
                          <input
                            type="number"
                            value={convertFromMs(action.delay_ms)}
                            onChange={(e) => updateDelay(index, convertToMs(parseFloat(e.target.value) || 0).toString())}
                            className="w-14 bg-transparent border-none text-[11px] font-black text-primary outline-none text-center p-0"
                          />
                          <span className="text-[9px] font-black uppercase opacity-30">{timeUnit}</span>
                        </motion.div>
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>

          {/* Panneau de contrôle latéral */}
          <div className="w-80 flex flex-col gap-6">
            {selectedKey?.startsWith('Mouse') && (
              <div className={`flex items-center justify-center overflow-visible`}>
                <div className="scale-[0.5] origin-center -my-24">
                  <Mouse
                    selectedKey={selectedKey}
                    onAction={(id) => setSelectedKey(id)}
                    onDrop={() => { }}
                    onDragOver={(e) => e.preventDefault()}
                    theme={isLight ? 'light' : 'dark'}
                  />
                </div>
              </div>
            )}

            <div className={`p-8 rounded-[32px] border flex flex-col gap-8 ${isLight ? 'bg-white border-slate-100 shadow-sm' : 'bg-[#0f111a] border-white/5'}`}>
              <div className="flex flex-col gap-2">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 text-center">Mode d'exécution</h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'once', label: 'Une fois' },
                    { id: 'hold', label: 'Maintenir' },
                    { id: 'toggle', label: 'Bascule' },
                    { id: 'repeat', label: 'Répéter' },
                  ].map(mode => (
                    <button
                      key={mode.id}
                      onClick={() => {
                        console.log("🖱 Mode sélectionné:", mode.id);
                        setExecutionMode(mode.id as any);
                      }}
                      className={`relative px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all flex flex-col items-center justify-center gap-1 ${executionMode === mode.id
                        ? 'bg-primary border-primary text-white shadow-lg'
                        : isLight ? 'bg-slate-50 border-slate-100 text-slate-400' : 'bg-white/5 border-white/10 text-slate-500'
                        }`}
                    >
                      <span>{mode.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <AnimatePresence>
                {executionMode !== 'once' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex flex-col gap-3 p-4 rounded-2xl bg-white/5 border border-white/5">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Délai entre répétitions</span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={repeatDelay}
                            onChange={(e) => setRepeatDelay(parseInt(e.target.value) || 0)}
                            className="w-12 bg-transparent border-none text-primary font-black text-xs text-right outline-none"
                          />
                          <span className="text-[10px] font-black uppercase opacity-30">ms</span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="5000"
                        step="10"
                        value={repeatDelay}
                        onChange={(e) => setRepeatDelay(parseInt(e.target.value))}
                        className="w-full accent-primary h-1.5 rounded-full appearance-none bg-white/10"
                      />
                    </div>
                  </motion.div>
                )}

                {executionMode === 'repeat' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mt-2"
                  >
                    <div className="flex flex-col gap-3 p-4 rounded-2xl bg-white/5 border border-white/5">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Nombre de répétitions</span>
                        <span className="text-primary font-black text-xs">{repeatCount}</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="99"
                        value={repeatCount}
                        onChange={(e) => setRepeatCount(parseInt(e.target.value))}
                        className="w-full accent-primary h-1.5 rounded-full appearance-none bg-white/10"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="w-full h-px bg-white/5" />

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={toggleRecording}
                data-ignore-record="true"
                className={`w-full flex items-center justify-center gap-4 py-6 rounded-2xl font-black uppercase tracking-[0.2em] text-sm transition-all shadow-2xl ${isRecording
                  ? 'bg-red-500 text-white shadow-red-500/40 animate-pulse'
                  : 'bg-[#2A2D33] text-white shadow-black/20'
                  }`}
              >
                {isRecording ? (
                  <>
                    <Square size="20" fill="currentColor" />
                    ARRÊTER LA CAPTURE
                  </>
                ) : (
                  <>
                    <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
                    LANCER LA CAPTURE
                  </>
                )}
              </motion.button>

              {isRecording && (
                <p className="text-[9px] font-bold uppercase tracking-widest text-center opacity-30 leading-relaxed px-4">
                  Toutes vos actions clavier et souris sont actuellement enregistrées.
                </p>
              )}

              <button
                onClick={handleDelete}
                data-ignore-record="true"
                className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border
                  ${isLight
                    ? 'bg-red-50 border-red-100 text-red-500 hover:bg-red-500 hover:text-white'
                    : 'bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white shadow-[0_0_20px_rgba(239,68,68,0.2)]'
                  }`}
              >
                Supprimer la macro
              </button>
            </div>

          </div>
        </div>
      </div>
    );
  };

  return renderContent();
};

export default MacroEditor;
