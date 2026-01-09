
import React from 'react';
import { PersonProfile } from '../types';
import { User, Mail, Phone, Calendar, BadgeCheck, Clock, Crown } from 'lucide-react';

interface PeopleDirectoryProps {
  people: PersonProfile[];
}

const PeopleDirectory: React.FC<PeopleDirectoryProps> = ({ people }) => {
  if (people.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500 font-mono">
        <User size={48} className="mb-4 opacity-20" />
        <p>No personnel records found.</p>
        <p className="text-xs mt-2">Ask Charlie to "Scan and Register" a person.</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 custom-scrollbar">
      <h2 className="text-sm font-bold text-indigo-400 mb-4 font-mono uppercase tracking-widest border-b border-indigo-500/20 pb-2">
        Personnel Database ({people.length})
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {people.map(person => (
          <div key={person.id} className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 flex gap-4 hover:bg-slate-800 transition-colors group relative overflow-hidden">
            
            {/* Type Indicator Strip */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${person.type === 'PERMANENT' ? 'bg-emerald-500' : 'bg-yellow-500'}`}></div>

            {/* Image Avatar */}
            <div className="w-16 h-16 rounded-md overflow-hidden border border-slate-600 shrink-0 relative ml-2">
               {person.image ? (
                   <img src={person.image} alt={person.name} className="w-full h-full object-cover" />
               ) : (
                   <div className="w-full h-full bg-slate-700 flex items-center justify-center"><User size={24} className="text-slate-500"/></div>
               )}
               {/* Scan Overlay Effect */}
               <div className="absolute inset-0 bg-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
               <div className="flex items-center gap-2">
                   <h3 className="text-white font-bold text-sm truncate">{person.name}</h3>
                   {person.type === 'PERMANENT' ? <BadgeCheck size={14} className="text-emerald-500" /> : <Clock size={14} className="text-yellow-500"/>}
               </div>
               
               {person.nickname && (
                   <div className="text-[10px] font-bold text-indigo-400 flex items-center gap-1 mt-0.5">
                       <Crown size={10} /> {person.nickname.toUpperCase()}
                   </div>
               )}

               <div className="text-[10px] text-slate-400 font-mono mt-2 space-y-1">
                  <div className="flex items-center gap-2">
                     <Phone size={10} className="text-emerald-400" />
                     <span className="truncate">{person.mobile}</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <Mail size={10} className="text-blue-400" />
                     <span className="truncate">{person.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                     <Calendar size={10} />
                     <span>{new Date(person.registeredAt).toLocaleDateString()}</span>
                  </div>
               </div>
            </div>
            
            {/* Status Badge */}
            <div className={`absolute top-2 right-2 text-[8px] font-bold px-1.5 py-0.5 rounded border ${person.type === 'PERMANENT' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}`}>
                {person.type}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PeopleDirectory;
