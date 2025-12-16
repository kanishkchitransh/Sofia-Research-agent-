import React, { useState, useRef, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, Move, Maximize2, ArrowRight, ArrowLeft, Grid } from 'lucide-react';

interface ImageZoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: {src: string, alt: string}[];
}

export const ImageZoomModal: React.FC<ImageZoomModalProps> = ({ isOpen, onClose, images }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // View State: 'grid' or index of single image
  const [viewIndex, setViewIndex] = useState<number | null>(null); // null means Grid mode if >1 image
  
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (images.length === 1) {
          setViewIndex(0);
      } else {
          setViewIndex(null); // Grid Mode
      }
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen, images]);

  // Reset zoom when switching images
  useEffect(() => {
      setScale(1);
      setPosition({ x: 0, y: 0 });
  }, [viewIndex]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (viewIndex === null) return;
    const delta = e.deltaY * -0.001;
    const newScale = Math.min(Math.max(0.5, scale + delta), 6); 
    setScale(newScale);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (viewIndex === null) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  if (!isOpen) return null;

  const activeImage = viewIndex !== null ? images[viewIndex] : null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      
      {/* Pop-up Window Container */}
      <div className="bg-white w-[70vw] h-[80vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col relative border border-slate-200 animate-in zoom-in-95 duration-200">
        
        {/* Header / Toolbar */}
        <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-white z-20 shrink-0">
           <div className="flex items-center gap-2 text-slate-700">
             <Maximize2 size={16} className="text-primary-600"/>
             <span className="font-semibold text-sm">
                 {viewIndex === null ? `Figure Gallery (${images.length})` : 'Enhanced Viewer'}
             </span>
             {activeImage && (
                <span className="text-xs text-slate-400 border-l border-slate-200 pl-2 ml-1 truncate max-w-[300px]">
                    {activeImage.alt}
                </span>
             )}
           </div>

           <div className="flex items-center gap-4">
               {/* View Controls */}
               {viewIndex !== null && (
                   <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200 gap-1">
                      {images.length > 1 && (
                          <button onClick={() => setViewIndex(null)} className="p-1 hover:bg-white hover:shadow-sm rounded transition-all text-slate-500 hover:text-primary-600" title="Back to Grid">
                              <Grid size={16} />
                          </button>
                      )}
                      
                      <div className="h-4 w-px bg-slate-300 mx-1"></div>

                      <button onClick={() => setScale(s => Math.max(0.5, s - 0.5))} className="p-1 hover:bg-white hover:shadow-sm rounded transition-all text-slate-500 hover:text-primary-600"><ZoomOut size={16} /></button>
                      <span className="text-xs font-mono w-10 text-center text-slate-600">{Math.round(scale * 100)}%</span>
                      <button onClick={() => setScale(s => Math.min(6, s + 0.5))} className="p-1 hover:bg-white hover:shadow-sm rounded transition-all text-slate-500 hover:text-primary-600"><ZoomIn size={16} /></button>
                   </div>
               )}
               
               <button 
                onClick={onClose}
                className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition-colors"
               >
                 <X size={20} />
               </button>
           </div>
        </div>

        {/* Main Content Area */}
        <div 
          ref={containerRef}
          className="flex-1 overflow-hidden relative bg-slate-50 select-none flex items-center justify-center"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

          {/* GRID MODE */}
          {viewIndex === null && (
              <div className="w-full h-full overflow-y-auto p-8 grid grid-cols-2 gap-6 place-content-center">
                  {images.map((img, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => setViewIndex(idx)}
                        className="group relative cursor-pointer border border-slate-200 bg-white rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden aspect-[4/3] flex items-center justify-center"
                      >
                          <img src={img.src} alt={img.alt} className="max-w-full max-h-full object-contain" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-end p-4">
                              <div className="bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm w-full text-center">
                                  {img.alt}
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
          )}

          {/* SINGLE VIEW MODE */}
          {viewIndex !== null && activeImage && (
              <>
                <div 
                    style={{ 
                    transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                    transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                    willChange: 'transform',
                    cursor: isDragging ? 'grabbing' : 'grab'
                    }}
                >
                    <img 
                    src={activeImage.src} 
                    alt={activeImage.alt} 
                    className="max-w-[70vw] max-h-[70vh] object-contain shadow-xl rounded-sm pointer-events-none" 
                    draggable={false}
                    />
                </div>
                
                {/* Navigation Arrows for Single View */}
                {images.length > 1 && (
                    <>
                        <button 
                            onClick={(e) => { e.stopPropagation(); setViewIndex((viewIndex - 1 + images.length) % images.length); }}
                            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/80 hover:bg-white rounded-full shadow-md text-slate-600 hover:text-primary-600 transition-all border border-slate-200"
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); setViewIndex((viewIndex + 1) % images.length); }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/80 hover:bg-white rounded-full shadow-md text-slate-600 hover:text-primary-600 transition-all border border-slate-200"
                        >
                            <ArrowRight size={24} />
                        </button>
                    </>
                )}

                <div className="absolute bottom-4 left-4 bg-white/80 backdrop-blur px-3 py-1.5 rounded-full text-xs text-slate-500 font-medium border border-slate-200 shadow-sm flex items-center gap-2 pointer-events-none">
                    <Move size={12} /> Click & Drag to Pan
                </div>
              </>
          )}

        </div>
      </div>
    </div>
  );
};
