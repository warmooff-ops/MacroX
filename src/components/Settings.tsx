import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Keyboard, Save, ArrowLeft, Sun, Moon, FolderOpen, Clock, Plus, Settings as SettingsIcon, Monitor, Zap, Palette, Shield, Layout, Maximize } from 'lucide-react';
import { useStore } from '../store/useStore';
import { invoke } from '@tauri-apps/api/core';

type Category = 'general' | 'performance' | 'appearance' | 'paths';

const Settings: React.FC = () => {
  const { settings, updateSettings, setView, t, antigravityEnabled, setAntigravity } = useStore();
  const isLight = settings.theme === 'light';
  
  const [activeCategory, setActiveCategory] = useState<Category>('general');
  const [isSaving, setIsSaving] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Refs for sections
  const generalRef = useRef<HTMLDivElement>(null);
  const performanceRef = useRef<HTMLDivElement>(null);
  const appearanceRef = useRef<HTMLDivElement>(null);
  const pathsRef = useRef<HTMLDivElement>(null);

  const scrollToSection = (category: Category) => {
    setActiveCategory(category);
    const refs = {
      general: generalRef,
      performance: performanceRef,
      appearance: appearanceRef,
      paths: pathsRef
    };
    
    const element = refs[category].current;
    if (element && scrollContainerRef.current) {
      const offset = element.offsetTop - 20; // Small padding from top
      scrollContainerRef.current.scrollTo({
        top: offset,
        behavior: 'smooth'
      });
    }
  };

  // Debounced save for settings
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingSettingsRef = useRef<any>({});
  
  const debouncedUpdate = (newSettings: any) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    
    // Merge new settings into pending
    pendingSettingsRef.current = { ...pendingSettingsRef.current, ...newSettings };
    
    // Update store immediately for UI responsiveness (WITHOUT persistence yet)
    updateSettings(newSettings, false);
    
    setIsSaving(true);
    timerRef.current = setTimeout(async () => {
      try {
        // Now persist everything at once
        await updateSettings(pendingSettingsRef.current, true);
        setIsSaving(false);
        pendingSettingsRef.current = {};
      } catch (error) {
        console.error("Failed to save settings:", error);
      }
    }, 1000);
  };

  const categories = [
    { id: 'general', label: 'Général', icon: Globe },
    { id: 'performance', label: 'Performance', icon: Zap },
    { id: 'appearance', label: 'Apparence', icon: Palette },
    { id: 'paths', label: 'Système', icon: Shield },
  ];

  const handleManualSave = async () => {
    setIsSaving(true);
    try {
      await updateSettings(pendingSettingsRef.current, true);
      pendingSettingsRef.current = {};
      setTimeout(() => setIsSaving(false), 1000);
    } catch (error) {
      console.error("Failed to save settings:", error);
      setIsSaving(false);
    }
  };

  return (
    <div className={`flex-1 flex h-full overflow-hidden transition-colors duration-500 ${isLight ? 'bg-slate-50 text-slate-900' : 'bg-[#0f1115] text-white'}`}>
      {/* Fixed Sidebar */}
      <aside className={`w-[280px] h-full flex-none border-r flex flex-col p-8 gap-12 fixed left-0 top-0 z-[100] ${isLight ? 'bg-white border-slate-100 shadow-xl' : 'bg-[#0b0d11] border-white/5 shadow-2xl shadow-black/50'}`}>
        <div className="space-y-2">
          <h2 className="text-3xl font-black italic tracking-tighter uppercase leading-none">
            Macro <span className="text-primary">X</span>
          </h2>
          <div className="flex items-center gap-2">
            <div className="h-[2px] w-8 bg-primary" />
            <p className="text-[9px] font-black uppercase tracking-[0.4em] opacity-30">Config Panel</p>
          </div>
        </div>

        <nav className="flex flex-col gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => scrollToSection(cat.id as Category)}
              className={`flex items-center gap-5 px-5 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all duration-300 group ${
                activeCategory === cat.id 
                  ? 'bg-primary text-white shadow-xl shadow-primary/30 scale-[1.02]' 
                  : isLight 
                    ? 'text-slate-400 hover:bg-slate-50 hover:text-slate-900' 
                    : 'text-slate-500 hover:bg-white/5 hover:text-white'
              }`}
            >
              <cat.icon size={16} className={`transition-transform duration-300 group-hover:scale-110 ${activeCategory === cat.id ? 'scale-110' : ''}`} />
              {cat.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto">
          <button 
            onClick={() => setView('dashboard')}
            className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all border group relative overflow-hidden ${
              isLight 
                ? 'bg-white border-slate-200 text-slate-400 hover:border-primary/50 hover:text-primary' 
                : 'bg-white/5 border-white/5 text-slate-500 hover:text-white hover:bg-white/10'
            }`}
          >
            <div className="relative z-10 flex items-center justify-center gap-3">
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
              DASHBOARD
            </div>
          </button>
        </div>
      </aside>

      {/* Main Content Area (with margin for fixed sidebar) */}
      <main className="flex-1 flex flex-col overflow-hidden relative ml-[280px]">
        <header className={`h-24 flex items-center px-12 justify-between flex-none z-10 backdrop-blur-xl border-b sticky top-0 ${isLight ? 'bg-white/80 border-slate-100' : 'bg-[#0f1115]/80 border-white/5'}`}>
            <div className="flex flex-col">
              <h1 className={`text-3xl font-black uppercase tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>Paramètres</h1>
              <p className="text-xs font-bold uppercase tracking-widest opacity-40">Configuration globale du logiciel</p>
            </div>
          
          <div className="flex items-center gap-6">
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95, y: 0 }}
              onClick={handleManualSave}
              disabled={isSaving}
              className={`px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all flex items-center gap-4 shadow-2xl ${
                isSaving 
                  ? 'bg-green-500 text-white cursor-wait' 
                  : 'bg-primary text-white shadow-primary/40 hover:bg-primary/90 hover:shadow-primary/60'
              }`}
            >
              <Save size={18} className={isSaving ? 'animate-spin' : ''} />
              SAUVEGARDER
            </motion.button>
          </div>
        </header>

        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto custom-scrollbar px-12 py-8 pb-32 space-y-24"
          onScroll={(e) => {
            const container = e.currentTarget;
            const scrollPos = container.scrollTop + 150; // Offset to trigger before section hits top
            
            const sections = [
              { id: 'paths', ref: pathsRef },
              { id: 'appearance', ref: appearanceRef },
              { id: 'performance', ref: performanceRef },
              { id: 'general', ref: generalRef }
            ];
            
            // Find the current section
            for (const section of sections) {
              if (section.ref.current && scrollPos >= section.ref.current.offsetTop) {
                if (activeCategory !== section.id) {
                  setActiveCategory(section.id as Category);
                }
                break;
              }
            }
          }}
        >
          {/* GENERAL SECTION */}
          <section ref={generalRef} className="space-y-12">
            <div className="flex items-center gap-4 opacity-50">
              <Globe size={20} />
              <h4 className="text-xs font-black uppercase tracking-widest">Configuration Générale</h4>
              <div className="h-[1px] flex-1 bg-current opacity-10" />
            </div>

            <div className="grid grid-cols-1 gap-12">
              <div className="flex flex-col gap-4">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Langue du logiciel</label>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { id: 'fr', label: 'Français' },
                    { id: 'en', label: 'English' }
                  ].map((lang) => (
                    <button
                      key={lang.id}
                      onClick={() => debouncedUpdate({ language: lang.id })}
                      className={`p-6 rounded-2xl border transition-all text-center font-black uppercase tracking-widest text-xs ${
                        settings.language === lang.id 
                          ? 'border-primary bg-primary/10 text-primary' 
                          : isLight ? 'border-slate-100 bg-slate-50 text-slate-400' : 'border-white/5 bg-white/5 text-slate-500'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>

              <div 
                onClick={() => debouncedUpdate({ auto_start: !settings.auto_start })}
                className={`p-6 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  settings.auto_start ? 'border-primary bg-primary/5' : isLight ? 'border-slate-100 bg-slate-50' : 'border-white/5 bg-white/5'
                }`}
              >
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-black uppercase tracking-widest">Lancer au démarrage</span>
                  <span className="text-[10px] opacity-40">L'application s'ouvre avec Windows</span>
                </div>
                <div className={`w-12 h-6 rounded-full p-1 transition-colors ${settings.auto_start ? 'bg-primary' : 'bg-slate-300 dark:bg-white/10'}`}>
                  <motion.div 
                    animate={{ x: settings.auto_start ? 24 : 0 }}
                    className="w-4 h-4 bg-white rounded-full shadow-md"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* PERFORMANCE SECTION */}
          <section ref={performanceRef} className="space-y-12">
            <div className="flex items-center gap-4 opacity-50">
              <Zap size={20} />
              <h4 className="text-xs font-black uppercase tracking-widest">Optimisation & Performance</h4>
              <div className="h-[1px] flex-1 bg-current opacity-10" />
            </div>

            <div className="grid grid-cols-1 gap-12">
              <div className="flex flex-col gap-6">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Délai Global entre actions</label>
                  <span className="text-primary font-black text-sm">{settings.global_delay}ms</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="500" 
                  step="10"
                  value={settings.global_delay || 50} 
                  onChange={(e) => debouncedUpdate({ global_delay: parseInt(e.target.value) })}
                  className="w-full accent-primary h-2 bg-primary/10 rounded-full appearance-none" 
                />
              </div>

              <div className="flex flex-col gap-6">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Taux de rafraîchissement (ms)</label>
                  <span className="text-primary font-black text-sm">{settings.refresh_rate}ms</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="100" 
                  value={settings.refresh_rate || 1} 
                  onChange={(e) => debouncedUpdate({ refresh_rate: parseInt(e.target.value) })}
                  className="w-full accent-primary h-2 bg-primary/10 rounded-full appearance-none" 
                />
              </div>
            </div>
          </section>

          {/* APPEARANCE SECTION */}
          <section ref={appearanceRef} className="space-y-12">
            <div className="flex items-center gap-4 opacity-50">
              <Palette size={20} />
              <h4 className="text-xs font-black uppercase tracking-widest">Design & Personnalisation</h4>
              <div className="h-[1px] flex-1 bg-current opacity-10" />
            </div>

            <div className="grid grid-cols-1 gap-12">
              <div className="flex flex-col gap-4">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Thème Visuel</label>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { id: 'light', icon: Sun, label: 'Clair' },
                    { id: 'dark', icon: Moon, label: 'Sombre' }
                  ].map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => debouncedUpdate({ theme: theme.id })}
                      className={`p-6 rounded-2xl border transition-all text-center font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 ${
                        settings.theme === theme.id 
                          ? 'border-primary bg-primary/10 text-primary' 
                          : isLight ? 'border-slate-100 bg-slate-50 text-slate-400' : 'border-white/5 bg-white/5 text-slate-500'
                      }`}
                    >
                      <theme.icon size={18} />
                      {theme.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-6">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Opacité de l'interface</label>
                  <span className="text-primary font-black text-sm">{settings.opacity}%</span>
                </div>
                <input 
                  type="range" 
                  min="50" 
                  max="100" 
                  value={settings.opacity || 95} 
                  onChange={(e) => debouncedUpdate({ opacity: parseInt(e.target.value) })}
                  className="w-full accent-primary h-2 bg-primary/10 rounded-full appearance-none" 
                />
              </div>

              <div className="flex flex-col gap-6">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Couleur d'accentuation</label>
                <div className="flex flex-wrap gap-4">
                  {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#ffffff'].map(color => (
                    <button 
                      key={color}
                      onClick={() => debouncedUpdate({ illumination_color: color })}
                      className={`w-12 h-12 rounded-2xl border-2 transition-all hover:scale-110 shadow-lg ${settings.illumination_color === color ? 'border-primary scale-110' : 'border-transparent opacity-60'}`}
                      style={{ backgroundColor: color, boxShadow: settings.illumination_color === color ? `0 0 20px ${color}40` : 'none' }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* SYSTEM SECTION */}
          <section ref={pathsRef} className="space-y-12 pb-24">
            <div className="flex items-center gap-4 opacity-50">
              <Shield size={20} />
              <h4 className="text-xs font-black uppercase tracking-widest">Système & Configuration PC</h4>
              <div className="h-[1px] flex-1 bg-current opacity-10" />
            </div>

            <div className="grid grid-cols-1 gap-12">
              <div className="flex flex-col gap-4">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Type de Clavier (Layout)</label>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { id: 'AZERTY', label: 'AZERTY' },
                    { id: 'QWERTY', label: 'QWERTY' },
                    { id: 'QWERTZ', label: 'QWERTZ' }
                  ].map((layout) => (
                    <button
                      key={layout.id}
                      onClick={() => debouncedUpdate({ layout: layout.id, keyboard_layout_type: layout.id })}
                      className={`p-6 rounded-2xl border transition-all text-center font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 ${
                        settings.layout === layout.id 
                          ? 'border-primary bg-primary/10 text-primary' 
                          : isLight ? 'border-slate-100 bg-slate-50 text-slate-400' : 'border-white/5 bg-white/5 text-slate-500'
                      }`}
                    >
                      <Layout size={18} />
                      {layout.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Format du Clavier (Taille)</label>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { id: '100%', label: '100% (Full)' },
                    { id: '80%', label: '80% (TKL)' },
                    { id: '60%', label: '60% (Mini)' }
                  ].map((size) => (
                    <button
                      key={size.id}
                      onClick={() => debouncedUpdate({ keyboard_size: size.id })}
                      className={`p-6 rounded-2xl border transition-all text-center font-black uppercase tracking-widest text-xs flex flex-col items-center gap-2 ${
                        settings.keyboard_size === size.id 
                          ? 'border-primary bg-primary/10 text-primary' 
                          : isLight ? 'border-slate-100 bg-slate-50 text-slate-400' : 'border-white/5 bg-white/5 text-slate-500'
                      }`}
                    >
                      <Maximize size={18} />
                      {size.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Dossier de sauvegarde</label>
                <div className={`flex items-center gap-4 p-5 rounded-2xl border ${isLight ? 'bg-slate-50 border-slate-100' : 'bg-white/5 border-white/5'}`}>
                  <code className="flex-1 text-[10px] font-mono opacity-60 overflow-hidden text-ellipsis italic">AppData\Local\MacroX\profiles</code>
                  <button 
                    onClick={() => invoke('open_profiles_folder')}
                    className="p-3 hover:bg-primary/10 rounded-xl transition-colors text-primary border border-primary/20"
                  >
                    <FolderOpen size={18} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button className={`p-6 rounded-2xl border font-black uppercase tracking-widest text-[10px] transition-all flex flex-col items-center gap-3 ${isLight ? 'bg-white border-slate-100 hover:border-primary/30' : 'bg-white/5 border-white/5 hover:border-primary/30'}`}>
                  <div className="p-3 bg-primary/10 rounded-xl text-primary"><Save size={20} /></div>
                  Exporter Profil Complet
                </button>
                <button className={`p-6 rounded-2xl border font-black uppercase tracking-widest text-[10px] transition-all flex flex-col items-center gap-3 ${isLight ? 'bg-white border-slate-100 hover:border-primary/30' : 'bg-white/5 border-white/5 hover:border-primary/30'}`}>
                  <div className="p-3 bg-primary/10 rounded-xl text-primary"><FolderOpen size={20} /></div>
                  Importer Profil JSON
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Settings;
