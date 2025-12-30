import { useEffect, useState, useMemo } from "react";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { DeviceMapper, MacroEditor, Settings, Dashboard, ErrorBoundary } from "./components";
import ToastContainer from "./components/ToastContainer";
import { LayoutGrid, List, X, Minus, ChevronDown, Zap, ChevronRight, ChevronLeft, Plus, FileSearch, Trash2 } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { listen } from "@tauri-apps/api/event";
import { useStore } from "./store/useStore";
import { Reorder, motion, AnimatePresence } from "framer-motion";
import { Settings as SettingsIcon } from "lucide-react";

function App() {
  const handleDragStart = (e: React.DragEvent, macroId: string) => {
    if (e.dataTransfer) {
      e.dataTransfer.setData("text/plain", macroId);
      e.dataTransfer.effectAllowed = "copy";
      
      // Ajout d'une image de prévisualisation fantôme plus propre si nécessaire
      const dragIcon = document.createElement('div');
      dragIcon.style.display = 'none';
      document.body.appendChild(dragIcon);
      e.dataTransfer.setDragImage(dragIcon, 0, 0);
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
    addNotification
  } = useStore();

  const [showMacrosMenu, setShowMacrosMenu] = useState(false);
  const [editingMacroId, setEditingMacroId] = useState<string | null>(null);
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [settingsSubView, setSettingsSubView] = useState('Général');
  const [newProfileName, setNewProfileName] = useState("");
  const [forceEditor, setForceEditor] = useState(false);
  const isLight = settings?.theme === 'light';

  // Nouveaux états pour le menu profil
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; profile: string } | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [profileToRename, setProfileToRename] = useState<string | null>(null);

  // Vérification des mises à jour au démarrage
  useEffect(() => {
    const checkUpdates = async () => {
      try {
        const update = await check();
        if (update?.available) {
          addNotification(`Nouvelle version ${update.version} détectée. Téléchargement en cours...`, 'info');
          
          await update.downloadAndInstall();
          
          addNotification('Mise à jour installée. Redémarrage de l\'application...', 'success');
          
          // Petit délai pour que l'utilisateur puisse lire la notification
          setTimeout(async () => {
            await relaunch();
          }, 2000);
        }
      } catch (error) {
        console.error("Erreur lors de la vérification des mises à jour:", error);
      }
    };
    checkUpdates();
  }, [addNotification]);

  useEffect(() => {
    const handleClickOutside = () => {
      setIsProfileMenuOpen(false);
      setContextMenu(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleContextMenu = (e: React.MouseEvent, profileName: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, profile: profileName });
  };

  const handleDeleteProfile = async (profileName: string) => {
    if (profileName === 'Default') {
      alert("Le profil 'Default' ne peut pas être supprimé.");
      return;
    }
    if (confirm(`Êtes-vous sûr de vouloir supprimer le profil "${profileName}" ?`)) {
      await deleteProfile(profileName);
    }
    setContextMenu(null);
  };

  const handleStartRename = (profileName: string) => {
    setProfileToRename(profileName);
    setRenameValue(profileName);
    setContextMenu(null);
    setIsProfileMenuOpen(true); // Ouvre le menu pour montrer l'input
  };

  const handleFinishRename = async () => {
    if (profileToRename && renameValue.trim() && renameValue !== profileToRename) {
      await createProfile(renameValue.trim());

      if (profileToRename !== 'Default') {
        await deleteProfile(profileToRename);
      }

      if (activeProfile === profileToRename) {
        setProfile(renameValue.trim());
      }
    }
    setProfileToRename(null);
    setRenameValue("");
  };

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
    setForceEditor(false);
    setView(newView);
  };

  const handleSelectKey = (key: string | null) => {
    setSelectedKey(key);
    setForceEditor(false);
    if (key) {
      // S'assurer qu'on est sur le dashboard pour voir l'éditeur
      setView('dashboard');
      setIsSidebarOpen(false);
      setEditingMacroId(null);
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

  const isEditorActive = forceEditor || editingMacroId !== null || selectedKey !== null;

  const renderContent = () => {
    // Si on est en train d'éditer une macro, on affiche l'éditeur EXCLUSIVEMENT
    const initialMacro = editingMacroId ? macros.find(m => m.id === editingMacroId) : null;
    if (isEditorActive) {
      return (
        <div className="flex-1 h-full overflow-hidden bg-background">
          <MacroEditor
            selectedKey={selectedKey || (initialMacro?.trigger?.key) || ""}
            initialMacro={initialMacro}
            onBack={() => {
              setSelectedKey(null);
              setEditingMacroId(null);
              setForceEditor(false);
              setView('dashboard');
            }}
            theme={settings?.theme || 'dark'}
          />
        </div>
      );
    }

    // Si on est en réglages, on affiche les réglages EXCLUSIVEMENT
    if (view === 'settings') {
      return (
        <div className="flex-1 h-full overflow-auto bg-background">
          <Settings subView={settingsSubView} />
        </div>
      );
    }

    // Par défaut (dashboard), on affiche le dashboard
    // La sidebar (list) est gérée au niveau supérieur du rendu pour pouvoir se superposer
    return (
      <div className="flex-1 relative flex flex-col h-full overflow-hidden">
        <Dashboard
          activeProfile={activeProfile}
          selectedKey={selectedKey}
          onSelectKey={handleSelectKey}
          onDragStart={handleDragStart}
          onDrop={async (e, keyId) => {
            const macroId = e.dataTransfer.getData("text/plain");
            if (macroId) await bindMacroToKey(macroId, keyId);
          }}
          theme={settings?.theme || 'dark'}
          isSidebarOpen={isSidebarOpen}
        />
      </div>
    );
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
          ].map(item => {
            const isActive = item.id === 'list' ? isEditorActive : (view === 'dashboard' && !isEditorActive);
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'list') {
                    // Le bouton "Macros" ouvre directement l'éditeur de macro
                    setForceEditor(true);
                    setEditingMacroId(null);
                    setSelectedKey(null);
                    setIsSidebarOpen(false);
                  } else {
                    setViewWithClose('dashboard');
                    setIsSidebarOpen(false);
                  }
                }}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 group relative ${isActive
                  ? 'bg-primary text-white shadow-lg shadow-primary/30'
                  : isLight ? 'text-slate-400 hover:bg-[#F8F9FA] hover:text-[#212529]' : 'text-slate-500 hover:bg-white/5 hover:text-white'
                  }`}
                title={item.label}
              >
                {item.icon}
                {isActive && (
                  <motion.div layoutId="activeTab" className="absolute -left-4 w-1 h-6 bg-primary rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-auto flex flex-col gap-6 no-drag">
          <button
            onClick={() => setViewWithClose('settings')}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 group relative ${view === 'settings'
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
            <div className={`relative z-50 flex items-center gap-4 no-drag`} onClick={(e) => e.stopPropagation()}>
              <div
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className={`flex items-center gap-3 px-4 py-2 rounded-xl cursor-pointer transition-all border ${isLight
                    ? 'bg-white border-slate-200 hover:border-primary hover:text-primary shadow-sm'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 text-white'
                  }`}
              >
                <div className="flex flex-col">
                  <span className="text-[9px] font-black uppercase tracking-widest opacity-40">Profil Actif</span>
                  <span className="text-xs font-black uppercase tracking-widest truncate max-w-[120px]">
                    {activeProfile || 'Choisir...'}
                  </span>
                </div>
                <ChevronDown size={14} className={`transition-transform duration-300 ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
              </div>

            {/* Menu des Profils */}
            <AnimatePresence>
              {isProfileMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className={`absolute top-full left-0 mt-2 w-64 p-2 rounded-2xl border shadow-xl flex flex-col gap-1 max-h-[300px] overflow-y-auto custom-scrollbar ${isLight ? 'bg-white border-slate-100' : 'bg-[#1a1d23] border-white/10'
                      }`}
                  >
                    {profiles.map(p => (
                      <div
                        key={p.name}
                        onClick={() => {
                          if (profileToRename !== p.name) {
                            setProfile(p.name);
                            setIsProfileMenuOpen(false);
                          }
                        }}
                        onContextMenu={(e) => handleContextMenu(e, p.name)}
                        className={`group relative flex items-center justify-between px-4 py-3 rounded-xl transition-all cursor-pointer ${activeProfile === p.name
                            ? 'bg-primary text-white shadow-lg shadow-primary/20'
                            : isLight
                              ? 'hover:bg-slate-50 text-slate-600'
                              : 'hover:bg-white/5 text-slate-300'
                          }`}
                      >
                        {profileToRename === p.name ? (
                          <input
                            autoFocus
                            type="text"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleFinishRename();
                              if (e.key === 'Escape') setProfileToRename(null);
                            }}
                            onBlur={handleFinishRename}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full bg-transparent border-none outline-none font-black uppercase text-xs"
                          />
                        ) : (
                          <>
                            <div className="flex flex-col">
                              <span className="text-xs font-black uppercase tracking-widest truncate">{p.name}</span>
                              {activeProfile === p.name && <span className="text-[8px] opacity-50 font-bold uppercase">Actuel</span>}
                            </div>
                            
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartRename(p.name);
                                }}
                                className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${
                                  activeProfile === p.name 
                                    ? 'hover:bg-white/20 text-white' 
                                    : isLight ? 'hover:bg-slate-200 text-slate-400 hover:text-primary' : 'hover:bg-white/10 text-white/30 hover:text-primary'
                                }`}
                                title="Renommer"
                              >
                                <FileSearch size={12} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteProfile(p.name);
                                }}
                                disabled={p.name === 'Default'}
                                className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${
                                  p.name === 'Default'
                                    ? 'opacity-0 cursor-default'
                                    : activeProfile === p.name
                                      ? 'hover:bg-red-500/20 text-white hover:text-red-200'
                                      : isLight ? 'hover:bg-red-50 text-slate-400 hover:text-red-500' : 'hover:bg-red-500/10 text-white/30 hover:text-red-500'
                                }`}
                                title="Supprimer"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}

                    <div className="h-px bg-white/5 my-1" />

                    <button
                      onClick={() => {
                        setIsCreatingProfile(true);
                        setIsProfileMenuOpen(false);
                      }}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest ${isLight ? 'hover:bg-purple-50 text-purple-600' : 'hover:bg-purple-500/10 text-purple-400'
                        }`}
                    >
                      <Plus size={14} />
                      Nouveau Profil
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Menu Contextuel */}
              {contextMenu && (
                <div
                  className={`fixed z-[999] w-40 py-1 rounded-xl border shadow-2xl flex flex-col overflow-hidden ${isLight ? 'bg-white border-slate-100' : 'bg-[#1a1d23] border-white/10'
                    }`}
                  style={{ top: contextMenu.y, left: contextMenu.x }}
                >
                  <button
                    onClick={() => handleStartRename(contextMenu.profile)}
                    className={`px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-colors ${isLight ? 'hover:bg-slate-50 text-slate-600' : 'hover:bg-white/5 text-slate-300'
                      }`}
                  >
                    <FileSearch size={12} />
                    Renommer
                  </button>
                  <button
                    onClick={() => handleDeleteProfile(contextMenu.profile)}
                    disabled={contextMenu.profile === 'Default'}
                    className={`px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-colors ${contextMenu.profile === 'Default'
                        ? 'opacity-30 cursor-not-allowed'
                        : isLight
                          ? 'hover:bg-red-50 text-red-500'
                          : 'hover:bg-red-500/10 text-red-500'
                      }`}
                  >
                    <Trash2 size={12} />
                    Supprimer
                  </button>
                </div>
              )}
            </div>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <h1 className={`text-6xl font-black tracking-tighter flex items-center gap-0.5 ${isLight ? 'text-[#212529]' : 'text-white'}`}>
              MACRO<span className="text-transparent bg-clip-text bg-gradient-to-br from-[#8b5cf6] to-[#ec4899] drop-shadow-[0_0_35px_rgba(139,92,246,0.7)]">X</span>
            </h1>
          </div>
        </header>

        <div className="flex-1 overflow-hidden relative">
          <ErrorBoundary>{renderContent()}</ErrorBoundary>
          
          {/* SIDEBAR: Liste des macros (se superpose uniquement sur le dashboard) */}
          <AnimatePresence>
            {isSidebarOpen && view === 'dashboard' && !editingMacroId && !selectedKey && !forceEditor && (
              <motion.div
                key="sidebar-content"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className={`absolute top-0 right-0 w-[320px] h-full z-40 border-l shadow-2xl flex flex-col ${
                  isLight ? 'bg-white border-slate-100' : 'bg-[#0a0c14] border-l border-purple-500/20 shadow-[0_0_40px_rgba(0,0,0,0.5)]'
                }`}
              >
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className={`absolute -left-6 top-1/2 -translate-y-1/2 w-6 h-16 rounded-l-2xl flex items-center justify-center transition-all duration-300 z-[60] group ${isLight ? 'bg-white border-y border-l border-[#E9ECEF] text-slate-400' : 'bg-[#0a0c14] border-y border-l border-purple-500/20 text-purple-400 hover:text-purple-300 shadow-[-10px_0_30px_rgba(0,0,0,0.5)]'
                    }`}
                >
                  <ChevronRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
                </button>

                <div className="flex flex-col h-full">
                  <div className={`p-8 border-b flex flex-col gap-4 ${isLight ? 'bg-[#FFFFFF] border-[#E9ECEF]' : 'bg-[#0f111a]/40 border-white/5'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-1">
                        <h2 className={`text-[12px] font-black uppercase tracking-[0.2em] ${isLight ? 'text-[#212529]' : 'text-white/80'}`}>
                          {(!activeProfile || activeProfile === 'Default') ? 'Mes Macros' : activeProfile}
                        </h2>
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
                          setIsSidebarOpen(false);
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
                          <Reorder.Item 
                            key={macro.id} 
                            value={macro} 
                            draggable
                            onDragStart={(e) => handleDragStart(e as any, macro.id)} 
                            className="relative group cursor-grab active:cursor-grabbing"
                            style={{ x: 0 }}
                          >
                            <motion.div onClick={() => { setEditingMacroId(macro.id); setIsSidebarOpen(false); }} className={`flex items-center gap-4 p-5 rounded-[2rem] border transition-all text-left cursor-pointer ${selectedKey === (macro.trigger?.key) || editingMacroId === macro.id ? 'border-primary bg-primary/5' : isLight ? 'bg-white border-[#E9ECEF] text-[#212529]' : 'bg-white/5 border-white/5 text-white'}`}>
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isLight ? 'bg-[#F8F9FA] text-primary' : 'bg-primary/20 text-primary'}`}><Zap size={24} fill="currentColor" /></div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[12px] font-black uppercase tracking-widest truncate">{macro.name || "Sans nom"}</p>
                                <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-primary/10 text-primary">{macro.trigger?.key || "Non assigné"}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <button onClick={(e) => { e.stopPropagation(); setEditingMacroId(macro.id); setIsSidebarOpen(false); }} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-black/5"><FileSearch size={18} /></button>
                                <button 
                                  onClick={async (e) => { 
                                    e.stopPropagation(); 
                                    if (window.confirm(`Voulez-vous vraiment supprimer la macro "${macro.name}" ?`)) {
                                      await deleteMacro(macro.name); 
                                    }
                                  }} 
                                  className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-red-500/10 hover:text-red-500"
                                >
                                  <Trash2 size={18} />
                                </button>
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

          <AnimatePresence>
            {isCreatingProfile && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6"
              >
                <motion.div
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  className={`w-full max-w-md p-8 rounded-[2.5rem] border shadow-2xl ${isLight ? 'bg-white border-slate-200' : 'bg-[#1a1d23] border-white/10'
                    }`}
                >
                  <h3 className="text-xl font-black uppercase tracking-tighter mb-6">Nouveau Profil</h3>
                  <input
                    autoFocus
                    type="text"
                    placeholder="NOM DU PROFIL..."
                    value={newProfileName}
                    onChange={(e) => setNewProfileName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateProfile()}
                    className={`w-full px-6 py-4 rounded-2xl border mb-6 text-sm font-bold uppercase tracking-widest transition-all outline-none focus:ring-2 focus:ring-primary/20 ${isLight ? 'bg-slate-50 border-slate-200 focus:border-primary' : 'bg-white/5 border-white/10 focus:border-primary/50 text-white'
                      }`}
                  />
                  <div className="flex gap-4">
                    <button
                      onClick={() => setIsCreatingProfile(false)}
                      className={`flex-1 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${isLight ? 'bg-slate-100 text-slate-400 hover:bg-slate-200' : 'bg-white/5 text-white/40 hover:bg-white/10'
                        }`}
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleCreateProfile}
                      className="flex-1 px-6 py-4 rounded-2xl bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      Créer
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {!isSidebarOpen && view === 'dashboard' && !editingMacroId && !selectedKey && !forceEditor && (
          <motion.button
            key="open-sidebar-btn"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onClick={() => setIsSidebarOpen(true)}
            className={`fixed right-0 top-1/2 -translate-y-1/2 w-6 h-16 rounded-l-2xl flex items-center justify-center transition-all duration-300 z-40 group ${isLight ? 'bg-white border-y border-l border-slate-200 text-slate-400' : 'bg-[#0a0c14] border-y border-l border-purple-500/20 text-purple-400 shadow-[-10px_0_30px_rgba(0,0,0,0.5)]'
              }`}
          >
            <ChevronLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
          </motion.button>
        )}
      </AnimatePresence>

      <ToastContainer />
    </div>
  );
}

export default App;
