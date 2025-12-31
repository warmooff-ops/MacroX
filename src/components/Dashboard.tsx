import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Zap, LayoutGrid, Trash2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import DeviceMapper from './DeviceMapper';
import MouseComponent from './Mouse';

interface DashboardProps {
  activeProfile?: string;
  selectedKey: string | null;
  onSelectKey: (key: string) => void;
  onEditMacro?: (id: string) => void;
  onDrop?: (e: React.DragEvent, keyId: string) => void;
  onDragStart?: (e: React.DragEvent, macroId: string) => void;
  theme?: string;
  isSidebarOpen?: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({ activeProfile, selectedKey, onSelectKey, onEditMacro, onDrop, onDragStart, theme, isSidebarOpen }) => {
  const { macros, deleteMacro, bindMacroToKey } = useStore();
  const unassignedMacros = macros.filter(m => m.trigger?.key === 'UNASSIGNED');

  const isLight = theme === 'light';

  if (!activeProfile) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-20 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md space-y-8"
        >
          <div className={`w-32 h-32 mx-auto mb-12 rounded-[2.5rem] flex items-center justify-center border-2 border-dashed transition-all duration-500 ${isLight ? 'bg-white border-slate-200 text-slate-300 shadow-xl shadow-black/5' : 'bg-white/5 border-white/10 text-white/20 shadow-2xl shadow-black/50'}`}>
            <Plus size={48} strokeWidth={1.5} className="opacity-50" />
          </div>
          <div className="space-y-4">
            <h2 className={`text-4xl font-black tracking-tighter ${isLight ? 'text-slate-900' : 'text-white'}`}>
              CONFIGURATION <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4A4D53] to-[#2A2D33]">REQUISE</span>
            </h2>
            <p className={`text-[11px] font-black uppercase tracking-[0.3em] leading-relaxed ${isLight ? 'text-slate-400' : 'text-white/30'}`}>
              Veuillez créer ou sélectionner un profil pour commencer à configurer vos séquences de macros.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center w-full h-full overflow-hidden">
      <motion.div 
        animate={{ 
          scale: isSidebarOpen ? 0.6 : 0.75,
          x: isSidebarOpen ? -140 : 0
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="flex flex-col items-center gap-12 w-full max-w-7xl px-8"
      >
        {/* Device Mapper Section */}
        <div className={`flex-none rounded-[56px] transition-all duration-500 ${isLight ? 'bg-[#FFFFFF] shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-[#E9ECEF]' : ''}`}>
          <DeviceMapper 
            selectedKey={selectedKey} 
            onSelectKey={onSelectKey}
            onDrop={async (e, keyId) => {
              e.preventDefault();
              const macroId = e.dataTransfer.getData("text/plain");
              if (macroId) {
                await bindMacroToKey(macroId, keyId);
              }
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "copy";
            }}
          />
        </div>

        {/* Unassigned Macros Section */}
        <AnimatePresence>
          {unassignedMacros.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full space-y-6"
            >
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${isLight ? 'bg-slate-100 text-slate-600' : 'bg-white/5 text-white/40'}`}>
                    <LayoutGrid size={18} />
                  </div>
                  <div>
                    <h3 className={`text-sm font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      Macros non assignées
                    </h3>
                    <p className={`text-[10px] font-medium uppercase tracking-wider ${isLight ? 'text-slate-400' : 'text-white/20'}`}>
                      {unassignedMacros.length} macro{unassignedMacros.length > 1 ? 's' : ''} en attente d'assignation
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {unassignedMacros.map((macro) => (
                  <motion.div
                    key={macro.id}
                    layout
                    draggable
                    onDragStart={(e) => {
                      // Ensure standard drag data is set
                      if (e.dataTransfer) {
                        e.dataTransfer.setData("text/plain", macro.id);
                        e.dataTransfer.effectAllowed = "copy";
                      }
                      onDragStart?.(e as any, macro.id);
                    }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className={`group relative p-4 rounded-3xl border transition-all duration-300 cursor-pointer ${
                      isLight 
                        ? 'bg-white border-slate-100 hover:border-slate-300 hover:shadow-xl hover:shadow-black/5' 
                        : 'bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/10'
                    }`}
                    onClick={() => {
                      if (onEditMacro) {
                        onEditMacro(macro.id);
                      } else {
                        onSelectKey('UNASSIGNED');
                      }
                    }}
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start justify-between">
                        <div className={`p-2.5 rounded-2xl ${isLight ? 'bg-slate-50 text-slate-400' : 'bg-black/20 text-white/30'} group-hover:scale-110 transition-transform duration-500`}>
                          <Zap size={16} />
                        </div>
                        <button 
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (window.confirm(`Voulez-vous vraiment supprimer la macro "${macro.name}" ?`)) {
                              await deleteMacro(macro.id);
                            }
                          }}
                          className={`p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 ${isLight ? 'hover:bg-red-50 text-slate-300 hover:text-red-500' : 'hover:bg-red-500/20 text-white/20 hover:text-red-400'}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      
                      <div className="space-y-1">
                        <h4 className={`text-xs font-bold truncate ${isLight ? 'text-slate-700' : 'text-white/80'}`}>
                          {macro.name}
                        </h4>
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${isLight ? 'bg-slate-100 text-slate-400' : 'bg-white/5 text-white/20'}`}>
                            {macro.actions.length} Actions
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Drag indicator hint */}
                    <div className={`absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${isLight ? 'text-slate-200' : 'text-white/5'}`}>
                      <LayoutGrid size={12} />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Dashboard;
