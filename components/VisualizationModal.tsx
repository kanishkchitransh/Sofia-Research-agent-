import React from 'react';
import { X, Box, Network } from 'lucide-react';

interface VisualizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'protein' | 'tree' | 'none';
  query: string;
}

export const VisualizationModal: React.FC<VisualizationModalProps> = ({ isOpen, onClose, type, query }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white border border-slate-200 w-full max-w-4xl h-[80vh] rounded-2xl overflow-hidden shadow-2xl shadow-slate-300/50 flex flex-col relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-white/80 hover:bg-white rounded-full text-slate-400 hover:text-slate-800 transition-colors border border-slate-200 shadow-sm"
        >
          <X size={20} />
        </button>

        <div className="p-6 border-b border-slate-100 bg-white">
           <div className="flex items-center gap-3">
             <div className="p-2 bg-primary-50 rounded-lg text-primary-600">
               {type === 'protein' ? <Box size={24} /> : <Network size={24} />}
             </div>
             <div>
               <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                 {type === 'protein' ? '3D Macromolecular Structure' : 'Universal Dependency Tree'}
               </h2>
               <p className="text-sm text-slate-500 font-mono">
                 Visualizing: <span className="text-primary-600">{query}</span>
               </p>
             </div>
           </div>
        </div>

        <div className="flex-1 bg-slate-50 relative flex items-center justify-center overflow-hidden">
          {type === 'protein' ? (
             <div className="relative w-64 h-64">
               {/* Simulated 3D Protein structure using CSS animations */}
               <div className="absolute inset-0 border-4 border-primary-400/30 rounded-full animate-spin-slow" style={{ transform: 'rotateX(60deg)' }}></div>
               <div className="absolute inset-4 border-4 border-blue-400/30 rounded-full animate-spin-slow" style={{ animationDirection: 'reverse', transform: 'rotateY(60deg)' }}></div>
               <div className="absolute inset-8 border-4 border-indigo-400/30 rounded-full animate-pulse-slow"></div>
               <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-primary-600 font-mono text-xs text-center font-bold">
                 RENDERING<br/>PDB: 1UBQ
               </div>
             </div>
          ) : (
            <div className="w-full h-full p-8 flex items-center justify-center">
               {/* Simulated Tree */}
               <svg className="w-full h-full text-slate-400" viewBox="0 0 400 200">
                 <line x1="200" y1="20" x2="100" y2="100" stroke="currentColor" strokeWidth="2" />
                 <line x1="200" y1="20" x2="300" y2="100" stroke="currentColor" strokeWidth="2" />
                 <line x1="100" y1="100" x2="50" y2="180" stroke="currentColor" strokeWidth="2" />
                 <line x1="100" y1="100" x2="150" y2="180" stroke="currentColor" strokeWidth="2" />
                 
                 <circle cx="200" cy="20" r="15" fill="#ffffff" stroke="#3b82f6" strokeWidth="2" />
                 <text x="200" y="25" textAnchor="middle" fill="#334155" fontSize="10" fontWeight="bold">ROOT</text>

                 <circle cx="100" cy="100" r="15" fill="#ffffff" stroke="#3b82f6" strokeWidth="2" />
                 <text x="100" y="105" textAnchor="middle" fill="#334155" fontSize="10" fontWeight="bold">nsubj</text>

                 <circle cx="300" cy="100" r="15" fill="#ffffff" stroke="#3b82f6" strokeWidth="2" />
                 <text x="300" y="105" textAnchor="middle" fill="#334155" fontSize="10" fontWeight="bold">obj</text>
               </svg>
            </div>
          )}
          <div className="absolute bottom-4 left-4 bg-white/80 backdrop-blur px-3 py-1 rounded text-xs text-slate-500 font-mono border border-slate-200 shadow-sm">
             INTERACTIVE MODE: ENABLED
          </div>
        </div>
      </div>
    </div>
  );
};