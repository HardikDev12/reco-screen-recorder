import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { Move, Maximize2 } from 'lucide-react';
import { RegionBounds } from '../shared/types';
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
    <div className="w-screen h-screen relative bg-transparent select-none overflow-hidden pointer-events-none">
      {/* Red Dashed Border */}
      <div
        className={`w-full h-full border-2 border-dashed ${
          isRecording ? 'border-rose-500 shadow-[0_0_0_9999px_rgba(0,0,0,0.25)]' : 'border-rose-500/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.12)]'
        } bg-transparent relative flex flex-col justify-between`}
      >
        {/* Top Drag Header Strip */}
        <div className="w-full flex items-center justify-between p-2 pointer-events-auto">
          {/* Dimension Tag + App Region Drag */}
          <div className="app-draggable flex items-center gap-2 cursor-move bg-slate-950/90 text-slate-100 border border-white/10 px-3 py-1.5 rounded-xl shadow-lg backdrop-blur-md">
            <span className="text-rose-400 font-extrabold text-[11px]">RECO</span>
            <span className="text-slate-500">•</span>
            <span className="font-mono text-xs font-bold text-slate-200">
              {size.width} × {size.height}
            </span>
            <Move className="w-3.5 h-3.5 text-slate-400 ml-1" />
          </div>

          {/* Fullscreen shortcut */}
          {!isRecording && (
            <button
              onClick={() => window.electronAPI.setFrameFullScreen()}
              className="p-1.5 bg-slate-950/80 hover:bg-slate-900 text-slate-300 hover:text-white rounded-xl border border-white/10 shadow-lg backdrop-blur-md transition cursor-pointer"
              title="Expand to Full Display"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 8 Visible Resize Corner & Edge Indicators */}
        {!isRecording && (
          <>
            <div className="absolute top-0 left-0 w-3 h-3 bg-rose-500 border-2 border-white rounded-sm" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-rose-500 border-2 border-white rounded-sm" />
            <div className="absolute top-0 right-0 w-3 h-3 bg-rose-500 border-2 border-white rounded-sm" />
            <div className="absolute top-1/2 -translate-y-1/2 right-0 w-3 h-3 bg-rose-500 border-2 border-white rounded-sm" />
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-rose-500 border-2 border-white rounded-sm" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-rose-500 border-2 border-white rounded-sm" />
            <div className="absolute bottom-0 left-0 w-3 h-3 bg-rose-500 border-2 border-white rounded-sm" />
            <div className="absolute top-1/2 -translate-y-1/2 left-0 w-3 h-3 bg-rose-500 border-2 border-white rounded-sm" />
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
