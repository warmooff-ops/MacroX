import { useEffect, useState, useMemo } from "react";
import { DeviceMapper, MacroEditor, Settings, Dashboard, ErrorBoundary } from "./components";
import ToastContainer from "./components/ToastContainer";
import { LayoutGrid, List, X, Minus, ChevronDown, Zap, ChevronRight, ChevronLeft, Plus } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { listen } from "@tauri-apps/api/event";
import { useStore } from "./store/useStore";
import { Reorder, motion, AnimatePresence } from "framer-motion";
import { Settings as SettingsIcon } from "lucide-react";

function App() {
  const handleDragStart = (e: React.DragEvent, macroId: string) => {
    if (e.dataTransfer) {
      e.dataTransfer.setData("macroId", macroId);
      e.dataTransfer.effectAllowed = "copy";
    }
  };

  const { 
    view, setView, 
    selectedKey, setSelectedKey, 
    macros, setMacros, deleteMacro,
    profiles, loadProfiles, createProfile, deleteProfile,
    settings, loadMacros, loadConfig,
    activeProfile, setProfile,
    isSidebarOpen, setIsSidebarOpen,
    bindMacroToKey,
    saveMacro,
    updateSettings,
    toggleSidebar
  } = useStore();

  const [showMacrosMenu, setShowMacrosMenu] = useState(false);
  const [editingMacroId, setEditingMacroId] = useState<string | null>(null);
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [settingsSubView, setSettingsSubView] = useState('Général');
  const [newProfileName, setNewProfileName] = useState("");
  const [forceEditor, setForceEditor] = useState(false);
  const isLight = settings?.theme === 'light';

  useEffect(() => {
    const init = async () => {
      try {
        const defaultPath = "C:\\Users\\Admin\\Documents\\MacroX";
        await invoke('init_custom_folder', { path: defaultPath });
        const config = await invoke('get_config') as { macros: any[], settings: any };
        if (config.macros) setMacros(config.macros);
        if (config.settings) loadConfig();
      } catch (err) {
        console.error("Failed to init app:", err);
      }
    };
    init();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings?.theme || 'dark');
  }, [settings?.theme]);

  useEffect(() => {
    loadMacros();
  }, [loadMacros]);

  const macrosMap = useMemo(() => {
    const map: Record<string, any> = {};
    if (macros && Array.isArray(macros)) {
      macros.forEach(m => {
        if (m.trigger && m.trigger.key) {
          map[m.trigger.key] = m;
        }
      });
    }
    return map;
  }, [macros]);

  const setViewWithClose = (newView: typeof view) => {
    setSelectedKey(null);
    setEditingMacroId(null);
    setView(newView);
  };

  const handleSelectKey = (key: string | null) => {
    setSelectedKey(key);
    setForceEditor(false);
    if (key) {
      setView('list');
    } else {
      setEditingMacroId(null);
    }
  };

  const handleCreateProfile = async () => {
    if (newProfileName.trim()) {
      const name = newProfileName.trim();
      await createProfile(name);
      try {
        await invoke('create_profile_file', { name });
      } catch (err) {
        console.error("Failed to create profile file:", err);
      }
      setIsCreatingProfile(false);
      setNewProfileName("");
    }
  };

  useEffect(() => {
    if (view === 'settings' || view === 'list') {
      if (view === 'settings') {
        setSelectedKey(null);
        setEditingMacroId(null);
      }
    }
  }, [view, setSelectedKey]);

  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'n' && !selectedKey && view === 'dashboard' && !isCreatingProfile) {
        const key = prompt("Entrez la touche pour la nouvelle macro (ex: KeyA, Digit1) :");
        if (key) {
          setSelectedKey(key);
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [view, selectedKey, isCreatingProfile, setSelectedKey]);

  useEffect(() => {
    loadConfig();
    loadProfiles();
    invoke("init_folders").catch(console.error);
    const unlistenWindow = listen('tauri://window-created', () => {
      console.log('Window created');
    });
    const setupListener = async () => {
      const unlisten = await listen("state-reloaded", () => {
        loadConfig();
        loadMacros();
      });
      return unlisten;
    };
    const unlistenPromise = setupListener();
    return () => {
      unlistenWindow.then(f => f());
      unlistenPromise.then(f => f());
    };
  }, []);

  const minimizeWindow = async () => {
    try {
      await getCurrentWebviewWindow().minimize();
    } catch (err) {
      invoke('minimize_app');
    }
  };

  const closeWindow = async () => {
    try {
      await getCurrentWebviewWindow().close();
    } catch (err) {
      invoke('close_app');
    }
  };

  const renderContent = () => {
    if (view === 'list') {
      const initialMacro = editingMacroId ? macros.find(m => m.id === editingMacroId) : null;
      if (editingMacroId || selectedKey || forceEditor) {
        return (
          <MacroEditor 
            selectedKey={selectedKey || (initialMacro?.trigger?.key) || ""} 
            initialMacro={initialMacro}
            onBack={() => {
              setSelectedKey(null);
              setEditingMacroId(null);
              setForceEditor(false);
            }}
            theme={settings?.theme || 'dark'}
          />
        );
      }
      return (
        <div className="flex-1 relative flex flex-col h-full overflow-hidden">
          <Dashboard 
            activeProfile={activeProfile}
            selectedKey={selectedKey}
            onSelectKey={handleSelectKey}
            onDrop={async (e, keyId) => {
              const macroId = e.dataTransfer.getData("macroId");
              if (macroId) await bindMacroToKey(macroId, keyId);
            }}
            theme={settings?.theme || 'dark'}
          />
        </div>
      );
    }

    if (view === 'dashboard' || view === 'settings') {
      if (view === 'settings') {
        return (
          <div className="flex-1 overflow-auto">
            <Settings subView={settingsSubView} />
          </div>
        );
      }
      return (
        <div className="flex-1 relative flex flex-col h-full overflow-hidden">
          <Dashboard 
            activeProfile={activeProfile}
            selectedKey={selectedKey}
            onSelectKey={handleSelectKey}
            onDrop={async (e, keyId) => {
              const macroId = e.dataTransfer.getData("macroId");
              if (macroId) await bindMacroToKey(macroId, keyId);
            }}
            theme={settings?.theme || 'dark'}
          />
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`flex w-screen h-screen overflow-hidden font-sans selection:bg-primary/30 transition-colors duration-500 ${isLight ? 'bg-[#F8F9FA] text-[#212529]' : 'bg-[#0f111a] text-slate-100'}`}>
      {/* COLUMN 1: Main Menu */}
      <div data-tauri-drag-region className={`w-20 flex-none flex flex-col items-center py-8 border-r z-[60] ${isLight ? 'bg-[#FFFFFF] border-[#E9ECEF] shadow-[4px_0_24px_rgba(0,0,0,0.02)]' : 'bg-[#0f111a] border-white/5'}`}>
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#8b5cf6] to-[#ec4899] flex items-center justify-center mb-12 shadow-xl shadow-purple-500/30 no-drag ${isLight ? '' : 'shadow-black/20'}">
          <Zap size={28} className="text-white" fill="currentColor" />
        </div>
        
        <div className="flex flex-col gap-6 no-drag">
          {[
            { id: 'dashboard', icon: <LayoutGrid size={22} />, label: 'Tableau de bord' },
            { id: 'list', icon: <List size={22} />, label: 'Macros' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === 'list') {
                  setForceEditor(true);
                  setEditingMacroId(null);
                  setSelectedKey(null);
                  setView('list');
                } else {
                  setViewWithClose(item.id as any);
                }
              }}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 group relative ${
                view === item.id 
                  ? 'bg-primary text-white shadow-lg shadow-primary/30' 
                  : isLight ? 'text-slate-400 hover:bg-[#F8F9FA] hover:text-[#212529]' : 'text-slate-500 hover:bg-white/5 hover:text-white'
              }`}
              title={item.label}
            >
              {item.icon}
              {view === item.id && (
                <motion.div layoutId="activeTab" className="absolute -left-4 w-1 h-6 bg-primary rounded-full" />
              )}
            </button>
          ))}
        </div>

        <div className="mt-auto flex flex-col gap-6 no-drag">
          <button
            onClick={() => setViewWithClose('settings')}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 group relative ${
              view === 'settings' 
                ? 'bg-primary text-white shadow-lg shadow-primary/30' 
                : isLight ? 'text-slate-400 hover:bg-[#F8F9FA] hover:text-[#212529]' : 'text-slate-500 hover:bg-white/5 hover:text-white'
            }`}
            title="Réglages"
          >
            <SettingsIcon size={22} />
          </button>
        </div>
      </div>

      {/* MAIN VIEWPORT */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Sticky Controls */}
        <div className="fixed top-0 right-0 z-[100] flex items-center no-drag">
          <button onClick={minimizeWindow} className={`w-12 h-10 flex items-center justify-center transition-all ${isLight ? 'text-slate-400 hover:bg-slate-100' : 'text-white/30 hover:bg-white/5'}`}>
            <Minus size={18} />
          </button>
          <button onClick={closeWindow} className={`w-12 h-10 flex items-center justify-center transition-all ${isLight ? 'text-slate-400 hover:bg-red-500 hover:text-white' : 'text-white/30 hover:bg-red-600 hover:text-white'}`}>
            <X size={18} />
          </button>
        </div>

        <header data-tauri-drag-region className={`h-24 flex-none flex items-center px-12 relative border-b ${isLight ? 'bg-[#FFFFFF] border-[#E9ECEF]' : 'bg-[#0f111a] border-white/5'}`}>
          <div className="flex items-center gap-8 z-10 no-drag">
            <div className={`flex items-center p-1 rounded-2xl border transition-all duration-300 ${isLight ? 'bg-[#F8F9FA] border-[#E9ECEF]' : 'bg-white/5 border-white/10'}`}>
              <div className="relative">
                <select
                  value={activeProfile}
                  onChange={(e) => setProfile(e.target.value)}
                  className={`appearance-none rounded-xl px-6 py-2 text-[10px] font-black uppercase tracking-widest focus:outline-none transition-all cursor-pointer ${isLight ? 'bg-white text-[#212529]' : 'bg-white/10 text-white/80'}`}
                >
                  <option value="" disabled>Choisir une macro</option>
                  {profiles.map(p => <option key={p.name} value={p.name}>{p.name === 'Default' ? 'Choisir une macro' : p.name}</option>)}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                  <ChevronDown size={14} />
                </div>
              </div>
              <button onClick={() => setIsCreatingProfile(true)} className="ml-1 w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-[#8b5cf6] to-[#ec4899] text-white shadow-lg shadow-purple-500/40 hover:scale-105 active:scale-95 transition-all shadow-[0_0_25px_rgba(139,92,246,0.6)]">
                <Plus size={20} strokeWidth={3} />
              </button>
            </div>
          </div>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <h1 className={`text-6xl font-black tracking-tighter flex items-center gap-0.5 ${isLight ? 'text-[#212529]' : 'text-white'}`}>
              MACRO<span className="text-transparent bg-clip-text bg-gradient-to-br from-[#8b5cf6] to-[#ec4899] drop-shadow-[0_0_35px_rgba(139,92,246,0.7)]">X</span>
            </h1>
          </div>
        </header>

        <div className="flex-1 overflow-auto relative">
          <ErrorBoundary>{renderContent()}</ErrorBoundary>
          <AnimatePresence>
            {isCreatingProfile && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={`absolute inset-0 z-[100] flex flex-col items-center justify-center backdrop-blur-xl ${isLight ? 'bg-white/90' : 'bg-[#0f111a]/90'}`}>
                <motion.div initial={{ scale: 0.9, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, y: 20, opacity: 0 }} className="max-w-md w-full p-10 space-y-8">
                  <div className="text-center space-y-2">
                    <h2 className={`text-3xl font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>Nouveau Profil</h2>
                  </div>
                  <div className="space-y-4">
                    <input autoFocus type="text" value={newProfileName} onChange={(e) => setNewProfileName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCreateProfile()} placeholder="Nom du profil..." className={`w-full px-6 py-4 rounded-2xl border-2 text-sm font-black uppercase tracking-widest outline-none ${isLight ? 'bg-white border-slate-100 focus:border-primary' : 'bg-white/5 border-white/10 focus:border-primary'}`} />
                    <div className="flex gap-4">
                      <button onClick={() => setIsCreatingProfile(false)} className={`flex-1 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest ${isLight ? 'bg-slate-100 text-slate-400' : 'bg-white/5 text-slate-500'}`}>Annuler</button>
                      <button onClick={handleCreateProfile} className="flex-1 px-6 py-4 rounded-2xl bg-primary text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20">Créer</button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {!isSidebarOpen ? (
          <motion.button
            key="open-sidebar-btn"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onClick={() => setIsSidebarOpen(true)}
            className={`fixed right-0 top-1/2 -translate-y-1/2 w-6 h-16 rounded-l-2xl flex items-center justify-center transition-all duration-300 z-40 group ${
              isLight ? 'bg-white border-y border-l border-slate-200 text-slate-400' : 'bg-[#0a0c14] border-y border-l border-purple-500/20 text-purple-400 shadow-[-10px_0_30px_rgba(0,0,0,0.5)]'
            }`}
          >
            <ChevronLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
          </motion.button>
        ) : (
          <motion.div 
            key="sidebar-content"
            initial={{ x: 320, opacity: 0 }} 
            animate={{ x: 0, opacity: 1 }} 
            exit={{ x: 320, opacity: 0 }} 
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`flex-none w-[320px] h-full relative overflow-visible flex flex-col z-50 ${isLight ? 'bg-[#FFFFFF] border-l border-[#E9ECEF]' : 'bg-[#0a0c14] border-l border-purple-500/20 shadow-[0_0_40px_rgba(0,0,0,0.5)]'}`}
          >
            <button
              onClick={() => setIsSidebarOpen(false)}
              className={`absolute -left-6 top-1/2 -translate-y-1/2 w-6 h-16 rounded-l-2xl flex items-center justify-center transition-all duration-300 z-[60] group ${
                isLight ? 'bg-white border-y border-l border-[#E9ECEF] text-slate-400' : 'bg-[#0a0c14] border-y border-l border-purple-500/20 text-purple-400 hover:text-purple-300 shadow-[-10px_0_30px_rgba(0,0,0,0.5)]'
              }`}
            >
              <ChevronRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
            </button>

            <div className="flex flex-col h-full">
              <div className={`p-8 border-b flex flex-col gap-4 ${isLight ? 'bg-[#FFFFFF] border-[#E9ECEF]' : 'bg-[#0f111a]/40 border-white/5'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <h3 className={`text-[12px] font-black uppercase tracking-[0.2em] ${isLight ? 'text-[#212529]' : 'text-white/80'}`}>
                      {(!activeProfile || activeProfile === 'Default') ? 'Choisir une macro' : activeProfile}
                    </h3>
                    <p className={`text-[10px] font-black uppercase tracking-widest italic ${isLight ? 'text-slate-400' : 'text-white/30'}`}>Gestion des séquences</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center gap-4 flex-1">
                    <span className={`text-[10px] font-black uppercase tracking-widest opacity-40`}>Total</span>
                    <div className="px-3 py-1.5 rounded-xl bg-purple-500/10 text-purple-400 text-[12px] font-black shadow-lg shadow-purple-500/5">{macros.length}</div>
                  </div>
                  <button 
                    onClick={() => {
                      setEditingMacroId(null);
                      setSelectedKey(null);
                      setForceEditor(true);
                      setView('list');
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-br from-[#8b5cf6] to-[#ec4899] text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-purple-500/20 hover:scale-105 active:scale-95 transition-all shadow-[0_0_15px_rgba(139,92,246,0.3)]"
                  >
                    <Plus size={14} strokeWidth={3} />
                    <span>Nouveau</span>
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                {macros.length === 0 ? (
                  <div className={`h-full flex flex-col items-center justify-center text-center p-8 gap-6 ${isLight ? 'opacity-20 text-[#212529]' : 'opacity-10 text-white'}`}>
                    <Zap size={64} strokeWidth={1} />
                    <p className="text-[12px] font-black uppercase tracking-[0.2em] leading-relaxed">Aucune macro assignée.</p>
                  </div>
                ) : (
                  <Reorder.Group axis="y" values={macros} onReorder={setMacros} className="flex flex-col gap-4">
                    {macros.map(macro => (
                      <Reorder.Item key={macro.id} value={macro} onDragStart={(e) => handleDragStart(e as any, macro.id)} className="relative group cursor-grab active:cursor-grabbing">
                        <motion.div onClick={() => { setEditingMacroId(macro.id); setView('list'); }} className={`flex items-center gap-4 p-5 rounded-[2rem] border transition-all text-left cursor-pointer ${selectedKey === (macro.trigger?.key) || editingMacroId === macro.id ? 'border-primary bg-primary/5' : isLight ? 'bg-white border-[#E9ECEF] text-[#212529]' : 'bg-white/5 border-white/5 text-white'}`}>
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isLight ? 'bg-[#F8F9FA] text-primary' : 'bg-primary/20 text-primary'}`}><Zap size={24} fill="currentColor" /></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-black uppercase tracking-widest truncate">{macro.name || "Sans nom"}</p>
                            <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-primary/10 text-primary">{macro.trigger?.key || "Non assigné"}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button onClick={(e) => { e.stopPropagation(); setEditingMacroId(macro.id); setView('list'); }} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-black/5"><FileSearch size={18} /></button>
                            <button onClick={(e) => { e.stopPropagation(); deleteMacro(macro.id); }} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-red-500/10 hover:text-red-500"><Trash2 size={18} /></button>
                          </div>
                        </motion.div>
                      </Reorder.Item>
                    ))}
                  </Reorder.Group>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <ToastContainer />
    </div>
  );
}

export default App;
