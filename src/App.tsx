import { useEffect, useState, useMemo } from "react";
import { DeviceMapper, MacroEditor, SettingsView, Dashboard, ErrorBoundary } from "./components";
import ToastContainer from "./components/ToastContainer";
import { Settings, LayoutGrid, List, X, Minus, ChevronDown, Zap, AppWindow, FileSearch, ChevronRight, ChevronLeft, Plus, Trash2, Gamepad2 } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { open } from "@tauri-apps/plugin-dialog";
import { listen } from "@tauri-apps/api/event";
import { useStore } from "./store/useStore";
import { Reorder, motion, AnimatePresence } from "framer-motion";

function App() {
  const { 
    view, setView, 
    selectedKey, setSelectedKey, 
    macros, setMacros, deleteMacro,
    profiles, loadProfiles, createProfile, deleteProfile,
    settings, loadMacros, loadConfig,
    antigravityEnabled,
    t,
    activeProfile, setProfile,
    isSidebarOpen, setIsSidebarOpen
  } = useStore();

  const [showMacrosMenu, setShowMacrosMenu] = useState(false);
  const [activeAppName, setActiveAppName] = useState("Bureau");
  const [activeApps, setActiveApps] = useState<string[]>([]);
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");
  const [forceEditor, setForceEditor] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

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
    setView(newView);
    if (newView === 'dashboard') {
      setIsSidebarOpen(true);
    } else {
      setIsSidebarOpen(false);
    }
  };

  const handleSelectKey = (key: string | null) => {
    setSelectedKey(key);
    setForceEditor(false);
    if (key) {
      setView('list'); // Allez directement à l'éditeur quand une touche est sélectionnée
    }
  };

  const setProfileWithClose = (newProfile: string) => {
    setSelectedKey(null);
    setProfile(newProfile);
  };

  const handleCreateProfile = async () => {
    if (newProfileName.trim()) {
      const name = newProfileName.trim();
      await createProfile(name);
      setIsCreatingProfile(false);
      setNewProfileName("");
    } else {
      const name = prompt("Nom du nouveau profil :");
      if (name) {
        await createProfile(name);
      }
    }
  };

  useEffect(() => {
    // Fermer l'éditeur de macro si on change d'onglet
    if (view === 'settings' || view === 'list') {
      setSelectedKey(null);
    }
  }, [view, setSelectedKey]);

  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      // Shortcut 'N' for New Macro - Redirects to Editor
      if (e.key.toLowerCase() === 'n' && !selectedKey && view === 'dashboard' && !isCreatingProfile) {
        // Find the first free key or just ask for one
        const key = prompt("Entrez la touche pour la nouvelle macro (ex: KeyA, Digit1) :");
        if (key) {
          setSelectedKey(key);
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [view, selectedKey, isCreatingProfile, setSelectedKey]);

  const selectApp = async () => {
    try {
      const selected = await open({
        multiple: false,
        directory: false,
        filters: [{
          name: 'Executables',
          extensions: ['exe']
        }]
      });
      
      if (selected && typeof selected === 'string') {
        // On récupère le nom du fichier sans le .exe pour matcher le nom du processus
        const fileName = selected.split('\\').pop() || selected;
        const processName = fileName.replace('.exe', '');
        setProfileWithClose(processName);
      }
    } catch (err) {
      console.error("Dialog error:", err);
    }
  };

  useEffect(() => {
    // Initialisation au montage
    loadConfig();
    loadProfiles();
    
    // Initialisation des dossiers AppData
    invoke("init_folders").catch(console.error);

    // Listen for window move to ensure drag region works
    const unlistenWindow = listen('tauri://window-created', () => {
      console.log('Window created');
    });

    // Listen for state reloads from backend
    const setupListener = async () => {
      const unlisten = await listen("state-reloaded", () => {
        console.log("State reloaded from file change");
        loadConfig();
        loadMacros();
      });
      return unlisten;
    };

    // App detection polling
    const appDetectionInterval = setInterval(async () => {
      try {
        const state = useStore.getState();
        const currentProfiles = state.profiles;
        const currentActiveProfile = state.activeProfile;

        // Get all active apps for the list
        const apps = await invoke<string[]>("get_active_apps");
        if (apps) setActiveApps(apps);

        // Get currently focused app for auto-switching
        const focusedApp = await invoke<string>("get_active_app");
        if (focusedApp) {
          // Auto-switch profile if a matching one exists
          const matchingProfile = currentProfiles.find(p => p.name.toLowerCase() === focusedApp.toLowerCase());
          if (matchingProfile && currentActiveProfile !== matchingProfile.name) {
            console.log(`Auto-switching to profile: ${matchingProfile.name}`);
            state.setProfile(matchingProfile.name);
          }
        }
      } catch (err) {
        // Silently fail if command not implemented yet
      }
    }, 2000); // Poll every 2 seconds for better responsiveness
    
    const unlistenPromise = setupListener();
    
    return () => {
      unlistenWindow.then(f => f());
      unlistenPromise.then(unlisten => unlisten());
      clearInterval(appDetectionInterval);
    };
  }, []);

  const minimizeWindow = async () => {
    try {
      await getCurrentWebviewWindow().minimize();
    } catch (err) {
      console.error("Failed to minimize window:", err);
      invoke('minimize_app');
    }
  };

  const closeWindow = async () => {
    try {
      await getCurrentWebviewWindow().close();
    } catch (err) {
      console.error("Failed to close window:", err);
      invoke('close_app');
    }
  };

  const isLight = settings?.theme === 'light';

  useEffect(() => {
    // Initial data load
    const init = async () => {
      try {
        // Load initial data if needed
        await loadProfiles();
      } catch (error) {
        console.error("Failed to load profiles:", error);
      }
    };
    init();
  }, []);

  const renderContent = () => {
    if (view === 'list') {
      return (
        <MacroEditor 
          selectedKey={selectedKey || ""} 
          onBack={() => setView('dashboard')}
        />
      );
    }

    if (view === 'dashboard') {
      return (
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 relative">
            <Dashboard 
              selectedKey={selectedKey}
              onSelectKey={handleSelectKey}
              activeTriggers={[]}
              theme={settings?.theme || 'dark'}
            />
          </div>
        </div>
      );
    }

    if (view === 'settings') {
      return <SettingsView />;
    }

    return null;
  };



  return (
    <div className={`flex h-screen w-screen transition-colors duration-500 overflow-hidden rounded-xl border border-white/10 ${isLight ? 'bg-white text-slate-900' : 'bg-[#0f1115] text-white'}`}>
      {/* Sidebar Navigation (Left) */}
      <aside className={`w-[80px] flex-none flex flex-col items-center py-8 gap-10 transition-all duration-300 ${isLight ? 'bg-slate-50' : 'bg-[#12141a]'}`}>
        <nav className="flex flex-col gap-6 flex-1 mt-10">
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setViewWithClose('dashboard')}
            title={t('dashboard')}
            className={`p-4 rounded-2xl transition-all duration-300 relative group ${view === 'dashboard' ? (isLight ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-primary text-white shadow-lg shadow-primary/20') : (isLight ? 'text-slate-400 hover:bg-slate-200' : 'text-slate-500 hover:bg-white/5')}`}
          >
            <LayoutGrid size={24} />
          </motion.button>

          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setViewWithClose('list')}
            title="Macros"
            className={`p-4 rounded-2xl transition-all duration-300 relative group ${view === 'list' ? (isLight ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-primary text-white shadow-lg shadow-primary/20') : (isLight ? 'text-slate-400 hover:bg-slate-200' : 'text-slate-500 hover:bg-white/5')}`}
          >
            <List size={24} />
            {/* Indiqueur si une touche est sélectionnée */}
            {selectedKey && view === 'list' && (
              <motion.div 
                layoutId="active-dot"
                className="absolute -right-1 -top-1 w-3 h-3 bg-red-500 rounded-full border-2 border-[#12141a]"
              />
            )}
          </motion.button>
        </nav>

        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setViewWithClose('settings')}
          title={t('settings')}
          className={`p-4 rounded-2xl transition-all duration-300 relative group ${view === 'settings' ? (isLight ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-primary text-white shadow-lg shadow-primary/20') : (isLight ? 'text-slate-400 hover:bg-slate-200' : 'text-slate-500 hover:bg-white/5')}`}
        >
          <Settings size={24} />
        </motion.button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        <ErrorBoundary>
          {/* Persistent Header / Titlebar */}
        <header 
          className={`h-14 flex items-center px-4 justify-between transition-colors z-[100] ${isLight ? 'bg-white/80' : 'bg-[#0f1115]/80'} backdrop-blur-md`}
          data-tauri-drag-region
          style={{ WebkitAppRegion: 'drag' } as any}
        >
          <div className="flex items-center gap-4" style={{ WebkitAppRegion: 'no-drag' } as any}>
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2 group cursor-default"
            >
              <h2 className={`text-xl font-black italic tracking-tighter ${isLight ? 'text-slate-900' : 'text-white'} logo-glow-pulse`}>
                MACRO<span className="text-primary">X</span>
              </h2>
            </motion.div>
          </div>

          <div className="flex items-center gap-6" style={{ WebkitAppRegion: 'no-drag' } as any}>
            {/* Profile Management Section - Aligned Side-by-Side */}
            <div className="flex items-center gap-3">
              {/* Nouveau Profil Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsCreatingProfile(true)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all text-[10px] font-black uppercase tracking-widest ${
                  isLight 
                    ? 'bg-white border-slate-200 hover:border-primary/50 text-slate-700 shadow-sm' 
                    : 'bg-white/5 border-white/10 hover:border-primary/50 text-secondary hover:text-white'
                }`}
              >
                <Plus size={14} className="text-primary" />
                <span>Nouveau Profil</span>
              </motion.button>

              {/* Profil Actif Selector */}
              <div className="relative">
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowMacrosMenu(!showMacrosMenu)}
                  className={`flex items-center gap-3 px-4 py-2 rounded-xl border transition-all min-w-[180px] justify-between ${
                    isLight 
                      ? 'bg-white border-slate-200 hover:border-primary/50 text-slate-700 shadow-sm' 
                      : 'bg-white/5 border-white/10 hover:border-primary/50 text-secondary hover:text-white'
                  }`}
                >
                  <div className="flex flex-col items-start text-left">
                    <span className="text-[8px] font-black uppercase opacity-40 leading-none mb-0.5 tracking-tighter">Profil Actif</span>
                    <span className="text-[10px] font-black truncate max-w-[100px] uppercase">{activeProfile}</span>
                  </div>
                  <ChevronDown size={14} className={`transition-transform duration-300 ${showMacrosMenu ? 'rotate-180' : ''}`} />
                </motion.button>

                <AnimatePresence>
                  {showMacrosMenu && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className={`absolute top-full right-0 mt-1 w-64 rounded-xl border z-[110] p-1 overflow-hidden shadow-2xl ${
                        isLight ? 'bg-white border-slate-200' : 'bg-[#1a1d23] border-white/10 shadow-black/50'
                      }`}
                    >
                      <div className="max-h-60 overflow-y-auto custom-scrollbar">
                        {activeApps.map(app => (
                          <motion.button
                            whileHover={{ x: 4, backgroundColor: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.05)' }}
                            key={app}
                            onClick={() => {
                              setProfileWithClose(app);
                              setShowMacrosMenu(false);
                            }}
                            className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-[10px] font-bold transition-all ${
                              activeProfile === app 
                                ? 'bg-primary text-white' 
                                : isLight ? 'text-slate-600 hover:bg-slate-50' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                            }`}
                          >
                            <AppWindow size={12} />
                            <span className="truncate">{app}</span>
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* System Buttons (Right) */}
            <div className="flex items-center gap-1">
              <button
                onClick={minimizeWindow}
                title="Réduire"
                className={`p-1.5 rounded-lg transition-all ${isLight ? 'hover:bg-slate-100 text-slate-400' : 'hover:bg-white/5 text-secondary'}`}
              >
                <Minus size={16} />
              </button>
              <button
                onClick={closeWindow}
                title="Fermer"
                className={`p-1.5 rounded-lg transition-all ${isLight ? 'hover:bg-red-50 text-red-400' : 'hover:bg-red-500/10 text-red-400'}`}
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-hidden flex relative">
          {/* Main Workspace (Left) */}
          <div className="flex-1 overflow-hidden relative flex flex-col items-center justify-center">
            {renderContent()}

            {/* New Profile Overlay */}
            <AnimatePresence>
              {isCreatingProfile && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`absolute inset-0 z-[70] flex flex-col items-center justify-center backdrop-blur-xl ${isLight ? 'bg-white/90' : 'bg-[#0f1115]/90'}`}
                >
                  <motion.div 
                    initial={{ scale: 0.9, y: 20, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.9, y: 20, opacity: 0 }}
                    className="max-w-md w-full p-10 space-y-8"
                  >
                    <div className="text-center space-y-2">
                      <h2 className={`text-3xl font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>Nouveau Profil</h2>
                      <p className="text-sm font-bold opacity-40 uppercase tracking-widest">Donnez un nom à votre configuration</p>
                    </div>

                    <div className="space-y-4">
                      <input
                        autoFocus
                        type="text"
                        value={newProfileName}
                        onChange={(e) => setNewProfileName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCreateProfile()}
                        placeholder="Ex: League of Legends, Photoshop..."
                        className={`w-full px-6 py-4 rounded-2xl border-2 text-lg font-bold transition-all outline-none ${
                          isLight 
                            ? 'bg-white border-slate-100 focus:border-primary text-slate-900' 
                            : 'bg-white/5 border-white/10 focus:border-primary text-white'
                        }`}
                      />
                      
                      <div className="flex gap-4">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setIsCreatingProfile(false)}
                          className={`flex-1 px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${
                            isLight ? 'bg-slate-100 text-slate-400 hover:bg-slate-200' : 'bg-white/5 text-secondary hover:bg-white/10'
                          }`}
                        >
                          Annuler
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleCreateProfile}
                          className="flex-1 px-6 py-4 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-xs hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                        >
                          Créer le profil
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Macro List Sidebar (Right) - ONLY in Dashboard view, retractable */}
          {view === 'dashboard' && (
            <div 
              id="macro-sidebar"
              className={`relative flex flex-col transition-all duration-300 ${isSidebarOpen ? 'w-[400px]' : 'w-0'} ${isLight ? 'bg-slate-50' : 'bg-[#0a0a0a]'}`}
            >
              {/* Toggle Button (Flèche) */}
              <button 
                onClick={toggleSidebar}
                className={`absolute left-[-32px] top-1/2 -translate-y-1/2 w-8 h-16 flex items-center justify-center rounded-l-xl border-y border-l transition-all z-50 ${
                  isLight ? 'bg-white border-slate-200 text-slate-400 hover:text-primary' : 'bg-[#0a0a0a] border-white/5 text-secondary hover:text-white'
                }`}
              >
                {isSidebarOpen ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
              </button>

              <div className={`p-8 flex flex-col h-full overflow-hidden transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <div className="flex items-center justify-between mb-10">
                  <div className="flex flex-col">
                    <h2 className={`text-2xl font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      Liste des Macros
                    </h2>
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">
                      Vos raccourcis enregistrés
                    </span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                  <div className="space-y-6">
                    {(macros && macros.length > 0) ? (
                      <Reorder.Group 
                        axis="y" 
                        values={macros} 
                        onReorder={setMacros}
                        className="space-y-4"
                      >
                        {macros.map((macro, index) => (
                          <Reorder.Item 
                            key={macro.id} 
                            value={macro}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`p-4 rounded-2xl border flex items-center justify-between group cursor-grab active:cursor-grabbing transition-all ${isLight ? 'bg-white border-slate-100 hover:border-primary/50 shadow-sm' : 'bg-white/5 border-white/5 hover:border-primary/50'}`}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData("macroId", macro.id);
                              e.dataTransfer.effectAllowed = "move";
                            }}
                          >
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isLight ? 'bg-slate-50 text-slate-400 group-hover:bg-primary group-hover:text-white' : 'bg-white/5 text-secondary group-hover:bg-primary group-hover:text-white'}`}>
                                <Gamepad2 size={20} />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className={`text-xs font-black uppercase tracking-widest truncate ${isLight ? 'text-slate-900' : 'text-white'}`} title={macro.name}>{macro.name}</span>
                                <span className="text-[10px] font-bold opacity-40 uppercase tracking-tighter truncate">{macro.trigger.key} • {macro.actions?.length || 0} actions</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => {
                                  setSelectedKey(macro.trigger.key);
                                  setView('list');
                                }}
                                className={`p-2 rounded-lg transition-colors ${isLight ? 'hover:bg-slate-100 text-slate-400 hover:text-primary' : 'hover:bg-white/10 text-secondary hover:text-white'}`}
                              >
                                <Settings size={16} />
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => deleteMacro(macro.id)}
                                className={`p-2 rounded-lg transition-colors ${isLight ? 'hover:bg-red-50 text-red-400' : 'hover:bg-red-500/10 text-red-400'}`}
                              >
                                <Trash2 size={16} />
                              </motion.button>
                            </div>
                          </Reorder.Item>
                        ))}
                      </Reorder.Group>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-20 text-center opacity-30">
                        <List size={48} className="mb-4" />
                        <p className="text-xs font-bold uppercase tracking-widest">Aucune macro</p>
                        <p className="text-[10px] mt-2">Cliquez sur une touche pour commencer</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        </ErrorBoundary>
      </main>
      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
}

export default App;
