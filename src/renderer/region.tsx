import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { Check, X, Crop, Maximize2, Move } from 'lucide-react';
import { RegionBounds } from '../shared/types';
import './index.css';

const RegionApp: React.FC = () => {
  const [bounds, setBounds] = useState<RegionBounds>({
    x: Math.round(window.innerWidth * 0.15),
    y: Math.round(window.innerHeight * 0.12),
    width: Math.round(window.innerWidth * 0.7),
    height: Math.round(window.innerHeight * 0.7)
  });

  const [isResizing, setIsResizing] = useState<string | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const dragStartPos = useRef<{ mouseX: number; mouseY: number; startBounds: RegionBounds }>({
    mouseX: 0,
    mouseY: 0,
    startBounds: { x: 0, y: 0, width: 0, height: 0 }
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        window.electronAPI.cancelRegionSelection();
      } else if (e.key === 'Enter') {
        window.electronAPI.sendRegionSelected(bounds);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [bounds]);

  const handleMouseDownMove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMoving(true);
    dragStartPos.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startBounds: { ...bounds }
    };
  };

  const handleMouseDownResize = (handle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(handle);
    dragStartPos.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startBounds: { ...bounds }
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isMoving) {
      const dx = e.clientX - dragStartPos.current.mouseX;
      const dy = e.clientY - dragStartPos.current.mouseY;
      const newX = Math.max(0, Math.min(window.innerWidth - bounds.width, dragStartPos.current.startBounds.x + dx));
      const newY = Math.max(0, Math.min(window.innerHeight - bounds.height, dragStartPos.current.startBounds.y + dy));
      setBounds((prev) => ({ ...prev, x: newX, y: newY }));
    } else if (isResizing) {
      const dx = e.clientX - dragStartPos.current.mouseX;
      const dy = e.clientY - dragStartPos.current.mouseY;
      const sb = dragStartPos.current.startBounds;

      let newX = sb.x;
      let newY = sb.y;
      let newW = sb.width;
      let newH = sb.height;

      if (isResizing.includes('r')) newW = Math.max(120, sb.width + dx);
      if (isResizing.includes('b')) newH = Math.max(120, sb.height + dy);
      if (isResizing.includes('l')) {
        const potentialW = sb.width - dx;
        if (potentialW > 120) {
          newX = sb.x + dx;
          newW = potentialW;
        }
      }
      if (isResizing.includes('t')) {
        const potentialH = sb.height - dy;
        if (potentialH > 120) {
          newY = sb.y + dy;
          newH = potentialH;
        }
      }

      setBounds({ x: newX, y: newY, width: newW, height: newH });
    }
  };

  const handleMouseUp = () => {
    setIsMoving(false);
    setIsResizing(null);
  };

  const handleSetFullScreen = () => {
    setBounds({
      x: 0,
      y: 0,
      width: window.innerWidth,
      height: window.innerHeight
    });
  };

  const handleConfirm = () => {
    window.electronAPI.sendRegionSelected(bounds);
  };

  const handleCancel = () => {
    window.electronAPI.cancelRegionSelection();
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className="w-screen h-screen relative bg-black/10 select-none overflow-hidden"
    >
      {/* ShowMore-Style Red Dashed Resizable Box */}
      <div
        style={{
          left: bounds.x,
          top: bounds.y,
          width: bounds.width,
          height: bounds.height
        }}
        className="absolute border-2 border-dashed border-rose-500 bg-transparent shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]"
      >
        {/* Center Drag Grip */}
        <div
          onMouseDown={handleMouseDownMove}
          className="absolute inset-0 flex items-center justify-center cursor-move group opacity-0 hover:opacity-100 transition-opacity bg-black/5"
        >
          <div className="px-3 py-1.5 rounded-xl bg-black/70 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg pointer-events-none">
            <Move className="w-4 h-4" />
            Drag to Reposition
          </div>
        </div>

        {/* 8 Resize Handles */}
        <div
          onMouseDown={(e) => handleMouseDownResize('tl', e)}
          className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-rose-500 border-2 border-white rounded-sm cursor-nwse-resize shadow"
        />
        <div
          onMouseDown={(e) => handleMouseDownResize('t', e)}
          className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-rose-500 border-2 border-white rounded-sm cursor-ns-resize shadow"
        />
        <div
          onMouseDown={(e) => handleMouseDownResize('tr', e)}
          className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-rose-500 border-2 border-white rounded-sm cursor-nesw-resize shadow"
        />
        <div
          onMouseDown={(e) => handleMouseDownResize('r', e)}
          className="absolute top-1/2 -translate-y-1/2 -right-1.5 w-3.5 h-3.5 bg-rose-500 border-2 border-white rounded-sm cursor-ew-resize shadow"
        />
        <div
          onMouseDown={(e) => handleMouseDownResize('br', e)}
          className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-rose-500 border-2 border-white rounded-sm cursor-nwse-resize shadow"
        />
        <div
          onMouseDown={(e) => handleMouseDownResize('b', e)}
          className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-rose-500 border-2 border-white rounded-sm cursor-ns-resize shadow"
        />
        <div
          onMouseDown={(e) => handleMouseDownResize('bl', e)}
          className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-rose-500 border-2 border-white rounded-sm cursor-nesw-resize shadow"
        />
        <div
          onMouseDown={(e) => handleMouseDownResize('l', e)}
          className="absolute top-1/2 -translate-y-1/2 -left-1.5 w-3.5 h-3.5 bg-rose-500 border-2 border-white rounded-sm cursor-ew-resize shadow"
        />

        {/* Top Dimension Tag */}
        <div className="absolute -top-7 left-0 px-2.5 py-0.5 bg-rose-600 text-white rounded-md text-[11px] font-mono font-bold shadow-md">
          {bounds.width} × {bounds.height}
        </div>

        {/* Attached Bottom Control Bar (ShowMore Style) */}
        <div
          onMouseDown={(e) => e.stopPropagation()}
          className="absolute -bottom-12 right-0 flex items-center gap-2 bg-white text-slate-800 p-1.5 px-3 rounded-xl shadow-2xl border border-slate-200"
        >
          <button
            onClick={handleSetFullScreen}
            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition text-xs font-semibold flex items-center gap-1.5"
            title="Full Screen"
          >
            <Maximize2 className="w-3.5 h-3.5 text-slate-600" />
            Full Screen
          </button>

          <button
            onClick={handleCancel}
            className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition"
            title="Cancel"
          >
            <X className="w-4 h-4" />
          </button>

          <button
            onClick={handleConfirm}
            className="px-3.5 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white transition text-xs font-bold flex items-center gap-1.5 shadow-md shadow-rose-500/30"
          >
            <Check className="w-3.5 h-3.5" />
            Confirm Region
          </button>
        </div>
      </div>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('region-root') as HTMLElement);
root.render(
  <React.StrictMode>
    <RegionApp />
  </React.StrictMode>
);
