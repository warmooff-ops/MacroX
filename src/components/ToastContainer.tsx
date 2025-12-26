import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import { useStore, Toast } from '../store/useStore';

const ToastItem: React.FC<{ toast: Toast }> = ({ toast }) => {
  const removeNotification = useStore((state) => state.removeNotification);
  const settings = useStore((state) => state.settings);
  const isLight = settings.theme === 'light';

  const icons = {
    success: <CheckCircle className="text-green-500" size={18} />,
    error: <XCircle className="text-red-500" size={18} />,
    info: <Info className="text-blue-500" size={18} />,
  };

  const bgColors = {
    success: isLight ? 'bg-green-50' : 'bg-green-500/10',
    error: isLight ? 'bg-red-50' : 'bg-red-500/10',
    info: isLight ? 'bg-blue-50' : 'bg-blue-500/10',
  };

  const borderColors = {
    success: isLight ? 'border-green-100' : 'border-green-500/20',
    error: isLight ? 'border-red-100' : 'border-red-500/20',
    info: isLight ? 'border-blue-100' : 'border-blue-500/20',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className={`
        flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-lg backdrop-blur-md
        ${isLight ? 'bg-white/90 border-slate-100' : 'bg-[#1a1d23]/90 border-white/5'}
        min-w-[300px] pointer-events-auto
      `}
    >
      <div className={`p-2 rounded-xl ${bgColors[toast.type]} border ${borderColors[toast.type]}`}>
        {icons[toast.type]}
      </div>
      
      <div className="flex-1">
        <p className={`text-sm font-bold ${isLight ? 'text-slate-700' : 'text-white'}`}>
          {toast.message}
        </p>
      </div>

      <button
        onClick={() => removeNotification(toast.id)}
        className={`p-1 rounded-lg transition-colors ${isLight ? 'hover:bg-slate-100 text-slate-400' : 'hover:bg-white/10 text-white/40 hover:text-white'}`}
      >
        <X size={14} />
      </button>
    </motion.div>
  );
};

const ToastContainer: React.FC = () => {
  const notifications = useStore((state) => state.notifications);

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {notifications.map((toast) => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ToastContainer;
