import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { Move } from 'lucide-react';
import { RecordingStatus } from '../shared/types';
import './index.css';

const FrameApp: React.FC = () => {
  const [size, setSize] = useState<{ width: number; height: number }>({
    width: window.innerWidth,
    height: window.innerHeight
  });
  const [recordingStatus, setRecordingStatus] = useState<RecordingStatus>('idle');
  const [countdownText, setCountdownText] = useState<string | null>(null);

  const countdownTimerRef = useRef<any>(null);
  const recordingStatusRef = useRef<RecordingStatus>('idle');
  recordingStatusRef.current = recordingStatus;

  const handleCancel = () => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setCountdownText(null);
    setRecordingStatus('idle');
    window.electronAPI.cancelCountdown();
  };

  const handleStartDirectly = () => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setCountdownText(null);
    window.electronAPI.confirmStartRecording();
  };

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
        setCountdownText(null);
      }
    });

    // 3 -> 2 -> 1 -> GO -> Automatically starts recording directly
    const unsubCountdown = (window.electronAPI as any).onTriggerCountdown?.((seconds: number) => {
      if (seconds <= 0) {
        handleStartDirectly();
        return;
      }

      setRecordingStatus('countdown');
      setCountdownText(String(seconds));

      let currentSec = seconds;
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }

      countdownTimerRef.current = setInterval(() => {
        currentSec -= 1;
        if (currentSec > 0) {
          setCountdownText(String(currentSec));
        } else if (currentSec === 0) {
          // Show vibrant GO! pulse
          setCountdownText('GO!');
        } else {
          // Automatically start recording!
          clearInterval(countdownTimerRef.current);
          countdownTimerRef.current = null;
          handleStartDirectly();
        }
      }, 900);
    });

    // Pressing Esc during countdown cancels
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (recordingStatusRef.current === 'countdown') {
          handleCancel();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      unsubState();
      if (unsubCountdown) unsubCountdown();
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
    };
  }, []); // Mount strictly once

  const isRecording = recordingStatus === 'recording';
  const isPaused = recordingStatus === 'paused';
  const isCountdown = recordingStatus === 'countdown';
  const isActive = isRecording || isPaused || isCountdown;

  return (
    <div className="w-screen h-screen relative bg-transparent select-none overflow-hidden p-2">
      {/* Selection Frame Boundary */}
      <div
        className={`w-full h-full relative border-2 border-dashed transition-colors duration-200 ${
          isPaused
            ? 'border-amber-400 shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]'
            : isRecording
            ? 'border-rose-500 shadow-[0_0_0_9999px_rgba(0,0,0,0.3)]'
            : isCountdown
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
                  : isCountdown
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
                : 'RECO'}
            </span>
            <span className="text-slate-500 text-xs">•</span>
            <span className="font-mono text-xs font-bold text-slate-100 tracking-wide">
              {size.width} × {size.height}
            </span>
          </div>
        </div>

        {/* Dynamic 3 -> 2 -> 1 -> GO! Animation that automatically starts recording */}
        {isCountdown && countdownText !== null && (
          <div
            key={countdownText}
            className="pointer-events-none z-30 flex flex-col items-center justify-center animate-in fade-in zoom-in-75 duration-200"
          >
            <div className="w-36 h-36 rounded-full bg-slate-950/90 border-2 border-indigo-500/80 backdrop-blur-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/40">
              <span
                className={`font-black text-transparent bg-clip-text font-mono tracking-tighter ${
                  countdownText === 'GO!'
                    ? 'text-6xl bg-gradient-to-tr from-emerald-400 via-white to-emerald-300 animate-pulse'
                    : 'text-8xl bg-gradient-to-tr from-indigo-400 via-white to-rose-400'
                }`}
              >
                {countdownText}
              </span>
            </div>
            <p className="text-xs font-bold text-slate-300 tracking-wider uppercase mt-4 bg-slate-900/90 px-4 py-1.5 rounded-full border border-white/15 shadow-md">
              {countdownText === 'GO!' ? 'Recording Starting...' : 'Press Esc to Cancel'}
            </p>
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
