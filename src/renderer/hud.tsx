import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import {
  Square,
  Square as RectIcon,
  Circle as CircleIcon,
  Minus,
  MoveUpRight,
  PenTool,
  Highlighter,
  Type,
  Undo2,
  Eraser,
  Camera,
  Edit3,
  GripHorizontal
} from 'lucide-react';
import './index.css';

type AnnotationTool = 'rect' | 'circle' | 'line' | 'arrow' | 'pen' | 'highlighter' | 'text' | null;

const COLOR_SWATCHES = [
  '#fde047', '#facc15', '#f59e0b', '#fb923c', '#ea580c',
  '#84cc16', '#22c55e', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#ec4899',
  '#f43f5e', '#ef4444', '#18181b', '#ffffff'
];

const HudApp: React.FC = () => {
  const [seconds, setSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [showAnnotations, setShowAnnotations] = useState(false);
  const [selectedTool, setSelectedTool] = useState<AnnotationTool>('pen');
  const [selectedColor, setSelectedColor] = useState('#ef4444');
  const [strokeWidth, setStrokeWidth] = useState<number>(3);
  const [simulatedAudio, setSimulatedAudio] = useState([40, 75, 55, 90, 60, 80]);

  // Timer increment
  useEffect(() => {
    let interval: any = null;
    if (!isPaused && !isStopping) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPaused, isStopping]);

  // Audio animation
  useEffect(() => {
    let animInterval: any = null;
    if (!isPaused && !isStopping) {
      animInterval = setInterval(() => {
        setSimulatedAudio([
          20 + Math.random() * 80,
          30 + Math.random() * 70,
          40 + Math.random() * 60,
          25 + Math.random() * 75,
          35 + Math.random() * 65,
          50 + Math.random() * 50
        ]);
      }, 120);
    }
    return () => {
      if (animInterval) clearInterval(animInterval);
    };
  }, [isPaused, isStopping]);

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTogglePause = async () => {
    if (isPaused) {
      await window.electronAPI.resumeRecording();
      setIsPaused(false);
    } else {
      await window.electronAPI.pauseRecording();
      setIsPaused(true);
    }
  };

  const handleStop = async () => {
    setIsStopping(true);
    try {
      await window.electronAPI.stopRecording();
    } catch (err) {
      console.error('Failed to stop recording from HUD:', err);
    }
  };

  const toggleWebcam = () => {
    window.electronAPI.toggleWebcamOverlay(true);
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-start p-2 bg-transparent select-none">
      {/* ShowMore-Style Main HUD Capsule */}
      <div className="bg-white/95 text-slate-800 rounded-2xl px-4 py-2.5 flex items-center gap-3.5 shadow-2xl border border-slate-200/80 backdrop-blur-xl">
        {/* Grip Handle */}
        <div className="app-draggable cursor-move text-slate-400 hover:text-slate-600 transition p-1">
          <GripHorizontal className="w-4 h-4" />
        </div>

        {/* Circular Blue Pause / Resume Button */}
        <button
          onClick={handleTogglePause}
          className="w-10 h-10 rounded-full border-2 border-sky-400 bg-sky-50 hover:bg-sky-100 flex items-center justify-center text-sky-500 hover:text-sky-600 shadow-sm transition active:scale-95 app-no-drag"
          title={isPaused ? 'Resume' : 'Pause'}
        >
          {isPaused ? (
            <div className="w-0 h-0 border-y-[6px] border-y-transparent border-l-[10px] border-l-sky-500 ml-0.5" />
          ) : (
            <div className="flex gap-1">
              <div className="w-1 h-3.5 bg-sky-500 rounded-sm" />
              <div className="w-1 h-3.5 bg-sky-500 rounded-sm" />
            </div>
          )}
        </button>

        {/* Status & Timer Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1 flex flex-col justify-center min-w-[105px] app-no-drag">
          <span className="text-[10px] font-semibold text-slate-500 leading-tight">
            {isPaused ? 'Paused' : 'Recording...'}
          </span>
          <span className="text-sm font-mono font-bold tracking-tight text-slate-800 leading-none mt-0.5">
            {formatTime(seconds)}
          </span>
        </div>

        {/* Live Audio Equalizer Waveform */}
        <div className="flex items-end gap-0.5 h-6 px-1 app-no-drag" title="Audio Activity">
          {simulatedAudio.map((lvl, i) => (
            <div
              key={i}
              className="w-1 bg-rose-500 rounded-full transition-all duration-100"
              style={{ height: `${isPaused ? 4 : Math.max(4, lvl * 0.22)}px` }}
            />
          ))}
        </div>

        {/* Audio Wedge Indicator */}
        <div className="w-10 h-3 flex items-end app-no-drag" title="Volume">
          <div className="w-full h-1 bg-rose-200 rounded-full overflow-hidden flex items-center">
            <div className="w-3/4 h-full bg-rose-500" />
          </div>
        </div>

        {/* Webcam Icon */}
        <button
          onClick={toggleWebcam}
          className="p-2 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-slate-100 transition app-no-drag"
          title="Toggle Webcam Overlay"
        >
          <Camera className="w-5 h-5" />
        </button>

        {/* Red Pencil Annotation Trigger */}
        <button
          onClick={() => setShowAnnotations(!showAnnotations)}
          className={`p-2 rounded-xl transition app-no-drag ${
            showAnnotations
              ? 'bg-rose-50 text-rose-600 shadow-inner'
              : 'text-rose-500 hover:bg-rose-50 hover:text-rose-600'
          }`}
          title="Drawing Tools"
        >
          <Edit3 className="w-5 h-5" />
        </button>

        {/* Red Stop / Done Button */}
        <button
          onClick={handleStop}
          disabled={isStopping}
          className="p-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white transition shadow-md shadow-rose-500/20 app-no-drag active:scale-95"
          title="Stop & Save Recording"
        >
          <Square className="w-4 h-4 fill-current" />
        </button>
      </div>

      {/* ShowMore-Style Attached Annotation Drawer */}
      {showAnnotations && (
        <div className="mt-2 bg-white text-slate-800 rounded-2xl p-3 shadow-2xl border border-slate-200/90 flex flex-col gap-2.5 animate-in slide-in-from-top-2 duration-150 app-no-drag max-w-[480px]">
          {/* Tool Icons Row */}
          <div className="flex items-center justify-between gap-1 pb-1.5 border-b border-slate-100">
            {[
              { id: 'rect', icon: RectIcon, label: 'Rectangle' },
              { id: 'circle', icon: CircleIcon, label: 'Circle / Oval' },
              { id: 'line', icon: Minus, label: 'Line' },
              { id: 'arrow', icon: MoveUpRight, label: 'Arrow' },
              { id: 'pen', icon: PenTool, label: 'Pen / Brush' },
              { id: 'highlighter', icon: Highlighter, label: 'Highlighter' },
              { id: 'text', icon: Type, label: 'Text' }
            ].map((tool) => {
              const Icon = tool.icon;
              const active = selectedTool === tool.id;
              return (
                <button
                  key={tool.id}
                  onClick={() => setSelectedTool(tool.id as AnnotationTool)}
                  className={`p-1.5 rounded-lg text-slate-600 hover:text-slate-900 transition ${
                    active ? 'bg-indigo-100 text-indigo-600 font-bold' : 'hover:bg-slate-100'
                  }`}
                  title={tool.label}
                >
                  <Icon className="w-4 h-4" />
                </button>
              );
            })}

            <div className="w-[1px] h-4 bg-slate-200 mx-1" />

            <button
              onClick={() => {}}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
              title="Undo"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => {}}
              className="p-1.5 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition"
              title="Clear All Annotations"
            >
              <Eraser className="w-4 h-4" />
            </button>
          </div>

          {/* Stroke Width & Color Swatches Row */}
          <div className="flex items-center gap-3">
            {/* Stroke Dots */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg">
              {[
                { size: 2, dotClass: 'w-1.5 h-1.5' },
                { size: 4, dotClass: 'w-2.5 h-2.5' },
                { size: 6, dotClass: 'w-3.5 h-3.5' }
              ].map((s) => (
                <button
                  key={s.size}
                  onClick={() => setStrokeWidth(s.size)}
                  className={`w-6 h-6 rounded flex items-center justify-center transition ${
                    strokeWidth === s.size ? 'bg-white shadow-sm ring-1 ring-slate-300' : 'hover:bg-slate-200'
                  }`}
                >
                  <div className={`${s.dotClass} rounded-full bg-slate-800`} />
                </button>
              ))}
            </div>

            {/* Color Swatches Grid */}
            <div className="flex items-center gap-1 flex-wrap flex-1">
              {COLOR_SWATCHES.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  style={{ backgroundColor: color }}
                  className={`w-4 h-4 rounded-sm transition border ${
                    selectedColor === color
                      ? 'ring-2 ring-indigo-500 scale-110 border-white'
                      : 'border-slate-300 hover:scale-105'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('hud-root') as HTMLElement);
root.render(
  <React.StrictMode>
    <HudApp />
  </React.StrictMode>
);
