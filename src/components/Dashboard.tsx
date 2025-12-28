import React from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import DeviceMapper from './DeviceMapper';
import MouseComponent from './Mouse';

interface DashboardProps {
  activeProfile?: string;
  selectedKey: string | null;
  onSelectKey: (key: string) => void;
  onDrop?: (e: React.DragEvent, keyId: string) => void;
  theme?: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ activeProfile, selectedKey, onSelectKey, onDrop, theme }) => {
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
    <div className="flex items-center justify-center w-full h-full transform scale-[0.7] origin-center transition-transform duration-500">
      <div className="flex flex-col items-center gap-6">
        <div className={`flex-none rounded-[56px] transition-all duration-500 ${isLight ? 'bg-[#FFFFFF] shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-[#E9ECEF]' : ''}`}>
          <DeviceMapper 
            selectedKey={selectedKey} 
            onSelectKey={onSelectKey}
            onDrop={onDrop}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "copy";
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
