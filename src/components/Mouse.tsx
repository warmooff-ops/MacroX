import React from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

interface MouseProps {
  selectedKey: string | null;
  onAction: (keyId: string) => void;
  onDrop: (e: React.DragEvent, keyId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  theme?: 'light' | 'dark';
}

export const MouseComponent: React.FC<MouseProps> = ({ 
  selectedKey, 
  onAction, 
  onDrop, 
  onDragOver,
  theme = 'dark' 
}) => {
  const isLight = theme === 'light';
  const isSelected = (id: string) => selectedKey === id;

  return (
    <div className={`
      flex flex-col items-center justify-center transition-all duration-500 relative
      w-[260px] h-[440px] group/mouse
    `}>
      {/* Ergonomic Mouse Design (Symmetrical Base) */}
      <div className="relative w-full h-full flex flex-col items-center">
        {/* Main Body (Symmetrical & Curved) */}
        <div className={`absolute inset-0 mx-auto w-[210px] h-[420px] rounded-[105px_105px_130px_130px] border-2 transition-colors duration-500 z-10
          ${isLight ? 'bg-white border-slate-100 shadow-xl shadow-black/5' : 'bg-[#12141a] border-white/10 shadow-[0_40px_80px_rgba(0,0,0,0.5)]'}`} 
             style={{ 
               boxShadow: isLight ? 'inset 0 2px 10px rgba(0,0,0,0.02)' : 'inset 0 4px 30px rgba(0,0,0,0.8), inset 0 2px 1px rgba(255,255,255,0.05)'
             }} />
        
        {/* Palm Area Detail */}
        <div className={`absolute bottom-[100px] left-1/2 -translate-x-1/2 w-[160px] h-[180px] rounded-full border-t opacity-10 z-15
          ${isLight ? 'border-slate-400' : 'border-white'}`} 
          style={{ clipPath: 'polygon(0% 0%, 100% 0%, 80% 100%, 20% 100%)' }} />

        {/* Top Buttons Section - Symmetrical & Integrated */}
        <div className="flex gap-1 w-[190px] h-[220px] p-1 z-20 mt-1 relative">
          {/* Left Click - Integrated within the body */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={(e) => onAction('MouseLeft')}
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, 'MouseLeft')}
            className={`flex-1 rounded-tl-[110px] rounded-bl-[10px] rounded-tr-[5px] border-r border-b transition-all duration-300 relative
              ${isSelected('MouseLeft') 
                ? 'border-primary bg-primary/20 shadow-[0_0_30px_rgba(139,92,246,0.4)]' 
                : isLight ? 'bg-slate-50 border-slate-200 hover:bg-white' : 'bg-white/5 border-white/5 hover:bg-white/10'}
            `}
          >
            <div className={`absolute bottom-8 left-8 text-[10px] font-black opacity-20 ${isLight ? 'text-slate-900' : 'text-white'}`}>L</div>
          </motion.button>

          {/* Right Click - Identical dimensions to Left Click */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={(e) => onAction('MouseRight')}
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, 'MouseRight')}
            className={`flex-1 rounded-tr-[110px] rounded-br-[10px] rounded-tl-[5px] border-l border-b transition-all duration-300 relative
              ${isSelected('MouseRight') 
                ? 'border-primary bg-primary/20 shadow-[0_0_30px_rgba(139,92,246,0.4)]' 
                : isLight ? 'bg-slate-50 border-slate-200 hover:bg-white' : 'bg-white/5 border-white/5 hover:bg-white/10'}
            `}
          >
            <div className={`absolute bottom-8 right-8 text-[10px] font-black opacity-20 ${isLight ? 'text-slate-900' : 'text-white'}`}>R</div>
          </motion.button>
        </div>

        {/* Scroll Wheel - Rugged look */}
        <div className="absolute top-[60px] left-1/2 -translate-x-1/2 z-30">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => onAction('MouseMiddle')}
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, 'MouseMiddle')}
            className={`w-14 h-32 rounded-full border-2 transition-all duration-300 flex flex-col items-center justify-start py-6 gap-3
                      ${isSelected('MouseMiddle')
                        ? 'border-primary bg-primary shadow-[0_0_20px_rgba(139,92,246,0.6)]'
                        : isLight ? 'bg-slate-200 border-slate-300' : 'bg-[#12141a] border-white/10 shadow-inner'}
                    `}
          >
            <div className={`w-3 h-14 rounded-full ${isLight ? 'bg-slate-400' : 'bg-white/20 shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]'} animate-pulse`} />
            <div className={`w-8 h-[2px] ${isLight ? 'bg-slate-300' : 'bg-white/5'}`} />
            <div className={`w-8 h-[2px] ${isLight ? 'bg-slate-300' : 'bg-white/5'}`} />
            <div className={`w-8 h-[2px] ${isLight ? 'bg-slate-300' : 'bg-white/5'}`} />
          </motion.button>
        </div>

        {/* Side Buttons (M4/M5) - Positioned OUTSIDE on the left */}
        <div className="absolute -left-[14px] top-[185px] flex flex-col gap-1 z-40">
          {['MouseForward', 'MouseBack'].map((btn, i) => (
            <motion.button
              key={btn}
              whileHover={{ scale: 1.05, x: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => onAction(btn)}
              onDragOver={onDragOver}
              onDrop={(e) => onDrop(e, btn)}
              className={`w-7 h-20 rounded-l-3xl border-y border-l transition-all duration-300 flex items-center justify-center relative
                        ${isSelected(btn)
                          ? 'border-primary bg-primary shadow-[0_0_20px_rgba(139,92,246,0.6)] z-10'
                          : isLight ? 'bg-slate-100 border-slate-200 hover:bg-white' : 'bg-[#12141a] border-white/10 hover:bg-white/5 shadow-lg'}
                        ${i === 0 ? 'rounded-tl-[40px] rounded-bl-[10px]' : 'rounded-bl-[40px] rounded-tl-[10px]'}
                      `}
            >
              <span className={`text-[10px] font-black uppercase tracking-tighter ${isSelected(btn) ? 'text-white' : isLight ? 'text-slate-400' : 'text-white/40'}`}>
                {btn === 'MouseForward' ? 'M5' : 'M4'}
              </span>
            </motion.button>
          ))}
        </div>

        {/* DPI Indicator / Logo Area */}
        <div className="absolute top-[230px] right-[80px] flex flex-col gap-1.5 z-20 opacity-40">
          <div className="w-4 h-1 bg-primary rounded-full" />
          <div className="w-3 h-1 bg-primary/60 rounded-full" />
          <div className="w-2 h-1 bg-primary/30 rounded-full" />
        </div>

        {/* Logo/Palm Area with Advanced Glow */}
        <div className="absolute bottom-[60px] left-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none">
           <motion.div 
              animate={{ 
                opacity: [0.4, 0.8, 0.4],
                scale: [1, 1.05, 1]
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className={`p-8 rounded-full transition-all duration-500 ${isLight ? 'text-slate-200' : 'text-primary/30 shadow-[0_0_60px_rgba(139,92,246,0.2)]'}`}
            >
              <Zap size={64} fill="currentColor" className={isLight ? '' : 'text-primary drop-shadow-[0_0_15px_rgba(139,92,246,0.9)]'} />
           </motion.div>
        </div>
      </div>
    </div>
  );
};

export default MouseComponent;
