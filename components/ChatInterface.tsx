
import React, { useState, useRef, useEffect } from 'react';
import { Message, AgentMode } from '../types';
import { Send, Sparkles, BrainCircuit, ExternalLink, Box, ToggleLeft, ToggleRight, Square, ZoomIn, Star, Lightbulb, Check, GraduationCap } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (text: string, mode: AgentMode) => void;
  isProcessing: boolean;
  activeMode: AgentMode;
  onSetMode: (mode: AgentMode) => void;
  useExtendedThinking?: boolean;
  onSetExtendedThinking?: (enabled: boolean) => void;
  onStop?: () => void;
  onZoomImage?: (images: {src: string, alt: string}[]) => void;
  onSaveInsight: (text: string) => void;
  onToggleStar: (messageId: string) => void;
  onViewInsights: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, 
  onSendMessage, 
  isProcessing,
  activeMode,
  onSetMode,
  useExtendedThinking = false,
  onSetExtendedThinking,
  onStop,
  onZoomImage,
  onSaveInsight,
  onToggleStar,
  onViewInsights
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastOpenedVizId = useRef<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
    // Auto-open visualization if the last message is a NEW visualization
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.role === 'model' && lastMsg?.type === 'visualization' && lastMsg.id !== lastOpenedVizId.current) {
       lastOpenedVizId.current = lastMsg.id;
       
       // Detect ALL images in the message
       const matches = [...lastMsg.content.matchAll(/!\[(.*?)\]\((data:.*?)\)/g)];
       
       if (matches.length > 0 && onZoomImage) {
           const images = matches.map(m => ({
               alt: m[1] || 'Figure',
               src: m[2]
           }));
           onZoomImage(images);
       }
    }
  }, [messages, onZoomImage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) {
      if (onStop) onStop();
      return;
    }
    if (!input.trim()) return;
    onSendMessage(input, activeMode);
    setInput('');
  };

  // Allow data: URLs for images (needed for base64 visualizations)
  const urlTransform = (url: string) => {
    if (url.startsWith('data:') || url.startsWith('http')) {
      return url;
    }
    return url;
  };

  const ModeButton = ({ mode, icon: Icon, label }: { mode: AgentMode, icon: any, label: string }) => (
    <button
      type="button"
      onClick={() => onSetMode(mode)}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
        activeMode === mode 
          ? 'bg-primary-50 border-primary-200 text-primary-700 shadow-sm' 
          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
      }`}
    >
      <Icon size={12} />
      {label}
    </button>
  );

  return (
    <div className="flex flex-col h-full bg-white/50 backdrop-blur-md relative">
      {/* Mode Selector */}
      <div className="px-4 py-3 border-b border-slate-200 flex flex-wrap gap-2 sticky top-0 bg-white/90 z-10 backdrop-blur items-center justify-between">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
            <ModeButton mode={AgentMode.CHAT} icon={Sparkles} label="Chat" />
            <ModeButton mode={AgentMode.RESEARCH_GAP} icon={BrainCircuit} label="Gap Analysis" />
            <ModeButton mode={AgentMode.CITATION_ANALYSIS} icon={ExternalLink} label="Citations" />
            <ModeButton mode={AgentMode.AUTHOR_INTELLIGENCE} icon={GraduationCap} label="Author Intel" />
            <ModeButton mode={AgentMode.VISUALIZE} icon={Box} label="Visualize" />
        </div>
        <button 
           onClick={onViewInsights}
           className="p-1.5 text-yellow-600 bg-yellow-50 hover:bg-yellow-100 rounded-md border border-yellow-200 transition-colors"
           title="Open Insights"
        >
            <Lightbulb size={16} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className={`
              max-w-[90%] rounded-xl p-4 shadow-sm border relative group
              ${msg.role === 'user' 
                ? 'bg-primary-600 border-primary-500 text-white shadow-md shadow-primary-500/10' 
                : 'bg-white border-slate-200 text-slate-700 shadow-sm'
              }
              ${msg.isStarred ? 'ring-2 ring-yellow-400/50' : ''}
            `}>
              {/* Star Indicator (Top Right) */}
              {msg.isStarred && (
                  <div className="absolute -top-2 -right-2 bg-yellow-400 text-white p-1 rounded-full shadow-sm">
                      <Star size={10} fill="currentColor" />
                  </div>
              )}

              {/* Thinking Indicator for Logic Models */}
              {msg.isThinking && (
                 <div className="flex items-center gap-2 mb-3 text-primary-600 font-mono text-xs uppercase tracking-widest border-b border-primary-100 pb-2">
                   <BrainCircuit size={14} className="animate-pulse" />
                   <span>First Principles Reasoning</span>
                 </div>
              )}

              <div className={`prose prose-sm max-w-none leading-relaxed break-words ${msg.role === 'user' ? 'prose-invert' : 'prose-slate'} prose-img:rounded-lg prose-img:shadow-md prose-img:max-w-full`}>
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  urlTransform={urlTransform}
                  components={{
                    img: ({node, ...props}) => (
                      <div 
                        className="group relative inline-block cursor-zoom-in" 
                        onClick={() => onZoomImage && onZoomImage([{src: props.src || '', alt: props.alt || ''}])}
                      >
                         <img {...props} className="rounded-lg shadow-md hover:shadow-lg transition-shadow" />
                         <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <div className="bg-white/90 text-slate-700 px-3 py-1 rounded-full text-xs font-bold shadow-sm flex items-center gap-1 backdrop-blur-sm">
                               <ZoomIn size={14} /> Zoom
                            </div>
                         </div>
                      </div>
                    )
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              </div>

              {/* Citations/Grounding Links */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <span className="text-xs font-mono text-slate-400 block mb-2">SOURCES</span>
                  <div className="flex flex-wrap gap-2">
                    {msg.citations.slice(0, 3).map((url, i) => (
                      <a 
                        key={i} 
                        href={url} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-xs bg-slate-50 hover:bg-slate-100 text-primary-600 px-2 py-1 rounded border border-slate-200 flex items-center gap-1 transition-colors truncate max-w-[200px]"
                      >
                        <ExternalLink size={10} />
                        {new URL(url).hostname}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Message Actions (Bottom) */}
              {msg.role === 'model' && (
                  <div className="mt-3 pt-2 border-t border-slate-100 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                         onClick={() => onToggleStar(msg.id)}
                         className={`p-1.5 rounded hover:bg-slate-100 transition-colors ${msg.isStarred ? 'text-yellow-500' : 'text-slate-400 hover:text-yellow-500'}`}
                         title="Star message to find later"
                      >
                          <Star size={14} fill={msg.isStarred ? "currentColor" : "none"} />
                      </button>
                      <button 
                         onClick={() => onSaveInsight(msg.content)}
                         className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-yellow-600 transition-colors flex items-center gap-1 text-xs"
                         title="Add to Insights Memory"
                      >
                          <Lightbulb size={14} />
                      </button>
                  </div>
              )}
            </div>
            {/* Timestamp Only - No names */}
            <span className="text-[10px] text-slate-400 mt-1 font-mono px-1">
              {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </span>
          </div>
        ))}
        {isProcessing && (
           <div className="flex items-start">
             <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
               <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce"></div>
               <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce delay-75"></div>
               <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce delay-150"></div>
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-slate-200 bg-white">
        
        {/* Extended Thinking Toggle (Placed above input) */}
        {onSetExtendedThinking && (
          <div className="flex justify-end mb-2">
            <button 
              type="button"
              onClick={() => onSetExtendedThinking(!useExtendedThinking)}
              className={`flex items-center gap-2 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors ${
                useExtendedThinking 
                  ? 'bg-primary-50 text-primary-700 border border-primary-200' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <BrainCircuit size={12} className={useExtendedThinking ? 'animate-pulse' : ''} />
              Reason More
              {useExtendedThinking ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isProcessing}
            placeholder={
              isProcessing ? "Sofia is thinking..." :
              activeMode === AgentMode.RESEARCH_GAP ? "Identify a gap in..." :
              activeMode === AgentMode.AUTHOR_INTELLIGENCE ? "Enter author name..." :
              activeMode === AgentMode.VISUALIZE ? "Visualize structure of..." :
              "Ask Sofia..."
            }
            className="w-full bg-slate-50 text-slate-800 rounded-lg pl-4 pr-12 py-3.5 border border-slate-200 focus:border-primary-400 focus:ring-1 focus:ring-primary-400 focus:outline-none transition-all placeholder:text-slate-400 focus:bg-white disabled:opacity-70"
          />
          <button
            type="submit"
            disabled={!isProcessing && !input.trim()}
            className={`absolute right-2 top-2 p-1.5 rounded-md transition-all shadow-sm flex items-center justify-center h-[34px] w-[34px]
              ${isProcessing 
                ? 'bg-primary-600 hover:bg-primary-500 text-white cursor-pointer' 
                : 'bg-primary-600 hover:bg-primary-500 text-white disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            title={isProcessing ? "Stop generating" : "Send message"}
          >
            {isProcessing ? (
               <div className="relative flex items-center justify-center w-5 h-5">
                  {/* Buffering Animation: Spinning border ring */}
                  <div className="absolute inset-0 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                  {/* Stop Symbol: Square in middle */}
                  <Square size={8} fill="currentColor" className="text-white" />
               </div>
            ) : (
              <Send size={18} />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
