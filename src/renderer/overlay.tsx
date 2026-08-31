import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import {
  Square,
  Pause,
  Play,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Camera,
  Settings,
  Film,
  Maximize2,
  Minimize2,
  X,
  Move,
  GripHorizontal,
  Minus
} from 'lucide-react';
import { useMediaRecording } from './hooks/useMediaRecording';
import { RecorderSettings, RegionBounds, RecordingItem } from '../shared/types';
import './index.css';

const OverlayApp: React.FC = () => {
  const [settings, setSettings] = useState<RecorderSettings>({
    outputPath: '',
    framerate: 60,
    resolution: '1080p',
    encoder: 'auto',
    captureMicrophone: true,
    captureSystemAudio: true,
    showWebcam: false,
    hardwareAcceleration: true,
    countdownSeconds: 0,
    highlightClicks: false
  });

  // Default recording frame centered on screen
  const [bounds, setBounds] = useState<RegionBounds>(() => {
    const w = Math.min(1280, Math.round(window.innerWidth * 0.8));
    const h = Math.min(720, Math.round(window.innerHeight * 0.75));
    const x = Math.round((window.innerWidth - w) / 2);
    const y = Math.round((window.innerHeight - h) / 2);
    return { x, y, width: w, height: h };
  });

  const [isResizing, setIsResizing] = useState<string | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [lastSaved, setLastSaved] = useState<RecordingItem | null>(null);

  const dragStartPos = useRef<{ mouseX: number; mouseY: number; startBounds: RegionBounds }>({
    mouseX: 0,
    mouseY: 0,
    startBounds: { x: 0, y: 0, width: 0, height: 0 }
  });

  const {
    isRecording,
    isPaused,
    recordingDuration,
    micLevel,
    isClipping,
    preWarmCapturePipeline,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording
  } = useMediaRecording();

  // Load settings & pre-warm capture engine on launch
  useEffect(() => {
    window.electronAPI.getSettings().then((s) => {
      setSettings(s);
      preWarmCapturePipeline(s);
    });

    const unsubscribe = window.electronAPI.onRecordingCompleted((item) => {
      if (item) {
        setLastSaved(item);
        setIsStopping(false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [preWarmCapturePipeline]);

  // Format MM:SS or HH:MM:SS
  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Drag & Move Handlers
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

      if (isResizing.includes('r')) newW = Math.max(160, sb.width + dx);
      if (isResizing.includes('b')) newH = Math.max(120, sb.height + dy);
      if (isResizing.includes('l')) {
        const potentialW = sb.width - dx;
        if (potentialW > 160) {
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

  // Full Screen toggle
  const handleToggleFullScreen = () => {
    if (bounds.width >= window.innerWidth && bounds.height >= window.innerHeight) {
      // Restore default frame
      const w = Math.min(1280, Math.round(window.innerWidth * 0.8));
      const h = Math.min(720, Math.round(window.innerHeight * 0.75));
      setBounds({
        x: Math.round((window.innerWidth - w) / 2),
        y: Math.round((window.innerHeight - h) / 2),
        width: w,
        height: h
      });
    } else {
      setBounds({
        x: 0,
        y: 0,
        width: window.innerWidth,
        height: window.innerHeight
      });
    }
  };

  // Instant Record Trigger
  const handleStartRecord = async () => {
    try {
      await startRecording(settings, bounds);
    } catch (err) {
      console.error('Failed to start recording:', err);
    }
  };

  const handleTogglePause = async () => {
    if (isPaused) {
      await resumeRecording();
    } else {
      await pauseRecording();
    }
  };

  const handleStopRecord = async () => {
    setIsStopping(true);
    try {
      await stopRecording();
    } catch (err) {
      console.error('Failed to stop recording:', err);
      setIsStopping(false);
    }
  };

  const toggleMic = async () => {
    const updated = { ...settings, captureMicrophone: !settings.captureMicrophone };
    setSettings(updated);
    await window.electronAPI.saveSettings(updated);
    preWarmCapturePipeline(updated);
  };

  const toggleSystemAudio = async () => {
    const updated = { ...settings, captureSystemAudio: !settings.captureSystemAudio };
    setSettings(updated);
    await window.electronAPI.saveSettings(updated);
    preWarmCapturePipeline(updated);
  };

  const toggleWebcam = () => {
    const nextVal = !settings.showWebcam;
    setSettings((prev) => ({ ...prev, showWebcam: nextVal }));
    window.electronAPI.toggleWebcamOverlay(nextVal);
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className="w-screen h-screen relative bg-transparent select-none overflow-hidden"
    >
      {/* ShowMore-Style Red Dashed Recording Frame */}
      <div
        style={{
          left: bounds.x,
          top: bounds.y,
          width: bounds.width,
          height: bounds.height
        }}
        className={`absolute border-2 border-dashed ${
          isRecording ? 'border-rose-500 shadow-[0_0_0_9999px_rgba(0,0,0,0.25)]' : 'border-rose-500/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.15)]'
        } bg-transparent`}
      >
        {/* Center Drag Grip (Active when not recording) */}
        {!isRecording && (
          <div
            onMouseDown={handleMouseDownMove}
            className="absolute inset-0 flex items-center justify-center cursor-move group opacity-0 hover:opacity-100 transition-opacity bg-black/5"
          >
            <div className="px-3.5 py-2 rounded-2xl bg-black/80 backdrop-blur-md text-white text-xs font-bold flex items-center gap-2 shadow-2xl pointer-events-none border border-white/10">
              <Move className="w-4 h-4 text-rose-400" />
              <span>Drag to Move Recording Frame</span>
            </div>
          </div>
        )}

        {/* 8 Resize Handles */}
        {!isRecording && (
          <>
            <div
              onMouseDown={(e) => handleMouseDownResize('tl', e)}
              className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-rose-500 border-2 border-white rounded-sm cursor-nwse-resize shadow-md"
            />
            <div
              onMouseDown={(e) => handleMouseDownResize('t', e)}
              className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-rose-500 border-2 border-white rounded-sm cursor-ns-resize shadow-md"
            />
            <div
              onMouseDown={(e) => handleMouseDownResize('tr', e)}
              className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-rose-500 border-2 border-white rounded-sm cursor-nesw-resize shadow-md"
            />
            <div
              onMouseDown={(e) => handleMouseDownResize('r', e)}
              className="absolute top-1/2 -translate-y-1/2 -right-1.5 w-3.5 h-3.5 bg-rose-500 border-2 border-white rounded-sm cursor-ew-resize shadow-md"
            />
            <div
              onMouseDown={(e) => handleMouseDownResize('br', e)}
              className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-rose-500 border-2 border-white rounded-sm cursor-nwse-resize shadow-md"
            />
            <div
              onMouseDown={(e) => handleMouseDownResize('b', e)}
              className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-rose-500 border-2 border-white rounded-sm cursor-ns-resize shadow-md"
            />
            <div
              onMouseDown={(e) => handleMouseDownResize('bl', e)}
              className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-rose-500 border-2 border-white rounded-sm cursor-nesw-resize shadow-md"
            />
            <div
              onMouseDown={(e) => handleMouseDownResize('l', e)}
              className="absolute top-1/2 -translate-y-1/2 -left-1.5 w-3.5 h-3.5 bg-rose-500 border-2 border-white rounded-sm cursor-ew-resize shadow-md"
            />
          </>
        )}

        {/* Dimension & Status Tag */}
        <div className="absolute -top-8 left-0 flex items-center gap-2">
          <div className="px-2.5 py-1 bg-slate-900/90 text-slate-200 border border-white/10 rounded-lg text-[11px] font-mono font-bold shadow-lg backdrop-blur-md flex items-center gap-1.5">
            <span className="text-rose-400 font-extrabold">RECO</span>
            <span>•</span>
            <span>{bounds.width} × {bounds.height}</span>
          </div>
        </div>

        {/* Minimal Attached Floating Control Capsule */}
        <div
          onMouseDown={(e) => e.stopPropagation()}
          className="absolute -bottom-14 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-slate-950/95 text-slate-100 p-2 px-4 rounded-2xl shadow-2xl border border-white/15 backdrop-blur-xl shrink-0"
        >
          {/* Drag Handle */}
          <div
            onMouseDown={handleMouseDownMove}
            className="cursor-move text-slate-500 hover:text-slate-300 p-1"
            title="Move Frame"
          >
            <GripHorizontal className="w-4 h-4" />
          </div>

          {/* Status Indicator */}
          <div className="flex items-center gap-2 pr-2 border-r border-white/10">
            {isStopping ? (
              <span className="text-xs font-bold text-amber-400 animate-pulse">Saving...</span>
            ) : isRecording ? (
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${isPaused ? 'bg-amber-400' : 'bg-rose-500 animate-ping'}`} />
                <span className="text-sm font-mono font-extrabold tracking-wider text-white">
                  {formatTime(recordingDuration)}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
                <span className="text-xs font-bold text-slate-300">Ready</span>
              </div>
            )}
          </div>

          {/* Record / Pause / Stop Actions */}
          <div className="flex items-center gap-2">
            {!isRecording ? (
              <button
                onClick={handleStartRecord}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-rose-600 hover:from-rose-500 hover:to-rose-400 text-white text-xs font-extrabold shadow-lg shadow-rose-600/40 hover:shadow-rose-600/60 transition-all transform hover:scale-[1.03] active:scale-[0.97] animate-record-pulse"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                <span>REC</span>
              </button>
            ) : (
              <>
                <button
                  onClick={handleTogglePause}
                  className={`p-2 rounded-xl border transition ${
                    isPaused
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                  title={isPaused ? 'Resume' : 'Pause'}
                >
                  {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4" />}
                </button>

                <button
                  onClick={handleStopRecord}
                  disabled={isStopping}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold transition shadow-lg shadow-rose-600/30 active:scale-95"
                  title="Stop & Save Recording"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Done</span>
                </button>
              </>
            )}
          </div>

          {/* Audio Toggles & Live Meter */}
          <div className="flex items-center gap-2 pl-2 border-l border-white/10">
            {/* Mic Toggle + Meter */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={toggleMic}
                className={`p-2 rounded-xl border transition ${
                  settings.captureMicrophone
                    ? 'bg-slate-800/80 border-emerald-500/30 text-emerald-400'
                    : 'bg-slate-900/60 border-white/5 text-slate-500 hover:text-slate-400'
                }`}
                title={settings.captureMicrophone ? 'Microphone On' : 'Microphone Muted'}
              >
                {settings.captureMicrophone ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              </button>

              {settings.captureMicrophone && (
                <div className="w-10 h-2 bg-slate-800 rounded-full overflow-hidden flex items-center p-0.5 border border-white/5">
                  <div
                    className={`h-full rounded-full transition-all duration-75 ${
                      isClipping ? 'bg-rose-500' : micLevel > 70 ? 'bg-amber-400' : 'bg-emerald-400'
                    }`}
                    style={{ width: `${Math.max(4, Math.min(100, micLevel))}%` }}
                  />
                </div>
              )}
            </div>

            {/* System Audio Toggle */}
            <button
              onClick={toggleSystemAudio}
              className={`p-2 rounded-xl border transition ${
                settings.captureSystemAudio
                  ? 'bg-slate-800/80 border-indigo-500/30 text-indigo-400'
                  : 'bg-slate-900/60 border-white/5 text-slate-500 hover:text-slate-400'
              }`}
              title={settings.captureSystemAudio ? 'System Audio On' : 'System Audio Muted'}
            >
              {settings.captureSystemAudio ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Webcam Toggle */}
            <button
              onClick={toggleWebcam}
              className={`p-2 rounded-xl border transition ${
                settings.showWebcam
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-900/60 border-white/5 text-slate-400 hover:text-slate-200'
              }`}
              title="Toggle Webcam Picture-in-Picture"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          {/* Secondary Actions */}
          <div className="flex items-center gap-1 pl-2 border-l border-white/10">
            {/* Fullscreen Frame */}
            <button
              onClick={handleToggleFullScreen}
              className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition"
              title="Toggle Fullscreen Recording Frame"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            {/* Open Library */}
            <button
              onClick={() => window.electronAPI.openDashboard('library')}
              className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition"
              title="Recordings History"
            >
              <Film className="w-4 h-4" />
            </button>

            {/* Settings */}
            <button
              onClick={() => window.electronAPI.openDashboard('settings')}
              className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Minimize / Close */}
            <button
              onClick={() => window.electronAPI.minimizeApp()}
              className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition"
              title="Minimize"
            >
              <Minus className="w-4 h-4" />
            </button>

            <button
              onClick={() => window.electronAPI.quitApp()}
              className="p-2 rounded-xl hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
              title="Exit Reco"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('overlay-root') as HTMLElement);
root.render(
  <React.StrictMode>
    <OverlayApp />
  </React.StrictMode>
);
