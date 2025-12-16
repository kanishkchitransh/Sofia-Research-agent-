
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Paper, Message, AgentMode, AuthorProfile, GraphCluster, Insight } from './types';
import { geminiService } from './services/geminiService';
import { PDFViewer } from './components/PDFViewer';
import { ChatInterface } from './components/ChatInterface';
import { AuthorPanel } from './components/AuthorPanel';
import { VisualizationModal } from './components/VisualizationModal';
import { ImageZoomModal } from './components/ImageZoomModal';
import { 
  Book, 
  Layers, 
  Menu, 
  Settings, 
  ShieldCheck, 
  Github,
  Plus,
  Share2,
  Users,
  Copy,
  Check,
  BrainCircuit,
  X,
  FileText,
  Trash2,
  Calendar,
  Network,
  Cpu,
  Eye,
  MessageSquareText,
  Activity,
  Loader2,
  Sparkles,
  Lightbulb,
  CornerDownRight,
  Star,
  Search
} from 'lucide-react';

// Helper to convert File to Base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};

// Helper to extract first page text from PDF (for metadata)
const extractPdfText = async (blobUrl: string): Promise<string> => {
    const pdfjs = (window as any).pdfjsLib;
    if (!pdfjs) return '';
    try {
        const loadingTask = pdfjs.getDocument(blobUrl);
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1); // First page only
        const textContent = await page.getTextContent();
        return textContent.items.map((item: any) => item.str).join(' ');
    } catch (e) {
        console.error("Text extraction failed", e);
        return '';
    }
};

