import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Paper, Highlight } from '../types';
import { FileText, UploadCloud, ExternalLink, Loader2, ZoomIn, ZoomOut, Highlighter, MessageSquare, Trash2, X, Copy, Sparkles, MoreHorizontal } from 'lucide-react';

// Access global PDF.js library
const getPdfLib = () => (window as any).pdfjsLib;

interface PDFViewerProps {
  paper: Paper | null;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUpdatePaper?: (updatedPaper: Paper) => void;
  onAskSofia?: (text: string) => void;
}

interface SelectionState {
  rects: DOMRect[];
  text: string;
  pageRect: DOMRect;
  pageNum: number;
}

// Sub-component for individual pages
const PDFPage = React.memo(({ 
  pdfDoc, 
  pageNum, 
  scale, 
  highlights, 
  onSelection, 
  onHighlightClick 
}: {
  pdfDoc: any, 
  pageNum: number, 
  scale: number, 
  highlights: Highlight[],
  onSelection: (sel: SelectionState) => void,
  onHighlightClick: (id: string, comment?: string) => void
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const annotationLayerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!pdfDoc) return;
    
    let renderTask: any = null;

    const render = async () => {
      try {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale });

        // Canvas
        const canvas = canvasRef.current;
        if (canvas) {
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          const context = canvas.getContext('2d');
          if (context) {
             renderTask = page.render({ canvasContext: context, viewport });
             await renderTask.promise;
          }
        }

        // Text Layer
        const textLayerDiv = textLayerRef.current;
        if (textLayerDiv) {
          textLayerDiv.innerHTML = '';
          textLayerDiv.style.setProperty('--scale-factor', scale.toString());
          textLayerDiv.style.height = `${viewport.height}px`;
          textLayerDiv.style.width = `${viewport.width}px`;
          const textContent = await page.getTextContent();
          await getPdfLib().renderTextLayer({
            textContentSource: textContent,
            container: textLayerDiv,
            viewport: viewport,
            textDivs: []
          }).promise;
        }

        // Annotation Layer (Links)
        const annotationLayerDiv = annotationLayerRef.current;
        if (annotationLayerDiv) {
          annotationLayerDiv.innerHTML = '';
          const annotations = await page.getAnnotations();
          
          annotations.forEach((annotation: any) => {
             if (annotation.subtype === 'Link' && annotation.rect) {
               const rect = viewport.convertToViewportRectangle(annotation.rect);
               
               const section = document.createElement('section');
               section.className = 'linkAnnotation';
               section.style.left = `${rect[0]}px`;
               section.style.top = `${rect[1]}px`;
               section.style.width = `${rect[2] - rect[0]}px`;
               section.style.height = `${rect[3] - rect[1]}px`; 
               
               const link = document.createElement('a');
               if (annotation.url) {
                 link.href = annotation.url;
                 link.target = '_blank';
               } else if (annotation.dest) {
                 // Internal link
                 link.href = '#';
                 link.onclick = (e) => {
                   e.preventDefault();
                   // Resolve destination and scroll
                   const resolveDest = async (dest: any) => {
                       let pageIndex = -1;
                       if (typeof dest === 'string') {
                           const destRef = await pdfDoc.getDestination(dest);
                           if (destRef) pageIndex = await pdfDoc.getPageIndex(destRef[0]);
                       } else if (Array.isArray(dest)) {
                           pageIndex = await pdfDoc.getPageIndex(dest[0]);
                       }
                       
                       if (pageIndex >= 0) {
                           const el = document.getElementById(`page-${pageIndex + 1}`);
                           el?.scrollIntoView({ behavior: 'smooth' });
                       }
                   };
                   resolveDest(annotation.dest);
                 };
               }
               section.appendChild(link);
               annotationLayerDiv.appendChild(section);
             }
          });
        }
        
        setLoaded(true);
      } catch (e: any) {
        if (e.name !== 'RenderingCancelledException') {
          console.error(e);
        }
      }
    };
    render();
    return () => {
      if (renderTask) renderTask.cancel();
    };
  }, [pdfDoc, pageNum, scale]);

  const handleMouseUp = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;

    const range = sel.getRangeAt(0);
    const rects = Array.from(range.getClientRects());
    
    if (rects.length === 0 || !textLayerRef.current) return;

    const containerRect = textLayerRef.current.getBoundingClientRect();
    const isInside = rects.some(r => 
      r.top <= containerRect.bottom &&
      r.bottom >= containerRect.top &&
      r.left <= containerRect.right &&
      r.right >= containerRect.left
    );

    if (isInside) {
      onSelection({
        rects,
        text: sel.toString(),
        pageRect: containerRect,
        pageNum
      });
    }
  };

  const getColorClass = (color: string) => {
    switch(color) {
      // Opaque colors + mix-blend-mode: multiply = Clear text, standard highlighter look
      case 'yellow': return 'bg-yellow-300'; 
      case 'green': return 'bg-green-300';
      case 'red': return 'bg-red-300';
      case 'blue': return 'bg-blue-300';
      default: return 'bg-yellow-300';
    }
  };

  return (
    <div 
      id={`page-${pageNum}`}
      className="pdf-page relative mx-auto"
      style={{ width: 'fit-content', height: 'fit-content' }}
    >
      <canvas ref={canvasRef} className="block" />
      <div className="annotationLayer" ref={annotationLayerRef} />
      <div 
        ref={textLayerRef} 
        className="textLayer" 
        onMouseUp={handleMouseUp}
      />
      {/* Highlights */}
      {highlights.map(h => (
        <div key={h.id} className="highlight-layer w-full h-full">
           {h.rects.map((rect, idx) => (
             <div
               key={idx}
               className={`highlight-rect transition-colors ${getColorClass(h.color)}`}
               style={{
                 left: `${rect.x * 100}%`,
                 top: `${rect.y * 100}%`,
                 width: `${rect.width * 100}%`,
                 height: `${rect.height * 100}%`,
               }}
               onClick={(e) => {
                 e.stopPropagation();
                 onHighlightClick(h.id, h.comment);
               }}
             />
           ))}
        </div>
      ))}
    </div>
  );
});

