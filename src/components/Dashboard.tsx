import React from 'react';
import DeviceMapper from './DeviceMapper';
import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Trash2, GripVertical, Plus } from 'lucide-react';

interface DashboardProps {
  selectedKey: string | null;
  onSelectKey: (key: string) => void;
  activeTriggers?: string[];
  theme?: 'light' | 'dark';
}

const Dashboard: React.FC<DashboardProps> = ({ 
  selectedKey, 
  onSelectKey, 
  activeTriggers = [], 
  theme = 'dark', 
}) => {
  const isLight = theme === 'light';
  const { bindMacroToKey, settings, macros, deleteMacro, setView, setSelectedKey, isSidebarOpen } = useStore();

  const handleKeyClick = (e: React.MouseEvent, keyId: string) => {
    e.preventDefault();
    e.stopPropagation();
    onSelectKey(keyId);
  };

  const batteryLevel = settings?.battery_level ?? 85;
  const isBatteryLow = batteryLevel < 15;
  const isBatteryCritical = batteryLevel < 10;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, keyId: string) => {
    e.preventDefault();
    const macroId = e.dataTransfer.getData("macroId");
    if (macroId && keyId) {
      await bindMacroToKey(macroId, keyId);
    }
  };

  return (
    <div className={`flex w-full h-full no-drag transition-colors duration-500 overflow-hidden ${isLight ? 'bg-slate-50' : 'bg-[#0f1115]'}`}>
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-hidden relative">
        <div className={`flex items-center justify-center w-full h-full transform transition-all duration-700 ease-in-out ${isSidebarOpen ? 'scale-[0.9] -translate-x-12' : 'scale-[1.2]'}`}>

          <div className="flex items-center gap-16">
            {/* Main Keyboard Section */}
            <div className="flex-none">
              <DeviceMapper 
                selectedKey={selectedKey}
                onSelectKey={onSelectKey}
                activeTriggers={activeTriggers}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              />
            </div>

            {/* Mouse Mapping Section - G502 Style */}
            <div className="flex-none flex flex-col items-center justify-center">
              <div 
                className="relative group"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, 'MouseButton1')}
              >
                {/* G502 Style Mouse SVG */}
                <svg width="240" height="420" viewBox="0 0 240 420" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-[0_0_50px_rgba(0,0,0,0.3)]">
                  <defs>
                    <linearGradient id="mouse-body-grad" x1="120" y1="0" x2="120" y2="420" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor={isLight ? "#ffffff" : "#1a1d23"} />
                      <stop offset="100%" stopColor={isLight ? "#f1f5f9" : "#0a0c10"} />
                    </linearGradient>
                    <filter id="g502-glow">
                      <feGaussianBlur stdDeviation="4" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>

                  {/* Main Chassis - Aggressive G502 Shape */}
                  <path 
                    d="M120 10C80 10 45 40 35 120C30 180 25 240 45 300C65 360 90 410 120 410C150 410 175 360 195 300C215 240 210 180 205 120C195 40 160 10 120 10Z" 
                    fill="url(#mouse-body-grad)" 
                    stroke={isLight ? "#e2e8f0" : "rgba(255,255,255,0.05)"}
                    strokeWidth="2"
                  />

                  {/* Left Click (MouseButton1) */}
                  <path 
                    d="M115 15C75 18 42 55 38 135L115 145V15Z" 
                    fill={selectedKey === 'MouseButton1' ? "rgba(59, 130, 246, 0.2)" : "transparent"}
                    className="cursor-pointer hover:fill-primary/10 transition-colors"
                    onClick={(e) => handleKeyClick(e, 'MouseButton1')}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, 'MouseButton1')}
                  />
                  
                  {/* Right Click (MouseButton2) */}
                  <path 
                    d="M125 15C165 18 198 55 202 135L125 145V15Z" 
                    fill={selectedKey === 'MouseButton2' ? "rgba(59, 130, 246, 0.2)" : "transparent"}
                    className="cursor-pointer hover:fill-primary/10 transition-colors"
                    onClick={(e) => handleKeyClick(e, 'MouseButton2')}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, 'MouseButton2')}
                  />

                  {/* Scroll Wheel Chassis */}
                  <rect x="105" y="60" width="30" height="70" rx="15" fill={isLight ? "#f1f5f9" : "#11141a"} stroke={isLight ? "#e2e8f0" : "rgba(255,255,255,0.1)"} strokeWidth="1" />

                  {/* Interactive Scroll Wheel (MouseButton3) */}
                  <motion.g 
                    className="cursor-pointer group/wheel"
                    onClick={(e) => handleKeyClick(e, 'MouseButton3')}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, 'MouseButton3')}
                    whileHover={{ scale: 1.05 }}
                  >
                    <rect 
                      x="110" y="65" width="20" height="60" rx="10" 
                      fill={isLight ? "#ffffff" : "#2a2f3a"}
                      stroke={selectedKey === 'MouseButton3' ? "#3b82f6" : (isLight ? "#cbd5e1" : "rgba(255,255,255,0.2)")}
                      strokeWidth="2"
                      className="transition-all duration-300 group-hover/wheel:stroke-primary"
                    />
                    {/* Wheel Grips */}
                    {[75, 85, 95, 105, 115].map(y => (
                      <line key={y} x1="114" y1={y} x2="126" y2={y} stroke={isLight ? "#e2e8f0" : "rgba(255,255,255,0.1)"} strokeWidth="2" strokeLinecap="round" />
                    ))}
                  </motion.g>

                  {/* Side Buttons - M4 & M5 */}
                  <g 
                    className="cursor-pointer" 
                    onClick={(e) => handleKeyClick(e, 'MouseButton5')}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, 'MouseButton5')}
                  >
                    <path 
                      d="M32 160L22 170V210L32 200V160Z" 
                      fill={selectedKey === 'MouseButton5' ? "#3b82f6" : (isLight ? "#cbd5e1" : "#2a2f3a")}
                      className="hover:fill-primary transition-colors"
                    />
                  </g>
                  <g 
                    className="cursor-pointer" 
                    onClick={(e) => handleKeyClick(e, 'MouseButton4')}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, 'MouseButton4')}
                  >
                    <path 
                      d="M32 215L22 225V255L32 245V215Z" 
                      fill={selectedKey === 'MouseButton4' ? "#3b82f6" : (isLight ? "#cbd5e1" : "#2a2f3a")}
                      className="hover:fill-primary transition-colors"
                    />
                  </g>

                  {/* DPI Buttons (Top) */}
                  <rect x="85" y="155" width="12" height="25" rx="4" fill={isLight ? "#e2e8f0" : "#2a2f3a"} className="cursor-pointer hover:fill-primary transition-colors" />
                  <rect x="85" y="185" width="12" height="25" rx="4" fill={isLight ? "#e2e8f0" : "#2a2f3a"} className="cursor-pointer hover:fill-primary transition-colors" />

                  {/* Thumb Rest / Sniper Button Area */}
                  <path 
                    d="M35 240C20 240 10 260 10 300C10 340 25 360 45 360" 
                    stroke={isLight ? "#e2e8f0" : "rgba(255,255,255,0.1)"} 
                    strokeWidth="2" 
                    fill="none" 
                  />
                  <circle cx="25" cy="300" r="8" fill={isLight ? "#e2e8f0" : "#2a2f3a"} className="cursor-pointer hover:fill-primary transition-colors" />

                  {/* RGB Accent Strip */}
                  <path 
                    d="M60 360C80 385 100 395 120 395C140 395 160 385 180 360" 
                    stroke="#3b82f6" 
                    strokeWidth="2" 
                    strokeLinecap="round"
                    opacity="0.6"
                    filter="url(#g502-glow)"
                  />
                </svg>

                {/* Button Indicators */}
                <div className="absolute top-[80px] -left-16 flex flex-col items-end gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                  <span className="text-[10px] font-black tracking-widest text-primary">M1</span>
                  <div className="w-12 h-px bg-primary/50" />
                </div>
                <div className="absolute top-[80px] -right-16 flex flex-col items-start gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                  <span className="text-[10px] font-black tracking-widest text-primary">M2</span>
                  <div className="w-12 h-px bg-primary/50" />
                </div>
                <div className="absolute top-[180px] -left-16 flex flex-col items-end gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                  <span className="text-[10px] font-black tracking-widest text-primary">M4/M5</span>
                  <div className="w-12 h-px bg-primary/50" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
