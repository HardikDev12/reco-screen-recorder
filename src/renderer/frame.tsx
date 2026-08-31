import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { Move, Play, X } from 'lucide-react';
import { RecordingStatus } from '../shared/types';
import './index.css';

const FrameApp: React.FC = () => {
  const [size, setSize] = useState<{ width: number; height: number }>({
    width: window.innerWidth,
    height: window.innerHeight
  });
  const [recordingStatus, setRecordingStatus] = useState<RecordingStatus>('idle');
  const [countdownNumber, setCountdownNumber] = useState<number | null>(null);

  const countdownTimerRef = useRef<any>(null);

  useEffect(() => {
    const handleResize = () => {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);

    const unsubState = window.electronAPI.onRecordingStateChanged((state) => {
      setRecordingStatus(state.status as RecordingStatus);
      if (state.status !== 'countdown') {
        if (countdownTimerRef.current) {
          clearInterval(countdownTimerRef.current);
          countdownTimerRef.current = null;
        }
        setCountdownNumber(null);
      }
    });

    const unsubCountdown = (window.electronAPI as any).onTriggerCountdown?.((seconds: number) => {
      if (seconds <= 0) {
        setRecordingStatus('ready');
        window.electronAPI.notifyCountdownReady();
        return;
      }

      setRecordingStatus('countdown');
      setCountdownNumber(seconds);

      let currentSec = seconds;
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);

      countdownTimerRef.current = setInterval(() => {
        currentSec -= 1;
        if (currentSec > 0) {
          setCountdownNumber(currentSec);
        } else {
          clearInterval(countdownTimerRef.current);
          countdownTimerRef.current = null;
          setCountdownNumber(null);
          setRecordingStatus('ready');
          window.electronAPI.notifyCountdownReady();
        }
      }, 1000);
    });

    // Keyboard handlers: Enter/Ctrl+Shift+R starts, Esc cancels
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (recordingStatus === 'countdown' || recordingStatus === 'ready') {
          handleCancel();
        }
      } else if (e.key === 'Enter' || ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'r')) {
        if (recordingStatus === 'ready') {
          handleConfirmStart();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      unsubState();
      if (unsubCountdown) unsubCountdown();
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [recordingStatus]);

  const handleConfirmStart = () => {
    window.electronAPI.confirmStartRecording();
  };

  const handleCancel = () => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setCountdownNumber(null);
    setRecordingStatus('idle');
    window.electronAPI.cancelCountdown();
  };

  const isRecording = recordingStatus === 'recording';
  const isPaused = recordingStatus === 'paused';
  const isCountdown = recordingStatus === 'countdown';
  const isReady = recordingStatus === 'ready';
  const isActive = isRecording || isPaused || isCountdown || isReady;

  return (
    <div className="w-screen h-screen relative bg-transparent select-none overflow-hidden p-2">
      {/* ShowMore-Inspired Selection Recording Boundary */}
      <div
        className={`w-full h-full relative border-2 border-dashed transition-colors duration-200 ${
          isPaused
            ? 'border-amber-400 shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]'
            : isRecording
            ? 'border-rose-500 shadow-[0_0_0_9999px_rgba(0,0,0,0.3)]'
            : isCountdown || isReady
            ? 'border-indigo-500 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]'
            : 'border-rose-500 shadow-[0_0_0_9999px_rgba(0,0,0,0.15)]'
        } bg-transparent flex items-center justify-center`}
      >
        {/* Top-Left Floating Dimension & State Badge */}
        <div className="absolute top-4 left-4 pointer-events-auto z-20">
          <div className="app-draggable frame-dimension-badge flex items-center gap-2">
            <span
              className={`font-extrabold text-xs tracking-wider ${
                isPaused
                  ? 'text-amber-400'
                  : isRecording
                  ? 'text-rose-500'
                  : isCountdown || isReady
                  ? 'text-indigo-400'
                  : 'text-rose-500'
              }`}
            >
              {isPaused
                ? 'PAUSED'
                : isRecording
                ? 'REC'
                : isCountdown
                ? 'COUNTDOWN'
                : isReady
                ? 'READY'
                : 'RECO'}
            </span>
            <span className="text-slate-500 text-xs">•</span>
            <span className="font-mono text-xs font-bold text-slate-100 tracking-wide">
              {size.width} × {size.height}
            </span>
          </div>
        </div>

        {/* 1. On-Screen Large Animated Countdown */}
        {isCountdown && countdownNumber !== null && (
          <div className="pointer-events-none z-30 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
            <div className="w-32 h-32 rounded-full bg-slate-950/80 border-2 border-indigo-500/80 backdrop-blur-md flex items-center justify-center shadow-2xl shadow-indigo-500/30">
              <span className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-tr from-indigo-400 via-white to-rose-400 font-mono scale-110 animate-pulse">
                {countdownNumber}
              </span>
            </div>
            <p className="text-xs font-bold text-slate-300 tracking-wider uppercase mt-4 bg-slate-900/80 px-4 py-1.5 rounded-full border border-white/10">
              Preparing Capture... Press Esc to cancel
            </p>
          </div>
        )}

        {/* 2. Persistent GO / Ready Confirmation Overlay */}
        {isReady && (
          <div className="pointer-events-auto z-30 flex flex-col items-center justify-center p-6 rounded-3xl bg-slate-950/90 border border-white/20 backdrop-blur-xl shadow-2xl shadow-black/80 max-w-sm text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 via-indigo-600 to-rose-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-3">
              <span className="text-2xl font-black text-white tracking-tighter">GO</span>
            </div>

            <h2 className="text-lg font-extrabold text-white tracking-tight">Ready to Record</h2>
            <p className="text-xs text-slate-400 mt-1 mb-5">
              Region locked at <strong className="text-slate-200">{size.width} × {size.height}</strong>. Click below to start capturing.
            </p>

            <div className="flex items-center gap-3 w-full">
              <button
                onClick={handleCancel}
                className="flex-1 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white text-xs font-bold transition border border-white/10 flex items-center justify-center gap-1.5"
              >
                <X className="w-4 h-4" />
                Cancel (Esc)
              </button>

              <button
                onClick={handleConfirmStart}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white text-xs font-extrabold tracking-wide transition shadow-lg shadow-rose-600/40 flex items-center justify-center gap-1.5"
              >
                <Play className="w-4 h-4 fill-current" />
                Start (Enter)
              </button>
            </div>
          </div>
        )}

        {/* Center Drag Handle */}
        {!isActive && (
          <div className="pointer-events-auto z-20">
            <div
              className="app-draggable frame-drag-center"
              title="Click and drag anywhere to move recording frame"
            >
              <Move className="w-4 h-4 text-rose-500" />
            </div>
          </div>
        )}

        {/* 8 Corner & Edge Resize Handles */}
        {!isActive && (
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
