import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { Move, Maximize2 } from 'lucide-react';
import './index.css';

const FrameApp: React.FC = () => {
  const [size, setSize] = useState<{ width: number; height: number }>({
    width: window.innerWidth,
    height: window.innerHeight
  });
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);

    const unsubState = window.electronAPI.onRecordingStateChanged((state) => {
      setIsRecording(state.status === 'recording' || state.status === 'paused');
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      unsubState();
    };
  }, []);

  return (
    <div className="w-screen h-screen relative bg-transparent select-none overflow-hidden p-2">
      {/* ShowMore Red Dashed Recording Frame */}
      <div
        className={`w-full h-full relative border-2 border-dashed ${
          isRecording ? 'border-rose-500 shadow-[0_0_0_9999px_rgba(0,0,0,0.25)]' : 'border-rose-500 shadow-[0_0_0_9999px_rgba(0,0,0,0.12)]'
        } bg-transparent flex items-center justify-center`}
      >
        {/* Top-Left Floating Dimension Badge */}
        <div className="absolute top-2 left-2 pointer-events-auto z-20">
          <div className="app-draggable cursor-move flex items-center gap-1.5 bg-slate-950/90 text-slate-100 border border-white/15 px-3 py-1 rounded-xl shadow-lg backdrop-blur-md">
            <span className="text-rose-500 font-extrabold text-[11px]">RECO</span>
            <span className="text-slate-600 text-[10px]">•</span>
            <span className="font-mono text-xs font-bold text-slate-200">
              {size.width} × {size.height}
            </span>
          </div>
        </div>

        {/* Center Prominent Drag Option Handle */}
        {!isRecording && (
          <div className="pointer-events-auto z-20">
            <div
              className="app-draggable cursor-move flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-slate-950/90 hover:bg-slate-900 text-white font-bold text-xs border border-white/20 shadow-2xl backdrop-blur-xl transition hover:scale-105 active:scale-95"
              title="Click and drag anywhere to move recording frame"
            >
              <Move className="w-4 h-4 text-rose-500" />
              <span>Drag to Move Frame</span>
            </div>
          </div>
        )}

        {/* 8 Perfectly Aligned Handle Dots on the Exact Border Lines */}
        {!isRecording && (
          <>
            {/* Top Left */}
            <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-rose-500 border-2 border-white rounded-sm shadow-md pointer-events-none z-10" />
            {/* Top Center */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-rose-500 border-2 border-white rounded-sm shadow-md pointer-events-none z-10" />
            {/* Top Right */}
            <div className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-rose-500 border-2 border-white rounded-sm shadow-md pointer-events-none z-10" />
            {/* Right Center */}
            <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-rose-500 border-2 border-white rounded-sm shadow-md pointer-events-none z-10" />
            {/* Bottom Right */}
            <div className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 w-3.5 h-3.5 bg-rose-500 border-2 border-white rounded-sm shadow-md pointer-events-none z-10" />
            {/* Bottom Center */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-3.5 h-3.5 bg-rose-500 border-2 border-white rounded-sm shadow-md pointer-events-none z-10" />
            {/* Bottom Left */}
            <div className="absolute bottom-0 left-0 -translate-x-1/2 translate-y-1/2 w-3.5 h-3.5 bg-rose-500 border-2 border-white rounded-sm shadow-md pointer-events-none z-10" />
            {/* Left Center */}
            <div className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-rose-500 border-2 border-white rounded-sm shadow-md pointer-events-none z-10" />
          </>
        )}
      </div>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('frame-root') as HTMLElement);
root.render(
  <React.StrictMode>
    <FrameApp />
  </React.StrictMode>
);
