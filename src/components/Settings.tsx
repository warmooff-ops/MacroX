import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Globe, Save, Palette, Monitor, Layout, Maximize, FolderOpen, Sun, Moon } from 'lucide-react';
import { useStore } from '../store/useStore';
import { invoke } from '@tauri-apps/api/core';

type Category = 'general' | 'performance' | 'appearance' | 'paths';

const Settings: React.FC<{ subView?: string }> = ({ subView }) => {
  const { settings, updateSettings, setView } = useStore();
  const isLight = settings.theme === 'light';
  
  const [activeCategory, setActiveCategory] = useState<Category>('general');
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Refs for sections
  const generalRef = useRef<HTMLDivElement>(null);
  const appearanceRef = useRef<HTMLDivElement>(null);
  const pathsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (subView) {
      const mapping: Record<string, Category> = {
        'Général': 'general',
        'Apparence': 'appearance',
        'Système': 'paths'
      };
      const cat = mapping[subView];
      if (cat) scrollToSection(cat);
    }
  }, [subView]);

  const scrollToSection = (category: Category) => {
    setActiveCategory(category);
    const refs = {
      general: generalRef,
      appearance: appearanceRef,
      paths: pathsRef
    };
    
    const element = refs[category as keyof typeof refs]?.current;
    if (element && scrollContainerRef.current) {
      const offset = element.offsetTop - 20;
      scrollContainerRef.current.scrollTo({
        top: offset,
        behavior: 'smooth'
      });
    }
  };

  const debouncedUpdate = (newSettings: any) => {
    updateSettings(newSettings, true);
  };

  const categories = [
    { id: 'general', label: 'Général', icon: Globe },
    { id: 'appearance', label: 'Apparence', icon: Palette },
    { id: 'paths', label: 'Système', icon: Monitor },
  ];

  const { scrollYProgress } = useScroll({
    container: scrollContainerRef
  });

  const buttonY = useTransform(scrollYProgress, [0, 1], [0, -20]);

  return (
    <div className={`flex h-full overflow-hidden transition-colors duration-500 ${isLight ? 'bg-[#F8F9FA] text-[#212529]' : 'bg-[#0f111a] text-white'}`}>
      {/* Sidebar for tabs */}
      <aside data-tauri-drag-region className={`w-72 flex-none border-r flex flex-col p-8 gap-12 sticky top-0 h-full ${isLight ? 'bg-white border-[#E9ECEF]' : 'bg-[#0f111a] border-white/5'}`}>
        <div className="flex flex-col gap-2 no-drag">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 px-4">Configuration</h3>
          <div className="flex flex-col gap-1">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => scrollToSection(cat.id as Category)}
                className={`flex items-center gap-4 px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${
                  activeCategory === cat.id 
                    ? 'bg-primary text-white shadow-[0_0_20px_rgba(139,92,246,0.3)]' 
                    : isLight ? 'text-slate-400 hover:bg-slate-50' : 'text-slate-500 hover:bg-white/5'
                }`}
              >
                <cat.icon size={18} />
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto custom-scrollbar px-16 py-12 pb-32 space-y-24 w-full"
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
                          ? 'border-primary bg-primary/10 text-primary shadow-[0_0_15px_rgba(139,92,246,0.2)]' 
                          : isLight ? 'border-[#E9ECEF] bg-white text-[#212529] hover:bg-[#F8F9FA] shadow-sm' : 'border-white/5 bg-white/5 text-slate-500'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Unité de temps (Macro)</label>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { id: 'ms', label: 'Millisecondes (ms)' },
                    { id: 's', label: 'Secondes (s)' },
                    { id: 'm', label: 'Minutes (m)' }
                  ].map((unit) => (
                    <button
                      key={unit.id}
                      onClick={() => debouncedUpdate({ time_unit: unit.id as any })}
                      className={`p-6 rounded-2xl border transition-all text-center font-black uppercase tracking-widest text-xs ${
                        settings.time_unit === unit.id 
                          ? 'border-primary bg-primary/10 text-primary shadow-[0_0_15px_rgba(139,92,246,0.2)]' 
                          : isLight ? 'border-[#E9ECEF] bg-white text-[#212529] hover:bg-[#F8F9FA] shadow-sm' : 'border-white/5 bg-white/5 text-slate-500'
                      }`}
                    >
                      {unit.label}
                    </button>
                  ))}
                </div>
              </div>

              <div 
                onClick={() => debouncedUpdate({ auto_start: !settings.auto_start })}
                className={`p-6 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  settings.auto_start ? 'border-primary bg-primary/5' : isLight ? 'border-[#E9ECEF] bg-white hover:bg-[#F8F9FA] shadow-sm' : 'border-white/5 bg-white/5'
                }`}
              >
                <div className="flex flex-col gap-1">
                  <span className={`text-xs font-black uppercase tracking-widest ${isLight ? 'text-slate-900' : 'text-white'}`}>Lancer au démarrage</span>
                  <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'opacity-40'}`}>L'application s'ouvre avec Windows</span>
                </div>
                <div className={`w-12 h-6 rounded-full p-1 transition-colors ${settings.auto_start ? 'bg-primary' : (isLight ? 'bg-slate-200' : 'bg-white/10')}`}>
                  <motion.div 
                    animate={{ x: settings.auto_start ? 24 : 0 }}
                    className="w-4 h-4 bg-white rounded-full shadow-md"
                  />
                </div>
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
                          ? 'border-primary bg-primary/10 text-primary shadow-[0_0_15px_rgba(139,92,246,0.2)]' 
                          : isLight ? 'border-[#E9ECEF] bg-white text-[#212529] hover:bg-[#F8F9FA] shadow-sm' : 'border-white/5 bg-white/5 text-slate-500'
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
                  className={`w-full accent-primary h-2 rounded-full appearance-none ${isLight ? 'bg-slate-100' : 'bg-white/10'}`} 
                />
              </div>
            </div>
          </section>

          {/* SYSTEM SECTION */}
          <section ref={pathsRef} className="space-y-12 pb-24">
            <div className="flex items-center gap-4 opacity-50">
              <Monitor size={20} />
              <h4 className="text-xs font-black uppercase tracking-widest">Configuration Système</h4>
              <div className="h-[1px] flex-1 bg-current opacity-10" />
            </div>

            <div className="grid grid-cols-1 gap-12">
              <div className="flex flex-col gap-4">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Type de Clavier (Layout)</label>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { id: 'AZERTY', label: 'AZERTY' },
                    { id: 'QWERTY', label: 'QWERTY' }
                  ].map((layout) => (
                    <button
                      key={layout.id}
                      onClick={() => debouncedUpdate({ layout: layout.id, keyboard_layout_type: layout.id })}
                      className={`p-6 rounded-2xl border transition-all text-center font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 ${
                        settings.keyboard_layout_type === layout.id 
                          ? 'border-primary bg-primary/10 text-primary shadow-[0_0_15px_rgba(139,92,246,0.2)]' 
                          : isLight ? 'border-slate-100 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-sm' : 'border-white/5 bg-white/5 text-slate-500'
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
                          ? 'border-primary bg-primary/10 text-primary shadow-[0_0_15px_rgba(139,92,246,0.2)]' 
                          : isLight ? 'border-slate-100 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-sm' : 'border-white/5 bg-white/5 text-slate-500'
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
                <div className={`flex items-center gap-4 p-5 rounded-2xl border ${isLight ? 'bg-white border-slate-100 shadow-sm' : 'bg-white/5 border-white/5'}`}>
                  <code className={`flex-1 text-[10px] font-mono overflow-hidden text-ellipsis italic ${isLight ? 'text-slate-600' : 'opacity-60'}`}>Documents\MacroX</code>
                  <button 
                    onClick={() => invoke('open_profiles_folder')}
                    className={`p-3 rounded-xl transition-colors border ${isLight ? 'bg-white border-primary/20 text-primary hover:bg-primary/5' : 'bg-primary/10 border-primary/20 text-primary hover:bg-primary/20'}`}
                  >
                    <FolderOpen size={18} />
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Floating Save Button */}
        <motion.div 
          style={{ y: buttonY }}
          className="absolute bottom-8 right-8"
        >
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setIsSaving(true);
              setTimeout(() => {
                setIsSaving(false);
                setShowSaved(true);
                setTimeout(() => setShowSaved(false), 2000);
              }, 600);
            }}
            className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-2xl text-white font-black uppercase tracking-widest text-xs shadow-[0_10px_30px_rgba(139,92,246,0.4)] transition-all hover:shadow-[0_15px_40px_rgba(139,92,246,0.6)]"
          >
            {isSaving ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : showSaved ? (
              <>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                Enregistré
              </>
            ) : (
              <>
                <Save size={18} />
                Enregistrer
              </>
            )}
          </motion.button>
        </motion.div>
      </main>
    </div>
  );
};

export default Settings;
