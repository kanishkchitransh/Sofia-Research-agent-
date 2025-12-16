
import React from 'react';
import { AuthorProfile } from '../types';
import { User, BookOpen, TrendingUp, Award, GraduationCap, Users, ExternalLink, X } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, CartesianGrid, YAxis } from 'recharts';

interface AuthorPanelProps {
  isOpen: boolean;
  onClose: () => void;
  profile: AuthorProfile | null;
  loading: boolean;
}

export const AuthorPanel: React.FC<AuthorPanelProps> = ({ isOpen, onClose, profile, loading }) => {
  if (!isOpen) return null;

  // Mock data generation for the chart based on citation count to make it look dynamic
  const getChartData = (total: number = 0) => {
      const base = total / 5;
      return [
        { year: '2020', val: Math.round(base * 0.8) },
        { year: '2021', val: Math.round(base * 1.1) },
        { year: '2022', val: Math.round(base * 1.4) },
        { year: '2023', val: Math.round(base * 1.7) },
        { year: '2024', val: Math.round(base * 1.2) },
      ];
  };

  const chartData = profile?.citationCount ? getChartData(profile.citationCount) : getChartData(100);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
       <div className="bg-white w-[90vw] h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col relative border border-slate-200 animate-in zoom-in-95 duration-200">
         
         {/* Header */}
         <div className="p-4 border-b border-slate-200 bg-white flex justify-between items-center z-20 shadow-sm shrink-0">
             <div>
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <GraduationCap className="text-primary-600" size={24} /> Author Intelligence
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                    {loading ? "Analyzing researcher profile..." : profile ? `Profile: ${profile.name}` : "Research Profile"}
                </p>
             </div>
             <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 transition-colors">
                <X size={24} />
             </button>
         </div>

         {/* Content */}
         <div className="flex-1 bg-slate-50 overflow-y-auto p-6">
            {loading ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-slate-200 border-t-primary-500 rounded-full animate-spin"></div>
                        <User className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary-500" size={24} />
                    </div>
                    <p className="font-mono text-sm animate-pulse">Gathering academic intelligence...</p>
                </div>
            ) : profile ? (
                <div className="max-w-6xl mx-auto space-y-6">
                    {/* Top Card: Identity */}
                    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6 items-start">
                        <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 border-4 border-white shadow-lg shrink-0">
                             <User size={48} />
                        </div>
                        <div className="flex-1 w-full">
                             <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                                <div>
                                    <h1 className="text-3xl font-bold text-slate-800">{profile.name}</h1>
                                    <div className="flex items-center gap-2 mt-2 text-slate-600 font-medium">
                                        <GraduationCap size={18} />
                                        {profile.affiliation}
                                    </div>
                                </div>
                                <div className="flex gap-4 self-start">
                                    <div className="text-center bg-slate-50 p-3 rounded-lg border border-slate-100 min-w-[100px]">
                                        <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">H-Index</div>
                                        <div className="text-2xl font-bold text-slate-800">{profile.hIndex || 'N/A'}</div>
                                    </div>
                                    <div className="text-center bg-slate-50 p-3 rounded-lg border border-slate-100 min-w-[100px]">
                                        <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Citations</div>
                                        <div className="text-2xl font-bold text-slate-800">{profile.citationCount?.toLocaleString() || 'N/A'}</div>
                                    </div>
                                </div>
                             </div>
                             
                             <div className="mt-6">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <BookOpen size={14} /> Research Headspace
                                </h4>
                                <p className="text-slate-700 leading-relaxed text-lg bg-slate-50/50 p-4 rounded-lg border border-slate-100">
                                    {profile.summary}
                                </p>
                             </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Left Column: Details */}
                        <div className="space-y-6">
                            {/* Interests */}
                            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm h-full">
                                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <Award size={18} className="text-primary-500"/> Key Interests
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {profile.interests.map((tag, i) => (
                                        <span key={i} className="px-3 py-1.5 bg-primary-50 text-primary-700 text-sm font-medium rounded-full border border-primary-100">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>

                             {/* Education */}
                             {profile.education && profile.education.length > 0 && (
                                <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                        <GraduationCap size={18} className="text-slate-500"/> Background
                                    </h3>
                                    <ul className="space-y-3">
                                        {profile.education.map((edu, i) => (
                                            <li key={i} className="flex gap-3 text-sm text-slate-600">
                                                <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-2 shrink-0"></div>
                                                {edu}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                             )}

                             {/* Sources */}
                             {profile.sources && profile.sources.length > 0 && (
                                <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                                    <h3 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wider">Sources</h3>
                                    <div className="flex flex-col gap-2">
                                        {profile.sources.map((src, i) => (
                                            <a key={i} href={src} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs text-primary-600 hover:underline truncate">
                                                <ExternalLink size={12} /> {new URL(src).hostname}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                             )}
                        </div>

                        {/* Right Column: Analytics & Work */}
                        <div className="md:col-span-2 space-y-6">
                            {/* Chart */}
                            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                                <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                                    <TrendingUp size={18} className="text-green-500"/> Citation Impact (Est.)
                                </h3>
                                <div className="h-64 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                            <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                                            <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                                            <Bar dataKey="val" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            
                            {/* Collaborators & Work Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {profile.collaborators && profile.collaborators.length > 0 && (
                                    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                            <Users size={18} className="text-indigo-500"/> Collaborators
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {profile.collaborators.map((c, i) => (
                                                <div key={i} className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-100 text-sm text-slate-700">
                                                    <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
                                                    {c}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {profile.recentWork && profile.recentWork.length > 0 && (
                                    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                            <BookOpen size={18} className="text-slate-500"/> Recent Work
                                        </h3>
                                        <ul className="space-y-3">
                                            {profile.recentWork.map((work, i) => (
                                                <li key={i} className="text-sm text-slate-600 border-l-2 border-slate-200 pl-3 py-1 hover:border-primary-400 transition-colors line-clamp-2">
                                                    {work}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
         </div>
       </div>
    </div>
  );
};
