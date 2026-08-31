import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { Move } from 'lucide-react';
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
      {/* ShowMore-Inspired Selection Recording Boundary */}
      <div
        className={`w-full h-full relative border-2 border-dashed ${
          isRecording ? 'border-rose-500 shadow-[0_0_0_9999px_rgba(0,0,0,0.3)]' : 'border-rose-500 shadow-[0_0_0_9999px_rgba(0,0,0,0.15)]'
        } bg-transparent flex items-center justify-center`}
      >
        {/* Top-Left Floating Dimension Badge: 16px internal padding, 16px offset from frame border */}
        <div className="absolute top-4 left-4 pointer-events-auto z-20">
          <div className="app-draggable frame-dimension-badge">
            <span className="text-rose-500 font-extrabold text-xs tracking-wider">RECO</span>
            <span className="text-slate-500 text-xs">•</span>
            <span className="font-mono text-xs font-bold text-slate-100 tracking-wide">
              {size.width} × {size.height}
            </span>
          </div>
        </div>

        {/* Center Drag Handle (44x44px hit area with original centered 16px Move icon) */}
        {!isRecording && (
          <div className="pointer-events-auto z-20">
            <div
              className="app-draggable frame-drag-center"
              title="Click and drag anywhere to move recording frame"
            >
              <Move className="w-4 h-4 text-rose-500" />
            </div>
          </div>
        )}

        {/* 8 Corner & Edge Resize Handles (14x14px with 2px white border) */}
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
