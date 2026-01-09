
import React, { useState, useEffect, useRef } from 'react';
import { X, Minus, Square, Terminal, Globe, FileText, Cpu, Mail, Users, Smartphone, Maximize2 } from 'lucide-react';
import { SystemApp } from '../types';

interface SystemWindowProps {
  app: SystemApp;
  onClose: (id: string) => void;
  children: React.ReactNode;
}

const SystemWindow: React.FC<SystemWindowProps> = ({ app, onClose, children }) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [position, setPosition] = useState({ x: 100 + Math.floor(Math.random() * 50), y: 100 + Math.floor(Math.random() * 50) });
  const [size, setSize] = useState({ width: 600, height: 400 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  
  const dragStart = useRef({ x: 0, y: 0 });
  const resizeStart = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const windowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Basic boundary check on mount to prevent spawning off-screen
    const maxX = window.innerWidth - size.width;
    const maxY = window.innerHeight - size.height;
    if (position.x > maxX) setPosition(p => ({ ...p, x: Math.max(0, maxX) }));
    if (position.y > maxY) setPosition(p => ({ ...p, y: Math.max(0, maxY) }));
  }, []);

  const getIcon = () => {
    switch (app.type) {
      case 'terminal': return <Terminal size={16} className="text-green-400" />;
      case 'browser': return <Globe size={16} className="text-blue-400" />;
      case 'editor': return <FileText size={16} className="text-yellow-400" />;
      case 'mail': return <Mail size={16} className="text-red-400" />;
      case 'agents': return <Users size={16} className="text-purple-400" />;
      case 'device_link': return <Smartphone size={16} className="text-emerald-400" />;
      default: return <Cpu size={16} />;
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMaximized) return;
    // Only start drag if clicking the title bar area
    setIsDragging(true);
    dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    resizeStart.current = { x: e.clientX, y: e.clientY, width: size.width, height: size.height };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragStart.current.x,
          y: e.clientY - dragStart.current.y
        });
      }
      if (isResizing) {
        setSize({
          width: Math.max(300, resizeStart.current.width + (e.clientX - resizeStart.current.x)),
          height: Math.max(200, resizeStart.current.height + (e.clientY - resizeStart.current.y))
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing]);

  if (!app.isOpen) return null;

  // Dynamic Styles
  const windowStyle: React.CSSProperties = isMaximized
    ? {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 50,
      }
    : {
        position: 'fixed',
        top: position.y,
        left: position.x,
        width: size.width,
        height: size.height,
        zIndex: 40,
      };

  return (
    <div 
      ref={windowRef}
      style={windowStyle}
      className="bg-slate-900/90 backdrop-blur-md border border-slate-700/50 rounded-xl shadow-2xl overflow-hidden flex flex-col animate-pulse-fast-enter transition-shadow duration-150 ring-1 ring-white/10"
    >
      {/* Title Bar */}
      <div 
        onMouseDown={handleMouseDown}
        className={`bg-slate-800/80 p-2 flex items-center justify-between border-b border-slate-700/50 select-none ${!isMaximized ? 'cursor-grab active:cursor-grabbing' : ''}`}
      >
        <div className="flex items-center gap-2 text-slate-200 text-xs font-semibold pl-2 tracking-wide pointer-events-none">
          {getIcon()}
          <span>{app.name}</span>
        </div>
        <div className="flex items-center gap-1.5" onMouseDown={(e) => e.stopPropagation()}>
          <button className="p-1 hover:bg-slate-700 rounded-full text-slate-500 hover:text-slate-300"><Minus size={12} /></button>
          <button 
            onClick={() => setIsMaximized(!isMaximized)}
            className="p-1 hover:bg-slate-700 rounded-full text-slate-500 hover:text-slate-300"
          >
            {isMaximized ? <Minus size={12} className="rotate-45" /> : <Square size={12} />}
          </button>
          <button onClick={() => onClose(app.id)} className="p-1 hover:bg-red-500/20 hover:text-red-400 rounded-full text-slate-500 transition-colors">
            <X size={12} />
          </button>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-auto p-4 font-mono text-sm bg-black/20 text-slate-300 relative">
        {children}
        
        {/* Resize Handle */}
        {!isMaximized && (
            <div 
                onMouseDown={handleResizeMouseDown}
                className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize flex items-center justify-center z-20 hover:bg-white/10 rounded-tl"
            >
                <div className="w-2 h-2 border-r-2 border-b-2 border-slate-500/50"></div>
            </div>
        )}
      </div>
    </div>
  );
};

export default SystemWindow;
