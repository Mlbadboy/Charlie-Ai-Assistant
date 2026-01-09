
import React from 'react';
import { Battery, Wifi, Signal, Smartphone, Bell, MessageSquare, Phone, Chrome, Camera, Instagram, Map, Music, Settings, ArrowLeft, Circle, Square } from 'lucide-react';
import { PhoneState } from '../types';

interface DeviceMirrorProps {
  state: PhoneState;
}

const DeviceMirror: React.FC<DeviceMirrorProps> = ({ state }) => {
  if (!state.connected) {
    return (
      <div 
        className="h-full flex flex-col items-center justify-center bg-slate-900 text-slate-500"
        role="status"
        aria-live="polite"
      >
        <div className="relative mb-4" aria-hidden="true">
            <Smartphone size={64} className="opacity-20" />
            <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
            </div>
        </div>
        <p className="text-xs tracking-widest font-mono">SEARCHING FOR DEVICE...</p>
        <p className="text-[10px] mt-2 text-slate-600">Ensure USB Debugging / AirPlay is active.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center justify-center p-4 bg-slate-950">
      <div 
        className="relative w-[300px] h-[600px] bg-black rounded-[3rem] border-8 border-slate-800 shadow-2xl overflow-hidden ring-1 ring-white/10"
        role="region"
        aria-label={`${state.platform} Device Mirror`}
      >
        
        {/* Notch / Dynamic Island */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-7 w-32 bg-black rounded-b-xl z-20 flex items-center justify-center" aria-hidden="true">
            <div className="w-16 h-4 bg-black rounded-full flex items-center justify-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div>
                 <div className="w-1 h-1 rounded-full bg-blue-900/50"></div>
            </div>
        </div>

        {/* Status Bar */}
        <div 
            className="absolute top-2 left-0 right-0 px-6 flex justify-between items-center z-10 text-white text-[10px] font-bold"
            role="img"
            aria-label={`Status bar. 9:41 AM. Battery ${state.batteryLevel} percent.`}
        >
            <span aria-hidden="true">9:41</span>
            <div className="flex gap-1.5 items-center">
                <Signal size={10} aria-label="Signal Strength" />
                <Wifi size={10} aria-label="WiFi Connected" />
                <Battery size={10} fill={state.batteryLevel > 20 ? "white" : "red"} aria-label={`${state.batteryLevel}% Battery`} />
            </div>
        </div>

        {/* Screen Content */}
        <div className="w-full h-full bg-cover bg-center pt-10 pb-16 px-4 relative" style={{ backgroundImage: 'linear-gradient(to bottom, #1e1b4b, #312e81)' }}>
            
            {state.screen === 'LOCK' && (
                <div className="h-full flex flex-col items-center pt-12 text-white">
                    <div className="text-6xl font-thin tracking-tighter" aria-label="Time 09:41">09:41</div>
                    <div className="text-sm font-medium mt-2 opacity-80">Wednesday, October 25</div>
                    
                    <div className="mt-8 space-y-2 w-full px-2" role="list" aria-label="Notifications">
                        {state.notifications.map((notif, i) => (
                            <div key={i} className="bg-white/20 backdrop-blur-md p-3 rounded-xl text-xs flex gap-3 items-start" role="listitem" tabIndex={0}>
                                <div className="bg-white p-1 rounded text-black" aria-hidden="true"><MessageSquare size={10}/></div>
                                <div>
                                    <div className="font-bold">New Message</div>
                                    <div className="opacity-80">{notif}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <div className="mt-auto mb-8 flex gap-12 text-white/50">
                        <button className="p-3 bg-white/10 rounded-full backdrop-blur-md hover:bg-white/20 focus:ring-2 focus:ring-white transition-all" aria-label="Open Camera"><Camera size={20} /></button>
                        <button className="p-3 bg-white/10 rounded-full backdrop-blur-md hover:bg-white/20 focus:ring-2 focus:ring-white transition-all" aria-label="Open Phone"><Smartphone size={20} /></button>
                    </div>
                </div>
            )}

            {state.screen === 'HOME' && (
                <div className="h-full flex flex-col">
                    {/* App Grid */}
                    <div className="grid grid-cols-4 gap-4 mt-4" role="grid" aria-label="Applications">
                        <AppIcon icon={<MessageSquare size={20}/>} name="Chat" color="bg-green-500" />
                        <AppIcon icon={<Chrome size={20}/>} name="Browser" color="bg-blue-500" />
                        <AppIcon icon={<Camera size={20}/>} name="Camera" color="bg-slate-700" />
                        <AppIcon icon={<Map size={20}/>} name="Maps" color="bg-green-600" />
                        <AppIcon icon={<Instagram size={20}/>} name="Social" color="bg-pink-600" />
                        <AppIcon icon={<Music size={20}/>} name="Music" color="bg-red-500" />
                        <AppIcon icon={<Settings size={20}/>} name="Settings" color="bg-slate-500" />
                        <AppIcon icon={<Bell size={20}/>} name="Clock" color="bg-black" />
                    </div>

                    {/* Dock */}
                    <div className="mt-auto bg-white/10 backdrop-blur-xl rounded-[2rem] p-3 flex justify-around items-center mb-2" role="region" aria-label="Dock">
                        <AppIcon icon={<Phone size={24}/>} color="bg-green-500" name="Phone" />
                        <AppIcon icon={<Chrome size={24}/>} color="bg-blue-500" name="Browser" />
                        <AppIcon icon={<MessageSquare size={24}/>} color="bg-green-500" name="Messages" />
                        <AppIcon icon={<Music size={24}/>} color="bg-red-500" name="Music" />
                    </div>
                </div>
            )}

            {state.screen === 'APP_OPEN' && (
                 <div className="h-full bg-white rounded-xl overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-300" role="application" aria-label={state.currentApp}>
                      {/* Fake App Header */}
                      <div className="h-12 bg-slate-100 border-b flex items-center px-4 gap-4">
                          <button className="p-1 hover:bg-slate-200 rounded-full transition-colors" aria-label="Back"><ArrowLeft size={16} className="text-slate-500" /></button>
                          <span className="font-bold text-slate-800 text-sm">{state.currentApp || 'Application'}</span>
                      </div>
                      <div className="flex-1 p-4 bg-slate-50" aria-busy="true" aria-label="Loading content">
                          <div className="w-full h-32 bg-slate-200 rounded-lg animate-pulse mb-4"></div>
                          <div className="w-3/4 h-4 bg-slate-200 rounded animate-pulse mb-2"></div>
                          <div className="w-1/2 h-4 bg-slate-200 rounded animate-pulse mb-2"></div>
                          <div className="w-full h-4 bg-slate-200 rounded animate-pulse mb-2"></div>
                      </div>
                 </div>
            )}
        </div>

        {/* Home Bar (iOS style) or Nav Buttons (Android style) */}
        <div className="absolute bottom-1 left-0 right-0 h-6 z-20 flex justify-center items-center" role="navigation" aria-label="System Navigation">
             {state.platform === 'IOS' ? (
                 <button className="w-32 h-1 bg-white rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-white transition-all" aria-label="Home"></button>
             ) : (
                 <div className="flex gap-8 text-white/50">
                     <button className="p-1 hover:text-white focus:text-white transition-colors" aria-label="Back"><ArrowLeft size={14} /></button>
                     <button className="p-1 hover:text-white focus:text-white transition-colors" aria-label="Home"><Circle size={12} fill="rgba(255,255,255,0.2)" /></button>
                     <button className="p-1 hover:text-white focus:text-white transition-colors" aria-label="Overview"><Square size={12} /></button>
                 </div>
             )}
        </div>
      </div>
      
      <div className="mt-4 flex gap-4 text-xs font-mono text-slate-500">
         <span className="flex items-center gap-2" aria-label={`Platform: ${state.platform} Linked`}><Smartphone size={14} /> {state.platform} LINKED</span>
         <span className="flex items-center gap-2 text-emerald-400" aria-label="Debug Bridge Connected via WiFi"><Wifi size={14} /> ADB_WIFI_TCPIP</span>
      </div>
    </div>
  );
};

const AppIcon = ({ icon, name, color }: { icon: any, name?: string, color: string }) => (
    <button 
        className="flex flex-col items-center gap-1 group focus:outline-none"
        aria-label={name ? `Open ${name}` : 'Open App'}
    >
        <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center text-white shadow-lg group-hover:scale-105 group-focus:ring-2 group-focus:ring-white/50 transition-all`} aria-hidden="true">
            {icon}
        </div>
        {name && <span className="text-[9px] text-white font-medium group-hover:text-white/80">{name}</span>}
    </button>
);

export default DeviceMirror;