// Internal Component: Corpus View
const CorpusView = ({ papers, onSelect, onDelete }: { papers: Paper[], onSelect: (id: string) => void, onDelete: (id: string) => void }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Updated filter: Includes Author Name check
  const filteredPapers = papers.filter(p => 
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.authors.some(author => author.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex flex-col h-full bg-slate-50">
       <div className="p-4 border-b border-slate-200 bg-white">
         <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
           <Book className="text-primary-600" size={20} /> My Corpus
         </h2>
         <p className="text-xs text-slate-500 mt-1">{papers.length} paper{papers.length !== 1 ? 's' : ''} uploaded</p>
         
         {/* Search Bar */}
         <div className="mt-3 relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
             <input 
                type="text" 
                placeholder="Search by title or author..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary-400 focus:bg-white transition-all"
             />
         </div>
       </div>
       <div className="flex-1 overflow-y-auto p-4 space-y-3">
         {filteredPapers.length === 0 ? (
           <div className="text-center py-10 text-slate-400">
             {searchTerm ? <p>No matches found.</p> : <p>No papers uploaded yet.</p>}
           </div>
         ) : (
           filteredPapers.map(p => (
             <div key={p.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
               <div className="flex justify-between items-start mb-2">
                 <div className="p-2 bg-primary-50 rounded-lg">
                   <FileText size={20} className="text-primary-600" />
                 </div>
                 <button onClick={(e) => { e.stopPropagation(); onDelete(p.id); }} className="text-slate-300 hover:text-red-500 transition-colors p-1">
                   <Trash2 size={16} />
                 </button>
               </div>
               <h3 className="font-semibold text-slate-800 text-sm mb-2 line-clamp-2 leading-snug">{p.title}</h3>
               {/* Display Authors */}
               {p.authors.length > 0 && (
                   <p className="text-xs text-slate-500 mb-2 truncate">
                       {p.authors.join(', ')}
                   </p>
               )}
               <div className="flex items-center gap-2 text-[10px] text-slate-400 mb-3">
                 <Calendar size={12} />
                 <span>{p.uploadDate.toLocaleDateString()}</span>
               </div>
               <button 
                 onClick={() => onSelect(p.id)}
                 className="w-full py-2 bg-slate-50 hover:bg-primary-50 text-slate-600 hover:text-primary-700 text-xs font-medium rounded-lg border border-slate-200 hover:border-primary-200 transition-colors"
               >
                 View Paper
               </button>
             </div>
           ))
         )}
       </div>
    </div>
  );
};

// Internal Component: Insights View
const InsightsView = ({ insights, onAdd, onDelete }: { insights: Insight[], onAdd: (text: string) => void, onDelete: (id: string) => void }) => {
    const [newInsight, setNewInsight] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(newInsight.trim()) {
            onAdd(newInsight.trim());
            setNewInsight('');
        }
    }

    return (
        <div className="flex flex-col h-full bg-slate-50">
            <div className="p-4 border-b border-slate-200 bg-white">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Lightbulb className="text-yellow-500" size={20} /> Research Insights
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                    Thoughts stored here are remembered by Sofia during chats.
                </p>
            </div>

            <div className="p-4 border-b border-slate-200 bg-yellow-50/50">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <input 
                        type="text" 
                        value={newInsight}
                        onChange={(e) => setNewInsight(e.target.value)}
                        placeholder="Add a new research insight..."
                        className="flex-1 text-sm p-2 rounded-lg border border-slate-200 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
                    />
                    <button type="submit" className="bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded-lg transition-colors">
                        <Plus size={18} />
                    </button>
                </form>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {insights.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 px-4">
                        <Lightbulb size={32} className="mx-auto mb-2 text-slate-300" />
                        <p className="text-sm">No insights saved yet.</p>
                        <p className="text-xs mt-1">Star messages in chat or add manual notes to build your knowledge base.</p>
                    </div>
                ) : (
                    insights.map(insight => (
                        <div key={insight.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative group">
                             <button onClick={() => onDelete(insight.id)} className="absolute top-2 right-2 text-slate-300 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2 size={14} />
                             </button>
                             <div className="flex items-start gap-2 mb-2">
                                {insight.source === 'chat_response' ? (
                                    <Sparkles size={14} className="text-primary-500 mt-0.5 shrink-0" />
                                ) : (
                                    <Lightbulb size={14} className="text-yellow-500 mt-0.5 shrink-0" />
                                )}
                                <p className="text-sm text-slate-700 leading-relaxed font-medium">
                                    {insight.content}
                                </p>
                             </div>
                             <div className="flex justify-between items-center mt-2 pl-6">
                                <span className="text-[10px] text-slate-400 font-mono">
                                    {insight.date.toLocaleDateString()}
                                </span>
                                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-300">
                                    {insight.source === 'manual' ? 'MANUAL' : 'AI GENERATED'}
                                </span>
                             </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}

// --- KNOWLEDGE GRAPH COMPONENT ---
const getCategoryIcon = (cat: string) => {
  const c = cat.toLowerCase();
  if(c.includes('vision') || c.includes('image')) return <Eye size={18} />;
  if(c.includes('language') || c.includes('nlp') || c.includes('text')) return <MessageSquareText size={18} />;
  if(c.includes('audio') || c.includes('speech')) return <Activity size={18} />;
  if(c.includes('agent') || c.includes('robot')) return <BrainCircuit size={18} />;
  return <Cpu size={18} />;
};

const KnowledgeGraphModal = ({ isOpen, onClose, papers }: { isOpen: boolean, onClose: () => void, papers: Paper[] }) => {
  const [clusters, setClusters] = useState<GraphCluster[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatedForCount, setGeneratedForCount] = useState(0);

  // Generate Graph logic
  useEffect(() => {
    if (isOpen && papers.length > 0 && papers.length !== generatedForCount) {
        setLoading(true);
        geminiService.generateKnowledgeGraph(papers).then(result => {
            setClusters(result);
            setGeneratedForCount(papers.length);
            setLoading(false);
        });
    }
  }, [isOpen, papers.length]);

  if (!isOpen) return null;

  // Layout Constants (Percentages)
  const CENTER_X = 50; 
  const CENTER_Y = 50;
  const TOPIC_RADIUS = 28; // Distance from center to Topic Node
  const PAPER_RADIUS = 12; // Distance from Topic Node to Paper

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
       <div className="bg-white w-[90vw] h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col relative border border-slate-200 animate-in zoom-in-95 duration-200">
           
           {/* Header */}
           <div className="p-4 border-b border-slate-200 bg-white flex justify-between items-center z-20 shadow-sm">
             <div>
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Layers className="text-primary-600" size={24} /> Semantic Knowledge Graph
                </h2>
                <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                    {loading ? (
                        <>
                           <Loader2 size={12} className="animate-spin" />
                           Analyzing semantic connections...
                        </>
                    ) : (
                        `Visualizing ${clusters.length} semantic clusters from ${papers.length} papers`
                    )}
                </p>
             </div>
             <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 transition-colors">
                <X size={24} />
             </button>
           </div>
           
           {/* Graph Canvas */}
           <div className="flex-1 relative bg-slate-50 overflow-hidden select-none">
              {/* Background Grid */}
              <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
              
              {papers.length === 0 ? (
                 <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                     <Layers size={48} className="text-slate-300 mb-2" />
                     <p>Upload papers to visualize connections</p>
                 </div>
              ) : loading ? (
                 <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 gap-4">
                     <div className="relative">
                        <div className="w-16 h-16 border-4 border-slate-200 border-t-primary-500 rounded-full animate-spin"></div>
                        <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary-500 animate-pulse" size={24} />
                     </div>
                     <p className="font-mono text-sm">Clustering Research Topics via Gemini...</p>
                 </div>
              ) : (
                <div className="absolute inset-0 w-full h-full">
                  {/* SVG LAYER FOR LINES (Drawn first so they are behind nodes) */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                    {/* Draw Lines from Center to Topics */}
                    {clusters.map((cluster, i) => {
                      const angle = (i / clusters.length) * 2 * Math.PI;
                      const topicX = 50 + (Math.cos(angle) * TOPIC_RADIUS);
                      const topicY = 50 + (Math.sin(angle) * TOPIC_RADIUS);
                      
                      return (
                        <g key={`lines-${cluster.topic}`}>
                          {/* Center to Topic Line */}
                          <line 
                            x1="50%" y1="50%" 
                            x2={`${topicX}%`} y2={`${topicY}%`} 
                            stroke="#cbd5e1" 
                            strokeWidth="2" 
                            strokeDasharray="4 4"
                          />
                          
                          {/* Topic to Paper Lines */}
                          {cluster.paperIds.map((pid, j) => {
                            const subAngle = (j / cluster.paperIds.length) * 2 * Math.PI;
                            const paperX = topicX + (Math.cos(subAngle) * PAPER_RADIUS * 0.8);
                            const paperY = topicY + (Math.sin(subAngle) * PAPER_RADIUS);
                            
                            // Ensure paper exists in current corpus
                            if(!papers.find(p => p.id === pid)) return null;

                            return (
                              <line 
                                key={`line-${pid}`}
                                x1={`${topicX}%`} y1={`${topicY}%`}
                                x2={`${paperX}%`} y2={`${paperY}%`}
                                stroke="#e2e8f0"
                                strokeWidth="1"
                              />
                            );
                          })}
                        </g>
                      );
                    })}
                  </svg>

                  {/* HTML LAYER FOR NODES (Interactivity) */}
                  
                  {/* 1. Center Node (The Sun) */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                      <div className="w-24 h-24 bg-white rounded-full flex flex-col items-center justify-center shadow-[0_0_40px_rgba(37,99,235,0.2)] border-4 border-slate-100 group relative cursor-default">
                         <div className="p-3 bg-primary-50 rounded-full text-primary-600 mb-1 group-hover:scale-110 transition-transform">
                            <Network size={32} />
                         </div>
                         <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Corpus</span>
                      </div>
                   </div>

                   {/* 2. Topic Nodes & Paper Nodes */}
                   {clusters.map((cluster, i) => {
                      const angle = (i / clusters.length) * 2 * Math.PI;
                      const topicX = 50 + (Math.cos(angle) * TOPIC_RADIUS); // Percent
                      const topicY = 50 + (Math.sin(angle) * TOPIC_RADIUS); // Percent

                      return (
                        <React.Fragment key={cluster.topic}>
                          {/* Topic Node (Planet) */}
                          <div 
                            className="absolute z-20 flex flex-col items-center group pointer-events-none hover:z-[60]"
                            style={{ left: `${topicX}%`, top: `${topicY}%`, transform: 'translate(-50%, -50%)' }}
                          >
                            <div className="w-16 h-16 bg-white rounded-full border-2 border-primary-200 shadow-lg flex items-center justify-center text-primary-600 z-10 hover:border-primary-500 transition-colors cursor-pointer pointer-events-auto">
                              {getCategoryIcon(cluster.topic)}
                            </div>
                            {/* FIXED LABEL: Z-index adjusted, solid background, shadow */}
                            <div className="absolute top-full mt-2 bg-white/95 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 shadow-md whitespace-nowrap z-50 pointer-events-auto">
                              {cluster.topic}
                            </div>
                          </div>

                          {/* Paper Nodes (Moons) */}
                          {cluster.paperIds.map((pid, j) => {
                             const p = papers.find(pp => pp.id === pid);
                             if (!p) return null;

                             const subAngle = (j / cluster.paperIds.length) * 2 * Math.PI;
                             const paperX = topicX + (Math.cos(subAngle) * PAPER_RADIUS * 0.8); 
                             const paperY = topicY + (Math.sin(subAngle) * PAPER_RADIUS);

                             return (
                               <div
                                 key={p.id}
                                 className="absolute group z-30"
                                 style={{ left: `${paperX}%`, top: `${paperY}%`, transform: 'translate(-50%, -50%)' }}
                               >
                                  {/* Node Dot */}
                                  <div className="w-4 h-4 bg-white border-2 border-slate-300 rounded-full hover:bg-primary-500 hover:border-primary-500 hover:scale-125 transition-all shadow-sm cursor-pointer relative"></div>
                                  
                                  {/* Tooltip Card - Improved z-index */}
                                  <div className="absolute top-6 left-1/2 -translate-x-1/2 w-48 bg-white p-3 rounded-lg shadow-xl border border-slate-100 opacity-0 group-hover:opacity-100 pointer-events-none transition-all scale-95 group-hover:scale-100 origin-top z-50">
                                    <h4 className="text-xs font-bold text-slate-800 leading-snug mb-1">{p.title}</h4>
                                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                      <Calendar size={10} /> {p.uploadDate.toLocaleDateString()}
                                    </div>
                                  </div>
                               </div>
                             );
                          })}
                        </React.Fragment>
                      );
                   })}
                </div>
              )}
           </div>
       </div>
    </div>
  );
};

const App: React.FC = () => {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [activePaperId, setActivePaperId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'system',
      content: "Hello, Researcher. I am Sofia. I'm ready to assist with your literature review, gap analysis, and citation intelligence.",
      timestamp: new Date()
    }
  ]);
  const [insights, setInsights] = useState<Insight[]>([]); // New Insights State

  const [activeMode, setActiveMode] = useState<AgentMode>(AgentMode.CHAT);
  const [isProcessing, setIsProcessing] = useState(false);
  const [authorProfile, setAuthorProfile] = useState<AuthorProfile | null>(null);
  const [isAuthorLoading, setIsAuthorLoading] = useState(false);
  
  // Sidebar State
  const [activeTab, setActiveTab] = useState<'chat' | 'corpus' | 'insights'>('chat'); // Added 'insights'
  const [showGraphModal, setShowGraphModal] = useState(false); 

  // Request tracking for cancellation
  const activeRequestRef = useRef<string | null>(null);
  
  // Collaboration State
  const [showShareModal, setShowShareModal] = useState(false);
  
  // Sidebar/Split Pane State
  const [sidebarWidth, setSidebarWidth] = useState(35); 
  const [isResizing, setIsResizing] = useState(false);
  
  // Viz State
  const [vizOpen, setVizOpen] = useState(false);
  const [vizType, setVizType] = useState<'protein' | 'tree' | 'none'>('none');
  const [vizQuery, setVizQuery] = useState('');

  // Enhanced Image Zoom State (Global) - Now an Array
  const [zoomImages, setZoomImages] = useState<{src: string, alt: string}[]>([]);

  // Extended Thinking State
  const [useExtendedThinking, setUseExtendedThinking] = useState(false);
  
  const activePaper = papers.find(p => p.id === activePaperId) || null;

  const startResizing = useCallback(() => setIsResizing(true), []);
  const stopResizing = useCallback(() => setIsResizing(false), []);
  const resize = useCallback((e: MouseEvent) => {
    if (isResizing) {
      const newWidth = (e.clientX / window.innerWidth) * 100;
      if (newWidth > 20 && newWidth < 80) setSidebarWidth(newWidth);
    }
  }, [isResizing]);

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing]);

  // UPDATED: handleUpload now extracts metadata (Author/Title) using LLM
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsProcessing(true); // Indicate processing during upload/metadata extraction
      
      const newPapers: Paper[] = [];
      const files = Array.from(e.target.files) as File[];
      
      // Notify user of processing
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'system',
        content: `Uploading and analyzing ${files.length} paper(s) for metadata (Authors/Titles)...`,
        timestamp: new Date()
      }]);

      for (const file of files) {
        const base64Data = await fileToBase64(file);
        const url = URL.createObjectURL(file);
        
        // Extract Text for Metadata Analysis
        const firstPageText = await extractPdfText(url);
        
        // Call Service to identify Title and Authors
        const metadata = await geminiService.extractPaperMetadata(firstPageText, file.name);

        newPapers.push({
          id: crypto.randomUUID(),
          title: metadata.title,
          authors: metadata.authors,
          fileName: file.name,
          uploadDate: new Date(),
          url: url,
          citations: [],
          fileData: base64Data,
          mimeType: file.type
        });
      }

      setPapers(prev => [...prev, ...newPapers]);
      if (!activePaperId && newPapers.length > 0) setActivePaperId(newPapers[0].id);
      
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'system',
        content: `Successfully added ${newPapers.length} paper(s). Authors and Titles indexed.`,
        timestamp: new Date()
      }]);
      
      setIsProcessing(false);
    }
  };

  const handleUpdatePaper = (updatedPaper: Paper) => {
    setPapers(prev => prev.map(p => p.id === updatedPaper.id ? updatedPaper : p));
  };
  
  const handleDeletePaper = (id: string) => {
    setPapers(prev => prev.filter(p => p.id !== id));
    if (activePaperId === id) setActivePaperId(null);
  };

  // Insight Handlers
  const handleAddInsight = (text: string, source: 'manual' | 'chat_response' = 'manual') => {
      const newInsight: Insight = {
          id: crypto.randomUUID(),
          content: text,
          date: new Date(),
          source: source
      };
      setInsights(prev => [newInsight, ...prev]);
      
      // If manual, stay on insights tab. If chat, just toast/notify (conceptually)
      if (source === 'chat_response') {
          // Could add a toast notification here
          console.log("Insight saved");
      }
  };

  const handleDeleteInsight = (id: string) => {
      setInsights(prev => prev.filter(i => i.id !== id));
  };

  const handleToggleStarMessage = (id: string) => {
      setMessages(prev => prev.map(msg => 
          msg.id === id ? { ...msg, isStarred: !msg.isStarred } : msg
      ));
  };

  const handleAskSofia = (text: string) => {
    setActiveTab('chat'); // Switch to chat if asking from PDF
    const citationRegex = /\[\d+\]/;
    if (citationRegex.test(text)) {
      setActiveMode(AgentMode.CITATION_ANALYSIS);
      handleSendMessage(`Analyze this citation context: "${text}"`, AgentMode.CITATION_ANALYSIS);
    } else {
      setActiveMode(AgentMode.CHAT);
      handleSendMessage(`Analyze this excerpt: "${text}"`, AgentMode.CHAT);
    }
  };

  const handleSendMessage = async (text: string, mode: AgentMode) => {
    const requestId = crypto.randomUUID();
    activeRequestRef.current = requestId;

    const newUserMsg: Message = {
      id: requestId, // Use request ID for message ID to link them loosely if needed
      role: 'user',
      content: text,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newUserMsg]);
    setIsProcessing(true);

    try {
      let responseMsg: Message;
      let usedMode = mode;

      // GLOBAL COMMAND ROUTING: Check if user wants to open/find a paper
      // This allows "Open paper X" to work from any mode (Author Intel, Gap Analysis, etc.)
      const isPaperCommand = /^(open|view|read|show|display)\s/i.test(text) && /(paper|pdf|document)/i.test(text);
      const isSearchCommand = /(search|find|list)\s.*(paper|pdf|document)/i.test(text);
      
      if ((isPaperCommand || isSearchCommand) && mode !== AgentMode.CHAT) {
          // Force switch to Chat mode so the 'openPaper' tool can be used
          usedMode = AgentMode.CHAT;
          // Optionally notify user via console or just proceed silently
      }
      
      switch (usedMode) {
        case AgentMode.RESEARCH_GAP:
          responseMsg = await geminiService.findResearchGap(text, papers);
          break;
        case AgentMode.AUTHOR_INTELLIGENCE:
          setIsAuthorLoading(true);
          const profile = await geminiService.analyzeAuthor(text);
          // Check cancellation before updating state
          if (activeRequestRef.current === requestId) {
            setAuthorProfile(profile);
            setIsAuthorLoading(false);
          }
          responseMsg = {
            id: crypto.randomUUID(),
            role: 'model',
            content: `Profile loaded for ${text}.`,
            timestamp: new Date()
          };
          break;
        case AgentMode.VISUALIZE:
           responseMsg = await geminiService.visualizeFigure(text, activePaper);
           break;
        case AgentMode.CITATION_ANALYSIS:
           const activeTitle = activePaper?.title || "current paper";
           const explanation = await geminiService.explainCitation(text, activeTitle);
           responseMsg = { id: crypto.randomUUID(), role: 'model', content: explanation, timestamp: new Date() };
           break;
        default:
          // Default Chat Mode
          const lowerText = text.toLowerCase();
          
          // Enhanced intent detection
          const isVizIntent = /(visualize|zoom|enhance|show|shoe|display|magnify|see|view|find|get|look at)/i.test(lowerText) && 
                              /(figure|fig|table|chart|graph|image)/i.test(lowerText);
          
          const isDirectFigure = /^(figure|fig\.?|table)\s*\d+/i.test(lowerText);
          
          if (isVizIntent || isDirectFigure) {
             responseMsg = await geminiService.visualizeFigure(text, activePaper);
          } else {
             // Pass INSIGHTS to Gemini Context
             responseMsg = await geminiService.sendMessage(text, papers, activePaper, insights);
          }
          break;
      }

      // Check for Open Paper Action from Model Tool Call
      if (responseMsg.data && responseMsg.data.action === 'open_paper' && responseMsg.data.paperId) {
          const pid = responseMsg.data.paperId;
          const foundPaper = papers.find(p => p.id === pid);
          if (foundPaper) {
              setActivePaperId(pid);
              responseMsg.content = `Opened **${foundPaper.title}**.`;
          } else {
              responseMsg.content = `I tried to open the paper, but could not find the ID ${pid}.`;
          }
      }

      // Only update messages if this request is still active
      if (activeRequestRef.current === requestId) {
        setMessages(prev => [...prev, responseMsg]);
      }
    } catch (error) {
      if (activeRequestRef.current === requestId) {
         setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'model', content: "Error processing request.", timestamp: new Date() }]);
      }
    } finally {
      if (activeRequestRef.current === requestId) {
        setIsProcessing(false);
        activeRequestRef.current = null;
      }
    }
  };

  const handleStop = () => {
    activeRequestRef.current = null;
    setIsProcessing(false);
    setIsAuthorLoading(false);
  };

  const handleShowImages = (images: {src: string, alt: string}[]) => {
    setZoomImages(images);
  };

  return (
    <div className={`flex h-screen w-screen bg-slate-50 text-slate-800 overflow-hidden font-sans ${isResizing ? 'cursor-col-resize select-none' : ''}`}>
      {/* Sidebar */}
      <div className="w-16 md:w-20 bg-white border-r border-slate-200 flex flex-col items-center py-6 gap-6 z-20 shadow-sm flex-shrink-0">
        <button 
          onClick={() => setActiveTab('chat')}
          className={`p-3 rounded-xl shadow-lg transition-all ${activeTab === 'chat' ? 'bg-primary-600 shadow-primary-600/30' : 'bg-white hover:bg-slate-50'}`}
        >
          <ShieldCheck className={activeTab === 'chat' ? 'text-white' : 'text-primary-600'} size={24} />
        </button>

        <nav className="flex flex-col gap-4 mt-4 w-full px-2">
          <button 
             onClick={() => setActiveTab('corpus')}
             className={`p-3 rounded-lg flex justify-center group relative transition-colors ${activeTab === 'corpus' ? 'bg-primary-50 text-primary-600' : 'hover:bg-slate-100 text-slate-400 hover:text-primary-600'}`} 
             title="My Corpus"
          >
            <Book size={20} />
            <span className="custom-tooltip">My Corpus</span>
          </button>
          
          {/* Knowledge Graph Button - Opens Modal */}
          <button 
            onClick={() => setShowGraphModal(true)}
            className={`p-3 rounded-lg flex justify-center group relative transition-colors hover:bg-slate-100 text-slate-400 hover:text-primary-600`} 
            title="Knowledge Graph"
          >
            <Layers size={20} />
            <span className="custom-tooltip">Knowledge Graph</span>
          </button>

          {/* Insights Button - New */}
          <button 
             onClick={() => setActiveTab('insights')}
             className={`p-3 rounded-lg flex justify-center group relative transition-colors ${activeTab === 'insights' ? 'bg-yellow-50 text-yellow-600' : 'hover:bg-slate-100 text-slate-400 hover:text-yellow-600'}`} 
             title="Research Insights"
          >
            <Lightbulb size={20} />
            <span className="custom-tooltip">Insights</span>
          </button>
        </nav>
        <div className="mt-auto flex flex-col gap-4">
          <button className="p-3 text-slate-400 hover:text-primary-600"><Settings size={20} /></button>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0 relative">
        <header className="h-14 bg-white/80 border-b border-slate-200 flex items-center justify-between px-6 backdrop-blur z-20 flex-shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="font-sans font-bold text-lg tracking-tight text-slate-800">Sofia</h1>
            <div className="h-4 w-px bg-slate-200 mx-2"></div>
            <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">
                {activeTab === 'chat' ? 'Research Agent' : activeTab === 'corpus' ? 'Document Manager' : 'Knowledge Insights'}
            </span>
          </div>
          <div className="flex items-center gap-4">
             {activePaper && (
               <span className="text-xs font-medium text-slate-500 bg-slate-50 px-3 py-1 rounded-full border border-slate-200 flex items-center gap-2">
                 <span className="w-1.5 h-1.5 bg-primary-500 rounded-full"></span>
                 {activePaper.fileName}
               </span>
             )}
             <button onClick={() => setShowShareModal(true)} className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-medium hover:bg-slate-800 transition-colors">
               <Share2 size={14} /> Share
             </button>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel: Switches between Chat, Corpus, and Insights */}
          <div className="flex flex-col border-r border-slate-200 bg-white relative z-10 shadow-sm" style={{ width: `${sidebarWidth}%` }}>
            {activeTab === 'chat' && (
              <>
                <ChatInterface 
                  messages={messages} 
                  onSendMessage={handleSendMessage}
                  isProcessing={isProcessing}
                  activeMode={activeMode}
                  onSetMode={setActiveMode}
                  useExtendedThinking={useExtendedThinking}
                  onSetExtendedThinking={setUseExtendedThinking}
                  onStop={handleStop}
                  onZoomImage={handleShowImages}
                  onSaveInsight={(text) => handleAddInsight(text, 'chat_response')}
                  onToggleStar={handleToggleStarMessage}
                  onViewInsights={() => setActiveTab('insights')}
                />
              </>
            )}

            {activeTab === 'corpus' && (
              <CorpusView 
                papers={papers} 
                onSelect={(id) => { setActivePaperId(id); setActiveTab('chat'); }} 
                onDelete={handleDeletePaper}
              />
            )}

            {activeTab === 'insights' && (
              <InsightsView 
                insights={insights}
                onAdd={(text) => handleAddInsight(text, 'manual')}
                onDelete={handleDeleteInsight}
              />
            )}
          </div>

          <div className="w-1.5 hover:w-2 bg-slate-200 hover:bg-primary-500 cursor-col-resize transition-all z-20 flex flex-col justify-center items-center group" onMouseDown={startResizing}>
             <div className="h-8 w-1 rounded-full bg-slate-300 group-hover:bg-primary-200"></div>
          </div>

          <div className="flex-1 bg-slate-50 p-4 overflow-hidden relative">
            {/* Paper Tabs with Tooltips */}
            <div className="absolute top-4 left-4 right-4 flex gap-2 overflow-x-visible pb-2 z-10 pl-1">
              {papers.map(p => (
                <button
                  key={p.id}
                  onClick={() => setActivePaperId(p.id)}
                  // title attribute removed to prevent default browser tooltip obstruction
                  className={`group relative px-4 py-2 rounded-t-lg text-xs font-medium border-t border-x transition-all truncate max-w-[200px] hover:overflow-visible ${
                    activePaperId === p.id 
                      ? 'bg-white border-slate-200 text-primary-600 shadow-sm z-20' 
                      : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-50 z-10'
                  }`}
                >
                  {p.title}
                  {/* Custom Tooltip */}
                  <div className="custom-tooltip">{p.fileName}</div>
                </button>
              ))}
               <label className="px-3 py-2 rounded-t-lg bg-slate-100 border border-slate-200 hover:bg-white text-slate-400 hover:text-primary-600 cursor-pointer transition-all flex items-center justify-center">
                <Plus size={14} />
                <input type="file" accept="application/pdf" className="hidden" onChange={handleUpload} />
              </label>
            </div>

            <div className="pt-10 h-full w-full">
               <PDFViewer 
                 paper={activePaper} 
                 onUpload={handleUpload} 
                 onUpdatePaper={handleUpdatePaper}
                 onAskSofia={handleAskSofia}
               />
            </div>
          </div>
        </div>
      </div>
      
      <VisualizationModal isOpen={vizOpen} onClose={() => setVizOpen(false)} type={vizType} query={vizQuery} />
      
      {/* Knowledge Graph Modal */}
      <KnowledgeGraphModal isOpen={showGraphModal} onClose={() => setShowGraphModal(false)} papers={papers} />
      
      {/* Author Intelligence Modal - MOVED HERE */}
      <AuthorPanel 
         isOpen={!!authorProfile || isAuthorLoading} 
         onClose={() => { setAuthorProfile(null); setIsAuthorLoading(false); }} 
         profile={authorProfile}
         loading={isAuthorLoading}
      />

      {/* GLOBAL IMAGE ZOOM MODAL - Handles Array */}
      <ImageZoomModal 
        isOpen={zoomImages.length > 0} 
        onClose={() => setZoomImages([])} 
        images={zoomImages}
      />
      
      {showShareModal && (
         <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={() => setShowShareModal(false)}>
            <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
               <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                 <h3 className="font-bold text-slate-800">Invite Collaborators</h3>
                 <button onClick={() => setShowShareModal(false)} className="text-slate-400"><X size={16} /></button>
               </div>
               <div className="p-6 text-center text-slate-500 text-sm">Sharing functionality placeholder</div>
            </div>
         </div>
      )}
    </div>
  );
};

export default App;