export const PDFViewer: React.FC<PDFViewerProps> = ({ paper, onUpload, onUpdatePaper, onAskSofia }) => {
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.2);
  const [loading, setLoading] = useState(false);
  
  // Selection & Highlight State
  const [selection, setSelection] = useState<SelectionState | null>(null);
  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [showHighlightMenu, setShowHighlightMenu] = useState(false);

  useEffect(() => {
    if (!paper) return;
    const loadPdf = async () => {
      const pdfjsLib = getPdfLib();
      if (!pdfjsLib) return;
      setLoading(true);
      try {
        const loadingTask = pdfjsLib.getDocument(paper.url);
        const doc = await loadingTask.promise;
        setPdfDoc(doc);
        setNumPages(doc.numPages);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadPdf();
  }, [paper]);

  // Handler for selection from any page
  const handleSelection = useCallback((sel: SelectionState) => {
    setSelection(sel);
  }, []);

  const clearSelection = () => {
    setSelection(null);
    setShowHighlightMenu(false);
    window.getSelection()?.removeAllRanges();
  }

  const handleContainerClick = (e: React.MouseEvent) => {
    // CRITICAL FIX: Only clear selection if the user clicked background and NOT while selecting text.
    // If text is currently selected in the browser, assume the user just finished a selection operation
    // and wants to see the menu.
    const currentSelection = window.getSelection();
    if (!currentSelection || currentSelection.toString().length === 0) {
      if (selection) {
        clearSelection();
      }
    }
  };

  const addHighlight = (color: Highlight['color']) => {
    if (!selection || !paper || !onUpdatePaper) return;
    
    // Normalize rects relative to the page they are on
    const finalRects = selection.rects.map(r => ({
      x: (r.left - selection.pageRect.left) / selection.pageRect.width,
      y: (r.top - selection.pageRect.top) / selection.pageRect.height,
      width: r.width / selection.pageRect.width,
      height: r.height / selection.pageRect.height
    }));

    const newHighlight: Highlight = {
      id: crypto.randomUUID(),
      pageNum: selection.pageNum,
      rects: finalRects,
      text: selection.text,
      color,
    };

    const updatedPaper = {
      ...paper,
      highlights: [...(paper.highlights || []), newHighlight]
    };

    onUpdatePaper(updatedPaper);
    clearSelection();
  };

  const removeHighlight = (id: string) => {
    if (!paper || !onUpdatePaper) return;
    const updatedPaper = {
      ...paper,
      highlights: paper.highlights?.filter(h => h.id !== id) || []
    };
    onUpdatePaper(updatedPaper);
    setActiveHighlightId(null);
  };
  
  const handleAskSofia = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent container click from clearing immediately
    if(selection && onAskSofia) {
      onAskSofia(selection.text);
      clearSelection();
    }
  }

  if (!paper) {
    return (
       <div className="h-full flex flex-col items-center justify-center bg-white border border-slate-200 rounded-lg p-6 shadow-sm text-center">
        <div className="mb-4 p-4 rounded-full bg-primary-50 animate-pulse-slow">
          <FileText size={40} className="text-primary-400" />
        </div>
        <h2 className="text-lg font-bold mb-2 text-slate-700 font-sans">No Document Selected</h2>
        <p className="mb-6 text-center max-w-sm text-slate-500 text-sm leading-relaxed">
          Upload a research paper PDF to begin. Sofia will analyze the text for connections and citations.
        </p>
        <label className="cursor-pointer group relative overflow-hidden bg-primary-600 hover:bg-primary-500 text-white font-semibold py-2.5 px-6 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg shadow-primary-500/20 inline-flex items-center gap-2">
          <UploadCloud size={18} />
          <span>Upload PDF</span>
          <input 
            type="file" 
            accept="application/pdf" 
            multiple
            className="hidden" 
            onChange={onUpload} 
          />
        </label>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-100/50 rounded-lg overflow-hidden border border-slate-200 shadow-sm relative group">
       {/* Toolbar */}
       <div className="bg-white px-4 py-2 border-b border-slate-200 flex justify-between items-center shrink-0 shadow-sm z-10">
        <h3 className="text-sm font-medium text-primary-700 truncate max-w-[30%]">{paper.title}</h3>
        <div className="flex items-center gap-4 text-slate-600">
           <div className="flex items-center bg-slate-100 rounded-md border border-slate-200 overflow-hidden">
             <button onClick={() => setScale(s => Math.max(0.5, s - 0.2))} className="p-1.5 hover:bg-slate-200 transition-colors"><ZoomOut size={16} /></button>
             <button onClick={() => setScale(s => Math.min(3, s + 0.2))} className="p-1.5 hover:bg-slate-200 transition-colors"><ZoomIn size={16} /></button>
           </div>
        </div>
        <a href={paper.url} target="_blank" rel="noreferrer" className="text-xs flex items-center gap-1 text-slate-500 hover:text-primary-600 transition-colors">
          <ExternalLink size={14} /> <span className="hidden lg:inline">Open in Tab</span>
        </a>
      </div>

      {/* Main Continuous Scroll Area */}
      <div className="flex-1 overflow-auto bg-slate-200/50 p-8" onClick={handleContainerClick}>
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <Loader2 className="animate-spin text-primary-500" size={32} />
            <span className="text-xs font-medium text-slate-500">Loading PDF...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
             {Array.from({ length: numPages }, (_, i) => i + 1).map(page => (
               <PDFPage 
                 key={page}
                 pdfDoc={pdfDoc}
                 pageNum={page}
                 scale={scale}
                 highlights={paper.highlights?.filter(h => h.pageNum === page) || []}
                 onSelection={handleSelection}
                 onHighlightClick={(id, c) => {
                    setActiveHighlightId(id);
                    setCommentText(c || '');
                 }}
               />
             ))}
          </div>
        )}
      </div>

      {/* Context Menu (Like Edge) */}
      {selection && (
        <div 
          className="fixed z-50 bg-white rounded-lg shadow-xl border border-slate-200 p-1 flex flex-col min-w-[180px] animate-in fade-in zoom-in-95 duration-100"
          style={{
            top: selection.rects[0].bottom + 10, // Show slightly below
            left: selection.rects[0].left, // Align left
          }}
          onMouseDown={(e) => e.stopPropagation()} 
        >
          <button 
             onClick={() => { navigator.clipboard.writeText(selection.text); clearSelection(); }}
             className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded text-left"
          >
            <Copy size={14} /> Copy text
          </button>
          
          <div className="relative group/highlight">
            <button 
               className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded text-left w-full justify-between"
               onMouseEnter={() => setShowHighlightMenu(true)}
            >
              <div className="flex items-center gap-2"><Highlighter size={14} /> Highlight</div>
              <MoreHorizontal size={14} className="text-slate-400" />
            </button>
            {/* Hover Submenu for Colors */}
            <div className="absolute left-full top-0 ml-1 bg-white border border-slate-200 shadow-lg rounded p-2 flex gap-1 hidden group-hover/highlight:flex">
                <button onClick={() => addHighlight('yellow')} className="w-5 h-5 rounded-full bg-yellow-300 border border-slate-200 hover:scale-110" />
                <button onClick={() => addHighlight('green')} className="w-5 h-5 rounded-full bg-green-300 border border-slate-200 hover:scale-110" />
                <button onClick={() => addHighlight('red')} className="w-5 h-5 rounded-full bg-red-300 border border-slate-200 hover:scale-110" />
                <button onClick={() => addHighlight('blue')} className="w-5 h-5 rounded-full bg-blue-300 border border-slate-200 hover:scale-110" />
            </div>
          </div>
          
          <button 
             onClick={() => { addHighlight('yellow'); /* Then open comment? Logic simplified */ }}
             className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded text-left"
          >
            <MessageSquare size={14} /> Add comment
          </button>

          <div className="h-px bg-slate-100 my-1" />
          
          <button 
             onClick={handleAskSofia}
             className="flex items-center gap-2 px-3 py-2 text-sm text-primary-600 font-medium hover:bg-primary-50 rounded text-left"
          >
            <Sparkles size={14} /> Ask Sofia
          </button>
        </div>
      )}

      {/* Active Highlight Detail */}
      {activeHighlightId && (
        <div className="fixed inset-0 z-[60] bg-black/10 backdrop-blur-[1px] flex items-center justify-center" onClick={() => setActiveHighlightId(null)}>
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-80 overflow-hidden" onClick={e => e.stopPropagation()}>
             <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
               <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Note</h4>
               <div className="flex gap-2">
                 <button onClick={() => removeHighlight(activeHighlightId)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                 <button onClick={() => setActiveHighlightId(null)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
               </div>
             </div>
             <div className="p-4">
               <textarea 
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  className="w-full text-sm p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-primary-400 min-h-[100px] resize-none"
               />
             </div>
          </div>
        </div>
      )}
    </div>
  );
}